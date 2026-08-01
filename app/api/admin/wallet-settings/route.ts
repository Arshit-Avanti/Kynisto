import { NextResponse } from "next/server";
import { requireApiSession } from "@/lib/auth";
import { getDb } from "@/db";
import { systemSettings } from "@/db/schema";
import { eq } from "drizzle-orm";

export async function GET(request: Request) {
  try {
    const session = await requireApiSession(request);
    if (session.user.role !== "admin" && !session.user.isSuperAdmin) {
      return NextResponse.json({ error: "Admin access required" }, { status: 403 });
    }

    const db = getDb();
    const row = await db.query.systemSettings.findFirst({
      where: eq(systemSettings.key, "wallet_settings"),
    });

    const defaults = {
      pointEarningRate: 1,
      probabilityDistribution: "linear",
      fixedCommissionAmount: 50,
      minimumPlanPrice: 80,
      bundleToggleEnabled: true,
      rewardCatalog: "Kynisto Premium 1-Month Extension, ₹200 Store Voucher, Exclusive Pass, Priority Queue Upgrade",
      coupons: [
        { code: "KYNISTO100", discount: 100, limit: 50, used: 12, active: true },
        { code: "WELCOME50", discount: 50, limit: 100, used: 34, active: true }
      ]
    };

    let settings = defaults;
    if (row && row.value) {
      try {
        settings = { ...defaults, ...JSON.parse(row.value) };
      } catch (e) {
        // use defaults
      }
    }

    return NextResponse.json(settings);
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Failed to fetch settings" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const session = await requireApiSession(request);
    if (session.user.role !== "admin" && !session.user.isSuperAdmin) {
      return NextResponse.json({ error: "Admin access required" }, { status: 403 });
    }

    const settings = await request.json();
    const db = getDb();
    const now = Math.floor(Date.now() / 1000);

    await db
      .insert(systemSettings)
      .values({
        key: "wallet_settings",
        value: JSON.stringify(settings),
        updatedAt: now,
      })
      .onConflictDoUpdate({
        target: systemSettings.key,
        set: { value: JSON.stringify(settings), updatedAt: now },
      });

    return NextResponse.json({ success: true, settings });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Failed to save settings" }, { status: 500 });
  }
}
