// pages/Home.jsx
import { useState, useEffect } from 'react';
import { getReadContract } from '../utils/contract';

export default function Home({ setPage }) {
  const [stats, setStats] = useState({
    total: '—', transactions: '—', verified: '—', disputes: '—'
  });

  useEffect(() => {
    const loadStats = async () => {
      try {
        const contract = getReadContract();
        const total = await contract.getTotalLands();
        setStats(s => ({ ...s, total: Number(total).toString() }));
      } catch {
        // contract not yet connected — keep dashes
      }
    };
    loadStats();
  }, []);

  const statCards = [
    { label: 'Lands Registered', value: stats.total, icon: '🏠' },
    { label: 'Blockchain Network', value: 'Polygon', icon: '🔄' },
    { label: 'Verified On-Chain', value: '100%', icon: '✅' },
    { label: 'No Middlemen', value: '0', icon: '⚡' },
  ];

  const modules = [
    { id: 'register',    icon: '📋', title: 'Register Land',      desc: 'Register a new land parcel on the blockchain with GPS, documents and owner details.', color: '#2D5F3F' },
    { id: 'marketplace', icon: '🤝', title: 'Buy / Sell',         desc: 'List your land for sale or purchase listed parcels with instant smart contract transfer.', color: '#1A4A7A' },
    { id: 'history',     icon: '📜', title: 'Ownership History',  desc: 'View the complete tamper-proof chain of ownership for any land parcel by ID.', color: '#7A3A1A' },
    { id: 'verify',      icon: '✅', title: 'Verify Land',        desc: 'Instantly verify ownership, lien status and document integrity — for banks and lawyers.', color: '#4A1A7A' },
    { id: 'dashboard',   icon: '🏦', title: 'My Dashboard',       desc: 'View all land parcels owned by your connected wallet and manage your portfolio.', color: '#1A6A6A' },
    { id: 'dispute',     icon: '⚖️', title: 'Disputes',           desc: 'File a dispute or check the status of active disputes on any registered parcel.', color: '#7A1A1A' },
  ];

  return (
    <div style={{ maxWidth: 1100, margin: '0 auto', padding: '48px 24px' }}>

      {/* Hero */}
      <div className="fade-up" style={{ textAlign: 'center', marginBottom: 64 }}>
        <div style={{
          display: 'inline-block', background: 'var(--accent-bg)',
          color: 'var(--accent)', padding: '6px 16px', borderRadius: 20,
          fontSize: 12, fontWeight: 600, letterSpacing: 1, marginBottom: 20,
          border: '1px solid var(--accent)',
        }}>
          POWERED BY POLYGON BLOCKCHAIN · IPFS · OPENSTREETMAP
        </div>
        <h1 style={{
          fontFamily: 'var(--font-display)', fontSize: 'clamp(36px, 5vw, 60px)',
          lineHeight: 1.15, marginBottom: 20, color: 'var(--text)',
        }}>
          Land Registry,<br />
          <span style={{ color: 'var(--accent)' }}>Reimagined on Web3</span>
        </h1>
        <p style={{
          fontSize: 18, color: 'var(--text2)', maxWidth: 560,
          margin: '0 auto 36px', lineHeight: 1.7,
        }}>
          Immutable ownership records. Instant verification. No middlemen.
          Built for transparent, fraud-proof land governance.
        </p>
        <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
          <button onClick={() => setPage('register')} style={{
            background: 'var(--accent)', color: '#fff',
            border: 'none', padding: '14px 32px',
            borderRadius: 10, fontSize: 15, fontWeight: 600,
            transition: 'opacity 0.2s', cursor: 'pointer',
          }}
          onMouseOver={e => e.target.style.opacity = 0.85}
          onMouseOut={e => e.target.style.opacity = 1}>
            Register Land →
          </button>
          <button onClick={() => setPage('verify')} style={{
            background: 'var(--white)', color: 'var(--text)',
            border: '1px solid var(--border)', padding: '14px 32px',
            borderRadius: 10, fontSize: 15, fontWeight: 500, cursor: 'pointer',
          }}>
            Verify a Title
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="fade-up" style={{
        display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 64,
      }}>
        {statCards.map((s, i) => (
          <div key={i} style={{
            background: 'var(--white)', border: '1px solid var(--border)',
            borderRadius: 'var(--radius)', padding: '24px 20px', textAlign: 'center',
            boxShadow: 'var(--shadow)',
          }}>
            <div style={{ fontSize: 28, marginBottom: 8 }}>{s.icon}</div>
            <div style={{ fontSize: 28, fontFamily: 'var(--font-display)', color: 'var(--text)', marginBottom: 4 }}>
              {s.value}
            </div>
            <div style={{ fontSize: 13, color: 'var(--text2)' }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Modules grid */}
      <div style={{ marginBottom: 24 }}>
        <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 30, marginBottom: 8 }}>
          What You Can Do
        </h2>
        <p style={{ color: 'var(--text2)', marginBottom: 32 }}>
          Six modules covering the complete lifecycle of land ownership on-chain.
        </p>
        <div style={{
          display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 16,
        }}>
          {modules.map((m, i) => (
            <button key={i} onClick={() => setPage(m.id)} style={{
              background: 'var(--white)', border: '1px solid var(--border)',
              borderRadius: 'var(--radius)', padding: '28px 24px', textAlign: 'left',
              boxShadow: 'var(--shadow)', cursor: 'pointer',
              transition: 'all 0.2s', width: '100%',
            }}
            onMouseOver={e => { e.currentTarget.style.transform = 'translateY(-3px)'; e.currentTarget.style.boxShadow = 'var(--shadow-lg)'; }}
            onMouseOut={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = 'var(--shadow)'; }}>
              <div style={{
                width: 44, height: 44, borderRadius: 10, marginBottom: 16,
                background: m.color + '15', display: 'flex', alignItems: 'center',
                justifyContent: 'center', fontSize: 22,
              }}>{m.icon}</div>
              <div style={{ fontSize: 16, fontWeight: 600, marginBottom: 8, color: 'var(--text)' }}>
                {m.title}
              </div>
              <div style={{ fontSize: 13, color: 'var(--text2)', lineHeight: 1.6 }}>{m.desc}</div>
              <div style={{ marginTop: 16, fontSize: 13, color: m.color, fontWeight: 600 }}>
                Open →
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* How it works */}
      <div style={{
        marginTop: 64, background: 'var(--blue-bg)', border: '1px solid #C5D8F0',
        borderRadius: 'var(--radius)', padding: '28px 32px',
        display: 'flex', alignItems: 'center', gap: 24, flexWrap: 'wrap',
      }}>
        <div style={{ fontSize: 36 }}>🌍</div>
        <div>
          <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--blue)', marginBottom: 4, letterSpacing: 1 }}>
            HOW IT WORKS
          </div>
          <div style={{ fontSize: 16, fontWeight: 600, marginBottom: 6 }}>
            Blockchain-Powered Land Governance
          </div>
          <div style={{ fontSize: 13, color: 'var(--text2)' }}>
            Land records are stored immutably on Polygon blockchain. Title deeds are uploaded to IPFS.
            Ownership transfers happen atomically via smart contracts — no paperwork, no delays, no fraud.
            Verification is instant and available to anyone with the Land ID.
          </div>
        </div>
      </div>
    </div>
  );
}