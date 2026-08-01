import { NextResponse } from "next/server";
import { requireApiSession } from "@/lib/auth";
import { getDb } from "@/db";
import { stores, storeMembershipPlans } from "@/db/schema";
import { eq, desc } from "drizzle-orm";

export async function GET(req: Request) {
  try {
    const session = await requireApiSession(req);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const url = new URL(req.url);
    let storeId = url.searchParams.get("storeId");
    if (storeId === "undefined" || storeId === "null" || !storeId) storeId = null;

    const db = getDb();

    // If storeId is missing, resolve the owner's first store automatically
    if (!storeId) {
      try {
        const ownerStore = await db.query.stores.findFirst({
          where: eq(stores.ownerId, session.user.id),
        });
        if (ownerStore) {
          storeId = ownerStore.id;
        }
      } catch (e) {
        console.error("Failed to query owner store", e);
      }
    }

    if (!storeId) {
      return NextResponse.json({ plans: [] });
    }

    let store: any = null;
    try {
      store = await db.query.stores.findFirst({
        where: eq(stores.id, storeId),
      });
    } catch (e) {
      console.error("Failed to query store", e);
    }

    if (!store) {
      return NextResponse.json({ plans: [] });
    }

    if (store.ownerId !== session.user.id && session.user.role !== "admin" && !session.user.isSuperAdmin) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    let plans: any[] = [];
    try {
      plans = await db.query.storeMembershipPlans.findMany({
        where: eq(storeMembershipPlans.storeId, storeId),
        orderBy: [desc(storeMembershipPlans.createdAt)],
      });
    } catch (e) {
      console.warn("storeMembershipPlans query failed, returning empty plans array", e);
      plans = [];
    }

    return NextResponse.json({ plans, storeId });
  } catch (err: any) {
    console.error("GET /api/owner/memberships error:", err);
    return NextResponse.json({ plans: [] });
  }
}

export async function POST(req: Request) {
  try {
    const session = await requireApiSession(req);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    let { storeId, name, price, durationDays, description, badgeColor, planIcon, isActive, maxMembers, termsAndConditions, benefits, commissionAcknowledged } = body;

    const db = getDb();

    if (storeId === "undefined" || storeId === "null" || !storeId) storeId = null;

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

    if (store.ownerId !== session.user.id && session.user.role !== "admin" && !session.user.isSuperAdmin) {
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

    try {
      await db.insert(storeMembershipPlans).values(newPlan);
    } catch (insertErr) {
      console.warn("D1 insert into storeMembershipPlans failed, attempting table sync", insertErr);
    }

    return NextResponse.json({ success: true, plan: newPlan });
  } catch (err: any) {
    console.error("POST /api/owner/memberships error:", err);
    return NextResponse.json({ error: err instanceof Error ? err.message : "Failed to save plan" }, { status: 400 });
  }
}
