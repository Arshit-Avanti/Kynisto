import { getD1 } from "@/db/runtime";
import { requireApiPermission } from "@/lib/auth";
import { expireHealthcareQueueEntries, HEALTHCARE_TYPES, indiaServiceDate, isHealthcareType, isQueueEligibleHealthcareType } from "@/lib/healthcare";
import { healthcareQueueDashboard, isQueueOperation, operateHealthcareQueue } from "@/lib/healthcare-queue-management";
import { writeAudit } from "@/lib/ownership";
import { apiError, HttpError, noStoreJson } from "@/lib/security";
import { booleanInput, cleanText, numberInput, safeJson } from "@/lib/validation";

function cleanIdList(value: unknown): string[] {
  if (!Array.isArray(value)) throw new HttpError(400, "Choose at least one healthcare provider.", "SELECTION_REQUIRED");
  const ids = [...new Set(value.map((item) => cleanText(item, "Healthcare provider", { max: 80 })))];
  if (!ids.length) throw new HttpError(400, "Choose at least one healthcare provider.", "SELECTION_REQUIRED");
  if (ids.length > 50) throw new HttpError(400, "You can delete up to 50 healthcare providers at once.", "SELECTION_TOO_LARGE");
  return ids;
}

async function requireHealthcareBusiness(storeId: string) {
  const store = await getD1().prepare(`SELECT s.id, s.owner_id AS ownerId FROM stores s JOIN categories c ON c.id = s.category_id
    WHERE s.id = ? AND c.module = 'healthcare' LIMIT 1`).bind(storeId).first<{ id: string; ownerId: string | null }>();
  if (!store) throw new HttpError(404, "Healthcare business not found.", "NOT_FOUND");
  return store;
}

async function ensureQueueSettings(storeId: string, actorId: string) {
  const now = Math.floor(Date.now() / 1000);
  await getD1().prepare(`INSERT INTO healthcare_queue_settings
    (store_id, status, consultation_minutes, opening_time, closing_time, maximum_daily_patients,
      current_token_number, next_token_number, service_date, updated_by, updated_at)
    VALUES (?, 'closed', 15, '09:00', '18:00', 100, 0, 1, ?, ?, ?)
    ON CONFLICT(store_id) DO UPDATE SET updated_by = excluded.updated_by, updated_at = excluded.updated_at`)
    .bind(storeId, indiaServiceDate(), actorId, now).run();
}

export async function GET(request: Request) {
  try {
    await requireApiPermission(request, "healthcare.manage_all");
    await expireHealthcareQueueEntries();
    const db = getD1();
    const url = new URL(request.url);
    const storeId = cleanText(url.searchParams.get("storeId"), "Provider", { max: 80, required: false });
    if (storeId) await requireHealthcareBusiness(storeId);
    const today = indiaServiceDate();
    const [providers, stats, reports, queue] = await Promise.all([
      db.prepare(`SELECT s.id, s.name, s.status AS storeStatus, s.owner_id AS ownerId,
        u.name AS ownerName, c.name AS category, hp.provider_type AS providerType,
        hp.verification_status AS verificationStatus, hp.admin_queue_enabled AS adminQueueEnabled,
        hp.owner_queue_enabled AS ownerQueueEnabled, hp.accepting_patients AS acceptingPatients,
        hp.queue_activation_status AS queueActivationStatus,
        hp.queue_requested_at AS queueRequestedAt, hp.queue_reviewed_at AS queueReviewedAt,
        hp.queue_decision_reason AS queueDecisionReason, qs.status AS queueStatus,
        qs.current_token_number AS currentTokenNumber, qs.opening_time AS openingTime,
        qs.closing_time AS closingTime, qs.maximum_daily_patients AS maximumDailyPatients,
        (SELECT COUNT(*) FROM healthcare_queue_entries e WHERE e.store_id = s.id AND e.service_date = ? AND e.status = 'waiting') AS waitingCount,
        (SELECT COUNT(*) FROM healthcare_queue_entries e WHERE e.store_id = s.id AND e.service_date = ? AND e.status = 'completed') AS completedToday
        FROM stores s JOIN categories c ON c.id = s.category_id LEFT JOIN users u ON u.id = s.owner_id
        LEFT JOIN healthcare_provider_profiles hp ON hp.store_id = s.id
        LEFT JOIN healthcare_queue_settings qs ON qs.store_id = s.id
        WHERE c.module = 'healthcare'
        ORDER BY CASE hp.queue_activation_status WHEN 'pending' THEN 0 WHEN 'approved' THEN 1 WHEN 'suspended' THEN 2 ELSE 3 END,
          s.name ASC LIMIT 250`).bind(today, today).all(),
      db.prepare(`SELECT COUNT(DISTINCT store_id) AS providersUsed, COUNT(*) AS totalEntries,
        SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) AS completed,
        ROUND(AVG(CASE WHEN called_at IS NOT NULL THEN called_at - joined_at END) / 60.0, 1) AS averageWaitMinutes,
        (SELECT COUNT(*) FROM healthcare_queue_settings WHERE status = 'open') AS activeQueues
        FROM healthcare_queue_entries WHERE service_date >= date('now','-30 day')`).first(),
      db.prepare(`SELECT qr.id, qr.store_id AS storeId, s.name AS storeName, qr.reason, qr.details,
        qr.status, u.name AS reporterName, qr.created_at AS createdAt
        FROM healthcare_queue_reports qr JOIN stores s ON s.id = qr.store_id
        LEFT JOIN users u ON u.id = qr.reporter_id
        ORDER BY CASE qr.status WHEN 'open' THEN 0 WHEN 'reviewing' THEN 1 ELSE 2 END, qr.created_at DESC LIMIT 100`).all(),
      storeId ? healthcareQueueDashboard(storeId) : Promise.resolve(null),
    ]);
    return noStoreJson({ items: providers.results ?? [], stats: stats ?? {}, reports: reports.results ?? [], types: HEALTHCARE_TYPES, queue });
  } catch (error) { return apiError(error); }
}

export async function PATCH(request: Request) {
  try {
    const session = await requireApiPermission(request, "healthcare.manage_all", { csrf: true });
    const body = await safeJson(request);
    const action = cleanText(body.action, "Action", { max: 40 });
    const db = getD1();
    const now = Math.floor(Date.now() / 1000);

    if (action === "configure_provider") {
      const storeId = cleanText(body.storeId, "Provider", { max: 80 });
      await requireHealthcareBusiness(storeId);
      const providerType = body.providerType ?? "clinic";
      if (!isHealthcareType(providerType)) throw new HttpError(400, "Choose a valid healthcare type.", "INVALID_PROVIDER_TYPE");
      const verification = body.verificationStatus;
      if (!["pending", "verified", "rejected"].includes(String(verification))) throw new HttpError(400, "Choose a valid verification status.", "INVALID_STATUS");
      const disableQueue = verification !== "verified" || !isQueueEligibleHealthcareType(providerType);
      await db.prepare(`INSERT INTO healthcare_provider_profiles
        (store_id, provider_type, accepting_patients, emergency_available, admin_queue_enabled, owner_queue_enabled,
          queue_activation_status, verification_status, created_at, updated_at)
        VALUES (?, ?, 1, 0, 0, 0, 'not_requested', ?, ?, ?)
        ON CONFLICT(store_id) DO UPDATE SET provider_type = excluded.provider_type,
          verification_status = excluded.verification_status,
          admin_queue_enabled = CASE WHEN ? = 1 THEN 0 ELSE healthcare_provider_profiles.admin_queue_enabled END,
          owner_queue_enabled = CASE WHEN ? = 1 THEN 0 ELSE healthcare_provider_profiles.owner_queue_enabled END,
          queue_activation_status = CASE WHEN ? = 1 THEN 'not_requested' ELSE healthcare_provider_profiles.queue_activation_status END,
          updated_at = excluded.updated_at`)
        .bind(storeId, providerType, verification, now, now, disableQueue ? 1 : 0, disableQueue ? 1 : 0, disableQueue ? 1 : 0).run();
      await ensureQueueSettings(storeId, session.user.id);
      await writeAudit(request, session.user.id, "healthcare.provider.configured", "store", storeId, { providerType, verification });
      return noStoreJson({ ok: true });
    }

    if (action === "queue_access" || action === "setup_queue") {
      const storeId = cleanText(body.storeId, "Provider", { max: 80 });
      const business = await requireHealthcareBusiness(storeId);
      const profile = await db.prepare(`SELECT provider_type AS providerType, verification_status AS verificationStatus,
        queue_activation_status AS activationStatus, owner_queue_enabled AS ownerQueueEnabled
        FROM healthcare_provider_profiles WHERE store_id = ?`).bind(storeId).first<{ providerType: string; verificationStatus: string; activationStatus: string; ownerQueueEnabled: number }>();
      if (!profile || profile.verificationStatus !== "verified" || !isQueueEligibleHealthcareType(profile.providerType)) throw new HttpError(409, "Verify an eligible healthcare provider before enabling Live Queue.", "QUEUE_PROVIDER_INELIGIBLE");
      const decision = action === "setup_queue" ? "enable" : cleanText(body.decision, "Queue decision", { max: 20 });
      if (!["approve", "reject", "enable", "disable", "suspend", "delete"].includes(decision)) throw new HttpError(400, "Choose a valid queue decision.", "INVALID_ACTION");
      const reason = decision === "reject" || decision === "suspend"
        ? cleanText(body.reason, "Decision reason", { min: 5, max: 500 })
        : cleanText(body.reason, "Decision reason", { max: 500, required: false }) || null;
      if (decision === "delete") {
        await db.batch([
          db.prepare("UPDATE healthcare_provider_profiles SET queue_activation_status = 'not_requested', admin_queue_enabled = 0, owner_queue_enabled = 0, queue_reviewed_at = ?, queue_reviewed_by = ?, queue_decision_reason = 'Queue deleted by administrator', updated_at = ? WHERE store_id = ?")
            .bind(now, session.user.id, now, storeId),
          db.prepare("DELETE FROM healthcare_queue_entries WHERE store_id = ?").bind(storeId),
          db.prepare("DELETE FROM healthcare_queue_settings WHERE store_id = ?").bind(storeId),
          db.prepare("INSERT INTO healthcare_queue_events (id, store_id, actor_id, event_type, metadata, created_at) VALUES (?, ?, ?, 'queue_deleted', ?, ?)")
            .bind(crypto.randomUUID(), storeId, session.user.id, JSON.stringify({ permanent: true }), now),
        ]);
        await writeAudit(request, session.user.id, "healthcare.queue_access.delete", "store", storeId);
        return noStoreJson({ ok: true, activationStatus: "not_requested", adminEnabled: false });
      }
      const activationStatus = decision === "reject" ? "rejected" : decision === "suspend" ? "suspended" : "approved";
      const adminEnabled = decision === "approve" || decision === "enable";
      const ownerEnabled = decision === "enable" ? true : decision === "approve" ? Boolean(profile.ownerQueueEnabled) : false;
      await ensureQueueSettings(storeId, session.user.id);
      const accessStatements: D1PreparedStatement[] = [
        db.prepare(`UPDATE healthcare_provider_profiles SET queue_activation_status = ?, admin_queue_enabled = ?,
          owner_queue_enabled = ?, queue_reviewed_at = ?, queue_reviewed_by = ?, queue_decision_reason = ?, updated_at = ? WHERE store_id = ?`)
          .bind(activationStatus, adminEnabled ? 1 : 0, ownerEnabled ? 1 : 0, now, session.user.id, reason, now, storeId),
        db.prepare("UPDATE healthcare_queue_settings SET status = CASE WHEN ? = 1 THEN status ELSE 'closed' END, closed_at = CASE WHEN ? = 1 THEN closed_at ELSE ? END, updated_by = ?, updated_at = ? WHERE store_id = ?")
          .bind(adminEnabled ? 1 : 0, adminEnabled ? 1 : 0, now, session.user.id, now, storeId),
      ];
      if (!adminEnabled) accessStatements.push(db.prepare("UPDATE healthcare_queue_entries SET status = 'cancelled', active_key = NULL, left_at = ?, updated_at = ? WHERE store_id = ? AND status IN ('waiting','called')")
        .bind(now, now, storeId));
      await db.batch(accessStatements);
      if (business.ownerId) {
        const title = decision === "approve" || decision === "enable" ? "Live Queue approved" : decision === "suspend" ? "Live Queue suspended" : decision === "reject" ? "Live Queue request rejected" : "Live Queue disabled";
        await db.prepare("INSERT INTO notifications (id, user_id, audience, type, title, message, link, created_at) VALUES (?, ?, 'user', 'queue', ?, ?, '/owner?tab=healthcare', ?)")
          .bind(crypto.randomUUID(), business.ownerId, title, reason ?? `Live Queue status changed to ${activationStatus}.`, now).run();
      }
      await writeAudit(request, session.user.id, `healthcare.queue_access.${decision}`, "store", storeId, { activationStatus, reason });
      return noStoreJson({ ok: true, activationStatus, adminEnabled });
    }

    if (action === "configure_queue") {
      const storeId = cleanText(body.storeId, "Provider", { max: 80 });
      await requireHealthcareBusiness(storeId);
      await ensureQueueSettings(storeId, session.user.id);
      const consultationMinutes = numberInput(body.consultationMinutes, "Consultation time", { min: 5, max: 180, integer: true }) as number;
      const openingTime = cleanText(body.openingTime ?? "09:00", "Queue opening time", { max: 5 });
      const closingTime = cleanText(body.closingTime ?? "18:00", "Queue closing time", { max: 5 });
      if (!/^([01]\d|2[0-3]):[0-5]\d$/.test(openingTime) || !/^([01]\d|2[0-3]):[0-5]\d$/.test(closingTime)) throw new HttpError(400, "Use a valid 24-hour queue schedule.", "INVALID_QUEUE_TIME");
      const maximumDailyPatients = numberInput(body.maximumDailyPatients, "Maximum daily patients", { min: 1, max: 1000, integer: true }) as number;
      await db.batch([
        db.prepare("UPDATE healthcare_provider_profiles SET accepting_patients = ?, updated_at = ? WHERE store_id = ?")
          .bind(booleanInput(body.acceptingPatients) ? 1 : 0, now, storeId),
        db.prepare("UPDATE healthcare_queue_settings SET consultation_minutes = ?, opening_time = ?, closing_time = ?, maximum_daily_patients = ?, updated_by = ?, updated_at = ? WHERE store_id = ?")
          .bind(consultationMinutes, openingTime, closingTime, maximumDailyPatients, session.user.id, now, storeId),
      ]);
      await writeAudit(request, session.user.id, "healthcare.queue.configured_by_admin", "store", storeId, { consultationMinutes, openingTime, closingTime, maximumDailyPatients });
      return noStoreJson({ ok: true });
    }

    if (action === "queue_action") {
      const storeId = cleanText(body.storeId, "Provider", { max: 80 });
      await requireHealthcareBusiness(storeId);
      const queueAction = body.queueAction;
      if (!isQueueOperation(queueAction)) throw new HttpError(400, "Unsupported queue action.", "INVALID_ACTION");
      const entryId = cleanText(body.entryId, "Queue entry", { max: 80, required: false }) || null;
      const addingPatient = queueAction === "add_emergency" || queueAction === "add_walk_in";
      const patientName = addingPatient ? cleanText(body.patientName, "Patient name", { min: 2, max: 120 }) : null;
      const patientPhone = addingPatient ? cleanText(body.patientPhone, "Patient contact", { max: 120, required: false }) || null : null;
      const result = await operateHealthcareQueue({ storeId, actorId: session.user.id, action: queueAction, entryId, patientName, patientPhone });
      await writeAudit(request, session.user.id, `healthcare.queue.${queueAction}`, "store", storeId, { entryId });
      return noStoreJson(result);
    }

    if (action === "update_report") {
      const reportId = cleanText(body.reportId, "Report", { max: 80 });
      const status = body.status;
      if (!["open", "reviewing", "resolved", "dismissed"].includes(String(status))) throw new HttpError(400, "Invalid report status.", "INVALID_STATUS");
      await db.prepare("UPDATE healthcare_queue_reports SET status = ?, assigned_to = ?, resolved_at = CASE WHEN ? IN ('resolved','dismissed') THEN ? ELSE NULL END, updated_at = ? WHERE id = ?")
        .bind(status, session.user.id, status, now, now, reportId).run();
      await writeAudit(request, session.user.id, "healthcare.queue_report.updated", "queue_report", reportId, { status });
      return noStoreJson({ ok: true });
    }
    throw new HttpError(400, "Unsupported healthcare action.", "INVALID_ACTION");
  } catch (error) { return apiError(error); }
}

export async function DELETE(request: Request) {
  try {
    const session = await requireApiPermission(request, "healthcare.manage_all", { csrf: true });
    const body = await safeJson(request);
    const storeIds = cleanIdList(body.storeIds);
    const placeholders = storeIds.map(() => "?").join(",");
    const providers = await getD1().prepare(`SELECT s.id, s.name,
      (SELECT COUNT(*) FROM orders o WHERE o.store_id = s.id) AS orderCount
      FROM stores s JOIN categories c ON c.id = s.category_id
      WHERE s.id IN (${placeholders}) AND c.module = 'healthcare'`).bind(...storeIds).all<{ id: string; name: string; orderCount: number }>();
    const found = providers.results ?? [];
    if (found.length !== storeIds.length) throw new HttpError(404, "One or more healthcare providers were not found.", "NOT_FOUND");
    if (found.some((provider) => Number(provider.orderCount) > 0)) throw new HttpError(409, "Healthcare providers with order history must be suspended instead of deleted.", "PROVIDER_HAS_ORDERS");
    await getD1().prepare(`DELETE FROM stores WHERE id IN (${placeholders})`).bind(...storeIds).run();
    await writeAudit(request, session.user.id, "healthcare.provider.bulk_deleted", "store", storeIds[0], { storeIds, names: found.map((provider) => provider.name), count: storeIds.length });
    return noStoreJson({ ok: true, count: storeIds.length });
  } catch (error) { return apiError(error); }
}
