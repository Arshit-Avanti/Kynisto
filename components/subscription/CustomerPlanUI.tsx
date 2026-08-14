"use client";

import React, { useState } from "react";
import {
  Crown,
  CheckCircle2,
  Zap,
  ShieldCheck,
  Heart,
  Bell,
  Sparkles,
  Gift,
  Headphones,
  Copy,
  Check,
  Lock,
  ArrowRight,
  Star,
  Info,
  Clock,
  X,
} from "lucide-react";
import { UPI_PAYMENT_ID, PAYMENT_QR_IMAGE } from "@/lib/subscriptions-shared";

interface CustomerPlanUIProps {
  currentPlanId?: string;
  userEmail?: string;
  userName?: string;
}

export function CustomerPlanUI({
  currentPlanId = "free",
  userEmail = "",
  userName = "",
}: CustomerPlanUIProps) {
  const [billingCycle, setBillingCycle] = useState<"monthly" | "yearly">("monthly");
  const [showCheckoutModal, setShowCheckoutModal] = useState(false);
  const [utrInput, setUtrInput] = useState("");
  const [subscriberName, setSubscriberName] = useState(userName);
  const [subscriberEmail, setSubscriberEmail] = useState(userEmail);
  const [copiedUpi, setCopiedUpi] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [pendingResponse, setPendingResponse] = useState<any>(null);

  const isAlreadyPremium = currentPlanId === "premium";
  const monthlyPrice = 49;
  const yearlyPrice = 499; // Save ₹89
  const currentPrice = billingCycle === "yearly" ? yearlyPrice : monthlyPrice;

  const handleCopyUpi = () => {
    navigator.clipboard.writeText(UPI_PAYMENT_ID);
    setCopiedUpi(true);
    setTimeout(() => setCopiedUpi(false), 2000);
  };

  const handleOpenCheckout = () => {
    setErrorMessage("");
    setPendingResponse(null);
    setUtrInput("");
    setShowCheckoutModal(true);
  };

  const handleSubmitPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage("");

    if (!subscriberName.trim() || !subscriberEmail.trim()) {
      setErrorMessage("Name of user and Email Address are required. Please fill out all required fields.");
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch("/api/subscriptions/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          planId: "premium",
          billingCycle,
          utr: utrInput.trim(),
          subscriberName: subscriberName.trim(),
          subscriberRole: "customer",
          subscriberEmail: subscriberEmail.trim(),
          paymentTime: new Date().toLocaleString(),
          amountPaid: currentPrice,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to submit subscription request.");
      }

      setPendingResponse(data);
    } catch (err: any) {
      setErrorMessage(err.message || "An unexpected error occurred. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="w-full max-w-6xl mx-auto px-4 py-8 text-white font-sans">
      {/* Active Plan Banner if already Premium */}
      {isAlreadyPremium && (
        <div className="mb-8 p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-between gap-4 backdrop-blur-md">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-emerald-500/20 text-emerald-400">
              <Crown className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-semibold text-emerald-300 text-lg">Active Subscription: Kynisto Premium</h3>
              <p className="text-xs text-emerald-200/70">You are currently enjoying full VIP access, ad-free queueing, and double rewards!</p>
            </div>
          </div>
          <span className="px-3 py-1 text-xs font-semibold rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
            ACTIVE MEMBER
          </span>
        </div>
      )}

      {/* Hero Header */}
      <div className="text-center max-w-3xl mx-auto mb-12">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-400 text-xs font-semibold tracking-wide uppercase mb-4 shadow-lg shadow-amber-500/5">
          <Crown className="w-3.5 h-3.5" />
          <span>Exclusive Customer Pass</span>
        </div>
        <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-amber-200 via-orange-300 to-amber-500 mb-4">
          Kynisto Premium Membership
        </h1>
        <p className="text-slate-300 text-base md:text-lg leading-relaxed">
          Skip lines, remove ads, unlock member-only cashbacks, and get gold VIP status across all stores in your city.
        </p>

        {/* Billing Cycle Toggle */}
        <div className="inline-flex items-center p-1.5 rounded-2xl bg-slate-900/80 border border-slate-800 mt-8 backdrop-blur-md shadow-inner">
          <button
            type="button"
            onClick={() => setBillingCycle("monthly")}
            className={`px-5 py-2 rounded-xl text-sm font-medium transition-all duration-200 ${
              billingCycle === "monthly"
                ? "bg-gradient-to-r from-amber-500 to-orange-500 text-slate-950 font-bold shadow-md shadow-amber-500/20"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            Monthly (₹49/mo)
          </button>
          <button
            type="button"
            onClick={() => setBillingCycle("yearly")}
            className={`relative px-5 py-2 rounded-xl text-sm font-medium transition-all duration-200 ${
              billingCycle === "yearly"
                ? "bg-gradient-to-r from-amber-500 to-orange-500 text-slate-950 font-bold shadow-md shadow-amber-500/20"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            Yearly (₹499/yr)
            <span className="ml-2 px-2 py-0.5 text-[10px] font-bold rounded-full bg-emerald-400 text-slate-950 uppercase tracking-wider">
              Save ₹89
            </span>
          </button>
        </div>
      </div>

      {/* Main Pricing Showcase Card */}
      <div className="relative max-w-4xl mx-auto rounded-3xl p-8 md:p-12 bg-gradient-to-b from-slate-900/90 via-slate-900/70 to-slate-950/90 border border-amber-500/30 backdrop-blur-xl shadow-2xl shadow-amber-500/10 overflow-hidden">
        {/* Ambient Glow */}
        <div className="absolute -top-32 -right-32 w-80 h-80 bg-amber-500/15 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-32 -left-32 w-80 h-80 bg-orange-500/15 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          {/* Left Column: Price & CTA */}
          <div className="lg:col-span-5 flex flex-col justify-between h-full border-b lg:border-b-0 lg:border-r border-slate-800 pb-8 lg:pb-0 lg:pr-8">
            <div>
              <div className="flex items-center gap-2 mb-3">
                <span className="px-3 py-1 rounded-full text-xs font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40 tracking-wider uppercase">
                  ⭐ VIP UNLIMITED ACCESS
                </span>
              </div>
              <h2 className="text-3xl font-bold text-white mb-2">Kynisto Premium</h2>
              <p className="text-slate-400 text-sm mb-6">
                All-in-one local pass for seamless shopping, dining, medical visits, and service bookings.
              </p>
            </div>

            <div>
              <div className="flex items-baseline gap-2 mb-2">
                <span className="text-5xl font-black text-white tracking-tight">₹{currentPrice}</span>
                <span className="text-slate-400 text-sm font-medium">
                  / {billingCycle === "yearly" ? "year" : "month"}
                </span>
              </div>
              {billingCycle === "yearly" ? (
                <p className="text-xs text-emerald-400 font-medium mb-6">
                  Equivalent to just ₹41.5/month (Billed ₹499 annually)
                </p>
              ) : (
                <p className="text-xs text-slate-400 mb-6">Cancel anytime with 1-click. No hidden fees.</p>
              )}

              <button
                type="button"
                onClick={handleOpenCheckout}
                disabled={isAlreadyPremium}
                className={`w-full py-4 px-6 rounded-2xl font-bold text-base transition-all duration-300 flex items-center justify-center gap-2 ${
                  isAlreadyPremium
                    ? "bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700"
                    : "bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 text-slate-950 hover:brightness-110 active:scale-[0.99] shadow-xl shadow-amber-500/25 cursor-pointer"
                }`}
              >
                <Crown className="w-5 h-5" />
                <span>{isAlreadyPremium ? "Current Active Plan" : `Upgrade for ₹${currentPrice}`}</span>
                {!isAlreadyPremium && <ArrowRight className="w-5 h-5 ml-1" />}
              </button>
              <p className="text-[11px] text-center text-slate-400 mt-3 flex items-center justify-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                Instant UPI Payment · 24/7 Activation Support
              </p>
            </div>
          </div>

          {/* Right Column: Key Benefits Matrix */}
          <div className="lg:col-span-7">
            <h3 className="text-xs font-bold text-amber-400 tracking-wider uppercase mb-6 flex items-center gap-2">
              <Sparkles className="w-4 h-4" />
              Included Premium Perks
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="p-3.5 rounded-2xl bg-slate-800/40 border border-slate-800 hover:border-amber-500/30 transition-all">
                <div className="flex items-start gap-3">
                  <div className="p-2 rounded-xl bg-amber-500/10 text-amber-400 shrink-0">
                    <Zap className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-sm font-semibold text-white">Priority VIP Queue</h4>
                    <p className="text-xs text-slate-400 mt-0.5">Jump standard lines with express check-in</p>
                  </div>
                </div>
              </div>

              <div className="p-3.5 rounded-2xl bg-slate-800/40 border border-slate-800 hover:border-amber-500/30 transition-all">
                <div className="flex items-start gap-3">
                  <div className="p-2 rounded-xl bg-orange-500/10 text-orange-400 shrink-0">
                    <ShieldCheck className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-sm font-semibold text-white">100% Ad-Free</h4>
                    <p className="text-xs text-slate-400 mt-0.5">Zero banner ads or audio interruptions</p>
                  </div>
                </div>
              </div>

              <div className="p-3.5 rounded-2xl bg-slate-800/40 border border-slate-800 hover:border-amber-500/30 transition-all">
                <div className="flex items-start gap-3">
                  <div className="p-2 rounded-xl bg-rose-500/10 text-rose-400 shrink-0">
                    <Heart className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-sm font-semibold text-white">Unlimited Favorites</h4>
                    <p className="text-xs text-slate-400 mt-0.5">Save unlimited stores & quick rebookings</p>
                  </div>
                </div>
              </div>

              <div className="p-3.5 rounded-2xl bg-slate-800/40 border border-slate-800 hover:border-amber-500/30 transition-all">
                <div className="flex items-start gap-3">
                  <div className="p-2 rounded-xl bg-yellow-500/10 text-yellow-400 shrink-0">
                    <Crown className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-sm font-semibold text-white">Gold VIP Profile Badge</h4>
                    <p className="text-xs text-slate-400 mt-0.5">Gold status badge on reviews & profile</p>
                  </div>
                </div>
              </div>

              <div className="p-3.5 rounded-2xl bg-slate-800/40 border border-slate-800 hover:border-amber-500/30 transition-all">
                <div className="flex items-start gap-3">
                  <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400 shrink-0">
                    <Gift className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-sm font-semibold text-white">Exclusive Deals</h4>
                    <p className="text-xs text-slate-400 mt-0.5">Member-only vouchers & cashback offers</p>
                  </div>
                </div>
              </div>

              <div className="p-3.5 rounded-2xl bg-slate-800/40 border border-slate-800 hover:border-amber-500/30 transition-all">
                <div className="flex items-start gap-3">
                  <div className="p-2 rounded-xl bg-cyan-500/10 text-cyan-400 shrink-0">
                    <Bell className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-sm font-semibold text-white">Instant Alerts</h4>
                    <p className="text-xs text-slate-400 mt-0.5">WhatsApp & SMS live queue position updates</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Free vs Premium Plan Comparison */}
      <div className="mt-16 max-w-4xl mx-auto">
        <h2 className="text-2xl font-bold text-center text-white mb-8">Compare Free vs Premium</h2>
        <div className="rounded-2xl border border-slate-800 bg-slate-900/60 overflow-hidden backdrop-blur-md">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-800 bg-slate-900/80">
                <th className="py-4 px-6 text-sm font-bold text-slate-300">Feature</th>
                <th className="py-4 px-6 text-sm font-bold text-slate-400 text-center w-36">Free Plan</th>
                <th className="py-4 px-6 text-sm font-bold text-amber-400 text-center w-48 bg-amber-500/10 border-l border-r border-amber-500/20">
                  Premium (₹49/mo)
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-sm">
              <tr>
                <td className="py-3.5 px-6 font-medium text-slate-200">Queue Bookings</td>
                <td className="py-3.5 px-6 text-center text-slate-400">Unlimited Standard</td>
                <td className="py-3.5 px-6 text-center text-amber-300 font-semibold bg-amber-500/5 border-l border-r border-amber-500/20">
                  Priority VIP Fast-Track
                </td>
              </tr>
              <tr>
                <td className="py-3.5 px-6 font-medium text-slate-200">Ad Experience</td>
                <td className="py-3.5 px-6 text-center text-rose-400">Supported by Ads</td>
                <td className="py-3.5 px-6 text-center text-emerald-400 font-semibold bg-amber-500/5 border-l border-r border-amber-500/20">
                  100% Ad-Free
                </td>
              </tr>
              <tr>
                <td className="py-3.5 px-6 font-medium text-slate-200">Saved Favorite Stores</td>
                <td className="py-3.5 px-6 text-center text-slate-400">Max 10 Stores</td>
                <td className="py-3.5 px-6 text-center text-amber-300 font-semibold bg-amber-500/5 border-l border-r border-amber-500/20">
                  Unlimited Stores
                </td>
              </tr>
              <tr>
                <td className="py-3.5 px-6 font-medium text-slate-200">Public Profile Badge</td>
                <td className="py-3.5 px-6 text-center text-slate-500">Standard Member</td>
                <td className="py-3.5 px-6 text-center text-amber-300 font-semibold bg-amber-500/5 border-l border-r border-amber-500/20 flex items-center justify-center gap-1">
                  <Crown className="w-3.5 h-3.5 text-amber-400" />
                  Gold VIP Badge
                </td>
              </tr>
              <tr>
                <td className="py-3.5 px-6 font-medium text-slate-200">Exclusive Deals & Offers</td>
                <td className="py-3.5 px-6 text-center text-slate-500">Public Offers Only</td>
                <td className="py-3.5 px-6 text-center text-amber-300 font-semibold bg-amber-500/5 border-l border-r border-amber-500/20">
                  VIP Exclusive Coupons
                </td>
              </tr>
              <tr>
                <td className="py-3.5 px-6 font-medium text-slate-200">Customer Support</td>
                <td className="py-3.5 px-6 text-center text-slate-400">Standard Support</td>
                <td className="py-3.5 px-6 text-center text-amber-300 font-semibold bg-amber-500/5 border-l border-r border-amber-500/20">
                  24/7 Priority Support
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* Checkout Modal */}
      {showCheckoutModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fade-in">
          <div className="relative w-full max-w-lg rounded-3xl bg-slate-900 border border-slate-800 p-6 md:p-8 shadow-2xl text-white max-h-[90vh] overflow-y-auto">
            <button
              type="button"
              onClick={() => setShowCheckoutModal(false)}
              className="absolute top-5 right-5 p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            {!pendingResponse ? (
              <div>
                <div className="flex items-center gap-3 mb-6">
                  <div className="p-3 rounded-2xl bg-amber-500/10 text-amber-400 border border-amber-500/30">
                    <Crown className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-white">Subscribe to Kynisto Premium</h3>
                    <p className="text-xs text-slate-400">
                      Amount: <span className="font-semibold text-amber-400">₹{currentPrice}</span> ({billingCycle})
                    </p>
                  </div>
                </div>

                {errorMessage && (
                  <div className="mb-6 p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs font-medium">
                    {errorMessage}
                  </div>
                )}

                <form onSubmit={handleSubmitPayment} className="space-y-5">
                  {/* Step 1: Scan UPI QR */}
                  <div className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800 text-center">
                    <p className="text-xs font-semibold text-slate-300 uppercase tracking-wider mb-3">
                      Step 1: Scan QR or Pay to UPI ID
                    </p>
                    <div className="inline-block p-3 rounded-2xl bg-white mb-3 shadow-inner">
                      {/* Standard UPI payment QR preview */}
                      <img
                        src={PAYMENT_QR_IMAGE}
                        alt="UPI Payment QR Code"
                        className="w-44 h-44 object-contain rounded-lg"
                        onError={(e) => {
                          // Fallback placeholder display if image fails
                          (e.target as HTMLElement).style.display = "none";
                        }}
                      />
                    </div>
                    <div className="flex items-center justify-center gap-2">
                      <code className="px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-700 text-amber-300 font-mono text-sm">
                        {UPI_PAYMENT_ID}
                      </code>
                      <button
                        type="button"
                        onClick={handleCopyUpi}
                        className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors flex items-center gap-1 text-xs"
                      >
                        {copiedUpi ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                        <span>{copiedUpi ? "Copied" : "Copy"}</span>
                      </button>
                    </div>
                    <p className="text-[11px] text-slate-400 mt-2">
                      Accepted: Google Pay, PhonePe, Paytm, BHIM, CRED
                    </p>
                  </div>

                  {/* Step 2: Form Inputs */}
                  <div className="space-y-4">
                    <div>
                      <label className="block text-xs font-medium text-slate-300 mb-1">
                        Full Name <span className="text-rose-400">*</span>
                      </label>
                      <input
                        type="text"
                        required
                        value={subscriberName}
                        onChange={(e) => setSubscriberName(e.target.value)}
                        placeholder="e.g. Rahul Sharma"
                        className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 focus:border-amber-500 focus:outline-none text-sm text-white placeholder-slate-500"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-slate-300 mb-1">
                        Email Address <span className="text-rose-400">*</span>
                      </label>
                      <input
                        type="email"
                        required
                        value={subscriberEmail}
                        onChange={(e) => setSubscriberEmail(e.target.value)}
                        placeholder="e.g. rahul@example.com"
                        className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 focus:border-amber-500 focus:outline-none text-sm text-white placeholder-slate-500"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-slate-300 mb-1">
                        12-Digit UTR / UPI Transaction Reference <span className="text-slate-400 font-normal">(Optional)</span>
                      </label>
                      <input
                        type="text"
                        value={utrInput}
                        onChange={(e) => setUtrInput(e.target.value)}
                        placeholder="e.g. 423891048201 (Optional)"
                        className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 focus:border-amber-500 focus:outline-none text-sm font-mono text-white placeholder-slate-500"
                      />
                      <p className="text-[11px] text-slate-500 mt-1">
                        Optional: You can provide your 12-digit UTR reference number from GPay/PhonePe/Paytm.
                      </p>
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full py-3.5 px-6 rounded-xl font-bold bg-gradient-to-r from-amber-500 to-orange-500 text-slate-950 hover:brightness-110 active:scale-[0.99] transition-all flex items-center justify-center gap-2 shadow-lg shadow-amber-500/20 disabled:opacity-50"
                  >
                    {isSubmitting ? (
                      <span>Submitting Request...</span>
                    ) : (
                      <>
                        <ShieldCheck className="w-5 h-5" />
                        <span>Submit Payment &amp; Activate</span>
                      </>
                    )}
                  </button>
                </form>
              </div>
            ) : (
              /* Success / Pending Admin Approval View */
              <div className="text-center py-4 space-y-5">
                <div className="w-16 h-16 rounded-full bg-amber-500/20 text-amber-400 border border-amber-500/40 flex items-center justify-center mx-auto shadow-lg shadow-amber-500/20 animate-bounce">
                  <Clock className="w-8 h-8" />
                </div>

                <div className="space-y-2">
                  <h3 className="text-2xl font-black text-amber-300 uppercase tracking-wide">
                    DON'T PANIC, ADMIN WILL GIVE YOUR SUBSCRIPTION WITHIN 24 HOURS
                  </h3>
                  <p className="text-slate-300 text-sm leading-relaxed max-w-sm mx-auto">
                    Your UPI payment receipt (UTR: <code className="text-amber-400 font-mono">{utrInput}</code>) has been logged. Our verification team will activate your Premium status shortly.
                  </p>
                </div>

                <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 text-left text-xs space-y-2 font-mono">
                  <div className="flex justify-between text-slate-400">
                    <span>Subscriber:</span>
                    <span className="text-slate-200 font-sans">{pendingResponse.submittedData?.subscriberName}</span>
                  </div>
                  <div className="flex justify-between text-slate-400">
                    <span>Plan:</span>
                    <span className="text-amber-400 font-bold">Kynisto Premium</span>
                  </div>
                  <div className="flex justify-between text-slate-400">
                    <span>Amount Paid:</span>
                    <span className="text-slate-200">₹{pendingResponse.submittedData?.amountPaid}</span>
                  </div>
                  <div className="flex justify-between text-slate-400">
                    <span>Status:</span>
                    <span className="text-amber-400 font-semibold">PENDING ADMIN VERIFICATION</span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setShowCheckoutModal(false)}
                  className="w-full py-3 px-6 rounded-xl font-bold bg-slate-800 hover:bg-slate-700 text-white transition-colors"
                >
                  Done &amp; Back to Pricing
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
