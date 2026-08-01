import { NextResponse } from "next/server";
import { requireApiSession } from "@/lib/auth";
import { getDb } from "@/db";
import { kynistoWallets, kynistoPointTransactions, storeLoyaltyPoints, customerMemberships, stores, storeMembershipPlans } from "@/db/schema";
import { eq, desc } from "drizzle-orm";

export async function GET(request: Request) {
  try {
    const session = await requireApiSession(request);
    const userId = session.user.id;
    const db = getDb();

    // 1. Fetch or initialize Kynisto Wallet
    let wallet = await db.query.kynistoWallets.findFirst({
      where: eq(kynistoWallets.userId, userId),
    });

    if (!wallet) {
      const now = Math.floor(Date.now() / 1000);
      await db.insert(kynistoWallets).values({
        userId,
        kynistoPoints: 500, // Initial welcome bonus points
        updatedAt: now,
      }).onConflictDoNothing();

      await db.insert(kynistoPointTransactions).values({
        id: `tx_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
        userId,
        amount: 500,
        type: "earned",
        description: "Welcome Bonus Kynisto Points",
        createdAt: now,
      }).onConflictDoNothing();

      wallet = { userId, kynistoPoints: 500, updatedAt: now };
    }

    const totalKynistoPoints = wallet.kynistoPoints ?? 0;
    const progress = totalKynistoPoints % 1000;

    // 2. Fetch Kynisto Points Transaction History
    const txList = await db.query.kynistoPointTransactions.findMany({
      where: eq(kynistoPointTransactions.userId, userId),
      orderBy: [desc(kynistoPointTransactions.createdAt)],
      limit: 20,
    });

    const history = txList.map((tx) => ({
      id: tx.id,
      date: new Date((tx.createdAt ?? Math.floor(Date.now() / 1000)) * 1000).toISOString().split("T")[0],
      description: tx.description ?? "Points activity",
      points: tx.type === "redeemed" ? -Math.abs(tx.amount) : tx.amount,
      type: tx.type as "earned" | "redeemed",
    }));

    // 3. Fetch Store Loyalty Points
    const loyaltyRows = await db.query.storeLoyaltyPoints.findMany({
      where: eq(storeLoyaltyPoints.userId, userId),
      with: { store: true },
    });

    const loyaltyPoints = loyaltyRows.map((row: any) => ({
      storeId: row.storeId,
      storeName: row.store?.name ?? "Partner Store",
      logoUrl: row.store?.logoUrl ?? "https://images.unsplash.com/photo-1534723452862-4c874018d66d?w=100&auto=format&fit=crop&q=80",
      points: row.points ?? 0,
      progress: (row.points ?? 0) % 1000,
      lastVisit: new Date((row.lastVisitedAt ?? Math.floor(Date.now() / 1000)) * 1000).toISOString().split("T")[0],
      canRedeemDiscount: (row.points ?? 0) >= 1000,
    }));

    // 4. Fetch Real Customer Memberships
    const activeMembershipsRows = await db.query.customerMemberships.findMany({
      where: eq(customerMemberships.userId, userId),
      with: {
        store: true,
        plan: true,
      },
      orderBy: [desc(customerMemberships.createdAt)],
    });

    const nowSec = Math.floor(Date.now() / 1000);
    const active: any[] = [];
    const expired: any[] = [];

    activeMembershipsRows.forEach((item: any) => {
      const isExpired = item.expiresAt < nowSec || item.status === "expired";
      const formatted = {
        id: item.id,
        storeId: item.storeId,
        storeName: item.store?.name ?? "Local Business",
        type: item.plan?.name ?? "Membership Plan",
        validUntil: new Date((item.expiresAt ?? nowSec) * 1000).toISOString().split("T")[0],
        isKynistoPremium: item.includesKynistoPremium ?? true,
        pricePaid: item.pricePaid,
        benefits: (item.plan?.benefits as string[] | undefined) ?? ["Priority Queue Access", "Exclusive Discounts"],
        invoiceUrl: `/api/memberships/invoice/${item.id}`,
      };

      if (isExpired) {
        expired.push(formatted);
      } else {
        active.push(formatted);
      }
    });

    return NextResponse.json({
      kynistoPoints: {
        total: totalKynistoPoints,
        progress,
        history,
      },
      loyaltyPoints,
      memberships: {
        active,
        expired,
      },
    });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Failed to load wallet data" }, { status: 500 });
  }
}
