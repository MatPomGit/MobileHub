// Hash builda powinien być wstrzykiwany podczas procesu CI/CD (np. przez query param `sw.js?v=<hash>`).
// Dzięki temu zmiana buildu automatycznie tworzy nowy cache bez ręcznej edycji wersji.
const BUILD_HASH = new URL(self.location.href).searchParams.get('v') || 'dev';
const CACHE_NAME = `app-cache-${BUILD_HASH}`;

const OPAQUE_ASSETS_CACHE_NAME = `opaque-assets-${BUILD_HASH}`;
const OPAQUE_ASSETS_MAX_ENTRIES = 20;

// Zasoby wymagające szybkiej dostępności po instalacji SW.
const ASSETS_TO_CACHE = [
    './',
    './index.html',
    './offline.html',
    './manifest.json',
    './assets/css/font-size-config.css',
    './assets/css/styles.css',
    './src/app-init.js',
    './src/bootstrap-ui.js',
    './src/dom-map.js',
    './src/motion-settings.js',
    './src/offline-indicator.js',
    './src/page-tabs.js',
    './src/pull-panel.js',
    './src/section-particles.js',
    './src/gsap-animations.js',
    './src/wiki-app.js',
    './src/wiki-data.js',
    './src/wiki-dom-utils.js',
    './src/wiki-router.js',
    './src/wiki-search.js',
    './src/wiki-sidebar.js',
    './src/wiki-ui.js',
    './src/dev/dev-state.js',
    './src/dev/dev-info.js',
    './src/dev/dev-panel-view.js',
    './src/dev/dev-controller.js',
    './src/entries/dev-mode.js',
    './src/entries/pam-files.js',
    './src/entries/pam-wiki.js',
    './src/entries/quiz-module.js',
    './src/materials/materials-data.js',
    './src/materials/presentation-preview-controller.js',
    './src/materials/render-download-materials.js',
    './src/materials/render-helpers.js',
    './src/materials/render-live-materials.js',
    './data/pam-wiki-config.json',
    './data/quiz-questions.json',
    './assets/favicon.ico',
    './assets/ico3.png',
    './assets/icon-192.png',
    './assets/icon-512.png',
    // Tło ekranu głównego jest dostępne natychmiast także offline.
    './assets/background_4.jpg'
];

const NETWORK_FIRST_PATHS = new Set(['/', '/index.html', '/data/pam-wiki-config.json']);
const STALE_WHILE_REVALIDATE_PATHS = new Set([
    '/assets/css/font-size-config.css',
    '/assets/css/styles.css',
    '/src/app-init.js',
    '/src/bootstrap-ui.js',
    '/src/offline-indicator.js',
    '/src/page-tabs.js',
    '/src/pull-panel.js',
    '/src/entries/dev-mode.js',
    '/src/entries/pam-files.js',
    '/src/entries/pam-wiki.js',
    '/src/entries/quiz-module.js'
]);

const SW_SCOPE_PATH = new URL(self.registration.scope).pathname;

self.addEventListener('install', event => {
    event.waitUntil(
        caches.open(CACHE_NAME).then(cache => cache.addAll(ASSETS_TO_CACHE))
    );
    self.skipWaiting();
});

self.addEventListener('activate', event => {
    event.waitUntil(
        caches.keys().then(keys =>
            Promise.all(keys.filter(k => k !== CACHE_NAME && k !== OPAQUE_ASSETS_CACHE_NAME).map(k => caches.delete(k)))
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

function toScopePath(url) {
    const pathname = new URL(url).pathname;

    if (!pathname.startsWith(SW_SCOPE_PATH)) {
        return null;
    }

    const relativePath = pathname.slice(SW_SCOPE_PATH.length);
    return relativePath ? '/' + relativePath : '/';
}

async function trimOpaqueAssetsCache(cache) {
    const keys = await cache.keys();

    // Ograniczenie liczby wpisów chroni przed niekontrolowanym wzrostem pamięci dla opaque.
    if (keys.length <= OPAQUE_ASSETS_MAX_ENTRIES) return;

    const overflow = keys.length - OPAQUE_ASSETS_MAX_ENTRIES;
    await Promise.all(keys.slice(0, overflow).map(request => cache.delete(request)));
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

    if (cached) return cached;

    const networkResponse = await networkPromise;
    if (networkResponse) return networkResponse;

    if (request.mode === 'navigate') {
        return cache.match('./offline.html');
    }

    return new Response('Offline: brak kopii zasobu.', {
        status: 503,
        headers: { 'Content-Type': 'text/plain; charset=utf-8' }
    });
}

async function cacheFirstForAssets(request) {
    const cache = await caches.open(CACHE_NAME);
    const opaqueCache = await caches.open(OPAQUE_ASSETS_CACHE_NAME);

    const cached = (await cache.match(request)) || (await opaqueCache.match(request));
    if (cached) return cached;

    try {
        const response = await fetch(request);

        if (isCacheableResponse(response)) {
            await cache.put(request, response.clone());
            return response;
        }

        // Opaque cache'ujemy tylko dla obrazów/ikon i pod ścisłym limitem liczby wpisów.
        if (response && response.type === 'opaque') {
            await opaqueCache.put(request, response.clone());
            await trimOpaqueAssetsCache(opaqueCache);
        }

        return response;
    } catch {
        const offlineFallback = await cache.match('./offline.html');
        if (offlineFallback) return offlineFallback;

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

    const scopePath = toScopePath(event.request.url);
    if (scopePath === null) {
        return;
    }

    // HTML startowy i konfiguracja muszą być maksymalnie aktualne.
    if (NETWORK_FIRST_PATHS.has(scopePath)) {
        event.respondWith(networkFirst(event.request));
        return;
    }

    // Pliki JS/CSS zmieniają się częściej, ale mogą działać z cache podczas słabszej sieci.
    if (STALE_WHILE_REVALIDATE_PATHS.has(scopePath)) {
        event.respondWith(staleWhileRevalidate(event.request));
        return;
    }

    // Statyczne obrazy i ikony z assets/ są wersjonowane buildem i rzadko się zmieniają,
    // więc CacheFirst minimalizuje transfer i przyspiesza render.
    if (scopePath.startsWith('/assets/') && /\.(png|jpg|jpeg|gif|webp|svg|ico)$/i.test(scopePath)) {
        event.respondWith(cacheFirstForAssets(event.request));
    }
});
