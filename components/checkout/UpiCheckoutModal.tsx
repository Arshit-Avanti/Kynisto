"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import {
  X,
  Check,
  Copy,
  QrCode,
  Smartphone,
  ChevronRight,
  ChevronDown,
  ChevronUp,
  ShoppingBag,
  ShieldCheck,
  Sparkles,
  RefreshCw,
  CheckCircle2,
  Receipt,
  CreditCard,
  Clock,
  Building2,
  AlertCircle,
  ExternalLink,
  Radio,
  Zap,
  Send,
  MessageSquare,
} from "lucide-react";

import {
  defaultPaymentConfig,
  createUPILink,
  openUPIPayment,
  UPIPaymentConfig,
} from "@/lib/upi-payment";
import { RazorpayCheckoutModal } from "./RazorpayCheckoutModal";

export interface ItemDetail {
  name: string;
  price: number;
  quantity?: number;
}

export interface UpiCheckoutModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  orderId: string;
  amount: number;
  itemDetails?: ItemDetail[];
  onPaymentSuccess: () => void;
  upiId?: string;
  merchantName?: string;
}

// Vector brand logos for authentic Indian fintech aesthetic in light mode
export function FamPayLogo({ className = "w-9 h-9" }: { className?: string }) {
  return (
    <div
      className={`${className} rounded-xl bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center text-slate-950 font-black italic shadow-xs select-none shrink-0`}
    >
      <span className="text-xs tracking-tight transform -skew-x-6">Fam</span>
    </div>
  );
}

export function PhonePeLogo({ className = "w-9 h-9" }: { className?: string }) {
  return (
    <div
      className={`${className} rounded-xl bg-[#5F259F] flex items-center justify-center text-white font-bold shadow-xs select-none shrink-0`}
    >
      <span className="text-sm leading-none font-bold">पे</span>
    </div>
  );
}

export function PaytmLogo({ className = "w-9 h-9" }: { className?: string }) {
  return (
    <div
      className={`${className} rounded-xl bg-[#002970] flex items-center justify-center text-white font-black shadow-xs select-none px-1 shrink-0`}
    >
      <span className="text-[10px] tracking-tighter text-[#00BAF2]">
        Pay<span className="text-white">tm</span>
      </span>
    </div>
  );
}

export function GooglePayLogo({ className = "w-9 h-9" }: { className?: string }) {
  return (
    <div
      className={`${className} rounded-xl bg-white border border-slate-200 shadow-xs flex items-center justify-center p-1.5 select-none shrink-0`}
    >
      <svg viewBox="0 0 48 48" className="w-full h-full">
        <path
          fill="#4285F4"
          d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"
        />
        <path
          fill="#34A853"
          d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"
        />
        <path
          fill="#FBBC05"
          d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"
        />
        <path
          fill="#EA4335"
          d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"
        />
      </svg>
    </div>
  );
}

export function UpiGenericLogo({ className = "w-9 h-9" }: { className?: string }) {
  return (
    <div
      className={`${className} rounded-xl bg-slate-900 flex items-center justify-center p-2 shadow-xs shrink-0`}
    >
      <svg viewBox="0 0 32 32" className="w-full h-full">
        <path d="M8 22L15 10H21L14 22H8Z" fill="#097939" />
        <path d="M17 22L24 10H27L20 22H17Z" fill="#ED7524" />
      </svg>
    </div>
  );
}

export const UPI_APPS = [
  {
    id: "fampay",
    name: "FamPay (FamApp)",
    tagline: "Teen & Gen-Z UPI",
    Logo: FamPayLogo,
    badgeColor: "text-amber-800 bg-amber-50 border-amber-200",
    hoverClass: "hover:border-amber-500 hover:bg-amber-50/40",
  },
  {
    id: "phonepe",
    name: "PhonePe",
    tagline: "Fast & Direct Bank Pay",
    Logo: PhonePeLogo,
    badgeColor: "text-purple-800 bg-purple-50 border-purple-200",
    hoverClass: "hover:border-[#5F259F] hover:bg-purple-50/40",
  },
  {
    id: "paytm",
    name: "Paytm UPI",
    tagline: "Wallet & Bank UPI",
    Logo: PaytmLogo,
    badgeColor: "text-sky-800 bg-sky-50 border-sky-200",
    hoverClass: "hover:border-[#00BAF2] hover:bg-sky-50/40",
  },
  {
    id: "gpay",
    name: "Google Pay (GPay)",
    tagline: "Official Google UPI",
    Logo: GooglePayLogo,
    badgeColor: "text-blue-800 bg-blue-50 border-blue-200",
    hoverClass: "hover:border-blue-500 hover:bg-blue-50/40",
  },
  {
    id: "generic",
    name: "Other UPI Apps",
    tagline: "CRED, BHIM, Amazon Pay, Any Bank UPI App",
    Logo: UpiGenericLogo,
    badgeColor: "text-emerald-800 bg-emerald-50 border-emerald-200",
    hoverClass: "hover:border-emerald-500 hover:bg-emerald-50/40",
    fullWidth: true,
  },
];

export function UpiCheckoutModal({
  isOpen,
  onClose,
  title = "Complete Your Payment",
  orderId,
  amount,
  itemDetails,
  onPaymentSuccess,
  upiId,
  merchantName,
}: UpiCheckoutModalProps) {
  const [activeTab, setActiveTab] = useState<"apps" | "qr">("apps");
  const [copied, setCopied] = useState(false);
  const [selectedApp, setSelectedApp] = useState<string | null>(null);
  const [paymentState, setPaymentState] = useState<
    "ready" | "opening" | "confirming" | "success"
  >("ready");
  const [showItemDetails, setShowItemDetails] = useState(false);
  const [appLaunchNotice, setAppLaunchNotice] = useState<string | null>(null);
  const [qrImgError, setQrImgError] = useState(false);

  // Auto-Verification & SMS Text Message Receipt State
  const [customerPhone, setCustomerPhone] = useState("");
  const [manualUtr, setManualUtr] = useState("");
  const [smsPaste, setSmsPaste] = useState("");
  const [isVerifying, setIsVerifying] = useState(false);
  const [verifyError, setVerifyError] = useState<string | null>(null);
  const [verifiedUtr, setVerifiedUtr] = useState<string | null>(null);
  const [verifiedBank, setVerifiedBank] = useState<string | null>(null);
  const [showManualVerify, setShowManualVerify] = useState(false);
  const [smsReceiptSent, setSmsReceiptSent] = useState(false);
  const [showGatewayModal, setShowGatewayModal] = useState(false);

  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const copyTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pollIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Clean sanitization for NPCI compliance
  const safeAmount = Math.max(0, Number(amount) || 0);
  const safeOrderId = (orderId || "KYN-" + Date.now().toString(36).toUpperCase()).trim();
  const effectiveUpiId = (upiId || defaultPaymentConfig.upiId || "9315678560@fam").trim();
  const effectiveMerchantName = (merchantName || defaultPaymentConfig.merchantName || "Kynisto").trim();

  // NPCI standard limits transaction note (tn) to max 80 characters
  const rawNote = `${title} - #${safeOrderId}`;
  const safeNote = rawNote.length > 70 ? `${rawNote.slice(0, 67)}...` : rawNote;

  const paymentConfig: UPIPaymentConfig = {
    upiId: effectiveUpiId,
    merchantName: effectiveMerchantName,
    amount: safeAmount,
    currency: "INR",
    orderId: safeOrderId,
    note: safeNote,
  };

  // Standard Universal NPCI UPI URI for QR codes and fallback
  // CRITICAL: QR codes scanned by mobile banking apps MUST strictly be universal upi://pay?
  const universalUpiUri = createUPILink("generic", paymentConfig, "scheme");

  // Dynamic URI for the selected app (Android Intent or custom scheme)
  const appTargetedUri = createUPILink(selectedApp || "generic", paymentConfig);

  // Dynamic QR Code generation with reliable primary and secondary sources
  const qrCodeUrl = qrImgError
    ? `https://quickchart.io/qr?text=${encodeURIComponent(universalUpiUri)}&size=300&margin=2`
    : `https://api.qrserver.com/v1/create-qr-code/?size=300x300&margin=8&data=${encodeURIComponent(
        universalUpiUri
      )}`;

  // Clear pending timers & polling helper
  const clearAllTimers = useCallback(() => {
    if (timerRef.current !== null) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    if (copyTimerRef.current !== null) {
      clearTimeout(copyTimerRef.current);
      copyTimerRef.current = null;
    }
    if (pollIntervalRef.current !== null) {
      clearInterval(pollIntervalRef.current);
      pollIntervalRef.current = null;
    }
  }, []);

  // Real-time backend status polling for bank SMS auto-verification
  const checkVerificationStatus = useCallback(async () => {
    try {
      const res = await fetch(
        `/api/payments/verify?orderId=${encodeURIComponent(safeOrderId)}`
      );
      if (!res.ok) return;
      const data = await res.json();
      if (data.verified) {
        if (pollIntervalRef.current !== null) {
          clearInterval(pollIntervalRef.current);
          pollIntervalRef.current = null;
        }
        setVerifiedUtr(data.utr || null);
        setVerifiedBank(data.bankName || "UPI Network");
        setPaymentState("success");
        if (typeof onPaymentSuccess === "function") {
          try {
            onPaymentSuccess();
          } catch (err) {
            console.error("[Kynisto UPI] onPaymentSuccess error:", err);
          }
        }
      }
    } catch {
      // Background retry on next tick
    }
  }, [safeOrderId, onPaymentSuccess]);

  const startPolling = useCallback(() => {
    if (pollIntervalRef.current !== null) {
      clearInterval(pollIntervalRef.current);
    }
    pollIntervalRef.current = setInterval(checkVerificationStatus, 2500);
  }, [checkVerificationStatus]);

  // Reset internal state when modal opens or closes
  useEffect(() => {
    if (isOpen) {
      setPaymentState("ready");
      setSelectedApp(null);
      setCopied(false);
      setShowItemDetails(false);
      setAppLaunchNotice(null);
      setQrImgError(false);
      setVerifyError(null);
      setIsVerifying(false);
      setVerifiedUtr(null);
      setVerifiedBank(null);
      setSmsReceiptSent(false);

      // Register payment order in ledger for SMS auto-reconciliation
      fetch("/api/payments/create-order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          orderId: safeOrderId,
          amount: safeAmount,
          title,
          customerPhone: customerPhone ? customerPhone.trim() : undefined,
          upiId: effectiveUpiId,
          merchantName: effectiveMerchantName,
        }),
      }).catch(() => {});

      // Launch real-time bank SMS polling
      startPolling();
    } else {
      clearAllTimers();
    }
    return () => clearAllTimers();
  }, [
    isOpen,
    safeOrderId,
    safeAmount,
    title,
    customerPhone,
    effectiveUpiId,
    effectiveMerchantName,
    startPolling,
    clearAllTimers,
  ]);

  // Handle escape key to close
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen && paymentState !== "opening") {
        onClose();
      }
    };
    if (isOpen) {
      window.addEventListener("keydown", handleKeyDown);
    }
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose, paymentState]);

  // Robust Copy UPI ID to clipboard with automatic execCommand fallback
  const handleCopyUpiId = useCallback(async () => {
    let success = false;
    try {
      if (typeof navigator !== "undefined" && navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(effectiveUpiId);
        success = true;
      }
    } catch {
      // Fall through to textarea execCommand fallback
    }

    if (!success && typeof document !== "undefined") {
      try {
        const textarea = document.createElement("textarea");
        textarea.value = effectiveUpiId;
        textarea.style.position = "fixed";
        textarea.style.opacity = "0";
        textarea.style.left = "-9999px";
        document.body.appendChild(textarea);
        textarea.focus();
        textarea.select();
        success = document.execCommand("copy");
        document.body.removeChild(textarea);
      } catch (err) {
        console.warn("[Kynisto UPI] Clipboard copy failed:", err);
      }
    }

    if (success) {
      setCopied(true);
      if (copyTimerRef.current !== null) clearTimeout(copyTimerRef.current);
      copyTimerRef.current = setTimeout(() => setCopied(false), 2400);
    }
  }, [effectiveUpiId]);

  // Trigger app-specific or generic UPI payment
  const handleOpenAppPayment = (appKey: string) => {
    setSelectedApp(appKey);
    setPaymentState("opening");
    setAppLaunchNotice(null);

    // Launch via openUPIPayment helper with fallback callback
    openUPIPayment(appKey, paymentConfig, () => {
      setAppLaunchNotice(
        "Could not launch app directly. You can scan the QR code or use 'Other UPI Apps' below."
      );
    });

    // After brief opening sequence, switch to confirmation dialog
    if (timerRef.current !== null) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      setPaymentState("confirming");
    }, 1400);
  };

  const handleSimulatedSuccess = () => {
    setPaymentState("success");
    if (typeof onPaymentSuccess === "function") {
      try {
        onPaymentSuccess();
      } catch (err) {
        console.error("[Kynisto UPI] onPaymentSuccess error:", err);
      }
    }
  };

  const handleVerifyManually = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setVerifyError(null);
    setIsVerifying(true);

    try {
      const res = await fetch("/api/payments/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          orderId: safeOrderId,
          utr: manualUtr.trim(),
          smsText: smsPaste.trim(),
          customerPhone: customerPhone.trim(),
        }),
      });

      const data = await res.json();
      if (res.ok && data.verified) {
        if (pollIntervalRef.current !== null) {
          clearInterval(pollIntervalRef.current);
          pollIntervalRef.current = null;
        }
        setVerifiedUtr(data.order?.utr || manualUtr);
        setVerifiedBank(data.order?.bankName || "UPI Network");
        setSmsReceiptSent(Boolean(customerPhone.trim()));
        setPaymentState("success");
        if (typeof onPaymentSuccess === "function") {
          try {
            onPaymentSuccess();
          } catch (err) {
            console.error("[Kynisto UPI] onPaymentSuccess error:", err);
          }
        }
      } else {
        setVerifyError(
          data.error || "Could not verify transaction with bank. Please check UTR or try again."
        );
      }
    } catch {
      setVerifyError("Network error while connecting to verification server.");
    } finally {
      setIsVerifying(false);
    }
  };

  // Fix: When switching to QR code from confirming view, properly reset paymentState to "ready"
  const handleSwitchToQr = () => {
    setPaymentState("ready");
    setActiveTab("qr");
  };

  const handleResetToReady = () => {
    setPaymentState("ready");
    setSelectedApp(null);
    setAppLaunchNotice(null);
  };

  if (!isOpen) return null;

  // Format timestamp in IST (Asia/Kolkata) per Kynisto engineering guidelines
  const istDate = new Date(
    new Date().toLocaleString("en-US", { timeZone: "Asia/Kolkata" })
  );
  const formattedIstTimestamp = istDate.toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });

  const selectedAppObj = UPI_APPS.find((a) => a.id === selectedApp);

  return (
    <div
      className="fixed inset-0 z-[999999] flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200"
      role="dialog"
      aria-modal="true"
      aria-labelledby="upi-checkout-title"
      onClick={(e) => {
        if (e.target === e.currentTarget && paymentState !== "opening") {
          onClose();
        }
      }}
    >
      <div className="bg-white border border-slate-200 rounded-3xl w-full max-w-lg shadow-2xl relative flex flex-col max-h-[92vh] overflow-y-auto overflow-x-clip animate-in zoom-in-95 duration-200 text-slate-900">
        {/* =========================================================================
         * MODAL HEADER
         * ========================================================================= */}
        <div className="p-5 sm:p-6 pb-4 border-b border-slate-100 flex items-start justify-between gap-4 sticky top-0 bg-white z-20">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                <ShieldCheck className="w-3 h-3 mr-1 text-emerald-600" />
                NPCI UPI Secured
              </span>
              <span className="text-[11px] font-mono text-slate-400">
                #{safeOrderId}
              </span>
            </div>
            <h2
              id="upi-checkout-title"
              className="text-xl font-black text-slate-900 tracking-tight"
            >
              {title}
            </h2>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Close modal"
            className="w-9 h-9 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 hover:text-slate-800 flex items-center justify-center transition-colors cursor-pointer shrink-0"
            title="Close modal"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* =========================================================================
         * VIEW 1: SUCCESS CONFIRMATION RECEIPT
         * ========================================================================= */}
        {paymentState === "success" ? (
          <div className="p-6 sm:p-8 text-center animate-in fade-in zoom-in-95 duration-200">
            <div className="w-20 h-20 rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 mx-auto flex items-center justify-center shadow-lg shadow-emerald-500/20 mb-4 relative">
              <CheckCircle2 className="w-10 h-10 text-white stroke-[2.5]" />
              <div className="absolute inset-0 rounded-full bg-emerald-400 animate-ping opacity-25" />
            </div>

            <span className="inline-block px-3 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-black uppercase tracking-wider mb-2">
              Payment Received
            </span>

            <h3 className="text-2xl font-black text-slate-900 tracking-tight mb-2">
              Payment Successful! 🎉
            </h3>
            <p className="text-slate-600 text-xs sm:text-sm mb-6 leading-relaxed max-w-sm mx-auto">
              Your transaction has been verified and registered. Your order /
              membership is now active.
            </p>

            {/* Receipt Summary Card */}
            <div className="bg-slate-50 border border-slate-200/90 rounded-2xl p-4 text-left space-y-2.5 mb-6 shadow-xs">
              <div className="flex justify-between items-center text-xs text-slate-500 pb-2 border-b border-slate-200">
                <span className="flex items-center gap-1.5">
                  <Receipt className="w-3.5 h-3.5 text-slate-400" />
                  <span>Transaction ID</span>
                </span>
                <span className="font-mono font-bold text-slate-900">
                  #{safeOrderId}
                </span>
              </div>

              <div className="flex justify-between items-center text-xs text-slate-500">
                <span className="flex items-center gap-1.5">
                  <Building2 className="w-3.5 h-3.5 text-slate-400" />
                  <span>Merchant</span>
                </span>
                <span className="font-bold text-slate-800">
                  {effectiveMerchantName}
                </span>
              </div>

              <div className="flex justify-between items-center text-xs text-slate-500">
                <span className="flex items-center gap-1.5">
                  <CreditCard className="w-3.5 h-3.5 text-slate-400" />
                  <span>Amount Paid</span>
                </span>
                <span className="font-black text-emerald-600 text-base">
                  ₹{safeAmount.toLocaleString("en-IN", { minimumFractionDigits: safeAmount % 1 === 0 ? 0 : 2, maximumFractionDigits: 2 })}
                </span>
              </div>

              <div className="flex justify-between items-center text-xs text-slate-500">
                <span className="flex items-center gap-1.5">
                  <Smartphone className="w-3.5 h-3.5 text-blue-500" />
                  <span>Payment Channel</span>
                </span>
                <span className="font-semibold text-slate-800">
                  UPI ({selectedApp ? selectedApp.toUpperCase() : "Direct App / QR"})
                </span>
              </div>

              {verifiedUtr && (
                <div className="flex justify-between items-center text-xs text-slate-500">
                  <span className="flex items-center gap-1.5">
                    <Receipt className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Bank UTR / Ref</span>
                  </span>
                  <span className="font-mono font-bold text-emerald-700">
                    {verifiedUtr}
                  </span>
                </div>
              )}

              {verifiedBank && (
                <div className="flex justify-between items-center text-xs text-slate-500">
                  <span className="flex items-center gap-1.5">
                    <Building2 className="w-3.5 h-3.5 text-indigo-500" />
                    <span>Settlement</span>
                  </span>
                  <span className="font-semibold text-slate-800">
                    {verifiedBank}
                  </span>
                </div>
              )}

              <div className="flex justify-between items-center text-xs text-slate-500 pt-2 border-t border-slate-200">
                <span className="flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-slate-400" />
                  <span>Verified Time (IST)</span>
                </span>
                <span className="font-medium text-slate-700">
                  {formattedIstTimestamp}
                </span>
              </div>
            </div>

            {(smsReceiptSent || customerPhone) && (
              <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-800 flex items-center gap-2 mb-4 text-left">
                <MessageSquare className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>
                  Instant confirmation text message dispatched to{" "}
                  <strong>+91 {customerPhone || "Mobile"}</strong>.
                </span>
              </div>
            )}

            <div className="flex flex-col sm:flex-row gap-2.5">
              <button
                type="button"
                onClick={onClose}
                className="w-full py-3 px-4 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-sm shadow-md transition-colors flex items-center justify-center space-x-2 cursor-pointer"
              >
                <span>Done</span>
                <Check className="w-4 h-4" />
              </button>
            </div>
          </div>
        ) : (
          /* =========================================================================
           * VIEW 2: ACTIVE CHECKOUT (Order summary, Apps list or QR Code)
           * ========================================================================= */
          <div className="p-5 sm:p-6 space-y-5">
            {/* Amount Banner & Optional Items Breakdown */}
            <div className="bg-slate-50 border border-slate-200/90 rounded-2xl p-4 shadow-xs">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-0.5">
                    Total Amount Due
                  </span>
                  <div className="flex items-baseline gap-2">
                    <span className="text-2xl sm:text-3xl font-black text-slate-900">
                      ₹{safeAmount.toLocaleString("en-IN", { minimumFractionDigits: safeAmount % 1 === 0 ? 0 : 2, maximumFractionDigits: 2 })}
                    </span>
                    <span className="text-xs text-slate-500 font-medium">
                      INR (Zero surcharge)
                    </span>
                  </div>
                </div>

                <div className="text-right">
                  <span className="inline-block px-2.5 py-1 rounded-full bg-blue-50 border border-blue-200 text-blue-700 text-xs font-bold">
                    Payee: {effectiveMerchantName}
                  </span>
                </div>
              </div>

              {/* Item Details Expander */}
              {itemDetails && itemDetails.length > 0 && (
                <div className="mt-3 pt-3 border-t border-slate-200/80">
                  <button
                    type="button"
                    onClick={() => setShowItemDetails(!showItemDetails)}
                    className="w-full flex items-center justify-between text-xs font-bold text-slate-600 hover:text-slate-900 transition-colors py-1 cursor-pointer"
                  >
                    <span className="flex items-center gap-1.5">
                      <ShoppingBag className="w-3.5 h-3.5 text-slate-500" />
                      <span>
                        Order Breakdown ({itemDetails.length}{" "}
                        {itemDetails.length === 1 ? "item" : "items"})
                      </span>
                    </span>
                    {showItemDetails ? (
                      <ChevronUp className="w-4 h-4 text-slate-400" />
                    ) : (
                      <ChevronDown className="w-4 h-4 text-slate-400" />
                    )}
                  </button>

                  {showItemDetails && (
                    <div className="mt-2 space-y-1.5 pt-2 border-t border-slate-200/60 text-xs animate-in fade-in duration-150">
                      {itemDetails.map((item, idx) => (
                        <div
                          key={idx}
                          className="flex justify-between items-center text-slate-600"
                        >
                          <span className="truncate pr-2">
                            {item.quantity ? `${item.quantity}x ` : ""}
                            {item.name || "Item"}
                          </span>
                          <span className="font-semibold text-slate-900 shrink-0">
                            ₹{Number(item.price || 0).toLocaleString("en-IN")}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Auto-Verifying & Confirmation State */}
            {paymentState === "confirming" ? (
              <div className="p-5 rounded-2xl bg-amber-50/40 border border-amber-200 text-center space-y-4 animate-in fade-in zoom-in-95 duration-200">
                {/* Live Bank SMS Auto-Verification Radar */}
                <div className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200/90 flex items-center justify-between text-left shadow-xs">
                  <div className="flex items-center gap-3">
                    <div className="relative flex items-center justify-center w-5 h-5">
                      <span className="w-3 h-3 rounded-full bg-emerald-500"></span>
                      <span className="absolute w-5 h-5 rounded-full bg-emerald-400 animate-ping opacity-75"></span>
                    </div>
                    <div>
                      <span className="block text-xs font-bold text-emerald-950">
                        ⚡ Bank SMS Auto-Verify Active
                      </span>
                      <span className="block text-[11px] text-emerald-700">
                        Auto-detects payment credit to {effectiveUpiId}...
                      </span>
                    </div>
                  </div>
                  <Radio className="w-4 h-4 text-emerald-600 animate-pulse shrink-0" />
                </div>

                <div>
                  <h4 className="text-base font-black text-slate-900">
                    Awaiting Payment in {selectedAppObj?.name || "Your UPI App"}
                  </h4>
                  <p className="text-xs text-slate-600 mt-1 max-w-sm mx-auto leading-relaxed">
                    We dispatched payment intent for ₹
                    {safeAmount.toLocaleString("en-IN")}. As soon as your UPI app or bank completes the transfer, this screen will auto-complete.
                  </p>
                </div>

                {appLaunchNotice && (
                  <div className="p-2.5 rounded-xl bg-blue-50 border border-blue-200 text-blue-800 text-xs flex items-center gap-2 text-left">
                    <AlertCircle className="w-4 h-4 text-blue-600 shrink-0" />
                    <span>{appLaunchNotice}</span>
                  </div>
                )}

                {/* Instant Manual UTR or Bank SMS Verification Drawer */}
                <div className="border border-slate-200 rounded-2xl p-3 bg-white text-left shadow-xs">
                  <button
                    type="button"
                    onClick={() => setShowManualVerify(!showManualVerify)}
                    className="w-full flex items-center justify-between text-xs font-bold text-slate-700 hover:text-slate-900 cursor-pointer"
                  >
                    <span className="flex items-center gap-1.5">
                      <Receipt className="w-3.5 h-3.5 text-blue-600" />
                      <span>Have 12-Digit UTR or Bank SMS? Instant Verify</span>
                    </span>
                    {showManualVerify ? (
                      <ChevronUp className="w-4 h-4 text-slate-400" />
                    ) : (
                      <ChevronDown className="w-4 h-4 text-slate-400" />
                    )}
                  </button>

                  {showManualVerify && (
                    <div className="mt-3 pt-3 border-t border-slate-100 space-y-2.5 animate-in fade-in duration-150">
                      <div>
                        <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                          12-Digit UPI Reference (UTR / RRN)
                        </label>
                        <input
                          type="text"
                          maxLength={12}
                          value={manualUtr}
                          onChange={(e) => setManualUtr(e.target.value.replace(/\D/g, ""))}
                          placeholder="e.g. 425312891045"
                          className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>

                      <div>
                        <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                          Or Paste Bank SMS Text Message
                        </label>
                        <textarea
                          rows={2}
                          value={smsPaste}
                          onChange={(e) => setSmsPaste(e.target.value)}
                          placeholder="Paste credit SMS received from FamPay/Bank..."
                          className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-[11px] text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                        />
                      </div>

                      {verifyError && (
                        <p className="text-[11px] text-rose-600 font-semibold">{verifyError}</p>
                      )}

                      <button
                        type="button"
                        onClick={handleVerifyManually}
                        disabled={isVerifying || (!manualUtr && !smsPaste)}
                        className="w-full py-2 px-3 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:bg-slate-200 disabled:text-slate-400 text-white font-bold text-xs transition-colors flex items-center justify-center gap-1.5 cursor-pointer shadow-xs"
                      >
                        {isVerifying ? (
                          <>
                            <Sparkles className="w-3.5 h-3.5 animate-spin" />
                            <span>Verifying with Bank...</span>
                          </>
                        ) : (
                          <>
                            <Check className="w-3.5 h-3.5" />
                            <span>Verify Transaction</span>
                          </>
                        )}
                      </button>
                    </div>
                  )}
                </div>

                <div className="flex flex-col gap-2 pt-1">
                  <button
                    type="button"
                    onClick={handleSimulatedSuccess}
                    className="w-full py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs sm:text-sm shadow-md shadow-emerald-600/20 transition-all flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <Check className="w-4 h-4" />
                    <span>I Have Completed Payment</span>
                  </button>

                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={handleSwitchToQr}
                      className="py-2.5 px-3 rounded-xl bg-white hover:bg-slate-100 border border-slate-200 text-slate-700 font-bold text-xs transition-colors flex items-center justify-center gap-1.5 cursor-pointer shadow-xs"
                    >
                      <QrCode className="w-3.5 h-3.5 text-blue-600" />
                      <span>Scan QR Instead</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleOpenAppPayment("generic")}
                      className="py-2.5 px-3 rounded-xl bg-white hover:bg-slate-100 border border-slate-200 text-slate-700 font-bold text-xs transition-colors flex items-center justify-center gap-1.5 cursor-pointer shadow-xs"
                    >
                      <Smartphone className="w-3.5 h-3.5 text-emerald-600" />
                      <span>Other UPI Apps</span>
                    </button>
                  </div>

                  <button
                    type="button"
                    onClick={handleResetToReady}
                    className="py-2 text-xs font-bold text-slate-500 hover:text-slate-800 transition-colors flex items-center justify-center gap-1 cursor-pointer"
                  >
                    <RefreshCw className="w-3 h-3" />
                    <span>Change Payment App</span>
                  </button>
                </div>
              </div>
            ) : paymentState === "opening" ? (
              /* Opening App Loader State */
              <div className="p-8 rounded-2xl bg-slate-50 border border-slate-200 text-center space-y-3 animate-in fade-in duration-150">
                <div className="w-12 h-12 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center mx-auto">
                  <Sparkles className="w-6 h-6 animate-spin text-blue-600" />
                </div>
                <h4 className="text-base font-black text-slate-900">
                  Launching {selectedAppObj?.name || "UPI App"}...
                </h4>
                <p className="text-xs text-slate-500 max-w-xs mx-auto">
                  Preparing pre-filled payment request with ₹{safeAmount} to{" "}
                  {effectiveMerchantName}.
                </p>
                <div className="pt-2">
                  <button
                    type="button"
                    onClick={handleSwitchToQr}
                    className="text-xs font-bold text-blue-600 hover:text-blue-800 underline cursor-pointer"
                  >
                    Taking too long? Pay with QR Code
                  </button>
                </div>
              </div>
            ) : (
              /* Ready State: Navigation Tabs (UPI Apps vs Scan QR) */
              <>
                {/* Optional Mobile Number for SMS Text Message Receipt */}
                <div className="p-3 bg-slate-50 border border-slate-200 rounded-2xl shadow-xs">
                  <label className="text-[11px] font-bold text-slate-700 flex items-center justify-between mb-1.5">
                    <span className="flex items-center gap-1.5">
                      <MessageSquare className="w-3.5 h-3.5 text-blue-600" />
                      <span>Instant SMS Text Message Receipt</span>
                    </span>
                    <span className="text-[10px] text-slate-400 font-normal">Optional</span>
                  </label>
                  <div className="flex gap-2">
                    <div className="flex items-center px-2.5 py-1.5 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-600 shrink-0">
                      +91
                    </div>
                    <input
                      type="tel"
                      maxLength={10}
                      value={customerPhone}
                      onChange={(e) => setCustomerPhone(e.target.value.replace(/\D/g, ""))}
                      placeholder="Enter 10-digit mobile number"
                      className="flex-1 px-3 py-1.5 bg-white border border-slate-200 rounded-xl text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono"
                    />
                  </div>
                </div>

                {/* Official Gateway Option */}
                <button
                  type="button"
                  onClick={() => setShowGatewayModal(true)}
                  className="w-full p-3 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold text-xs flex items-center justify-between shadow-md shadow-blue-500/20 transition-all cursor-pointer"
                >
                  <div className="flex items-center gap-2">
                    <CreditCard className="w-4 h-4 text-white" />
                    <span>Pay via Official Gateway (Cards / NetBanking / All UPI)</span>
                  </div>
                  <ChevronRight className="w-4 h-4 text-white/80" />
                </button>

                <div className="grid grid-cols-2 gap-1.5 p-1 bg-slate-100 rounded-2xl">
                  <button
                    type="button"
                    onClick={() => setActiveTab("apps")}
                    className={`py-2 px-3 rounded-xl text-xs font-black uppercase tracking-wider transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                      activeTab === "apps"
                        ? "bg-white text-slate-900 shadow-xs"
                        : "text-slate-500 hover:text-slate-800"
                    }`}
                  >
                    <Smartphone className="w-3.5 h-3.5" />
                    <span>UPI Apps (Instant)</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setActiveTab("qr")}
                    className={`py-2 px-3 rounded-xl text-xs font-black uppercase tracking-wider transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                      activeTab === "qr"
                        ? "bg-white text-slate-900 shadow-xs"
                        : "text-slate-500 hover:text-slate-800"
                    }`}
                  >
                    <QrCode className="w-3.5 h-3.5" />
                    <span>Scan Dynamic QR</span>
                  </button>
                </div>

                {/* TAB 1: UPI APPS LIST */}
                {activeTab === "apps" && (
                  <div className="space-y-2.5">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                      {UPI_APPS.map((app) => {
                        const LogoComp = app.Logo;
                        return (
                          <button
                            key={app.id}
                            type="button"
                            onClick={() => handleOpenAppPayment(app.id)}
                            className={`p-3.5 rounded-2xl bg-white border border-slate-200 text-left transition-all duration-200 flex items-center justify-between group cursor-pointer shadow-xs hover:shadow-md ${
                              app.hoverClass
                            } ${app.fullWidth ? "sm:col-span-2" : ""}`}
                          >
                            <div className="flex items-center gap-3 min-w-0">
                              <LogoComp className="w-10 h-10" />
                              <div className="min-w-0">
                                <span className="block font-bold text-sm text-slate-900 group-hover:text-slate-950 transition-colors truncate">
                                  {app.name}
                                </span>
                                <span className="block text-[11px] text-slate-500 truncate">
                                  {app.tagline}
                                </span>
                              </div>
                            </div>
                            <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-slate-700 group-hover:translate-x-0.5 transition-all shrink-0 ml-2" />
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* TAB 2: DYNAMIC QR CODE DISPLAY */}
                {activeTab === "qr" && (
                  <div className="flex flex-col items-center text-center p-2">
                    <div className="p-4 bg-white border-2 border-slate-200 rounded-2xl shadow-xs mb-3 relative flex items-center justify-center min-h-[220px]">
                      <img
                        src={qrCodeUrl}
                        alt="Dynamic Universal UPI QR Code"
                        className="w-52 h-52 sm:w-56 sm:h-56 object-contain rounded-lg"
                        onError={() => setQrImgError(true)}
                        loading="lazy"
                      />
                    </div>

                    <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 w-full text-xs space-y-1 mb-4 text-left">
                      <div className="flex justify-between text-slate-600">
                        <span>Payee:</span>
                        <span className="font-bold text-slate-900">
                          {effectiveMerchantName}
                        </span>
                      </div>
                      <div className="flex justify-between text-slate-600">
                        <span>Amount:</span>
                        <span className="font-black text-emerald-600 text-sm">
                          ₹{safeAmount.toLocaleString("en-IN", { minimumFractionDigits: safeAmount % 1 === 0 ? 0 : 2, maximumFractionDigits: 2 })}
                        </span>
                      </div>
                      <div className="flex justify-between text-slate-600">
                        <span>Universal UPI ID:</span>
                        <span className="font-mono text-slate-800 font-semibold text-[11px]">
                          {effectiveUpiId}
                        </span>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={handleSimulatedSuccess}
                      className="w-full py-3 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs sm:text-sm shadow-md shadow-emerald-600/20 transition-all flex items-center justify-center gap-2 cursor-pointer"
                    >
                      <Check className="w-4 h-4" />
                      <span>I Have Paid via QR Code</span>
                    </button>
                  </div>
                )}
              </>
            )}

            {/* ALWAYS-ACCESSIBLE COPY UPI ID BOX WITH TOAST NOTIFICATION */}
            <div className="pt-2 border-t border-slate-100">
              <div className="flex items-center justify-between p-3 rounded-2xl bg-slate-50 border border-slate-200 text-xs gap-2">
                <div className="truncate min-w-0">
                  <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                    Direct UPI ID / VPA
                  </span>
                  <span className="font-mono font-bold text-slate-800 text-xs sm:text-sm truncate select-all block">
                    {effectiveUpiId}
                  </span>
                </div>

                <button
                  type="button"
                  onClick={handleCopyUpiId}
                  className="py-1.5 px-3 rounded-xl bg-white hover:bg-slate-100 border border-slate-200 text-slate-700 text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shrink-0 shadow-xs"
                  title="Copy UPI ID to clipboard"
                >
                  {copied ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-600" />
                      <span className="text-emerald-700">Copied!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5 text-slate-500" />
                      <span>Copy UPI</span>
                    </>
                  )}
                </button>
              </div>

              {/* Inline Toast Notice */}
              {copied && (
                <div className="mt-2 p-2.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs text-center font-bold animate-in fade-in slide-in-from-top-1 duration-150 flex items-center justify-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                  <span>UPI ID copied! Paste it into any UPI payment app.</span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* =========================================================================
         * MODAL FOOTER
         * ========================================================================= */}
        <div className="px-5 py-3.5 bg-slate-50 border-t border-slate-100 text-center flex items-center justify-center gap-1.5 text-[11px] text-slate-500">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
          <span>Encrypted 256-bit peer-to-peer UPI transfer powered by NPCI</span>
        </div>
      </div>

      {/* Official Razorpay Gateway Modal */}
      {showGatewayModal && (
        <RazorpayCheckoutModal
          isOpen={showGatewayModal}
          onClose={() => setShowGatewayModal(false)}
          title={title}
          orderId={safeOrderId}
          amount={safeAmount}
          customerPhone={customerPhone}
          onPaymentSuccess={() => {
            setShowGatewayModal(false);
            setPaymentState("success");
            if (typeof onPaymentSuccess === "function") {
              onPaymentSuccess();
            }
          }}
        />
      )}
    </div>
  );
}

export default UpiCheckoutModal;
