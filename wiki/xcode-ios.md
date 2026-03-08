# Programowanie Natywne iOS — Xcode i Swift

Xcode to oficjalne IDE Apple dla systemów iOS, iPadOS, macOS, watchOS i tvOS. Wymaga komputera Mac. Językiem programowania jest **Swift** — bezpieczny, szybki i nowoczesny język stworzony przez Apple w 2014 roku.

## Wymagania środowiska

- macOS Ventura lub nowszy
- Xcode 16+ (pobranie z Mac App Store — uwaga: ~12 GB)
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

## Swift — podstawy języka

```swift
// Stałe i zmienne
let name = "Anna"          // stała — nie można zmienić
var age = 25               // zmienna

// Opcjonale — kluczowa cecha Swift
var email: String? = nil   // może być nil
let safeEmail = email ?? "brak@email.com"  // operator ?? — wartość domyślna

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

## SwiftUI — deklaratywny UI

SwiftUI używa tego samego koncepcyjnego podejścia co Jetpack Compose — opisujesz **co** ma być wyświetlone.

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

## SwiftData — persystencja (iOS 17+)

SwiftData to nowoczesny, deklaratywny ORM — następca Core Data.

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

## URLSession — sieć

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

## Info.plist — uprawnienia iOS

W iOS każde wrażliwe uprawnienie wymaga opisu (NSUsageDescription):

```xml
<key>NSLocationWhenInUseUsageDescription</key>
<string>Aplikacja używa lokalizacji do pokazania pobliskich restauracji.</string>

<key>NSCameraUsageDescription</key>
<string>Aplikacja używa kamery do skanowania kodów QR.</string>

<key>NSPhotoLibraryUsageDescription</key>
<string>Aplikacja zapisuje zdjęcia do Twojej biblioteki.</string>
```

## Linki

- [Swift.org](https://swift.org)
- [Apple Developer — SwiftUI](https://developer.apple.com/xcode/swiftui/)
- [SwiftData Documentation](https://developer.apple.com/documentation/swiftdata)
- [100 Days of SwiftUI (Hacking with Swift)](https://www.hackingwithswift.com/100/swiftui)
