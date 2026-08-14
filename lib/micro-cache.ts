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
    if (this.cache.size > 1000) {
      const now = Date.now();
      for (const [k, entry] of this.cache.entries()) {
        if (now > entry.expiresAt) {
          this.cache.delete(k);
        }
      }
      if (this.cache.size > 1000) {
        const keys = Array.from(this.cache.keys()).slice(0, 500);
        for (const k of keys) this.cache.delete(k);
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
  headers.set("CDN-Cache-Control", "max-age=60");
  headers.set("Cloudflare-CDN-Cache-Control", "max-age=60");
  headers.set("Content-Type", "application/json; charset=utf-8");
  return new Response(JSON.stringify(data), { ...init, headers });
}
