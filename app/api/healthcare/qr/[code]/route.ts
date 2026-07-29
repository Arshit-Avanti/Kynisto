import { NextRequest, NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { resolveHealthcareQueueByCode, recordQrEvent } from "@/lib/healthcare-qr";
import { apiError, noStoreJson } from "@/lib/security";

export async function GET(request: NextRequest, { params }: { params: Promise<{ code: string }> }) {
  try {
    const { code } = await params;
    const session = await getSessionUser();
    const user = session?.user ?? null;
    const platform = request.headers.get("x-kynisto-platform") === "android-app" ? "app" : "web";
    
    const data = await resolveHealthcareQueueByCode(code, user?.id);
    
    // Log scan event asynchronously
    recordQrEvent(code, data.record.storeId, user?.id, platform, "scan").catch(() => {});

    return noStoreJson({
      ok: true,
      ...data,
      user: user ? { id: user.id, email: user.email, name: user.name, role: user.role } : null,
    });
  } catch (error) {
    return apiError(error);
  }
}
