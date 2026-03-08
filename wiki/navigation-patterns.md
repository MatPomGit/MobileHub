# Wzorce Nawigacji w Aplikacjach Mobilnych

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
