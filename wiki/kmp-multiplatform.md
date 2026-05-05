# Kotlin Multiplatform - współdzielony kod

Kotlin Multiplatform (KMP) to technologia JetBrains pozwalająca współdzielić logikę biznesową między Androidem, iOS, webem i desktopem, zachowując **natywny UI** na każdej platformie. W odróżnieniu od Flutter/React Native, KMP nie narzuca własnego silnika renderowania.

## Filozofia KMP: "Share Logic, Keep Native UI"

```
┌──────────────────────────────────────────────────────────────┐
│                     Shared Code (commonMain)                  │
│    Domain Logic │ Repository │ Use Cases │ ViewModels         │
│    Network (Ktor) │ Database (SQLDelight) │ Models             │
└────────────────────────────┬─────────────────────────────────┘
                             │
              ┌──────────────┴──────────────┐
              │                             │
    ┌─────────▼────────┐         ┌──────────▼──────────┐
    │   Android App    │         │      iOS App         │
    │  Jetpack Compose │         │      SwiftUI          │
    │  (androidMain)   │         │      (iosMain)        │
    └──────────────────┘         └─────────────────────┘
```

## Struktura projektu KMP

```
myapp/
├── shared/
│   ├── src/
│   │   ├── commonMain/kotlin/
│   │   │   ├── data/
│   │   │   │   ├── api/         ← Ktor HTTP client
│   │   │   │   ├── db/          ← SQLDelight queries
│   │   │   │   └── repository/
│   │   │   ├── domain/
│   │   │   │   ├── model/       ← Data classes
│   │   │   │   └── usecase/
│   │   │   └── presentation/
│   │   │       └── viewmodel/   ← Shared ViewModels
│   │   ├── androidMain/kotlin/  ← Android-specific implementations
│   │   ├── iosMain/kotlin/      ← iOS-specific implementations
│   │   └── commonTest/kotlin/   ← Shared unit tests
│   └── build.gradle.kts
├── androidApp/                  ← Jetpack Compose UI
└── iosApp/                      ← Xcode + SwiftUI
```

## Ktor - HTTP client dla KMP

```kotlin
// commonMain - identyczny kod działa na Android i iOS
class ApiClient {
    private val httpClient = HttpClient {
        install(ContentNegotiation) {
            json(Json {
                ignoreUnknownKeys = true
                isLenient = true
            })
        }
        install(HttpTimeout) {
            requestTimeoutMillis = 30_000
            connectTimeoutMillis = 10_000
        }
        install(Logging) {
            logger = Logger.DEFAULT
            level = LogLevel.INFO
        }
        defaultRequest {
            url("https://api.example.com/v1/")
            header(HttpHeaders.Accept, ContentType.Application.Json)
        }
    }

    suspend fun getProducts(): List<Product> =
        httpClient.get("products").body()

    suspend fun createOrder(order: NewOrder): Order =
        httpClient.post("orders") {
            contentType(ContentType.Application.Json)
            setBody(order)
        }.body()

    fun close() = httpClient.close()
}
```

## SQLDelight - baza danych KMP

```sql
-- shared/src/commonMain/sqldelight/com/example/Task.sq
CREATE TABLE Task (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    title       TEXT    NOT NULL,
    description TEXT    NOT NULL DEFAULT '',
    is_done     INTEGER NOT NULL DEFAULT 0,
    created_at  INTEGER NOT NULL,
    due_date    INTEGER
);

-- Named queries (generuje typowany Kotlin)
getAllTasks:
SELECT * FROM Task ORDER BY created_at DESC;

getActiveTasks:
SELECT * FROM Task WHERE is_done = 0 ORDER BY due_date ASC NULLS LAST;

insertTask:
INSERT INTO Task (title, description, created_at) VALUES (?, ?, ?);

updateTaskStatus:
UPDATE Task SET is_done = ? WHERE id = ?;

deleteTask:
DELETE FROM Task WHERE id = ?;
```

```kotlin
// Repository używający SQLDelight
class TaskRepository(db: AppDatabase) {
    private val queries = db.taskQueries

    fun getAllTasks(): Flow<List<Task>> =
        queries.getAllTasks()
            .asFlow()
            .mapToList(Dispatchers.IO)

    suspend fun insertTask(title: String, description: String) =
        withContext(Dispatchers.IO) {
            queries.insertTask(
                title = title,
                description = description,
                created_at = Clock.System.now().toEpochMilliseconds()
            )
        }

    suspend fun toggleTask(id: Long, isDone: Boolean) =
        withContext(Dispatchers.IO) {
            queries.updateTaskStatus(if (isDone) 1L else 0L, id)
        }
}
```

## Expect/Actual - platform-specific code

```kotlin
// commonMain - deklaracja interfejsu
expect class PlatformInfo {
    val osName: String
    val osVersion: String
    val deviceModel: String
}

expect fun getCurrentTimestamp(): Long

expect fun generateUUID(): String
```

```kotlin
// androidMain - implementacja Android
actual class PlatformInfo {
    actual val osName = "Android"
    actual val osVersion = Build.VERSION.RELEASE
    actual val deviceModel = "${Build.MANUFACTURER} ${Build.MODEL}"
}

actual fun getCurrentTimestamp() = System.currentTimeMillis()
actual fun generateUUID() = java.util.UUID.randomUUID().toString()
```

```kotlin
// iosMain - implementacja iOS
actual class PlatformInfo {
    actual val osName = UIDevice.currentDevice.systemName
    actual val osVersion = UIDevice.currentDevice.systemVersion
    actual val deviceModel = UIDevice.currentDevice.model
}

actual fun getCurrentTimestamp() =
    (NSDate().timeIntervalSince1970 * 1000).toLong()

actual fun generateUUID() = NSUUID().UUIDString
```

## Shared ViewModel z SKIE

```kotlin
// commonMain - ViewModel współdzielony z iOS
class TaskListViewModel(
    private val getAllTasks: GetAllTasksUseCase,
    private val toggleTask: ToggleTaskUseCase
) : ViewModel() {

    private val _state = MutableStateFlow(TaskListState())
    val state: StateFlow<TaskListState> = _state.asStateFlow()

    init {
        viewModelScope.launch {
            getAllTasks()
                .onStart { _state.update { it.copy(isLoading = true) } }
                .catch { e -> _state.update { it.copy(error = e.message) } }
                .collect { tasks ->
                    _state.update { it.copy(tasks = tasks, isLoading = false) }
                }
        }
    }

    fun toggle(taskId: Long) {
        viewModelScope.launch { toggleTask(taskId) }
    }
}

data class TaskListState(
    val tasks: List<Task> = emptyList(),
    val isLoading: Boolean = false,
    val error: String? = null
)
```

```swift
// iOS - użycie KMP ViewModel w SwiftUI przez SKIE
import shared

struct TaskListView: View {
    @StateObject private var viewModel = TaskListViewModel(...)
    @State private var tasks: [Task] = []

    var body: some View {
        List(tasks, id: \.id) { task in
            TaskRow(task: task)
                .onTapGesture { viewModel.toggle(taskId: task.id) }
        }
        .task {
            // SKIE konwertuje Flow → AsyncSequence automatycznie
            for await state in viewModel.state {
                tasks = state.tasks
            }
        }
    }
}
```

## Konfiguracja build.gradle.kts

```kotlin
// shared/build.gradle.kts
plugins {
    alias(libs.plugins.kotlinMultiplatform)
    alias(libs.plugins.androidLibrary)
    alias(libs.plugins.sqldelight)
}

kotlin {
    androidTarget {
        compilations.all {
            kotlinOptions { jvmTarget = "17" }
        }
    }

    listOf(
        iosX64(), iosArm64(), iosSimulatorArm64()
    ).forEach { iosTarget ->
        iosTarget.binaries.framework {
            baseName = "shared"
            isStatic = true
        }
    }

    sourceSets {
        commonMain.dependencies {
            implementation(libs.ktor.client.core)
            implementation(libs.ktor.client.content.negotiation)
            implementation(libs.ktor.serialization.kotlinx.json)
            implementation(libs.sqldelight.runtime)
            implementation(libs.sqldelight.coroutines.extensions)
            implementation(libs.kotlinx.coroutines.core)
            implementation(libs.kotlinx.datetime)
        }
        androidMain.dependencies {
            implementation(libs.ktor.client.android)
            implementation(libs.sqldelight.android.driver)
        }
        iosMain.dependencies {
            implementation(libs.ktor.client.darwin)
            implementation(libs.sqldelight.native.driver)
        }
    }
}
```

## KMP vs inne podejścia

| Aspekt | KMP | Flutter | React Native |
|--------|-----|---------|-------------|
| Współdzielony kod | Logika biznesowa | Cały UI + logika | Cały UI + logika |
| Natywny UI | ✅ Tak | ❌ Własny silnik | ⚠️ Bridge do natywnych |
| Wydajność | Natywna | Zbliżona do natywnej | Niższa (bridge) |
| Dojrzałość (2025) | Stabilne | Stabilne | Stabilne |
| Krzywa uczenia | Wysoka (Kotlin + Swift) | Średnia (Dart) | Niska (JS/TS) |

## Linki

- [Kotlin Multiplatform](https://kotlinlang.org/docs/multiplatform.html)
- [Ktor](https://ktor.io/docs/client-create-new-application.html)
- [SQLDelight](https://sqldelight.github.io/sqldelight/)
- [SKIE - Swift/Kotlin Interface Enhancer](https://skie.touchlab.co/)
- [KMP Sample - TouchLab](https://github.com/touchlab/KaMPKit)

## Testowanie kodu współdzielonego

Jedną z największych zalet KMP jest możliwość testowania logiki biznesowej raz, w `commonTest`, i uruchamiania tych samych testów na JVM (Android) oraz natywnym kompilatorze iOS (Kotlin/Native). Testy piszemy przy użyciu biblioteki `kotlin.test`, która jest multiplatformowym odpowiednikiem JUnit.

```kotlin
// commonTest - test repozytorium z mockiem
class TaskRepositoryTest {

    private lateinit var repository: TaskRepository
    private val fakeDb = FakeTaskDatabase()

    @BeforeTest
    fun setup() {
        repository = TaskRepository(fakeDb)
    }

    @Test
    fun `insertTask dodaje zadanie do listy`() = runTest {
        repository.insertTask("Zakupy", "Mleko, chleb")
        val tasks = repository.getAllTasks().first()
        assertEquals(1, tasks.size)
        assertEquals("Zakupy", tasks.first().title)
    }

    @Test
    fun `toggleTask zmienia status is_done`() = runTest {
        repository.insertTask("Zadanie", "")
        val id = repository.getAllTasks().first().first().id
        repository.toggleTask(id, isDone = true)
        val updated = repository.getAllTasks().first().first()
        assertTrue(updated.isDone)
    }

    @Test
    fun `getAllTasks zwraca pustą listę dla nowej bazy`() = runTest {
        val tasks = repository.getAllTasks().first()
        assertTrue(tasks.isEmpty())
    }
}
```

Do mockowania zależności w `commonTest` zalecana jest biblioteka **MockK for KMP** (`io.mockk:mockk-common`) lub ręczne implementacje fake'ów, jak powyższy `FakeTaskDatabase`. MockK obsługuje zarówno JVM, jak i Kotlin/Native (od wersji 1.13+):

```kotlin
// build.gradle.kts - zależności testowe
sourceSets {
    commonTest.dependencies {
        implementation(kotlin("test"))
        implementation("org.jetbrains.kotlinx:kotlinx-coroutines-test:1.8.1")
        implementation("io.mockk:mockk-common:1.13.11")
    }
    androidUnitTest.dependencies {
        implementation("io.mockk:mockk:1.13.11")
    }
    iosTest.dependencies {
        implementation("io.mockk:mockk-common:1.13.11")
    }
}
```

Uruchomienie testów na obu platformach:

```bash
# Testy na JVM (szybkie, zalecane do CI)
./gradlew :shared:jvmTest

# Testy na symulatorze iOS (Kotlin/Native)
./gradlew :shared:iosSimulatorArm64Test

# Wszystkie testy naraz
./gradlew :shared:allTests
```

Testy asynchroniczne używają `runTest` z `kotlinx-coroutines-test`, który automatycznie zarządza `TestCoroutineScheduler` i pozwala używać `advanceTimeBy()` do symulacji opóźnień bez czekania w czasie rzeczywistym. Dobra pokrycie testami `commonMain` gwarantuje, że logika biznesowa działa identycznie niezależnie od platformy.

## Compose Multiplatform - wspólny UI

Compose Multiplatform (CMP), rozwijany przez JetBrains, rozszerza Jetpack Compose poza Androida - ten sam kod `@Composable` działa na **Android**, **Desktop (JVM)**, **iOS** (eksperymentalnie od 1.6) i **Web (Wasm)**. Jest to uzupełnienie KMP, gdy zależy nam na współdzieleniu nie tylko logiki, ale też interfejsu użytkownika.

```kotlin
// composeApp/src/commonMain/kotlin/App.kt
@Composable
fun App(viewModel: TaskListViewModel) {
    val state by viewModel.state.collectAsStateWithLifecycle()

    MaterialTheme {
        Scaffold(
            topBar = {
                TopAppBar(title = { Text("Moje Zadania") })
            },
            floatingActionButton = {
                FloatingActionButton(onClick = { viewModel.showAddDialog() }) {
                    Icon(Icons.Default.Add, contentDescription = "Dodaj zadanie")
                }
            }
        ) { padding ->
            when {
                state.isLoading -> Box(Modifier.fillMaxSize(), Alignment.Center) { CircularProgressIndicator() }
                state.tasks.isEmpty() -> EmptyState(Modifier.padding(padding))
                else -> TaskList(tasks = state.tasks, onToggle = viewModel::toggle,
                    modifier = Modifier.padding(padding))
            }
        }
    }
}
```

Konfiguracja projektu Compose Multiplatform w `build.gradle.kts`:

```kotlin
// composeApp/build.gradle.kts
plugins {
    alias(libs.plugins.kotlinMultiplatform)
    alias(libs.plugins.composeMultiplatform)
    alias(libs.plugins.composeCompiler)
}

kotlin {
    androidTarget()
    jvm("desktop")    // Desktop
    // iosArm64(); iosX64(); iosSimulatorArm64()  // iOS (eksperymentalne)

    sourceSets {
        val desktopMain by getting
        commonMain.dependencies {
            implementation(compose.runtime)
            implementation(compose.foundation)
            implementation(compose.material3)
            implementation(compose.ui)
            implementation(project(":shared"))
        }
        androidMain.dependencies { implementation(libs.androidx.activity.compose) }
        desktopMain.dependencies { implementation(compose.desktop.currentOs) }
    }
}

compose.desktop {
    application {
        mainClass = "MainKt"
        nativeDistributions { targetFormats(TargetFormat.Dmg, TargetFormat.Msi, TargetFormat.Deb) }
    }
}
```

| Platforma | Status CMP 1.7 | Uwagi |
|---|---|---|
| Android | ✅ Stabilne | Pełna parytety z Jetpack Compose |
| Desktop (JVM) | ✅ Stabilne | Swing/AWT backend |
| iOS | ⚠️ Beta | UIKitView dla natywnych widgetów |
| Web (Wasm) | ⚠️ Alpha | Wymaga przeglądarki z Wasm GC |

Ekrany wspólne dla Androida i Desktopu - np. panel administracyjny aplikacji - mogą być implementowane raz w `commonMain` i uruchamiane bez modyfikacji. Dla iOS wciąż zalecane jest natywne SwiftUI połączone z KMP ViewModel przez SKIE.

## Logowanie i diagnostyka

W projektach KMP nie można użyć `android.util.Log` ani `NSLog` bezpośrednio w `commonMain`. Dedykowane biblioteki logowania dla KMP zapewniają jednolite API na wszystkich platformach.

**Napier** (lekki, zero-dependencies) to jedna z najpopularniejszych opcji:

```kotlin
// commonMain - inicjalizacja i użycie
import io.github.aakira.napier.Napier
import io.github.aakira.napier.DebugAntilog

// Android - w Application.onCreate()
Napier.base(DebugAntilog())

// iOS - w AppDelegate / @main struct
NapierProxy.shared.initLogger()  // przez SKIE lub objc bridging

// Użycie w commonMain - identyczne na obu platformach
class TaskListViewModel : ViewModel() {
    init {
        Napier.i("ViewModel zainicjalizowany", tag = "TaskListVM")
    }

    fun toggle(id: Long) {
        Napier.d("Toggle zadania id=$id", tag = "TaskListVM")
        viewModelScope.launch {
            try {
                toggleTask(id)
                Napier.i("Zadanie $id przełączone", tag = "TaskListVM")
            } catch (e: Exception) {
                Napier.e("Błąd przełączania zadania $id", e, tag = "TaskListVM")
            }
        }
    }
}
```

**Kermit** (TouchLab) oferuje bardziej rozbudowane możliwości, w tym integrację z Crashlytics i Sentry:

```kotlin
// Konfiguracja Kermit z wieloma sink'ami
val logger = Logger(
    config = StaticConfig(
        logWriterList = listOf(
            CommonWriter(),                          // konsola
            CrashReportingLogWriter(minSeverity = Severity.Error)  // Crashlytics
        )
    ),
    tag = "AppLogger"
)

// Dedykowany logger dla modułu
private val log = Logger.withTag("NetworkModule")

suspend fun fetchData(): Result<Data> {
    log.d { "Rozpoczynam pobieranie danych" }
    return try {
        val data = api.getData()
        log.i { "Pobrano ${data.size} rekordów" }
        Result.success(data)
    } catch (e: Exception) {
        log.e(e) { "Błąd pobierania danych" }
        Result.failure(e)
    }
}
```

Zależności w `build.gradle.kts`:

```kotlin
commonMain.dependencies {
    // Napier
    implementation("io.github.aakira:napier:2.7.1")
    // lub Kermit
    implementation("co.touchlab:kermit:2.0.3")
    implementation("co.touchlab:kermit-crashlytics:2.0.3")
}
```

| Cecha | Napier | Kermit |
|---|---|---|
| Rozmiar biblioteki | ~30 KB | ~80 KB |
| Integracja Crashlytics | ❌ | ✅ |
| Custom sink | ✅ | ✅ |
| Structured logging | ❌ | ⚠️ Podstawowe |
| Aktywne utrzymanie | ✅ | ✅ |

W środowisku produkcyjnym zaleca się ustawienie minimalnego poziomu logowania na `Info` lub `Warning`, a w trybie debug - `Verbose`. Poziomy: `Verbose → Debug → Info → Warning → Error → Assert`. Crash reporting powinien przechwytywać logi poziomu `Error` i wyżej, aby każdy nieobsłużony wyjątek był automatycznie raportowany do systemu monitoringu.
