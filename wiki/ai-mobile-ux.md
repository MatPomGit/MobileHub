# Projektowanie UX aplikacji z lokalną AI

## Streszczenie

Projektowanie doświadczeń użytkownika (UX) dla aplikacji mobilnych z lokalną AI wymaga odmiennego podejścia niż klasyczne aplikacje. Użytkownik musi rozumieć, co model robi, jak pewny jest swoich wyników i dlaczego czasem się myli - a wszystko to bez dostępu do internetu, z ograniczonymi zasobami urządzenia. Artykuł omawia wzorce UX specyficzne dla lokalnej AI: komunikowanie wnioskowania w toku, wskaźniki pewności, onboarding pobierania modelu, projektowanie offline-first, wyjaśnialność decyzji (XAI), dostępność, prywatność oraz testowanie użyteczności funkcji AI. Każde zagadnienie zilustrowane jest przykładami kodu w Jetpack Compose (Android) i SwiftUI (iOS).

**Słowa kluczowe:** UX, lokalna AI, on-device AI, confidence score, offline-first, Explainable AI, dostępność, prywatność, Material Design 3, iOS HIG, Jetpack Compose, SwiftUI

---

## 1. Specyfika UX w aplikacjach z lokalną AI

Lokalna AI wprowadza unikalne wyzwania projektowe, których nie ma w klasycznych aplikacjach mobilnych ani w aplikacjach korzystających z AI w chmurze.

### 1.1 Czym różni się UX lokalnej AI od cloud AI?

| Aspekt | Cloud AI | Lokalna AI |
|---|---|---|
| Latencja | Zmienna (sieć) | Przewidywalna (sprzęt) |
| Dostępność | Wymaga internetu | Działa offline |
| Rozmiar modelu | Nieograniczony | Kilka MB – kilka GB |
| Czas pierwszego użycia | Natychmiastowy | Wymaga pobrania/inicjalizacji |
| Prywatność danych | Dane wysyłane do serwera | Dane pozostają na urządzeniu |
| Aktualizacje modelu | Transparentne | Wymagają interakcji użytkownika |
| Koszt operacyjny | Per-zapytanie | Jednorazowy (pobranie) |

### 1.2 Trzy filary dobrego UX w lokalnej AI

1. **Transparentność** - użytkownik rozumie, że wynik pochodzi z modelu AI i zna jego pewność
2. **Kontrola** - użytkownik może odrzucić sugestię AI, poprawić wynik lub wyłączyć funkcję
3. **Zaufanie** - aplikacja uczciwie komunikuje ograniczenia, błędy i wymagania modelu

### 1.3 Mental model użytkownika

Użytkownicy często przypisują AI cechy ludzkie (antropomorfizacja). Dobre UX powinno:
- Unikać nadmiernego uczłowieczania (prowadzi do nieuzasadnionego zaufania)
- Jasno sygnalizować, że to algorytm, nie człowiek
- Wyjaśniać niepewność językiem zrozumiałym dla laika

---

## 2. Wzorce UX dla procesu wnioskowania

Wnioskowanie lokalne może trwać od kilkudziesięciu milisekund do kilku sekund. Użytkownik musi wiedzieć, że coś się dzieje.

### 2.1 Progressive disclosure wyników

Zamiast czekać na pełny wynik, pokazuj częściowe rezultaty w miarę ich dostępności - szczególnie ważne przy modelach LLM i segmentacji obrazu.

```kotlin
// Jetpack Compose - streaming wyników z modelu LLM
@Composable
fun StreamingResponseView(viewModel: AiViewModel) {
    val partialResult by viewModel.streamingText.collectAsState("")
    val isInferring by viewModel.isInferring.collectAsState(false)

    Column(modifier = Modifier.padding(16.dp)) {
        Text(
            text = partialResult,
            style = MaterialTheme.typography.bodyLarge
        )
        if (isInferring) {
            // Migający kursor sygnalizuje aktywne generowanie
            BlinkingCursor()
        }
    }
}

@Composable
fun BlinkingCursor() {
    val alpha by rememberInfiniteTransition(label = "cursor")
        .animateFloat(
            initialValue = 1f,
            targetValue = 0f,
            animationSpec = infiniteRepeatable(
                animation = tween(500),
                repeatMode = RepeatMode.Reverse
            ),
            label = "cursorAlpha"
        )
    Box(
        modifier = Modifier
            .size(2.dp, 18.dp)
            .alpha(alpha)
            .background(MaterialTheme.colorScheme.onSurface)
    )
}
```

```swift
// SwiftUI - streaming tekstu z lokalnego LLM
struct StreamingResponseView: View {
    @ObservedObject var viewModel: AiViewModel

    var body: some View {
        VStack(alignment: .leading) {
            Text(viewModel.partialResult)
                .font(.body)
                .animation(.default, value: viewModel.partialResult)

            if viewModel.isInferring {
                BlinkingCursorView()
            }
        }
        .padding()
    }
}

struct BlinkingCursorView: View {
    @State private var visible = true

    var body: some View {
        Rectangle()
            .frame(width: 2, height: 18)
            .opacity(visible ? 1 : 0)
            .onAppear {
                withAnimation(.easeInOut(duration: 0.5).repeatForever()) {
                    visible.toggle()
                }
            }
    }
}
```

### 2.2 Animacje ładowania modelu

Inicjalizacja modelu (ładowanie wag do pamięci) może trwać 1–5 sekund. Wymaga dedykowanego stanu UI.

```kotlin
// Jetpack Compose - stany UI dla cyklu życia modelu
sealed class ModelState {
    object NotLoaded : ModelState()
    data class Loading(val progress: Float) : ModelState()
    object Ready : ModelState()
    data class Error(val message: String) : ModelState()
}

@Composable
fun ModelStatusBanner(state: ModelState) {
    AnimatedVisibility(visible = state !is ModelState.Ready) {
        Surface(
            color = when (state) {
                is ModelState.Loading -> MaterialTheme.colorScheme.secondaryContainer
                is ModelState.Error   -> MaterialTheme.colorScheme.errorContainer
                else                  -> MaterialTheme.colorScheme.surfaceVariant
            },
            modifier = Modifier.fillMaxWidth()
        ) {
            Row(
                modifier = Modifier.padding(12.dp),
                verticalAlignment = Alignment.CenterVertically
            ) {
                when (state) {
                    is ModelState.Loading -> {
                        CircularProgressIndicator(
                            progress = { state.progress },
                            modifier = Modifier.size(20.dp),
                            strokeWidth = 2.dp
                        )
                        Spacer(Modifier.width(8.dp))
                        Text("Ładowanie modelu AI… ${(state.progress * 100).toInt()}%")
                    }
                    is ModelState.Error -> {
                        Icon(Icons.Default.Warning, contentDescription = null,
                            tint = MaterialTheme.colorScheme.error)
                        Spacer(Modifier.width(8.dp))
                        Text(state.message, color = MaterialTheme.colorScheme.error)
                    }
                    else -> {}
                }
            }
        }
    }
}
```

### 2.3 Skeleton screens dla wyników AI

Kiedy czas wnioskowania jest znany i ograniczony (np. klasyfikacja obrazu), stosuj skeleton screens zamiast spinnerów.

```kotlin
@Composable
fun ClassificationResultSkeleton() {
    val shimmerAlpha by rememberInfiniteTransition(label = "shimmer")
        .animateFloat(
            initialValue = 0.3f, targetValue = 0.9f,
            animationSpec = infiniteRepeatable(tween(1000), RepeatMode.Reverse),
            label = "shimmerAlpha"
        )

    Column(Modifier.padding(16.dp)) {
        repeat(3) {
            Row(
                Modifier
                    .fillMaxWidth()
                    .padding(vertical = 6.dp),
                verticalAlignment = Alignment.CenterVertically
            ) {
                Box(
                    Modifier
                        .size(80.dp, 12.dp)
                        .clip(RoundedCornerShape(6.dp))
                        .background(MaterialTheme.colorScheme.onSurface.copy(alpha = shimmerAlpha))
                )
                Spacer(Modifier.weight(1f))
                Box(
                    Modifier
                        .size(40.dp, 12.dp)
                        .clip(RoundedCornerShape(6.dp))
                        .background(MaterialTheme.colorScheme.onSurface.copy(alpha = shimmerAlpha))
                )
            }
        }
    }
}
```

---

## 3. Wskaźnik pewności (Confidence Score)

Modele klasyfikacyjne zwracają prawdopodobieństwo przynależności do klasy. Projektowanie UI dla confidence score to balans między informatywnością a zaufaniem.

### 3.1 Kiedy pokazywać confidence score?

| Sytuacja | Zalecenie |
|---|---|
| Wysoka pewność (> 90%) | Można ukryć - nie zaśmiecaj UI |
| Średnia pewność (60–90%) | Pokaż dyskretnie jako hint |
| Niska pewność (< 60%) | Zawsze pokaż + zaproponuj alternatywy |
| Dziedziny krytyczne (zdrowie, finanse) | Zawsze pokaż, nawet przy wysokiej pewności |

### 3.2 Wizualne reprezentacje pewności

```kotlin
// Jetpack Compose - komponent wskaźnika pewności
@Composable
fun ConfidenceBadge(confidence: Float, label: String) {
    val color = when {
        confidence >= 0.85f -> MaterialTheme.colorScheme.primary
        confidence >= 0.60f -> Color(0xFFF59E0B) // amber
        else                -> MaterialTheme.colorScheme.error
    }
    val confidenceText = "${(confidence * 100).toInt()}%"
    val semanticDesc = "Pewność wyniku: $confidenceText"

    Row(
        verticalAlignment = Alignment.CenterVertically,
        modifier = Modifier.semantics { contentDescription = "$label, $semanticDesc" }
    ) {
        Text(text = label, style = MaterialTheme.typography.bodyMedium)
        Spacer(Modifier.width(8.dp))
        Surface(
            color = color.copy(alpha = 0.15f),
            shape = RoundedCornerShape(12.dp)
        ) {
            Row(
                modifier = Modifier.padding(horizontal = 8.dp, vertical = 3.dp),
                verticalAlignment = Alignment.CenterVertically
            ) {
                Canvas(Modifier.size(6.dp)) {
                    drawCircle(color)
                }
                Spacer(Modifier.width(4.dp))
                Text(
                    text = confidenceText,
                    style = MaterialTheme.typography.labelSmall,
                    color = color
                )
            }
        }
    }
}
```

```swift
// SwiftUI - pasek pewności z etykietą słowną
struct ConfidenceBar: View {
    let confidence: Float
    let label: String

    private var color: Color {
        switch confidence {
        case 0.85...: return .green
        case 0.60...: return .orange
        default:      return .red
        }
    }

    private var verboseLabel: String {
        switch confidence {
        case 0.85...: return "Wysoka pewność"
        case 0.60...: return "Średnia pewność"
        default:      return "Niska pewność"
        }
    }

    var body: some View {
        VStack(alignment: .leading, spacing: 4) {
            HStack {
                Text(label).font(.body)
                Spacer()
                Text("\(Int(confidence * 100))%")
                    .font(.caption.bold())
                    .foregroundColor(color)
            }
            GeometryReader { geo in
                ZStack(alignment: .leading) {
                    Capsule().fill(Color.secondary.opacity(0.2))
                        .frame(height: 6)
                    Capsule().fill(color)
                        .frame(width: geo.size.width * CGFloat(confidence), height: 6)
                        .animation(.spring(), value: confidence)
                }
            }
            .frame(height: 6)
        }
        .accessibilityElement(children: .ignore)
        .accessibilityLabel("\(label). \(verboseLabel): \(Int(confidence * 100)) procent")
    }
}
```

### 3.3 Alternatywy przy niskiej pewności

Gdy model jest niepewny, zaproponuj użytkownikowi alternatywy zamiast jednego wyniku:

```kotlin
@Composable
fun TopKResults(results: List<ClassificationResult>) {
    Column {
        Text("Możliwe wyniki:", style = MaterialTheme.typography.titleSmall,
            modifier = Modifier.padding(bottom = 8.dp))
        results.forEachIndexed { index, result ->
            val isTopResult = index == 0
            Card(
                colors = CardDefaults.cardColors(
                    containerColor = if (isTopResult)
                        MaterialTheme.colorScheme.primaryContainer
                    else
                        MaterialTheme.colorScheme.surfaceVariant
                ),
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(vertical = 4.dp)
            ) {
                Row(
                    Modifier.padding(12.dp),
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Text(result.label, Modifier.weight(1f))
                    ConfidenceBadge(result.score, "")
                }
            }
        }
    }
}
```

---

## 4. Obsługa błędów i przypadków brzegowych

Modele AI mogą zawieść na wiele sposobów: zły typ wejścia, przekroczenie zasobów, uszkodzone wagi, nieznana klasa.

### 4.1 Taksonomia błędów AI

| Typ błędu | Przykład | Reakcja UX |
|---|---|---|
| Błąd inicjalizacji | Brak pamięci na model | Onboarding, zwolnienie zasobów |
| Błąd wejścia | Rozmazany obraz, szum | Poproś o lepsze dane wejściowe |
| Niska pewność | Wynik < 30% | Pokaż alternatywy, poproś o potwierdzenie |
| Timeout wnioskowania | Model zbyt wolny | Pokaż wynik cząstkowy lub przerwij |
| Out-of-distribution | Nieznana klasa | „Nie rozpoznaję - spróbuj ponownie" |
| Błąd sprzętowy | NPU niedostępny, fallback na CPU | Poinformuj o spowolnieniu |

### 4.2 Przyjazne komunikaty błędów

```kotlin
// Jetpack Compose - komponent obsługi błędów AI
@Composable
fun AiErrorState(
    error: AiError,
    onRetry: () -> Unit,
    onFallback: (() -> Unit)? = null
) {
    Column(
        horizontalAlignment = Alignment.CenterHorizontally,
        modifier = Modifier.padding(24.dp)
    ) {
        Icon(
            imageVector = when (error) {
                is AiError.LowConfidence   -> Icons.Default.HelpOutline
                is AiError.InputQuality    -> Icons.Default.ImageSearch
                is AiError.ModelInit       -> Icons.Default.Memory
                is AiError.Timeout         -> Icons.Default.Timer
                else                       -> Icons.Default.ErrorOutline
            },
            contentDescription = null,
            modifier = Modifier.size(48.dp),
            tint = MaterialTheme.colorScheme.onSurfaceVariant
        )
        Spacer(Modifier.height(16.dp))
        Text(
            text = error.userFriendlyMessage(),
            style = MaterialTheme.typography.bodyLarge,
            textAlign = TextAlign.Center
        )
        Spacer(Modifier.height(24.dp))
        Button(onClick = onRetry) { Text("Spróbuj ponownie") }
        if (onFallback != null) {
            TextButton(onClick = onFallback) {
                Text("Wprowadź ręcznie")
            }
        }
    }
}

fun AiError.userFriendlyMessage() = when (this) {
    is AiError.LowConfidence ->
        "Nie jestem pewien wyniku. Spróbuj z lepszym zdjęciem lub zatwierdź ręcznie."
    is AiError.InputQuality ->
        "Zdjęcie jest zbyt rozmazane lub słabo oświetlone. Spróbuj ponownie."
    is AiError.ModelInit ->
        "Nie udało się załadować modelu AI. Sprawdź dostępną pamięć urządzenia."
    is AiError.Timeout ->
        "Analiza trwa zbyt długo. Urządzenie może być przeciążone - spróbuj za chwilę."
    else -> "Wystąpił nieoczekiwany błąd. Spróbuj ponownie."
}
```

### 4.3 Graceful degradation

Zawsze oferuj ścieżkę bez AI jako fallback:

```swift
// SwiftUI - widok z opcją manualnego fallbacku
struct SmartInputField: View {
    @State private var useAI = true
    @State private var aiResult: String? = nil
    @State private var manualInput = ""

    var body: some View {
        VStack(alignment: .leading, spacing: 12) {
            if useAI, let result = aiResult {
                AISuggestionCard(suggestion: result) {
                    manualInput = result   // zaakceptuj sugestię AI
                } onReject: {
                    useAI = false          // przejdź do trybu ręcznego
                }
            } else {
                TextField("Wpisz ręcznie…", text: $manualInput)
                    .textFieldStyle(.roundedBorder)
                if !useAI {
                    Button("Spróbuj z AI") { useAI = true }
                        .font(.caption)
                }
            }
        }
    }
}
```

---

## 5. Projektowanie offline-first

Lokalna AI jest z natury offline-first, ale aplikacja może potrzebować sieci do innych funkcji. Projektowanie musi jasno określać, co działa bez internetu.

### 5.1 Strategie offline

| Strategia | Opis | Kiedy stosować |
|---|---|---|
| Full offline | Wszystkie funkcje AI działają bez sieci | Model jednorazowo pobrany, nie wymaga aktualizacji |
| Graceful degradation | Podstawowe AI działa, zaawansowane wymaga sieci | Hybrydowe modele local+cloud |
| Cache-first | Wyniki z cache, odświeżane gdy jest sieć | Modele aktualizowane regularnie |
| Offline indicator | Pasek informujący o trybie offline | Zawsze - użytkownik musi wiedzieć |

### 5.2 Indykator trybu sieciowego

```kotlin
// Jetpack Compose - NetworkAwareBanner
@Composable
fun NetworkAwareBanner(isOnline: Boolean, hasLocalModel: Boolean) {
    AnimatedVisibility(
        visible = !isOnline,
        enter = slideInVertically() + fadeIn(),
        exit = slideOutVertically() + fadeOut()
    ) {
        Surface(
            color = if (hasLocalModel)
                MaterialTheme.colorScheme.secondaryContainer
            else
                MaterialTheme.colorScheme.errorContainer,
            modifier = Modifier.fillMaxWidth()
        ) {
            Row(
                Modifier.padding(horizontal = 16.dp, vertical = 10.dp),
                verticalAlignment = Alignment.CenterVertically
            ) {
                Icon(
                    imageVector = if (hasLocalModel) Icons.Default.WifiOff
                                  else Icons.Default.CloudOff,
                    contentDescription = null,
                    modifier = Modifier.size(18.dp)
                )
                Spacer(Modifier.width(8.dp))
                Text(
                    text = if (hasLocalModel)
                        "Tryb offline - AI działa lokalnie"
                    else
                        "Brak połączenia - AI niedostępne",
                    style = MaterialTheme.typography.labelMedium
                )
            }
        }
    }
}
```

### 5.3 Określanie funkcjonalności offline

Jasno informuj, które funkcje wymagają internetu - najlepiej już podczas onboardingu i w menu ustawień:

```xml
<!-- res/layout - element listy funkcji z oznaczeniem offline -->
<androidx.compose.ui.platform.ComposeView
    android:id="@+id/feature_list"
    android:layout_width="match_parent"
    android:layout_height="wrap_content" />
```

```kotlin
data class AppFeature(
    val name: String,
    val description: String,
    val requiresNetwork: Boolean,
    val icon: ImageVector
)

@Composable
fun FeatureListItem(feature: AppFeature, isOnline: Boolean) {
    val available = isOnline || !feature.requiresNetwork
    ListItem(
        headlineContent = { Text(feature.name, color = if (available) Color.Unspecified
                                                        else MaterialTheme.colorScheme.outline) },
        supportingContent = { Text(feature.description) },
        leadingContent = {
            Icon(feature.icon, null,
                tint = if (available) MaterialTheme.colorScheme.primary
                       else MaterialTheme.colorScheme.outline)
        },
        trailingContent = {
            if (feature.requiresNetwork) {
                Icon(
                    imageVector = if (isOnline) Icons.Default.Cloud else Icons.Default.CloudOff,
                    contentDescription = if (isOnline) "Wymaga internetu (dostępne)"
                                         else "Wymaga internetu (niedostępne)",
                    tint = if (isOnline) MaterialTheme.colorScheme.secondary
                           else MaterialTheme.colorScheme.outline
                )
            } else {
                Icon(Icons.Default.PhoneAndroid, "Działa offline",
                    tint = MaterialTheme.colorScheme.primary)
            }
        }
    )
}
```

---

## 6. Onboarding - pobieranie modelu

Modele lokalne często ważą od kilkudziesięciu MB do kilku GB. Onboarding musi zarządzać oczekiwaniami użytkownika.

### 6.1 Zasady onboardingu pobierania modelu

- **Zapytaj przed pobraniem** - nigdy nie pobieraj bez zgody, szczególnie na danych mobilnych
- **Podaj rozmiar** - "Model AI (245 MB)" - brak tego wzbudza nieufność
- **Pokaż postęp** - pasek z procentami i szacowanym czasem
- **Pozwól na przerwanie** - użytkownik może dokończyć później
- **Wyjaśnij po co** - "Model umożliwia rozpoznawanie roślin bez internetu"

### 6.2 Ekran pobierania modelu

```kotlin
// Jetpack Compose - pełny ekran onboardingu pobierania modelu
@Composable
fun ModelDownloadScreen(
    modelInfo: ModelInfo,
    downloadState: DownloadState,
    onStartDownload: () -> Unit,
    onPauseDownload: () -> Unit,
    onSkip: () -> Unit
) {
    Scaffold { padding ->
        Column(
            modifier = Modifier
                .padding(padding)
                .padding(24.dp)
                .fillMaxSize(),
            horizontalAlignment = Alignment.CenterHorizontally,
            verticalArrangement = Arrangement.Center
        ) {
            Icon(
                imageVector = Icons.Default.Psychology,
                contentDescription = null,
                modifier = Modifier.size(72.dp),
                tint = MaterialTheme.colorScheme.primary
            )
            Spacer(Modifier.height(24.dp))
            Text("Model AI", style = MaterialTheme.typography.headlineMedium)
            Spacer(Modifier.height(8.dp))
            Text(
                text = modelInfo.description,
                style = MaterialTheme.typography.bodyMedium,
                textAlign = TextAlign.Center,
                color = MaterialTheme.colorScheme.onSurfaceVariant
            )
            Spacer(Modifier.height(8.dp))
            AssistChip(
                onClick = {},
                label = { Text("Rozmiar: ${modelInfo.sizeMb} MB") },
                leadingIcon = { Icon(Icons.Default.Storage, null, Modifier.size(16.dp)) }
            )
            Spacer(Modifier.height(32.dp))

            when (downloadState) {
                is DownloadState.Idle -> {
                    Button(onClick = onStartDownload, modifier = Modifier.fillMaxWidth()) {
                        Text("Pobierz model AI")
                    }
                    TextButton(onClick = onSkip) { Text("Pomiń - użyj bez AI") }
                }
                is DownloadState.InProgress -> {
                    LinearProgressIndicator(
                        progress = { downloadState.progress },
                        modifier = Modifier.fillMaxWidth()
                    )
                    Spacer(Modifier.height(8.dp))
                    Text(
                        "${(downloadState.progress * 100).toInt()}% - " +
                        "pozostało ~${downloadState.etaSeconds}s",
                        style = MaterialTheme.typography.labelMedium
                    )
                    Spacer(Modifier.height(16.dp))
                    OutlinedButton(onClick = onPauseDownload) { Text("Wstrzymaj") }
                }
                is DownloadState.Complete -> {
                    Icon(Icons.Default.CheckCircle, null,
                        Modifier.size(48.dp), tint = MaterialTheme.colorScheme.primary)
                    Text("Model gotowy!", style = MaterialTheme.typography.titleMedium)
                }
                is DownloadState.Error -> {
                    Text(downloadState.message, color = MaterialTheme.colorScheme.error)
                    Button(onClick = onStartDownload) { Text("Ponów pobieranie") }
                }
            }
        }
    }
}
```

### 6.3 Wariant iOS - pobieranie modelu

```swift
struct ModelDownloadView: View {
    @ObservedObject var downloader: ModelDownloader
    let modelInfo: ModelInfo

    var body: some View {
        VStack(spacing: 20) {
            Image(systemName: "cpu.fill")
                .font(.system(size: 60))
                .foregroundColor(.accentColor)

            Text("Model AI")
                .font(.largeTitle.bold())

            Text(modelInfo.description)
                .font(.body)
                .foregroundColor(.secondary)
                .multilineTextAlignment(.center)

            Label("\(modelInfo.sizeMb) MB", systemImage: "internaldrive")
                .font(.caption)
                .padding(6)
                .background(.quaternary, in: Capsule())

            Divider()

            switch downloader.state {
            case .idle:
                Button("Pobierz model AI") { downloader.start() }
                    .buttonStyle(.borderedProminent)
                Button("Pomiń") { downloader.skip() }
                    .foregroundColor(.secondary)

            case .downloading(let progress, let eta):
                ProgressView(value: progress)
                Text("\(Int(progress * 100))% – pozostało ~\(eta)s")
                    .font(.caption).foregroundColor(.secondary)
                Button("Wstrzymaj") { downloader.pause() }
                    .buttonStyle(.bordered)

            case .complete:
                Label("Model gotowy", systemImage: "checkmark.circle.fill")
                    .foregroundColor(.green).font(.title3)

            case .error(let msg):
                Text(msg).foregroundColor(.red).font(.caption)
                Button("Ponów") { downloader.start() }
                    .buttonStyle(.borderedProminent)
            }
        }
        .padding(32)
    }
}
```

---

## 7. Transparentność AI i Explainable AI (XAI)

Użytkownicy powinni rozumieć, *dlaczego* AI podjęło daną decyzję. Szczególnie istotne w zastosowaniach zdrowotnych, finansowych i edukacyjnych.

### 7.1 Poziomy wyjaśnień

| Poziom | Opis | Przykład |
|---|---|---|
| Czemu to wybrałeś? | Kluczowe cechy wejścia | "Rozpoznałem kotka na podstawie uszu i wąsów" |
| Jak pewny jesteś? | Confidence score + ranking | Top-3 wyniki z procentami |
| Co mogłoby zmienić wynik? | Counterfactual | "Gdyby zdjęcie było ostrzejsze, pewność wzrosłaby do 94%" |
| Skąd wiesz? | Provenance | "Wytrenowany na zbiorze ImageNet, 1000 kategorii" |

### 7.2 Implementacja highlight mapy (Grad-CAM)

Wizualna mapa ciepła pokazuje, na które fragmenty obrazu patrzył model:

```kotlin
// Jetpack Compose - nakładka mapy uwagi na obraz
@Composable
fun ExplainabilityOverlay(
    originalBitmap: ImageBitmap,
    attentionMap: FloatArray,    // znormalizowane [0,1] wartości na siatkę NxN
    gridSize: Int = 7
) {
    Box {
        Image(bitmap = originalBitmap, contentDescription = "Analizowany obraz",
            modifier = Modifier.fillMaxWidth())
        Canvas(
            modifier = Modifier
                .fillMaxWidth()
                .aspectRatio(originalBitmap.width.toFloat() / originalBitmap.height)
        ) {
            val cellW = size.width / gridSize
            val cellH = size.height / gridSize
            attentionMap.forEachIndexed { i, value ->
                val row = i / gridSize
                val col = i % gridSize
                drawRect(
                    color = Color(1f, 0f, 0f, value * 0.6f), // czerwony, przezroczystość = uwaga
                    topLeft = Offset(col * cellW, row * cellH),
                    size = Size(cellW, cellH)
                )
            }
        }
        // Legenda
        Box(Modifier.align(Alignment.BottomEnd).padding(8.dp)) {
            Surface(
                color = MaterialTheme.colorScheme.surface.copy(alpha = 0.85f),
                shape = RoundedCornerShape(8.dp)
            ) {
                Text("🔴 Obszar decyzji", Modifier.padding(6.dp),
                    style = MaterialTheme.typography.labelSmall)
            }
        }
    }
}
```

### 7.3 Karta wyjaśnienia decyzji

```swift
// SwiftUI - rozwijana karta "Dlaczego taki wynik?"
struct ExplanationCard: View {
    let result: ClassificationResult
    @State private var expanded = false

    var body: some View {
        VStack(alignment: .leading, spacing: 8) {
            Button {
                withAnimation(.spring(response: 0.3)) { expanded.toggle() }
            } label: {
                HStack {
                    Image(systemName: "info.circle")
                    Text("Dlaczego taki wynik?")
                        .font(.subheadline.bold())
                    Spacer()
                    Image(systemName: expanded ? "chevron.up" : "chevron.down")
                }
            }
            .foregroundColor(.accentColor)

            if expanded {
                VStack(alignment: .leading, spacing: 6) {
                    Text("Model zwrócił uwagę na:")
                        .font(.caption).foregroundColor(.secondary)
                    ForEach(result.keyFeatures, id: \.self) { feature in
                        Label(feature, systemImage: "magnifyingglass")
                            .font(.caption)
                    }
                    Divider()
                    Text("Model: \(result.modelName) · v\(result.modelVersion)")
                        .font(.caption2).foregroundColor(.secondary)
                }
                .padding(.leading, 4)
                .transition(.opacity.combined(with: .move(edge: .top)))
            }
        }
        .padding(12)
        .background(.quaternary, in: RoundedRectangle(cornerRadius: 12))
    }
}
```

---

## 8. Dostępność (a11y) w aplikacjach z AI

Funkcje AI generują dynamiczne treści - etykiety, wyniki, opisy - które muszą być dostępne dla użytkowników TalkBack (Android) i VoiceOver (iOS).

### 8.1 Semantyczne opisy wyników AI

```kotlin
// Jetpack Compose - semantyka dla wyników klasyfikacji
@Composable
fun AccessibleClassificationResult(result: ClassificationResult) {
    val announcement = buildString {
        append("Wynik analizy AI: ${result.topLabel}. ")
        append("Pewność: ${(result.topConfidence * 100).toInt()} procent. ")
        if (result.topConfidence < 0.7f) {
            append("Wynik niepewny. Sprawdź ręcznie.")
        }
    }

    Column(
        modifier = Modifier.semantics(mergeDescendants = true) {
            contentDescription = announcement
        }
    ) {
        ConfidenceBadge(result.topConfidence, result.topLabel)
        // Wizualne detale nie muszą być czytelne przez TalkBack oddzielnie
    }
}
```

```kotlin
// Ogłaszanie dynamicznych wyników przez TalkBack
class InferenceViewModel : ViewModel() {
    private val _accessibilityAnnouncement = MutableSharedFlow<String>()
    val accessibilityAnnouncement = _accessibilityAnnouncement.asSharedFlow()

    fun onResultReady(result: ClassificationResult) {
        viewModelScope.launch {
            _accessibilityAnnouncement.emit(
                "Analiza zakończona: ${result.topLabel}, " +
                "pewność ${(result.topConfidence * 100).toInt()} procent"
            )
        }
    }
}

@Composable
fun ResultsScreen(viewModel: InferenceViewModel) {
    val context = LocalContext.current
    LaunchedEffect(Unit) {
        viewModel.accessibilityAnnouncement.collect { message ->
            ViewCompat.getAccessibilityDelegate(
                (context as Activity).window.decorView
            )
            // Użyj AccessibilityManagerCompat do ogłoszenia
            val manager = context.getSystemService(Context.ACCESSIBILITY_SERVICE)
                    as AccessibilityManager
            if (manager.isEnabled) {
                val event = AccessibilityEvent.obtain(
                    AccessibilityEvent.TYPE_ANNOUNCEMENT)
                event.text.add(message)
                manager.sendAccessibilityEvent(event)
            }
        }
    }
}
```

### 8.2 Dostępność na iOS - VoiceOver

```swift
// SwiftUI - accessibility dla dynamicznych wyników AI
struct AccessibleResultCard: View {
    let result: ClassificationResult

    var accessibilityDescription: String {
        let conf = Int(result.confidence * 100)
        let certainty = conf >= 85 ? "pewny" : conf >= 60 ? "umiarkowanie pewny" : "niepewny"
        return "Wynik AI: \(result.label). Model jest \(certainty) - \(conf) procent."
    }

    var body: some View {
        VStack(alignment: .leading) {
            Text(result.label).font(.headline)
            ConfidenceBar(confidence: result.confidence, label: "")
        }
        .padding()
        .background(.regularMaterial, in: RoundedRectangle(cornerRadius: 12))
        .accessibilityElement(children: .ignore)
        .accessibilityLabel(accessibilityDescription)
        .accessibilityAddTraits(result.confidence < 0.6 ? .isButton : [])
        .accessibilityHint(result.confidence < 0.6 ? "Dotknij dwukrotnie, aby wprowadzić ręcznie" : "")
    }
}
```

### 8.3 Animacje a dostępność

```kotlin
// Wyłącz animacje przy włączonych ustawieniach "redukcja ruchu"
@Composable
fun AccessibleLoadingIndicator(isLoading: Boolean) {
    val reduceMotion = LocalAccessibilityManager.current?.isEnabled == true
    // W praktyce sprawdź Settings.Global.TRANSITION_ANIMATION_SCALE

    if (isLoading) {
        if (reduceMotion) {
            LinearProgressIndicator(modifier = Modifier.fillMaxWidth())
        } else {
            // Bogata animacja lottie lub shimmer
            ShimmerLoadingCard()
        }
    }
}
```

---

## 9. Prywatność w UX

Jedną z największych zalet lokalnej AI jest przetwarzanie danych wyłącznie na urządzeniu. UX powinien aktywnie to komunikować - to przewaga konkurencyjna, nie tylko technikalia.

### 9.1 Privacy badge - znaczek prywatności

```kotlin
// Jetpack Compose - badge "Przetwarza lokalnie"
@Composable
fun PrivacyBadge(modifier: Modifier = Modifier) {
    Surface(
        color = MaterialTheme.colorScheme.tertiaryContainer,
        shape = RoundedCornerShape(20.dp),
        modifier = modifier.semantics {
            contentDescription = "Dane przetwarzane lokalnie - nie opuszczają urządzenia"
        }
    ) {
        Row(
            modifier = Modifier.padding(horizontal = 10.dp, vertical = 5.dp),
            verticalAlignment = Alignment.CenterVertically
        ) {
            Icon(
                imageVector = Icons.Default.Lock,
                contentDescription = null,
                modifier = Modifier.size(14.dp),
                tint = MaterialTheme.colorScheme.onTertiaryContainer
            )
            Spacer(Modifier.width(5.dp))
            Text(
                text = "Na urządzeniu",
                style = MaterialTheme.typography.labelSmall,
                color = MaterialTheme.colorScheme.onTertiaryContainer
            )
        }
    }
}
```

### 9.2 Ekran informacji o prywatności AI

Użytkownicy chcą wiedzieć: *jakie* dane przetwarza AI i *gdzie* trafiają.

```swift
// SwiftUI - sekcja prywatności w ustawieniach
struct AIPrivacySettingsSection: View {
    var body: some View {
        Section {
            PrivacyRow(
                icon: "iphone",
                title: "Przetwarzanie lokalne",
                description: "Wszystkie analizy AI odbywają się wyłącznie na Twoim urządzeniu."
            )
            PrivacyRow(
                icon: "xmark.icloud",
                title: "Bez wysyłania do chmury",
                description: "Zdjęcia i dane wejściowe nie są wysyłane na żadne serwery."
            )
            PrivacyRow(
                icon: "trash",
                title: "Brak przechowywania",
                description: "Dane analizy są usuwane zaraz po wyświetleniu wyniku."
            )
        } header: {
            Label("Prywatność AI", systemImage: "lock.shield")
        } footer: {
            Text("Model AI jest przechowywany lokalnie i działa w pełni offline.")
                .font(.caption)
        }
    }
}

struct PrivacyRow: View {
    let icon: String
    let title: String
    let description: String

    var body: some View {
        Label {
            VStack(alignment: .leading, spacing: 2) {
                Text(title).font(.subheadline.bold())
                Text(description).font(.caption).foregroundColor(.secondary)
            }
        } icon: {
            Image(systemName: icon)
                .foregroundColor(.green)
        }
    }
}
```

---

## 10. Material Design 3 i iOS HIG dla elementów AI

### 10.1 Material Design 3 - rekomendacje dla AI

Google Material Design 3 (M3) definiuje kilka komponentów szczególnie przydatnych w UI dla AI:

| Komponent M3 | Zastosowanie w AI UI |
|---|---|
| `AssistChip` | Sugestie AI, quick actions |
| `SuggestionChip` | Wyniki klasyfikacji do wyboru |
| `LinearProgressIndicator` | Postęp wnioskowania / pobierania modelu |
| `SnackBar` | Potwierdzenie akcji AI, krótkie komunikaty |
| `ElevatedCard` | Wyróżnienie wyniku AI od reszty treści |
| `BadgedBox` | Oznaczanie elementów UI wygenerowanych przez AI |

```kotlin
// Jetpack Compose - chip sugestii AI zgodny z M3
@Composable
fun AISuggestionChips(
    suggestions: List<String>,
    onSuggestionSelected: (String) -> Unit
) {
    LazyRow(
        horizontalArrangement = Arrangement.spacedBy(8.dp),
        contentPadding = PaddingValues(horizontal = 16.dp)
    ) {
        item {
            AssistChip(
                onClick = {},
                label = { Text("Sugestie AI", style = MaterialTheme.typography.labelSmall) },
                leadingIcon = {
                    Icon(Icons.Default.AutoAwesome, null, Modifier.size(16.dp))
                },
                colors = AssistChipDefaults.assistChipColors(
                    containerColor = MaterialTheme.colorScheme.secondaryContainer
                )
            )
        }
        items(suggestions) { suggestion ->
            SuggestionChip(
                onClick = { onSuggestionSelected(suggestion) },
                label = { Text(suggestion) }
            )
        }
    }
}
```

### 10.2 iOS HIG - wskazówki dla elementów AI

Apple Human Interface Guidelines zaleca:
- **Menu kontekstowe** dla opcji AI (long press → "Analizuj z AI")
- **SF Symbols** dla ikon AI: `brain`, `cpu`, `wand.and.sparkles`, `sparkles`
- **Dynamic Type** - wyniki AI muszą skalować się z preferencjami tekstu
- **Haptic feedback** po zakończeniu wnioskowania (`UINotificationFeedbackGenerator`)

```swift
// SwiftUI - przycisk AI z haptic feedback i SF Symbol
struct AIActionButton: View {
    let action: () -> Void
    @State private var isProcessing = false

    var body: some View {
        Button {
            isProcessing = true
            let generator = UINotificationFeedbackGenerator()
            generator.prepare()
            action()
            // Po zakończeniu:
            DispatchQueue.main.asyncAfter(deadline: .now() + 1.5) {
                isProcessing = false
                generator.notificationOccurred(.success)
            }
        } label: {
            Label(
                isProcessing ? "Analizuję…" : "Analizuj z AI",
                systemImage: isProcessing ? "cpu" : "wand.and.sparkles"
            )
            .symbolEffect(.pulse, isActive: isProcessing)
        }
        .buttonStyle(.borderedProminent)
        .disabled(isProcessing)
    }
}
```

### 10.3 Autouzupełnianie i sugestie tekstowe

```kotlin
// Jetpack Compose - pole z sugestiami AI
@Composable
fun AiAssistedTextField(
    value: String,
    onValueChange: (String) -> Unit,
    suggestions: List<String>,
    isLoadingSuggestions: Boolean
) {
    Column {
        OutlinedTextField(
            value = value,
            onValueChange = onValueChange,
            label = { Text("Opis") },
            trailingIcon = {
                if (isLoadingSuggestions) {
                    CircularProgressIndicator(Modifier.size(20.dp), strokeWidth = 2.dp)
                } else {
                    Icon(Icons.Default.AutoAwesome, "Sugestie AI",
                        tint = MaterialTheme.colorScheme.primary)
                }
            },
            modifier = Modifier.fillMaxWidth()
        )
        AnimatedVisibility(visible = suggestions.isNotEmpty()) {
            Column(
                Modifier
                    .fillMaxWidth()
                    .background(MaterialTheme.colorScheme.surfaceVariant)
                    .clip(RoundedCornerShape(bottomStart = 8.dp, bottomEnd = 8.dp))
            ) {
                suggestions.forEach { suggestion ->
                    ListItem(
                        headlineContent = { Text(suggestion) },
                        leadingContent = {
                            Icon(Icons.Default.AutoAwesome, null,
                                Modifier.size(16.dp),
                                tint = MaterialTheme.colorScheme.primary)
                        },
                        modifier = Modifier.clickable { onValueChange(suggestion) }
                    )
                    HorizontalDivider()
                }
            }
        }
    }
}
```

---

## 11. Zarządzanie oczekiwaniami użytkownika

### 11.1 Komunikowanie ograniczeń modelu

Uczciwe informowanie o tym, kiedy AI zawodzi, buduje długoterminowe zaufanie:

- **Przed użyciem**: "Model rozpoznaje 100 gatunków roślin - inne kategorie mogą dawać błędne wyniki"
- **Podczas użycia**: Wskaźnik pewności poniżej progu
- **Po błędzie**: "AI się pomyliła - dziękujemy za korektę, pomaga to ulepszać model"

### 11.2 Zbieranie feedback użytkownika

```kotlin
// Jetpack Compose - micro-feedback po wyniku AI
@Composable
fun ResultFeedback(
    result: ClassificationResult,
    onCorrect: () -> Unit,
    onWrong: (String) -> Unit
) {
    var showCorrectionField by remember { mutableStateOf(false) }
    var correction by remember { mutableStateOf("") }

    Row(
        Modifier.fillMaxWidth().padding(top = 8.dp),
        horizontalArrangement = Arrangement.spacedBy(8.dp)
    ) {
        Text("Czy wynik jest poprawny?",
            style = MaterialTheme.typography.labelMedium,
            modifier = Modifier.align(Alignment.CenterVertically))
        IconButton(onClick = onCorrect) {
            Icon(Icons.Default.ThumbUp, "Tak, poprawny",
                tint = MaterialTheme.colorScheme.primary)
        }
        IconButton(onClick = { showCorrectionField = true }) {
            Icon(Icons.Default.ThumbDown, "Nie, błędny",
                tint = MaterialTheme.colorScheme.error)
        }
    }
    AnimatedVisibility(visible = showCorrectionField) {
        Row(Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.spacedBy(8.dp)) {
            OutlinedTextField(
                value = correction,
                onValueChange = { correction = it },
                label = { Text("Prawidłowa odpowiedź") },
                modifier = Modifier.weight(1f)
            )
            Button(
                onClick = { onWrong(correction); showCorrectionField = false },
                enabled = correction.isNotBlank()
            ) { Text("Wyślij") }
        }
    }
}
```

---

## 12. Testowanie użyteczności funkcji AI

### 12.1 Specyficzne wyzwania testowania AI UX

- **Niedeterminizm** - wyniki mogą się różnić między sesjami testowymi
- **Zależność od danych wejściowych** - wejście słabej jakości daje inne UX niż dobre
- **Efekt nowości** - użytkownicy zachowują się inaczej przy pierwszym kontakcie z AI
- **Calibracja zaufania** - testuj czy użytkownicy ufają AI tyle, ile powinni (nie za dużo, nie za mało)

### 12.2 Metryki UX dla aplikacji AI

| Metryka | Opis | Narzędzie |
|---|---|---|
| Task Success Rate | % zadań ukończonych z pomocą AI | Moderowane sesje |
| AI Override Rate | Jak często użytkownicy odrzucają sugestię AI | Analityka in-app |
| Confidence Calibration | Czy użytkownicy ufają wynikom adekwatnie do confidence score | Kwestionariusze |
| Time-to-Result | Czas od interakcji do decyzji | Analityka in-app |
| Error Recovery Rate | % użytkowników kończących zadanie po błędzie AI | Funnel analysis |
| Onboarding Completion | % kończących pobieranie modelu | Analityka in-app |

### 12.3 Protokół testu użyteczności dla AI

```
1. REKRUTACJA
   - Zróżnicuj pod kątem: doświadczenia z AI, grupy wiekowej, sprawności
   - Min. 5 uczestników na iterację (reguła Nielsena)

2. ZADANIA TESTOWE - projektuj scenariusze dla:
   a) Ścieżki "happy path" (dobra jakość wejścia, wysoka pewność)
   b) Granicznych przypadków (słabe wejście, niska pewność)
   c) Błędów modelu (celowo niepoprawny wynik)
   d) Trybu offline (wyłącz internet przed sesją)

3. MIERZONE ZMIENNE
   - Czy uczestnik zauważył wskaźnik pewności?
   - Czy podjął właściwą decyzję przy wyniku z niską pewnością?
   - Jak zareagował na błąd modelu?
   - Czy ukończył onboarding pobierania modelu?

4. KWESTIONARIUSZ PO SESJI
   - NASA-TLX (obciążenie kognitywne)
   - Trust in Automation Scale (zaufanie do AI)
   - SUS (ogólna użyteczność)
```

### 12.4 A/B testing wzorców AI

```kotlin
// Prosty feature flag dla testowania wariantów UI AI
enum class ConfidenceDisplayVariant { HIDDEN, PERCENTAGE, VERBAL, BAR }

@Composable
fun AdaptiveConfidenceDisplay(
    confidence: Float,
    label: String,
    variant: ConfidenceDisplayVariant
) {
    when (variant) {
        ConfidenceDisplayVariant.HIDDEN -> Text(label)
        ConfidenceDisplayVariant.PERCENTAGE ->
            Text("$label - ${(confidence * 100).toInt()}%")
        ConfidenceDisplayVariant.VERBAL ->
            Text("$label (${if (confidence > 0.85) "bardzo pewny" else if (confidence > 0.6) "dość pewny" else "niepewny"})")
        ConfidenceDisplayVariant.BAR ->
            ConfidenceBadge(confidence, label)
    }
}
```

---

## Powiązane artykuły

- [Wprowadzenie do lokalnej AI na urządzeniu mobilnym](local-ai-intro.md)
- [Wnioskowanie lokalne - architektura i wydajność](on-device-inference.md)
- [MediaPipe - kompleksowe rozwiązania AI](mediapipe-mobile.md)
- [Modele językowe LLM na urządzeniu](llm-on-device.md)
- [Prywatność i bezpieczeństwo w lokalnej AI](ai-privacy-security.md)
- [Dostępność aplikacji mobilnych](accessibility.md)
