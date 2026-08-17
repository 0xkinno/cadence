'use server';

import { db } from '@/lib/firebase';
import { getSession, setSession } from '@/lib/session';

interface OnboardingInput {
  shopName: string;
  category: string;
  payoutBankName: string;
  payoutAccountNumber: string;
  payoutAccountName: string;
  aiName: string;
  aiTone: string;
}

/**
 * Onboard a shop for an authenticated vendor user.
 * Creates Firestore shop records, registers milestones, and updates signed session cookies.
 */
export async function onboardVendor(input: OnboardingInput) {
  const {
    shopName,
    category,
    payoutBankName,
    payoutAccountNumber,
    payoutAccountName,
    aiName,
    aiTone,
  } = input;

  if (!shopName || !payoutBankName || !payoutAccountNumber) {
    return { success: false, error: 'Please fill in all required shop and payment details.' };
  }

  try {
    // 1. Resolve logged-in vendor user session
    const session = await getSession();
    if (!session || !session.userId) {
      return { success: false, error: 'Please sign up and verify your account first.' };
    }

    const { userId, email } = session;

    // Check if user already owns a shop
    const shopsRef = db.collection('shops');
    const existingUserShop = await shopsRef.where('ownerId', '==', userId).limit(1).get();
    
    if (!existingUserShop.empty) {
      return {
        success: true,
        shopId: existingUserShop.docs[0].id,
        shopSlug: existingUserShop.docs[0].data().slug,
      };
    }

    // 2. Generate unique URL slug from shop name
    let slug = shopName
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9\s-]/g, '') // remove symbols
      .replace(/\s+/g, '-')         // replace spaces with hyphens
      .replace(/-+/g, '-');         // collapse double hyphens

    if (!slug) {
      slug = 'my-shop';
    }

    const existingSlugShop = await shopsRef.where('slug', '==', slug).limit(1).get();
    
    // Handle slug collision
    if (!existingSlugShop.empty) {
      slug = `${slug}-${Math.floor(1000 + Math.random() * 9000)}`;
    }

    // 3. Create Shop Document
    const shopDocRef = await shopsRef.add({
      ownerId: userId,
      email: email, // Associate email from user registration
      name: shopName,
      slug,
      category,
      aiName: aiName || 'Ada',
      aiTone: aiTone || 'helpful and professional',
      payoutBankName,
      payoutAccountNumber,
      payoutAccountName: payoutAccountName || shopName,
      plan: 'free_trial',
      trialEndsAt: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
      createdAt: new Date().toISOString(),
    });
    const shopId = shopDocRef.id;

    // 4. Log System Onboarding Event in Timeline
    await db.collection('shops').doc(shopId).collection('timeline').add({
      type: 'onboarding',
      summary: `Shop onboarding completed. AI sales assistant ${aiName || 'Ada'} deployed.`,
      createdAt: new Date().toISOString(),
    });

    // 5. Update Session Cookie with Shop context
    await setSession({
      userId,
      role: 'vendor',
      email,
      shopId,
      shopSlug: slug,
    });

    return {
      success: true,
      shopId,
      shopSlug: slug,
    };
  } catch (error: any) {
    return {
      success: false,
      error: `Onboarding Error: ${error.message || String(error)}`,
    };
  }
}
