import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { getD1 } from "@/db/runtime";
import { ensureSeeded } from "@/db/seed";
import { matchesHash, randomToken, sha256 } from "@/lib/crypto";
import { hasPermission, type Permission, type UserRole } from "@/lib/rbac";
import { HttpError, assertSameOrigin, hashedClientIp } from "@/lib/security";
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
    sameSite: "strict" as const,
    secure: new URL(request.url).protocol === "https:",
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
  rememberMe: boolean,
): Promise<void> {
  const db = getD1();
  const now = Math.floor(Date.now() / 1000);
  const maxAge = rememberMe ? 30 * DAY : DAY;
  const rawToken = randomToken(32);
  const rawCsrf = randomToken(24);
  const tokenHash = await sha256(rawToken);
  const csrfTokenHash = await sha256(rawCsrf);
  const userAgentHash = await sha256(request.headers.get("user-agent") ?? "unknown");
  const ipHash = await hashedClientIp(request);

  await db.batch([
    db.prepare("DELETE FROM sessions WHERE expires_at <= ?").bind(now),
    db
      .prepare(
        "INSERT INTO sessions (id, user_id, token_hash, csrf_token_hash, remember_me, expires_at, last_seen_at, user_agent_hash, ip_hash, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
      )
      .bind(
        crypto.randomUUID(),
        userId,
        tokenHash,
        csrfTokenHash,
        rememberMe ? 1 : 0,
        now + maxAge,
        now,
        userAgentHash,
        ipHash,
        now,
      ),
    db.prepare("UPDATE users SET last_login_at = ?, updated_at = ? WHERE id = ?").bind(now, now, userId),
  ]);

  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE, rawToken, cookieOptions(request, rememberMe ? maxAge : undefined));
  cookieStore.set(CSRF_COOKIE, rawCsrf, {
    ...cookieOptions(request, rememberMe ? maxAge : undefined),
    httpOnly: false,
    sameSite: "strict",
  });
}

export async function getSessionUser(): Promise<AuthSession | null> {
  await ensureSeeded();
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;
  const db = getD1();
  const now = Math.floor(Date.now() / 1000);
  if (token) {
    const tokenHash = await sha256(token);
    const session = await db
      .prepare(
        `SELECT
          s.id AS sessionId,
          s.csrf_token_hash AS csrfTokenHash,
          s.expires_at AS expiresAt,
          u.id, u.name, u.email, u.role, u.status, u.avatar_url AS avatarUrl,
          COALESCE(us.must_change_password, 0) AS mustChangePassword,
          COALESCE(us.is_super_admin, 0) AS isSuperAdmin
         FROM sessions s
         JOIN users u ON u.id = s.user_id
         LEFT JOIN user_security us ON us.user_id = u.id
         WHERE s.token_hash = ? AND s.expires_at > ?
         LIMIT 1`,
      )
      .bind(tokenHash, now)
      .first<{
        sessionId: string;
        csrfTokenHash: string;
        expiresAt: number;
        id: string;
        name: string;
        email: string;
        role: UserRole;
        status: SessionUser["status"];
        avatarUrl: string | null;
        mustChangePassword: number;
        isSuperAdmin: number;
      }>();

    if (session?.status === "active") {
      if (now % 5 === 0) {
        await db
          .prepare("UPDATE sessions SET last_seen_at = ? WHERE id = ?")
          .bind(now, session.sessionId)
          .run();
      }
      return {
        sessionId: session.sessionId,
        csrfTokenHash: session.csrfTokenHash,
        expiresAt: session.expiresAt,
        authentication: "local",
        user: {
          id: session.id,
          name: session.name,
          email: session.email,
          role: session.role,
          status: session.status,
          avatarUrl: session.avatarUrl,
          mustChangePassword: Boolean(session.mustChangePassword),
          isSuperAdmin: Boolean(session.isSuperAdmin),
        },
      };
    }
  }

  const encodedSupabaseToken = cookieStore.get(SUPABASE_ACCESS_COOKIE)?.value;
  if (!encodedSupabaseToken) return null;
  try {
    const accessToken = decodeURIComponent(encodedSupabaseToken);
    const supabaseUser = await getSupabaseUser(accessToken);
    const profile = await getSupabaseProfile(accessToken, supabaseUser.id);
    const role = applicationRoleFromProfile(profile?.role);
    if (!profile || !role) return null;
    const identity = await ensureGoogleLocalIdentity(supabaseUser, role);
    return {
      sessionId: `supabase:${supabaseUser.id}`,
      csrfTokenHash: "",
      expiresAt: now + 3600,
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
    sameSite: "strict",
    maxAge: 0,
  });
  cookieStore.set(SUPABASE_ACCESS_COOKIE, "", {
    ...cookieOptions(request),
    httpOnly: false,
    sameSite: "strict",
    maxAge: 0,
  });
}
