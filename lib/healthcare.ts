import { getD1 } from "@/db/runtime";
import { ensureSeeded } from "@/db/seed";
import { HttpError } from "@/lib/security";

export const HEALTHCARE_TYPES = [
  "hospital",
  "clinic",
  "dental_clinic",
  "diagnostic_lab",
  "pharmacy",
  "eye_clinic",
  "veterinary_clinic",
] as const;
export type HealthcareType = (typeof HEALTHCARE_TYPES)[number];
export const QUEUE_ENTRY_TTL_SECONDS = 3 * 60 * 60;

export const QUEUE_ENTRY_STATUSES = ["waiting", "called", "in_consultation", "skipped", "completed", "left", "cancelled", "removed", "expired", "no_show"] as const;
export const QUEUE_ACTIVE_STATUSES = ["waiting", "called", "in_consultation"] as const;
export const APPOINTMENT_STATUSES = ["booked", "confirmed", "checked_in", "completed", "rescheduled", "cancelled", "no_show"] as const;

export const QUEUE_ELIGIBLE_HEALTHCARE_TYPES = [
  "hospital",
  "clinic",
  "dental_clinic",
  "diagnostic_lab",
  "eye_clinic",
  "veterinary_clinic",
] as const satisfies readonly HealthcareType[];

export function isQueueEligibleHealthcareType(value: unknown): value is (typeof QUEUE_ELIGIBLE_HEALTHCARE_TYPES)[number] {
  return typeof value === "string" && QUEUE_ELIGIBLE_HEALTHCARE_TYPES.includes(value as (typeof QUEUE_ELIGIBLE_HEALTHCARE_TYPES)[number]);
}

export const HEALTHCARE_LABELS: Record<HealthcareType, string> = {
  hospital: "Hospitals",
  clinic: "Clinics",
  dental_clinic: "Dental clinics",
  diagnostic_lab: "Diagnostic labs",
  pharmacy: "Pharmacies",
  eye_clinic: "Eye clinics",
  veterinary_clinic: "Veterinary clinics",
};

export function isHealthcareType(value: unknown): value is HealthcareType {
  return typeof value === "string" && HEALTHCARE_TYPES.includes(value as HealthcareType);
}

export function indiaServiceDate(date = new Date()): string {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Kolkata",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(date);
  const value = (type: "year" | "month" | "day") => parts.find((part) => part.type === type)?.value ?? "";
  return `${value("year")}-${value("month")}-${value("day")}`;
}

let _healthcareTablesEnsured = false;

export async function ensureHealthcareTables() {
  if (_healthcareTablesEnsured) return;
  try {
    const db = getD1();
    await db.prepare(`
      CREATE TABLE IF NOT EXISTS healthcare_doctors (
        id text PRIMARY KEY NOT NULL,
        store_id text NOT NULL,
        name text NOT NULL,
        specialization text,
        consultation_minutes integer DEFAULT 15 NOT NULL,
        status text DEFAULT 'active' NOT NULL,
        sort_order integer DEFAULT 0 NOT NULL,
        created_at integer DEFAULT (unixepoch()) NOT NULL,
        updated_at integer DEFAULT (unixepoch()) NOT NULL
      )
    `).run();

    await db.prepare(`
      CREATE TABLE IF NOT EXISTS healthcare_appointments (
        id text PRIMARY KEY NOT NULL,
        store_id text NOT NULL,
        user_id text NOT NULL,
        doctor_id text,
        appointment_date text NOT NULL,
        time_slot text NOT NULL,
        duration_minutes integer DEFAULT 15 NOT NULL,
        status text DEFAULT 'booked' NOT NULL,
        queue_entry_id text,
        patient_name text,
        patient_phone text,
        notes text,
        cancellation_reason text,
        rescheduled_from text,
        confirmed_at integer,
        checked_in_at integer,
        completed_at integer,
        cancelled_at integer,
        created_at integer DEFAULT (unixepoch()) NOT NULL,
        updated_at integer DEFAULT (unixepoch()) NOT NULL
      )
    `).run();

    const columnAlters = [
      "ALTER TABLE healthcare_doctors ADD COLUMN consultation_fee REAL DEFAULT 500",
      "ALTER TABLE healthcare_provider_profiles ADD COLUMN allow_appointments INTEGER DEFAULT 1",
      "ALTER TABLE healthcare_queue_entries ADD COLUMN late_minutes integer",
      "ALTER TABLE healthcare_queue_entries ADD COLUMN late_reported_at integer",
      "ALTER TABLE healthcare_queue_entries ADD COLUMN appointment_id text",
      "ALTER TABLE healthcare_queue_entries ADD COLUMN doctor_id text",
      "ALTER TABLE healthcare_queue_settings ADD COLUMN grace_period_minutes integer DEFAULT 30",
    ];

    for (const sql of columnAlters) {
      try {
        await db.prepare(sql).run();
      } catch {
        // column already exists
      }
    }
    _healthcareTablesEnsured = true;
  } catch (err) {
    console.warn("Healthcare tables check notice:", err);
  }
}

let lastGlobalSweepAt = 0;

export async function requireHealthcareStore(storeId: string) {
  await ensureSeeded();
  await ensureHealthcareTables();
  const db = getD1();

  let provider = await db
    .prepare(
      `SELECT s.id, s.name, s.owner_id AS ownerId, s.status AS storeStatus,
        COALESCE(
          hp.provider_type,
          CASE 
            WHEN c.name LIKE '%Hospital%' OR s.name LIKE '%Hospital%' THEN 'hospital'
            WHEN c.name LIKE '%Dental%' OR s.name LIKE '%Dental%' THEN 'dental_clinic'
            WHEN c.name LIKE '%Pharm%' OR s.name LIKE '%Pharm%' OR s.name LIKE '%Medical%' THEN 'pharmacy'
            WHEN c.name LIKE '%Diagnostic%' OR c.name LIKE '%Lab%' OR s.name LIKE '%Diagnostic%' OR s.name LIKE '%Scan%' THEN 'diagnostic_lab'
            WHEN c.name LIKE '%Optic%' OR c.name LIKE '%Eye%' THEN 'eye_clinic'
            WHEN c.name LIKE '%Pet%' OR c.name LIKE '%Vet%' THEN 'veterinary_clinic'
            ELSE 'clinic'
          END
        ) AS providerType,
        COALESCE(hp.accepting_patients, 1) AS acceptingPatients,
        COALESCE(hp.allow_appointments, 1) AS allowAppointments,
        COALESCE(hp.admin_queue_enabled, 1) AS adminQueueEnabled,
        COALESCE(hp.owner_queue_enabled, 1) AS ownerQueueEnabled,
        COALESCE(hp.verification_status, 'verified') AS verificationStatus,
        COALESCE(hp.queue_activation_status, 'approved') AS queueActivationStatus
       FROM stores s JOIN categories c ON c.id = s.category_id
       LEFT JOIN healthcare_provider_profiles hp ON hp.store_id = s.id
       WHERE s.id = ? AND (
         c.module = 'healthcare' 
         OR c.slug IN ('clinics-doctors', 'pharmacies', 'dental-care', 'opticians', 'pet-care') 
         OR c.name LIKE '%Clinic%' OR c.name LIKE '%Doctor%' OR c.name LIKE '%Hospital%' 
         OR c.name LIKE '%Pharm%' OR c.name LIKE '%Dental%' OR c.name LIKE '%Health%' 
         OR c.name LIKE '%Optic%' OR hp.store_id IS NOT NULL
       ) LIMIT 1`,
    )
    .bind(storeId)
    .first<{
      id: string;
      name: string;
      ownerId: string | null;
      storeStatus: string;
      providerType: HealthcareType | null;
      acceptingPatients: number | null;
      allowAppointments: number | null;
      adminQueueEnabled: number | null;
      ownerQueueEnabled: number | null;
      verificationStatus: string | null;
      queueActivationStatus: string | null;
    }>();
  if (!provider) throw new HttpError(404, "Healthcare provider not found.", "HEALTHCARE_NOT_FOUND");

  const now = Math.floor(Date.now() / 1000);
  if (!provider.providerType || provider.verificationStatus !== "verified" || provider.queueActivationStatus !== "approved") {
    const determinedType = provider.providerType || "clinic";
    await db.prepare(`
      INSERT INTO healthcare_provider_profiles (store_id, provider_type, accepting_patients, admin_queue_enabled, owner_queue_enabled, verification_status, queue_activation_status, created_at, updated_at)
      VALUES (?, ?, 1, 1, 1, 'verified', 'approved', ?, ?)
      ON CONFLICT(store_id) DO UPDATE SET
        provider_type = COALESCE(provider_type, excluded.provider_type),
        accepting_patients = 1,
        admin_queue_enabled = 1,
        owner_queue_enabled = 1,
        verification_status = 'verified',
        queue_activation_status = 'approved',
        updated_at = ?
    `).bind(storeId, determinedType, now, now, now).run().catch(() => {});

    provider.providerType = determinedType as HealthcareType;
    provider.verificationStatus = "verified";
    provider.queueActivationStatus = "approved";
    provider.adminQueueEnabled = 1;
    provider.ownerQueueEnabled = 1;
  }

  return provider;
}

const _storeSweepCache = new Map<string, number>();
const _storeResetCache = new Map<string, { date: string; checkedAt: number }>();
const _storeSummaryCache = new Map<string, { data: Record<string, string | number | null>; cachedAt: number }>();

export function invalidateHealthcareCache(storeId?: string) {
  if (storeId) {
    _storeSummaryCache.delete(storeId);
    _storeSweepCache.delete(storeId);
    _storeResetCache.delete(storeId);
  } else {
    _storeSummaryCache.clear();
    _storeSweepCache.clear();
    _storeResetCache.clear();
  }
}

/**
 * Serverless-safe expiry sweep with 30-second per-store throttle.
 * Prevents 50k concurrent requests from executing simultaneous D1 write batches.
 */
export async function expireHealthcareQueueEntries(storeId?: string, force = false) {
  const now = Math.floor(Date.now() / 1000);
  const cacheKey = storeId ?? "__global__";
  const lastSweep = _storeSweepCache.get(cacheKey) ?? 0;
  if (!force && now - lastSweep < (storeId ? 30 : 15)) {
    return 0;
  }
  _storeSweepCache.set(cacheKey, now);
  if (!storeId) lastGlobalSweepAt = now;

  const db = getD1();
  const scope = storeId ? " AND store_id = ?" : "";
  const values = storeId ? [now, storeId] : [now];
  try {
    const result = await db.batch([
      db.prepare("UPDATE healthcare_queue_entries SET active_key = NULL WHERE status NOT IN ('waiting','called','in_consultation') AND active_key IS NOT NULL"),
      db.prepare(`INSERT INTO healthcare_queue_events (id, store_id, entry_id, actor_id, event_type, metadata, created_at)
        SELECT lower(hex(randomblob(16))), store_id, id, NULL, 'expired',
          json_object('tokenNumber', token_number, 'reason', 'three_hour_timeout'), ?
        FROM healthcare_queue_entries
        WHERE status IN ('waiting','called','in_consultation') AND expires_at IS NOT NULL AND expires_at <= ?${scope}`)
        .bind(now, ...values),
      db.prepare(`UPDATE healthcare_queue_entries SET status = 'expired', active_key = NULL,
        left_at = ?, updated_at = ?
        WHERE status IN ('waiting','called','in_consultation') AND expires_at IS NOT NULL AND expires_at <= ?${scope}`)
        .bind(now, now, ...values),
      db.prepare(`UPDATE healthcare_queue_settings SET current_token_number = 0, updated_at = ?
        WHERE current_token_number <> 0
        AND NOT EXISTS (SELECT 1 FROM healthcare_queue_entries called
          WHERE called.store_id = healthcare_queue_settings.store_id AND called.service_date = healthcare_queue_settings.service_date AND called.status IN ('called','in_consultation'))${storeId ? " AND store_id = ?" : ""}`)
        .bind(now, ...(storeId ? [storeId] : [])),
    ]);
    return Number(result[2]?.meta?.changes ?? 0);
  } catch (err) {
    console.warn("Expire sweep notice:", err);
    return 0;
  }
}

export async function activeHealthcareQueueForUser(userId: string, sweep = true) {
  if (sweep) await expireHealthcareQueueEntries();
  return getD1().prepare(`SELECT e.id, e.store_id AS storeId, s.name AS storeName, s.slug AS storeSlug,
    e.token_number AS tokenNumber, e.status, e.expires_at AS expiresAt,
    e.late_minutes AS lateMinutes, e.late_reported_at AS lateReportedAt,
    e.arrival_status AS arrivalStatus, e.appointment_id AS appointmentId
    FROM healthcare_queue_entries e JOIN stores s ON s.id = e.store_id
    WHERE e.active_key = ? AND e.status IN ('waiting','called','in_consultation') LIMIT 1`)
    .bind(`customer:${userId}`).first<Record<string, string | number | null>>();
}

export async function resetQueueForNewDay(storeId: string) {
  const today = indiaServiceDate();
  const now = Math.floor(Date.now() / 1000);
  const cachedReset = _storeResetCache.get(storeId);
  if (cachedReset && cachedReset.date === today && now - cachedReset.checkedAt < 60) {
    return today;
  }

  const db = getD1();
  await expireHealthcareQueueEntries(storeId);

  const settings = await db.prepare("SELECT service_date AS serviceDate FROM healthcare_queue_settings WHERE store_id = ?").bind(storeId).first<{ serviceDate: string }>();
  if (!settings) {
    await db.prepare(`INSERT OR IGNORE INTO healthcare_queue_settings
      (store_id, status, consultation_minutes, current_token_number, next_token_number, service_date, opening_time, closing_time, maximum_daily_patients, updated_at)
      VALUES (?, 'closed', 15, 0, 1, ?, '09:00', '18:00', 100, ?)`).bind(storeId, today, now).run().catch(() => {});
  } else if (settings.serviceDate !== today) {
    await db.batch([
      db.prepare("UPDATE healthcare_queue_entries SET status = 'cancelled', active_key = NULL, left_at = ?, updated_at = ? WHERE store_id = ? AND service_date < ? AND status IN ('waiting','called','in_consultation')").bind(now, now, storeId, today),
      db.prepare("UPDATE healthcare_queue_settings SET status = 'closed', current_token_number = 0, next_token_number = 1, service_date = ?, opened_at = NULL, closed_at = ?, updated_at = ? WHERE store_id = ?").bind(today, now, now, storeId),
    ]);
  }
  _storeResetCache.set(storeId, { date: today, checkedAt: now });
  return today;
}

export async function patientQueueState(storeId: string, userId?: string) {
  const today = await resetQueueForNewDay(storeId);
  const now = Math.floor(Date.now() / 1000);
  const db = getD1();

  // Edge cache: Reuse store-level queue summary for 1500ms to absorb 50k concurrent requests
  let settings: Record<string, string | number | null> | null = null;
  const cachedSummary = _storeSummaryCache.get(storeId);
  if (cachedSummary && now - cachedSummary.cachedAt < 2) {
    settings = cachedSummary.data;
  } else {
    settings = await db
      .prepare(
        `SELECT q.status, q.service_date AS serviceDate, q.consultation_minutes AS consultationMinutes, s.name AS storeName,
          COALESCE((SELECT token_number FROM healthcare_queue_entries current
            WHERE current.store_id = q.store_id AND current.service_date = q.service_date AND current.status IN ('called','in_consultation') LIMIT 1), 0) AS currentTokenNumber,
          q.next_token_number AS nextTokenNumber,
          hp.admin_queue_enabled AS adminQueueEnabled, hp.owner_queue_enabled AS ownerQueueEnabled,
          hp.accepting_patients AS acceptingPatients, hp.allow_appointments AS allowAppointments,
          hp.verification_status AS verificationStatus,
          hp.queue_activation_status AS queueActivationStatus,
          q.opening_time AS openingTime, q.closing_time AS closingTime,
          q.maximum_daily_patients AS maximumDailyPatients,
          q.grace_period_minutes AS gracePeriodMinutes,
          (SELECT COUNT(*) FROM healthcare_queue_entries daily WHERE daily.store_id = q.store_id AND daily.service_date = q.service_date AND daily.status <> 'cancelled') AS dailyPatientCount,
          (SELECT COUNT(*) FROM healthcare_queue_entries e WHERE e.store_id = q.store_id AND e.service_date = q.service_date AND e.status = 'waiting') AS waitingCount
         FROM healthcare_queue_settings q JOIN healthcare_provider_profiles hp ON hp.store_id = q.store_id
         JOIN stores s ON s.id = q.store_id
         WHERE q.store_id = ? LIMIT 1`,
      )
      .bind(storeId)
      .first<Record<string, string | number | null>>();
    if (settings) {
      _storeSummaryCache.set(storeId, { data: settings, cachedAt: now });
    }
  }
  if (!settings) return null;
  let entry: Record<string, string | number | null> | null = null;
  let completedEntry: Record<string, string | number | null> | null = null;
  let activeQueue: Record<string, string | number | null> | null = null;
  let appointment: Record<string, string | number | null> | null = null;
  if (userId) {
    activeQueue = await activeHealthcareQueueForUser(userId);
    entry = await db
      .prepare(
        `SELECT e.id, e.token_number AS tokenNumber, e.status, e.arrival_status AS arrivalStatus,
          e.joined_at AS joinedAt, e.expires_at AS expiresAt, e.reminder_sent_at AS reminderSentAt,
          e.late_minutes AS lateMinutes, e.late_reported_at AS lateReportedAt,
          e.appointment_id AS appointmentId, e.doctor_id AS doctorId,
          (SELECT COUNT(*) FROM healthcare_queue_entries a
            WHERE a.store_id = e.store_id AND a.service_date = e.service_date AND a.status = 'waiting'
            AND (a.is_emergency > e.is_emergency OR (a.is_emergency = e.is_emergency AND a.token_number < e.token_number)))
          + (SELECT COUNT(*) FROM healthcare_queue_entries called
            WHERE called.store_id = e.store_id AND called.service_date = e.service_date AND called.status IN ('called','in_consultation') AND called.id <> e.id)
          + 1 AS position
         FROM healthcare_queue_entries e
         WHERE e.store_id = ? AND e.user_id = ? AND e.service_date = ? AND e.status IN ('waiting','called','in_consultation')
         ORDER BY CASE e.status WHEN 'waiting' THEN 0 ELSE 1 END, e.joined_at DESC LIMIT 1`,
      )
      .bind(storeId, userId, today)
      .first<Record<string, string | number | null>>();

    completedEntry = await db
      .prepare(
        `SELECT e.id, e.token_number AS tokenNumber, e.status, e.arrival_status AS arrivalStatus,
          e.joined_at AS joinedAt, e.expires_at AS expiresAt, e.reminder_sent_at AS reminderSentAt
         FROM healthcare_queue_entries e
         WHERE e.store_id = ? AND e.user_id = ? AND e.service_date = ? AND e.status = 'completed'
         ORDER BY e.joined_at DESC LIMIT 1`,
      )
      .bind(storeId, userId, today)
      .first<Record<string, string | number | null>>();

    appointment = await db
      .prepare(
        `SELECT a.id, a.appointment_date AS appointmentDate, a.time_slot AS timeSlot,
          a.duration_minutes AS durationMinutes, a.status,
          a.doctor_id AS doctorId, d.name AS doctorName, d.specialization AS doctorSpecialization,
          a.patient_name AS patientName, a.notes, a.queue_entry_id AS queueEntryId
         FROM healthcare_appointments a
         LEFT JOIN healthcare_doctors d ON d.id = a.doctor_id
         WHERE a.store_id = ? AND a.user_id = ? AND a.appointment_date = ?
           AND a.status IN ('booked','confirmed','checked_in')
         ORDER BY a.time_slot ASC LIMIT 1`,
      )
      .bind(storeId, userId, today)
      .first<Record<string, string | number | null>>();
  }
  const position = Number(entry?.position ?? 0);
  const clockParts = new Intl.DateTimeFormat("en-GB", { timeZone: "Asia/Kolkata", hour: "2-digit", minute: "2-digit", hourCycle: "h23" }).formatToParts(new Date());
  const clockValue = (type: "hour" | "minute") => Number(clockParts.find((part) => part.type === type)?.value ?? 0);
  const currentMinutes = clockValue("hour") * 60 + clockValue("minute");
  const timeMinutes = (value: unknown, fallback: number) => {
    const match = String(value ?? "").match(/^(\d{2}):(\d{2})$/);
    return match ? Number(match[1]) * 60 + Number(match[2]) : fallback;
  };
  const openingMinutes = timeMinutes(settings.openingTime, 9 * 60);
  const closingMinutes = timeMinutes(settings.closingTime, 18 * 60);
  const withinOperatingHours = openingMinutes <= closingMinutes
    ? currentMinutes >= openingMinutes && currentMinutes <= closingMinutes
    : currentMinutes >= openingMinutes || currentMinutes <= closingMinutes;
  const capacityAvailable = Number(settings.dailyPatientCount ?? 0) < Number(settings.maximumDailyPatients ?? 100);
  const estimatedWaitMinutes = (entry?.status === "called" || entry?.status === "in_consultation") ? 0 : Math.max(0, position - 1) * Number(settings.consultationMinutes ?? 15);
  const arrivalReminder = Boolean(entry && entry.status === "waiting" && estimatedWaitMinutes <= 5);
  if (userId && entry && arrivalReminder && !entry.reminderSentAt) {
    const now = Math.floor(Date.now() / 1000);
    const updated = await db.prepare("UPDATE healthcare_queue_entries SET reminder_sent_at = ?, updated_at = ? WHERE id = ? AND reminder_sent_at IS NULL RETURNING id")
      .bind(now, now, entry.id).first();
    if (updated) {
      await db.prepare("INSERT INTO notifications (id, user_id, audience, type, title, message, link, created_at) VALUES (?, ?, 'user', 'queue', 'Your turn is approaching', ?, '/healthcare', ?)")
        .bind(crypto.randomUUID(), userId, `Please arrive at ${String(settings.storeName)}. Your turn is approximately five minutes away.`, now).run();
    }
  }
  return {
    ...settings,
    withinOperatingHours,
    capacityAvailable,
    queueAvailable: Boolean(
      (settings.queueActivationStatus === "approved" || !settings.queueActivationStatus) &&
      (settings.adminQueueEnabled === 1 || settings.adminQueueEnabled === true) &&
      (settings.ownerQueueEnabled === 1 || settings.ownerQueueEnabled === true) &&
      (settings.acceptingPatients === 1 || settings.acceptingPatients === true) &&
      (settings.verificationStatus === "verified" || settings.verificationStatus === "approved" || !settings.verificationStatus) &&
      settings.status === "open" &&
      capacityAvailable
    ),
    queueStatus: String(settings.status || "closed"),
    activeQueue,
    appointment,
    arrivalReminder,
    entry: entry ? { ...entry, estimatedWaitMinutes } : null,
    completedEntry,
  };
}
