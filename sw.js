const CACHE = 'bankhum-portal-v52';
const ASSETS = [
  './?v=52',
  './index.html?v=52',
  './style.css?v=52',
  './app.js?v=52',
  './config.js?v=52',
  './menu.js?v=52',
  './logo-bankhum.png',
  './facebook-logo.jpg',
  './youtube-logo.jpg',
  './tiktok-logo.png',
  './line-logo.png',
  './icon-192.png?v=52',
  './icon-512.png?v=52',
  './favicon-32.png?v=52',
  './manifest.webmanifest?v=52'
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
      .catch(() => caches.match(event.request).then(r => r || caches.match('./?v=52')))
  );
});
