# Programowanie Cross-Platformowe i PWA

Programowanie cross-platformowe pozwala stworzyć jedną aplikację działającą zarówno na Android, jak i iOS (a często też web i desktop). Zamiast utrzymywać dwa oddzielne kody źródłowe, piszesz jeden — i kompilujesz/uruchamiasz na wielu platformach.

## Porównanie podejść

| Framework | Język | Podejście | Wydajność | Firmy |
|-----------|-------|-----------|-----------|-------|
| **Flutter** | Dart | Własny silnik renderowania | Bardzo wysoka | Google |
| **React Native** | JavaScript/TypeScript | Natywne komponenty | Wysoka | Meta |
| **Kotlin Multiplatform** | Kotlin | Współdzielona logika, natywny UI | Najwyższa | JetBrains |
| **Xamarin/.NET MAUI** | C# | Natywne komponenty | Wysoka | Microsoft |
| **PWA** | HTML/CSS/JS | Przeglądarka | Średnia | — |
| **Ionic** | HTML/CSS/JS + Capacitor | WebView | Średnia | Ionic |

## Flutter

Flutter to framework od Google, który renderuje UI samodzielnie przez własny silnik Skia/Impeller — omijając natywne komponenty platformy. Skutkuje to perfekcyjną spójnością wizualną na wszystkich platformach.

### Podstawy Dart i Flutter

```dart
// Widget statyczny
class MyWidget extends StatelessWidget {
  final String title;
  
  const MyWidget({super.key, required this.title});
  
  @override
  Widget build(BuildContext context) {
    return Card(
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          children: [
            Text(title, style: Theme.of(context).textTheme.headlineSmall),
            const SizedBox(height: 8),
            ElevatedButton(
              onPressed: () => Navigator.pushNamed(context, '/detail'),
              child: const Text('Szczegóły'),
            ),
          ],
        ),
      ),
    );
  }
}

// Widget ze stanem
class Counter extends StatefulWidget {
  const Counter({super.key});
  
  @override
  State<Counter> createState() => _CounterState();
}

class _CounterState extends State<Counter> {
  int _count = 0;
  
  @override
  Widget build(BuildContext context) {
    return Column(
      children: [
        Text('$_count'),
        FloatingActionButton(
          onPressed: () => setState(() => _count++),
          child: const Icon(Icons.add),
        ),
      ],
    );
  }
}
```

### State management w Flutter — Riverpod

```dart
// Provider
final counterProvider = StateNotifierProvider<CounterNotifier, int>((ref) {
  return CounterNotifier();
});

class CounterNotifier extends StateNotifier<int> {
  CounterNotifier() : super(0);
  void increment() => state++;
}

// Użycie w widgecie
class MyScreen extends ConsumerWidget {
  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final count = ref.watch(counterProvider);
    return Text('$count');
  }
}
```

## React Native

React Native używa JavaScript/TypeScript i renderuje przez **natywne** komponenty platformy. UI wygląda "natywnie", bo dosłownie używa natywnych widgetów.

```typescript
// Komponent React Native
import React, { useState } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet } from 'react-native';

interface Task {
  id: string;
  name: string;
  done: boolean;
}

const TaskList: React.FC = () => {
  const [tasks, setTasks] = useState<Task[]>([
    { id: '1', name: 'Nauka Kotlin', done: false },
    { id: '2', name: 'Zrób ćwiczenie', done: true },
  ]);

  const toggleTask = (id: string) => {
    setTasks(prev => 
      prev.map(t => t.id === id ? {...t, done: !t.done} : t)
    );
  };

  return (
    <FlatList
      data={tasks}
      keyExtractor={item => item.id}
      renderItem={({ item }) => (
        <TouchableOpacity onPress={() => toggleTask(item.id)}>
          <View style={styles.row}>
            <Text style={[styles.text, item.done && styles.done]}>
              {item.name}
            </Text>
          </View>
        </TouchableOpacity>
      )}
    />
  );
};

const styles = StyleSheet.create({
  row: { padding: 16, borderBottomWidth: 1, borderColor: '#eee' },
  text: { fontSize: 16 },
  done: { textDecorationLine: 'line-through', color: '#999' }
});
```

## Kotlin Multiplatform (KMP)

KMP współdzieli **logikę biznesową** w Kotlinie, a UI pozostaje natywny (Compose na Android, SwiftUI na iOS). To najszybsze podejście runtime, bo kod kompiluje się do natywnego kodu każdej platformy.

```kotlin
// Wspólna logika (commonMain)
class TaskRepository(private val database: TaskDatabase) {
    suspend fun getTasks(): List<Task> = database.getAllTasks()
    suspend fun addTask(name: String) = database.insertTask(Task(name = name))
}

// Android używa TaskRepository normalnie w ViewModel
// iOS używa TaskRepository przez SKie/SKIE lub iosMain
```

## Progressive Web Apps (PWA)

PWA to aplikacja webowa z możliwościami podobnymi do natywnych: instalacja na ekranie głównym, działanie offline, powiadomienia push.

### Service Worker

```javascript
// sw.js — Service Worker
const CACHE_NAME = 'app-v1';
const URLS_TO_CACHE = ['/', '/index.html', '/app.js', '/styles.css'];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(URLS_TO_CACHE))
  );
});

self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request)
      .then(response => response || fetch(event.request))
  );
});
```

### Web App Manifest

```json
{
  "name": "Moja Aplikacja",
  "short_name": "MojaApp",
  "start_url": "/",
  "display": "standalone",
  "background_color": "#ffffff",
  "theme_color": "#1976d2",
  "icons": [
    { "src": "/icons/icon-192.png", "sizes": "192x192", "type": "image/png" },
    { "src": "/icons/icon-512.png", "sizes": "512x512", "type": "image/png" }
  ]
}
```

### Rejestracja SW w HTML

```javascript
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('/sw.js')
    .then(reg => console.log('SW registered:', reg.scope))
    .catch(err => console.error('SW error:', err));
}
```

## Kiedy co wybrać?

| Sytuacja | Rekomendacja |
|----------|-------------|
| Nowy projekt, duży zespół | Flutter lub React Native |
| Istniejąca aplikacja Android, chcę iOS | Kotlin Multiplatform |
| Wewnętrzne narzędzie, mały budżet | PWA |
| Ścisła integracja ze sprzętem | Natywny (Android Studio / Xcode) |
| Deweloper webowy chce mobile | React Native lub PWA |

## Linki

- [Flutter.dev](https://flutter.dev)
- [React Native](https://reactnative.dev)
- [Kotlin Multiplatform](https://www.jetbrains.com/kotlin-multiplatform/)
- [web.dev — PWA](https://web.dev/progressive-web-apps/)
