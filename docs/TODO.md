# Backlog projektu PAM WIKI

> Cel: jedna, kanoniczna lista zadań dla jakości UI, PWA, testów, bezpieczeństwa i utrzymania.

## Zasady prowadzenia backlogu
- To jest jedyny aktywny backlog projektu.
- Status zadania oznaczamy jako: `todo` / `in-progress` / `done`.
- Każde zadanie powinno mieć właściciela (`owner`) przed rozpoczęciem implementacji.

## P0 (krytyczne) — najwyższy priorytet

### P0.1 Strategia cache w Service Worker
- **Status:** `todo`
- **Owner:** `unassigned`
- [ ] Rozdzielić strategię cache per typ zasobu:
  - [ ] `NetworkFirst` dla `index.html` i `pam-wiki-config.json`.
  - [ ] `StaleWhileRevalidate` dla `styles.css`, `pam-wiki.js`, `quiz-module.js`, `dev-mode.js`.
  - [ ] `CacheFirst` tylko dla obrazów i ikon statycznych.
- [ ] Obsługiwać w `fetch` tylko metody `GET` oraz protokoły `http/https`.
- [ ] Nie cachować odpowiedzi cross-origin typu `opaque` bez limitów i zasad.
- [ ] Zapewnić fallback offline (dedykowana strona/komunikat) zamiast zwracania `undefined`.
- [ ] Dodać wersjonowanie cache oparte o build hash.

### P0.2 Podwójne tworzenie paska postępu scrolla
- **Status:** `todo`
- **Owner:** `unassigned`
- [ ] Usunąć duplikację elementu `.scroll-progress` (tylko HTML albo tylko JS).
- [ ] Dodać test regresyjny potwierdzający istnienie dokładnie jednego paska.

### P0.3 Krytyczne luki jakości w sekcji wykładów live
- **Status:** `todo`
- **Owner:** `unassigned`
- [ ] Ujednolicić strukturę plików `zajecia/live/wyklady/w*-live.html` do kontraktu walidatora.
- [ ] Dodać wymagane bloki: cele i efekty uczenia, case study, najczęstsze błędy, quiz,
      `info-card`, `comparison-grid`, `timeline`, `callout`, `quiz-checkpoint`, min. 3 slajdy rdzenia.
- [ ] Poprawić generator/template, aby nie tworzył niezgodnych plików.

### P0.4 UX mobilny (telefon/tablet) dla głównych przepływów
- **Status:** `todo`
- **Owner:** `unassigned`
- [ ] Zweryfikować panel `pullPanel` na małych ekranach (drag/scroll, rotacja, Android back gesture).
- [ ] Usunąć nakładanie elementów: `header`, `page-tab-bar`, `hero`, `wiki-sidebar` dla 320/360/390/412/768 px.
- [ ] Dodać/uzupełnić `env(safe-area-inset-*)` dla `viewport-fit=cover`.
- [ ] Zapewnić minimalne pola dotykowe 44x44 px (motyw, taby, szybka nawigacja, back-to-top).
- [ ] Dodać smoke test mobilny (Playwright).

### P0.5 Zgodność PWA (instalowalność + offline-first)
- **Status:** `todo`
- **Owner:** `unassigned`
- [ ] Zweryfikować kompletność `manifest.json` (`name`, `short_name`, `start_url`, `scope`, `display`, `theme_color`, `background_color`, maskowalne ikony).
- [ ] Potwierdzić działanie `start_url` offline po pierwszej instalacji.
- [ ] Dodać scenariusz aktualizacji aplikacji (`nowa wersja dostępna`, kontrolowane przeładowanie po `skipWaiting/clients.claim`).
- [ ] Zweryfikować ścieżki zasobów dla hostingu root i subpath (np. GitHub Pages).
- [ ] Dodać checklistę QA PWA (Android Chrome, iOS Safari A2HS, desktop Chrome).

## P1 (wysokie) — stabilność i jakość

### P1.1 Obsługa błędów konfiguracji i artykułów
- **Status:** `todo`
- **Owner:** `unassigned`
- [ ] Retry z backoff dla `pam-wiki-config.json`.
- [ ] Komunikat użytkownika z akcją „Spróbuj ponownie”.
- [ ] Centralne logowanie błędów technicznych.
- [ ] Walidacja runtime struktury JSON (`articles`, `metadata`, `categories`).

### P1.2 Inicjalizacja i cykl życia UI
- **Status:** `todo`
- **Owner:** `unassigned`
- [ ] Wydzielić moduł `bootstrap/init`.
- [ ] Zapewnić idempotent init (bez wielokrotnego podpinania listenerów).
- [ ] Dodać cleanup listenerów dla elementów dynamicznych.

### P1.3 Ograniczenie ryzyka XSS
- **Status:** `todo`
- **Owner:** `unassigned`
- [ ] Sanitizować HTML z markdown przed wstawieniem do DOM.
- [ ] Blokować niebezpieczne tagi/atrybuty/URL-e (`javascript:`).
- [ ] Dodać test bezpieczeństwa z przykładowym payloadem XSS.

### P1.4 Dostępność (a11y) niestandardowych interakcji
- **Status:** `todo`
- **Owner:** `unassigned`
- [ ] Obsługa klawiatury (Enter/Space) dla elementów z `role="button"`.
- [ ] Focus trap i zamykanie `Esc` dla paneli/dialogów mobilnych.
- [ ] Weryfikacja kontrastu dla motywów niestandardowych.
- [ ] Testy a11y (axe/lighthouse CI).

### P1.5 Typografia i czytelność
- **Status:** `todo`
- **Owner:** `unassigned`
- [ ] Zweryfikować `--wiki-font-size: 11px` pod kątem WCAG.
- [ ] Podnieść minimalny rozmiar fontu i spacing dla mobile.
- [ ] Dodać snapshoty wizualne dla kluczowych breakpointów.

### P1.6 Poprawność renderowania treści wszystkich artykułów
- **Status:** `todo`
- **Owner:** `unassigned`
- [ ] Dodać skrypt audytu renderu artykułów z `pam-wiki-config.json`.
- [ ] Dodać visual-diff regresji (desktop + mobile).
- [ ] Zweryfikować polskie znaki i UTF-8.
- [ ] Sprawdzić łamanie linii, overflow i czytelność długich treści.
- [ ] Zweryfikować tytuł, breadcrumbs i ikonę metadanych dla każdego artykułu.
- [ ] Publikować raport `article-render-health` w CI.

### P1.7 Szybkie zadania po przeglądzie kodu
- **Status:** `todo`
- **Owner:** `unassigned`
- [ ] Ujednolicić nazwę kroku `iOS ecosystem i workflow` do jednej wersji językowej.
- [ ] Przejrzeć blok `learningPaths` pod kątem mieszanek językowych.
- [ ] Dopisać regułę redakcyjną: pojedynczy wpis ma być w jednym języku.
- [ ] Zaktualizować komentarz testu w `tests/e2e/mobilehub-flow.spec.js` do realnych asercji.
- [ ] Rozszerzyć test `pwa-offline-start-url` o asercję treści fallbacku i recovery po powrocie online.

## P2 (średnie) — utrzymanie i rozwój

### P2.1 Architektura JS na moduły
- **Status:** `todo`
- **Owner:** `unassigned`
- [ ] Podzielić `pam-wiki.js` na moduły (`theme`, `navigation`, `wiki-render`, `search`, `a11y`, `pwa-ui`).
- [ ] Ograniczyć globalny stan przez warstwę store.
- [ ] Dodać JSDoc typy i kontrakty wejść/wyjść.

### P2.2 Testy regresji i CI
- **Status:** `todo`
- **Owner:** `unassigned`
- [ ] Testy jednostkowe parsera konfiguracji i nawigacji hash.
- [ ] Testy E2E (ładowanie strony, wyszukiwanie, motywy + `localStorage`, offline PWA).
- [ ] Uruchamianie walidatorów i testów w CI.

### P2.3 Polityka zasobów zewnętrznych
- **Status:** `todo`
- **Owner:** `unassigned`
- [ ] Rozważyć self-hosting kluczowych bibliotek lub fallback lokalny.
- [ ] Dodać SRI (`integrity`) dla CDN.
- [ ] Zdefiniować i przetestować CSP.

## Proponowana kolejność realizacji
1. P0.1–P0.5.
2. P1.3 + P1.4.
3. P1.1 + P1.2 + P1.5 + P1.7.
4. P1.6 + P2.2.
5. P2.1 + P2.3.

## Kryteria akceptacji zamknięcia backlogu
- [ ] Wszystkie walidatory kończą się sukcesem.
- [ ] Lighthouse (mobile) bez krytycznych błędów Performance/A11y/Best Practices/PWA.
- [ ] Brak regresji: nawigacja, wyszukiwanie, render markdown, motywy, offline.
- [ ] Każda naprawa ma test lub reprodukowalny scenariusz weryfikacji.
