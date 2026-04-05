# Integracja mediów społecznościowych w aplikacjach mobilnych

Integracja mediów społecznościowych to jeden z najpopularniejszych sposobów na zwiększenie zasięgu aplikacji mobilnej i uproszczenie procesu rejestracji. Umożliwia logowanie przez zewnętrznego dostawcę (Facebook, Google, Apple), udostępnianie treści, pobieranie profilów użytkowników i synchronizację kontaktów. Każda z tych funkcji niesie jednak poważne konsekwencje dla prywatności i bezpieczeństwa danych.

## Powody integracji mediów społecznościowych

Twórcy aplikacji sięgają po SDK platform społecznościowych z kilku kluczowych powodów:

- **Szybka rejestracja i logowanie** — użytkownik nie musi tworzyć nowego konta; wystarczy jedno kliknięcie.
- **Mniejsza liczba porzuceń formularzy** — krótszy onboarding poprawia konwersję nawet o 50 %.
- **Dostęp do danych profilowych** — imię, zdjęcie, adres e-mail i lista znajomych mogą wzbogacić UX.
- **Mechanizmy udostępniania** — użytkownicy promują aplikację w swoich sieciach (viral growth).
- **Powiadomienia i głęboka integracja** — Messenger, Stories, Feed Sharing.

## Logowanie przez media społecznościowe (SSO)

### OAuth 2.0 i OpenID Connect

Większość platform korzysta ze standardu **OAuth 2.0** (autoryzacja) z rozszerzeniem **OpenID Connect** (tożsamość). Schemat działania:

```
Aplikacja → Żądanie autoryzacji → Serwer OAuth dostawcy
         ← Kod autoryzacji ←
         → Wymiana kodu na token →
         ← Access Token + ID Token ←
         → Zapytanie o profil użytkownika →
```

| Token | Przeznaczenie | Czas życia |
|-------|--------------|------------|
| Access Token | Dostęp do API dostawcy | Krótki (zwykle 1 h) |
| Refresh Token | Odświeżenie Access Tokenu | Długi (dni/miesiące) |
| ID Token (JWT) | Dane tożsamości (OIDC) | Jednorazowy |

### Implementacja — Sign in with Google (Android)

```kotlin
// build.gradle.kts
implementation("com.google.android.gms:play-services-auth:21.2.0")

// Konfiguracja klienta OAuth
val gso = GoogleSignInOptions.Builder(GoogleSignInOptions.DEFAULT_SIGN_IN)
    .requestEmail()
    .requestIdToken(getString(R.string.server_client_id)) // klient serwera backend
    .build()

val googleSignInClient = GoogleSignIn.getClient(this, gso)

// Uruchomienie okna logowania
val signInIntent = googleSignInClient.signInIntent
startActivityForResult(signInIntent, RC_SIGN_IN)

// Obsługa wyniku
override fun onActivityResult(requestCode: Int, resultCode: Int, data: Intent?) {
    super.onActivityResult(requestCode, resultCode, data)
    if (requestCode == RC_SIGN_IN) {
        val task = GoogleSignIn.getSignedInAccountFromIntent(data)
        try {
            val account = task.getResult(ApiException::class.java)
            val idToken = account.idToken ?: return
            // Wyślij idToken do własnego serwera backendu w celu weryfikacji
            sendTokenToBackend(idToken)
        } catch (e: ApiException) {
            Log.w(TAG, "Logowanie Google nie powiodło się: ${e.statusCode}")
        }
    }
}
```

> **Uwaga:** Nigdy nie ufaj danym z ID Tokenu bez weryfikacji podpisu po stronie serwera. Używaj biblioteki Google Auth Library lub odpowiednika w swoim backendzie.

### Implementacja — Sign in with Apple (iOS / obowiązkowe w App Store)

Od 2020 r. Apple **wymaga** dodania „Sign in with Apple" do każdej aplikacji, która oferuje logowanie przez inne platformy społecznościowe.

```swift
import AuthenticationServices

class LoginViewController: UIViewController, ASAuthorizationControllerDelegate {

    func startAppleSignIn() {
        let provider = ASAuthorizationAppleIDProvider()
        let request = provider.createRequest()
        request.requestedScopes = [.fullName, .email]

        let controller = ASAuthorizationController(authorizationRequests: [request])
        controller.delegate = self
        controller.performRequests()
    }

    func authorizationController(
        controller: ASAuthorizationController,
        didCompleteWithAuthorization authorization: ASAuthorization
    ) {
        guard let credential = authorization.credential
            as? ASAuthorizationAppleIDCredential else { return }

        let userID   = credential.user          // stabilny, unikalny identyfikator
        let idToken  = credential.identityToken // JWT — weryfikuj po stronie serwera
        let email    = credential.email         // dostępny tylko przy pierwszym logowaniu!
        // Wyślij idToken do backendu
    }
}
```

## Udostępnianie treści (Share API)

### Android Sharesheet

```kotlin
val shareIntent = Intent(Intent.ACTION_SEND).apply {
    type = "text/plain"
    putExtra(Intent.EXTRA_TEXT, "Sprawdź tę aplikację: https://example.com")
    putExtra(Intent.EXTRA_SUBJECT, "Polecam!")
}
startActivity(Intent.createChooser(shareIntent, "Udostępnij przez"))
```

### Web Share API (PWA / WebView)

```javascript
async function shareContent() {
    if (navigator.share) {
        await navigator.share({
            title: 'Moja aplikacja',
            text: 'Sprawdź tę świetną aplikację!',
            url: 'https://example.com'
        });
    } else {
        // Fallback: skopiuj do schowka lub otwórz własne okno udostępniania
        navigator.clipboard.writeText('https://example.com');
    }
}
```

## Pobieranie danych profilowych z API

Po zalogowaniu możemy pobrać dane użytkownika. Przykład z **Meta Graph API** (Facebook):

```kotlin
val request = GraphRequest.newMeRequest(
    AccessToken.getCurrentAccessToken()
) { jsonObject, _ ->
    val name  = jsonObject?.getString("name")
    val email = jsonObject?.getString("email")
    val photo = jsonObject?.getJSONObject("picture")
                          ?.getJSONObject("data")
                          ?.getString("url")
    updateProfile(name, email, photo)
}

val params = Bundle().apply {
    putString("fields", "id,name,email,picture.type(large)")
}
request.parameters = params
request.executeAsync()
```

> **Ważne:** Facebook ogranicza zakres danych dostępnych bez weryfikacji aplikacji (App Review). Dane pełnego profilu wymagają osobnego zatwierdzenia przez Meta.

## Zagrożenia wynikające z udostępniania danych użytkownika

Integracja z platformami społecznościowymi wiąże się z poważnymi ryzykami. Poniżej omówiono najważniejsze kategorie zagrożeń.

### 1. Nadmierne zbieranie danych (Over-Permission)

SDK mediów społecznościowych często domyślnie żądają dostępu do znacznie większego zakresu danych niż potrzeba aplikacji. Przykłady:

| Uprawnienie | Co ujawnia | Ryzyko |
|-------------|-----------|--------|
| `friends_list` | Sieć kontaktów | Profilowanie relacji społecznych |
| `user_location` | Historia geolokalizacji | Śledzenie ruchów użytkownika |
| `user_posts` | Historia publikacji | Analiza zachowań i poglądów |
| `read_insights` | Dane analityczne strony | Ujawnienie tajemnicy handlowej |

**Zasada minimalnych uprawnień:** Żądaj tylko danych niezbędnych do działania funkcji. Każde dodatkowe uprawnienie zwiększa powierzchnię ataku.

### 2. Wycieki tokenów (Token Leakage)

Access Token to klucz do konta użytkownika. Jego utrata oznacza pełny dostęp do danych i akcji w imieniu użytkownika.

Popularne miejsca wycieków:
- **Logowanie debug** — `Log.d("TOKEN", accessToken)` widoczne w logcat
- **URL query string** — token w adresie URL trafia do historii przeglądarki i serwerów proxy
- **Clipboard** — wklejenie tokenu do schowka i utrata kontroli
- **Intent sniffing** — przechwycenie powrotnego Intent z tokenem przez złośliwą aplikację

```kotlin
// ŹLE — token w logach
Log.d("DEBUG", "Access token: $accessToken")

// DOBRZE — maskowanie w logach
Log.d("DEBUG", "Access token: ${accessToken.take(8)}...")

// DOBRZE — przechowywanie tokenu w Android Keystore (EncryptedSharedPreferences)
securePrefs.edit { putString("social_token", accessToken) }
```

### 3. Śledzenie między aplikacjami (Cross-App Tracking)

SDK Facebooka, Twittera i innych platform zawierają kod śledzący, który:
- Identyfikuje użytkownika na podstawie Device ID, IDFA/GAID
- Rejestruje zdarzenia (ekrany, kliknięcia, zakupy) nawet gdy użytkownik **nie jest zalogowany**
- Przekazuje dane do serwerów platformy w tle

Od iOS 14.5 wymagana jest zgoda użytkownika (ATT — App Tracking Transparency):

```swift
import AppTrackingTransparency

ATTrackingManager.requestTrackingAuthorization { status in
    switch status {
    case .authorized:
        // Użytkownik wyraził zgodę — można aktywować śledzenie
        Analytics.shared.enable()
    default:
        // Brak zgody — wyłącz śledzenie
        Analytics.shared.disable()
    }
}
```

### 4. Naruszenia RODO (GDPR) / Ustawy o Ochronie Danych Osobowych

Przekazanie danych użytkownika do platformy społecznościowej może naruszać:

| Wymóg RODO | Konsekwencja naruszenia |
|-----------|------------------------|
| Art. 6 — podstawa prawna przetwarzania | Kara do 4 % globalnych obrotów lub 20 mln EUR |
| Art. 13/14 — obowiązek informacyjny | Niezgodność z prawem w UE |
| Art. 17 — prawo do usunięcia danych | Trudność usunięcia danych z serwera platformy |
| Art. 44-49 — transfer danych poza EOG | Ryzyko przy przekazaniu do USA bez odpowiednich gwarancji |

**Obowiązki dewelopera:**
1. Poinformuj użytkownika, jakie dane trafiają do platform społecznościowych
2. Uzyskaj wyraźną zgodę (checkboxem) przed inicjalizacją SDK
3. Umożliw cofnięcie zgody i żądanie usunięcia danych
4. Zadbaj o umowę powierzenia przetwarzania (DPA) z platformą

### 5. Ataki na łańcuch dostaw (Supply Chain Attack)

SDK platform społecznościowych to zewnętrzny kod binarny wykonywany z pełnymi uprawnieniami aplikacji. Ryzyko:
- Zainfekowana wersja SDK może kraść dane bez wiedzy dewelopera
- Automatyczna aktualizacja zależności może wprowadzić złośliwy kod

**Dobre praktyki:**
```kotlin
// build.gradle.kts — przypinanie wersji SDK
implementation("com.facebook.android:facebook-android-sdk:16.3.0")
// Nie używaj dynamic wersji: "16.+" — brak kontroli nad aktualizacjami

// Weryfikacja sumy kontrolnej (checksum pinning) przez Gradle Verification
```

Używaj narzędzia Dependency Guard lub OWASP Dependency-Check w pipeline CI/CD.

### 6. Account Takeover przez słabe SSO

Błędna implementacja logowania społecznościowego może pozwolić na przejęcie konta:

- **Brak weryfikacji `state` param** — podatność na CSRF w OAuth
- **Brak weryfikacji `nonce`** — możliwość replay ataku na ID Token
- **Brak weryfikacji `aud` (audience)** — token innej aplikacji może zalogować do twojej
- **Brak weryfikacji podpisu JWT** — akceptowanie fałszywych tokenów

```kotlin
// ZAWSZE weryfikuj token po stronie serwera, nigdy tylko po stronie klienta
// Przykład backendu (Kotlin / Ktor):
fun verifyGoogleIdToken(idTokenString: String): GoogleIdTokenVerifier {
    return GoogleIdTokenVerifier.Builder(NetHttpTransport(), GsonFactory.getDefaultInstance())
        .setAudience(listOf(CLIENT_ID))  // weryfikacja audience
        .build()
        .verify(idTokenString)           // weryfikacja podpisu i czasu ważności
}
```

## Dobre praktyki implementacji

### Lista kontrolna bezpiecznej integracji

- [ ] Używaj oficjalnych, aktualnych SDK dostawców
- [ ] Żądaj tylko niezbędnych uprawnień i zakresów (scopes)
- [ ] Przechowuj tokeny wyłącznie w bezpiecznym magazynie (Keystore / Keychain)
- [ ] Weryfikuj tokeny po stronie serwera (nie ufaj danym z klienta)
- [ ] Implementuj parametr `state` w OAuth jako token CSRF
- [ ] Informuj użytkownika o danych zbieranych przez platformy
- [ ] Uzyskaj zgodę (ATT na iOS, TCF na Androidzie) przed śledzeniem
- [ ] Monitoruj CVE i aktualizuj SDK na bieżąco
- [ ] Testuj przepływ logowania z fałszywymi tokenami

### Architektura z zachowaniem prywatności

```
[ Aplikacja mobilna ]
        ↓  ID Token (jednorazowy)
[ Własny backend ]
        ↓  weryfikacja + mapowanie
[ Lokalny użytkownik w bazie ]
        ↓  własny JWT/sesja
[ Aplikacja mobilna ]
```

Taka architektura oddziela tożsamość platformy od identyfikatora użytkownika w aplikacji — zmiana dostawcy logowania (lub jego odpięcie) nie wymaga modyfikacji wszystkich powiązanych danych.

## Porównanie popularnych dostawców SSO

| Dostawca | SDK Android | SDK iOS | Wymagany | Zakres danych |
|----------|------------|---------|----------|---------------|
| Google | `play-services-auth` | `GoogleSignIn` | Nie | E-mail, profil |
| Apple | — | `AuthenticationServices` | Tak (jeśli inne SSO) | E-mail (ukrywalny), imię |
| Facebook | `facebook-android-sdk` | `facebook-ios-sdk` | Nie | Profil, znajomi, posty |
| GitHub | Własne OAuth | Własne OAuth | Nie | Publiczny profil, e-mail |

## Linki

- [OAuth 2.0 — RFC 6749](https://datatracker.ietf.org/doc/html/rfc6749)
- [OpenID Connect Core 1.0](https://openid.net/specs/openid-connect-core-1_0.html)
- [Sign in with Google — Android](https://developers.google.com/identity/sign-in/android/start-integrating)
- [Sign in with Apple — Apple Developer](https://developer.apple.com/sign-in-with-apple/)
- [Meta Platform Policy](https://developers.facebook.com/policy/)
- [RODO — pełny tekst rozporządzenia](https://eur-lex.europa.eu/legal-content/PL/TXT/?uri=CELEX%3A32016R0679)
- [OWASP Mobile Top 10](https://owasp.org/www-project-mobile-top-10/)
- [App Tracking Transparency — Apple](https://developer.apple.com/documentation/apptrackingtransparency)
