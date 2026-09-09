"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { KynistoLogo } from "@/components/brand/KynistoLogo";
import { Navbar3D } from "@/components/landing/Navbar3D";
import { CustomerPlanUI } from "@/components/subscription/CustomerPlanUI";
import { BusinessMarketplaceUI } from "@/components/subscription/BusinessMarketplaceUI";
import { StoreMembershipsBrowser } from "@/components/store/StoreMembershipsBrowser";
import { Crown, Building2, Store } from "lucide-react";

interface UserProfile {
  id?: string;
  name?: string;
  email?: string;
  role?: "customer" | "store_owner" | "admin";
  plan?: string;
}

function PricingContent({ user }: { user: UserProfile | null }) {
  const searchParams = useSearchParams();
  const roleParam = searchParams?.get("role");
  const tabParam = searchParams?.get("tab");

  const [subData, setSubData] = useState<{
    customerMembershipEnabled?: boolean;
    ownerMembershipEnabled?: boolean;
    isUnrestrictedByAdmin?: boolean;
  } | null>(null);

  useEffect(() => {
    fetch("/api/subscriptions/me")
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data) setSubData(data);
      })
      .catch(() => {});
  }, []);

  // Determine initial view based on query params or logged in user's role
  const isOwnerDefault =
    roleParam === "store_owner" ||
    roleParam === "business" ||
    tabParam === "business" ||
    user?.role === "store_owner" ||
    user?.role === "admin";

  const isStoreMembershipDefault =
    tabParam === "store_memberships" ||
    tabParam === "stores" ||
    tabParam === "memberships" ||
    roleParam === "membership";

  const [activeTab, setActiveTab] = useState<"customer" | "store_memberships" | "business">(
    isStoreMembershipDefault
      ? "store_memberships"
      : isOwnerDefault
      ? "business"
      : "customer"
  );

  useEffect(() => {
    if (tabParam === "store_memberships" || tabParam === "stores" || tabParam === "memberships" || roleParam === "membership") {
      setActiveTab("store_memberships");
    } else if (roleParam === "store_owner" || roleParam === "business" || tabParam === "business") {
      setActiveTab("business");
    } else if (roleParam === "customer" || tabParam === "customer") {
      setActiveTab("customer");
    } else if (user?.role === "store_owner" || user?.role === "admin") {
      setActiveTab("business");
    } else if (user?.role === "customer") {
      setActiveTab("customer");
    }
  }, [roleParam, tabParam, user?.role]);

  const isCustomerUnrestricted = subData?.customerMembershipEnabled === false;
  const isOwnerUnrestricted = subData?.ownerMembershipEnabled === false;

  return (
    <div className="w-full">
      {/* Top Role & Tier Selector Header */}
      <div className="flex justify-center mb-8 px-4">
        <div className="inline-flex items-center p-1.5 rounded-2xl bg-white border border-slate-200 shadow-md flex-wrap justify-center gap-1">
          <button
            type="button"
            onClick={() => setActiveTab("customer")}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold transition-all duration-200 cursor-pointer ${
              activeTab === "customer"
                ? "bg-gradient-to-r from-amber-500 to-orange-500 text-slate-950 shadow-md shadow-amber-500/20 font-black"
                : "text-slate-600 hover:text-slate-900 hover:bg-slate-50"
            }`}
          >
            <Crown className="w-4 h-4" />
            <span>Kynisto VIP (Customer)</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("store_memberships")}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold transition-all duration-200 cursor-pointer ${
              activeTab === "store_memberships"
                ? "bg-gradient-to-r from-emerald-500 to-teal-500 text-slate-950 shadow-md shadow-emerald-500/20 font-black"
                : "text-slate-600 hover:text-slate-900 hover:bg-slate-50"
            }`}
          >
            <Store className="w-4 h-4" />
            <span>Local Store Passes (Shop Owner)</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("business")}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold transition-all duration-200 cursor-pointer ${
              activeTab === "business"
                ? "bg-gradient-to-r from-cyan-500 to-blue-600 text-white shadow-md shadow-cyan-500/20 font-black"
                : "text-slate-600 hover:text-slate-900 hover:bg-slate-50"
            }`}
          >
            <Building2 className="w-4 h-4" />
            <span>Merchant Platform</span>
          </button>
        </div>
      </div>

      {/* Role-Specific View rendering */}
      {activeTab === "customer" ? (
        <CustomerPlanUI
          currentPlanId={user?.plan || "free"}
          userName={user?.name || ""}
          userEmail={user?.email || ""}
          isUnrestrictedByAdmin={isCustomerUnrestricted}
        />
      ) : activeTab === "store_memberships" ? (
        <StoreMembershipsBrowser
          userName={user?.name || ""}
          userEmail={user?.email || ""}
        />
      ) : (
        <BusinessMarketplaceUI
          currentPlanId={user?.plan || "free"}
          userName={user?.name || ""}
          userEmail={user?.email || ""}
          isUnrestrictedByAdmin={isOwnerUnrestricted}
        />
      )}
    </div>
  );
}

export default function PricingPage() {
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);

  useEffect(() => {
    fetch("/api/auth/me")
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data?.user) {
          setCurrentUser(data.user);
        }
      })
      .catch(() => {});
  }, []);

  return (
    <main className="site min-h-screen bg-slate-50 text-slate-900 transition-colors duration-200 overflow-x-clip">
      <Navbar3D />

      <div style={{ paddingTop: "100px" }}>
        <Suspense
          fallback={
            <div className="text-center py-20 font-medium text-slate-500">
              Loading Pricing &amp; Memberships...
            </div>
          }
        >
          <PricingContent user={currentUser} />
        </Suspense>
      </div>

      <footer className="mt-20 py-10 px-4 border-t border-slate-200 text-center bg-white">
        <a className="brand footerBrand inline-block mb-3" href="/">
          <KynistoLogo showTagline />
        </a>
        <p className="text-xs text-slate-500">
          Everything Around You, Smarter. · © 2026 Kynisto Subscriptions &amp; Store Memberships
        </p>
      </footer>
    </main>
  );
}
