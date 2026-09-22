const CACHE_NAME = 'adhan-display-v2-shell-logo-shahada-qibla-tafsir-3';

const APP_SHELL = [
    '/',
    '/index.html',
    '/manifest.json',
    '/css/core.css',
    '/css/layout.css',
    '/css/components.css',
    '/css/pages.css',
    '/css/responsive.css',
    '/css/quran.css',
    '/css/theme.css',
    '/js/app.js',
    '/js/state.js',
    '/js/router.js',
    '/js/storage.js',
    '/js/config.js'
];

self.addEventListener('install', event => {
    event.waitUntil(
        caches
            .open(CACHE_NAME)
            .then(cache => cache.addAll(APP_SHELL))
            .then(() => self.skipWaiting())
    );
});

self.addEventListener('activate', event => {
    event.waitUntil(
        caches
            .keys()
            .then(keys =>
                Promise.all(
                    keys
                        .filter(
                            key =>
                                key !== CACHE_NAME
                        )
                        .map(key =>
                            caches.delete(key)
                        )
                )
            )
            .then(() => self.clients.claim())
    );
});

self.addEventListener('fetch', event => {
    const request = event.request;

    if (request.method !== 'GET') {
        return;
    }

    const url = new URL(request.url);

    if (url.origin !== self.location.origin) {
        return;
    }

    event.respondWith(
        caches.match(request)
            .then(cached => {

                if (cached) {
                    return cached;
                }

                return fetch(request)
                    .then(response => {

                        if (
                            !response ||
                            response.status !== 200 ||
                            response.type !== 'basic'
                        ) {
                            return response;
                        }

                        const copy =
                            response.clone();

                        caches
                            .open(CACHE_NAME)
                            .then(cache =>
                                cache.put(
                                    request,
                                    copy
                                )
                            );

                        return response;
                    })
                    .catch(() =>
                        caches.match(
                            '/index.html'
                        )
                    );
            })
    );
});


