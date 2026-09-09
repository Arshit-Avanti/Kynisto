"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  Crown,
  Store,
  CheckCircle2,
  ArrowRight,
  MapPin,
  Check,
} from "lucide-react";
import { UpiCheckoutModal } from "@/components/checkout/UpiCheckoutModal";
import { UPI_PAYMENT_ID } from "@/lib/subscriptions-shared";

interface FeaturedStorePass {
  id: string;
  storeId: string;
  storeName: string;
  storeArea?: string;
  name: string;
  price: number;
  durationDays: number;
  benefits: string[];
  upiId?: string;
}

export function HomePlansAndMembershipsSection() {
  const [selectedPass, setSelectedPass] = useState<FeaturedStorePass | null>(null);
  const [isVipModalOpen, setIsVipModalOpen] = useState(false);
  const [isStorePassModalOpen, setIsStorePassModalOpen] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  // Fallback featured store passes if API is fetching
  const [featuredPasses, setFeaturedPasses] = useState<FeaturedStorePass[]>([
    {
      id: "demo-clinic-pass",
      storeId: "store-clinic-1",
      storeName: "Aarogya Multispeciality Clinic",
      storeArea: "DLF Ankur Vihar",
      name: "Clinic VIP Health Pass",
      price: 99,
      durationDays: 30,
      benefits: ["Skip OPD Queue Line", "Direct Priority Token", "Free BP & Vitals Check"],
      upiId: "9315678560@fam",
    },
    {
      id: "demo-grocery-pass",
      storeId: "store-grocery-1",
      storeName: "Green Valley Organic Mart",
      storeArea: "Loni Central Market",
      name: "VIP Super Saver Pass",
      price: 149,
      durationDays: 30,
      benefits: ["10% Flat Store Discount", "Free Express Delivery", "Priority Checkout Counter"],
      upiId: "9315678560@fam",
    },
  ]);

  useEffect(() => {
    fetch("/api/memberships")
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data?.plans && Array.isArray(data.plans) && data.plans.length > 0) {
          setFeaturedPasses(data.plans.slice(0, 2));
        }
      })
      .catch(() => {});
  }, []);

  const handleVipPaymentSuccess = async () => {
    try {
      await fetch("/api/subscriptions/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          planId: "premium",
          billingCycle: "monthly",
          utr: `UPI-HOME-${Date.now().toString(36).toUpperCase()}`,
          subscriberName: "Customer",
          subscriberRole: "customer",
          paymentTime: new Date().toLocaleString("en-IN", { timeZone: "Asia/Kolkata" }),
          amountPaid: 49,
        }),
      });
      setToast("🎉 Congratulations! Your Kynisto VIP Pass is activated instantly.");
    } catch {
      setToast("Payment submitted. Awaiting auto-verification.");
    } finally {
      setIsVipModalOpen(false);
      setTimeout(() => setToast(null), 5000);
    }
  };

  const handleStorePassSuccess = async () => {
    if (!selectedPass) return;
    try {
      await fetch("/api/memberships/purchase", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          storeId: selectedPass.storeId,
          planId: selectedPass.id,
          utr: `UPI-STORE-${Date.now().toString(36).toUpperCase()}`,
          customerName: "Customer",
        }),
      });
      setToast(`🎉 VIP Pass request submitted for ${selectedPass.storeName}!`);
    } catch {
      setToast("Payment recorded. The shop owner will activate your pass.");
    } finally {
      setIsStorePassModalOpen(false);
      setTimeout(() => setToast(null), 5000);
    }
  };

  return (
    <section className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-20 relative z-20 overflow-x-clip">
      {/* Toast Notification */}
      {toast && (
        <div className="fixed bottom-20 left-1/2 -translate-x-1/2 z-50 bg-emerald-600 text-white px-5 py-3 rounded-2xl shadow-2xl font-bold text-xs sm:text-sm flex items-center gap-2 border border-emerald-400 animate-in fade-in slide-in-from-bottom-4">
          <CheckCircle2 className="w-4 h-4 text-emerald-200" />
          <span>{toast}</span>
        </div>
      )}

      {/* Section Header */}
      <div className="text-center max-w-2xl mx-auto mb-10 sm:mb-14">
        <div className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-amber-500/15 border border-amber-500/30 text-[11px] font-bold text-amber-400 mb-3 uppercase tracking-wider">
          <Crown className="w-3.5 h-3.5 text-amber-400" />
          <span>Memberships &amp; Passes</span>
        </div>
        <h2 className="text-2xl sm:text-4xl font-black text-white tracking-tight">
          Unlock VIP Benefits Near You
        </h2>
        <p className="text-slate-300 text-xs sm:text-sm mt-2 leading-relaxed">
          Skip waiting in queues, get direct shop owner discounts, and support neighborhood businesses with instant UPI checkout.
        </p>
      </div>

      {/* Grid of Plans & Passes */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8 items-stretch">
        
        {/* Card 1: Platform VIP Pass */}
        <div className="md:col-span-1 bg-white border-2 border-amber-400/80 rounded-3xl p-6 sm:p-7 shadow-2xl relative flex flex-col justify-between text-slate-900">
          <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-gradient-to-r from-amber-500 to-orange-500 text-slate-950 font-black text-[10px] tracking-wider uppercase px-3 py-0.5 rounded-full shadow-md whitespace-nowrap">
            ⭐ Most Popular Pass
          </div>

          <div>
            <div className="flex items-center justify-between gap-2 mb-3 pt-1">
              <div className="flex items-center gap-2">
                <span className="w-9 h-9 rounded-2xl bg-amber-100 text-amber-700 flex items-center justify-center font-black text-sm">
                  <Crown className="w-5 h-5" />
                </span>
                <div>
                  <h3 className="text-lg sm:text-xl font-black text-slate-900 leading-tight">
                    Kynisto VIP Pass
                  </h3>
                  <p className="text-[11px] font-semibold text-slate-500">
                    City-Wide Priority &amp; Ad-Free
                  </p>
                </div>
              </div>
            </div>

            <div className="my-4 pb-4 border-b border-slate-100 flex items-baseline gap-1">
              <span className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight">₹49</span>
              <span className="text-xs font-bold text-slate-500">/ month</span>
            </div>

            <ul className="space-y-2.5 text-xs text-slate-700 mb-6">
              <li className="flex items-center gap-2">
                <Check className="w-4 h-4 text-emerald-600 shrink-0 stroke-[2.5]" />
                <span className="font-semibold">Fast-track Live Queue tokens</span>
              </li>
              <li className="flex items-center gap-2">
                <Check className="w-4 h-4 text-emerald-600 shrink-0 stroke-[2.5]" />
                <span className="font-semibold">100% Ad-Free browsing</span>
              </li>
              <li className="flex items-center gap-2">
                <Check className="w-4 h-4 text-emerald-600 shrink-0 stroke-[2.5]" />
                <span className="font-semibold">Gold VIP profile badge</span>
              </li>
              <li className="flex items-center gap-2">
                <Check className="w-4 h-4 text-emerald-600 shrink-0 stroke-[2.5]" />
                <span className="font-semibold">Instant SMS &amp; WhatsApp queue alerts</span>
              </li>
              <li className="flex items-center gap-2">
                <Check className="w-4 h-4 text-emerald-600 shrink-0 stroke-[2.5]" />
                <span className="font-semibold">Unlimited saved favorite stores</span>
              </li>
            </ul>
          </div>

          <button
            type="button"
            onClick={() => setIsVipModalOpen(true)}
            className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-slate-950 font-black text-xs sm:text-sm shadow-lg shadow-amber-500/20 active:scale-95 transition-all flex items-center justify-center gap-2 cursor-pointer"
          >
            <span>Pay with UPI · ₹49</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>

        {/* Card 2 & 3: Local Shop Owner Memberships */}
        {featuredPasses.map((pass) => (
          <div
            key={pass.id}
            className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-7 shadow-xl relative flex flex-col justify-between text-slate-900"
          >
            <div className="absolute -top-3 left-5 bg-emerald-50 text-emerald-700 border border-emerald-200 font-black text-[10px] tracking-wider uppercase px-2.5 py-0.5 rounded-full shadow-xs">
              🏪 Local Shop VIP
            </div>

            <div>
              <div className="flex items-start justify-between gap-2 mb-3 pt-1">
                <div>
                  <h3 className="text-base sm:text-lg font-black text-slate-900 leading-snug">
                    {pass.name}
                  </h3>
                  <div className="flex items-center gap-1.5 text-[11px] font-bold text-slate-500 mt-1">
                    <Store className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                    <span className="truncate">{pass.storeName}</span>
                  </div>
                  {pass.storeArea && (
                    <div className="flex items-center gap-1 text-[10px] text-slate-400 mt-0.5">
                      <MapPin className="w-3 h-3 text-slate-400" />
                      <span>{pass.storeArea}</span>
                    </div>
                  )}
                </div>
              </div>

              <div className="my-4 pb-4 border-b border-slate-100 flex items-baseline gap-1">
                <span className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">₹{pass.price}</span>
                <span className="text-xs font-bold text-slate-500">/ {pass.durationDays} days</span>
              </div>

              <ul className="space-y-2 text-xs text-slate-700 mb-6">
                {pass.benefits.slice(0, 4).map((b, i) => (
                  <li key={i} className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span className="font-semibold">{b}</span>
                  </li>
                ))}
              </ul>
            </div>

            <button
              type="button"
              onClick={() => {
                setSelectedPass(pass);
                setIsStorePassModalOpen(true);
              }}
              className="w-full py-2.5 px-4 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-black text-xs sm:text-sm shadow-md active:scale-95 transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <span>Join VIP Club · ₹{pass.price}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        ))}
      </div>

      {/* Footer Link to All Plans */}
      <div className="mt-8 sm:mt-12 text-center">
        <Link
          href="/pricing"
          className="inline-flex items-center gap-2 px-6 py-2.5 rounded-full bg-white/10 hover:bg-white/20 border border-white/20 text-white font-black text-xs sm:text-sm backdrop-blur-md transition-all hover:scale-105 active:scale-95 shadow-md"
        >
          <span>Explore All Store VIP Passes &amp; Business Pricing</span>
          <ArrowRight className="w-4 h-4 text-amber-400" />
        </Link>
      </div>

      {/* VIP UPI Checkout Modal */}
      <UpiCheckoutModal
        isOpen={isVipModalOpen}
        onClose={() => setIsVipModalOpen(false)}
        title="Kynisto VIP Membership Pass"
        orderId={`VIP-${Date.now().toString(36).toUpperCase()}`}
        amount={49}
        merchantName="Kynisto Subscriptions"
        upiId={UPI_PAYMENT_ID}
        itemDetails={[
          { name: "Kynisto Customer VIP Pass (Monthly)", price: 49 },
        ]}
        onPaymentSuccess={handleVipPaymentSuccess}
      />

      {/* Store Pass UPI Checkout Modal */}
      {selectedPass && (
        <UpiCheckoutModal
          isOpen={isStorePassModalOpen}
          onClose={() => {
            setIsStorePassModalOpen(false);
            setSelectedPass(null);
          }}
          title={`${selectedPass.storeName} VIP Pass`}
          orderId={`STORE-${selectedPass.id.slice(0, 6)}-${Date.now().toString(36).toUpperCase()}`}
          amount={selectedPass.price}
          merchantName={selectedPass.storeName}
          upiId={selectedPass.upiId || UPI_PAYMENT_ID}
          itemDetails={[
            { name: selectedPass.name, price: selectedPass.price },
          ]}
          onPaymentSuccess={handleStorePassSuccess}
        />
      )}
    </section>
  );
}