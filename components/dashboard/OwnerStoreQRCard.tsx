"use client";

import { useState } from "react";
import { Download, Printer, MapPin, Copy, Check } from "lucide-react";

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
      padding: "2rem",
      borderRadius: "20px",
      background: "#ffffff",
      border: "1px solid #e2e8f0",
      marginTop: "1.5rem",
      boxShadow: "0 10px 25px -5px rgba(15, 23, 42, 0.05)"
    }}>
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", flexWrap: "wrap", gap: "1rem" }}>
        <div>
          <span style={{ color: "#2563eb", fontSize: "0.85rem", fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.06em" }}>
            Official Permanent Business QR Identity
          </span>
          <h3 style={{ fontSize: "1.5rem", fontWeight: 900, color: "#0f172a", marginTop: "0.35rem" }}>
            {store.name} Shop QR Code
          </h3>
          <p style={{ color: "#64748b", fontSize: "0.95rem", marginTop: "0.35rem", maxWidth: "600px" }}>
            Scanning this permanent QR code takes customers directly to your business profile, catalog &amp; directions.
          </p>
        </div>

        <div style={{ background: "linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)", padding: "1rem 1.25rem", borderRadius: "14px", textAlign: "right", border: "1px solid #e2e8f0" }}>
          <span style={{ fontSize: "0.8rem", color: "#64748b", fontWeight: 700, display: "block", textTransform: "uppercase", letterSpacing: "0.05em" }}>Profile Views</span>
          <strong style={{ fontSize: "1.75rem", color: "#0f172a", fontWeight: 900 }}>
            {Number(store.viewCount ?? 0).toLocaleString()}
          </strong>
        </div>
      </div>

      <hr style={{ border: "none", borderTop: "2px dashed #e2e8f0", margin: "1.75rem 0" }} />

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "2rem", alignItems: "center" }}>
        {/* QR Code Preview Box */}
        <div style={{ textAlign: "center", background: "#f8fafc", padding: "1.5rem", borderRadius: "16px", border: "1px solid #e2e8f0" }}>
          <div style={{ background: "#ffffff", padding: "1.25rem", borderRadius: "16px", display: "inline-block", border: "1px solid #e2e8f0", boxShadow: "0 4px 6px -1px rgba(0,0,0,0.05)" }}>
            <img 
              src={qrImageApi} 
              alt={`Permanent QR Code for ${store.name}`} 
              width="200" 
              height="200" 
              style={{ display: "block" }} 
            />
          </div>
          <p style={{ fontSize: "0.85rem", color: "#64748b", marginTop: "1rem", fontFamily: "monospace", fontWeight: 600 }}>
            /stores/{store.slug}
          </p>
        </div>

        {/* Permanent URL & Action Controls */}
        <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
          <div>
            <label style={{ fontSize: "0.9rem", fontWeight: 700, color: "#334155", display: "block", marginBottom: "0.5rem" }}>
              Permanent Business Link
            </label>
            <div style={{ display: "flex", gap: "0.5rem" }}>
              <input 
                type="text" 
                readOnly 
                value={profileUrl} 
                style={{ 
                  flex: 1, 
                  background: "#f8fafc", 
                  border: "2px solid #e2e8f0", 
                  borderRadius: "10px", 
                  padding: "0.75rem 1rem", 
                  fontSize: "0.9rem", 
                  fontFamily: "monospace",
                  color: "#1e293b",
                  outline: "none"
                }} 
                onFocus={(e) => e.target.style.borderColor = "#94a3b8"}
                onBlur={(e) => e.target.style.borderColor = "#e2e8f0"}
              />
              <button
                type="button"
                onClick={handleCopyLink}
                style={{
                  background: copied ? "#16a34a" : "#2563eb",
                  color: "white",
                  border: "none",
                  padding: "0.75rem 1.25rem",
                  borderRadius: "10px",
                  fontWeight: 700,
                  fontSize: "0.9rem",
                  cursor: "pointer",
                  whiteSpace: "nowrap",
                  transition: "background 0.2s",
                  display: "flex",
                  alignItems: "center",
                  gap: "0.4rem"
                }}
              >
                {copied ? <><Check size={16} /> Copied</> : <><Copy size={16} /> Copy Link</>}
              </button>
            </div>
          </div>

          <div style={{ display: "flex", gap: "1rem", flexWrap: "wrap", marginTop: "0.5rem" }}>
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
                padding: "0.85rem 1.25rem",
                borderRadius: "12px",
                fontSize: "0.9rem",
                fontWeight: 700,
                textDecoration: "none",
                transition: "background 0.2s"
              }}
              onMouseOver={(e) => e.currentTarget.style.background = "#1e293b"}
              onMouseOut={(e) => e.currentTarget.style.background = "#0f172a"}
            >
              <Download size={18} /> Download QR (PNG)
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
                padding: "0.85rem 1.25rem",
                borderRadius: "12px",
                fontSize: "0.9rem",
                fontWeight: 700,
                cursor: "pointer",
                transition: "background 0.2s"
              }}
              onMouseOver={(e) => e.currentTarget.style.background = "#1d4ed8"}
              onMouseOut={(e) => e.currentTarget.style.background = "#2563eb"}
            >
              <Printer size={18} /> Print Shop Standee
            </button>
          </div>
        </div>
      </div>

      {/* Printable Counter Standee / Poster Modal */}
      {showPrintModal && (
        <div style={{
          position: "fixed",
          inset: 0,
          background: "rgba(15, 23, 42, 0.8)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          zIndex: 99999,
          padding: "1rem",
          backdropFilter: "blur(8px)"
        }}>
          <div style={{
            background: "#ffffff",
            padding: "3rem 2.5rem",
            borderRadius: "24px",
            maxWidth: "480px",
            width: "100%",
            textAlign: "center",
            border: "8px solid #2563eb",
            boxShadow: "0 25px 50px -12px rgba(0,0,0,0.25)"
          }}>
            {store.logoUrl ? (
              <img 
                src={String(store.logoUrl)} 
                alt={store.name} 
                style={{ width: "80px", height: "80px", borderRadius: "20px", objectFit: "cover", margin: "0 auto 1rem auto", border: "4px solid #f1f5f9" }} 
              />
            ) : (
              <div style={{ width: "80px", height: "80px", borderRadius: "20px", background: "linear-gradient(135deg, #3b82f6, #8b5cf6)", color: "#ffffff", fontSize: "2rem", fontWeight: 900, display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 1rem auto", boxShadow: "0 4px 6px -1px rgba(0,0,0,0.1)" }}>
                {store.name.charAt(0)}
              </div>
            )}

            <h2 style={{ fontSize: "2rem", fontWeight: 900, color: "#0f172a", margin: 0, lineHeight: 1.1 }}>
              {store.name}
            </h2>
            <p style={{ color: "#3b82f6", fontWeight: 800, marginTop: "0.5rem", textTransform: "uppercase", fontSize: "0.9rem", letterSpacing: "0.05em" }}>
              Scan to view Business Profile, Catalog &amp; Directions
            </p>

            <div style={{
              margin: "2rem auto",
              width: "240px",
              height: "240px",
              background: "#ffffff",
              padding: "1rem",
              borderRadius: "20px",
              border: "2px solid #e2e8f0",
              boxShadow: "0 10px 15px -3px rgba(0,0,0,0.1)"
            }}>
              <img src={qrImageApi} alt="Printable Shop QR" width="204" height="204" style={{ display: "block", width: "100%", height: "100%" }} />
            </div>

            {store.address && (
              <p style={{ fontSize: "1rem", color: "#475569", margin: "0.5rem 0", fontWeight: 600, display: "flex", alignItems: "center", justifyContent: "center", gap: "0.4rem" }}>
                <MapPin size={18} /> {store.address}{store.city ? `, ${store.city}` : ""}
              </p>
            )}

            <small style={{ color: "#94a3b8", display: "block", marginTop: "1.5rem", fontSize: "0.85rem", fontWeight: 600 }}>
              Powered by Kynisto Local Discovery
            </small>

            <div style={{ display: "flex", gap: "1rem", marginTop: "2rem" }}>
              <button
                type="button"
                onClick={() => window.print()}
                style={{
                  flex: 1,
                  background: "#2563eb",
                  color: "#ffffff",
                  border: "none",
                  padding: "1rem",
                  borderRadius: "14px",
                  fontWeight: 800,
                  fontSize: "1.05rem",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "0.5rem",
                  transition: "background 0.2s"
                }}
                onMouseOver={(e) => e.currentTarget.style.background = "#1d4ed8"}
                onMouseOut={(e) => e.currentTarget.style.background = "#2563eb"}
              >
                <Printer size={20} /> Print Now
              </button>
              <button
                type="button"
                onClick={() => setShowPrintModal(false)}
                style={{
                  flex: 1,
                  background: "#f1f5f9",
                  color: "#334155",
                  border: "2px solid #e2e8f0",
                  padding: "1rem",
                  borderRadius: "14px",
                  fontWeight: 700,
                  fontSize: "1.05rem",
                  cursor: "pointer",
                  transition: "all 0.2s"
                }}
                onMouseOver={(e) => { e.currentTarget.style.background = "#e2e8f0"; e.currentTarget.style.borderColor = "#cbd5e1"; }}
                onMouseOut={(e) => { e.currentTarget.style.background = "#f1f5f9"; e.currentTarget.style.borderColor = "#e2e8f0"; }}
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
