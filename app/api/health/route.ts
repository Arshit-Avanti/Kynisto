import { getD1 } from "@/db/runtime";
import { ensureSeeded } from "@/db/seed";
import { apiError } from "@/lib/security";
import { microCache, microCacheJson } from "@/lib/micro-cache";

export async function GET() {
  try {
    const cacheKey = "health:summary";
    const cached = microCache.get<{ ok: boolean; service: string; stores: number; categories: number }>(cacheKey);
    if (cached) {
      return microCacheJson(cached, "public, max-age=15, stale-while-revalidate=60");
    }

    await ensureSeeded();
    const summary = await getD1()
      .prepare(
        "SELECT (SELECT COUNT(*) FROM stores) AS stores, (SELECT COUNT(*) FROM categories WHERE parent_id IS NULL) AS categories",
      )
      .first<{ stores: number; categories: number }>();

    const data = {
      ok: true,
      service: "Kynisto",
      stores: summary?.stores ?? 0,
      categories: summary?.categories ?? 0,
    };
    microCache.set(cacheKey, data, 30_000);
    return microCacheJson(data, "public, max-age=15, stale-while-revalidate=60");
  } catch (error) {
    return apiError(error);
  }
}
