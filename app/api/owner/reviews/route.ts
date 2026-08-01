import { getD1 } from "@/db/runtime";
import { requireApiPermission } from "@/lib/auth";
import { requireOwnedStore, writeAudit } from "@/lib/ownership";
import { apiError, HttpError, noStoreJson } from "@/lib/security";
import { cleanText, numberInput, safeJson } from "@/lib/validation";

export async function GET(request: Request) {
  try {
    const session = await requireApiPermission(request, "reviews.reply_own");
    const url = new URL(request.url);
    const storeId = cleanText(url.searchParams.get("storeId"), "Store", { max: 80 });
    const page = numberInput(url.searchParams.get("page") ?? 1, "Page", { min: 1, max: 10_000, integer: true }) as number;
    const limit = numberInput(url.searchParams.get("limit") ?? 20, "Limit", { min: 1, max: 50, integer: true }) as number;
    await requireOwnedStore(session.user.id, storeId);

    const db = getD1();
    const [countResult, itemResult] = await db.batch([
      db.prepare("SELECT COUNT(*) AS total FROM reviews WHERE store_id = ?").bind(storeId),
      db.prepare(
        `SELECT id, store_id AS storeId, reviewer_name AS reviewerName, rating, title, comment,
          owner_reply AS ownerReply, owner_replied_at AS ownerRepliedAt, status,
          created_at AS createdAt, updated_at AS updatedAt
         FROM reviews WHERE store_id = ?
         ORDER BY created_at DESC LIMIT ? OFFSET ?`,
      ).bind(storeId, limit, (page - 1) * limit),
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

export async function PATCH(request: Request) {
  try {
    const session = await requireApiPermission(request, "reviews.reply_own", { csrf: true });
    const body = await safeJson(request);
    const storeId = cleanText(body.storeId, "Store", { max: 80 });
    const reviewId = cleanText(body.reviewId, "Review", { max: 80 });
    const reply = cleanText(body.reply, "Reply", { min: 2, max: 1200 });
    await requireOwnedStore(session.user.id, storeId);
    const review = await getD1().prepare("SELECT id FROM reviews WHERE id = ? AND store_id = ?").bind(reviewId, storeId).first();
    if (!review) throw new HttpError(404, "Review not found.", "REVIEW_NOT_FOUND");
    const now = Math.floor(Date.now() / 1000);
    await getD1().prepare("UPDATE reviews SET owner_reply = ?, owner_replied_at = ?, updated_at = ? WHERE id = ? AND store_id = ?").bind(reply, now, now, reviewId, storeId).run();
    await writeAudit(request, session.user.id, "review.replied", "review", reviewId, { storeId });
    return Response.json({ ok: true });
  } catch (error) {
    return apiError(error);
  }
}
