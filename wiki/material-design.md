# Material Design 3 — System Projektowania Google

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
