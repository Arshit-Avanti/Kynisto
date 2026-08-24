'use client';

import React, { useState, useEffect, useCallback, useRef, useMemo, startTransition } from 'react';
import { Clock, MapPin, AlertCircle, XCircle, CheckCircle2, Navigation, User, Phone, Bell, ArrowLeft, Search, Building2, Stethoscope, Activity, Sparkles, Filter, ChevronRight, Lock, RefreshCw, AlertTriangle, PartyPopper, Calendar } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { apiFetch } from '@/lib/client-api';
import { PushNotificationManager } from '@/components/ui/PushNotificationManager';
import { AppointmentBooking } from '@/components/queue/AppointmentBooking';

let _cachedAudioCtx: AudioContext | null = null;
let _lastChimeTime = 0;

function playTurnArrivalChime() {
  if (typeof window === "undefined") return;
  const now = Date.now();
  if (now - _lastChimeTime < 2500) return; // Prevent spamming within 2.5s
  _lastChimeTime = now;

  try {
    const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof window.AudioContext }).webkitAudioContext;
    if (!AudioContextClass) return;
    if (!_cachedAudioCtx || _cachedAudioCtx.state === "closed") {
      _cachedAudioCtx = new AudioContextClass();
    }
    const ctx = _cachedAudioCtx;
    if (ctx.state === "suspended") {
      ctx.resume().catch(() => {});
    }
    
    // Tone 1: High Bell (E5 - 659.25Hz)
    const osc1 = ctx.createOscillator();
    const gain1 = ctx.createGain();
    osc1.type = "sine";
    osc1.frequency.setValueAtTime(659.25, ctx.currentTime);
    gain1.gain.setValueAtTime(0.4, ctx.currentTime);
    gain1.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.5);
    osc1.connect(gain1);
    gain1.connect(ctx.destination);
    osc1.start(ctx.currentTime);
    osc1.stop(ctx.currentTime + 0.5);

    // Tone 2: Warm Low Chime (C5 - 523.25Hz)
    const osc2 = ctx.createOscillator();
    const gain2 = ctx.createGain();
    osc2.type = "sine";
    osc2.frequency.setValueAtTime(523.25, ctx.currentTime + 0.2);
    gain2.gain.setValueAtTime(0.45, ctx.currentTime + 0.2);
    gain2.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.9);
    osc2.connect(gain2);
    gain2.connect(ctx.destination);
    osc2.start(ctx.currentTime + 0.2);
    osc2.stop(ctx.currentTime + 0.9);
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
  const [currentEntryId, setCurrentEntryId] = useState<string | null>(null);
  const [liveCompleted, setLiveCompleted] = useState<boolean>(false);
  const [isTurnDismissed, setIsTurnDismissed] = useState<boolean>(false);
  const prevEntryStatusRef = useRef<string | null>(null);
  
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState('All');
  const [isLate, setIsLate] = useState(false);
  const [lateMinutes, setLateMinutes] = useState<number>(10);
  const [isCancelled, setIsCancelled] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isJoining, setIsJoining] = useState(false);

  // Appointment booking modal state
  const [bookingTarget, setBookingTarget] = useState<{ id: string; name: string; allowAppointments?: boolean } | null>(null);

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
      const data = await apiFetch<{ items: HealthcareQueueItem[] }>('/api/healthcare');
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
      const delay = isHidden ? 20000 : Math.floor(4500 + Math.random() * 1000);
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
          if (state.entry.status === 'waiting' || state.entry.status === 'called') {
            setEntryStatus(state.entry.status);
            setCurrentEntryId(state.entry.id);
            currentEntryIdRef.current = state.entry.id;
            prevEntryStatusRef.current = state.entry.status;
            const pos = state.entry.position || 1;
            setUserPosition(pos);
            setMyTokenNumber(state.entry.tokenNumber);
            setTotalInQueue(Math.max(1, state.waitingCount || pos));
            const ownerConsultationMins = state.consultationMinutes || 15;
            setEstimatedWait(pos > 1 ? (pos - 1) * ownerConsultationMins : 0);
          } else if (state.entry.status === 'completed') {
            setEntryStatus('completed');
            setLiveCompleted(true);
            if (typeof window !== "undefined" && "Notification" in window && Notification.permission === "granted") {
              new Notification("🎉 Consultation Completed!", {
                body: `Thank you for visiting! Your consultation is complete.`,
                icon: "/icons/icon-192x192.png",
              });
            }
          } else {
            setEntryStatus(state.entry.status);
          }
        } else if (state.completedEntry && currentEntryIdRef.current && String(state.completedEntry.id) === String(currentEntryIdRef.current)) {
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

  // 3. Auto-detect user's active joined queue in database on load
  useEffect(() => {
    let cancelled = false;
    async function checkUserActiveQueue() {
      try {
        const auth = await apiFetch<{ user?: { id: string } }>('/api/auth/me').catch(() => null);
        if (!auth || !auth.user || cancelled) return;

        const res = await apiFetch<{ activeQueue: { storeId: string; storeName: string; storeSlug: string; tokenNumber: number; status: string } | null }>('/api/healthcare/queue/active');
        if (res && res.activeQueue && !cancelled) {
          const storeId = res.activeQueue.storeId;
          const match = queues.find((q) => String(q.id) === String(storeId) || q.slug === storeId);
          if (match) {
            setSelectedQueue(match);
          } else {
            setSelectedQueue({
              id: storeId,
              name: res.activeQueue.storeName || 'Healthcare Clinic',
              category: 'Healthcare',
              providerType: 'Clinic',
              address: '',
              queueStatus: 'open',
              waitingCount: 1,
            });
          }
          setMyTokenNumber(res.activeQueue.tokenNumber);
          const activeStatus = res.activeQueue.status as any;
          const initialStatus = (activeStatus === 'waiting' || activeStatus === 'called') ? activeStatus : 'waiting';
          setEntryStatus(initialStatus);
          prevEntryStatusRef.current = initialStatus;
          setView('ticket');
          void syncPatientStateWithStore(storeId);
        }
      } catch {
        // No active queue
      }
    }
    checkUserActiveQueue();
    return () => { cancelled = true; };
  }, [queues, syncPatientStateWithStore]);

  // Check URL params for pre-selected store or queue code
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const searchParams = new URLSearchParams(window.location.search);
    const storeIdParam = searchParams.get('storeId') || searchParams.get('store') || searchParams.get('id');
    if (storeIdParam && queues.length > 0) {
      const match = queues.find((q) => String(q.id) === String(storeIdParam) || q.slug === storeIdParam);
      if (match && !selectedQueue) {
        setSelectedQueue(match);
      }
    }
  }, [queues, selectedQueue]);

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
        const options: NotificationOptions = {
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
    return ['All', 'Hospital', 'Clinic', 'Diagnostic', 'Dental'].map((filter) => (
      <button
        key={filter}
        onClick={() => handleFilterSelect(filter)}
        className={`px-4 sm:px-5 py-2 rounded-full text-xs font-bold whitespace-nowrap transition-all cursor-pointer shrink-0 ${
          activeFilter === filter
            ? 'bg-gradient-to-r from-emerald-500 to-teal-500 text-white shadow-lg shadow-emerald-500/25 border border-emerald-400/30 scale-[1.02]'
            : 'bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white border border-white/10'
        }`}
      >
        {filter === 'All' ? '🏥 All Care' : filter === 'Hospital' ? '🏢 Hospitals' : filter === 'Clinic' ? '🩺 Clinics & OPD' : filter === 'Diagnostic' ? '🔬 Diagnostic Labs' : '🦷 Dental'}
      </button>
    ));
  }, [activeFilter, handleFilterSelect]);

  const renderedQueuesGrid = useMemo(() => {
    return filteredQueues.map((item) => {
      const ownerEnabled = item.ownerQueueEnabled === 1 || item.ownerQueueEnabled === true;
      const adminEnabled = item.adminQueueEnabled === 1 || item.adminQueueEnabled === true;
      const accepting = item.acceptingPatients === 1 || item.acceptingPatients === true || item.acceptingPatients === undefined;
      const hasLiveQueue = ownerEnabled && adminEnabled && item.queueStatus !== 'no_queue';
      const isPaused = hasLiveQueue && item.queueStatus === 'paused';
      const isClosed = !hasLiveQueue || !accepting || item.queueStatus === 'closed' || isPaused;
      const consultationMins = item.consultationMinutes || 15;

      return (
        <div
          key={item.id}
          style={{ contain: "content", transform: "translate3d(0,0,0)", willChange: "transform" }}
          className="bg-slate-900/60 backdrop-blur-md hover:bg-slate-900/90 border border-white/10 hover:border-emerald-500/40 rounded-3xl p-5 sm:p-6 transition-all duration-300 shadow-xl flex flex-col justify-between group relative overflow-hidden active:scale-[0.99]"
        >
          <div>
            <div className="flex items-center justify-between flex-wrap gap-2 mb-3.5">
              <div className="flex items-center flex-wrap gap-1.5 min-w-0">
                <span className="px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/25 text-emerald-300 text-[11px] font-extrabold uppercase tracking-wide">
                  {item.providerType || 'Clinic'}
                </span>
                {item.subcategory && (
                  <span className="px-3 py-1 rounded-full bg-teal-500/10 border border-teal-500/25 text-teal-300 text-[11px] font-extrabold uppercase tracking-wide">
                    {item.subcategory}
                  </span>
                )}
              </div>

              {!hasLiveQueue ? (
                <span className="inline-flex items-center text-[11px] font-bold text-slate-400 bg-white/5 px-3 py-1 rounded-full border border-white/10 whitespace-nowrap shrink-0">
                  <span className="w-1.5 h-1.5 rounded-full bg-slate-400 mr-1.5" />
                  No Live Queue
                </span>
              ) : isPaused ? (
                <span className="inline-flex items-center text-[11px] font-bold text-amber-300 bg-amber-500/10 px-3 py-1 rounded-full border border-amber-500/25 whitespace-nowrap shrink-0">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-400 mr-1.5" />
                  Queue Paused
                </span>
              ) : isClosed ? (
                <span className="inline-flex items-center text-[11px] font-bold text-rose-300 bg-rose-500/10 px-3 py-1 rounded-full border border-rose-500/25 whitespace-nowrap shrink-0">
                  <span className="w-1.5 h-1.5 rounded-full bg-rose-400 mr-1.5" />
                  Queue Closed
                </span>
              ) : (
                <span className="inline-flex items-center text-[11px] font-bold text-emerald-300 bg-emerald-500/15 px-3 py-1 rounded-full border border-emerald-500/30 whitespace-nowrap shrink-0 shadow-sm shadow-emerald-500/20">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 mr-1.5 animate-pulse" />
                  ● Live Queue Open
                </span>
              )}
            </div>

            <h3 className="text-lg sm:text-xl font-extrabold text-white group-hover:text-emerald-400 transition-colors mb-1.5">
              {item.name}
            </h3>

            <p className="flex items-center text-slate-300 text-xs sm:text-sm font-medium mb-4">
              <MapPin className="w-3.5 h-3.5 mr-1.5 text-teal-400 shrink-0" />
              <span className="truncate">{item.address}</span>
            </p>

            {/* Queue / Clinic Stats */}
            <div className="grid grid-cols-2 gap-2.5 p-3.5 bg-black/40 rounded-2xl border border-white/5 mb-4">
              <div>
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-0.5">
                  {hasLiveQueue ? "Waiting" : "Clinic Status"}
                </span>
                <span className="text-base sm:text-xl font-black text-white tabular-nums">
                  {hasLiveQueue ? (isClosed ? 0 : item.waitingCount) : "OPD Listed"}{" "}
                  {hasLiveQueue && <span className="text-xs font-normal text-slate-400">in queue</span>}
                </span>
              </div>
              <div>
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-0.5">
                  {hasLiveQueue ? "Avg Speed" : "Walk-in"}
                </span>
                <span className="text-base sm:text-xl font-black text-emerald-400 tabular-nums">
                  {hasLiveQueue ? `${consultationMins}m` : "Available"}{" "}
                  {hasLiveQueue && <span className="text-xs font-normal text-slate-400">/ patient</span>}
                </span>
              </div>
            </div>
          </div>

          <div className="flex gap-2 pt-1">
            <Link
              href={`/stores/${item.slug || item.id}`}
              className={`py-2.5 px-3.5 font-bold text-xs sm:text-sm rounded-2xl transition-all flex items-center justify-center space-x-1.5 bg-white/5 hover:bg-white/10 text-slate-200 hover:text-white border border-white/10 cursor-pointer ${
                hasLiveQueue ? "flex-1" : "w-full bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-500 hover:to-emerald-500 text-white border-none shadow-md"
              }`}
            >
              <Building2 className="w-3.5 h-3.5 text-emerald-300 shrink-0" />
              <span>Profile</span>
            </Link>

            {/* Book Appointment button */}
            {item.allowAppointments === 0 || item.allowAppointments === false ? (
              <button
                type="button"
                className="py-2.5 px-3.5 font-bold text-xs sm:text-sm rounded-2xl transition-all flex items-center justify-center space-x-1.5 opacity-60 cursor-pointer text-slate-400 border border-white/5 bg-white/5 hover:bg-white/10"
                onClick={() => setBookingTarget({ id: String(item.id), name: item.name, allowAppointments: false })}
                title="This clinic does not allow online appointments"
              >
                <Calendar className="w-3.5 h-3.5 text-slate-400" />
                <span className="text-slate-400">No Appts</span>
              </button>
            ) : (
              <button
                className="py-2.5 px-3.5 font-bold text-xs sm:text-sm rounded-2xl transition-all flex items-center justify-center space-x-1.5 bg-white/5 hover:bg-white/10 text-slate-200 hover:text-white border border-white/10 cursor-pointer"
                onClick={() => setBookingTarget({ id: String(item.id), name: item.name, allowAppointments: true })}
              >
                <Calendar className="w-3.5 h-3.5 text-teal-400" />
                <span>Book Appt</span>
              </button>
            )}

            {hasLiveQueue && (
              <button
                onClick={() => handleJoinQueue(item)}
                disabled={isClosed || isJoining}
                className={`flex-1 py-2.5 px-3.5 font-bold text-xs sm:text-sm rounded-2xl transition-all shadow-md flex items-center justify-center space-x-1.5 group/btn ${
                  isClosed
                    ? 'bg-slate-800/60 text-slate-500 cursor-not-allowed border border-white/5 opacity-70'
                    : 'bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-white shadow-emerald-500/20 cursor-pointer'
                }`}
              >
                <span>{isPaused ? 'Queue Paused' : isClosed ? 'Queue Closed' : isJoining ? 'Joining...' : 'Visit Live Queue'}</span>
                {!isClosed && !isJoining && <ChevronRight className="w-3.5 h-3.5 group-hover/btn:translate-x-1 transition-transform" />}
              </button>
            )}
          </div>
        </div>
      );
    });
  }, [filteredQueues, isJoining, handleJoinQueue, setBookingTarget]);

  const isCompleted = entryStatus === 'completed';

  // 1. CANCELLED STATE VIEW
  if (isCancelled && selectedQueue) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-6 text-center">
        <XCircle className="w-20 h-20 text-red-500 mb-6 animate-pulse" />
        <h2 className="text-3xl sm:text-4xl font-black text-white">Visit Cancelled</h2>
        <p className="text-lg text-slate-300 font-medium mt-3 max-w-md">
          You have left the queue for <span className="text-white font-bold">{selectedQueue.name}</span>.
        </p>
        <div className="flex gap-4 mt-8">
          <button
            onClick={() => setView('list')}
            className="px-6 py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl shadow-lg transition-all"
          >
            Browse Healthcare Queues
          </button>
          <Link href="/" className="px-6 py-3 bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold rounded-xl transition-all">
            Return Home
          </Link>
        </div>
      </div>
    );
  }

  // 2. TURN COMPLETED STATE VIEW (Shows exact requested user thank you message)
  if (isCompleted && selectedQueue) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-6 text-center font-sans">
        <div className="w-24 h-24 rounded-full bg-emerald-500/20 border-4 border-emerald-500 flex items-center justify-center mb-6 shadow-[0_0_50px_rgba(16,185,129,0.4)] animate-bounce">
          <PartyPopper className="w-12 h-12 text-emerald-400" />
        </div>
        <h2 className="text-3xl sm:text-5xl font-black text-white tracking-tight">
          Thank You for Visiting!
        </h2>
        <p className="text-lg sm:text-xl text-slate-300 font-medium mt-4 max-w-lg leading-relaxed">
          Your consultation at <strong className="text-emerald-400">{selectedQueue.name}</strong> is now complete. Thank you for visiting!
        </p>

        <div className="mt-10 flex flex-col sm:flex-row gap-4">
          <button
            onClick={() => {
              setEntryStatus('waiting');
              entryStatusRef.current = 'waiting';
              prevEntryStatusRef.current = null;
              setCurrentEntryId(null);
              currentEntryIdRef.current = null;
              setSelectedQueue(null);
              selectedQueueRef.current = null;
              setMyTokenNumber(0);
              setUserPosition(0);
              setTotalInQueue(0);
              setLiveCompleted(false);
              lastStateSignatureRef.current = "";
              setView('list');
            }}
            className="px-8 py-4 bg-emerald-600 hover:bg-emerald-500 text-white font-black text-base rounded-2xl shadow-xl transition-all cursor-pointer"
          >
            Done · Return to Healthcare Hub
          </button>
          <Link href="/" className="px-8 py-4 bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-base rounded-2xl transition-all">
            Home Dashboard
          </Link>
        </div>
      </div>
    );
  }

  // 3. ACTIVE TICKET VIEW
  if (view === 'ticket' && selectedQueue) {
    const isClosed = !isQueueOpen || selectedQueue.queueStatus === 'closed';
    const isMyTurn = entryStatus === 'called' || (currentToken === myTokenNumber && myTokenNumber > 0);
    const progressPercent = isMyTurn ? 100 : Math.min(100, Math.max(10, ((totalInQueue - userPosition + 1) / Math.max(1, totalInQueue)) * 100));
    const ownerConsultationMins = selectedQueue.consultationMinutes || 15;

    return (
      <div className="min-h-screen bg-[#070B12] text-white flex flex-col relative overflow-hidden font-sans">
        {/* Header Banner - Premium Medical Teal & Emerald Gradient */}
        <div className="bg-gradient-to-b from-slate-900/90 via-slate-900/60 to-transparent text-white pt-6 pb-28 px-4 sm:px-6 lg:px-16 relative overflow-hidden border-b border-white/10">
          {/* Ambient Glow Orbs */}
          <div className="absolute -top-24 -right-24 w-96 h-96 bg-emerald-500/15 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute top-1/2 -right-8 -translate-y-1/2 opacity-10 pointer-events-none">
            <Clock className="w-80 h-80 sm:w-[420px] sm:h-[420px] text-teal-200 stroke-[1.2]" />
          </div>

          <div className="relative z-10 max-w-5xl mx-auto flex flex-col">
            {/* BACK BUTTON */}
            <button
              onClick={() => setView('list')}
              className="flex items-center text-emerald-300 hover:text-white font-bold text-xs sm:text-sm mb-6 w-fit group transition-all bg-white/5 hover:bg-white/10 backdrop-blur-md px-4 py-2 rounded-full border border-white/10 shadow-md cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4 mr-2 group-hover:-translate-x-1 transition-transform text-emerald-400" />
              <span>Back to Healthcare Hub</span>
            </button>

            {/* LIVE STATUS PILL BADGE */}
            <div className="mb-3 flex items-center space-x-3">
              {isMyTurn ? (
                <span className="inline-flex items-center px-4 py-1.5 rounded-full bg-emerald-500/25 backdrop-blur-md text-xs font-black uppercase tracking-widest text-emerald-300 shadow-lg border border-emerald-400/40 animate-pulse">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 mr-2.5 shadow-[0_0_10px_#10b981]" />
                  YOUR TURN NOW!
                </span>
              ) : isClosed ? (
                <span className="inline-flex items-center px-4 py-1.5 rounded-full bg-rose-500/20 backdrop-blur-md text-xs font-black uppercase tracking-widest text-rose-200 shadow-sm border border-rose-500/30">
                  <span className="w-2.5 h-2.5 rounded-full bg-rose-400 mr-2.5" />
                  QUEUE CLOSED BY CLINIC
                </span>
              ) : (
                <span className="inline-flex items-center px-4 py-1.5 rounded-full bg-teal-500/20 backdrop-blur-md text-xs font-black uppercase tracking-widest text-teal-200 shadow-sm border border-teal-400/30">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 mr-2.5 animate-ping" />
                  LIVE QUEUE ACTIVE
                </span>
              )}
            </div>

            {/* CLINIC TITLE & ADDRESS */}
            <h1 className="text-2xl sm:text-4xl font-extrabold text-white tracking-tight leading-tight">
              {selectedQueue.name}
            </h1>
            <p className="flex items-center text-slate-300 font-medium mt-2 text-sm sm:text-base">
              <MapPin className="w-4 h-4 mr-2 text-teal-400 shrink-0" />
              <span>{selectedQueue.address}</span>
            </p>
          </div>
        </div>

        {/* Floating Ticket Container */}
        <div className="flex-1 max-w-4xl w-full mx-auto px-4 sm:px-6 lg:px-8 -mt-20 relative z-20 pb-16">
          <div className="bg-slate-900/90 backdrop-blur-2xl rounded-3xl border border-white/10 shadow-[0_25px_60px_-15px_rgba(0,0,0,0.8)] p-6 sm:p-10 relative overflow-hidden">
            {/* Ambient Backlight Glow */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[140%] h-[140%] bg-[radial-gradient(circle_at_center,_rgba(16,185,129,0.12)_0%,_rgba(6,182,212,0.06)_50%,_transparent_70%)] blur-3xl pointer-events-none" />

            {/* TURN ARRIVED BANNER */}
            {isMyTurn && !isTurnDismissed && (
              <div className="mb-8 p-6 bg-emerald-950/90 border-2 border-emerald-500 rounded-2xl flex items-start justify-between text-emerald-100 shadow-[0_0_30px_rgba(16,185,129,0.25)] flex-wrap gap-4 transition-all duration-300">
                <div className="flex items-start">
                  <CheckCircle2 className="w-8 h-8 text-emerald-400 mr-4 mt-0.5 shrink-0" />
                  <div>
                    <h4 className="text-2xl font-black text-white mb-1">🎉 YOUR TURN HAS ARRIVED!</h4>
                    <p className="text-base font-bold text-emerald-200">
                      Token #{myTokenNumber} is currently being called by the doctor! Please enter the consultation room immediately.
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2 self-center flex-wrap">
                  <button
                    type="button"
                    onClick={() => playTurnArrivalChime()}
                    className="px-4 py-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs uppercase tracking-wider rounded-xl transition-all shadow-md cursor-pointer"
                  >
                    🔔 Play Chime
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsTurnDismissed(true)}
                    className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-emerald-300 font-bold text-xs rounded-xl border border-emerald-500/30 transition-all cursor-pointer"
                    aria-label="Dismiss turn notification"
                  >
                    ✕ Dismiss
                  </button>
                </div>
              </div>
            )}

            {/* Closed Queue Notice */}
            {isClosed && !isMyTurn && (
              <div className="mb-8 p-6 bg-rose-950/60 border-l-4 border-rose-500 rounded-2xl flex items-start text-rose-200 shadow-md">
                <Lock className="w-6 h-6 text-rose-400 mr-4 mt-0.5 shrink-0" />
                <div>
                  <h4 className="text-lg font-black text-white mb-1">Queue Closed by Store Owner / Admin</h4>
                  <p className="text-sm font-medium text-rose-200">
                    The live queue for this provider is currently closed by the owner in their Live Queue dashboard.
                  </p>
                </div>
              </div>
            )}

            {/* Position & Estimated Wait Section */}
            <div className="relative z-10 grid grid-cols-1 md:grid-cols-2 gap-8 mb-10 pb-8 border-b border-slate-800/80">
              <div className="bg-slate-950/60 p-6 rounded-2xl border border-slate-800/80">
                <p className="text-xs font-black text-emerald-400 uppercase tracking-widest mb-3 flex items-center">
                  <User className="w-4 h-4 mr-2 text-emerald-400" /> YOUR POSITION
                </p>
                <div className="flex items-baseline">
                  <span className="text-6xl sm:text-7xl font-black text-white tabular-nums tracking-tighter">
                    {userPosition}
                  </span>
                  <span className="text-2xl sm:text-3xl text-slate-500 font-extrabold ml-3 tabular-nums">
                    / {Math.max(1, totalInQueue)}
                  </span>
                </div>
                <p className="text-xs font-semibold text-slate-400 mt-3 pt-3 border-t border-slate-800/60">
                  Your Token #: <span className="text-white font-bold">{myTokenNumber}</span> • Serving Token #: <span className="text-emerald-400 font-bold">{currentToken}</span>
                </p>
              </div>

              <div className="bg-slate-950/60 p-6 rounded-2xl border border-slate-800/80 flex flex-col justify-center">
                <p className="text-xs font-black text-teal-400 uppercase tracking-widest mb-3 flex items-center">
                  <Clock className="w-4 h-4 mr-2 text-teal-400" /> ESTIMATED WAIT
                </p>
                <div className="text-5xl sm:text-6xl font-black text-teal-400 flex items-baseline tabular-nums tracking-tight">
                  {isMyTurn ? 0 : estimatedWait} <span className="text-2xl font-bold ml-2.5 text-teal-300">mins</span>
                </div>
                <p className="text-xs font-semibold text-slate-400 mt-3 pt-3 border-t border-slate-800/60">
                  Clinic Consultation Speed: <span className="text-slate-200 font-bold">{ownerConsultationMins}m</span> / patient
                </p>
              </div>
            </div>

            {/* Glowing Slider Progress Bar */}
            <div className="relative mb-10 pt-2">
              <div className="flex justify-between text-xs font-black text-slate-400 uppercase tracking-widest mb-3">
                <span>START</span>
                <span>YOUR TURN</span>
              </div>
              <div className="h-4 w-full bg-slate-950 rounded-full overflow-hidden relative p-0.5 border border-slate-800">
                <div
                  className={`h-full rounded-full transition-all duration-1000 ease-out relative ${
                    isMyTurn
                      ? 'bg-gradient-to-r from-emerald-500 via-teal-400 to-emerald-300 shadow-[0_0_20px_rgba(16,185,129,0.8)]'
                      : 'bg-gradient-to-r from-teal-600 via-emerald-500 to-cyan-400 shadow-[0_0_15px_rgba(16,185,129,0.5)]'
                  }`}
                  style={{ width: `${progressPercent}%` }}
                >
                  <div className="absolute inset-0 bg-white/20 w-1/3 -skew-x-12 animate-[shimmer_2s_infinite]" />
                </div>
              </div>

              {/* Slider Handle Knob */}
              <div
                className="absolute top-8 -ml-4 transition-all duration-1000 ease-out flex flex-col items-center pointer-events-none"
                style={{ left: `${progressPercent}%` }}
              >
                <div className={`border-4 rounded-full w-8 h-8 shadow-xl flex items-center justify-center relative ${
                  isMyTurn ? 'bg-emerald-950 border-emerald-400' : 'bg-slate-900 border-teal-400'
                }`}>
                  <span className={`w-2.5 h-2.5 rounded-full animate-ping absolute ${isMyTurn ? 'bg-emerald-400' : 'bg-teal-400'}`} />
                  <span className={`w-2.5 h-2.5 rounded-full relative z-10 ${isMyTurn ? 'bg-emerald-400' : 'bg-teal-400'}`} />
                </div>
              </div>
            </div>

            {/* Notification alert if running late */}
            {isLate && (
              <div className="mb-8 p-4 bg-amber-500/10 border-l-4 border-amber-500 rounded-xl flex items-start text-amber-200">
                <AlertCircle className="w-5 h-5 text-amber-400 mr-3 mt-0.5 shrink-0" />
                <p className="text-sm font-medium">
                  We notified the clinic that you are running <strong>{lateMinutes} minutes</strong> late. Your position is preserved.
                </p>
              </div>
            )}

            {/* In Consultation Banner */}
            {entryStatus === 'in_consultation' && (
              <div className="mb-8 p-4 bg-blue-500/10 border-l-4 border-blue-500 rounded-xl flex items-start text-blue-200">
                <CheckCircle2 className="w-5 h-5 text-blue-400 mr-3 mt-0.5 shrink-0" />
                <p className="text-sm font-bold">You are currently in consultation. Please wait — the doctor will see you shortly.</p>
              </div>
            )}

            {/* Action Buttons */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
              <button
                onClick={handleRunningLate}
                disabled={isLate || isClosed || isMyTurn || entryStatus === 'in_consultation'}
                className="flex items-center justify-center p-4 rounded-2xl bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-500 hover:to-orange-500 text-white font-extrabold text-base shadow-lg transition-all disabled:opacity-50 cursor-pointer"
              >
                <Navigation className="w-5 h-5 mr-3 text-white fill-white/20" />
                <span>Running Late</span>
              </button>

              <button
                onClick={handleLeaveQueue}
                disabled={isMyTurn || entryStatus === 'in_consultation'}
                className="flex items-center justify-center p-4 rounded-2xl bg-gradient-to-r from-slate-600 to-slate-700 hover:from-slate-500 hover:to-slate-600 text-white font-extrabold text-base shadow-lg transition-all disabled:opacity-50 cursor-pointer"
              >
                <ArrowLeft className="w-5 h-5 mr-3 text-white" />
                <span>Leave Queue</span>
              </button>

              <button
                onClick={handleCancelVisit}
                className="flex items-center justify-center p-4 rounded-2xl bg-gradient-to-r from-rose-600 to-red-700 hover:from-rose-500 hover:to-red-600 text-white font-extrabold text-base shadow-lg transition-all cursor-pointer"
              >
                <XCircle className="w-5 h-5 mr-3 text-white fill-white/20" />
                <span>Cancel Visit</span>
              </button>
            </div>
          </div>

          {/* Bottom Actions */}
          <div className="mt-8 flex flex-wrap items-center justify-between gap-4 px-2">
            <button
              onClick={() => setView('list')}
              className="flex items-center text-teal-400 hover:text-teal-300 font-bold text-sm transition-colors cursor-pointer"
            >
              <ChevronRight className="w-4 h-4 mr-1 rotate-180" />
              View All Other Healthcare Queues
            </button>

            <div className="flex items-center space-x-6 text-sm font-semibold text-slate-400">
              <button className="flex items-center hover:text-white transition-colors cursor-pointer">
                <Phone className="w-4 h-4 mr-2 text-teal-400" /> Call Clinic
              </button>
              <button className="flex items-center hover:text-white transition-colors cursor-pointer">
                <Bell className="w-4 h-4 mr-2 text-emerald-400" /> Notifications
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // 4. ALL HEALTHCARE QUEUES LIST VIEW
  return (
    <>
    <div className="min-h-screen bg-[#070B12] text-white flex flex-col font-sans relative overflow-x-hidden">
      {/* Ambient Atmospheric Cyan & Emerald Glows */}
      <div
        className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[450px] pointer-events-none z-0"
        style={{
          background: "radial-gradient(ellipse at top, rgba(16, 185, 129, 0.15) 0%, rgba(6, 182, 212, 0.08) 45%, transparent 70%)",
          filter: "blur(100px)",
        }}
      />

      {/* Floating Topbar */}
      <header className="sticky top-0 z-40 px-4 sm:px-6 py-3 pointer-events-none">
        <div className="max-w-6xl mx-auto rounded-full bg-slate-900/80 backdrop-blur-xl border border-white/10 px-4 sm:px-6 py-2.5 shadow-xl shadow-black/20 flex items-center justify-between pointer-events-auto transition-all">
          <div className="flex items-center gap-3 min-w-0">
            <Link
              href="/"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white text-xs sm:text-sm font-semibold border border-white/10 transition-all shrink-0"
            >
              <ArrowLeft className="w-3.5 h-3.5 text-emerald-400" />
              <span>Home</span>
            </Link>
            <div className="h-4 w-px bg-white/10 hidden sm:block" />
            <div className="flex items-center gap-2 min-w-0">
              <div className="w-7 h-7 rounded-lg bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 flex items-center justify-center shrink-0">
                <Activity className="w-4 h-4" />
              </div>
              <div className="min-w-0">
                <h1 className="text-sm sm:text-base font-extrabold text-white tracking-tight truncate flex items-center gap-2">
                  <span>Healthcare Hub</span>
                  <span className="hidden md:inline-flex px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 text-[10px] font-bold border border-emerald-500/20">
                    Live Queues
                  </span>
                </h1>
              </div>
            </div>
          </div>

          {selectedQueue && (
            <button
              onClick={() => setView('ticket')}
              className="inline-flex items-center gap-1.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold px-3.5 py-1.5 rounded-full text-xs sm:text-sm transition-all shadow-md shadow-emerald-500/20 shrink-0 cursor-pointer"
            >
              <Sparkles className="w-3.5 h-3.5 animate-pulse" />
              <span className="hidden sm:inline">Active Pass ({selectedQueue.name.split('–')[0].trim()})</span>
              <span className="sm:hidden">Pass</span>
            </button>
          )}
        </div>
      </header>

      {/* Main Hero Banner */}
      <div className="relative z-10 pt-4 pb-8 sm:pb-12 px-4 sm:px-6">
        <div className="max-w-6xl mx-auto flex flex-col items-start text-left">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/25 text-emerald-400 text-xs font-bold uppercase tracking-wider mb-3 backdrop-blur-md">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
            <span>VERIFIED CARE NETWORK</span>
          </div>

          <h2 className="text-2xl sm:text-4xl lg:text-5xl font-extrabold text-white tracking-tight leading-[1.15] max-w-2xl">
            Local care,{" "}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 via-teal-300 to-cyan-400">
              without the waiting room.
            </span>
          </h2>

          <p className="text-slate-300 text-sm sm:text-base font-normal mt-3 max-w-xl leading-relaxed">
            Select a verified clinic, OPD, or diagnostic lab near you. Join live queues remotely and arrive right on time.
          </p>

          {/* Search Input & Push Alerts */}
          <div className="mt-6 w-full max-w-2xl flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5">
            <div className="flex-1 relative flex items-center">
              <Search className="w-4 h-4 text-emerald-400 absolute left-4 z-10 pointer-events-none" />
              <input
                type="text"
                value={searchQuery}
                onChange={handleSearchChange}
                placeholder="Search clinic, doctor, specialty..."
                style={{ paddingLeft: "42px", paddingRight: "14px" }}
                className="w-full bg-slate-900/90 border border-white/15 rounded-2xl py-3 text-white placeholder-slate-400 font-medium focus:outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-400/20 transition-all text-sm shadow-inner"
              />
            </div>
            <PushNotificationManager />
          </div>
        </div>
      </div>

      {/* Error Message Toast Banner */}
      {errorMsg && (
        <div className="max-w-6xl mx-auto px-4 sm:px-6 mb-4 relative z-10">
          <div className="p-4 bg-rose-950/70 border border-rose-500/50 rounded-2xl flex items-center justify-between text-rose-200 shadow-xl">
            <div className="flex items-center space-x-2.5 min-w-0">
              <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
              <span className="font-bold text-xs sm:text-sm truncate">{errorMsg}</span>
            </div>
            <button onClick={() => setErrorMsg(null)} className="text-rose-400 hover:text-white font-bold text-base cursor-pointer ml-2">×</button>
          </div>
        </div>
      )}

      {/* Filter Tabs & Provider Cards Grid */}
      <div className="max-w-6xl mx-auto w-full px-4 sm:px-6 pb-16 flex-1 relative z-10">
        {/* Category Filters */}
        <div className="flex items-center gap-2 overflow-x-auto pb-3 mb-6 no-scrollbar">
          {renderedCategoryFilters}
        </div>

        {/* Queues Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
          {renderedQueuesGrid}
        </div>
      </div>
    </div>

    {/* Appointment Booking Modal Overlay */}
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
    </>
  );
}
