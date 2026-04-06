# Jetpack Compose — Deklaratywny UI

Jetpack Compose to nowoczesny toolkit UI dla Androida oparty na deklaratywnym paradygmacie. Zamiast manipulować drzewem widoków XML, opisujesz **co** ma być wyświetlone dla danego stanu — Compose sam aktualizuje UI gdy stan się zmienia.

## Paradygmat deklaratywny — zmiana myślenia

```kotlin
// STARY sposób (imperatywny, XML+View)
// Fragment.kt — ręczna synchronizacja stanu z widokami
binding.titleTextView.text = task.title
binding.doneCheckbox.isChecked = task.isDone
binding.dueDateTextView.visibility = if (task.dueDate != null) View.VISIBLE else View.GONE
binding.dueDate.text = task.dueDate?.format(dateFormatter) ?: ""

// NOWY sposób (deklaratywny, Compose)
// Opisz jak UI ma wyglądać dla danego stanu — Compose synchronizuje automatycznie
@Composable
fun TaskCard(task: Task) {
    Column(modifier = Modifier.padding(16.dp)) {
        Text(task.title, style = MaterialTheme.typography.titleMedium)
        if (task.isDone) Icon(Icons.Default.CheckCircle, null, tint = Color.Green)
        task.dueDate?.let { Text(it.format(dateFormatter), style = MaterialTheme.typography.bodySmall) }
    }
}
```

## Rekomposycja — jak Compose aktualizuje UI

```kotlin
// State w Compose — tylko zmiana State triggeruje rekomposycję
@Composable
fun Counter() {
    var count by remember { mutableIntStateOf(0) }
    //                      ↑ remember = zachowaj wartość między rekomposycjami
    //           ↑ delegat Kotlin — automatyczna obsługa getValue/setValue

    Column(horizontalAlignment = Alignment.CenterHorizontally) {
        Text("Kliknięć: $count", style = MaterialTheme.typography.headlineMedium)
        Button(onClick = { count++ }) { Text("Kliknij mnie") }
    }
}

// rememberSaveable — przeżywa obrót ekranu i zapis stanu
@Composable
fun SearchBar() {
    var query by rememberSaveable { mutableStateOf("") }
    TextField(value = query, onValueChange = { query = it }, label = { Text("Szukaj") })
}

// State Hoisting — przenieś stan "w górę" aby udostępnić wielu komponentom
@Composable
fun TaskListScreen(viewModel: TaskViewModel = hiltViewModel()) {
    val uiState by viewModel.uiState.collectAsStateWithLifecycle()

    TaskListContent(
        tasks = uiState.tasks,
        isLoading = uiState.isLoading,
        onTaskToggle = viewModel::toggleTask,
        onTaskDelete = viewModel::deleteTask,
        onAddTask = viewModel::addTask
    )
}

// "Dumb" komponent — tylko UI, zero logiki
@Composable
private fun TaskListContent(
    tasks: List<Task>,
    isLoading: Boolean,
    onTaskToggle: (String) -> Unit,
    onTaskDelete: (String) -> Unit,
    onAddTask: (String) -> Unit
) { /* ... */ }
```

## Layout — podstawowe kompozycje

```kotlin
@Composable
fun LayoutExamples() {
    // Column — pionowy stos
    Column(
        modifier = Modifier.fillMaxWidth().padding(16.dp),
        verticalArrangement = Arrangement.spacedBy(8.dp),
        horizontalAlignment = Alignment.CenterHorizontally
    ) {
        Text("Nagłówek")
        Text("Opis")
        Button(onClick = {}) { Text("Akcja") }
    }

    // Row — poziomy rząd
    Row(
        modifier = Modifier.fillMaxWidth(),
        horizontalArrangement = Arrangement.SpaceBetween,
        verticalAlignment = Alignment.CenterVertically
    ) {
        Icon(Icons.Default.Task, contentDescription = null)
        Text("Tytuł zadania", modifier = Modifier.weight(1f).padding(horizontal = 8.dp))
        Checkbox(checked = false, onCheckedChange = {})
    }

    // Box — nakładanie warstw (jak FrameLayout)
    Box(modifier = Modifier.size(200.dp)) {
        Image(painter = painterResource(R.drawable.bg), contentDescription = null, modifier = Modifier.fillMaxSize())
        Text("Nałożony tekst", modifier = Modifier.align(Alignment.BottomCenter).padding(8.dp), color = Color.White)
        IconButton(onClick = {}, modifier = Modifier.align(Alignment.TopEnd)) {
            Icon(Icons.Default.Close, null, tint = Color.White)
        }
    }

    // LazyColumn — wydajna lista (odpowiednik RecyclerView)
    LazyColumn(
        contentPadding = PaddingValues(horizontal = 16.dp, vertical = 8.dp),
        verticalArrangement = Arrangement.spacedBy(8.dp)
    ) {
        item { HeaderSection() }
        items(tasks, key = { it.id }) { task ->
            TaskCard(
                task = task,
                modifier = Modifier.animateItem()  // animacja dodawania/usuwania
            )
        }
        item { FooterSection() }
    }
}
```

## Modifier — dekorowanie komponentów

```kotlin
// Modifier = reusable chain opisujący rozmiar, pozycję, zachowanie, wygląd
@Composable
fun ModifierExamples() {
    Box(
        modifier = Modifier
            .fillMaxWidth()                          // zajmij całą szerokość
            .height(200.dp)                          // stała wysokość
            .padding(16.dp)                          // wewnętrzny padding
            .clip(RoundedCornerShape(12.dp))         // zaokrąglone rogi
            .background(                             // gradient tło
                Brush.verticalGradient(listOf(Color(0xFF5B4FCF), Color(0xFF9C27B0)))
            )
            .border(1.dp, Color.White.copy(0.3f), RoundedCornerShape(12.dp))
            .clickable(
                interactionSource = remember { MutableInteractionSource() },
                indication = ripple()                // efekt ripple przy kliknięciu
            ) { onClick() }
            .semantics { contentDescription = "Otwórz szczegóły projektu" }
    )

    // Własny Modifier jako extension function
    fun Modifier.cardStyle() = this
        .fillMaxWidth()
        .clip(RoundedCornerShape(12.dp))
        .background(MaterialTheme.colorScheme.surface)
        .border(1.dp, MaterialTheme.colorScheme.outlineVariant, RoundedCornerShape(12.dp))
        .padding(16.dp)

    Column(modifier = Modifier.cardStyle()) {
        Text("Karta z własnym stylem")
    }
}
```

## Animacje w Compose

```kotlin
// Proste animacje stanu
@Composable
fun AnimatedCard(isExpanded: Boolean, onClick: () -> Unit) {
    val height by animateDpAsState(
        targetValue = if (isExpanded) 200.dp else 80.dp,
        animationSpec = spring(dampingRatio = Spring.DampingRatioMediumBouncy)
    )
    val backgroundColor by animateColorAsState(
        targetValue = if (isExpanded) MaterialTheme.colorScheme.primaryContainer
                      else MaterialTheme.colorScheme.surface
    )
    val rotation by animateFloatAsState(targetValue = if (isExpanded) 180f else 0f)

    Card(
        modifier = Modifier.fillMaxWidth().height(height).clickable { onClick() },
        colors = CardDefaults.cardColors(containerColor = backgroundColor)
    ) {
        Row(modifier = Modifier.padding(16.dp), horizontalArrangement = Arrangement.SpaceBetween) {
            Text("Rozwijana karta")
            Icon(
                Icons.Default.KeyboardArrowDown,
                null,
                modifier = Modifier.rotate(rotation)
            )
        }
        AnimatedVisibility(visible = isExpanded, enter = fadeIn() + expandVertically()) {
            Text("Ukryta treść...", modifier = Modifier.padding(horizontal = 16.dp))
        }
    }
}
```

## ViewModel + Hilt integracja

```kotlin
@HiltViewModel
class TaskViewModel @Inject constructor(
    private val getTasksUseCase: GetTasksUseCase,
    private val toggleTaskUseCase: ToggleTaskUseCase,
    private val deleteTaskUseCase: DeleteTaskUseCase,
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
                .catch { e -> _uiState.update { it.copy(error = e.message, isLoading = false) } }
                .collect { tasks -> _uiState.update { it.copy(tasks = tasks, isLoading = false) } }
        }
    }

    fun toggleTask(id: String) {
        viewModelScope.launch {
            toggleTaskUseCase(id)
        }
    }

    fun deleteTask(id: String) {
        viewModelScope.launch {
            deleteTaskUseCase(id)
        }
    }
}

data class TaskUiState(
    val tasks: List<Task> = emptyList(),
    val isLoading: Boolean = false,
    val error: String? = null
)
```

## Nawigacja w Compose

Jetpack Compose Navigation zastępuje `FragmentManager` — ekrany to zwykłe funkcje `@Composable`, a przepływ między nimi kontroluje `NavController`.

### Zależności

```kotlin
// build.gradle.kts
implementation("androidx.navigation:navigation-compose:2.7.7")
```

### NavHost i NavController

```kotlin
// MainActivity.kt
@AndroidEntryPoint
class MainActivity : ComponentActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContent {
            MyAppTheme {
                val navController = rememberNavController()
                AppNavGraph(navController)
            }
        }
    }
}

// Definicja tras — wygodnie jako sealed class lub object
sealed class Screen(val route: String) {
    object TaskList  : Screen("task_list")
    object TaskDetail: Screen("task_detail/{taskId}") {
        fun createRoute(taskId: String) = "task_detail/$taskId"
    }
    object AddTask   : Screen("add_task")
}

@Composable
fun AppNavGraph(navController: NavHostController) {
    NavHost(
        navController = navController,
        startDestination = Screen.TaskList.route
    ) {
        composable(Screen.TaskList.route) {
            TaskListScreen(
                onTaskClick  = { id -> navController.navigate(Screen.TaskDetail.createRoute(id)) },
                onAddClick   = { navController.navigate(Screen.AddTask.route) }
            )
        }

        composable(
            route = Screen.TaskDetail.route,
            arguments = listOf(navArgument("taskId") { type = NavType.StringType })
        ) { backStackEntry ->
            val taskId = backStackEntry.arguments?.getString("taskId") ?: return@composable
            TaskDetailScreen(
                taskId   = taskId,
                onBack   = { navController.popBackStack() }
            )
        }

        composable(Screen.AddTask.route) {
            AddTaskScreen(
                onSaved  = { navController.popBackStack() },
                onCancel = { navController.popBackStack() }
            )
        }
    }
}
```

### Przekazywanie argumentów i wyniki

```kotlin
// Przekazywanie wyniku między ekranami za pomocą SavedStateHandle
// W AddTaskScreen — zapis wyniku przed powrotem
navController.previousBackStackEntry
    ?.savedStateHandle
    ?.set("newTaskTitle", enteredTitle)
navController.popBackStack()

// W TaskListScreen — odczyt wyniku
@Composable
fun TaskListScreen(viewModel: TaskViewModel = hiltViewModel(), ...) {
    val navBackStackEntry = rememberNavController() // ← dostęp przez LocalNavController
    // Alternatywnie: obsługa w ViewModel przez SavedStateHandle
    val newTitle = navBackStackEntry
        .currentBackStackEntry
        ?.savedStateHandle
        ?.getStateFlow<String?>("newTaskTitle", null)
        ?.collectAsStateWithLifecycle()
}

// ViewModel z SavedStateHandle automatycznie dostaje argumenty nawigacji
@HiltViewModel
class TaskDetailViewModel @Inject constructor(
    savedStateHandle: SavedStateHandle,
    private val getTaskUseCase: GetTaskUseCase
) : ViewModel() {
    private val taskId: String = checkNotNull(savedStateHandle["taskId"])

    val task = getTaskUseCase(taskId).stateIn(
        scope = viewModelScope,
        started = SharingStarted.WhileSubscribed(5_000),
        initialValue = null
    )
}
```

| Metoda nawigacji | Opis |
|---|---|
| `navigate(route)` | Przejście na nowy ekran (dodaje do back stack) |
| `navigate(route) { popUpTo(...) }` | Przejście z wyczyszczeniem back stack |
| `popBackStack()` | Powrót do poprzedniego ekranu |
| `navigate(...) { launchSingleTop = true }` | Nie duplikuj tego samego ekranu |

---

## Efekty uboczne (Side Effects)

W Compose efekty uboczne muszą być kontrolowane — nie wolno ich wywoływać bezpośrednio w ciele kompozycji, bo rekomposycja może nastąpić wielokrotnie. Dostępne są dedykowane API.

### LaunchedEffect

Uruchamia coroutine powiązaną z cyklem życia kompozycji. Anulowana gdy komponent opuszcza drzewo kompozycji lub zmienia się `key`.

```kotlin
@Composable
fun SearchScreen(query: String) {
    var results by remember { mutableStateOf<List<String>>(emptyList()) }

    // Uruchom wyszukiwanie za każdym razem gdy zmieni się query
    LaunchedEffect(query) {
        if (query.isBlank()) {
            results = emptyList()
            return@LaunchedEffect
        }
        delay(300) // debounce — poczekaj 300ms od ostatniego znaku
        results = searchApi(query)
    }

    LazyColumn {
        items(results) { item -> Text(item) }
    }
}

// LaunchedEffect z kluczem Unit — odpowiednik viewModelScope.launch w Compose,
// uruchamia się tylko raz przy pierwszej kompozycji
@Composable
fun OneTimeEffect() {
    LaunchedEffect(Unit) {
        analyticsTracker.trackScreenView("home")
    }
}
```

### DisposableEffect

Dla efektów wymagających sprzątania — rejestracja listenerów, subskrypcji, callbacków systemowych.

```kotlin
@Composable
fun LocationTracker(onLocationUpdate: (Location) -> Unit) {
    val context = LocalContext.current

    DisposableEffect(context) {
        val locationManager = context.getSystemService(LocationManager::class.java)
        val listener = LocationListener { location -> onLocationUpdate(location) }

        locationManager.requestLocationUpdates(
            LocationManager.GPS_PROVIDER, 1000L, 0f, listener
        )

        // onDispose — wywołane gdy komponent wychodzi z drzewa
        onDispose {
            locationManager.removeUpdates(listener)
        }
    }
}

// Obsługa BackHandler (przechwycenie przycisku Wstecz)
@Composable
fun ConfirmExitDialog(isDialogOpen: Boolean, onDismiss: () -> Unit) {
    BackHandler(enabled = isDialogOpen) {
        onDismiss()
    }
}
```

### SideEffect i rememberCoroutineScope

```kotlin
// SideEffect — synchronizacja stanu Compose z kodem spoza Compose.
// Wywoływany po każdej UDANEJ rekomposycji.
@Composable
fun AnalyticsScreen(screenName: String, tracker: AnalyticsTracker) {
    SideEffect {
        tracker.setCurrentScreen(screenName)
    }
}

// rememberCoroutineScope — scope powiązany z kompozycją,
// używany gdy potrzebujesz uruchomić coroutine z handlera zdarzeń (onClick itp.)
@Composable
fun SaveButton(onSave: suspend () -> Unit) {
    val scope = rememberCoroutineScope()
    var isSaving by remember { mutableStateOf(false) }

    Button(
        onClick = {
            scope.launch {           // ← uruchom coroutine z onClick (nie LaunchedEffect)
                isSaving = true
                onSave()
                isSaving = false
            }
        },
        enabled = !isSaving
    ) {
        if (isSaving) CircularProgressIndicator(modifier = Modifier.size(18.dp))
        else Text("Zapisz")
    }
}
```

| API | Kiedy używać |
|---|---|
| `LaunchedEffect(key)` | Coroutine reagująca na zmianę stanu, automatycznie anulowana |
| `DisposableEffect(key)` | Efekty wymagające `onDispose` (listenery, callbacki) |
| `SideEffect` | Synchronizacja z kodem poza Compose po każdej kompozycji |
| `rememberCoroutineScope` | Coroutine odpalona z handlera UI (np. onClick) |

---

## Niestandardowe layouty

Gdy standardowe `Column`, `Row`, `Box` nie wystarczają, możesz zbudować własny layout za pomocą kompozycji `Layout`.

### Layout composable

```kotlin
// Własny layout — dzieci ułożone w siatce kaskadowej (waterfall/staggered)
@Composable
fun StaggeredGrid(
    columns: Int = 2,
    modifier: Modifier = Modifier,
    content: @Composable () -> Unit
) {
    Layout(
        content = content,
        modifier = modifier
    ) { measurables, constraints ->
        val columnWidth  = constraints.maxWidth / columns
        val colConstraints = constraints.copy(minWidth = 0, maxWidth = columnWidth)

        // 1. Zmierz wszystkie dzieci
        val placeables = measurables.map { it.measure(colConstraints) }

        // 2. Oblicz wysokości kolumn
        val columnHeights = IntArray(columns) { 0 }
        placeables.forEachIndexed { index, placeable ->
            columnHeights[index % columns] += placeable.height
        }

        val totalHeight = columnHeights.max().coerceIn(constraints.minHeight, constraints.maxHeight)

        // 3. Ułóż dzieci
        layout(constraints.maxWidth, totalHeight) {
            val colY = IntArray(columns) { 0 }
            placeables.forEachIndexed { index, placeable ->
                val col = index % columns
                placeable.placeRelative(
                    x = col * columnWidth,
                    y = colY[col]
                )
                colY[col] += placeable.height
            }
        }
    }
}

// Użycie
@Composable
fun PhotoGallery(photos: List<Photo>) {
    StaggeredGrid(columns = 2, modifier = Modifier.padding(4.dp)) {
        photos.forEach { photo ->
            AsyncImage(
                model = photo.url,
                contentDescription = photo.description,
                modifier = Modifier.padding(4.dp).fillMaxWidth()
            )
        }
    }
}
```

### Intrinsic measurements

`IntrinsicSize` pozwala zapytać dzieci o ich "naturalny" rozmiar przed finalnym pomiarze — przydatne gdy chcesz np. wyrównać wysokości elementów w `Row`.

```kotlin
// Problem: jak sprawić, żeby Divider miał taką samą wysokość jak najwyższy element Row?
@Composable
fun TwoTextsWithDivider(text1: String, text2: String) {
    Row(
        modifier = Modifier
            .height(IntrinsicSize.Min)  // ← Row przyjmuje wysokość najwyższego dziecka
            .fillMaxWidth()
    ) {
        Text(
            text1,
            modifier = Modifier
                .weight(1f)
                .wrapContentHeight(Alignment.CenterVertically)
        )
        // Divider automatycznie rozciągnie się na pełną wysokość Row
        HorizontalDivider(
            modifier = Modifier
                .fillMaxHeight()
                .width(1.dp)
        )
        Text(
            text2,
            modifier = Modifier
                .weight(1f)
                .wrapContentHeight(Alignment.CenterVertically)
        )
    }
}

// IntrinsicSize.Max — Row przyjmuje wysokość najwyższego możliwego dziecka
// IntrinsicSize.Min — Row przyjmuje minimalną potrzebną wysokość
```

### Własny Modifier z drawWithContent

```kotlin
// Modifier rysujący badge z liczbą powiadomień na komponencie
fun Modifier.notificationBadge(count: Int): Modifier = this.drawWithContent {
    drawContent()
    if (count > 0) {
        val badgeRadius = 10.dp.toPx()
        val badgeX = size.width - badgeRadius
        val badgeY = badgeRadius
        drawCircle(color = Color.Red, radius = badgeRadius, center = Offset(badgeX, badgeY))
        drawContext.canvas.nativeCanvas.drawText(
            count.coerceAtMost(99).toString(),
            badgeX,
            badgeY + 4.dp.toPx(),
            android.graphics.Paint().apply {
                color = android.graphics.Color.WHITE
                textSize = 10.dp.toPx()
                textAlign = android.graphics.Paint.Align.CENTER
            }
        )
    }
}

// Użycie
IconButton(modifier = Modifier.notificationBadge(unreadCount)) {
    Icon(Icons.Default.Notifications, contentDescription = "Powiadomienia")
}
```

---

## Testy w Compose

Compose udostępnia dedykowane API do testów UI bazujące na semantyce komponentów, a nie ich pozycji na ekranie.

### Zależności

```kotlin
// build.gradle.kts
androidTestImplementation("androidx.compose.ui:ui-test-junit4")
debugImplementation("androidx.compose.ui:ui-test-manifest")
```

### ComposeTestRule i podstawowe asercje

```kotlin
@RunWith(AndroidJUnit4::class)
class TaskListScreenTest {

    @get:Rule
    val composeTestRule = createComposeRule()
    // createAndroidComposeRule<MainActivity>() — gdy potrzebujesz Activity

    @Test
    fun taskList_displaysTasksCorrectly() {
        val tasks = listOf(
            Task(id = "1", title = "Zrobić zakupy",  isDone = false),
            Task(id = "2", title = "Napisać raport", isDone = true)
        )

        composeTestRule.setContent {
            MyAppTheme {
                TaskListContent(
                    tasks     = tasks,
                    isLoading = false,
                    onTaskToggle = {},
                    onTaskDelete = {},
                    onAddTask    = {}
                )
            }
        }

        // Asercje na podstawie tekstu
        composeTestRule.onNodeWithText("Zrobić zakupy").assertIsDisplayed()
        composeTestRule.onNodeWithText("Napisać raport").assertIsDisplayed()

        // Asercja na podstawie contentDescription
        composeTestRule.onNodeWithContentDescription("Ukończone zadanie").assertIsDisplayed()
    }

    @Test
    fun addButton_navigatesToAddScreen() {
        var addClicked = false

        composeTestRule.setContent {
            MyAppTheme {
                TaskListContent(
                    tasks        = emptyList(),
                    isLoading    = false,
                    onTaskToggle = {},
                    onTaskDelete = {},
                    onAddTask    = { addClicked = true }
                )
            }
        }

        composeTestRule.onNodeWithContentDescription("Dodaj zadanie").performClick()
        assertTrue(addClicked)
    }

    @Test
    fun loadingState_showsProgressIndicator() {
        composeTestRule.setContent {
            MyAppTheme {
                TaskListContent(
                    tasks        = emptyList(),
                    isLoading    = true,
                    onTaskToggle = {},
                    onTaskDelete = {},
                    onAddTask    = {}
                )
            }
        }

        composeTestRule.onNodeWithTag("loading_indicator").assertIsDisplayed()
        composeTestRule.onNodeWithText("Brak zadań").assertDoesNotExist()
    }
}
```

### Semantyka i własne węzły testowe

```kotlin
// Dodanie testTag i semantyki do komponentów
@Composable
fun TaskCard(task: Task, onToggle: () -> Unit) {
    Card(
        modifier = Modifier
            .fillMaxWidth()
            .semantics {
                contentDescription = if (task.isDone) "Ukończone: ${task.title}"
                                     else "Oczekujące: ${task.title}"
            }
    ) {
        Row(modifier = Modifier.padding(16.dp)) {
            Text(task.title, modifier = Modifier.weight(1f))
            Checkbox(
                checked  = task.isDone,
                onCheckedChange = { onToggle() },
                modifier = Modifier.testTag("checkbox_${task.id}")
            )
        }
    }
}

// Testowanie interakcji z checkboxem
@Test
fun checkbox_togglesTaskState() {
    var toggled = false
    val task = Task(id = "1", title = "Testowe zadanie", isDone = false)

    composeTestRule.setContent {
        MyAppTheme { TaskCard(task = task, onToggle = { toggled = true }) }
    }

    composeTestRule.onNodeWithTag("checkbox_1").performClick()
    assertTrue(toggled)
}

// Testowanie przewijania listy
@Test
fun lazyColumn_scrollsToItem() {
    val tasks = List(50) { Task(id = "$it", title = "Zadanie $it", isDone = false) }

    composeTestRule.setContent {
        LazyColumn { items(tasks, key = { it.id }) { TaskCard(it, {}) } }
    }

    composeTestRule.onNodeWithText("Zadanie 49")
        .performScrollTo()
        .assertIsDisplayed()
}
```

| Selektor | Opis |
|---|---|
| `onNodeWithText("...")` | Szukaj po widocznym tekście |
| `onNodeWithContentDescription("...")` | Szukaj po accessibility description |
| `onNodeWithTag("...")` | Szukaj po `Modifier.testTag(...)` |
| `onAllNodesWithTag("...")` | Zwróć wiele węzłów |
| `onNode(hasText("...") and isEnabled())` | Złożone warunki wyszukiwania |

---

## Compose + Room (Flow)

Room zwraca `Flow<T>` z zapytań — Compose może subskrybować ten strumień bezpośrednio, automatycznie aktualizując UI przy każdej zmianie w bazie danych.

### Definicja DAO z Flow

```kotlin
@Dao
interface TaskDao {
    // Flow — zapytanie reaktywne, emituje nowe wyniki przy każdej zmianie tabeli
    @Query("SELECT * FROM tasks ORDER BY createdAt DESC")
    fun getAllTasks(): Flow<List<TaskEntity>>

    @Query("SELECT * FROM tasks WHERE id = :id")
    fun getTaskById(id: String): Flow<TaskEntity?>

    @Query("SELECT * FROM tasks WHERE isDone = :isDone ORDER BY createdAt DESC")
    fun getTasksByStatus(isDone: Boolean): Flow<List<TaskEntity>>

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertTask(task: TaskEntity)

    @Update
    suspend fun updateTask(task: TaskEntity)

    @Delete
    suspend fun deleteTask(task: TaskEntity)
}
```

### Repository i UseCase

```kotlin
class TaskRepository @Inject constructor(private val taskDao: TaskDao) {

    fun getAllTasks(): Flow<List<Task>> =
        taskDao.getAllTasks()
            .map { entities -> entities.map { it.toDomain() } }  // mapowanie na model domeny
            .flowOn(Dispatchers.IO)                               // DAO na wątku IO

    fun getTaskById(id: String): Flow<Task?> =
        taskDao.getTaskById(id).map { it?.toDomain() }.flowOn(Dispatchers.IO)

    suspend fun saveTask(task: Task) = withContext(Dispatchers.IO) {
        taskDao.insertTask(task.toEntity())
    }
}
```

### ViewModel ze StateFlow z Room

```kotlin
@HiltViewModel
class TaskViewModel @Inject constructor(
    private val repository: TaskRepository
) : ViewModel() {

    // stateIn konwertuje Flow<T> na StateFlow<T> — ma aktualną wartość (value)
    val tasks: StateFlow<List<Task>> = repository
        .getAllTasks()
        .stateIn(
            scope          = viewModelScope,
            started        = SharingStarted.WhileSubscribed(5_000), // zatrzymaj 5s po ostatnim obserwatorze
            initialValue   = emptyList()
        )

    // Złożony UiState łączący wiele strumieni
    val uiState: StateFlow<TaskUiState> = combine(
        repository.getAllTasks(),
        repository.getAllTasks().map { it.count { t -> t.isDone } }
    ) { tasks, doneCount ->
        TaskUiState(
            tasks       = tasks,
            doneCount   = doneCount,
            pendingCount = tasks.size - doneCount,
            isLoading   = false
        )
    }.stateIn(
        scope        = viewModelScope,
        started      = SharingStarted.WhileSubscribed(5_000),
        initialValue = TaskUiState(isLoading = true)
    )

    fun addTask(title: String) {
        viewModelScope.launch {
            repository.saveTask(Task(id = UUID.randomUUID().toString(), title = title))
        }
    }
}
```

### Compose — collectAsStateWithLifecycle

```kotlin
// collectAsStateWithLifecycle — bezpieczna subskrypcja uwzględniająca cykl życia
// (zatrzymuje kolekcję gdy aplikacja jest w tle — oszczędza zasoby)
@Composable
fun TaskListScreen(viewModel: TaskViewModel = hiltViewModel()) {

    // ✅ Zalecane — uwzględnia lifecycle
    val uiState by viewModel.uiState.collectAsStateWithLifecycle()

    // ⚠️ Możliwe, ale zbiera też gdy app jest w tle
    // val uiState by viewModel.uiState.collectAsState()

    Scaffold(
        floatingActionButton = {
            FloatingActionButton(onClick = { /* otwórz dialog */ }) {
                Icon(Icons.Default.Add, contentDescription = "Dodaj zadanie")
            }
        }
    ) { padding ->
        when {
            uiState.isLoading -> {
                Box(modifier = Modifier.fillMaxSize(), contentAlignment = Alignment.Center) {
                    CircularProgressIndicator(modifier = Modifier.testTag("loading_indicator"))
                }
            }
            uiState.tasks.isEmpty() -> {
                Box(modifier = Modifier.fillMaxSize(), contentAlignment = Alignment.Center) {
                    Text("Brak zadań", style = MaterialTheme.typography.bodyLarge)
                }
            }
            else -> {
                Column(modifier = Modifier.padding(padding)) {
                    // Pasek statystyk
                    TaskSummaryBar(
                        done    = uiState.doneCount,
                        pending = uiState.pendingCount
                    )
                    // Lista reaktywna — automatycznie aktualizuje się przy zmianach w Room
                    LazyColumn(
                        contentPadding = PaddingValues(16.dp),
                        verticalArrangement = Arrangement.spacedBy(8.dp)
                    ) {
                        items(uiState.tasks, key = { it.id }) { task ->
                            TaskCard(task = task, modifier = Modifier.animateItem())
                        }
                    }
                }
            }
        }
    }
}
```

### Schemat przepływu danych Room → Compose

```
Room (SQLite)
    │  Flow<List<TaskEntity>>
    ▼
TaskDao.getAllTasks()
    │  Flow<List<Task>>  (map na model domeny)
    ▼
TaskRepository
    │  StateFlow<TaskUiState>  (stateIn + combine)
    ▼
TaskViewModel
    │  collectAsStateWithLifecycle()
    ▼
Compose UI  ← automatyczna rekomposycja przy każdej zmianie w bazie
```

---

## Linki

- [Compose Docs](https://developer.android.com/develop/ui/compose/documentation)
- [Compose Layouts](https://developer.android.com/develop/ui/compose/layouts)
- [Compose State](https://developer.android.com/develop/ui/compose/state)
- [Compose Animations](https://developer.android.com/develop/ui/compose/animation/introduction)
- [Compose Navigation](https://developer.android.com/develop/ui/compose/navigation)
- [Compose Side Effects](https://developer.android.com/develop/ui/compose/side-effects)
- [Compose Testing](https://developer.android.com/develop/ui/compose/testing)
- [Room with Compose](https://developer.android.com/training/data-storage/room)
