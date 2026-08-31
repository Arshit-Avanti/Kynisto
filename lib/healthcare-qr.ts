import { getD1 } from "@/db/runtime";
import { HttpError } from "@/lib/security";
import { patientQueueState, expireHealthcareQueueEntries, indiaServiceDate, activeHealthcareQueueForUser } from "@/lib/healthcare";


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

  // 1. Ensure healthcare_provider_profiles exists
  await db.prepare(`
    INSERT INTO healthcare_provider_profiles (store_id, provider_type, accepting_patients, admin_queue_enabled, owner_queue_enabled, verification_status, queue_activation_status, created_at, updated_at)
    VALUES (?, 'clinic', 1, 1, 1, 'verified', 'approved', ?, ?)
    ON CONFLICT(store_id) DO UPDATE SET
      verification_status = COALESCE(healthcare_provider_profiles.verification_status, 'verified'),
      queue_activation_status = COALESCE(healthcare_provider_profiles.queue_activation_status, 'approved'),
      updated_at = ?
  `).bind(storeId, now, now, now).run().catch(() => {});

  // 2. Ensure healthcare_queue_settings exists without overwriting owner's open/closed state
  const existing = await db
    .prepare("SELECT 1 FROM healthcare_queue_settings WHERE store_id = ? LIMIT 1")
    .bind(storeId)
    .first();

  if (!existing) {
    await db
      .prepare(`INSERT OR IGNORE INTO healthcare_queue_settings
        (store_id, status, consultation_minutes, current_token_number, next_token_number, service_date, opening_time, closing_time, maximum_daily_patients, opened_at, updated_at)
        VALUES (?, 'open', 15, 0, 1, ?, '09:00', '21:00', 500, ?, ?)`)
      .bind(storeId, today, now, now)
      .run().catch(() => {});
  }
}


export async function resolveHealthcareQueueByCode(queueCode: string, userId?: string) {
  await ensureQrTablesExist();
  await expireHealthcareQueueEntries();
  const db = getD1();
  if (userId) {
    await db.prepare("UPDATE healthcare_queue_entries SET active_key = NULL WHERE user_id = ? AND status IN ('completed','cancelled','left','expired','removed','no_show') AND active_key IS NOT NULL")
      .bind(userId).run().catch(() => {});
  }

  let cleanCode = queueCode.trim();
  try {
    if (cleanCode.startsWith("http://") || cleanCode.startsWith("https://")) {
      const parsedUrl = new URL(cleanCode);
      const parts = parsedUrl.pathname.split("/").filter(Boolean);
      if (parts.length > 0) {
        cleanCode = parts[parts.length - 1];
      }
    } else if (cleanCode.includes("/")) {
      const parts = cleanCode.split("/").filter(Boolean);
      if (parts.length > 0) {
        cleanCode = parts[parts.length - 1];
      }
    }
  } catch {
    // fallback
  }
  cleanCode = cleanCode.split("?")[0].split("#")[0].trim();

  let record = await db
    .prepare(`SELECT q.id, q.store_id AS storeId, q.owner_id AS ownerId, q.queue_code AS queueCode, q.status AS qrStatus,
        s.name AS storeName, s.slug AS storeSlug, s.address, s.area, s.city, s.phone, s.email, s.whatsapp,
        s.logo_url AS logoUrl, s.banner_url AS bannerUrl,
        u.email AS ownerEmail,
        COALESCE(c.name, 'Healthcare Clinic') AS categoryName,
        COALESCE(hp.provider_type, 'clinic') AS providerType,
        COALESCE(hp.accepting_patients, 1) AS acceptingPatients,
        COALESCE(hp.verification_status, 'verified') AS verificationStatus,
        COALESCE(hp.queue_activation_status, 'approved') AS queueActivationStatus
      FROM permanent_healthcare_qr_ids q
      JOIN stores s ON s.id = q.store_id
      LEFT JOIN users u ON u.id = q.owner_id
      LEFT JOIN categories c ON c.id = s.category_id
      LEFT JOIN healthcare_provider_profiles hp ON hp.store_id = s.id
      WHERE UPPER(q.queue_code) = UPPER(?) OR s.id = ? OR s.slug = ? OR LOWER(s.slug) = LOWER(?) LIMIT 1`)
    .bind(cleanCode, cleanCode, cleanCode, cleanCode)
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
      phone: string | null;
      email: string | null;
      whatsapp: string | null;
      ownerEmail: string | null;
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
      .prepare(`SELECT s.id AS storeId, s.owner_id AS ownerId, s.name AS storeName, s.slug AS storeSlug
        FROM stores s
        LEFT JOIN categories c ON c.id = s.category_id
        WHERE s.id = ? OR s.slug = ? OR LOWER(s.slug) = LOWER(?) LIMIT 1`)
      .bind(cleanCode, cleanCode, cleanCode)
      .first<{ storeId: string; ownerId: string; storeName: string; storeSlug: string }>();

    if (storeRecord) {
      const qrRecord = await getOrCreatePermanentQueueId(storeRecord.storeId, storeRecord.ownerId ?? "system");
      await ensureHealthcareQueueSettings(storeRecord.storeId);
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

export async function syncOrJoinHealthcareQueueByQr(
  queueCode: string,
  userId: string,
  userName?: string,
  userPhone?: string,
  options?: { platform?: "web" | "app"; arrivalStatus?: "arrived" | "on_the_way" | "waiting"; markArrived?: boolean }
) {
  const db = getD1();
  const now = Math.floor(Date.now() / 1000);
  const platform = options?.platform ?? "web";

  // Clean stale active keys
  await db.prepare("UPDATE healthcare_queue_entries SET active_key = NULL WHERE user_id = ? AND status IN ('completed','cancelled','left','expired','removed','no_show') AND active_key IS NOT NULL")
    .bind(userId).run().catch(() => {});

  const { record, queueState } = await resolveHealthcareQueueByCode(queueCode, userId);

  if (!queueState || !queueState.queueAvailable) {
    throw new HttpError(400, "This healthcare provider does not have an active open queue right now.", "QUEUE_NOT_AVAILABLE");
  }

  // Check if user is already in an active queue
  const activeQueue = await activeHealthcareQueueForUser(userId);
  if (activeQueue) {
    if (String(activeQueue.storeId) === String(record.storeId)) {
      const shouldMarkArrived = options?.markArrived || options?.arrivalStatus === "arrived";
      if (shouldMarkArrived && activeQueue.arrivalStatus !== "arrived") {
        await db.batch([
          db.prepare("UPDATE healthcare_queue_entries SET arrival_status = 'arrived', late_minutes = NULL, updated_at = ? WHERE id = ? AND user_id = ? AND status IN ('waiting','called','in_consultation')")
            .bind(now, activeQueue.id, userId),
          db.prepare("INSERT INTO healthcare_queue_events (id, store_id, entry_id, actor_id, event_type, metadata, created_at) VALUES (?, ?, ?, ?, 'marked_arrived', json_object('tokenNumber', ?, 'via', 'qr_scan_arrival'), ?)")
            .bind(crypto.randomUUID(), record.storeId, activeQueue.id, userId, activeQueue.tokenNumber, now),
        ]);
      }
      recordQrEvent(queueCode, record.storeId, userId, platform, "scan").catch(() => {});
      const updatedState = await patientQueueState(record.storeId, userId);
      return {
        ok: true,
        alreadyJoined: true,
        message: shouldMarkArrived
          ? `Welcome! Your arrival at ${record.storeName} is confirmed for Token #${activeQueue.tokenNumber}.`
          : `You are in this queue with Token #${activeQueue.tokenNumber}.`,
        tokenNumber: Number(activeQueue.tokenNumber),
        entry: activeQueue,
        queueState: updatedState,
        record,
      };
    }
    throw new HttpError(409, "You are already active in another healthcare queue.", "ACTIVE_QUEUE_EXISTS");
  }

  // Fresh queue join
  const today = ((queueState as any)?.serviceDate as string | undefined) || indiaServiceDate();
  const settingsRow = await db
    .prepare("SELECT next_token_number AS nextTokenNumber FROM healthcare_queue_settings WHERE store_id = ?")
    .bind(record.storeId)
    .first<{ nextTokenNumber: number }>();

  const tokenNumber = Number(settingsRow?.nextTokenNumber ?? 1);
  const entryId = crypto.randomUUID();
  const activeKey = `customer:${userId}`;
  const expiresAt = now + 3 * 60 * 60; // 3 hours TTL
  const arrivalStatus = options?.arrivalStatus || (options?.markArrived ? "arrived" : "arrived");

  await db.batch([
    db.prepare(`INSERT INTO healthcare_queue_entries (id, store_id, service_date, token_number, user_id, patient_name, contact_details, is_emergency, arrival_status, status, active_key, joined_at, expires_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, 0, ?, 'waiting', ?, ?, ?, ?)`)
      .bind(entryId, record.storeId, today, tokenNumber, userId, userName ?? "Patient", userPhone ?? null, arrivalStatus, activeKey, now, expiresAt, now),
    db.prepare("UPDATE healthcare_queue_settings SET next_token_number = next_token_number + 1, updated_at = ? WHERE store_id = ?")
      .bind(now, record.storeId),
    db.prepare(`INSERT INTO healthcare_queue_events (id, store_id, entry_id, actor_id, event_type, metadata, created_at)
      VALUES (?, ?, ?, ?, 'joined', json_object('tokenNumber', ?, 'via', 'qr_code', 'arrivalStatus', ?), ?)`)
      .bind(crypto.randomUUID(), record.storeId, entryId, userId, tokenNumber, arrivalStatus, now),
  ]);

  recordQrEvent(queueCode, record.storeId, userId, platform, "join").catch(() => {});

  if (record.ownerId) {
    await db.prepare(`INSERT INTO notifications (id, user_id, audience, type, title, message, link, created_at)
      VALUES (?, ?, 'owner', 'queue', '🚨 New Patient Joined Queue via QR!', ?, '/owner?tab=healthcare', ?)`)
      .bind(crypto.randomUUID(), record.ownerId, `Token #${tokenNumber} (${userName ?? "Patient"}) scanned and joined live queue for ${record.storeName}.`, now)
      .run().catch(() => {});
  }

  const updatedState = await patientQueueState(record.storeId, userId);

  return {
    ok: true,
    alreadyJoined: false,
    message: `Successfully joined ${record.storeName} queue! Your token number is #${tokenNumber}.`,
    tokenNumber,
    entryId,
    queueState: updatedState,
    record,
  };
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


