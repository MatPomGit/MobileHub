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

## Web App Shortcuts i Share Target

### App Shortcuts

Skróty aplikacji (App Shortcuts) pozwalają użytkownikowi przejść bezpośrednio do konkretnej funkcji aplikacji przez długie przytrzymanie ikony na ekranie głównym (podobnie jak 3D Touch / haptic touch na iOS). Definiuje się je w `manifest.json` w tablicy `shortcuts`:

```json
{
  "shortcuts": [
    {
      "name": "Nowe zadanie",
      "short_name": "Dodaj",
      "description": "Utwórz nowe zadanie bez otwierania listy",
      "url": "/app/new-task?source=shortcut",
      "icons": [{ "src": "/icons/shortcut-add.png", "sizes": "96x96", "type": "image/png" }]
    },
    {
      "name": "Moje projekty",
      "short_name": "Projekty",
      "url": "/app/projects?source=shortcut",
      "icons": [{ "src": "/icons/shortcut-projects.png", "sizes": "96x96" }]
    }
  ]
}
```

Skróty działają na Android Chrome od wersji 84 i są ignorowane przez przeglądarki, które ich nie obsługują — bez efektu ubocznego.

### Share Target — odbieranie treści z innych aplikacji

Share Target pozwala zarejestrować PWA jako cel udostępniania — użytkownik może "Udostępnić" plik, link lub tekst z dowolnej aplikacji i wybrać twoją PWA z systemowego arkusza udostępniania.

```json
// manifest.json — rozszerzone o share_target
{
  "share_target": {
    "action": "/app/share-receiver",
    "method": "POST",
    "enctype": "multipart/form-data",
    "params": {
      "title":  "title",
      "text":   "text",
      "url":    "url",
      "files": [
        {
          "name": "media",
          "accept": ["image/*", "video/*", ".pdf"]
        }
      ]
    }
  }
}
```

```typescript
// Service Worker — przechwytywanie POST z share_target
self.addEventListener('fetch', (event: FetchEvent) => {
  const url = new URL(event.request.url);
  if (url.pathname === '/app/share-receiver' && event.request.method === 'POST') {
    event.respondWith(handleShareTarget(event.request));
  }
});

async function handleShareTarget(request: Request): Promise<Response> {
  const formData = await request.formData();
  const title  = formData.get('title')  as string | null;
  const text   = formData.get('text')   as string | null;
  const url    = formData.get('url')    as string | null;
  const files  = formData.getAll('media') as File[];

  // Zapisz dane w IndexedDB — będą dostępne po przekierowaniu
  const db = await openDB('share-queue', 1, {
    upgrade(db) { db.createObjectStore('pending'); }
  });
  await db.put('share-queue', { title, text, url, files }, 'latest');

  // Przekieruj do strony aplikacji, która odczyta dane z IDB
  return Response.redirect('/app/new-task?shared=1', 303);
}

// React — odczyt udostępnionych danych po przekierowaniu
function NewTaskPage() {
  const [sharedData, setSharedData] = useState<SharedData | null>(null);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('shared')) {
      openDB('share-queue', 1).then(db =>
        db.get('share-queue', 'latest').then(data => {
          if (data) setSharedData(data);
          db.delete('share-queue', 'latest');
        })
      );
    }
  }, []);

  // Jeśli coś zostało udostępnione — prefilluj formularz
  return <NewTaskForm prefill={sharedData} />;
}
```

Share Target wymaga, by PWA była zainstalowana na urządzeniu — niezainstalowane PWA nie pojawia się w arkuszu udostępniania.

## File System Access API

File System Access API (wcześniej Native File System API) pozwala aplikacji webowej czytać i zapisywać pliki bezpośrednio z systemu plików użytkownika — z jego wyraźną zgodą przez okno dialogowe. Nie wymaga round-tripu przez serwer.

```typescript
// Otwieranie pliku — showOpenFilePicker
async function openTextFile(): Promise<{ name: string; content: string } | null> {
  try {
    const [handle] = await window.showOpenFilePicker({
      types: [{
        description: 'Pliki tekstowe i Markdown',
        accept: { 'text/*': ['.txt', '.md', '.csv', '.json'] }
      }],
      multiple: false
    });

    const file = await handle.getFile();
    const content = await file.text();
    return { name: file.name, content };
  } catch (err) {
    if ((err as Error).name === 'AbortError') return null;  // użytkownik zamknął dialog
    throw err;
  }
}

// Zapis pliku — showSaveFilePicker
async function saveTextFile(content: string, suggestedName: string): Promise<boolean> {
  try {
    const handle = await window.showSaveFilePicker({
      suggestedName,
      types: [{
        description: 'Plik Markdown',
        accept: { 'text/markdown': ['.md'] }
      }]
    });

    const writable = await handle.createWritable();
    await writable.write(content);
    await writable.close();
    return true;
  } catch (err) {
    if ((err as Error).name === 'AbortError') return false;
    throw err;
  }
}
```

### OPFS — Origin Private File System

OPFS (Origin Private File System) to prywatna przestrzeń plików aplikacji — niewidoczna dla użytkownika, bez okien dialogowych i ze znacznie lepszą wydajnością niż IndexedDB dla dużych plików:

```typescript
// OPFS — zapis i odczyt dużych danych (np. baza SQLite, pliki eksportu)
async function writeToOPFS(filename: string, data: ArrayBuffer): Promise<void> {
  const root = await navigator.storage.getDirectory();
  const fileHandle = await root.getFileHandle(filename, { create: true });
  const writable = await fileHandle.createWritable();
  await writable.write(data);
  await writable.close();
}

async function readFromOPFS(filename: string): Promise<ArrayBuffer | null> {
  try {
    const root = await navigator.storage.getDirectory();
    const fileHandle = await root.getFileHandle(filename);
    const file = await fileHandle.getFile();
    return await file.arrayBuffer();
  } catch {
    return null;  // plik nie istnieje
  }
}

// Przykład: trzymanie bazy SQLite (sql.js / wa-sqlite) w OPFS
async function initSqliteDB() {
  const SQL = await initSqlJs({ locateFile: f => `/wasm/${f}` });
  const existing = await readFromOPFS('app.sqlite');
  const db = existing ? new SQL.Database(new Uint8Array(existing)) : new SQL.Database();
  
  // Zapisuj po każdej transakcji
  const save = async () => {
    const data = db.export();
    await writeToOPFS('app.sqlite', data.buffer);
  };
  return { db, save };
}
```

File System Access API jest dostępne w Chrome/Edge (desktop i Android). Safari obsługuje podstawowy `showOpenFilePicker` od wersji 15.2, ale OPFS od 16.4. Firefox nie obsługuje File System Access API w trybie bez OPFS.

## Lighthouse i wydajność PWA

Lighthouse to narzędzie audytu PWA wbudowane w Chrome DevTools (zakładka Lighthouse) oraz dostępne jako CLI. Mierzy pięć kategorii: Performance, Accessibility, Best Practices, SEO i PWA.

### Core Web Vitals

| Metryka | Opis | Dobry wynik |
|---------|------|------------|
| **LCP** (Largest Contentful Paint) | Czas renderowania największego elementu widoku | ≤ 2,5 s |
| **CLS** (Cumulative Layout Shift) | Stabilność layoutu (przesunięcia elementów) | ≤ 0,1 |
| **INP** (Interaction to Next Paint) | Responsywność na interakcje użytkownika | ≤ 200 ms |

```bash
# Lighthouse CLI — audyt z terminala (raport JSON + HTML)
npm install -g lighthouse

lighthouse https://moja-pwa.example.com \
  --output=json,html \
  --output-path=./lighthouse-report \
  --form-factor=mobile \
  --throttling-method=simulate \
  --only-categories=performance,pwa

# Audyt lokalny (dev server)
lighthouse http://localhost:5173 \
  --chrome-flags="--headless" \
  --output=html \
  --output-path=./report.html
```

```typescript
// Performance Budget — automatyczne sprawdzanie metryk w CI
// lighthouse-budget.json
const budget = [
  {
    "resourceSizes": [
      { "resourceType": "script",     "budget": 300 },  // kB
      { "resourceType": "total",      "budget": 1000 }
    ],
    "timings": [
      { "metric": "interactive",         "budget": 3000 },  // ms
      { "metric": "first-contentful-paint", "budget": 1500 }
    ]
  }
];

// Wyniki Lighthouse w CI (GitHub Actions)
// - lhci autorun --config=.lighthouserc.json
// .lighthouserc.json
const lhciConfig = {
  "ci": {
    "collect": { "url": ["http://localhost:5173"], "startServerCommand": "npm run preview" },
    "assert": {
      "assertions": {
        "categories:performance": ["error", { "minScore": 0.9 }],
        "categories:pwa":         ["error", { "minScore": 0.9 }],
        "first-contentful-paint": ["warn",  { "maxNumericValue": 2000 }],
        "cumulative-layout-shift":["error", { "maxNumericValue": 0.1 }]
      }
    },
    "upload": { "target": "temporary-public-storage" }
  }
};
```

Najczęstsze problemy obniżające wynik PWA w Lighthouse: brak ikony `512×512` z `purpose: maskable`, brak `theme_color` w manifeście, serwer worker nie obsługujący nawigacji offline, oraz ładowanie blokujące renderowanie (render-blocking CSS/JS). Narzędzie `web-vitals` (npm) pozwala mierzyć CWV w produkcji i raportować je do własnej analityki.
