// pages/Register.jsx
import { useState } from 'react';
import { getContract, getReadContract } from '../utils/contract';
import { uploadToIPFS } from '../utils/ipfs';

// ─── Auto-extract GPS & area from plain text (title deed) ───────────────────
const extractFromText = (text) => {
  const extracted = {};

  const gpsMatch = text.match(
    /(-?\d{1,3}\.\d{2,})\s*[,°NS]\s*(-?\d{1,3}\.\d{2,})/i
  );
  if (gpsMatch) extracted.gps = `${gpsMatch[1]}, ${gpsMatch[2]}`;

  const areaMatch = text.match(/(\d[\d,.]*)\s*(sq\.?\s*m(?:eters?)?|hectares?|bigha)/i);
  if (areaMatch) {
    let area = parseFloat(areaMatch[1].replace(',', ''));
    if (/hectare/i.test(areaMatch[2])) area = Math.round(area * 10000);
    if (/bigha/i.test(areaMatch[2]))   area = Math.round(area * 2529);
    extracted.area = String(Math.round(area));
  }

  const titleMatch = text.match(/(plot\s[\w\s-]+|survey\s+no\.?\s+\w+|khasra\s+no\.?\s+\w+)/i);
  if (titleMatch) extracted.title = titleMatch[0].trim();

  return extracted;
};

const Field = ({ label, hint, children }) => (
  <div style={{ marginBottom: 20 }}>
    <label style={{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 6, color: 'var(--text)' }}>
      {label}
    </label>
    {hint && <p style={{ fontSize: 12, color: 'var(--text2)', marginBottom: 8, margin: '0 0 8px' }}>{hint}</p>}
    {children}
  </div>
);

const inputStyle = {
  width: '100%', padding: '10px 14px', boxSizing: 'border-box',
  border: '1px solid var(--border)', borderRadius: 8,
  fontSize: 14, background: 'var(--white)', outline: 'none',
};

export default function Register() {
  const [form, setForm] = useState({ landId: '', ownerAddress: '', gps: '', area: '', title: '', docHash: '' });
  const [file, setFile] = useState(null);
  const [status, setStatus] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(null);
  const [autoFilled, setAutoFilled] = useState([]);

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  // Auto-suggest next Land ID from chain
  const fetchNextId = async () => {
    try {
      const contract = getReadContract();
      const total = await contract.getTotalLands();
      set('landId', String(Number(total) + 1));
    } catch {
      // silently ignore — user can type manually
    }
  };

  const handleFileChange = async (e) => {
    const f = e.target.files[0];
    if (!f) return;
    setFile(f);
    setAutoFilled([]);
    setStatus(`📄 File selected: ${f.name} — attempting to auto-extract details...`);

    if (f.type === 'text/plain' || f.name.endsWith('.txt')) {
      const reader = new FileReader();
      reader.onload = (ev) => {
        const text = ev.target.result;
        const extracted = extractFromText(text);
        const filled = [];
        if (extracted.gps   && !form.gps)   { set('gps',   extracted.gps);   filled.push('GPS'); }
        if (extracted.area  && !form.area)   { set('area',  extracted.area);  filled.push('Area'); }
        if (extracted.title && !form.title)  { set('title', extracted.title); filled.push('Title'); }
        if (filled.length > 0) {
          setAutoFilled(filled);
          setStatus(`✨ Auto-filled: ${filled.join(', ')} from document. Please verify before submitting.`);
        } else {
          setStatus('📄 File loaded. No auto-fill patterns found — please fill in manually.');
        }
      };
      reader.readAsText(f);
    } else {
      setStatus(`📄 ${f.name} will be uploaded to IPFS. Fill in the form manually.`);
    }
  };

  const handleSubmit = async () => {
    if (!form.landId || !form.ownerAddress || !form.gps || !form.area || !form.title) {
      setStatus('❌ Please fill in all required fields (including Land ID).'); return;
    }
    if (isNaN(parseInt(form.landId)) || parseInt(form.landId) < 1) {
      setStatus('❌ Land ID must be a positive integer.'); return;
    }
    if (!form.ownerAddress.startsWith('0x') || form.ownerAddress.length !== 42) {
      setStatus('❌ Owner address must be a valid 0x wallet address.'); return;
    }
    setLoading(true);
    try {
      let docHash = form.docHash || 'no-document';
      if (file) {
        setStatus('📁 Uploading document to IPFS via Pinata...');
        docHash = await uploadToIPFS(file);
        set('docHash', docHash);
        setStatus('✅ Document uploaded! Sending to blockchain...');
      } else {
        setStatus('⛓️ Sending transaction to blockchain...');
      }

      const contract = await getContract();

      // Use registerLandFull (6 params including title)
      const tx = await contract.registerLandFull(
        parseInt(form.landId),
        form.ownerAddress,
        form.gps,
        parseInt(form.area),
        docHash,
        form.title
      );

      setStatus('⏳ Waiting for block confirmation...');
      await tx.wait();

      setSuccess({ ...form, docHash, landId: parseInt(form.landId) });
      setStatus('');
    } catch (err) {
      setStatus('❌ ' + (err.reason || err.message));
    }
    setLoading(false);
  };

  const reset = () => {
    setSuccess(null);
    setForm({ landId: '', ownerAddress: '', gps: '', area: '', title: '', docHash: '' });
    setFile(null);
    setStatus('');
    setAutoFilled([]);
  };

  if (success) return (
    <div style={{ maxWidth: 560, margin: '80px auto', padding: '0 24px', textAlign: 'center' }}>
      <div style={{ fontSize: 64, marginBottom: 16 }}>🎉</div>
      <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 28, marginBottom: 12 }}>Land Registered!</h2>
      <p style={{ color: 'var(--text2)', marginBottom: 24 }}>Permanently recorded on the blockchain.</p>
      <div style={{
        background: 'var(--accent-bg)', border: '1px solid var(--accent)',
        borderRadius: 12, padding: '20px 24px', marginBottom: 28, textAlign: 'left', fontSize: 13,
      }}>
        <div style={{ fontWeight: 700, marginBottom: 10, color: 'var(--accent)', fontSize: 12, letterSpacing: 1 }}>REGISTRATION SUMMARY</div>
        <div style={{ marginBottom: 6 }}>Land ID: <strong>#{success.landId}</strong></div>
        <div style={{ marginBottom: 6 }}>Title: <strong>{success.title}</strong></div>
        <div style={{ marginBottom: 6 }}>Owner: <strong style={{ wordBreak: 'break-all', fontSize: 12 }}>{success.ownerAddress}</strong></div>
        <div style={{ marginBottom: 6 }}>Area: <strong>{success.area} sq. meters</strong></div>
        <div style={{ marginBottom: 6 }}>GPS: <strong>{success.gps}</strong></div>
        {success.docHash !== 'no-document' && (
          <div style={{ marginTop: 8, wordBreak: 'break-all', fontSize: 12 }}>IPFS: <strong>{success.docHash}</strong></div>
        )}
      </div>
      <div style={{ background: '#f0faf5', border: '1px solid #059669', borderRadius: 10, padding: '12px 18px', fontSize: 13, color: '#166534', marginBottom: 20 }}>
        📜 Go to <strong>Ownership History</strong> (Land ID #{success.landId}) to see this registration on-chain.
      </div>
      <button onClick={reset} style={{
        background: 'var(--accent)', color: '#fff', border: 'none',
        padding: '12px 28px', borderRadius: 8, fontSize: 14, fontWeight: 600, cursor: 'pointer',
      }}>
        Register Another Land
      </button>
    </div>
  );

  return (
    <div style={{ maxWidth: 680, margin: '0 auto', padding: '48px 24px' }}>
      <div style={{ marginBottom: 32 }}>
        <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 32, marginBottom: 8 }}>📋 Register Land</h1>
        <p style={{ color: 'var(--text2)' }}>Government authority only. Registers a new land parcel permanently on blockchain.</p>
      </div>

      {/* Upload title deed */}
      <div style={{
        background: '#f0f7ff', border: '1px solid #c5d8f0',
        borderRadius: 10, padding: '20px 24px', marginBottom: 28,
      }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: '#1a4a7a', marginBottom: 6, letterSpacing: 1 }}>
          📁 UPLOAD TITLE DEED (OPTIONAL)
        </div>
        <p style={{ fontSize: 13, color: 'var(--text2)', marginBottom: 14, margin: '0 0 14px' }}>
          Upload a .txt, PDF or image of the title deed. Stored on IPFS. Text files (.txt) will be
          parsed automatically to pre-fill GPS, area, and title.
        </p>
        <input type="file" accept=".txt,.pdf,.png,.jpg,.jpeg" onChange={handleFileChange}
          style={{ fontSize: 13 }} />

        {autoFilled.length > 0 && (
          <div style={{ marginTop: 12, background: '#f0fdf4', border: '1px solid #22c55e', borderRadius: 8, padding: '10px 14px', fontSize: 13, color: '#166534' }}>
            ✨ <strong>Auto-filled:</strong> {autoFilled.join(', ')} — extracted from your document. Please verify the values below.
          </div>
        )}
      </div>

      {/* Form */}
      <div style={{
        background: 'var(--white)', border: '1px solid var(--border)',
        borderRadius: 12, padding: '28px', boxShadow: 'var(--shadow)',
      }}>
        <Field label="Land ID *" hint="Unique numeric ID for this parcel. Must not already exist on-chain.">
          <div style={{ display: 'flex', gap: 8 }}>
            <input style={{ ...inputStyle, flex: 1 }} type="number" min="1" placeholder="e.g. 1"
              value={form.landId} onChange={e => set('landId', e.target.value)} />
            <button type="button" onClick={fetchNextId} style={{
              padding: '10px 14px', borderRadius: 8, border: '1px solid var(--border)',
              background: '#f8fafc', fontSize: 12, cursor: 'pointer', whiteSpace: 'nowrap',
            }}>
              Auto-suggest →
            </button>
          </div>
        </Field>

        <Field label="Land Title *" hint="Short name for this parcel (e.g. 'Plot A - Delhi North')">
          <input style={inputStyle} type="text" placeholder="e.g. Plot A - Delhi North"
            value={form.title} onChange={e => set('title', e.target.value)} />
        </Field>

        <Field label="Owner Wallet Address *" hint="Ethereum/Polygon address of the land owner (must start with 0x)">
          <input style={inputStyle} type="text" placeholder="0x..."
            value={form.ownerAddress} onChange={e => set('ownerAddress', e.target.value)} />
        </Field>

        <Field label="GPS Coordinates *" hint="e.g. 26.9124, 75.7873 — used for location search in Marketplace">
          <input style={inputStyle} type="text" placeholder="26.9124, 75.7873"
            value={form.gps} onChange={e => set('gps', e.target.value)} />
        </Field>

        <Field label="Area (sq. meters) *">
          <input style={inputStyle} type="number" placeholder="e.g. 500"
            value={form.area} onChange={e => set('area', e.target.value)} />
        </Field>

        <Field label="Document Hash (IPFS)" hint="Auto-filled after file upload above, or paste an existing IPFS hash manually.">
          <input style={inputStyle} type="text" placeholder="Qm... (auto-filled on upload)"
            value={form.docHash} onChange={e => set('docHash', e.target.value)} />
        </Field>

        {status && (
          <div style={{
            background: status.startsWith('❌') ? '#fff0f0' : status.startsWith('✨') ? '#f0fdf4' : '#f0faf5',
            border: `1px solid ${status.startsWith('❌') ? '#ffaaaa' : status.startsWith('✨') ? '#22c55e' : 'var(--accent)'}`,
            borderRadius: 8, padding: '12px 16px', marginBottom: 20, fontSize: 13,
            color: status.startsWith('❌') ? '#c0392b' : status.startsWith('✨') ? '#166534' : 'var(--accent)',
          }}>{status}</div>
        )}

        <button onClick={handleSubmit} disabled={loading} style={{
          width: '100%', background: 'var(--accent)', color: '#fff',
          border: 'none', padding: '14px', borderRadius: 10,
          fontSize: 15, fontWeight: 600, opacity: loading ? 0.7 : 1, cursor: 'pointer',
        }}>
          {loading ? '⏳ Processing...' : '⛓️ Register on Blockchain'}
        </button>
      </div>
    </div>
  );
}