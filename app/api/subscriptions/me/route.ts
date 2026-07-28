import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { getD1 } from "@/db/runtime";
import { ensureSubscriptionTables, getPlanConfig } from "@/lib/subscriptions";

export const dynamic = "force-dynamic";

export async function GET() {
  const session = await getSessionUser();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  await ensureSubscriptionTables();
  const db = getD1();
  const now = Math.floor(Date.now() / 1000);

  // Fetch active subscription for user
  const sub = await db
    .prepare(
      `SELECT id, user_id AS userId, store_id AS storeId, user_role AS userRole, plan_id AS planId, billing_cycle AS billingCycle, amount, status, auto_renew AS autoRenew, starts_at AS startsAt, expires_at AS expiresAt, cancelled_at AS cancelledAt, payment_method AS paymentMethod, utr, receipt_number AS receiptNumber, created_at AS createdAt
       FROM subscriptions
       WHERE user_id = ? AND status = 'active'
       ORDER BY expires_at DESC
       LIMIT 1`
    )
    .bind(session.user.id)
    .first<{
      id: string;
      userId: string;
      storeId?: string;
      userRole: "customer" | "store_owner";
      planId: string;
      billingCycle: "monthly" | "yearly";
      amount: number;
      status: string;
      autoRenew: number;
      startsAt: number;
      expiresAt: number;
      cancelledAt?: number;
      paymentMethod: string;
      utr?: string;
      receiptNumber?: string;
      createdAt: number;
    }>();

  // If no active subscription exists, assign default free plan (free for customer, starter for shop_owner)
  const defaultPlanId = session.user.role === "store_owner" ? "starter" : "free";
  const planId = sub && sub.expiresAt > now ? sub.planId : defaultPlanId;
  const activePlan = getPlanConfig(planId);

  // Fetch transaction history for user
  const txnsResult = await db
    .prepare(
      `SELECT id, subscription_id AS subscriptionId, plan_id AS planId, billing_cycle AS billingCycle, amount, payment_method AS paymentMethod, upi_id AS upiId, utr, status, receipt_number AS receiptNumber, refunded_at AS refundedAt, refund_amount AS refundAmount, created_at AS createdAt
       FROM subscription_transactions
       WHERE user_id = ?
       ORDER BY created_at DESC
       LIMIT 50`
    )
    .bind(session.user.id)
    .all();

  return NextResponse.json({
    subscription: sub
      ? {
          ...sub,
          autoRenew: Boolean(sub.autoRenew),
          isExpired: sub.expiresAt <= now,
        }
      : {
          id: `sub_default_${session.user.id}`,
          userId: session.user.id,
          userRole: session.user.role,
          planId: defaultPlanId,
          billingCycle: "monthly",
          amount: 0,
          status: "active",
          autoRenew: true,
          startsAt: now,
          expiresAt: now + 365 * 86400,
          paymentMethod: "default",
          receiptNumber: `RCP-KYN-FREE`,
          createdAt: now,
          isExpired: false,
        },
    plan: activePlan,
    transactions: txnsResult.results || [],
  });
}
