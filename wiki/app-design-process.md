# Proces Projektowania Aplikacji Mobilnej — Od Briefu do Dokumentacji Technicznej

Każda profesjonalna aplikacja mobilna zaczyna się nie od kodu, lecz od dokumentów, które porządkują myślenie, komunikują wizję interesariuszom i dają zespołowi deweloperów jednoznaczny punkt odniesienia. Ten artykuł wyjaśnia, czym są — i jak krok po kroku tworzyć — cztery kluczowe dokumenty procesu projektowego: **Brief Aplikacji**, **BRD** (Business Requirements Document), **FRD** (Functional Requirements Document) oraz **TRD** (Technical Requirements Document).

## Dlaczego dokumentacja jest kluczowa

```
Brak dokumentacji          Z dokumentacją
─────────────────          ───────────────────
  Wizja w głowie PM  →     Brief = wspólna wizja
  „Zróbmy to ładnie"  →    BRD  = mierzalne cele biznesowe
  „Wiadomo co klikać"  →   FRD  = precyzyjne zachowania
  „Jakoś to napiszemy"  →  TRD  = architektura i stack
```

Bez dokumentacji decyzje podejmowane są ad hoc, a każdy członek zespołu wyobraża sobie inny produkt. Dokumenty nie istnieją „dla biurokracji" — istnieją po to, by **zmniejszyć ryzyko**, **przyspieszyć pracę** i **oszczędzić budżet** poprzez wczesne wykrycie niespójności.

> **Zasada:** Im wcześniej wykryjesz błąd w wymaganiach, tym taniej go naprawisz. Koszt zmiany rośnie wykładniczo — błąd znaleziony po wdrożeniu jest nawet 100× droższy niż ten sam błąd wychwycony na etapie briefu.

---

## Brief Aplikacji

### Czym jest brief

Brief to **pierwszy, syntetyczny dokument**, który definiuje ideę aplikacji w sposób zrozumiały dla każdego — od inwestora, przez projektanta, po programistę. Nie jest specyfikacją techniczną; jest **mapą drogową wizji**.

Dlaczego brief, a nie od razu specyfikacja? Bo zanim zaczniemy precyzować szczegóły, musimy upewnić się, że wszyscy rozumieją **ten sam problem** i **ten sam cel**. Brief zmusza autora do klarownego myślenia i eliminuje założenia ukryte.

### Struktura dobrego briefu

```
BRIEF APLIKACJI MOBILNEJ
═══════════════════════════════════════════════════════

1. NAZWA ROBOCZA
   → Krótka, łatwa do zapamiętania (może się zmienić)

2. OPIS PROBLEMU
   → Jaki realny problem rozwiązuje aplikacja?
   → Dlaczego istniejące rozwiązania są niewystarczające?

3. GRUPA DOCELOWA
   → Kim są użytkownicy? (wiek, zawód, nawyki technologiczne)
   → W jakim kontekście używają telefonu?

4. CELE BIZNESOWE
   → Co chcemy osiągnąć? (np. 10 000 pobrań w 3 miesiące)
   → Jak zarabiamy? (freemium, subskrypcja, reklamy, jednorazowa opłata)

5. KLUCZOWE FUNKCJONALNOŚCI (max 5–7)
   → Lista najważniejszych features — bez szczegółów technicznych
   → Priorytetyzacja: Must Have / Should Have / Nice to Have

6. PLATFORMY
   → Android / iOS / Cross-platform?
   → Minimum OS version?

7. KONKURENCJA
   → 2–3 aplikacje konkurencyjne + co robimy lepiej

8. BUDŻET I HARMONOGRAM
   → Ramy czasowe i finansowe (choćby orientacyjne)

9. KRYTERIA SUKCESU
   → Po czym poznamy, że aplikacja odniosła sukces?
```

### Dlaczego brief ma taką strukturę

Każda sekcja briefu odpowiada na pytanie, które **i tak pojawi się** w trakcie projektu. Definiując je z góry:

- **Opis problemu** zapobiega budowaniu rozwiązania szukającego problemu (tzw. „solution looking for a problem").
- **Grupa docelowa** wymusza empatię — projektujemy dla konkretnych ludzi, nie abstrakcyjnych „użytkowników".
- **Kluczowe funkcjonalności ograniczone do 5–7** chronią przed *feature creep* — zjawiskiem niekontrolowanego rozrastania się zakresu.
- **Kryteria sukcesu** umożliwiają obiektywną ocenę, czy projekt się powiódł.

### Przykład briefu

```
BRIEF: FitTrack — Aplikacja do Śledzenia Aktywności Fizycznej
═══════════════════════════════════════════════════════════════

PROBLEM:
  Istniejące trackery są przeładowane funkcjami i zniechęcają
  początkujących. Użytkownicy rezygnują po 2 tygodniach.

GRUPA DOCELOWA:
  Osoby 25–40 lat, początkujący w aktywności fizycznej,
  smartfon z Android 12+ lub iOS 16+.

CELE BIZNESOWE:
  • 10 000 aktywnych użytkowników miesięcznie po 6 miesiącach
  • Model freemium: podstawowe funkcje za darmo, plan Pro za 19,99 PLN/mies.

KLUCZOWE FUNKCJONALNOŚCI:
  1. [Must Have]  Śledzenie kroków i dystansu (GPS + akcelerometr)
  2. [Must Have]  Dziennik treningów z historią
  3. [Must Have]  Prosty onboarding (3 ekrany)
  4. [Should Have] Cele tygodniowe z powiadomieniami motywacyjnymi
  5. [Should Have] Integracja z Google Fit / Apple Health
  6. [Nice to Have] Wyzwania społecznościowe

PLATFORMY:
  Android (min API 31) + iOS (min 16.0), Flutter

KONKURENCJA:
  • Strava — za dużo funkcji dla początkujących
  • Google Fit — brak motywacji i gamifikacji
  → FitTrack: prostota + motywacja = retencja

BUDŻET: 80 000–120 000 PLN | CZAS: MVP w 4 miesiące

SUKCES: retencja D30 > 25%, ocena w sklepie ≥ 4.2
```

---

## BRD — Business Requirements Document

### Czym jest BRD

BRD to dokument, który **tłumaczy wizję z briefu na język biznesu**. Odpowiada na pytanie: *„Dlaczego budujemy ten produkt i jakie korzyści biznesowe przyniesie?"*

Dlaczego osobny dokument, a nie rozszerzony brief? Bo brief jest skierowany do **wszystkich**, a BRD do **decydentów biznesowych** (stakeholders, zarząd, inwestorzy). BRD musi uzasadnić inwestycję liczbami, analizami i mierzalnymi KPI.

### Struktura BRD

```
BUSINESS REQUIREMENTS DOCUMENT
═══════════════════════════════════════════════════════

1. STRESZCZENIE WYKONAWCZE (Executive Summary)
   → 1 strona: co, dlaczego, dla kogo, ile to kosztuje

2. KONTEKST BIZNESOWY
   → Analiza rynku (TAM, SAM, SOM)
   → Trendy branżowe
   → Obecna sytuacja firmy/organizacji

3. CELE BIZNESOWE I KPI
   → Cel główny + cele szczegółowe
   → Metryki sukcesu: DAU, MAU, Revenue, CAC, LTV, Churn Rate

4. ZAKRES PROJEKTU
   → Co jest IN SCOPE (wchodzi w zakres projektu)
   → Co jest OUT OF SCOPE (świadomie pomijamy)
   → Dlaczego takie granice — uzasadnienie

5. INTERESARIUSZE (Stakeholders)
   → Kto decyduje, kto używa, kto płaci
   → Macierz RACI (Responsible, Accountable, Consulted, Informed)

6. WYMAGANIA BIZNESOWE
   → Lista wymagań z priorytetami (MoSCoW)
   → Każde wymaganie = identyfikator + opis + uzasadnienie

7. OGRANICZENIA I ZAŁOŻENIA
   → Budżet, czas, regulacje prawne, zależności zewnętrzne
   → Założenia, które muszą być prawdziwe, aby projekt się powiódł

8. ANALIZA RYZYK
   → Ryzyka biznesowe + plan mitygacji
   → Matryca prawdopodobieństwo × wpływ

9. HARMONOGRAM WYSOKOPOZIOMOWY
   → Kamienie milowe (milestones), nie szczegółowy Gantt
```

### Dlaczego BRD wygląda właśnie tak

- **Executive Summary na początku** — decydenci często czytają tylko pierwszą stronę. Musi ona zawierać esencję całego dokumentu.
- **Analiza rynku (TAM/SAM/SOM)** — bez danych rynkowych nie da się uzasadnić inwestycji. TAM (Total Addressable Market) pokazuje potencjał, SOM (Serviceable Obtainable Market) pokazuje realistyczny cel.
- **IN SCOPE / OUT OF SCOPE** — jawne określenie granic zapobiega nieporozumieniom. Równie ważne jest powiedzenie, czego **nie robimy**, jak tego, co robimy.
- **Macierz RACI** — eliminuje syndrom „myślałem, że to twoja odpowiedzialność". Każda osoba wie, za co odpowiada.
- **MoSCoW** (Must / Should / Could / Won't) — priorytetyzacja wymagań chroni przed próbą zrobienia wszystkiego naraz.

### Przykładowe wymaganie biznesowe w BRD

```
┌──────────────────────────────────────────────────────────┐
│  ID:        BR-004                                       │
│  Tytuł:     System powiadomień motywacyjnych             │
│  Priorytet: Should Have                                  │
│  Opis:      Aplikacja wysyła push notification           │
│             z motywacyjnym komunikatem, gdy użytkownik    │
│             nie był aktywny przez 48h.                    │
│  Uzasadnienie: Badania pokazują, że powiadomienia        │
│             zwiększają retencję D30 o 15–20%.            │
│  KPI:       Retencja D30 > 25%                           │
│  Zależności: BR-001 (rejestracja), BR-002 (tracking)     │
└──────────────────────────────────────────────────────────┘
```

### Analiza rynku w BRD — przykład

```
Analiza rynku fitness apps (2024):
──────────────────────────────────
TAM (Total Addressable Market):
  Globalny rynek aplikacji fitness = $14.7 mld (2024)

SAM (Serviceable Available Market):
  Rynek PL + CEE, użytkownicy smartfonów 25–40 lat = ~$120 mln

SOM (Serviceable Obtainable Market):
  Realistyczny cel Year 1: 0.5% SAM = ~$600 000

Uzasadnienie:
  → Rynek rośnie ~14% CAGR
  → Segment "prostych trackerów" niedostatecznie obsłużony
  → Niski koszt wejścia dzięki Flutter (jedna baza kodu)
```

---

## FRD — Functional Requirements Document

### Czym jest FRD

FRD to dokument, który **przekłada wymagania biznesowe na konkretne zachowania systemu**. Odpowiada na pytanie: *„Co dokładnie aplikacja robi z perspektywy użytkownika?"*

Dlaczego nie wystarczy BRD? Bo BRD mówi *„potrzebujemy systemu powiadomień"*, a FRD precyzuje *„po 48h braku aktywności system wysyła push z tekstem X, użytkownik może kliknąć Y, co przenosi go do ekranu Z"*. FRD jest pomostem między biznesem a technologią.

### Struktura FRD

```
FUNCTIONAL REQUIREMENTS DOCUMENT
═══════════════════════════════════════════════════════

1. WSTĘP
   → Cel dokumentu
   → Odniesienie do BRD (numery wymagań biznesowych)
   → Słownik pojęć (Glossary)

2. AKTORZY SYSTEMU
   → Kim są użytkownicy? (role: Guest, User, Admin)
   → Systemy zewnętrzne (API, serwisy trzecie)

3. PRZYPADKI UŻYCIA (Use Cases)
   → Diagramy Use Case (UML)
   → Scenariusze główne i alternatywne
   → Warunki wstępne i końcowe (pre/post conditions)

4. WYMAGANIA FUNKCJONALNE
   → Identyfikator (FR-001, FR-002...)
   → Powiązanie z wymaganiem biznesowym (BR-xxx)
   → Opis zachowania systemu
   → Kryteria akceptacji (Acceptance Criteria)
   → Reguły biznesowe (Business Rules)

5. WYMAGANIA DOTYCZĄCE DANYCH
   → Jakie dane zbiera/przetwarza aplikacja
   → Walidacje pól (format, długość, zakres)
   → Relacje między encjami

6. WYMAGANIA INTERFEJSU UŻYTKOWNIKA
   → Makiety (wireframes) lub odniesienia do Figma
   → Opisy ekranów i przepływów (user flows)
   → Stany ekranów: loading, empty, error, success

7. WYMAGANIA INTEGRACYJNE
   → API zewnętrzne (Google Fit, Apple Health, Firebase)
   → Formaty danych (JSON, Protocol Buffers)
   → Obsługa błędów integracji

8. WYMAGANIA NIEFUNKCJONALNE
   → Wydajność (czas odpowiedzi < 2s)
   → Dostępność (WCAG 2.1 AA)
   → Bezpieczeństwo (szyfrowanie, autoryzacja)
   → Skalowalność (obsługa N jednoczesnych użytkowników)
```

### Dlaczego FRD jest tak szczegółowy

- **Use Cases ze scenariuszami alternatywnymi** — sam happy path nie wystarczy. Co jeśli użytkownik nie ma internetu? Co jeśli GPS jest wyłączony? Scenariusze alternatywne i wyjątkowe ujawniają 80% pracy programistycznej.
- **Kryteria akceptacji** — bez nich tester nie wie, kiedy feature jest „gotowy". Kryteria akceptacji to obiektywna miara ukończenia.
- **Stany ekranów (loading, empty, error, success)** — początkujący projektanci myślą tylko o „happy state". Profesjonalny FRD wymusza przemyślenie wszystkich stanów, bo to one decydują o jakości UX.
- **Wymagania niefunkcjonalne w FRD** — choć mogłyby być w osobnym dokumencie, umieszczenie ich tutaj zapewnia, że projektant i deweloper widzą je w kontekście funkcjonalności.

### Przykładowy Use Case

```
UC-003: Rozpoczęcie treningu biegowego
══════════════════════════════════════

Aktor główny: Zalogowany użytkownik (rola: User)
Warunek wstępny: Użytkownik jest zalogowany, GPS włączony
Powiązanie: BR-001 (tracking aktywności)

SCENARIUSZ GŁÓWNY:
  1. Użytkownik otwiera ekran „Nowy trening"
  2. System wyświetla listę typów aktywności
  3. Użytkownik wybiera „Bieganie"
  4. System prosi o dostęp do lokalizacji (jeśli nie udzielono wcześniej)
  5. Użytkownik przyznaje uprawnienie
  6. System wyświetla ekran treningu z mapą i licznikami:
     • Czas trwania (mm:ss)
     • Dystans (km, 2 miejsca dziesiętne)
     • Tempo (min/km)
  7. Użytkownik naciska „Start"
  8. System rozpoczyna tracking GPS i aktualizuje dane co 1s
  9. Użytkownik naciska „Stop"
  10. System wyświetla podsumowanie treningu

SCENARIUSZE ALTERNATYWNE:
  4a. GPS wyłączony:
      → System wyświetla dialog: „Włącz GPS, aby śledzić trasę"
      → Przycisk „Otwórz ustawienia" / „Trenuj bez GPS"
      → Bez GPS: tracking tylko kroków (akcelerometr)

  8a. Utrata sygnału GPS:
      → System kontynuuje tracking z ostatniej znanej pozycji
      → Wskaźnik „Słaby sygnał GPS" na ekranie
      → Po odzyskaniu sygnału: interpolacja trasy

  8b. Aplikacja przechodzi w tło:
      → Tracking kontynuowany przez Foreground Service (Android)
        / Background Location (iOS)
      → Powiadomienie stałe: „Trening w toku — 12:34, 2.5 km"

WARUNEK KOŃCOWY:
  Trening zapisany w lokalnej bazie z danymi GPS, czasem, dystansem.
  Synchronizacja z backendem przy najbliższym połączeniu.
```

### Przykładowe wymaganie funkcjonalne

```
┌──────────────────────────────────────────────────────────┐
│  ID:        FR-012                                       │
│  Tytuł:     Walidacja formularza rejestracji             │
│  Źródło:    BR-001 (rejestracja użytkownika)             │
│  Priorytet: Must Have                                    │
│                                                          │
│  Opis:                                                   │
│  System waliduje dane rejestracyjne w czasie rzeczywistym│
│  (inline validation) i blokuje wysłanie formularza       │
│  do momentu spełnienia wszystkich reguł.                 │
│                                                          │
│  Reguły biznesowe:                                       │
│  • Email: format RFC 5322, unikalny w systemie           │
│  • Hasło: min. 8 znaków, 1 wielka, 1 cyfra, 1 specjalny│
│  • Nick: 3–20 znaków, [a-zA-Z0-9_], unikalny            │
│                                                          │
│  Kryteria akceptacji:                                    │
│  ✓ Błędne pole podświetlone na czerwono z komunikatem    │
│  ✓ Poprawne pole oznaczone zielonym checkmarkiem         │
│  ✓ Przycisk „Zarejestruj" nieaktywny do spełnienia reguł│
│  ✓ Duplikat emaila → komunikat „Email już zarejestrowany"│
│  ✓ Walidacja działa offline (oprócz unikalności)         │
└──────────────────────────────────────────────────────────┘
```

---

## TRD — Technical Requirements Document

### Czym jest TRD

TRD to dokument **dla zespołu technicznego**, który określa *jak* system zostanie zbudowany. Odpowiada na pytanie: *„Jaką architekturę, technologie i infrastrukturę zastosujemy i dlaczego?"*

Dlaczego TRD jest osobnym dokumentem? Bo **decyzje techniczne wymagają innego kontekstu niż biznesowe i funkcjonalne**. Product Owner nie musi wiedzieć, czy używamy REST czy GraphQL, ale CTO — tak. TRD izoluje decyzje techniczne od wymagań biznesowych, co ułatwia ich niezależną ewolucję.

### Struktura TRD

```
TECHNICAL REQUIREMENTS DOCUMENT
═══════════════════════════════════════════════════════

1. PRZEGLĄD TECHNICZNY
   → Cel systemu z perspektywy technicznej
   → Odniesienie do FRD
   → Ograniczenia technologiczne

2. ARCHITEKTURA SYSTEMU
   → Diagram architektury wysokopoziomowej
   → Wzorzec architektoniczny (MVVM, Clean Architecture, MVI)
   → Podział na moduły/warstwy
   → Komunikacja między komponentami

3. STACK TECHNOLOGICZNY
   → Język programowania + wersja
   → Framework (Flutter, Kotlin, SwiftUI)
   → Biblioteki (z uzasadnieniem wyboru)
   → Backend (Firebase, Supabase, własny)
   → Baza danych (Room, CoreData, Hive, Drift)

4. ARCHITEKTURA DANYCH
   → Model danych (ERD — Entity Relationship Diagram)
   → Schemat bazy lokalnej
   → Strategia synchronizacji (offline-first?)
   → Migracje schematu

5. SPECYFIKACJA API
   → Endpointy (REST / GraphQL)
   → Formaty żądań i odpowiedzi
   → Autentykacja (JWT, OAuth2, Firebase Auth)
   → Rate limiting i error handling

6. BEZPIECZEŃSTWO
   → Szyfrowanie danych (at rest, in transit)
   → Zarządzanie kluczami i sekretami
   → Zasada minimalnych uprawnień (PoLP)
   → Compliance (RODO, HIPAA jeśli dotyczy)

7. WYDAJNOŚĆ I SKALOWALNOŚĆ
   → Wymagania wydajnościowe (cold start < 3s, API < 200ms)
   → Strategia cache (HTTP cache, in-memory, disk)
   → CDN dla zasobów statycznych
   → Plan skalowania backendu

8. CI/CD I DEVOPS
   → Pipeline (GitHub Actions, Bitrise, Codemagic)
   → Strategia branchowania (Git Flow, Trunk-Based)
   → Automatyczne testy (unit, widget, integration)
   → Dystrybucja (Firebase App Distribution, TestFlight)

9. MONITORING I OBSERVABILITY
   → Crashlytics / Sentry
   → Analytics (Firebase Analytics, Mixpanel)
   → Logi (structured logging)
   → Alerty (crash rate > 1%, API errors > 5%)

10. ŚRODOWISKA
    → Dev / Staging / Production
    → Konfiguracja per środowisko (flavors / schemes)
    → Zarządzanie zmiennymi środowiskowymi
```

### Dlaczego TRD jest tak rozbudowany

- **Uzasadnienie wyboru technologii** — sam wybór „Flutter" nie wystarczy. TRD musi wyjaśnić *dlaczego* Flutter, a nie Kotlin + SwiftUI natywnie. To chroni przed późniejszym kwestionowaniem decyzji.
- **Architektura danych oddzielnie** — model danych to fundament aplikacji. Błąd w schemacie bazy jest ekstremalnie kosztowny do naprawienia po wdrożeniu, dlatego zasługuje na osobną sekcję z ERD.
- **CI/CD w dokumencie technicznym** — bo pipeline wpływa na szybkość iteracji. Zespół bez CI/CD traci godziny na ręczne budowanie i testowanie.
- **Środowiska Dev/Staging/Prod** — bo testowanie na produkcji to proszenie się o katastrofę. Każde środowisko ma swoją konfigurację, klucze API i bazę danych.

### Przykład decyzji architektonicznej w TRD

```
DECYZJA: TD-002 — Wzorzec architektoniczny
══════════════════════════════════════════

Wybór: Clean Architecture + MVVM

Rozważane alternatywy:
  1. MVC    → ❌ Massive View Controller problem w iOS
  2. MVP    → ⚠️ Dużo boilerplate, testowalne ale verbose
  3. MVVM   → ✅ Reaktywne bindowanie, dobra testowalność
  4. MVI    → ⚠️ Nadmierna złożoność dla tego zakresu

Uzasadnienie:
  → MVVM naturalnie integruje się z Flutter (ChangeNotifier/Riverpod)
  → Clean Architecture wymusza separację warstw:
    • Domain (entities, use cases) — zero zależności
    • Data (repositories, data sources) — implementacja
    • Presentation (widgets, view models) — UI
  → Testowalność: use cases testowane bez UI, VM bez sieci

Konsekwencje:
  → Więcej plików niż w monolicie (trade-off akceptowalny)
  → Krzywa uczenia się dla juniorów (~1 tydzień)
  → Łatwiejsze utrzymanie i rozbudowa w perspektywie 12+ mies.
```

### Przykład stosu technologicznego w TRD

```
STACK TECHNOLOGICZNY — FitTrack
═══════════════════════════════

Mobile:
  ├── Język:       Dart 3.2+
  ├── Framework:   Flutter 3.19+
  ├── State:       Riverpod 2.x
  ├── Nawigacja:   GoRouter 13.x
  ├── HTTP:        Dio 5.x
  ├── Baza lokalna: Drift (SQLite) 2.x
  ├── DI:          injectable + get_it
  └── Testy:       flutter_test, mockito, integration_test

Backend:
  ├── Firebase Auth (email + Google Sign-In)
  ├── Cloud Firestore (dane treningów)
  ├── Cloud Functions (Node.js 20 — logika biznesowa)
  ├── Cloud Storage (zdjęcia profilowe)
  └── Firebase Cloud Messaging (push notifications)

CI/CD:
  ├── GitHub Actions (build + test + lint)
  ├── Codemagic (budowanie AAB/IPA)
  ├── Firebase App Distribution (beta testy)
  └── Fastlane (automatyczna publikacja do sklepów)

Monitoring:
  ├── Firebase Crashlytics
  ├── Firebase Analytics
  ├── Firebase Performance Monitoring
  └── Sentry (dodatkowe logowanie błędów)
```

---

## Przepływ dokumentów — od briefu do kodu

```
┌─────────┐     ┌─────────┐     ┌─────────┐     ┌─────────┐
│  BRIEF  │────▶│   BRD   │────▶│   FRD   │────▶│   TRD   │
│         │     │         │     │         │     │         │
│ WIZJA   │     │ BIZNES  │     │ FUNKCJE │     │ TECHNIKA│
│ PROBLEMU│     │ I CEL   │     │ I UX    │     │ I KOD   │
└─────────┘     └─────────┘     └─────────┘     └─────────┘
    │               │               │               │
    │               │               │               │
    ▼               ▼               ▼               ▼
  Klient        Stakeholders    Projektanci     Deweloperzy
  Inwestor      Zarząd          UX/UI           Backend/Mobile
  PM            Marketing       Testerzy        DevOps
```

Dokumenty tworzą **kaskadę coraz większej szczegółowości**:

| Dokument | Pytanie | Odbiorca | Szczegółowość |
|----------|---------|----------|---------------|
| **Brief** | *Co i dlaczego?* | Wszyscy | Niska — zarys |
| **BRD** | *Jaki cel biznesowy?* | Decydenci | Średnia — metryki, rynek |
| **FRD** | *Jak działa z perspektywy usera?* | Projektanci, QA | Wysoka — scenariusze |
| **TRD** | *Jak to zbudować?* | Deweloperzy, DevOps | Bardzo wysoka — kod, infra |

### Dlaczego taka kolejność, a nie inna

Kolejność Brief → BRD → FRD → TRD nie jest przypadkowa. Każdy dokument **bazuje na poprzednim**:

1. **Brief** ustala kontekst — bez niego BRD nie ma punktu wyjścia.
2. **BRD** definiuje *co* jest wartościowe — bez niego FRD opisywałby funkcje bez uzasadnienia biznesowego.
3. **FRD** opisuje *co* system robi — bez niego TRD definiowałby architekturę bez zrozumienia wymagań.
4. **TRD** mówi *jak* to zbudować — a to ma sens dopiero, gdy wiemy *co* i *po co*.

Odwrócenie kolejności (np. zaczynanie od TRD) prowadzi do **over-engineeringu** — budowania złożonej architektury przed zrozumieniem, czy w ogóle jest potrzebna.

---

## Najczęstsze błędy w dokumentacji projektowej

```
BŁĄD                                    ROZWIĄZANIE
────────────────────────────────────    ─────────────────────────────────
Brief bez problemu                      Zacznij od „Jaki problem rozwiązuję?"
BRD bez danych rynkowych                Dodaj TAM/SAM/SOM, nawet szacunkowe
FRD opisuje tylko happy path            Dodaj scenariusze alternatywne i error
TRD bez uzasadnienia wyboru techno      Opisz rozważane alternatywy i trade-offy
Dokumenty pisane „raz na zawsze"        Wersjonuj (Git), aktualizuj, oznaczaj datę
Brak traceability                       Każde FR → BR, każde TD → FR
Za dużo tekstu, za mało diagramów       Dodaj schematy: architektura, ERD, flow
Dokumenty w Wordzie na dysku            Używaj Markdown + Git lub Confluence
```

---

## Narzędzia do tworzenia dokumentacji

```
Typ dokumentu          Rekomendowane narzędzia
──────────────────     ─────────────────────────────────────
Brief                  Google Docs, Notion, Markdown
BRD                    Confluence, Notion, Google Docs
FRD                    Confluence + draw.io, Notion, Figma (wireframes)
TRD                    Markdown + Git, Confluence, Arc42
Diagramy               draw.io, Mermaid, PlantUML, Lucidchart
Prototypy UI           Figma, Sketch, Adobe XD
Zarządzanie            Jira, Linear, Trello (powiązanie z wymaganiami)
```

---

## Podsumowanie

Proces projektowania aplikacji mobilnej to **nie tylko kod i piksele**. To przede wszystkim **myślenie, dokumentowanie i komunikacja**. Cztery dokumenty — Brief, BRD, FRD i TRD — stanowią szkielet każdego profesjonalnego projektu:

- **Brief** łączy wizję z rzeczywistością.
- **BRD** przekłada wizję na mierzalne cele biznesowe.
- **FRD** zamienia cele biznesowe w konkretne zachowania systemu.
- **TRD** definiuje, jak te zachowania zostaną technicznie zrealizowane.

Każdy z tych dokumentów istnieje z konkretnego powodu i każdy odpowiada innej grupie odbiorców. Pominięcie któregokolwiek zwiększa ryzyko — nieporozumień, przekroczenia budżetu i dostarczenia produktu, którego nikt nie potrzebuje.

> **Pamiętaj:** Dokumentacja to nie biurokracja — to inwestycja w jakość, przewidywalność i spokój ducha całego zespołu.
