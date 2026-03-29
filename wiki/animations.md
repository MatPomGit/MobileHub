# Animacje w Aplikacjach Mobilnych

Animacje to jeden z kluczowych elementów nowoczesnego interfejsu mobilnego. Dobrze zaprojektowana animacja nie jest jedynie dekoracją — komunikuje zmiany stanu, wskazuje kierunek przepływu i sprawia, że aplikacja sprawia wrażenie responsywnej. Źle dobrana animacja natomiast spowalnia użytkownika i irytuje.

## Czym są animacje w UI mobilnym

Animacje w interfejsie mobilnym to kontrolowana zmiana właściwości wizualnych elementu (pozycja, rozmiar, kolor, przezroczystość, kształt) w czasie. W odróżnieniu od gier, animacje UI powinny być dyskretne i celowe.

### Rodzaje animacji

| Rodzaj | Opis | Typowy czas trwania |
|--------|------|---------------------|
| Przejścia ekranów | Nawigacja między widokami | 250–400 ms |
| Mikro-animacje | Odpowiedź na akcję użytkownika | 100–200 ms |
| Animacje ładowania | Informacja o postępie | Nieskończone / zależne od postępu |
| Animacje stanu | Zmiana danych (pojawienie, znikanie) | 150–300 ms |
| Animacje dekoracyjne | Efekty estetyczne bez funkcji | 400–800 ms |

### Kiedy stosować animacje

Animacje mają sens, gdy:

- **wskazują przyczynowość** — element A powoduje pojawienie się elementu B
- **orientują przestrzennie** — użytkownik wie, skąd pochodzi nowy widok
- **potwierdzają akcję** — przycisk "kupuj" pulsuje po kliknięciu
- **wypełniają czas oczekiwania** — spinner zamiast zamrożonego ekranu

Unikaj animacji, które jedynie opóźniają dostęp do treści.

## Animacje w Jetpack Compose

Jetpack Compose wprowadził w pełni reaktywny system animacji oparty na funkcjach kompozytowalnych. Animowane wartości automatycznie przelikowują się przy zmianie stanu.

### Proste animacje wartości — `animate*AsState`

Najprostszy sposób animowania pojedynczej właściwości:

```kotlin
@Composable
fun ExpandableCard(initialExpanded: Boolean = false) {
    var expanded by remember { mutableStateOf(initialExpanded) }

    // Animowana wysokość
    val cardHeight by animateDpAsState(
        targetValue = if (expanded) 220.dp else 72.dp,
        animationSpec = spring(
            dampingRatio = Spring.DampingRatioMediumBouncy,
            stiffness    = Spring.StiffnessMedium
        ),
        label = "cardHeight"
    )

    // Animowany kąt rotacji ikony
    val arrowRotation by animateFloatAsState(
        targetValue   = if (expanded) 180f else 0f,
        animationSpec = tween(durationMillis = 250, easing = FastOutSlowInEasing),
        label         = "arrowRotation"
    )

    Card(
        modifier = Modifier
            .fillMaxWidth()
            .height(cardHeight)
            .clickable { expanded = !expanded }
    ) {
        Row(
            modifier            = Modifier.fillMaxWidth().padding(16.dp),
            horizontalArrangement = Arrangement.SpaceBetween,
            verticalAlignment   = Alignment.CenterVertically
        ) {
            Text("Szczegóły", style = MaterialTheme.typography.titleMedium)
            Icon(
                imageVector        = Icons.Default.ExpandMore,
                contentDescription = if (expanded) "Zwiń" else "Rozwiń",
                modifier           = Modifier.rotate(arrowRotation)
            )
        }
    }
}
```

Dostępne warianty `animate*AsState`:

- `animateDpAsState` — rozmiar, odstępy
- `animateFloatAsState` — obrót, przezroczystość, skala
- `animateColorAsState` — kolor tła, tekstu
- `animateIntAsState` — wartości całkowite (np. licznik)
- `animateSizeAsState` — para width/height
- `animateOffsetAsState` — pozycja (x, y)

### Animowana widoczność — `AnimatedVisibility`

`AnimatedVisibility` to gotowy komponent Compose umożliwiający płynne pojawianie i znikanie elementów interfejsu. Parametry `enter` i `exit` przyjmują złożenia efektów przejścia, które można łączyć operatorem `+`, tworząc kombinacje ruchu i przeźroczystości. To najwygodniejsze narzędzie do animowania widoczności banerów, list i sekcji warunkowych.

```kotlin
@Composable
fun NotificationBanner(visible: Boolean, message: String) {
    AnimatedVisibility(
        visible = visible,
        enter   = slideInVertically(initialOffsetY = { -it }) + fadeIn(tween(200)),
        exit    = slideOutVertically(targetOffsetY = { -it }) + fadeOut(tween(200))
    ) {
        Surface(
            color  = MaterialTheme.colorScheme.primaryContainer,
            tonalElevation = 4.dp,
            modifier = Modifier.fillMaxWidth()
        ) {
            Text(
                text     = message,
                modifier = Modifier.padding(horizontal = 16.dp, vertical = 12.dp),
                style    = MaterialTheme.typography.bodyMedium
            )
        }
    }
}
```

Dostępne `EnterTransition` / `ExitTransition`:

```
fadeIn / fadeOut
slideInHorizontally / slideOutHorizontally
slideInVertically   / slideOutVertically
scaleIn / scaleOut
expandIn / shrinkOut
expandHorizontally  / shrinkHorizontally
```

Przejścia można łączyć operatorem `+`:

```kotlin
enter = scaleIn(tween(300)) + fadeIn(tween(300))
exit  = scaleOut(tween(200)) + fadeOut(tween(200))
```

### Animowane treści — `AnimatedContent`

Przydatne gdy zmienia się wartość wyświetlana w tym samym miejscu (np. licznik, aktywna zakładka):

```kotlin
@Composable
fun AnimatedCounter(count: Int) {
    AnimatedContent(
        targetState  = count,
        transitionSpec = {
            if (targetState > initialState) {
                slideInVertically { -it } + fadeIn() togetherWith
                    slideOutVertically { it } + fadeOut()
            } else {
                slideInVertically { it } + fadeIn() togetherWith
                    slideOutVertically { -it } + fadeOut()
            }
        },
        label = "counter"
    ) { targetCount ->
        Text(
            text  = "$targetCount",
            style = MaterialTheme.typography.displaySmall
        )
    }
}
```

### Zaawansowane — `Transition`

Gdy kilka właściwości zmienia się jednocześnie w odpowiedzi na ten sam stan:

```kotlin
enum class ButtonState { Idle, Pressed }

@Composable
fun PulsingButton(onClick: () -> Unit) {
    var state by remember { mutableStateOf(ButtonState.Idle) }
    val transition = updateTransition(targetState = state, label = "buttonTransition")

    val scale by transition.animateFloat(
        transitionSpec = { spring(dampingRatio = Spring.DampingRatioMediumBouncy) },
        label          = "scale"
    ) { if (it == ButtonState.Pressed) 0.92f else 1f }

    val elevation by transition.animateDp(
        transitionSpec = { tween(100) },
        label          = "elevation"
    ) { if (it == ButtonState.Pressed) 0.dp else 6.dp }

    Button(
        onClick   = {
            state = ButtonState.Pressed
            onClick()
        },
        elevation = ButtonDefaults.buttonElevation(defaultElevation = elevation),
        modifier  = Modifier.scale(scale)
    ) {
        Text("Naciśnij")
    }
}
```

### Specyfikacje animacji — `AnimationSpec`

| Specyfikacja | Charakterystyka | Użycie |
|---|---|---|
| `tween(durationMillis, easing)` | Liniowa w czasie, kontrolowane krzywą easingu | Przejścia ekranów, fadeIn/Out |
| `spring(dampingRatio, stiffness)` | Fizyczna sprężyna, naturalny overshoot | Rozwinięcia, drag & drop |
| `keyframes { ... }` | Definiowane klatki kluczowe w ms | Złożone animacje wieloetapowe |
| `snap()` | Natychmiastowa zmiana bez animacji | Reset stanu, tryb dostępności |
| `infiniteRepeatable(...)` | Powtarzanie w pętli | Shimmer, spinnery, pulsy |

Poniższy przykład demonstruje użycie `infiniteRepeatable` do stworzenia efektu shimmer — nieskończonej animacji połysku stosowanej podczas ładowania treści. `rememberInfiniteTransition` zarządza animacją niepowiązaną z konkretnym stanem, a wartość `shimmerOffset` jest następnie przekazywana do `LinearGradient`, który tworzy efekt przesuwanego blasku.

```kotlin
// Shimmer loader — nieskończona pętla
val infiniteTransition = rememberInfiniteTransition(label = "shimmer")
val shimmerOffset by infiniteTransition.animateFloat(
    initialValue   = -1f,
    targetValue    = 1f,
    animationSpec  = infiniteRepeatable(
        animation   = tween(1200, easing = LinearEasing),
        repeatMode  = RepeatMode.Restart
    ),
    label = "shimmerOffset"
)
```

## Animacje w SwiftUI

SwiftUI udostępnia animacje jako modyfikatory widoku. Zmiana stanu powiązana z `.animation(_:value:)` automatycznie generuje przejście.

### Podstawowe animacje

W SwiftUI wystarczy dołączyć modyfikator `.animation(_:value:)` do widoku — każda zmiana wskazanej wartości automatycznie uruchamia płynną animację. Poniższy przykład pokazuje rozwijającą się kartę, której wysokość animuje się za pomocą sprężyny (`spring`) reagującej na dotknięcie. Podejście to jest deklaratywne i eliminuje potrzebę ręcznego zarządzania timerami czy stanami animacji.

```swift
struct ExpandableCard: View {
    @State private var expanded = false

    var body: some View {
        VStack {
            RoundedRectangle(cornerRadius: 16)
                .fill(Color.blue.opacity(0.15))
                .frame(height: expanded ? 220 : 72)
                .animation(.spring(response: 0.4, dampingFraction: 0.7), value: expanded)
                .onTapGesture { expanded.toggle() }
        }
    }
}
```

### Widoczność i przejścia — `.transition`

Modyfikator `.transition` w SwiftUI definiuje sposób wchodzenia i wychodzenia widoku z hierarchii, gdy jest wyświetlany lub ukrywany warunkowo przez `if`. Metoda `.asymmetric` pozwala zastosować inny efekt przy pojawieniu się elementu i inny przy jego znikaniu. Animację uruchamia się przez dołączenie `.animation(_:value:)` do kontenera rodzica, co synchronizuje wszystkie zmiany stanu wewnątrz niego.

```swift
struct BannerView: View {
    var isVisible: Bool

    var body: some View {
        Group {
            if isVisible {
                Text("Operacja zakończona sukcesem")
                    .padding()
                    .background(Color.green.opacity(0.2))
                    .cornerRadius(10)
                    .transition(
                        .asymmetric(
                            insertion: .move(edge: .top).combined(with: .opacity),
                            removal:   .move(edge: .top).combined(with: .opacity)
                        )
                    )
            }
        }
        .animation(.easeInOut(duration: 0.3), value: isVisible)
    }
}
```

### Animacja fazowa — `PhaseAnimator` (iOS 17+)

`PhaseAnimator` dostępny od iOS 17 pozwala sekwencyjnie przechodzić przez listę faz animacji, co upraszcza tworzenie wieloetapowych efektów. W poniższym przykładzie serce pulsuje przez trzy fazy skalowania, a każda z nich używa animacji sprężyny. Wyzwalacz `trigger` decyduje, kiedy sekwencja się uruchamia — wystarczy zmienić jego wartość po zdarzeniu, np. dotknięciu.

```swift
struct PulsingHeart: View {
    @State private var trigger = false

    var body: some View {
        Image(systemName: "heart.fill")
            .foregroundColor(.red)
            .font(.largeTitle)
            .phaseAnimator([1.0, 1.3, 1.0], trigger: trigger) { view, phase in
                view.scaleEffect(phase)
            } animation: { _ in
                .spring(duration: 0.3)
            }
            .onTapGesture { trigger.toggle() }
    }
}
```

### Keyframe animations (iOS 17+)

Animacje klatkowe (keyframe) dostępne od iOS 17 umożliwiają precyzyjne definiowanie wartości właściwości w konkretnych momentach czasu. `KeyframeTrack` grupuje klatki dla jednej właściwości, a różne typy klatek (`LinearKeyframe`, `SpringKeyframe`) określają interpolację między nimi. Dzięki temu można tworzyć złożone, wieloetapowe efekty — jak realistyczne odbicie przycisku — bez zagnieżdżania wielu animacji.

```swift
struct BounceButton: View {
    @State private var pressed = false

    var body: some View {
        Button("Wyślij") { pressed = true }
            .keyframeAnimator(
                initialValue: AnimValues(),
                trigger: pressed,
                content: { view, values in
                    view
                        .scaleEffect(values.scale)
                        .offset(y: values.verticalOffset)
                },
                keyframes: { _ in
                    KeyframeTrack(\.scale) {
                        LinearKeyframe(0.9, duration: 0.1)
                        SpringKeyframe(1.1, duration: 0.2, spring: .bouncy)
                        SpringKeyframe(1.0, duration: 0.2, spring: .smooth)
                    }
                    KeyframeTrack(\.verticalOffset) {
                        LinearKeyframe(-4, duration: 0.1)
                        SpringKeyframe(0, duration: 0.3, spring: .bouncy)
                    }
                }
            )
    }

    struct AnimValues {
        var scale: CGFloat = 1.0
        var verticalOffset: CGFloat = 0
    }
}
```

## Animacje we Flutter

Flutter animuje za pomocą `AnimationController` (niskopoziomowo) lub gotowych widgetów `Animated*` (wysokopoziomowo).

### Implicit animations — `AnimatedContainer`

Najprostsze podejście — wystarczy zmienić wartość, a widget sam ją animuje:

```dart
class ExpandableCard extends StatefulWidget {
  const ExpandableCard({super.key});
  @override
  State<ExpandableCard> createState() => _ExpandableCardState();
}

class _ExpandableCardState extends State<ExpandableCard> {
  bool _expanded = false;

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: () => setState(() => _expanded = !_expanded),
      child: AnimatedContainer(
        duration: const Duration(milliseconds: 300),
        curve: Curves.easeInOut,
        height: _expanded ? 220 : 72,
        decoration: BoxDecoration(
          color: Theme.of(context).colorScheme.primaryContainer,
          borderRadius: BorderRadius.circular(16),
        ),
      ),
    );
  }
}
```

Inne widgety implicit animations:

```
AnimatedOpacity    — przezroczystość
AnimatedAlign      — wyrównanie
AnimatedPadding    — odstępy
AnimatedPositioned — pozycja w Stack
AnimatedDefaultTextStyle — styl tekstu
AnimatedSwitcher   — przełączanie widgetów
```

### Explicit animations — `AnimationController`

Pełna kontrola nad animacją, potrzebna np. do nieskończonych pętli:

```dart
class ShimmerLoader extends StatefulWidget {
  const ShimmerLoader({super.key});
  @override
  State<ShimmerLoader> createState() => _ShimmerLoaderState();
}

class _ShimmerLoaderState extends State<ShimmerLoader>
    with SingleTickerProviderStateMixin {
  late final AnimationController _controller;
  late final Animation<double> _shimmerAnim;

  @override
  void initState() {
    super.initState();
    _controller = AnimationController(
      vsync:    this,
      duration: const Duration(milliseconds: 1200),
    )..repeat();

    _shimmerAnim = Tween<double>(begin: -1, end: 2).animate(
      CurvedAnimation(parent: _controller, curve: Curves.linear),
    );
  }

  @override
  void dispose() {
    _controller.dispose(); // zawsze zwalniaj zasoby!
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return AnimatedBuilder(
      animation: _shimmerAnim,
      builder: (_, __) {
        return ShaderMask(
          shaderCallback: (bounds) => LinearGradient(
            begin: Alignment(_shimmerAnim.value - 1, 0),
            end:   Alignment(_shimmerAnim.value + 1, 0),
            colors: const [Color(0xFFE0E0E0), Color(0xFFF5F5F5), Color(0xFFE0E0E0)],
          ).createShader(bounds),
          child: Container(
            height: 20,
            color: Colors.white,
          ),
        );
      },
    );
  }
}
```

### Hero animations — nawigacja

Płynne przejście elementu między ekranami:

```dart
// Ekran listy
Hero(
  tag: 'product-image-${product.id}',
  child: Image.network(product.imageUrl, width: 80, height: 80),
)

// Ekran szczegółów — ten sam tag
Hero(
  tag: 'product-image-${product.id}',
  child: Image.network(product.imageUrl, width: double.infinity, height: 300),
)
```

## Zasady projektowania animacji

### Czas trwania i krzywe easingu

Animacje UI mają naturalne tempo. Zbyt wolne — irytują; zbyt szybkie — dezorientują.

| Czas | Zastosowanie |
|------|------|
| 50–100 ms | Drobne efekty naciśnięcia przycisku |
| 150–200 ms | Mikro-animacje (checkbox, toggle) |
| 200–300 ms | Pojawienie / znikanie elementu |
| 300–400 ms | Przejścia między ekranami |
| 400–600 ms | Złożone animacje (expandable card) |

**Zasada thumb**: czas trwania ≤ 400 ms dla akcji wywołanych bezpośrednio przez użytkownika.

### Naturalne krzywe — easing

Animacje liniowe wyglądają mechanicznie. Używaj krzywych naśladujących fizykę:

```
Ease In Out (FastOutSlowInEasing) — domyślny wybór, naturalnie wygląda
Ease Out (LinearOutSlowInEasing)  — elementy wlatujące na ekran
Ease In  (FastOutLinearInEasing)  — elementy wylatujące z ekranu
Spring                            — bujanie, overshoot dla dynamicznych UI
```

### 12 zasad animacji (przeniesione do UI)

Oryginalne zasady Disney (1981) mają odpowiedniki w UI mobilnym:

1. **Squash & Stretch** — przycisk lekko "spłaszcza się" przy naciśnięciu
2. **Anticipation** — karta unosi się przed rozwinięciem
3. **Staging** — kluczowy element zawsze w centrum uwagi
4. **Follow Through** — lista po zatrzymaniu lekko "przelewa się"
5. **Secondary Action** — ikona reaguje razem z rodzicem

## Wydajność animacji

### 60 / 120 fps i jank

Płynna animacja to **stałe 60 klatek na sekundę** (16,6 ms/klatka). Na ekranach 120 Hz — 120 fps (8,3 ms/klatka).

**Jank** (szarpanie) pojawia się gdy:

- renderowanie klatki trwa > 16 ms
- UI thread jest zablokowany przez ciężkie operacje
- zbyt wiele warstw do kompozycji

### Dobre praktyki wydajnościowe

Kluczowa zasada wydajnych animacji to animowanie wyłącznie właściwości renderowanych przez GPU — takich jak `alpha`, `scale` czy `offset` — które nie wywołują ponownego układu elementów (relayout). Poniższy przykład zestawia dobre i złe podejście: animowanie szerokości widgetu przez `animateDpAsState` powoduje pełny relayout każdej klatki, co jest droższe obliczeniowo i łatwo prowadzi do janku. Jeśli zmiana rozmiaru jest niezbędna, warto rozważyć użycie `AnimatedContent` lub `animateContentSize`.

```kotlin
// ✅ Dobrze — animuj tylko `alpha` i `translationY` (GPU)
AnimatedVisibility(visible = show) {
    Box(Modifier.alpha(animatedAlpha))
}

// ❌ Źle — zmiana `width` powoduje pełny relayout
val width by animateDpAsState(if (big) 300.dp else 100.dp)
Box(Modifier.width(width)) // każda klatka = nowe rozmieszczenie layoutu
```

Właściwości animowane przez GPU (bez relayoutu):

| Właściwość | Compose | SwiftUI | Flutter |
|------------|---------|---------|---------|
| Przezroczystość | `alpha` | `.opacity` | `Opacity` |
| Obrót | `rotate` | `.rotationEffect` | `Transform.rotate` |
| Skala | `scale` | `.scaleEffect` | `Transform.scale` |
| Translacja | `offset` | `.offset` | `Transform.translate` |

### Profiling animacji

Każda z trzech platform udostępnia dedykowane narzędzia do profilowania płynności animacji — warto z nich korzystać przed opublikowaniem aplikacji. Android Studio Profiler pokazuje tzw. „janky frames" (klatki przekraczające 16 ms), Instruments na iOS umożliwia śledzenie commit timeline renderera Core Animation, a Flutter DevTools wyświetla nakładkę GPU/UI thread bezpośrednio na urządzeniu.

```
Android: Android Studio → Profiler → Rendering → Janky frames
iOS:     Instruments → Core Animation (FPS, commit timeline)
Flutter: DevTools → Performance overlay (GPU / UI thread)
```

## Dostępność animacji

### Prefers Reduced Motion

Część użytkowników (migrena, epilepsja, zaburzenia przedsionkowe) wyłącza animacje:

```kotlin
// Jetpack Compose — odczyt preferencji systemowych
@Composable
fun rememberReducedMotion(): Boolean {
    val context = LocalContext.current
    return remember {
        Settings.Global.getFloat(
            context.contentResolver,
            Settings.Global.ANIMATOR_DURATION_SCALE, 1f
        ) == 0f
    }
}

@Composable
fun AccessibleCard(isExpanded: Boolean) {
    val reducedMotion = rememberReducedMotion()

    val spec: AnimationSpec<Dp> = if (reducedMotion) snap() else spring(
        dampingRatio = Spring.DampingRatioMediumBouncy
    )

    val height by animateDpAsState(
        targetValue    = if (isExpanded) 220.dp else 72.dp,
        animationSpec  = spec,
        label          = "height"
    )
    // ...
}
```

Odpowiednik w SwiftUI jest jeszcze bardziej zwięzły — środowisko dostarcza gotową wartość logiczną `accessibilityReduceMotion`, dzięki której można warunkowo zastosować `.none` zamiast normalnej animacji. Warto wyciągnąć tę logikę do osobnej właściwości obliczeniowej, aby unikać duplikowania warunku w każdym modyfikatorze `.animation`.

```swift
// SwiftUI
@Environment(\.accessibilityReduceMotion) var reduceMotion

var animation: Animation {
    reduceMotion ? .none : .spring(response: 0.4)
}
```

We Flutterze informacja o wyłączonych animacjach pochodzi z `MediaQuery` — wartość `disableAnimations` zwraca `true`, gdy użytkownik włączył opcję ograniczenia ruchu w systemie. Wystarczy wtedy ustawić `duration` na `Duration.zero`, aby wszelkie animacje były natychmiastowe i nie powodowały dyskomfortu.

```dart
// Flutter
final reduceMotion = MediaQuery.of(context).disableAnimations;

final duration = reduceMotion
    ? Duration.zero
    : const Duration(milliseconds: 300);
```

### Inne zasady dostępności animacji

- Nie używaj animacji **wyłącznie** do przekazywania informacji — zapewnij tekstowy odpowiednik
- Unikaj migotania > 3 Hz (ryzyko napadu epileptycznego)
- Animacje trwające > 5 s powinny mieć możliwość zatrzymania
- Skup animację na **zmieniającym się** elemencie, nie na tle

## Narzędzia i zasoby

### Narzędzia do projektowania animacji

- **Lottie** — animacje JSON/After Effects, biblioteka dla Android (Compose), iOS i Flutter
- **Rive** — interaktywne animacje wektorowe ze stanem maszynowym
- **Protopie / Figma** — prototypowanie animacji przed implementacją
- **Android Motion Editor** — wizualny edytor ConstraintLayout transitions

### Lottie w Compose

Lottie pozwala odtwarzać animacje stworzone w Adobe After Effects lub edytorach kompatybilnych, eksportowane do lekkiego formatu JSON. Poniższy przykład pokazuje kompletną integrację: `rememberLottieComposition` asynchronicznie ładuje plik z zasobów, `animateLottieCompositionAsState` kontroluje postęp odtwarzania, a `LaunchedEffect` uruchamia callback po zakończeniu animacji. Takie podejście sprawdza się świetnie przy animacjach sukcesu, błędu lub ekranach powitalnych.

```kotlin
// build.gradle (app)
implementation("com.airbnb.android:lottie-compose:6.4.0")

// Kod
@Composable
fun SuccessAnimation(onComplete: () -> Unit) {
    val composition by rememberLottieComposition(
        LottieCompositionSpec.RawRes(R.raw.success_check)
    )
    val progress by animateLottieCompositionAsState(
        composition  = composition,
        isPlaying    = true,
        iterations   = 1
    )

    LottieAnimation(
        composition = composition,
        progress    = { progress },
        modifier    = Modifier.size(120.dp)
    )

    LaunchedEffect(progress) {
        if (progress == 1f) onComplete()
    }
}
```

### Lottie w Flutter

We Flutterze integracja z Lottie jest równie prosta — widget `Lottie.asset` ładuje animację z katalogu `assets` i wyświetla ją bez konieczności tworzenia kontrolera. Parametr `repeat: false` powoduje jednorazowe odtworzenie animacji, co jest typowe dla ekranów potwierdzenia akcji. Callback `onLoaded` informuje o zakończeniu ładowania kompozycji, co pozwala synchronizować animację z logiką aplikacji.

```dart
// pubspec.yaml: lottie: ^3.1.0

Lottie.asset(
  'assets/success_check.json',
  width:  120,
  height: 120,
  repeat: false,
  onLoaded: (composition) {
    // animacja załadowana
  },
)
```

## Linki

- [Compose Animation Guide](https://developer.android.com/develop/ui/compose/animation/introduction)
- [SwiftUI Animations](https://developer.apple.com/documentation/swiftui/animation)
- [Flutter Animations Overview](https://docs.flutter.dev/ui/animations)
- [Material Motion System](https://m3.material.io/styles/motion/overview)
- [Lottie for Android](https://airbnb.io/lottie/#/android)
- [Rive — Interactive Animations](https://rive.app)
