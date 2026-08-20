import { getD1 } from "@/db/runtime";
import { requireApiPermission } from "@/lib/auth";
import { activeHealthcareQueueForUser, indiaServiceDate, patientQueueState, QUEUE_ENTRY_TTL_SECONDS, requireHealthcareStore } from "@/lib/healthcare";
import { apiError, enforceRateLimit, HttpError, noStoreJson } from "@/lib/security";
import { isHealthcareQueueEnabled } from "@/lib/settings";
import { requireFeaturePermission } from "@/lib/subscriptions";
import { cleanText, safeJson } from "@/lib/validation";

export async function GET(request: Request) {
  try {
    const session = await requireApiPermission(request, "queue.join");
    await requireFeaturePermission(session.user.id, "queue");
    let storeId = cleanText(new URL(request.url).searchParams.get("storeId"), "Provider", { max: 80, required: false });
    if (!storeId) {
      const active = await activeHealthcareQueueForUser(session.user.id);
      if (!active) return noStoreJson({ state: null, activeStoreId: null });
      storeId = String(active.storeId);
    }
    const state = await patientQueueState(storeId, session.user.id);
    const etag = `"${storeId}-${state?.status ?? 'none'}-${state?.currentTokenNumber ?? 0}-${state?.waitingCount ?? 0}-${state?.entry?.status ?? 'none'}-${state?.entry?.tokenNumber ?? 0}-${state?.entry?.position ?? 0}"`;
    const ifNoneMatch = request.headers.get("if-none-match");
    if (ifNoneMatch === etag) {
      return new Response(null, { status: 304, headers: { ETag: etag, "Cache-Control": "no-cache" } });
    }
    return new Response(JSON.stringify({ state, activeStoreId: storeId }), {
      status: 200,
      headers: {
        "Content-Type": "application/json; charset=utf-8",
        ETag: etag,
        "Cache-Control": "no-cache",
      },
    });
  } catch (error) { return apiError(error); }
}

export async function POST(request: Request) {
  try {
    const enabled = await isHealthcareQueueEnabled();
    if (!enabled) throw new HttpError(403, "Live healthcare queue is temporarily disabled by the platform administrator.", "QUEUE_DISABLED_BY_ADMIN");
    const session = await requireApiPermission(request, "queue.join", { csrf: true });
    await requireFeaturePermission(session.user.id, "queue");
    await enforceRateLimit(request, `queue:${session.user.id}`, 20, 300);
    const body = await safeJson(request);
    const action = cleanText(body.action, "Action", { max: 20 });
    const storeId = cleanText(body.storeId, "Provider", { max: 80 });
    const provider = await requireHealthcareStore(storeId);
    if ((provider.storeStatus !== "approved" && provider.storeStatus !== "active") || !provider.providerType) {
      throw new HttpError(409, "Provider is not available.", "PROVIDER_UNAVAILABLE");
    }
    const db = getD1();
    const now = Math.floor(Date.now() / 1000);
    const today = indiaServiceDate();

    if (action === "join") {
      if (!provider.ownerQueueEnabled || !provider.adminQueueEnabled) {
        throw new HttpError(403, "Live queue is not enabled for this clinic.", "QUEUE_DISABLED");
      }
      if (!provider.acceptingPatients) {
        throw new HttpError(403, "This clinic is not currently accepting new patients.", "QUEUE_NOT_ACCEPTING");
      }

      // Check real-time queue settings status
      const settings = await db.prepare("SELECT status, maximum_daily_patients AS maxDaily FROM healthcare_queue_settings WHERE store_id = ? LIMIT 1")
        .bind(storeId).first<{ status: string; maxDaily: number }>();
      if (!settings || settings.status !== "open") {
        throw new HttpError(403, "The live queue for this clinic is currently closed.", "QUEUE_CLOSED");
      }

      // Clean up any stale active keys from old completed/cancelled sessions for this user
      await db.prepare("UPDATE healthcare_queue_entries SET active_key = NULL WHERE user_id = ? AND status IN ('completed','cancelled','left','expired','removed','no_show') AND active_key IS NOT NULL")
        .bind(session.user.id).run().catch(() => {});

      const state = await patientQueueState(storeId, session.user.id);
      if (state?.entry && (state.entry.status === 'waiting' || state.entry.status === 'called' || state.entry.status === 'in_consultation')) {
        return noStoreJson({ state, existing: true });
      }
      if (state?.activeQueue && state.activeQueue.storeId !== storeId) {
        throw new HttpError(409, "You are already in an active healthcare queue. Please leave or complete your current queue before joining another clinic.", "ACTIVE_QUEUE_EXISTS");
      }
      const existing = await activeHealthcareQueueForUser(session.user.id);
      if (existing && existing.storeId !== storeId) {
        throw new HttpError(409, "You are already in an active healthcare queue. Please leave or complete your current queue before joining another clinic.", "ACTIVE_QUEUE_EXISTS");
      }

      const id = crypto.randomUUID();
      const activeKey = `customer:${session.user.id}`;
      const expiresAt = now + QUEUE_ENTRY_TTL_SECONDS;

      const results = await db.batch([
        db.prepare(`INSERT INTO healthcare_queue_entries
          (id, store_id, user_id, service_date, token_number, active_key, status, arrival_status, joined_at, expires_at, updated_at)
          SELECT ?, ?, ?, ?, COALESCE(q.next_token_number, 1), ?, 'waiting', 'waiting', ?, ?, ?
          FROM healthcare_queue_settings q
          LEFT JOIN healthcare_provider_profiles hp ON hp.store_id = q.store_id
          WHERE q.store_id = ?
          AND q.status = 'open'
          AND COALESCE(hp.owner_queue_enabled, 0) = 1
          AND COALESCE(hp.admin_queue_enabled, 0) = 1
          AND COALESCE(hp.accepting_patients, 1) = 1
          AND NOT EXISTS (SELECT 1 FROM healthcare_queue_entries active WHERE active.active_key = ? AND active.status IN ('waiting','called','in_consultation'))
          AND (SELECT COUNT(*) FROM healthcare_queue_entries e WHERE e.store_id = q.store_id
            AND e.service_date = ? AND e.status NOT IN ('cancelled','expired')) < COALESCE(q.maximum_daily_patients, 100)
          ON CONFLICT(active_key) DO NOTHING RETURNING id, token_number AS tokenNumber, status,
            (SELECT COUNT(*) FROM healthcare_queue_entries e WHERE e.store_id = store_id AND e.service_date = service_date AND e.status IN ('waiting', 'called') AND e.token_number <= token_number) AS position,
            (SELECT COUNT(*) FROM healthcare_queue_entries e WHERE e.store_id = store_id AND e.service_date = service_date AND e.status IN ('waiting', 'called')) AS waitingCount`)
          .bind(id, storeId, session.user.id, today, activeKey, now, expiresAt, now, storeId, activeKey, today),
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
        if (active) {
          return noStoreJson({ state: await patientQueueState(storeId, session.user.id), existing: true });
        }
        throw new HttpError(409, "The queue changed or reached its daily capacity. Please try again.", "QUEUE_CHANGED");
      }
      const { id: entryId, position, tokenNumber, waitingCount, status } = results[0].results[0] as { id: string, position: number, tokenNumber: number, waitingCount: number, status: string };
      return noStoreJson({ entry: { id: entryId }, position, tokenNumber, waitingCount, status, state: await patientQueueState(storeId, session.user.id) }, { status: 201 });
    }

    if (action === "leave" || action === "cancel") {
      const entry = await db.prepare("SELECT id, token_number AS tokenNumber FROM healthcare_queue_entries WHERE store_id = ? AND user_id = ? AND active_key IS NOT NULL AND status IN ('waiting','called','in_consultation') LIMIT 1").bind(storeId, session.user.id).first<{ id: string; tokenNumber: number }>();
      if (!entry) throw new HttpError(404, "You are not in this queue.", "QUEUE_ENTRY_NOT_FOUND");
      const finalStatus = action === "cancel" ? "cancelled" : "left";
      const reason = action === "cancel" ? (cleanText(body.reason, "Reason", { max: 500, required: false }) || null) : null;
      await db.batch([
        db.prepare(`UPDATE healthcare_queue_entries SET status = ?, active_key = NULL, left_at = ?, updated_at = ? WHERE id = ? AND user_id = ? AND status IN ('waiting','called','in_consultation')`).bind(finalStatus, now, now, entry.id, session.user.id),
        db.prepare("UPDATE healthcare_queue_settings SET current_token_number = CASE WHEN current_token_number = ? THEN 0 ELSE current_token_number END, updated_at = ? WHERE store_id = ?")
          .bind(entry.tokenNumber, now, storeId),
        db.prepare("INSERT INTO healthcare_queue_events (id, store_id, entry_id, actor_id, event_type, metadata, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)").bind(crypto.randomUUID(), storeId, entry.id, session.user.id, finalStatus, JSON.stringify({ tokenNumber: entry.tokenNumber, reason }), now),
        ...(provider.ownerId && action === "cancel" ? [db.prepare("INSERT INTO notifications (id, user_id, audience, type, title, message, link, created_at) VALUES (?, ?, 'user', 'queue', 'Patient cancelled', ?, '/owner?tab=healthcare', ?)")
          .bind(crypto.randomUUID(), provider.ownerId, `Token #${entry.tokenNumber} cancelled their queue visit.`, now)] : []),
      ]);
      return noStoreJson({ state: await patientQueueState(storeId, session.user.id) });
    }

    if (action === "update_arrival") {
      const arrivalStatus = body.arrivalStatus;
      const lateMinutes = typeof body.lateMinutes === "number" ? Math.min(120, Math.max(5, Math.round(body.lateMinutes))) : null;
      if (!["waiting", "leaving_now", "running_late"].includes(String(arrivalStatus))) throw new HttpError(400, "Choose a valid arrival update.", "INVALID_ARRIVAL_STATUS");
      const entry = await db.prepare("SELECT id, token_number AS tokenNumber FROM healthcare_queue_entries WHERE store_id = ? AND user_id = ? AND active_key IS NOT NULL AND status IN ('waiting','called','in_consultation') LIMIT 1")
        .bind(storeId, session.user.id).first<{ id: string; tokenNumber: number }>();
      if (!entry) throw new HttpError(404, "You are not in this queue.", "QUEUE_ENTRY_NOT_FOUND");
      const statements: D1PreparedStatement[] = [
        db.prepare("UPDATE healthcare_queue_entries SET arrival_status = ?, late_minutes = CASE WHEN ? = 'running_late' THEN ? ELSE NULL END, late_reported_at = CASE WHEN ? = 'running_late' THEN ? ELSE late_reported_at END, updated_at = ? WHERE id = ? AND user_id = ? AND status IN ('waiting','called','in_consultation')")
          .bind(arrivalStatus, arrivalStatus, lateMinutes, arrivalStatus, now, now, entry.id, session.user.id),
        db.prepare("INSERT INTO healthcare_queue_events (id, store_id, entry_id, actor_id, event_type, metadata, created_at) VALUES (?, ?, ?, ?, 'arrival_updated', ?, ?)")
          .bind(crypto.randomUUID(), storeId, entry.id, session.user.id, JSON.stringify({ arrivalStatus, lateMinutes, tokenNumber: entry.tokenNumber }), now),
      ];
      const notifMessage = arrivalStatus === "running_late" && lateMinutes
        ? `Token ${entry.tokenNumber}: Running ${lateMinutes} minutes late.`
        : `Token ${entry.tokenNumber}: ${String(arrivalStatus).replaceAll("_", " ")}.`;
      if (provider.ownerId) statements.push(db.prepare("INSERT INTO notifications (id, user_id, audience, type, title, message, link, created_at) VALUES (?, ?, 'user', 'queue', 'Patient arrival update', ?, '/owner?tab=healthcare', ?)")
        .bind(crypto.randomUUID(), provider.ownerId, notifMessage, now));
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
