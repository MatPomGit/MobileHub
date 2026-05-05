# Sieć i API w iOS - URLSession, Alamofire, Combine

iOS oferuje `URLSession` jako wbudowany klient HTTP z pełnym wsparciem dla `async/await`. Alamofire to popularna biblioteka upraszczająca złożone scenariusze. Combine umożliwia reaktywne pipelines.

## URLSession - podstawy async/await

```swift
// Warstwa sieciowa z generycznym dekodowaniem
struct NetworkClient {
    static let shared = NetworkClient()
    private let session: URLSession
    private let decoder: JSONDecoder

    init() {
        let config = URLSessionConfiguration.default
        config.timeoutIntervalForRequest  = 30
        config.timeoutIntervalForResource = 60
        config.waitsForConnectivity = true  // poczekaj na połączenie zamiast od razu failować
        self.session = URLSession(configuration: config)
        self.decoder = JSONDecoder()
        self.decoder.keyDecodingStrategy = .convertFromSnakeCase  // snake_case → camelCase
        self.decoder.dateDecodingStrategy = .iso8601
    }

    func fetch<T: Decodable>(_ request: URLRequest) async throws -> T {
        let (data, response) = try await session.data(for: request)

        guard let httpResponse = response as? HTTPURLResponse else {
            throw NetworkError.invalidResponse
        }

        switch httpResponse.statusCode {
        case 200...299:
            return try decoder.decode(T.self, from: data)
        case 401:
            throw NetworkError.unauthorized
        case 404:
            throw NetworkError.notFound
        case 429:
            let retryAfter = httpResponse.value(forHTTPHeaderField: "Retry-After")
            throw NetworkError.rateLimited(retryAfter: Double(retryAfter ?? "5") ?? 5)
        case 500...599:
            throw NetworkError.serverError(httpResponse.statusCode)
        default:
            throw NetworkError.httpError(httpResponse.statusCode)
        }
    }
}

enum NetworkError: LocalizedError {
    case invalidURL
    case invalidResponse
    case unauthorized
    case notFound
    case rateLimited(retryAfter: Double)
    case serverError(Int)
    case httpError(Int)
    case decodingFailed(Error)

    var errorDescription: String? {
        switch self {
        case .unauthorized:           return "Sesja wygasła. Zaloguj się ponownie."
        case .notFound:               return "Zasób nie istnieje."
        case .rateLimited(let wait):  return "Zbyt wiele żądań. Spróbuj za \(Int(wait))s."
        case .serverError(let code):  return "Błąd serwera (\(code)). Spróbuj później."
        default:                      return "Błąd sieci. Sprawdź połączenie."
        }
    }
}
```

## API Repository - warstwa danych

```swift
// Protokół + implementacja - umożliwia MockRepository w testach
protocol ProductsRepositoryProtocol {
    func getProducts(page: Int, pageSize: Int) async throws -> Page<Product>
    func getProduct(id: String) async throws -> Product
    func searchProducts(query: String) async throws -> [Product]
    func createOrder(items: [CartItem]) async throws -> Order
}

struct ProductsRepository: ProductsRepositoryProtocol {
    private let client = NetworkClient.shared
    private let baseURL = URL(string: "https://api.example.com/v2")!

    func getProducts(page: Int = 1, pageSize: Int = 20) async throws -> Page<Product> {
        var components = URLComponents(url: baseURL.appendingPathComponent("products"), resolvingAgainstBaseURL: false)!
        components.queryItems = [
            URLQueryItem(name: "page", value: "\(page)"),
            URLQueryItem(name: "page_size", value: "\(pageSize)")
        ]
        var request = URLRequest(url: components.url!)
        request.setValue("application/json", forHTTPHeaderField: "Accept")
        return try await client.fetch(request)
    }

    func createOrder(items: [CartItem]) async throws -> Order {
        var request = URLRequest(url: baseURL.appendingPathComponent("orders"))
        request.httpMethod = "POST"
        request.setValue("application/json", forHTTPHeaderField: "Content-Type")
        request.httpBody = try JSONEncoder().encode(["items": items])
        return try await client.fetch(request)
    }

    func searchProducts(query: String) async throws -> [Product] {
        var components = URLComponents(url: baseURL.appendingPathComponent("products/search"), resolvingAgainstBaseURL: false)!
        components.queryItems = [URLQueryItem(name: "q", value: query)]
        let request = URLRequest(url: components.url!)
        return try await client.fetch(request)
    }
}

struct Page<T: Decodable>: Decodable {
    let data: [T]
    let total: Int
    let page: Int
    let pageSize: Int
    var hasNextPage: Bool { page * pageSize < total }
}
```

## ViewModel z obsługą stanu

```swift
@MainActor
final class ProductListViewModel: ObservableObject {
    @Published var products: [Product] = []
    @Published var isLoading = false
    @Published var errorMessage: String?
    @Published var searchQuery = ""
    @Published var currentPage = 1

    private let repository: ProductsRepositoryProtocol
    private var searchTask: Task<Void, Never>?
    private var hasMorePages = true

    init(repository: ProductsRepositoryProtocol = ProductsRepository()) {
        self.repository = repository
    }

    func loadInitial() async {
        guard !isLoading else { return }
        isLoading = true
        errorMessage = nil
        currentPage = 1
        do {
            let page = try await repository.getProducts(page: 1)
            products = page.data
            hasMorePages = page.hasNextPage
        } catch {
            errorMessage = error.localizedDescription
        }
        isLoading = false
    }

    func loadNextPage() async {
        guard !isLoading, hasMorePages else { return }
        isLoading = true
        currentPage += 1
        do {
            let page = try await repository.getProducts(page: currentPage)
            products.append(contentsOf: page.data)
            hasMorePages = page.hasNextPage
        } catch {
            currentPage -= 1
            errorMessage = error.localizedDescription
        }
        isLoading = false
    }

    // Debounce wyszukiwania - poczekaj 300ms po ostatnim keystroke
    func onSearchChanged(_ query: String) {
        searchTask?.cancel()
        searchTask = Task {
            try? await Task.sleep(nanoseconds: 300_000_000)  // 300ms
            guard !Task.isCancelled else { return }
            if query.isEmpty {
                await loadInitial()
            } else {
                await searchProducts(query: query)
            }
        }
    }

    private func searchProducts(query: String) async {
        isLoading = true
        do {
            products = try await repository.searchProducts(query: query)
        } catch is CancellationError {
            // Anulowano - ignoruj
        } catch {
            errorMessage = error.localizedDescription
        }
        isLoading = false
    }
}
```

## Alamofire - zaawansowane scenariusze

```swift
// Alamofire jest szczególnie przydatny dla:
// - multipart upload (zdjęcia, pliki)
// - interceptors (automatyczne odświeżanie tokenu)
// - network reachability monitoring

import Alamofire

// Upload pliku z postępem
func uploadImage(_ image: UIImage, productId: String) async throws -> String {
    guard let imageData = image.jpegData(compressionQuality: 0.8) else {
        throw NSError(domain: "Upload", code: -1)
    }

    return try await withCheckedThrowingContinuation { cont in
        AF.upload(
            multipartFormData: { form in
                form.append(imageData, withName: "image", fileName: "photo.jpg", mimeType: "image/jpeg")
                form.append(productId.data(using: .utf8)!, withName: "product_id")
            },
            to: "https://api.example.com/upload",
            headers: ["Authorization": "Bearer \(authToken)"]
        )
        .uploadProgress { progress in
            print("Upload: \(Int(progress.fractionCompleted * 100))%")
        }
        .responseDecodable(of: UploadResponse.self) { response in
            switch response.result {
            case .success(let result): cont.resume(returning: result.imageUrl)
            case .failure(let error):  cont.resume(throwing: error)
            }
        }
    }
}

// Automatyczne odświeżanie tokenu
class AuthInterceptor: RequestInterceptor {
    func adapt(_ urlRequest: URLRequest, for session: Session,
               completion: @escaping (Result<URLRequest, Error>) -> Void) {
        var request = urlRequest
        request.setValue("Bearer \(TokenStore.current)", forHTTPHeaderField: "Authorization")
        completion(.success(request))
    }

    func retry(_ request: Request, for session: Session, dueTo error: Error,
               completion: @escaping (RetryResult) -> Void) {
        guard let response = request.task?.response as? HTTPURLResponse,
              response.statusCode == 401,
              request.retryCount == 0 else {
            completion(.doNotRetry); return
        }
        Task {
            do {
                try await refreshToken()
                completion(.retry)
            } catch {
                completion(.doNotRetryWithError(error))
            }
        }
    }
}
```

## URLSession z Combine

```swift
// Reaktywny pipeline - przydatny gdy korzystasz z ObservableObject + @Published
struct SearchService {
    func searchPublisher(query: String) -> AnyPublisher<[Product], Error> {
        var components = URLComponents(string: "https://api.example.com/search")!
        components.queryItems = [URLQueryItem(name: "q", value: query)]

        return URLSession.shared
            .dataTaskPublisher(for: URLRequest(url: components.url!))
            .tryMap { data, response in
                guard let http = response as? HTTPURLResponse, http.statusCode == 200 else {
                    throw NetworkError.invalidResponse
                }
                return data
            }
            .decode(type: [Product].self, decoder: JSONDecoder())
            .receive(on: DispatchQueue.main)
            .eraseToAnyPublisher()
    }
}

// W ViewModel z debounce
@Published var searchQuery = ""
private var cancellables = Set<AnyCancellable>()

func bindSearch() {
    $searchQuery
        .debounce(for: .milliseconds(300), scheduler: RunLoop.main)
        .removeDuplicates()
        .filter { $0.count >= 2 }
        .flatMap { [weak self] query -> AnyPublisher<[Product], Never> in
            self?.searchService.searchPublisher(query: query)
                .catch { _ in Just([]) }
                .eraseToAnyPublisher() ?? Just([]).eraseToAnyPublisher()
        }
        .assign(to: &$products)
}
```

## Linki

- [URLSession Docs](https://developer.apple.com/documentation/foundation/urlsession)
- [Alamofire](https://github.com/Alamofire/Alamofire)
- [Swift Concurrency](https://docs.swift.org/swift-book/documentation/the-swift-programming-language/concurrency/)
- [Combine Framework](https://developer.apple.com/documentation/combine)

## URLCache i zarządzanie cache HTTP

`URLCache` to wbudowany mechanizm cache HTTP w iOS, przechowujący odpowiedzi na dysku i w pamięci. Domyślna instancja ma 4 MB pamięci i 20 MB dysku - w większości aplikacji warto ją skonfigurować.

### Konfiguracja i polityki cache

```swift
// Konfiguracja globalnego cache przy starcie aplikacji
let cache = URLCache(
    memoryCapacity: 20 * 1024 * 1024,   // 20 MB RAM
    diskCapacity: 100 * 1024 * 1024,    // 100 MB dysk
    diskPath: "network_cache"
)
URLCache.shared = cache

// URLSession z dedykowanym cache
let sessionConfig = URLSessionConfiguration.default
sessionConfig.urlCache = cache
sessionConfig.requestCachePolicy = .returnCacheDataElseLoad   // zawsze próbuj cache
let session = URLSession(configuration: sessionConfig)

// Nadpisanie polityki per żądanie
var request = URLRequest(url: URL(string: "https://api.example.com/products")!)
request.cachePolicy = .reloadRevalidatingCacheData  // wyślij ETag/If-None-Match
```

### Obsługa ETag i Last-Modified

```swift
// Ręczna obsługa ETag dla precyzyjnej rewalidacji
class ETagAwareLoader {
    private var etags: [URL: String] = [:]

    func fetch(url: URL) async throws -> Data {
        var request = URLRequest(url: url)
        if let etag = etags[url] {
            request.setValue(etag, forHTTPHeaderField: "If-None-Match")
        }

        let (data, response) = try await URLSession.shared.data(for: request)
        guard let http = response as? HTTPURLResponse else { throw URLError(.badServerResponse) }

        if http.statusCode == 304 {
            // Serwer potwierdził, że zasób się nie zmienił - zwróć z cache
            return URLCache.shared.cachedResponse(for: request)?.data ?? data
        }
        if let newEtag = http.value(forHTTPHeaderField: "ETag") {
            etags[url] = newEtag
        }
        return data
    }
}
```

Polityki cache (`URLRequest.CachePolicy`) warto dobierać do kontekstu: `returnCacheDataDontLoad` sprawdza się w trybie offline, `reloadIgnoringLocalCacheData` - przy pull-to-refresh. Serwer kontroluje czas życia cache przez nagłówek `Cache-Control: max-age=300`.

## WebSocket w iOS - URLSessionWebSocketTask

`URLSessionWebSocketTask` to natywne API do WebSocket dostępne od iOS 13, zintegrowane z `URLSession` i wspierające async/await.

### Nawiązanie połączenia i obsługa wiadomości

```swift
actor WebSocketClient {
    private var task: URLSessionWebSocketTask?
    private let url: URL
    private var reconnectDelay: TimeInterval = 1

    init(url: URL) { self.url = url }

    func connect() {
        task = URLSession.shared.webSocketTask(with: url)
        task?.resume()
        Task { await receiveLoop() }
        Task { await pingLoop() }
        reconnectDelay = 1
    }

    func send(_ text: String) async throws {
        try await task?.send(.string(text))
    }

    func send(_ data: Data) async throws {
        try await task?.send(.data(data))
    }

    // Pętla odbioru wiadomości
    private func receiveLoop() async {
        guard let task else { return }
        do {
            while true {
                let message = try await task.receive()
                switch message {
                case .string(let text): handleText(text)
                case .data(let data):   handleData(data)
                @unknown default: break
                }
            }
        } catch {
            // Połączenie zerwane - automatyczne ponowne połączenie z backoff
            await scheduleReconnect()
        }
    }

    // Ping co 25 s - utrzymanie połączenia przez NAT/serwery proxy
    private func pingLoop() async {
        while task?.state == .running {
            try? await Task.sleep(nanoseconds: 25_000_000_000)
            task?.sendPing { error in
                if let error { print("Ping failed: \(error)") }
            }
        }
    }

    private func scheduleReconnect() async {
        try? await Task.sleep(nanoseconds: UInt64(reconnectDelay * 1_000_000_000))
        reconnectDelay = min(reconnectDelay * 2, 60)  // exponential backoff, max 60 s
        connect()
    }

    private func handleText(_ text: String) { /* parsowanie JSON, aktualizacja UI */ }
    private func handleData(_ data: Data) { /* przetwarzanie danych binarnych */ }
}
```

Użycie `actor` gwarantuje bezpieczeństwo wątkowe bez ręcznych locków. Wzorzec exponential backoff przy ponownych połączeniach jest standardem - bez niego dziesiątki klientów mogłyby jednocześnie zaatakować serwer po jego restarcie.

## Background Downloads - URLSession background configuration

Pobieranie dużych plików (wideo, bazy danych, archiwów) wymaga działania nawet po przejściu aplikacji w tło lub jej zamknięciu przez system. `URLSessionConfiguration.background` przenosi transfer do procesu demona systemowego.

### Konfiguracja i delegat

```swift
// Unikalny identyfikator sesji - musi być stały w aplikacji
private let backgroundSessionID = "com.example.app.background-download"

// Tworzenie sesji (może być wołana wielokrotnie - system przywróci tę samą sesję)
lazy var backgroundSession: URLSession = {
    let config = URLSessionConfiguration.background(
        withIdentifier: backgroundSessionID
    )
    config.isDiscretionary = false        // zacznij natychmiast, nie czekaj na tanie Wi-Fi
    config.sessionSendsLaunchEvents = true // obudź aplikację po zakończeniu
    return URLSession(configuration: config, delegate: self, delegateQueue: nil)
}()

// Uruchomienie pobierania
func startDownload(url: URL) {
    let task = backgroundSession.downloadTask(with: url)
    task.earliestBeginDate = nil  // zacznij jak najszybciej
    task.resume()
}

// AppDelegate - obsługa zdarzenia przebudzenia przez system
func application(
    _ application: UIApplication,
    handleEventsForBackgroundURLSession identifier: String,
    completionHandler: @escaping () -> Void
) {
    // Zachowaj completion handler - wywołaj go PO zakończeniu wszystkich delegatów
    BackgroundDownloadManager.shared.completionHandler = completionHandler
}
```

### URLSessionDownloadDelegate

```swift
extension DownloadService: URLSessionDownloadDelegate {
    // Wywoływane gdy plik jest gotowy (nawet jeśli app była zamknięta)
    func urlSession(
        _ session: URLSession,
        downloadTask: URLSessionDownloadTask,
        didFinishDownloadingTo location: URL
    ) {
        // location to plik tymczasowy - MUSIMY go od razu przenieść
        let dest = FileManager.default.urls(for: .documentDirectory, in: .userDomainMask)[0]
            .appendingPathComponent(downloadTask.originalRequest!.url!.lastPathComponent)
        try? FileManager.default.moveItem(at: location, to: dest)
        BackgroundDownloadManager.shared.completionHandler?()
        BackgroundDownloadManager.shared.completionHandler = nil
    }

    // Postęp pobierania (aktualizuj UI tylko jeśli app na pierwszym planie)
    func urlSession(
        _ session: URLSession,
        downloadTask: URLSessionDownloadTask,
        didWriteData bytesWritten: Int64,
        totalBytesWritten: Int64,
        totalBytesExpectedToWrite: Int64
    ) {
        let progress = Double(totalBytesWritten) / Double(totalBytesExpectedToWrite)
        DispatchQueue.main.async {
            self.progressPublisher.send(progress)
        }
    }

    // Obsługa błędów i wznawiania przerwanego pobierania
    func urlSession(
        _ session: URLSession,
        task: URLSessionTask,
        didCompleteWithError error: Error?
    ) {
        guard let error = error as NSError?,
              let resumeData = error.userInfo[NSURLSessionDownloadTaskResumeData] as? Data
        else { return }
        // Serwer wspiera Range - wznów od miejsca przerwania
        let resumeTask = backgroundSession.downloadTask(withResumeData: resumeData)
        resumeTask.resume()
    }
}
```

Kluczowe zasady: completion handler z `handleEventsForBackgroundURLSession` musi być wywołany po obsłudze wszystkich zdarzeń delegata - inaczej system ponownie obudzi aplikację. Plik tymczasowy pod `location` jest usuwany natychmiast po powrocie z `didFinishDownloadingTo`, więc przeniesienie musi nastąpić synchronicznie wewnątrz tej metody.
