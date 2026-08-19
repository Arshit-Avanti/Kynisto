"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";

declare global {
  interface Window {
    adsbygoogle?: Array<Record<string, unknown>>;
  }
}

export function AdSenseManager() {
  const pathname = usePathname();
  const isFirstMountRef = useRef(true);

  useEffect(() => {
    // Avoid running on server
    if (typeof window === "undefined") return;

    if (isFirstMountRef.current) {
      isFirstMountRef.current = false;
      return;
    }

    // On subsequent SPA route transitions, request an AdSense push safely
    try {
      if (window.adsbygoogle) {
        window.adsbygoogle.push({});
      }
    } catch {
      // Ignore push errors when no new ad slots are mounted
    }
  }, [pathname]);

  return null;
}
