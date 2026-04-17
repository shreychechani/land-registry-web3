// pages/Dashboard.jsx
import { useState, useEffect } from 'react';
import { getReadContract, getCurrentWallet, shortAddr, formatDate } from '../utils/contract';

export default function Dashboard({ setPage }) {
  const [wallet, setWallet]   = useState('');
  const [lands, setLands]     = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState('');

  useEffect(() => {
    loadMyLands();
  }, []);

  const loadMyLands = async () => {
    setLoading(true); setError('');
    try {
      const address = await getCurrentWallet();
      if (!address) { setError('No wallet connected. Open MetaMask and connect.'); setLoading(false); return; }
      setWallet(address);

      const contract = await getReadContract();

      // Query all LandRegistered events from block 0 to latest
      const filter = contract.filters.LandRegistered();
      const events = await contract.queryFilter(filter, 0, 'latest');

      // For each event where owner matches current wallet, get full land details
      const myLandIds = events
        .filter(e => e.args.owner.toLowerCase() === address.toLowerCase())
        .map(e => Number(e.args.landId));

      const details = await Promise.all(
        myLandIds.map(id => contract.getLandDetails(id).catch(() => null))
      );

      setLands(details.filter(Boolean));
    } catch (err) {
      setError('Error: ' + (err.reason || err.message || 'Could not load. Is Hardhat running?'));
    }
    setLoading(false);
  };

  return (
    <div style={{ maxWidth: 900, margin: '0 auto', padding: '48px 24px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
        <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 32 }}>🏦 My Lands</h1>
        <button onClick={loadMyLands} style={{
          background: 'var(--accent)', color: '#fff', border: 'none',
          padding: '10px 20px', borderRadius: 8, fontSize: 14, fontWeight: 600,
        }}>
          🔄 Refresh
        </button>
      </div>

      {wallet && (
        <p style={{ color: 'var(--text2)', marginBottom: 32, fontSize: 13 }}>
          Showing lands registered to: <strong style={{ wordBreak: 'break-all' }}>{wallet}</strong>
        </p>
      )}

      {error && (
        <div style={{
          color: 'red', background: '#fff0f0', border: '1px solid #ffaaaa',
          borderRadius: 8, padding: '12px 16px', marginBottom: 20, fontSize: 13,
        }}>
          {error}
        </div>
      )}

      {loading && (
        <div style={{ textAlign: 'center', padding: '60px 20px', color: 'var(--text2)' }}>
          Loading your lands from blockchain...
        </div>
      )}

      {!loading && lands.length === 0 && !error && (
        <div style={{ textAlign: 'center', padding: '60px 20px', color: 'var(--text2)' }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>🏠</div>
          <div style={{ marginBottom: 20 }}>No lands found for your wallet.</div>
          <button onClick={() => setPage('register')} style={{
            background: 'var(--accent)', color: '#fff', border: 'none',
            padding: '12px 24px', borderRadius: 8, fontSize: 14, fontWeight: 600,
          }}>
            Register a Land
          </button>
        </div>
      )}

      {lands.map((land, i) => (
        <div key={i} style={{
          background: 'var(--white)', border: '1px solid var(--border)',
          borderRadius: 12, padding: '24px', marginBottom: 16,
          boxShadow: 'var(--shadow)',
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
            <div>
              <div style={{ fontSize: 18, fontWeight: 700, marginBottom: 4 }}>
                Land #{Number(land.landId)}
              </div>
              <div style={{ fontSize: 13, color: 'var(--text2)' }}>{land.gpsCoordinates}</div>
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              {land.isForSale && (
                <span style={{ background: '#e6f4ea', color: 'green', fontSize: 11, fontWeight: 600, padding: '4px 10px', borderRadius: 20 }}>
                  FOR SALE
                </span>
              )}
              {land.hasLien && (
                <span style={{ background: '#fff3e0', color: 'orange', fontSize: 11, fontWeight: 600, padding: '4px 10px', borderRadius: 20 }}>
                  LIEN ACTIVE
                </span>
              )}
              {land.isDisputed && (
                <span style={{ background: '#fff0f0', color: 'red', fontSize: 11, fontWeight: 600, padding: '4px 10px', borderRadius: 20 }}>
                  DISPUTED
                </span>
              )}
              {!land.isForSale && !land.hasLien && !land.isDisputed && (
                <span style={{ background: '#e6f4ea', color: 'green', fontSize: 11, fontWeight: 600, padding: '4px 10px', borderRadius: 20 }}>
                  CLEAN TITLE
                </span>
              )}
            </div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
            <div>
              <div style={{ fontSize: 11, color: 'gray', marginBottom: 2 }}>AREA</div>
              <div style={{ fontSize: 14, fontWeight: 600 }}>{Number(land.areaSqMeters)} sq.m</div>
            </div>
            <div>
              <div style={{ fontSize: 11, color: 'gray', marginBottom: 2 }}>REGISTERED</div>
              <div style={{ fontSize: 14, fontWeight: 600 }}>{formatDate(land.registeredAt)}</div>
            </div>
            <div>
              <div style={{ fontSize: 11, color: 'gray', marginBottom: 2 }}>DOCUMENT HASH</div>
              <div style={{ fontSize: 12, fontWeight: 600, wordBreak: 'break-all' }}>{land.documentHash || '—'}</div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}