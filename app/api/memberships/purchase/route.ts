import { NextResponse } from "next/server";
import { requireApiSession } from "@/lib/auth";
import { getD1 } from "@/db/runtime";

export async function POST(request: Request) {
  try {
    const session = await requireApiSession(request);
    if (!session?.user) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 });
    }

    const { storeId, planId, utr } = await request.json();

    if (!storeId || !planId) {
      return NextResponse.json({ error: "storeId and planId are required" }, { status: 400 });
    }

    const d1 = getD1();

    // Fetch plan details
    const plan = await d1.prepare(`
      SELECT * FROM store_membership_plans WHERE id = ? AND store_id = ? AND is_active = 1
    `).bind(planId, storeId).first<any>();

    if (!plan) {
      return NextResponse.json({ error: "Membership plan not available" }, { status: 404 });
    }

    const now = Math.floor(Date.now() / 1000);
    const membershipId = `mem_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;

    await d1.prepare(`
      INSERT INTO customer_store_memberships (
        id, store_id, plan_id, customer_id, customer_name, customer_email,
        plan_name, amount_paid, utr, status, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).bind(
      membershipId, storeId, planId, session.user.id,
      session.user.name || "Customer", session.user.email || "",
      plan.name, plan.price, utr ? String(utr).trim() : null,
      "pending_verification", now, now
    ).run();

    return NextResponse.json({
      success: true,
      membershipId,
      status: "pending_verification",
      message: "Don't panic! The shop owner will verify your payment and activate your membership within 24 hours.",
      reassuranceBanner: "Don't panic! The shop owner will verify your payment and activate your membership within 24 hours.",
      upiId: plan.upi_id || "",
      qrCodeUrl: plan.qr_code_url || "",
      planName: plan.name,
      amountPaid: plan.price
    });
  } catch (err: any) {
    console.error("POST /api/memberships/purchase error:", err);
    return NextResponse.json({ error: err instanceof Error ? err.message : "Failed to process purchase" }, { status: 500 });
  }
}
