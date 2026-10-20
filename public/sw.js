// SynqSquad Production Service Worker
// Implements App Shell caching, read-only listings Stale-While-Revalidate,
// offline fallback, and strict zero-caching of authenticated/private data.

const CACHE_NAME = "synqsquad-v1.3.0";
const OFFLINE_FALLBACK_URL = "/offline";

const STATIC_PRECACHE = [
  "/",
  "/people",
  "/offline",
  "/favicon.ico",
  "/manifest.webmanifest",
  "/icons/icon-192.png",
  "/icons/icon-512.png",
  "/icons/icon-maskable-512.png",
  "/icons/icon-monochrome.png",
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(STATIC_PRECACHE);
    }).then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((name) => {
          if (name !== CACHE_NAME) {
            return caches.delete(name);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // 1. Only handle same-origin or explicit static CDNs
  if (request.method !== "GET") {
    return;
  }

  // 2. STRICT SECURITY: Never cache authenticated or private user data
  const isPrivateOrAuth =
    url.pathname.startsWith("/api/user") ||
    url.pathname.startsWith("/api/report") ||
    url.pathname.startsWith("/api/contact") ||
    url.pathname.startsWith("/api/blocks") ||
    url.pathname.startsWith("/api/people/outreach") ||
    url.pathname.startsWith("/api/ai") ||
    url.searchParams.get("auth") === "true" ||
    request.headers.has("Authorization");

  if (isPrivateOrAuth) {
    // Direct network pass-through, zero caching
    return;
  }

  // 3. Stale-While-Revalidate for public read-only listings feed
  if (url.pathname === "/api/listings") {
    event.respondWith(
      caches.open(CACHE_NAME).then(async (cache) => {
        const cachedResponse = await cache.match(request);
        const networkFetch = fetch(request)
          .then((networkResponse) => {
            if (networkResponse && networkResponse.status === 200) {
              cache.put(request, networkResponse.clone());
            }
            return networkResponse;
          })
          .catch(() => cachedResponse);

        return cachedResponse || networkFetch;
      })
    );
    return;
  }

  // 4. Cache-First for Next.js static assets and icons
  if (
    url.pathname.startsWith("/_next/static/") ||
    url.pathname.startsWith("/icons/") ||
    url.pathname.endsWith(".png") ||
    url.pathname.endsWith(".ico") ||
    url.pathname.endsWith(".svg")
  ) {
    event.respondWith(
      caches.match(request).then((cached) => {
        if (cached) return cached;
        return fetch(request).then((networkResponse) => {
          if (networkResponse && networkResponse.status === 200) {
            const responseClone = networkResponse.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(request, responseClone));
          }
          return networkResponse;
        });
      })
    );
    return;
  }

  // 5. Network-First with Offline Fallback for HTML Page navigations
  if (request.mode === "navigate") {
    event.respondWith(
      fetch(request).catch(async () => {
        const cache = await caches.open(CACHE_NAME);
        const cachedPage = await cache.match(request);
        if (cachedPage) return cachedPage;
        const fallback = await cache.match(OFFLINE_FALLBACK_URL);
        return fallback || new Response("Offline - SynqSquad", {
          status: 503,
          headers: { "Content-Type": "text/plain" },
        });
      })
    );
    return;
  }
});
