import React, { useState } from "react";
import { getReadContract } from "../utils/contract";
import { ethers }          from "ethers";
import { getIPFSUrl }      from "../utils/ipfs";

export default function Verify() {
  const [landId,  setLandId]  = useState("");
  const [result,  setResult]  = useState(null);
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState("");

  const handleVerify = async (e) => {
    e.preventDefault();
    if (!landId) return;
    setLoading(true);
    setError("");
    setResult(null);
    try {
      const contract = getReadContract();                       // read-only, no MetaMask
      const land     = await contract.getLandDetails(parseInt(landId)); // parseInt fixes BigInt ESLint + ENS error
      setResult({
        landId:       Number(land.landId),
        owner:        land.owner,
        gps:          land.gpsCoordinates,
        area:         Number(land.areaSqMeters),
        docHash:      land.documentHash,
        title:        land.title,
        isRegistered: land.isRegistered,
        isForSale:    land.isForSale,
        salePrice:    land.salePrice,
        hasLien:      land.hasLien,
        isDisputed:   land.isDisputed,
        registeredAt: Number(land.registeredAt)
      });
    } catch (err) {
      setError(
        err.message?.includes("not registered") || err.message?.includes("Land not found")
          ? `Land ID ${landId} is not registered on this network.`
          : (err.reason || err.message)
      );
    } finally {
      setLoading(false);
    }
  };

  const isEncumbered = result && (result.hasLien || result.isDisputed);

  return (
    <div style={styles.container}>
      <h2 style={styles.title}>✅ Verify Land Title</h2>
      <p style={styles.sub}>Instant on-chain verification — no middlemen, direct from blockchain.</p>

      <form onSubmit={handleVerify} style={styles.form}>
        <input
          style={styles.input}
          value={landId}
          onChange={(e) => setLandId(e.target.value)}
          placeholder="Enter Land ID (e.g. 1)"
          type="number"
          min="1"
          required
        />
        <button type="submit" style={styles.btn} disabled={loading}>
          {loading ? "Checking…" : "🔍 Verify"}
        </button>
      </form>

      {error && <p style={styles.error}>❌ {error}</p>}

      {result && (
        <div style={styles.card}>
          <h3 style={styles.cardTitle}>
            Land Parcel #{result.landId}
            {result.title ? ` — ${result.title}` : ""}
          </h3>

          <div style={styles.statusRow}>
            <span style={{ ...styles.pill, background: "#dcfce7", color: "#166534" }}>
              ✅ Registered
            </span>
            {result.isForSale && (
              <span style={{ ...styles.pill, background: "#dbeafe", color: "#1e40af" }}>
                🏷️ For Sale — {ethers.formatEther(result.salePrice)} MATIC
              </span>
            )}
            {result.hasLien && (
              <span style={{ ...styles.pill, background: "#fef9c3", color: "#713f12" }}>
                🏦 Lien Active
              </span>
            )}
            {result.isDisputed && (
              <span style={{ ...styles.pill, background: "#fee2e2", color: "#991b1b" }}>
                ⚠️ Under Dispute
              </span>
            )}
          </div>

          <table style={styles.table}>
            <tbody>
              <tr>
                <td style={styles.th}>Owner</td>
                <td><code style={styles.code}>{result.owner}</code></td>
              </tr>
              <tr>
                <td style={styles.th}>GPS</td>
                <td>
                  <a
                    href={`https://maps.google.com/?q=${result.gps}`}
                    target="_blank"
                    rel="noreferrer"
                    style={styles.link}
                  >
                    📍 {result.gps}
                  </a>
                </td>
              </tr>
              <tr>
                <td style={styles.th}>Area</td>
                <td>{result.area.toLocaleString()} m²</td>
              </tr>
              <tr>
                <td style={styles.th}>Title Deed</td>
                <td>
                  {result.docHash ? (
                    <a
                      href={getIPFSUrl(result.docHash)}
                      target="_blank"
                      rel="noreferrer"
                      style={styles.link}
                    >
                      📄 View on IPFS
                    </a>
                  ) : "—"}
                </td>
              </tr>
              <tr>
                <td style={styles.th}>Registered</td>
                <td>{new Date(result.registeredAt * 1000).toLocaleDateString("en-IN", {
                  day: "numeric", month: "long", year: "numeric"
                })}</td>
              </tr>
              <tr>
                <td style={styles.th}>Clear Title?</td>
                <td style={{ color: isEncumbered ? "#dc2626" : "#059669", fontWeight: 700 }}>
                  {isEncumbered ? "❌ No — Encumbered" : "✅ Yes — Clean Title"}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

const styles = {
  container: { maxWidth: 680, margin: "40px auto", padding: 24, fontFamily: "sans-serif" },
  title:     { fontSize: 24, fontWeight: 700, marginBottom: 4 },
  sub:       { color: "#555", marginBottom: 20 },
  form:      { display: "flex", gap: 12, marginBottom: 24 },
  input:     { flex: 1, padding: "10px 12px", border: "1px solid #d1d5db", borderRadius: 6, fontSize: 14 },
  btn:       { padding: "10px 20px", background: "#059669", color: "#fff", border: "none", borderRadius: 6, cursor: "pointer", fontWeight: 600 },
  card:      { background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: 10, padding: 20 },
  cardTitle: { fontSize: 18, fontWeight: 700, marginBottom: 12 },
  statusRow: { display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 16 },
  pill:      { padding: "4px 12px", borderRadius: 20, fontSize: 13, fontWeight: 600 },
  table:     { width: "100%", borderCollapse: "collapse", fontSize: 14 },
  th:        { padding: "8px 12px", fontWeight: 600, color: "#374151", width: 130, verticalAlign: "top" },
  code:      { fontSize: 12, wordBreak: "break-all", background: "#f1f5f9", padding: "2px 6px", borderRadius: 4 },
  link:      { color: "#2563eb" },
  error:     { color: "#dc2626", padding: "10px 14px", background: "#fef2f2", borderRadius: 6, border: "1px solid #fecaca" }
};