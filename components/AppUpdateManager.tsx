"use client";

import { useCallback, useEffect, useState } from "react";
import { APP_VERSION } from "@/lib/app-version";

export function AppUpdateManager() {
  const [available, setAvailable] = useState(false);
  const check = useCallback(async () => {
    if (!navigator.onLine) return;
    try {
      const response = await fetch(`/api/version?t=${Date.now()}`, { cache: "no-store", credentials: "same-origin" });
      if (!response.ok) return;
      const result = await response.json() as { version?: string };
      if (result.version && result.version !== APP_VERSION && sessionStorage.getItem(`kynisto-dismissed-${result.version}`) !== "1") {
        setAvailable(true);
      }
    } catch {
      // A transient network failure must never interrupt the active session.
    }
  }, []);

  useEffect(() => {
    if (!("serviceWorker" in navigator)) return;
    let interval = 0;
    navigator.serviceWorker.register("/sw.js", { scope: "/", updateViaCache: "none" }).then((registration) => {
      void registration.update();
      interval = window.setInterval(() => { void registration.update(); void check(); }, 10 * 60 * 1000);
    }).catch(() => {});
    const onFocus = () => void check();
    const onOnline = () => void check();
    window.addEventListener("focus", onFocus);
    window.addEventListener("online", onOnline);
    void check();
    return () => {
      if (interval) window.clearInterval(interval);
      window.removeEventListener("focus", onFocus);
      window.removeEventListener("online", onOnline);
    };
  }, [check]);

  async function refresh() {
    const registration = await navigator.serviceWorker.getRegistration("/");
    registration?.waiting?.postMessage({ type: "SKIP_WAITING" });
    registration?.active?.postMessage({ type: "CLEAR_OLD_CACHES" });
    window.setTimeout(() => window.location.reload(), 250);
  }

  if (!available) return null;
  return <aside className="appUpdatePrompt" role="status"><span><b>New version available</b><small>Your login will be preserved.</small></span><button type="button" onClick={() => void refresh()}>Refresh</button><button type="button" aria-label="Dismiss update" onClick={() => setAvailable(false)}>×</button></aside>;
}

