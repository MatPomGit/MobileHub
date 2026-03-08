# Architektura Aplikacji Android — MVVM i Clean Architecture

Dobra architektura rozdziela odpowiedzialności i sprawia, że kod jest testowalny, czytelny i łatwy w utrzymaniu. Google rekomenduje architekturę warstwową opartą na MVVM.

## Rekomendowana architektura warstw

```
┌─────────────────────────────────┐
│         UI Layer                │  Composables, Activities, Fragments
│  (Compose UI + ViewModel)       │
├─────────────────────────────────┤
│       Domain Layer (opcjonalna) │  Use Cases, modele domenowe
├─────────────────────────────────┤
│         Data Layer              │  Repositories, Data Sources
│  (Repository + DataSource)      │  (Room, Retrofit, DataStore...)
└─────────────────────────────────┘
```

## ViewModel — logika prezentacji

```kotlin
@HiltViewModel
class TaskViewModel @Inject constructor(
    private val getTasksUseCase: GetTasksUseCase,
    private val addTaskUseCase: AddTaskUseCase
) : ViewModel() {

    private val _uiState = MutableStateFlow(TaskUiState())
    val uiState: StateFlow<TaskUiState> = _uiState.asStateFlow()

    init {
        loadTasks()
    }

    private fun loadTasks() {
        viewModelScope.launch {
            getTasksUseCase()
                .onStart { _uiState.update { it.copy(isLoading = true) } }
                .catch { e -> _uiState.update { it.copy(error = e.message) } }
                .collect { tasks ->
                    _uiState.update { it.copy(tasks = tasks, isLoading = false) }
                }
        }
    }

    fun addTask(name: String) {
        viewModelScope.launch {
            addTaskUseCase(name)
        }
    }
}

data class TaskUiState(
    val tasks: List<Task> = emptyList(),
    val isLoading: Boolean = false,
    val error: String? = null
)
```

## Repository Pattern

```kotlin
interface TaskRepository {
    fun getTasks(): Flow<List<Task>>
    suspend fun addTask(task: Task)
    suspend fun deleteTask(id: Int)
}

class TaskRepositoryImpl @Inject constructor(
    private val localDataSource: TaskLocalDataSource,
    private val remoteDataSource: TaskRemoteDataSource
) : TaskRepository {

    override fun getTasks(): Flow<List<Task>> =
        localDataSource.getAllTasks()
            .onStart { syncWithRemote() }

    private suspend fun syncWithRemote() {
        try {
            val remote = remoteDataSource.fetchTasks()
            localDataSource.insertAll(remote)
        } catch (e: Exception) {
            // Kontynuuj z danymi lokalnymi
        }
    }
}
```

## Use Cases — warstwa domenowa

```kotlin
// Pojedyncza odpowiedzialność: jeden use case = jedno działanie
class GetTasksUseCase @Inject constructor(
    private val repository: TaskRepository
) {
    operator fun invoke(): Flow<List<Task>> =
        repository.getTasks()
            .map { tasks -> tasks.filter { !it.isArchived } }
            .map { tasks -> tasks.sortedByDescending { it.createdAt } }
}
```

## Hilt — Dependency Injection

```kotlin
// Moduł DI
@Module
@InstallIn(SingletonComponent::class)
object DataModule {

    @Provides @Singleton
    fun provideDatabase(@ApplicationContext ctx: Context): AppDatabase =
        Room.databaseBuilder(ctx, AppDatabase::class.java, "app.db").build()

    @Provides @Singleton
    fun provideTaskRepository(
        db: AppDatabase,
        api: TaskApi
    ): TaskRepository = TaskRepositoryImpl(
        localDataSource = TaskLocalDataSource(db.taskDao()),
        remoteDataSource = TaskRemoteDataSource(api)
    )
}
```

## Unidirectional Data Flow (UDF)

```
Event (user action) → ViewModel → State update → UI recompose
         ↑                                              │
         └──────────────────────────────────────────────┘
```

UI nigdy nie modyfikuje stanu bezpośrednio — zawsze przez ViewModel. To eliminuje niespójności stanu.

## Linki

- [Guide to App Architecture](https://developer.android.com/topic/architecture)
- [ViewModel](https://developer.android.com/topic/libraries/architecture/viewmodel)
- [Hilt DI](https://developer.android.com/training/dependency-injection/hilt-android)

## StateFlow vs SharedFlow

```kotlin
@HiltViewModel
class SearchViewModel @Inject constructor(
    private val searchRepository: SearchRepository
) : ViewModel() {

    // StateFlow — stan z zawsze dostępną aktualną wartością
    // Dobre dla: UI state, dane do wyświetlenia
    private val _query = MutableStateFlow("")
    val query: StateFlow<String> = _query.asStateFlow()

    val results: StateFlow<List<SearchResult>> = _query
        .debounce(300)  // poczekaj 300ms po ostatnim znaku
        .filter { it.length >= 2 }
        .flatMapLatest { q -> searchRepository.search(q) }
        .stateIn(
            scope = viewModelScope,
            started = SharingStarted.WhileSubscribed(5_000),
            initialValue = emptyList()
        )

    // SharedFlow — jednorazowe eventy
    // Dobre dla: nawigacja, SnackBar, Toast
    private val _events = MutableSharedFlow<UiEvent>()
    val events: SharedFlow<UiEvent> = _events.asSharedFlow()

    fun onQueryChanged(query: String) {
        _query.value = query
    }

    fun onTaskSaved() {
        viewModelScope.launch {
            _events.emit(UiEvent.ShowSnackbar("Zadanie zapisane!"))
            _events.emit(UiEvent.NavigateBack)
        }
    }
}

sealed class UiEvent {
    data class ShowSnackbar(val message: String) : UiEvent()
    object NavigateBack : UiEvent()
    data class NavigateTo(val route: String) : UiEvent()
}

// Konsumowanie eventów w Composable
@Composable
fun SearchScreen(viewModel: SearchViewModel, snackbarHostState: SnackbarHostState) {
    val results by viewModel.results.collectAsStateWithLifecycle()

    LaunchedEffect(Unit) {
        viewModel.events.collect { event ->
            when (event) {
                is UiEvent.ShowSnackbar -> snackbarHostState.showSnackbar(event.message)
                is UiEvent.NavigateBack -> navController.popBackStack()
                else -> {}
            }
        }
    }
}
```

## Modele UI vs Modele domenowe

```kotlin
// Model domenowy — czyste dane biznesowe
data class Task(
    val id: Int,
    val title: String,
    val description: String,
    val dueDate: LocalDate?,
    val priority: Priority,
    val isCompleted: Boolean,
    val createdAt: Instant
)

// Model UI — dane przystosowane do wyświetlenia
data class TaskUiModel(
    val id: Int,
    val title: String,
    val dueDateFormatted: String,  // "Jutro", "Wczoraj", "12 sty"
    val priorityColor: Color,
    val isOverdue: Boolean,
    val completionIcon: ImageVector
)

// Mapper — konwersja domenowy → UI
fun Task.toUiModel(now: LocalDate = LocalDate.now()): TaskUiModel {
    val dueDateFormatted = when (dueDate) {
        null -> "Bez terminu"
        now.plusDays(1) -> "Jutro"
        now -> "Dziś"
        now.minusDays(1) -> "Wczoraj"
        else -> dueDate.format(DateTimeFormatter.ofPattern("d MMM", Locale("pl")))
    }
    return TaskUiModel(
        id = id,
        title = title,
        dueDateFormatted = dueDateFormatted,
        priorityColor = when (priority) {
            Priority.HIGH   -> Color(0xFFF44336)
            Priority.MEDIUM -> Color(0xFFFF9800)
            Priority.LOW    -> Color(0xFF4CAF50)
        },
        isOverdue = dueDate != null && dueDate.isBefore(now) && !isCompleted,
        completionIcon = if (isCompleted) Icons.Default.CheckCircle else Icons.Default.RadioButtonUnchecked
    )
}
```

## SavedStateHandle — przeżycie process death

```kotlin
@HiltViewModel
class FormViewModel @Inject constructor(
    private val savedStateHandle: SavedStateHandle
) : ViewModel() {

    // Dane formularza zachowane nawet po zabiciu procesu przez system
    var title by savedStateHandle.saveable { mutableStateOf("") }
    var description by savedStateHandle.saveable { mutableStateOf("") }
    var priority by savedStateHandle.saveable { mutableStateOf(Priority.MEDIUM) }

    // Odczyt argumentu nawigacji
    val taskId: Int? = savedStateHandle["taskId"]

    // StateFlow z SavedStateHandle
    val selectedTab: StateFlow<Int> = savedStateHandle.getStateFlow("tab", 0)

    fun selectTab(index: Int) {
        savedStateHandle["tab"] = index
    }
}
```

## Linki dodatkowe

- [StateFlow and SharedFlow](https://developer.android.com/kotlin/flow/stateflow-and-sharedflow)
- [SavedStateHandle](https://developer.android.com/topic/libraries/architecture/viewmodel/viewmodel-savedstate)
- [UI Events](https://developer.android.com/topic/architecture/ui-layer/events)
