# Testowanie Aplikacji Android

Testowanie to integralna część profesjonalnego rozwoju aplikacji. Android oferuje pełne narzędzia do testów jednostkowych, integracyjnych i UI.

## Piramida testów

Piramida testów ilustruje zalecaną strategię pokrycia testowego w aplikacjach mobilnych. Testy jednostkowe stanowią podstawę — jest ich najwięcej, działają najszybciej i są najtańsze w utrzymaniu. Im wyżej w piramidzie, tym testy są wolniejsze i kosztowniejsze, dlatego powinno ich być mniej.

```
        /\
       /UI\          ← Testy UI (Espresso, Compose Test) — wolne
      /----\
     / Integ\        ← Testy integracyjne (Room, Hilt) — średnie
    /--------\
   /  Jednostk\      ← Testy jednostkowe (JUnit, Mockk) — szybkie, wiele
  /────────────\
```

## Testy jednostkowe — JUnit 5 + MockK

JUnit 5 to standardowy framework testowy dla JVM, a MockK — biblioteka dedykowana do mockowania obiektów w Kotlinie. Poniższy przykład pokazuje test ViewModel z użyciem fałszywych implementacji use case'ów, co pozwala testować logikę prezentacji w izolacji od warstwy danych. Wzorzec Given-When-Then czytelnie oddziela konfigurację testu, wykonanie akcji i weryfikację wyniku.

```kotlin
@ExtendWith(MockKExtension::class)
class TaskViewModelTest {
    @MockK lateinit var getTasksUseCase: GetTasksUseCase
    @MockK lateinit var addTaskUseCase: AddTaskUseCase

    private lateinit var viewModel: TaskViewModel

    @Before
    fun setup() {
        MockKAnnotations.init(this)
        viewModel = TaskViewModel(getTasksUseCase, addTaskUseCase)
    }

    @Test
    fun `loadTasks emits Success state with tasks`() = runTest {
        // Given
        val tasks = listOf(Task(1, "Test task"), Task(2, "Another task"))
        every { getTasksUseCase() } returns flowOf(tasks)

        // When
        viewModel.loadTasks()

        // Then
        val state = viewModel.uiState.value
        assertTrue(state.tasks.size == 2)
        assertFalse(state.isLoading)
        assertNull(state.error)
    }
}
```

## Testy Compose UI

Testy Compose UI pozwalają weryfikować zachowanie interfejsu użytkownika bez uruchamiania całej aplikacji na emulatorze lub urządzeniu. `createComposeRule()` udostępnia środowisko testowe, w którym można renderować komponenty i sprawdzać ich zawartość lub interaktywność. To podejście jest szybsze od pełnych testów instrumentalnych i umożliwia testowanie pojedynczych komponentów w izolacji.

```kotlin
class TaskScreenTest {
    @get:Rule val composeTestRule = createComposeRule()

    @Test
    fun taskList_displaysAllTasks() {
        val tasks = listOf(
            Task(1, "Nauka Kotlin"),
            Task(2, "Zrób ćwiczenie")
        )

        composeTestRule.setContent {
            AppTheme {
                TaskList(tasks = tasks, onTaskClick = {})
            }
        }

        composeTestRule.onNodeWithText("Nauka Kotlin").assertIsDisplayed()
        composeTestRule.onNodeWithText("Zrób ćwiczenie").assertIsDisplayed()
    }

    @Test
    fun addButton_opensDialog() {
        composeTestRule.setContent {
            AppTheme { TaskScreen(viewModel = fakeViewModel) }
        }

        composeTestRule.onNodeWithContentDescription("Dodaj zadanie").performClick()
        composeTestRule.onNodeWithText("Nowe zadanie").assertIsDisplayed()
    }
}
```

## Testy Room

Testy Room weryfikują operacje na lokalnej bazie danych bez potrzeby uruchamiania fizycznego urządzenia. Baza danych `inMemoryDatabaseBuilder()` istnieje tylko na czas trwania testu — nie zapisuje danych na dysk, co przyspiesza wykonanie i gwarantuje izolację każdego testu. To niezbędne narzędzie do sprawdzenia poprawności zapytań SQL, migracji schematu i logiki DAO.

```kotlin
@RunWith(AndroidJUnit4::class)
class TaskDaoTest {
    private lateinit var db: AppDatabase
    private lateinit var dao: TaskDao

    @Before
    fun setup() {
        // In-memory database — nie zapisuje na dysk
        db = Room.inMemoryDatabaseBuilder(
            ApplicationProvider.getApplicationContext(),
            AppDatabase::class.java
        ).build()
        dao = db.taskDao()
    }

    @After
    fun teardown() = db.close()

    @Test
    fun insertAndGet() = runTest {
        val task = Task(name = "Test Task")
        dao.insert(task)

        val tasks = dao.getAllTasks().first()
        assertEquals(1, tasks.size)
        assertEquals("Test Task", tasks[0].name)
    }
}
```

## Code Coverage

Pokrycie kodu (code coverage) to metryka informująca, jaki procent kodu produkcyjnego jest wykonywany podczas testów. Włączenie raportowania pokrycia wymaga konfiguracji w pliku `build.gradle.kts` — poniższy fragment włącza śledzenie zarówno dla testów jednostkowych (`enableUnitTestCoverage`), jak i instrumentalnych (`enableAndroidTestCoverage`). Wygenerowany raport HTML pozwala zidentyfikować niepokryte ścieżki kodu i zaplanować dalsze testy.

```kotlin
// build.gradle.kts
android {
    buildTypes {
        debug {
            enableUnitTestCoverage = true
            enableAndroidTestCoverage = true
        }
    }
}
```

Po skonfigurowaniu ustawień pokrycia należy uruchomić dedykowane polecenie Gradle, które generuje raport HTML. Raport ten wizualnie zaznacza linie pokryte (zielone) i niepokryte (czerwone) testami, ułatwiając identyfikację luk w pokryciu.

```bash
# Generowanie raportu
./gradlew testDebugUnitTestCoverage
# Raport: app/build/reports/coverage/test/debug/index.html
```

## Linki

- [Testing in Android](https://developer.android.com/training/testing)
- [Compose Testing](https://developer.android.com/compose/testing)
- [MockK](https://mockk.io/)

## Compose Testing — UI testy

Do uruchomienia testów UI Compose wymagane są dwie zależności: `ui-test-junit4` dla środowiska testowego oraz `ui-test-manifest` (dostępna tylko w buildzie debug) zapewniająca poprawną konfigurację manifestu. Poniższy przykład pokazuje pełny zestaw testów ekranu TaskScreen obejmujący weryfikację listy zadań, interakcję z formularzem dodawania i obsługę wskaźnika ładowania — trzy najczęstsze scenariusze testowe w aplikacjach MVVM.

```kotlin
dependencies {
    androidTestImplementation("androidx.compose.ui:ui-test-junit4")
    debugImplementation("androidx.compose.ui:ui-test-manifest")
}

@RunWith(AndroidJUnit4::class)
class TaskScreenTest {

    @get:Rule
    val composeTestRule = createComposeRule()

    @Test
    fun taskList_displaysItems_afterLoading() {
        // Given
        val fakeTasks = listOf(
            Task(1, "Zaprojektuj ekran logowania"),
            Task(2, "Implementuj API"),
            Task(3, "Napisz testy")
        )

        composeTestRule.setContent {
            MaterialTheme {
                TaskListScreen(
                    uiState = TaskUiState(tasks = fakeTasks, isLoading = false)
                )
            }
        }

        // Then — wszystkie zadania widoczne
        fakeTasks.forEach { task ->
            composeTestRule
                .onNodeWithText(task.title)
                .assertIsDisplayed()
        }
    }

    @Test
    fun addTask_displaysNewTask_afterConfirmation() {
        var addedTaskName = ""
        composeTestRule.setContent {
            AddTaskScreen(onTaskAdded = { addedTaskName = it })
        }

        // When — wpisz nazwę i naciśnij przycisk
        composeTestRule
            .onNodeWithTag("task_input")
            .performTextInput("Nowe ważne zadanie")

        composeTestRule
            .onNodeWithText("Dodaj")
            .performClick()

        // Then
        assert(addedTaskName == "Nowe ważne zadanie")
    }

    @Test
    fun loadingState_showsProgressIndicator() {
        composeTestRule.setContent {
            TaskListScreen(uiState = TaskUiState(isLoading = true))
        }

        composeTestRule
            .onNodeWithTag("loading_indicator")
            .assertIsDisplayed()

        composeTestRule
            .onNodeWithTag("task_list")
            .assertDoesNotExist()
    }
}
```

## Turbine — testowanie Flow

Turbine to biblioteka Cash App upraszczająca testowanie Kotlin Flow — pozwala „zbierać" emisje w kontrolowany sposób zamiast korzystać z trudniejszego w obsłudze `collect`. Metoda `test {}` blokuje wykonanie coroutine i umożliwia sekwencyjne pobieranie kolejnych emisji przez `awaitItem()`. Dzięki temu można precyzyjnie zweryfikować kolejność stanów: stan początkowy → ładowanie → dane załadowane.

```kotlin
dependencies {
    testImplementation("app.cash.turbine:turbine:1.1.0")
}

@Test
fun viewModel_emitsLoadingThenData() = runTest {
    val fakeRepository = FakeTaskRepository(
        tasks = listOf(Task(1, "Test task"))
    )
    val viewModel = TaskViewModel(GetTasksUseCase(fakeRepository))

    viewModel.uiState.test {
        // Pierwsze emisje: stan początkowy
        val initial = awaitItem()
        assertFalse(initial.isLoading)
        assertTrue(initial.tasks.isEmpty())

        // Po init {} viewModelu ładuje dane
        val loading = awaitItem()
        assertTrue(loading.isLoading)

        // Dane załadowane
        val loaded = awaitItem()
        assertFalse(loaded.isLoading)
        assertEquals(1, loaded.tasks.size)
        assertEquals("Test task", loaded.tasks.first().title)

        cancelAndIgnoreRemainingEvents()
    }
}
```

## MockK — mockowanie w testach

MockK to natywna biblioteka mockowania dla Kotlina, która — w odróżnieniu od Mockito — w pełni obsługuje `suspend fun` i coroutines. `coEvery` oraz `coVerify` to odpowiedniki `every`/`verify` przeznaczone dla funkcji zawieszalnych. Poniższy przykład sprawdza zarówno poprawność przekazywanych argumentów do repozytorium, jak i logikę filtrowania wyników przez use case.

```kotlin
dependencies {
    testImplementation("io.mockk:mockk:1.13.10")
}

@Test
fun addTask_callsRepository_withCorrectData() = runTest {
    // Given
    val mockRepository = mockk<TaskRepository>()
    coEvery { mockRepository.addTask(any()) } returns Unit
    coEvery { mockRepository.getTasks() } returns flowOf(emptyList())

    val viewModel = TaskViewModel(
        getTasksUseCase = GetTasksUseCase(mockRepository),
        addTaskUseCase = AddTaskUseCase(mockRepository)
    )

    // When
    viewModel.addTask("Nowe zadanie")
    advanceUntilIdle()

    // Then
    coVerify(exactly = 1) {
        mockRepository.addTask(match { it.title == "Nowe zadanie" })
    }
}

@Test
fun getFilteredTasks_returnsOnlyActive_whenFilterEnabled() = runTest {
    val tasks = listOf(
        Task(1, "Aktywne", isCompleted = false),
        Task(2, "Zrobione", isCompleted = true)
    )
    val mockRepository = mockk<TaskRepository> {
        coEvery { getTasks() } returns flowOf(tasks)
    }

    val useCase = GetTasksUseCase(mockRepository)
    val result = useCase().first()

    assertEquals(1, result.size)
    assertEquals("Aktywne", result.first().title)
}
```

## Linki dodatkowe

- [Compose Testing](https://developer.android.com/jetpack/compose/testing)
- [Turbine](https://github.com/cashapp/turbine)
- [MockK](https://mockk.io)

---

## Hilt — dependency injection w testach

Hilt upraszcza wstrzykiwanie zależności w testach instrumentalnych: zamiast ręcznie tworzyć grafy obiektów, podmienisz konkretne implementacje za pomocą adnotacji.

### Konfiguracja

```kotlin
// build.gradle.kts (moduł app)
androidTestImplementation("com.google.dagger:hilt-android-testing:2.51.1")
kspAndroidTest("com.google.dagger:hilt-compiler:2.51.1")
```

### Podmiana repozytorium w teście

```kotlin
// Fałszywa implementacja
class FakeTaskRepository : TaskRepository {
    private val _tasks = MutableStateFlow<List<Task>>(emptyList())
    override fun getTasks(): Flow<List<Task>> = _tasks
    override suspend fun addTask(task: Task) { _tasks.update { it + task } }
    override suspend fun deleteTask(id: Int) { _tasks.update { list -> list.filter { it.id != id } } }
}

// Moduł zastępujący produkcyjny
@TestInstallIn(
    components = [SingletonComponent::class],
    replaces   = [RepositoryModule::class]
)
@Module
object FakeRepositoryModule {
    @Provides
    @Singleton
    fun provideTaskRepository(): TaskRepository = FakeTaskRepository()
}
```

### Test z HiltAndroidRule

```kotlin
@HiltAndroidTest
@RunWith(AndroidJUnit4::class)
class TaskListScreenTest {

    @get:Rule(order = 0) val hiltRule  = HiltAndroidRule(this)
    @get:Rule(order = 1) val composeRule = createAndroidComposeRule<MainActivity>()

    @Inject lateinit var repository: TaskRepository

    @Before
    fun setUp() {
        hiltRule.inject()
    }

    @Test
    fun emptyState_showsPlaceholder() {
        composeRule.onNodeWithText("Brak zadań").assertIsDisplayed()
    }

    @Test
    fun afterAddingTask_taskAppearsOnList() = runTest {
        repository.addTask(Task(1, "Zakupy", isCompleted = false))
        composeRule.onNodeWithText("Zakupy").assertIsDisplayed()
    }
}
```

`HiltAndroidRule` inicjalizuje komponent Hilt przed każdym testem. `@Inject` w ciele testu pozwala korzystać z tego samego grafu co testowana aktywność — tyle że z fałszywymi zależnościami.

---

## Robot Pattern — testy UI czytelne jak specyfikacja

Robot Pattern (wzorzec robotów) separuje *co* testujemy (logika testu) od *jak* wchodzimy w interakcję z ekranem (szczegóły Compose). Każdy ekran otrzymuje klasę „robota", która enkapsuluje selektory i akcje.

### Klasa robota dla ekranu zadań

```kotlin
class TaskRobot(private val composeRule: ComposeContentTestRule) {

    // Akcje
    fun typeTaskTitle(title: String): TaskRobot {
        composeRule.onNodeWithTag("input_title").performTextInput(title)
        return this
    }

    fun clickAddButton(): TaskRobot {
        composeRule.onNodeWithContentDescription("Dodaj zadanie").performClick()
        return this
    }

    fun clickTaskItem(title: String): TaskRobot {
        composeRule.onNodeWithText(title).performClick()
        return this
    }

    fun swipeToDelete(title: String): TaskRobot {
        composeRule.onNodeWithText(title)
            .performTouchInput { swipeLeft() }
        return this
    }

    // Asercje
    fun assertTaskVisible(title: String): TaskRobot {
        composeRule.onNodeWithText(title).assertIsDisplayed()
        return this
    }

    fun assertTaskNotVisible(title: String): TaskRobot {
        composeRule.onNodeWithText(title).assertDoesNotExist()
        return this
    }

    fun assertEmptyState(): TaskRobot {
        composeRule.onNodeWithText("Brak zadań").assertIsDisplayed()
        return this
    }
}
```

### Testy z użyciem robota — czytelność jak BDD

```kotlin
@HiltAndroidTest
@RunWith(AndroidJUnit4::class)
class TaskRobotTest {

    @get:Rule(order = 0) val hiltRule    = HiltAndroidRule(this)
    @get:Rule(order = 1) val composeRule = createAndroidComposeRule<MainActivity>()

    private val robot by lazy { TaskRobot(composeRule) }

    @Before fun setUp() = hiltRule.inject()

    @Test
    fun `adding task shows it on list`() {
        robot
            .assertEmptyState()
            .typeTaskTitle("Kupić mleko")
            .clickAddButton()
            .assertTaskVisible("Kupić mleko")
    }

    @Test
    fun `swiping task removes it from list`() {
        robot
            .typeTaskTitle("Do usunięcia")
            .clickAddButton()
            .assertTaskVisible("Do usunięcia")
            .swipeToDelete("Do usunięcia")
            .assertTaskNotVisible("Do usunięcia")
    }
}
```

Zalety wzorca:
- Zmiana selektora (np. `testTag`) wymaga edycji tylko robota, nie wszystkich testów.
- Testy czyta się jak specyfikację funkcjonalną.
- Płynne API (każda metoda zwraca `this`) pozwala chainować kroki bez zbędnych zmiennych.
