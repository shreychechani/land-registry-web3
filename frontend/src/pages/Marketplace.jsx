import { useState, useEffect } from 'react';
import { ethers } from 'ethers';
import { getContract } from '../utils/contract';
import { geocodeAddress, calculateDistance, parseCoordinates } from '../utils/location';

// Demo listings for UI testing (Includes Jaipur example)
const DEMO_LISTINGS = [
  { landId: 101, owner: '0x1234...abcd', gps: '28.6139° N, 77.2090° E', area: 500, price: '0.5', isForSale: true },
  { landId: 1001, owner: '0xf39F...2266', gps: '26.9124° N, 75.7873° E', area: 750, price: '2.5', isForSale: true },
  { landId: 102, owner: '0x5678...efgh', gps: '19.0760° N, 72.8777° E', area: 1200, price: '1.2', isForSale: true },
];

/**
 * Marketplace Component
 * Features:
 * 1. Browse nearby land using location-based search (Geocoding).
 * 2. List property for sale on the blockchain.
 * 3. Secure ownership transfer via buy functionality.
 */
export default function Marketplace() {
  const [allListings, setAllListings] = useState(DEMO_LISTINGS);
  const [displayListings, setDisplayListings] = useState(DEMO_LISTINGS);
  const [listForm, setListForm] = useState({ landId: '', price: '' });
  const [status, setStatus] = useState('');
  const [loading, setLoading] = useState(null);
  const [tab, setTab] = useState('browse');

  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);

  /**
   * handleSearch
   * Leverages geocoding to find land within a 15km radius of a searched location.
   */
  const handleSearch = async (e) => {
    e.preventDefault();
    if (!searchQuery.trim()) {
      setDisplayListings(allListings);
      setStatus('');
      return;
    }

    setIsSearching(true);
    setStatus('🔍 Analyzing location: ' + searchQuery + '...');

    try {
      const targetLoc = await geocodeAddress(searchQuery);
      if (!targetLoc) {
        setStatus('❌ Location not found. Try "Jaipur" or "Mansarovar".');
        setIsSearching(false);
        return;
      }

      setStatus(`📍 Showing lands within 20km of ${targetLoc.displayName.split(',')[0]}...`);

      const filtered = allListings.filter(land => {
        const landCoords = parseCoordinates(land.gps);
        if (!landCoords) return false;

        const dist = calculateDistance(
          targetLoc.lat, targetLoc.lon,
          landCoords.lat, landCoords.lon
        );

        return dist <= 20;
      });

      setDisplayListings(filtered);

      if (filtered.length === 0) {
        setStatus('No properties currently listed in this specific area.');
      } else {
        setStatus(`Found ${filtered.length} matching result(s).`);
      }
    } catch (err) {
      setStatus('Search failed. Please try again.');
    }
    setIsSearching(false);
  };

  /**
   * handleBuy
   * Executes the blockchain purchase of a land parcel.
   */
  const handleBuy = async (land) => {
    setLoading(land.landId);
    setStatus('');
    try {
      const contract = await getContract();
      const priceInWei = ethers.parseUnits(land.price.toString(), 'ether');

      const tx = await contract.buyLand(land.landId, {
        value: priceInWei
      });

      setStatus('Confirming transaction on blockchain...');
      await tx.wait();

      setStatus(`Success! You are now the legal owner of Land #${land.landId}.`);

      // Update UI state
      const updated = allListings.filter(x => x.landId !== land.landId);
      setAllListings(updated);
      setDisplayListings(updated);
    } catch (err) {
      setStatus('❌ ' + (err.reason || "Transaction failed."));
    }
    setLoading(null);
  };

  /**
   * handleList
   * Lists a user-owned land parcel for sale on the marketplace.
   */
  const handleList = async (e) => {
    e.preventDefault();
    if (!listForm.landId || !listForm.price) {
      setStatus('Please provide both Land ID and Asking Price.');
      return;
    }

    setLoading('list');
    setStatus('Processing listing on blockchain...');

    try {
      const contract = await getContract();
      const priceInWei = ethers.parseUnits(listForm.price.toString(), 'ether');

      const tx = await contract.listForSale(listForm.landId, priceInWei);

      setStatus('Waiting for block confirmation...');
      await tx.wait();

      setStatus(`Success! Land #${listForm.landId} is now listed for ${listForm.price} ETH.`);
      setListForm({ landId: '', price: '' });

    } catch (err) {
      setStatus('❌ ' + (err.reason || "Only the land owner can list this property."));
    }
    setLoading(null);
  };

  const TabBtn = ({ id, label }) => (
    <button onClick={() => setTab(id)} style={{
      padding: '12px 28px', borderRadius: 12, border: 'none', fontSize: 14, fontWeight: 800,
      background: tab === id ? '#48a07c' : 'transparent',
      color: tab === id ? '#fff' : '#888',
      transition: '0.2s', cursor: 'pointer', letterSpacing: '0.05em'
    }}>{label}</button>
  );

  return (
    <div style={{ maxWidth: 1050, margin: '0 auto', padding: '50px 25px' }}>
      <div style={{ textAlign: 'center', marginBottom: 40 }}>
        <h1 style={{ fontSize: 38, fontWeight: 900, marginBottom: 12, trackingTight: '-0.025em' }}>🤝 Marketplace</h1>
        <p style={{ color: '#666', fontSize: 16 }}>Securely buy, sell, and verify land parcels on the Polygon network.</p>
      </div>

      {/* Primary Navigation */}
      <div style={{ display: 'flex', gap: 8, background: '#f5f5f5', padding: 6, borderRadius: 16, width: 'fit-content', margin: '0 auto 40px auto' }}>
        <TabBtn id="browse" label="BROWSE NEARBY" />
        <TabBtn id="sell" label="LIST PROPERTY" />
      </div>

      {status && (
        <div style={{
          padding: '18px 24px', borderRadius: 14, marginBottom: 30,
          background: status.includes('✅') ? '#ecfdf5' : status.includes('❌') ? '#fff1f2' : '#eff6ff',
          color: status.includes('✅') ? '#065f46' : status.includes('❌') ? '#991b1b' : '#1e40af',
          fontWeight: 700, border: '1px solid currentColor', opacity: 0.9, fontSize: 14,
          display: 'flex', justifyContent: 'space-between', alignItems: 'center'
        }}>
          <span>{status}</span>
          {searchQuery && tab === 'browse' && (
            <button onClick={() => { setSearchQuery(''); setDisplayListings(allListings); setStatus(''); }}
              style={{ background: 'none', border: 'none', color: 'inherit', textDecoration: 'underline', cursor: 'pointer', fontSize: 11 }}>
              Reset Search
            </button>
          )}
        </div>
      )}

      {/* Tab Content: Browse */}
      {tab === 'browse' && (
        <>
          <form onSubmit={handleSearch} style={{ display: 'flex', gap: 12, marginBottom: 40 }}>
            <input
              placeholder="Suggest land near... (e.g. Jaipur, Mansarovar)"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{ flex: 1, padding: '18px 24px', borderRadius: 16, border: '2px solid #eee', outline: 'none', fontSize: 16, transition: 'border 0.2s' }}
              onFocus={(e) => e.target.style.borderColor = '#48a07c'}
              onBlur={(e) => e.target.style.borderColor = '#eee'}
            />
            <button type="submit" disabled={isSearching} style={{ background: '#48a07c', color: '#fff', border: 'none', padding: '0 40px', borderRadius: 16, fontWeight: 900, fontSize: 14, cursor: 'pointer', transition: 'all 0.2s' }}>
              {isSearching ? '...' : 'SEARCH NEARBY'}
            </button>
          </form>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 30 }}>
            {displayListings.map(land => (
              <div key={land.landId} style={{
                background: '#fff', borderRadius: 28, border: '1px solid #f0f0f0', overflow: 'hidden',
                boxShadow: '0 10px 25px -5px rgba(0,0,0,0.05)', transition: 'transform 0.3s'
              }}
                onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-6px)'}
                onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}
              >
                <div style={{ background: 'linear-gradient(to bottom, #f0fdf4, #fff)', padding: 45, textAlign: 'center', fontSize: 56 }}>🏡</div>
                <div style={{ padding: 28 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                    <h3 style={{ margin: 0, fontWeight: 900, fontSize: 22 }}>Land #{land.landId}</h3>
                    <span style={{ fontSize: 10, fontWeight: 900, background: '#ecfdf5', color: '#059669', padding: '4px 10px', borderRadius: 20 }}>VERIFIED</span>
                  </div>
                  <p style={{ fontSize: 14, color: '#6b7280', marginBottom: 20 }}>📍 {land.gps}</p>

                  <div style={{ padding: '20px 0', borderTop: '1px solid #f9fafb', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <span style={{ display: 'block', fontSize: 10, color: '#9ca3af', fontWeight: 800 }}>PRICE</span>
                      <span style={{ fontSize: 24, fontWeight: 900, color: '#48a07c' }}>{land.price} ETH</span>
                    </div>
                    <button onClick={() => handleBuy(land)} disabled={loading === land.landId} style={{
                      background: '#111', color: '#fff', border: 'none', padding: '12px 24px',
                      borderRadius: 14, fontWeight: 800, fontSize: 12, cursor: 'pointer', transition: '0.2s'
                    }}>
                      {loading === land.landId ? 'BUYING...' : 'BUY NOW'}
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {/* Tab Content: Sell */}
      {tab === 'sell' && (
        <div style={{
          background: '#fff', border: '1px solid #f0f0f0', padding: 50, borderRadius: 32,
          maxWidth: 550, margin: '0 auto', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)'
        }}>
          <h2 style={{ marginTop: 0, fontWeight: 900, fontSize: 28, letterSpacing: '-0.025em' }}>List Property</h2>
          <p style={{ color: '#6b7280', fontSize: 15, marginBottom: 40 }}>Transfer ownership by listing your registered land parcel.</p>

          <form onSubmit={handleList}>
            <div style={{ marginBottom: 24 }}>
              <label style={{ display: 'block', fontSize: 11, fontWeight: 900, color: '#9ca3af', marginBottom: 8, textTransform: 'uppercase' }}>Land ID</label>
              <input
                type="number"
                placeholder="e.g. 1001"
                value={listForm.landId}
                onChange={e => setListForm({ ...listForm, landId: e.target.value })}
                style={{ width: '100%', padding: '16px 20px', borderRadius: 16, border: '2px solid #f3f4f6', outline: 'none', fontSize: 16 }}
              />
            </div>
            <div style={{ marginBottom: 35 }}>
              <label style={{ display: 'block', fontSize: 11, fontWeight: 900, color: '#9ca3af', marginBottom: 8, textTransform: 'uppercase' }}>Asking Price (ETH)</label>
              <input
                type="number"
                step="0.01"
                placeholder="e.g. 1.5"
                value={listForm.price}
                onChange={e => setListForm({ ...listForm, price: e.target.value })}
                style={{ width: '100%', padding: '16px 20px', borderRadius: 16, border: '2px solid #f3f4f6', outline: 'none', fontSize: 16 }}
              />
            </div>

            <div style={{ background: '#fffbeb', border: '1px solid #fde68a', padding: '18px 24px', borderRadius: 18, fontSize: 13, color: '#92400e', marginBottom: 35, fontWeight: 600, lineHeight: 1.5 }}>
              💡 Ownership will be automatically transferred to the buyer once the payment is confirmed on-chain.
            </div>

            <button
              type="submit"
              disabled={loading === 'list'}
              style={{
                width: '100%', padding: 22, borderRadius: 18, border: 'none',
                background: '#48a07c', color: '#fff', fontWeight: 900, fontSize: 16,
                cursor: 'pointer', opacity: loading === 'list' ? 0.7 : 1, transition: '0.2s',
                letterSpacing: '0.05em'
              }}
            >
              {loading === 'list' ? 'PUBLISHING...' : 'PUBLISH LISTING'}
            </button>
          </form>
        </div>
      )}
    </div>
  );
}