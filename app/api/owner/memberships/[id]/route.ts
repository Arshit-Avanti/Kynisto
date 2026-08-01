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
    let { storeId, name, price, durationDays, description, badgeColor, planIcon, isActive, maxMembers, termsAndConditions, benefits, commissionAcknowledged } = body;

    const db = getDb();

    if (price !== undefined && price < 80) {
      return NextResponse.json({ error: "Minimum membership price is ₹80." }, { status: 400 });
    }
    
    if (commissionAcknowledged === false) {
      return NextResponse.json({ error: "Commission policy not acknowledged." }, { status: 400 });
    }

    if (!storeId) {
      const ownerStore = await db.query.stores.findFirst({
        where: eq(stores.ownerId, session.user.id),
      });
      if (ownerStore) storeId = ownerStore.id;
    }

    if (storeId) {
      const store = await db.query.stores.findFirst({
        where: eq(stores.id, storeId),
      });
      
      if (store && store.ownerId !== session.user.id && session.user.role !== "admin" && !session.user.isSuperAdmin) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      }
    }

    const updates: any = {};
    if (name !== undefined) updates.name = String(name).trim();
    if (price !== undefined) updates.price = Number(price);
    if (durationDays !== undefined) updates.durationDays = Number(durationDays);
    if (description !== undefined) updates.description = String(description || "").trim();
    if (badgeColor !== undefined) updates.badgeColor = badgeColor || "#FF5722";
    if (planIcon !== undefined) updates.planIcon = planIcon || "star";
    if (isActive !== undefined) updates.isActive = isActive;
    if (maxMembers !== undefined) updates.maxMembers = maxMembers || null;
    if (termsAndConditions !== undefined) updates.termsAndConditions = termsAndConditions || null;
    if (benefits !== undefined) updates.benefits = Array.isArray(benefits) ? benefits : [];

    try {
      await db.update(storeMembershipPlans).set(updates).where(eq(storeMembershipPlans.id, id));
    } catch (dbErr) {
      console.warn("db.update storeMembershipPlans failed", dbErr);
    }

    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: err instanceof Error ? err.message : "Failed to update plan" }, { status: 400 });
  }
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await requireApiSession(req);
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { id } = await params;
    const body = await req.json();
    let { storeId } = body;

    const db = getDb();

    if (!storeId) {
      const ownerStore = await db.query.stores.findFirst({
        where: eq(stores.ownerId, session.user.id),
      });
      if (ownerStore) storeId = ownerStore.id;
    }

    try {
      if (storeId) {
        await db.delete(storeMembershipPlans).where(
          and(eq(storeMembershipPlans.id, id), eq(storeMembershipPlans.storeId, storeId))
        );
      } else {
        await db.delete(storeMembershipPlans).where(eq(storeMembershipPlans.id, id));
      }
    } catch (dbErr) {
      console.warn("db.delete storeMembershipPlans failed", dbErr);
    }

    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: err instanceof Error ? err.message : "Failed to delete plan" }, { status: 400 });
  }
}
