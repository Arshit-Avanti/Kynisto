import { getD1 } from "@/db/runtime";
import { requireApiPermission } from "@/lib/auth";
import type { Permission } from "@/lib/rbac";
import { apiError, enforceRateLimit, HttpError, noStoreJson } from "@/lib/security";
import {
  cleanText,
  numberInput,
  phoneInput,
  safeJson,
} from "@/lib/validation";

type JsonBody = Record<string, unknown>;

const GET_PERMISSIONS = {
  profile: "profile.manage_own",
  addresses: "addresses.manage_own",
  wishlist: "wishlist.manage_own",
  cart: "cart.manage_own",
  orders: "orders.view_own",
  notifications: "notifications.view_own",
  settings: "settings.manage_own",
  support: "support.create",
} as const satisfies Record<string, Permission>;

const POST_PERMISSIONS = {
  create_address: "addresses.manage_own",
  add_wishlist: "wishlist.manage_own",
  add_cart: "cart.manage_own",
  place_order: "orders.create",
  create_support_ticket: "support.create",
} as const satisfies Record<string, Permission>;

const PATCH_PERMISSIONS = {
  update_profile: "profile.manage_own",
  update_address: "addresses.manage_own",
  set_default_address: "addresses.manage_own",
  update_cart: "cart.manage_own",
  cancel_order: "orders.view_own",
  mark_notification_read: "notifications.view_own",
  update_preferences: "settings.manage_own",
} as const satisfies Record<string, Permission>;

const DELETE_PERMISSIONS = {
  delete_address: "addresses.manage_own",
  remove_wishlist: "wishlist.manage_own",
  remove_cart: "cart.manage_own",
} as const satisfies Record<string, Permission>;

type CartProductRow = {
  cartItemId: string;
  productId: string;
  quantity: number;
  name: string;
  price: number;
  currency: string;
  imageUrl: string | null;
  sku: string;
  stockQuantity: number;
  reservedQuantity: number;
  availableQuantity: number;
  storeId: string;
  storeName: string;
  storeSlug: string;
  ownerId: string | null;
  storeAddress: string;
  storeArea: string;
  storeCity: string;
  storeState: string;
  storeCountry: string;
  storePostalCode: string;
  acceptingOrders: number;
  pickupEnabled: number;
  deliveryEnabled: number;
  minimumOrder: number;
  deliveryFee: number;
  autoAcceptOrders: number;
};

type PlacedOrder = {
  id: string;
  orderNumber: string;
  status: string;
  subtotal: number;
  discount: number;
  deliveryFee: number;
  total: number;
};

function nowSeconds(): number {
  return Math.floor(Date.now() / 1000);
}

function roundMoney(value: number): number {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

async function checkoutOrderNumber(userId: string, fingerprint: string): Promise<string> {
  const input = new TextEncoder().encode(`kynisto-checkout-v1:${userId}:${fingerprint}`);
  const digest = new Uint8Array(await crypto.subtle.digest("SHA-256", input));
  const hexadecimal = Array.from(digest, (byte) => byte.toString(16).padStart(2, "0")).join("");
  return `NN-${hexadecimal.slice(0, 24)}`.toUpperCase();
}

async function existingOrderByNumber(
  userId: string,
  orderNumber: string,
): Promise<PlacedOrder | null> {
  const order = await getD1()
    .prepare(
      `SELECT id, order_number AS orderNumber, status, subtotal, discount,
        delivery_fee AS deliveryFee, total
       FROM orders WHERE user_id = ? AND order_number = ? LIMIT 1`,
    )
    .bind(userId, orderNumber)
    .first<PlacedOrder>();
  return order ?? null;
}

function idInput(value: unknown, label: string): string {
  return cleanText(value, label, { min: 1, max: 80 });
}

function actionInput<T extends Record<string, Permission>>(body: JsonBody, actions: T): keyof T & string {
  const action = cleanText(body.action, "Action", { min: 1, max: 50 });
  if (!(action in actions)) {
    throw new HttpError(400, "Choose a valid action.", "INVALID_ACTION");
  }
  return action as keyof T & string;
}

function pageInput(value: string | null, fallback = 1, maximum = 10_000): number {
  if (value === null || value === "") return fallback;
  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed < 1 || parsed > maximum) {
    throw new HttpError(400, "Pagination value is invalid.", "INVALID_PAGINATION");
  }
  return parsed;
}

function strictBoolean(value: unknown, label: string): boolean {
  if (typeof value !== "boolean") {
    throw new HttpError(400, `${label} must be true or false.`, "INVALID_BOOLEAN");
  }
  return value;
}

function parseJsonObject(value: unknown): Record<string, unknown> {
  if (value && typeof value === "object" && !Array.isArray(value)) {
    return value as Record<string, unknown>;
  }
  if (typeof value !== "string") return {};
  try {
    const parsed: unknown = JSON.parse(value);
    return parsed && typeof parsed === "object" && !Array.isArray(parsed)
      ? (parsed as Record<string, unknown>)
      : {};
  } catch {
    return {};
  }
}

function postalCodeInput(value: unknown): string {
  const postalCode = cleanText(value, "PIN / postal code", { min: 4, max: 12 }).toUpperCase();
  if (!/^[A-Z0-9][A-Z0-9 -]{2,10}[A-Z0-9]$/.test(postalCode)) {
    throw new HttpError(400, "Enter a valid PIN / postal code.", "INVALID_POSTAL_CODE");
  }
  return postalCode;
}

function addressInput(body: JsonBody) {
  return {
    label: cleanText(body.label, "Address label", { min: 2, max: 30 }),
    recipientName: cleanText(body.recipientName, "Recipient name", { min: 2, max: 100 }),
    phone: phoneInput(body.phone, "Phone", true) as string,
    line1: cleanText(body.line1, "Address line", { min: 5, max: 180 }),
    line2: cleanText(body.line2, "Address line 2", { required: false, max: 180 }) || null,
    area: cleanText(body.area, "Area", { min: 2, max: 100 }),
    city: cleanText(body.city, "City", { min: 2, max: 100 }),
    state: cleanText(body.state, "State", { min: 2, max: 100 }),
    country:
      body.country === undefined
        ? "India"
        : cleanText(body.country, "Country", { min: 2, max: 100 }),
    postalCode: postalCodeInput(body.postalCode),
    latitude: numberInput(body.latitude, "Latitude", { min: -90, max: 90, required: false }),
    longitude: numberInput(body.longitude, "Longitude", {
      min: -180,
      max: 180,
      required: false,
    }),
  };
}

async function listOrders(userId: string, url: URL) {
  const db = getD1();
  const page = pageInput(url.searchParams.get("page"));
  const limit = pageInput(url.searchParams.get("limit"), 20, 50);
  const orderIdRaw = url.searchParams.get("orderId");
  const orderId = orderIdRaw ? idInput(orderIdRaw, "Order") : "";
  const statusRaw = url.searchParams.get("status");
  const allowedStatuses = new Set([
    "pending",
    "confirmed",
    "preparing",
    "ready",
    "out_for_delivery",
    "delivered",
    "cancelled",
    "rejected",
  ]);
  if (statusRaw && !allowedStatuses.has(statusRaw)) {
    throw new HttpError(400, "Choose a valid order status.", "INVALID_ORDER_STATUS");
  }

  const conditions = ["o.user_id = ?"];
  const bindings: unknown[] = [userId];
  if (orderId) {
    conditions.push("o.id = ?");
    bindings.push(orderId);
  }
  if (statusRaw) {
    conditions.push("o.status = ?");
    bindings.push(statusRaw);
  }
  const where = conditions.join(" AND ");
  const [countResult, orderResult] = await db.batch([
    db.prepare(`SELECT COUNT(*) AS total FROM orders o WHERE ${where}`).bind(...bindings),
    db
      .prepare(
        `SELECT o.id, o.order_number AS orderNumber, o.store_id AS storeId,
          s.name AS storeName, s.slug AS storeSlug, s.logo_url AS storeLogoUrl,
          o.status, o.fulfillment_type AS fulfillmentType, o.address_snapshot AS addressSnapshot,
          o.subtotal, o.discount, o.delivery_fee AS deliveryFee, o.total, o.currency,
          o.notes, o.placed_at AS placedAt, o.cancelled_at AS cancelledAt,
          o.created_at AS createdAt, o.updated_at AS updatedAt, cp.code AS couponCode
         FROM orders o
         JOIN stores s ON s.id = o.store_id
         LEFT JOIN coupons cp ON cp.id = o.coupon_id
         WHERE ${where}
         ORDER BY o.created_at DESC
         LIMIT ? OFFSET ?`,
      )
      .bind(...bindings, orderId ? 1 : limit, orderId ? 0 : (page - 1) * limit),
  ]);
  const rawOrders = (orderResult.results ?? []) as Array<Record<string, unknown> & { id: string }>;
  if (orderId && rawOrders.length === 0) {
    throw new HttpError(404, "Order not found.", "ORDER_NOT_FOUND");
  }

  const ids = rawOrders.map((order) => order.id);
  const itemsByOrder = new Map<string, Record<string, unknown>[]>();
  const historyByOrder = new Map<string, Record<string, unknown>[]>();
  if (ids.length) {
    const placeholders = ids.map(() => "?").join(",");
    const [itemsResult, historyResult] = await db.batch([
      db
        .prepare(
          `SELECT id, order_id AS orderId, product_id AS productId, product_name AS productName,
            sku, unit_price AS unitPrice, quantity, line_total AS lineTotal, created_at AS createdAt
           FROM order_items WHERE order_id IN (${placeholders}) ORDER BY created_at ASC`,
        )
        .bind(...ids),
      db
        .prepare(
          `SELECT id, order_id AS orderId, status, note, created_at AS createdAt
           FROM order_status_history WHERE order_id IN (${placeholders}) ORDER BY created_at ASC`,
        )
        .bind(...ids),
    ]);
    for (const item of (itemsResult.results ?? []) as Array<Record<string, unknown> & { orderId: string }>) {
      const list = itemsByOrder.get(item.orderId) ?? [];
      list.push(item);
      itemsByOrder.set(item.orderId, list);
    }
    for (const entry of (historyResult.results ?? []) as Array<
      Record<string, unknown> & { orderId: string }
    >) {
      const list = historyByOrder.get(entry.orderId) ?? [];
      list.push(entry);
      historyByOrder.set(entry.orderId, list);
    }
  }

  const items = rawOrders.map((order) => ({
    ...order,
    addressSnapshot: parseJsonObject(order.addressSnapshot),
    items: itemsByOrder.get(order.id) ?? [],
    history: historyByOrder.get(order.id) ?? [],
  }));
  const total = Number((countResult.results?.[0] as { total?: number } | undefined)?.total ?? 0);
  return {
    items,
    pagination: {
      page: orderId ? 1 : page,
      limit: orderId ? 1 : limit,
      total,
      totalPages: total === 0 ? 0 : Math.ceil(total / (orderId ? 1 : limit)),
    },
  };
}

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const view = url.searchParams.get("view") ?? "profile";
    if (!(view in GET_PERMISSIONS)) {
      throw new HttpError(400, "Choose a valid customer workspace view.", "INVALID_VIEW");
    }
    const session = await requireApiPermission(
      request,
      GET_PERMISSIONS[view as keyof typeof GET_PERMISSIONS],
    );
    const userId = session.user.id;
    const db = getD1();

    if (view === "profile") {
      const profile = await db
        .prepare(
          `SELECT u.id, u.name, u.email, u.phone, u.avatar_url AS avatarUrl,
            u.last_login_at AS lastLoginAt, u.created_at AS createdAt, u.updated_at AS updatedAt,
            (SELECT COUNT(*) FROM orders WHERE user_id = u.id) AS orderCount,
            (SELECT COUNT(*) FROM favorites WHERE user_id = u.id) AS favoriteStoreCount,
            (SELECT COUNT(*) FROM wishlist_items WHERE user_id = u.id) AS wishlistCount
           FROM users u WHERE u.id = ? LIMIT 1`,
        )
        .bind(userId)
        .first();
      return noStoreJson({ profile });
    }

    if (view === "addresses") {
      const result = await db
        .prepare(
          `SELECT id, label, recipient_name AS recipientName, phone, line1, line2, area, city,
            state, country, postal_code AS postalCode, latitude, longitude,
            is_default AS isDefault, created_at AS createdAt, updated_at AS updatedAt
           FROM addresses WHERE user_id = ? ORDER BY is_default DESC, updated_at DESC`,
        )
        .bind(userId)
        .all();
      return noStoreJson({ items: result.results ?? [] });
    }

    if (view === "wishlist") {
      const result = await db
        .prepare(
          `SELECT w.id, w.created_at AS createdAt, p.id AS productId, p.name,
            p.slug, p.description, p.price, p.currency, p.image_url AS imageUrl,
            i.sku, MAX(i.quantity - i.reserved_quantity, 0) AS availableQuantity,
            s.id AS storeId, s.name AS storeName, s.slug AS storeSlug,
            s.area, s.city, s.rating_average AS storeRating
           FROM wishlist_items w
           JOIN products p ON p.id = w.product_id AND p.status = 'active'
           JOIN inventory i ON i.product_id = p.id AND i.store_id = p.store_id
           JOIN stores s ON s.id = p.store_id AND s.status = 'approved'
           WHERE w.user_id = ? ORDER BY w.created_at DESC`,
        )
        .bind(userId)
        .all();
      return noStoreJson({ items: result.results ?? [] });
    }

    if (view === "cart") {
      const result = await db
        .prepare(
          `SELECT ci.id, ci.quantity, ci.updated_at AS updatedAt,
            p.id AS productId, p.name, p.slug, p.price, p.currency, p.image_url AS imageUrl,
            i.sku, MAX(i.quantity - i.reserved_quantity, 0) AS availableQuantity,
            ROUND(p.price * ci.quantity, 2) AS lineTotal,
            s.id AS storeId, s.name AS storeName, s.slug AS storeSlug,
            COALESCE(ss.accepting_orders, 1) AS acceptingOrders,
            COALESCE(ss.minimum_order, 0) AS minimumOrder,
            COALESCE(ss.delivery_fee, 0) AS deliveryFee
           FROM cart_items ci
           JOIN products p ON p.id = ci.product_id
           LEFT JOIN inventory i ON i.product_id = p.id AND i.store_id = p.store_id
           JOIN stores s ON s.id = p.store_id
           LEFT JOIN store_settings ss ON ss.store_id = s.id
           WHERE ci.user_id = ? ORDER BY ci.updated_at DESC`,
        )
        .bind(userId)
        .all();
      const items = (result.results ?? []) as Array<Record<string, unknown> & { lineTotal?: number }>;
      return noStoreJson({
        items,
        subtotal: roundMoney(items.reduce((sum, item) => sum + Number(item.lineTotal ?? 0), 0)),
      });
    }

    if (view === "orders") {
      return noStoreJson(await listOrders(userId, url));
    }

    if (view === "notifications") {
      const page = pageInput(url.searchParams.get("page"));
      const limit = pageInput(url.searchParams.get("limit"), 30, 50);
      const bindings = [userId, limit, (page - 1) * limit];
      const [countResult, itemResult] = await db.batch([
        db
          .prepare(
            "SELECT COUNT(*) AS total FROM notifications WHERE user_id = ? OR (user_id IS NULL AND audience IN ('customer', 'all'))",
          )
          .bind(userId),
        db
          .prepare(
            `SELECT id, type, title, message, link, read_at AS readAt, created_at AS createdAt,
              CASE WHEN user_id = ? THEN 1 ELSE 0 END AS canMarkRead
             FROM notifications
             WHERE user_id = ? OR (user_id IS NULL AND audience IN ('customer', 'all'))
             ORDER BY created_at DESC LIMIT ? OFFSET ?`,
          )
          .bind(userId, ...bindings),
      ]);
      const total = Number((countResult.results?.[0] as { total?: number } | undefined)?.total ?? 0);
      return noStoreJson({
        items: itemResult.results ?? [],
        pagination: { page, limit, total, totalPages: total ? Math.ceil(total / limit) : 0 },
      });
    }

    if (view === "settings") {
      const preferences = await db
        .prepare(
          `SELECT u.email,
            COALESCE(up.email_notifications, 1) AS emailNotifications,
            COALESCE(up.order_notifications, 1) AS orderNotifications,
            COALESCE(up.marketing_notifications, 0) AS marketingNotifications,
            up.updated_at AS updatedAt
           FROM users u LEFT JOIN user_preferences up ON up.user_id = u.id WHERE u.id = ? LIMIT 1`,
        )
        .bind(userId)
        .first();
      return noStoreJson({ preferences });
    }

    const page = pageInput(url.searchParams.get("page"));
    const limit = pageInput(url.searchParams.get("limit"), 20, 50);
    const [countResult, itemResult] = await db.batch([
      db.prepare("SELECT COUNT(*) AS total FROM support_tickets WHERE user_id = ?").bind(userId),
      db
        .prepare(
          `SELECT st.id, st.store_id AS storeId, s.name AS storeName, st.order_id AS orderId,
            o.order_number AS orderNumber, st.type, st.subject, st.message, st.priority,
            st.status, st.resolution, st.created_at AS createdAt, st.updated_at AS updatedAt
           FROM support_tickets st
           LEFT JOIN stores s ON s.id = st.store_id
           LEFT JOIN orders o ON o.id = st.order_id AND o.user_id = st.user_id
           WHERE st.user_id = ? ORDER BY st.created_at DESC LIMIT ? OFFSET ?`,
        )
        .bind(userId, limit, (page - 1) * limit),
    ]);
    const total = Number((countResult.results?.[0] as { total?: number } | undefined)?.total ?? 0);
    return noStoreJson({
      items: itemResult.results ?? [],
      pagination: { page, limit, total, totalPages: total ? Math.ceil(total / limit) : 0 },
    });
  } catch (error) {
    return apiError(error);
  }
}

async function publicProduct(productId: string) {
  return getD1()
    .prepare(
      `SELECT p.id, p.store_id AS storeId, p.name, p.price, p.currency,
        i.sku, i.quantity, i.reserved_quantity AS reservedQuantity,
        MAX(i.quantity - i.reserved_quantity, 0) AS availableQuantity,
        s.name AS storeName, COALESCE(ss.accepting_orders, 1) AS acceptingOrders
       FROM products p
       JOIN inventory i ON i.product_id = p.id AND i.store_id = p.store_id
       JOIN stores s ON s.id = p.store_id
       LEFT JOIN store_settings ss ON ss.store_id = s.id
       WHERE p.id = ? AND p.status = 'active' AND p.price IS NOT NULL AND s.status = 'approved'
       LIMIT 1`,
    )
    .bind(productId)
    .first<{
      id: string;
      storeId: string;
      name: string;
      price: number;
      currency: string;
      sku: string;
      quantity: number;
      reservedQuantity: number;
      availableQuantity: number;
      storeName: string;
      acceptingOrders: number;
    }>();
}

async function createAddress(userId: string, body: JsonBody) {
  const db = getD1();
  const input = addressInput(body);
  const id = crypto.randomUUID();
  const now = nowSeconds();
  const existingCount = await db
    .prepare("SELECT COUNT(*) AS total FROM addresses WHERE user_id = ?")
    .bind(userId)
    .first<{ total: number }>();
  const makeDefault = existingCount?.total === 0 || body.isDefault === true;
  const statements: D1PreparedStatement[] = [];
  if (makeDefault) {
    statements.push(
      db.prepare("UPDATE addresses SET is_default = 0, updated_at = ? WHERE user_id = ?").bind(now, userId),
    );
  }
  statements.push(
    db
      .prepare(
        `INSERT INTO addresses
          (id, user_id, label, recipient_name, phone, line1, line2, area, city, state, country,
           postal_code, latitude, longitude, is_default, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      )
      .bind(
        id,
        userId,
        input.label,
        input.recipientName,
        input.phone,
        input.line1,
        input.line2,
        input.area,
        input.city,
        input.state,
        input.country,
        input.postalCode,
        input.latitude,
        input.longitude,
        makeDefault ? 1 : 0,
        now,
        now,
      ),
  );
  await db.batch(statements);
  return id;
}

async function updateAddress(userId: string, body: JsonBody) {
  const db = getD1();
  const addressId = idInput(body.addressId, "Address");
  const owned = await db
    .prepare("SELECT id FROM addresses WHERE id = ? AND user_id = ? LIMIT 1")
    .bind(addressId, userId)
    .first();
  if (!owned) throw new HttpError(404, "Address not found.", "ADDRESS_NOT_FOUND");
  const input = addressInput(body);
  const now = nowSeconds();
  const makeDefault = body.isDefault === true;
  const statements: D1PreparedStatement[] = [];
  if (makeDefault) {
    statements.push(
      db.prepare("UPDATE addresses SET is_default = 0, updated_at = ? WHERE user_id = ?").bind(now, userId),
    );
  }
  statements.push(
    db
      .prepare(
        `UPDATE addresses SET label = ?, recipient_name = ?, phone = ?, line1 = ?, line2 = ?,
          area = ?, city = ?, state = ?, country = ?, postal_code = ?, latitude = ?, longitude = ?,
          is_default = CASE WHEN ? = 1 THEN 1 ELSE is_default END, updated_at = ?
         WHERE id = ? AND user_id = ?`,
      )
      .bind(
        input.label,
        input.recipientName,
        input.phone,
        input.line1,
        input.line2,
        input.area,
        input.city,
        input.state,
        input.country,
        input.postalCode,
        input.latitude,
        input.longitude,
        makeDefault ? 1 : 0,
        now,
        addressId,
        userId,
      ),
  );
  await db.batch(statements);
  return addressId;
}

async function setDefaultAddress(userId: string, addressId: string) {
  const db = getD1();
  const owned = await db
    .prepare("SELECT id FROM addresses WHERE id = ? AND user_id = ? LIMIT 1")
    .bind(addressId, userId)
    .first();
  if (!owned) throw new HttpError(404, "Address not found.", "ADDRESS_NOT_FOUND");
  const now = nowSeconds();
  await db.batch([
    db.prepare("UPDATE addresses SET is_default = 0, updated_at = ? WHERE user_id = ?").bind(now, userId),
    db
      .prepare("UPDATE addresses SET is_default = 1, updated_at = ? WHERE id = ? AND user_id = ?")
      .bind(now, addressId, userId),
  ]);
}

async function deleteAddress(userId: string, addressId: string) {
  const db = getD1();
  const address = await db
    .prepare("SELECT id, is_default AS isDefault FROM addresses WHERE id = ? AND user_id = ? LIMIT 1")
    .bind(addressId, userId)
    .first<{ id: string; isDefault: number }>();
  if (!address) throw new HttpError(404, "Address not found.", "ADDRESS_NOT_FOUND");
  const replacement = address.isDefault
    ? await db
        .prepare(
          "SELECT id FROM addresses WHERE user_id = ? AND id <> ? ORDER BY updated_at DESC LIMIT 1",
        )
        .bind(userId, addressId)
        .first<{ id: string }>()
    : null;
  const statements: D1PreparedStatement[] = [
    db.prepare("DELETE FROM addresses WHERE id = ? AND user_id = ?").bind(addressId, userId),
  ];
  if (replacement) {
    statements.push(
      db
        .prepare("UPDATE addresses SET is_default = 1, updated_at = ? WHERE id = ? AND user_id = ?")
        .bind(nowSeconds(), replacement.id, userId),
    );
  }
  await db.batch(statements);
}

async function addWishlist(userId: string, productId: string) {
  if (!(await publicProduct(productId))) {
    throw new HttpError(404, "Product not found.", "PRODUCT_NOT_FOUND");
  }
  await getD1()
    .prepare(
      "INSERT OR IGNORE INTO wishlist_items (id, user_id, product_id, created_at) VALUES (?, ?, ?, ?)",
    )
    .bind(crypto.randomUUID(), userId, productId, nowSeconds())
    .run();
}

async function addCartItem(userId: string, productId: string, quantity: number) {
  const db = getD1();
  const product = await publicProduct(productId);
  if (!product) throw new HttpError(404, "Product not found.", "PRODUCT_NOT_FOUND");
  if (!product.acceptingOrders) {
    throw new HttpError(409, "This shop is not accepting orders.", "SHOP_NOT_ACCEPTING_ORDERS");
  }
  const [cartSummaryResult, existingResult] = await db.batch([
    db
      .prepare(
        `SELECT COALESCE(SUM(ci.quantity), 0) AS totalQuantity,
          MIN(p.store_id) AS storeId, MAX(p.store_id) AS lastStoreId
         FROM cart_items ci JOIN products p ON p.id = ci.product_id WHERE ci.user_id = ?`,
      )
      .bind(userId),
    db
      .prepare("SELECT quantity FROM cart_items WHERE user_id = ? AND product_id = ? LIMIT 1")
      .bind(userId, productId),
  ]);
  const summary = (cartSummaryResult.results?.[0] ?? {}) as {
    totalQuantity?: number;
    storeId?: string | null;
    lastStoreId?: string | null;
  };
  if (summary.storeId &&
      (summary.storeId !== product.storeId || summary.lastStoreId !== product.storeId)) {
    throw new HttpError(
      409,
      "Your cart already contains products from another shop. Complete or clear that cart first.",
      "CART_STORE_CONFLICT",
    );
  }
  const existingQuantity = Number(
    (existingResult.results?.[0] as { quantity?: number } | undefined)?.quantity ?? 0,
  );
  const newProductQuantity = existingQuantity + quantity;
  if (Number(summary.totalQuantity ?? 0) + quantity > 20) {
    throw new HttpError(400, "A cart can contain at most 20 items.", "CART_ITEM_LIMIT");
  }
  if (newProductQuantity > product.availableQuantity) {
    throw new HttpError(409, "Requested quantity is not available.", "INSUFFICIENT_STOCK");
  }
  const now = nowSeconds();
  await db
    .prepare(
      `INSERT INTO cart_items (id, user_id, product_id, quantity, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?)
       ON CONFLICT(user_id, product_id) DO UPDATE SET
         quantity = cart_items.quantity + excluded.quantity, updated_at = excluded.updated_at`,
    )
    .bind(crypto.randomUUID(), userId, productId, quantity, now, now)
    .run();
  return newProductQuantity;
}

async function updateCartItem(userId: string, productId: string, quantity: number) {
  const db = getD1();
  const item = await db
    .prepare(
      `SELECT ci.id, ci.quantity, MAX(i.quantity - i.reserved_quantity, 0) AS availableQuantity
       FROM cart_items ci
       JOIN products p ON p.id = ci.product_id
       JOIN inventory i ON i.product_id = p.id AND i.store_id = p.store_id
       JOIN stores s ON s.id = p.store_id
       WHERE ci.user_id = ? AND ci.product_id = ? AND p.status = 'active' AND s.status = 'approved'
       LIMIT 1`,
    )
    .bind(userId, productId)
    .first<{ id: string; quantity: number; availableQuantity: number }>();
  if (!item) throw new HttpError(404, "Cart item not found.", "CART_ITEM_NOT_FOUND");
  if (quantity > item.availableQuantity) {
    throw new HttpError(409, "Requested quantity is not available.", "INSUFFICIENT_STOCK");
  }
  const otherQuantity = await db
    .prepare("SELECT COALESCE(SUM(quantity), 0) AS total FROM cart_items WHERE user_id = ? AND product_id <> ?")
    .bind(userId, productId)
    .first<{ total: number }>();
  if (Number(otherQuantity?.total ?? 0) + quantity > 20) {
    throw new HttpError(400, "A cart can contain at most 20 items.", "CART_ITEM_LIMIT");
  }
  await db
    .prepare("UPDATE cart_items SET quantity = ?, updated_at = ? WHERE user_id = ? AND product_id = ?")
    .bind(quantity, nowSeconds(), userId, productId)
    .run();
}

async function placeOrder(request: Request, userId: string, body: JsonBody) {
  const headerIdempotencyKey = request.headers.get("Idempotency-Key");
  const bodyIdempotencyKey =
    body.idempotencyKey === undefined
      ? null
      : cleanText(body.idempotencyKey, "Idempotency key", { min: 8, max: 100 });
  if (
    headerIdempotencyKey !== null &&
    bodyIdempotencyKey !== null &&
    headerIdempotencyKey.trim() !== bodyIdempotencyKey
  ) {
    throw new HttpError(
      400,
      "The checkout idempotency keys do not match.",
      "IDEMPOTENCY_KEY_MISMATCH",
    );
  }
  const idempotencyKey =
    headerIdempotencyKey === null && bodyIdempotencyKey === null
      ? null
      : cleanText(headerIdempotencyKey ?? bodyIdempotencyKey, "Idempotency key", {
          min: 8,
          max: 100,
        });
  const keyedOrderNumber = idempotencyKey
    ? await checkoutOrderNumber(userId, `key:${idempotencyKey}`)
    : null;
  if (keyedOrderNumber) {
    const existingOrder = await existingOrderByNumber(userId, keyedOrderNumber);
    if (existingOrder) return existingOrder;
  }
  await enforceRateLimit(request, `customer-order:${userId}`, 10, 60);
  const db = getD1();
  const [countResult, cartResult, settingsResult] = await db.batch([
    db.prepare("SELECT COUNT(*) AS total FROM cart_items WHERE user_id = ?").bind(userId),
    db
      .prepare(
        `SELECT ci.id AS cartItemId, ci.product_id AS productId, ci.quantity,
          p.name, p.price, p.currency, i.sku, i.quantity AS stockQuantity,
          i.reserved_quantity AS reservedQuantity,
          MAX(i.quantity - i.reserved_quantity, 0) AS availableQuantity,
          s.id AS storeId, s.name AS storeName, s.slug AS storeSlug, s.owner_id AS ownerId,
          s.address AS storeAddress, s.area AS storeArea, s.city AS storeCity,
          s.state AS storeState, s.country AS storeCountry, s.postal_code AS storePostalCode,
          COALESCE(ss.accepting_orders, 1) AS acceptingOrders,
          COALESCE(ss.pickup_enabled, 1) AS pickupEnabled,
          COALESCE(ss.delivery_enabled, 1) AS deliveryEnabled,
          COALESCE(ss.minimum_order, 0) AS minimumOrder,
          COALESCE(ss.delivery_fee, 0) AS deliveryFee,
          COALESCE(ss.auto_accept_orders, 0) AS autoAcceptOrders
         FROM cart_items ci
         JOIN products p ON p.id = ci.product_id AND p.status = 'active' AND p.price IS NOT NULL
         JOIN inventory i ON i.product_id = p.id AND i.store_id = p.store_id
         JOIN stores s ON s.id = p.store_id AND s.status = 'approved'
         LEFT JOIN store_settings ss ON ss.store_id = s.id
         WHERE ci.user_id = ? ORDER BY ci.created_at ASC`,
      )
      .bind(userId),
    db
      .prepare(
        "SELECT key, value FROM system_settings WHERE key IN ('orders_enabled', 'default_currency')",
      ),
  ]);
  const checkoutSettings = new Map(
    ((settingsResult.results ?? []) as Array<{ key: string; value: string }>).map((setting) => [
      setting.key,
      setting.value,
    ]),
  );
  if ((checkoutSettings.get("orders_enabled") ?? "true").toLowerCase() !== "true") {
    throw new HttpError(
      503,
      "Online ordering is temporarily unavailable.",
      "ORDERS_DISABLED",
    );
  }
  const cartCount = Number((countResult.results?.[0] as { total?: number } | undefined)?.total ?? 0);
  const items = (cartResult.results ?? []) as CartProductRow[];
  if (!cartCount) throw new HttpError(400, "Your cart is empty.", "EMPTY_CART");
  if (items.length !== cartCount) {
    throw new HttpError(
      409,
      "One or more cart products are no longer available. Remove them before checkout.",
      "CART_HAS_UNAVAILABLE_ITEMS",
    );
  }
  const totalQuantity = items.reduce((sum, item) => sum + Number(item.quantity), 0);
  if (items.length > 20 || totalQuantity > 20) {
    throw new HttpError(400, "An order can contain at most 20 items.", "ORDER_ITEM_LIMIT");
  }
  const storeIds = new Set(items.map((item) => item.storeId));
  if (storeIds.size !== 1) {
    throw new HttpError(
      409,
      "Checkout supports one shop per order. Remove products from other shops and try again.",
      "MULTI_STORE_CART",
    );
  }
  const store = items[0];
  const configuredCurrency = (checkoutSettings.get("default_currency") ?? "INR")
    .trim()
    .toUpperCase();
  const itemCurrencies = new Set(
    items.map((item) => String(item.currency || configuredCurrency).trim().toUpperCase()),
  );
  if (itemCurrencies.size !== 1) {
    throw new HttpError(
      409,
      "Products with different currencies cannot be placed in the same order.",
      "MIXED_ORDER_CURRENCY",
    );
  }
  const currency = Array.from(itemCurrencies)[0] || configuredCurrency;
  if (!/^[A-Z]{3}$/.test(currency)) {
    throw new HttpError(409, "A product has an invalid currency.", "INVALID_ORDER_CURRENCY");
  }
  if (!store.acceptingOrders) {
    throw new HttpError(409, "This shop is not accepting orders.", "SHOP_NOT_ACCEPTING_ORDERS");
  }
  for (const item of items) {
    if (!Number.isInteger(item.quantity) || item.quantity < 1 || item.quantity > item.availableQuantity) {
      throw new HttpError(
        409,
        `${item.name} does not have enough stock for this order.`,
        "INSUFFICIENT_STOCK",
      );
    }
  }

  const fulfillmentType = body.fulfillmentType === "pickup" ? "pickup" : "delivery";
  if (fulfillmentType === "delivery" && !store.deliveryEnabled) {
    throw new HttpError(409, "This shop does not offer delivery.", "DELIVERY_UNAVAILABLE");
  }
  if (fulfillmentType === "pickup" && !store.pickupEnabled) {
    throw new HttpError(409, "This shop does not offer pickup.", "PICKUP_UNAVAILABLE");
  }

  let addressSnapshot: Record<string, unknown>;
  if (fulfillmentType === "delivery") {
    const addressId = idInput(body.addressId, "Delivery address");
    const address = await db
      .prepare(
        `SELECT id, label, recipient_name AS recipientName, phone, line1, line2, area, city,
          state, country, postal_code AS postalCode, latitude, longitude
         FROM addresses WHERE id = ? AND user_id = ? LIMIT 1`,
      )
      .bind(addressId, userId)
      .first<Record<string, unknown>>();
    if (!address) throw new HttpError(404, "Delivery address not found.", "ADDRESS_NOT_FOUND");
    addressSnapshot = address;
  } else {
    addressSnapshot = {
      label: "Store pickup",
      recipientName: store.storeName,
      line1: store.storeAddress,
      area: store.storeArea,
      city: store.storeCity,
      state: store.storeState,
      country: store.storeCountry,
      postalCode: store.storePostalCode,
    };
  }

  const subtotal = roundMoney(
    items.reduce((sum, item) => sum + Number(item.price) * Number(item.quantity), 0),
  );
  if (subtotal < Number(store.minimumOrder)) {
    throw new HttpError(
      400,
      `This shop requires a minimum order of ${currency} ${roundMoney(Number(store.minimumOrder))}.`,
      "MINIMUM_ORDER_NOT_MET",
    );
  }

  const couponCode = cleanText(body.couponCode, "Coupon", { required: false, max: 40 }).toUpperCase();
  let coupon: {
    id: string;
    discountType: "percentage" | "fixed";
    discountValue: number;
    minimumOrder: number;
    maximumDiscount: number | null;
  } | null = null;
  if (couponCode) {
    coupon = await db
      .prepare(
        `SELECT id, discount_type AS discountType, discount_value AS discountValue,
          minimum_order AS minimumOrder, maximum_discount AS maximumDiscount
         FROM coupons
         WHERE UPPER(code) = ? AND status = 'active' AND (store_id IS NULL OR store_id = ?)
           AND (starts_at IS NULL OR starts_at <= ?) AND (ends_at IS NULL OR ends_at >= ?)
           AND (usage_limit IS NULL OR used_count < usage_limit)
         LIMIT 1`,
      )
      .bind(couponCode, store.storeId, nowSeconds(), nowSeconds())
      .first<{
        id: string;
        discountType: "percentage" | "fixed";
        discountValue: number;
        minimumOrder: number;
        maximumDiscount: number | null;
      }>();
    if (!coupon) throw new HttpError(400, "Coupon is invalid or expired.", "INVALID_COUPON");
    if (subtotal < Number(coupon.minimumOrder)) {
      throw new HttpError(400, "The coupon minimum order has not been met.", "COUPON_MINIMUM_NOT_MET");
    }
  }

  let discount = 0;
  if (coupon) {
    discount =
      coupon.discountType === "percentage"
        ? subtotal * (Math.min(Math.max(Number(coupon.discountValue), 0), 100) / 100)
        : Math.max(Number(coupon.discountValue), 0);
    if (coupon.maximumDiscount !== null) {
      discount = Math.min(discount, Number(coupon.maximumDiscount));
    }
    discount = roundMoney(Math.min(discount, subtotal));
  }
  const deliveryFee = fulfillmentType === "delivery" ? roundMoney(Number(store.deliveryFee)) : 0;
  const total = roundMoney(Math.max(0, subtotal - discount + deliveryFee));
  const notes = cleanText(body.notes, "Order notes", { required: false, max: 500 }) || null;
  const now = nowSeconds();
  const orderId = crypto.randomUUID();
  const cartFingerprint = items
    .map((item) => `${item.cartItemId}:${item.productId}:${item.quantity}`)
    .sort()
    .join("|");
  const orderNumber =
    keyedOrderNumber ?? (await checkoutOrderNumber(userId, `cart:${cartFingerprint}`));
  const initialStatus = store.autoAcceptOrders ? "confirmed" : "pending";
  const statements: D1PreparedStatement[] = [];
  if (coupon) {
    // Reserve one use before creating the order. The immediately following INSERT checks
    // changes(), so a concurrently exhausted/disabled coupon aborts the whole D1 batch.
    statements.push(
      db
        .prepare(
          `UPDATE coupons SET used_count = used_count + 1, updated_at = ?
           WHERE id = ? AND status = 'active' AND (store_id IS NULL OR store_id = ?)
             AND (starts_at IS NULL OR starts_at <= ?) AND (ends_at IS NULL OR ends_at >= ?)
             AND (usage_limit IS NULL OR used_count < usage_limit)`,
        )
        .bind(now, coupon.id, store.storeId, now, now),
    );
  }

  const cartRowConditions = items
    .map(() => "(ci.id = ? AND ci.product_id = ? AND ci.quantity = ?)")
    .join(" OR ");
  const orderBindings: unknown[] = [
    orderId,
    orderNumber,
    userId,
    store.storeId,
    coupon?.id ?? null,
    JSON.stringify(addressSnapshot),
    initialStatus,
    fulfillmentType,
    subtotal,
    discount,
    deliveryFee,
    total,
    currency,
    notes,
    now,
    now,
    now,
    userId,
    items.length,
    userId,
  ];
  for (const item of items) {
    orderBindings.push(item.cartItemId, item.productId, item.quantity);
  }
  statements.push(
    db
      .prepare(
        `INSERT INTO orders
         (id, order_number, user_id, store_id, coupon_id, address_snapshot, status,
           fulfillment_type, subtotal, discount, delivery_fee, total, currency, notes,
           placed_at, created_at, updated_at)
         SELECT ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?
         WHERE ${coupon ? "changes() = 1 AND" : ""}
           COALESCE(
             (SELECT LOWER(value) FROM system_settings WHERE key = 'orders_enabled'),
             'true'
           ) = 'true'
           AND
           (SELECT COUNT(*) FROM cart_items WHERE user_id = ?) = ?
           AND NOT EXISTS (
             SELECT 1 FROM cart_items ci
             WHERE ci.user_id = ? AND NOT (${cartRowConditions})
           )`,
      )
      .bind(...orderBindings),
  );

  // Nine bindings per order item exceed D1's 100-variable ceiling at 20 products.
  // Batches remain atomic, so use chunks of ten while keeping one transaction.
  for (let start = 0; start < items.length; start += 10) {
    const chunk = items.slice(start, start + 10);
    const itemValues = chunk.map(() => "(?, ?, ?, ?, ?, ?, ?, ?, ?)").join(", ");
    const itemBindings: unknown[] = [];
    for (const item of chunk) {
      itemBindings.push(
        crypto.randomUUID(),
        orderId,
        item.productId,
        item.name,
        item.sku,
        roundMoney(Number(item.price)),
        item.quantity,
        roundMoney(Number(item.price) * item.quantity),
        now,
      );
    }
    statements.push(
      db
        .prepare(
          `INSERT INTO order_items
            (id, order_id, product_id, product_name, sku, unit_price, quantity, line_total, created_at)
           VALUES ${itemValues}`,
        )
        .bind(...itemBindings),
    );
  }

  // Two set-based statements keep a 20-product checkout well below D1's
  // per-invocation query ceiling as well as its 100-bind ceiling.
  const inventoryCases = items
    .map(() => "WHEN ? THEN CASE WHEN quantity - reserved_quantity >= ? THEN quantity - ? ELSE -1 END")
    .join(" ");
  const inventoryBindings: unknown[] = [];
  for (const item of items) inventoryBindings.push(item.productId, item.quantity, item.quantity);
  inventoryBindings.push(now, store.storeId, ...items.map((item) => item.productId));
  statements.push(
    db.prepare(
      `UPDATE inventory SET quantity = CASE product_id ${inventoryCases} ELSE quantity END,
        updated_at = ?
       WHERE store_id = ? AND product_id IN (${items.map(() => "?").join(",")})`,
    ).bind(...inventoryBindings),
  );

  const movementRows = items
    .map((_, index) => `${index ? "UNION ALL " : ""}SELECT ? AS id, ? AS product_id, ? AS quantity_change`)
    .join(" ");
  const movementBindings: unknown[] = [items.length, store.storeId, userId, orderId, now];
  for (const item of items) {
    movementBindings.push(crypto.randomUUID(), item.productId, -item.quantity);
  }
  statements.push(
    db.prepare(
      `INSERT INTO inventory_movements
        (id, product_id, store_id, actor_id, quantity_change, reason, reference_id, created_at)
       SELECT movement.id,
         CASE WHEN changes() = ? THEN movement.product_id ELSE NULL END,
         ?, ?, movement.quantity_change, 'customer_order', ?, ?
       FROM (${movementRows}) movement`,
    ).bind(...movementBindings),
  );

  statements.push(
    db
      .prepare(
        "INSERT INTO order_status_history (id, order_id, actor_id, status, note, created_at) VALUES (?, ?, ?, ?, ?, ?)",
      )
      .bind(crypto.randomUUID(), orderId, userId, initialStatus, "Order placed by customer", now),
    db
      .prepare(`DELETE FROM cart_items WHERE user_id = ? AND id IN (${items.map(() => "?").join(",")})`)
      .bind(userId, ...items.map((item) => item.cartItemId)),
    db
      .prepare(
        `INSERT INTO notifications
          (id, user_id, audience, type, title, message, link, read_at, created_at)
         VALUES (?, ?, 'user', 'order', ?, ?, ?, NULL, ?)`,
      )
      .bind(
        crypto.randomUUID(),
        userId,
        "Order placed",
        `${orderNumber} has been sent to ${store.storeName}.`,
        `/account?tab=orders&orderId=${encodeURIComponent(orderId)}`,
        now,
      ),
  );
  if (store.ownerId) {
    statements.push(
      db
        .prepare(
          `INSERT INTO notifications
            (id, user_id, audience, type, title, message, link, read_at, created_at)
           VALUES (?, ?, 'user', 'order', ?, ?, ?, NULL, ?)`,
        )
        .bind(
          crypto.randomUUID(),
          store.ownerId,
          "New order received",
          `${orderNumber} was placed for ${currency} ${total.toFixed(2)}.`,
          `/owner?tab=orders&orderId=${encodeURIComponent(orderId)}`,
          now,
        ),
    );
  }
  if (coupon) {
    statements.push(
      db
        .prepare(
          `INSERT INTO coupon_redemptions
            (id, coupon_id, user_id, order_id, discount_amount, created_at)
           VALUES (?, ?, ?, ?, ?, ?)`,
        )
        .bind(crypto.randomUUID(), coupon.id, userId, orderId, discount, now),
    );
  }

  try {
    await db.batch(statements);
  } catch (error) {
    // A concurrent retry has the same deterministic order number. Return the original
    // result instead of creating a second order or surfacing a unique-index failure.
    const existingOrder = await existingOrderByNumber(userId, orderNumber);
    if (existingOrder) return existingOrder;

    const errorMessage = String(error).toLowerCase();
    const currentOrdersSetting = await db
      .prepare("SELECT value FROM system_settings WHERE key = 'orders_enabled' LIMIT 1")
      .first<{ value: string }>();
    if ((currentOrdersSetting?.value ?? "true").toLowerCase() !== "true") {
      throw new HttpError(
        503,
        "Online ordering is temporarily unavailable.",
        "ORDERS_DISABLED",
      );
    }
    if (
      errorMessage.includes("insufficient inventory") ||
      errorMessage.includes("inventory_movements.product_id")
    ) {
      throw new HttpError(
        409,
        "Stock changed during checkout. Review your cart and try again.",
        "INSUFFICIENT_STOCK",
      );
    }
    if (coupon) {
      const state = await db
        .prepare(
          `SELECT status, store_id AS storeId, starts_at AS startsAt, ends_at AS endsAt,
            usage_limit AS usageLimit, used_count AS usedCount
           FROM coupons WHERE id = ? LIMIT 1`,
        )
        .bind(coupon.id)
        .first<{
          status: string;
          storeId: string | null;
          startsAt: number | null;
          endsAt: number | null;
          usageLimit: number | null;
          usedCount: number;
        }>();
      const checkTime = nowSeconds();
      if (
        state &&
        state.usageLimit !== null &&
        Number(state.usedCount) >= Number(state.usageLimit)
      ) {
        throw new HttpError(
          409,
          "This coupon has reached its usage limit.",
          "COUPON_USAGE_LIMIT_REACHED",
        );
      }
      if (
        !state ||
        state.status !== "active" ||
        (state.storeId !== null && state.storeId !== store.storeId) ||
        (state.startsAt !== null && state.startsAt > checkTime) ||
        (state.endsAt !== null && state.endsAt < checkTime)
      ) {
        throw new HttpError(409, "Coupon is invalid or expired.", "INVALID_COUPON");
      }
    }
    if (errorMessage.includes("constraint")) {
      throw new HttpError(
        409,
        "Your cart changed during checkout. Review it and try again.",
        "CART_CHANGED",
      );
    }
    throw error;
  }
  return { id: orderId, orderNumber, status: initialStatus, subtotal, discount, deliveryFee, total };
}

async function cancelOrder(userId: string, body: JsonBody) {
  const db = getD1();
  const orderId = idInput(body.orderId, "Order");
  const reason = cleanText(body.reason, "Cancellation reason", {
    required: false,
    max: 300,
  }) || "Cancelled by customer";
  const order = await db
    .prepare(
      `SELECT o.id, o.order_number AS orderNumber, o.store_id AS storeId, o.status,
        o.coupon_id AS couponId, s.name AS storeName, s.owner_id AS ownerId
       FROM orders o JOIN stores s ON s.id = o.store_id
       WHERE o.id = ? AND o.user_id = ? LIMIT 1`,
    )
    .bind(orderId, userId)
    .first<{
      id: string;
      orderNumber: string;
      storeId: string;
      status: string;
      couponId: string | null;
      storeName: string;
      ownerId: string | null;
    }>();
  if (!order) throw new HttpError(404, "Order not found.", "ORDER_NOT_FOUND");
  if (order.status !== "pending" && order.status !== "confirmed") {
    throw new HttpError(
      409,
      "This order can no longer be cancelled online.",
      "ORDER_NOT_CANCELLABLE",
    );
  }
  const itemResult = await db
    .prepare(
      "SELECT product_id AS productId, quantity FROM order_items WHERE order_id = ? AND product_id IS NOT NULL",
    )
    .bind(orderId)
    .all<{ productId: string; quantity: number }>();
  const items = itemResult.results ?? [];
  const now = nowSeconds();
  const historyId = crypto.randomUUID();
  const statements: D1PreparedStatement[] = [
    db
      .prepare(
        `UPDATE orders SET status = 'cancelled', cancelled_at = ?, updated_at = ?
         WHERE id = ? AND user_id = ? AND status IN ('pending', 'confirmed')`,
      )
      .bind(now, now, orderId, userId),
    db
      .prepare(
        `INSERT INTO order_status_history (id, order_id, actor_id, status, note, created_at)
         SELECT ?, ?, ?, 'cancelled', ?, ? WHERE changes() = 1`,
      )
      .bind(historyId, orderId, userId, reason, now),
  ];
  for (const item of items) {
    statements.push(
      db
        .prepare(
          `UPDATE inventory SET quantity = quantity + ?, updated_at = ?
           WHERE product_id = ? AND store_id = ?
             AND EXISTS (SELECT 1 FROM order_status_history WHERE id = ?)`,
        )
        .bind(item.quantity, now, item.productId, order.storeId, historyId),
      db
        .prepare(
          `INSERT INTO inventory_movements
            (id, product_id, store_id, actor_id, quantity_change, reason, reference_id, created_at)
           SELECT ?, ?, ?, ?, ?, 'customer_cancellation', ?, ?
           WHERE changes() = 1 AND EXISTS (
             SELECT 1 FROM order_status_history WHERE id = ?
           )`,
        )
        .bind(
          crypto.randomUUID(),
          item.productId,
          order.storeId,
          userId,
          item.quantity,
          orderId,
          now,
          historyId,
        ),
    );
  }
  statements.push(
    db
      .prepare(
        `INSERT INTO notifications
          (id, user_id, audience, type, title, message, link, read_at, created_at)
         SELECT ?, ?, 'user', 'order', ?, ?, ?, NULL, ?
         WHERE EXISTS (SELECT 1 FROM order_status_history WHERE id = ?)`,
      )
      .bind(
        crypto.randomUUID(),
        userId,
        "Order cancelled",
        `${order.orderNumber} has been cancelled.`,
        `/account?tab=orders&orderId=${encodeURIComponent(orderId)}`,
        now,
        historyId,
      ),
  );
  if (order.ownerId) {
    statements.push(
      db
        .prepare(
          `INSERT INTO notifications
            (id, user_id, audience, type, title, message, link, read_at, created_at)
           SELECT ?, ?, 'user', 'order', ?, ?, ?, NULL, ?
           WHERE EXISTS (SELECT 1 FROM order_status_history WHERE id = ?)`,
        )
        .bind(
          crypto.randomUUID(),
          order.ownerId,
          "Order cancelled by customer",
          `${order.orderNumber} was cancelled. Reason: ${reason}`,
          `/owner?tab=orders&orderId=${encodeURIComponent(orderId)}`,
          now,
          historyId,
        ),
    );
  }
  if (order.couponId) {
    statements.push(
      db
        .prepare(
          `DELETE FROM coupon_redemptions
           WHERE order_id = ? AND coupon_id = ? AND user_id = ?
             AND EXISTS (SELECT 1 FROM order_status_history WHERE id = ?)`,
        )
        .bind(orderId, order.couponId, userId, historyId),
      db
        .prepare(
          `UPDATE coupons SET used_count = MAX(used_count - 1, 0), updated_at = ?
           WHERE id = ? AND changes() = 1
             AND EXISTS (SELECT 1 FROM order_status_history WHERE id = ?)`,
        )
        .bind(now, order.couponId, historyId),
    );
  }
  const results = await db.batch(statements);
  if (Number(results[0]?.meta?.changes ?? 0) !== 1) {
    throw new HttpError(
      409,
      "This order can no longer be cancelled online.",
      "ORDER_NOT_CANCELLABLE",
    );
  }
  return { id: orderId, orderNumber: order.orderNumber, status: "cancelled" as const };
}

async function createSupportTicket(request: Request, userId: string, body: JsonBody) {
  await enforceRateLimit(request, `customer-support:${userId}`, 5, 3600);
  const db = getD1();
  const type = body.type === "complaint" ? "complaint" : "support";
  const priorityValues = new Set(["low", "normal", "high"]);
  const priorityRaw = body.priority ?? "normal";
  if (typeof priorityRaw !== "string" || !priorityValues.has(priorityRaw)) {
    throw new HttpError(400, "Choose a valid ticket priority.", "INVALID_PRIORITY");
  }
  const subject = cleanText(body.subject, "Subject", { min: 5, max: 120 });
  const message = cleanText(body.message, "Message", { min: 10, max: 2_000 });
  const storeId = cleanText(body.storeId, "Store", { required: false, max: 80 }) || null;
  const orderId = cleanText(body.orderId, "Order", { required: false, max: 80 }) || null;
  let resolvedStoreId = storeId;
  if (orderId) {
    const ownedOrder = await db
      .prepare("SELECT store_id AS storeId FROM orders WHERE id = ? AND user_id = ? LIMIT 1")
      .bind(orderId, userId)
      .first<{ storeId: string }>();
    if (!ownedOrder) throw new HttpError(404, "Order not found.", "ORDER_NOT_FOUND");
    if (storeId && storeId !== ownedOrder.storeId) {
      throw new HttpError(400, "Order does not belong to the selected shop.", "STORE_ORDER_MISMATCH");
    }
    resolvedStoreId = ownedOrder.storeId;
  } else if (storeId) {
    const store = await db
      .prepare("SELECT id FROM stores WHERE id = ? AND status = 'approved' LIMIT 1")
      .bind(storeId)
      .first();
    if (!store) throw new HttpError(404, "Shop not found.", "STORE_NOT_FOUND");
  }
  const id = crypto.randomUUID();
  const conversationId = crypto.randomUUID();
  const admin = await db.prepare("SELECT id FROM users WHERE role = 'admin' AND status = 'active' ORDER BY created_at ASC LIMIT 1").first<{ id: string }>();
  const now = nowSeconds();
  const statements = [
    db.prepare(
      `INSERT INTO support_tickets
        (id, user_id, store_id, order_id, assigned_to, type, subject, message,
         priority, status, resolution, created_at, updated_at)
       VALUES (?, ?, ?, ?, NULL, ?, ?, ?, ?, 'open', NULL, ?, ?)`,
    ).bind(
      id,
      userId,
      resolvedStoreId,
      orderId,
      type,
      subject,
      message,
      priorityRaw,
      now,
      now,
    ),
    db.prepare("INSERT INTO conversations (id, kind, store_id, support_ticket_id, subject, status, created_by, last_message_at, created_at, updated_at) VALUES (?, 'support', ?, ?, ?, 'pending', ?, ?, ?, ?)").bind(conversationId, resolvedStoreId, id, subject, userId, now, now, now),
    db.prepare("INSERT INTO conversation_participants (id, conversation_id, user_id, participant_role, last_read_at, joined_at) VALUES (?, ?, ?, 'customer', ?, ?)").bind(crypto.randomUUID(), conversationId, userId, now, now),
    db.prepare("INSERT INTO messages (id, conversation_id, sender_id, type, body, client_nonce, delivered_at, created_at) VALUES (?, ?, ?, 'text', ?, ?, ?, ?)").bind(crypto.randomUUID(), conversationId, userId, message, crypto.randomUUID(), now, now),
    db.prepare("INSERT INTO notifications (id, user_id, audience, type, title, message, link, created_at) VALUES (?, NULL, 'admin', 'support', 'New support request', ?, '/admin?tab=chat', ?)").bind(crypto.randomUUID(), subject, now),
  ];
  if (admin) statements.push(db.prepare("INSERT INTO conversation_participants (id, conversation_id, user_id, participant_role, last_read_at, joined_at) VALUES (?, ?, ?, 'admin', NULL, ?)").bind(crypto.randomUUID(), conversationId, admin.id, now));
  await db.batch(statements);
  return id;
}

export async function POST(request: Request) {
  try {
    const body = await safeJson(request);
    const action = actionInput(body, POST_PERMISSIONS);
    const session = await requireApiPermission(request, POST_PERMISSIONS[action], { csrf: true });
    const userId = session.user.id;

    if (action === "create_address") {
      if (body.isDefault !== undefined) strictBoolean(body.isDefault, "Default address");
      const id = await createAddress(userId, body);
      return noStoreJson({ ok: true, id }, { status: 201 });
    }
    if (action === "add_wishlist") {
      const productId = idInput(body.productId, "Product");
      await addWishlist(userId, productId);
      return noStoreJson({ ok: true, productId }, { status: 201 });
    }
    if (action === "add_cart") {
      const productId = idInput(body.productId, "Product");
      const quantity = numberInput(body.quantity ?? 1, "Quantity", {
        min: 1,
        max: 20,
        integer: true,
      }) as number;
      const newQuantity = await addCartItem(userId, productId, quantity);
      return noStoreJson({ ok: true, productId, quantity: newQuantity }, { status: 201 });
    }
    if (action === "place_order") {
      const order = await placeOrder(request, userId, body);
      return noStoreJson({ ok: true, order }, { status: 201 });
    }
    const id = await createSupportTicket(request, userId, body);
    return noStoreJson({ ok: true, id }, { status: 201 });
  } catch (error) {
    return apiError(error);
  }
}

export async function PATCH(request: Request) {
  try {
    const body = await safeJson(request);
    const action = actionInput(body, PATCH_PERMISSIONS);
    const session = await requireApiPermission(request, PATCH_PERMISSIONS[action], { csrf: true });
    const userId = session.user.id;
    const db = getD1();

    if (action === "update_profile") {
      const current = await db
        .prepare("SELECT name, phone FROM users WHERE id = ? LIMIT 1")
        .bind(userId)
        .first<{ name: string; phone: string | null }>();
      if (!current) throw new HttpError(404, "Customer profile not found.", "PROFILE_NOT_FOUND");
      const name =
        body.name === undefined
          ? current.name
          : cleanText(body.name, "Name", { min: 2, max: 100 });
      const phone =
        body.phone === undefined ? current.phone : phoneInput(body.phone, "Phone", false);
      const now = nowSeconds();
      await db
        .prepare("UPDATE users SET name = ?, phone = ?, updated_at = ? WHERE id = ?")
        .bind(name, phone, now, userId)
        .run();
      return noStoreJson({ ok: true, profile: { id: userId, name, phone } });
    }
    if (action === "update_address") {
      if (body.isDefault !== undefined) strictBoolean(body.isDefault, "Default address");
      const id = await updateAddress(userId, body);
      return noStoreJson({ ok: true, id });
    }
    if (action === "set_default_address") {
      const addressId = idInput(body.addressId, "Address");
      await setDefaultAddress(userId, addressId);
      return noStoreJson({ ok: true, id: addressId });
    }
    if (action === "update_cart") {
      const productId = idInput(body.productId, "Product");
      const quantity = numberInput(body.quantity, "Quantity", {
        min: 1,
        max: 20,
        integer: true,
      }) as number;
      await updateCartItem(userId, productId, quantity);
      return noStoreJson({ ok: true, productId, quantity });
    }
    if (action === "cancel_order") {
      await enforceRateLimit(request, `customer-cancel:${userId}`, 10, 3600);
      const order = await cancelOrder(userId, body);
      return noStoreJson({ ok: true, order });
    }
    if (action === "mark_notification_read") {
      const notificationId = idInput(body.notificationId, "Notification");
      const result = await db
        .prepare(
          "UPDATE notifications SET read_at = COALESCE(read_at, ?) WHERE id = ? AND user_id = ?",
        )
        .bind(nowSeconds(), notificationId, userId)
        .run();
      if (Number(result.meta.changes ?? 0) !== 1) {
        throw new HttpError(404, "Notification not found.", "NOTIFICATION_NOT_FOUND");
      }
      return noStoreJson({ ok: true, id: notificationId });
    }

    const current = await db
      .prepare(
        `SELECT COALESCE(up.email_notifications, 1) AS emailNotifications,
          COALESCE(up.order_notifications, 1) AS orderNotifications,
          COALESCE(up.marketing_notifications, 0) AS marketingNotifications
         FROM users u LEFT JOIN user_preferences up ON up.user_id = u.id WHERE u.id = ? LIMIT 1`,
      )
      .bind(userId)
      .first<{
        emailNotifications: number;
        orderNotifications: number;
        marketingNotifications: number;
      }>();
    const emailNotifications =
      body.emailNotifications === undefined
        ? Boolean(current?.emailNotifications ?? 1)
        : strictBoolean(body.emailNotifications, "Email notifications");
    const orderNotifications =
      body.orderNotifications === undefined
        ? Boolean(current?.orderNotifications ?? 1)
        : strictBoolean(body.orderNotifications, "Order notifications");
    const marketingNotifications =
      body.marketingNotifications === undefined
        ? Boolean(current?.marketingNotifications ?? 0)
        : strictBoolean(body.marketingNotifications, "Marketing notifications");
    const now = nowSeconds();
    await db
      .prepare(
        `INSERT INTO user_preferences
          (user_id, email_notifications, order_notifications, marketing_notifications, updated_at)
         VALUES (?, ?, ?, ?, ?)
         ON CONFLICT(user_id) DO UPDATE SET
           email_notifications = excluded.email_notifications,
           order_notifications = excluded.order_notifications,
           marketing_notifications = excluded.marketing_notifications,
           updated_at = excluded.updated_at`,
      )
      .bind(
        userId,
        emailNotifications ? 1 : 0,
        orderNotifications ? 1 : 0,
        marketingNotifications ? 1 : 0,
        now,
      )
      .run();
    return noStoreJson({
      ok: true,
      preferences: { emailNotifications, orderNotifications, marketingNotifications },
    });
  } catch (error) {
    return apiError(error);
  }
}

export async function DELETE(request: Request) {
  try {
    const body = await safeJson(request);
    const action = actionInput(body, DELETE_PERMISSIONS);
    const session = await requireApiPermission(request, DELETE_PERMISSIONS[action], { csrf: true });
    const userId = session.user.id;
    const db = getD1();

    if (action === "delete_address") {
      const addressId = idInput(body.addressId, "Address");
      await deleteAddress(userId, addressId);
      return noStoreJson({ ok: true, id: addressId });
    }
    if (action === "remove_wishlist") {
      const productId = idInput(body.productId, "Product");
      await db
        .prepare("DELETE FROM wishlist_items WHERE user_id = ? AND product_id = ?")
        .bind(userId, productId)
        .run();
      return noStoreJson({ ok: true, productId });
    }
    const productId = idInput(body.productId, "Product");
    await db
      .prepare("DELETE FROM cart_items WHERE user_id = ? AND product_id = ?")
      .bind(userId, productId)
      .run();
    return noStoreJson({ ok: true, productId });
  } catch (error) {
    return apiError(error);
  }
}
