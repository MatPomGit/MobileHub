# Egzamin Teoretyczny — Programowanie Aplikacji Mobilnych

Egzamin teoretyczny z przedmiotu **Programowanie Aplikacji Mobilnych (PAM)** sprawdza znajomość zagadnień omawianych na wykładach i laboratoriach. Egzamin odbywa się w sesji egzaminacyjnej i ma formę pisemną lub elektroniczną.

## Format egzaminu

| Element           | Szczegóły                                          |
|-------------------|----------------------------------------------------|
| Czas trwania      | 60 minut                                           |
| Forma             | Test jednokrotnego i wielokrotnego wyboru + pytania otwarte |
| Liczba pytań      | 40 pytań testowych + 3 pytania opisowe             |
| Materiały         | Egzamin zamknięty — bez notatek                    |
| Próg zaliczenia   | 51% punktów (26/50)                                |

### Struktura punktowa

```
Pytania testowe:  40 × 0,5 pkt = 20 pkt
Pytania opisowe:   3 × 10 pkt = 30 pkt
─────────────────────────────────────────
Łącznie:                       50 pkt
```

## Tematy egzaminacyjne

### 1. Systemy Operacyjne i Ekosystemy Mobilne

- Architektura systemu Android (Linux kernel, HAL, ART, warstwy aplikacji),
- Architektura iOS (XNU kernel, Core OS, Core Services, Media, Cocoa Touch),
- Cykl życia aplikacji Android — stany Activity i Fragment,
- Cykl życia aplikacji iOS — stany UIApplicationDelegate,
- Porównanie Android vs iOS: bezpieczeństwo, fragmentacja, dystrybucja.

### 2. Projektowanie Interfejsu Użytkownika

- Zasady Material Design 3 — kolory, typografia, komponenty,
- Wytyczne Human Interface Guidelines (Apple),
- Wzorce nawigacji — Bottom Navigation, Drawer, Tabs, Backstack,
- Dostępność (Accessibility) — WCAG, TalkBack, VoiceOver, contrast ratio,
- Responsive design i adaptacja do różnych rozmiarów ekranów.

### 3. Architektura Aplikacji Mobilnych

- Wzorzec MVC, MVP, MVVM — porównanie, zalety i wady,
- Clean Architecture — warstwy Presentation / Domain / Data,
- Repository Pattern — abstrakcja źródła danych,
- Dependency Injection — Hilt (Android), Swinject (iOS),
- SOLID — zasady i ich zastosowanie w mobile,
- Wzorce reaktywne — Flow, LiveData, Combine, RxSwift.

### 4. Programowanie Android (Kotlin / Jetpack)

- Kotlin — klasy data, sealed, korutyny (suspend, launch, async, flow),
- Jetpack Compose — composable, State, recomposition, side effects,
- ViewModel i StateFlow — zarządzanie stanem UI,
- Room — Entity, DAO, Database, relacje, migracje,
- Retrofit + OkHttp — REST API, interceptory, konwersja JSON,
- WorkManager — zadania w tle, Chain, Constraints,
- Navigation Component — NavGraph, NavController, deeplinki.

### 5. Programowanie iOS (Swift / SwiftUI)

- Swift — opcjonale, closures, protokoły, generics, async/await,
- SwiftUI — View, State, Binding, ObservableObject, EnvironmentObject,
- UIKit — UIViewController lifecycle, Auto Layout, Storyboard vs Code,
- CoreData — NSManagedObject, NSFetchRequest, NSPersistentContainer,
- URLSession — data task, async/await, Codable, JSONDecoder,
- Combine — Publisher, Subscriber, Operator, sink, assign.

### 6. Cross-Platform i PWA

- Flutter — Widget tree, StatelessWidget vs StatefulWidget, BLoC, Provider,
- React Native — komponenty, hooks, Redux, Metro bundler,
- Kotlin Multiplatform — shared code, expect/actual, KMP Mobile,
- PWA — Service Worker, Cache API, Web App Manifest, offline-first,
- Porównanie: wydajność, dostęp do natywnych API, community.

### 7. Obsługa Sensorów i Sprzętu

- Camera2 API / AVFoundation — preview, capture, analiza obrazu,
- GPS i geolokalizacja — uprawnienia, foreground vs background,
- Sensor Manager — akcelerometr, żyroskop, magnetometr,
- Biometria — BiometricPrompt (Android), LocalAuthentication (iOS),
- Bluetooth LE — GATT, charakterystyki, skanowanie, parowanie.

### 8. Sieć i Komunikacja

- REST API — metody HTTP, kody statusu, nagłówki, autentykacja JWT,
- WebSocket — połączenie full-duplex, zastosowania w real-time,
- MQTT — architektura broker/client, QoS levels, tematy,
- Firebase — Firestore, Realtime DB, FCM (push notifications),
- SSL Pinning i bezpieczeństwo komunikacji sieciowej.

### 9. Bezpieczeństwo Aplikacji Mobilnych

- OWASP Mobile Top 10 — najczęstsze zagrożenia,
- Bezpieczne przechowywanie danych — Keychain (iOS), Keystore (Android),
- Obfuskacja kodu — ProGuard/R8 (Android), Bitcode (iOS),
- Certificate Pinning — zapobieganie MITM,
- Uprawnienia — runtime permissions, principle of least privilege.

### 10. Testowanie Aplikacji Mobilnych

- Piramida testów — unit testy, integracyjne, UI (end-to-end),
- JUnit 4/5, MockK, Turbine — Android unit testing,
- Espresso, UI Automator — testy instrumentalne Android,
- XCTest, XCUITest — testy iOS,
- Firebase Test Lab, BrowserStack — chmurowe farmy urządzeń.

### 11. Wydajność i Optymalizacja

- Profilowanie — Android Profiler, Xcode Instruments,
- Zarządzanie pamięcią — garbage collection (ART), ARC (iOS),
- Renderowanie UI — 60/120 Hz, jank, overdraw, recomposition,
- Sieć — caching, kompresja, lazy loading, paginacja,
- Bateria — JobScheduler, WorkManager, tryb Doze.

## Przykładowe pytania testowe

### Pytania jednokrotnego wyboru

**1.** Który komponent Android odpowiada za komunikację między warstwą UI a warstwą danych, przeżywając rotację ekranu?

- a) Activity
- b) Fragment
- c) **ViewModel** ✓
- d) Service

---

**2.** Jaką zasadę MVVM łamie bezpośrednie wywoływanie repozytoriów z kodu Composable?

- a) Single Responsibility
- b) **Separation of Concerns** ✓
- c) Open/Closed
- d) Interface Segregation

---

**3.** Które z poniższych zdań opisuje POPRAWNIE właściwość `StateFlow` w Kotlinie?

- a) Nie przechowuje ostatniej wartości
- b) **Jest hot flow — zawsze emituje ostatnią wartość nowym subskrybentom** ✓
- c) Może emitować `null` jako wartość początkową bez określenia domyślnej
- d) Automatycznie anuluje się po rotacji ekranu

---

**4.** Co oznacza poziom QoS 2 w protokole MQTT?

- a) Wiadomość może nie dotrzeć
- b) Wiadomość dotrze co najmniej raz (możliwe duplikaty)
- c) **Wiadomość dotrze dokładnie raz** ✓
- d) Wiadomość jest szyfrowana end-to-end

---

**5.** W Flutter, który widget jest bezstanowy (stateless)?

- a) Checkbox
- b) TextField
- c) **Icon** ✓
- d) AnimatedContainer

### Pytania wielokrotnego wyboru

**6.** Które z poniższych są poprawne architektury stosowane w aplikacjach mobilnych? (zaznacz wszystkie właściwe)

- ☑ MVVM
- ☑ Clean Architecture
- ☑ MVI
- ☐ REST (to styl komunikacji, nie architektura aplikacji)
- ☑ MVP

---

**7.** Które elementy wchodzą w skład warstwy **data layer** w Clean Architecture?

- ☑ Repository Implementation
- ☑ Data Source (Remote / Local)
- ☐ ViewModel (to warstwa presentation)
- ☑ DTO / Entity Mapper
- ☑ API Service Interface

### Pytania opisowe — przykłady

**Pytanie opisowe 1:**
> Opisz architekturę MVVM w kontekście aplikacji Android z Jetpack Compose. Jakie klasy/komponenty tworzą każdą warstwę? Jak dane przepływają od bazy danych do ekranu użytkownika? Podaj przykład z kodem dla warstwy ViewModel.

**Pytanie opisowe 2:**
> Wyjaśnij różnicę między `suspend fun` a `Flow` w Kotlinie. Kiedy należy użyć każdego z nich? Podaj przykład zastosowania w kontekście komunikacji z REST API oraz nasłuchiwania zmian w lokalnej bazie danych Room.

**Pytanie opisowe 3:**
> Co to jest OWASP Mobile Top 10? Opisz trzy wybrane zagrożenia i przedstaw metody ich mitygacji w aplikacji Android lub iOS.

## Wskazówki do nauki

### Strategia przygotowania

1. **Zacznij od wykładów** — przejrzyj slajdy i notatki z każdego tematu,
2. **Korzystaj z tej bazy wiedzy** — każdy temat ma dedykowany artykuł z przykładami kodu,
3. **Ćwicz na przykładach** — samodzielnie wpisz i uruchom przykłady kodu,
4. **Powtarzaj aktywnie** — twórz własne fiszki, pytaj się siebie,
5. **Rozwiązuj ćwiczenia** — wróć do zadań z laboratoriów.

### Najczęstsze błędy studentów

| Błędne przekonanie | Poprawne podejście |
|--------------------|-------------------|
| Wystarczy znać API, nie architekturę | Architektura MVVM/Clean jest kluczowa |
| Room i SQLite to to samo | Room to ORM oparty na SQLite z wieloma udogodnieniami |
| `LiveData` i `StateFlow` są identyczne | Różnią się lifecycle awareness i zachowaniem przy braku obserwatorów |
| Flutter to zawsze wolniejszy od natywnego | Przy odpowiedniej optymalizacji różnica jest minimalna |
| MQTT = HTTP | MQTT to lekki protokół publish/subscribe, nie request/response |

### Polecane materiały do powtórki

- Artykuły w tej bazie wiedzy (szczególnie: Architektura Android, Kotlin Basics, Jetpack Compose)
- [Android Developers Guides](https://developer.android.com/guide)
- [Apple Developer Documentation](https://developer.apple.com/documentation/)
- [Kotlin Documentation](https://kotlinlang.org/docs/home.html)
- [Flutter Documentation](https://docs.flutter.dev/)
- Slajdy z wykładów i materiały z laboratoriów

> **Powodzenia!** Pamiętaj, że egzamin sprawdza rozumienie — nie pamięciowe odtwarzanie. Skup się na zrozumieniu *dlaczego* stosuje się dane wzorce, a nie tylko *jak* wyglądają.
