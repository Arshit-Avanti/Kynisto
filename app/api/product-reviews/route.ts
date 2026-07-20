import { getD1 } from "@/db/runtime";
import { ensureSeeded } from "@/db/seed";
import { requireApiPermission } from "@/lib/auth";
import { writeAudit } from "@/lib/ownership";
import { apiError, enforceRateLimit, HttpError, noStoreJson } from "@/lib/security";
import { cleanText, numberInput, safeJson } from "@/lib/validation";

function idInput(value: unknown, label: string): string {
  const id = cleanText(value, label, { min: 1, max: 80 });
  if (!/^[A-Za-z0-9_-]+$/.test(id)) throw new HttpError(400, `${label} is invalid.`, "INVALID_ID");
  return id;
}

function reviewInput(body: Record<string, unknown>) {
  return {
    rating: numberInput(body.rating, "Rating", { min: 1, max: 5, integer: true }) as number,
    title: cleanText(body.title, "Title", { required: false, max: 120 }) || null,
    comment: cleanText(body.comment, "Review", { min: 10, max: 2_000 }),
  };
}

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const productIdRaw = url.searchParams.get("productId");
    const db = getD1();
    if (productIdRaw) {
      await ensureSeeded();
      const productId = idInput(productIdRaw, "Product");
      const [items, summary] = await Promise.all([
        db.prepare(
          `SELECT pr.id, pr.product_id AS productId, pr.reviewer_name AS reviewerName,
            pr.rating, pr.title, pr.comment, pr.created_at AS createdAt
           FROM product_reviews pr
           JOIN products p ON p.id = pr.product_id
           JOIN stores s ON s.id = p.store_id
           WHERE pr.product_id = ? AND pr.status = 'published'
             AND p.status = 'active' AND s.status = 'approved'
           ORDER BY pr.created_at DESC LIMIT 50`,
        ).bind(productId).all(),
        db.prepare(
          `SELECT ROUND(AVG(pr.rating), 1) AS rating, COUNT(*) AS reviews
           FROM product_reviews pr
           JOIN products p ON p.id = pr.product_id
           JOIN stores s ON s.id = p.store_id
           WHERE pr.product_id = ? AND pr.status = 'published'
             AND p.status = 'active' AND s.status = 'approved'`,
        ).bind(productId).first(),
      ]);
      return noStoreJson({ items: items.results ?? [], summary: summary ?? { rating: 0, reviews: 0 } });
    }

    const session = await requireApiPermission(request, "reviews.create");
    const result = await db.prepare(
      `SELECT pr.id, pr.product_id AS productId, p.name AS productName, p.slug AS productSlug,
        s.name AS storeName, s.slug AS storeSlug, pr.rating, pr.title, pr.comment,
        pr.status, pr.created_at AS createdAt, pr.updated_at AS updatedAt
       FROM product_reviews pr JOIN products p ON p.id = pr.product_id
       JOIN stores s ON s.id = p.store_id
       WHERE pr.user_id = ? ORDER BY pr.created_at DESC`,
    ).bind(session.user.id).all();
    return noStoreJson({ items: result.results ?? [] });
  } catch (error) {
    return apiError(error);
  }
}

export async function POST(request: Request) {
  try {
    const session = await requireApiPermission(request, "reviews.create", { csrf: true });
    await enforceRateLimit(request, `product-review:${session.user.id}`, 12, 60 * 60);
    const body = await safeJson(request);
    const productId = idInput(body.productId, "Product");
    const input = reviewInput(body);
    const db = getD1();
    const purchase = await db.prepare(
      `SELECT oi.id AS orderItemId FROM order_items oi
       JOIN orders o ON o.id = oi.order_id
       JOIN products p ON p.id = oi.product_id
       JOIN stores s ON s.id = p.store_id
       WHERE oi.product_id = ? AND o.user_id = ? AND o.status = 'delivered'
         AND p.status = 'active' AND s.status = 'approved'
       ORDER BY o.created_at DESC LIMIT 1`,
    ).bind(productId, session.user.id).first<{ orderItemId: string }>();
    if (!purchase) throw new HttpError(403, "Product ratings require a delivered Kynisto order.", "VERIFIED_PURCHASE_REQUIRED");
    const duplicate = await db.prepare("SELECT id FROM product_reviews WHERE product_id = ? AND user_id = ? LIMIT 1").bind(productId, session.user.id).first();
    if (duplicate) throw new HttpError(409, "You have already reviewed this product.", "REVIEW_EXISTS");
    const moderation = await db.prepare("SELECT value FROM system_settings WHERE key = 'reviews_require_moderation'").first<{ value: string }>();
    const status = moderation?.value === "true" ? "pending" : "published";
    const id = crypto.randomUUID();
    const now = Math.floor(Date.now() / 1000);
    await db.prepare(
      `INSERT INTO product_reviews
       (id, product_id, user_id, order_item_id, reviewer_name, rating, title, comment, status, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    ).bind(id, productId, session.user.id, purchase.orderItemId, session.user.name, input.rating, input.title, input.comment, status, now, now).run();
    await writeAudit(request, session.user.id, "product_review.created", "product_review", id, { productId, status });
    return noStoreJson({ ok: true, id, status }, { status: 201 });
  } catch (error) {
    return apiError(error);
  }
}

export async function PATCH(request: Request) {
  try {
    const session = await requireApiPermission(request, "reviews.create", { csrf: true });
    const body = await safeJson(request);
    const reviewId = idInput(body.reviewId, "Review");
    const input = reviewInput(body);
    const db = getD1();
    const moderation = await db.prepare("SELECT value FROM system_settings WHERE key = 'reviews_require_moderation'").first<{ value: string }>();
    const status = moderation?.value === "true" ? "pending" : "published";
    const result = await db.prepare(
      "UPDATE product_reviews SET rating = ?, title = ?, comment = ?, status = ?, updated_at = ? WHERE id = ? AND user_id = ?",
    ).bind(input.rating, input.title, input.comment, status, Math.floor(Date.now() / 1000), reviewId, session.user.id).run();
    if (Number(result.meta.changes ?? 0) !== 1) throw new HttpError(404, "Product review not found.", "REVIEW_NOT_FOUND");
    await writeAudit(request, session.user.id, "product_review.updated", "product_review", reviewId, { status });
    return noStoreJson({ ok: true, status });
  } catch (error) {
    return apiError(error);
  }
}

export async function DELETE(request: Request) {
  try {
    const session = await requireApiPermission(request, "reviews.create", { csrf: true });
    const body = await safeJson(request);
    const reviewId = idInput(body.reviewId, "Review");
    const result = await getD1().prepare("DELETE FROM product_reviews WHERE id = ? AND user_id = ?").bind(reviewId, session.user.id).run();
    if (Number(result.meta.changes ?? 0) !== 1) throw new HttpError(404, "Product review not found.", "REVIEW_NOT_FOUND");
    await writeAudit(request, session.user.id, "product_review.deleted", "product_review", reviewId);
    return noStoreJson({ ok: true });
  } catch (error) {
    return apiError(error);
  }
}
