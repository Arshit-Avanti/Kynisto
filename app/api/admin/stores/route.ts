import { getD1 } from "@/db/runtime";
import { requireApiPermission } from "@/lib/auth";
import { writeAudit } from "@/lib/ownership";
import { apiError, HttpError } from "@/lib/security";
import { parseStoreInput } from "@/lib/store-input";
import { cleanText, d1SearchText, safeJson, slugify } from "@/lib/validation";

function cleanIdList(value: unknown, label: string): string[] {
  if (!Array.isArray(value)) throw new HttpError(400, `Choose at least one ${label.toLowerCase()}.`, "SELECTION_REQUIRED");
  const ids = [...new Set(value.map((item) => cleanText(item, label, { max: 80 })))];
  if (!ids.length) throw new HttpError(400, `Choose at least one ${label.toLowerCase()}.`, "SELECTION_REQUIRED");
  if (ids.length > 50) throw new HttpError(400, `You can update up to 50 ${label.toLowerCase()}s at once.`, "SELECTION_TOO_LARGE");
  return ids;
}

async function verifyCategories(categoryId: string, subcategoryId: string | null) {
  const category = await getD1()
    .prepare("SELECT id FROM categories WHERE id = ? AND parent_id IS NULL AND status = 'active'")
    .bind(categoryId)
    .first();
  if (!category) throw new HttpError(400, "Choose a valid category.", "INVALID_CATEGORY");
  if (subcategoryId) {
    const child = await getD1()
      .prepare("SELECT id FROM categories WHERE id = ? AND parent_id = ? AND status = 'active'")
      .bind(subcategoryId, categoryId)
      .first();
    if (!child) throw new HttpError(400, "Choose a valid subcategory.", "INVALID_SUBCATEGORY");
  }
}

export async function GET(request: Request) {
  try {
    await requireApiPermission(request, "stores.manage_all");
    const url = new URL(request.url);
    const query = d1SearchText((url.searchParams.get("q") ?? "").replace(/[%_]/g, "").trim());
    const status = url.searchParams.get("status");
    const page = Math.max(1, Number(url.searchParams.get("page")) || 1);
    const limit = Math.min(50, Math.max(1, Number(url.searchParams.get("limit")) || 20));
    const conditions = ["1 = 1"];
    const bindings: unknown[] = [];
    if (query) {
      conditions.push("(s.name LIKE ? OR s.address LIKE ? OR s.area LIKE ? OR s.postal_code LIKE ? OR c.name LIKE ?)");
      bindings.push(...Array(5).fill(`%${query}%`));
    }
    if (["pending", "approved", "rejected", "suspended"].includes(status ?? "")) {
      conditions.push("s.status = ?");
      bindings.push(status);
    }
    const where = conditions.join(" AND ");
    const db = getD1();
    const [items, total, owners] = await Promise.all([
      db.prepare(`SELECT s.id, s.name, s.slug, s.description, s.business_type AS businessType,
        s.category_id AS categoryId, s.subcategory_id AS subcategoryId, s.address, s.area, s.city,
        s.state, s.country, s.postal_code AS postalCode, s.latitude, s.longitude,
        s.google_maps_url AS googleMapsUrl, s.phone, s.whatsapp, s.email, s.website,
        s.business_hours AS businessHours, s.opening_days AS openingDays,
        s.status, s.rating_average AS rating, s.rating_count AS reviewCount,
        s.created_at AS createdAt, s.updated_at AS updatedAt, s.rejection_reason AS rejectionReason,
        c.name AS category, s.owner_id AS ownerId, u.name AS ownerName, u.email AS ownerEmail
        FROM stores s JOIN categories c ON c.id = s.category_id LEFT JOIN users u ON u.id = s.owner_id
        WHERE ${where} ORDER BY CASE s.status WHEN 'pending' THEN 0 ELSE 1 END, s.created_at DESC
        LIMIT ? OFFSET ?`).bind(...bindings, limit, (page - 1) * limit).all(),
      db.prepare(`SELECT COUNT(*) AS total FROM stores s JOIN categories c ON c.id = s.category_id WHERE ${where}`).bind(...bindings).first<{ total: number }>(),
      db.prepare("SELECT id, name, email FROM users WHERE role = 'store_owner' AND status = 'active' ORDER BY name ASC LIMIT 200").all(),
    ]);
    return Response.json({ items: items.results ?? [], owners: owners.results ?? [], pagination: { page, limit, total: total?.total ?? 0 } }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    return apiError(error);
  }
}

export async function POST(request: Request) {
  try {
    const session = await requireApiPermission(request, "stores.manage_all", { csrf: true });
    const body = await safeJson(request);
    const input = parseStoreInput(body);
    await verifyCategories(input.categoryId, input.subcategoryId);
    const ownerId = cleanText(body.ownerId, "Owner", { max: 80, required: false }) || null;
    if (ownerId) {
      const owner = await getD1().prepare("SELECT id FROM users WHERE id = ? AND role = 'store_owner' AND status = 'active'").bind(ownerId).first();
      if (!owner) throw new HttpError(400, "Choose an active store owner.", "INVALID_OWNER");
    }
    const storeId = crypto.randomUUID();
    const now = Math.floor(Date.now() / 1000);
    const status = body.status === "pending" ? "pending" : "approved";
    await getD1().prepare(`INSERT INTO stores (id, owner_id, category_id, subcategory_id, name, slug, description, business_type, address, area, city, state, country, postal_code, latitude, longitude, google_maps_url, phone, whatsapp, email, website, business_hours, opening_days, status, approved_at, approved_by, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`)
      .bind(storeId, ownerId, input.categoryId, input.subcategoryId, input.name, `${slugify(input.name)}-${storeId.slice(0, 6)}`, input.description, input.businessType, input.address, input.area, input.city, input.state, input.country, input.postalCode, input.latitude, input.longitude, input.googleMapsUrl, input.phone, input.whatsapp, input.email, input.website, input.businessHours, input.openingDays, status, status === "approved" ? now : null, status === "approved" ? session.user.id : null, now, now).run();
    await writeAudit(request, session.user.id, "store.admin_created", "store", storeId, { status, ownerId });
    return Response.json({ storeId }, { status: 201 });
  } catch (error) {
    return apiError(error);
  }
}

export async function PATCH(request: Request) {
  try {
    const session = await requireApiPermission(request, "stores.manage_all", { csrf: true });
    const body = await safeJson(request);
    const action = cleanText(body.action, "Action", { max: 30 });
    const now = Math.floor(Date.now() / 1000);
    const db = getD1();

    if (action === "bulk") {
      const storeIds = cleanIdList(body.storeIds, "Store");
      const placeholders = storeIds.map(() => "?").join(",");
      const found = await db.prepare(`SELECT COUNT(*) AS total FROM stores WHERE id IN (${placeholders})`).bind(...storeIds).first<{ total: number }>();
      if (Number(found?.total ?? 0) !== storeIds.length) throw new HttpError(404, "One or more stores no longer exist.", "STORE_NOT_FOUND");
      const operation = cleanText(body.operation, "Bulk action", { max: 30 });
      if (operation === "approve") {
        await db.prepare(`UPDATE stores SET status = 'approved', rejection_reason = NULL, approved_at = ?, approved_by = ?, updated_at = ? WHERE id IN (${placeholders})`).bind(now, session.user.id, now, ...storeIds).run();
      } else if (operation === "assign") {
        const ownerId = cleanText(body.ownerId, "Owner", { max: 80, required: false }) || null;
        if (ownerId) {
          const owner = await db.prepare("SELECT id FROM users WHERE id = ? AND role = 'store_owner' AND status = 'active'").bind(ownerId).first();
          if (!owner) throw new HttpError(400, "Choose an active store owner.", "INVALID_OWNER");
        }
        await db.prepare(`UPDATE stores SET owner_id = ?, updated_at = ? WHERE id IN (${placeholders})`).bind(ownerId, now, ...storeIds).run();
      } else if (operation === "pending" || operation === "suspend") {
        const status = operation === "suspend" ? "suspended" : "pending";
        const reason = operation === "suspend" ? cleanText(body.reason, "Suspension reason", { min: 5, max: 500 }) : null;
        await db.prepare(`UPDATE stores SET status = ?, rejection_reason = ?, approved_at = CASE WHEN ? = 'pending' THEN NULL ELSE approved_at END, approved_by = CASE WHEN ? = 'pending' THEN NULL ELSE approved_by END, updated_at = ? WHERE id IN (${placeholders})`)
          .bind(status, reason, status, status, now, ...storeIds).run();
      } else {
        throw new HttpError(400, "Unsupported bulk store action.", "INVALID_ACTION");
      }
      await writeAudit(request, session.user.id, `store.bulk_${operation}`, "store", storeIds[0], { storeIds, count: storeIds.length, ownerId: body.ownerId, reason: body.reason });
      return Response.json({ ok: true, count: storeIds.length });
    }

    const storeId = cleanText(body.storeId, "Store", { max: 80 });
    const existing = await db.prepare("SELECT id FROM stores WHERE id = ? LIMIT 1").bind(storeId).first();
    if (!existing) throw new HttpError(404, "Store not found.", "STORE_NOT_FOUND");
    if (action === "approve") {
      await db.prepare("UPDATE stores SET status = 'approved', rejection_reason = NULL, approved_at = ?, approved_by = ?, updated_at = ? WHERE id = ?").bind(now, session.user.id, now, storeId).run();
    } else if (action === "reject") {
      const reason = cleanText(body.reason, "Rejection reason", { min: 5, max: 500 });
      await db.prepare("UPDATE stores SET status = 'rejected', rejection_reason = ?, approved_at = NULL, approved_by = NULL, updated_at = ? WHERE id = ?").bind(reason, now, storeId).run();
    } else if (action === "suspend") {
      const reason = cleanText(body.reason, "Suspension reason", { min: 5, max: 500 });
      await db.prepare("UPDATE stores SET status = 'suspended', rejection_reason = ?, updated_at = ? WHERE id = ?").bind(reason, now, storeId).run();
    } else if (action === "assign") {
      const ownerId = cleanText(body.ownerId, "Owner", { max: 80, required: false }) || null;
      if (ownerId) {
        const owner = await db.prepare("SELECT id FROM users WHERE id = ? AND role = 'store_owner' AND status = 'active'").bind(ownerId).first();
        if (!owner) throw new HttpError(400, "Choose an active store owner.", "INVALID_OWNER");
      }
      await db.prepare("UPDATE stores SET owner_id = ?, updated_at = ? WHERE id = ?").bind(ownerId, now, storeId).run();
    } else if (action === "update") {
      const input = parseStoreInput(body);
      await verifyCategories(input.categoryId, input.subcategoryId);
      const ownerId = cleanText(body.ownerId, "Owner", { max: 80, required: false }) || null;
      if (ownerId) {
        const owner = await db.prepare("SELECT id FROM users WHERE id = ? AND role = 'store_owner' AND status = 'active'").bind(ownerId).first();
        if (!owner) throw new HttpError(400, "Choose an active store owner.", "INVALID_OWNER");
      }
      await db.prepare(`UPDATE stores SET owner_id = ?, category_id = ?, subcategory_id = ?, name = ?,
        description = ?, business_type = ?, address = ?, area = ?, city = ?, state = ?, country = ?,
        postal_code = ?, latitude = ?, longitude = ?, google_maps_url = ?, phone = ?, whatsapp = ?,
        email = ?, website = ?, business_hours = ?, opening_days = ?, updated_at = ? WHERE id = ?`)
        .bind(ownerId, input.categoryId, input.subcategoryId, input.name, input.description,
          input.businessType, input.address, input.area, input.city, input.state, input.country,
          input.postalCode, input.latitude, input.longitude, input.googleMapsUrl, input.phone,
          input.whatsapp, input.email, input.website, input.businessHours, input.openingDays, now, storeId)
        .run();
    } else {
      throw new HttpError(400, "Unsupported store action.", "INVALID_ACTION");
    }
    await writeAudit(request, session.user.id, `store.${action}`, "store", storeId, { reason: body.reason, ownerId: body.ownerId });
    return Response.json({ ok: true });
  } catch (error) {
    return apiError(error);
  }
}

export async function DELETE(request: Request) {
  try {
    const session = await requireApiPermission(request, "stores.manage_all", { csrf: true });
    const body = await safeJson(request);
    const bulk = body.action === "bulk_delete";
    const storeIds = bulk ? cleanIdList(body.storeIds, "Store") : [cleanText(body.storeId, "Store", { max: 80 })];
    const placeholders = storeIds.map(() => "?").join(",");
    const stores = await getD1().prepare(
      `SELECT id, name, (SELECT COUNT(*) FROM orders WHERE store_id = stores.id) AS orderCount FROM stores WHERE id IN (${placeholders})`,
    ).bind(...storeIds).all<{ id: string; name: string; orderCount: number }>();
    const found = stores.results ?? [];
    if (found.length !== storeIds.length) throw new HttpError(404, "One or more stores were not found.", "STORE_NOT_FOUND");
    if (found.some((store) => Number(store.orderCount) > 0)) {
      throw new HttpError(409, "Stores with order history must be suspended instead of deleted.", "STORE_HAS_ORDERS");
    }
    await getD1().prepare(`DELETE FROM stores WHERE id IN (${placeholders})`).bind(...storeIds).run();
    await writeAudit(request, session.user.id, bulk ? "store.bulk_deleted" : "store.deleted", "store", storeIds[0], { storeIds, names: found.map((store) => store.name) });
    return Response.json({ ok: true, count: storeIds.length });
  } catch (error) {
    return apiError(error);
  }
}
