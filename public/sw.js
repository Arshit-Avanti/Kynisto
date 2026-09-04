// Kynisto High-Performance PWA & Web Push Service Worker
const CACHE_NAME = "kynisto-static-v4";
const API_CACHE = "kynisto-api-v4";
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

// ⚡ Low-network timeout helper for seamless offline & low-bandwidth connectivity
function fetchWithTimeout(request, timeoutMs = 2500) {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error("Network timeout")), timeoutMs);
    fetch(request)
      .then((res) => {
        clearTimeout(timer);
        resolve(res);
      })
      .catch((err) => {
        clearTimeout(timer);
        reject(err);
      });
  });
}

// ⚡ Ultra-Fast Fetch Interceptor (Cache-First for Static Assets, SWR for Read APIs)
self.addEventListener("fetch", (event) => {
  const request = event.request;
  if (request.method !== "GET") return;

  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;

  // 1. Static Assets (JS, CSS, Fonts, Images) -> Cache-First (< 5ms response)
  if (
    url.pathname.startsWith("/assets/") ||
    url.pathname.startsWith("/_next/") ||
    url.pathname.startsWith("/icons/") ||
    /\.(?:js|css|woff2?|svg|png|jpg|jpeg|webp|avif|ico)$/i.test(url.pathname)
  ) {
    event.respondWith(
      caches.match(request).then((cached) => {
        if (cached) return cached;
        return fetch(request).then((response) => {
          if (response.ok) {
            const clone = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(request, clone));
          }
          return response;
        });
      })
    );
    return;
  }

  // 2. Read APIs (Categories, Stores, Healthcare, Products) -> Stale-While-Revalidate (Instant response)
  if (
    url.pathname.startsWith("/api/categories") ||
    url.pathname.startsWith("/api/stores") ||
    url.pathname.startsWith("/api/products") ||
    url.pathname.startsWith("/api/services") ||
    url.pathname.startsWith("/api/healthcare")
  ) {
    // Avoid caching live queue stream or actions
    if (url.pathname.includes("/stream") || url.pathname.includes("/active") || url.pathname.includes("/qr")) {
      return;
    }

    event.respondWith(
      caches.open(API_CACHE).then((cache) =>
        cache.match(request).then((cached) => {
          const networkFetch = fetchWithTimeout(request, 3000)
            .then((networkResponse) => {
              if (networkResponse.ok) {
                cache.put(request, networkResponse.clone());
              }
              return networkResponse;
            })
            .catch(() => cached);

          return cached || networkFetch;
        })
      )
    );
    return;
  }

  // 3. Navigation Pages -> Network with Fast 2.5s Timeout Fallback to Offline / Cache
  if (request.mode === "navigate") {
    event.respondWith(
      fetchWithTimeout(request, 2500)
        .catch(() => caches.match(request).then((res) => res || caches.match("/")))
    );
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
