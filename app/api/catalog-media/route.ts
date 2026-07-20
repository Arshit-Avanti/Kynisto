import { getD1, getMediaBucket } from "@/db/runtime";
import { requireApiPermission } from "@/lib/auth";
import { mediaChecksum, optionalInteger, safeMediaName, validateMediaFile, verifyMediaSignature } from "@/lib/media";
import { requireOwnedStore, writeAudit } from "@/lib/ownership";
import { apiError, enforceRateLimit, HttpError } from "@/lib/security";
import { cleanText, safeJson } from "@/lib/validation";

type OwnerType = "product" | "service";
type CatalogItem = { id: string; storeId: string; name: string; imageKey: string | null };
type MediaRow = {
  id: string;
  objectKey: string;
  thumbnailKey: string | null;
  publicUrl: string;
  thumbnailUrl: string | null;
  ownerType: OwnerType;
  productId: string | null;
  serviceId: string | null;
  storeId: string;
  mediaType: "image" | "video";
  contentType: string;
  originalName: string;
  caption: string | null;
  altText: string | null;
  sizeBytes: number;
  width: number | null;
  height: number | null;
  durationSeconds: number | null;
  sortOrder: number;
  featured: number;
  cropX: number;
  cropY: number;
};

function ownerTypeInput(value: unknown): OwnerType {
  if (value === "product" || value === "service") return value;
  throw new HttpError(400, "Choose product or service media.", "INVALID_MEDIA_OWNER");
}

async function catalogItem(ownerType: OwnerType, itemId: string, storeId: string): Promise<CatalogItem> {
  const table = ownerType === "product" ? "products" : "services";
  const item = await getD1().prepare(
    `SELECT id, store_id AS storeId, name, image_key AS imageKey FROM ${table} WHERE id = ? AND store_id = ? LIMIT 1`,
  ).bind(itemId, storeId).first<CatalogItem>();
  if (!item) throw new HttpError(404, `${ownerType === "product" ? "Product" : "Service"} not found for this shop.`, "ITEM_NOT_FOUND");
  return item;
}

async function authorize(request: Request, csrf = false) {
  const session = await requireApiPermission(request, "media.manage", csrf ? { csrf: true } : undefined);
  return session;
}

async function authorizeStore(request: Request, storeId: string, csrf = false) {
  const session = await authorize(request, csrf);
  if (session.user.role === "store_owner") await requireOwnedStore(session.user.id, storeId);
  return session;
}

function itemColumn(ownerType: OwnerType) {
  return ownerType === "product" ? "product_id" : "service_id";
}

async function replaceFeatured(ownerType: OwnerType, itemId: string, storeId: string, asset: MediaRow | null) {
  const table = ownerType === "product" ? "products" : "services";
  const now = Math.floor(Date.now() / 1000);
  await getD1().batch([
    getD1().prepare(`UPDATE media_assets SET featured = 0 WHERE ${itemColumn(ownerType)} = ?`).bind(itemId),
    ...(asset ? [getD1().prepare("UPDATE media_assets SET featured = 1 WHERE id = ?").bind(asset.id)] : []),
    getD1().prepare(`UPDATE ${table} SET image_key = ?, image_url = ?, updated_at = ? WHERE id = ? AND store_id = ?`)
      .bind(asset?.objectKey ?? null, asset?.publicUrl ?? null, now, itemId, storeId),
  ]);
}

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const ownerType = ownerTypeInput(url.searchParams.get("ownerType"));
    const itemId = cleanText(url.searchParams.get("itemId"), "Item", { max: 80 });
    const storeId = cleanText(url.searchParams.get("storeId"), "Store", { max: 80 });
    await authorizeStore(request, storeId);
    await catalogItem(ownerType, itemId, storeId);
    const result = await getD1().prepare(
      `SELECT id, object_key AS objectKey, thumbnail_key AS thumbnailKey,
        public_url AS publicUrl, thumbnail_url AS thumbnailUrl, owner_type AS ownerType,
        product_id AS productId, service_id AS serviceId, store_id AS storeId,
        media_type AS mediaType, content_type AS contentType, original_name AS originalName,
        caption, alt_text AS altText, size_bytes AS sizeBytes, width, height,
        duration_seconds AS durationSeconds, sort_order AS sortOrder, featured, crop_x AS cropX,
        crop_y AS cropY
       FROM media_assets WHERE owner_type = ? AND ${itemColumn(ownerType)} = ?
       ORDER BY featured DESC, sort_order ASC, created_at ASC`,
    ).bind(ownerType, itemId).all<MediaRow>();
    return Response.json({ items: result.results ?? [] }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    return apiError(error);
  }
}

export async function POST(request: Request) {
  let objectKey = "";
  let thumbnailKey = "";
  let committed = false;
  try {
    const session = await authorize(request, true);
    await enforceRateLimit(request, `catalog-media:${session.user.id}`, 60, 60 * 60);
    const form = await request.formData();
    const ownerType = ownerTypeInput(form.get("ownerType"));
    const itemId = cleanText(form.get("itemId"), "Item", { max: 80 });
    const storeId = cleanText(form.get("storeId"), "Store", { max: 80 });
    if (session.user.role === "store_owner") await requireOwnedStore(session.user.id, storeId);
    const item = await catalogItem(ownerType, itemId, storeId);
    const file = form.get("file");
    if (!(file instanceof File)) throw new HttpError(400, "Choose an image or video.", "FILE_REQUIRED");
    const descriptor = validateMediaFile(file);
    if (!await verifyMediaSignature(file)) throw new HttpError(415, "The selected file does not match its media format.", "INVALID_MEDIA_CONTENT");
    const checksum = await mediaChecksum(file);
    const column = itemColumn(ownerType);
    const duplicate = await getD1().prepare(
      `SELECT id FROM media_assets WHERE owner_type = ? AND ${column} = ? AND checksum = ? LIMIT 1`,
    ).bind(ownerType, itemId, checksum).first();
    if (duplicate) throw new HttpError(409, "This media is already in the gallery.", "DUPLICATE_MEDIA");
    const count = await getD1().prepare(
      `SELECT COUNT(*) AS total FROM media_assets WHERE owner_type = ? AND ${column} = ? AND media_type = ?`,
    ).bind(ownerType, itemId, descriptor.mediaType).first<{ total: number }>();
    const limit = descriptor.mediaType === "image" ? 12 : 4;
    if (Number(count?.total ?? 0) >= limit) throw new HttpError(409, `A ${ownerType} can have up to ${limit} ${descriptor.mediaType}s.`, "MEDIA_LIMIT");

    const mediaId = crypto.randomUUID();
    objectKey = `stores/${storeId}/${ownerType}s/${itemId}/${mediaId}.${descriptor.extension}`;
    await getMediaBucket().put(objectKey, file.stream(), {
      httpMetadata: { contentType: file.type, cacheControl: "public, max-age=31536000, immutable" },
      customMetadata: { storeId, ownerType, itemId, uploadedBy: session.user.id, checksum },
    });
    const publicUrl = `/media/${objectKey}`;
    const thumbnail = form.get("thumbnail");
    if (thumbnail instanceof File && thumbnail.size > 0) {
      const thumbnailDescriptor = validateMediaFile(thumbnail);
      if (thumbnailDescriptor.mediaType !== "image" || !await verifyMediaSignature(thumbnail)) {
        throw new HttpError(415, "Video thumbnail must be a valid image.", "INVALID_THUMBNAIL");
      }
      thumbnailKey = `stores/${storeId}/${ownerType}s/${itemId}/${mediaId}-thumbnail.${thumbnailDescriptor.extension}`;
      await getMediaBucket().put(thumbnailKey, thumbnail.stream(), {
        httpMetadata: { contentType: thumbnail.type, cacheControl: "public, max-age=31536000, immutable" },
        customMetadata: { storeId, ownerType, itemId, uploadedBy: session.user.id, thumbnail: "true" },
      });
    }
    const thumbnailUrl = thumbnailKey ? `/media/${thumbnailKey}` : null;
    const currentMax = await getD1().prepare(
      `SELECT COALESCE(MAX(sort_order), -1) AS maximum FROM media_assets WHERE owner_type = ? AND ${column} = ?`,
    ).bind(ownerType, itemId).first<{ maximum: number }>();
    const featuredRequested = form.get("featured") === "true";
    const hasFeatured = await getD1().prepare(
      `SELECT id FROM media_assets WHERE owner_type = ? AND ${column} = ? AND featured = 1 AND media_type = 'image' LIMIT 1`,
    ).bind(ownerType, itemId).first();
    const featured = descriptor.mediaType === "image" && (featuredRequested || !hasFeatured);
    const now = Math.floor(Date.now() / 1000);
    const width = optionalInteger(form.get("width"), 1, 20_000);
    const height = optionalInteger(form.get("height"), 1, 20_000);
    const duration = optionalInteger(form.get("durationSeconds"), 0, 24 * 60 * 60);
    if (featured) {
      await getD1().prepare(`UPDATE media_assets SET featured = 0 WHERE owner_type = ? AND ${column} = ?`).bind(ownerType, itemId).run();
    }
    await getD1().prepare(`INSERT INTO media_assets
      (id, object_key, thumbnail_key, public_url, thumbnail_url, owner_type, ${column}, store_id,
       uploaded_by, media_type, content_type, original_name, caption, alt_text, size_bytes, checksum,
       width, height, duration_seconds, sort_order, featured, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`)
      .bind(mediaId, objectKey, thumbnailKey || null, publicUrl, thumbnailUrl, ownerType, itemId, storeId,
        session.user.id, descriptor.mediaType, file.type, safeMediaName(file),
        cleanText(form.get("caption"), "Caption", { max: 500, required: false }) || null,
        cleanText(form.get("altText"), "Alt text", { max: 160, required: false }) || item.name,
        file.size, checksum, width, height, duration, Number(currentMax?.maximum ?? -1) + 1, featured ? 1 : 0, now)
      .run();
    if (featured) {
      const table = ownerType === "product" ? "products" : "services";
      await getD1().prepare(`UPDATE ${table} SET image_key = ?, image_url = ?, updated_at = ? WHERE id = ? AND store_id = ?`)
        .bind(objectKey, publicUrl, now, itemId, storeId).run();
    }
    committed = true;
    await writeAudit(request, session.user.id, "catalog_media.uploaded", ownerType, itemId, {
      storeId, mediaId, mediaType: descriptor.mediaType, sizeBytes: file.size,
    });
    return Response.json({ id: mediaId, url: publicUrl, thumbnailUrl, featured }, { status: 201 });
  } catch (error) {
    if (!committed) {
      await Promise.all([objectKey, thumbnailKey].filter(Boolean).map(async (key) => {
        try { await getMediaBucket().delete(key); } catch {}
      }));
    }
    return apiError(error);
  }
}

export async function PATCH(request: Request) {
  try {
    const body = await safeJson(request);
    const storeId = cleanText(body.storeId, "Store", { max: 80 });
    const ownerType = ownerTypeInput(body.ownerType);
    const itemId = cleanText(body.itemId, "Item", { max: 80 });
    const session = await authorizeStore(request, storeId, true);
    await catalogItem(ownerType, itemId, storeId);
    const action = cleanText(body.action, "Action", { max: 40 });
    if (action === "reorder") {
      const assetIds = Array.isArray(body.assetIds) ? body.assetIds.map((value) => cleanText(value, "Media", { max: 80 })).slice(0, 20) : [];
      const existing = await getD1().prepare(
        `SELECT id FROM media_assets WHERE owner_type = ? AND ${itemColumn(ownerType)} = ?`,
      ).bind(ownerType, itemId).all<{ id: string }>();
      const allowed = new Set((existing.results ?? []).map((item) => item.id));
      if (!assetIds.length || assetIds.some((id) => !allowed.has(id))) throw new HttpError(400, "Invalid media order.", "INVALID_MEDIA_ORDER");
      await getD1().batch(assetIds.map((id, index) => getD1().prepare("UPDATE media_assets SET sort_order = ? WHERE id = ?").bind(index, id)));
    } else {
      const assetId = cleanText(body.assetId, "Media", { max: 80 });
      const asset = await getD1().prepare(
        `SELECT id, object_key AS objectKey, public_url AS publicUrl, media_type AS mediaType
         FROM media_assets WHERE id = ? AND owner_type = ? AND ${itemColumn(ownerType)} = ? LIMIT 1`,
      ).bind(assetId, ownerType, itemId).first<MediaRow>();
      if (!asset) throw new HttpError(404, "Media not found.", "MEDIA_NOT_FOUND");
      if (action === "feature") {
        if (asset.mediaType !== "image") throw new HttpError(400, "Only an image can be the cover.", "IMAGE_REQUIRED");
        await replaceFeatured(ownerType, itemId, storeId, asset);
      } else if (action === "edit") {
        const cropX = Number.isInteger(Number(body.cropX)) ? Math.min(100, Math.max(0, Number(body.cropX))) : 50;
        const cropY = Number.isInteger(Number(body.cropY)) ? Math.min(100, Math.max(0, Number(body.cropY))) : 50;
        const caption = cleanText(body.caption, "Caption", { max: 500, required: false }) || null;
        await getD1().prepare("UPDATE media_assets SET crop_x = ?, crop_y = ?, caption = ? WHERE id = ?")
          .bind(cropX, cropY, caption, assetId).run();
      } else {
        throw new HttpError(400, "Unsupported media action.", "INVALID_ACTION");
      }
    }
    await writeAudit(request, session.user.id, `catalog_media.${action}`, ownerType, itemId, { storeId });
    return Response.json({ ok: true });
  } catch (error) {
    return apiError(error);
  }
}

export async function DELETE(request: Request) {
  try {
    const body = await safeJson(request);
    const storeId = cleanText(body.storeId, "Store", { max: 80 });
    const ownerType = ownerTypeInput(body.ownerType);
    const itemId = cleanText(body.itemId, "Item", { max: 80 });
    const session = await authorizeStore(request, storeId, true);
    await catalogItem(ownerType, itemId, storeId);
    const assetIds = (Array.isArray(body.assetIds) ? body.assetIds : [body.assetId])
      .map((value) => cleanText(value, "Media", { max: 80 })).filter(Boolean).slice(0, 20);
    if (!assetIds.length) throw new HttpError(400, "Select media to delete.", "MEDIA_REQUIRED");
    const placeholders = assetIds.map(() => "?").join(",");
    const assets = await getD1().prepare(
      `SELECT id, object_key AS objectKey, thumbnail_key AS thumbnailKey, public_url AS publicUrl,
        media_type AS mediaType, featured
       FROM media_assets WHERE owner_type = ? AND ${itemColumn(ownerType)} = ? AND id IN (${placeholders})`,
    ).bind(ownerType, itemId, ...assetIds).all<MediaRow>();
    const found = assets.results ?? [];
    if (found.length !== assetIds.length) throw new HttpError(404, "One or more media items were not found.", "MEDIA_NOT_FOUND");
    await getD1().prepare(`DELETE FROM media_assets WHERE id IN (${placeholders})`).bind(...assetIds).run();
    if (found.some((asset) => Boolean(asset.featured))) {
      const next = await getD1().prepare(
        `SELECT id, object_key AS objectKey, public_url AS publicUrl, media_type AS mediaType
         FROM media_assets WHERE owner_type = ? AND ${itemColumn(ownerType)} = ? AND media_type = 'image'
         ORDER BY sort_order ASC, created_at ASC LIMIT 1`,
      ).bind(ownerType, itemId).first<MediaRow>();
      await replaceFeatured(ownerType, itemId, storeId, next ?? null);
    }
    await Promise.all(found.flatMap((asset) => [asset.objectKey, asset.thumbnailKey].filter((key): key is string => Boolean(key))).map(async (key) => {
      try { await getMediaBucket().delete(key); } catch {}
    }));
    await writeAudit(request, session.user.id, "catalog_media.deleted", ownerType, itemId, { storeId, assetIds });
    return Response.json({ ok: true, deleted: assetIds.length });
  } catch (error) {
    return apiError(error);
  }
}
