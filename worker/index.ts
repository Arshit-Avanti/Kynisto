/** Cloudflare Worker entry point for Kynisto. */
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

const worker = {
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    const url = new URL(request.url);

    if (url.pathname === "/.well-known/assetlinks.json") {
      return Response.json(
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
        ],
        {
          headers: {
            "Cache-Control": "public, max-age=3600",
          },
        },
      );
    }

    if (url.pathname === "/downloads/Kynisto-1.0.2-release.apk") {
      const asset = await env.ASSETS.fetch(request);
      if (!asset.ok) return asset;
      const headers = new Headers(asset.headers);
      headers.set("Content-Type", "application/vnd.android.package-archive");
      headers.set("Content-Disposition", 'attachment; filename="Kynisto-1.0.2-release.apk"');
      headers.set("Cache-Control", "public, max-age=3600");
      return new Response(asset.body, { status: asset.status, headers });
    }

    if (url.pathname === "/_vinext/image" && env.IMAGES) {
      const allowedWidths = [...DEFAULT_DEVICE_SIZES, ...DEFAULT_IMAGE_SIZES];
      return handleImageOptimization(request, {
        fetchAsset: (path) => env.ASSETS.fetch(new Request(new URL(path, request.url))),
        transformImage: async (body, { width, format, quality }) => {
          const result = await env.IMAGES!.input(body).transform(width > 0 ? { width } : {}).output({ format, quality });
          return result.response();
        },
      }, allowedWidths);
    }

    const method = request.method.toUpperCase();
    if (method === "GET" || method === "HEAD") {
      try {
        const assetResponse = await env.ASSETS.fetch(request);
        if (assetResponse.status !== 404) {
          return assetResponse;
        }
      } catch {
        // Ignore asset fetch error and fallback to SSR router
      }
    }

    try {
      return await handler.fetch(request, env, ctx);
    } catch (err) {
      return new Response(`Server error: ${(err as Error)?.message || err}`, { status: 500 });
    }
  },
};

export default worker;
