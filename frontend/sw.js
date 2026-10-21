const CACHE = 'bg-finance-v63';
const SHELL = [
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

  const isApp = url.pathname === '/' || url.pathname.endsWith('/index.html');
  const isPage = isApp || url.pathname.endsWith('.html') || url.pathname.endsWith('sw.js');
  if (isPage) {
    event.respondWith(
      fetch(request, { cache: 'no-store' })
        .then((response) => {
          if (response.ok && !isApp) caches.open(CACHE).then((cache) => cache.put(request, response.clone()));
          return response;
        })
        .catch(() => {
          if (isApp) return caches.match('/login.html');
          return caches.match(request).then((cached) => cached || caches.match('/login.html'));
        })
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
