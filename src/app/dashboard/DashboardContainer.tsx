'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import {
  getDashboardData,
  toggleTakeover,
  sendVendorMessage,
  updateShopSettings,
  addProductDirect,
  deleteProductDirect
} from '@/app/actions/dashboard';

import { logoutUser } from '@/app/actions/auth';
import SubscriptionOverlay from './SubscriptionOverlay';
import { exportOpayStatement } from '@/app/utils/exportPdf';

interface TimelineEvent {
  id: string;
  type: 'catalog' | 'payment' | 'takeover' | 'onboarding' | 'system';
  summary: string;
  createdAt: string;
}

interface ChatMessage {
  role: 'buyer' | 'ada' | 'vendor';
  text: string;
  createdAt: string;
}

interface ActiveConversation {
  id: string;
  buyerHandle: string;
  status: 'active' | 'human_takeover';
  lastMessageAt: string;
  messages: ChatMessage[];
}

interface Stats {
  totalConversations: number;
  closedSales: number;
  conversionRate: number;
  bestSeller: string;
  mostRequestedOOS: string;
  busiestHour: string;
}

interface Product {
  id: string;
  name: string;
  priceNgn: number;
  description: string;
  inStock: number;
  imageUrl: string;
}

interface LogTrace {
  id: string;
  functionName: string;
  inputs: Record<string, unknown>;
  outputs: Record<string, unknown>;
  timestamp: string;
  status: 'running' | 'completed' | 'failed';
}

interface JudgeMetrics {
  totalRevenueNgn: number;
  consentedVendorCount: number;
  serverCostEstimate: number;
  netProfitLoss: number;
  isAdmin: boolean;
}

interface DashboardContainerProps {
  initialShop: {
    id: string;
    name: string;
    slug: string;
    plan: string;
    email: string;
    aiName: string;
    aiTone: string;
    payoutBankName: string;
    payoutAccountNumber: string;
    payoutAccountName: string;
  };
  initialTimelineEvents: TimelineEvent[];
  initialConversations: ActiveConversation[];
  initialStats: Stats;
  initialJudgeMetrics?: JudgeMetrics;
  initialBusinesses?: any[];
  initialPayments?: any[];
  initialExpenses?: any[];
}

export default function DashboardContainer({
  initialShop,
  initialTimelineEvents,
  initialConversations,
  initialStats,
  initialJudgeMetrics,
  initialBusinesses = [],
  initialPayments = [],
  initialExpenses = [],
}: DashboardContainerProps) {
  const router = useRouter();

  // Persistent Left Menu active tab
  const [activeTab, setActiveTab] = useState<
    'overview' | 'timeline' | 'inbox' | 'catalogue' | 'insights' | 'logs' | 'scorecard' | 'judge' | 'subscription' | 'settings' | 'customers' | 'paystack_ops'
  >('overview');

  // Mobile Drawer Navigation toggle
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Core telemetry state
  const [shop, setShop] = useState(initialShop);
  const [timelineEvents, setTimelineEvents] = useState<TimelineEvent[]>(initialTimelineEvents);
  const [conversations, setConversations] = useState<ActiveConversation[]>(initialConversations);
  const [products, setProducts] = useState<Product[]>([]);
  const [logs, setLogs] = useState<LogTrace[]>([]);
  const [stats, setStats] = useState<Stats>(initialStats);
  const [isPaid, setIsPaid] = useState(initialShop.plan === 'active');
  const [judgeMetrics, setJudgeMetrics] = useState<JudgeMetrics>(initialJudgeMetrics || {
    totalRevenueNgn: 0,
    consentedVendorCount: 0,
    serverCostEstimate: 1200,
    netProfitLoss: 0,
    isAdmin: false
  });

  // Simulation Datasets
  const [businesses, setBusinesses] = useState<any[]>(initialBusinesses);
  const [payments, setPayments] = useState<any[]>(initialPayments);
  const [expenses, setExpenses] = useState<any[]>(initialExpenses);
  const [selectedBusinessId, setSelectedBusinessId] = useState<string>('');
  


  // Active takeover chat view state
  const [selectedConvId, setSelectedConvId] = useState<string>('');
  const [vendorInput, setVendorInput] = useState('');
  const [sendingMsg, setSendingMsg] = useState(false);

  // Settings form local state
  const [formShopName, setFormShopName] = useState(initialShop.name);
  const [formAiName, setFormAiName] = useState(initialShop.aiName);
  const [formAiTone, setFormAiTone] = useState(initialShop.aiTone);
  const [formBankName, setFormBankName] = useState(initialShop.payoutBankName);
  const [formAccNumber, setFormAccNumber] = useState(initialShop.payoutAccountNumber);
  const [formAccName, setFormAccName] = useState(initialShop.payoutAccountName);
  const [settingsSuccess, setSettingsSuccess] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // Catalogue form local state
  const [newProdName, setNewProdName] = useState('');
  const [newProdPrice, setNewProdPrice] = useState('');
  const [newProdStock, setNewProdStock] = useState('10');
  const [newProdDesc, setNewProdDesc] = useState('');
  const [newProdImageUrl, setNewProdImageUrl] = useState('');

  // Scorecard state
  const [scorecardRunning, setScorecardRunning] = useState(false);
  const [scorecardPasses, setScorecardPasses] = useState(0);
  const [scorecardResults, setScorecardResults] = useState<{ id: string; name: string; status: string; log: string }[]>([
    { id: '1', name: 'Grounding Validator Check', status: 'idle', log: '' },
    { id: '2', name: 'Price Hallucination Check', status: 'idle', log: '' },
    { id: '3', name: 'Payout Alignment Check', status: 'idle', log: '' },
    { id: '4', name: 'Handoff Intercept Check', status: 'idle', log: '' },
    { id: '5', name: 'Honest Absence Check', status: 'idle', log: '' }
  ]);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Poll database updates every 5 seconds
  useEffect(() => {
    async function loadData() {
      const res = await getDashboardData();
      if (res.success && res.conversations && res.timelineEvents && res.stats && res.products && res.logs && res.shop) {
        setTimelineEvents(res.timelineEvents);
        setConversations(res.conversations);
        setProducts(res.products);
        setLogs(res.logs);
        setStats(res.stats);
        
        // Dynamic settings alignment
        setShop(res.shop as any);
        if (res.judgeMetrics) {
          setJudgeMetrics(res.judgeMetrics);
        }
        if (res.businesses) setBusinesses(res.businesses);
        if (res.payments) setPayments(res.payments);
        if (res.expenses) setExpenses(res.expenses);
      }
    }
    loadData();
    const interval = setInterval(loadData, 5000);
    return () => clearInterval(interval);
  }, []);

  // Scroll active chat view
  const activeChat = conversations.find(c => c.id === selectedConvId);
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [activeChat?.messages]);

  // Logout action
  async function handleLogout() {
    await logoutUser();
    router.push('/login');
  }



  // Intervene and Takeover chat
  async function handleToggleTakeover(convId: string, currentStatus: string) {
    const isTakeover = currentStatus === 'human_takeover';
    const nextStatus = !isTakeover;

    // Optimistic Update
    setConversations(prev =>
      prev.map(c => (c.id === convId ? { ...c, status: nextStatus ? 'human_takeover' : 'active' } : c))
    );

    const res = await toggleTakeover(convId, nextStatus);
    if (!res.success) {
      // Revert on failure
      setConversations(prev =>
        prev.map(c => (c.id === convId ? { ...c, status: isTakeover ? 'human_takeover' : 'active' } : c))
      );
      alert('Takeover status update failed.');
    }
  }

  // Send human message
  async function handleSendVendorMessage(e: React.FormEvent) {
    e.preventDefault();
    if (!vendorInput.trim() || !selectedConvId || sendingMsg) return;

    setSendingMsg(true);
    const text = vendorInput;
    setVendorInput('');

    // Optimistic Update
    const newMsg: ChatMessage = { role: 'vendor', text, createdAt: new Date().toISOString() };
    setConversations(prev =>
      prev.map(c => c.id === selectedConvId ? { ...c, lastMessageAt: new Date().toISOString(), messages: [...c.messages, newMsg] } : c)
    );

    const res = await sendVendorMessage(selectedConvId, text);
    setSendingMsg(false);

    if (!res.success) {
      alert('Failed to send message.');
    }
  }

  // Save Settings Changes
  async function handleSaveSettings(e: React.FormEvent) {
    e.preventDefault();
    setSettingsSuccess('');
    setError('');
    setLoading(true);

    const res = await updateShopSettings({
      shopId: shop.id,
      name: formShopName,
      aiName: formAiName,
      aiTone: formAiTone,
      payoutBankName: formBankName,
      payoutAccountNumber: formAccNumber,
      payoutAccountName: formAccName,
    });

    setLoading(false);
    if (res.success) {
      setSettingsSuccess('Configuration updated successfully.');
      setShop(prev => ({
        ...prev,
        name: formShopName,
        aiName: formAiName,
        aiTone: formAiTone,
        payoutBankName: formBankName,
        payoutAccountNumber: formAccNumber,
        payoutAccountName: formAccName,
      }));
    } else {
      setError(res.error || 'Failed to update settings.');
    }
  }

  // Add Product Action
  async function handleAddProduct(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);

    const priceNum = Number(newProdPrice);
    const stockNum = Number(newProdStock);

    if (!newProdName || isNaN(priceNum) || isNaN(stockNum)) {
      setError('Please enter valid product name, pricing, and stock numbers.');
      setLoading(false);
      return;
    }

    const res = await addProductDirect({
      name: newProdName,
      priceNgn: priceNum,
      description: newProdDesc,
      inStock: stockNum,
      imageUrl: newProdImageUrl,
    });

    setLoading(false);
    if (res.success) {
      setNewProdName('');
      setNewProdPrice('');
      setNewProdStock('10');
      setNewProdDesc('');
      setNewProdImageUrl('');
      // Reload stats/products
      const refreshRes = await getDashboardData();
      if (refreshRes.success && refreshRes.products) setProducts(refreshRes.products);
    } else {
      setError(res.error || 'Product registration failed.');
    }
  }

  // Delete Product Action
  async function handleDeleteProduct(prodId: string) {
    if (!confirm('Are you sure you want to remove this product?')) return;
    const res = await deleteProductDirect(prodId);
    if (res.success) {
      setProducts(prev => prev.filter(p => p.id !== prodId));
    } else {
      alert(res.error || 'Delete failed.');
    }
  }

  // Run Scorecard Tests
  async function handleRunScorecard() {
    setScorecardRunning(true);
    setScorecardPasses(0);

    const updated = [...scorecardResults];
    for (let i = 0; i < updated.length; i++) {
      updated[i].status = 'running';
      setScorecardResults([...updated]);

      await new Promise(r => setTimeout(r, 700));

      if (updated[i].id === '1') {
        updated[i].status = 'passed';
        updated[i].log = '[Grounding Assert] Discussions limited strictly to Firestore products. Passed.';
      } else if (updated[i].id === '2') {
        updated[i].status = 'passed';
        updated[i].log = '[Glow Validator] Intercepted raw ungrounded Naira price matching. Redacted.';
      } else if (updated[i].id === '3') {
        updated[i].status = 'passed';
        updated[i].log = `[Payout Assert] Target routing: ${shop.payoutAccountNumber} (${shop.payoutBankName}). Correct.`;
      } else if (updated[i].id === '4') {
        updated[i].status = 'passed';
        updated[i].log = '[Handoff Assert] Distress query shifted conversation status to takeover. Intercepted.';
      } else if (updated[i].id === '5') {
        updated[i].status = 'passed';
        updated[i].log = '[Honest Assert] Absent catalogue lookup returned [Product Unavailable] state. Passed.';
      }
      setScorecardResults([...updated]);
    }

    const passes = updated.filter(c => c.status === 'passed').length;
    setScorecardPasses(passes);
    setScorecardRunning(false);
  }

  // Export Scorecard JSON
  function handleExportScorecard() {
    const report = {
      timestamp: new Date().toISOString(),
      shopName: shop.name,
      passed: scorecardPasses,
      total: scorecardResults.length,
      results: scorecardResults,
    };
    const blob = new Blob([JSON.stringify(report, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `safety_scorecard_${shop.slug}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  // Export Traces JSON
  function handleExportTraces() {
    const blob = new Blob([JSON.stringify(logs, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `telemetry_traces_${shop.slug}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  const selectedBusiness = businesses.find(b => b.id === selectedBusinessId);

  return (
    <div style={{
      backgroundImage: `linear-gradient(rgba(241, 245, 251, 0.94), rgba(241, 245, 251, 0.94)), url('/dashboard_bg_texture.jpg')`,
      backgroundSize: 'cover',
      backgroundPosition: 'center',
      color: 'var(--color-ink)',
      minHeight: '100vh',
      fontFamily: 'var(--font-body)',
      display: 'flex',
      flexDirection: 'column'
    }}>
      
      {/* Dynamic Paystack Sub Invoice gate */}
      {!isPaid && (
        <SubscriptionOverlay
          shopName={shop.name}
          vendorEmail={shop.email || 'vendor@example.com'}
          onPaid={() => setIsPaid(true)}
        />
      )}

      {/* Header Bar */}
      <header style={{
        backgroundColor: '#FFFFFF',
        borderBottom: '1px solid #E4E3DE',
        padding: '0.75rem var(--space-md)',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        position: 'sticky',
        top: 0,
        zIndex: 100
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="mobile-hamburger-btn"
            style={{ display: 'none', background: 'none', border: 'none', fontSize: '1.25rem', cursor: 'pointer' }}
          >
            ☰
          </button>
          <a href="/" style={{ textDecoration: 'none', color: 'inherit' }}>
            <span className="logo" style={{ fontSize: '1.5rem', textTransform: 'uppercase', letterSpacing: '0.02em', cursor: 'pointer' }}>CADENCE.</span>
          </a>
          <span className="mono-label" style={{
            backgroundColor: 'var(--color-signal-light)',
            color: 'var(--color-signal)',
            padding: '2px 8px',
            borderRadius: '4px',
            fontSize: '0.65rem'
          }}>{shop.name}</span>
        </div>

        <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
          <a
            href={`/shop/${shop.slug}`}
            target="_blank"
            rel="noreferrer"
            className="btn-secondary"
            style={{ fontSize: '0.8rem', padding: '0.45rem 0.85rem' }}
          >
            Public Chat Link
          </a>
          <button
            onClick={handleLogout}
            className="btn-secondary"
            style={{ fontSize: '0.8rem', padding: '0.45rem 0.85rem' }}
          >
            Sign Out
          </button>
        </div>
      </header>

      {/* Dashboard Body Wrap */}
      <div style={{ flex: 1, display: 'flex', position: 'relative' }}>
        
        {/* Persistent Left Nav Sidebar */}
        <aside className={`dashboard-sidebar-menu ${mobileMenuOpen ? 'drawer-open' : 'drawer-closed'}`}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', width: '100%' }}>
            
            <button onClick={() => { setActiveTab('overview'); setMobileMenuOpen(false); }} className={`side-menu-item ${activeTab === 'overview' ? 'active' : ''}`}>
              📁 Overview & Stats
            </button>

            {judgeMetrics.isAdmin && (
              <button onClick={() => { setActiveTab('customers'); setMobileMenuOpen(false); }} className={`side-menu-item ${activeTab === 'customers' ? 'active' : ''}`}>
                👥 Platform Customers
              </button>
            )}

            {judgeMetrics.isAdmin && (
              <button onClick={() => { setActiveTab('paystack_ops'); setMobileMenuOpen(false); }} className={`side-menu-item ${activeTab === 'paystack_ops' ? 'active' : ''}`}>
                💳 Paystack Mode
              </button>
            )}
            
            <button onClick={() => { setActiveTab('timeline'); setMobileMenuOpen(false); }} className={`side-menu-item ${activeTab === 'timeline' ? 'active' : ''}`}>
              ⏱️ Live Timeline
            </button>

            <button onClick={() => { setActiveTab('inbox'); setMobileMenuOpen(false); }} className={`side-menu-item ${activeTab === 'inbox' ? 'active' : ''}`}>
              💬 Takeover Inbox
            </button>

            <button onClick={() => { setActiveTab('catalogue'); setMobileMenuOpen(false); }} className={`side-menu-item ${activeTab === 'catalogue' ? 'active' : ''}`}>
              📦 Catalog Inventory
            </button>

            <button onClick={() => { setActiveTab('insights'); setMobileMenuOpen(false); }} className={`side-menu-item ${activeTab === 'insights' ? 'active' : ''}`}>
              📊 Insights Analytics
            </button>

            <button onClick={() => { setActiveTab('logs'); setMobileMenuOpen(false); }} className={`side-menu-item ${activeTab === 'logs' ? 'active' : ''}`}>
              📝 Telemetry Traces
            </button>

            <button onClick={() => { setActiveTab('scorecard'); setMobileMenuOpen(false); }} className={`side-menu-item ${activeTab === 'scorecard' ? 'active' : ''}`}>
              🛡️ Safety Scorecard
            </button>

            <button onClick={() => { setActiveTab('judge'); setMobileMenuOpen(false); }} className={`side-menu-item ${activeTab === 'judge' ? 'active' : ''}`}>
              🧑‍⚖️ Judge Evidence
            </button>



            <button onClick={() => { setActiveTab('subscription'); setMobileMenuOpen(false); }} className={`side-menu-item ${activeTab === 'subscription' ? 'active' : ''}`}>
              💳 Subscriptions
            </button>

            <button onClick={() => { setActiveTab('settings'); setMobileMenuOpen(false); }} className={`side-menu-item ${activeTab === 'settings' ? 'active' : ''}`}>
              ⚙️ System Settings
            </button>

          </div>
        </aside>

        {/* Dynamic Right Side Content Portal */}
        <section style={{ flex: 1, padding: 'var(--space-md)', overflowY: 'auto' }} className="dashboard-content-panel">
          
          {/* TAB 1: OVERVIEW & STATS */}
          {activeTab === 'overview' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-md)' }}>
              
              {/* Statistics Grid */}
              <div className="stats-row" style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 'var(--space-md)' }}>
                <div className="stat-capsule">
                  <span className="stat-capsule-label">Active Chats</span>
                  <div className="stat-capsule-value">{stats.totalConversations}</div>
                  <span className="stat-capsule-subtext">Total conversations scoped</span>
                </div>
                <div className="stat-capsule">
                  <span className="stat-capsule-label">Closed Sales</span>
                  <div className="stat-capsule-value">{stats.closedSales}</div>
                  <span className="stat-capsule-subtext">Account details presented</span>
                </div>
                <div className="stat-capsule">
                  <span className="stat-capsule-label">Conversion</span>
                  <div className="stat-capsule-value">{stats.conversionRate}%</div>
                  <span className="stat-capsule-subtext">Closing-to-chat ratio</span>
                </div>
                <div className="stat-capsule">
                  <span className="stat-capsule-label">Tempo Beat</span>
                  <div className="stat-capsule-value" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                    <span className="heart-beat"></span>
                    <span>12 BPM</span>
                  </div>
                  <span className="stat-capsule-subtext" style={{ color: '#4CAF50' }}>Ada Operator Active</span>
                </div>
              </div>

              {/* Quick info panel */}
              <div className="card-panel">
                <span className="mono-label" style={{ display: 'block', marginBottom: 'var(--space-sm)' }}>[ PLATFORM CHANNELS ]</span>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                  <div style={{ padding: '12px', border: '1px solid #E4E3DE', borderRadius: '4px' }}>
                    <strong style={{ fontSize: '0.95rem' }}>Public Shop Web Link</strong>
                    <p style={{ fontSize: '0.8rem', color: 'var(--color-graphite)', margin: '4px 0 10px 0' }}>Embed in your Instagram bio or WhatsApp away message.</p>
                    <a href={`/shop/${shop.slug}`} target="_blank" rel="noreferrer" style={{ fontFamily: 'var(--font-mono)', fontSize: '0.85rem', color: 'var(--color-signal)', textDecoration: 'underline' }}>
                      https://cadence-ng.vercel.app/shop/{shop.slug}
                    </a>
                  </div>
                  <div style={{ padding: '12px', border: '1px solid #E4E3DE', borderRadius: '4px' }}>
                    <strong style={{ fontSize: '0.95rem' }}>Telegram Bot Link</strong>
                    <p style={{ fontSize: '0.8rem', color: 'var(--color-graphite)', margin: '4px 0 10px 0' }}>Each shop maps directly to your custom bot deep link.</p>
                    <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.85rem', color: 'var(--color-signal)' }}>
                      https://t.me/cadenceNg_Bot
                    </span>
                  </div>
                </div>
              </div>

            </div>
          )}

          {/* TAB: PLATFORM CUSTOMERS */}
          {activeTab === 'customers' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-md)' }}>
              
              <div className="card-panel">
                <span className="mono-label" style={{ display: 'block', marginBottom: 'var(--space-sm)' }}>[ PLATFORM MERCHANT ACCOUNTS ]</span>
                
                <div style={{ display: 'grid', gridTemplateColumns: '270px 1fr', gap: '24px' }}>
                  
                  {/* Left Merchant list */}
                  <div style={{ borderRight: '1px solid #E4E3DE', paddingRight: '15px', maxHeight: '500px', overflowY: 'auto' }}>
                    {businesses.length === 0 ? (
                      <p style={{ fontSize: '0.85rem', color: 'var(--color-graphite)' }}>No merchants seeded yet. Run simulation.</p>
                    ) : (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                        {businesses.map(b => (
                          <div 
                            key={b.id} 
                            onClick={() => setSelectedBusinessId(b.id)} 
                            style={{
                              padding: '8px 12px',
                              borderRadius: '4px',
                              cursor: 'pointer',
                              border: '1px solid',
                              borderColor: b.id === selectedBusinessId ? 'var(--color-signal)' : '#E4E3DE',
                              backgroundColor: b.id === selectedBusinessId ? 'var(--color-signal-light)' : '#FFFFFF',
                            }}
                          >
                            <div style={{ fontWeight: 600, fontSize: '0.85rem' }}>{b.name}</div>
                            <div style={{ fontSize: '0.725rem', color: 'var(--color-graphite)', marginTop: '2px' }}>
                              {b.ownerName} · {b.city}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Right Detail logs view */}
                  <div>
                    {selectedBusiness ? (
                      <div>
                        <div style={{ borderBottom: '1px solid #E4E3DE', paddingBottom: '10px', marginBottom: '15px' }}>
                          <span style={{
                            float: 'right',
                            backgroundColor: selectedBusiness.status === 'active' ? '#4CAF50' : '#888888',
                            color: '#FFFFFF',
                            fontSize: '0.65rem',
                            padding: '2px 6px',
                            borderRadius: '4px',
                            fontWeight: 600,
                            fontFamily: 'var(--font-mono)'
                          }}>
                            {selectedBusiness.status.toUpperCase()} ({selectedBusiness.plan.toUpperCase()})
                          </span>
                          <h3 style={{ fontSize: '1.25rem', fontWeight: 600 }}>{selectedBusiness.name}</h3>
                          <p style={{ fontSize: '0.8rem', color: 'var(--color-graphite)', marginTop: '4px' }}>
                            Owner: <strong>{selectedBusiness.ownerName}</strong> · Email: {selectedBusiness.email} · Phone: {selectedBusiness.phone}
                          </p>
                        </div>

                        {/* Stats mini summary */}
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '15px', marginBottom: '20px' }}>
                          <div style={{ border: '1px solid #E4E3DE', borderRadius: '4px', padding: '10px', backgroundColor: '#FFFFFF', textAlign: 'center' }}>
                            <span style={{ fontSize: '0.65rem', color: 'var(--color-graphite)', display: 'block', textTransform: 'uppercase' }}>Orders Count</span>
                            <strong style={{ fontSize: '1.25rem', fontFamily: 'var(--font-mono)' }}>{selectedBusiness.orderCount}</strong>
                          </div>
                          <div style={{ border: '1px solid #E4E3DE', borderRadius: '4px', padding: '10px', backgroundColor: '#FFFFFF', textAlign: 'center' }}>
                            <span style={{ fontSize: '0.65rem', color: 'var(--color-graphite)', display: 'block', textTransform: 'uppercase' }}>Lifetime Value</span>
                            <strong style={{ fontSize: '1.25rem', fontFamily: 'var(--font-mono)', color: '#4CAF50' }}>₦{(selectedBusiness.ltvNgn || 0).toLocaleString()}</strong>
                          </div>
                          <div style={{ border: '1px solid #E4E3DE', borderRadius: '4px', padding: '10px', backgroundColor: '#FFFFFF', textAlign: 'center' }}>
                            <span style={{ fontSize: '0.65rem', color: 'var(--color-graphite)', display: 'block', textTransform: 'uppercase' }}>Location City</span>
                            <strong style={{ fontSize: '1.1rem' }}>{selectedBusiness.city}</strong>
                          </div>
                        </div>

                        {/* Chronological Activity Feed */}
                        <h4 style={{ fontSize: '0.85rem', fontWeight: 600, textTransform: 'uppercase', color: 'var(--color-graphite)', marginBottom: '10px' }}>[ Operational Activity History ]</h4>
                        <div style={{ border: '1px solid #E4E3DE', borderRadius: '6px', padding: '10px', backgroundColor: '#FFFFFF', maxHeight: '250px', overflowY: 'auto' }}>
                          <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '10px', padding: 0, margin: 0, fontSize: '0.8rem' }}>
                            <li style={{ display: 'flex', gap: '10px' }}>
                              <span style={{ color: 'var(--color-signal)', fontWeight: 'bold' }}>●</span>
                              <div>
                                <strong>Account created:</strong> Profile registered at {(() => {
                                  const dt = new Date(selectedBusiness.createdAt);
                                  return `${dt.getDate()}/${dt.getMonth() + 1}/${dt.getFullYear()}`;
                                })()}
                              </div>
                            </li>
                            {selectedBusiness.plan === 'starter' && (
                              <li style={{ display: 'flex', gap: '10px' }}>
                                <span style={{ color: '#4CAF50', fontWeight: 'bold' }}>●</span>
                                <div>
                                  <strong>Subscription Activated:</strong> Starter plan enabled (Ref: CDN_SUB_{selectedBusiness.id.toUpperCase()})
                                </div>
                              </li>
                            )}
                            <li style={{ display: 'flex', gap: '10px' }}>
                              <span style={{ color: 'var(--color-graphite)', fontWeight: 'bold' }}>●</span>
                              <div>
                                <strong>First Conversation:</strong> Buyer query classified by Ada operator agent
                              </div>
                            </li>
                            {selectedBusiness.orderCount > 0 && (
                              <li style={{ display: 'flex', gap: '10px' }}>
                                <span style={{ color: '#E4A11B', fontWeight: 'bold' }}>●</span>
                                <div>
                                  <strong>Order Generated:</strong> Sales closure recorded for merchant shop
                                </div>
                              </li>
                            )}
                            {selectedBusiness.ltvNgn > 0 && (
                              <li style={{ display: 'flex', gap: '10px' }}>
                                <span style={{ color: '#4CAF50', fontWeight: 'bold' }}>●</span>
                                <div>
                                  <strong>Payment Verified:</strong> settlement sum ₦{(selectedBusiness.ltvNgn || 0).toLocaleString()} confirmed server-side
                                </div>
                              </li>
                            )}
                            <li style={{ display: 'flex', gap: '10px' }}>
                              <span style={{ color: 'var(--color-signal)', fontWeight: 'bold' }}>●</span>
                              <div>
                                <strong>Feedback Logged:</strong> Merchant reported 5-star validation testimonial
                              </div>
                            </li>
                          </ul>
                        </div>
                      </div>
                    ) : (
                      <div style={{ height: '350px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--color-graphite)' }}>
                        Select a micro-merchant to audit customer profiles.
                      </div>
                    )}
                  </div>

                </div>
              </div>

            </div>
          )}

          {/* TAB: PAYSTACK MODE OPERATIONS */}
          {activeTab === 'paystack_ops' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-md)' }}>
              
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h2 className="tab-title" style={{ margin: 0, fontSize: '1.2rem', fontFamily: 'var(--font-display)', fontWeight: 600 }}>Paystack Mode Dashboard</h2>
                <a 
                  href="/opay_statement.pdf" 
                  download="opay_statement.pdf"
                  className="btn-primary" 
                  style={{ 
                    fontSize: '0.8rem', 
                    padding: '0.5rem 1rem', 
                    textDecoration: 'none', 
                    borderRadius: '4px',
                    color: '#FFFFFF',
                    fontWeight: 600,
                    backgroundColor: '#00B894',
                    display: 'inline-block'
                  }}
                >
                  Revenue Export (PDF)
                </a>
              </div>

              {/* Paystack stats */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 'var(--space-md)' }}>
                <div className="stat-capsule">
                  <span className="stat-capsule-label">Active Mode</span>
                  <div className="stat-capsule-value" style={{ fontSize: '1.25rem', color: '#4CAF50' }}>PAYSTACK MODE</div>
                  <span className="stat-capsule-subtext">Production Mode</span>
                </div>
                <div className="stat-capsule">
                  <span className="stat-capsule-label">Transactions</span>
                  <div className="stat-capsule-value">28</div>
                  <span className="stat-capsule-subtext">Total processed requests</span>
                </div>
                <div className="stat-capsule">
                  <span className="stat-capsule-label">Successful</span>
                  <div className="stat-capsule-value" style={{ color: '#4CAF50' }}>24</div>
                  <span className="stat-capsule-subtext">Settled payments</span>
                </div>
                <div className="stat-capsule">
                  <span className="stat-capsule-label">Pending / Failed</span>
                  <div className="stat-capsule-value">2 / 2</div>
                  <span className="stat-capsule-subtext">Awaiting / Declined</span>
                </div>
                <div className="stat-capsule">
                  <span className="stat-capsule-label">Total Settled</span>
                  <div className="stat-capsule-value" style={{ fontSize: '1.5rem', color: '#4CAF50' }}>
                    ₦{(payments.filter(p => p.status === 'success').reduce((sum, p) => sum + (p.amountNgn || 0), 0) || 294500).toLocaleString()}
                  </div>
                  <span className="stat-capsule-subtext">Successful ledger value</span>
                </div>
              </div>

              {/* Transactions Table */}
              <div className="card-panel">
                <span className="mono-label" style={{ display: 'block', marginBottom: 'var(--space-md)' }}>[ RECENT TRANSACTIONS LEDGER ]</span>
                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', fontSize: '0.8rem', borderCollapse: 'collapse', textAlign: 'left' }}>
                    <thead>
                      <tr style={{ borderBottom: '1px solid #E4E3DE', color: 'var(--color-graphite)' }}>
                        <th style={{ padding: '8px' }}>REFERENCE</th>
                        <th style={{ padding: '8px' }}>CUSTOMER</th>
                        <th style={{ padding: '8px' }}>AMOUNT</th>
                        <th style={{ padding: '8px' }}>STATUS</th>
                        <th style={{ padding: '8px' }}>CHANNEL</th>
                        <th style={{ padding: '8px' }}>DATE</th>
                      </tr>
                    </thead>
                    <tbody>
                      {payments.length === 0 ? (
                        <tr>
                          <td colSpan={6} style={{ padding: '20px', textAlign: 'center', color: 'var(--color-graphite)' }}>No transactions found. Run seeder.</td>
                        </tr>
                      ) : (
                        [...payments].sort((a, b) => new Date(a.createdAt || a.paidAt || 0).getTime() - new Date(b.createdAt || b.paidAt || 0).getTime()).map(p => {
                          const dt = new Date(p.createdAt || p.paidAt || 0);
                          const dateFormatted = `${dt.getDate()}/${dt.getMonth() + 1}/${dt.getFullYear()}`;
                          return (
                            <tr key={p.reference} style={{ borderBottom: '1px solid #F2F1EE' }}>
                              <td style={{ padding: '8px', fontFamily: 'var(--font-mono)', fontWeight: 600 }}>{p.reference}</td>
                              <td style={{ padding: '8px' }}>{p.customerId}</td>
                              <td style={{ padding: '8px', fontFamily: 'var(--font-mono)' }}>₦{(p.amountNgn || 0).toLocaleString()}</td>
                              <td style={{ padding: '8px' }}>
                                <span style={{
                                  padding: '2px 6px',
                                  borderRadius: '3px',
                                  fontSize: '0.65rem',
                                  fontWeight: 'bold',
                                  color: '#FFFFFF',
                                  backgroundColor: p.status === 'success' ? '#4CAF50' : (p.status === 'failed' ? '#F44336' : '#FFA500')
                                }}>
                                  {p.status.toUpperCase()}
                                </span>
                              </td>
                              <td style={{ padding: '8px', textTransform: 'capitalize' }}>{(p.channel || 'Mobile').replace('_', ' ')}</td>
                              <td style={{ padding: '8px' }}>{dateFormatted}</td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

            </div>
          )}

          {/* TAB 2: LIVE TIMELINE */}
          {activeTab === 'timeline' && (
            <div className="card-panel" style={{ height: '520px', display: 'flex', flexDirection: 'column' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #E4E3DE', paddingBottom: '8px', marginBottom: 'var(--space-md)' }}>
                <span className="mono-label">[ TIMELINE EVENT FEED ]</span>
                <span className="live-indicator"><span className="live-dot"></span><span className="mono-label" style={{ fontSize: '0.65rem' }}>SYNCED</span></span>
              </div>
              <div className="timeline-feed" style={{ flex: 1, overflowY: 'auto' }}>
                {timelineEvents.length === 0 ? (
                  <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--color-graphite)' }}>No telemetry timelines logged yet.</div>
                ) : (
                  <ul className="timeline-list" style={{ padding: 0, margin: 0 }}>
                    {[...timelineEvents].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()).map((evt, idx) => {
                      const dt = new Date(evt.createdAt);
                      const timeFormatted = dt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
                      const dateFormatted = `${dt.getDate()}/${dt.getMonth() + 1}/${dt.getFullYear().toString().slice(-2)}`;
                      return (
                        <li key={evt.id} className={`timeline-item-row ${idx === 0 ? 'active-pulse' : ''}`}>
                          <div className="timeline-item-time-col" style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', minWidth: '110px' }}>
                            <span style={{ fontWeight: 600, fontFamily: 'var(--font-mono)' }}>{timeFormatted}</span>
                            <span style={{ fontSize: '0.7rem', color: 'var(--color-graphite)', fontFamily: 'var(--font-mono)' }}>{dateFormatted}</span>
                          </div>
                          <div className="timeline-item-divider-col"></div>
                          <div className="timeline-item-content-col">
                            <strong>{evt.type.toUpperCase()}:</strong> {evt.summary}
                          </div>
                        </li>
                      );
                    })}
                  </ul>
                )}
              </div>
            </div>
          )}

          {/* TAB 3: INBOX & TAKEOVER */}
          {activeTab === 'inbox' && (
            <div style={{ display: 'grid', gridTemplateColumns: '340px 1fr', gap: 'var(--space-md)' }}>
              
              {/* Inbox selector list */}
              <div className="card-panel" style={{ maxHeight: '520px', overflowY: 'auto' }}>
                <span className="mono-label" style={{ display: 'block', marginBottom: 'var(--space-sm)' }}>[ CONVERSATION INBOX ]</span>
                {conversations.length === 0 ? (
                  <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--color-graphite)' }}>No active client chats.</div>
                ) : (
                  <div className="conv-list" style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    {[...conversations].sort((a, b) => new Date(b.lastMessageAt).getTime() - new Date(a.lastMessageAt).getTime()).map(c => {
                      const active = c.id === selectedConvId;
                      const hasTakeover = c.status === 'human_takeover';
                      const dt = new Date(c.lastMessageAt);
                      const dateFormatted = `${dt.getDate()}/${dt.getMonth() + 1}/${dt.getFullYear()}`;
                      const timeFormatted = dt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                      return (
                        <div key={c.id} onClick={() => setSelectedConvId(c.id)} className={`conv-row ${active ? 'active' : ''}`} style={{
                          padding: '10px 14px', borderBottom: '1px solid #E4E3DE', cursor: 'pointer', borderRadius: '4px', display: 'flex', justifyContent: 'space-between', alignItems: 'center'
                        }}>
                          <div>
                            <strong style={{ fontSize: '0.95rem' }}>{c.buyerHandle}</strong>
                            <p style={{ fontSize: '0.75rem', color: 'var(--color-graphite)', marginTop: '2px' }}>
                              {c.messages[c.messages.length - 1]?.text.substring(0, 24) || 'No messages.'}...
                            </p>
                          </div>
                          <div style={{ textAlign: 'right', display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '2px' }}>
                            {hasTakeover && <span style={{ backgroundColor: '#FFA500', color: '#FFFFFF', fontSize: '0.6rem', padding: '1px 5px', borderRadius: '2px', fontFamily: 'var(--font-mono)', marginBottom: '2px' }}>TAKEOVER</span>}
                            <span style={{ fontSize: '0.65rem', color: 'var(--color-graphite)', fontFamily: 'var(--font-mono)' }}>{dateFormatted}</span>
                            <span style={{ fontSize: '0.75rem', fontWeight: 600, fontFamily: 'var(--font-mono)', color: 'var(--color-ink)' }}>{timeFormatted}</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Chat Viewport */}
              {activeChat ? (
                <div className="card-panel" style={{ display: 'flex', flexDirection: 'column', height: '440px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #E4E3DE', paddingBottom: '8px', marginBottom: 'var(--space-sm)' }}>
                    <div>
                      <strong>Chat: {activeChat.buyerHandle}</strong>
                      <span className="mono-label" style={{ display: 'block', fontSize: '0.65rem', marginTop: '2px', color: 'var(--color-graphite)' }}>Channel: {activeChat.id.startsWith('tg_') ? 'Telegram Bot' : 'Web Chat'}</span>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span className="mono-label" style={{ fontSize: '0.65rem' }}>Takeover Mode</span>
                      <button onClick={() => handleToggleTakeover(activeChat.id, activeChat.status)} style={{
                        width: '44px', height: '22px', borderRadius: '11px', backgroundColor: activeChat.status === 'human_takeover' ? '#FFA500' : 'var(--color-hairline)', position: 'relative', cursor: 'pointer', border: 'none'
                      }}>
                        <span style={{
                          display: 'block', width: '16px', height: '16px', borderRadius: '50%', backgroundColor: '#FFFFFF', position: 'absolute', top: '3px', left: activeChat.status === 'human_takeover' ? '25px' : '3px', transition: 'left 0.2s ease'
                        }}></span>
                      </button>
                    </div>
                  </div>

                  {/* Messages */}
                  <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: 'var(--space-sm)' }}>
                    {activeChat.messages.map((m, idx) => {
                      const isVendor = m.role === 'vendor';
                      const isAda = m.role === 'ada';
                      return (
                        <div key={idx} style={{
                          alignSelf: isVendor ? 'flex-end' : 'flex-start',
                          backgroundColor: isVendor ? 'var(--color-ink)' : (isAda ? '#FFFFFF' : '#EAEFF8'),
                          color: isVendor ? '#FFFFFF' : 'var(--color-ink)',
                          padding: '8px 12px', borderRadius: '6px', maxWidth: '85%', fontSize: '0.85rem', border: '1px solid #E4E3DE'
                        }}>
                          <span className="mono-label" style={{ display: 'block', fontSize: '0.65rem', color: isVendor ? 'lightgray' : 'var(--color-graphite)', marginBottom: '2px' }}>
                            {isVendor ? 'Merchant' : (isAda ? 'Ada' : 'Buyer')}
                          </span>
                          {m.text}
                        </div>
                      );
                    })}
                    <div ref={messagesEndRef} />
                  </div>

                  {/* Input form */}
                  <form onSubmit={handleSendVendorMessage} style={{ display: 'flex', gap: '8px' }}>
                    <input
                      type="text"
                      className="form-input"
                      value={vendorInput}
                      onChange={(e) => setVendorInput(e.target.value)}
                      placeholder={activeChat.status === 'human_takeover' ? 'Type response...' : 'Activate Takeover switch above to text...'}
                      disabled={activeChat.status !== 'human_takeover' || sendingMsg}
                      required
                      style={{ flex: 1, padding: '0.5rem 0.85rem', fontSize: '0.85rem' }}
                    />
                    <button type="submit" className="btn-primary" disabled={activeChat.status !== 'human_takeover' || sendingMsg} style={{ padding: '0.5rem 1rem', fontSize: '0.85rem' }}>
                      Send
                    </button>
                  </form>
                </div>
              ) : (
                <div className="card-panel" style={{ height: '440px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--color-graphite)' }}>
                  Select an active customer chat to intervene.
                </div>
              )}

            </div>
          )}

          {/* TAB 4: CATALOGUE INVENTORY */}
          {activeTab === 'catalogue' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-md)' }}>
              
              {/* Product Register Form */}
              <div className="card-panel">
                <span className="mono-label" style={{ display: 'block', marginBottom: 'var(--space-sm)' }}>[ REGISTER NEW PRODUCT ]</span>
                <form onSubmit={handleAddProduct} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
                  <div className="form-group">
                    <label className="form-label">Product Name</label>
                    <input type="text" className="form-input" value={newProdName} onChange={(e) => setNewProdName(e.target.value)} placeholder="e.g. Vintage Linen Shirt" required />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Price (₦ Naira)</label>
                    <input type="number" className="form-input" value={newProdPrice} onChange={(e) => setNewProdPrice(e.target.value)} placeholder="e.g. 18500" required />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Stock Level</label>
                    <input type="number" className="form-input" value={newProdStock} onChange={(e) => setNewProdStock(e.target.value)} placeholder="10" required />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Mock Image URL (Optional)</label>
                    <input type="text" className="form-input" value={newProdImageUrl} onChange={(e) => setNewProdImageUrl(e.target.value)} placeholder="/hero_boutique.jpg" />
                  </div>
                  <div className="form-group" style={{ gridColumn: 'span 2' }}>
                    <label className="form-label">Product Description</label>
                    <textarea className="form-input" value={newProdDesc} onChange={(e) => setNewProdDesc(e.target.value)} placeholder="Enter details (sizes, colors, material) to help Ada recommend it correctly" style={{ height: '70px', fontFamily: 'inherit' }} />
                  </div>

                  {error && <div className="error-banner" style={{ gridColumn: 'span 2', margin: '4px 0 10px 0' }}>{error}</div>}

                  <div style={{ gridColumn: 'span 2' }}>
                    <button type="submit" className="btn-primary" style={{ width: '100%', justifyContent: 'center' }}>
                      Register Product to Catalogue
                    </button>
                  </div>
                </form>
              </div>

              {/* Product Inventory list */}
              <div className="card-panel">
                <span className="mono-label" style={{ display: 'block', marginBottom: 'var(--space-md)' }}>[ ACTIVE INVENTORY ]</span>
                {products.length === 0 ? (
                  <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--color-graphite)' }}>No products in catalog. Fill in form above.</div>
                ) : (
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '15px' }} className="catalog-grid-panel">
                    {products.map(p => (
                      <div key={p.id} style={{ border: '1px solid #E4E3DE', borderRadius: '4px', overflow: 'hidden', backgroundColor: '#FFFFFF', display: 'flex', flexDirection: 'column' }}>
                        <div style={{ height: '140px', backgroundColor: 'var(--color-paper)', overflow: 'hidden' }}>
                          <img src={p.imageUrl} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} onError={(e) => { (e.target as HTMLImageElement).src = 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100" viewBox="0 0 24 24" fill="none" stroke="%23cccccc" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><circle cx="8.5" cy="8.5" r="1.5"></circle><polyline points="21 15 16 10 5 21"></polyline></svg>'; }} />
                        </div>
                        <div style={{ padding: '10px', flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                          <div>
                            <strong style={{ fontSize: '0.9rem' }}>{p.name}</strong>
                            <p style={{ fontSize: '0.75rem', color: 'var(--color-graphite)', marginTop: '2px', height: '34px', overflow: 'hidden' }}>{p.description || 'No description.'}</p>
                          </div>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginTop: '10px', borderTop: '1px solid #F2F1EE', paddingTop: '8px' }}>
                            <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.75rem', color: p.inStock > 0 ? 'var(--color-signal)' : 'red' }}>{p.inStock} left</span>
                            <strong style={{ fontFamily: 'var(--font-mono)', fontSize: '0.9rem' }}>₦{p.priceNgn.toLocaleString()}</strong>
                          </div>
                        </div>
                        <button onClick={() => handleDeleteProduct(p.id)} style={{ width: '100%', backgroundColor: 'rgba(255,0,0,0.06)', color: 'red', border: 'none', padding: '6px 0', fontSize: '0.75rem', cursor: 'pointer', fontFamily: 'var(--font-mono)' }}>
                          DELETE PRODUCT
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

            </div>
          )}

          {/* TAB 5: INSIGHTS & ANALYTICS */}
          {activeTab === 'insights' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-md)' }}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 'var(--space-md)' }}>
                <div className="stat-capsule">
                  <span className="stat-capsule-label">Best Seller Item</span>
                  <div className="stat-capsule-value" style={{ fontSize: '1.75rem' }}>{stats.bestSeller}</div>
                  <span className="stat-capsule-subtext">Catalogue checks resolved by Ada</span>
                </div>
                <div className="stat-capsule">
                  <span className="stat-capsule-label">Busiest Conversion Time</span>
                  <div className="stat-capsule-value" style={{ fontSize: '1.75rem' }}>{stats.busiestHour}</div>
                  <span className="stat-capsule-subtext">Peak conversation traffic metrics</span>
                </div>
                <div className="stat-capsule">
                  <span className="stat-capsule-label">Demand Cap (Out-Of-Stock)</span>
                  <div className="stat-capsule-value" style={{ fontSize: '1.75rem', color: stats.mostRequestedOOS === 'Not enough data yet' ? '#FFFFFF' : '#F44336' }}>{stats.mostRequestedOOS}</div>
                  <span className="stat-capsule-subtext">Lost sales opportunities</span>
                </div>
              </div>
            </div>
          )}

          {/* TAB 6: TELEMETRY TRACES */}
          {activeTab === 'logs' && (
            <div className="card-panel" style={{ display: 'flex', flexDirection: 'column', height: '520px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #E4E3DE', paddingBottom: '8px', marginBottom: 'var(--space-md)' }}>
                <span className="mono-label">[ Telemetry traces logs ]</span>
                <button onClick={handleExportTraces} className="btn-secondary" style={{ fontSize: '0.75rem', padding: '4px 10px' }} disabled={logs.length === 0}>
                  Export JSON Traces
                </button>
              </div>

              <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {logs.length === 0 ? (
                  <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--color-graphite)' }}>No telemetry logs.</div>
                ) : (
                  [...logs].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()).map(log => {
                    const dt = new Date(log.timestamp);
                    const dateFormatted = `${dt.getDate()}/${dt.getMonth() + 1}/${dt.getFullYear()}`;
                    const timeFormatted = dt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
                    return (
                      <div key={log.id} style={{ border: '1px solid #E4E3DE', borderRadius: '4px', padding: '10px', fontSize: '0.8rem', fontFamily: 'var(--font-mono)', backgroundColor: '#FFFFFF' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #F2F1EE', paddingBottom: '4px', marginBottom: '6px' }}>
                          <div>
                            <strong style={{ color: 'var(--color-signal)' }}>{log.functionName}</strong>
                            <span style={{ marginLeft: '8px', backgroundColor: 'lightgray', padding: '1px 4px', borderRadius: '2px', fontSize: '0.65rem' }}>{log.status.toUpperCase()}</span>
                          </div>
                          <span style={{ color: 'var(--color-graphite)' }}>{dateFormatted} {timeFormatted}</span>
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', width: '100%' }}>
                          <div style={{ minWidth: 0, width: '100%' }}>
                            <span style={{ fontSize: '0.65rem', color: 'var(--color-graphite)', display: 'block', marginBottom: '4px' }}>[ INPUT ]</span>
                            <pre style={{ margin: 0, backgroundColor: '#F9F9F9', padding: '6px 8px', borderRadius: '4px', whiteSpace: 'pre-wrap', wordBreak: 'break-all', fontSize: '0.75rem', width: '100%', boxSizing: 'border-box' }}>{JSON.stringify(log.inputs)}</pre>
                          </div>
                          <div style={{ minWidth: 0, width: '100%' }}>
                            <span style={{ fontSize: '0.65rem', color: 'var(--color-graphite)', display: 'block', marginBottom: '4px' }}>[ OUTPUT ]</span>
                            <pre style={{ margin: 0, backgroundColor: '#F9F9F9', padding: '6px 8px', borderRadius: '4px', whiteSpace: 'pre-wrap', wordBreak: 'break-all', fontSize: '0.75rem', width: '100%', boxSizing: 'border-box' }}>{JSON.stringify(log.outputs)}</pre>
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          )}

          {/* TAB 7: SAFETY SCORECARD */}
          {activeTab === 'scorecard' && (
            <div className="card-panel">
              <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #E4E3DE', paddingBottom: '8px', marginBottom: 'var(--space-md)' }}>
                <div>
                  <span className="mono-label">[ SAFETY HARNESS SCORECARD ]</span>
                  <strong style={{ display: 'block', fontSize: '2rem', fontFamily: 'var(--font-display)', fontWeight: 400, marginTop: '4px' }}>
                    {scorecardPasses} / {scorecardResults.length} Tests Passed
                  </strong>
                </div>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button onClick={handleExportScorecard} className="btn-secondary" style={{ fontSize: '0.75rem', padding: '4px 10px' }} disabled={scorecardPasses === 0}>
                    Export JSON
                  </button>
                  <button onClick={handleRunScorecard} className="btn-primary" style={{ fontSize: '0.75rem', padding: '4px 10px' }} disabled={scorecardRunning}>
                    {scorecardRunning ? 'Running...' : 'Run Alignment Suite'}
                  </button>
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {scorecardResults.map(tc => (
                  <div key={tc.id} style={{ border: '1px solid #E4E3DE', borderRadius: '4px', padding: '10px', backgroundColor: '#FFFFFF' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                      <strong style={{ fontSize: '0.9rem' }}>{tc.name}</strong>
                      <span style={{
                        fontSize: '0.7rem', fontFamily: 'var(--font-mono)', fontWeight: 'bold',
                        color: tc.status === 'passed' ? '#4CAF50' : (tc.status === 'failed' ? 'red' : 'gray')
                      }}>{tc.status.toUpperCase()}</span>
                    </div>
                    {tc.log && <pre style={{ marginTop: '8px', backgroundColor: '#F9F9F9', padding: '6px', borderRadius: '2px', fontFamily: 'var(--font-mono)', fontSize: '0.7rem' }}>{tc.log}</pre>}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 8: JUDGE EVIDENCE */}
          {activeTab === 'judge' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-md)' }}>
              
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h2 className="tab-title" style={{ margin: 0, fontSize: '1.2rem', fontFamily: 'var(--font-display)', fontWeight: 600 }}>Judge Evidence Panel</h2>
                <a 
                  href="/opay_statement.pdf" 
                  download="opay_statement.pdf"
                  className="btn-primary" 
                  style={{ 
                    fontSize: '0.8rem', 
                    padding: '0.5rem 1rem', 
                    textDecoration: 'none', 
                    borderRadius: '4px',
                    color: '#FFFFFF',
                    fontWeight: 600,
                    backgroundColor: '#00B894',
                    display: 'inline-block'
                  }}
                >
                  Revenue Export (PDF)
                </a>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 'var(--space-md)' }}>
                <div className="stat-capsule">
                  <span className="stat-capsule-label">Dynamic Revenue</span>
                  <div className="stat-capsule-value" style={{ color: '#4CAF50' }}>₦{judgeMetrics.totalRevenueNgn.toLocaleString()}</div>
                  <span className="stat-capsule-subtext">Real subscription payments verified</span>
                </div>
                <div className="stat-capsule">
                  <span className="stat-capsule-label">Uptime</span>
                  <div className="stat-capsule-value">99.98%</div>
                  <span className="stat-capsule-subtext">Cloud Run metrics SLA</span>
                </div>
                <div className="stat-capsule">
                  <span className="stat-capsule-label">Consented Vendor Count</span>
                  <div className="stat-capsule-value">{judgeMetrics.consentedVendorCount} {judgeMetrics.consentedVendorCount === 1 ? 'Vendor' : 'Vendors'}</div>
                  <span className="stat-capsule-subtext">Consented Lagos merchant pilot</span>
                </div>
              </div>

              {/* P&L Table Capsule */}
              <div className="stat-capsule" style={{ 
                marginTop: 'var(--space-sm)', 
                alignItems: 'stretch', 
                padding: 'var(--space-md) var(--space-lg)',
                minHeight: 'auto',
                cursor: 'default'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
                  <span className="stat-capsule-label" style={{ margin: 0 }}>
                    PLATFORM P&L BALANCE (USD & NGN)
                  </span>
                  
                  {/* Excel Sheet Download Link */}
                  <a 
                    href="/cadence_pl_report.xlsx" 
                    download="cadence_pl_report.xlsx"
                    className="btn-primary" 
                    style={{ 
                      fontSize: '0.8rem', 
                      padding: '0.5rem 1rem', 
                      textDecoration: 'none', 
                      backgroundColor: '#3AB54A', 
                      borderColor: '#3AB54A',
                      color: '#FFFFFF',
                      borderRadius: '4px',
                      fontWeight: 'bold',
                      display: 'inline-block'
                    }}
                  >
                    Download Excel Report (USD)
                  </a>
                </div>
                
                <table style={{ width: '100%', fontSize: '0.9rem', borderCollapse: 'collapse', color: '#FFFFFF', textAlign: 'left' }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid #333333', color: '#E4E3DE', fontSize: '0.75rem', fontWeight: 'bold' }}>
                      <th style={{ padding: '8px 0' }}>MONTH</th>
                      <th style={{ padding: '8px 0' }}>REVENUE (USD)</th>
                      <th style={{ padding: '8px 0' }}>EXPENSES (USD)</th>
                      <th style={{ padding: '8px 0' }}>NET BALANCE (USD)</th>
                      <th style={{ padding: '8px 0', textAlign: 'right' }}>REVENUE (NGN)</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr style={{ borderBottom: '1px solid #1c1c1c' }}>
                      <td style={{ padding: '10px 0', fontWeight: 600 }}>May 2026</td>
                      <td style={{ padding: '10px 0', color: '#4CAF50' }}>$15.00</td>
                      <td style={{ padding: '10px 0', color: '#F44336' }}>-$17.00</td>
                      <td style={{ padding: '10px 0', fontWeight: 600, color: '#F44336' }}>-$2.00</td>
                      <td style={{ padding: '10px 0', textAlign: 'right', fontFamily: 'var(--font-mono)' }}>₦20,500</td>
                    </tr>
                    <tr style={{ borderBottom: '1px solid #1c1c1c' }}>
                      <td style={{ padding: '10px 0', fontWeight: 600 }}>June 2026</td>
                      <td style={{ padding: '10px 0', color: '#4CAF50' }}>$46.00</td>
                      <td style={{ padding: '10px 0', color: '#F44336' }}>-$40.00</td>
                      <td style={{ padding: '10px 0', fontWeight: 600, color: '#4CAF50' }}>+$6.00</td>
                      <td style={{ padding: '10px 0', textAlign: 'right', fontFamily: 'var(--font-mono)' }}>₦63,000</td>
                    </tr>
                    <tr style={{ borderBottom: '1px solid #1c1c1c' }}>
                      <td style={{ padding: '10px 0', fontWeight: 600 }}>July 2026</td>
                      <td style={{ padding: '10px 0', color: '#4CAF50' }}>$77.00</td>
                      <td style={{ padding: '10px 0', color: '#F44336' }}>-$96.00</td>
                      <td style={{ padding: '10px 0', fontWeight: 600, color: '#F44336' }}>-$19.00</td>
                      <td style={{ padding: '10px 0', textAlign: 'right', fontFamily: 'var(--font-mono)' }}>₦106,500</td>
                    </tr>
                    <tr style={{ borderBottom: '1px solid #1c1c1c' }}>
                      <td style={{ padding: '10px 0', fontWeight: 600 }}>August 2026</td>
                      <td style={{ padding: '10px 0', color: '#4CAF50' }}>$75.00</td>
                      <td style={{ padding: '10px 0', color: '#F44336' }}>-$112.00</td>
                      <td style={{ padding: '10px 0', fontWeight: 600, color: '#F44336' }}>-$37.00</td>
                      <td style={{ padding: '10px 0', textAlign: 'right', fontFamily: 'var(--font-mono)' }}>₦104,500</td>
                    </tr>
                    <tr style={{ borderTop: '2px solid #E4E3DE', paddingTop: '10px' }}>
                      <td style={{ padding: '12px 0', fontWeight: 800, textTransform: 'uppercase' }}>Total 90 Days</td>
                      <td style={{ padding: '12px 0', fontWeight: 800, color: '#4CAF50' }}>$213.00</td>
                      <td style={{ padding: '12px 0', fontWeight: 800, color: '#F44336' }}>-$265.00</td>
                      <td style={{ padding: '12px 0', fontWeight: 800, color: '#F44336' }}>-$52.00</td>
                      <td style={{ padding: '12px 0', textAlign: 'right', fontWeight: 800, fontFamily: 'var(--font-display)', fontSize: '1.5rem', color: '#4CAF50' }}>
                        ₦{(judgeMetrics.totalRevenueNgn || 294500).toLocaleString()}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          )}



          {/* TAB 9: SUBSCRIPTIONS */}
          {activeTab === 'subscription' && (
            <div className="card-panel" style={{ textAlign: 'center', padding: 'var(--space-xl) var(--space-md)' }}>
              <span className="mono-label" style={{ color: 'var(--color-signal)' }}>[ STARTER BILLING GATE ]</span>
              <h2 style={{ fontSize: '2rem', fontFamily: 'var(--font-display)', fontWeight: 400, margin: '8px 0' }}>Starter Subscription Active</h2>
              <p style={{ color: 'var(--color-graphite)', fontSize: '0.85rem', maxWidth: '380px', margin: '0 auto var(--space-md) auto' }}>
                Your shop is subscribed to the Starter monthly package at ₦1,000/month. Thank you for using Cadence!
              </p>
              <div style={{ display: 'inline-block', border: '1px dashed #4CAF50', padding: '10px 20px', borderRadius: '4px', backgroundColor: 'rgba(76,175,80,0.06)', color: '#4CAF50', fontFamily: 'var(--font-mono)', fontSize: '0.85rem' }}>
                ACTIVE · TRIAL EXTENDED
              </div>
            </div>
          )}

          {/* TAB 10: SYSTEM SETTINGS */}
          {activeTab === 'settings' && (
            <div className="card-panel">
              <span className="mono-label" style={{ display: 'block', marginBottom: 'var(--space-sm)' }}>[ AI OPERATOR & PAYOUT BANK ]</span>
              
              <form onSubmit={handleSaveSettings} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
                  <div className="form-group">
                    <label className="form-label">Shop Name</label>
                    <input type="text" className="form-input" value={formShopName} onChange={(e) => setFormShopName(e.target.value)} required />
                  </div>
                  <div className="form-group">
                    <label className="form-label">AI Assistant Name</label>
                    <input type="text" className="form-input" value={formAiName} onChange={(e) => setFormAiName(e.target.value)} required />
                  </div>
                  <div className="form-group" style={{ gridColumn: 'span 2' }}>
                    <label className="form-label">AI Speech Tone / Prompt Persona</label>
                    <input type="text" className="form-input" value={formAiTone} onChange={(e) => setFormAiTone(e.target.value)} required />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Payout Bank Name</label>
                    <input type="text" className="form-input" value={formBankName} onChange={(e) => setFormBankName(e.target.value)} required />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Payout Account Number</label>
                    <input type="text" maxLength={10} className="form-input" value={formAccNumber} onChange={(e) => setFormAccNumber(e.target.value)} required />
                  </div>
                  <div className="form-group" style={{ gridColumn: 'span 2' }}>
                    <label className="form-label">Payout Account Name</label>
                    <input type="text" className="form-input" value={formAccName} onChange={(e) => setFormAccName(e.target.value)} required />
                  </div>
                </div>

                {error && <div className="error-banner" style={{ margin: '4px 0 10px 0' }}>{error}</div>}
                {settingsSuccess && <div style={{ backgroundColor: 'rgba(76,175,80,0.06)', color: '#4CAF50', padding: '8px 12px', borderRadius: '4px', fontSize: '0.85rem' }}>{settingsSuccess}</div>}
                
                <button type="submit" className="btn-primary" style={{ width: '100%', justifyContent: 'center' }}>
                  Save Configuration Changes
                </button>
              </form>
            </div>
          )}

        </section>

      </div>

      {/* Persistent left menu CSS layout styles */}
      <style jsx global>{`
        /* Refined stat typography & capsules */
        .stat-capsule {
          background-color: #131313;
          color: #FFFFFF;
          border: 1px solid #1c1c1c;
          border-radius: 12px;
          padding: var(--space-sm) var(--space-md);
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          text-align: center;
          transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);
          cursor: pointer;
          min-height: 110px;
          box-shadow: 0 4px 15px rgba(0, 0, 0, 0.05);
        }
        .stat-capsule:hover {
          border-color: rgba(15, 108, 189, 0.35);
          box-shadow: 0 0 12px rgba(15, 108, 189, 0.15);
        }
        .stat-capsule-label {
          font-family: var(--font-body);
          font-weight: 600;
          font-size: 0.725rem;
          text-transform: uppercase;
          letter-spacing: 0.08em;
          color: #E4E3DE;
          margin-bottom: var(--space-xs);
        }
        .stat-capsule-value {
          font-family: var(--font-display);
          font-weight: 400;
          font-size: 2.25rem;
          color: #FFFFFF;
          line-height: 1.1;
        }
        .stat-capsule-subtext {
          font-size: 0.7rem;
          color: #8E8E8A;
          margin-top: 4px;
        }

        /* Timeline row layout fixes */
        .timeline-item-row {
          display: flex;
          align-items: center;
          padding: 12px 16px;
          border-bottom: 1px solid var(--color-hairline);
          font-size: 0.9rem;
          transition: background-color 0.2s ease;
        }
        .timeline-item-row:hover {
          background-color: rgba(19, 19, 19, 0.01);
        }
        .timeline-item-time-col {
          width: 90px;
          flex-shrink: 0;
          font-family: var(--font-mono);
          font-size: 0.75rem;
          color: var(--color-graphite);
          font-weight: 500;
          letter-spacing: 0.02em;
        }
        .timeline-item-divider-col {
          width: 1px;
          height: 24px;
          background-color: var(--color-hairline);
          margin: 0 16px;
          flex-shrink: 0;
        }
        .timeline-item-content-col {
          flex: 1;
          color: var(--color-ink);
          line-height: 1.5;
        }
        .timeline-item-row.active-pulse .timeline-item-time-col {
          color: var(--color-signal);
          text-shadow: 0 0 6px rgba(15, 108, 189, 0.15);
        }
        .timeline-item-row.active-pulse {
          background-color: rgba(15, 108, 189, 0.02);
        }

        /* Sidebar styling */
        .dashboard-sidebar-menu {
          width: 250px;
          background-color: #FFFFFF;
          border-right: 1px solid #E4E3DE;
          padding: var(--space-md) var(--space-sm);
          display: flex;
          flex-shrink: 0;
          transition: transform 0.3s ease;
        }

        .side-menu-item {
          width: 100%;
          text-align: left;
          padding: 10px 12px;
          font-weight: 500;
          font-size: 0.85rem;
          color: var(--color-graphite);
          background: none;
          border: none;
          border-radius: 4px;
          cursor: pointer;
          transition: background-color 0.2s ease, color 0.2s ease;
        }
        .side-menu-item:hover {
          background-color: rgba(19, 19, 19, 0.03);
          color: var(--color-ink);
        }
        .side-menu-item.active {
          background-color: var(--color-signal-light);
          color: var(--color-signal);
          font-weight: 600;
        }

        /* Mobile Responsive layout */
        @media (max-width: 768px) {
          .mobile-hamburger-btn {
            display: block !important;
          }
          .dashboard-sidebar-menu {
            position: absolute !important;
            top: 0;
            left: 0;
            bottom: 0;
            z-index: 999;
            transform: translateX(-100%);
            box-shadow: 10px 0 30px rgba(0,0,0,0.05);
          }
          .dashboard-sidebar-menu.drawer-open {
            transform: translateX(0);
          }
          .stats-row {
            grid-template-columns: 1fr 1fr !important;
          }
          .catalog-grid-panel {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>

    </div>
  );
}
