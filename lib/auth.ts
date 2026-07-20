import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { getD1 } from "@/db/runtime";
import { matchesHash, sha256 } from "@/lib/crypto";
import type { Permission } from "@/lib/permissions";
import { hasPermission, type UserRole } from "@/lib/rbac";
import { assertSameOrigin, HttpError } from "@/lib/security";
import {
  applicationRoleFromProfile,
  getSupabaseProfile,
  getSupabaseUser,
} from "@/lib/supabase-auth";
import { ensureGoogleLocalIdentity } from "@/lib/supabase-identity";
import { SUPABASE_ACCESS_COOKIE } from "@/lib/supabase-session";

export const SESSION_COOKIE = "kynisto_session";
export const CSRF_COOKIE = "kynisto_csrf";

export type { UserRole } from "@/lib/rbac";

export type SessionUser = {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  status: "active" | "suspended" | "disabled" | "banned";
  avatarUrl: string | null;
  mustChangePassword: boolean;
  isSuperAdmin: boolean;
};

export type AuthSession = {
  sessionId: string;
  csrfTokenHash: string;
  expiresAt: number;
  authentication: "local" | "supabase";
  user: SessionUser;
};

const DAY = 86_400;

function cookieOptions(request: Request, maxAge?: number) {
  return {
    httpOnly: true,
    sameSite: "lax" as const,
    secure: request.headers.get("x-forwarded-proto") === "https" || new URL(request.url).protocol === "https:",
    path: "/",
    ...(maxAge ? { maxAge } : {}),
  };
}

export function dashboardForRole(role: UserRole): string {
  if (role === "admin") return "/admin";
  if (role === "store_owner") return "/owner";
  return "/account";
}

export async function createSession(
  request: Request,
  userId: string,
  rememberMe = false,
): Promise<{ session: AuthSession; csrfToken: string }> {
  const db = getD1();
  const rawToken = crypto.randomUUID() + crypto.randomUUID();
  const csrfToken = crypto.randomUUID();
  const tokenHash = await sha256(rawToken);
  const csrfTokenHash = await sha256(csrfToken);
  const now = Math.floor(Date.now() / 1000);
  const duration = rememberMe ? 30 * DAY : 7 * DAY;
  const expiresAt = now + duration;
  const sessionId = crypto.randomUUID();

  await db.batch([
    db
      .prepare("DELETE FROM sessions WHERE expires_at <= ? OR user_id = ?")
      .bind(now, userId),
    db
      .prepare(
        "INSERT INTO sessions (id, user_id, token_hash, csrf_token_hash, expires_at, created_at) VALUES (?, ?, ?, ?, ?, ?)",
      )
      .bind(sessionId, userId, tokenHash, csrfTokenHash, expiresAt, now),
    db
      .prepare("UPDATE users SET last_login_at = ? WHERE id = ?")
      .bind(now, userId),
  ]);

  const userRecord = await db
    .prepare(
      `SELECT u.id, u.name, u.email, u.role, u.status, u.avatar_url AS avatarUrl,
              s.must_change_password AS mustChangePassword,
              s.is_super_admin AS isSuperAdmin
       FROM users u
       JOIN user_security s ON s.user_id = u.id
       WHERE u.id = ?`,
    )
    .bind(userId)
    .first<{
      id: string;
      name: string;
      email: string;
      role: UserRole;
      status: "active" | "suspended" | "disabled" | "banned";
      avatarUrl: string | null;
      mustChangePassword: number;
      isSuperAdmin: number;
    }>();

  if (!userRecord) {
    throw new HttpError(404, "User record not found.", "USER_NOT_FOUND");
  }

  const sessionUser: SessionUser = {
    id: userRecord.id,
    name: userRecord.name,
    email: userRecord.email,
    role: userRecord.role,
    status: userRecord.status,
    avatarUrl: userRecord.avatarUrl,
    mustChangePassword: Boolean(userRecord.mustChangePassword),
    isSuperAdmin: Boolean(userRecord.isSuperAdmin),
  };

  const session: AuthSession = {
    sessionId,
    csrfTokenHash,
    expiresAt,
    authentication: "local",
    user: sessionUser,
  };

  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE, rawToken, cookieOptions(request, duration));
  cookieStore.set(CSRF_COOKIE, csrfToken, {
    ...cookieOptions(request, duration),
    httpOnly: false,
  });

  return { session, csrfToken };
}

export async function getSessionUser(): Promise<AuthSession | null> {
  const cookieStore = await cookies();
  const sessionToken = cookieStore.get(SESSION_COOKIE)?.value;

  if (sessionToken) {
    const tokenHash = await sha256(sessionToken);
    const now = Math.floor(Date.now() / 1000);
    const sessionRecord = await getD1()
      .prepare(
        `SELECT s.id AS sessionId, s.csrf_token_hash AS csrfTokenHash, s.expires_at AS expiresAt,
                u.id AS userId, u.name, u.email, u.role, u.status, u.avatar_url AS avatarUrl,
                sec.must_change_password AS mustChangePassword, sec.is_super_admin AS isSuperAdmin
         FROM sessions s
         JOIN users u ON u.id = s.user_id
         JOIN user_security sec ON sec.user_id = u.id
         WHERE s.token_hash = ? AND s.expires_at > ?`,
      )
      .bind(tokenHash, now)
      .first<{
        sessionId: string;
        csrfTokenHash: string;
        expiresAt: number;
        userId: string;
        name: string;
        email: string;
        role: UserRole;
        status: "active" | "suspended" | "disabled" | "banned";
        avatarUrl: string | null;
        mustChangePassword: number;
        isSuperAdmin: number;
      }>();

    if (sessionRecord && sessionRecord.status === "active") {
      return {
        sessionId: sessionRecord.sessionId,
        csrfTokenHash: sessionRecord.csrfTokenHash,
        expiresAt: sessionRecord.expiresAt,
        authentication: "local",
        user: {
          id: sessionRecord.userId,
          name: sessionRecord.name,
          email: sessionRecord.email,
          role: sessionRecord.role,
          status: sessionRecord.status,
          avatarUrl: sessionRecord.avatarUrl,
          mustChangePassword: Boolean(sessionRecord.mustChangePassword),
          isSuperAdmin: Boolean(sessionRecord.isSuperAdmin),
        },
      };
    }
  }

  const encodedSupabaseToken = cookieStore.get(SUPABASE_ACCESS_COOKIE)?.value;
  if (!encodedSupabaseToken) return null;

  try {
    const accessToken = decodeURIComponent(encodedSupabaseToken);
    const supabaseUser = await getSupabaseUser(accessToken);
    let profile = null;
    try {
      profile = await getSupabaseProfile(accessToken, supabaseUser.id);
    } catch {
      // Ignore profile read error
    }

    const role = applicationRoleFromProfile(profile?.role) || "customer";
    const identity = await ensureGoogleLocalIdentity(supabaseUser, role);

    if (identity.status !== "active") return null;

    return {
      sessionId: `supabase:${supabaseUser.id}`,
      csrfTokenHash: "",
      expiresAt: Math.floor(Date.now() / 1000) + DAY,
      authentication: "supabase",
      user: {
        id: identity.userId,
        name: identity.name,
        email: identity.email,
        role: identity.role,
        status: "active",
        avatarUrl: identity.avatarUrl,
        mustChangePassword: false,
        isSuperAdmin: false,
      },
    };
  } catch (error) {
    if (error instanceof HttpError && error.code === "ACCESS_DENIED") {
      console.warn("Kynisto Supabase session access denied", error.message);
    } else {
      console.error("Kynisto Supabase session validation failed", error);
    }
    return null;
  }
}

async function validateCsrf(request: Request, session: AuthSession): Promise<void> {
  assertSameOrigin(request);
  if (session.authentication === "supabase") return;
  const cookieStore = await cookies();
  const cookieToken = cookieStore.get(CSRF_COOKIE)?.value;
  const headerToken = request.headers.get("x-csrf-token");
  if (!cookieToken || !headerToken || cookieToken !== headerToken) {
    throw new HttpError(403, "Security token is missing or invalid.", "CSRF_FAILED");
  }
  if (!(await matchesHash(cookieToken, session.csrfTokenHash))) {
    throw new HttpError(403, "Security token is invalid.", "CSRF_FAILED");
  }
}

export async function requireApiSession(
  request: Request,
  options: { csrf?: boolean; allowPasswordChange?: boolean } = {},
): Promise<AuthSession> {
  const session = await getSessionUser();
  if (!session) throw new HttpError(401, "Please log in to continue.", "UNAUTHENTICATED");
  if (session.user.mustChangePassword && !options.allowPasswordChange) {
    throw new HttpError(
      403,
      "Change the temporary password before using protected features.",
      "PASSWORD_CHANGE_REQUIRED",
    );
  }
  if (options.csrf) await validateCsrf(request, session);
  return session;
}

export async function requireApiRole(
  request: Request,
  allowedRoles: UserRole[],
  options: { csrf?: boolean } = {},
): Promise<AuthSession> {
  const session = await requireApiSession(request, options);
  if (session.user.role !== "admin" && !allowedRoles.includes(session.user.role)) {
    throw new HttpError(403, "Access Denied", "ACCESS_DENIED");
  }
  return session;
}

export async function requireApiPermission(
  request: Request,
  permission: Permission,
  options: { csrf?: boolean } = {},
): Promise<AuthSession> {
  const session = await requireApiSession(request, options);
  if (!hasPermission(session.user.role, permission)) {
    throw new HttpError(403, "Access Denied", "ACCESS_DENIED");
  }
  return session;
}

export async function requirePageRole(
  allowedRoles: UserRole[],
  returnTo: string,
): Promise<SessionUser> {
  const session = await getSessionUser();
  if (!session) redirect(`/login?returnTo=${encodeURIComponent(returnTo)}`);
  if (session.user.mustChangePassword && returnTo !== "/change-password") {
    redirect("/change-password");
  }
  if (session.user.role !== "admin" && !allowedRoles.includes(session.user.role)) {
    redirect(`/access-denied?from=${encodeURIComponent(returnTo)}`);
  }
  return session.user;
}

export async function redirectAuthenticatedUser(): Promise<void> {
  const session = await getSessionUser();
  if (session) redirect(session.user.mustChangePassword ? "/change-password" : dashboardForRole(session.user.role));
}

export async function destroySession(request: Request): Promise<void> {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;
  if (token) {
    await getD1().prepare("DELETE FROM sessions WHERE token_hash = ?").bind(await sha256(token)).run();
  }
  cookieStore.set(SESSION_COOKIE, "", { ...cookieOptions(request), maxAge: 0 });
  cookieStore.set(CSRF_COOKIE, "", {
    ...cookieOptions(request),
    httpOnly: false,
    sameSite: "lax",
    maxAge: 0,
  });
  cookieStore.set(SUPABASE_ACCESS_COOKIE, "", {
    ...cookieOptions(request),
    httpOnly: false,
    sameSite: "lax",
    maxAge: 0,
  });
}
