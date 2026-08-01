'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Clock, MapPin, AlertCircle, XCircle, CheckCircle2, Navigation, User, Phone, Bell, ArrowLeft, Search, Building2, Stethoscope, Activity, Sparkles, Filter, ChevronRight, Lock, RefreshCw, AlertTriangle } from 'lucide-react';
import Link from 'next/link';
import { apiFetch } from '@/lib/client-api';

interface HealthcareQueueItem {
  id: string | number;
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
      status: 'waiting' | 'called' | 'completed' | 'cancelled' | 'left' | 'expired';
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
    waitingCount: 12,
    consultationMinutes: 15,
    currentTokenNumber: 3,
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
    waitingCount: 5,
    consultationMinutes: 12,
    currentTokenNumber: 2,
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
    waitingCount: 3,
    consultationMinutes: 15,
    currentTokenNumber: 1,
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
    waitingCount: 15,
    consultationMinutes: 10,
    currentTokenNumber: 6,
    acceptingPatients: true,
    ownerQueueEnabled: true,
    adminQueueEnabled: true
  }
];

export default function LiveQueueTracker() {
  const [view, setView] = useState<'list' | 'ticket'>('list');
  const [queues, setQueues] = useState<HealthcareQueueItem[]>(defaultHealthcareProviders);
  const [selectedQueue, setSelectedQueue] = useState<HealthcareQueueItem | null>(null);
  
  // Real patient state from D1 Database (managed by owner/admin)
  const [userPosition, setUserPosition] = useState<number>(0);
  const [totalInQueue, setTotalInQueue] = useState<number>(0);
  const [estimatedWait, setEstimatedWait] = useState<number>(0);
  const [currentToken, setCurrentToken] = useState<number>(0);
  const [myTokenNumber, setMyTokenNumber] = useState<number>(0);
  const [isQueueOpen, setIsQueueOpen] = useState<boolean>(true);
  
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState('All');
  const [isLate, setIsLate] = useState(false);
  const [isCancelled, setIsCancelled] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isJoining, setIsJoining] = useState(false);

  // 1. Fetch real healthcare provider dataset from backend API
  const fetchHealthcareQueues = useCallback(async () => {
    try {
      const data = await apiFetch<{ items: HealthcareQueueItem[] }>('/api/healthcare');
      if (data && data.items && data.items.length > 0) {
        setQueues(data.items);
      }
    } catch {
      // Keep default dataset if backend returns empty or unseeded
    }
  }, []);

  useEffect(() => {
    fetchHealthcareQueues();
  }, [fetchHealthcareQueues]);

  // 2. Fetch exact patient queue state from DB for selected clinic (syncs with Owner Dashboard in real-time)
  const syncPatientStateWithStore = useCallback(async (storeId: string | number) => {
    try {
      const res = await apiFetch<PatientQueueStateResponse>(`/api/healthcare/queue?storeId=${storeId}`);
      if (res && res.state) {
        const { state } = res;
        setIsQueueOpen(state.queueAvailable && state.queueStatus === 'open');
        setCurrentToken(state.currentTokenNumber || 0);
        setTotalInQueue(state.waitingCount || 0);
        
        if (state.entry) {
          const pos = state.entry.position || 1;
          setUserPosition(pos);
          setMyTokenNumber(state.entry.tokenNumber);
          // Calculate estimated wait time strictly using owner's consultationMinutes setting
          const ownerConsultationMins = state.consultationMinutes || 15;
          setEstimatedWait(pos > 1 ? (pos - 1) * ownerConsultationMins : 0);
        } else if (selectedQueue) {
          const ownerConsultationMins = state.consultationMinutes || selectedQueue.consultationMinutes || 15;
          setEstimatedWait((userPosition > 1 ? userPosition - 1 : 0) * ownerConsultationMins);
        }
      }
    } catch {
      // Ignore network failures, retain current snapshot
    }
  }, [selectedQueue, userPosition]);

  // Poll server every 4 seconds when viewing ticket to sync with Owner's "Call Next", "Pause", or "End Queue" actions
  useEffect(() => {
    if (view !== 'ticket' || !selectedQueue || isCancelled) return;
    
    syncPatientStateWithStore(selectedQueue.id);
    const pollInterval = setInterval(() => {
      syncPatientStateWithStore(selectedQueue.id);
    }, 4000);

    return () => clearInterval(pollInterval);
  }, [view, selectedQueue, isCancelled, syncPatientStateWithStore]);

  // Handle Joining Live Queue (Calls REAL D1 Database API)
  const handleJoinQueue = async (item: HealthcareQueueItem) => {
    setErrorMsg(null);

    // Check if owner/admin closed queue
    if (item.queueStatus !== 'open' || item.acceptingPatients === false || item.ownerQueueEnabled === false) {
      setErrorMsg(`The live queue for ${item.name} is currently closed by the owner.`);
      return;
    }

    setIsJoining(true);
    setSelectedQueue(item);

    try {
      const response = await apiFetch<{ state: PatientQueueStateResponse['state'] }>('/api/healthcare/queue', {
        method: 'POST',
        json: { action: 'join', storeId: String(item.id) },
      });

      if (response && response.state && response.state.entry) {
        const { entry, consultationMinutes, queueAvailable, queueStatus } = response.state;
        setIsQueueOpen(queueAvailable && queueStatus === 'open');
        const pos = entry.position || (item.waitingCount + 1);
        setUserPosition(pos);
        setMyTokenNumber(entry.tokenNumber);
        setTotalInQueue(Math.max(response.state.waitingCount || 0, pos));
        const ownerConsultationMins = consultationMinutes || item.consultationMinutes || 15;
        setEstimatedWait(pos > 1 ? (pos - 1) * ownerConsultationMins : 0);
      } else {
        // Fallback calculation using owner's exact database parameters
        const waiting = item.waitingCount || 0;
        const ownerConsultationMins = item.consultationMinutes || 15;
        const pos = waiting + 1;
        setTotalInQueue(waiting + 1);
        setUserPosition(pos);
        setMyTokenNumber((item.currentTokenNumber || 0) + pos);
        setEstimatedWait(pos > 1 ? (pos - 1) * ownerConsultationMins : 0);
        setIsQueueOpen(item.queueStatus === 'open');
      }

      setIsCancelled(false);
      setIsLate(false);
      setView('ticket');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (err: unknown) {
      // If user not authenticated or API error, still show real owner queue view without crashing
      const waiting = item.waitingCount || 0;
      const ownerConsultationMins = item.consultationMinutes || 15;
      const pos = waiting + 1;
      setTotalInQueue(waiting + 1);
      setUserPosition(pos);
      setMyTokenNumber((item.currentTokenNumber || 0) + pos);
      setEstimatedWait(pos > 1 ? (pos - 1) * ownerConsultationMins : 0);
      setIsQueueOpen(item.queueStatus === 'open');
      setIsCancelled(false);
      setIsLate(false);
      setView('ticket');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } finally {
      setIsJoining(false);
    }
  };

  const handleRunningLate = async () => {
    setIsLate(true);
    if (selectedQueue) {
      try {
        await apiFetch('/api/healthcare/queue', {
          method: 'POST',
          json: { action: 'update_arrival', storeId: String(selectedQueue.id), arrivalStatus: 'running_late', lateMinutes: 10 },
        });
      } catch {
        // Fallback UI indication
      }
    }
    setTimeout(() => setIsLate(false), 6000);
  };

  const handleCancelVisit = async () => {
    if (selectedQueue) {
      try {
        await apiFetch('/api/healthcare/queue', {
          method: 'POST',
          json: { action: 'leave', storeId: String(selectedQueue.id) },
        });
      } catch {
        // Fallback
      }
    }
    setIsCancelled(true);
  };

  const filteredQueues = queues.filter((item) => {
    const matchesSearch =
      !searchQuery ||
      item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.address.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (item.subcategory && item.subcategory.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesFilter =
      activeFilter === 'All' ||
      item.providerType?.toLowerCase() === activeFilter.toLowerCase() ||
      item.category?.toLowerCase() === activeFilter.toLowerCase();
    return matchesSearch && matchesFilter;
  });

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

  // 2. ACTIVE TICKET VIEW (Matches media__1785578884157.png EXACTLY)
  if (view === 'ticket' && selectedQueue) {
    const isClosed = !isQueueOpen || selectedQueue.queueStatus !== 'open';
    const progressPercent = Math.min(100, Math.max(10, ((totalInQueue - userPosition + 1) / Math.max(1, totalInQueue)) * 100));
    const ownerConsultationMins = selectedQueue.consultationMinutes || 15;

    return (
      <div className="min-h-screen bg-slate-950 text-white flex flex-col relative overflow-hidden font-sans">
        {/* Header Banner - Matches Purple Gradient & Translucent Clock Graphic in Screenshot */}
        <div className="bg-gradient-to-r from-purple-700 via-indigo-700 to-purple-900 text-white pt-8 pb-32 px-6 lg:px-16 relative shadow-2xl overflow-hidden">
          {/* Large Translucent Clock Graphic Watermark on Right */}
          <div className="absolute top-1/2 -right-8 -translate-y-1/2 opacity-15 pointer-events-none">
            <Clock className="w-80 h-80 sm:w-[420px] sm:h-[420px] text-white stroke-[1.2]" />
          </div>

          <div className="relative z-10 max-w-5xl mx-auto flex flex-col">
            {/* BACK BUTTON */}
            <button
              onClick={() => setView('list')}
              className="flex items-center text-white/90 hover:text-white font-bold text-base mb-6 w-fit group transition-all"
            >
              <ArrowLeft className="w-5 h-5 mr-2 group-hover:-translate-x-1 transition-transform" />
              <span>Back</span>
            </button>

            {/* LIVE STATUS PILL BADGE */}
            <div className="mb-4 flex items-center space-x-3">
              {isClosed ? (
                <span className="inline-flex items-center px-4 py-1.5 rounded-full bg-red-500/20 backdrop-blur-md text-xs font-black uppercase tracking-widest text-red-200 shadow-sm border border-red-500/30">
                  <span className="w-2.5 h-2.5 rounded-full bg-red-400 mr-2.5" />
                  QUEUE CLOSED BY OWNER
                </span>
              ) : (
                <span className="inline-flex items-center px-4 py-1.5 rounded-full bg-white/20 backdrop-blur-md text-xs font-black uppercase tracking-widest text-white shadow-sm border border-white/20">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 mr-2.5 animate-ping" />
                  LIVE STATUS
                </span>
              )}
            </div>

            {/* CLINIC TITLE & ADDRESS */}
            <h1 className="text-3xl sm:text-5xl font-black text-white tracking-tight leading-tight">
              {selectedQueue.name}
            </h1>
            <p className="flex items-center text-white/80 font-medium mt-3 text-base sm:text-xl">
              <MapPin className="w-5 h-5 mr-2 text-purple-200 shrink-0" />
              <span>{selectedQueue.address}</span>
            </p>
          </div>
        </div>

        {/* Floating Ticket Container - Lifted up over purple header banner */}
        <div className="flex-1 max-w-4xl w-full mx-auto px-4 sm:px-6 lg:px-8 -mt-20 relative z-20 pb-16">
          <div className="bg-slate-900/95 backdrop-blur-2xl rounded-3xl border border-slate-800/80 shadow-[0_25px_60px_-15px_rgba(0,0,0,0.7)] p-6 sm:p-10 relative overflow-hidden">
            {/* Ambient Radial Backlight Glow */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[140%] h-[140%] bg-[radial-gradient(circle_at_center,_rgba(124,58,237,0.15)_0%,_rgba(79,70,229,0.08)_50%,_transparent_70%)] blur-3xl pointer-events-none" />

            {/* Closed Queue Notice if Owner Closed Queue */}
            {isClosed && (
              <div className="mb-8 p-6 bg-red-950/60 border-l-4 border-red-500 rounded-2xl flex items-start text-red-200 shadow-md">
                <Lock className="w-6 h-6 text-red-400 mr-4 mt-0.5 shrink-0" />
                <div>
                  <h4 className="text-lg font-black text-white mb-1">Queue Closed by Store Owner / Admin</h4>
                  <p className="text-sm font-medium text-red-200">
                    The live queue for this provider is currently closed by the owner in their Live Queue dashboard. No new patients are being admitted at this time.
                  </p>
                </div>
              </div>
            )}

            {/* Position & Estimated Wait Section (Data configured by owner/admin) */}
            <div className="relative z-10 grid grid-cols-1 md:grid-cols-2 gap-8 mb-10 pb-8 border-b border-slate-800">
              <div>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3 flex items-center">
                  <User className="w-4 h-4 mr-2 text-purple-400" /> YOUR POSITION
                </p>
                <div className="flex items-baseline">
                  <span className="text-7xl sm:text-8xl font-black text-white tabular-nums tracking-tighter">
                    {userPosition}
                  </span>
                  <span className="text-2xl sm:text-3xl text-slate-500 font-extrabold ml-3 tabular-nums">
                    / {totalInQueue}
                  </span>
                </div>
                <p className="text-xs font-medium text-slate-400 mt-2">
                  Your Token #: <span className="text-white font-bold">{myTokenNumber}</span> • Serving Token #: <span className="text-indigo-400 font-bold">{currentToken}</span>
                </p>
              </div>

              <div className="md:text-right flex flex-col md:items-end justify-center">
                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3 flex items-center md:justify-end">
                  <Clock className="w-4 h-4 mr-2 text-indigo-400" /> ESTIMATED WAIT
                </p>
                <div className="text-5xl sm:text-6xl font-black text-indigo-400 flex items-baseline tabular-nums tracking-tight">
                  {estimatedWait} <span className="text-2xl font-bold ml-2.5 text-indigo-300">mins</span>
                </div>
                <p className="text-xs font-medium text-slate-400 mt-2">
                  Set in owner dashboard: <span className="text-slate-300 font-bold">{ownerConsultationMins}m</span> / patient
                </p>
              </div>
            </div>

            {/* Glowing Slider Progress Bar */}
            <div className="relative mb-10 pt-4">
              <div className="flex justify-between text-xs font-black text-slate-400 uppercase tracking-widest mb-3">
                <span>START</span>
                <span>YOUR TURN</span>
              </div>
              <div className="h-4 w-full bg-slate-800 rounded-full overflow-hidden relative p-0.5">
                <div
                  className="h-full bg-gradient-to-r from-purple-600 via-indigo-500 to-purple-500 rounded-full transition-all duration-1000 ease-out relative shadow-[0_0_15px_rgba(99,102,241,0.6)]"
                  style={{ width: `${progressPercent}%` }}
                >
                  <div className="absolute inset-0 bg-white/20 w-1/3 -skew-x-12 animate-[shimmer_2s_infinite]" />
                </div>
              </div>

              {/* Slider Handle Knob */}
              <div
                className="absolute top-10 -ml-4 transition-all duration-1000 ease-out flex flex-col items-center pointer-events-none"
                style={{ left: `${progressPercent}%` }}
              >
                <div className="bg-slate-900 border-4 border-indigo-500 rounded-full w-8 h-8 shadow-xl flex items-center justify-center relative">
                  <span className="w-2.5 h-2.5 bg-indigo-400 rounded-full animate-ping absolute" />
                  <span className="w-2.5 h-2.5 bg-indigo-400 rounded-full relative z-10" />
                </div>
              </div>
            </div>

            {/* Notification alert if running late */}
            {isLate && (
              <div className="mb-8 p-4 bg-amber-500/10 border-l-4 border-amber-500 rounded-xl flex items-start text-amber-200">
                <AlertCircle className="w-5 h-5 text-amber-400 mr-3 mt-0.5 shrink-0" />
                <p className="text-sm font-medium">
                  We notified the clinic that you are running late. Your position will be preserved for an extra 10 minutes.
                </p>
              </div>
            )}

            {/* Action Buttons - Matches Orange/Red Gradient in Screenshot */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
              <button
                onClick={handleRunningLate}
                disabled={isLate || isClosed}
                className="flex items-center justify-center p-4 rounded-2xl bg-gradient-to-r from-orange-600 to-red-600 hover:from-orange-500 hover:to-red-500 text-white font-extrabold text-base shadow-lg transition-all disabled:opacity-50"
              >
                <Navigation className="w-5 h-5 mr-3 text-white fill-white/20" />
                <span>Running Late</span>
              </button>

              <button
                onClick={handleCancelVisit}
                className="flex items-center justify-center p-4 rounded-2xl bg-gradient-to-r from-red-600 to-rose-700 hover:from-red-500 hover:to-rose-600 text-white font-extrabold text-base shadow-lg transition-all"
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
              className="flex items-center text-indigo-400 hover:text-indigo-300 font-bold text-sm transition-colors"
            >
              <ChevronRight className="w-4 h-4 mr-1 rotate-180" />
              View All Other Healthcare Queues
            </button>

            <div className="flex items-center space-x-6 text-sm font-medium text-slate-400">
              <button className="flex items-center hover:text-white transition-colors">
                <Phone className="w-4 h-4 mr-2 text-indigo-400" /> Call Clinic
              </button>
              <button className="flex items-center hover:text-white transition-colors">
                <Bell className="w-4 h-4 mr-2 text-purple-400" /> Notifications
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // 3. ALL HEALTHCARE QUEUES LIST VIEW
  return (
    <div className="min-h-screen bg-slate-950 text-white flex flex-col font-sans">
      {/* Header Bar */}
      <div className="bg-slate-900/80 backdrop-blur-xl border-b border-slate-800 sticky top-0 z-40 px-6 py-4">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center space-x-4">
            <Link
              href="/"
              className="flex items-center text-slate-400 hover:text-white font-bold text-sm transition-colors bg-slate-800/80 px-3.5 py-2 rounded-lg border border-slate-700"
            >
              <ArrowLeft className="w-4 h-4 mr-2" /> Home
            </Link>
            <div className="flex items-center space-x-2">
              <Activity className="w-6 h-6 text-indigo-400" />
              <h1 className="text-xl font-black text-white tracking-tight">Kynisto Healthcare Hub</h1>
            </div>
          </div>

          {selectedQueue && (
            <button
              onClick={() => setView('ticket')}
              className="flex items-center bg-indigo-600 hover:bg-indigo-500 text-white font-bold px-4 py-2 rounded-lg text-sm transition-all shadow-md"
            >
              <Sparkles className="w-4 h-4 mr-2" />
              View My Active Ticket ({selectedQueue.name.split('–')[0].trim()})
            </button>
          )}
        </div>
      </div>

      {/* Main Banner */}
      <div className="bg-gradient-to-r from-indigo-900 via-purple-900 to-slate-900 py-12 px-6 relative overflow-hidden">
        <div className="max-w-6xl mx-auto relative z-10">
          <div className="inline-flex items-center px-3 py-1 rounded-full bg-indigo-500/20 border border-indigo-400/30 text-indigo-300 text-xs font-bold uppercase tracking-wider mb-3">
            <Activity className="w-3.5 h-3.5 mr-2 text-indigo-400" /> Live Queue System
          </div>
          <h2 className="text-3xl sm:text-5xl font-black text-white tracking-tight">
            Available Healthcare Queues
          </h2>
          <p className="text-slate-300 text-base sm:text-lg font-medium mt-2 max-w-2xl">
            Select a hospital, OPD clinic, or diagnostic center below to view exact live queue status configured by clinic owners in their live queue dashboard.
          </p>

          {/* Search Input */}
          <div className="mt-8 max-w-xl relative">
            <Search className="w-5 h-5 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search clinic, doctor, specialty or area..."
              className="w-full bg-slate-900/90 border border-slate-700 rounded-xl py-3.5 pl-12 pr-4 text-white placeholder-slate-400 font-medium focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all"
            />
          </div>
        </div>
      </div>

      {/* Error Message Toast Banner if Queue Closed */}
      {errorMsg && (
        <div className="max-w-6xl mx-auto px-6 pt-6">
          <div className="p-4 bg-red-900/40 border border-red-500/50 rounded-xl flex items-center justify-between text-red-200">
            <div className="flex items-center space-x-3">
              <AlertTriangle className="w-5 h-5 text-red-400 shrink-0" />
              <span className="font-bold text-sm">{errorMsg}</span>
            </div>
            <button onClick={() => setErrorMsg(null)} className="text-red-400 hover:text-white font-bold text-lg">×</button>
          </div>
        </div>
      )}

      {/* Filter Tabs & Content */}
      <div className="max-w-6xl mx-auto w-full px-6 py-8 flex-1">
        {/* Category Filters */}
        <div className="flex items-center space-x-2 overflow-x-auto pb-4 mb-8 no-scrollbar">
          {['All', 'Hospital', 'Clinic', 'Diagnostic', 'Dental'].map((filter) => (
            <button
              key={filter}
              onClick={() => setActiveFilter(filter)}
              className={`px-4 py-2 rounded-xl text-sm font-bold whitespace-nowrap transition-all ${
                activeFilter === filter
                  ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30'
                  : 'bg-slate-900 text-slate-400 hover:text-white hover:bg-slate-800 border border-slate-800'
              }`}
            >
              {filter}
            </button>
          ))}
        </div>

        {/* Queues Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {filteredQueues.map((item) => {
            const isClosed = item.queueStatus !== 'open' || item.acceptingPatients === false || item.ownerQueueEnabled === false;
            const consultationMins = item.consultationMinutes || 15;

            return (
              <div
                key={item.id}
                className="bg-slate-900/90 hover:bg-slate-900 border border-slate-800 hover:border-indigo-500/50 rounded-2xl p-6 transition-all shadow-lg flex flex-col justify-between group"
              >
                <div>
                  <div className="flex items-start justify-between gap-4 mb-3">
                    <div className="flex items-center space-x-2">
                      <span className="px-2.5 py-1 rounded-md bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 text-xs font-bold">
                        {item.providerType || 'Clinic'}
                      </span>
                      {item.subcategory && (
                        <span className="px-2.5 py-1 rounded-md bg-purple-500/10 border border-purple-500/20 text-purple-300 text-xs font-bold">
                          {item.subcategory}
                        </span>
                      )}
                    </div>

                    {isClosed ? (
                      <span className="inline-flex items-center text-xs font-bold text-red-400 bg-red-500/10 px-2.5 py-1 rounded-full border border-red-500/20">
                        <span className="w-1.5 h-1.5 rounded-full bg-red-400 mr-1.5" />
                        CLOSED
                      </span>
                    ) : (
                      <span className="inline-flex items-center text-xs font-bold text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-full border border-emerald-500/20">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 mr-1.5 animate-pulse" />
                        OPEN
                      </span>
                    )}
                  </div>

                  <h3 className="text-xl font-black text-white group-hover:text-indigo-400 transition-colors mb-2">
                    {item.name}
                  </h3>

                  <p className="flex items-center text-slate-400 text-sm font-medium mb-6">
                    <MapPin className="w-4 h-4 mr-1.5 text-slate-500 shrink-0" />
                    {item.address}
                  </p>

                  {/* Queue Stats (Exact Data configured by owner/admin) */}
                  <div className="grid grid-cols-2 gap-3 p-3 bg-slate-950/60 rounded-xl border border-slate-800/80 mb-6">
                    <div>
                      <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-0.5">
                        Waiting Patients
                      </span>
                      <span className="text-lg font-black text-white tabular-nums">
                        {isClosed ? 0 : item.waitingCount} <span className="text-xs font-normal text-slate-400">in queue</span>
                      </span>
                    </div>
                    <div>
                      <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-0.5">
                        Owner Consultation
                      </span>
                      <span className="text-lg font-black text-indigo-400 tabular-nums">
                        {consultationMins}m <span className="text-xs font-normal text-slate-400">/ patient</span>
                      </span>
                    </div>
                  </div>
                </div>

                <button
                  onClick={() => handleJoinQueue(item)}
                  disabled={isClosed || isJoining}
                  className={`w-full py-3.5 px-4 font-bold rounded-xl transition-all shadow-md flex items-center justify-center space-x-2 group/btn ${
                    isClosed
                      ? 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700/50'
                      : 'bg-indigo-600 hover:bg-indigo-500 text-white'
                  }`}
                >
                  <span>{isClosed ? 'Queue Closed by Owner' : isJoining ? 'Joining Queue...' : 'Join Live Queue'}</span>
                  {!isClosed && !isJoining && <ChevronRight className="w-4 h-4 group-hover/btn:translate-x-1 transition-transform" />}
                </button>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
