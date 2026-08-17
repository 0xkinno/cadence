import fs from 'fs';
import path from 'path';
import { db } from '@/lib/firebase';
import BuyerChatContainer from './BuyerChatContainer';

interface PageProps {
  params: Promise<{ slug: string }>;
}

export default async function ShopPage({ params }: PageProps) {
  const { slug } = await params;

  let shopId = 'JAmIvLyPECvSm2Au2Amg';
  let shopData: any = null;
  let products: any[] = [];

  try {
    // 1. Attempt Firestore Resolve
    const shopsRef = db.collection('shops');
    const shopQuery = await shopsRef.where('slug', '==', slug).limit(1).get();

    if (!shopQuery.empty) {
      const shopDoc = shopQuery.docs[0];
      shopId = shopDoc.id;
      shopData = shopDoc.data();

      // 2. Fetch Catalog Products via Firestore
      const productsQuery = await db.collection('products')
        .where('shopId', '==', shopId)
        .get();

      productsQuery.forEach(doc => {
        products.push({
          id: doc.id,
          name: doc.data().name,
          priceNgn: doc.data().priceNgn,
          description: doc.data().description,
          inStock: doc.data().inStock,
          imageUrl: doc.data().imageUrl,
          createdAt: doc.data().createdAt,
        });
      });
    }
  } catch (error: any) {
    console.warn("Firestore shop fetch warning (e.g. quota limit), using local dataset fallback:", error?.message || error);
  }

  // Graceful Fallback to local-data.json if Firestore fails or returned empty due to Quota Limit
  if (!shopData || products.length === 0) {
    let localDataStore: any = null;
    try {
      const p1 = path.join(process.cwd(), 'For-gitignore', 'scripts', 'local-data.json');
      const p2 = path.join(process.cwd(), 'scripts', 'local-data.json');
      const jsonPath = fs.existsSync(p1) ? p1 : p2;
      if (fs.existsSync(jsonPath)) {
        localDataStore = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));
      }
    } catch (e) {
      console.error("Local data JSON read error:", e);
    }

    shopData = shopData || {
      name: 'Cadence Curated Shop',
      slug: slug || 'kingsley',
      category: 'Fashion',
      aiName: 'Ada',
      aiTone: 'helpful and professional',
      payoutBankName: 'Wema Bank',
      payoutAccountNumber: '9923847118',
      payoutAccountName: 'Cadence Technologies'
    };

    if (products.length === 0 && localDataStore?.products) {
      products = localDataStore.products.map((p: any) => ({
        id: p.id,
        name: p.name,
        priceNgn: p.priceNgn,
        description: p.description,
        inStock: p.inStock,
        imageUrl: p.imageUrl,
        createdAt: p.createdAt,
      }));
    }
  }

  // Sort in memory by createdAt descending
  products.sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());

  return (
    <BuyerChatContainer
      shop={{
        id: shopId,
        name: shopData.name,
        slug: shopData.slug || slug,
        category: shopData.category || 'Fashion',
        aiName: shopData.aiName || 'Ada',
        aiTone: shopData.aiTone || 'helpful and professional',
        payoutBankName: shopData.payoutBankName || 'Wema Bank',
        payoutAccountNumber: shopData.payoutAccountNumber || '9923847118',
        payoutAccountName: shopData.payoutAccountName || 'Cadence Technologies',
      }}
      products={products}
    />
  );
}
