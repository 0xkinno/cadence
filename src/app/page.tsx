'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

interface TimelineEvent {
  time: string;
  text: string;
  amount?: string;
  pulse?: boolean;
}

export default function LandingPage() {
  const [timeline, setTimeline] = useState<TimelineEvent[]>([
    { time: "02:31", text: "Ada initialized for <strong>Chidi's Curated Wear</strong>" },
    { time: "02:33", text: "Ada recovered an abandoned chat from a buyer" },
    { time: "02:38", text: "Ada checked inventory for <strong>Vintage Linen Shirt</strong>" },
    { time: "02:40", text: "Ada answered buyer query on sizing & availability" },
    { time: "02:42", text: "Ada closed a sale · Presented payout account details", amount: "₦18,500" }
  ]);
  const [bpm, setBpm] = useState(12);

  // Live timeline simulated feed polling
  useEffect(() => {
    const livePool = [
      { text: "Ada answered product availability query from buyer", amount: "" },
      { text: "Ada recommended alternative product (Linen Dress)", amount: "" },
      { text: "Ada verified inventory level for Silk Scarf", amount: "" },
      { text: "Ada closed a sale · Presented payout account details", amount: "₦24,000" },
      { text: "Ada flagged low stock for Vintage Linen Shirt (2 left)", amount: "" },
      { text: "Ada re-engaged buyer who left during checkout", amount: "" },
      { text: "Ada completed transaction · Sent receipt to customer", amount: "₦14,500" },
      { text: "Ada answered question about store location in Ikeja", amount: "" },
      { text: "Ada closed a sale · Presented payout account details", amount: "₦32,000" }
    ];

    let poolIndex = 0;

    const interval = setInterval(() => {
      const now = new Date();
      const hrs = String(now.getHours()).padStart(2, '0');
      const mins = String(now.getMinutes()).padStart(2, '0');
      const timeStr = `${hrs}:${mins}`;

      const newEvent = livePool[poolIndex];
      
      setTimeline(prev => {
        const updated = [...prev, { time: timeStr, text: newEvent.text, amount: newEvent.amount || undefined, pulse: true }];
        if (updated.length > 5) {
          updated.shift();
        }
        return updated;
      });

      // Clear pulse state
      setTimeout(() => {
        setTimeline(prev => prev.map(item => item.time === timeStr ? { ...item, pulse: false } : item));
      }, 1500);

      poolIndex = (poolIndex + 1) % livePool.length;
      setBpm(10 + Math.floor(Math.random() * 5));
    }, 4500);

    return () => clearInterval(interval);
  }, []);

  return (
    <div style={{ backgroundColor: 'var(--color-paper)', minHeight: '100vh', display: 'flex', flexDirection: 'column', scrollPaddingTop: '5rem' }}>
      
      {/* 1. Full-Width Solid Navigation Bar (Match Image 2 exactly) */}
      <header className="capsule-nav-container">
        <div className="capsule-nav-inner">
          <div className="logo" style={{ textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 700, fontSize: '1.15rem', color: 'var(--color-ink)' }}>
            CADENCE
          </div>
          
          <nav className="capsule-links">
            <Link href="#how-it-works" className="nav-item">How it works</Link>
            <Link href="#testimonial" className="nav-item">Proof</Link>
            <Link href="#pricing" className="nav-item">Pricing</Link>
            <Link href="/judge" className="nav-item highlight-link">Judge Evidence</Link>
          </nav>

          <Link href="/login" className="btn-primary" style={{ padding: '0.5rem 1.25rem', fontSize: '0.8rem' }}>
            Control Desk
          </Link>
        </div>
      </header>

      {/* 2. Hero Section (Fix 1 - Widened spacing gap) */}
      <section className="hero-section">
        {/* Full-bleed background layer */}
        <img 
          src="/hero_market_bg.jpg" 
          alt="Lagos clothing merchant market backdrop" 
          className="hero-bg-photo" 
        />
        
        {/* Scrim Overlay */}
        <div className="hero-scrim"></div>

        <div className="container hero-layout-grid">
          <div className="hero-text-content hero-nudge-left">
            <h1 className="hero-headline">
              Cadence lets Nigerian micro-vendors close sales on chat <em>while they sleep.</em>
            </h1>
            
            <p className="hero-subtext">
              Ada is your AI sales operator that never sleeps: she answers customers instantly, checks real stock, recommends alternatives, and hands over your bank details. Wake up to credited transfers.
            </p>

            <div className="hero-action-row">
              <Link href="/onboarding" className="btn-primary" style={{ padding: '0.8rem 1.5rem', fontSize: '0.95rem', boxShadow: '0 4px 15px rgba(15,108,189,0.3)' }}>
                Deploy Ada in 2 Min
              </Link>
              <Link href="#how-it-works" className="btn-secondary-light" style={{ padding: '0.8rem 1.5rem', fontSize: '0.95rem' }}>
                Learn More
              </Link>
            </div>
          </div>

          {/* Telemetry Timeline Feed Card (Fix 1 - Nudge Right) */}
          <div className="timeline-container timeline-solid-card hero-nudge-right">
            <div className="timeline-header">
              <div className="live-indicator">
                <span className="live-dot"></span>
                <span className="mono-label" style={{ color: 'var(--color-ink)', fontWeight: 600 }}>Ada Live Operations</span>
              </div>
              <span className="mono-label" style={{ color: 'var(--color-signal)', fontWeight: 600 }}>TEMPO: {bpm} BPM</span>
            </div>
            <div className="timeline-feed">
              <ul className="timeline-list">
                {timeline.map((item, idx) => (
                  <li key={idx} className={`timeline-item ${item.pulse ? 'pulse-state' : ''}`}>
                    <span className="timeline-time">{item.time}</span>
                    <div className="timeline-content">
                      <span dangerouslySetInnerHTML={{ __html: item.text }}></span>
                      {item.amount && <span className="timeline-amount">{item.amount}</span>}
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          </div>

        </div>
      </section>

      {/* 3. Moving Image Carousel Section (Flat Uniform, Spaced, Seamless Loop) */}
      <section className="carousel-outer-section">
        <div className="marquee-wrapper">
          <div className="marquee-track">
            
            {/* Loop Card Set 1 */}
            <div className="marquee-card">
              <img src="/hero_boutique.jpg" alt="Nigerian Boutique" />
              <div className="marquee-card-label">Boutique Owner, Lagos</div>
            </div>
            <div className="marquee-card">
              <img src="/hero_phone_chat.jpg" alt="Ada Sales Operator Chat" />
              <div className="marquee-card-label">24/7 AI Sales Assistant</div>
            </div>
            <div className="marquee-card">
              <img src="/hero_market_fabrics.jpg" alt="Lagos Fabrics Vendor" />
              <div className="marquee-card-label">Textile Merchant, Balogun</div>
            </div>
            <div className="marquee-card">
              <img src="/hero_gadget_seller.jpg" alt="Electronics Seller" />
              <div className="marquee-card-label">Gadget Store, Computer Village</div>
            </div>
            <div className="marquee-card">
              <img src="/hero_food_trader.jpg" alt="Commodity Trader" />
              <div className="marquee-card-label">Food Vendor, Mile 12</div>
            </div>

            {/* Loop Card Set 2 */}
            <div className="marquee-card">
              <img src="/hero_boutique.jpg" alt="Nigerian Boutique" />
              <div className="marquee-card-label">Boutique Owner, Lagos</div>
            </div>
            <div className="marquee-card">
              <img src="/hero_phone_chat.jpg" alt="Ada Sales Operator Chat" />
              <div className="marquee-card-label">24/7 AI Sales Assistant</div>
            </div>
            <div className="marquee-card">
              <img src="/hero_market_fabrics.jpg" alt="Lagos Fabrics Vendor" />
              <div className="marquee-card-label">Textile Merchant, Balogun</div>
            </div>
            <div className="marquee-card">
              <img src="/hero_gadget_seller.jpg" alt="Electronics Seller" />
              <div className="marquee-card-label">Gadget Store, Computer Village</div>
            </div>
            <div className="marquee-card">
              <img src="/hero_food_trader.jpg" alt="Commodity Trader" />
              <div className="marquee-card-label">Food Vendor, Mile 12</div>
            </div>

            {/* Loop Card Set 3 (Eliminates gaps completely) */}
            <div className="marquee-card">
              <img src="/hero_boutique.jpg" alt="Nigerian Boutique" />
              <div className="marquee-card-label">Boutique Owner, Lagos</div>
            </div>
            <div className="marquee-card">
              <img src="/hero_phone_chat.jpg" alt="Ada Sales Operator Chat" />
              <div className="marquee-card-label">24/7 AI Sales Assistant</div>
            </div>
            <div className="marquee-card">
              <img src="/hero_market_fabrics.jpg" alt="Lagos Fabrics Vendor" />
              <div className="marquee-card-label">Textile Merchant, Balogun</div>
            </div>
            <div className="marquee-card">
              <img src="/hero_gadget_seller.jpg" alt="Electronics Seller" />
              <div className="marquee-card-label">Gadget Store, Computer Village</div>
            </div>
            <div className="marquee-card">
              <img src="/hero_food_trader.jpg" alt="Commodity Trader" />
              <div className="marquee-card-label">Food Vendor, Mile 12</div>
            </div>

          </div>
        </div>
      </section>

      {/* 4. Problem Statement Section (Full-Clarity Background Photo with localized Scrim) */}
      <section className="problem-statement-section">
        <img 
          src="/offline_bg.jpg" 
          alt="Nigerian retail store interior" 
          className="statement-bg-photo" 
        />
        <div className="statement-scrim"></div>
        <div className="container relative-content">
          <h2 className="editorial-quote-headline">
            When you are offline, your business stops. <span style={{ color: '#EAEAEA' }}>Cadence runs a steady, automated rhythm of customer responses and payout routing that ensures you never miss a sale.</span>
          </h2>
        </div>
      </section>

      {/* 5. How It Works - Step Cards with Specific Hover Background Fills (Fix 2) */}
      <section id="how-it-works" style={{ padding: 'var(--space-xxl) 0', backgroundColor: '#FFFFFF', borderBottom: '1px solid var(--color-hairline)' }}>
        <div className="container">
          <div className="section-header" style={{ marginBottom: 'var(--space-xl)' }}>
            <span className="mono-label">[ THE AUTOMATION LAYER ]</span>
            <h2 style={{ fontSize: '2.5rem', fontFamily: 'var(--font-display)', fontWeight: 400, marginTop: 'var(--space-xs)' }}>
              How Cadence Operates
            </h2>
          </div>

          <div className="how-card-layout-grid">
            <div className="step-glow-card card-blue">
              <div className="num-square">01</div>
              <h3 className="card-header-title">Connect Catalog & Bank</h3>
              <p className="card-desc">
                Onboard in 2 minutes: write your shop name, add items (price, stock count, picture), and input your payout bank. Ada restricts her actions strictly to your catalog database.
              </p>
              <div className="card-footer">
                <span className="card-arrow">→</span>
              </div>
            </div>
            
            <div className="step-glow-card card-brown">
              <div className="num-square">02</div>
              <h3 className="card-header-title">Share Shop & Telegram Links</h3>
              <p className="card-desc">
                Embed your custom link in your Instagram bio, WhatsApp, or market stall. Buyers chat with Ada instantly on the web portal or via our Telegram customer channel.
              </p>
              <div className="card-footer">
                <span className="card-arrow">→</span>
              </div>
            </div>

            <div className="step-glow-card card-yellow">
              <div className="num-square">03</div>
              <h3 className="card-header-title">Watch Ada Close Sales</h3>
              <p className="card-desc">
                Ada handles client questions on sizing, checks stock, and presents your account details when they confirm. Intervene anytime using our interactive takeover desk.
              </p>
              <div className="card-footer">
                <span className="card-arrow">→</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 6. Testimonial Section */}
      <section id="testimonial" className="testimonial-section-magazine">
        <div className="container magazine-testimonial-grid">
          <div className="testimonial-frame">
            <img src="/nigerian_vendor.jpg" alt="Nigerian Boutique Owner Chidi Okafor" />
          </div>
          <div className="testimonial-copy">
            <span className="quote-editorial-mark">“</span>
            <blockquote className="quote-body-text">
              Before Cadence, I was answering Instagram messages at 2 AM or losing customers to late replies. Now, Ada answers instantly, checks sizes, and hands them my bank details. I wake up to alerts of credited transfers. My sales grew by 40% in thirty days.
            </blockquote>
            <div className="quote-author-name">Chidi Okafor</div>
            <div className="quote-author-meta">Owner, Chidi's Curated Wear, Lagos</div>
          </div>
        </div>
      </section>

      {/* 7. Pricing Section (Fix 3 - Full-Clarity Backing showing terminal on right) */}
      <section id="pricing" className="pricing-outer-section">
        {/* Full-bleed absolute background photo */}
        <img 
          src="/pricing_bg.jpg" 
          alt="Retail payment counter POS card terminal background" 
          className="pricing-bg-photo" 
        />
        {/* Right-revealing Scrim overlay */}
        <div className="pricing-scrim"></div>
        
        {/* Centered White Card content */}
        <div className="container relative-content">
          <div className="pricing-glow-card">
            <span className="mono-label" style={{
              backgroundColor: 'var(--color-signal-light)',
              color: 'var(--color-signal)',
              padding: '3px 10px',
              borderRadius: '24px',
              fontSize: '0.75rem',
              display: 'inline-block',
              marginBottom: 'var(--space-sm)'
            }}>
              [ Simple Pricing ]
            </span>
            
            <h2 style={{ fontSize: '2.5rem', fontFamily: 'var(--font-display)', fontWeight: 400, color: 'var(--color-ink)' }}>The Starter Plan</h2>
            
            <div className="price-tag-value" style={{
              fontFamily: 'var(--font-display)',
              fontSize: '4.5rem',
              margin: 'var(--space-sm) 0',
              display: 'flex',
              alignItems: 'baseline',
              justifyContent: 'center',
              color: 'var(--color-ink)'
            }}>
              ₦1,000<span style={{ fontSize: '1.1rem', fontFamily: 'var(--font-body)', color: 'var(--color-graphite)' }}>/month</span>
            </div>
            
            <p style={{ color: 'var(--color-graphite)', fontSize: '0.9rem', marginBottom: 'var(--space-md)' }}>
              14-day free trial. Cancel anytime. No credit card required.
            </p>

            <ul style={{
              listStyle: 'none',
              textAlign: 'left',
              maxWidth: '320px',
              margin: '0 auto var(--space-lg) auto',
              display: 'flex',
              flexDirection: 'column',
              gap: '10px',
              fontSize: '0.95rem',
              color: 'var(--color-ink)'
            }}>
              <li style={{ display: 'flex', gap: '8px' }}>🚀 Unlimited buyer conversations</li>
              <li style={{ display: 'flex', gap: '8px' }}>📦 Full inventory tracking & database alerts</li>
              <li style={{ display: 'flex', gap: '8px' }}>🤖 Telegram customer channel support</li>
              <li style={{ display: 'flex', gap: '8px' }}>💼 Merchant control takeover inbox</li>
            </ul>

            <Link href="/onboarding" className="btn-primary" style={{ width: '100%', justifyContent: 'center', padding: '0.85rem' }}>
              Deploy Your Sales Operator Now
            </Link>
          </div>
        </div>
      </section>

      {/* 8. Footer */}
      <footer style={{
        padding: 'var(--space-xl) 0',
        borderTop: '1px solid var(--color-hairline)',
        backgroundColor: '#FFFFFF',
        color: 'var(--color-graphite)',
        fontSize: '0.85rem'
      }}>
        <div className="container" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span className="logo" style={{ fontSize: '1.35rem' }}>Cadence</span>
          <div>© 2026 Cadence Inc. Built for the Gemini XPRIZE Hackathon. All rights reserved.</div>
        </div>
      </footer>

      {/* Landing Page Styling Overrides */}
      <style jsx global>{`
        html {
          scroll-behavior: smooth;
          scroll-padding-top: 5rem;
        }
      `}</style>
      <style jsx>{`
        /* Fix 4 - Full-Width Solid Navigation Bar */
        .capsule-nav-container {
          position: fixed;
          top: 0;
          left: 0;
          width: 100%;
          height: 70px;
          background-color: #FFFFFF; /* Opaque white background */
          border-bottom: 1px solid var(--color-hairline);
          z-index: 9999;
          display: flex;
          justify-content: center;
          align-items: center;
        }
        .capsule-nav-inner {
          width: 100%;
          max-width: 1100px;
          padding: 0 var(--space-md);
          display: flex;
          justify-content: space-between;
          align-items: center;
          background-color: transparent !important;
          border: none !important;
          border-radius: 0 !important;
          box-shadow: none !important;
        }
        .capsule-links {
          display: flex;
          gap: 1.5rem;
          align-items: center;
        }
        @media (max-width: 768px) {
          .capsule-links {
            display: none;
          }
        }
        .nav-item {
          font-size: 0.85rem;
          font-weight: 500;
          color: var(--color-graphite);
          padding: 4px 8px;
          border-radius: 12px;
          text-decoration: none;
        }
        .nav-item:hover {
          color: var(--color-ink);
        }
        .highlight-link {
          color: var(--color-signal);
          font-weight: 600;
          background-color: var(--color-signal-light);
        }

        /* Hero Section - Full Cover Photo & Scrim */
        .hero-section {
          padding: 7.5rem 0 var(--space-xxl) 0;
          position: relative;
          overflow: hidden;
          min-height: 100vh;
          display: flex;
          align-items: center;
        }
        .hero-bg-photo {
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          object-fit: cover;
          z-index: 1;
        }
        .hero-scrim {
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: linear-gradient(
            to right, 
            rgba(19, 19, 19, 0.95) 0%, 
            rgba(19, 19, 19, 0.82) 45%, 
            rgba(19, 19, 19, 0.45) 75%, 
            rgba(19, 19, 19, 0.15) 100%
          );
          z-index: 2;
        }
        @media (max-width: 960px) {
          .hero-scrim {
            background: linear-gradient(
              to bottom, 
              rgba(19, 19, 19, 0.98) 0%, 
              rgba(19, 19, 19, 0.85) 60%, 
              rgba(19, 19, 19, 0.3) 100%
            );
          }
          .hero-section {
            padding: 6.5rem 0 var(--space-xl) 0;
          }
        }
        .hero-layout-grid {
          display: grid;
          grid-template-columns: 1.15fr 0.85fr;
          gap: var(--space-xl);
          align-items: center;
          position: relative;
          z-index: 3;
        }
        @media (max-width: 960px) {
          .hero-layout-grid {
            grid-template-columns: 1fr;
            gap: var(--space-lg);
          }
        }
        
        /* Fix 1 - Hero spacing width adjustments (Desktop only nudge) */
        @media (min-width: 961px) {
          .hero-nudge-left {
            transform: translateX(-30px);
          }
          .hero-nudge-right {
            transform: translateX(30px);
          }
        }

        .hero-text-content {
          color: #FFFFFF;
        }
        .hero-headline {
          font-size: clamp(2.3rem, 5vw, 4.25rem);
          font-family: var(--font-display);
          line-height: 1.15;
          letter-spacing: -0.02em;
          color: #FFFFFF;
          margin-bottom: var(--space-md);
        }
        .hero-headline em {
          font-style: italic;
          font-weight: 400;
        }
        .hero-subtext {
          font-size: 1.125rem;
          color: #F2F1EE;
          max-width: 540px;
          margin-bottom: var(--space-lg);
          line-height: 1.6;
        }
        .hero-action-row {
          display: flex;
          gap: var(--space-sm);
        }
        .btn-secondary-light {
          background-color: rgba(255, 255, 255, 0.15);
          color: #FFFFFF;
          border: 1px solid rgba(255, 255, 255, 0.3);
          border-radius: 4px;
          padding: 0.5rem 1.25rem;
          font-size: 0.9rem;
          font-weight: 600;
          display: inline-flex;
          align-items: center;
          cursor: pointer;
          transition: background-color 0.2s ease, border-color 0.2s ease;
          text-decoration: none;
        }
        .btn-secondary-light:hover {
          background-color: rgba(255, 255, 255, 0.25);
          border-color: #FFFFFF;
        }
        .timeline-solid-card {
          background-color: #FFFFFF;
          border: 1px solid var(--color-hairline);
          border-radius: 6px;
          box-shadow: 0 10px 40px rgba(0,0,0,0.15);
        }

        /* 3. Moving Carousel - Flat Uniform Row */
        .carousel-outer-section {
          padding: var(--space-xl) 0;
          background-color: #FFFFFF;
        }
        .marquee-wrapper {
          overflow: hidden;
          width: 100%;
          border-top: 1px solid var(--color-hairline);
          border-bottom: 1px solid var(--color-hairline);
          padding: 2.5rem 0;
          position: relative;
        }
        .marquee-track {
          display: flex;
          width: max-content;
          gap: 1.75rem;
          animation: loop-marquee 32s linear infinite;
        }
        .marquee-wrapper:hover .marquee-track {
          animation-play-state: paused;
        }
        .marquee-card {
          width: 250px;
          flex-shrink: 0;
          position: relative;
          border-radius: 8px;
          overflow: hidden;
          border: 1px solid var(--color-hairline);
          aspect-ratio: 2/3;
          box-shadow: 0 4px 15px rgba(0,0,0,0.03);
          transition: transform 0.4s cubic-bezier(0.16, 1, 0.3, 1), box-shadow 0.4s ease;
          transform: none !important; /* Flat row - forbidden rotation removed */
        }
        .marquee-card img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }
        .marquee-card:hover {
          transform: translateY(-8px) !important;
          box-shadow: 0 12px 30px rgba(0,0,0,0.09);
        }
        .marquee-card-label {
          position: absolute;
          bottom: 0;
          left: 0;
          right: 0;
          background: linear-gradient(to top, rgba(0,0,0,0.85) 0%, rgba(0,0,0,0) 100%);
          color: #FFFFFF;
          padding: 2rem 1rem 1rem 1rem;
          font-size: 0.8rem;
          font-weight: 500;
        }
        @keyframes loop-marquee {
          0% { transform: translateX(0); }
          100% { transform: translateX(-33.3333%); }
        }

        /* 4. Problem Statement - Full Photo & Scrim */
        .problem-statement-section {
          padding: 8rem 0;
          position: relative;
          overflow: hidden;
        }
        .statement-bg-photo {
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          object-fit: cover;
          z-index: 1;
        }
        .statement-scrim {
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: linear-gradient(rgba(19, 19, 19, 0.86), rgba(19, 19, 19, 0.86));
          z-index: 2;
        }
        .relative-content {
          position: relative;
          z-index: 3;
        }
        .editorial-quote-headline {
          font-family: var(--font-display);
          font-size: clamp(2.1rem, 4vw, 3.5rem);
          line-height: 1.2;
          max-width: 960px;
          color: #FFFFFF;
          font-weight: 400;
        }

        /* Fix 2 - 'How Cadence Operates' step Cards */
        .how-card-layout-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: var(--space-lg);
        }
        @media (max-width: 768px) {
          .how-card-layout-grid {
            grid-template-columns: 1fr;
            gap: var(--space-md);
          }
        }
        .step-glow-card {
          background-color: #FFFFFF; /* White card at rest */
          border: 1px solid var(--color-hairline);
          border-radius: 8px;
          padding: 2.25rem 2rem;
          display: flex;
          flex-direction: column;
          min-height: 340px;
          box-shadow: 0 4px 20px rgba(0, 0, 0, 0.01);
          cursor: pointer;
          position: relative;
          color: var(--color-ink);
          transition: background-color 0.35s cubic-bezier(0.16, 1, 0.3, 1), 
                      color 0.35s cubic-bezier(0.16, 1, 0.3, 1),
                      transform 0.35s cubic-bezier(0.16, 1, 0.3, 1),
                      border-color 0.35s cubic-bezier(0.16, 1, 0.3, 1),
                      box-shadow 0.35s cubic-bezier(0.16, 1, 0.3, 1);
        }
        .step-glow-card:hover {
          transform: translateY(-8px);
          box-shadow: 0 12px 30px rgba(0,0,0,0.08);
        }

        /* Mono number square */
        .num-square {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 32px;
          height: 32px;
          background-color: var(--color-ink); /* Solid dark square at rest */
          color: #FFFFFF;
          font-family: var(--font-mono);
          font-size: 0.85rem;
          font-weight: bold;
          border-radius: 2px;
          margin-bottom: var(--space-md);
          transition: background-color 0.35s ease, color 0.35s ease;
        }

        /* Card Text rest styling */
        .card-header-title {
          font-family: var(--font-body);
          font-weight: 700;
          font-size: 1.25rem;
          margin-bottom: 0.5rem;
          color: var(--color-ink);
          transition: color 0.35s ease;
        }
        .card-desc {
          font-size: 0.9rem;
          color: var(--color-graphite);
          line-height: 1.6;
          margin: 0 0 1.5rem 0;
          transition: color 0.35s ease;
        }
        
        /* Footer arrow */
        .card-footer {
          margin-top: auto;
          display: flex;
          align-items: center;
        }
        .card-arrow {
          font-size: 1.5rem;
          line-height: 1;
          color: var(--color-ink);
          transition: color 0.35s ease, transform 0.35s ease;
        }
        .step-glow-card:hover .card-arrow {
          transform: translateX(6px);
        }

        /* Specific Hover solid fills */
        /* Card 01 - Blue Hover */
        .card-blue:hover {
          background-color: #0F6CBD !important;
          border-color: #0F6CBD !important;
          color: #FFFFFF !important;
        }
        .card-blue:hover .card-header-title { color: #FFFFFF !important; }
        .card-blue:hover .card-desc { color: #FFFFFF !important; }
        .card-blue:hover .num-square {
          background-color: #FFFFFF !important;
          color: #0F6CBD !important;
        }
        .card-blue:hover .card-arrow {
          color: #FFFFFF !important;
        }

        /* Card 02 - Brown Hover */
        .card-brown:hover {
          background-color: #8D7B68 !important;
          border-color: #8D7B68 !important;
          color: #FFFFFF !important;
        }
        .card-brown:hover .card-header-title { color: #FFFFFF !important; }
        .card-brown:hover .card-desc { color: #FFFFFF !important; }
        .card-brown:hover .num-square {
          background-color: #FFFFFF !important;
          color: #8D7B68 !important;
        }
        .card-brown:hover .card-arrow {
          color: #FFFFFF !important;
        }

        /* Card 03 - Yellow Hover (Near-black text for contrast) */
        .card-yellow:hover {
          background-color: #F1C40F !important;
          border-color: #F1C40F !important;
          color: #131313 !important; /* Near-black text satisfies contrast */
        }
        .card-yellow:hover .card-header-title { color: #131313 !important; }
        .card-yellow:hover .card-desc { color: #131313 !important; }
        .card-yellow:hover .num-square {
          background-color: #131313 !important;
          color: #F1C40F !important;
        }
        .card-yellow:hover .card-arrow {
          color: #131313 !important;
        }

        /* Testimonial magazine section */
        .testimonial-section-magazine {
          background-color: #FFFFFF;
          border-top: 1px solid var(--color-hairline);
          border-bottom: 1px solid var(--color-hairline);
          padding: var(--space-xxl) 0;
        }
        .magazine-testimonial-grid {
          display: grid;
          grid-template-columns: 0.85fr 1.15fr;
          gap: var(--space-xl);
          align-items: center;
        }
        @media (max-width: 840px) {
          .magazine-testimonial-grid {
            grid-template-columns: 1fr;
            gap: var(--space-lg);
          }
        }
        .testimonial-frame {
          border-radius: 8px;
          overflow: hidden;
          aspect-ratio: 4/5;
          border: 1px solid var(--color-hairline);
        }
        .testimonial-frame img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }
        .quote-editorial-mark {
          font-family: var(--font-display);
          font-size: 6rem;
          line-height: 0.1;
          color: var(--color-signal);
          display: block;
          margin-bottom: var(--space-sm);
        }
        .quote-body-text {
          font-family: var(--font-display);
          font-size: clamp(1.8rem, 3.2vw, 2.75rem);
          line-height: 1.25;
          margin-bottom: var(--space-md);
          font-style: italic;
          color: var(--color-ink);
        }
        .quote-author-name {
          font-weight: 600;
          font-size: 1.05rem;
          color: var(--color-ink);
        }
        .quote-author-meta {
          font-family: var(--font-mono);
          font-size: 0.75rem;
          color: var(--color-graphite);
          margin-top: 2px;
        }

        /* Fix 3 - Pricing Section transparent background + visible backdrop */
        .pricing-outer-section {
          padding: 8rem 0;
          position: relative;
          overflow: hidden;
          background: transparent !important; /* Transparent section background */
        }
        .pricing-bg-photo {
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          object-fit: cover;
          z-index: 1;
        }
        .pricing-scrim {
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          /* Dark on the left/center (under card) and transparent on the right where the device is */
          background: linear-gradient(
            to right, 
            rgba(19, 19, 19, 0.9) 0%, 
            rgba(19, 19, 19, 0.8) 50%, 
            rgba(19, 19, 19, 0.3) 100%
          );
          z-index: 2;
        }
        .pricing-glow-card {
          max-width: 580px;
          margin: 0 auto;
          background-color: #FFFFFF;
          border: 1px solid var(--color-hairline);
          border-radius: 8px;
          padding: var(--space-xl) var(--space-lg);
          box-shadow: 0 10px 40px rgba(0,0,0,0.2);
          transition: border-color 0.4s ease, box-shadow 0.4s ease;
          position: relative;
          z-index: 3;
        }
        .pricing-glow-card:hover {
          border-color: var(--color-signal);
          box-shadow: 0 10px 45px rgba(15, 108, 189, 0.12);
        }
      `}</style>

    </div>
  );
}
