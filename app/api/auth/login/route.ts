import { getD1 } from "@/db/runtime";
import { ensureSeeded } from "@/db/seed";
import { createSession, dashboardForRole, type UserRole } from "@/lib/auth";
import { verifyPassword } from "@/lib/crypto";
import { apiError, assertSameOrigin, enforceRateLimit, HttpError } from "@/lib/security";
import { booleanInput, emailInput, safeJson, ValidationError } from "@/lib/validation";

const TIMING_HASH = "AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA";
const TIMING_SALT = "AAAAAAAAAAAAAAAAAAAAAA";

export async function POST(request: Request) {
  try {
    assertSameOrigin(request);
    await ensureSeeded();
    await enforceRateLimit(request, "auth-login", 8, 15 * 60);
    const body = await safeJson(request);
    const email = emailInput(body.email);
    if (typeof body.password !== "string" || body.password.length < 1 || body.password.length > 128) {
      throw new ValidationError("Enter a valid password.");
    }
    const password = body.password;
    const rememberMe = booleanInput(body.rememberMe);
    const expectedRole = body.expectedRole;
    if (expectedRole !== "admin") {
      throw new HttpError(
        403,
        "Customers and Shop Owners must continue with Google.",
        "GOOGLE_REQUIRED",
      );
    }

    // The administrator path intentionally remains on Kynisto's existing
    // PBKDF2 credential and lockout flow. Supabase can never issue admin access.
    const db = getD1();
    const now = Math.floor(Date.now() / 1000);
    const user = await db
      .prepare(
        `SELECT u.id, u.name, u.email, u.password_hash AS passwordHash,
          u.password_salt AS passwordSalt, u.password_iterations AS passwordIterations,
          u.role, u.status, COALESCE(us.must_change_password, 0) AS mustChangePassword,
          COALESCE(us.is_super_admin, 0) AS isSuperAdmin,
          COALESCE(us.failed_login_count, 0) AS failedLoginCount,
          us.locked_until AS lockedUntil
         FROM users u
         LEFT JOIN user_security us ON us.user_id = u.id
         WHERE u.email = ? LIMIT 1`,
      )
      .bind(email)
      .first<{
        id: string;
        name: string;
        email: string;
        passwordHash: string;
        passwordSalt: string;
        passwordIterations: number;
        role: UserRole;
        status: string;
        mustChangePassword: number;
        isSuperAdmin: number;
        failedLoginCount: number;
        lockedUntil: number | null;
      }>();

    if (user?.lockedUntil && user.lockedUntil > now) {
      throw new HttpError(429, "Account temporarily locked after repeated login attempts.", "ACCOUNT_LOCKED");
    }

    // Always perform one PBKDF2 comparison, including for unknown addresses, to
    // avoid exposing account existence through a fast failure path.
    const passwordMatches = await verifyPassword(
      password,
      user?.passwordHash ?? TIMING_HASH,
      user?.passwordSalt ?? TIMING_SALT,
      user?.passwordIterations ?? 100_000,
    );
    if (!user || !passwordMatches) {
      if (user) {
        const security = await db.prepare(
          `INSERT INTO user_security
           (user_id, must_change_password, is_super_admin, failed_login_count, last_failed_login_at, locked_until, updated_at)
           VALUES (?, 0, 0, 1, ?, NULL, ?)
           ON CONFLICT(user_id) DO UPDATE SET
             failed_login_count = CASE
               WHEN user_security.locked_until IS NOT NULL
                 AND user_security.locked_until <= excluded.last_failed_login_at THEN 1
               ELSE user_security.failed_login_count + 1
             END,
             last_failed_login_at = excluded.last_failed_login_at,
             locked_until = CASE
               WHEN user_security.locked_until IS NOT NULL
                 AND user_security.locked_until <= excluded.last_failed_login_at THEN NULL
               WHEN user_security.failed_login_count + 1 >= 5 THEN ?
               ELSE user_security.locked_until
             END,
             updated_at = excluded.updated_at
           RETURNING failed_login_count AS failedLoginCount, locked_until AS lockedUntil`,
        ).bind(user.id, now, now, now + 15 * 60).first<{ failedLoginCount: number; lockedUntil: number | null }>();
        await db.prepare(
          "INSERT INTO audit_logs (id, actor_id, action, entity_type, entity_id, metadata, created_at) VALUES (?, NULL, 'auth.login_failed', 'user', ?, ?, ?)",
        ).bind(crypto.randomUUID(), user.id, JSON.stringify({ failedLoginCount: security?.failedLoginCount ?? 1, locked: Boolean(security?.lockedUntil) }), now).run();
      }
      throw new HttpError(401, "Email or password is incorrect.", "INVALID_CREDENTIALS");
    }
    if (user.status !== "active") {
      throw new HttpError(403, "This account is not currently active.", "ACCOUNT_INACTIVE");
    }
    if (user.role !== "admin") {
      await db.prepare(
        "INSERT INTO audit_logs (id, actor_id, action, entity_type, entity_id, metadata, created_at) VALUES (?, ?, 'auth.role_mismatch', 'user', ?, ?, ?)",
      ).bind(crypto.randomUUID(), user.id, user.id, JSON.stringify({ expectedRole: "admin", actualRole: user.role }), now).run();
      throw new HttpError(403, "Access Denied: this account belongs to a different workspace.", "ROLE_MISMATCH");
    }

    const unlocked = await db.prepare(
      `INSERT INTO user_security
       (user_id, must_change_password, is_super_admin, failed_login_count, last_failed_login_at, locked_until, updated_at)
       VALUES (?, 0, 0, 0, NULL, NULL, ?)
       ON CONFLICT(user_id) DO UPDATE SET
         failed_login_count = 0, last_failed_login_at = NULL,
         locked_until = NULL, updated_at = excluded.updated_at
       WHERE user_security.locked_until IS NULL OR user_security.locked_until <= ?
       RETURNING user_id AS userId`,
    ).bind(user.id, now, now).first<{ userId: string }>();
    if (!unlocked) {
      throw new HttpError(429, "Account temporarily locked after repeated login attempts.", "ACCOUNT_LOCKED");
    }
    await createSession(request, user.id, rememberMe);
    const requiresPasswordChange = Boolean(user.mustChangePassword);
    return Response.json({
      user: { id: user.id, name: user.name, email: user.email, role: user.role, isSuperAdmin: Boolean(user.isSuperAdmin) },
      requiresPasswordChange,
      redirectTo: requiresPasswordChange ? "/change-password" : dashboardForRole(user.role),
    });
  } catch (error) {
    return apiError(error);
  }
}
