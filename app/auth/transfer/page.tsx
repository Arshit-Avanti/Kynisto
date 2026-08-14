"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { apiFetch } from "@/lib/client-api";
import { getSupabaseBrowserClient, syncSupabaseAccessCookie } from "@/lib/supabase-browser";
import { KynistoLogo } from "@/components/brand/KynistoLogo";

export default function AuthTransferPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [status, setStatus] = useState<"syncing" | "success" | "error">("syncing");
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    let mounted = true;

    async function syncAuthSession() {
      try {
        const accessToken = searchParams.get("access_token") || searchParams.get("token");
        const redirectTo = searchParams.get("redirect_to") || searchParams.get("returnTo") || "/";

        if (!accessToken) {
          // If no token in URL, check if already signed in
          const check = await apiFetch<{ user?: { id: string } }>("/api/auth/me").catch(() => null);
          if (check?.user) {
            if (mounted) {
              setStatus("success");
              setTimeout(() => router.replace(redirectTo), 400);
            }
            return;
          }
          throw new Error("No session token received.");
        }

        // 1. Sync Supabase client
        try {
          const supabase = await getSupabaseBrowserClient();
          const { data, error } = await supabase.auth.getUser(accessToken);
          if (!error && data?.user) {
            syncSupabaseAccessCookie({
              access_token: accessToken,
              refresh_token: "",
              user: data.user,
              token_type: "bearer",
              expires_in: 3600,
              expires_at: Math.floor(Date.now() / 1000) + 3600,
            });
          }
        } catch {
          // Continue to D1 session sync
        }

        // 2. Sync D1 Session Cookie
        const sessionRes = await apiFetch<{ ok?: boolean; redirectTo?: string }>("/api/auth/google/session", {
          method: "POST",
          json: { accessToken },
        });

        if (mounted) {
          setStatus("success");
          setTimeout(() => {
            router.replace(sessionRes.redirectTo || redirectTo || "/");
          }, 300);
        }
      } catch (err) {
        if (mounted) {
          setStatus("error");
          setErrorMessage(err instanceof Error ? err.message : "Failed to sync app session.");
        }
      }
    }

    void syncAuthSession();

    return () => {
      mounted = false;
    };
  }, [router, searchParams]);

  return (
    <div style={{
      minHeight: "100vh",
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      background: "#0B0F17",
      color: "#ffffff",
      padding: "24px",
      fontFamily: "system-ui, -apple-system, sans-serif",
      textAlign: "center"
    }}>
      <div style={{ marginBottom: "24px" }}>
        <KynistoLogo />
      </div>

      <div style={{
        background: "rgba(15, 23, 42, 0.8)",
        border: "1px solid rgba(255, 255, 255, 0.1)",
        borderRadius: "24px",
        padding: "36px 32px",
        maxWidth: "420px",
        width: "100%",
        boxShadow: "0 20px 40px rgba(0, 0, 0, 0.5)"
      }}>
        {status === "syncing" && (
          <>
            <div style={{
              width: "48px",
              height: "48px",
              border: "3px solid rgba(255, 87, 34, 0.2)",
              borderTopColor: "#FF5722",
              borderRadius: "50%",
              margin: "0 auto 20px",
              animation: "spin 0.8s linear infinite"
            }} />
            <h3 style={{ fontSize: "1.25rem", fontWeight: 700, margin: "0 0 8px 0" }}>Syncing App Login...</h3>
            <p style={{ color: "#94a3b8", fontSize: "0.9rem", margin: 0 }}>
              Connecting your Google account securely to the Kynisto App.
            </p>
          </>
        )}

        {status === "success" && (
          <>
            <div style={{ fontSize: "40px", marginBottom: "16px" }}>🚀</div>
            <h3 style={{ fontSize: "1.25rem", fontWeight: 700, margin: "0 0 8px 0", color: "#10b981" }}>Logged In Successfully!</h3>
            <p style={{ color: "#94a3b8", fontSize: "0.9rem", margin: 0 }}>
              Redirecting you into the app...
            </p>
          </>
        )}

        {status === "error" && (
          <>
            <div style={{ fontSize: "40px", marginBottom: "16px" }}>⚠️</div>
            <h3 style={{ fontSize: "1.25rem", fontWeight: 700, margin: "0 0 8px 0", color: "#f87171" }}>Session Sync Notice</h3>
            <p style={{ color: "#94a3b8", fontSize: "0.9rem", margin: "0 0 20px 0" }}>
              {errorMessage || "Unable to sync session automatically."}
            </p>
            <button
              type="button"
              onClick={() => router.replace("/login")}
              style={{
                background: "#FF5722",
                color: "#ffffff",
                border: "none",
                borderRadius: "12px",
                padding: "12px 24px",
                fontWeight: 700,
                cursor: "pointer"
              }}
            >
              Go to Sign In
            </button>
          </>
        )}
      </div>

      <style jsx global>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
