export * from "./subscriptions-shared";
import {
  ALL_PLANS,
  CUSTOMER_PLANS,
  SHOP_OWNER_PLANS,
  PlanConfig,
  DEFAULT_DB_PLANS,
  DEFAULT_MARKETPLACE_FEATURES,
  DEFAULT_MARKETPLACE_COMBOS,
  normalizeFeatureKey,
  getPlanConfig,
  calculateDaysRemaining,
  isSubscriptionExpiringSoon,
} from "./subscriptions-shared";
import { getD1 } from "@/db/runtime";
import { PaymentRequiredError } from "@/lib/security";
import { isCustomerMembershipEnabled, isOwnerMembershipEnabled } from "@/lib/settings";

export async function ensureSubscriptionTables() {
  try {
    const db = getD1();

    // 1. Master Plans Table
    await db.prepare(`
      CREATE TABLE IF NOT EXISTS plans (
        id TEXT PRIMARY KEY,
        role TEXT NOT NULL DEFAULT 'store_owner',
        name TEXT NOT NULL,
        price_monthly REAL NOT NULL DEFAULT 0,
        price_yearly REAL NOT NULL DEFAULT 0,
        currency TEXT NOT NULL DEFAULT 'INR',
        description TEXT,
        features TEXT,
        badge TEXT,
        is_popular INTEGER NOT NULL DEFAULT 0,
        is_recommended INTEGER NOT NULL DEFAULT 0,
        trial_days INTEGER NOT NULL DEFAULT 0,
        is_active INTEGER NOT NULL DEFAULT 1,
        max_stores INTEGER DEFAULT 1,
        max_daily_bookings INTEGER DEFAULT 30,
        max_staff INTEGER DEFAULT 0,
        max_favorites INTEGER DEFAULT 10,
        created_at INTEGER NOT NULL DEFAULT (unixepoch()),
        updated_at INTEGER NOT NULL DEFAULT (unixepoch())
      )
    `).run();

    const planColAlters = [
      "ALTER TABLE plans ADD COLUMN badge TEXT",
      "ALTER TABLE plans ADD COLUMN is_popular INTEGER NOT NULL DEFAULT 0",
      "ALTER TABLE plans ADD COLUMN is_recommended INTEGER NOT NULL DEFAULT 0",
      "ALTER TABLE plans ADD COLUMN trial_days INTEGER NOT NULL DEFAULT 0",
      "ALTER TABLE plans ADD COLUMN is_active INTEGER NOT NULL DEFAULT 1",
      "ALTER TABLE plans ADD COLUMN max_stores INTEGER DEFAULT 1",
      "ALTER TABLE plans ADD COLUMN max_daily_bookings INTEGER DEFAULT 30",
      "ALTER TABLE plans ADD COLUMN max_staff INTEGER DEFAULT 0",
      "ALTER TABLE plans ADD COLUMN max_favorites INTEGER DEFAULT 10",
      "ALTER TABLE plans ADD COLUMN updated_at INTEGER NOT NULL DEFAULT (unixepoch())",
    ];
    for (const statement of planColAlters) {
      try {
        await db.prepare(statement).run();
      } catch {}
    }

    // 2. Combo Plans Table
    await db.prepare(`
      CREATE TABLE IF NOT EXISTS combo_plans (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        slug TEXT NOT NULL UNIQUE,
        description TEXT,
        price REAL NOT NULL DEFAULT 0,
        original_price REAL DEFAULT 0,
        features TEXT,
        badge TEXT,
        is_active INTEGER NOT NULL DEFAULT 1,
        created_at INTEGER NOT NULL DEFAULT (unixepoch()),
        updated_at INTEGER NOT NULL DEFAULT (unixepoch())
      )
    `).run();

    // 3. Dynamic Features Table
    await db.prepare(`
      CREATE TABLE IF NOT EXISTS features (
        id TEXT PRIMARY KEY,
        key TEXT NOT NULL UNIQUE,
        name TEXT NOT NULL,
        description TEXT,
        category TEXT,
        price REAL NOT NULL DEFAULT 0,
        original_price REAL DEFAULT 0,
        badge TEXT,
        icon TEXT,
        is_active INTEGER NOT NULL DEFAULT 1,
        created_at INTEGER NOT NULL DEFAULT (unixepoch()),
        updated_at INTEGER NOT NULL DEFAULT (unixepoch())
      )
    `).run();

    // 4. Plan Features Junction Table (Permission Matrix)
    await db.prepare(`
      CREATE TABLE IF NOT EXISTS plan_features (
        id TEXT PRIMARY KEY,
        plan_id TEXT NOT NULL,
        feature_key TEXT NOT NULL,
        is_enabled INTEGER NOT NULL DEFAULT 1,
        created_at INTEGER NOT NULL DEFAULT (unixepoch())
      )
    `).run();

    // 5. Owner Subscriptions Table
    await db.prepare(`
      CREATE TABLE IF NOT EXISTS owner_subscriptions (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL UNIQUE,
        role TEXT NOT NULL DEFAULT 'store_owner',
        plan TEXT NOT NULL DEFAULT 'free',
        price REAL NOT NULL DEFAULT 0,
        billing_cycle TEXT NOT NULL DEFAULT 'monthly',
        status TEXT NOT NULL DEFAULT 'active',
        start_date INTEGER NOT NULL,
        expiry_date INTEGER NOT NULL,
        renewal_date INTEGER,
        trial INTEGER NOT NULL DEFAULT 0,
        cancel_at_period_end INTEGER NOT NULL DEFAULT 0,
        auto_renew INTEGER NOT NULL DEFAULT 1,
        created_at INTEGER NOT NULL DEFAULT (unixepoch()),
        updated_at INTEGER NOT NULL DEFAULT (unixepoch())
      )
    `).run();

    // 6. Customer Subscriptions Table
    await db.prepare(`
      CREATE TABLE IF NOT EXISTS customer_subscriptions (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL UNIQUE,
        role TEXT NOT NULL DEFAULT 'customer',
        plan TEXT NOT NULL DEFAULT 'free',
        price REAL NOT NULL DEFAULT 0,
        billing_cycle TEXT NOT NULL DEFAULT 'monthly',
        status TEXT NOT NULL DEFAULT 'active',
        start_date INTEGER NOT NULL,
        expiry_date INTEGER NOT NULL,
        renewal_date INTEGER,
        trial INTEGER NOT NULL DEFAULT 0,
        cancel_at_period_end INTEGER NOT NULL DEFAULT 0,
        auto_renew INTEGER NOT NULL DEFAULT 1,
        created_at INTEGER NOT NULL DEFAULT (unixepoch()),
        updated_at INTEGER NOT NULL DEFAULT (unixepoch())
      )
    `).run();

    // 7. Subscription History Log
    await db.prepare(`
      CREATE TABLE IF NOT EXISTS subscription_history (
        id TEXT PRIMARY KEY,
        subscription_id TEXT NOT NULL,
        user_id TEXT NOT NULL,
        role TEXT NOT NULL,
        action TEXT NOT NULL,
        old_plan TEXT,
        new_plan TEXT,
        price REAL NOT NULL DEFAULT 0,
        billing_cycle TEXT NOT NULL DEFAULT 'monthly',
        status TEXT NOT NULL DEFAULT 'completed',
        receipt_number TEXT,
        utr TEXT,
        created_at INTEGER NOT NULL DEFAULT (unixepoch())
      )
    `).run();

    // 8. Subscription Features Matrix (Legacy schema support)
    await db.prepare(`
      CREATE TABLE IF NOT EXISTS subscription_features (
        id TEXT PRIMARY KEY,
        plan_id TEXT NOT NULL,
        feature_key TEXT NOT NULL,
        is_enabled INTEGER NOT NULL DEFAULT 1,
        created_at INTEGER NOT NULL DEFAULT (unixepoch())
      )
    `).run();

    // 9. Subscription Daily Usage Metrics
    await db.prepare(`
      CREATE TABLE IF NOT EXISTS subscription_usage (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL,
        metric_key TEXT NOT NULL,
        usage_count INTEGER NOT NULL DEFAULT 0,
        period_date TEXT NOT NULL,
        updated_at INTEGER NOT NULL DEFAULT (unixepoch())
      )
    `).run();

    // 10. Subscription Limits Constraints
    await db.prepare(`
      CREATE TABLE IF NOT EXISTS subscription_limits (
        id TEXT PRIMARY KEY,
        plan_id TEXT NOT NULL UNIQUE,
        max_stores INTEGER NOT NULL DEFAULT 1,
        max_daily_bookings INTEGER NOT NULL DEFAULT 30,
        max_staff INTEGER NOT NULL DEFAULT 0,
        max_favorites INTEGER NOT NULL DEFAULT 10,
        allow_analytics INTEGER NOT NULL DEFAULT 0,
        allow_promotions INTEGER NOT NULL DEFAULT 0
      )
    `).run();

    // 11. Trial History Table (Strict Lifetime 1-Trial Enforcement)
    await db.prepare(`
      CREATE TABLE IF NOT EXISTS trial_history (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL,
        email TEXT,
        plan_id TEXT NOT NULL,
        trial_started_at INTEGER NOT NULL,
        trial_ended_at INTEGER NOT NULL,
        created_at INTEGER NOT NULL DEFAULT (unixepoch())
      )
    `).run();

    try {
      await db.prepare("ALTER TABLE trial_history ADD COLUMN email TEXT").run();
    } catch {}

    // 12. Subscription Messages from Users (Pending Payments)
    await db.prepare(`
      CREATE TABLE IF NOT EXISTS subscription_messages (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL,
        user_name TEXT NOT NULL,
        user_role TEXT NOT NULL,
        user_email TEXT NOT NULL,
        payment_time TEXT NOT NULL,
        amount_paid REAL NOT NULL,
        plan_id TEXT NOT NULL,
        plan_name TEXT NOT NULL,
        billing_cycle TEXT NOT NULL DEFAULT 'monthly',
        utr TEXT NOT NULL,
        status TEXT NOT NULL DEFAULT 'pending',
        admin_notes TEXT,
        created_at INTEGER NOT NULL DEFAULT (unixepoch())
      )
    `).run();

    // 13. Subscriptions (Legacy unified table for API compatibility)
    await db.prepare(`
      CREATE TABLE IF NOT EXISTS subscriptions (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL,
        store_id TEXT,
        user_role TEXT NOT NULL DEFAULT 'customer',
        plan_id TEXT NOT NULL DEFAULT 'free',
        billing_cycle TEXT NOT NULL DEFAULT 'monthly',
        amount REAL NOT NULL DEFAULT 0,
        status TEXT NOT NULL DEFAULT 'active',
        auto_renew INTEGER NOT NULL DEFAULT 1,
        starts_at INTEGER NOT NULL,
        expires_at INTEGER NOT NULL,
        cancelled_at INTEGER,
        payment_method TEXT NOT NULL DEFAULT 'upi',
        utr TEXT,
        receipt_number TEXT,
        created_at INTEGER NOT NULL DEFAULT (unixepoch()),
        updated_at INTEGER NOT NULL DEFAULT (unixepoch())
      )
    `).run();

    // 14. Subscription Transactions (Legacy unified table for API compatibility)
    await db.prepare(`
      CREATE TABLE IF NOT EXISTS subscription_transactions (
        id TEXT PRIMARY KEY,
        subscription_id TEXT NOT NULL,
        user_id TEXT NOT NULL,
        plan_id TEXT NOT NULL,
        billing_cycle TEXT NOT NULL,
        amount REAL NOT NULL,
        payment_method TEXT NOT NULL DEFAULT 'upi',
        upi_id TEXT NOT NULL DEFAULT '9315678560@fam',
        utr TEXT,
        status TEXT NOT NULL DEFAULT 'completed',
        receipt_number TEXT NOT NULL,
        refunded_at INTEGER,
        refund_amount REAL,
        created_at INTEGER NOT NULL DEFAULT (unixepoch())
      )
    `).run();

    // 15. Marketplace Features Table (Legacy compatibility)
    await db.prepare(`
      CREATE TABLE IF NOT EXISTS marketplace_features (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        slug TEXT NOT NULL UNIQUE,
        description TEXT,
        price REAL NOT NULL DEFAULT 0,
        original_price REAL DEFAULT 0,
        category TEXT,
        badge TEXT,
        icon TEXT,
        is_active INTEGER NOT NULL DEFAULT 1,
        created_at INTEGER NOT NULL DEFAULT (unixepoch()),
        updated_at INTEGER NOT NULL DEFAULT (unixepoch())
      )
    `).run();

    // 16. Marketplace Combos Table (Legacy compatibility)
    await db.prepare(`
      CREATE TABLE IF NOT EXISTS marketplace_combos (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        slug TEXT NOT NULL UNIQUE,
        description TEXT,
        price REAL NOT NULL DEFAULT 0,
        original_price REAL DEFAULT 0,
        features TEXT,
        badge TEXT,
        is_active INTEGER NOT NULL DEFAULT 1,
        created_at INTEGER NOT NULL DEFAULT (unixepoch()),
        updated_at INTEGER NOT NULL DEFAULT (unixepoch())
      )
    `).run();

    // -------------------------------------------------------------
    // SEEDING DEFAULT PLANS, COMBOS, FEATURES & PERMISSION MAPPINGS
    // -------------------------------------------------------------

    // Seed master `plans` table if empty
    try {
      const planCount = await db.prepare(`SELECT COUNT(*) as count FROM plans`).first<{ count: number }>();
      if (!planCount || planCount.count === 0) {
        const defaultPlansToSeed = [
          { id: "free", role: "customer", name: "Free Customer", priceMonthly: 0, priceYearly: 0, description: "Essential discovery & queue tracking", features: JSON.stringify(["Join unlimited queues", "Basic notifications"]) },
          { id: "premium", role: "customer", name: "Premium Customer", priceMonthly: 49, priceYearly: 499, description: "VIP Ad-free experience & perks", features: JSON.stringify(["Ad-free experience", "Priority Queue Access", "VIP Perks"]), badge: "MOST POPULAR" },
          { id: "starter", role: "store_owner", name: "Starter", priceMonthly: 299, priceYearly: 2999, description: "Queue management & store reports", features: JSON.stringify(["1 Store", "Unlimited Daily Bookings", "Queue Management", "Basic Analytics"]), badge: "RECOMMENDED" },
          { id: "pro", role: "store_owner", name: "Pro", priceMonthly: 499, priceYearly: 4999, description: "Multi-store, staff, AI & WhatsApp", features: JSON.stringify(["Up to 5 Stores", "Staff Management", "Advanced Analytics", "WhatsApp Alerts", "AI Features"]), badge: "ADVANCED SCALE" },
          { id: "enterprise", role: "store_owner", name: "Enterprise", priceMonthly: 0, priceYearly: 0, description: "Custom pricing & unlimited access", features: JSON.stringify(["Unlimited Stores", "Unlimited Staff", "Dedicated Support", "Custom API Integrations"]), badge: "CUSTOM SCALE" },
        ];
        for (const p of defaultPlansToSeed) {
          await db
            .prepare(
              `INSERT OR IGNORE INTO plans (id, role, name, price_monthly, price_yearly, currency, description, features, badge, is_active)
               VALUES (?, ?, ?, ?, ?, 'INR', ?, ?, ?, 1)`
            )
            .bind(p.id, p.role, p.name, p.priceMonthly, p.priceYearly, p.description, p.features, p.badge || "")
            .run();
        }
      }
    } catch (e) {
      console.error("Error seeding plans:", e);
    }

    // Seed `features` table if empty
    try {
      const featureCount = await db.prepare(`SELECT COUNT(*) as count FROM features`).first<{ count: number }>();
      if (!featureCount || featureCount.count === 0) {
        for (const f of DYNAMIC_FEATURES) {
          await db
            .prepare(
              `INSERT OR IGNORE INTO features (id, key, name, description, category, price, original_price, badge, icon, is_active)
               VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
            )
            .bind(f.id, f.key, f.name, f.description, f.category, f.price, f.originalPrice || 0, f.badge || "", f.icon || "", f.isActive ? 1 : 0)
            .run();
        }
      }
    } catch (e) {
      console.error("Error seeding features:", e);
    }

    // Seed `combo_plans` table if empty
    try {
      const comboPlanCount = await db.prepare(`SELECT COUNT(*) as count FROM combo_plans`).first<{ count: number }>();
      if (!comboPlanCount || comboPlanCount.count === 0) {
        for (const c of DEFAULT_MARKETPLACE_COMBOS) {
          await db
            .prepare(
              `INSERT OR IGNORE INTO combo_plans (id, name, slug, description, price, original_price, features, badge, is_active)
               VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`
            )
            .bind(c.id, c.name, c.slug, c.description, c.price, c.originalPrice || 0, JSON.stringify(c.features), c.badge || "", c.isActive ? 1 : 0)
            .run();
        }
      }
    } catch (e) {
      console.error("Error seeding combo_plans:", e);
    }

    // Seed `plan_features` junction table if empty
    try {
      const pfCount = await db.prepare(`SELECT COUNT(*) as count FROM plan_features`).first<{ count: number }>();
      if (!pfCount || pfCount.count === 0) {
        const defaultPermissionMappings: { planId: string; featureKey: string }[] = [
          // Customer free
          { planId: "free", featureKey: "qr_queue" },

          // Customer premium
          { planId: "premium", featureKey: "live_queue" },
          { planId: "premium", featureKey: "qr_queue" },
          { planId: "premium", featureKey: "verified_badge" },
          { planId: "premium", featureKey: "promotions" },

          // Owner starter
          { planId: "starter", featureKey: "live_queue" },
          { planId: "starter", featureKey: "qr_queue" },
          { planId: "starter", featureKey: "analytics" },
          { planId: "starter", featureKey: "custom_branding" },
          { planId: "starter", featureKey: "reports_export" },

          // Owner pro
          { planId: "pro", featureKey: "live_queue" },
          { planId: "pro", featureKey: "qr_queue" },
          { planId: "pro", featureKey: "analytics" },
          { planId: "pro", featureKey: "custom_branding" },
          { planId: "pro", featureKey: "whatsapp" },
          { planId: "pro", featureKey: "staff_management" },
          { planId: "pro", featureKey: "membership_management" },
          { planId: "pro", featureKey: "ai_assistant" },
          { planId: "pro", featureKey: "inventory_management" },
          { planId: "pro", featureKey: "promotions" },
          { planId: "pro", featureKey: "top_search_ranking" },
          { planId: "pro", featureKey: "reports_export" },
          { planId: "pro", featureKey: "coupons" },

          // Owner enterprise (all features)
          ...DYNAMIC_FEATURES.map((f) => ({ planId: "enterprise", featureKey: f.key })),

          // Combo Packs permissions
          { planId: "combo_starter_pack", featureKey: "verified_badge" },
          { planId: "combo_starter_pack", featureKey: "live_queue" },

          { planId: "combo_growth_pack", featureKey: "live_queue" },
          { planId: "combo_growth_pack", featureKey: "promotions" },
          { planId: "combo_growth_pack", featureKey: "analytics" },

          { planId: "combo_visibility_pack", featureKey: "verified_badge" },
          { planId: "combo_visibility_pack", featureKey: "top_search_ranking" },
          { planId: "combo_visibility_pack", featureKey: "promotions" },

          { planId: "combo_smart_business_pack", featureKey: "live_queue" },
          { planId: "combo_smart_business_pack", featureKey: "analytics" },
          { planId: "combo_smart_business_pack", featureKey: "top_search_ranking" },
          { planId: "combo_smart_business_pack", featureKey: "membership_management" },

          ...DYNAMIC_FEATURES.map((f) => ({ planId: "combo_ultimate_business_pack", featureKey: f.key })),
        ];

        for (const mapping of defaultPermissionMappings) {
          const pfId = `pf_${mapping.planId}_${mapping.featureKey}`;
          await db
            .prepare(
              `INSERT OR IGNORE INTO plan_features (id, plan_id, feature_key, is_enabled)
               VALUES (?, ?, ?, 1)`
            )
            .bind(pfId, mapping.planId, mapping.featureKey)
            .run();

          // Also populate legacy subscription_features table for backward compatibility
          await db
            .prepare(
              `INSERT OR IGNORE INTO subscription_features (id, plan_id, feature_key, is_enabled)
               VALUES (?, ?, ?, 1)`
            )
            .bind(pfId, mapping.planId, mapping.featureKey)
            .run();
        }
      }
    } catch (e) {
      console.error("Error seeding plan_features:", e);
    }

    // Seed marketplace_features legacy table if empty
    try {
      const featCount = await db
        .prepare(`SELECT COUNT(*) as count FROM marketplace_features`)
        .first<{ count: number }>();

      if (!featCount || featCount.count === 0) {
        for (const feat of DEFAULT_MARKETPLACE_FEATURES) {
          await db
            .prepare(
              `INSERT OR IGNORE INTO marketplace_features (id, name, slug, description, price, original_price, category, badge, icon, is_active)
               VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
            )
            .bind(
              feat.id,
              feat.name,
              feat.slug,
              feat.description,
              feat.price,
              feat.originalPrice || 0,
              feat.category || "",
              feat.badge || "",
              feat.icon || "",
              feat.isActive ? 1 : 0
            )
            .run();
        }
      }
    } catch (e) {
      console.error("Error seeding marketplace_features:", e);
    }

    // Seed marketplace_combos legacy table if empty
    try {
      const comboCount = await db
        .prepare(`SELECT COUNT(*) as count FROM marketplace_combos`)
        .first<{ count: number }>();

      if (!comboCount || comboCount.count === 0) {
        for (const combo of DEFAULT_MARKETPLACE_COMBOS) {
          await db
            .prepare(
              `INSERT OR IGNORE INTO marketplace_combos (id, name, slug, description, price, original_price, features, badge, is_active)
               VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`
            )
            .bind(
              combo.id,
              combo.name,
              combo.slug,
              combo.description,
              combo.price,
              combo.originalPrice || 0,
              JSON.stringify(combo.features),
              combo.badge || "",
              combo.isActive ? 1 : 0
            )
            .run();
        }
      }
    } catch (e) {
      console.error("Error seeding marketplace_combos:", e);
    }
  } catch (error) {
    console.error("Subscription table initialization error:", error);
  }
}

// -------------------------------------------------------------
// FEATURE CHECKER & INHERITANCE HELPERS
// -------------------------------------------------------------
export function getPlanConfig(planId: string): PlanConfig {
  return ALL_PLANS[planId] || ALL_PLANS.free;
}

export function planHasFeature(planId: string, featureName: string): boolean {
  const plan = getPlanConfig(planId);
  const normalizedFeature = featureName.toLowerCase();
  return plan.features.some((f) => f.toLowerCase().includes(normalizedFeature));
}

export function getMaxFavorites(planId: string): number {
  const plan = getPlanConfig(planId);
  return plan.maxFavorites ?? 10;
}

export function getStoreLimit(planId: string): number {
  const plan = getPlanConfig(planId);
  return plan.maxStores ?? (planId === "pro" ? 5 : planId === "enterprise" ? Infinity : 1);
}

export function getBookingLimit(planId: string): number {
  const plan = getPlanConfig(planId);
  return plan.maxDailyBookings ?? (planId === "free" ? 30 : Infinity);
}

export function getStaffLimit(planId: string): number {
  const plan = getPlanConfig(planId);
  return plan.maxStaff ?? (planId === "pro" ? 5 : planId === "enterprise" ? Infinity : 0);
}

export async function getCustomerActivePlan(userId: string): Promise<PlanConfig> {
  try {
    await ensureSubscriptionTables();
    const db = getD1();
    const now = Math.floor(Date.now() / 1000);

    const custSub = await db
      .prepare(
        `SELECT plan FROM customer_subscriptions WHERE user_id = ? AND status = 'active' AND expiry_date > ? ORDER BY expiry_date DESC LIMIT 1`
      )
      .bind(userId, now)
      .first<{ plan: string }>();

    if (custSub?.plan) {
      return getPlanConfig(custSub.plan);
    }

    const legacySub = await db
      .prepare(
        `SELECT plan_id FROM subscriptions WHERE user_id = ? AND status = 'active' AND expires_at > ? ORDER BY expires_at DESC LIMIT 1`
      )
      .bind(userId, now)
      .first<{ plan_id: string }>();

    if (legacySub?.plan_id) {
      return getPlanConfig(legacySub.plan_id);
    }
  } catch (err) {
    console.error("Error fetching customer active plan:", err);
  }

  return CUSTOMER_PLANS.free;
}

export async function getOwnerActivePlan(ownerId: string): Promise<PlanConfig> {
  try {
    await ensureSubscriptionTables();
    const db = getD1();
    const now = Math.floor(Date.now() / 1000);

    const ownerSub = await db
      .prepare(
        `SELECT plan FROM owner_subscriptions WHERE user_id = ? AND status = 'active' AND expiry_date > ? ORDER BY expiry_date DESC LIMIT 1`
      )
      .bind(ownerId, now)
      .first<{ plan: string }>();

    if (ownerSub?.plan) {
      return getPlanConfig(ownerSub.plan);
    }

    const legacySub = await db
      .prepare(
        `SELECT plan_id FROM subscriptions WHERE user_id = ? AND status = 'active' AND expires_at > ? ORDER BY expires_at DESC LIMIT 1`
      )
      .bind(ownerId, now)
      .first<{ plan_id: string }>();

    if (legacySub?.plan_id) {
      return getPlanConfig(legacySub.plan_id);
    }
  } catch (err) {
    console.error("Error fetching owner active plan:", err);
  }

  return SHOP_OWNER_PLANS.free;
}

export async function grantWelcomeSubscriptionReward(
  userId: string,
  userRole: "admin" | "store_owner" | "customer"
): Promise<{
  granted: boolean;
  isNewlyGranted: boolean;
  planId: string;
  planName: string;
  worth: number;
  expiresAt: number;
}> {
  const db = getD1();
  const now = Math.floor(Date.now() / 1000);
  const thirtyDaysInSeconds = 30 * 86400; // 1 month
  const expiresAt = now + thirtyDaysInSeconds;

  await ensureSubscriptionTables();

  const isOwner = userRole === "store_owner";
  const planId = isOwner ? "pro" : "premium";
  const planName = isOwner ? "Pro" : "Premium";
  const worth = isOwner ? 499 : 49;

  try {
    // Check existing active or past subscriptions
    const existing = await db
      .prepare(
        `SELECT id, plan_id AS planId, expires_at AS expiresAt FROM subscriptions WHERE user_id = ? ORDER BY expires_at DESC LIMIT 1`
      )
      .bind(userId)
      .first<{ id: string; planId: string; expiresAt: number }>();

    if (!existing) {
      const subId = `sub_welcome_${userId}`;
      const receiptNo = `RCP-WELCOME-${Math.floor(100000 + Math.random() * 900000)}`;

      await db
        .prepare(
          `INSERT OR IGNORE INTO subscriptions (id, user_id, user_role, plan_id, billing_cycle, amount, status, auto_renew, starts_at, expires_at, payment_method, receipt_number, created_at, updated_at)
           VALUES (?, ?, ?, ?, 'monthly', ?, 'active', 0, ?, ?, 'welcome_reward', ?, ?, ?)`
        )
        .bind(subId, userId, userRole, planId, worth, now, expiresAt, receiptNo, now, now)
        .run();

      const table = isOwner ? "owner_subscriptions" : "customer_subscriptions";
      await db
        .prepare(
          `INSERT OR IGNORE INTO ${table} (id, user_id, role, plan, price, billing_cycle, status, start_date, expiry_date, trial, auto_renew, created_at, updated_at)
           VALUES (?, ?, ?, ?, ?, 'monthly', 'active', ?, ?, 1, 0, ?, ?)`
        )
        .bind(subId, userId, userRole, planId, worth, now, expiresAt, now, now)
        .run();

      return {
        granted: true,
        isNewlyGranted: true,
        planId,
        planName,
        worth,
        expiresAt,
      };
    }

    return {
      granted: true,
      isNewlyGranted: false,
      planId: existing.planId,
      planName: existing.planId === "pro" ? "Pro" : existing.planId === "premium" ? "Premium" : existing.planId,
      worth: existing.planId === "pro" ? 499 : existing.planId === "premium" ? 49 : 0,
      expiresAt: existing.expiresAt,
    };
  } catch (err) {
    console.error("Error granting welcome reward:", err);
    return {
      granted: false,
      isNewlyGranted: false,
      planId,
      planName,
      worth,
      expiresAt,
    };
  }
}

export function calculateDaysRemaining(
  expiresAt: number,
  now: number = Math.floor(Date.now() / 1000)
): number {
  const secondsRemaining = expiresAt - now;
  if (secondsRemaining <= 0) return 0;
  return Math.floor(secondsRemaining / 86400);
}

export function isSubscriptionExpiringSoon(
  expiresAt: number,
  status: string = "active",
  now: number = Math.floor(Date.now() / 1000)
): boolean {
  if (status !== "active") return false;
  if (expiresAt <= now) return false;
  const daysRemaining = calculateDaysRemaining(expiresAt, now);
  return daysRemaining >= 0 && daysRemaining <= 3;
}

// -------------------------------------------------------------
// DYNAMIC FEATURE & PERMISSION HELPER FUNCTIONS
// -------------------------------------------------------------

/**
 * Normalizes any feature key, slug, or title to standard database key format.
 */
export function normalizeFeatureKey(featureKey: string): string {
  const k = featureKey.toLowerCase().trim().replace(/-/g, "_");
  if (k === "live_queue_pro" || k === "feat_live_queue_pro") return "live_queue";
  if (k === "analytics_pro" || k === "feat_analytics_pro") return "analytics";
  if (k === "verified_badge" || k === "feat_verified_badge") return "verified_badge";
  if (k === "promotions" || k === "feat_promotions") return "promotions";
  if (k === "top_search_ranking" || k === "feat_top_search_ranking") return "top_search_ranking";
  if (k === "membership_management" || k === "feat_membership_management") return "membership_management";
  if (k === "future_features_pass" || k === "feat_future_features_pass") return "ai_assistant";
  if (k === "staff_management") return "staff_management";
  if (k === "custom_branding") return "custom_branding";
  if (k === "qr_queue") return "qr_queue";
  if (k === "whatsapp") return "whatsapp";
  if (k === "ai_assistant") return "ai_assistant";
  if (k === "inventory_management") return "inventory_management";
  if (k === "reports_export") return "reports_export";
  if (k === "coupons") return "coupons";
  return k;
}

/**
 * Fetches user's current active subscription state from D1 tables.
 */
export async function getUserActiveSubscription(userId: string): Promise<{
  planId: string;
  role: "customer" | "store_owner";
  status: string;
  expiresAt: number;
}> {
  try {
    await ensureSubscriptionTables();
    const db = getD1();
    const now = Math.floor(Date.now() / 1000);

    // 1. Check owner subscriptions
    const ownerSub = await db
      .prepare(
        `SELECT plan, status, expiry_date FROM owner_subscriptions WHERE user_id = ? AND status = 'active' AND expiry_date > ? ORDER BY expiry_date DESC LIMIT 1`
      )
      .bind(userId, now)
      .first<{ plan: string; status: string; expiry_date: number }>();

    if (ownerSub?.plan) {
      return {
        planId: ownerSub.plan,
        role: "store_owner",
        status: ownerSub.status,
        expiresAt: ownerSub.expiry_date,
      };
    }

    // 2. Check customer subscriptions
    const custSub = await db
      .prepare(
        `SELECT plan, status, expiry_date FROM customer_subscriptions WHERE user_id = ? AND status = 'active' AND expiry_date > ? ORDER BY expiry_date DESC LIMIT 1`
      )
      .bind(userId, now)
      .first<{ plan: string; status: string; expiry_date: number }>();

    if (custSub?.plan) {
      return {
        planId: custSub.plan,
        role: "customer",
        status: custSub.status,
        expiresAt: custSub.expiry_date,
      };
    }

    // 3. Check legacy subscriptions table
    const legacySub = await db
      .prepare(
        `SELECT plan_id, user_role, status, expires_at FROM subscriptions WHERE user_id = ? AND status = 'active' AND expires_at > ? ORDER BY expires_at DESC LIMIT 1`
      )
      .bind(userId, now)
      .first<{ plan_id: string; user_role: "customer" | "store_owner"; status: string; expires_at: number }>();

    if (legacySub?.plan_id) {
      return {
        planId: legacySub.plan_id,
        role: legacySub.user_role || "customer",
        status: legacySub.status,
        expiresAt: legacySub.expires_at,
      };
    }
  } catch (err) {
    console.error("Error fetching user active subscription:", err);
  }

  return {
    planId: "free",
    role: "customer",
    status: "active",
    expiresAt: Math.floor(Date.now() / 1000) + 365 * 86400,
  };
}

export function getFeatureMetadata(featureKey: string, userRole: string = "store_owner"): {
  featureKey: string;
  featureName: string;
  availablePlans: PlanConfig[];
} {
  const norm = normalizeFeatureKey(featureKey);
  const isCustomer = userRole === "customer";

  let name = "Premium Feature";
  let plans: PlanConfig[] = [];

  if (isCustomer) {
    if (norm === "live_queue" || norm === "queue") {
      name = "Live Queue Access";
    } else if (norm === "chat") {
      name = "Chat & Messaging";
    } else {
      name = featureKey.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
    }
    plans = [CUSTOMER_PLANS.premium];
  } else {
    switch (norm) {
      case "analytics":
        name = "Analytics Pro";
        plans = [SHOP_OWNER_PLANS.starter, SHOP_OWNER_PLANS.pro, SHOP_OWNER_PLANS.enterprise];
        break;
      case "catalog":
      case "inventory_management":
        name = "Catalog & Inventory Management";
        plans = [SHOP_OWNER_PLANS.starter, SHOP_OWNER_PLANS.pro, SHOP_OWNER_PLANS.enterprise];
        break;
      case "healthcare":
        name = "Healthcare Live Queue Management";
        plans = [SHOP_OWNER_PLANS.starter, SHOP_OWNER_PLANS.pro, SHOP_OWNER_PLANS.enterprise];
        break;
      case "live_queue":
      case "queue":
        name = "Live Queue Pro";
        plans = [SHOP_OWNER_PLANS.starter, SHOP_OWNER_PLANS.pro, SHOP_OWNER_PLANS.enterprise];
        break;
      case "membership_management":
      case "memberships":
        name = "Membership & Loyalty Management";
        plans = [SHOP_OWNER_PLANS.pro, SHOP_OWNER_PLANS.enterprise];
        break;
      case "chat":
        name = "Chat & Messaging";
        plans = [SHOP_OWNER_PLANS.starter, SHOP_OWNER_PLANS.pro, SHOP_OWNER_PLANS.enterprise];
        break;
      default:
        name = featureKey.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
        plans = [SHOP_OWNER_PLANS.starter, SHOP_OWNER_PLANS.pro, SHOP_OWNER_PLANS.enterprise];
        break;
    }
  }

  return {
    featureKey,
    featureName: name,
    availablePlans: plans,
  };
}

/**
 * Dynamic DB permission checker function.
 * Checks whether a given user has permission to access a feature based on their active plan/combo permissions in D1.
 */
export async function checkUserFeaturePermission(userId: string, featureKey: string): Promise<boolean> {
  try {
    await ensureSubscriptionTables();
    const db = getD1();

    // 1. Admin bypass check
    const user = await db
      .prepare("SELECT role FROM users WHERE id = ? LIMIT 1")
      .bind(userId)
      .first<{ role: string }>();

    if (user?.role === "admin") {
      return true;
    }

    const isCustomer = user?.role === "customer";
    const isOwner = user?.role === "store_owner" || user?.role === "owner";

    // 2. Global Platform Admin Setting Override
    // If admin has turned OFF membership for customers, all customer feature restrictions stop immediately!
    if (isCustomer) {
      const customerMembershipAllowed = await isCustomerMembershipEnabled();
      if (!customerMembershipAllowed) {
        return true;
      }
    }

    // If admin has turned OFF membership for shop owners, all shop owner feature restrictions stop immediately!
    if (isOwner) {
      const ownerMembershipAllowed = await isOwnerMembershipEnabled();
      if (!ownerMembershipAllowed) {
        return true;
      }
    }

    const normalizedKey = normalizeFeatureKey(featureKey);
    const sub = await getUserActiveSubscription(userId);

    // Enterprise plan unlocks all features automatically
    if (sub.planId.toLowerCase() === "enterprise") {
      return true;
    }

    // Check plan_features junction table for active plan permission
    const result = await db
      .prepare(
        `SELECT COUNT(*) as count FROM plan_features WHERE plan_id = ? AND feature_key = ? AND is_enabled = 1`
      )
      .bind(sub.planId, normalizedKey)
      .first<{ count: number }>();

    if (result && result.count > 0) {
      return true;
    }

    // Also check subscription_features legacy matrix
    const legacyResult = await db
      .prepare(
        `SELECT COUNT(*) as count FROM subscription_features WHERE plan_id = ? AND feature_key = ? AND is_enabled = 1`
      )
      .bind(sub.planId, normalizedKey)
      .first<{ count: number }>();

    if (legacyResult && legacyResult.count > 0) {
      return true;
    }

    // Check plan feature flags based on role & plan
    if (sub.role === "customer") {
      if (sub.planId === "premium") return true;
      return false;
    }

    if (sub.role === "store_owner") {
      if (sub.planId === "starter") {
        if (["analytics", "catalog", "inventory_management", "healthcare", "live_queue", "queue", "chat"].includes(normalizedKey)) {
          return true;
        }
      } else if (sub.planId === "pro" || sub.planId === "enterprise") {
        return true;
      }
    }

    // Fallback: check static plan features configuration
    const planConfig = getPlanConfig(sub.planId);
    if (planConfig) {
      const hasFeatureText = planConfig.features.some((f) =>
        f.toLowerCase().includes(normalizedKey.replace(/_/g, " ")) ||
        f.toLowerCase().includes(featureKey.toLowerCase())
      );
      if (hasFeatureText) return true;

      // Check specific planConfig flags
      if (normalizedKey === "analytics" && planConfig.allowAnalytics) return true;
      if (normalizedKey === "custom_branding" && planConfig.allowCustomBranding) return true;
      if (normalizedKey === "whatsapp" && planConfig.allowWhatsappAlerts) return true;
      if (normalizedKey === "staff_management" && planConfig.allowStaffAccounts) return true;
      if (normalizedKey === "promotions" && planConfig.allowPromotions) return true;
      if (normalizedKey === "qr_queue" && planConfig.allowQrQueue) return true;
      if (normalizedKey === "reports_export" && planConfig.allowReportsExport) return true;
      if (normalizedKey === "coupons" && planConfig.allowCoupons) return true;
    }
  } catch (err) {
    console.error("Error checking user feature permission:", err);
  }

  return false;
}

/**
 * Requires feature permission for a user.
 * Throws PaymentRequiredError (HTTP 402) if validation fails.
 */
export async function requireFeaturePermission(
  userId: string,
  featureKey: string
): Promise<{ allowed: boolean }> {
  const allowed = await checkUserFeaturePermission(userId, featureKey);
  if (allowed) {
    return { allowed: true };
  }

  const sub = await getUserActiveSubscription(userId);
  const metadata = getFeatureMetadata(featureKey, sub.role);

  throw new PaymentRequiredError(
    featureKey,
    metadata.featureName,
    metadata.availablePlans,
    `Feature '${metadata.featureName}' is restricted under your current ${sub.planId.toUpperCase()} subscription. Please upgrade your plan to unlock this feature.`
  );
}

// -------------------------------------------------------------
// D1 MARKETPLACE CRUD HELPERS
// -------------------------------------------------------------
export async function getMarketplaceFeatures(activeOnly: boolean = false): Promise<MarketplaceFeature[]> {
  try {
    await ensureSubscriptionTables();
    const db = getD1();

    // Check master features table first
    const featRes = await db
      .prepare(
        activeOnly
          ? `SELECT id, name, key AS slug, description, price, original_price AS originalPrice, category, badge, icon, is_active AS isActive, created_at AS createdAt, updated_at AS updatedAt FROM features WHERE is_active = 1 ORDER BY price ASC`
          : `SELECT id, name, key AS slug, description, price, original_price AS originalPrice, category, badge, icon, is_active AS isActive, created_at AS createdAt, updated_at AS updatedAt FROM features ORDER BY price ASC`
      )
      .all<Record<string, unknown>>();

    if (featRes.results && featRes.results.length > 0) {
      return featRes.results.map((r: Record<string, unknown>) => ({
        id: String(r.id),
        name: String(r.name),
        slug: String(r.slug),
        description: String(r.description || ""),
        price: Number(r.price || 0),
        originalPrice: Number(r.originalPrice || 0),
        category: String(r.category || ""),
        badge: String(r.badge || ""),
        icon: String(r.icon || ""),
        isActive: Boolean(r.isActive),
        createdAt: Number(r.createdAt || 0),
        updatedAt: Number(r.updatedAt || 0),
      }));
    }

    const query = activeOnly
      ? `SELECT id, name, slug, description, price, original_price AS originalPrice, category, badge, icon, is_active AS isActive, created_at AS createdAt, updated_at AS updatedAt FROM marketplace_features WHERE is_active = 1 ORDER BY price ASC`
      : `SELECT id, name, slug, description, price, original_price AS originalPrice, category, badge, icon, is_active AS isActive, created_at AS createdAt, updated_at AS updatedAt FROM marketplace_features ORDER BY price ASC`;
    const res = await db.prepare(query).all<Record<string, unknown>>();
    if (res.results && res.results.length > 0) {
      return res.results.map((r: Record<string, unknown>) => ({
        id: String(r.id),
        name: String(r.name),
        slug: String(r.slug),
        description: String(r.description || ""),
        price: Number(r.price || 0),
        originalPrice: Number(r.originalPrice || 0),
        category: String(r.category || ""),
        badge: String(r.badge || ""),
        icon: String(r.icon || ""),
        isActive: Boolean(r.isActive),
        createdAt: Number(r.createdAt || 0),
        updatedAt: Number(r.updatedAt || 0),
      }));
    }
  } catch (err) {
    console.error("Error fetching marketplace features:", err);
  }
  return activeOnly ? DEFAULT_MARKETPLACE_FEATURES.filter((f) => f.isActive) : DEFAULT_MARKETPLACE_FEATURES;
}

export async function getMarketplaceCombos(activeOnly: boolean = false): Promise<MarketplaceCombo[]> {
  try {
    await ensureSubscriptionTables();
    const db = getD1();

    // Check combo_plans table first
    const comboPlanRes = await db
      .prepare(
        activeOnly
          ? `SELECT id, name, slug, description, price, original_price AS originalPrice, features, badge, is_active AS isActive, created_at AS createdAt, updated_at AS updatedAt FROM combo_plans WHERE is_active = 1 ORDER BY price ASC`
          : `SELECT id, name, slug, description, price, original_price AS originalPrice, features, badge, is_active AS isActive, created_at AS createdAt, updated_at AS updatedAt FROM combo_plans ORDER BY price ASC`
      )
      .all<Record<string, unknown>>();

    if (comboPlanRes.results && comboPlanRes.results.length > 0) {
      return comboPlanRes.results.map((r: Record<string, unknown>) => {
        let features: string[] = [];
        try {
          features = typeof r.features === "string" ? JSON.parse(r.features) : (Array.isArray(r.features) ? (r.features as string[]) : []);
        } catch {
          features = [];
        }
        return {
          id: String(r.id),
          name: String(r.name),
          slug: String(r.slug),
          description: String(r.description || ""),
          price: Number(r.price || 0),
          originalPrice: Number(r.originalPrice || 0),
          badge: String(r.badge || ""),
          isActive: Boolean(r.isActive),
          features,
          createdAt: Number(r.createdAt || 0),
          updatedAt: Number(r.updatedAt || 0),
        };
      });
    }

    const query = activeOnly
      ? `SELECT id, name, slug, description, price, original_price AS originalPrice, features, badge, is_active AS isActive, created_at AS createdAt, updated_at AS updatedAt FROM marketplace_combos WHERE is_active = 1 ORDER BY price ASC`
      : `SELECT id, name, slug, description, price, original_price AS originalPrice, features, badge, is_active AS isActive, created_at AS createdAt, updated_at AS updatedAt FROM marketplace_combos ORDER BY price ASC`;
    const res = await db.prepare(query).all<Record<string, unknown>>();
    if (res.results && res.results.length > 0) {
      return res.results.map((r: Record<string, unknown>) => {
        let features: string[] = [];
        try {
          features = typeof r.features === "string" ? JSON.parse(r.features) : (Array.isArray(r.features) ? (r.features as string[]) : []);
        } catch {
          features = [];
        }
        return {
          id: String(r.id),
          name: String(r.name),
          slug: String(r.slug),
          description: String(r.description || ""),
          price: Number(r.price || 0),
          originalPrice: Number(r.originalPrice || 0),
          badge: String(r.badge || ""),
          isActive: Boolean(r.isActive),
          features,
          createdAt: Number(r.createdAt || 0),
          updatedAt: Number(r.updatedAt || 0),
        };
      });
    }
  } catch (err) {
    console.error("Error fetching marketplace combos:", err);
  }
  return activeOnly ? DEFAULT_MARKETPLACE_COMBOS.filter((c) => c.isActive) : DEFAULT_MARKETPLACE_COMBOS;
}

export async function saveMarketplaceFeature(feature: Partial<MarketplaceFeature> & { name: string }): Promise<MarketplaceFeature> {
  await ensureSubscriptionTables();
  const db = getD1();
  const now = Math.floor(Date.now() / 1000);
  const id = feature.id || `feat_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
  const slug = feature.slug || feature.name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
  const key = slug.replace(/-/g, "_");
  const name = feature.name;
  const description = feature.description || "";
  const price = Number(feature.price) || 0;
  const originalPrice = Number(feature.originalPrice) || 0;
  const category = feature.category || "";
  const badge = feature.badge || "";
  const icon = feature.icon || "";
  const isActive = feature.isActive !== undefined ? (feature.isActive ? 1 : 0) : 1;

  // Update master `features` table
  await db
    .prepare(
      `INSERT INTO features (id, key, name, description, category, price, original_price, badge, icon, is_active, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
       ON CONFLICT(id) DO UPDATE SET
         key = excluded.key,
         name = excluded.name,
         description = excluded.description,
         category = excluded.category,
         price = excluded.price,
         original_price = excluded.original_price,
         badge = excluded.badge,
         icon = excluded.icon,
         is_active = excluded.is_active,
         updated_at = excluded.updated_at`
    )
    .bind(id, key, name, description, category, price, originalPrice, badge, icon, isActive, now, now)
    .run();

  // Update legacy `marketplace_features` table
  await db
    .prepare(
      `INSERT INTO marketplace_features (id, name, slug, description, price, original_price, category, badge, icon, is_active, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
       ON CONFLICT(id) DO UPDATE SET
         name = excluded.name,
         slug = excluded.slug,
         description = excluded.description,
         price = excluded.price,
         original_price = excluded.original_price,
         category = excluded.category,
         badge = excluded.badge,
         icon = excluded.icon,
         is_active = excluded.is_active,
         updated_at = excluded.updated_at`
    )
    .bind(id, name, slug, description, price, originalPrice, category, badge, icon, isActive, now, now)
    .run();

  return {
    id,
    name,
    slug,
    description,
    price,
    originalPrice,
    category,
    badge,
    icon,
    isActive: Boolean(isActive),
    createdAt: now,
    updatedAt: now,
  };
}

export async function saveMarketplaceCombo(combo: Partial<MarketplaceCombo> & { name: string }): Promise<MarketplaceCombo> {
  await ensureSubscriptionTables();
  const db = getD1();
  const now = Math.floor(Date.now() / 1000);
  const id = combo.id || `combo_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
  const slug = combo.slug || combo.name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
  const name = combo.name;
  const description = combo.description || "";
  const price = Number(combo.price) || 0;
  const originalPrice = Number(combo.originalPrice) || 0;
  const features = JSON.stringify(Array.isArray(combo.features) ? combo.features : []);
  const badge = combo.badge || "";
  const isActive = combo.isActive !== undefined ? (combo.isActive ? 1 : 0) : 1;

  // Update `combo_plans` table
  await db
    .prepare(
      `INSERT INTO combo_plans (id, name, slug, description, price, original_price, features, badge, is_active, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
       ON CONFLICT(id) DO UPDATE SET
         name = excluded.name,
         slug = excluded.slug,
         description = excluded.description,
         price = excluded.price,
         original_price = excluded.original_price,
         features = excluded.features,
         badge = excluded.badge,
         is_active = excluded.is_active,
         updated_at = excluded.updated_at`
    )
    .bind(id, name, slug, description, price, originalPrice, features, badge, isActive, now, now)
    .run();

  // Update legacy `marketplace_combos` table
  await db
    .prepare(
      `INSERT INTO marketplace_combos (id, name, slug, description, price, original_price, features, badge, is_active, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
       ON CONFLICT(id) DO UPDATE SET
         name = excluded.name,
         slug = excluded.slug,
         description = excluded.description,
         price = excluded.price,
         original_price = excluded.original_price,
         features = excluded.features,
         badge = excluded.badge,
         is_active = excluded.is_active,
         updated_at = excluded.updated_at`
    )
    .bind(id, name, slug, description, price, originalPrice, features, badge, isActive, now, now)
    .run();

  return {
    id,
    name,
    slug,
    description,
    price,
    originalPrice,
    features: Array.isArray(combo.features) ? combo.features : [],
    badge,
    isActive: Boolean(isActive),
    createdAt: now,
    updatedAt: now,
  };
}

export async function deleteMarketplaceFeature(id: string): Promise<boolean> {
  await ensureSubscriptionTables();
  const db = getD1();
  await db.prepare(`DELETE FROM features WHERE id = ? OR key = ?`).bind(id, id).run();
  const res = await db.prepare(`DELETE FROM marketplace_features WHERE id = ? OR slug = ?`).bind(id, id).run();
  return (res.meta?.changes ?? 0) > 0;
}

export async function deleteMarketplaceCombo(id: string): Promise<boolean> {
  await ensureSubscriptionTables();
  const db = getD1();
  await db.prepare(`DELETE FROM combo_plans WHERE id = ? OR slug = ?`).bind(id, id).run();
  const res = await db.prepare(`DELETE FROM marketplace_combos WHERE id = ? OR slug = ?`).bind(id, id).run();
  return (res.meta?.changes ?? 0) > 0;
}

// -------------------------------------------------------------
// D1 PLANS & PERMISSION MATRIX CRUD HELPERS
// -------------------------------------------------------------
export async function getDbPlans(activeOnly: boolean = false): Promise<DbPlan[]> {
  try {
    await ensureSubscriptionTables();
    const db = getD1();
    const query = activeOnly
      ? `SELECT id, role, name, price_monthly AS priceMonthly, price_yearly AS priceYearly, currency, description, features, badge, is_popular AS isPopular, is_recommended AS isRecommended, trial_days AS trialDays, is_active AS isActive, max_stores AS maxStores, max_daily_bookings AS maxDailyBookings, max_staff AS maxStaff, max_favorites AS maxFavorites, created_at AS createdAt, updated_at AS updatedAt FROM plans WHERE is_active = 1 ORDER BY price_monthly ASC`
      : `SELECT id, role, name, price_monthly AS priceMonthly, price_yearly AS priceYearly, currency, description, features, badge, is_popular AS isPopular, is_recommended AS isRecommended, trial_days AS trialDays, is_active AS isActive, max_stores AS maxStores, max_daily_bookings AS maxDailyBookings, max_staff AS maxStaff, max_favorites AS maxFavorites, created_at AS createdAt, updated_at AS updatedAt FROM plans ORDER BY price_monthly ASC`;

    const res = await db.prepare(query).all<Record<string, unknown>>();
    if (res.results && res.results.length > 0) {
      return res.results.map((r: Record<string, unknown>) => {
        let features: string[] = [];
        try {
          features = typeof r.features === "string" ? JSON.parse(r.features) : Array.isArray(r.features) ? (r.features as string[]) : [];
        } catch {
          features = [];
        }
        return {
          id: String(r.id),
          role: (r.role === "customer" ? "customer" : "store_owner") as "customer" | "store_owner",
          name: String(r.name),
          priceMonthly: Number(r.priceMonthly || 0),
          priceYearly: Number(r.priceYearly || 0),
          currency: String(r.currency || "INR"),
          description: String(r.description || ""),
          features,
          badge: String(r.badge || ""),
          isPopular: Boolean(r.isPopular),
          isRecommended: Boolean(r.isRecommended),
          trialDays: Number(r.trialDays || 0),
          isActive: Boolean(r.isActive),
          maxStores: Number(r.maxStores ?? 1),
          maxDailyBookings: Number(r.maxDailyBookings ?? 30),
          maxStaff: Number(r.maxStaff ?? 0),
          maxFavorites: Number(r.maxFavorites ?? 10),
          createdAt: Number(r.createdAt || 0),
          updatedAt: Number(r.updatedAt || 0),
        };
      });
    }
  } catch (err) {
    console.error("Error fetching db plans:", err);
  }
  return activeOnly ? DEFAULT_DB_PLANS.filter((p) => p.isActive) : DEFAULT_DB_PLANS;
}

export async function saveDbPlan(plan: Partial<DbPlan> & { name: string }): Promise<DbPlan> {
  await ensureSubscriptionTables();
  const db = getD1();
  const now = Math.floor(Date.now() / 1000);
  const id = plan.id || `plan_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
  const role = plan.role || "store_owner";
  const name = plan.name;
  const priceMonthly = Number(plan.priceMonthly) || 0;
  const priceYearly = Number(plan.priceYearly) || 0;
  const currency = plan.currency || "INR";
  const description = plan.description || "";
  const features = JSON.stringify(Array.isArray(plan.features) ? plan.features : []);
  const badge = plan.badge || "";
  const isPopular = plan.isPopular ? 1 : 0;
  const isRecommended = plan.isRecommended ? 1 : 0;
  const trialDays = Number(plan.trialDays) || 0;
  const isActive = plan.isActive !== undefined ? (plan.isActive ? 1 : 0) : 1;
  const maxStores = plan.maxStores !== undefined ? Number(plan.maxStores) : 1;
  const maxDailyBookings = plan.maxDailyBookings !== undefined ? Number(plan.maxDailyBookings) : 30;
  const maxStaff = plan.maxStaff !== undefined ? Number(plan.maxStaff) : 0;
  const maxFavorites = plan.maxFavorites !== undefined ? Number(plan.maxFavorites) : 10;

  await db
    .prepare(
      `INSERT INTO plans (id, role, name, price_monthly, price_yearly, currency, description, features, badge, is_popular, is_recommended, trial_days, is_active, max_stores, max_daily_bookings, max_staff, max_favorites, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
       ON CONFLICT(id) DO UPDATE SET
         role = excluded.role,
         name = excluded.name,
         price_monthly = excluded.price_monthly,
         price_yearly = excluded.price_yearly,
         currency = excluded.currency,
         description = excluded.description,
         features = excluded.features,
         badge = excluded.badge,
         is_popular = excluded.is_popular,
         is_recommended = excluded.is_recommended,
         trial_days = excluded.trial_days,
         is_active = excluded.is_active,
         max_stores = excluded.max_stores,
         max_daily_bookings = excluded.max_daily_bookings,
         max_staff = excluded.max_staff,
         max_favorites = excluded.max_favorites,
         updated_at = excluded.updated_at`
    )
    .bind(
      id,
      role,
      name,
      priceMonthly,
      priceYearly,
      currency,
      description,
      features,
      badge,
      isPopular,
      isRecommended,
      trialDays,
      isActive,
      maxStores,
      maxDailyBookings,
      maxStaff,
      maxFavorites,
      now,
      now
    )
    .run();

  try {
    await db
      .prepare(
        `INSERT INTO subscription_limits (id, plan_id, max_stores, max_daily_bookings, max_staff, max_favorites, allow_analytics, allow_promotions)
         VALUES (?, ?, ?, ?, ?, ?, 1, 1)
         ON CONFLICT(plan_id) DO UPDATE SET
           max_stores = excluded.max_stores,
           max_daily_bookings = excluded.max_daily_bookings,
           max_staff = excluded.max_staff,
           max_favorites = excluded.max_favorites`
      )
      .bind(`limit_${id}`, id, maxStores, maxDailyBookings, maxStaff, maxFavorites)
      .run();
  } catch {}

  return {
    id,
    role,
    name,
    priceMonthly,
    priceYearly,
    currency,
    description,
    features: Array.isArray(plan.features) ? plan.features : [],
    badge,
    isPopular: Boolean(isPopular),
    isRecommended: Boolean(isRecommended),
    trialDays,
    isActive: Boolean(isActive),
    maxStores,
    maxDailyBookings,
    maxStaff,
    maxFavorites,
    createdAt: now,
    updatedAt: now,
  };
}

export async function deleteDbPlan(planId: string): Promise<boolean> {
  await ensureSubscriptionTables();
  const db = getD1();
  await db.prepare(`DELETE FROM subscription_limits WHERE plan_id = ?`).bind(planId).run().catch(() => {});
  await db.prepare(`DELETE FROM subscription_features WHERE plan_id = ?`).bind(planId).run().catch(() => {});
  await db.prepare(`DELETE FROM plan_features WHERE plan_id = ?`).bind(planId).run().catch(() => {});
  const res = await db.prepare(`DELETE FROM plans WHERE id = ?`).bind(planId).run();
  return (res.meta?.changes ?? 0) > 0;
}

export async function getFeaturePlanPermissionMatrix(): Promise<Record<string, Record<string, boolean>>> {
  const matrix: Record<string, Record<string, boolean>> = {};
  try {
    await ensureSubscriptionTables();
    const db = getD1();

    // Query plan_features first
    const pfRes = await db
      .prepare(`SELECT plan_id AS planId, feature_key AS featureKey, is_enabled AS isEnabled FROM plan_features`)
      .all<{ planId: string; featureKey: string; isEnabled: number }>();

    if (pfRes.results && pfRes.results.length > 0) {
      for (const row of pfRes.results) {
        if (!matrix[row.planId]) matrix[row.planId] = {};
        matrix[row.planId][row.featureKey] = Boolean(row.isEnabled);
      }
    }

    // Query legacy subscription_features
    const sfRes = await db
      .prepare(`SELECT plan_id AS planId, feature_key AS featureKey, is_enabled AS isEnabled FROM subscription_features`)
      .all<{ planId: string; featureKey: string; isEnabled: number }>();

    if (sfRes.results && sfRes.results.length > 0) {
      for (const row of sfRes.results) {
        if (!matrix[row.planId]) matrix[row.planId] = {};
        if (matrix[row.planId][row.featureKey] === undefined) {
          matrix[row.planId][row.featureKey] = Boolean(row.isEnabled);
        }
      }
    }

    if (Object.keys(matrix).length > 0) {
      return matrix;
    }
  } catch (err) {
    console.error("Error fetching feature matrix:", err);
  }

  // Fallback matrix defaults
  return {
    free_customer: { live_queue: false, verified_badge: false, promotions: false, analytics: false },
    premium_customer: { live_queue: true, verified_badge: true, promotions: true, analytics: true },
    free_owner: { live_queue: false, verified_badge: false, promotions: false, analytics: false },
    starter: { live_queue: true, verified_badge: true, promotions: false, analytics: true },
    pro: { live_queue: true, verified_badge: true, promotions: true, analytics: true, top_search_ranking: true, membership_management: true },
    enterprise: { live_queue: true, verified_badge: true, promotions: true, analytics: true, top_search_ranking: true, membership_management: true, ai_assistant: true },
  };
}

export async function savePermissionCell(planId: string, featureKey: string, isEnabled: boolean): Promise<boolean> {
  await ensureSubscriptionTables();
  const db = getD1();
  const id = `perm_${planId}_${featureKey}`;
  const enabledVal = isEnabled ? 1 : 0;

  await db
    .prepare(
      `INSERT INTO plan_features (id, plan_id, feature_key, is_enabled)
       VALUES (?, ?, ?, ?)
       ON CONFLICT(id) DO UPDATE SET is_enabled = excluded.is_enabled`
    )
    .bind(id, planId, featureKey, enabledVal)
    .run()
    .catch(() => {});

  await db
    .prepare(
      `INSERT INTO subscription_features (id, plan_id, feature_key, is_enabled)
       VALUES (?, ?, ?, ?)
       ON CONFLICT(id) DO UPDATE SET is_enabled = excluded.is_enabled`
    )
    .bind(id, planId, featureKey, enabledVal)
    .run()
    .catch(() => {});

  return true;
}

export async function saveFullPermissionMatrix(matrix: Record<string, Record<string, boolean>>): Promise<boolean> {
  await ensureSubscriptionTables();
  for (const planId of Object.keys(matrix)) {
    for (const featureKey of Object.keys(matrix[planId])) {
      await savePermissionCell(planId, featureKey, matrix[planId][featureKey]);
    }
  }
  return true;
}

// -------------------------------------------------------------
// STRICT LIFETIME 1-TIME FREE TRIAL ENFORCEMENT
// -------------------------------------------------------------
export async function hasUserClaimedTrial(userId: string, email?: string): Promise<boolean> {
  if (!userId) return false;
  try {
    await ensureSubscriptionTables();
    const db = getD1();
    const cleanEmail = (email || "").trim().toLowerCase();

    // 1. Check permanent trial_history table
    const inTrialHistory = await db
      .prepare(
        `SELECT id FROM trial_history
         WHERE user_id = ? OR (email IS NOT NULL AND email != '' AND LOWER(email) = ?)`
      )
      .bind(userId, cleanEmail)
      .first();
    if (inTrialHistory) return true;

    // 2. Check active/past trial subscriptions or $0 non-free plans
    const inSubscriptions = await db
      .prepare(
        `SELECT id FROM subscriptions
         WHERE user_id = ?
           AND (status = 'trial' OR payment_method LIKE '%trial%' OR (amount = 0 AND plan_id NOT IN ('free', 'free_customer', 'free_owner')))`
      )
      .bind(userId)
      .first();
    if (inSubscriptions) return true;

    // 3. Check subscription messages for prior trial claims
    const inMessages = await db
      .prepare(
        `SELECT id FROM subscription_messages
         WHERE (user_id = ? OR (user_email IS NOT NULL AND user_email != '' AND LOWER(user_email) = ?))
           AND (amount_paid = 0 OR billing_cycle = 'trial' OR plan_id LIKE '%trial%')`
      )
      .bind(userId, cleanEmail)
      .first();
    if (inMessages) return true;

    return false;
  } catch {
    return false;
  }
}

export async function recordTrialClaim(userId: string, email: string, planId: string, durationDays: number = 30) {
  if (!userId) return;
  try {
    await ensureSubscriptionTables();
    const db = getD1();
    const now = Math.floor(Date.now() / 1000);
    const endedAt = now + durationDays * 86400;
    const trialId = `trial_${now}_${Math.random().toString(36).substring(2, 7)}`;
    const cleanEmail = (email || "").trim().toLowerCase();

    await db
      .prepare(
        `INSERT OR IGNORE INTO trial_history (id, user_id, email, plan_id, trial_started_at, trial_ended_at, created_at)
         VALUES (?, ?, ?, ?, ?, ?, ?)`
      )
      .bind(trialId, userId, cleanEmail, planId, now, endedAt, now)
      .run();
  } catch (e) {
    console.error("Failed to record trial claim:", e);
  }
}

