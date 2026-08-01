import { getD1 } from "@/db/runtime";
import { requireApiPermission } from "@/lib/auth";
import { requireOwnedStore, writeAudit } from "@/lib/ownership";
import { apiError, HttpError } from "@/lib/security";
import { systemBoolean } from "@/lib/settings";
import { parseStoreInput } from "@/lib/store-input";
import { cleanText, safeJson, slugify } from "@/lib/validation";

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

export async function POST(request: Request) {
  try {
    const session = await requireApiPermission(request, "store.manage_own", { csrf: true });
    const input = parseStoreInput(await safeJson(request));
    await verifyCategories(input.categoryId, input.subcategoryId);
    const db = getD1();
    const now = Math.floor(Date.now() / 1000);
    const autoApprove = await systemBoolean("owner_auto_approval", false);
    const status = autoApprove ? "approved" : "pending";
    const storeId = crypto.randomUUID();
    const slug = `${slugify(input.name)}-${crypto.randomUUID().slice(0, 6)}`;
    await db.batch([
      db.prepare(
        `INSERT INTO stores
         (id, owner_id, category_id, subcategory_id, name, slug, description, business_type,
          address, area, city, state, country, postal_code, latitude, longitude, google_maps_url,
          phone, whatsapp, email, website, business_hours, opening_days, status, approved_at, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      )
      .bind(
        storeId,
        session.user.id,
        input.categoryId,
        input.subcategoryId,
        input.name,
        slug,
        input.description,
        input.businessType,
        input.address,
        input.area,
        input.city,
        input.state,
        input.country,
        input.postalCode,
        input.latitude,
        input.longitude,
        input.googleMapsUrl,
        input.phone,
        input.whatsapp,
        input.email,
        input.website,
        input.businessHours,
        input.openingDays,
        status,
        autoApprove ? now : null,
        now,
        now,
      ),
      db.prepare(
        "INSERT INTO store_settings (store_id, accepting_orders, pickup_enabled, delivery_enabled, minimum_order, delivery_fee, delivery_radius_km, auto_accept_orders, updated_at) VALUES (?, 1, 1, 1, 0, 0, 5, 0, ?)",
      ).bind(storeId, now),
    ]);
    await writeAudit(request, session.user.id, "store.created", "store", storeId, { status, autoApproved: autoApprove });
    return Response.json({ storeId, status }, { status: 201 });
  } catch (error) {
    return apiError(error);
  }
}

export async function PATCH(request: Request) {
  try {
    const session = await requireApiPermission(request, "store.manage_own", { csrf: true });
    const body = await safeJson(request);
    const storeId = cleanText(body.storeId, "Store", { max: 80 });
    const currentStore = await requireOwnedStore(session.user.id, storeId);
    const input = parseStoreInput(body);
    await verifyCategories(input.categoryId, input.subcategoryId);
    await getD1()
      .prepare(
        `UPDATE stores SET category_id = ?, subcategory_id = ?, name = ?, description = ?, business_type = ?,
          address = ?, area = ?, city = ?, state = ?, country = ?, postal_code = ?, latitude = ?, longitude = ?,
          google_maps_url = ?, phone = ?, whatsapp = ?, email = ?, website = ?, business_hours = ?, opening_days = ?,
          status = CASE WHEN status IN ('rejected', 'approved') THEN 'pending' ELSE status END,
          rejection_reason = CASE WHEN status IN ('rejected', 'approved') THEN NULL ELSE rejection_reason END,
          approved_at = CASE WHEN status = 'approved' THEN NULL ELSE approved_at END,
          approved_by = CASE WHEN status = 'approved' THEN NULL ELSE approved_by END,
          updated_at = ? WHERE id = ? AND owner_id = ?`,
      )
      .bind(
        input.categoryId,
        input.subcategoryId,
        input.name,
        input.description,
        input.businessType,
        input.address,
        input.area,
        input.city,
        input.state,
        input.country,
        input.postalCode,
        input.latitude,
        input.longitude,
        input.googleMapsUrl,
        input.phone,
        input.whatsapp,
        input.email,
        input.website,
        input.businessHours,
        input.openingDays,
        Math.floor(Date.now() / 1000),
        storeId,
        session.user.id,
      )
      .run();
    const resubmitted = currentStore.status === "approved" || currentStore.status === "rejected";
    await writeAudit(request, session.user.id, resubmitted ? "store.resubmitted" : "store.updated", "store", storeId, { status: resubmitted ? "pending" : currentStore.status });
    return Response.json({ ok: true, status: resubmitted ? "pending" : currentStore.status });
  } catch (error) {
    return apiError(error);
  }
}

export async function DELETE(request: Request) {
  try {
    const session = await requireApiPermission(request, "store.manage_own", { csrf: true });
    const body = await safeJson(request);
    const storeId = cleanText(body.storeId, "Store", { max: 80 });
    await requireOwnedStore(session.user.id, storeId);
    const store = await getD1()
      .prepare("SELECT status FROM stores WHERE id = ? AND owner_id = ?")
      .bind(storeId, session.user.id)
      .first<{ status: string }>();
    if (store?.status === "approved") {
      throw new HttpError(409, "Contact an administrator to delete an approved business.", "ADMIN_REQUIRED");
    }
    await getD1().prepare("DELETE FROM stores WHERE id = ? AND owner_id = ?").bind(storeId, session.user.id).run();
    await writeAudit(request, session.user.id, "store.deleted", "store", storeId);
    return Response.json({ ok: true });
  } catch (error) {
    return apiError(error);
  }
}
