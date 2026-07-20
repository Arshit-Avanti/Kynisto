import { createSession, dashboardForRole } from "@/lib/auth";
import { apiError, assertSameOrigin } from "@/lib/security";
import {
  applicationRoleFromProfile,
  getSupabaseProfile,
  getSupabaseUser,
} from "@/lib/supabase-auth";
import { ensureGoogleLocalIdentity } from "@/lib/supabase-identity";
import { safeJson } from "@/lib/validation";

export async function POST(request: Request) {
  try {
    assertSameOrigin(request);
    const body = await safeJson(request);
    const accessToken = typeof body.accessToken === "string" ? body.accessToken : "";
    if (!accessToken) {
      throw new Error("Access token is required.");
    }

    const supabaseUser = await getSupabaseUser(accessToken);
    let profile = null;
    try {
      profile = await getSupabaseProfile(accessToken, supabaseUser.id);
    } catch {
      // Ignore profile query failure
    }

    const role = applicationRoleFromProfile(profile?.role) || "customer";
    const identity = await ensureGoogleLocalIdentity(supabaseUser, role);

    // Create rock-solid D1 session cookie (same as local/admin login)
    await createSession(request, identity.id, true);

    return Response.json({
      user: {
        id: identity.id,
        name: identity.name,
        email: identity.email,
        role: identity.role,
        isSuperAdmin: false,
      },
      redirectTo: profile?.role ? dashboardForRole(identity.role) : "/onboarding",
    });
  } catch (error) {
    return apiError(error);
  }
}
