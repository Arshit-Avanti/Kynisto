import { getD1 } from "@/db/runtime";
import type { SessionUser } from "@/lib/auth";
import { HttpError } from "@/lib/security";
import { d1SearchText } from "@/lib/validation";

export type ChatConversation = {
  id: string;
  kind: "store" | "admin" | "support";
  storeId: string | null;
  subject: string;
  status: "open" | "pending" | "resolved";
  ownerId: string | null;
};

export async function requireConversationAccess(
  user: SessionUser,
  conversationId: string,
): Promise<ChatConversation> {
  const row = await getD1()
    .prepare(
      `SELECT c.id, c.kind, c.store_id AS storeId, c.subject, c.status,
        s.owner_id AS ownerId,
        CASE WHEN cp.user_id IS NULL THEN 0 ELSE 1 END AS isParticipant
       FROM conversations c
       LEFT JOIN stores s ON s.id = c.store_id
       LEFT JOIN conversation_participants cp
         ON cp.conversation_id = c.id AND cp.user_id = ?
       WHERE c.id = ? LIMIT 1`,
    )
    .bind(user.id, conversationId)
    .first<ChatConversation & { isParticipant: number }>();
  if (!row) throw new HttpError(404, "Conversation not found.", "NOT_FOUND");

  if (user.role === "admin" && !row.isParticipant) {
    const now = Math.floor(Date.now() / 1000);
    await getD1().prepare("INSERT OR IGNORE INTO conversation_participants (id, conversation_id, user_id, participant_role, last_read_at, joined_at) VALUES (?, ?, ?, 'admin', NULL, ?)").bind(crypto.randomUUID(), conversationId, user.id, now).run();
    row.isParticipant = 1;
  }

  if (row.kind === "store" && user.role === "store_owner" && row.ownerId === user.id && !row.isParticipant) {
    const now = Math.floor(Date.now() / 1000);
    await getD1().batch([
      getD1().prepare("DELETE FROM conversation_participants WHERE conversation_id = ? AND participant_role = 'store_owner'").bind(conversationId),
      getD1().prepare("INSERT OR IGNORE INTO conversation_participants (id, conversation_id, user_id, participant_role, last_read_at, joined_at) VALUES (?, ?, ?, 'store_owner', NULL, ?)").bind(crypto.randomUUID(), conversationId, user.id, now),
    ]);
    row.isParticipant = 1;
  }

  const allowed =
    user.role === "admin" ||
    (row.kind === "store" && user.role === "store_owner" && row.ownerId === user.id) ||
    (row.kind === "store" && user.role === "customer" && Boolean(row.isParticipant)) ||
    (row.kind !== "store" && user.role !== "admin" && Boolean(row.isParticipant));
  if (!allowed) throw new HttpError(403, "Access Denied", "ACCESS_DENIED");
  return row;
}

export async function listConversations(
  user: SessionUser,
  options: { query?: string; status?: string; targetRole?: string } = {},
) {
  const conditions: string[] = [];
  const bindings: unknown[] = [user.id, user.id];
  if (user.role === "admin") {
    conditions.push("1 = 1");
  } else if (user.role === "store_owner") {
    conditions.push("((c.kind = 'store' AND s.owner_id = ?) OR (c.kind IN ('admin','support') AND me.user_id = ?))");
    bindings.push(user.id, user.id);
  } else {
    conditions.push("me.user_id = ?");
    bindings.push(user.id);
  }
  if (["open", "pending", "resolved"].includes(options.status ?? "")) {
    conditions.push("c.status = ?");
    bindings.push(options.status);
  }
  if (user.role === "admin" && ["customer", "store_owner"].includes(options.targetRole ?? "")) {
    conditions.push("EXISTS (SELECT 1 FROM conversation_participants rp JOIN users ru ON ru.id = rp.user_id WHERE rp.conversation_id = c.id AND ru.role = ?)");
    bindings.push(options.targetRole);
  }
  const query = d1SearchText((options.query ?? "").replace(/[%_]/g, "").trim());
  if (query) {
    conditions.push("(c.subject LIKE ? OR s.name LIKE ? OR EXISTS (SELECT 1 FROM conversation_participants sp JOIN users su ON su.id = sp.user_id WHERE sp.conversation_id = c.id AND (su.name LIKE ? OR su.email LIKE ?)))");
    const pattern = `%${query}%`;
    bindings.push(pattern, pattern, pattern, pattern);
  }

  const result = await getD1()
    .prepare(
      `SELECT c.id, c.kind, c.store_id AS storeId, c.subject, c.status,
        c.last_message_at AS lastMessageAt, s.name AS storeName,
        COALESCE((SELECT GROUP_CONCAT(u.name, ', ') FROM conversation_participants p JOIN users u ON u.id = p.user_id WHERE p.conversation_id = c.id AND u.id <> ?), s.name, 'Kynisto support') AS counterpartName,
        (SELECT m.body FROM messages m WHERE m.conversation_id = c.id ORDER BY m.created_at DESC LIMIT 1) AS lastMessage,
        (SELECT COUNT(*) FROM messages um WHERE um.conversation_id = c.id AND um.sender_id <> ? AND um.created_at > COALESCE(me.last_read_at, 0)) AS unreadCount,
        CASE WHEN EXISTS (SELECT 1 FROM conversation_blocks cb WHERE cb.conversation_id = c.id AND (cb.blocker_id = ? OR cb.blocked_id = ?)) THEN 1 ELSE 0 END AS blocked
       FROM conversations c
       LEFT JOIN stores s ON s.id = c.store_id
       LEFT JOIN conversation_participants me ON me.conversation_id = c.id AND me.user_id = ?
       WHERE ${conditions.join(" AND ")}
       ORDER BY c.last_message_at DESC LIMIT 150`,
    )
    .bind(user.id, user.id, user.id, user.id, user.id, ...bindings.slice(2))
    .all();
  return result.results ?? [];
}

export async function unreadConversationCount(user: SessionUser): Promise<number> {
  const rows = await listConversations(user);
  return rows.reduce((total, row) => total + (Number(row.unreadCount ?? 0) > 0 ? 1 : 0), 0);
}

export async function listMessages(conversationId: string, after = 0) {
  const result = await getD1()
    .prepare(
      `SELECT m.id, m.conversation_id AS conversationId, m.sender_id AS senderId,
        u.name AS senderName, u.role AS senderRole, m.type, m.body,
        m.delivered_at AS deliveredAt, m.created_at AS createdAt,
        ma.id AS mediaId, ma.media_type AS mediaType, ma.content_type AS contentType,
        ma.original_name AS originalName, ma.caption, ma.size_bytes AS sizeBytes,
        ma.width, ma.height, ma.duration_seconds AS durationSeconds,
        CASE WHEN ma.id IS NULL THEN NULL ELSE '/api/chat/media/' || ma.id END AS mediaUrl,
        CASE WHEN ma.thumbnail_key IS NULL THEN NULL ELSE '/api/chat/media/' || ma.id || '?thumbnail=1' END AS thumbnailUrl,
        CASE WHEN EXISTS (
          SELECT 1 FROM conversation_participants rp
          WHERE rp.conversation_id = m.conversation_id AND rp.user_id <> m.sender_id
            AND rp.last_read_at >= m.created_at
        ) THEN 1 ELSE 0 END AS isRead
       FROM messages m JOIN users u ON u.id = m.sender_id
       LEFT JOIN media_assets ma ON ma.message_id = m.id
       WHERE m.conversation_id = ? AND m.created_at >= ?
       ORDER BY m.created_at ASC, m.id ASC LIMIT 300`,
    )
    .bind(conversationId, Math.max(0, after))
    .all();
  return result.results ?? [];
}

export async function counterpartId(conversationId: string, userId: string): Promise<string | null> {
  const row = await getD1()
    .prepare(
      `SELECT p.user_id AS userId FROM conversation_participants p
       WHERE p.conversation_id = ? AND p.user_id <> ? ORDER BY p.joined_at ASC LIMIT 1`,
    )
    .bind(conversationId, userId)
    .first<{ userId: string }>();
  return row?.userId ?? null;
}
