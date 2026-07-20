import { getD1, getMediaBucket } from "@/db/runtime";
import { requireApiPermission } from "@/lib/auth";
import { requireOwnedStore, writeAudit } from "@/lib/ownership";
import { apiError, enforceRateLimit, HttpError } from "@/lib/security";
import { cleanText, safeJson } from "@/lib/validation";

const allowedTypes = new Map([
  ["image/jpeg", "jpg"],
  ["image/png", "png"],
  ["image/webp", "webp"],
  ["image/avif", "avif"],
]);

type ProductMedia = {
  id: string;
  name: string;
  objectKey: string | null;
  imageUrl: string | null;
};

async function isGenuineImage(file: File): Promise<boolean> {
  const bytes = new Uint8Array(await file.slice(0, 32).arrayBuffer());
  if (file.type === "image/jpeg") return bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff;
  if (file.type === "image/png") return [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a].every((value, index) => bytes[index] === value);
  if (file.type === "image/webp") return String.fromCharCode(...bytes.slice(0, 4)) === "RIFF" && String.fromCharCode(...bytes.slice(8, 12)) === "WEBP";
  if (file.type === "image/avif") {
    const box = String.fromCharCode(...bytes.slice(4, 8));
    const brands = String.fromCharCode(...bytes.slice(8));
    return box === "ftyp" && (brands.includes("avif") || brands.includes("avis"));
  }
  return false;
}

async function productForStore(productId: string, storeId: string): Promise<ProductMedia> {
  const product = await getD1().prepare(
    "SELECT id, name, image_key AS objectKey, image_url AS imageUrl FROM products WHERE id = ? AND store_id = ? LIMIT 1",
  ).bind(productId, storeId).first<ProductMedia>();
  if (!product) throw new HttpError(404, "Product not found for this shop.", "PRODUCT_NOT_FOUND");
  return product;
}

export async function GET(request: Request) {
  try {
    const session = await requireApiPermission(request, "media.manage");
    const storeId = cleanText(new URL(request.url).searchParams.get("storeId"), "Store", { max: 80 });
    if (session.user.role === "store_owner") await requireOwnedStore(session.user.id, storeId);
    const result = await getD1().prepare("SELECT id, url, alt_text AS altText, kind, sort_order AS sortOrder, width, height, size_bytes AS sizeBytes FROM store_images WHERE store_id = ? ORDER BY sort_order ASC, created_at DESC").bind(storeId).all();
    return Response.json({ items: result.results ?? [] }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    return apiError(error);
  }
}

export async function POST(request: Request) {
  try {
    const session = await requireApiPermission(request, "media.manage", { csrf: true });
    await enforceRateLimit(request, `media-upload:${session.user.id}`, 30, 60 * 60);
    const formData = await request.formData();
    const storeId = cleanText(formData.get("storeId"), "Store", { max: 80 });
    const kind = formData.get("kind");
    if (kind !== "logo" && kind !== "banner" && kind !== "gallery" && kind !== "product") {
      throw new HttpError(400, "Choose logo, banner, gallery or product.", "INVALID_MEDIA_KIND");
    }
    if (session.user.role === "store_owner") await requireOwnedStore(session.user.id, storeId);
    const productId = kind === "product"
      ? cleanText(formData.get("productId"), "Product", { max: 80 })
      : null;
    const product = productId ? await productForStore(productId, storeId) : null;
    const file = formData.get("file");
    if (!(file instanceof File)) throw new HttpError(400, "Choose an image to upload.", "FILE_REQUIRED");
    const extension = allowedTypes.get(file.type);
    if (!extension) throw new HttpError(415, "Use JPEG, PNG, WebP or AVIF images.", "UNSUPPORTED_MEDIA");
    if (file.size <= 0 || file.size > 8 * 1024 * 1024) {
      throw new HttpError(413, "Image must be smaller than 8 MB.", "FILE_TOO_LARGE");
    }
    if (!await isGenuineImage(file)) {
      throw new HttpError(415, "The selected file does not match its image format.", "INVALID_IMAGE_CONTENT");
    }
    const altText = cleanText(formData.get("altText"), "Alt text", { max: 160, required: false });
    const directory = product ? `products/${product.id}` : kind;
    const objectKey = `stores/${storeId}/${directory}/${crypto.randomUUID()}.${extension}`;
    await getMediaBucket().put(objectKey, file.stream(), {
      httpMetadata: { contentType: file.type, cacheControl: "public, max-age=31536000, immutable" },
      customMetadata: { storeId, kind, productId: product?.id ?? "", uploadedBy: session.user.id },
    });
    const url = `/media/${objectKey}`;
    const db = getD1();
    const now = Math.floor(Date.now() / 1000);
    let oldObjectKey: string | null = null;
    try {
      if (product) {
        oldObjectKey = product.objectKey;
        const statements: D1PreparedStatement[] = [];
        if (oldObjectKey) statements.push(db.prepare("DELETE FROM store_images WHERE object_key = ?").bind(oldObjectKey));
        statements.push(
          db.prepare("UPDATE products SET image_key = ?, image_url = ?, updated_at = ? WHERE id = ? AND store_id = ?")
            .bind(objectKey, url, now, product.id, storeId),
          db.prepare("INSERT INTO store_images (id, store_id, object_key, url, alt_text, kind, content_type, size_bytes, created_at) VALUES (?, ?, ?, ?, ?, 'product', ?, ?, ?)")
            .bind(crypto.randomUUID(), storeId, objectKey, url, altText || product.name, file.type, file.size, now),
        );
        await db.batch(statements);
      } else if (kind === "logo" || kind === "banner") {
        const old = await db.prepare(`SELECT ${kind}_key AS objectKey FROM stores WHERE id = ?`).bind(storeId).first<{ objectKey: string | null }>();
        oldObjectKey = old?.objectKey ?? null;
        await db.batch([
          db.prepare(`UPDATE stores SET ${kind}_key = ?, ${kind}_url = ?, updated_at = ? WHERE id = ?`).bind(objectKey, url, now, storeId),
          db.prepare("DELETE FROM store_images WHERE store_id = ? AND kind = ?").bind(storeId, kind),
          db.prepare("INSERT INTO store_images (id, store_id, object_key, url, alt_text, kind, content_type, size_bytes, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)")
            .bind(crypto.randomUUID(), storeId, objectKey, url, altText || `${kind} for store`, kind, file.type, file.size, now),
        ]);
      } else {
        await db.prepare("INSERT INTO store_images (id, store_id, object_key, url, alt_text, kind, content_type, size_bytes, created_at) VALUES (?, ?, ?, ?, ?, 'gallery', ?, ?, ?)")
          .bind(crypto.randomUUID(), storeId, objectKey, url, altText || "Store gallery image", file.type, file.size, now).run();
      }
    } catch (error) {
      await getMediaBucket().delete(objectKey);
      throw error;
    }
    if (oldObjectKey) await getMediaBucket().delete(oldObjectKey);
    await writeAudit(request, session.user.id, "media.uploaded", product ? "product" : "store", product?.id ?? storeId, { storeId, kind, objectKey });
    return Response.json({ url, objectKey, productId: product?.id ?? null }, { status: 201 });
  } catch (error) {
    return apiError(error);
  }
}

export async function DELETE(request: Request) {
  try {
    const session = await requireApiPermission(request, "media.manage", { csrf: true });
    const body = await safeJson(request);
    const storeId = cleanText(body.storeId, "Store", { max: 80 });
    if (session.user.role === "store_owner") await requireOwnedStore(session.user.id, storeId);
    if (body.productId) {
      const productId = cleanText(body.productId, "Product", { max: 80 });
      const product = await productForStore(productId, storeId);
      if (!product.imageUrl) throw new HttpError(404, "This product does not have an image.", "IMAGE_NOT_FOUND");
      const now = Math.floor(Date.now() / 1000);
      const statements = [getD1().prepare("UPDATE products SET image_key = NULL, image_url = NULL, updated_at = ? WHERE id = ? AND store_id = ?").bind(now, productId, storeId)];
      if (product.objectKey) statements.push(getD1().prepare("DELETE FROM store_images WHERE object_key = ?").bind(product.objectKey));
      await getD1().batch(statements);
      if (product.objectKey) await getMediaBucket().delete(product.objectKey);
      await writeAudit(request, session.user.id, "media.deleted", "product", productId, { storeId, objectKey: product.objectKey });
      return Response.json({ ok: true });
    }
    const imageId = cleanText(body.imageId, "Image", { max: 80 });
    const image = await getD1().prepare("SELECT object_key AS objectKey, kind FROM store_images WHERE id = ? AND store_id = ?").bind(imageId, storeId).first<{ objectKey: string; kind: string }>();
    if (!image) throw new HttpError(404, "Image not found.", "IMAGE_NOT_FOUND");
    const statements = [getD1().prepare("DELETE FROM store_images WHERE id = ? AND store_id = ?").bind(imageId, storeId)];
    if (image.kind === "logo" || image.kind === "banner") {
      statements.push(getD1().prepare(`UPDATE stores SET ${image.kind}_key = NULL, ${image.kind}_url = NULL, updated_at = ? WHERE id = ?`).bind(Math.floor(Date.now() / 1000), storeId));
    } else if (image.kind === "product") {
      statements.push(getD1().prepare("UPDATE products SET image_key = NULL, image_url = NULL, updated_at = ? WHERE store_id = ? AND image_key = ?").bind(Math.floor(Date.now() / 1000), storeId, image.objectKey));
    }
    await getD1().batch(statements);
    await getMediaBucket().delete(image.objectKey);
    await writeAudit(request, session.user.id, "media.deleted", "store", storeId, { imageId });
    return Response.json({ ok: true });
  } catch (error) {
    return apiError(error);
  }
}
