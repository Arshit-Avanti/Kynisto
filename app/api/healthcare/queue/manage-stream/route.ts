import { requireApiSession } from "@/lib/auth";
import { healthcareQueueDashboard } from "@/lib/healthcare-queue-management";
import { requireOwnedStore } from "@/lib/ownership";
import { hasPermission } from "@/lib/rbac";
import { apiError, HttpError } from "@/lib/security";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const session = await requireApiSession(request);
    const storeId = new URL(request.url).searchParams.get("storeId")?.trim();
    if (!storeId) throw new HttpError(400, "Provider is required.", "VALIDATION_ERROR");
    const canManageAll = hasPermission(session.user.role, "healthcare.manage_all");
    const canManageOwn = hasPermission(session.user.role, "queue.manage_own");
    if (!canManageAll && !canManageOwn) throw new HttpError(403, "Access Denied", "ACCESS_DENIED");
    if (!canManageAll) await requireOwnedStore(session.user.id, storeId);

    const encoder = new TextEncoder();
    let cancelled = false;
    const stream = new ReadableStream<Uint8Array>({
      async start(controller) {
        controller.enqueue(encoder.encode("retry: 1500\n\n"));
        for (let attempt = 0; attempt < 12 && !cancelled; attempt += 1) {
          const queue = await healthcareQueueDashboard(storeId);
          controller.enqueue(encoder.encode(`event: queue\ndata: ${JSON.stringify({ queue })}\n\n`));
          await new Promise((resolve) => setTimeout(resolve, 2000));
        }
        if (!cancelled) controller.close();
      },
      cancel() { cancelled = true; },
    });
    return new Response(stream, { headers: { "Content-Type": "text/event-stream", "Cache-Control": "no-store, no-transform", Connection: "keep-alive" } });
  } catch (error) {
    return apiError(error);
  }
}
