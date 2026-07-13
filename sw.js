const CACHE_NAME = 'plum-divination-v12';
const ASSETS = [
  './',
  './index.html',
  './manifest.json',
  './icon-192.png',
  './icon-512.png',
  './shaoyong_plum.jpg',
  './邵康節.png',
  // CDN resources
  'https://fonts.googleapis.com/css2?family=Noto+Serif+TC:wght@400;600;900&family=Outfit:wght@300;400;500;700&display=swap',
  'https://unpkg.com/react@18/umd/react.production.min.js',
  'https://unpkg.com/react-dom@18/umd/react-dom.production.min.js',
  'https://unpkg.com/@babel/standalone@7/babel.min.js',
  'https://cdn.tailwindcss.com',
  'https://cdn.jsdelivr.net/npm/cnchar/cnchar.min.js',
  'https://cdn.jsdelivr.net/npm/cnchar-trad/cnchar.trad.min.js'
];

// Install Event - Pre-cache all core assets
self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('[Service Worker] Caching static assets & CDNs');
      return cache.addAll(ASSETS);
    }).then(() => self.skipWaiting())
  );
});

// Activate Event - Clean up old version caches
self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) {
            console.log('[Service Worker] Removing old cache:', key);
            return caches.delete(key);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// Fetch Event - Cache-First Strategy with Live API Bypass
self.addEventListener('fetch', (e) => {
  // Only handle standard HTTP/HTTPS schemes
  if (!e.request.url.startsWith('http')) return;

  // Bypass cache for Gemini AI APIs
  if (e.request.url.includes('generativelanguage.googleapis.com')) {
    e.respondWith(fetch(e.request));
    return;
  }

  e.respondWith(
    caches.match(e.request).then((cachedResponse) => {
      if (cachedResponse) {
        return cachedResponse;
      }
      return fetch(e.request).then((networkResponse) => {
        // Only dynamically cache Google Font binary files (.woff2) to prevent cache poisoning
        if (networkResponse.status === 200 && e.request.url.includes('fonts.gstatic.com')) {
          const responseToCache = networkResponse.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(e.request, responseToCache);
          });
        }
        return networkResponse;
      });
    }).catch(() => {
      // Silent fail for network errors
    })
  );
});
