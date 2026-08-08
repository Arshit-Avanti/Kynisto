import { NextResponse } from "next/server";
import { requireApiSession } from "@/lib/auth";
import { getD1 } from "@/db/runtime";
import { getDb } from "@/db";
import { stores, storeMembershipPlans } from "@/db/schema";
import { eq, and } from "drizzle-orm";

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await requireApiSession(req);
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { id } = await params;
    const body = await req.json();
    let {
      storeId, name, price, durationDays, description, badgeColor, planIcon,
      isActive, maxMembers, termsAndConditions, benefits, commissionAcknowledged,
      upiId, qrCodeUrl, linkedCouponIds,
      hasFreeTrial, freeTrialDays, fixedExpiryDate, rewardScheduleDates, memberOffers, isUpgradeOption
    } = body;

    const d1 = getD1();
    const db = getDb();

    if (price !== undefined && price < (hasFreeTrial ? 0 : 80)) {
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

    const now = Math.floor(Date.now() / 1000);

    await d1.prepare(`
      UPDATE store_membership_plans
      SET name = COALESCE(?, name),
          price = COALESCE(?, price),
          duration_days = COALESCE(?, duration_days),
          description = COALESCE(?, description),
          badge_color = COALESCE(?, badge_color),
          plan_icon = COALESCE(?, plan_icon),
          is_active = COALESCE(?, is_active),
          max_members = COALESCE(?, max_members),
          terms_and_conditions = COALESCE(?, terms_and_conditions),
          benefits = COALESCE(?, benefits),
          upi_id = COALESCE(?, upi_id),
          qr_code_url = COALESCE(?, qr_code_url),
          linked_coupon_ids = COALESCE(?, linked_coupon_ids),
          has_free_trial = COALESCE(?, has_free_trial),
          free_trial_days = COALESCE(?, free_trial_days),
          fixed_expiry_date = COALESCE(?, fixed_expiry_date),
          reward_schedule_dates = COALESCE(?, reward_schedule_dates),
          member_offers = COALESCE(?, member_offers),
          is_upgrade_option = COALESCE(?, is_upgrade_option),
          updated_at = ?
      WHERE id = ?
    `).bind(
      name !== undefined ? String(name).trim() : null,
      price !== undefined ? Number(price) : null,
      durationDays !== undefined ? Number(durationDays) : null,
      description !== undefined ? String(description || "").trim() : null,
      badgeColor !== undefined ? String(badgeColor) : null,
      planIcon !== undefined ? String(planIcon) : null,
      isActive !== undefined ? (isActive ? 1 : 0) : null,
      maxMembers !== undefined ? (maxMembers ? Number(maxMembers) : null) : null,
      termsAndConditions !== undefined ? String(termsAndConditions) : null,
      benefits !== undefined ? JSON.stringify(Array.isArray(benefits) ? benefits : []) : null,
      upiId !== undefined ? String(upiId).trim() : null,
      qrCodeUrl !== undefined ? String(qrCodeUrl).trim() : null,
      linkedCouponIds !== undefined ? JSON.stringify(Array.isArray(linkedCouponIds) ? linkedCouponIds : []) : null,
      hasFreeTrial !== undefined ? (hasFreeTrial ? 1 : 0) : null,
      freeTrialDays !== undefined ? Number(freeTrialDays) : null,
      fixedExpiryDate !== undefined ? String(fixedExpiryDate).trim() : null,
      rewardScheduleDates !== undefined ? JSON.stringify(Array.isArray(rewardScheduleDates) ? rewardScheduleDates : []) : null,
      memberOffers !== undefined ? JSON.stringify(Array.isArray(memberOffers) ? memberOffers : []) : null,
      isUpgradeOption !== undefined ? (isUpgradeOption ? 1 : 0) : null,
      now,
      id
    ).run();

    return NextResponse.json({ success: true, message: "Membership plan updated successfully!" });
  } catch (err: any) {
    return NextResponse.json({ error: err instanceof Error ? err.message : "Failed to update plan" }, { status: 400 });
  }
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await requireApiSession(req);
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { id } = await params;
    const body = await req.json().catch(() => ({}));
    let { storeId } = body;

    const d1 = getD1();
    const db = getDb();

    if (!storeId) {
      const ownerStore = await db.query.stores.findFirst({
        where: eq(stores.ownerId, session.user.id),
      });
      if (ownerStore) storeId = ownerStore.id;
    }

    await d1.prepare(`
      DELETE FROM store_membership_plans WHERE id = ?
    `).bind(id).run();

    return NextResponse.json({ success: true, message: "Membership plan deleted successfully!" });
  } catch (err: any) {
    return NextResponse.json({ error: err instanceof Error ? err.message : "Failed to delete plan" }, { status: 400 });
  }
}
