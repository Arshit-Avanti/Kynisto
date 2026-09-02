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
  headers.delete("X-Frame-Options");
  headers.delete("x-frame-options");
  headers.set("Strict-Transport-Security", "max-age=31536000; includeSubDomains; preload");
  headers.set("X-Content-Type-Options", "nosniff");
  headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
  headers.set("X-XSS-Protection", "1; mode=block");
  headers.set("Access-Control-Allow-Origin", "*");
  headers.set(
    "Content-Security-Policy",
    "default-src 'self' https: data: blob: 'unsafe-inline' 'unsafe-eval'; " +
    "script-src 'self' 'unsafe-inline' 'unsafe-eval' https: blob: data:; " +
    "script-src-elem 'self' 'unsafe-inline' https: blob: data:; " +
    "worker-src 'self' blob: https:; " +
    "style-src 'self' 'unsafe-inline' https:; " +
    "style-src-elem 'self' 'unsafe-inline' https:; " +
    "img-src 'self' data: blob: https:; " +
    "font-src 'self' data: https:; " +
    "connect-src 'self' https: wss: data: blob:; " +
    "frame-src 'self' https: data: blob:; " +
    "frame-ancestors *; " +
    "object-src 'none';"
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

    // Enforce canonical apex domain (https://kynisto.in) and HTTPS 301 redirection
    const host = url.hostname.toLowerCase();
    const isHttp = url.protocol === "http:" || request.headers.get("x-forwarded-proto") === "http";
    const isWww = host === "www.kynisto.in";

    if (isHttp || isWww) {
      const canonicalHost = isWww ? "kynisto.in" : url.host;
      return Response.redirect(`https://${canonicalHost}${url.pathname}${url.search}`, 301);
    }

    if (url.pathname === "/robots.txt") {
      const origin = "https://kynisto.in";
      return new Response(
        `User-agent: *\nAllow: /\nDisallow: /admin/\nDisallow: /owner/\nDisallow: /account/\nDisallow: /api/\n\nUser-agent: Mediapartners-Google\nDisallow:\nAllow: /\n\nUser-agent: Google-AdSense-Infeed\nDisallow:\nAllow: /\n\nUser-agent: Google-AdSense-AutoAds\nDisallow:\nAllow: /\n\nUser-agent: Google-AdSense-AutoAds-Preflight\nDisallow:\nAllow: /\n\nUser-agent: Google-AdSense-AdsBot\nDisallow:\nAllow: /\n\nUser-agent: Googlebot\nAllow: /\nDisallow: /admin/\nDisallow: /owner/\nDisallow: /account/\nDisallow: /api/\n\nUser-agent: Googlebot-Image\nAllow: /\n\nUser-agent: bingbot\nAllow: /\n\nUser-agent: AdIdxBot\nAllow: /\n\nUser-agent: msnbot\nAllow: /\n\nUser-agent: BingPreview\nAllow: /\n\nSitemap: ${origin}/sitemap.xml\n`,
        {
          headers: {
            "Content-Type": "text/plain; charset=utf-8",
            "Cache-Control": "public, max-age=0, must-revalidate",
            "Access-Control-Allow-Origin": "*",
          },
        },
      );
    }

    if (url.pathname === "/ads.txt") {
      return applySecurityHeaders(
        new Response("google.com, pub-9178031569606873, DIRECT, f08c47fec0942fa0\n", {
          headers: {
            "Content-Type": "text/plain; charset=utf-8",
            "Cache-Control": "public, max-age=86400, stale-while-revalidate=604800",
          },
        }),
      );
    }

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

    // Instant Edge Static Assets with 1-Year Immutable Caching & Range Support
    const method = request.method.toUpperCase();
    const isStaticAsset =
      url.pathname.startsWith("/assets/") ||
      url.pathname.startsWith("/_next/") ||
      url.pathname.startsWith("/_vinext/") ||
      url.pathname.startsWith("/static/") ||
      url.pathname.startsWith("/videos/") ||
      url.pathname.startsWith("/images/") ||
      url.pathname === "/favicon.ico" ||
      url.pathname === "/icon.png" ||
      url.pathname === "/icon.svg" ||
      url.pathname === "/sw.js" ||
      url.pathname === "/manifest.webmanifest" ||
      url.pathname === "/manifest.json" ||
      /\.(png|jpg|jpeg|gif|svg|ico|css|js|mjs|woff2?|json|txt|xml|apk|webmanifest|webp|mp4|webm|mov)$/i.test(url.pathname);

    if ((method === "GET" || method === "HEAD") && isStaticAsset) {
      try {
        const assetResponse = await env.ASSETS.fetch(request);
        if (assetResponse.status < 400) {
          const headers = new Headers(assetResponse.headers);
          headers.set("Cache-Control", "public, max-age=31536000, immutable");
          headers.set("Vary", "Accept-Encoding");
          headers.set("Accept-Ranges", "bytes");
          return applySecurityHeaders(new Response(assetResponse.body, { status: assetResponse.status, headers }));
        }
      } catch {
        // Ignore asset fetch error and fallback to SSR router
      }
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

    if (
      url.pathname.startsWith("/api/categories") ||
      url.pathname.startsWith("/api/stores") ||
      url.pathname.startsWith("/api/search") ||
      url.pathname.startsWith("/api/products") ||
      url.pathname.startsWith("/api/services") ||
      url.pathname.startsWith("/api/healthcare") ||
      url.pathname.startsWith("/api/auth/google/config") ||
      url.pathname.startsWith("/api/version")
    ) {
      if (method === "GET" && !url.searchParams.has("manage") && !url.pathname.includes("queue/active")) {
        try {
          const appRes = await handler.fetch(request, env, ctx);
          const resWithCache = applySecurityHeaders(appRes);
          if (resWithCache.status === 200) {
            resWithCache.headers.set("Cache-Control", "public, max-age=30, s-maxage=60, stale-while-revalidate=86400");
            resWithCache.headers.set("Vary", "Accept-Encoding");
          }
          return resWithCache;
        } catch {
          // Fallback to standard handling
        }
      }
    }

    // Ultra-Fast Edge HTML Caching for Public Guest Pages (10-20ms TTFB)
    const isPublicPage =
      (url.pathname === "/" ||
       url.pathname === "/search" ||
       url.pathname === "/healthcare" ||
       url.pathname === "/blog" ||
       url.pathname.startsWith("/blog/") ||
       url.pathname === "/pricing" ||
       url.pathname === "/about" ||
       url.pathname === "/faq" ||
       url.pathname === "/guide" ||
       url.pathname === "/privacy" ||
       url.pathname === "/terms") &&
      !request.headers.get("cookie")?.includes("kynisto_session");

    if (method === "GET" && isPublicPage) {
      try {
        const pageRes = await handler.fetch(request, env, ctx);
        const secured = applySecurityHeaders(pageRes);
        if (secured.status === 200) {
          secured.headers.set("Cache-Control", "public, max-age=0, s-maxage=120, stale-while-revalidate=86400");
          secured.headers.set("CDN-Cache-Control", "max-age=120");
          secured.headers.set("Cloudflare-CDN-Cache-Control", "max-age=120");
          secured.headers.set("Vary", "Accept-Encoding");
        }
        return secured;
      } catch {
        // Fallback
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

    try {
      const appRes = await handler.fetch(request, env, ctx);
      return applySecurityHeaders(appRes);
    } catch (err) {
      return applySecurityHeaders(new Response(`Server error: ${(err as Error)?.message || err}`, { status: 500 }));
    }
  },
};

export default worker;
