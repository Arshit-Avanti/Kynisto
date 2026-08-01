import { getD1 } from "@/db/runtime";
import { requireApiPermission } from "@/lib/auth";
import { apiError, HttpError, noStoreJson } from "@/lib/security";
import { cleanText, numberInput, safeJson } from "@/lib/validation";

async function refreshStoreRating(storeId: string) {
  await getD1()
    .prepare(
      `UPDATE stores SET
        rating_average = COALESCE((SELECT AVG(rating) FROM reviews WHERE store_id = ? AND status = 'published'), 0),
        rating_count = (SELECT COUNT(*) FROM reviews WHERE store_id = ? AND status = 'published'),
        updated_at = ?
       WHERE id = ?`,
    )
    .bind(storeId, storeId, Math.floor(Date.now() / 1000), storeId)
    .run();
}

export async function GET(request: Request) {
  try {
    const session = await requireApiPermission(request, "reviews.create");
    const result = await getD1()
      .prepare(
        `SELECT r.id, r.store_id AS storeId, s.name AS storeName, s.slug,
          r.rating, r.title, r.comment, r.owner_reply AS ownerReply,
          r.status, r.created_at AS createdAt, r.updated_at AS updatedAt
         FROM reviews r JOIN stores s ON s.id = r.store_id
         WHERE r.user_id = ? ORDER BY r.created_at DESC`,
      )
      .bind(session.user.id)
      .all();
    return noStoreJson({ items: result.results ?? [] });
  } catch (error) {
    return apiError(error);
  }
}

export async function POST(request: Request) {
  try {
    const session = await requireApiPermission(request, "reviews.create", { csrf: true });
    const body = await safeJson(request);
    const storeId = cleanText(body.storeId, "Store", { max: 80 });
    const rating = numberInput(body.rating, "Rating", { min: 1, max: 5, integer: true }) as number;
    const title = cleanText(body.title, "Title", { max: 100, required: false });
    const comment = cleanText(body.comment, "Review", { min: 10, max: 1500 });
    const store = await getD1()
      .prepare("SELECT id FROM stores WHERE id = ? AND status = 'approved'")
      .bind(storeId)
      .first();
    if (!store) throw new HttpError(404, "Store not found.", "STORE_NOT_FOUND");
    const moderation = await getD1()
      .prepare("SELECT value FROM system_settings WHERE key = 'reviews_require_moderation'")
      .first<{ value: string }>();
    const status = moderation?.value === "true" ? "pending" : "published";
    const now = Math.floor(Date.now() / 1000);
    try {
      await getD1()
        .prepare(
          "INSERT INTO reviews (id, store_id, user_id, reviewer_name, rating, title, comment, status, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
        )
        .bind(crypto.randomUUID(), storeId, session.user.id, session.user.name, rating, title || null, comment, status, now, now)
        .run();
    } catch {
      throw new HttpError(409, "You have already reviewed this store.", "REVIEW_EXISTS");
    }
    await refreshStoreRating(storeId);
    return Response.json({ ok: true, status }, { status: 201 });
  } catch (error) {
    return apiError(error);
  }
}

export async function PATCH(request: Request) {
  try {
    const session = await requireApiPermission(request, "reviews.create", { csrf: true });
    const body = await safeJson(request);
    const reviewId = cleanText(body.reviewId, "Review", { max: 80 });
    const rating = numberInput(body.rating, "Rating", { min: 1, max: 5, integer: true }) as number;
    const title = cleanText(body.title, "Title", { max: 100, required: false });
    const comment = cleanText(body.comment, "Review", { min: 10, max: 1500 });
    const review = await getD1()
      .prepare("SELECT store_id AS storeId FROM reviews WHERE id = ? AND user_id = ?")
      .bind(reviewId, session.user.id)
      .first<{ storeId: string }>();
    if (!review) throw new HttpError(404, "Review not found.", "REVIEW_NOT_FOUND");
    const moderation = await getD1()
      .prepare("SELECT value FROM system_settings WHERE key = 'reviews_require_moderation'")
      .first<{ value: string }>();
    const status = moderation?.value === "true" ? "pending" : "published";
    await getD1()
      .prepare("UPDATE reviews SET rating = ?, title = ?, comment = ?, status = ?, updated_at = ? WHERE id = ? AND user_id = ?")
      .bind(rating, title || null, comment, status, Math.floor(Date.now() / 1000), reviewId, session.user.id)
      .run();
    await refreshStoreRating(review.storeId);
    return Response.json({ ok: true, status });
  } catch (error) {
    return apiError(error);
  }
}

export async function DELETE(request: Request) {
  try {
    const session = await requireApiPermission(request, "reviews.create", { csrf: true });
    const body = await safeJson(request);
    const reviewId = cleanText(body.reviewId, "Review", { max: 80 });
    const review = await getD1()
      .prepare("SELECT store_id AS storeId FROM reviews WHERE id = ? AND user_id = ?")
      .bind(reviewId, session.user.id)
      .first<{ storeId: string }>();
    if (!review) throw new HttpError(404, "Review not found.", "REVIEW_NOT_FOUND");
    await getD1().prepare("DELETE FROM reviews WHERE id = ? AND user_id = ?").bind(reviewId, session.user.id).run();
    await refreshStoreRating(review.storeId);
    return Response.json({ ok: true });
  } catch (error) {
    return apiError(error);
  }
}
