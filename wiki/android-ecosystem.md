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

Poniższy fragment kodu sprawdza, czy na urządzeniu są zainstalowane i aktualne Google Play Services — jest to konieczne przed wywołaniem jakiegokolwiek API z ekosystemu Google. `GoogleApiAvailability.getInstance()` zwraca singleton zarządzający dostępnością serwisów. Metoda `isGooglePlayServicesAvailable()` zwraca kod statusu — wartość `ConnectionResult.SUCCESS` oznacza gotowość do pracy, inne kody sygnalizują problem (np. nieaktualna wersja, brak instalacji). Sprawdzenie `isUserResolvableError()` odróżnia błędy, które użytkownik może samodzielnie naprawić (np. aktualizacja Play Services przez sklep), od błędów niemożliwych do naprawienia (np. urządzenie Huawei bez licencji Google). W przypadku błędów naprawialnych wyświetlamy gotowy dialog systemowy — nie piszemy własnego UI, bo Google regularnie aktualizuje komunikaty w lokalnych językach.

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

Proces wydania aplikacji w Google Play składa się z kilku następujących po sobie kroków. Poniższy schemat ilustruje kolejność od skompilowania kodu źródłowego aż po dystrybucję gotowej aplikacji do użytkowników.

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

Każda aplikacja Android musi być cyfrowo podpisana, zanim trafi do sklepu lub na urządzenie. Keystore to zaszyfrowany plik przechowujący klucz prywatny RSA, którym Google Play weryfikuje, że kolejne aktualizacje aplikacji pochodzą od tego samego wydawcy. Poniższe polecenie generuje nowy keystore jednorazowo — parametr `-validity 10000` oznacza ważność przez ok. 27 lat, co jest standardem, bo certyfikat musi być ważny podczas całego życia aplikacji. Algorytm RSA z kluczem 2048 bitów jest wymagany przez Google Play — SHA-256 używany do podpisywania wymaga odpowiednio długiego klucza asymetrycznego. Dane organizacji (pytane interaktywnie) nie wpływają na bezpieczeństwo, ale są widoczne w certyfikacie i pomagają zidentyfikować właściciela aplikacji.

```bash
# Generowanie keystore — ZRÓB TO RAZ, PRZECHOWUJ NA ZAWSZE
keytool -genkey -v -keystore release.jks \
  -keyalg RSA -keysize 2048 -validity 10000 \
  -alias my-key-alias
# Zostaniesz zapytany o hasło i dane organizacji
```

Poniższa konfiguracja Gradle definiuje, jak budować wersję produkcyjną (release) aplikacji z automatycznym podpisywaniem. Hasła do keystore pobierane są ze zmiennych środowiskowych (`System.getenv()`), a nie wpisane na stałe w kodzie — gdyby znalazły się w pliku `build.gradle.kts` zcommitowanym do repozytorium, każdy z dostępem do repo mógłby podpisać fałszywą aktualizację. Flagi `isMinifyEnabled = true` i `isShrinkResources = true` włączają narzędzie R8, które usuwa nieużywany kod i zasoby oraz obfuskuje nazwy klas i metod — zmniejsza to rozmiar APK o 20–40% i utrudnia reverse engineering. Plik `proguard-rules.pro` pozwala wykluczyć z obfuskacji klasy, które muszą zachować oryginalne nazwy (np. modele danych serializowane przez Gson).

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

Google Play Console oferuje cztery kanały dystrybucji różniące się dostępnością i czasem weryfikacji. Pozwala to stopniowo wprowadzać aplikację do szerszego grona użytkowników i wykrywać problemy, zanim dotrą do wszystkich.

```
Internal Testing   →  Closed Testing   →  Open Testing   →  Production
(max 100 osób)        (lista e-mail)       (publiczne %)     (wszyscy)
 Natychmiastowy        Do 24h review        Do 24h review     Do 72h review
```

**Staged rollout** — stopniowe wdrażanie:

Staged rollout to technika stopniowego wdrażania nowej wersji — zamiast wysyłać aktualizację do wszystkich użytkowników naraz, zwiększamy procent odbiorców po obserwacji kluczowych metryk. Poniższy diagram pokazuje typowy schemat rozszerzania zasięgu wdrożenia.

```
1% → 5% → 10% → 20% → 50% → 100%
   ↑ obserwuj crash rate i oceny przed każdym krokiem
```

### Android Vitals — automatyczne alerty

Play Console mierzy jakość aplikacji i porównuje z innymi w kategorii:

Systematyczne monitorowanie wskaźników jakości pozwala szybko reagować na problemy wpływające na oceny i widoczność w sklepie. Przekroczenie poniższych progów skutkuje automatycznym ostrzeżeniem w konsoli lub obniżeniem widoczności aplikacji w wynikach wyszukiwania sklepu.

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

Poniższe konfiguracje automatyzują publikację aplikacji — zamiast ręcznych kilkunastu kroków w Play Console, jedno polecenie lub zdarzenie Git uruchamia cały pipeline. Plik `Fastfile` definiuje „lane" (ścieżkę) o nazwie `deploy_production`: najpierw `gradle()` buduje podpisany AAB (Android App Bundle), a następnie `upload_to_play_store()` wysyła go do Google Play z parametrem `rollout: "0.1"`, czyli staged rollout do 10% użytkowników. Parametr `skip_upload_screenshots: true` przyspiesza publikację, gdy zrzuty ekranu nie uległy zmianie. Na końcu wysyłane jest powiadomienie do Slacka — co jest dobrą praktyką w zespołach, bo każdy wie, że wersja produkcyjna jest już dostępna.

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

Plik YAML definiuje workflow GitHub Actions wyzwalany automatycznie przez zdarzenie `push` na tagach pasujących do wzorca `v*` (np. `v1.2.3`). Taki wyzwalacz jest preferowany nad automatycznym buildowaniem każdego commita, bo w Google Play można przesyłać tylko wersje z rosnącym `versionCode` — tag Git naturalnie oznacza świadomą decyzję o wydaniu nowej wersji. Krok `setup-java` zapewnia powtarzalne środowisko budowania (zawsze Java 17 z dystrybucją Temurin), bo różne wersje JDK mogą generować różne wyniki kompilacji. Sekrety (`${{ secrets.* }}`) są wstrzykiwane jako zmienne środowiskowe — GitHub szyfruje je po stronie platformy i maskuje w logach, więc nie ma ryzyka ich wycieku nawet przy publicznym repozytorium.

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

Sekcja ta podsumowuje aktualne wymagania techniczne i prawne Google Play dotyczące poziomu docelowego API, rozmiaru paczek oraz bezpieczeństwa. Znajomość tych limitów jest niezbędna przy planowaniu wdrożenia produkcyjnego i pozwala uniknąć odrzucenia aplikacji podczas weryfikacji.

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

Play Integrity API pozwala aplikacji serwer-side zweryfikować, że odpytujące urządzenie jest prawdziwym, niezmodyfikowanym urządzeniem z zainstalowaną oryginalną aplikacją z Google Play. Poniższy kod pokazuje kompletny przepływ: generowanie nonce (jednorazowego tokenu) po stronie klienta lub serwera, wysyłanie zapytania do Google o token integralności, a następnie odesłanie go do własnego backendu w celu weryfikacji przez Google API. Nonce jest kluczowy — bez niego atakujący mógłby przechwycić stary token i wielokrotnie go użyć (atak replay). Funkcja `suspend` i `await()` oznaczają, że cała operacja jest asynchroniczna i nie blokuje głównego wątku UI — to obowiązkowe podejście w Kotlinie dla operacji sieciowych. Wynik zawiera trzy wyroki: rozpoznanie aplikacji (`PLAY_RECOGNIZED`), integralność urządzenia i spełnienie wymogów bezpieczeństwa — każdy z nich można sprawdzać niezależnie, dopasowując poziom ochrony do wrażliwości wykonywanej operacji.

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

Poniższy schemat porównuje format APK z nowym formatem AAB (Android App Bundle) i mechanizmem Dynamic Delivery. Zrozumienie różnic między tymi formatami jest istotne przy planowaniu procesu wydania aplikacji i optymalizacji jej rozmiaru dla różnych konfiguracji urządzeń.

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
