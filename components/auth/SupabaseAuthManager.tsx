"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import type { Session } from "@supabase/supabase-js";
import {
  getSupabaseBrowserClient,
  signOutSupabaseBrowser,
  syncSupabaseAccessCookie,
} from "@/lib/supabase-browser";

const PENDING_KEY = "kynisto-google-auth-pending";

function storageRead(key: string): string | null {
  try {
    return window.sessionStorage.getItem(key);
  } catch {
    return null;
  }
}

function storageRemove(key: string): void {
  try {
    window.sessionStorage.removeItem(key);
  } catch {
    // Session storage removal fallback
  }
}

function getFriendlyErrorMessage(error: unknown): string {
  if (!error) return "profile query failed";
  
  let message = "";
  if (error && typeof error === "object") {
    const record = error as Record<string, unknown>;
    const details = [record.message, record.details, record.hint, record.code]
      .filter((value): value is string => typeof value === "string" && Boolean(value.trim()))
      .join(" · ");
    message = details;
  }
  if (!message) {
    message = error instanceof Error && error.message ? error.message : String(error);
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
    
    const initialUrl = new URL(window.location.href);
    const hasOAuthResult =
      initialUrl.searchParams.has("code") ||
      initialUrl.searchParams.has("error") ||
      initialUrl.searchParams.has("error_description");
    const pending = storageRead(PENDING_KEY) === "1";
    const shouldCompleteLogin = hasOAuthResult || pending;
    
    if (shouldCompleteLogin) {
      setActive(true);
      setLoading(true);
    }
    
    async function initAuth() {
      try {
        const supabase = await getSupabaseBrowserClient();
        if (!mounted) return;
        
        // Let Supabase process the URL first. Process URL errors if any
        if (initialUrl.searchParams.has("error")) {
          throw new Error(
            `OAuth redirect failed: ${
              initialUrl.searchParams.get("error_description") ||
              initialUrl.searchParams.get("error") ||
              "Google did not return a valid authorization."
            }`
          );
        }
        
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        if (sessionError) throw sessionError;
        if (!mounted) return;
        
        // Listen once for auth events using onAuthStateChange
        const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, currentSession) => {
          console.log("auth state change:", event);
          
          if (!mounted) return;
          
          if (event === "SIGNED_OUT") {
            syncSupabaseAccessCookie(null);
            return;
          }
          
          if (event === "SIGNED_IN" || event === "INITIAL_SESSION" || event === "TOKEN_REFRESHED") {
            if (currentSession) {
              const synced = syncSupabaseAccessCookie(currentSession);
              if (!synced) {
                throw new Error("blocked cookies");
              }
              
              if (shouldCompleteLogin && (event === "SIGNED_IN" || event === "INITIAL_SESSION")) {
                await handleGoogleLoginSuccess(currentSession);
              }
            } else if (shouldCompleteLogin && event === "INITIAL_SESSION") {
              throw new Error("Supabase session not found");
            }
          }
        });
        
        subscriptionRef.current = subscription;
        
        // If we are supposed to complete login but no session was returned by getSession
        if (shouldCompleteLogin && !session) {
          throw new Error("Supabase session not found");
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
    
    async function handleGoogleLoginSuccess(session: Session) {
      if (completionStarted.current) return;
      completionStarted.current = true;
      
      console.log("session detected");
      console.log("authenticated user ID:", session.user.id);
      
      try {
        const supabase = await getSupabaseBrowserClient();
        
        // Query profile for this user ID only
        const { data: profile, error: profileError } = await supabase
          .from("profiles")
          .select("*")
          .eq("id", session.user.id)
          .maybeSingle();
          
        console.log("profile query result:", profile);
        
        if (profileError) {
          throw new Error(`profile query failed: ${profileError.message || "Unknown database error"}`);
        }
        
        let destination = "";
        
        if (!profile) {
          // Profile doesn't exist, create it with Google metadata
          const metadata = session.user.user_metadata || {};
          const email = session.user.email;
          const fullName = metadata.full_name || metadata.name || "";
          const avatarUrl = metadata.avatar_url || metadata.picture || "";
          
          const { error: createError } = await supabase
            .from("profiles")
            .insert({
              id: session.user.id,
              email,
              full_name: fullName,
              avatar_url: avatarUrl,
              role: null, // role is unset/null initially
              onboarding_completed: false,
              updated_at: new Date().toISOString(),
            });
            
          if (createError) {
            throw new Error(`profile query failed: ${createError.message || "Failed to create profile row"}`);
          }
          
          destination = "/onboarding";
        } else if (!profile.role) {
          destination = "/onboarding";
        } else {
          // Profile exists and has a role
          if (profile.role === "admin") {
            throw new Error("invalid role");
          }
          
          if (profile.role === "customer") {
            destination = "/account";
          } else if (profile.role === "shop_owner" || profile.role === "store_owner") {
            destination = "/owner";
          } else {
            throw new Error("invalid role");
          }
        }
        
        console.log("final redirect destination:", destination);
        storageRemove(PENDING_KEY);
        
        // Clean URL parameters before redirecting to prevent redirect loops or token replay errors
        const cleanUrl = new URL(window.location.href);
        cleanUrl.searchParams.delete("code");
        cleanUrl.searchParams.delete("error");
        cleanUrl.searchParams.delete("error_description");
        cleanUrl.searchParams.delete("state");
        window.history.replaceState(null, "", cleanUrl.pathname + cleanUrl.search);
        
        window.location.replace(destination);
      } catch (err) {
        if (mounted) {
          console.error("Kynisto Google login completion failed:", err);
          setError(getFriendlyErrorMessage(err));
          setLoading(false);
          setActive(true);
          storageRemove(PENDING_KEY);
          completionStarted.current = false;
        }
      }
    }
    
    void initAuth();
    
    return () => {
      mounted = false;
      if (subscriptionRef.current) {
        subscriptionRef.current.unsubscribe();
      }
    };
  }, []);
  
  async function handleSignOut() {
    try {
      setLoading(true);
      setError("");
      await signOutSupabaseBrowser();
      storageRemove(PENDING_KEY);
      window.location.replace("/login");
    } catch (err) {
      console.error("Sign out failed:", err);
      setError(getFriendlyErrorMessage(err));
      setLoading(false);
    }
  }
  
  if (!active) return null;
  return (
    <div className="authCompletionLayer" role="dialog" aria-modal="true">
      <section className="authCompletionCard">
        <span className="authKicker">Google authentication</span>
        <h2>Opening Kynisto</h2>
        {error ? (
          <>
            <p className="authError" role="alert">
              {error}
            </p>
            <div className="authCallbackActions">
              <button
                type="button"
                onClick={() => window.location.replace("/login")}
              >
                Try again
              </button>
              <Link href="/login">Return to login</Link>
              <button type="button" onClick={() => void handleSignOut()}>
                Sign out
              </button>
            </div>
          </>
        ) : loading ? (
          <div className="authProgress" role="status" aria-live="polite">
            <span aria-hidden="true" />
            <p>Securing your Google account…</p>
          </div>
        ) : null}
      </section>
    </div>
  );
}
