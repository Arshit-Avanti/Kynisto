"use client";

import { useState } from "react";

interface OwnerStoreQRCardProps {
  store: {
    id: string | number;
    name: string;
    slug: string;
    address?: string;
    city?: string;
    category?: string;
    logoUrl?: string | null;
    viewCount?: number;
  };
}

export function OwnerStoreQRCard({ store }: OwnerStoreQRCardProps) {
  const [copied, setCopied] = useState(false);
  const [showPrintModal, setShowPrintModal] = useState(false);

  const origin = typeof window !== "undefined" ? window.location.origin : "https://kynisto.nxt-arshit.workers.dev";
  const profileUrl = `${origin}/stores/${store.slug}`;
  const qrImageApi = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(profileUrl)}`;

  const handleCopyLink = () => {
    navigator.clipboard.writeText(profileUrl).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }).catch(() => {});
  };

  return (
    <div className="dashCard storeQrCard" style={{
      padding: "1.75rem",
      borderRadius: "16px",
      background: "#ffffff",
      border: "1px solid #e2e8f0",
      marginTop: "1.5rem",
      boxShadow: "0 4px 12px -2px rgba(15, 23, 42, 0.05)"
    }}>
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", flexWrap: "wrap", gap: "1rem" }}>
        <div>
          <span style={{ color: "#2563eb", fontSize: "0.8rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em" }}>
            Official Permanent Business QR Identity
          </span>
          <h3 style={{ fontSize: "1.4rem", fontWeight: 800, color: "#0f172a", marginTop: "0.25rem" }}>
            {store.name} Shop QR Code
          </h3>
          <p style={{ color: "#64748b", fontSize: "0.9rem", marginTop: "0.2rem" }}>
            Scanning this permanent QR code takes customers directly to your business profile, catalog &amp; directions.
          </p>
        </div>

        <div style={{ background: "#f1f5f9", padding: "0.5rem 0.85rem", borderRadius: "12px", textAlign: "right" }}>
          <span style={{ fontSize: "0.75rem", color: "#64748b", fontWeight: 600, display: "block" }}>Profile Views / Scans</span>
          <strong style={{ fontSize: "1.25rem", color: "#0f172a", fontWeight: 800 }}>
            {Number(store.viewCount ?? 0).toLocaleString()}
          </strong>
        </div>
      </div>

      <hr style={{ border: "none", borderTop: "1px dashed #cbd5e1", margin: "1.25rem 0" }} />

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "1.5rem", alignItems: "center" }}>
        {/* QR Code Preview Box */}
        <div style={{ textAlign: "center", background: "#f8fafc", padding: "1.25rem", borderRadius: "14px", border: "1px solid #e2e8f0" }}>
          <div style={{ background: "#ffffff", padding: "1rem", borderRadius: "12px", display: "inline-block", border: "1px solid #e2e8f0" }}>
            <img 
              src={qrImageApi} 
              alt={`Permanent QR Code for ${store.name}`} 
              width="180" 
              height="180" 
              style={{ display: "block" }} 
            />
          </div>
          <p style={{ fontSize: "0.8rem", color: "#64748b", marginTop: "0.75rem", fontFamily: "monospace" }}>
            /stores/{store.slug}
          </p>
        </div>

        {/* Permanent URL & Action Controls */}
        <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
          <div>
            <label style={{ fontSize: "0.85rem", fontWeight: 700, color: "#334155", display: "block", marginBottom: "0.35rem" }}>
              Permanent Business Link
            </label>
            <div style={{ display: "flex", gap: "0.5rem" }}>
              <input 
                type="text" 
                readOnly 
                value={profileUrl} 
                style={{ 
                  flex: 1, 
                  background: "#f1f5f9", 
                  border: "1px solid #cbd5e1", 
                  borderRadius: "8px", 
                  padding: "0.6rem 0.8rem", 
                  fontSize: "0.85rem", 
                  fontFamily: "monospace",
                  color: "#1e293b"
                }} 
              />
              <button
                type="button"
                onClick={handleCopyLink}
                style={{
                  background: copied ? "#16a34a" : "#2563eb",
                  color: "white",
                  border: "none",
                  padding: "0.6rem 1rem",
                  borderRadius: "8px",
                  fontWeight: 700,
                  fontSize: "0.85rem",
                  cursor: "pointer",
                  whiteSpace: "nowrap",
                  transition: "background 0.2s"
                }}
              >
                {copied ? "✓ Copied!" : "Copy Link"}
              </button>
            </div>
          </div>

          <div style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap" }}>
            <a
              href={qrImageApi}
              download={`Kynisto-Shop-QR-${store.slug}.png`}
              target="_blank"
              rel="noreferrer"
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "0.5rem",
                background: "#0f172a",
                color: "#ffffff",
                padding: "0.65rem 1.1rem",
                borderRadius: "10px",
                fontSize: "0.875rem",
                fontWeight: 700,
                textDecoration: "none"
              }}
            >
              <span>📥</span> Download QR (PNG)
            </a>

            <button
              type="button"
              onClick={() => setShowPrintModal(true)}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "0.5rem",
                background: "#2563eb",
                color: "#ffffff",
                border: "none",
                padding: "0.65rem 1.1rem",
                borderRadius: "10px",
                fontSize: "0.875rem",
                fontWeight: 700,
                cursor: "pointer"
              }}
            >
              <span>🖨️</span> Print Shop Standee
            </button>
          </div>
        </div>
      </div>

      {/* Printable Counter Standee / Poster Modal */}
      {showPrintModal && (
        <div style={{
          position: "fixed",
          inset: 0,
          background: "rgba(15, 23, 42, 0.75)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          zIndex: 99999,
          padding: "1rem",
          backdropFilter: "blur(4px)"
        }}>
          <div style={{
            background: "#ffffff",
            padding: "2.5rem 2rem",
            borderRadius: "24px",
            maxWidth: "440px",
            width: "100%",
            textAlign: "center",
            border: "4px solid #2563eb",
            boxShadow: "0 25px 50px -12px rgba(0,0,0,0.25)"
          }}>
            {store.logoUrl ? (
              <img 
                src={String(store.logoUrl)} 
                alt={store.name} 
                style={{ width: "72px", height: "72px", borderRadius: "50%", objectFit: "cover", margin: "0 auto 0.75rem auto", border: "3px solid #2563eb" }} 
              />
            ) : (
              <div style={{ width: "64px", height: "64px", borderRadius: "50%", background: "#eff6ff", color: "#2563eb", fontSize: "1.75rem", fontWeight: 800, display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 0.75rem auto" }}>
                {store.name.charAt(0)}
              </div>
            )}

            <h2 style={{ fontSize: "1.85rem", fontWeight: 900, color: "#0f172a", margin: 0 }}>
              {store.name}
            </h2>
            <p style={{ color: "#2563eb", fontWeight: 700, marginTop: "0.35rem", textTransform: "uppercase", fontSize: "0.85rem", letterSpacing: "0.05em" }}>
              Scan to view Business Profile, Catalog &amp; Directions
            </p>

            <div style={{
              margin: "1.5rem auto",
              width: "220px",
              height: "220px",
              background: "#ffffff",
              padding: "1rem",
              borderRadius: "16px",
              border: "2px solid #e2e8f0",
              boxShadow: "0 4px 6px -1px rgba(0,0,0,0.05)"
            }}>
              <img src={qrImageApi} alt="Printable Shop QR" width="220" height="220" style={{ display: "block" }} />
            </div>

            {store.address && (
              <p style={{ fontSize: "0.9rem", color: "#475569", margin: "0.5rem 0", fontWeight: 500 }}>
                📍 {store.address}{store.city ? `, ${store.city}` : ""}
              </p>
            )}

            <small style={{ color: "#94a3b8", display: "block", marginTop: "1rem", fontSize: "0.8rem", fontWeight: 600 }}>
              Powered by Kynisto Local Discovery
            </small>

            <div style={{ display: "flex", gap: "0.75rem", marginTop: "1.5rem" }}>
              <button
                type="button"
                onClick={() => window.print()}
                style={{
                  flex: 1,
                  background: "#2563eb",
                  color: "#ffffff",
                  border: "none",
                  padding: "0.85rem",
                  borderRadius: "12px",
                  fontWeight: 700,
                  fontSize: "1rem",
                  cursor: "pointer"
                }}
              >
                🖨️ Print Now
              </button>
              <button
                type="button"
                onClick={() => setShowPrintModal(false)}
                style={{
                  flex: 1,
                  background: "#f1f5f9",
                  color: "#334155",
                  border: "1px solid #cbd5e1",
                  padding: "0.85rem",
                  borderRadius: "12px",
                  fontWeight: 600,
                  fontSize: "1rem",
                  cursor: "pointer"
                }}
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
