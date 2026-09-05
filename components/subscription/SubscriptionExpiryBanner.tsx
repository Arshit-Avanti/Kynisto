"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { AlertTriangle, ArrowRight } from "lucide-react";

import { apiFetch } from "@/lib/client-api";

interface SubscriptionExpiryBannerProps {
  userId?: string | null;
  daysRemaining?: number;
  isExpiringSoon?: boolean;
}

export function SubscriptionExpiryBanner({
  userId,
  daysRemaining: initialDaysRemaining,
  isExpiringSoon: initialIsExpiringSoon,
}: SubscriptionExpiryBannerProps) {
  const [shouldShow, setShouldShow] = useState<boolean>(
    initialIsExpiringSoon ?? false
  );
  const [daysCount, setDaysCount] = useState<number | undefined>(
    initialDaysRemaining
  );
  const [loaded, setLoaded] = useState<boolean>(
    initialIsExpiringSoon !== undefined
  );

  useEffect(() => {
    // Only check subscriptions if the user is authenticated or initial values were passed
    if (!userId && initialIsExpiringSoon === undefined) {
      setLoaded(true);
      return;
    }

    let isMounted = true;

    async function checkSubscription() {
      try {
        const data = await apiFetch<{ subscription?: { expiresAt?: number; status?: string; isExpired?: boolean; isExpiringSoon?: boolean; daysRemaining?: number } }>("/api/subscriptions/me");
        const sub = data?.subscription;
        if (!sub) return;

        const now = Math.floor(Date.now() / 1000);
        const expiresAt = sub.expiresAt;
        const status = sub.status;
        const isExpired = sub.isExpired || (expiresAt ? expiresAt <= now : false);

        if (status === "active" && !isExpired && expiresAt) {
          const diff = expiresAt - now;
          const daysRemaining = diff > 0 ? Math.floor(diff / 86400) : 0;
          const expiringSoon = daysRemaining >= 0 && daysRemaining <= 3;

          if (isMounted) {
            setDaysCount(daysRemaining);
            setShouldShow(expiringSoon);
          }
        } else if (sub.isExpiringSoon !== undefined && isMounted) {
          setShouldShow(Boolean(sub.isExpiringSoon));
          setDaysCount(sub.daysRemaining);
        }
      } catch (err) {
        // silent catch
      } finally {
        if (isMounted) setLoaded(true);
      }
    }

    checkSubscription();
    return () => {
      isMounted = false;
    };
  }, [userId, initialIsExpiringSoon]);

  if (!loaded || !shouldShow) {
    return null;
  }

  return (
    <div
      style={{
        position: "sticky",
        top: 0,
        zIndex: 9999,
        width: "100%",
        background: "linear-gradient(135deg, #b45309 0%, #d97706 50%, #9a3412 100%)",
        color: "#ffffff",
        padding: "12px 20px",
        boxShadow: "0 4px 20px rgba(217, 119, 6, 0.4)",
        borderBottom: "1px solid rgba(255, 255, 255, 0.2)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        gap: "16px",
        flexWrap: "wrap",
        fontSize: "14px",
        fontWeight: 600,
        backdropFilter: "blur(8px)",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
        <AlertTriangle size={20} style={{ color: "#fef08a", flexShrink: 0 }} />
        <span>
          Your subscription is ending, so renew now because it takes some time
          {daysCount !== undefined ? ` (${daysCount} ${daysCount === 1 ? "day" : "days"} remaining)` : ""}
        </span>
      </div>
      <Link
        href="/dashboard/subscription"
        style={{
          background: "#ffffff",
          color: "#9a3412",
          padding: "6px 16px",
          borderRadius: "8px",
          fontWeight: 700,
          fontSize: "13px",
          textDecoration: "none",
          display: "inline-flex",
          alignItems: "center",
          gap: "6px",
          boxShadow: "0 2px 8px rgba(0, 0, 0, 0.15)",
          transition: "all 0.2s ease",
          flexShrink: 0,
        }}
      >
        Renew Now <ArrowRight size={14} />
      </Link>
    </div>
  );
}
