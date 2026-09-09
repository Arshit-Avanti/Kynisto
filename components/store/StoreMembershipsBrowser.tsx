"use client";

import React, { useState, useEffect } from "react";
import {
  Store,
  Star,
  ShieldCheck,
  Zap,
  ShoppingBag,
  Heart,
  Sparkles,
  ChevronRight,
  Clock,
  MapPin,
  CheckCircle2,
  RefreshCw,
  Search,
  Filter,
} from "lucide-react";
import { UpiCheckoutModal } from "@/components/checkout/UpiCheckoutModal";

export interface StoreMembershipItem {
  id: string;
  storeId: string;
  storeName: string;
  storeSlug?: string;
  storeArea?: string;
  storeCity?: string;
  storeLogo?: string | null;
  name: string;
  price: number;
  durationDays: number;
  description: string;
  benefits: string[];
  badgeColor?: string;
  planIcon?: string;
  upiId?: string;
  category?: string;
}

interface StoreMembershipsBrowserProps {
  userEmail?: string;
  userName?: string;
}

export function StoreMembershipsBrowser({
  userEmail = "",
  userName = "",
}: StoreMembershipsBrowserProps) {
  const [plans, setPlans] = useState<StoreMembershipItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [activePlan, setActivePlan] = useState<StoreMembershipItem | null>(null);
  const [showUpiModal, setShowUpiModal] = useState(false);
  const [purchaseSuccess, setPurchaseSuccess] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/memberships")
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data?.plans && Array.isArray(data.plans)) {
          setPlans(data.plans);
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const filteredPlans = plans.filter((plan) => {
    const matchesSearch =
      plan.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      plan.storeName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (plan.storeArea && plan.storeArea.toLowerCase().includes(searchQuery.toLowerCase())) ||
      plan.description.toLowerCase().includes(searchQuery.toLowerCase());

    if (!matchesSearch) return false;

    if (selectedCategory === "all") return true;
    if (selectedCategory === "grocery") {
      return (
        plan.name.toLowerCase().includes("grocery") ||
        plan.storeName.toLowerCase().includes("supermarket") ||
        plan.storeName.toLowerCase().includes("mart") ||
        plan.storeName.toLowerCase().includes("green")
      );
    }
    if (selectedCategory === "health") {
      return (
        plan.name.toLowerCase().includes("health") ||
        plan.name.toLowerCase().includes("med") ||
        plan.storeName.toLowerCase().includes("clinic") ||
        plan.storeName.toLowerCase().includes("pharmacy") ||
        plan.storeName.toLowerCase().includes("medicos")
      );
    }
    return true;
  });

  const handleOpenCheckout = (plan: StoreMembershipItem) => {
    setActivePlan(plan);
    setShowUpiModal(true);
  };

  const handlePaymentSuccess = async () => {
    if (!activePlan) return;
    try {
      await fetch("/api/memberships/purchase", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          storeId: activePlan.storeId,
          planId: activePlan.id,
          customerName: userName || "Customer",
          customerEmail: userEmail || "",
          utr: `UPI-DIR-${Date.now().toString(36).toUpperCase()}`,
        }),
      });
    } catch {
      // Handled gracefully
    }
    setPurchaseSuccess(
      `Your VIP Membership request for ${activePlan.name} at ${activePlan.storeName} has been submitted! The merchant will activate your benefits within 24 hours.`
    );
    setShowUpiModal(false);
  };

  return (
    <div className="w-full max-w-6xl mx-auto px-4 py-8 font-sans text-slate-900 overflow-x-clip">
      {/* HEADER SECTION */}
      <div className="text-center max-w-3xl mx-auto mb-10">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold tracking-wide uppercase mb-3 shadow-xs">
          <Store className="w-3.5 h-3.5 text-emerald-600" />
          <span>Local Shop Owner Memberships</span>
        </div>
        <h1 className="text-3xl sm:text-4xl md:text-5xl font-black tracking-tight text-slate-900 mb-3">
          Neighborhood Store VIP Passes
        </h1>
        <p className="text-slate-600 text-sm sm:text-base leading-relaxed">
          Support your favorite local merchants directly. Enjoy priority queue check-in, exclusive member discounts, free home delivery, and cashbacks.
        </p>
      </div>

      {/* SUCCESS CONFIRMATION BANNER */}
      {purchaseSuccess && (
        <div className="mb-8 p-5 rounded-3xl bg-emerald-50 border-2 border-emerald-300 text-emerald-900 shadow-md flex items-start gap-3.5 animate-in fade-in">
          <CheckCircle2 className="w-6 h-6 text-emerald-600 shrink-0 mt-0.5" />
          <div className="flex-1">
            <h4 className="font-extrabold text-emerald-950 text-sm sm:text-base mb-1">
              DON&apos;T PANIC — Shop Owner Will Activate Within 24 Hours
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

      {/* SEARCH AND CATEGORY FILTER BAR */}
      <div className="mb-8 flex flex-col sm:flex-row gap-3 items-center justify-between">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search stores, areas, or plans..."
            className="w-full pl-10 pr-4 py-2.5 rounded-2xl bg-white border border-slate-200 text-slate-900 placeholder-slate-400 text-xs font-medium focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/10 shadow-xs"
          />
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto pb-1 sm:pb-0">
          {[
            { id: "all", label: "All Stores" },
            { id: "grocery", label: "Supermarkets & Grocers" },
            { id: "health", label: "Clinics & Medicos" },
          ].map((cat) => (
            <button
              key={cat.id}
              type="button"
              onClick={() => setSelectedCategory(cat.id)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                selectedCategory === cat.id
                  ? "bg-slate-900 text-white shadow-xs"
                  : "bg-white border border-slate-200 text-slate-600 hover:bg-slate-50"
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>
      </div>

      {/* STORE MEMBERSHIP CARDS GRID */}
      {loading ? (
        <div className="py-20 text-center text-slate-500 text-sm font-semibold flex items-center justify-center gap-2">
          <RefreshCw className="w-4 h-4 animate-spin text-emerald-600" />
          <span>Loading neighborhood store memberships...</span>
        </div>
      ) : filteredPlans.length === 0 ? (
        <div className="py-16 text-center bg-white border border-slate-200 rounded-3xl p-8 shadow-xs">
          <Store className="w-10 h-10 text-slate-300 mx-auto mb-3" />
          <h3 className="text-base font-bold text-slate-800">No matching store memberships found</h3>
          <p className="text-xs text-slate-500 mt-1">Try searching for a different neighborhood or store name.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredPlans.map((plan) => (
            <div
              key={plan.id}
              className="bg-white border-2 border-slate-200 hover:border-emerald-500/80 rounded-3xl p-6 flex flex-col justify-between shadow-sm hover:shadow-xl transition-all duration-200 relative group overflow-x-clip"
            >
              <div>
                {/* Store Branding Top Row */}
                <div className="flex items-start justify-between gap-3 mb-4">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="w-10 h-10 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-700 flex items-center justify-center font-black text-sm shrink-0 shadow-2xs">
                      {plan.storeName.charAt(0)}
                    </div>
                    <div className="min-w-0">
                      <h4 className="text-sm font-extrabold text-slate-900 truncate group-hover:text-emerald-700 transition-colors">
                        {plan.storeName}
                      </h4>
                      <div className="flex items-center gap-1 text-[11px] text-slate-500 font-medium">
                        <MapPin className="w-3 h-3 text-slate-400 shrink-0" />
                        <span className="truncate">{plan.storeArea || "Local"}, {plan.storeCity || "India"}</span>
                      </div>
                    </div>
                  </div>

                  <span
                    className="text-white text-[10px] font-black px-2.5 py-1 rounded-full uppercase tracking-wider shrink-0 shadow-2xs"
                    style={{ background: plan.badgeColor || "#10B981" }}
                  >
                    {plan.durationDays} Days
                  </span>
                </div>

                {/* Plan Name & Price */}
                <div className="mb-4">
                  <h3 className="text-lg font-black text-slate-900 tracking-tight mb-1">
                    {plan.name}
                  </h3>
                  <div className="flex items-baseline gap-1.5">
                    <span className="text-3xl font-black text-slate-900">₹{plan.price}</span>
                    <span className="text-xs text-slate-500 font-semibold">/ {plan.durationDays} days</span>
                  </div>
                  <p className="text-xs text-slate-600 mt-2 leading-relaxed line-clamp-2">
                    {plan.description}
                  </p>
                </div>

                {/* Direct Payee Trust Pill */}
                <div className="bg-slate-50 border border-slate-200 rounded-xl p-2.5 mb-4 flex items-center justify-between text-[11px]">
                  <span className="text-slate-500 font-semibold">Direct UPI Transfer:</span>
                  <span className="font-mono font-bold text-slate-800 truncate max-w-[140px]">
                    {plan.upiId || "store@upi"}
                  </span>
                </div>

                {/* Benefits List */}
                <div className="space-y-2 mb-6">
                  <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                    VIP Member Perks:
                  </span>
                  {Array.isArray(plan.benefits) &&
                    plan.benefits.slice(0, 4).map((benefit, i) => (
                      <div key={i} className="flex items-start gap-2 text-xs text-slate-700 font-medium">
                        <Zap className="w-3.5 h-3.5 text-amber-500 shrink-0 mt-0.5" />
                        <span className="leading-tight">{benefit}</span>
                      </div>
                    ))}
                </div>
              </div>

              {/* Direct UPI Checkout Button */}
              <button
                type="button"
                onClick={() => handleOpenCheckout(plan)}
                className="w-full bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-black py-3 px-4 rounded-2xl text-xs sm:text-sm shadow-md shadow-emerald-600/20 transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-[0.99]"
              >
                <span>Join VIP Club · ₹{plan.price}</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* EMBEDDED LIGHT-MODE UPI CHECKOUT MODAL */}
      {activePlan && (
        <UpiCheckoutModal
          isOpen={showUpiModal}
          onClose={() => setShowUpiModal(false)}
          title={`${activePlan.storeName} VIP Pass`}
          orderId={`STORE-MEM-${activePlan.id.slice(-6).toUpperCase()}-${Date.now().toString().slice(-4)}`}
          amount={activePlan.price}
          merchantName={activePlan.storeName}
          upiId={activePlan.upiId || "kynisto.merchant@okaxis"}
          itemDetails={[
            {
              name: `${activePlan.name} (${activePlan.durationDays} Days Pass)`,
              price: activePlan.price,
              quantity: 1,
            },
          ]}
          onPaymentSuccess={handlePaymentSuccess}
        />
      )}
    </div>
  );
}

export default StoreMembershipsBrowser;
