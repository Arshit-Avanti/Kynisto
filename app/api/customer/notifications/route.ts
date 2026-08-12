import { NextResponse } from "next/server";
import { requireApiSession } from "@/lib/auth";
import { getD1 } from "@/db/runtime";

async function ensureNotificationsTable(d1: ReturnType<typeof getD1>) {
  try {
    await d1.prepare(`
      CREATE TABLE IF NOT EXISTS user_notifications (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL,
        type TEXT NOT NULL DEFAULT 'system',
        title TEXT NOT NULL,
        body TEXT NOT NULL,
        is_read INTEGER NOT NULL DEFAULT 0,
        metadata TEXT,
        created_at INTEGER NOT NULL
      )
    `).run();
    await d1.prepare(`
      CREATE INDEX IF NOT EXISTS idx_user_notifications_user_id ON user_notifications(user_id)
    `).run();
  } catch {
    // table may already exist — safe to ignore
  }
}

export async function GET(req: Request) {
  try {
    const session = await requireApiSession(req);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const d1 = getD1();
    await ensureNotificationsTable(d1);

    const { searchParams } = new URL(req.url);
    const limit = Math.min(Number(searchParams.get("limit") ?? 50), 100);

    const result = await d1
      .prepare(
        `SELECT id, type, title, body, is_read, metadata, created_at
         FROM user_notifications
         WHERE user_id = ?
         ORDER BY created_at DESC
         LIMIT ?`
      )
      .bind(session.user.id, limit)
      .all();

    const notifications = (result.results ?? []).map((n: any) => ({
      id: n.id,
      type: n.type,
      title: n.title,
      body: n.body,
      isRead: Boolean(n.is_read),
      metadata: n.metadata
        ? (typeof n.metadata === "string" ? JSON.parse(n.metadata) : n.metadata)
        : null,
      createdAt: n.created_at,
    }));

    const unreadCount = notifications.filter((n) => !n.isRead).length;
    return NextResponse.json({ notifications, unreadCount });
  } catch (err) {
    console.error("GET /api/customer/notifications error:", err);
    return NextResponse.json({ notifications: [], unreadCount: 0 });
  }
}

export async function POST(req: Request) {
  try {
    const session = await requireApiSession(req);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const d1 = getD1();
    await ensureNotificationsTable(d1);

    const { action, notificationId } = await req.json() as {
      action: "mark_read" | "mark_all_read";
      notificationId?: string;
    };

    const now = Math.floor(Date.now() / 1000);

    if (action === "mark_all_read") {
      await d1
        .prepare(
          `UPDATE user_notifications SET is_read = 1 WHERE user_id = ? AND is_read = 0`
        )
        .bind(session.user.id)
        .run();
      return NextResponse.json({ success: true, message: "All notifications marked as read." });
    }

    if (action === "mark_read" && notificationId) {
      await d1
        .prepare(
          `UPDATE user_notifications SET is_read = 1 WHERE id = ? AND user_id = ?`
        )
        .bind(notificationId, session.user.id)
        .run();
      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch (err) {
    console.error("POST /api/customer/notifications error:", err);
    return NextResponse.json({ error: "Failed to update notification." }, { status: 500 });
  }
}
