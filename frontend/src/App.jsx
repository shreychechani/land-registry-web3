// App.jsx — Main app with page routing
import './index.css';
import { useState } from 'react';
import Navbar        from './components/Navbar';
import Home          from './pages/Home';
import Register      from './pages/Register';
import Marketplace   from './pages/Marketplace';
import History       from './pages/History';
import Verify        from './pages/Verify';
import Dashboard     from './pages/Dashboard';
import DisputeCenter from './pages/DisputeCenter';

export default function App() {
  const [page, setPage] = useState('home');

  const renderPage = () => {
    switch (page) {
      case 'home':        return <Home          setPage={setPage} />;
      case 'register':    return <Register      />;
      case 'marketplace': return <Marketplace   />;
      case 'history':     return <History       />;
      case 'verify':      return <Verify        />;
      case 'dashboard':   return <Dashboard     setPage={setPage} />;
      case 'dispute':     return <DisputeCenter />;
      default:            return <Home          setPage={setPage} />;
    }
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', background: 'var(--bg)' }}>
      {/* Navbar receives `page` (not currentPage) to match Navbar's prop name */}
      <Navbar page={page} setPage={setPage} />
      <main style={{ flex: 1 }}>{renderPage()}</main>
      <footer style={{
        borderTop: '1px solid var(--border)',
        padding: '24px 32px',
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        flexWrap: 'wrap', gap: 12,
        background: 'var(--white)',
        marginTop: 'auto',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ fontSize: 18 }}>🏛️</span>
          <span style={{ fontFamily: 'var(--font-display)', fontSize: 16 }}>LandChain</span>
        </div>
        <div style={{ fontSize: 12, color: 'var(--text2)' }}>
          Polygon Mumbai · Solidity · IPFS · OpenStreetMap · Inspired by IBM Ghana Land Registry
        </div>
        <div style={{ fontSize: 12, color: 'var(--text2)' }}>
          Built with ❤️ · Blockchain Land Registry Project
        </div>
      </footer>
    </div>
  );
}