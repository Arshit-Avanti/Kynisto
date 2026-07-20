import { destroySession, requireApiSession } from "@/lib/auth";
import { apiError } from "@/lib/security";

export async function POST(request: Request) {
  try {
    await requireApiSession(request, { csrf: true, allowPasswordChange: true });
    await destroySession(request);
    return Response.json({ ok: true });
  } catch (error) {
    return apiError(error);
  }
}
