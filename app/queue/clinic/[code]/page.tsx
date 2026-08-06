"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { apiFetch } from "@/lib/client-api";
import { KynistoLogo } from "@/components/brand/KynistoLogo";
import { saveQueueSession, clearQueueSession } from "@/lib/queue-persistence";

interface QueueEntry {
  id: string;
  tokenNumber: number;
  status: string;
  position: number;
  estimatedWaitMinutes: number;
  arrivalStatus?: string;
}

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
    logoUrl?: string | null;
    bannerUrl?: string | null;
    storeId: string;
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
    entry: QueueEntry | null;
  } | null;
  user: {
    id: string;
    email: string;
    name: string;
    role: string;
    phone?: string | null;
  } | null;
}

// ─── Running Late Modal ───────────────────────────────────────────────────────
function LateModal({ onConfirm, onClose }: { onConfirm: (minutes: number) => void; onClose: () => void }) {
  const [custom, setCustom] = useState("");
  const options = [5, 10, 15, 20];
  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", display: "flex", alignItems: "flex-end", justifyContent: "center", zIndex: 1000, padding: "1rem" }}>
      <div style={{ background: "#ffffff", borderRadius: "20px", padding: "1.75rem", width: "100%", maxWidth: "420px", boxShadow: "0 20px 60px rgba(0,0,0,0.2)" }}>
        <div style={{ textAlign: "center", marginBottom: "1.5rem" }}>
          <span style={{ fontSize: "2.5rem", display: "block" }}>⏰</span>
          <h3 style={{ fontSize: "1.25rem", fontWeight: 800, color: "#0f172a", margin: "0.5rem 0 0.25rem" }}>How late will you be?</h3>
          <p style={{ color: "#64748b", fontSize: "0.9rem" }}>The clinic will be notified</p>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem", marginBottom: "1rem" }}>
          {options.map((min) => (
            <button
              key={min}
              type="button"
              onClick={() => onConfirm(min)}
              style={{ padding: "1rem", background: "#eff6ff", border: "2px solid #bfdbfe", borderRadius: "12px", fontWeight: 700, fontSize: "1rem", color: "#1d4ed8", cursor: "pointer" }}
            >
              {min} min
            </button>
          ))}
        </div>
        <div style={{ display: "flex", gap: "0.5rem", marginBottom: "1rem" }}>
          <input
            type="number"
            min="1"
            max="120"
            placeholder="Custom minutes"
            value={custom}
            onChange={(e) => setCustom(e.target.value)}
            style={{ flex: 1, padding: "0.75rem 1rem", borderRadius: "10px", border: "1.5px solid #e2e8f0", fontSize: "0.95rem", outline: "none" }}
          />
          <button
            type="button"
            disabled={!custom || Number(custom) < 1}
            onClick={() => onConfirm(Number(custom))}
            style={{ padding: "0.75rem 1.25rem", background: "#2563eb", color: "#fff", border: "none", borderRadius: "10px", fontWeight: 700, cursor: "pointer" }}
          >
            OK
          </button>
        </div>
        <button type="button" onClick={onClose} style={{ width: "100%", padding: "0.85rem", background: "#f1f5f9", border: "none", borderRadius: "10px", fontWeight: 600, color: "#475569", cursor: "pointer" }}>
          Cancel
        </button>
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function HealthcareQueueQRPage() {
  const params = useParams();
  const router = useRouter();
  const code = ((params?.code as string) || "").toUpperCase();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [data, setData] = useState<QueueResponse | null>(null);
  const [joining, setJoining] = useState(false);
  const [joinMsg, setJoinMsg] = useState("");
  const [showAppBanner, setShowAppBanner] = useState(true);
  const [showLateModal, setShowLateModal] = useState(false);
  const [actionMsg, setActionMsg] = useState("");
  const [actionBusy, setActionBusy] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [wasTicketActive, setWasTicketActive] = useState(false);
  const prevEntryStatus = useRef<string | null>(null);

  // Track if user was actively viewing a ticket during this session
  useEffect(() => {
    const status = data?.queueState?.entry?.status;
    if (status === "waiting" || status === "called") {
      setWasTicketActive(true);
    }
  }, [data]);

  // Request notification permission
  useEffect(() => {
    if (typeof window !== "undefined" && "Notification" in window && Notification.permission === "default") {
      Notification.requestPermission().catch(() => {});
    }
  }, []);

  // Deep link attempt on mobile
  useEffect(() => {
    if (typeof window !== "undefined" && code) {
      const isMobile = /Android|iPhone|iPad/i.test(navigator.userAgent);
      if (isMobile) {
        const intentUrl = `intent://q/${code}#Intent;scheme=kynisto;package=com.kynisto.app;end;`;
        try { window.location.href = intentUrl; } catch { /* ignore */ }
      }
    }
  }, [code]);

  const fetchData = useCallback(async () => {
    if (!code) return;
    try {
      const res = await apiFetch<QueueResponse>(`/api/healthcare/qr/${code}`);
      setData(res);
      setError("");
      setLastUpdated(new Date());

      // Browser notification when called
      const newStatus = res.queueState?.entry?.status;
      if (
        prevEntryStatus.current === "waiting" &&
        newStatus === "called" &&
        typeof window !== "undefined" &&
        "Notification" in window &&
        Notification.permission === "granted"
      ) {
        new Notification("🎉 Your Turn!", {
          body: `Please come to ${res.record?.storeName ?? "the clinic"} counter now!`,
          icon: "/icon.svg",
        });
      }
      prevEntryStatus.current = newStatus ?? null;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to load healthcare queue.");
    } finally {
      setLoading(false);
    }
  }, [code]);

  const autoJoinAttempted = useRef(false);

  const handleJoinQueue = useCallback(async (forcedUser?: QueueResponse["user"]) => {
    const currentUser = forcedUser ?? data?.user;
    if (!currentUser) {
      const returnUrl = encodeURIComponent(`/queue/clinic/${code}?autoJoin=true`);
      router.push(`/login?returnTo=${returnUrl}`);
      return;
    }
    setJoining(true);
    setJoinMsg("");
    try {
      const res = await apiFetch<{ ok: boolean; message: string; alreadyJoined: boolean; queueState?: QueueResponse["queueState"] }>("/api/healthcare/qr/join", {
        method: "POST",
        json: { queueCode: code },
      });
      setJoinMsg(res.message);
      if (typeof navigator !== "undefined" && "vibrate" in navigator) {
        try { navigator.vibrate([100, 50, 100]); } catch { /* ignore */ }
      }
      const refreshed = await apiFetch<QueueResponse>(`/api/healthcare/qr/${code}`);
      setData(refreshed);
      setLastUpdated(new Date());
      // Persist queue session
      if (refreshed.record && refreshed.queueState?.entry) {
        saveQueueSession({
          storeId: refreshed.record.storeId,
          storeName: refreshed.record.storeName,
          tokenNumber: refreshed.queueState.entry.tokenNumber,
          joinedAt: Date.now(),
          queueCode: code,
        });
      }
    } catch (err) {
      setJoinMsg(err instanceof Error ? err.message : "Could not join queue.");
    } finally {
      setJoining(false);
    }
  }, [code, data?.user, router]);

  // Initial load
  useEffect(() => {
    void fetchData();
  }, [fetchData]);

  // Auto-refresh every 3 seconds for instant real-time sync with owner actions
  useEffect(() => {
    const timer = setInterval(() => { void fetchData(); }, 3_000);
    return () => clearInterval(timer);
  }, [fetchData]);

  // Auto-join effect for authenticated QR scans or return-from-login
  useEffect(() => {
    if (!data || autoJoinAttempted.current) return;
    const searchParams = new URLSearchParams(window.location.search);
    const hasAutoJoinParam = searchParams.get("autoJoin") === "true" || searchParams.get("autojoin") === "true";

    const hasActiveEntry = data.queueState?.entry?.status === "waiting" || data.queueState?.entry?.status === "called";

    if (data.user && data.queueState?.queueAvailable && !hasActiveEntry) {
      autoJoinAttempted.current = true;
      void handleJoinQueue(data.user);
    } else if (!data.user && hasAutoJoinParam) {
      autoJoinAttempted.current = true;
      const returnUrl = encodeURIComponent(`/queue/clinic/${code}?autoJoin=true`);
      router.push(`/login?returnTo=${returnUrl}`);
    }
  }, [data, code, handleJoinQueue, router]);

  const handleRunningLate = async (minutes: number) => {
    setShowLateModal(false);
    if (!data?.record?.storeId) return;
    setActionBusy(true);
    setActionMsg("");
    try {
      await apiFetch("/api/healthcare/queue", {
        method: "POST",
        json: { action: "update_arrival", storeId: data.record.storeId, arrivalStatus: "running_late", lateMinutes: minutes },
      });
      setActionMsg(`✓ Clinic notified — you'll be ${minutes} minutes late`);
      await fetchData();
    } catch (err) {
      setActionMsg(err instanceof Error ? err.message : "Could not update arrival status.");
    } finally {
      setActionBusy(false);
    }
  };

  const handleNotComing = async () => {
    if (!data?.record?.storeId) return;
    if (!window.confirm("Are you sure you want to leave the queue? You will lose your spot.")) return;
    setActionBusy(true);
    setActionMsg("");
    try {
      await apiFetch("/api/healthcare/queue", {
        method: "POST",
        json: { action: "leave", storeId: data.record.storeId },
      });
      clearQueueSession();
      setActionMsg("You have been removed from the queue.");
      await fetchData();
    } catch (err) {
      setActionMsg(err instanceof Error ? err.message : "Could not leave queue.");
    } finally {
      setActionBusy(false);
    }
  };

  if (loading) {
    return (
      <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", background: "#f8fafc", gap: "1rem" }}>
        <div className="googleButtonSpinner" style={{ width: "40px", height: "40px" }} />
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
  const rawEntry = queueState?.entry;
  const activeUserEntry = (rawEntry?.status === "waiting" || rawEntry?.status === "called") ? rawEntry : null;
  const userEntry = activeUserEntry;
  const isCalled = userEntry?.status === "called";
  const isCompleted = rawEntry?.status === "completed" && wasTicketActive;

  if (isCompleted && record) {
    return (
      <div style={{ minHeight: "100vh", background: "#0f172a", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "2rem", textAlign: "center", color: "#ffffff", fontFamily: "sans-serif" }}>
        <div style={{ width: "96px", height: "96px", borderRadius: "50%", background: "rgba(34,197,94,0.2)", border: "4px solid #22c55e", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: "1.5rem", boxShadow: "0 0 50px rgba(34,197,94,0.4)" }}>
          <span style={{ fontSize: "3rem" }}>🎉</span>
        </div>
        <h2 style={{ fontSize: "2.25rem", fontWeight: 900, marginBottom: "0.5rem" }}>🎉 Thank You for Participating!</h2>
        <p style={{ color: "#94a3b8", fontSize: "1.1rem", maxWidth: "480px", marginBottom: "2rem", lineHeight: 1.5 }}>
          Your consultation at <strong>{record.storeName}</strong> is completed. We hope you had a smooth live queue experience!
        </p>
        <Link href="/healthcare" style={{ background: "#2563eb", color: "#ffffff", padding: "1rem 2rem", borderRadius: "12px", fontWeight: 800, textDecoration: "none", fontSize: "1.05rem" }}>
          Explore Healthcare Hub
        </Link>
      </div>
    );
  }

  const currentTokenNum = queueState?.currentTokenNumber ?? 0;
  const userTokenNum = userEntry?.tokenNumber ?? 0;
  let peopleAhead = 0;
  if (userEntry && !isCalled && !isCompleted) {
    if (currentTokenNum === 0) {
      peopleAhead = Math.max(0, userTokenNum - 1);
    } else if (userTokenNum > currentTokenNum) {
      peopleAhead = Math.max(0, userTokenNum - currentTokenNum - 1);
    } else {
      peopleAhead = Math.max(0, (userEntry.position ?? 1) - 1);
    }
  }

  return (
    <div style={{ minHeight: "100vh", background: "linear-gradient(180deg, #eff6ff 0%, #f8fafc 100%)", paddingBottom: "3rem" }}>
      {showLateModal && <LateModal onConfirm={handleRunningLate} onClose={() => setShowLateModal(false)} />}

      {/* App download banner */}
      {showAppBanner && (
        <div style={{ background: "linear-gradient(135deg, #1e293b 0%, #0f172a 100%)", color: "#ffffff", padding: "0.85rem 1rem", fontSize: "0.9rem", display: "flex", alignItems: "center", justifyContent: "space-between", gap: "0.75rem", boxShadow: "0 2px 8px rgba(0,0,0,0.1)" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "0.6rem" }}>
            <span style={{ fontSize: "1.3rem" }}>📱</span>
            <span>Enjoy faster live queue updates in the Kynisto App.</span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
            <a href="/downloads/Kynisto-2.0.0-release.apk" style={{ background: "#2563eb", color: "#ffffff", padding: "0.4rem 0.85rem", borderRadius: "6px", fontSize: "0.8rem", fontWeight: 700, textDecoration: "none" }}>Get App</a>
            <button type="button" onClick={() => setShowAppBanner(false)} style={{ background: "none", border: "none", color: "#94a3b8", fontSize: "1.2rem", cursor: "pointer" }}>×</button>
          </div>
        </div>
      )}

      {/* Header with Kynisto logo and Back to Public Site */}
      <header style={{ padding: "1rem 1.25rem", display: "flex", alignItems: "center", justifyContent: "space-between", background: "#ffffff", borderBottom: "1px solid #e2e8f0", flexWrap: "wrap", gap: "0.75rem" }}>
        <Link href="/" aria-label="Kynisto Home"><KynistoLogo variant="gradient" /></Link>
        <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
          <Link
            href="/healthcare"
            style={{ display: "inline-flex", alignItems: "center", gap: "0.4rem", background: "#f1f5f9", color: "#0b1736", padding: "0.45rem 0.85rem", borderRadius: "8px", fontWeight: 700, fontSize: "0.85rem", textDecoration: "none", border: "1px solid #cbd5e1" }}
          >
            ← Back to Public Site
          </Link>
          <span style={{ background: "#dbeafe", color: "#1e40af", padding: "0.35rem 0.75rem", borderRadius: "20px", fontSize: "0.8rem", fontWeight: 700 }}>
            Code: {code}
          </span>
        </div>
      </header>

      <main style={{ maxWidth: "540px", margin: "1.5rem auto", padding: "0 1rem" }}>
        {/* Provider Info Card */}
        <div style={{ background: "#ffffff", borderRadius: "20px", padding: "1.75rem", boxShadow: "0 10px 25px -5px rgba(0,0,0,0.05)", border: "1px solid #e2e8f0" }}>

          {/* Business header with photo */}
          <div style={{ display: "flex", alignItems: "flex-start", gap: "1rem", marginBottom: "1.25rem" }}>
            {/* Logo / Avatar */}
            {record.logoUrl ? (
              <img
                src={record.logoUrl}
                alt={record.storeName}
                style={{ width: "64px", height: "64px", borderRadius: "14px", objectFit: "cover", border: "2px solid #e2e8f0", flexShrink: 0 }}
              />
            ) : (
              <div style={{ width: "64px", height: "64px", borderRadius: "14px", background: "linear-gradient(135deg, #2563eb, #7c3aed)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "1.5rem", fontWeight: 900, color: "#ffffff", flexShrink: 0 }}>
                {record.storeName.charAt(0).toUpperCase()}
              </div>
            )}

            <div style={{ flex: 1, minWidth: 0 }}>
              <span style={{ color: "#2563eb", fontSize: "0.82rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em" }}>
                {record.categoryName || "Healthcare Provider"}
              </span>
              <h1 style={{ fontSize: "1.5rem", fontWeight: 800, color: "#0f172a", marginTop: "0.2rem", lineHeight: 1.2 }}>{record.storeName}</h1>
              <p style={{ color: "#64748b", fontSize: "0.9rem", marginTop: "0.2rem" }}>📍 {record.address}, {record.area}</p>
            </div>

            <span style={{ background: isQueueOpen ? "#dcfce7" : "#fee2e2", color: isQueueOpen ? "#15803d" : "#b91c1c", padding: "0.4rem 0.85rem", borderRadius: "20px", fontSize: "0.78rem", fontWeight: 700, whiteSpace: "nowrap", flexShrink: 0 }}>
              {isQueueOpen ? "● Live" : "○ Closed"}
            </span>
          </div>

          <hr style={{ border: "none", borderTop: "1px dashed #e2e8f0", margin: "1.25rem 0" }} />

          {/* Queue content */}
          {isQueueOpen ? (
            <div>
              {/* Stats row */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem", marginBottom: "1.25rem" }}>
                <div style={{ background: "#f8fafc", padding: "1.1rem", borderRadius: "14px", border: "1px solid #e2e8f0", textAlign: "center" }}>
                  <span style={{ fontSize: "0.78rem", color: "#64748b", fontWeight: 600 }}>Current Token</span>
                  <div style={{ fontSize: "2rem", fontWeight: 900, color: "#0f172a", marginTop: "0.1rem" }}>
                    #{queueState?.currentTokenNumber ?? 0}
                  </div>
                </div>
                <div style={{ background: "#f8fafc", padding: "1.1rem", borderRadius: "14px", border: "1px solid #e2e8f0", textAlign: "center" }}>
                  <span style={{ fontSize: "0.78rem", color: "#64748b", fontWeight: 600 }}>Waiting</span>
                  <div style={{ fontSize: "2rem", fontWeight: 900, color: "#2563eb", marginTop: "0.1rem" }}>
                    {queueState?.waitingCount ?? 0}
                  </div>
                </div>
              </div>

              {/* Estimated wait */}
              {(queueState?.consultationMinutes ?? 0) > 0 && (queueState?.waitingCount ?? 0) > 0 && !userEntry && (
                <div style={{ background: "#fff7ed", border: "1px solid #fed7aa", borderRadius: "12px", padding: "0.85rem 1rem", marginBottom: "1.25rem", display: "flex", alignItems: "center", gap: "0.6rem" }}>
                  <span style={{ fontSize: "1.4rem" }}>⏳</span>
                  <div>
                    <div style={{ fontWeight: 700, color: "#9a3412", fontSize: "0.9rem" }}>Estimated Wait</div>
                    <div style={{ fontSize: "0.85rem", color: "#92400e" }}>
                      ~{(queueState?.waitingCount ?? 0) * (queueState?.consultationMinutes ?? 15)} min
                    </div>
                  </div>
                </div>
              )}

              {/* Action messages */}
              {actionMsg && (
                <div style={{ padding: "0.75rem 1rem", background: "#f0fdf4", border: "1px solid #bbf7d0", color: "#166534", borderRadius: "10px", fontSize: "0.9rem", fontWeight: 600, marginBottom: "0.75rem", textAlign: "center" }}>
                  {actionMsg}
                </div>
              )}

              {/* User Ticket */}
              {userEntry && (
                <div>
                  {/* Called animation */}
                  {isCalled && (
                    <div style={{ background: "linear-gradient(135deg, #16a34a, #15803d)", color: "#fff", padding: "1rem", borderRadius: "14px", textAlign: "center", marginBottom: "1rem", animation: "pulse 2s infinite" }}>
                      <span style={{ fontSize: "2rem", display: "block" }}>🔔</span>
                      <strong style={{ fontSize: "1.1rem" }}>Your Turn! Please come to the counter.</strong>
                    </div>
                  )}

                  <div style={{ background: "linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)", color: "#ffffff", padding: "1.5rem", borderRadius: "16px", textAlign: "center", marginBottom: "1rem", boxShadow: "0 8px 20px -4px rgba(37,99,235,0.4)" }}>
                    <span style={{ fontSize: "0.82rem", textTransform: "uppercase", letterSpacing: "0.05em", opacity: 0.9 }}>Your Queue Ticket</span>
                    <div style={{ fontSize: "2.75rem", fontWeight: 900, margin: "0.3rem 0" }}>#{userEntry.tokenNumber}</div>
                    <div style={{ fontSize: "0.95rem", fontWeight: 600 }}>{peopleAhead === 0 ? "You're next!" : `${peopleAhead} people ahead`}</div>
                    {!isCalled && userEntry.estimatedWaitMinutes > 0 && (
                      <div style={{ fontSize: "0.88rem", opacity: 0.9, marginTop: "0.25rem" }}>⏳ Est. Wait: ~{userEntry.estimatedWaitMinutes} min</div>
                    )}

                    {/* Progress bar */}
                    {!isCalled && (queueState?.waitingCount ?? 0) > 0 && (
                      <div style={{ marginTop: "1rem" }}>
                        <div style={{ background: "rgba(255,255,255,0.2)", borderRadius: "100px", height: "8px", overflow: "hidden" }}>
                          <div style={{ background: "#ffffff", height: "100%", borderRadius: "100px", width: `${Math.max(5, Math.round(((queueState?.waitingCount ?? 1) - peopleAhead) / (queueState?.waitingCount ?? 1) * 100))}%`, transition: "width 0.5s ease" }} />
                        </div>
                        <div style={{ fontSize: "0.75rem", opacity: 0.8, marginTop: "0.35rem" }}>{(queueState?.waitingCount ?? 1) - peopleAhead} of {queueState?.waitingCount} served</div>
                      </div>
                    )}
                  </div>

                  {!isCalled && (
                    <div style={{ display: "flex", gap: "0.75rem", flexDirection: "column" }}>
                      <button
                        type="button"
                        disabled={actionBusy}
                        onClick={() => setShowLateModal(true)}
                        style={{ padding: "0.9rem", background: "#fff7ed", border: "1.5px solid #fed7aa", borderRadius: "12px", fontWeight: 700, color: "#9a3412", cursor: "pointer", fontSize: "0.95rem", display: "flex", alignItems: "center", justifyContent: "center", gap: "0.5rem" }}
                      >
                        <span>⏰</span> I{"'"}m Running Late
                      </button>
                      <button
                        type="button"
                        disabled={actionBusy}
                        onClick={() => void handleNotComing()}
                        style={{ padding: "0.9rem", background: "#fff1f2", border: "1.5px solid #fecdd3", borderRadius: "12px", fontWeight: 700, color: "#be123c", cursor: "pointer", fontSize: "0.95rem", display: "flex", alignItems: "center", justifyContent: "center", gap: "0.5rem" }}
                      >
                        <span>❌</span> I{"'"}m Not Coming
                      </button>
                    </div>
                  )}
                </div>
              )}

              {/* Success message after joining */}
              {joinMsg && !userEntry && (
                <div style={{ padding: "0.85rem 1rem", background: "#f0fdf4", border: "1px solid #bbf7d0", color: "#166534", borderRadius: "12px", fontSize: "0.95rem", fontWeight: 600, marginBottom: "1.25rem", textAlign: "center" }}>
                  ✓ {joinMsg}
                </div>
              )}

              {/* Join button */}
              {!userEntry && (
                <button
                  type="button"
                  disabled={joining}
                  onClick={() => void handleJoinQueue()}
                  style={{ width: "100%", padding: "1.1rem", background: "linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)", color: "#ffffff", border: "none", borderRadius: "14px", fontWeight: 800, fontSize: "1.05rem", cursor: "pointer", boxShadow: "0 8px 20px -4px rgba(37,99,235,0.3)", display: "flex", alignItems: "center", justifyContent: "center", gap: "0.75rem" }}
                >
                  <span style={{ fontSize: "1.3rem" }}>🎟️</span>
                  <span>{joining ? "Joining Queue…" : user ? "Join Queue Now" : "Continue with Google to Join"}</span>
                </button>
              )}
            </div>
          ) : (
            <div style={{ textAlign: "center", padding: "1.5rem 1rem" }}>
              <span style={{ fontSize: "2.5rem", display: "block", marginBottom: "0.75rem" }}>🕒</span>
              <h3 style={{ fontSize: "1.2rem", fontWeight: 700, color: "#0f172a" }}>Queue Not Active</h3>
              <p style={{ color: "#64748b", fontSize: "0.9rem", marginTop: "0.35rem" }}>
                This healthcare provider{"'"}s queue is not open right now.
              </p>
            </div>
          )}
        </div>

        {/* Last updated */}
        {lastUpdated && (
          <p style={{ textAlign: "center", color: "#94a3b8", fontSize: "0.78rem", marginTop: "1rem" }}>
            Updated {lastUpdated.toLocaleTimeString()} · Auto-refreshes every 30s
          </p>
        )}

        <p style={{ textAlign: "center", color: "#cbd5e1", fontSize: "0.78rem", marginTop: "0.5rem" }}>
          Kynisto Permanent Healthcare Queue • Code: {code}
        </p>
      </main>

      <style>{`
        @keyframes pulse {
          0%, 100% { box-shadow: 0 0 0 0 rgba(22,163,74,0.4); }
          50% { box-shadow: 0 0 0 12px rgba(22,163,74,0); }
        }
      `}</style>
    </div>
  );
}
