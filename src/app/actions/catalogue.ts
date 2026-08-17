'use server';

import { db, getBucket } from '@/lib/firebase';
import { getSession } from '@/lib/session';

/**
 * Register a product in the shop's catalogue.
 * Expects a FormData object containing name, price, description, inStock, and photo.
 */
export async function addProductToCatalogue(formData: FormData) {
  const session = await getSession();
  if (!session || !session.shopId) {
    return { success: false, error: 'Unauthorized: No active shop owner session found.' };
  }

  const name = formData.get('name') as string;
  const priceStr = formData.get('price') as string;
  const description = formData.get('description') as string;
  const inStockStr = formData.get('inStock') as string;
  const photo = formData.get('photo') as File | null;

  if (!name || !priceStr) {
    return { success: false, error: 'Product name and price are required fields.' };
  }

  const priceNgn = parseFloat(priceStr);
  const inStock = parseInt(inStockStr || '10', 10);

  try {
    let imageUrl = '/placeholder-product.png';

    // 1. Upload photo to Google Cloud Storage if present
    if (photo && photo.size > 0) {
      try {
        const bucket = getBucket();
        const buffer = Buffer.from(await photo.arrayBuffer());
        const filename = `${Date.now()}_${photo.name.replace(/[^a-zA-Z0-9.]/g, '_')}`;
        const filePath = `shops/${session.shopId}/products/${filename}`;
        const fileRef = bucket.file(filePath);

        await fileRef.save(buffer, {
          metadata: { contentType: photo.type },
          public: true,
        });

        // Resolve public URL
        imageUrl = `https://storage.googleapis.com/${bucket.name}/${filePath}`;
      } catch (storageError) {
        // Fallback for local sandbox testing without GCS bucket permissions
        imageUrl = 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100" viewBox="0 0 24 24" fill="none" stroke="%23cccccc" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><circle cx="8.5" cy="8.5" r="1.5"></circle><polyline points="21 15 16 10 5 21"></polyline></svg>'; 
      }
    }

    // 2. Write Product Document to Firestore
    const productRef = await db.collection('products').add({
      shopId: session.shopId,
      name,
      priceNgn,
      description: description || '',
      inStock,
      imageUrl,
      createdAt: new Date().toISOString(),
    });

    // 3. Log Event to Shop's Timeline
    await db.collection('shops').doc(session.shopId).collection('timeline').add({
      type: 'catalog',
      summary: `Product "${name}" added to catalogue (₦${priceNgn.toLocaleString()})`,
      createdAt: new Date().toISOString(),
    });

    return {
      success: true,
      productId: productRef.id,
      product: {
        id: productRef.id,
        name,
        priceNgn,
        description,
        inStock,
        imageUrl,
      },
    };
  } catch (error: any) {
    return {
      success: false,
      error: `Catalogue Error: ${error.message || String(error)}`,
    };
  }
}
