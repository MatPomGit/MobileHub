# GPU i Renderowanie Grafiki

GPU (Graphics Processing Unit) w urządzeniach mobilnych odpowiada nie tylko za gry — renderuje każdą klatkę interfejsu użytkownika. Zrozumienie potoku renderowania pozwala eliminować przyczyny „jank" (zacinania) w aplikacjach.

## Potok renderowania GPU

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

Przy 60 Hz ekran odświeża się co **16.67 ms** — tyle czasu masz na przygotowanie każdej klatki.  
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
// PROBLEM — zbędne tło na każdej warstwie
Column(modifier = Modifier.background(Color.White)) {
    Card(modifier = Modifier.background(Color.White)) {  // nadmiarowe!
        Text("Hello", modifier = Modifier.background(Color.White))  // nadmiarowe!
    }
}

// ROZWIĄZANIE — tło tylko tam gdzie potrzeba
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

```kotlin
// Wymuszenie software renderingu (rzadko potrzebne — tylko do debugowania)
view.setLayerType(View.LAYER_TYPE_SOFTWARE, null)

// Hardware layer — cache bitmapy na GPU (dla animacji statycznych widoków)
view.setLayerType(View.LAYER_TYPE_HARDWARE, null)

// W Compose — graphicsLayer dla transformacji bez rekomposycji
Box(
    modifier = Modifier.graphicsLayer {
        alpha = animatedAlpha
        translationY = animatedOffset
        scaleX = animatedScale
    }
)
```

## GPU Profiling — Perfetto / GPU Counters

```bash
# Uruchomienie trace z GPU counters
adb shell perfetto -c /data/misc/perfetto-traces/config.pbtx \
    --out /data/misc/perfetto-traces/trace.pftrace

# Podgląd w przeglądarce
# Wgraj plik na: https://ui.perfetto.dev
```

Kluczowe metryki GPU do śledzenia:
- **GPU Active** — % czasu gdy GPU przetwarza
- **Fragment ALU Instructions** — liczba operacji na piksel
- **Texture Cache Misses** — pudła w cache tekstur
- **Render Target Switches** — kosztowne przełączenia buforów

## Shader Compilation Jank (Android 12+)

```kotlin
// build.gradle.kts — włącz profile guided optimization
android {
    defaultConfig {
        // Kompilacja shaderów przed pierwszym uruchomieniem
        // Android 12+ buforuje shadery automatycznie
    }
    // Baseline Profile — eliminuje JIT compilation lag
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

```kotlin
// BŁĄD — offset zmienia Layout → przebudowuje wszystko
var offset by remember { mutableStateOf(0f) }
Box(modifier = Modifier.offset { IntOffset(offset.toInt(), 0) })
// Każda zmiana offset uruchamia Layout pass

// POPRAWNIE — graphicsLayer zmienia tylko Draw pass
Box(modifier = Modifier.graphicsLayer { translationX = offset })
// Zmiana nie rerenderuje potomków — tylko przesuwa warstwę GPU

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

## Kanały renderowania — RenderEffect

```kotlin
// RenderEffect — efekty graficzne na poziomie GPU (API 31+)
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

## Canvas — rysowanie własne

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

## Benchmark — pomiar wydajności renderowania

```kotlin
// build.gradle.kts — moduł benchmarkowy
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
