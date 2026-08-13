"use client";

import { useEffect, useState } from "react";

export function AppReturnBanner() {
  const [showBanner, setShowBanner] = useState(false);
  const [appLink, setAppLink] = useState("");

  useEffect(() => {
    if (typeof window === "undefined") return;

    // Ignore search engine and AdSense bots
    const isBot = /bot|googlebot|crawler|spider|robot|crawling|mediapartners|adsbot|lighthouse/i.test(navigator.userAgent);
    if (isBot) return;

    // Check if running on Android device
    const isAndroid = /Android/i.test(navigator.userAgent);
    
    // If window.AndroidNotification is defined, we are ALREADY inside the APK WebView!
    // So only show this banner if we are in an EXTERNAL browser like Android Chrome.
    const isExternalBrowser = isAndroid && !(window as unknown as { AndroidNotification?: unknown }).AndroidNotification;

    if (!isExternalBrowser) return;

    void (async () => {
      let accessToken = "";
      try {
        const { getSupabaseBrowserClient } = await import("@/lib/supabase-browser");
        const supabase = await getSupabaseBrowserClient();
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.access_token) {
          accessToken = session.access_token;
        }
      } catch {}

      // Determine target route in APK
      const pathname = window.location.pathname.replace(/^\/+/, "");
      let targetSearch = window.location.search;
      if (accessToken) {
        const params = new URLSearchParams(targetSearch);
        params.set("access_token", accessToken);
        targetSearch = `?${params.toString()}`;
      }
      const hash = window.location.hash;

      // kynisto:// scheme handled by AndroidManifest.xml
      const deepScheme = `kynisto://${pathname}${targetSearch}${hash}`;
      setAppLink(deepScheme);
      setShowBanner(true);

      // Auto-launch trigger if user just completed Google OAuth sign in
      const justSignedIn = window.sessionStorage.getItem("kynisto-just-signed-in");
      if (justSignedIn === "true") {
        window.sessionStorage.removeItem("kynisto-just-signed-in");
        setTimeout(() => {
          window.location.href = deepScheme;
        }, 500);
      }
    })();
  }, []);

  function handleOpenApp() {
    if (!appLink) return;
    // Attempt custom scheme first
    window.location.href = appLink;
    
    // Fallback: Android Intent scheme
    setTimeout(() => {
      const pathname = window.location.pathname;
      const intentUrl = `intent://${window.location.host}${pathname}#Intent;scheme=kynisto;package=com.kynisto.app;end;`;
      window.location.href = intentUrl;
    }, 500);
  }

  if (!showBanner) return null;

  return (
    <div
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        zIndex: 99999,
        backgroundColor: "#0f172a",
        color: "#ffffff",
        padding: "0.65rem 1rem",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        boxShadow: "0 4px 20px rgba(0,0,0,0.35)",
        borderBottom: "1px solid rgba(255,255,255,0.12)",
        fontSize: "0.875rem",
        fontWeight: 500,
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: "0.6rem" }}>
        <span style={{ fontSize: "1.2rem" }}>📱</span>
        <span>
          <strong>Kynisto App Installed?</strong>
          <span style={{ display: "block", fontSize: "0.75rem", opacity: 0.8 }}>
            Return to app for full experience
          </span>
        </span>
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
        <button
          type="button"
          onClick={handleOpenApp}
          style={{
            background: "linear-gradient(135deg, #2563eb, #3b82f6)",
            color: "#ffffff",
            border: "none",
            borderRadius: "8px",
            padding: "0.45rem 0.9rem",
            fontWeight: 700,
            fontSize: "0.825rem",
            cursor: "pointer",
            boxShadow: "0 2px 8px rgba(37,99,235,0.4)",
          }}
        >
          Open App ➔
        </button>
        <button
          type="button"
          onClick={() => setShowBanner(false)}
          style={{
            background: "transparent",
            color: "#94a3b8",
            border: "none",
            fontSize: "1.1rem",
            cursor: "pointer",
            padding: "0.2rem 0.4rem",
          }}
          aria-label="Close banner"
        >
          ✕
        </button>
      </div>
    </div>
  );
}
