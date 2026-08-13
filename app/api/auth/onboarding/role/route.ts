import { NextResponse } from "next/server";
import { requireApiSession } from "@/lib/auth";
import { getD1 } from "@/db/runtime";
import { apiError } from "@/lib/security";
import { safeJson, ValidationError } from "@/lib/validation";
import type { UserRole } from "@/lib/rbac";

export async function POST(request: Request) {
  try {
    const session = await requireApiSession(request, { csrf: false });
    const body = (await safeJson(request)) as Record<string, unknown>;

    const inputRole = typeof body.role === "string" ? body.role : "";
    if (inputRole !== "customer" && inputRole !== "shop_owner" && inputRole !== "store_owner") {
      throw new ValidationError("Invalid role specified.");
    }

    const dbRole: UserRole = (inputRole === "shop_owner" || inputRole === "store_owner") ? "store_owner" : "customer";
    const db = getD1();
    const now = Math.floor(Date.now() / 1000);
    const userId = session.user.id;

    let grantedMaxTierTrial = false;

    // VERY IMPORTANT: Actually save the selected role to the users table!
    await db.prepare("UPDATE users SET role = ?, updated_at = ? WHERE id = ?")
      .bind(dbRole, now, userId)
      .run();

    // If they already have an active Supabase session, this won't invalidate it,
    // but getSessionUser() joins against users.role, so the next read will see the new role.


    if (dbRole === "store_owner") {
      const { ensureSubscriptionTables } = await import("@/lib/subscriptions");
      await ensureSubscriptionTables();

      const existingTrial = await db
        .prepare("SELECT id FROM trial_history WHERE user_id = ? OR email = ? LIMIT 1")
        .bind(userId, session.user.email)
        .first<{ id: string }>();

      if (!existingTrial) {
        grantedMaxTierTrial = true;
        const trialStartedAt = now;
        const trialEndedAt = now + 30 * 86400; // 30 Days (1 Month)

        await db.batch([
          db
            .prepare(
              "INSERT INTO trial_history (id, user_id, email, plan_id, trial_started_at, trial_ended_at, created_at) VALUES (?, ?, ?, 'enterprise', ?, ?, ?)"
            )
            .bind(crypto.randomUUID(), userId, session.user.email, trialStartedAt, trialEndedAt, now),
          db
            .prepare(
              `INSERT INTO owner_subscriptions (id, user_id, role, plan, price, billing_cycle, status, start_date, expiry_date, trial, auto_renew, created_at, updated_at)
               VALUES (?, ?, 'store_owner', 'enterprise', 0, 'monthly', 'active', ?, ?, 1, 0, ?, ?)
               ON CONFLICT(user_id) DO UPDATE SET
                 plan = 'enterprise',
                 status = 'active',
                 start_date = excluded.start_date,
                 expiry_date = excluded.expiry_date,
                 trial = 1,
                 updated_at = excluded.updated_at`
            )
            .bind(crypto.randomUUID(), userId, trialStartedAt, trialEndedAt, now, now),
        ]);
      }
    }

    const redirectTo = dbRole === "store_owner" ? "/owner" : "/";
    return NextResponse.json({
      success: true,
      role: dbRole,
      grantedMaxTierTrial,
      redirectTo,
    });
  } catch (error) {
    return apiError(error);
  }
}
