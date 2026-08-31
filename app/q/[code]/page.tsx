"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { apiFetch } from "@/lib/client-api";
import { KynistoLogo } from "@/components/brand/KynistoLogo";
import { saveQueueSession, clearQueueSession } from "@/lib/queue-persistence";
import { UniversalHealthcareQrScanner } from "@/components/queue/UniversalHealthcareQrScanner";
import {
  Clock,
  PartyPopper,
  Smartphone,
  Bell,
  Ticket,
  X,
  MapPin,
  Phone,
  Mail,
  XCircle,
  QrCode,
  CheckCircle2,
  Calendar,
  Sparkles,
  ExternalLink,
  ShieldCheck,
  AlertTriangle,
  Stethoscope,
  Info,
  Navigation,
  Check,
  Copy,
  Users,
  Radio,
  Zap,
  Volume2,
  VolumeX,
  ArrowUpCircle
} from "lucide-react";

// Web Audio Synthesizer for Real-Time Queue Sound Effects
let _cachedAudioCtx: AudioContext | null = null;
let _lastChimeTime = 0;

function getAudioContext(): AudioContext | null {
  if (typeof window === "undefined") return null;
  try {
    const AudioContextClass =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext: typeof window.AudioContext }).webkitAudioContext;
    if (!AudioContextClass) return null;
    if (!_cachedAudioCtx || _cachedAudioCtx.state === "closed") {
      _cachedAudioCtx = new AudioContextClass();
    }
    if (_cachedAudioCtx.state === "suspended") {
      _cachedAudioCtx.resume().catch(() => {});
    }
    return _cachedAudioCtx;
  } catch {
    return null;
  }
}

// Auto-unlock Web Audio on first user interaction for background step chimes
if (typeof window !== "undefined") {
  const unlockAudio = () => {
    const ctx = getAudioContext();
    if (ctx && ctx.state === "suspended") {
      ctx.resume().catch(() => {});
    }
    window.removeEventListener("pointerdown", unlockAudio);
    window.removeEventListener("touchstart", unlockAudio);
    window.removeEventListener("click", unlockAudio);
    window.removeEventListener("keydown", unlockAudio);
  };
  window.addEventListener("pointerdown", unlockAudio, { passive: true });
  window.addEventListener("touchstart", unlockAudio, { passive: true });
  window.addEventListener("click", unlockAudio, { passive: true });
  window.addEventListener("keydown", unlockAudio, { passive: true });
}

// 1. Upbeat Chime when Patient Successfully Joins Queue (C5 -> G5 Harmonic)
function playQueueJoinedChime() {
  const ctx = getAudioContext();
  if (!ctx) return;
  try {
    const now = ctx.currentTime;
    const osc1 = ctx.createOscillator();
    const gain1 = ctx.createGain();
    osc1.type = "sine";
    osc1.frequency.setValueAtTime(523.25, now);
    gain1.gain.setValueAtTime(0.3, now);
    gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.35);
    osc1.connect(gain1);
    gain1.connect(ctx.destination);
    osc1.start(now);
    osc1.stop(now + 0.35);

    const osc2 = ctx.createOscillator();
    const gain2 = ctx.createGain();
    osc2.type = "sine";
    osc2.frequency.setValueAtTime(783.99, now + 0.15);
    gain2.gain.setValueAtTime(0.35, now + 0.15);
    gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.65);
    osc2.connect(gain2);
    gain2.connect(ctx.destination);
    osc2.start(now + 0.15);
    osc2.stop(now + 0.65);
  } catch { /* ignore */ }
}

// 2. Step-Advancement Chime when Position Moves Closer (e.g. #6 -> #5 in queue) (D5 -> F#5 Ascending)
function playQueueStepChime() {
  const ctx = getAudioContext();
  if (!ctx) return;
  const nowMs = Date.now();
  if (nowMs - _lastChimeTime < 1500) return;
  _lastChimeTime = nowMs;
  try {
    const now = ctx.currentTime;
    const osc1 = ctx.createOscillator();
    const gain1 = ctx.createGain();
    osc1.type = "triangle";
    osc1.frequency.setValueAtTime(587.33, now);
    gain1.gain.setValueAtTime(0.28, now);
    gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.25);
    osc1.connect(gain1);
    gain1.connect(ctx.destination);
    osc1.start(now);
    osc1.stop(now + 0.25);

    const osc2 = ctx.createOscillator();
    const gain2 = ctx.createGain();
    osc2.type = "sine";
    osc2.frequency.setValueAtTime(739.99, now + 0.12);
    gain2.gain.setValueAtTime(0.32, now + 0.12);
    gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.55);
    osc2.connect(gain2);
    gain2.connect(ctx.destination);
    osc2.start(now + 0.12);
    osc2.stop(now + 0.55);
  } catch { /* ignore */ }
}

// 3. Urgent Chime when Patient Turn is Called (#0 / Inside) (E5 -> C5 Alert)
function playTurnArrivalChime() {
  const ctx = getAudioContext();
  if (!ctx) return;
  const nowMs = Date.now();
  if (nowMs - _lastChimeTime < 2500) return;
  _lastChimeTime = nowMs;
  try {
    const now = ctx.currentTime;
    const osc1 = ctx.createOscillator();
    const gain1 = ctx.createGain();
    osc1.type = "sine";
    osc1.frequency.setValueAtTime(659.25, now);
    gain1.gain.setValueAtTime(0.4, now);
    gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.5);
    osc1.connect(gain1);
    gain1.connect(ctx.destination);
    osc1.start(now);
    osc1.stop(now + 0.5);

    const osc2 = ctx.createOscillator();
    const gain2 = ctx.createGain();
    osc2.type = "sine";
    osc2.frequency.setValueAtTime(523.25, now + 0.2);
    gain2.gain.setValueAtTime(0.45, now + 0.2);
    gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.9);
    osc2.connect(gain2);
    gain2.connect(ctx.destination);
    osc2.start(now + 0.2);
    osc2.stop(now + 0.9);
  } catch { /* ignore */ }
}

interface QueueEntry {
  id: string;
  tokenNumber: number;
  status: 'waiting' | 'called' | 'in_consultation' | 'completed' | 'cancelled' | 'left' | 'no_show' | 'expired' | string;
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
    phone: string | null;
    email?: string | null;
    ownerEmail?: string | null;
    whatsapp?: string | null;
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

interface DoctorItem {
  id: string;
  name: string;
  specialization: string | null;
  consultationMinutes: number;
}

interface SlotItem {
  time: string;
  available: boolean;
}

// ─── Running Late Modal ───────────────────────────────────────────────────────
function LateModal({ onConfirm, onClose }: { onConfirm: (minutes: number) => void; onClose: () => void }) {
  const [custom, setCustom] = useState("");
  const options = [5, 10, 15, 20, 30];
  return (
    <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md flex items-end sm:items-center justify-center z-[1000] p-4 animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-700/60 rounded-3xl p-6 w-full max-w-md shadow-2xl text-white">
        <div className="text-center mb-6">
          <div className="inline-flex p-3.5 rounded-2xl bg-amber-500/20 text-amber-400 mb-3 border border-amber-500/30">
            <Clock size={32} />
          </div>
          <h3 className="text-xl font-bold text-white">How late will you be?</h3>
          <p className="text-slate-300 text-sm mt-1">The clinic and reception will keep your spot on hold.</p>
        </div>
        <div className="grid grid-cols-3 gap-2.5 mb-4">
          {options.map((min) => (
            <button
              key={min}
              type="button"
              onClick={() => onConfirm(min)}
              className="py-3 px-2 bg-slate-800 hover:bg-indigo-600 border border-slate-700 hover:border-indigo-400 rounded-xl font-bold text-sm text-slate-100 hover:text-white transition-all cursor-pointer"
            >
              +{min} min
            </button>
          ))}
        </div>
        <div className="flex gap-2 mb-4">
          <input
            type="number"
            min="1"
            max="120"
            placeholder="Custom mins"
            value={custom}
            onChange={(e) => setCustom(e.target.value)}
            className="flex-1 px-4 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-white placeholder-slate-400 text-sm focus:outline-none focus:border-indigo-500"
          />
          <button
            type="button"
            disabled={!custom || Number(custom) < 1}
            onClick={() => onConfirm(Number(custom))}
            className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-bold text-sm transition-all disabled:opacity-50 cursor-pointer"
          >
            Confirm
          </button>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="w-full py-2.5 text-slate-300 hover:text-white font-semibold text-sm transition-colors cursor-pointer"
        >
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
  const rawCode = (params?.code as string) || "";
  const code = rawCode.trim();

  const [activeTab, setActiveTab] = useState<"queue" | "book" | "doctors">("queue");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [data, setData] = useState<QueueResponse | null>(null);
  const [joining, setJoining] = useState(false);
  const [joinMsg, setJoinMsg] = useState("");
  const [isJoinError, setIsJoinError] = useState(false);
  const [showAppBanner, setShowAppBanner] = useState(true);
  const [showLateModal, setShowLateModal] = useState(false);
  const [actionMsg, setActionMsg] = useState("");
  const [actionBusy, setActionBusy] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);
  const [showScanner, setShowScanner] = useState(false);

  // Sound & Live Position Tracking State
  const [isMuted, setIsMuted] = useState(false);
  const [stepAdvanceNotice, setStepAdvanceNotice] = useState<string | null>(null);

  // Strict De-Duplication Refs (Guarantees notifications & chimes play EXACTLY ONCE)
  const notifiedTurnEntriesRef = useRef<Set<string>>(new Set());
  const notifiedPositionsRef = useRef<Map<string, number>>(new Map());
  const prevEntryStatus = useRef<string | null>(null);

  // Appointment Booking State
  const [doctors, setDoctors] = useState<DoctorItem[]>([]);
  const [selectedDoctorId, setSelectedDoctorId] = useState<string>("");
  const [appointmentDate, setAppointmentDate] = useState<string>(() => {
    const d = new Date();
    return d.toISOString().split("T")[0];
  });
  const [slots, setSlots] = useState<SlotItem[]>([]);
  const [selectedTimeSlot, setSelectedTimeSlot] = useState<string>("");
  const [patientNameInput, setPatientNameInput] = useState<string>("");
  const [patientNotesInput, setPatientNotesInput] = useState<string>("");
  const [loadingSlots, setLoadingSlots] = useState<boolean>(false);
  const [bookingSuccess, setBookingSuccess] = useState<string | null>(null);
  const [bookingError, setBookingError] = useState<string | null>(null);
  const [isBooking, setIsBooking] = useState(false);

  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [wasTicketActive, setWasTicketActive] = useState(false);

  // Sound & Position Change Evaluation Helper (Guaranteed 0 repeating notifications)
  const evaluateQueueAudioAndAlerts = useCallback((entry: QueueEntry | null | undefined, storeName: string) => {
    if (!entry || !entry.id) return;
    const entryId = String(entry.id);
    const newStatus = entry.status;
    const newPos = entry.position;

    // Case 1: Turn Called (Doctor ready for patient)
    // GUARANTEE: Triggers EXACTLY ONCE per entryId. Will never repeat on subsequent polls/SSE events.
    if (newStatus === "called") {
      if (!notifiedTurnEntriesRef.current.has(entryId)) {
        notifiedTurnEntriesRef.current.add(entryId);
        if (!isMuted) playTurnArrivalChime();
        if (typeof navigator !== "undefined" && "vibrate" in navigator) {
          try { navigator.vibrate([300, 150, 300, 150, 600]); } catch {}
        }
        if (typeof window !== "undefined" && "Notification" in window && Notification.permission === "granted") {
          try {
            new Notification("🚨 YOUR TURN HAS ARRIVED!", {
              body: `Token #${entry.tokenNumber} is now being called at ${storeName}! Please enter now.`,
              icon: "/icon.svg",
            });
          } catch {}
        }
      }
    }
    // Case 2: Patient Position Advances Closer (e.g. from #6 to #5)
    // GUARANTEE: Triggers ONLY when position strictly decreases.
    else if (newStatus === "waiting" && newPos !== undefined && newPos > 0) {
      const lastRecordedPos = notifiedPositionsRef.current.get(entryId);
      if (lastRecordedPos !== undefined && newPos < lastRecordedPos) {
        if (!isMuted) playQueueStepChime();
        if (typeof navigator !== "undefined" && "vibrate" in navigator) {
          try { navigator.vibrate([60, 40, 60]); } catch {}
        }
        const peopleAhead = Math.max(0, newPos - 1);
        const noticeText = peopleAhead === 0
          ? "⬆️ You are NEXT in line! Please get ready."
          : `⬆️ Moved up in queue! Only ${peopleAhead} ${peopleAhead === 1 ? 'person' : 'people'} ahead now.`;
        setStepAdvanceNotice(noticeText);
        setTimeout(() => setStepAdvanceNotice(null), 5000);
      }
      notifiedPositionsRef.current.set(entryId, newPos);
    }

    prevEntryStatus.current = newStatus ?? null;
  }, [isMuted]);

  // Auto deep link into Kynisto Android App if installed
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
      if (res && res.ok) {
        let currentActiveEntry = res.queueState?.entry;
        setData((prev) => {
          if (!prev) return res;
          const prevEntry = prev.queueState?.entry;
          const isPrevActive = prevEntry && (prevEntry.status === "waiting" || prevEntry.status === "called" || prevEntry.status === "in_consultation");
          const nextEntry = res.queueState?.entry;
          const isNextActive = nextEntry && (nextEntry.status === "waiting" || nextEntry.status === "called" || nextEntry.status === "in_consultation");

          if (isPrevActive && !isNextActive && !res.user && prev.user) {
            currentActiveEntry = prevEntry;
            return {
              ...res,
              user: prev.user,
              queueState: {
                ...res.queueState,
                entry: prevEntry,
              },
            };
          }
          currentActiveEntry = nextEntry ?? null;
          return res;
        });
        setError("");
        setLastUpdated(new Date());

        // Run real-time audio evaluation on the actual resolved active entry
        evaluateQueueAudioAndAlerts(currentActiveEntry, res.record?.storeName ?? "the clinic");
      }
    } catch (err) {
      if (!data) {
        setError(err instanceof Error ? err.message : "Unable to load healthcare queue.");
      }
    } finally {
      setLoading(false);
    }
  }, [code, data, evaluateQueueAudioAndAlerts]);

  // Real-time SSE Stream for sub-second sync with Doctor & Reception actions
  const storeId = data?.record?.storeId;
  useEffect(() => {
    if (!storeId) return;
    let source: EventSource | null = null;
    try {
      source = new EventSource(`/api/healthcare/queue/stream?storeId=${encodeURIComponent(storeId)}`);
      source.addEventListener("queue", (event) => {
        try {
          const payload = JSON.parse((event as MessageEvent).data);
          if (payload?.state) {
            let resolvedEntry = payload.state.entry;
            setData((prev) => {
              if (!prev) return prev;
              const prevEntry = prev.queueState?.entry;
              const nextEntry = payload.state.entry;
              resolvedEntry = nextEntry !== undefined ? (nextEntry ?? prevEntry ?? null) : prevEntry;
              return {
                ...prev,
                queueState: {
                  ...payload.state,
                  entry: resolvedEntry,
                },
              };
            });
            setLastUpdated(new Date());

            // Run real-time audio evaluation on resolvedEntry
            evaluateQueueAudioAndAlerts(resolvedEntry, data?.record?.storeName ?? "the clinic");
          }
        } catch { /* ignore */ }
      });
    } catch { /* fallback to polling */ }
    return () => {
      if (source) source.close();
    };
  }, [storeId, data?.record?.storeName, evaluateQueueAudioAndAlerts]);

  // Load doctors for this clinic
  useEffect(() => {
    if (!storeId) return;
    apiFetch<{ doctors: DoctorItem[] }>(`/api/healthcare/doctors?storeId=${encodeURIComponent(storeId)}`)
      .then((res) => {
        if (res && res.doctors) {
          setDoctors(res.doctors);
        }
      })
      .catch(() => {});
  }, [storeId]);

  // Load available time slots when date or doctor changes
  useEffect(() => {
    if (!storeId || !appointmentDate) return;
    setLoadingSlots(true);
    const doctorParam = selectedDoctorId ? `&doctorId=${encodeURIComponent(selectedDoctorId)}` : "";
    apiFetch<{ slots: SlotItem[] }>(`/api/healthcare/appointments/slots?storeId=${encodeURIComponent(storeId)}&date=${encodeURIComponent(appointmentDate)}${doctorParam}`)
      .then((res) => {
        if (res && res.slots) {
          setSlots(res.slots);
          setSelectedTimeSlot("");
        }
      })
      .catch(() => {
        setSlots([]);
      })
      .finally(() => {
        setLoadingSlots(false);
      });
  }, [storeId, appointmentDate, selectedDoctorId]);

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
    setIsJoinError(false);
    try {
      const res = await apiFetch<{ ok: boolean; message: string; alreadyJoined: boolean; tokenNumber?: number; queueState?: QueueResponse["queueState"]; record?: any }>("/api/healthcare/qr/join", {
        method: "POST",
        json: { queueCode: code },
      });
      setIsJoinError(false);
      setJoinMsg(res.message);

      // Play Upbeat Queue Joined Chime + Haptics
      if (!isMuted) playQueueJoinedChime();
      if (typeof navigator !== "undefined" && "vibrate" in navigator) {
        try { navigator.vibrate([100, 50, 100]); } catch { /* ignore */ }
      }

      if (res && res.ok && res.queueState) {
        setData((prev) => prev ? { ...prev, queueState: res.queueState, record: res.record ?? prev.record } : prev);
        if (res.queueState.entry) {
          notifiedPositionsRef.current.set(String(res.queueState.entry.id), res.queueState.entry.position);
          prevEntryStatus.current = res.queueState.entry.status;
        }
      }

      const refreshed = await apiFetch<QueueResponse>(`/api/healthcare/qr/${code}`).catch(() => null);
      if (refreshed && refreshed.ok) {
        setData(refreshed);
        setLastUpdated(new Date());
        if (refreshed.record && refreshed.queueState?.entry) {
          notifiedPositionsRef.current.set(String(refreshed.queueState.entry.id), refreshed.queueState.entry.position);
          prevEntryStatus.current = refreshed.queueState.entry.status;
          saveQueueSession({
            storeId: refreshed.record.storeId,
            storeName: refreshed.record.storeName,
            tokenNumber: refreshed.queueState.entry.tokenNumber,
            joinedAt: Date.now(),
            queueCode: code,
          });
        }
      }
    } catch (err) {
      setIsJoinError(true);
      setJoinMsg(err instanceof Error ? err.message : "Could not join queue.");
    } finally {
      setJoining(false);
    }
  }, [code, data?.user, isMuted, router]);

  // Initial load
  useEffect(() => {
    void fetchData();
  }, [fetchData]);

  // Auto-refresh every 3 seconds and on visibilitychange for instant real-time sync
  useEffect(() => {
    const timer = setInterval(() => { void fetchData(); }, 3_000);
    const handleVisibility = () => {
      if (typeof document !== "undefined" && !document.hidden) {
        void fetchData();
      }
    };
    if (typeof document !== "undefined") {
      document.addEventListener("visibilitychange", handleVisibility);
    }
    return () => {
      clearInterval(timer);
      if (typeof document !== "undefined") {
        document.removeEventListener("visibilitychange", handleVisibility);
      }
    };
  }, [fetchData]);

  // Auto-join effect ONLY when returning from login with autoJoin param
  useEffect(() => {
    if (!data || autoJoinAttempted.current) return;
    const searchParams = new URLSearchParams(window.location.search);
    const hasAutoJoinParam = searchParams.get("autoJoin") === "true" || searchParams.get("autojoin") === "true";

    const hasActiveEntry = data.queueState?.entry?.status === "waiting" || data.queueState?.entry?.status === "called" || data.queueState?.entry?.status === "in_consultation";

    if (hasAutoJoinParam) {
      if (data.user && data.queueState?.queueAvailable && !hasActiveEntry) {
        autoJoinAttempted.current = true;
        void handleJoinQueue(data.user);
      } else if (!data.user) {
        autoJoinAttempted.current = true;
        const returnUrl = encodeURIComponent(`/q/${code}?autoJoin=true`);
        router.push(`/login?returnTo=${returnUrl}`);
      }
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
        json: {
          action: "update_arrival",
          storeId: data.record.storeId,
          arrivalStatus: "running_late",
          lateMinutes: minutes,
        },
      });
      setActionMsg(`Notified clinic: Running ~${minutes} min late.`);
      void fetchData();
    } catch (err) {
      setActionMsg(err instanceof Error ? err.message : "Failed to update arrival.");
    } finally {
      setActionBusy(false);
    }
  };

  const handleLeaveQueue = async () => {
    if (!confirm("Are you sure you want to leave this queue? Your ticket spot will be released.")) return;
    if (!data?.record?.storeId) return;
    setActionBusy(true);
    try {
      await apiFetch("/api/healthcare/queue", {
        method: "POST",
        json: {
          action: "leave",
          storeId: data.record.storeId,
        },
      });
      clearQueueSession();
      notifiedPositionsRef.current.clear();
      notifiedTurnEntriesRef.current.clear();
      prevEntryStatus.current = null;
      setActionMsg("You have left the queue.");
      void fetchData();
    } catch (err) {
      setActionMsg(err instanceof Error ? err.message : "Failed to leave queue.");
    } finally {
      setActionBusy(false);
    }
  };

  const handleBookAppointment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!data?.record?.storeId) return;
    if (!selectedTimeSlot) {
      setBookingError("Please select a time slot.");
      return;
    }
    if (!data.user) {
      const returnUrl = encodeURIComponent(`/q/${code}`);
      router.push(`/login?returnTo=${returnUrl}`);
      return;
    }
    setIsBooking(true);
    setBookingError(null);
    setBookingSuccess(null);
    try {
      const res = await apiFetch<{ ok: boolean; appointment: any }>("/api/healthcare/appointments", {
        method: "POST",
        json: {
          action: "book",
          storeId: data.record.storeId,
          appointmentDate,
          timeSlot: selectedTimeSlot,
          doctorId: selectedDoctorId || undefined,
          patientName: patientNameInput.trim() || data.user.name || undefined,
          notes: patientNotesInput.trim() || undefined,
        },
      });
      if (res && res.ok) {
        setBookingSuccess(`🎉 Appointment booked for ${appointmentDate} at ${selectedTimeSlot}!`);
        setSelectedTimeSlot("");
        setPatientNotesInput("");
      }
    } catch (err) {
      setBookingError(err instanceof Error ? err.message : "Could not book appointment.");
    } finally {
      setIsBooking(false);
    }
  };

  const copyCodeToClipboard = () => {
    if (typeof navigator !== "undefined" && navigator.clipboard) {
      navigator.clipboard.writeText(code);
      setCopiedCode(true);
      setTimeout(() => setCopiedCode(false), 2000);
    }
  };

  // ─── Loading State ────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="min-h-screen bg-[#060913] text-white flex flex-col items-center justify-center p-6 relative overflow-hidden font-sans">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-indigo-900/30 via-slate-950 to-[#060913]" />
        <div className="relative z-10 flex flex-col items-center gap-4">
          <div className="w-16 h-16 rounded-3xl bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center animate-pulse">
            <Radio className="w-8 h-8 text-indigo-400 animate-spin" />
          </div>
          <h2 className="text-xl font-bold text-slate-100">Connecting to Live Clinic Queue...</h2>
          <p className="text-slate-300 text-sm">Syncing real-time tokens & doctor status</p>
        </div>
      </div>
    );
  }

  // ─── Error State ──────────────────────────────────────────────────────────
  if (error || !data) {
    return (
      <div className="min-h-screen bg-[#060913] text-white flex flex-col items-center justify-center p-6 relative font-sans">
        <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-8 max-w-md w-full text-center shadow-2xl backdrop-blur-xl">
          <div className="w-16 h-16 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-400 flex items-center justify-center mx-auto mb-4">
            <XCircle size={36} />
          </div>
          <h2 className="text-2xl font-bold text-white mb-2">Clinic Code Not Found</h2>
          <p className="text-slate-300 text-sm mb-6 leading-relaxed">
            {error || "We could not find an active healthcare queue matching this QR code. Please check the code or scan again."}
          </p>
          <div className="flex flex-col gap-3">
            <button
              onClick={() => setShowScanner(true)}
              className="w-full py-3 px-4 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-bold flex items-center justify-center gap-2 transition-all shadow-lg shadow-indigo-600/20 cursor-pointer"
            >
              <QrCode size={18} /> Scan Universal QR Code
            </button>
            <Link
              href="/healthcare"
              className="w-full py-3 px-4 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl font-bold transition-all text-center"
            >
              Browse All Clinics & Hubs
            </Link>
          </div>
        </div>

        {showScanner && (
          <UniversalHealthcareQrScanner
            onClose={() => setShowScanner(false)}
            onSuccess={() => {
              setShowScanner(false);
              void fetchData();
            }}
          />
        )}
      </div>
    );
  }

  const { record, queueState } = data;
  const isQueueOpen = Boolean(queueState?.queueAvailable);
  const rawEntry = queueState?.entry;
  const activeUserEntry = (rawEntry?.status === "waiting" || rawEntry?.status === "called" || rawEntry?.status === "in_consultation") ? rawEntry : null;
  const userEntry = activeUserEntry;
  const isCalled = userEntry?.status === "called";
  const isInConsultation = userEntry?.status === "in_consultation";
  const isCompleted = (rawEntry?.status === "completed" && wasTicketActive) || rawEntry?.status === "completed";

  // People ahead calculation (actual position minus 1)
  const peopleAhead = Math.max(0, (userEntry?.position ?? 1) - 1);

  // Clinic contact fields (NO fake / dummy placeholders)
  const clinicPhone = record.phone?.trim() || null;
  const clinicEmail = (record.email?.trim() || record.ownerEmail?.trim()) || null;
  const clinicHours = `${queueState?.openingTime || "09:00"} - ${queueState?.closingTime || "21:00"}`;

  return (
    <div className="min-h-screen bg-[#060913] text-slate-100 flex flex-col font-sans selection:bg-indigo-500 selection:text-white relative overflow-x-hidden">
      {/* Ambient background glows */}
      <div className="fixed top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-indigo-600/15 rounded-full blur-[140px] pointer-events-none -z-10" />
      <div className="fixed top-1/3 right-[-200px] w-[500px] h-[500px] bg-cyan-600/10 rounded-full blur-[160px] pointer-events-none -z-10" />

      {/* Top Banner for Mobile App Download */}
      {showAppBanner && (
        <div className="bg-gradient-to-r from-indigo-950 via-slate-900 to-indigo-950 border-b border-indigo-500/20 px-4 py-2.5 text-xs text-slate-200 flex items-center justify-between shadow-inner">
          <div className="flex items-center gap-2 truncate max-w-[80%]">
            <Smartphone className="w-4 h-4 text-indigo-400 flex-shrink-0" />
            <span className="truncate">Faster live token updates, audio alerts & directions in Kynisto App.</span>
          </div>
          <div className="flex items-center gap-3 flex-shrink-0">
            <a
              href="/downloads/Kynisto-2.0.0-release.apk"
              className="font-bold text-indigo-300 hover:text-white underline"
            >
              Get App
            </a>
            <button
              onClick={() => setShowAppBanner(false)}
              className="text-slate-400 hover:text-white p-0.5 rounded cursor-pointer"
            >
              <X size={14} />
            </button>
          </div>
        </div>
      )}

      {/* Floating Navigation Header */}
      <header className="sticky top-0 z-40 backdrop-blur-xl bg-[#060913]/90 border-b border-white/[0.1] px-4 sm:px-8 py-3.5 shadow-md">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <Link href="/" className="flex items-center group">
            <KynistoLogo variant="light" size="sm" />
          </Link>

          <div className="flex items-center gap-2 sm:gap-3">
            {/* Audio Mute/Unmute Toggle */}
            <button
              onClick={() => setIsMuted((prev) => !prev)}
              title={isMuted ? "Unmute Queue Sounds" : "Mute Queue Sounds"}
              className={`flex items-center gap-1.5 px-3 py-1 rounded-full border text-xs font-bold transition-all cursor-pointer ${
                isMuted
                  ? "bg-slate-800/80 border-slate-700 text-slate-400 hover:text-slate-200"
                  : "bg-indigo-600/20 border-indigo-500/40 text-indigo-300 hover:bg-indigo-600/30"
              }`}
            >
              {isMuted ? <VolumeX size={13} /> : <Volume2 size={13} className="text-cyan-400 animate-pulse" />}
              <span className="hidden sm:inline">{isMuted ? "Muted" : "Sound On"}</span>
            </button>

            {/* Live / Closed Indicator Pill */}
            {isQueueOpen ? (
              <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-xs font-bold tracking-wide shadow-sm shadow-emerald-500/20">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
                </span>
                LIVE OPD
              </div>
            ) : (
              <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-rose-500/20 border border-rose-500/40 text-rose-300 text-xs font-bold tracking-wide">
                <span className="h-2 w-2 rounded-full bg-rose-500" />
                OPD CLOSED
              </div>
            )}

            {/* Code Copy Chip */}
            <button
              onClick={copyCodeToClipboard}
              title="Click to copy queue code"
              className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 text-xs font-bold transition-all cursor-pointer"
            >
              <Ticket size={13} className="text-indigo-400" />
              <span>#{code}</span>
              {copiedCode ? <Check size={13} className="text-emerald-400" /> : <Copy size={12} className="text-slate-400" />}
            </button>

            {/* Link to Public Healthcare */}
            <Link
              href="/healthcare"
              className="hidden sm:flex items-center gap-1 px-3 py-1 rounded-full bg-slate-800/80 hover:bg-slate-700 border border-slate-700 text-slate-200 text-xs font-bold transition-all"
            >
              Public Hub <ExternalLink size={12} />
            </Link>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 max-w-4xl w-full mx-auto px-4 sm:px-6 py-6 space-y-6">
        
        {/* ─── Position Advancement Toast Alert ─────────────────────────────── */}
        {stepAdvanceNotice && (
          <div className="p-4 rounded-2xl bg-gradient-to-r from-emerald-950/95 via-slate-900 to-indigo-950/95 border-2 border-emerald-400/80 text-white text-sm font-extrabold flex items-center justify-between shadow-2xl shadow-emerald-500/30 animate-in slide-in-from-top-4 duration-300">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-emerald-500/20 border border-emerald-400/40 text-emerald-300 flex items-center justify-center flex-shrink-0">
                <ArrowUpCircle size={22} className="animate-bounce" />
              </div>
              <div>
                <div className="text-emerald-300 text-xs uppercase tracking-wider font-black">Queue Update</div>
                <div className="text-sm font-bold text-white">{stepAdvanceNotice}</div>
              </div>
            </div>
            <button
              onClick={() => setStepAdvanceNotice(null)}
              className="text-slate-400 hover:text-white p-1 rounded-lg cursor-pointer"
            >
              <X size={16} />
            </button>
          </div>
        )}

        {/* ─── Hero Clinic Trust Card ────────────────────────────────────────── */}
        <section className="relative overflow-hidden rounded-3xl bg-slate-900/80 border border-white/10 p-6 sm:p-8 backdrop-blur-2xl shadow-2xl">
          <div className="absolute top-0 right-0 w-80 h-80 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
          
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-5 relative z-10">
            {/* Clinic Avatar / Initial */}
            <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-gradient-to-br from-indigo-600 to-blue-700 border-2 border-indigo-400/40 flex items-center justify-center text-white font-black text-2xl sm:text-3xl shadow-lg shadow-indigo-600/30 flex-shrink-0">
              {record.logoUrl ? (
                <img src={record.logoUrl} alt={record.storeName} className="w-full h-full object-cover rounded-2xl" />
              ) : (
                record.storeName.charAt(0).toUpperCase()
              )}
            </div>

            {/* Clinic Title & Identity */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap mb-1.5">
                <span className="px-2.5 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 text-[11px] font-extrabold uppercase tracking-wider border border-indigo-500/30">
                  {record.categoryName || "Clinics & Doctors"}
                </span>
                <span className="flex items-center gap-1 text-[11px] font-semibold text-emerald-300 bg-emerald-950/80 px-2 py-0.5 rounded-full border border-emerald-500/40">
                  <ShieldCheck size={13} /> Verified Facility
                </span>
                <span className={`flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full border ${
                  isQueueOpen
                    ? "bg-emerald-950/80 text-emerald-300 border-emerald-500/40"
                    : "bg-rose-950/80 text-rose-300 border-rose-500/40"
                }`}>
                  {isQueueOpen ? "🟢 Live OPD Active" : "🔴 Queue Closed for Today"}
                </span>
              </div>

              {/* Full Clinic Title (No Truncation) */}
              <h1 className="text-xl sm:text-2xl md:text-3xl font-extrabold text-white tracking-tight leading-snug break-words">
                {record.storeName}
              </h1>

              {/* Address, Phone, & Hours */}
              <div className="flex flex-wrap items-center gap-y-1 gap-x-4 mt-2 text-xs sm:text-sm text-slate-200">
                <div className="flex items-center gap-1 text-slate-200">
                  <MapPin size={14} className="text-indigo-400 flex-shrink-0" />
                  <span>{record.address || record.city || "DLF Ankur Vihar"}</span>
                </div>
                {clinicPhone ? (
                  <a href={`tel:${clinicPhone}`} className="flex items-center gap-1 text-indigo-300 hover:text-white font-semibold">
                    <Phone size={13} />
                    <span>{clinicPhone}</span>
                  </a>
                ) : (
                  <div className="flex items-center gap-1 text-slate-400">
                    <Phone size={13} />
                    <span>No number provided</span>
                  </div>
                )}
                <div className="flex items-center gap-1 text-slate-200">
                  <Clock size={13} className="text-cyan-400 flex-shrink-0" />
                  <span className="font-semibold">{clinicHours}</span>
                </div>
              </div>
            </div>

            {/* Quick Action Triggers */}
            <div className="flex sm:flex-col gap-2 w-full sm:w-auto mt-2 sm:mt-0">
              <a
                href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${record.storeName} ${record.address}`)}`}
                target="_blank"
                rel="noreferrer"
                className="flex-1 sm:flex-initial py-2 px-3.5 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-100 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer"
              >
                <Navigation size={13} className="text-indigo-400" /> Directions
              </a>
              {clinicPhone ? (
                <a
                  href={`tel:${clinicPhone}`}
                  className="flex-1 sm:flex-initial py-2 px-3.5 bg-indigo-600/30 hover:bg-indigo-600/50 border border-indigo-500/50 text-indigo-200 hover:text-white rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer"
                >
                  <Phone size={13} /> Call Reception
                </a>
              ) : null}
            </div>
          </div>
        </section>

        {/* ─── Interactive Navigation Tabs (High Contrast) ──────────────────── */}
        <div className="flex items-center p-1.5 bg-slate-900 border border-white/10 rounded-2xl backdrop-blur-xl gap-1">
          <button
            onClick={() => setActiveTab("queue")}
            className={`flex-1 py-3 px-3 rounded-xl font-bold text-xs sm:text-sm flex items-center justify-center gap-2 transition-all cursor-pointer ${
              activeTab === "queue"
                ? "bg-indigo-600 text-white shadow-lg shadow-indigo-600/40 border border-indigo-400/50"
                : "bg-slate-800/80 hover:bg-slate-700 text-slate-100 hover:text-white border border-slate-700"
            }`}
          >
            <Zap size={16} className={activeTab === "queue" ? "text-white" : "text-indigo-400"} />
            <span>Live Token & Radar</span>
            {userEntry && (
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            )}
          </button>

          <button
            onClick={() => setActiveTab("book")}
            className={`flex-1 py-3 px-3 rounded-xl font-bold text-xs sm:text-sm flex items-center justify-center gap-2 transition-all cursor-pointer ${
              activeTab === "book"
                ? "bg-indigo-600 text-white shadow-lg shadow-indigo-600/40 border border-indigo-400/50"
                : "bg-slate-800/80 hover:bg-slate-700 text-slate-100 hover:text-white border border-slate-700"
            }`}
          >
            <Calendar size={16} className={activeTab === "book" ? "text-white" : "text-indigo-400"} />
            <span>Book Appointment</span>
          </button>

          <button
            onClick={() => setActiveTab("doctors")}
            className={`flex-1 py-3 px-3 rounded-xl font-bold text-xs sm:text-sm flex items-center justify-center gap-2 transition-all cursor-pointer ${
              activeTab === "doctors"
                ? "bg-indigo-600 text-white shadow-lg shadow-indigo-600/40 border border-indigo-400/50"
                : "bg-slate-800/80 hover:bg-slate-700 text-slate-100 hover:text-white border border-slate-700"
            }`}
          >
            <Stethoscope size={16} className={activeTab === "doctors" ? "text-white" : "text-indigo-400"} />
            <span>Doctors & Info</span>
          </button>
        </div>

        {/* ─── TAB 1: LIVE QUEUE EXPERIENCE ──────────────────────────────────── */}
        {activeTab === "queue" && (
          <div className="space-y-6 animate-in fade-in duration-300">
            
            {/* Bento Grid Stats (3 Cards) */}
            <div className="grid grid-cols-3 gap-3 sm:gap-4">
              {/* Card 1: Currently Serving */}
              <div className="bg-slate-900/80 border border-white/10 rounded-2xl p-4 sm:p-5 text-center relative overflow-hidden backdrop-blur-xl group hover:border-indigo-500/50 transition-all">
                <div className="flex items-center justify-center gap-1.5 text-[11px] sm:text-xs font-bold uppercase tracking-wider text-slate-300 mb-1">
                  <Volume2 size={14} className="text-indigo-400" /> Now Serving
                </div>
                <div className="text-2xl sm:text-4xl font-black text-white tracking-tight my-1">
                  #{queueState?.currentTokenNumber ?? 0}
                </div>
                <div className="text-[11px] text-slate-300 font-medium">Doctor Desk</div>
              </div>

              {/* Card 2: Waiting Count */}
              <div className="bg-slate-900/80 border border-white/10 rounded-2xl p-4 sm:p-5 text-center relative overflow-hidden backdrop-blur-xl group hover:border-cyan-500/50 transition-all">
                <div className="flex items-center justify-center gap-1.5 text-[11px] sm:text-xs font-bold uppercase tracking-wider text-slate-300 mb-1">
                  <Users size={14} className="text-cyan-400" /> Waiting List
                </div>
                <div className="text-2xl sm:text-4xl font-black text-cyan-400 tracking-tight my-1">
                  {queueState?.waitingCount ?? 0}
                </div>
                <div className="text-[11px] text-slate-300 font-medium">Patients in Line</div>
              </div>

              {/* Card 3: Est. Consultation Pacing */}
              <div className="bg-slate-900/80 border border-white/10 rounded-2xl p-4 sm:p-5 text-center relative overflow-hidden backdrop-blur-xl group hover:border-emerald-500/50 transition-all">
                <div className="flex items-center justify-center gap-1.5 text-[11px] sm:text-xs font-bold uppercase tracking-wider text-slate-300 mb-1">
                  <Clock size={14} className="text-emerald-400" /> Est. Pacing
                </div>
                <div className="text-2xl sm:text-4xl font-black text-emerald-400 tracking-tight my-1">
                  ~{queueState?.consultationMinutes ?? 15}<span className="text-xs sm:text-sm font-normal text-slate-300 ml-1">min</span>
                </div>
                <div className="text-[11px] text-slate-300 font-medium">Per Patient</div>
              </div>
            </div>

            {/* Notification / Feedback Banner */}
            {actionMsg && (
              <div className="p-3.5 rounded-2xl bg-indigo-950/90 border border-indigo-500/50 text-indigo-200 text-xs sm:text-sm font-bold flex items-center justify-between">
                <span>{actionMsg}</span>
                <button onClick={() => setActionMsg("")} className="text-slate-300 hover:text-white cursor-pointer">
                  <X size={16} />
                </button>
              </div>
            )}

            {/* ─── CASE A: User has an Active Live Ticket ──────────────────── */}
            {userEntry ? (
              <div className="space-y-4">
                {/* Holographic Active Ticket Card */}
                <div className={`relative overflow-hidden rounded-3xl p-6 sm:p-8 text-center transition-all ${
                  isCalled
                    ? "bg-gradient-to-b from-emerald-950 via-slate-900 to-slate-950 border-2 border-emerald-500 shadow-2xl shadow-emerald-500/40 animate-pulse"
                    : isInConsultation
                    ? "bg-gradient-to-b from-blue-950 via-slate-900 to-slate-950 border-2 border-blue-500 shadow-2xl shadow-blue-500/30"
                    : "bg-gradient-to-b from-indigo-950 via-slate-900 to-slate-950 border border-indigo-500/50 shadow-2xl"
                }`}>
                  {/* Glowing Radar Background Badge & Sound Status */}
                  <div className="flex items-center justify-between gap-2 mb-3">
                    <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/10 backdrop-blur-md text-xs font-black uppercase tracking-widest text-white border border-white/20">
                      <Ticket size={15} className="text-indigo-400" /> Your Live Queue Ticket
                    </div>
                    
                    <button
                      type="button"
                      onClick={() => setIsMuted((prev) => !prev)}
                      className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-800/80 hover:bg-slate-700 border border-slate-700 text-slate-200 text-xs font-bold transition-all cursor-pointer"
                    >
                      {isMuted ? <VolumeX size={13} className="text-slate-400" /> : <Volume2 size={13} className="text-cyan-400 animate-pulse" />}
                      <span>{isMuted ? "Unmute" : "Sound On"}</span>
                    </button>
                  </div>

                  {/* Giant Token Number */}
                  <div className="text-5xl sm:text-7xl font-black text-white tracking-tight my-2 drop-shadow-md">
                    #{userEntry.tokenNumber}
                  </div>

                  {/* Status Headline */}
                  {isCalled ? (
                    <div className="space-y-1 mb-4">
                      <div className="text-xl sm:text-2xl font-black text-emerald-400 tracking-wide">
                        🚨 YOUR TURN! PLEASE ENTER NOW
                      </div>
                      <p className="text-slate-200 text-xs sm:text-sm font-medium">
                        Please proceed to the doctor consultation room or reception counter immediately.
                      </p>
                    </div>
                  ) : isInConsultation ? (
                    <div className="space-y-1 mb-4">
                      <div className="text-xl sm:text-2xl font-black text-blue-400">
                        👨‍⚕️ Currently With Doctor
                      </div>
                      <p className="text-slate-200 text-xs sm:text-sm font-medium">
                        Your consultation is in progress.
                      </p>
                    </div>
                  ) : (
                    /* Circular Radar Counter */
                    <div className="my-6 flex flex-col sm:flex-row items-center justify-center gap-6">
                      <div className="relative w-28 h-28 flex items-center justify-center">
                        <div className="absolute inset-0 rounded-full border-4 border-indigo-500/30" />
                        <div className="absolute inset-0 rounded-full border-4 border-indigo-400 border-t-transparent animate-spin" style={{ animationDuration: "3s" }} />
                        <div className="flex flex-col items-center">
                          <span className="text-3xl font-black text-white">{peopleAhead}</span>
                          <span className="text-[10px] font-bold text-slate-300 uppercase tracking-wider">Ahead</span>
                        </div>
                      </div>

                      <div className="text-left space-y-1.5 text-center sm:text-left">
                        <div className="text-lg font-bold text-white">
                          {peopleAhead === 0 ? "You're next in line!" : peopleAhead === 1 ? "1 person ahead of you" : `${peopleAhead} people ahead of you`}
                        </div>
                        {userEntry.estimatedWaitMinutes > 0 && (
                          <div className="flex items-center justify-center sm:justify-start gap-1.5 text-base font-bold text-cyan-400">
                            <Clock size={16} /> ~{userEntry.estimatedWaitMinutes} min estimated wait
                          </div>
                        )}
                        <div className="text-xs text-slate-300">
                          Status: <span className="text-emerald-400 font-bold uppercase">{userEntry.arrivalStatus || "Arrived"}</span>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Progress Bar */}
                  {!isCalled && !isInConsultation && (
                    <div className="max-w-md mx-auto my-4">
                      <div className="h-2.5 bg-slate-800 rounded-full overflow-hidden border border-slate-700">
                        <div
                          className="h-full bg-gradient-to-r from-indigo-500 to-cyan-400 transition-all duration-500 rounded-full"
                          style={{
                            width: `${Math.min(100, Math.max(10, 100 - (peopleAhead * 25)))}%`,
                          }}
                        />
                      </div>
                    </div>
                  )}

                  {/* Action Buttons */}
                  <div className="flex flex-wrap items-center justify-center gap-3 pt-4 border-t border-white/10 mt-6">
                    <button
                      onClick={() => setShowLateModal(true)}
                      disabled={actionBusy}
                      className="py-2.5 px-4 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-100 rounded-xl font-bold text-xs sm:text-sm flex items-center gap-2 transition-all disabled:opacity-50 cursor-pointer"
                    >
                      <Clock size={15} className="text-amber-400" /> I&apos;m Running Late
                    </button>

                    <button
                      onClick={handleLeaveQueue}
                      disabled={actionBusy}
                      className="py-2.5 px-4 bg-rose-500/20 hover:bg-rose-500/30 border border-rose-500/40 text-rose-300 rounded-xl font-bold text-xs sm:text-sm flex items-center gap-2 transition-all disabled:opacity-50 cursor-pointer"
                    >
                      <XCircle size={15} /> Leave Queue
                    </button>
                  </div>
                </div>
              </div>
            ) : isCompleted ? (
              /* ─── CASE B: Consultation Finished ───────────────────────── */
              <div className="rounded-3xl bg-slate-900/80 border border-emerald-500/30 p-8 text-center backdrop-blur-xl shadow-2xl">
                <div className="w-20 h-20 rounded-full bg-emerald-500/20 border-2 border-emerald-400 text-emerald-400 flex items-center justify-center mx-auto mb-4 shadow-lg shadow-emerald-500/30">
                  <PartyPopper size={40} />
                </div>
                <h2 className="text-2xl font-black text-white mb-2">🎉 Consultation Completed!</h2>
                <p className="text-slate-200 text-sm max-w-md mx-auto mb-6 leading-relaxed">
                  Thank you for visiting <strong>{record.storeName}</strong>. We hope you had a smooth live queue experience!
                </p>
                <button
                  onClick={() => {
                    setWasTicketActive(false);
                    clearQueueSession();
                    notifiedTurnEntriesRef.current.clear();
                    notifiedPositionsRef.current.clear();
                    prevEntryStatus.current = null;
                    void fetchData();
                  }}
                  className="py-3 px-6 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-bold text-sm shadow-lg shadow-indigo-600/30 transition-all cursor-pointer"
                >
                  Join Again / Done
                </button>
              </div>
            ) : isQueueOpen ? (
              /* ─── CASE C: Queue is Open, User can Join ─────────────────── */
              <div className="rounded-3xl bg-slate-900/80 border border-white/10 p-6 sm:p-8 backdrop-blur-xl shadow-2xl space-y-6">
                <div className="text-center max-w-md mx-auto space-y-2">
                  <div className="inline-flex p-3 rounded-2xl bg-indigo-600/20 text-indigo-400 border border-indigo-500/30">
                    <Zap size={28} />
                  </div>
                  <h3 className="text-xl sm:text-2xl font-extrabold text-white">Join Live Clinic Queue</h3>
                  <p className="text-slate-300 text-xs sm:text-sm">
                    Grab your digital token instantly. Track your live turn and wait from anywhere without standing in line.
                  </p>
                </div>

                {joinMsg && (
                  <div className={`p-4 rounded-2xl text-xs sm:text-sm font-bold flex items-center gap-2 ${
                    isJoinError ? "bg-rose-950/90 border border-rose-500/50 text-rose-200" : "bg-emerald-950/90 border border-emerald-500/50 text-emerald-200"
                  }`}>
                    {isJoinError ? <AlertTriangle size={18} /> : <CheckCircle2 size={18} />}
                    <span>{joinMsg}</span>
                  </div>
                )}

                <div className="max-w-md mx-auto">
                  <button
                    onClick={() => void handleJoinQueue()}
                    disabled={joining}
                    className="w-full py-4 px-6 bg-gradient-to-r from-indigo-600 via-blue-600 to-indigo-600 hover:from-indigo-500 hover:to-blue-500 text-white rounded-2xl font-black text-base sm:text-lg shadow-xl shadow-indigo-600/40 hover:shadow-indigo-600/60 flex items-center justify-center gap-2.5 transition-all transform active:scale-[0.98] disabled:opacity-60 cursor-pointer"
                  >
                    {joining ? (
                      <>
                        <Radio className="w-5 h-5 animate-spin" /> Issuing Digital Token...
                      </>
                    ) : (
                      <>
                        <Ticket size={20} /> Get Token & Join Queue
                      </>
                    )}
                  </button>

                  <div className="grid grid-cols-3 gap-2 mt-4 text-center text-[11px] text-slate-300 font-medium">
                    <div className="flex flex-col items-center gap-1">
                      <Sparkles size={15} className="text-indigo-400" />
                      <span>Live Radar Sync</span>
                    </div>
                    <div className="flex flex-col items-center gap-1">
                      <Bell size={15} className="text-cyan-400" />
                      <span>Audio & Push Alert</span>
                    </div>
                    <div className="flex flex-col items-center gap-1">
                      <Clock size={15} className="text-emerald-400" />
                      <span>Zero Wait In-Clinic</span>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              /* ─── CASE D: Queue is Closed / Paused ─────────────────────── */
              <div className="rounded-3xl bg-slate-900/90 border border-rose-500/30 p-8 text-center backdrop-blur-xl shadow-2xl space-y-4">
                <div className="w-16 h-16 rounded-2xl bg-rose-500/20 border border-rose-500/30 text-rose-400 flex items-center justify-center mx-auto">
                  <Clock size={32} />
                </div>
                <h3 className="text-2xl font-black text-white">OPD Walk-in Queue is Closed</h3>
                <p className="text-slate-200 text-sm max-w-md mx-auto leading-relaxed">
                  The walk-in queue for <strong>{record.storeName}</strong> is not accepting new tokens right now. Operating hours are <span className="font-bold text-white">{clinicHours}</span>.
                </p>
                <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
                  <button
                    onClick={() => setActiveTab("book")}
                    className="py-3 px-5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-bold text-sm transition-all shadow-lg shadow-indigo-600/30 flex items-center gap-2 cursor-pointer"
                  >
                    <Calendar size={16} /> Check / Book Appointments
                  </button>
                  {clinicPhone ? (
                    <a
                      href={`tel:${clinicPhone}`}
                      className="py-3 px-5 bg-slate-800 hover:bg-slate-700 text-slate-100 rounded-xl font-bold text-sm transition-all flex items-center gap-2"
                    >
                      <Phone size={15} className="text-indigo-400" /> Call {clinicPhone}
                    </a>
                  ) : null}
                </div>
              </div>
            )}
          </div>
        )}

        {/* ─── TAB 2: BOOK APPOINTMENT (TIME SLOTS) ────────────────────────── */}
        {activeTab === "book" && (
          <div className="rounded-3xl bg-slate-900/80 border border-white/10 p-6 sm:p-8 backdrop-blur-xl shadow-2xl space-y-6 animate-in fade-in duration-300">
            <div className="space-y-1">
              <h3 className="text-xl sm:text-2xl font-extrabold text-white flex items-center gap-2">
                <Calendar className="text-indigo-400" /> Book a Confirmed Time Slot
              </h3>
              <p className="text-slate-300 text-xs sm:text-sm">
                Reserve your doctor consultation ahead of time without waiting in the live queue.
              </p>
            </div>

            {bookingSuccess && (
              <div className="p-4 rounded-2xl bg-emerald-950/90 border border-emerald-500/50 text-emerald-200 text-sm font-bold flex items-center gap-2.5">
                <CheckCircle2 size={20} className="flex-shrink-0" />
                <span>{bookingSuccess}</span>
              </div>
            )}

            {bookingError && (
              <div className="p-4 rounded-2xl bg-rose-950/90 border border-rose-500/50 text-rose-200 text-sm font-bold flex items-center gap-2.5">
                <AlertTriangle size={20} className="flex-shrink-0" />
                <span>{bookingError}</span>
              </div>
            )}

            {/* If NO appointments/slots available */}
            {!loadingSlots && slots.length === 0 ? (
              <div className="p-8 text-center bg-slate-800/60 rounded-3xl border border-slate-700/80 space-y-4">
                <div className="w-14 h-14 rounded-2xl bg-amber-500/20 border border-amber-500/30 text-amber-400 flex items-center justify-center mx-auto">
                  <Calendar size={28} />
                </div>
                <h4 className="text-lg font-bold text-white">No Online Appointments Available</h4>
                <p className="text-slate-300 text-xs sm:text-sm max-w-md mx-auto leading-relaxed">
                  This clinic currently operates primarily on a live walk-in token system and has no online time slots enabled for <strong>{appointmentDate}</strong>.
                </p>
                <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
                  {isQueueOpen ? (
                    <button
                      type="button"
                      onClick={() => setActiveTab("queue")}
                      className="py-2.5 px-5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-bold text-xs sm:text-sm shadow-lg shadow-indigo-600/30 flex items-center gap-2 cursor-pointer"
                    >
                      <Zap size={16} /> Switch to Live OPD Queue
                    </button>
                  ) : null}
                  {clinicPhone ? (
                    <a
                      href={`tel:${clinicPhone}`}
                      className="py-2.5 px-5 bg-slate-800 hover:bg-slate-700 text-slate-100 rounded-xl font-bold text-xs sm:text-sm border border-slate-700 flex items-center gap-2"
                    >
                      <Phone size={15} className="text-indigo-400" /> Call Clinic: {clinicPhone}
                    </a>
                  ) : null}
                </div>
              </div>
            ) : (
              <form onSubmit={handleBookAppointment} className="space-y-6">
                {/* Doctor Selector (if clinic has doctors) */}
                {doctors.length > 0 && (
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-200 mb-2">
                      Select Doctor (Optional)
                    </label>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                      <button
                        type="button"
                        onClick={() => setSelectedDoctorId("")}
                        className={`p-3 rounded-xl border text-left flex items-center justify-between transition-all cursor-pointer ${
                          selectedDoctorId === ""
                            ? "bg-indigo-600/30 border-indigo-500 text-white font-bold"
                            : "bg-slate-800/80 border-slate-700 text-slate-200 hover:border-slate-500"
                        }`}
                      >
                        <span>Any Available Doctor</span>
                        {selectedDoctorId === "" && <Check size={16} className="text-indigo-400" />}
                      </button>
                      {doctors.map((doc) => (
                        <button
                          key={doc.id}
                          type="button"
                          onClick={() => setSelectedDoctorId(doc.id)}
                          className={`p-3 rounded-xl border text-left flex items-center justify-between transition-all cursor-pointer ${
                            selectedDoctorId === doc.id
                              ? "bg-indigo-600/30 border-indigo-500 text-white font-bold"
                              : "bg-slate-800/80 border-slate-700 text-slate-200 hover:border-slate-500"
                          }`}
                        >
                          <div>
                            <div className="text-sm text-white font-semibold">{doc.name}</div>
                            {doc.specialization && (
                              <div className="text-[11px] text-slate-300 font-normal">{doc.specialization}</div>
                            )}
                          </div>
                          {selectedDoctorId === doc.id && <Check size={16} className="text-indigo-400" />}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Date Selection */}
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-200 mb-2">
                    Choose Appointment Date
                  </label>
                  <div className="flex flex-wrap items-center gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        const d = new Date();
                        setAppointmentDate(d.toISOString().split("T")[0]);
                      }}
                      className={`py-2 px-4 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                        appointmentDate === new Date().toISOString().split("T")[0]
                          ? "bg-indigo-600 text-white border-indigo-500"
                          : "bg-slate-800 text-slate-200 border-slate-700 hover:border-slate-500"
                      }`}
                    >
                      Today
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        const d = new Date();
                        d.setDate(d.getDate() + 1);
                        setAppointmentDate(d.toISOString().split("T")[0]);
                      }}
                      className={`py-2 px-4 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                        appointmentDate === new Date(Date.now() + 86400000).toISOString().split("T")[0]
                          ? "bg-indigo-600 text-white border-indigo-500"
                          : "bg-slate-800 text-slate-200 border-slate-700 hover:border-slate-500"
                      }`}
                    >
                      Tomorrow
                    </button>
                    <input
                      type="date"
                      min={new Date().toISOString().split("T")[0]}
                      value={appointmentDate}
                      onChange={(e) => setAppointmentDate(e.target.value)}
                      className="px-3 py-1.5 rounded-xl bg-slate-800 border border-slate-700 text-white text-xs font-bold focus:outline-none focus:border-indigo-500 cursor-pointer"
                    />
                  </div>
                </div>

                {/* Time Slots Grid */}
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-200 mb-2">
                    Available Time Slots
                  </label>
                  {loadingSlots ? (
                    <div className="p-8 text-center text-slate-200 text-sm flex items-center justify-center gap-2">
                      <Radio className="w-4 h-4 animate-spin text-indigo-400" /> Loading available slots...
                    </div>
                  ) : (
                    <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-2">
                      {slots.map((slot) => (
                        <button
                          key={slot.time}
                          type="button"
                          disabled={!slot.available}
                          onClick={() => setSelectedTimeSlot(slot.time)}
                          className={`py-2.5 px-2 rounded-xl text-xs font-bold border text-center transition-all cursor-pointer ${
                            !slot.available
                              ? "bg-slate-900/40 border-slate-800 text-slate-600 cursor-not-allowed line-through"
                              : selectedTimeSlot === slot.time
                              ? "bg-indigo-600 text-white border-indigo-400 shadow-lg shadow-indigo-600/40 scale-105"
                              : "bg-slate-800 hover:bg-slate-700 border-slate-700 text-slate-100 hover:border-slate-500"
                          }`}
                        >
                          {slot.time}
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {/* Patient Name & Notes */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-200 mb-1.5">
                      Patient Name
                    </label>
                    <input
                      type="text"
                      placeholder={data.user?.name || "e.g. John Doe"}
                      value={patientNameInput}
                      onChange={(e) => setPatientNameInput(e.target.value)}
                      className="w-full px-4 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-white placeholder-slate-400 text-sm focus:outline-none focus:border-indigo-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-200 mb-1.5">
                      Reason / Symptoms (Optional)
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Fever, Follow-up, Routine check"
                      value={patientNotesInput}
                      onChange={(e) => setPatientNotesInput(e.target.value)}
                      className="w-full px-4 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-white placeholder-slate-400 text-sm focus:outline-none focus:border-indigo-500"
                    />
                  </div>
                </div>

                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={isBooking || !selectedTimeSlot}
                  className="w-full py-3.5 px-6 bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-500 hover:to-blue-500 text-white rounded-2xl font-bold text-base shadow-xl shadow-indigo-600/30 flex items-center justify-center gap-2 transition-all disabled:opacity-50 cursor-pointer"
                >
                  {isBooking ? (
                    <>
                      <Radio className="w-5 h-5 animate-spin" /> Confirming Booking...
                    </>
                  ) : (
                    <>
                      <CheckCircle2 size={18} /> Confirm Appointment {selectedTimeSlot ? `at ${selectedTimeSlot}` : ""}
                    </>
                  )}
                </button>
              </form>
            )}
          </div>
        )}

        {/* ─── TAB 3: DOCTORS & CLINIC INFORMATION ─────────────────────────── */}
        {activeTab === "doctors" && (
          <div className="space-y-6 animate-in fade-in duration-300">
            {/* Doctors List */}
            <div className="rounded-3xl bg-slate-900/80 border border-white/10 p-6 sm:p-8 backdrop-blur-xl shadow-2xl space-y-4">
              <h3 className="text-xl font-extrabold text-white flex items-center gap-2">
                <Stethoscope className="text-indigo-400" /> Medical Specialists & Doctors
              </h3>

              {doctors.length === 0 ? (
                <div className="p-6 text-center text-slate-200 text-sm bg-slate-800/60 rounded-2xl border border-slate-700 font-medium">
                  General healthcare physicians on duty. Walk-in queue and emergency consultations available during clinic hours.
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {doctors.map((doc) => (
                    <div
                      key={doc.id}
                      className="p-5 rounded-2xl bg-slate-800/80 border border-slate-700 flex items-start gap-4 hover:border-indigo-500/50 transition-all"
                    >
                      <div className="w-12 h-12 rounded-xl bg-indigo-600/30 border border-indigo-500/40 text-indigo-300 flex items-center justify-center font-black text-lg flex-shrink-0">
                        {doc.name.replace(/^Dr.s*/i, "").charAt(0)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-base font-bold text-white truncate">{doc.name}</div>
                        <div className="text-xs text-indigo-300 font-semibold mt-0.5">
                          {doc.specialization || "General Medicine"}
                        </div>
                        <div className="text-[11px] text-slate-300 mt-2 flex items-center gap-1">
                          <Clock size={13} className="text-cyan-400" /> ~{doc.consultationMinutes || 15} mins / patient
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Facility Information (Timings, Contact No, Gmail, Address) */}
            <div className="rounded-3xl bg-slate-900/80 border border-white/10 p-6 sm:p-8 backdrop-blur-xl shadow-2xl space-y-4">
              <h3 className="text-xl font-extrabold text-white flex items-center gap-2">
                <Info className="text-cyan-400" /> Facility Information & Contact
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs sm:text-sm">
                {/* 1. Operating Hours & Timings */}
                <div className="p-4 rounded-2xl bg-slate-800/80 border border-slate-700 space-y-1.5">
                  <div className="text-slate-300 font-bold uppercase text-[11px] flex items-center gap-1.5">
                    <Clock size={14} className="text-cyan-400" /> Clinic Timings
                  </div>
                  <div className="text-white font-extrabold text-base">{clinicHours}</div>
                  <div className="text-emerald-400 text-xs font-semibold">Open Monday – Saturday</div>
                </div>

                {/* 2. Contact Phone Number */}
                <div className="p-4 rounded-2xl bg-slate-800/80 border border-slate-700 space-y-1.5">
                  <div className="text-slate-300 font-bold uppercase text-[11px] flex items-center gap-1.5">
                    <Phone size={14} className="text-indigo-400" /> Contact & Reception
                  </div>
                  {clinicPhone ? (
                    <>
                      <div className="text-white font-extrabold text-base">{clinicPhone}</div>
                      <div>
                        <a href={`tel:${clinicPhone}`} className="text-indigo-300 hover:text-white text-xs font-bold underline inline-flex items-center gap-1">
                          Call Reception Counter
                        </a>
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="text-slate-400 font-semibold text-sm">No number provided</div>
                      <div className="text-slate-500 text-xs">Direct consultation at counter</div>
                    </>
                  )}
                </div>

                {/* 3. Email / Gmail Support */}
                <div className="p-4 rounded-2xl bg-slate-800/80 border border-slate-700 space-y-1.5">
                  <div className="text-slate-300 font-bold uppercase text-[11px] flex items-center gap-1.5">
                    <Mail size={14} className="text-amber-400" /> Email / Gmail
                  </div>
                  {clinicEmail ? (
                    <>
                      <div className="text-white font-extrabold text-base truncate">{clinicEmail}</div>
                      <div>
                        <a href={`mailto:${clinicEmail}`} className="text-cyan-300 hover:text-white text-xs font-bold underline inline-flex items-center gap-1">
                          Send Email Query
                        </a>
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="text-slate-400 font-semibold text-sm">No email provided</div>
                      <div className="text-slate-500 text-xs">Inquiries in-clinic</div>
                    </>
                  )}
                </div>

                {/* 4. Clinic Address & Location */}
                <div className="p-4 rounded-2xl bg-slate-800/80 border border-slate-700 space-y-1.5">
                  <div className="text-slate-300 font-bold uppercase text-[11px] flex items-center gap-1.5">
                    <MapPin size={14} className="text-rose-400" /> Clinic Location
                  </div>
                  <div className="text-white font-extrabold text-xs sm:text-sm leading-snug">
                    {record.address || "Main Market Road"}, {record.area || "DLF Ankur Vihar"}, {record.city || "Ghaziabad"}
                  </div>
                  <div>
                    <a
                      href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${record.storeName} ${record.address}`)}`}
                      target="_blank"
                      rel="noreferrer"
                      className="text-emerald-300 hover:text-white text-xs font-bold underline inline-flex items-center gap-1"
                    >
                      Open in Google Maps <ExternalLink size={11} />
                    </a>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ─── Footer Meta ───────────────────────────────────────────────────── */}
        <footer className="text-center pt-4 pb-8 text-xs text-slate-400 space-y-1 font-medium">
          <p>
            {lastUpdated ? `Updated ${lastUpdated.toLocaleTimeString()} · ` : ""}Auto-refreshes in real-time
          </p>
          <p className="opacity-80 text-slate-300 font-semibold">
            Kynisto Permanent Healthcare Queue • Code: <span className="font-mono text-indigo-300">${code}</span>
          </p>
        </footer>
      </main>

      {/* Running Late Modal */}
      {showLateModal && (
        <LateModal
          onConfirm={(mins) => void handleRunningLate(mins)}
          onClose={() => setShowLateModal(false)}
        />
      )}

      {/* Universal Scanner Modal */}
      {showScanner && (
        <UniversalHealthcareQrScanner
          onClose={() => setShowScanner(false)}
          onSuccess={() => {
            setShowScanner(false);
            void fetchData();
          }}
        />
      )}
    </div>
  );
}
