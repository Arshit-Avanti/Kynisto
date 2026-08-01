import { NextResponse } from "next/server";
import { getDb } from "@/db";
import { storeMembershipPlans } from "@/db/schema";
import { eq, and } from "drizzle-orm";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const storeId = searchParams.get("storeId");
    if (!storeId) return NextResponse.json({ error: "storeId is required" }, { status: 400 });

    const db = getDb();
    const plans = await db.select().from(storeMembershipPlans).where(
      and(
        eq(storeMembershipPlans.storeId, storeId),
        eq(storeMembershipPlans.isActive, true)
      )
    );

    return NextResponse.json({ plans });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Failed to fetch membership plans" }, { status: 500 });
  }
}
