// public/sw.js
const CACHE_VERSION = "v1";
const STATIC_CACHE = `static-${CACHE_VERSION}`;
const PAGES_CACHE = `pages-${CACHE_VERSION}`;
const API_CACHE = `api-${CACHE_VERSION}`;
const IMAGES_CACHE = `images-${CACHE_VERSION}`;

const OFFLINE_URL = "/offline";
const PRECACHE = [OFFLINE_URL, "/icons/icon-192.png", "/icons/icon-512.png"];

// ─────────── install ───────────
self.addEventListener("install", (event) => {
  event.waitUntil(caches.open(STATIC_CACHE).then((c) => c.addAll(PRECACHE)));
  self.skipWaiting();
});

// ─────────── activate (clean old caches) ───────────
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys
            .filter(
              (k) =>
                ![STATIC_CACHE, PAGES_CACHE, API_CACHE, IMAGES_CACHE].includes(
                  k,
                ),
            )
            .map((k) => caches.delete(k)),
        ),
      ),
  );
  self.clients.claim();
});

// ─────────── fetch routing ───────────
self.addEventListener("fetch", (event) => {
  const { request } = event;
  const url = new URL(request.url);

  if (request.method !== "GET") return;
  if (!url.protocol.startsWith("http")) return;

  // NEVER cache auth / payments / admin
  if (
    url.pathname.startsWith("/admin") ||
    url.pathname.startsWith("/owners") ||
    url.pathname.startsWith("/api/owners") ||
    url.pathname.startsWith("/api/buyer/auth") ||
    url.pathname.startsWith("/api/payments")
  ) {
    return; // fall through to network
  }

  // Page navigation → NetworkFirst with offline fallback
  if (request.mode === "navigate") {
    event.respondWith(networkFirst(request, PAGES_CACHE, OFFLINE_URL));
    return;
  }

  // Public API → NetworkFirst
  if (url.pathname.startsWith("/api/public/")) {
    event.respondWith(networkFirst(request, API_CACHE));
    return;
  }

  // Images → CacheFirst
  if (/\.(?:png|jpg|jpeg|svg|gif|webp|avif|ico)$/i.test(url.pathname)) {
    event.respondWith(cacheFirst(request, IMAGES_CACHE));
    return;
  }

  // Fonts + Next.js static → CacheFirst
  if (
    url.hostname.includes("fonts.") ||
    url.pathname.startsWith("/_next/static/")
  ) {
    event.respondWith(cacheFirst(request, STATIC_CACHE));
    return;
  }
});

// ─────────── helpers ───────────
async function networkFirst(request, cacheName, fallbackUrl) {
  const cache = await caches.open(cacheName);
  try {
    const network = await Promise.race([
      fetch(request),
      new Promise((_, reject) =>
        setTimeout(() => reject(new Error("timeout")), 3000),
      ),
    ]);
    if (network.ok) cache.put(request, network.clone());
    return network;
  } catch {
    const cached = await cache.match(request);
    if (cached) return cached;
    if (fallbackUrl) {
      const fb = await caches.match(fallbackUrl);
      if (fb) return fb;
    }
    return new Response("Offline", { status: 503 });
  }
}

async function cacheFirst(request, cacheName) {
  const cache = await caches.open(cacheName);
  const cached = await cache.match(request);
  if (cached) return cached;
  try {
    const network = await fetch(request);
    if (network.ok) cache.put(request, network.clone());
    return network;
  } catch {
    return new Response("Offline", { status: 503 });
  }
}

// ─────────── push notifications (optional) ───────────
self.addEventListener("push", (event) => {
  if (!event.data) return;
  const data = event.data.json();
  event.waitUntil(
    self.registration.showNotification(data.title || "Order update", {
      body: data.body,
      icon: "/icons/icon-192.png",
      badge: "/icons/icon-192.png",
      data: { url: data.url || "/buy/orders" },
      vibrate: [200, 100, 200],
    }),
  );
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  event.waitUntil(clients.openWindow(event.notification.data.url));
});
