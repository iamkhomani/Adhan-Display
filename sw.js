const VERSION = 'v3';
const CACHE_STATIC = `adhan-static-${VERSION}`;
const CACHE_DYNAMIC = `adhan-dynamic-${VERSION}`;
const CACHE_API = `adhan-api-${VERSION}`;

// Core assets required for the app to function offline
const ASSETS_TO_CACHE = [
  '/',
  '/index.html',
  '/manifest.json',
  '/images/adhan display muslim prayer times dashboard logo.png',
  '/images/adhan display muslim prayer times dashboard background.jpg',
  '/images/background-white.jpg',
  '/images/background-green.png',
  '/audio/chime.mp3',
  '/audio/adhan.mp3',
  '/audio/makkah.mp3',
  '/audio/madinah.mp3',
  '/audio/alafasy.mp3',
  'https://cdn.jsdelivr.net/npm/canvas-confetti@1.6.0/dist/confetti.browser.min.js'
];

// Install Event: Pre-cache static assets
self.addEventListener('install', (event) => {
  self.skipWaiting(); // Force the waiting service worker to become the active service worker.
  event.waitUntil(
    caches.open(CACHE_STATIC).then((cache) => {
      console.log('[Service Worker] Pre-caching static assets');
      return cache.addAll(ASSETS_TO_CACHE);
    })
  );
});

// Activate Event: Clean up old cache buckets
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (![CACHE_STATIC, CACHE_DYNAMIC, CACHE_API].includes(cacheName)) {
            console.log('[Service Worker] Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// Fetch Event: Advanced Routing Strategy
self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);

  // 1. API Requests -> Network First, Fallback to Cache
  if (url.origin.includes('api.aladhan.com') || url.origin.includes('api.open-meteo.com') || url.origin.includes('api.alquran.cloud')) {
    event.respondWith(
      fetch(event.request)
        .then((networkResponse) => {
          const clonedResponse = networkResponse.clone();
          caches.open(CACHE_API).then((cache) => cache.put(event.request, clonedResponse));
          return networkResponse;
        })
        .catch(() => caches.match(event.request))
    );
    return;
  }

  // 2. Google Fonts -> Cache First, Fallback to Network (Stale-While-Revalidate)
  if (url.origin.includes('fonts.googleapis.com') || url.origin.includes('fonts.gstatic.com')) {
    event.respondWith(
      caches.match(event.request).then((cachedResponse) => {
        const fetchPromise = fetch(event.request).then((networkResponse) => {
          caches.open(CACHE_STATIC).then((cache) => cache.put(event.request, networkResponse.clone()));
          return networkResponse;
        }).catch(() => console.log('[Service Worker] Font fetch failed offline'));
        
        return cachedResponse || fetchPromise;
      })
    );
    return;
  }

  // 3. Static & Local Assets -> Cache First, Fallback to Network + Dynamic Caching
  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      if (cachedResponse) {
        return cachedResponse;
      }

      return fetch(event.request).then((networkResponse) => {
        // Ensure the response is valid before dynamic caching
        if (!networkResponse || networkResponse.status !== 200 || networkResponse.type !== 'basic') {
          return networkResponse;
        }

        const responseToCache = networkResponse.clone();
        caches.open(CACHE_DYNAMIC).then((cache) => cache.put(event.request, responseToCache));
        return networkResponse;
      }).catch(() => {
        // Offline Fallback for HTML Navigation
        if (event.request.mode === 'navigate') {
          return caches.match('/index.html');
        }
      });
    })
  );
});

// Handling Push Notifications
self.addEventListener('push', (event) => {
  let data = { title: "Adhan Display", body: "Notification", url: "/" };
  
  if (event.data) {
    try { data = event.data.json(); } catch(e) { data.body = event.data.text(); }
  }
  
  const options = {
    body: data.body,
    icon: 'images/adhan display muslim prayer times dashboard logo.png',
    badge: 'images/adhan display muslim prayer times dashboard logo.png',
    vibrate: [200, 100, 200],
    data: { url: data.url }
  };

  event.waitUntil(self.registration.showNotification(data.title, options));
});

// Notification Click Behavior
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((windowClients) => {
      // Focus existing app window if already open
      if (windowClients.length > 0) {
        let client = windowClients[0];
        client.focus();
        if (event.notification.data && event.notification.data.url) {
             client.navigate(event.notification.data.url);
        }
      } else {
        // Open new window if app is fully closed
        clients.openWindow(event.notification.data && event.notification.data.url ? event.notification.data.url : '/');
      }
    })
  );
});
