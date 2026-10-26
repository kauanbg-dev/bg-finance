const CACHE = 'bg-finance-v93';
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
    event.respondWith(
      fetch(request, { cache: 'no-store', redirect: 'follow' })
        .then((response) => {
          if (isApp && (!response.ok || new URL(response.url).pathname.endsWith('login.html'))) {
            return caches.match('/login.html').then((cached) => cached || response);
          }
          return response;
        })
        .catch(() => caches.match('/login.html'))
    );
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
