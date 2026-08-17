'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { loginVendor, checkSession } from '@/app/actions/auth';
import Link from 'next/link';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  useEffect(() => {
    async function checkActiveSession() {
      try {
        const res = await checkSession();
        if (res.loggedIn) {
          router.push('/dashboard');
        }
      } catch (err) {
        // fail silently
      }
    }
    checkActiveSession();
  }, [router]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(false);

    if (!email || !password) {
      setError('Please fill in both fields.');
      return;
    }

    setLoading(true);

    try {
      const res = await loginVendor(email, password);
      if (res.success) {
        if (res.role === 'creator') {
          router.push('/dashboard'); // Unified switcher inside Control Desk Dashboard
        } else {
          router.push('/dashboard');
        }
      } else {
        setError(res.error || 'Failed to login');
      }
    } catch (err: any) {
      setError(err.message || 'An error occurred');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{
      backgroundImage: `linear-gradient(rgba(242, 241, 238, 0.75), rgba(242, 241, 238, 0.75)), url('/auth_bg.jpg')`,
      backgroundSize: 'cover',
      backgroundPosition: 'center',
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: 'var(--space-md)'
    }} className="fade-in">
      <div style={{
        width: '100%',
        maxWidth: '430px',
        backgroundColor: 'rgba(255, 255, 255, 0.95)',
        backdropFilter: 'blur(8px)',
        border: '1px solid var(--color-hairline)',
        borderRadius: '6px',
        padding: 'var(--space-xl) var(--space-lg)',
        boxShadow: '0 10px 40px rgba(0, 0, 0, 0.05)'
      }}>
        <div style={{ textAlign: 'center', marginBottom: 'var(--space-xl)' }}>
          <h1 style={{ fontSize: '2.75rem', fontFamily: 'var(--font-display)', fontWeight: 400 }}>Cadence</h1>
          <p className="mono-label" style={{ color: 'var(--color-signal)', marginTop: '4px' }}>[ Sign In to Control Desk ]</p>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-md)' }}>
          
          {/* Email input */}
          <div className="form-group">
            <label className="form-label" htmlFor="email">Shop Email</label>
            <input
              id="email"
              type="email"
              className="form-input"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="e.g. chidi@curatedwear.com"
              required
              disabled={loading}
            />
          </div>

          {/* Password Input with eye toggle */}
          <div className="form-group" style={{ position: 'relative' }}>
            <label className="form-label" htmlFor="password">Password / PIN</label>
            <div style={{ position: 'relative', width: '100%' }}>
              <input
                id="password"
                type={showPassword ? 'text' : 'password'}
                className="form-input"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your security password"
                required
                disabled={loading}
                style={{ width: '100%', paddingRight: '40px' }}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                style={{
                  position: 'absolute',
                  right: '10px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  cursor: 'pointer',
                  fontSize: '1rem',
                  opacity: 0.5,
                  padding: '4px'
                }}
              >
                {showPassword ? '👁️' : '🙈'}
              </button>
            </div>
          </div>

          {/* Error Banner */}
          {error && (
            <div style={{
              backgroundColor: 'rgba(244,67,54,0.06)',
              borderLeft: '2px solid red',
              padding: '10px 12px',
              fontSize: '0.85rem',
              color: '#F44336',
              lineHeight: '1.45'
            }}>
              {error}
            </div>
          )}

          {/* Submit button */}
          <button
            type="submit"
            className="btn-primary"
            style={{ width: '100%', justifyContent: 'center', padding: '0.8rem', fontSize: '0.95rem' }}
            disabled={loading}
          >
            {loading ? 'Authenticating...' : 'Sign In to Control Desk'}
          </button>
        </form>

        <div style={{
          marginTop: 'var(--space-xl)',
          textAlign: 'center',
          fontSize: '0.85rem',
          borderTop: '1px solid var(--color-hairline)',
          paddingTop: 'var(--space-md)'
        }}>
          <p style={{ color: 'var(--color-graphite)' }}>
            New to Cadence? <Link href="/onboarding" style={{ color: 'var(--color-signal)', fontWeight: '600' }}>Create Account & Onboard</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
