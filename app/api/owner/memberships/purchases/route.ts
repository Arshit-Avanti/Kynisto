import { NextResponse } from "next/server";
import { requireApiSession } from "@/lib/auth";
import { getD1 } from "@/db/runtime";
import { getDb } from "@/db";
import { kynistoWallets, kynistoPointTransactions } from "@/db/schema";
import { eq } from "drizzle-orm";

async function ensurePurchaseTable() {
  try {
    const d1 = getD1();
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

    await d1.prepare(`
      CREATE TABLE IF NOT EXISTS customer_wallet_coupons (
        id TEXT PRIMARY KEY,
        customer_id TEXT NOT NULL,
        store_id TEXT NOT NULL,
        coupon_id TEXT NOT NULL,
        unlocked_via TEXT,
        created_at INTEGER NOT NULL
      )
    `).run();
  } catch (e) {
    console.warn("Purchase table notice:", e);
  }
}

export async function GET(req: Request) {
  try {
    await ensurePurchaseTable();
    const session = await requireApiSession(req);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const storeId = searchParams.get("storeId");
    if (!storeId) {
      return NextResponse.json({ purchases: [] });
    }

    const d1 = getD1();
    const result = await d1.prepare(`
      SELECT * FROM customer_store_memberships
      WHERE store_id = ?
      ORDER BY created_at DESC
    `).bind(storeId).all();

    const purchases = (result.results ?? []).map((p: any) => ({
      id: p.id,
      storeId: p.store_id,
      planId: p.plan_id,
      customerId: p.customer_id,
      customerName: p.customer_name || "Customer",
      customerEmail: p.customer_email || "",
      planName: p.plan_name,
      amountPaid: p.amount_paid,
      utr: p.utr,
      status: p.status,
      rejectionReason: p.rejection_reason,
      startsAt: p.starts_at,
      expiresAt: p.expires_at,
      createdAt: p.created_at,
      updatedAt: p.updated_at
    }));

    return NextResponse.json({ purchases });
  } catch (err) {
    console.error("GET /api/owner/memberships/purchases error:", err);
    return NextResponse.json({ purchases: [] });
  }
}

export async function POST(req: Request) {
  try {
    await ensurePurchaseTable();
    const session = await requireApiSession(req);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { purchaseId, action, rejectionReason } = await req.json();
    if (!purchaseId || !action) {
      return NextResponse.json({ error: "purchaseId and action are required" }, { status: 400 });
    }

    const d1 = getD1();
    const existing = await d1.prepare(`
      SELECT * FROM customer_store_memberships WHERE id = ?
    `).bind(purchaseId).first<any>();

    if (!existing) {
      return NextResponse.json({ error: "Purchase request not found" }, { status: 404 });
    }

    const now = Math.floor(Date.now() / 1000);

    if (action === "accept") {
      // Get plan duration
      let durationDays = 30;
      let linkedCouponIds: string[] = [];
      try {
        const planObj = await d1.prepare(`
          SELECT duration_days, linked_coupon_ids FROM store_membership_plans WHERE id = ?
        `).bind(existing.plan_id).first<any>();
        if (planObj) {
          durationDays = Number(planObj.duration_days) || 30;
          if (planObj.linked_coupon_ids) {
            linkedCouponIds = typeof planObj.linked_coupon_ids === "string" ? JSON.parse(planObj.linked_coupon_ids) : planObj.linked_coupon_ids;
          }
        }
      } catch (e) {
        console.warn("Error fetching plan details:", e);
      }

      const startsAt = now;
      const expiresAt = now + (durationDays * 86400);

      // 1. Update customer_store_memberships
      await d1.prepare(`
        UPDATE customer_store_memberships
        SET status = 'active', starts_at = ?, expires_at = ?, updated_at = ?
        WHERE id = ?
      `).bind(startsAt, expiresAt, now, purchaseId).run();

      // 2. Also insert/update into customer_memberships table
      try {
        await d1.prepare(`
          INSERT INTO customer_memberships (
            id, user_id, store_id, plan_id, price_paid, commission_amount, store_earnings,
            includes_kynisto_premium, status, started_at, expires_at, created_at
          ) VALUES (?, ?, ?, ?, ?, 50, ?, 1, 'active', ?, ?, ?)
          ON CONFLICT(id) DO UPDATE SET status = 'active', expires_at = excluded.expires_at
        `).bind(
          existing.id,
          existing.customer_id,
          existing.store_id,
          existing.plan_id,
          existing.amount_paid || 0,
          Math.max(0, (existing.amount_paid || 0) - 50),
          startsAt,
          expiresAt,
          now
        ).run();
      } catch (e) {
        console.warn("Notice syncing customer_memberships:", e);
      }

      // Unlock linked store coupons as loyalty rewards
      if (Array.isArray(linkedCouponIds) && linkedCouponIds.length > 0) {
        for (const couponId of linkedCouponIds) {
          try {
            const rewardId = `wcoupon_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
            await d1.prepare(`
              INSERT INTO customer_wallet_coupons (id, customer_id, store_id, coupon_id, unlocked_via, created_at)
              VALUES (?, ?, ?, ?, ?, ?)
            `).bind(rewardId, existing.customer_id, existing.store_id, couponId, `membership:${existing.plan_name}`, now).run();
          } catch (e) {
            console.warn("Coupon unlock notice:", e);
          }
        }
      }

      return NextResponse.json({ success: true, status: "active", message: "Membership accepted & activated successfully!" });
    } else if (action === "reject") {
      await d1.prepare(`
        UPDATE customer_store_memberships
        SET status = 'rejected', rejection_reason = ?, updated_at = ?
        WHERE id = ?
      `).bind(rejectionReason ? String(rejectionReason) : "Verification failed", now, purchaseId).run();

      return NextResponse.json({ success: true, status: "rejected", message: "Membership request rejected." });
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch (err: any) {
    console.error("POST /api/owner/memberships/purchases error:", err);
    return NextResponse.json({ error: err instanceof Error ? err.message : "Failed to process request" }, { status: 400 });
  }
}
