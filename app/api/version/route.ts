import { APP_VERSION } from "@/lib/app-version";

export async function GET() {
  return Response.json(
    { version: APP_VERSION, releasedAt: "2026-07-18T15:05:00+05:30" },
    { headers: { "Cache-Control": "no-store, no-cache, must-revalidate", Pragma: "no-cache" } },
  );
}
