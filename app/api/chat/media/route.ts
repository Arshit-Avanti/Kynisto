import { getD1, getMediaBucket } from "@/db/runtime";
import { requireApiSession } from "@/lib/auth";
import { counterpartId, requireConversationAccess } from "@/lib/chat";
import { mediaChecksum, optionalInteger, safeMediaName, validateMediaFile, verifyMediaSignature } from "@/lib/media";
import { writeAudit } from "@/lib/ownership";
import { apiError, enforceRateLimit, HttpError, noStoreJson } from "@/lib/security";
import { cleanText, safeJson } from "@/lib/validation";

const nowSeconds = () => Math.floor(Date.now() / 1000);

export async function POST(request: Request) {
  let objectKey = "";
  let thumbnailKey = "";
  let committed = false;
  try {
    const session = await requireApiSession(request, { csrf: true });
    await enforceRateLimit(request, `chat-media:${session.user.id}`, 20, 60 * 60);
    const form = await request.formData();
    const conversationId = cleanText(form.get("conversationId"), "Conversation", { max: 80 });
    const conversation = await requireConversationAccess(session.user, conversationId);
    if (conversation.status === "resolved") throw new HttpError(409, "Reopen this conversation before sending media.", "CONVERSATION_RESOLVED");
    const blocked = await getD1().prepare("SELECT id FROM conversation_blocks WHERE conversation_id = ? LIMIT 1").bind(conversationId).first();
    if (blocked) throw new HttpError(403, "Messaging is blocked in this conversation.", "CHAT_BLOCKED");

    const file = form.get("file");
    if (!(file instanceof File)) throw new HttpError(400, "Choose an image or video.", "FILE_REQUIRED");
    const descriptor = validateMediaFile(file);
    if (!await verifyMediaSignature(file)) throw new HttpError(415, "The selected file does not match its media format.", "INVALID_MEDIA_CONTENT");
    const checksum = await mediaChecksum(file);
    const duplicate = await getD1().prepare(
      "SELECT id FROM media_assets WHERE owner_type = 'chat' AND conversation_id = ? AND uploaded_by = ? AND checksum = ? LIMIT 1",
    ).bind(conversationId, session.user.id, checksum).first();
    if (duplicate) throw new HttpError(409, "This media has already been sent in the conversation.", "DUPLICATE_MEDIA");

    const caption = cleanText(form.get("caption"), "Caption", { max: 1000, required: false });
    const width = optionalInteger(form.get("width"), 1, 20_000);
    const height = optionalInteger(form.get("height"), 1, 20_000);
    const durationSeconds = optionalInteger(form.get("durationSeconds"), 0, 24 * 60 * 60);
    const messageId = crypto.randomUUID();
    const mediaId = crypto.randomUUID();
    objectKey = `chat/${conversationId}/${mediaId}.${descriptor.extension}`;
    await getMediaBucket().put(objectKey, file.stream(), {
      httpMetadata: { contentType: file.type, cacheControl: "private, max-age=3600" },
      customMetadata: { conversationId, uploadedBy: session.user.id, mediaId, checksum },
    });

    const thumbnail = form.get("thumbnail");
    if (thumbnail instanceof File && thumbnail.size > 0) {
      const thumbnailDescriptor = validateMediaFile(thumbnail);
      if (thumbnailDescriptor.mediaType !== "image" || !await verifyMediaSignature(thumbnail)) {
        throw new HttpError(415, "Video thumbnail must be a valid image.", "INVALID_THUMBNAIL");
      }
      thumbnailKey = `chat/${conversationId}/${mediaId}-thumbnail.${thumbnailDescriptor.extension}`;
      await getMediaBucket().put(thumbnailKey, thumbnail.stream(), {
        httpMetadata: { contentType: thumbnail.type, cacheControl: "private, max-age=3600" },
        customMetadata: { conversationId, uploadedBy: session.user.id, mediaId, thumbnail: "true" },
      });
    }

    const now = nowSeconds();
    const nonce = cleanText(form.get("clientNonce"), "Message reference", { max: 80, required: false }) || crypto.randomUUID();
    const recipient = await counterpartId(conversationId, session.user.id);
    const statements: D1PreparedStatement[] = [
      getD1().prepare("INSERT INTO messages (id, conversation_id, sender_id, type, body, client_nonce, delivered_at, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)")
        .bind(messageId, conversationId, session.user.id, descriptor.mediaType, caption || (descriptor.mediaType === "image" ? "Image" : "Video"), nonce, now, now),
      getD1().prepare(`INSERT INTO media_assets
        (id, object_key, thumbnail_key, owner_type, message_id, conversation_id, uploaded_by,
         media_type, content_type, original_name, caption, size_bytes, checksum, width, height,
         duration_seconds, created_at)
        VALUES (?, ?, ?, 'chat', ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`)
        .bind(mediaId, objectKey, thumbnailKey || null, messageId, conversationId, session.user.id,
          descriptor.mediaType, file.type, safeMediaName(file), caption || null, file.size, checksum,
          width, height, durationSeconds, now),
      getD1().prepare("UPDATE conversations SET status = CASE WHEN kind = 'admin' THEN 'open' ELSE status END, last_message_at = ?, updated_at = ? WHERE id = ?")
        .bind(now, now, conversationId),
      getD1().prepare("UPDATE conversation_participants SET last_read_at = ? WHERE conversation_id = ? AND user_id = ?")
        .bind(now, conversationId, session.user.id),
    ];
    if (recipient) {
      const target = await getD1().prepare("SELECT role FROM users WHERE id = ? LIMIT 1").bind(recipient).first<{ role: string }>();
      const link = target?.role === "store_owner" ? "/owner?tab=chat" : target?.role === "admin" ? "/admin?tab=chat" : "/account?tab=chat";
      statements.push(getD1().prepare(
        "INSERT INTO notifications (id, user_id, audience, type, title, message, link, created_at) VALUES (?, ?, 'user', 'chat', 'New media message', ?, ?, ?)",
      ).bind(crypto.randomUUID(), recipient, caption.slice(0, 160) || `Sent a ${descriptor.mediaType}.`, link, now));
    }
    try {
      await getD1().batch(statements);
      committed = true;
    } catch (error) {
      await Promise.all([objectKey, thumbnailKey].filter(Boolean).map((key) => getMediaBucket().delete(key)));
      throw error;
    }
    await writeAudit(request, session.user.id, "chat.media_sent", "conversation", conversationId, {
      mediaId,
      mediaType: descriptor.mediaType,
      sizeBytes: file.size,
    });
    return noStoreJson({
      id: messageId,
      mediaId,
      mediaUrl: `/api/chat/media/${mediaId}`,
      thumbnailUrl: thumbnailKey ? `/api/chat/media/${mediaId}?thumbnail=1` : null,
      deliveredAt: now,
    }, { status: 201 });
  } catch (error) {
    if (!committed && objectKey) {
      try { await getMediaBucket().delete(objectKey); } catch {}
    }
    if (!committed && thumbnailKey) {
      try { await getMediaBucket().delete(thumbnailKey); } catch {}
    }
    return apiError(error);
  }
}

export async function DELETE(request: Request) {
  try {
    const session = await requireApiSession(request, { csrf: true });
    const body = await safeJson(request);
    const mediaId = cleanText(body.mediaId, "Media", { max: 80 });
    const media = await getD1().prepare(
      `SELECT ma.id, ma.object_key AS objectKey, ma.thumbnail_key AS thumbnailKey,
        ma.message_id AS messageId, ma.conversation_id AS conversationId, ma.uploaded_by AS uploadedBy
       FROM media_assets ma WHERE ma.id = ? AND ma.owner_type = 'chat' LIMIT 1`,
    ).bind(mediaId).first<{ id: string; objectKey: string; thumbnailKey: string | null; messageId: string; conversationId: string; uploadedBy: string }>();
    if (!media) throw new HttpError(404, "Media message not found.", "MEDIA_NOT_FOUND");
    await requireConversationAccess(session.user, media.conversationId);
    if (session.user.role !== "admin" && media.uploadedBy !== session.user.id) {
      throw new HttpError(403, "Only the sender or an administrator can delete this media.", "ACCESS_DENIED");
    }
    await getD1().prepare("DELETE FROM messages WHERE id = ? AND conversation_id = ?").bind(media.messageId, media.conversationId).run();
    await Promise.all([media.objectKey, media.thumbnailKey].filter((key): key is string => Boolean(key)).map((key) => getMediaBucket().delete(key)));
    await writeAudit(request, session.user.id, "chat.media_deleted", "conversation", media.conversationId, { mediaId });
    return noStoreJson({ ok: true });
  } catch (error) {
    return apiError(error);
  }
}
