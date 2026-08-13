import { NextResponse } from "next/server";
import { createSession } from "@/lib/auth";
import { apiError, assertSameOrigin } from "@/lib/security";
import {
  applicationRoleFromProfile,
  getSupabaseProfile,
  getSupabaseUser,
} from "@/lib/supabase-auth";
import { ensureGoogleLocalIdentity } from "@/lib/supabase-identity";
import { safeJson, ValidationError } from "@/lib/validation";

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
    if (!accessToken) {
      throw new ValidationError("Access token is required.");
    }

    const supabaseUser = await getSupabaseUser(accessToken);
    let profile = null;
    try {
      profile = await getSupabaseProfile(accessToken, supabaseUser.id);
    } catch {
      // Ignore profile query failure
    }

    const metadataRole = supabaseUser.user_metadata?.role;
    const profileRole = profile?.role;
    const rawRole = profileRole || metadataRole;

    const onboardingCompleted = Boolean(
      profile?.onboarding_completed ||
      supabaseUser.user_metadata?.onboarding_completed ||
      profile?.role_selected_at ||
      supabaseUser.user_metadata?.role_selected_at
    );

    const role = applicationRoleFromProfile(rawRole) || "customer";
    const identity = await ensureGoogleLocalIdentity(supabaseUser, role);

    // Create rock-solid D1 session cookie (same as local/admin login)
    await createSession(request, identity.id, true);

    const needsOnboarding = !onboardingCompleted;
    const redirectTo = needsOnboarding
      ? "/onboarding"
      : identity.role === "store_owner"
      ? "/owner"
      : identity.role === "admin"
      ? "/admin"
      : "/";

    return NextResponse.json({
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
