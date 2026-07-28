import { NextResponse } from "next/server";
import { requireApiSession } from "@/lib/auth";
import { hashPassword } from "@/lib/crypto";
import { getD1 } from "@/db/runtime";
import { apiError, HttpError } from "@/lib/security";
import { safeJson, ValidationError } from "@/lib/validation";
import type { UserRole } from "@/lib/rbac";

/**
 * POST /api/auth/onboarding/complete
 *
 * Accepts: { role: "customer" | "shop_owner", password: string, confirmPassword: string }
 * Returns: { username, role, email }
 *
 * Atomically generates a unique username (kynshop1001+, kyncus1001+),
 * hashes the password, and updates the user record.
 */
export async function POST(request: Request) {
  try {
    const session = await requireApiSession(request, { csrf: true });
    const body = await safeJson(request);

    // Validate role
    const role = body.role;
    if (role !== "customer" && role !== "shop_owner") {
      throw new ValidationError("Role must be 'customer' or 'shop_owner'.");
    }

    // Validate password
    const password = typeof body.password === "string" ? body.password : "";
    const confirmPassword = typeof body.confirmPassword === "string" ? body.confirmPassword : "";
    if (!password || password.length < 8) {
      throw new ValidationError("Password must be at least 8 characters.");
    }
    if (password.length > 128) {
      throw new ValidationError("Password must not exceed 128 characters.");
    }
    if (password !== confirmPassword) {
      throw new ValidationError("Passwords do not match.");
    }

    const db = getD1();
    const now = Math.floor(Date.now() / 1000);
    const userId = session.user.id;

    // Check if user already has a username (returning user shouldn't re-onboard)
    const existingUser = await db
      .prepare("SELECT username, role FROM users WHERE id = ?")
      .bind(userId)
      .first<{ username: string | null; role: string }>();

    if (existingUser?.username) {
      // Already onboarded — return existing data
      return NextResponse.json({
        username: existingUser.username,
        role: existingUser.role,
        email: session.user.email,
        alreadyOnboarded: true,
      });
    }

    // Determine username prefix
    const dbRole: UserRole = role === "shop_owner" ? "store_owner" : "customer";
    const prefix = role === "shop_owner" ? "kynshop" : "kyncus";

    // Atomically increment the counter and generate unique username
    // Use UPDATE ... RETURNING for atomic increment
    let counterResult = await db
      .prepare(
        "UPDATE username_counters SET last_number = last_number + 1 WHERE prefix = ? RETURNING last_number",
      )
      .bind(prefix)
      .first<{ last_number: number }>();

    if (!counterResult) {
      // Auto-seed table if prefix counter row is unseeded
      await db
        .prepare("INSERT OR IGNORE INTO username_counters (prefix, last_number) VALUES (?, 1000)")
        .bind(prefix)
        .run();
      counterResult = await db
        .prepare(
          "UPDATE username_counters SET last_number = last_number + 1 WHERE prefix = ? RETURNING last_number",
        )
        .bind(prefix)
        .first<{ last_number: number }>();
    }

    if (!counterResult) {
      throw new HttpError(500, "Username counter not found.", "COUNTER_MISSING");
    }

    const username = `${prefix}${counterResult.last_number}`;

    // Hash the password using PBKDF2
    const passwordData = await hashPassword(password);

    // Update user record with username, password, and role
    await db.batch([
      db
        .prepare(
          `UPDATE users 
           SET username = ?, password_hash = ?, password_salt = ?, password_iterations = ?, 
               role = ?, updated_at = ? 
           WHERE id = ?`,
        )
        .bind(
          username,
          passwordData.hash,
          passwordData.salt,
          passwordData.iterations,
          dbRole,
          now,
          userId,
        ),
      db
        .prepare(
          `INSERT INTO audit_logs (id, actor_id, action, entity_type, entity_id, metadata, created_at) 
           VALUES (?, ?, 'auth.onboarding_completed', 'user', ?, ?, ?)`,
        )
        .bind(
          crypto.randomUUID(),
          userId,
          userId,
          JSON.stringify({ role: dbRole, username }),
          now,
        ),
    ]);

    return NextResponse.json({
      username,
      role: dbRole,
      email: session.user.email,
      alreadyOnboarded: false,
    });
  } catch (error) {
    return apiError(error);
  }
}
