# Programowanie natywne iOS - Xcode i Swift

Xcode to oficjalne IDE Apple dla systemów iOS, iPadOS, macOS, watchOS i tvOS. Wymaga komputera Mac. Językiem programowania jest **Swift** - bezpieczny, szybki i nowoczesny język stworzony przez Apple w 2014 roku.

## Wymagania środowiska

- macOS Ventura lub nowszy
- Xcode 16+ (pobranie z Mac App Store - uwaga: ~12 GB)
- Apple Developer Account (bezpłatne do testów na symulatorze, $99/rok do dystrybucji)

## Struktura projektu iOS

```
MojaAplikacja/
├── MojaAplikacja/
│   ├── App/
│   │   ├── MojaAplikacjaApp.swift   ← punkt wejścia
│   │   └── ContentView.swift
│   ├── Views/                       ← widoki SwiftUI
│   ├── ViewModels/                  ← logika prezentacji
│   ├── Models/                      ← modele danych
│   ├── Services/                    ← sieć, lokalna baza
│   ├── Assets.xcassets/             ← obrazy, kolory
│   └── Info.plist                   ← metadane aplikacji
├── MojaAplikacjaTests/
└── MojaAplikacja.xcodeproj
```

## Swift - podstawy języka

```swift
// Stałe i zmienne
let name = "Anna"          // stała - nie można zmienić
var age = 25               // zmienna

// Opcjonale - kluczowa cecha Swift
var email: String? = nil   // może być nil
let safeEmail = email ?? "brak@email.com"  // operator ?? - wartość domyślna

// Rozpakowywanie bezpieczne (guard let)
func greetUser(email: String?) {
    guard let email = email else {
        print("Brak emaila")
        return
    }
    print("Hej, \(email)!")
}

// Struktury i klasy
struct User {
    let id: UUID = UUID()
    var name: String
    var age: Int
}

// Async/await
func fetchData() async throws -> [User] {
    let url = URL(string: "https://api.example.com/users")!
    let (data, _) = try await URLSession.shared.data(from: url)
    return try JSONDecoder().decode([User].self, from: data)
}
```

## SwiftUI - deklaratywny UI

SwiftUI używa tego samego koncepcyjnego podejścia co Jetpack Compose - opisujesz **co** ma być wyświetlone.

```swift
// Prosty ekran listy
struct TaskListView: View {
    @StateObject var viewModel = TaskViewModel()
    
    var body: some View {
        NavigationStack {
            List(viewModel.tasks) { task in
                NavigationLink(destination: TaskDetailView(task: task)) {
                    TaskRow(task: task)
                }
            }
            .navigationTitle("Zadania")
            .toolbar {
                ToolbarItem(placement: .primaryAction) {
                    Button(action: viewModel.addTask) {
                        Image(systemName: "plus")
                    }
                }
            }
        }
        .task {
            await viewModel.loadTasks()
        }
    }
}

// Komponent wiersza
struct TaskRow: View {
    let task: Task
    
    var body: some View {
        HStack {
            Image(systemName: task.isCompleted ? "checkmark.circle.fill" : "circle")
                .foregroundStyle(task.isCompleted ? .green : .secondary)
            VStack(alignment: .leading) {
                Text(task.name)
                    .strikethrough(task.isCompleted)
                Text(task.dueDate.formatted(date: .abbreviated, time: .omitted))
                    .font(.caption)
                    .foregroundStyle(.secondary)
            }
        }
    }
}
```

## Combine i ObservableObject

```swift
// ViewModel z Combine
class TaskViewModel: ObservableObject {
    @Published var tasks: [Task] = []
    @Published var isLoading = false
    @Published var errorMessage: String?
    
    private var cancellables = Set<AnyCancellable>()
    
    func loadTasks() async {
        isLoading = true
        do {
            let loaded = try await taskService.fetchTasks()
            await MainActor.run {
                self.tasks = loaded
                self.isLoading = false
            }
        } catch {
            await MainActor.run {
                self.errorMessage = error.localizedDescription
                self.isLoading = false
            }
        }
    }
}
```

## SwiftData - persystencja (iOS 17+)

SwiftData to nowoczesny, deklaratywny ORM - następca Core Data.

```swift
import SwiftData

@Model
class Task {
    var name: String
    var isCompleted: Bool = false
    var createdAt: Date = Date()
    
    init(name: String) {
        self.name = name
    }
}

// Punkt wejścia z container SwiftData
@main
struct MyApp: App {
    var body: some Scene {
        WindowGroup {
            ContentView()
        }
        .modelContainer(for: Task.self)
    }
}

// Użycie w widoku
struct TaskListView: View {
    @Query(sort: \Task.createdAt, order: .reverse) var tasks: [Task]
    @Environment(\.modelContext) var modelContext
    
    func addTask() {
        let task = Task(name: "Nowe zadanie")
        modelContext.insert(task)
    }
}
```

## URLSession - sieć

```swift
// Asynchroniczne pobieranie danych
struct PokemonService {
    func fetchPokemon(name: String) async throws -> Pokemon {
        let url = URL(string: "https://pokeapi.co/api/v2/pokemon/\(name)")!
        let (data, response) = try await URLSession.shared.data(from: url)
        
        guard let httpResponse = response as? HTTPURLResponse,
              httpResponse.statusCode == 200 else {
            throw APIError.invalidResponse
        }
        
        return try JSONDecoder().decode(Pokemon.self, from: data)
    }
}
```

## Info.plist - uprawnienia iOS

W iOS każde wrażliwe uprawnienie wymaga opisu (NSUsageDescription):

```xml
<key>NSLocationWhenInUseUsageDescription</key>
<string>Aplikacja używa lokalizacji do pokazania pobliskich restauracji.</string>

<key>NSCameraUsageDescription</key>
<string>Aplikacja używa kamery do skanowania kodów QR.</string>

<key>NSPhotoLibraryUsageDescription</key>
<string>Aplikacja zapisuje zdjęcia do Twojej biblioteki.</string>
```

## 1. Xcode IDE - narzędzia i funkcje

Xcode to zintegrowane środowisko programistyczne dostarczające kompletny zestaw narzędzi do tworzenia, testowania i profilowania aplikacji.

### System budowania (Build System)

Xcode używa systemu budowania opartego na **llbuild** (Apple's low-level build system). Kluczowe ustawienia projektu dostępne w *Build Settings*:

- **SWIFT_OPTIMIZATION_LEVEL** - poziom optymalizacji: `-Onone` (debug), `-O` (release)
- **PRODUCT_BUNDLE_IDENTIFIER** - unikalny identyfikator aplikacji (np. `pl.edu.uczelnia.MojaAplikacja`)
- **IPHONEOS_DEPLOYMENT_TARGET** - minimalna wersja iOS

Skróty klawiszowe przyspieszające pracę:
| Skrót | Akcja |
|---|---|
| `⌘B` | Buduj projekt |
| `⌘R` | Uruchom na symulatorze/urządzeniu |
| `⌘U` | Uruchom testy |
| `⌘⇧K` | Wyczyść folder build |
| `⌘⇧O` | Szybkie otwieranie pliku |
| `⌃I` | Formatuj zaznaczony kod |

### Symulator iOS

Symulator pozwala testować aplikację bez fizycznego urządzenia. Dostępne akcje:
- **Device → Rotate** - symulacja obrotu urządzenia
- **Features → Location** - symulacja GPS (własne współrzędne lub trasy)
- **Features → Face ID / Touch ID** - testowanie biometrii
- **Debug → Slow Animations** - zwolnienie animacji (pomocne przy debugowaniu)

```bash
# Uruchamianie symulatora z wiersza poleceń
xcrun simctl list devices          # lista dostępnych symulatorów
xcrun simctl boot "iPhone 16 Pro"  # uruchomienie symulatora
xcrun simctl install booted MojaAplikacja.app  # instalacja aplikacji
```

### Debugowanie z LLDB

Xcode korzysta z debuggera **LLDB**. Punkty przerwania (*breakpoints*) ustawia się klikając w numerację linii. Polecenia LLDB w konsoli:

```
(lldb) po viewModel.tasks      # wydrukuj obiekt (print object)
(lldb) p tasks.count           # wydrukuj wartość
(lldb) bt                      # stos wywołań (backtrace)
(lldb) continue                # kontynuuj wykonanie
```

Przydatne typy breakpointów:
- **Symbolic Breakpoint** - zatrzymaj przy każdym wywołaniu metody (np. `-[UIViewController viewDidLoad]`)
- **Exception Breakpoint** - zatrzymaj przy każdym wyjątku (dodawany przez `+` w panelu Breakpoints)
- **Runtime Issue Breakpoint** - wykrywa wycieki pamięci i problemy współbieżności

### Instruments - profilowanie

Instruments to aplikacja do profilowania wydajności uruchamiana przez `⌘I` lub `Product → Profile`. Najważniejsze szablony:
- **Time Profiler** - która funkcja zajmuje najwięcej czasu CPU
- **Allocations** - zużycie pamięci, wykrywanie wycieków
- **Leaks** - wyszukiwanie wycieków pamięci
- **Energy Log** - zużycie baterii (GPS, sieć, CPU)
- **Network** - inspekcja ruchu sieciowego

### Podgląd na żywo (Canvas / Previews)

SwiftUI Previews umożliwiają podgląd widoku bez uruchamiania symulatora:

```swift
#Preview("Tryb ciemny") {
    TaskListView()
        .preferredColorScheme(.dark)
        .environment(\.locale, Locale(identifier: "pl_PL"))
}

// Podgląd z testowymi danymi
#Preview {
    let config = ModelConfiguration(isStoredInMemoryOnly: true)
    let container = try! ModelContainer(for: Task.self, configurations: config)
    return TaskListView()
        .modelContainer(container)
}
```

---

## 2. Protokoły i rozszerzenia w Swift

**Protokoły** (odpowiednik interfejsów w Javie/Kotlinie) definiują kontrakt - zestaw właściwości i metod, które typ musi zaimplementować.

```swift
// Definicja protokołu
protocol Describable {
    var description: String { get }
    func summarize() -> String
}

// Protokół z wymaganiem mutacji (dla struct)
protocol Toggleable {
    mutating func toggle()
}

// Konformancja protokołu
struct Task: Describable, Identifiable {
    let id = UUID()
    var name: String
    var isCompleted: Bool = false

    var description: String {
        "\(name) - \(isCompleted ? "ukończone" : "w toku")"
    }

    func summarize() -> String {
        "Zadanie: \(name)"
    }
}
```

### Rozszerzenia (Extensions)

Rozszerzenia pozwalają dodawać funkcjonalność do istniejących typów - nawet tych z bibliotek standardowych:

```swift
// Rozszerzenie wbudowanego typu
extension String {
    var isValidEmail: Bool {
        contains("@") && contains(".")
    }

    func capitalizingFirstLetter() -> String {
        prefix(1).uppercased() + dropFirst()
    }
}

// Rozszerzenie z konformancją protokołu
extension Array where Element: Comparable {
    var sortedDescending: [Element] {
        sorted(by: >)
    }
}

// Użycie
let email = "student@uczelnia.pl"
print(email.isValidEmail)  // true

let numbers = [3, 1, 4, 1, 5]
print(numbers.sortedDescending)  // [5, 4, 3, 1, 1]
```

### Protokoły generyczne i opaque types

```swift
// Funkcja generyczna ograniczona protokołem
func printAll<T: Describable>(_ items: [T]) {
    items.forEach { print($0.description) }
}

// some View - opaque return type (ukryty typ konkretny)
var body: some View {
    Text("Hej")  // konkretny typ znany kompilatorowi, ukryty przed wywołującym
}
```

---

## 3. Obsługa błędów - do/try/catch

Swift wymaga jawnej obsługi błędów za pomocą mechanizmu `throws` / `do-try-catch`.

```swift
// Definiowanie typów błędów
enum NetworkError: Error, LocalizedError {
    case invalidURL
    case invalidResponse(statusCode: Int)
    case decodingFailed
    case noInternetConnection

    var errorDescription: String? {
        switch self {
        case .invalidURL:             return "Nieprawidłowy adres URL."
        case .invalidResponse(let code): return "Błąd serwera: HTTP \(code)."
        case .decodingFailed:         return "Nie udało się odczytać danych."
        case .noInternetConnection:   return "Brak połączenia z internetem."
        }
    }
}

// Funkcja rzucająca błąd
func fetchUser(id: Int) async throws -> User {
    guard let url = URL(string: "https://api.example.com/users/\(id)") else {
        throw NetworkError.invalidURL
    }

    let (data, response) = try await URLSession.shared.data(from: url)

    guard let http = response as? HTTPURLResponse, http.statusCode == 200 else {
        let code = (response as? HTTPURLResponse)?.statusCode ?? -1
        throw NetworkError.invalidResponse(statusCode: code)
    }

    do {
        return try JSONDecoder().decode(User.self, from: data)
    } catch {
        throw NetworkError.decodingFailed
    }
}

// Obsługa błędów
func loadUser() async {
    do {
        let user = try await fetchUser(id: 1)
        print("Zalogowano: \(user.name)")
    } catch NetworkError.noInternetConnection {
        print("Sprawdź połączenie z internetem.")
    } catch let NetworkError.invalidResponse(code) {
        print("Serwer zwrócił błąd \(code).")
    } catch {
        // catch-all - przechwytuje pozostałe błędy
        print("Nieoczekiwany błąd: \(error.localizedDescription)")
    }
}

// try? - zamienia błąd na nil (opcjonal)
let user = try? await fetchUser(id: 1)  // User? - może być nil

// try! - rozbija opcjonal, crash jeśli błąd (tylko gdy pewni sukcesu)
let config = try! JSONDecoder().decode(AppConfig.self, from: bundleData)
```

---

## 4. Współbieżność - async/await i aktory

Swift Concurrency (Swift 5.5+) to nowoczesny model programowania asynchronicznego zastępujący callback i DispatchQueue.

### Zadania (Task)

```swift
// Task - tworzy nowy kontekst asynchroniczny
func onAppear() {
    Task {
        await loadData()
    }
}

// Task z priorytetem
Task(priority: .userInitiated) {
    await fetchCriticalData()
}

Task(priority: .background) {
    await syncToCloud()
}

// Anulowanie zadania
let task = Task {
    for i in 0..<1000 {
        try Task.checkCancellation()  // rzuca CancellationError jeśli anulowano
        await processItem(i)
    }
}
task.cancel()
```

### Równoległa egzekucja (async let)

```swift
// Sekwencyjnie (wolno) - czeka na każde z osobna
let users = try await fetchUsers()
let posts = try await fetchPosts()

// Równolegle (szybko) - oba żądania startują jednocześnie
async let users = fetchUsers()
async let posts = fetchPosts()
let (u, p) = try await (users, posts)
```

### Aktory (Actors)

**Aktor** to typ referencyjny (jak klasa), który automatycznie chroni swój stan przed jednoczesnym dostępem z wielu wątków:

```swift
actor UserCache {
    private var cache: [Int: User] = [:]

    func user(for id: Int) -> User? {
        cache[id]
    }

    func store(_ user: User) {
        cache[user.id] = user
    }
}

// Dostęp do aktora wymaga await
let cache = UserCache()
await cache.store(user)
let cachedUser = await cache.user(for: 42)
```

### MainActor

`@MainActor` gwarantuje wykonanie na wątku głównym (wymagany do aktualizacji UI):

```swift
@MainActor
class ViewModel: ObservableObject {
    @Published var items: [Item] = []

    func load() async {
        let data = await fetchFromNetwork()  // sieć - inny wątek
        items = data  // bezpieczna aktualizacja UI - MainActor
    }
}

// Wymuszenie głównego wątku w funkcji
await MainActor.run {
    self.isLoading = false
}
```

---

## 5. Testy jednostkowe - XCTest

Xcode generuje cel testowy automatycznie. Testy umieszcza się w folderze `MojaAplikacjaTests/`.

```swift
import XCTest
@testable import MojaAplikacja  // dostęp do internal API

final class TaskViewModelTests: XCTestCase {

    var viewModel: TaskViewModel!

    // Konfiguracja przed każdym testem
    override func setUp() {
        super.setUp()
        viewModel = TaskViewModel()
    }

    // Sprzątanie po każdym teście
    override func tearDown() {
        viewModel = nil
        super.tearDown()
    }

    // Nazwa testu: test + opisowa nazwa (camelCase)
    func testAddTaskIncreasesCount() {
        // Arrange
        let initialCount = viewModel.tasks.count

        // Act
        viewModel.addTask(name: "Nowe zadanie")

        // Assert
        XCTAssertEqual(viewModel.tasks.count, initialCount + 1)
    }

    func testCompletedTaskHasCorrectFlag() {
        viewModel.addTask(name: "Zadanie testowe")
        let task = viewModel.tasks.first!

        viewModel.toggleCompletion(of: task)

        XCTAssertTrue(viewModel.tasks.first!.isCompleted)
    }

    func testEmptyNameThrowsError() {
        XCTAssertThrowsError(try viewModel.addTaskOrThrow(name: "")) { error in
            XCTAssertEqual(error as? TaskError, .emptyName)
        }
    }

    // Test asynchroniczny
    func testFetchTasksFromAPI() async throws {
        let service = MockTaskService()
        let tasks = try await service.fetchTasks()

        XCTAssertFalse(tasks.isEmpty)
        XCTAssertEqual(tasks.first?.name, "Przykładowe zadanie")
    }

    // Test wydajnościowy
    func testSortingPerformance() {
        let tasks = (0..<10_000).map { Task(name: "Zadanie \($0)") }

        measure {
            _ = tasks.sorted { $0.name < $1.name }
        }
    }
}
```

### Mockowanie zależności

```swift
// Protokół serwisu - umożliwia podmianę implementacji
protocol TaskServiceProtocol {
    func fetchTasks() async throws -> [Task]
}

// Mock do testów
struct MockTaskService: TaskServiceProtocol {
    func fetchTasks() async throws -> [Task] {
        [Task(name: "Przykładowe zadanie")]
    }
}

// Produkcyjna implementacja
struct RealTaskService: TaskServiceProtocol {
    func fetchTasks() async throws -> [Task] {
        // prawdziwe żądanie sieciowe
    }
}
```

Uruchamianie testów: `⌘U` (wszystkie) lub kliknięcie ▶ przy nazwie metody testowej.

---

## 6. Cykl życia aplikacji

### @main i protokół App

Od iOS 14 (SwiftUI 2) punkt wejścia aplikacji oparty jest na protokole `App`:

```swift
@main
struct MojaAplikacjaApp: App {

    // Inicjalizacja uruchamiana przed pierwszym widokiem
    init() {
        configureAppearance()
    }

    var body: some Scene {
        WindowGroup {
            ContentView()
        }
        .modelContainer(for: Task.self)  // SwiftData
    }

    private func configureAppearance() {
        UINavigationBar.appearance().tintColor = .systemBlue
    }
}
```

### ScenePhase - zmiany stanu aplikacji

```swift
struct ContentView: View {
    @Environment(\.scenePhase) var scenePhase

    var body: some View {
        MainTabView()
            .onChange(of: scenePhase) { _, newPhase in
                switch newPhase {
                case .active:
                    print("Aplikacja aktywna - odśwież dane")
                case .inactive:
                    print("Aplikacja nieaktywna - zapisz stan")
                case .background:
                    print("Aplikacja w tle - zatrzymaj zadania")
                @unknown default:
                    break
                }
            }
    }
}
```

### UIApplicationDelegate (integracja z UIKit)

Dla zaawansowanych scenariuszy (powiadomienia push, deep links, integracje z UIKit) można nadal używać `AppDelegate`:

```swift
class AppDelegate: NSObject, UIApplicationDelegate {

    // Aplikacja gotowa - konfiguracja zewnętrznych SDK
    func application(
        _ application: UIApplication,
        didFinishLaunchingWithOptions launchOptions: [UIApplication.LaunchOptionsKey: Any]?
    ) -> Bool {
        // FirebaseApp.configure() lub inne SDK
        return true
    }

    // Rejestracja tokenu powiadomień push
    func application(
        _ application: UIApplication,
        didRegisterForRemoteNotificationsWithDeviceToken deviceToken: Data
    ) {
        let token = deviceToken.map { String(format: "%02x", $0) }.joined()
        print("Token APNs: \(token)")
    }
}

// Rejestracja AppDelegate w strukturze App
@main
struct MojaAplikacjaApp: App {
    @UIApplicationDelegateAdaptor(AppDelegate.self) var appDelegate

    var body: some Scene {
        WindowGroup { ContentView() }
    }
}
```

### Cykl życia widoku w SwiftUI

```swift
struct ExampleView: View {
    var body: some View {
        Text("Przykład")
            .onAppear {
                // Widok pojawił się na ekranie - załaduj dane
                print("onAppear")
            }
            .onDisappear {
                // Widok zniknął - anuluj subskrypcje
                print("onDisappear")
            }
            .task {
                // Asynchroniczne zadanie powiązane z widokiem
                // Automatycznie anulowane gdy widok znika
                await loadData()
            }
    }
}
```

---

## Linki

- [Swift.org](https://swift.org)
- [Apple Developer - SwiftUI](https://developer.apple.com/xcode/swiftui/)
- [SwiftData Documentation](https://developer.apple.com/documentation/swiftdata)
- [Swift Concurrency - Apple Docs](https://developer.apple.com/documentation/swift/concurrency)
- [XCTest Documentation](https://developer.apple.com/documentation/xctest)
- [100 Days of SwiftUI (Hacking with Swift)](https://www.hackingwithswift.com/100/swiftui)
