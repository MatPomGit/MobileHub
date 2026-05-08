# Mobile Security Basics

Moduł „Mobile Security Basics” zbiera praktyczne minimum bezpieczeństwa, które powinno znaleźć się w każdym projekcie studenckim. Materiał koncentruje się na pięciu filarach: **przechowywanie danych**, **tokeny**, **certificate pinning**, **secure communication** i **secrets management**.

---

## 1) Bezpieczne przechowywanie danych (Data Storage)

### Co chronić
- tokeny dostępu i odświeżania,
- identyfikatory użytkownika,
- dane profilowe i medyczne,
- lokalne cache zawierające dane prywatne.

### Dobre praktyki
- Android: `EncryptedSharedPreferences`, SQLCipher, Android Keystore.
- iOS: Keychain, Data Protection classes.
- Szyfrowanie danych „at rest” i usuwanie danych przy logout.
- Brak przechowywania haseł użytkownika lokalnie.

### Przykład kodu (Android/Kotlin)

```kotlin
// Funkcja zapisuje token w zaszyfrowanych preferencjach zamiast zwykłego SharedPreferences.
fun saveSecureToken(context: Context, token: String) {
    val masterKey = MasterKey.Builder(context)
        .setKeyScheme(MasterKey.KeyScheme.AES256_GCM)
        .build()

    val securePrefs = EncryptedSharedPreferences.create(
        context,
        "secure_prefs",
        masterKey,
        EncryptedSharedPreferences.PrefKeyEncryptionScheme.AES256_SIV,
        EncryptedSharedPreferences.PrefValueEncryptionScheme.AES256_GCM
    )

    securePrefs.edit().putString("access_token", token).apply()
}
```

### Materiały uzupełniające
- OWASP MASVS / MSTG (mobile application security verification).
- Android Security: Keystore + Jetpack Security.
- Apple Keychain Services.

---

## 2) Tokeny i sesja użytkownika (Auth Tokens)

### Najważniejsze zasady
- Krótki czas życia access tokena.
- Refresh token przechowywany bezpiecznie (Keychain/Keystore).
- Unikanie tokenów w URL (`GET /api?token=...` to antywzorzec).
- Natychmiastowe unieważnianie tokena po logout.

### Przykład kodu (interceptor dodający Bearer token)

```kotlin
// Interceptor automatycznie dodaje nagłówek Authorization do każdego żądania API.
class AuthInterceptor(
    private val tokenProvider: () -> String?
) : Interceptor {
    override fun intercept(chain: Interceptor.Chain): Response {
        val originalRequest = chain.request()
        val token = tokenProvider()

        val securedRequest = if (token != null) {
            originalRequest.newBuilder()
                .header("Authorization", "Bearer $token")
                .build()
        } else {
            originalRequest
        }

        return chain.proceed(securedRequest)
    }
}
```

### Materiały uzupełniające
- OAuth 2.1 BCP, RFC 6750 (Bearer Token Usage).
- OWASP API Security Top 10.

---

## 3) Certificate Pinning

### Po co pinning
- Ogranicza ryzyko MITM nawet przy kompromitacji zaufanego CA.
- Chroni szczególnie aplikacje bankowe, medyczne i administracyjne.

### Dobre praktyki
- Min. 2 piny: aktywny + zapasowy.
- Monitoring błędów pinowania po stronie backendu.
- Procedura „pin rotation” przed wygaśnięciem certyfikatu.

### Przykład kodu (OkHttp)

```kotlin
// Konfiguracja pinowania certyfikatów dla API produkcyjnego.
fun createPinnedClient(): OkHttpClient {
    val pinner = CertificatePinner.Builder()
        .add("api.example.com", "sha256/AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA=")
        .add("api.example.com", "sha256/BBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBB=") // backup pin
        .build()

    return OkHttpClient.Builder()
        .certificatePinner(pinner)
        .build()
}
```

### Materiały uzupełniające
- OWASP MASTG: Testing Network Communication.
- OkHttp CertificatePinner docs.

---

## 4) Secure Communication (TLS, konfiguracja sieci)

### Dobre praktyki
- Wymuszenie HTTPS (`usesCleartextTraffic=false`).
- TLS 1.2+ (preferowane 1.3).
- Walidacja certyfikatów i hostnames.
- Brak logowania danych wrażliwych w ruchu sieciowym.

### Przykład kodu (AndroidManifest)

```xml
<!-- Konfiguracja blokuje cleartext i wymusza bezpieczną komunikację. -->
<application
    android:usesCleartextTraffic="false"
    android:networkSecurityConfig="@xml/network_security_config" />
```

### Przykład kodu (network_security_config.xml)

```xml
<!-- Konfiguracja globalnie blokuje HTTP i zezwala tylko na certyfikaty systemowe. -->
<network-security-config>
    <base-config cleartextTrafficPermitted="false">
        <trust-anchors>
            <certificates src="system" />
        </trust-anchors>
    </base-config>
</network-security-config>
```

### Materiały uzupełniające
- Android Network Security Config.
- Apple App Transport Security (ATS).

---

## 5) Secrets Management

### Czego nie robić
- Nie hardkodować kluczy API w repozytorium.
- Nie commitować `.env`, `google-services.json`, prywatnych certyfikatów.
- Nie wysyłać sekretów do crash logów.

### Co robić
- Sekrety trzymać w CI/CD Secret Store (GitHub Actions Secrets, GitLab CI Variables).
- Rozdzielać sekrety dla środowisk: dev/stage/prod.
- Regularna rotacja kluczy i audyt dostępu.

### Sekrety w repozytorium (GitHub) – praktyka R&D

#### Minimalny standard zespołowy
- Włączyć **GitHub Secret Scanning** i **Push Protection** dla repo.
- Dodać politykę branch protection (PR review + status checks).
- Blokować merge, jeżeli skan bezpieczeństwa wykrył sekret.
- Używać krótkotrwałych tokenów (OIDC / federation) zamiast stałych sekretów tam, gdzie to możliwe.

#### `.gitignore` dla projektów mobilnych

```gitignore
# Pliki lokalne z sekretami i konfiguracją środowiskową
.env
.env.*
local.properties
*.jks
*.keystore
*.p12
*.mobileprovision
GoogleService-Info.plist
google-services.json
fastlane/.env
```

#### Przykład workflow GitHub Actions (bez hardkodowania sekretów)

```yaml
name: android-ci

on:
  pull_request:
  push:
    branches: [ main ]

jobs:
  build:
    runs-on: ubuntu-latest
    env:
      # Zmienna pobierana z GitHub Secrets, nie z kodu repozytorium.
      MAPS_API_KEY: ${{ secrets.MAPS_API_KEY }}
    steps:
      - uses: actions/checkout@v4

      - name: Prepare local properties
        run: |
          # Generujemy plik lokalnie w pipeline; nie commitujemy go do repo.
          echo "MAPS_API_KEY=${MAPS_API_KEY}" >> local.properties

      - name: Build
        run: ./gradlew assembleRelease
```

#### Przykład lokalnego skanu przed commit (gitleaks)

```bash
# Skanuje repo i blokuje release, gdy wykryje możliwe sekrety.
gitleaks detect --source . --redact --verbose
```

### Materiały uzupełniające
- OWASP Secrets Management Cheat Sheet.
- GitHub Secret Scanning.
- TruffleHog/Gitleaks.

---

## Najczęstsze błędy bezpieczeństwa w projektach studenckich i sposoby naprawy

1. **Sekrety w repozytorium (API key, token, hasło do DB).**
   **Naprawa:** usunąć sekret z historii Git, przenieść do CI/CD secrets, dodać skan `gitleaks` do pipeline.
2. **Przechowywanie tokena w plain text (`SharedPreferences` / `UserDefaults`).**
   **Naprawa:** użyć `EncryptedSharedPreferences` (Android) lub Keychain (iOS) + wymuszać logout cleanup.
3. **Brak wygasania sesji i refresh tokenów.**
   **Naprawa:** krótkie TTL access tokena, rotacja refresh tokena, endpoint revoke.
4. **Wysyłanie tokena w URL albo logach debugowych.**
   **Naprawa:** token tylko w nagłówku `Authorization`, redakcja danych w logach.
5. **Włączony ruch HTTP (cleartext) na produkcji.**
   **Naprawa:** `usesCleartextTraffic=false`, ATS/Network Security Config, testy integracyjne wymuszające HTTPS.
6. **Brak certificate pinning dla aplikacji o podwyższonym ryzyku.**
   **Naprawa:** dodać pinning z pinem zapasowym i procesem rotacji.
7. **Zbyt szerokie uprawnienia aplikacji.**
   **Naprawa:** zasada least privilege, usunąć nieużywane permissions i opisać uzasadnienie biznesowe.
8. **Brak walidacji wejścia z API/formularzy.**
   **Naprawa:** walidacja po stronie klienta i serwera, jawne limity długości i formatów.
9. **Stare podatne zależności.**
   **Naprawa:** regularne aktualizacje + SCA (np. Dependabot, OSV-Scanner) i review CVE przed release.
10. **Brak planu reakcji na incydent bezpieczeństwa.**
    **Naprawa:** playbook incydentu, kanał eskalacji, checklista revokacji tokenów i publikacji hotfixa.

---

## Checklista audytu bezpieczeństwa przed oddaniem projektu

> Każdy punkt zawiera: **co sprawdzić**, **przykład kodu/konfiguracji**, **materiały uzupełniające**.

### 1) Data storage
- [ ] **Sprawdź:** dane wrażliwe są szyfrowane lokalnie i czyszczone po wylogowaniu.
- **Przykład:** `saveSecureToken(...)` z `EncryptedSharedPreferences` (sekcja 1).
- **Materiały:** [File storage mobile](./file-storage-mobile.md), [Data storage best practices](./data-storage-best-practices.md), [iOS Data](./ios-data.md).

### 2) Token lifecycle
- [ ] **Sprawdź:** access token ma krótki TTL, refresh token jest rotowany i możliwy do unieważnienia.
- **Przykład:** `AuthInterceptor` z nagłówkiem `Authorization: Bearer ...` (sekcja 2).
- **Materiały:** [Android Network](./android-network.md), [iOS Networking](./ios-networking.md), [AI Privacy & Security](./ai-privacy-security.md).

### 3) Certificate pinning
- [ ] **Sprawdź:** pinning jest skonfigurowany dla domen produkcyjnych, istnieje pin zapasowy.
- **Przykład:** `createPinnedClient()` z dwoma pinami SHA-256 (sekcja 3).
- **Materiały:** [Mobile Security](./mobile-security.md), [Android Network](./android-network.md).

### 4) Secure communication
- [ ] **Sprawdź:** HTTP jest zablokowane, aplikacja wymusza TLS i walidację hosta.
- **Przykład:** `android:usesCleartextTraffic="false"` i `network_security_config` (sekcja 4).
- **Materiały:** [Connectivity](./connectivity.md), [Android Network](./android-network.md), [iOS Networking](./ios-networking.md).

### 5) Secrets management
- [ ] **Sprawdź:** brak sekretów w repo i w logach, sekrety pobierane z CI/CD.
- **Przykład:** workflow GitHub Actions z `${{ secrets.MAPS_API_KEY }}` oraz `.gitignore` (sekcja 5).
- **Materiały:** [Mobile Security](./mobile-security.md), [App Publishing](./app-publishing.md), [App Distribution](./app-distribution.md).

### 6) Uprawnienia i prywatność
- [ ] **Sprawdź:** aplikacja żąda wyłącznie niezbędnych uprawnień i ma jasne uzasadnienie ich użycia.
- **Przykład:** manifest z minimalnym zestawem permissions i opisem funkcjonalnym w README.
- **Materiały:** [Accessibility](./accessibility.md), [AI Legal Aspects](./ai-legal-aspects.md), [App Metadata](./app-metadata.md).

### 7) Aktualizacje zależności
- [ ] **Sprawdź:** brak krytycznych CVE i istnieje plan aktualizacji bibliotek.
- **Przykład:** cykliczny job CI uruchamiający skan podatności + raport w PR.
- **Materiały:** [AGP Upgrade Assistant](./agp-upgrade-assistant.md), [Android Studio](./android-studio.md), [App Updates](./app-updates.md).

### 8) Logowanie i monitoring incydentów
- [ ] **Sprawdź:** logi nie zawierają PII/tokenów, a alerty bezpieczeństwa są monitorowane.
- **Przykład:** redakcja wartości nagłówków i pól wrażliwych przed wysłaniem logów do crash analytics.
- **Materiały:** [Mobile Performance](./mobile-performance.md), [App Updates](./app-updates.md), [AI Privacy & Security](./ai-privacy-security.md).

### 9) Testy bezpieczeństwa
- [ ] **Sprawdź:** wykonano minimum testów: MITM, brute-force login, walidacja inputu, replay tokena.
- **Przykład:** scenariusze testowe w raporcie QA + automatyczne testy API.
- **Materiały:** [Android Testing](./android-testing.md), [Projekt zaliczeniowy z laboratorium](./projekt-zaliczeniowy_z_laboratorium.md).

### 10) Go/No-Go przed oddaniem
- [ ] **Sprawdź:** każdy błąd security ma severity, właściciela i termin naprawy.
- **Przykład:** tabela ryzyk (`issue`, `severity`, `owner`, `due date`, `mitigation`) dołączona do PR.
- **Materiały:** [Projekt zaliczeniowy](./projekt-zaliczeniowy.md), [Best Practices Checklist](./best-practices-checklist.md).
