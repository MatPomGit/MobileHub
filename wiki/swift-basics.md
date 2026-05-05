# Swift - podstawy języka

Swift to szybki, bezpieczny i wyrazisty język programowania stworzony przez Apple w 2014 roku. Od Swift 5.5 wprowadzono async/await, a od Swift 5.9 makra, które rewolucjonizują sposób pisania kodu iOS.

## Typy i opcjonale

Podstawą bezpieczeństwa w Swift jest system opcjonali, który wymusza jawną obsługę braku wartości już na etapie kompilacji. W odróżnieniu od `null` w języku Java, opcjonale w Swift muszą być świadomie rozpakowane - pominięcie tej operacji jest błędem kompilacji, a nie dopiero wyjątkiem w czasie wykonania. Poniższy przykład pokazuje deklarację stałych i zmiennych oraz trzy różne sposoby bezpiecznego rozpakowywania opcjonali: operator `??`, blok `if let` i konstrukcję `guard let` do wczesnego powrotu z funkcji.

```swift
// Stałe i zmienne
let name = "Anna"           // stała - immutable
var score = 0               // zmienna - mutable

// Opcjonale - kluczowa cecha Swift zapobiegająca null pointer exceptions
var email: String? = nil
let safeEmail = email ?? "brak@email.com"   // operator ??

// Bezpieczne rozpakowywanie
if let email = email {
    print("Email: \(email)")
}

// Guard let - wczesny return
func processEmail(_ email: String?) {
    guard let email = email, email.contains("@") else {
        print("Nieprawidłowy email")
        return
    }
    sendEmail(to: email)
}
```

## Struktury i klasy

Swift rozróżnia dwa fundamentalnie różne modele przechowywania danych: struktury (value type) i klasy (reference type). Struktury są kopiowane przy każdym przypisaniu, co zapobiega niezamierzonym modyfikacjom współdzielonych danych - dlatego w SwiftUI większość modeli danych to właśnie struktury. Klasy natomiast są przekazywane przez referencję i obsługują dziedziczenie, a ich cykl życia zarządzany jest automatycznie przez ARC (Automatic Reference Counting).

```swift
// Struct - value type (kopia przy przypisaniu)
struct Point {
    var x: Double
    var y: Double

    func distance(to other: Point) -> Double {
        sqrt(pow(x - other.x, 2) + pow(y - other.y, 2))
    }
}

// Class - reference type (współdzielona referencja)
class UserSession {
    var userId: String
    var isLoggedIn: Bool = false

    init(userId: String) {
        self.userId = userId
    }
}

// Enum z associated values
enum NetworkError: Error {
    case notFound
    case unauthorized
    case serverError(statusCode: Int)
    case noConnection(underlying: Error)
}
```

## Protokoły i generyki

Protokoły w Swift pełnią rolę zbliżoną do interfejsów znanych z innych języków, ale są znacznie potężniejsze - mogą zawierać domyślne implementacje metod i definiować typy stowarzyszone (`associatedtype`). Generyki z ograniczeniami protokołowymi (np. `T: Identifiable`) umożliwiają pisanie elastycznego, wielokrotnie używanego kodu bez utraty bezpieczeństwa typów w czasie kompilacji. Ten wzorzec jest powszechny w architekturze iOS - repozytoria i serwisy sieciowe definiuje się jako generyczne protokoły, co ułatwia podmianę implementacji i pisanie testów.

```swift
protocol Identifiable {
    var id: UUID { get }
}

protocol Repository {
    associatedtype Item: Identifiable
    func fetchAll() async throws -> [Item]
    func save(_ item: Item) async throws
}

// Generyczna funkcja
func findById<T: Identifiable>(_ id: UUID, in items: [T]) -> T? {
    items.first { $0.id == id }
}
```

## Async/Await

Async/await to nowoczesna składnia asynchroniczności wprowadzona w Swift 5.5, która zastępuje złożone łańcuchy completion handlerów czystym, sekwencyjnym kodem. Słowo kluczowe `try await` pozwala elegancko propagować błędy przez cały łańcuch wywołań asynchronicznych bez zagnieżdżonych bloków. Poniższy przykład demonstruje pobieranie danych z API z obsługą błędów HTTP oraz aktualizację interfejsu na głównym wątku za pomocą `MainActor.run`.

```swift
// async/await - czytelna asynchroniczność
func fetchUserProfile(id: String) async throws -> UserProfile {
    let url = URL(string: "https://api.example.com/users/\(id)")!
    let (data, response) = try await URLSession.shared.data(from: url)

    guard let http = response as? HTTPURLResponse, http.statusCode == 200 else {
        throw NetworkError.serverError(statusCode: 404)
    }
    return try JSONDecoder().decode(UserProfile.self, from: data)
}

// Task - uruchom zadanie asynchroniczne
Task {
    do {
        let profile = try await fetchUserProfile(id: "123")
        await MainActor.run { self.userProfile = profile }
    } catch {
        print("Błąd: \(error)")
    }
}
```

## Closures i functional programming

Zamknięcia (closures) to samodzielne bloki kodu, które można przekazywać jako argumenty funkcji i przechowywać w zmiennych, co jest fundamentem programowania funkcyjnego w Swift. Zwięzła składnia z `$0`, `$1` jako nazwami kolejnych parametrów skraca zapis do minimum, a operacje `filter`, `map` i `reduce` pozwalają przetwarzać kolekcje w sposób deklaratywny. Typ `Result<Success, Failure>` zapewnia bezpieczną obsługę błędów bez wyjątków - jest preferowanym wzorcem w ekosystemie Swift przy operacjach, które mogą zakończyć się niepowodzeniem.

```swift
let numbers = [1, 2, 3, 4, 5, 6]

let evenSquares = numbers
    .filter { $0 % 2 == 0 }     // [2, 4, 6]
    .map { $0 * $0 }             // [4, 16, 36]

// Result type
func divide(_ a: Double, by b: Double) -> Result<Double, MathError> {
    guard b != 0 else { return .failure(.divisionByZero) }
    return .success(a / b)
}

switch divide(10, by: 2) {
case .success(let result): print("Wynik: \(result)")
case .failure(let error): print("Błąd: \(error)")
}
```

## Linki

- [Swift.org](https://swift.org/documentation/)
- [Swift by Example](https://swiftbyexample.com)
- [Hacking with Swift](https://www.hackingwithswift.com)

## Zarządzanie pamięcią - ARC

Swift używa **Automatic Reference Counting (ARC)** - kompilator automatycznie wstawia `retain`/`release`. Nie ma garbage collectora, więc nie ma pauzy GC.

```swift
class Node {
    let value: Int
    // BŁĄD: retain cycle - żaden obiekt nigdy nie zostanie zwolniony
    var next: Node?          // strong reference
    var parent: Node?        // strong reference - cycle!

    init(_ value: Int) { self.value = value }
}

// POPRAWNIE: weak lub unowned dla referencji wstecznych
class TreeNode {
    let value: Int
    var children: [TreeNode] = []     // strong - rodzic posiada dzieci
    weak var parent: TreeNode?        // weak - nie przedłuża życia rodzica

    init(_ value: Int) { self.value = value }
}

// Capture list w closures - zapobiega retain cycle
class ViewModel {
    var onDataLoaded: (() -> Void)?

    func setupCallback() {
        // BŁĄD: self w closure tworzy retain cycle
        onDataLoaded = {
            self.updateUI()  // silna referencja do self!
        }

        // POPRAWNIE: [weak self]
        onDataLoaded = { [weak self] in
            self?.updateUI()
        }
    }
}
```

## Concurrency - Actors i Swift Concurrency

Aktor (`actor`) to typ referencyjny w Swift, który automatycznie serializuje dostęp do swojego wewnętrznego stanu, eliminując wyścigi danych (data races) bez konieczności ręcznego zarządzania blokadami. Każde wywołanie metody aktora wymaga `await`, co sygnalizuje programiście potencjalny punkt przełączenia kontekstu i uniemożliwia niezabezpieczony dostęp współbieżny. Poniższy przykład ilustruje aktora modelującego konto bankowe, atrybut `@MainActor` gwarantujący wykonanie kodu na wątku UI oraz `TaskGroup` do równoległego pobierania wielu profili jednocześnie.

```swift
// Actor - bezpieczny dostęp współbieżny do stanu
actor BankAccount {
    private var balance: Double = 0

    func deposit(_ amount: Double) {
        balance += amount
    }

    func withdraw(_ amount: Double) throws -> Double {
        guard balance >= amount else { throw BankError.insufficientFunds }
        balance -= amount
        return amount
    }

    var currentBalance: Double { balance }
}

// Użycie actor
let account = BankAccount()

Task {
    await account.deposit(100)
    let balance = await account.currentBalance
    print("Stan konta: \(balance)")
}

// @MainActor - wymuszenie wykonania na głównym wątku
@MainActor
class UIUpdater {
    var label: String = ""

    func updateFromBackground() async {
        let data = await fetchData()           // może być na tle
        label = data.description               // @MainActor gwarantuje główny wątek
    }
}

// TaskGroup - równoległa praca
func fetchAllProfiles(ids: [String]) async throws -> [UserProfile] {
    try await withThrowingTaskGroup(of: UserProfile.self) { group in
        for id in ids {
            group.addTask {
                try await fetchUserProfile(id: id)
            }
        }
        var profiles: [UserProfile] = []
        for try await profile in group {
            profiles.append(profile)
        }
        return profiles
    }
}
```

## Property Wrappers

Property wrappers to mechanizm Swift pozwalający enkapsulować powtarzalną logikę związaną z właściwościami w wielokrotnie używalny dekorator, redukując duplikację kodu. Wbudowany wrapper `@Published` z frameworku Combine automatycznie powiadamia obserwatorów o każdej zmianie wartości, co jest podstawą reaktywności w architekturze MVVM z SwiftUI. Poniższy przykład pokazuje `@Published` w praktyce oraz implementację własnego wrappera `@Clamped`, który automatycznie ogranicza wartość do podanego zakresu niezależnie od tego, co zostanie przypisane.

```swift
// @Published - powiadamia o zmianach (Combine)
class CounterViewModel: ObservableObject {
    @Published var count = 0
    @Published var isLoading = false

    func increment() { count += 1 }
}

// Własny property wrapper
@propertyWrapper
struct Clamped<T: Comparable> {
    private var value: T
    private let range: ClosedRange<T>

    var wrappedValue: T {
        get { value }
        set { value = min(max(newValue, range.lowerBound), range.upperBound) }
    }

    init(wrappedValue: T, _ range: ClosedRange<T>) {
        self.range = range
        self.value = min(max(wrappedValue, range.lowerBound), range.upperBound)
    }
}

struct Slider {
    @Clamped(0...100) var volume: Int = 50
}

var slider = Slider()
slider.volume = 150  // zostanie obcięte do 100
print(slider.volume) // 100
```

## Makra Swift (Swift 5.9+)

Makra wprowadzone w Swift 5.9 pozwalają generować kod w czasie kompilacji, znacząco redukując ilość powtarzalnego kodu szablonowego. Makro `@Observable` zastępuje dotychczasowy wzorzec `ObservableObject` + `@Published` pojedynczą adnotacją, automatycznie śledząc zmiany wszystkich właściwości klasy bez konieczności ich ręcznego oznaczania. Poniższy przykład demonstruje makro `#Preview` do podglądu w Xcode oraz model z `@Observable`, który w porównaniu z klasycznym podejściem Combine jest znacznie prostszy i bardziej zwięzły.

```swift
// #Preview - podgląd w Xcode
#Preview {
    ContentView()
        .preferredColorScheme(.dark)
}

// @Observable - zastępuje ObservableObject (Swift 5.9)
@Observable
class CounterModel {
    var count = 0               // automatycznie obserwowalne
    var name = "Counter"

    func increment() { count += 1 }
}

// Brak @Published - @Observable śledzi zmiany automatycznie
struct CounterView: View {
    @State private var model = CounterModel()

    var body: some View {
        VStack {
            Text("\(model.count)")
            Button("Zwiększ") { model.increment() }
        }
    }
}
```

## Wzorzec Result Builder

Result builder to mechanizm Swift umożliwiający definiowanie własnych DSL (Domain Specific Languages) o czytelnej, deklaratywnej składni podobnej do kodu HTML lub XML. To właśnie na result builderach opiera się cały system budowania interfejsów w SwiftUI - każdy blok `body: some View` korzysta z wbudowanego `@ViewBuilder`, który działa dokładnie na tej samej zasadzie. Poniższy przykład pokazuje, jak stworzyć własny `HTMLBuilder` generujący strukturę HTML, co pomaga zrozumieć mechanizm leżący u podstaw SwiftUI.

```swift
// Result builder - podstawa DSL w SwiftUI
@resultBuilder
struct HTMLBuilder {
    static func buildBlock(_ components: String...) -> String {
        components.joined(separator: "\n")
    }

    static func buildIf(_ component: String?) -> String {
        component ?? ""
    }
}

func html(@HTMLBuilder content: () -> String) -> String {
    "<html>\(content())</html>"
}

let page = html {
    "<body>"
    "<h1>Hello Swift</h1>"
    "</body>"
}
```

## Linki dodatkowe

- [Swift Evolution](https://github.com/apple/swift-evolution)
- [Swift Concurrency](https://docs.swift.org/swift-book/documentation/the-swift-programming-language/concurrency/)
- [Swift Macros](https://docs.swift.org/swift-book/documentation/the-swift-programming-language/macros/)
