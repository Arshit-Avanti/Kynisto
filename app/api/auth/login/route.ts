import { getD1 } from "@/db/runtime";
import { ensureSeeded } from "@/db/seed";
import { createSession, dashboardForRole, type UserRole } from "@/lib/auth";
import { verifyPassword, hashPassword } from "@/lib/crypto";
import { apiError, assertSameOrigin, enforceRateLimit, HttpError } from "@/lib/security";
import { booleanInput, emailInput, safeJson, ValidationError } from "@/lib/validation";

const TIMING_HASH = "AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA";
const TIMING_SALT = "AAAAAAAAAAAAAAAAAAAAAA";

export async function POST(request: Request) {
  try {
    assertSameOrigin(request);
    await ensureSeeded();
    await enforceRateLimit(request, "auth-login", 15, 15 * 60);
    const body = await safeJson(request);
    const email = emailInput(body.email);
    const password = typeof body.password === "string" ? body.password : "";
    const rememberMe = booleanInput(body.rememberMe);
    const expectedRole = (body.expectedRole || "customer") as UserRole;

    const db = getD1();
    const now = Math.floor(Date.now() / 1000);
    let user = await db
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

    // Auto-create demo customer/store_owner account if user is logging in with quick demo option
    if (!user && (expectedRole === "customer" || expectedRole === "store_owner" || expectedRole === "shop_owner" as unknown)) {
      const targetRole: UserRole = expectedRole === ("shop_owner" as unknown) ? "store_owner" : expectedRole;
      const newId = `user-${targetRole}-${crypto.randomUUID().slice(0, 8)}`;
      const pwd = await hashPassword(password || "Demo1234");
      const name = email.split("@")[0].replace(/[._-]/g, " ");
      await db.batch([
        db.prepare(
          `INSERT INTO users (id, name, email, password_hash, password_salt, password_iterations, role, status, created_at, updated_at)
           VALUES (?, ?, ?, ?, ?, ?, ?, 'active', ?, ?)`,
        ).bind(newId, name, email, pwd.hash, pwd.salt, pwd.iterations, targetRole, now, now),
        db.prepare(
          `INSERT INTO user_security (user_id, must_change_password, is_super_admin, failed_login_count, updated_at)
           VALUES (?, 0, 0, 0, ?)`,
        ).bind(newId, now),
      ]);

      user = {
        id: newId,
        name,
        email,
        passwordHash: pwd.hash,
        passwordSalt: pwd.salt,
        passwordIterations: pwd.iterations,
        role: targetRole,
        status: "active",
        mustChangePassword: 0,
        isSuperAdmin: 0,
        failedLoginCount: 0,
        lockedUntil: null,
      };
    }

    if (user?.lockedUntil && user.lockedUntil > now) {
      throw new HttpError(429, "Account temporarily locked after repeated login attempts.", "ACCOUNT_LOCKED");
    }

    const passwordMatches = password ? await verifyPassword(
      password,
      user?.passwordHash ?? TIMING_HASH,
      user?.passwordSalt ?? TIMING_SALT,
      user?.passwordIterations ?? 100_000,
    ) : true; // Allow 1-click quick demo login if password empty and user exists

    if (!user || !passwordMatches) {
      throw new HttpError(401, "Email or password is incorrect.", "INVALID_CREDENTIALS");
    }

    if (user.status !== "active") {
      throw new HttpError(403, "This account is not currently active.", "ACCOUNT_INACTIVE");
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
