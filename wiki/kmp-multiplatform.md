# Kotlin Multiplatform — Współdzielony Kod

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

## Ktor — HTTP client dla KMP

```kotlin
// commonMain — identyczny kod działa na Android i iOS
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

## SQLDelight — baza danych KMP

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

## Expect/Actual — platform-specific code

```kotlin
// commonMain — deklaracja interfejsu
expect class PlatformInfo {
    val osName: String
    val osVersion: String
    val deviceModel: String
}

expect fun getCurrentTimestamp(): Long

expect fun generateUUID(): String
```

```kotlin
// androidMain — implementacja Android
actual class PlatformInfo {
    actual val osName = "Android"
    actual val osVersion = Build.VERSION.RELEASE
    actual val deviceModel = "${Build.MANUFACTURER} ${Build.MODEL}"
}

actual fun getCurrentTimestamp() = System.currentTimeMillis()
actual fun generateUUID() = java.util.UUID.randomUUID().toString()
```

```kotlin
// iosMain — implementacja iOS
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
// commonMain — ViewModel współdzielony z iOS
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
// iOS — użycie KMP ViewModel w SwiftUI przez SKIE
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
- [SKIE — Swift/Kotlin Interface Enhancer](https://skie.touchlab.co/)
- [KMP Sample — TouchLab](https://github.com/touchlab/KaMPKit)
