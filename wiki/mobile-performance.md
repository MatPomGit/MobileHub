# Wydajność Aplikacji Mobilnych

Wydajność aplikacji mobilnych to jeden z kluczowych czynników decydujących o sukcesie w sklepie. Google i Apple automatycznie mierzą wskaźniki jakości i mogą obniżyć widoczność lub usunąć aplikacje, które je przekraczają.

## Android Vitals — Core Metrics

Google Play Console zbiera dane z urządzeń i porównuje je z benchmarkami kategorii:

| Metryka | Próg złej jakości | Opis |
|---------|------------------|------|
| **Crash Rate** | >1.09% | % sesji zakończonych crashem |
| **ANR Rate** | >0.47% | App Not Responding > 5 sekund |
| **Slow Rendering** | >0.025% | % klatek > 16ms |
| **Frozen Frames** | >0.1% | % klatek > 700ms |
| **Cold Start** | >5s | Czas od tapnięcia ikony do UI |
| **Warm Start** | >2s | Powrót po wypchnięciu do tła |
| **Hot Start** | >1.5s | Powrót po przełączeniu zadań |

## Optymalizacja startowania

```kotlin
// Pomiar czasu startu
class MyApplication : Application() {
    override fun onCreate() {
        val startTime = SystemClock.uptimeMillis()
        super.onCreate()
        // Inicjalizuj TYLKO to, co absolutnie potrzebne przy starcie
        // Hilt / DI — opóźnij do pierwszego użycia
        // Analytics — możesz zainicjować async
        coroutineScope.launch(Dispatchers.IO) {
            initAnalytics()       // nie blokuje UI
            initCrashReporting()  // nie blokuje UI
        }
        val elapsed = SystemClock.uptimeMillis() - startTime
        Log.d("Perf", "App.onCreate: ${elapsed}ms")
    }
}

// Baseline Profile — pre-kompilacja krytycznych ścieżek
// Generuj: Macrobenchmark library
@RunWith(AndroidJUnit4::class)
class StartupBenchmark {
    @get:Rule
    val rule = MacrobenchmarkRule()

    @Test
    fun measureStartup() = rule.measureRepeated(
        packageName = "com.example.app",
        metrics = listOf(StartupTimingMetric()),
        iterations = 10,
        startupMode = StartupMode.COLD
    ) {
        pressHome()
        startActivityAndWait()
    }
}
```

## Profiler — Android Studio

Android Studio oferuje trzy główne profilery:

### CPU Profiler

```kotlin
// Ręczne trace — widoczne w CPU Profiler
fun performExpensiveOperation() {
    Trace.beginSection("expensive_op")
    try {
        // ... długa operacja
    } finally {
        Trace.endSection()
    }
}

// Coroutine trace (automatyczne w Kotlin 1.6+)
withContext(Dispatchers.Default + CoroutineName("data_processing")) {
    processData()
}
```

### Memory Profiler

```kotlin
// Triggering GC i heap dump z kodu
Debug.dumpHprofData("/sdcard/heap.hprof")

// Sprawdzanie użycia pamięci
val info = Debug.MemoryInfo()
Debug.getMemoryInfo(info)
Log.d("Memory", """
    Java Heap: ${info.dalvikPrivateDirty} KB
    Native Heap: ${info.nativePrivateDirty} KB
    Total PSS: ${info.totalPss} KB
""".trimIndent())
```

### Network Profiler

```kotlin
// OkHttp EventListener — szczegółowe timings
class TimingEventListener : EventListener() {
    private var callStart = 0L

    override fun callStart(call: Call) { callStart = System.nanoTime() }
    override fun dnsStart(call: Call, domainName: String) {
        Log.d("Network", "DNS lookup for $domainName")
    }
    override fun responseBodyEnd(call: Call, byteCount: Long) {
        val elapsed = (System.nanoTime() - callStart) / 1_000_000
        Log.d("Network", "Request completed: ${elapsed}ms, ${byteCount}B")
    }
}

val client = OkHttpClient.Builder()
    .eventListenerFactory(TimingEventListener.Factory { TimingEventListener() })
    .build()
```

## Compose — optymalizacja rekomposycji

Rekomposycja jest kluczowym obszarem optymalizacji w Compose:

```kotlin
// PROBLEM: niestabilny typ powoduje nadmiarową rekomposycję
@Composable
fun ProductList(products: List<Product>) {  // List<T> jest niestabilna!
    products.forEach { ProductItem(it) }
}

// ROZWIĄZANIE 1: ImmutableList z kotlinx.collections.immutable
@Composable
fun ProductList(products: ImmutableList<Product>) {  // stabilna!
    products.forEach { ProductItem(it) }
}

// ROZWIĄZANIE 2: annotacja @Stable lub @Immutable
@Immutable
data class Product(val id: Int, val name: String, val price: Double)

// ROZWIĄZANIE 3: derivedStateOf dla wartości pochodnych
@Composable
fun CartSummary(items: List<CartItem>) {
    // BEZ derivedStateOf — przeliczane przy każdej rekomposycji
    // val total = items.sumOf { it.price }  ← ŹLE

    // Z derivedStateOf — przeliczane tylko gdy items się zmieni
    val total by remember(items) {
        derivedStateOf { items.sumOf { it.price } }
    }
    Text("Suma: ${"%.2f".format(total)} zł")
}

// Przekazuj lambdy przez remember, nie tworząc nowych co rekomposycję
@Composable
fun ItemList(items: List<Item>, onItemClick: (Int) -> Unit) {
    items.forEach { item ->
        ItemRow(
            item = item,
            // Pamiętaj lambdę — nie twórz nowej za każdym razem
            onClick = remember(item.id) { { onItemClick(item.id) } }
        )
    }
}
```

## LeakCanary — wykrywanie wycieków

```kotlin
// build.gradle.kts
debugImplementation("com.squareup.leakcanary:leakcanary-android:2.14")
// Działa automatycznie w debug buildzie — zero konfiguracji!

// Ręczne oznaczanie obiektów do śledzenia
class MyFragment : Fragment() {
    override fun onDestroyView() {
        super.onDestroyView()
        // LeakCanary sprawdzi czy obiekt został GC'owany
        AppWatcher.objectWatcher.expectWeaklyReachable(
            binding, "Fragment binding powinien być GC'owany po onDestroyView"
        )
    }
}
```

## R8 i ProGuard — optymalizacja kodu

```kotlin
// build.gradle.kts
android {
    buildTypes {
        release {
            isMinifyEnabled = true       // R8 shrinking + obfuskacja
            isShrinkResources = true     // usuwanie nieużywanych zasobów
            proguardFiles(
                getDefaultProguardFile("proguard-android-optimize.txt"),
                "proguard-rules.pro"
            )
        }
    }
}
```

```pro
# proguard-rules.pro
# Zachowaj modele danych (Gson/Moshi/kotlinx.serialization)
-keep class com.example.app.data.model.** { *; }
-keep @kotlinx.serialization.Serializable class * { *; }

# Zachowaj Room entities
-keep @androidx.room.Entity class * { *; }

# Zachowaj Parcelable
-keepclassmembers class * implements android.os.Parcelable {
    static final android.os.Parcelable$Creator CREATOR;
}

# Logowanie — usuń debug logi z release
-assumenosideeffects class android.util.Log {
    public static int d(...);
    public static int v(...);
}
```

## StrictMode — wykrywanie naruszeń w dev

```kotlin
// Application.onCreate() — tylko w debug
if (BuildConfig.DEBUG) {
    StrictMode.setThreadPolicy(
        StrictMode.ThreadPolicy.Builder()
            .detectDiskReads()        // wykryj odczyt dysku na UI thread
            .detectDiskWrites()       // wykryj zapis dysku na UI thread
            .detectNetwork()          // wykryj sieć na UI thread
            .detectCustomSlowCalls()  // wykryj własne "wolne" operacje
            .penaltyLog()             // loguj naruszenia
            // .penaltyCrash()        // lub crashuj (bardziej radykalne)
            .build()
    )

    StrictMode.setVmPolicy(
        StrictMode.VmPolicy.Builder()
            .detectLeakedSqlLiteObjects()
            .detectLeakedClosableObjects()
            .detectActivityLeaks()
            .penaltyLog()
            .build()
    )
}
```

## Linki

- [Android Performance](https://developer.android.com/topic/performance)
- [Compose Performance](https://developer.android.com/develop/ui/compose/performance)
- [Macrobenchmark](https://developer.android.com/topic/performance/benchmarking/macrobenchmark-overview)
- [LeakCanary](https://square.github.io/leakcanary/)
- [Perfetto](https://perfetto.dev)
