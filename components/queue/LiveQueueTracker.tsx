'use client';

import React, { useState, useEffect, useCallback, useRef, useMemo, startTransition } from 'react';
import { Clock, MapPin, AlertCircle, XCircle, CheckCircle2, Navigation, User, Phone, Bell, ArrowLeft, Search, Building2, Stethoscope, Activity, Sparkles, Filter, ChevronRight, Lock, RefreshCw, AlertTriangle, PartyPopper, Calendar, QrCode, FileText } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { apiFetch } from '@/lib/client-api';
import { PushNotificationManager } from '@/components/ui/PushNotificationManager';
import { AppointmentBooking } from '@/components/queue/AppointmentBooking';
import { ClinicQrModal } from '@/components/queue/ClinicQrModal';
import { UniversalHealthcareQrScanner } from '@/components/queue/UniversalHealthcareQrScanner';
import { Navbar3D } from '@/components/landing/Navbar3D';
import { saveQueueSession, clearQueueSession } from '@/lib/queue-persistence';
import { CustomerPrescriptionCenter } from '@/components/healthcare/CustomerPrescriptionCenter';




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

function playTurnArrivalChime() {
  const ctx = getAudioContext();
  if (!ctx) return;
  const nowMs = Date.now();
  if (nowMs - _lastChimeTime < 2500) return; // Prevent spamming within 2.5s
  _lastChimeTime = nowMs;

  try {
    const now = ctx.currentTime;
    // Tone 1: High Bell (E5 - 659.25Hz)
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

    // Tone 2: Warm Low Chime (C5 - 523.25Hz)
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
  } catch (e) {
    console.warn("Audio chime notice:", e);
  }
}

interface HealthcareQueueItem {
  id: string | number;
  slug?: string;
  name: string;
  category: string;
  subcategory?: string;
  providerType: string;
  address: string;
  area?: string;
  city?: string;
  rating?: number;
  reviews?: number;
  queueStatus: 'open' | 'closed' | 'paused' | string;
  waitingCount: number;
  consultationMinutes?: number;
  currentTokenNumber?: number;
  openingTime?: string;
  closingTime?: string;
  acceptingPatients?: number | boolean;
  ownerQueueEnabled?: number | boolean;
  adminQueueEnabled?: number | boolean;
  allowAppointments?: number | boolean;
}

export function isClinicQueueOpen(item: HealthcareQueueItem): boolean {
  const ownerEnabled = item.ownerQueueEnabled === 1 || item.ownerQueueEnabled === true;
  const adminEnabled = item.adminQueueEnabled === 1 || item.adminQueueEnabled === true;
  if (!ownerEnabled || !adminEnabled) return false;

  const accepting = item.acceptingPatients === 1 || item.acceptingPatients === true || item.acceptingPatients === undefined;
  if (!accepting) return false;

  if (item.queueStatus === 'closed' || item.queueStatus === 'no_queue') return false;

  if (item.openingTime && item.closingTime) {
    const parseMinutes = (timeStr: string) => {
      const match = String(timeStr).match(/^(\d{1,2}):(\d{2})$/);
      if (!match) return null;
      return parseInt(match[1], 10) * 60 + parseInt(match[2], 10);
    };
    const openM = parseMinutes(item.openingTime);
    const closeM = parseMinutes(item.closingTime);
    if (openM !== null && closeM !== null) {
      const istDate = new Date(new Date().toLocaleString("en-US", { timeZone: "Asia/Kolkata" }));
      const currentMinutes = istDate.getHours() * 60 + istDate.getMinutes();
      const withinHours = openM <= closeM
        ? currentMinutes >= openM && currentMinutes <= closeM
        : currentMinutes >= openM || currentMinutes <= closeM;
      if (!withinHours) return false;
    }
  }

  return item.queueStatus === 'open';
}

interface PatientQueueStateResponse {
  activeStoreId: string | null;
  state: {
    queueAvailable: boolean;
    queueStatus: 'open' | 'closed' | 'paused' | string;
    consultationMinutes: number;
    currentTokenNumber: number;
    waitingCount: number;
    entry: {
      id: string;
      tokenNumber: number;
      status: 'waiting' | 'called' | 'in_consultation' | 'completed' | 'cancelled' | 'left' | 'no_show' | 'expired';
      arrivalStatus: string;
      position: number;
      prescriptionStatus?: 'not_issued' | 'draft' | 'issued';
      prescriptionId?: string;
    } | null;
  } | null;
}

// Fallback seed clinics matching owner database schema if DB is empty
const defaultHealthcareProviders: HealthcareQueueItem[] = [
  {
    id: 'hosp-1',
    name: 'City Hospital – Dr. Sharma',
    category: 'Healthcare',
    subcategory: 'General Medicine & OPD',
    providerType: 'Hospital',
    address: 'MG Road, Bangalore',
    area: 'MG Road',
    city: 'Bangalore',
    rating: 4.9,
    reviews: 342,
    queueStatus: 'open',
    waitingCount: 0,
    consultationMinutes: 15,
    currentTokenNumber: 0,
    acceptingPatients: true,
    ownerQueueEnabled: true,
    adminQueueEnabled: true
  },
  {
    id: 'hosp-2',
    name: 'Apex Heart & Cardiology Clinic',
    category: 'Healthcare',
    subcategory: 'Cardiology',
    providerType: 'Clinic',
    address: 'Indiranagar 100ft Road, Bangalore',
    area: 'Indiranagar',
    city: 'Bangalore',
    rating: 4.8,
    reviews: 215,
    queueStatus: 'open',
    waitingCount: 0,
    consultationMinutes: 12,
    currentTokenNumber: 0,
    acceptingPatients: true,
    ownerQueueEnabled: true,
    adminQueueEnabled: true
  },
  {
    id: 'hosp-3',
    name: 'CarePlus Diagnostics & Scan Center',
    category: 'Healthcare',
    subcategory: 'Pathology & Radiology',
    providerType: 'Diagnostic',
    address: 'Koramangala 4th Block, Bangalore',
    area: 'Koramangala',
    city: 'Bangalore',
    rating: 4.7,
    reviews: 189,
    queueStatus: 'closed',
    waitingCount: 0,
    consultationMinutes: 10,
    currentTokenNumber: 0,
    acceptingPatients: false,
    ownerQueueEnabled: false,
    adminQueueEnabled: true
  },
  {
    id: 'hosp-4',
    name: 'Apollo Dental & Super Specialty Wing',
    category: 'Healthcare',
    subcategory: 'Dentistry',
    providerType: 'Dental',
    address: 'Jayanagar 3rd Block, Bangalore',
    area: 'Jayanagar',
    city: 'Bangalore',
    rating: 4.9,
    reviews: 410,
    queueStatus: 'open',
    waitingCount: 0,
    consultationMinutes: 15,
    currentTokenNumber: 0,
    acceptingPatients: true,
    ownerQueueEnabled: true,
    adminQueueEnabled: true
  },
  {
    id: 'hosp-5',
    name: 'Max Healthcare Pediatrics & Child OPD',
    category: 'Healthcare',
    subcategory: 'Pediatric Care',
    providerType: 'Hospital',
    address: 'Whitefield Main Road, Bangalore',
    area: 'Whitefield',
    city: 'Bangalore',
    rating: 4.85,
    reviews: 156,
    queueStatus: 'open',
    waitingCount: 0,
    consultationMinutes: 10,
    currentTokenNumber: 0,
    acceptingPatients: true,
    ownerQueueEnabled: true,
    adminQueueEnabled: true
  },
  {
    id: 'hosp-6',
    name: 'Dr. Mehta Orthopedic & Joint Care Clinic',
    category: 'Healthcare',
    subcategory: 'Orthopedics',
    providerType: 'Clinic',
    address: 'HSR Layout Sector 1, Bangalore',
    area: 'HSR Layout',
    city: 'Bangalore',
    rating: 4.95,
    reviews: 512,
    queueStatus: 'no_queue',
    waitingCount: 0,
    consultationMinutes: 15,
    currentTokenNumber: 0,
    acceptingPatients: true,
    ownerQueueEnabled: false,
    adminQueueEnabled: true
  }
];

export default function LiveQueueTracker() {
  const router = useRouter();
  const [view, setView] = useState<'list' | 'ticket'>('list');
  const [queues, setQueues] = useState<HealthcareQueueItem[]>([]);
  const [selectedQueue, setSelectedQueue] = useState<HealthcareQueueItem | null>(null);
  
  // Real patient state from D1 Database (managed by owner/admin)
  const [userPosition, setUserPosition] = useState<number>(0);
  const [totalInQueue, setTotalInQueue] = useState<number>(0);
  const [estimatedWait, setEstimatedWait] = useState<number>(0);
  const [currentToken, setCurrentToken] = useState<number>(0);
  const [myTokenNumber, setMyTokenNumber] = useState<number>(0);
  const [isQueueOpen, setIsQueueOpen] = useState<boolean>(true);
  const [entryStatus, setEntryStatus] = useState<'waiting' | 'called' | 'in_consultation' | 'completed' | 'cancelled' | 'left' | 'no_show' | 'expired'>('waiting');
  const [prescriptionStatus, setPrescriptionStatus] = useState<'not_issued' | 'draft' | 'issued' | undefined>(undefined);
  const [prescriptionId, setPrescriptionId] = useState<string | undefined>(undefined);
  const [currentEntryId, setCurrentEntryId] = useState<string | null>(null);
  const [liveCompleted, setLiveCompleted] = useState<boolean>(false);
  const prevEntryStatusRef = useRef<string | null>(null);
  const notifiedTurnEntriesRef = useRef<Set<string>>(new Set());
  const notifiedPositionsRef = useRef<Map<string, number>>(new Map());
  
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState('All');
  const [isLate, setIsLate] = useState(false);
  const [lateMinutes, setLateMinutes] = useState<number>(10);
  const [isCancelled, setIsCancelled] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isJoining, setIsJoining] = useState(false);
  const [isTurnDismissed, setIsTurnDismissed] = useState(false);

  // Appointment booking modal state
  const [bookingTarget, setBookingTarget] = useState<{ id: string; name: string; allowAppointments?: boolean } | null>(null);

  // Clinic QR modal state
  const [qrTarget, setQrTarget] = useState<{ id: string; name: string; slug?: string } | null>(null);
  const [showUniversalScanner, setShowUniversalScanner] = useState(false);

  // Customer Healthcare navigation: Find | Live Queue | Appointments | My Prescription
  const [customerNav, setCustomerNav] = useState<'find' | 'queue' | 'appointments' | 'prescriptions'>('find');
  const [selectedPrescriptionId, setSelectedPrescriptionId] = useState<string | null>(null);
  const [viewingPrescriptionId, setViewingPrescriptionId] = useState<string | undefined | null>(null);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const sp = new URLSearchParams(window.location.search);
    const tabParam = sp.get('tab');
    const rxParam = sp.get('prescriptionId') || sp.get('rxId') || sp.get('rx');
    if (tabParam === 'prescriptions' || tabParam === 'prescription' || rxParam) {
      setCustomerNav('prescriptions');
      if (rxParam) setSelectedPrescriptionId(rxParam);
    } else if (tabParam === 'queue') {
      setCustomerNav('queue');
    } else if (tabParam === 'appointments') {
      setCustomerNav('appointments');
    }
  }, []);



  // Throttled / Debounced search input handler to keep responsiveness < 15ms
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchQuery(searchQuery);
    }, 120);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // 1. Fetch real healthcare provider dataset from backend API
  const fetchHealthcareQueues = useCallback(async () => {
    try {
      const data = await apiFetch<{ items: HealthcareQueueItem[] }>('/api/healthcare?queue=all');
      if (data && data.items) {
        setQueues(data.items);
      }
    } catch {
      // Backend error fallback
    }
  }, []);

  useEffect(() => {
    if (view !== 'list') return;
    fetchHealthcareQueues();

    let timer: ReturnType<typeof setTimeout> | null = null;
    let isDisposed = false;

    const scheduleNext = () => {
      if (isDisposed) return;
      const isHidden = typeof document !== 'undefined' && document.hidden;
      const isMobile = typeof window !== 'undefined' && (window.innerWidth < 768 || ('ontouchstart' in window));
      const delay = isHidden ? 25000 : isMobile ? Math.floor(9500 + Math.random() * 2000) : Math.floor(4500 + Math.random() * 1000);
      timer = setTimeout(() => {
        if (isDisposed) return;
        fetchHealthcareQueues();
        scheduleNext();
      }, delay);
    };
    scheduleNext();

    const handleVisibility = () => {
      if (!document.hidden && !isDisposed) {
        fetchHealthcareQueues();
      }
    };
    if (typeof document !== 'undefined') {
      document.addEventListener('visibilitychange', handleVisibility);
    }

    return () => {
      isDisposed = true;
      if (timer) clearTimeout(timer);
      if (typeof document !== 'undefined') {
        document.removeEventListener('visibilitychange', handleVisibility);
      }
    };
  }, [fetchHealthcareQueues, view]);

  const userPositionRef = useRef(userPosition);
  userPositionRef.current = userPosition;
  const currentEntryIdRef = useRef(currentEntryId);
  currentEntryIdRef.current = currentEntryId;
  const entryStatusRef = useRef(entryStatus);
  entryStatusRef.current = entryStatus;
  const selectedQueueRef = useRef(selectedQueue);
  selectedQueueRef.current = selectedQueue;
  const lastStateSignatureRef = useRef<string>("");

  // 2. Fetch exact patient queue state from DB for selected clinic (syncs with Owner Dashboard in real-time)
  const syncPatientStateWithStore = useCallback(async (storeId: string | number) => {
    try {
      const res = await apiFetch<PatientQueueStateResponse>(`/api/healthcare/queue?storeId=${storeId}`);
      if (res && res.state) {
        const { state } = res;
        
        // Fast Delta Diffing (< 0.1ms) - skip duplicate re-renders on low networks
        const signature = `${state.queueStatus}:${state.currentTokenNumber}:${state.waitingCount}:${state.entry?.status}:${state.entry?.position}:${state.entry?.tokenNumber}`;
        if (lastStateSignatureRef.current === signature) {
          return;
        }
        lastStateSignatureRef.current = signature;

        setIsQueueOpen(state.queueStatus !== 'closed');
        const curr = state.currentTokenNumber || 0;
        setCurrentToken(curr);
        
        if (state.entry) {
          const entryId = String(state.entry.id);
          const newStatus = state.entry.status;
          const newPos = state.entry.position || 1;

          if (newStatus === 'waiting' || newStatus === 'called' || newStatus === 'in_consultation') {
            if (newStatus === 'called') {
              if (!notifiedTurnEntriesRef.current.has(entryId)) {
                notifiedTurnEntriesRef.current.add(entryId);
                playTurnArrivalChime();
                if (typeof navigator !== "undefined" && "vibrate" in navigator) {
                  try { navigator.vibrate([300, 150, 300, 150, 600]); } catch {}
                }
              }
            } else if (newStatus === 'waiting' && newPos > 0) {
              const lastPos = notifiedPositionsRef.current.get(entryId);
              if (lastPos !== undefined && newPos < lastPos) {
                playQueueStepChime();
                if (typeof navigator !== "undefined" && "vibrate" in navigator) {
                  try { navigator.vibrate([60, 40, 60]); } catch {}
                }
              }
              notifiedPositionsRef.current.set(entryId, newPos);
            }

            setEntryStatus(state.entry.status);
            setCurrentEntryId(state.entry.id);
            currentEntryIdRef.current = state.entry.id;
            prevEntryStatusRef.current = state.entry.status;
            setUserPosition(newPos);
            setMyTokenNumber(state.entry.tokenNumber);
            setTotalInQueue(Math.max(1, state.waitingCount || newPos));
            const ownerConsultationMins = state.consultationMinutes || 15;
            setEstimatedWait(newPos > 1 ? (newPos - 1) * ownerConsultationMins : 0);
            setPrescriptionStatus(state.entry.prescriptionStatus);
            setPrescriptionId(state.entry.prescriptionId);
          } else if (state.entry.status === 'completed') {
            setEntryStatus('completed');
            setLiveCompleted(true);
            if (typeof window !== "undefined" && "Notification" in window && Notification.permission === "granted") {
              new Notification("🎉 Consultation Completed!", {
                body: `Thank you for visiting! Your consultation is complete.`,
                icon: "/icons/icon-192x192.png",
              });
            }
          } else if (state.entry.status === 'no_show') {
            setEntryStatus('no_show');
          } else {
            setEntryStatus(state.entry.status);
          }
        } else if ((state as any).completedEntry && currentEntryIdRef.current && String((state as any).completedEntry.id) === String(currentEntryIdRef.current)) {
          // Explicit completed entry matching our active consultation
          setEntryStatus('completed');
          setLiveCompleted(true);
        } else if (prevEntryStatusRef.current === 'called' && myTokenNumber > 0 && curr > myTokenNumber) {
          // Was actively called by doctor, and doctor advanced past our token -> Consultation systematically complete!
          setEntryStatus('completed');
          setLiveCompleted(true);
        } else if (selectedQueueRef.current) {
          const ownerConsultationMins = state.consultationMinutes || selectedQueueRef.current.consultationMinutes || 15;
          const pos = userPositionRef.current;
          setEstimatedWait((pos > 1 ? pos - 1 : 0) * ownerConsultationMins);
        }
      }
    } catch {
      // Retain current snapshot
    }
  }, [myTokenNumber]);

  // Handle Joining Live Queue (Sub-10ms Optimistic Transition + Background Sync)
  const handleJoinQueue = useCallback(async (item: HealthcareQueueItem) => {
    setErrorMsg(null);
    notifiedTokenRef.current = null;

    const ownerEnabled = item.ownerQueueEnabled === 1 || item.ownerQueueEnabled === true;
    const adminEnabled = item.adminQueueEnabled === 1 || item.adminQueueEnabled === true;
    const accepting = item.acceptingPatients === 1 || item.acceptingPatients === true || item.acceptingPatients === undefined;
    const hasLiveQueue = ownerEnabled && adminEnabled && item.queueStatus !== 'no_queue';
    const isClosedNow = !hasLiveQueue || !accepting || item.queueStatus === 'closed' || item.queueStatus === 'paused';

    if (isClosedNow) {
      setErrorMsg(`The live queue for ${item.name} is currently closed by the clinic.`);
      return;
    }

    // 1. Instant Optimistic State Commit (< 2ms) - Zero Delay Transition
    const optPos = (item.waitingCount || 0) + 1;
    const optToken = item.currentTokenNumber ? (item.currentTokenNumber + optPos) : optPos;
    const ownerConsultationMins = item.consultationMinutes || 15;
    const optWait = optPos > 1 ? (optPos - 1) * ownerConsultationMins : 0;

    setSelectedQueue(item);
    selectedQueueRef.current = item;
    setCurrentEntryId(null);
    currentEntryIdRef.current = null;
    prevEntryStatusRef.current = 'waiting';
    entryStatusRef.current = 'waiting';
    setEntryStatus('waiting');
    setLiveCompleted(false);
    setIsCancelled(false);
    setIsLate(false);
    setIsTurnDismissed(false);
    lastStateSignatureRef.current = "";

    setMyTokenNumber(optToken);
    setUserPosition(optPos);
    setTotalInQueue(Math.max(1, optPos));
    setEstimatedWait(optWait);
    setIsQueueOpen(true);
    setView('ticket');
    window.scrollTo({ top: 0, behavior: 'instant' });

    setIsJoining(true);
    playQueueJoinedChime();
    if (typeof navigator !== "undefined" && "vibrate" in navigator) {
      try { navigator.vibrate([100, 50, 100]); } catch {}
    }

    // 2. Concurrent Background Worker Sync with D1 Database
    try {
      const response = await apiFetch<{ state: PatientQueueStateResponse['state']; tokenNumber?: number; position?: number; entry?: { id: string } }>('/api/healthcare/queue', {
        method: 'POST',
        json: { action: 'join', storeId: String(item.id) },
      });

      if (response && response.state && response.state.entry) {
        const { entry, consultationMinutes, queueStatus } = response.state;
        const open = queueStatus !== 'closed';
        setIsQueueOpen(open);
        if (!open) {
          setView('list');
          setErrorMsg(`The live queue for ${item.name} is closed.`);
          return;
        }
        setCurrentEntryId(entry.id);
        
        const initialStatus = entry.status === 'completed' ? 'waiting' : entry.status;
        setEntryStatus(initialStatus);
        prevEntryStatusRef.current = initialStatus;
        setLiveCompleted(false);
        const pos = entry.position || response.position || optPos;
        setUserPosition(pos);
        setMyTokenNumber(entry.tokenNumber || response.tokenNumber || optToken);
        setTotalInQueue(Math.max(1, response.state.waitingCount || pos));
        const mins = consultationMinutes || item.consultationMinutes || 15;
        setEstimatedWait(pos > 1 ? (pos - 1) * mins : 0);
        setPrescriptionStatus(entry.prescriptionStatus);
        setPrescriptionId(entry.prescriptionId);
      } else if (response && (response.tokenNumber || response.position)) {
        setCurrentEntryId(response.entry?.id || null);
        const pos = response.position || optPos;
        setUserPosition(pos);
        setMyTokenNumber(response.tokenNumber || optToken);
        setTotalInQueue(pos);
        setEntryStatus('waiting');
        prevEntryStatusRef.current = 'waiting';
      } else {
        await syncPatientStateWithStore(item.id);
      }
    } catch (err: any) {
      const msg = err?.message || 'Failed to join queue.';
      if (msg.includes('Unauthorized') || msg.includes('login') || msg.includes('auth')) {
        router.push(`/login?returnTo=${encodeURIComponent(window.location.pathname)}`);
        return;
      }
      if (msg.includes('closed') || msg.includes('not open') || msg.includes('disabled') || msg.includes('CLOSED')) {
        setView('list');
        setSelectedQueue(null);
        setErrorMsg(`The live queue for ${item.name} is currently closed by the clinic.`);
      } else {
        setErrorMsg(msg);
      }
    } finally {
      setIsJoining(false);
    }
  }, [router, syncPatientStateWithStore]);

  const handleRunningLate = useCallback(async () => {
    if (!selectedQueue) return;
    const input = typeof window !== 'undefined' ? window.prompt('How many minutes late are you? (5–60)', '10') : '10';
    const mins = parseInt(input ?? '10', 10);
    const validMins = Math.min(60, Math.max(5, isNaN(mins) ? 10 : mins));
    setLateMinutes(validMins);
    setIsLate(true);
    try {
      await apiFetch('/api/healthcare/queue', {
        method: 'POST',
        json: { action: 'update_arrival', storeId: String(selectedQueue.id), arrivalStatus: 'running_late', lateMinutes: validMins },
      });
    } catch {
      // UI fallback
    }
  }, [selectedQueue]);

  const handleLeaveQueue = useCallback(async () => {
    if (selectedQueue) {
      try {
        await apiFetch('/api/healthcare/queue', {
          method: 'POST',
          json: { action: 'leave', storeId: String(selectedQueue.id) },
        });
      } catch { /* Fallback */ }
    }
    setIsCancelled(true);
    setView('list');
  }, [selectedQueue]);

  const handleCancelVisit = useCallback(async () => {
    if (typeof window !== 'undefined' && !window.confirm('Cancel your visit? You will lose your place in the queue.')) return;
    if (selectedQueue) {
      try {
        await apiFetch('/api/healthcare/queue', {
          method: 'POST',
          json: { action: 'cancel', storeId: String(selectedQueue.id) },
        });
      } catch { /* Fallback */ }
    }
    setIsCancelled(true);
    setView('list');
  }, [selectedQueue]);

  const handleBackToHub = useCallback(() => {
    setView('list');
    setSelectedQueue(null);
    setEntryStatus('waiting');
    setLiveCompleted(false);
    setIsCancelled(false);
    setMyTokenNumber(0);
    setUserPosition(0);
    setCurrentEntryId(null);
    if (typeof window !== 'undefined') {
      const url = new URL(window.location.href);
      url.searchParams.delete('storeId');
      url.searchParams.delete('action');
      window.history.replaceState({}, '', url.pathname + (url.search ? url.search : ''));
    }
    void fetchHealthcareQueues();
  }, [fetchHealthcareQueues]);

  // 3. Auto-detect user's active joined queue in database on load — runs ONCE on mount only
  const queuesRef = useRef(queues);
  queuesRef.current = queues;
  const hasCheckedActiveQueueRef = useRef(false);
  useEffect(() => {
    // Only run once: prevent re-triggering on every queue polling update
    if (hasCheckedActiveQueueRef.current) return;
    hasCheckedActiveQueueRef.current = true;

    let cancelled = false;
    async function checkUserActiveQueue() {
      try {
        const auth = await apiFetch<{ user?: { id: string } }>('/api/auth/me').catch(() => null);
        if (!auth || !auth.user || cancelled) return;

        const res = await apiFetch<{ activeQueue: { storeId: string; storeName: string; storeSlug: string; tokenNumber: number; status: string; queueState?: any } | null }>('/api/healthcare/queue/active');
        if (res && res.activeQueue && !cancelled) {
          const storeId = String(res.activeQueue.storeId);
          // Use queuesRef to avoid dependency on queues state (prevents re-runs)
          const currentQueues = queuesRef.current;
          const match = currentQueues.find((q) => String(q.id) === storeId || q.slug === storeId || q.slug === res.activeQueue?.storeSlug);
          if (match) {
            setSelectedQueue(match);
            selectedQueueRef.current = match;
          } else {
            const fallbackItem: HealthcareQueueItem = {
              id: storeId,
              slug: res.activeQueue.storeSlug,
              name: res.activeQueue.storeName || 'Healthcare Clinic',
              category: 'Healthcare',
              providerType: 'Clinic',
              address: 'Local Care Network',
              queueStatus: 'open',
              waitingCount: 1,
              consultationMinutes: 15,
            };
            setSelectedQueue(fallbackItem);
            selectedQueueRef.current = fallbackItem;
          }
          
          setMyTokenNumber(res.activeQueue.tokenNumber);
          const activeStatus = res.activeQueue.status as any;
          const initialStatus = (activeStatus === 'waiting' || activeStatus === 'called' || activeStatus === 'in_consultation') ? activeStatus : 'waiting';
          setEntryStatus(initialStatus);
          prevEntryStatusRef.current = initialStatus;

          if (res.activeQueue.queueState) {
            const qs = res.activeQueue.queueState;
            setCurrentToken(qs.currentTokenNumber || 0);
            if (qs.entry) {
              setUserPosition(qs.entry.position || 1);
              setTotalInQueue(Math.max(1, qs.waitingCount || qs.entry.position || 1));
              const mins = qs.consultationMinutes || 15;
              const pos = qs.entry.position || 1;
              setEstimatedWait(pos > 1 ? (pos - 1) * mins : 0);
              setPrescriptionStatus(qs.entry.prescriptionStatus);
              setPrescriptionId(qs.entry.prescriptionId);
            }
          }

          // Show Ticket Screen (Image 2) immediately for active queue entry
          setView('ticket');
          void syncPatientStateWithStore(storeId);
        }
      } catch {
        // No active queue
      }
    }
    checkUserActiveQueue();
    return () => { cancelled = true; };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // ← Empty deps: run exactly once on mount

  // Check URL params for pre-selected store or queue join action — runs once when queues load
  const hasHandledUrlParamsRef = useRef(false);
  useEffect(() => {
    // Only handle URL params once after queues are first loaded
    if (queues.length === 0 || hasHandledUrlParamsRef.current) return;
    hasHandledUrlParamsRef.current = true;

    if (typeof window === 'undefined') return;
    const searchParams = new URLSearchParams(window.location.search);
    const storeIdParam = searchParams.get('storeId') || searchParams.get('store') || searchParams.get('id');
    const actionParam = searchParams.get('action');
    if (storeIdParam) {
      const match = queues.find((q) => String(q.id) === String(storeIdParam) || q.slug === storeIdParam);
      if (match) {
        setSelectedQueue(match);
        if (actionParam === 'join') {
          handleJoinQueue(match);
        }
      }
    }
  }, [queues, handleJoinQueue]);

  const notifiedTokenRef = useRef<number | null>(null);

  // Poll server and stream events when viewing ticket to sync with Owner actions in real-time
  const selectedQueueId = selectedQueue?.id;
  useEffect(() => {
    if (view !== 'ticket' || !selectedQueueId || isCancelled) return;
    
    // Initial fetch & jittered adaptive polling (prevents 50k thundering herd)
    syncPatientStateWithStore(selectedQueueId);
    let pollTimer: ReturnType<typeof setTimeout> | null = null;
    let isDisposed = false;

    const scheduleNextPoll = () => {
      if (isDisposed) return;
      const isHidden = typeof document !== "undefined" && document.hidden;
      // In background tab, throttle polling to 15s. In foreground, 1.5s with +/- 300ms random jitter.
      const delay = isHidden ? 15000 : Math.floor(1300 + Math.random() * 400);
      pollTimer = setTimeout(() => {
        if (isDisposed) return;
        syncPatientStateWithStore(selectedQueueId);
        scheduleNextPoll();
      }, delay);
    };
    scheduleNextPoll();

    const handleVisibility = () => {
      if (!document.hidden && !isDisposed) {
        syncPatientStateWithStore(selectedQueueId);
      }
    };
    if (typeof document !== "undefined") {
      document.addEventListener("visibilitychange", handleVisibility);
    }

    // Realtime SSE Stream for instant sub-second push updates
    let source: EventSource | null = null;
    try {
      source = new EventSource(`/api/healthcare/queue/stream?storeId=${encodeURIComponent(String(selectedQueueId))}`);
      source.addEventListener('queue', (event) => {
        try {
          const payload = JSON.parse((event as MessageEvent).data);
          if (payload && payload.state) {
            const { state } = payload;
            setIsQueueOpen(state.queueStatus !== 'closed');
            setCurrentToken(state.currentTokenNumber || 0);
            if (state.entry) {
              setEntryStatus(state.entry.status);
              setCurrentEntryId(state.entry.id);
              currentEntryIdRef.current = state.entry.id;
              prevEntryStatusRef.current = state.entry.status;
              setUserPosition(state.entry.position || 1);
              setMyTokenNumber(state.entry.tokenNumber);
              setTotalInQueue(Math.max(1, state.waitingCount || state.entry.position || 1));
              if (state.entry.status === 'completed') {
                setLiveCompleted(true);
              }
            } else if (state.completedEntry && currentEntryIdRef.current && String(state.completedEntry.id) === String(currentEntryIdRef.current)) {
              setEntryStatus('completed');
              setLiveCompleted(true);
            } else if (prevEntryStatusRef.current === 'called' && myTokenNumber > 0 && (state.currentTokenNumber || 0) > myTokenNumber) {
              setEntryStatus('completed');
              setLiveCompleted(true);
            }
          }
        } catch {
          // ignore stream parse error
        }
      });
    } catch {
      // SSE fallback handled by polling
    }

    return () => {
      isDisposed = true;
      if (pollTimer) clearTimeout(pollTimer);
      if (typeof document !== "undefined") {
        document.removeEventListener("visibilitychange", handleVisibility);
      }
      if (source) {
        source.close();
        source = null;
      }
    };
  }, [view, selectedQueueId, isCancelled, syncPatientStateWithStore, myTokenNumber]);

  // 🔔 Trigger Native Push Notification, Chime Sound, and Vibration ONLY when Turn Arrives
  useEffect(() => {
    if (view !== 'ticket' || !selectedQueue || !myTokenNumber) return;

    // Turn has arrived ONLY when doctor/owner calls token or currentToken equals myTokenNumber
    const isTurnHere = entryStatus === 'called' || (currentToken > 0 && currentToken === myTokenNumber);

    if (isTurnHere && notifiedTokenRef.current !== myTokenNumber) {
      notifiedTokenRef.current = myTokenNumber;

      // 1. Play Crisp Bell Chime Tone
      playTurnArrivalChime();

      // 2. Mobile Device Haptic Vibration
      if (typeof navigator !== "undefined" && "vibrate" in navigator) {
        navigator.vibrate([300, 150, 300, 150, 600]);
      }

      // 3. Trigger Native Desktop/Mobile Push Notification
      if (typeof window !== "undefined" && "Notification" in window && Notification.permission === "granted") {
        const title = `🚨 YOUR TURN HAS ARRIVED!`;
        const options: any = {
          body: `Token #${myTokenNumber} is up now at ${selectedQueue.name}! Please enter the consultation room immediately.`,
          icon: "/icons/icon-192x192.png",
          badge: "/icons/badge-72x72.png",
          tag: `turn-alert-${myTokenNumber}`,
          renotify: true,
          vibrate: [300, 150, 300, 150, 600],
          requireInteraction: true,
        };

        if ("serviceWorker" in navigator) {
          navigator.serviceWorker.ready.then((reg) => {
            reg.showNotification(title, options);
          }).catch(() => {
            new Notification(title, options);
          });
        } else {
          new Notification(title, options);
        }
      }
    }
  }, [view, selectedQueue, myTokenNumber, currentToken, userPosition, entryStatus]);

  const handleSearchChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
  }, []);

  const handleFilterSelect = useCallback((filter: string) => {
    startTransition(() => {
      setActiveFilter(filter);
    });
  }, []);

  const filteredQueues = useMemo(() => {
    const q = debouncedSearchQuery.trim().toLowerCase();
    const filterLower = activeFilter.toLowerCase();
    return queues.filter((item) => {
      const matchesSearch =
        !q ||
        item.name.toLowerCase().includes(q) ||
        item.address.toLowerCase().includes(q) ||
        (item.subcategory && item.subcategory.toLowerCase().includes(q));
      const matchesFilter =
        activeFilter === 'All' ||
        item.providerType?.toLowerCase() === filterLower ||
        item.category?.toLowerCase() === filterLower;
      return matchesSearch && matchesFilter;
    });
  }, [queues, debouncedSearchQuery, activeFilter]);

  const renderedCategoryFilters = useMemo(() => {
    const filters = [
      { id: 'All', label: 'All Care', icon: Sparkles },
      { id: 'Clinic', label: 'Clinics & OPD', icon: Stethoscope },
      { id: 'Hospital', label: 'Hospitals', icon: Building2 },
      { id: 'Diagnostic', label: 'Diagnostic Labs', icon: Activity },
      { id: 'Dental', label: 'Dental Care', icon: Sparkles },
    ];

    return filters.map(({ id, label, icon: Icon }) => {
      const isActive = activeFilter === id;
      return (
        <button
          key={id}
          type="button"
          onClick={() => handleFilterSelect(id)}
          className={`inline-flex items-center gap-2 px-4.5 sm:px-5 py-2 sm:py-2.5 rounded-full text-xs sm:text-sm font-bold whitespace-nowrap transition-all duration-200 cursor-pointer shrink-0 select-none ${
            isActive
              ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-md shadow-emerald-600/20 border border-emerald-500/30 scale-[1.02]'
              : 'bg-white hover:bg-slate-50 text-slate-600 hover:text-slate-900 border border-slate-200/80 hover:border-slate-300 shadow-xs active:scale-95'
          }`}
        >
          <Icon className={`w-3.5 h-3.5 transition-colors ${isActive ? 'text-white' : 'text-emerald-600'}`} />
          <span>{label}</span>
        </button>
      );
    });
  }, [activeFilter, handleFilterSelect]);

  const renderedQueuesGrid = useMemo(() => {
    return filteredQueues.map((item) => {
      const ownerEnabled = item.ownerQueueEnabled === 1 || item.ownerQueueEnabled === true;
      const adminEnabled = item.adminQueueEnabled === 1 || item.adminQueueEnabled === true;
      const hasLiveQueue = ownerEnabled && adminEnabled && item.queueStatus !== 'no_queue';
      const isClosed = !isClinicQueueOpen(item);
      const isPaused = hasLiveQueue && item.queueStatus === 'paused';
      const consultationMins = item.consultationMinutes || 15;
      const canBook = item.allowAppointments !== 0 && item.allowAppointments !== false;

      return (
        <div
          key={item.id}
          style={{ contain: "content", transform: "translate3d(0,0,0)", willChange: "transform" }}
          className="bg-white border border-slate-200/90 hover:border-emerald-500/40 rounded-3xl p-5 sm:p-6 transition-all duration-300 shadow-sm hover:shadow-lg flex flex-col justify-between group relative overflow-hidden active:scale-[0.99]"
        >
          <div>
            <div className="flex items-center justify-between flex-wrap gap-2 mb-4">
              <div className="flex items-center flex-wrap gap-1.5 min-w-0">
                <span className="px-2.5 py-0.5 rounded-full bg-emerald-50 border border-emerald-200/80 text-emerald-700 text-[11px] font-bold uppercase tracking-wider">
                  {item.providerType || 'Clinic'}
                </span>
                {item.subcategory && (
                  <span className="px-2.5 py-0.5 rounded-full bg-teal-50 border border-teal-200/80 text-teal-700 text-[11px] font-bold uppercase tracking-wider">
                    {item.subcategory}
                  </span>
                )}
              </div>

              {!hasLiveQueue ? (
                <span className="inline-flex items-center text-[11px] font-semibold text-slate-500 bg-slate-100/90 px-2.5 py-0.5 rounded-full border border-slate-200 whitespace-nowrap shrink-0">
                  <span className="w-1.5 h-1.5 rounded-full bg-slate-400 mr-1.5" />
                  No Live Queue
                </span>
              ) : isPaused ? (
                <span className="inline-flex items-center text-[11px] font-bold text-amber-700 bg-amber-50 px-2.5 py-0.5 rounded-full border border-amber-200 whitespace-nowrap shrink-0">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-500 mr-1.5" />
                  Queue Paused
                </span>
              ) : isClosed ? (
                <span className="inline-flex items-center text-[11px] font-bold text-rose-700 bg-rose-50 px-3 py-1 rounded-full border border-rose-200 whitespace-nowrap shrink-0 shadow-sm">
                  <span className="w-1.5 h-1.5 rounded-full bg-rose-500 mr-1.5" />
                  Queue Closed
                </span>
              ) : (
                <span className="inline-flex items-center text-[11px] font-bold text-emerald-700 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200 whitespace-nowrap shrink-0 shadow-sm">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mr-1.5 animate-pulse" />
                  Live Queue Open
                </span>
              )}
            </div>

            <div className="flex items-start gap-3.5 mb-4">
              <div className="w-11 h-11 rounded-2xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600 shrink-0 mt-0.5 shadow-xs">
                <Stethoscope className="w-5 h-5" />
              </div>
              <div className="min-w-0 flex-1">
                <h3 className="text-base sm:text-lg font-black text-slate-900 group-hover:text-emerald-600 transition-colors leading-snug">
                  {item.name}
                </h3>
                <p className="flex items-center text-slate-500 text-xs sm:text-sm font-medium mt-1">
                  <MapPin className="w-3.5 h-3.5 mr-1 text-teal-600 shrink-0" />
                  <span className="truncate">{item.address}</span>
                </p>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-2 p-3 bg-slate-50/80 rounded-2xl border border-slate-200/70 mb-5 text-center">
              <div>
                <span className="text-[10px] sm:text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-0.5">
                  Waiting
                </span>
                <span className="text-sm sm:text-base font-black text-slate-900 tabular-nums">
                  {hasLiveQueue ? (isClosed ? 0 : item.waitingCount) : "OPD Listed"}
                </span>
              </div>
              <div>
                <span className="text-[10px] sm:text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-0.5">
                  Avg Speed
                </span>
                <span className="text-sm sm:text-base font-black text-emerald-600 tabular-nums">
                  {hasLiveQueue ? `${consultationMins}m` : "Walk-in"}
                </span>
              </div>
              <div>
                <span className="text-[10px] sm:text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-0.5">
                  Status
                </span>
                {isClosed ? (
                  <span className="text-sm sm:text-lg font-black tabular-nums text-rose-600">Closed</span>
                ) : (
                  <span className="text-sm sm:text-lg font-black tabular-nums text-emerald-600">Active</span>
                )}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 pt-1">
            <Link
              href={`/stores/${item.slug || item.id}`}
              className={`py-2.5 px-3.5 font-bold text-xs sm:text-sm rounded-xl transition-all flex items-center justify-center space-x-1.5 cursor-pointer ${
                hasLiveQueue
                  ? "shrink-0 bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200/80"
                  : "flex-1 bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200/80"
              }`}
            >
              <Building2 className="w-3.5 h-3.5 shrink-0 text-emerald-600" />
              <span>Profile</span>
            </Link>

            {canBook ? (
              <button
                type="button"
                className={`py-2.5 px-3.5 font-bold text-xs sm:text-sm rounded-xl transition-all flex items-center justify-center space-x-1.5 cursor-pointer ${
                  hasLiveQueue
                    ? "shrink-0 bg-teal-50 hover:bg-teal-100 text-teal-700 border border-teal-200/80"
                    : "flex-1 bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-500 hover:to-emerald-500 text-white border-none shadow-sm hover:shadow"
                }`}
                onClick={() => setBookingTarget({ id: String(item.id), name: item.name, allowAppointments: true })}
              >
                <Calendar className={`w-3.5 h-3.5 shrink-0 ${!hasLiveQueue ? "text-white" : "text-teal-600"}`} />
                <span>Book Appt</span>
              </button>
            ) : (
              <button
                type="button"
                disabled
                className={`py-2.5 px-3.5 font-bold text-xs sm:text-sm rounded-xl transition-all flex items-center justify-center space-x-1.5 opacity-60 cursor-not-allowed text-slate-400 border border-slate-200 bg-slate-50 ${
                  hasLiveQueue ? "shrink-0" : "flex-1"
                }`}
                title="Appointments not available at this clinic"
              >
                <Calendar className="w-3.5 h-3.5 shrink-0 text-slate-400" />
                <span>No Appts</span>
              </button>
            )}

            {hasLiveQueue && (
              isPaused ? (
                <button
                  disabled
                  className="flex-1 py-2.5 px-4 font-bold text-xs sm:text-sm rounded-2xl bg-slate-100 text-slate-400 cursor-not-allowed border border-slate-200 flex items-center justify-center space-x-1.5"
                >
                  <span>Queue Paused</span>
                </button>
              ) : isClosed ? (
                <button
                  disabled
                  className="flex-1 py-2.5 px-4 font-bold text-xs sm:text-sm rounded-2xl bg-slate-100 text-slate-400 cursor-not-allowed border border-slate-200 flex items-center justify-center space-x-1.5"
                >
                  <span>Queue Closed</span>
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => handleJoinQueue(item)}
                  disabled={isJoining}
                  className="flex-1 py-2.5 px-4 font-bold text-xs sm:text-sm rounded-xl transition-all shadow-sm flex items-center justify-center space-x-1.5 group/btn bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white shadow-emerald-500/20 hover:shadow-md cursor-pointer"
                >
                  <span>{isJoining ? 'Joining...' : 'Visit Live Queue'}</span>
                  {!isJoining && <ChevronRight className="w-3.5 h-3.5 group-hover/btn:translate-x-1 transition-transform" />}
                </button>
              )
            )}
          </div>
        </div>
      );
    });
  }, [filteredQueues, isJoining, handleJoinQueue, setBookingTarget]);



  const isCompleted = entryStatus === 'completed';

  if (view === 'ticket' && isCancelled && selectedQueue) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6 text-center text-slate-900">
        <XCircle className="w-20 h-20 text-rose-500 mb-6 animate-pulse" />
        <h2 className="text-3xl sm:text-4xl font-black text-slate-900">Visit Cancelled</h2>
        <p className="text-lg text-slate-600 font-medium mt-3 max-w-md">
          You have left the queue for <span className="text-slate-900 font-bold">{selectedQueue.name}</span>.
        </p>
        <div className="flex gap-4 mt-8">
          <button
            onClick={handleBackToHub}
            className="px-6 py-3 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold rounded-xl shadow-lg transition-all cursor-pointer"
          >
            Back to Healthcare Hub
          </button>
        </div>
      </div>
    );
  }

  if (view === 'ticket' && isCompleted && selectedQueue) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6 text-center text-slate-900">
        <CheckCircle2 className="w-20 h-20 text-emerald-600 mb-6 animate-bounce" />
        <h2 className="text-3xl sm:text-4xl font-black text-slate-900">Consultation Complete</h2>
        <p className="text-lg text-slate-600 font-medium mt-3 max-w-md">
          Thank you for visiting <span className="text-slate-900 font-bold">{selectedQueue.name}</span>!
        </p>
        <div className="flex flex-wrap gap-4 mt-8 justify-center">
          {prescriptionId ? (
            <button
              onClick={() => setViewingPrescriptionId(prescriptionId)}
              className="px-6 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl shadow-lg transition-all cursor-pointer flex items-center gap-2"
            >
              <span>View Prescription 📄</span>
            </button>
          ) : null}
          <button
            onClick={handleBackToHub}
            className="px-6 py-3 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold rounded-xl shadow-lg transition-all cursor-pointer"
          >
            Back to Healthcare Hub
          </button>
        </div>
      </div>
    );
  }

  if (view === 'ticket' && selectedQueue) {
    const isClosed = !isQueueOpen || selectedQueue.queueStatus === 'closed';
    const isMyTurn = entryStatus === 'called' || (currentToken === myTokenNumber && myTokenNumber > 0);
    const isInConsultation = entryStatus === 'in_consultation';
    const progressPercent = isMyTurn || isInConsultation ? 100 : Math.min(100, Math.max(10, ((totalInQueue - userPosition + 1) / Math.max(1, totalInQueue)) * 100));
    const ownerConsultationMins = selectedQueue.consultationMinutes || 15;

    return (
      <div className="min-h-screen bg-gradient-to-b from-slate-50 via-white to-slate-50 text-slate-900 flex flex-col relative overflow-hidden font-sans">
        <div className="bg-gradient-to-b from-emerald-50 via-teal-50/40 to-transparent text-slate-900 pt-6 pb-28 px-4 sm:px-6 lg:px-16 relative overflow-hidden border-b border-slate-200/80">
          <div className="absolute -top-24 -right-24 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute top-1/2 -right-8 -translate-y-1/2 opacity-10 pointer-events-none">
            <Clock className="w-80 h-80 sm:w-[420px] sm:h-[420px] text-teal-600 stroke-[1.2]" />
          </div>

          <div className="relative z-10 max-w-5xl mx-auto flex flex-col">
            <div className="flex items-center justify-between flex-wrap gap-3 mb-6">
              <button
                onClick={() => setView('list')}
                className="flex items-center text-slate-700 hover:text-slate-900 font-bold text-xs sm:text-sm w-fit group transition-all bg-white hover:bg-slate-50 px-4 py-2 rounded-full border border-slate-200 shadow-sm cursor-pointer"
              >
                <ArrowLeft className="w-4 h-4 mr-2 group-hover:-translate-x-1 transition-transform text-emerald-600" />
                <span>Back to Healthcare Hub</span>
              </button>

              <button
                type="button"
                onClick={() => setQrTarget({ id: String(selectedQueue.id), name: selectedQueue.name, slug: selectedQueue.slug })}
                className="flex items-center gap-1.5 text-emerald-700 hover:text-emerald-800 bg-white hover:bg-emerald-50 px-4 py-2 rounded-full border border-emerald-200 shadow-sm font-bold text-xs sm:text-sm cursor-pointer transition-all"
                title="View Clinic QR Code or Scan Counter QR"
              >
                <QrCode className="w-4 h-4 text-emerald-600" />
                <span>Clinic QR Pass</span>
              </button>
            </div>

            <div className="mb-3 flex items-center space-x-3">
              {isInConsultation ? (
                <span className="inline-flex items-center px-4 py-1.5 rounded-full bg-teal-100 text-xs font-black uppercase tracking-widest text-teal-900 shadow-sm border border-teal-300">
                  <span className="w-2.5 h-2.5 rounded-full bg-teal-500 mr-2.5" />
                  👨‍⚕️ IN CONSULTATION
                </span>
              ) : isMyTurn ? (
                <span className="inline-flex items-center px-4 py-1.5 rounded-full bg-emerald-100 text-xs font-black uppercase tracking-widest text-emerald-800 shadow-sm border border-emerald-300 animate-pulse">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 mr-2.5 shadow-[0_0_10px_#10b981]" />
                  YOUR TURN NOW!
                </span>
              ) : isClosed ? (
                <span className="inline-flex items-center px-4 py-1.5 rounded-full bg-rose-100 text-xs font-black uppercase tracking-widest text-rose-800 shadow-sm border border-rose-200">
                  <span className="w-2.5 h-2.5 rounded-full bg-rose-500 mr-2.5" />
                  QUEUE CLOSED BY CLINIC
                </span>
              ) : (
                <span className="inline-flex items-center px-4 py-1.5 rounded-full bg-teal-100 text-xs font-black uppercase tracking-widest text-teal-800 shadow-sm border border-teal-200">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 mr-2.5 animate-ping" />
                  LIVE QUEUE ACTIVE
                </span>
              )}
            </div>

            <h1 className="text-2xl sm:text-4xl font-extrabold text-slate-900 tracking-tight leading-tight">
              {selectedQueue.name}
            </h1>
            <p className="flex items-center text-slate-600 font-medium mt-2 text-sm sm:text-base">
              <MapPin className="w-4 h-4 mr-2 text-teal-600 shrink-0" />
              <span>{selectedQueue.address}</span>
            </p>
          </div>
        </div>

        <div className="flex-1 max-w-4xl w-full mx-auto px-4 sm:px-6 lg:px-8 -mt-20 relative z-20 pb-16">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl p-6 sm:p-10 relative overflow-hidden">
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[140%] h-[140%] bg-[radial-gradient(circle_at_center,_rgba(16,185,129,0.06)_0%,_rgba(6,182,212,0.03)_50%,_transparent_70%)] blur-3xl pointer-events-none" />

            {isInConsultation && (
              <div className="mb-8 p-6 bg-teal-50 border-2 border-teal-500 rounded-2xl flex items-start justify-between text-teal-950 shadow-lg flex-wrap gap-4 transition-all duration-300">
                <div className="flex items-start">
                  <Stethoscope className="w-8 h-8 text-teal-600 mr-4 mt-0.5 shrink-0" />
                  <div>
                    <h4 className="text-2xl font-black text-slate-900 mb-1">👨‍⚕️ CONSULTATION IN PROGRESS</h4>
                    <p className="text-base font-bold text-teal-800">
                      Token #{myTokenNumber} is currently with the doctor in the consultation room.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {isMyTurn && !isTurnDismissed && (
              <div className="mb-8 p-6 bg-emerald-50 border-2 border-emerald-500 rounded-2xl flex items-start justify-between text-emerald-950 shadow-lg flex-wrap gap-4 transition-all duration-300">
                <div className="flex items-start">
                  <CheckCircle2 className="w-8 h-8 text-emerald-600 mr-4 mt-0.5 shrink-0" />
                  <div>
                    <h4 className="text-2xl font-black text-slate-900 mb-1">🎉 YOUR TURN HAS ARRIVED!</h4>
                    <p className="text-base font-bold text-emerald-800">
                      Token #{myTokenNumber} is currently being called by the doctor! Please enter the consultation room immediately.
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2 self-center flex-wrap">
                  <button
                    type="button"
                    onClick={() => playTurnArrivalChime()}
                    className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs uppercase tracking-wider rounded-xl transition-all shadow-md cursor-pointer"
                  >
                    🔔 Play Chime
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsTurnDismissed(true)}
                    className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl border border-slate-300 transition-all cursor-pointer"
                    aria-label="Dismiss turn notification"
                  >
                    ✕ Dismiss
                  </button>
                </div>
              </div>
            )}


            {isClosed && !isMyTurn && (
              <div className="mb-8 p-6 bg-rose-50 border-l-4 border-rose-500 rounded-2xl flex items-start text-rose-900 shadow-sm">
                <Lock className="w-6 h-6 text-rose-500 mr-4 mt-0.5 shrink-0" />
                <div>
                  <h4 className="text-lg font-black text-slate-900 mb-1">Queue Closed by Store Owner / Admin</h4>
                  <p className="text-sm font-medium text-rose-800">
                    The live queue for this provider is currently closed by the owner in their Live Queue dashboard.
                  </p>
                </div>
              </div>
            )}

            <div className="relative z-10 grid grid-cols-1 md:grid-cols-2 gap-8 mb-10 pb-8 border-b border-slate-200">
              <div className="bg-slate-50 p-6 rounded-2xl border border-slate-200">
                <p className="text-xs font-black text-emerald-700 uppercase tracking-widest mb-3 flex items-center">
                  <User className="w-4 h-4 mr-2 text-emerald-600" /> YOUR POSITION
                </p>
                <div className="flex items-baseline">
                  <span className="text-6xl sm:text-7xl font-black text-slate-900 tabular-nums tracking-tighter">
                    {userPosition}
                  </span>
                  <span className="text-2xl sm:text-3xl text-slate-400 font-extrabold ml-3 tabular-nums">
                    / {Math.max(1, totalInQueue)}
                  </span>
                </div>
                <p className="text-xs font-semibold text-slate-500 mt-3 pt-3 border-t border-slate-200">
                  Your Token #: <span className="text-slate-900 font-bold">{myTokenNumber}</span> • Serving Token #: <span className="text-emerald-700 font-bold">{currentToken}</span>
                </p>
              </div>

              <div className="bg-slate-50 p-6 rounded-2xl border border-slate-200 flex flex-col justify-center">
                <p className="text-xs font-black text-teal-700 uppercase tracking-widest mb-3 flex items-center">
                  <Clock className="w-4 h-4 mr-2 text-teal-600" /> ESTIMATED WAIT
                </p>
                <div className="text-5xl sm:text-6xl font-black text-teal-600 flex items-baseline tabular-nums tracking-tight">
                  {isMyTurn ? 0 : estimatedWait} <span className="text-2xl font-bold ml-2.5 text-teal-700">mins</span>
                </div>
                <p className="text-xs font-semibold text-slate-500 mt-3 pt-3 border-t border-slate-200">
                  Clinic Consultation Speed: <span className="text-slate-800 font-bold">{ownerConsultationMins}m</span> / patient
                </p>
              </div>
            </div>

            <div className="relative mb-10 pt-2">
              <div className="flex justify-between text-xs font-black text-slate-400 uppercase tracking-widest mb-3">
                <span>START</span>
                <span>YOUR TURN</span>
              </div>
              <div className="h-4 w-full bg-slate-100 rounded-full overflow-hidden relative p-0.5 border border-slate-200">
                <div
                  className={`h-full rounded-full transition-all duration-1000 ease-out relative ${
                    isMyTurn
                      ? 'bg-gradient-to-r from-emerald-500 via-teal-500 to-emerald-400 shadow-[0_0_20px_rgba(16,185,129,0.5)]'
                      : 'bg-gradient-to-r from-teal-500 via-emerald-500 to-cyan-500 shadow-[0_0_15px_rgba(16,185,129,0.3)]'
                  }`}
                  style={{ width: `${progressPercent}%` }}
                >
                  <div className="absolute inset-0 bg-white/30 w-1/3 -skew-x-12 animate-[shimmer_2s_infinite]" />
                </div>
              </div>

              <div
                className="absolute top-8 -ml-4 transition-all duration-1000 ease-out flex flex-col items-center pointer-events-none"
                style={{ left: `${progressPercent}%` }}
              >
                <div className={`border-4 rounded-full w-8 h-8 shadow-md flex items-center justify-center relative ${
                  isMyTurn ? 'bg-white border-emerald-500' : 'bg-white border-teal-500'
                }`}>
                  <span className={`w-2.5 h-2.5 rounded-full animate-ping absolute ${isMyTurn ? 'bg-emerald-500' : 'bg-teal-500'}`} />
                  <span className={`w-2.5 h-2.5 rounded-full relative z-10 ${isMyTurn ? 'bg-emerald-500' : 'bg-teal-500'}`} />
                </div>
              </div>
            </div>

            {prescriptionStatus === 'issued' ? (
              <div className="mb-8 p-6 bg-gradient-to-r from-emerald-500 to-teal-600 text-white rounded-2xl shadow-xl">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <span className="inline-block px-3 py-1 bg-white/20 rounded-full text-xs font-black uppercase tracking-wider mb-2">Prescription Issued ✓</span>
                    <h4 className="text-xl font-black">Your Prescription is Ready!</h4>
                    <p className="text-sm text-emerald-100 font-medium mt-1">Your official clinic prescription from {selectedQueue.name} is now available.</p>
                  </div>
                  <button onClick={() => setViewingPrescriptionId(prescriptionId)} className="px-5 py-2.5 bg-white text-emerald-800 font-extrabold text-sm rounded-xl shadow-lg hover:bg-emerald-50 transition-all cursor-pointer">
                    View Prescription →
                  </button>
                </div>
                <div className="mt-4 pt-4 border-t border-emerald-400/30">
                  <button onClick={() => router.push('/healthcare?tab=prescriptions')} className="text-emerald-100 hover:text-white text-sm font-bold flex items-center transition-colors cursor-pointer">
                    <FileText className="w-4 h-4 mr-2" /> View All Prescriptions in My Prescription
                  </button>
                </div>
              </div>
            ) : prescriptionStatus === 'draft' ? (
              <div className="mb-8 p-4 bg-yellow-50 border-l-4 border-yellow-500 rounded-xl flex items-start text-yellow-900 shadow-sm">
                <FileText className="w-5 h-5 text-yellow-500 mr-3 mt-0.5 shrink-0" />
                <div>
                  <h4 className="font-bold">Prescription: 🟡 Preparing</h4>
                  <p className="text-sm font-medium text-yellow-800">Doctor is currently preparing your digital prescription.</p>
                </div>
              </div>
            ) : (liveCompleted || entryStatus === 'completed') ? (
              <div className="mb-8 p-4 bg-rose-50 border-l-4 border-rose-500 rounded-xl flex items-start text-rose-900 shadow-sm">
                <FileText className="w-5 h-5 text-rose-500 mr-3 mt-0.5 shrink-0" />
                <div>
                  <h4 className="font-bold">Prescription: 🔴 Not Issued</h4>
                  <p className="text-sm font-medium text-rose-800">Doctor consultation completed. Awaiting official doctor validation and prescription issuance.</p>
                </div>
              </div>
            ) : (
              <div className="mb-8 p-4 bg-slate-50 border-l-4 border-slate-400 rounded-xl flex items-start text-slate-700 shadow-sm">
                <FileText className="w-5 h-5 text-slate-500 mr-3 mt-0.5 shrink-0" />
                <div>
                  <h4 className="font-bold">Prescription: ⏳ Waiting for doctor consultation</h4>
                  <p className="text-sm font-medium text-slate-600">Your prescription will be prepared and issued by the doctor after consultation.</p>
                </div>
              </div>
            )}

            {isLate && (
              <div className="mb-8 p-4 bg-amber-50 border-l-4 border-amber-500 rounded-xl flex items-start text-amber-900">
                <AlertCircle className="w-5 h-5 text-amber-500 mr-3 mt-0.5 shrink-0" />
                <p className="text-sm font-medium">
                  We notified the clinic that you are running <strong>{lateMinutes} minutes</strong> late. Your position is preserved.
                </p>
              </div>
            )}

            {entryStatus === 'in_consultation' && (
              <div className="mb-8 p-4 bg-blue-50 border-l-4 border-blue-500 rounded-xl flex items-start text-blue-900">
                <CheckCircle2 className="w-5 h-5 text-blue-500 mr-3 mt-0.5 shrink-0" />
                <p className="text-sm font-bold">You are currently in consultation. Please wait — the doctor will see you shortly.</p>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
              <button
                onClick={handleRunningLate}
                disabled={isLate || isClosed || isMyTurn || entryStatus === 'in_consultation'}
                className="flex items-center justify-center p-4 rounded-2xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white font-extrabold text-base shadow-md transition-all disabled:opacity-50 cursor-pointer"
              >
                <Navigation className="w-5 h-5 mr-3 text-white fill-white/20" />
                <span>Running Late</span>
              </button>

              <button
                onClick={handleLeaveQueue}
                disabled={isMyTurn || entryStatus === 'in_consultation'}
                className="flex items-center justify-center p-4 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-extrabold text-base shadow-sm border border-slate-200 transition-all disabled:opacity-50 cursor-pointer"
              >
                <ArrowLeft className="w-5 h-5 mr-3 text-slate-700" />
                <span>Leave Queue</span>
              </button>

              <button
                onClick={handleCancelVisit}
                className="flex items-center justify-center p-4 rounded-2xl bg-rose-50 hover:bg-rose-100 text-rose-700 font-extrabold text-base border border-rose-200 shadow-sm transition-all cursor-pointer"
              >
                <XCircle className="w-5 h-5 mr-3 text-rose-600" />
                <span>Cancel Visit</span>
              </button>
            </div>
          </div>

          <div className="mt-8 flex flex-wrap items-center justify-between gap-4 px-2">
            <button
              onClick={() => setView('list')}
              className="flex items-center text-teal-700 hover:text-teal-800 font-bold text-sm transition-colors cursor-pointer"
            >
              <ChevronRight className="w-4 h-4 mr-1 rotate-180" />
              View All Other Healthcare Queues
            </button>

            <div className="flex items-center space-x-6 text-sm font-semibold text-slate-600">
              <button className="flex items-center hover:text-slate-900 transition-colors cursor-pointer">
                <Phone className="w-4 h-4 mr-2 text-teal-600" /> Call Clinic
              </button>
              <button className="flex items-center hover:text-slate-900 transition-colors cursor-pointer">
                <Bell className="w-4 h-4 mr-2 text-emerald-600" /> Notifications
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
    <div className="min-h-screen bg-gradient-to-b from-slate-50 via-white to-slate-50 text-slate-900 flex flex-col font-sans relative">
      <Navbar3D />

      <div
        className="absolute top-0 left-1/2 -translate-x-1/2 w-[1100px] h-[550px] pointer-events-none z-0"
        style={{
          background: "radial-gradient(ellipse at top, rgba(16, 185, 129, 0.12) 0%, rgba(6, 182, 212, 0.06) 45%, transparent 70%)",
          filter: "blur(110px)",
        }}
      />

      {/* Customer Healthcare Hub Navigation */}
      <div className="relative z-20 pt-20 sm:pt-24 px-3 sm:px-6 mb-6 sm:mb-8">
        <div className="max-w-6xl mx-auto flex items-center justify-center">
          <div className="w-full sm:w-auto overflow-x-auto no-scrollbar py-1 px-1 flex justify-start sm:justify-center">
            <div className="inline-flex items-center gap-1 sm:gap-2 p-1 sm:p-1.5 bg-white/95 backdrop-blur-md rounded-2xl border border-slate-200/90 shadow-md shrink-0">
              <button
                type="button"
                onClick={() => {
                  setCustomerNav('find');
                  if (view === 'ticket' && (!selectedQueue || entryStatus === 'completed' || isCancelled)) {
                    setView('list');
                  }
                }}
                className={`shrink-0 flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer whitespace-nowrap ${
                  customerNav === 'find' && view === 'list'
                    ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-sm'
                    : 'text-slate-700 hover:text-slate-900 hover:bg-slate-100'
                }`}
              >
                <Stethoscope className="w-4 h-4 shrink-0" />
                <span>Find Clinic<span className="hidden sm:inline">/Doctor</span></span>
              </button>

              <button
                type="button"
                onClick={() => {
                  if (selectedQueue && !isCancelled && !liveCompleted && entryStatus !== 'completed' && myTokenNumber > 0) {
                    setView('ticket');
                  } else {
                    setView('list');
                  }
                  setCustomerNav('queue');
                }}
                className={`shrink-0 flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer whitespace-nowrap ${
                  (customerNav === 'queue' || view === 'ticket') && customerNav !== 'prescriptions'
                    ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-sm'
                    : 'text-slate-700 hover:text-slate-900 hover:bg-slate-100'
                }`}
              >
                <Clock className="w-4 h-4 shrink-0" />
                <span>Live Queue</span>
                {selectedQueue && !isCancelled && !liveCompleted && entryStatus !== 'completed' && myTokenNumber > 0 && (
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                )}
              </button>

              <button
                type="button"
                onClick={() => setCustomerNav('appointments')}
                className={`shrink-0 flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer whitespace-nowrap ${
                  customerNav === 'appointments' && view === 'list'
                    ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-sm'
                    : 'text-slate-700 hover:text-slate-900 hover:bg-slate-100'
                }`}
              >
                <Calendar className="w-4 h-4 shrink-0" />
                <span>Appointments</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setView('list');
                  setCustomerNav('prescriptions');
                }}
                className={`shrink-0 flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer whitespace-nowrap ${
                  customerNav === 'prescriptions'
                    ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-sm'
                    : 'text-slate-700 hover:text-slate-900 hover:bg-slate-100'
                }`}
              >
                <FileText className="w-4 h-4 shrink-0" />
                <span><span className="hidden sm:inline">My </span>Prescriptions</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {customerNav === 'prescriptions' ? (
        <div className="relative z-10 flex-1">
          <CustomerPrescriptionCenter
            initialPrescriptionId={selectedPrescriptionId}
            onSelectClinicForBooking={(targetId, targetName) => {
              setBookingTarget({ id: targetId, name: targetName, allowAppointments: true });
            }}
          />
        </div>
      ) : customerNav === 'appointments' ? (
        <div className="relative z-10 max-w-6xl mx-auto w-full px-4 sm:px-6 pt-8 pb-20 flex-1">
          <div className="text-center mb-8">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-teal-50 text-teal-800 text-xs font-black uppercase tracking-wider mb-2 border border-teal-200">
              <Calendar className="w-3.5 h-3.5 text-teal-600" />
              Doctor Appointments
            </div>
            <h2 className="text-2xl sm:text-4xl font-black text-slate-900 tracking-tight">
              Schedule Clinic Visits
            </h2>
            <p className="text-xs sm:text-sm text-slate-600 font-medium mt-1 max-w-md mx-auto">
              Book doctor consultations in advance with verified healthcare providers near you.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5 sm:gap-7">
            {queues
              .filter((q) => q.allowAppointments !== 0 && q.allowAppointments !== false)
              .map((item) => (
                <div
                  key={item.id}
                  className="bg-white border border-slate-200 hover:border-emerald-500/40 rounded-3xl p-5 sm:p-7 transition-all duration-300 shadow-sm hover:shadow-md flex flex-col justify-between"
                >
                  <div className="flex items-start gap-3.5 mb-4">
                    <div className="w-11 h-11 rounded-2xl bg-teal-50 border border-teal-200 flex items-center justify-center text-teal-600 shrink-0">
                      <Stethoscope className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="text-lg font-black text-slate-900 leading-tight">{item.name}</h3>
                      <p className="text-xs text-slate-500 mt-0.5">{item.address}</p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setBookingTarget({ id: String(item.id), name: item.name, allowAppointments: true })}
                    className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-xs sm:text-sm flex items-center justify-center gap-1.5 shadow-sm cursor-pointer transition-all"
                  >
                    <Calendar className="w-4 h-4" />
                    <span>Book Appointment</span>
                  </button>
                </div>
              ))}
          </div>
        </div>
      ) : (
        <>

      <div className="relative z-10 pt-24 sm:pt-28 pb-6 sm:pb-10 px-4 sm:px-6">
        <div className="max-w-6xl mx-auto flex flex-col items-center text-center">
          {selectedQueue && !isCancelled && !liveCompleted && entryStatus !== 'completed' && myTokenNumber > 0 && (
            <div className="mb-6 w-full max-w-2xl">
              <button
                type="button"
                onClick={() => setView('ticket')}
                className="w-full flex flex-col gap-3 p-4 sm:p-4.5 rounded-3xl bg-white/95 backdrop-blur-sm border-2 border-emerald-300 hover:border-emerald-500 text-slate-900 transition-all shadow-md hover:shadow-lg shadow-emerald-600/5 cursor-pointer group text-left"
              >
                {/* Header Row: Pass Label, Clinic Name & CTA */}
                <div className="w-full flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="w-8 h-8 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-600 shrink-0">
                      <Sparkles className="w-4 h-4 animate-pulse" />
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-[11px] font-extrabold uppercase tracking-wider text-emerald-700">
                          Active Live Pass
                        </span>
                        <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-[9px] font-black bg-emerald-100 text-emerald-800 border border-emerald-300/80">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping mr-1" />
                          LIVE
                        </span>
                      </div>
                      <div className="text-sm sm:text-base font-black text-slate-900 truncate">
                        {selectedQueue.name}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 text-xs font-black uppercase px-3.5 py-1.5 rounded-xl bg-emerald-600 text-white shrink-0 group-hover:bg-emerald-500 transition-colors shadow-sm">
                    <span>View Pass</span>
                    <ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
                  </div>
                </div>

                {/* Rich Live Telemetry Badges Strip */}
                <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-100">
                  {/* Token Number Badge */}
                  <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-50 border border-emerald-200/90 text-emerald-900 text-xs font-extrabold">
                    <span className="text-[10px] font-black text-emerald-600 uppercase tracking-wide">Token</span>
                    <span className="font-black text-emerald-950">#{String(myTokenNumber || 1).padStart(2, '0')}</span>
                  </div>

                  {/* Position Badge */}
                  <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-teal-50 border border-teal-200/90 text-teal-900 text-xs font-extrabold">
                    <span className="text-[10px] font-black text-teal-600 uppercase tracking-wide">Pos</span>
                    <span className="font-black text-teal-950">#{userPosition || 1}</span>
                  </div>

                  {/* Estimated Wait Badge */}
                  <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-cyan-50 border border-cyan-200/90 text-cyan-900 text-xs font-extrabold">
                    <Clock className="w-3 h-3 text-cyan-600 shrink-0" />
                    <span className="font-black text-cyan-950">
                      ~{entryStatus === 'called' || (currentToken === myTokenNumber && myTokenNumber > 0) ? 0 : estimatedWait} min wait
                    </span>
                  </div>

                  {/* Current Serving Token Badge */}
                  <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-100 border border-slate-200 text-slate-700 text-xs font-extrabold sm:ml-auto">
                    <Activity className="w-3 h-3 text-slate-500 shrink-0" />
                    <span className="font-black text-slate-800">
                      Serving #{String(currentToken || 0).padStart(2, '0')}
                    </span>
                  </div>
                </div>
              </button>
            </div>
          )}

          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-extrabold uppercase tracking-wider mb-4 shadow-sm">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
            <span>VERIFIED CARE NETWORK</span>
          </div>

          <h2 className="text-3xl sm:text-5xl lg:text-6xl font-black text-slate-900 tracking-tight leading-[1.12] max-w-3xl">
            Local care,{" "}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-600">
              without the waiting room.
            </span>
          </h2>

          <p className="text-slate-600 text-sm sm:text-lg font-normal mt-4 max-w-2xl leading-relaxed">
            Select a verified clinic, OPD, or diagnostic lab near you. Join live queues remotely and arrive right on time.
          </p>

          <div className="mt-8 w-full max-w-2xl flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
            <div className="flex-1 relative flex items-center">
              <Search className="w-4 h-4 text-emerald-600 absolute left-4 z-10 pointer-events-none" />
              <input
                type="text"
                value={searchQuery}
                onChange={handleSearchChange}
                placeholder="Search clinic, doctor, specialty, area..."
                style={{ paddingLeft: "42px", paddingRight: "14px", color: "#0f172a", backgroundColor: "#ffffff" }}
                className="w-full bg-white border border-slate-300 rounded-2xl py-3.5 text-slate-900 placeholder:text-slate-500 font-medium focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 transition-all text-sm shadow-sm"
              />
            </div>

            <button
              type="button"
              onClick={() => setShowUniversalScanner(true)}
              className="py-3.5 px-4 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-md shadow-emerald-600/20 transition-all cursor-pointer shrink-0"
              title="Scan any clinic QR code or enter queue code"
            >
              <QrCode className="w-4 h-4 text-white shrink-0" />
              <span>Universal QR Scanner</span>
            </button>

            <PushNotificationManager />
          </div>
        </div>
      </div>

      {errorMsg && (
        <div className="max-w-6xl mx-auto px-4 sm:px-6 mb-4 relative z-10">
          <div className="p-4 bg-rose-50 border border-rose-200 rounded-2xl flex items-center justify-between text-rose-800 shadow-sm">
            <div className="flex items-center space-x-2.5 min-w-0">
              <AlertTriangle className="w-4 h-4 text-rose-500 shrink-0" />
              <span className="font-bold text-xs sm:text-sm truncate">{errorMsg}</span>
            </div>
            <button onClick={() => setErrorMsg(null)} className="text-rose-600 hover:text-rose-800 font-bold text-base cursor-pointer ml-2">×</button>
          </div>
        </div>
      )}

      <div className="max-w-6xl mx-auto w-full px-4 sm:px-6 pb-20 flex-1 relative z-10">
        <div className="flex items-center justify-start sm:justify-center gap-2.5 overflow-x-auto pb-4 mb-8 no-scrollbar">
          {renderedCategoryFilters}
        </div>

        <div className={`grid grid-cols-1 ${filteredQueues.length === 1 ? 'max-w-2xl mx-auto' : 'md:grid-cols-2 max-w-5xl mx-auto'} gap-6 sm:gap-8`}>
          {renderedQueuesGrid}
        </div>
      </div>
      </>
      )}
    </div>

    {bookingTarget && (
      <div
        className="apptOverlay"
        onClick={(e) => { if (e.target === e.currentTarget) setBookingTarget(null); }}
      >
        <div className="apptSheet">
          <AppointmentBooking
            storeId={bookingTarget.id}
            storeName={bookingTarget.name}
            allowAppointments={bookingTarget.allowAppointments}
            onClose={() => setBookingTarget(null)}
            onCheckedIn={(tokenNumber) => {
              setBookingTarget(null);
              if (selectedQueue && String(selectedQueue.id) === bookingTarget.id) {
                setMyTokenNumber(tokenNumber);
                setView('ticket');
              }
            }}
          />
        </div>
      </div>
    )}

    {qrTarget && (
      <ClinicQrModal
        storeId={qrTarget.id}
        storeName={qrTarget.name}
        storeSlug={qrTarget.slug}
        onClose={() => setQrTarget(null)}
        onSuccess={(tokenNumber) => {
          setQrTarget(null);
          setMyTokenNumber(tokenNumber);
          const match = queues.find((q) => String(q.id) === qrTarget.id || q.slug === qrTarget.slug);
          if (match) setSelectedQueue(match);
          setEntryStatus('waiting');
          setView('ticket');
          void syncPatientStateWithStore(qrTarget.id);
        }}
      />
    )}

    {showUniversalScanner && (
      <UniversalHealthcareQrScanner
        onClose={() => setShowUniversalScanner(false)}
        onSuccess={(tokenNumber, queueState, storeId) => {
          setShowUniversalScanner(false);
          setMyTokenNumber(tokenNumber);
          if (storeId) {
            const match = queues.find((q) => String(q.id) === String(storeId));
            if (match) setSelectedQueue(match);
            void syncPatientStateWithStore(storeId);
          }
          const validStatus = (queueState?.entry?.status as any) || 'waiting';
          setEntryStatus(validStatus === 'arrived' ? 'waiting' : validStatus);
          setView('ticket');
        }}
      />
    )}

    {viewingPrescriptionId && (
      <div className="fixed inset-0 z-[9999] bg-slate-900/60 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-6" onClick={(e) => { if (e.target === e.currentTarget) setViewingPrescriptionId(null); }}>
        <div className="bg-white rounded-t-3xl sm:rounded-3xl shadow-2xl w-full max-w-5xl h-[95vh] sm:h-[90vh] flex flex-col overflow-hidden relative animate-in slide-in-from-bottom-8 sm:zoom-in-95 duration-200">
            <div className="flex-shrink-0 flex items-center justify-between p-4 border-b border-slate-100 bg-slate-50/80">
                <h3 className="text-lg font-black text-slate-900">Digital Prescription</h3>
                <button onClick={() => setViewingPrescriptionId(null)} className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full cursor-pointer transition-colors">
                    <XCircle className="w-6 h-6" />
                </button>
            </div>
            <div className="flex-1 overflow-y-auto bg-slate-50 relative p-4">
               <CustomerPrescriptionCenter initialPrescriptionId={viewingPrescriptionId} />
            </div>
        </div>
      </div>
    )}

    </>
  );
}


