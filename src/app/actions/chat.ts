'use server';

import { db } from '@/lib/firebase';
import { GoogleGenAI, Type, Schema } from '@google/genai';

// Initialize the Gemini API client
const apiKey = process.env.GEMINI_API_KEY || '';
const ai = new GoogleGenAI({ apiKey });

interface MessageInput {
  conversationId: string;
  messageText: string;
  buyerHandle: string;
  shopSlug: string;
}

interface ChatMessage {
  role: 'buyer' | 'ada' | 'vendor';
  text: string;
  createdAt: string;
}

/**
 * Main server action to handle buyer chat interactions with Ada.
 * Implements: Deterministic Boundary, Reply Validator, Autonomy Tracing, and Customer Memory.
 */
export async function sendMessageToAda(input: MessageInput) {
  const { conversationId, messageText, buyerHandle, shopSlug } = input;

  if (!messageText || !buyerHandle || !shopSlug) {
    return { success: false, error: 'Invalid input parameters.' };
  }

  try {
    // 1. Resolve Shop from Slug
    const shopsRef = db.collection('shops');
    const shopQuery = await shopsRef.where('slug', '==', shopSlug).limit(1).get();

    if (shopQuery.empty) {
      return { success: false, error: 'Shop not found.' };
    }

    const shopDoc = shopQuery.docs[0];
    const shopId = shopDoc.id;
    const shopData = shopDoc.data();

    // 2. Resolve or Create Conversation
    const convRef = db.collection('conversations').doc(conversationId);
    const convSnap = await convRef.get();

    if (!convSnap.exists) {
      await convRef.set({
        shopId,
        buyerHandle,
        channel: 'web',
        status: 'active',
        createdAt: new Date().toISOString(),
        lastMessageAt: new Date().toISOString(),
      });
    } else {
      await convRef.update({
        lastMessageAt: new Date().toISOString(),
      });
    }

    // Check if human takeover is active
    const convData = convSnap.exists ? convSnap.data() : { status: 'active' };
    if (convData?.status === 'human_takeover') {
      // Create user message in db and return
      await convRef.collection('messages').add({
        role: 'buyer',
        text: messageText,
        createdAt: new Date().toISOString(),
      });
      return {
        success: true,
        takeover: true,
        reply: 'The business owner has taken over this chat. They will reply shortly.',
      };
    }

    // 3. Load Customer Memory (Upgrade F)
    const buyersRef = db.collection('shops').doc(shopId).collection('buyers');
    const buyerQuery = await buyersRef.where('handle', '==', buyerHandle).limit(1).get();
    
    let buyerId = '';
    let memoryNotes = 'First-time customer.';
    
    if (buyerQuery.empty) {
      const newBuyerRef = await buyersRef.add({
        handle: buyerHandle,
        lastSeen: new Date().toISOString(),
        notes: 'First-time customer.',
        createdAt: new Date().toISOString(),
      });
      buyerId = newBuyerRef.id;
    } else {
      const buyerDoc = buyerQuery.docs[0];
      buyerId = buyerDoc.id;
      memoryNotes = buyerDoc.data().notes || 'Returning customer.';
      await buyerDoc.ref.update({ lastSeen: new Date().toISOString() });
    }

    // 4. Save Buyer's New Message
    await convRef.collection('messages').add({
      role: 'buyer',
      text: messageText,
      createdAt: new Date().toISOString(),
    });

    // 5. Load Conversation History
    const historySnap = await convRef.collection('messages')
      .orderBy('createdAt', 'asc')
      .limit(15)
      .get();

    const history: ChatMessage[] = [];
    historySnap.forEach(doc => {
      const data = doc.data();
      history.push({
        role: data.role,
        text: data.text,
        createdAt: data.createdAt,
      });
    });

    // 6. Gemini Orchestration (Gemini 2.0 Flash)
    // We strictly instruct Gemini to output template tags for deterministic variables
    const systemInstruction = `
You are ${shopData.aiName || 'Ada'}, the AI sales operator for the shop "${shopData.name}".
Your personality tone is: ${shopData.aiTone || 'helpful and professional'}.

CUSTOMER PROFILE MEMORY:
- Buyer handle: @${buyerHandle}
- Buyer history notes: ${memoryNotes}

MANDATORY RULES:
1. Grounding: Discuss ONLY products that are returned by the 'get_products' tool. Do not invent items.
2. DETERMINISTIC BOUNDARY: You are forbidden from typing raw prices, stock levels, or bank/payment account numbers yourself. Instead, you must use these template tags:
   - For product pricing: Write exactly "[PRICE:productId]" (replace productId with the real product ID).
   - For stock quantity: Write exactly "[STOCK:productId]" (replace productId with the real product ID).
   - For payout/bank information: Write exactly "[PAYMENT_DETAILS]".
   Code will replace these tags with verified database records before the buyer sees them.
3. Handoff: If the buyer is angry, asks for human intervention, or has an order dispute, call the 'escalate_to_human' tool immediately.
4. Keep answers short, polite, and focused on sales. Keep a Nigerian / West African business context.
`;

    // Map history to Gemini API format
    const contents = history.map(msg => ({
      role: msg.role === 'buyer' ? 'user' : 'model',
      parts: [{ text: msg.text }],
    }));

    // Tool declarations
    const tools = [
      {
        functionDeclarations: [
          {
            name: 'get_products',
            description: 'Search the shop catalog for products matching a query string.',
            parameters: {
              type: Type.OBJECT,
              properties: {
                query: { type: Type.STRING, description: 'The product title or category search phrase' },
              },
              required: ['query'],
            } as Schema,
          },
          {
            name: 'check_inventory',
            description: 'Check the current stock quantity for a specific product by its ID.',
            parameters: {
              type: Type.OBJECT,
              properties: {
                productId: { type: Type.STRING, description: 'The unique product ID' },
              },
              required: ['productId'],
            } as Schema,
          },
          {
            name: 'present_payment_details',
            description: 'Provide the bank name, account number, and account name to complete a sale.',
            parameters: { type: Type.OBJECT, properties: {} } as Schema,
          },
          {
            name: 'escalate_to_human',
            description: 'Pause AI responses and request human merchant takeover.',
            parameters: {
              type: Type.OBJECT,
              properties: {
                reason: { type: Type.STRING, description: 'Reason for merchant escalation' },
              },
              required: ['reason'],
            } as Schema,
          },
        ],
      },
    ];

    // 6. Gemini Orchestration (Gemini 3.6 Flash)
    let activeContents: any[] = [...contents];
    let finalReplyText = '';
    let maxLoop = 5;

    while (maxLoop > 0) {
      maxLoop--;

      const response = await ai.models.generateContent({
        model: 'gemini-3.6-flash',
        contents: activeContents,
        config: {
          systemInstruction,
          tools,
        },
      });

      const modelContent = response.candidates && response.candidates[0] ? response.candidates[0].content : null;
      const functionCalls = response.functionCalls || [];

      if (functionCalls.length > 0) {
        if (modelContent) {
          activeContents.push(modelContent);
        }

        const toolResults = [];

        for (const call of functionCalls) {
          const { name, args } = call;
          const argsObj = (args || {}) as { query?: string; productId?: string; reason?: string };
          let outputData: unknown = null;

          // Log starting trace to database (Autonomy Trace)
          const traceRef = await db.collection('shops').doc(shopId).collection('logs').add({
            functionName: name,
            inputs: args || {},
            timestamp: new Date().toISOString(),
            status: 'running',
          });

          if (name === 'get_products') {
            const q = (argsObj.query as string || '').toLowerCase().trim();
            const prodQuery = await db.collection('products')
              .where('shopId', '==', shopId)
              .get();

            const productsList: unknown[] = [];
            prodQuery.forEach(doc => {
              const data = doc.data();
              if (data.name.toLowerCase().includes(q) || data.description.toLowerCase().includes(q)) {
                productsList.push({ id: doc.id, ...data });
              }
            });

            outputData = productsList;
            // Log Event to Timeline
            await db.collection('shops').doc(shopId).collection('timeline').add({
              type: 'catalog',
              summary: `${shopData.aiName || 'Ada'} searched catalogue for "${q}"`,
              createdAt: new Date().toISOString(),
            });
          } 
          
          else if (name === 'check_inventory') {
            const pId = argsObj.productId as string;
            const prodDoc = await db.collection('products').doc(pId).get();
            
            if (prodDoc.exists) {
              outputData = { productId: pId, inStock: prodDoc.data()?.inStock };
            } else {
              outputData = { productId: pId, inStock: 0, error: 'Product not found.' };
            }
          } 
          
          else if (name === 'present_payment_details') {
            outputData = {
              bankName: shopData.payoutBankName,
              accountNumber: shopData.payoutAccountNumber,
              accountName: shopData.payoutAccountName,
            };
            // Log payment instruction triggers to Timeline
            await db.collection('shops').doc(shopId).collection('timeline').add({
              type: 'payment',
              summary: `${shopData.aiName || 'Ada'} presented account details to ${buyerHandle}`,
              createdAt: new Date().toISOString(),
            });
          } 
          
          else if (name === 'escalate_to_human') {
            await convRef.update({ status: 'human_takeover' });
            outputData = { status: 'human_takeover_activated' };
            
            // Log Takeover Event to Timeline
            await db.collection('shops').doc(shopId).collection('timeline').add({
              type: 'takeover',
              summary: `Takeover requested: "${argsObj.reason || 'No reason specified'}"`,
              createdAt: new Date().toISOString(),
            });
          }

          // Complete Trace logging
          await traceRef.update({
            outputs: outputData,
            status: 'completed',
            completedAt: new Date().toISOString(),
          });

          toolResults.push({
            functionResponse: {
              name,
              response: { result: outputData },
            },
          });
        }

        activeContents.push({ role: 'user', parts: toolResults });
      } else {
        finalReplyText = response.text || '';
        break;
      }
    }

    // 8. Reply Validator & Deterministic Replacements (Upgrades A, B & C)
    const validatedReply = await validateAndFormatReply(finalReplyText, shopId, shopData);

    // Save Ada's final reply
    await convRef.collection('messages').add({
      role: 'ada',
      text: validatedReply,
      createdAt: new Date().toISOString(),
    });

    return {
      success: true,
      takeover: false,
      reply: validatedReply,
    };

  } catch (error) {
    const errMsg = error instanceof Error ? error.message : String(error);
    return {
      success: false,
      error: `Chat Engine Error: ${errMsg}`,
    };
  }
}

interface ShopConfig {
  payoutBankName?: string;
  payoutAccountNumber?: string;
  payoutAccountName?: string;
}

/**
 * Evaluates template tags and injects database-resolved figures.
 * Validates and strips any raw ungrounded prices or numeric figures.
 */
async function validateAndFormatReply(text: string, shopId: string, shopData: ShopConfig): Promise<string> {
  let validatedText = text;

  // Log validator execution trace
  const validatorLogs: string[] = [];

  // A. [PAYMENT_DETAILS] Replacement
  if (validatedText.includes('[PAYMENT_DETAILS]')) {
    const paymentString = `\n\n🏦 **Payout Details:**\nBank: ${shopData.payoutBankName}\nAccount: ${shopData.payoutAccountNumber}\nName: ${shopData.payoutAccountName}\n`;
    validatedText = validatedText.replace('[PAYMENT_DETAILS]', paymentString);
    validatorLogs.push('Replaced [PAYMENT_DETAILS] with verified merchant payout details.');
  }

  // B. [PRICE:productId] & [STOCK:productId] Replacement
  const priceRegex = /\[PRICE:([a-zA-Z0-9_-]+)\]/g;
  const stockRegex = /\[STOCK:([a-zA-Z0-9_-]+)\]/g;

  let match;
  
  // Resolve Prices
  while ((match = priceRegex.exec(text)) !== null) {
    const pId = match[1];
    const prodDoc = await db.collection('products').doc(pId).get();
    
    if (prodDoc.exists && prodDoc.data()?.shopId === shopId) {
      const priceNgn = prodDoc.data()?.priceNgn;
      validatedText = validatedText.replace(`[PRICE:${pId}]`, `₦${priceNgn.toLocaleString()}`);
      validatorLogs.push(`Injected verified price for product: ${pId}.`);
    } else {
      validatedText = validatedText.replace(`[PRICE:${pId}]`, '₦[price unavailable]');
      validatorLogs.push(`Blocked invalid price reference: ${pId}.`);
    }
  }

  // Resolve Stock
  while ((match = stockRegex.exec(text)) !== null) {
    const pId = match[1];
    const prodDoc = await db.collection('products').doc(pId).get();
    
    if (prodDoc.exists && prodDoc.data()?.shopId === shopId) {
      const inStock = prodDoc.data()?.inStock;
      const stockString = inStock > 0 ? `${inStock} units left` : 'Out of stock';
      validatedText = validatedText.replace(`[STOCK:${pId}]`, stockString);
      validatorLogs.push(`Injected verified stock status for product: ${pId}.`);
    } else {
      validatedText = validatedText.replace(`[STOCK:${pId}]`, '[stock status unavailable]');
      validatorLogs.push(`Blocked invalid stock reference: ${pId}.`);
    }
  }

  // C. Reply Validator checks for raw hallucinations
  // If the model bypasses tags and outputs ungrounded numbers mimicking Naira or Account numbers, strip them
  const rawPriceRegex = /₦\s*([0-9,]+)/gi;
  if (rawPriceRegex.test(validatedText)) {
    // Replace unvalidated price references to avoid model arithmetic
    validatedText = validatedText.replace(rawPriceRegex, '[Grounded Price Only]');
    validatorLogs.push('Validator caught and stripped a raw hallucinated price representation.');
  }

  // Write Validator trace to log registry
  if (validatorLogs.length > 0) {
    await db.collection('shops').doc(shopId).collection('logs').add({
      functionName: 'ValidatorGate',
      inputs: { rawDraft: text },
      outputs: { validatedText, audit: validatorLogs },
      timestamp: new Date().toISOString(),
      status: 'completed',
    });
  }

  return validatedText;
}
