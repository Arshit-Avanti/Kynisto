import { listCategories } from "@/lib/store-data";
import { apiError } from "@/lib/security";
import { microCacheJson } from "@/lib/micro-cache";

export async function GET(request: Request) {
  try {
    const requested = new URL(request.url).searchParams.get("module");
    const categoryModule = requested === "healthcare" || requested === "all" ? requested : "local";
    const items = await listCategories(categoryModule);
    return microCacheJson(
      { items },
      "public, max-age=60, stale-while-revalidate=300",
    );
  } catch (error) {
    return apiError(error);
  }
}
