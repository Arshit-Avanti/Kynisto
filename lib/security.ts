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
  if (!origin || origin === "null" || origin.startsWith("android-app://")) return;
  try {
    const originUrl = new URL(origin);
    const requestUrl = new URL(request.url);
    const trusted = ["kynisto.in", "www.kynisto.in", "kynstio.in", "www.kynstio.in", "localhost", "127.0.0.1"];
    const isOriginTrusted = trusted.includes(originUrl.hostname) || originUrl.hostname.endsWith("workers.dev");
    const isRequestTrusted = trusted.includes(requestUrl.hostname) || requestUrl.hostname.endsWith("workers.dev");
    if (originUrl.hostname !== requestUrl.hostname && (!isOriginTrusted || !isRequestTrusted)) {
      console.warn("Cross-origin request notice from:", origin, "to:", request.url);
    }
  } catch {
    // Ignore malformed origin header parsing error
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

const _memoryRateLimitMap = new Map<string, { count: number; windowStart: number }>();

export async function enforceRateLimit(
  request: Request,
  scope: string,
  limit: number,
  windowSeconds: number,
): Promise<void> {
  const ip = clientIp(request);
  const now = Math.floor(Date.now() / 1000);
  const memKey = `${scope}:${ip}`;

  // In-memory fast path (0ms latency, zero D1 writes)
  const mem = _memoryRateLimitMap.get(memKey);
  if (mem) {
    if (now - mem.windowStart < windowSeconds) {
      mem.count += 1;
      if (mem.count > limit) {
        throw new HttpError(429, "Too many requests. Please try again shortly.", "RATE_LIMITED");
      }
    } else {
      mem.count = 1;
      mem.windowStart = now;
    }
  } else {
    // Keep memory map bounded (max 5000 entries)
    if (_memoryRateLimitMap.size > 5000) {
      for (const [k, v] of _memoryRateLimitMap) {
        if (now - v.windowStart > windowSeconds * 2) _memoryRateLimitMap.delete(k);
      }
    }
    _memoryRateLimitMap.set(memKey, { count: 1, windowStart: now });
  }

  // Only sample 1 in 10 requests to persistent D1 to prevent write bottleneck
  if (Math.random() < 0.1) {
    try {
      const db = getD1();
      const key = await sha256(memKey);
      await db
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
             updated_at = excluded.updated_at`,
        )
        .bind(key, now, now, windowSeconds, windowSeconds)
        .run()
        .catch(() => {});
    } catch {}
  }
}

export class PaymentRequiredError extends HttpError {
  requiredFeature: string;
  featureName: string;
  availablePlans: any[];

  constructor(
    requiredFeature: string,
    featureName: string,
    availablePlans: any[],
    message = "Payment required to access this feature."
  ) {
    super(402, message, "PAYMENT_REQUIRED");
    this.name = "PaymentRequiredError";
    this.requiredFeature = requiredFeature;
    this.featureName = featureName;
    this.availablePlans = availablePlans;
  }
}

export function apiError(error: unknown): Response {
  if (error instanceof PaymentRequiredError) {
    return Response.json(
      {
        error: "Payment Required",
        code: error.code,
        message: error.message,
        requiredFeature: error.requiredFeature,
        featureKey: error.requiredFeature,
        featureName: error.featureName,
        availablePlans: error.availablePlans,
        plans: error.availablePlans,
      },
      { status: 402, headers: { "Cache-Control": "no-store" } }
    );
  }
  if (error instanceof HttpError) {
    if (error.status === 402) {
      return Response.json(
        {
          error: "Payment Required",
          code: error.code,
          message: error.message,
        },
        { status: 402, headers: { "Cache-Control": "no-store" } }
      );
    }
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
  const detail = error instanceof Error ? error.message : String(error);
  console.error("Kynisto API error:", error);
  return Response.json(
    { error: { code: "INTERNAL_ERROR", message: detail || "Something went wrong." } },
    { status: 500, headers: { "Cache-Control": "no-store" } },
  );
}

export function noStoreJson(data: unknown, init: ResponseInit = {}): Response {
  const headers = new Headers(init.headers);
  headers.set("Cache-Control", "no-store");
  headers.set("Content-Type", "application/json; charset=utf-8");
  return new Response(JSON.stringify(data), { ...init, headers });
}
