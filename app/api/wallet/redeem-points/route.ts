import { NextResponse } from "next/server";
import { requireApiSession } from "@/lib/auth";
import { getDb } from "@/db";
import { kynistoWallets, kynistoPointTransactions, kynistoPointRedemptions, systemSettings } from "@/db/schema";
import { eq } from "drizzle-orm";

export async function POST(request: Request) {
  try {
    const session = await requireApiSession(request);
    const userId = session.user.id;
    const db = getDb();

    // 1. Get current wallet balance
    const wallet = await db.query.kynistoWallets.findFirst({
      where: eq(kynistoWallets.userId, userId),
    });

    const currentPoints = wallet?.kynistoPoints ?? 0;
    const REDEEM_COST = 1000;

    if (currentPoints < REDEEM_COST) {
      return NextResponse.json({
        error: `Insufficient Kynisto Points. You need at least 1,000 points to redeem a reward. Current balance: ${currentPoints} pts.`
      }, { status: 400 });
    }

    // 2. Fetch admin configured rewards catalog
    const adminSettingRow = await db.query.systemSettings.findFirst({
      where: eq(systemSettings.key, "wallet_settings"),
    });

    let rewardCatalogList = [
      "Kynisto Premium 1-Month Extension",
      "₹200 Store Voucher",
      "Exclusive Neighbourhood Member Pass",
      "Free Priority Queue Upgrade"
    ];

    if (adminSettingRow && adminSettingRow.value) {
      try {
        const parsed = JSON.parse(adminSettingRow.value);
        if (parsed.rewardCatalog && typeof parsed.rewardCatalog === "string") {
          const custom = parsed.rewardCatalog.split(",").map((s: string) => s.trim()).filter(Boolean);
          if (custom.length > 0) rewardCatalogList = custom;
        }
      } catch (e) {
        // Fall back to default catalog
      }
    }

    const randomReward = rewardCatalogList[Math.floor(Math.random() * rewardCatalogList.length)];
    const rewardCode = `REWARD-${Math.random().toString(36).slice(2, 8).toUpperCase()}`;

    // 3. Deduct points permanently in DB
    const newBalance = currentPoints - REDEEM_COST;
    const now = Math.floor(Date.now() / 1000);

    await db.update(kynistoWallets)
      .set({
        kynistoPoints: newBalance,
        updatedAt: now,
      })
      .where(eq(kynistoWallets.userId, userId));

    const redemptionId = `red_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;

    await db.insert(kynistoPointTransactions).values({
      id: `tx_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
      userId,
      amount: REDEEM_COST,
      type: "redeemed",
      description: `Redeemed 1,000 points for ${randomReward}`,
      createdAt: now,
    });

    await db.insert(kynistoPointRedemptions).values({
      id: redemptionId,
      userId,
      pointsSpent: REDEEM_COST,
      rewardType: "platform_reward",
      rewardTitle: randomReward,
      rewardCode,
      createdAt: now,
    });

    return NextResponse.json({
      success: true,
      message: `Successfully redeemed 1,000 points! You received: ${randomReward}`,
      reward: randomReward,
      rewardCode,
      pointsDeducted: REDEEM_COST,
      newBalance,
    });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Failed to redeem points" }, { status: 500 });
  }
}
