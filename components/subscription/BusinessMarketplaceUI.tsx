"use client";

import React, { useState, useMemo } from "react";
import {
  Store,
  Users,
  MessageSquare,
  Sparkles,
  Palette,
  Tag,
  FileText,
  Plug,
  Headphones,
  Check,
  Plus,
  Minus,
  ArrowRight,
  ShieldCheck,
  Zap,
  Star,
  Copy,
  Clock,
  X,
  Layers,
  Flame,
  CheckCircle2,
  Building2,
  TrendingUp,
  Package,
} from "lucide-react";
import { UPI_PAYMENT_ID, PAYMENT_QR_IMAGE } from "@/lib/subscriptions-shared";

export interface ModularAddon {
  id: string;
  name: string;
  category: "capacity" | "engagement" | "intelligence" | "support" | "trust" | "queue";
  icon: any;
  monthlyPrice: number;
  description: string;
  type: "toggle" | "quantity";
  unitName?: string;
  maxQuantity?: number;
  badge?: string;
}

export const INITIAL_ADDON_CATALOG: ModularAddon[] = [
  {
    id: "verified_badge",
    name: "Verified Trust Badge",
    category: "trust",
    icon: ShieldCheck,
    monthlyPrice: 49,
    description: "Official checkmark badge next to your store name to boost customer trust.",
    type: "toggle",
    badge: "TRUSTED",
  },
  {
    id: "qr_queue",
    name: "QR Scan Queue",
    category: "queue",
    icon: Zap,
    monthlyPrice: 99,
    description: "Contactless QR code display for instant customer self-registration into queues.",
    type: "toggle",
    badge: "ESSENTIAL",
  },
  {
    id: "promotions",
    name: "Promotions & Featured Listing",
    category: "engagement",
    icon: Flame,
    monthlyPrice: 199,
    description: "Homepage promotion, featured category listing & sponsored business cards.",
    type: "toggle",
    badge: "BOOSTED",
  },
  {
    id: "live_queue_pro",
    name: "Live Queue Pro",
    category: "queue",
    icon: Clock,
    monthlyPrice: 299,
    description: "Unlimited smart queues, live wait time, queue notifications & delay alerts.",
    type: "toggle",
    badge: "RECOMMENDED",
  },
  {
    id: "business_analytics",
    name: "Business Analytics Pro",
    category: "intelligence",
    icon: TrendingUp,
    monthlyPrice: 149,
    description: "Customer insights, visitor statistics, peak rush hours & monthly performance reports.",
    type: "toggle",
    badge: "REPORTS",
  },
  {
    id: "top_search_ranking",
    name: "Top Search Ranking",
    category: "engagement",
    icon: Star,
    monthlyPrice: 99,
    description: "Appear above competitors in local search results with priority placement.",
    type: "toggle",
    badge: "HIGH VISIBILITY",
  },
  {
    id: "membership_management",
    name: "Membership Management",
    category: "engagement",
    icon: Users,
    monthlyPrice: 299,
    description: "Sell custom digital memberships to your own customers with QR verification.",
    type: "toggle",
    badge: "NEW",
  },
  {
    id: "future_pass",
    name: "Future Features Pass",
    category: "intelligence",
    icon: Sparkles,
    monthlyPrice: 499,
    description: "Automatically unlock every premium feature released by Kynisto in the future.",
    type: "toggle",
    badge: "VIP PASS",
  },
];

interface ComboPack {
  id: string;
  name: string;
  badge: string;
  badgeColor: string;
  discountBadge: string;
  isPopular?: boolean;
  monthlyPrice: number;
  yearlyPrice: number;
  originalPriceMonthly: number;
  description: string;
  features: string[];
  addonSelections: Record<string, number | boolean>;
}

const PREMIUM_COMBOS: ComboPack[] = [
  {
    id: "starter_bundle",
    name: "Starter Store Bundle",
    badge: "BEST SELLER",
    badgeColor: "bg-blue-500/20 text-blue-300 border-blue-500/40",
    discountBadge: "Save ₹97/mo",
    monthlyPrice: 299,
    yearlyPrice: 2999,
    originalPriceMonthly: 396,
    description: "Essential setup for single-store retail or clinics wanting automated alerts & staff access.",
    features: [
      "Base Core Platform (1 Store, 50 Daily Bookings)",
      "2 Staff Seat Accounts (Worth ₹98)",
      "WhatsApp & Automated SMS Alerts (Worth ₹99)",
      "Standard Analytics & QR Ticket Printing",
    ],
    addonSelections: {
      extra_staff: 2,
      whatsapp_alerts: true,
    },
  },
  {
    id: "growth_bundle",
    name: "Growth & Scale Bundle",
    badge: "BEST VALUE",
    badgeColor: "bg-emerald-500/20 text-emerald-300 border-emerald-500/40",
    discountBadge: "Save ₹344/mo",
    isPopular: true,
    monthlyPrice: 699,
    yearlyPrice: 6999,
    originalPriceMonthly: 1043,
    description: "Full-featured operational engine for multi-branch stores or busy appointment hubs.",
    features: [
      "Base Core Platform + 2 Extra Stores (3 Total Stores)",
      "5 Staff Seat Accounts",
      "WhatsApp & Automated SMS Alerts",
      "AI Queue & Demand Forecast Engine",
      "Marketing Coupons & Promo Broadcasts",
      "Advanced Reports & CSV Data Export",
    ],
    addonSelections: {
      extra_stores: 2,
      extra_staff: 5,
      whatsapp_alerts: true,
      ai_analytics: true,
      marketing_coupons: true,
      reports_export: true,
    },
  },
  {
    id: "enterprise_suite",
    name: "Enterprise Dominance Suite",
    badge: "MOST POPULAR",
    badgeColor: "bg-amber-500/20 text-amber-300 border-amber-500/40",
    discountBadge: "Save ₹500/mo",
    monthlyPrice: 999,
    yearlyPrice: 9999,
    originalPriceMonthly: 1499,
    description: "All-inclusive enterprise suite with custom white-label branding and 24/7 dedicated phone support.",
    features: [
      "Base Core Platform + 5 Extra Stores",
      "Unlimited Staff Accounts (Up to 10)",
      "All 7 Modular Add-Ons Included",
      "Custom White Labeling & Branded Receipts",
      "POS & Billing API Suite (Tally/Square)",
      "24/7 Dedicated VIP Account Manager",
    ],
    addonSelections: {
      extra_stores: 5,
      extra_staff: 10,
      whatsapp_alerts: true,
      ai_analytics: true,
      custom_branding: true,
      marketing_coupons: true,
      reports_export: true,
      pos_integration: true,
      vip_support: true,
    },
  },
];

interface BusinessMarketplaceUIProps {
  currentPlanId?: string;
  userEmail?: string;
  userName?: string;
  isUnrestrictedByAdmin?: boolean;
}

export function BusinessMarketplaceUI({
  currentPlanId = "free",
  userEmail = "",
  userName = "",
  isUnrestrictedByAdmin = false,
}: BusinessMarketplaceUIProps) {
  const BASE_PRICE_MONTHLY = 199;
  const [billingCycle, setBillingCycle] = useState<"monthly" | "yearly">("monthly");
  const [selectedAddons, setSelectedAddons] = useState<Record<string, number | boolean>>({});
  const [addonCatalog, setAddonCatalog] = useState<ModularAddon[]>(INITIAL_ADDON_CATALOG);
  const [combosCatalog, setCombosCatalog] = useState<ComboPack[]>(PREMIUM_COMBOS);
  
  React.useEffect(() => {
    let isMounted = true;
    async function loadMarketplace() {
      try {
        const res = await fetch("/api/subscriptions/marketplace", { cache: "no-store" });
        if (!res.ok) return;
        const data = await res.json();
        if (!isMounted) return;

        if (Array.isArray(data.features) && data.features.length > 0) {
          const getFeatureIcon = (idStr: string) => {
            const lower = idStr.toLowerCase();
            if (lower.includes("badge") || lower.includes("trust") || lower.includes("verified")) return ShieldCheck;
            if (lower.includes("qr") || lower.includes("queue")) return Zap;
            if (lower.includes("promo") || lower.includes("deal") || lower.includes("marketing")) return Flame;
            if (lower.includes("analytic") || lower.includes("insight")) return TrendingUp;
            if (lower.includes("rank") || lower.includes("search") || lower.includes("boost")) return Star;
            if (lower.includes("member")) return Users;
            if (lower.includes("whatsapp") || lower.includes("message")) return MessageSquare;
            if (lower.includes("brand") || lower.includes("white")) return Palette;
            if (lower.includes("ai") || lower.includes("bot")) return Sparkles;
            if (lower.includes("inventory") || lower.includes("catalog") || lower.includes("stock")) return Package;
            if (lower.includes("report") || lower.includes("export") || lower.includes("file")) return FileText;
            return Star;
          };

          const mappedFeatures: ModularAddon[] = data.features
            .filter((f: any) => f.isActive !== false)
            .map((f: any) => {
              const featId = String(f.id || f.slug || f.key || "");
              return {
                id: featId,
                name: String(f.name || featId),
                category: (f.category || "engagement") as any,
                icon: getFeatureIcon(featId + " " + (f.name || "")),
                monthlyPrice: Number(f.price ?? f.monthlyPrice ?? 49),
                description: String(f.description || f.name || ""),
                type: "toggle" as const,
                badge: f.badge || f.badgeText || undefined,
              };
            });
          setAddonCatalog(mappedFeatures);
        }

        if (Array.isArray(data.combos) && data.combos.length > 0) {
          const mappedCombos: ComboPack[] = data.combos
            .filter((c: any) => c.isActive !== false)
            .map((c: any) => {
              const comboPrice = Number(c.price ?? c.monthlyPrice ?? 299);
              const origPrice = Number(c.originalPrice ?? c.originalPriceMonthly ?? comboPrice + 50);
              const savings = origPrice > comboPrice ? origPrice - comboPrice : 48;
              return {
                id: String(c.id || c.slug || ""),
                name: String(c.name || "Combo Pack"),
                badge: String(c.badge || "RECOMMENDED"),
                badgeColor: c.isPopular ? "bg-amber-500/20 text-amber-300 border-amber-400/40" : "bg-blue-500/20 text-blue-300 border-blue-500/40",
                discountBadge: String(c.discountBadge || `Save ₹${savings}/mo`),
                isPopular: Boolean(c.isPopular),
                monthlyPrice: comboPrice,
                yearlyPrice: Number(c.yearlyPrice ?? Math.round(comboPrice * 10)),
                originalPriceMonthly: origPrice,
                description: String(c.description || c.name || ""),
                features: Array.isArray(c.features) ? c.features.map(String) : [],
                addonSelections: {},
              };
            });
          setCombosCatalog(mappedCombos);
        }
      } catch (err) {
        // Fall back gracefully
      }
    }
    loadMarketplace();
    return () => { isMounted = false; };
  }, []);

  // Active modal/checkout state
  const [showCheckoutModal, setShowCheckoutModal] = useState(false);
  const [checkoutTarget, setCheckoutTarget] = useState<{
    title: string;
    amountMonthly: number;
    amountYearly: number;
    planId: string;
    details: string[];
  } | null>(null);

  const [utrInput, setUtrInput] = useState("");
  const [subscriberName, setSubscriberName] = useState(userName);
  const [subscriberEmail, setSubscriberEmail] = useState(userEmail);
  const [copiedUpi, setCopiedUpi] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [pendingResponse, setPendingResponse] = useState<any>(null);

  // Toggle or modify add-on quantity
  const handleToggleAddon = (addonId: string) => {
    setSelectedAddons((prev) => ({
      ...prev,
      [addonId]: !prev[addonId],
    }));
  };

  const handleUpdateQuantity = (addonId: string, delta: number) => {
    setSelectedAddons((prev) => {
      const current = typeof prev[addonId] === "number" ? (prev[addonId] as number) : 0;
      const next = Math.max(0, current + delta);
      return {
        ...prev,
        [addonId]: next,
      };
    });
  };

  const handleResetAddons = () => {
    setSelectedAddons({});
  };

  // Calculate live custom total
  const customCalculatedMonthly = useMemo(() => {
    let total = BASE_PRICE_MONTHLY;
    addonCatalog.forEach((addon) => {
      const val = selectedAddons[addon.id];
      if (addon.type === "toggle" && val === true) {
        total += addon.monthlyPrice;
      } else if (addon.type === "quantity" && typeof val === "number" && val > 0) {
        total += addon.monthlyPrice * val;
      }
    });
    return total;
  }, [selectedAddons, addonCatalog]);

  const customCalculatedYearly = useMemo(() => {
    // 20% discount on yearly billing
    return Math.round(customCalculatedMonthly * 12 * 0.8);
  }, [customCalculatedMonthly]);

  // Selected add-on items count
  const activeAddonsCount = useMemo(() => {
    return Object.values(selectedAddons).filter((v) => (typeof v === "number" ? v > 0 : v === true)).length;
  }, [selectedAddons]);

  // Apply combo pack to builder
  const handleSelectCombo = (combo: ComboPack) => {
    const featureList = combo.features;
    setCheckoutTarget({
      title: combo.name,
      amountMonthly: combo.monthlyPrice,
      amountYearly: combo.yearlyPrice,
      planId: combo.id,
      details: featureList,
    });
    setErrorMessage("");
    setPendingResponse(null);
    setUtrInput("");
    setShowCheckoutModal(true);
  };

  const handleOpenCustomCheckout = () => {
    const itemizedList: string[] = ["Base Core Platform (1 Store, 50 Daily Bookings)"];
    addonCatalog.forEach((addon) => {
      const val = selectedAddons[addon.id];
      if (addon.type === "toggle" && val === true) {
        itemizedList.push(`${addon.name} (₹${addon.monthlyPrice}/mo)`);
      } else if (addon.type === "quantity" && typeof val === "number" && val > 0) {
        itemizedList.push(`${val}x ${addon.name} (₹${addon.monthlyPrice * val}/mo)`);
      }
    });

    setCheckoutTarget({
      title: "Custom Business Plan",
      amountMonthly: customCalculatedMonthly,
      amountYearly: customCalculatedYearly,
      planId: "custom_modular_plan",
      details: itemizedList,
    });
    setErrorMessage("");
    setPendingResponse(null);
    setUtrInput("");
    setShowCheckoutModal(true);
  };

  const handleCopyUpi = () => {
    navigator.clipboard.writeText(UPI_PAYMENT_ID);
    setCopiedUpi(true);
    setTimeout(() => setCopiedUpi(false), 2000);
  };

  const handleSubmitPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!checkoutTarget) return;
    setErrorMessage("");

    if (!subscriberName.trim() || !subscriberEmail.trim()) {
      setErrorMessage("Name of user and Email Address are required. Please fill out all required fields.");
      return;
    }

    const price = billingCycle === "yearly" ? checkoutTarget.amountYearly : checkoutTarget.amountMonthly;

    setIsSubmitting(true);
    try {
      const res = await fetch("/api/subscriptions/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          planId: checkoutTarget.planId,
          billingCycle,
          utr: utrInput.trim(),
          subscriberName: subscriberName.trim(),
          subscriberRole: "store_owner",
          subscriberEmail: subscriberEmail.trim(),
          paymentTime: new Date().toLocaleString(),
          amountPaid: price,
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

  const activePrice = checkoutTarget
    ? billingCycle === "yearly"
      ? checkoutTarget.amountYearly
      : checkoutTarget.amountMonthly
    : 0;

  return (
    <div className="w-full max-w-7xl mx-auto px-4 py-8 text-white font-sans">
      {/* Unrestricted Admin Platform Banner */}
      {isUnrestrictedByAdmin && (
        <div className="mb-8 p-5 rounded-2xl bg-gradient-to-r from-cyan-500/20 via-blue-500/20 to-indigo-500/20 border-2 border-cyan-500/40 flex items-center justify-between gap-4 backdrop-blur-md shadow-xl shadow-cyan-500/10">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-xl bg-cyan-500/30 text-cyan-300">
              <Sparkles className="w-7 h-7" />
            </div>
            <div>
              <h3 className="font-bold text-cyan-300 text-lg">Platform Courtesy: All Business Features &amp; Add-Ons Unlocked!</h3>
              <p className="text-xs text-cyan-200/80">The platform administrator has removed all membership restrictions for business owners. You have full access to unlimited stores, live queues, advanced analytics, staff accounts, and custom branding at zero cost.</p>
            </div>
          </div>
          <span className="px-3.5 py-1.5 text-xs font-black rounded-full bg-cyan-500 text-slate-950 uppercase tracking-wider">
            UNRESTRICTED
          </span>
        </div>
      )}

      {/* Header */}
      <div className="text-center max-w-3xl mx-auto mb-12">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 text-xs font-semibold tracking-wide uppercase mb-4 shadow-lg shadow-cyan-500/5">
          <Building2 className="w-3.5 h-3.5" />
          <span>Business Owner Portal</span>
        </div>
        <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-slate-100 via-cyan-200 to-indigo-400 mb-4">
          Business Marketplace &amp; Modular Plans
        </h1>
        <p className="text-slate-400 text-base md:text-lg leading-relaxed">
          Pay only for what your store needs. Build your custom plan with modular add-ons or pick an all-in-one value combo.
        </p>

        {/* Global Billing Cycle Toggle */}
        <div className="inline-flex items-center p-1.5 rounded-2xl bg-slate-900/90 border border-slate-800 mt-8 backdrop-blur-md shadow-inner">
          <button
            type="button"
            onClick={() => setBillingCycle("monthly")}
            className={`px-5 py-2 rounded-xl text-sm font-medium transition-all duration-200 ${
              billingCycle === "monthly"
                ? "bg-gradient-to-r from-cyan-500 to-blue-600 text-slate-950 font-bold shadow-md shadow-cyan-500/20"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            Monthly Billing
          </button>
          <button
            type="button"
            onClick={() => setBillingCycle("yearly")}
            className={`relative px-5 py-2 rounded-xl text-sm font-medium transition-all duration-200 ${
              billingCycle === "yearly"
                ? "bg-gradient-to-r from-cyan-500 to-blue-600 text-slate-950 font-bold shadow-md shadow-cyan-500/20"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            Yearly Billing
            <span className="ml-2 px-2 py-0.5 text-[10px] font-bold rounded-full bg-emerald-400 text-slate-950 uppercase tracking-wider">
              20% OFF
            </span>
          </button>
        </div>
      </div>

      {/* SECTION 1: BUILD YOUR OWN PLAN (MODULAR BUILDER WITH LIVE STICKY SUMMARY) */}
      <section className="mb-20">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2.5 rounded-xl bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
            <Layers className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-white">Build Your Own Plan</h2>
            <p className="text-xs text-slate-400">Configure custom capacity and modular feature add-ons live.</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Left Column: Add-ons Catalog (8 Columns) */}
          <div className="lg:col-span-8 space-y-6">
            {/* Required Base Core Card */}
            <div className="p-6 rounded-2xl bg-gradient-to-r from-slate-900 via-slate-900 to-slate-950 border border-cyan-500/30 shadow-xl relative overflow-hidden">
              <div className="absolute top-0 right-0 px-4 py-1 bg-cyan-500/20 text-cyan-300 text-[10px] font-bold uppercase rounded-bl-xl border-l border-b border-cyan-500/30">
                INCLUDED FOUNDATION
              </div>
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <CheckCircle2 className="w-5 h-5 text-cyan-400" />
                    <h3 className="text-lg font-bold text-white">Base Core Platform</h3>
                  </div>
                  <p className="text-xs text-slate-400">
                    Includes 1 Store Outlet, 50 Daily Bookings, QR Queue Management, and Standard Dashboard.
                  </p>
                </div>
                <div className="text-right shrink-0">
                  <div className="text-2xl font-black text-white">₹{BASE_PRICE_MONTHLY}</div>
                  <div className="text-[11px] text-slate-400">/ month base</div>
                </div>
              </div>
            </div>

            {/* Modular Add-on Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {addonCatalog.map((addon) => {
                const IconComponent = addon.icon;
                const isSelected =
                  addon.type === "toggle"
                    ? !!selectedAddons[addon.id]
                    : (selectedAddons[addon.id] as number) > 0;
                const quantity = typeof selectedAddons[addon.id] === "number" ? (selectedAddons[addon.id] as number) : 0;

                return (
                  <div
                    key={addon.id}
                    className={`p-5 rounded-2xl border transition-all duration-200 flex flex-col justify-between ${
                      isSelected
                        ? "bg-slate-900/90 border-cyan-500/50 shadow-lg shadow-cyan-500/5"
                        : "bg-slate-900/40 border-slate-800 hover:border-slate-700"
                    }`}
                  >
                    <div>
                      <div className="flex items-start justify-between gap-3 mb-2">
                        <div className="flex items-center gap-2.5">
                          <div
                            className={`p-2 rounded-xl transition-colors ${
                              isSelected ? "bg-cyan-500/20 text-cyan-300" : "bg-slate-800 text-slate-400"
                            }`}
                          >
                            <IconComponent className="w-4 h-4" />
                          </div>
                          <h4 className="text-sm font-semibold text-white leading-tight">{addon.name}</h4>
                        </div>
                        <span className="text-xs font-bold text-cyan-400 shrink-0">+₹{addon.monthlyPrice}/mo</span>
                      </div>
                      <p className="text-xs text-slate-400 leading-relaxed mb-4">{addon.description}</p>
                    </div>

                    {/* Controller: Toggle vs Quantity Counter */}
                    <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between">
                      {addon.type === "toggle" ? (
                        <button
                          type="button"
                          onClick={() => handleToggleAddon(addon.id)}
                          className={`w-full py-2 px-3 rounded-xl text-xs font-semibold flex items-center justify-center gap-2 transition-all ${
                            isSelected
                              ? "bg-cyan-500 text-slate-950 font-bold shadow-sm"
                              : "bg-slate-800 text-slate-300 hover:bg-slate-700"
                          }`}
                        >
                          {isSelected ? (
                            <>
                              <Check className="w-3.5 h-3.5" />
                              <span>Added to Plan</span>
                            </>
                          ) : (
                            <>
                              <Plus className="w-3.5 h-3.5" />
                              <span>Add Add-on</span>
                            </>
                          )}
                        </button>
                      ) : (
                        <div className="flex items-center justify-between w-full">
                          <span className="text-xs text-slate-400 font-medium">
                            {quantity > 0 ? `${quantity} ${addon.unitName}(s)` : `Add ${addon.unitName}s`}
                          </span>
                          <div className="flex items-center gap-1.5 bg-slate-950 p-1 rounded-xl border border-slate-800">
                            <button
                              type="button"
                              onClick={() => handleUpdateQuantity(addon.id, -1)}
                              disabled={quantity <= 0}
                              className="p-1 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white disabled:opacity-30"
                            >
                              <Minus className="w-3.5 h-3.5" />
                            </button>
                            <span className="px-2 text-xs font-bold text-white min-w-[20px] text-center">
                              {quantity}
                            </span>
                            <button
                              type="button"
                              onClick={() => handleUpdateQuantity(addon.id, 1)}
                              disabled={addon.maxQuantity ? quantity >= addon.maxQuantity : false}
                              className="p-1 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white disabled:opacity-30"
                            >
                              <Plus className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Right Column: Live Sticky Checkout Summary (4 Columns) */}
          <div className="lg:col-span-4 sticky top-24">
            <div className="rounded-3xl p-6 bg-slate-900 border border-slate-800 shadow-2xl backdrop-blur-xl space-y-6">
              <div className="flex items-center justify-between border-b border-slate-800 pb-4">
                <div>
                  <h3 className="text-base font-bold text-white flex items-center gap-2">
                    <TrendingUp className="w-4 h-4 text-cyan-400" />
                    Live Plan Summary
                  </h3>
                  <p className="text-[11px] text-slate-400">Updates dynamically as you customize</p>
                </div>
                {activeAddonsCount > 0 && (
                  <button
                    type="button"
                    onClick={handleResetAddons}
                    className="text-[11px] font-medium text-rose-400 hover:underline"
                  >
                    Reset
                  </button>
                )}
              </div>

              {/* Itemized Price Breakdown */}
              <div className="space-y-3 max-h-56 overflow-y-auto pr-1 text-xs">
                <div className="flex justify-between items-center text-slate-300">
                  <span className="flex items-center gap-1.5">
                    <Check className="w-3.5 h-3.5 text-cyan-400" />
                    Base Core Platform
                  </span>
                  <span className="font-semibold text-white">₹{BASE_PRICE_MONTHLY}/mo</span>
                </div>

                {addonCatalog.map((addon) => {
                  const val = selectedAddons[addon.id];
                  if (addon.type === "toggle" && val === true) {
                    return (
                      <div key={addon.id} className="flex justify-between items-center text-slate-400">
                        <span className="truncate pr-2">+ {addon.name}</span>
                        <span className="font-medium text-cyan-300 shrink-0">₹{addon.monthlyPrice}/mo</span>
                      </div>
                    );
                  }
                  if (addon.type === "quantity" && typeof val === "number" && val > 0) {
                    return (
                      <div key={addon.id} className="flex justify-between items-center text-slate-400">
                        <span className="truncate pr-2">
                          + {val}x {addon.name}
                        </span>
                        <span className="font-medium text-cyan-300 shrink-0">
                          ₹{addon.monthlyPrice * val}/mo
                        </span>
                      </div>
                    );
                  }
                  return null;
                })}
              </div>

              {/* Price Calculation Display */}
              <div className="pt-4 border-t border-slate-800 space-y-3">
                <div className="flex items-baseline justify-between">
                  <span className="text-sm font-semibold text-slate-300">Total Price:</span>
                  <div className="text-right">
                    <span className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-cyan-300 to-blue-400">
                      ₹{billingCycle === "yearly" ? customCalculatedYearly : customCalculatedMonthly}
                    </span>
                    <span className="text-slate-400 text-xs font-medium">
                      / {billingCycle === "yearly" ? "year" : "month"}
                    </span>
                  </div>
                </div>

                {billingCycle === "yearly" && (
                  <p className="text-[11px] text-emerald-400 text-right">
                    Includes 20% annual discount (Billed ₹{customCalculatedYearly}/yr)
                  </p>
                )}

                <button
                  type="button"
                  onClick={handleOpenCustomCheckout}
                  className="w-full py-3.5 px-5 rounded-2xl font-bold text-sm bg-gradient-to-r from-cyan-500 via-blue-500 to-indigo-600 text-slate-950 hover:brightness-110 active:scale-[0.99] transition-all flex items-center justify-center gap-2 shadow-lg shadow-cyan-500/20"
                >
                  <ShieldCheck className="w-4 h-4" />
                  <span>Subscribe to Custom Plan</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* SECTION 2: PRE-PACKAGED PREMIUM COMBOS (WITH BADGES) */}
      <section className="mt-16 pt-12 border-t border-slate-800/80">
        <div className="text-center max-w-2xl mx-auto mb-12">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-400 text-xs font-semibold uppercase tracking-wider mb-3">
            <Flame className="w-3.5 h-3.5" />
            <span>Curated Value Packages</span>
          </div>
          <h2 className="text-3xl font-extrabold text-white">Premium Combos</h2>
          <p className="text-slate-400 text-sm mt-2">
            Ready-made business bundles configured for high savings and zero setup friction.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {combosCatalog.map((combo) => (
            <div
              key={combo.id}
              className={`relative rounded-3xl p-7 bg-slate-900/90 border backdrop-blur-xl flex flex-col justify-between transition-all duration-300 hover:-translate-y-1 ${
                combo.isPopular
                  ? "border-emerald-500/50 shadow-2xl shadow-emerald-500/10"
                  : "border-slate-800 hover:border-slate-700"
              }`}
            >
              {combo.isPopular && (
                <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full bg-gradient-to-r from-emerald-400 to-teal-500 text-slate-950 font-black text-[11px] tracking-wider uppercase shadow-md">
                  ⭐ {combo.badge}
                </div>
              )}

              <div>
                {/* Badges Bar */}
                <div className="flex items-center justify-between gap-2 mb-4">
                  <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold border ${combo.badgeColor}`}>
                    {combo.badge}
                  </span>
                  <span className="px-2.5 py-1 rounded-full text-[10px] font-extrabold bg-amber-400/10 text-amber-300 border border-amber-400/30">
                    {combo.discountBadge}
                  </span>
                </div>

                <h3 className="text-xl font-bold text-white mb-2">{combo.name}</h3>
                <p className="text-xs text-slate-400 mb-6 min-h-[36px]">{combo.description}</p>

                {/* Price Box */}
                <div className="mb-6 pb-6 border-b border-slate-800">
                  <div className="flex items-baseline gap-2">
                    <span className="text-4xl font-black text-white">
                      ₹{billingCycle === "yearly" ? combo.yearlyPrice : combo.monthlyPrice}
                    </span>
                    <span className="text-slate-400 text-xs">
                      / {billingCycle === "yearly" ? "year" : "month"}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-xs text-slate-500 line-through">
                      ₹{combo.originalPriceMonthly}/mo standard
                    </span>
                    <span className="text-xs font-semibold text-emerald-400">
                      Bundled Discount
                    </span>
                  </div>
                </div>

                {/* Features List */}
                <ul className="space-y-3 text-xs text-slate-300 mb-8">
                  {combo.features.map((feat, idx) => (
                    <li key={idx} className="flex items-start gap-2.5">
                      <Check className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
                      <span>{feat}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <button
                type="button"
                onClick={() => handleSelectCombo(combo)}
                className={`w-full py-3.5 px-4 rounded-2xl font-bold text-sm transition-all duration-200 flex items-center justify-center gap-2 ${
                  combo.isPopular
                    ? "bg-gradient-to-r from-emerald-400 to-teal-500 text-slate-950 hover:brightness-110 shadow-lg shadow-emerald-500/20"
                    : "bg-slate-800 hover:bg-slate-700 text-white"
                }`}
              >
                <span>Choose {combo.name}</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      </section>

      {/* CHECKOUT MODAL WITH UPI INTEGRATION */}
      {showCheckoutModal && checkoutTarget && (
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
                  <div className="p-3 rounded-2xl bg-cyan-500/10 text-cyan-400 border border-cyan-500/30">
                    <Building2 className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-white">{checkoutTarget.title}</h3>
                    <p className="text-xs text-slate-400">
                      Total Amount: <span className="font-semibold text-cyan-400">₹{activePrice}</span> ({billingCycle})
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
                      Step 1: Scan QR or Transfer to UPI ID
                    </p>
                    <div className="inline-block p-3 rounded-2xl bg-white mb-3 shadow-inner">
                      <img
                        src={PAYMENT_QR_IMAGE}
                        alt="UPI Payment QR Code"
                        className="w-44 h-44 object-contain rounded-lg"
                        onError={(e) => {
                          (e.target as HTMLElement).style.display = "none";
                        }}
                      />
                    </div>
                    <div className="flex items-center justify-center gap-2">
                      <code className="px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-700 text-cyan-300 font-mono text-sm">
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
                      Instant verification via Google Pay, PhonePe, Paytm, BHIM, CRED
                    </p>
                  </div>

                  {/* Step 2: Customer Details */}
                  <div className="space-y-4">
                    <div>
                      <label className="block text-xs font-medium text-slate-300 mb-1">
                        Business / Owner Name <span className="text-rose-400">*</span>
                      </label>
                      <input
                        type="text"
                        required
                        value={subscriberName}
                        onChange={(e) => setSubscriberName(e.target.value)}
                        placeholder="e.g. Vikram Sethi (Metro Retail)"
                        className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 focus:border-cyan-500 focus:outline-none text-sm text-white placeholder-slate-500"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-slate-300 mb-1">
                        Business Email Address <span className="text-rose-400">*</span>
                      </label>
                      <input
                        type="email"
                        required
                        value={subscriberEmail}
                        onChange={(e) => setSubscriberEmail(e.target.value)}
                        placeholder="e.g. owner@metrostore.in"
                        className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 focus:border-cyan-500 focus:outline-none text-sm text-white placeholder-slate-500"
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
                        className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 focus:border-cyan-500 focus:outline-none text-sm font-mono text-white placeholder-slate-500"
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full py-3.5 px-6 rounded-xl font-bold bg-gradient-to-r from-cyan-500 via-blue-500 to-indigo-600 text-slate-950 hover:brightness-110 active:scale-[0.99] transition-all flex items-center justify-center gap-2 shadow-lg shadow-cyan-500/20 disabled:opacity-50"
                  >
                    {isSubmitting ? (
                      <span>Submitting Request...</span>
                    ) : (
                      <>
                        <ShieldCheck className="w-5 h-5" />
                        <span>Confirm Payment &amp; Submit</span>
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
                    Your subscription verification request for <span className="font-semibold text-cyan-300">{checkoutTarget.title}</span> has been received.
                  </p>
                </div>

                <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 text-left text-xs space-y-2 font-mono">
                  <div className="flex justify-between text-slate-400">
                    <span>Owner Name:</span>
                    <span className="text-slate-200 font-sans">{pendingResponse.submittedData?.subscriberName}</span>
                  </div>
                  <div className="flex justify-between text-slate-400">
                    <span>Plan:</span>
                    <span className="text-cyan-400 font-bold">{checkoutTarget.title}</span>
                  </div>
                  <div className="flex justify-between text-slate-400">
                    <span>UTR Reference:</span>
                    <span className="text-amber-400">{utrInput}</span>
                  </div>
                  <div className="flex justify-between text-slate-400">
                    <span>Amount:</span>
                    <span className="text-slate-200">₹{pendingResponse.submittedData?.amountPaid}</span>
                  </div>
                  <div className="flex justify-between text-slate-400">
                    <span>Status:</span>
                    <span className="text-amber-400 font-semibold">PENDING ADMIN APPROVAL</span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setShowCheckoutModal(false)}
                  className="w-full py-3 px-6 rounded-xl font-bold bg-slate-800 hover:bg-slate-700 text-white transition-colors"
                >
                  Return to Business Portal
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
