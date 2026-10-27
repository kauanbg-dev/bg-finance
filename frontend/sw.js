const CACHE = 'bg-finance-v94';
const SHELL = [
  '/login.html',
  '/logo.png',
  '/icon-192.png',
  '/icon-512.png',
  '/apple-touch-icon.png',
  '/favicon.ico',
];

self.addEventListener('install', (event) => {
  event.waitUntil(caches.open(CACHE).then((cache) => cache.addAll(SHELL)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.map((key) => caches.delete(key))))
      .then(() => caches.open(CACHE).then((cache) => cache.addAll(SHELL)))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  const { request } = event;
  if (request.method !== 'GET') return;

  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;
  const isApp = url.pathname === '/' || url.pathname.endsWith('/index.html');
  const isPage = isApp || url.pathname.endsWith('.html') || url.pathname.endsWith('sw.js');
  if (isPage) {
    event.respondWith((async () => {
      const load = () => fetch(request, { cache: 'no-store', redirect: 'follow' });
      let response;
      try {
        response = await load();
        if (isApp && (!response.ok || response.status >= 500)) {
          await new Promise((done) => setTimeout(done, 1200));
          response = await load();
        }
      } catch {
        try {
          await new Promise((done) => setTimeout(done, 1500));
          response = await load();
        } catch {
          return (isApp ? null : await caches.match('/login.html')) || Response.error();
        }
      }
      return response;
    })());
    return;
  }

  const asset = /\.(js|css|png|webp|webmanifest|svg|ico)$/i.test(url.pathname);
  if (!asset) return;

  event.respondWith(
    caches.match(request).then((cached) => {
      if (cached) return cached;
      return fetch(request).then((response) => {
        if (response.ok) caches.open(CACHE).then((cache) => cache.put(request, response.clone()));
        return response;
      });
    })
  );
});
