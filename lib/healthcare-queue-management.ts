import { getD1 } from "@/db/runtime";
import { indiaServiceDate, isQueueEligibleHealthcareType, QUEUE_ENTRY_TTL_SECONDS, requireHealthcareStore, resetQueueForNewDay } from "@/lib/healthcare";
import { HttpError } from "@/lib/security";

export const QUEUE_OPERATIONS = ["open", "pause", "resume", "close", "reset", "call_next", "recall", "skip", "complete", "remove", "add_walk_in", "add_emergency"] as const;
export type QueueOperation = (typeof QUEUE_OPERATIONS)[number];

export function isQueueOperation(value: unknown): value is QueueOperation {
  return typeof value === "string" && QUEUE_OPERATIONS.includes(value as QueueOperation);
}

export async function healthcareQueueDashboard(storeId: string) {
  await resetQueueForNewDay(storeId);
  const db = getD1();
  const today = indiaServiceDate();
  const [profile, entries, analytics, history, events] = await Promise.all([
    db.prepare(`SELECT hp.provider_type AS providerType, hp.accepting_patients AS acceptingPatients,
      hp.emergency_available AS emergencyAvailable, hp.admin_queue_enabled AS adminQueueEnabled,
      hp.owner_queue_enabled AS ownerQueueEnabled, hp.verification_status AS verificationStatus,
      hp.queue_activation_status AS queueActivationStatus, hp.queue_requested_at AS queueRequestedAt,
      hp.queue_reviewed_at AS queueReviewedAt, hp.queue_decision_reason AS queueDecisionReason,
      q.status, q.consultation_minutes AS consultationMinutes, q.opening_time AS openingTime,
      q.closing_time AS closingTime, q.maximum_daily_patients AS maximumDailyPatients,
      q.current_token_number AS currentTokenNumber, q.next_token_number AS nextTokenNumber,
      q.service_date AS serviceDate
      FROM healthcare_provider_profiles hp LEFT JOIN healthcare_queue_settings q ON q.store_id = hp.store_id
      WHERE hp.store_id = ?`).bind(storeId).first(),
    db.prepare(`SELECT e.id, e.token_number AS tokenNumber, e.status, e.arrival_status AS arrivalStatus,
      e.is_emergency AS isEmergency, e.is_walk_in AS isWalkIn, e.joined_at AS joinedAt,
      e.expires_at AS expiresAt, e.called_at AS calledAt,
      e.recalled_at AS recalledAt, e.recall_count AS recallCount,
      COALESCE(e.patient_name, e.emergency_patient_name, u.name) AS patientName,
      COALESCE(e.contact_details, e.emergency_patient_phone, u.phone) AS patientPhone
      FROM healthcare_queue_entries e LEFT JOIN users u ON u.id = e.user_id
      WHERE e.store_id = ? AND e.service_date = ?
      ORDER BY CASE e.status WHEN 'called' THEN 0 WHEN 'waiting' THEN 1 ELSE 2 END,
        e.is_emergency DESC, e.token_number ASC LIMIT 250`).bind(storeId, today).all(),
    db.prepare(`SELECT status, COUNT(*) AS total,
      ROUND(AVG(CASE WHEN called_at IS NOT NULL THEN called_at - joined_at END) / 60.0, 1) AS averageWaitMinutes
      FROM healthcare_queue_entries WHERE store_id = ? AND service_date >= date('now','-30 day') GROUP BY status`).bind(storeId).all(),
    db.prepare(`SELECT service_date AS serviceDate, COUNT(*) AS total,
      SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) AS completed,
      SUM(CASE WHEN status = 'skipped' THEN 1 ELSE 0 END) AS skipped,
      SUM(CASE WHEN is_emergency = 1 THEN 1 ELSE 0 END) AS emergency
      FROM healthcare_queue_entries WHERE store_id = ? GROUP BY service_date ORDER BY service_date DESC LIMIT 30`).bind(storeId).all(),
    db.prepare(`SELECT event_type AS eventType, metadata, created_at AS createdAt
      FROM healthcare_queue_events WHERE store_id = ? ORDER BY created_at DESC LIMIT 100`).bind(storeId).all(),
  ]);
  return { profile, entries: entries.results ?? [], analytics: analytics.results ?? [], history: history.results ?? [], events: events.results ?? [] };
}

export async function operateHealthcareQueue(options: {
  storeId: string;
  actorId: string;
  action: QueueOperation;
  entryId?: string | null;
  patientName?: string | null;
  patientPhone?: string | null;
}) {
  const { storeId, actorId, action } = options;
  const provider = await requireHealthcareStore(storeId);
  if (provider.storeStatus !== "approved" || !provider.providerType || provider.verificationStatus !== "verified") {
    throw new HttpError(409, "Verify and approve this healthcare provider before operating its queue.", "PROVIDER_UNAVAILABLE");
  }
  if (!isQueueEligibleHealthcareType(provider.providerType)) {
    throw new HttpError(409, "Live Queue is not available for this healthcare type.", "QUEUE_TYPE_UNAVAILABLE");
  }
  if (provider.queueActivationStatus !== "approved" || !provider.adminQueueEnabled || !provider.ownerQueueEnabled) {
    throw new HttpError(409, "Live Queue activation must be approved and enabled first.", "QUEUE_NOT_ENABLED");
  }
  const today = await resetQueueForNewDay(storeId);
  const db = getD1();
  const now = Math.floor(Date.now() / 1000);

  if (action === "reset") {
    await db.batch([
      db.prepare("UPDATE healthcare_queue_entries SET status = 'cancelled', active_key = NULL, left_at = ?, updated_at = ? WHERE store_id = ? AND service_date = ? AND status IN ('waiting','called')")
        .bind(now, now, storeId, today),
      db.prepare("UPDATE healthcare_queue_settings SET status = 'closed', current_token_number = 0, next_token_number = 1, service_date = ?, opened_at = NULL, closed_at = ?, updated_by = ?, updated_at = ? WHERE store_id = ?")
        .bind(today, now, actorId, now, storeId),
      db.prepare("INSERT INTO healthcare_queue_events (id, store_id, actor_id, event_type, metadata, created_at) VALUES (?, ?, ?, 'queue_reset', ?, ?)")
        .bind(crypto.randomUUID(), storeId, actorId, JSON.stringify({ serviceDate: today }), now),
    ]);
    return { ok: true, status: "closed" };
  }

  if (action === "open" || action === "pause" || action === "resume" || action === "close") {
    const current = await db.prepare("SELECT status FROM healthcare_queue_settings WHERE store_id = ? LIMIT 1")
      .bind(storeId).first<{ status: string }>();
    if (!current) throw new HttpError(409, "Configure Live Queue before operating it.", "QUEUE_SETUP_REQUIRED");
    if (action === "pause" && current.status !== "open") throw new HttpError(409, "Only an open queue can be paused.", "QUEUE_NOT_OPEN");
    if (action === "resume" && current.status !== "paused") throw new HttpError(409, "Only a paused queue can be resumed.", "QUEUE_NOT_PAUSED");
    const status = action === "pause" ? "paused" : action === "close" ? "closed" : "open";
    const statements: D1PreparedStatement[] = [
      db.prepare(`UPDATE healthcare_queue_settings SET status = ?, service_date = ?, current_token_number = CASE WHEN ? = 'closed' THEN 0 ELSE current_token_number END,
        opened_at = CASE WHEN ? = 'open' THEN COALESCE(opened_at, ?) ELSE opened_at END,
        closed_at = CASE WHEN ? = 'closed' THEN ? ELSE NULL END, updated_by = ?, updated_at = ?
        WHERE store_id = ?`).bind(status, today, status, status, now, status, now, actorId, now, storeId),
      db.prepare("INSERT INTO healthcare_queue_events (id, store_id, actor_id, event_type, metadata, created_at) VALUES (?, ?, ?, ?, ?, ?)")
        .bind(crypto.randomUUID(), storeId, actorId, `queue_${status}`, JSON.stringify({ serviceDate: today }), now),
    ];
    if (action === "close") {
      statements.push(db.prepare("UPDATE healthcare_queue_entries SET status = 'cancelled', active_key = NULL, left_at = ?, updated_at = ? WHERE store_id = ? AND service_date = ? AND status IN ('waiting','called')")
        .bind(now, now, storeId, today));
    }
    await db.batch(statements);
    return { ok: true, status };
  }

  if (action === "add_emergency" || action === "add_walk_in") {
    const isEmergency = action === "add_emergency";
    const settings = await db.prepare(`UPDATE healthcare_queue_settings SET next_token_number = next_token_number + 1, updated_by = ?, updated_at = ?
      WHERE store_id = ? AND service_date = ? AND status IN ('open','paused')
      AND (? = 1 OR (SELECT COUNT(*) FROM healthcare_queue_entries e WHERE e.store_id = healthcare_queue_settings.store_id
        AND e.service_date = healthcare_queue_settings.service_date AND e.status NOT IN ('cancelled','expired')) < maximum_daily_patients)
      RETURNING next_token_number - 1 AS tokenNumber`)
      .bind(actorId, now, storeId, today, isEmergency ? 1 : 0).first<{ tokenNumber: number }>();
    if (!settings) throw new HttpError(409, isEmergency ? "Open or pause the queue before adding an emergency patient." : "Open or pause the queue and confirm daily capacity before adding a walk-in patient.", "QUEUE_NOT_ACTIVE");
    const id = crypto.randomUUID();
    await db.batch([
      db.prepare(`INSERT INTO healthcare_queue_entries
        (id, store_id, user_id, service_date, token_number, active_key, status, arrival_status, is_emergency,
          is_walk_in, patient_name, contact_details, emergency_patient_name, emergency_patient_phone,
          joined_at, expires_at, updated_at)
        VALUES (?, ?, ?, ?, ?, NULL, 'waiting', 'leaving_now', ?, 1, ?, ?, ?, ?, ?, ?, ?)`)
        .bind(id, storeId, actorId, today, settings.tokenNumber, isEmergency ? 1 : 0,
          options.patientName ?? "Walk-in patient", options.patientPhone ?? null,
          isEmergency ? options.patientName ?? "Emergency patient" : null,
          isEmergency ? options.patientPhone ?? null : null,
          now, now + QUEUE_ENTRY_TTL_SECONDS, now),
      db.prepare("INSERT INTO healthcare_queue_events (id, store_id, entry_id, actor_id, event_type, metadata, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)")
        .bind(crypto.randomUUID(), storeId, id, actorId, isEmergency ? "emergency_added" : "walk_in_added", JSON.stringify({ tokenNumber: settings.tokenNumber, patientName: options.patientName }), now),
    ]);
    return { ok: true, entry: { id, tokenNumber: settings.tokenNumber } };
  }

  if (action === "call_next") {
    const settings = await db.prepare("SELECT status FROM healthcare_queue_settings WHERE store_id = ?").bind(storeId).first<{ status: string }>();
    if (settings?.status !== "open") throw new HttpError(409, "Open or resume the queue before calling a patient.", "QUEUE_NOT_OPEN");
    const next = await db.prepare(`UPDATE healthcare_queue_entries SET status = 'called', called_at = ?, updated_at = ?
      WHERE id = (SELECT id FROM healthcare_queue_entries WHERE store_id = ? AND service_date = ? AND status = 'waiting' ORDER BY is_emergency DESC, token_number ASC LIMIT 1)
      AND NOT EXISTS (SELECT 1 FROM healthcare_queue_entries WHERE store_id = ? AND service_date = ? AND status = 'called')
      RETURNING id, user_id AS userId, token_number AS tokenNumber, is_emergency AS isEmergency, is_walk_in AS isWalkIn`)
      .bind(now, now, storeId, today, storeId, today).first<{ id: string; userId: string; tokenNumber: number; isEmergency: number; isWalkIn: number }>();
    if (!next) {
      const active = await db.prepare("SELECT id FROM healthcare_queue_entries WHERE store_id = ? AND service_date = ? AND status = 'called' LIMIT 1").bind(storeId, today).first();
      throw new HttpError(409, active ? "Complete or skip the current patient first." : "No patients are waiting.", active ? "PATIENT_ALREADY_CALLED" : "QUEUE_EMPTY");
    }
    const upcoming = await db.prepare("SELECT user_id AS userId, token_number AS tokenNumber FROM healthcare_queue_entries WHERE store_id = ? AND service_date = ? AND status = 'waiting' AND is_emergency = 0 AND is_walk_in = 0 AND token_number > ? ORDER BY token_number ASC LIMIT 2")
      .bind(storeId, today, next.tokenNumber).all<{ userId: string; tokenNumber: number }>();
    const statements: D1PreparedStatement[] = [
      db.prepare("UPDATE healthcare_queue_settings SET current_token_number = ?, updated_by = ?, updated_at = ? WHERE store_id = ?").bind(next.tokenNumber, actorId, now, storeId),
      db.prepare("INSERT INTO healthcare_queue_events (id, store_id, entry_id, actor_id, event_type, metadata, created_at) VALUES (?, ?, ?, ?, 'called', ?, ?)").bind(crypto.randomUUID(), storeId, next.id, actorId, JSON.stringify({ tokenNumber: next.tokenNumber }), now),
    ];
    if (!next.isEmergency && !next.isWalkIn) statements.push(db.prepare("INSERT INTO notifications (id, user_id, audience, type, title, message, link, created_at) VALUES (?, ?, 'user', 'queue', 'It is your turn', ?, '/healthcare', ?)").bind(crypto.randomUUID(), next.userId, `${provider.name} is calling token ${next.tokenNumber}.`, now));
    for (const patient of upcoming.results ?? []) statements.push(db.prepare("INSERT INTO notifications (id, user_id, audience, type, title, message, link, created_at) VALUES (?, ?, 'user', 'queue', 'Your turn is approaching', ?, '/healthcare', ?)").bind(crypto.randomUUID(), patient.userId, `Token ${patient.tokenNumber} will be called soon at ${provider.name}.`, now));
    await db.batch(statements);
    return { ok: true, called: next };
  }

  const entryId = options.entryId ?? null;
  const entry = entryId
    ? await db.prepare(`SELECT id, user_id AS userId, token_number AS tokenNumber, status, is_emergency AS isEmergency, is_walk_in AS isWalkIn
        FROM healthcare_queue_entries WHERE id = ? AND store_id = ? AND service_date = ? AND status IN ('waiting','called') LIMIT 1`)
      .bind(entryId, storeId, today).first<{ id: string; userId: string; tokenNumber: number; status: string; isEmergency: number; isWalkIn: number }>()
    : await db.prepare("SELECT id, user_id AS userId, token_number AS tokenNumber, status, is_emergency AS isEmergency, is_walk_in AS isWalkIn FROM healthcare_queue_entries WHERE store_id = ? AND service_date = ? AND status = 'called' LIMIT 1")
      .bind(storeId, today).first<{ id: string; userId: string; tokenNumber: number; status: string; isEmergency: number; isWalkIn: number }>();
  if (!entry) throw new HttpError(404, "Active patient not found.", "QUEUE_ENTRY_NOT_FOUND");

  if (action === "recall") {
    if (entry.status !== "called") throw new HttpError(409, "Only the current called patient can be recalled.", "PATIENT_NOT_CALLED");
    const statements: D1PreparedStatement[] = [
      db.prepare("UPDATE healthcare_queue_entries SET recalled_at = ?, recall_count = recall_count + 1, updated_at = ? WHERE id = ?").bind(now, now, entry.id),
      db.prepare("INSERT INTO healthcare_queue_events (id, store_id, entry_id, actor_id, event_type, metadata, created_at) VALUES (?, ?, ?, ?, 'recalled', ?, ?)").bind(crypto.randomUUID(), storeId, entry.id, actorId, JSON.stringify({ tokenNumber: entry.tokenNumber }), now),
    ];
    if (!entry.isEmergency && !entry.isWalkIn) statements.push(db.prepare("INSERT INTO notifications (id, user_id, audience, type, title, message, link, created_at) VALUES (?, ?, 'user', 'queue', 'Your token was recalled', ?, '/healthcare', ?)").bind(crypto.randomUUID(), entry.userId, `${provider.name} is recalling token ${entry.tokenNumber}.`, now));
    await db.batch(statements);
    return { ok: true, status: "recalled" };
  }

  if (action === "remove") {
    await db.batch([
      db.prepare("UPDATE healthcare_queue_entries SET status = 'removed', active_key = NULL, left_at = ?, updated_at = ? WHERE id = ?")
        .bind(now, now, entry.id),
      db.prepare("UPDATE healthcare_queue_settings SET current_token_number = CASE WHEN current_token_number = ? THEN 0 ELSE current_token_number END, updated_by = ?, updated_at = ? WHERE store_id = ?")
        .bind(entry.tokenNumber, actorId, now, storeId),
      db.prepare("INSERT INTO healthcare_queue_events (id, store_id, entry_id, actor_id, event_type, metadata, created_at) VALUES (?, ?, ?, ?, 'removed', ?, ?)")
        .bind(crypto.randomUUID(), storeId, entry.id, actorId, JSON.stringify({ tokenNumber: entry.tokenNumber }), now),
      ...(!entry.isEmergency && !entry.isWalkIn ? [db.prepare("INSERT INTO notifications (id, user_id, audience, type, title, message, link, created_at) VALUES (?, ?, 'user', 'queue', 'Removed from queue', ?, '/healthcare', ?)")
        .bind(crypto.randomUUID(), entry.userId, `Token ${entry.tokenNumber} was removed from ${provider.name}.`, now)] : []),
    ]);
    return { ok: true, status: "removed" };
  }

  if (action === "complete" && entry.status !== "called") throw new HttpError(409, "Call this patient before marking the visit completed.", "PATIENT_NOT_CALLED");
  const status = action === "skip" ? "skipped" : "completed";
  await db.batch([
    db.prepare(`UPDATE healthcare_queue_entries SET status = ?, active_key = NULL,
      ${status === "completed" ? "completed_at" : "left_at"} = ?, updated_at = ? WHERE id = ?`)
      .bind(status, now, now, entry.id),
    db.prepare("UPDATE healthcare_queue_settings SET current_token_number = CASE WHEN current_token_number = ? THEN 0 ELSE current_token_number END, updated_by = ?, updated_at = ? WHERE store_id = ?")
      .bind(entry.tokenNumber, actorId, now, storeId),
    db.prepare("INSERT INTO healthcare_queue_events (id, store_id, entry_id, actor_id, event_type, metadata, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)")
      .bind(crypto.randomUUID(), storeId, entry.id, actorId, status, JSON.stringify({ tokenNumber: entry.tokenNumber }), now),
  ]);
  return { ok: true, status };
}
