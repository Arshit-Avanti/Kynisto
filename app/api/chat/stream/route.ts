import { requireApiSession } from "@/lib/auth";
import { listMessages, requireConversationAccess } from "@/lib/chat";
import { apiError, HttpError } from "@/lib/security";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const session = await requireApiSession(request);
    const params = new URL(request.url).searchParams;
    const conversationId = params.get("conversationId");
    if (!conversationId) throw new HttpError(400, "Conversation is required.", "VALIDATION_ERROR");
    await requireConversationAccess(session.user, conversationId);
    let cursor = Math.max(0, Number(params.get("after") ?? 0));
    const items = await listMessages(conversationId, cursor);
    let payload = "retry: 2500\n";
    if (items.length) {
      cursor = Math.max(...items.map((item) => Number(item.createdAt)));
      payload += `event: messages\ndata: ${JSON.stringify({ items, cursor })}\n\n`;
    } else {
      payload += `event: heartbeat\ndata: ${Date.now()}\n\n`;
    }
    return new Response(payload, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-store, no-transform",
        Connection: "keep-alive",
      },
    });
  } catch (error) {
    return apiError(error);
  }
}
