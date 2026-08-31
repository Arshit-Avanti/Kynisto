"use client";

import { useEffect, useState } from "react";
import { apiFetch } from "@/lib/client-api";

interface QrOwnerData {
  store: {
    id: string;
    name: string;
    slug: string;
  };
  qr: {
    id: string;
    storeId: string;
    ownerId: string;
    queueCode: string;
    status: "active" | "disabled";
  };
  analytics: {
    totalScans: number;
    uniqueVisitors: number;
    appScans: number;
    webScans: number;
    queueJoins: number;
  };
}

export function OwnerHealthcareQRCard() {
  const [data, setData] = useState<QrOwnerData | null>(null);
  const [loading, setLoading] = useState(true);
  const [toggling, setToggling] = useState(false);
  const [showPrintModal, setShowPrintModal] = useState(false);
  const [isEditingCode, setIsEditingCode] = useState(false);
  const [customCodeInput, setCustomCodeInput] = useState("");
  const [savingCode, setSavingCode] = useState(false);
  const [codeMsg, setCodeMsg] = useState<{ text: string; error?: boolean } | null>(null);

  useEffect(() => {
    apiFetch<QrOwnerData>("/api/healthcare/qr/owner")
      .then((res) => {
        setData(res);
        setCustomCodeInput(res?.qr?.queueCode || "");
        setLoading(false);
      })
      .catch(() => {
        setLoading(false);
      });
  }, []);

  const handleToggleStatus = async () => {
    if (!data || toggling) return;
    setToggling(true);
    try {
      const newStatus = data.qr.status === "active" ? "disabled" : "active";
      const res = await apiFetch<{ ok: boolean; qr: QrOwnerData["qr"] }>("/api/healthcare/qr/owner", {
        method: "POST",
        json: { status: newStatus },
      });
      setData((current) => current ? { ...current, qr: res.qr } : current);
    } catch {
      // Ignore toggle error
    } finally {
      setToggling(false);
    }
  };

  const handleSaveCustomCode = async () => {
    if (!data || savingCode) return;
    const clean = customCodeInput.trim();
    if (!clean) return;
    setSavingCode(true);
    setCodeMsg(null);
    try {
      const res = await apiFetch<{ ok: boolean; qr: QrOwnerData["qr"] }>("/api/healthcare/qr/owner", {
        method: "POST",
        json: { queueCode: clean },
      });
      setData((current) => current ? { ...current, qr: res.qr } : current);
      setIsEditingCode(false);
      setCodeMsg({ text: "✓ Custom queue code saved successfully!" });
    } catch (err: any) {
      setCodeMsg({ text: err instanceof Error ? err.message : "Failed to update code.", error: true });
    } finally {
      setSavingCode(false);
    }
  };


  if (loading) {
    return (
      <div className="dashCard" style={{ padding: "1.5rem", textAlign: "center" }}>
        <p style={{ color: "#64748b" }}>Loading Permanent Queue QR Code…</p>
      </div>
    );
  }

  if (!data) return null;

  const { store, qr, analytics } = data;
  const origin = typeof window !== "undefined" ? window.location.origin : "https://kynisto.in";
  const qrUrl = `${origin}/q/${qr.queueCode}`;
  const qrImageApi = `https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(qrUrl)}`;

  return (
    <div className="dashCard" style={{ padding: "1.75rem", borderRadius: "16px", background: "#ffffff", border: "1px solid #e2e8f0", marginTop: "1.5rem" }}>
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", flexWrap: "wrap", gap: "1rem" }}>
        <div>
          <span style={{ color: "#2563eb", fontSize: "0.85rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em" }}>
            Permanent Healthcare QR Identity
          </span>
          
          {isEditingCode ? (
            <div style={{ marginTop: "0.5rem", display: "flex", alignItems: "center", gap: "0.5rem", flexWrap: "wrap" }}>
              <span style={{ fontSize: "0.9rem", color: "#64748b", fontWeight: 600 }}>kynisto.in/q/</span>
              <input
                type="text"
                value={customCodeInput}
                onChange={(e) => setCustomCodeInput(e.target.value)}
                placeholder="e.g. aarogya-clinic"
                style={{ padding: "0.4rem 0.75rem", borderRadius: "8px", border: "1.5px solid #2563eb", fontSize: "0.95rem", fontFamily: "monospace", outline: "none" }}
              />
              <button
                type="button"
                disabled={savingCode || !customCodeInput.trim()}
                onClick={handleSaveCustomCode}
                style={{ padding: "0.45rem 0.9rem", borderRadius: "8px", background: "#2563eb", color: "#fff", border: "none", fontWeight: 700, fontSize: "0.85rem", cursor: "pointer" }}
              >
                {savingCode ? "Saving…" : "Save Custom Code"}
              </button>
              <button
                type="button"
                onClick={() => { setIsEditingCode(false); setCustomCodeInput(qr.queueCode); }}
                style={{ padding: "0.45rem 0.75rem", borderRadius: "8px", background: "#f1f5f9", color: "#475569", border: "none", fontWeight: 600, fontSize: "0.85rem", cursor: "pointer" }}
              >
                Cancel
              </button>
            </div>
          ) : (
            <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginTop: "0.2rem", flexWrap: "wrap" }}>
              <h3 style={{ fontSize: "1.35rem", fontWeight: 800, color: "#0f172a", margin: 0 }}>
                Clinic Code: <code style={{ background: "#eff6ff", color: "#1d4ed8", padding: "0.2rem 0.6rem", borderRadius: "8px", fontFamily: "monospace" }}>{qr.queueCode}</code>
              </h3>
              <button
                type="button"
                onClick={() => setIsEditingCode(true)}
                style={{ padding: "0.25rem 0.6rem", borderRadius: "6px", background: "#f8fafc", border: "1px solid #cbd5e1", fontSize: "0.8rem", fontWeight: 700, color: "#2563eb", cursor: "pointer" }}
              >
                ✏️ Customize Code
              </button>
            </div>
          )}

          {codeMsg && (
            <p style={{ fontSize: "0.85rem", marginTop: "0.4rem", color: codeMsg.error ? "#dc2626" : "#16a34a", fontWeight: 600 }}>
              {codeMsg.text}
            </p>
          )}

          <p style={{ color: "#64748b", fontSize: "0.9rem", marginTop: "0.35rem" }}>
            Permanent QR link: <a href={qrUrl} target="_blank" rel="noreferrer" style={{ color: "#2563eb", textDecoration: "underline", fontWeight: 600 }}>{qrUrl}</a>
          </p>
        </div>

        <button
          type="button"
          onClick={handleToggleStatus}
          disabled={toggling}
          style={{
            background: qr.status === "active" ? "#dcfce7" : "#fee2e2",
            color: qr.status === "active" ? "#15803d" : "#b91c1c",
            border: "none",
            padding: "0.5rem 1rem",
            borderRadius: "20px",
            fontWeight: 700,
            fontSize: "0.85rem",
            cursor: "pointer",
          }}
        >
          {toggling ? "Updating…" : qr.status === "active" ? "● QR Active" : "○ QR Disabled"}
        </button>
      </div>

      <hr style={{ border: "none", borderTop: "1px dashed #cbd5e1", margin: "1.25rem 0" }} />


      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "1.5rem", alignItems: "center" }}>
        {/* QR Code Graphic Display */}
        <div style={{ textAlign: "center", background: "#f8fafc", padding: "1.25rem", borderRadius: "14px", border: "1px solid #e2e8f0" }}>
          <img src={qrImageApi} alt={`Permanent QR Code ${qr.queueCode}`} width="180" height="180" style={{ borderRadius: "8px", border: "1px solid #cbd5e1" }} />
          <div style={{ display: "flex", gap: "0.5rem", justifyContent: "center", marginTop: "1rem" }}>
            <a
              href={qrImageApi}
              download={`Kynisto-Queue-QR-${qr.queueCode}.png`}
              target="_blank"
              rel="noreferrer"
              style={{ background: "#2563eb", color: "#ffffff", padding: "0.5rem 0.85rem", borderRadius: "8px", fontSize: "0.85rem", fontWeight: 700, textDecoration: "none" }}
            >
              📥 PNG
            </a>
            <button
              type="button"
              onClick={() => setShowPrintModal(true)}
              style={{ background: "#0f172a", color: "#ffffff", border: "none", padding: "0.5rem 0.85rem", borderRadius: "8px", fontSize: "0.85rem", fontWeight: 700, cursor: "pointer" }}
            >
              🖨️ Print Poster
            </button>
          </div>
        </div>

        {/* Real-time Analytics Summary */}
        <div>
          <h4 style={{ fontSize: "1rem", fontWeight: 700, color: "#0f172a", marginBottom: "0.75rem" }}>📊 Real-Time QR Analytics</h4>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem" }}>
            <div style={{ background: "#f1f5f9", padding: "0.85rem", borderRadius: "10px" }}>
              <span style={{ fontSize: "0.75rem", color: "#64748b", fontWeight: 600 }}>Total Scans</span>
              <div style={{ fontSize: "1.4rem", fontWeight: 800, color: "#0f172a" }}>{analytics.totalScans}</div>
            </div>
            <div style={{ background: "#f1f5f9", padding: "0.85rem", borderRadius: "10px" }}>
              <span style={{ fontSize: "0.75rem", color: "#64748b", fontWeight: 600 }}>Unique Patients</span>
              <div style={{ fontSize: "1.4rem", fontWeight: 800, color: "#2563eb" }}>{analytics.uniqueVisitors}</div>
            </div>
            <div style={{ background: "#f1f5f9", padding: "0.85rem", borderRadius: "10px" }}>
              <span style={{ fontSize: "0.75rem", color: "#64748b", fontWeight: 600 }}>App Scans</span>
              <div style={{ fontSize: "1.4rem", fontWeight: 800, color: "#16a34a" }}>{analytics.appScans}</div>
            </div>
            <div style={{ background: "#f1f5f9", padding: "0.85rem", borderRadius: "10px" }}>
              <span style={{ fontSize: "0.75rem", color: "#64748b", fontWeight: 600 }}>Queue Joins</span>
              <div style={{ fontSize: "1.4rem", fontWeight: 800, color: "#9333ea" }}>{analytics.queueJoins}</div>
            </div>
          </div>
        </div>
      </div>

      {/* Printable Poster Modal */}
      {showPrintModal && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.6)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 9999, padding: "1rem" }}>
          <div style={{ background: "#ffffff", padding: "2.5rem", borderRadius: "20px", maxWidth: "420px", width: "100%", textAlign: "center", border: "4px solid #2563eb" }}>
            <h2 style={{ fontSize: "1.8rem", fontWeight: 900, color: "#0f172a" }}>{store.name}</h2>
            <p style={{ color: "#2563eb", fontWeight: 700, marginTop: "0.25rem", textTransform: "uppercase", fontSize: "0.9rem" }}>Scan to Join Live Healthcare Queue</p>
            <div style={{ margin: "1.5rem auto", width: "220px", height: "220px" }}>
              <img src={qrImageApi} alt="Printable Queue QR" width="220" height="220" />
            </div>
            <p style={{ fontSize: "1.1rem", fontWeight: 800, color: "#0f172a" }}>Queue Code: {qr.queueCode}</p>
            <small style={{ color: "#64748b", display: "block", marginTop: "0.5rem" }}>Powered by Kynisto Healthcare</small>
            
            <div style={{ display: "flex", gap: "0.75rem", marginTop: "1.5rem" }}>
              <button
                type="button"
                onClick={() => window.print()}
                style={{ flex: 1, background: "#2563eb", color: "#ffffff", border: "none", padding: "0.85rem", borderRadius: "10px", fontWeight: 700, cursor: "pointer" }}
              >
                🖨️ Print Now
              </button>
              <button
                type="button"
                onClick={() => setShowPrintModal(false)}
                style={{ flex: 1, background: "#f1f5f9", color: "#334155", border: "1px solid #cbd5e1", padding: "0.85rem", borderRadius: "10px", fontWeight: 600, cursor: "pointer" }}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
