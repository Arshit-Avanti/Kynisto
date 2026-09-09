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
  ArrowRight,
  Clock,
  Check,
} from "lucide-react";
import { UPI_PAYMENT_ID } from "@/lib/subscriptions-shared";
import { UpiCheckoutModal } from "@/components/checkout/UpiCheckoutModal";

interface CustomerPlanUIProps {
  currentPlanId?: string;
  userEmail?: string;
  userName?: string;
  isUnrestrictedByAdmin?: boolean;
}

export function CustomerPlanUI({
  currentPlanId = "free",
  userEmail = "",
  userName = "",
  isUnrestrictedByAdmin = false,
}: CustomerPlanUIProps) {
  const [billingCycle, setBillingCycle] = useState<"monthly" | "yearly">("monthly");
  const [showUpiModal, setShowUpiModal] = useState(false);
  const [purchaseSuccess, setPurchaseSuccess] = useState<string | null>(null);

  const isAlreadyPremium = currentPlanId === "premium";
  const monthlyPrice = 49;
  const yearlyPrice = 499; // Save ₹89
  const currentPrice = billingCycle === "yearly" ? yearlyPrice : monthlyPrice;

  const handleOpenCheckout = () => {
    setShowUpiModal(true);
  };

  const handlePaymentSuccess = async () => {
    try {
      await fetch("/api/subscriptions/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          planId: "premium",
          billingCycle,
          utr: `UPI-DIRECT-${Date.now().toString(36).toUpperCase()}`,
          subscriberName: userName.trim() || "Customer",
          subscriberRole: "customer",
          subscriberEmail: userEmail.trim() || "",
          paymentTime: new Date().toLocaleString("en-IN", { timeZone: "Asia/Kolkata" }),
          amountPaid: currentPrice,
        }),
      });
    } catch {
      // Handled gracefully
    }
    setPurchaseSuccess(
      `Your payment verification request for Kynisto Premium (${billingCycle.toUpperCase()}) has been received! Our admin team will activate your VIP perks within 24 hours.`
    );
    setShowUpiModal(false);
  };

  return (
    <div className="w-full max-w-5xl mx-auto px-4 py-8 text-slate-900 font-sans overflow-x-clip">
      {/* Platform Unrestricted Courtesy Banner */}
      {isUnrestrictedByAdmin && (
        <div className="mb-8 p-5 rounded-3xl bg-amber-50 border-2 border-amber-300 text-amber-900 flex items-center justify-between gap-4 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-2xl bg-amber-200/60 text-amber-800">
              <Sparkles className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-extrabold text-amber-950 text-base">
                Platform Courtesy: All Premium VIP Perks Unlocked!
              </h3>
              <p className="text-xs text-amber-800">
                The platform administrator has enabled courtesy VIP access for all customers. Enjoy zero ads, priority queue tickets, and double loyalty points.
              </p>
            </div>
          </div>
          <span className="px-3.5 py-1.5 text-xs font-black rounded-full bg-amber-400 text-slate-950 uppercase tracking-wider shrink-0 shadow-2xs">
            UNRESTRICTED
          </span>
        </div>
      )}

      {/* Active Premium Member Banner */}
      {!isUnrestrictedByAdmin && isAlreadyPremium && (
        <div className="mb-8 p-4 rounded-2xl bg-emerald-50 border-2 border-emerald-300 flex items-center justify-between gap-4 shadow-xs">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-emerald-100 text-emerald-800">
              <Crown className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-extrabold text-emerald-950 text-base">
                Active Member: Kynisto Premium
              </h3>
              <p className="text-xs text-emerald-700">
                You are currently enjoying full VIP fast-track access, ad-free experience, and member cashbacks.
              </p>
            </div>
          </div>
          <span className="px-3 py-1 text-xs font-bold rounded-full bg-emerald-200 text-emerald-900 uppercase">
            ACTIVE VIP
          </span>
        </div>
      )}

      {/* Reassurance Toast after Payment */}
      {purchaseSuccess && (
        <div className="mb-8 p-5 rounded-3xl bg-emerald-50 border-2 border-emerald-300 text-emerald-900 shadow-md flex items-start gap-3.5 animate-in fade-in">
          <CheckCircle2 className="w-6 h-6 text-emerald-600 shrink-0 mt-0.5" />
          <div className="flex-1">
            <h4 className="font-extrabold text-emerald-950 text-sm sm:text-base mb-1">
              DON&apos;T PANIC — Admin Activates Within 24 Hours
            </h4>
            <p className="text-xs sm:text-sm text-emerald-800 leading-relaxed">
              {purchaseSuccess}
            </p>
          </div>
          <button
            type="button"
            onClick={() => setPurchaseSuccess(null)}
            className="text-xs font-bold text-emerald-700 hover:text-emerald-900 bg-emerald-100 hover:bg-emerald-200 px-3 py-1.5 rounded-xl transition-colors cursor-pointer"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Hero Header */}
      <div className="text-center max-w-3xl mx-auto mb-10">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-amber-50 border border-amber-200 text-amber-800 text-xs font-bold tracking-wide uppercase mb-3 shadow-xs">
          <Crown className="w-3.5 h-3.5 text-amber-600" />
          <span>Kynisto Customer VIP Pass</span>
        </div>
        <h1 className="text-3xl sm:text-4xl md:text-5xl font-black tracking-tight text-slate-900 mb-3">
          Experience Everything Smarter
        </h1>
        <p className="text-slate-600 text-sm sm:text-base leading-relaxed">
          Skip lines at local stores & clinics, remove banner ads, unlock member-only coupons, and get Gold VIP status across all stores in your city.
        </p>

        {/* Billing Cycle Switcher */}
        <div className="inline-flex items-center p-1.5 rounded-2xl bg-slate-100 border border-slate-200 mt-6 shadow-inner">
          <button
            type="button"
            onClick={() => setBillingCycle("monthly")}
            className={`px-5 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all duration-200 cursor-pointer ${
              billingCycle === "monthly"
                ? "bg-white text-slate-950 shadow-sm"
                : "text-slate-500 hover:text-slate-800"
            }`}
          >
            Monthly (₹49/mo)
          </button>
          <button
            type="button"
            onClick={() => setBillingCycle("yearly")}
            className={`relative px-5 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all duration-200 cursor-pointer ${
              billingCycle === "yearly"
                ? "bg-white text-slate-950 shadow-sm"
                : "text-slate-500 hover:text-slate-800"
            }`}
          >
            Yearly (₹499/yr)
            <span className="ml-2 px-2 py-0.5 text-[10px] font-black rounded-full bg-emerald-500 text-white uppercase tracking-wider">
              Save ₹89
            </span>
          </button>
        </div>
      </div>

      {/* Main Pricing Card (Light Mode Showcase) */}
      <div className="relative rounded-3xl p-6 sm:p-10 bg-white border-2 border-amber-400/90 shadow-xl overflow-hidden mb-12">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          {/* Left Column: Plan Price & 1-Tap Checkout */}
          <div className="lg:col-span-5 flex flex-col justify-between h-full border-b lg:border-b-0 lg:border-r border-slate-100 pb-8 lg:pb-0 lg:pr-8">
            <div>
              <span className="inline-block px-3 py-1 rounded-full text-xs font-black bg-amber-50 text-amber-800 border border-amber-200 tracking-wider uppercase mb-3">
                ⭐ ALL-IN-ONE PASS
              </span>
              <h2 className="text-2xl sm:text-3xl font-black text-slate-900 mb-2">
                Kynisto Premium
              </h2>
              <p className="text-slate-500 text-xs sm:text-sm leading-relaxed mb-6">
                Direct peer-to-peer UPI pass. Instant verification via FamPay, PhonePe, Paytm, and Google Pay.
              </p>
            </div>

            <div>
              <div className="flex items-baseline gap-2 mb-1">
                <span className="text-4xl sm:text-5xl font-black text-slate-900 tracking-tight">
                  ₹{currentPrice}
                </span>
                <span className="text-slate-500 text-xs sm:text-sm font-semibold">
                  / {billingCycle === "yearly" ? "year" : "month"}
                </span>
              </div>
              <p className="text-xs text-slate-500 mb-6 font-medium">
                {billingCycle === "yearly"
                  ? "Equivalent to just ₹41.5/month · Billed annually"
                  : "Cancel or pause anytime. No hidden charges."}
              </p>

              <button
                type="button"
                onClick={handleOpenCheckout}
                disabled={isAlreadyPremium}
                className={`w-full py-4 px-6 rounded-2xl font-black text-sm sm:text-base transition-all duration-200 flex items-center justify-center gap-2 shadow-lg shadow-amber-500/20 active:scale-[0.99] ${
                  isAlreadyPremium
                    ? "bg-slate-100 text-slate-400 cursor-not-allowed border border-slate-200"
                    : "bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 hover:from-amber-600 hover:to-orange-600 text-slate-950 cursor-pointer"
                }`}
              >
                <Crown className="w-5 h-5" />
                <span>{isAlreadyPremium ? "Current Active Plan" : `Pay with UPI · ₹${currentPrice}`}</span>
                {!isAlreadyPremium && <ArrowRight className="w-5 h-5 ml-1" />}
              </button>

              <div className="mt-3 flex items-center justify-center gap-1.5 text-[11px] text-slate-400">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                <span>Instant NPCI UPI transfer · Zero payment gateway fees</span>
              </div>
            </div>
          </div>

          {/* Right Column: Benefits Grid */}
          <div className="lg:col-span-7">
            <h3 className="text-xs font-black text-amber-700 tracking-wider uppercase mb-5 flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 text-amber-500" />
              <span>What&apos;s Included in Premium</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              {[
                {
                  icon: Zap,
                  color: "text-amber-600 bg-amber-50",
                  title: "VIP Priority Queue",
                  desc: "Jump standard queues with fast-track ticket priority",
                },
                {
                  icon: ShieldCheck,
                  color: "text-emerald-600 bg-emerald-50",
                  title: "100% Ad-Free",
                  desc: "Zero banner ads or promotional popups",
                },
                {
                  icon: Heart,
                  color: "text-rose-600 bg-rose-50",
                  title: "Unlimited Favorites",
                  desc: "Bookmark unlimited neighborhood stores & re-order easily",
                },
                {
                  icon: Crown,
                  color: "text-yellow-600 bg-yellow-50",
                  title: "Gold VIP Profile Badge",
                  desc: "Gold status badge across store reviews & ratings",
                },
                {
                  icon: Gift,
                  color: "text-teal-600 bg-teal-50",
                  title: "Exclusive Store Deals",
                  desc: "Special member-only discounts from verified partners",
                },
                {
                  icon: Bell,
                  color: "text-blue-600 bg-blue-50",
                  title: "Real-time SMS Alerts",
                  desc: "Live SMS & WhatsApp queue alerts when your turn is near",
                },
              ].map((perk, i) => {
                const IconComponent = perk.icon;
                return (
                  <div
                    key={i}
                    className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 hover:border-amber-300 transition-colors"
                  >
                    <div className="flex items-start gap-3">
                      <div className={`p-2 rounded-xl shrink-0 ${perk.color}`}>
                        <IconComponent className="w-4 h-4" />
                      </div>
                      <div>
                        <h4 className="text-xs sm:text-sm font-bold text-slate-900">{perk.title}</h4>
                        <p className="text-[11px] text-slate-500 mt-0.5 leading-tight">{perk.desc}</p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Comparison Table (Light Mode) */}
      <div className="max-w-4xl mx-auto mb-8">
        <h3 className="text-xl sm:text-2xl font-black text-center text-slate-900 mb-6">
          Free vs Premium Comparison
        </h3>
        <div className="bg-white border border-slate-200 rounded-3xl overflow-hidden shadow-sm">
          <table className="w-full text-left border-collapse text-xs sm:text-sm">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase text-[11px]">
                <th className="py-3.5 px-6">Feature</th>
                <th className="py-3.5 px-6 text-center w-36">Free Member</th>
                <th className="py-3.5 px-6 text-center w-48 bg-amber-50/60 text-amber-900 border-l border-r border-amber-200">
                  Premium (₹49/mo)
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              <tr>
                <td className="py-3 px-6 font-semibold text-slate-700">Live Queue Tokens</td>
                <td className="py-3 px-6 text-center text-slate-500">Standard Queue</td>
                <td className="py-3 px-6 text-center font-bold text-amber-800 bg-amber-50/30 border-l border-r border-amber-100">
                  Priority Fast-Track
                </td>
              </tr>
              <tr>
                <td className="py-3 px-6 font-semibold text-slate-700">Ad Experience</td>
                <td className="py-3 px-6 text-center text-slate-400">Supported by Ads</td>
                <td className="py-3 px-6 text-center font-bold text-emerald-700 bg-amber-50/30 border-l border-r border-amber-100">
                  100% Ad-Free
                </td>
              </tr>
              <tr>
                <td className="py-3 px-6 font-semibold text-slate-700">Favorite Stores</td>
                <td className="py-3 px-6 text-center text-slate-500">Up to 10 Stores</td>
                <td className="py-3 px-6 text-center font-bold text-amber-800 bg-amber-50/30 border-l border-r border-amber-100">
                  Unlimited Stores
                </td>
              </tr>
              <tr>
                <td className="py-3 px-6 font-semibold text-slate-700">Gold VIP Badge</td>
                <td className="py-3 px-6 text-center text-slate-300">—</td>
                <td className="py-3 px-6 text-center font-bold text-amber-800 bg-amber-50/30 border-l border-r border-amber-100">
                  Included ✓
                </td>
              </tr>
              <tr>
                <td className="py-3 px-6 font-semibold text-slate-700">SMS & WhatsApp Alerts</td>
                <td className="py-3 px-6 text-center text-slate-300">—</td>
                <td className="py-3 px-6 text-center font-bold text-amber-800 bg-amber-50/30 border-l border-r border-amber-100">
                  Instant Alerts ✓
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* Modern Light-Mode UPI Checkout Modal */}
      <UpiCheckoutModal
        isOpen={showUpiModal}
        onClose={() => setShowUpiModal(false)}
        title={`Kynisto Premium (${billingCycle.toUpperCase()})`}
        orderId={`SUB-PREM-${billingCycle.slice(0, 1).toUpperCase()}-${Date.now().toString().slice(-4)}`}
        amount={currentPrice}
        merchantName="Kynisto Premium"
        upiId={UPI_PAYMENT_ID}
        itemDetails={[
          {
            name: `Kynisto Premium Subscription (${billingCycle === "yearly" ? "1 Year" : "1 Month"})`,
            price: currentPrice,
            quantity: 1,
          },
        ]}
        onPaymentSuccess={handlePaymentSuccess}
      />
    </div>
  );
}

export default CustomerPlanUI;
