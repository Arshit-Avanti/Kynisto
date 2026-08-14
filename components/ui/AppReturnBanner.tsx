"use client";

import { useEffect, useState } from "react";
import { apiFetch } from "@/lib/client-api";

export function AppReturnBanner() {
  const [showBanner, setShowBanner] = useState(false);
  const [appLink, setAppLink] = useState("");
  const [userName, setUserName] = useState<string | null>(null);
  const [hasToken, setHasToken] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;

    // Ignore search engine and AdSense bots
    const isBot = /bot|googlebot|crawler|spider|robot|crawling|mediapartners|adsbot|lighthouse/i.test(navigator.userAgent);
    if (isBot) return;

    // Check if running on Android device
    const isAndroid = /Android/i.test(navigator.userAgent);
    
    // Only show if in external browser like Chrome, not inside the APK WebView itself
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
          setHasToken(true);
        }
      } catch {}

      try {
        const auth = await apiFetch<{ user?: { id: string; name?: string } }>("/api/auth/me").catch(() => null);
        if (auth?.user?.name) {
          setUserName(auth.user.name);
          setHasToken(true);
        }
      } catch {}

      // Target path in APK
      const pathname = window.location.pathname.replace(/^\/+/, "");
      let targetPath = pathname;
      let targetSearch = window.location.search;

      if (accessToken) {
        targetPath = "auth/transfer";
        const params = new URLSearchParams(targetSearch);
        params.set("access_token", accessToken);
        params.set("redirect_to", `/${pathname}`);
        targetSearch = `?${params.toString()}`;
      }

      const deepScheme = `kynisto://${targetPath}${targetSearch}${window.location.hash}`;
      setAppLink(deepScheme);
      setShowBanner(true);

      // Auto-launch trigger if user just completed Google OAuth sign in
      const justSignedIn = window.sessionStorage.getItem("kynisto-just-signed-in");
      if (justSignedIn === "true" && accessToken) {
        window.sessionStorage.removeItem("kynisto-just-signed-in");
        setTimeout(() => {
          handleOpenApp(deepScheme, accessToken, pathname);
        }, 400);
      }
    })();
  }, []);

  function handleOpenApp(customScheme?: string, token?: string, target?: string) {
    const scheme = customScheme || appLink;
    if (!scheme) return;

    // 1. Attempt custom scheme
    window.location.href = scheme;
    
    // 2. Fallback: Android Intent scheme targeting installed TWA package
    setTimeout(() => {
      const redirectPath = target || window.location.pathname;
      const transferUrl = token ? `/auth/transfer?access_token=${encodeURIComponent(token)}&redirect_to=${encodeURIComponent(redirectPath)}` : redirectPath;
      const intentUrl = `intent://${window.location.host}${transferUrl}#Intent;scheme=https;package=dev.nxt_arshit.workers.kynisto.twa;end;`;
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
        backgroundColor: hasToken ? "#064e3b" : "#0f172a",
        color: "#ffffff",
        padding: "0.75rem 1rem",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        boxShadow: "0 4px 20px rgba(0,0,0,0.45)",
        borderBottom: `1px solid ${hasToken ? "#10b981" : "rgba(255,255,255,0.12)"}`,
        fontSize: "0.875rem",
        fontWeight: 500,
        animation: "slideDown 0.3s ease-out",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: "0.6rem" }}>
        <span style={{ fontSize: "1.3rem" }}>{hasToken ? "✅" : "📱"}</span>
        <span>
          <strong>{userName ? `Logged In as ${userName}!` : (hasToken ? "Google Sign-In Successful!" : "Kynisto App Installed?")}</strong>
          <span style={{ display: "block", fontSize: "0.75rem", opacity: 0.85 }}>
            {hasToken ? "Tap below to return to App with your logged-in account" : "Open in Kynisto App for 10x faster experience"}
          </span>
        </span>
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
        <button
          type="button"
          onClick={() => handleOpenApp()}
          style={{
            background: hasToken ? "linear-gradient(135deg, #10b981, #059669)" : "linear-gradient(135deg, #FF5722, #EA580C)",
            color: "#ffffff",
            border: "none",
            borderRadius: "8px",
            padding: "0.5rem 1rem",
            fontWeight: 700,
            fontSize: "0.85rem",
            cursor: "pointer",
            boxShadow: "0 2px 10px rgba(0,0,0,0.3)",
          }}
        >
          {hasToken ? "Open in App (Logged In) ➔" : "Open App ➔"}
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
