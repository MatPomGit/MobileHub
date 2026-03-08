# Wyświetlacze i Technologie Ekranów

Ekran to interfejs między aplikacją a użytkownikiem. Zrozumienie technologii wyświetlaczy, gęstości pikseli i technologii odświeżania jest kluczowe dla tworzenia aplikacji wyglądających ostro na każdym urządzeniu.

## Technologie paneli

| Technologia | Zalety | Wady | Zastosowanie |
|-------------|--------|------|-------------|
| **OLED/AMOLED** | Prawdziwa czerń, HDR, energooszczędny | Burn-in, droższy | Flagowce |
| **LTPO OLED** | Zmienna częstotliwość 1–120 Hz | Bardzo drogi | Ultra-premium |
| **IPS LCD** | Dokładne kolory, bez burn-in | Brak prawdziwej czerni | Mid-range |
| **Mini-LED** | Lokalny HDR, jasność | Halo effect | iPad Pro |

## Gęstość pikseli (DPI)

```
Gęstość = √(px_w² + px_h²) / diagonal_inches

Przykład: 2400×1080 px, 6.4" ekran
Gęstość = √(2400² + 1080²) / 6.4 = 411 PPI
```

### Android — Density Buckets

```
mdpi    = 160 dpi  (1dp = 1px)  — podstawowy
hdpi    = 240 dpi  (1dp = 1.5px)
xhdpi   = 320 dpi  (1dp = 2px)  — większość urządzeń ~2018
xxhdpi  = 480 dpi  (1dp = 3px)  — obecne flagowce
xxxhdpi = 640 dpi  (1dp = 4px)  — ultra-premium
```

```kotlin
// Konwersja dp → px
fun Int.dpToPx(context: Context): Int {
    val density = context.resources.displayMetrics.density
    return (this * density + 0.5f).toInt()
}

// Compose — zawsze używaj dp, nie px!
Box(modifier = Modifier
    .width(200.dp)       // OK — skaluje się z gęstością
    .padding(16.dp)
)
```

## Częstotliwość odświeżania

```kotlin
// Sprawdzenie aktualnej częstotliwości
val display = windowManager.defaultDisplay
val refreshRate = display.refreshRate  // 60.0, 90.0, 120.0...

// Dostosuj animacje do częstotliwości (Compose robi to automatycznie)
// Nie hardkoduj 16ms — użyj withFrameNanos lub LaunchedEffect

// Wymuś określoną częstotliwość (np. 60Hz dla nagrywania video)
if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
    window.attributes = window.attributes.apply {
        preferredDisplayModeId = display.supportedModes
            .filter { it.refreshRate == 60f }
            .firstOrNull()?.modeId ?: 0
    }
}
```

## Notch, punch-hole i Dynamic Island

```kotlin
// Obsługa wcięcia (notch) — rysuj za systemowym UI
WindowCompat.setDecorFitsSystemWindows(window, false)

// Dopasuj UI do bezpiecznych obszarów
Box(
    modifier = Modifier
        .fillMaxSize()
        .windowInsetsPadding(WindowInsets.safeDrawing)
) {
    // Zawartość aplikacji
}

// Sprawdź insets
val insets = WindowInsetsCompat.toWindowInsetsCompat(
    ViewCompat.getRootWindowInsets(view)!!
)
val topInset = insets.getInsets(WindowInsetsCompat.Type.statusBars()).top
val bottomInset = insets.getInsets(WindowInsetsCompat.Type.navigationBars()).bottom
```

## HDR i szeroka gama barw

```kotlin
// Sprawdź czy urządzenie obsługuje HDR
val display = windowManager.defaultDisplay
val hdrCapabilities = display.hdrCapabilities
val supportsHdr10 = hdrCapabilities.supportedHdrTypes.contains(Display.HdrCapabilities.HDR_TYPE_HDR10)

// Tryb HDR dla odtwarzacza wideo
if (supportsHdr10) {
    window.attributes = window.attributes.also {
        it.colorMode = ActivityInfo.COLOR_MODE_HDR
    }
}
```

## Edge-to-Edge (Android 15+)

Od Androida 15 edge-to-edge jest wymuszone dla wszystkich aplikacji targetujących API 35+:

```kotlin
// Przed: WindowCompat.setDecorFitsSystemWindows(window, false)
// Po: domyślne zachowanie

// Wymagane — obsługa insets
ViewCompat.setOnApplyWindowInsetsListener(binding.root) { view, insets ->
    val bars = insets.getInsets(WindowInsetsCompat.Type.systemBars())
    view.updatePadding(top = bars.top, bottom = bars.bottom)
    insets
}
```

## Linki

- [Screen Densities](https://developer.android.com/training/multiscreen/screendensities)
- [Edge to Edge](https://developer.android.com/develop/ui/views/layout/edge-to-edge)
- [Display API](https://developer.android.com/reference/android/view/Display)

## Tryby kolorów i Dark Mode

```kotlin
// Sprawdzenie aktualnego trybu (jasny/ciemny)
val isDarkMode = when (resources.configuration.uiMode and Configuration.UI_MODE_NIGHT_MASK) {
    Configuration.UI_MODE_NIGHT_YES -> true
    else -> false
}

// Nasłuchiwanie zmian trybu
override fun onConfigurationChanged(newConfig: Configuration) {
    super.onConfigurationChanged(newConfig)
    when (newConfig.uiMode and Configuration.UI_MODE_NIGHT_MASK) {
        Configuration.UI_MODE_NIGHT_YES -> applyDarkTheme()
        Configuration.UI_MODE_NIGHT_NO  -> applyLightTheme()
    }
}
```

```kotlin
// Compose — automatyczny dark mode przez MaterialTheme
@Composable
fun MyApp() {
    val darkTheme = isSystemInDarkTheme()

    MaterialTheme(
        colorScheme = if (darkTheme) DarkColorScheme else LightColorScheme
    ) {
        // Komponenty automatycznie używają właściwych kolorów
        Surface(color = MaterialTheme.colorScheme.background) {
            AppContent()
        }
    }
}

// Definicja palet
private val LightColorScheme = lightColorScheme(
    primary         = Color(0xFF6650A4),
    onPrimary       = Color(0xFFFFFFFF),
    surface         = Color(0xFFFFFBFE),
    onSurface       = Color(0xFF1C1B1F),
    background      = Color(0xFFFFFBFE),
)

private val DarkColorScheme = darkColorScheme(
    primary         = Color(0xFFD0BCFF),
    onPrimary       = Color(0xFF381E72),
    surface         = Color(0xFF1C1B1F),
    onSurface       = Color(0xFFE6E1E5),
    background      = Color(0xFF1C1B1F),
)
```

## Dynamic Color (Android 12+ / Material You)

Material You generuje paletę kolorów z tapety użytkownika:

```kotlin
@Composable
fun DynamicTheme(
    darkTheme: Boolean = isSystemInDarkTheme(),
    content: @Composable () -> Unit
) {
    val colorScheme = when {
        // Dynamic color dostępne tylko na Androidzie 12+
        Build.VERSION.SDK_INT >= Build.VERSION_CODES.S -> {
            val context = LocalContext.current
            if (darkTheme) dynamicDarkColorScheme(context) else dynamicLightColorScheme(context)
        }
        // Fallback dla starszych wersji
        darkTheme -> DarkColorScheme
        else -> LightColorScheme
    }

    MaterialTheme(colorScheme = colorScheme, content = content)
}
```

## Adaptacyjne układy — telefon vs tablet vs foldable

```kotlin
// WindowSizeClass — klasyfikacja rozmiaru okna
@Composable
fun AdaptiveLayout() {
    val windowSizeClass = calculateWindowSizeClass(LocalContext.current as Activity)

    when (windowSizeClass.widthSizeClass) {
        WindowWidthSizeClass.Compact -> {
            // Telefon — jeden panel, bottom navigation
            PhoneLayout()
        }
        WindowWidthSizeClass.Medium -> {
            // Tablet/foldable — opcjonalny side panel
            TabletLayout(showSidebar = false)
        }
        WindowWidthSizeClass.Expanded -> {
            // Duży tablet — lista + szczegóły obok siebie
            TwoPaneLayout()
        }
    }
}

@Composable
fun TwoPaneLayout() {
    Row(modifier = Modifier.fillMaxSize()) {
        // Lista — lewa strona
        LazyColumn(modifier = Modifier.weight(0.35f)) {
            items(articles) { article ->
                ArticleListItem(article, onClick = { selectedArticle = article })
            }
        }
        Divider(modifier = Modifier.fillMaxHeight().width(1.dp))
        // Szczegóły — prawa strona
        ArticleDetail(
            article = selectedArticle,
            modifier = Modifier.weight(0.65f)
        )
    }
}
```

## Animowane ikony i lottie

```kotlin
dependencies {
    implementation("com.airbnb.android:lottie-compose:6.4.0")
}

@Composable
fun AnimatedSplashScreen(onFinished: () -> Unit) {
    val composition by rememberLottieComposition(
        LottieCompositionSpec.RawRes(R.raw.splash_animation)
    )
    val progress by animateLottieCompositionAsState(
        composition = composition,
        iterations = 1
    )

    LaunchedEffect(progress) {
        if (progress == 1f) onFinished()
    }

    LottieAnimation(
        composition = composition,
        progress = { progress },
        modifier = Modifier.fillMaxSize()
    )
}
```

## Linki dodatkowe

- [Material You](https://m3.material.io/styles/color/dynamic-color/overview)
- [WindowSizeClass](https://developer.android.com/guide/topics/large-screens/support-different-screen-sizes)
- [Lottie for Android](https://airbnb.io/lottie/#/android)
