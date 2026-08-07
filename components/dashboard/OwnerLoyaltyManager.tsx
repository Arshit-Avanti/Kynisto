"use client";

import { useState, useEffect } from "react";
import { apiFetch } from "@/lib/client-api";
import { QrCode, ShieldCheck, CheckCircle2, Copy, Check, RefreshCw, Users, Activity, Sparkles, Sliders } from "lucide-react";

export function OwnerLoyaltyManager({ storeId }: { storeId: string }) {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [isLoyaltyEnabled, setIsLoyaltyEnabled] = useState(true);
  const [rewardPoints, setRewardPoints] = useState(50);
  const [qrToken, setQrToken] = useState("");
  const [qrCodeImageUrl, setQrCodeImageUrl] = useState("");
  const [customerBalances, setCustomerBalances] = useState<any[]>([]);
  const [scanHistory, setScanHistory] = useState<any[]>([]);
  const [copiedToken, setCopiedToken] = useState(false);
  const [toast, setToast] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    loadLoyaltyData();
  }, [storeId]);

  async function loadLoyaltyData() {
    setLoading(true);
    setError("");
    try {
      const res = await apiFetch<{
        settings: { isLoyaltyEnabled: boolean; rewardPointsPerScan: number; qrCodeToken: string; qrCodeImageUrl: string };
        customerBalances: any[];
        scanHistory: any[];
      }>(`/api/owner/loyalty?storeId=${storeId}`);

      if (res?.settings) {
        setIsLoyaltyEnabled(res.settings.isLoyaltyEnabled);
        setRewardPoints(res.settings.rewardPointsPerScan || 50);
        setQrToken(res.settings.qrCodeToken);
        setQrCodeImageUrl(res.settings.qrCodeImageUrl);
      }
      setCustomerBalances(res.customerBalances ?? []);
      setScanHistory(res.scanHistory ?? []);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load loyalty settings.");
    } finally {
      setLoading(false);
    }
  }

  async function handleSaveSettings(e?: React.FormEvent, regenerate: boolean = false) {
    if (e) e.preventDefault();
    setSaving(true);
    setError("");
    try {
      const res = await apiFetch<{ success: boolean; message: string; settings: any }>(`/api/owner/loyalty`, {
        method: "POST",
        json: { storeId, isLoyaltyEnabled, rewardPointsPerScan: rewardPoints, regenerateQr: regenerate },
      });
      setToast(res.message || "Loyalty settings saved!");
      if (res.settings) {
        setQrToken(res.settings.qrCodeToken);
        setQrCodeImageUrl(res.settings.qrCodeImageUrl);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update loyalty settings.");
    } finally {
      setSaving(false);
    }
  }

  function handleCopyToken() {
    if (!qrToken) return;
    navigator.clipboard.writeText(qrToken);
    setCopiedToken(true);
    setTimeout(() => setCopiedToken(false), 2000);
  }

  function handlePrintQr() {
    const printWindow = window.open("", "_blank");
    if (!printWindow) return;
    printWindow.document.write(`
      <html>
        <head>
          <title>Store Loyalty QR Code - Kynisto</title>
          <style>
            body { font-family: system-ui, sans-serif; text-align: center; padding: 40px; background: #FFF; color: #000; }
            .card { border: 3px solid #6366F1; padding: 30px; max-width: 400px; margin: 0 auto; border-radius: 24px; box-shadow: 0 10px 30px rgba(0,0,0,0.1); }
            h1 { color: #4F46E5; margin: 0 0 10px 0; font-size: 24px; }
            p { color: #4B5563; font-size: 14px; margin: 6px 0; }
            img { width: 240px; height: 240px; margin: 20px 0; border: 2px solid #E0E7FF; padding: 10px; border-radius: 16px; }
            .badge { background: #EEF2FF; color: #4F46E5; font-weight: 800; padding: 8px 16px; border-radius: 20px; display: inline-block; font-size: 14px; }
          </style>
        </head>
        <body>
          <div class="card">
            <h1>Scan & Earn Loyalty Rewards</h1>
            <p>Scan with the Kynisto App on every visit to earn instant rewards!</p>
            <img src="${qrCodeImageUrl}" alt="Kynisto Store Loyalty QR" />
            <div class="badge">+${rewardPoints} Store Loyalty Points + Kynisto Points</div>
          </div>
        </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => printWindow.print(), 500);
  }

  if (loading) {
    return <div style={{ padding: "30px", color: "#94A3B8", textAlign: "center" }}>Loading store loyalty QR system...</div>;
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
      {toast && (
        <div style={{ background: "rgba(16,185,129,0.2)", border: "1px solid #10B981", color: "#4ADE80", padding: "12px 16px", borderRadius: "10px", fontWeight: 800, fontSize: "14px", display: "flex", alignItems: "center", gap: "8px" }}>
          <CheckCircle2 size={18} /> {toast}
        </div>
      )}
      {error && (
        <div style={{ background: "rgba(239,68,68,0.2)", border: "1px solid #EF4444", color: "#F87171", padding: "12px 16px", borderRadius: "10px", fontWeight: 800, fontSize: "14px" }}>
          {error}
        </div>
      )}

      {/* TOP CONFIG & QR CODE DISPLAY */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: "20px" }}>
        {/* SCANNABLE QR CODE CARD */}
        <div style={{ background: "linear-gradient(135deg, rgba(15,23,42,0.95) 0%, rgba(30,27,75,0.9) 100%)", border: "2px solid #6366F1", borderRadius: "18px", padding: "20px", textAlign: "center" }}>
          <h3 style={{ fontSize: "18px", fontWeight: 800, color: "#818CF8", margin: "0 0 4px 0", display: "flex", alignItems: "center", justifyContent: "center", gap: "8px" }}>
            <QrCode size={20} /> Store Loyalty Kynisto QR Code
          </h3>
          <p style={{ fontSize: "12px", color: "#94A3B8", margin: "0 0 16px 0" }}>
            Display this QR Code at your billing counter. Customers earn points only when scanning this QR!
          </p>

          <div style={{ background: "#FFF", padding: "12px", borderRadius: "16px", display: "inline-block", border: "3px solid #818CF8", boxShadow: "0 8px 24px rgba(99,102,241,0.3)" }}>
            <img src={qrCodeImageUrl} alt="Store Loyalty QR Code" style={{ width: "200px", height: "200px", objectFit: "contain", display: "block" }} />
          </div>

          <div style={{ background: "rgba(99,102,241,0.15)", border: "1px solid rgba(99,102,241,0.3)", padding: "10px", borderRadius: "10px", marginTop: "16px", display: "flex", alignItems: "center", justifyContent: "space-between", gap: "8px" }}>
            <div style={{ textAlign: "left" }}>
              <div style={{ fontSize: "10px", color: "#94A3B8", textTransform: "uppercase", fontWeight: 800 }}>Store QR Token</div>
              <div style={{ fontSize: "13px", color: "#FFF", fontWeight: 900, fontFamily: "monospace" }}>{qrToken}</div>
            </div>
            <button
              type="button"
              onClick={handleCopyToken}
              style={{ background: "#6366F1", color: "#FFF", border: "none", padding: "6px 12px", borderRadius: "8px", fontSize: "12px", fontWeight: 800, cursor: "pointer", display: "flex", alignItems: "center", gap: "4px" }}
            >
              {copiedToken ? <Check size={14} /> : <Copy size={14} />}
              {copiedToken ? "Copied!" : "Copy Token"}
            </button>
          </div>

          <div style={{ display: "flex", gap: "10px", marginTop: "14px" }}>
            <button
              type="button"
              onClick={handlePrintQr}
              style={{ flex: 1, background: "linear-gradient(135deg, #10B981 0%, #059669 100%)", color: "#FFF", border: "none", padding: "10px", borderRadius: "10px", fontWeight: 800, cursor: "pointer", fontSize: "13px" }}
            >
              Print / Download QR Pass
            </button>
            <button
              type="button"
              disabled={saving}
              onClick={() => handleSaveSettings(undefined, true)}
              style={{ background: "rgba(255,255,255,0.08)", color: "#CBD5E1", border: "1px solid rgba(255,255,255,0.2)", padding: "10px 14px", borderRadius: "10px", fontWeight: 800, cursor: "pointer", fontSize: "12px", display: "flex", alignItems: "center", gap: "6px" }}
            >
              <RefreshCw size={14} /> Regenerate Token
            </button>
          </div>
        </div>

        {/* SETTINGS FORM CARD */}
        <div style={{ background: "rgba(15,23,42,0.9)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "18px", padding: "20px" }}>
          <h3 style={{ fontSize: "18px", fontWeight: 800, color: "#FFF", margin: "0 0 14px 0", display: "flex", alignItems: "center", gap: "8px" }}>
            <Sliders size={20} style={{ color: "#4ADE80" }} /> Configure Loyalty Reward Rules
          </h3>

          <form onSubmit={(e) => handleSaveSettings(e, false)} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
            <div style={{ background: "rgba(255,255,255,0.03)", padding: "14px", borderRadius: "12px", border: "1px solid rgba(255,255,255,0.08)" }}>
              <label style={{ display: "flex", alignItems: "center", justifyContent: "space-between", cursor: "pointer" }}>
                <div>
                  <div style={{ fontSize: "14px", fontWeight: 800, color: "#FFF" }}>Enable Store QR Loyalty Program</div>
                  <div style={{ fontSize: "12px", color: "#94A3B8", marginTop: "2px" }}>Allow customers to earn loyalty points when scanning your QR code.</div>
                </div>
                <input
                  type="checkbox"
                  checked={isLoyaltyEnabled}
                  onChange={(e) => setIsLoyaltyEnabled(e.target.checked)}
                  style={{ width: "20px", height: "20px", accentColor: "#10B981" }}
                />
              </label>
            </div>

            <div>
              <label style={{ fontSize: "13px", fontWeight: 800, color: "#CBD5E1", display: "flex", justifyContent: "space-between", marginBottom: "8px" }}>
                <span>Store Points Per Scan</span>
                <b style={{ color: "#4ADE80", fontSize: "15px" }}>+{rewardPoints} Points</b>
              </label>
              <input
                type="range"
                min="50"
                max="100"
                step="5"
                value={rewardPoints}
                onChange={(e) => setRewardPoints(parseInt(e.target.value, 10))}
                style={{ width: "100%", accentColor: "#4ADE80", cursor: "pointer" }}
              />
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: "11px", color: "#94A3B8", marginTop: "4px" }}>
                <span>50 Points (Min)</span>
                <span>75 Points</span>
                <span>100 Points (Max)</span>
              </div>
            </div>

            <div style={{ background: "rgba(16,185,129,0.1)", border: "1px solid rgba(16,185,129,0.3)", padding: "12px", borderRadius: "10px" }}>
              <div style={{ fontSize: "12px", fontWeight: 800, color: "#4ADE80", display: "flex", alignItems: "center", gap: "6px" }}>
                <ShieldCheck size={16} /> Verified Dual-Points Distribution
              </div>
              <div style={{ fontSize: "12px", color: "#CBD5E1", marginTop: "4px", lineHeight: "1.4" }}>
                Every valid scan awards <b>+{rewardPoints} {storeId} Points</b> to the customer for your store only, plus <b>+10 Global Kynisto Points</b> (up to 1000 max cap).
              </div>
            </div>

            <button
              type="submit"
              disabled={saving}
              style={{
                background: "linear-gradient(135deg, #6366F1 0%, #4F46E5 100%)",
                color: "#FFF",
                border: "none",
                padding: "12px",
                borderRadius: "10px",
                fontWeight: 900,
                fontSize: "14px",
                cursor: "pointer",
                boxShadow: "0 4px 14px rgba(99,102,241,0.3)",
              }}
            >
              {saving ? "Saving Changes..." : "Save Loyalty Settings"}
            </button>
          </form>
        </div>
      </div>

      {/* CUSTOMER LOYALTY BALANCES TABLE */}
      <div style={{ background: "rgba(15,23,42,0.9)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "18px", padding: "20px" }}>
        <h3 style={{ fontSize: "17px", fontWeight: 800, color: "#FFF", margin: "0 0 14px 0", display: "flex", alignItems: "center", gap: "8px" }}>
          <Users size={18} style={{ color: "#818CF8" }} /> Customer Loyalty Balances ({customerBalances.length})
        </h3>
        {customerBalances.length === 0 ? (
          <p style={{ color: "#94A3B8", fontSize: "13px", margin: 0, textAlign: "center", padding: "16px" }}>No customers have scanned your store QR code yet.</p>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "13px", color: "#FFF" }}>
              <thead>
                <tr style={{ borderBottom: "1px solid rgba(255,255,255,0.1)", textAlign: "left", color: "#94A3B8" }}>
                  <th style={{ padding: "8px 12px" }}>Customer Name</th>
                  <th style={{ padding: "8px 12px" }}>Email</th>
                  <th style={{ padding: "8px 12px" }}>Store Loyalty Points</th>
                  <th style={{ padding: "8px 12px" }}>Last Visited</th>
                </tr>
              </thead>
              <tbody>
                {customerBalances.map((cb, idx) => (
                  <tr key={idx} style={{ borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
                    <td style={{ padding: "10px 12px", fontWeight: 800 }}>{cb.customer_name || "Customer"}</td>
                    <td style={{ padding: "10px 12px", color: "#CBD5E1" }}>{cb.customer_email || "N/A"}</td>
                    <td style={{ padding: "10px 12px", color: "#4ADE80", fontWeight: 900 }}>+{cb.points} Points</td>
                    <td style={{ padding: "10px 12px", color: "#94A3B8" }}>{cb.last_visited_at ? new Date(cb.last_visited_at * 1000).toLocaleDateString("en-IN") : "N/A"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* SCAN HISTORY AUDIT LOG */}
      <div style={{ background: "rgba(15,23,42,0.9)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "18px", padding: "20px" }}>
        <h3 style={{ fontSize: "17px", fontWeight: 800, color: "#FFF", margin: "0 0 14px 0", display: "flex", alignItems: "center", gap: "8px" }}>
          <Activity size={18} style={{ color: "#FBBF24" }} /> Store QR Scan History Log ({scanHistory.length})
        </h3>
        {scanHistory.length === 0 ? (
          <p style={{ color: "#94A3B8", fontSize: "13px", margin: 0, textAlign: "center", padding: "16px" }}>No scan log history recorded yet.</p>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "12px", color: "#FFF" }}>
              <thead>
                <tr style={{ borderBottom: "1px solid rgba(255,255,255,0.1)", textAlign: "left", color: "#94A3B8" }}>
                  <th style={{ padding: "8px 12px" }}>Time</th>
                  <th style={{ padding: "8px 12px" }}>Customer</th>
                  <th style={{ padding: "8px 12px" }}>Kynisto Points</th>
                  <th style={{ padding: "8px 12px" }}>Store Points</th>
                  <th style={{ padding: "8px 12px" }}>Status</th>
                </tr>
              </thead>
              <tbody>
                {scanHistory.map((log) => (
                  <tr key={log.id} style={{ borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
                    <td style={{ padding: "8px 12px", color: "#94A3B8" }}>{new Date(log.scanned_at * 1000).toLocaleString("en-IN", { dateStyle: "short", timeStyle: "short" })}</td>
                    <td style={{ padding: "8px 12px", fontWeight: 700 }}>{log.customer_name || "Customer"}</td>
                    <td style={{ padding: "8px 12px", color: "#818CF8", fontWeight: 800 }}>+{log.kynisto_points_earned}</td>
                    <td style={{ padding: "8px 12px", color: "#4ADE80", fontWeight: 800 }}>+{log.store_points_earned}</td>
                    <td style={{ padding: "8px 12px" }}>
                      <span style={{
                        background: log.status === "success" || log.status === "capped_kynisto" ? "rgba(16,185,129,0.2)" : "rgba(239,68,68,0.2)",
                        color: log.status === "success" || log.status === "capped_kynisto" ? "#4ADE80" : "#F87171",
                        padding: "2px 8px", borderRadius: "6px", fontWeight: 800, fontSize: "10px"
                      }}>
                        {log.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
