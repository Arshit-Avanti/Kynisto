import { NextResponse } from "next/server";
import { requireApiSession, createSession } from "@/lib/auth";
import { getD1 } from "@/db/runtime";
import { apiError, HttpError } from "@/lib/security";
import { safeJson } from "@/lib/validation";
import type { UserRole } from "@/lib/rbac";
import { ensureSubscriptionTables } from "@/lib/subscriptions";

export async function POST(request: Request) {
  try {
    await ensureSubscriptionTables();
    const session = await requireApiSession(request, { csrf: false });
    const userId = session.user.id;
    const body = (await safeJson(request).catch(() => ({}))) as Record<string, unknown>;

    const db = getD1();
    const currentUser = await db
      .prepare("SELECT id, email, role FROM users WHERE id = ? LIMIT 1")
      .bind(userId)
      .first<{ id: string; email: string; role: UserRole }>();

    if (!currentUser) throw new HttpError(404, "User not found.");

    const requestedRole = typeof body.targetRole === "string" ? body.targetRole : "";
    const targetRole: UserRole =
      requestedRole === "store_owner" || requestedRole === "shop_owner"
        ? "store_owner"
        : requestedRole === "customer"
        ? "customer"
        : currentUser.role === "customer"
        ? "store_owner"
        : "customer";

    const now = Math.floor(Date.now() / 1000);
    const isAdminEmail = currentUser.email.toLowerCase().trim() === "nxt.arshit@gmail.com";

    // 1. Update D1 users table role
    await db.prepare("UPDATE users SET role = ?, updated_at = ? WHERE id = ?").bind(targetRole, now, userId).run();

    if (isAdminEmail) {
      await db.prepare("UPDATE user_security SET is_super_admin = 1, updated_at = ? WHERE user_id = ?").bind(now, userId).run();
    }

    let grantedMaxTierTrial = false;
    let trialDays = 0;

    // 2. Lifetime 1-Month Max Tier Subscription Grant ("Once in entire life")
    if (targetRole === "store_owner") {
      const existingTrial = await db
        .prepare("SELECT id FROM trial_history WHERE user_id = ? OR email = ? LIMIT 1")
        .bind(userId, currentUser.email)
        .first<{ id: string }>();

      if (!existingTrial) {
        grantedMaxTierTrial = true;
        trialDays = 30;
        const trialStartedAt = now;
        const trialEndedAt = now + 30 * 86400; // 30 Days (1 Month)

        // Insert into trial_history to record lifetime single-use
        await db
          .prepare(
            "INSERT INTO trial_history (id, user_id, email, plan_id, trial_started_at, trial_ended_at, created_at) VALUES (?, ?, ?, 'enterprise', ?, ?, ?)"
          )
          .bind(crypto.randomUUID(), userId, currentUser.email, trialStartedAt, trialEndedAt, now)
          .run();

        // Upsert into owner_subscriptions for 1 Month Max Tier (ENTERPRISE / PRO MAX)
        await db
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
          .bind(crypto.randomUUID(), userId, trialStartedAt, trialEndedAt, now, now)
          .run();

        // Log audit
        await db
          .prepare(
            "INSERT INTO audit_logs (id, actor_id, action, entity_type, entity_id, metadata, created_at) VALUES (?, ?, 'subscription.max_tier_trial_granted', 'user', ?, ?, ?)"
          )
          .bind(
            crypto.randomUUID(),
            userId,
            userId,
            JSON.stringify({ plan: "enterprise", trialDays: 30, lifetimeSingleUse: true }),
            now
          )
          .run();
      }
    }

    // 3. Re-issue current D1 session so new role is active immediately
    await createSession(request, userId, true);

    const redirectTo = targetRole === "store_owner" ? "/owner" : "/";

    return NextResponse.json({
      success: true,
      role: targetRole,
      grantedMaxTierTrial,
      trialDays,
      redirectTo,
    });
  } catch (error) {
    return apiError(error);
  }
}
