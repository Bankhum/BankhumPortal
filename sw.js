const CACHE = 'bankhum-portal-v11';
const ASSETS = [
  './?v=11',
  './index.html?v=11',
  './style.css?v=11',
  './app.js?v=11',
  './logo-bankhum.png',
  './facebook-logo.jpg',
  './youtube-logo.jpg',
  './tiktok-logo.png',
  './line-logo.png',
  './icon-192.png?v=11',
  './icon-512.png?v=11',
  './favicon-32.png?v=11',
  './manifest.webmanifest?v=11'
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
      .catch(() => caches.match(event.request).then(r => r || caches.match('./?v=11')))
  );
});
