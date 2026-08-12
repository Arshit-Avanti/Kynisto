import { NextResponse } from "next/server";
import { requireApiSession } from "@/lib/auth";
import { getD1 } from "@/db/runtime";
import { getDb } from "@/db";
import { kynistoWallets, kynistoPointTransactions } from "@/db/schema";
import { eq } from "drizzle-orm";

// ---------------------------------------------------------------------------
// Helper: write an in-app notification to user_notifications
// ---------------------------------------------------------------------------
async function notifyCustomer(
  d1: ReturnType<typeof getD1>,
  opts: {
    customerId: string;
    type: string;
    title: string;
    body: string;
    metadata?: Record<string, string>;
  }
) {
  try {
    await d1.prepare(`
      CREATE TABLE IF NOT EXISTS user_notifications (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL,
        type TEXT NOT NULL DEFAULT 'system',
        title TEXT NOT NULL,
        body TEXT NOT NULL,
        is_read INTEGER NOT NULL DEFAULT 0,
        metadata TEXT,
        created_at INTEGER NOT NULL
      )
    `).run();
    const id = `notif_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
    await d1
      .prepare(
        `INSERT INTO user_notifications (id, user_id, type, title, body, is_read, metadata, created_at)
         VALUES (?, ?, ?, ?, ?, 0, ?, ?)`
      )
      .bind(
        id,
        opts.customerId,
        opts.type,
        opts.title,
        opts.body,
        opts.metadata ? JSON.stringify(opts.metadata) : null,
        Math.floor(Date.now() / 1000)
      )
      .run();
  } catch (e) {
    console.warn("notifyCustomer warning:", e);
  }
}

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

    const { purchaseId, action, rejectionReason, refundNote: refundNoteParam } = await req.json();
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
      const rejectReason = rejectionReason ? String(rejectionReason) : "Verification failed";
      await d1.prepare(`
        UPDATE customer_store_memberships
        SET status = 'rejected', rejection_reason = ?, updated_at = ?
        WHERE id = ?
      `).bind(rejectReason, now, purchaseId).run();

      // Notify customer
      await notifyCustomer(d1, {
        customerId: existing.customer_id,
        type: "membership_rejected",
        title: "\u274C Membership Request Rejected",
        body: `Your request for the "${existing.plan_name}" membership was not approved. Reason: ${rejectReason}. If you believe this is an error, please contact the store directly.`,
        metadata: { planName: existing.plan_name, storeId: existing.store_id, reason: rejectReason },
      });

      return NextResponse.json({ success: true, status: "rejected", message: "Membership request rejected." });
    } else if (action === "revoke" || action === "cancel") {
      const reason = rejectionReason ? String(rejectionReason) : "Cancelled by store owner";
      const refundNote = refundNoteParam ? String(refundNoteParam) : "";
      await d1.prepare(`
        UPDATE customer_store_memberships
        SET status = 'cancelled_by_owner', rejection_reason = ?, updated_at = ?
        WHERE id = ?
      `).bind(reason, now, purchaseId).run();

      try {
        await d1.prepare(`
          UPDATE customer_memberships
          SET status = 'cancelled_by_owner', updated_at = ?
          WHERE id = ?
        `).bind(now, purchaseId).run();
      } catch (e) {
        console.warn("Notice updating legacy memberships:", e);
      }

      // Notify customer
      const revokeBody = refundNote
        ? `Your "${existing.plan_name}" VIP membership has been cancelled by the store owner. Reason: ${reason}. Refund info: ${refundNote}`
        : `Your "${existing.plan_name}" VIP membership has been cancelled by the store owner. Reason: ${reason}`;
      await notifyCustomer(d1, {
        customerId: existing.customer_id,
        type: "membership_cancelled",
        title: "\uD83D\uDEAB Your VIP Membership Was Cancelled",
        body: revokeBody,
        metadata: { planName: existing.plan_name, storeId: existing.store_id, reason, refundNote },
      });

      return NextResponse.json({ success: true, status: "cancelled_by_owner", message: "Customer membership cancelled/revoked. User has been informed in their wallet." });
    } else if (action === "delete") {
      // Capture data BEFORE deleting so we can notify
      const refundNote = refundNoteParam ? String(refundNoteParam) : "";

      // Notify first, then delete
      await notifyCustomer(d1, {
        customerId: existing.customer_id,
        type: "membership_deleted",
        title: "\uD83D\uDDD1\uFE0F Membership Record Removed",
        body: refundNote
          ? `Your "${existing.plan_name}" membership record has been permanently removed by the store. Refund info: ${refundNote}`
          : `Your "${existing.plan_name}" membership record has been permanently removed by the store.`,
        metadata: { planName: existing.plan_name, storeId: existing.store_id, refundNote },
      });

      await d1.prepare(`
        DELETE FROM customer_store_memberships WHERE id = ?
      `).bind(purchaseId).run();

      try {
        await d1.prepare(`
          DELETE FROM customer_memberships WHERE id = ?
        `).bind(purchaseId).run();
      } catch {
        // ignore
      }

      return NextResponse.json({ success: true, status: "deleted", message: "Customer membership record permanently deleted." });
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch (err: any) {
    console.error("POST /api/owner/memberships/purchases error:", err);
    return NextResponse.json({ error: err instanceof Error ? err.message : "Failed to process request" }, { status: 400 });
  }
}
