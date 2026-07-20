import { getD1, getMediaBucket } from "@/db/runtime";
import { requireApiPermission } from "@/lib/auth";
import { writeAudit } from "@/lib/ownership";
import type { Permission } from "@/lib/rbac";
import { apiError, HttpError, noStoreJson } from "@/lib/security";
import { systemCurrency } from "@/lib/settings";
import { cleanText, d1SearchText, numberInput, safeJson, slugify, urlInput } from "@/lib/validation";

type BindValue = string | number | null;
type Row = Record<string, unknown>;

const VIEW_PERMISSIONS = {
  products: "products.manage_all",
  orders: "orders.manage_all",
  notifications: "notifications.manage",
  banners: "banners.manage",
  coupons: "coupons.manage_all",
  support: "support.manage",
  settings: "settings.manage",
  audit: "audit.view",
  security: "security.view",
  export: "reports.export",
} as const satisfies Record<string, Permission>;

type AdminView = keyof typeof VIEW_PERMISSIONS;

const PRODUCT_STATUSES = ["active", "draft", "archived"] as const;
const ORDER_STATUSES = [
  "pending",
  "confirmed",
  "preparing",
  "ready",
  "out_for_delivery",
  "delivered",
  "cancelled",
  "rejected",
] as const;
const BANNER_STATUSES = ["active", "draft", "expired"] as const;
const BANNER_PLACEMENTS = ["home", "search", "dashboard"] as const;
const COUPON_STATUSES = ["active", "draft", "expired", "disabled"] as const;
const TICKET_STATUSES = ["open", "in_progress", "resolved", "closed"] as const;
const TICKET_PRIORITIES = ["low", "normal", "high", "urgent"] as const;
const NOTIFICATION_AUDIENCES = ["admin", "store_owner", "customer", "all"] as const;
const NOTIFICATION_TYPES = ["info", "success", "warning", "alert", "order", "security"] as const;

const ORDER_TRANSITIONS: Record<string, readonly string[]> = {
  pending: ["confirmed", "cancelled", "rejected"],
  confirmed: ["preparing", "cancelled", "rejected"],
  preparing: ["ready", "cancelled", "rejected"],
  ready: ["out_for_delivery", "delivered", "cancelled"],
  out_for_delivery: ["delivered", "cancelled"],
  delivered: [],
  cancelled: [],
  rejected: [],
};

const SETTING_DEFINITIONS = {
  platform_name: { label: "Platform name", type: "text", defaultValue: "Kynisto" },
  support_email: { label: "Support email", type: "email", defaultValue: "nxt.arshit@gmail.com" },
  support_phone: { label: "Support phone", type: "text", defaultValue: "" },
  orders_enabled: { label: "Orders enabled", type: "boolean", defaultValue: "true" },
  maintenance_mode: { label: "Maintenance mode", type: "boolean", defaultValue: "false" },
  default_delivery_radius_km: {
    label: "Default delivery radius (km)",
    type: "number",
    defaultValue: "5",
  },
  default_currency: { label: "Default currency", type: "currency", defaultValue: "INR" },
  reviews_require_moderation: {
    label: "Moderate reviews before publishing",
    type: "boolean",
    defaultValue: "false",
  },
  owner_auto_approval: {
    label: "Automatically approve owner accounts",
    type: "boolean",
    defaultValue: "false",
  },
  privacy_policy_url: { label: "Privacy policy URL", type: "url", defaultValue: "" },
  terms_url: { label: "Terms URL", type: "url", defaultValue: "" },
} as const;

type SettingKey = keyof typeof SETTING_DEFINITIONS;

function isOneOf<T extends string>(value: unknown, allowed: readonly T[]): value is T {
  return typeof value === "string" && allowed.includes(value as T);
}

function hasOwn(input: Record<string, unknown>, key: string): boolean {
  return Object.prototype.hasOwnProperty.call(input, key);
}

function parsePagination(url: URL, maximum = 100): { page: number; limit: number; offset: number } {
  const rawPage = Number(url.searchParams.get("page"));
  const rawLimit = Number(url.searchParams.get("limit"));
  const page = Number.isInteger(rawPage) && rawPage > 0 ? rawPage : 1;
  const limit = Number.isInteger(rawLimit) ? Math.min(maximum, Math.max(1, rawLimit)) : 20;
  return { page, limit, offset: (page - 1) * limit };
}

function pagination(page: number, limit: number, total: number) {
  return { page, limit, total, totalPages: Math.ceil(total / limit) };
}

function queryText(url: URL): string {
  return d1SearchText((url.searchParams.get("q") ?? "").replace(/[%_]/g, "").trim());
}

function optionalId(value: unknown, label: string): string | null {
  return cleanText(value, label, { max: 80, required: false }) || null;
}

function cleanIdList(value: unknown, label: string): string[] {
  if (!Array.isArray(value)) throw new HttpError(400, `Choose at least one ${label.toLowerCase()}.`, "SELECTION_REQUIRED");
  const ids = [...new Set(value.map((item) => cleanText(item, label, { max: 80 })))];
  if (!ids.length) throw new HttpError(400, `Choose at least one ${label.toLowerCase()}.`, "SELECTION_REQUIRED");
  if (ids.length > 50) throw new HttpError(400, `You can update up to 50 ${label.toLowerCase()}s at once.`, "SELECTION_TOO_LARGE");
  return ids;
}

function optionalText(value: unknown, label: string, max: number): string | null {
  return cleanText(value, label, { max, required: false }) || null;
}

function optionalTimestamp(value: unknown, label: string): number | null {
  if (value === null || value === undefined || value === "") return null;
  const numeric = typeof value === "number" ? value : Number(value);
  if (Number.isInteger(numeric) && numeric >= 0 && numeric <= 4_102_444_800) return numeric;
  if (typeof value === "string") {
    const parsed = Date.parse(value);
    if (Number.isFinite(parsed)) return Math.floor(parsed / 1000);
  }
  throw new HttpError(400, `${label} is invalid.`, "INVALID_DATE");
}

function optionalWebUrl(value: unknown, label: string): string | null {
  if (value === null || value === undefined || value === "") return null;
  return urlInput(value, label, false);
}

function optionalLink(value: unknown, label = "Link"): string | null {
  if (value === null || value === undefined || value === "") return null;
  const link = cleanText(value, label, { max: 2048 });
  if (link.startsWith("/") && !link.startsWith("//")) return link;
  return urlInput(link, label, true);
}

function assertDateRange(startsAt: number | null, endsAt: number | null): void {
  if (startsAt !== null && endsAt !== null && endsAt <= startsAt) {
    throw new HttpError(400, "End date must be after the start date.", "INVALID_DATE_RANGE");
  }
}

async function readMutationBody(request: Request): Promise<Record<string, unknown>> {
  const contentLength = Number(request.headers.get("content-length") ?? 0);
  if (Number.isFinite(contentLength) && contentLength > 64 * 1024) {
    throw new HttpError(413, "Request body is too large.", "PAYLOAD_TOO_LARGE");
  }
  return safeJson(request);
}

async function paginatedQuery(
  itemsSql: string,
  countSql: string,
  bindings: BindValue[],
  page: number,
  limit: number,
  offset: number,
) {
  const db = getD1();
  const [items, total] = await Promise.all([
    db.prepare(itemsSql).bind(...bindings, limit, offset).all<Row>(),
    db.prepare(countSql).bind(...bindings).first<{ total: number }>(),
  ]);
  const count = Number(total?.total ?? 0);
  return { items: items.results ?? [], pagination: pagination(page, limit, count) };
}

async function getProducts(url: URL) {
  const { page, limit, offset } = parsePagination(url);
  const q = queryText(url);
  const conditions = ["1 = 1"];
  const bindings: BindValue[] = [];
  if (q) {
    conditions.push("(p.name LIKE ? OR p.description LIKE ? OR s.name LIKE ? OR i.sku LIKE ?)");
    bindings.push(...Array(4).fill(`%${q}%`));
  }
  const status = url.searchParams.get("status");
  if (isOneOf(status, PRODUCT_STATUSES)) {
    conditions.push("p.status = ?");
    bindings.push(status);
  }
  const storeId = url.searchParams.get("storeId");
  if (storeId) {
    conditions.push("p.store_id = ?");
    bindings.push(storeId.slice(0, 80));
  }
  const where = conditions.join(" AND ");
  const [products, stores] = await Promise.all([
    paginatedQuery(
    `SELECT p.id, p.store_id AS storeId, s.name AS storeName, u.email AS ownerEmail, p.name, p.slug, p.description,
      p.price, p.currency, p.image_url AS imageUrl, p.status,
      i.sku, COALESCE(i.quantity, 0) AS quantity,
      COALESCE(i.reserved_quantity, 0) AS reservedQuantity,
      COALESCE(i.low_stock_threshold, 0) AS lowStockThreshold,
      p.created_at AS createdAt, p.updated_at AS updatedAt
     FROM products p JOIN stores s ON s.id = p.store_id
     LEFT JOIN users u ON u.id = s.owner_id
     LEFT JOIN inventory i ON i.product_id = p.id
     WHERE ${where} ORDER BY p.updated_at DESC LIMIT ? OFFSET ?`,
    `SELECT COUNT(*) AS total FROM products p JOIN stores s ON s.id = p.store_id
     LEFT JOIN inventory i ON i.product_id = p.id WHERE ${where}`,
    bindings,
    page,
    limit,
    offset,
    ),
    getD1().prepare(
      `SELECT s.id, s.name, s.status, c.name AS category
       FROM stores s JOIN categories c ON c.id = s.category_id
       WHERE s.status <> 'suspended' ORDER BY s.name LIMIT 500`,
    ).all<Row>(),
  ]);
  return { ...products, stores: stores.results ?? [] };
}

async function getOrders(url: URL) {
  const { page, limit, offset } = parsePagination(url);
  const q = queryText(url);
  const conditions = ["1 = 1"];
  const bindings: BindValue[] = [];
  if (q) {
    conditions.push("(o.order_number LIKE ? OR u.name LIKE ? OR u.email LIKE ? OR s.name LIKE ?)");
    bindings.push(...Array(4).fill(`%${q}%`));
  }
  const status = url.searchParams.get("status");
  if (isOneOf(status, ORDER_STATUSES)) {
    conditions.push("o.status = ?");
    bindings.push(status);
  }
  const storeId = url.searchParams.get("storeId");
  if (storeId) {
    conditions.push("o.store_id = ?");
    bindings.push(storeId.slice(0, 80));
  }
  const where = conditions.join(" AND ");
  return paginatedQuery(
    `SELECT o.id, o.order_number AS orderNumber, o.user_id AS userId, u.name AS customerName,
      u.email AS customerEmail, o.store_id AS storeId, s.name AS storeName, o.status,
      o.fulfillment_type AS fulfillmentType, o.subtotal, o.discount, o.delivery_fee AS deliveryFee,
      o.total, o.currency, o.notes, o.placed_at AS placedAt, o.cancelled_at AS cancelledAt,
      o.created_at AS createdAt, o.updated_at AS updatedAt,
      (SELECT COUNT(*) FROM order_items oi WHERE oi.order_id = o.id) AS itemCount
     FROM orders o JOIN users u ON u.id = o.user_id JOIN stores s ON s.id = o.store_id
     WHERE ${where} ORDER BY o.created_at DESC LIMIT ? OFFSET ?`,
    `SELECT COUNT(*) AS total FROM orders o JOIN users u ON u.id = o.user_id
     JOIN stores s ON s.id = o.store_id WHERE ${where}`,
    bindings,
    page,
    limit,
    offset,
  );
}

async function getNotifications(url: URL) {
  const { page, limit, offset } = parsePagination(url);
  const q = queryText(url);
  const conditions = ["1 = 1"];
  const bindings: BindValue[] = [];
  if (q) {
    conditions.push("(n.title LIKE ? OR n.message LIKE ? OR u.name LIKE ? OR u.email LIKE ?)");
    bindings.push(...Array(4).fill(`%${q}%`));
  }
  const audience = url.searchParams.get("audience");
  if (isOneOf(audience, [...NOTIFICATION_AUDIENCES, "user"] as const)) {
    conditions.push("n.audience = ?");
    bindings.push(audience);
  }
  const where = conditions.join(" AND ");
  return paginatedQuery(
    `SELECT n.id, n.user_id AS userId, u.name AS userName, u.email AS userEmail,
      n.audience, n.type, n.title, n.message, n.link, n.read_at AS readAt,
      n.created_at AS createdAt FROM notifications n LEFT JOIN users u ON u.id = n.user_id
     WHERE ${where} ORDER BY n.created_at DESC LIMIT ? OFFSET ?`,
    `SELECT COUNT(*) AS total FROM notifications n LEFT JOIN users u ON u.id = n.user_id WHERE ${where}`,
    bindings,
    page,
    limit,
    offset,
  );
}

async function getBanners(url: URL) {
  const { page, limit, offset } = parsePagination(url);
  const q = queryText(url);
  const conditions = ["1 = 1"];
  const bindings: BindValue[] = [];
  if (q) {
    conditions.push("(b.title LIKE ? OR b.subtitle LIKE ?)");
    bindings.push(`%${q}%`, `%${q}%`);
  }
  const status = url.searchParams.get("status");
  if (isOneOf(status, BANNER_STATUSES)) {
    conditions.push("b.status = ?");
    bindings.push(status);
  }
  const placement = url.searchParams.get("placement");
  if (isOneOf(placement, BANNER_PLACEMENTS)) {
    conditions.push("b.placement = ?");
    bindings.push(placement);
  }
  const where = conditions.join(" AND ");
  return paginatedQuery(
    `SELECT b.id, b.title, b.subtitle, b.image_url AS imageUrl, b.link_url AS linkUrl,
      b.placement, b.status, b.starts_at AS startsAt, b.ends_at AS endsAt,
      b.sort_order AS sortOrder, b.created_by AS createdBy, u.name AS creatorName,
      b.created_at AS createdAt, b.updated_at AS updatedAt
     FROM banners b LEFT JOIN users u ON u.id = b.created_by
     WHERE ${where} ORDER BY b.sort_order ASC, b.updated_at DESC LIMIT ? OFFSET ?`,
    `SELECT COUNT(*) AS total FROM banners b WHERE ${where}`,
    bindings,
    page,
    limit,
    offset,
  );
}

async function getCoupons(url: URL) {
  const { page, limit, offset } = parsePagination(url);
  const q = queryText(url);
  const conditions = ["1 = 1"];
  const bindings: BindValue[] = [];
  if (q) {
    conditions.push("(c.code LIKE ? OR c.title LIKE ? OR c.description LIKE ? OR s.name LIKE ?)");
    bindings.push(...Array(4).fill(`%${q}%`));
  }
  const status = url.searchParams.get("status");
  if (isOneOf(status, COUPON_STATUSES)) {
    conditions.push("c.status = ?");
    bindings.push(status);
  }
  const storeId = url.searchParams.get("storeId");
  if (storeId) {
    conditions.push("c.store_id = ?");
    bindings.push(storeId.slice(0, 80));
  }
  const where = conditions.join(" AND ");
  return paginatedQuery(
    `SELECT c.id, c.store_id AS storeId, s.name AS storeName, c.code, c.title, c.description,
      c.discount_type AS discountType, c.discount_value AS discountValue,
      c.minimum_order AS minimumOrder, c.maximum_discount AS maximumDiscount,
      c.usage_limit AS usageLimit, c.used_count AS usedCount, c.starts_at AS startsAt,
      c.ends_at AS endsAt, c.status, c.created_at AS createdAt, c.updated_at AS updatedAt
     FROM coupons c LEFT JOIN stores s ON s.id = c.store_id
     WHERE ${where} ORDER BY c.updated_at DESC LIMIT ? OFFSET ?`,
    `SELECT COUNT(*) AS total FROM coupons c LEFT JOIN stores s ON s.id = c.store_id WHERE ${where}`,
    bindings,
    page,
    limit,
    offset,
  );
}

async function getSupport(url: URL) {
  const { page, limit, offset } = parsePagination(url);
  const q = queryText(url);
  const conditions = ["1 = 1"];
  const bindings: BindValue[] = [];
  if (q) {
    conditions.push("(t.subject LIKE ? OR t.message LIKE ? OR u.name LIKE ? OR u.email LIKE ?)");
    bindings.push(...Array(4).fill(`%${q}%`));
  }
  const status = url.searchParams.get("status");
  if (isOneOf(status, TICKET_STATUSES)) {
    conditions.push("t.status = ?");
    bindings.push(status);
  }
  const priority = url.searchParams.get("priority");
  if (isOneOf(priority, TICKET_PRIORITIES)) {
    conditions.push("t.priority = ?");
    bindings.push(priority);
  }
  const type = url.searchParams.get("type");
  if (type === "support" || type === "complaint") {
    conditions.push("t.type = ?");
    bindings.push(type);
  }
  const where = conditions.join(" AND ");
  return paginatedQuery(
    `SELECT t.id, t.user_id AS userId, u.name AS userName, u.email AS userEmail,
      t.store_id AS storeId, s.name AS storeName, t.order_id AS orderId,
      t.assigned_to AS assignedTo, a.name AS assigneeName, t.type, t.subject, t.message,
      t.priority, t.status, t.resolution, t.created_at AS createdAt, t.updated_at AS updatedAt
     FROM support_tickets t JOIN users u ON u.id = t.user_id
     LEFT JOIN stores s ON s.id = t.store_id LEFT JOIN users a ON a.id = t.assigned_to
     WHERE ${where}
     ORDER BY CASE t.priority WHEN 'urgent' THEN 0 WHEN 'high' THEN 1 WHEN 'normal' THEN 2 ELSE 3 END,
       CASE t.status WHEN 'open' THEN 0 WHEN 'in_progress' THEN 1 ELSE 2 END,
       t.created_at DESC LIMIT ? OFFSET ?`,
    `SELECT COUNT(*) AS total FROM support_tickets t JOIN users u ON u.id = t.user_id
     LEFT JOIN stores s ON s.id = t.store_id WHERE ${where}`,
    bindings,
    page,
    limit,
    offset,
  );
}

async function getSettings(url: URL) {
  const { page, limit, offset } = parsePagination(url);
  const q = queryText(url).toLowerCase();
  const keys = Object.keys(SETTING_DEFINITIONS) as SettingKey[];
  const placeholders = keys.map(() => "?").join(", ");
  const result = await getD1()
    .prepare(`SELECT key, value, updated_at AS updatedAt FROM system_settings WHERE key IN (${placeholders})`)
    .bind(...keys)
    .all<{ key: SettingKey; value: string; updatedAt: number }>();
  const saved = new Map((result.results ?? []).map((row) => [row.key, row]));
  const allItems = keys
    .map((key) => {
      const definition = SETTING_DEFINITIONS[key];
      const current = saved.get(key);
      return {
        key,
        label: definition.label,
        type: definition.type,
        value: current?.value ?? definition.defaultValue,
        isDefault: !current,
        updatedAt: current?.updatedAt ?? null,
      };
    })
    .filter((item) => !q || item.key.includes(q) || item.label.toLowerCase().includes(q));
  return {
    items: allItems.slice(offset, offset + limit),
    pagination: pagination(page, limit, allItems.length),
  };
}

async function getAudit(url: URL) {
  const { page, limit, offset } = parsePagination(url);
  const q = queryText(url);
  const conditions = ["1 = 1"];
  const bindings: BindValue[] = [];
  if (q) {
    conditions.push("(a.action LIKE ? OR a.entity_type LIKE ? OR a.entity_id LIKE ? OR u.name LIKE ? OR u.email LIKE ?)");
    bindings.push(...Array(5).fill(`%${q}%`));
  }
  const entityType = url.searchParams.get("entityType");
  if (entityType && /^[a-z_]{2,40}$/.test(entityType)) {
    conditions.push("a.entity_type = ?");
    bindings.push(entityType);
  }
  const where = conditions.join(" AND ");
  return paginatedQuery(
    `SELECT a.id, a.actor_id AS actorId, u.name AS actorName, u.email AS actorEmail,
      a.action, a.entity_type AS entityType, a.entity_id AS entityId, a.metadata,
      a.ip_hash AS ipHash, a.created_at AS createdAt
     FROM audit_logs a LEFT JOIN users u ON u.id = a.actor_id
     WHERE ${where} ORDER BY a.created_at DESC LIMIT ? OFFSET ?`,
    `SELECT COUNT(*) AS total FROM audit_logs a LEFT JOIN users u ON u.id = a.actor_id WHERE ${where}`,
    bindings,
    page,
    limit,
    offset,
  );
}

async function getSecurity(url: URL) {
  const { page, limit, offset } = parsePagination(url);
  const q = queryText(url);
  const now = Math.floor(Date.now() / 1000);
  const conditions = ["1 = 1"];
  const bindings: BindValue[] = [];
  if (q) {
    conditions.push("(u.name LIKE ? OR u.email LIKE ?)");
    bindings.push(`%${q}%`, `%${q}%`);
  }
  const risk = url.searchParams.get("risk");
  if (risk === "locked") conditions.push("COALESCE(us.locked_until, 0) > unixepoch()");
  if (risk === "failed") conditions.push("COALESCE(us.failed_login_count, 0) > 0");
  if (risk === "password_change") conditions.push("COALESCE(us.must_change_password, 0) = 1");
  if (risk === "super_admin") conditions.push("COALESCE(us.is_super_admin, 0) = 1");
  const where = conditions.join(" AND ");
  const db = getD1();
  const [result, summary, recentEvents] = await Promise.all([
    paginatedQuery(
      `SELECT u.id, u.name, u.email, u.role, u.status, u.last_login_at AS lastLoginAt,
        COALESCE(us.must_change_password, 0) AS mustChangePassword,
        COALESCE(us.is_super_admin, 0) AS isSuperAdmin,
        COALESCE(us.failed_login_count, 0) AS failedLoginCount,
        us.last_failed_login_at AS lastFailedLoginAt, us.locked_until AS lockedUntil,
        us.password_changed_at AS passwordChangedAt, us.updated_at AS securityUpdatedAt
       FROM users u LEFT JOIN user_security us ON us.user_id = u.id
       WHERE ${where}
       ORDER BY CASE WHEN COALESCE(us.locked_until, 0) > unixepoch() THEN 0
         WHEN COALESCE(us.failed_login_count, 0) > 0 THEN 1 ELSE 2 END,
         COALESCE(us.updated_at, u.updated_at) DESC LIMIT ? OFFSET ?`,
      `SELECT COUNT(*) AS total FROM users u LEFT JOIN user_security us ON us.user_id = u.id WHERE ${where}`,
      bindings,
      page,
      limit,
      offset,
    ),
    db.prepare(
      `SELECT COUNT(*) AS totalUsers,
        SUM(CASE WHEN COALESCE(us.locked_until, 0) > ? THEN 1 ELSE 0 END) AS lockedUsers,
        SUM(CASE WHEN COALESCE(us.failed_login_count, 0) > 0 THEN 1 ELSE 0 END) AS usersWithFailures,
        SUM(CASE WHEN COALESCE(us.must_change_password, 0) = 1 THEN 1 ELSE 0 END) AS passwordChangesRequired,
        SUM(CASE WHEN u.status IN ('suspended', 'disabled', 'banned') THEN 1 ELSE 0 END) AS restrictedUsers
       FROM users u LEFT JOIN user_security us ON us.user_id = u.id`,
    ).bind(now).first<Row>(),
    db.prepare(
      `SELECT a.id, a.action, a.entity_id AS entityId, a.metadata, a.ip_hash AS ipHash,
        a.created_at AS createdAt FROM audit_logs a
       WHERE a.action LIKE 'auth.%' ORDER BY a.created_at DESC LIMIT 20`,
    ).all<Row>(),
  ]);
  return { ...result, summary: summary ?? {}, recentEvents: recentEvents.results ?? [] };
}

const EXPORT_QUERIES: Record<string, string> = {
  products: `SELECT p.id, p.name, s.name AS store, p.price, p.currency, p.status,
    i.sku, COALESCE(i.quantity, 0) AS quantity, p.created_at AS createdAt
    FROM products p JOIN stores s ON s.id = p.store_id LEFT JOIN inventory i ON i.product_id = p.id
    ORDER BY p.created_at DESC LIMIT ? OFFSET ?`,
  orders: `SELECT o.order_number AS orderNumber, u.name AS customer, u.email AS customerEmail,
    s.name AS store, o.status, o.fulfillment_type AS fulfillmentType, o.subtotal, o.discount,
    o.delivery_fee AS deliveryFee, o.total, o.currency, o.placed_at AS placedAt
    FROM orders o JOIN users u ON u.id = o.user_id JOIN stores s ON s.id = o.store_id
    ORDER BY o.created_at DESC LIMIT ? OFFSET ?`,
  users: `SELECT u.id, u.name, u.email, u.phone, u.role, u.status,
    COALESCE(us.is_super_admin, 0) AS isSuperAdmin, u.last_login_at AS lastLoginAt,
    u.created_at AS createdAt FROM users u LEFT JOIN user_security us ON us.user_id = u.id
    ORDER BY u.created_at DESC LIMIT ? OFFSET ?`,
  stores: `SELECT s.id, s.name, c.name AS category, u.email AS ownerEmail, s.status, s.business_type AS businessType,
    s.address, s.area, s.city, s.state, s.postal_code AS postalCode, s.latitude, s.longitude,
    s.phone, s.email, s.rating_average AS rating, s.rating_count AS reviewCount,
    s.created_at AS createdAt FROM stores s JOIN categories c ON c.id = s.category_id
    LEFT JOIN users u ON u.id = s.owner_id ORDER BY s.created_at DESC LIMIT ? OFFSET ?`,
  reviews: `SELECT r.id, s.name AS store, r.reviewer_name AS reviewer, r.rating, r.title,
    r.comment, r.owner_reply AS ownerReply, r.status, r.created_at AS createdAt
    FROM reviews r JOIN stores s ON s.id = r.store_id ORDER BY r.created_at DESC LIMIT ? OFFSET ?`,
  support: `SELECT t.id, t.type, t.subject, u.name AS user, u.email AS userEmail,
    s.name AS store, t.priority, t.status, t.resolution, t.created_at AS createdAt
    FROM support_tickets t JOIN users u ON u.id = t.user_id LEFT JOIN stores s ON s.id = t.store_id
    ORDER BY t.created_at DESC LIMIT ? OFFSET ?`,
};

function csvCell(value: unknown): string {
  let text = value === null || value === undefined ? "" : typeof value === "object" ? JSON.stringify(value) : String(value);
  if (/^[\t\r ]*[=+\-@]/.test(text)) text = `'${text}`;
  return `"${text.replaceAll('"', '""')}"`;
}

function toCsv(rows: Row[]): string {
  if (rows.length === 0) return "";
  const headers = Object.keys(rows[0]);
  return [headers.map(csvCell).join(","), ...rows.map((row) => headers.map((key) => csvCell(row[key])).join(","))].join("\r\n");
}

async function getExport(url: URL): Promise<Response> {
  const resource = url.searchParams.get("resource") ?? "orders";
  const sql = EXPORT_QUERIES[resource];
  if (!sql) throw new HttpError(400, "Choose a valid export resource.", "INVALID_EXPORT_RESOURCE");
  const { page, limit, offset } = parsePagination(url, 2_000);
  const result = await getD1().prepare(sql).bind(limit, offset).all<Row>();
  const items = result.results ?? [];
  const format = url.searchParams.get("format") === "json" ? "json" : "csv";
  if (format === "json") {
    return noStoreJson({ resource, generatedAt: Math.floor(Date.now() / 1000), items, pagination: { page, limit } });
  }
  return new Response(`\uFEFF${toCsv(items)}`, {
    headers: {
      "Cache-Control": "no-store",
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="kynisto-${resource}-page-${page}.csv"`,
      "X-Content-Type-Options": "nosniff",
    },
  });
}

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const view = (url.searchParams.get("view") ?? "products") as AdminView;
    const permission = VIEW_PERMISSIONS[view];
    if (!permission) throw new HttpError(400, "Choose a valid workspace view.", "INVALID_VIEW");
    await requireApiPermission(request, permission);
    if (view === "export") return getExport(url);

    const handlers: Record<Exclude<AdminView, "export">, (input: URL) => Promise<unknown>> = {
      products: getProducts,
      orders: getOrders,
      notifications: getNotifications,
      banners: getBanners,
      coupons: getCoupons,
      support: getSupport,
      settings: getSettings,
      audit: getAudit,
      security: getSecurity,
    };
    return noStoreJson(await handlers[view](url));
  } catch (error) {
    return apiError(error);
  }
}

function normalizeAction(value: unknown): string {
  const action = cleanText(value, "Action", { max: 50 });
  return action.replaceAll(".", "_");
}

function couponCode(value: unknown): string {
  const code = cleanText(value, "Coupon code", { min: 3, max: 32 }).toUpperCase();
  if (!/^[A-Z0-9][A-Z0-9_-]{2,31}$/.test(code)) {
    throw new HttpError(400, "Coupon code may contain letters, numbers, hyphens, and underscores.", "INVALID_COUPON_CODE");
  }
  return code;
}

async function assertStore(storeId: string | null): Promise<void> {
  if (!storeId) return;
  const store = await getD1().prepare("SELECT id FROM stores WHERE id = ? LIMIT 1").bind(storeId).first();
  if (!store) throw new HttpError(404, "Store not found.", "STORE_NOT_FOUND");
}

async function createBroadcast(request: Request, body: Record<string, unknown>) {
  const session = await requireApiPermission(request, "notifications.manage", { csrf: true });
  const audience = body.audience;
  if (!isOneOf(audience, NOTIFICATION_AUDIENCES)) {
    throw new HttpError(400, "Choose a valid notification audience.", "INVALID_AUDIENCE");
  }
  const type = body.type ?? "info";
  if (!isOneOf(type, NOTIFICATION_TYPES)) {
    throw new HttpError(400, "Choose a valid notification type.", "INVALID_NOTIFICATION_TYPE");
  }
  const title = cleanText(body.title, "Title", { min: 3, max: 120 });
  const message = cleanText(body.message, "Message", { min: 3, max: 1_000 });
  const link = optionalLink(body.link);
  const id = crypto.randomUUID();
  const now = Math.floor(Date.now() / 1000);
  await getD1().prepare(
    "INSERT INTO notifications (id, user_id, audience, type, title, message, link, created_at) VALUES (?, NULL, ?, ?, ?, ?, ?, ?)",
  ).bind(id, audience, type, title, message, link, now).run();
  await writeAudit(request, session.user.id, "notification.broadcast", "notification", id, { audience, type });
  return noStoreJson({ ok: true, id }, { status: 201 });
}

function bannerInput(body: Record<string, unknown>, partial = false) {
  const output: Record<string, BindValue> = {};
  if (!partial || hasOwn(body, "title")) output.title = cleanText(body.title, "Title", { min: 2, max: 120 });
  if (!partial || hasOwn(body, "subtitle")) output.subtitle = optionalText(body.subtitle, "Subtitle", 300);
  if (!partial || hasOwn(body, "imageUrl")) output.image_url = optionalWebUrl(body.imageUrl, "Image URL");
  if (!partial || hasOwn(body, "linkUrl")) output.link_url = optionalLink(body.linkUrl, "Link URL");
  if (!partial || hasOwn(body, "placement")) {
    const placement = body.placement ?? "home";
    if (!isOneOf(placement, BANNER_PLACEMENTS)) throw new HttpError(400, "Choose a valid banner placement.", "INVALID_PLACEMENT");
    output.placement = placement;
  }
  if (!partial || hasOwn(body, "status")) {
    const status = body.status ?? "draft";
    if (!isOneOf(status, BANNER_STATUSES)) throw new HttpError(400, "Choose a valid banner status.", "INVALID_STATUS");
    output.status = status;
  }
  if (!partial || hasOwn(body, "startsAt")) output.starts_at = optionalTimestamp(body.startsAt, "Start date");
  if (!partial || hasOwn(body, "endsAt")) output.ends_at = optionalTimestamp(body.endsAt, "End date");
  if (!partial || hasOwn(body, "sortOrder")) {
    output.sort_order = numberInput(body.sortOrder ?? 0, "Sort order", { min: -1_000, max: 1_000, integer: true }) as number;
  }
  if (!partial) assertDateRange(output.starts_at as number | null, output.ends_at as number | null);
  return output;
}

async function createBanner(request: Request, body: Record<string, unknown>) {
  const session = await requireApiPermission(request, "banners.manage", { csrf: true });
  const input = bannerInput(body);
  const id = crypto.randomUUID();
  const now = Math.floor(Date.now() / 1000);
  await getD1().prepare(
    `INSERT INTO banners (id, title, subtitle, image_url, link_url, placement, status,
      starts_at, ends_at, sort_order, created_by, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
  ).bind(
    id, input.title, input.subtitle, input.image_url, input.link_url, input.placement,
    input.status, input.starts_at, input.ends_at, input.sort_order, session.user.id, now, now,
  ).run();
  await writeAudit(request, session.user.id, "banner.created", "banner", id, { placement: input.placement, status: input.status });
  return noStoreJson({ ok: true, id }, { status: 201 });
}

function couponInput(body: Record<string, unknown>) {
  const storeId = optionalId(body.storeId, "Store");
  const code = couponCode(body.code);
  const title = cleanText(body.title, "Title", { min: 2, max: 120 });
  const description = cleanText(body.description ?? "", "Description", { max: 2_000, required: false });
  const discountType = body.discountType;
  if (discountType !== "percentage" && discountType !== "fixed") {
    throw new HttpError(400, "Choose a valid discount type.", "INVALID_DISCOUNT_TYPE");
  }
  const discountValue = numberInput(body.discountValue, "Discount value", { min: 0.01, max: 1_000_000 }) as number;
  if (discountType === "percentage" && discountValue > 100) {
    throw new HttpError(400, "Percentage discounts cannot exceed 100%.", "INVALID_DISCOUNT_VALUE");
  }
  const minimumOrder = numberInput(body.minimumOrder ?? 0, "Minimum order", { min: 0, max: 10_000_000 }) as number;
  const maximumDiscount = numberInput(body.maximumDiscount, "Maximum discount", {
    min: 0.01,
    max: 10_000_000,
    required: false,
  });
  const usageLimit = numberInput(body.usageLimit, "Usage limit", { min: 1, max: 10_000_000, integer: true, required: false });
  const startsAt = optionalTimestamp(body.startsAt, "Start date");
  const endsAt = optionalTimestamp(body.endsAt, "End date");
  assertDateRange(startsAt, endsAt);
  const status = body.status ?? "active";
  if (!isOneOf(status, COUPON_STATUSES)) throw new HttpError(400, "Choose a valid coupon status.", "INVALID_STATUS");
  return { storeId, code, title, description, discountType, discountValue, minimumOrder, maximumDiscount, usageLimit, startsAt, endsAt, status };
}

async function createCoupon(request: Request, body: Record<string, unknown>) {
  const session = await requireApiPermission(request, "coupons.manage_all", { csrf: true });
  const input = couponInput(body);
  await assertStore(input.storeId);
  const duplicate = await getD1().prepare("SELECT id FROM coupons WHERE code = ? LIMIT 1").bind(input.code).first();
  if (duplicate) throw new HttpError(409, "That coupon code already exists.", "COUPON_CODE_EXISTS");
  const id = crypto.randomUUID();
  const now = Math.floor(Date.now() / 1000);
  await getD1().prepare(
    `INSERT INTO coupons (id, store_id, code, title, description, discount_type, discount_value,
      minimum_order, maximum_discount, usage_limit, used_count, starts_at, ends_at, status,
      created_by, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0, ?, ?, ?, ?, ?, ?)`,
  ).bind(
    id, input.storeId, input.code, input.title, input.description, input.discountType,
    input.discountValue, input.minimumOrder, input.maximumDiscount, input.usageLimit,
    input.startsAt, input.endsAt, input.status, session.user.id, now, now,
  ).run();
  await writeAudit(request, session.user.id, "coupon.created", "coupon", id, { code: input.code, storeId: input.storeId });
  return noStoreJson({ ok: true, id }, { status: 201 });
}

async function createProduct(request: Request, body: Record<string, unknown>) {
  const session = await requireApiPermission(request, "products.manage_all", { csrf: true });
  const storeId = cleanText(body.storeId, "Store", { max: 80 });
  await assertStore(storeId);
  const name = cleanText(body.name, "Product name", { min: 2, max: 160 });
  const description = cleanText(body.description, "Description", { max: 4_000, required: false });
  const price = numberInput(body.price, "Price", { min: 0, max: 100_000_000, required: false });
  const quantity = numberInput(body.quantity ?? 0, "Stock quantity", { min: 0, max: 10_000_000, integer: true }) as number;
  const lowStockThreshold = numberInput(body.lowStockThreshold ?? 5, "Low-stock threshold", { min: 0, max: 1_000_000, integer: true }) as number;
  const status = body.status ?? "active";
  if (!isOneOf(status, PRODUCT_STATUSES)) throw new HttpError(400, "Choose a valid product status.", "INVALID_STATUS");
  const imageUrl = optionalWebUrl(body.imageUrl, "Image URL");
  const currency = cleanText(body.currency ?? await systemCurrency(), "Currency", { min: 3, max: 3 }).toUpperCase();
  if (!/^[A-Z]{3}$/.test(currency)) throw new HttpError(400, "Use a three-letter currency code.", "INVALID_CURRENCY");
  const id = crypto.randomUUID();
  const requestedSku = cleanText(body.sku, "SKU", { max: 48, required: false }).toUpperCase();
  const sku = requestedSku || `NN-${id.slice(0, 8).toUpperCase()}`;
  if (!/^[A-Z0-9][A-Z0-9._-]{1,47}$/.test(sku)) {
    throw new HttpError(400, "SKU may contain letters, numbers, dots, hyphens, and underscores.", "INVALID_SKU");
  }
  const duplicateSku = await getD1().prepare(
    "SELECT product_id AS productId FROM inventory WHERE store_id = ? AND UPPER(sku) = ? LIMIT 1",
  ).bind(storeId, sku).first();
  if (duplicateSku) throw new HttpError(409, "That SKU is already used by this shop.", "SKU_EXISTS");
  const now = Math.floor(Date.now() / 1000);
  const db = getD1();
  await db.batch([
    db.prepare(
      `INSERT INTO products
       (id, store_id, name, slug, description, price, currency, image_url, status, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    ).bind(id, storeId, name, `${slugify(name)}-${id.slice(0, 6)}`, description, price, currency, imageUrl, status, now, now),
    db.prepare(
      `INSERT INTO inventory
       (product_id, store_id, sku, quantity, reserved_quantity, low_stock_threshold, updated_at)
       VALUES (?, ?, ?, ?, 0, ?, ?)`,
    ).bind(id, storeId, sku, quantity, lowStockThreshold, now),
  ]);
  await writeAudit(request, session.user.id, "product.admin_created", "product", id, { storeId, sku, quantity });
  return noStoreJson({ ok: true, id }, { status: 201 });
}

export async function POST(request: Request) {
  try {
    const body = await readMutationBody(request);
    const action = normalizeAction(body.action);
    if (action === "create_product" || action === "product_create") return createProduct(request, body);
    if (action === "broadcast_notification" || action === "notification_broadcast") return createBroadcast(request, body);
    if (action === "create_banner" || action === "banner_create") return createBanner(request, body);
    if (action === "create_coupon" || action === "coupon_create") return createCoupon(request, body);
    throw new HttpError(400, "Unsupported workspace action.", "INVALID_ACTION");
  } catch (error) {
    return apiError(error);
  }
}

async function updateProduct(request: Request, body: Record<string, unknown>) {
  const session = await requireApiPermission(request, "products.manage_all", { csrf: true });
  const id = cleanText(body.productId ?? body.id, "Product", { max: 80 });
  const sets: string[] = [];
  const values: BindValue[] = [];
  if (hasOwn(body, "name")) {
    sets.push("name = ?");
    values.push(cleanText(body.name, "Name", { min: 2, max: 160 }));
  }
  if (hasOwn(body, "description")) {
    sets.push("description = ?");
    values.push(cleanText(body.description, "Description", { max: 4_000, required: false }));
  }
  if (hasOwn(body, "price")) {
    sets.push("price = ?");
    values.push(numberInput(body.price, "Price", { min: 0, max: 100_000_000, required: false }));
  }
  if (hasOwn(body, "imageUrl")) {
    sets.push("image_url = ?");
    values.push(optionalWebUrl(body.imageUrl, "Image URL"));
  }
  if (hasOwn(body, "status")) {
    if (!isOneOf(body.status, PRODUCT_STATUSES)) throw new HttpError(400, "Choose a valid product status.", "INVALID_STATUS");
    sets.push("status = ?");
    values.push(body.status);
  }
  if (sets.length === 0) throw new HttpError(400, "No product changes were provided.", "NO_CHANGES");
  const existing = await getD1().prepare("SELECT id, store_id AS storeId FROM products WHERE id = ? LIMIT 1").bind(id).first<{ id: string; storeId: string }>();
  if (!existing) throw new HttpError(404, "Product not found.", "PRODUCT_NOT_FOUND");
  const now = Math.floor(Date.now() / 1000);
  sets.push("updated_at = ?");
  values.push(now, id);
  await getD1().prepare(`UPDATE products SET ${sets.join(", ")} WHERE id = ?`).bind(...values).run();
  await writeAudit(request, session.user.id, "product.admin_updated", "product", id, { fields: sets.map((entry) => entry.split(" =")[0]), storeId: existing.storeId });
  return noStoreJson({ ok: true });
}

async function bulkUpdateProducts(request: Request, body: Record<string, unknown>) {
  const session = await requireApiPermission(request, "products.manage_all", { csrf: true });
  const ids = cleanIdList(body.productIds, "Product");
  const placeholders = ids.map(() => "?").join(",");
  const sets: string[] = [];
  const values: BindValue[] = [];
  if (hasOwn(body, "status")) {
    if (!isOneOf(body.status, PRODUCT_STATUSES)) throw new HttpError(400, "Choose a valid product status.", "INVALID_STATUS");
    sets.push("status = ?");
    values.push(body.status);
  }
  if (hasOwn(body, "price")) {
    sets.push("price = ?");
    values.push(numberInput(body.price, "Price", { min: 0, max: 100_000_000, required: false }));
  }
  if (!sets.length) throw new HttpError(400, "No product changes were provided.", "NO_CHANGES");
  const found = await getD1().prepare(`SELECT COUNT(*) AS total FROM products WHERE id IN (${placeholders})`).bind(...ids).first<{ total: number }>();
  if (Number(found?.total ?? 0) !== ids.length) throw new HttpError(404, "One or more products no longer exist.", "PRODUCT_NOT_FOUND");
  const now = Math.floor(Date.now() / 1000);
  sets.push("updated_at = ?");
  values.push(now, ...ids);
  await getD1().prepare(`UPDATE products SET ${sets.join(", ")} WHERE id IN (${placeholders})`).bind(...values).run();
  await writeAudit(request, session.user.id, "product.bulk_updated", "product", ids[0], { productIds: ids, count: ids.length, status: body.status, price: body.price });
  return noStoreJson({ ok: true, count: ids.length });
}

async function updateOrder(request: Request, body: Record<string, unknown>) {
  const session = await requireApiPermission(request, "orders.manage_all", { csrf: true });
  const id = cleanText(body.orderId ?? body.id, "Order", { max: 80 });
  const status = body.status;
  if (!isOneOf(status, ORDER_STATUSES)) throw new HttpError(400, "Choose a valid order status.", "INVALID_STATUS");
  const note = optionalText(body.note, "Note", 500);
  const db = getD1();
  const order = await db.prepare("SELECT id, user_id AS userId, store_id AS storeId, coupon_id AS couponId, order_number AS orderNumber, status, fulfillment_type AS fulfillmentType FROM orders WHERE id = ? LIMIT 1")
    .bind(id).first<{ id: string; userId: string; storeId: string; couponId: string | null; orderNumber: string; status: string; fulfillmentType: string }>();
  if (!order) throw new HttpError(404, "Order not found.", "ORDER_NOT_FOUND");
  if (status === order.status) return noStoreJson({ ok: true, unchanged: true });
  if (!ORDER_TRANSITIONS[order.status]?.includes(status)) {
    throw new HttpError(409, `Order cannot move from ${order.status} to ${status}.`, "INVALID_ORDER_TRANSITION");
  }
  if (status === "out_for_delivery" && order.fulfillmentType !== "delivery") {
    throw new HttpError(409, "Pickup orders cannot be marked out for delivery.", "INVALID_FULFILLMENT_STATUS");
  }
  const now = Math.floor(Date.now() / 1000);
  const historyId = crypto.randomUUID();
  const statements: D1PreparedStatement[] = [
    db.prepare(
      "UPDATE orders SET status = ?, cancelled_at = CASE WHEN ? IN ('cancelled', 'rejected') THEN ? ELSE cancelled_at END, updated_at = ? WHERE id = ? AND status = ?",
    ).bind(status, status, now, now, id, order.status),
    db.prepare(
      `INSERT INTO order_status_history (id, order_id, actor_id, status, note, created_at)
       SELECT ?, ?, ?, ?, ?, ? WHERE changes() = 1`,
    ).bind(historyId, id, session.user.id, status, note, now),
    db.prepare(
      `INSERT INTO notifications (id, user_id, audience, type, title, message, link, created_at)
       SELECT ?, ?, 'user', 'order', ?, ?, ?, ?
       WHERE EXISTS (SELECT 1 FROM order_status_history WHERE id = ?)`,
    ).bind(crypto.randomUUID(), order.userId, "Order updated", `Order ${order.orderNumber} is now ${status.replaceAll("_", " ")}.`, `/account?tab=orders`, now, historyId),
  ];
  if (status === "cancelled" || status === "rejected") {
    const items = await db.prepare("SELECT product_id AS productId, quantity FROM order_items WHERE order_id = ? AND product_id IS NOT NULL")
      .bind(id).all<{ productId: string; quantity: number }>();
    for (const item of items.results ?? []) {
      statements.push(
        db.prepare(
          `UPDATE inventory SET quantity = quantity + ?, updated_at = ?
           WHERE product_id = ? AND store_id = ?
             AND EXISTS (SELECT 1 FROM order_status_history WHERE id = ?)`,
        ).bind(item.quantity, now, item.productId, order.storeId, historyId),
        db.prepare(
          `INSERT INTO inventory_movements (id, product_id, store_id, actor_id, quantity_change, reason, reference_id, created_at)
           SELECT ?, ?, ?, ?, ?, ?, ?, ?
           WHERE EXISTS (SELECT 1 FROM order_status_history WHERE id = ?)`,
        ).bind(crypto.randomUUID(), item.productId, order.storeId, session.user.id, item.quantity, `Order ${status}`, id, now, historyId),
      );
    }
    if (order.couponId) {
      statements.push(
        db.prepare(
          `UPDATE coupons SET used_count = MAX(used_count - 1, 0), updated_at = ?
           WHERE id = ? AND EXISTS (SELECT 1 FROM order_status_history WHERE id = ?)`,
        ).bind(now, order.couponId, historyId),
        db.prepare(
          `DELETE FROM coupon_redemptions WHERE coupon_id = ? AND order_id = ?
           AND EXISTS (SELECT 1 FROM order_status_history WHERE id = ?)`,
        ).bind(order.couponId, id, historyId),
      );
    }
  }
  const results = await db.batch(statements);
  if (Number(results[0]?.meta.changes ?? 0) !== 1) {
    throw new HttpError(409, "Order changed while this update was being applied. Refresh and try again.", "STALE_ORDER");
  }
  await writeAudit(request, session.user.id, "order.admin_status_updated", "order", id, { from: order.status, to: status, note });
  return noStoreJson({ ok: true });
}

async function updateBanner(request: Request, body: Record<string, unknown>) {
  const session = await requireApiPermission(request, "banners.manage", { csrf: true });
  const id = cleanText(body.bannerId ?? body.id, "Banner", { max: 80 });
  const existing = await getD1().prepare("SELECT starts_at AS startsAt, ends_at AS endsAt FROM banners WHERE id = ? LIMIT 1")
    .bind(id).first<{ startsAt: number | null; endsAt: number | null }>();
  if (!existing) throw new HttpError(404, "Banner not found.", "BANNER_NOT_FOUND");
  const input = bannerInput(body, true);
  if (Object.keys(input).length === 0) throw new HttpError(400, "No banner changes were provided.", "NO_CHANGES");
  assertDateRange(
    hasOwn(input, "starts_at") ? (input.starts_at as number | null) : existing.startsAt,
    hasOwn(input, "ends_at") ? (input.ends_at as number | null) : existing.endsAt,
  );
  const sets = Object.keys(input).map((key) => `${key} = ?`);
  const values = Object.values(input);
  const now = Math.floor(Date.now() / 1000);
  sets.push("updated_at = ?");
  values.push(now, id);
  await getD1().prepare(`UPDATE banners SET ${sets.join(", ")} WHERE id = ?`).bind(...values).run();
  await writeAudit(request, session.user.id, "banner.updated", "banner", id, { fields: Object.keys(input) });
  return noStoreJson({ ok: true });
}

async function updateCoupon(request: Request, body: Record<string, unknown>) {
  const session = await requireApiPermission(request, "coupons.manage_all", { csrf: true });
  const id = cleanText(body.couponId ?? body.id, "Coupon", { max: 80 });
  const current = await getD1().prepare(
    `SELECT store_id AS storeId, code, title, description, discount_type AS discountType,
      discount_value AS discountValue, minimum_order AS minimumOrder,
      maximum_discount AS maximumDiscount, usage_limit AS usageLimit, used_count AS usedCount,
      starts_at AS startsAt, ends_at AS endsAt, status FROM coupons WHERE id = ? LIMIT 1`,
  ).bind(id).first<{
    storeId: string | null; code: string; title: string; description: string; discountType: string;
    discountValue: number; minimumOrder: number; maximumDiscount: number | null; usageLimit: number | null;
    usedCount: number; startsAt: number | null; endsAt: number | null; status: string;
  }>();
  if (!current) throw new HttpError(404, "Coupon not found.", "COUPON_NOT_FOUND");
  const merged = couponInput({
    storeId: hasOwn(body, "storeId") ? body.storeId : current.storeId,
    code: hasOwn(body, "code") ? body.code : current.code,
    title: hasOwn(body, "title") ? body.title : current.title,
    description: hasOwn(body, "description") ? body.description : current.description,
    discountType: hasOwn(body, "discountType") ? body.discountType : current.discountType,
    discountValue: hasOwn(body, "discountValue") ? body.discountValue : current.discountValue,
    minimumOrder: hasOwn(body, "minimumOrder") ? body.minimumOrder : current.minimumOrder,
    maximumDiscount: hasOwn(body, "maximumDiscount") ? body.maximumDiscount : current.maximumDiscount,
    usageLimit: hasOwn(body, "usageLimit") ? body.usageLimit : current.usageLimit,
    startsAt: hasOwn(body, "startsAt") ? body.startsAt : current.startsAt,
    endsAt: hasOwn(body, "endsAt") ? body.endsAt : current.endsAt,
    status: hasOwn(body, "status") ? body.status : current.status,
  });
  if (merged.usageLimit !== null && merged.usageLimit < current.usedCount) {
    throw new HttpError(409, "Usage limit cannot be lower than the number already redeemed.", "USAGE_LIMIT_TOO_LOW");
  }
  await assertStore(merged.storeId);
  if (merged.code !== current.code) {
    const duplicate = await getD1().prepare("SELECT id FROM coupons WHERE code = ? AND id <> ? LIMIT 1").bind(merged.code, id).first();
    if (duplicate) throw new HttpError(409, "That coupon code already exists.", "COUPON_CODE_EXISTS");
  }
  const now = Math.floor(Date.now() / 1000);
  await getD1().prepare(
    `UPDATE coupons SET store_id = ?, code = ?, title = ?, description = ?, discount_type = ?,
      discount_value = ?, minimum_order = ?, maximum_discount = ?, usage_limit = ?,
      starts_at = ?, ends_at = ?, status = ?, updated_at = ? WHERE id = ?`,
  ).bind(
    merged.storeId, merged.code, merged.title, merged.description, merged.discountType,
    merged.discountValue, merged.minimumOrder, merged.maximumDiscount, merged.usageLimit,
    merged.startsAt, merged.endsAt, merged.status, now, id,
  ).run();
  await writeAudit(request, session.user.id, "coupon.updated", "coupon", id, { code: merged.code, storeId: merged.storeId, status: merged.status });
  return noStoreJson({ ok: true });
}

async function updateSupport(request: Request, body: Record<string, unknown>) {
  const session = await requireApiPermission(request, "support.manage", { csrf: true });
  const id = cleanText(body.ticketId ?? body.id, "Support ticket", { max: 80 });
  const existing = await getD1().prepare("SELECT id, user_id AS userId, status, priority, assigned_to AS assignedTo, resolution FROM support_tickets WHERE id = ? LIMIT 1")
    .bind(id).first<{ id: string; userId: string; status: string; priority: string; assignedTo: string | null; resolution: string | null }>();
  if (!existing) throw new HttpError(404, "Support ticket not found.", "TICKET_NOT_FOUND");
  const status = hasOwn(body, "status") ? body.status : existing.status;
  if (!isOneOf(status, TICKET_STATUSES)) throw new HttpError(400, "Choose a valid ticket status.", "INVALID_STATUS");
  const priority = hasOwn(body, "priority") ? body.priority : existing.priority;
  if (!isOneOf(priority, TICKET_PRIORITIES)) throw new HttpError(400, "Choose a valid ticket priority.", "INVALID_PRIORITY");
  const resolution = hasOwn(body, "resolution") ? optionalText(body.resolution, "Resolution", 4_000) : existing.resolution;
  if ((status === "resolved" || status === "closed") && (!resolution || resolution.length < 3)) {
    throw new HttpError(400, "Add a resolution before resolving the ticket.", "RESOLUTION_REQUIRED");
  }
  let assignedTo = hasOwn(body, "assignedTo") ? optionalId(body.assignedTo, "Assignee") : existing.assignedTo;
  if ((status === "in_progress" || status === "resolved") && !assignedTo) assignedTo = session.user.id;
  if (assignedTo) {
    const assignee = await getD1().prepare("SELECT id FROM users WHERE id = ? AND role = 'admin' AND status = 'active' LIMIT 1").bind(assignedTo).first();
    if (!assignee) throw new HttpError(400, "Choose an active administrator.", "INVALID_ASSIGNEE");
  }
  const now = Math.floor(Date.now() / 1000);
  await getD1().batch([
    getD1().prepare(
      "UPDATE support_tickets SET status = ?, priority = ?, resolution = ?, assigned_to = ?, updated_at = ? WHERE id = ?",
    ).bind(status, priority, resolution, assignedTo, now, id),
    getD1().prepare(
      "INSERT INTO notifications (id, user_id, audience, type, title, message, link, created_at) VALUES (?, ?, 'user', 'info', ?, ?, ?, ?)",
    ).bind(crypto.randomUUID(), existing.userId, "Support ticket updated", `Your ticket is now ${status.replaceAll("_", " ")}.`, "/account?tab=support", now),
  ]);
  await writeAudit(request, session.user.id, "support.updated", "support_ticket", id, { from: existing.status, status, priority, assignedTo });
  return noStoreJson({ ok: true });
}

function settingValue(key: SettingKey, raw: unknown): string {
  const type = SETTING_DEFINITIONS[key].type;
  if (type === "boolean") {
    if (raw === true || raw === "true" || raw === 1) return "true";
    if (raw === false || raw === "false" || raw === 0) return "false";
    throw new HttpError(400, "Setting must be true or false.", "INVALID_SETTING_VALUE");
  }
  if (type === "number") {
    return String(numberInput(raw, "Setting value", { min: 0, max: 100 }));
  }
  if (type === "email") {
    const email = cleanText(raw, "Email", { min: 3, max: 254 }).toLowerCase();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) throw new HttpError(400, "Enter a valid support email.", "INVALID_SETTING_VALUE");
    return email;
  }
  if (type === "currency") {
    const currency = cleanText(raw, "Currency", { min: 3, max: 3 }).toUpperCase();
    if (!/^[A-Z]{3}$/.test(currency)) throw new HttpError(400, "Use a three-letter currency code.", "INVALID_SETTING_VALUE");
    return currency;
  }
  if (type === "url") return raw === "" || raw === null || raw === undefined ? "" : (urlInput(raw, "URL", true) as string);
  return cleanText(raw, "Setting value", { max: 200, required: false });
}

async function updateSetting(request: Request, body: Record<string, unknown>) {
  const session = await requireApiPermission(request, "settings.manage", { csrf: true });
  const key = cleanText(body.key, "Setting", { max: 80 }) as SettingKey;
  if (!Object.prototype.hasOwnProperty.call(SETTING_DEFINITIONS, key)) {
    throw new HttpError(400, "That platform setting cannot be changed here.", "INVALID_SETTING");
  }
  const value = settingValue(key, body.value);
  const now = Math.floor(Date.now() / 1000);
  await getD1().prepare(
    "INSERT INTO system_settings (key, value, updated_at) VALUES (?, ?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = excluded.updated_at",
  ).bind(key, value, now).run();
  await writeAudit(request, session.user.id, "setting.updated", "system_setting", key, { value });
  return noStoreJson({ ok: true, key, value });
}

export async function PATCH(request: Request) {
  try {
    const body = await readMutationBody(request);
    const action = normalizeAction(body.action);
    if (action === "bulk_update_products") return bulkUpdateProducts(request, body);
    if (action === "update_product" || action === "product_update") return updateProduct(request, body);
    if (action === "update_order" || action === "order_update") return updateOrder(request, body);
    if (action === "update_banner" || action === "banner_update") return updateBanner(request, body);
    if (action === "update_coupon" || action === "coupon_update") return updateCoupon(request, body);
    if (action === "update_support" || action === "support_update") return updateSupport(request, body);
    if (action === "update_setting" || action === "setting_update") return updateSetting(request, body);
    throw new HttpError(400, "Unsupported workspace action.", "INVALID_ACTION");
  } catch (error) {
    return apiError(error);
  }
}

async function deleteBanner(request: Request, body: Record<string, unknown>) {
  const session = await requireApiPermission(request, "banners.manage", { csrf: true });
  const id = cleanText(body.bannerId ?? body.id, "Banner", { max: 80 });
  const existing = await getD1().prepare("SELECT title FROM banners WHERE id = ? LIMIT 1").bind(id).first<{ title: string }>();
  if (!existing) throw new HttpError(404, "Banner not found.", "BANNER_NOT_FOUND");
  await getD1().prepare("DELETE FROM banners WHERE id = ?").bind(id).run();
  await writeAudit(request, session.user.id, "banner.deleted", "banner", id, { title: existing.title });
  return noStoreJson({ ok: true });
}

async function bulkDeleteBanners(request: Request, body: Record<string, unknown>) {
  const session = await requireApiPermission(request, "banners.manage", { csrf: true });
  const ids = cleanIdList(body.bannerIds, "Advertisement");
  const placeholders = ids.map(() => "?").join(",");
  const found = await getD1().prepare(`SELECT id, title FROM banners WHERE id IN (${placeholders})`).bind(...ids).all<{ id: string; title: string }>();
  if ((found.results ?? []).length !== ids.length) throw new HttpError(404, "One or more advertisements were not found.", "BANNER_NOT_FOUND");
  await getD1().prepare(`DELETE FROM banners WHERE id IN (${placeholders})`).bind(...ids).run();
  await writeAudit(request, session.user.id, "banner.bulk_deleted", "banner", ids[0], { bannerIds: ids, titles: (found.results ?? []).map((item) => item.title), count: ids.length });
  return noStoreJson({ ok: true, count: ids.length });
}

async function deleteCoupon(request: Request, body: Record<string, unknown>) {
  const session = await requireApiPermission(request, "coupons.manage_all", { csrf: true });
  const id = cleanText(body.couponId ?? body.id, "Coupon", { max: 80 });
  const existing = await getD1().prepare(
    "SELECT c.code, c.used_count AS usedCount, (SELECT COUNT(*) FROM orders o WHERE o.coupon_id = c.id) AS orderCount FROM coupons c WHERE c.id = ? LIMIT 1",
  ).bind(id).first<{ code: string; usedCount: number; orderCount: number }>();
  if (!existing) throw new HttpError(404, "Coupon not found.", "COUPON_NOT_FOUND");
  if (existing.usedCount > 0 || existing.orderCount > 0) {
    throw new HttpError(409, "Used coupons must be disabled instead of deleted.", "COUPON_IN_USE");
  }
  await getD1().prepare("DELETE FROM coupons WHERE id = ?").bind(id).run();
  await writeAudit(request, session.user.id, "coupon.deleted", "coupon", id, { code: existing.code });
  return noStoreJson({ ok: true });
}

async function bulkDeleteCoupons(request: Request, body: Record<string, unknown>) {
  const session = await requireApiPermission(request, "coupons.manage_all", { csrf: true });
  const ids = cleanIdList(body.couponIds, "Promotion");
  const placeholders = ids.map(() => "?").join(",");
  const found = await getD1().prepare(`SELECT c.id, c.code, c.used_count AS usedCount,
    (SELECT COUNT(*) FROM orders o WHERE o.coupon_id = c.id) AS orderCount
    FROM coupons c WHERE c.id IN (${placeholders})`).bind(...ids).all<{ id: string; code: string; usedCount: number; orderCount: number }>();
  const coupons = found.results ?? [];
  if (coupons.length !== ids.length) throw new HttpError(404, "One or more promotions were not found.", "COUPON_NOT_FOUND");
  if (coupons.some((coupon) => Number(coupon.usedCount) > 0 || Number(coupon.orderCount) > 0)) throw new HttpError(409, "Used promotions must be disabled instead of deleted.", "COUPON_IN_USE");
  await getD1().prepare(`DELETE FROM coupons WHERE id IN (${placeholders})`).bind(...ids).run();
  await writeAudit(request, session.user.id, "coupon.bulk_deleted", "coupon", ids[0], { couponIds: ids, codes: coupons.map((coupon) => coupon.code), count: ids.length });
  return noStoreJson({ ok: true, count: ids.length });
}

async function deleteProduct(request: Request, body: Record<string, unknown>) {
  const session = await requireApiPermission(request, "products.manage_all", { csrf: true });
  const id = cleanText(body.productId ?? body.id, "Product", { max: 80 });
  const existing = await getD1().prepare(
    `SELECT p.name, p.store_id AS storeId, p.image_key AS imageKey,
      (SELECT COUNT(*) FROM order_items oi WHERE oi.product_id = p.id) AS orderCount
     FROM products p WHERE p.id = ? LIMIT 1`,
  ).bind(id).first<{ name: string; storeId: string; imageKey: string | null; orderCount: number }>();
  if (!existing) throw new HttpError(404, "Product not found.", "PRODUCT_NOT_FOUND");
  if (Number(existing.orderCount) > 0) {
    throw new HttpError(409, "Products with order history must be archived instead of deleted.", "PRODUCT_HAS_ORDERS");
  }
  const catalogMedia = await getD1().prepare(
    "SELECT object_key AS objectKey, thumbnail_key AS thumbnailKey FROM media_assets WHERE product_id = ?",
  ).bind(id).all<{ objectKey: string; thumbnailKey: string | null }>();
  const statements = [getD1().prepare("DELETE FROM products WHERE id = ?").bind(id)];
  if (existing.imageKey) statements.push(getD1().prepare("DELETE FROM store_images WHERE object_key = ?").bind(existing.imageKey));
  await getD1().batch(statements);
  const objectKeys = [...new Set([existing.imageKey, ...(catalogMedia.results ?? []).flatMap((asset) => [asset.objectKey, asset.thumbnailKey])].filter((key): key is string => Boolean(key)))];
  if (objectKeys.length) {
    try { await Promise.all(objectKeys.map((key) => getMediaBucket().delete(key))); }
    catch (cleanupError) { console.error("Could not remove deleted product image", cleanupError); }
  }
  await writeAudit(request, session.user.id, "product.admin_deleted", "product", id, { name: existing.name, storeId: existing.storeId });
  return noStoreJson({ ok: true });
}

async function bulkDeleteProducts(request: Request, body: Record<string, unknown>) {
  const session = await requireApiPermission(request, "products.manage_all", { csrf: true });
  const ids = cleanIdList(body.productIds, "Product");
  const placeholders = ids.map(() => "?").join(",");
  const products = await getD1().prepare(`SELECT p.id, p.name, p.image_key AS imageKey,
    (SELECT COUNT(*) FROM order_items oi WHERE oi.product_id = p.id) AS orderCount
    FROM products p WHERE p.id IN (${placeholders})`).bind(...ids).all<{ id: string; name: string; imageKey: string | null; orderCount: number }>();
  const found = products.results ?? [];
  if (found.length !== ids.length) throw new HttpError(404, "One or more products were not found.", "PRODUCT_NOT_FOUND");
  if (found.some((product) => Number(product.orderCount) > 0)) throw new HttpError(409, "Products with order history must be archived instead of deleted.", "PRODUCT_HAS_ORDERS");
  const media = await getD1().prepare(
    `SELECT object_key AS objectKey, thumbnail_key AS thumbnailKey FROM media_assets WHERE product_id IN (${placeholders})`,
  ).bind(...ids).all<{ objectKey: string; thumbnailKey: string | null }>();
  const imageKeys = [...new Set([
    ...found.flatMap((product) => product.imageKey ? [product.imageKey] : []),
    ...(media.results ?? []).flatMap((asset) => [asset.objectKey, asset.thumbnailKey]).filter((key): key is string => Boolean(key)),
  ])];
  const statements: D1PreparedStatement[] = [getD1().prepare(`DELETE FROM products WHERE id IN (${placeholders})`).bind(...ids)];
  if (imageKeys.length) {
    const imagePlaceholders = imageKeys.map(() => "?").join(",");
    statements.push(getD1().prepare(`DELETE FROM store_images WHERE object_key IN (${imagePlaceholders})`).bind(...imageKeys));
  }
  await getD1().batch(statements);
  if (imageKeys.length) {
    try { await Promise.all(imageKeys.map((key) => getMediaBucket().delete(key))); }
    catch (cleanupError) { console.error("Could not remove one or more deleted product images", cleanupError); }
  }
  await writeAudit(request, session.user.id, "product.bulk_deleted", "product", ids[0], { productIds: ids, names: found.map((product) => product.name) });
  return noStoreJson({ ok: true, count: ids.length });
}

export async function DELETE(request: Request) {
  try {
    const body = await readMutationBody(request);
    const action = normalizeAction(body.action);
    if (action === "bulk_delete_products") return bulkDeleteProducts(request, body);
    if (action === "bulk_delete_banners") return bulkDeleteBanners(request, body);
    if (action === "bulk_delete_coupons") return bulkDeleteCoupons(request, body);
    if (action === "delete_product" || action === "product_delete") return deleteProduct(request, body);
    if (action === "delete_banner" || action === "banner_delete") return deleteBanner(request, body);
    if (action === "delete_coupon" || action === "coupon_delete") return deleteCoupon(request, body);
    throw new HttpError(400, "Unsupported workspace action.", "INVALID_ACTION");
  } catch (error) {
    return apiError(error);
  }
}
