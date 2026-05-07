# Wydajność aplikacji mobilnych

Wydajność aplikacji mobilnych to jeden z kluczowych czynników decydujących o sukcesie w sklepie. Google i Apple automatycznie mierzą wskaźniki jakości i mogą obniżyć widoczność lub usunąć aplikacje, które je przekraczają.

## Android Vitals - Core Metrics

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

Poniższy kod zawiera dwie techniki optymalizacji czasu zimnego startu aplikacji. W klasie `MyApplication` metoda `onCreate()` mierzy czas inicjalizacji za pomocą `SystemClock.uptimeMillis()` zamiast `System.currentTimeMillis()` - `uptimeMillis()` mierzy czas od uruchomienia urządzenia i nie jest podatne na zmiany zegara systemowego (korekty NTP, zmiana strefy), co daje bardziej miarodajne pomiary. Operacje pomocnicze (`initAnalytics()`, `initCrashReporting()`) uruchamiane są na `Dispatchers.IO` przez coroutine - dzięki temu nie blokują głównego wątku UI, a użytkownik widzi pierwszy ekran szybciej. To kluczowa zasada: w `Application.onCreate()` należy inicjalizować **tylko to, co absolutnie potrzebne** do wyświetlenia pierwszego ekranu. `MacrobenchmarkRule` w teście startowym jest narzędziem do mierzenia wydajności na prawdziwym urządzeniu z uwzględnieniem stanu systemu (kompilacja AOT, cache) - `iterations = 10` uruchamia test wielokrotnie, by uśrednić wyniki i wyeliminować szum systemowy. `StartupMode.COLD` wymusza zatrzymanie procesu aplikacji przed każdą iteracją, symulując pierwsze uruchomienie.

```kotlin
// Pomiar czasu startu
class MyApplication : Application() {
    override fun onCreate() {
        val startTime = SystemClock.uptimeMillis()
        super.onCreate()
        // Inicjalizuj TYLKO to, co absolutnie potrzebne przy starcie
        // Hilt / DI - opóźnij do pierwszego użycia
        // Analytics - możesz zainicjować async
        coroutineScope.launch(Dispatchers.IO) {
            initAnalytics()       // nie blokuje UI
            initCrashReporting()  // nie blokuje UI
        }
        val elapsed = SystemClock.uptimeMillis() - startTime
        Log.d("Perf", "App.onCreate: ${elapsed}ms")
    }
}

// Baseline Profile - pre-kompilacja krytycznych ścieżek
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

## Profiler - Android Studio

Android Studio oferuje trzy główne profilery:

### CPU Profiler

Poniższe fragmenty kodu pokazują, jak instrumentować własny kod do analizy w CPU Profilerze Android Studio. `Trace.beginSection("expensive_op")` i `Trace.endSection()` wstawiają markery widoczne w narzędziu Perfetto (wbudowanym w Android Studio) jako kolorowe bloki na osi czasu - pozwala to precyzyjnie zobaczyć, ile czasu zajmuje konkretna operacja i w którym wątku. Wywołanie `endSection()` w bloku `finally` jest obowiązkowe - gdyby operacja rzuciła wyjątek i `endSection()` nie zostałoby wywołane, profiler zatraciłby kontekst śledzenia. `CoroutineName("data_processing")` to dekorator dla coroutine, który sprawia, że w CPU Profilerze coroutine jest widoczna pod ludzką nazwą zamiast generowanego identyfikatora - bardzo ułatwia diagnozowanie, która z wielu coroutine jest wąskim gardłem.

```kotlin
// Ręczne trace - widoczne w CPU Profiler
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

Poniższy kod umożliwia programistyczne wykonanie zrzutu sterty (heap dump) i odczyt bieżącego użycia pamięci. `Debug.dumpHprofData()` zapisuje plik HPROF - binarny format opisu całego wykresu obiektów w pamięci JVM. Plik ten można otworzyć w Android Studio Heap Dump Analyzer lub w narzędziach zewnętrznych (Eclipse MAT), żeby znaleźć obiekty, które nie zostały zwolnione przez garbage collector. `Debug.MemoryInfo` dostarcza szczegółowy podział zużycia pamięci: `dalvikPrivateDirty` to pamięć sterty Javy/Kotlina należąca wyłącznie do tej aplikacji, `nativePrivateDirty` to pamięć natywna (C/C++ kod bibliotek), a `totalPss` to Proportional Set Size - najbardziej miarodajna metryka całkowitego wkładu aplikacji w zużycie pamięci systemu, uwzględniająca dzieloną pamięć bibliotek w proporcji do liczby procesów, które z nich korzystają.

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

Poniższy kod implementuje `EventListener` dla OkHttp, który rejestruje szczegółowe metryki czasowe każdego zapytania sieciowego. OkHttp udostępnia system wydarzeń (`EventListener`) zamiast prostego logowania, bo pozwala on na granularne mierzenie każdego etapu połączenia TCP/TLS. `callStart` i `responseBodyEnd` wyznaczają pełny czas trwania zapytania od inicjacji do odbioru ostatniego bajtu. `dnsStart` pomaga wykryć, czy DNS lookup jest wąskim gardłem - w aplikacjach korporacyjnych za VPN DNS może zajmować >100ms. Konwersja nanosekund na milisekundy przez dzielenie przez `1_000_000` (użycie `_` jako separatora to konwencja Kotlina zwiększająca czytelność liczb) zapewnia czytelny wynik. `EventListenerFactory` jest używany zamiast bezpośredniego podania instancji, bo fabryka tworzy nowy listener dla każdego zapytania - gdyby wszystkie zapytania dzieliły jeden obiekt, `callStart` mógłby nadpisać czas poprzedniego zapytania.

```kotlin
// OkHttp EventListener - szczegółowe timings
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

## Compose - optymalizacja rekomposycji

Rekomposycja jest kluczowym obszarem optymalizacji w Compose:

Poniższe przykłady pokazują trzy wzorce unikania zbędnych rekomposycji w Jetpack Compose. Problem z `List<Product>` polega na tym, że standardowy `List<T>` Kotlina jest niestabilny z perspektywy Compose - kompilator Compose nie może gwarantować, że lista nie zmieni się między wywołaniami, więc przy każdej rekomposycji rodzica rekomponuje też `ProductList`. `ImmutableList` z biblioteki `kotlinx.collections.immutable` jest oznaczona jako niemutowalna, co Compose rozumie i pomija rekomposycję, jeśli referencja się nie zmieniła. Adnotacja `@Immutable` na klasie `Product` informuje kompilator Compose, że wszystkie pola są `val` i nie zmienią się po utworzeniu obiektu - analogiczny efekt, ale bez dodatkowej biblioteki. `derivedStateOf` jest stosowane dla wartości obliczanych na podstawie innych stanów - bez niego `total` przeliczałoby się przy każdej rekomposycji `CartSummary`, nawet gdy `items` się nie zmieniło. `remember(items)` powiązuje pamiętaną wartość z kluczem `items`, co powoduje przeliczenie `derivedStateOf` tylko przy zmianie listy. Zapamiętywanie lambd przez `remember(item.id)` eliminuje problem tworzenia nowego obiektu funkcji przy każdej rekomposycji - Compose traktuje nową lambdę jako zmianę parametru i niepotrzebnie rekomponuje `ItemRow`.

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
    // BEZ derivedStateOf - przeliczane przy każdej rekomposycji
    // val total = items.sumOf { it.price }  ← ŹLE

    // Z derivedStateOf - przeliczane tylko gdy items się zmieni
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
            // Pamiętaj lambdę - nie twórz nowej za każdym razem
            onClick = remember(item.id) { { onItemClick(item.id) } }
        )
    }
}
```

## LeakCanary - wykrywanie wycieków

LeakCanary jest biblioteką do automatycznego wykrywania wycieków pamięci w aplikacjach Android. Poniższy kod pokazuje jej konfigurację. Zależność `debugImplementation` zamiast `implementation` oznacza, że biblioteka jest dołączona **tylko do buildu debug** - w release buildzie nie ma żadnego śladu LeakCanary, co eliminuje narzut wydajnościowy i zapobiega ekspozycji informacji diagnostycznych użytkownikom. LeakCanary nie wymaga żadnej inicjalizacji w kodzie aplikacji (działa automatycznie przez `ContentProvider` rejestrowany w AndroidManifest). Metoda `objectWatcher.expectWeaklyReachable()` pozwala ręcznie oznaczyć obiekty do śledzenia - po `onDestroyView()` fragmentu jego `binding` powinien zostać zwolniony przez GC. Jeśli po kilku sekundach obiekt nadal istnieje, LeakCanary wykonuje zrzut sterty i analizuje graf referencji, pokazując dokładną ścieżkę wyciek (np. `ActivityMainBinding` → `View` → `Context`). Takie podejście jest znacznie skuteczniejsze niż ręczna analiza zrzutów, bo LeakCanary automatycznie interpretuje graf obiektów.

```kotlin
// build.gradle.kts
debugImplementation("com.squareup.leakcanary:leakcanary-android:2.14")
// Działa automatycznie w debug buildzie - zero konfiguracji!

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

## R8 i ProGuard - optymalizacja kodu

Poniższe konfiguracje włączają i dostosowują narzędzie R8 (następca ProGuard) do minimalizacji i ochrony kodu produkcyjnego. Flaga `isMinifyEnabled = true` uruchamia R8, który wykonuje trzy operacje: **tree shaking** (usunięcie nieużywanego kodu), **obfuskację** (zastąpienie nazw klas i metod krótkimi identyfikatorami `a`, `b`, `c`) oraz **optymalizację bytecode** (inline'owanie małych metod, usunięcie zbędnych instrukcji). `isShrinkResources = true` usuwa nieużywane zasoby graficzne i układy - działa dopiero po R8, bo R8 może ujawnić zasoby, które wydawały się używane, ale były osiągalne tylko przez martwy kod. Plik `proguard-rules.pro` zawiera reguły wykluczające z obfuskacji klasy, które muszą zachować oryginalne nazwy: klasy modeli danych serializowanych przez Gson lub kotlinx.serialization muszą mieć dokładne nazwy pól, bo biblioteki te korzystają z refleksji. Reguła `-assumenosideeffects` instruuje R8, że może usunąć wszystkie wywołania `Log.d()` i `Log.v()` (debug i verbose), bo R8 zakłada, że te wywołania nie mają efektów ubocznych - dzięki temu logi developerskie nie trafiają do release APK, co uniemożliwia napastnikowi odczytanie wewnętrznej logiki przez `adb logcat`.

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

# Logowanie - usuń debug logi z release
-assumenosideeffects class android.util.Log {
    public static int d(...);
    public static int v(...);
}
```

## StrictMode - wykrywanie naruszeń w dev

StrictMode to narzędzie deweloperskie, które wykrywa operacje wykonywane w nieodpowiednich miejscach - najczęściej dostęp do dysku lub sieci na głównym wątku UI. Poniższy kod aktywuje StrictMode **tylko w buildzie debug** (`BuildConfig.DEBUG`) - jest to absolutnie konieczne, bo StrictMode spowalnia aplikację i jego naruszenia powinny być eliminowane w fazie developmentu, a nie widziane przez użytkowników. `ThreadPolicy` monitoruje operacje na głównym wątku: `detectDiskReads()` i `detectDiskWrites()` wychwytują synchroniczny dostęp do SharedPreferences, plików czy bazy SQLite bezpośrednio na wątku UI - taki dostęp może zablokować interfejs na 16ms+ i spowodować dropped frames. `detectNetwork()` wychwytuje synchroniczne połączenia sieciowe na UI thread - w nowych wersjach Androida kończy się to wyjątkiem `NetworkOnMainThreadException` i crashem. `VmPolicy` monitoruje cykl życia obiektów: `detectLeakedSqlLiteObjects()` wykrywa niezamknięte kursory bazodanowe, `detectActivityLeaks()` wychwytuje aktywności trzymane w pamięci po zniszczeniu. `penaltyLog()` zapisuje naruszenia do logcata, skąd można je odczytać w Android Studio - bardziej radykalna opcja `penaltyCrash()` może być używana w CI/CD do wymuszenia zera naruszeń przed mergem.

```kotlin
// Application.onCreate() - tylko w debug
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

## Gotowe scenariusze testów wydajności

Poniższa sekcja zawiera zestaw bazowych scenariuszy, które można uruchamiać cyklicznie (np. raz na sprint) lub automatycznie w CI/CD. Każdy scenariusz ma instrukcję pomiaru oraz rekomendowane progi jakości do monitorowania regresji.

### 1) Start aplikacji (cold/warm/hot)

**Cel:** walidacja czasu wejścia użytkownika do pierwszego interaktywnego ekranu.

**Instrukcja pomiaru:**
1. Użyj `Macrobenchmark` (`StartupTimingMetric`) na urządzeniu fizycznym.
2. Uruchom co najmniej 10 iteracji dla każdego trybu (`COLD`, `WARM`, `HOT`).
3. Zamknij aplikacje w tle i utrzymuj stały stan baterii/temperatury urządzenia.
4. Zapisz medianę, P90 i najgorszy wynik.

**Rekomendowane progi jakości:**
- **Cold start:** P50 <= 2000 ms, P90 <= 3000 ms.
- **Warm start:** P50 <= 1000 ms, P90 <= 1500 ms.
- **Hot start:** P50 <= 700 ms, P90 <= 1000 ms.
- **Regresja:** alarm przy wzroście >15% względem baseline.

### 2) Scroll listy (płynność UI)

**Cel:** wykrywanie dropów klatek i zacięć podczas przewijania długich list.

**Instrukcja pomiaru:**
1. Uruchom ekran z listą min. 100 elementów i obrazami.
2. Wykonaj 5 przejazdów scroll: dół-góra-dół ze stałą prędkością (gesture automation).
3. Zbieraj metryki: `frameTime`, `jank`, `frozen frames`, CPU usage.
4. Dodatkowo oznacz sekcje kodu `Trace.beginSection(...)` dla miejsc potencjalnie ciężkich.

**Rekomendowane progi jakości:**
- **Jank frames:** <3% wszystkich klatek.
- **Frozen frames (>700 ms):** <0.1%.
- **95 percentyl frame time:** <= 24 ms.
- **Regresja:** alarm przy wzroście jank >1.5 pp albo P95 >20%.

### 3) Opóźnienia sieciowe (network latency)

**Cel:** kontrola odporności UX na wolną sieć i niestabilne API.

**Instrukcja pomiaru:**
1. Włącz profilowanie OkHttp (`EventListener`) dla czasów DNS/connect/TTFB/total.
2. Przetestuj co najmniej 3 profile sieci:
   - Wi-Fi referencyjne,
   - LTE symulowane,
   - słaba sieć (wysoka latencja + packet loss).
3. Dla każdego endpointu zbierz minimum 30 próbek.
4. Raportuj P50/P95/P99 dla całkowitego czasu odpowiedzi.

**Rekomendowane progi jakości:**
- **TTFB P95:** <= 800 ms (API krytyczne UX).
- **Total request P95:** <= 1500 ms.
- **Timeout/error rate:** <1% dla krytycznych ścieżek.
- **Regresja:** alarm przy wzroście P95 >20% lub błędach >2x baseline.

### 4) Zużycie pamięci (memory usage)

**Cel:** wykrywanie wycieków i nadmiernego narzutu pamięci po dłuższym użyciu.

**Instrukcja pomiaru:**
1. Zdefiniuj scenariusz 15-20 minut: nawigacja między ekranami + multimedia + powrót.
2. Rejestruj `Total PSS`, Java heap, native heap co 30-60 sekund.
3. Po scenariuszu wykonaj heap dump i analizę dominator tree.
4. Uruchom LeakCanary w debug i porównaj liczbę podejrzanych wycieków.

**Rekomendowane progi jakości:**
- **Wzrost PSS po scenariuszu:** <= 20% względem startu.
- **Brak trendu rosnącego po 3 cyklach GC** (stabilizacja pamięci).
- **LeakCanary:** 0 krytycznych wycieków (Activity/Fragment/View binding).
- **Regresja:** alarm, gdy PSS rośnie stale >3 pomiary z rzędu.

## Przykładowe raporty

### Raport A: Start aplikacji

| Metryka | Baseline | Aktualnie | Delta | Status |
|---------|----------|-----------|-------|--------|
| Cold P50 | 1650 ms | 1820 ms | +10.3% | OK |
| Cold P90 | 2480 ms | 3010 ms | +21.4% | REGRESJA |
| Warm P50 | 740 ms | 810 ms | +9.4% | OK |
| Hot P50 | 510 ms | 600 ms | +17.6% | UWAGA |

**Wniosek:** regresja dotyczy głównie cold startu (P90), sugeruje problem z inicjalizacją zależności na starcie.

### Raport B: Scroll i renderowanie

| Metryka | Baseline | Aktualnie | Delta | Status |
|---------|----------|-----------|-------|--------|
| Jank frames | 1.8% | 3.9% | +2.1 pp | REGRESJA |
| Frozen frames | 0.03% | 0.08% | +0.05 pp | OK |
| Frame time P95 | 18 ms | 26 ms | +44.4% | REGRESJA |
| CPU avg | 29% | 41% | +12 pp | UWAGA |

**Wniosek:** duża liczba rekompozycji i ciężkie operacje podczas bindu elementów listy.

### Raport C: Sieć i pamięć

| Metryka | Baseline | Aktualnie | Delta | Status |
|---------|----------|-----------|-------|--------|
| API `/feed` P95 | 920 ms | 1340 ms | +45.6% | REGRESJA |
| Error rate | 0.4% | 0.7% | +0.3 pp | OK |
| PSS po 20 min | 220 MB | 289 MB | +31.4% | REGRESJA |
| LeakCanary critical leaks | 0 | 2 | +2 | REGRESJA |

**Wniosek:** prawdopodobny wyciek w warstwie UI + wolniejsze odpowiedzi backendu lub brak cache.

## Checklista optymalizacji po wykryciu regresji

1. **Potwierdź reprodukcję** na tym samym modelu urządzenia i wersji systemu.
2. **Porównaj commit range** między baseline i regresją.
3. **Wyizoluj obszar problemu** (startup, rendering, network, memory).
4. **Startup:** przenieś inicjalizacje poza `Application.onCreate`, włącz lazy init.
5. **Scroll/Compose:** stabilne modele danych, `remember`, `derivedStateOf`, paginacja.
6. **Network:** cache HTTP, kompresja payloadu, retry/backoff, timeouty per endpoint.
7. **Memory:** usuwaj referencje w `onDestroyView`, unikaj singletonów z `Context`.
8. **Zweryfikuj R8 i resource shrinking** w release.
9. **Uruchom testy porównawcze A/B** przed i po poprawce.
10. **Zaktualizuj baseline** dopiero po potwierdzeniu trwałej poprawy.

## Krótkie case study: przed/po optymalizacji

### Case 1: Wolny cold start

- **Przed:** średni cold start 2900 ms, ciężka inicjalizacja analityki i bazy w `Application.onCreate`.
- **Działanie:** lazy init, przeniesienie części inicjalizacji do pierwszego użycia, baseline profile.
- **Po:** cold start 1700 ms (poprawa ~41%), brak ANR przy starcie.

### Case 2: Jank na liście produktów

- **Przed:** jank 5.2%, frame time P95 = 31 ms, niestabilne modele i brak kluczy.
- **Działanie:** `ImmutableList`, `@Immutable`, klucze w listach, memoizacja lambd i obrazów.
- **Po:** jank 2.0%, frame time P95 = 19 ms (wyraźnie płynniejszy scroll).

### Case 3: Rosnące zużycie pamięci

- **Przed:** PSS rośnie z 210 MB do 320 MB po 15 minutach, 3 wycieki fragmentów.
- **Działanie:** czyszczenie bindingów, lifecycle-aware collect, usunięcie referencji do `Activity`.
- **Po:** PSS stabilizuje się przy 235 MB, 0 krytycznych wycieków w LeakCanary.
