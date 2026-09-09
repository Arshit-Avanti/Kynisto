"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import {
  PlanConfig,
  getPlanConfig,
  UPI_PAYMENT_ID,
  CUSTOMER_PLANS,
  SHOP_OWNER_PLANS,
} from "@/lib/subscriptions-shared";
import { MagneticButton } from "@/components/ui/MagneticButton";
import { UpiCheckoutModal } from "@/components/checkout/UpiCheckoutModal";
import {
  ShieldCheck,
  Zap,
  Sparkles,
  Clock,
  QrCode,
  Smartphone,
  ChevronRight,
  Copy,
  Check,
  User,
  Mail,
  X,
  Receipt,
  Building2,
  CreditCard,
  CheckCircle2,
  RefreshCw,
  Crown,
} from "lucide-react";
import {
  openUPIPayment,
  createUPILink,
  UPIPaymentConfig,
} from "@/lib/upi-payment";
import {
  FamPayLogo,
  PhonePeLogo,
  PaytmLogo,
  GooglePayLogo,
  UpiGenericLogo,
} from "@/components/checkout/UpiCheckoutModal";

interface SubscriptionData {
  id: string;
  planId: string;
  userRole: "customer" | "store_owner";
  billingCycle: "monthly" | "yearly";
  amount: number;
  status: string;
  autoRenew: boolean;
  startsAt: number;
  expiresAt: number;
  cancelledAt?: number;
  receiptNumber?: string;
  isExpired: boolean;
}

interface Transaction {
  id: string;
  planId: string;
  billingCycle: string;
  amount: number;
  paymentMethod: string;
  upiId: string;
  utr?: string;
  status: string;
  receiptNumber: string;
  createdAt: number;
}

export function UserSubscriptionDashboard() {
  const [subData, setSubData] = useState<{
    subscription: SubscriptionData;
    plan: PlanConfig;
    transactions: Transaction[];
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [togglingAutoRenew, setTogglingAutoRenew] = useState(false);
  const [cancelling, setCancelling] = useState(false);
  const [selectedReceipt, setSelectedReceipt] = useState<Transaction | null>(null);

  // Upgrade & UPI Modal state
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [targetPlanId, setTargetPlanId] = useState<string>("premium");
  const [targetCycle, setTargetCycle] = useState<"monthly" | "yearly">("monthly");
  const [subscriberName, setSubscriberName] = useState("");
  const [subscriberEmail, setSubscriberEmail] = useState("");
  const [utrInput, setUtrInput] = useState("");
  const [copiedUpi, setCopiedUpi] = useState(false);
  const [activePaymentTab, setActivePaymentTab] = useState<"apps" | "qr">("apps");
  const [appLaunchFeedback, setAppLaunchFeedback] = useState("");
  const [selectedApp, setSelectedApp] = useState<string | null>(null);
  const [isSubmittingUpi, setIsSubmittingUpi] = useState(false);
  const [upiSubmitSuccessMsg, setUpiSubmitSuccessMsg] = useState("");
  const [upiError, setUpiError] = useState("");
  const [modalTimeLeft, setModalTimeLeft] = useState(600);
  const [modalIstTime, setModalIstTime] = useState("");

  // Live countdown state
  const [countdown, setCountdown] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0 });

  const fetchSubscription = useCallback(async () => {
    try {
      const res = await fetch("/api/subscriptions/me");
      if (!res.ok) throw new Error("Failed to load subscription status.");
      const data = await res.json();
      setSubData(data);

      // Pre-set default target plan based on role
      const role = data?.subscription?.userRole || "customer";
      if (role === "customer") {
        setTargetPlanId("premium");
      } else {
        setTargetPlanId("starter");
      }
    } catch (err: any) {
      setError(err.message || "Error loading subscription.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSubscription();
    // Prefill user details from auth session
    fetch("/api/auth/me")
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data?.user) {
          if (data.user.name) setSubscriberName(data.user.name);
          if (data.user.email) setSubscriberEmail(data.user.email);
        }
      })
      .catch(() => {});
  }, [fetchSubscription]);

  // Live countdown timer calculation
  useEffect(() => {
    if (!subData?.subscription?.expiresAt) return;

    const interval = setInterval(() => {
      const now = Math.floor(Date.now() / 1000);
      const diff = subData.subscription.expiresAt - now;

      if (diff <= 0) {
        setCountdown({ days: 0, hours: 0, minutes: 0, seconds: 0 });
        clearInterval(interval);
        return;
      }

      const days = Math.floor(diff / 86400);
      const hours = Math.floor((diff % 86400) / 3600);
      const minutes = Math.floor((diff % 3600) / 60);
      const seconds = Math.floor(diff % 60);

      setCountdown({ days, hours, minutes, seconds });
    }, 1000);

    return () => clearInterval(interval);
  }, [subData]);

  // Modal countdown timer
  useEffect(() => {
    if (!showUpgradeModal) return;
    const timer = setInterval(() => {
      setModalTimeLeft((t) => (t > 0 ? t - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, [showUpgradeModal]);

  const handleToggleAutoRenew = async () => {
    setTogglingAutoRenew(true);
    try {
      const res = await fetch("/api/subscriptions/toggle-auto-renew", { method: "POST" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      fetchSubscription();
    } catch (err: any) {
      alert(err.message || "Could not toggle auto-renew.");
    } finally {
      setTogglingAutoRenew(false);
    }
  };

  const handleCancelSub = async () => {
    if (
      !confirm(
        "Are you sure you want to cancel your auto-renewing subscription? You will retain access until the current period expires."
      )
    )
      return;
    setCancelling(true);
    try {
      const res = await fetch("/api/subscriptions/cancel", { method: "POST" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      fetchSubscription();
    } catch (err: any) {
      alert(err.message || "Could not cancel subscription.");
    } finally {
      setCancelling(false);
    }
  };

  function handleOpenUpgradeModal() {
    setUtrInput("");
    setUpiError("");
    setUpiSubmitSuccessMsg("");
    setCopiedUpi(false);
    setSelectedApp(null);
    setAppLaunchFeedback("");
    setActivePaymentTab("apps");
    setModalTimeLeft(600);

    const istDate = new Date(new Date().toLocaleString("en-US", { timeZone: "Asia/Kolkata" }));
    setModalIstTime(
      istDate.toLocaleString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
        hour12: true,
      })
    );

    setShowUpgradeModal(true);
  }

  function handleCopyUpiId(upiText: string = UPI_PAYMENT_ID) {
    if (typeof navigator !== "undefined" && navigator.clipboard?.writeText) {
      navigator.clipboard.writeText(upiText);
    }
    setCopiedUpi(true);
    setTimeout(() => setCopiedUpi(false), 2500);
  }

  function getSelectedUpgradePlanPrice(): number {
    const p = getPlanConfig(targetPlanId);
    if (!p) return 49;
    return targetCycle === "yearly" ? p.priceYearly : p.priceMonthly;
  }

  function handleOpenAppPayment(appKey: string) {
    setSelectedApp(appKey);
    handleCopyUpiId(UPI_PAYMENT_ID);

    const planObj = getPlanConfig(targetPlanId);
    const amount = getSelectedUpgradePlanPrice();
    const displayName =
      appKey === "fampay"
        ? "FamPay"
        : appKey === "phonepe"
        ? "PhonePe"
        : appKey === "paytm"
        ? "Paytm"
        : appKey === "gpay"
        ? "Google Pay"
        : "UPI App";

    setAppLaunchFeedback(`Opening ${displayName}... (UPI ID copied to clipboard)`);

    const config: UPIPaymentConfig = {
      upiId: UPI_PAYMENT_ID,
      merchantName: "Kynisto",
      amount,
      currency: "INR",
      orderId: `SUB-${Date.now().toString(36).toUpperCase()}`,
      note: `Kynisto ${planObj.name} Subscription`,
    };

    openUPIPayment(appKey, config, () => {
      setAppLaunchFeedback(`App did not open directly. Switched to standard UPI.`);
    });
  }

  async function handleConfirmSubmitUpiPayment() {
    if (!subscriberName.trim() || !subscriberEmail.trim()) {
      setUpiError("User Name and Email Address are required fields.");
      return;
    }

    setIsSubmittingUpi(true);
    setUpiError("");

    try {
      const planObj = getPlanConfig(targetPlanId);
      const amount = getSelectedUpgradePlanPrice();
      const role = subData?.subscription?.userRole || "customer";

      const res = await fetch("/api/subscriptions/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          planId: targetPlanId,
          billingCycle: targetCycle,
          utr: utrInput.trim(),
          subscriberName: subscriberName.trim(),
          subscriberRole: role,
          subscriberEmail: subscriberEmail.trim(),
          paymentTime: new Date().toLocaleString("en-IN", { timeZone: "Asia/Kolkata" }),
          amountPaid: amount,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to submit subscription verification.");
      }

      setUpiSubmitSuccessMsg(
        data.message || "DON'T PANIC, ADMIN WILL GIVE YOUR SUBSCRIPTION WITHIN 24 HOURS"
      );
      // Refresh subscription after small delay
      setTimeout(() => {
        fetchSubscription();
      }, 1500);
    } catch (e: any) {
      setUpiError(e.message || "Failed to submit payment verification.");
    } finally {
      setIsSubmittingUpi(false);
    }
  }

  if (loading) {
    return (
      <div className="py-16 text-center text-slate-500 font-medium">
        Loading your subscription status...
      </div>
    );
  }

  if (error || !subData) {
    return (
      <div className="py-16 text-center text-rose-600 font-bold">
        ⚠️ {error || "Unable to load subscription information."}
      </div>
    );
  }

  const { subscription: sub, plan, transactions } = subData;
  const isOwner = sub.userRole === "store_owner";
  const planOptions = isOwner
    ? [SHOP_OWNER_PLANS.starter, SHOP_OWNER_PLANS.pro]
    : [CUSTOMER_PLANS.premium];

  const modalMins = Math.floor(modalTimeLeft / 60);
  const modalSecs = modalTimeLeft % 60;
  const formattedModalTime = `${String(modalMins).padStart(2, "0")}:${String(modalSecs).padStart(2, "0")}`;

  return (
    <div className="max-w-5xl mx-auto py-6 text-slate-900 overflow-x-clip">
      {/* =========================================================================
       * 1. ACTIVE PLAN CARD (MODERN LIGHT MODE)
       * ========================================================================= */}
      <div className="bg-white border-2 border-emerald-500/90 rounded-3xl p-6 sm:p-8 shadow-xl mb-8 relative overflow-x-clip">
        <div className="flex justify-between items-start flex-wrap gap-4">
          <div>
            <span className="text-[11px] font-black text-emerald-600 tracking-wider uppercase bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200">
              Current Active Plan
            </span>
            <h2 className="text-2xl sm:text-3xl font-black text-slate-900 mt-2 mb-1">
              Kynisto {plan.name}
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 max-w-md">
              {plan.description}
            </p>
          </div>

          <div className="text-right">
            <div className="text-2xl sm:text-3xl font-black text-slate-900">
              ₹{sub.billingCycle === "yearly" ? plan.priceYearly : plan.priceMonthly}
              <span className="text-xs sm:text-sm text-slate-500 font-semibold">
                /{sub.billingCycle === "yearly" ? "year" : "month"}
              </span>
            </div>

            <span
              className={`inline-block mt-1.5 px-3 py-1 rounded-full text-xs font-black uppercase ${
                (sub as any).isUnrestrictedByAdmin || (plan as any).isUnrestrictedByAdmin
                  ? "bg-amber-50 text-amber-800 border border-amber-200"
                  : sub.status === "active"
                  ? "bg-emerald-50 text-emerald-800 border border-emerald-200"
                  : "bg-rose-50 text-rose-800 border border-rose-200"
              }`}
            >
              {(sub as any).isUnrestrictedByAdmin || (plan as any).isUnrestrictedByAdmin
                ? "● ALL FEATURES UNLOCKED (FREE)"
                : `● ${sub.status.toUpperCase()}`}
            </span>
          </div>
        </div>

        {/* Live Expiration Countdown */}
        {sub.expiresAt && sub.planId !== "free" && sub.planId !== "starter" && (
          <div className="mt-6 p-4 sm:p-5 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-between flex-wrap gap-4">
            <div>
              <strong className="text-xs sm:text-sm font-bold text-slate-900 block">
                Subscription Expiry Countdown
              </strong>
              <span className="text-xs text-slate-500">
                Valid until {new Date(sub.expiresAt * 1000).toLocaleDateString("en-IN")}
              </span>
            </div>

            <div className="flex gap-2.5 text-center">
              {[
                { label: "DAYS", val: countdown.days },
                { label: "HOURS", val: countdown.hours },
                { label: "MINS", val: countdown.minutes },
                { label: "SECS", val: countdown.seconds },
              ].map((item, i) => (
                <div
                  key={i}
                  className="bg-white border border-slate-200 px-3 py-2 rounded-xl min-w-[55px] shadow-2xs"
                >
                  <div className="text-lg sm:text-xl font-black text-emerald-600">
                    {item.val}
                  </div>
                  <div className="text-[9px] font-bold text-slate-400">
                    {item.label}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Auto Renew & Action Buttons */}
        <div className="mt-6 pt-5 border-t border-slate-100 flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-3">
            <span className="text-xs sm:text-sm font-bold text-slate-700">
              Auto-Renew Subscription
            </span>
            <button
              type="button"
              onClick={handleToggleAutoRenew}
              disabled={togglingAutoRenew}
              className={`w-12 h-6 rounded-full p-0.5 transition-colors cursor-pointer border ${
                sub.autoRenew
                  ? "bg-emerald-600 border-emerald-600"
                  : "bg-slate-300 border-slate-300"
              }`}
            >
              <div
                className={`w-5 h-5 rounded-full bg-white shadow-xs transition-transform ${
                  sub.autoRenew ? "translate-x-6" : "translate-x-0"
                }`}
              />
            </button>
          </div>

          <div className="flex items-center gap-3 flex-wrap">
            {/* DIRECT UPI UPGRADE / RENEW BUTTON */}
            <button
              type="button"
              onClick={handleOpenUpgradeModal}
              className="bg-emerald-600 hover:bg-emerald-700 text-white font-black px-4 py-2.5 rounded-xl text-xs sm:text-sm shadow-md shadow-emerald-600/20 transition-all flex items-center gap-2 cursor-pointer"
            >
              <Smartphone className="w-4 h-4" />
              <span>Renew / Upgrade with UPI</span>
            </button>

            <Link href={`/pricing?role=${plan.role}`}>
              <MagneticButton
                style={{
                  padding: "9px 18px",
                  borderRadius: "12px",
                  background: "#0F172A",
                  color: "#FFFFFF",
                  fontWeight: 800,
                  fontSize: "13px",
                  border: "none",
                  cursor: "pointer",
                }}
              >
                Change Plan →
              </MagneticButton>
            </Link>

            {sub.status === "active" && sub.planId !== "free" && sub.planId !== "starter" && (
              <button
                type="button"
                onClick={handleCancelSub}
                disabled={cancelling}
                className="px-3.5 py-2 rounded-xl bg-transparent border border-rose-300 text-rose-600 font-bold text-xs hover:bg-rose-50 transition-colors cursor-pointer"
              >
                Cancel Subscription
              </button>
            )}
          </div>
        </div>
      </div>

      {/* =========================================================================
       * 2. ACTIVE FEATURES INCLUDED
       * ========================================================================= */}
      <div className="mb-8">
        <h3 className="text-lg sm:text-xl font-black text-slate-900 mb-4 tracking-tight">
          Active Features Included
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
          {plan.features.map((feat, i) => (
            <div
              key={i}
              className="bg-white border border-slate-200 rounded-xl p-3.5 flex items-center gap-2.5 shadow-xs"
            >
              <span className="w-5 h-5 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center font-black text-xs shrink-0">
                ✓
              </span>
              <span className="text-xs sm:text-sm font-semibold text-slate-700 truncate">
                {feat}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* =========================================================================
       * 3. PAYMENT & SUBSCRIPTION HISTORY TABLE
       * ========================================================================= */}
      <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-md mb-8">
        <h3 className="text-lg sm:text-xl font-black text-slate-900 mb-4 tracking-tight">
          Payment & Subscription History
        </h3>

        {transactions.length === 0 ? (
          <div className="text-slate-400 text-xs sm:text-sm py-6 text-center font-medium">
            No payment transactions recorded yet.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs sm:text-sm">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold text-[11px] uppercase tracking-wider">
                  <th className="py-3 px-4">Date</th>
                  <th className="py-3 px-4">Plan</th>
                  <th className="py-3 px-4">Amount</th>
                  <th className="py-3 px-4">Method</th>
                  <th className="py-3 px-4">Receipt #</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Receipt</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {transactions.map((txn) => (
                  <tr key={txn.id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="py-3 px-4 text-slate-600">
                      {new Date(txn.createdAt * 1000).toLocaleDateString("en-IN")}
                    </td>
                    <td className="py-3 px-4 font-bold text-slate-900">
                      {getPlanConfig(txn.planId).name}
                    </td>
                    <td className="py-3 px-4 font-extrabold text-slate-900">
                      ₹{txn.amount}
                    </td>
                    <td className="py-3 px-4 uppercase text-[11px] font-semibold text-slate-600">
                      {txn.paymentMethod}
                    </td>
                    <td className="py-3 px-4 font-mono text-xs text-slate-500">
                      {txn.receiptNumber}
                    </td>
                    <td className="py-3 px-4">
                      <span
                        className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase ${
                          txn.status === "completed"
                            ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                            : "bg-rose-50 text-rose-700 border border-rose-200"
                        }`}
                      >
                        {txn.status}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <button
                        type="button"
                        onClick={() => setSelectedReceipt(txn)}
                        className="px-2.5 py-1 rounded-lg bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 text-emerald-800 text-xs font-bold cursor-pointer transition-colors"
                      >
                        📄 Receipt
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* =========================================================================
       * 4. LIGHT-MODE UPI UPGRADE & PAYMENT MODAL
       * ========================================================================= */}
      {showUpgradeModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/60 backdrop-blur-sm animate-in fade-in duration-200 overflow-y-auto"
          role="dialog"
          aria-modal="true"
        >
          <div className="bg-white border border-slate-200 rounded-3xl w-full max-w-lg shadow-2xl relative flex flex-col max-h-[92vh] overflow-y-auto overflow-x-clip text-slate-900 animate-in zoom-in-95 duration-200">
            {/* MODAL HEADER */}
            <div className="p-4 sm:p-5 border-b border-slate-100 flex items-start justify-between gap-3 sticky top-0 bg-white/95 backdrop-blur-md z-10">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                    <ShieldCheck className="w-3 h-3 mr-1 text-emerald-600" />
                    Kynisto Official Subscription
                  </span>
                </div>
                <h3 className="text-lg font-black text-slate-900 tracking-tight">
                  UPI Subscription Payment
                </h3>
              </div>

              <button
                type="button"
                onClick={() => setShowUpgradeModal(false)}
                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 hover:text-slate-800 flex items-center justify-center transition-colors cursor-pointer shrink-0"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* MODAL BODY */}
            <div className="p-4 sm:p-6 space-y-4 flex-1">
              {/* SESSION TIMER */}
              <div className="flex items-center justify-between bg-slate-50 border border-slate-200 px-3.5 py-2 rounded-xl text-xs">
                <div className="flex items-center gap-1.5 text-slate-500 text-[11px]">
                  <Clock className="w-3.5 h-3.5 text-blue-600" />
                  <span>
                    Time: <strong className="text-slate-800">{modalIstTime}</strong>
                  </span>
                </div>
                <div
                  className={`font-mono text-xs font-black px-2 py-0.5 rounded-md ${
                    modalTimeLeft < 120
                      ? "bg-rose-50 text-rose-700 border border-rose-200"
                      : "bg-amber-50 text-amber-800 border border-amber-200"
                  }`}
                >
                  Session: {formattedModalTime}
                </div>
              </div>

              {/* REASSURANCE BANNER */}
              <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3">
                <div className="text-xs font-bold text-emerald-800 flex items-center gap-2 leading-tight">
                  <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>
                    DON'T PANIC, ADMIN WILL GIVE YOUR SUBSCRIPTION WITHIN 24 HOURS
                  </span>
                </div>
              </div>

              {/* PLAN SELECTION & BILLING CYCLE */}
              <div className="space-y-3">
                <div>
                  <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block mb-1.5">
                    Select Upgrade Plan
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {planOptions.map((p) => (
                      <button
                        key={p.id}
                        type="button"
                        onClick={() => setTargetPlanId(p.id)}
                        className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                          targetPlanId === p.id
                            ? "bg-emerald-50/70 border-emerald-500 text-slate-900 shadow-xs"
                            : "bg-white border-slate-200 text-slate-600 hover:border-slate-300"
                        }`}
                      >
                        <div className="flex justify-between items-center mb-1">
                          <span className="font-black text-xs uppercase">{p.name}</span>
                          <span className="text-[10px] font-bold text-emerald-700">
                            ₹{targetCycle === "yearly" ? p.priceYearly : p.priceMonthly}
                          </span>
                        </div>
                        <span className="text-[10px] text-slate-500 line-clamp-1 block">
                          {p.description}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* BILLING CYCLE SELECTOR */}
                <div>
                  <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block mb-1.5">
                    Billing Cycle
                  </label>
                  <div className="grid grid-cols-2 gap-1.5 p-1 bg-slate-100 rounded-xl">
                    <button
                      type="button"
                      onClick={() => setTargetCycle("monthly")}
                      className={`py-1.5 px-3 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                        targetCycle === "monthly"
                          ? "bg-white text-slate-900 shadow-xs"
                          : "text-slate-500"
                      }`}
                    >
                      Monthly
                    </button>
                    <button
                      type="button"
                      onClick={() => setTargetCycle("yearly")}
                      className={`py-1.5 px-3 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1 ${
                        targetCycle === "yearly"
                          ? "bg-white text-slate-900 shadow-xs"
                          : "text-slate-500"
                      }`}
                    >
                      <span>Yearly</span>
                      <span className="text-[9px] bg-emerald-100 text-emerald-800 px-1.5 py-0.2 rounded font-black">
                        Save ~15%
                      </span>
                    </button>
                  </div>
                </div>
              </div>

              {/* AMOUNT DUE BANNER */}
              <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 flex items-center justify-between">
                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                    Total Amount Due
                  </span>
                  <div className="text-2xl sm:text-3xl font-black text-slate-900">
                    ₹{getSelectedUpgradePlanPrice()}
                  </div>
                </div>
                <div className="text-right">
                  <span className="inline-block px-2.5 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-bold">
                    Kynisto {getPlanConfig(targetPlanId).name}
                  </span>
                  <span className="block text-[10px] text-slate-400 mt-0.5 uppercase">
                    {targetCycle} plan
                  </span>
                </div>
              </div>

              {/* TABS: INSTANT UPI APPS VS SCAN QR */}
              <div className="grid grid-cols-2 gap-1.5 p-1 bg-slate-100 rounded-2xl">
                <button
                  type="button"
                  onClick={() => setActivePaymentTab("apps")}
                  className={`py-2 px-3 rounded-xl text-xs font-black uppercase tracking-wider transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                    activePaymentTab === "apps"
                      ? "bg-white text-slate-900 shadow-xs"
                      : "text-slate-500 hover:text-slate-800"
                  }`}
                >
                  <Smartphone className="w-3.5 h-3.5 text-blue-600" />
                  <span>UPI Apps</span>
                </button>

                <button
                  type="button"
                  onClick={() => setActivePaymentTab("qr")}
                  className={`py-2 px-3 rounded-xl text-xs font-black uppercase tracking-wider transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                    activePaymentTab === "qr"
                      ? "bg-white text-slate-900 shadow-xs"
                      : "text-slate-500 hover:text-slate-800"
                  }`}
                >
                  <QrCode className="w-3.5 h-3.5 text-orange-600" />
                  <span>Scan QR</span>
                </button>
              </div>

              {/* TAB 1: 5 UPI APP BUTTONS */}
              {activePaymentTab === "apps" && (
                <div className="space-y-2">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {/* FamPay */}
                    <button
                      type="button"
                      onClick={() => handleOpenAppPayment("fampay")}
                      className="p-3 rounded-2xl bg-white border border-slate-200 hover:border-amber-500 hover:bg-amber-50/40 text-left transition-all flex items-center justify-between group cursor-pointer shadow-xs"
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <FamPayLogo className="w-9 h-9" />
                        <div className="min-w-0">
                          <span className="block font-bold text-xs sm:text-sm text-slate-900 truncate">
                            FamPay (FamApp)
                          </span>
                          <span className="block text-[10px] text-slate-500 truncate">
                            Teen & Gen-Z UPI
                          </span>
                        </div>
                      </div>
                      <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-slate-700 shrink-0" />
                    </button>

                    {/* PhonePe */}
                    <button
                      type="button"
                      onClick={() => handleOpenAppPayment("phonepe")}
                      className="p-3 rounded-2xl bg-white border border-slate-200 hover:border-[#5F259F] hover:bg-purple-50/40 text-left transition-all flex items-center justify-between group cursor-pointer shadow-xs"
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <PhonePeLogo className="w-9 h-9" />
                        <div className="min-w-0">
                          <span className="block font-bold text-xs sm:text-sm text-slate-900 truncate">
                            PhonePe
                          </span>
                          <span className="block text-[10px] text-slate-500 truncate">
                            Direct Bank Pay
                          </span>
                        </div>
                      </div>
                      <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-slate-700 shrink-0" />
                    </button>

                    {/* Paytm */}
                    <button
                      type="button"
                      onClick={() => handleOpenAppPayment("paytm")}
                      className="p-3 rounded-2xl bg-white border border-slate-200 hover:border-[#00BAF2] hover:bg-sky-50/40 text-left transition-all flex items-center justify-between group cursor-pointer shadow-xs"
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <PaytmLogo className="w-9 h-9" />
                        <div className="min-w-0">
                          <span className="block font-bold text-xs sm:text-sm text-slate-900 truncate">
                            Paytm UPI
                          </span>
                          <span className="block text-[10px] text-slate-500 truncate">
                            Wallet & Bank Pay
                          </span>
                        </div>
                      </div>
                      <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-slate-700 shrink-0" />
                    </button>

                    {/* Google Pay */}
                    <button
                      type="button"
                      onClick={() => handleOpenAppPayment("gpay")}
                      className="p-3 rounded-2xl bg-white border border-slate-200 hover:border-blue-500 hover:bg-blue-50/40 text-left transition-all flex items-center justify-between group cursor-pointer shadow-xs"
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <GooglePayLogo className="w-9 h-9" />
                        <div className="min-w-0">
                          <span className="block font-bold text-xs sm:text-sm text-slate-900 truncate">
                            Google Pay (GPay)
                          </span>
                          <span className="block text-[10px] text-slate-500 truncate">
                            Official Google UPI
                          </span>
                        </div>
                      </div>
                      <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-slate-700 shrink-0" />
                    </button>

                    {/* Other UPI Apps */}
                    <button
                      type="button"
                      onClick={() => handleOpenAppPayment("generic")}
                      className="sm:col-span-2 p-3 rounded-2xl bg-white border border-slate-200 hover:border-emerald-500 hover:bg-emerald-50/40 text-left transition-all flex items-center justify-between group cursor-pointer shadow-xs"
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <UpiGenericLogo className="w-9 h-9" />
                        <div className="min-w-0">
                          <span className="block font-bold text-xs sm:text-sm text-slate-900 truncate">
                            Other UPI Apps
                          </span>
                          <span className="block text-[10px] text-slate-500 truncate">
                            BHIM, CRED, Amazon Pay, Any Bank App
                          </span>
                        </div>
                      </div>
                      <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-slate-700 shrink-0" />
                    </button>
                  </div>

                  {appLaunchFeedback && (
                    <div className="p-2.5 bg-blue-50 border border-blue-200 text-blue-800 text-xs rounded-xl text-center font-bold flex items-center justify-center gap-1.5 animate-in fade-in">
                      <Sparkles className="w-3.5 h-3.5 text-blue-600 animate-spin" />
                      <span>{appLaunchFeedback}</span>
                    </div>
                  )}
                </div>
              )}

              {/* TAB 2: DYNAMIC QR CODE DISPLAY */}
              {activePaymentTab === "qr" && (
                <div className="flex flex-col items-center text-center p-2">
                  <div className="p-3 bg-white border-2 border-slate-200 rounded-2xl shadow-sm mb-2 relative flex items-center justify-center">
                    <img
                      src={`https://api.qrserver.com/v1/create-qr-code/?size=220x220&margin=8&data=${encodeURIComponent(
                        createUPILink("generic", {
                          upiId: UPI_PAYMENT_ID,
                          merchantName: "Kynisto",
                          amount: getSelectedUpgradePlanPrice(),
                          currency: "INR",
                          orderId: `SUB-${Date.now().toString(36).toUpperCase()}`,
                          note: `Kynisto ${getPlanConfig(targetPlanId).name} Subscription`,
                        })
                      )}`}
                      alt="Kynisto Official Subscription QR Code"
                      className="w-44 h-44 object-contain rounded-lg"
                    />
                  </div>
                  <p className="text-[11px] text-slate-500 font-medium">
                    Scan with FamPay, PhonePe, Paytm, Google Pay, or any UPI app
                  </p>
                </div>
              )}

              {/* DIRECT UPI ID DISPLAY & COPY BUTTON */}
              <div className="flex items-center justify-between p-3 rounded-2xl bg-slate-50 border border-slate-200 text-xs gap-2">
                <div className="truncate min-w-0">
                  <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                    Kynisto Official UPI ID
                  </span>
                  <span className="font-mono font-bold text-slate-800 text-xs sm:text-sm truncate select-all block">
                    {UPI_PAYMENT_ID}
                  </span>
                </div>

                <button
                  type="button"
                  onClick={() => handleCopyUpiId(UPI_PAYMENT_ID)}
                  className="py-1.5 px-3 rounded-xl bg-white hover:bg-slate-100 border border-slate-200 text-slate-700 text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shrink-0 shadow-xs"
                  title="Copy UPI ID"
                >
                  {copiedUpi ? (
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

              {/* CUSTOMER DETAILS FORM */}
              <div className="space-y-3 pt-2 border-t border-slate-100">
                <div>
                  <label className="text-[11px] font-bold text-slate-600 uppercase tracking-wider flex items-center gap-1.5 mb-1">
                    <User className="w-3.5 h-3.5 text-slate-400" />
                    <span>Enter UPI Payer Name</span>
                  </label>
                  <input
                    type="text"
                    value={subscriberName}
                    onChange={(e) => setSubscriberName(e.target.value)}
                    placeholder="Full Name on UPI App"
                    className="w-full bg-slate-50 border border-slate-300 text-slate-900 px-3 py-2 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
                    required
                  />
                </div>

                <div>
                  <label className="text-[11px] font-bold text-slate-600 uppercase tracking-wider flex items-center gap-1.5 mb-1">
                    <Mail className="w-3.5 h-3.5 text-slate-400" />
                    <span>Enter Gmail / Email ID</span>
                  </label>
                  <input
                    type="email"
                    value={subscriberEmail}
                    onChange={(e) => setSubscriberEmail(e.target.value)}
                    placeholder="yourname@gmail.com"
                    className="w-full bg-slate-50 border border-slate-300 text-slate-900 px-3 py-2 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
                    required
                  />
                </div>

                <div>
                  <label className="text-[11px] font-bold text-slate-600 uppercase tracking-wider block mb-1">
                    <span>Payment UTR / Transaction Ref No.</span>{" "}
                    <span className="text-slate-400 font-normal lowercase">(optional)</span>
                  </label>
                  <input
                    type="text"
                    value={utrInput}
                    onChange={(e) => setUtrInput(e.target.value)}
                    placeholder="12-digit UTR from payment confirmation"
                    className="w-full bg-slate-50 border border-slate-300 text-slate-900 px-3 py-2 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
                  />
                </div>

                {upiError && (
                  <div className="p-2.5 bg-rose-50 border border-rose-200 text-rose-800 text-xs rounded-xl font-bold">
                    {upiError}
                  </div>
                )}

                {upiSubmitSuccessMsg && (
                  <div className="p-2.5 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs rounded-xl font-bold flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>{upiSubmitSuccessMsg}</span>
                  </div>
                )}
              </div>
            </div>

            {/* MODAL FOOTER */}
            <div className="p-4 bg-slate-50 border-t border-slate-100 flex flex-col gap-2">
              <button
                type="button"
                disabled={isSubmittingUpi || upiSubmitSuccessMsg !== ""}
                onClick={handleConfirmSubmitUpiPayment}
                className="w-full py-3 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-300 text-white font-black text-xs sm:text-sm shadow-md shadow-emerald-600/20 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:cursor-not-allowed"
              >
                {isSubmittingUpi ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Submitting Subscription Request...</span>
                  </>
                ) : upiSubmitSuccessMsg !== "" ? (
                  <>
                    <Check className="w-4 h-4" />
                    <span>Payment Request Submitted!</span>
                  </>
                ) : (
                  <>
                    <Check className="w-4 h-4" />
                    <span>Submit Payment & Request Activation</span>
                  </>
                )}
              </button>

              <div className="flex items-center justify-center gap-1.5 text-[10px] text-slate-400 text-center">
                <ShieldCheck className="w-3 h-3 text-emerald-600 shrink-0" />
                <span>Encrypted 256-bit peer-to-peer UPI transfer powered by NPCI</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
       * 5. PRINTABLE RECEIPT MODAL (LIGHT MODE)
       * ========================================================================= */}
      {selectedReceipt && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-in fade-in"
          role="presentation"
          onMouseDown={(e) => e.currentTarget === e.target && setSelectedReceipt(null)}
        >
          <div className="max-w-md w-full bg-white text-slate-900 rounded-3xl p-6 sm:p-8 shadow-2xl animate-in zoom-in-95">
            <div className="text-center border-b-2 border-dashed border-slate-200 pb-5 mb-5">
              <h2 className="text-2xl font-black text-slate-900 tracking-tight">KYNISTO</h2>
              <div className="text-xs text-slate-500 mt-1">Official Subscription Receipt</div>
              <div className="text-xs font-black text-emerald-600 mt-2 font-mono bg-emerald-50 px-3 py-1 rounded-full inline-block">
                Receipt #{selectedReceipt.receiptNumber}
              </div>
            </div>

            <div className="space-y-2.5 text-xs sm:text-sm mb-6">
              <div className="flex justify-between text-slate-600">
                <span>Date:</span>
                <strong className="text-slate-900">
                  {new Date(selectedReceipt.createdAt * 1000).toLocaleString("en-IN")}
                </strong>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>Plan:</span>
                <strong className="text-slate-900">
                  Kynisto {getPlanConfig(selectedReceipt.planId).name}
                </strong>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>Billing Cycle:</span>
                <strong className="text-slate-900 uppercase">
                  {selectedReceipt.billingCycle}
                </strong>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>Payment Method:</span>
                <strong className="text-slate-900 uppercase">
                  UPI ({selectedReceipt.upiId})
                </strong>
              </div>
              {selectedReceipt.utr && (
                <div className="flex justify-between text-slate-600">
                  <span>UTR #:</span>
                  <strong className="font-mono text-slate-900">{selectedReceipt.utr}</strong>
                </div>
              )}
              <div className="flex justify-between border-t border-slate-200 pt-3 text-base text-slate-900 font-black">
                <span>Total Paid:</span>
                <span className="text-emerald-600">₹{selectedReceipt.amount}</span>
              </div>
            </div>

            <div className="flex gap-2.5">
              <button
                type="button"
                onClick={() => window.print()}
                className="flex-1 py-3 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs sm:text-sm cursor-pointer shadow-md transition-colors"
              >
                🖨 Print / Download PDF
              </button>
              <button
                type="button"
                onClick={() => setSelectedReceipt(null)}
                className="py-3 px-5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs sm:text-sm cursor-pointer transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default UserSubscriptionDashboard;
