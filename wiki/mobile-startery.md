# Startery mobilne — Android, iOS, Flutter i React Native

> Dokument do szybkiego startu zespołu projektowego na laboratoriach i w projektach R&D.

## 1. Katalog starterów

### 1.1 Android (Kotlin + Jetpack Compose)

**Dla kogo:** zespoły celujące w natywną wydajność Android i pełny dostęp do API systemowych.

**Szybki setup (fresh clone):**

```bash
# Wymagania: Android Studio (najnowsze stable), JDK 17, Android SDK
# 1) Klon
git clone <REPO_URL>
cd <PROJECT_DIR>

# 2) Build i test
./gradlew clean test

# 3) Uruchomienie debug
./gradlew installDebug
```

**Proponowana architektura:**
- UI (Compose + ViewModel)
- Domain (use-case’y, reguły biznesowe)
- Data (repozytoria, Room/REST)
- DI (Hilt/Koin)
- Moduły: `app`, `core`, `feature-*`

**Typowe błędy konfiguracyjne (uwaga):**
- Niezgodna wersja JDK i AGP/Gradle (objaw: błędy sync/build).
- Brak `google()`/`mavenCentral()` w repozytoriach Gradle.
- `minSdk` zbyt niskie względem użytych bibliotek.
- Brak ustawionej zmiennej `ANDROID_HOME`/SDK path na nowej maszynie.

**Powiązane artykuły wiki:**
- [Android Studio](./android-studio.md)
- [Architektura Android](./android-architecture.md)
- [Android Testing](./android-testing.md)
- [Android Ecosystem](./android-ecosystem.md)

**Powiązane laboratoria:**
- `zajecia/laby/kotlin.pdf`

---

### 1.2 iOS (Swift + SwiftUI)

**Dla kogo:** zespoły budujące natywne aplikacje iOS z naciskiem na UX i integrację z Apple ecosystem.

**Szybki setup (fresh clone):**

```bash
# Wymagania: Xcode stable, CocoaPods/SPM, iOS Simulator
# 1) Klon
git clone <REPO_URL>
cd <PROJECT_DIR>

# 2) Instalacja zależności (gdy używany CocoaPods)
pod install

# 3) Uruchomienie testów
xcodebuild test -scheme <SCHEME> -destination 'platform=iOS Simulator,name=iPhone 15' # Dostosuj nazwę do dostępnego symulatora
```

**Proponowana architektura:**
- UI (SwiftUI + ObservableObject / @StateObject)
- Domain (services/use-case)
- Data (URLSession, Core Data/SwiftData)
- Koordynacja nawigacji (Coordinator pattern)

**Typowe błędy konfiguracyjne (uwaga):**
- Otwieranie `.xcodeproj` zamiast `.xcworkspace` przy CocoaPods.
- Niespójny deployment target między targetami i bibliotekami.
- Brak zaakceptowanej licencji Xcode CLI tools na nowym środowisku.
- Niezgodna wersja Xcode wobec wymagań SDK (build errors).

**Powiązane artykuły wiki:**
- [Xcode iOS](./xcode-ios.md)
- [iOS Ecosystem](./ios-ecosystem.md)
- [iOS Data](./ios-data.md)
- [iOS Networking](./ios-networking.md)

**Powiązane laboratoria:**
- Materiały iOS realizuj równolegle z laboratorium projektowym (brak dedykowanego pliku iOS w `zajecia/laby/`).

---

### 1.3 Flutter (Dart)

**Dla kogo:** zespoły chcące jeden codebase na Android/iOS z szybkim prototypowaniem UI.

**Szybki setup (fresh clone):**

```bash
# Wymagania: Flutter SDK (stable), Android/iOS toolchain, emulator/simulator
# 1) Klon
git clone <REPO_URL>
cd <PROJECT_DIR>

# 2) Weryfikacja środowiska
flutter doctor

# 3) Instalacja i test
flutter pub get
flutter test

# 4) Uruchomienie debug
flutter run
```

**Proponowana architektura:**
- Feature-first folders
- State management: Riverpod/BLoC
- Warstwy: presentation / domain / data
- Repozytoria i serwisy wydzielone do `core/`

**Typowe błędy konfiguracyjne (uwaga):**
- Brak akceptacji licencji Android SDK (`flutter doctor --android-licenses`).
- Konflikt wersji Gradle/Kotlin po aktualizacji Fluttera.
- Niepodpięty provisioning profile dla iOS build.
- Nadmierne trzymanie logiki biznesowej w widgetach UI.

**Powiązane artykuły wiki:**
- [Flutter Advanced](./flutter-advanced.md)
- [Cross-platform](./cross-platform.md)
- [Mobile Performance](./mobile-performance.md)
- [App Distribution](./app-distribution.md)

**Powiązane laboratoria:**
- `zajecia/laby/flutter.pdf`

---

### 1.4 React Native (TypeScript)

**Dla kogo:** zespoły z mocnym backgroundem webowym, które chcą szybciej dowozić funkcje mobile.

**Szybki setup (fresh clone):**

```bash
# Wymagania: Node LTS, npm/yarn/pnpm, Android/iOS toolchain
# 1) Klon
git clone <REPO_URL>
cd <PROJECT_DIR>

# 2) Instalacja zależności
npm install

# 3) Start Metro + aplikacja
npm run start
npm run android
# lub
npm run ios
```

**Proponowana architektura:**
- Ekrany + nawigacja (React Navigation)
- Warstwa domenowa (services/use-cases)
- Data (API client, cache, storage)
- Stan globalny (Redux Toolkit/Zustand)

**Typowe błędy konfiguracyjne (uwaga):**
- Zbyt nowy Node względem wersji React Native (losowe błędy toolchaina).
- Brak `pod install` po zmianach natywnych i zależnościach iOS.
- Niezgodność wersji Gradle/AGP po update pakietów native.
- Błędy w aliasach TS/Babel (działa w IDE, nie działa w bundlerze).

**Powiązane artykuły wiki:**
- [React Native](./react-native.md)
- [Cross-platform](./cross-platform.md)
- [Mobile Design](./mobile-design.md)
- [App Updates](./app-updates.md)

**Powiązane laboratoria:**
- `zajecia/laby/react.pdf`

---

## 2. Checklista „pierwsze 60 minut projektu”

> Cel: po 60 minutach masz działający projekt debug, podstawową strukturę i automatyczne sanity-checki.

### 0–15 min — Setup środowiska
- [ ] Potwierdź wersje narzędzi (`java -version`, `node -v`, `flutter --version`, `xcodebuild -version`).
- [ ] Wykonaj pierwszy build debug na emulatorze/symulatorze.
- [ ] Zweryfikuj dostęp do sekretów (lokalnie przez `.env.local`, w CI przez secrets).

### 15–30 min — Struktura i architektura
- [ ] Utwórz moduły/foldery: `app`, `core`, `features`, `tests`, `docs`.
- [ ] Dodaj opis architektury w `README.md` (UI / Domain / Data + przepływ danych).
- [ ] Dodaj konwencję branchy i commitów (np. `feat/*`, `fix/*`, Conventional Commits).

### 30–45 min — CI i jakość
- [ ] Dodaj pipeline CI uruchamiający: lint + testy jednostkowe + build debug.
- [ ] Ustaw minimalne quality gates (build musi przejść, testy smoke muszą przejść).
- [ ] Dodaj automatyczną walidację formatowania (np. ktlint/swiftformat/eslint/dart format).

### 45–60 min — Smoke testy i release debug
- [ ] Przygotuj 3 smoke scenariusze: uruchomienie, nawigacja, zapis/odczyt danych.
- [ ] Zapisz checklistę ręcznego testu na emulatorze/symulatorze.
- [ ] Wykonaj build „release debug” (wariant release z logowaniem developerskim lub staging config) i potwierdź, że aplikacja startuje.
- [ ] Opisz znane ryzyka konfiguracyjne dla użytego stacku.

**Dodatkowe materiały wiki do checklisty:**
- [Best Practices — checklisty do projektu](./best-practices-checklist.md)
- [Proces projektowania aplikacji](./app-design-process.md)
- [Projekt zaliczeniowy z laboratorium](./projekt-zaliczeniowy_z_laboratorium.md)
- [App Publishing](./app-publishing.md)
