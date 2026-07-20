"use client";

import { useEffect, useRef, useState } from "react";
import { type Session } from "@supabase/supabase-js";
import {
  getSupabaseBrowserClient,
  syncSupabaseAccessCookie,
} from "@/lib/supabase-browser";
import { apiFetch } from "@/lib/client-api";

const PENDING_KEY = "kynisto-google-auth-pending";

function storageRemove(key: string): void {
  try {
    window.sessionStorage.removeItem(key);
  } catch {
    // Ignore storage restriction errors
  }
}

function extractHashToken(hash: string): string | null {
  if (!hash || !hash.includes("access_token")) return null;
  try {
    const raw = hash.startsWith("#") ? hash.slice(1) : hash;
    const params = new URLSearchParams(raw);
    return params.get("access_token");
  } catch {
    return null;
  }
}

function getFriendlyErrorMessage(error: unknown): string {
  let message = "";
  if (error instanceof Error) {
    message = error.message;
  } else if (typeof error === "object" && error !== null) {
    const err = error as Record<string, unknown>;
    message =
      typeof err.message === "string"
        ? err.message
        : typeof err.error_description === "string"
          ? err.error_description
          : typeof err.error === "string"
            ? err.error
            : JSON.stringify(error);
  } else {
    message = String(error);
  }

  const normalized = message.toLowerCase();

  if (normalized.includes("oauth redirect failed") || normalized.includes("oauth_redirect_failed")) {
    return "OAuth redirect failed";
  }
  if (normalized.includes("session not found") || normalized.includes("session_not_found")) {
    return "Supabase session not found";
  }
  if (normalized.includes("profile query failed") || normalized.includes("profile_query_failed")) {
    return "profile query failed";
  }
  if (normalized.includes("invalid role") || normalized.includes("invalid_role")) {
    return "invalid role";
  }
  if (normalized.includes("network error") || normalized.includes("failed to fetch") || normalized.includes("network")) {
    return "network error";
  }
  if (normalized.includes("blocked cookies") || normalized.includes("cookie") || normalized.includes("storage") || normalized.includes("securityerror")) {
    return "blocked cookies";
  }

  return message;
}

export function SupabaseAuthManager() {
  const [active, setActive] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const completionStarted = useRef(false);
  const subscriptionRef = useRef<{ unsubscribe: () => void } | null>(null);

  useEffect(() => {
    let mounted = true;
    let timeoutId: ReturnType<typeof setTimeout> | null = null;

    const initialUrl = new URL(window.location.href);
    const hashAccessToken = extractHashToken(initialUrl.hash);
    const hasOAuthResult =
      Boolean(hashAccessToken) ||
      initialUrl.searchParams.has("code") ||
      initialUrl.searchParams.has("error") ||
      initialUrl.searchParams.has("error_description") ||
      initialUrl.hash.includes("error");

    if (hasOAuthResult) {
      setActive(true);
      setLoading(true);
    } else {
      storageRemove(PENDING_KEY);
    }

    async function initAuth() {
      try {
        // Fast path: If URL hash directly contains access_token, process immediately!
        if (hashAccessToken) {
          await processAccessToken(hashAccessToken);
          return;
        }

        const supabase = await getSupabaseBrowserClient();
        if (!mounted) return;

        if (initialUrl.searchParams.has("error")) {
          throw new Error(
            `OAuth redirect failed: ${
              initialUrl.searchParams.get("error_description") ||
              initialUrl.searchParams.get("error") ||
              "Google did not return a valid authorization."
            }`,
          );
        }

        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        if (sessionError) throw sessionError;
        if (!mounted) return;

        if (session?.access_token) {
          syncSupabaseAccessCookie(session);
          if (hasOAuthResult) {
            await processAccessToken(session.access_token);
            return;
          }
        }

        // Listen for auth events
        const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, currentSession) => {
          console.log("auth state change:", event);
          if (!mounted) return;

          if (event === "SIGNED_OUT") {
            syncSupabaseAccessCookie(null);
            return;
          }

          if (currentSession?.access_token && (event === "SIGNED_IN" || event === "INITIAL_SESSION" || event === "TOKEN_REFRESHED")) {
            if (timeoutId) clearTimeout(timeoutId);
            syncSupabaseAccessCookie(currentSession);

            if (hasOAuthResult) {
              await processAccessToken(currentSession.access_token);
            }
          }
        });

        subscriptionRef.current = subscription;

        if (hasOAuthResult && !session) {
          timeoutId = setTimeout(() => {
            if (mounted && !completionStarted.current) {
              storageRemove(PENDING_KEY);
              setActive(false);
              setLoading(false);
            }
          }, 4000);
        }
      } catch (err) {
        if (mounted) {
          console.error("Kynisto Google authentication failed:", err);
          setError(getFriendlyErrorMessage(err));
          setLoading(false);
          setActive(true);
          storageRemove(PENDING_KEY);
        }
      }
    }

    async function processAccessToken(token: string) {
      if (completionStarted.current) return;
      completionStarted.current = true;

      try {
        // Create official D1 server session cookie
        const res = await apiFetch<{ redirectTo: string }>("/api/auth/google/session", {
          method: "POST",
          json: { accessToken: token },
        });

        storageRemove(PENDING_KEY);

        // Clean OAuth URL params from address bar
        if (typeof window !== "undefined" && window.history?.replaceState) {
          const cleanUrl = new URL(window.location.href);
          cleanUrl.searchParams.delete("code");
          cleanUrl.searchParams.delete("error");
          cleanUrl.searchParams.delete("error_description");
          cleanUrl.hash = "";
          window.history.replaceState({}, "", cleanUrl.toString());
        }

        window.location.replace(res.redirectTo || "/account");
      } catch (completionError) {
        console.error("Post-login routing failed:", completionError);
        completionStarted.current = false;
        setError(getFriendlyErrorMessage(completionError));
        setLoading(false);
        setActive(true);
        storageRemove(PENDING_KEY);
      }
    }

    void initAuth();

    return () => {
      mounted = false;
      if (timeoutId) clearTimeout(timeoutId);
      subscriptionRef.current?.unsubscribe();
    };
  }, []);

  if (!active) return null;

  return (
    <div className="authOverlay">
      <div className="authOverlayCard" role="dialog" aria-modal="true">
        <span className="authKicker">Google Authentication</span>
        <h2>Opening Kynisto</h2>
        {loading ? (
          <div className="authLoadingState">
            <span className="authSpinner" aria-hidden="true" />
            <p>Connecting securely…</p>
          </div>
        ) : error ? (
          <>
            <p className="authErrorMessage">{error}</p>
            <div className="authOverlayActions">
              <button
                type="button"
                className="authPrimaryButton"
                onClick={() => window.location.reload()}
              >
                Try again
              </button>
              <button
                type="button"
                className="authSecondaryButton"
                onClick={() => {
                  storageRemove(PENDING_KEY);
                  setActive(false);
                  window.location.replace("/login");
                }}
              >
                Return to login
              </button>
            </div>
          </>
        ) : null}
      </div>
    </div>
  );
}
