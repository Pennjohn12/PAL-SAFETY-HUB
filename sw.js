// PAL Safety Hub Service Worker
// Keeps the app usable offline, while always preferring fresh pages when online.

const CACHE_NAME = 'pal-safety-hub-v2026-07-22-1';
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

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(ASSETS).catch(() => undefined))
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

function isHtmlRequest(request) {
  const requestUrl = new URL(request.url);
  const acceptHeader = request.headers.get('accept') || '';
  return request.mode === 'navigate' ||
    acceptHeader.includes('text/html') ||
    requestUrl.pathname === '/' ||
    requestUrl.pathname.endsWith('.html');
}

// HTML/pages: network first, cache only as an offline backup.
// Static files/images: network first, cached only as an offline backup.
self.addEventListener('fetch', event => {
  const requestUrl = new URL(event.request.url);
  if (event.request.method !== 'GET' || requestUrl.origin !== self.location.origin) {
    return;
  }

  if (isHtmlRequest(event.request)) {
    event.respondWith(
      fetch(event.request, { cache: 'no-store' })
        .then(response => {
          if (response && response.status === 200 && response.type === 'basic') {
            const clone = response.clone();
            caches.open(CACHE_NAME).then(cache => cache.put(event.request, clone));
          }
          return response;
        })
        .catch(() => caches.match(event.request).then(cached => cached || caches.match('./index.html')))
    );
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
