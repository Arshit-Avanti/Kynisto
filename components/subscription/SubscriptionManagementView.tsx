"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Crown, Store, ArrowRight, ShieldCheck } from "lucide-react";
import { UserSubscriptionDashboard } from "@/components/subscription/UserSubscriptionDashboard";
import { StoreMembershipsBrowser } from "@/components/store/StoreMembershipsBrowser";
import type { SessionUser } from "@/lib/auth";

export function SubscriptionManagementView({ user }: { user: SessionUser }) {
  const [activeTab, setActiveTab] = useState<"kynisto" | "stores">("kynisto");

  return (
    <div className="w-full max-w-5xl mx-auto">
      {/* Header & Mode Switcher */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-50 border border-amber-200 text-amber-800 text-xs font-bold mb-2">
            <Crown className="w-3.5 h-3.5 text-amber-600" />
            <span>Kynisto VIP &amp; Memberships</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
            Subscription &amp; Store Passes
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Manage your active Kynisto plan, receipts, or browse local store VIP clubs.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Link
            href="/pricing"
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-white border border-slate-200 hover:border-slate-300 text-slate-700 font-bold text-xs shadow-xs hover:bg-slate-50 transition-all"
          >
            <span>All Plans &amp; Pricing</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>

      {/* Tabs Selector */}
      <div className="flex justify-center sm:justify-start mb-6">
        <div className="inline-flex items-center p-1.5 rounded-2xl bg-white border border-slate-200 shadow-sm gap-1.5">
          <button
            type="button"
            onClick={() => setActiveTab("kynisto")}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeTab === "kynisto"
                ? "bg-gradient-to-r from-amber-500 to-orange-500 text-slate-950 font-black shadow-md shadow-amber-500/20"
                : "text-slate-600 hover:text-slate-900 hover:bg-slate-50"
            }`}
          >
            <Crown className="w-4 h-4" />
            <span>Kynisto VIP Plan</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("stores")}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeTab === "stores"
                ? "bg-gradient-to-r from-emerald-500 to-teal-500 text-white font-black shadow-md shadow-emerald-500/20"
                : "text-slate-600 hover:text-slate-900 hover:bg-slate-50"
            }`}
          >
            <Store className="w-4 h-4" />
            <span>Local Store Passes (Shop Owner)</span>
          </button>
        </div>
      </div>

      {/* Tab Contents */}
      {activeTab === "kynisto" ? (
        <UserSubscriptionDashboard />
      ) : (
        <StoreMembershipsBrowser userName={user?.name || ""} userEmail={user?.email || ""} />
      )}
    </div>
  );
}
