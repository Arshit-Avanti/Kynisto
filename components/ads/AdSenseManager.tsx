"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";

declare global {
  interface Window {
    adsbygoogle?: Array<Record<string, unknown>>;
  }
}

// Routes strictly prohibited by Google AdSense policy (login, auth, dashboards, error screens)
const RESTRICTED_ROUTES = [
  "/login",
  "/register",
  "/auth",
  "/onboarding",
  "/access-denied",
  "/forgot-password",
  "/reset-password",
  "/change-password",
  "/admin",
  "/owner",
  "/account",
];

export function AdSenseManager() {
  const pathname = usePathname();
  const isFirstMountRef = useRef(true);

  const isRestricted = RESTRICTED_ROUTES.some(
    (prefix) => pathname === prefix || pathname?.startsWith(prefix + "/")
  );

  useEffect(() => {
    if (typeof window === "undefined") return;

    // Never execute or push ads on restricted / behavioral / auth routes
    if (isRestricted) return;

    if (isFirstMountRef.current) {
      isFirstMountRef.current = false;
      return;
    }

    // On subsequent SPA route transitions on valid publisher content pages, trigger safe refresh
    try {
      if (window.adsbygoogle) {
        window.adsbygoogle.push({});
      }
    } catch {
      // Gracefully ignore when no ad slots are present
    }
  }, [pathname, isRestricted]);

  return null;
}
