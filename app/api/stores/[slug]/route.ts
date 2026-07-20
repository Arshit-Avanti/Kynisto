import { getStoreBySlug, recordAnalytics } from "@/lib/store-data";
import { apiError } from "@/lib/security";

export async function GET(
  request: Request,
  context: { params: Promise<{ slug: string }> },
) {
  try {
    const { slug } = await context.params;
    const store = await getStoreBySlug(slug);
    if (!store) {
      return Response.json({ error: { code: "NOT_FOUND", message: "Store not found." } }, { status: 404 });
    }
    await recordAnalytics(request, store.id, "view");
    return Response.json({ store }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    return apiError(error);
  }
}
