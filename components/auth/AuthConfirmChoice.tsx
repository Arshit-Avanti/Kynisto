"use client";

import { useEffect, useRef, useState } from "react";
import { apiFetch, invalidateClientCache } from "@/lib/client-api";
import { syncSupabaseAccessCookie } from "@/lib/supabase-browser";

interface AuthConfirmChoiceProps {
  hash?: string;
  accessToken?: string | null;
}

export default function AuthConfirmChoice({ hash: propHash, accessToken: propToken }: AuthConfirmChoiceProps) {
  const [statusText, setStatusText] = useState("Authenticating session with Kynisto…");
  const [error, setError] = useState("");
  const [isReturningToApp, setIsReturningToApp] = useState(false);
  const [appReturnUrl, setAppReturnUrl] = useState("");
  const executed = useRef(false);

  useEffect(() => {
    if (executed.current) return;
    executed.current = true;

    void (async () => {
      try {
        let token = propToken || null;
        let currentHash = propHash || "";

        let isFromApp = false;
        if (typeof window !== "undefined") {
          const urlParams = new URLSearchParams(window.location.search);
          const fromAppQuery = urlParams.get("from_app") === "1" || urlParams.get("app") === "1" || urlParams.get("source") === "app";
          const fromAppSession = window.sessionStorage.getItem("kynisto_from_app") === "1";
          isFromApp = fromAppQuery || fromAppSession;

          if (!currentHash) {
            currentHash = window.location.hash || window.location.search || "";
          }
          if (!token && currentHash) {
            const raw = currentHash.replace(/^#/, "").replace(/^\?/, "");
            const params = new URLSearchParams(raw);
            token = params.get("access_token") || params.get("code");
          }
        }

        function resolveFinalDestination(targetPath: string) {
          const isWorkersDev =
            typeof window !== "undefined" && window.location.hostname.endsWith("workers.dev");
          const safePath = targetPath.startsWith("/") ? targetPath : `/${targetPath}`;
          if (isWorkersDev) {
            return `https://kynisto.in${safePath}`;
          }
          return safePath;
        }

        if (token) {
          syncSupabaseAccessCookie({
            access_token: token,
            refresh_token: "",
            user: { id: "" } as any,
            token_type: "bearer",
            expires_in: 3600,
            expires_at: Math.floor(Date.now() / 1000) + 3600,
          });
          invalidateClientCache();

          setStatusText(isFromApp ? "Authentication successful! Returning to Kynisto App…" : "Authenticating your Google session…");
          const res = await apiFetch<{
            user: { role: string } | null;
            needsOnboarding?: boolean;
            redirectTo?: string;
          }>("/api/auth/google/session", {
            method: "POST",
            json: { access_token: token },
          });

          const target = res?.redirectTo || (res?.needsOnboarding ? "/onboarding" : "/");

          if (isFromApp) {
            const safeTarget = target.startsWith("/") ? target : `/${target}`;
            const deepLinkUrl = `kynisto://auth/transfer?access_token=${encodeURIComponent(token)}&redirect_to=${encodeURIComponent(safeTarget)}`;
            const intentFallbackUrl = `intent://kynisto.in/auth/transfer?access_token=${encodeURIComponent(token)}&redirect_to=${encodeURIComponent(safeTarget)}#Intent;scheme=https;package=com.kynisto.app;end;`;

            setAppReturnUrl(deepLinkUrl);
            setIsReturningToApp(true);
            setStatusText("Returning to Kynisto App…");

            // 1. Direct custom scheme trigger
            window.location.href = deepLinkUrl;

            // 2. Fallback to Android Intent
            setTimeout(() => {
              window.location.href = intentFallbackUrl;
            }, 600);
            return;
          }

          window.location.replace(resolveFinalDestination(target));
          return;
        }

        // Fallback: If no token in URL, check if server D1 session cookie is already active
        try {
          const meRes = await apiFetch<{ user: { role: string } | null }>("/api/auth/me");
          if (meRes?.user) {
            const role = meRes.user.role;
            const target = role === "store_owner" || role === "shop_owner" ? "/owner" : role === "admin" ? "/admin" : "/";
            
            if (isFromApp) {
              const deepLinkUrl = `kynisto://${target.replace(/^\/+/, "")}`;
              setAppReturnUrl(deepLinkUrl);
              setIsReturningToApp(true);
              setStatusText("Returning to Kynisto App…");
              window.location.href = deepLinkUrl;
              return;
            }

            window.location.replace(resolveFinalDestination(target));
            return;
          }
        } catch {
          // Unauthenticated
        }

        // If genuinely unauthenticated, redirect to onboarding/login
        window.location.replace(resolveFinalDestination("/onboarding"));
      } catch (err) {
        console.error("Auth confirm error:", err);
        setError("Authentication failed. Redirecting…");
        setTimeout(() => {
          window.location.replace("https://kynisto.in/onboarding");
        }, 1200);
      }
    })();
  }, [propToken, propHash]);

  return (
    <div className="authCard" style={{ textAlign: "center", padding: "3rem 1.5rem" }}>
      <div className="googleButtonSpinner" style={{ margin: "0 auto 1.5rem auto", width: "36px", height: "36px" }} />
      <h2 style={{ fontSize: "1.5rem", fontWeight: 700, color: "var(--text-primary, #0f172a)" }}>
        {statusText}
      </h2>
      <p style={{ color: "var(--text-secondary, #64748b)", fontSize: "0.95rem", marginTop: "0.5rem" }}>
        {isReturningToApp
          ? "Your sign-in is complete. Redirecting you back into the mobile app now."
          : "Please wait a moment while we set up your workspace."}
      </p>

      {isReturningToApp && (
        <div style={{ marginTop: "1.75rem" }}>
          <a
            href={appReturnUrl}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "0.5rem",
              padding: "0.75rem 1.75rem",
              borderRadius: "9999px",
              background: "linear-gradient(135deg, #f97316, #ea580c)",
              color: "#ffffff",
              fontWeight: 800,
              fontSize: "0.95rem",
              textDecoration: "none",
              boxShadow: "0 4px 14px rgba(249, 115, 22, 0.4)",
            }}
          >
            <span>Open in Kynisto App</span>
            <span>↗</span>
          </a>
        </div>
      )}

      {error && (
        <p className="authError" style={{ marginTop: "1rem" }} role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
