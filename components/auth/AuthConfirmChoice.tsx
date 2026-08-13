"use client";

import { useEffect, useRef, useState } from "react";
import { apiFetch } from "@/lib/client-api";

interface AuthConfirmChoiceProps {
  hash?: string;
  accessToken?: string | null;
}

export default function AuthConfirmChoice({ hash: propHash, accessToken: propToken }: AuthConfirmChoiceProps) {
  const [statusText, setStatusText] = useState("Authenticating session with Kynisto…");
  const [error, setError] = useState("");
  const executed = useRef(false);

  useEffect(() => {
    if (executed.current) return;
    executed.current = true;

    void (async () => {
      try {
        let token = propToken || null;
        let currentHash = propHash || "";

        if (typeof window !== "undefined") {
          if (!currentHash) {
            currentHash = window.location.hash || window.location.search || "";
          }
          if (!token && currentHash) {
            const raw = currentHash.replace(/^#/, "").replace(/^\?/, "");
            const params = new URLSearchParams(raw);
            token = params.get("access_token") || params.get("code");
          }
        }

        if (token) {
          setStatusText("Authenticating your Google session…");
          const res = await apiFetch<{
            user: { role: string } | null;
            needsOnboarding?: boolean;
            redirectTo?: string;
          }>("/api/auth/google/session", {
            method: "POST",
            json: { access_token: token },
          });

          const target = res?.redirectTo || (res?.needsOnboarding ? "/onboarding" : "/");
          window.location.replace(target);
          return;
        }

        // Fallback: If no token in URL, check if server D1 session cookie is already active
        try {
          const meRes = await apiFetch<{ user: { role: string } | null }>("/api/auth/me");
          if (meRes?.user) {
            const role = meRes.user.role;
            const target = role === "store_owner" || role === "shop_owner" ? "/owner" : role === "admin" ? "/admin" : "/";
            window.location.replace(target);
            return;
          }
        } catch {
          // Unauthenticated
        }

        // If genuinely unauthenticated, redirect to onboarding/login
        window.location.replace("/onboarding");
      } catch (err) {
        console.error("Auth confirm error:", err);
        setError("Authentication failed. Redirecting…");
        setTimeout(() => {
          window.location.replace("/onboarding");
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
        Please wait a moment while we set up your workspace.
      </p>
      {error && (
        <p className="authError" style={{ marginTop: "1rem" }} role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
