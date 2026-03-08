# Sieć i API w iOS — URLSession, Alamofire, Combine

iOS oferuje `URLSession` jako wbudowany klient HTTP z pełnym wsparciem dla `async/await`. Alamofire to popularna biblioteka upraszczająca złożone scenariusze. Combine umożliwia reaktywne pipelines.

## URLSession — podstawy async/await

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

## API Repository — warstwa danych

```swift
// Protokół + implementacja — umożliwia MockRepository w testach
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

    // Debounce wyszukiwania — poczekaj 300ms po ostatnim keystroke
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
            // Anulowano — ignoruj
        } catch {
            errorMessage = error.localizedDescription
        }
        isLoading = false
    }
}
```

## Alamofire — zaawansowane scenariusze

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
// Reaktywny pipeline — przydatny gdy korzystasz z ObservableObject + @Published
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
