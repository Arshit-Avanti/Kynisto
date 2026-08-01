"use client";

import { useEffect, useState } from "react";
import { KynistoSplash } from "@/components/ui/KynistoSplash";

/**
 * ClientSplashWrapper — Renders the animated Kynisto splash screen
 * on first page load. Must be placed in layout.tsx to ensure it renders
 * before any page content mounts.
 */
export function ClientSplashWrapper() {
  const [showSplash, setShowSplash] = useState(true);
  const [hasMounted, setHasMounted] = useState(false);

  useEffect(() => {
    setHasMounted(true);

    // Check if splash was already shown in this session
    const alreadyShown = sessionStorage.getItem("kynisto_splash_shown");
    if (alreadyShown) {
      setShowSplash(false);
    }
  }, []);

  const handleComplete = () => {
    setShowSplash(false);
    sessionStorage.setItem("kynisto_splash_shown", "1");
  };

  // Don't render on server or if already shown this session
  if (!hasMounted || !showSplash) return null;

  return <KynistoSplash onComplete={handleComplete} />;
}
