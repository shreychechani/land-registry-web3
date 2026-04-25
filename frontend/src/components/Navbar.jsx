// components/Navbar.jsx
import { useState, useEffect } from 'react';
import { connectWallet, getCurrentWallet, getBalance, onAccountChange, shortAddr } from '../utils/contract';

export default function Navbar({ page, setPage }) {
  const [wallet,     setWallet]     = useState(null);
  const [balance,    setBalance]    = useState('0');
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    getCurrentWallet().then(async (addr) => {
      if (addr) {
        setWallet(addr);
        const bal = await getBalance(addr);
        setBalance(parseFloat(bal).toFixed(3));
      }
    });
    onAccountChange(async (addr) => {
      setWallet(addr);
      if (addr) {
        const bal = await getBalance(addr);
        setBalance(parseFloat(bal).toFixed(3));
      } else {
        setBalance('0');
      }
    });
  }, []);

  const connect = async () => {
    try {
      const addr = await connectWallet();
      setWallet(addr);
      const bal = await getBalance(addr);
      setBalance(parseFloat(bal).toFixed(3));
    } catch (e) {
      alert(e.message);
    }
  };

  const navLinks = [
    { id: 'home',         label: '🏠 Home' },
    { id: 'register',    label: '📋 Register' },
    { id: 'marketplace', label: '🤝 Buy/Sell' },
    { id: 'history',     label: '📜 History' },
    { id: 'verify',      label: '✅ Verify' },
    { id: 'dashboard',   label: '🏦 Dashboard' },
    { id: 'dispute',     label: '⚖️ Disputes' },  // ← added
  ];

  return (
    <nav style={{
      background: 'var(--white)', borderBottom: '1px solid var(--border)',
      padding: '0 24px', display: 'flex', alignItems: 'center',
      justifyContent: 'space-between', height: 60, position: 'sticky',
      top: 0, zIndex: 100, boxShadow: 'var(--shadow)',
    }}>
      {/* Logo */}
      <div
        onClick={() => setPage('home')}
        style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 20, cursor: 'pointer', color: 'var(--accent)' }}
      >
        🏛️ LandChain
      </div>

      {/* Desktop links */}
      <div style={{ display: 'flex', gap: 2, alignItems: 'center' }}>
        {navLinks.map(l => (
          <button key={l.id} onClick={() => setPage(l.id)} style={{
            background: page === l.id ? 'var(--accent-bg)' : 'transparent',
            color: page === l.id ? 'var(--accent)' : 'var(--text2)',
            border: 'none', padding: '6px 10px', borderRadius: 8,
            fontSize: 12, fontWeight: page === l.id ? 700 : 500,
            cursor: 'pointer', transition: '0.15s', whiteSpace: 'nowrap',
          }}>{l.label}</button>
        ))}
      </div>

      {/* Wallet + hamburger */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        {wallet ? (
          <div style={{
            background: 'var(--accent-bg)', border: '1px solid var(--accent)',
            borderRadius: 20, padding: '6px 14px', fontSize: 13, color: 'var(--accent)', fontWeight: 600,
            whiteSpace: 'nowrap',
          }}>
            {balance} MATIC · {shortAddr(wallet)}
          </div>
        ) : (
          <button onClick={connect} style={{
            background: 'var(--accent)', color: '#fff', border: 'none',
            padding: '8px 16px', borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: 'pointer',
          }}>Connect Wallet</button>
        )}

        {/* Mobile hamburger */}
        <button
          onClick={() => setMobileOpen(o => !o)}
          style={{ background: 'none', border: 'none', fontSize: 22, cursor: 'pointer' }}
          className="mobile-menu-btn"
        >☰</button>
      </div>

      {/* Mobile dropdown */}
      {mobileOpen && (
        <div style={{
          position: 'absolute', top: 60, left: 0, right: 0,
          background: 'var(--white)', borderBottom: '1px solid var(--border)',
          padding: 16, display: 'flex', flexDirection: 'column', gap: 8, zIndex: 200,
        }}>
          {navLinks.map(l => (
            <button key={l.id} onClick={() => { setPage(l.id); setMobileOpen(false); }} style={{
              background: page === l.id ? 'var(--accent-bg)' : 'transparent',
              color: page === l.id ? 'var(--accent)' : 'var(--text)',
              border: 'none', padding: '10px 14px', borderRadius: 8,
              fontSize: 14, fontWeight: page === l.id ? 700 : 500,
              cursor: 'pointer', textAlign: 'left',
            }}>{l.label}</button>
          ))}
        </div>
      )}
    </nav>
  );
}