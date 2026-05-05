// Zmiana nazwy cache wymusza pobranie odświeżonych styli mobilnych po aktualizacji PWA.
const CACHE_NAME = 'pam-wiki-v4';
const ASSETS_TO_CACHE = [
    './',
    './index.html',
    './styles.css',
    './pam-wiki.js',
    './pam-files.js',
    './quiz-module.js',
    './dev-mode.js',
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

self.addEventListener('push', event => {
    const data = event.data ? event.data.json() : {};
    const title = data.title || 'PAM WIKI';
    const options = {
        body: data.body || '',
        icon: './assets/icon-192.png',
        badge: './assets/icon-192.png',
        data: { url: data.url || './' }
    };
    event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener('notificationclick', event => {
    const targetUrl = (event.notification.data && event.notification.data.url) || './';
    event.notification.close();
    event.waitUntil(
        clients.matchAll({ type: 'window', includeUncontrolled: true }).then(list => {
            // Try to focus an existing window that is showing the app
            for (const c of list) {
                if (c.url.includes('index.html') || c.url.endsWith('/')) {
                    if ('focus' in c) return c.focus();
                }
            }
            return clients.openWindow(targetUrl);
        })
    );
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
