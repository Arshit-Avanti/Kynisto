"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { KynistoLogo } from "@/components/brand/KynistoLogo";
import { Navbar3D } from "@/components/ui/Navbar3D";
import { CustomerPlanUI } from "@/components/subscription/CustomerPlanUI";
import { BusinessMarketplaceUI } from "@/components/subscription/BusinessMarketplaceUI";
import { Crown, Building2 } from "lucide-react";

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

  // Determine initial view based on query params or logged in user's role
  const isOwnerDefault =
    roleParam === "store_owner" ||
    roleParam === "business" ||
    tabParam === "business" ||
    user?.role === "store_owner" ||
    user?.role === "admin";

  const [activeTab, setActiveTab] = useState<"customer" | "business">(
    isOwnerDefault ? "business" : "customer"
  );

  useEffect(() => {
    if (roleParam === "store_owner" || roleParam === "business" || tabParam === "business") {
      setActiveTab("business");
    } else if (roleParam === "customer" || tabParam === "customer") {
      setActiveTab("customer");
    } else if (user?.role === "store_owner" || user?.role === "admin") {
      setActiveTab("business");
    } else if (user?.role === "customer") {
      setActiveTab("customer");
    }
  }, [roleParam, tabParam, user?.role]);

  return (
    <div className="w-full">
      {/* Top Role Selector Header */}
      <div className="flex justify-center mb-8 px-4">
        <div className="inline-flex items-center p-1.5 rounded-2xl bg-slate-900/90 border border-slate-800 backdrop-blur-xl shadow-xl">
          <button
            type="button"
            onClick={() => setActiveTab("customer")}
            className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-xs font-bold transition-all duration-200 cursor-pointer ${
              activeTab === "customer"
                ? "bg-gradient-to-r from-amber-500 to-orange-500 text-slate-950 shadow-lg shadow-amber-500/20"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            <Crown className="w-4 h-4" />
            <span>For Customers</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("business")}
            className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-xs font-bold transition-all duration-200 cursor-pointer ${
              activeTab === "business"
                ? "bg-gradient-to-r from-cyan-500 to-blue-600 text-slate-950 shadow-lg shadow-cyan-500/20"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            <Building2 className="w-4 h-4" />
            <span>For Business Owners</span>
          </button>
        </div>
      </div>

      {/* Role-Specific View rendering */}
      {activeTab === "customer" ? (
        <CustomerPlanUI
          currentPlanId={user?.plan || "free"}
          userName={user?.name || ""}
          userEmail={user?.email || ""}
        />
      ) : (
        <BusinessMarketplaceUI
          currentPlanId={user?.plan || "free"}
          userName={user?.name || ""}
          userEmail={user?.email || ""}
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
    <main className="site mode-dark theme-royal bg-slate-950 min-h-screen text-slate-100">
      <Navbar3D userRole={currentUser?.role || null} savedCount={0} mode="pricing" />

      <div style={{ paddingTop: "100px" }}>
        <Suspense
          fallback={
            <div className="text-center py-20 color-white font-medium text-slate-400">
              Loading Pricing &amp; Business Marketplace...
            </div>
          }
        >
          <PricingContent user={currentUser} />
        </Suspense>
      </div>

      <footer className="mt-20 py-10 px-4 border-t border-slate-800/80 text-center">
        <a className="brand footerBrand inline-block mb-3" href="/">
          <KynistoLogo showTagline />
        </a>
        <p className="text-xs text-slate-400">
          Everything Around You, Smarter. · © 2026 Kynisto Subscriptions
        </p>
      </footer>
    </main>
  );
}
