'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { addProductToCatalogue } from '@/app/actions/catalogue';

interface Product {
  id: string;
  name: string;
  priceNgn: number;
  description: string;
  inStock: number;
  imageUrl: string;
}

export default function CataloguePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [products, setProducts] = useState<Product[]>([]);

  // Form Fields
  const [name, setName] = useState('');
  const [price, setPrice] = useState('');
  const [description, setDescription] = useState('');
  const [inStock, setInStock] = useState('10');
  const [photo, setPhoto] = useState<File | null>(null);

  // File input change
  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    if (e.target.files && e.target.files.length > 0) {
      setPhoto(e.target.files[0]);
    }
  }

  // Handle product submission
  async function handleAddProduct(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);

    const formData = new FormData();
    formData.append('name', name);
    formData.append('price', price);
    formData.append('description', description);
    formData.append('inStock', inStock);
    if (photo) {
      formData.append('photo', photo);
    }

    try {
      const res = await addProductToCatalogue(formData);
      if (res.success && res.product) {
        setProducts(prev => [...prev, res.product as Product]);
        // Reset form
        setName('');
        setPrice('');
        setDescription('');
        setInStock('10');
        setPhoto(null);
        // Clear file input
        const fileInput = document.getElementById('photo') as HTMLInputElement;
        if (fileInput) fileInput.value = '';
      } else {
        setError(res.error || 'Failed to add product.');
      }
    } catch (err: any) {
      setError(err.message || 'An error occurred.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{
      backgroundColor: 'var(--color-paper)',
      minHeight: '100vh',
      padding: 'var(--space-xl) var(--space-md)'
    }}>
      <div className="container" style={{ maxWidth: '1000px' }}>
        
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: 'var(--space-xl)' }}>
          <h1 style={{ fontSize: '3rem', marginBottom: 'var(--space-xs)' }}>Register Your Products</h1>
          <p className="mono-label">[ STEP 2: BUILD YOUR CATALOGUE ]</p>
        </div>

        <div style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: 'var(--space-lg)',
          alignItems: 'start'
        }}>
          
          {/* Left Column: Form */}
          <div style={{
            backgroundColor: '#FFFFFF',
            border: '1px solid var(--color-hairline)',
            borderRadius: '6px',
            padding: 'var(--space-lg)'
          }}>
            <h2 style={{ fontSize: '1.5rem', marginBottom: 'var(--space-sm)' }}>02. Add Product</h2>
            
            <form onSubmit={handleAddProduct} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-sm)' }}>
              
              <div className="form-group">
                <label className="form-label" htmlFor="name">Product Name</label>
                <input
                  id="name"
                  type="text"
                  className="form-input"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Vintage Linen Shirt"
                  required
                  disabled={loading}
                />
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="price">Price (₦ Naira)</label>
                <input
                  id="price"
                  type="number"
                  min="0"
                  step="0.01"
                  className="form-input"
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  placeholder="e.g. 18500"
                  required
                  disabled={loading}
                />
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="inStock">Initial Stock Level</label>
                <input
                  id="inStock"
                  type="number"
                  min="0"
                  className="form-input"
                  value={inStock}
                  onChange={(e) => setInStock(e.target.value)}
                  placeholder="e.g. 10"
                  required
                  disabled={loading}
                />
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="description">Product Description</label>
                <textarea
                  id="description"
                  className="form-input"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Size guidelines, color options, material..."
                  rows={3}
                  disabled={loading}
                  style={{ resize: 'vertical' }}
                />
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="photo">Product Image</label>
                <input
                  id="photo"
                  type="file"
                  accept="image/*"
                  onChange={handleFileChange}
                  disabled={loading}
                  style={{
                    fontSize: '0.85rem',
                    border: '1px dashed var(--color-hairline)',
                    padding: 'var(--space-xs)',
                    borderRadius: '4px',
                    backgroundColor: 'var(--color-paper)',
                    cursor: 'pointer'
                  }}
                />
              </div>

              {error && (
                <div style={{
                  backgroundColor: 'rgba(255, 0, 0, 0.03)',
                  borderLeft: '2px solid red',
                  padding: '8px 12px',
                  fontSize: '0.85rem',
                  color: 'red',
                  lineHeight: '1.4'
                }}>
                  {error}
                </div>
              )}

              <button
                type="submit"
                className="btn-secondary"
                style={{ width: '100%', justifyContent: 'center' }}
                disabled={loading}
              >
                {loading ? 'Registering item...' : '+ Add to Catalogue'}
              </button>
            </form>
          </div>

          {/* Right Column: Preview & Complete */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-md)' }}>
            
            {/* Added products preview */}
            <div style={{
              backgroundColor: '#FFFFFF',
              border: '1px solid var(--color-hairline)',
              borderRadius: '6px',
              padding: 'var(--space-lg)',
              minHeight: '300px'
            }}>
              <h2 style={{ fontSize: '1.5rem', marginBottom: 'var(--space-sm)' }}>Catalogue Registry ({products.length})</h2>
              
              {products.length === 0 ? (
                <div style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  height: '200px',
                  border: '1px dashed var(--color-hairline)',
                  borderRadius: '4px',
                  color: 'var(--color-graphite)'
                }}>
                  <p style={{ fontSize: '0.9rem' }}>No products registered yet.</p>
                  <p style={{ fontSize: '0.8rem' }}>Add items on the left to see them appear here.</p>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '350px', overflowY: 'auto' }}>
                  {products.map((prod) => (
                    <div key={prod.id} style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '12px',
                      padding: '8px',
                      borderBottom: '1px solid var(--color-hairline)',
                      fontSize: '0.9rem'
                    }}>
                      <div style={{
                        width: '40px',
                        height: '40px',
                        borderRadius: '4px',
                        overflow: 'hidden',
                        backgroundColor: 'var(--color-paper)',
                        flexShrink: 0
                      }}>
                        <img
                          src={prod.imageUrl}
                          alt={prod.name}
                          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                          onError={(e) => {
                            (e.target as HTMLImageElement).src = '/nigerian_vendor.jpg';
                          }}
                        />
                      </div>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontWeight: '600' }}>{prod.name}</div>
                        <div style={{ fontSize: '0.8rem', color: 'var(--color-graphite)' }}>Qty: {prod.inStock}</div>
                      </div>
                      <div style={{ fontWeight: '500', fontFamily: 'var(--font-mono)' }}>
                        ₦{prod.priceNgn.toLocaleString()}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Launch Action */}
            <button
              className="btn-primary"
              style={{
                width: '100%',
                justifyContent: 'center',
                padding: '1rem',
                fontSize: '1.1rem',
                opacity: products.length > 0 ? 1 : 0.6
              }}
              disabled={products.length === 0}
              onClick={() => {
                alert('Onboarding complete! Loading control desk...');
                router.push('/dashboard');
              }}
            >
              Launch Store & Enter Dashboard
            </button>
            {products.length === 0 && (
              <p style={{ fontSize: '0.8rem', color: 'var(--color-graphite)', textAlign: 'center' }}>
                Please add at least one product to open your shop.
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
