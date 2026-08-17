import { db } from '@/lib/firebase';
import { notFound } from 'next/navigation';
import BuyerChatContainer from './BuyerChatContainer';

interface PageProps {
  params: Promise<{ slug: string }>;
}

export default async function ShopPage({ params }: PageProps) {
  const { slug } = await params;

  try {
    // 1. Resolve Shop from Slug
    const shopsRef = db.collection('shops');
    const shopQuery = await shopsRef.where('slug', '==', slug).limit(1).get();

    if (shopQuery.empty) {
      notFound();
    }

    const shopDoc = shopQuery.docs[0];
    const shopId = shopDoc.id;
    const shopData = shopDoc.data();

    // 2. Fetch Catalog Products
    const productsQuery = await db.collection('products')
      .where('shopId', '==', shopId)
      .get();

    const products: any[] = [];
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

    // Sort in memory by createdAt descending
    products.sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());

    return (
      <BuyerChatContainer
        shop={{
          id: shopId,
          name: shopData.name,
          slug: shopData.slug,
          category: shopData.category,
          aiName: shopData.aiName,
          aiTone: shopData.aiTone,
          payoutBankName: shopData.payoutBankName,
          payoutAccountNumber: shopData.payoutAccountNumber,
          payoutAccountName: shopData.payoutAccountName,
        }}
        products={products}
      />
    );

  } catch (error: any) {
    // Styled graceful fallback banner when Firestore credentials are not present locally
    const isCredentialsError = String(error.message).includes('Project Id') || String(error.message).includes('credential');
    
    return (
      <div style={{
        padding: '3rem var(--space-md)',
        textAlign: 'center',
        backgroundColor: '#F2F1EE', // Paper theme
        color: '#131313',
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontFamily: 'var(--font-body)'
      }}>
        <div style={{
          maxWidth: '480px',
          padding: '2.5rem 2rem',
          backgroundColor: '#FFFFFF',
          border: '1px solid var(--color-hairline)',
          borderRadius: '6px',
          boxShadow: '0 8px 30px rgba(0,0,0,0.02)'
        }}>
          <span className="mono-label" style={{ color: 'red', fontWeight: 600 }}>[ Database Offline ]</span>
          <h2 style={{ fontSize: '1.75rem', marginTop: '10px', fontWeight: 500, fontFamily: 'var(--font-display)' }}>
            Database Config Missing
          </h2>
          <p style={{ color: 'var(--color-graphite)', fontSize: '0.875rem', lineHeight: '1.5', margin: '12px 0 20px 0' }}>
            {isCredentialsError 
              ? 'Cadence is unable to resolve merchant shops because Google Cloud / Firebase credentials are not set in the local environment.'
              : `Firestore connection error: ${error.message || String(error)}`
            }
          </p>
          <div style={{
            backgroundColor: '#F9F9F9',
            border: '1px solid #E4E3DE',
            padding: '12px',
            borderRadius: '4px',
            textAlign: 'left',
            fontFamily: 'var(--font-mono)',
            fontSize: '0.75rem',
            lineHeight: '1.4'
          }}>
            <strong>Diagnostics Keys:</strong><br />
            • GOOGLE_APPLICATION_CREDENTIALS<br />
            • FIREBASE_PROJECT_ID
          </div>
        </div>
      </div>
    );
  }
}
