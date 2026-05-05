# GPU i renderowanie grafiki

GPU (Graphics Processing Unit) w urządzeniach mobilnych odpowiada nie tylko za gry - renderuje każdą klatkę interfejsu użytkownika. Zrozumienie potoku renderowania pozwala eliminować przyczyny „jank" (zacinania) w aplikacjach.

## Potok renderowania GPU

Poniższy diagram ilustruje kolejne etapy, przez które przechodzi klatka animacji - od kodu aplikacji aż do fizycznego wyświetlacza. Każdy etap angażuje inne zasoby sprzętowe, dlatego znajomość tego potoku pozwala precyzyjnie lokalizować i eliminować wąskie gardła wydajnościowe.

```
Aplikacja (CPU)
    │
    ▼
DisplayList / RenderNode     ← Compose/View tworzy listę operacji rysowania
    │
    ▼
hwui / Skia (GPU backend)    ← Przekłada operacje na komendy GPU
    │
    ▼
Shaders & Rasterization      ← GPU przetwarza geometrię i tekstury
    │
    ▼
Frame Buffer                 ← Gotowa klatka w pamięci GPU
    │
    ▼
Display (VSYNC @ 60/90/120Hz)
```

## VSync i Frame Budget

Przy 60 Hz ekran odświeża się co **16.67 ms** - tyle czasu masz na przygotowanie każdej klatki.
Przy 120 Hz (LTPO) budżet to **8.33 ms**.

```
|<-- 16.67 ms ----------------------------------------->|
| CPU: Measure + Layout + Draw  | GPU: Render | Display |
|    < 5 ms        < 4 ms       |   < 7 ms    |         |
```

Przekroczenie budżetu = klatka zostaje pominięta = widoczne „szarpanie".

## Problemy wydajności GPU

### Overdraw

Overdraw to wielokrotne rysowanie tego samego piksela. Każda warstwa (background → card → text) maluje ten sam obszar:

```kotlin
// PROBLEM - zbędne tło na każdej warstwie
Column(modifier = Modifier.background(Color.White)) {
    Card(modifier = Modifier.background(Color.White)) {  // nadmiarowe!
        Text("Hello", modifier = Modifier.background(Color.White))  // nadmiarowe!
    }
}

// ROZWIĄZANIE - tło tylko tam gdzie potrzeba
Column {
    Card {
        Text("Hello")
    }
}
```

**Jak sprawdzić:** Android Studio → Profiler → GPU Rendering lub `adb shell setprop debug.hwui.overdraw show`

### Drogie operacje rysowania

| Operacja | Koszt | Alternatywa |
|----------|-------|-------------|
| `BlurMaskFilter` (software) | Wysoki | `RenderEffect.blur` (hardware) |
| `Canvas.drawText` z cieniami | Średni | Unikaj w pętli |
| `clipPath` z `Path` | Średni | `RoundedCornerShape` |
| Wiele warstw z `alpha` | Wysoki | Pojedynczy `alpha` na rodzicu |

## Hardware Acceleration

Android domyślnie używa akceleracji sprzętowej dla wszystkich widoków od API 14, jednak w szczególnych przypadkach warto świadomie kontrolować typ warstwy renderowania. Użycie `LAYER_TYPE_HARDWARE` umożliwia buforowanie widoku jako tekstury GPU, co drastycznie przyspiesza animacje na statycznych elementach. W Jetpack Compose odpowiednikiem jest modyfikator `graphicsLayer`, który deleguje transformacje bezpośrednio do GPU bez ponownej kompozycji.

```kotlin
// Wymuszenie software renderingu (rzadko potrzebne - tylko do debugowania)
view.setLayerType(View.LAYER_TYPE_SOFTWARE, null)

// Hardware layer - cache bitmapy na GPU (dla animacji statycznych widoków)
view.setLayerType(View.LAYER_TYPE_HARDWARE, null)

// W Compose - graphicsLayer dla transformacji bez rekomposycji
Box(
    modifier = Modifier.graphicsLayer {
        alpha = animatedAlpha
        translationY = animatedOffset
        scaleX = animatedScale
    }
)
```

## GPU Profiling - Perfetto / GPU Counters

Perfetto to zaawansowane narzędzie do profilowania dostępne w systemie Android, umożliwiające zbieranie szczegółowych danych o pracy GPU bezpośrednio na urządzeniu. Poniższe polecenia uruchamiają nagrywanie śladu z licznikami GPU, a wynikowy plik można następnie przeanalizować w przeglądarce `ui.perfetto.dev`.

```bash
# Uruchomienie trace z GPU counters
adb shell perfetto -c /data/misc/perfetto-traces/config.pbtx \
    --out /data/misc/perfetto-traces/trace.pftrace

# Podgląd w przeglądarce
# Wgraj plik na: https://ui.perfetto.dev
```

Kluczowe metryki GPU do śledzenia:
- **GPU Active** - % czasu gdy GPU przetwarza
- **Fragment ALU Instructions** - liczba operacji na piksel
- **Texture Cache Misses** - pudła w cache tekstur
- **Render Target Switches** - kosztowne przełączenia buforów

## Shader Compilation Jank (Android 12+)

Kompilacja shaderów w trakcie pierwszego uruchomienia aplikacji powoduje zauważalne zacinanie, ponieważ procesor musi natychmiast przetworzyć kod GLSL/SPIR-V. Android 12 wprowadził mechanizm automatycznego buforowania skompilowanych shaderów, a Baseline Profile pozwala wyeliminować podobne opóźnienia związane z kompilacją JIT. Poniższa konfiguracja Gradle pokazuje, jak włączyć te optymalizacje w projekcie.

```kotlin
// build.gradle.kts - włącz profile guided optimization
android {
    defaultConfig {
        // Kompilacja shaderów przed pierwszym uruchomieniem
        // Android 12+ buforuje shadery automatycznie
    }
    // Baseline Profile - eliminuje JIT compilation lag
    dependencies {
        implementation("androidx.profileinstaller:profileinstaller:1.3.1")
    }
}
```

## Linki

- [Android GPU Rendering](https://developer.android.com/topic/performance/rendering)
- [Perfetto](https://perfetto.dev)
- [Overdraw Debugging](https://developer.android.com/topic/performance/rendering/overdraw)

## Compose Rendering Pipeline

Jetpack Compose ma własny, zoptymalizowany potok renderowania oparty o Skia/Canvas:

```
Composition → Layout → Drawing
     ↑             ↑          ↑
  recompose    remeasure   redraw
  (najtańsze)            (najdroższe GPU)
```

Kluczowa zasada: **minimalizuj fazy przejścia wyżej** w potoku.

Poniższy przykład pokazuje krytyczną różnicę między modyfikatorem `offset` a `graphicsLayer`. Użycie `offset` wyzwala pełny pass layoutu przy każdej zmianie wartości, natomiast `graphicsLayer` przesuwa gotową warstwę GPU bez angażowania CPU do ponownych pomiarów i rysowania potomków. Prawidłowe korzystanie z tych modyfikatorów jest jedną z najważniejszych technik optymalizacji płynności animacji w Compose.

```kotlin
// BŁĄD - offset zmienia Layout → przebudowuje wszystko
var offset by remember { mutableStateOf(0f) }
Box(modifier = Modifier.offset { IntOffset(offset.toInt(), 0) })
// Każda zmiana offset uruchamia Layout pass

// POPRAWNIE - graphicsLayer zmienia tylko Draw pass
Box(modifier = Modifier.graphicsLayer { translationX = offset })
// Zmiana nie rerenderuje potomków - tylko przesuwa warstwę GPU

// Animacje bez rekomposycji
val offsetAnim = remember { Animatable(0f) }
LaunchedEffect(isVisible) {
    offsetAnim.animateTo(
        if (isVisible) 0f else -200f,
        animationSpec = spring(dampingRatio = Spring.DampingRatioMediumBouncy)
    )
}
Box(modifier = Modifier.graphicsLayer { translationY = offsetAnim.value })
```

## Kanały renderowania - RenderEffect

`RenderEffect` to API dostępne od Androida 12 (API 31), które pozwala nakładać efekty graficzne - takie jak rozmycie czy filtry kolorów - bezpośrednio na poziomie GPU, bez konieczności ręcznego przetwarzania pikseli na CPU. Efekty można łączyć w łańcuchy, tworząc złożone filtry wizualne przy minimalnym koszcie obliczeniowym. Poniższy przykład demonstruje rozmycie tła oraz desaturację za pomocą łańcucha efektów.

```kotlin
// RenderEffect - efekty graficzne na poziomie GPU (API 31+)
@Composable
fun BlurredBackground(content: @Composable () -> Unit) {
    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) {
        Box(
            modifier = Modifier.graphicsLayer {
                renderEffect = BlurEffect(
                    radiusX = 20f,
                    radiusY = 20f,
                    edgeTreatment = TileMode.Clamp
                )
            }
        ) { content() }
    } else {
        content()
    }
}

// Łańcuch efektów
val combinedEffect = BlurEffect(10f, 10f)
    .then(ColorFilterEffect(ColorFilter.colorMatrix(ColorMatrix().apply {
        setToSaturation(0f) // Desaturacja
    })))
```

## Canvas - rysowanie własne

Komponent `Canvas` w Jetpack Compose umożliwia rysowanie dowolnych kształtów, ścieżek i tekstów bezpośrednio na płótnie GPU, co jest niezbędne przy tworzeniu niestandardowych wykresów i wizualizacji. Poniższy przykład implementuje wykres pierścieniowy (donut chart), gdzie każdy wycinek odpowiada proporcjonalnej wartości z listy danych. Technika ta jest bardziej wydajna niż kompozycja wielu nakładających się widoków, ponieważ redukuje liczbę węzłów w drzewie kompozycji.

```kotlin
@Composable
fun DonutChart(
    data: List<Float>,
    colors: List<Color>,
    modifier: Modifier = Modifier
) {
    Canvas(modifier = modifier) {
        val total = data.sum()
        var startAngle = -90f  // Zacznij od góry

        data.forEachIndexed { i, value ->
            val sweepAngle = (value / total) * 360f

            drawArc(
                color = colors[i],
                startAngle = startAngle,
                sweepAngle = sweepAngle,
                useCenter = false,
                style = Stroke(width = 40.dp.toPx(), cap = StrokeCap.Butt),
                size = Size(size.width * 0.8f, size.height * 0.8f),
                topLeft = Offset(size.width * 0.1f, size.height * 0.1f)
            )
            startAngle += sweepAngle
        }

        // Etykieta w środku
        val centerText = "${(data.first() / total * 100).toInt()}%"
        drawContext.canvas.nativeCanvas.drawText(
            centerText,
            size.width / 2f,
            size.height / 2f + 12.dp.toPx(),
            android.graphics.Paint().apply {
                textAlign = android.graphics.Paint.Align.CENTER
                textSize = 24.dp.toPx()
                color = android.graphics.Color.WHITE
                isFakeBoldText = true
            }
        )
    }
}
```

## Benchmark - pomiar wydajności renderowania

Biblioteka Macrobenchmark pozwala mierzyć rzeczywistą wydajność renderowania na fizycznym urządzeniu lub emulatorze, rejestrując metryki takie jak czas trwania klatek (`FrameTimingMetric`). Jest to preferowana metoda weryfikacji optymalizacji, ponieważ wyniki odzwierciedlają warunki produkcyjne znacznie wierniej niż testy jednostkowe. Poniższy przykład mierzy płynność przewijania listy i może być uruchomiony jako część automatycznego pipeline CI/CD.

```kotlin
// build.gradle.kts - moduł benchmarkowy
plugins {
    id("com.android.library")
    id("androidx.benchmark")
}

// Benchmark Compose rekomposycji
@RunWith(AndroidJUnit4::class)
class ComposeBenchmark {
    @get:Rule
    val benchmarkRule = ComposeBenchmarkRule()

    @Test
    fun lazyListScrollBenchmark() = benchmarkRule.measureRepeated(
        packageName = "com.example.myapp",
        metrics = listOf(FrameTimingMetric()),
        iterations = 5,
        setupBlock = {
            pressHome()
            startActivityAndWait()
        }
    ) {
        // Przewiń listę 5 razy
        repeat(5) {
            device.findObject(By.res("lazy_list")).scroll(Direction.DOWN, 1f)
        }
    }
}
```

## Linki dodatkowe

- [Compose Performance](https://developer.android.com/jetpack/compose/performance)
- [RenderEffect API](https://developer.android.com/reference/android/graphics/RenderEffect)
- [Macrobenchmark](https://developer.android.com/topic/performance/benchmarking/macrobenchmark-overview)
