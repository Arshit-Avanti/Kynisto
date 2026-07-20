import { getD1 } from "@/db/runtime";
import { requireApiPermission } from "@/lib/auth";
import { activeHealthcareQueueForUser, indiaServiceDate, patientQueueState, QUEUE_ENTRY_TTL_SECONDS, requireHealthcareStore } from "@/lib/healthcare";
import { apiError, enforceRateLimit, HttpError, noStoreJson } from "@/lib/security";
import { cleanText, safeJson } from "@/lib/validation";

export async function GET(request: Request) {
  try {
    const session = await requireApiPermission(request, "queue.join");
    let storeId = cleanText(new URL(request.url).searchParams.get("storeId"), "Provider", { max: 80, required: false });
    if (!storeId) {
      const active = await activeHealthcareQueueForUser(session.user.id);
      if (!active) return noStoreJson({ state: null, activeStoreId: null });
      storeId = String(active.storeId);
    }
    await requireHealthcareStore(storeId);
    return noStoreJson({ state: await patientQueueState(storeId, session.user.id), activeStoreId: storeId });
  } catch (error) { return apiError(error); }
}

export async function POST(request: Request) {
  try {
    const session = await requireApiPermission(request, "queue.join", { csrf: true });
    await enforceRateLimit(request, `queue:${session.user.id}`, 20, 300);
    const body = await safeJson(request);
    const action = cleanText(body.action, "Action", { max: 20 });
    const storeId = cleanText(body.storeId, "Provider", { max: 80 });
    const provider = await requireHealthcareStore(storeId);
    if (provider.storeStatus !== "approved" || !provider.providerType || provider.verificationStatus !== "verified") throw new HttpError(409, "Provider is not available.", "PROVIDER_UNAVAILABLE");
    const db = getD1();
    const now = Math.floor(Date.now() / 1000);
    const today = indiaServiceDate();

    if (action === "join") {
      const state = await patientQueueState(storeId, session.user.id);
      if (state?.entry) return noStoreJson({ state, existing: true });
      if (state?.activeQueue) throw new HttpError(409, "You are already in an active healthcare queue. Please leave or complete your current queue before joining another clinic.", "ACTIVE_QUEUE_EXISTS");
      if (!state?.queueAvailable) throw new HttpError(409, "This live queue is not open.", "QUEUE_CLOSED");
      const existing = await activeHealthcareQueueForUser(session.user.id);
      if (existing) throw new HttpError(409, "You are already in an active healthcare queue. Please leave or complete your current queue before joining another clinic.", "ACTIVE_QUEUE_EXISTS");
      const id = crypto.randomUUID();
      const activeKey = `customer:${session.user.id}`;
      const expiresAt = now + QUEUE_ENTRY_TTL_SECONDS;
      const results = await db.batch([
        db.prepare(`INSERT INTO healthcare_queue_entries
          (id, store_id, user_id, service_date, token_number, active_key, status, arrival_status, joined_at, expires_at, updated_at)
          SELECT ?, ?, ?, ?, q.next_token_number, ?, 'waiting', 'waiting', ?, ?, ?
          FROM healthcare_queue_settings q JOIN healthcare_provider_profiles hp ON hp.store_id = q.store_id
          WHERE q.store_id = ? AND q.service_date = ? AND q.status = 'open'
          AND hp.queue_activation_status = 'approved' AND hp.admin_queue_enabled = 1
          AND hp.owner_queue_enabled = 1 AND hp.accepting_patients = 1
          AND hp.verification_status = 'verified'
          AND NOT EXISTS (SELECT 1 FROM healthcare_queue_entries active WHERE active.active_key = ? AND active.status IN ('waiting','called'))
          AND (SELECT COUNT(*) FROM healthcare_queue_entries e WHERE e.store_id = q.store_id
            AND e.service_date = q.service_date AND e.status NOT IN ('cancelled','expired')) < q.maximum_daily_patients
          ON CONFLICT(active_key) DO NOTHING RETURNING id, token_number AS tokenNumber`)
          .bind(id, storeId, session.user.id, today, activeKey, now, expiresAt, now, storeId, today, activeKey),
        db.prepare(`UPDATE healthcare_queue_settings SET next_token_number = next_token_number + 1, updated_at = ?
          WHERE store_id = ? AND EXISTS (SELECT 1 FROM healthcare_queue_entries WHERE id = ?)`)
          .bind(now, storeId, id),
        db.prepare(`INSERT INTO healthcare_queue_events (id, store_id, entry_id, actor_id, event_type, metadata, created_at)
          SELECT ?, store_id, id, ?, 'joined', json_object('tokenNumber', token_number, 'expiresAt', expires_at), ?
          FROM healthcare_queue_entries WHERE id = ?`)
          .bind(crypto.randomUUID(), session.user.id, now, id),
      ]);
      if (!results[0]?.results?.length) {
        const active = await activeHealthcareQueueForUser(session.user.id);
        if (active) throw new HttpError(409, "You are already in an active healthcare queue. Please leave or complete your current queue before joining another clinic.", "ACTIVE_QUEUE_EXISTS");
        throw new HttpError(409, "The queue changed or reached its daily capacity. Please try again.", "QUEUE_CHANGED");
      }
      return noStoreJson({ state: await patientQueueState(storeId, session.user.id) }, { status: 201 });
    }

    if (action === "leave" || action === "cancel") {
      const entry = await db.prepare("SELECT id FROM healthcare_queue_entries WHERE store_id = ? AND user_id = ? AND active_key IS NOT NULL LIMIT 1").bind(storeId, session.user.id).first<{ id: string }>();
      if (!entry) throw new HttpError(404, "You are not in this queue.", "QUEUE_ENTRY_NOT_FOUND");
      await db.batch([
        db.prepare("UPDATE healthcare_queue_entries SET status = 'left', active_key = NULL, left_at = ?, updated_at = ? WHERE id = ? AND user_id = ?").bind(now, now, entry.id, session.user.id),
        db.prepare("UPDATE healthcare_queue_settings SET current_token_number = CASE WHEN current_token_number = (SELECT token_number FROM healthcare_queue_entries WHERE id = ?) THEN 0 ELSE current_token_number END, updated_at = ? WHERE store_id = ?")
          .bind(entry.id, now, storeId),
        db.prepare("INSERT INTO healthcare_queue_events (id, store_id, entry_id, actor_id, event_type, created_at) VALUES (?, ?, ?, ?, 'left', ?)").bind(crypto.randomUUID(), storeId, entry.id, session.user.id, now),
      ]);
      return noStoreJson({ state: await patientQueueState(storeId, session.user.id) });
    }

    if (action === "update_arrival") {
      const arrivalStatus = body.arrivalStatus;
      if (!["waiting", "leaving_now", "running_late"].includes(String(arrivalStatus))) throw new HttpError(400, "Choose a valid arrival update.", "INVALID_ARRIVAL_STATUS");
      const entry = await db.prepare("SELECT id, token_number AS tokenNumber FROM healthcare_queue_entries WHERE store_id = ? AND user_id = ? AND active_key IS NOT NULL AND status IN ('waiting','called') LIMIT 1")
        .bind(storeId, session.user.id).first<{ id: string; tokenNumber: number }>();
      if (!entry) throw new HttpError(404, "You are not in this queue.", "QUEUE_ENTRY_NOT_FOUND");
      const statements: D1PreparedStatement[] = [
        db.prepare("UPDATE healthcare_queue_entries SET arrival_status = ?, updated_at = ? WHERE id = ? AND user_id = ?").bind(arrivalStatus, now, entry.id, session.user.id),
        db.prepare("INSERT INTO healthcare_queue_events (id, store_id, entry_id, actor_id, event_type, metadata, created_at) VALUES (?, ?, ?, ?, 'arrival_updated', ?, ?)")
          .bind(crypto.randomUUID(), storeId, entry.id, session.user.id, JSON.stringify({ arrivalStatus, tokenNumber: entry.tokenNumber }), now),
      ];
      if (provider.ownerId) statements.push(db.prepare("INSERT INTO notifications (id, user_id, audience, type, title, message, link, created_at) VALUES (?, ?, 'user', 'queue', 'Patient arrival update', ?, '/owner?tab=healthcare', ?)")
        .bind(crypto.randomUUID(), provider.ownerId, `Token ${entry.tokenNumber}: ${String(arrivalStatus).replaceAll("_", " ")}.`, now));
      await db.batch(statements);
      return noStoreJson({ state: await patientQueueState(storeId, session.user.id) });
    }

    if (action === "report") {
      const reason = cleanText(body.reason, "Reason", { min: 3, max: 120 });
      const details = cleanText(body.details, "Details", { max: 1000, required: false }) || null;
      await db.prepare("INSERT INTO healthcare_queue_reports (id, store_id, entry_id, reporter_id, reason, details, status, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, 'open', ?, ?)").bind(crypto.randomUUID(), storeId, cleanText(body.entryId, "Queue entry", { max: 80, required: false }) || null, session.user.id, reason, details, now, now).run();
      return noStoreJson({ ok: true }, { status: 201 });
    }
    throw new HttpError(400, "Unsupported queue action.", "INVALID_ACTION");
  } catch (error) { return apiError(error); }
}
