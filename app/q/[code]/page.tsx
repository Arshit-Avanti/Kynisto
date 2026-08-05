"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { apiFetch } from "@/lib/client-api";
import { KynistoLogo } from "@/components/brand/KynistoLogo";
import { saveQueueSession, clearQueueSession } from "@/lib/queue-persistence";
import {
  Clock,
  PartyPopper,
  Hospital,
  Smartphone,
  PlayCircle,
  StopCircle,
  Bell,
  Ticket,
  X,
  MapPin,
  ArrowLeft,
  XCircle
} from "lucide-react";

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
    <div style={{ position: "fixed", inset: 0, background: "rgba(15,23,42,0.6)", display: "flex", alignItems: "flex-end", justifyContent: "center", zIndex: 1000, padding: "1rem", backdropFilter: "blur(4px)" }}>
      <div style={{ background: "#ffffff", borderRadius: "24px", padding: "2rem", width: "100%", maxWidth: "420px", boxShadow: "0 25px 50px -12px rgba(0,0,0,0.25)" }}>
        <div style={{ textAlign: "center", marginBottom: "1.75rem" }}>
          <div style={{ display: "inline-flex", padding: "1rem", borderRadius: "full", background: "#fef3c7", color: "#d97706", marginBottom: "1rem" }}>
            <Clock size={36} />
          </div>
          <h3 style={{ fontSize: "1.35rem", fontWeight: 800, color: "#0f172a", margin: "0" }}>How late will you be?</h3>
          <p style={{ color: "#64748b", fontSize: "0.95rem", marginTop: "0.25rem" }}>The clinic will be notified</p>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem", marginBottom: "1.25rem" }}>
          {options.map((min) => (
            <button
              key={min}
              type="button"
              onClick={() => onConfirm(min)}
              style={{ padding: "1.1rem", background: "#f8fafc", border: "2px solid #e2e8f0", borderRadius: "14px", fontWeight: 700, fontSize: "1.05rem", color: "#334155", cursor: "pointer", transition: "all 0.2s" }}
              onMouseOver={(e) => { e.currentTarget.style.borderColor = "#94a3b8"; e.currentTarget.style.background = "#f1f5f9"; }}
              onMouseOut={(e) => { e.currentTarget.style.borderColor = "#e2e8f0"; e.currentTarget.style.background = "#f8fafc"; }}
            >
              {min} min
            </button>
          ))}
        </div>
        <div style={{ display: "flex", gap: "0.5rem", marginBottom: "1.25rem" }}>
          <input
            type="number"
            min="1"
            max="120"
            placeholder="Custom minutes"
            value={custom}
            onChange={(e) => setCustom(e.target.value)}
            style={{ flex: 1, padding: "0.85rem 1rem", borderRadius: "12px", border: "2px solid #e2e8f0", fontSize: "1rem", outline: "none", transition: "border-color 0.2s" }}
            onFocus={(e) => e.target.style.borderColor = "#3b82f6"}
            onBlur={(e) => e.target.style.borderColor = "#e2e8f0"}
          />
          <button
            type="button"
            disabled={!custom || Number(custom) < 1}
            onClick={() => onConfirm(Number(custom))}
            style={{ padding: "0.85rem 1.5rem", background: "#2563eb", color: "#fff", border: "none", borderRadius: "12px", fontWeight: 700, cursor: "pointer", opacity: (!custom || Number(custom) < 1) ? 0.5 : 1 }}
          >
            OK
          </button>
        </div>
        <button type="button" onClick={onClose} style={{ width: "100%", padding: "1rem", background: "transparent", border: "none", fontWeight: 600, color: "#64748b", cursor: "pointer", fontSize: "1rem" }}>
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
  const prevEntryStatus = useRef<string | null>(null);

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
      const returnUrl = encodeURIComponent(`/q/${code}?autoJoin=true`);
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

  // Auto-refresh every 30 seconds
  useEffect(() => {
    const timer = setInterval(() => { void fetchData(); }, 30_000);
    return () => clearInterval(timer);
  }, [fetchData]);

  // Auto-join effect for authenticated QR scans or return-from-login
  useEffect(() => {
    if (!data || autoJoinAttempted.current) return;
    const searchParams = new URLSearchParams(window.location.search);
    const hasAutoJoinParam = searchParams.get("autoJoin") === "true" || searchParams.get("autojoin") === "true";

    if (data.user && data.queueState?.queueAvailable && !data.queueState?.entry) {
      autoJoinAttempted.current = true;
      void handleJoinQueue(data.user);
    } else if (!data.user && hasAutoJoinParam) {
      autoJoinAttempted.current = true;
      const returnUrl = encodeURIComponent(`/q/${code}?autoJoin=true`);
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
        <div style={{ maxWidth: "480px", margin: "3rem auto", background: "#ffffff", padding: "2.5rem", borderRadius: "24px", boxShadow: "0 20px 25px -5px rgba(0,0,0,0.1), 0 10px 10px -5px rgba(0,0,0,0.04)", textAlign: "center" }}>
          <div style={{ display: "inline-flex", padding: "1.25rem", borderRadius: "full", background: "#fef2f2", color: "#ef4444", marginBottom: "1.5rem" }}>
            <Hospital size={48} />
          </div>
          <h2 style={{ fontSize: "1.75rem", fontWeight: 800, color: "#0f172a" }}>Queue Not Found</h2>
          <p style={{ color: "#64748b", margin: "1rem 0 2rem 0", fontSize: "1.05rem" }}>{error || "Invalid or expired healthcare QR code."}</p>
          <Link href="/healthcare" style={{ display: "inline-flex", alignItems: "center", gap: "0.5rem", background: "#2563eb", color: "#ffffff", padding: "1rem 1.75rem", borderRadius: "12px", fontWeight: 700, textDecoration: "none", fontSize: "1.05rem", transition: "background 0.2s" }} onMouseOver={(e) => e.currentTarget.style.background = "#1d4ed8"} onMouseOut={(e) => e.currentTarget.style.background = "#2563eb"}>
            <Hospital size={20} /> Explore Healthcare Providers
          </Link>
        </div>
      </div>
    );
  }

  const { record, queueState, user } = data;
  const isQueueOpen = queueState?.queueAvailable;
  const userEntry = queueState?.entry;
  const isCalled = userEntry?.status === "called";
  const peopleAhead = Math.max(0, (userEntry?.position ?? 1) - 1);

  // Status ring animation values
  const progressPercent = Math.max(5, Math.round(((queueState?.waitingCount ?? 1) - peopleAhead) / (queueState?.waitingCount ?? 1) * 100));
  const dashArray = 283;
  const dashOffset = dashArray - (dashArray * progressPercent) / 100;

  return (
    <div style={{ minHeight: "100vh", background: "linear-gradient(180deg, #f1f5f9 0%, #e2e8f0 100%)", paddingBottom: "3rem" }}>
      {showLateModal && <LateModal onConfirm={handleRunningLate} onClose={() => setShowLateModal(false)} />}

      {/* App download banner */}
      {showAppBanner && (
        <div style={{ background: "linear-gradient(90deg, #1e293b 0%, #0f172a 100%)", color: "#ffffff", padding: "1rem 1.25rem", display: "flex", alignItems: "center", justifyContent: "space-between", gap: "1rem", boxShadow: "0 4px 6px -1px rgba(0,0,0,0.1)" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
            <Smartphone size={24} className="text-blue-400" />
            <span style={{ fontSize: "0.95rem", fontWeight: 500 }}>Faster live updates in the App.</span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
            <a href="/downloads/Kynisto-2.0.0-release.apk" style={{ background: "#3b82f6", color: "#ffffff", padding: "0.5rem 1rem", borderRadius: "8px", fontSize: "0.85rem", fontWeight: 700, textDecoration: "none" }}>Get App</a>
            <button type="button" onClick={() => setShowAppBanner(false)} style={{ background: "none", border: "none", color: "#94a3b8", cursor: "pointer", display: "flex" }}>
              <X size={20} />
            </button>
          </div>
        </div>
      )}

      {/* Header */}
      <header style={{ padding: "1.25rem", display: "flex", alignItems: "center", justifyContent: "space-between", background: "rgba(255,255,255,0.8)", backdropFilter: "blur(12px)", borderBottom: "1px solid rgba(255,255,255,0.4)", position: "sticky", top: 0, zIndex: 10 }}>
        <Link href="/" aria-label="Kynisto Home"><KynistoLogo variant="gradient" /></Link>
        <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
          <Link
            href="/healthcare"
            style={{ display: "inline-flex", alignItems: "center", gap: "0.5rem", background: "#ffffff", color: "#334155", padding: "0.5rem 1rem", borderRadius: "10px", fontWeight: 600, fontSize: "0.85rem", textDecoration: "none", boxShadow: "0 1px 3px rgba(0,0,0,0.1)" }}
          >
            <ArrowLeft size={16} /> Public Site
          </Link>
          <span style={{ background: "#dbeafe", color: "#1e40af", padding: "0.5rem 0.75rem", borderRadius: "10px", fontSize: "0.85rem", fontWeight: 700, display: "inline-flex", alignItems: "center", gap: "0.25rem" }}>
            <Ticket size={16} /> {code}
          </span>
        </div>
      </header>

      <main style={{ maxWidth: "600px", margin: "2rem auto", padding: "0 1rem" }}>
        {/* Provider Info Card */}
        <div style={{ background: "#ffffff", borderRadius: "24px", padding: "2rem", boxShadow: "0 20px 25px -5px rgba(0,0,0,0.05), 0 8px 10px -6px rgba(0,0,0,0.01)", border: "1px solid rgba(255,255,255,0.2)" }}>

          {/* Business header */}
          <div style={{ display: "flex", alignItems: "flex-start", gap: "1.25rem", marginBottom: "1.75rem" }}>
            {/* Logo / Avatar */}
            {record.logoUrl ? (
              <img
                src={record.logoUrl}
                alt={record.storeName}
                style={{ width: "72px", height: "72px", borderRadius: "16px", objectFit: "cover", border: "2px solid #f1f5f9", flexShrink: 0, boxShadow: "0 4px 6px -1px rgba(0,0,0,0.1)" }}
              />
            ) : (
              <div style={{ width: "72px", height: "72px", borderRadius: "16px", background: "linear-gradient(135deg, #3b82f6, #8b5cf6)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "1.75rem", fontWeight: 900, color: "#ffffff", flexShrink: 0, boxShadow: "0 4px 6px -1px rgba(0,0,0,0.1)" }}>
                {record.storeName.charAt(0).toUpperCase()}
              </div>
            )}

            <div style={{ flex: 1, minWidth: 0 }}>
              <span style={{ color: "#3b82f6", fontSize: "0.85rem", fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.05em" }}>
                {record.categoryName || "Healthcare Provider"}
              </span>
              <h1 style={{ fontSize: "1.75rem", fontWeight: 900, color: "#0f172a", marginTop: "0.2rem", lineHeight: 1.1, letterSpacing: "-0.02em" }}>{record.storeName}</h1>
              <p style={{ color: "#64748b", fontSize: "0.95rem", marginTop: "0.4rem", display: "flex", alignItems: "center", gap: "0.35rem" }}>
                <MapPin size={16} /> {record.address}, {record.area}
              </p>
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: "0.35rem", background: isQueueOpen ? "#dcfce7" : "#fee2e2", color: isQueueOpen ? "#15803d" : "#b91c1c", padding: "0.5rem 1rem", borderRadius: "20px", fontSize: "0.85rem", fontWeight: 700, flexShrink: 0 }}>
              {isQueueOpen ? <PlayCircle size={16} /> : <StopCircle size={16} />}
              {isQueueOpen ? "Live" : "Closed"}
            </div>
          </div>

          <div style={{ height: "1px", background: "linear-gradient(90deg, transparent, #e2e8f0, transparent)", margin: "1.75rem 0" }} />

          {/* Queue content */}
          {isQueueOpen ? (
            <div>
              {/* Stats row */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1.25rem", marginBottom: "1.75rem" }}>
                <div style={{ background: "linear-gradient(180deg, #f8fafc 0%, #f1f5f9 100%)", padding: "1.5rem", borderRadius: "16px", textAlign: "center", border: "1px solid #e2e8f0", boxShadow: "inset 0 2px 4px rgba(255,255,255,0.5)" }}>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "0.4rem", color: "#64748b", marginBottom: "0.5rem" }}>
                    <Ticket size={16} />
                    <span style={{ fontSize: "0.85rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em" }}>Current Token</span>
                  </div>
                  <div style={{ fontSize: "2.5rem", fontWeight: 900, color: "#0f172a", lineHeight: 1 }}>
                    #{queueState?.currentTokenNumber ?? 0}
                  </div>
                </div>
                <div style={{ background: "linear-gradient(180deg, #eff6ff 0%, #dbeafe 100%)", padding: "1.5rem", borderRadius: "16px", textAlign: "center", border: "1px solid #bfdbfe", boxShadow: "inset 0 2px 4px rgba(255,255,255,0.5)" }}>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "0.4rem", color: "#1d4ed8", marginBottom: "0.5rem" }}>
                    <Clock size={16} />
                    <span style={{ fontSize: "0.85rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em" }}>Waiting</span>
                  </div>
                  <div style={{ fontSize: "2.5rem", fontWeight: 900, color: "#2563eb", lineHeight: 1 }}>
                    {queueState?.waitingCount ?? 0}
                  </div>
                </div>
              </div>

              {/* User Ticket */}
              {userEntry && (
                <div>
                  {/* Called animation */}
                  {isCalled && (
                    <div style={{ background: "linear-gradient(135deg, #22c55e, #15803d)", color: "#fff", padding: "1.5rem", borderRadius: "16px", textAlign: "center", marginBottom: "1.5rem", animation: "pulse 2s infinite", boxShadow: "0 10px 15px -3px rgba(34,197,94,0.3)" }}>
                      <Bell size={48} style={{ margin: "0 auto 1rem auto" }} />
                      <strong style={{ fontSize: "1.35rem", fontWeight: 800 }}>Your Turn! Please come to the counter.</strong>
                    </div>
                  )}

                  <div style={{ position: "relative", overflow: "hidden", background: "rgba(15, 23, 42, 0.7)", backdropFilter: "blur(20px)", color: "#ffffff", padding: "3rem 2rem", borderRadius: "24px", textAlign: "center", marginBottom: "1.5rem", border: "1px solid rgba(255,255,255,0.1)", boxShadow: "0 0 40px rgba(59, 130, 246, 0.2), inset 0 0 20px rgba(255,255,255,0.05)" }}>
                    <div style={{ position: "absolute", top: "50%", left: "50%", width: "300px", height: "300px", transform: "translate(-50%, -50%)", background: "conic-gradient(from 0deg, transparent 70%, rgba(59,130,246,0.8) 100%)", borderRadius: "50%", animation: "rotateRadar 8s linear infinite", opacity: 0.3, pointerEvents: "none" }} />
                    <div style={{ position: "absolute", top: "50%", left: "50%", width: "290px", height: "290px", transform: "translate(-50%, -50%)", border: "1px solid rgba(59,130,246,0.3)", borderRadius: "50%", pointerEvents: "none" }} />

                    <div style={{ display: "inline-flex", alignItems: "center", gap: "0.5rem", background: "rgba(255,255,255,0.05)", padding: "0.5rem 1rem", borderRadius: "full", fontSize: "0.85rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: "1.5rem", position: "relative", zIndex: 1, border: "1px solid rgba(255,255,255,0.1)", boxShadow: "0 0 10px rgba(255,255,255,0.1)" }}>
                      <Ticket size={16} style={{ color: "#3b82f6" }} /> Your Queue Ticket
                    </div>
                    
                    <div style={{ fontSize: "5rem", fontWeight: 900, lineHeight: 1, color: "#fff", textShadow: "0 0 20px #3b82f6, 0 0 40px #3b82f6", marginBottom: "1rem", animation: "pulseGlow 2s infinite", position: "relative", zIndex: 1 }}>
                      #{userEntry.tokenNumber}
                    </div>

                    {!isCalled && (
                      <>
                        <div style={{ position: "relative", zIndex: 1, background: "rgba(0,0,0,0.3)", padding: "1.5rem", borderRadius: "16px", border: "1px solid rgba(255,255,255,0.05)", display: "flex", alignItems: "center", justifyContent: "center", gap: "1.5rem", marginTop: "2rem", backdropFilter: "blur(10px)" }}>
                          <div style={{ position: "relative", width: "90px", height: "90px", display: "flex", alignItems: "center", justifyContent: "center" }}>
                            <svg width="90" height="90" viewBox="0 0 100 100" style={{ transform: "rotate(-90deg)", position: "absolute" }}>
                              <circle cx="50" cy="50" r="45" fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth="8" />
                              <circle cx="50" cy="50" r="45" fill="none" stroke="#3b82f6" strokeWidth="8" strokeDasharray={dashArray} strokeDashoffset={dashOffset} strokeLinecap="round" style={{ transition: "stroke-dashoffset 1s ease", filter: "drop-shadow(0 0 5px #3b82f6)" }} />
                            </svg>
                            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", textShadow: "0 0 10px rgba(255,255,255,0.5)" }}>
                              <span style={{ fontSize: "1.5rem", fontWeight: 800 }}>{peopleAhead}</span>
                              <span style={{ fontSize: "0.7rem", textTransform: "uppercase", letterSpacing: "0.05em", opacity: 0.8 }}>ahead</span>
                            </div>
                          </div>
                          
                          <div style={{ textAlign: "left" }}>
                            <div style={{ fontSize: "1rem", fontWeight: 600, opacity: 0.9, marginBottom: "0.25rem", textShadow: "0 0 10px rgba(255,255,255,0.3)" }}>
                              {peopleAhead === 0 ? "You're next!" : `${peopleAhead} people ahead of you`}
                            </div>
                            {userEntry.estimatedWaitMinutes > 0 && (
                              <div style={{ display: "flex", alignItems: "center", gap: "0.35rem", fontSize: "1.1rem", fontWeight: 700, color: "#60a5fa", textShadow: "0 0 10px rgba(96,165,250,0.5)" }}>
                                <Clock size={18} /> ~{userEntry.estimatedWaitMinutes} min wait
                              </div>
                            )}
                          </div>
                        </div>
                      </>
                    )}
                  </div>

                  {/* Action messages */}
                  {actionMsg && (
                    <div style={{ padding: "1rem", background: "#f0fdf4", border: "1px solid #bbf7d0", color: "#166534", borderRadius: "12px", fontSize: "0.95rem", fontWeight: 600, marginBottom: "1.25rem", textAlign: "center", display: "flex", alignItems: "center", justifyContent: "center", gap: "0.5rem" }}>
                      <PartyPopper size={18} /> {actionMsg}
                    </div>
                  )}

                  {!isCalled && (
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
                      <button
                        type="button"
                        disabled={actionBusy}
                        onClick={() => setShowLateModal(true)}
                        style={{ padding: "1rem", background: "rgba(255, 237, 213, 0.1)", backdropFilter: "blur(8px)", border: "1px solid rgba(253, 186, 116, 0.3)", borderRadius: "16px", fontWeight: 700, color: "#fdba74", cursor: "pointer", fontSize: "1rem", display: "flex", flexDirection: "column", alignItems: "center", gap: "0.5rem", transition: "all 0.3s ease", boxShadow: "0 0 15px rgba(253, 186, 116, 0.1)" }}
                        onMouseOver={(e) => { e.currentTarget.style.background = "rgba(255, 237, 213, 0.2)"; e.currentTarget.style.borderColor = "rgba(253, 186, 116, 0.6)"; e.currentTarget.style.boxShadow = "0 0 25px rgba(253, 186, 116, 0.3)"; }}
                        onMouseOut={(e) => { e.currentTarget.style.background = "rgba(255, 237, 213, 0.1)"; e.currentTarget.style.borderColor = "rgba(253, 186, 116, 0.3)"; e.currentTarget.style.boxShadow = "0 0 15px rgba(253, 186, 116, 0.1)"; }}
                      >
                        <Clock size={24} style={{ filter: "drop-shadow(0 0 8px rgba(253, 186, 116, 0.5))" }} /> I{"'"}m Running Late
                      </button>
                      <button
                        type="button"
                        disabled={actionBusy}
                        onClick={() => void handleNotComing()}
                        style={{ padding: "1rem", background: "rgba(254, 226, 226, 0.1)", backdropFilter: "blur(8px)", border: "1px solid rgba(252, 165, 165, 0.3)", borderRadius: "16px", fontWeight: 700, color: "#fca5a5", cursor: "pointer", fontSize: "1rem", display: "flex", flexDirection: "column", alignItems: "center", gap: "0.5rem", transition: "all 0.3s ease", boxShadow: "0 0 15px rgba(252, 165, 165, 0.1)" }}
                        onMouseOver={(e) => { e.currentTarget.style.background = "rgba(254, 226, 226, 0.2)"; e.currentTarget.style.borderColor = "rgba(252, 165, 165, 0.6)"; e.currentTarget.style.boxShadow = "0 0 25px rgba(252, 165, 165, 0.3)"; }}
                        onMouseOut={(e) => { e.currentTarget.style.background = "rgba(254, 226, 226, 0.1)"; e.currentTarget.style.borderColor = "rgba(252, 165, 165, 0.3)"; e.currentTarget.style.boxShadow = "0 0 15px rgba(252, 165, 165, 0.1)"; }}
                      >
                        <XCircle size={24} style={{ filter: "drop-shadow(0 0 8px rgba(252, 165, 165, 0.5))" }} /> I{"'"}m Not Coming
                      </button>
                    </div>
                  )}
                </div>
              )}

              {/* Estimated wait for non-joined */}
              {(queueState?.consultationMinutes ?? 0) > 0 && (queueState?.waitingCount ?? 0) > 0 && !userEntry && (
                <div style={{ background: "linear-gradient(90deg, #fff7ed 0%, #ffedd5 100%)", border: "1px solid #fed7aa", borderRadius: "16px", padding: "1.25rem", marginBottom: "1.5rem", display: "flex", alignItems: "center", gap: "1rem" }}>
                  <div style={{ background: "#fdba74", padding: "0.75rem", borderRadius: "12px", color: "#9a3412" }}>
                    <Clock size={24} />
                  </div>
                  <div>
                    <div style={{ fontWeight: 800, color: "#9a3412", fontSize: "1.05rem" }}>Estimated Wait Time</div>
                    <div style={{ fontSize: "1.25rem", fontWeight: 700, color: "#7c2d12" }}>
                      ~{(queueState?.waitingCount ?? 0) * (queueState?.consultationMinutes ?? 15)} minutes
                    </div>
                  </div>
                </div>
              )}

              {/* Success message after joining */}
              {joinMsg && !userEntry && (
                <div style={{ padding: "1rem", background: "#f0fdf4", border: "1px solid #bbf7d0", color: "#166534", borderRadius: "12px", fontSize: "1rem", fontWeight: 700, marginBottom: "1.5rem", textAlign: "center" }}>
                  {joinMsg}
                </div>
              )}

              {/* Join button */}
              {!userEntry && (
                <button
                  type="button"
                  disabled={joining}
                  onClick={() => void handleJoinQueue()}
                  style={{ width: "100%", padding: "1.25rem", background: "linear-gradient(135deg, #2563eb 0%, #1e40af 100%)", color: "#ffffff", border: "none", borderRadius: "16px", fontWeight: 900, fontSize: "1.2rem", cursor: "pointer", boxShadow: "0 10px 15px -3px rgba(37,99,235,0.4)", display: "flex", alignItems: "center", justifyContent: "center", gap: "0.75rem", transition: "transform 0.1s, box-shadow 0.2s" }}
                  onMouseOver={(e) => { e.currentTarget.style.transform = "translateY(-2px)"; e.currentTarget.style.boxShadow = "0 15px 25px -5px rgba(37,99,235,0.5)"; }}
                  onMouseOut={(e) => { e.currentTarget.style.transform = "none"; e.currentTarget.style.boxShadow = "0 10px 15px -3px rgba(37,99,235,0.4)"; }}
                >
                  <Ticket size={24} />
                  <span>{joining ? "Joining Queue…" : user ? "Join Queue Now" : "Continue with Google to Join"}</span>
                </button>
              )}
            </div>
          ) : (
            <div style={{ textAlign: "center", padding: "2.5rem 1rem" }}>
              <div style={{ display: "inline-flex", padding: "1.5rem", borderRadius: "full", background: "#f1f5f9", color: "#64748b", marginBottom: "1.25rem" }}>
                <StopCircle size={48} />
              </div>
              <h3 style={{ fontSize: "1.35rem", fontWeight: 800, color: "#0f172a" }}>Queue Not Active</h3>
              <p style={{ color: "#64748b", fontSize: "1rem", marginTop: "0.5rem" }}>
                This healthcare provider{"'"}s queue is not open right now.
              </p>
            </div>
          )}
        </div>

        {/* Last updated */}
        {lastUpdated && (
          <p style={{ textAlign: "center", color: "#94a3b8", fontSize: "0.85rem", marginTop: "1.5rem", fontWeight: 500 }}>
            Updated {lastUpdated.toLocaleTimeString()} · Auto-refreshes every 30s
          </p>
        )}

        <p style={{ textAlign: "center", color: "#cbd5e1", fontSize: "0.85rem", marginTop: "0.5rem", fontWeight: 600 }}>
          Kynisto Permanent Healthcare Queue • Code: {code}
        </p>
      </main>

      <style>{`
        @keyframes pulse {
          0%, 100% { box-shadow: 0 0 0 0 rgba(34,197,94,0.4); }
          50% { box-shadow: 0 0 0 15px rgba(34,197,94,0); }
        }
        @keyframes rotateRadar {
          0% { transform: translate(-50%, -50%) rotate(0deg); }
          100% { transform: translate(-50%, -50%) rotate(360deg); }
        }
        @keyframes pulseGlow {
          0%, 100% { text-shadow: 0 0 20px #3b82f6, 0 0 40px #3b82f6; opacity: 1; }
          50% { text-shadow: 0 0 10px #3b82f6, 0 0 20px #3b82f6; opacity: 0.8; }
        }
      `}</style>
    </div>
  );
}
