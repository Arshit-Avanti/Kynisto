import { NextResponse } from "next/server";
import { requireApiSession } from "@/lib/auth";
import { getD1 } from "@/db/runtime";

async function ensurePurchaseTable(d1: any) {
  try {
    await d1.prepare(`
      CREATE TABLE IF NOT EXISTS customer_store_memberships (
        id TEXT PRIMARY KEY,
        store_id TEXT NOT NULL,
        plan_id TEXT NOT NULL,
        customer_id TEXT NOT NULL,
        customer_name TEXT,
        customer_email TEXT,
        plan_name TEXT NOT NULL,
        amount_paid REAL NOT NULL,
        utr TEXT,
        status TEXT DEFAULT 'pending_verification',
        rejection_reason TEXT,
        starts_at INTEGER,
        expires_at INTEGER,
        created_at INTEGER NOT NULL,
        updated_at INTEGER NOT NULL
      )
    `).run();
  } catch (e) {
    console.warn("Purchase table notice:", e);
  }
}

export async function POST(request: Request) {
  try {
    const session = await requireApiSession(request);
    if (!session?.user) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 });
    }

    const { storeId, planId, utr, customerName, customerEmail } = await request.json();

    if (!storeId || !planId) {
      return NextResponse.json({ error: "storeId and planId are required" }, { status: 400 });
    }

    const d1 = getD1();
    await ensurePurchaseTable(d1);

    // Fetch plan details
    const plan = await d1.prepare(`
      SELECT * FROM store_membership_plans WHERE id = ? AND store_id = ? AND is_active = 1
    `).bind(planId, storeId).first<any>();

    if (!plan) {
      return NextResponse.json({ error: "Membership plan not available" }, { status: 404 });
    }

    const now = Math.floor(Date.now() / 1000);
    const membershipId = `mem_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;

    const finalName = String(customerName || session.user.name || "Customer").trim();
    const finalEmail = String(customerEmail || session.user.email || "").trim();

    await d1.prepare(`
      INSERT INTO customer_store_memberships (
        id, store_id, plan_id, customer_id, customer_name, customer_email,
        plan_name, amount_paid, utr, status, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).bind(
      membershipId, storeId, planId, session.user.id,
      finalName, finalEmail,
      plan.name, plan.price, utr ? String(utr).trim() : null,
      "pending_verification", now, now
    ).run();

    try {
      const expiresAt = now + ((plan.duration_days || 30) * 86400);
      await d1.prepare(`
        INSERT INTO customer_memberships (
          id, user_id, store_id, plan_id, price_paid, commission_amount, store_earnings,
          includes_kynisto_premium, status, started_at, expires_at, created_at
        ) VALUES (?, ?, ?, ?, ?, 50, ?, 1, 'pending_verification', ?, ?, ?)
      `).bind(
        membershipId, session.user.id, storeId, planId, plan.price || 0, Math.max(0, (plan.price || 0) - 50), now, expiresAt, now
      ).run();
    } catch (e) {
      console.warn("Notice syncing customer_memberships:", e);
    }

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
