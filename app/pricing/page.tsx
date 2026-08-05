"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { KynistoLogo } from "@/components/brand/KynistoLogo";
import { Navbar3D } from "@/components/ui/Navbar3D";
import { PricingSection } from "@/components/subscription/PricingSection";

function PricingContent() {
  const searchParams = useSearchParams();
  const roleParam = searchParams?.get("role");
  const userRole = roleParam === "store_owner" ? "store_owner" : "customer";

  return <PricingSection userRole={userRole} />;
}

export default function PricingPage() {
  const [currentUserRole, setCurrentUserRole] = useState<"admin" | "store_owner" | "customer" | null>(null);

  useEffect(() => {
    fetch("/api/auth/me")
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data?.user?.role) {
          setCurrentUserRole(data.user.role);
        }
      })
      .catch(() => {});
  }, []);

  return (
    <main className="site mode-dark theme-royal">
      <Navbar3D
        userRole={currentUserRole}
        savedCount={0}
        locationLabel="Your Locality"
        onUseLocation={() => {}}
        onOpenCustomize={() => {}}
      />

      <div style={{ paddingTop: "100px" }}>
        <Suspense fallback={<div style={{ textAlign: "center", padding: "60px", color: "white" }}>Loading Pricing &amp; Plans...</div>}>
          <PricingContent />
        </Suspense>
      </div>

      <footer style={{ marginTop: "60px", padding: "40px 20px", borderTop: "1px solid rgba(255,255,255,0.1)", textAlign: "center" }}>
        <a className="brand footerBrand" href="/"><KynistoLogo showTagline /></a>
        <p style={{ marginTop: "12px", color: "var(--muted, #94A3B8)", fontSize: "14px" }}>
          Everything Around You, Smarter. · © 2026 Kynisto Subscriptions
        </p>
      </footer>
    </main>
  );
}

