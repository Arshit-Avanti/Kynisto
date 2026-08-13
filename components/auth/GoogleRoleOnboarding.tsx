"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import type { User } from "@supabase/supabase-js";
import {
  getSupabaseBrowserClient,
  signOutSupabaseBrowser,
  syncSupabaseAccessCookie,
} from "@/lib/supabase-browser";
// verifyGoogleApplicationSession

type SelectedRole = "customer" | "shop_owner" | "admin";

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

        syncSupabaseAccessCookie(session);

        // Safely fetch profile and check if permanent role is already set
        try {
          const { data: profile } = await supabase
            .from("profiles")
            .select("*")
            .eq("id", session.user.id)
            .maybeSingle();

          const existingRole = profile?.role || session.user.user_metadata?.role;
          if (existingRole) {
            const dest = (existingRole === "shop_owner" || existingRole === "owner" || existingRole === "store_owner") ? "/owner" : "/";
            window.location.replace(dest);
            return;
          }
        } catch (profileErr) {
          console.warn("Profile table query gracefully bypassed:", profileErr);
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
      if (selectedRole !== "customer" && selectedRole !== "shop_owner" && selectedRole !== "admin") {
        throw new Error("invalid role");
      }

      const supabase = await getSupabaseBrowserClient();
      const metadata = user.user_metadata || {};
      const targetRole = selectedRole === "shop_owner" ? "shop_owner" : selectedRole === "admin" ? "admin" : "customer";

      // 1. Permanently update Supabase Auth User Metadata
      try {
        await supabase.auth.updateUser({
          data: {
            role: targetRole,
            onboarding_completed: true,
            role_selected_at: new Date().toISOString(),
          },
        });
      } catch (metaErr) {
        console.warn("Auth user metadata update bypassed:", metaErr);
      }

      // 2. Permanently upsert to Supabase profiles table
      try {
        await supabase.from("profiles").upsert(
          {
            id: user.id,
            email: user.email,
            full_name: metadata.full_name || metadata.name || "",
            avatar_url: metadata.avatar_url || metadata.picture || "",
            role: targetRole,
            onboarding_completed: true,
            updated_at: new Date().toISOString(),
          },
          { onConflict: "id" },
        );
      } catch (upsertErr) {
        console.warn("Profiles upsert gracefully bypassed:", upsertErr);
      }

      // 3. Save to localStorage for instant client-side role memory
      try {
        localStorage.setItem("kynisto_permanent_role", targetRole);
      } catch {
        // Ignore storage restriction errors
      }

      // 4. Route to the permanent workspace based on selected role
      const destination = (targetRole === "shop_owner") ? "/owner" : (targetRole === "admin") ? "/admin" : "/";
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
        <div style={{ display: "inline-flex", alignItems: "center", gap: "0.4rem", padding: "0.25rem 0.75rem", borderRadius: "9999px", background: "rgba(37, 99, 235, 0.1)", color: "#2563eb", fontSize: "0.825rem", fontWeight: 700, marginBottom: "0.75rem" }}>
          🔒 Permanent Account Setup
        </div>
        <h2>Select Account Type</h2>
        <p style={{ color: "#64748b", fontSize: "0.95rem" }}>
          Choose whether you are using Kynisto as a Customer or Shop Owner. This selection is permanent.
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
                Discover local shops, order products, book services &amp; join queues.
              </small>
            </span>
            <em>{busy === "customer" ? "Setting up…" : "Continue as Customer →"}</em>
          </button>

          <button
            type="button"
            disabled={Boolean(busy)}
            onClick={() => void selectRole("shop_owner")}
          >
            <i aria-hidden="true">S</i>
            <span>
              <b>Shop / Service Owner</b>
              <small>
                Manage your physical store, Healthcare clinic, live queues &amp; service catalog.
              </small>
            </span>
            <em>{busy === "shop_owner" ? "Setting up…" : "Continue as Shop Owner →"}</em>
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
