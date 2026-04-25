// pages/History.jsx
import { useState } from 'react';
import { getReadContract, formatDate, formatEth, shortAddr } from '../utils/contract';

export default function History() {
  const [landId, setLandId]   = useState('');
  const [history, setHistory] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState('');

  const search = async () => {
    if (!landId) { setError('Please enter a Land ID'); return; }
    setLoading(true); setError(''); setHistory(null);
    try {
      const contract = getReadContract();
      const result = await contract.getLandHistory(parseInt(landId));
      if (result.length === 0) {
        setError(`No history found for Land #${landId}`);
      } else {
        setHistory(result);
      }
    } catch (err) {
      setError('Could not fetch history: ' + (err.reason || err.message || 'Check contract connection.'));
    }
    setLoading(false);
  };

  const getTransferLabel = (rec, index) => {
    if (index === 0) return 'INITIAL REGISTRATION';
    const price = rec.price ? Number(rec.price) : 0;
    if (rec.previousOwner === '0x0000000000000000000000000000000000000000') return 'INITIAL REGISTRATION';
    if (price === 0) return 'DISPUTE RESOLUTION / GOV TRANSFER';
    return `SALE TRANSFER #${index}`;
  };

  const getDotIcon = (rec, index, total) => {
    if (index === 0) return '🏛️';
    if (index === total - 1) return '👤';
    if (Number(rec.price) > 0) return '💰';
    return '⚖️';
  };

  return (
    <div style={{ maxWidth: 760, margin: '0 auto', padding: '48px 24px' }}>
      <div className="fade-up">
        <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 32, marginBottom: 8 }}>📜 Ownership History</h1>
        <p style={{ color: 'var(--text2)', marginBottom: 36 }}>
          View the complete tamper-proof chain of ownership for any land parcel.
          Every purchase, government registration, and dispute resolution is recorded here forever.
        </p>

        {/* Search */}
        <div style={{ display: 'flex', gap: 12, marginBottom: 36 }}>
          <input value={landId} onChange={e => setLandId(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && search()}
            placeholder="Enter Land ID (e.g. 1)" type="number"
            style={{
              flex: 1, padding: '12px 16px', border: '1px solid var(--border)',
              borderRadius: 10, fontSize: 15, background: 'var(--white)', outline: 'none',
            }} />
          <button onClick={search} disabled={loading} style={{
            background: 'var(--accent)', color: '#fff', border: 'none',
            padding: '12px 28px', borderRadius: 10, fontSize: 15, fontWeight: 600, cursor: 'pointer',
          }}>
            {loading ? '...' : 'Search'}
          </button>
        </div>

        {error && (
          <div style={{
            background: '#fff0f0', border: '1px solid #ffaaaa', borderRadius: 8,
            padding: '12px 16px', color: '#c0392b', fontSize: 14, marginBottom: 24,
          }}>{error}</div>
        )}

        {/* Timeline */}
        {history && (
          <div className="fade-in">
            <div style={{ fontSize: 13, color: 'var(--text2)', marginBottom: 24 }}>
              {history.length} ownership record(s) found for Land #{landId}
            </div>
            <div style={{ position: 'relative' }}>
              {/* Vertical line */}
              <div style={{
                position: 'absolute', left: 19, top: 0, bottom: 0,
                width: 2, background: 'var(--border)',
              }} />

              {history.map((rec, i) => {
                const hasPrice = rec.price && Number(rec.price) > 0;
                const label = getTransferLabel(rec, i);
                return (
                  <div key={i} className="fade-up" style={{
                    display: 'flex', gap: 20, marginBottom: 20,
                    animationDelay: `${i * 0.08}s`,
                  }}>
                    {/* Dot */}
                    <div style={{
                      width: 40, height: 40, borderRadius: '50%', flexShrink: 0,
                      background: i === 0 ? 'var(--accent)' : i === history.length - 1 ? '#2563eb' : 'var(--white)',
                      border: `2px solid ${i === 0 ? 'var(--accent)' : '#e5e7eb'}`,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: 16, zIndex: 1, position: 'relative',
                    }}>
                      {getDotIcon(rec, i, history.length)}
                    </div>

                    {/* Card */}
                    <div style={{
                      flex: 1, background: 'var(--white)', border: '1px solid var(--border)',
                      borderRadius: 'var(--radius)', padding: '16px 20px', boxShadow: 'var(--shadow)',
                    }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
                        <span style={{
                          background: i === 0 ? 'var(--accent-bg)' : hasPrice ? '#f0fdf4' : '#f8f9fa',
                          color: i === 0 ? 'var(--accent)' : hasPrice ? '#166534' : 'var(--text2)',
                          fontSize: 11, fontWeight: 600, padding: '3px 10px',
                          borderRadius: 20, letterSpacing: 0.5,
                        }}>
                          {label}
                        </span>
                        <div style={{ fontSize: 12, color: 'var(--text2)' }}>
                          {formatDate(rec.timestamp)}
                        </div>
                      </div>

                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: hasPrice ? 10 : 0 }}>
                        <div>
                          <div style={{ fontSize: 11, color: 'var(--text2)', marginBottom: 2, fontWeight: 600 }}>FROM</div>
                          <div style={{ fontSize: 13, fontWeight: 500, wordBreak: 'break-all' }}>
                            {rec.previousOwner === '0x0000000000000000000000000000000000000000'
                              ? '🏛️ Government (Initial Registration)'
                              : shortAddr(rec.previousOwner)}
                          </div>
                          {rec.previousOwner !== '0x0000000000000000000000000000000000000000' && (
                            <div style={{ fontSize: 10, color: 'var(--text2)', wordBreak: 'break-all', marginTop: 2 }}>
                              {rec.previousOwner}
                            </div>
                          )}
                        </div>
                        <div>
                          <div style={{ fontSize: 11, color: 'var(--text2)', marginBottom: 2, fontWeight: 600 }}>TO</div>
                          <div style={{ fontSize: 13, fontWeight: 500, wordBreak: 'break-all' }}>
                            {i === history.length - 1
                              ? `👤 ${shortAddr(rec.newOwner)} (Current Owner)`
                              : shortAddr(rec.newOwner)}
                          </div>
                          <div style={{ fontSize: 10, color: 'var(--text2)', wordBreak: 'break-all', marginTop: 2 }}>
                            {rec.newOwner}
                          </div>
                        </div>
                      </div>

                      {hasPrice && (
                        <div style={{
                          background: '#fffbeb', border: '1px solid #fde68a',
                          borderRadius: 6, padding: '6px 12px', fontSize: 13,
                          display: 'inline-block', marginTop: 4,
                        }}>
                          💰 Sold for {formatEth(rec.price)}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}

              {/* Current owner badge */}
              <div style={{ display: 'flex', gap: 20 }}>
                <div style={{ width: 40, flexShrink: 0 }} />
                <div style={{
                  background: 'var(--accent-bg)', border: '1px solid var(--accent)',
                  borderRadius: 'var(--radius)', padding: '12px 20px',
                  fontSize: 13, color: 'var(--accent)', fontWeight: 600,
                }}>
                  ✅ Current owner: {shortAddr(history[history.length - 1]?.newOwner)}
                  <span style={{ fontSize: 11, marginLeft: 8, opacity: 0.8, wordBreak: 'break-all' }}>
                    ({history[history.length - 1]?.newOwner})
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}

        {!history && !loading && !error && (
          <div style={{
            textAlign: 'center', padding: '60px 20px',
            color: 'var(--text2)', fontSize: 14,
          }}>
            <div style={{ fontSize: 48, marginBottom: 16 }}>📜</div>
            Enter a Land ID above and click Search to view its complete ownership history.
            <div style={{ fontSize: 13, marginTop: 12, color: 'var(--text2)' }}>
              Every purchase shows the previous owner → new owner and the price paid in MATIC.
            </div>
          </div>
        )}
      </div>
    </div>
  );
}