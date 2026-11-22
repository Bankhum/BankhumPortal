const CACHE = 'bankhum-portal-v58';
const ASSETS = [
  './?v=58',
  './index.html?v=58',
  './style.css?v=58',
  './app.js?v=58',
  './config.js?v=58',
  './menu.js?v=58',
  './logo-bankhum.png',
  './facebook-logo.jpg',
  './youtube-logo.jpg',
  './tiktok-logo.png',
  './line-logo.png',
  './icon-192.png?v=58',
  './icon-512.png?v=58',
  './favicon-32.png?v=58',
  './manifest.webmanifest?v=58'
];

self.addEventListener('install', event => {
  event.waitUntil(caches.open(CACHE).then(cache => cache.addAll(ASSETS)));
  self.skipWaiting();
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
  );
  self.clients.claim();
});

self.addEventListener('fetch', event => {
  if (event.request.method !== 'GET') return;
  const url = new URL(event.request.url);
  if (url.origin !== self.location.origin) return;

  event.respondWith(
    fetch(event.request, { cache: 'no-store' })
      .then(response => {
        if (response && response.ok) {
          const copy = response.clone();
          caches.open(CACHE).then(cache => cache.put(event.request, copy));
        }
        return response;
      })
      .catch(() => caches.match(event.request).then(r => r || caches.match('./?v=58')))
  );
});
