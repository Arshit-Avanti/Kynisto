import { getD1 } from "@/db/runtime";
import { requireApiPermission } from "@/lib/auth";
import { writeAudit } from "@/lib/ownership";
import { apiError, HttpError } from "@/lib/security";
import { cleanText, d1SearchText, safeJson } from "@/lib/validation";

async function refresh(storeId: string) {
  await getD1().prepare(`UPDATE stores SET rating_average = COALESCE((SELECT AVG(rating) FROM reviews WHERE store_id = ? AND status = 'published'), 0), rating_count = (SELECT COUNT(*) FROM reviews WHERE store_id = ? AND status = 'published'), updated_at = ? WHERE id = ?`).bind(storeId, storeId, Math.floor(Date.now() / 1000), storeId).run();
}

async function refreshMany(storeIds: string[]) {
  if (!storeIds.length) return;
  const placeholders = storeIds.map(() => "?").join(",");
  await getD1().prepare(`UPDATE stores SET
    rating_average = COALESCE((SELECT AVG(r.rating) FROM reviews r WHERE r.store_id = stores.id AND r.status = 'published'), 0),
    rating_count = (SELECT COUNT(*) FROM reviews r WHERE r.store_id = stores.id AND r.status = 'published'),
    updated_at = ? WHERE id IN (${placeholders})`).bind(Math.floor(Date.now() / 1000), ...storeIds).run();
}

export async function GET(request: Request) {
  try {
    await requireApiPermission(request, "reviews.moderate");
    const url = new URL(request.url);
    const status = url.searchParams.get("status");
    const query = d1SearchText((url.searchParams.get("q") ?? "").replace(/[%_]/g, "").trim());
    const conditions = ["1 = 1"];
    const bindings: unknown[] = [];
    if (["pending", "published", "hidden"].includes(status ?? "")) { conditions.push("feed.status = ?"); bindings.push(status); }
    if (query) {
      conditions.push("(feed.storeName LIKE ? OR feed.productName LIKE ? OR feed.reviewerName LIKE ? OR feed.comment LIKE ?)");
      bindings.push(`%${query}%`, `%${query}%`, `%${query}%`, `%${query}%`);
    }
    const result = await getD1().prepare(
      `SELECT * FROM (
        SELECT r.id, 'store' AS reviewType, r.store_id AS storeId, NULL AS productId,
          s.name AS storeName, NULL AS productName, r.reviewer_name AS reviewerName,
          u.email AS reviewerEmail, r.rating, r.title, r.comment,
          r.owner_reply AS ownerReply, r.status, r.created_at AS createdAt
        FROM reviews r JOIN stores s ON s.id = r.store_id
        LEFT JOIN users u ON u.id = r.user_id
        UNION ALL
        SELECT pr.id, 'product' AS reviewType, p.store_id AS storeId, pr.product_id AS productId,
          s.name AS storeName, p.name AS productName, pr.reviewer_name AS reviewerName,
          u.email AS reviewerEmail, pr.rating, pr.title, pr.comment,
          NULL AS ownerReply, pr.status, pr.created_at AS createdAt
        FROM product_reviews pr JOIN products p ON p.id = pr.product_id
        JOIN stores s ON s.id = p.store_id LEFT JOIN users u ON u.id = pr.user_id
      ) feed WHERE ${conditions.join(" AND ")}
      ORDER BY feed.createdAt DESC LIMIT 200`,
    ).bind(...bindings).all();
    return Response.json({ items: result.results ?? [] }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    return apiError(error);
  }
}

export async function PATCH(request: Request) {
  try {
    const session = await requireApiPermission(request, "reviews.moderate", { csrf: true });
    const body = await safeJson(request);
    if (body.action === "bulk_delete") {
      if (!Array.isArray(body.reviews)) throw new HttpError(400, "Choose at least one review.", "SELECTION_REQUIRED");
      const selected = body.reviews.slice(0, 100).map((item) => {
        const value = item as Record<string, unknown>;
        return { id: cleanText(value.id, "Review", { max: 80 }), reviewType: value.reviewType === "product" ? "product" : "store" };
      });
      const unique = [...new Map(selected.map((item) => [`${item.reviewType}:${item.id}`, item])).values()];
      if (!unique.length || unique.length !== body.reviews.length) throw new HttpError(400, "Choose between 1 and 100 unique reviews.", "INVALID_SELECTION");
      const storeIds = unique.filter((item) => item.reviewType === "store").map((item) => item.id);
      const productIds = unique.filter((item) => item.reviewType === "product").map((item) => item.id);
      const db = getD1();
      const [storeRows, productRows] = await Promise.all([
        storeIds.length ? db.prepare(`SELECT id, store_id AS storeId FROM reviews WHERE id IN (${storeIds.map(() => "?").join(",")})`).bind(...storeIds).all<{ id: string; storeId: string }>() : Promise.resolve({ results: [] as Array<{ id: string; storeId: string }> }),
        productIds.length ? db.prepare(`SELECT pr.id, p.store_id AS storeId FROM product_reviews pr JOIN products p ON p.id = pr.product_id WHERE pr.id IN (${productIds.map(() => "?").join(",")})`).bind(...productIds).all<{ id: string; storeId: string }>() : Promise.resolve({ results: [] as Array<{ id: string; storeId: string }> }),
      ]);
      const foundRows = [...(storeRows.results ?? []), ...(productRows.results ?? [])];
      if (foundRows.length !== unique.length) throw new HttpError(404, "One or more reviews were not found.", "REVIEW_NOT_FOUND");
      const statements: D1PreparedStatement[] = [];
      if (storeIds.length) statements.push(db.prepare(`DELETE FROM reviews WHERE id IN (${storeIds.map(() => "?").join(",")})`).bind(...storeIds));
      if (productIds.length) statements.push(db.prepare(`DELETE FROM product_reviews WHERE id IN (${productIds.map(() => "?").join(",")})`).bind(...productIds));
      await db.batch(statements);
      await refreshMany([...new Set(foundRows.map((row) => row.storeId))]);
      await writeAudit(request, session.user.id, "review.bulk_deleted", "review", unique[0].id, { reviews: unique, count: unique.length });
      return Response.json({ ok: true, count: unique.length });
    }
    const id = cleanText(body.id, "Review", { max: 80 });
    const reviewType = body.reviewType === "product" ? "product" : "store";
    const status = body.status;
    if (status !== "published" && status !== "hidden" && status !== "pending") throw new HttpError(400, "Invalid review status.", "INVALID_STATUS");
    const table = reviewType === "product" ? "product_reviews" : "reviews";
    const review = await getD1().prepare(`SELECT ${reviewType === "product" ? "product_id AS productId" : "store_id AS storeId"} FROM ${table} WHERE id = ?`).bind(id).first<{ storeId?: string; productId?: string }>();
    if (!review) throw new HttpError(404, "Review not found.", "REVIEW_NOT_FOUND");
    await getD1().prepare(`UPDATE ${table} SET status = ?, updated_at = ? WHERE id = ?`).bind(status, Math.floor(Date.now() / 1000), id).run();
    if (review.storeId) await refresh(review.storeId);
    await writeAudit(request, session.user.id, "review.moderated", reviewType === "product" ? "product_review" : "review", id, { status });
    return Response.json({ ok: true });
  } catch (error) {
    return apiError(error);
  }
}

export async function DELETE(request: Request) {
  try {
    const session = await requireApiPermission(request, "reviews.moderate", { csrf: true });
    const body = await safeJson(request);
    const id = cleanText(body.id, "Review", { max: 80 });
    const reviewType = body.reviewType === "product" ? "product" : "store";
    const table = reviewType === "product" ? "product_reviews" : "reviews";
    const review = await getD1().prepare(`SELECT ${reviewType === "product" ? "product_id AS productId" : "store_id AS storeId"} FROM ${table} WHERE id = ?`).bind(id).first<{ storeId?: string; productId?: string }>();
    if (!review) throw new HttpError(404, "Review not found.", "REVIEW_NOT_FOUND");
    await getD1().prepare(`DELETE FROM ${table} WHERE id = ?`).bind(id).run();
    if (review.storeId) await refresh(review.storeId);
    await writeAudit(request, session.user.id, "review.deleted", reviewType === "product" ? "product_review" : "review", id);
    return Response.json({ ok: true });
  } catch (error) {
    return apiError(error);
  }
}
