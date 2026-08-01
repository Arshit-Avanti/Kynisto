import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { getD1 } from "@/db/runtime";
import { ensureSubscriptionTables, ALL_PLANS } from "@/lib/subscriptions";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const session = await getSessionUser();
  if (!session || session.user.role !== "admin") {
    return NextResponse.json({ error: "Forbidden. Admin access required." }, { status: 403 });
  }

  await ensureSubscriptionTables();
  const db = getD1();
  const { searchParams } = new URL(request.url);

  const query = (searchParams.get("q") || "").trim().toLowerCase();
  const planFilter = searchParams.get("plan") || "all";
  const statusFilter = searchParams.get("status") || "all";
  const roleFilter = searchParams.get("role") || "all";

  // Fetch pending subscription messages from users
  const messagesResult = await db
    .prepare(
      `SELECT id, user_id AS userId, user_name AS userName, user_role AS userRole, user_email AS userEmail, payment_time AS paymentTime, amount_paid AS amountPaid, plan_id AS planId, plan_name AS planName, billing_cycle AS billingCycle, utr, status, created_at AS createdAt
       FROM subscription_messages
       ORDER BY created_at DESC`
    )
    .all<{
      id: string;
      userId: string;
      userName: string;
      userRole: string;
      userEmail: string;
      paymentTime: string;
      amountPaid: number;
      planId: string;
      planName: string;
      billingCycle: string;
      utr: string;
      status: string;
      createdAt: number;
    }>();

  const pendingMessages = messagesResult.results || [];

  // Fetch all subscriptions with user details
  const subsResult = await db
    .prepare(
      `SELECT s.id, s.user_id AS userId, u.name AS userName, u.email AS userEmail, u.role AS userRole, s.plan_id AS planId, s.billing_cycle AS billingCycle, s.amount, s.status, s.auto_renew AS autoRenew, s.starts_at AS startsAt, s.expires_at AS expiresAt, s.cancelled_at AS cancelledAt, s.payment_method AS paymentMethod, s.utr, s.receipt_number AS receiptNumber, s.created_at AS createdAt
       FROM subscriptions s
       LEFT JOIN users u ON u.id = s.user_id
       ORDER BY s.created_at DESC`
    )
    .all<{
      id: string;
      userId: string;
      userName: string;
      userEmail: string;
      userRole: "admin" | "store_owner" | "customer";
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

  const allSubs = subsResult.results || [];

  // Filter subscriptions
  const filteredSubs = allSubs.filter((sub) => {
    const matchesQuery =
      !query ||
      (sub.userName && sub.userName.toLowerCase().includes(query)) ||
      (sub.userEmail && sub.userEmail.toLowerCase().includes(query)) ||
      (sub.utr && sub.utr.toLowerCase().includes(query)) ||
      (sub.receiptNumber && sub.receiptNumber.toLowerCase().includes(query));

    const matchesPlan = planFilter === "all" || sub.planId === planFilter;
    const matchesStatus = statusFilter === "all" || sub.status === statusFilter;
    const matchesRole = roleFilter === "all" || sub.userRole === roleFilter;

    return matchesQuery && matchesPlan && matchesStatus && matchesRole;
  });

  // Calculate MRR (Monthly Recurring Revenue) & Total Analytics
  let mrr = 0;
  let totalRevenue = 0;
  let activeCustomerSubsCount = 0;
  let activeShopOwnerSubsCount = 0;

  const planBreakdown: Record<string, { count: number; revenue: number }> = {};
  Object.keys(ALL_PLANS).forEach((planKey) => {
    planBreakdown[planKey] = { count: 0, revenue: 0 };
  });

  allSubs.forEach((sub) => {
    if (sub.status === "active") {
      const monthlyAmount = sub.billingCycle === "yearly" ? sub.amount / 12 : sub.amount;
      mrr += monthlyAmount;
      totalRevenue += sub.amount;

      if (sub.userRole === "store_owner") activeShopOwnerSubsCount++;
      else activeCustomerSubsCount++;

      if (planBreakdown[sub.planId]) {
        planBreakdown[sub.planId].count++;
        planBreakdown[sub.planId].revenue += sub.amount;
      }
    }
  });

  return NextResponse.json({
    pendingMessages,
    subscriptions: filteredSubs,
    analytics: {
      mrr: Math.round(mrr),
      totalRevenue: Math.round(totalRevenue),
      activeSubscribersTotal: activeCustomerSubsCount + activeShopOwnerSubsCount,
      activeCustomerCount: activeCustomerSubsCount,
      activeShopOwnerCount: activeShopOwnerSubsCount,
      planBreakdown,
    },
  });
}
