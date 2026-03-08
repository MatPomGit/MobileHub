# PWA — Progressive Web Apps

Progressive Web App to aplikacja webowa spełniająca określone kryteria techniczne, które pozwalają na "instalację" jej na urządzeniu i korzystanie jak z natywnej aplikacji — offline, z ikonką na ekranie głównym, powiadomieniami push i dostępem do API urządzenia.

## Kryteria PWA

```
Minimalne:
✓ HTTPS (lub localhost)
✓ Web App Manifest
✓ Service Worker

Zalecane dla dobrej instalacji:
✓ Szybkość ładowania (Lighthouse ≥ 90)
✓ Responsywny design
✓ Działa offline
✓ Ikony (min. 192×192 i 512×512 px)
✓ Splash screen (kolor tła + ikona)
```

## Web App Manifest

```json
// public/manifest.json
{
  "name": "Task Manager",
  "short_name": "Tasks",
  "description": "Zarządzaj zadaniami offline",
  "start_url": "/app?source=pwa",
  "display": "standalone",
  "orientation": "portrait",
  "theme_color": "#5b4fcf",
  "background_color": "#1a1a2e",
  "categories": ["productivity", "utilities"],
  "lang": "pl",
  "dir": "ltr",
  "icons": [
    { "src": "/icons/icon-72.png",   "sizes": "72x72",   "type": "image/png" },
    { "src": "/icons/icon-192.png",  "sizes": "192x192", "type": "image/png", "purpose": "any" },
    { "src": "/icons/icon-512.png",  "sizes": "512x512", "type": "image/png", "purpose": "any maskable" }
  ],
  "shortcuts": [
    {
      "name": "Nowe zadanie",
      "short_name": "Dodaj",
      "description": "Utwórz nowe zadanie",
      "url": "/app/new-task",
      "icons": [{ "src": "/icons/add.png", "sizes": "96x96" }]
    }
  ],
  "screenshots": [
    { "src": "/screenshots/mobile.png", "sizes": "390x844", "type": "image/png", "form_factor": "narrow" }
  ],
  "related_applications": [],
  "prefer_related_applications": false
}
```

```html
<!-- index.html — podpięcie manifestu -->
<link rel="manifest" href="/manifest.json">
<meta name="theme-color" content="#5b4fcf">
<meta name="apple-mobile-web-app-capable" content="yes">
<meta name="apple-mobile-web-app-status-bar-style" content="black-translucent">
<!-- iOS nie obsługuje manifest.json w pełni — dodatkowe meta -->
<link rel="apple-touch-icon" href="/icons/icon-192.png">
```

## Service Worker — offline i cache

```typescript
// src/service-worker.ts (Workbox)
import { clientsClaim } from 'workbox-core';
import { ExpirationPlugin } from 'workbox-expiration';
import { precacheAndRoute, createHandlerBoundToURL } from 'workbox-precaching';
import { registerRoute, NavigationRoute } from 'workbox-routing';
import { StaleWhileRevalidate, CacheFirst, NetworkFirst } from 'workbox-strategies';

clientsClaim();

// Pre-cache pliki budowania (Vite/CRA generuje listę automatycznie)
precacheAndRoute(self.__WB_MANIFEST);

// App Shell — zawsze z cache (dla SPA)
registerRoute(
  new NavigationRoute(createHandlerBoundToURL('/index.html'))
);

// API — Network First (świeże dane gdy jest internet, cache gdy offline)
registerRoute(
  ({ url }) => url.pathname.startsWith('/api/'),
  new NetworkFirst({
    cacheName: 'api-cache',
    plugins: [
      new ExpirationPlugin({
        maxEntries: 100,
        maxAgeSeconds: 24 * 60 * 60,  // 24 godziny
      }),
    ],
    networkTimeoutSeconds: 5,  // fallback do cache po 5s timeout
  })
);

// Obrazy — Cache First (rzadko się zmieniają)
registerRoute(
  ({ request }) => request.destination === 'image',
  new CacheFirst({
    cacheName: 'images',
    plugins: [
      new ExpirationPlugin({ maxEntries: 60, maxAgeSeconds: 30 * 24 * 60 * 60 }),
    ],
  })
);

// Fonty Google — StaleWhileRevalidate
registerRoute(
  ({ url }) => url.origin === 'https://fonts.googleapis.com',
  new StaleWhileRevalidate({ cacheName: 'google-fonts-stylesheets' })
);
```

## Background Sync — operacje offline

```typescript
// Rejestracja sync gdy brak połączenia
async function saveTodoOffline(todo: Todo) {
  const db = await openDB('offline-queue', 1, {
    upgrade(db) { db.createObjectStore('todos', { autoIncrement: true }); }
  });
  await db.add('todos', { todo, timestamp: Date.now() });

  if ('serviceWorker' in navigator && 'SyncManager' in window) {
    const registration = await navigator.serviceWorker.ready;
    await registration.sync.register('sync-todos');
    console.log('Zarejestrowano Background Sync');
  }
}

// W Service Worker — obsługa sync eventu
self.addEventListener('sync', (event: SyncEvent) => {
  if (event.tag === 'sync-todos') {
    event.waitUntil(syncOfflineTodos());
  }
});

async function syncOfflineTodos() {
  const db = await openDB('offline-queue', 1);
  const pendingTodos = await db.getAll('todos');

  for (const item of pendingTodos) {
    try {
      await fetch('/api/todos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(item.todo)
      });
      await db.delete('todos', item.id);
    } catch (err) {
      console.error('Sync failed for todo:', err);
      // Zostanie ponowione przy następnym sync evencie
    }
  }
}
```

## Web Push Notifications

```typescript
// Żądanie uprawnień i subskrypcja
async function subscribeToPush(): Promise<PushSubscription | null> {
  const permission = await Notification.requestPermission();
  if (permission !== 'granted') return null;

  const registration = await navigator.serviceWorker.ready;
  const subscription = await registration.pushManager.subscribe({
    userVisibleOnly: true,
    applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY)
  });

  // Wyślij subskrypcję na serwer backend
  await fetch('/api/push/subscribe', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(subscription)
  });

  return subscription;
}

// W Service Worker — obsługa push
self.addEventListener('push', (event: PushEvent) => {
  const data = event.data?.json() ?? {};

  event.waitUntil(
    self.registration.showNotification(data.title ?? 'Powiadomienie', {
      body: data.body,
      icon: '/icons/icon-192.png',
      badge: '/icons/badge-96.png',
      data: { url: data.url ?? '/' },
      actions: [
        { action: 'open',    title: 'Otwórz' },
        { action: 'dismiss', title: 'Zamknij' },
      ],
    })
  );
});

self.addEventListener('notificationclick', (event: NotificationEvent) => {
  event.notification.close();
  if (event.action === 'open' || !event.action) {
    event.waitUntil(clients.openWindow(event.notification.data.url));
  }
});
```

## Instalacja — beforeinstallprompt

```typescript
// React hook — kontrola promptu instalacji
function useInstallPrompt() {
  const [prompt, setPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstalled, setIsInstalled] = useState(false);

  useEffect(() => {
    const handler = (e: BeforeInstallPromptEvent) => {
      e.preventDefault();
      setPrompt(e);  // zachowaj zdarzenie — pokaż własny przycisk
    };

    window.addEventListener('beforeinstallprompt', handler);
    window.addEventListener('appinstalled', () => setIsInstalled(true));

    // Sprawdź czy już zainstalowane
    if (window.matchMedia('(display-mode: standalone)').matches) {
      setIsInstalled(true);
    }

    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const install = async () => {
    if (!prompt) return;
    prompt.prompt();
    const { outcome } = await prompt.userChoice;
    console.log(`Instalacja: ${outcome}`);  // 'accepted' lub 'dismissed'
    setPrompt(null);
  };

  return { canInstall: !!prompt && !isInstalled, isInstalled, install };
}

// Komponent przycisku instalacji
function InstallButton() {
  const { canInstall, install } = useInstallPrompt();
  if (!canInstall) return null;

  return (
    <button onClick={install} className="install-btn">
      📲 Zainstaluj aplikację
    </button>
  );
}
```

## PWA vs Native — porównanie

| Funkcja | PWA | Native Android | Native iOS |
|---------|-----|----------------|------------|
| Powiadomienia push | ✅ (Web Push) | ✅ (FCM) | ✅ (APNs) |
| Dostęp do kamery | ✅ (getUserMedia) | ✅ | ✅ |
| GPS | ✅ (Geolocation API) | ✅ | ✅ |
| Bluetooth | ⚠️ (Web Bluetooth — Chrome only) | ✅ | ✅ |
| NFC | ⚠️ (Chrome Android only) | ✅ | ✅ (od iOS 11) |
| Kontakty | ⚠️ (Contact Picker API) | ✅ | ✅ |
| Biometria | ⚠️ (WebAuthn) | ✅ | ✅ |
| Widget domowego ekranu | ❌ | ✅ | ✅ |
| App Store | ❌ (lub TWA/wrapping) | ✅ | ✅ |

## Linki

- [web.dev — PWA](https://web.dev/progressive-web-apps/)
- [Workbox](https://developer.chrome.com/docs/workbox/)
- [Lighthouse](https://developer.chrome.com/docs/lighthouse/)
- [What PWA Can Do Today](https://whatpwacando.today/)
- [VAPID dla Web Push](https://web.dev/push-notifications-web-push-protocol/)
