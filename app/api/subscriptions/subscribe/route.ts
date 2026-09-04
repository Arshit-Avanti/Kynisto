import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { getD1 } from "@/db/runtime";
import { ensureSubscriptionTables, getPlanConfig, hasUserClaimedTrial } from "@/lib/subscriptions";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const session = await getSessionUser();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized. Please log in." }, { status: 401 });
  }

  await ensureSubscriptionTables();
  const body = await request.json();
  const {
    planId,
    billingCycle = "monthly",
    utr = "",
    subscriberName = "",
    subscriberRole = "",
    subscriberEmail = "",
    paymentTime = "",
    amountPaid = 0,
  } = body;

  if (!planId) {
    return NextResponse.json({ error: "Plan ID is required." }, { status: 400 });
  }

  const plan = getPlanConfig(planId);
  if (!plan) {
    return NextResponse.json({ error: "Invalid plan selected." }, { status: 400 });
  }

  // Validate compulsory fields requested by user
  const name = subscriberName.trim() || session.user.name || "User";
  const role = subscriberRole.trim() || session.user.role || "customer";
  const email = subscriberEmail.trim() || session.user.email || "";
  const cleanUtr = utr.trim() || "MANUAL_UPI_VERIFICATION";
  const time = paymentTime.trim() || new Date().toLocaleString();
  const amount = Number(amountPaid) > 0 ? Number(amountPaid) : (billingCycle === "yearly" ? plan.priceYearly : plan.priceMonthly);

  if (!name || !email) {
    return NextResponse.json(
      { error: "Name of user and Email Address are required. Please fill out all required fields." },
      { status: 400 }
    );
  }

  // Strict Lifetime Single-Trial Enforcement (One free trial per account in their entire life)
  const isTrialRequest = amount === 0 || billingCycle === "trial" || planId.toLowerCase().includes("trial");
  if (isTrialRequest) {
    const alreadyClaimed = await hasUserClaimedTrial(session.user.id, email);
    if (alreadyClaimed) {
      return NextResponse.json(
        { error: "Free trial has ALREADY been claimed for this account. Only ONE free trial is allowed per account in a lifetime." },
        { status: 400 }
      );
    }
  }

  const db = getD1();
  const now = Math.floor(Date.now() / 1000);
  const msgId = `msg_sub_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;

  // Save Pending Verification Request Message for Admin Dashboard
  await db
    .prepare(
      `INSERT INTO subscription_messages (id, user_id, user_name, user_role, user_email, payment_time, amount_paid, plan_id, plan_name, billing_cycle, utr, status, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending', ?)`
    )
    .bind(
      msgId,
      session.user.id,
      name,
      role,
      email,
      time,
      amount,
      plan.id,
      plan.name,
      billingCycle,
      cleanUtr,
      now
    )
    .run();

  // Send Pending Status Response to User (No Instant Subscription Activation)
  return NextResponse.json({
    success: true,
    pendingApproval: true,
    message: "DON'T PANIC, ADMIN WILL GIVE YOUR SUBSCRIPTION WITHIN 24 HOURS",
    submittedData: {
      msgId,
      subscriberName: name,
      subscriberRole: role,
      subscriberEmail: email,
      paymentTime: time,
      amountPaid: amount,
      planId: plan.id,
      planName: plan.name,
      billingCycle,
      utr: cleanUtr,
    },
  });
}
