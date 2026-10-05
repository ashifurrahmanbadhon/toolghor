/* ToolGhor Service Worker for Instant Loading & Offline Support */
const CACHE_NAME = 'toolghor-v1';
const CORE_ASSETS = [
  './',
  'index.html',
  'bn/index.html',
  'manifest.json',
  'assets/style.css',
  'assets/config.js',
  'assets/registry.js',
  'assets/icons.js',
  'assets/ui.js',
  'assets/site.js',
  'assets/logo.png',
  'assets/logo-dark.png',
  'assets/logo.webp',
  'assets/logo-dark.webp',
  'assets/logo-icon.png',
  'assets/favicon.png',
  'assets/apple-touch-icon.png'
];

// Install: pre-cache core shell
self.addEventListener('install', (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(CORE_ASSETS).catch((err) => {
        if (self.console) console.warn('[SW] Core asset precache skipped for some resources:', err);
      });
    })
  );
});

// Activate: clean old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))
      );
    }).then(() => self.clients.claim())
  );
});

// Fetch strategy
self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET') return;

  const url = new URL(req.url);

  // Google Fonts caching (Stale-While-Revalidate)
  if (url.origin === 'https://fonts.googleapis.com' || url.origin === 'https://fonts.gstatic.com') {
    event.respondWith(
      caches.open(CACHE_NAME).then(async (cache) => {
        const cached = await cache.match(req);
        const fetchPromise = fetch(req).then((networkRes) => {
          if (networkRes.ok) cache.put(req, networkRes.clone());
          return networkRes;
        }).catch(() => cached);
        return cached || fetchPromise;
      })
    );
    return;
  }

  // Same-origin assets: Static files (CSS, JS, Images, Icons) -> Cache-First with background revalidation
  if (url.origin === self.location.origin) {
    // HTML navigation requests -> Network-First, fallback to Cache
    if (req.mode === 'navigate' || req.headers.get('accept')?.includes('text/html')) {
      event.respondWith(
        fetch(req).then((networkRes) => {
          if (networkRes.ok) {
            const clone = networkRes.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(req, clone));
          }
          return networkRes;
        }).catch(async () => {
          const cached = await caches.match(req);
          if (cached) return cached;
          return caches.match('index.html');
        })
      );
      return;
    }

    // Static assets (CSS, JS, Fonts, Images)
    event.respondWith(
      caches.match(req).then((cached) => {
        if (cached) {
          // Revalidate in background
          fetch(req).then((networkRes) => {
            if (networkRes.ok) {
              caches.open(CACHE_NAME).then((cache) => cache.put(req, networkRes));
            }
          }).catch(() => {});
          return cached;
        }
        return fetch(req).then((networkRes) => {
          if (networkRes.ok && (url.pathname.includes('/assets/') || url.pathname.endsWith('.html'))) {
            const clone = networkRes.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(req, clone));
          }
          return networkRes;
        });
      })
    );
  }
});
