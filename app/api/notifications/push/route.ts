import { NextResponse } from "next/server";
import { getD1 } from "@/db/runtime";
import { apiError, assertSameOrigin } from "@/lib/security";
import { cleanText, safeJson } from "@/lib/validation";

export async function POST(request: Request) {
  try {
    assertSameOrigin(request);
    const body = (await safeJson(request)) as Record<string, unknown>;
    const subscription = body.subscription as Record<string, unknown> | undefined;
    const endpoint = cleanText(subscription?.endpoint as string ?? "", "Endpoint", { max: 1000, required: false });

    if (endpoint) {
      const db = getD1();
      const now = Math.floor(Date.now() / 1000);
      const id = crypto.randomUUID();

      await db.prepare(`CREATE TABLE IF NOT EXISTS push_subscriptions (
        id TEXT PRIMARY KEY,
        endpoint TEXT UNIQUE NOT NULL,
        keys_json TEXT,
        created_at INTEGER NOT NULL,
        updated_at INTEGER NOT NULL
      )`).run().catch(() => {});

      await db.prepare(`INSERT OR REPLACE INTO push_subscriptions (id, endpoint, keys_json, created_at, updated_at) VALUES (?, ?, ?, ?, ?)`)
        .bind(id, endpoint, JSON.stringify(subscription), now, now)
        .run()
        .catch(() => {});
    }

    return NextResponse.json({ ok: true, message: "Push notification subscription saved." });
  } catch (error) {
    return apiError(error);
  }
}

export async function DELETE(request: Request) {
  try {
    assertSameOrigin(request);
    const body = (await safeJson(request)) as Record<string, unknown>;
    const endpoint = cleanText(body.endpoint as string ?? "", "Endpoint", { max: 1000, required: false });

    if (endpoint) {
      const db = getD1();
      await db.prepare(`DELETE FROM push_subscriptions WHERE endpoint = ?`).bind(endpoint).run().catch(() => {});
    }

    return NextResponse.json({ ok: true, message: "Push subscription removed." });
  } catch (error) {
    return apiError(error);
  }
}
