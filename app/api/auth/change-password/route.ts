import { createSession, dashboardForRole, requireApiSession } from "@/lib/auth";
import { getD1 } from "@/db/runtime";
import { hashPassword, verifyPassword } from "@/lib/crypto";
import { apiError, enforceRateLimit, HttpError } from "@/lib/security";
import { passwordInput, safeJson, ValidationError } from "@/lib/validation";

export async function POST(request: Request) {
  try {
    const session = await requireApiSession(request, { csrf: true, allowPasswordChange: true });
    if (session.user.role !== "admin") {
      throw new HttpError(
        403,
        "Only administrators use password authentication.",
        "ACCESS_DENIED",
      );
    }
    await enforceRateLimit(request, `password-change:${session.user.id}`, 5, 60 * 60);
    const body = await safeJson(request);
    if (typeof body.currentPassword !== "string" || body.currentPassword.length > 128) {
      throw new ValidationError("Enter your current password.");
    }
    const newPassword = passwordInput(body.newPassword);
    if (newPassword === body.currentPassword || newPassword === "Arshit") {
      throw new ValidationError("Choose a new password that is different from the temporary password.");
    }

    const db = getD1();
    const current = await db.prepare(
      `SELECT u.password_hash AS passwordHash, u.password_salt AS passwordSalt,
        u.password_iterations AS passwordIterations, s.remember_me AS rememberMe
       FROM users u JOIN sessions s ON s.user_id = u.id
       WHERE u.id = ? AND s.id = ? LIMIT 1`,
    ).bind(session.user.id, session.sessionId).first<{
      passwordHash: string;
      passwordSalt: string;
      passwordIterations: number;
      rememberMe: number;
    }>();
    if (!current || !(await verifyPassword(body.currentPassword, current.passwordHash, current.passwordSalt, current.passwordIterations))) {
      throw new HttpError(401, "Current password is incorrect.", "INVALID_CURRENT_PASSWORD");
    }

    const credentials = await hashPassword(newPassword);
    const now = Math.floor(Date.now() / 1000);
    await db.batch([
      db.prepare(
        "UPDATE users SET password_hash = ?, password_salt = ?, password_iterations = ?, updated_at = ? WHERE id = ?",
      ).bind(credentials.hash, credentials.salt, credentials.iterations, now, session.user.id),
      db.prepare(
        `INSERT INTO user_security (user_id, must_change_password, is_super_admin, password_changed_at, updated_at)
         VALUES (?, 0, ?, ?, ?)
         ON CONFLICT(user_id) DO UPDATE SET must_change_password = 0,
           password_changed_at = excluded.password_changed_at, failed_login_count = 0,
           last_failed_login_at = NULL, locked_until = NULL, updated_at = excluded.updated_at`,
      ).bind(session.user.id, session.user.isSuperAdmin ? 1 : 0, now, now),
      db.prepare("DELETE FROM sessions WHERE user_id = ?").bind(session.user.id),
      db.prepare(
        "INSERT INTO audit_logs (id, actor_id, action, entity_type, entity_id, metadata, created_at) VALUES (?, ?, 'auth.password_changed', 'user', ?, ?, ?)",
      ).bind(crypto.randomUUID(), session.user.id, session.user.id, JSON.stringify({ sessionsRevoked: true }), now),
    ]);

    await createSession(request, session.user.id, Boolean(current.rememberMe));
    return Response.json({ ok: true, redirectTo: dashboardForRole(session.user.role) });
  } catch (error) {
    return apiError(error);
  }
}
