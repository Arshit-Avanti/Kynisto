import { NextResponse } from "next/server";
import { requireApiSession } from "@/lib/auth";
import { getDb } from "@/db";
import { stores, storeMembershipPlans } from "@/db/schema";
import { eq, and } from "drizzle-orm";

export async function GET(req: Request) {
  try {
    const session = await requireApiSession(req);
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const url = new URL(req.url);
    const storeId = url.searchParams.get("storeId");
    if (!storeId) return NextResponse.json({ error: "storeId required" }, { status: 400 });

    const db = getDb();
    const store = await db.query.stores.findFirst({
      where: and(eq(stores.id, storeId), eq(stores.ownerId, session.user.id)),
    });
    if (!store && session.user.role !== "admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const plans = await db.query.storeMembershipPlans.findMany({
      where: eq(storeMembershipPlans.storeId, storeId),
      orderBy: (plans, { desc }) => [desc(plans.createdAt)],
    });

    return NextResponse.json({ plans });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const session = await requireApiSession(req);
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await req.json();
    const { storeId, name, price, durationDays, description, badgeColor, planIcon, isActive, maxMembers, termsAndConditions, benefits, commissionAcknowledged } = body;

    if (!storeId || !name || price === undefined || !durationDays) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    if (price < 80) {
      return NextResponse.json({ error: "Minimum membership price is ₹80." }, { status: 400 });
    }
    
    if (!commissionAcknowledged) {
      return NextResponse.json({ error: "Commission policy not acknowledged." }, { status: 400 });
    }

    const db = getDb();
    const store = await db.query.stores.findFirst({
      where: and(eq(stores.id, storeId), eq(stores.ownerId, session.user.id)),
    });
    
    if (!store && session.user.role !== "admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    await db.insert(storeMembershipPlans).values({
      id: crypto.randomUUID(),
      storeId,
      name,
      price,
      durationDays,
      description: description || "",
      badgeColor: badgeColor || "#FF5722",
      planIcon: planIcon || "star",
      isActive: isActive ?? true,
      maxMembers: maxMembers || null,
      termsAndConditions: termsAndConditions || null,
      benefits: benefits || [],
    });

    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
