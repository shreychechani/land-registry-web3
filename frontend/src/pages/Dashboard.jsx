import { useState, useEffect } from 'react';
import { getReadContract, getCurrentWallet, formatDate, formatEth } from '../utils/contract';
import { getIPFSUrl } from '../utils/ipfs';

export default function Dashboard({ setPage }) {
  const [wallet, setWallet] = useState('');
  const [lands, setLands] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => { loadMyLands(); }, []);

  const loadMyLands = async () => {
    setLoading(true); setError('');
    try {
      const address = await getCurrentWallet();
      if (!address) {
        setError('No wallet connected. Open MetaMask and connect.');
        setLoading(false); return;
      }
      setWallet(address);
      const contract = getReadContract();
      const landIds = await contract.getLandsByOwner(address);
      if (landIds.length === 0) { setLands([]); setLoading(false); return; }
      const details = await Promise.all(
        landIds.map(id => contract.getLandDetails(Number(id)).catch(() => null))
      );
      setLands(details.filter(Boolean));
    } catch (err) {
      setError('Could not load lands: ' + (err.reason || err.message || 'Is Hardhat running?'));
    }
    setLoading(false);
  };

  const badge = (land) => {
    if (land.isDisputed) return { label: 'DISPUTED',    bg: '#fff0f0', color: '#c0392b' };
    if (land.hasLien)    return { label: 'LIEN ACTIVE',  bg: '#fff3e0', color: '#e67e22' };
    if (land.isForSale)  return { label: 'FOR SALE',     bg: '#e6f4ea', color: '#166534' };
    return                      { label: 'CLEAN TITLE',  bg: '#e6f4ea', color: '#166534' };
  };

  return (
    <div style={{ maxWidth: 900, margin: '0 auto', padding: '48px 24px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
        <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 32 }}>My Lands</h1>
        <button onClick={loadMyLands} style={{
          background: 'var(--accent)', color: '#fff', border: 'none',
          padding: '10px 20px', borderRadius: 8, fontSize: 14, fontWeight: 600, cursor: 'pointer',
        }}>Refresh</button>
      </div>

      {wallet && <p style={{ color: 'var(--text2)', marginBottom: 24, fontSize: 13 }}>Wallet: <strong style={{ wordBreak: 'break-all' }}>{wallet}</strong></p>}

      <div style={{ background: '#f0f7ff', border: '1px solid #c5d8f0', borderRadius: 8, padding: '10px 16px', marginBottom: 24, fontSize: 13, color: '#1a4a7a' }}>
        After buying land in the Marketplace, click Refresh to see it here — ownership is read live from the blockchain.
      </div>

      {error && <div style={{ color: '#c0392b', background: '#fff0f0', border: '1px solid #ffaaaa', borderRadius: 8, padding: '12px 16px', marginBottom: 20, fontSize: 13 }}>{error}</div>}
      {loading && <div style={{ textAlign: 'center', padding: '60px 20px', color: 'var(--text2)' }}>Loading from blockchain...</div>}

      {!loading && lands.length === 0 && !error && (
        <div style={{ textAlign: 'center', padding: '60px 20px', color: 'var(--text2)' }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>🏠</div>
          <div style={{ marginBottom: 20 }}>No lands registered to this wallet.</div>
          <button onClick={() => setPage && setPage('register')} style={{
            background: 'var(--accent)', color: '#fff', border: 'none',
            padding: '12px 24px', borderRadius: 8, fontSize: 14, fontWeight: 600, cursor: 'pointer',
          }}>Register a Land</button>
        </div>
      )}

      {lands.map((land, i) => {
        const b = badge(land);
        return (
          <div key={i} style={{ background: 'var(--white)', border: '1px solid var(--border)', borderRadius: 12, padding: 24, marginBottom: 16, boxShadow: 'var(--shadow)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
              <div>
                <div style={{ fontSize: 18, fontWeight: 700, marginBottom: 4 }}>#{Number(land.landId)} — {land.title || ('Land #' + Number(land.landId))}</div>
                <div style={{ fontSize: 13, color: 'var(--text2)' }}>{land.gpsCoordinates}</div>
              </div>
              <span style={{ background: b.bg, color: b.color, fontSize: 11, fontWeight: 700, padding: '4px 10px', borderRadius: 20 }}>{b.label}</span>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 14 }}>
              <div>
                <div style={{ fontSize: 11, color: 'gray', marginBottom: 2 }}>AREA</div>
                <div style={{ fontSize: 14, fontWeight: 600 }}>{Number(land.areaSqMeters).toLocaleString()} m2</div>
              </div>
              <div>
                <div style={{ fontSize: 11, color: 'gray', marginBottom: 2 }}>REGISTERED</div>
                <div style={{ fontSize: 14, fontWeight: 600 }}>{formatDate(land.registeredAt)}</div>
              </div>
              {land.isForSale && (
                <div>
                  <div style={{ fontSize: 11, color: 'gray', marginBottom: 2 }}>ASKING PRICE</div>
                  <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--accent)' }}>{formatEth(land.salePrice)}</div>
                </div>
              )}
              <div>
                <div style={{ fontSize: 11, color: 'gray', marginBottom: 2 }}>TITLE DEED</div>
                <div style={{ fontSize: 13 }}>
                  {land.documentHash && land.documentHash !== 'no-document'
                    ? (<a href={getIPFSUrl(land.documentHash)} target="_blank" rel="noreferrer" style={{ color: '#2563eb' }}>View on IPFS</a>)
                    : '—'}
                </div>
              </div>
            </div>
            <div style={{ marginTop: 12, paddingTop: 12, borderTop: '1px solid var(--border)', fontSize: 12, color: 'gray' }}>
              Owner: <code style={{ fontSize: 11, background: '#f1f5f9', padding: '2px 5px', borderRadius: 4 }}>{land.owner}</code>
            </div>
          </div>
        );
      })}
    </div>
  );
}