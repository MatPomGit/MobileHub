# Ekosystem iOS i App Store

Ekosystem Apple to jeden z najbardziej dochodowych rynków mobilnych. Mimo mniejszego globalnego udziału w rynku urządzeń, generuje 2–3× wyższe przychody z aplikacji niż Android, co wynika z wyższej siły nabywczej użytkowników i większej skłonności do płacenia.

## Platformy w ekosystemie Apple

| Platforma | System | SDK | Urządzenia |
|-----------|--------|-----|-----------|
| **iPhone** | iOS | UIKit + SwiftUI | iPhone 15, SE... |
| **iPad** | iPadOS | UIKit + SwiftUI + iPadOS APIs | iPad Pro, Air, Mini |
| **Mac** | macOS | AppKit + SwiftUI | MacBook, iMac |
| **Apple Watch** | watchOS | WatchKit + SwiftUI | Series 9, Ultra 2 |
| **Apple TV** | tvOS | UIKit + SwiftUI | Apple TV 4K |
| **Apple Vision Pro** | visionOS | RealityKit + SwiftUI | Vision Pro |

## Mac Catalyst i Universal Apps

```swift
// Jedna aplikacja działająca na iPhone, iPad i Mac
// Xcode: Signing & Capabilities → Mac Catalyst (checkbox)

// Adaptacja UI do platformy
#if targetEnvironment(macCatalyst)
    // Kod specyficzny dla Mac Catalyst
    let toolbarItem = NSToolbarItem(itemIdentifier: .init("refresh"))
#else
    // iOS/iPadOS
    navigationItem.rightBarButtonItem = UIBarButtonItem(
        barButtonSystemItem: .refresh, target: self, action: #selector(refresh)
    )
#endif

// SwiftUI — platform-adaptive design
struct ContentView: View {
    var body: some View {
        NavigationSplitView {
            SidebarView()        // Na iPad i Mac: sidebar
        } detail: {
            DetailView()         // Na iPhone: zastępuje navigation stack
        }
    }
}
```

## App Store Connect — publikacja

### Konto Apple Developer
- **Individual**: $99/rok — publikacja na App Store
- **Organization**: $99/rok — wymaga numeru D-U-N-S
- **Enterprise**: $299/rok — dystrybucja wewnętrzna bez App Store
- **Student (Swift Student Challenge)**: bezpłatne

### App Store Connect — kluczowe sekcje

```
App Information     → Metadane: opis, słowa kluczowe, zrzuty ekranu
TestFlight          → Dystrybucja beta (wewnętrzna + zewnętrzna)
App Review          → Status review, odwołania, kontakt z Apple
Pricing & Avail.    → Cena, kraje dystrybucji
App Analytics       → Instalacje, sesje, crashe, retencja
Sales & Trends      → Przychody, konwersje, source
```

### Privacy Manifest (wymagany od 2024)

Apple wymaga deklaracji dla każdego API zbierającego dane:

```xml
<!-- PrivacyInfo.xcprivacy -->
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "...">
<plist version="1.0">
<dict>
    <!-- API, których używa aplikacja -->
    <key>NSPrivacyAccessedAPITypes</key>
    <array>
        <dict>
            <key>NSPrivacyAccessedAPIType</key>
            <string>NSPrivacyAccessedAPICategoryUserDefaults</string>
            <key>NSPrivacyAccessedAPITypeReasons</key>
            <array>
                <string>CA92.1</string>  <!-- Preferencje użytkownika -->
            </array>
        </dict>
        <dict>
            <key>NSPrivacyAccessedAPIType</key>
            <string>NSPrivacyAccessedAPICategoryFileTimestamp</string>
            <key>NSPrivacyAccessedAPITypeReasons</key>
            <array>
                <string>C617.1</string>  <!-- Własne pliki aplikacji -->
            </array>
        </dict>
    </array>
    <!-- Dane zbierane od użytkownika -->
    <key>NSPrivacyCollectedDataTypes</key>
    <array>
        <dict>
            <key>NSPrivacyCollectedDataType</key>
            <string>NSPrivacyCollectedDataTypeEmailAddress</string>
            <key>NSPrivacyCollectedDataTypeLinked</key>
            <true/>
            <key>NSPrivacyCollectedDataTypeTracking</key>
            <false/>
            <key>NSPrivacyCollectedDataTypePurposes</key>
            <array><string>NSPrivacyCollectedDataTypePurposeAppFunctionality</string></array>
        </dict>
    </array>
    <key>NSPrivacyTracking</key>
    <false/>
</dict>
</plist>
```

## TestFlight — dystrybucja beta

```bash
# Upload przez Xcode: Product → Archive → Distribute App → App Store Connect
# Lub przez wiersz poleceń:
xcrun altool --upload-app \
    --file MyApp.ipa \
    --type ios \
    --username "dev@example.com" \
    --password "@keychain:AC_PASSWORD"  # hasło z Keychain, nie plain text
```

**Wewnętrzni testerzy**: do 100 osób z Team, dostęp natychmiastowy bez review  
**Zewnętrzni testerzy**: do 10 000 osób, wymaga Beta App Review (1–2 dni)

```swift
// Sprawdzenie w kodzie czy app działa przez TestFlight
extension Bundle {
    var isTestFlight: Bool {
        appStoreReceiptURL?.lastPathComponent == "sandboxReceipt"
    }
}

if Bundle.main.isTestFlight {
    // Pokaż dodatkowe opcje debugowania
}
```

## StoreKit 2 — zakupy i subskrypcje

```swift
import StoreKit

@MainActor
class StoreViewModel: ObservableObject {
    @Published var products: [Product] = []
    @Published var purchasedIDs: Set<String> = []

    let productIDs = ["premium_monthly", "premium_yearly", "coins_100", "coins_1000"]

    func loadProducts() async {
        do {
            products = try await Product.products(for: Set(productIDs))
            // Posortuj: subskrypcje przed jednorazowymi
            products.sort {
                $0.type == .autoRenewable && $1.type != .autoRenewable
            }
        } catch { print("Błąd: \(error)") }
    }

    func purchase(_ product: Product) async throws {
        let result = try await product.purchase()
        switch result {
        case .success(let verification):
            let transaction = try checkVerified(verification)
            purchasedIDs.insert(transaction.productID)
            await transaction.finish()

        case .userCancelled:
            break  // użytkownik anulował — OK

        case .pending:
            // Oczekiwanie np. na zatwierdzenie przez rodzica (Family Sharing)
            print("Zakup oczekuje na zatwierdzenie")

        @unknown default: break
        }
    }

    func restorePurchases() async {
        for await result in Transaction.currentEntitlements {
            if case .verified(let transaction) = result {
                purchasedIDs.insert(transaction.productID)
            }
        }
    }

    private func checkVerified<T>(_ result: VerificationResult<T>) throws -> T {
        switch result {
        case .unverified(_, let error): throw error
        case .verified(let value): return value
        }
    }
}
```

## App Store Optimization (ASO)

Czynniki wpływające na widoczność w App Store:

```
Nazwa aplikacji         → 30 znaków — najważniejsza rola w SEO
Podtytuł                → 30 znaków — dodatkowe słowa kluczowe
Słowa kluczowe          → 100 znaków — tylko ukryte, nie widoczne dla użytkowników
Opis                    → 4000 znaków — pierwsze 3 linie widoczne bez rozwijania
Zrzuty ekranu           → 10 slotów — decydują o konwersji na install
Recenzje i oceny        → algorytm premiuje nowe pozytywne recenzje
In-App Events           → powiadomienia o eventach widoczne w wyszukiwarce
```

## Dystrybucja alternatywna (UE — od iOS 17.4)

Regulacja UE DMA (Digital Markets Act) wymusiła na Apple możliwość instalacji aplikacji z alternatywnych sklepów w Unii Europejskiej:

```swift
// Sprawdzenie regionu dla funkcji dostępnych tylko w UE
if Locale.current.region?.identifier == "EU" {
    // Możliwość użycia alternatywnych metod płatności
}
```

## Linki

- [App Store Connect](https://appstoreconnect.apple.com)
- [App Review Guidelines](https://developer.apple.com/app-store/review/guidelines/)
- [TestFlight Docs](https://developer.apple.com/testflight/)
- [StoreKit 2](https://developer.apple.com/documentation/storekit)
- [Privacy Manifest](https://developer.apple.com/documentation/bundleresources/privacy_manifest_files)
