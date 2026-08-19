import { NextResponse } from "next/server";
import { getD1 } from "@/db/runtime";
import { isMembershipsEnabled } from "@/lib/settings";

export async function GET(request: Request) {
  try {
    const enabled = await isMembershipsEnabled();
    if (!enabled) {
      return NextResponse.json({ plans: [], enabled: false });
    }

    const { searchParams } = new URL(request.url);
    const storeId = searchParams.get("storeId");
    if (!storeId) return NextResponse.json({ error: "storeId is required" }, { status: 400 });

    const d1 = getD1();
    const result = await d1.prepare(`
      SELECT * FROM store_membership_plans
      WHERE store_id = ? AND is_active = 1
      ORDER BY price ASC
    `).bind(storeId).all();

    const plans = (result.results ?? []).map((p: any) => ({
      id: p.id,
      storeId: p.store_id,
      name: p.name,
      price: p.price,
      durationDays: p.duration_days,
      description: p.description,
      benefits: p.benefits ? (typeof p.benefits === "string" ? JSON.parse(p.benefits) : p.benefits) : [],
      badgeColor: p.badge_color,
      planIcon: p.plan_icon,
      isActive: Boolean(p.is_active),
      maxMembers: p.max_members,
      termsAndConditions: p.terms_and_conditions,
      upiId: p.upi_id || "",
      qrCodeUrl: p.qr_code_url || "",
      linkedCouponIds: p.linked_coupon_ids ? (typeof p.linked_coupon_ids === "string" ? JSON.parse(p.linked_coupon_ids) : p.linked_coupon_ids) : [],
      createdAt: p.created_at,
      updatedAt: p.updated_at
    }));

    return NextResponse.json({ plans });
  } catch (error) {
    return NextResponse.json({ plans: [] });
  }
}
