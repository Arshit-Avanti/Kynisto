"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { getSupabaseBrowserClient } from "@/lib/supabase-browser";
import { apiFetch } from "@/lib/client-api";

import { useSearchParams } from "next/navigation";

const PENDING_KEY = "kynisto-google-auth-pending";
const RETURNTO_KEY = "kynisto_auth_returnto";

export function GoogleSignIn({ returnTo: _propReturnTo }: { returnTo?: string } = {}) {
  const searchParams = useSearchParams();
  const returnTo = "/";
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
          ? `${window.location.origin}/auth/confirm`
          : "https://kynisto.nxt-arshit.workers.dev/auth/confirm";
      try {
        window.sessionStorage.setItem(PENDING_KEY, "1");
        window.sessionStorage.setItem(RETURNTO_KEY, "/");
      } catch {
        // Ignore storage restriction errors
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
        // Ignore storage restriction errors
      }
      starting.current = false;
      setError(
        oauthError instanceof Error
          ? `OAuth redirect failed: ${oauthError.message}`
          : "OAuth redirect failed",
      );
    }
  }

  return (
    <section className="googleAuth" aria-labelledby="google-auth-title">
      <div className="googleAuthIntro">
        <span className="authKicker">Customers &amp; Shop Owners</span>
        <h2 id="google-auth-title">Welcome to Kynisto</h2>
        <p>Sign in securely with your Google account.</p>
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

      <small className="googleSecurityNote" style={{ marginTop: "1rem", display: "block" }}>
        Google verifies your identity. Kynisto securely determines your saved role and permissions.
      </small>
    </section>
  );
}
