const CACHE_PREFIX = 'iowa-cyp-story-gallery-';
const CACHE_NAME = `${CACHE_PREFIX}7bbbd305f7de`;
const ASSETS = ["/story-gallery/","/assets/css/site.css","/assets/js/story-gallery.js","/assets/img/branding_symbol.png","/assets/pwa/icon-192.png","/assets/img/story-gallery/summer-camp-2026-full.jpg","/assets/img/story-gallery/summer-camp-2026-thumb.jpg","/assets/img/story-gallery/summer-camp-friendships-full.jpg","/assets/img/story-gallery/summer-camp-hat-pair-full.jpg","/assets/img/story-gallery/summer-camp-ice-cream-group-full.jpg","/assets/img/story-gallery/summer-camp-ice-cream-smile-full.jpg","/assets/img/story-gallery/summer-camp-community-full.jpg","/assets/img/story-gallery/region-7-symposium-2026-full.jpg","/assets/img/story-gallery/region-7-symposium-2026-thumb.jpg","/assets/img/story-gallery/region-7-symposium-speaker-full.jpg","/assets/img/story-gallery/region-7-symposium-workshop-full.jpg","/assets/img/story-gallery/charlee-national-2-full.jpg","/assets/img/story-gallery/charlee-national-2-thumb.jpg","/assets/img/story-gallery/charlee-national-4-full.jpg","/assets/img/story-gallery/charlee-national-3-full.jpg","/assets/img/story-gallery/charlee-national-1-full.jpg","/assets/img/story-gallery/charlee-national-5-full.jpg","/assets/img/story-gallery/charlee-national-6-full.jpg","/assets/img/story-gallery/military-family-ball-full.jpg","/assets/img/story-gallery/military-family-ball-thumb.jpg","/assets/img/story-gallery/purple-star-schools-full.jpg","/assets/img/story-gallery/purple-star-schools-thumb.jpg","/assets/img/story-gallery/purple-up-full.jpg","/assets/img/story-gallery/purple-up-thumb.jpg","/assets/img/story-gallery/capitol-proclamation-full.jpg","/assets/img/story-gallery/capitol-proclamation-thumb.jpg","/assets/img/story-gallery/veteran-listening-full.jpg","/assets/img/story-gallery/veteran-listening-thumb.jpg","/assets/img/story-gallery/gtp-representative-full.jpg","/assets/img/story-gallery/gtp-representative-thumb.jpg","/assets/img/story-gallery/fall-family-festival-full.jpg","/assets/img/story-gallery/fall-family-festival-thumb.jpg","/assets/img/story-gallery/parent-perspective-full.jpg","/assets/img/story-gallery/parent-perspective-thumb.jpg","/assets/img/story-gallery/camper-confidence-full.jpg","/assets/img/story-gallery/camper-confidence-thumb.jpg","/assets/img/story-gallery/legacy-rock-friendship-full.jpg","/assets/img/story-gallery/legacy-rock-friendship-thumb.jpg","/assets/img/story-gallery/youth-volunteer-award-full.jpg","/assets/img/story-gallery/youth-volunteer-award-thumb.jpg"];
const ASSET_PATHS = new Set(ASSETS);

self.addEventListener('install', (event) => {
  event.waitUntil((async () => {
    const cache = await caches.open(CACHE_NAME);
    await Promise.all(ASSETS.map(async (path) => {
      const response = await fetch(path, { cache: 'reload' });
      if (!response.ok) throw new Error(`Could not cache ${path}: ${response.status}`);
      await cache.put(path, response);
    }));
    await self.skipWaiting();
  })());
});

self.addEventListener('activate', (event) => {
  event.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(
      keys
        .filter((key) => key.startsWith(CACHE_PREFIX) && key !== CACHE_NAME)
        .map((key) => caches.delete(key))
    );
    await self.clients.claim();
  })());
});

self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;
  const url = new URL(event.request.url);
  if (url.origin !== self.location.origin) return;

  if (event.request.mode === 'navigate') {
    event.respondWith((async () => {
      try {
        const response = await fetch(event.request);
        const cache = await caches.open(CACHE_NAME);
        await cache.put('/story-gallery/', response.clone());
        return response;
      } catch (error) {
        return (await caches.match('/story-gallery/')) || Response.error();
      }
    })());
    return;
  }

  if (!ASSET_PATHS.has(url.pathname)) return;

  const isShellAsset = url.pathname.endsWith('.js') || url.pathname.endsWith('.css');
  if (isShellAsset) {
    event.respondWith((async () => {
      try {
        const response = await fetch(event.request, { cache: 'no-store' });
        if (!response.ok) throw new Error(`Network response failed: ${response.status}`);
        const cache = await caches.open(CACHE_NAME);
        await cache.put(url.pathname, response.clone());
        return response;
      } catch (error) {
        return (await caches.match(url.pathname)) || Response.error();
      }
    })());
    return;
  }

  const networkUpdate = fetch(event.request)
    .then(async (response) => {
      if (response.ok) {
        const cache = await caches.open(CACHE_NAME);
        await cache.put(url.pathname, response.clone());
      }
      return response;
    })
    .catch(() => null);

  event.waitUntil(networkUpdate);
  event.respondWith((async () => {
    const cached = await caches.match(url.pathname);
    return cached || (await networkUpdate) || Response.error();
  })());
});
