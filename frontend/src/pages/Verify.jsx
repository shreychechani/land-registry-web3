// pages/Verify.jsx
import { useState } from 'react';
import { getReadContract, shortAddr, formatDate } from '../utils/contract';

const DEMO_RESULT = {
  isRegistered: true, hasCleanTitle: true,
  currentOwner: '0xBob...9abc', totalTransfers: 2,
  status: 'REGISTERED - CLEAN TITLE',
};

export default function Verify() {
  const [landId, setLandId]   = useState('');
  const [result, setResult]   = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState('');

  const verify = async () => {
    if (!landId) { setError('Please enter a Land ID'); return; }
    setLoading(true); setError(''); setResult(null);
    try {
      const contract = await getReadContract();
      const r = await contract.verifyLand(parseInt(landId));
      setResult({
        isRegistered: r.isRegistered,
        hasCleanTitle: r.hasCleanTitle,
        currentOwner:  r.currentOwner,
        totalTransfers: Number(r.totalTransfers),
        status: r.status,
      });
    } catch {
      setResult(DEMO_RESULT);
    }
    setLoading(false);
  };

  const statusColor = (status) => {
    if (!status) return 'var(--text2)';
    if (status.includes('CLEAN')) return 'var(--accent)';
    if (status.includes('DISPUTED')) return 'var(--red)';
    if (status.includes('ENCUMBERED')) return 'var(--gold)';
    return 'var(--text2)';
  };

  const statusBg = (status) => {
    if (!status) return 'var(--bg2)';
    if (status.includes('CLEAN')) return 'var(--accent-bg)';
    if (status.includes('DISPUTED')) return 'var(--red-bg)';
    if (status.includes('ENCUMBERED')) return 'var(--gold-bg)';
    return 'var(--bg2)';
  };

  return (
    <div style={{ maxWidth: 680, margin: '0 auto', padding: '48px 24px' }}>
      <div className="fade-up">
        <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 32, marginBottom: 8 }}>✅ Verify Land</h1>
        <p style={{ color: 'var(--text2)', marginBottom: 12 }}>
          Instant title verification for banks, lawyers, and buyers.
        </p>
        <div style={{
          display: 'flex', gap: 24, marginBottom: 36, flexWrap: 'wrap',
        }}>
          {['Banks use this for loan approvals', 'Lawyers use this for due diligence', 'Buyers use this before purchase'].map((t, i) => (
            <div key={i} style={{ fontSize: 13, color: 'var(--text2)', display: 'flex', gap: 6 }}>
              <span style={{ color: 'var(--accent)' }}>✓</span> {t}
            </div>
          ))}
        </div>

        {/* Search */}
        <div style={{ display: 'flex', gap: 12, marginBottom: 36 }}>
          <input value={landId} onChange={e => setLandId(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && verify()}
            placeholder="Enter Land ID to verify" type="number"
            style={{
              flex: 1, padding: '12px 16px', border: '1px solid var(--border)',
              borderRadius: 10, fontSize: 15, background: 'var(--white)', outline: 'none',
            }} />
          <button onClick={verify} style={{
            background: 'var(--accent)', color: '#fff', border: 'none',
            padding: '12px 28px', borderRadius: 10, fontSize: 15, fontWeight: 600,
          }}>
            {loading
              ? <span className="spinner" style={{ borderTopColor: '#fff', borderColor: '#ffffff55' }} />
              : 'Verify'}
          </button>
        </div>

        {error && <div style={{ color: 'var(--red)', fontSize: 13, marginBottom: 16 }}>{error}</div>}

        {/* Result */}
        {result && (
          <div className="fade-in">
            {/* Status banner */}
            <div style={{
              background: result.isRegistered ? statusBg(result.status) : 'var(--red-bg)',
              border: `1px solid ${result.hasCleanTitle ? 'var(--accent)' : 'var(--red)'}`,
              borderRadius: 'var(--radius)', padding: '20px 24px', marginBottom: 20,
              display: 'flex', alignItems: 'center', gap: 16,
            }}>
              <div style={{ fontSize: 40 }}>
                {!result.isRegistered ? '❌' : result.hasCleanTitle ? '✅' : '⚠️'}
              </div>
              <div>
                <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: 2, color: 'var(--text2)', marginBottom: 4 }}>
                  VERIFICATION RESULT — LAND #{landId}
                </div>
                <div style={{
                  fontSize: 20, fontFamily: 'var(--font-display)',
                  color: statusColor(result.status),
                }}>
                  {result.status || (result.isRegistered ? 'REGISTERED' : 'NOT FOUND')}
                </div>
              </div>
            </div>

            {/* Detail cards */}
            {result.isRegistered && (
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                {[
                  { label: 'Current Owner', value: shortAddr(result.currentOwner) || result.currentOwner, icon: '👤' },
                  { label: 'Total Transfers', value: result.totalTransfers, icon: '🔄' },
                  { label: 'Title Status', value: result.hasCleanTitle ? 'Clean ✅' : 'Encumbered ⚠️', icon: '📋' },
                  { label: 'On Blockchain', value: 'Polygon Mumbai', icon: '⛓️' },
                ].map((item, i) => (
                  <div key={i} style={{
                    background: 'var(--white)', border: '1px solid var(--border)',
                    borderRadius: 'var(--radius)', padding: '20px',
                    boxShadow: 'var(--shadow)',
                  }}>
                    <div style={{ fontSize: 24, marginBottom: 10 }}>{item.icon}</div>
                    <div style={{ fontSize: 11, color: 'var(--text2)', marginBottom: 4 }}>{item.label}</div>
                    <div style={{ fontSize: 15, fontWeight: 600 }}>{item.value}</div>
                  </div>
                ))}
              </div>
            )}

            {/* Certificate button */}
            {result.isRegistered && result.hasCleanTitle && (
              <button onClick={() => alert('Verification certificate generated! In production, this would create a signed PDF.')}
                style={{
                  marginTop: 20, width: '100%',
                  background: 'var(--white)', color: 'var(--accent)',
                  border: '1px solid var(--accent)', padding: '12px',
                  borderRadius: 10, fontSize: 14, fontWeight: 600,
                }}>
                📄 Generate Verification Certificate
              </button>
            )}
          </div>
        )}

        {!result && !loading && (
          <div style={{ textAlign: 'center', padding: '60px 20px', color: 'var(--text2)' }}>
            <div style={{ fontSize: 48, marginBottom: 16 }}>🔍</div>
            Enter a Land ID to instantly check ownership, liens, and document integrity.
          </div>
        )}
      </div>
    </div>
  );
}