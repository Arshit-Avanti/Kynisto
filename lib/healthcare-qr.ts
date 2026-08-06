import { getD1 } from "@/db/runtime";
import { HttpError } from "@/lib/security";
import { patientQueueState, expireHealthcareQueueEntries } from "@/lib/healthcare";

export interface PermanentQueueRecord {
  id: string;
  storeId: string;
  ownerId: string;
  queueCode: string;
  status: "active" | "disabled";
  createdAt: number;
  updatedAt: number;
}

export interface QrAnalyticsSummary {
  totalScans: number;
  uniqueVisitors: number;
  appScans: number;
  webScans: number;
  queueJoins: number;
}

export function generateQueueCode(): string {
  const chars = "23456789ABCDEFGHJKLMNPQRSTUVWXYZ";
  const randomBytes = new Uint8Array(8);
  crypto.getRandomValues(randomBytes);
  let code = "HC_";
  for (let i = 0; i < 8; i++) {
    code += chars[randomBytes[i] % chars.length];
  }
  return code;
}

export async function ensureQrTablesExist() {
  const db = getD1();
  await db.batch([
    db.prepare(`CREATE TABLE IF NOT EXISTS permanent_healthcare_qr_ids (
      id TEXT PRIMARY KEY,
      store_id TEXT NOT NULL UNIQUE,
      owner_id TEXT NOT NULL,
      queue_code TEXT NOT NULL UNIQUE,
      status TEXT NOT NULL DEFAULT 'active',
      created_at INTEGER NOT NULL DEFAULT (unixepoch()),
      updated_at INTEGER NOT NULL DEFAULT (unixepoch())
    )`),
    db.prepare(`CREATE TABLE IF NOT EXISTS healthcare_qr_analytics (
      id TEXT PRIMARY KEY,
      queue_code TEXT NOT NULL,
      store_id TEXT NOT NULL,
      user_id TEXT,
      platform TEXT NOT NULL DEFAULT 'web',
      action_type TEXT NOT NULL DEFAULT 'scan',
      created_at INTEGER NOT NULL DEFAULT (unixepoch())
    )`),
  ]);
}

export async function getOrCreatePermanentQueueId(storeId: string, ownerId: string): Promise<PermanentQueueRecord> {
  await ensureQrTablesExist();
  const db = getD1();
  
  const existing = await db
    .prepare(`SELECT id, store_id AS storeId, owner_id AS ownerId, queue_code AS queueCode, status, created_at AS createdAt, updated_at AS updatedAt
      FROM permanent_healthcare_qr_ids WHERE store_id = ? LIMIT 1`)
    .bind(storeId)
    .first<PermanentQueueRecord>();

  if (existing) return existing;

  let code = generateQueueCode();
  let attempts = 0;
  while (attempts < 5) {
    const taken = await db.prepare("SELECT 1 FROM permanent_healthcare_qr_ids WHERE queue_code = ?").bind(code).first();
    if (!taken) break;
    code = generateQueueCode();
    attempts++;
  }

  const now = Math.floor(Date.now() / 1000);
  const id = crypto.randomUUID();

  await db
    .prepare(`INSERT INTO permanent_healthcare_qr_ids (id, store_id, owner_id, queue_code, status, created_at, updated_at)
      VALUES (?, ?, ?, ?, 'active', ?, ?)`)
    .bind(id, storeId, ownerId, code, now, now)
    .run();

  return {
    id,
    storeId,
    ownerId,
    queueCode: code,
    status: "active",
    createdAt: now,
    updatedAt: now,
  };
}

export async function ensureHealthcareQueueSettings(storeId: string) {
  const db = getD1();
  const now = Math.floor(Date.now() / 1000);
  const today = indiaServiceDate();

  // 1. Ensure healthcare_provider_profiles exists and is active & approved
  await db.prepare(`
    INSERT INTO healthcare_provider_profiles (store_id, provider_type, accepting_patients, admin_queue_enabled, owner_queue_enabled, verification_status, queue_activation_status, created_at, updated_at)
    VALUES (?, 'clinic', 1, 1, 1, 'verified', 'approved', ?, ?)
    ON CONFLICT(store_id) DO UPDATE SET
      accepting_patients = 1,
      admin_queue_enabled = 1,
      owner_queue_enabled = 1,
      verification_status = 'verified',
      queue_activation_status = 'approved',
      updated_at = ?
  `).bind(storeId, now, now, now).run().catch(() => {});

  // 2. Ensure healthcare_queue_settings exists and status is open
  const existing = await db
    .prepare("SELECT 1 FROM healthcare_queue_settings WHERE store_id = ? LIMIT 1")
    .bind(storeId)
    .first();

  if (!existing) {
    await db
      .prepare(`INSERT OR IGNORE INTO healthcare_queue_settings
        (store_id, status, consultation_minutes, current_token_number, next_token_number, service_date, opening_time, closing_time, maximum_daily_patients, opened_at, updated_at)
        VALUES (?, 'open', 15, 0, 1, ?, '00:00', '23:59', 500, ?, ?)`)
      .bind(storeId, today, now, now)
      .run().catch(() => {});
  } else {
    await db
      .prepare("UPDATE healthcare_queue_settings SET status = 'open', updated_at = ? WHERE store_id = ? AND status <> 'open'")
      .bind(now, storeId)
      .run().catch(() => {});
  }
}

export async function resolveHealthcareQueueByCode(queueCode: string, userId?: string) {
  await ensureQrTablesExist();
  await expireHealthcareQueueEntries();
  const db = getD1();
  const cleanCode = queueCode.trim();

  let record = await db
    .prepare(`SELECT q.id, q.store_id AS storeId, q.owner_id AS ownerId, q.queue_code AS queueCode, q.status AS qrStatus,
        s.name AS storeName, s.slug AS storeSlug, s.address, s.area, s.city, s.phone,
        s.logo_url AS logoUrl, s.banner_url AS bannerUrl,
        c.name AS categoryName,
        hp.provider_type AS providerType, hp.accepting_patients AS acceptingPatients,
        hp.verification_status AS verificationStatus, hp.queue_activation_status AS queueActivationStatus
      FROM permanent_healthcare_qr_ids q
      JOIN stores s ON s.id = q.store_id
      JOIN categories c ON c.id = s.category_id
      LEFT JOIN healthcare_provider_profiles hp ON hp.store_id = s.id
      WHERE UPPER(q.queue_code) = UPPER(?) OR s.id = ? OR s.slug = ? LIMIT 1`)
    .bind(cleanCode, cleanCode, cleanCode)
    .first<{
      id: string;
      storeId: string;
      ownerId: string;
      queueCode: string;
      qrStatus: string;
      storeName: string;
      storeSlug: string;
      address: string;
      area: string;
      city: string;
      phone: string;
      logoUrl: string | null;
      bannerUrl: string | null;
      categoryName: string;
      providerType: string | null;
      acceptingPatients: number | null;
      verificationStatus: string | null;
      queueActivationStatus: string | null;
    }>();

  if (!record) {
    const storeRecord = await db
      .prepare(`SELECT s.id AS storeId, s.owner_id AS ownerId, s.name AS storeName
        FROM stores s JOIN categories c ON c.id = s.category_id
        WHERE (s.id = ? OR s.slug = ?) AND c.module = 'healthcare' LIMIT 1`)
      .bind(cleanCode, cleanCode)
      .first<{ storeId: string; ownerId: string; storeName: string }>();

    if (storeRecord) {
      const qrRecord = await getOrCreatePermanentQueueId(storeRecord.storeId, storeRecord.ownerId ?? "system");
      return resolveHealthcareQueueByCode(qrRecord.queueCode, userId);
    }

    throw new HttpError(404, "Invalid or expired healthcare QR code. Please scan a valid Kynisto QR code.", "INVALID_QUEUE_CODE");
  }

  // Ensure queue settings exist for this provider
  await ensureHealthcareQueueSettings(record.storeId);

  const queueState = await patientQueueState(record.storeId, userId);

  return {
    record,
    queueState,
  };
}

export async function recordQrEvent(queueCode: string, storeId: string, userId?: string, platform: "web" | "app" = "web", actionType: "scan" | "join" = "scan") {
  await ensureQrTablesExist();
  const db = getD1();
  await db
    .prepare(`INSERT INTO healthcare_qr_analytics (id, queue_code, store_id, user_id, platform, action_type, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?)`)
    .bind(crypto.randomUUID(), queueCode, storeId, userId ?? null, platform, actionType, Math.floor(Date.now() / 1000))
    .run();
}

export async function getQrAnalytics(storeId: string): Promise<QrAnalyticsSummary> {
  await ensureQrTablesExist();
  const db = getD1();

  const stats = await db
    .prepare(`SELECT 
        COUNT(CASE WHEN action_type = 'scan' THEN 1 END) AS totalScans,
        COUNT(DISTINCT user_id) AS uniqueVisitors,
        COUNT(CASE WHEN platform = 'app' AND action_type = 'scan' THEN 1 END) AS appScans,
        COUNT(CASE WHEN platform = 'web' AND action_type = 'scan' THEN 1 END) AS webScans,
        COUNT(CASE WHEN action_type = 'join' THEN 1 END) AS queueJoins
      FROM healthcare_qr_analytics WHERE store_id = ?`)
    .bind(storeId)
    .first<{
      totalScans: number;
      uniqueVisitors: number;
      appScans: number;
      webScans: number;
      queueJoins: number;
    }>();

  return {
    totalScans: Number(stats?.totalScans ?? 0),
    uniqueVisitors: Number(stats?.uniqueVisitors ?? 0),
    appScans: Number(stats?.appScans ?? 0),
    webScans: Number(stats?.webScans ?? 0),
    queueJoins: Number(stats?.queueJoins ?? 0),
  };
}
