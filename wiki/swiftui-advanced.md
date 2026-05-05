# SwiftUI - zaawansowane techniki

SwiftUI to deklaratywny framework UI Apple, dostępny od iOS 13. Wersja iOS 17+ przynosi Observable macro i znaczące uproszczenia state management.

## Navigation Stack (iOS 16+)

```swift
// Typebezpieczna nawigacja
enum AppRoute: Hashable {
    case productDetail(id: Int)
    case userProfile(username: String)
    case settings
}

struct RootView: View {
    @State private var path = NavigationPath()

    var body: some View {
        NavigationStack(path: $path) {
            ProductListView()
                .navigationDestination(for: AppRoute.self) { route in
                    switch route {
                    case .productDetail(let id):
                        ProductDetailView(productId: id)
                    case .userProfile(let username):
                        ProfileView(username: username)
                    case .settings:
                        SettingsView()
                    }
                }
        }
        .environment(\.appRouter, AppRouter(path: $path))
    }
}
```

## @Observable macro (iOS 17+)

```swift
// Nowy, uproszczony state management
@Observable
class ShopViewModel {
    var products: [Product] = []
    var isLoading = false
    var searchQuery = ""

    var filteredProducts: [Product] {
        products.filter { product in
            searchQuery.isEmpty ||
            product.name.localizedCaseInsensitiveContains(searchQuery)
        }
    }

    func loadProducts() async {
        isLoading = true
        defer { isLoading = false }
        products = try? await ProductService.fetchAll() ?? []
    }
}

// Widok - automatycznie odświeża się przy zmianie stanu
struct ShopView: View {
    @State private var viewModel = ShopViewModel()

    var body: some View {
        List(viewModel.filteredProducts) { product in
            ProductRow(product: product)
        }
        .searchable(text: $viewModel.searchQuery)
        .overlay { if viewModel.isLoading { ProgressView() } }
        .task { await viewModel.loadProducts() }
    }
}
```

## Custom ViewModifier i Extensions

```swift
// Reużywalny styl karty
struct CardStyle: ViewModifier {
    func body(content: Content) -> some View {
        content
            .padding(16)
            .background(Color(.systemBackground))
            .clipShape(RoundedRectangle(cornerRadius: 12))
            .shadow(color: .black.opacity(0.08), radius: 8, y: 4)
    }
}

extension View {
    func cardStyle() -> some View {
        modifier(CardStyle())
    }

    func onFirstAppear(_ action: @escaping () -> Void) -> some View {
        modifier(FirstAppearModifier(action: action))
    }
}

// Użycie
Text("Produkt A")
    .cardStyle()
```

## Animacje i przejścia

```swift
// Matched geometry effect - płynne przejścia między widokami
struct HeroAnimationView: View {
    @Namespace private var namespace
    @State private var isExpanded = false

    var body: some View {
        if isExpanded {
            DetailCard(namespace: namespace)
                .onTapGesture { withAnimation(.spring()) { isExpanded = false } }
        } else {
            ThumbnailCard(namespace: namespace)
                .onTapGesture { withAnimation(.spring()) { isExpanded = true } }
        }
    }
}

// Phase animacje (iOS 17+)
Image(systemName: "star.fill")
    .phaseAnimator([false, true]) { image, phase in
        image
            .scaleEffect(phase ? 1.2 : 1.0)
            .foregroundStyle(phase ? .yellow : .gray)
    } animation: { phase in
        phase ? .spring(bounce: 0.4) : .easeOut(duration: 0.3)
    }
```

## Linki

- [SwiftUI Documentation](https://developer.apple.com/documentation/swiftui)
- [WWDC SwiftUI Sessions](https://developer.apple.com/videos/swiftui)
- [SwiftUI Lab](https://swiftui-lab.com)

## TipKit - wskazówki w UI (iOS 17+)

```swift
// Definiowanie wskazówki
struct SearchTip: Tip {
    var title: Text { Text("Szukaj produktów") }
    var message: Text? { Text("Użyj paska wyszukiwania, aby znaleźć produkty po nazwie lub kategorii.") }
    var image: Image? { Image(systemName: "magnifyingglass") }

    // Warunek pokazania - tylko po 3 uruchomieniach
    static let appLaunchCount = Event(id: "appLaunch")

    var rules: [Rule] {
        #Rule(Self.appLaunchCount) { $0.donations.count >= 3 }
    }
}

// Wyświetlenie wskazówki przy elemencie UI
struct SearchBar: View {
    private let searchTip = SearchTip()

    var body: some View {
        TextField("Szukaj...", text: $query)
            .popoverTip(searchTip, arrowEdge: .top)
            .task {
                await SearchTip.appLaunchCount.donate()
            }
    }
}
```

## SwiftData (iOS 17+) - trwałe przechowywanie

```swift
import SwiftData

// Model danych
@Model
class Task {
    var id: UUID
    var title: String
    var isCompleted: Bool
    var dueDate: Date?
    @Relationship(deleteRule: .cascade) var subtasks: [Subtask]

    init(title: String, dueDate: Date? = nil) {
        self.id = UUID()
        self.title = title
        self.isCompleted = false
        self.dueDate = dueDate
        self.subtasks = []
    }
}

// Konfiguracja w App entry point
@main
struct TaskApp: App {
    var body: some Scene {
        WindowGroup {
            ContentView()
        }
        .modelContainer(for: [Task.self, Subtask.self])
    }
}

// Odczyt i modyfikacja danych
struct TaskListView: View {
    @Environment(\.modelContext) private var context
    @Query(sort: \Task.dueDate, order: .forward) private var tasks: [Task]
    @Query(filter: #Predicate<Task> { !$0.isCompleted }) private var pendingTasks: [Task]

    func addTask(title: String) {
        let task = Task(title: title)
        context.insert(task)
    }

    func deleteTask(_ task: Task) {
        context.delete(task)
    }
}
```

## Combine - reaktywne programowanie

```swift
import Combine

class NetworkViewModel: ObservableObject {
    @Published var articles: [Article] = []
    @Published var isLoading = false
    @Published var error: Error?

    private var cancellables = Set<AnyCancellable>()

    // Pipeline Combine
    func loadArticles() {
        isLoading = true
        URLSession.shared.dataTaskPublisher(for: URL(string: "https://api.example.com/articles")!)
            .map(\.data)
            .decode(type: [Article].self, decoder: JSONDecoder())
            .receive(on: DispatchQueue.main)
            .handleEvents(receiveCompletion: { [weak self] _ in
                self?.isLoading = false
            })
            .sink(
                receiveCompletion: { [weak self] completion in
                    if case .failure(let error) = completion {
                        self?.error = error
                    }
                },
                receiveValue: { [weak self] articles in
                    self?.articles = articles
                }
            )
            .store(in: &cancellables)
    }

    // Debounce wyszukiwania
    func setupSearchBinding(query: Published<String>.Publisher) {
        query
            .debounce(for: .milliseconds(300), scheduler: RunLoop.main)
            .removeDuplicates()
            .filter { $0.count >= 2 }
            .flatMap { [weak self] q -> AnyPublisher<[Article], Never> in
                self?.searchArticles(q) ?? Just([]).eraseToAnyPublisher()
            }
            .assign(to: &$articles)
    }
}
```

## Widget (WidgetKit)

```swift
// Widget do ekranu głównego
struct TaskWidget: Widget {
    var body: some WidgetConfiguration {
        StaticConfiguration(kind: "TaskWidget", provider: TaskProvider()) { entry in
            TaskWidgetEntryView(entry: entry)
        }
        .configurationDisplayName("Moje Zadania")
        .description("Wyświetla nadchodzące zadania.")
        .supportedFamilies([.systemSmall, .systemMedium])
    }
}

struct TaskProvider: TimelineProvider {
    func getTimeline(in context: Context, completion: @escaping (Timeline<TaskEntry>) -> Void) {
        Task {
            let tasks = await TaskService.fetchUpcoming(limit: 3)
            let entry = TaskEntry(date: .now, tasks: tasks)
            // Odśwież co godzinę
            let nextUpdate = Calendar.current.date(byAdding: .hour, value: 1, to: .now)!
            completion(Timeline(entries: [entry], policy: .after(nextUpdate)))
        }
    }
}

struct TaskWidgetEntryView: View {
    var entry: TaskEntry

    var body: some View {
        VStack(alignment: .leading, spacing: 4) {
            Label("Zadania", systemImage: "checkmark.circle")
                .font(.caption).foregroundStyle(.secondary)
            ForEach(entry.tasks.prefix(3)) { task in
                Text("• \(task.title)")
                    .font(.caption2)
                    .lineLimit(1)
            }
        }
        .padding()
    }
}
```

## Linki dodatkowe

- [SwiftData](https://developer.apple.com/documentation/swiftdata)
- [WidgetKit](https://developer.apple.com/documentation/widgetkit)
- [TipKit](https://developer.apple.com/documentation/tipkit)

## Własne layouty - Layout Protocol (iOS 16+)

Protokół `Layout` wprowadzony w iOS 16 umożliwia tworzenie w pełni własnych algorytmów rozmieszczania widoków. Jest to znacznie potężniejsze rozwiązanie niż `ZStack`/`HStack`/`VStack`, ponieważ daje pełną kontrolę nad rozmiarem i pozycją każdego child view w oparciu o ich preferencje.

Przykładem praktycznego zastosowania jest **masonry grid** (waterfall layout) - wielokolumnowy układ, gdzie elementy mają różne wysokości, a każdy nowy element trafia do najkrótszej kolumny:

```swift
struct MasonryLayout: Layout {
    var columns: Int = 2
    var spacing: CGFloat = 12

    func sizeThatFits(proposal: ProposedViewSize, subviews: Subviews, cache: inout ()) -> CGSize {
        let containerWidth = proposal.width ?? 0
        let columnWidth = (containerWidth - spacing * CGFloat(columns - 1)) / CGFloat(columns)
        var columnHeights = [CGFloat](repeating: 0, count: columns)

        for subview in subviews {
            let minCol = columnHeights.enumerated().min(by: { $0.element < $1.element })!.offset
            let itemSize = subview.sizeThatFits(
                ProposedViewSize(width: columnWidth, height: nil)
            )
            columnHeights[minCol] += itemSize.height + spacing
        }
        return CGSize(width: containerWidth, height: columnHeights.max() ?? 0)
    }

    func placeSubviews(in bounds: CGRect, proposal: ProposedViewSize, subviews: Subviews, cache: inout ()) {
        let columnWidth = (bounds.width - spacing * CGFloat(columns - 1)) / CGFloat(columns)
        var columnHeights = [CGFloat](repeating: 0, count: columns)

        for subview in subviews {
            let minCol = columnHeights.enumerated().min(by: { $0.element < $1.element })!.offset
            let itemSize = subview.sizeThatFits(
                ProposedViewSize(width: columnWidth, height: nil)
            )
            let x = bounds.minX + CGFloat(minCol) * (columnWidth + spacing)
            let y = bounds.minY + columnHeights[minCol]
            subview.place(at: CGPoint(x: x, y: y), proposal: ProposedViewSize(itemSize))
            columnHeights[minCol] += itemSize.height + spacing
        }
    }
}

// Użycie - galeria zdjęć w układzie waterfall
struct PhotoGallery: View {
    let photos: [Photo]

    var body: some View {
        ScrollView {
            MasonryLayout(columns: 2, spacing: 8) {
                ForEach(photos) { photo in
                    AsyncImage(url: photo.url) { image in
                        image.resizable().scaledToFit().cornerRadius(8)
                    } placeholder: { Color.gray.opacity(0.3).cornerRadius(8) }
                }
            }
            .padding()
        }
    }
}
```

Protokół `Layout` wymaga implementacji tylko dwóch metod: `sizeThatFits` (określa rozmiar całego kontenera) i `placeSubviews` (rozmieszcza dzieci). Można go też rozszerzyć o cache'owanie przez typ `Cache`, aby uniknąć ponownych obliczeń przy niezmienionej hierarchii widoków.

## Canvas i SwiftUI Graphics

`Canvas` w SwiftUI to widok zapewniający natywny dostęp do Core Graphics, zoptymalizowany pod kątem wydajności - wszystkie rysowanie odbywa się w jednym przebiegu, bez tworzenia podwidoków. Idealnie nadaje się do wykresów, niestandardowych wskaźników postępu i animacji generatywnych.

```swift
// Pierścień postępu z gradientem i etykietą
struct ProgressRing: View {
    var progress: Double   // 0.0 – 1.0
    var lineWidth: CGFloat = 16
    var label: String

    var body: some View {
        Canvas { context, size in
            let center = CGPoint(x: size.width / 2, y: size.height / 2)
            let radius = min(size.width, size.height) / 2 - lineWidth / 2
            let startAngle = Angle.degrees(-90)
            let endAngle   = Angle.degrees(-90 + 360 * progress)

            // Ścieżka tła
            var bgPath = Path()
            bgPath.addArc(center: center, radius: radius,
                          startAngle: startAngle, endAngle: .degrees(270),
                          clockwise: false)
            context.stroke(bgPath, with: .color(.gray.opacity(0.2)),
                           style: StrokeStyle(lineWidth: lineWidth, lineCap: .round))

            // Ścieżka postępu z gradientem
            var progressPath = Path()
            progressPath.addArc(center: center, radius: radius,
                                startAngle: startAngle, endAngle: endAngle,
                                clockwise: false)
            context.stroke(progressPath,
                           with: .linearGradient(
                                Gradient(colors: [.blue, .purple]),
                                startPoint: .zero,
                                endPoint: CGPoint(x: size.width, y: size.height)
                           ),
                           style: StrokeStyle(lineWidth: lineWidth, lineCap: .round))
        }
        .overlay {
            VStack(spacing: 2) {
                Text("\(Int(progress * 100))%").font(.title2.bold())
                Text(label).font(.caption).foregroundStyle(.secondary)
            }
        }
    }
}

// Prosty wykres liniowy
struct LineChart: View {
    var data: [Double]
    var color: Color = .blue

    var body: some View {
        Canvas { context, size in
            guard data.count > 1 else { return }
            let maxVal = data.max() ?? 1
            let minVal = data.min() ?? 0
            let range  = maxVal - minVal == 0 ? 1 : maxVal - minVal
            let stepX  = size.width / CGFloat(data.count - 1)

            var path = Path()
            for (i, value) in data.enumerated() {
                let x = CGFloat(i) * stepX
                let y = size.height * (1 - CGFloat((value - minVal) / range))
                if i == 0 { path.move(to: CGPoint(x: x, y: y)) }
                else { path.addLine(to: CGPoint(x: x, y: y)) }
            }
            context.stroke(path, with: .color(color),
                           style: StrokeStyle(lineWidth: 2, lineCap: .round, lineJoin: .round))
        }
    }
}
```

`Canvas` można łączyć z `TimelineView` do tworzenia animacji w czasie rzeczywistym - wystarczy przekazać `context.resolveSymbol` dla referencji do innych widoków lub użyć `AnimatableData` do płynnego przejścia wartości.

## Dostępność w SwiftUI

SwiftUI posiada wbudowaną obsługę VoiceOver, ale wiele niestandardowych komponentów wymaga ręcznej konfiguracji modyfikatorów dostępności, aby były prawidłowo czytane przez czytniki ekranu.

```swift
// Karta produktu z pełną obsługą dostępności
struct ProductCard: View {
    let product: Product
    var onAddToCart: () -> Void

    var body: some View {
        HStack {
            AsyncImage(url: product.imageURL) { img in img.resizable().scaledToFit() }
                placeholder: { Color.gray }
                .frame(width: 60, height: 60)
                .cornerRadius(8)
                // Obraz dekoracyjny - VoiceOver powinien go pominąć
                .accessibilityHidden(true)

            VStack(alignment: .leading) {
                Text(product.name).font(.headline)
                Text(product.formattedPrice).foregroundStyle(.secondary)
                if product.isOnSale {
                    Text("Promocja").font(.caption).foregroundStyle(.red)
                }
            }

            Spacer()

            Button(action: onAddToCart) {
                Image(systemName: "cart.badge.plus")
            }
            .accessibilityLabel("Dodaj \(product.name) do koszyka")
            .accessibilityHint("Podwójne stuknięcie dodaje produkt.")
        }
        // Połącz całą kartę w jeden element dostępności
        .accessibilityElement(children: .combine)
        .accessibilityLabel(product.name)
        .accessibilityValue(product.isOnSale ? "\(product.formattedPrice), w promocji" : product.formattedPrice)
        .accessibilityAction(named: "Dodaj do koszyka", onAddToCart)
    }
}

// Niestandardowy rotor VoiceOver - nawigacja po cenach
struct PriceRotorModifier: ViewModifier {
    let products: [Product]

    func body(content: Content) -> some View {
        content.accessibilityRotor("Ceny") {
            ForEach(products) { product in
                AccessibilityRotorEntry(product.formattedPrice, id: product.id)
            }
        }
    }
}

extension View {
    func priceRotor(products: [Product]) -> some View {
        modifier(PriceRotorModifier(products: products))
    }
}
```

| Modyfikator | Zastosowanie |
|---|---|
| `accessibilityLabel` | Opis elementu czytany przez VoiceOver |
| `accessibilityValue` | Aktualny stan (np. "50%, włączone") |
| `accessibilityHint` | Co się stanie po aktywacji |
| `accessibilityAction` | Dodatkowe akcje dostępne przez rotor |
| `accessibilityHidden` | Ukrycie elementu dekoracyjnego |
| `accessibilityRotor` | Własna kategoria nawigacji rotorem |

Dostępność warto testować włączając VoiceOver w Symulatorze (`Command+F5`) lub na fizycznym urządzeniu. Narzędzie **Accessibility Inspector** w Xcode (Xcode → Open Developer Tool → Accessibility Inspector) pozwala podejrzeć drzewo dostępności i wykryć brakujące etykiety bez ręcznego włączania czytnika ekranu.
