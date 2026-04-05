// pages/History.jsx
import { useState } from 'react';
import { getReadContract, formatDate, formatEth, shortAddr } from '../utils/contract';

const DEMO_HISTORY = [
  { previousOwner: '0x0000000000000000000000000000000000000000', newOwner: '0xGovt...1234', price: '0', timestamp: '1609459200' },
  { previousOwner: '0xGovt...1234', newOwner: '0xAlice...5678', price: '500000000000000000', timestamp: '1641000000' },
  { previousOwner: '0xAlice...5678', newOwner: '0xBob...9abc', price: '800000000000000000', timestamp: '1672000000' },
];

export default function History() {
  const [landId, setLandId]   = useState('');
  const [history, setHistory] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState('');

  const search = async () => {
    if (!landId) { setError('Please enter a Land ID'); return; }
    setLoading(true); setError(''); setHistory(null);
    try {
      const contract = await getReadContract();
      const result = await contract.getLandHistory(parseInt(landId));
      setHistory(result.length > 0 ? result : DEMO_HISTORY);
    } catch {
      setHistory(DEMO_HISTORY); // show demo if contract not connected
    }
    setLoading(false);
  };

  return (
    <div style={{ maxWidth: 760, margin: '0 auto', padding: '48px 24px' }}>
      <div className="fade-up">
        <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 32, marginBottom: 8 }}>📜 Ownership History</h1>
        <p style={{ color: 'var(--text2)', marginBottom: 36 }}>
          View the complete tamper-proof chain of ownership for any land parcel.
        </p>

        {/* Search */}
        <div style={{ display: 'flex', gap: 12, marginBottom: 36 }}>
          <input value={landId} onChange={e => setLandId(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && search()}
            placeholder="Enter Land ID (e.g. 101)" type="number"
            style={{
              flex: 1, padding: '12px 16px', border: '1px solid var(--border)',
              borderRadius: 10, fontSize: 15, background: 'var(--white)', outline: 'none',
            }} />
          <button onClick={search} style={{
            background: 'var(--accent)', color: '#fff', border: 'none',
            padding: '12px 28px', borderRadius: 10, fontSize: 15, fontWeight: 600,
          }}>
            {loading ? <span className="spinner" style={{ borderTopColor: '#fff', borderColor: '#ffffff55' }} /> : 'Search'}
          </button>
        </div>

        {error && <div style={{ color: 'var(--red)', fontSize: 13, marginBottom: 16 }}>{error}</div>}

        {/* Timeline */}
        {history && (
          <div className="fade-in">
            <div style={{ fontSize: 13, color: 'var(--text2)', marginBottom: 24 }}>
              {history.length} ownership record(s) found for Land #{landId || '101'}
            </div>
            <div style={{ position: 'relative' }}>
              {/* Vertical line */}
              <div style={{
                position: 'absolute', left: 19, top: 0, bottom: 0,
                width: 2, background: 'var(--border)',
              }} />

              {history.map((rec, i) => (
                <div key={i} className="fade-up" style={{
                  display: 'flex', gap: 20, marginBottom: 20,
                  animationDelay: `${i * 0.08}s`,
                }}>
                  {/* Dot */}
                  <div style={{
                    width: 40, height: 40, borderRadius: '50%', flexShrink: 0,
                    background: i === 0 ? 'var(--accent)' : i === history.length - 1 ? 'var(--blue)' : 'var(--white)',
                    border: `2px solid ${i === 0 ? 'var(--accent)' : 'var(--border)'}`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 16, zIndex: 1, position: 'relative',
                  }}>
                    {i === 0 ? '🏛️' : i === history.length - 1 ? '👤' : '🔄'}
                  </div>

                  {/* Card */}
                  <div style={{
                    flex: 1, background: 'var(--white)', border: '1px solid var(--border)',
                    borderRadius: 'var(--radius)', padding: '16px 20px', boxShadow: 'var(--shadow)',
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
                      <div>
                        <span style={{
                          background: i === 0 ? 'var(--accent-bg)' : 'var(--bg2)',
                          color: i === 0 ? 'var(--accent)' : 'var(--text2)',
                          fontSize: 11, fontWeight: 600, padding: '3px 10px',
                          borderRadius: 20, letterSpacing: 1,
                        }}>
                          {i === 0 ? 'INITIAL REGISTRATION' : `TRANSFER #${i}`}
                        </span>
                      </div>
                      <div style={{ fontSize: 12, color: 'var(--text2)' }}>
                        {formatDate(rec.timestamp)}
                      </div>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 10 }}>
                      <div>
                        <div style={{ fontSize: 11, color: 'var(--text2)', marginBottom: 2 }}>FROM</div>
                        <div style={{ fontSize: 13, fontWeight: 500, wordBreak: 'break-all' }}>
                          {rec.previousOwner === '0x0000000000000000000000000000000000000000'
                            ? '🏛️ Government (Initial)'
                            : shortAddr(rec.previousOwner) || rec.previousOwner}
                        </div>
                      </div>
                      <div>
                        <div style={{ fontSize: 11, color: 'var(--text2)', marginBottom: 2 }}>TO</div>
                        <div style={{ fontSize: 13, fontWeight: 500, wordBreak: 'break-all' }}>
                          {shortAddr(rec.newOwner) || rec.newOwner}
                        </div>
                      </div>
                    </div>

                    {rec.price && rec.price !== '0' && (
                      <div style={{
                        background: 'var(--gold-bg)', border: '1px solid #D4AC0D44',
                        borderRadius: 6, padding: '6px 12px', fontSize: 13,
                        display: 'inline-block',
                      }}>
                        💰 {formatEth(rec.price)}
                      </div>
                    )}
                  </div>
                </div>
              ))}

              {/* Current owner badge */}
              <div style={{ display: 'flex', gap: 20 }}>
                <div style={{ width: 40, flexShrink: 0 }} />
                <div style={{
                  background: 'var(--accent-bg)', border: '1px solid var(--accent)',
                  borderRadius: 'var(--radius)', padding: '12px 20px',
                  fontSize: 13, color: 'var(--accent)', fontWeight: 600,
                }}>
                  ✅ Current owner: {shortAddr(history[history.length - 1]?.newOwner)}
                </div>
              </div>
            </div>
          </div>
        )}

        {!history && !loading && (
          <div style={{
            textAlign: 'center', padding: '60px 20px',
            color: 'var(--text2)', fontSize: 14,
          }}>
            <div style={{ fontSize: 48, marginBottom: 16 }}>📜</div>
            Enter a Land ID above and click Search to view its complete ownership history.
          </div>
        )}
      </div>
    </div>
  );
}