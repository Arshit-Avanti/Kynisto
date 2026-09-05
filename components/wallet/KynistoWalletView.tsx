'use client';

import React, { useState, useEffect, useRef } from 'react';
import { 
  Gift, Wallet, Award, Download, Clock, Store, Crown, Loader2, 
  CheckCircle2, Star, Sparkles, QrCode, ShieldCheck, X, Camera, 
  Upload, RefreshCw, ArrowUpRight, ArrowDownLeft, PlusCircle, 
  Coins, CreditCard, ChevronRight, Zap, Info 
} from 'lucide-react';
import { apiFetch } from '@/lib/client-api';
import { saveQueueSession } from '@/lib/queue-persistence';


interface KynistoPointsHistory {
  id: string;
  date: string;
  description: string;
  points: number;
  type: 'earned' | 'redeemed';
}

interface LoyaltyPoint {
  storeId: string;
  storeName: string;
  logoUrl: string;
  points: number;
  progress: number;
  lastVisit: string;
  canRedeemDiscount: boolean;
}

interface Membership {
  id: string;
  storeId: string;
  storeName: string;
  type: string;
  status: string;
  validUntil: string;
  pricePaid?: number;
  utr?: string;
  benefits?: string[];
  invoiceUrl: string;
}

interface WalletData {
  kynistoPoints: {
    total: number;
    maxCap: number;
    progress: number;
    history: KynistoPointsHistory[];
  };
  loyaltyPoints: LoyaltyPoint[];
  scanLogs?: any[];
  memberships: {
    active: Membership[];
    pending: Membership[];
    expired: Membership[];
  };
}

const defaultWalletData: WalletData = {
  kynistoPoints: { total: 0, maxCap: 1000, progress: 0, history: [] },
  loyaltyPoints: [],
  scanLogs: [],
  memberships: { active: [], pending: [], expired: [] },
};

const AnimatedNumber = ({ value }: { value: number }) => {
  const [displayValue, setDisplayValue] = useState(0);

  useEffect(() => {
    let animId: number;
    let startTimestamp: number | null = null;
    const duration = 800;
    const step = (timestamp: number) => {
      if (!startTimestamp) startTimestamp = timestamp;
      const progress = Math.min((timestamp - startTimestamp) / duration, 1);
      const easeProgress = 1 - Math.pow(1 - progress, 4);
      setDisplayValue(Math.floor(easeProgress * value));
      if (progress < 1) {
        animId = window.requestAnimationFrame(step);
      } else {
        setDisplayValue(value);
      }
    };
    animId = window.requestAnimationFrame(step);
    return () => {
      if (animId) window.cancelAnimationFrame(animId);
    };
  }, [value]);

  return <span>{displayValue.toLocaleString()}</span>;
};

const ProgressRing = ({ progress, max = 1000 }: { progress: number, max?: number }) => {
  const radius = 28;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (Math.min(progress, max) / max) * circumference;

  return (
    <div className="relative inline-flex items-center justify-center">
      <svg className="transform -rotate-90 w-[72px] h-[72px]">
        <circle cx="36" cy="36" r={radius} stroke="currentColor" strokeWidth="6" fill="transparent" className="text-gray-200 dark:text-gray-800" />
        <circle 
          cx="36" 
          cy="36" 
          r={radius} 
          stroke="currentColor" 
          strokeWidth="6" 
          fill="transparent" 
          strokeDasharray={circumference} 
          strokeDashoffset={strokeDashoffset} 
          className="text-indigo-600 dark:text-indigo-400 transition-all duration-300 drop-shadow-[0_0_15px_rgba(99,102,241,0.5)]" 
          strokeLinecap="round"
        />
      </svg>
      <div className="absolute flex flex-col items-center justify-center">
        <span className="text-xs font-black text-black dark:text-white">{Math.round((Math.min(progress, max) / max) * 100)}%</span>
      </div>
    </div>
  );
};

export default function KynistoWalletView() {
  const [activeTab, setActiveTab] = useState<'kynisto' | 'loyalty' | 'memberships' | 'history'>('kynisto');
  const [walletData, setWalletData] = useState<WalletData>(defaultWalletData);
  const [loading, setLoading] = useState(false);
  const [redeeming, setRedeeming] = useState(false);
  const [redeemResult, setRedeemResult] = useState<{reward?: string; coupon?: string; error?: string} | null>(null);

  // QR Scan Modal State & Camera WebRTC
  const [showScanModal, setShowScanModal] = useState(false);
  const [qrInputToken, setQrInputToken] = useState("");
  const [scanning, setScanning] = useState(false);
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [scanResult, setScanResult] = useState<{
    success?: boolean;
    message?: string;
    error?: string;
    kynistoPointsEarned?: number;
    storePointsEarned?: number;
    storeName?: string;
    isHealthcare?: boolean;
    tokenNumber?: number;
    queueCode?: string;
    redirectUrl?: string;
  } | null>(null);
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetchWalletData();
  }, []);

  const fetchWalletData = async () => {
    try {
      const data = await apiFetch<WalletData>('/api/wallet');
      if (data && typeof data === 'object') {
        setWalletData({
          kynistoPoints: data.kynistoPoints || defaultWalletData.kynistoPoints,
          loyaltyPoints: Array.isArray(data.loyaltyPoints) ? data.loyaltyPoints : [],
          scanLogs: Array.isArray(data.scanLogs) ? data.scanLogs : [],
          memberships: {
            active: Array.isArray(data.memberships?.active) ? data.memberships.active : [],
            pending: Array.isArray(data.memberships?.pending) ? data.memberships.pending : [],
            expired: Array.isArray(data.memberships?.expired) ? data.memberships.expired : [],
          },
        });
      }
    } catch (error) {
      console.error('Failed to fetch wallet data', error);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenScanModal = () => {
    setShowScanModal(true);
    setScanResult(null);
    void startCamera();
  };

  const startCamera = async () => {
    setScanResult(null);
    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        setScanResult({ error: "Camera access is not supported on this browser. Upload a QR photo or enter store token below." });
        return;
      }
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment" }
      });
      mediaStreamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
      setIsCameraActive(true);
    } catch (err: any) {
      console.warn("Camera permission notice", err);
      setScanResult({ error: "Camera permission denied or unavailable. Please grant camera permission or select a QR photo / store token below." });
      setIsCameraActive(false);
    }
  };

  const stopCamera = () => {
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach((track) => track.stop());
      mediaStreamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setIsCameraActive(false);
  };

  const handleCloseModal = () => {
    stopCamera();
    setShowScanModal(false);
    setScanResult(null);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setScanResult(null);

    const reader = new FileReader();
    reader.onload = async (event) => {
      const dataUrl = event.target?.result as string;
      
      // Try BarcodeDetector if supported
      if (typeof window !== "undefined" && "BarcodeDetector" in window) {
        try {
          const img = new Image();
          img.src = dataUrl;
          await img.decode();
          const detector = new (window as any).BarcodeDetector({ formats: ["qr_code"] });
          const barcodes = await detector.detect(img);
          if (barcodes && barcodes.length > 0 && barcodes[0].rawValue) {
            const detectedCode = barcodes[0].rawValue;
            setQrInputToken(detectedCode);
            await handleProcessQrScan(detectedCode);
            return;
          }
        } catch (err) {
          console.warn("BarcodeDetector fallback:", err);
        }
      }

      // If text string contains store slug or URL pattern
      if (dataUrl.includes("stores/")) {
        const match = dataUrl.match(/\/stores\/[a-zA-Z0-9_-]+/);
        if (match) {
          setQrInputToken(match[0]);
          await handleProcessQrScan(match[0]);
          return;
        }
      }

      // Otherwise if user has input token or filename, process it directly
      const tokenCandidate = qrInputToken.trim() || file.name.replace(/\.[^/.]+$/, "");
      setQrInputToken(tokenCandidate);
      await handleProcessQrScan(tokenCandidate);
    };
    reader.readAsDataURL(file);
  };

  const handleProcessQrScan = async (overrideToken?: string) => {
    const tokenToUse = overrideToken || qrInputToken.trim();
    if (!tokenToUse) {
      setScanResult({ error: "Please enter or scan a valid Kynisto Store QR Token or Store URL (e.g. /stores/testimonial-2a0958)." });
      return;
    }

    setScanning(true);
    setScanResult(null);
    try {
      const res = await apiFetch<any>('/api/wallet/scan-qr', {
        method: 'POST',
        json: { qrCodeToken: tokenToUse },
      });

      if (res && res.success) {
        setScanResult({
          success: true,
          message: res.message,
          kynistoPointsEarned: res.kynistoPointsEarned,
          storePointsEarned: res.storePointsEarned,
          storeName: res.storeName,
          isHealthcare: res.isHealthcare,
          tokenNumber: res.tokenNumber,
          queueCode: res.queueCode,
          redirectUrl: res.redirectUrl,
        });
        if (res.isHealthcare && res.storeId && res.tokenNumber) {
          saveQueueSession({
            storeId: res.storeId,
            storeName: res.storeName,
            tokenNumber: res.tokenNumber,
            joinedAt: Date.now(),
            queueCode: res.queueCode,
          });
        }
        setQrInputToken("");
        stopCamera();
        await fetchWalletData();
      } else {
        setScanResult({ error: res?.error || 'Scan verification failed' });
      }
    } catch (err: any) {
      setScanResult({ error: err instanceof Error ? err.message : 'Scan verification failed' });
    } finally {
      setScanning(false);
    }
  };


  const handleRedeemKynistoPoints = async () => {
    if (!walletData || walletData.kynistoPoints.total < 1000) return;
    setRedeeming(true);
    setRedeemResult(null);
    try {
      const data = await apiFetch<any>('/api/wallet/redeem-points', { method: 'POST' });
      if (data && data.success) {
        setRedeemResult({ reward: data.reward });
        await fetchWalletData();
      } else {
        setRedeemResult({ error: data?.error || 'Failed to redeem' });
      }
    } catch (error) {
      setRedeemResult({ error: error instanceof Error ? error.message : 'An error occurred' });
    } finally {
      setRedeeming(false);
    }
  };

  const handleRedeemLoyalty = async (storeId: string) => {
    setRedeeming(true);
    setRedeemResult(null);
    try {
      const data = await apiFetch<any>('/api/wallet/redeem-loyalty', {
        method: 'POST',
        json: { storeId },
      });
      if (data && data.success) {
        setRedeemResult({ coupon: data.couponCode });
        await fetchWalletData();
      } else {
        setRedeemResult({ error: data?.error || 'Failed to redeem' });
      }
    } catch (error) {
      setRedeemResult({ error: error instanceof Error ? error.message : 'An error occurred' });
    } finally {
      setRedeeming(false);
    }
  };

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-indigo-600 dark:text-indigo-400" />
      </div>
    );
  }

  const { kynistoPoints, loyaltyPoints, memberships, scanLogs = [] } = walletData;
  const totalMemberships = (memberships.active?.length || 0) + (memberships.pending?.length || 0);

  // Determine membership tier dynamically
  const tierName = kynistoPoints.total >= 1000 ? "Platinum VIP" : kynistoPoints.total >= 500 ? "Gold Tier" : "Silver Member";
  const tierColor = kynistoPoints.total >= 1000 
    ? "from-cyan-400 via-teal-300 to-indigo-400 text-cyan-200 border-cyan-400/40"
    : kynistoPoints.total >= 500 
    ? "from-amber-400 via-yellow-300 to-amber-500 text-amber-200 border-amber-400/40"
    : "from-indigo-300 via-purple-300 to-pink-300 text-indigo-200 border-indigo-400/40";

  return (
    <div className="mx-auto max-w-4xl space-y-6 relative pb-32">
      {/* Soft Ambient Radial Backlight Glow */}
      <div className="fixed inset-0 pointer-events-none -z-10 flex items-center justify-center overflow-hidden">
        <div className="w-[120vw] h-[120vw] bg-[radial-gradient(ellipse_at_center,_rgba(99,102,241,0.25)_0%,_rgba(168,85,247,0.15)_30%,_transparent_70%)] blur-2xl opacity-50" />
      </div>

      {/* Header */}
      <div className="overflow-hidden rounded-3xl bg-white dark:bg-black p-4 sm:p-6 border border-gray-200 dark:border-gray-800 shadow-[0_0_40px_rgba(99,102,241,0.15)] relative flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[150%] h-[150%] bg-[radial-gradient(circle_at_center,_rgba(99,102,241,0.15)_0%,_rgba(168,85,247,0.08)_50%,_transparent_80%)] blur-xl pointer-events-none" />
        <div className="flex items-center space-x-3 sm:space-x-4 relative z-10">
          <div className="rounded-2xl bg-gradient-to-br from-indigo-600 to-purple-700 p-3 sm:p-4 shadow-lg text-white shrink-0">
            <Wallet className="h-6 w-6 sm:h-8 sm:w-8" />
          </div>
          <div>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-gray-900 dark:text-white">My Wallet</h1>
            <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-300 font-bold">Earn points exclusively by scanning store Kynisto QR Codes</p>
          </div>
        </div>

        {/* SCAN STORE QR CODE BUTTON */}
        <button
          onClick={handleOpenScanModal}
          className="relative z-10 inline-flex items-center justify-center gap-2 rounded-xl sm:rounded-2xl bg-gradient-to-r from-emerald-500 via-teal-600 to-indigo-600 px-4 py-2.5 sm:px-5 sm:py-3 text-xs sm:text-sm font-black text-white shadow-xl hover:scale-105 active:scale-95 transition-all cursor-pointer border border-emerald-400/30"
        >
          <QrCode className="h-4 w-4 sm:h-5 sm:w-5 animate-pulse" />
          <span>Scan Store QR Code</span>
        </button>
      </div>

      {/* DIGITAL MEMBERSHIP CARD & 4-COLUMN QUICK ACTIONS */}
      <div className="space-y-4">
        {/* DIGITAL MEMBERSHIP CARD */}
        <div className="relative overflow-hidden rounded-3xl p-5 sm:p-7 border border-indigo-500/30 bg-gradient-to-br from-slate-950 via-indigo-950 to-slate-900 text-white shadow-2xl">
          {/* Card Ambient Glows */}
          <div className="absolute top-0 right-0 -mt-10 -mr-10 h-48 w-48 rounded-full bg-indigo-500/20 blur-3xl pointer-events-none" />
          <div className="absolute bottom-0 left-0 -mb-10 -ml-10 h-48 w-48 rounded-full bg-emerald-500/15 blur-3xl pointer-events-none" />
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_rgba(255,255,255,0.08)_0%,_transparent_60%)] pointer-events-none" />

          <div className="relative z-10 flex flex-col justify-between min-h-[190px] sm:min-h-[220px]">
            {/* Card Top Row */}
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-gradient-to-tr from-indigo-500 to-purple-600 flex items-center justify-center shadow-md">
                  <Crown className="h-4 w-4 sm:h-5 sm:w-5 text-amber-300" />
                </div>
                <div>
                  <span className="text-[10px] sm:text-xs font-black tracking-widest text-indigo-300/90 uppercase block">
                    KYNISTO DIGITAL PASS
                  </span>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-black border bg-white/10 ${tierColor}`}>
                      <Sparkles className="h-2.5 w-2.5" /> {tierName}
                    </span>
                  </div>
                </div>
              </div>

              {/* Crisp Interactive QR Code Badge */}
              <button
                onClick={handleOpenScanModal}
                title="Tap to scan or verify QR"
                className="flex items-center gap-2 bg-white/90 dark:bg-white text-slate-950 p-2 sm:p-2.5 rounded-2xl shadow-lg hover:scale-105 active:scale-95 transition-all cursor-pointer border border-white/40"
              >
                <QrCode className="h-5 w-5 sm:h-6 sm:w-6 text-slate-900" />
                <span className="hidden sm:inline text-[11px] font-black tracking-tight text-slate-900">SCAN PASS</span>
              </button>
            </div>

            {/* Card Middle Balance Typography */}
            <div className="my-4 sm:my-5">
              <span className="text-[10px] sm:text-xs font-bold uppercase tracking-wider text-indigo-200/70 block mb-1">
                Available Global Points Balance
              </span>
              <div className="flex items-baseline gap-2">
                <div className="text-3xl sm:text-5xl font-black tracking-tight text-white drop-shadow-[0_2px_10px_rgba(255,255,255,0.25)]">
                  <AnimatedNumber value={kynistoPoints.total} />
                </div>
                <span className="text-base sm:text-xl font-extrabold text-indigo-300">PTS</span>
                <span className="text-xs font-bold text-gray-400 ml-1">/ 1,000 Cap</span>
              </div>

              {/* Mini Sleek Progress Cap */}
              <div className="w-full bg-slate-800/80 rounded-full h-2 mt-3 overflow-hidden border border-slate-700/50">
                <div 
                  className="bg-gradient-to-r from-indigo-500 via-teal-400 to-emerald-400 h-full rounded-full transition-all duration-500 shadow-[0_0_10px_rgba(52,211,153,0.5)]"
                  style={{ width: `${Math.min(100, (kynistoPoints.total / 1000) * 100)}%` }}
                />
              </div>
            </div>

            {/* Card Bottom Row */}
            <div className="flex items-center justify-between text-xs font-bold text-indigo-200/80 pt-2 border-t border-indigo-500/20">
              <div className="flex items-center gap-2">
                <ShieldCheck className="h-4 w-4 text-emerald-400 shrink-0" />
                <span className="text-[11px] sm:text-xs">Verified Member Pass</span>
              </div>
              <div className="flex items-center gap-1 text-[11px] sm:text-xs text-amber-300 font-extrabold">
                <span>{memberships.active.length} Active VIP Passes</span>
              </div>
            </div>
          </div>
        </div>

        {/* 4-COLUMN RESPONSIVE QUICK ACTION GRID */}
        <div className="grid grid-cols-4 gap-2 sm:gap-3.5">
          {/* Action 1: Scan QR */}
          <button
            onClick={handleOpenScanModal}
            className="group flex flex-col items-center justify-center p-2.5 sm:p-4 rounded-2xl bg-white dark:bg-black border border-gray-200 dark:border-gray-800 shadow-sm hover:shadow-md hover:border-emerald-500/50 hover:bg-emerald-50/40 dark:hover:bg-emerald-950/20 active:scale-95 transition-all cursor-pointer"
          >
            <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-2xl bg-gradient-to-tr from-emerald-500 to-teal-400 text-white flex items-center justify-center shadow-lg shadow-emerald-500/25 group-hover:scale-110 transition-transform">
              <QrCode className="h-5 w-5 sm:h-6 sm:w-6" />
            </div>
            <span className="mt-1.5 sm:mt-2 text-[11px] sm:text-xs font-black text-gray-900 dark:text-gray-100 text-center tracking-tight">Scan QR</span>
          </button>

          {/* Action 2: Pay Store */}
          <button
            onClick={handleOpenScanModal}
            className="group flex flex-col items-center justify-center p-2.5 sm:p-4 rounded-2xl bg-white dark:bg-black border border-gray-200 dark:border-gray-800 shadow-sm hover:shadow-md hover:border-indigo-500/50 hover:bg-indigo-50/40 dark:hover:bg-indigo-950/20 active:scale-95 transition-all cursor-pointer"
          >
            <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-2xl bg-gradient-to-tr from-indigo-600 to-blue-500 text-white flex items-center justify-center shadow-lg shadow-indigo-500/25 group-hover:scale-110 transition-transform">
              <CreditCard className="h-5 w-5 sm:h-6 sm:w-6" />
            </div>
            <span className="mt-1.5 sm:mt-2 text-[11px] sm:text-xs font-black text-gray-900 dark:text-gray-100 text-center tracking-tight">Pay Store</span>
          </button>

          {/* Action 3: Add Coins */}
          <button
            onClick={handleOpenScanModal}
            className="group flex flex-col items-center justify-center p-2.5 sm:p-4 rounded-2xl bg-white dark:bg-black border border-gray-200 dark:border-gray-800 shadow-sm hover:shadow-md hover:border-amber-500/50 hover:bg-amber-50/40 dark:hover:bg-amber-950/20 active:scale-95 transition-all cursor-pointer"
          >
            <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-2xl bg-gradient-to-tr from-amber-500 to-orange-400 text-white flex items-center justify-center shadow-lg shadow-amber-500/25 group-hover:scale-110 transition-transform">
              <Coins className="h-5 w-5 sm:h-6 sm:w-6" />
            </div>
            <span className="mt-1.5 sm:mt-2 text-[11px] sm:text-xs font-black text-gray-900 dark:text-gray-100 text-center tracking-tight">Add Coins</span>
          </button>

          {/* Action 4: Redeem */}
          <button
            onClick={handleRedeemKynistoPoints}
            disabled={kynistoPoints.total < 1000 || redeeming}
            className="group flex flex-col items-center justify-center p-2.5 sm:p-4 rounded-2xl bg-white dark:bg-black border border-gray-200 dark:border-gray-800 shadow-sm hover:shadow-md hover:border-purple-500/50 hover:bg-purple-50/40 dark:hover:bg-purple-950/20 disabled:opacity-40 disabled:hover:scale-100 active:scale-95 transition-all cursor-pointer"
          >
            <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-2xl bg-gradient-to-tr from-purple-600 to-pink-500 text-white flex items-center justify-center shadow-lg shadow-purple-500/25 group-hover:scale-110 transition-transform">
              {redeeming ? <Loader2 className="h-5 w-5 sm:h-6 sm:w-6 animate-spin" /> : <Gift className="h-5 w-5 sm:h-6 sm:w-6" />}
            </div>
            <span className="mt-1.5 sm:mt-2 text-[11px] sm:text-xs font-black text-gray-900 dark:text-gray-100 text-center tracking-tight">Redeem</span>
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex space-x-1.5 sm:space-x-2 overflow-x-auto no-scrollbar rounded-2xl bg-white dark:bg-black p-1.5 sm:p-2 border border-gray-200 dark:border-gray-800 shadow-sm">
        {[
          { id: 'kynisto', label: 'Kynisto Points', shortLabel: 'Points', icon: Award },
          { id: 'loyalty', label: 'Store Loyalty', shortLabel: 'Loyalty', icon: Store },
          { id: 'memberships', label: `Memberships (${totalMemberships})`, shortLabel: `VIP (${totalMemberships})`, icon: Crown },
          { id: 'history', label: 'Scan Audit History', shortLabel: 'History', icon: Clock },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => { setActiveTab(tab.id as any); setRedeemResult(null); }}
            className={`flex flex-1 items-center justify-center space-x-1.5 sm:space-x-2 rounded-xl py-2.5 sm:py-3 px-2 sm:px-4 text-xs sm:text-sm font-extrabold whitespace-nowrap transition-all cursor-pointer ${
              activeTab === tab.id
                ? 'bg-gradient-to-r from-indigo-600 to-purple-700 text-white shadow-md'
                : 'text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800'
            }`}
          >
            <tab.icon className="h-4 w-4 shrink-0" />
            <span className="hidden sm:inline">{tab.label}</span>
            <span className="sm:hidden">{tab.shortLabel}</span>
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div className="space-y-6">
        {/* Kynisto Points Tab */}
        {activeTab === 'kynisto' && (
          <div className="space-y-6 animate-in fade-in duration-500">
            {/* Progress & Cap Detail Card */}
            <div className="rounded-3xl bg-white dark:bg-black p-5 sm:p-8 border border-gray-200 dark:border-gray-800 shadow-xl relative overflow-hidden">
              <div className="absolute top-0 right-0 -mt-16 -mr-16 h-64 w-64 rounded-full bg-indigo-500/10 blur-3xl pointer-events-none" />
              
              <div className="relative z-10">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4 mb-6">
                  <div>
                    <h2 className="text-lg sm:text-xl font-extrabold text-black dark:text-white mb-1">Global Kynisto Points Status</h2>
                    <div className="text-4xl sm:text-6xl font-black text-black dark:text-white">
                      <AnimatedNumber value={kynistoPoints.total} /> <span className="text-xl sm:text-2xl text-indigo-600 dark:text-indigo-400 font-extrabold">PTS</span>
                    </div>
                  </div>
                  
                  <div className="w-full sm:w-auto text-left sm:text-right">
                    <p className="text-xs sm:text-sm font-bold text-black dark:text-white mb-2">
                      <span className="text-indigo-600 dark:text-indigo-400 font-extrabold">{kynistoPoints.total}</span> / 1000 Points Maximum Cap
                    </p>
                    <button
                      onClick={handleRedeemKynistoPoints}
                      disabled={kynistoPoints.total < 1000 || redeeming}
                      className="w-full sm:w-auto inline-flex items-center justify-center rounded-xl bg-gradient-to-r from-indigo-600 to-purple-700 px-5 py-3 text-xs sm:text-sm font-extrabold text-white shadow-lg transition-all hover:scale-105 disabled:opacity-50 disabled:hover:scale-100 focus:ring-2 focus:ring-indigo-500 focus:outline-none cursor-pointer"
                    >
                      {redeeming ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Gift className="h-4 w-4 mr-2" />}
                      Redeem 1000 Points Reward
                    </button>
                  </div>
                </div>

                {/* Progress Bar & Cap Notice */}
                <div className="flex items-center space-x-4 sm:space-x-6 bg-gray-50 dark:bg-gray-900/50 p-4 rounded-2xl border border-gray-100 dark:border-gray-800">
                  <ProgressRing progress={kynistoPoints.total} max={1000} />
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-[11px] sm:text-xs font-black uppercase text-gray-500 dark:text-gray-400 truncate">1000 PTS Cap Limit</span>
                      <span className="text-xs font-black text-indigo-600 dark:text-indigo-400">{Math.min(100, Math.round((kynistoPoints.total / 1000) * 100))}%</span>
                    </div>
                    <div className="w-full bg-gray-200 dark:bg-gray-800 rounded-full h-3 overflow-hidden">
                      <div className="bg-gradient-to-r from-indigo-500 to-emerald-400 h-full transition-all duration-500 rounded-full" style={{ width: `${Math.min(100, (kynistoPoints.total / 1000) * 100)}%` }} />
                    </div>
                    {kynistoPoints.total >= 1000 && (
                      <p className="text-xs font-bold text-amber-500 mt-2 flex items-center gap-1">
                        <Sparkles className="h-3.5 w-3.5" /> Maximum 1,000 points reached! Redeem points to continue earning.
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Exclusive Scan Notice */}
            <div className="p-4 rounded-2xl bg-gradient-to-r from-emerald-500/10 via-teal-500/10 to-indigo-500/10 border border-emerald-500/30 text-emerald-400 text-xs sm:text-sm font-bold flex items-center gap-3">
              <ShieldCheck className="h-5 w-5 sm:h-6 sm:w-6 flex-shrink-0 text-emerald-400" />
              <span>
                <b>Strict System Policy:</b> Both Kynisto Points and Store Loyalty Points are awarded <b>ONLY via scanning a participating store&apos;s Kynisto QR Code</b>.
              </span>
            </div>

            {/* Redeem Result Notification */}
            {redeemResult && (
              <div className={`p-4 rounded-2xl font-bold text-xs sm:text-sm ${redeemResult.error ? 'bg-rose-500/10 border border-rose-500/30 text-rose-400' : 'bg-emerald-500/10 border border-emerald-500/30 text-emerald-400'}`}>
                {redeemResult.error ? redeemResult.error : `🎉 Reward Redeemed Successfully! Your reward: ${redeemResult.reward || redeemResult.coupon}`}
              </div>
            )}

            {/* Transaction History / Points Activity List on Mobile */}
            <div className="rounded-3xl bg-white dark:bg-black p-5 sm:p-6 border border-gray-200 dark:border-gray-800 shadow-xl">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-base sm:text-lg font-black text-black dark:text-white">Transaction History</h3>
                  <p className="text-xs font-bold text-gray-500 dark:text-gray-400">All points earned & redeemed across stores</p>
                </div>
                <span className="text-[11px] font-extrabold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/50 px-2.5 py-1 rounded-full border border-indigo-200 dark:border-indigo-800">
                  {kynistoPoints.history.length} Logs
                </span>
              </div>

              {kynistoPoints.history.length === 0 ? (
                <div className="text-center py-8 px-4 rounded-2xl bg-gray-50 dark:bg-gray-900/50 border border-dashed border-gray-200 dark:border-gray-800">
                  <Clock className="h-8 w-8 mx-auto text-gray-400 mb-2" />
                  <p className="text-sm font-bold text-gray-700 dark:text-gray-300">No points history recorded yet</p>
                  <p className="text-xs text-gray-500 mt-1">Scan a partner store QR code to earn your first loyalty reward points!</p>
                </div>
              ) : (
                <div className="space-y-2.5 sm:space-y-3">
                  {kynistoPoints.history.map((tx) => {
                    const isEarned = tx.type === 'earned';
                    return (
                      <div
                        key={tx.id}
                        className="flex items-center justify-between p-3 sm:p-4 rounded-2xl bg-gray-50 dark:bg-gray-900/70 border border-gray-100 dark:border-gray-800/80 hover:border-indigo-500/30 transition-all gap-3"
                      >
                        <div className="flex items-center space-x-3 min-w-0">
                          <div className={`w-9 h-9 sm:w-10 sm:h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${
                            isEarned 
                              ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30' 
                              : 'bg-rose-500/15 text-rose-600 dark:text-rose-400 border border-rose-500/30'
                          }`}>
                            {isEarned ? <ArrowDownLeft className="h-4 w-4 sm:h-5 sm:w-5" /> : <ArrowUpRight className="h-4 w-4 sm:h-5 sm:w-5" />}
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="font-extrabold text-xs sm:text-sm text-black dark:text-white truncate">
                              {tx.description}
                            </div>
                            <div className="text-[11px] font-bold text-gray-500 dark:text-gray-400 flex items-center gap-1 mt-0.5">
                              <Clock className="h-3 w-3 inline shrink-0" />
                              <span className="truncate">{tx.date}</span>
                            </div>
                          </div>
                        </div>
                        
                        <div className="flex-shrink-0">
                          <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs sm:text-sm font-black ${
                            isEarned
                              ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30'
                              : 'bg-rose-500/15 text-rose-600 dark:text-rose-400 border border-rose-500/30'
                          }`}>
                            {isEarned ? '+' : '-'}{Math.abs(tx.points)} PTS
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Store Loyalty Tab */}
        {activeTab === 'loyalty' && (
          <div className="space-y-6 animate-in fade-in duration-500">
            <div className="rounded-3xl bg-white dark:bg-black p-6 border border-gray-200 dark:border-gray-800 shadow-xl">
              <h2 className="text-xl font-extrabold text-black dark:text-white mb-2">Store-Specific Loyalty Balances</h2>
              <p className="text-sm font-bold text-gray-500 dark:text-gray-400 mb-6">Each store has its own independent loyalty points balance earned by scanning that store&apos;s Kynisto QR Code.</p>

              {loyaltyPoints.length === 0 ? (
                <div className="text-center py-10 space-y-3">
                  <Store className="h-12 w-12 mx-auto text-gray-400" />
                  <p className="text-base font-black text-gray-700 dark:text-gray-300">No store loyalty points yet!</p>
                  <p className="text-sm font-bold text-gray-500 max-w-md mx-auto">Visit any participating store and scan their Kynisto QR Code to earn 50–100 Store Loyalty Points per scan.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {loyaltyPoints.map((lp) => (
                    <div key={lp.storeId} className="p-5 rounded-2xl bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-800 flex flex-col justify-between space-y-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <img src={lp.logoUrl} alt={lp.storeName} className="h-10 w-10 rounded-xl object-cover border border-gray-200 dark:border-gray-800" />
                          <div>
                            <div className="font-extrabold text-black dark:text-white">{lp.storeName}</div>
                            <div className="text-xs font-bold text-gray-500">Last visited: {lp.lastVisit}</div>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-baseline justify-between border-t border-gray-200 dark:border-gray-800 pt-3">
                        <span className="text-xs font-black uppercase text-gray-500">Loyalty Balance</span>
                        <span className="text-2xl font-black text-emerald-500">+{lp.points} Points</span>
                      </div>

                      <button
                        onClick={() => handleRedeemLoyalty(lp.storeId)}
                        disabled={!lp.canRedeemDiscount || redeeming}
                        className="w-full py-2.5 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-extrabold text-xs transition-all cursor-pointer"
                      >
                        Redeem Store Discount (Min 100 Points)
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Memberships Tab */}
        {activeTab === 'memberships' && (
          <div className="space-y-6 animate-in fade-in duration-500">
            <div className="rounded-3xl bg-white dark:bg-black p-6 border border-gray-200 dark:border-gray-800 shadow-xl space-y-6">
              <div>
                <h2 className="text-xl font-extrabold text-black dark:text-white mb-1">My VIP Store Memberships</h2>
                <p className="text-xs font-bold text-gray-500 dark:text-gray-400">View all your active memberships and pending store pass activation requests.</p>
              </div>

              {/* PENDING ACTIVATION MEMBERSHIPS */}
              {memberships.pending && memberships.pending.length > 0 && (
                <div className="space-y-3">
                  <h3 className="text-sm font-black text-amber-500 flex items-center gap-2 uppercase tracking-wide">
                    <Clock className="h-4 w-4" /> Pending Store Approvals ({memberships.pending.length})
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {memberships.pending.map((mem) => (
                      <div key={mem.id} className="p-5 rounded-2xl bg-slate-900 border-2 border-amber-500/50 text-white flex flex-col justify-between space-y-3">
                        <div className="flex justify-between items-center">
                          <span className="font-black text-lg text-amber-300">{mem.type}</span>
                          <span className="bg-amber-500/20 text-amber-400 border border-amber-500/40 text-[11px] font-black px-2.5 py-1 rounded-full">
                            PENDING VERIFICATION
                          </span>
                        </div>
                        <div className="text-sm font-bold text-gray-300">{mem.storeName}</div>
                        <div className="bg-slate-950/70 p-3 rounded-xl text-xs space-y-1 text-gray-400 font-extrabold">
                          <div>Price: <b className="text-emerald-400">₹{mem.pricePaid}</b></div>
                          {mem.utr && <div>UTR Ref: <code className="text-indigo-400">{mem.utr}</code></div>}
                          <div className="text-amber-400 font-bold mt-1">
                            Don&apos;t panic! The shop owner will verify your payment and activate your membership within 24 hours.
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* ACTIVE MEMBERSHIPS */}
              <div>
                <h3 className="text-sm font-black text-emerald-400 flex items-center gap-2 uppercase tracking-wide mb-3">
                  <CheckCircle2 className="h-4 w-4" /> Active VIP Store Passes ({memberships.active.length})
                </h3>
                {memberships.active.length === 0 && (!memberships.pending || memberships.pending.length === 0) ? (
                  <p className="text-sm font-bold text-gray-500 text-center py-8">No active store memberships yet. Browse storefronts to purchase VIP passes!</p>
                ) : memberships.active.length === 0 ? (
                  <p className="text-xs font-bold text-gray-500 py-2">No verified active passes yet. Your pending request above will be activated by the store owner soon!</p>
                ) : (
                  <div className="grid grid-cols-1 gap-6">
                    {memberships.active.map((mem: any) => (
                      <div key={mem.id} className="p-6 rounded-3xl bg-gradient-to-br from-indigo-950 via-slate-900 to-emerald-950 border-2 border-emerald-500/40 text-white flex flex-col justify-between space-y-4 shadow-2xl">
                        <div className="flex justify-between items-start">
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-black text-xl text-emerald-300">{mem.type}</span>
                              {mem.hasFreeTrial && (
                                <span className="bg-indigo-500/30 text-indigo-300 border border-indigo-500/50 text-[10px] font-black px-2 py-0.5 rounded-full">
                                  ⚡ {mem.freeTrialDays || 7}-DAY FREE TRIAL
                                </span>
                              )}
                            </div>
                            <div className="text-sm font-extrabold text-indigo-200 mt-1">{mem.storeName}</div>
                          </div>
                          <span className="bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 text-xs font-black px-3 py-1 rounded-full flex items-center gap-1">
                            <Crown className="h-3.5 w-3.5" /> ACTIVE VIP
                          </span>
                        </div>

                        <div className="flex items-center justify-between text-xs font-bold text-gray-400 bg-slate-950/60 p-3 rounded-xl border border-gray-800">
                          <span>Pass Status: <b className="text-emerald-400">Verified & Active</b></span>
                          <span>Valid Until: <b className="text-amber-400">{mem.validUntil}</b></span>
                        </div>

                        {/* SCHEDULED REWARD DROP DATES & SPECIFIC REWARDS TIMELINE */}
                        {Array.isArray(mem.rewardScheduleDates) && mem.rewardScheduleDates.length > 0 && (
                          <div className="bg-emerald-950/40 border border-emerald-500/30 p-4 rounded-2xl space-y-2">
                            <div className="text-xs font-black text-emerald-300 flex items-center gap-1.5 uppercase tracking-wide">
                              <Clock className="h-4 w-4" /> Reward Schedule & Upcoming Drop Dates
                            </div>
                            <p className="text-[11px] text-gray-400 font-bold">You will be granted specific rewards on these scheduled dates:</p>
                            <div className="grid grid-cols-1 gap-2 pt-1">
                              {mem.rewardScheduleDates.map((schedItem: any, idx: number) => {
                                const schedDate = typeof schedItem === "object" ? schedItem.date : String(schedItem);
                                const schedReward = typeof schedItem === "object" ? schedItem.reward : "Exclusive VIP Member Perk & Reward";
                                return (
                                  <div key={idx} className="bg-slate-900/90 border border-emerald-500/30 p-3 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                                    <div className="flex items-center gap-2 text-xs font-black text-emerald-300">
                                      <Clock className="h-3.5 w-3.5 text-emerald-400 shrink-0" />
                                      <span>📅 {schedDate}</span>
                                    </div>
                                    <div className="flex items-center gap-1.5 text-xs font-extrabold text-amber-300 bg-amber-500/10 border border-amber-500/30 px-3 py-1 rounded-lg">
                                      <Gift className="h-3.5 w-3.5 text-amber-400 shrink-0" />
                                      <span>🎁 {schedReward}</span>
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        )}

                        {/* MEMBER-EXCLUSIVE OFFERS & COUPONS */}
                        {Array.isArray(mem.memberOffers) && mem.memberOffers.length > 0 && (
                          <div className="bg-pink-950/40 border border-pink-500/30 p-4 rounded-2xl space-y-2">
                            <div className="text-xs font-black text-pink-300 flex items-center gap-1.5 uppercase tracking-wide">
                              <Gift className="h-4 w-4" /> Member-Exclusive Coupons & Special Offers
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                              {mem.memberOffers.map((off: any, idx: number) => (
                                <div key={idx} className="bg-slate-900/90 border border-pink-500/30 p-3 rounded-xl flex flex-col justify-between space-y-1">
                                  <div className="text-xs font-black text-white">{off.title}</div>
                                  <div className="text-[11px] font-bold text-gray-400">{off.detail}</div>
                                  {off.code && (
                                    <div className="bg-pink-500/20 text-pink-300 border border-pink-500/40 px-2 py-1 rounded text-[11px] font-mono font-black self-start mt-1">
                                      CODE: {off.code}
                                    </div>
                                  )}
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* BENEFITS LIST */}
                        <div>
                          <div className="text-xs font-black text-gray-400 uppercase tracking-wide mb-2">Included VIP Pass Benefits:</div>
                          <ul className="text-xs space-y-1.5 text-gray-300">
                            {mem.benefits?.map((b: string, idx: number) => (
                              <li key={idx} className="flex items-center gap-2">
                                <span className="text-emerald-400 font-bold">✓</span> {b}
                              </li>
                            ))}
                          </ul>
                        </div>

                        {/* UPGRADE MEMBERSHIP ACTION */}
                        <div className="border-t border-gray-800 pt-3 flex items-center justify-between">
                          <span className="text-xs font-bold text-gray-400">Want higher perks & rewards?</span>
                          <a 
                            href={mem.storeId ? `/stores/${mem.storeId}` : '/stores'} 
                            className="px-4 py-2 bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white font-extrabold text-xs rounded-xl shadow-lg transition-all flex items-center gap-1.5"
                          >
                            <Crown className="h-3.5 w-3.5" /> Upgrade Membership Plan
                          </a>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* CANCELLED / EXPIRED MEMBERSHIPS */}
              {memberships.expired && memberships.expired.length > 0 && (
                <div className="space-y-3 border-t border-gray-800 pt-6">
                  <h3 className="text-sm font-black text-rose-400 flex items-center gap-2 uppercase tracking-wide">
                    <X className="h-4 w-4" /> Cancelled or Expired Memberships ({memberships.expired.length})
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {memberships.expired.map((mem: any) => (
                      <div key={mem.id} className="p-5 rounded-2xl bg-rose-950/20 border border-rose-500/40 text-white flex flex-col justify-between space-y-3">
                        <div className="flex justify-between items-center">
                          <span className="font-black text-base text-rose-300">{mem.type}</span>
                          <span className="bg-rose-500/20 text-rose-400 border border-rose-500/40 text-[10px] font-black px-2.5 py-1 rounded-full uppercase">
                            {mem.status === "cancelled_by_owner" ? "CANCELLED BY OWNER" : "EXPIRED"}
                          </span>
                        </div>
                        <div className="text-xs font-bold text-gray-300">{mem.storeName}</div>
                        <div className="bg-slate-950/80 p-3 rounded-xl text-xs space-y-1 text-rose-200 border border-rose-500/30">
                          <div className="font-black flex items-center gap-1.5 text-rose-400">
                            🛑 {mem.status === "cancelled_by_owner" ? "Membership Cancelled by Store Owner" : "Pass Expired"}
                          </div>
                          <div>Reason / Notice: <b>{mem.rejectionReason || "Cancelled or expired"}</b></div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Scan History Tab */}
        {activeTab === 'history' && (
          <div className="space-y-6 animate-in fade-in duration-500">
            <div className="rounded-3xl bg-white dark:bg-black p-6 border border-gray-200 dark:border-gray-800 shadow-xl">
              <h2 className="text-xl font-extrabold text-black dark:text-white mb-4">My QR Scan Audit Logs</h2>
              {scanLogs.length === 0 ? (
                <p className="text-sm font-bold text-gray-500 text-center py-8">No QR scan history recorded yet.</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs font-bold">
                    <thead>
                      <tr className="border-b border-gray-200 dark:border-gray-800 text-gray-500">
                        <th className="py-3 px-2">Date & Time</th>
                        <th className="py-3 px-2">Store</th>
                        <th className="py-3 px-2">Kynisto Points</th>
                        <th className="py-3 px-2">Store Points</th>
                        <th className="py-3 px-2">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                      {scanLogs.map((log: any) => (
                        <tr key={log.id}>
                          <td className="py-3 px-2 text-gray-400">{new Date(log.scanned_at * 1000).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" })}</td>
                          <td className="py-3 px-2 text-black dark:text-white font-extrabold">{log.store_name || "Partner Store"}</td>
                          <td className="py-3 px-2 text-indigo-500 font-extrabold">+{log.kynisto_points_earned}</td>
                          <td className="py-3 px-2 text-emerald-500 font-extrabold">+{log.store_points_earned}</td>
                          <td className="py-3 px-2">
                            <span className={`px-2 py-1 rounded-md text-[10px] font-black ${
                              log.status === "success" || log.status === "capped_kynisto" ? "bg-emerald-500/20 text-emerald-400" : "bg-rose-500/20 text-rose-400"
                            }`}>
                              {log.status}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* CUSTOMER INTERACTIVE QR SCANNER MODAL WITH CAMERA WEBRTC & FILE UPLOAD */}
      {showScanModal && (
        <div className="fixed inset-0 z-[9999] bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-slate-900 border-2 border-emerald-500 rounded-3xl p-6 w-full max-w-md text-white shadow-2xl relative animate-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-black text-emerald-400 flex items-center gap-2">
                <QrCode className="h-5 w-5" /> Scan Store Kynisto QR Code
              </h3>
              <button onClick={handleCloseModal} className="text-gray-400 hover:text-white text-xl cursor-pointer">
                <X className="h-6 w-6" />
              </button>
            </div>

            {scanResult?.success && (
              <div className="mb-4 p-4 rounded-2xl bg-emerald-500/20 border border-emerald-500 text-emerald-300 font-bold text-sm space-y-2">
                <div className="flex items-center gap-2 text-base font-black text-emerald-400">
                  <CheckCircle2 className="h-6 w-6" /> {scanResult.storeName} Scan Verified!
                </div>
                {scanResult.isHealthcare && (
                  <div className="bg-emerald-950/80 p-3.5 rounded-xl border border-emerald-500/50 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs uppercase tracking-wider text-emerald-400 font-extrabold">Live Healthcare Pass</span>
                      <span className="bg-emerald-500 text-white text-xs font-black px-2.5 py-0.5 rounded-full">Active</span>
                    </div>
                    <div className="text-2xl font-black text-white">Token #{scanResult.tokenNumber}</div>
                    <p className="text-xs text-emerald-200 font-medium">{scanResult.message}</p>
                    {scanResult.redirectUrl && (
                      <a
                        href={scanResult.redirectUrl}
                        className="inline-flex items-center justify-center gap-2 w-full py-2 px-3 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 text-white font-bold text-xs shadow-md transition-all cursor-pointer"
                      >
                        <span>View Live Ticket Online</span>
                        <ChevronRight className="w-3.5 h-3.5" />
                      </a>
                    )}
                  </div>
                )}
                <div className="bg-slate-950/60 p-3 rounded-xl space-y-1 text-xs font-extrabold">
                  <div className="text-indigo-400">✨ +{scanResult.kynistoPointsEarned} Kynisto Points</div>
                  <div className="text-emerald-400">🏪 +{scanResult.storePointsEarned} Store Loyalty Points</div>
                </div>
              </div>
            )}


            {scanResult?.error && (
              <div className="mb-4 p-4 rounded-2xl bg-rose-500/20 border border-rose-500 text-rose-300 font-bold text-xs">
                ⚠️ {scanResult.error}
              </div>
            )}

            <div className="space-y-4">
              {/* LIVE CAMERA PREVIEW FEED */}
              {isCameraActive ? (
                <div className="relative rounded-2xl overflow-hidden border-2 border-emerald-400 bg-black aspect-video flex items-center justify-center">
                  <video ref={videoRef} playsInline autoPlay muted className="w-full h-full object-cover" />
                  <div className="absolute inset-0 border-2 border-dashed border-emerald-400/70 m-8 rounded-xl pointer-events-none flex items-center justify-center">
                    <span className="text-[10px] font-black text-emerald-300 bg-slate-950/80 px-2 py-1 rounded">Position Store QR Code in Frame</span>
                  </div>
                  <button
                    onClick={stopCamera}
                    className="absolute top-2 right-2 bg-rose-600/90 text-white p-1.5 rounded-lg text-xs font-bold cursor-pointer"
                  >
                    Close Camera
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <button
                    onClick={startCamera}
                    className="w-full py-3.5 px-3 rounded-2xl border-2 border-emerald-500/60 bg-emerald-950/40 hover:bg-emerald-900/50 text-emerald-300 font-extrabold text-xs flex flex-col items-center justify-center gap-1 cursor-pointer transition-all"
                  >
                    <Camera className="h-6 w-6 text-emerald-400" />
                    <span>Open Camera Scan</span>
                  </button>

                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="w-full py-3.5 px-3 rounded-2xl border-2 border-indigo-500/60 bg-indigo-950/40 hover:bg-indigo-900/50 text-indigo-300 font-extrabold text-xs flex flex-col items-center justify-center gap-1 cursor-pointer transition-all"
                  >
                    <Upload className="h-6 w-6 text-indigo-400" />
                    <span>Upload QR Photo</span>
                  </button>
                  
                  <input
                    type="file"
                    ref={fileInputRef}
                    accept="image/*"
                    capture="environment"
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                </div>
              )}

              <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 text-center space-y-2">
                <div className="text-xs font-bold text-gray-400">Point camera or enter store URL, slug, or QR token:</div>
                <input
                  type="text"
                  value={qrInputToken}
                  onChange={(e) => setQrInputToken(e.target.value)}
                  placeholder="e.g. /stores/testimonial-2a0958 or token"
                  className="w-full bg-slate-900 border border-slate-700 text-white px-4 py-3 rounded-xl font-mono text-center text-sm font-bold focus:border-emerald-500 focus:outline-none"
                />
              </div>

              <button
                disabled={scanning}
                onClick={() => handleProcessQrScan()}
                className="w-full py-3.5 px-6 rounded-xl font-black bg-gradient-to-r from-emerald-500 to-teal-600 text-white hover:brightness-110 active:scale-98 transition-all flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/20 cursor-pointer disabled:opacity-50"
              >
                {scanning ? <Loader2 className="h-5 w-5 animate-spin" /> : <ShieldCheck className="h-5 w-5" />}
                <span>Verify QR Scan & Claim Points</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
