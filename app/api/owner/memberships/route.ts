import { NextResponse } from "next/server";
import { requireApiSession } from "@/lib/auth";
import { apiError, PaymentRequiredError } from "@/lib/security";
import { requireFeaturePermission } from "@/lib/subscriptions";
import { getD1 } from "@/db/runtime";
import { getDb } from "@/db";
import { stores, storeMembershipPlans } from "@/db/schema";
import { eq, desc } from "drizzle-orm";

async function ensureTables() {
  try {
    const d1 = getD1();
    await d1.prepare(`
      CREATE TABLE IF NOT EXISTS store_membership_plans (
        id TEXT PRIMARY KEY,
        store_id TEXT NOT NULL,
        name TEXT NOT NULL,
        price REAL NOT NULL,
        duration_days INTEGER NOT NULL,
        description TEXT,
        benefits TEXT,
        badge_color TEXT,
        plan_icon TEXT,
        is_active INTEGER DEFAULT 1,
        max_members INTEGER,
        terms_and_conditions TEXT,
        upi_id TEXT,
        qr_code_url TEXT,
        linked_coupon_ids TEXT,
        has_free_trial INTEGER DEFAULT 0,
        free_trial_days INTEGER DEFAULT 7,
        fixed_expiry_date TEXT,
        reward_schedule_dates TEXT,
        member_offers TEXT,
        is_upgrade_option INTEGER DEFAULT 0,
        created_at INTEGER NOT NULL,
        updated_at INTEGER NOT NULL
      )
    `).run();

    // Safely add missing columns if table already existed
    const missingCols = [
      "ALTER TABLE store_membership_plans ADD COLUMN has_free_trial INTEGER DEFAULT 0",
      "ALTER TABLE store_membership_plans ADD COLUMN free_trial_days INTEGER DEFAULT 7",
      "ALTER TABLE store_membership_plans ADD COLUMN fixed_expiry_date TEXT",
      "ALTER TABLE store_membership_plans ADD COLUMN reward_schedule_dates TEXT",
      "ALTER TABLE store_membership_plans ADD COLUMN member_offers TEXT",
      "ALTER TABLE store_membership_plans ADD COLUMN is_upgrade_option INTEGER DEFAULT 0"
    ];

    for (const sql of missingCols) {
      try {
        await d1.prepare(sql).run();
      } catch {
        // column likely exists
      }
    }

    await d1.prepare(`
      CREATE TABLE IF NOT EXISTS customer_store_memberships (
        id TEXT PRIMARY KEY,
        store_id TEXT NOT NULL,
        plan_id TEXT NOT NULL,
        customer_id TEXT NOT NULL,
        customer_name TEXT,
        customer_email TEXT,
        plan_name TEXT NOT NULL,
        amount_paid REAL NOT NULL,
        utr TEXT,
        status TEXT DEFAULT 'pending_verification',
        rejection_reason TEXT,
        starts_at INTEGER,
        expires_at INTEGER,
        trial_ends_at INTEGER,
        reward_schedule_dates TEXT,
        member_offers TEXT,
        created_at INTEGER NOT NULL,
        updated_at INTEGER NOT NULL
      )
    `).run();

    const missingCustomerCols = [
      "ALTER TABLE customer_store_memberships ADD COLUMN trial_ends_at INTEGER",
      "ALTER TABLE customer_store_memberships ADD COLUMN reward_schedule_dates TEXT",
      "ALTER TABLE customer_store_memberships ADD COLUMN member_offers TEXT"
    ];

    for (const sql of missingCustomerCols) {
      try {
        await d1.prepare(sql).run();
      } catch {
        // column exists
      }
    }
  } catch (e) {
    console.warn("Table creation notice:", e);
  }
}

export async function GET(req: Request) {
  try {
    await ensureTables();
    const session = await requireApiSession(req);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    await requireFeaturePermission(session.user.id, "memberships");

    const url = new URL(req.url);
    let storeId = url.searchParams.get("storeId");
    if (storeId === "undefined" || storeId === "null" || !storeId) storeId = null;

    const db = getDb();

    if (!storeId) {
      try {
        const ownerStore = await db.query.stores.findFirst({
          where: eq(stores.ownerId, session.user.id),
        });
        if (ownerStore) storeId = ownerStore.id;
      } catch (e) {
        console.error("Failed to query owner store", e);
      }
    }

    if (!storeId) {
      return NextResponse.json({ plans: [] });
    }

    const d1 = getD1();
    const result = await d1.prepare(
      `SELECT * FROM store_membership_plans WHERE store_id = ? ORDER BY created_at DESC`
    ).bind(storeId).all();

    let rawPlans = result.results ?? [];
    const formattedPlans = rawPlans.map((p: any) => ({
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
      hasFreeTrial: Boolean(p.has_free_trial),
      freeTrialDays: p.free_trial_days || 7,
      fixedExpiryDate: p.fixed_expiry_date || "",
      rewardScheduleDates: p.reward_schedule_dates ? (typeof p.reward_schedule_dates === "string" ? JSON.parse(p.reward_schedule_dates) : p.reward_schedule_dates) : [],
      memberOffers: p.member_offers ? (typeof p.member_offers === "string" ? JSON.parse(p.member_offers) : p.member_offers) : [],
      isUpgradeOption: Boolean(p.is_upgrade_option),
      createdAt: p.created_at,
      updatedAt: p.updated_at
    }));

    return NextResponse.json({ plans: formattedPlans, storeId });
  } catch (err: any) {
    if (err instanceof PaymentRequiredError || err?.status === 402) {
      return apiError(err);
    }
    console.error("GET /api/owner/memberships error:", err);
    return NextResponse.json({ plans: [] });
  }
}

export async function POST(req: Request) {
  try {
    await ensureTables();
    const session = await requireApiSession(req);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    await requireFeaturePermission(session.user.id, "memberships");

    const body = await req.json();
    let {
      storeId, name, price, durationDays, description, badgeColor, planIcon,
      isActive, maxMembers, termsAndConditions, benefits, commissionAcknowledged,
      upiId, qrCodeUrl, linkedCouponIds,
      hasFreeTrial, freeTrialDays, fixedExpiryDate, rewardScheduleDates, memberOffers, isUpgradeOption
    } = body;

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
    if (isNaN(numPrice) || numPrice < (hasFreeTrial ? 0 : 80)) {
      return NextResponse.json({ error: "Minimum membership price is ₹80." }, { status: 400 });
    }

    if (!commissionAcknowledged) {
      return NextResponse.json({ error: "Commission policy not acknowledged." }, { status: 400 });
    }

    const planId = `plan_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
    const now = Math.floor(Date.now() / 1000);

    const benefitsJson = JSON.stringify(Array.isArray(benefits) ? benefits.filter(Boolean) : [String(description || "Exclusive membership perks")]);
    const couponsJson = JSON.stringify(Array.isArray(linkedCouponIds) ? linkedCouponIds : []);
    const scheduleJson = JSON.stringify(Array.isArray(rewardScheduleDates) ? rewardScheduleDates.filter(Boolean) : []);
    const offersJson = JSON.stringify(Array.isArray(memberOffers) ? memberOffers : []);

    const d1 = getD1();
    await d1.prepare(`
      INSERT INTO store_membership_plans (
        id, store_id, name, price, duration_days, description, benefits,
        badge_color, plan_icon, is_active, max_members, terms_and_conditions,
        upi_id, qr_code_url, linked_coupon_ids,
        has_free_trial, free_trial_days, fixed_expiry_date, reward_schedule_dates, member_offers, is_upgrade_option,
        created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).bind(
      planId, storeId, String(name).trim(), numPrice, Number(durationDays) || 30,
      String(description || "").trim(), benefitsJson, String(badgeColor || "#FF5722"),
      String(planIcon || "star"), isActive !== false ? 1 : 0, maxMembers ? Number(maxMembers) : null,
      termsAndConditions ? String(termsAndConditions) : null,
      upiId ? String(upiId).trim() : null,
      qrCodeUrl ? String(qrCodeUrl).trim() : null,
      couponsJson,
      hasFreeTrial ? 1 : 0, Number(freeTrialDays) || 7, fixedExpiryDate ? String(fixedExpiryDate).trim() : null,
      scheduleJson, offersJson, isUpgradeOption ? 1 : 0,
      now, now
    ).run();

    const newPlan = {
      id: planId, storeId, name: String(name).trim(), price: numPrice,
      durationDays: Number(durationDays) || 30, description: String(description || "").trim(),
      benefits: Array.isArray(benefits) ? benefits : [], badgeColor: String(badgeColor || "#FF5722"),
      planIcon: String(planIcon || "star"), isActive: isActive !== false, maxMembers: maxMembers ? Number(maxMembers) : null,
      termsAndConditions: termsAndConditions ? String(termsAndConditions) : null,
      upiId: upiId ? String(upiId).trim() : "", qrCodeUrl: qrCodeUrl ? String(qrCodeUrl).trim() : "",
      linkedCouponIds: Array.isArray(linkedCouponIds) ? linkedCouponIds : [], createdAt: now, updatedAt: now
    };

    return NextResponse.json({ success: true, plan: newPlan });
  } catch (err: any) {
    if (err instanceof PaymentRequiredError || err?.status === 402) {
      return apiError(err);
    }
    console.error("POST /api/owner/memberships error:", err);
    return NextResponse.json({ error: err instanceof Error ? err.message : "Failed to save plan" }, { status: 400 });
  }
}
