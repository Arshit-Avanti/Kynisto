import { getD1 } from "@/db/runtime";
import { requireApiPermission } from "@/lib/auth";
import { isQueueEligibleHealthcareType, requireHealthcareStore } from "@/lib/healthcare";
import { healthcareQueueDashboard, isQueueOperation, operateHealthcareQueue } from "@/lib/healthcare-queue-management";
import { requireOwnedStore, writeAudit } from "@/lib/ownership";
import { apiError, HttpError, noStoreJson } from "@/lib/security";
import { booleanInput, cleanText, numberInput, safeJson } from "@/lib/validation";

async function ownerContext(ownerId: string, storeId: string) {
  await requireOwnedStore(ownerId, storeId);
  const provider = await requireHealthcareStore(storeId);
  if (!provider.providerType) throw new HttpError(409, "Ask an admin to add Live Queue to this healthcare business first.", "HEALTHCARE_SETUP_REQUIRED");
  return provider;
}

export async function GET(request: Request) {
  try {
    const session = await requireApiPermission(request, "queue.manage_own");
    const storeId = cleanText(new URL(request.url).searchParams.get("storeId"), "Provider", { max: 80 });
    await ownerContext(session.user.id, storeId);
    return noStoreJson(await healthcareQueueDashboard(storeId));
  } catch (error) { return apiError(error); }
}

export async function PATCH(request: Request) {
  try {
    const session = await requireApiPermission(request, "queue.manage_own", { csrf: true });
    const body = await safeJson(request);
    const storeId = cleanText(body.storeId, "Provider", { max: 80 });
    const provider = await ownerContext(session.user.id, storeId);
    const action = cleanText(body.action, "Action", { max: 30 });

    if (action === "request_activation") {
      if (provider.verificationStatus !== "verified") throw new HttpError(409, "Only verified healthcare owners can request Live Queue.", "PROVIDER_NOT_VERIFIED");
      if (!isQueueEligibleHealthcareType(provider.providerType)) throw new HttpError(409, "Live Queue is not available for this healthcare type.", "QUEUE_TYPE_UNAVAILABLE");
      if (provider.queueActivationStatus === "approved") throw new HttpError(409, "Live Queue is already approved for this business.", "QUEUE_ALREADY_APPROVED");
      const now = Math.floor(Date.now() / 1000);
      await getD1().prepare(`UPDATE healthcare_provider_profiles SET queue_activation_status = 'pending',
        queue_requested_at = ?, queue_reviewed_at = NULL, queue_reviewed_by = NULL,
        queue_decision_reason = NULL, admin_queue_enabled = 0, owner_queue_enabled = 0, updated_at = ? WHERE store_id = ?`)
        .bind(now, now, storeId).run();
      await writeAudit(request, session.user.id, "healthcare.queue_activation.requested", "store", storeId);
      return noStoreJson({ ok: true, status: "pending" });
    }

    if (action === "configure") {
      const enabled = booleanInput(body.ownerQueueEnabled);
      if (enabled && (provider.queueActivationStatus !== "approved" || !provider.adminQueueEnabled)) throw new HttpError(409, "An admin must approve and enable Live Queue first.", "ADMIN_APPROVAL_REQUIRED");
      const minutes = numberInput(body.consultationMinutes, "Consultation time", { min: 5, max: 180, integer: true }) as number;
      const openingTime = cleanText(body.openingTime ?? "09:00", "Queue opening time", { max: 5 });
      const closingTime = cleanText(body.closingTime ?? "18:00", "Queue closing time", { max: 5 });
      if (!/^([01]\d|2[0-3]):[0-5]\d$/.test(openingTime) || !/^([01]\d|2[0-3]):[0-5]\d$/.test(closingTime)) throw new HttpError(400, "Use a valid 24-hour queue schedule.", "INVALID_QUEUE_TIME");
      const maximumDailyPatients = numberInput(body.maximumDailyPatients ?? 100, "Maximum daily patients", { min: 1, max: 1000, integer: true }) as number;
      const now = Math.floor(Date.now() / 1000);
      const db = getD1();
      const statements: D1PreparedStatement[] = [
        db.prepare("UPDATE healthcare_provider_profiles SET owner_queue_enabled = ?, accepting_patients = ?, updated_at = ? WHERE store_id = ?")
          .bind(enabled ? 1 : 0, booleanInput(body.acceptingPatients) ? 1 : 0, now, storeId),
        db.prepare("UPDATE healthcare_queue_settings SET consultation_minutes = ?, opening_time = ?, closing_time = ?, maximum_daily_patients = ?, status = CASE WHEN ? = 0 THEN 'closed' ELSE status END, updated_by = ?, updated_at = ? WHERE store_id = ?")
          .bind(minutes, openingTime, closingTime, maximumDailyPatients, enabled ? 1 : 0, session.user.id, now, storeId),
      ];
      if (!enabled) statements.push(db.prepare("UPDATE healthcare_queue_entries SET status = 'cancelled', active_key = NULL, left_at = ?, updated_at = ? WHERE store_id = ? AND status IN ('waiting','called')")
        .bind(now, now, storeId));
      await db.batch(statements);
      await writeAudit(request, session.user.id, "healthcare.queue.configured", "store", storeId, { enabled, minutes, openingTime, closingTime, maximumDailyPatients });
      return noStoreJson({ ok: true });
    }

    if (!isQueueOperation(action)) throw new HttpError(400, "Unsupported queue action.", "INVALID_ACTION");
    if (action === "reset") throw new HttpError(403, "Access Denied", "ACCESS_DENIED");
    const entryId = cleanText(body.entryId, "Queue entry", { max: 80, required: false }) || null;
    const addingPatient = action === "add_emergency" || action === "add_walk_in";
    const patientName = addingPatient ? cleanText(body.patientName, "Patient name", { min: 2, max: 120 }) : null;
    const patientPhone = addingPatient ? cleanText(body.patientPhone, "Patient contact", { max: 120, required: false }) || null : null;
    const result = await operateHealthcareQueue({ storeId, actorId: session.user.id, action, entryId, patientName, patientPhone });
    await writeAudit(request, session.user.id, `healthcare.queue.${action}`, "store", storeId, { entryId });
    return noStoreJson(result);
  } catch (error) { return apiError(error); }
}
