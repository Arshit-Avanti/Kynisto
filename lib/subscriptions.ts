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

// -------------------------------------------------------------
// MARKETPLACE FEATURES & COMBOS TYPES & SEED DATA
// -------------------------------------------------------------
export interface MarketplaceFeature {
  id: string;
  name: string;
  slug: string;
  description: string;
  price: number;
  originalPrice?: number;
  category?: string;
  badge?: string;
  icon?: string;
  isActive: boolean;
  createdAt?: number;
  updatedAt?: number;
}

export interface MarketplaceCombo {
  id: string;
  name: string;
  slug: string;
  description: string;
  price: number;
  originalPrice?: number;
  features: string[];
  badge?: string;
  isActive: boolean;
  createdAt?: number;
  updatedAt?: number;
}

export const DEFAULT_MARKETPLACE_FEATURES: MarketplaceFeature[] = [
  {
    id: "feat_live_queue_pro",
    name: "Live Queue Pro",
    slug: "live-queue-pro",
    description: "Real-time customer queue tracking, live position updates, and estimated wait times.",
    price: 299,
    originalPrice: 399,
    category: "Queue & Operations",
    badge: "HOT",
    icon: "Users",
    isActive: true,
  },
  {
    id: "feat_verified_badge",
    name: "Verified Badge",
    slug: "verified-badge",
    description: "Verified checkmark badge next to your store name to boost customer trust.",
    price: 49,
    originalPrice: 99,
    category: "Branding & Trust",
    badge: "TRUSTED",
    icon: "ShieldCheck",
    isActive: true,
  },
  {
    id: "feat_promotions",
    name: "Promotions",
    slug: "promotions",
    description: "Broadcast discounts, coupons, and push notifications to nearby customers.",
    price: 199,
    originalPrice: 299,
    category: "Marketing",
    badge: "GROWTH",
    icon: "Megaphone",
    isActive: true,
  },
  {
    id: "feat_analytics_pro",
    name: "Analytics Pro",
    slug: "analytics-pro",
    description: "Detailed customer footfall analytics, peak hours reports, and queue history graphs.",
    price: 149,
    originalPrice: 249,
    category: "Insights",
    badge: "INSIGHTS",
    icon: "BarChart3",
    isActive: true,
  },
  {
    id: "feat_top_search_ranking",
    name: "Top Search Ranking",
    slug: "top-search-ranking",
    description: "Priority listing on search results and homepage recommended stores.",
    price: 99,
    originalPrice: 199,
    category: "Visibility",
    badge: "BOOSTED",
    icon: "TrendingUp",
    isActive: true,
  },
  {
    id: "feat_membership_management",
    name: "Membership Management",
    slug: "membership-management",
    description: "Issue custom store memberships, customer loyalty passes, and recurring rewards.",
    price: 299,
    originalPrice: 499,
    category: "Customer Retention",
    badge: "RETENTION",
    icon: "CreditCard",
    isActive: true,
  },
  {
    id: "feat_future_features_pass",
    name: "Future Features Pass",
    slug: "future-features-pass",
    description: "All upcoming AI features, automated SMS alerts, and early access beta tools.",
    price: 499,
    originalPrice: 799,
    category: "VIP Pass",
    badge: "VIP ACCESS",
    icon: "Sparkles",
    isActive: true,
  },
];

export const DEFAULT_MARKETPLACE_COMBOS: MarketplaceCombo[] = [
  {
    id: "combo_starter_pack",
    name: "Starter Pack",
    slug: "starter-pack",
    description: "Essential setup for new stores combining Verified Badge & Live Queue Pro.",
    price: 329,
    originalPrice: 348,
    features: ["verified-badge", "live-queue-pro"],
    badge: "STARTER",
    isActive: true,
  },
  {
    id: "combo_growth_pack",
    name: "Growth Pack",
    slug: "growth-pack",
    description: "Accelerate store revenue with Live Queue Pro, Promotions, and Analytics Pro.",
    price: 499,
    originalPrice: 647,
    features: ["live-queue-pro", "promotions", "analytics-pro"],
    badge: "POPULAR",
    isActive: true,
  },
  {
    id: "combo_visibility_pack",
    name: "Visibility Pack",
    slug: "visibility-pack",
    description: "Maximize store discovery with Verified Badge, Top Search Ranking, and Promotions.",
    price: 299,
    originalPrice: 347,
    features: ["verified-badge", "top-search-ranking", "promotions"],
    badge: "BEST VALUE",
    isActive: true,
  },
  {
    id: "combo_smart_business_pack",
    name: "Smart Business Pack",
    slug: "smart-business-pack",
    description: "Comprehensive toolkit including Live Queue Pro, Analytics, Top Search, and Memberships.",
    price: 699,
    originalPrice: 945,
    features: ["live-queue-pro", "analytics-pro", "top-search-ranking", "membership-management"],
    badge: "RECOMMENDED",
    isActive: true,
  },
  {
    id: "combo_ultimate_business_pack",
    name: "Ultimate Business Pack",
    slug: "ultimate-business-pack",
    description: "Unlock everything! All 7 premium features bundled together at the maximum discount.",
    price: 999,
    originalPrice: 1593,
    features: [
      "live-queue-pro",
      "verified-badge",
      "promotions",
      "analytics-pro",
      "top-search-ranking",
      "membership-management",
      "future-features-pass",
    ],
    badge: "ALL-IN-ONE",
    isActive: true,
  },
];

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

export interface MarketplaceItem {
  id: string;
  itemType: "feature" | "plan" | "combo_pack";
  title: string;
  description: string;
  role: "customer" | "store_owner" | "both";
  priceMonthly: number;
  priceYearly: number;
  currency: string;
  badge?: string;
  badgeType?: "best_seller" | "best_value" | "popular" | "recommended" | "new" | "custom";
  status: "active" | "coming_soon" | "inactive";
  isActive: boolean;
  isComingSoon: boolean;
  features: string[];
  includedItemIds?: string[];
  metadata?: Record<string, unknown>;
  sortOrder: number;
  createdAt: number;
  updatedAt: number;
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

    // 10. Marketplace Features Table
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

    // 11. Marketplace Combos Table
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

    // Seed initial marketplace features if table is empty
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

    // Seed initial marketplace combos if table is empty
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
// D1 MARKETPLACE CRUD HELPERS
// -------------------------------------------------------------
export async function getMarketplaceFeatures(activeOnly: boolean = false): Promise<MarketplaceFeature[]> {
  try {
    await ensureSubscriptionTables();
    const db = getD1();
    const query = activeOnly
      ? `SELECT id, name, slug, description, price, original_price AS originalPrice, category, badge, icon, is_active AS isActive, created_at AS createdAt, updated_at AS updatedAt FROM marketplace_features WHERE is_active = 1 ORDER BY price ASC`
      : `SELECT id, name, slug, description, price, original_price AS originalPrice, category, badge, icon, is_active AS isActive, created_at AS createdAt, updated_at AS updatedAt FROM marketplace_features ORDER BY price ASC`;
    const res = await db.prepare(query).all<any>();
    if (res.results && res.results.length > 0) {
      return res.results.map((r: any) => ({
        ...r,
        isActive: Boolean(r.isActive),
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
    const query = activeOnly
      ? `SELECT id, name, slug, description, price, original_price AS originalPrice, features, badge, is_active AS isActive, created_at AS createdAt, updated_at AS updatedAt FROM marketplace_combos WHERE is_active = 1 ORDER BY price ASC`
      : `SELECT id, name, slug, description, price, original_price AS originalPrice, features, badge, is_active AS isActive, created_at AS createdAt, updated_at AS updatedAt FROM marketplace_combos ORDER BY price ASC`;
    const res = await db.prepare(query).all<any>();
    if (res.results && res.results.length > 0) {
      return res.results.map((r: any) => {
        let features: string[] = [];
        try {
          features = typeof r.features === "string" ? JSON.parse(r.features) : r.features || [];
        } catch {
          features = [];
        }
        return {
          ...r,
          isActive: Boolean(r.isActive),
          features,
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
  const name = feature.name;
  const description = feature.description || "";
  const price = Number(feature.price) || 0;
  const originalPrice = Number(feature.originalPrice) || 0;
  const category = feature.category || "";
  const badge = feature.badge || "";
  const icon = feature.icon || "";
  const isActive = feature.isActive !== undefined ? (feature.isActive ? 1 : 0) : 1;

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
  const res = await db.prepare(`DELETE FROM marketplace_features WHERE id = ? OR slug = ?`).bind(id, id).run();
  return (res.meta?.changes ?? 0) > 0;
}

export async function deleteMarketplaceCombo(id: string): Promise<boolean> {
  await ensureSubscriptionTables();
  const db = getD1();
  const res = await db.prepare(`DELETE FROM marketplace_combos WHERE id = ? OR slug = ?`).bind(id, id).run();
  return (res.meta?.changes ?? 0) > 0;
}



