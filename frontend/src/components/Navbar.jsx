// components/Navbar.jsx
import { useState, useEffect } from 'react';
import { getCurrentWallet, shortAddr } from '../utils/contract';

const pages = [
  { id: 'home',        label: 'Home' },
  { id: 'register',   label: 'Register Land' },
  { id: 'marketplace',label: 'Marketplace' },
  { id: 'history',    label: 'History' },
  { id: 'verify',     label: 'Verify' },
  { id: 'dashboard',  label: 'My Lands' },
];

export default function Navbar({ currentPage, setPage }) {
  const [wallet, setWallet] = useState(null);
  const [connecting, setConnecting] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    getCurrentWallet().then(setWallet);
    if (window.ethereum) {
      window.ethereum.on('accountsChanged', (accs) => setWallet(accs[0] || null));
    }
  }, []);

  const connect = async () => {
    setConnecting(true);
    try {
      const accs = await window.ethereum.request({ method: 'eth_requestAccounts' });
      setWallet(accs[0]);
    } catch {}
    setConnecting(false);
  };

  return (
    <nav style={{
      position: 'sticky', top: 0, zIndex: 100,
      background: 'rgba(247,246,242,0.92)',
      backdropFilter: 'blur(12px)',
      borderBottom: '1px solid var(--border)',
      padding: '0 32px',
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      height: 64,
    }}>
      {/* Logo */}
      <button onClick={() => setPage('home')} style={{
        background: 'none', border: 'none', display: 'flex', alignItems: 'center', gap: 10,
      }}>
        <div style={{
          width: 32, height: 32, background: 'var(--accent)',
          borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 16,
        }}>🏛️</div>
        <span style={{ fontFamily: 'var(--font-display)', fontSize: 20, color: 'var(--text)' }}>
          LandChain
        </span>
      </button>

      {/* Desktop nav links */}
      <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
        {pages.filter(p => p.id !== 'home').map(p => (
          <button key={p.id} onClick={() => setPage(p.id)} style={{
            background: currentPage === p.id ? 'var(--accent-bg)' : 'none',
            border: 'none',
            color: currentPage === p.id ? 'var(--accent)' : 'var(--text2)',
            padding: '6px 14px',
            borderRadius: 8,
            fontSize: 14,
            fontWeight: currentPage === p.id ? 600 : 400,
            transition: 'all 0.15s',
          }}>{p.label}</button>
        ))}
      </div>

      {/* Wallet button */}
      <button onClick={wallet ? undefined : connect} style={{
        background: wallet ? 'var(--accent-bg)' : 'var(--accent)',
        color: wallet ? 'var(--accent)' : '#fff',
        border: wallet ? '1px solid var(--accent)' : 'none',
        padding: '8px 18px',
        borderRadius: 20,
        fontSize: 13,
        fontWeight: 600,
        display: 'flex', alignItems: 'center', gap: 8,
        transition: 'all 0.2s',
      }}>
        <span style={{ fontSize: 10, color: wallet ? 'var(--accent)' : '#fff' }}>●</span>
        {connecting ? 'Connecting...' : wallet ? shortAddr(wallet) : 'Connect Wallet'}
      </button>
    </nav>
  );
}