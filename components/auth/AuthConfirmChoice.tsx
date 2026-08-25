"use client";

import { useEffect, useRef, useState } from "react";
import { apiFetch } from "@/lib/client-api";
import { getSupabaseBrowserClient, syncSupabaseAccessCookie } from "@/lib/supabase-browser";

interface AuthConfirmChoiceProps {
  hash?: string;
  accessToken?: string | null;
}

export default function AuthConfirmChoice({ hash: propHash, accessToken: propToken }: AuthConfirmChoiceProps) {
  const [statusText, setStatusText] = useState("Authenticating your Google session…");
  const [error, setError] = useState("");
  const executed = useRef(false);

  useEffect(() => {
    if (executed.current) return;
    executed.current = true;

    void (async () => {
      try {
        function resolveFinalDestination(targetPath: string) {
          const isWorkersDev =
            typeof window !== "undefined" && window.location.hostname.endsWith("workers.dev");
          const safePath = targetPath.startsWith("/") ? targetPath : `/${targetPath}`;
          if (isWorkersDev) {
            return `https://kynisto.in${safePath}`;
          }
          return safePath;
        }

        const supabase = await getSupabaseBrowserClient();

        let token: string | null = propToken || null;
        const currentHref = typeof window !== "undefined" ? window.location.href : "";
        const currentHash = typeof window !== "undefined" ? window.location.hash || propHash || "" : "";
        const currentSearch = typeof window !== "undefined" ? window.location.search : "";

        // 1. Direct access_token in URL hash or search
        if (!token && (currentHash.includes("access_token") || currentSearch.includes("access_token"))) {
          const raw = currentHash ? currentHash.replace(/^#/, "") : currentSearch.replace(/^\?/, "");
          const params = new URLSearchParams(raw);
          token = params.get("access_token");
        }

        // 2. PKCE code exchange if ?code= is in URL
        if (!token && currentSearch.includes("code=")) {
          try {
            const { data } = await supabase.auth.exchangeCodeForSession(currentHref);
            if (data?.session?.access_token) {
              token = data.session.access_token;
              syncSupabaseAccessCookie(data.session);
            }
          } catch (codeErr) {
            console.warn("exchangeCodeForSession warning:", codeErr);
          }
        }

        // 3. Supabase existing or parsed session
        if (!token) {
          const { data: { session } } = await supabase.auth.getSession();
          if (session?.access_token) {
            token = session.access_token;
            syncSupabaseAccessCookie(session);
          }
        }

        // 4. Wait for onAuthStateChange if session is still processing
        if (!token) {
          token = await new Promise<string | null>((resolve) => {
            const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
              if (session?.access_token) {
                syncSupabaseAccessCookie(session);
                subscription.unsubscribe();
                resolve(session.access_token);
              }
            });

            setTimeout(() => {
              subscription.unsubscribe();
              resolve(null);
            }, 3500);
          });
        }

        // 5. If we have the access token, create official server D1 session
        if (token) {
          setStatusText("Setting up your workspace…");
          const res = await apiFetch<{
            user: { role: string } | null;
            needsOnboarding?: boolean;
            redirectTo?: string;
          }>("/api/auth/google/session", {
            method: "POST",
            json: { accessToken: token },
          });

          // Clean URL hash/search
          if (typeof window !== "undefined" && window.history?.replaceState) {
            const clean = new URL(window.location.href);
            clean.search = "";
            clean.hash = "";
            window.history.replaceState({}, "", clean.toString());
          }

          const target = res?.redirectTo || (res?.needsOnboarding ? "/onboarding" : "/");
          window.location.replace(resolveFinalDestination(target));
          return;
        }

        // 6. Fallback: check if server D1 session is already authenticated
        try {
          const meRes = await apiFetch<{ user: { role: string } | null }>("/api/auth/me");
          if (meRes?.user) {
            const role = meRes.user.role;
            const target = role === "store_owner" || role === "shop_owner" ? "/owner" : role === "admin" ? "/admin" : "/";
            window.location.replace(resolveFinalDestination(target));
            return;
          }
        } catch {
          // Fall through
        }

        // 7. If genuinely unable to authenticate, redirect to login
        window.location.replace(resolveFinalDestination("/login"));
      } catch (err) {
        console.error("Auth confirm error:", err);
        setError("Authentication session expired. Redirecting to login…");
        setTimeout(() => {
          window.location.replace("https://kynisto.in/login");
        }, 1500);
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
        Please wait a moment while we sign you in securely.
      </p>
      {error && (
        <p className="authError" style={{ marginTop: "1rem" }} role="alert">
          {error}
        </p>
      )}
    </div>
  );
}

