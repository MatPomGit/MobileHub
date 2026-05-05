# Jak stworzyć stronę PWA (Progressive Web App)

> Przewodnik po tworzeniu aplikacji internetowych spełniających standardy Progressive Web App - instalowanych na telefonie, działających offline i wyglądających jak natywna aplikacja mobilna.

---

## Czym jest PWA?

**Progressive Web App (PWA)** to zwykła strona internetowa (HTML + CSS + JS), która dzięki kilku technologiom zachowuje się jak natywna aplikacja mobilna:

- **instaluje się** na ekranie głównym telefonu/komputera,
- **działa offline** lub przy słabym połączeniu (cache),
- **ładuje się błyskawicznie** dzięki Service Worker,
- **wysyła powiadomienia push** (opcjonalnie),
- nie wymaga sklepu z aplikacjami (App Store / Google Play).

---

## Minimalne wymagania PWA

Według specyfikacji Google, strona jest traktowana jako PWA gdy spełnia trzy warunki:

| Warunek | Opis |
|---|---|
| HTTPS | Strona musi być serwowana przez szyfrowane połączenie |
| Web App Manifest | Plik JSON opisujący aplikację (nazwa, ikony, kolory) |
| Service Worker | Skrypt JS działający w tle, zarządzający cache i siecią |

---

## Krok 1 - Struktura projektu

```
moja-pwa/
├── index.html         ← główna strona
├── manifest.json      ← konfiguracja PWA
├── sw.js              ← Service Worker
└── assets/
    ├── icon-192.png   ← ikona 192×192 px
    └── icon-512.png   ← ikona 512×512 px
```

---

## Krok 2 - Web App Manifest (`manifest.json`)

Plik JSON deklaruje jak aplikacja ma wyglądać po zainstalowaniu:

```json
{
  "name": "Moja Aplikacja PWA",
  "short_name": "MojaApp",
  "description": "Opis aplikacji widoczny w sklepie / systemie.",
  "start_url": "/",
  "display": "standalone",
  "background_color": "#ffffff",
  "theme_color": "#5b4fcf",
  "orientation": "portrait-primary",
  "icons": [
    {
      "src": "assets/icon-192.png",
      "sizes": "192x192",
      "type": "image/png",
      "purpose": "any maskable"
    },
    {
      "src": "assets/icon-512.png",
      "sizes": "512x512",
      "type": "image/png",
      "purpose": "any maskable"
    }
  ]
}
```

### Wartości pola `display`

| Wartość | Efekt |
|---|---|
| `standalone` | Pełnoekranowy tryb bez paska przeglądarki (najczęściej używane) |
| `fullscreen` | Pełny ekran bez jakiegokolwiek chrome systemu |
| `minimal-ui` | Uproszczony pasek z przyciskami nawigacji |
| `browser` | Zwykła karta w przeglądarce (domyślne zachowanie) |

---

## Krok 3 - Rejestracja Manifestu w HTML

W sekcji `<head>` dodaj odnośnik do pliku manifestu oraz meta tagi dla iOS (Safari nie obsługuje manifestu w pełni):

```html
<!DOCTYPE html>
<html lang="pl">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0, viewport-fit=cover">
  <title>Moja Aplikacja PWA</title>

  <!-- ✅ Manifest PWA -->
  <link rel="manifest" href="manifest.json">

  <!-- ✅ Kolor paska systemowego (Android Chrome) -->
  <meta name="theme-color" content="#5b4fcf">

  <!-- ✅ iOS / Safari - pełnoekranowy tryb -->
  <meta name="apple-mobile-web-app-capable" content="yes">
  <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent">
  <meta name="apple-mobile-web-app-title" content="MojaApp">
  <link rel="apple-touch-icon" href="assets/icon-192.png">
</head>
<body>
  <h1>Witaj w mojej PWA!</h1>
  <script src="app.js"></script>
</body>
</html>
```

---

## Krok 4 - Service Worker (`sw.js`)

Service Worker to skrypt działający poza głównym wątkiem strony. Przechwytuje żądania sieciowe i może je obsługiwać z pamięci podręcznej (cache).

```javascript
const CACHE_NAME = 'moja-pwa-v1';
const ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/assets/icon-192.png',
  '/assets/icon-512.png',
];

// Instalacja - zapisz zasoby w cache
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(ASSETS))
  );
  self.skipWaiting();
});

// Aktywacja - usuń stary cache
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k))
      )
    )
  );
  self.clients.claim();
});

// Fetch - najpierw cache, potem sieć (Cache-First strategy)
self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request).then((cached) =>
      cached || fetch(event.request)
    )
  );
});
```

### Strategie cachowania

| Strategia | Zachowanie | Kiedy stosować |
|---|---|---|
| **Cache First** | Cache → Sieć | Statyczne zasoby (CSS, JS, ikony) |
| **Network First** | Sieć → Cache | Dane aktualne (API, artykuły) |
| **Stale-While-Revalidate** | Cache natychmiast, w tle odświeża | Dobre kompromisy UX |
| **Cache Only** | Tylko cache | Tryb offline |
| **Network Only** | Tylko sieć | Dane wymagające aktualności |

---

## Krok 5 - Rejestracja Service Workera w JS

```javascript
// Rejestracja musi być w głównym skrypcie strony (nie w sw.js)
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker
      .register('/sw.js')
      .then((reg) => console.log('SW zarejestrowany:', reg.scope))
      .catch((err) => console.error('Błąd rejestracji SW:', err));
  });
}
```

---

## Krok 6 - Ikony aplikacji

Przygotuj ikony w dwóch rozmiarach:

- **192×192 px** - ikona na ekranie głównym (Android)
- **512×512 px** - ikona w splash screen i sklepach

Dodaj `"purpose": "maskable"` aby ikona poprawnie wyglądała w kształtach (kwadrat, kółko) na różnych urządzeniach Android. Użyj narzędzia [maskable.app](https://maskable.app) do sprawdzenia.

---

## Krok 7 - Obsługa bezpiecznych obszarów ekranu (Safe Area)

Nowsze telefony (notch, wyspy, zaokrąglone rogi) mają obszary, których nie powinno zakrywać UI:

```css
body {
  /* Padding uwzględniający bezpieczny obszar (iOS, Android) */
  padding-top: env(safe-area-inset-top);
  padding-bottom: env(safe-area-inset-bottom);
  padding-left: env(safe-area-inset-left);
  padding-right: env(safe-area-inset-right);
}
```

Meta viewport powinien zawierać `viewport-fit=cover`:

```html
<meta name="viewport" content="width=device-width, initial-scale=1.0, viewport-fit=cover">
```

---

## Krok 8 - Testowanie PWA

### Narzędzia deweloperskie Chrome / Edge

1. Otwórz **DevTools** (F12)
2. Zakładka **Application → Manifest** - sprawdź czy manifest jest wykrywany
3. Zakładka **Application → Service Workers** - sprawdź rejestrację SW
4. Zakładka **Application → Cache Storage** - sprawdź zawartość cache

### Lighthouse (audyt PWA)

```bash
# Zainstaluj Lighthouse CLI
npm install -g lighthouse

# Wykonaj audyt (strona musi być na HTTPS lub localhost)
lighthouse https://twoja-strona.pl --view
```

W sekcji **PWA** zobaczysz wynik procentowy i listę spełnionych/niespełnionych kryteriów.

### Szybkie uruchomienie lokalne

```bash
# Python 3
python -m http.server 8080

# Node.js (npx)
npx serve .

# Otwórz: http://localhost:8080
```

> ⚠️ Service Worker wymaga HTTPS lub `localhost`. Na serwerze produkcyjnym zawsze używaj certyfikatu SSL (np. Let's Encrypt przez Certbot).

---

## Krok 9 - Prompt instalacji (Add to Home Screen)

Przeglądarka automatycznie wyświetla prompt instalacji gdy spełnione są kryteria PWA. Możesz też pokazać własny przycisk:

```javascript
let deferredPrompt;

// Zapisz zdarzenie, żeby je wywołać później
window.addEventListener('beforeinstallprompt', (e) => {
  e.preventDefault();
  deferredPrompt = e;
  document.getElementById('installBtn').style.display = 'block';
});

// Wywołaj po kliknięciu przycisku
document.getElementById('installBtn').addEventListener('click', async () => {
  if (!deferredPrompt) return;
  deferredPrompt.prompt();
  const { outcome } = await deferredPrompt.userChoice;
  console.log('Wynik:', outcome); // 'accepted' lub 'dismissed'
  deferredPrompt = null;
  document.getElementById('installBtn').style.display = 'none';
});

// Ukryj przycisk gdy aplikacja już zainstalowana
window.addEventListener('appinstalled', () => {
  document.getElementById('installBtn').style.display = 'none';
});
```

---

## Krok 10 - Powiadomienia Push (opcjonalnie)

PWA może wysyłać powiadomienia push nawet gdy strona jest zamknięta (wymaga HTTPS i zgody użytkownika):

```javascript
// Poproś o zgodę
const permission = await Notification.requestPermission();
if (permission !== 'granted') return;

// Zasubskrybuj push (wymaga serwera VAPID)
const reg = await navigator.serviceWorker.ready;
const subscription = await reg.pushManager.subscribe({
  userVisibleOnly: true,
  applicationServerKey: urlBase64ToUint8Array('TWOJ_VAPID_PUBLIC_KEY'),
});

// Wyślij subscription do Twojego backendu
await fetch('/api/subscribe', {
  method: 'POST',
  body: JSON.stringify(subscription),
  headers: { 'Content-Type': 'application/json' },
});
```

Do obsługi VAPID można użyć bibliotek: **web-push** (Node.js), **pywebpush** (Python) lub usług jak **Firebase Cloud Messaging (FCM)**.

---

## Podsumowanie - lista kontrolna PWA

```
✅ Strona serwowana przez HTTPS (lub localhost)
✅ Plik manifest.json z nazwą, ikonami i display: standalone
✅ <link rel="manifest"> w <head>
✅ Meta tagi apple-mobile-web-app-* dla iOS
✅ Service Worker zarejestrowany i obsługujący fetch
✅ Zasoby statyczne w cache (offline fallback)
✅ Ikony 192px i 512px (PNG, maskable)
✅ viewport-fit=cover + env(safe-area-inset-*)
✅ theme-color w manifest i meta tagu
✅ Responsywny layout (mobile-first CSS)
```

---

## Przydatne narzędzia

| Narzędzie | Opis |
|---|---|
| [Lighthouse](https://developer.chrome.com/docs/lighthouse/) | Audyt PWA w Chrome DevTools |
| [PWA Builder](https://www.pwabuilder.com) | Generator manifestu i SW |
| [Maskable.app](https://maskable.app) | Podgląd ikony maskable |
| [Workbox](https://developer.chrome.com/docs/workbox/) | Biblioteka Google do obsługi SW |
| [Can I use](https://caniuse.com) | Wsparcie przeglądarek dla API PWA |
| [web.dev/pwa](https://web.dev/progressive-web-apps/) | Oficjalna dokumentacja Google PWA |

---

## Przykład: PAM WIKI jako PWA

Ten projekt (`PAM WIKI`) jest przykładem prostej PWA zbudowanej ze statycznych plików:

```
index.html       ← cała aplikacja (SPA)
manifest.json    ← konfiguracja PWA (short_name: PAM WIKI)
sw.js            ← Service Worker (Cache-First dla plików statycznych)
pam-wiki.js      ← logika wiki (fetch artykułów .md, highlight.js)
pam-files.js     ← lista plików do pobrania
assets/
  icon-192.png
  icon-512.png
  favicon.ico
wiki/            ← artykuły w formacie Markdown (.md)
```

Kluczowe decyzje projektowe:
- **Brak frameworka** - vanilla HTML/CSS/JS dla maksymalnej wydajności i prostoty
- **Markdown** jako format artykułów - łatwa edycja, renderowany przez `marked.js`
- **highlight.js** - podświetlanie składni kodu bez budowania
- **CSS Custom Properties** - motywy kolorystyczne bez preprocesora
- **Service Worker** - instalacja na ekranie głównym i dostęp offline
