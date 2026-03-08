# Metody Interakcji i Projektowanie UI/UX

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
