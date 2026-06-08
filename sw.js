// PAL Safety Hub — Service Worker
// Caches the app so it works offline after first load

const CACHE_NAME = 'pal-safety-hub-v2';
const ASSETS = [
  './',
  './index.html',
  './projects.html',
  './manifest.json',
  './icon-192.png',
  './icon-512.png',
  './pal-carousel-1.jpg',
  './pal-carousel-2.jpg',
  './pal-carousel-3.jpg',
  './pal-carousel-4.jpg'
];
const CACHE_PATHS = new Set(ASSETS.map(asset => new URL(asset, self.location.href).pathname));

// Install: cache all core files
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(ASSETS))
  );
  self.skipWaiting();
});

// Activate: clean up old caches
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))
    )
  );
  self.clients.claim();
});

// Fetch: serve from cache, fall back to network
// Network-first strategy so updates are always picked up when online
self.addEventListener('fetch', event => {
  const requestUrl = new URL(event.request.url);
  if (event.request.method !== 'GET' || requestUrl.origin !== self.location.origin) {
    return;
  }
  if (!CACHE_PATHS.has(requestUrl.pathname)) {
    return;
  }
  event.respondWith(
    fetch(event.request)
      .then(response => {
        // If we got a good response, cache it and return it
        if (response && response.status === 200 && response.type === 'basic') {
          const clone = response.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(event.request, clone));
        }
        return response;
      })
      .catch(() => {
        // Offline — serve from cache
        return caches.match(event.request);
      })
  );
});
