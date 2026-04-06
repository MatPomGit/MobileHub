# Wzorce nawigacji w aplikacjach mobilnych

Nawigacja definiuje jak użytkownicy przemieszczają się między ekranami. Zły wybór wzorca może sprawić, że intuicyjna aplikacja stanie się frustrująca.

## Hierarchie nawigacji

### Stack Navigation

Najprostszy model — ekrany układają się w stos. Powrót = zdejmujesz wierzchołek.

```
[ Home ] → [ List ] → [ Detail ] → [ Edit ]
                                     ← Back
```

Stosuj gdy: treść ma wyraźną hierarchię (drill-down), użytkownik nawiguje w głąb.

### Tab Navigation (Bottom Navigation)

Równoległe sekcje aplikacji dostępne jednym tapnięciem.

```
┌─────────────────────────────────┐
│         Treść zakładki           │
│                                  │
│                                  │
├──────────┬───────────┬───────────┤
│  🏠 Dom  │ 🔍 Szukaj │ 👤 Profil │
└──────────┴───────────┴───────────┘
```

Stosuj gdy: 3–5 równorzędnych sekcji, każda z własną historią nawigacji.

### Drawer Navigation

Ukryte menu boczne — wychodzi z lewej krawędzi.

Stosuj gdy: wiele sekcji (>5), rzadko odwiedzane, głęboka hierarchia.  
**Uwaga:** Material 3 zaleca Bottom Navigation nad Drawer dla głównych ekranów.

## Implementacja w Jetpack Compose

```kotlin
// Definicja tras
sealed class Screen(val route: String) {
    object Home    : Screen("home")
    object Search  : Screen("search")
    object Profile : Screen("profile/{userId}") {
        fun createRoute(userId: String) = "profile/$userId"
    }
    object Settings : Screen("settings")
}

// NavHost — kontener nawigacji
@Composable
fun AppNavigation() {
    val navController = rememberNavController()

    NavHost(navController = navController, startDestination = Screen.Home.route) {

        composable(Screen.Home.route) {
            HomeScreen(
                onNavigateToProfile = { userId ->
                    navController.navigate(Screen.Profile.createRoute(userId))
                }
            )
        }

        composable(
            route = Screen.Profile.route,
            arguments = listOf(navArgument("userId") { type = NavType.StringType })
        ) { backStackEntry ->
            val userId = backStackEntry.arguments?.getString("userId") ?: return@composable
            ProfileScreen(userId = userId)
        }

        composable(Screen.Settings.route) { SettingsScreen() }
    }
}

// Bottom Navigation
@Composable
fun MainScreen() {
    val navController = rememberNavController()
    val currentBackStack by navController.currentBackStackEntryAsState()
    val currentRoute = currentBackStack?.destination?.route

    val tabs = listOf(
        TabItem(Screen.Home, "Dom", Icons.Default.Home, Icons.Outlined.Home),
        TabItem(Screen.Search, "Szukaj", Icons.Default.Search, Icons.Outlined.Search),
        TabItem(Screen.Profile, "Profil", Icons.Default.Person, Icons.Outlined.Person),
    )

    Scaffold(
        bottomBar = {
            NavigationBar {
                tabs.forEach { tab ->
                    NavigationBarItem(
                        selected = currentRoute == tab.screen.route,
                        onClick = {
                            navController.navigate(tab.screen.route) {
                                popUpTo(navController.graph.findStartDestination().id) {
                                    saveState = true
                                }
                                launchSingleTop = true
                                restoreState = true
                            }
                        },
                        icon = {
                            Icon(
                                if (currentRoute == tab.screen.route) tab.selectedIcon else tab.icon,
                                contentDescription = tab.label
                            )
                        },
                        label = { Text(tab.label) }
                    )
                }
            }
        }
    ) { padding ->
        AppNavigation()
    }
}
```

## Przekazywanie danych między ekranami

```kotlin
// METODA 1 — argumenty URL (proste typy)
navController.navigate("product/42?highlight=true")

composable(
    "product/{id}?highlight={highlight}",
    arguments = listOf(
        navArgument("id") { type = NavType.IntType },
        navArgument("highlight") { type = NavType.BoolType; defaultValue = false }
    )
) { entry ->
    ProductScreen(
        productId = entry.arguments?.getInt("id") ?: 0,
        highlight = entry.arguments?.getBoolean("highlight") ?: false
    )
}

// METODA 2 — SavedStateHandle w ViewModel (złożone obiekty)
@HiltViewModel
class ProductViewModel @Inject constructor(
    savedStateHandle: SavedStateHandle,
    private val repository: ProductRepository
) : ViewModel() {
    private val productId: Int = checkNotNull(savedStateHandle["id"])
    val product = repository.getProduct(productId).stateIn(viewModelScope, SharingStarted.WhileSubscribed(), null)
}
```

## Deep Links

```kotlin
// Deklaracja deep link w NavHost
composable(
    route = Screen.Profile.route,
    deepLinks = listOf(
        navDeepLink { uriPattern = "https://myapp.com/profile/{userId}" },
        navDeepLink { uriPattern = "myapp://profile/{userId}" }
    )
)

// AndroidManifest.xml
// <activity android:name=".MainActivity">
//   <intent-filter>
//     <action android:name="android.intent.action.VIEW" />
//     <category android:name="android.intent.category.DEFAULT" />
//     <category android:name="android.intent.category.BROWSABLE" />
//     <data android:scheme="myapp" android:host="profile" />
//   </intent-filter>
// </activity>
```

## Linki

- [Navigation Compose](https://developer.android.com/jetpack/compose/navigation)
- [Material 3 Navigation](https://m3.material.io/components/navigation-bar/overview)
- [Deep Links](https://developer.android.com/training/app-links/deep-linking)

## Animacje przejść między ekranami

```kotlin
// Niestandardowe animacje przejść w Navigation Compose
NavHost(
    navController = navController,
    startDestination = Screen.Home.route,
    enterTransition = {
        slideIntoContainer(
            towards = AnimatedContentTransitionScope.SlideDirection.Left,
            animationSpec = tween(300, easing = EaseInOut)
        )
    },
    exitTransition = {
        slideOutOfContainer(
            towards = AnimatedContentTransitionScope.SlideDirection.Left,
            animationSpec = tween(300, easing = EaseInOut)
        )
    },
    popEnterTransition = {
        slideIntoContainer(
            towards = AnimatedContentTransitionScope.SlideDirection.Right,
            animationSpec = tween(300)
        )
    },
    popExitTransition = {
        slideOutOfContainer(
            towards = AnimatedContentTransitionScope.SlideDirection.Right,
            animationSpec = tween(300)
        )
    }
) {
    composable(Screen.Home.route) { HomeScreen() }
    composable(Screen.Detail.route) { DetailScreen() }
}
```

## NavigationSuiteScaffold — adaptacyjna nawigacja

Material 3 oferuje NavigationSuiteScaffold który automatycznie dobiera Bottom Bar, Rail lub Drawer:

```kotlin
@Composable
fun AdaptiveNavigation() {
    val navController = rememberNavController()
    val currentBackStack by navController.currentBackStackEntryAsState()
    val currentRoute = currentBackStack?.destination?.route

    val destinations = listOf(
        TopDestination(Screen.Home, "Dom", Icons.Default.Home),
        TopDestination(Screen.Search, "Szukaj", Icons.Default.Search),
        TopDestination(Screen.Library, "Biblioteka", Icons.Default.Book),
        TopDestination(Screen.Profile, "Profil", Icons.Default.Person),
    )

    NavigationSuiteScaffold(
        navigationSuiteItems = {
            destinations.forEach { dest ->
                item(
                    selected = currentRoute == dest.screen.route,
                    onClick = {
                        navController.navigate(dest.screen.route) {
                            popUpTo(navController.graph.findStartDestination().id) { saveState = true }
                            launchSingleTop = true; restoreState = true
                        }
                    },
                    icon = { Icon(dest.icon, contentDescription = dest.label) },
                    label = { Text(dest.label) }
                )
            }
        }
    ) {
        AppNavHost(navController = navController)
    }
    // Na telefonie: Bottom Navigation Bar
    // Na tablecie/składanym: Navigation Rail
    // Na dużym tablecie: Navigation Drawer
}
```

## Wzorzec Backstackowy — modal vs push

```kotlin
// Modal (dialog/bottom sheet) — nie wchodzi do back stack
@Composable
fun ProductScreen(navController: NavController) {
    var showShareSheet by remember { mutableStateOf(false) }

    if (showShareSheet) {
        ModalBottomSheet(onDismissRequest = { showShareSheet = false }) {
            ShareContent()
        }
    }

    // Push — wchodzi do back stack, cofnięcie wraca do ProductScreen
    Button(onClick = { navController.navigate(Screen.Reviews.createRoute(productId)) }) {
        Text("Zobacz recenzje")
    }
}
```

## Linki dodatkowe

- [Animated Navigation](https://developer.android.com/jetpack/compose/animation/composables-modifiers#animatedcontent)
- [NavigationSuiteScaffold](https://developer.android.com/reference/kotlin/androidx/compose/material3/adaptive/navigationsuite/package-summary)
- [Multi-pane layouts](https://developer.android.com/guide/topics/large-screens/support-different-screen-sizes)

---

## 1. Nawigacja w iOS (UIKit)

UIKit dostarcza dwa fundamentalne kontrolery nawigacji: `UINavigationController` do nawigacji stosowej oraz `UITabBarController` do nawigacji zakładkowej.

### UINavigationController — stos ekranów

`UINavigationController` zarządza stosem `UIViewController`. Każde przejście w głąb hierarchii to operacja `push`, powrót to `pop`.

```swift
// AppDelegate / SceneDelegate — konfiguracja root
let homeVC = HomeViewController()
let navController = UINavigationController(rootViewController: homeVC)
window?.rootViewController = navController

// Przejście do następnego ekranu (push)
class HomeViewController: UIViewController {
    func showDetail(for item: Item) {
        let detailVC = DetailViewController(item: item)
        // animated: true dodaje standardową animację przesunięcia
        navigationController?.pushViewController(detailVC, animated: true)
    }
}

// Powrót (pop)
class DetailViewController: UIViewController {
    @IBAction func backTapped() {
        navigationController?.popViewController(animated: true)
    }

    func backToRoot() {
        // Jednorazowy powrót do root bez pośrednich ekranów
        navigationController?.popToRootViewController(animated: true)
    }
}
```

Pasek nawigacji (`UINavigationBar`) wyświetla tytuł ekranu i przycisk Wstecz automatycznie. Możesz dostosować wygląd przez `navigationItem`:

```swift
override func viewDidLoad() {
    super.viewDidLoad()
    title = "Szczegóły produktu"
    navigationItem.rightBarButtonItem = UIBarButtonItem(
        barButtonSystemItem: .edit,
        target: self,
        action: #selector(editTapped)
    )
}
```

### UITabBarController — równoległe sekcje

```swift
class MainTabBarController: UITabBarController {

    override func viewDidLoad() {
        super.viewDidLoad()

        let homeNav = UINavigationController(rootViewController: HomeViewController())
        homeNav.tabBarItem = UITabBarItem(title: "Dom", image: UIImage(systemName: "house"), tag: 0)

        let searchNav = UINavigationController(rootViewController: SearchViewController())
        searchNav.tabBarItem = UITabBarItem(title: "Szukaj", image: UIImage(systemName: "magnifyingglass"), tag: 1)

        let profileNav = UINavigationController(rootViewController: ProfileViewController())
        profileNav.tabBarItem = UITabBarItem(title: "Profil", image: UIImage(systemName: "person"), tag: 2)

        viewControllers = [homeNav, searchNav, profileNav]
    }
}
```

Każda zakładka posiada **własny, niezależny stos nawigacji** — przejście do innej zakładki nie niszczy historii poprzedniej.

---

## 2. SwiftUI Navigation

SwiftUI oferuje deklaratywne API nawigacji. Począwszy od iOS 16 zalecane jest `NavigationStack`, które zastępuje przestarzałe `NavigationView`.

### NavigationStack i NavigationLink (iOS 16+)

```swift
// Model ścieżki — umożliwia programową nawigację
@Observable
class AppRouter {
    var path = NavigationPath()

    func push(_ route: AppRoute) { path.append(route) }
    func pop() { path.removeLast() }
    func popToRoot() { path.removeLast(path.count) }
}

enum AppRoute: Hashable {
    case productDetail(id: Int)
    case userProfile(username: String)
    case settings
}

// Główny widok
struct RootView: View {
    @State private var router = AppRouter()

    var body: some View {
        NavigationStack(path: $router.path) {
            HomeView()
                .navigationDestination(for: AppRoute.self) { route in
                    switch route {
                    case .productDetail(let id):
                        ProductDetailView(productId: id)
                    case .userProfile(let username):
                        UserProfileView(username: username)
                    case .settings:
                        SettingsView()
                    }
                }
        }
        .environment(router)
    }
}

// Nawigacja z widoku potomnego
struct HomeView: View {
    @Environment(AppRouter.self) private var router

    var body: some View {
        List(products) { product in
            Button(product.name) {
                router.push(.productDetail(id: product.id))
            }
        }
        .navigationTitle("Produkty")
    }
}
```

### NavigationSplitView — układy dwu- i trzykolumnowe

`NavigationSplitView` jest przeznaczony dla iPada i macOS — automatycznie przełącza się na pełnoekranowy stos na iPhone.

```swift
struct SplitRootView: View {
    @State private var selectedCategory: Category?
    @State private var selectedItem: Item?

    var body: some View {
        NavigationSplitView {
            // Kolumna lewa — lista kategorii
            List(categories, selection: $selectedCategory) { category in
                Text(category.name).tag(category)
            }
            .navigationTitle("Kategorie")
        } content: {
            // Kolumna środkowa — elementy wybranej kategorii
            if let category = selectedCategory {
                List(category.items, selection: $selectedItem) { item in
                    Text(item.title).tag(item)
                }
                .navigationTitle(category.name)
            } else {
                Text("Wybierz kategorię")
            }
        } detail: {
            // Kolumna prawa — szczegóły elementu
            if let item = selectedItem {
                ItemDetailView(item: item)
            } else {
                Text("Wybierz element")
            }
        }
    }
}
```

---

## 3. Deep Linking — szczegółowe omówienie

Deep linking pozwala uruchomić konkretny ekran aplikacji bezpośrednio z zewnętrznego źródła (link w przeglądarce, powiadomienie push, inna aplikacja).

### Android — Intent Filters i App Links

W pliku `AndroidManifest.xml` deklarujesz schemat URL obsługiwany przez aktywność:

```xml
<activity android:name=".MainActivity" android:exported="true">
    <!-- Custom URL scheme: myapp://product/42 -->
    <intent-filter>
        <action android:name="android.intent.action.VIEW" />
        <category android:name="android.intent.category.DEFAULT" />
        <category android:name="android.intent.category.BROWSABLE" />
        <data android:scheme="myapp" />
    </intent-filter>

    <!-- App Links (HTTPS): https://myapp.com/product/42 -->
    <intent-filter android:autoVerify="true">
        <action android:name="android.intent.action.VIEW" />
        <category android:name="android.intent.category.DEFAULT" />
        <category android:name="android.intent.category.BROWSABLE" />
        <data android:scheme="https" android:host="myapp.com" />
    </intent-filter>
</activity>
```

App Links wymagają pliku `/.well-known/assetlinks.json` na serwerze potwierdzającego właściciela domeny — tylko wtedy system otwiera link bezpośrednio w aplikacji bez pytania użytkownika.

### iOS — Universal Links i Custom URL Schemes

```swift
// Info.plist — rejestracja schematu URL
// Klucz: CFBundleURLTypes → CFBundleURLSchemes → "myapp"

// SceneDelegate — obsługa przychodzącego linku
func scene(_ scene: UIScene,
           openURLContexts URLContexts: Set<UIOpenURLContext>) {
    guard let url = URLContexts.first?.url else { return }
    DeepLinkHandler.shared.handle(url: url)
}

// Universal Links — metoda w AppDelegate
func application(_ application: UIApplication,
                 continue userActivity: NSUserActivity,
                 restorationHandler: @escaping ([UIUserActivityRestoring]?) -> Void) -> Bool {
    guard userActivity.activityType == NSUserActivityTypeBrowsingWeb,
          let url = userActivity.webpageURL else { return false }
    return DeepLinkHandler.shared.handle(url: url)
}
```

Universal Links wymagają pliku `/.well-known/apple-app-site-association` (AASA) na serwerze z listą obsługiwanych ścieżek oraz identyfikatorem aplikacji.

---

## 4. Animacje przejść — Compose i SwiftUI

### Niestandardowe animacje w SwiftUI

SwiftUI pozwala definiować własne efekty wejścia i wyjścia przez protokół `Transition`:

```swift
// Własna animacja — wejście od dołu z fade
struct SlideUpTransition: Transition {
    func body(content: Content, phase: TransitionPhase) -> some View {
        content
            .opacity(phase.isIdentity ? 1.0 : 0.0)
            .offset(y: phase.isIdentity ? 0 : 60)
            .animation(.spring(response: 0.4, dampingFraction: 0.8), value: phase.isIdentity)
    }
}

// Użycie przy nawigacji modalnej
struct ParentView: View {
    @State private var showDetails = false

    var body: some View {
        VStack {
            Button("Pokaż szczegóły") { showDetails = true }
        }
        .sheet(isPresented: $showDetails) {
            DetailsView()
                .transition(.asymmetric(
                    insertion: .move(edge: .bottom).combined(with: .opacity),
                    removal: .move(edge: .bottom).combined(with: .opacity)
                ))
        }
    }
}
```

### Animacje na poziomie trasy w Compose

W Jetpack Compose możesz ustawić animacje **per ekran**, nadpisując domyślne ustawienia `NavHost`:

```kotlin
composable(
    route = Screen.Detail.route,
    enterTransition = {
        // Wejście: fade + skalowanie z centrum
        fadeIn(tween(250)) + scaleIn(
            initialScale = 0.92f,
            animationSpec = tween(250, easing = EaseOutQuart)
        )
    },
    exitTransition = {
        // Wyjście przy nawigacji dalej: fade out
        fadeOut(tween(200))
    },
    popEnterTransition = {
        // Powrót z głębszego ekranu
        fadeIn(tween(200))
    },
    popExitTransition = {
        // Opuszczanie przez pop: skalowanie w dół + fade
        fadeOut(tween(250)) + scaleOut(
            targetScale = 0.92f,
            animationSpec = tween(250, easing = EaseInQuart)
        )
    }
) {
    DetailScreen()
}
```

**Wskazówka:** Animacje przejść powinny trwać **200–350 ms** — krótsze są niezauważalne, dłuższe spowalniają odczuwalnie UX.

---

## 5. Nawigacja a dostępność

Dostępność nawigacji jest obowiązkiem prawnym w wielu krajach (WCAG 2.1, Section 508) i wpływa na ocenę aplikacji w sklepach.

### TalkBack (Android) i VoiceOver (iOS)

Czytniki ekranu ogłaszają zawartość ekranu po każdym przejściu. Aby poprawnie opisać nowy ekran:

```kotlin
// Compose — semantyczny opis ekranu dla TalkBack
@Composable
fun ProductDetailScreen(product: Product) {
    // Focusuj pierwszy element po wejściu na ekran
    val focusRequester = remember { FocusRequester() }

    LaunchedEffect(Unit) {
        // Krótkie opóźnienie czeka na zakończenie animacji przejścia
        delay(300)
        focusRequester.requestFocus()
    }

    Column {
        Text(
            text = product.name,
            modifier = Modifier
                .focusRequester(focusRequester)
                .focusable()
                .semantics { contentDescription = "Produkt: ${product.name}" }
        )
        // ...
    }
}
```

```swift
// SwiftUI — dostępność po przejściu
struct ProductDetailView: View {
    let product: Product
    @AccessibilityFocusState private var isTitleFocused: Bool

    var body: some View {
        VStack(alignment: .leading) {
            Text(product.name)
                .font(.largeTitle)
                .accessibilityLabel("Produkt: \(product.name)")
                .accessibilityFocused($isTitleFocused)
        }
        .onAppear { isTitleFocused = true }
    }
}
```

### Obsługa przycisku Wstecz i gestów

Na Androidzie przycisk systemowy Wstecz (`BackHandler`) wymaga jawnej obsługi gdy domyślne zachowanie jest nieodpowiednie:

```kotlin
@Composable
fun EditFormScreen(navController: NavController, hasUnsavedChanges: Boolean) {
    var showDiscardDialog by remember { mutableStateOf(false) }

    BackHandler(enabled = hasUnsavedChanges) {
        // Zamiast natychmiastowego powrotu — pytamy użytkownika
        showDiscardDialog = true
    }

    if (showDiscardDialog) {
        AlertDialog(
            onDismissRequest = { showDiscardDialog = false },
            title = { Text("Niezapisane zmiany") },
            text = { Text("Czy chcesz odrzucić zmiany?") },
            confirmButton = {
                TextButton(onClick = { navController.popBackStack() }) { Text("Odrzuć") }
            },
            dismissButton = {
                TextButton(onClick = { showDiscardDialog = false }) { Text("Kontynuuj edycję") }
            }
        )
    }
}
```

### Minimalny rozmiar obszaru tapnięcia

Material Design i Apple HIG wymagają minimalnego obszaru dotyku **48×48 dp (Android)** i **44×44 pt (iOS)**. Zbyt małe cele nawigacyjne są szczególnie problematyczne dla użytkowników z drżeniem rąk.

```kotlin
// Kotlin — wymuszenie minimalnego rozmiaru
NavigationBarItem(
    modifier = Modifier.defaultMinSize(minWidth = 48.dp, minHeight = 48.dp),
    // ...
)
```

```swift
// SwiftUI — zwiększenie obszaru tapnięcia bez zmiany wizualnego rozmiaru
Button(action: goBack) {
    Image(systemName: "chevron.left")
        .padding(12) // powiększa obszar dotyku
        .contentShape(Rectangle())
}
```

---

## Linki — iOS i dostępność

- [UINavigationController](https://developer.apple.com/documentation/uikit/uinavigationcontroller)
- [NavigationStack (SwiftUI)](https://developer.apple.com/documentation/swiftui/navigationstack)
- [Universal Links](https://developer.apple.com/documentation/xcode/supporting-universal-links-in-your-app)
- [Android App Links](https://developer.android.com/training/app-links)
- [Accessibility in Compose](https://developer.android.com/jetpack/compose/accessibility)
- [Accessibility in SwiftUI](https://developer.apple.com/documentation/swiftui/accessibility-fundamentals)
