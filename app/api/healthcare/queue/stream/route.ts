import { requireApiPermission } from "@/lib/auth";
import { patientQueueState, requireHealthcareStore } from "@/lib/healthcare";
import { apiError, HttpError } from "@/lib/security";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const session = await requireApiPermission(request, "queue.join");
    const storeId = new URL(request.url).searchParams.get("storeId");
    if (!storeId) throw new HttpError(400, "Provider is required.", "VALIDATION_ERROR");
    await requireHealthcareStore(storeId);
    const state = await patientQueueState(storeId, session.user.id);
    const payload = `retry: 1000\nevent: queue\ndata: ${JSON.stringify({ state })}\n\n`;
    return new Response(payload, {
      headers: {
        "Content-Type": "text/event-stream; charset=utf-8",
        "Cache-Control": "no-store, no-transform",
        Connection: "keep-alive",
      },
    });
  } catch (error) { return apiError(error); }
}
