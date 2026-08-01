import { getD1 } from "@/db/runtime";
import { requireApiPermission } from "@/lib/auth";
import { apiError, HttpError, noStoreJson } from "@/lib/security";
import { getCustomerActivePlan } from "@/lib/subscriptions";
import { cleanText, safeJson } from "@/lib/validation";

export async function GET(request: Request) {
  try {
    const session = await requireApiPermission(request, "favorites.manage_own");
    const result = await getD1()
      .prepare(
        `SELECT f.id, f.created_at AS createdAt,
          s.id AS storeId, s.name, s.slug, s.address, s.area,
          s.rating_average AS rating, s.rating_count AS reviews,
          s.logo_url AS logoUrl, c.name AS category, c.icon
         FROM favorites f
         JOIN stores s ON s.id = f.store_id
         JOIN categories c ON c.id = s.category_id
         WHERE f.user_id = ? AND s.status = 'approved'
         ORDER BY f.created_at DESC`,
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
    const session = await requireApiPermission(request, "favorites.manage_own", { csrf: true });
    const body = await safeJson(request);
    const storeId = cleanText(body.storeId, "Store", { max: 80 });
    const exists = await getD1()
      .prepare("SELECT id FROM stores WHERE id = ? AND status = 'approved'")
      .bind(storeId)
      .first();
    if (!exists) throw new HttpError(404, "Store not found.", "STORE_NOT_FOUND");

    const plan = await getCustomerActivePlan(session.user.id);
    if (plan.id === "free") {
      const existingFav = await getD1()
        .prepare("SELECT id FROM favorites WHERE user_id = ? AND store_id = ?")
        .bind(session.user.id, storeId)
        .first();

      if (!existingFav) {
        const countResult = await getD1()
          .prepare("SELECT COUNT(*) AS total FROM favorites WHERE user_id = ?")
          .bind(session.user.id)
          .first<{ total: number }>();
        const total = countResult?.total ?? 0;
        if (total >= 10) {
          throw new HttpError(
            403,
            "Free plan limit of 10 saved shops reached. Upgrade to Premium for unlimited saved places.",
            "FAVORITES_LIMIT_REACHED"
          );
        }
      }
    }

    await getD1()
      .prepare("INSERT OR IGNORE INTO favorites (id, user_id, store_id, created_at) VALUES (?, ?, ?, ?)")
      .bind(crypto.randomUUID(), session.user.id, storeId, Math.floor(Date.now() / 1000))
      .run();
    return Response.json({ ok: true }, { status: 201 });
  } catch (error) {
    return apiError(error);
  }
}

export async function DELETE(request: Request) {
  try {
    const session = await requireApiPermission(request, "favorites.manage_own", { csrf: true });
    const body = await safeJson(request);
    const storeId = cleanText(body.storeId, "Store", { max: 80 });
    await getD1()
      .prepare("DELETE FROM favorites WHERE user_id = ? AND store_id = ?")
      .bind(session.user.id, storeId)
      .run();
    return Response.json({ ok: true });
  } catch (error) {
    return apiError(error);
  }
}
