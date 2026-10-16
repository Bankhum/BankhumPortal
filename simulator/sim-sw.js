// Ban Khum Simulator: service worker เล็ก ๆ เพื่อให้ติดตั้งเป็นแอปได้ (ไม่เก็บแคช โหลดใหม่ทุกครั้ง)
self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', e => e.waitUntil(self.clients.claim()));
self.addEventListener('fetch', () => {});
