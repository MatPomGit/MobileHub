# Material Design 3 — system projektowania google

Material Design 3 (Material You) to trzecia generacja systemu projektowania Google, wprowadzona wraz z Androidem 12. Definiuje dynamiczne kolory dopasowujące się do tapety, nowy system typografii i zaktualizowane komponenty.

## Dynamic Color — personalizacja systemu

Flagowa nowość MD3: paleta kolorów generowana dynamicznie z tapety urządzenia:

```kotlin
// Sprawdź wsparcie (wymaga API 31+)
val supportsDynamic = Build.VERSION.SDK_INT >= Build.VERSION_CODES.S

@Composable
fun AppTheme(
    darkTheme: Boolean = isSystemInDarkTheme(),
    dynamicColor: Boolean = true,
    content: @Composable () -> Unit
) {
    val colorScheme = when {
        dynamicColor && supportsDynamic && darkTheme ->
            dynamicDarkColorScheme(LocalContext.current)
        dynamicColor && supportsDynamic ->
            dynamicLightColorScheme(LocalContext.current)
        darkTheme -> AppDarkColorScheme
        else      -> AppLightColorScheme
    }

    MaterialTheme(
        colorScheme = colorScheme,
        typography = AppTypography,
        shapes = AppShapes,
        content = content
    )
}

// Statyczna paleta jako fallback (starsze urządzenia lub własny branding)
val AppLightColorScheme = lightColorScheme(
    primary          = Color(0xFF5B4FCF),
    onPrimary        = Color(0xFFFFFFFF),
    primaryContainer = Color(0xFFE9DFFF),
    onPrimaryContainer = Color(0xFF190061),
    secondary        = Color(0xFF605C71),
    onSecondary      = Color(0xFFFFFFFF),
    secondaryContainer = Color(0xFFE6DFF9),
    tertiary         = Color(0xFF7D5260),
    error            = Color(0xFFB3261E),
    surface          = Color(0xFFFEF7FF),
    background       = Color(0xFFFEF7FF),
    outline          = Color(0xFF79747E),
)
```

## Tokeny kolorów — Roles

MD3 definiuje **role** kolorów, nie nazwy. Każda rola ma swoje "on-" odpowiedniki:

```
primary              → główne CTA, przyciski, link
onPrimary            → tekst/ikona NA primary
primaryContainer     → mniej intensywny wariant (tła kart)
onPrimaryContainer   → tekst NA primaryContainer

surface              → tło ekranu, kart, dialogów
surfaceVariant       → nieco intensywniejsze tło (inputy)
onSurface            → główny tekst
onSurfaceVariant     → drugorzędny tekst, etykiety

error                → błędy
errorContainer       → tło komunikatu błędu

outline              → obramowania inputów, dividerów
outlineVariant       → delikatniejsze obramowania
```

```kotlin
// Użycie ról w Compose
Card(
    colors = CardDefaults.cardColors(
        containerColor = MaterialTheme.colorScheme.primaryContainer
    )
) {
    Text(
        text = "Kategoria",
        color = MaterialTheme.colorScheme.onPrimaryContainer,
        style = MaterialTheme.typography.labelLarge
    )
}
```

## Komponenty MD3 — przegląd i użycie

### Przyciski

```kotlin
// MD3 ma 5 wariantów przycisków — wybieraj przez hierarchię ważności
Column(verticalArrangement = Arrangement.spacedBy(8.dp)) {
    // Filled — główna akcja ekranu (jeden na ekran)
    Button(onClick = { submit() }) { Text("Zapisz") }

    // Filled Tonal — drugorzędna ważna akcja
    FilledTonalButton(onClick = { draft() }) { Text("Zapisz szkic") }

    // Outlined — działanie alternatywne
    OutlinedButton(onClick = { cancel() }) { Text("Anuluj") }

    // Text — najmniej ważne działanie
    TextButton(onClick = { learnMore() }) { Text("Dowiedz się więcej") }

    // Elevated — action buttons pływające nad treścią
    ElevatedButton(onClick = { filter() }) { Text("Filtry") }

    // FAB — Floating Action Button — główna akcja całego ekranu
    FloatingActionButton(
        onClick = { createNew() },
        containerColor = MaterialTheme.colorScheme.primaryContainer
    ) {
        Icon(Icons.Default.Add, contentDescription = "Dodaj")
    }
}
```

### Navigation Bar i Navigation Rail

```kotlin
// Navigation Bar — telefony (bottom)
NavigationBar {
    navItems.forEach { item ->
        val selected = currentRoute == item.route
        NavigationBarItem(
            selected = selected,
            onClick = { navController.navigate(item.route) {
                launchSingleTop = true; restoreState = true
            }},
            icon = {
                BadgedBox(badge = {
                    if (item.badgeCount > 0) Badge { Text(item.badgeCount.toString()) }
                }) {
                    Icon(if (selected) item.selectedIcon else item.icon, item.label)
                }
            },
            label = { Text(item.label) }
        )
    }
}

// Navigation Rail — tablety i foldables (side)
NavigationRail(
    header = {
        FloatingActionButton(onClick = { createNew() }) {
            Icon(Icons.Default.Add, "Nowy")
        }
    }
) {
    navItems.forEach { item ->
        NavigationRailItem(
            selected = currentRoute == item.route,
            onClick = { navController.navigate(item.route) },
            icon = { Icon(if (currentRoute == item.route) item.selectedIcon else item.icon, item.label) },
            label = { Text(item.label) }
        )
    }
}
```

### Cards

```kotlin
// Filled Card — najmocniejszy akcent
Card(
    modifier = Modifier.fillMaxWidth(),
    colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surfaceVariant)
) { content() }

// Outlined Card — delikatne obramowanie
OutlinedCard(modifier = Modifier.fillMaxWidth()) { content() }

// Elevated Card — cień zamiast koloru
ElevatedCard(
    modifier = Modifier.fillMaxWidth(),
    elevation = CardDefaults.elevatedCardElevation(defaultElevation = 6.dp)
) { content() }
```

### Text Fields

```kotlin
// Filled TextField — standardowy wybór
var text by remember { mutableStateOf("") }
var isError by remember { mutableStateOf(false) }

OutlinedTextField(
    value = text,
    onValueChange = { text = it; isError = it.isEmpty() },
    label = { Text("Email") },
    leadingIcon = { Icon(Icons.Default.Email, null) },
    trailingIcon = {
        if (text.isNotEmpty()) {
            IconButton(onClick = { text = "" }) {
                Icon(Icons.Default.Clear, "Wyczyść")
            }
        }
    },
    isError = isError,
    supportingText = {
        if (isError) Text("Pole wymagane", color = MaterialTheme.colorScheme.error)
        else Text("${text.length}/100", modifier = Modifier.fillMaxWidth(), textAlign = TextAlign.End)
    },
    keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Email, imeAction = ImeAction.Next),
    singleLine = true,
    modifier = Modifier.fillMaxWidth()
)
```

### Dialogs i Bottom Sheets

```kotlin
// AlertDialog — potwierdzenia, proste wybory
if (showDeleteDialog) {
    AlertDialog(
        onDismissRequest = { showDeleteDialog = false },
        icon = { Icon(Icons.Default.Delete, null, tint = MaterialTheme.colorScheme.error) },
        title = { Text("Usuń zadanie?") },
        text = { Text("Tej operacji nie można cofnąć.") },
        confirmButton = {
            Button(
                onClick = { viewModel.delete(); showDeleteDialog = false },
                colors = ButtonDefaults.buttonColors(containerColor = MaterialTheme.colorScheme.error)
            ) { Text("Usuń") }
        },
        dismissButton = {
            TextButton(onClick = { showDeleteDialog = false }) { Text("Anuluj") }
        }
    )
}

// ModalBottomSheet — rozbudowane opcje, pick-ery
val sheetState = rememberModalBottomSheetState(skipPartiallyExpanded = true)
if (showSheet) {
    ModalBottomSheet(
        onDismissRequest = { showSheet = false },
        sheetState = sheetState
    ) {
        Column(Modifier.padding(horizontal = 24.dp).padding(bottom = 32.dp)) {
            Text("Sortuj według", style = MaterialTheme.typography.titleMedium)
            Spacer(Modifier.height(16.dp))
            SortOptions.entries.forEach { option ->
                ListItem(
                    headlineContent = { Text(option.label) },
                    leadingContent = { RadioButton(selected = sortBy == option, onClick = { sortBy = option }) },
                    modifier = Modifier.clickable { sortBy = option }
                )
            }
        }
    }
}
```

## Kształty (Shapes)

MD3 wprowadza zaokrąglone, "przyjazne" kształty:

```kotlin
val AppShapes = Shapes(
    extraSmall = RoundedCornerShape(4.dp),   // małe tagi, badges
    small      = RoundedCornerShape(8.dp),   // przyciski, inputy
    medium     = RoundedCornerShape(12.dp),  // karty, dialogi
    large      = RoundedCornerShape(16.dp),  // bottom sheets
    extraLarge = RoundedCornerShape(28.dp),  // wielkie karty
)
```

## Linki

- [Material Design 3](https://m3.material.io)
- [Material Theme Builder](https://material-foundation.github.io/material-theme-builder/)
- [Compose Material 3](https://developer.android.com/jetpack/compose/designsystems/material3)
- [Material Symbols (ikony)](https://fonts.google.com/icons)

## Typografia w MD3

Material Design 3 definiuje precyzyjną **skalę typograficzną** (Type Scale) złożoną z pięciu rodzin ról, z których każda ma warianty rozmiaru: Large, Medium i Small. Dzięki temu projektant zawsze wie, których stylów użyć w zależności od hierarchii wizualnej.

| Rola | Użycie | Domyślny rozmiar |
|------|--------|-----------------|
| `displayLarge` | Tytuły hero, splash screen | 57 sp |
| `headlineLarge` | Nagłówki sekcji, ekranów | 32 sp |
| `titleLarge` | Pasek aplikacji (TopAppBar) | 22 sp |
| `titleMedium` | Nagłówki kart, list | 16 sp |
| `bodyLarge` | Główny tekst artykułów | 16 sp |
| `bodyMedium` | Standardowy tekst interfejsu | 14 sp |
| `labelLarge` | Etykiety przycisków | 14 sp |
| `labelSmall` | Etykiety chipów, badge | 11 sp |

Aby użyć własnego fontu z Google Fonts (np. **Nunito**) z funkcją _Downloadable Fonts_ (Android pobiera font przy pierwszym użyciu, bez bundlowania w APK):

```kotlin
// res/font/nunito.xml — deskryptor downloadable font
<?xml version="1.0" encoding="utf-8"?>
<font-family xmlns:app="http://schemas.android.com/apk/res-auto"
    app:fontProviderAuthority="com.google.android.gms.fonts"
    app:fontProviderPackage="com.google.android.gms"
    app:fontProviderQuery="Nunito"
    app:fontProviderCerts="@array/com_google_android_gms_fonts_certs" />

// W Compose — załaduj font i zbuduj Typography
val nunitoFamily = FontFamily(
    Font(R.font.nunito, weight = FontWeight.Normal),
    Font(R.font.nunito_medium, weight = FontWeight.Medium),
    Font(R.font.nunito_bold, weight = FontWeight.Bold)
)

val AppTypography = Typography(
    displayLarge  = TextStyle(fontFamily = nunitoFamily, fontWeight = FontWeight.Normal,
                              fontSize = 57.sp, lineHeight = 64.sp, letterSpacing = (-0.25).sp),
    headlineLarge = TextStyle(fontFamily = nunitoFamily, fontWeight = FontWeight.Bold,
                              fontSize = 32.sp, lineHeight = 40.sp),
    titleLarge    = TextStyle(fontFamily = nunitoFamily, fontWeight = FontWeight.Bold,
                              fontSize = 22.sp, lineHeight = 28.sp),
    bodyLarge     = TextStyle(fontFamily = nunitoFamily, fontWeight = FontWeight.Normal,
                              fontSize = 16.sp, lineHeight = 24.sp, letterSpacing = 0.5.sp),
    labelLarge    = TextStyle(fontFamily = nunitoFamily, fontWeight = FontWeight.Medium,
                              fontSize = 14.sp, lineHeight = 20.sp, letterSpacing = 0.1.sp),
)
```

Ważna kwestia dostępności: **nie blokuj skalowania fontów**. Użytkownicy ze słabym wzrokiem zwiększają rozmiar czcionek systemowych. Używaj jednostki `sp` (nie `dp`) dla tekstu oraz `wrapContentHeight` dla kontenerów, aby layout nie "łamał się" przy `fontScale = 1.5`.

```kotlin
// Testowanie dużych fontów w Compose Preview
@Preview(fontScale = 1.5f, name = "Large font")
@Composable
fun ItemCardPreview() { ItemCard(title = "Przykładowy tytuł zadania") }
```

## Adaptacyjne layouty — ekrany i foldables

Telefony składane (foldables) i tablety wymagają innego układu nawigacji niż smartfon. MD3 dostarcza klasę `WindowSizeClass` i komponent `NavigationSuiteScaffold`, które automatycznie dobierają właściwy wzorzec nawigacji do rozmiaru okna.

```kotlin
// build.gradle.kts
implementation("androidx.compose.material3:material3-adaptive-navigation-suite:1.3.0")
implementation("androidx.compose.material3:material3-adaptive:1.0.0")

// Główny ekran — adaptive navigation
@OptIn(ExperimentalMaterial3AdaptiveNavigationSuiteApi::class)
@Composable
fun AdaptiveApp() {
    val navController = rememberNavController()
    val currentRoute by navController.currentBackStackEntryAsState()

    // NavigationSuiteScaffold automatycznie wybiera:
    // - NavigationBar   (telefon — portrait)
    // - NavigationRail  (telefon — landscape / mały tablet)
    // - NavigationDrawer (duży tablet / desktop)
    NavigationSuiteScaffold(
        navigationSuiteItems = {
            TopLevelDest.entries.forEach { dest ->
                item(
                    icon = { Icon(if (currentRoute?.destination?.route == dest.route)
                                     dest.selectedIcon else dest.icon, null) },
                    label = { Text(dest.label) },
                    selected = currentRoute?.destination?.route == dest.route,
                    onClick = { navController.navigate(dest.route) {
                        launchSingleTop = true; restoreState = true
                    }}
                )
            }
        }
    ) {
        NavHost(navController, startDestination = TopLevelDest.HOME.route) {
            composable(TopLevelDest.HOME.route)     { HomeScreen() }
            composable(TopLevelDest.SEARCH.route)   { SearchScreen() }
            composable(TopLevelDest.PROFILE.route)  { ProfileScreen() }
        }
    }
}

// Dwupanelowy layout dla tabletu (lista + szczegóły)
@Composable
fun AdaptiveListDetail() {
    val navigator = rememberListDetailPaneScaffoldNavigator<String>()

    ListDetailPaneScaffold(
        directive = navigator.scaffoldDirective,
        value = navigator.scaffoldValue,
        listPane = {
            AnimatedPane {
                TaskListPane(
                    onTaskClick = { taskId ->
                        navigator.navigateTo(ListDetailPaneScaffoldRole.Detail, taskId)
                    }
                )
            }
        },
        detailPane = {
            AnimatedPane {
                val taskId = navigator.currentDestination?.content
                if (taskId != null) TaskDetailPane(taskId)
                else Box(Modifier.fillMaxSize(), Alignment.Center) {
                    Text("Wybierz zadanie z listy")
                }
            }
        }
    )
}
```

Na urządzeniach składanych `WindowSizeClass` zmienia się dynamicznie podczas rozkładania telefonu — Compose automatycznie przebudowuje UI, przełączając np. z jednej kolumny na dwie.

## Motion i przejścia — Motion System MD3

Material Design 3 definiuje cztery główne wzorce animacji przejść między ekranami, opisane w specyfikacji **Motion System**. W Compose Navigation animacje konfiguruje się parametrami `enterTransition`, `exitTransition` etc.

```kotlin
// build.gradle.kts
implementation("androidx.compose.animation:animation:1.7.0")

// Shared Axis — poruszanie się wzdłuż osi X/Y/Z (hierarchia ekranów)
fun NavGraphBuilder.sharedAxisComposable(
    route: String,
    content: @Composable AnimatedVisibilityScope.(NavBackStackEntry) -> Unit
) {
    composable(
        route = route,
        enterTransition = {
            slideInHorizontally(
                initialOffsetX = { it },
                animationSpec = tween(300, easing = FastOutSlowInEasing)
            ) + fadeIn(tween(300))
        },
        exitTransition = {
            slideOutHorizontally(
                targetOffsetX = { -it / 3 },
                animationSpec = tween(300, easing = FastOutSlowInEasing)
            ) + fadeOut(tween(150))
        },
        popEnterTransition = {
            slideInHorizontally(
                initialOffsetX = { -it / 3 },
                animationSpec = tween(300, easing = FastOutSlowInEasing)
            ) + fadeIn(tween(300))
        },
        popExitTransition = {
            slideOutHorizontally(
                targetOffsetX = { it },
                animationSpec = tween(300, easing = FastOutSlowInEasing)
            ) + fadeOut(tween(150))
        },
        content = content
    )
}

// Fade Through — przełączanie niezwiązanych widoków (np. zakładki nav bar)
val fadeThroughEnter = fadeIn(tween(210, delayMillis = 90)) +
    scaleIn(initialScale = 0.92f, animationSpec = tween(210, delayMillis = 90))
val fadeThroughExit = fadeOut(tween(90))

// Container Transform — element listy → szczegóły (Shared Element)
// Wymaga Compose 1.7+ i Material3 1.3+
@Composable
fun TaskCard(task: Task, onOpen: () -> Unit) {
    val interactionSource = remember { MutableInteractionSource() }
    ElevatedCard(
        onClick = onOpen,
        modifier = Modifier
            .sharedElement(                               // oznacz element jako "shared"
                rememberSharedContentState(key = "task-${task.id}"),
                animatedVisibilityScope = LocalAnimatedVisibilityScope.current!!
            )
    ) {
        Text(task.title, Modifier.padding(16.dp))
    }
}
```

Animacje w MD3 korzystają z krzywej `Emphasized` (niestandardowy cubic-bezier), która daje fizycznie realistyczne, szybko startujące i płynnie zwalniające ruchy. Unikaj `LinearEasing` — sprawia wrażenie mechanicznego i niezgodnego z systemem.
