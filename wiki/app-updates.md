# Wypuszczanie Aktualizacji Własnej Aplikacji Mobilnej

Aktualizacja aplikacji mobilnej to nie tylko „wrzucenie nowej wersji" - to złożony proces obejmujący planowanie wersji, zarządzanie numeracją, wybór strategii wydania, komunikację z użytkownikami i monitoring po wdrożeniu. Dobre praktyki aktualizacyjne wpływają bezpośrednio na retencję, oceny w sklepie, stabilność produktu oraz zaufanie użytkowników.

W tym artykule poznasz pełny cykl życia aktualizacji - od numeru wersji, przez mechanizmy dostarczania, po obsługę awaryjnych hotfixów i automatyzację wydań.

---

## 1. Wersjonowanie aplikacji mobilnej

### 1.1 versionCode i versionName na Androidzie

Android rozróżnia dwa atrybuty wersji:

- **`versionCode`** - liczba całkowita, monotonicznie rosnąca, używana wewnętrznie przez platformę do wykrywania aktualizacji,
- **`versionName`** - czytelny ciąg znaków wyświetlany użytkownikowi (np. `1.4.2`).

```kotlin
// build.gradle.kts (moduł app)
android {
    defaultConfig {
        versionCode = 47
        versionName = "2.3.1"
    }
}
```

Przy każdej nowej wersji wysyłanej do sklepu `versionCode` **musi być większy** niż poprzedni. Sklep odrzuci build z takim samym lub niższym kodem.

### 1.2 CFBundleShortVersionString i CFBundleVersion na iOS

iOS używa podobnego podwójnego schematu:

- **`CFBundleShortVersionString`** - wersja widoczna dla użytkownika (np. `2.3.1`),
- **`CFBundleVersion`** - numer build, musi rosnąć monotonicznie w ramach danej wersji.

```xml
<!-- Info.plist -->
<key>CFBundleShortVersionString</key>
<string>2.3.1</string>
<key>CFBundleVersion</key>
<string>47</string>
```

### 1.3 Konwencje numeracji - Semantic Versioning

Najpopularniejszą konwencją jest **Semantic Versioning (SemVer)**: `MAJOR.MINOR.PATCH`

| Segment | Kiedy zwiększać | Przykład |
|---------|-----------------|---------|
| **MAJOR** | Przełomowe zmiany, niezgodność wsteczna | 1.0.0 → 2.0.0 |
| **MINOR** | Nowe funkcje, zachowana kompatybilność | 1.3.0 → 1.4.0 |
| **PATCH** | Poprawki błędów, drobne zmiany | 1.4.1 → 1.4.2 |

Przykładowa automatyzacja w Gradle:

```kotlin
// build.gradle.kts
val major = 2
val minor = 3
val patch = 1

android {
    defaultConfig {
        versionCode = major * 10000 + minor * 100 + patch
        versionName = "$major.$minor.$patch"
    }
}
```

---

## 2. Przygotowanie aktualizacji do wydania

### 2.1 Changelog - co nowego w tej wersji

Każda aktualizacja powinna mieć dokumentację zmian widoczną zarówno w sklepie, jak i wewnątrz aplikacji.

**Plik `CHANGELOG.md` w repozytorium:**

```markdown
## [2.3.1] - 2025-11-15

### Poprawiono
- Naprawiono crash przy ładowaniu obrazów w trybie offline
- Poprawiono układ w trybie ciemnym na starszych urządzeniach

## [2.3.0] - 2025-11-01

### Dodano
- Nowy ekran powiadomień push
- Wsparcie dla Dynamic Color (Material You)

### Zmieniono
- Zaktualizowano minSdk do 26
```

**Notatki do wydania w Google Play Console:**

```
Co nowego:
• Naprawiono problem z ładowaniem w trybie offline
• Poprawiono wygląd na urządzeniach z Android 9
• Ulepszono animacje ekranu głównego
```

### 2.2 Podpisywanie aplikacji (keystore)

Każda wersja wysyłana do sklepu musi być podpisana tym samym kluczem.

```bash
# Generowanie keystore (tylko raz!)
keytool -genkeypair \
  -v -keystore moja-aplikacja.jks \
  -keyalg RSA -keysize 2048 \
  -validity 25000 \
  -alias moj-klucz
```

Konfiguracja w `build.gradle.kts`:

```kotlin
android {
    signingConfigs {
        create("release") {
            storeFile = file("moja-aplikacja.jks")
            storePassword = System.getenv("KEYSTORE_PASSWORD")
            keyAlias = "moj-klucz"
            keyPassword = System.getenv("KEY_PASSWORD")
        }
    }
    buildTypes {
        release {
            signingConfig = signingConfigs.getByName("release")
            isMinifyEnabled = true
            proguardFiles(
                getDefaultProguardFile("proguard-android-optimize.txt"),
                "proguard-rules.pro"
            )
        }
    }
}
```

> **Ważne:** Nie przechowuj haseł keystore w pliku `build.gradle.kts` - używaj zmiennych środowiskowych lub `local.properties` wykluczonych z `.gitignore`.

### 2.3 Budowanie release AAB

```bash
./gradlew bundleRelease
```

Wynikowy plik:

```text
app/build/outputs/bundle/release/app-release.aab
```

---

## 3. Strategie wydawania aktualizacji

### 3.1 Staged Rollout w Google Play

Google Play umożliwia stopniowe udostępnianie aktualizacji - od 1% do 100% użytkowników.

```text
Staged rollout:
1%  → obserwacja crash rate i ANR
5%  → stabilność potwierdzona
10% → brak regresji
25% → normalne wdrożenie
50% → przyspieszenie rolloutu
100% → pełna aktualizacja
```

**Kiedy zatrzymać rollout:**
- crash rate wyraźnie rośnie powyżej baseline,
- pojawia się wzrost jednogwiazdkowych recenzji,
- wskaźnik ANR przekracza próg,
- zgłaszane są kluczowe błędy (utrata danych, problem z autoryzacją).

Rollout można **zatrzymać, cofnąć lub przyspieszyć** z poziomu Google Play Console bez konieczności przesyłania nowego pliku.

### 3.2 Phased Release w App Store Connect

Odpowiednikiem staged rollout na iOS jest **Phased Release** - automatyczne rozłożone w czasie.

```text
Dzień 1:  1%  użytkowników
Dzień 2:  2%  użytkowników
Dzień 3:  5%  użytkowników
Dzień 4:  10% użytkowników
Dzień 5:  20% użytkowników
Dzień 6:  50% użytkowników
Dzień 7:  100% użytkowników
```

Phased Release można wstrzymać przez maksymalnie 30 dni, po czym trzeba zdecydować: zwolnić całkowicie lub wstrzymać na zawsze.

### 3.3 Kanały testowe (Android)

Przed publikacją w production warto przejść przez cały lejek testowy:

| Track | Adresaci | Charakterystyka |
|-------|----------|-----------------|
| Internal testing | zespół, max 100 osób | natychmiastowa dystrybucja |
| Closed testing (alfa) | wybrana lista e-maili lub grupy | ograniczony dostęp zewnętrzny |
| Open testing (beta) | każdy zainteresowany | publiczna beta, bez wpływu na główne opinie |
| Production | wszyscy użytkownicy | pełne wydanie z możliwością staged rollout |

---

## 4. In-App Update API - aktualizacje wewnątrz aplikacji

### 4.1 Play In-App Update API (Android)

Google Play udostępnia **Play In-App Update API**, które pozwala inicjować aktualizację bez wychodzenia z aplikacji.

Dwa tryby:

- **Flexible** - aktualizacja pobierana w tle, użytkownik nie musi przerywać pracy,
- **Immediate** - pełnoekranowy overlay zmuszający do instalacji przed kontynuowaniem.

```kotlin
// build.gradle.kts (zależność)
dependencies {
    implementation("com.google.android.play:app-update-ktx:2.1.0")
}
```

```kotlin
// Sprawdzanie dostępności aktualizacji
class MainActivity : AppCompatActivity() {

    private val appUpdateManager by lazy { AppUpdateManagerFactory.create(this) }
    private val updateLauncher = registerForActivityResult(
        ActivityResultContracts.StartIntentSenderForResult()
    ) { result ->
        if (result.resultCode != RESULT_OK) {
            // użytkownik odrzucił lub aktualizacja nie powiodła się
        }
    }

    override fun onResume() {
        super.onResume()
        checkForUpdate()
    }

    private fun checkForUpdate() {
        appUpdateManager.appUpdateInfo.addOnSuccessListener { info ->
            if (info.updateAvailability() == UpdateAvailability.UPDATE_AVAILABLE
                && info.isUpdateTypeAllowed(AppUpdateType.FLEXIBLE)
            ) {
                appUpdateManager.startUpdateFlowForResult(
                    info,
                    updateLauncher,
                    AppUpdateOptions.newBuilder(AppUpdateType.FLEXIBLE).build()
                )
            }
        }
    }
}
```

### 4.2 Kiedy stosować Immediate vs Flexible

| Kryterium | Flexible | Immediate |
|-----------|---------|-----------|
| Krytyczna poprawka bezpieczeństwa | ✗ | ✓ |
| Nowe funkcje i ulepszenia | ✓ | ✗ |
| Zmiana API serwera wymagająca nowej wersji | ✗ | ✓ |
| Drobne poprawki błędów | ✓ | ✗ |

### 4.3 Reagowanie na zakończenie pobierania (Flexible)

```kotlin
private val installStateUpdatedListener = InstallStateUpdatedListener { state ->
    if (state.installStatus() == InstallStatus.DOWNLOADED) {
        showUpdateReadySnackbar()
    }
}

private fun showUpdateReadySnackbar() {
    Snackbar.make(
        binding.root,
        "Aktualizacja gotowa do instalacji",
        Snackbar.LENGTH_INDEFINITE
    ).setAction("Zainstaluj") {
        appUpdateManager.completeUpdate()
    }.show()
}
```

---

## 5. Hotfixes - awaryjne aktualizacje

### 5.1 Czym jest hotfix

Hotfix to pilna aktualizacja naprawiająca krytyczny błąd lub lukę bezpieczeństwa, która trafia bezpośrednio do użytkowników z pominięciem normalnego cyklu wydawniczego.

**Typowe sytuacje wymagające hotfixa:**
- crash przy uruchomieniu aplikacji (crash on launch),
- utrata danych użytkownika,
- krytyczna luka bezpieczeństwa,
- błąd w procesie płatności,
- niedziałające logowanie lub uwierzytelnianie.

### 5.2 Strategia gałęzi dla hotfixów (Git Flow)

```text
main (produkcja)
│
├── release/2.3.1 ──► wydanie na sklep
│         │
│         └── hotfix/2.3.2 ──► poprawka → merge do main i develop
│
└── develop (bieżące prace)
```

```bash
# Tworzenie gałęzi hotfix
git checkout -b hotfix/2.3.2 main

# Po naprawieniu błędu
git commit -m "fix: naprawiono crash przy braku połączenia sieciowego"

# Merge do main (produkcja)
git checkout main
git merge --no-ff hotfix/2.3.2
git tag -a v2.3.2 -m "Hotfix 2.3.2"

# Merge z powrotem do develop
git checkout develop
git merge --no-ff hotfix/2.3.2
```

### 5.3 Skrócony przegląd kodu (code review) dla hotfixa

Hotfix nie zwalnia z code review - ale można skrócić jego zakres:
- skupiamy się wyłącznie na zmienionych liniach,
- pomijamy analizę stylu i refaktoryzacji,
- priorytetem jest weryfikacja, że poprawka nie wprowadza nowych błędów,
- warto uruchomić testy jednostkowe i regresyjne dotknięte obszaru.

---

## 6. CI/CD - automatyzacja procesu wydań

### 6.1 Podstawowy pipeline wydawniczy

Automatyzacja procesu wydania eliminuje błędy ludzkie i przyspiesza czas dostarczenia poprawki.

```yaml
# Przykładowy pipeline (GitHub Actions)
name: Release Android

on:
  push:
    tags:
      - 'v*'

jobs:
  build-and-publish:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Set up JDK 17
        uses: actions/setup-java@v4
        with:
          java-version: '17'
          distribution: 'temurin'

      - name: Build Release AAB
        run: ./gradlew bundleRelease
        env:
          KEYSTORE_PASSWORD: ${{ secrets.KEYSTORE_PASSWORD }}
          KEY_PASSWORD: ${{ secrets.KEY_PASSWORD }}

      - name: Upload to Google Play (internal track)
        uses: r0adkll/upload-google-play@v1
        with:
          serviceAccountJsonPlainText: ${{ secrets.SERVICE_ACCOUNT_JSON }}
          packageName: com.example.myapp
          releaseFiles: app/build/outputs/bundle/release/*.aab
          track: internal
          changesNotSentForReview: true
```

### 6.2 Fastlane - uproszczona automatyzacja

**Fastlane** to popularne narzędzie CLI do automatyzacji wydań zarówno na Androida, jak i iOS.

```ruby
# Fastfile (Android)
lane :deploy_internal do
  gradle(
    task: "bundle",
    build_type: "Release",
    properties: {
      "android.injected.signing.store.file" => ENV["KEYSTORE_PATH"],
      "android.injected.signing.store.password" => ENV["KEYSTORE_PASSWORD"],
      "android.injected.signing.key.alias" => ENV["KEY_ALIAS"],
      "android.injected.signing.key.password" => ENV["KEY_PASSWORD"],
    }
  )
  upload_to_play_store(
    track: "internal",
    aab: "app/build/outputs/bundle/release/app-release.aab"
  )
end
```

```bash
fastlane deploy_internal
```

### 6.3 Automatyczne wersjonowanie przez CI

```kotlin
// build.gradle.kts - versionCode z numeru build CI
val buildNumber = System.getenv("BUILD_NUMBER")?.toInt() ?: 1

android {
    defaultConfig {
        versionCode = buildNumber
        versionName = "2.3.$buildNumber"
    }
}
```

---

## 7. Monitorowanie aktualizacji po wdrożeniu

### 7.1 Kluczowe metryki po wydaniu

Po wypuszczeniu aktualizacji należy monitorować przez co najmniej 24–72 godziny:

| Metryka | Co mierzy | Sygnał alarmowy |
|---------|-----------|-----------------|
| **Crash rate** | % sesji kończących się crashem | wzrost o >50% bazowego |
| **ANR rate** | % sesji z Application Not Responding | wzrost o >50% bazowego |
| **Retencja D1** | % użytkowników wracających po 1 dniu | gwałtowny spadek |
| **Negatywne recenzje** | oceny 1–2 gwiazdki | nagły wzrost |
| **Czas odpowiedzi API** | opóźnienia strony serwerowej | wzrost latencji po aktualizacji |

### 7.2 Android Vitals w Google Play Console

Google Play Console udostępnia sekcję **Android Vitals**, gdzie można śledzić:
- wskaźniki crashy i ANR w podziale na model urządzenia i wersję Android,
- porównanie z poprzednią wersją,
- alerty przy przekroczeniu progów jakości.

### 7.3 Firebase Crashlytics

Firebase Crashlytics pozwala na szczegółowe śledzenie błędów w czasie rzeczywistym:

```kotlin
// Niestandardowy log do diagnostyki
Firebase.crashlytics.log("Użytkownik rozpoczął aktualizację profilu")
Firebase.crashlytics.setCustomKey("user_tier", "premium")

// Ręczne zgłoszenie wyjątku niekrytycznego
try {
    syncUserData()
} catch (e: IOException) {
    Firebase.crashlytics.recordException(e)
}
```

---

## 8. Komunikacja z użytkownikiem o aktualizacjach

### 8.1 Ekran „Co nowego" (What's New)

Warto pokazać użytkownikowi, co się zmieniło po pierwszym uruchomieniu nowej wersji:

```kotlin
// Sprawdzenie czy wersja zmieniła się od ostatniego uruchomienia
val prefs = getSharedPreferences("app_prefs", MODE_PRIVATE)
val lastVersion = prefs.getInt("last_version_code", 0)
val currentVersion = BuildConfig.VERSION_CODE

if (lastVersion > 0 && lastVersion < currentVersion) {
    showWhatsNewDialog()
}
prefs.edit { putInt("last_version_code", currentVersion) }
```

### 8.2 Zachęcanie do aktualizacji bez wymuszania

Dobre praktyki UX przy informowaniu o aktualizacjach:
- pokaż baner informacyjny zamiast blokady,
- opisz konkretne korzyści z aktualizacji,
- daj użytkownikowi możliwość odłożenia decyzji,
- nie pokazuj tego samego monitu więcej niż raz dziennie,
- tryb `Immediate` stosuj tylko dla naprawdę krytycznych sytuacji.

### 8.3 Wymuszenie minimalnej wersji (force update)

Gdy stara wersja aplikacji jest niekompatybilna z nowym API serwera:

```kotlin
// Odpowiedź serwera zawiera pole min_required_version
data class AppConfig(
    val minRequiredVersion: Int,
    val latestVersion: Int
)

fun checkVersionCompatibility(config: AppConfig) {
    if (BuildConfig.VERSION_CODE < config.minRequiredVersion) {
        // Wyświetl ekran wymagający aktualizacji - nie można kontynuować
        showForceUpdateScreen()
    }
}
```

---

## 9. Specyfika aktualizacji iOS

### 9.1 Proces review aktualizacji w App Store

Każda aktualizacja na iOS **musi przejść review Apple**, co trwa zazwyczaj 24–48 godzin (w przypadku pilnych zgłoszeń można wnioskować o expedited review). Warto to uwzględnić w harmonogramie wydania.

### 9.2 TestFlight - dystrybucja testowa

TestFlight pozwala dostarczyć aktualizację do testerów przed oficjalnym wydaniem:

- **Internal testers** - do 100 osób z grupy, dostęp natychmiastowy,
- **External testers** - do 10 000 osób, wymaga review Apple.

Nowe buildy TestFlight są widoczne dla testerów automatycznie po zatwierdzeniu.

### 9.3 Automatyczna vs ręczna aktualizacja przez Phased Release

Użytkownicy iOS mogą mieć włączone automatyczne aktualizacje. Staged release stopniuje, kiedy automatyczna aktualizacja trafi do kolejnych użytkowników. Osoby, które ręcznie szukają aktualizacji w App Store, zawsze otrzymają nową wersję od razu, niezależnie od fazy.

---

## 10. Podsumowanie

Skuteczne wydawanie aktualizacji to połączenie wielu elementów:

| Element | Klucz do sukcesu |
|---------|-----------------|
| **Wersjonowanie** | SemVer + monotonicznie rosnący versionCode |
| **Changelog** | czytelny opis zmian dla użytkowników i zespołu |
| **Podpisywanie** | bezpieczne przechowywanie keystore, sekrety w CI |
| **Staged rollout** | stopniowe wdrożenie z obserwacją metryk |
| **In-App Update** | Flexible dla ulepszeń, Immediate dla krytycznych poprawek |
| **Hotfixes** | oddzielna gałąź, skrócony review, szybki cykl |
| **CI/CD** | automatyzacja budowania, podpisywania i publikacji |
| **Monitoring** | Android Vitals, Crashlytics, metryki retencji |
| **Komunikacja** | ekran „Co nowego", banery zamiast blokad |

Regularne, dobrze zaplanowane aktualizacje budują zaufanie użytkowników i pozwalają szybko reagować na problemy - zanim negatywne opinie staną się poważnym problemem dla produktu.

## Linki
- [Google Play In-App Update API](https://developer.android.com/guide/playcore/in-app-updates)
- [Google Play Console - Staged rollouts](https://support.google.com/googleplay/android-developer/answer/6346149)
- [App Store Connect - Phased Release](https://developer.apple.com/help/app-store-connect/update-your-app/release-a-version-update-in-phases)
- [Fastlane - automatyzacja wydań](https://fastlane.tools)
- [Firebase Crashlytics](https://firebase.google.com/docs/crashlytics)
- [Semantic Versioning](https://semver.org/lang/pl/)
