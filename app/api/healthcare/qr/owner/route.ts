import { NextRequest } from "next/server";
import { requireApiPermission } from "@/lib/auth";
import { getOrCreatePermanentQueueId, getQrAnalytics } from "@/lib/healthcare-qr";
import { apiError, noStoreJson } from "@/lib/security";
import { getD1 } from "@/db/runtime";

export async function GET(request: NextRequest) {
  try {
    const session = await requireApiPermission(request, "queue.manage_own");
    const db = getD1();
    
    // Find store owned by this user
    const store = await db.prepare("SELECT id, name, slug FROM stores WHERE owner_id = ? LIMIT 1")
      .bind(session.user.id)
      .first<{ id: string; name: string; slug: string }>();

    if (!store) {
      return noStoreJson({ ok: false, message: "No store found for this owner." }, { status: 404 });
    }

    const qrRecord = await getOrCreatePermanentQueueId(store.id, session.user.id);
    const analytics = await getQrAnalytics(store.id);

    return noStoreJson({
      ok: true,
      store,
      qr: qrRecord,
      analytics,
    });
  } catch (error) {
    return apiError(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await requireApiPermission(request, "queue.manage_own");
    const db = getD1();
    const body = await request.json() as { status?: "active" | "disabled" };

    const store = await db.prepare("SELECT id, name, slug FROM stores WHERE owner_id = ? LIMIT 1")
      .bind(session.user.id)
      .first<{ id: string; name: string; slug: string }>();

    if (!store) {
      return noStoreJson({ ok: false, message: "No store found for this owner." }, { status: 404 });
    }
    
    const newStatus = body.status === "disabled" ? "disabled" : "active";

    await db.prepare("UPDATE permanent_healthcare_qr_ids SET status = ?, updated_at = ? WHERE store_id = ?")
      .bind(newStatus, Math.floor(Date.now() / 1000), store.id)
      .run();

    const qrRecord = await getOrCreatePermanentQueueId(store.id, session.user.id);

    return noStoreJson({
      ok: true,
      qr: qrRecord,
    });
  } catch (error) {
    return apiError(error);
  }
}
