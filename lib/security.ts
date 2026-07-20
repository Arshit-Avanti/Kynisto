import { getD1 } from "@/db/runtime";
import { sha256 } from "@/lib/crypto";
import { ValidationError } from "@/lib/validation";

export class HttpError extends Error {
  status: number;
  code: string;

  constructor(status: number, message: string, code = "REQUEST_FAILED") {
    super(message);
    this.name = "HttpError";
    this.status = status;
    this.code = code;
  }
}

export function assertSameOrigin(request: Request): void {
  const method = request.method.toUpperCase();
  if (method === "GET" || method === "HEAD" || method === "OPTIONS") return;
  const origin = request.headers.get("origin");
  if (!origin) return;
  if (origin !== new URL(request.url).origin) {
    throw new HttpError(403, "Cross-origin request blocked.", "ORIGIN_MISMATCH");
  }
}

export function clientIp(request: Request): string {
  return (
    request.headers.get("cf-connecting-ip") ??
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    "unknown"
  );
}

export async function hashedClientIp(request: Request): Promise<string> {
  return sha256(clientIp(request));
}

export async function enforceRateLimit(
  request: Request,
  scope: string,
  limit: number,
  windowSeconds: number,
): Promise<void> {
  const db = getD1();
  const now = Math.floor(Date.now() / 1000);
  const key = await sha256(`${scope}:${clientIp(request)}`);
  // One UPSERT performs the window reset/increment atomically. A read-then-write
  // limiter loses increments when requests arrive concurrently.
  const record = await db
    .prepare(
      `INSERT INTO rate_limits (key, count, window_started_at, updated_at)
       VALUES (?, 1, ?, ?)
       ON CONFLICT(key) DO UPDATE SET
         count = CASE
           WHEN excluded.updated_at - rate_limits.window_started_at >= ? THEN 1
           ELSE rate_limits.count + 1
         END,
         window_started_at = CASE
           WHEN excluded.updated_at - rate_limits.window_started_at >= ? THEN excluded.window_started_at
           ELSE rate_limits.window_started_at
         END,
         updated_at = excluded.updated_at
       RETURNING count, window_started_at AS windowStartedAt`,
    )
    .bind(key, now, now, windowSeconds, windowSeconds)
    .first<{ count: number; windowStartedAt: number }>();

  if (!record || record.count > limit) {
    throw new HttpError(429, "Too many requests. Please try again shortly.", "RATE_LIMITED");
  }
}

export function apiError(error: unknown): Response {
  if (error instanceof HttpError) {
    return Response.json(
      { error: { code: error.code, message: error.message } },
      { status: error.status, headers: { "Cache-Control": "no-store" } },
    );
  }
  if (error instanceof ValidationError) {
    return Response.json(
      { error: { code: "VALIDATION_ERROR", message: error.message } },
      { status: 400, headers: { "Cache-Control": "no-store" } },
    );
  }
  console.error("Kynisto API error", error);
  return Response.json(
    { error: { code: "INTERNAL_ERROR", message: "Something went wrong." } },
    { status: 500, headers: { "Cache-Control": "no-store" } },
  );
}

export function noStoreJson(data: unknown, init: ResponseInit = {}): Response {
  const headers = new Headers(init.headers);
  headers.set("Cache-Control", "no-store");
  headers.set("Content-Type", "application/json; charset=utf-8");
  return new Response(JSON.stringify(data), { ...init, headers });
}
