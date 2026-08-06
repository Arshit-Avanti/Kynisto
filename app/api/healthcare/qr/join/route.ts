import { NextRequest, NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { resolveHealthcareQueueByCode, recordQrEvent } from "@/lib/healthcare-qr";
import { activeHealthcareQueueForUser, patientQueueState, indiaServiceDate } from "@/lib/healthcare";
import { apiError, HttpError, noStoreJson } from "@/lib/security";
import { getD1 } from "@/db/runtime";

export async function POST(request: NextRequest) {
  try {
    const session = await getSessionUser();
    const user = session?.user;
    if (!user) {
      throw new HttpError(401, "Authentication required to join queue.", "UNAUTHORIZED");
    }

    const body = await request.json() as { queueCode: string };

    if (!body.queueCode) {
      throw new HttpError(400, "Queue code is required.", "MISSING_QUEUE_CODE");
    }

    const db = getD1();
    await db.prepare("UPDATE healthcare_queue_entries SET active_key = NULL WHERE user_id = ? AND status IN ('completed','cancelled','left','expired','removed') AND active_key IS NOT NULL")
      .bind(user.id).run();

    const { record, queueState } = await resolveHealthcareQueueByCode(body.queueCode, user.id);

    if (!queueState || !queueState.queueAvailable) {
      throw new HttpError(400, "This healthcare provider does not have an active open queue right now.", "QUEUE_NOT_AVAILABLE");
    }

    // Check if user is already in any active queue
    const activeQueue = await activeHealthcareQueueForUser(user.id);
    if (activeQueue) {
      if (String(activeQueue.storeId) === String(record.storeId)) {
        return noStoreJson({
          ok: true,
          alreadyJoined: true,
          message: "You are already in this queue.",
          entry: activeQueue,
        });
      }
      throw new HttpError(409, "You are already active in another healthcare queue.", "ACTIVE_QUEUE_EXISTS");
    }

    const now = Math.floor(Date.now() / 1000);
    const today = ((queueState as any)?.serviceDate as string | undefined) || indiaServiceDate();

    // Query fresh next_token_number directly from db settings
    const settingsRow = await db
      .prepare("SELECT next_token_number AS nextTokenNumber FROM healthcare_queue_settings WHERE store_id = ?")
      .bind(record.storeId)
      .first<{ nextTokenNumber: number }>();

    const tokenNumber = Number(settingsRow?.nextTokenNumber ?? 1);
    const entryId = crypto.randomUUID();
    const activeKey = `customer:${user.id}`;
    const expiresAt = now + 3 * 60 * 60; // 3 hours TTL

    await db.batch([
      db.prepare(`INSERT INTO healthcare_queue_entries (id, store_id, service_date, token_number, user_id, patient_name, contact_details, is_emergency, arrival_status, status, active_key, joined_at, expires_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, 0, 'on_the_way', 'waiting', ?, ?, ?, ?)`)
        .bind(entryId, record.storeId, today, tokenNumber, user.id, user.name ?? "Patient", (user as any).phone ?? null, activeKey, now, expiresAt, now),
      db.prepare("UPDATE healthcare_queue_settings SET next_token_number = next_token_number + 1, updated_at = ? WHERE store_id = ?")
        .bind(now, record.storeId),
      db.prepare(`INSERT INTO healthcare_queue_events (id, store_id, entry_id, actor_id, event_type, metadata, created_at)
        VALUES (?, ?, ?, ?, 'joined', json_object('tokenNumber', ?, 'via', 'qr_code'), ?)`)
        .bind(crypto.randomUUID(), record.storeId, entryId, user.id, tokenNumber, now),
    ]);

    // Record join analytics event
    const platform = request.headers.get("x-kynisto-platform") === "android-app" ? "app" : "web";
    recordQrEvent(body.queueCode, record.storeId, user.id, platform, "join").catch(() => {});

    // Notify owner inbox in notifications table
    if (record.ownerId) {
      await db.prepare(`INSERT INTO notifications (id, user_id, audience, type, title, message, link, created_at)
        VALUES (?, ?, 'owner', 'queue', '🚨 New Patient Joined Queue!', ?, '/owner', ?)`)
        .bind(crypto.randomUUID(), record.ownerId, `Token #${tokenNumber} (${user.name ?? "Patient"}) joined live queue for ${record.storeName}.`, now)
        .run().catch(() => {});
    }

    const updatedState = await patientQueueState(record.storeId, user.id);

    return noStoreJson({
      ok: true,
      alreadyJoined: false,
      message: `Successfully joined ${record.storeName} queue! Your token number is #${tokenNumber}.`,
      queueState: updatedState,
    });
  } catch (error) {
    return apiError(error);
  }
}
