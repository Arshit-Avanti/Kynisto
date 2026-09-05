import { APP_VERSION } from "@/lib/app-version";

export const dynamic = "force-dynamic";

export async function GET() {
  const source = `
// Kynisto High-Performance PWA & Web Push Service Worker
const VERSION = ${JSON.stringify(APP_VERSION)};
const CACHE_NAME = "kynisto-static-" + VERSION;
const API_CACHE = "kynisto-api-" + VERSION;
const PRECACHE_URLS = [
  "/",
  "/healthcare",
  "/manifest.webmanifest",
  "/icons/icon-192x192.png",
  "/icons/badge-72x72.png",
  "/kynisto-logo.svg",
  "/kynisto-mark.svg"
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(PRECACHE_URLS).catch(() => {}))
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter((k) => k !== CACHE_NAME && k !== API_CACHE)
          .map((k) => caches.delete(k))
      )
    ).then(() => self.clients.claim())
  );
});

self.addEventListener("message", (event) => {
  if (event.data && event.data.type === "SKIP_WAITING") self.skipWaiting();
  if (event.data && event.data.type === "CLEAR_OLD_CACHES") {
    caches.keys().then((keys) => Promise.all(keys.map((k) => caches.delete(k))));
  }
});

const OFFLINE_FALLBACK_HTML = \`<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Kynisto - Connection</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; background: #f8fafc; color: #0f172a; margin: 0; padding: 24px; display: flex; align-items: center; justify-content: center; min-height: 100vh; }
    .card { background: #ffffff; border: 1px solid #e2e8f0; border-radius: 20px; padding: 36px 28px; max-width: 400px; text-align: center; box-shadow: 0 10px 25px -5px rgba(0,0,0,0.05); }
    .icon { width: 56px; height: 56px; margin: 0 auto 16px; background: #eff6ff; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 24px; }
    h1 { font-size: 20px; font-weight: 800; margin: 0 0 8px; color: #0f172a; }
    p { font-size: 14px; color: #64748b; margin: 0 0 24px; line-height: 1.5; }
    button { background: #0284c7; color: #ffffff; border: none; padding: 12px 28px; border-radius: 9999px; font-weight: 700; font-size: 14px; cursor: pointer; transition: background 0.2s; }
    button:hover { background: #0369a1; }
  </style>
</head>
<body>
  <div class="card">
    <div class="icon">⚡</div>
    <h1>Reconnecting to Kynisto</h1>
    <p>Please check your internet connection or tap below to reload.</p>
    <button onclick="window.location.reload()">Retry Connection</button>
  </div>
</body>
</html>\`;

// ⚡ Ultra-Fast Fetch Interceptor (Cache-First for Static Assets, SWR for Read APIs, Network-First with Safe Fallback for Navigations)
self.addEventListener("fetch", (event) => {
  const request = event.request;
  if (request.method !== "GET") return;

  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;

  // 1. Static Assets (JS, CSS, Fonts, Images) -> Cache-First
  if (
    url.pathname.startsWith("/assets/") ||
    url.pathname.startsWith("/_next/") ||
    url.pathname.startsWith("/icons/") ||
    /\\.(?:js|css|woff2?|svg|png|jpg|jpeg|webp|avif|ico)$/i.test(url.pathname)
  ) {
    event.respondWith(
      caches.match(request).then((cached) => {
        if (cached) return cached;
        return fetch(request)
          .then((response) => {
            if (response && response.ok) {
              const clone = response.clone();
              caches.open(CACHE_NAME).then((cache) => cache.put(request, clone)).catch(() => {});
            }
            return response;
          })
          .catch(() => cached || new Response("", { status: 408, statusText: "Request Timeout" }));
      })
    );
    return;
  }

  // 2. Read APIs (Categories, Stores, Healthcare, Products) -> Stale-While-Revalidate
  if (
    url.pathname.startsWith("/api/categories") ||
    url.pathname.startsWith("/api/stores") ||
    url.pathname.startsWith("/api/products") ||
    url.pathname.startsWith("/api/services") ||
    url.pathname.startsWith("/api/healthcare")
  ) {
    if (url.pathname.includes("/stream") || url.pathname.includes("/active") || url.pathname.includes("/qr")) {
      return;
    }

    event.respondWith(
      caches.open(API_CACHE).then((cache) =>
        cache.match(request).then((cached) => {
          const networkFetch = fetch(request)
            .then((networkResponse) => {
              if (networkResponse && networkResponse.ok) {
                cache.put(request, networkResponse.clone()).catch(() => {});
              }
              return networkResponse;
            })
            .catch(() => cached || new Response(JSON.stringify({ error: "offline", offline: true }), {
              status: 503,
              headers: { "Content-Type": "application/json" }
            }));

          return cached || networkFetch;
        })
      )
    );
    return;
  }

  // 3. Navigation Pages -> Network-First with Safe Fallback that NEVER resolves undefined
  if (request.mode === "navigate") {
    event.respondWith(
      fetch(request)
        .then((response) => {
          if (response && response.status === 200) {
            const clone = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(request, clone)).catch(() => {});
          }
          return response;
        })
        .catch(async () => {
          const cached = await caches.match(request);
          if (cached) return cached;
          const rootCached = await caches.match("/");
          if (rootCached) return rootCached;
          return new Response(OFFLINE_FALLBACK_HTML, {
            status: 200,
            headers: { "Content-Type": "text/html; charset=utf-8" },
          });
        })
    );
    return;
  }
});

// 🔔 Listen for Web & App Push Notifications
self.addEventListener("push", (event) => {
  let data = {
    title: "Kynisto Notification",
    body: "You have a new update on Kynisto.",
    icon: "/icons/icon-192x192.png",
    badge: "/icons/badge-72x72.png",
    url: "/",
  };

  if (event.data) {
    try {
      data = { ...data, ...event.data.json() };
    } catch {
      data.body = event.data.text();
    }
  }

  const options = {
    body: data.body,
    icon: data.icon || "/icons/icon-192x192.png",
    badge: data.badge || "/icons/badge-72x72.png",
    vibrate: [100, 50, 100, 50, 200],
    data: {
      url: data.url || "/",
      timestamp: Date.now(),
    },
    actions: [
      { action: "open", title: "View Details ➔" },
      { action: "dismiss", title: "Dismiss" },
    ],
  };

  event.waitUntil(self.registration.showNotification(data.title, options));
});

// 🖱️ Notification Click Handler
self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  if (event.action === "dismiss") return;

  const targetUrl = event.notification.data?.url || "/";
  event.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if (client.url.includes(targetUrl) && "focus" in client) {
          return client.focus();
        }
      }
      if (self.clients.openWindow) {
        return self.clients.openWindow(targetUrl);
      }
    })
  );
});
`;
  return new Response(source, {
    headers: {
      "Content-Type": "application/javascript; charset=utf-8",
      "Cache-Control": "no-store, no-cache, must-revalidate",
      "Service-Worker-Allowed": "/",
      "X-Content-Type-Options": "nosniff",
    },
  });
}

