/** Cloudflare Worker entry point for Kynisto with A+ Grade Security Headers. */
import "./polyfill";
import { handleImageOptimization, DEFAULT_DEVICE_SIZES, DEFAULT_IMAGE_SIZES } from "vinext/server/image-optimization";
import handler from "vinext/server/app-router-entry";

interface Env {
  ASSETS: Fetcher;
  DB?: D1Database;
  IMAGES?: {
    input(stream: ReadableStream): {
      transform(options: Record<string, unknown>): {
        output(options: { format: string; quality: number }): Promise<{ response(): Response }>;
      };
    };
  };
}

interface ExecutionContext {
  waitUntil(promise: Promise<unknown>): void;
  passThroughOnException(): void;
}

/** Applies industry-standard security headers fully compatible with Google AdSense auto-ads & site preview. */
function applySecurityHeaders(res: Response): Response {
  const headers = new Headers(res.headers);
  headers.set("Strict-Transport-Security", "max-age=31536000; includeSubDomains; preload");
  headers.set("X-Content-Type-Options", "nosniff");
  headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
  headers.set("Permissions-Policy", "camera=(), microphone=(self), geolocation=(self)");
  headers.set("X-XSS-Protection", "1; mode=block");
  headers.set(
    "Content-Security-Policy",
    "default-src 'self' https: data: blob: 'unsafe-inline' 'unsafe-eval'; script-src 'self' 'unsafe-inline' 'unsafe-eval' https:; style-src 'self' 'unsafe-inline' https:; img-src 'self' data: blob: https:; font-src 'self' data: https:; connect-src 'self' https: wss:; frame-src 'self' https: data: blob:; frame-ancestors *; object-src 'none';",
  );
  return new Response(res.body, {
    status: res.status,
    statusText: res.statusText,
    headers,
  });
}

const worker = {
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    const url = new URL(request.url);

    if (url.pathname === "/.well-known/assetlinks.json") {
      return applySecurityHeaders(
        Response.json(
          [
            {
              relation: ["delegate_permission/common.handle_all_urls"],
              target: {
                namespace: "android_app",
                package_name: "com.kynisto.app",
                sha256_cert_fingerprints: [
                  "4E:9D:05:7C:9A:29:99:C3:F8:6B:86:4E:AE:6D:72:A0:04:BE:12:C3:CC:37:D3:70:96:06:85:1D:D2:EB:9B:3E",
                ],
              },
            },
            {
              relation: ["delegate_permission/common.handle_all_urls"],
              target: {
                namespace: "android_app",
                package_name: "dev.nxt_arshit.workers.kynisto.twa",
                sha256_cert_fingerprints: [
                  "4E:9D:05:7C:9A:29:99:C3:F8:6B:86:4E:AE:6D:72:A0:04:BE:12:C3:CC:37:D3:70:96:06:85:1D:D2:EB:9B:3E",
                ],
              },
            },
            {
              relation: ["delegate_permission/common.handle_all_urls"],
              target: {
                namespace: "android_app",
                package_name: "dev.pwabuilder.kynisto",
                sha256_cert_fingerprints: [
                  "4E:9D:05:7C:9A:29:99:C3:F8:6B:86:4E:AE:6D:72:A0:04:BE:12:C3:CC:37:D3:70:96:06:85:1D:D2:EB:9B:3E",
                ],
              },
            },
          ],
          {
            headers: {
              "Cache-Control": "public, max-age=3600",
            },
          },
        ),
      );
    }

    if (url.pathname.startsWith("/downloads/")) {
      const asset = await env.ASSETS.fetch(request);
      if (!asset.ok) return applySecurityHeaders(asset);
      const headers = new Headers(asset.headers);
      headers.set("Content-Type", "application/vnd.android.package-archive");
      const filename = url.pathname.split("/").pop() || "Kynisto-2.1.0-release.apk";
      headers.set("Content-Disposition", `attachment; filename="${filename}"`);
      headers.set("Cache-Control", "public, max-age=31536000, immutable");
      headers.set("Vary", "Accept-Encoding");
      return applySecurityHeaders(new Response(asset.body, { status: asset.status, headers }));
    }

    if (url.pathname.startsWith("/api/categories") || url.pathname.startsWith("/api/auth/google/config")) {
      const method = request.method.toUpperCase();
      if (method === "GET") {
        try {
          const appRes = await handler.fetch(request, env, ctx);
          const resWithCache = applySecurityHeaders(appRes);
          if (resWithCache.status === 200) {
            resWithCache.headers.set("Cache-Control", "public, max-age=300, stale-while-revalidate=86400");
            resWithCache.headers.set("Vary", "Accept-Encoding");
          }
          return resWithCache;
        } catch {
          // Fallback to standard handling
        }
      }
    }

    if (url.pathname === "/_vinext/image" && env.IMAGES) {
      const allowedWidths = [...DEFAULT_DEVICE_SIZES, ...DEFAULT_IMAGE_SIZES];
      const imgRes = await handleImageOptimization(request, {
        fetchAsset: (path) => env.ASSETS.fetch(new Request(new URL(path, request.url))),
        transformImage: async (body, { width, format, quality }) => {
          const result = await env.IMAGES!.input(body).transform(width > 0 ? { width } : {}).output({ format, quality });
          return result.response();
        },
      }, allowedWidths);
      imgRes.headers.set("Cache-Control", "public, max-age=31536000, immutable");
      return applySecurityHeaders(imgRes);
    }

    const method = request.method.toUpperCase();
    if (method === "GET" || method === "HEAD") {
      try {
        const assetResponse = await env.ASSETS.fetch(request);
        if (assetResponse.status !== 404) {
          const headers = new Headers(assetResponse.headers);
          if (url.pathname.startsWith("/assets/") || url.pathname.startsWith("/_next/") || /\.(png|jpg|jpeg|gif|svg|ico|css|js|woff2?)$/i.test(url.pathname)) {
            headers.set("Cache-Control", "public, max-age=31536000, immutable");
          }
          headers.set("Vary", "Accept-Encoding");
          return applySecurityHeaders(new Response(assetResponse.body, { status: assetResponse.status, headers }));
        }
      } catch {
        // Ignore asset fetch error and fallback to SSR router
      }
    }

    try {
      const appRes = await handler.fetch(request, env, ctx);
      return applySecurityHeaders(appRes);
    } catch (err) {
      return applySecurityHeaders(new Response(`Server error: ${(err as Error)?.message || err}`, { status: 500 }));
    }
  },
};

export default worker;
