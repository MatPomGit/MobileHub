# Publikacja i Promocja Własnej Aplikacji Mobilnej

Opublikowanie aplikacji w sklepie to dopiero połowa sukcesu — równie ważna jest jej widoczność, pozyskanie pierwszych użytkowników i utrzymanie ocen na poziomie gwarantującym organiczny wzrost. Ten artykuł przeprowadza przez cały cykl: od przygotowania materiałów, przez publikację w Google Play i App Store, aż po strategie marketingowe i analitykę po wdrożeniu.

## Przygotowanie do publikacji

### Checklista przed wysłaniem do sklepu

```
Wymagania techniczne:
  ☑ Aplikacja działa na fizycznym urządzeniu (nie tylko emulatorze)
  ☑ targetSdk zgodne z wymaganiami sklepu (Android API 35+, iOS 17+)
  ☑ Podpisany build (AAB dla Google Play, IPA dla App Store)
  ☑ Brak krytycznych crashów (Crashlytics < 1% sesji)
  ☑ Obsługa trybu offline lub czytelna informacja o braku połączenia
  ☑ Permissions — tylko niezbędne, z opisem rationale

Materiały marketingowe:
  ☑ Ikona 512×512 px (PNG, bez transparentności dla Play)
  ☑ Feature Graphic 1024×500 px (Google Play)
  ☑ Screenshoty dla każdego obsługiwanego formatu ekranu
  ☑ Krótki opis (do 80 znaków) + pełny opis (do 4000 znaków)
  ☑ Polityka prywatności (URL dostępny publicznie)
  ☑ Kategoria aplikacji i tagi

Prawne i RODO:
  ☑ Polityka prywatności zgodna z RODO/GDPR
  ☑ Formularz Data Safety (Google Play) / Privacy Nutrition Labels (App Store)
  ☑ Regulamin korzystania z aplikacji (jeśli zbierasz dane)
  ☑ Wiek docelowy (COPPA — aplikacje dla dzieci wymagają dodatkowych zgód)
```

### Materiały graficzne — standardy

| Element | Google Play | App Store |
|---------|-------------|-----------|
| **Ikona** | 512×512 px, PNG | 1024×1024 px, PNG |
| **Screenshoty telefon** | min. 2, max. 8; min. 320px | min. 1, max. 10; 6.7" |
| **Screenshoty tablet** | Opcjonalne (zalecane) | Opcjonalne (iPad) |
| **Feature Graphic** | 1024×500 px | — |
| **Promo Video** | YouTube URL (opcjonalnie) | MP4, max 30s (opcjonalnie) |

```
Wskazówki dot. screenhotów:
 • Pokaż kluczowe funkcje w pierwszych 2-3 slajdach
 • Dodaj krótki podpis do każdego screenshota
 • Użyj narzędzi: Canva, Figma, AppMockUp, Screenshot.guru
 • Screenshoty muszą odpowiadać AKTUALNEJ wersji aplikacji
 • Nie używaj prawdziwych danych osobowych na screenhotach
```

---

## Publikacja w Google Play

### Konto deweloperskie i opłaty

```
Google Play Console:
  Jednorazowa opłata rejestracyjna: $25 USD
  Prowizja od zakupów: 15% (do $1M/rok) lub 30%
  Czas review: 1–3 dni robocze (pierwsza aplikacja może trwać dłużej)

URL: https://play.google.com/console
```

### Podpisanie i przesyłanie AAB

Poniższe polecenia bashowe realizują trzyetapowy proces przygotowania wersji release do Google Play. Polecenie `keytool` z flagą `-genkey` generuje nowy keystore — plik przechowujący klucz prywatny RSA 2048-bitowy, którym podpisujemy każdą wersję aplikacji. Flaga `-validity 10000` ustawia ważność certyfikatu na ok. 27 lat: Google wymaga, by certyfikat był ważny do 2033 roku dla nowych aplikacji, a standardem jest generowanie z bardzo długim czasem ważności jednorazowo na początku projektu. Polecenie `./gradlew bundleRelease` uruchamia Gradle w trybie AAB (Android App Bundle) zamiast APK — AAB to format przeznaczony wyłącznie do przesłania do Google Play, gdzie Google dynamicznie generuje zoptymalizowane APK dla każdego urządzenia osobno, zmniejszając rozmiar pobieranego przez użytkownika pakietu o 15–40%.

```bash
# 1. Generowanie keystore (zrób to raz — ZACHOWAJ NA ZAWSZE)
keytool -genkey -v -keystore release.jks \
  -keyalg RSA -keysize 2048 -validity 10000 \
  -alias my-app-key

# 2. Konfiguracja w build.gradle.kts
# (patrz artykuł: Ekosystem Android i Google Play)

# 3. Budowanie podpisanego AAB
./gradlew bundleRelease

# Plik wynikowy:
# app/build/outputs/bundle/release/app-release.aab
```

> **Uwaga:** Włącz **Play App Signing** — Google przechowuje wtedy klucz produkcyjny. Twój keystore staje się „upload key". W przypadku utraty upload key możesz poprosić Google o reset. Bez Play App Signing utrata keystore = trwała niemożność aktualizacji aplikacji.

### Kanały dystrybucji (Tracks)

```
Internal Testing  →  Closed Testing  →  Open Testing  →  Production
 do 100 kont          lista e-mail       publiczne %      wszyscy
 Natychmiastowy       <24h review        <24h review      1-3 dni review
```

**Staged rollout** — stopniowe wdrażanie do użytkowników produkcyjnych:

```
1% → 5% → 10% → 25% → 50% → 100%
        ↑ obserwuj Crash Rate i oceny przed każdym krokiem
```

Wstrzymaj rollout jeśli:
- Crash rate wzrośnie powyżej 1%
- ANR rate wzrośnie powyżej 0,47%
- Ocena spadnie gwałtownie (więcej niż 0,3 gwiazdki)

### Opis aplikacji — SEO w sklepie

```
Tytuł (max. 30 znaków):
  ✓ "MójBudżet — Finanse Osobiste"
  ✗ "Super Niesamowita Aplikacja Finansowa Pro+"

Krótki opis (max. 80 znaków):
  → Wyświetlany w wynikach wyszukiwania
  → Najważniejsze słowo kluczowe na początku
  → Jasna propozycja wartości

Pełny opis (max. 4000 znaków):
  → Pierwsze 2-3 zdania najważniejsze (przed "rozwiń")
  → Wypisz funkcje jako lista punktowana
  → Naturalne użycie słów kluczowych (nie upychanie)
  → Zakończ wezwaniem do działania (CTA)
```

---

## Publikacja w App Store

### Konto Apple Developer

```
Apple Developer Program:
  Roczna opłata: $99 USD (Individual lub Organization)
  Prowizja: 15% (do $1M/rok) lub 30%
  Czas review: 1–3 dni (możliwa procedura odwoławcza)

Enterprise Program: $299/rok — dystrybucja wewnętrzna bez App Store
URL: https://appstoreconnect.apple.com
```

### Certyfikaty i provisioning profiles

```
Xcode → Signing & Capabilities → Automatically manage signing
  ↓
  Xcode pobiera/generuje:
  - Development Certificate (dla testów na urządzeniu)
  - Distribution Certificate (dla App Store)
  - App ID (Bundle Identifier: com.firma.aplikacja)
  - Provisioning Profile (łączy certyfikat + App ID + urządzenia)
```

```swift
// Info.plist — opis uprawnień (wymagane przez App Review)
// Każde użyte uprawnienie musi mieć NSUsageDescription
<key>NSCameraUsageDescription</key>
<string>Aplikacja wymaga dostępu do aparatu, aby skanować kody QR.</string>

<key>NSLocationWhenInUseUsageDescription</key>
<string>Lokalizacja jest używana do wyświetlenia pobliskich punktów.</string>
```

> **Wskazówka:** Brakujące klucze `NSUsageDescription` to jedna z najczęstszych przyczyn odrzucenia przez App Review. Opisy muszą być konkretne i pisane z perspektywy użytkownika — Apple odrzuca ogólnikowe komunikaty w stylu „Wymagany do działania aplikacji".

### TestFlight — testy beta

```
TestFlight pozwala na dystrybucję do testerów przed publikacją:

Wewnętrzni testerzy (Internal):
  - Max. 100 osób z Team Members
  - Natychmiastowy dostęp, bez review Apple

Zewnętrzni testerzy (External):
  - Max. 10 000 osób
  - Wymagany przegląd Beta App Review (do 24h)
  - Zaproszenie przez e-mail lub publiczny link

Czas ważności buildu: 90 dni od przesłania
```

### App Review — częste przyczyny odrzucenia

| Przyczyna | Jak uniknąć |
|-----------|-------------|
| Crashe podczas review | Przetestuj na czystym urządzeniu przed wysłaniem |
| Brakujące uprawnienia NSUsageDescription | Uzupełnij Info.plist dla każdego uprawnienia |
| Fałszywe/nieaktualne screenshoty | Screenshoty muszą odpowiadać aktualnej wersji |
| Brak polityki prywatności | Dodaj URL do App Store Connect |
| Treści naruszające wytyczne | Przeczytaj App Review Guidelines przed wysłaniem |
| Imitacja innej aplikacji | Oryginalne UI i nazwa |
| Niedziałające funkcje | Wszystkie opisane funkcje muszą działać |

---

## App Store Optimization (ASO)

ASO to SEO dla sklepów z aplikacjami — optymalizacja widoczności w wynikach wyszukiwania organicznego.

### Czynniki wpływające na ranking

```
Czynniki bezpośrednie (możliwe do optymalizacji):
  • Tytuł aplikacji — najważniejsze słowa kluczowe
  • Podtytuł (App Store) / Krótki opis (Google Play)
  • Pole Keywords (App Store, max 100 znaków — oddzielone przecinkiem)
  • Pełny opis — naturalne użycie słów kluczowych
  • Ikona — wpływa na CTR z wyników wyszukiwania
  • Screenshoty i promo video — wpływają na konwersję

Czynniki pośrednie (wynik działań):
  • Średnia ocena (gwiazdki)
  • Liczba ocen i recenzji
  • Wskaźnik instalacji vs wyświetleń (conversion rate)
  • Retencja użytkowników (DAU/MAU)
  • Crash rate i ANR (Google Play Vitals)
```

### Badanie słów kluczowych

```
Narzędzia bezpłatne:
  • App Store / Google Play — autouzupełnianie wyszukiwarki
  • AppFollow, AppTweak (plany free z ograniczeniami)
  • Sensor Tower (ograniczone dane free)
  • MobileAction

Strategie:
  1. Zidentyfikuj 10–20 słów kluczowych opisujących funkcje
  2. Sprawdź, jakie słowa kluczowe stosuje konkurencja
  3. Wybierz mix: wysoki wolumen + niska konkurencja
  4. Testuj i iteruj co 4–6 tygodni (App Store pozwala na A/B testy)
```

### A/B testy w sklepie

**Google Play — Store Listing Experiments:**
```
Play Console → Rozwijanie → Eksperymenty z listą w sklepie
  → Testuj: ikony, screenshoty, krótki opis, grafiki funkcji
  → Minimalna próba: ~1000 wyświetleń dla wyniku statystycznego
  → Czas trwania: 7–30 dni
```

**App Store — Product Page Optimization:**
```
App Store Connect → Features → Product Page Optimization
  → Testuj: ikona, screenshoty, promo video (max 3 warianty)
  → Apple automatycznie rozdziela ruch
  → Wyniki po min. 7 dniach
```

---

## Strategie Promocji

### Marketing przed premierą (pre-launch)

```
6–8 tygodni przed publikacją:
  ☑ Strona landing page (np. na GitHub Pages, Netlify, Carrd)
  ☑ Zbieranie adresów e-mail zainteresowanych (Mailchimp, ConvertKit)
  ☑ Profile w mediach społecznościowych (@nazwaaplikacji)
  ☑ Teaser screenshoty / krótkie video na Instagram/TikTok
  ☑ Rejestracja w bazie ProductHunt (ship.producthunt.com)
  ☑ Beta testerzy przez TestFlight / Google Play Internal Track
```

### Strona landing page — minimum viable

```html
<!-- Elementy skutecznej strony landing page dla aplikacji mobilnej -->

1. NAGŁÓWEK:
   Nazwa aplikacji + hasło (co robi w jednym zdaniu)
   Przyciski: "Pobierz na iOS" + "Pobierz na Android"

2. HERO SECTION:
   Mockup urządzenia z aktualnym screenshotem
   Animowane GIF lub promo video (max. 30s)

3. FUNKCJE (3–5 kluczowych):
   Ikona + krótki tytuł + 1 zdanie opisu

4. SCREENSHOTY:
   Karuzela 4–6 screenhotów

5. OPINIE:
   Cytaty beta testerów (ze zgodą)

6. CALL TO ACTION:
   Formularz e-mail lub bezpośredni link do sklepu

Hosting: GitHub Pages (za darmo), Netlify, Vercel
Szablony: Carrd.co, Readymag, Webflow
```

### Dystrybucja treści — pierwsze 30 dni po premierze

```
Tydzień 1 — Premiera:
  → ProductHunt (wtorek–czwartek — najlepsze dni)
  → Posty na LinkedIn / X (Twitter) / Instagram
  → Reddit: r/androidapps, r/iOSapps, niszowe subreddity tematyczne
  → Hacker News: "Show HN: NazwaApki — opis w jednym zdaniu"

Tydzień 2–4 — Budowanie zasięgu:
  → Artykuł na Medium / Dev.to opisujący jak zbudowałeś aplikację
  → Kontakt do blogerów i twórców YouTube w niszy aplikacji
  → Grupy na Facebooku i fora tematyczne związane z kategorią
  → Press kit dla dziennikarzy tech (AppAdvice, AndroidPolice)
```

### Press Kit — zawartość

```
press-kit/
├── logo/
│   ├── logo-dark.png         (PNG, 1000×1000 px, ciemne tło)
│   ├── logo-light.png        (PNG, 1000×1000 px, jasne tło)
│   └── logo.svg              (wektorowy)
├── screenshots/
│   ├── screen-01.png         (kluczowy ekran)
│   └── screen-02.png
├── icon.png                  (1024×1024 px)
├── app-description.txt       (krótki + długi opis)
├── fact-sheet.pdf            (nazwa, platforma, cena, data, kontakt)
└── contact.txt               (e-mail prasowy)
```

### Oceny i recenzje — jak je zdobywać

Prośba o ocenę w odpowiednim momencie sesji może znacząco zwiększyć liczbę pozytywnych recenzji. Poniższy kod Kotlin implementuje Google Play In-App Review API, które wyświetla natywny dialog systemu z prośbą o ocenę **bez opuszczania aplikacji**. `ReviewManagerFactory.create(context)` zwraca instancję menadżera — w środowisku produkcyjnym korzysta z prawdziwego Play Store, a w środowisku testowym z trybu testowego (można go wymusić przez `FakeReviewManager`). Dwuetapowy proces (najpierw `requestReviewFlow()`, potem `launchReviewFlow()`) jest celowy: `requestReviewFlow()` odpytuje Google o dostępność promptu i przygotowuje `ReviewInfo` z informacjami o aplikacji, a `launchReviewFlow()` właściwie go wyświetla. Google **nie gwarantuje**, że prompt zostanie pokazany — system może go zablokować, jeśli użytkownik już ocenił aplikację lub prompt był wyświetlany zbyt niedawno. Dlatego callback `addOnCompleteListener` nie informuje, czy użytkownik faktycznie coś wybrał — aplikacja musi kontynuować działanie niezależnie od wyniku.

```kotlin
// Android — In-App Review API (Google Play)
// Prośba o ocenę pojawia się wewnątrz aplikacji, bez opuszczania jej

class ReviewManager(private val context: Context) {
    private val manager = ReviewManagerFactory.create(context)

    fun requestReview(activity: Activity) {
        val request = manager.requestReviewFlow()
        request.addOnCompleteListener { task ->
            if (task.isSuccessful) {
                val reviewInfo = task.result
                val flow = manager.launchReviewFlow(activity, reviewInfo)
                flow.addOnCompleteListener {
                    // Flow zakończony (użytkownik mógł ocenić lub nie)
                }
            }
        }
    }
}

// Kiedy prosić o ocenę?
// ✓ Po ukończeniu kluczowej akcji (np. po 5 sesjach)
// ✓ Po pozytywnym zdarzeniu (cel osiągnięty, zadanie wykonane)
// ✗ Nigdy przy uruchomieniu aplikacji
// ✗ Nigdy po błędzie lub crashu
// ✗ Maksymalnie raz na 30 dni (Google ogranicza częstotliwość)
```

Poniższy kod Swift realizuje prośbę o ocenę w aplikacji iOS za pomocą `SKStoreReviewController`. W SwiftUI preferowanym sposobem jest dekorator `@Environment(\.requestReview)` — jest on wstrzykiwany przez środowisko SwiftUI i wywołuje systemowy prompt niezależnie od kontekstu, bez konieczności importowania `StoreKit` w widoku. W UIKit konieczne jest uzyskanie `UIWindowScene`, ponieważ od iPadOS 13 aplikacje mogą mieć wiele okien, a prompt musi być powiązany z konkretnym oknem. Apple, podobnie jak Google, ogranicza wyświetlanie promptu — do 3 razy w ciągu 365 dni, niezależnie od tego, ile razy wywołamy tę metodę. Dzięki temu deweloper nie może nadużywać prośby o ocenę, co chroni użytkownika przed irytującymi powiadomieniami.

```swift
// iOS — SKStoreReviewController
import StoreKit

// SwiftUI
struct ReviewRequestView: View {
    @Environment(\.requestReview) var requestReview

    var body: some View {
        Button("Oceń aplikację") {
            requestReview()
        }
    }
}

// UIKit
if let scene = UIApplication.shared.connectedScenes.first as? UIWindowScene {
    SKStoreReviewController.requestReview(in: scene)
}
// Apple ogranicza wyświetlanie promptu do 3 razy w ciągu 365 dni
```

---

## Analityka po Publikacji

### Firebase Analytics — kluczowe metryki

Firebase Analytics pozwala śledzić zachowanie użytkowników w aplikacji i podejmować decyzje oparte na danych. Poniższy kod inicjalizuje Firebase przy użyciu Bill of Materials (BOM) — platforma `firebase-bom` zarządza spójnymi wersjami wszystkich bibliotek Firebase, dzięki czemu nie trzeba ręcznie synchronizować wersji `firebase-analytics` z `firebase-crashlytics`. Klasa `AnalyticsManager` enkapsuluje logowanie zdarzeń w trzech metodach: `logScreenView()` używa predefiniowanego zdarzenia `SCREEN_VIEW` z standardowymi parametrami `SCREEN_NAME` i `SCREEN_CLASS`, co pozwala Firebase na automatyczne budowanie raportów lejka nawigacyjnego. Używanie predefiniowanych stałych (`FirebaseAnalytics.Event.*`, `FirebaseAnalytics.Param.*`) zamiast „magicznych stringów" jest preferowane, bo Firebase Analytics obsługuje te zdarzenia specjalnie w dashboardzie. Metoda `logFeatureUsed()` loguje niestandardowe zdarzenia — nazwa `feature_used` i parametr `feature_name` pozwalają śledzić, które funkcje aplikacji są faktycznie używane, co jest podstawą do priorytetyzacji dalszego rozwoju. `logPurchase()` używa standardowego zdarzenia `PURCHASE`, które Firebase automatycznie przekazuje do Google Analytics for Firebase i umożliwia śledzenie przychodów bez dodatkowej konfiguracji.

```kotlin
// Dodanie Firebase Analytics do projektu
// build.gradle.kts
dependencies {
    implementation(platform("com.google.firebase:firebase-bom:33.0.0"))
    implementation("com.google.firebase:firebase-analytics")
    implementation("com.google.firebase:firebase-crashlytics")
}

// Logowanie niestandardowych zdarzeń
class AnalyticsManager(private val analytics: FirebaseAnalytics) {

    fun logScreenView(screenName: String, className: String) {
        val params = Bundle().apply {
            putString(FirebaseAnalytics.Param.SCREEN_NAME, screenName)
            putString(FirebaseAnalytics.Param.SCREEN_CLASS, className)
        }
        analytics.logEvent(FirebaseAnalytics.Event.SCREEN_VIEW, params)
    }

    fun logFeatureUsed(featureName: String) {
        val params = Bundle().apply {
            putString("feature_name", featureName)
        }
        analytics.logEvent("feature_used", params)
    }

    fun logPurchase(productId: String, price: Double, currency: String) {
        val params = Bundle().apply {
            putString(FirebaseAnalytics.Param.ITEM_ID, productId)
            putDouble(FirebaseAnalytics.Param.VALUE, price)
            putString(FirebaseAnalytics.Param.CURRENCY, currency)
        }
        analytics.logEvent(FirebaseAnalytics.Event.PURCHASE, params)
    }
}
```

### Metryki do śledzenia

| Metryka | Co mierzy | Benchmark |
|---------|-----------|-----------|
| **Retention Day 1** | % użytkowników wracających po 1 dniu | > 30% dobrze |
| **Retention Day 7** | % wracających po tygodniu | > 15% dobrze |
| **Retention Day 30** | % wracających po miesiącu | > 5% dobrze |
| **DAU/MAU** | Dzienna aktywność / miesięczna | > 20% = dobra aplikacja |
| **Session Length** | Średni czas sesji | zależy od kategorii |
| **Crash-free rate** | % sesji bez crashy | > 99% |
| **Rating** | Średnia ocena | ≥ 4.2 dla widoczności |

### Google Play Console — Android Vitals

```
Play Console → Android Vitals → monitoruj:

Crash Rate:           < 1.09% (próg "złych podstawowych wskaźników")
ANR Rate:             < 0.47%
Excessive Wakeups:    < 10/godzinę
Stuck Wake Locks:     < 1 sesja/godzinę

Przekroczenie progów:
 → Ostrzeżenie w Play Console
 → Obniżona widoczność w wynikach wyszukiwania
 → Możliwa blokada aktualizacji
```

### Odpowiadanie na recenzje

```
Zasady odpowiadania na recenzje:
  ✓ Odpowiadaj na WSZYSTKIE recenzje 1–2 gwiazdkowe w ciągu 24–48h
  ✓ Odpowiedź grzeczna, konkretna, bez defensywności
  ✓ Podziękuj za feedback, opisz co zrobisz / co zostało naprawione
  ✓ Przy naprawieniu błędu — odpowiedz i poproś o aktualizację oceny
  ✗ Nigdy nie kłóć się z recenzentem publicznie
  ✗ Nie używaj szablonowych odpowiedzi dla wszystkich
  ✗ Nie oferuj nagród w zamian za zmianę oceny (naruszenie polityki)

Przykład odpowiedzi na negatywną recenzję:
  "Dziękujemy za feedback! Problem z [funkcja] został naprawiony
   w wersji 1.2.1 — sprawdź aktualizację w sklepie.
   Jeśli nadal masz problem, napisz do nas: support@aplikacja.pl"
```

---

## Wersjonowanie i Aktualizacje

### Semantic Versioning dla aplikacji mobilnych

```
MAJOR.MINOR.PATCH (+ version code/build number)

Przykłady:
  1.0.0 (versionCode: 1)  — premiera
  1.0.1 (versionCode: 2)  — hotfix: naprawa krasha
  1.1.0 (versionCode: 3)  — nowa funkcja
  2.0.0 (versionCode: 4)  — przepisanie UI / breaking change

Android — build.gradle.kts:
  versionCode = 10        // int, musi rosnąć przy każdym przesłaniu
  versionName = "1.2.0"  // string wyświetlany użytkownikom

iOS — Xcode / Info.plist:
  CFBundleVersion = "10"          // build number, musi rosnąć
  CFBundleShortVersionString = "1.2.0"  // wyświetlana wersja
```

### Changelog dla użytkowników

```
Zasady dobrego changelogu w sklepie:
  ✓ Pisz dla UŻYTKOWNIKA, nie dla programisty
  ✓ Zaczynaj od najważniejszych zmian
  ✓ Używaj języka aplikacji (PL dla polskich użytkowników)
  ✓ Maksymalnie 5–7 punktorów, konkretnie

Przykład:
  "Co nowego w wersji 2.1.0:
   • Ciemny motyw — teraz dostępny w Ustawieniach
   • Szybsze ładowanie listy (o 40%)
   • Poprawka: aplikacja nie zawiesza się przy słabym Wi-Fi
   • Nowe powiadomienia push o zbliżających się płatnościach"

Czego unikać:
  ✗ "Poprawki błędów i ulepszenia wydajności" (zbyt ogólne)
  ✗ Żargon techniczny: "zrefaktoryzowano moduł DI"
  ✗ Ściana tekstu bez punktorów
```

### Harmonogram wydań

```
Zalecany cykl:
  Hotfix (krytyczny crash):    jak najszybciej, w ciągu 24–48h
  Patch (drobne poprawki):     co 2–4 tygodnie
  Minor (nowe funkcje):        co 4–8 tygodni
  Major (duże zmiany):         co kwartał lub rzadziej

CI/CD dla automatycznej publikacji:
  (patrz artykuł: Ekosystem Android — CI/CD z Fastlane)
```

---

## Linki

- [Google Play Console](https://play.google.com/console)
- [App Store Connect](https://appstoreconnect.apple.com)
- [Google Play — Centrum zasad dla deweloperów](https://play.google.com/about/developer-content-policy/)
- [Apple App Store Review Guidelines](https://developer.apple.com/app-store/review/guidelines/)
- [Firebase Analytics](https://firebase.google.com/docs/analytics)
- [In-App Review API (Android)](https://developer.android.com/guide/playcore/in-app-review)
- [SKStoreReviewController (iOS)](https://developer.apple.com/documentation/storekit/skstorereviewcontroller)
- [App Store Optimization — AppFollow](https://appfollow.io/aso)
- [Fastlane — automatyzacja publikacji](https://fastlane.tools)
- [ProductHunt — platforma premierowa](https://www.producthunt.com)
