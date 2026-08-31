"use client";

import React, { useState, useRef, useEffect } from "react";
import {
  QrCode,
  X,
  Camera,
  Upload,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  Search,
  ArrowRight,
  Stethoscope,
  Building2,
  Clock,
  MapPin,
  Loader2,
  Check,
  Copy,
} from "lucide-react";
import { apiFetch } from "@/lib/client-api";
import { saveQueueSession } from "@/lib/queue-persistence";

interface UniversalHealthcareQrScannerProps {
  onClose: () => void;
  onSuccess: (tokenNumber: number, queueState: any, storeId?: string) => void;
}

export function UniversalHealthcareQrScanner({
  onClose,
  onSuccess,
}: UniversalHealthcareQrScannerProps) {
  const [activeTab, setActiveTab] = useState<"camera" | "code">("camera");
  const [manualCode, setManualCode] = useState("");
  const [scanning, setScanning] = useState(false);
  const [scanResult, setScanResult] = useState<{
    success?: boolean;
    message?: string;
    error?: string;
    tokenNumber?: number;
    storeName?: string;
  } | null>(null);
  const [isCameraActive, setIsCameraActive] = useState(false);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const scanIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const startCamera = async () => {
    setScanResult(null);
    try {
      if (!navigator.mediaDevices?.getUserMedia) {
        setScanResult({
          error:
            "Camera access is not supported on this browser. Upload a QR photo or enter the code manually below.",
        });
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
        const detector = new (window as any).BarcodeDetector({
          formats: ["qr_code"],
        });
        scanIntervalRef.current = setInterval(async () => {
          if (videoRef.current && videoRef.current.readyState === 4) {
            try {
              const barcodes = await detector.detect(videoRef.current);
              if (barcodes?.length > 0 && barcodes[0].rawValue) {
                stopCamera();
                await handleProcessCode(barcodes[0].rawValue);
              }
            } catch {
              // Ignore frame detection failures
            }
          }
        }, 400);
      }
    } catch (err: any) {
      setScanResult({
        error:
          "Camera permission denied or unavailable. Upload a photo or enter the clinic code manually below.",
      });
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
    if (activeTab === "camera") {
      void startCamera();
    } else {
      stopCamera();
    }
    return () => {
      stopCamera();
    };
  }, [activeTab]);

  const handleProcessCode = async (rawCode: string) => {
    const cleaned = rawCode.trim();
    if (!cleaned) {
      setScanResult({ error: "Please enter a clinic queue code or store slug." });
      return;
    }

    setScanning(true);
    setScanResult(null);

    // Extract code if full URL, path, or raw code was scanned
    let targetCode = cleaned;
    try {
      if (cleaned.startsWith("http://") || cleaned.startsWith("https://")) {
        const parsed = new URL(cleaned);
        const parts = parsed.pathname.split("/").filter(Boolean);
        if (parts.length > 0) {
          targetCode = parts[parts.length - 1];
        }
      } else if (cleaned.includes("/")) {
        const parts = cleaned.split("/").filter(Boolean);
        if (parts.length > 0) {
          targetCode = parts[parts.length - 1];
        }
      }
    } catch {
      const urlMatch = cleaned.match(/(?:q|queue\/clinic|stores)\/([A-Za-z0-9_-]+)/i);
      if (urlMatch && urlMatch[1]) {
        targetCode = urlMatch[1];
      }
    }
    targetCode = targetCode.split("?")[0].split("#")[0].trim();


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
        setScanResult({
          success: true,
          message: res.message,
          tokenNumber: res.tokenNumber,
          storeName: res.record?.storeName,
        });
        if (typeof navigator !== "undefined" && "vibrate" in navigator) {
          navigator.vibrate([100, 50, 100]);
        }
        if (res.tokenNumber && res.record?.storeId) {
          saveQueueSession({
            storeId: res.record.storeId,
            storeName: res.record.storeName,
            tokenNumber: res.tokenNumber,
            joinedAt: Date.now(),
            queueCode: targetCode,
          });
        }
        setTimeout(() => {
          onSuccess(res.tokenNumber, res.queueState, res.record?.storeId);
          onClose();
        }, 1200);
      } else {
        setScanResult({ error: "Could not find an active queue for this code." });
      }
    } catch (err: any) {
      setScanResult({
        error: err instanceof Error ? err.message : "Queue verification failed.",
      });
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
          const detector = new (window as any).BarcodeDetector({
            formats: ["qr_code"],
          });
          const barcodes = await detector.detect(img);
          if (barcodes?.length > 0 && barcodes[0].rawValue) {
            await handleProcessCode(barcodes[0].rawValue);
            return;
          }
        } catch {
          // Fallback
        }
      }
      const candidate = file.name.replace(/\.[^/.]+$/, "");
      await handleProcessCode(candidate);
    };
    reader.readAsDataURL(file);
  };

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200"
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          stopCamera();
          onClose();
        }
      }}
    >
      <div className="bg-white border border-slate-200 rounded-3xl w-full max-w-lg p-6 sm:p-7 shadow-2xl relative overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-start justify-between gap-4 mb-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="px-3 py-1 rounded-full bg-emerald-100 border border-emerald-300 text-emerald-800 text-[11px] font-black uppercase tracking-wider">
                ⚡ Universal Queue Scanner
              </span>
            </div>
            <h3 className="text-xl sm:text-2xl font-black text-slate-900 mt-1">
              Scan & Join Live Queue
            </h3>
            <p className="text-xs text-slate-500 font-medium mt-0.5">
              Scan any clinic/hospital QR code or type their code to instantly check in.
            </p>
          </div>
          <button
            type="button"
            onClick={() => {
              stopCamera();
              onClose();
            }}
            className="w-9 h-9 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 flex items-center justify-center transition-colors cursor-pointer shrink-0"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tab switcher */}
        <div className="grid grid-cols-2 gap-2 p-1.5 bg-slate-100 rounded-2xl mb-5">
          <button
            type="button"
            onClick={() => setActiveTab("camera")}
            className={`py-2.5 px-3 rounded-xl text-xs font-black uppercase tracking-wider transition-all cursor-pointer flex items-center justify-center gap-2 ${
              activeTab === "camera"
                ? "bg-emerald-600 text-white shadow-md shadow-emerald-600/20"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            <Camera className="w-4 h-4" />
            <span>Camera Scanner</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("code")}
            className={`py-2.5 px-3 rounded-xl text-xs font-black uppercase tracking-wider transition-all cursor-pointer flex items-center justify-center gap-2 ${
              activeTab === "code"
                ? "bg-emerald-600 text-white shadow-md shadow-emerald-600/20"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            <QrCode className="w-4 h-4" />
            <span>Enter Code / Link</span>
          </button>
        </div>

        {/* Scan Status Notice */}
        {scanning && (
          <div className="mb-4 p-3 bg-emerald-50 border border-emerald-200 text-emerald-900 rounded-2xl text-xs font-bold flex items-center justify-center gap-2 w-full animate-pulse">
            <Loader2 className="w-4 h-4 animate-spin text-emerald-600 shrink-0" />
            <span>Synchronizing clinic queue & verifying arrival...</span>
          </div>
        )}

        {scanResult?.success && (
          <div className="mb-4 p-4 bg-emerald-50 border-2 border-emerald-500 text-emerald-950 rounded-2xl text-xs font-bold space-y-1 w-full animate-in zoom-in-95">
            <div className="flex items-center gap-2 text-sm font-black text-emerald-800">
              <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
              <span>{scanResult.storeName ? `${scanResult.storeName} Check-in Confirmed!` : "Queue Joined Successfully!"}</span>
            </div>
            <p className="text-emerald-700 text-xs">{scanResult.message}</p>
            {scanResult.tokenNumber && (
              <div className="mt-2 text-base font-black text-slate-900">
                Assigned Token #{scanResult.tokenNumber}
              </div>
            )}
          </div>
        )}

        {scanResult?.error && (
          <div className="mb-4 p-3.5 bg-rose-50 border border-rose-200 text-rose-800 rounded-2xl text-xs font-bold flex items-center gap-2.5 w-full">
            <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
            <span className="leading-tight">{scanResult.error}</span>
          </div>
        )}

        {/* Camera Scanner View */}
        {activeTab === "camera" && (
          <div className="flex flex-col items-center">
            <div className="w-full h-64 bg-slate-950 rounded-2xl relative overflow-hidden mb-4 flex items-center justify-center border-2 border-slate-800">
              <video
                ref={videoRef}
                playsInline
                muted
                className="w-full h-full object-cover"
              />
              {!isCameraActive && (
                <div className="absolute inset-0 flex flex-col items-center justify-center p-4 text-slate-400 bg-slate-900/95 text-center">
                  <Camera className="w-12 h-12 mb-2 text-emerald-400 opacity-80" />
                  <p className="text-xs font-bold text-slate-200">
                    Scan Clinic Entrance or Counter QR Code
                  </p>
                  <p className="text-[11px] text-slate-400 mt-1 max-w-xs">
                    Hold camera in front of the clinic QR to sync your visit instantly.
                  </p>
                  <button
                    type="button"
                    onClick={startCamera}
                    className="mt-3.5 px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-black uppercase tracking-wider rounded-xl shadow-md cursor-pointer transition-all"
                  >
                    Start Camera
                  </button>
                </div>
              )}
              {isCameraActive && (
                <div className="absolute inset-0 pointer-events-none border-2 border-emerald-500/70 rounded-2xl m-6 border-dashed animate-pulse flex items-center justify-center">
                  <span className="text-[10px] font-black uppercase tracking-widest text-emerald-300 bg-slate-950/80 px-2.5 py-1 rounded-full">
                    Align QR in Frame
                  </span>
                </div>
              )}
            </div>

            <label className="w-full py-3 px-4 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs flex items-center justify-center gap-2 border border-slate-200 transition-all cursor-pointer">
              <Upload className="w-4 h-4 text-slate-500" />
              <span>Or Upload QR Photo from Gallery</span>
              <input
                type="file"
                accept="image/*"
                onChange={handleFileUpload}
                className="hidden"
              />
            </label>
          </div>
        )}

        {/* Enter Code / Link View */}
        {activeTab === "code" && (
          <form
            onSubmit={(e) => {
              e.preventDefault();
              void handleProcessCode(manualCode);
            }}
            className="flex flex-col space-y-4"
          >
            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-2">
              <label className="text-xs font-black text-slate-700 uppercase tracking-wide block">
                Clinic Code, QR Link, or Store Slug
              </label>
              <div className="relative flex items-center">
                <input
                  type="text"
                  value={manualCode}
                  onChange={(e) => setManualCode(e.target.value)}
                  placeholder="e.g. HC_A1B2C3D4 or clinic-slug"
                  className="w-full bg-white border border-slate-300 rounded-xl px-4 py-3 text-slate-900 text-sm font-bold placeholder:text-slate-400 focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20"
                />
              </div>
              <p className="text-[11px] text-slate-500">
                You can enter the code printed below the clinic QR standee or paste a queue link.
              </p>
            </div>

            <button
              type="submit"
              disabled={scanning || !manualCode.trim()}
              className="w-full py-3.5 px-5 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-black text-sm uppercase tracking-wider flex items-center justify-center gap-2 shadow-lg shadow-emerald-600/20 transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {scanning ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Verifying...</span>
                </>
              ) : (
                <>
                  <span>Join / Scan Live Queue</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
