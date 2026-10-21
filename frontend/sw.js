const CACHE = 'bg-finance-v61';
const SHELL = [
  '/',
  '/index.html',
  '/login.html',
  '/style.css',
  '/script.js',
  '/theme.js',
  '/theme-boot.js',
  '/logo.png',
  '/icon-192.png',
];

self.addEventListener('install', (event) => {
  event.waitUntil(caches.open(CACHE).then((cache) => cache.addAll(SHELL)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((key) => key !== CACHE).map((key) => caches.delete(key))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  const { request } = event;
  if (request.method !== 'GET') return;

  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;
  const asset = url.pathname === '/' || /\.(html|js|css|png|webp|webmanifest|svg|ico)$/i.test(url.pathname);
  if (!asset) return;

  const isPage = url.pathname === '/' || url.pathname.endsWith('.html') || url.pathname.endsWith('sw.js');
  if (isPage) {
    event.respondWith(
      fetch(request)
        .then((response) => {
          if (response.ok) caches.open(CACHE).then((cache) => cache.put(request, response.clone()));
          return response;
        })
        .catch(() => caches.match(request).then((cached) => cached || caches.match('/index.html')))
    );
    return;
  }

  event.respondWith(
    caches.match(request).then((cached) => {
      const fresh = fetch(request).then((response) => {
        if (response.ok) caches.open(CACHE).then((cache) => cache.put(request, response.clone()));
        return response;
      });
      return cached || fresh;
    })
  );
});
