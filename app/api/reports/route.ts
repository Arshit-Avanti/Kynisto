import { getD1 } from "@/db/runtime";
import { requireApiPermission } from "@/lib/auth";
import { apiError } from "@/lib/security";
import { cleanText, safeJson } from "@/lib/validation";

export async function POST(request: Request) {
  try {
    const session = await requireApiPermission(request, "reports.create", { csrf: true });
    const body = await safeJson(request);
    const storeId = cleanText(body.storeId, "Store", { max: 80, required: false }) || null;
    const reviewId = cleanText(body.reviewId, "Review", { max: 80, required: false }) || null;
    const reason = cleanText(body.reason, "Reason", { min: 3, max: 120 });
    const details = cleanText(body.details, "Details", { max: 1000, required: false }) || null;
    if (!storeId && !reviewId) {
      return Response.json({ error: { message: "Choose a store or review to report." } }, { status: 400 });
    }
    const now = Math.floor(Date.now() / 1000);
    await getD1()
      .prepare(
        "INSERT INTO reports (id, store_id, review_id, reporter_id, reason, details, status, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, 'open', ?, ?)",
      )
      .bind(crypto.randomUUID(), storeId, reviewId, session.user.id, reason, details, now, now)
      .run();
    return Response.json({ ok: true }, { status: 201 });
  } catch (error) {
    return apiError(error);
  }
}
