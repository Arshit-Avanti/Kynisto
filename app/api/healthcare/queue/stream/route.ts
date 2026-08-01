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
    const encoder = new TextEncoder();
    let cancelled = false;
    const stream = new ReadableStream<Uint8Array>({
      async start(controller) {
        controller.enqueue(encoder.encode("retry: 1500\n\n"));
        for (let attempt = 0; attempt < 12 && !cancelled; attempt += 1) {
          const state = await patientQueueState(storeId, session.user.id);
          controller.enqueue(encoder.encode(`event: queue\ndata: ${JSON.stringify({ state })}\n\n`));
          await new Promise((resolve) => setTimeout(resolve, 2000));
        }
        if (!cancelled) controller.close();
      },
      cancel() { cancelled = true; },
    });
    return new Response(stream, { headers: { "Content-Type": "text/event-stream", "Cache-Control": "no-store, no-transform", Connection: "keep-alive" } });
  } catch (error) { return apiError(error); }
}
