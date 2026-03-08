# Flutter — Zaawansowane Techniki

Flutter umożliwia tworzenie aplikacji dla Android, iOS, Web i Desktop z jednej bazy kodu. Silnik Impeller (od Flutter 3.10) renderuje UI niezależnie od platformy z wysoką wydajnością — bez natywnych widżetów, ale z dokładnym odwzorowaniem Material i Cupertino.

## Riverpod — zarządzanie stanem

Riverpod to ewolucja Provider — type-safe, testable, bez BuildContext w logice:

```dart
// pubspec.yaml
// flutter_riverpod: ^2.5.1
// riverpod_annotation: ^2.3.5

import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:riverpod_annotation/riverpod_annotation.dart';

part 'task_provider.g.dart';

// AsyncNotifier — asynchroniczny stan z CRUD
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

// Filtrowanie — computed provider
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

## Go Router — nawigacja

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

```dart
// AnimatedSwitcher — przełączanie widoków z animacją
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

// Implicit animations — proste przejścia
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

// Explicit animations — pełna kontrola
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

## Platform Channels — natywny kod

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

```kotlin
// Strona Android — MainActivity.kt
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
