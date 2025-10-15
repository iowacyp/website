const CACHE_NAME = "iowa-cyp-cache-v1";
const OFFLINE_URLS = [
  "/",
  "/assets/css/site.css",
  "/assets/js/main.js",
  "/assets/pwa/icon-192.png",
  "/assets/pwa/icon-512.png"
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(OFFLINE_URLS))
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key)))
    )
  );
  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") return;
  event.respondWith(
    (async () => {
      const cached = await caches.match(event.request);
      if (cached) {
        return cached;
      }

      try {
        const response = await fetch(event.request);
        if (response && response.status === 200 && response.type === "basic") {
          const cache = await caches.open(CACHE_NAME);
          cache.put(event.request, response.clone());
        }
        return response;
      } catch (error) {
        if (event.request.mode === "navigate") {
          const offlinePage = await caches.match("/");
          if (offlinePage) {
            return offlinePage;
          }
        }
        const fallbackAsset = await caches.match(event.request);
        if (fallbackAsset) {
          return fallbackAsset;
        }
        return Response.error();
      }
    })()
  );
});
