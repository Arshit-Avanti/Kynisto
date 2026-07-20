import { getD1, getMediaBucket } from "@/db/runtime";
import { requireApiPermission } from "@/lib/auth";
import { requireOwnedStore, writeAudit } from "@/lib/ownership";
import { apiError, HttpError } from "@/lib/security";
import { systemCurrency } from "@/lib/settings";
import { cleanText, numberInput, safeJson, slugify } from "@/lib/validation";

type Resource = "products" | "services" | "offers";

function resourceInput(value: unknown): Resource {
  if (value === "products" || value === "services" || value === "offers") return value;
  throw new HttpError(400, "Choose a valid catalogue type.", "INVALID_RESOURCE");
}

function resourceStatusInput(resource: Resource, value: unknown): string {
  const allowed = resource === "offers" ? ["active", "draft", "expired"] : ["active", "draft", "archived"];
  if (typeof value === "string" && allowed.includes(value)) return value;
  throw new HttpError(400, `Choose a valid ${resource.slice(0, -1)} status.`, "INVALID_STATUS");
}

export async function GET(request: Request) {
  try {
    const session = await requireApiPermission(request, "products.manage_own");
    const url = new URL(request.url);
    const resource = resourceInput(url.searchParams.get("resource"));
    const storeId = cleanText(url.searchParams.get("storeId"), "Store", { max: 80 });
    await requireOwnedStore(session.user.id, storeId);
    const result = await getD1()
      .prepare(`SELECT * FROM ${resource} WHERE store_id = ? ORDER BY created_at DESC`)
      .bind(storeId)
      .all();
    return Response.json({ items: result.results ?? [] }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    return apiError(error);
  }
}

export async function POST(request: Request) {
  try {
    const session = await requireApiPermission(request, "products.manage_own", { csrf: true });
    const body = await safeJson(request);
    const resource = resourceInput(body.resource);
    const storeId = cleanText(body.storeId, "Store", { max: 80 });
    await requireOwnedStore(session.user.id, storeId);
    const id = crypto.randomUUID();
    const now = Math.floor(Date.now() / 1000);
    if (resource === "products") {
      const name = cleanText(body.name, "Product name", { min: 2, max: 120 });
      const description = cleanText(body.description, "Description", { max: 1200, required: false });
      const price = numberInput(body.price, "Price", { min: 0, max: 10_000_000, required: false });
      const currency = await systemCurrency();
      const db = getD1();
      await db.batch([
        db.prepare("INSERT INTO products (id, store_id, name, slug, description, price, currency, status, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, 'active', ?, ?)")
          .bind(id, storeId, name, `${slugify(name)}-${id.slice(0, 5)}`, description, price, currency, now, now),
        db.prepare("INSERT INTO inventory (product_id, store_id, sku, quantity, reserved_quantity, low_stock_threshold, updated_at) VALUES (?, ?, ?, 0, 0, 5, ?)")
          .bind(id, storeId, `NN-${id.slice(0, 8).toUpperCase()}`, now),
      ]);
    } else if (resource === "services") {
      const name = cleanText(body.name, "Service name", { min: 2, max: 120 });
      const description = cleanText(body.description, "Description", { max: 1200, required: false });
      const priceFrom = numberInput(body.priceFrom, "Starting price", { min: 0, max: 10_000_000, required: false });
      const duration = numberInput(body.durationMinutes, "Duration", { min: 1, max: 1440, integer: true, required: false });
      await getD1()
        .prepare("INSERT INTO services (id, store_id, name, slug, description, price_from, duration_minutes, status, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, 'active', ?, ?)")
        .bind(id, storeId, name, `${slugify(name)}-${id.slice(0, 5)}`, description, priceFrom, duration, now, now)
        .run();
    } else {
      const title = cleanText(body.title, "Offer title", { min: 2, max: 120 });
      const description = cleanText(body.description, "Description", { max: 1200, required: false });
      const code = cleanText(body.code, "Offer code", { max: 40, required: false }) || null;
      const endsAt = numberInput(body.endsAt, "End date", { min: now, integer: true, required: false });
      await getD1()
        .prepare("INSERT INTO offers (id, store_id, title, description, code, starts_at, ends_at, status, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, 'active', ?, ?)")
        .bind(id, storeId, title, description, code, now, endsAt, now, now)
        .run();
    }
    await writeAudit(request, session.user.id, `${resource}.created`, resource, id, { storeId });
    return Response.json({ id }, { status: 201 });
  } catch (error) {
    return apiError(error);
  }
}

export async function PATCH(request: Request) {
  try {
    const session = await requireApiPermission(request, "products.manage_own", { csrf: true });
    const body = await safeJson(request);
    const resource = resourceInput(body.resource);
    const storeId = cleanText(body.storeId, "Store", { max: 80 });
    const id = cleanText(body.id, "Item", { max: 80 });
    await requireOwnedStore(session.user.id, storeId);
    const owned = await getD1()
      .prepare(`SELECT ${resource}.id FROM ${resource} JOIN stores ON stores.id = ${resource}.store_id WHERE ${resource}.id = ? AND ${resource}.store_id = ? AND stores.owner_id = ?`)
      .bind(id, storeId, session.user.id)
      .first();
    if (!owned) throw new HttpError(404, "Catalogue item not found.", "ITEM_NOT_FOUND");
    const status = resourceStatusInput(resource, body.status);
    const now = Math.floor(Date.now() / 1000);
    if (resource === "offers") {
      const title = cleanText(body.title, "Offer title", { min: 2, max: 120 });
      const description = cleanText(body.description, "Description", { max: 1200, required: false });
      await getD1().prepare("UPDATE offers SET title = ?, description = ?, code = ?, status = ?, updated_at = ? WHERE id = ? AND store_id = ?").bind(title, description, cleanText(body.code, "Code", { max: 40, required: false }) || null, status, now, id, storeId).run();
    } else if (resource === "products") {
      const name = cleanText(body.name, "Product name", { min: 2, max: 120 });
      await getD1().prepare("UPDATE products SET name = ?, description = ?, price = ?, status = ?, updated_at = ? WHERE id = ? AND store_id = ?").bind(name, cleanText(body.description, "Description", { max: 1200, required: false }), numberInput(body.price, "Price", { min: 0, max: 10_000_000, required: false }), status, now, id, storeId).run();
    } else {
      const name = cleanText(body.name, "Service name", { min: 2, max: 120 });
      await getD1().prepare("UPDATE services SET name = ?, description = ?, price_from = ?, duration_minutes = ?, status = ?, updated_at = ? WHERE id = ? AND store_id = ?").bind(name, cleanText(body.description, "Description", { max: 1200, required: false }), numberInput(body.priceFrom, "Price", { min: 0, max: 10_000_000, required: false }), numberInput(body.durationMinutes, "Duration", { min: 1, max: 1440, integer: true, required: false }), status, now, id, storeId).run();
    }
    await writeAudit(request, session.user.id, `${resource}.updated`, resource, id, { storeId });
    return Response.json({ ok: true });
  } catch (error) {
    return apiError(error);
  }
}

export async function DELETE(request: Request) {
  try {
    const session = await requireApiPermission(request, "products.manage_own", { csrf: true });
    const body = await safeJson(request);
    const resource = resourceInput(body.resource);
    const storeId = cleanText(body.storeId, "Store", { max: 80 });
    const id = cleanText(body.id, "Item", { max: 80 });
    await requireOwnedStore(session.user.id, storeId);
    let productImageKey: string | null = null;
    let catalogMediaKeys: string[] = [];
    if (resource === "products") {
      const product = await getD1().prepare("SELECT image_key AS imageKey FROM products WHERE id = ? AND store_id = ? LIMIT 1")
        .bind(id, storeId).first<{ imageKey: string | null }>();
      if (!product) throw new HttpError(404, "Product not found.", "PRODUCT_NOT_FOUND");
      productImageKey = product.imageKey;
    }
    if (resource === "products" || resource === "services") {
      const column = resource === "products" ? "product_id" : "service_id";
      const media = await getD1().prepare(
        `SELECT object_key AS objectKey, thumbnail_key AS thumbnailKey FROM media_assets WHERE ${column} = ? AND store_id = ?`,
      ).bind(id, storeId).all<{ objectKey: string; thumbnailKey: string | null }>();
      catalogMediaKeys = (media.results ?? []).flatMap((asset) => [asset.objectKey, asset.thumbnailKey].filter((key): key is string => Boolean(key)));
    }
    const statements = [getD1().prepare(`DELETE FROM ${resource} WHERE id = ? AND store_id = ?`).bind(id, storeId)];
    if (productImageKey) statements.push(getD1().prepare("DELETE FROM store_images WHERE object_key = ?").bind(productImageKey));
    await getD1().batch(statements);
    const objectKeys = [...new Set([productImageKey, ...catalogMediaKeys].filter((key): key is string => Boolean(key)))];
    if (objectKeys.length) {
      try { await Promise.all(objectKeys.map((key) => getMediaBucket().delete(key))); }
      catch (cleanupError) { console.error("Could not remove deleted product image", cleanupError); }
    }
    await writeAudit(request, session.user.id, `${resource}.deleted`, resource, id, { storeId });
    return Response.json({ ok: true });
  } catch (error) {
    return apiError(error);
  }
}
