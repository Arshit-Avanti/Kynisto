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

export function supabasePublicConfiguration(): {
  url: string;
  publishableKey: string;
} {
  let rawUrl = "";
  let publishableKey = "";

  try {
    const bindings = env as unknown as SupabaseBindings;
    if (typeof bindings?.SUPABASE_URL === "string") {
      rawUrl = bindings.SUPABASE_URL.trim();
    }
    if (typeof bindings?.SUPABASE_ANON_KEY === "string") {
      publishableKey = bindings.SUPABASE_ANON_KEY.trim();
    }
  } catch {
    // Ignore error if env import is not bound in runtime
  }

  if (!rawUrl && typeof process !== "undefined" && process.env?.SUPABASE_URL) {
    rawUrl = process.env.SUPABASE_URL.trim();
  }
  if (!publishableKey && typeof process !== "undefined" && process.env?.SUPABASE_ANON_KEY) {
    publishableKey = process.env.SUPABASE_ANON_KEY.trim();
  }

  let url: URL;
  try {
    url = new URL(rawUrl);
  } catch {
    throw new HttpError(
      503,
      "Google authentication is temporarily unavailable.",
      "AUTH_NOT_CONFIGURED",
    );
  }

  const validKey =
    publishableKey.startsWith("sb_publishable_") ||
    publishableKey.startsWith("sb_secret_") ||
    publishableKey.startsWith("sb_") ||
    (publishableKey.startsWith("eyJ") &&
      publishableKey.split(".").length === 3);

  if (
    url.protocol !== "https:" ||
    !url.hostname.endsWith(".supabase.co") ||
    !validKey ||
    publishableKey === rawUrl
  ) {
    throw new HttpError(
      503,
      "Google authentication is temporarily unavailable.",
      "AUTH_NOT_CONFIGURED",
    );
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
      cache: "no-store",
    });
  } catch {
    throw new HttpError(
      503,
      "Google authentication is temporarily unavailable.",
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
  if (!isGoogleSupabaseUser(payload)) {
    throw new HttpError(
      403,
      "Customers and Shop Owners must continue with Google.",
      "GOOGLE_REQUIRED",
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
        cache: "no-store",
      },
    );
  } catch {
    throw new HttpError(
      503,
      "The Kynisto profile service could not be reached.",
      "PROFILE_SERVICE_UNAVAILABLE",
    );
  }
  const payload = await response.json().catch(() => null);
  if (!response.ok) {
    const errorPayload =
      payload && typeof payload === "object" && !Array.isArray(payload)
        ? (payload as Record<string, unknown>)
        : {};
    throw new HttpError(
      response.status,
      databaseErrorMessage(errorPayload, "The Supabase profile could not be read."),
      "PROFILE_READ_FAILED",
    );
  }
  if (!Array.isArray(payload) || payload.length === 0) return null;
  const profile = payload[0];
  return profile && typeof profile === "object"
    ? (profile as SupabaseProfile)
    : null;
}
