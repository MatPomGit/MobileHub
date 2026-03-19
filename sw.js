const CACHE_NAME = 'pam-wiki-v1';
const ASSETS_TO_CACHE = [
    './',
    './index.html',
    './pam-wiki.js',
    './pam-files.js',
    './assets/favicon.ico',
    './assets/ico3.png',
    './assets/icon-192.png',
    './assets/icon-512.png',
    './assets/background_4.jpg'
];

self.addEventListener('install', event => {
    event.waitUntil(
        caches.open(CACHE_NAME).then(cache => cache.addAll(ASSETS_TO_CACHE))
    );
    self.skipWaiting();
});

self.addEventListener('activate', event => {
    event.waitUntil(
        caches.keys().then(keys =>
            Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))
        )
    );
    self.clients.claim();
});

self.addEventListener('fetch', event => {
    event.respondWith(
        caches.match(event.request).then(cached => {
            const fetchPromise = fetch(event.request).then(response => {
                if (response && response.status === 200 && response.type === 'basic') {
                    const clone = response.clone();
                    caches.open(CACHE_NAME).then(cache => cache.put(event.request, clone));
                }
                return response;
            }).catch(err => {
                if (!cached) {
                    console.warn('[SW] Network request failed, no cache for:', event.request.url);
                }
                return cached;
            });
            return cached || fetchPromise;
        })
    );
});
