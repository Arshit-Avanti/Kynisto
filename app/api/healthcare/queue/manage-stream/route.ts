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

    const queue = await healthcareQueueDashboard(storeId);
    const payload = `retry: 3000\nevent: queue\ndata: ${JSON.stringify({ queue })}\n\n`;
    return new Response(payload, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-store, no-transform",
        Connection: "keep-alive",
      },
    });
  } catch (error) {
    return apiError(error);
  }
}
