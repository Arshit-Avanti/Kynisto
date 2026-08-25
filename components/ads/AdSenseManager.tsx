"use client";

import { useEffect } from "react";
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

  const isRestricted = RESTRICTED_ROUTES.some(
    (prefix) => pathname === prefix || pathname?.startsWith(prefix + "/")
  );

  useEffect(() => {
    if (typeof window === "undefined" || isRestricted) return;

    const timer = setTimeout(() => {
      try {
        window.adsbygoogle = window.adsbygoogle || [];
        window.adsbygoogle.push({});
      } catch {
        // Gracefully ignore duplicate pushes
      }
    }, 200);

    return () => clearTimeout(timer);
  }, [pathname, isRestricted]);

  return null;
}
