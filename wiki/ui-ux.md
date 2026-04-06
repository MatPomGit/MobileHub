# Metody interakcji i projektowanie UI/UX

Interfejs mobilny różni się fundamentalnie od desktopowego. Brak myszy i klawiatury, ekran dotykowy, zmienny kontekst użycia (stanie w autobusie, słońce, jedna ręka) — to wszystko wymaga innego podejścia do projektowania interakcji.

## Gesty dotykowe

### Podstawowe gesty

| Gest | Angielska nazwa | Typowe zastosowanie |
|------|-----------------|---------------------|
| Tap | Tap | Wybranie elementu, przycisk |
| Długie przytrzymanie | Long press | Menu kontekstowe, selekcja |
| Przesunięcie | Swipe | Nawigacja między ekranami, usuwanie |
| Pinch/Spread | Pinch to zoom | Powiększanie mapy/zdjęcia |
| Obrót | Rotate | Obracanie obiektów |
| Przeciągnij i upuść | Drag & Drop | Reorganizacja list |
| Podwójne tap | Double tap | Powiększenie, like |

### Gesty nawigacyjne Android

```
Gestura wstecz: Przesunięcie od lewej/prawej krawędzi
Gestura home: Przesunięcie od dołu
App switcher: Przesunięcie od dołu i przytrzymanie
```

Od Android 10 Google przeszedł z nawigacji 3-przyciskowej na gestową, zbliżoną do iOS.

## Wzorce UX specyficzne dla Mobile

### Pull-to-Refresh
Przeciągnięcie listy w dół odświeża zawartość. Wynaleziony przez Loren Brichter (Tweetie, 2008). Jeden z niewielu gestów, który użytkownicy rozumieją intuicyjnie bez instrukcji.

```kotlin
// Jetpack Compose: SwipeRefresh
var refreshing by remember { mutableStateOf(false) }

SwipeRefresh(
    state = rememberSwipeRefreshState(refreshing),
    onRefresh = { viewModel.refresh() }
) {
    LazyColumn { /* lista */ }
}
```

### Infinite Scroll / Lazy Loading
Treść ładuje się automatycznie gdy użytkownik zbliża się do końca listy. Wzorzec stosowany przez social media.

```kotlin
val listState = rememberLazyListState()

LazyColumn(state = listState) {
    items(items) { item ->
        ItemRow(item)
    }
}

// Wykryj zbliżenie do końca
val endReached by remember {
    derivedStateOf {
        listState.layoutInfo.visibleItemsInfo.lastOrNull()?.index == 
        listState.layoutInfo.totalItemsCount - 1
    }
}
```

### Bottom Sheet
Panel wysuwający się od dołu ekranu. Stosowany do: filtrów, ustawień, detali obiektu, potwierdzenia akcji.

```kotlin
val sheetState = rememberModalBottomSheetState()

ModalBottomSheet(
    onDismissRequest = { /* zamknij */ },
    sheetState = sheetState
) {
    // treść panelu
}
```

### Snackbar zamiast modali
Zamiast blokujących alertów (modali) stosuj nieblokujące Snackbary z możliwością akcji:

```kotlin
val snackbarHostState = remember { SnackbarHostState() }
scope.launch {
    val result = snackbarHostState.showSnackbar(
        message = "Element usunięty",
        actionLabel = "Cofnij",
        duration = SnackbarDuration.Short
    )
    if (result == SnackbarResult.ActionPerformed) {
        viewModel.undoDelete()
    }
}
```

## Dostępność (Accessibility)

Dostępność nie jest opcjonalna. W Polsce ok. 12% populacji ma jakieś niepełnosprawność, a wielu użytkowników starszych lub czasowo w trudnych warunkach (jedno zajęte ręce, jasne słońce) korzysta z funkcji dostępności.

### TalkBack / VoiceOver
Czytniki ekranu odczytują zawartość na głos. Wymagają odpowiednich etykiet:

```kotlin
// Opis zawartości
Icon(
    imageVector = Icons.Default.Favorite,
    contentDescription = "Dodaj do ulubionych" // NIE null!
)

// Grupowanie semantyczne
Column(
    modifier = Modifier.semantics(mergeDescendants = true) {}
) {
    Text("Produkt A")
    Text("29,99 zł")
    Text("Dostępny")
}
```

### Minimalny rozmiar dotyku
```kotlin
Modifier
    .size(48.dp) // minimalne 48dp wg Material Design
    .clickable { /* akcja */ }
```

### Kontrast kolorów
Używaj narzędzia [Contrast Checker](https://webaim.org/resources/contrastchecker/) do weryfikacji.

## Mikro-animacje

Animacje nie są tylko ozdobą — komunikują stan systemu i przyczynowość:

```kotlin
// Animowana widoczność
AnimatedVisibility(
    visible = isVisible,
    enter = fadeIn() + slideInVertically(),
    exit = fadeOut() + slideOutVertically()
) {
    Card { /* zawartość */ }
}

// Animacja wartości
val progress by animateFloatAsState(
    targetValue = if (loading) 1f else 0f,
    animationSpec = spring(dampingRatio = Spring.DampingRatioMediumBouncy)
)
```

**Zasady dobrych animacji mobilnych:**
- Czas trwania: 150–350 ms (krótsze = responsywność, dłuższe = elegancja)
- Nie animuj więcej niż 3 właściwości jednocześnie
- Używaj łagodnych krzywych (easing), nie liniowych
- Respektuj `prefers-reduced-motion` / `ANIMATOR_DURATION_SCALE`

## Onboarding

Pierwsze uruchomienie aplikacji to krytyczny moment. Wzorce:

1. **Benefits onboarding** — "Co możesz zrobić z aplikacją" (3–5 slajdów)
2. **Progressive disclosure** — funkcje są ujawniane stopniowo, wraz z użyciem
3. **Blank state** — pusty stan z instrukcją co zrobić jako pierwsze
4. **Permissions rationale** — wyjaśnij PRZED poproszeniem o uprawnienia

```kotlin
// Wyjaśnienie przed uprawnieniem do lokalizacji
if (shouldShowRequestPermissionRationale(Manifest.permission.ACCESS_FINE_LOCATION)) {
    // Pokaż dialog wyjaśniający dlaczego potrzebujesz lokalizacji
    showLocationRationaleDialog()
} else {
    requestLocationPermission()
}
```

## Linki

- [Google Material Design — Interaction](https://m3.material.io/foundations/interaction/states/overview)
- [Apple HIG — Gestures](https://developer.apple.com/design/human-interface-guidelines/gestures)
- [Nielsen Norman Group — Mobile UX](https://www.nngroup.com/topic/mobile-ux/)

## Onboarding — pierwsze uruchomienie

Pierwsze wrażenie decyduje o retencji. Skuteczny onboarding wyjaśnia wartość aplikacji zanim poprosi o cokolwiek.

```kotlin
@Composable
fun OnboardingScreen(onFinish: () -> Unit) {
    val pages = listOf(
        OnboardingPage("Organizuj zadania", "Twórz listy i śledź postępy w jednym miejscu", R.drawable.onboarding_1),
        OnboardingPage("Przypomnienia", "Nigdy nie zapomnij o ważnym terminie", R.drawable.onboarding_2),
        OnboardingPage("Praca zespołowa", "Udostępniaj listy i współpracuj z innymi", R.drawable.onboarding_3)
    )
    val pagerState = rememberPagerState { pages.size }
    val scope = rememberCoroutineScope()

    Column(modifier = Modifier.fillMaxSize()) {
        HorizontalPager(state = pagerState, modifier = Modifier.weight(1f)) { page ->
            OnboardingPageContent(pages[page])
        }

        Row(
            modifier = Modifier.fillMaxWidth().padding(24.dp),
            horizontalArrangement = Arrangement.SpaceBetween,
            verticalAlignment = Alignment.CenterVertically
        ) {
            // Wskaźniki kropkowe
            Row(horizontalArrangement = Arrangement.spacedBy(6.dp)) {
                repeat(pages.size) { index ->
                    Box(
                        modifier = Modifier
                            .size(if (pagerState.currentPage == index) 20.dp else 8.dp, 8.dp)
                            .background(
                                if (pagerState.currentPage == index) MaterialTheme.colorScheme.primary
                                else MaterialTheme.colorScheme.outline.copy(0.3f),
                                CircleShape
                            )
                    )
                }
            }

            Button(
                onClick = {
                    if (pagerState.currentPage < pages.size - 1) {
                        scope.launch { pagerState.animateScrollToPage(pagerState.currentPage + 1) }
                    } else {
                        onFinish()
                    }
                }
            ) {
                Text(if (pagerState.currentPage < pages.size - 1) "Dalej" else "Zaczynamy!")
            }
        }
    }
}
```

## Micro-interactions — animacje stanu

```kotlin
// Like button z animacją
@Composable
fun LikeButton(isLiked: Boolean, count: Int, onToggle: () -> Unit) {
    val scale by animateFloatAsState(
        targetValue = 1f,
        animationSpec = spring(dampingRatio = Spring.DampingRatioMediumBouncy),
        label = "scale"
    )

    Row(
        modifier = Modifier.clickable(
            interactionSource = remember { MutableInteractionSource() },
            indication = null  // brak ripple — własna animacja
        ) {
            onToggle()
        },
        verticalAlignment = Alignment.CenterVertically,
        horizontalArrangement = Arrangement.spacedBy(4.dp)
    ) {
        Icon(
            imageVector = if (isLiked) Icons.Default.Favorite else Icons.Default.FavoriteBorder,
            contentDescription = "Polub",
            tint = if (isLiked) Color(0xFFE91E63) else MaterialTheme.colorScheme.onSurface.copy(0.6f),
            modifier = Modifier.scale(scale).size(20.dp)
        )
        AnimatedContent(targetState = count, transitionSpec = {
            slideInVertically { -it } togetherWith slideOutVertically { it }
        }) { c ->
            Text("$c", style = MaterialTheme.typography.labelMedium)
        }
    }
}
```

## Linki dodatkowe

- [UX Patterns for Mobile](https://m3.material.io/patterns)
- [Compose Animation](https://developer.android.com/jetpack/compose/animation/introduction)
- [Nielsen Heuristics](https://www.nngroup.com/articles/ten-usability-heuristics/)

## Metryki UX — pomiar jakości aplikacji

Dobry design to nie tylko estetyka — to mierzalne efekty. Do podstawowych wskaźników jakości aplikacji mobilnej należą:

| Metryka | Opis | Cel |
|---|---|---|
| **DAU/MAU** | Daily/Monthly Active Users — stosunek mierzy „lepkość" aplikacji | > 20% |
| **Retention D1/D7/D30** | % użytkowników wracających po 1, 7 i 30 dniach | D1 > 40%, D30 > 10% |
| **Crash-free sessions** | % sesji bez awarii | > 99,5% |
| **ANR rate** | Application Not Responding — zamrożenia > 5 s | < 0,47% (próg Play Store) |
| **Screen load time** | Czas do pierwszej interaktywnej klatki | < 300 ms |

### Firebase Analytics — śledzenie przepływów

Firebase Analytics pozwala rejestrować zdarzenia i analizować ścieżki użytkowników (funnel). Integracja w Kotlin:

```kotlin
// build.gradle.kts
implementation("com.google.firebase:firebase-analytics-ktx:21.5.0")

// Logowanie zdarzenia z parametrami
class OnboardingScreen {
    private val analytics = Firebase.analytics

    fun onStepCompleted(step: Int, name: String) {
        analytics.logEvent("onboarding_step_completed") {
            param("step_number", step.toLong())
            param("step_name", name)
            param(FirebaseAnalytics.Param.METHOD, "tap")
        }
    }

    fun onOnboardingFinished(durationMs: Long) {
        analytics.logEvent(FirebaseAnalytics.Event.TUTORIAL_COMPLETE) {
            param("duration_ms", durationMs)
        }
    }
}
```

Zdarzenia pojawiają się w konsoli Firebase → DebugView w ciągu kilku sekund. Dla analizy lejkowej (funnel) definiuje się serię zdarzeń: `screen_view("welcome")` → `sign_up_start` → `sign_up_complete`. Firebase liczy % użytkowników przechodzących przez każdy krok, co pozwala zidentyfikować miejsca porzucenia procesu rejestracji.

Ważne jest ustawianie właściwości użytkownika (`setUserProperty`), np. `plan: "premium"`, by segmentować kohorty i porównywać retencję grup. Łącząc Firebase Analytics z BigQuery (export), można budować niestandardowe dashboardy i korelować metryki UX z przychodami.

## A/B testy i feature flags

Testy A/B pozwalają podejmować decyzje projektowe oparte na danych zamiast intuicji. **Firebase Remote Config** umożliwia zarówno zarządzanie flagami funkcji, jak i prowadzenie eksperymentów.

### Konfiguracja Remote Config

```kotlin
// Pobranie wartości z Remote Config
val remoteConfig = Firebase.remoteConfig
remoteConfig.setDefaultsAsync(
    mapOf(
        "checkout_button_color" to "blue",
        "show_promo_banner" to false,
        "max_items_in_cart" to 20L
    )
)

// Odświeżenie z serwerem (cache 1 h w produkcji, 0 s w debug)
remoteConfig.fetchAndActivate().addOnCompleteListener { task ->
    if (task.isSuccessful) {
        val buttonColor = remoteConfig.getString("checkout_button_color")
        val showBanner = remoteConfig.getBoolean("show_promo_banner")
        applyConfig(buttonColor, showBanner)
    }
}
```

### Eksperyment A/B w Firebase Console

1. Firebase Console → Remote Config → **Create experiment**
2. Definiujemy warianty: `control` (niebieski przycisk) vs `variant_a` (zielony przycisk)
3. Wybieramy cel: `purchase` event jako metryka sukcesu
4. Ustalamy podział ruchu: 50/50 lub stopniowy rollout (5% → 20% → 100%)
5. Po zebraniu wystarczającej próby (zazwyczaj 1–2 tygodnie) Firebase wskazuje wariant z istotną statystycznie poprawą

**Stopniowy rollout** to osobna technika — wdrażamy nową funkcję dla 5% użytkowników, monitorujemy crash-free rate i ANR, a następnie zwiększamy procent. Flaga `new_navigation: true` dla 5% pozwala wycofać zmianę bez wydawania nowej wersji aplikacji.

Warto zapamiętać: nigdy nie testuj więcej niż jednej zmiennej jednocześnie w tym samym eksperymencie, bo nie będziesz w stanie ustalić, co spowodowało zmianę metryki.

## Wzorce błędów i stany pustych list

Każda aplikacja musi obsługiwać trzy stany poza „happy path": **pusty stan**, **ładowanie** i **błąd**. Pominięcie któregokolwiek z nich skutkuje zdezorientowanym użytkownikiem.

### Empty state i skeleton loading w Compose

```kotlin
// Skeleton loading — efekt shimmer
@Composable
fun ShimmerCard(modifier: Modifier = Modifier) {
    val infiniteTransition = rememberInfiniteTransition(label = "shimmer")
    val alpha by infiniteTransition.animateFloat(
        initialValue = 0.2f, targetValue = 0.9f,
        animationSpec = infiniteRepeatable(
            animation = tween(900, easing = LinearEasing),
            repeatMode = RepeatMode.Reverse
        ), label = "alpha"
    )
    Box(
        modifier
            .fillMaxWidth()
            .height(80.dp)
            .clip(RoundedCornerShape(12.dp))
            .background(MaterialTheme.colorScheme.surfaceVariant.copy(alpha = alpha))
    )
}

// Empty state z ikoną i CTA
@Composable
fun EmptyListState(onRetry: () -> Unit) {
    Column(
        Modifier.fillMaxSize(),
        horizontalAlignment = Alignment.CenterHorizontally,
        verticalArrangement = Arrangement.Center
    ) {
        Icon(
            Icons.Outlined.SearchOff, contentDescription = null,
            modifier = Modifier.size(72.dp),
            tint = MaterialTheme.colorScheme.outline
        )
        Spacer(Modifier.height(16.dp))
        Text("Brak wyników", style = MaterialTheme.typography.titleMedium)
        Text(
            "Spróbuj zmienić filtry lub wróć później.",
            style = MaterialTheme.typography.bodyMedium,
            color = MaterialTheme.colorScheme.onSurfaceVariant,
            textAlign = TextAlign.Center,
            modifier = Modifier.padding(horizontal = 32.dp)
        )
        Spacer(Modifier.height(24.dp))
        Button(onClick = onRetry) { Text("Odśwież") }
    }
}

// Kompletny ekran uwzględniający wszystkie stany
@Composable
fun ProductListScreen(viewModel: ProductViewModel = hiltViewModel()) {
    val uiState by viewModel.uiState.collectAsStateWithLifecycle()
    when (uiState) {
        is UiState.Loading -> repeat(5) { ShimmerCard(Modifier.padding(horizontal = 16.dp, vertical = 6.dp)) }
        is UiState.Empty   -> EmptyListState(onRetry = viewModel::reload)
        is UiState.Error   -> ErrorState(message = uiState.message, onRetry = viewModel::reload)
        is UiState.Success -> LazyColumn { items(uiState.data) { ProductRow(it) } }
    }
}
```

Stan błędu (`ErrorState`) powinien zawierać czytelny komunikat (nie „Error 500"), opcję ponowienia akcji oraz — jeśli to możliwe — informację o trybie offline z ostatnimi danymi z cache. Użytkownicy wybaczają błędy, jeśli aplikacja zachowuje się przewidywalnie i daje im kontrolę.
