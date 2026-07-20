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

export async function requireHealthcareStore(storeId: string) {
  await ensureSeeded();
  const provider = await getD1()
    .prepare(
      `SELECT s.id, s.name, s.owner_id AS ownerId, s.status AS storeStatus,
        hp.provider_type AS providerType, hp.accepting_patients AS acceptingPatients,
        hp.admin_queue_enabled AS adminQueueEnabled,
        hp.owner_queue_enabled AS ownerQueueEnabled, hp.verification_status AS verificationStatus
        , hp.queue_activation_status AS queueActivationStatus
       FROM stores s JOIN categories c ON c.id = s.category_id
       LEFT JOIN healthcare_provider_profiles hp ON hp.store_id = s.id
       WHERE s.id = ? AND c.module = 'healthcare' LIMIT 1`,
    )
    .bind(storeId)
    .first<{
      id: string;
      name: string;
      ownerId: string | null;
      storeStatus: string;
      providerType: HealthcareType | null;
      acceptingPatients: number | null;
      adminQueueEnabled: number | null;
      ownerQueueEnabled: number | null;
      verificationStatus: string | null;
      queueActivationStatus: string | null;
    }>();
  if (!provider) throw new HttpError(404, "Healthcare provider not found.", "HEALTHCARE_NOT_FOUND");
  return provider;
}

/**
 * Serverless-safe expiry sweep. It runs before every queue read or mutation,
 * including each SSE tick, so an active queue is cleaned without an owner or
 * administrator action. The sweep and current-token repair execute atomically in D1.
 */
export async function expireHealthcareQueueEntries(storeId?: string) {
  const db = getD1();
  const now = Math.floor(Date.now() / 1000);
  const scope = storeId ? " AND store_id = ?" : "";
  const values = storeId ? [now, storeId] : [now];
  const result = await db.batch([
    db.prepare(`INSERT INTO healthcare_queue_events (id, store_id, entry_id, actor_id, event_type, metadata, created_at)
      SELECT lower(hex(randomblob(16))), store_id, id, NULL, 'expired',
        json_object('tokenNumber', token_number, 'reason', 'three_hour_timeout'), ?
      FROM healthcare_queue_entries
      WHERE active_key IS NOT NULL AND status IN ('waiting','called') AND expires_at IS NOT NULL AND expires_at <= ?${scope}`)
      .bind(now, ...values),
    db.prepare(`UPDATE healthcare_queue_entries SET status = 'expired', active_key = NULL,
      left_at = ?, updated_at = ?
      WHERE active_key IS NOT NULL AND status IN ('waiting','called') AND expires_at IS NOT NULL AND expires_at <= ?${scope}`)
      .bind(now, now, ...values),
    db.prepare(`UPDATE healthcare_queue_settings SET current_token_number = 0, updated_at = ?
      WHERE current_token_number <> 0
      AND NOT EXISTS (SELECT 1 FROM healthcare_queue_entries called
        WHERE called.store_id = healthcare_queue_settings.store_id AND called.service_date = healthcare_queue_settings.service_date AND called.status = 'called')${storeId ? " AND store_id = ?" : ""}`)
      .bind(now, ...(storeId ? [storeId] : [])),
  ]);
  return Number(result[1]?.meta?.changes ?? 0);
}

export async function activeHealthcareQueueForUser(userId: string, sweep = true) {
  if (sweep) await expireHealthcareQueueEntries();
  return getD1().prepare(`SELECT e.id, e.store_id AS storeId, s.name AS storeName, s.slug AS storeSlug,
    e.token_number AS tokenNumber, e.status, e.expires_at AS expiresAt
    FROM healthcare_queue_entries e JOIN stores s ON s.id = e.store_id
    WHERE e.active_key = ? AND e.status IN ('waiting','called') LIMIT 1`)
    .bind(`customer:${userId}`).first<Record<string, string | number | null>>();
}

export async function resetQueueForNewDay(storeId: string) {
  const db = getD1();
  await expireHealthcareQueueEntries(storeId);
  const today = indiaServiceDate();
  const settings = await db.prepare("SELECT service_date AS serviceDate FROM healthcare_queue_settings WHERE store_id = ?").bind(storeId).first<{ serviceDate: string }>();
  if (settings && settings.serviceDate !== today) {
    const now = Math.floor(Date.now() / 1000);
    await db.batch([
      db.prepare("UPDATE healthcare_queue_entries SET status = 'cancelled', active_key = NULL, left_at = ?, updated_at = ? WHERE store_id = ? AND active_key IS NOT NULL").bind(now, now, storeId),
      db.prepare("UPDATE healthcare_queue_settings SET status = 'closed', current_token_number = 0, next_token_number = 1, service_date = ?, opened_at = NULL, closed_at = ?, updated_at = ? WHERE store_id = ?").bind(today, now, now, storeId),
    ]);
  }
  return today;
}

export async function patientQueueState(storeId: string, userId?: string) {
  const today = await resetQueueForNewDay(storeId);
  const db = getD1();
  const settings = await db
    .prepare(
      `SELECT q.status, q.consultation_minutes AS consultationMinutes, s.name AS storeName,
        COALESCE((SELECT token_number FROM healthcare_queue_entries current
          WHERE current.store_id = q.store_id AND current.service_date = q.service_date AND current.status = 'called' LIMIT 1), 0) AS currentTokenNumber,
        q.next_token_number AS nextTokenNumber,
        hp.admin_queue_enabled AS adminQueueEnabled, hp.owner_queue_enabled AS ownerQueueEnabled,
        hp.accepting_patients AS acceptingPatients, hp.verification_status AS verificationStatus,
        hp.queue_activation_status AS queueActivationStatus,
        q.opening_time AS openingTime, q.closing_time AS closingTime,
        q.maximum_daily_patients AS maximumDailyPatients,
        (SELECT COUNT(*) FROM healthcare_queue_entries daily WHERE daily.store_id = q.store_id AND daily.service_date = q.service_date AND daily.status <> 'cancelled') AS dailyPatientCount,
        (SELECT COUNT(*) FROM healthcare_queue_entries e WHERE e.store_id = q.store_id AND e.service_date = q.service_date AND e.status = 'waiting') AS waitingCount
       FROM healthcare_queue_settings q JOIN healthcare_provider_profiles hp ON hp.store_id = q.store_id
       JOIN stores s ON s.id = q.store_id
       WHERE q.store_id = ? LIMIT 1`,
    )
    .bind(storeId)
    .first<Record<string, string | number | null>>();
  if (!settings) return null;
  let entry: Record<string, string | number | null> | null = null;
  let activeQueue: Record<string, string | number | null> | null = null;
  if (userId) {
    activeQueue = await activeHealthcareQueueForUser(userId);
    entry = await db
      .prepare(
        `SELECT e.id, e.token_number AS tokenNumber, e.status, e.arrival_status AS arrivalStatus,
          e.joined_at AS joinedAt, e.expires_at AS expiresAt, e.reminder_sent_at AS reminderSentAt,
          (SELECT COUNT(*) FROM healthcare_queue_entries a
            WHERE a.store_id = e.store_id AND a.service_date = e.service_date AND a.status = 'waiting'
            AND (a.is_emergency > e.is_emergency OR (a.is_emergency = e.is_emergency AND a.token_number < e.token_number)))
          + (SELECT COUNT(*) FROM healthcare_queue_entries called
            WHERE called.store_id = e.store_id AND called.service_date = e.service_date AND called.status = 'called' AND called.id <> e.id)
          + 1 AS position
         FROM healthcare_queue_entries e
         WHERE e.store_id = ? AND e.user_id = ? AND e.service_date = ? AND e.status IN ('waiting','called')
         ORDER BY e.joined_at DESC LIMIT 1`,
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
  const estimatedWaitMinutes = entry?.status === "called" ? 0 : Math.max(0, position - 1) * Number(settings.consultationMinutes ?? 15);
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
    // Start/Resume Queue is an explicit owner/admin action, so an open queue
    // remains joinable even when operated outside its usual published hours.
    // The schedule remains available to the UI as guidance.
    queueAvailable: Boolean(settings.queueActivationStatus === "approved" && settings.adminQueueEnabled && settings.ownerQueueEnabled && settings.acceptingPatients && settings.verificationStatus === "verified" && settings.status === "open" && capacityAvailable),
    activeQueue,
    arrivalReminder,
    entry: entry ? { ...entry, estimatedWaitMinutes } : null,
  };
}
