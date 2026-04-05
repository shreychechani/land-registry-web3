// pages/Register.jsx
import { useState } from 'react';
import { getContract } from '../utils/contract';
import { uploadToIPFS } from '../utils/ipfs';
import { analyzeLandDocument } from '../utils/ibmApi';

const Field = ({ label, hint, children }) => (
  <div style={{ marginBottom: 20 }}>
    <label style={{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 6, color: 'var(--text)' }}>
      {label}
    </label>
    {hint && <p style={{ fontSize: 12, color: 'var(--text2)', marginBottom: 8 }}>{hint}</p>}
    {children}
  </div>
);

const input = {
  width: '100%', padding: '10px 14px',
  border: '1px solid var(--border)', borderRadius: 8,
  fontSize: 14, background: 'var(--white)',
  outline: 'none', transition: 'border 0.15s',
};

export default function Register() {
  const [form, setForm] = useState({
    landId: '', ownerAddress: '', gps: '', area: '', docHash: '',
  });
  const [file, setFile]         = useState(null);
  const [status, setStatus]     = useState('');
  const [loading, setLoading]   = useState(false);
  const [success, setSuccess]   = useState(false);
  const [analyzing, setAnalyzing] = useState(false);

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  // IBM Watson auto-fill
  const handleFileUpload = async (e) => {
    const f = e.target.files[0];
    if (!f) return;
    setFile(f);
    setAnalyzing(true);
    setStatus('🤖 IBM Watson is analyzing your document...');
    try {
      const text = await f.text();
      const result = await analyzeLandDocument(text);
      if (result.ownerName) set('ownerAddress', result.ownerName);
      if (result.location)  set('gps', result.location);
      setStatus('✅ Watson extracted data — please review and correct the fields below.');
    } catch {
      setStatus('Document uploaded. Fill in fields manually.');
    }
    setAnalyzing(false);
  };

  const handleSubmit = async () => {
    if (!form.landId || !form.ownerAddress || !form.gps || !form.area) {
      setStatus('❌ Please fill in all required fields.'); return;
    }
    setLoading(true);
    setStatus('📁 Uploading document to IPFS...');
    try {
      let docHash = form.docHash;
      if (file) {
        docHash = await uploadToIPFS(file);
        set('docHash', docHash);
      }
      setStatus('⛓️ Sending transaction to blockchain...');
      const contract = await getContract();
      const tx = await contract.registerLand(
        form.landId, form.ownerAddress, form.gps,
        parseInt(form.area), docHash || 'no-document'
      );
      setStatus('⏳ Waiting for confirmation...');
      await tx.wait();
      setSuccess(true);
      setStatus('');
    } catch (err) {
      setStatus('❌ Error: ' + (err.reason || err.message));
    }
    setLoading(false);
  };

  if (success) return (
    <div style={{ maxWidth: 560, margin: '80px auto', padding: '0 24px', textAlign: 'center' }}>
      <div style={{ fontSize: 64, marginBottom: 20 }}>🎉</div>
      <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 28, marginBottom: 12 }}>Land Registered!</h2>
      <p style={{ color: 'var(--text2)', marginBottom: 28 }}>
        Land #{form.landId} has been permanently recorded on the Polygon blockchain.
      </p>
      <div style={{
        background: 'var(--accent-bg)', border: '1px solid var(--accent)',
        borderRadius: 'var(--radius)', padding: '16px 20px', marginBottom: 28,
        textAlign: 'left', fontSize: 13,
      }}>
        <div style={{ fontWeight: 600, marginBottom: 8, color: 'var(--accent)' }}>REGISTRATION SUMMARY</div>
        <div>Land ID: <strong>#{form.landId}</strong></div>
        <div>Owner: <strong>{form.ownerAddress}</strong></div>
        <div>Area: <strong>{form.area} sq. meters</strong></div>
        <div>GPS: <strong>{form.gps}</strong></div>
        {form.docHash && <div style={{ marginTop: 8, wordBreak: 'break-all' }}>IPFS: <strong>{form.docHash}</strong></div>}
      </div>
      <button onClick={() => { setSuccess(false); setForm({ landId:'', ownerAddress:'', gps:'', area:'', docHash:'' }); setFile(null); }}
        style={{ background: 'var(--accent)', color: '#fff', border: 'none', padding: '12px 28px', borderRadius: 8, fontSize: 14, fontWeight: 600 }}>
        Register Another Land
      </button>
    </div>
  );

  return (
    <div style={{ maxWidth: 680, margin: '0 auto', padding: '48px 24px' }}>
      <div className="fade-up">
        <div style={{ marginBottom: 32 }}>
          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 32, marginBottom: 8 }}>
            📋 Register Land
          </h1>
          <p style={{ color: 'var(--text2)' }}>
            Government authority only. Registers a new land parcel permanently on blockchain.
          </p>
        </div>

        {/* IBM Watson upload */}
        <div style={{
          background: 'var(--blue-bg)', border: '1px solid #C5D8F0',
          borderRadius: 'var(--radius)', padding: '20px 24px', marginBottom: 28,
        }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--blue)', marginBottom: 8, letterSpacing: 1 }}>
            🤖 IBM WATSON AUTO-FILL
          </div>
          <p style={{ fontSize: 13, color: 'var(--text2)', marginBottom: 14 }}>
            Upload a title deed document and Watson NLU will automatically extract owner name, GPS, and land details.
          </p>
          <input type="file" accept=".txt,.pdf" onChange={handleFileUpload}
            style={{ fontSize: 13, color: 'var(--text2)' }} />
          {analyzing && <div style={{ marginTop: 10, display: 'flex', alignItems: 'center', gap: 10, fontSize: 13 }}>
            <span className="spinner" /> Analyzing with IBM Watson...
          </div>}
        </div>

        {/* Form fields */}
        <div style={{
          background: 'var(--white)', border: '1px solid var(--border)',
          borderRadius: 'var(--radius)', padding: '28px 28px', boxShadow: 'var(--shadow)',
        }}>
          <Field label="Land ID *" hint="Unique numeric ID for this parcel (e.g. 1001)">
            <input style={input} type="number" placeholder="e.g. 1001"
              value={form.landId} onChange={e => set('landId', e.target.value)} />
          </Field>
          <Field label="Owner Wallet Address *" hint="The Ethereum/Polygon wallet address of the land owner">
            <input style={input} type="text" placeholder="0x..."
              value={form.ownerAddress} onChange={e => set('ownerAddress', e.target.value)} />
          </Field>
          <Field label="GPS Coordinates *" hint="e.g. 28.6139° N, 77.2090° E">
            <input style={input} type="text" placeholder="28.6139° N, 77.2090° E"
              value={form.gps} onChange={e => set('gps', e.target.value)} />
          </Field>
          <Field label="Area (sq. meters) *">
            <input style={input} type="number" placeholder="e.g. 500"
              value={form.area} onChange={e => set('area', e.target.value)} />
          </Field>
          <Field label="Document Hash (IPFS)" hint="Auto-filled after document upload. Or paste manually.">
            <input style={input} type="text" placeholder="Qm..."
              value={form.docHash} onChange={e => set('docHash', e.target.value)} />
          </Field>

          {status && (
            <div style={{
              background: status.startsWith('❌') ? 'var(--red-bg)' : 'var(--accent-bg)',
              border: `1px solid ${status.startsWith('❌') ? '#F1948A' : 'var(--accent)'}`,
              borderRadius: 8, padding: '12px 16px', marginBottom: 20,
              fontSize: 13, color: status.startsWith('❌') ? 'var(--red)' : 'var(--accent)',
            }}>{status}</div>
          )}

          <button onClick={handleSubmit} disabled={loading} style={{
            width: '100%', background: 'var(--accent)', color: '#fff',
            border: 'none', padding: '14px', borderRadius: 10,
            fontSize: 15, fontWeight: 600, opacity: loading ? 0.7 : 1,
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
          }}>
            {loading ? <><span className="spinner" style={{ borderTopColor: '#fff', borderColor: '#ffffff55' }} /> Processing...</> : '⛓️ Register on Blockchain'}
          </button>
        </div>
      </div>
    </div>
  );
}