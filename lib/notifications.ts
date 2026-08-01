import { getD1 } from "@/db/runtime";

export interface SystemNotification {
  id: string;
  title: string;
  message: string;
  target_role: "all" | "customer" | "store_owner" | "user";
  target_user_id?: string | null;
  url?: string | null;
  type: "info" | "promo" | "alert" | "update";
  sender_name: string;
  created_at: number;
}

export async function ensureNotificationTables(): Promise<void> {
  const db = getD1();
  await db.prepare(`
    CREATE TABLE IF NOT EXISTS system_notifications (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      message TEXT NOT NULL,
      target_role TEXT NOT NULL DEFAULT 'all',
      target_user_id TEXT,
      url TEXT,
      type TEXT NOT NULL DEFAULT 'info',
      sender_name TEXT NOT NULL DEFAULT 'Admin',
      created_at INTEGER NOT NULL
    )
  `).run();
}

export async function createSystemNotification(data: {
  title: string;
  message: string;
  target_role: "all" | "customer" | "store_owner" | "user";
  target_user_id?: string;
  url?: string;
  type?: "info" | "promo" | "alert" | "update";
  sender_name?: string;
}): Promise<SystemNotification> {
  await ensureNotificationTables();
  const db = getD1();
  const id = `notif_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
  const now = Math.floor(Date.now() / 1000);

  const notif: SystemNotification = {
    id,
    title: data.title.trim(),
    message: data.message.trim(),
    target_role: data.target_role,
    target_user_id: data.target_user_id || null,
    url: data.url || null,
    type: data.type || "info",
    sender_name: data.sender_name || "Kynisto Admin",
    created_at: now,
  };

  await db
    .prepare(
      `INSERT INTO system_notifications (id, title, message, target_role, target_user_id, url, type, sender_name, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`
    )
    .bind(
      notif.id,
      notif.title,
      notif.message,
      notif.target_role,
      notif.target_user_id,
      notif.url,
      notif.type,
      notif.sender_name,
      notif.created_at
    )
    .run();

  return notif;
}

export async function getSystemNotifications(limit = 50): Promise<SystemNotification[]> {
  await ensureNotificationTables();
  const db = getD1();
  const { results } = await db
    .prepare(`SELECT * FROM system_notifications ORDER BY created_at DESC LIMIT ?`)
    .bind(limit)
    .all<SystemNotification>();

  return results || [];
}

export async function deleteSystemNotification(id: string): Promise<boolean> {
  await ensureNotificationTables();
  const db = getD1();
  await db.prepare(`DELETE FROM system_notifications WHERE id = ?`).bind(id).run();
  return true;
}
