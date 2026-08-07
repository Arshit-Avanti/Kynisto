import { getD1 } from "@/db/runtime";

export type BillingCycle = "monthly" | "yearly";
export type SubscriptionStatus = "active" | "inactive" | "trial" | "expired" | "cancelled" | "suspended" | "pending";
export type PaymentStatus = "completed" | "pending" | "failed" | "refunded";

export interface PlanFeature {
  id: string;
  name: string;
  included: boolean;
  tooltip?: string;
}

export interface PlanConfig {
  id: string;
  role: "customer" | "store_owner";
  name: string;
  badge?: string;
  isPopular?: boolean;
  priceMonthly: number;
  priceYearly: number; // Yearly savings applied
  currency: string;
  description: string;
  features: string[];
  restrictions?: string[];
  maxFavorites?: number; // for customer
  maxStores?: number; // for owner
  maxDailyBookings?: number; // for owner
  maxStaff?: number; // for owner
  allowQueueManagement?: boolean;
  allowAppointmentBooking?: boolean;
  allowQrQueue?: boolean;
  allowVipQueue?: boolean;
  allowAnalytics?: boolean;
  allowCustomBranding?: boolean;
  allowWhatsappAlerts?: boolean;
  allowReportsExport?: boolean;
  allowCoupons?: boolean;
  allowStaffAccounts?: boolean;
  allowPromotions?: boolean;
}

export const UPI_PAYMENT_ID = "9315678560@fam";
export const UPI_PAYEE_NAME = "Kynisto";
export const PAYMENT_QR_IMAGE = "/payment-qr.jpg";

// -------------------------------------------------------------
// CUSTOMER SUBSCRIPTION PLANS
// -------------------------------------------------------------
export const CUSTOMER_PLANS: Record<string, PlanConfig> = {
  free: {
    id: "free",
    role: "customer",
    name: "FREE",
    priceMonthly: 0,
    priceYearly: 0,
    currency: "INR",
    description: "Essential local discovery and queue tracking for everyone.",
    maxFavorites: 10,
    allowQueueManagement: false,
    allowAppointmentBooking: false,
    allowVipQueue: false,
    features: [
      "Join unlimited queues",
      "Save favorite businesses",
      "Booking history",
      "Basic notifications",
      "Business ratings & reviews",
      "Ads enabled",
    ],
    restrictions: [
      "Contains Ads",
      "Limit 10 Saved Businesses",
      "Standard Customer Support",
    ],
  },
  premium: {
    id: "premium",
    role: "customer",
    name: "PREMIUM",
    isPopular: true,
    badge: "MOST POPULAR",
    priceMonthly: 49,
    priceYearly: 499, // Save ₹89
    currency: "INR",
    description: "Ad-free VIP experience with priority queue access and exclusive perks.",
    maxFavorites: Infinity,
    allowAppointmentBooking: true,
    allowVipQueue: true,
    features: [
      "Everything in Free plus:",
      "Ad-free experience",
      "Premium Badge on Profile",
      "Priority Queue Access",
      "Early Access to New Features",
      "Premium Customer Support",
      "Unlimited Saved Businesses",
      "Enhanced Booking History",
      "Exclusive Offers & Deals",
      "Loyalty Rewards",
    ],
  },
};

// -------------------------------------------------------------
// BUSINESS OWNER SUBSCRIPTION PLANS
// -------------------------------------------------------------
export const SHOP_OWNER_PLANS: Record<string, PlanConfig> = {
  free: {
    id: "free",
    role: "store_owner",
    name: "FREE",
    priceMonthly: 0,
    priceYearly: 0,
    currency: "INR",
    description: "Basic digital storefront visibility for new local businesses.",
    maxStores: 1,
    maxDailyBookings: 30,
    maxStaff: 0,
    allowQueueManagement: false,
    allowAnalytics: false,
    features: [
      "1 Store",
      "30 Bookings per Day",
      "Ads Enabled",
      "Basic Dashboard",
      "Basic Analytics",
      "Community Support",
    ],
    restrictions: [
      "Limited to 30 Bookings/Day",
      "No Staff Accounts",
      "Ads Displayed",
    ],
  },
  starter: {
    id: "starter",
    role: "store_owner",
    name: "STARTER",
    isPopular: true,
    badge: "RECOMMENDED",
    priceMonthly: 299,
    priceYearly: 2999, // Save ₹589
    currency: "INR",
    description: "Complete queue management & business dashboard for growing stores.",
    maxStores: 1,
    maxDailyBookings: Infinity,
    maxStaff: 0,
    allowQueueManagement: true,
    allowQrQueue: true,
    allowAnalytics: true,
    allowCustomBranding: true,
    allowReportsExport: true,
    features: [
      "Everything in Free plus:",
      "1 Store",
      "Unlimited Daily Bookings",
      "No Ads",
      "Queue Management",
      "Business Reports",
      "Business Dashboard",
      "Customer Notifications",
      "Basic Analytics",
      "Business Profile Customization",
    ],
  },
  pro: {
    id: "pro",
    role: "store_owner",
    name: "PRO",
    badge: "ADVANCED SCALE",
    priceMonthly: 499,
    priceYearly: 4999, // Save ₹989
    currency: "INR",
    description: "Multi-store management, staff accounts, advanced analytics & AI.",
    maxStores: 5,
    maxDailyBookings: Infinity,
    maxStaff: 5,
    allowQueueManagement: true,
    allowQrQueue: true,
    allowAppointmentBooking: true,
    allowAnalytics: true,
    allowCustomBranding: true,
    allowWhatsappAlerts: true,
    allowReportsExport: true,
    allowCoupons: true,
    allowStaffAccounts: true,
    allowPromotions: true,
    features: [
      "Everything in Starter plus:",
      "Up to 5 Stores",
      "Staff Management (up to 5 staff)",
      "Advanced Analytics & Insights",
      "Promotions & Special Broadcasts",
      "Priority Support 24/7",
      "Premium Dashboard",
      "Early Access Features",
      "Future AI Features",
    ],
  },
  enterprise: {
    id: "enterprise",
    role: "store_owner",
    name: "ENTERPRISE",
    badge: "CUSTOM SCALE",
    priceMonthly: 0, // Custom Pricing
    priceYearly: 0,
    currency: "INR",
    description: "Unlimited stores, staff, dedicated support, and custom integrations.",
    maxStores: Infinity,
    maxDailyBookings: Infinity,
    maxStaff: Infinity,
    allowQueueManagement: true,
    allowQrQueue: true,
    allowAppointmentBooking: true,
    allowAnalytics: true,
    allowCustomBranding: true,
    allowWhatsappAlerts: true,
    allowReportsExport: true,
    allowCoupons: true,
    allowStaffAccounts: true,
    allowPromotions: true,
    features: [
      "Unlimited Stores",
      "Unlimited Staff",
      "Dedicated Support Manager",
      "Custom API & POS Integrations",
      "Advanced Business Tools",
      "White Label Options (Future)",
    ],
  },
};

// All plans map
export const ALL_PLANS: Record<string, PlanConfig> = {
  ...CUSTOMER_PLANS,
  ...SHOP_OWNER_PLANS,
};

// -------------------------------------------------------------
// D1 TABLE AUTO-INITIALIZATION FOR ALL 8 SUBSCRIPTION TABLES
// -------------------------------------------------------------
export async function ensureSubscriptionTables() {
  try {
    const db = getD1();

    // 1. Master Plans Table
    await db.prepare(`
      CREATE TABLE IF NOT EXISTS plans (
        id TEXT PRIMARY KEY,
        role TEXT NOT NULL,
        name TEXT NOT NULL,
        price_monthly REAL NOT NULL DEFAULT 0,
        price_yearly REAL NOT NULL DEFAULT 0,
        currency TEXT NOT NULL DEFAULT 'INR',
        description TEXT,
        features TEXT,
        created_at INTEGER NOT NULL DEFAULT (unixepoch())
      )
    `).run();

    // 2. Customer Subscriptions Table
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

    // 3. Owner Subscriptions Table
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

    // 4. Subscription History Log
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

    // 5. Subscription Features Matrix
    await db.prepare(`
      CREATE TABLE IF NOT EXISTS subscription_features (
        id TEXT PRIMARY KEY,
        plan_id TEXT NOT NULL,
        feature_key TEXT NOT NULL,
        is_enabled INTEGER NOT NULL DEFAULT 1,
        created_at INTEGER NOT NULL DEFAULT (unixepoch())
      )
    `).run();

    // 6. Subscription Daily Usage Metrics
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

    // 7. Subscription Limits Constraints
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

    // 8. Trial History Table
    await db.prepare(`
      CREATE TABLE IF NOT EXISTS trial_history (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL UNIQUE,
        plan_id TEXT NOT NULL,
        trial_started_at INTEGER NOT NULL,
        trial_ended_at INTEGER NOT NULL,
        created_at INTEGER NOT NULL DEFAULT (unixepoch())
      )
    `).run();

    // 9. Subscription Messages from Users (Pending Payments)
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

    // Legacy tables for compatibility
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


