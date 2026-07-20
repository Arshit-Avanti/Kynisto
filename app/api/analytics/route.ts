import { getSessionUser } from "@/lib/auth";
import { apiError, assertSameOrigin, enforceRateLimit } from "@/lib/security";
import { recordAnalytics } from "@/lib/store-data";
import { cleanText, safeJson } from "@/lib/validation";

const allowedEvents = ["view", "direction", "phone", "whatsapp", "website", "share"];

export async function POST(request: Request) {
  try {
    assertSameOrigin(request);
    await enforceRateLimit(request, "public-analytics", 120, 60 * 60);
    const body = await safeJson(request);
    const eventType = cleanText(body.eventType, "Event", { max: 30 });
    if (!allowedEvents.includes(eventType)) {
      return Response.json({ error: { message: "Unsupported event." } }, { status: 400 });
    }
    const storeId = cleanText(body.storeId, "Store", { max: 80 });
    const session = await getSessionUser();
    await recordAnalytics(request, storeId, eventType, session?.user.id ?? null);
    return Response.json({ ok: true });
  } catch (error) {
    return apiError(error);
  }
}
