// Service Worker for SSI Income Tracker PWA

const CACHE_NAME = 'ssi-income-tracker-v1';
const ASSETS = [
  './',
  './index.html',
  './css/styles.css',
  './css/auth.css',
  './js/app.js',
  './js/db.js',
  './js/indexedDB.js',
  './js/firestore.js',
  './js/realtimeDB.js',
  './js/storageManager.js',
  './js/ui.js',
  './js/auth.js',
  './js/dbTest.js',
  './manifest.json',
  'https://fonts.googleapis.com/css2?family=Roboto:wght@300;400;500&display=swap',
  'https://fonts.googleapis.com/icon?family=Material+Icons',
  'https://cdn.jsdelivr.net/npm/chart.js',
  'https://cdn.jsdelivr.net/npm/idb@7/build/umd.js',
  'https://www.gstatic.com/firebasejs/9.6.0/firebase-app-compat.js',
  'https://www.gstatic.com/firebasejs/9.6.0/firebase-auth-compat.js',
  'https://www.gstatic.com/firebasejs/9.6.0/firebase-firestore-compat.js',
  'https://www.gstatic.com/firebasejs/9.6.0/firebase-database-compat.js'
];

// Install event - cache assets
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('Caching app assets');
        return cache.addAll(ASSETS);
      })
      .then(() => self.skipWaiting())
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.filter(cacheName => {
          return cacheName !== CACHE_NAME;
        }).map(cacheName => {
          console.log('Deleting old cache:', cacheName);
          return caches.delete(cacheName);
        })
      );
    }).then(() => self.clients.claim())
  );
});

// Fetch event - serve from cache, fall back to network
self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request)
      .then(response => {
        // Return cached response if found
        if (response) {
          return response;
        }

        // Clone the request
        const fetchRequest = event.request.clone();

        // Make network request and cache the response
        return fetch(fetchRequest).then(response => {
          // Check if valid response
          if (!response || response.status !== 200 || response.type !== 'basic') {
            return response;
          }

          // Clone the response
          const responseToCache = response.clone();

          // Open cache and store response
          caches.open(CACHE_NAME)
            .then(cache => {
              cache.put(event.request, responseToCache);
            });

          return response;
        });
      })
      .catch(() => {
        // Fallback for offline experience
        if (event.request.url.indexOf('.html') > -1) {
          return caches.match('/index.html');
        }
      })
  );
});