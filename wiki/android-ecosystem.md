# Ekosystem Android i Google Play

Android to nie tylko system operacyjny — to kompletny ekosystem usług, narzędzi i reguł, w którym funkcjonuje aplikacja od momentu napisania kodu aż do instalacji na urządzeniu użytkownika.

## Google Play Services

Google Play Services to warstwa pośrednia między systemem Android a aplikacjami, aktualizowana niezależnie od wersji systemu. Dostarcza kluczowe API, które producenci urządzeń muszą licencjonować:

| Serwis | Opis | Przykład użycia |
|--------|------|----------------|
| **Firebase** | Backend mobilny (DB, auth, analytics) | `FirebaseAuth.signInWithEmail()` |
| **Google Maps SDK** | Mapy wektorowe i geokodowanie | Lokalizacja w aplikacji |
| **Sign In with Google** | OAuth2, OpenID Connect | Logowanie jednym kliknięciem |
| **Google Pay API** | Płatności NFC i online | Checkout w e-commerce |
| **ML Kit** | AI on-device bez internetu | OCR, detekcja twarzy, tłumaczenie |
| **SafetyNet / Play Integrity** | Weryfikacja autentyczności urządzenia | Ochrona przed rootowaniem |

```kotlin
// Sprawdzenie dostępności Google Play Services
val availability = GoogleApiAvailability.getInstance()
val result = availability.isGooglePlayServicesAvailable(context)
if (result != ConnectionResult.SUCCESS) {
    if (availability.isUserResolvableError(result)) {
        availability.getErrorDialog(activity, result, 9000)?.show()
    }
}
```

## Publikacja w Google Play — APK vs AAB

```
Kod źródłowy
    │
    ▼
Build Release AAB (Android App Bundle)
    │
    ▼
Podpisanie kluczem (Keystore)
    │
    ▼
Upload do Play Console
    │
    ▼
Google Play Review (1-3 dni)
    │
    ▼
Dystrybucja do użytkowników
```

| Format | Opis | Rozmiar |
|--------|------|---------|
| **APK** | Jeden plik dla wszystkich urządzeń — stary format | Większy |
| **AAB** | Play generuje zoptymalizowane APK per urządzenie — wymagany od 2021 | Mniejszy (~15%) |

Dzięki AAB urządzenie pobiera tylko zasoby pasujące do jego gęstości ekranu, architektury CPU i języka systemowego — reszta jest przycinana po stronie serwera Google.

## Keystore — podpisywanie aplikacji

```bash
# Generowanie keystore — ZRÓB TO RAZ, PRZECHOWUJ NA ZAWSZE
keytool -genkey -v -keystore release.jks \
  -keyalg RSA -keysize 2048 -validity 10000 \
  -alias my-key-alias
# Zostaniesz zapytany o hasło i dane organizacji
```

```kotlin
// build.gradle.kts — konfiguracja podpisywania
android {
    signingConfigs {
        create("release") {
            storeFile = file("release.jks")
            // NIGDY nie hardkoduj haseł — używaj zmiennych środowiskowych
            storePassword = System.getenv("KEYSTORE_PASSWORD")
            keyAlias = "my-key-alias"
            keyPassword = System.getenv("KEY_PASSWORD")
        }
    }
    buildTypes {
        release {
            signingConfig = signingConfigs.getByName("release")
            isMinifyEnabled = true
            isShrinkResources = true
            proguardFiles(
                getDefaultProguardFile("proguard-android-optimize.txt"),
                "proguard-rules.pro"
            )
        }
    }
}
```

> **Krytyczne:** Utrata keystore = permanent brak możliwości aktualizacji aplikacji. Zrób backup w co najmniej 2 miejscach. Nigdy nie commituj keystore ani haseł do Git — użyj `.gitignore`.

## Google Play Console — struktura i narzędzia

### Kanały dystrybucji

```
Internal Testing   →  Closed Testing   →  Open Testing   →  Production
(max 100 osób)        (lista e-mail)       (publiczne %)     (wszyscy)
 Natychmiastowy        Do 24h review        Do 24h review     Do 72h review
```

**Staged rollout** — stopniowe wdrażanie:
```
1% → 5% → 10% → 20% → 50% → 100%
   ↑ obserwuj crash rate i oceny przed każdym krokiem
```

### Android Vitals — automatyczne alerty

Play Console mierzy jakość aplikacji i porównuje z innymi w kategorii:

```
Crash Rate              < 1.09%  (bad core vitals threshold)
ANR Rate                < 0.47%
Excessive Wakeups       < 10/godzinę
Stuck Partial Wake Locks < 1 sesja/godzinę
```

Przekroczenie progów = ostrzeżenie lub obniżona widoczność w sklepie.

## Polityki Google Play

| Polityka | Wymaganie |
|----------|-----------|
| **Target API** | `targetSdk` max 1 rok poniżej najnowszego API (Android 15 = API 35 od 2025) |
| **Data Safety** | Obowiązkowe ujawnienie: co zbierasz, dlaczego, czy udostępniasz |
| **Billing** | Zakupy cyfrowe **tylko** przez Google Play Billing (30% prowizji, lub 15% dla <$1M/rok) |
| **Permissions** | Żądaj tylko niezbędnych uprawnień; `READ_CALL_LOG`, `CAMERA` wymagają uzasadnienia |
| **Sensitive APIs** | Privacy Manifest od targetSdk 35 dla kilku wrażliwych API |

## CI/CD z Fastlane

```ruby
# Fastfile — automatyczna publikacja
lane :deploy_production do
  gradle(task: "bundle", build_type: "Release")
  upload_to_play_store(
    track: "production",
    rollout: "0.1",       # 10% staged rollout
    aab: "app/build/outputs/bundle/release/app-release.aab",
    skip_upload_screenshots: true,
    skip_upload_images: true
  )
  slack(message: "Nowa wersja opublikowana w Google Play!")
end
```

```yaml
# GitHub Actions — wyzwalanie przy tagu git
name: Deploy to Play Store
on:
  push:
    tags: ['v*']
jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-java@v4
        with: { java-version: '17', distribution: 'temurin' }
      - name: Build & Deploy
        run: bundle exec fastlane deploy_production
        env:
          KEYSTORE_PASSWORD: ${{ secrets.KEYSTORE_PASSWORD }}
          KEY_PASSWORD: ${{ secrets.KEY_PASSWORD }}
          PLAY_STORE_JSON_KEY: ${{ secrets.PLAY_STORE_JSON_KEY }}
```

## Alternatywne sklepy

| Sklep | Rynek | Prowizja |
|-------|-------|---------|
| **Amazon Appstore** | Kindle, Fire TV | 20% |
| **Samsung Galaxy Store** | Urządzenia Samsung | 30% (15% dla małych) |
| **Huawei AppGallery** | Chiny + Europa | 30% |
| **F-Droid** | Open source / FOSS | 0% |
| **Sideloading APK** | Bezpośrednia instalacja | — |

## Linki

- [Google Play Console](https://play.google.com/console)
- [Android App Bundle](https://developer.android.com/guide/app-bundle)
- [Play Policy Center](https://play.google.com/about/developer-content-policy/)
- [Fastlane](https://fastlane.tools)

## Google Play — polityki i wymagania

```
Targetowane API Level:
- Od 2024: nowe aplikacje muszą targetować API 34+
- Od 2025: aktualizacje istniejących aplikacji: API 35+

Wymagania bezpieczeństwa:
- Play Integrity API (zastąpiło SafetyNet)
- Obowiązkowe zgłaszanie luk bezpieczeństwa (DSAR)
- Privacy Nutrition Labels (Data Safety section)

Limity rozmiaru APK/AAB:
- Google Play: 200 MB (z Play Asset Delivery: bez limitu)
- Samsung Galaxy Store: 4 GB
- Amazon AppStore: 4 GB
```

## Play Integrity API

```kotlin
// Sprawdź integralność urządzenia i aplikacji
class IntegrityChecker(private val context: Context) {
    private val integrityManager = IntegrityManagerFactory.create(context)

    suspend fun checkIntegrity(): IntegrityResult {
        return try {
            val nonce = generateNonce()  // unikalny nonce z serwera
            val tokenRequest = StandardIntegrityManager.StandardIntegrityTokenRequest.builder()
                .setRequestHash(sha256(nonce))
                .build()

            val tokenProvider = integrityManager.requestStandardIntegrityToken(tokenRequest).await()
            val token = tokenProvider.token()

            // Wyślij token do swojego serwera do weryfikacji
            val result = apiService.verifyIntegrity(token, nonce)
            IntegrityResult(
                isValid = result.isValid,
                appRecognized = result.appIntegrity.appRecognitionVerdict == "PLAY_RECOGNIZED",
                deviceIntact = result.deviceIntegrity.deviceRecognitionVerdict.contains("MEETS_DEVICE_INTEGRITY")
            )
        } catch (e: Exception) {
            IntegrityResult(isValid = false, error = e.message)
        }
    }
}
```

## Android App Bundle (AAB) vs APK

```
APK (Android Package):
├── Zawiera WSZYSTKO: kod + zasoby dla wszystkich konfiguracji
├── Rozmiar: typowo 60-150 MB
└── Bezpośrednie sideloading możliwe

AAB (Android App Bundle):
├── Zawiera kod + zasoby dla WSZYSTKICH konfiguracji
├── Google Play generuje dynamiczne APK dla każdego urządzenia
├── Rozmiar dla użytkownika: o 15-35% mniejszy
└── Dynamic Feature Modules — pobieranie funkcji na żądanie

Dynamic Delivery:
app/
├── base/          ← zawsze instalowany
├── ondemand/      ← pobierany gdy potrzebny
│   ├── camera/    ← moduł kamery
│   └── ar/        ← moduł AR
└── country/       ← zasoby dla regionu użytkownika
```

## Linki dodatkowe

- [Play Integrity API](https://developer.android.com/google/play/integrity)
- [Android App Bundle](https://developer.android.com/guide/app-bundle)
- [Google Play Policies](https://support.google.com/googleplay/android-developer/answer/9858738)
