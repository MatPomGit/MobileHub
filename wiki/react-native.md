# React Native — JavaScript dla Mobile

React Native (RN) pozwala budować natywne aplikacje mobilne w JavaScript/TypeScript przy użyciu komponentów React. W odróżnieniu od Flutter, RN renderuje przez **natywne widżety platformy** — na Android to Views, na iOS to UIKit.

## Architektura — stara vs nowa

### Stara architektura (do RN 0.70)
```
JavaScript Thread
      │  (asynchroniczny most, serializacja JSON)
      ▼
   Bridge
      │
      ▼
Native Thread (UI, Modules)
```
Problem: bridge jest wąskim gardłem — każde przesłanie danych to serializacja/deserializacja JSON.

### Nowa architektura — JSI + Fabric (RN 0.71+)
```
JavaScript (Hermes engine)
      │  (bezpośrednie wywołania przez JSI — C++)
      ▼
JSI (JavaScript Interface)
      │
   ┌──┴──────────────┐
   │                 │
Fabric (UI)    TurboModules (Native)
(synchroniczne)  (lazy loading)
```

JSI eliminuje bridge — JavaScript bezpośrednio wywołuje kod natywny przez C++ interface.

## Podstawowe komponenty

```typescript
import React, { useState, useEffect, useCallback } from 'react';
import {
    View, Text, FlatList, TouchableOpacity,
    StyleSheet, ActivityIndicator, RefreshControl,
    Alert, Platform
} from 'react-native';

interface Product {
    id: string;
    name: string;
    price: number;
    inStock: boolean;
    imageUrl: string;
}

const ProductScreen: React.FC = () => {
    const [products, setProducts] = useState<Product[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const fetchProducts = useCallback(async () => {
        try {
            const response = await fetch('https://api.example.com/products');
            if (!response.ok) throw new Error(`HTTP ${response.status}`);
            const data: Product[] = await response.json();
            setProducts(data);
            setError(null);
        } catch (e) {
            setError('Nie można pobrać produktów');
            Alert.alert('Błąd', String(e));
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, []);

    useEffect(() => { fetchProducts(); }, [fetchProducts]);

    if (loading) return <ActivityIndicator style={styles.centered} size="large" />;
    if (error) return <Text style={styles.error}>{error}</Text>;

    return (
        <FlatList
            data={products}
            keyExtractor={item => item.id}
            contentContainerStyle={styles.list}
            ItemSeparatorComponent={() => <View style={styles.separator} />}
            refreshControl={
                <RefreshControl
                    refreshing={refreshing}
                    onRefresh={() => { setRefreshing(true); fetchProducts(); }}
                />
            }
            renderItem={({ item }) => (
                <ProductCard product={item} />
            )}
        />
    );
};

const ProductCard: React.FC<{ product: Product }> = ({ product }) => (
    <TouchableOpacity
        style={styles.card}
        activeOpacity={0.7}
        onPress={() => console.log('Open:', product.id)}
    >
        <Text style={styles.name}>{product.name}</Text>
        <Text style={styles.price}>{product.price.toFixed(2)} zł</Text>
        <View style={[styles.badge, !product.inStock && styles.outOfStock]}>
            <Text style={styles.badgeText}>{product.inStock ? 'Dostępny' : 'Brak'}</Text>
        </View>
    </TouchableOpacity>
);

const styles = StyleSheet.create({
    centered:     { flex: 1, justifyContent: 'center', alignItems: 'center' },
    error:        { color: 'red', textAlign: 'center', margin: 16 },
    list:         { padding: 16 },
    separator:    { height: 12 },
    card: {
        padding: 16,
        backgroundColor: '#fff',
        borderRadius: 12,
        // Cienie różnią się między platformami!
        ...Platform.select({
            ios: { shadowColor: '#000', shadowOffset: {width: 0, height: 2}, shadowOpacity: 0.1, shadowRadius: 8 },
            android: { elevation: 4 },
        }),
    },
    name:         { fontSize: 16, fontWeight: '700', color: '#111' },
    price:        { fontSize: 14, color: '#666', marginTop: 4 },
    badge:        { backgroundColor: '#d1fae5', padding: 4, borderRadius: 6, marginTop: 8, alignSelf: 'flex-start' },
    outOfStock:   { backgroundColor: '#fee2e2' },
    badgeText:    { fontSize: 12, fontWeight: '600' },
});

export default ProductScreen;
```

## Nawigacja — React Navigation

```bash
npm install @react-navigation/native @react-navigation/native-stack
npm install react-native-screens react-native-safe-area-context
```

{% raw %}
```typescript
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';

type RootStackParamList = {
    Home: undefined;
    ProductDetail: { productId: string; title: string };
    Settings: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();
const Tab = createBottomTabNavigator();

function HomeTabs() {
    return (
        <Tab.Navigator screenOptions={{ headerShown: false }}>
            <Tab.Screen name="Products" component={ProductScreen}
                options={{ tabBarIcon: ({color}) => <Icon name="grid" color={color} /> }} />
            <Tab.Screen name="Cart" component={CartScreen}
                options={{ tabBarBadge: 3 }} />
            <Tab.Screen name="Profile" component={ProfileScreen} />
        </Tab.Navigator>
    );
}

export default function App() {
    return (
        <NavigationContainer>
            <Stack.Navigator>
                <Stack.Screen name="Home" component={HomeTabs} options={{ headerShown: false }} />
                <Stack.Screen
                    name="ProductDetail"
                    component={ProductDetailScreen}
                    options={({ route }) => ({ title: route.params.title })}
                />
            </Stack.Navigator>
        </NavigationContainer>
    );
}
```
{% endraw %}


## State Management — Zustand

```typescript
// Lekki, prosty state manager — alternatywa dla Redux
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface CartState {
    items: CartItem[];
    addItem: (product: Product) => void;
    removeItem: (productId: string) => void;
    clearCart: () => void;
    totalPrice: () => number;
}

const useCartStore = create<CartState>()(
    persist(
        (set, get) => ({
            items: [],
            addItem: (product) => set(state => {
                const existing = state.items.find(i => i.product.id === product.id);
                if (existing) {
                    return { items: state.items.map(i =>
                        i.product.id === product.id
                            ? { ...i, quantity: i.quantity + 1 }
                            : i
                    )};
                }
                return { items: [...state.items, { product, quantity: 1 }] };
            }),
            removeItem: (id) => set(state => ({
                items: state.items.filter(i => i.product.id !== id)
            })),
            clearCart: () => set({ items: [] }),
            totalPrice: () => get().items.reduce(
                (sum, item) => sum + item.product.price * item.quantity, 0
            ),
        }),
        {
            name: 'cart-storage',
            storage: createJSONStorage(() => AsyncStorage),
        }
    )
);

// Użycie w komponencie
function CartButton({ product }: { product: Product }) {
    const addItem = useCartStore(state => state.addItem);
    return (
        <TouchableOpacity onPress={() => addItem(product)}>
            <Text>Dodaj do koszyka</Text>
        </TouchableOpacity>
    );
}
```

## Native Modules — dostęp do natywnego kodu

```typescript
// Wywołanie natywnego modułu przez TurboModules
import { NativeModules } from 'react-native';

const { BatteryModule } = NativeModules;

// getBatteryLevel zwraca Promise
const level = await BatteryModule.getBatteryLevel();
console.log(`Bateria: ${level}%`);
```

```kotlin
// Android — TurboModule implementation
@ReactModule(name = BatteryModule.NAME)
class BatteryModule(reactContext: ReactApplicationContext) :
    NativeBatteryModuleSpec(reactContext) {

    companion object { const val NAME = "BatteryModule" }

    override fun getBatteryLevel(promise: Promise) {
        val bm = reactApplicationContext.getSystemService(BATTERY_SERVICE) as BatteryManager
        promise.resolve(bm.getIntProperty(BatteryManager.BATTERY_PROPERTY_CAPACITY).toDouble())
    }
}
```

## Expo — szybki start

```bash
# Expo = zero konfiguracji natywnej
npx create-expo-app MyApp --template blank-typescript
cd MyApp && npx expo start

# Skanuj QR kod Expo Go na telefonie — natychmiastowe przeładowanie

# EAS Build — kompilacja w chmurze (nie potrzebujesz Maca dla iOS!)
npm install -g eas-cli && eas login
eas build --platform ios     # Wymaga Apple Developer Account
eas build --platform android
eas submit --platform ios    # Bezpośredni upload do App Store Connect
```

## RN vs Flutter — kiedy co wybrać?

| Kryterium | React Native | Flutter |
|-----------|-------------|---------|
| Zespół zna JS/TS | ✅ Idealny | ❌ Trzeba uczyć Dart |
| Natywny wygląd (szczególnie iOS) | ✅ Lepszy | ⚠️ Własny silnik |
| Wydajność animacji | ⚠️ Wymaga optymalizacji | ✅ Lepsza (Impeller) |
| Ekosystem bibliotek | ✅ npm — ogromny | ⚠️ pub.dev — rośnie |
| Web/Desktop | ⚠️ Eksperymentalny | ✅ Stabilny |

## Animacje — React Native Animated i Reanimated 3

React Native Reanimated 3 to biblioteka animacji działająca na wątku UI (*UI thread*), dzięki czemu animacje osiągają stałe 60–120 fps nawet gdy JS thread jest zajęty. Kluczowe API to `useSharedValue`, `useAnimatedStyle`, `withSpring` i `withTiming`.

```typescript
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  runOnJS,
} from 'react-native-reanimated';

// Fade-in + slide-in po zamontowaniu komponentu
function AnimatedCard({ title }: { title: string }) {
  const opacity = useSharedValue(0);
  const translateY = useSharedValue(30);

  useEffect(() => {
    opacity.value = withTiming(1, { duration: 400 });
    translateY.value = withSpring(0, {
      damping: 18,
      stiffness: 120,
    });
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ translateY: translateY.value }],
  }));

  return (
    <Animated.View style={[styles.card, animatedStyle]}>
      <Text>{title}</Text>
    </Animated.View>
  );
}
```

```typescript
// Animacja naciśnięcia przycisku — scale bounce
function AnimatedButton({ onPress, label }: { onPress: () => void; label: string }) {
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <Animated.View style={animatedStyle}>
      <Pressable
        onPressIn={() => { scale.value = withSpring(0.93); }}
        onPressOut={() => { scale.value = withSpring(1); }}
        onPress={onPress}
      >
        <Text>{label}</Text>
      </Pressable>
    </Animated.View>
  );
}
```

Reanimated 3 integruje się z React Native Gesture Handler przez `useAnimatedGestureHandler` (lub nowe `Gesture` API), umożliwiając budowę swipe-to-dismiss, karuzeli i innych złożonych interakcji bez żadnej komunikacji przez most JS.

## Testowanie — Jest + React Native Testing Library

React Native Testing Library (`@testing-library/react-native`) pozwala testować komponenty z perspektywy użytkownika — znajdując elementy po roli, tekście i etykiecie, a nie po strukturze DOM.

```typescript
// __tests__/LoginForm.test.tsx
import React from 'react';
import { render, fireEvent, waitFor, screen } from '@testing-library/react-native';
import { LoginForm } from '../components/LoginForm';

describe('LoginForm', () => {
  it('wyświetla błąd przy pustym haśle', async () => {
    render(<LoginForm onSuccess={jest.fn()} />);

    fireEvent.changeText(screen.getByPlaceholderText('Email'), 'test@example.com');
    fireEvent.press(screen.getByRole('button', { name: 'Zaloguj się' }));

    await waitFor(() => {
      expect(screen.getByText('Hasło jest wymagane')).toBeTruthy();
    });
  });

  it('wywołuje onSuccess po poprawnym logowaniu', async () => {
    const mockSuccess = jest.fn();
    render(<LoginForm onSuccess={mockSuccess} />);

    fireEvent.changeText(screen.getByPlaceholderText('Email'), 'user@example.com');
    fireEvent.changeText(screen.getByPlaceholderText('Hasło'), 'secret123');
    fireEvent.press(screen.getByRole('button', { name: 'Zaloguj się' }));

    await waitFor(() => expect(mockSuccess).toHaveBeenCalledTimes(1));
  });
});
```

```typescript
// Mockowanie React Navigation w testach
jest.mock('@react-navigation/native', () => ({
  ...jest.requireActual('@react-navigation/native'),
  useNavigation: () => ({ navigate: jest.fn(), goBack: jest.fn() }),
  useRoute: () => ({ params: { id: '42' } }),
}));

// Test async — zmiana stanu po fetch
it('wyświetla listę produktów po załadowaniu', async () => {
  jest.spyOn(global, 'fetch').mockResolvedValue({
    json: async () => [{ id: 1, name: 'Produkt A' }],
  } as Response);

  render(<ProductList />);
  expect(screen.getByTestId('loading-indicator')).toBeTruthy();

  await waitFor(() => {
    expect(screen.getByText('Produkt A')).toBeTruthy();
  });
});
```

Uruchamianie testów: `npx jest --watchAll`. Konfiguracja w `jest.config.js` powinna zawierać `preset: 'react-native'` oraz transformIgnorePatterns dla bibliotek ES module.

## Performance — Hermes i optymalizacje

**Hermes** to silnik JS zoptymalizowany przez Meta dla React Native — kompiluje JavaScript do bytecode podczas budowania, co skraca czas uruchomienia aplikacji nawet o 40%. Jest domyślnie włączony od RN 0.70.

Kluczowe zasady optymalizacji wydajności:

| Problem | Rozwiązanie |
|---------|-------------|
| Długa lista elementów | `FlatList` lub `FlashList` zamiast `ScrollView` |
| Zbędne re-rendery | `React.memo`, `useCallback`, `useMemo` |
| Ciężkie komponenty w liście | `getItemLayout` + stała wysokość elementu |
| Wolne obrazy | `react-native-fast-image` z cache |
| Wiele obliczeń w JS | Worklets Reanimated lub JSI |

```typescript
// FlashList (Shopify) — 10x szybszy od FlatList dla dużych list
import { FlashList } from '@shopify/flash-list';

function ProductList({ products }: { products: Product[] }) {
  const renderItem = useCallback(
    ({ item }: { item: Product }) => <ProductCard product={item} />,
    []
  );

  return (
    <FlashList
      data={products}
      renderItem={renderItem}
      estimatedItemSize={80}   // kluczowe dla wydajności
      keyExtractor={(item) => item.id.toString()}
    />
  );
}

// Zapobieganie zbędnym re-renderom
const ProductCard = React.memo(({ product }: { product: Product }) => (
  <View style={styles.card}>
    <Text>{product.name}</Text>
  </View>
));
```

Aby sprawdzić wydajność, użyj React Native DevTools (Flipper lub nowego DevTools standalone) — zakładka *Profiler* pokazuje czas renderowania każdego komponentu. Zwróć uwagę na komponenty renderujące się częściej niż 30 razy na sekundę.

## Linki

- [React Native Docs](https://reactnative.dev/docs/getting-started)
- [React Navigation](https://reactnavigation.org/docs/getting-started)
- [Expo](https://expo.dev/docs)
- [Zustand](https://github.com/pmndrs/zustand)
- [New Architecture](https://reactnative.dev/docs/new-architecture-intro)
