'use client';

import { useState, useEffect, useRef } from 'react';
import { sendMessageToAda } from '@/app/actions/chat';

interface Product {
  id: string;
  name: string;
  priceNgn: number;
  description: string;
  inStock: number;
  imageUrl: string;
}

interface Shop {
  id: string;
  name: string;
  slug: string;
  category: string;
  aiName: string;
  aiTone: string;
  payoutBankName: string;
  payoutAccountNumber: string;
  payoutAccountName: string;
}

interface BuyerChatContainerProps {
  shop: Shop;
  products: Product[];
}

interface Message {
  role: 'buyer' | 'ada' | 'vendor';
  text: string;
  createdAt: string;
}

export default function BuyerChatContainer({ shop, products }: BuyerChatContainerProps) {
  // Buyer handle state
  const [buyerHandle, setBuyerHandle] = useState('');
  const [handleInput, setHandleInput] = useState('');
  const [showHandleModal, setShowHandleModal] = useState(true);

  // Chat conversation state
  const [conversationId, setConversationId] = useState('');
  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'ada',
      text: `Hello! I am ${shop.aiName || 'Ada'}, your virtual assistant. How can I help you today? Feel free to ask about our catalogue!`,
      createdAt: new Date().toISOString(),
    },
  ]);
  const [inputText, setInputText] = useState('');
  const [loading, setLoading] = useState(false);
  const [humanTakeover, setHumanTakeover] = useState(false);

  // Responsive View Toggle (Mobile/Tablet)
  const [activeTab, setActiveTab] = useState<'chat' | 'catalog'>('chat');

  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Resolve UI theme based on shop category
  const themeColors = {
    accent: '#0F6CBD', // default blue
    accentLight: 'rgba(15, 108, 189, 0.08)',
  };

  if (shop.category === 'Boutique & Fashion') {
    themeColors.accent = '#8D7B68'; // Warm brown/gold
    themeColors.accentLight = 'rgba(141, 123, 104, 0.08)';
  } else if (shop.category === 'Watches & Jewellery') {
    themeColors.accent = '#C5A880'; // Brass gold
    themeColors.accentLight = 'rgba(197, 168, 128, 0.08)';
  } else if (shop.category === 'Electronics & Gadgets') {
    themeColors.accent = '#104F55'; // Dark teal
    themeColors.accentLight = 'rgba(16, 79, 85, 0.08)';
  } else if (shop.category === 'Food & Beverages') {
    themeColors.accent = '#5F7A61'; // Sage green
    themeColors.accentLight = 'rgba(95, 122, 97, 0.08)';
  } else if (shop.category === 'Home & Cosmetics') {
    themeColors.accent = '#D8A7B1'; // Soft rose
    themeColors.accentLight = 'rgba(216, 167, 177, 0.08)';
  }

  // Load handle from localstorage
  useEffect(() => {
    const savedHandle = localStorage.getItem(`cadence_handle_${shop.id}`);
    const savedConvId = localStorage.getItem(`cadence_conv_${shop.id}`);

    if (savedHandle) {
      setBuyerHandle(savedHandle);
      setShowHandleModal(false);
    }
    if (savedConvId) {
      setConversationId(savedConvId);
    } else {
      const newConvId = `conv_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      setConversationId(newConvId);
      localStorage.setItem(`cadence_conv_${shop.id}`, newConvId);
    }
  }, [shop.id]);

  // Scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  // Set handle
  function handleEnterChat(e: React.FormEvent) {
    e.preventDefault();
    if (!handleInput.trim()) return;

    let formatted = handleInput.trim();
    if (!formatted.startsWith('@')) {
      formatted = `@${formatted}`;
    }

    setBuyerHandle(formatted);
    localStorage.setItem(`cadence_handle_${shop.id}`, formatted);
    setShowHandleModal(false);
  }

  // Send message to Ada
  async function handleSendMessage(e?: React.FormEvent, textOverride?: string) {
    if (e) e.preventDefault();
    
    const textToSend = textOverride || inputText;
    if (!textToSend.trim() || loading) return;

    // Add buyer's message to view
    const userMsg: Message = {
      role: 'buyer',
      text: textToSend,
      createdAt: new Date().toISOString(),
    };
    setMessages(prev => [...prev, userMsg]);
    setInputText('');
    setLoading(true);

    try {
      const res = await sendMessageToAda({
        conversationId,
        messageText: textToSend,
        buyerHandle,
        shopSlug: shop.slug,
      });

      if (res.success && res.reply) {
        if (res.takeover) {
          setHumanTakeover(true);
        }
        setMessages(prev => [...prev, {
          role: res.takeover ? 'vendor' : 'ada',
          text: res.reply || '',
          createdAt: new Date().toISOString(),
        }]);
      } else {
        setMessages(prev => [...prev, {
          role: 'ada',
          text: 'I am experiencing a slight connection delay resolving catalogue items. Please check back shortly.',
          createdAt: new Date().toISOString(),
        }]);
      }
    } catch (err) {
      setMessages(prev => [...prev, {
        role: 'ada',
        text: 'An error occurred establishing connection. Let me retry.',
        createdAt: new Date().toISOString(),
      }]);
    } finally {
      setLoading(false);
    }
  }

  // Trigger query for specific product click
  function handleInquireProduct(product: Product) {
    const text = `Hi, is "${product.name}" currently available and what is the stock level?`;
    setActiveTab('chat');
    handleSendMessage(undefined, text);
  }

  return (
    <div style={{
      backgroundImage: `linear-gradient(rgba(242, 241, 238, 0.94), rgba(242, 241, 238, 0.94)), url('/dashboard_bg_texture.jpg')`,
      backgroundSize: 'cover',
      backgroundPosition: 'center',
      minHeight: '100vh',
      display: 'flex',
      flexDirection: 'column',
    }}>
      
      {/* 1. Identity Verification Modal Overlay */}
      {showHandleModal && (
        <div style={{
          position: 'fixed',
          top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: 'rgba(19,19,19,0.85)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
          padding: 'var(--space-md)'
        }}>
          <div style={{
            backgroundColor: '#FFFFFF',
            borderRadius: '6px',
            border: '1px solid var(--color-hairline)',
            padding: 'var(--space-xl) var(--space-lg)',
            width: '100%',
            maxWidth: '440px',
            textAlign: 'center',
            boxShadow: '0 10px 40px rgba(0,0,0,0.1)'
          }}>
            <h2 style={{ fontSize: '2.25rem', marginBottom: 'var(--space-xs)', color: 'var(--color-ink)' }}>
              Welcome to {shop.name}
            </h2>
            <p style={{ color: 'var(--color-graphite)', fontSize: '0.9rem', marginBottom: 'var(--space-lg)' }}>
              Please enter your name or handle so {shop.aiName || 'Ada'} knows how to assist you.
            </p>

            <form onSubmit={handleEnterChat} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-sm)' }}>
              <div className="form-group">
                <input
                  type="text"
                  className="form-input"
                  value={handleInput}
                  onChange={(e) => setHandleInput(e.target.value)}
                  placeholder="e.g. chidi_boutique or Chidi"
                  required
                  style={{ textAlign: 'center', padding: '0.85rem' }}
                />
              </div>
              <button
                type="submit"
                className="btn-primary"
                style={{
                  backgroundColor: themeColors.accent,
                  justifyContent: 'center',
                  padding: '0.85rem',
                  fontSize: '0.95rem'
                }}
              >
                Enter Chat
              </button>
            </form>
          </div>
        </div>
      )}

      {/* 2. Main Chat Viewport */}
      {!showHandleModal && (
        <>
          {/* Header Banner */}
          <header style={{
            backgroundColor: '#FFFFFF',
            borderBottom: '1px solid var(--color-hairline)',
            padding: 'var(--space-sm) var(--space-md)',
            position: 'sticky',
            top: 0,
            zIndex: 100
          }}>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              maxWidth: '1200px',
              margin: '0 auto',
              width: '100%'
            }}>
              <div>
                <h1 style={{ fontSize: '1.5rem', fontWeight: 500 }}>{shop.name}</h1>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '2px' }}>
                  <span style={{
                    width: '8px',
                    height: '8px',
                    borderRadius: '50%',
                    backgroundColor: humanTakeover ? '#FFA500' : '#4CAF50',
                    display: 'inline-block'
                  }}></span>
                  <span className="mono-label" style={{ fontSize: '0.65rem' }}>
                    {humanTakeover ? 'Live takeover active' : `${shop.aiName || 'Ada'} is online`}
                  </span>
                </div>
              </div>
              
              {/* Telegram Redirection Action */}
              <a
                href={`https://t.me/cadenceNg_Bot?start=${shop.slug}`}
                target="_blank"
                rel="noreferrer"
                className="btn-secondary"
                style={{ borderColor: 'var(--color-signal)', color: 'var(--color-signal)', gap: '4px', fontSize: '0.8rem', padding: '0.5rem 0.85rem' }}
              >
                <span>Continue on Telegram</span>
              </a>
            </div>
          </header>

          {/* Toggle Tabs (Visible on mobile/tablet only) */}
          <div style={{
            display: 'none',
            borderBottom: '1px solid var(--color-hairline)',
            backgroundColor: '#FFFFFF',
          }} className="mobile-tabs-bar">
            <button
              onClick={() => setActiveTab('chat')}
              style={{
                flex: 1,
                padding: '12px',
                textAlign: 'center',
                fontWeight: 600,
                fontSize: '0.85rem',
                borderBottom: activeTab === 'chat' ? `2px solid ${themeColors.accent}` : 'none',
                color: activeTab === 'chat' ? themeColors.accent : 'var(--color-graphite)'
              }}
            >
              Live Chat
            </button>
            <button
              onClick={() => setActiveTab('catalog')}
              style={{
                flex: 1,
                padding: '12px',
                textAlign: 'center',
                fontWeight: 600,
                fontSize: '0.85rem',
                borderBottom: activeTab === 'catalog' ? `2px solid ${themeColors.accent}` : 'none',
                color: activeTab === 'catalog' ? themeColors.accent : 'var(--color-graphite)'
              }}
            >
              Shop Catalog ({products.length})
            </button>
          </div>

          {/* Split Content Body */}
          <div style={{
            flex: 1,
            display: 'flex',
            maxWidth: '1200px',
            margin: '0 auto',
            width: '100%',
            overflow: 'hidden'
          }} className="split-chat-body">
            
            {/* Split Left: Product Catalogue list (Toggled / Hide on mobile) */}
            <div style={{
              width: '380px',
              backgroundColor: '#FFFFFF',
              borderRight: '1px solid var(--color-hairline)',
              display: 'flex',
              flexDirection: 'column',
              overflowY: 'auto',
              flexShrink: 0
            }} className={`desktop-catalog-pane ${activeTab === 'catalog' ? 'mobile-visible' : 'mobile-hidden'}`}>
              
              <div style={{ padding: 'var(--space-md)', borderBottom: '1px solid var(--color-hairline)', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <div className="stat-capsule" style={{ minHeight: 'auto', padding: '6px 14px', borderRadius: '20px', alignSelf: 'flex-start', cursor: 'default' }}>
                  <span className="stat-capsule-label" style={{ margin: 0, fontSize: '0.7rem' }}>Catalogue Items</span>
                </div>
                <p style={{ fontSize: '0.85rem', color: 'var(--color-graphite)' }}>Click on any item to ask Ada about it.</p>
              </div>

              {products.length === 0 ? (
                <div style={{ padding: 'var(--space-lg)', textAlign: 'center', color: 'var(--color-graphite)' }}>
                  This shop has not uploaded catalogue products yet.
                </div>
              ) : (
                <div style={{ padding: 'var(--space-sm)' }}>
                  {products.map(prod => (
                    <div key={prod.id} style={{
                      display: 'flex',
                      gap: '12px',
                      padding: '12px',
                      borderBottom: '1px solid var(--color-hairline)',
                      cursor: 'pointer',
                      borderRadius: '4px',
                      transition: 'background-color 0.2s ease'
                    }} 
                    className="catalog-row"
                    onClick={() => handleInquireProduct(prod)}>
                      <div style={{
                        width: '60px',
                        height: '60px',
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
                            (e.target as HTMLImageElement).src = 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100" viewBox="0 0 24 24" fill="none" stroke="%23cccccc" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><circle cx="8.5" cy="8.5" r="1.5"></circle><polyline points="21 15 16 10 5 21"></polyline></svg>';
                          }}
                        />
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <h3 style={{ fontSize: '0.95rem', fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {prod.name}
                        </h3>
                        <p style={{
                          fontSize: '0.8rem',
                          color: 'var(--color-graphite)',
                          margin: '2px 0 6px 0',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap'
                        }}>
                          {prod.description || 'No description.'}
                        </p>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                          <span style={{ fontSize: '0.75rem', fontFamily: 'var(--font-mono)', color: prod.inStock > 0 ? themeColors.accent : 'red' }}>
                            {prod.inStock > 0 ? `${prod.inStock} in stock` : 'Out of stock'}
                          </span>
                          <span style={{ fontWeight: 600, fontSize: '0.95rem', fontFamily: 'var(--font-mono)' }}>
                            ₦{prod.priceNgn.toLocaleString()}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Split Right: Live Dialogue viewport */}
            <div style={{
              flex: 1,
              display: 'flex',
              flexDirection: 'column',
              backgroundColor: 'var(--color-mist)',
              height: 'calc(100vh - 73px)'
            }} className={`desktop-chat-pane ${activeTab === 'chat' ? 'mobile-visible' : 'mobile-hidden'}`}>
              
              {/* Message History Feed */}
              <div style={{
                flex: 1,
                overflowY: 'auto',
                padding: 'var(--space-md) var(--space-md)',
                display: 'flex',
                flexDirection: 'column',
                gap: '12px'
              }}>
                {messages.map((msg, idx) => {
                  const isBuyer = msg.role === 'buyer';
                  return (
                    <div
                      key={idx}
                      style={{
                        alignSelf: isBuyer ? 'flex-end' : 'flex-start',
                        maxWidth: '80%',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: isBuyer ? 'flex-end' : 'flex-start'
                      }}
                    >
                      {/* Bubble content */}
                      <div style={{
                        backgroundColor: isBuyer ? themeColors.accent : '#FFFFFF',
                        color: isBuyer ? '#FFFFFF' : 'var(--color-ink)',
                        padding: '10px 14px',
                        borderRadius: isBuyer ? '16px 16px 2px 16px' : '16px 16px 16px 2px',
                        fontSize: '0.95rem',
                        lineHeight: '1.45',
                        boxShadow: '0 2px 8px rgba(0,0,0,0.015)',
                        border: isBuyer ? 'none' : '1px solid var(--color-hairline)',
                        whiteSpace: 'pre-line'
                      }}>
                        {msg.text}
                      </div>

                      {/* Timestamp/Eyebrow */}
                      <span style={{
                        fontSize: '0.7rem',
                        color: 'var(--color-graphite)',
                        fontFamily: 'var(--font-mono)',
                        marginTop: '4px',
                        padding: '0 4px'
                      }}>
                        {isBuyer ? `You (${buyerHandle})` : (msg.role === 'vendor' ? 'Merchant' : shop.aiName || 'Ada')} · {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                  );
                })}

                {/* Ada Thinking Indicator */}
                {loading && (
                  <div style={{ alignSelf: 'flex-start', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    <div style={{
                      backgroundColor: '#FFFFFF',
                      border: '1px solid var(--color-hairline)',
                      padding: '10px 14px',
                      borderRadius: '16px 16px 16px 2px',
                      boxShadow: '0 2px 8px rgba(0,0,0,0.015)',
                      display: 'flex',
                      gap: '4px',
                      alignItems: 'center'
                    }}>
                      <span className="dot-blink" style={{ backgroundColor: themeColors.accent }}></span>
                      <span className="dot-blink" style={{ backgroundColor: themeColors.accent, animationDelay: '0.2s' }}></span>
                      <span className="dot-blink" style={{ backgroundColor: themeColors.accent, animationDelay: '0.4s' }}></span>
                    </div>
                  </div>
                )}
                
                <div ref={messagesEndRef} />
              </div>

              {/* Chat Input Dock */}
              <form onSubmit={handleSendMessage} style={{
                padding: 'var(--space-sm) var(--space-md)',
                backgroundColor: '#FFFFFF',
                borderTop: '1px solid var(--color-hairline)',
                display: 'flex',
                gap: '8px'
              }}>
                <input
                  type="text"
                  className="form-input"
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  placeholder={loading ? 'Ada is processing...' : `Type a message to ${shop.aiName || 'Ada'}...`}
                  disabled={loading}
                  required
                  style={{ flex: 1, borderRadius: '24px', paddingLeft: '1.25rem' }}
                />
                <button
                  type="submit"
                  className="btn-primary"
                  disabled={loading || !inputText.trim()}
                  style={{
                    backgroundColor: themeColors.accent,
                    borderRadius: '24px',
                    padding: '0.625rem 1.5rem',
                    flexShrink: 0
                  }}
                >
                  Send
                </button>
              </form>

            </div>
          </div>
        </>
      )}

      {/* Local styles for tab bar toggles and visual responsive styles */}
      <style jsx global>{`
        @media (max-width: 768px) {
          .mobile-tabs-bar {
            display: flex !important;
          }
          .split-chat-body {
            flex-direction: column !important;
          }
          .desktop-catalog-pane {
            width: 100% !important;
            border-right: none !important;
            height: calc(100vh - 120px) !important;
          }
          .desktop-chat-pane {
            height: calc(100vh - 120px) !important;
          }
          .mobile-hidden {
            display: none !important;
          }
          .mobile-visible {
            display: flex !important;
          }
        }
        .dot-blink {
          width: 6px;
          height: 6px;
          border-radius: 50%;
          display: inline-block;
          animation: blink 1.4s infinite both;
        }
        @keyframes blink {
          0% { opacity: .2; }
          20% { opacity: 1; }
          100% { opacity: .2; }
        }
        .catalog-row:hover {
          background-color: ${themeColors.accentLight};
        }
      `}</style>
    </div>
  );
}
