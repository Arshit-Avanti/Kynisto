import { NextRequest } from "next/server";
import { requireApiPermission } from "@/lib/auth";
import { getOrCreatePermanentQueueId, getQrAnalytics } from "@/lib/healthcare-qr";
import { apiError, HttpError, noStoreJson } from "@/lib/security";
import { getD1 } from "@/db/runtime";

export async function GET(request: NextRequest) {
  try {
    const session = await requireApiPermission(request, "queue.manage_own");
    const db = getD1();
    
    const userEmail = (session.user.email || "").toLowerCase().trim();
    // Find store owned by this user
    const store = await db.prepare(
      `SELECT id, name, slug FROM stores
       WHERE (owner_id = ? OR owner_id IN (SELECT id FROM users WHERE LOWER(email) = ?))
       ORDER BY created_at DESC LIMIT 1`
    )
      .bind(session.user.id, userEmail)
      .first<{ id: string; name: string; slug: string }>();

    if (!store) {
      return noStoreJson({ ok: false, message: "No store found for this account." }, { status: 404 });
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
    const body = await request.json() as { status?: "active" | "disabled"; queueCode?: string };
    const userEmail = (session.user.email || "").toLowerCase().trim();

    const store = await db.prepare(
      `SELECT id, name, slug FROM stores
       WHERE (owner_id = ? OR owner_id IN (SELECT id FROM users WHERE LOWER(email) = ?))
       ORDER BY created_at DESC LIMIT 1`
    )
      .bind(session.user.id, userEmail)
      .first<{ id: string; name: string; slug: string }>();

    if (!store) {
      return noStoreJson({ ok: false, message: "No store found for this account." }, { status: 404 });
    }
    
    const now = Math.floor(Date.now() / 1000);

    if (body.status) {
      const newStatus = body.status === "disabled" ? "disabled" : "active";
      await db.prepare("UPDATE permanent_healthcare_qr_ids SET status = ?, updated_at = ? WHERE store_id = ?")
        .bind(newStatus, now, store.id)
        .run();
    }

    if (body.queueCode) {
      const cleanCode = body.queueCode.trim().toLowerCase().replace(/[^a-z0-9_-]/g, "-").replace(/-+/g, "-");
      if (cleanCode.length < 2 || cleanCode.length > 50) {
        throw new HttpError(400, "Queue code must be between 2 and 50 alphanumeric characters.", "INVALID_CODE");
      }
      const existingConflict = await db.prepare("SELECT store_id FROM permanent_healthcare_qr_ids WHERE (queue_code = ? OR UPPER(queue_code) = UPPER(?)) AND store_id <> ? LIMIT 1")
        .bind(cleanCode, cleanCode, store.id)
        .first();
      if (existingConflict) {
        throw new HttpError(409, "This queue code is already taken. Please choose another unique attractive code.", "CODE_TAKEN");
      }
      await db.prepare("UPDATE permanent_healthcare_qr_ids SET queue_code = ?, updated_at = ? WHERE store_id = ?")
        .bind(cleanCode, now, store.id)
        .run();
      // Also update store slug to keep in sync
      await db.prepare("UPDATE stores SET slug = ?, updated_at = ? WHERE id = ? AND owner_id = ?")
        .bind(cleanCode, now, store.id, session.user.id)
        .run().catch(() => {});
    }

    const qrRecord = await getOrCreatePermanentQueueId(store.id, session.user.id);

    return noStoreJson({
      ok: true,
      qr: qrRecord,
    });
  } catch (error) {
    return apiError(error);
  }
}

