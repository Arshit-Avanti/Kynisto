"use client";

import {
  createClient,
  type Session,
  type SupabaseClient,
} from "@supabase/supabase-js";
import { apiFetch } from "@/lib/client-api";
import { SUPABASE_ACCESS_COOKIE } from "@/lib/supabase-session";

type SupabasePublicConfig = {
  url: string;
  publishableKey: string;
};

export type GoogleApplicationRole = "customer" | "store_owner";

let browserClientPromise: Promise<SupabaseClient> | null = null;

export function syncSupabaseAccessCookie(session: Session | null): boolean {
  if (typeof document === "undefined") return false;
  const secure = window.location.protocol === "https:" ? "; Secure" : "";
  if (!session?.access_token) {
    document.cookie = `${SUPABASE_ACCESS_COOKIE}=; Path=/; Max-Age=0; SameSite=Lax${secure}`;
    return true;
  }
  const now = Math.floor(Date.now() / 1000);
  const maxAge = Math.max(1, (session.expires_at ?? now + 3600) - now);
  document.cookie = `${SUPABASE_ACCESS_COOKIE}=${encodeURIComponent(session.access_token)}; Path=/; Max-Age=${maxAge}; SameSite=Lax${secure}`;
  return document.cookie
    .split(";")
    .some((cookie) => cookie.trim().startsWith(`${SUPABASE_ACCESS_COOKIE}=`));
}

export function getSupabaseBrowserClient(): Promise<SupabaseClient> {
  if (!browserClientPromise) {
    browserClientPromise = apiFetch<SupabasePublicConfig>(
      "/api/auth/google/config",
    )
      .then(({ url, publishableKey }) => {
        const client = createClient(url, publishableKey, {
          auth: {
            autoRefreshToken: true,
            detectSessionInUrl: true,
            flowType: "pkce",
            persistSession: true,
          },
        });
        return client;
      })
      .catch((error) => {
        browserClientPromise = null;
        throw error;
      });
  }
  return browserClientPromise;
}

export async function signOutSupabaseBrowser(): Promise<void> {
  const supabase = await getSupabaseBrowserClient();
  try {
    const { error } = await supabase.auth.signOut({ scope: "local" });
    if (error) throw error;
  } finally {
    syncSupabaseAccessCookie(null);
  }
}

export async function verifyGoogleApplicationSession(
  expectedRole: GoogleApplicationRole,
): Promise<void> {
  const result = await apiFetch<{
    user: { role: string } | null;
  }>("/api/auth/me");
  if (!result.user) {
    throw new Error(
      "This Google account cannot open a Customer or Shop Owner workspace. If it is your administrator account, use the separate Admin login.",
    );
  }
  if (result.user.role !== expectedRole) {
    throw new Error(
      "Invalid role: the saved Google role does not match this Kynisto workspace.",
    );
  }
}
