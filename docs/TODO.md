# Backlog projektu MobileHub

> Ostatnia aktualizacja: 29 czerwca 2026 r., po reorganizacji struktury repozytorium.

## Zasady prowadzenia backlogu

- Ten plik jest jedynym aktywnym backlogiem projektu.
- Dozwolone statusy: `todo`, `in-progress`, `done`.
- Zadanie musi mieć właściciela przed rozpoczęciem implementacji.
- Ścieżki w zadaniach muszą odpowiadać aktualnej strukturze opisanej w `README.md`.
- Zakończone obszary przenosimy do sekcji „Zrealizowane”, zamiast pozostawiać je między aktywnymi zadaniami.

## P0: stabilność wydania

### P0.1 Weryfikacja po reorganizacji repozytorium

- **Status:** `done`
- **Właściciel:** `codex`
- [x] Przenieść strony dodatkowe do `pages/exams/`, `pages/guides/` i `pages/community/`.
- [x] Przenieść dane do `data/`, style do `assets/css/`, adaptery do `src/entries/`, a pliki SQL do `database/`.
- [x] Zaktualizować odwołania w HTML, JavaScript, Service Workerze, testach i dokumentacji.
- [x] Potwierdzić statycznie poprawność JSON, importów JS, zasobów CSS, lokalnych odsyłaczy HTML i listy zasobów wstępnie zapisywanych w pamięci podręcznej.
- [x] Uruchomić `npm run qa` w środowisku z Node.js i npm.
- [x] Uruchomić testy E2E dla stron:
  - [x] `pages/exams/test.html`
  - [x] `pages/exams/zal.html`
  - [x] `pages/exams/zal_sesje.html`
  - [x] `pages/community/studenci.html`
  - [x] `pages/guides/pierwsza-aplikacja.html`
  - [x] `pages/guides/projektowanie-aplikacji.html`
  - [x] `pages/guides/obrona_projektu.html`
- [x] Zweryfikować statycznie ścieżki dla wdrożenia w katalogu głównym oraz pod prefiksem `/MobileHub/`.
- [x] Udokumentować zmianę starych publicznych adresów i nowe lokalizacje stron w `README.md`.

### P0.2 PWA i Service Worker po zmianie ścieżek

- **Status:** `in-progress`
- **Właściciel:** `codex`
- [x] Zastosować `NetworkFirst` dla `index.html` i `data/pam-wiki-config.json`.
- [x] Zastosować `StaleWhileRevalidate` dla głównych plików CSS i JavaScript.
- [x] Ograniczyć `CacheFirst` do obrazów i ikon.
- [x] Obsługiwać wyłącznie żądania `GET` dla protokołów HTTP i HTTPS.
- [x] Ograniczyć pamięć podręczną odpowiedzi `opaque`.
- [x] Zapewnić odpowiedź awaryjną przez `offline.html`.
- [x] Powiązać nazwę pamięci podręcznej z skrótem wersji kompilacji.
- [x] Uniezależnić dopasowanie ścieżek w `sw.js` od katalogu wdrożenia.
- [x] Uzupełnić pełny graf lokalnych zależności wymaganych do uruchomienia aplikacji offline.
- [x] Dodać komunikat „Nowa wersja jest dostępna” i kontrolowane przeładowanie aplikacji.
- [x] Dodać maskowalne ikony do `manifest.json`.
- [ ] Potwierdzić instalację i działanie offline na Androidzie, iOS oraz w przeglądarce desktopowej.

### P0.3 Wykłady live zgodne z kontraktem

- **Status:** `todo`
- **Właściciel:** `unassigned`
- [ ] Ujednolicić pliki `zajecia/live/wyklady/w*-live.html` z kontraktem walidatora.
- [ ] Uzupełnić każdy wykład o:
  - [ ] cele i efekty uczenia;
  - [ ] studium przypadku;
  - [ ] najczęstsze błędy;
  - [ ] quiz;
  - [ ] komponenty `info-card`, `comparison-grid`, `timeline`, `callout` i `quiz-checkpoint`;
  - [ ] co najmniej trzy slajdy treści głównej.
- [ ] Poprawić generator i szablon, aby nie tworzyły niezgodnych plików.
- [ ] Rozstrzygnąć sposób dostarczania zależności Reveal.js ignorowanej obecnie jako `vendor/`.

### P0.4 Główne przepływy mobilne

- **Status:** `todo`
- **Właściciel:** `unassigned`
- [ ] Zweryfikować `pullPanel` na małych ekranach: przeciąganie, przewijanie, obrót i systemowy gest wstecz.
- [ ] Usunąć nakładanie elementów `header`, `page-tab-bar`, `hero` i `wiki-sidebar` dla szerokości 320, 360, 390, 412 i 768 px.
- [ ] Uzupełnić `env(safe-area-inset-*)` dla `viewport-fit=cover`.
- [ ] Zapewnić pola dotykowe o wymiarach co najmniej 44 × 44 px.
- [ ] Rozszerzyć istniejący test podstawowy o rzeczywiste pomiary przepełnienia i widoczności.
- [ ] Dodać E2E dla przejść między stroną główną, testem, sesją zaliczeniową i widokiem studentów.

## P1: bezpieczeństwo i jakość

### P1.1 Walidacja konfiguracji i danych

- **Status:** `in-progress`
- **Właściciel:** `codex`
- [x] Dodać ponawianie z opóźnieniem dla `data/pam-wiki-config.json`.
- [x] Dodać komunikat z akcją „Spróbuj ponownie”.
- [x] Przywrócić poprawny format JSON w `data/students-data.json`.
- [x] Zaktualizować walidator konfiguracji do ścieżki `data/pam-wiki-config.json`.
- [ ] Walidować w czasie działania pola `articles`, `metadata` i `categories`.
- [ ] Dodać walidatory schematu dla `data/quiz-questions.json` i `data/students-data.json`.
- [ ] Włączyć wszystkie walidatory danych do `npm run qa`.
- [ ] Wprowadzić centralne logowanie błędów technicznych.

### P1.2 Bezpieczne renderowanie Markdown

- **Status:** `in-progress`
- **Właściciel:** `unassigned`
- [x] Sanitizować wynik `marked.parse()` przed przypisaniem do `innerHTML`.
- [x] Blokować niebezpieczne tagi, atrybuty zdarzeń i adresy `javascript:`.
- [x] Dodać podstawowy test z ładunkiem XSS.
- [ ] Testować bezpośrednio funkcję używaną przez `src/wiki-app.js`, zamiast utrzymywać drugą implementację sanitizacji w teście.
- [ ] Dodać przypadki dla `data:`, `srcdoc`, SVG, `xlink:href` oraz uszkodzonego HTML.
- [ ] Zweryfikować pozostałe przypisania do `innerHTML` pod kątem danych zewnętrznych.

### P1.3 Dostępność

- **Status:** `todo`
- **Właściciel:** `unassigned`
- [ ] Zapewnić obsługę Enter i Spacji dla elementów z `role="button"`.
- [ ] Dodać pułapkę fokusu i zamykanie klawiszem Escape dla paneli i dialogów.
- [ ] Zweryfikować kontrast wszystkich motywów.
- [ ] Dodać testy axe do kluczowych stron.
- [ ] Przeprowadzić ręczny test obsługi czytnikiem ekranu i samą klawiaturą.

### P1.4 Testy regresji i CI

- **Status:** `todo`
- **Właściciel:** `unassigned`
- [ ] Uruchamiać `npm run qa` dla każdego żądania scalenia (pull requestu).
- [ ] Dodać testy jednostkowe parsera konfiguracji i nawigacji hash.
- [ ] Rozszerzyć E2E o wyszukiwanie, motywy, `localStorage`, offline i aktualizację Service Workera.
- [x] Dodać trwały walidator lokalnych ścieżek HTML, CSS i JavaScript.
- [ ] Publikować raporty Playwright i artefakty nieudanych testów.

### P1.5 Renderowanie wszystkich artykułów

- **Status:** `todo`
- **Właściciel:** `unassigned`
- [ ] Dodać audyt wszystkich artykułów wskazanych przez `data/pam-wiki-config.json`.
- [ ] Sprawdzać tytuł, ścieżkę nawigacyjną, ikonę metadanych i spis treści.
- [ ] Wykrywać przepełnienie, nieczytelne łamanie linii i problemy z polskimi znakami.
- [ ] Dodać porównanie wizualne dla widoku desktopowego i mobilnego.
- [ ] Publikować raport `article-render-health` w CI.

### P1.6 Spójność struktury repozytorium

- **Status:** `todo`
- **Właściciel:** `unassigned`
- [x] Dodać kontrolę do bramki QA, która nie pozwoli ponownie umieszczać stron, danych i zasobów w katalogu głównym.
- [x] Zdefiniować dozwoloną listę plików głównych w walidatorze struktury.
- [ ] Ujednolicić nazewnictwo nowych plików do małych liter i formatu `kebab-case`, z wyjątkiem materiałów źródłowych.
- [ ] Rozszerzyć walidator materiałów o jawne zasady dla zagnieżdżonych katalogów `pages/`.
- [ ] Sprawdzać zgodność mapy katalogów w `README.md` z rzeczywistą strukturą.

## P2: utrzymanie i rozwój

### P2.1 Inicjalizacja i cykl życia interfejsu

- **Status:** `in-progress`
- **Właściciel:** `unassigned`
- [x] Wydzielić główną orkiestrację do `src/app-init.js`.
- [x] Zapewnić idempotentną inicjalizację głównych modułów interfejsu.
- [ ] Dodać mechanizm sprzątania nasłuchiwaczy dla elementów dynamicznych.
- [ ] Dodać test wielokrotnego uruchomienia inicjalizacji.
- [ ] Ujednolicić obsługę błędów etapów startowych.

### P2.2 Architektura modułów JavaScript

- **Status:** `in-progress`
- **Właściciel:** `unassigned`
- [x] Sprowadzić `src/entries/pam-wiki.js` i `src/entries/pam-files.js` do cienkich adapterów.
- [x] Wydzielić moduły wiki, materiałów, panelu mobilnego i trybu deweloperskiego.
- [ ] Ograniczyć globalny stan przez wspólną warstwę stanu.
- [ ] Dodać typy JSDoc i kontrakty wejść oraz wyjść.
- [ ] Ustalić granice odpowiedzialności między `src/bootstrap-ui.js`, `src/wiki-app.js` i `src/page-tabs.js`.

### P2.3 Typografia i czytelność

- **Status:** `todo`
- **Właściciel:** `unassigned`
- [ ] Zweryfikować `--wiki-font-size: 11px` pod kątem WCAG.
- [ ] Podnieść minimalny rozmiar tekstu i odstępy na urządzeniach mobilnych.
- [ ] Dodać obrazy referencyjne dla kluczowych szerokości ekranu.

### P2.4 Zasoby zewnętrzne i polityka bezpieczeństwa

- **Status:** `todo`
- **Właściciel:** `unassigned`
- [ ] Rozważyć lokalne przechowywanie kluczowych bibliotek albo lokalny mechanizm awaryjny.
- [ ] Dodać SRI dla zasobów CDN.
- [ ] Zdefiniować i przetestować CSP.
- [ ] Udokumentować listę dozwolonych zewnętrznych domen.

### P2.5 Moduł 3D Gaussian Splatting

- **Status:** `todo`
- **Właściciel:** `unassigned`
- [ ] Wybrać silnik WebGL2 lub WebGPU i przygotować adapter dla `pages/3dgs.html`.
- [ ] Zaimplementować `loadScene()` dla adresów URL i plików `.ply`, `.splat` oraz `.ksplat`.
- [ ] Walidować rozmiar i rozszerzenie pliku oraz pokazywać zrozumiałe komunikaty błędów.
- [ ] Dodać panel wydajności: FPS, pamięć GPU i liczba aktywnych splatów.
- [ ] Dodać sterowanie kamerą: obrót, przesuwanie, przybliżanie, reset i zapis ustawień widoku.
- [ ] Zapewnić interfejs awaryjny bez WebGL2 i WebGPU.
- [ ] Dodać test podstawowy inicjalizacji przeglądarki 3DGS.

## Zrealizowane

### Porządkowanie repozytorium

- [x] Dodać główny `README.md` i opisać strukturę katalogów.
- [x] Skonsolidować dokumentację Service Workera w `docs/sw-manual-checklist.md`.
- [x] Przenieść narzędzie Liquid/JSX do `scripts/fix-liquid-jsx.py`.
- [x] Przenieść dokumentację Supabase do `docs/`, a skrypt SQL do `database/`.
- [x] Ograniczyć katalog główny do punktów wejścia, metadanych i konfiguracji narzędzi.
- [x] Zaktualizować dokumentację architektury po zmianie ścieżek.
- [x] Naprawić inicjalizację ZAL po przeniesieniu banku pytań.
- [x] Dodać brakujący wskaźnik stanu połączenia i potwierdzić start PWA offline.

### Zakończone poprawki jakości

- [x] Usunąć podwójne tworzenie paska postępu przewijania i dodać test regresyjny.
- [x] Ujednolicić język wpisów w `learningPaths`.
- [x] Poprawić komentarz testu `tests/e2e/mobilehub-flow.spec.js`.
- [x] Rozszerzyć test offline o treść strony awaryjnej i powrót po odzyskaniu sieci.

## Kolejność realizacji

1. P0.1: pełna weryfikacja po reorganizacji i decyzja o starych adresach.
2. P0.2: ścieżki PWA, graf zasobów pamięci podręcznej i aktualizacja aplikacji.
3. P0.3 oraz P0.4: wykłady live i główne przepływy mobilne.
4. P1.1 oraz P1.2: kontrakty danych i bezpieczeństwo renderowania.
5. P1.3, P1.4 oraz P1.5: dostępność, CI i jakość artykułów.
6. P1.6 oraz P2.1 do P2.4: utrzymanie struktury i długu technicznego.
7. P2.5: rozwój modułu 3DGS.

## Kryteria gotowości wydania

- [ ] `npm run qa` kończy się sukcesem.
- [ ] Wszystkie publiczne strony działają bez błędów 404 w katalogu głównym i podkatalogu.
- [ ] Kluczowe scenariusze E2E przechodzą na widoku desktopowym i mobilnym.
- [ ] Instalacja, uruchomienie offline i aktualizacja PWA działają w obsługiwanych przeglądarkach.
- [ ] Audyt Lighthouse nie zgłasza krytycznych problemów z wydajnością, dostępnością ani dobrymi praktykami.
- [ ] Renderowanie Markdown nie umożliwia wykonania niebezpiecznego kodu.
- [ ] Dokumentacja i mapa struktury repozytorium są zgodne z kodem.
- [ ] Każda naprawa ma test albo możliwy do powtórzenia scenariusz weryfikacji.
