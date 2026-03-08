# Dostępność Aplikacji Mobilnych

Dostępność (accessibility) to projektowanie i programowanie aplikacji w sposób umożliwiający korzystanie z niej osobom z różnymi niepełnosprawnościami — wzrokowymi, słuchowymi, motorycznymi i poznawczymi. Dobra dostępność to też lepsze UX dla wszystkich: seniorów, użytkowników w trudnych warunkach, osób z tymczasową niepełnosprawnością.

## Dlaczego dostępność jest ważna

- **~15% populacji** ma jakiś rodzaj niepełnosprawności (WHO)
- **Prawo**: UE wymaga dostępności aplikacji publicznych (EN 301 549), iOS App Store preferuje dostępne aplikacje
- **Lepsza jakość kodu**: wymuszanie dostępności często naprawia problemy architektoniczne
- **SEO efekt**: TalkBack/VoiceOver używają tych samych mechanizmów co wyszukiwarki (opisy alternatywne)

## TalkBack (Android) — Screen Reader

TalkBack to wbudowany czytnik ekranu Android. Użytkownik porusza się po interfejsie pojedynczymi tapnięciami — czytnik odczytuje każdy element na głos.

```kotlin
// ContentDescription — opis dla czytnika (zamiast "ikona z ikonką kosza")
Icon(
    imageVector = Icons.Default.Delete,
    contentDescription = "Usuń zadanie ${task.title}",  // konkretny, nie ogólny
    tint = MaterialTheme.colorScheme.error
)

// null = element dekoracyjny, ignorowany przez TalkBack
Icon(
    imageVector = Icons.Default.CheckCircle,
    contentDescription = null,   // ikona obok widocznego tekstu — zbędne powtarzanie
    tint = Color.Green
)

// Scalanie elementów — karta jako jeden element zamiast wielu
TaskCard(
    task = task,
    modifier = Modifier.semantics(mergeDescendants = true) {}  // scala dzieci w jeden węzeł
)

// CustomDescendant — własna etykieta dla złożonego elementu
Column(
    modifier = Modifier.semantics(mergeDescendants = true) {
        contentDescription = "Zadanie: ${task.title}, ${if (task.isDone) "ukończone" else "nieukończone"}, " +
            "termin: ${task.dueDate?.formatShort() ?: "brak terminu"}"
    }
) {
    // Wizualna zawartość karty...
}
```

## Semantics API — pełna kontrola

```kotlin
// Role — typ elementu dla czytnika
Button(
    onClick = { submit() },
    modifier = Modifier.semantics { role = Role.Button }
) {
    Text("Zapisz")
}

// Stan — informacja o aktualnym stanie
Switch(
    checked = isEnabled,
    onCheckedChange = { toggle() },
    modifier = Modifier.semantics {
        // Compose robi to automatycznie dla Switch, ale można nadpisać
        stateDescription = if (isEnabled) "włączone" else "wyłączone"
    }
)

// LiveRegion — automatyczne ogłaszanie zmian
var statusMessage by remember { mutableStateOf("") }
Text(
    text = statusMessage,
    modifier = Modifier.semantics {
        liveRegion = LiveRegionMode.Polite  // Polite = dokończ najpierw to co czyta
        // Assertive = przerwij i ogłoś od razu (dla krytycznych błędów)
    }
)

// Nagłówki — struktura dokumentu dla czytnika
Text(
    text = "Moje zadania",
    style = MaterialTheme.typography.headlineMedium,
    modifier = Modifier.semantics { heading() }  // czytnik może skakać między nagłówkami
)

// Customowe akcje — zamiast "przytrzymaj dla menu"
TaskCard(
    modifier = Modifier.semantics {
        customActions = listOf(
            CustomAccessibilityAction("Edytuj zadanie") { editTask(); true },
            CustomAccessibilityAction("Usuń zadanie") { deleteTask(); true },
            CustomAccessibilityAction("Oznacz jako ukończone") { toggleTask(); true },
        )
    }
)
```

## Rozmiar tekstu i dynamiczne skalowanie

```kotlin
// Skalowanie tekstu — NIE blokuj
Text(
    text = "Treść",
    style = MaterialTheme.typography.bodyLarge,
    // textScaleFactor pochodzi z ustawień systemowych — nie hardkoduj!
    // NIE: fontSize = 16.sp.times(1f)  ← blokuje skalowanie
)

// Testuj przy textSize = 200% (ustawienia systemowe)
// Sprawdź czy tekst nie jest obcięty, nie nakłada się, nie wychodzi poza ekran

// Maksymalne skalowanie dla małych elementów
Text(
    text = "etykieta",
    modifier = Modifier.semantics {
        // Jeśli text MUSI być obcięty, użyj elipsy
    },
    maxLines = 1,
    overflow = TextOverflow.Ellipsis,
    style = LocalTextStyle.current.copy(
        // Ogranicz maksymalne skalowanie dla kompaktowych elementów
        fontSize = with(LocalDensity.current) {
            14.sp.toPx().coerceAtMost(20.dp.toPx()).toSp()
        }
    )
)
```

## Kontrast kolorów

WCAG 2.1 wymagania:
- **AA**: kontrast ≥ 4.5:1 dla normalnego tekstu, ≥ 3:1 dla dużego (≥18sp)
- **AAA**: kontrast ≥ 7:1 dla normalnego, ≥ 4.5:1 dla dużego

```kotlin
// Sprawdź kontrast programowo
fun contrastRatio(foreground: Color, background: Color): Double {
    val lFg = relativeLuminance(foreground)
    val lBg = relativeLuminance(background)
    val lighter = maxOf(lFg, lBg)
    val darker = minOf(lFg, lBg)
    return (lighter + 0.05) / (darker + 0.05)
}

fun relativeLuminance(color: Color): Double {
    fun linearize(c: Float) = if (c <= 0.04045f) c / 12.92f else ((c + 0.055f) / 1.055f).pow(2.4f)
    return 0.2126 * linearize(color.red) + 0.7152 * linearize(color.green) + 0.0722 * linearize(color.blue)
}

// MD3 domyślna paleta automatycznie spełnia AA
// Unikaj: jasny szary tekst na białym tle, pastelowe kolory na białym
```

## Fokus klawiatury i D-Pad (TV, foldables)

```kotlin
// Kolejność nawigacji klawiaturą/D-padem
Column {
    TextField(
        value = email,
        onValueChange = { email = it },
        keyboardOptions = KeyboardOptions(imeAction = ImeAction.Next),
        keyboardActions = KeyboardActions(onNext = { focusManager.moveFocus(FocusDirection.Down) }),
        modifier = Modifier.focusRequester(emailFocus)
    )
    TextField(
        value = password,
        onValueChange = { password = it },
        keyboardOptions = KeyboardOptions(imeAction = ImeAction.Done),
        keyboardActions = KeyboardActions(onDone = { submit() }),
        modifier = Modifier.focusRequester(passwordFocus)
    )
}

// Wymuś fokus na otwarcie ekranu
LaunchedEffect(Unit) {
    delay(100)
    emailFocus.requestFocus()
}

// Fokus ring — widoczny wskaźnik fokusu
Modifier.indication(
    interactionSource = remember { MutableInteractionSource() },
    indication = LocalIndication.current
)
```

## Tryb wysokiego kontrastu i monochromatyczny

```kotlin
// Reaguj na preferencje systemowe
@Composable
fun AccessibleTheme(content: @Composable () -> Unit) {
    val uiModeManager = LocalContext.current.getSystemService(UI_MODE_SERVICE) as UiModeManager

    // Android 13+: Force Dark Override
    val isHighContrast = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.UPSIDE_DOWN_CAKE) {
        uiModeManager.contrast >= 0.5f
    } else false

    // Dostosuj kolory dla trybu wysokiego kontrastu
    val colors = if (isHighContrast) {
        if (isSystemInDarkTheme()) HighContrastDarkColors else HighContrastLightColors
    } else {
        // Standardowa paleta
        if (isSystemInDarkTheme()) AppDarkColorScheme else AppLightColorScheme
    }

    MaterialTheme(colorScheme = colors, content = content)
}
```

## Testowanie dostępności

```kotlin
// Automatyczne testy semantics
@Test
fun taskCard_hasCorrectAccessibilityLabel() {
    val task = Task(title = "Kup mleko", isDone = false, dueDate = tomorrow)
    composeTestRule.setContent { TaskCard(task = task, ...) }

    composeTestRule.onNodeWithContentDescription(
        "Zadanie: Kup mleko, nieukończone, termin: jutro",
        useUnmergedTree = false
    ).assertExists()
}

@Test
fun buttons_meetMinimumTouchTarget() {
    composeTestRule.setContent { MyScreen() }
    composeTestRule.onAllNodes(hasClickAction()).fetchSemanticsNodes().forEach { node ->
        val bounds = node.boundsInWindow
        assert(bounds.width >= 48.dp.value && bounds.height >= 48.dp.value) {
            "Przycisk za mały: ${bounds.width}×${bounds.height}dp"
        }
    }
}
```

**Manualne testy:**
1. Włącz TalkBack (Ustawienia → Dostępność → TalkBack) i nawiguj bez patrzenia na ekran
2. Ustaw rozmiar czcionki na 200% — sprawdź czy UI działa
3. Włącz tryb wysokiego kontrastu — sprawdź czytelność
4. Testuj z D-padem lub klawiaturą — czy fokus się prawidłowo przemieszcza?

## Linki

- [Accessibility in Compose](https://developer.android.com/develop/ui/compose/accessibility)
- [WCAG 2.1](https://www.w3.org/WAI/WCAG21/quickref/)
- [Android Accessibility Suite](https://play.google.com/store/apps/details?id=com.google.android.marvin.talkback)
- [Accessibility Scanner](https://play.google.com/store/apps/details?id=com.google.android.apps.accessibility.auditor)
