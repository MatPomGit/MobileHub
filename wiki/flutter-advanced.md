# Flutter - zaawansowane techniki

Flutter umożliwia tworzenie aplikacji dla Android, iOS, Web i Desktop z jednej bazy kodu. Silnik Impeller (od Flutter 3.10) renderuje UI niezależnie od platformy z wysoką wydajnością - bez natywnych widżetów, ale z dokładnym odwzorowaniem Material i Cupertino.

## Riverpod - zarządzanie stanem

Riverpod to ewolucja Provider - type-safe, testable, bez BuildContext w logice:

```dart
// pubspec.yaml
// flutter_riverpod: ^2.5.1
// riverpod_annotation: ^2.3.5

import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:riverpod_annotation/riverpod_annotation.dart';

part 'task_provider.g.dart';

// AsyncNotifier - asynchroniczny stan z CRUD
@riverpod
class TaskList extends _$TaskList {
  @override
  Future<List<Task>> build() async {
    return ref.watch(taskRepositoryProvider).getTasks();
  }

  Future<void> addTask(String title) async {
    state = const AsyncValue.loading();
    state = await AsyncValue.guard(() async {
      final repo = ref.read(taskRepositoryProvider);
      await repo.createTask(title);
      return repo.getTasks();
    });
  }

  Future<void> toggle(String id) async {
    state = state.whenData((tasks) => tasks.map((t) {
      return t.id == id ? t.copyWith(isDone: !t.isDone) : t;
    }).toList());
    await ref.read(taskRepositoryProvider).toggleTask(id);
  }

  Future<void> delete(String id) async {
    await ref.read(taskRepositoryProvider).deleteTask(id);
    ref.invalidateSelf();  // odśwież
  }
}

// Provider repozytorium
@riverpod
TaskRepository taskRepository(TaskRepositoryRef ref) =>
    TaskRepository(ref.watch(apiClientProvider));

// Filtrowanie - computed provider
@riverpod
List<Task> filteredTasks(FilteredTasksRef ref) {
  final tasks = ref.watch(taskListProvider).valueOrNull ?? [];
  final filter = ref.watch(taskFilterProvider);
  return switch (filter) {
    TaskFilter.all    => tasks,
    TaskFilter.active => tasks.where((t) => !t.isDone).toList(),
    TaskFilter.done   => tasks.where((t) => t.isDone).toList(),
  };
}
```

W widgecie korzystającym z Riverpoda dane asynchroniczne odczytuje się przez `ref.watch`, a obsługę stanów ładowania, błędu i sukcesu zapewnia metoda `when`. Poniższy przykład pokazuje kompletny widżet listy zadań reagujący na wszystkie możliwe stany providera.

```dart
// Użycie w widgecie
class TaskListScreen extends ConsumerWidget {
  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final tasksAsync = ref.watch(taskListProvider);

    return tasksAsync.when(
      data: (tasks) => ListView.builder(
        itemCount: tasks.length,
        itemBuilder: (ctx, i) => TaskTile(task: tasks[i]),
      ),
      loading: () => const Center(child: CircularProgressIndicator()),
      error: (err, stack) => Center(
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Text('Błąd: $err'),
            ElevatedButton(
              onPressed: () => ref.invalidate(taskListProvider),
              child: const Text('Spróbuj ponownie'),
            ),
          ],
        ),
      ),
    );
  }
}
```

## Go Router - nawigacja

Go Router to rekomendowana przez zespół Flutter biblioteka do nawigacji opartej na URL-ach, obsługująca zagnieżdżone trasy, parametry ścieżki i globalne przekierowania (np. do ekranu logowania). Poniższy przykład demonstruje konfigurację routera z ochroną tras oraz typowe wywołania nawigacyjne - `go`, `push` i `pop`.

```dart
// pubspec.yaml: go_router: ^14.0.0
import 'package:go_router/go_router.dart';

final _router = GoRouter(
  initialLocation: '/home',
  debugLogDiagnostics: true,
  redirect: (context, state) {
    final isLoggedIn = AuthService.instance.isLoggedIn;
    final isAuthRoute = state.matchedLocation.startsWith('/auth');
    if (!isLoggedIn && !isAuthRoute) return '/auth/login';
    if (isLoggedIn && isAuthRoute) return '/home';
    return null;
  },
  routes: [
    ShellRoute(
      builder: (context, state, child) => AppShell(child: child),
      routes: [
        GoRoute(path: '/home', builder: (_, __) => const HomeScreen()),
        GoRoute(path: '/tasks', builder: (_, __) => const TaskListScreen(),
          routes: [
            GoRoute(
              path: ':id',
              builder: (_, state) => TaskDetailScreen(id: state.pathParameters['id']!),
            ),
          ]
        ),
        GoRoute(path: '/settings', builder: (_, __) => const SettingsScreen()),
      ],
    ),
    GoRoute(path: '/auth/login', builder: (_, __) => const LoginScreen()),
  ],
);

// MaterialApp z routerem
MaterialApp.router(
  routerConfig: _router,
  title: 'My App',
  theme: ThemeData.from(colorScheme: ColorScheme.fromSeed(seedColor: Colors.indigo)),
)

// Nawigacja w kodzie
context.go('/tasks/42');
context.push('/tasks/new');
context.pop();
context.goNamed('task_detail', pathParameters: {'id': taskId});
```

## Animacje zaawansowane

Flutter oferuje trzy poziomy animacji: deklaratywne przełączanie widoków (`AnimatedSwitcher`), animacje implicit z automatyczną interpolacją (`AnimatedContainer`) oraz animacje explicit z pełną kontrolą przez `AnimationController`. Poniższy przykład pokazuje wszystkie trzy podejścia, dzięki czemu można wybrać właściwe narzędzie do konkretnego efektu wizualnego.

```dart
// AnimatedSwitcher - przełączanie widoków z animacją
AnimatedSwitcher(
  duration: const Duration(milliseconds: 300),
  transitionBuilder: (child, animation) => FadeTransition(
    opacity: animation,
    child: SlideTransition(
      position: Tween<Offset>(begin: const Offset(0, 0.1), end: Offset.zero)
          .animate(CurvedAnimation(parent: animation, curve: Curves.easeOut)),
      child: child,
    ),
  ),
  child: isLoading
      ? const CircularProgressIndicator(key: ValueKey('loading'))
      : TaskContent(key: ValueKey('content'), tasks: tasks),
)

// Implicit animations - proste przejścia
AnimatedContainer(
  duration: const Duration(milliseconds: 200),
  curve: Curves.easeInOut,
  width: isExpanded ? 300 : 100,
  height: isExpanded ? 200 : 50,
  decoration: BoxDecoration(
    color: isExpanded ? Colors.blue : Colors.grey,
    borderRadius: BorderRadius.circular(isExpanded ? 16 : 50),
    boxShadow: isExpanded ? [BoxShadow(blurRadius: 12, color: Colors.black26)] : [],
  ),
)

// Explicit animations - pełna kontrola
class PulseWidget extends StatefulWidget {
  @override
  State<PulseWidget> createState() => _PulseWidgetState();
}

class _PulseWidgetState extends State<PulseWidget> with SingleTickerProviderStateMixin {
  late AnimationController _controller;
  late Animation<double> _scale;

  @override
  void initState() {
    super.initState();
    _controller = AnimationController(vsync: this, duration: const Duration(milliseconds: 1000))
      ..repeat(reverse: true);
    _scale = Tween<double>(begin: 1.0, end: 1.15)
        .animate(CurvedAnimation(parent: _controller, curve: Curves.easeInOut));
  }

  @override
  void dispose() { _controller.dispose(); super.dispose(); }

  @override
  Widget build(BuildContext context) => ScaleTransition(scale: _scale, child: widget.child);
}
```

## Platform Channels - natywny kod

Platform Channels umożliwiają wywołanie kodu natywnego platformy (Android/iOS) bezpośrednio z Dart, co jest niezbędne przy dostępie do funkcji systemowych niedostępnych w samym Flutter. Poniższy przykład po stronie Dart definiuje kanał komunikacji i metodę pobierania poziomu baterii; niezależna sekcja pokazuje, jak ten sam kanał obsłużyć po stronie Androida.

```dart
// Komunikacja z natywnym kodem platformy
class BatteryService {
  static const _channel = MethodChannel('com.example.app/battery');

  static Future<int> getBatteryLevel() async {
    try {
      final int level = await _channel.invokeMethod('getBatteryLevel');
      return level;
    } on PlatformException catch (e) {
      debugPrint('Battery error: ${e.message}');
      return -1;
    }
  }

  // Nasłuch zdarzeń (EventChannel)
  static const _eventChannel = EventChannel('com.example.app/battery_stream');

  static Stream<int> get batteryStream =>
      _eventChannel.receiveBroadcastStream().cast<int>();
}
```

Poniższy fragment to odpowiednik po stronie Androida - implementacja `MethodChannel` w `MainActivity`, która odbiera wywołanie z Dart i zwraca aktualny poziom naładowania baterii za pomocą `BatteryManager`.

```kotlin
// Strona Android - MainActivity.kt
class MainActivity : FlutterActivity() {
    private val CHANNEL = "com.example.app/battery"

    override fun configureFlutterEngine(flutterEngine: FlutterEngine) {
        super.configureFlutterEngine(flutterEngine)
        MethodChannel(flutterEngine.dartExecutor.binaryMessenger, CHANNEL)
            .setMethodCallHandler { call, result ->
                when (call.method) {
                    "getBatteryLevel" -> {
                        val bm = getSystemService(BATTERY_SERVICE) as BatteryManager
                        result.success(bm.getIntProperty(BatteryManager.BATTERY_PROPERTY_CAPACITY))
                    }
                    else -> result.notImplemented()
                }
            }
    }
}
```

## Testy w Flutter

Testy widżetów (widget tests) w Flutter pozwalają weryfikować interfejs użytkownika bez potrzeby uruchamiania fizycznego urządzenia lub emulatora, co znacząco przyspiesza pętlę TDD. Poniższe przykłady pokazują zarówno prosty test wyświetlania komponentu, jak i test integracyjny z Riverpod wykorzystujący mocki repozytorium.

```dart
// Widget test
testWidgets('TaskTile shows title', (tester) async {
  final task = Task(id: '1', title: 'Kup mleko', isDone: false);
  await tester.pumpWidget(MaterialApp(home: TaskTile(task: task)));

  expect(find.text('Kup mleko'), findsOneWidget);
  expect(find.byIcon(Icons.check_circle_outline), findsOneWidget);
});

// Integration test z Riverpod
testWidgets('Add task works', (tester) async {
  await tester.pumpWidget(
    ProviderScope(
      overrides: [
        taskRepositoryProvider.overrideWithValue(MockTaskRepository()),
      ],
      child: const MaterialApp(home: TaskListScreen()),
    ),
  );
  await tester.pumpAndSettle();

  await tester.tap(find.byType(FloatingActionButton));
  await tester.pumpAndSettle();
  await tester.enterText(find.byType(TextField), 'Nowe zadanie');
  await tester.tap(find.text('Zapisz'));
  await tester.pumpAndSettle();

  expect(find.text('Nowe zadanie'), findsOneWidget);
});
```

## Linki

- [Flutter Docs](https://docs.flutter.dev)
- [Riverpod](https://riverpod.dev/docs/introduction/getting_started)
- [Go Router](https://pub.dev/packages/go_router)
- [Flutter Animations](https://docs.flutter.dev/ui/animations)
- [pub.dev](https://pub.dev)

## Flutter Web i Desktop

Flutter pozwala kompilować tę samą bazę kodu na sześć platform: Android, iOS, Web, Windows, macOS i Linux. Uruchomienie nowego celu sprowadza się do jednej komendy, choć każda platforma ma swoje ograniczenia.

### Włączanie celów web i desktop

```bash
# Sprawdzenie dostępnych urządzeń
flutter devices

# Włączenie obsługi web i desktop (raz per projekt)
flutter config --enable-web
flutter config --enable-macos-desktop
flutter config --enable-windows-desktop
flutter config --enable-linux-desktop

# Uruchomienie na konkretnej platformie
flutter run -d chrome
flutter run -d macos
flutter build web --release --base-href /app/
```

### Detekcja platformy i responsywny layout

```dart
import 'package:flutter/foundation.dart' show kIsWeb;
import 'dart:io' show Platform;

class PlatformInfo {
  static bool get isWeb => kIsWeb;
  // Platform.isAndroid etc. rzuca wyjątek na webie - zawsze sprawdzaj kIsWeb wpierw
  static bool get isDesktop =>
      !kIsWeb && (Platform.isWindows || Platform.isMacOS || Platform.isLinux);
  static bool get isMobile =>
      !kIsWeb && (Platform.isAndroid || Platform.isIOS);
}

// Responsywny layout z LayoutBuilder
class AdaptiveScaffold extends StatelessWidget {
  final Widget body;
  const AdaptiveScaffold({required this.body, super.key});

  @override
  Widget build(BuildContext context) {
    return LayoutBuilder(
      builder: (context, constraints) {
        final isWide = constraints.maxWidth >= 720;
        return Scaffold(
          body: Row(
            children: [
              if (isWide)
                NavigationRail(
                  selectedIndex: 0,
                  destinations: const [
                    NavigationRailDestination(icon: Icon(Icons.home), label: Text('Główna')),
                    NavigationRailDestination(icon: Icon(Icons.settings), label: Text('Ustawienia')),
                  ],
                  onDestinationSelected: (_) {},
                ),
              Expanded(child: body),
            ],
          ),
          bottomNavigationBar: isWide ? null : BottomNavigationBar(
            items: const [
              BottomNavigationBarItem(icon: Icon(Icons.home), label: 'Główna'),
              BottomNavigationBarItem(icon: Icon(Icons.settings), label: 'Ustawienia'),
            ],
            currentIndex: 0,
            onTap: (_) {},
          ),
        );
      },
    );
  }
}
```

### Ograniczenia web

| Obszar | Ograniczenie |
|---|---|
| **Dart:io** | Niedostępne na webie - używaj `http` lub `dio` zamiast `HttpClient` |
| **Pliki** | Brak bezpośredniego dostępu do systemu plików; używaj `file_picker` |
| **Wątki** | Brak `Isolate.spawn` na webie; używaj `compute` lub web workers |
| **Hot reload** | Działa, ale wolniej niż na urządzeniu mobilnym |
| **SEO** | Wymaga włączenia renderowania HTML (domyślnie CanvasKit) |

## Flutter DevTools - profilowanie

**Flutter DevTools** to zestaw narzędzi dostępny przez przeglądarkę, który umożliwia głębokie profilowanie aplikacji bez zewnętrznych narzędzi.

```bash
# Uruchomienie DevTools (Flutter SDK zawiera je wbudowane)
flutter pub global activate devtools
flutter run --profile   # tryb profilu - zbliżony do release, z symbolami debugowania
# W logach pojawi się adres: http://127.0.0.1:9100?uri=...
```

### Timeline - inspekcja klatek

Zakładka **Performance** pokazuje oś czasu renderowania. Każda klatka powinna zmieścić się w 16 ms (60 fps). Klatki zaznaczone na czerwono przekraczają budżet. Typowe przyczyny to:

- **Zbyt wiele przebudowań widżetów** - widoczne w zakładce *Widget Rebuilds*; rozwiązanie: `const` konstruktory, `RepaintBoundary`, selektywne nasłuchiwanie w Riverpod (`select`)
- **Shader compilation jank** - pierwsze renderowanie złożonych gradientów; rozwiązanie: `flutter run --cache-sksl` i dołączenie pliku `.sksl.json` do buildu
- **Długie operacje na głównym wątku** - przeniesienie do `Isolate` lub `compute`

### Memory Profiler

```dart
// Wymuszenie GC i sprawdzenie alokacji
import 'dart:developer';

void debugMemory() {
  // Tagowanie obiektów do śledzenia w DevTools
  debugTrackingAllocations = true;
}
```

W zakładce **Memory** możemy:
1. Robić snapshoty sterty i porównywać je (delta) w poszukiwaniu wycieków
2. Filtrować alokacje po typie (np. `Image` - częste źródło wycieków)
3. Użyć *Allocation Tracing* do znalezienia miejsca tworzenia obiektów

### Network Inspector

Zakładka **Network** przechwytuje wszystkie żądania HTTP wykonane przez `dart:io` lub `dio`. Pokazuje nagłówki, ciało żądania/odpowiedzi, czas i status. Działa bez żadnej konfiguracji w trybie debug i profile.

## Internacjonalizacja (i18n)

Flutter oferuje wbudowane wsparcie dla lokalizacji przez pakiet `flutter_localizations` i narzędzie `gen-l10n`.

### Konfiguracja

```yaml
# pubspec.yaml
dependencies:
  flutter:
    sdk: flutter
  flutter_localizations:
    sdk: flutter
  intl: ^0.19.0

flutter:
  generate: true   # włącza gen-l10n
```

```yaml
# l10n.yaml (w katalogu głównym projektu)
arb-dir: lib/l10n
template-arb-file: app_pl.arb
output-localization-file: app_localizations.dart
```

### Pliki ARB

{% raw %}
```json
// lib/l10n/app_pl.arb
{
  "@@locale": "pl",
  "welcomeMessage": "Witaj, {name}!",
  "@welcomeMessage": {
    "description": "Powitanie po zalogowaniu",
    "placeholders": { "name": { "type": "String" } }
  },
  "taskCount": "{count, plural, =0{Brak zadań} =1{1 zadanie} few{{count} zadania} other{{count} zadań}}",
  "@taskCount": {
    "placeholders": { "count": { "type": "int", "format": "decimalPattern"} }
  },
  "lastSync": "Ostatnia synchronizacja: {date}",
  "@lastSync": {
    "placeholders": { "date": { "type": "DateTime", "format": "yMd" } }
  }
}
```
{% endraw %}

{% raw %}
```json
// lib/l10n/app_en.arb
{
  "@@locale": "en",
  "welcomeMessage": "Hello, {name}!",
  "taskCount": "{count, plural, =0{No tasks} =1{1 task} other{{count} tasks}}",
  "lastSync": "Last sync: {date}"
}
```
{% endraw %}

### Użycie w widżetach

```dart
// main.dart - rejestracja delegatów
MaterialApp(
  localizationsDelegates: AppLocalizations.localizationsDelegates,
  supportedLocales: AppLocalizations.supportedLocales,
  locale: const Locale('pl'),
  home: const HomeScreen(),
)

// HomeScreen
@override
Widget build(BuildContext context) {
  final l10n = AppLocalizations.of(context)!;
  final now = DateTime.now();
  return Column(
    children: [
      Text(l10n.welcomeMessage('Anna')),           // "Witaj, Anna!"
      Text(l10n.taskCount(3)),                     // "3 zadania"
      Text(l10n.lastSync(now)),                    // "Ostatnia synchronizacja: 12.06.2025"
    ],
  );
}
```

Po dodaniu nowego klucza do pliku ARB wystarczy uruchomić `flutter gen-l10n` (lub `flutter pub get`), by wygenerować typowaną klasę `AppLocalizations`. Obsługa pluralizacji dla języka polskiego (zero/jeden/kilka/wiele) jest wbudowana w bibliotekę `Intl` i nie wymaga ręcznej logiki warunkowej.
