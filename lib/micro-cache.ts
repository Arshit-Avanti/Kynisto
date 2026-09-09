type CacheEntry<T> = {
  data: T;
  expiresAt: number;
};

class MicroCache {
  private cache = new Map<string, CacheEntry<unknown>>();

  get<T>(key: string): T | null {
    const entry = this.cache.get(key);
    if (!entry) return null;
    if (Date.now() > entry.expiresAt) {
      this.cache.delete(key);
      return null;
    }
    return entry.data as T;
  }

  set<T>(key: string, data: T, ttlMs: number): void {
    if (this.cache.size > 2000) {
      const now = Date.now();
      for (const [k, entry] of this.cache.entries()) {
        if (now > entry.expiresAt) {
          this.cache.delete(k);
        }
      }
      if (this.cache.size > 2000) {
        const iterator = this.cache.keys();
        for (let i = 0; i < 500; i++) {
          const next = iterator.next();
          if (next.done) break;
          this.cache.delete(next.value);
        }
      }
    }
    this.cache.set(key, {
      data,
      expiresAt: Date.now() + ttlMs,
    });
  }

  delete(key: string): void {
    this.cache.delete(key);
  }

  clear(): void {
    this.cache.clear();
  }
}

export const microCache = new MicroCache();

export function microCacheJson(
  data: unknown,
  cacheControl = "public, max-age=15, s-maxage=60, stale-while-revalidate=300",
  init: ResponseInit = {},
): Response {
  const headers = new Headers(init.headers);
  headers.set("Cache-Control", cacheControl);
  if (cacheControl.includes("no-cache") || cacheControl.includes("no-store")) {
    headers.set("CDN-Cache-Control", "no-store");
    headers.set("Cloudflare-CDN-Cache-Control", "no-store");
  } else {
    headers.set("CDN-Cache-Control", "max-age=60");
    headers.set("Cloudflare-CDN-Cache-Control", "max-age=60");
  }
  headers.set("Content-Type", "application/json; charset=utf-8");
  return new Response(JSON.stringify(data), { ...init, headers });
}
