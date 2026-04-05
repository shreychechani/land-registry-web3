// pages/Marketplace.jsx
import { useState, useEffect } from 'react';
import { getContract, getReadContract, formatEth, shortAddr } from '../utils/contract';
import { ethers } from 'ethers';

const DEMO_LISTINGS = [
  { landId: 101, owner: '0x1234...abcd', gps: '28.6139° N, 77.2090° E', area: 500, price: '0.5', isForSale: true },
  { landId: 102, owner: '0x5678...efgh', gps: '19.0760° N, 72.8777° E', area: 1200, price: '1.2', isForSale: true },
  { landId: 103, owner: '0x9abc...ijkl', gps: '12.9716° N, 77.5946° E', area: 800, price: '0.8', isForSale: true },
];

export default function Marketplace() {
  const [listings, setListings]   = useState(DEMO_LISTINGS);
  const [listForm, setListForm]   = useState({ landId: '', price: '' });
  const [status, setStatus]       = useState('');
  const [loading, setLoading]     = useState(null);
  const [tab, setTab]             = useState('browse');

  const handleBuy = async (land) => {
    setLoading(land.landId);
    setStatus('');
    try {
      const contract = await getContract();
      const tx = await contract.buyLand(land.landId, {
        value: ethers.parseEther(land.price)
      });
      setStatus('⏳ Waiting for confirmation...');
      await tx.wait();
      setStatus(`✅ You now own Land #${land.landId}!`);
      setListings(l => l.filter(x => x.landId !== land.landId));
    } catch (err) {
      setStatus('❌ ' + (err.reason || err.message));
    }
    setLoading(null);
  };

  const handleList = async () => {
    if (!listForm.landId || !listForm.price) { setStatus('❌ Fill in both fields.'); return; }
    setLoading('list');
    try {
      const contract = await getContract();
      const tx = await contract.listForSale(
        listForm.landId, ethers.parseEther(listForm.price)
      );
      setStatus('⏳ Waiting for confirmation...');
      await tx.wait();
      setStatus(`✅ Land #${listForm.landId} listed for ${listForm.price} ETH!`);
      setListForm({ landId: '', price: '' });
    } catch (err) {
      setStatus('❌ ' + (err.reason || err.message));
    }
    setLoading(null);
  };

  const TabBtn = ({ id, label }) => (
    <button onClick={() => setTab(id)} style={{
      padding: '8px 20px', borderRadius: 8, border: 'none', fontSize: 14, fontWeight: 500,
      background: tab === id ? 'var(--accent)' : 'transparent',
      color: tab === id ? '#fff' : 'var(--text2)',
      transition: 'all 0.15s',
    }}>{label}</button>
  );

  return (
    <div style={{ maxWidth: 1000, margin: '0 auto', padding: '48px 24px' }}>
      <div className="fade-up">
        <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 32, marginBottom: 8 }}>
          🤝 Marketplace
        </h1>
        <p style={{ color: 'var(--text2)', marginBottom: 32 }}>
          Buy and sell land parcels with instant blockchain ownership transfer.
        </p>

        {/* Tabs */}
        <div style={{
          display: 'flex', gap: 4, background: 'var(--bg2)',
          borderRadius: 10, padding: 4, marginBottom: 32, width: 'fit-content',
        }}>
          <TabBtn id="browse" label="Browse Listings" />
          <TabBtn id="sell"   label="List My Land" />
        </div>

        {status && (
          <div style={{
            background: status.startsWith('❌') ? 'var(--red-bg)' : 'var(--accent-bg)',
            border: `1px solid ${status.startsWith('❌') ? '#F1948A' : 'var(--accent)'}`,
            borderRadius: 8, padding: '12px 16px', marginBottom: 24,
            fontSize: 13, color: status.startsWith('❌') ? 'var(--red)' : 'var(--accent)',
          }}>{status}</div>
        )}

        {/* Browse */}
        {tab === 'browse' && (
          <div>
            <p style={{ fontSize: 13, color: 'var(--text2)', marginBottom: 20 }}>
              {listings.length} land parcel(s) available for purchase
            </p>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 16 }}>
              {listings.map(land => (
                <div key={land.landId} style={{
                  background: 'var(--white)', border: '1px solid var(--border)',
                  borderRadius: 'var(--radius)', overflow: 'hidden', boxShadow: 'var(--shadow)',
                }}>
                  <div style={{
                    background: 'linear-gradient(135deg, #E8F5E9, #F1F8E9)',
                    padding: '20px', textAlign: 'center',
                  }}>
                    <div style={{ fontSize: 40 }}>🏞️</div>
                    <div style={{ fontFamily: 'var(--font-display)', fontSize: 20, marginTop: 8 }}>
                      Land #{land.landId}
                    </div>
                  </div>
                  <div style={{ padding: '20px' }}>
                    <div style={{ fontSize: 13, color: 'var(--text2)', marginBottom: 12 }}>
                      <div>📍 {land.gps}</div>
                      <div>📐 {land.area} sq. meters</div>
                      <div>👤 {land.owner}</div>
                    </div>
                    <div style={{
                      display: 'flex', justifyContent: 'space-between',
                      alignItems: 'center', marginBottom: 16,
                    }}>
                      <div>
                        <div style={{ fontSize: 11, color: 'var(--text2)' }}>PRICE</div>
                        <div style={{ fontSize: 22, fontFamily: 'var(--font-display)', color: 'var(--accent)' }}>
                          {land.price} ETH
                        </div>
                      </div>
                      <div style={{
                        background: 'var(--accent-bg)', color: 'var(--accent)',
                        padding: '4px 10px', borderRadius: 20, fontSize: 11, fontWeight: 600,
                      }}>FOR SALE</div>
                    </div>
                    <button onClick={() => handleBuy(land)}
                      disabled={loading === land.landId} style={{
                        width: '100%', background: 'var(--accent)', color: '#fff',
                        border: 'none', padding: '12px', borderRadius: 8,
                        fontSize: 14, fontWeight: 600,
                        opacity: loading === land.landId ? 0.7 : 1,
                        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                      }}>
                      {loading === land.landId
                        ? <><span className="spinner" style={{ borderTopColor: '#fff', borderColor: '#ffffff55' }} /> Buying...</>
                        : '⚡ Buy Now'}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* List for sale */}
        {tab === 'sell' && (
          <div style={{
            background: 'var(--white)', border: '1px solid var(--border)',
            borderRadius: 'var(--radius)', padding: '32px', maxWidth: 480,
            boxShadow: 'var(--shadow)',
          }}>
            <h3 style={{ fontFamily: 'var(--font-display)', fontSize: 22, marginBottom: 20 }}>
              List Your Land For Sale
            </h3>
            <div style={{ marginBottom: 16 }}>
              <label style={{ fontSize: 13, fontWeight: 600, display: 'block', marginBottom: 6 }}>Land ID</label>
              <input value={listForm.landId} onChange={e => setListForm(f => ({ ...f, landId: e.target.value }))}
                placeholder="e.g. 1001" type="number"
                style={{ width: '100%', padding: '10px 14px', border: '1px solid var(--border)', borderRadius: 8, fontSize: 14 }} />
            </div>
            <div style={{ marginBottom: 24 }}>
              <label style={{ fontSize: 13, fontWeight: 600, display: 'block', marginBottom: 6 }}>Sale Price (ETH)</label>
              <input value={listForm.price} onChange={e => setListForm(f => ({ ...f, price: e.target.value }))}
                placeholder="e.g. 0.5" type="number" step="0.01"
                style={{ width: '100%', padding: '10px 14px', border: '1px solid var(--border)', borderRadius: 8, fontSize: 14 }} />
            </div>
            <div style={{
              background: 'var(--gold-bg)', border: '1px solid #D4AC0D',
              borderRadius: 8, padding: '12px 16px', marginBottom: 20, fontSize: 13,
            }}>
              ⚠️ Once listed, your land cannot be sold or transferred until you delist or a buyer purchases it.
            </div>
            <button onClick={handleList} disabled={loading === 'list'} style={{
              width: '100%', background: 'var(--accent)', color: '#fff',
              border: 'none', padding: '14px', borderRadius: 10, fontSize: 15, fontWeight: 600,
            }}>
              {loading === 'list' ? 'Listing...' : '📢 List For Sale'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}