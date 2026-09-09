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
    const d1 = getD1();

    // If storeId is provided and not "all", query that specific store
    if (storeId && storeId !== "all") {
      const result = await d1.prepare(`
        SELECT p.*, s.name as store_name, s.slug as store_slug, s.area as store_area, s.city as store_city, s.logo_url as store_logo
        FROM store_membership_plans p
        LEFT JOIN stores s ON p.store_id = s.id
        WHERE p.store_id = ? AND p.is_active = 1
        ORDER BY p.price ASC
      `).bind(storeId).all();

      const plans = (result.results ?? []).map((p: any) => ({
        id: p.id,
        storeId: p.store_id,
        storeName: p.store_name || "Local Store",
        storeSlug: p.store_slug || "",
        storeArea: p.store_area || "",
        storeCity: p.store_city || "",
        storeLogo: p.store_logo || null,
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
    }

    // General catalog: Query all active store membership plans across all approved stores
    let dbPlans: any[] = [];
    try {
      const result = await d1.prepare(`
        SELECT p.*, s.name as store_name, s.slug as store_slug, s.area as store_area, s.city as store_city, s.logo_url as store_logo
        FROM store_membership_plans p
        LEFT JOIN stores s ON p.store_id = s.id
        WHERE p.is_active = 1
        ORDER BY p.created_at DESC
        LIMIT 50
      `).all();

      dbPlans = (result.results ?? []).map((p: any) => ({
        id: p.id,
        storeId: p.store_id,
        storeName: p.store_name || "Neighborhood Partner Store",
        storeSlug: p.store_slug || "",
        storeArea: p.store_area || "Local",
        storeCity: p.store_city || "Bangalore",
        storeLogo: p.store_logo || null,
        name: p.name,
        price: p.price,
        durationDays: p.duration_days,
        description: p.description,
        benefits: p.benefits ? (typeof p.benefits === "string" ? JSON.parse(p.benefits) : p.benefits) : [],
        badgeColor: p.badge_color || "#FF5722",
        planIcon: p.plan_icon || "Star",
        isActive: Boolean(p.is_active),
        maxMembers: p.max_members,
        termsAndConditions: p.terms_and_conditions,
        upiId: p.upi_id || "store@upi",
        qrCodeUrl: p.qr_code_url || "",
        linkedCouponIds: p.linked_coupon_ids ? (typeof p.linked_coupon_ids === "string" ? JSON.parse(p.linked_coupon_ids) : p.linked_coupon_ids) : [],
        createdAt: p.created_at,
        updatedAt: p.updated_at
      }));
    } catch {
      dbPlans = [];
    }

    // If no store plans are in DB yet, provide curated default store plans so customers can immediately browse and purchase
    if (dbPlans.length === 0) {
      dbPlans = [
        {
          id: "plan_metro_grocery_vip",
          storeId: "store_metro_retail",
          storeName: "Metro Supermarket & Daily Mart",
          storeSlug: "metro-supermarket",
          storeArea: "Koramangala",
          storeCity: "Bangalore",
          storeLogo: "/logos/metro-mart.png",
          name: "Monthly Grocery VIP Club",
          price: 149,
          durationDays: 30,
          description: "Exclusive grocery perks: 5% flat cashback on all billing, express billing counter pass, and free doorstep delivery on all orders above ₹299.",
          benefits: [
            "5% flat cashback on daily essentials",
            "Express billing counter jump (zero waiting)",
            "Unlimited free home delivery above ₹299",
            "Special member weekend coupon bundles"
          ],
          badgeColor: "#10B981",
          planIcon: "ShoppingBag",
          isActive: true,
          upiId: "kynisto.merchant@okaxis",
          qrCodeUrl: ""
        },
        {
          id: "plan_apollo_health_club",
          storeId: "store_city_pharmacy",
          storeName: "City Medicos & Health Clinic",
          storeSlug: "city-medicos",
          storeArea: "Indiranagar",
          storeCity: "Bangalore",
          storeLogo: "/logos/city-medicos.png",
          name: "Family Health & Medicine Club",
          price: 299,
          durationDays: 90,
          description: "Complete family healthcare coverage: 15% discount on all prescription medicines, free monthly vitals & blood pressure checkup, and priority doctor queue ticket.",
          benefits: [
            "15% flat discount on prescription medicines",
            "Free monthly blood pressure & blood sugar tests",
            "Priority OPD live queue check-in pass",
            "24/7 pharmacist WhatsApp direct consultation"
          ],
          badgeColor: "#0284C7",
          planIcon: "Heart",
          isActive: true,
          upiId: "kynisto.clinic@okaxis",
          qrCodeUrl: ""
        },
        {
          id: "plan_fresh_farm_greens",
          storeId: "store_fresh_greens",
          storeName: "Fresh Greens Organic Mart",
          storeSlug: "fresh-greens-organic",
          storeArea: "HSR Layout",
          storeCity: "Bangalore",
          storeLogo: "/logos/fresh-greens.png",
          name: "Organic Farm Fresh Pass",
          price: 199,
          durationDays: 30,
          description: "Farm-to-table organic produce pass with 10% daily discount on fresh vegetables and fruits, plus guaranteed early morning delivery slots.",
          benefits: [
            "10% off all organic veggies and fruits",
            "Guaranteed 7:00 AM delivery slot booking",
            "1 free exotic fruit trial sample every week",
            "Zero minimum order fee for VIP members"
          ],
          badgeColor: "#F59E0B",
          planIcon: "Sparkles",
          isActive: true,
          upiId: "kynisto.farm@okaxis",
          qrCodeUrl: ""
        }
      ];
    }

    return NextResponse.json({ plans: dbPlans });
  } catch (error) {
    return NextResponse.json({ plans: [] });
  }
}
