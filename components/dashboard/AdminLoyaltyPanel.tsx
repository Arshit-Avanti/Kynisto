"use client";

import { useState, useEffect } from "react";
import { apiFetch } from "@/lib/client-api";
import { ShieldCheck, Activity, Settings, CheckCircle2, AlertTriangle, Store, QrCode, Sparkles } from "lucide-react";

export function AdminLoyaltyPanel() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [pointsPerScan, setPointsPerScan] = useState(10);
  const [maxCap, setMaxCap] = useState(1000);
  const [metrics, setMetrics] = useState<any>({});
  const [scanLogs, setScanLogs] = useState<any[]>([]);
  const [storesList, setStoresList] = useState<any[]>([]);
  const [toast, setToast] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    loadAdminLoyalty();
  }, []);

  async function loadAdminLoyalty() {
    setLoading(true);
    setError("");
    try {
      const res = await apiFetch<{
        config: { kynistoPointsPerScan: number; maxKynistoBalanceCap: number };
        metrics: any;
        scanLogs: any[];
        participatingStores: any[];
      }>("/api/admin/loyalty");

      if (res?.config) {
        setPointsPerScan(res.config.kynistoPointsPerScan || 10);
        setMaxCap(res.config.maxKynistoBalanceCap || 1000);
      }
      setMetrics(res?.metrics || {});
      setScanLogs(res?.scanLogs ?? []);
      setStoresList(res?.participatingStores ?? []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load admin loyalty panel.");
    } finally {
      setLoading(false);
    }
  }

  async function handleSaveGlobalConfig(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError("");
    try {
      const res = await apiFetch<{ success: boolean; message: string }>(`/api/admin/loyalty`, {
        method: "POST",
        json: { kynistoPointsPerScan: pointsPerScan, maxKynistoBalanceCap: maxCap },
      });
      setToast(res.message || "Global Kynisto loyalty settings updated!");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update global config.");
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return <div style={{ padding: "30px", color: "#94A3B8", textAlign: "center" }}>Loading platform loyalty control center...</div>;
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

      {/* METRICS OVERVIEW */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "14px" }}>
        <div style={{ background: "rgba(15,23,42,0.9)", border: "1px solid rgba(99,102,241,0.3)", borderRadius: "14px", padding: "16px" }}>
          <div style={{ fontSize: "11px", color: "#94A3B8", textTransform: "uppercase", fontWeight: 800 }}>Total Platform QR Scans</div>
          <div style={{ fontSize: "24px", fontWeight: 900, color: "#818CF8", marginTop: "4px" }}>{metrics.totalScans || 0}</div>
        </div>
        <div style={{ background: "rgba(15,23,42,0.9)", border: "1px solid rgba(16,185,129,0.3)", borderRadius: "14px", padding: "16px" }}>
          <div style={{ fontSize: "11px", color: "#94A3B8", textTransform: "uppercase", fontWeight: 800 }}>Successful QR Scans</div>
          <div style={{ fontSize: "24px", fontWeight: 900, color: "#4ADE80", marginTop: "4px" }}>{metrics.successfulScans || 0}</div>
        </div>
        <div style={{ background: "rgba(15,23,42,0.9)", border: "1px solid rgba(245,158,11,0.3)", borderRadius: "14px", padding: "16px" }}>
          <div style={{ fontSize: "11px", color: "#94A3B8", textTransform: "uppercase", fontWeight: 800 }}>Blocked Fraud / Cooldowns</div>
          <div style={{ fontSize: "24px", fontWeight: 900, color: "#FBBF24", marginTop: "4px" }}>{metrics.duplicateAttempts || 0}</div>
        </div>
        <div style={{ background: "rgba(15,23,42,0.9)", border: "1px solid rgba(236,72,153,0.3)", borderRadius: "14px", padding: "16px" }}>
          <div style={{ fontSize: "11px", color: "#94A3B8", textTransform: "uppercase", fontWeight: 800 }}>Total Kynisto Points Awarded</div>
          <div style={{ fontSize: "24px", fontWeight: 900, color: "#F472B6", marginTop: "4px" }}>{metrics.totalKynistoAwarded || 0}</div>
        </div>
      </div>

      {/* GLOBAL KYNISTO CONFIG & PARTICIPATING STORES */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(340px, 1fr))", gap: "20px" }}>
        {/* GLOBAL KYNISTO REWARD CONFIG FORM */}
        <div style={{ background: "linear-gradient(135deg, rgba(15,23,42,0.95) 0%, rgba(30,27,75,0.9) 100%)", border: "2px solid #6366F1", borderRadius: "18px", padding: "20px" }}>
          <h3 style={{ fontSize: "18px", fontWeight: 800, color: "#818CF8", margin: "0 0 14px 0", display: "flex", alignItems: "center", gap: "8px" }}>
            <Settings size={20} /> Global Kynisto Loyalty Settings
          </h3>

          <form onSubmit={handleSaveGlobalConfig} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
            <div>
              <label style={{ fontSize: "13px", fontWeight: 800, color: "#CBD5E1", display: "flex", justifyContent: "space-between", marginBottom: "6px" }}>
                <span>Global Kynisto Points Per Scan</span>
                <b style={{ color: "#818CF8", fontSize: "15px" }}>+{pointsPerScan} Kynisto Points</b>
              </label>
              <input
                type="range"
                min="5"
                max="10"
                step="1"
                value={pointsPerScan}
                onChange={(e) => setPointsPerScan(parseInt(e.target.value, 10))}
                style={{ width: "100%", accentColor: "#818CF8", cursor: "pointer" }}
              />
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: "11px", color: "#94A3B8", marginTop: "2px" }}>
                <span>5 Points (Min)</span>
                <span>10 Points (Max)</span>
              </div>
            </div>

            <div>
              <label style={{ fontSize: "13px", fontWeight: 800, color: "#CBD5E1", display: "block", marginBottom: "6px" }}>
                Global Maximum Kynisto Balance Cap
              </label>
              <input
                type="number"
                value={maxCap}
                onChange={(e) => setMaxCap(parseInt(e.target.value, 10))}
                style={{ width: "100%", background: "#1E293B", border: "1px solid #475569", color: "#FFF", padding: "10px", borderRadius: "8px", fontSize: "14px", fontWeight: 800 }}
                required
              />
              <p style={{ fontSize: "11px", color: "#94A3B8", marginTop: "4px" }}>
                Customers capped at <b>1,000 points</b> must redeem points before earning additional global Kynisto points.
              </p>
            </div>

            <button
              type="submit"
              disabled={saving}
              style={{
                background: "linear-gradient(135deg, #10B981 0%, #059669 100%)",
                color: "#FFF",
                border: "none",
                padding: "12px",
                borderRadius: "10px",
                fontWeight: 900,
                fontSize: "14px",
                cursor: "pointer",
                boxShadow: "0 4px 14px rgba(16,185,129,0.3)",
              }}
            >
              {saving ? "Updating..." : "Save Global Loyalty Config"}
            </button>
          </form>
        </div>

        {/* PARTICIPATING STORES TABLE */}
        <div style={{ background: "rgba(15,23,42,0.9)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "18px", padding: "20px" }}>
          <h3 style={{ fontSize: "17px", fontWeight: 800, color: "#FFF", margin: "0 0 14px 0", display: "flex", alignItems: "center", gap: "8px" }}>
            <Store size={18} style={{ color: "#4ADE80" }} /> Participating Stores ({storesList.length})
          </h3>
          <div style={{ overflowY: "auto", maxHeight: "240px" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "12px", color: "#FFF" }}>
              <thead>
                <tr style={{ borderBottom: "1px solid rgba(255,255,255,0.1)", textAlign: "left", color: "#94A3B8" }}>
                  <th style={{ padding: "6px 8px" }}>Store Name</th>
                  <th style={{ padding: "6px 8px" }}>Reward Value</th>
                  <th style={{ padding: "6px 8px" }}>Loyalty Status</th>
                </tr>
              </thead>
              <tbody>
                {storesList.map((s) => (
                  <tr key={s.id} style={{ borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
                    <td style={{ padding: "8px", fontWeight: 800 }}>{s.name}</td>
                    <td style={{ padding: "8px", color: "#4ADE80", fontWeight: 800 }}>+{s.reward_points_per_scan} Store Points</td>
                    <td style={{ padding: "8px" }}>
                      <span style={{
                        background: s.is_loyalty_enabled ? "rgba(16,185,129,0.2)" : "rgba(239,68,68,0.2)",
                        color: s.is_loyalty_enabled ? "#4ADE80" : "#F87171",
                        padding: "2px 6px", borderRadius: "6px", fontWeight: 800, fontSize: "10px"
                      }}>
                        {s.is_loyalty_enabled ? "ACTIVE" : "DISABLED"}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* PLATFORM-WIDE SCAN AUDIT & FRAUD DETECTION LOG */}
      <div style={{ background: "rgba(15,23,42,0.9)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "18px", padding: "20px" }}>
        <h3 style={{ fontSize: "17px", fontWeight: 800, color: "#FFF", margin: "0 0 14px 0", display: "flex", alignItems: "center", gap: "8px" }}>
          <Activity size={18} style={{ color: "#F472B6" }} /> Platform-Wide Scan Audit & Fraud Logs ({scanLogs.length})
        </h3>
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "12px", color: "#FFF" }}>
            <thead>
              <tr style={{ borderBottom: "1px solid rgba(255,255,255,0.1)", textAlign: "left", color: "#94A3B8" }}>
                <th style={{ padding: "8px" }}>Timestamp</th>
                <th style={{ padding: "8px" }}>Store</th>
                <th style={{ padding: "8px" }}>Customer</th>
                <th style={{ padding: "8px" }}>Kynisto Points</th>
                <th style={{ padding: "8px" }}>Store Points</th>
                <th style={{ padding: "8px" }}>Status / Result</th>
              </tr>
            </thead>
            <tbody>
              {scanLogs.map((log) => (
                <tr key={log.id} style={{ borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
                  <td style={{ padding: "8px", color: "#94A3B8" }}>{new Date(log.scanned_at * 1000).toLocaleString("en-IN", { dateStyle: "short", timeStyle: "short" })}</td>
                  <td style={{ padding: "8px", fontWeight: 800, color: "#818CF8" }}>{log.store_name || log.store_id}</td>
                  <td style={{ padding: "8px" }}>{log.customer_name || log.user_id}</td>
                  <td style={{ padding: "8px", color: "#F472B6", fontWeight: 800 }}>+{log.kynisto_points_earned}</td>
                  <td style={{ padding: "8px", color: "#4ADE80", fontWeight: 800 }}>+{log.store_points_earned}</td>
                  <td style={{ padding: "8px" }}>
                    <span style={{
                      background: log.status === "success" ? "rgba(16,185,129,0.2)" : log.status === "cooldown_active" ? "rgba(245,158,11,0.2)" : "rgba(239,68,68,0.2)",
                      color: log.status === "success" ? "#4ADE80" : log.status === "cooldown_active" ? "#FBBF24" : "#F87171",
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
      </div>
    </div>
  );
}
