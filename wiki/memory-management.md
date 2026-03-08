# Pamięć RAM i Zarządzanie Zasobami

Urządzenia mobilne mają ograniczoną pamięć RAM (2–16 GB) współdzieloną przez system i wszystkie aplikacje. Nadmierne zużycie pamięci powoduje wyrzucenie aplikacji przez system (OOM kill) lub spowolnienie.

## Model pamięci Android

```
┌──────────────────────────────────────────────────────┐
│                   RAM urządzenia                      │
├─────────────────────┬────────────────────────────────┤
│   System + Kernel   │         Aplikacje               │
│       ~1-2 GB       │                                 │
│                     │  Foreground App (priorytet 1)   │
│                     │  Visible App    (priorytet 2)   │
│                     │  Service App    (priorytet 3)   │
│                     │  Cached Apps    (OOM kandidaci) │
└─────────────────────┴────────────────────────────────┘
```

Gdy system potrzebuje pamięci, zabija aplikacje od najniższego priorytetu.

## Typy pamięci

| Typ | Opis |
|-----|------|
| **Java Heap** | Obiekty Kotlin/Java, zarządzane przez GC |
| **Native Heap** | Allokacje C/C++ (NDK, Skia, media) |
| **Graphics** | Tekstury GPU, frame buffers |
| **Stack** | Lokalne zmienne, ramki wywołań |
| **Code** | Dex bytecode, biblioteki .so |

## Memory Profiler — Android Studio

```bash
# Zrzut sterty (heap dump) przez ADB
adb shell am dumpheap com.example.myapp /sdcard/heap.hprof
adb pull /sdcard/heap.hprof
# Analizuj w Android Studio: File → Open → heap.hprof
```

Kluczowe metryki w Memory Profiler:
- **Java/Kotlin Objects** — liczba instancji i retainowany heap
- **Shallow Size** — pamięć samego obiektu
- **Retained Size** — pamięć obiektu + wszystkich obiektów do których wskazuje

## Typowe wycieki pamięci

```kotlin
// 1. WYCIEK: Context trzymany statycznie
object MySingleton {
    var context: Context? = null  // BŁĄD — trzyma Activity!
}

// POPRAWNIE: używaj applicationContext
object MySingleton {
    lateinit var appContext: Context

    fun init(context: Context) {
        appContext = context.applicationContext  // OK
    }
}

// 2. WYCIEK: Listener niezarejestrowany
class MyActivity : AppCompatActivity() {
    private lateinit var sensorManager: SensorManager
    private lateinit var listener: SensorEventListener

    override fun onResume() {
        super.onResume()
        sensorManager.registerListener(listener, sensor, SENSOR_DELAY_NORMAL)
    }

    override fun onPause() {
        super.onPause()
        sensorManager.unregisterListener(listener)  // WAŻNE!
    }
}

// 3. WYCIEK: Coroutine bez zakresu
class BadViewModel : ViewModel() {
    fun loadData() {
        GlobalScope.launch {  // BŁĄD — nie związany z ViewModel
            fetchData()
        }
    }

    fun goodLoadData() {
        viewModelScope.launch {  // OK — anuluje się z ViewModel
            fetchData()
        }
    }
}
```

## Bitmap i pamięć graficzna

```kotlin
// Błąd — ładowanie pełnej rozdzielczości zdjęcia
val bitmap = BitmapFactory.decodeFile(path)  // 12MP = ~48MB RAM!

// POPRAWNIE — skaluj do potrzebnego rozmiaru
fun decodeSampledBitmap(path: String, reqWidth: Int, reqHeight: Int): Bitmap {
    val options = BitmapFactory.Options().apply {
        inJustDecodeBounds = true
        BitmapFactory.decodeFile(path, this)
        inSampleSize = calculateInSampleSize(this, reqWidth, reqHeight)
        inJustDecodeBounds = false
    }
    return BitmapFactory.decodeFile(path, options)
}

fun calculateInSampleSize(options: BitmapFactory.Options, reqW: Int, reqH: Int): Int {
    val (h, w) = options.outHeight to options.outWidth
    var inSampleSize = 1
    if (h > reqH || w > reqW) {
        val halfH = h / 2; val halfW = w / 2
        while (halfH / inSampleSize >= reqH && halfW / inSampleSize >= reqW) {
            inSampleSize *= 2
        }
    }
    return inSampleSize
}
```

## Low Memory Callbacks

```kotlin
class MyApplication : Application() {
    override fun onLowMemory() {
        super.onLowMemory()
        // Wyczyść cache obrazów, zwolnij nieistotne zasoby
        ImageLoader.clear()
    }

    override fun onTrimMemory(level: Int) {
        super.onTrimMemory(level)
        when (level) {
            TRIM_MEMORY_UI_HIDDEN -> {
                // Aplikacja w tle — zwolnij zasoby UI
                clearImageCache()
            }
            TRIM_MEMORY_RUNNING_CRITICAL, TRIM_MEMORY_COMPLETE -> {
                // Krytyczny brak pamięci — zwolnij wszystko co możliwe
                clearAllCaches()
            }
        }
    }
}
```

## Linki

- [Memory Management](https://developer.android.com/topic/performance/memory)
- [Memory Profiler](https://developer.android.com/studio/profile/memory-profiler)
- [LeakCanary](https://square.github.io/leakcanary/)

## Coil — efektywne ładowanie obrazów

```kotlin
dependencies {
    implementation("io.coil-kt:coil-compose:2.6.0")
}

@Composable
fun OptimizedProductImage(imageUrl: String, modifier: Modifier = Modifier) {
    AsyncImage(
        model = ImageRequest.Builder(LocalContext.current)
            .data(imageUrl)
            .crossfade(300)
            // Automatycznie skaluje do rozmiaru komponentu — oszczędza RAM
            .size(Size.ORIGINAL)
            // Używaj pliku cache na dysku
            .diskCachePolicy(CachePolicy.ENABLED)
            .memoryCachePolicy(CachePolicy.ENABLED)
            // Placeholder i error state
            .placeholder(R.drawable.placeholder_image)
            .error(R.drawable.error_image)
            .build(),
        contentDescription = null,
        contentScale = ContentScale.Crop,
        modifier = modifier
    )
}

// Konfiguracja globalnego loader'a Coil
class MyApplication : Application() {
    override fun newImageLoader(): ImageLoader {
        return ImageLoader.Builder(this)
            .memoryCache {
                MemoryCache.Builder(this)
                    .maxSizePercent(0.25)  // 25% dostępnej RAM na cache obrazów
                    .build()
            }
            .diskCache {
                DiskCache.Builder()
                    .directory(filesDir.resolve("image_cache"))
                    .maxSizeBytes(50 * 1024 * 1024)  // 50 MB na dysku
                    .build()
            }
            .respectCacheHeaders(false)  // ignoruj Cache-Control z serwera
            .build()
    }
}
```

## Profil памяти — Room i duże dane

```kotlin
// BŁĄD — ładowanie całej tabeli do RAM
@Query("SELECT * FROM tasks")
suspend fun getAllTasks(): List<Task>  // Może być miliony rekordów!

// POPRAWNIE — Paging 3 dla dużych zbiorów
@Query("SELECT * FROM tasks ORDER BY created_at DESC")
fun getTasksPaged(): PagingSource<Int, Task>

// ViewModel
val tasks: Flow<PagingData<Task>> = Pager(
    config = PagingConfig(
        pageSize = 20,
        prefetchDistance = 5,
        enablePlaceholders = false
    )
) {
    taskDao.getTasksPaged()
}.flow.cachedIn(viewModelScope)

// LazyColumn z Paging
@Composable
fun TaskListScreen(viewModel: TaskViewModel) {
    val tasks = viewModel.tasks.collectAsLazyPagingItems()

    LazyColumn {
        items(tasks, key = { it.id }) { task ->
            if (task != null) TaskCard(task) else TaskCardPlaceholder()
        }

        // Wskaźnik ładowania na dole
        when (val state = tasks.loadState.append) {
            is LoadState.Loading -> item { CircularProgressIndicator() }
            is LoadState.Error   -> item { Text("Błąd: ${state.error.message}") }
            else -> {}
        }
    }
}
```

## Native Memory — NDK i JNI

```kotlin
// JNI — wywołanie kodu C++ z Kotlina
// Użyj gdy: DSP audio, kompresja obrazu, kryptografia, silniki fizyki

class NativeProcessor {
    companion object {
        init {
            System.loadLibrary("native_processor")  // ładuje libnative_processor.so
        }
    }

    // Deklaracja funkcji natywnej
    external fun processAudioBuffer(buffer: FloatArray, sampleRate: Int): FloatArray
    external fun compressImage(pixels: IntArray, width: Int, height: Int, quality: Int): ByteArray
}

// Plik: src/main/cpp/native_processor.cpp
```

```cpp
#include <jni.h>
#include <android/log.h>

extern "C" JNIEXPORT jfloatArray JNICALL
Java_com_example_NativeProcessor_processAudioBuffer(
    JNIEnv* env, jobject /* this */,
    jfloatArray buffer, jint sampleRate
) {
    jsize length = env->GetArrayLength(buffer);
    jfloat* data = env->GetFloatArrayElements(buffer, nullptr);

    // Przetwarzanie sygnału audio w C++ — brak GC pauz
    for (int i = 0; i < length; i++) {
        data[i] = apply_filter(data[i], sampleRate);
    }

    jfloatArray result = env->NewFloatArray(length);
    env->SetFloatArrayRegion(result, 0, length, data);
    env->ReleaseFloatArrayElements(buffer, data, JNI_ABORT);
    return result;
}
```

## Linki dodatkowe

- [Coil Image Loading](https://coil-kt.github.io/coil/)
- [Paging 3](https://developer.android.com/topic/libraries/architecture/paging/v3-overview)
- [Android NDK](https://developer.android.com/ndk/guides)
