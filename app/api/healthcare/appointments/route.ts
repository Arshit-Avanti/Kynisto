import { getD1 } from "@/db/runtime";
import { requireApiPermission } from "@/lib/auth";
import { indiaServiceDate, requireHealthcareStore, QUEUE_ENTRY_TTL_SECONDS, resetQueueForNewDay } from "@/lib/healthcare";
import { apiError, enforceRateLimit, HttpError, noStoreJson } from "@/lib/security";
import { isAppointmentsEnabled } from "@/lib/settings";
import { requireFeaturePermission } from "@/lib/subscriptions";
import { cleanText, safeJson } from "@/lib/validation";

export const dynamic = "force-dynamic";

// List appointments for the current user
export async function GET(request: Request) {
  try {
    const enabled = await isAppointmentsEnabled();
    if (!enabled) return noStoreJson({ appointments: [] });
    const session = await requireApiPermission(request, "queue.join");
    await requireFeaturePermission(session.user.id, "queue");
    const url = new URL(request.url);
    const storeId = url.searchParams.get("storeId")?.trim();
    const scope = url.searchParams.get("scope") || "upcoming"; // upcoming | past | all
    const db = getD1();
    const today = indiaServiceDate();

    let query: string;
    const params: unknown[] = [session.user.id];
    if (storeId) {
      query = `SELECT a.id, a.store_id AS storeId, s.name AS storeName, a.appointment_date AS appointmentDate,
        a.time_slot AS timeSlot, a.duration_minutes AS durationMinutes, a.status,
        a.doctor_id AS doctorId, d.name AS doctorName, d.specialization AS doctorSpecialization,
        a.patient_name AS patientName, a.notes, a.queue_entry_id AS queueEntryId,
        a.created_at AS createdAt
        FROM healthcare_appointments a
        JOIN stores s ON s.id = a.store_id
        LEFT JOIN healthcare_doctors d ON d.id = a.doctor_id
        WHERE a.user_id = ? AND a.store_id = ?`;
      params.push(storeId);
    } else {
      query = `SELECT a.id, a.store_id AS storeId, s.name AS storeName, a.appointment_date AS appointmentDate,
        a.time_slot AS timeSlot, a.duration_minutes AS durationMinutes, a.status,
        a.doctor_id AS doctorId, d.name AS doctorName, d.specialization AS doctorSpecialization,
        a.patient_name AS patientName, a.notes, a.queue_entry_id AS queueEntryId,
        a.created_at AS createdAt
        FROM healthcare_appointments a
        JOIN stores s ON s.id = a.store_id
        LEFT JOIN healthcare_doctors d ON d.id = a.doctor_id
        WHERE a.user_id = ?`;
    }
    if (scope === "upcoming") {
      query += ` AND a.appointment_date >= ? AND a.status IN ('booked','confirmed','checked_in')`;
      params.push(today);
    } else if (scope === "past") {
      query += ` AND (a.appointment_date < ? OR a.status IN ('completed','cancelled','no_show','rescheduled'))`;
      params.push(today);
    }
    query += " ORDER BY a.appointment_date ASC, a.time_slot ASC LIMIT 50";
    const appointments = await db.prepare(query).bind(...params).all();
    return noStoreJson({ appointments: appointments.results ?? [] });
  } catch (error) { return apiError(error); }
}

// Book, cancel, reschedule, or check-in
export async function POST(request: Request) {
  try {
    const enabled = await isAppointmentsEnabled();
    if (!enabled) throw new HttpError(403, "Healthcare appointments are temporarily disabled by the platform administrator.", "APPOINTMENTS_DISABLED");
    const session = await requireApiPermission(request, "queue.join", { csrf: true });
    await requireFeaturePermission(session.user.id, "queue");
    await enforceRateLimit(request, `appt:${session.user.id}`, 20, 300);
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

    if (action === "book") {
      const appointmentDate = cleanText(body.appointmentDate, "Appointment date", { max: 10 });
      if (!/^\d{4}-\d{2}-\d{2}$/.test(appointmentDate)) throw new HttpError(400, "Invalid date format.", "INVALID_DATE");
      if (appointmentDate < today) throw new HttpError(400, "Cannot book appointments in the past.", "DATE_IN_PAST");
      const timeSlot = cleanText(body.timeSlot, "Time slot", { max: 5 });
      if (!/^([01]\d|2[0-3]):[0-5]\d$/.test(timeSlot)) throw new HttpError(400, "Invalid time format.", "INVALID_TIME");
      const doctorId = cleanText(body.doctorId, "Doctor", { max: 80, required: false }) || null;
      const patientName = cleanText(body.patientName, "Patient name", { max: 120, required: false }) || null;
      const notes = cleanText(body.notes, "Notes", { max: 500, required: false }) || null;

      // Validate doctor exists if specified
      let durationMinutes = 15;
      if (doctorId) {
        const doctor = await db.prepare("SELECT consultation_minutes AS cm FROM healthcare_doctors WHERE id = ? AND store_id = ? AND status = 'active' LIMIT 1")
          .bind(doctorId, storeId).first<{ cm: number }>();
        if (!doctor) throw new HttpError(404, "Doctor not found.", "DOCTOR_NOT_FOUND");
        durationMinutes = doctor.cm || 15;
      }

      // Check for duplicate active appointment
      const existing = await db.prepare(`SELECT id FROM healthcare_appointments
        WHERE store_id = ? AND user_id = ? AND appointment_date = ? AND time_slot = ? AND status IN ('booked','confirmed','checked_in') LIMIT 1`)
        .bind(storeId, session.user.id, appointmentDate, timeSlot).first();
      if (existing) throw new HttpError(409, "You already have an appointment at this time.", "DUPLICATE_APPOINTMENT");

      // Check slot availability (no other appointment in overlapping time)
      const slotConflict = await db.prepare(`SELECT id FROM healthcare_appointments
        WHERE store_id = ? AND appointment_date = ? AND status IN ('booked','confirmed','checked_in')
        AND time_slot = ? ${doctorId ? "AND doctor_id = ?" : ""} LIMIT 1`)
        .bind(storeId, appointmentDate, timeSlot, ...(doctorId ? [doctorId] : [])).first();
      if (slotConflict) throw new HttpError(409, "This time slot is no longer available.", "SLOT_TAKEN");

      const id = crypto.randomUUID();
      await db.batch([
        db.prepare(`INSERT INTO healthcare_appointments (id, store_id, user_id, doctor_id, appointment_date, time_slot,
          duration_minutes, status, patient_name, notes, created_at, updated_at)
          VALUES (?, ?, ?, ?, ?, ?, ?, 'booked', ?, ?, ?, ?)`)
          .bind(id, storeId, session.user.id, doctorId, appointmentDate, timeSlot, durationMinutes, patientName, notes, now, now),
        db.prepare("INSERT INTO healthcare_queue_events (id, store_id, actor_id, event_type, metadata, created_at) VALUES (?, ?, ?, 'appointment_booked', ?, ?)")
          .bind(crypto.randomUUID(), storeId, session.user.id, JSON.stringify({ appointmentId: id, date: appointmentDate, timeSlot, doctorId }), now),
        // Notify the clinic owner
        ...(provider.ownerId ? [db.prepare("INSERT INTO notifications (id, user_id, audience, type, title, message, link, created_at) VALUES (?, ?, 'user', 'queue', 'New appointment booked', ?, '/owner?tab=healthcare', ?)")
          .bind(crypto.randomUUID(), provider.ownerId, `New appointment on ${appointmentDate} at ${timeSlot}${patientName ? ` for ${patientName}` : ''}.`, now)] : []),
      ]);
      return noStoreJson({ ok: true, appointment: { id, appointmentDate, timeSlot, durationMinutes, status: "booked" } }, { status: 201 });
    }

    if (action === "cancel") {
      const appointmentId = cleanText(body.appointmentId, "Appointment", { max: 80 });
      const reason = cleanText(body.reason, "Cancellation reason", { max: 500, required: false }) || null;
      const result = await db.prepare(`UPDATE healthcare_appointments SET status = 'cancelled', cancellation_reason = ?,
        cancelled_at = ?, updated_at = ? WHERE id = ? AND user_id = ? AND status IN ('booked','confirmed') RETURNING id, appointment_date AS appointmentDate, time_slot AS timeSlot`)
        .bind(reason, now, now, appointmentId, session.user.id).first<{ id: string; appointmentDate: string; timeSlot: string }>();
      if (!result) throw new HttpError(404, "Appointment not found or already processed.", "APPOINTMENT_NOT_FOUND");
      await db.prepare("INSERT INTO healthcare_queue_events (id, store_id, actor_id, event_type, metadata, created_at) VALUES (?, ?, ?, 'appointment_cancelled', ?, ?)")
        .bind(crypto.randomUUID(), storeId, session.user.id, JSON.stringify({ appointmentId, date: result.appointmentDate, timeSlot: result.timeSlot, reason }), now).run();
      if (provider.ownerId) {
        await db.prepare("INSERT INTO notifications (id, user_id, audience, type, title, message, link, created_at) VALUES (?, ?, 'user', 'queue', 'Appointment cancelled', ?, '/owner?tab=healthcare', ?)")
          .bind(crypto.randomUUID(), provider.ownerId, `Appointment on ${result.appointmentDate} at ${result.timeSlot} was cancelled by patient.`, now).run();
      }
      return noStoreJson({ ok: true });
    }

    if (action === "check_in") {
      const appointmentId = cleanText(body.appointmentId, "Appointment", { max: 80 });
      const appointment = await db.prepare(`SELECT a.id, a.appointment_date AS appointmentDate, a.time_slot AS timeSlot,
        a.duration_minutes AS durationMinutes, a.doctor_id AS doctorId, a.patient_name AS patientName
        FROM healthcare_appointments a
        WHERE a.id = ? AND a.user_id = ? AND a.store_id = ? AND a.status IN ('booked','confirmed') LIMIT 1`)
        .bind(appointmentId, session.user.id, storeId).first<{ id: string; appointmentDate: string; timeSlot: string; durationMinutes: number; doctorId: string | null; patientName: string | null }>();
      if (!appointment) throw new HttpError(404, "Appointment not found or already checked in.", "APPOINTMENT_NOT_FOUND");

      // Check no existing active queue entry
      const existingEntry = await db.prepare("SELECT id FROM healthcare_queue_entries WHERE active_key = ? AND status IN ('waiting','called','in_consultation') LIMIT 1")
        .bind(`customer:${session.user.id}`).first();
      if (existingEntry) throw new HttpError(409, "You are already in an active queue.", "ACTIVE_QUEUE_EXISTS");

      // Ensure queue settings exist
      await resetQueueForNewDay(storeId);

      const entryId = crypto.randomUUID();
      const activeKey = `customer:${session.user.id}`;
      const expiresAt = now + QUEUE_ENTRY_TTL_SECONDS;

      const results = await db.batch([
        db.prepare(`INSERT INTO healthcare_queue_entries
          (id, store_id, user_id, service_date, token_number, active_key, status, arrival_status, appointment_id, doctor_id, patient_name, joined_at, expires_at, updated_at)
          SELECT ?, ?, ?, ?, COALESCE(q.next_token_number, 1), ?, 'waiting', 'waiting', ?, ?, ?, ?, ?, ?
          FROM healthcare_queue_settings q
          WHERE q.store_id = ?
          AND NOT EXISTS (SELECT 1 FROM healthcare_queue_entries active WHERE active.active_key = ? AND active.status IN ('waiting','called','in_consultation'))
          ON CONFLICT(active_key) DO NOTHING RETURNING id, token_number AS tokenNumber`)
          .bind(entryId, storeId, session.user.id, today, activeKey, appointmentId, appointment.doctorId, appointment.patientName, now, expiresAt, now, storeId, activeKey),
        db.prepare(`UPDATE healthcare_queue_settings SET next_token_number = next_token_number + 1, updated_at = ?
          WHERE store_id = ? AND EXISTS (SELECT 1 FROM healthcare_queue_entries WHERE id = ?)`)
          .bind(now, storeId, entryId),
        db.prepare(`UPDATE healthcare_appointments SET status = 'checked_in', checked_in_at = ?, queue_entry_id = ?, updated_at = ?
          WHERE id = ? AND status IN ('booked','confirmed')`)
          .bind(now, entryId, now, appointmentId),
        db.prepare("INSERT INTO healthcare_queue_events (id, store_id, entry_id, actor_id, event_type, metadata, created_at) VALUES (?, ?, ?, ?, 'appointment_checked_in', ?, ?)")
          .bind(crypto.randomUUID(), storeId, entryId, session.user.id, JSON.stringify({ appointmentId, date: appointment.appointmentDate, timeSlot: appointment.timeSlot }), now),
      ]);

      if (!results[0]?.results?.length) {
        throw new HttpError(409, "Could not check in. You may already be in a queue.", "CHECK_IN_FAILED");
      }
      const { tokenNumber } = results[0].results[0] as { id: string; tokenNumber: number };
      return noStoreJson({ ok: true, tokenNumber, entryId }, { status: 201 });
    }

    throw new HttpError(400, "Unsupported appointment action.", "INVALID_ACTION");
  } catch (error) { return apiError(error); }
}
