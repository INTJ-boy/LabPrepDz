/* LabPrep DZ — Service Worker
   Caches the app shell for offline use. Bump CACHE_NAME on every
   deploy so returning visitors get the new version instead of a
   stale cached one. */

const CACHE_NAME = 'labprepdz-v2';

const APP_SHELL = [
  'index.html',
  'styles.css',
  'app.js',
  'manifest.json'
];

// External assets — cached on first successful fetch (best-effort;
// if the network is unavailable on first visit, these simply won't
// be cached yet, and the page will still work using the app shell).
const EXTERNAL_ASSETS = [
  'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css',
  'https://fonts.googleapis.com/css2?family=Cairo:wght@400;600;700;900&family=Inter:wght@300;400;500;600;700&display=swap'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      // Cache the app shell first — this must succeed for the SW to install.
      return cache.addAll(APP_SHELL).then(() => {
        // Best-effort cache of external assets — don't fail install if these error.
        return Promise.all(
          EXTERNAL_ASSETS.map((url) =>
            cache.add(url).catch(() => {})
          )
        );
      });
    })
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  // Remove old versioned caches so updates actually take effect.
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))
      )
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  // Network-first for navigation requests (so users get fresh content
  // when online), falling back to cache when offline.
  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request).catch(() => caches.match('index.html'))
    );
    return;
  }

  // Cache-first for everything else (styles, scripts, fonts, icons) —
  // fast repeat loads, falls back to network if not cached yet.
  event.respondWith(
    caches.match(event.request).then((cached) => {
      if (cached) return cached;
      return fetch(event.request).then((response) => {
        // Cache successful same-origin or known external responses for next time.
        if (response && response.status === 200) {
          const responseClone = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(event.request, responseClone));
        }
        return response;
      }).catch(() => {
        // Both cache and network failed — nothing more we can do for this asset.
        return new Response('', { status: 504, statusText: 'Offline' });
      });
    })
  );
});
