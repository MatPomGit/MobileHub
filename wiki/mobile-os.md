# Systemy Operacyjne Urządzeń Mobilnych

Aplikacja mobilna to oprogramowanie zaprojektowane specjalnie z myślą o urządzeniach przenośnych — smartfonach i tabletach. W odróżnieniu od aplikacji desktopowych musi ona uwzględniać ograniczenia sprzętowe (bateria, pamięć, procesor), nieciągłość połączeń sieciowych i specyficzne wzorce interakcji dotykowej.

## Android

Android to system operacyjny oparty na jądrze Linux, rozwijany przez Google. AOSP (Android Open Source Project) to fundament, na którym producenci budują własne powłoki systemowe.

**Kluczowe cechy:**
- Wielozadaniowość i otwarta architektura
- Dystrybucja przez Google Play i alternatywne sklepy
- Fragmentacja sprzętu: setki producentów, tysiące modeli
- Języki: **Kotlin** (oficjalny od 2017), Java (legacy)
- UI toolkit: **Jetpack Compose** (deklaratywny) lub XML Views

```kotlin
// Minimalna aplikacja Compose
class MainActivity : ComponentActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContent {
            MaterialTheme {
                Surface {
                    Text("Witaj, Android!")
                }
            }
        }
    }
}
```

### Wersje i API Levels

| Wersja | Nazwa kodowa | API | Rok | Udział (2024) |
|--------|-------------|-----|-----|---------------|
| 10     | Q           | 29  | 2019 | ~7% |
| 11     | R           | 30  | 2020 | ~9% |
| 12     | S           | 31  | 2021 | ~13% |
| 13     | T           | 33  | 2022 | ~22% |
| 14     | U           | 34  | 2023 | ~25% |
| 15     | V           | 35  | 2024 | rosnący |

> **Wskazówka:** Ustaw `minSdk = 26` (Android 8.0) by objąć ~95% urządzeń. `targetSdk` zawsze na najnowszym API. Dla `compileSdk` również najnowsze.

### Architektura Android

```
┌─────────────────────────────────────────────┐
│             Aplikacje (Java/Kotlin)          │
├─────────────────────────────────────────────┤
│      Android Runtime (ART) + Core Libraries  │
├──────────────────┬──────────────────────────┤
│  Android Framework│  Native C/C++ Libraries  │
│  (Activity Mgr,  │  (OpenGL ES, SQLite,      │
│   Window Mgr...) │   WebKit, libc...)         │
├──────────────────┴──────────────────────────┤
│              Linux Kernel                    │
│  (Drivers: Camera, BT, Wi-Fi, USB, Audio...) │
└─────────────────────────────────────────────┘
```

## iOS / iPadOS

iOS to zamknięty, sprzętowo-programowy ekosystem Apple. Działa wyłącznie na urządzeniach Apple — iPhone i iPod Touch. iPadOS to wyspecjalizowany wariant dla tabletów iPad z dodatkowymi funkcjami wielozadaniowości.

**Kluczowe cechy:**
- Ścisła kontrola ekosystemu — dystrybucja wyłącznie przez App Store (UE: alternatywy od 2024)
- Języki: **Swift** (od 2014), Objective-C (legacy)
- UI toolkit: **SwiftUI** (deklaratywny, od 2019) lub UIKit
- Bardzo szybka adopcja aktualizacji: >90% urządzeń na najnowszej wersji w 3 miesiące

```swift
// Minimalna aplikacja SwiftUI
@main
struct MyApp: App {
    var body: some Scene {
        WindowGroup {
            ContentView()
        }
    }
}

struct ContentView: View {
    var body: some View {
        Text("Witaj, iOS!")
            .font(.largeTitle)
            .padding()
    }
}
```

### Wersje iOS

| Wersja | Rok | Kluczowe funkcje |
|--------|-----|-----------------|
| iOS 16 | 2022 | Lock Screen widgets, Live Activities |
| iOS 17 | 2023 | Interactive Widgets, `@Observable` macro |
| iOS 18 | 2024 | Apple Intelligence, RCS, Control Center API |

## Porównanie platform

| Kryterium | Android | iOS |
|-----------|---------|-----|
| Udział rynkowy (global) | ~72% | ~28% |
| Udział rynkowy (USA/Europa Zach.) | ~45% | ~55% |
| Monetyzacja (ARPU) | Niższa | Wyższa (2-3×) |
| Koszt konta deweloperskiego | $25 jednorazowo | $99/rok |
| Czas review aplikacji | 1-3 dni | 1-3 dni |
| Fragmentacja | Wysoka (setki urządzeń) | Niska (kilka modeli) |
| Język programowania | Kotlin | Swift |
| IDE | Android Studio | Xcode |

## Fragmentacja Androida

Fragmentacja to jeden z największych wyzwań deweloperów Android. Ta sama aplikacja musi działać na:
- Urządzeniach od Samsunga, Xiaomi, Oppo, Vivo, Motoroli...
- Android 8.0 (2017) aż do Android 15 (2024)
- Powłokach: One UI, MIUI, ColorOS, FunTouch, OxygenOS...
- Ekranach od 4" do 7.9", różnych proporcjach i gęstościach

```kotlin
// Strategia obsługi fragmentacji — sprawdzanie wersji przed użyciem API
if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) {
    // API 31+ (Android 12) — Splash Screen API
    installSplashScreen()
}

// Conditional features z BuildConfig
when {
    Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU -> {
        // Android 13+ — granular media permissions
        requestPermissions(arrayOf(Manifest.permission.READ_MEDIA_IMAGES))
    }
    else -> {
        requestPermissions(arrayOf(Manifest.permission.READ_EXTERNAL_STORAGE))
    }
}
```

## HarmonyOS i inne systemy

- **HarmonyOS (Huawei)** — własny system Huawei, API kompatybilne z Androidem, obecny głównie w Chinach; nowa wersja HarmonyOS NEXT (2024) zrywa z Androidem
- **KaiOS** — system dla telefonów feature phone, oparty na przeglądarce Firefox OS; popularny w Indiach i Afryce
- **watchOS** — iOS dla Apple Watch; watchOS apps pisze się w SwiftUI
- **visionOS** — system dla Apple Vision Pro, AR/VR; programowanie w SwiftUI + RealityKit

## Wybór platformy dla projektu

Priorytety przy wyborze:
1. **Kim są docelowi użytkownicy?** — sprawdź udział platform w Twojej grupie docelowej
2. **Jaki jest budżet?** — iOS wymaga Maca i $99/rok; Android tańszy entry
3. **Czy potrzebujesz natywnych funkcji?** — głęboka integracja z platformą = natywne
4. **Czas na rynek?** — cross-platform (Flutter/RN) = szybciej, ale kompromisy

## Linki

- [Android Developers](https://developer.android.com)
- [Apple Developer](https://developer.apple.com)
- [StatCounter — Mobile OS](https://gs.statcounter.com/os-market-share/mobile)
- [Android Distribution Dashboard](https://developer.android.com/about/dashboards)

## Android vs iOS — porównanie dla dewelopera

| Aspekt | Android | iOS |
|--------|---------|-----|
| **Język** | Kotlin, Java | Swift, Objective-C |
| **IDE** | Android Studio | Xcode |
| **UI Framework** | Jetpack Compose, Views | SwiftUI, UIKit |
| **Dystrybucja** | Google Play + sideloading | App Store (głównie) |
| **Fragmentacja** | Wysoka (tysiące urządzeń) | Niska (Apple kontroluje hw) |
| **Aktualizacje OS** | Wolne (zależy od OEM) | Szybkie |
| **Background** | Bardziej liberalny | Restrykcyjny |
| **Przychody** | 30% prowizja (15% mali deweloperzy) | 30% (15% do $1M/rok) |

## Historia wersji Android

```
Android 1.0 (2008)   — pierwsze urządzenie: HTC Dream
Android 2.3 (2010)   — Gingerbread, NFC, sensory
Android 4.0 (2011)   — ICS, Holo design, fragments
Android 5.0 (2014)   — Lollipop, Material Design, ART runtime
Android 6.0 (2015)   — Marshmallow, uprawnienia w runtime
Android 7.0 (2016)   — Nougat, split-screen
Android 8.0 (2017)   — Oreo, notification channels, PIP
Android 9.0 (2018)   — Pie, gesture navigation
Android 10  (2019)   — Q, dark mode, scope storage
Android 11  (2020)   — R, conversation notifications
Android 12  (2021)   — Material You, dynamic color
Android 13  (2022)   — T, granular media permissions
Android 14  (2023)   — U, predictive back, health connect
Android 15  (2024)   — V, edge-to-edge wymuszone
```

## System uprawnień Android

```kotlin
// Uprawnienia dzielą się na:
// - INSTALL_TIME: przyznawane przy instalacji (INTERNET, VIBRATE)
// - RUNTIME: użytkownik musi zatwierdzić (kamera, lokalizacja, kontakty)
// - SIGNATURE: tylko app z tym samym certyfikatem

// Prośba o uprawnienie w runtime
class CameraPermissionLauncher(private val activity: ComponentActivity) {

    private val launcher = activity.registerForActivityResult(
        ActivityResultContracts.RequestPermission()
    ) { granted ->
        if (granted) {
            openCamera()
        } else {
            if (!activity.shouldShowRequestPermissionRationale(Manifest.permission.CAMERA)) {
                // Użytkownik wybrał "Nie pytaj ponownie" → przekieruj do ustawień
                showGoToSettingsDialog()
            } else {
                showPermissionExplanation()
            }
        }
    }

    fun request() {
        when {
            ContextCompat.checkSelfPermission(activity, Manifest.permission.CAMERA)
                == PackageManager.PERMISSION_GRANTED -> openCamera()

            activity.shouldShowRequestPermissionRationale(Manifest.permission.CAMERA) -> {
                showRationale { launcher.launch(Manifest.permission.CAMERA) }
            }

            else -> launcher.launch(Manifest.permission.CAMERA)
        }
    }
}
```

## Linki dodatkowe

- [Android Versions](https://developer.android.com/about/versions)
- [App Permissions](https://developer.android.com/guide/topics/permissions/overview)
- [iOS Release History](https://support.apple.com/en-us/101566)
