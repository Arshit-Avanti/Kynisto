import { getSessionUser } from "@/lib/auth";
import { activeHealthcareQueueForUser, patientQueueState } from "@/lib/healthcare";
import { apiError, noStoreJson } from "@/lib/security";
import { getD1 } from "@/db/runtime";

export const runtime = "edge";

export async function GET(request: Request) {
  try {
    const session = await getSessionUser();
    const user = session?.user;
    if (!user) return noStoreJson({ activeQueue: null });

    const active = await activeHealthcareQueueForUser(user.id);
    if (!active) return noStoreJson({ activeQueue: null });

    const storeId = String(active.storeId ?? "");
    if (!storeId) return noStoreJson({ activeQueue: null });

    // Get queue code for deep link
    const queueCodeRow = await getD1()
      .prepare("SELECT queue_code AS queueCode FROM permanent_healthcare_qr_ids WHERE store_id = ? LIMIT 1")
      .bind(storeId)
      .first<{ queueCode: string }>();

    const state = await patientQueueState(storeId, user.id);

    return noStoreJson({
      activeQueue: {
        storeId: active.storeId,
        storeName: active.storeName,
        storeSlug: active.storeSlug,
        tokenNumber: active.tokenNumber,
        status: active.status,
        expiresAt: active.expiresAt,
        queueCode: queueCodeRow?.queueCode ?? null,
        queueState: state,
      },
    });
  } catch (error) {
    return apiError(error);
  }
}
