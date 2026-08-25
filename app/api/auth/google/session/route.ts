import { NextResponse } from "next/server";
import { createSession } from "@/lib/auth";
import { apiError, assertSameOrigin } from "@/lib/security";
import {
  applicationRoleFromProfile,
  getSupabaseProfile,
  getSupabaseUser,
  type SupabaseAuthUser,
} from "@/lib/supabase-auth";
import { ensureGoogleLocalIdentity } from "@/lib/supabase-identity";
import { safeJson, ValidationError } from "@/lib/validation";

function getGoogleAuthCredentials() {
  const clientId =
    (typeof process !== "undefined" && (process.env?.GOOGLE_CLIENT_ID || process.env?.NEXT_PUBLIC_GOOGLE_CLIENT_ID)) ||
    "434985444161-mbbrsie2g2tmf1o9kbcalnm2kussn4ur.apps.googleusercontent.com";
  const clientSecret =
    (typeof process !== "undefined" && process.env?.GOOGLE_CLIENT_SECRET) || "";
  return { clientId, clientSecret };
}

async function verifyGoogleIdToken(idToken: string): Promise<SupabaseAuthUser> {
  const res = await fetch(`https://oauth2.googleapis.com/tokeninfo?id_token=${encodeURIComponent(idToken)}`);
  if (!res.ok) {
    throw new ValidationError("Invalid Google ID token.");
  }
  const payload = (await res.json()) as Record<string, unknown>;
  const email = typeof payload.email === "string" ? payload.email : "";
  const sub = typeof payload.sub === "string" ? payload.sub : "";
  const name = typeof payload.name === "string" ? payload.name : "";
  const picture = typeof payload.picture === "string" ? payload.picture : "";
  if (!email || !sub) {
    throw new ValidationError("Google token did not contain valid identity.");
  }
  return {
    id: sub,
    email,
    email_confirmed_at: new Date().toISOString(),
    user_metadata: {
      name,
      full_name: name,
      avatar_url: picture,
      picture,
    },
    identities: [
      {
        id: sub,
        provider: "google",
        identity_data: { name, full_name: name, avatar_url: picture, picture },
      },
    ],
  };
}

async function exchangeGoogleCode(code: string, redirectUri?: string): Promise<SupabaseAuthUser> {
  const { clientId, clientSecret } = getGoogleAuthCredentials();
  const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      code,
      client_id: clientId,
      client_secret: clientSecret,
      grant_type: "authorization_code",
      redirect_uri: redirectUri || "https://kynisto.in/auth/confirm",
    }),
  });
  if (!tokenRes.ok) {
    const errText = await tokenRes.text();
    throw new ValidationError(`Google authorization exchange failed: ${errText}`);
  }
  const tokenData = (await tokenRes.json()) as { id_token?: string };
  if (!tokenData.id_token) {
    throw new ValidationError("Google did not return an id_token.");
  }
  return verifyGoogleIdToken(tokenData.id_token);
}

export async function POST(request: Request) {
  try {
    assertSameOrigin(request);
    const body = (await safeJson(request)) as Record<string, unknown>;
    const accessToken =
      typeof body.accessToken === "string"
        ? body.accessToken
        : typeof body.access_token === "string"
        ? body.access_token
        : "";
    const idToken =
      typeof body.idToken === "string"
        ? body.idToken
        : typeof body.id_token === "string"
        ? body.id_token
        : typeof body.credential === "string"
        ? body.credential
        : "";
    const code = typeof body.code === "string" ? body.code : "";
    const redirectUri =
      typeof body.redirect_uri === "string"
        ? body.redirect_uri
        : typeof body.redirectTo === "string"
        ? body.redirectTo
        : undefined;

    let supabaseUser: SupabaseAuthUser;
    let profile = null;

    if (idToken) {
      supabaseUser = await verifyGoogleIdToken(idToken);
    } else if (code) {
      supabaseUser = await exchangeGoogleCode(code, redirectUri);
    } else if (accessToken) {
      supabaseUser = await getSupabaseUser(accessToken);
      try {
        profile = await getSupabaseProfile(accessToken, supabaseUser.id);
      } catch {
        // Ignore profile query failure
      }
    } else {
      throw new ValidationError("Google access token, ID token, or authorization code is required.");
    }

    const metadataRole = supabaseUser.user_metadata?.role;
    const profileRole = profile?.role;
    const rawRole = profileRole || metadataRole;

    const role = applicationRoleFromProfile(rawRole) || "customer";
    const identity = await ensureGoogleLocalIdentity(supabaseUser, role);

    // Create rock-solid D1 session cookie (same as local/admin login)
    await createSession(request, identity.id, true);

    // D1 is the ultimate source of truth: If user role is already elevated to store_owner or admin, onboarding is complete!
    const onboardingCompleted = Boolean(
      identity.role === "store_owner" ||
      identity.role === "admin" ||
      profile?.onboarding_completed ||
      supabaseUser.user_metadata?.onboarding_completed ||
      profile?.role_selected_at ||
      supabaseUser.user_metadata?.role_selected_at
    );

    const needsOnboarding = !onboardingCompleted;
    const redirectTo = needsOnboarding
      ? "/onboarding"
      : identity.role === "store_owner"
      ? "/owner"
      : identity.role === "admin"
      ? "/admin"
      : "/";

    return Response.json({
      user: {
        id: identity.id,
        name: identity.name,
        email: identity.email,
        role: identity.role,
        isSuperAdmin: false,
      },
      needsOnboarding,
      redirectTo,
    });
  } catch (error) {
    return apiError(error);
  }
}
