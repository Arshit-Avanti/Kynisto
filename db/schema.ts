import { relations, sql } from "drizzle-orm";
import {
  index,
  integer,
  real,
  sqliteTable,
  text,
  uniqueIndex,
  type AnySQLiteColumn,
} from "drizzle-orm/sqlite-core";

const timestamps = {
  createdAt: integer("created_at").notNull().default(sql`(unixepoch())`),
  updatedAt: integer("updated_at").notNull().default(sql`(unixepoch())`),
};

export const users = sqliteTable(
  "users",
  {
    id: text("id").primaryKey(),
    name: text("name").notNull(),
    email: text("email").notNull(),
    passwordHash: text("password_hash").notNull(),
    passwordSalt: text("password_salt").notNull(),
    passwordIterations: integer("password_iterations").notNull().default(210000),
    role: text("role", { enum: ["admin", "store_owner", "customer"] })
      .notNull()
      .default("customer"),
    status: text("status", { enum: ["active", "suspended", "disabled", "banned"] })
      .notNull()
      .default("active"),
    avatarUrl: text("avatar_url"),
    phone: text("phone"),
    lastLoginAt: integer("last_login_at"),
    ...timestamps,
  },
  (table) => [
    uniqueIndex("users_email_unique").on(table.email),
    index("users_role_status_idx").on(table.role, table.status),
    index("users_created_at_idx").on(table.createdAt),
  ],
);

export const userSecurity = sqliteTable(
  "user_security",
  {
    userId: text("user_id")
      .primaryKey()
      .references(() => users.id, { onDelete: "cascade" }),
    mustChangePassword: integer("must_change_password", { mode: "boolean" })
      .notNull()
      .default(false),
    isSuperAdmin: integer("is_super_admin", { mode: "boolean" }).notNull().default(false),
    failedLoginCount: integer("failed_login_count").notNull().default(0),
    lastFailedLoginAt: integer("last_failed_login_at"),
    lockedUntil: integer("locked_until"),
    passwordChangedAt: integer("password_changed_at"),
    updatedAt: integer("updated_at").notNull().default(sql`(unixepoch())`),
  },
  (table) => [index("user_security_locked_idx").on(table.lockedUntil)],
);

export const externalAuthIdentities = sqliteTable(
  "external_auth_identities",
  {
    id: text("id").primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    provider: text("provider", { enum: ["supabase", "google"] }).notNull(),
    providerUserId: text("provider_user_id").notNull(),
    email: text("email").notNull(),
    emailVerifiedAt: integer("email_verified_at"),
    ...timestamps,
  },
  (table) => [
    uniqueIndex("external_auth_provider_user_unique").on(
      table.provider,
      table.providerUserId,
    ),
    uniqueIndex("external_auth_user_provider_unique").on(table.userId, table.provider),
    index("external_auth_email_idx").on(table.email),
  ],
);

export const oauthOnboarding = sqliteTable(
  "oauth_onboarding",
  {
    id: text("id").primaryKey(),
    tokenHash: text("token_hash").notNull(),
    providerUserId: text("provider_user_id").notNull(),
    email: text("email").notNull(),
    name: text("name").notNull(),
    avatarUrl: text("avatar_url"),
    expiresAt: integer("expires_at").notNull(),
    createdAt: integer("created_at").notNull().default(sql`(unixepoch())`),
    updatedAt: integer("updated_at").notNull().default(sql`(unixepoch())`),
  },
  (table) => [
    uniqueIndex("oauth_onboarding_token_unique").on(table.tokenHash),
    uniqueIndex("oauth_onboarding_provider_user_unique").on(table.providerUserId),
    uniqueIndex("oauth_onboarding_email_unique").on(table.email),
    index("oauth_onboarding_expiry_idx").on(table.expiresAt),
  ],
);

export const addresses = sqliteTable(
  "addresses",
  {
    id: text("id").primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    label: text("label").notNull().default("Home"),
    recipientName: text("recipient_name").notNull(),
    phone: text("phone").notNull(),
    line1: text("line1").notNull(),
    line2: text("line2"),
    area: text("area").notNull(),
    city: text("city").notNull(),
    state: text("state").notNull(),
    country: text("country").notNull().default("India"),
    postalCode: text("postal_code").notNull(),
    latitude: real("latitude"),
    longitude: real("longitude"),
    isDefault: integer("is_default", { mode: "boolean" }).notNull().default(false),
    ...timestamps,
  },
  (table) => [
    index("addresses_user_idx").on(table.userId, table.isDefault),
    index("addresses_postal_idx").on(table.postalCode),
  ],
);

export const userPreferences = sqliteTable("user_preferences", {
  userId: text("user_id")
    .primaryKey()
    .references(() => users.id, { onDelete: "cascade" }),
  emailNotifications: integer("email_notifications", { mode: "boolean" })
    .notNull()
    .default(true),
  orderNotifications: integer("order_notifications", { mode: "boolean" })
    .notNull()
    .default(true),
  marketingNotifications: integer("marketing_notifications", { mode: "boolean" })
    .notNull()
    .default(false),
  updatedAt: integer("updated_at").notNull().default(sql`(unixepoch())`),
});

export const sessions = sqliteTable(
  "sessions",
  {
    id: text("id").primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    tokenHash: text("token_hash").notNull(),
    csrfTokenHash: text("csrf_token_hash").notNull(),
    rememberMe: integer("remember_me", { mode: "boolean" }).notNull().default(false),
    expiresAt: integer("expires_at").notNull(),
    lastSeenAt: integer("last_seen_at").notNull().default(sql`(unixepoch())`),
    userAgentHash: text("user_agent_hash"),
    ipHash: text("ip_hash"),
    createdAt: integer("created_at").notNull().default(sql`(unixepoch())`),
  },
  (table) => [
    uniqueIndex("sessions_token_hash_unique").on(table.tokenHash),
    index("sessions_user_idx").on(table.userId),
    index("sessions_expiry_idx").on(table.expiresAt),
  ],
);

export const categories = sqliteTable(
  "categories",
  {
    id: text("id").primaryKey(),
    parentId: text("parent_id").references((): AnySQLiteColumn => categories.id, {
      onDelete: "set null",
    }),
    name: text("name").notNull(),
    slug: text("slug").notNull(),
    description: text("description"),
    icon: text("icon"),
    color: text("color"),
    module: text("module", { enum: ["local", "healthcare"] })
      .notNull()
      .default("local"),
    sortOrder: integer("sort_order").notNull().default(0),
    status: text("status", { enum: ["active", "hidden"] }).notNull().default("active"),
    ...timestamps,
  },
  (table) => [
    uniqueIndex("categories_slug_unique").on(table.slug),
    index("categories_module_status_idx").on(table.module, table.status),
    index("categories_parent_status_idx").on(table.parentId, table.status),
  ],
);

export const stores = sqliteTable(
  "stores",
  {
    id: text("id").primaryKey(),
    ownerId: text("owner_id").references(() => users.id, { onDelete: "set null" }),
    categoryId: text("category_id")
      .notNull()
      .references(() => categories.id, { onDelete: "restrict" }),
    subcategoryId: text("subcategory_id").references(() => categories.id, {
      onDelete: "set null",
    }),
    name: text("name").notNull(),
    slug: text("slug").notNull(),
    description: text("description").notNull().default(""),
    businessType: text("business_type").notNull().default("Local business"),
    address: text("address").notNull(),
    area: text("area").notNull(),
    city: text("city").notNull(),
    state: text("state").notNull(),
    country: text("country").notNull().default("India"),
    postalCode: text("postal_code").notNull(),
    latitude: real("latitude").notNull(),
    longitude: real("longitude").notNull(),
    googleMapsUrl: text("google_maps_url"),
    phone: text("phone"),
    whatsapp: text("whatsapp"),
    email: text("email"),
    website: text("website"),
    businessHours: text("business_hours", { mode: "json" })
      .$type<Record<string, { open: string; close: string }>>()
      .notNull(),
    openingDays: text("opening_days", { mode: "json" }).$type<number[]>().notNull(),
    logoKey: text("logo_key"),
    logoUrl: text("logo_url"),
    bannerKey: text("banner_key"),
    bannerUrl: text("banner_url"),
    ratingAverage: real("rating_average").notNull().default(0),
    ratingCount: integer("rating_count").notNull().default(0),
    status: text("status", {
      enum: ["pending", "approved", "rejected", "suspended"],
    })
      .notNull()
      .default("pending"),
    rejectionReason: text("rejection_reason"),
    approvedAt: integer("approved_at"),
    approvedBy: text("approved_by").references(() => users.id, { onDelete: "set null" }),
    viewCount: integer("view_count").notNull().default(0),
    ...timestamps,
  },
  (table) => [
    uniqueIndex("stores_slug_unique").on(table.slug),
    index("stores_owner_idx").on(table.ownerId),
    index("stores_category_status_idx").on(table.categoryId, table.status),
    index("stores_location_idx").on(table.city, table.area, table.postalCode),
    index("stores_rating_idx").on(table.ratingAverage),
    index("stores_created_idx").on(table.createdAt),
  ],
);

export const storeSettings = sqliteTable("store_settings", {
  storeId: text("store_id")
    .primaryKey()
    .references(() => stores.id, { onDelete: "cascade" }),
  acceptingOrders: integer("accepting_orders", { mode: "boolean" }).notNull().default(true),
  pickupEnabled: integer("pickup_enabled", { mode: "boolean" }).notNull().default(true),
  deliveryEnabled: integer("delivery_enabled", { mode: "boolean" }).notNull().default(true),
  minimumOrder: real("minimum_order").notNull().default(0),
  deliveryFee: real("delivery_fee").notNull().default(0),
  deliveryRadiusKm: real("delivery_radius_km").notNull().default(5),
  autoAcceptOrders: integer("auto_accept_orders", { mode: "boolean" })
    .notNull()
    .default(false),
  updatedAt: integer("updated_at").notNull().default(sql`(unixepoch())`),
});

export const storeImages = sqliteTable(
  "store_images",
  {
    id: text("id").primaryKey(),
    storeId: text("store_id")
      .notNull()
      .references(() => stores.id, { onDelete: "cascade" }),
    objectKey: text("object_key").notNull(),
    url: text("url").notNull(),
    altText: text("alt_text"),
    kind: text("kind", { enum: ["logo", "banner", "gallery", "product", "service"] })
      .notNull()
      .default("gallery"),
    sortOrder: integer("sort_order").notNull().default(0),
    width: integer("width"),
    height: integer("height"),
    contentType: text("content_type"),
    sizeBytes: integer("size_bytes"),
    createdAt: integer("created_at").notNull().default(sql`(unixepoch())`),
  },
  (table) => [
    index("store_images_store_kind_idx").on(table.storeId, table.kind),
    uniqueIndex("store_images_object_key_unique").on(table.objectKey),
  ],
);

export const products = sqliteTable(
  "products",
  {
    id: text("id").primaryKey(),
    storeId: text("store_id")
      .notNull()
      .references(() => stores.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    slug: text("slug").notNull(),
    description: text("description").notNull().default(""),
    price: real("price"),
    currency: text("currency").notNull().default("INR"),
    imageKey: text("image_key"),
    imageUrl: text("image_url"),
    status: text("status", { enum: ["active", "draft", "archived"] })
      .notNull()
      .default("active"),
    ...timestamps,
  },
  (table) => [
    index("products_store_status_idx").on(table.storeId, table.status),
    uniqueIndex("products_store_slug_unique").on(table.storeId, table.slug),
  ],
);

export const inventory = sqliteTable(
  "inventory",
  {
    productId: text("product_id")
      .primaryKey()
      .references(() => products.id, { onDelete: "cascade" }),
    storeId: text("store_id")
      .notNull()
      .references(() => stores.id, { onDelete: "cascade" }),
    sku: text("sku").notNull(),
    quantity: integer("quantity").notNull().default(0),
    reservedQuantity: integer("reserved_quantity").notNull().default(0),
    lowStockThreshold: integer("low_stock_threshold").notNull().default(5),
    updatedAt: integer("updated_at").notNull().default(sql`(unixepoch())`),
  },
  (table) => [
    uniqueIndex("inventory_store_sku_unique").on(table.storeId, table.sku),
    index("inventory_store_quantity_idx").on(table.storeId, table.quantity),
  ],
);

export const inventoryMovements = sqliteTable(
  "inventory_movements",
  {
    id: text("id").primaryKey(),
    productId: text("product_id")
      .notNull()
      .references(() => products.id, { onDelete: "cascade" }),
    storeId: text("store_id")
      .notNull()
      .references(() => stores.id, { onDelete: "cascade" }),
    actorId: text("actor_id").references(() => users.id, { onDelete: "set null" }),
    quantityChange: integer("quantity_change").notNull(),
    reason: text("reason").notNull(),
    referenceId: text("reference_id"),
    createdAt: integer("created_at").notNull().default(sql`(unixepoch())`),
  },
  (table) => [index("inventory_movements_store_date_idx").on(table.storeId, table.createdAt)],
);

export const wishlistItems = sqliteTable(
  "wishlist_items",
  {
    id: text("id").primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    productId: text("product_id")
      .notNull()
      .references(() => products.id, { onDelete: "cascade" }),
    createdAt: integer("created_at").notNull().default(sql`(unixepoch())`),
  },
  (table) => [
    uniqueIndex("wishlist_user_product_unique").on(table.userId, table.productId),
    index("wishlist_user_date_idx").on(table.userId, table.createdAt),
  ],
);

export const cartItems = sqliteTable(
  "cart_items",
  {
    id: text("id").primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    productId: text("product_id")
      .notNull()
      .references(() => products.id, { onDelete: "cascade" }),
    quantity: integer("quantity").notNull().default(1),
    ...timestamps,
  },
  (table) => [
    uniqueIndex("cart_user_product_unique").on(table.userId, table.productId),
    index("cart_user_updated_idx").on(table.userId, table.updatedAt),
  ],
);

export const services = sqliteTable(
  "services",
  {
    id: text("id").primaryKey(),
    storeId: text("store_id")
      .notNull()
      .references(() => stores.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    slug: text("slug").notNull(),
    description: text("description").notNull().default(""),
    priceFrom: real("price_from"),
    durationMinutes: integer("duration_minutes"),
    imageKey: text("image_key"),
    imageUrl: text("image_url"),
    status: text("status", { enum: ["active", "draft", "archived"] })
      .notNull()
      .default("active"),
    ...timestamps,
  },
  (table) => [
    index("services_store_status_idx").on(table.storeId, table.status),
    uniqueIndex("services_store_slug_unique").on(table.storeId, table.slug),
  ],
);

export const offers = sqliteTable(
  "offers",
  {
    id: text("id").primaryKey(),
    storeId: text("store_id")
      .notNull()
      .references(() => stores.id, { onDelete: "cascade" }),
    title: text("title").notNull(),
    description: text("description").notNull().default(""),
    code: text("code"),
    startsAt: integer("starts_at"),
    endsAt: integer("ends_at"),
    status: text("status", { enum: ["active", "draft", "expired"] })
      .notNull()
      .default("active"),
    ...timestamps,
  },
  (table) => [index("offers_store_status_dates_idx").on(table.storeId, table.status, table.endsAt)],
);

export const coupons = sqliteTable(
  "coupons",
  {
    id: text("id").primaryKey(),
    storeId: text("store_id").references(() => stores.id, { onDelete: "cascade" }),
    code: text("code").notNull(),
    title: text("title").notNull(),
    description: text("description").notNull().default(""),
    discountType: text("discount_type", { enum: ["percentage", "fixed"] }).notNull(),
    discountValue: real("discount_value").notNull(),
    minimumOrder: real("minimum_order").notNull().default(0),
    maximumDiscount: real("maximum_discount"),
    usageLimit: integer("usage_limit"),
    usedCount: integer("used_count").notNull().default(0),
    startsAt: integer("starts_at"),
    endsAt: integer("ends_at"),
    status: text("status", { enum: ["active", "draft", "expired", "disabled"] })
      .notNull()
      .default("active"),
    createdBy: text("created_by").references(() => users.id, { onDelete: "set null" }),
    ...timestamps,
  },
  (table) => [
    uniqueIndex("coupons_code_unique").on(table.code),
    index("coupons_store_status_dates_idx").on(table.storeId, table.status, table.endsAt),
  ],
);

export const orders = sqliteTable(
  "orders",
  {
    id: text("id").primaryKey(),
    orderNumber: text("order_number").notNull(),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "restrict" }),
    storeId: text("store_id")
      .notNull()
      .references(() => stores.id, { onDelete: "restrict" }),
    couponId: text("coupon_id").references(() => coupons.id, { onDelete: "set null" }),
    addressSnapshot: text("address_snapshot", { mode: "json" })
      .$type<Record<string, unknown>>()
      .notNull(),
    status: text("status", {
      enum: [
        "pending",
        "confirmed",
        "preparing",
        "ready",
        "out_for_delivery",
        "delivered",
        "cancelled",
        "rejected",
      ],
    })
      .notNull()
      .default("pending"),
    fulfillmentType: text("fulfillment_type", { enum: ["delivery", "pickup"] })
      .notNull()
      .default("delivery"),
    subtotal: real("subtotal").notNull(),
    discount: real("discount").notNull().default(0),
    deliveryFee: real("delivery_fee").notNull().default(0),
    total: real("total").notNull(),
    currency: text("currency").notNull().default("INR"),
    notes: text("notes"),
    placedAt: integer("placed_at").notNull().default(sql`(unixepoch())`),
    cancelledAt: integer("cancelled_at"),
    ...timestamps,
  },
  (table) => [
    uniqueIndex("orders_number_unique").on(table.orderNumber),
    index("orders_user_status_date_idx").on(table.userId, table.status, table.createdAt),
    index("orders_store_status_date_idx").on(table.storeId, table.status, table.createdAt),
  ],
);

export const orderItems = sqliteTable(
  "order_items",
  {
    id: text("id").primaryKey(),
    orderId: text("order_id")
      .notNull()
      .references(() => orders.id, { onDelete: "cascade" }),
    productId: text("product_id").references(() => products.id, { onDelete: "set null" }),
    productName: text("product_name").notNull(),
    sku: text("sku"),
    unitPrice: real("unit_price").notNull(),
    quantity: integer("quantity").notNull(),
    lineTotal: real("line_total").notNull(),
    createdAt: integer("created_at").notNull().default(sql`(unixepoch())`),
  },
  (table) => [index("order_items_order_idx").on(table.orderId)],
);

export const orderStatusHistory = sqliteTable(
  "order_status_history",
  {
    id: text("id").primaryKey(),
    orderId: text("order_id")
      .notNull()
      .references(() => orders.id, { onDelete: "cascade" }),
    actorId: text("actor_id").references(() => users.id, { onDelete: "set null" }),
    status: text("status").notNull(),
    note: text("note"),
    createdAt: integer("created_at").notNull().default(sql`(unixepoch())`),
  },
  (table) => [index("order_history_order_date_idx").on(table.orderId, table.createdAt)],
);

export const couponRedemptions = sqliteTable(
  "coupon_redemptions",
  {
    id: text("id").primaryKey(),
    couponId: text("coupon_id")
      .notNull()
      .references(() => coupons.id, { onDelete: "cascade" }),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    orderId: text("order_id")
      .notNull()
      .references(() => orders.id, { onDelete: "cascade" }),
    discountAmount: real("discount_amount").notNull(),
    createdAt: integer("created_at").notNull().default(sql`(unixepoch())`),
  },
  (table) => [
    uniqueIndex("coupon_redemptions_order_unique").on(table.orderId),
    index("coupon_redemptions_coupon_user_idx").on(table.couponId, table.userId),
  ],
);

export const productReviews = sqliteTable(
  "product_reviews",
  {
    id: text("id").primaryKey(),
    productId: text("product_id")
      .notNull()
      .references(() => products.id, { onDelete: "cascade" }),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    orderItemId: text("order_item_id").references(() => orderItems.id, { onDelete: "set null" }),
    reviewerName: text("reviewer_name").notNull(),
    rating: integer("rating").notNull(),
    title: text("title"),
    comment: text("comment").notNull(),
    status: text("status", { enum: ["pending", "published", "hidden"] })
      .notNull()
      .default("published"),
    ...timestamps,
  },
  (table) => [
    uniqueIndex("product_reviews_product_user_unique").on(table.productId, table.userId),
    index("product_reviews_product_status_date_idx").on(table.productId, table.status, table.createdAt),
    index("product_reviews_user_date_idx").on(table.userId, table.createdAt),
  ],
);

export const reviews = sqliteTable(
  "reviews",
  {
    id: text("id").primaryKey(),
    storeId: text("store_id")
      .notNull()
      .references(() => stores.id, { onDelete: "cascade" }),
    userId: text("user_id").references(() => users.id, { onDelete: "set null" }),
    reviewerName: text("reviewer_name").notNull(),
    rating: integer("rating").notNull(),
    title: text("title"),
    comment: text("comment").notNull(),
    ownerReply: text("owner_reply"),
    ownerRepliedAt: integer("owner_replied_at"),
    status: text("status", { enum: ["pending", "published", "hidden"] })
      .notNull()
      .default("published"),
    ...timestamps,
  },
  (table) => [
    index("reviews_store_status_created_idx").on(table.storeId, table.status, table.createdAt),
    index("reviews_user_idx").on(table.userId),
    uniqueIndex("reviews_store_user_unique").on(table.storeId, table.userId),
  ],
);

export const favorites = sqliteTable(
  "favorites",
  {
    id: text("id").primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    storeId: text("store_id")
      .notNull()
      .references(() => stores.id, { onDelete: "cascade" }),
    createdAt: integer("created_at").notNull().default(sql`(unixepoch())`),
  },
  (table) => [
    uniqueIndex("favorites_user_store_unique").on(table.userId, table.storeId),
    index("favorites_user_created_idx").on(table.userId, table.createdAt),
  ],
);

export const analyticsEvents = sqliteTable(
  "analytics_events",
  {
    id: text("id").primaryKey(),
    storeId: text("store_id").references(() => stores.id, { onDelete: "cascade" }),
    userId: text("user_id").references(() => users.id, { onDelete: "set null" }),
    eventType: text("event_type", {
      enum: ["view", "search_impression", "direction", "phone", "whatsapp", "website", "share"],
    }).notNull(),
    metadata: text("metadata", { mode: "json" }).$type<Record<string, unknown>>(),
    ipHash: text("ip_hash"),
    occurredAt: integer("occurred_at").notNull().default(sql`(unixepoch())`),
  },
  (table) => [
    index("analytics_store_type_date_idx").on(table.storeId, table.eventType, table.occurredAt),
    index("analytics_date_idx").on(table.occurredAt),
  ],
);

export const reports = sqliteTable(
  "reports",
  {
    id: text("id").primaryKey(),
    storeId: text("store_id").references(() => stores.id, { onDelete: "cascade" }),
    reviewId: text("review_id").references(() => reviews.id, { onDelete: "cascade" }),
    reporterId: text("reporter_id").references(() => users.id, { onDelete: "set null" }),
    reason: text("reason").notNull(),
    details: text("details"),
    status: text("status", { enum: ["open", "reviewing", "resolved", "dismissed"] })
      .notNull()
      .default("open"),
    assignedTo: text("assigned_to").references(() => users.id, { onDelete: "set null" }),
    resolvedAt: integer("resolved_at"),
    createdAt: integer("created_at").notNull().default(sql`(unixepoch())`),
    updatedAt: integer("updated_at").notNull().default(sql`(unixepoch())`),
  },
  (table) => [index("reports_status_created_idx").on(table.status, table.createdAt)],
);

export const auditLogs = sqliteTable(
  "audit_logs",
  {
    id: text("id").primaryKey(),
    actorId: text("actor_id").references(() => users.id, { onDelete: "set null" }),
    action: text("action").notNull(),
    entityType: text("entity_type").notNull(),
    entityId: text("entity_id"),
    metadata: text("metadata", { mode: "json" }).$type<Record<string, unknown>>(),
    ipHash: text("ip_hash"),
    createdAt: integer("created_at").notNull().default(sql`(unixepoch())`),
  },
  (table) => [index("audit_actor_date_idx").on(table.actorId, table.createdAt)],
);

export const notifications = sqliteTable(
  "notifications",
  {
    id: text("id").primaryKey(),
    userId: text("user_id").references(() => users.id, { onDelete: "cascade" }),
    audience: text("audience", { enum: ["user", "admin", "store_owner", "customer", "all"] })
      .notNull()
      .default("user"),
    type: text("type").notNull().default("info"),
    title: text("title").notNull(),
    message: text("message").notNull(),
    link: text("link"),
    readAt: integer("read_at"),
    createdAt: integer("created_at").notNull().default(sql`(unixepoch())`),
  },
  (table) => [
    index("notifications_user_read_date_idx").on(table.userId, table.readAt, table.createdAt),
    index("notifications_audience_date_idx").on(table.audience, table.createdAt),
  ],
);

export const supportTickets = sqliteTable(
  "support_tickets",
  {
    id: text("id").primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    storeId: text("store_id").references(() => stores.id, { onDelete: "set null" }),
    orderId: text("order_id").references(() => orders.id, { onDelete: "set null" }),
    assignedTo: text("assigned_to").references(() => users.id, { onDelete: "set null" }),
    type: text("type", { enum: ["support", "complaint"] }).notNull().default("support"),
    subject: text("subject").notNull(),
    message: text("message").notNull(),
    priority: text("priority", { enum: ["low", "normal", "high", "urgent"] })
      .notNull()
      .default("normal"),
    status: text("status", { enum: ["open", "in_progress", "resolved", "closed"] })
      .notNull()
      .default("open"),
    resolution: text("resolution"),
    ...timestamps,
  },
  (table) => [
    index("support_status_priority_date_idx").on(table.status, table.priority, table.createdAt),
    index("support_user_date_idx").on(table.userId, table.createdAt),
  ],
);

export const banners = sqliteTable(
  "banners",
  {
    id: text("id").primaryKey(),
    title: text("title").notNull(),
    subtitle: text("subtitle"),
    imageKey: text("image_key"),
    imageUrl: text("image_url"),
    linkUrl: text("link_url"),
    placement: text("placement", { enum: ["home", "search", "dashboard"] })
      .notNull()
      .default("home"),
    status: text("status", { enum: ["active", "draft", "expired"] })
      .notNull()
      .default("draft"),
    startsAt: integer("starts_at"),
    endsAt: integer("ends_at"),
    sortOrder: integer("sort_order").notNull().default(0),
    createdBy: text("created_by").references(() => users.id, { onDelete: "set null" }),
    ...timestamps,
  },
  (table) => [index("banners_placement_status_dates_idx").on(table.placement, table.status, table.startsAt, table.endsAt)],
);

export const conversations = sqliteTable(
  "conversations",
  {
    id: text("id").primaryKey(),
    kind: text("kind", { enum: ["store", "admin", "support"] }).notNull(),
    storeId: text("store_id").references(() => stores.id, { onDelete: "cascade" }),
    supportTicketId: text("support_ticket_id").references(() => supportTickets.id, {
      onDelete: "set null",
    }),
    subject: text("subject").notNull().default("Conversation"),
    status: text("status", { enum: ["open", "pending", "resolved"] })
      .notNull()
      .default("open"),
    createdBy: text("created_by").references(() => users.id, { onDelete: "set null" }),
    lastMessageAt: integer("last_message_at").notNull().default(sql`(unixepoch())`),
    ...timestamps,
  },
  (table) => [
    index("conversations_kind_status_date_idx").on(table.kind, table.status, table.lastMessageAt),
    index("conversations_store_date_idx").on(table.storeId, table.lastMessageAt),
    uniqueIndex("conversations_support_ticket_unique").on(table.supportTicketId),
  ],
);

export const conversationParticipants = sqliteTable(
  "conversation_participants",
  {
    id: text("id").primaryKey(),
    conversationId: text("conversation_id")
      .notNull()
      .references(() => conversations.id, { onDelete: "cascade" }),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    participantRole: text("participant_role").notNull(),
    lastReadAt: integer("last_read_at"),
    mutedAt: integer("muted_at"),
    joinedAt: integer("joined_at").notNull().default(sql`(unixepoch())`),
  },
  (table) => [
    uniqueIndex("conversation_participant_unique").on(table.conversationId, table.userId),
    index("conversation_participants_user_idx").on(table.userId, table.conversationId),
  ],
);

export const messages = sqliteTable(
  "messages",
  {
    id: text("id").primaryKey(),
    conversationId: text("conversation_id")
      .notNull()
      .references(() => conversations.id, { onDelete: "cascade" }),
    senderId: text("sender_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    type: text("type", { enum: ["text", "image", "video", "system"] }).notNull().default("text"),
    body: text("body").notNull(),
    clientNonce: text("client_nonce"),
    deliveredAt: integer("delivered_at").notNull().default(sql`(unixepoch())`),
    createdAt: integer("created_at").notNull().default(sql`(unixepoch())`),
  },
  (table) => [
    index("messages_conversation_date_idx").on(table.conversationId, table.createdAt),
    uniqueIndex("messages_sender_nonce_unique").on(table.senderId, table.clientNonce),
  ],
);

export const mediaAssets = sqliteTable(
  "media_assets",
  {
    id: text("id").primaryKey(),
    objectKey: text("object_key").notNull(),
    thumbnailKey: text("thumbnail_key"),
    publicUrl: text("public_url"),
    thumbnailUrl: text("thumbnail_url"),
    ownerType: text("owner_type", { enum: ["product", "service", "chat"] }).notNull(),
    productId: text("product_id").references(() => products.id, { onDelete: "cascade" }),
    serviceId: text("service_id").references(() => services.id, { onDelete: "cascade" }),
    messageId: text("message_id").references(() => messages.id, { onDelete: "cascade" }),
    storeId: text("store_id").references(() => stores.id, { onDelete: "cascade" }),
    conversationId: text("conversation_id").references(() => conversations.id, { onDelete: "cascade" }),
    uploadedBy: text("uploaded_by")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    mediaType: text("media_type", { enum: ["image", "video"] }).notNull(),
    contentType: text("content_type").notNull(),
    originalName: text("original_name").notNull(),
    caption: text("caption"),
    altText: text("alt_text"),
    sizeBytes: integer("size_bytes").notNull(),
    checksum: text("checksum").notNull(),
    width: integer("width"),
    height: integer("height"),
    durationSeconds: integer("duration_seconds"),
    sortOrder: integer("sort_order").notNull().default(0),
    featured: integer("featured", { mode: "boolean" }).notNull().default(false),
    cropX: integer("crop_x").notNull().default(50),
    cropY: integer("crop_y").notNull().default(50),
    createdAt: integer("created_at").notNull().default(sql`(unixepoch())`),
  },
  (table) => [
    uniqueIndex("media_assets_object_key_unique").on(table.objectKey),
    uniqueIndex("media_assets_message_unique").on(table.messageId),
    index("media_assets_product_order_idx").on(table.productId, table.sortOrder),
    index("media_assets_service_order_idx").on(table.serviceId, table.sortOrder),
    index("media_assets_conversation_date_idx").on(table.conversationId, table.createdAt),
    index("media_assets_uploaded_checksum_idx").on(table.uploadedBy, table.checksum),
  ],
);

export const conversationBlocks = sqliteTable(
  "conversation_blocks",
  {
    id: text("id").primaryKey(),
    conversationId: text("conversation_id")
      .notNull()
      .references(() => conversations.id, { onDelete: "cascade" }),
    blockerId: text("blocker_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    blockedId: text("blocked_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    reason: text("reason"),
    createdAt: integer("created_at").notNull().default(sql`(unixepoch())`),
  },
  (table) => [
    uniqueIndex("conversation_block_unique").on(table.conversationId, table.blockerId, table.blockedId),
    index("conversation_blocks_users_idx").on(table.blockerId, table.blockedId),
  ],
);

export const chatReports = sqliteTable(
  "chat_reports",
  {
    id: text("id").primaryKey(),
    conversationId: text("conversation_id")
      .notNull()
      .references(() => conversations.id, { onDelete: "cascade" }),
    messageId: text("message_id").references(() => messages.id, { onDelete: "set null" }),
    reporterId: text("reporter_id").references(() => users.id, { onDelete: "set null" }),
    reportedId: text("reported_id").references(() => users.id, { onDelete: "set null" }),
    reason: text("reason").notNull(),
    details: text("details"),
    status: text("status", { enum: ["open", "reviewing", "resolved", "dismissed"] })
      .notNull()
      .default("open"),
    assignedTo: text("assigned_to").references(() => users.id, { onDelete: "set null" }),
    resolvedAt: integer("resolved_at"),
    ...timestamps,
  },
  (table) => [index("chat_reports_status_date_idx").on(table.status, table.createdAt)],
);

export const healthcareProviderProfiles = sqliteTable(
  "healthcare_provider_profiles",
  {
    storeId: text("store_id")
      .primaryKey()
      .references(() => stores.id, { onDelete: "cascade" }),
    providerType: text("provider_type", {
      enum: ["hospital", "clinic", "dental_clinic", "diagnostic_lab", "pharmacy", "eye_clinic", "veterinary_clinic"],
    }).notNull(),
    acceptingPatients: integer("accepting_patients", { mode: "boolean" }).notNull().default(true),
    emergencyAvailable: integer("emergency_available", { mode: "boolean" }).notNull().default(false),
    adminQueueEnabled: integer("admin_queue_enabled", { mode: "boolean" }).notNull().default(false),
    ownerQueueEnabled: integer("owner_queue_enabled", { mode: "boolean" }).notNull().default(false),
    queueActivationStatus: text("queue_activation_status", { enum: ["not_requested", "pending", "approved", "rejected", "suspended"] })
      .notNull()
      .default("not_requested"),
    queueRequestedAt: integer("queue_requested_at"),
    queueReviewedAt: integer("queue_reviewed_at"),
    queueReviewedBy: text("queue_reviewed_by").references(() => users.id, { onDelete: "set null" }),
    queueDecisionReason: text("queue_decision_reason"),
    verificationStatus: text("verification_status", { enum: ["pending", "verified", "rejected"] })
      .notNull()
      .default("pending"),
    ...timestamps,
  },
  (table) => [index("healthcare_profiles_type_queue_idx").on(table.providerType, table.adminQueueEnabled, table.ownerQueueEnabled)],
);

export const healthcareQueueSettings = sqliteTable("healthcare_queue_settings", {
  storeId: text("store_id")
    .primaryKey()
    .references(() => stores.id, { onDelete: "cascade" }),
  status: text("status", { enum: ["closed", "open", "paused"] }).notNull().default("closed"),
  consultationMinutes: integer("consultation_minutes").notNull().default(15),
  openingTime: text("opening_time").notNull().default("09:00"),
  closingTime: text("closing_time").notNull().default("18:00"),
  maximumDailyPatients: integer("maximum_daily_patients").notNull().default(100),
  currentTokenNumber: integer("current_token_number").notNull().default(0),
  nextTokenNumber: integer("next_token_number").notNull().default(1),
  serviceDate: text("service_date").notNull(),
  openedAt: integer("opened_at"),
  closedAt: integer("closed_at"),
  updatedBy: text("updated_by").references(() => users.id, { onDelete: "set null" }),
  updatedAt: integer("updated_at").notNull().default(sql`(unixepoch())`),
});

export const healthcareQueueEntries = sqliteTable(
  "healthcare_queue_entries",
  {
    id: text("id").primaryKey(),
    storeId: text("store_id")
      .notNull()
      .references(() => stores.id, { onDelete: "cascade" }),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    serviceDate: text("service_date").notNull(),
    tokenNumber: integer("token_number").notNull(),
    activeKey: text("active_key"),
    status: text("status", { enum: ["waiting", "called", "skipped", "completed", "left", "cancelled", "removed", "expired"] })
      .notNull()
      .default("waiting"),
    arrivalStatus: text("arrival_status", { enum: ["waiting", "leaving_now", "running_late"] }).notNull().default("waiting"),
    isEmergency: integer("is_emergency", { mode: "boolean" }).notNull().default(false),
    isWalkIn: integer("is_walk_in", { mode: "boolean" }).notNull().default(false),
    patientName: text("patient_name"),
    contactDetails: text("contact_details"),
    emergencyPatientName: text("emergency_patient_name"),
    emergencyPatientPhone: text("emergency_patient_phone"),
    joinedAt: integer("joined_at").notNull().default(sql`(unixepoch())`),
    expiresAt: integer("expires_at"),
    reminderSentAt: integer("reminder_sent_at"),
    calledAt: integer("called_at"),
    recalledAt: integer("recalled_at"),
    recallCount: integer("recall_count").notNull().default(0),
    completedAt: integer("completed_at"),
    leftAt: integer("left_at"),
    updatedAt: integer("updated_at").notNull().default(sql`(unixepoch())`),
  },
  (table) => [
    uniqueIndex("healthcare_queue_token_unique").on(table.storeId, table.serviceDate, table.tokenNumber),
    uniqueIndex("healthcare_queue_active_unique").on(table.activeKey),
    index("healthcare_queue_store_status_token_idx").on(table.storeId, table.serviceDate, table.status, table.tokenNumber),
    index("healthcare_queue_user_date_idx").on(table.userId, table.serviceDate),
    index("healthcare_queue_expiry_idx").on(table.expiresAt, table.status),
  ],
);

export const healthcareQueueEvents = sqliteTable(
  "healthcare_queue_events",
  {
    id: text("id").primaryKey(),
    storeId: text("store_id")
      .notNull()
      .references(() => stores.id, { onDelete: "cascade" }),
    entryId: text("entry_id").references(() => healthcareQueueEntries.id, { onDelete: "set null" }),
    actorId: text("actor_id").references(() => users.id, { onDelete: "set null" }),
    eventType: text("event_type").notNull(),
    metadata: text("metadata", { mode: "json" }).$type<Record<string, unknown>>(),
    createdAt: integer("created_at").notNull().default(sql`(unixepoch())`),
  },
  (table) => [index("healthcare_queue_events_store_date_idx").on(table.storeId, table.createdAt)],
);

export const healthcareQueueReports = sqliteTable(
  "healthcare_queue_reports",
  {
    id: text("id").primaryKey(),
    storeId: text("store_id")
      .notNull()
      .references(() => stores.id, { onDelete: "cascade" }),
    entryId: text("entry_id").references(() => healthcareQueueEntries.id, { onDelete: "set null" }),
    reporterId: text("reporter_id").references(() => users.id, { onDelete: "set null" }),
    reason: text("reason").notNull(),
    details: text("details"),
    status: text("status", { enum: ["open", "reviewing", "resolved", "dismissed"] })
      .notNull()
      .default("open"),
    assignedTo: text("assigned_to").references(() => users.id, { onDelete: "set null" }),
    resolvedAt: integer("resolved_at"),
    ...timestamps,
  },
  (table) => [index("healthcare_queue_reports_status_date_idx").on(table.status, table.createdAt)],
);

export const rateLimits = sqliteTable("rate_limits", {
  key: text("key").primaryKey(),
  count: integer("count").notNull().default(0),
  windowStartedAt: integer("window_started_at").notNull(),
  updatedAt: integer("updated_at").notNull(),
});

export const systemSettings = sqliteTable("system_settings", {
  key: text("key").primaryKey(),
  value: text("value").notNull(),
  updatedAt: integer("updated_at").notNull().default(sql`(unixepoch())`),
});

export const usersRelations = relations(users, ({ many }) => ({
  sessions: many(sessions),
  externalAuthIdentities: many(externalAuthIdentities),
  stores: many(stores),
  reviews: many(reviews),
  favorites: many(favorites),
  addresses: many(addresses),
  wishlistItems: many(wishlistItems),
  cartItems: many(cartItems),
  orders: many(orders),
  productReviews: many(productReviews),
  notifications: many(notifications),
  supportTickets: many(supportTickets),
}));

export const storesRelations = relations(stores, ({ one, many }) => ({
  owner: one(users, { fields: [stores.ownerId], references: [users.id] }),
  category: one(categories, { fields: [stores.categoryId], references: [categories.id] }),
  subcategory: one(categories, {
    fields: [stores.subcategoryId],
    references: [categories.id],
    relationName: "store_subcategory",
  }),
  images: many(storeImages),
  products: many(products),
  services: many(services),
  offers: many(offers),
  reviews: many(reviews),
  favorites: many(favorites),
  analytics: many(analyticsEvents),
  orders: many(orders),
  coupons: many(coupons),
}));

export const categoriesRelations = relations(categories, ({ one, many }) => ({
  parent: one(categories, {
    fields: [categories.parentId],
    references: [categories.id],
    relationName: "category_tree",
  }),
  children: many(categories, { relationName: "category_tree" }),
  stores: many(stores),
}));

export const sessionsRelations = relations(sessions, ({ one }) => ({
  user: one(users, { fields: [sessions.userId], references: [users.id] }),
}));

export const reviewsRelations = relations(reviews, ({ one }) => ({
  store: one(stores, { fields: [reviews.storeId], references: [stores.id] }),
  user: one(users, { fields: [reviews.userId], references: [users.id] }),
}));

export const favoritesRelations = relations(favorites, ({ one }) => ({
  store: one(stores, { fields: [favorites.storeId], references: [stores.id] }),
  user: one(users, { fields: [favorites.userId], references: [users.id] }),
}));

export const productsRelations = relations(products, ({ one, many }) => ({
  store: one(stores, { fields: [products.storeId], references: [stores.id] }),
  inventory: one(inventory, { fields: [products.id], references: [inventory.productId] }),
  media: many(mediaAssets),
  wishlistItems: many(wishlistItems),
  cartItems: many(cartItems),
  orderItems: many(orderItems),
  reviews: many(productReviews),
}));

export const servicesRelations = relations(services, ({ one, many }) => ({
  store: one(stores, { fields: [services.storeId], references: [stores.id] }),
  media: many(mediaAssets),
}));

export const messagesRelations = relations(messages, ({ one, many }) => ({
  conversation: one(conversations, { fields: [messages.conversationId], references: [conversations.id] }),
  sender: one(users, { fields: [messages.senderId], references: [users.id] }),
  media: many(mediaAssets),
}));

export const mediaAssetsRelations = relations(mediaAssets, ({ one }) => ({
  product: one(products, { fields: [mediaAssets.productId], references: [products.id] }),
  service: one(services, { fields: [mediaAssets.serviceId], references: [services.id] }),
  message: one(messages, { fields: [mediaAssets.messageId], references: [messages.id] }),
  store: one(stores, { fields: [mediaAssets.storeId], references: [stores.id] }),
  conversation: one(conversations, { fields: [mediaAssets.conversationId], references: [conversations.id] }),
  uploader: one(users, { fields: [mediaAssets.uploadedBy], references: [users.id] }),
}));

export const ordersRelations = relations(orders, ({ one, many }) => ({
  user: one(users, { fields: [orders.userId], references: [users.id] }),
  store: one(stores, { fields: [orders.storeId], references: [stores.id] }),
  coupon: one(coupons, { fields: [orders.couponId], references: [coupons.id] }),
  items: many(orderItems),
  history: many(orderStatusHistory),
}));
