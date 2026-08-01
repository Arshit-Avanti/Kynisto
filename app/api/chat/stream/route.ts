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
    const encoder = new TextEncoder();
    let cancelled = false;
    const stream = new ReadableStream<Uint8Array>({
      async start(controller) {
        controller.enqueue(encoder.encode("retry: 1500\n\n"));
        for (let attempt = 0; attempt < 12 && !cancelled; attempt += 1) {
          const items = await listMessages(conversationId, cursor);
          // Keep the boundary second in the stream. Client-side message IDs
          // de-duplicate it and no same-second message can be skipped.
          const fresh = items;
          if (fresh.length) {
            cursor = Math.max(...fresh.map((item) => Number(item.createdAt)));
            controller.enqueue(encoder.encode(`event: messages\ndata: ${JSON.stringify({ items: fresh, cursor })}\n\n`));
          } else {
            controller.enqueue(encoder.encode(`event: heartbeat\ndata: ${Date.now()}\n\n`));
          }
          await new Promise((resolve) => setTimeout(resolve, 2000));
        }
        if (!cancelled) controller.close();
      },
      cancel() {
        cancelled = true;
      },
    });
    return new Response(stream, {
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
