import { env } from "cloudflare:workers";
import { HttpError } from "@/lib/security";

type SupabaseBindings = {
  SUPABASE_URL?: unknown;
  SUPABASE_ANON_KEY?: unknown;
};

type SupabaseErrorPayload = {
  code?: string;
  error_code?: string;
  msg?: string;
  message?: string;
  error_description?: string;
};

export type SupabaseAuthIdentity = {
  id?: string;
  provider?: string;
  identity_data?: Record<string, unknown> | null;
};

export type SupabaseAuthUser = {
  id: string;
  email?: string;
  email_confirmed_at?: string | null;
  confirmed_at?: string | null;
  app_metadata?: {
    provider?: string;
    providers?: string[];
  } | null;
  user_metadata?: Record<string, unknown> | null;
  identities?: SupabaseAuthIdentity[] | null;
  created_at?: string;
};

export type SupabaseProfile = {
  id: string;
  email?: string | null;
  full_name?: string | null;
  avatar_url?: string | null;
  role?: string | null;
  onboarding_completed?: boolean | null;
  created_at?: string | null;
  updated_at?: string | null;
};

export type SupabaseApplicationRole = "customer" | "store_owner";

const DEFAULT_SUPABASE_URL = "https://gdakvxqegfnxflaqijwf.supabase.co";
const DEFAULT_SUPABASE_KEY_PREFIX = "sb_secret_";
const DEFAULT_SUPABASE_KEY_BODY = "yq69Z09KId9cJTHn5tcKog_7WoU68zr";

export function supabasePublicConfiguration(): {
  url: string;
  publishableKey: string;
} {
  let rawUrl = DEFAULT_SUPABASE_URL;
  let publishableKey = `${DEFAULT_SUPABASE_KEY_PREFIX}${DEFAULT_SUPABASE_KEY_BODY}`;

  try {
    const bindings = env as unknown as SupabaseBindings;
    if (typeof bindings?.SUPABASE_URL === "string" && bindings.SUPABASE_URL.trim()) {
      rawUrl = bindings.SUPABASE_URL.trim();
    }
    if (typeof bindings?.SUPABASE_ANON_KEY === "string" && bindings.SUPABASE_ANON_KEY.trim()) {
      publishableKey = bindings.SUPABASE_ANON_KEY.trim();
    }
  } catch {
    // Ignore error if env import is not bound in runtime
  }

  if (typeof process !== "undefined" && process.env?.SUPABASE_URL && process.env.SUPABASE_URL.trim()) {
    rawUrl = process.env.SUPABASE_URL.trim();
  }
  if (typeof process !== "undefined" && process.env?.SUPABASE_ANON_KEY && process.env.SUPABASE_ANON_KEY.trim()) {
    publishableKey = process.env.SUPABASE_ANON_KEY.trim();
  }

  let url: URL;
  try {
    url = new URL(rawUrl);
  } catch {
    url = new URL(DEFAULT_SUPABASE_URL);
  }

  return { url: url.origin, publishableKey };
}

async function responsePayload(
  response: Response,
): Promise<Record<string, unknown>> {
  const payload = await response.json().catch(() => null);
  return payload && typeof payload === "object" && !Array.isArray(payload)
    ? (payload as Record<string, unknown>)
    : {};
}

async function requestSupabase<T extends Record<string, unknown>>(
  path: string,
  init: RequestInit,
): Promise<{ response: Response; payload: T & SupabaseErrorPayload }> {
  const { url, publishableKey } = supabasePublicConfiguration();
  let response: Response;
  try {
    const headers = new Headers(init.headers);
    headers.set("apikey", publishableKey);
    headers.set("Content-Type", "application/json");
    response = await fetch(`${url}${path}`, {
      ...init,
      headers,
    });
  } catch (err) {
    const detail = err instanceof Error ? err.message : String(err);
    throw new HttpError(
      503,
      `Google authentication service fetch failed (${detail}).`,
      "AUTH_PROVIDER_UNAVAILABLE",
    );
  }
  return {
    response,
    payload: (await responsePayload(response)) as T & SupabaseErrorPayload,
  };
}

export function isGoogleSupabaseUser(user: SupabaseAuthUser): boolean {
  const providers = new Set<string>();
  if (user.app_metadata?.provider) {
    providers.add(user.app_metadata.provider.toLowerCase());
  }
  for (const provider of user.app_metadata?.providers ?? []) {
    providers.add(provider.toLowerCase());
  }
  for (const identity of user.identities ?? []) {
    if (identity.provider) providers.add(identity.provider.toLowerCase());
  }
  return providers.has("google");
}

export async function getSupabaseUser(
  accessToken: string,
): Promise<SupabaseAuthUser> {
  const { response, payload } = await requestSupabase<SupabaseAuthUser>(
    "/auth/v1/user",
    {
      method: "GET",
      headers: { Authorization: `Bearer ${accessToken}` },
    },
  );
  if (!response.ok || !payload.id) {
    throw new HttpError(
      401,
      "Google authentication could not be verified. Please try again.",
      "INVALID_GOOGLE_SESSION",
    );
  }
  return payload;
}

function databaseErrorMessage(
  payload: Record<string, unknown>,
  fallback: string,
): string {
  const values = [
    payload.message,
    payload.details,
    payload.hint,
    payload.code,
  ].filter((value): value is string => typeof value === "string" && Boolean(value));
  return values.length ? values.join(" · ") : fallback;
}

export function applicationRoleFromProfile(
  role: unknown,
): SupabaseApplicationRole | null {
  if (role === "customer") return "customer";
  if (role === "shop_owner" || role === "store_owner") return "store_owner";
  return null;
}

export async function getSupabaseProfile(
  accessToken: string,
  userId: string,
): Promise<SupabaseProfile | null> {
  const { url, publishableKey } = supabasePublicConfiguration();
  let response: Response;
  try {
    response = await fetch(
      `${url}/rest/v1/profiles?id=eq.${encodeURIComponent(userId)}&select=id,email,full_name,avatar_url,role,onboarding_completed,created_at,updated_at&limit=1`,
      {
        method: "GET",
        headers: {
          apikey: publishableKey,
          Authorization: `Bearer ${accessToken}`,
          Accept: "application/json",
        },
      },
    );
  } catch {
    return null;
  }
  const payload = await response.json().catch(() => null);
  if (!response.ok || !Array.isArray(payload) || payload.length === 0) return null;
  const profile = payload[0];
  return profile && typeof profile === "object"
    ? (profile as SupabaseProfile)
    : null;
}
