// PAL Safety Hub Service Worker
// Caches the app so it works offline after first load.

const CACHE_NAME = 'pal-safety-hub-v5';
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

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(ASSETS))
  );
  self.skipWaiting();
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))
    )
  );
  self.clients.claim();
});

// Use fresh pages when online, cached pages only when offline.
self.addEventListener('fetch', event => {
  const requestUrl = new URL(event.request.url);
  if (event.request.method !== 'GET' || requestUrl.origin !== self.location.origin) {
    return;
  }
  if (!CACHE_PATHS.has(requestUrl.pathname)) {
    return;
  }
  event.respondWith(
    fetch(event.request, { cache: 'no-store' })
      .then(response => {
        if (response && response.status === 200 && response.type === 'basic') {
          const clone = response.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(event.request, clone));
        }
        return response;
      })
      .catch(() => caches.match(event.request))
  );
});
