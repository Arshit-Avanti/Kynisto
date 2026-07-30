import { NextResponse } from "next/server";
import { requireApiSession } from "@/lib/auth";
import { getDb } from "@/db";
import { customerMemberships, storeMembershipPlans, kynistoWallets, kynistoPointTransactions } from "@/db/schema";
import { eq } from "drizzle-orm";

export async function POST(request: Request) {
  try {
    const session = await requireApiSession(request);
    const { storeId, planId } = await request.json();

    if (!storeId || !planId) {
      return NextResponse.json({ error: "storeId and planId are required" }, { status: 400 });
    }

    const db = getDb();
    const [plan] = await db.select().from(storeMembershipPlans).where(eq(storeMembershipPlans.id, planId));
    if (!plan || !plan.isActive) {
      return NextResponse.json({ error: "Membership plan not available" }, { status: 404 });
    }

    const commissionAmount = 50; // Fixed ₹50 Kynisto commission
    const storeEarnings = Math.max(0, plan.price - commissionAmount);
    const durationDays = plan.durationDays || 30;
    const now = Math.floor(Date.now() / 1000);
    const expiresAt = now + (durationDays * 86400);

    const membershipId = `mem_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;

    await db.insert(customerMemberships).values({
      id: membershipId,
      userId: session.user.id,
      storeId,
      planId,
      pricePaid: plan.price,
      commissionAmount,
      storeEarnings,
      includesKynistoPremium: true,
      status: "active",
      startedAt: now,
      expiresAt,
      createdAt: now,
    });

    // Credit bonus Kynisto Points for subscribing
    try {
      const [wallet] = await db.select().from(kynistoWallets).where(eq(kynistoWallets.userId, session.user.id));
      const currentPoints = wallet?.kynistoPoints ?? 0;
      const bonusPoints = 250;
      const newPoints = currentPoints + bonusPoints;

      if (wallet) {
        await db.update(kynistoWallets).set({ kynistoPoints: newPoints, updatedAt: now }).where(eq(kynistoWallets.userId, session.user.id));
      } else {
        await db.insert(kynistoWallets).values({ userId: session.user.id, kynistoPoints: newPoints, updatedAt: now });
      }

      await db.insert(kynistoPointTransactions).values({
        id: `tx_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
        userId: session.user.id,
        amount: bonusPoints,
        type: "subscription_reward",
        description: `Bonus Kynisto Points earned for purchasing ${plan.name}`,
        createdAt: now,
      });
    } catch {
      // Ignore non-fatal wallet update errors
    }

    return NextResponse.json({
      success: true,
      membership: {
        id: membershipId,
        planName: plan.name,
        expiresAt,
        includesKynistoPremium: true,
      },
    });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Failed to purchase membership" }, { status: 500 });
  }
}
