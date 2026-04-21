# Programowanie cross-platformowe i PWA

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

Dart to silnie typowany język kompilowany AOT, którego składnia jest bliska Javie i Kotlinowi, co ułatwia naukę programistom mobilnym. W Flutterze każdy element interfejsu to widget — niezmienne drzewa opisu UI, które Flutter renderuje samodzielnie na canvasie. Poniższy przykład pokazuje dwa fundamentalne typy widgetów: `StatelessWidget` (bez wewnętrznego stanu) oraz `StatefulWidget` (ze stanem zarządzanym przez `setState`).

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

Riverpod to nowoczesne podejście do zarządzania stanem w Flutterze, które rozwiązuje ograniczenia oryginalnego Provider'a poprzez pełne oddzielenie stanu od drzewa widgetów. Providerzy są globalne, type-safe i testowalne bez kontekstu Buildera. Poniższy przykład demonstruje definicję `StateNotifierProvider` z prostym licznikiem oraz jego obserwację w widgecie `ConsumerWidget`.

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

Service Worker to skrypt działający w tle przeglądarki, niezależnie od strony, który przechwytuje żądania sieciowe i zarządza lokalnym cache. Rejestrowanie zasobów podczas instalacji (`install` event) umożliwia aplikacji działanie całkowicie offline po pierwszym odwiedzeniu. Poniższy przykład implementuje strategię „cache-first": odpowiedź pobierana jest najpierw z cache, a sieć jest odwiedzana tylko gdy zasobu nie ma lokalnie.

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

Plik `manifest.json` informuje przeglądarkę, jak wyświetlać aplikację po zainstalowaniu na ekranie głównym — nadaje jej nazwę, ikony, kolor paska systemowego i tryb wyświetlania `standalone` (bez paska przeglądarki). Jest to kluczowy plik każdej PWA, bez którego przeglądarka nie zaproponuje użytkownikowi instalacji aplikacji. Poniższy przykład przedstawia kompletną konfigurację manifestu z dwoma rozmiarami ikon wymaganymi przez standard PWA.

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

Service Worker musi zostać zarejestrowany przez główny skrypt aplikacji — przeglądarka pobiera plik SW i instaluje go, jeśli jeszcze nie jest aktywny lub zmieniła się jego treść. Rejestracja jest asynchroniczna, a wynik informuje o zasięgu (`scope`) kontrolowanym przez Service Workera. Poniższy fragment to minimalna, poprawna rejestracja, którą należy umieścić w głównym pliku HTML lub skrypcie inicjalizującym aplikację.

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

## Ionic + Capacitor — web-first mobile

Ionic to framework UI oparty na Web Components, który renderuje aplikację w natywnym `WebView`. Capacitor (następca Cordovy) zapewnia most do natywnych API — aparat, system plików, powiadomienia — przez jednolite TypeScript API niezależne od platformy.

```bash
# Nowy projekt Ionic + React + Capacitor
npm create ionic@latest myApp -- --type react --capacitor
cd myApp && npm install

# Dodanie platform
npx cap add android
npx cap add ios

# Synchronizacja po każdej zmianie web
npx cap sync

# Uruchomienie na urządzeniu
npx cap run android --livereload
```

```typescript
// Dostęp do aparatu przez Capacitor Plugin
import { Camera, CameraResultType, CameraSource } from '@capacitor/camera';
import { Filesystem, Directory } from '@capacitor/filesystem';

async function takePhotoAndSave(): Promise<string> {
  const photo = await Camera.getPhoto({
    resultType: CameraResultType.Base64,
    source: CameraSource.Camera,
    quality: 85,
  });

  const fileName = `photo_${Date.now()}.jpeg`;
  await Filesystem.writeFile({
    path: fileName,
    data: photo.base64String!,
    directory: Directory.Data,
  });

  return fileName;
}
```

```typescript
// Komponent Ionic React — lista z pull-to-refresh
import { IonContent, IonList, IonItem, IonRefresher, IonRefresherContent } from '@ionic/react';

function ProductListPage() {
  const [products, setProducts] = useState<Product[]>([]);

  const handleRefresh = async (event: CustomEvent) => {
    await loadProducts();
    event.detail.complete();
  };

  return (
    <IonContent>
      <IonRefresher slot="fixed" onIonRefresh={handleRefresh}>
        <IonRefresherContent />
      </IonRefresher>
      <IonList>
        {products.map(p => (
          <IonItem key={p.id}>{p.name}</IonItem>
        ))}
      </IonList>
    </IonContent>
  );
}
```

Ionic sprawdza się najlepiej dla aplikacji wewnętrznych i MVP, gdzie czas dostarczenia jest priorytetem, a zespół zna React lub Angular. Wydajność animacji jest niższa niż Flutter czy React Native (natywny rendering), ale od Ionic 6 z nowymi animacjami jest akceptowalna dla większości przypadków użycia.

## Nawigacja i routing cross-platform

Każda z platform cross-platform ma własne podejście do nawigacji. Dobór odpowiedniego systemu ma duży wpływ na czytelność kodu i doświadczenie użytkownika.

| Framework | Biblioteka nawigacji | Podejście |
|-----------|---------------------|-----------|
| Flutter | Navigator 2.0 / GoRouter | Deklaratywny routing oparty na URL |
| React Native | React Navigation 6+ | Stack, Tab, Drawer navigators |
| KMP | Voyager / Decompose | Współdzielona nawigacja w commonMain |
| Ionic/PWA | React Router / Angular Router | Klient-side routing w SPA |

```dart
// Flutter — GoRouter (zalecane od Flutter 3.7)
final router = GoRouter(
  initialLocation: '/home',
  routes: [
    GoRoute(path: '/home', builder: (ctx, state) => const HomeScreen()),
    GoRoute(
      path: '/product/:id',
      builder: (ctx, state) {
        final id = state.pathParameters['id']!;
        return ProductScreen(productId: id);
      },
    ),
    ShellRoute(
      builder: (ctx, state, child) => MainShell(child: child),
      routes: [
        GoRoute(path: '/cart', builder: (_, __) => const CartScreen()),
        GoRoute(path: '/profile', builder: (_, __) => const ProfileScreen()),
      ],
    ),
  ],
);
```

{% raw %}
```typescript
// React Navigation — Native Stack + Bottom Tabs
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';

const Stack = createNativeStackNavigator<RootStackParamList>();
const Tab = createBottomTabNavigator();

function TabNavigator() {
  return (
    <Tab.Navigator screenOptions={{ headerShown: false }}>
      <Tab.Screen name="Home" component={HomeScreen} />
      <Tab.Screen name="Cart" component={CartScreen} />
    </Tab.Navigator>
  );
}

function RootNavigator() {
  return (
    <Stack.Navigator>
      <Stack.Screen name="Main" component={TabNavigator} options={{ headerShown: false }} />
      <Stack.Screen name="Product" component={ProductScreen} />
    </Stack.Navigator>
  );
}
```
{% endraw %}

GoRouter i React Navigation stosują podobną filozofię deklaratywną. KMP Voyager pozwala współdzielić logikę nawigacji między Androidem i iOS przy użyciu `Screen` i `Navigator` w `commonMain`, co redukuje duplikację kodu.

## Testowanie aplikacji cross-platform

Każda platforma cross-platform ma własne narzędzia testowe, ale zasady pozostają te same: testy jednostkowe logiki, testy widgetów/komponentów, testy integracyjne i E2E.

```dart
// Flutter — test widgetu (widget test)
import 'package:flutter_test/flutter_test.dart';

void main() {
  testWidgets('Przycisk dodaj do koszyka wywołuje callback', (tester) async {
    bool pressed = false;

    await tester.pumpWidget(
      MaterialApp(
        home: ProductCard(
          product: Product(id: '1', name: 'Test', price: 9.99),
          onAddToCart: () => pressed = true,
        ),
      ),
    );

    await tester.tap(find.text('Dodaj do koszyka'));
    await tester.pump();

    expect(pressed, isTrue);
  });
}
```

{% raw %}
```typescript
// React Native Testing Library — test komponentu
import { render, fireEvent, screen } from '@testing-library/react-native';
import { CartItem } from '../components/CartItem';

test('usuwa pozycję po naciśnięciu przycisku usuń', () => {
  const onRemove = jest.fn();
  render(<CartItem item={{ id: '1', name: 'Produkt', qty: 2 }} onRemove={onRemove} />);

  fireEvent.press(screen.getByRole('button', { name: 'Usuń' }));
  expect(onRemove).toHaveBeenCalledWith('1');
});
```
{% endraw %}

```kotlin
// KMP — commonTest (testy logiki biznesowej współdzielone między platformami)
class CartViewModelTest {
    private val viewModel = CartViewModel(FakeCartRepository())

    @Test
    fun `dodanie produktu zwiększa liczbę pozycji`() {
        viewModel.addProduct(Product(id = "1", name = "Test", price = 9.99))
        assertEquals(1, viewModel.items.value.size)
    }
}
```

```bash
# Playwright — testy E2E dla PWA
npx playwright test --project=chromium

# playwright.config.ts — konfiguracja dla mobile viewport
use: {
  viewport: { width: 390, height: 844 },  // iPhone 14
  userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 16_0 ...)',
}
```

Uruchamianie wszystkich testów: `flutter test` (Flutter), `npx jest` (React Native), `./gradlew :shared:testDebugUnitTest` (KMP). W CI/CD warto uruchamiać testy E2E na symulatorach/emulatorach przez GitHub Actions z `reactivecircus/android-emulator-runner` lub `maxim-lobanov/setup-xcode`.

## Linki

- [Flutter.dev](https://flutter.dev)
- [React Native](https://reactnative.dev)
- [Kotlin Multiplatform](https://www.jetbrains.com/kotlin-multiplatform/)
- [web.dev — PWA](https://web.dev/progressive-web-apps/)
