import { getD1 } from "@/db/runtime";
import { ensureSeeded } from "@/db/seed";
import { apiError, noStoreJson } from "@/lib/security";

export async function GET() {
  try {
    await ensureSeeded();
    const summary = await getD1()
      .prepare(
        "SELECT (SELECT COUNT(*) FROM stores) AS stores, (SELECT COUNT(*) FROM categories WHERE parent_id IS NULL) AS categories",
      )
      .first<{ stores: number; categories: number }>();
    return noStoreJson({
      ok: true,
      service: "Kynisto",
      stores: summary?.stores ?? 0,
      categories: summary?.categories ?? 0,
    });
  } catch (error) {
    return apiError(error);
  }
}
