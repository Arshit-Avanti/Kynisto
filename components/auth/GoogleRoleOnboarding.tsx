"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import type { User } from "@supabase/supabase-js";
import {
  getSupabaseBrowserClient,
  signOutSupabaseBrowser,
  syncSupabaseAccessCookie,
} from "@/lib/supabase-browser";

type SelectedRole = "customer" | "shop_owner";

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

export function GoogleRoleOnboarding() {
  const loaded = useRef(false);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState<SelectedRole | "">("");
  const [error, setError] = useState("");

  useEffect(() => {
    if (loaded.current) return;
    loaded.current = true;
    void (async () => {
      try {
        const supabase = await getSupabaseBrowserClient();
        const {
          data: { session },
          error: sessionError,
        } = await supabase.auth.getSession();
        if (sessionError) throw sessionError;
        if (!session?.user) {
          throw new Error("Supabase session not found");
        }
        
        const synced = syncSupabaseAccessCookie(session);
        if (!synced) {
          throw new Error("blocked cookies");
        }
        
        console.log("session detected");
        console.log("authenticated user ID:", session.user.id);

        const { data: profile, error: profileError } = await supabase
          .from("profiles")
          .select("*")
          .eq("id", session.user.id)
          .maybeSingle();
          
        console.log("profile query result:", profile);
        
        if (profileError) {
          throw new Error(`profile query failed: ${profileError.message}`);
        }
        
        if (profile?.role === "customer") {
          const destination = "/account";
          console.log("final redirect destination:", destination);
          window.location.replace(destination);
          return;
        }
        if (
          profile?.role === "shop_owner" ||
          profile?.role === "store_owner"
        ) {
          const destination = "/owner";
          console.log("final redirect destination:", destination);
          window.location.replace(destination);
          return;
        }
        if (profile?.role) {
          throw new Error("invalid role");
        }
        setUser(session.user);
      } catch (loadError) {
        console.error("Google onboarding failed:", loadError);
        setError(getFriendlyErrorMessage(loadError));
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  async function selectRole(selectedRole: SelectedRole) {
    if (busy || !user) return;
    setBusy(selectedRole);
    setError("");
    try {
      if (selectedRole !== "customer" && selectedRole !== "shop_owner") {
        throw new Error("invalid role");
      }
      
      const supabase = await getSupabaseBrowserClient();
      const metadata = user.user_metadata || {};
      const { error: saveError } = await supabase.from("profiles").upsert(
          {
            id: user.id,
            email: user.email,
            full_name: metadata.full_name || metadata.name || "",
            avatar_url: metadata.avatar_url || metadata.picture || "",
            role: selectedRole,
            onboarding_completed: true,
            updated_at: new Date().toISOString(),
          },
          { onConflict: "id" },
      );
      if (saveError) {
        throw new Error(`profile query failed: ${saveError.message}`);
      }
      
      const destination = selectedRole === "customer" ? "/account" : "/owner";
      console.log("final redirect destination:", destination);
      window.location.replace(destination);
    } catch (selectionError) {
      console.error("Google role selection failed:", selectionError);
      setError(getFriendlyErrorMessage(selectionError));
      setBusy("");
    }
  }

  async function signOut() {
    try {
      await signOutSupabaseBrowser();
      window.location.replace("/login");
    } catch (signOutError) {
      console.error("Google sign-out failed:", signOutError);
      setError(getFriendlyErrorMessage(signOutError));
    }
  }

  if (loading) {
    return (
      <div className="authProgress" role="status" aria-live="polite">
        <span aria-hidden="true" />
        <p>Preparing your Kynisto account…</p>
      </div>
    );
  }

  const metadata = user?.user_metadata || {};
  const name =
    String(metadata.full_name || metadata.name || "").trim() ||
    user?.email?.split("@")[0] ||
    "Kynisto user";
  const avatarUrl = String(
    metadata.avatar_url || metadata.picture || "",
  ).trim();

  return (
    <section className="roleOnboarding">
      {user && (
        <div className="googleProfile">
          {avatarUrl ? (
            <img src={avatarUrl} alt="" referrerPolicy="no-referrer" />
          ) : (
            <span aria-hidden="true">{name.slice(0, 1).toUpperCase()}</span>
          )}
          <div>
            <strong>{name}</strong>
            <small>{user.email}</small>
          </div>
        </div>
      )}
      <div>
        <span className="authKicker">One quick choice</span>
        <h2>How do you want to use Kynisto?</h2>
        <p>
          Choose Customer or Shop Owner. Administrative access remains
          separately protected.
        </p>
      </div>
      {error && (
        <p className="authError" role="alert">
          {error}
        </p>
      )}
      {user && (
        <div className="onboardingRoleGrid">
          <button
            type="button"
            disabled={Boolean(busy)}
            onClick={() => void selectRole("customer")}
          >
            <i aria-hidden="true">C</i>
            <span>
              <b>Customer</b>
              <small>
                Discover, save, shop, chat and join healthcare queues.
              </small>
            </span>
            <em>{busy === "customer" ? "Creating…" : "Continue →"}</em>
          </button>
          <button
            type="button"
            disabled={Boolean(busy)}
            onClick={() => void selectRole("shop_owner")}
          >
            <i aria-hidden="true">S</i>
            <span>
              <b>Shop Owner</b>
              <small>
                List and operate your business with the complete owner
                dashboard.
              </small>
            </span>
            <em>{busy === "shop_owner" ? "Creating…" : "Continue →"}</em>
          </button>
        </div>
      )}
      {error && (
        <div className="authCallbackActions">
          <button type="button" onClick={() => window.location.reload()}>
            Try again
          </button>
          <Link href="/login">Return to login</Link>
          <button type="button" onClick={() => void signOut()}>
            Sign out
          </button>
        </div>
      )}
    </section>
  );
}
