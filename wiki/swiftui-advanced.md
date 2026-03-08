# SwiftUI — Zaawansowane Techniki

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

// Widok — automatycznie odświeża się przy zmianie stanu
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
// Matched geometry effect — płynne przejścia między widokami
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

## TipKit — wskazówki w UI (iOS 17+)

```swift
// Definiowanie wskazówki
struct SearchTip: Tip {
    var title: Text { Text("Szukaj produktów") }
    var message: Text? { Text("Użyj paska wyszukiwania, aby znaleźć produkty po nazwie lub kategorii.") }
    var image: Image? { Image(systemName: "magnifyingglass") }

    // Warunek pokazania — tylko po 3 uruchomieniach
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

## SwiftData (iOS 17+) — trwałe przechowywanie

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

## Combine — reaktywne programowanie

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
