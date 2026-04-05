// pages/Dashboard.jsx
import { useState, useEffect } from 'react';
import { getCurrentWallet, getReadContract, shortAddr, formatDate } from '../utils/contract';

const DEMO_LANDS = [
  { landId: 101, gps: '28.6139° N, 77.2090° E', area: 500, isForSale: false, hasLien: false, isDisputed: false, registeredAt: '1609459200' },
  { landId: 205, gps: '19.0760° N, 72.8777° E', area: 1200, isForSale: true, hasLien: false, isDisputed: false, registeredAt: '1641000000' },
];

const Badge = ({ text, color, bg }) => (
  <span style={{
    background: bg, color, padding: '3px 10px',
    borderRadius: 20, fontSize: 11, fontWeight: 600,
  }}>{text}</span>
);

export default function Dashboard({ setPage }) {
  const [wallet, setWallet]   = useState(null);
  const [lands, setLands]     = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getCurrentWallet().then(async (w) => {
      setWallet(w);
      // In production: query contract for all lands owned by w
      // For now show demo data
      setTimeout(() => { setLands(DEMO_LANDS); setLoading(false); }, 800);
    });
  }, []);

  const getStatus = (land) => {
    if (land.isDisputed) return { text: 'DISPUTED', color: 'var(--red)', bg: 'var(--red-bg)' };
    if (land.hasLien)    return { text: 'MORTGAGED', color: 'var(--gold)', bg: 'var(--gold-bg)' };
    if (land.isForSale)  return { text: 'FOR SALE', color: 'var(--blue)', bg: 'var(--blue-bg)' };
    return { text: 'OWNED', color: 'var(--accent)', bg: 'var(--accent-bg)' };
  };

  if (!wallet) return (
    <div style={{ maxWidth: 480, margin: '80px auto', padding: '0 24px', textAlign: 'center' }}>
      <div style={{ fontSize: 56, marginBottom: 20 }}>🔗</div>
      <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 26, marginBottom: 12 }}>Connect Your Wallet</h2>
      <p style={{ color: 'var(--text2)' }}>Connect MetaMask to view your land portfolio.</p>
    </div>
  );

  return (
    <div style={{ maxWidth: 1000, margin: '0 auto', padding: '48px 24px' }}>
      <div className="fade-up">
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 32, flexWrap: 'wrap', gap: 16 }}>
          <div>
            <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 32, marginBottom: 8 }}>🏦 My Dashboard</h1>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--accent)' }} />
              <span style={{ fontSize: 13, color: 'var(--text2)', fontFamily: 'monospace' }}>{wallet}</span>
            </div>
          </div>
          <button onClick={() => setPage('register')} style={{
            background: 'var(--accent)', color: '#fff', border: 'none',
            padding: '10px 22px', borderRadius: 10, fontSize: 14, fontWeight: 600,
          }}>+ Register New Land</button>
        </div>

        {/* Stats row */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14, marginBottom: 36 }}>
          {[
            { label: 'Total Lands', value: lands.length, icon: '🏠' },
            { label: 'For Sale', value: lands.filter(l => l.isForSale).length, icon: '📢' },
            { label: 'Mortgaged', value: lands.filter(l => l.hasLien).length, icon: '🏦' },
            { label: 'Disputed', value: lands.filter(l => l.isDisputed).length, icon: '⚖️' },
          ].map((s, i) => (
            <div key={i} style={{
              background: 'var(--white)', border: '1px solid var(--border)',
              borderRadius: 'var(--radius)', padding: '20px 16px', textAlign: 'center',
              boxShadow: 'var(--shadow)',
            }}>
              <div style={{ fontSize: 24, marginBottom: 8 }}>{s.icon}</div>
              <div style={{ fontSize: 28, fontFamily: 'var(--font-display)', marginBottom: 4 }}>{s.value}</div>
              <div style={{ fontSize: 12, color: 'var(--text2)' }}>{s.label}</div>
            </div>
          ))}
        </div>

        {/* Land cards */}
        {loading ? (
          <div style={{ textAlign: 'center', padding: 60, color: 'var(--text2)' }}>
            <span className="spinner" style={{ width: 32, height: 32 }} />
            <p style={{ marginTop: 16 }}>Loading your lands...</p>
          </div>
        ) : lands.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '60px 20px', color: 'var(--text2)' }}>
            <div style={{ fontSize: 48, marginBottom: 16 }}>🏞️</div>
            <p>You don't own any registered land parcels yet.</p>
            <button onClick={() => setPage('register')} style={{
              marginTop: 16, background: 'var(--accent)', color: '#fff',
              border: 'none', padding: '12px 24px', borderRadius: 10, fontSize: 14, fontWeight: 600,
            }}>Register Your First Land</button>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 16 }}>
            {lands.map((land, i) => {
              const s = getStatus(land);
              return (
                <div key={i} className="fade-up" style={{
                  background: 'var(--white)', border: '1px solid var(--border)',
                  borderRadius: 'var(--radius)', overflow: 'hidden', boxShadow: 'var(--shadow)',
                  animationDelay: `${i * 0.07}s`,
                }}>
                  <div style={{
                    background: 'linear-gradient(135deg, #E8F5E9, #F0F4F8)',
                    padding: '16px 20px',
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                  }}>
                    <div style={{ fontFamily: 'var(--font-display)', fontSize: 18 }}>
                      🏠 Land #{land.landId}
                    </div>
                    <Badge text={s.text} color={s.color} bg={s.bg} />
                  </div>
                  <div style={{ padding: '20px' }}>
                    <div style={{ fontSize: 13, color: 'var(--text2)', marginBottom: 16, lineHeight: 1.8 }}>
                      <div>📍 {land.gps}</div>
                      <div>📐 {land.area} sq. meters</div>
                      <div>📅 Registered: {formatDate(land.registeredAt)}</div>
                    </div>
                    <div style={{ display: 'flex', gap: 8 }}>
                      <button onClick={() => setPage('history')} style={{
                        flex: 1, background: 'var(--bg2)', color: 'var(--text)',
                        border: '1px solid var(--border)', padding: '8px', borderRadius: 8,
                        fontSize: 12, fontWeight: 500,
                      }}>📜 History</button>
                      <button onClick={() => setPage('verify')} style={{
                        flex: 1, background: 'var(--bg2)', color: 'var(--text)',
                        border: '1px solid var(--border)', padding: '8px', borderRadius: 8,
                        fontSize: 12, fontWeight: 500,
                      }}>✅ Verify</button>
                      {!land.isForSale && (
                        <button onClick={() => setPage('marketplace')} style={{
                          flex: 1, background: 'var(--accent)', color: '#fff',
                          border: 'none', padding: '8px', borderRadius: 8,
                          fontSize: 12, fontWeight: 500,
                        }}>📢 Sell</button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}