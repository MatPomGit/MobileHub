// Hash builda powinien być wstrzykiwany podczas procesu CI/CD (np. przez query param `sw.js?v=<hash>`).
// Dzięki temu zmiana buildu automatycznie tworzy nowy cache bez ręcznej edycji wersji.
const BUILD_HASH = new URL(self.location.href).searchParams.get('v') || 'dev';
const CACHE_NAME = `app-cache-${BUILD_HASH}`;

// Zasoby wymagające szybkiej dostępności po instalacji SW.
const ASSETS_TO_CACHE = [
    './',
    './index.html',
    './offline.html',
    './styles.css',
    './pam-wiki.js',
    './quiz-module.js',
    './dev-mode.js',
    './pam-wiki-config.json',
    './assets/favicon.ico',
    './assets/ico3.png',
    './assets/icon-192.png',
    './assets/icon-512.png',
    // Tło ekranu głównego dodane do precache, aby było dostępne natychmiast także offline.
    './assets/background_4.jpg'
];

const NETWORK_FIRST_PATHS = new Set(['/index.html', '/pam-wiki-config.json']);
const STALE_WHILE_REVALIDATE_PATHS = new Set(['/styles.css', '/pam-wiki.js', '/quiz-module.js', '/dev-mode.js']);

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
            for (const c of list) {
                if (c.url.includes('index.html') || c.url.endsWith('/')) {
                    if ('focus' in c) return c.focus();
                }
            }
            return clients.openWindow(targetUrl);
        })
    );
});

function canHandleRequest(request) {
    const url = new URL(request.url);
    return request.method === 'GET' && (url.protocol === 'http:' || url.protocol === 'https:');
}

function isCacheableResponse(response) {
    // Cache'ujemy wyłącznie odpowiedzi jawnie czytelne (basic) i poprawne HTTP,
    // aby uniknąć niekontrolowanego magazynowania opaque (cross-origin bez CORS).
    return response && response.ok && response.type === 'basic';
}

function toPathname(url) {
    return new URL(url).pathname;
}

async function networkFirst(request) {
    const cache = await caches.open(CACHE_NAME);
    try {
        const response = await fetch(request);
        if (isCacheableResponse(response)) {
            await cache.put(request, response.clone());
        }
        return response;
    } catch {
        const cached = await cache.match(request);
        if (cached) return cached;

        // Dla nawigacji zwracamy dedykowaną stronę offline zamiast pustej odpowiedzi.
        if (request.mode === 'navigate') {
            return cache.match('./offline.html');
        }
        return new Response('Offline: zasób jest chwilowo niedostępny.', {
            status: 503,
            headers: { 'Content-Type': 'text/plain; charset=utf-8' }
        });
    }
}

async function staleWhileRevalidate(request) {
    const cache = await caches.open(CACHE_NAME);
    const cached = await cache.match(request);

    const networkPromise = fetch(request)
        .then(response => {
            if (isCacheableResponse(response)) {
                cache.put(request, response.clone());
            }
            return response;
        })
        .catch(() => null);

    return cached || networkPromise || new Response('Offline: brak kopii zasobu.', {
        status: 503,
        headers: { 'Content-Type': 'text/plain; charset=utf-8' }
    });
}

async function cacheFirstForAssets(request) {
    const cache = await caches.open(CACHE_NAME);
    const cached = await cache.match(request);
    if (cached) return cached;

    try {
        const response = await fetch(request);
        if (isCacheableResponse(response)) {
            await cache.put(request, response.clone());
        }
        return response;
    } catch {
        return new Response('Offline: obraz/ikona niedostępny.', {
            status: 503,
            headers: { 'Content-Type': 'text/plain; charset=utf-8' }
        });
    }
}

self.addEventListener('fetch', event => {
    if (!canHandleRequest(event.request)) {
        return;
    }

    const pathname = toPathname(event.request.url);

    // HTML startowy i config muszą być maksymalnie aktualne, dlatego strategia NetworkFirst.
    if (NETWORK_FIRST_PATHS.has(pathname)) {
        event.respondWith(networkFirst(event.request));
        return;
    }

    // Pliki JS/CSS zmieniają się częściej, ale mogą działać z cache podczas słabszej sieci.
    if (STALE_WHILE_REVALIDATE_PATHS.has(pathname)) {
        event.respondWith(staleWhileRevalidate(event.request));
        return;
    }

    // Statyczne obrazy i ikony z assets/ są wersjonowane buildem i rzadko się zmieniają,
    // więc CacheFirst minimalizuje transfer i przyspiesza render.
    if (pathname.startsWith('/assets/') && /\.(png|jpg|jpeg|gif|webp|svg|ico)$/i.test(pathname)) {
        event.respondWith(cacheFirstForAssets(event.request));
    }
});
