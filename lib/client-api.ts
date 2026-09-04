"use client";

export function cookieValue(name: string): string | null {
  if (typeof document === "undefined") return null;
  const match = document.cookie
    .split("; ")
    .find((entry) => entry.startsWith(`${name}=`));
  return match ? decodeURIComponent(match.slice(name.length + 1)) : null;
}

export function uploadFormData<T = unknown>(
  path: string,
  body: FormData,
  options: { onProgress?: (percent: number) => void; signal?: AbortSignal } = {},
): Promise<T> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open("POST", path);
    xhr.responseType = "json";
    xhr.withCredentials = true;
    const csrf = cookieValue("kynisto_csrf");
    if (csrf) xhr.setRequestHeader("X-CSRF-Token", csrf);
    xhr.upload.onprogress = (event) => {
      if (event.lengthComputable) options.onProgress?.(Math.round((event.loaded / event.total) * 100));
    };
    xhr.onerror = () => reject(new Error("Upload failed. Check your connection and retry."));
    xhr.onabort = () => reject(new DOMException("Upload cancelled.", "AbortError"));
    xhr.onload = () => {
      const data = xhr.response ?? (() => {
        try { return JSON.parse(xhr.responseText); } catch { return null; }
      })();
      if (xhr.status < 200 || xhr.status >= 300) {
        reject(new Error(data?.error?.message ?? data?.message ?? "Upload failed."));
        return;
      }
      resolve(data as T);
    };
    if (options.signal) {
      if (options.signal.aborted) xhr.abort();
      else options.signal.addEventListener("abort", () => xhr.abort(), { once: true });
    }
    xhr.send(body);
  });
}

export async function safeJsonParse<T = unknown>(response: Response): Promise<T | null> {
  try {
    const text = await response.text();
    if (!text || !text.trim()) return null;
    return JSON.parse(text) as T;
  } catch {
    return null;
  }
}

// In-memory Fast SWR Client Cache for sub-millisecond RAM response
interface CacheEntry<T> {
  data: T;
  timestamp: number;
}

const _ramCache = new Map<string, CacheEntry<unknown>>();
const _inflight = new Map<string, Promise<unknown>>();

// Dynamic cache duration rules (in milliseconds)
function getCacheDuration(path: string): number {
  if (path.startsWith("/api/categories")) return 180_000; // 3 min
  if (path.startsWith("/api/stores") && !path.includes("manage")) return 45_000; // 45s
  if (path.startsWith("/api/products")) return 45_000;
  if (path.startsWith("/api/services")) return 45_000;
  if (path.startsWith("/api/healthcare") && !path.includes("queue")) return 20_000; // 20s
  if (path.startsWith("/api/auth/me")) return 10_000; // 10s
  return 5_000;
}

function getCachedData<T>(key: string): { data: T; isFresh: boolean } | null {
  const now = Date.now();
  const ttl = getCacheDuration(key);

  const ram = _ramCache.get(key) as CacheEntry<T> | undefined;
  if (ram) {
    return { data: ram.data, isFresh: now - ram.timestamp < ttl };
  }

  if (typeof window !== "undefined" && window.sessionStorage) {
    try {
      const stored = sessionStorage.getItem(`kyn_cache_${key}`);
      if (stored) {
        const parsed = JSON.parse(stored) as CacheEntry<T>;
        _ramCache.set(key, parsed);
        return { data: parsed.data, isFresh: now - parsed.timestamp < ttl };
      }
    } catch {
      // Ignore quota/parse errors
    }
  }

  return null;
}

function setCachedData<T>(key: string, data: T): void {
  const entry: CacheEntry<T> = { data, timestamp: Date.now() };
  _ramCache.set(key, entry);

  if (_ramCache.size > 250) {
    const oldestKey = _ramCache.keys().next().value;
    if (oldestKey) _ramCache.delete(oldestKey);
  }

  if (typeof window !== "undefined" && window.sessionStorage) {
    try {
      sessionStorage.setItem(`kyn_cache_${key}`, JSON.stringify(entry));
    } catch {
      // Ignore storage errors
    }
  }
}

export function invalidateClientCache(pathPrefix?: string): void {
  if (!pathPrefix) {
    _ramCache.clear();
    if (typeof window !== "undefined" && window.sessionStorage) {
      Object.keys(sessionStorage).forEach((k) => {
        if (k.startsWith("kyn_cache_")) sessionStorage.removeItem(k);
      });
    }
    return;
  }

  for (const k of Array.from(_ramCache.keys())) {
    if (k.startsWith(pathPrefix)) _ramCache.delete(k);
  }
  if (typeof window !== "undefined" && window.sessionStorage) {
    Object.keys(sessionStorage).forEach((k) => {
      if (k.startsWith(`kyn_cache_${pathPrefix}`)) sessionStorage.removeItem(k);
    });
  }
}

export async function apiFetch<T = unknown>(
  path: string,
  options: RequestInit & { json?: unknown; skipCache?: boolean } = {},
): Promise<T> {
  const headers = new Headers(options.headers);
  if (options.json !== undefined) headers.set("Content-Type", "application/json");
  const method = (options.method ?? "GET").toUpperCase();
  
  if (!["GET", "HEAD", "OPTIONS"].includes(method)) {
    const csrf = cookieValue("kynisto_csrf");
    if (csrf) headers.set("X-CSRF-Token", csrf);
    invalidateClientCache();
  }

  // Ultra-Fast SWR Cached Fetch for GET requests (< 1ms when cached)
  if (method === "GET" && !options.body && options.json === undefined && !options.skipCache) {
    const cached = getCachedData<T>(path);
    if (cached) {
      if (cached.isFresh) {
        return cached.data;
      }
      // Stale cache available: return cached data immediately (0ms) and revalidate in background
      void (async () => {
        try {
          const res = await fetch(path, { ...options, headers, credentials: "same-origin" });
          const freshData = await safeJsonParse<T>(res);
          if (res.ok && freshData && !(freshData as { error?: unknown }).error) {
            setCachedData(path, freshData);
          }
        } catch {}
      })();
      return cached.data;
    }

    // Deduplicate in-flight concurrent requests to the same endpoint
    const existing = _inflight.get(path);
    if (existing) return existing as Promise<T>;

    const promise = (async () => {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 7500); // 7.5s low-network timeout

        const response = await fetch(path, {
          ...options,
          headers,
          credentials: "same-origin",
          signal: options.signal || controller.signal,
        });
        clearTimeout(timeoutId);

        const data = (await safeJsonParse(response)) as T | { error?: { message?: string }; message?: string } | null;
        if (!response.ok) {
          const errorData = data as { error?: { message?: string }; message?: string } | null;
          throw new Error(errorData?.error?.message ?? errorData?.message ?? `Request failed with status ${response.status}.`);
        }
        
        setCachedData(path, data as T);
        return data as T;
      } catch (err) {
        // Low-network / Offline Fallback: If network failed but we have stale cache, return it!
        const stale = getCachedData<T>(path);
        if (stale && stale.data) {
          return stale.data;
        }
        throw err;
      }
    })().finally(() => {
      _inflight.delete(path);
    });

    _inflight.set(path, promise);
    return promise;
  }

  const response = await fetch(path, {
    ...options,
    headers,
    credentials: "same-origin",
    body: options.json !== undefined ? JSON.stringify(options.json) : options.body,
  });
  const data = (await safeJsonParse(response)) as
    | T
    | { error?: { message?: string }; message?: string }
    | null;
  if (!response.ok) {
    const errorData = data as { error?: { message?: string }; message?: string } | null;
    throw new Error(errorData?.error?.message ?? errorData?.message ?? `Request failed with status ${response.status}.`);
  }
  return data as T;
}
