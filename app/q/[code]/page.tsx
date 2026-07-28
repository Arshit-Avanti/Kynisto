"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { apiFetch } from "@/lib/client-api";
import { KynistoLogo } from "@/components/brand/KynistoLogo";
import { GoogleSignIn } from "@/components/auth/GoogleSignIn";

interface QueueResponse {
  ok: boolean;
  record: {
    queueCode: string;
    storeName: string;
    storeSlug: string;
    address: string;
    area: string;
    city: string;
    phone: string;
    categoryName: string;
    providerType: string | null;
  };
  queueState: {
    status: string;
    queueAvailable: boolean;
    currentTokenNumber: number;
    nextTokenNumber: number;
    dailyPatientCount: number;
    waitingCount: number;
    consultationMinutes: number;
    openingTime: string;
    closingTime: string;
    entry: {
      id: string;
      tokenNumber: number;
      status: string;
      position: number;
      estimatedWaitMinutes: number;
    } | null;
  } | null;
  user: {
    id: string;
    email: string;
    name: string;
    role: string;
  } | null;
}

export default function HealthcareQueueQRPage() {
  const params = useParams();
  const router = useRouter();
  const code = (params?.code as string || "").toUpperCase();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [data, setData] = useState<QueueResponse | null>(null);
  const [joining, setJoining] = useState(false);
  const [joinMsg, setJoinMsg] = useState("");
  const [showAppBanner, setShowAppBanner] = useState(true);

  // 1. Auto-attempt Android App Deep Link on mobile browsers
  useEffect(() => {
    if (typeof window !== "undefined" && code) {
      const isMobile = /Android|iPhone|iPad/i.test(navigator.userAgent);
      if (isMobile) {
        const intentUrl = `intent://q/${code}#Intent;scheme=kynisto;package=com.kynisto.app;end;`;
        try {
          window.location.href = intentUrl;
        } catch {
          // Ignore fallback if app not installed
        }
      }
    }
  }, [code]);

  // 2. Fetch live Queue & Provider info
  useEffect(() => {
    if (!code) return;
    setLoading(true);
    apiFetch<QueueResponse>(`/api/healthcare/qr/${code}`)
      .then((res) => {
        setData(res);
        setLoading(false);
      })
      .catch((err) => {
        setError(err instanceof Error ? err.message : "Unable to load healthcare queue.");
        setLoading(false);
      });
  }, [code]);

  const handleJoinQueue = async () => {
    if (!data?.user) {
      // User not logged in -> redirect to Google Sign-In with return to this queue
      const returnUrl = encodeURIComponent(`/q/${code}`);
      router.push(`/login?returnTo=${returnUrl}`);
      return;
    }

    setJoining(true);
    setJoinMsg("");
    try {
      const res = await apiFetch<{ ok: boolean; message: string; alreadyJoined: boolean }>("/api/healthcare/qr/join", {
        method: "POST",
        json: { queueCode: code },
      });
      setJoinMsg(res.message);
      // Refresh queue state
      const refreshed = await apiFetch<QueueResponse>(`/api/healthcare/qr/${code}`);
      setData(refreshed);
    } catch (err) {
      setJoinMsg(err instanceof Error ? err.message : "Could not join queue.");
    } finally {
      setJoining(false);
    }
  };

  if (loading) {
    return (
      <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", background: "#f8fafc" }}>
        <div className="googleButtonSpinner" style={{ width: "40px", height: "40px", marginBottom: "1rem" }} />
        <p style={{ color: "#64748b", fontWeight: 600 }}>Loading healthcare queue…</p>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div style={{ minHeight: "100vh", background: "#f8fafc", padding: "2rem 1rem" }}>
        <div style={{ maxWidth: "480px", margin: "3rem auto", background: "#ffffff", padding: "2rem", borderRadius: "16px", boxShadow: "0 4px 12px rgba(0,0,0,0.05)", textAlign: "center" }}>
          <span style={{ fontSize: "3rem", display: "block", marginBottom: "1rem" }}>🏥</span>
          <h2 style={{ fontSize: "1.5rem", fontWeight: 800, color: "#0f172a" }}>Queue Not Found</h2>
          <p style={{ color: "#64748b", margin: "0.75rem 0 1.5rem 0" }}>{error || "Invalid or expired healthcare QR code."}</p>
          <Link href="/healthcare" style={{ display: "inline-block", background: "#2563eb", color: "#ffffff", padding: "0.85rem 1.5rem", borderRadius: "10px", fontWeight: 700, textDecoration: "none" }}>
            Explore Healthcare Providers
          </Link>
        </div>
      </div>
    );
  }

  const { record, queueState, user } = data;
  const isQueueOpen = queueState?.queueAvailable;
  const userEntry = queueState?.entry;

  return (
    <div style={{ minHeight: "100vh", background: "linear-gradient(180deg, #eff6ff 0%, #f8fafc 100%)", paddingBottom: "3rem" }}>
      {/* Top Banner for Kynisto App Download (Non-intrusive) */}
      {showAppBanner && (
        <div style={{ background: "linear-gradient(135deg, #1e293b 0%, #0f172a 100%)", color: "#ffffff", padding: "0.85rem 1rem", fontSize: "0.9rem", display: "flex", alignItems: "center", justifyContent: "space-between", gap: "0.75rem", boxShadow: "0 2px 8px rgba(0,0,0,0.1)" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "0.6rem" }}>
            <span style={{ fontSize: "1.3rem" }}>📱</span>
            <span>Enjoy faster live queue updates in the Kynisto App.</span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
            <a href="/downloads/Kynisto-2.0.0-release.apk" style={{ background: "#2563eb", color: "#ffffff", padding: "0.4rem 0.85rem", borderRadius: "6px", fontSize: "0.8rem", fontWeight: 700, textDecoration: "none" }}>
              Get App
            </a>
            <button type="button" onClick={() => setShowAppBanner(false)} style={{ background: "none", border: "none", color: "#94a3b8", fontSize: "1.2rem", cursor: "pointer" }}>×</button>
          </div>
        </div>
      )}

      {/* Header */}
      <header style={{ padding: "1.25rem 1.5rem", display: "flex", alignItems: "center", justifyContent: "space-between", background: "#ffffff", borderBottom: "1px solid #e2e8f0" }}>
        <Link href="/" aria-label="Kynisto Home"><KynistoLogo /></Link>
        <span style={{ background: "#dbeafe", color: "#1e40af", padding: "0.35rem 0.75rem", borderRadius: "20px", fontSize: "0.8rem", fontWeight: 700 }}>
          Queue Code: {code}
        </span>
      </header>

      <main style={{ maxWidth: "540px", margin: "2rem auto", padding: "0 1rem" }}>
        {/* Healthcare Provider Info Card */}
        <div style={{ background: "#ffffff", borderRadius: "20px", padding: "1.75rem", boxShadow: "0 10px 25px -5px rgba(0,0,0,0.05)", border: "1px solid #e2e8f0" }}>
          <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: "1rem" }}>
            <div>
              <span style={{ color: "#2563eb", fontSize: "0.85rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em" }}>
                {record.categoryName || "Healthcare Provider"}
              </span>
              <h1 style={{ fontSize: "1.6rem", fontWeight: 800, color: "#0f172a", marginTop: "0.25rem" }}>{record.storeName}</h1>
              <p style={{ color: "#64748b", fontSize: "0.95rem", marginTop: "0.35rem" }}>📍 {record.address}, {record.area}</p>
            </div>
            <span style={{ background: isQueueOpen ? "#dcfce7" : "#fee2e2", color: isQueueOpen ? "#15803d" : "#b91c1c", padding: "0.4rem 0.85rem", borderRadius: "20px", fontSize: "0.8rem", fontWeight: 700, whiteSpace: "nowrap" }}>
              {isQueueOpen ? "● Live Queue Open" : "○ Queue Closed"}
            </span>
          </div>

          <hr style={{ border: "none", borderTop: "1px dashed #e2e8f0", margin: "1.5rem 0" }} />

          {/* Live Queue Status Metrics */}
          {isQueueOpen ? (
            <div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem", marginBottom: "1.5rem" }}>
                <div style={{ background: "#f8fafc", padding: "1.25rem", borderRadius: "14px", border: "1px solid #e2e8f0", textAlign: "center" }}>
                  <span style={{ fontSize: "0.8rem", color: "#64748b", fontWeight: 600 }}>Current Token</span>
                  <div style={{ fontSize: "2rem", fontWeight: 900, color: "#0f172a", marginTop: "0.2rem" }}>
                    #{queueState?.currentTokenNumber ?? 0}
                  </div>
                </div>
                <div style={{ background: "#f8fafc", padding: "1.25rem", borderRadius: "14px", border: "1px solid #e2e8f0", textAlign: "center" }}>
                  <span style={{ fontSize: "0.8rem", color: "#64748b", fontWeight: 600 }}>Waiting Patients</span>
                  <div style={{ fontSize: "2rem", fontWeight: 900, color: "#2563eb", marginTop: "0.2rem" }}>
                    {queueState?.waitingCount ?? 0}
                  </div>
                </div>
              </div>

              {/* User Position / Ticket state if already joined */}
              {userEntry ? (
                <div style={{ background: "linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)", color: "#ffffff", padding: "1.5rem", borderRadius: "16px", textAlign: "center", marginBottom: "1.5rem", boxShadow: "0 8px 20px -4px rgba(37,99,235,0.4)" }}>
                  <span style={{ fontSize: "0.85rem", textTransform: "uppercase", letterSpacing: "0.05em", opacity: 0.9 }}>Your Queue Ticket</span>
                  <div style={{ fontSize: "2.75rem", fontWeight: 900, margin: "0.3rem 0" }}>#{userEntry.tokenNumber}</div>
                  <div style={{ fontSize: "1.05rem", fontWeight: 600 }}>Position: #{userEntry.position} in line</div>
                  <div style={{ fontSize: "0.9rem", opacity: 0.9, marginTop: "0.3rem" }}>
                    Est. Wait Time: ~{userEntry.estimatedWaitMinutes} mins
                  </div>
                  <p style={{ fontSize: "0.85rem", background: "rgba(255,255,255,0.2)", padding: "0.5rem 1rem", borderRadius: "20px", marginTop: "1rem", display: "inline-block" }}>
                    You are in this queue. We will notify you when your turn arrives!
                  </p>
                </div>
              ) : null}

              {joinMsg && (
                <div style={{ padding: "0.85rem 1rem", background: "#f0fdf4", border: "1px solid #bbf7d0", color: "#166534", borderRadius: "12px", fontSize: "0.95rem", fontWeight: 600, marginBottom: "1.25rem", textAlign: "center" }}>
                  ✓ {joinMsg}
                </div>
              )}

              {/* Join Queue Action Button */}
              {!userEntry && (
                <button
                  type="button"
                  disabled={joining}
                  onClick={handleJoinQueue}
                  style={{
                    width: "100%",
                    padding: "1.1rem",
                    background: "linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)",
                    color: "#ffffff",
                    border: "none",
                    borderRadius: "14px",
                    fontWeight: 800,
                    fontSize: "1.1rem",
                    cursor: "pointer",
                    boxShadow: "0 8px 20px -4px rgba(37,99,235,0.3)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: "0.75rem",
                  }}
                >
                  <span style={{ fontSize: "1.3rem" }}>🎟️</span>
                  <span>{joining ? "Joining Queue…" : user ? "Join Queue Now" : "Continue with Google to Join Queue"}</span>
                </button>
              )}
            </div>
          ) : (
            <div style={{ textAlign: "center", padding: "1.5rem 1rem" }}>
              <span style={{ fontSize: "2.5rem", display: "block", marginBottom: "0.75rem" }}>🕒</span>
              <h3 style={{ fontSize: "1.25rem", fontWeight: 700, color: "#0f172a" }}>Queue Not Active</h3>
              <p style={{ color: "#64748b", fontSize: "0.95rem", marginTop: "0.35rem" }}>
                This healthcare provider doesn't have an active queue right now.
              </p>
            </div>
          )}
        </div>

        {/* Informational Footer */}
        <p style={{ textAlign: "center", color: "#94a3b8", fontSize: "0.85rem", marginTop: "2rem" }}>
          Kynisto Permanent Healthcare Queue System • Code: {code}
        </p>
      </main>
    </div>
  );
}
