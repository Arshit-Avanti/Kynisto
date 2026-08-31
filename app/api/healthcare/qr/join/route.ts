import { NextRequest } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { syncOrJoinHealthcareQueueByQr } from "@/lib/healthcare-qr";
import { apiError, HttpError, noStoreJson } from "@/lib/security";

export async function POST(request: NextRequest) {
  try {
    const session = await getSessionUser();
    const user = session?.user;
    if (!user) {
      throw new HttpError(401, "Authentication required to join queue.", "UNAUTHORIZED");
    }

    const body = await request.json() as { queueCode: string; arrivalStatus?: "arrived" | "on_the_way" | "waiting"; markArrived?: boolean };

    if (!body.queueCode) {
      throw new HttpError(400, "Queue code is required.", "MISSING_QUEUE_CODE");
    }

    const platform = request.headers.get("x-kynisto-platform") === "android-app" ? "app" : "web";
    const result = await syncOrJoinHealthcareQueueByQr(
      body.queueCode,
      user.id,
      user.name,
      (user as any).phone,
      {
        platform,
        arrivalStatus: body.arrivalStatus,
        markArrived: body.markArrived,
      }
    );

    return noStoreJson(result);
  } catch (error) {
    return apiError(error);
  }
}

