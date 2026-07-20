import { getD1 } from "@/db/runtime";
import { requireApiPermission } from "@/lib/auth";
import { requireOwnedStore, writeAudit } from "@/lib/ownership";
import type { Permission } from "@/lib/rbac";
import { apiError, HttpError, noStoreJson } from "@/lib/security";
import {
  booleanInput,
  cleanText,
  d1SearchText,
  numberInput,
  safeJson,
} from "@/lib/validation";

type OwnerView =
  | "inventory"
  | "orders"
  | "customers"
  | "sales"
  | "coupons"
  | "notifications"
  | "settings"
  | "support";

type OwnerAction =
  | "adjust_inventory"
  | "update_order_status"
  | "create_coupon"
  | "update_coupon"
  | "delete_coupon"
  | "update_settings"
  | "mark_notification_read"
  | "create_support_ticket";

type OrderStatus =
  | "pending"
  | "confirmed"
  | "preparing"
  | "ready"
  | "out_for_delivery"
  | "delivered"
  | "cancelled"
  | "rejected";

const VIEW_PERMISSIONS: Record<OwnerView, Permission> = {
  inventory: "inventory.manage_own",
  orders: "orders.manage_own",
  customers: "customers.view_own",
  sales: "analytics.view_own",
  coupons: "coupons.manage_own",
  notifications: "notifications.view_own",
  settings: "settings.manage_own",
  support: "support.create",
};

const ACTION_PERMISSIONS: Record<OwnerAction, Permission> = {
  adjust_inventory: "inventory.manage_own",
  update_order_status: "orders.manage_own",
  create_coupon: "coupons.manage_own",
  update_coupon: "coupons.manage_own",
  delete_coupon: "coupons.manage_own",
  update_settings: "settings.manage_own",
  mark_notification_read: "notifications.view_own",
  create_support_ticket: "support.create",
};

const ORDER_TRANSITIONS: Record<OrderStatus, readonly OrderStatus[]> = {
  pending: ["confirmed", "rejected"],
  confirmed: ["preparing", "rejected"],
  preparing: ["ready", "rejected"],
  ready: ["out_for_delivery", "delivered", "rejected"],
  out_for_delivery: ["delivered"],
  delivered: [],
  cancelled: [],
  rejected: [],
};

function viewInput(value: string | null): OwnerView {
  if (
    value === "inventory" ||
    value === "orders" ||
    value === "customers" ||
    value === "sales" ||
    value === "coupons" ||
    value === "notifications" ||
    value === "settings" ||
    value === "support"
  ) {
    return value;
  }
  throw new HttpError(400, "Choose a valid owner workspace view.", "INVALID_VIEW");
}

function actionInput(value: unknown, allowed: readonly OwnerAction[]): OwnerAction {
  if (typeof value === "string" && allowed.includes(value as OwnerAction)) {
    return value as OwnerAction;
  }
  throw new HttpError(400, "Choose a valid owner workspace action.", "INVALID_ACTION");
}

function pageInput(url: URL) {
  const page = Math.max(1, Number(url.searchParams.get("page")) || 1);
  const limit = Math.min(50, Math.max(1, Number(url.searchParams.get("limit")) || 20));
  return { page, limit, offset: (page - 1) * limit };
}

function escapeLike(value: string): string {
  return value.replace(/[\\%_]/g, "\\$&");
}

function optionalId(value: unknown, label: string): string | null {
  return cleanText(value, label, { max: 80, required: false }) || null;
}

function parseJson(value: unknown, fallback: unknown) {
  if (typeof value !== "string") return value ?? fallback;
  try {
    return JSON.parse(value) as unknown;
  } catch {
    return fallback;
  }
}

function couponStatusInput(value: unknown): "active" | "draft" | "expired" | "disabled" {
  if (value === "active" || value === "draft" || value === "expired" || value === "disabled") {
    return value;
  }
  throw new HttpError(400, "Choose a valid coupon status.", "INVALID_COUPON_STATUS");
}

function supportStatusInput(value: string | null): "open" | "in_progress" | "resolved" | "closed" | null {
  if (!value) return null;
  if (value === "open" || value === "in_progress" || value === "resolved" || value === "closed") {
    return value;
  }
  throw new HttpError(400, "Choose a valid ticket status.", "INVALID_TICKET_STATUS");
}

function orderStatusInput(value: unknown): OrderStatus {
  if (
    value === "pending" ||
    value === "confirmed" ||
    value === "preparing" ||
    value === "ready" ||
    value === "out_for_delivery" ||
    value === "delivered" ||
    value === "cancelled" ||
    value === "rejected"
  ) {
    return value;
  }
  throw new HttpError(400, "Choose a valid order status.", "INVALID_ORDER_STATUS");
}

function couponPayload(body: Record<string, unknown>) {
  const code = cleanText(body.code, "Coupon code", { min: 3, max: 32 }).toUpperCase();
  if (!/^[A-Z0-9][A-Z0-9_-]{2,31}$/.test(code)) {
    throw new HttpError(
      400,
      "Coupon code may contain only letters, numbers, hyphens and underscores.",
      "INVALID_COUPON_CODE",
    );
  }
  const title = cleanText(body.title, "Coupon title", { min: 2, max: 120 });
  const description = cleanText(body.description, "Description", {
    max: 1200,
    required: false,
  });
  const discountType = body.discountType;
  if (discountType !== "percentage" && discountType !== "fixed") {
    throw new HttpError(400, "Choose a valid discount type.", "INVALID_DISCOUNT_TYPE");
  }
  const discountValue = numberInput(body.discountValue, "Discount value", {
    min: 0.01,
    max: discountType === "percentage" ? 100 : 10_000_000,
  }) as number;
  const minimumOrder = numberInput(body.minimumOrder, "Minimum order", {
    min: 0,
    max: 10_000_000,
    required: false,
  }) ?? 0;
  const maximumDiscount = numberInput(body.maximumDiscount, "Maximum discount", {
    min: 0.01,
    max: 10_000_000,
    required: false,
  });
  const usageLimit = numberInput(body.usageLimit, "Usage limit", {
    min: 1,
    max: 10_000_000,
    integer: true,
    required: false,
  });
  const startsAt = numberInput(body.startsAt, "Start date", {
    min: 0,
    integer: true,
    required: false,
  });
  const endsAt = numberInput(body.endsAt, "End date", {
    min: 0,
    integer: true,
    required: false,
  });
  if (startsAt !== null && endsAt !== null && endsAt <= startsAt) {
    throw new HttpError(400, "Coupon end date must be after its start date.", "INVALID_COUPON_DATES");
  }
  return {
    code,
    title,
    description,
    discountType,
    discountValue,
    minimumOrder,
    maximumDiscount,
    usageLimit,
    startsAt,
    endsAt,
    status: couponStatusInput(body.status ?? "draft"),
  };
}

async function assertCouponCodeAvailable(code: string, couponId?: string) {
  const duplicate = await getD1()
    .prepare("SELECT id FROM coupons WHERE code = ? AND (? IS NULL OR id <> ?) LIMIT 1")
    .bind(code, couponId ?? null, couponId ?? null)
    .first();
  if (duplicate) {
    throw new HttpError(409, "That coupon code is already in use.", "COUPON_CODE_TAKEN");
  }
}

async function inventoryView(storeId: string, url: URL) {
  const db = getD1();
  const { page, limit, offset } = pageInput(url);
  const query = cleanText(url.searchParams.get("q"), "Search", {
    max: 100,
    required: false,
  });
  const clauses = ["p.store_id = ?"];
  const bindings: unknown[] = [storeId];
  if (query) {
    const like = `%${d1SearchText(escapeLike(query))}%`;
    clauses.push("(p.name LIKE ? ESCAPE '\\' OR i.sku LIKE ? ESCAPE '\\')");
    bindings.push(like, like);
  }
  const where = clauses.join(" AND ");
  const [items, total, summary] = await Promise.all([
    db
      .prepare(
        `SELECT p.id AS productId, p.name, p.slug, p.price, p.currency, p.image_url AS imageUrl,
          p.status, i.sku, COALESCE(i.quantity, 0) AS quantity,
          COALESCE(i.reserved_quantity, 0) AS reservedQuantity,
          COALESCE(i.quantity, 0) - COALESCE(i.reserved_quantity, 0) AS availableQuantity,
          COALESCE(i.low_stock_threshold, 5) AS lowStockThreshold,
          i.updated_at AS inventoryUpdatedAt
         FROM products p LEFT JOIN inventory i ON i.product_id = p.id
         WHERE ${where} ORDER BY p.updated_at DESC LIMIT ? OFFSET ?`,
      )
      .bind(...bindings, limit, offset)
      .all(),
    db
      .prepare(
        `SELECT COUNT(*) AS total FROM products p LEFT JOIN inventory i ON i.product_id = p.id WHERE ${where}`,
      )
      .bind(...bindings)
      .first<{ total: number }>(),
    db
      .prepare(
        `SELECT COUNT(*) AS productCount,
          COALESCE(SUM(COALESCE(i.quantity, 0)), 0) AS unitsInStock,
          COALESCE(SUM(CASE WHEN COALESCE(i.quantity, 0) - COALESCE(i.reserved_quantity, 0) <= COALESCE(i.low_stock_threshold, 5) THEN 1 ELSE 0 END), 0) AS lowStockCount,
          COALESCE(SUM(CASE WHEN COALESCE(i.quantity, 0) - COALESCE(i.reserved_quantity, 0) <= 0 THEN 1 ELSE 0 END), 0) AS outOfStockCount
         FROM products p LEFT JOIN inventory i ON i.product_id = p.id
         WHERE p.store_id = ? AND p.status <> 'archived'`,
      )
      .bind(storeId)
      .first(),
  ]);
  return {
    items: items.results ?? [],
    summary: summary ?? {},
    pagination: { page, limit, total: total?.total ?? 0 },
  };
}

async function ordersView(storeId: string, url: URL) {
  const db = getD1();
  const { page, limit, offset } = pageInput(url);
  const requestedStatus = url.searchParams.get("status");
  const status = requestedStatus ? orderStatusInput(requestedStatus) : null;
  const clauses = ["o.store_id = ?"];
  const bindings: unknown[] = [storeId];
  if (status) {
    clauses.push("o.status = ?");
    bindings.push(status);
  }
  const where = clauses.join(" AND ");
  const [ordersResult, total, statusCounts] = await Promise.all([
    db
      .prepare(
        `SELECT o.id, o.order_number AS orderNumber, o.status,
          o.fulfillment_type AS fulfillmentType, o.subtotal, o.discount,
          o.delivery_fee AS deliveryFee, o.total, o.currency, o.notes,
          o.address_snapshot AS addressSnapshot, o.placed_at AS placedAt,
          o.cancelled_at AS cancelledAt, o.updated_at AS updatedAt,
          u.id AS customerId, u.name AS customerName, u.email AS customerEmail, u.phone AS customerPhone,
          COALESCE((SELECT json_group_array(json_object(
            'id', oi.id, 'productId', oi.product_id, 'name', oi.product_name,
            'sku', oi.sku, 'unitPrice', oi.unit_price, 'quantity', oi.quantity,
            'lineTotal', oi.line_total
          )) FROM order_items oi WHERE oi.order_id = o.id), '[]') AS items
         FROM orders o JOIN users u ON u.id = o.user_id
         WHERE ${where} ORDER BY o.placed_at DESC LIMIT ? OFFSET ?`,
      )
      .bind(...bindings, limit, offset)
      .all<Record<string, unknown>>(),
    db
      .prepare(`SELECT COUNT(*) AS total FROM orders o WHERE ${where}`)
      .bind(...bindings)
      .first<{ total: number }>(),
    db
      .prepare(
        "SELECT status, COUNT(*) AS total FROM orders WHERE store_id = ? GROUP BY status ORDER BY total DESC",
      )
      .bind(storeId)
      .all(),
  ]);
  const items = (ordersResult.results ?? []).map((order) => ({
    ...order,
    addressSnapshot: parseJson(order.addressSnapshot, {}),
    items: parseJson(order.items, []),
  }));
  return {
    items,
    statusCounts: statusCounts.results ?? [],
    pagination: { page, limit, total: total?.total ?? 0 },
  };
}

async function customersView(storeId: string, url: URL) {
  const db = getD1();
  const { page, limit, offset } = pageInput(url);
  const query = cleanText(url.searchParams.get("q"), "Search", {
    max: 100,
    required: false,
  });
  const clauses = ["o.store_id = ?"];
  const bindings: unknown[] = [storeId];
  if (query) {
    const like = `%${d1SearchText(escapeLike(query))}%`;
    clauses.push("(u.name LIKE ? ESCAPE '\\' OR u.email LIKE ? ESCAPE '\\')");
    bindings.push(like, like);
  }
  const where = clauses.join(" AND ");
  const [items, total] = await Promise.all([
    db
      .prepare(
        `SELECT u.id AS customerId, u.name, u.email, u.phone, u.avatar_url AS avatarUrl,
          COUNT(o.id) AS orderCount,
          COALESCE(SUM(CASE WHEN o.status = 'delivered' THEN o.total ELSE 0 END), 0) AS lifetimeValue,
          MAX(o.placed_at) AS lastOrderAt,
          SUM(CASE WHEN o.status IN ('pending', 'confirmed', 'preparing', 'ready', 'out_for_delivery') THEN 1 ELSE 0 END) AS activeOrderCount
         FROM orders o JOIN users u ON u.id = o.user_id
         WHERE ${where}
         GROUP BY u.id, u.name, u.email, u.phone, u.avatar_url
         ORDER BY lastOrderAt DESC LIMIT ? OFFSET ?`,
      )
      .bind(...bindings, limit, offset)
      .all(),
    db
      .prepare(
        `SELECT COUNT(DISTINCT u.id) AS total FROM orders o JOIN users u ON u.id = o.user_id WHERE ${where}`,
      )
      .bind(...bindings)
      .first<{ total: number }>(),
  ]);
  return {
    items: items.results ?? [],
    pagination: { page, limit, total: total?.total ?? 0 },
  };
}

async function salesView(storeId: string, url: URL) {
  const db = getD1();
  const days = Math.min(365, Math.max(7, Number(url.searchParams.get("days")) || 30));
  const since = Math.floor(Date.now() / 1000) - days * 86_400;
  const [summary, daily, statuses, topProducts] = await Promise.all([
    db
      .prepare(
        `SELECT COUNT(*) AS orderCount,
          COUNT(DISTINCT user_id) AS customerCount,
          COALESCE(SUM(CASE WHEN status = 'delivered' THEN total ELSE 0 END), 0) AS revenue,
          COALESCE(AVG(CASE WHEN status = 'delivered' THEN total END), 0) AS averageOrderValue,
          SUM(CASE WHEN status IN ('pending', 'confirmed', 'preparing', 'ready', 'out_for_delivery') THEN 1 ELSE 0 END) AS activeOrderCount
         FROM orders WHERE store_id = ? AND placed_at >= ?`,
      )
      .bind(storeId, since)
      .first(),
    db
      .prepare(
        `SELECT date(placed_at, 'unixepoch') AS date, COUNT(*) AS orders,
          COALESCE(SUM(CASE WHEN status = 'delivered' THEN total ELSE 0 END), 0) AS revenue
         FROM orders WHERE store_id = ? AND placed_at >= ?
         GROUP BY date(placed_at, 'unixepoch') ORDER BY date ASC`,
      )
      .bind(storeId, since)
      .all(),
    db
      .prepare(
        "SELECT status, COUNT(*) AS total, COALESCE(SUM(total), 0) AS value FROM orders WHERE store_id = ? AND placed_at >= ? GROUP BY status",
      )
      .bind(storeId, since)
      .all(),
    db
      .prepare(
        `SELECT oi.product_id AS productId, oi.product_name AS productName,
          SUM(oi.quantity) AS unitsSold, SUM(oi.line_total) AS revenue
         FROM order_items oi JOIN orders o ON o.id = oi.order_id
         WHERE o.store_id = ? AND o.status = 'delivered' AND o.placed_at >= ?
         GROUP BY oi.product_id, oi.product_name ORDER BY revenue DESC LIMIT 10`,
      )
      .bind(storeId, since)
      .all(),
  ]);
  return {
    range: { days, since },
    summary: summary ?? {},
    daily: daily.results ?? [],
    statuses: statuses.results ?? [],
    topProducts: topProducts.results ?? [],
  };
}

async function couponsView(storeId: string, url: URL) {
  const db = getD1();
  const { page, limit, offset } = pageInput(url);
  const requestedStatus = url.searchParams.get("status");
  const status = requestedStatus ? couponStatusInput(requestedStatus) : null;
  const clause = status ? " AND status = ?" : "";
  const bindings: unknown[] = status ? [storeId, status] : [storeId];
  const [items, total] = await Promise.all([
    db
      .prepare(
        `SELECT id, code, title, description, discount_type AS discountType,
          discount_value AS discountValue, minimum_order AS minimumOrder,
          maximum_discount AS maximumDiscount, usage_limit AS usageLimit,
          used_count AS usedCount, starts_at AS startsAt, ends_at AS endsAt,
          status, created_at AS createdAt, updated_at AS updatedAt
         FROM coupons WHERE store_id = ?${clause}
         ORDER BY created_at DESC LIMIT ? OFFSET ?`,
      )
      .bind(...bindings, limit, offset)
      .all(),
    db
      .prepare(`SELECT COUNT(*) AS total FROM coupons WHERE store_id = ?${clause}`)
      .bind(...bindings)
      .first<{ total: number }>(),
  ]);
  return {
    items: items.results ?? [],
    pagination: { page, limit, total: total?.total ?? 0 },
  };
}

async function notificationsView(userId: string, url: URL) {
  const db = getD1();
  const { page, limit, offset } = pageInput(url);
  const where =
    "(user_id = ? OR (user_id IS NULL AND audience IN ('store_owner', 'all')))";
  const [items, total, unread] = await Promise.all([
    db
      .prepare(
        `SELECT id, audience, type, title, message, link, read_at AS readAt,
          created_at AS createdAt, CASE WHEN user_id = ? THEN 1 ELSE 0 END AS isPersonal
         FROM notifications WHERE ${where}
         ORDER BY created_at DESC LIMIT ? OFFSET ?`,
      )
      .bind(userId, userId, limit, offset)
      .all(),
    db
      .prepare(`SELECT COUNT(*) AS total FROM notifications WHERE ${where}`)
      .bind(userId)
      .first<{ total: number }>(),
    db
      .prepare(
        "SELECT COUNT(*) AS total FROM notifications WHERE user_id = ? AND read_at IS NULL",
      )
      .bind(userId)
      .first<{ total: number }>(),
  ]);
  return {
    items: items.results ?? [],
    unread: unread?.total ?? 0,
    pagination: { page, limit, total: total?.total ?? 0 },
  };
}

async function settingsView(storeId: string) {
  const settings = await getD1()
    .prepare(
      `SELECT accepting_orders AS acceptingOrders, pickup_enabled AS pickupEnabled,
        delivery_enabled AS deliveryEnabled, minimum_order AS minimumOrder,
        delivery_fee AS deliveryFee, delivery_radius_km AS deliveryRadiusKm,
        auto_accept_orders AS autoAcceptOrders, updated_at AS updatedAt
       FROM store_settings WHERE store_id = ? LIMIT 1`,
    )
    .bind(storeId)
    .first();
  return {
    settings:
      settings ?? {
        acceptingOrders: 1,
        pickupEnabled: 1,
        deliveryEnabled: 1,
        minimumOrder: 0,
        deliveryFee: 0,
        deliveryRadiusKm: 5,
        autoAcceptOrders: 0,
        updatedAt: null,
      },
  };
}

async function supportView(userId: string, storeId: string, url: URL) {
  const db = getD1();
  const { page, limit, offset } = pageInput(url);
  const status = supportStatusInput(url.searchParams.get("status"));
  const clause = status ? " AND t.status = ?" : "";
  const bindings: unknown[] = status ? [userId, storeId, status] : [userId, storeId];
  const [items, total] = await Promise.all([
    db
      .prepare(
        `SELECT t.id, t.type, t.subject, t.message, t.priority, t.status,
          t.resolution, t.order_id AS orderId, o.order_number AS orderNumber,
          t.created_at AS createdAt, t.updated_at AS updatedAt
         FROM support_tickets t LEFT JOIN orders o ON o.id = t.order_id
         WHERE t.user_id = ? AND t.store_id = ?${clause}
         ORDER BY t.created_at DESC LIMIT ? OFFSET ?`,
      )
      .bind(...bindings, limit, offset)
      .all(),
    db
      .prepare(
        `SELECT COUNT(*) AS total FROM support_tickets t WHERE t.user_id = ? AND t.store_id = ?${clause}`,
      )
      .bind(...bindings)
      .first<{ total: number }>(),
  ]);
  return {
    items: items.results ?? [],
    pagination: { page, limit, total: total?.total ?? 0 },
  };
}

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const view = viewInput(url.searchParams.get("view"));
    const session = await requireApiPermission(request, VIEW_PERMISSIONS[view]);
    const storeId = cleanText(url.searchParams.get("storeId"), "Store", { max: 80 });
    await requireOwnedStore(session.user.id, storeId);

    let payload: Record<string, unknown>;
    if (view === "inventory") payload = await inventoryView(storeId, url);
    else if (view === "orders") payload = await ordersView(storeId, url);
    else if (view === "customers") payload = await customersView(storeId, url);
    else if (view === "sales") payload = await salesView(storeId, url);
    else if (view === "coupons") payload = await couponsView(storeId, url);
    else if (view === "notifications") payload = await notificationsView(session.user.id, url);
    else if (view === "settings") payload = await settingsView(storeId);
    else payload = await supportView(session.user.id, storeId, url);

    return noStoreJson({ view, storeId, ...payload });
  } catch (error) {
    return apiError(error);
  }
}

async function adjustInventory(
  request: Request,
  userId: string,
  storeId: string,
  body: Record<string, unknown>,
) {
  const db = getD1();
  const productId = cleanText(body.productId, "Product", { max: 80 });
  const delta = numberInput(body.quantityChange, "Quantity change", {
    min: -1_000_000,
    max: 1_000_000,
    integer: true,
  }) as number;
  if (delta === 0) {
    throw new HttpError(400, "Quantity change cannot be zero.", "ZERO_INVENTORY_CHANGE");
  }
  const reason = cleanText(body.reason, "Adjustment reason", { min: 2, max: 200 });
  const product = await db
    .prepare(
      `SELECT p.id, p.name, i.product_id AS inventoryProductId, i.sku,
        COALESCE(i.quantity, 0) AS quantity, COALESCE(i.reserved_quantity, 0) AS reservedQuantity,
        COALESCE(i.low_stock_threshold, 5) AS lowStockThreshold
       FROM products p LEFT JOIN inventory i ON i.product_id = p.id
       WHERE p.id = ? AND p.store_id = ? LIMIT 1`,
    )
    .bind(productId, storeId)
    .first<{
      id: string;
      name: string;
      inventoryProductId: string | null;
      sku: string | null;
      quantity: number;
      reservedQuantity: number;
      lowStockThreshold: number;
    }>();
  if (!product) throw new HttpError(404, "Product not found.", "PRODUCT_NOT_FOUND");
  const newQuantity = product.quantity + delta;
  if (newQuantity < product.reservedQuantity) {
    throw new HttpError(
      409,
      "Stock cannot be reduced below the quantity reserved for active orders.",
      "INSUFFICIENT_UNRESERVED_STOCK",
    );
  }
  const requestedSku = cleanText(body.sku, "SKU", { max: 48, required: false }).toUpperCase();
  const sku =
    product.sku ??
    (requestedSku ||
      `NN-${productId.replace(/[^A-Za-z0-9]/g, "").slice(0, 20).toUpperCase()}`);
  if (!/^[A-Z0-9][A-Z0-9._/-]{1,47}$/.test(sku)) {
    throw new HttpError(400, "SKU contains unsupported characters.", "INVALID_SKU");
  }
  const lowStockThreshold =
    numberInput(body.lowStockThreshold, "Low-stock threshold", {
      min: 0,
      max: 1_000_000,
      integer: true,
      required: false,
    }) ?? product.lowStockThreshold;
  const now = Math.floor(Date.now() / 1000);
  const movementId = crypto.randomUUID();
  try {
    await db.batch([
      db
        .prepare(
          `INSERT INTO inventory
            (product_id, store_id, sku, quantity, reserved_quantity, low_stock_threshold, updated_at)
           VALUES (?, ?, ?, ?, 0, ?, ?)
           ON CONFLICT(product_id) DO UPDATE SET
             quantity = inventory.quantity + excluded.quantity,
             low_stock_threshold = excluded.low_stock_threshold,
             updated_at = excluded.updated_at`,
        )
        .bind(productId, storeId, sku, delta, lowStockThreshold, now),
      db
        .prepare(
          "INSERT INTO inventory_movements (id, product_id, store_id, actor_id, quantity_change, reason, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)",
        )
        .bind(movementId, productId, storeId, userId, delta, reason, now),
    ]);
  } catch (error) {
    const message = error instanceof Error ? error.message.toLowerCase() : "";
    if (message.includes("insufficient inventory")) {
      throw new HttpError(
        409,
        "Stock changed while you were updating it. Refresh and try again.",
        "INVENTORY_CONFLICT",
      );
    }
    if (
      message.includes("inventory_store_sku_unique") ||
      message.includes("inventory.store_id, inventory.sku")
    ) {
      throw new HttpError(409, "That SKU is already assigned to another product.", "SKU_CONFLICT");
    }
    throw error;
  }
  await writeAudit(request, userId, "inventory.adjusted", "product", productId, {
    storeId,
    quantityChange: delta,
    resultingQuantity: newQuantity,
  });
  return noStoreJson({ ok: true, productId, quantity: newQuantity, movementId });
}

async function updateOrderStatus(
  request: Request,
  userId: string,
  storeId: string,
  body: Record<string, unknown>,
) {
  const db = getD1();
  const orderId = cleanText(body.orderId, "Order", { max: 80 });
  const nextStatus = orderStatusInput(body.status);
  const note = cleanText(body.note, "Status note", { max: 500, required: false }) || null;
  const order = await db
    .prepare(
      `SELECT id, order_number AS orderNumber, user_id AS customerId, status,
        fulfillment_type AS fulfillmentType, coupon_id AS couponId
       FROM orders WHERE id = ? AND store_id = ? LIMIT 1`,
    )
    .bind(orderId, storeId)
    .first<{
      id: string;
      orderNumber: string;
      customerId: string;
      status: OrderStatus;
      fulfillmentType: "delivery" | "pickup";
      couponId: string | null;
    }>();
  if (!order) throw new HttpError(404, "Order not found.", "ORDER_NOT_FOUND");
  if (!ORDER_TRANSITIONS[order.status]?.includes(nextStatus)) {
    throw new HttpError(
      409,
      `Order cannot move from ${order.status} to ${nextStatus}.`,
      "INVALID_ORDER_TRANSITION",
    );
  }
  if (nextStatus === "out_for_delivery" && order.fulfillmentType !== "delivery") {
    throw new HttpError(
      409,
      "Pickup orders cannot be marked out for delivery.",
      "INVALID_FULFILLMENT_TRANSITION",
    );
  }

  const orderItems =
    nextStatus === "rejected"
      ? await db
          .prepare(
            "SELECT product_id AS productId, quantity FROM order_items WHERE order_id = ? AND product_id IS NOT NULL",
          )
          .bind(orderId)
          .all<{ productId: string; quantity: number }>()
      : null;
  const now = Math.floor(Date.now() / 1000);
  const historyId = crypto.randomUUID();
  const notificationId = crypto.randomUUID();
  const statements: D1PreparedStatement[] = [
    db
      .prepare("UPDATE orders SET status = ?, updated_at = ? WHERE id = ? AND store_id = ? AND status = ?")
      .bind(nextStatus, now, orderId, storeId, order.status),
    db
      .prepare(
        `INSERT INTO order_status_history (id, order_id, actor_id, status, note, created_at)
         SELECT ?, ?, ?, ?, ?, ? WHERE changes() = 1`,
      )
      .bind(historyId, orderId, userId, nextStatus, note, now),
  ];
  if (nextStatus === "rejected") {
    for (const item of orderItems?.results ?? []) {
      const movementId = crypto.randomUUID();
      statements.push(
        db
          .prepare(
            `UPDATE inventory SET quantity = quantity + ?, updated_at = ?
             WHERE product_id = ? AND store_id = ?
               AND EXISTS (SELECT 1 FROM order_status_history WHERE id = ?)`,
          )
          .bind(item.quantity, now, item.productId, storeId, historyId),
        db
          .prepare(
            `INSERT INTO inventory_movements
              (id, product_id, store_id, actor_id, quantity_change, reason, reference_id, created_at)
             SELECT ?, ?, ?, ?, ?, 'Order rejected - stock restored', ?, ?
             WHERE EXISTS (SELECT 1 FROM order_status_history WHERE id = ?)`,
          )
          .bind(
            movementId,
            item.productId,
            storeId,
            userId,
            item.quantity,
            orderId,
            now,
            historyId,
          ),
      );
    }
    if (order.couponId) {
      statements.push(
        db.prepare(
          `UPDATE coupons SET used_count = MAX(used_count - 1, 0), updated_at = ?
           WHERE id = ? AND (store_id IS NULL OR store_id = ?)
             AND EXISTS (SELECT 1 FROM order_status_history WHERE id = ?)`,
        ).bind(now, order.couponId, storeId, historyId),
        db.prepare(
          `DELETE FROM coupon_redemptions WHERE coupon_id = ? AND order_id = ?
           AND EXISTS (SELECT 1 FROM order_status_history WHERE id = ?)`,
        ).bind(order.couponId, orderId, historyId),
      );
    }
  }
  statements.push(
    db
      .prepare(
        `INSERT INTO notifications
          (id, user_id, audience, type, title, message, link, created_at)
         SELECT ?, ?, 'user', 'order', ?, ?, '/account?tab=orders', ?
         WHERE EXISTS (SELECT 1 FROM order_status_history WHERE id = ?)`,
      )
      .bind(
        notificationId,
        order.customerId,
        `Order ${nextStatus.replaceAll("_", " ")}`,
        `Order ${order.orderNumber} is now ${nextStatus.replaceAll("_", " ")}.`,
        now,
        historyId,
      ),
  );
  const results = await db.batch(statements);
  if ((results[0]?.meta.changes ?? 0) !== 1) {
    throw new HttpError(
      409,
      "The order changed while you were updating it. Refresh and try again.",
      "ORDER_STATUS_CONFLICT",
    );
  }
  await writeAudit(request, userId, "order.status_updated", "order", orderId, {
    storeId,
    from: order.status,
    to: nextStatus,
  });
  return noStoreJson({ ok: true, orderId, status: nextStatus });
}

async function createCoupon(
  request: Request,
  userId: string,
  storeId: string,
  body: Record<string, unknown>,
) {
  const values = couponPayload(body);
  await assertCouponCodeAvailable(values.code);
  const id = crypto.randomUUID();
  const now = Math.floor(Date.now() / 1000);
  try {
    await getD1()
      .prepare(
        `INSERT INTO coupons
          (id, store_id, code, title, description, discount_type, discount_value,
           minimum_order, maximum_discount, usage_limit, used_count, starts_at,
           ends_at, status, created_by, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0, ?, ?, ?, ?, ?, ?)`,
      )
      .bind(
        id,
        storeId,
        values.code,
        values.title,
        values.description,
        values.discountType,
        values.discountValue,
        values.minimumOrder,
        values.maximumDiscount,
        values.usageLimit,
        values.startsAt,
        values.endsAt,
        values.status,
        userId,
        now,
        now,
      )
      .run();
  } catch (error) {
    const message = error instanceof Error ? error.message.toLowerCase() : "";
    if (message.includes("unique") || message.includes("coupons.code")) {
      throw new HttpError(409, "That coupon code is already in use.", "COUPON_CODE_TAKEN");
    }
    throw error;
  }
  await writeAudit(request, userId, "coupon.created", "coupon", id, {
    storeId,
    code: values.code,
  });
  return noStoreJson({ id }, { status: 201 });
}

async function updateCoupon(
  request: Request,
  userId: string,
  storeId: string,
  body: Record<string, unknown>,
) {
  const id = cleanText(body.couponId, "Coupon", { max: 80 });
  const existing = await getD1()
    .prepare("SELECT id FROM coupons WHERE id = ? AND store_id = ? LIMIT 1")
    .bind(id, storeId)
    .first();
  if (!existing) throw new HttpError(404, "Coupon not found.", "COUPON_NOT_FOUND");
  const values = couponPayload(body);
  await assertCouponCodeAvailable(values.code, id);
  const now = Math.floor(Date.now() / 1000);
  try {
    await getD1()
      .prepare(
        `UPDATE coupons SET code = ?, title = ?, description = ?, discount_type = ?,
          discount_value = ?, minimum_order = ?, maximum_discount = ?, usage_limit = ?,
          starts_at = ?, ends_at = ?, status = ?, updated_at = ?
         WHERE id = ? AND store_id = ?`,
      )
      .bind(
        values.code,
        values.title,
        values.description,
        values.discountType,
        values.discountValue,
        values.minimumOrder,
        values.maximumDiscount,
        values.usageLimit,
        values.startsAt,
        values.endsAt,
        values.status,
        now,
        id,
        storeId,
      )
      .run();
  } catch (error) {
    const message = error instanceof Error ? error.message.toLowerCase() : "";
    if (message.includes("unique") || message.includes("coupons.code")) {
      throw new HttpError(409, "That coupon code is already in use.", "COUPON_CODE_TAKEN");
    }
    throw error;
  }
  await writeAudit(request, userId, "coupon.updated", "coupon", id, {
    storeId,
    code: values.code,
  });
  return noStoreJson({ ok: true, id });
}

async function deleteCoupon(
  request: Request,
  userId: string,
  storeId: string,
  body: Record<string, unknown>,
) {
  const id = cleanText(body.couponId, "Coupon", { max: 80 });
  const coupon = await getD1()
    .prepare("SELECT code, used_count AS usedCount FROM coupons WHERE id = ? AND store_id = ? LIMIT 1")
    .bind(id, storeId)
    .first<{ code: string; usedCount: number }>();
  if (!coupon) throw new HttpError(404, "Coupon not found.", "COUPON_NOT_FOUND");
  const now = Math.floor(Date.now() / 1000);
  if (coupon.usedCount > 0) {
    await getD1()
      .prepare("UPDATE coupons SET status = 'disabled', updated_at = ? WHERE id = ? AND store_id = ?")
      .bind(now, id, storeId)
      .run();
  } else {
    await getD1().prepare("DELETE FROM coupons WHERE id = ? AND store_id = ?").bind(id, storeId).run();
  }
  const outcome = coupon.usedCount > 0 ? "disabled" : "deleted";
  await writeAudit(request, userId, `coupon.${outcome}`, "coupon", id, {
    storeId,
    code: coupon.code,
  });
  return noStoreJson({ ok: true, id, outcome });
}

async function updateSettings(
  request: Request,
  userId: string,
  storeId: string,
  body: Record<string, unknown>,
) {
  const db = getD1();
  const current = await db
    .prepare(
      `SELECT accepting_orders AS acceptingOrders, pickup_enabled AS pickupEnabled,
        delivery_enabled AS deliveryEnabled, minimum_order AS minimumOrder,
        delivery_fee AS deliveryFee, delivery_radius_km AS deliveryRadiusKm,
        auto_accept_orders AS autoAcceptOrders
       FROM store_settings WHERE store_id = ? LIMIT 1`,
    )
    .bind(storeId)
    .first<{
      acceptingOrders: number;
      pickupEnabled: number;
      deliveryEnabled: number;
      minimumOrder: number;
      deliveryFee: number;
      deliveryRadiusKm: number;
      autoAcceptOrders: number;
    }>();
  const has = (key: string) => Object.prototype.hasOwnProperty.call(body, key);
  const acceptingOrders = has("acceptingOrders")
    ? booleanInput(body.acceptingOrders)
    : Boolean(current?.acceptingOrders ?? 1);
  const pickupEnabled = has("pickupEnabled")
    ? booleanInput(body.pickupEnabled)
    : Boolean(current?.pickupEnabled ?? 1);
  const deliveryEnabled = has("deliveryEnabled")
    ? booleanInput(body.deliveryEnabled)
    : Boolean(current?.deliveryEnabled ?? 1);
  const autoAcceptOrders = has("autoAcceptOrders")
    ? booleanInput(body.autoAcceptOrders)
    : Boolean(current?.autoAcceptOrders ?? 0);
  if (!pickupEnabled && !deliveryEnabled) {
    throw new HttpError(
      400,
      "Enable at least one fulfillment option.",
      "FULFILLMENT_OPTION_REQUIRED",
    );
  }
  const minimumOrder = has("minimumOrder")
    ? (numberInput(body.minimumOrder, "Minimum order", { min: 0, max: 10_000_000 }) as number)
    : (current?.minimumOrder ?? 0);
  const deliveryFee = has("deliveryFee")
    ? (numberInput(body.deliveryFee, "Delivery fee", { min: 0, max: 1_000_000 }) as number)
    : (current?.deliveryFee ?? 0);
  const deliveryRadiusKm = has("deliveryRadiusKm")
    ? (numberInput(body.deliveryRadiusKm, "Delivery radius", { min: 0.1, max: 100 }) as number)
    : (current?.deliveryRadiusKm ?? 5);
  const now = Math.floor(Date.now() / 1000);
  await db
    .prepare(
      `INSERT INTO store_settings
        (store_id, accepting_orders, pickup_enabled, delivery_enabled, minimum_order,
         delivery_fee, delivery_radius_km, auto_accept_orders, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
       ON CONFLICT(store_id) DO UPDATE SET
         accepting_orders = excluded.accepting_orders,
         pickup_enabled = excluded.pickup_enabled,
         delivery_enabled = excluded.delivery_enabled,
         minimum_order = excluded.minimum_order,
         delivery_fee = excluded.delivery_fee,
         delivery_radius_km = excluded.delivery_radius_km,
         auto_accept_orders = excluded.auto_accept_orders,
         updated_at = excluded.updated_at`,
    )
    .bind(
      storeId,
      acceptingOrders ? 1 : 0,
      pickupEnabled ? 1 : 0,
      deliveryEnabled ? 1 : 0,
      minimumOrder,
      deliveryFee,
      deliveryRadiusKm,
      autoAcceptOrders ? 1 : 0,
      now,
    )
    .run();
  await writeAudit(request, userId, "store.settings_updated", "store", storeId, {
    acceptingOrders,
    pickupEnabled,
    deliveryEnabled,
    autoAcceptOrders,
  });
  return noStoreJson({ ok: true });
}

async function markNotificationRead(
  request: Request,
  userId: string,
  storeId: string,
  body: Record<string, unknown>,
) {
  const id = cleanText(body.notificationId, "Notification", { max: 80 });
  const result = await getD1()
    .prepare("UPDATE notifications SET read_at = COALESCE(read_at, ?) WHERE id = ? AND user_id = ?")
    .bind(Math.floor(Date.now() / 1000), id, userId)
    .run();
  if ((result.meta.changes ?? 0) !== 1) {
    throw new HttpError(
      404,
      "Personal notification not found.",
      "NOTIFICATION_NOT_FOUND",
    );
  }
  await writeAudit(request, userId, "notification.read", "notification", id, { storeId });
  return noStoreJson({ ok: true, id });
}

async function createSupportTicket(
  request: Request,
  userId: string,
  storeId: string,
  body: Record<string, unknown>,
) {
  const type = body.type;
  if (type !== "support" && type !== "complaint") {
    throw new HttpError(400, "Choose a valid ticket type.", "INVALID_TICKET_TYPE");
  }
  const priority = body.priority ?? "normal";
  if (priority !== "low" && priority !== "normal" && priority !== "high" && priority !== "urgent") {
    throw new HttpError(400, "Choose a valid ticket priority.", "INVALID_TICKET_PRIORITY");
  }
  const subject = cleanText(body.subject, "Subject", { min: 4, max: 160 });
  const message = cleanText(body.message, "Message", { min: 10, max: 4000 });
  const orderId = optionalId(body.orderId, "Order");
  if (orderId) {
    const order = await getD1()
      .prepare("SELECT id FROM orders WHERE id = ? AND store_id = ? LIMIT 1")
      .bind(orderId, storeId)
      .first();
    if (!order) throw new HttpError(404, "Order not found for this shop.", "ORDER_NOT_FOUND");
  }
  const id = crypto.randomUUID();
  const conversationId = crypto.randomUUID();
  const db = getD1();
  const admin = await db.prepare("SELECT id FROM users WHERE role = 'admin' AND status = 'active' ORDER BY created_at ASC LIMIT 1").first<{ id: string }>();
  const now = Math.floor(Date.now() / 1000);
  const statements = [
    db.prepare(
      `INSERT INTO support_tickets
        (id, user_id, store_id, order_id, type, subject, message, priority, status, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'open', ?, ?)`,
    ).bind(id, userId, storeId, orderId, type, subject, message, priority, now, now),
    db.prepare("INSERT INTO conversations (id, kind, store_id, support_ticket_id, subject, status, created_by, last_message_at, created_at, updated_at) VALUES (?, 'support', ?, ?, ?, 'pending', ?, ?, ?, ?)").bind(conversationId, storeId, id, subject, userId, now, now, now),
    db.prepare("INSERT INTO conversation_participants (id, conversation_id, user_id, participant_role, last_read_at, joined_at) VALUES (?, ?, ?, 'store_owner', ?, ?)").bind(crypto.randomUUID(), conversationId, userId, now, now),
    db.prepare("INSERT INTO messages (id, conversation_id, sender_id, type, body, client_nonce, delivered_at, created_at) VALUES (?, ?, ?, 'text', ?, ?, ?, ?)").bind(crypto.randomUUID(), conversationId, userId, message, crypto.randomUUID(), now, now),
    db.prepare("INSERT INTO notifications (id, user_id, audience, type, title, message, link, created_at) VALUES (?, NULL, 'admin', 'support', 'New owner support request', ?, '/admin?tab=chat', ?)").bind(crypto.randomUUID(), subject, now),
  ];
  if (admin) statements.push(db.prepare("INSERT INTO conversation_participants (id, conversation_id, user_id, participant_role, last_read_at, joined_at) VALUES (?, ?, ?, 'admin', NULL, ?)").bind(crypto.randomUUID(), conversationId, admin.id, now));
  await db.batch(statements);
  await writeAudit(request, userId, "support.created", "support_ticket", id, {
    storeId,
    orderId,
    type,
    priority,
  });
  return noStoreJson({ id }, { status: 201 });
}

export async function POST(request: Request) {
  try {
    const body = await safeJson(request);
    const action = actionInput(body.action, ["create_coupon", "create_support_ticket"]);
    const session = await requireApiPermission(request, ACTION_PERMISSIONS[action], { csrf: true });
    const storeId = cleanText(body.storeId, "Store", { max: 80 });
    await requireOwnedStore(session.user.id, storeId);
    if (action === "create_coupon") {
      return await createCoupon(request, session.user.id, storeId, body);
    }
    return await createSupportTicket(request, session.user.id, storeId, body);
  } catch (error) {
    return apiError(error);
  }
}

export async function PATCH(request: Request) {
  try {
    const body = await safeJson(request);
    const action = actionInput(body.action, [
      "adjust_inventory",
      "update_order_status",
      "update_coupon",
      "update_settings",
      "mark_notification_read",
    ]);
    const session = await requireApiPermission(request, ACTION_PERMISSIONS[action], { csrf: true });
    const storeId = cleanText(body.storeId, "Store", { max: 80 });
    await requireOwnedStore(session.user.id, storeId);
    if (action === "adjust_inventory") {
      return await adjustInventory(request, session.user.id, storeId, body);
    }
    if (action === "update_order_status") {
      return await updateOrderStatus(request, session.user.id, storeId, body);
    }
    if (action === "update_coupon") {
      return await updateCoupon(request, session.user.id, storeId, body);
    }
    if (action === "update_settings") {
      return await updateSettings(request, session.user.id, storeId, body);
    }
    return await markNotificationRead(request, session.user.id, storeId, body);
  } catch (error) {
    return apiError(error);
  }
}

export async function DELETE(request: Request) {
  try {
    const body = await safeJson(request);
    const action = actionInput(body.action, ["delete_coupon"]);
    const session = await requireApiPermission(request, ACTION_PERMISSIONS[action], { csrf: true });
    const storeId = cleanText(body.storeId, "Store", { max: 80 });
    await requireOwnedStore(session.user.id, storeId);
    return await deleteCoupon(request, session.user.id, storeId, body);
  } catch (error) {
    return apiError(error);
  }
}
