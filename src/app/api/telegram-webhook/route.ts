import { NextResponse } from 'next/server';
import { db } from '@/lib/firebase';
import { sendMessageToAda } from '@/app/actions/chat';

/**
 * Public Telegram webhook listener to receive buyer messages, resolve merchant parameters,
 * process conversations via the Ada tool-calling engine, and respond using Telegram Bot API.
 */
export async function POST(request: Request) {
  const token = process.env.TELEGRAM_BOT_TOKEN || '';

  if (!token) {
    // Fail gracefully if token not set in local environment variables
    return NextResponse.json({ ok: true });
  }

  try {
    const update = await request.json();

    if (!update.message || !update.message.chat) {
      return NextResponse.json({ ok: true });
    }

    const chatId = update.message.chat.id;
    const rawText = update.message.text || '';
    const text = rawText.trim();
    const fromUser = update.message.from || {};
    const username = fromUser.username || fromUser.first_name || 'Guest';

    const tgRef = db.collection('telegram_chats').doc(String(chatId));
    const tgSnap = await tgRef.get();

    // A. Handle Bot Init: /start shop_slug
    if (text.startsWith('/start ')) {
      const slug = text.replace('/start ', '').trim().toLowerCase();

      // Resolve Shop by Slug
      const shopsRef = db.collection('shops');
      const shopQuery = await shopsRef.where('slug', '==', slug).limit(1).get();

      if (shopQuery.empty) {
        await sendTelegramMessage(token, chatId, `Welcome! Shop slug "${slug}" was not found. Please check the URL link.`);
        return NextResponse.json({ ok: true });
      }

      const shopDoc = shopQuery.docs[0];
      const shopId = shopDoc.id;
      const shopData = shopDoc.data();

      // Save user chat reference mapping
      await tgRef.set({
        shopId,
        shopSlug: slug,
        buyerHandle: `@${username}`,
        conversationId: `tg_${chatId}`,
        createdAt: new Date().toISOString(),
      });

      // Log subscription trigger on Timeline
      await db.collection('shops').doc(shopId).collection('timeline').add({
        type: 'onboarding',
        summary: `Buyer @${username} initiated chat on Telegram channel`,
        createdAt: new Date().toISOString(),
      });

      const welcomeMsg = `Welcome to ${shopData.name}! I am ${shopData.aiName || 'Ada'}, your virtual assistant. How can I help you today? Feel free to ask about our catalog!`;
      await sendTelegramMessage(token, chatId, welcomeMsg);
      return NextResponse.json({ ok: true });
    }

    // B. Handle Dialogue Exchange
    if (!tgSnap.exists) {
      const infoMsg = `Hello! To start chatting with an AI store operator, please click a vendor's custom shop link (e.g. t.me/YourBot?start=shop_slug).`;
      await sendTelegramMessage(token, chatId, infoMsg);
      return NextResponse.json({ ok: true });
    }

    const tgData = tgSnap.data();
    if (!tgData || !tgData.shopSlug) {
      return NextResponse.json({ ok: true });
    }

    // Invoke unified chatbot logic
    const res = await sendMessageToAda({
      conversationId: tgData.conversationId,
      messageText: text,
      buyerHandle: tgData.buyerHandle,
      shopSlug: tgData.shopSlug,
    });

    if (res.success && res.reply) {
      await sendTelegramMessage(token, chatId, res.reply);
    } else {
      await sendTelegramMessage(token, chatId, "I'm having a small connection difficulty. Let me try again shortly.");
    }

    return NextResponse.json({ ok: true });

  } catch (error) {
    // Fail gracefully with OK response so Telegram webhook does not retry loops indefinitely
    return NextResponse.json({ ok: true });
  }
}

/**
 * Dispatches outgoing message request to Telegram Bot API.
 */
async function sendTelegramMessage(token: string, chatId: number, text: string) {
  const url = `https://api.telegram.org/bot${token}/sendMessage`;

  try {
    await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        chat_id: chatId,
        text: text,
      }),
    });
  } catch {
    // Fail silently in telemetry
  }
}
