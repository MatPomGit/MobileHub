# Architektura i Budowa Urządzeń Mobilnych

Zrozumienie sprzętu urządzenia mobilnego pozwala pisać lepsze, wydajniejsze aplikacje — wiedzieć, dlaczego pewne operacje są kosztowne, jak efektywnie korzystać z baterii i jak interpretować ograniczenia platformy.

## Procesory mobilne (SoC)

Sercem urządzenia mobilnego jest **SoC** (System on a Chip) — układ scalony integrujący CPU, GPU, pamięć RAM, modem, DSP i inne komponenty na jednym krzemie.

### Główni producenci SoC

| Producent | Seria | Platforma |
|-----------|-------|-----------|
| **Qualcomm** | Snapdragon 8 Gen X | Android (flagowce) |
| **MediaTek** | Dimensity 9000+ | Android (mid-range) |
| **Apple** | A-series (A18 Pro) | iPhone |
| **Apple** | M-series (M4) | iPad Pro |
| **Samsung** | Exynos | Własne urządzenia Samsung |
| **Google** | Tensor G4 | Pixel |

### Architektura big.LITTLE / DynamIQ

Nowoczesne mobilne CPU stosują asymetryczną architekturę rdzeni:

```
big cores (wydajność)    LITTLE cores (efektywność)
    Cortex-X4 ×1              Cortex-A720 ×3
    Cortex-A720 ×4            Cortex-A520 ×4
```

System operacyjny dynamicznie przydziela zadania do odpowiednich rdzeni. Intensywne obliczenia (gry, AI) trafiają na big cores, a zadania w tle (sprawdzanie poczty) na LITTLE cores, oszczędzając baterię.

> **Implikacja dla dewelopera:** Długotrwałe obliczenia na głównym wątku UI blokują big cores i powodują janky (poniżej 60 FPS). Zawsze przenoś ciężkie operacje na wątki tła (Coroutines, AsyncTask, WorkManager).

## GPU mobilny

GPU w urządzeniach mobilnych:
- **Qualcomm Adreno** — wysoka kompatybilność, dobra wydajność OpenGL ES i Vulkan
- **ARM Mali** — używany przez Samsung Exynos i MediaTek
- **Apple GPU** — własna architektura, zintegrowana z Metal API
- **Imagination PowerVR** — używany w starszych urządzeniach Apple i MediaTek

Do programowania grafiki mobilnej służą:
- **OpenGL ES 3.2** — cross-platform, legacy
- **Vulkan** — niski poziom, wysoka wydajność, Android 7+
- **Metal** — Apple, najwyższa wydajność na iOS
- **OpenCL / Metal Compute** — obliczenia GPGPU

## Neural Processing Unit (NPU)

Nowoczesne SoC zawierają dedykowany **NPU** (Neural Processing Unit) lub AI Accelerator do wydajnego wykonywania sieci neuronowych:

- Apple Neural Engine (ANE) — np. 38 TOPS w A17 Pro
- Qualcomm Hexagon NPU — Snapdragon 8 Gen 3: 73 TOPS
- Google TPU — w chipach Tensor

Dostęp do NPU z poziomu aplikacji:
```kotlin
// Android: TensorFlow Lite z delegatem NNAPI
val model = Interpreter(modelBuffer, InterpreterOptions().apply {
    addDelegate(NnApiDelegate())
})
```

## Pamięć

### RAM
- Zakres: 3–16 GB (typowo 6–8 GB w mid-range)
- Architektura: LPDDR5X — bardzo niskie zużycie energii
- **Brak swap** w tradycyjnym sensie — system agresywnie zabija procesy w tle (OOM Killer)

> **Implikacja:** Twoja aplikacja może zostać zabita w każdej chwili gdy działa w tle. Implementuj `onSaveInstanceState()` i `ViewModel` do zachowania stanu.

### Storage
- eMMC 5.1 — starsze/tańsze urządzenia, ~300 MB/s odczyt
- UFS 3.1 / UFS 4.0 — flagowce, >2 GB/s odczyt

## Bateria i zarządzanie energią

Bateria Li-Ion/Li-Po:
- Pojemność: 3000–6000 mAh (typowo 4500–5000 mAh)
- Ładowanie: 15W–120W (szybkie ładowanie Qualcomm QC, VOOC, PD)

### Stany energetyczne aplikacji

Android definiuje kilka mechanizmów ograniczania zużycia energii:

```
Doze Mode → App Standby → Background Execution Limits → Battery Saver
```

- **Doze Mode** (Android 6+): gdy urządzenie leży bez ruchu, sieć i CPU są ograniczane
- **App Standby Buckets** (Android 9+): aplikacje są klasyfikowane wg częstości użycia
- **Background Execution Limits** (Android 8+): ograniczenia dla usług działających w tle

```kotlin
// Sprawdzenie optymalizacji baterii
val pm = getSystemService(POWER_SERVICE) as PowerManager
val ignoring = pm.isIgnoringBatteryOptimizations(packageName)
```

## Ekran

### Technologie wyświetlaczy
| Technologia | Zalety | Wady |
|-------------|--------|------|
| **OLED/AMOLED** | Głęboka czerń, niskie zużycie energii (ciemny UI) | Droższy, burn-in |
| **LCD IPS** | Niższy koszt, brak burn-in | Gorsza czerń, wyższe zużycie |
| **LTPO OLED** | Zmienna częstotliwość 1–120 Hz | Złożoność |

### Gęstość pikseli i dp/pt
Systemy mobilne używają jednostek niezależnych od gęstości:
- Android: **dp** (density-independent pixels), 1dp = 1px na 160 dpi (mdpi)
- iOS: **pt** (points), 1pt = 1px na 163 ppi (@1x)

```
mdpi  (1x):   1dp = 1px
hdpi  (1.5x): 1dp = 1.5px
xhdpi (2x):   1dp = 2px
xxhdpi(3x):   1dp = 3px  ← typowy flagship
```

## Łączność

| Technologia | Standard | Opis |
|------------|---------|------|
| Wi-Fi | 802.11ax (Wi-Fi 6/6E) | Do 9.6 Gbps teoretycznie |
| Bluetooth | 5.3 / LE Audio | BLE dla IoT, A2DP dla audio |
| 5G | Sub-6GHz / mmWave | <1ms latencja, >10 Gbps |
| NFC | ISO 14443 | Płatności, parowanie |
| GPS/GNSS | GPS + GLONASS + Galileo | Wielokonstelacyjny |
| UWB | IEEE 802.15.4a | Precyzyjne pozycjonowanie (<10cm) |

## Linki

- [Qualcomm Snapdragon Tech Specs](https://www.qualcomm.com/snapdragon)
- [Android Performance — Docs](https://developer.android.com/topic/performance)
- [Apple Silicon Overview](https://developer.apple.com/documentation/apple-silicon)

## Neural Processing Unit (NPU) — AI na urządzeniu

Nowoczesne SoC zawierają dedykowane jednostki AI (NPU/Neural Engine) zoptymalizowane pod wnioskowanie modeli ML:

| Chip | Jednostka AI | Wydajność |
|------|-------------|-----------|
| Apple A18 Pro | Neural Engine | 35 TOPS |
| Snapdragon 8 Gen 3 | Hexagon NPU | 45 TOPS |
| Dimensity 9300 | APU 790 | 33 TOPS |
| Google Tensor G4 | TPU | ~30 TOPS |

TOPS = Tera Operations Per Second — liczba miliardów operacji na sekundę

### Użycie NPU z Android NNAPI

```kotlin
// TensorFlow Lite + NNAPI Delegate — automatycznie używa NPU jeśli dostępne
val options = Interpreter.Options().apply {
    addDelegate(NnApiDelegate())        // NPU/DSP acceleration
    // Fallback do GPU jeśli NNAPI niedostępne
    addDelegate(GpuDelegate())
    numThreads = 4
}
val interpreter = Interpreter(loadModelFile(), options)

// Google AI Edge (dawniej MediaPipe) — wyższy poziom abstrakcji
val imageClassifier = ImageClassifier.createFromOptions(
    context,
    ImageClassifier.ImageClassifierOptions.builder()
        .setBaseOptions(
            BaseOptions.builder()
                .useGpu()      // lub .useNnApi() dla NPU
                .build()
        )
        .setMaxResults(5)
        .build()
)
```

## Pamięć masowa — eMMC vs UFS vs NVMe

| Typ | Odczyt | Zapis | Zastosowanie |
|-----|--------|-------|-------------|
| eMMC 5.1 | 400 MB/s | 200 MB/s | Budżetowe urządzenia |
| UFS 3.1 | 1200 MB/s | 900 MB/s | Większość flagowców 2022-23 |
| UFS 4.0 | 4200 MB/s | 2800 MB/s | Flagowce 2024+ |
| NVMe (iPad Pro M4) | 3000+ MB/s | 2400+ MB/s | Tablety premium |

Różnica szybkości nośnika bezpośrednio wpływa na:
- Czas uruchomienia aplikacji (cold start)
- Prędkość wczytywania zasobów gry
- Wydajność Room/SQLite (I/O bound operations)

```kotlin
// Pomiar szybkości odczytu/zapisu Storage
fun benchmarkStorage(context: Context) {
    val file = File(context.filesDir, "bench_test.bin")
    val data = ByteArray(10 * 1024 * 1024)  // 10 MB

    val writeStart = System.nanoTime()
    file.writeBytes(data)
    val writeTime = System.nanoTime() - writeStart

    val readStart = System.nanoTime()
    file.readBytes()
    val readTime = System.nanoTime() - readStart

    val writeMbps = (data.size / 1024f / 1024f) / (writeTime / 1e9f)
    val readMbps = (data.size / 1024f / 1024f) / (readTime / 1e9f)

    Log.d("Storage", "Zapis: %.1f MB/s, Odczyt: %.1f MB/s".format(writeMbps, readMbps))
    file.delete()
}
```

## Thermal Throttling — zarządzanie ciepłem

Przegrzanie procesora powoduje automatyczne zmniejszenie taktowania (throttling):

```kotlin
// Thermal API (Android 11+) — monitor temperatury
class ThermalMonitor(context: Context) {
    private val powerManager = context.getSystemService(Context.POWER_SERVICE) as PowerManager

    val thermalStatus: Flow<Int> = callbackFlow {
        val listener = PowerManager.OnThermalStatusChangedListener { status ->
            trySend(status)
        }
        powerManager.addThermalStatusListener(listener)
        // Wyślij aktualny status
        trySend(powerManager.currentThermalStatus)
        awaitClose { powerManager.removeThermalStatusListener(listener) }
    }
}

// Reaguj na przegrzanie
thermalMonitor.thermalStatus.collect { status ->
    when (status) {
        PowerManager.THERMAL_STATUS_NONE,
        PowerManager.THERMAL_STATUS_LIGHT   -> enableHighQuality()
        PowerManager.THERMAL_STATUS_MODERATE -> enableMediumQuality()
        PowerManager.THERMAL_STATUS_SEVERE,
        PowerManager.THERMAL_STATUS_CRITICAL -> {
            enableLowQuality()
            showThermalWarning()  // "Urządzenie się nagrzało, ograniczono wydajność"
        }
        PowerManager.THERMAL_STATUS_EMERGENCY,
        PowerManager.THERMAL_STATUS_SHUTDOWN -> emergencyShutdown()
    }
}
```

## Linki dodatkowe

- [Android NNAPI](https://developer.android.com/ndk/guides/neuralnetworks)
- [TFLite Delegates](https://www.tensorflow.org/lite/performance/delegates)
- [Thermal API](https://developer.android.com/reference/android/os/PowerManager#getCurrentThermalStatus())
