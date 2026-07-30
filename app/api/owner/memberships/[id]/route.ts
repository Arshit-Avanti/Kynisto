import { NextResponse } from "next/server";
import { requireApiSession } from "@/lib/auth";
import { getDb } from "@/db";
import { stores, storeMembershipPlans } from "@/db/schema";
import { eq, and } from "drizzle-orm";

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await requireApiSession(req);
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { id } = await params;
    const body = await req.json();
    const { storeId, name, price, durationDays, description, badgeColor, planIcon, isActive, maxMembers, termsAndConditions, benefits, commissionAcknowledged } = body;

    if (price !== undefined && price < 80) {
      return NextResponse.json({ error: "Minimum membership price is ₹80." }, { status: 400 });
    }
    
    if (commissionAcknowledged === false) {
      return NextResponse.json({ error: "Commission policy not acknowledged." }, { status: 400 });
    }

    const db = getDb();
    const store = await db.query.stores.findFirst({
      where: and(eq(stores.id, storeId), eq(stores.ownerId, session.user.id)),
    });
    
    if (!store && session.user.role !== "admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    
    const plan = await db.query.storeMembershipPlans.findFirst({
      where: and(eq(storeMembershipPlans.id, id), eq(storeMembershipPlans.storeId, storeId)),
    });
    
    if (!plan) {
      return NextResponse.json({ error: "Plan not found" }, { status: 404 });
    }

    const updates: any = {};
    if (name !== undefined) updates.name = name;
    if (price !== undefined) updates.price = price;
    if (durationDays !== undefined) updates.durationDays = durationDays;
    if (description !== undefined) updates.description = description || "";
    if (badgeColor !== undefined) updates.badgeColor = badgeColor || "#FF5722";
    if (planIcon !== undefined) updates.planIcon = planIcon || "star";
    if (isActive !== undefined) updates.isActive = isActive;
    if (maxMembers !== undefined) updates.maxMembers = maxMembers || null;
    if (termsAndConditions !== undefined) updates.termsAndConditions = termsAndConditions || null;
    if (benefits !== undefined) updates.benefits = benefits || [];

    await db.update(storeMembershipPlans).set(updates).where(eq(storeMembershipPlans.id, id));

    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await requireApiSession(req);
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { id } = await params;
    const body = await req.json();
    const { storeId } = body;

    const db = getDb();
    const store = await db.query.stores.findFirst({
      where: and(eq(stores.id, storeId), eq(stores.ownerId, session.user.id)),
    });
    
    if (!store && session.user.role !== "admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    await db.delete(storeMembershipPlans).where(
      and(eq(storeMembershipPlans.id, id), eq(storeMembershipPlans.storeId, storeId))
    );

    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
