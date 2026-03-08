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

## Linki

- [Compose Docs](https://developer.android.com/develop/ui/compose/documentation)
- [Compose Layouts](https://developer.android.com/develop/ui/compose/layouts)
- [Compose State](https://developer.android.com/develop/ui/compose/state)
- [Compose Animations](https://developer.android.com/develop/ui/compose/animation/introduction)
