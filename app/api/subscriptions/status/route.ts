import { NextResponse } from "next/server";
import { isSubscriptionModelEnabled } from "@/lib/settings";

export const dynamic = "force-dynamic";

export async function GET() {
  const enabled = await isSubscriptionModelEnabled();
  return NextResponse.json({ enabled }, {
    headers: {
      "Cache-Control": "no-store, max-age=0",
    },
  });
}

