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

### Przykład kodu (Gradle local.properties)

```kotlin
// Funkcja wczytuje klucz z local.properties, aby nie trzymać sekretu w kodzie źródłowym.
fun loadApiKey(project: Project): String {
    val props = Properties()
    val localPropsFile = project.rootProject.file("local.properties")
    props.load(localPropsFile.inputStream())
    return props.getProperty("MAPS_API_KEY") ?: error("Missing MAPS_API_KEY")
}
```

### Materiały uzupełniające
- OWASP Secrets Management Cheat Sheet.
- GitHub Secret Scanning.

---

## Najczęstsze błędy bezpieczeństwa w projektach studenckich i naprawy

| Błąd | Ryzyko | Jak naprawić |
|---|---|---|
| Token w `SharedPreferences` bez szyfrowania | Kradzież sesji po przejęciu urządzenia | Przenieść token do EncryptedSharedPreferences/Keychain |
| Hardkodowany API key w kodzie | Nadużycie API i koszty | Przenieść sekret do CI/CD i configu środowiskowego |
| `usesCleartextTraffic=true` | Podsłuch i MITM | Wymusić HTTPS i wyłączyć cleartext |
| Brak pinningu przy danych krytycznych | Podstawienie certyfikatu | Dodać certificate pinning + backup pin |
| Logowanie tokenów do Logcat | Wyciek danych z logów | Maskować dane lub usuwać logi produkcyjne |
| `android:debuggable=true` w release | Łatwiejsza analiza i modyfikacja aplikacji | Oddzielić build types, sprawdzić release manifest |
| Brak walidacji danych wejściowych | Iniekcje i błędy logiki | Dodać walidację DTO + testy negatywne |
| Zbyt szerokie uprawnienia Android | Nadmiarowy dostęp do danych | Zasada least privilege, runtime permissions |

---

## Checklista audytu bezpieczeństwa przed oddaniem projektu

> Każdy punkt zawiera **kontrolę**, **przykład kodu** i **materiał uzupełniający**.

1. **Storage:** Czy dane wrażliwe są szyfrowane lokalnie?  
   - Kod: `saveSecureToken(...)` z sekcji 1.  
   - Materiał: OWASP MASVS (Data Storage).

2. **Token lifecycle:** Czy tokeny mają poprawny cykl życia i logout?  
   - Kod: `AuthInterceptor` z sekcji 2 + endpoint revoke po logout.  
   - Materiał: RFC 6750, OAuth BCP.

3. **Transport security:** Czy aplikacja wymusza HTTPS i TLS?  
   - Kod: `android:usesCleartextTraffic="false"` + `network_security_config.xml` z sekcji 4.  
   - Materiał: Android Network Security Config.

4. **Pinning:** Czy dla krytycznych endpointów wdrożono certificate pinning?  
   - Kod: `createPinnedClient()` z sekcji 3.  
   - Materiał: OWASP MASTG Network Tests.

5. **Sekrety:** Czy sekrety nie znajdują się w repozytorium?  
   - Kod: `loadApiKey(...)` z sekcji 5.  
   - Materiał: OWASP Secrets Management Cheat Sheet.

6. **Build release:** Czy build produkcyjny ma wyłączone debugowanie i testowe flagi?  
   - Kod: release config + manifest (`debuggable=false`).  
   - Materiał: Android App Security Best Practices.

7. **Uprawnienia:** Czy żądane uprawnienia są minimalne i uzasadnione?  
   - Kod: Android permissions + runtime request tylko przy użyciu funkcji.  
   - Materiał: Android Permission Guidelines.

8. **Logowanie:** Czy logi nie zawierają tokenów, haseł i danych użytkownika?  
   - Kod: helper maskujący (`token.take(4) + "***"`).  
   - Materiał: OWASP Logging Cheat Sheet.

9. **Obsługa błędów:** Czy komunikaty błędów nie ujawniają szczegółów backendu?  
   - Kod: generyczne komunikaty UI + szczegóły tylko w bezpiecznym monitoringu.  
   - Materiał: OWASP Error Handling Cheat Sheet.

10. **Weryfikacja końcowa:** Czy wykonano testy bezpieczeństwa przed oddaniem?  
   - Kod/narzędzia: MobSF, OWASP ZAP, Android Lint, dependency scan.  
   - Materiał: OWASP Mobile Testing Guide.
