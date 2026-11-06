// ToolGhor Service Worker — PWA Caching & Offline Support
// Version: 20261106_v57

const CACHE_NAME = 'toolghor-20261106_v57';

const PRECACHE_URLS = [
  '/offline',
  '/manifest.webmanifest',
  '/icon-192.png',
  '/icon-512.png',
  '/icon-maskable-512.png',
  '/favicon.ico',
  '/assets/favicon.png',
  '/assets/apple-touch-icon.png',
];

// Install: precache offline fallback and essential icons
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches
      .open(CACHE_NAME)
      .then((cache) => cache.addAll(PRECACHE_URLS))
      .then(() => self.skipWaiting())
  );
});

// Activate: clean up older version caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys.map((key) => {
            if (key !== CACHE_NAME) {
              return caches.delete(key);
            }
          })
        )
      )
      .then(() => self.clients.claim())
  );
});

// Fetch: enforce strict routing rules
self.addEventListener('fetch', (event) => {
  const req = event.request;

  // Only GET requests are candidates for caching
  if (req.method !== 'GET') {
    return;
  }

  const url = new URL(req.url);

  // Cross-origin requests: bypass SW completely
  if (url.origin !== self.location.origin) {
    return;
  }

  // STRICT NETWORK-ONLY: NEVER intercept or cache /api/*, /admin, /api/version
  // Admin and API responses must always be live — a cached admin or API response is a failure.
  if (
    url.pathname.startsWith('/api/') ||
    url.pathname === '/api' ||
    url.pathname.startsWith('/admin') ||
    url.pathname === '/admin' ||
    url.pathname === '/api/version'
  ) {
    return;
  }

  // 1. Cache-first: static assets only — /assets/* (tool JS/CSS), the icon files, fonts.
  const isStaticAsset =
    url.pathname.startsWith('/assets/') ||
    url.pathname.startsWith('/_next/static/') ||
    url.pathname.endsWith('.png') ||
    url.pathname.endsWith('.jpg') ||
    url.pathname.endsWith('.jpeg') ||
    url.pathname.endsWith('.webp') ||
    url.pathname.endsWith('.ico') ||
    url.pathname.endsWith('.svg') ||
    url.pathname.endsWith('.woff') ||
    url.pathname.endsWith('.woff2') ||
    url.pathname.endsWith('.ttf') ||
    url.pathname === '/manifest.webmanifest';

  if (isStaticAsset) {
    event.respondWith(
      caches.match(req).then((cached) => {
        if (cached) {
          return cached;
        }
        return fetch(req).then((response) => {
          if (response && response.status === 200 && response.type === 'basic') {
            const copy = response.clone();
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(req, copy);
            });
          }
          return response;
        });
      })
    );
    return;
  }

  // 2. Network-first with cache fallback: page navigations (HTML).
  // Offline navigation fallback -> /offline.
  if (req.mode === 'navigate' || req.destination === 'document') {
    event.respondWith(
      fetch(req)
        .then((response) => {
          if (response && response.status === 200) {
            const copy = response.clone();
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(req, copy);
            });
          }
          return response;
        })
        .catch(async () => {
          // Check if visited page is in cache
          const cached = await caches.match(req);
          if (cached) {
            return cached;
          }
          // Fallback to /offline page
          const offlinePage = await caches.match('/offline');
          if (offlinePage) {
            return offlinePage;
          }
          return new Response('Offline', {
            status: 503,
            headers: { 'Content-Type': 'text/plain' },
          });
        })
    );
    return;
  }
});

