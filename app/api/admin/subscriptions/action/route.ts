import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { getD1 } from "@/db/runtime";
import { ensureSubscriptionTables, getPlanConfig, hasUserClaimedTrial, recordTrialClaim } from "@/lib/subscriptions";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const session = await getSessionUser();
  if (!session || session.user.role !== "admin") {
    return NextResponse.json({ error: "Forbidden. Admin access required." }, { status: 403 });
  }

  await ensureSubscriptionTables();
  const db = getD1();
  const body = await request.json();
  const {
    action,
    messageId,
    subscriptionId,
    subscriptionIds = [],
    userId,
    userIds = [],
    planId,
    billingCycle = "monthly",
    days = 7,
  } = body;

  if (!action) {
    return NextResponse.json({ error: "Action is required." }, { status: 400 });
  }

  const now = Math.floor(Date.now() / 1000);

  // 1. APPROVE USER PENDING SUBSCRIPTION MESSAGE (One-click Admin Grant)
  if (action === "approve_message") {
    if (!messageId) {
      return NextResponse.json({ error: "messageId is required to approve." }, { status: 400 });
    }

    const msg = await db
      .prepare(`SELECT * FROM subscription_messages WHERE id = ?`)
      .bind(messageId)
      .first<{
        id: string;
        user_id: string;
        user_name: string;
        user_role: string;
        user_email: string;
        payment_time: string;
        amount_paid: number;
        plan_id: string;
        plan_name: string;
        billing_cycle: string;
        utr: string;
        status: string;
      }>();

    if (!msg) {
      return NextResponse.json({ error: "Subscription message not found." }, { status: 404 });
    }

    const plan = getPlanConfig(msg.plan_id);
    const isYearly = msg.billing_cycle === "yearly";
    const durationSeconds = isYearly ? 365 * 86400 : 30 * 86400;
    const expiresAt = now + durationSeconds;
    const subId = `sub_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const receiptNumber = `RCP-KYN-${now}-${Math.floor(1000 + Math.random() * 9000)}`;

    // Cancel prior active subs
    await db
      .prepare(`UPDATE subscriptions SET status = 'cancelled', updated_at = ? WHERE user_id = ? AND status = 'active'`)
      .bind(now, msg.user_id)
      .run();

    // Create active subscription
    await db
      .prepare(
        `INSERT INTO subscriptions (id, user_id, user_role, plan_id, billing_cycle, amount, status, auto_renew, starts_at, expires_at, payment_method, utr, receipt_number, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, 'active', 1, ?, ?, 'upi', ?, ?, ?, ?)`
      )
      .bind(
        subId,
        msg.user_id,
        msg.user_role,
        plan.id,
        msg.billing_cycle,
        msg.amount_paid,
        now,
        expiresAt,
        msg.utr,
        receiptNumber,
        now,
        now
      )
      .run();

    // Insert transaction
    await db
      .prepare(
        `INSERT INTO subscription_transactions (id, subscription_id, user_id, plan_id, billing_cycle, amount, payment_method, utr, status, receipt_number, created_at)
         VALUES (?, ?, ?, ?, ?, ?, 'upi', ?, 'completed', ?, ?)`
      )
      .bind(
        `txn_${now}`,
        subId,
        msg.user_id,
        plan.id,
        msg.billing_cycle,
        msg.amount_paid,
        msg.utr,
        receiptNumber,
        now
      )
      .run();

    // Mark message as approved
    await db
      .prepare(`UPDATE subscription_messages SET status = 'approved', admin_notes = 'Approved by Admin' WHERE id = ?`)
      .bind(messageId)
      .run();

    // Notify User
    await db
      .prepare(
        `INSERT INTO notifications (id, user_id, audience, type, title, message, link, created_at)
         VALUES (?, ?, 'user', 'success', ?, ?, '/dashboard/subscription', ?)`
      )
      .bind(
        `notif_${now}`,
        msg.user_id,
        `🎉 Subscription Activated: Kynisto ${plan.name}`,
        `Your subscription payment has been verified and approved by Admin! Receipt #${receiptNumber}`,
        now
      )
      .run();

    return NextResponse.json({
      success: true,
      message: `Approved payment and activated ${plan.name} subscription for ${msg.user_name}.`,
    });
  }

  // 2. REJECT USER PENDING SUBSCRIPTION MESSAGE
  if (action === "reject_message") {
    if (!messageId) {
      return NextResponse.json({ error: "messageId is required to reject." }, { status: 400 });
    }

    await db
      .prepare(`UPDATE subscription_messages SET status = 'rejected', admin_notes = 'Rejected by Admin' WHERE id = ?`)
      .bind(messageId)
      .run();

    return NextResponse.json({
      success: true,
      message: "Subscription payment message rejected.",
    });
  }

  // 3. SINGLE MANUAL ACTIVATE / UPGRADE
  if (action === "activate" || action === "upgrade") {
    if (!userId || !planId) {
      return NextResponse.json({ error: "userId and planId required for activation/upgrade." }, { status: 400 });
    }

    const plan = getPlanConfig(planId);
    const durationSeconds = billingCycle === "yearly" ? 365 * 86400 : 30 * 86400;
    const expiresAt = now + durationSeconds;
    const subId = subscriptionId || `sub_admin_${now}_${Math.random().toString(36).substring(2, 7)}`;
    const receiptNumber = `RCP-ADMIN-GRANT-${now}`;
    const amount = billingCycle === "yearly" ? plan.priceYearly : plan.priceMonthly;

    await db
      .prepare(`UPDATE subscriptions SET status = 'cancelled', updated_at = ? WHERE user_id = ? AND status = 'active'`)
      .bind(now, userId)
      .run();

    await db
      .prepare(
        `INSERT INTO subscriptions (id, user_id, user_role, plan_id, billing_cycle, amount, status, auto_renew, starts_at, expires_at, payment_method, receipt_number, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, 'active', 1, ?, ?, 'admin_grant', ?, ?, ?)`
      )
      .bind(subId, userId, plan.role, plan.id, billingCycle, amount, now, expiresAt, receiptNumber, now, now)
      .run();

    await db
      .prepare(
        `INSERT INTO subscription_transactions (id, subscription_id, user_id, plan_id, billing_cycle, amount, payment_method, status, receipt_number, created_at)
         VALUES (?, ?, ?, ?, ?, ?, 'admin_grant', 'completed', ?, ?)`
      )
      .bind(`txn_admin_${now}`, subId, userId, plan.id, billingCycle, amount, receiptNumber, now)
      .run();

    return NextResponse.json({
      success: true,
      message: `Activated/Upgraded to ${plan.name} plan successfully.`,
    });
  }

  // 4. SINGLE FREE TRIAL GRANT (Enforced 1-Time Lifetime Rule)
  if (action === "grant_trial") {
    if (!userId || !planId) {
      return NextResponse.json({ error: "userId and planId required for trial grant." }, { status: 400 });
    }

    const alreadyClaimed = await hasUserClaimedTrial(userId);
    if (alreadyClaimed) {
      return NextResponse.json(
        { error: "This user has ALREADY claimed their one-time lifetime free trial! Action blocked." },
        { status: 400 }
      );
    }

    const plan = getPlanConfig(planId);
    const trialSeconds = days * 86400;
    const expiresAt = now + trialSeconds;
    const subId = `sub_trial_${now}_${Math.random().toString(36).substring(2, 7)}`;
    const receiptNumber = `RCP-TRIAL-${now}`;

    await db
      .prepare(`UPDATE subscriptions SET status = 'cancelled', updated_at = ? WHERE user_id = ? AND status IN ('active', 'trial')`)
      .bind(now, userId)
      .run();

    await db
      .prepare(
        `INSERT INTO subscriptions (id, user_id, user_role, plan_id, billing_cycle, amount, status, auto_renew, starts_at, expires_at, payment_method, receipt_number, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, 0, 'trial', 0, ?, ?, 'admin_trial', ?, ?, ?)`
      )
      .bind(subId, userId, plan.role, plan.id, billingCycle, now, expiresAt, receiptNumber, now, now)
      .run();

    // Record trial claim permanently in trial_history
    const userRow = await db.prepare("SELECT email FROM users WHERE id = ?").bind(userId).first<{ email: string }>();
    await recordTrialClaim(userId, userRow?.email || "", plan.id, days);

    return NextResponse.json({
      success: true,
      message: `Granted ${days}-day free trial of ${plan.name} plan.`,
    });
  }

  // 5. SINGLE CANCEL / DEACTIVATE
  if (action === "cancel" || action === "deactivate") {
    if (!subscriptionId) {
      return NextResponse.json({ error: "subscriptionId required." }, { status: 400 });
    }

    const newStatus = action === "cancel" ? "cancelled" : "expired";
    await db
      .prepare(`UPDATE subscriptions SET status = ?, cancelled_at = ?, updated_at = ? WHERE id = ?`)
      .bind(newStatus, now, now, subscriptionId)
      .run();

    return NextResponse.json({
      success: true,
      message: `Subscription ${action}ed successfully.`,
    });
  }

  // 6. SINGLE REFUND
  if (action === "refund") {
    if (!subscriptionId) {
      return NextResponse.json({ error: "subscriptionId required." }, { status: 400 });
    }

    const sub = await db
      .prepare(`SELECT amount, user_id FROM subscriptions WHERE id = ?`)
      .bind(subscriptionId)
      .first<{ amount: number; user_id: string }>();

    await db
      .prepare(`UPDATE subscriptions SET status = 'cancelled', cancelled_at = ?, updated_at = ? WHERE id = ?`)
      .bind(now, now, subscriptionId)
      .run();

    if (sub) {
      await db
        .prepare(`UPDATE subscription_transactions SET status = 'refunded', refunded_at = ?, refund_amount = ? WHERE subscription_id = ?`)
        .bind(now, sub.amount, subscriptionId)
        .run();
    }

    return NextResponse.json({
      success: true,
      message: "Subscription refunded and deactivated successfully.",
    });
  }

  // 7. BULK DELETE
  if (action === "bulk_delete" || action === "delete") {
    const ids: string[] = Array.isArray(subscriptionIds) && subscriptionIds.length > 0 ? subscriptionIds : (subscriptionId ? [subscriptionId] : []);
    if (ids.length === 0) {
      return NextResponse.json({ error: "subscriptionIds required for bulk delete." }, { status: 400 });
    }

    const placeholders = ids.map(() => "?").join(", ");
    await db.batch([
      db.prepare(`DELETE FROM subscriptions WHERE id IN (${placeholders})`).bind(...ids),
      db.prepare(`DELETE FROM subscription_transactions WHERE subscription_id IN (${placeholders})`).bind(...ids),
    ]);

    return NextResponse.json({
      success: true,
      message: `Successfully deleted ${ids.length} subscription record(s).`,
    });
  }

  // 8. BULK DEACTIVATE
  if (action === "bulk_deactivate") {
    const ids: string[] = Array.isArray(subscriptionIds) && subscriptionIds.length > 0 ? subscriptionIds : (subscriptionId ? [subscriptionId] : []);
    if (ids.length === 0) {
      return NextResponse.json({ error: "subscriptionIds required for bulk deactivate." }, { status: 400 });
    }

    const placeholders = ids.map(() => "?").join(", ");
    await db
      .prepare(`UPDATE subscriptions SET status = 'cancelled', cancelled_at = ?, updated_at = ? WHERE id IN (${placeholders})`)
      .bind(now, now, ...ids)
      .run();

    return NextResponse.json({
      success: true,
      message: `Successfully deactivated ${ids.length} subscription(s).`,
    });
  }

  // 9. BULK UPGRADE
  if (action === "bulk_upgrade") {
    const ids: string[] = Array.isArray(subscriptionIds) && subscriptionIds.length > 0 ? subscriptionIds : [];
    if (ids.length === 0 || !planId) {
      return NextResponse.json({ error: "subscriptionIds and planId required for bulk upgrade." }, { status: 400 });
    }

    const plan = getPlanConfig(planId);
    const durationSeconds = billingCycle === "yearly" ? 365 * 86400 : 30 * 86400;
    const expiresAt = now + durationSeconds;
    const amount = billingCycle === "yearly" ? plan.priceYearly : plan.priceMonthly;

    const placeholders = ids.map(() => "?").join(", ");
    await db
      .prepare(
        `UPDATE subscriptions SET plan_id = ?, billing_cycle = ?, amount = ?, status = 'active', starts_at = ?, expires_at = ?, updated_at = ? WHERE id IN (${placeholders})`
      )
      .bind(plan.id, billingCycle, amount, now, expiresAt, now, ...ids)
      .run();

    return NextResponse.json({
      success: true,
      message: `Bulk upgraded ${ids.length} subscription(s) to ${plan.name}.`,
    });
  }

  // 10. BULK 7-DAY FREE TRIAL
  if (action === "bulk_trial") {
    const ids: string[] = Array.isArray(subscriptionIds) && subscriptionIds.length > 0 ? subscriptionIds : [];
    if (ids.length === 0 || !planId) {
      return NextResponse.json({ error: "subscriptionIds and planId required for bulk trial." }, { status: 400 });
    }

    const plan = getPlanConfig(planId);
    const trialSeconds = days * 86400;
    const expiresAt = now + trialSeconds;

    const placeholders = ids.map(() => "?").join(", ");
    await db
      .prepare(
        `UPDATE subscriptions SET plan_id = ?, amount = 0, status = 'trial', auto_renew = 0, starts_at = ?, expires_at = ?, updated_at = ? WHERE id IN (${placeholders})`
      )
      .bind(plan.id, now, expiresAt, now, ...ids)
      .run();

    return NextResponse.json({
      success: true,
      message: `Granted ${days}-day free trial of ${plan.name} to ${ids.length} subscription(s).`,
    });
  }

  return NextResponse.json({ error: "Invalid action requested." }, { status: 400 });
}
