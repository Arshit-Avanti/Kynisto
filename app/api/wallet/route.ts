import { NextResponse } from "next/server";
import { requireApiSession } from "@/lib/auth";
import { getDb } from "@/db";
import { getD1 } from "@/db/runtime";
import { kynistoWallets, kynistoPointTransactions, storeLoyaltyPoints } from "@/db/schema";
import { eq, desc } from "drizzle-orm";

export async function GET(request: Request) {
  try {
    const session = await requireApiSession(request);
    const userId = session.user.id;
    const userEmail = session.user.email ? session.user.email.toLowerCase().trim() : "";
    const userName = session.user.name ? session.user.name.toLowerCase().trim() : "";
    const db = getDb();
    const d1 = getD1();

    // 1. Fetch or initialize Kynisto Wallet
    let wallet = await db.query.kynistoWallets.findFirst({
      where: eq(kynistoWallets.userId, userId),
    });

    if (!wallet) {
      const now = Math.floor(Date.now() / 1000);
      await db.insert(kynistoWallets).values({
        userId,
        kynistoPoints: 0,
        updatedAt: now,
      }).onConflictDoNothing();

      wallet = { userId, kynistoPoints: 0, updatedAt: now };
    }

    const totalKynistoPoints = wallet.kynistoPoints ?? 0;
    const maxCap = 1000;
    const progress = Math.min(totalKynistoPoints, maxCap);

    // 2. Fetch Kynisto Points Transaction History
    const txList = await db.query.kynistoPointTransactions.findMany({
      where: eq(kynistoPointTransactions.userId, userId),
      orderBy: [desc(kynistoPointTransactions.createdAt)],
      limit: 30,
    });

    const history = txList.map((tx) => ({
      id: tx.id,
      date: new Date((tx.createdAt ?? Math.floor(Date.now() / 1000)) * 1000).toISOString().split("T")[0],
      description: tx.description ?? "QR Scan Activity",
      points: tx.type === "redeemed" ? -Math.abs(tx.amount) : tx.amount,
      type: tx.type as "earned" | "redeemed",
    }));

    // 3. Fetch QR Scan History Logs
    let scanLogs: any[] = [];
    try {
      const scanLogsResult = await d1.prepare(`
        SELECT ql.id, ql.store_id, ql.qr_token, ql.kynisto_points_earned, ql.store_points_earned, ql.status, ql.scanned_at, s.name as store_name
        FROM qr_scan_logs ql
        LEFT JOIN stores s ON s.id = ql.store_id
        WHERE ql.user_id = ?
        ORDER BY ql.scanned_at DESC
        LIMIT 30
      `).bind(userId).all();
      scanLogs = scanLogsResult.results ?? [];
    } catch {
      scanLogs = [];
    }

    // 4. Fetch Store Loyalty Points
    const loyaltyRows = await db.query.storeLoyaltyPoints.findMany({
      where: eq(storeLoyaltyPoints.userId, userId),
      with: { store: true },
    });

    const loyaltyPoints = loyaltyRows.map((row: any) => ({
      storeId: row.storeId,
      storeName: row.store?.name ?? "Partner Store",
      logoUrl: row.store?.logoUrl ?? "https://images.unsplash.com/photo-1534723452862-4c874018d66d?w=100&auto=format&fit=crop&q=80",
      points: row.points ?? 0,
      lastVisit: new Date((row.lastVisitedAt ?? Math.floor(Date.now() / 1000)) * 1000).toISOString().split("T")[0],
      canRedeemDiscount: (row.points ?? 0) >= 100,
    }));

    // 5. Fetch Real Customer Memberships (matching user_id, customer_email, or customer_name)
    let active: any[] = [];
    let pending: any[] = [];
    let expired: any[] = [];

    const seenMembershipIds = new Set<string>();

    try {
      const nowSec = Math.floor(Date.now() / 1000);

      // Query customer_store_memberships
      const storeMembershipsResult = await d1.prepare(`
        SELECT csm.*, s.name as store_name, smp.benefits
        FROM customer_store_memberships csm
        LEFT JOIN stores s ON s.id = csm.store_id
        LEFT JOIN store_membership_plans smp ON smp.id = csm.plan_id
        WHERE csm.customer_id = ? 
           OR (csm.customer_email IS NOT NULL AND csm.customer_email != '' AND LOWER(csm.customer_email) = ?)
           OR (csm.customer_name IS NOT NULL AND csm.customer_name != '' AND LOWER(csm.customer_name) = ?)
        ORDER BY csm.created_at DESC
      `).bind(userId, userEmail, userName).all();

      (storeMembershipsResult.results ?? []).forEach((item: any) => {
        if (!item.id || seenMembershipIds.has(item.id)) return;
        seenMembershipIds.add(item.id);

        const isExpired = (item.expires_at && item.expires_at < nowSec) || item.status === "expired";
        let parsedBenefits = ["Priority Queue Access", "VIP Store Discounts", "Loyalty Rewards"];
        if (item.benefits) {
          try {
            parsedBenefits = typeof item.benefits === "string" ? JSON.parse(item.benefits) : item.benefits;
          } catch {
            // fallback
          }
        }

        const formatted = {
          id: item.id,
          storeId: item.store_id,
          storeName: item.store_name ?? "Local Business",
          type: item.plan_name ?? "VIP Membership Pass",
          status: item.status || "pending_verification",
          validUntil: item.expires_at ? new Date(item.expires_at * 1000).toISOString().split("T")[0] : "Active VIP Pass",
          pricePaid: item.amount_paid,
          utr: item.utr,
          createdAt: item.created_at,
          benefits: parsedBenefits,
          invoiceUrl: `/api/memberships/invoice/${item.id}`,
        };

        if (item.status === "pending_verification") {
          pending.push(formatted);
        } else if (isExpired || item.status === "rejected") {
          expired.push(formatted);
        } else {
          active.push(formatted);
        }
      });

      // Fallback query for customer_memberships table
      const legacyMembershipsResult = await d1.prepare(`
        SELECT cm.*, s.name as store_name, smp.benefits, smp.name as plan_name
        FROM customer_memberships cm
        LEFT JOIN stores s ON s.id = cm.store_id
        LEFT JOIN store_membership_plans smp ON smp.id = cm.plan_id
        WHERE cm.user_id = ?
        ORDER BY cm.created_at DESC
      `).bind(userId).all();

      (legacyMembershipsResult.results ?? []).forEach((item: any) => {
        if (!item.id || seenMembershipIds.has(item.id)) return;
        seenMembershipIds.add(item.id);

        const isExpired = (item.expires_at && item.expires_at < nowSec) || item.status === "expired";
        let parsedBenefits = ["Priority Queue Access", "VIP Store Discounts", "Loyalty Rewards"];
        if (item.benefits) {
          try {
            parsedBenefits = typeof item.benefits === "string" ? JSON.parse(item.benefits) : item.benefits;
          } catch {
            // fallback
          }
        }

        const formatted = {
          id: item.id,
          storeId: item.store_id,
          storeName: item.store_name ?? "Local Business",
          type: item.plan_name ?? "VIP Membership Pass",
          status: item.status || "active",
          validUntil: item.expires_at ? new Date(item.expires_at * 1000).toISOString().split("T")[0] : "Active VIP Pass",
          pricePaid: item.price_paid || item.amount_paid,
          createdAt: item.created_at,
          benefits: parsedBenefits,
          invoiceUrl: `/api/memberships/invoice/${item.id}`,
        };

        if (item.status === "pending_verification") {
          pending.push(formatted);
        } else if (isExpired || item.status === "rejected") {
          expired.push(formatted);
        } else {
          active.push(formatted);
        }
      });
    } catch (e) {
      console.warn("Failed to fetch customer memberships", e);
    }

    return NextResponse.json({
      kynistoPoints: {
        total: totalKynistoPoints,
        maxCap,
        progress,
        history,
      },
      loyaltyPoints,
      scanLogs,
      memberships: {
        active,
        pending,
        expired,
      },
    });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Failed to load wallet data" }, { status: 500 });
  }
}
