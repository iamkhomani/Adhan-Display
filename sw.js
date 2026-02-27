const CACHE_NAME = 'adhan-display-v2';

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
  'https://cdn.jsdelivr.net/npm/canvas-confetti@1.6.0/dist/confetti.browser.min.js',
  'https://fonts.googleapis.com/css2?family=Cinzel:wght@600;800&display=swap'
];

// Install event: cache all static assets
self.addEventListener('install', (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('Opened cache');
      return cache.addAll(ASSETS_TO_CACHE);
    })
  );
});

// Activate event: cleanup old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// Fetch event: Network-first for APIs, Cache-first for static assets
self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);

  // For API calls (AlAdhan, OpenMeteo, Quran), try network first, fallback to cache
  if (url.origin === 'https://api.aladhan.com' || url.origin === 'https://api.open-meteo.com' || url.origin === 'https://api.alquran.cloud') {
    event.respondWith(
      fetch(event.request)
        .then((networkResponse) => {
          return caches.open('adhan-api-cache').then((cache) => {
            cache.put(event.request, networkResponse.clone());
            return networkResponse;
          });
        })
        .catch(() => caches.match(event.request))
    );
  } else {
    // For local assets, try cache first, fallback to network
    event.respondWith(
      caches.match(event.request).then((response) => {
        return response || fetch(event.request).then((networkResponse) => {
            // Optional: cache new non-API requests dynamically
            return networkResponse;
        });
      })
    );
  }
});

// Handling Push Notifications
self.addEventListener('push', (event) => {
  let data = { title: "Adhan Display", body: "Notification", url: "/" };
  if (event.data) {
    data = event.data.json();
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
      if (windowClients.length > 0) {
        let client = windowClients[0];
        client.focus();
        if (event.notification.data && event.notification.data.url) {
             client.navigate(event.notification.data.url);
        }
      } else {
        clients.openWindow(event.notification.data && event.notification.data.url ? event.notification.data.url : '/');
      }
    })
  );
});