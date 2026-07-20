import { listStores, recordAnalytics } from "@/lib/store-data";
import { apiError } from "@/lib/security";

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const number = (name: string, fallback: number) => {
      const value = Number(url.searchParams.get(name));
      return Number.isFinite(value) ? value : fallback;
    };
    const sortValue = url.searchParams.get("sort");
    const sort = (["nearest", "rated", "newest", "relevance"] as const).find((value) => value === sortValue) ?? "relevance";
    const result = await listStores({
      query: url.searchParams.get("q") ?? undefined,
      category: url.searchParams.get("category") ?? undefined,
      area: url.searchParams.get("area") ?? undefined,
      postalCode: url.searchParams.get("pin") ?? undefined,
      businessType: url.searchParams.get("type") ?? undefined,
      sort,
      openNow: url.searchParams.get("openNow") === "true",
      page: number("page", 1),
      limit: number("limit", 12),
      latitude: number("lat", 28.7381),
      longitude: number("lng", 77.2669),
    });
    if (url.searchParams.get("q")) {
      await recordAnalytics(request, null, "search_impression", null, {
        query: url.searchParams.get("q")?.slice(0, 100),
        results: result.pagination.total,
      });
    }
    return Response.json(result, {
      headers: { "Cache-Control": "no-store" },
    });
  } catch (error) {
    return apiError(error);
  }
}
