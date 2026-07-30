import { NextResponse } from "next/server";
import { requireApiSession } from "@/lib/auth";
import { getDb } from "@/db";
import { stores, storeMembershipPlans } from "@/db/schema";
import { eq, and, desc } from "drizzle-orm";

export async function GET(req: Request) {
  try {
    const session = await requireApiSession(req);
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const url = new URL(req.url);
    let storeId = url.searchParams.get("storeId");
    const db = getDb();

    // If storeId is missing, resolve the owner's first store automatically
    if (!storeId) {
      const ownerStore = await db.query.stores.findFirst({
        where: eq(stores.ownerId, session.user.id),
      });
      if (ownerStore) {
        storeId = ownerStore.id;
      }
    }

    if (!storeId) {
      return NextResponse.json({ plans: [] });
    }

    const store = await db.query.stores.findFirst({
      where: eq(stores.id, storeId),
    });

    if (!store) {
      return NextResponse.json({ plans: [] });
    }

    if (store.ownerId !== session.user.id && session.user.role !== "admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const plans = await db.query.storeMembershipPlans.findMany({
      where: eq(storeMembershipPlans.storeId, storeId),
      orderBy: [desc(storeMembershipPlans.createdAt)],
    });

    return NextResponse.json({ plans, storeId });
  } catch (err: any) {
    return NextResponse.json({ error: err instanceof Error ? err.message : "Failed to load membership plans" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const session = await requireApiSession(req);
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await req.json();
    let { storeId, name, price, durationDays, description, badgeColor, planIcon, isActive, maxMembers, termsAndConditions, benefits, commissionAcknowledged } = body;

    const db = getDb();

    if (!storeId) {
      const ownerStore = await db.query.stores.findFirst({
        where: eq(stores.ownerId, session.user.id),
      });
      if (ownerStore) storeId = ownerStore.id;
    }

    if (!storeId || !name || price === undefined || !durationDays) {
      return NextResponse.json({ error: "Missing required fields: storeId, name, price, or duration" }, { status: 400 });
    }

    const numPrice = Number(price);
    if (isNaN(numPrice) || numPrice < 80) {
      return NextResponse.json({ error: "Minimum membership price is ₹80." }, { status: 400 });
    }
    
    if (!commissionAcknowledged) {
      return NextResponse.json({ error: "Commission policy not acknowledged." }, { status: 400 });
    }

    const store = await db.query.stores.findFirst({
      where: eq(stores.id, storeId),
    });
    
    if (!store) {
      return NextResponse.json({ error: "Store not found" }, { status: 404 });
    }

    if (store.ownerId !== session.user.id && session.user.role !== "admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const planId = `plan_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
    const now = Math.floor(Date.now() / 1000);

    const newPlan = {
      id: planId,
      storeId,
      name: String(name).trim(),
      price: numPrice,
      durationDays: Number(durationDays) || 30,
      description: String(description || "").trim(),
      benefits: Array.isArray(benefits) ? benefits : [String(description || "Exclusive membership perks")],
      badgeColor: String(badgeColor || "#FF5722"),
      planIcon: String(planIcon || "star"),
      isActive: isActive !== false,
      maxMembers: maxMembers ? Number(maxMembers) : null,
      termsAndConditions: termsAndConditions ? String(termsAndConditions) : null,
      createdAt: now,
      updatedAt: now,
    };

    await db.insert(storeMembershipPlans).values(newPlan);

    return NextResponse.json({ success: true, plan: newPlan });
  } catch (err: any) {
    return NextResponse.json({ error: err instanceof Error ? err.message : "Failed to create membership plan" }, { status: 500 });
  }
}
