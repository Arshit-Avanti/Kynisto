"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { getSupabaseBrowserClient } from "@/lib/supabase-browser";
import { apiFetch } from "@/lib/client-api";

const PENDING_KEY = "kynisto-google-auth-pending";

export function GoogleSignIn() {
  const router = useRouter();
  const starting = useRef(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function continueWithGoogle() {
    if (starting.current) return;
    starting.current = true;
    setBusy(true);
    setError("");
    try {
      const supabase = await getSupabaseBrowserClient();
      const redirectTo =
        typeof window !== "undefined"
          ? window.location.origin
          : "https://kynisto.nxt-arshit.workers.dev";
      console.log("login started, redirect URL:", redirectTo);
      try {
        window.sessionStorage.setItem(PENDING_KEY, "1");
      } catch {
        // Ignore storage error
      }

      const { error: oauthError } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo,
          skipBrowserRedirect: false,
        },
      });
      if (oauthError) throw oauthError;
    } catch (oauthError) {
      try {
        window.sessionStorage.removeItem(PENDING_KEY);
      } catch {
        // Ignore storage error
      }
      console.error("Google sign-in failed:", oauthError);
      starting.current = false;
      setBusy(false);
      setError(
        oauthError instanceof Error
          ? `OAuth redirect failed: ${oauthError.message}`
          : "OAuth redirect failed",
      );
    }
  }

  async function quickLogin(email: string, role: "customer" | "store_owner") {
    if (busy) return;
    setBusy(true);
    setError("");
    try {
      const res = await apiFetch<{ redirectTo: string }>("/api/auth/login", {
        method: "POST",
        json: {
          email,
          expectedRole: role,
        },
      });
      router.push(res.redirectTo);
      router.refresh();
    } catch (err) {
      setBusy(false);
      setError(err instanceof Error ? err.message : "Quick login failed");
    }
  }

  return (
    <section className="googleAuth" aria-labelledby="google-auth-title">
      <div className="googleAuthIntro">
        <span className="authKicker">Customers &amp; Shop Owners</span>
        <h2 id="google-auth-title">Welcome to Kynisto</h2>
        <p>Sign in securely with Google or select your workspace.</p>
      </div>
      {error && (
        <p className="authError" role="alert">
          {error}
        </p>
      )}
      <button
        className="googleSignInButton"
        type="button"
        disabled={busy}
        onClick={() => void continueWithGoogle()}
      >
        <img src="/google-g.svg" alt="" width="22" height="22" />
        <span>{busy ? "Connecting securely…" : "Continue with Google"}</span>
        {busy && <i className="googleButtonSpinner" aria-hidden="true" />}
      </button>

      <div style={{ marginTop: "1rem", display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
        <button
          type="button"
          disabled={busy}
          onClick={() => void quickLogin("nxt.arshit@gmail.com", "customer")}
          style={{
            flex: "1 1 140px",
            padding: "0.6rem 0.8rem",
            fontSize: "0.85rem",
            borderRadius: "8px",
            border: "1px solid rgba(0,0,0,0.15)",
            background: "#f8fafc",
            color: "#0f172a",
            fontWeight: 600,
            cursor: "pointer",
          }}
        >
          Sign in as Customer
        </button>
        <button
          type="button"
          disabled={busy}
          onClick={() => void quickLogin("sunriseschool081@gmail.com", "store_owner")}
          style={{
            flex: "1 1 140px",
            padding: "0.6rem 0.8rem",
            fontSize: "0.85rem",
            borderRadius: "8px",
            border: "1px solid rgba(0,0,0,0.15)",
            background: "#f8fafc",
            color: "#0f172a",
            fontWeight: 600,
            cursor: "pointer",
          }}
        >
          Sign in as Shop Owner
        </button>
      </div>

      <small className="googleSecurityNote" style={{ marginTop: "0.8rem", display: "block" }}>
        Google verifies your identity. Kynisto securely determines your saved role and permissions.
      </small>
    </section>
  );
}
