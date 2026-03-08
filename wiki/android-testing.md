# Testowanie Aplikacji Android

Testowanie to integralna część profesjonalnego rozwoju aplikacji. Android oferuje pełne narzędzia do testów jednostkowych, integracyjnych i UI.

## Piramida testów

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
