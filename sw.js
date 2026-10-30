/*
 * Adhan Display service worker.
 *
 * - App files: network first, so updates arrive immediately; the cached
 *   copy is used when offline.
 * - Fonts and images: cache first.
 * - Audio is left to the browser (range requests), API data is cached by
 *   the app itself.
 *
 * Bump VERSION when files are added or removed.
 */

const VERSION = 'adhan-display-5.0.0';

const SHELL = [
    './',
    'index.html',
    'manifest.json',
    'css/app.css',
    'js/app.js',
    'js/app-info.js',
    'js/core/bus.js',
    'js/core/icons.js',
    'js/core/storage.js',
    'js/core/time.js',
    'js/core/ui.js',
    'js/core/util.js',
    'js/data/content.js',
    'js/pages/components.js',
    'js/pages/display.js',
    'js/pages/hadith.js',
    'js/pages/home.js',
    'js/pages/islamic.js',
    'js/pages/prayer.js',
    'js/pages/quran.js',
    'js/pages/settings.js',
    'js/services/alerts.js',
    'js/services/api.js',
    'js/services/location.js',
    'js/services/prayer.js',
    'js/services/quran.js',
    'js/services/tracker.js',
    'fonts/manrope.woff2',
    'fonts/marcellus.woff2',
    'fonts/amiri-quran.woff2',
    'images/icons/logo-96.png',
    'images/icons/icon-192.png',
    'images/icons/favicon-32.png'
];

self.addEventListener('install', event => {
    event.waitUntil(
        caches.open(VERSION)
            .then(cache => cache.addAll(SHELL.map(path => new Request(path, { cache: 'reload' }))))
            .then(() => self.skipWaiting())
    );
});

self.addEventListener('activate', event => {
    event.waitUntil(
        caches.keys()
            .then(keys => Promise.all(keys.filter(key => key !== VERSION).map(key => caches.delete(key))))
            .then(() => self.clients.claim())
    );
});

async function networkFirst(request) {
    const cache = await caches.open(VERSION);

    try {
        const response = await fetch(request);
        if (response.ok && response.type === 'basic') {
            cache.put(request, response.clone());
        }
        return response;
    } catch (error) {
        const cached = await cache.match(request, { ignoreSearch: true });
        if (cached) {
            return cached;
        }
        if (request.mode === 'navigate') {
            return cache.match('index.html');
        }
        throw error;
    }
}

async function cacheFirst(request) {
    const cache = await caches.open(VERSION);
    const cached = await cache.match(request);

    if (cached) {
        return cached;
    }

    const response = await fetch(request);
    if (response.ok && response.type === 'basic') {
        cache.put(request, response.clone());
    }
    return response;
}

self.addEventListener('fetch', event => {
    const request = event.request;

    if (request.method !== 'GET') {
        return;
    }

    const url = new URL(request.url);

    if (url.origin !== self.location.origin || url.pathname.endsWith('.mp3') || request.headers.has('range')) {
        return;
    }

    if (/\.(woff2|png|jpg|jpeg|webp|svg|ico)$/.test(url.pathname)) {
        event.respondWith(cacheFirst(request));
        return;
    }

    event.respondWith(networkFirst(request));
});

self.addEventListener('notificationclick', event => {
    event.notification.close();
    event.waitUntil(
        self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then(clients => {
            const client = clients.find(item => 'focus' in item);
            return client ? client.focus() : self.clients.openWindow('./');
        })
    );
});
