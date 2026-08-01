import { getD1, getMediaBucket } from "@/db/runtime";
import { requireApiSession } from "@/lib/auth";
import { requireConversationAccess } from "@/lib/chat";
import { apiError, HttpError } from "@/lib/security";

function safeDownloadName(value: string) {
  return value.replace(/["\\/\r\n]/g, "_").slice(0, 160) || "kynisto-media";
}

export async function GET(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const session = await requireApiSession(request);
    const { id } = await context.params;
    const media = await getD1().prepare(
      `SELECT id, object_key AS objectKey, thumbnail_key AS thumbnailKey,
        conversation_id AS conversationId, content_type AS contentType,
        original_name AS originalName
       FROM media_assets WHERE id = ? AND owner_type = 'chat' LIMIT 1`,
    ).bind(id).first<{ id: string; objectKey: string; thumbnailKey: string | null; conversationId: string; contentType: string; originalName: string }>();
    if (!media) throw new HttpError(404, "Media not found.", "MEDIA_NOT_FOUND");
    await requireConversationAccess(session.user, media.conversationId);
    const url = new URL(request.url);
    const thumbnail = url.searchParams.get("thumbnail") === "1";
    const key = thumbnail && media.thumbnailKey ? media.thumbnailKey : media.objectKey;
    const object = await getMediaBucket().get(key);
    if (!object) throw new HttpError(404, "Media file not found.", "MEDIA_FILE_NOT_FOUND");
    const headers = new Headers();
    object.writeHttpMetadata(headers);
    headers.set("Content-Type", object.httpMetadata?.contentType ?? (thumbnail ? "image/jpeg" : media.contentType));
    headers.set("Cache-Control", "private, max-age=3600");
    headers.set("ETag", object.httpEtag);
    headers.set("X-Content-Type-Options", "nosniff");
    headers.set("Accept-Ranges", "bytes");
    headers.set("Content-Disposition", `${url.searchParams.get("download") === "1" ? "attachment" : "inline"}; filename="${safeDownloadName(thumbnail ? `thumbnail-${media.originalName}` : media.originalName)}"`);
    return new Response(object.body, { headers });
  } catch (error) {
    return apiError(error);
  }
}
