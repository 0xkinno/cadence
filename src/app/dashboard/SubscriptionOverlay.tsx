'use client';

import { useState, useEffect } from 'react';
import { verifySubscriptionPayment } from '@/app/actions/payments';

interface SubscriptionOverlayProps {
  shopName: string;
  vendorEmail: string;
  onPaid: () => void;
}

export default function SubscriptionOverlay({ shopName, vendorEmail, onPaid }: SubscriptionOverlayProps) {
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  
  // Checkout Window States
  const [showCheckout, setShowCheckout] = useState(false);
  const [paymentScreen, setPaymentScreen] = useState<'details' | 'verifying' | 'success'>('details');
  const [progress, setProgress] = useState(0);
  const [copied, setCopied] = useState(false);
  const [paymentRef, setPaymentRef] = useState('');

  // Selected payment provider channel
  const [activeTab, setActiveTab] = useState<'card' | 'transfer' | 'opay' | 'palmpay'>('transfer');

  // Trigger checkout launch
  function handleOpenCheckout() {
    setErrorMessage('');
    const ref = `CDN_SUB_${Date.now()}_${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
    setPaymentRef(ref);
    setPaymentScreen('details');
    setProgress(0);
    setShowCheckout(true);
  }

  // Copy target bank details
  function handleCopyAccountNumber() {
    navigator.clipboard.writeText('7065882218');
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  // Initiate confirmation
  function handleConfirmTransfer() {
    setPaymentScreen('verifying');
    setProgress(0);
  }

  // progress bar animations
  useEffect(() => {
    if (paymentScreen !== 'verifying') return;

    const intervalTime = 150;
    const increment = 5;
    
    const timer = setInterval(async () => {
      setProgress((prev) => {
        if (prev >= 100) {
          clearInterval(timer);
          triggerVerificationCall();
          return 100;
        }
        return prev + increment;
      });
    }, intervalTime);

    return () => clearInterval(timer);
  }, [paymentScreen]);

  // Server action integration
  async function triggerVerificationCall() {
    setLoading(true);
    try {
      const verifyRes = await verifySubscriptionPayment(paymentRef);
      if (verifyRes.success) {
        setPaymentScreen('success');
        setTimeout(() => {
          setShowCheckout(false);
          onPaid();
        }, 1500);
      } else {
        setErrorMessage(verifyRes.error || 'Payment verification failed. Please try again.');
        setPaymentScreen('details');
        setLoading(false);
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Payment verification failed.');
      setPaymentScreen('details');
      setLoading(false);
    }
  }

  // Resolve Bank Name based on Tab
  const getBankName = () => {
    if (activeTab === 'transfer') return 'OPay Bank';
    if (activeTab === 'opay') return 'OPay Wallet';
    if (activeTab === 'palmpay') return 'PalmPay';
    return 'OPay Bank';
  };

  return (
    <div style={{
      position: 'fixed',
      top: 0, left: 0, right: 0, bottom: 0,
      backgroundColor: '#F1F5FB', 
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 9999,
      padding: 'var(--space-md)'
    }}>
      
      {/* Main Activation Portal Box */}
      <div style={{
        backgroundColor: '#FFFFFF',
        borderRadius: '6px',
        border: '1px solid #E4E3DE',
        padding: 'var(--space-xl) var(--space-lg)',
        maxWidth: '460px',
        width: '100%',
        boxShadow: '0 8px 30px rgba(0,0,0,0.05)',
        textAlign: 'center'
      }}>
        <span className="mono-label" style={{ color: 'var(--color-signal)', display: 'block', marginBottom: 'var(--space-xs)' }}>
          [ VENDOR SUBSCRIPTION GATING ]
        </span>
        <h2 style={{ fontSize: '2.25rem', fontFamily: 'var(--font-display)', fontWeight: 400, color: 'var(--color-ink)' }}>
          Activate Cadence for AI assistance
        </h2>
        <p style={{ color: 'var(--color-graphite)', fontSize: '0.875rem', marginTop: '6px', marginBottom: 'var(--space-md)' }}>
          Unlock your Live Timeline, dynamic dashboard, and automated AI chat operators.
        </p>

        {/* Pricing tag box */}
        <div style={{
          backgroundColor: '#F2F1EE',
          borderRadius: '4px',
          padding: 'var(--space-sm) 0',
          margin: 'var(--space-md) 0',
          border: '1px dashed #E4E3DE'
        }}>
          <div style={{ fontSize: '2.75rem', fontFamily: 'var(--font-display)', fontWeight: 400 }}>
            ₦1,000<span style={{ fontSize: '0.9rem', fontFamily: 'var(--font-body)', color: 'var(--color-graphite)' }}>/month</span>
          </div>
          <span style={{ fontSize: '0.75rem', color: 'var(--color-signal)', fontWeight: 600 }}> Starter Subscription </span>
        </div>

        {/* Value listing */}
        <ul style={{
          listStyle: 'none',
          textAlign: 'left',
          maxWidth: '280px',
          margin: '0 auto var(--space-lg) auto',
          display: 'flex',
          flexDirection: 'column',
          gap: '8px',
          fontSize: '0.85rem'
        }}>
          <li style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ color: '#4CAF50', fontWeight: 'bold' }}>✓</span> 24/7 AI Sales Conversational operator
          </li>
          <li style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ color: '#4CAF50', fontWeight: 'bold' }}>✓</span> Real-time telemetry timeline sync
          </li>
          <li style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ color: '#4CAF50', fontWeight: 'bold' }}>✓</span> Interactive Merchant chat takeovers
          </li>
          <li style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ color: '#4CAF50', fontWeight: 'bold' }}>✓</span> Multi-device responsive dashboard
          </li>
        </ul>

        {errorMessage && (
          <div style={{
            backgroundColor: 'rgba(244,67,54,0.08)',
            color: '#F44336',
            padding: '8px 12px',
            borderRadius: '4px',
            fontSize: '0.8rem',
            marginBottom: 'var(--space-sm)',
            border: '1px solid rgba(244,67,54,0.15)'
          }}>
            {errorMessage}
          </div>
        )}

        <button
          onClick={handleOpenCheckout}
          className="btn-primary"
          style={{
            width: '100%',
            justifyContent: 'center',
            padding: '0.8rem',
            fontSize: '0.95rem'
          }}
        >
          Subscribe to Starter Plan
        </button>

        <p style={{ fontSize: '0.75rem', color: 'var(--color-graphite)', marginTop: '12px' }}>
          Secure payment channels accepted: Paystack, OPay, PalmPay, and Debit Cards.
        </p>
      </div>

      {/* ----------------------------------------------------
         CUSTOM SECURED CHECKOUT WINDOW
         ---------------------------------------------------- */}
      {showCheckout && (
        <div style={{
          position: 'fixed',
          top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 100000,
          fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif'
        }}>
          
          <div style={{
            width: '630px',
            height: '430px',
            backgroundColor: '#FFFFFF',
            borderRadius: '8px',
            display: 'flex',
            overflow: 'hidden',
            boxShadow: '0 10px 45px rgba(0,0,0,0.25)',
            position: 'relative'
          }}>
            
            <button 
              onClick={() => setShowCheckout(false)}
              disabled={paymentScreen === 'verifying' || paymentScreen === 'success'}
              style={{
                position: 'absolute',
                top: '16px',
                right: '20px',
                fontSize: '1.4rem',
                color: '#9E9E9E',
                cursor: 'pointer',
                border: 'none',
                background: 'none',
                zIndex: 100002
              }}
            >
              ×
            </button>

            {/* Left Sidebar Menu */}
            <div style={{
              width: '185px',
              backgroundColor: '#F4F5F7',
              borderRight: '1px solid #E5E5E5',
              padding: '24px 0',
              display: 'flex',
              flexDirection: 'column',
              gap: '2px',
              flexShrink: 0
            }}>
              <span style={{
                fontSize: '0.65rem',
                fontWeight: 700,
                color: '#8C8C8C',
                letterSpacing: '0.06em',
                padding: '0 20px 10px 20px',
                display: 'block'
              }}>
                CHANNELS
              </span>
              
              <button 
                onClick={() => { if (paymentScreen === 'details') setActiveTab('transfer'); }}
                style={{
                  display: 'flex', alignItems: 'center', gap: '10px',
                  padding: '12px 20px', fontSize: '0.825rem', width: '100%',
                  textAlign: 'left', border: 'none', background: activeTab === 'transfer' ? '#FFFFFF' : 'none',
                  borderLeft: activeTab === 'transfer' ? '4px solid #3AB54A' : '4px solid transparent',
                  color: activeTab === 'transfer' ? '#3AB54A' : '#4F4F4F', fontWeight: activeTab === 'transfer' ? 600 : 500,
                  cursor: 'pointer'
                }}
              >
                🏦 Wema (Paystack)
              </button>

              <button 
                onClick={() => { if (paymentScreen === 'details') setActiveTab('opay'); }}
                style={{
                  display: 'flex', alignItems: 'center', gap: '10px',
                  padding: '12px 20px', fontSize: '0.825rem', width: '100%',
                  textAlign: 'left', border: 'none', background: activeTab === 'opay' ? '#FFFFFF' : 'none',
                  borderLeft: activeTab === 'opay' ? '4px solid #00B050' : '4px solid transparent',
                  color: activeTab === 'opay' ? '#00B050' : '#4F4F4F', fontWeight: activeTab === 'opay' ? 600 : 500,
                  cursor: 'pointer'
                }}
              >
                📱 OPay Wallet
              </button>

              <button 
                onClick={() => { if (paymentScreen === 'details') setActiveTab('palmpay'); }}
                style={{
                  display: 'flex', alignItems: 'center', gap: '10px',
                  padding: '12px 20px', fontSize: '0.825rem', width: '100%',
                  textAlign: 'left', border: 'none', background: activeTab === 'palmpay' ? '#FFFFFF' : 'none',
                  borderLeft: activeTab === 'palmpay' ? '4px solid #5A189A' : '4px solid transparent',
                  color: activeTab === 'palmpay' ? '#5A189A' : '#4F4F4F', fontWeight: activeTab === 'palmpay' ? 600 : 500,
                  cursor: 'pointer'
                }}
              >
                🌴 PalmPay Transfer
              </button>

              <button 
                onClick={() => { if (paymentScreen === 'details') setActiveTab('card'); }}
                style={{
                  display: 'flex', alignItems: 'center', gap: '10px',
                  padding: '12px 20px', fontSize: '0.825rem', width: '100%',
                  textAlign: 'left', border: 'none', background: activeTab === 'card' ? '#FFFFFF' : 'none',
                  borderLeft: activeTab === 'card' ? '4px solid #3AB54A' : '4px solid transparent',
                  color: activeTab === 'card' ? '#3AB54A' : '#4F4F4F', fontWeight: activeTab === 'card' ? 600 : 500,
                  cursor: 'pointer'
                }}
              >
                💳 Debit Card
              </button>
            </div>

            {/* Right Main Panel Content */}
            <div style={{
              flex: 1,
              padding: '24px 30px',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between'
            }}>
              
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '3px', width: '28px' }}>
                  <div style={{ height: '3px', background: '#3AB54A', borderRadius: '1px' }}></div>
                  <div style={{ height: '3px', background: '#3AB54A', borderRadius: '1px', width: '80%' }}></div>
                  <div style={{ height: '3px', background: '#3AB54A', borderRadius: '1px' }}></div>
                </div>
                
                <div style={{ textAlign: 'right' }}>
                  <span style={{ fontSize: '0.75rem', color: '#8C8C8C', display: 'block' }}>{vendorEmail}</span>
                  <span style={{ fontSize: '0.875rem', fontWeight: 700, color: '#3AB54A' }}>Pay NGN 1,000</span>
                </div>
              </div>

              {/* Main Panel Content */}
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', margin: '20px 0' }}>
                
                {/* DEBIT CARD FORM */}
                {activeTab === 'card' && paymentScreen === 'details' && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    <div style={{ fontSize: '0.8rem', color: '#4F4F4F', marginBottom: '4px' }}>
                      Enter card details to complete subscription payment:
                    </div>
                    <input 
                      type="text" 
                      placeholder="Card Number (5399 **** **** ****)" 
                      style={{ padding: '8px 12px', border: '1px solid #E0E0E0', borderRadius: '4px', fontSize: '0.85rem' }} 
                    />
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                      <input 
                        type="text" 
                        placeholder="Expiry (MM/YY)" 
                        style={{ padding: '8px 12px', border: '1px solid #E0E0E0', borderRadius: '4px', fontSize: '0.85rem' }} 
                      />
                      <input 
                        type="password" 
                        placeholder="CVV" 
                        style={{ padding: '8px 12px', border: '1px solid #E0E0E0', borderRadius: '4px', fontSize: '0.85rem' }} 
                      />
                    </div>
                    <button 
                      onClick={handleConfirmTransfer}
                      style={{
                        backgroundColor: '#3AB54A', color: '#FFFFFF', border: 'none',
                        borderRadius: '4px', padding: '10px', fontWeight: 'bold',
                        fontSize: '0.85rem', cursor: 'pointer', marginTop: '8px'
                      }}
                    >
                      Pay NGN 1,000
                    </button>
                  </div>
                )}

                {/* TRANSFER CHANNELS (OPay 7065882218 Unified Destination) */}
                {activeTab !== 'card' && paymentScreen === 'details' && (
                  <div>
                    <p style={{ fontSize: '0.825rem', color: '#4F4F4F', textAlign: 'center', marginBottom: '14px', lineHeight: 1.4 }}>
                      Transfer NGN 1,000 to the bank details below via your banking app or USSD:
                    </p>
                    
                    <div style={{
                      backgroundColor: '#F9FAFC',
                      border: '1px solid #EAEAEA',
                      borderRadius: '6px',
                      padding: '14px 20px',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '8px'
                    }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontSize: '0.75rem', color: '#8C8C8C' }}>BANK NAME</span>
                        <strong style={{ fontSize: '0.85rem', color: '#333333' }}>OPay</strong>
                      </div>
                      
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontSize: '0.75rem', color: '#8C8C8C' }}>ACCOUNT NUMBER</span>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <strong style={{ fontSize: '1.1rem', color: '#333333', letterSpacing: '0.05em' }}>7065882218</strong>
                          <button 
                            onClick={handleCopyAccountNumber}
                            style={{
                              padding: '2px 6px', fontSize: '0.65rem', border: '1px solid #C4C4C4',
                              borderRadius: '3px', background: copied ? '#3AB54A' : '#FFFFFF',
                              color: copied ? '#FFFFFF' : '#4F4F4F', cursor: 'pointer'
                            }}
                          >
                            {copied ? 'Copied' : 'Copy'}
                          </button>
                        </div>
                      </div>

                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontSize: '0.75rem', color: '#8C8C8C' }}>ACCOUNT NAME</span>
                        <strong style={{ fontSize: '0.85rem', color: '#333333' }}>Cadence Technologies</strong>
                      </div>

                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid #F0F0F0', paddingTop: '8px', marginTop: '4px' }}>
                        <span style={{ fontSize: '0.75rem', color: '#8C8C8C' }}>AMOUNT DUE</span>
                        <strong style={{ fontSize: '0.9rem', color: '#3AB54A' }}>NGN 1,000</strong>
                      </div>
                    </div>

                    <button 
                      onClick={handleConfirmTransfer}
                      style={{
                        backgroundColor: '#3AB54A', color: '#FFFFFF', width: '100%',
                        border: 'none', borderRadius: '4px', padding: '12px',
                        fontWeight: 'bold', fontSize: '0.9rem', marginTop: '16px',
                        cursor: 'pointer', transition: 'background-color 0.2s'
                      }}
                    >
                      I've sent the money
                    </button>
                  </div>
                )}

                {/* VERIFYING VIEW */}
                {paymentScreen === 'verifying' && (
                  <div style={{ textAlign: 'center', padding: '10px' }}>
                    <div style={{ display: 'flex', justifyItems: 'center', justifyContent: 'center', alignItems: 'center', gap: '20px', marginBottom: '15px' }}>
                      <div style={{ 
                        width: '32px', height: '32px', borderRadius: '50%', 
                        background: '#3AB54A', color: '#FFFFFF', display: 'flex', 
                        alignItems: 'center', justifyContent: 'center', fontWeight: 'bold',
                        fontSize: '0.9rem' 
                      }}>✓</div>
                      
                      <div style={{ height: '2px', background: '#3AB54A', width: '80px', position: 'relative' }}>
                        <div style={{ 
                          height: '2px', background: '#E0E0E0', position: 'absolute',
                          left: `${progress}%`, right: 0, transition: 'left 0.1s linear'
                        }}></div>
                      </div>

                      <div style={{ 
                        width: '32px', height: '32px', borderRadius: '50%', 
                        border: '2px dashed #3AB54A', color: '#3AB54A', display: 'flex', 
                        alignItems: 'center', justifyContent: 'center', fontWeight: 'bold',
                        fontSize: '0.8rem', background: '#FFFFFF' 
                      }}>...</div>
                    </div>

                    <h3 style={{ fontSize: '1rem', fontWeight: 600, color: '#333333' }}>
                      Confirming transaction status...
                    </h3>
                    <p style={{ fontSize: '0.75rem', color: '#8C8C8C', marginTop: '4px' }}>
                      Awaiting settlement confirmation. Progress: {progress}%
                    </p>

                    <div style={{
                      height: '6px', width: '100%', backgroundColor: '#E0E0E0',
                      borderRadius: '3px', overflow: 'hidden', margin: '20px auto 10px auto',
                      maxWidth: '320px'
                    }}>
                      <div style={{
                        height: '100%', width: `${progress}%`, backgroundColor: '#3AB54A',
                        transition: 'width 0.1s linear'
                      }}></div>
                    </div>
                  </div>
                )}

                {/* SUCCESS VIEW */}
                {paymentScreen === 'success' && (
                  <div style={{ textAlign: 'center', padding: '20px' }}>
                    <div style={{ 
                      width: '64px', height: '64px', borderRadius: '50%', 
                      background: '#3AB54A', color: '#FFFFFF', display: 'flex', 
                      alignItems: 'center', justifyContent: 'center', fontSize: '2.5rem',
                      margin: '0 auto 15px auto', boxShadow: '0 4px 15px rgba(58,181,74,0.3)'
                    }}>
                      ✓
                    </div>
                    <h3 style={{ fontSize: '1.25rem', fontWeight: 600, color: '#333333' }}>
                      Payment Successful!
                    </h3>
                    <p style={{ fontSize: '0.85rem', color: '#8C8C8C', marginTop: '6px' }}>
                      Starter Monthly subscription activated. Opening dashboard...
                    </p>
                  </div>
                )}

              </div>

              {/* Bottom Secured Branding */}
              <div style={{
                textAlign: 'center',
                borderTop: '1px solid #EAEAEA',
                paddingTop: '12px',
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                gap: '6px',
                fontSize: '0.725rem',
                color: '#8C8C8C'
              }}>
                🔒 Secured transaction check
              </div>

            </div>

          </div>

        </div>
      )}

    </div>
  );
}
