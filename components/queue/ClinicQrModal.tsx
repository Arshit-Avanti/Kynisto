"use client";

import React, { useState, useRef, useEffect } from "react";
import { QrCode, X, Copy, Check, Camera, Upload, ExternalLink, Sparkles, CheckCircle2, AlertCircle } from "lucide-react";
import { apiFetch } from "@/lib/client-api";
import { saveQueueSession } from "@/lib/queue-persistence";

interface ClinicQrModalProps {
  storeId: string;
  storeName: string;
  storeSlug?: string;
  queueCode?: string;
  onClose: () => void;
  onSuccess: (tokenNumber: number, queueState: any) => void;
}

export function ClinicQrModal({
  storeId,
  storeName,
  storeSlug,
  queueCode,
  onClose,
  onSuccess,
}: ClinicQrModalProps) {
  const [activeTab, setActiveTab] = useState<"view" | "scan">("view");
  const [resolvedQueueCode, setResolvedQueueCode] = useState<string>(queueCode || "");
  const [copied, setCopied] = useState(false);
  const [scanning, setScanning] = useState(false);
  const [scanResult, setScanResult] = useState<{ success?: boolean; message?: string; error?: string } | null>(null);
  const [isCameraActive, setIsCameraActive] = useState(false);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const scanIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Fetch or resolve permanent queue code if not provided
  useEffect(() => {
    if (!resolvedQueueCode && storeId) {
      apiFetch<{ activeQueue?: { queueCode?: string } | null }>(`/api/healthcare/queue/active`)
        .then((res) => {
          if (res?.activeQueue?.queueCode) {
            setResolvedQueueCode(res.activeQueue.queueCode);
          } else {
            setResolvedQueueCode(storeSlug || storeId);
          }
        })
        .catch(() => {
          setResolvedQueueCode(storeSlug || storeId);
        });
    }
  }, [resolvedQueueCode, storeId, storeSlug]);

  const origin = typeof window !== "undefined" ? window.location.origin : "https://kynisto.in";
  const displayCode = resolvedQueueCode || storeSlug || storeId;
  const qrUrl = `${origin}/q/${displayCode}`;
  const qrImageUrl = `https://api.qrserver.com/v1/create-qr-code/?size=260x260&data=${encodeURIComponent(qrUrl)}&margin=10`;

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(qrUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback
    }
  };

  const startCamera = async () => {
    setScanResult(null);
    try {
      if (!navigator.mediaDevices?.getUserMedia) {
        setScanResult({ error: "Camera access is not supported on this browser. Upload a QR photo below." });
        return;
      }
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment" },
      });
      mediaStreamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
      setIsCameraActive(true);

      // Start detection loop if BarcodeDetector exists
      if (typeof window !== "undefined" && "BarcodeDetector" in window) {
        const detector = new (window as any).BarcodeDetector({ formats: ["qr_code"] });
        scanIntervalRef.current = setInterval(async () => {
          if (videoRef.current && videoRef.current.readyState === 4) {
            try {
              const barcodes = await detector.detect(videoRef.current);
              if (barcodes?.length > 0 && barcodes[0].rawValue) {
                stopCamera();
                await handleProcessScannedCode(barcodes[0].rawValue);
              }
            } catch {
              // Ignore frame detection failures
            }
          }
        }, 500);
      }
    } catch (err: any) {
      setScanResult({ error: "Camera permission denied or unavailable. Upload a photo of the clinic QR code below." });
      setIsCameraActive(false);
    }
  };

  const stopCamera = () => {
    if (scanIntervalRef.current) {
      clearInterval(scanIntervalRef.current);
      scanIntervalRef.current = null;
    }
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach((track) => track.stop());
      mediaStreamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setIsCameraActive(false);
  };

  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, []);

  const handleProcessScannedCode = async (rawCode: string) => {
    const cleaned = rawCode.trim();
    if (!cleaned) return;

    setScanning(true);
    setScanResult(null);

    // Extract queue code or slug if full URL was scanned
    let targetCode = cleaned;
    const urlMatch = cleaned.match(/(?:q|queue\/clinic)\/([A-Za-z0-9_-]+)/i);
    if (urlMatch && urlMatch[1]) {
      targetCode = urlMatch[1];
    }

    try {
      const res = await apiFetch<{
        ok: boolean;
        alreadyJoined: boolean;
        message: string;
        tokenNumber: number;
        queueState: any;
        record?: any;
      }>("/api/healthcare/qr/join", {
        method: "POST",
        json: {
          queueCode: targetCode,
          arrivalStatus: "arrived",
          markArrived: true,
        },
      });

      if (res && res.ok) {
        setScanResult({ success: true, message: res.message });
        if (typeof navigator !== "undefined" && "vibrate" in navigator) {
          navigator.vibrate([100, 50, 100]);
        }
        if (res.tokenNumber && (res.record?.storeId || storeId)) {
          saveQueueSession({
            storeId: res.record?.storeId || storeId,
            storeName: res.record?.storeName || storeName,
            tokenNumber: res.tokenNumber,
            joinedAt: Date.now(),
            queueCode: targetCode,
          });
        }
        setTimeout(() => {
          onSuccess(res.tokenNumber, res.queueState);
          onClose();
        }, 1200);
      } else {
        setScanResult({ error: "Failed to verify clinic QR code." });
      }
    } catch (err: any) {
      setScanResult({ error: err instanceof Error ? err.message : "QR verification failed." });
    } finally {
      setScanning(false);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setScanResult(null);

    const reader = new FileReader();
    reader.onload = async (event) => {
      const dataUrl = event.target?.result as string;
      if (typeof window !== "undefined" && "BarcodeDetector" in window) {
        try {
          const img = new Image();
          img.src = dataUrl;
          await img.decode();
          const detector = new (window as any).BarcodeDetector({ formats: ["qr_code"] });
          const barcodes = await detector.detect(img);
          if (barcodes?.length > 0 && barcodes[0].rawValue) {
            await handleProcessScannedCode(barcodes[0].rawValue);
            return;
          }
        } catch {
          // Fallback
        }
      }
      // Direct token candidate
      const candidate = file.name.replace(/\.[^/.]+$/, "");
      await handleProcessScannedCode(candidate);
    };
    reader.readAsDataURL(file);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-md animate-in fade-in duration-200"
      onClick={(e) => { if (e.target === e.currentTarget) { stopCamera(); onClose(); } }}
    >
      <div className="bg-white border border-slate-200 rounded-3xl w-full max-w-md p-6 sm:p-7 shadow-2xl relative overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-start justify-between gap-4 mb-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 text-[11px] font-extrabold uppercase tracking-wide">
                Live Queue QR
              </span>
            </div>
            <h3 className="text-xl font-black text-slate-900 mt-1">{storeName}</h3>
          </div>
          <button
            type="button"
            onClick={() => { stopCamera(); onClose(); }}
            className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 flex items-center justify-center transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tab switcher */}
        <div className="grid grid-cols-2 gap-1.5 p-1 bg-slate-100 rounded-2xl mb-5">
          <button
            type="button"
            onClick={() => { stopCamera(); setActiveTab("view"); }}
            className={`py-2 px-3 rounded-xl text-xs font-black uppercase tracking-wider transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
              activeTab === "view"
                ? "bg-white text-slate-900 shadow-sm"
                : "text-slate-500 hover:text-slate-800"
            }`}
          >
            <QrCode className="w-3.5 h-3.5" />
            <span>Clinic QR</span>
          </button>
          <button
            type="button"
            onClick={() => { setActiveTab("scan"); void startCamera(); }}
            className={`py-2 px-3 rounded-xl text-xs font-black uppercase tracking-wider transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
              activeTab === "scan"
                ? "bg-emerald-600 text-white shadow-sm"
                : "text-slate-500 hover:text-slate-800"
            }`}
          >
            <Camera className="w-3.5 h-3.5" />
            <span>Scan Counter QR</span>
          </button>
        </div>

        {/* View Mode */}
        {activeTab === "view" && (
          <div className="flex flex-col items-center text-center">
            <div className="p-4 bg-white border-2 border-emerald-500/30 rounded-2xl shadow-inner mb-4 flex items-center justify-center relative group">
              <img
                src={qrImageUrl}
                alt={`QR code for ${storeName}`}
                className="w-56 h-56 object-contain rounded-lg"
              />
            </div>

            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-3 w-full mb-4 flex items-center justify-between gap-2">
              <div className="text-left min-w-0 flex-1">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Queue Code</span>
                <span className="text-xs sm:text-sm font-black text-slate-900 font-mono truncate block">{displayCode}</span>
              </div>
              <button
                type="button"
                onClick={handleCopyLink}
                className="py-1.5 px-3 rounded-xl bg-white hover:bg-slate-100 border border-slate-200 text-slate-700 text-xs font-bold transition-all flex items-center gap-1 cursor-pointer shrink-0 shadow-sm"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5 text-slate-500" />}
                <span>{copied ? "Copied" : "Copy Link"}</span>
              </button>
            </div>

            <a
              href={`/q/${displayCode}`}
              target="_blank"
              rel="noreferrer"
              className="w-full py-3 px-4 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-sm flex items-center justify-center gap-2 shadow-md shadow-emerald-600/20 transition-all cursor-pointer"
            >
              <span>Open Dedicated Live QR Page</span>
              <ExternalLink className="w-4 h-4" />
            </a>
          </div>
        )}

        {/* Scan Mode */}
        {activeTab === "scan" && (
          <div className="flex flex-col items-center text-center">
            <div className="w-full h-56 bg-slate-950 rounded-2xl relative overflow-hidden mb-4 flex items-center justify-center border border-slate-800">
              <video
                ref={videoRef}
                playsInline
                muted
                className="w-full h-full object-cover"
              />
              {!isCameraActive && (
                <div className="absolute inset-0 flex flex-col items-center justify-center p-4 text-slate-400 bg-slate-900/90">
                  <Camera className="w-10 h-10 mb-2 opacity-60 text-emerald-400" />
                  <p className="text-xs font-medium">Point camera at clinic entrance or counter QR code</p>
                  <button
                    type="button"
                    onClick={startCamera}
                    className="mt-3 px-4 py-1.5 bg-emerald-600 text-white text-xs font-bold rounded-xl shadow cursor-pointer"
                  >
                    Start Camera
                  </button>
                </div>
              )}
              {isCameraActive && (
                <div className="absolute inset-0 pointer-events-none border-2 border-emerald-500/60 rounded-2xl animate-pulse" />
              )}
            </div>

            {/* Scan Status Notice */}
            {scanning && (
              <div className="mb-3 p-2.5 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs font-bold flex items-center justify-center gap-2 w-full">
                <Sparkles className="w-4 h-4 animate-spin text-emerald-600" />
                <span>Verifying and synchronizing queue arrival...</span>
              </div>
            )}

            {scanResult?.success && (
              <div className="mb-3 p-3 bg-emerald-50 border border-emerald-300 text-emerald-900 rounded-xl text-xs font-bold flex items-center gap-2 w-full">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>{scanResult.message}</span>
              </div>
            )}

            {scanResult?.error && (
              <div className="mb-3 p-3 bg-rose-50 border border-rose-200 text-rose-800 rounded-xl text-xs font-bold flex items-center gap-2 w-full">
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                <span>{scanResult.error}</span>
              </div>
            )}

            {/* Upload fallback */}
            <label className="w-full py-2.5 px-4 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs flex items-center justify-center gap-2 border border-slate-200 transition-all cursor-pointer">
              <Upload className="w-4 h-4 text-slate-500" />
              <span>Upload QR Code Image / Photo</span>
              <input
                type="file"
                accept="image/*"
                onChange={handleFileUpload}
                className="hidden"
              />
            </label>
          </div>
        )}
      </div>
    </div>
  );
}
