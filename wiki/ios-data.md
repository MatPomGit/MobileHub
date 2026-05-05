# Przechowywanie danych w iOS

iOS oferuje kilka mechanizmów persystencji danych - od prostych kluczy-wartości po zaawansowane bazy danych relacyjne i synchronizację z chmurą przez CloudKit.

## Przegląd mechanizmów

```
Dane             →  Mechanizm
────────────────────────────────────────────────
Mała ilość prefs → UserDefaults / AppStorage
Hasła, tokeny   → Keychain
Pliki            → FileManager
Małe struktury  → Core Data / SwiftData
Duże tabele     → SQLite (GRDB, SQLite.swift)
Chmura          → CloudKit
Dokumenty       → iCloud Drive (UIDocument)
```

## UserDefaults / AppStorage

```swift
// Bezpośrednio
UserDefaults.standard.set("anna@example.com", forKey: "userEmail")
let email = UserDefaults.standard.string(forKey: "userEmail") ?? ""
UserDefaults.standard.removeObject(forKey: "userEmail")

// AppStorage w SwiftUI - reaktywny binding
struct SettingsView: View {
    @AppStorage("isDarkMode") private var isDarkMode = false
    @AppStorage("fontSize")   private var fontSize: Double = 16.0
    @AppStorage("username")   private var username = ""

    var body: some View {
        Form {
            Toggle("Ciemny motyw", isOn: $isDarkMode)
            Slider(value: $fontSize, in: 12...24) { Text("Rozmiar tekstu") }
            TextField("Nazwa użytkownika", text: $username)
        }
        .onChange(of: isDarkMode) { newValue in
            // Automatycznie zapisywane do UserDefaults
        }
    }
}

// Własny typ - Codable w UserDefaults
extension UserDefaults {
    func setCodable<T: Codable>(_ value: T, forKey key: String) {
        let data = try? JSONEncoder().encode(value)
        set(data, forKey: key)
    }

    func getCodable<T: Codable>(_ type: T.Type, forKey key: String) -> T? {
        guard let data = data(forKey: key) else { return nil }
        return try? JSONDecoder().decode(T.self, from: data)
    }
}
```

## Keychain - dane wrażliwe

```swift
import Security

struct KeychainManager {
    static func save(key: String, data: String) -> Bool {
        let query: [String: Any] = [
            kSecClass as String:            kSecClassGenericPassword,
            kSecAttrAccount as String:      key,
            kSecValueData as String:        data.data(using: .utf8)!,
            kSecAttrAccessible as String:   kSecAttrAccessibleWhenUnlocked,
            kSecAttrSynchronizable as String: false  // nie synchronizuj przez iCloud
        ]
        SecItemDelete(query as CFDictionary)  // usuń ewentualne wcześniejsze
        return SecItemAdd(query as CFDictionary, nil) == errSecSuccess
    }

    static func load(key: String) -> String? {
        let query: [String: Any] = [
            kSecClass as String:       kSecClassGenericPassword,
            kSecAttrAccount as String: key,
            kSecReturnData as String:  true,
            kSecMatchLimit as String:  kSecMatchLimitOne
        ]
        var result: AnyObject?
        guard SecItemCopyMatching(query as CFDictionary, &result) == errSecSuccess,
              let data = result as? Data else { return nil }
        return String(data: data, encoding: .utf8)
    }

    static func delete(key: String) {
        let query: [String: Any] = [
            kSecClass as String:       kSecClassGenericPassword,
            kSecAttrAccount as String: key
        ]
        SecItemDelete(query as CFDictionary)
    }
}

// Użycie
KeychainManager.save(key: "auth_token", data: token)
let savedToken = KeychainManager.load(key: "auth_token")
```

## SwiftData - nowoczesny ORM (iOS 17+)

SwiftData to następca Core Data - używa makr Swift i integruje się z `@Observable`:

```swift
import SwiftData

// Definicja modelu - tylko atrybuty
@Model
final class Task {
    @Attribute(.unique) var id: UUID
    var title: String
    var notes: String
    var isDone: Bool
    var createdAt: Date
    var dueDate: Date?
    var priority: TaskPriority

    // Relacja - lista projektów
    @Relationship(deleteRule: .cascade)
    var subtasks: [Subtask] = []

    // Relacja odwrotna
    var project: Project?

    init(title: String, priority: TaskPriority = .normal) {
        self.id = UUID()
        self.title = title
        self.notes = ""
        self.isDone = false
        self.createdAt = Date()
        self.priority = priority
    }
}

enum TaskPriority: Int, Codable { case low, normal, high, urgent }

@Model final class Subtask {
    var title: String
    var isDone: Bool
    var task: Task?
    init(title: String) { self.title = title; isDone = false }
}
```

```swift
// Konfiguracja kontenera
@main
struct MyApp: App {
    var body: some Scene {
        WindowGroup {
            ContentView()
        }
        .modelContainer(
            for: [Task.self, Subtask.self, Project.self],
            isAutosaveEnabled: true,
            isUndoEnabled: true
        )
    }
}

// Widok z zapytaniem
struct TaskListView: View {
    @Environment(\.modelContext) private var context

    @Query(
        filter: #Predicate<Task> { !$0.isDone },
        sort: [SortDescriptor(\Task.dueDate), SortDescriptor(\Task.priority, order: .reverse)],
        animation: .smooth
    )
    private var activeTasks: [Task]

    @Query(filter: #Predicate<Task> { $0.priority == .urgent })
    private var urgentTasks: [Task]

    var body: some View {
        List {
            if !urgentTasks.isEmpty {
                Section("Pilne") {
                    ForEach(urgentTasks) { TaskRow(task: $0) }
                }
            }
            Section("Aktywne") {
                ForEach(activeTasks) { TaskRow(task: $0) }
                    .onDelete { offsets in
                        offsets.map { activeTasks[$0] }.forEach { context.delete($0) }
                    }
            }
        }
        .toolbar {
            Button("Dodaj", systemImage: "plus") { addSampleTask() }
        }
    }

    private func addSampleTask() {
        let task = Task(title: "Nowe zadanie", priority: .normal)
        context.insert(task)
        // context.save() jest zbędne - autosave robi to automatycznie
    }
}
```

## FileManager - pliki

```swift
class DocumentStore {
    private let fm = FileManager.default

    // Katalogi iOS
    var documentsURL: URL {
        fm.urls(for: .documentDirectory, in: .userDomainMask)[0]
    }
    var cachesURL: URL {
        fm.urls(for: .cachesDirectory, in: .userDomainMask)[0]
    }
    // Documents → backup iCloud, widoczny w Files app
    // Caches → bez backupu, system może wyczyścić
    // tmp → tymczasowe, usuwane regularnie

    func save<T: Encodable>(_ data: T, as filename: String) throws {
        let url = documentsURL.appendingPathComponent(filename)
        let encoded = try JSONEncoder().encode(data)
        try encoded.write(to: url, options: [.atomic, .completeFileProtection])
    }

    func load<T: Decodable>(_ type: T.Type, from filename: String) throws -> T {
        let url = documentsURL.appendingPathComponent(filename)
        let data = try Data(contentsOf: url)
        return try JSONDecoder().decode(T.self, from: data)
    }

    func delete(_ filename: String) throws {
        let url = documentsURL.appendingPathComponent(filename)
        try fm.removeItem(at: url)
    }
}
```

## CloudKit - synchronizacja z chmurą

```swift
import CloudKit

class CloudSyncManager {
    private let container = CKContainer.default()
    private let privateDB: CKDatabase

    init() { privateDB = container.privateCloudDatabase }

    // Zapis rekordu
    func saveTask(_ task: Task) async throws {
        let record = CKRecord(recordType: "Task", recordID: CKRecord.ID(recordName: task.id.uuidString))
        record["title"]     = task.title as CKRecordValue
        record["isDone"]    = task.isDone as CKRecordValue
        record["createdAt"] = task.createdAt as CKRecordValue
        if let due = task.dueDate {
            record["dueDate"] = due as CKRecordValue
        }
        try await privateDB.save(record)
    }

    // Pobieranie rekordów
    func fetchTasks() async throws -> [Task] {
        let predicate = NSPredicate(value: true)  // wszystkie
        let query = CKQuery(recordType: "Task", predicate: predicate)
        query.sortDescriptors = [NSSortDescriptor(key: "createdAt", ascending: false)]

        let (results, _) = try await privateDB.records(matching: query, desiredKeys: nil, resultsLimit: 100)
        return results.compactMap { _, result in
            guard case .success(let record) = result else { return nil }
            return Task(from: record)
        }
    }

    // Subskrypcja zmian - push notification gdy zmiana na innym urządzeniu
    func subscribeToChanges() async throws {
        let predicate = NSPredicate(value: true)
        let subscription = CKQuerySubscription(
            recordType: "Task",
            predicate: predicate,
            options: [.firesOnRecordCreation, .firesOnRecordUpdate, .firesOnRecordDeletion]
        )
        let notification = CKSubscription.NotificationInfo()
        notification.shouldSendContentAvailable = true  // silent push
        subscription.notificationInfo = notification
        try await privateDB.save(subscription)
    }
}
```

## Linki

- [SwiftData Docs](https://developer.apple.com/documentation/swiftdata)
- [CloudKit Docs](https://developer.apple.com/documentation/cloudkit)
- [Keychain Services](https://developer.apple.com/documentation/security/keychain_services)
- [SwiftData WWDC23](https://developer.apple.com/videos/play/wwdc2023/10154/)

## Core Data - migracja schematu

Wraz z rozwojem aplikacji model danych nieuchronnie się zmienia: dodajemy atrybuty, zmieniamy typy lub relacje. Core Data obsługuje dwie strategie migracji: **lekką** (automatic/lightweight) i **ręczną** z modelem mapowania.

### Migracja lekka

Migracja lekka działa automatycznie, gdy zmiany są proste - dodanie opcjonalnego atrybutu, zmiana nazwy encji z użyciem `renamingIdentifier`, usunięcie relacji. Wystarczy zaznaczyć opcje przy ładowaniu store:

```swift
let options: [String: Any] = [
    NSMigratePersistentStoresAutomaticallyOption: true,
    NSInferMappingModelAutomaticallyOption: true
]
try coordinator.addPersistentStore(
    ofType: NSSQLiteStoreType,
    configurationName: nil,
    at: storeURL,
    options: options
)
```

W Xcode tworzymy nową wersję modelu: **Editor → Add Model Version**. Aktualną wersję zaznaczamy w inspektorze pliku `.xcdatamodeld` (zielona strzałka). Stare wersje pozostają w projekcie - Core Data porównuje je automatycznie.

### Migracja z modelem mapowania (Mapping Model)

Gdy zmiana jest złożona - np. rozdzielamy `fullName` na `firstName` i `lastName` - potrzebujemy `NSMappingModel` oraz niestandardowej klasy `NSEntityMigrationPolicy`:

```swift
class PersonMigrationPolicy: NSEntityMigrationPolicy {
    override func createDestinationInstances(
        forSource sInstance: NSManagedObject,
        in mapping: NSEntityMapping,
        manager: NSMigrationManager
    ) throws {
        try super.createDestinationInstances(forSource: sInstance, in: mapping, manager: manager)
        guard
            let dest = manager.destinationInstances(
                forEntityMappingName: mapping.name, sourceInstances: [sInstance]
            ).first,
            let fullName = sInstance.value(forKey: "fullName") as? String
        else { return }
        let parts = fullName.split(separator: " ", maxSplits: 1)
        dest.setValue(String(parts.first ?? ""), forKey: "firstName")
        dest.setValue(parts.count > 1 ? String(parts[1]) : "", forKey: "lastName")
    }
}
```

Plik `.xcmappingmodel` łączy starą wersję modelu z nową i wskazuje klasę polityki dla encji `Person`. Migracja uruchamiana jest przez `NSMigrationManager.migrateStore(from:to:)`. Warto zawsze testować migracje na kopii produkcyjnej bazy przed wdrożeniem.

## GRDB.swift - SQLite dla iOS

**GRDB.swift** to nowoczesna biblioteka SQLite dla Swift, będąca alternatywą dla Core Data i SwiftData. Oferuje bezpośredni dostęp do SQL z wygodnym API wysokiego poziomu, migracjami opartymi na kodzie oraz integracją z Combine/async-await.

### Definicja schematu i migracje

```swift
import GRDB

// Model
struct Task: Codable, FetchableRecord, PersistableRecord {
    var id: Int64?
    var title: String
    var isDone: Bool
    var createdAt: Date
}

// Konfiguracja bazy z migracjami
func openDatabase(at path: String) throws -> DatabaseQueue {
    let dbQueue = try DatabaseQueue(path: path)
    var migrator = DatabaseMigrator()

    migrator.registerMigration("v1") { db in
        try db.create(table: "task") { t in
            t.autoIncrementedPrimaryKey("id")
            t.column("title", .text).notNull()
            t.column("isDone", .boolean).notNull().defaults(to: false)
            t.column("createdAt", .datetime).notNull()
        }
    }
    migrator.registerMigration("v2") { db in
        try db.alter(table: "task") { t in
            t.add(column: "priority", .integer).defaults(to: 0)
        }
    }
    try migrator.migrate(dbQueue)
    return dbQueue
}
```

### Zapytania i integracja z Combine

```swift
// Zapis
try dbQueue.write { db in
    var task = Task(id: nil, title: "Kupić mleko", isDone: false, createdAt: Date())
    try task.insert(db)
}

// Odczyt z filtrem
let pending = try dbQueue.read { db in
    try Task.filter(Column("isDone") == false)
             .order(Column("createdAt").desc)
             .fetchAll(db)
}

// Combine - obserwacja zmian na żywo
let publisher = ValueObservation
    .tracking { db in try Task.fetchAll(db) }
    .publisher(in: dbQueue, scheduling: .immediate)
    .sink(receiveCompletion: { _ in }, receiveValue: { tasks in
        print("Zadania: \(tasks.count)")
    })
```

GRDB nie wymaga generatora kodu ani `.xcdatamodeld`. Migracje są czytelne i testowalne, a zapytania kompilują się do czystego SQL - łatwego do debugowania z `db.trace { print($0) }`.

## Bezpieczne przechowywanie - szyfrowanie plików

Dane wrażliwe (tokeny, dane zdrowotne, dokumenty finansowe) wymagają szyfrowania w spoczynku, niezależnie od szyfrowania na poziomie systemu.

### Data Protection Classes

iOS oferuje cztery klasy ochrony pliku, określające kiedy klucz deszyfrujący jest dostępny:

| Klasa | Dostępność klucza |
|---|---|
| `NSFileProtectionComplete` | Tylko gdy urządzenie odblokowane |
| `NSFileProtectionCompleteUnlessOpen` | Plik otwarty przed blokadą pozostaje dostępny |
| `NSFileProtectionCompleteUntilFirstUserAuthentication` | Po pierwszym odblokowaniu po restarcie |
| `NSFileProtectionNone` | Zawsze dostępny |

```swift
// Ustawienie klasy ochrony przy zapisie
let url = FileManager.default.urls(for: .documentDirectory, in: .userDomainMask)[0]
    .appendingPathComponent("sensitive.json")

try data.write(to: url, options: .completeFileProtection)

// Weryfikacja atrybutu
let attrs = try FileManager.default.attributesOfItem(atPath: url.path)
print(attrs[.protectionKey] ?? "brak")  // FileProtectionType.complete
```

### SQLCipher - szyfrowanie bazy SQLite

Dla aplikacji wymagających szyfrowanej bazy SQLite, SQLCipher (lub GRDB z rozszerzeniem `GRDBCipher`) szyfruje każdą stronę pliku bazy kluczem AES-256:

```swift
// GRDB + SQLCipher
var config = Configuration()
config.prepareDatabase { db in
    try db.usePassphrase("super-tajne-hasło")
}
let dbQueue = try DatabaseQueue(path: dbPath, configuration: config)
```

Klucz szyfrowania nigdy nie powinien być zakodowany na stałe w źródle - należy go generować losowo i przechowywać w **Keychain** z atrybutem `kSecAttrAccessibleWhenUnlockedThisDeviceOnly`. Łącząc Data Protection z SQLCipher, uzyskujemy obronę warstwową: nawet fizyczny dostęp do pliku nie pozwoli odczytać danych bez klucza z Keychain, a klucz z Keychain jest niedostępny bez odblokowania urządzenia.
