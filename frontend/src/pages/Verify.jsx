// pages/Verify.jsx
import { useState } from 'react';
import { getReadContract, shortAddr } from '../utils/contract';

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
      // ethers v6 returns struct fields by name directly
      setResult({
        isRegistered:   r.isRegistered,
        hasCleanTitle:  r.hasCleanTitle,
        currentOwner:   r.currentOwner,
        totalTransfers: Number(r.totalTransfers),
        status:         r.status,
      });
    } catch (err) {
      setError('Error: ' + (err.reason || err.message || 'Could not connect. Is Hardhat running?'));
    }
    setLoading(false);
  };

  const statusColor = (status) => {
    if (!status) return 'gray';
    if (status.includes('CLEAN')) return 'green';
    if (status.includes('DISPUTED')) return 'red';
    if (status.includes('ENCUMBERED')) return 'orange';
    return 'gray';
  };

  return (
    <div style={{ maxWidth: 680, margin: '0 auto', padding: '48px 24px' }}>
      <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 32, marginBottom: 8 }}>✅ Verify Land</h1>
      <p style={{ color: 'var(--text2)', marginBottom: 32 }}>
        Instant title verification for banks, lawyers, and buyers.
      </p>

      <div style={{ display: 'flex', gap: 12, marginBottom: 24 }}>
        <input
          value={landId}
          onChange={e => setLandId(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && verify()}
          placeholder="Enter Land ID (e.g. 101)"
          type="number"
          style={{
            flex: 1, padding: '12px 16px', border: '1px solid var(--border)',
            borderRadius: 10, fontSize: 15, background: 'var(--white)', outline: 'none',
          }}
        />
        <button onClick={verify} style={{
          background: 'var(--accent)', color: '#fff', border: 'none',
          padding: '12px 28px', borderRadius: 10, fontSize: 15, fontWeight: 600,
        }}>
          {loading ? 'Checking...' : 'Verify'}
        </button>
      </div>

      {error && (
        <div style={{
          color: 'red', background: '#fff0f0', border: '1px solid #ffaaaa',
          borderRadius: 8, padding: '12px 16px', marginBottom: 20, fontSize: 13,
        }}>
          {error}
        </div>
      )}

      {result && (
        <div>
          <div style={{
            background: result.hasCleanTitle ? '#e6f4ea' : '#fff3e0',
            border: `1px solid ${result.hasCleanTitle ? 'green' : 'orange'}`,
            borderRadius: 12, padding: '20px 24px', marginBottom: 20,
          }}>
            <div style={{ fontSize: 13, color: 'gray', marginBottom: 4 }}>
              VERIFICATION RESULT — LAND #{landId}
            </div>
            <div style={{ fontSize: 22, fontWeight: 700, color: statusColor(result.status) }}>
              {result.isRegistered ? result.status : '❌ NOT REGISTERED'}
            </div>
          </div>

          {result.isRegistered && (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
              {[
                { label: 'Current Owner', value: result.currentOwner, icon: '👤' },
                { label: 'Total Transfers', value: result.totalTransfers, icon: '🔄' },
                { label: 'Title Status', value: result.hasCleanTitle ? 'Clean ✅' : 'Encumbered ⚠️', icon: '📋' },
                { label: 'Registered On', value: 'Hardhat Local', icon: '⛓️' },
              ].map((item, i) => (
                <div key={i} style={{
                  background: 'var(--white)', border: '1px solid var(--border)',
                  borderRadius: 12, padding: '20px',
                }}>
                  <div style={{ fontSize: 24, marginBottom: 8 }}>{item.icon}</div>
                  <div style={{ fontSize: 11, color: 'gray', marginBottom: 4 }}>{item.label}</div>
                  <div style={{
                    fontSize: 13, fontWeight: 600,
                    wordBreak: 'break-all',   // ← shows full address, not cut off
                  }}>
                    {item.value}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {!result && !loading && !error && (
        <div style={{ textAlign: 'center', padding: '60px 20px', color: 'var(--text2)' }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>🔍</div>
          Enter a Land ID to check ownership, liens, and document integrity.
        </div>
      )}
    </div>
  );
}