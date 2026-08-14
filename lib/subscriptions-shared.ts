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
// DYNAMIC FEATURES & COMBOS TYPES
// -------------------------------------------------------------
export interface DynamicFeature {
  id: string;
  key: string;
  name: string;
  description: string;
  category: string;
  price: number;
  originalPrice?: number;
  badge?: string;
  icon?: string;
  isActive: boolean;
  createdAt?: number;
  updatedAt?: number;
}

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
// SEED DATA FOR DYNAMIC FEATURES & COMBOS
// -------------------------------------------------------------
export const DYNAMIC_FEATURES: DynamicFeature[] = [
  {
    id: "feat_live_queue",
    key: "live_queue",
    name: "Live Queue Pro",
    description: "Real-time customer queue tracking, live position updates, and estimated wait times.",
    category: "Queue Operations",
    price: 299,
    originalPrice: 399,
    badge: "HOT",
    icon: "Users",
    isActive: true,
  },
  {
    id: "feat_analytics",
    key: "analytics",
    name: "Analytics & Insights Pro",
    description: "Detailed customer footfall analytics, peak hours reports, and queue history graphs.",
    category: "Insights",
    price: 149,
    originalPrice: 249,
    badge: "INSIGHTS",
    icon: "BarChart3",
    isActive: true,
  },
  {
    id: "feat_whatsapp",
    key: "whatsapp",
    name: "WhatsApp Alerts",
    description: "Automated WhatsApp and SMS alerts for queue status and customer updates.",
    category: "Communication",
    price: 199,
    originalPrice: 299,
    badge: "POPULAR",
    icon: "MessageSquare",
    isActive: true,
  },
  {
    id: "feat_staff_management",
    key: "staff_management",
    name: "Staff Management",
    description: "Add multi-user staff accounts with role-based access control and permissions.",
    category: "Team Operations",
    price: 249,
    originalPrice: 349,
    badge: "SCALE",
    icon: "UserPlus",
    isActive: true,
  },
  {
    id: "feat_membership_management",
    key: "membership_management",
    name: "Membership & Loyalty Pass",
    description: "Issue custom store memberships, customer loyalty passes, and recurring rewards.",
    category: "Retention",
    price: 299,
    originalPrice: 499,
    badge: "RETENTION",
    icon: "CreditCard",
    isActive: true,
  },
  {
    id: "feat_qr_queue",
    key: "qr_queue",
    name: "QR Scan Queue",
    description: "Contactless QR code display for instant customer self-registration into queues.",
    category: "Queue Operations",
    price: 99,
    originalPrice: 199,
    badge: "ESSENTIAL",
    icon: "QrCode",
    isActive: true,
  },
  {
    id: "feat_custom_branding",
    key: "custom_branding",
    name: "Custom Store Branding",
    description: "White-label store storefront with custom colors, banner, and verified trust badge.",
    category: "Branding",
    price: 149,
    originalPrice: 249,
    badge: "BRANDING",
    icon: "Sparkles",
    isActive: true,
  },
  {
    id: "feat_ai_assistant",
    key: "ai_assistant",
    name: "AI Assistant & Automation",
    description: "Automated AI wait-time prediction, smart queue scheduling, and customer insights.",
    category: "AI & Automation",
    price: 499,
    originalPrice: 799,
    badge: "VIP AI",
    icon: "Bot",
    isActive: true,
  },
  {
    id: "feat_inventory_management",
    key: "inventory_management",
    name: "Inventory & Service Catalog",
    description: "Manage product stock levels, service offerings, and real-time inventory tracking.",
    category: "Catalog",
    price: 199,
    originalPrice: 299,
    badge: "MANAGEMENT",
    icon: "Package",
    isActive: true,
  },
  {
    id: "feat_verified_badge",
    key: "verified_badge",
    name: "Verified Trust Badge",
    description: "Official checkmark badge next to your store name to boost customer trust.",
    category: "Trust",
    price: 49,
    originalPrice: 99,
    badge: "TRUSTED",
    icon: "ShieldCheck",
    isActive: true,
  },
  {
    id: "feat_promotions",
    key: "promotions",
    name: "Promotions & Deals",
    description: "Broadcast discounts, coupons, and push announcements to nearby customers.",
    category: "Marketing",
    price: 199,
    originalPrice: 299,
    badge: "GROWTH",
    icon: "Megaphone",
    isActive: true,
  },
  {
    id: "feat_top_search_ranking",
    key: "top_search_ranking",
    name: "Top Search Ranking",
    description: "Priority listing on search results and homepage recommended store section.",
    category: "Visibility",
    price: 99,
    originalPrice: 199,
    badge: "BOOSTED",
    icon: "TrendingUp",
    isActive: true,
  },
  {
    id: "feat_reports_export",
    key: "reports_export",
    name: "Business Reports Export",
    description: "Export daily and monthly revenue, customer traffic, and booking CSV/PDF reports.",
    category: "Insights",
    price: 99,
    originalPrice: 149,
    badge: "REPORTS",
    icon: "FileSpreadsheet",
    isActive: true,
  },
  {
    id: "feat_coupons",
    key: "coupons",
    name: "Coupons & Discounts",
    description: "Create store coupons and special discount vouchers for regular queue users.",
    category: "Marketing",
    price: 149,
    originalPrice: 249,
    badge: "DISCOUNTS",
    icon: "Ticket",
    isActive: true,
  },
];

export const DEFAULT_MARKETPLACE_FEATURES: MarketplaceFeature[] = DYNAMIC_FEATURES.map((f) => ({
  id: f.id,
  name: f.name,
  slug: f.key.replace(/_/g, "-"),
  description: f.description,
  price: f.price,
  originalPrice: f.originalPrice,
  category: f.category,
  badge: f.badge,
  icon: f.icon,
  isActive: f.isActive,
}));

export const DEFAULT_MARKETPLACE_COMBOS: MarketplaceCombo[] = [
  {
    id: "combo_starter_pack",
    name: "Starter Pack",
    slug: "starter-pack",
    description: "Essential setup for new stores combining Verified Badge & Live Queue Pro.",
    price: 329,
    originalPrice: 348,
    features: ["verified_badge", "live_queue"],
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
    features: ["live_queue", "promotions", "analytics"],
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
    features: ["verified_badge", "top_search_ranking", "promotions"],
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
    features: ["live_queue", "analytics", "top_search_ranking", "membership_management"],
    badge: "RECOMMENDED",
    isActive: true,
  },
  {
    id: "combo_ultimate_business_pack",
    name: "Ultimate Business Pack",
    slug: "ultimate-business-pack",
    description: "Unlock everything! All dynamic features bundled together at the maximum discount.",
    price: 999,
    originalPrice: 1593,
    features: DYNAMIC_FEATURES.map((f) => f.key),
    badge: "ALL-IN-ONE",
    isActive: true,
  },
];

// -------------------------------------------------------------
// CUSTOMER SUBSCRIPTION PLANS CONFIG
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
// BUSINESS OWNER SUBSCRIPTION PLANS CONFIG
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

export interface DbPlan {
  id: string;
  role: "customer" | "store_owner";
  name: string;
  priceMonthly: number;
  priceYearly: number;
  currency: string;
  description: string;
  features: string[];
  badge?: string;
  isPopular?: boolean;
  isRecommended?: boolean;
  trialDays?: number;
  isActive?: boolean;
  maxStores?: number;
  maxDailyBookings?: number;
  maxStaff?: number;
  maxFavorites?: number;
  createdAt?: number;
  updatedAt?: number;
}

export const DEFAULT_DB_PLANS: DbPlan[] = [
  {
    id: "free_customer",
    role: "customer",
    name: "FREE",
    priceMonthly: 0,
    priceYearly: 0,
    currency: "INR",
    description: "Essential local discovery and queue tracking for everyone.",
    features: [
      "Join unlimited queues",
      "Save favorite businesses",
      "Booking history",
      "Basic notifications",
      "Business ratings & reviews",
    ],
    maxFavorites: 10,
    trialDays: 0,
    isActive: true,
  },
  {
    id: "premium_customer",
    role: "customer",
    name: "PREMIUM VIP",
    priceMonthly: 49,
    priceYearly: 499,
    currency: "INR",
    description: "Ad-free VIP experience with priority queue access and exclusive perks.",
    features: [
      "Everything in Free plus:",
      "Ad-free experience",
      "Premium Badge on Profile",
      "Priority Queue Access",
      "Unlimited Saved Businesses",
      "Exclusive Offers & Deals",
    ],
    badge: "MOST POPULAR",
    isPopular: true,
    trialDays: 7,
    maxFavorites: 9999,
    isActive: true,
  },
  {
    id: "free_owner",
    role: "store_owner",
    name: "FREE STORE",
    priceMonthly: 0,
    priceYearly: 0,
    currency: "INR",
    description: "Basic digital storefront visibility for new local businesses.",
    features: [
      "1 Store",
      "30 Bookings per Day",
      "Basic Dashboard",
      "Community Support",
    ],
    maxStores: 1,
    maxDailyBookings: 30,
    maxStaff: 0,
    trialDays: 0,
    isActive: true,
  },
  {
    id: "starter",
    role: "store_owner",
    name: "STARTER",
    priceMonthly: 299,
    priceYearly: 2999,
    currency: "INR",
    description: "Complete queue management & business dashboard for growing stores.",
    features: [
      "1 Store",
      "Unlimited Daily Bookings",
      "No Ads",
      "Queue Management",
      "Business Reports",
      "Custom Branding",
    ],
    badge: "POPULAR",
    isPopular: true,
    trialDays: 14,
    maxStores: 1,
    maxDailyBookings: 9999,
    maxStaff: 0,
    isActive: true,
  },
  {
    id: "pro",
    role: "store_owner",
    name: "PRO",
    priceMonthly: 499,
    priceYearly: 4999,
    currency: "INR",
    description: "Multi-store management, staff accounts, advanced analytics & AI.",
    features: [
      "Up to 5 Stores",
      "Staff Management (up to 5 staff)",
      "Advanced Analytics & Insights",
      "Promotions & Broadcasts",
      "Priority Support 24/7",
    ],
    badge: "RECOMMENDED",
    isRecommended: true,
    trialDays: 14,
    maxStores: 5,
    maxDailyBookings: 9999,
    maxStaff: 5,
    isActive: true,
  },
  {
    id: "enterprise",
    role: "store_owner",
    name: "ENTERPRISE",
    priceMonthly: 1499,
    priceYearly: 14999,
    currency: "INR",
    description: "Unlimited stores, staff, dedicated support, and custom integrations.",
    features: [
      "Unlimited Stores",
      "Unlimited Staff",
      "Dedicated Manager",
      "Custom API Integrations",
      "White Label Options",
    ],
    badge: "CUSTOM SCALE",
    trialDays: 30,
    maxStores: 9999,
    maxDailyBookings: 9999,
    maxStaff: 9999,
    isActive: true,
  },
];

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
      case "live_queue":
      case "queue":
        name = "Queue Management Pro";
        plans = [SHOP_OWNER_PLANS.starter, SHOP_OWNER_PLANS.pro, SHOP_OWNER_PLANS.enterprise];
        break;
      case "qr_queue":
        name = "QR Scan Queue";
        plans = [SHOP_OWNER_PLANS.starter, SHOP_OWNER_PLANS.pro, SHOP_OWNER_PLANS.enterprise];
        break;
      case "custom_branding":
        name = "Custom Store Branding";
        plans = [SHOP_OWNER_PLANS.starter, SHOP_OWNER_PLANS.pro, SHOP_OWNER_PLANS.enterprise];
        break;
      case "reports_export":
        name = "Business Reports Export";
        plans = [SHOP_OWNER_PLANS.starter, SHOP_OWNER_PLANS.pro, SHOP_OWNER_PLANS.enterprise];
        break;
      case "whatsapp":
        name = "WhatsApp Alerts";
        plans = [SHOP_OWNER_PLANS.pro, SHOP_OWNER_PLANS.enterprise];
        break;
      case "staff_management":
        name = "Staff Management";
        plans = [SHOP_OWNER_PLANS.pro, SHOP_OWNER_PLANS.enterprise];
        break;
      case "coupons":
        name = "Coupons & Discounts";
        plans = [SHOP_OWNER_PLANS.pro, SHOP_OWNER_PLANS.enterprise];
        break;
      case "promotions":
        name = "Promotions Broadcast";
        plans = [SHOP_OWNER_PLANS.pro, SHOP_OWNER_PLANS.enterprise];
        break;
      case "verified_badge":
        name = "Verified Store Badge";
        plans = [SHOP_OWNER_PLANS.pro, SHOP_OWNER_PLANS.enterprise];
        break;
      case "top_search_ranking":
        name = "Top Search Ranking";
        plans = [SHOP_OWNER_PLANS.pro, SHOP_OWNER_PLANS.enterprise];
        break;
      case "membership_management":
        name = "Membership & Loyalty Pass";
        plans = [SHOP_OWNER_PLANS.pro, SHOP_OWNER_PLANS.enterprise];
        break;
      case "ai_assistant":
        name = "AI Assistant & Automation";
        plans = [SHOP_OWNER_PLANS.enterprise];
        break;
      default:
        name = featureKey.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
        plans = [SHOP_OWNER_PLANS.starter, SHOP_OWNER_PLANS.pro, SHOP_OWNER_PLANS.enterprise];
    }
  }

  return { featureKey: norm, featureName: name, availablePlans: plans };
}
