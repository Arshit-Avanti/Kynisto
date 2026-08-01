import { listCategories } from "@/lib/store-data";
import { apiError, noStoreJson } from "@/lib/security";

export async function GET(request: Request) {
  try {
    const requested = new URL(request.url).searchParams.get("module");
    const categoryModule = requested === "healthcare" || requested === "all" ? requested : "local";
    return noStoreJson({ items: await listCategories(categoryModule) });
  } catch (error) {
    return apiError(error);
  }
}
