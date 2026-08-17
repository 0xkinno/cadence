import { db } from '@/lib/firebase';
import { getSession } from '@/lib/session';
import Link from 'next/link';
import ExportButton from './ExportButton';

interface LogTrace {
  id: string;
  functionName: string;
  inputs: Record<string, unknown>;
  outputs: Record<string, unknown>;
  timestamp: string;
  status: 'running' | 'completed' | 'failed';
}

interface PageProps {
  searchParams: Promise<{ shop?: string }>;
}

export default async function LogsPage({ searchParams }: PageProps) {
  const { shop: shopSlug } = await searchParams;
  const session = await getSession();

  let shopId = '';
  let shopName = '';

  try {
    // 1. Resolve Shop Identifier (either from active session or query parameter for judges)
    if (session?.shopId) {
      shopId = session.shopId;
      const sDoc = await db.collection('shops').doc(shopId).get();
      shopName = sDoc.exists ? sDoc.data()?.name : 'Your Shop';
    } else if (shopSlug) {
      const shopsRef = db.collection('shops');
      const qSnap = await shopsRef.where('slug', '==', shopSlug).limit(1).get();
      if (!qSnap.empty) {
        shopId = qSnap.docs[0].id;
        shopName = qSnap.docs[0].data()?.name;
      }
    }

    // Guard: If shopId could not be resolved
    if (!shopId) {
      return (
        <div style={{
          backgroundColor: '#F1F5FB',
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontFamily: 'sans-serif',
          padding: '2rem'
        }}>
          <div style={{
            backgroundColor: '#FFFFFF',
            padding: '2.5rem',
            borderRadius: '6px',
            border: '1px solid #E4E3DE',
            maxWidth: '480px',
            width: '100%',
            textAlign: 'center'
          }}>
            <h2 style={{ fontSize: '1.75rem', marginBottom: '1rem' }}>Access Execution Traces</h2>
            <p style={{ color: '#6E6E6A', fontSize: '0.9rem', lineHeight: '1.5', marginBottom: '1.5rem' }}>
              Please log in to your vendor control desk to view logs, or query a shop slug directly as a judge.
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <Link href="/login" className="btn-primary" style={{ textDecoration: 'none', justifyContent: 'center' }}>
                Sign In to Control Desk
              </Link>
              <span style={{ fontSize: '0.8rem', color: '#6E6E6A' }}>Or try: `/logs?shop=chidis-curated-wear`</span>
            </div>
          </div>
        </div>
      );
    }

    // 2. Fetch Logs from database
    const logsSnap = await db.collection('shops').doc(shopId).collection('logs')
      .orderBy('timestamp', 'desc')
      .limit(100)
      .get();

    const traces: LogTrace[] = [];
    logsSnap.forEach(doc => {
      const data = doc.data();
      
      // Redact sensitive details in outputs or inputs (Upgrade I)
      const rawInputs = data.inputs || {};
      const rawOutputs = data.outputs || {};
      
      const redactedInputs = { ...rawInputs };
      const redactedOutputs = { ...rawOutputs } as Record<string, unknown>;

      // Redact account credentials
      if (data.functionName === 'present_payment_details') {
        if (redactedOutputs.accountNumber) {
          redactedOutputs.accountNumber = '******' + String(redactedOutputs.accountNumber).slice(-4);
        }
        if (redactedOutputs.accountName) {
          redactedOutputs.accountName = '[REDACTED]';
        }
      }

      traces.push({
        id: doc.id,
        functionName: data.functionName,
        inputs: redactedInputs,
        outputs: redactedOutputs,
        timestamp: data.timestamp,
        status: data.status || 'completed',
      });
    });

    // Prepare JSON string for client-side download export
    const exportJsonString = JSON.stringify(traces, null, 2);

    return (
      <div style={{
        backgroundColor: '#F1F5FB',
        minHeight: '100vh',
        padding: '2rem var(--space-md)',
        fontFamily: 'var(--font-body)'
      }}>
        <div style={{ maxWidth: '1100px', margin: '0 auto' }}>
          
          {/* Header Navigation */}
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '2rem',
            borderBottom: '1px solid #E4E3DE',
            paddingBottom: '1rem'
          }}>
            <div>
              <h1 style={{ fontSize: '2.25rem', fontFamily: 'var(--font-display)', fontWeight: 400 }}>
                Execution Traces: {shopName}
              </h1>
              <p style={{ fontSize: '0.85rem', color: '#6E6E6A', marginTop: '4px' }}>
                Deterministic boundary logs, AI tool invocations, and output validators.
              </p>
            </div>

            <div style={{ display: 'flex', gap: '10px' }}>
              <Link href="/dashboard" className="btn-secondary" style={{ fontSize: '0.85rem', textDecoration: 'none' }}>
                Back to Dashboard
              </Link>
              <ExportButton jsonString={exportJsonString} shopSlug={shopSlug || 'shop'} />
            </div>
          </div>

          {/* Traces Audit Table */}
          {traces.length === 0 ? (
            <div style={{
              backgroundColor: '#FFFFFF',
              border: '1px solid #E4E3DE',
              borderRadius: '6px',
              padding: '3rem',
              textAlign: 'center',
              color: '#6E6E6A'
            }}>
              No execution logs found. Once Ada begins receiving messages, function traces will appear here.
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {traces.map(trace => (
                <div
                  key={trace.id}
                  style={{
                    backgroundColor: '#FFFFFF',
                    border: '1px solid #E4E3DE',
                    borderRadius: '6px',
                    padding: '1.25rem',
                    boxShadow: '0 1px 3px rgba(0,0,0,0.01)'
                  }}
                >
                  {/* Log Header info */}
                  <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'baseline',
                    borderBottom: '1px solid #F2F1EE',
                    paddingBottom: '6px',
                    marginBottom: '10px'
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{
                        backgroundColor: trace.functionName === 'ValidatorGate' ? '#0F6CBD' : '#EAEFF8',
                        color: trace.functionName === 'ValidatorGate' ? '#FFFFFF' : '#131313',
                        fontSize: '0.7rem',
                        fontFamily: 'var(--font-mono)',
                        padding: '2px 6px',
                        borderRadius: '3px',
                        fontWeight: 600
                      }}>
                        {trace.functionName}
                      </span>
                      <span style={{
                        backgroundColor: trace.status === 'completed' ? 'rgba(76,175,80,0.1)' : 'rgba(255,165,0,0.1)',
                        color: trace.status === 'completed' ? '#4CAF50' : '#FFA500',
                        fontSize: '0.65rem',
                        fontFamily: 'var(--font-mono)',
                        padding: '1px 5px',
                        borderRadius: '3px'
                      }}>
                        {trace.status.toUpperCase()}
                      </span>
                    </div>
                    <span style={{ fontSize: '0.75rem', fontFamily: 'var(--font-mono)', color: '#6E6E6A' }}>
                      {new Date(trace.timestamp).toLocaleString()}
                    </span>
                  </div>

                  {/* Log Details JSON */}
                  <div style={{
                    display: 'grid',
                    gridTemplateColumns: '1fr 1fr',
                    gap: '12px',
                    fontFamily: 'var(--font-mono)',
                    fontSize: '0.8rem',
                    overflowX: 'auto'
                  }} className="trace-json-grid">
                    <div>
                      <span style={{ fontSize: '0.65rem', color: '#6E6E6A', display: 'block', marginBottom: '3px' }}>[ INPUTS / PARAMETERS ]</span>
                      <pre style={{
                        backgroundColor: '#F9F9F9',
                        padding: '8px',
                        borderRadius: '4px',
                        border: '1px solid #E4E3DE',
                        maxHeight: '120px',
                        overflowY: 'auto'
                      }}>{JSON.stringify(trace.inputs, null, 2)}</pre>
                    </div>
                    <div>
                      <span style={{ fontSize: '0.65rem', color: '#6E6E6A', display: 'block', marginBottom: '3px' }}>[ OUTPUTS / AUDIT ]</span>
                      <pre style={{
                        backgroundColor: '#F9F9F9',
                        padding: '8px',
                        borderRadius: '4px',
                        border: '1px solid #E4E3DE',
                        maxHeight: '120px',
                        overflowY: 'auto'
                      }}>{JSON.stringify(trace.outputs, null, 2)}</pre>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

        </div>
      </div>
    );

  } catch (error: any) {
    const isCredentialsError = String(error.message).includes('Project Id') || String(error.message).includes('credential');
    
    return (
      <div style={{
        padding: '3rem var(--space-md)',
        textAlign: 'center',
        backgroundColor: '#F1F5FB', // Mist background theme for logs
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
              ? 'Telemetry is unable to retrieve execution logs because Firestore credentials are not set in the local environment.'
              : `Firestore logs error: ${error.message || String(error)}`
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
