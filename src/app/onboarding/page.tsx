'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { sendOtpCode, verifyOtpCode, registerVendor } from '@/app/actions/auth';
import { onboardVendor } from '@/app/actions/onboarding';
import Link from 'next/link';

export default function OnboardingPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Stepper state: 'email' | 'otp' | 'password' | 'profile'
  const [step, setStep] = useState<'email' | 'otp' | 'password' | 'profile'>('email');

  // Account signup state
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // Shop settings state
  const [shopName, setShopName] = useState('');
  const [category, setCategory] = useState('Boutique & Fashion');
  const [payoutBankName, setPayoutBankName] = useState('');
  const [payoutAccountNumber, setPayoutAccountNumber] = useState('');
  const [payoutAccountName, setPayoutAccountName] = useState('');
  const [aiName, setAiName] = useState('Ada');
  const [aiTone, setAiTone] = useState('helpful and professional');

  // 1. Send OTP Action
  async function handleSendOtp(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await sendOtpCode(email);
      if (res.success) {
        setStep('otp');
      } else {
        setError(res.error || 'Failed to dispatch verification code.');
      }
    } catch (err: any) {
      setError(err.message || 'An error occurred.');
    } finally {
      setLoading(false);
    }
  }

  // 2. Verify OTP Action
  async function handleVerifyOtp(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await verifyOtpCode(email, otp);
      if (res.success) {
        setStep('password');
      } else {
        setError(res.error || 'Verification code does not match.');
      }
    } catch (err: any) {
      setError(err.message || 'An error occurred.');
    } finally {
      setLoading(false);
    }
  }

  // 3. Set password and register vendor user
  async function handleRegisterUser(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await registerVendor(email, password);
      if (res.success) {
        // Automatically start user session by logging them in
        const { loginVendor } = await import('@/app/actions/auth');
        const loginRes = await loginVendor(email, password);
        
        if (loginRes.success) {
          setStep('profile');
        } else {
          setError('User registered, but session start failed. Please try signing in.');
        }
      } else {
        setError(res.error || 'Could not register user account.');
      }
    } catch (err: any) {
      setError(err.message || 'An error occurred.');
    } finally {
      setLoading(false);
    }
  }

  // 4. Onboard Shop profile
  async function handleCreateShop(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await onboardVendor({
        shopName,
        category,
        payoutBankName,
        payoutAccountNumber,
        payoutAccountName: payoutAccountName || shopName,
        aiName,
        aiTone,
      });

      if (res.success) {
        router.push('/onboarding/catalogue');
      } else {
        setError(res.error || 'Failed to initialize storefront.');
      }
    } catch (err: any) {
      setError(err.message || 'An error occurred.');
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
    }}>
      <div style={{
        width: '100%',
        maxWidth: step === 'profile' ? '640px' : '430px',
        backgroundColor: 'rgba(255, 255, 255, 0.95)',
        backdropFilter: 'blur(8px)',
        border: '1px solid var(--color-hairline)',
        borderRadius: '6px',
        padding: 'var(--space-xl) var(--space-lg)',
        boxShadow: '0 10px 40px rgba(0, 0, 0, 0.05)',
        transition: 'max-width 0.4s ease'
      }}>
        
        {/* Progress header */}
        <div style={{ textAlign: 'center', marginBottom: 'var(--space-xl)' }}>
          <h1 style={{ fontSize: '2.75rem', fontFamily: 'var(--font-display)', fontWeight: 400 }}>Onboard Store</h1>
          
          <div style={{ display: 'flex', justifyContent: 'center', gap: '8px', marginTop: '6px' }}>
            <span className={`step-badge ${step === 'email' || step === 'otp' ? 'active' : ''}`}>1. Verification</span>
            <span className={`step-badge ${step === 'password' ? 'active' : ''}`}>2. Password</span>
            <span className={`step-badge ${step === 'profile' ? 'active' : ''}`}>3. Store Setup</span>
          </div>
        </div>

        {/* 1. Step: Enter Email */}
        {step === 'email' && (
          <form onSubmit={handleSendOtp} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-md)' }}>
            <p style={{ color: 'var(--color-graphite)', fontSize: '0.875rem', lineHeight: '1.5', textAlign: 'center' }}>
              Create your vendor merchant account. Enter your email to receive a verification OTP code.
            </p>
            
            <div className="form-group">
              <label className="form-label" htmlFor="email">Email Address</label>
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

            {error && <div className="error-banner">{error}</div>}

            <button type="submit" className="btn-primary" style={{ width: '100%', justifyContent: 'center', padding: '0.8rem' }} disabled={loading}>
              {loading ? 'Sending Code...' : 'Send Verification Code'}
            </button>

            <p style={{ fontSize: '0.8rem', color: 'var(--color-graphite)', textAlign: 'center', marginTop: '10px' }}>
              Have an account? <Link href="/login" style={{ color: 'var(--color-signal)', fontWeight: '600' }}>Sign In here</Link>
            </p>
          </form>
        )}

        {/* 2. Step: Enter OTP code */}
        {step === 'otp' && (
          <form onSubmit={handleVerifyOtp} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-md)' }}>
            <p style={{ color: 'var(--color-graphite)', fontSize: '0.875rem', lineHeight: '1.5', textAlign: 'center' }}>
              We have dispatched a 6-digit verification code to **{email}**. Enter it below to proceed.
            </p>



            <div className="form-group">
              <label className="form-label" htmlFor="otp">6-Digit Code</label>
              <input
                id="otp"
                type="text"
                maxLength={6}
                className="form-input"
                value={otp}
                onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                placeholder="123456"
                required
                disabled={loading}
                style={{ textAlign: 'center', fontSize: '1.25rem', letterSpacing: '6px' }}
              />
            </div>

            {error && <div className="error-banner">{error}</div>}

            <button type="submit" className="btn-primary" style={{ width: '100%', justifyContent: 'center', padding: '0.8rem' }} disabled={loading}>
              {loading ? 'Verifying...' : 'Verify Code'}
            </button>

            <button
              type="button"
              onClick={() => setStep('email')}
              style={{ fontSize: '0.8rem', color: 'var(--color-graphite)', cursor: 'pointer', background: 'none', border: 'none' }}
            >
              ← Change Email Address
            </button>
          </form>
        )}

        {/* 3. Step: Set Password */}
        {step === 'password' && (
          <form onSubmit={handleRegisterUser} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-md)' }}>
            <p style={{ color: 'var(--color-graphite)', fontSize: '0.875rem', lineHeight: '1.5', textAlign: 'center' }}>
              Email verified! Set a security password to secure your Control Desk.
            </p>

            <div className="form-group" style={{ position: 'relative' }}>
              <label className="form-label" htmlFor="new-password">Password / PIN</label>
              <div style={{ position: 'relative', width: '100%' }}>
                <input
                  id="new-password"
                  type={showPassword ? 'text' : 'password'}
                  className="form-input"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="At least 6 characters"
                  required
                  minLength={6}
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
                    opacity: 0.5,
                    padding: '4px',
                    background: 'none',
                    border: 'none'
                  }}
                >
                  {showPassword ? '👁️' : '🙈'}
                </button>
              </div>
            </div>

            {error && <div className="error-banner">{error}</div>}

            <button type="submit" className="btn-primary" style={{ width: '100%', justifyContent: 'center', padding: '0.8rem' }} disabled={loading}>
              {loading ? 'Creating Account...' : 'Set Password & Register'}
            </button>
          </form>
        )}

        {/* 4. Step: Store Details Setup */}
        {step === 'profile' && (
          <form onSubmit={handleCreateShop} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-md)' }}>
            
            {/* Section 1: Identity */}
            <div style={{ borderBottom: '1px solid var(--color-hairline)', paddingBottom: 'var(--space-md)' }}>
              <h2 style={{ fontSize: '1.35rem', marginBottom: 'var(--space-xs)', fontWeight: 500 }}>01. Shop Identity</h2>
              <div className="form-group">
                <label className="form-label" htmlFor="shopName">Shop Name</label>
                <input
                  id="shopName"
                  type="text"
                  className="form-input"
                  value={shopName}
                  onChange={(e) => setShopName(e.target.value)}
                  placeholder="e.g. Chidi's Curated Wear"
                  required
                  disabled={loading}
                />
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="category">Category</label>
                <select
                  id="category"
                  className="form-input"
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  disabled={loading}
                  style={{ appearance: 'none', background: 'white' }}
                >
                  <option value="Boutique & Fashion">Boutique & Fashion</option>
                  <option value="Watches & Jewellery">Watches & Jewellery</option>
                  <option value="Electronics & Gadgets">Electronics & Gadgets</option>
                  <option value="Food & Beverages">Food & Beverages</option>
                  <option value="Home & Cosmetics">Home & Cosmetics</option>
                </select>
              </div>
            </div>

            {/* Section 2: Payout */}
            <div style={{ borderBottom: '1px solid var(--color-hairline)', paddingBottom: 'var(--space-md)' }}>
              <h2 style={{ fontSize: '1.35rem', marginBottom: 'var(--space-xs)', fontWeight: 500 }}>02. Payout Bank</h2>
              <div className="form-group">
                <label className="form-label" htmlFor="payoutBankName">Bank Name</label>
                <input
                  id="payoutBankName"
                  type="text"
                  className="form-input"
                  value={payoutBankName}
                  onChange={(e) => setPayoutBankName(e.target.value)}
                  placeholder="e.g. GTBank, Zenith, Access"
                  required
                  disabled={loading}
                />
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="payoutAccountNumber">Account Number (10 digits)</label>
                <input
                  id="payoutAccountNumber"
                  type="text"
                  maxLength={10}
                  pattern="\d{10}"
                  className="form-input"
                  value={payoutAccountNumber}
                  onChange={(e) => setPayoutAccountNumber(e.target.value.replace(/\D/g, ''))}
                  placeholder="e.g. 0123456789"
                  required
                  disabled={loading}
                />
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="payoutAccountName">Account Name</label>
                <input
                  id="payoutAccountName"
                  type="text"
                  className="form-input"
                  value={payoutAccountName}
                  onChange={(e) => setPayoutAccountName(e.target.value)}
                  placeholder="e.g. Chidi Okafor Enterprises"
                  required
                  disabled={loading}
                />
              </div>
            </div>

            {/* Section 3: AI customization */}
            <div style={{ paddingBottom: 'var(--space-md)' }}>
              <h2 style={{ fontSize: '1.35rem', marginBottom: 'var(--space-xs)', fontWeight: 500 }}>03. AI Sales Operator</h2>
              <div className="form-group">
                <label className="form-label" htmlFor="aiName">Assistant Name</label>
                <input
                  id="aiName"
                  type="text"
                  className="form-input"
                  value={aiName}
                  onChange={(e) => setAiName(e.target.value)}
                  placeholder="Ada"
                  disabled={loading}
                />
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="aiTone">AI Speech Character / Tone</label>
                <input
                  id="aiTone"
                  type="text"
                  className="form-input"
                  value={aiTone}
                  onChange={(e) => setAiTone(e.target.value)}
                  placeholder="helpful, professional, polite"
                  disabled={loading}
                />
              </div>
            </div>

            {error && <div className="error-banner">{error}</div>}

            <button type="submit" className="btn-primary" style={{ width: '100%', justifyContent: 'center', padding: '0.85rem', fontSize: '1rem' }} disabled={loading}>
              {loading ? 'Initializing Store...' : 'Continue to Catalogue Upload'}
            </button>
          </form>
        )}

      </div>

      {/* Local Stepper CSS styles */}
      <style jsx global>{`
        .step-badge {
          font-family: var(--font-mono);
          font-size: 0.65rem;
          text-transform: uppercase;
          background-color: var(--color-hairline);
          color: var(--color-graphite);
          padding: 2px 8px;
          border-radius: 12px;
          transition: background-color 0.3s ease, color 0.3s ease;
        }
        .step-badge.active {
          background-color: var(--color-signal-light);
          color: var(--color-signal);
          font-weight: 600;
        }
        .error-banner {
          background-color: rgba(244,67,54,0.06);
          border-left: 2px solid red;
          padding: 10px 12px;
          fontSize: 0.85rem;
          color: #F44336;
          line-height: 1.45;
        }
      `}</style>
    </div>
  );
}
