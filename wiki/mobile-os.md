# Systemy Operacyjne Urządzeń Mobilnych

Aplikacja mobilna to oprogramowanie zaprojektowane specjalnie z myślą o urządzeniach przenośnych — smartfonach i tabletach. W odróżnieniu od aplikacji desktopowych musi ona uwzględniać ograniczenia sprzętowe (bateria, pamięć, procesor), nieciągłość połączeń sieciowych oraz specyficzne wzorce interakcji dotykowej.

## Android

Android to system operacyjny oparty na jądrze Linux, rozwijany przez Google i wydany jako open-source (AOSP). Dominuje na rynku globalnym z udziałem ponad 70%.

**Kluczowe cechy:**
- Wielozadaniowość i otwartość platformy
- Dystrybucja aplikacji przez Google Play
- Fragmentacja sprzętu i wersji systemu (API level)
- Język programowania: **Kotlin** (oficjalny od 2017) i Java
- UI toolkit: **Jetpack Compose** (deklaratywny, od 2021) lub XML Views (tradycyjny)

```kotlin
// Przykład: minimalna aktywność w Compose
class MainActivity : ComponentActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContent {
            Text("Witaj, Android!")
        }
    }
}
```

**Wersje i API levels (wybór):**

| Wersja | Nazwa | API Level | Rok |
|--------|-------|-----------|-----|
| 10     | Q     | 29        | 2019|
| 12     | S     | 31        | 2021|
| 13     | T     | 33        | 2022|
| 14     | U     | 34        | 2023|
| 15     | V     | 35        | 2024|

> **Wskazówka:** Zawsze ustawiaj `minSdk` możliwie nisko (np. 24 = Android 7.0) by objąć jak największą grupę użytkowników, a `targetSdk` na najnowsze API.

## iOS / iPadOS

iOS to zamknięty system Apple działający wyłącznie na urządzeniach iPhone. iPadOS to jego wariant dla tabletów iPad. Razem stanowią ok. 27% rynku globalnie, ale ponad 50% w USA i Europie Zachodniej.

**Kluczowe cechy:**
- Ścisła kontrola ekosystemu — dystrybucja wyłącznie przez App Store
- Język: **Swift** (od 2014) i Objective-C (legacy)
- UI toolkit: **SwiftUI** (deklaratywny, od 2019) lub UIKit (tradycyjny)
- Szybkie aktualizacje systemu — >90% urządzeń na najnowszej wersji

```swift
// Przykład: widok SwiftUI
struct ContentView: View {
    var body: some View {
        Text("Witaj, iOS!")
            .padding()
    }
}
```

## Inne systemy

- **HarmonyOS (Huawei)** — własny system Huawei, API podobne do Android, obecny głównie w Chinach
- **KaiOS** — uproszczony system dla telefonów "feature phone", oparty na przeglądarce, rynek rozwijający się
- **watchOS / tvOS / visionOS** — systemy Apple dla zegarków, telewizorów i gogli XR

## Fragmentacja ekosystemu Android

Fragmentacja to jeden z największych wyzwań dla deweloperów Android. Oznacza ona, że ta sama aplikacja musi poprawnie działać na setkach różnych urządzeń od różnych producentów (Samsung, Xiaomi, Oppo, OnePlus...) z różnymi wersjami Androida i customizowanymi powłokami systemu.

**Strategie radzenia sobie z fragmentacją:**
1. Używaj Jetpack — biblioteki compatibility warstwy adaptacyjnej
2. Ustawiaj rozsądne `minSdkVersion`
3. Testuj na emulatorach z różnymi API levels
4. Używaj Firebase Test Lab do testów na realnych urządzeniach

## Wybór platformy docelowej

| Kryterium | Android | iOS |
|-----------|---------|-----|
| Udział rynkowy (globał) | ~72% | ~28% |
| Monetyzacja | Niższa ARPU | Wyższa ARPU |
| Czas aktualizacji | Wolniejszy (fragmentacja) | Szybszy |
| Koszt publikacji | $25 jednorazowo | $99/rok |
| Narzędzie IDE | Android Studio | Xcode |

## Linki

- [Android Developers](https://developer.android.com)
- [Apple Developer](https://developer.apple.com)
- [StatCounter — Mobile OS Market Share](https://gs.statcounter.com/os-market-share/mobile)
