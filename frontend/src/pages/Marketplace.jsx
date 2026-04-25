// pages/Marketplace.jsx
import { useState, useEffect, useCallback } from 'react';
import { ethers } from 'ethers';
import { getContract, getReadContract, shortAddr } from '../utils/contract';
import { geocodeAddress, calculateDistance, parseCoordinates, getUserLocation } from '../utils/location';

export default function Marketplace() {
  const [tab, setTab] = useState('browse');
  const [allListings, setAllListings] = useState([]);
  const [displayListings, setDisplayListings] = useState([]);
  const [listForm, setListForm] = useState({ landId: '', price: '' });
  const [cancelId, setCancelId] = useState('');
  const [status, setStatus] = useState('');
  const [loading, setLoading] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [userLocation, setUserLocation] = useState(null);
  const [locating, setLocating] = useState(false);

  const loadListings = useCallback(async () => {
    try {
      const contract = getReadContract();
      const ids = await contract.getForSaleLands();
      const details = await Promise.all(
        ids.map(id => contract.getLandDetails(Number(id)).catch(() => null))
      );
      const listings = details.filter(Boolean).map(land => ({
        landId:   Number(land.landId),
        owner:    land.owner,
        gps:      land.gpsCoordinates,
        area:     Number(land.areaSqMeters),
        price:    ethers.formatEther(land.salePrice),
        priceWei: land.salePrice,
        title:    land.title || `Land #${Number(land.landId)}`,
        docHash:  land.documentHash,
        isForSale: land.isForSale,
      }));
      setAllListings(listings);
      setDisplayListings(listings);
    } catch (err) {
      setStatus('⚠️ Could not load listings: ' + (err.reason || err.message));
    }
  }, []);

  useEffect(() => { loadListings(); }, [loadListings]);

  const handleLocateMe = async () => {
    setLocating(true);
    setStatus('📡 Getting your location...');
    try {
      const loc = await getUserLocation();
      setUserLocation(loc);
      filterByDistance(loc, allListings);
      setStatus('📍 Showing lands near your location (within 50km)');
    } catch (err) {
      setStatus('❌ ' + err.message + '. Try searching by city name instead.');
    }
    setLocating(false);
  };

  const filterByDistance = (center, listings, radiusKm = 50) => {
    const filtered = listings
      .filter(land => {
        const coords = parseCoordinates(land.gps);
        if (!coords) return false;
        const dist = calculateDistance(center.lat, center.lon, coords.lat, coords.lon);
        land._distance = Math.round(dist);
        return dist <= radiusKm;
      })
      .sort((a, b) => (a._distance || 0) - (b._distance || 0));
    setDisplayListings(filtered);
    if (filtered.length === 0) setStatus('No listings found within 50km of your location.');
  };

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!searchQuery.trim()) { setDisplayListings(allListings); setStatus(''); return; }
    setIsSearching(true);
    setStatus(`🔍 Searching for "${searchQuery}"...`);
    try {
      const loc = await geocodeAddress(searchQuery);
      if (!loc) {
        setStatus('❌ Location not found. Try "Jaipur", "Delhi", or "Mumbai".');
        setIsSearching(false);
        return;
      }
      const place = loc.displayName.split(',')[0];
      filterByDistance(loc, allListings, 50);
      setStatus(`📍 Showing lands within 50km of ${place} (OpenStreetMap)`);
    } catch {
      setStatus('❌ Search failed. Check your connection and try again.');
    }
    setIsSearching(false);
  };

  const resetSearch = () => {
    setSearchQuery('');
    setDisplayListings(allListings);
    setStatus('');
    setUserLocation(null);
  };

  const handleBuy = async (land) => {
    setLoading(land.landId);
    setStatus('');
    try {
      const contract = await getContract();
      const tx = await contract.buyLand(land.landId, { value: land.priceWei });
      setStatus('⏳ Confirming transaction on blockchain...');
      await tx.wait();
      setStatus(`✅ You are now the legal owner of ${land.title}! Check History to see the ownership transfer.`);
      await loadListings();
    } catch (err) {
      setStatus('❌ ' + (err.reason || err.message || 'Transaction failed.'));
    }
    setLoading(null);
  };

  const handleList = async (e) => {
    e.preventDefault();
    if (!listForm.landId || !listForm.price) {
      setStatus('❌ Please provide both Land ID and price.'); return;
    }
    setLoading('list');
    setStatus('⏳ Listing on blockchain...');
    try {
      const contract = await getContract();
      const priceWei = ethers.parseEther(listForm.price);
      const tx = await contract.listForSale(parseInt(listForm.landId), priceWei);
      await tx.wait();
      setStatus(`✅ Land #${listForm.landId} is now listed for ${listForm.price} MATIC!`);
      setListForm({ landId: '', price: '' });
      await loadListings();
    } catch (err) {
      setStatus('❌ ' + (err.reason || err.message || 'Only the land owner can list this.'));
    }
    setLoading(null);
  };

  const handleCancelSale = async (e) => {
    e.preventDefault();
    if (!cancelId) { setStatus('❌ Enter a Land ID to cancel.'); return; }
    setLoading('cancel');
    setStatus('⏳ Cancelling sale...');
    try {
      const contract = await getContract();
      const tx = await contract.cancelSale(parseInt(cancelId));
      await tx.wait();
      setStatus(`✅ Sale for Land #${cancelId} has been cancelled.`);
      setCancelId('');
      await loadListings();
    } catch (err) {
      setStatus('❌ ' + (err.reason || err.message || 'Only the owner can cancel this listing.'));
    }
    setLoading(null);
  };

  const TabBtn = ({ id, label }) => (
    <button onClick={() => { setTab(id); setStatus(''); }} style={{
      padding: '10px 24px', borderRadius: 10, border: 'none', fontSize: 14, fontWeight: 700,
      background: tab === id ? 'var(--accent)' : 'transparent',
      color: tab === id ? '#fff' : 'var(--text2)',
      transition: '0.2s', cursor: 'pointer',
    }}>{label}</button>
  );

  return (
    <div style={{ maxWidth: 1050, margin: '0 auto', padding: '48px 24px' }}>
      <div style={{ textAlign: 'center', marginBottom: 36 }}>
        <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 36, marginBottom: 8 }}>🤝 Marketplace</h1>
        <p style={{ color: 'var(--text2)', fontSize: 15 }}>
          Buy and sell land parcels directly on Polygon — no middlemen.
        </p>
      </div>

      {/* Tab switcher */}
      <div style={{ display: 'flex', gap: 6, background: '#f0f0f0', padding: 5, borderRadius: 12, width: 'fit-content', margin: '0 auto 36px', flexWrap: 'wrap' }}>
        <TabBtn id="browse" label="🔍 Browse Lands" />
        <TabBtn id="sell" label="🏷️ List My Land" />
        <TabBtn id="cancel" label="❌ Cancel Listing" />
      </div>

      {/* Status banner */}
      {status && (
        <div style={{
          padding: '14px 20px', borderRadius: 10, marginBottom: 24, fontSize: 14, fontWeight: 600,
          background: status.startsWith('❌') ? '#fff0f0' : status.startsWith('✅') ? '#f0faf5' : '#eff6ff',
          color: status.startsWith('❌') ? '#c0392b' : status.startsWith('✅') ? '#166534' : '#1e40af',
          border: '1px solid currentColor', display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        }}>
          <span>{status}</span>
          {(searchQuery || userLocation) && tab === 'browse' && (
            <button onClick={resetSearch} style={{
              background: 'none', border: 'none', color: 'inherit',
              textDecoration: 'underline', cursor: 'pointer', fontSize: 12, marginLeft: 12,
            }}>Reset</button>
          )}
        </div>
      )}

      {/* ── BROWSE TAB ── */}
      {tab === 'browse' && (
        <>
          {/* Location search */}
          <div style={{ marginBottom: 32 }}>
            <form onSubmit={handleSearch} style={{ display: 'flex', gap: 10, marginBottom: 12 }}>
              <input
                placeholder="Search by city or area — e.g. Jaipur, Mansarovar, Delhi..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                style={{
                  flex: 1, padding: '14px 18px', borderRadius: 10,
                  border: '2px solid var(--border)', outline: 'none', fontSize: 15,
                  background: 'var(--white)',
                }}
              />
              <button type="submit" disabled={isSearching} style={{
                background: 'var(--accent)', color: '#fff', border: 'none',
                padding: '0 28px', borderRadius: 10, fontWeight: 700, fontSize: 14, cursor: 'pointer',
              }}>
                {isSearching ? '...' : '🗺️ Search'}
              </button>
            </form>
            <button onClick={handleLocateMe} disabled={locating} style={{
              background: 'var(--white)', border: '1px solid var(--border)', color: 'var(--text)',
              padding: '9px 18px', borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: 'pointer',
              display: 'flex', alignItems: 'center', gap: 6,
            }}>
              {locating ? '⏳ Locating...' : '📍 Use My Current Location'}
            </button>
            <p style={{ fontSize: 12, color: 'var(--text2)', marginTop: 6 }}>
              Powered by OpenStreetMap — no API key needed. Shows lands within 50km radius.
            </p>
          </div>

          <div style={{ fontSize: 13, color: 'var(--text2)', marginBottom: 20 }}>
            {displayListings.length === 0
              ? allListings.length === 0
                ? 'No lands listed for sale yet.'
                : 'No lands found in this area.'
              : `Showing ${displayListings.length} land${displayListings.length !== 1 ? 's' : ''} for sale`}
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 24 }}>
            {displayListings.map(land => (
              <div key={land.landId} style={{
                background: 'var(--white)', borderRadius: 16, border: '1px solid var(--border)',
                overflow: 'hidden', boxShadow: 'var(--shadow)', transition: 'transform 0.2s, box-shadow 0.2s',
              }}
                onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-4px)'; e.currentTarget.style.boxShadow = 'var(--shadow-lg)'; }}
                onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = 'var(--shadow)'; }}
              >
                <div style={{ background: 'linear-gradient(135deg, #f0fdf4, #e0f2fe)', padding: 36, textAlign: 'center', fontSize: 48 }}>🏡</div>
                <div style={{ padding: '20px 22px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                    <h3 style={{ margin: 0, fontWeight: 800, fontSize: 18 }}>{land.title}</h3>
                    <span style={{ fontSize: 10, fontWeight: 700, background: '#dcfce7', color: '#166534', padding: '3px 8px', borderRadius: 20 }}>
                      VERIFIED ✓
                    </span>
                  </div>
                  <p style={{ fontSize: 13, color: 'var(--text2)', marginBottom: 4 }}>📍 {land.gps}</p>
                  {land._distance !== undefined && (
                    <p style={{ fontSize: 12, color: 'var(--accent)', marginBottom: 8, fontWeight: 600 }}>
                      🗺️ {land._distance} km from searched location
                    </p>
                  )}
                  <p style={{ fontSize: 12, color: 'var(--text2)', marginBottom: 4 }}>📐 {land.area.toLocaleString()} m²</p>
                  <p style={{ fontSize: 12, color: 'var(--text2)', marginBottom: 16 }}>👤 {shortAddr(land.owner)}</p>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: 16, borderTop: '1px solid var(--border)' }}>
                    <div>
                      <div style={{ fontSize: 10, color: 'var(--text2)', fontWeight: 700 }}>PRICE</div>
                      <div style={{ fontSize: 22, fontWeight: 900, color: 'var(--accent)' }}>{land.price} MATIC</div>
                    </div>
                    <button onClick={() => handleBuy(land)} disabled={loading === land.landId} style={{
                      background: '#111', color: '#fff', border: 'none',
                      padding: '11px 22px', borderRadius: 10, fontWeight: 700, fontSize: 13, cursor: 'pointer',
                    }}>
                      {loading === land.landId ? '⏳ Buying...' : 'BUY NOW'}
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {allListings.length === 0 && (
            <div style={{ textAlign: 'center', padding: '60px 20px', color: 'var(--text2)' }}>
              <div style={{ fontSize: 48, marginBottom: 16 }}>🏷️</div>
              <div>No lands listed for sale. Be the first — switch to "List My Land".</div>
            </div>
          )}
        </>
      )}

      {/* ── SELL TAB ── */}
      {tab === 'sell' && (
        <div style={{
          background: 'var(--white)', border: '1px solid var(--border)',
          borderRadius: 16, padding: '40px 44px', maxWidth: 520, margin: '0 auto',
          boxShadow: 'var(--shadow)',
        }}>
          <h2 style={{ marginTop: 0, fontWeight: 800, fontSize: 26, marginBottom: 8 }}>List Property for Sale</h2>
          <p style={{ color: 'var(--text2)', fontSize: 14, marginBottom: 32 }}>
            Enter your Land ID and asking price. Ownership transfers automatically on purchase.
          </p>
          <form onSubmit={handleList}>
            <div style={{ marginBottom: 20 }}>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: 'var(--text2)', marginBottom: 8, textTransform: 'uppercase' }}>Land ID *</label>
              <input type="number" placeholder="e.g. 1" value={listForm.landId}
                onChange={e => setListForm({ ...listForm, landId: e.target.value })}
                style={{ width: '100%', padding: '13px 16px', borderRadius: 10, border: '1.5px solid var(--border)', fontSize: 15, outline: 'none', boxSizing: 'border-box' }} />
            </div>
            <div style={{ marginBottom: 28 }}>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: 'var(--text2)', marginBottom: 8, textTransform: 'uppercase' }}>Asking Price (MATIC) *</label>
              <input type="number" step="0.001" placeholder="e.g. 1.5" value={listForm.price}
                onChange={e => setListForm({ ...listForm, price: e.target.value })}
                style={{ width: '100%', padding: '13px 16px', borderRadius: 10, border: '1.5px solid var(--border)', fontSize: 15, outline: 'none', boxSizing: 'border-box' }} />
            </div>
            <div style={{ background: '#fffbeb', border: '1px solid #fde68a', padding: '14px 18px', borderRadius: 10, fontSize: 13, color: '#92400e', marginBottom: 28, lineHeight: 1.5 }}>
              💡 You must be the registered owner. The smart contract verifies ownership automatically.
            </div>
            <button type="submit" disabled={loading === 'list'} style={{
              width: '100%', padding: '15px', borderRadius: 12, border: 'none',
              background: 'var(--accent)', color: '#fff', fontWeight: 800, fontSize: 15,
              cursor: loading === 'list' ? 'not-allowed' : 'pointer', opacity: loading === 'list' ? 0.7 : 1,
            }}>
              {loading === 'list' ? '⏳ Publishing...' : '🏷️ Publish Listing'}
            </button>
          </form>
        </div>
      )}

      {/* ── CANCEL TAB ── */}
      {tab === 'cancel' && (
        <div style={{
          background: 'var(--white)', border: '1px solid var(--border)',
          borderRadius: 16, padding: '40px 44px', maxWidth: 520, margin: '0 auto',
          boxShadow: 'var(--shadow)',
        }}>
          <h2 style={{ marginTop: 0, fontWeight: 800, fontSize: 26, marginBottom: 8 }}>Cancel Sale Listing</h2>
          <p style={{ color: 'var(--text2)', fontSize: 14, marginBottom: 32 }}>
            Enter the Land ID of your listing you wish to cancel.
          </p>
          <form onSubmit={handleCancelSale}>
            <div style={{ marginBottom: 28 }}>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: 'var(--text2)', marginBottom: 8, textTransform: 'uppercase' }}>Land ID *</label>
              <input type="number" placeholder="e.g. 1" value={cancelId}
                onChange={e => setCancelId(e.target.value)}
                style={{ width: '100%', padding: '13px 16px', borderRadius: 10, border: '1.5px solid var(--border)', fontSize: 15, outline: 'none', boxSizing: 'border-box' }} />
            </div>
            <button type="submit" disabled={loading === 'cancel'} style={{
              width: '100%', padding: '15px', borderRadius: 12, border: 'none',
              background: '#dc2626', color: '#fff', fontWeight: 800, fontSize: 15,
              cursor: loading === 'cancel' ? 'not-allowed' : 'pointer', opacity: loading === 'cancel' ? 0.7 : 1,
            }}>
              {loading === 'cancel' ? '⏳ Cancelling...' : '❌ Cancel Listing'}
            </button>
          </form>
        </div>
      )}
    </div>
  );
}