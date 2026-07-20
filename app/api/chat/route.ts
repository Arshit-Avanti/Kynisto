import { getD1 } from "@/db/runtime";
import { requireApiSession } from "@/lib/auth";
import {
  counterpartId,
  listConversations,
  listMessages,
  requireConversationAccess,
  unreadConversationCount,
} from "@/lib/chat";
import { enforceRateLimit, apiError, HttpError, noStoreJson } from "@/lib/security";
import { cleanText, safeJson } from "@/lib/validation";

const nowSeconds = () => Math.floor(Date.now() / 1000);

export async function GET(request: Request) {
  try {
    const session = await requireApiSession(request);
    const params = new URL(request.url).searchParams;
    if (params.get("view") === "badge") {
      return noStoreJson({ unreadConversations: await unreadConversationCount(session.user) });
    }
    const conversationId = params.get("conversationId");
    if (conversationId) {
      await requireConversationAccess(session.user, conversationId);
      return noStoreJson({ items: await listMessages(conversationId, Number(params.get("after") ?? 0)) });
    }
    return noStoreJson({
      items: await listConversations(session.user, {
        query: params.get("q") ?? "",
        status: params.get("status") ?? "",
        targetRole: params.get("role") ?? "",
      }),
    });
  } catch (error) {
    return apiError(error);
  }
}

export async function POST(request: Request) {
  try {
    const session = await requireApiSession(request, { csrf: true });
    await enforceRateLimit(request, `chat:${session.user.id}`, 60, 60);
    const body = await safeJson(request);
    const action = cleanText(body.action, "Action", { max: 30 });
    const db = getD1();
    const now = nowSeconds();

    if (action === "start_store") {
      if (session.user.role !== "customer" && session.user.role !== "admin") throw new HttpError(403, "Access Denied", "ACCESS_DENIED");
      const storeId = cleanText(body.storeId, "Store", { max: 80 });
      const store = await db
        .prepare(`SELECT s.id, s.name, s.owner_id AS ownerId FROM stores s
          JOIN users u ON u.id = s.owner_id AND u.role = 'store_owner' AND u.status = 'active'
          WHERE s.id = ? AND s.status = 'approved' LIMIT 1`)
        .bind(storeId)
        .first<{ id: string; name: string; ownerId: string | null }>();
      if (!store?.ownerId) throw new HttpError(409, "This shop is not accepting chat yet.", "CHAT_UNAVAILABLE");
      const existing = await db
        .prepare("SELECT c.id FROM conversations c JOIN conversation_participants p ON p.conversation_id = c.id WHERE c.kind = 'store' AND c.store_id = ? AND p.user_id = ? LIMIT 1")
        .bind(storeId, session.user.id)
        .first<{ id: string }>();
      if (existing) {
        await db.batch([
          db.prepare("DELETE FROM conversation_participants WHERE conversation_id = ? AND participant_role = 'store_owner' AND user_id <> ?").bind(existing.id, store.ownerId),
          db.prepare("INSERT OR IGNORE INTO conversation_participants (id, conversation_id, user_id, participant_role, last_read_at, joined_at) VALUES (?, ?, ?, 'store_owner', NULL, ?)").bind(crypto.randomUUID(), existing.id, store.ownerId, now),
          db.prepare("UPDATE conversations SET subject = ?, updated_at = ? WHERE id = ?").bind(store.name, now, existing.id),
        ]);
        return noStoreJson({ id: existing.id, existing: true });
      }
      const id = crypto.randomUUID();
      const participantRole = session.user.role === "admin" ? "admin" : "customer";
      const notificationTitle = session.user.role === "admin" ? "Kynisto admin conversation" : "New customer conversation";
      const notificationMessage = session.user.role === "admin"
        ? `A Kynisto administrator started a conversation about ${store.name}.`
        : `A customer started a conversation about ${store.name}.`;
      await db.batch([
        db.prepare("INSERT INTO conversations (id, kind, store_id, subject, status, created_by, last_message_at, created_at, updated_at) VALUES (?, 'store', ?, ?, 'open', ?, ?, ?, ?)").bind(id, storeId, store.name, session.user.id, now, now, now),
        db.prepare("INSERT INTO conversation_participants (id, conversation_id, user_id, participant_role, last_read_at, joined_at) VALUES (?, ?, ?, ?, ?, ?)").bind(crypto.randomUUID(), id, session.user.id, participantRole, now, now),
        db.prepare("INSERT INTO conversation_participants (id, conversation_id, user_id, participant_role, last_read_at, joined_at) VALUES (?, ?, ?, 'store_owner', NULL, ?)").bind(crypto.randomUUID(), id, store.ownerId, now),
        db.prepare("INSERT INTO notifications (id, user_id, audience, type, title, message, link, created_at) VALUES (?, ?, 'user', 'chat', ?, ?, '/owner?tab=chat', ?)").bind(crypto.randomUUID(), store.ownerId, notificationTitle, notificationMessage, now),
      ]);
      return noStoreJson({ id }, { status: 201 });
    }

    if (action === "start_admin") {
      if (session.user.role !== "admin") throw new HttpError(403, "Access Denied", "ACCESS_DENIED");
      const userId = cleanText(body.userId, "User", { max: 80 });
      const subject = cleanText(body.subject, "Subject", { min: 3, max: 120 });
      const target = await db.prepare("SELECT id, role, status FROM users WHERE id = ? AND role <> 'admin' LIMIT 1").bind(userId).first<{ id: string; role: string; status: string }>();
      if (!target || target.status !== "active") throw new HttpError(404, "Active user not found.", "NOT_FOUND");
      const existing = await db.prepare(`SELECT c.id FROM conversations c
        JOIN conversation_participants admin_participant ON admin_participant.conversation_id = c.id AND admin_participant.user_id = ?
        JOIN conversation_participants target_participant ON target_participant.conversation_id = c.id AND target_participant.user_id = ?
        WHERE c.kind = 'admin' AND c.subject = ? AND c.status <> 'resolved' LIMIT 1`)
        .bind(session.user.id, userId, subject).first<{ id: string }>();
      if (existing) return noStoreJson({ id: existing.id, existing: true });
      const id = crypto.randomUUID();
      const targetLink = target.role === "store_owner" ? "/owner?tab=chat" : "/account?tab=chat";
      await db.batch([
        db.prepare("INSERT INTO conversations (id, kind, subject, status, created_by, last_message_at, created_at, updated_at) VALUES (?, 'admin', ?, 'pending', ?, ?, ?, ?)").bind(id, subject, session.user.id, now, now, now),
        db.prepare("INSERT INTO conversation_participants (id, conversation_id, user_id, participant_role, last_read_at, joined_at) VALUES (?, ?, ?, 'admin', ?, ?)").bind(crypto.randomUUID(), id, session.user.id, now, now),
        db.prepare("INSERT INTO conversation_participants (id, conversation_id, user_id, participant_role, last_read_at, joined_at) VALUES (?, ?, ?, ?, NULL, ?)").bind(crypto.randomUUID(), id, userId, target.role, now),
        db.prepare("INSERT INTO notifications (id, user_id, audience, type, title, message, link, created_at) VALUES (?, ?, 'user', 'chat', 'Kynisto support started a conversation', ?, ?, ?)").bind(crypto.randomUUID(), userId, subject, targetLink, now),
      ]);
      return noStoreJson({ id }, { status: 201 });
    }

    const conversationId = cleanText(body.conversationId, "Conversation", { max: 80 });
    const conversation = await requireConversationAccess(session.user, conversationId);

    if (action === "send") {
      if (conversation.status === "resolved") throw new HttpError(409, "Reopen this conversation before replying.", "CONVERSATION_RESOLVED");
      const blocked = await db.prepare("SELECT id FROM conversation_blocks WHERE conversation_id = ? LIMIT 1").bind(conversationId).first();
      if (blocked) throw new HttpError(403, "Messaging is blocked in this conversation.", "CHAT_BLOCKED");
      const message = cleanText(body.message, "Message", { min: 1, max: 2000 });
      const nonce = cleanText(body.clientNonce, "Message reference", { max: 80, required: false }) || crypto.randomUUID();
      const messageId = crypto.randomUUID();
      const recipient = await counterpartId(conversationId, session.user.id);
      const inserted = await db.prepare("INSERT OR IGNORE INTO messages (id, conversation_id, sender_id, type, body, client_nonce, delivered_at, created_at) VALUES (?, ?, ?, 'text', ?, ?, ?, ?)").bind(messageId, conversationId, session.user.id, message, nonce, now, now).run();
      if (Number(inserted.meta.changes ?? 0) === 0) {
        const existing = await db.prepare("SELECT id, delivered_at AS deliveredAt FROM messages WHERE sender_id = ? AND client_nonce = ? LIMIT 1").bind(session.user.id, nonce).first();
        return noStoreJson(existing ?? { deliveredAt: now });
      }
      const statements = [
        db.prepare("UPDATE conversations SET status = CASE WHEN kind = 'admin' THEN 'open' ELSE status END, last_message_at = ?, updated_at = ? WHERE id = ?").bind(now, now, conversationId),
        db.prepare("UPDATE conversation_participants SET last_read_at = ? WHERE conversation_id = ? AND user_id = ?").bind(now, conversationId, session.user.id),
      ];
      if (recipient) {
        const target = await db.prepare("SELECT role FROM users WHERE id = ? LIMIT 1").bind(recipient).first<{ role: string }>();
        const link = target?.role === "store_owner" ? "/owner?tab=chat" : target?.role === "admin" ? "/admin?tab=chat" : "/account?tab=chat";
        statements.push(db.prepare("INSERT INTO notifications (id, user_id, audience, type, title, message, link, created_at) VALUES (?, ?, 'user', 'chat', 'New message', ?, ?, ?)").bind(crypto.randomUUID(), recipient, message.slice(0, 160), link, now));
      }
      await db.batch(statements);
      return noStoreJson({ id: messageId, deliveredAt: now }, { status: 201 });
    }

    if (action === "block") {
      if (conversation.kind !== "store") throw new HttpError(400, "Support conversations cannot be blocked.", "INVALID_ACTION");
      const target = await counterpartId(conversationId, session.user.id);
      if (!target) throw new HttpError(409, "No participant is available to block.", "NO_PARTICIPANT");
      const reason = cleanText(body.reason, "Reason", { max: 300, required: false }) || null;
      await db.prepare("INSERT OR IGNORE INTO conversation_blocks (id, conversation_id, blocker_id, blocked_id, reason, created_at) VALUES (?, ?, ?, ?, ?, ?)").bind(crypto.randomUUID(), conversationId, session.user.id, target, reason, now).run();
      return noStoreJson({ ok: true });
    }

    if (action === "report") {
      const target = await counterpartId(conversationId, session.user.id);
      const reason = cleanText(body.reason, "Reason", { min: 3, max: 120 });
      const details = cleanText(body.details, "Details", { max: 1000, required: false }) || null;
      const messageId = cleanText(body.messageId, "Message", { max: 80, required: false }) || null;
      if (messageId) {
        const belongs = await db.prepare("SELECT id FROM messages WHERE id = ? AND conversation_id = ? LIMIT 1").bind(messageId, conversationId).first();
        if (!belongs) throw new HttpError(404, "Message not found in this conversation.", "NOT_FOUND");
      }
      await db.prepare("INSERT INTO chat_reports (id, conversation_id, message_id, reporter_id, reported_id, reason, details, status, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, 'open', ?, ?)").bind(crypto.randomUUID(), conversationId, messageId, session.user.id, target, reason, details, now, now).run();
      return noStoreJson({ ok: true }, { status: 201 });
    }

    throw new HttpError(400, "Unsupported chat action.", "INVALID_ACTION");
  } catch (error) {
    return apiError(error);
  }
}

export async function PATCH(request: Request) {
  try {
    const session = await requireApiSession(request, { csrf: true });
    const body = await safeJson(request);
    const action = cleanText(body.action, "Action", { max: 30 });
    const conversationId = cleanText(body.conversationId, "Conversation", { max: 80 });
    await requireConversationAccess(session.user, conversationId);
    const now = nowSeconds();
    if (action === "mark_read") {
      await getD1().prepare("UPDATE conversation_participants SET last_read_at = ? WHERE conversation_id = ? AND user_id = ?").bind(now, conversationId, session.user.id).run();
      return noStoreJson({ ok: true, readAt: now });
    }
    if ((action === "resolve" || action === "reopen") && session.user.role === "admin") {
      const status = action === "resolve" ? "resolved" : "open";
      await getD1().batch([
        getD1().prepare("UPDATE conversations SET status = ?, updated_at = ? WHERE id = ?").bind(status, now, conversationId),
        getD1().prepare("UPDATE support_tickets SET status = ?, updated_at = ? WHERE id = (SELECT support_ticket_id FROM conversations WHERE id = ?)").bind(status === "resolved" ? "resolved" : "in_progress", now, conversationId),
      ]);
      return noStoreJson({ ok: true, status });
    }
    throw new HttpError(400, "Unsupported chat action.", "INVALID_ACTION");
  } catch (error) {
    return apiError(error);
  }
}
