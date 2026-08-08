import { NextResponse } from "next/server";
import { requireApiPermission } from "@/lib/auth";
import { getD1 } from "@/db/runtime";
import { apiError } from "@/lib/security";

async function ensureTables(d1: any) {
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
    console.warn("Table notice:", e);
  }
}

export async function GET(request: Request) {
  try {
    await requireApiPermission(request, "admin.dashboard");
    const d1 = getD1();
    await ensureTables(d1);

    const { searchParams } = new URL(request.url);
    const query = searchParams.get("query") || "";
    const status = searchParams.get("status") || "";
    const storeId = searchParams.get("storeId") || "";

    let sql = `
      SELECT csm.*, s.name as store_name, u.email as user_email
      FROM customer_store_memberships csm
      LEFT JOIN stores s ON s.id = csm.store_id
      LEFT JOIN users u ON u.id = csm.customer_id
      WHERE 1=1
    `;
    const params: any[] = [];

    if (query) {
      sql += ` AND (LOWER(csm.customer_name) LIKE ? OR LOWER(csm.customer_email) LIKE ? OR LOWER(csm.plan_name) LIKE ? OR LOWER(s.name) LIKE ? OR csm.utr LIKE ?)`;
      const pattern = `%${query.toLowerCase().trim()}%`;
      params.push(pattern, pattern, pattern, pattern, pattern);
    }

    if (status) {
      sql += ` AND csm.status = ?`;
      params.push(status);
    }

    if (storeId) {
      sql += ` AND csm.store_id = ?`;
      params.push(storeId);
    }

    sql += ` ORDER BY csm.created_at DESC LIMIT 100`;

    const stmt = d1.prepare(sql);
    const purchasesResult = params.length > 0 ? await stmt.bind(...params).all() : await stmt.all();
    const purchases = purchasesResult.results ?? [];

    const stats = await d1.prepare(`
      SELECT
        (SELECT COUNT(*) FROM customer_store_memberships) AS totalPurchases,
        (SELECT COUNT(*) FROM customer_store_memberships WHERE status = 'active') AS activeMembers,
        (SELECT COUNT(*) FROM customer_store_memberships WHERE status = 'pending_verification') AS pendingVerifications,
        (SELECT COALESCE(SUM(amount_paid), 0) FROM customer_store_memberships WHERE status = 'active') AS totalVolume,
        (SELECT COUNT(DISTINCT store_id) FROM customer_store_memberships) AS participatingStoresCount
    `).first();

    const plansResult = await d1.prepare(`
      SELECT smp.*, s.name as store_name
      FROM store_membership_plans smp
      LEFT JOIN stores s ON s.id = smp.store_id
      ORDER BY smp.created_at DESC
      LIMIT 100
    `).all();

    return NextResponse.json({
      purchases: purchases.map((p: any) => ({
        id: p.id,
        storeId: p.store_id,
        storeName: p.store_name || "Store",
        planId: p.plan_id,
        customerId: p.customer_id,
        customerName: p.customer_name || "Customer",
        customerEmail: p.customer_email || p.user_email || "",
        planName: p.plan_name,
        amountPaid: p.amount_paid,
        utr: p.utr,
        status: p.status,
        rejectionReason: p.rejection_reason,
        startsAt: p.starts_at,
        expiresAt: p.expires_at,
        createdAt: p.created_at,
        updatedAt: p.updated_at
      })),
      stats: stats || {},
      plans: plansResult.results ?? []
    });
  } catch (error) {
    return apiError(error);
  }
}

export async function POST(request: Request) {
  try {
    await requireApiPermission(request, "admin.dashboard");
    const d1 = getD1();
    await ensureTables(d1);

    const { purchaseId, action, rejectionReason } = await request.json();
    if (!purchaseId || !action) {
      return NextResponse.json({ error: "purchaseId and action required" }, { status: 400 });
    }

    const now = Math.floor(Date.now() / 1000);

    if (action === "accept") {
      await d1.prepare(`
        UPDATE customer_store_memberships
        SET status = 'active', starts_at = ?, expires_at = ?, updated_at = ?
        WHERE id = ?
      `).bind(now, now + (30 * 86400), now, purchaseId).run();

      try {
        await d1.prepare(`
          UPDATE customer_memberships SET status = 'active', updated_at = ? WHERE id = ?
        `).bind(now, purchaseId).run();
      } catch {
        // ignore
      }

      return NextResponse.json({ success: true, message: "Membership activated by Admin!" });
    } else if (action === "reject" || action === "revoke") {
      const reason = rejectionReason || (action === "revoke" ? "Revoked by Administrator" : "Rejected by Administrator");
      await d1.prepare(`
        UPDATE customer_store_memberships
        SET status = ?, rejection_reason = ?, updated_at = ?
        WHERE id = ?
      `).bind(action === "revoke" ? "cancelled_by_owner" : "rejected", reason, now, purchaseId).run();

      try {
        await d1.prepare(`
          UPDATE customer_memberships SET status = ?, updated_at = ? WHERE id = ?
        `).bind(action === "revoke" ? "cancelled_by_owner" : "rejected", now, purchaseId).run();
      } catch {
        // ignore
      }

      return NextResponse.json({ success: true, message: `Membership status set to ${action}` });
    } else if (action === "delete") {
      await d1.prepare(`DELETE FROM customer_store_memberships WHERE id = ?`).bind(purchaseId).run();
      try {
        await d1.prepare(`DELETE FROM customer_memberships WHERE id = ?`).bind(purchaseId).run();
      } catch {
        // ignore
      }
      return NextResponse.json({ success: true, message: "Membership record deleted by Admin!" });
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch (error) {
    return apiError(error);
  }
}
