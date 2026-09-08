import { APP_VERSION } from "@/lib/app-version";
import { getKynistoEngineStatus } from "@/lib/kynisto-wasm";

export async function GET() {
  return Response.json(
    {
      version: APP_VERSION,
      releasedAt: "2026-08-12T16:14:00+05:30",
      engine: getKynistoEngineStatus(),
    },
    { headers: { "Cache-Control": "no-store, no-cache, must-revalidate", Pragma: "no-cache" } },
  );
}
