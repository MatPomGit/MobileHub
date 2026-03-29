# Gesty i interakcje dotykowe

Ekran dotykowy to główny interfejs urządzenia mobilnego. Dobrze zaprojektowane gesty są intuicyjne i niedostrzegalne — użytkownik po prostu robi to, co chce, bez zastanawiania się nad mechaniką.

## Podstawowe gesty

| Gest | Akcja | Przykład użycia |
|------|-------|----------------|
| **Tap** | Pojedyncze stuknięcie | Kliknięcie przycisku, otwieranie |
| **Double Tap** | Podwójne stuknięcie | Zoom, like (Instagram) |
| **Long Press** | Przytrzymanie ~0.5s | Menu kontekstowe, drag start |
| **Swipe** | Przesunięcie w kierunku | Cofnięcie, usunięcie, nawigacja |
| **Drag** | Przeciąganie | Reorder list, slider |
| **Pinch** | Ściągnięcie/rozkroczenie dwóch palców | Zoom in/out |
| **Rotate** | Obrót dwóch palców | Obracanie mapy/zdjęcia |

## Compose — Gesty

Jetpack Compose dostarcza gotowych detektorów gestów, które można łatwo podłączyć do dowolnego komponentu za pomocą modyfikatora `pointerInput`. Dzięki nim obsługa tapnięć, długiego przytrzymania czy przeciągania sprowadza się do kilku linii kodu. Poniższy przykład pokazuje, jak wykrywać różne typy gestów oraz zaimplementować mechanizm „swipe to dismiss" na karcie zadania.

```kotlin
// Detectory gestów
Box(
    modifier = Modifier
        .fillMaxSize()
        .pointerInput(Unit) {
            detectTapGestures(
                onTap = { offset -> handleTap(offset) },
                onDoubleTap = { offset -> handleDoubleTap(offset) },
                onLongPress = { offset -> showContextMenu(offset) }
            )
        }
        .pointerInput(Unit) {
            detectDragGestures(
                onDragStart = { offset -> dragStart = offset },
                onDrag = { change, dragAmount ->
                    change.consume()
                    position += dragAmount
                },
                onDragEnd = { onDragEnd() }
            )
        }
)

// Przeciąganie karty — swipe to dismiss
val dismissState = rememberSwipeToDismissBoxState(
    confirmValueChange = { value ->
        if (value == SwipeToDismissBoxValue.EndToStart) {
            onDelete()
        }
        true
    }
)

SwipeToDismissBox(
    state = dismissState,
    backgroundContent = {
        Box(
            modifier = Modifier
                .fillMaxSize()
                .background(Color.Red),
            contentAlignment = Alignment.CenterEnd
        ) {
            Icon(Icons.Default.Delete, contentDescription = "Usuń",
                tint = Color.White, modifier = Modifier.padding(16.dp))
        }
    }
) {
    TaskCard(task = task)
}
```

## Transformacje — pinch to zoom

Obsługa gestów wielodotykowych, takich jak powiększanie (pinch-to-zoom) czy obracanie, wymaga śledzenia wielu punktów dotykowych jednocześnie. Compose upraszcza ten proces dzięki funkcji `detectTransformGestures`, która zwraca zagregowane wartości zoomu, przesunięcia i obrotu. Poniższy przykład pokazuje komponent obrazu reagującego na wszystkie trzy rodzaje transformacji.

```kotlin
@Composable
fun ZoomableImage(painter: Painter) {
    var scale by remember { mutableFloatStateOf(1f) }
    var offset by remember { mutableStateOf(Offset.Zero) }
    var rotation by remember { mutableFloatStateOf(0f) }

    Image(
        painter = painter,
        contentDescription = null,
        modifier = Modifier
            .fillMaxSize()
            .graphicsLayer {
                scaleX = scale
                scaleY = scale
                translationX = offset.x
                translationY = offset.y
                rotationZ = rotation
            }
            .pointerInput(Unit) {
                detectTransformGestures { centroid, pan, zoom, rotate ->
                    scale = (scale * zoom).coerceIn(0.5f, 5f)
                    rotation += rotate
                    offset += pan
                }
            }
    )
}
```

## Haptic Feedback — sprzężenie dotykowe

Wibracyjne sprzężenie zwrotne (haptic feedback) poprawia odczucie interakcji, dając użytkownikowi potwierdzenie dotykowe po wykonaniu akcji. Odpowiednio dobrana haptyka sprawia, że aplikacja czuje się bardziej responsywna i dopracowana. Poniżej przykład przycisku z feedbackiem haptycznym oraz omówienie dostępnych typów wibracji.

```kotlin
@Composable
fun HapticButton(onClick: () -> Unit, content: @Composable () -> Unit) {
    val haptics = LocalHapticFeedback.current

    Button(
        onClick = {
            haptics.performHapticFeedback(HapticFeedbackType.LongPress)
            onClick()
        }
    ) { content() }
}

// Typy haptyki
HapticFeedbackType.LongPress       // standardowe kliknięcie
HapticFeedbackType.TextHandleMove  // przesuwanie kursora tekstu
// Dla zaawansowanej haptyki użyj VibrationEffect (API 26+)
```

## Cel dotyku — minimalne rozmiary

Zgodnie z Material Design 3 i WCAG, minimalny obszar dotyku to **48×48 dp**:

```kotlin
// Element 24dp ikony powiększony do 48dp obszaru dotyku
Icon(
    imageVector = Icons.Default.Close,
    contentDescription = "Zamknij",
    modifier = Modifier
        .size(24.dp)
        .padding(12.dp)  // BŁĄD — zmniejsza obszar

// POPRAWNIE
IconButton(
    onClick = { onClose() },
    modifier = Modifier.size(48.dp)  // Minimum 48dp
) {
    Icon(
        imageVector = Icons.Default.Close,
        contentDescription = "Zamknij",
        modifier = Modifier.size(24.dp)
    )
}
```

## Linki

- [Gestures — Compose](https://developer.android.com/compose/touch-input/gestures)
- [Material 3 Touch Targets](https://m3.material.io/foundations/accessible-design/accessibility-basics)
- [Haptic Feedback](https://developer.android.com/develop/ui/views/haptics)

## Nestedscroll — koordynacja przewijania

W złożonych layoutach z wieloma przewijalnymi sekcjami konieczna jest koordynacja przewijania między komponentami rodzica i potomka. Mechanizm `NestedScroll` w Compose pozwala przekazywać zdarzenia scroll do właściwego komponentu zgodnie z zdefiniowaną logiką. Poniższy przykład demonstruje zwijający się pasek aplikacji (collapsing toolbar) oraz implementację własnego `NestedScrollConnection`.

```kotlin
// Skoordynowane przewijanie: rozwijanie/zwijanie paska przy scrollu
@Composable
fun CollapsingToolbarLayout(
    title: String,
    content: @Composable () -> Unit
) {
    val scrollBehavior = TopAppBarDefaults.exitUntilCollapsedScrollBehavior()

    Scaffold(
        modifier = Modifier.nestedScroll(scrollBehavior.nestedScrollConnection),
        topBar = {
            LargeTopAppBar(
                title = { Text(title) },
                scrollBehavior = scrollBehavior
            )
        }
    ) { padding ->
        Column(modifier = Modifier.padding(padding)) {
            content()
        }
    }
}

// Custom NestedScrollConnection — własna logika
val nestedScrollConnection = object : NestedScrollConnection {
    override fun onPreScroll(available: Offset, source: NestedScrollSource): Offset {
        // Przechwytuj scroll przed przekazaniem do potomka
        val delta = available.y
        val newToolbarHeight = (toolbarHeight + delta).coerceIn(minHeight, maxHeight)
        val consumed = newToolbarHeight - toolbarHeight
        toolbarHeight = newToolbarHeight
        return Offset(0f, consumed)
    }
}
```

## Pull-to-Refresh

Gest „przeciągnij, aby odświeżyć" (pull-to-refresh) to powszechnie stosowany wzorzec UX umożliwiający użytkownikowi ręczne odświeżenie zawartości listy. Material 3 dostarcza gotowy komponent `PullToRefreshContainer`, który integruje się bezpośrednio z `NestedScroll`. Poniższy przykład pokazuje kompletną implementację z ViewModelem sterującym stanem ładowania.

```kotlin
@Composable
fun RefreshableContent(
    viewModel: ContentViewModel
) {
    val isRefreshing by viewModel.isRefreshing.collectAsStateWithLifecycle()
    val pullRefreshState = rememberPullToRefreshState()

    Box(modifier = Modifier.nestedScroll(pullRefreshState.nestedScrollConnection)) {
        LazyColumn {
            items(viewModel.items) { item ->
                ItemCard(item)
            }
        }

        PullToRefreshContainer(
            state = pullRefreshState,
            modifier = Modifier.align(Alignment.TopCenter)
        )
    }

    LaunchedEffect(pullRefreshState.isRefreshing) {
        if (pullRefreshState.isRefreshing) {
            viewModel.refresh()
        }
    }

    LaunchedEffect(isRefreshing) {
        if (!isRefreshing) {
            pullRefreshState.endRefresh()
        }
    }
}
```

## Drag and Drop — reorder listy

Możliwość ręcznego sortowania elementów listy metodą „przeciągnij i upuść" znacząco poprawia użyteczność aplikacji do zarządzania zadaniami czy playlistami. Biblioteka `ComposeReorderable` dostarcza gotową integrację z `LazyColumn`, obsługując animacje i zmianę indeksów. Poniższy przykład implementuje przewijalną listę zadań z ikoną uchwytu do przeciągania.

```kotlin
@Composable
fun ReorderableTaskList(
    tasks: List<Task>,
    onReorder: (from: Int, to: Int) -> Unit
) {
    val lazyListState = rememberLazyListState()
    val reorderState = rememberReorderableLazyListState(
        lazyListState = lazyListState,
        onMove = { from, to -> onReorder(from.index, to.index) }
    )

    LazyColumn(state = lazyListState) {
        itemsIndexed(tasks, key = { _, task -> task.id }) { index, task ->
            ReorderableItem(reorderState, key = task.id) { isDragging ->
                val elevation by animateDpAsState(if (isDragging) 8.dp else 0.dp)

                Card(
                    modifier = Modifier
                        .fillMaxWidth()
                        .shadow(elevation)
                ) {
                    Row(
                        modifier = Modifier.padding(16.dp),
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Icon(
                            imageVector = Icons.Default.DragHandle,
                            contentDescription = "Przeciągnij aby zmienić kolejność",
                            modifier = Modifier.detectReorder(reorderState)
                        )
                        Text(task.title, modifier = Modifier.weight(1f).padding(start = 12.dp))
                    }
                }
            }
        }
    }
}
```

## Linki dodatkowe

- [NestedScroll](https://developer.android.com/reference/kotlin/androidx/compose/ui/input/nestedscroll/package-summary)
- [PullToRefresh](https://developer.android.com/reference/kotlin/androidx/compose/material3/pulltorefresh/package-summary)
- [Reorderable](https://github.com/aclassen/ComposeReorderable)
