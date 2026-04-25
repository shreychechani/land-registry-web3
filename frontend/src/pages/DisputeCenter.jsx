// pages/DisputeCenter.jsx
import React, { useState } from 'react';
import { getContract, getReadContract, shortAddr } from '../utils/contract';

export default function DisputeCenter() {
  const [searchId,        setSearchId]        = useState('');
  const [landDetails,     setLandDetails]     = useState(null);
  const [loading,         setLoading]         = useState(false);
  const [status,          setStatus]          = useState('');
  const [resolutionNotes, setResolutionNotes] = useState('');
  const [newOwner,        setNewOwner]        = useState('');

  // ── Fetch land using read-only contract (no MetaMask pop-up just to look up)
  const fetchLand = async () => {
    if (!searchId) return;
    setLoading(true);
    setStatus('');
    setLandDetails(null);
    try {
      const contract = getReadContract();
      const land = await contract.getLandDetails(parseInt(searchId));

      if (!land.isRegistered) {
        setStatus('❌ Land ID not found or not registered.');
      } else {
        setLandDetails({
          id:         parseInt(searchId),
          title:      land.title || `Land #${searchId}`,
          owner:      land.owner,
          gps:        land.gpsCoordinates,
          area:       Number(land.areaSqMeters),
          isDisputed: land.isDisputed,
          hasLien:    land.hasLien,
          isForSale:  land.isForSale,
        });
        setNewOwner(land.owner);
      }
    } catch (err) {
      setStatus('❌ Land ID ' + searchId + ' not found. Is Hardhat running?');
    }
    setLoading(false);
  };

  // ── File a dispute (any wallet)
  const handleFileDispute = async () => {
    setLoading(true);
    setStatus('');
    try {
      const contract = await getContract();
      const tx = await contract.fileDispute(parseInt(searchId), 'QmDisputeEvidence');
      setStatus('⏳ Filing dispute on blockchain…');
      await tx.wait();
      setStatus(`✅ Dispute filed! Land #${searchId} is now FROZEN — no sales or transfers allowed.`);
      fetchLand(); // refresh
    } catch (err) {
      setStatus('❌ ' + (err.reason || err.message || 'Failed to file dispute.'));
    }
    setLoading(false);
  };

  // ── Resolve dispute (government wallet only)
  const handleResolveDispute = async () => {
    if (!newOwner || !resolutionNotes) {
      setStatus('❌ Provide the rightful owner address and resolution notes.');
      return;
    }
    setLoading(true);
    setStatus('');
    try {
      const contract = await getContract();
      const tx = await contract.resolveDispute(parseInt(searchId), newOwner, resolutionNotes);
      setStatus('⏳ Updating blockchain — transferring ownership if needed…');
      await tx.wait();
      setStatus(`✅ Dispute RESOLVED! Land #${searchId} is unfrozen and ownership updated.`);
      setResolutionNotes('');
      fetchLand();
    } catch (err) {
      setStatus('❌ ' + (err.reason || 'Only Government Authority can resolve disputes.'));
    }
    setLoading(false);
  };

  const statusBg    = status.startsWith('✅') ? '#ecfdf5' : status.startsWith('⏳') ? '#eff6ff' : '#fef2f2';
  const statusColor = status.startsWith('✅') ? '#065f46' : status.startsWith('⏳') ? '#1e40af' : '#991b1b';

  return (
    <div style={{ maxWidth: 800, margin: '0 auto', padding: '40px 20px', fontFamily: 'sans-serif' }}>

      {/* Header */}
      <div style={{ textAlign: 'center', marginBottom: 40 }}>
        <h1 style={{ fontSize: 32, fontWeight: 900, marginBottom: 8 }}>⚖️ Dispute Resolution Center</h1>
        <p style={{ color: '#666', fontSize: 15 }}>
          File legal conflicts or resolve them as Government Authority. All decisions are written on-chain permanently.
        </p>
      </div>

      {/* Search bar */}
      <div style={{ display: 'flex', gap: 10, marginBottom: 24 }}>
        <input
          placeholder="Enter Land ID to investigate (e.g. 1)"
          value={searchId}
          onChange={e => setSearchId(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && fetchLand()}
          type="number"
          min="1"
          style={{ flex: 1, padding: '14px 18px', borderRadius: 12, border: '2px solid #eee', fontSize: 15, outline: 'none' }}
        />
        <button
          onClick={fetchLand}
          disabled={loading}
          style={{ background: '#111', color: '#fff', border: 'none', padding: '0 28px', borderRadius: 12, fontWeight: 700, cursor: 'pointer', fontSize: 14 }}
        >
          {loading ? '…' : 'INVESTIGATE'}
        </button>
      </div>

      {/* Status message */}
      {status && (
        <div style={{ padding: '14px 18px', borderRadius: 12, marginBottom: 20, background: statusBg, color: statusColor, fontWeight: 700, fontSize: 14 }}>
          {status}
        </div>
      )}

      {/* Land details card */}
      {landDetails && (
        <div style={{ background: '#fff', border: '1px solid #eee', borderRadius: 24, padding: 30, boxShadow: '0 10px 25px rgba(0,0,0,0.05)' }}>

          {/* Card header */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 }}>
            <div>
              <h2 style={{ margin: 0, fontSize: 22 }}>
                {landDetails.title}
              </h2>
              <p style={{ color: '#888', margin: '6px 0 0', fontSize: 13 }}>
                Owner: <code style={{ fontSize: 12, background: '#f3f4f6', padding: '2px 6px', borderRadius: 4 }}>{landDetails.owner}</code>
              </p>
              <p style={{ color: '#888', margin: '4px 0 0', fontSize: 13 }}>📍 {landDetails.gps} · {landDetails.area.toLocaleString()} m²</p>
            </div>
            <div style={{
              padding: '8px 16px', borderRadius: 50, fontSize: 12, fontWeight: 900, whiteSpace: 'nowrap',
              background: landDetails.isDisputed ? '#fee2e2' : '#f0fdf4',
              color:      landDetails.isDisputed ? '#ef4444' : '#22c55e',
            }}>
              {landDetails.isDisputed ? '⚠️ DISPUTED' : '✅ CLEAR TITLE'}
            </div>
          </div>

          {/* Status flags */}
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 20 }}>
            {landDetails.hasLien   && <span style={{ background: '#fef9c3', color: '#713f12', padding: '4px 12px', borderRadius: 20, fontSize: 12, fontWeight: 700 }}>🏦 LIEN ACTIVE</span>}
            {landDetails.isForSale && <span style={{ background: '#dbeafe', color: '#1e40af', padding: '4px 12px', borderRadius: 20, fontSize: 12, fontWeight: 700 }}>🏷️ FOR SALE</span>}
          </div>

          {/* Legal status box */}
          <div style={{ background: '#f9fafb', padding: '16px 20px', borderRadius: 14, marginBottom: 24, fontSize: 14, color: '#555', lineHeight: 1.6 }}>
            <strong>Legal Status: </strong>
            {landDetails.isDisputed
              ? 'This property is currently FROZEN due to a legal dispute. No sales or ownership transfers are permitted until Government resolves it.'
              : 'This property has a clean title and is eligible for trade and transfer.'}
          </div>

          {/* Action section */}
          {!landDetails.isDisputed ? (
            // ── Anyone can FILE a dispute
            <div>
              <p style={{ fontSize: 13, color: '#888', marginBottom: 16 }}>
                If you have evidence of fraud or boundary encroachment, file a dispute to freeze this land immediately.
              </p>
              <button
                onClick={handleFileDispute}
                disabled={loading}
                style={{
                  width: '100%', padding: 18, background: '#ef4444', color: '#fff',
                  border: 'none', borderRadius: 12, fontWeight: 800, cursor: 'pointer',
                  fontSize: 15, opacity: loading ? 0.7 : 1,
                }}
              >
                {loading ? 'FILING…' : '🚨 FILE A DISPUTE — FREEZE THIS LAND'}
              </button>
            </div>
          ) : (
            // ── Government RESOLVES a dispute
            <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', padding: 24, borderRadius: 16 }}>
              <h3 style={{ marginTop: 0, fontSize: 16, marginBottom: 16 }}>🏛️ Government Resolution Form</h3>
              <p style={{ fontSize: 13, color: '#888', marginBottom: 20 }}>
                Only the Government wallet can resolve disputes. Enter the rightful owner and resolution notes.
              </p>

              <label style={{ display: 'block', marginBottom: 6, fontSize: 13, fontWeight: 700 }}>Rightful Owner Address:</label>
              <input
                type="text"
                value={newOwner}
                onChange={e => setNewOwner(e.target.value)}
                placeholder="0x..."
                style={{ width: '100%', padding: '12px 14px', borderRadius: 10, border: '1px solid #d1d5db', marginBottom: 16, fontSize: 14, boxSizing: 'border-box' }}
              />

              <label style={{ display: 'block', marginBottom: 6, fontSize: 13, fontWeight: 700 }}>Resolution Notes (written permanently on-chain):</label>
              <textarea
                value={resolutionNotes}
                onChange={e => setResolutionNotes(e.target.value)}
                placeholder="e.g. Fraudulent transfer reversed. Original owner confirmed by land records."
                style={{ width: '100%', padding: '12px 14px', borderRadius: 10, border: '1px solid #d1d5db', marginBottom: 20, fontSize: 14, minHeight: 90, resize: 'vertical', boxSizing: 'border-box' }}
              />

              <button
                onClick={handleResolveDispute}
                disabled={loading}
                style={{
                  width: '100%', padding: 18, background: '#22c55e', color: '#fff',
                  border: 'none', borderRadius: 12, fontWeight: 800, cursor: 'pointer',
                  fontSize: 15, opacity: loading ? 0.7 : 1,
                }}
              >
                {loading ? 'RESOLVING…' : '✅ RESOLVE & UNFREEZE LAND'}
              </button>
            </div>
          )}
        </div>
      )}

      {/* Info banner */}
      {!landDetails && !status && (
        <div style={{ textAlign: 'center', padding: '60px 20px', color: '#aaa' }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>⚖️</div>
          <p style={{ fontSize: 14 }}>Enter a Land ID above to look up its dispute status.</p>
          <p style={{ fontSize: 13 }}>Any wallet can file a dispute. Only the Government wallet can resolve.</p>
        </div>
      )}
    </div>
  );
}