# Powiadomienia Push w iOS

Powiadomienia to jeden z najpotężniejszych mechanizmów angażowania użytkowników. iOS rozróżnia powiadomienia **lokalne** (bez serwera, generowane przez aplikację) i **zdalne** (push notifications przez Apple Push Notification service — APNs).

## Lokalne powiadomienia

```swift
import UserNotifications

class NotificationManager {
    static let shared = NotificationManager()
    private let center = UNUserNotificationCenter.current()

    // 1. Poproś o uprawnienia (TYLKO RAZ — wyjaśnij kontekst przed pytaniem!)
    func requestAuthorization() async -> Bool {
        do {
            return try await center.requestAuthorization(
                options: [.alert, .sound, .badge, .providesAppNotificationSettings]
            )
        } catch {
            print("Błąd uprawnień: \(error)")
            return false
        }
    }

    // 2. Zaplanuj powiadomienie — trigger czasowy
    func scheduleReminder(title: String, body: String, inSeconds delay: TimeInterval) {
        let content = UNMutableNotificationContent()
        content.title = title
        content.body = body
        content.sound = .default
        content.badge = 1
        // Customowe dane — dostępne gdy użytkownik tapnie
        content.userInfo = ["action": "open_reminder", "screen": "home"]
        // Załącznik (obrazek, audio max 10MB)
        // content.attachments = [try! UNNotificationAttachment(...)]

        let trigger = UNTimeIntervalNotificationTrigger(timeInterval: delay, repeats: false)
        let request = UNNotificationRequest(
            identifier: UUID().uuidString,
            content: content,
            trigger: trigger
        )
        center.add(request) { error in
            if let error { print("Błąd dodania: \(error)") }
        }
    }

    // 3. Trigger kalendarzowy — codziennie o 9:00
    func scheduleDailyReminder(hour: Int, minute: Int) {
        let content = UNMutableNotificationContent()
        content.title = "Twoje zadania na dziś"
        content.body = "Masz 3 nieukończone zadania"
        content.sound = .default

        var dateComponents = DateComponents()
        dateComponents.hour = hour
        dateComponents.minute = minute

        let trigger = UNCalendarNotificationTrigger(dateMatching: dateComponents, repeats: true)
        let request = UNNotificationRequest(identifier: "daily_reminder", content: content, trigger: trigger)
        center.add(request)
    }

    // 4. Trigger lokalizacyjny — geofence
    func scheduleLocationNotification(lat: Double, lng: Double, radius: CLLocationDistance = 100) {
        let content = UNMutableNotificationContent()
        content.title = "Jesteś blisko!"
        content.body = "W pobliżu jest Twój ulubiony sklep."
        content.sound = .default

        let region = CLCircularRegion(
            center: CLLocationCoordinate2D(latitude: lat, longitude: lng),
            radius: radius,
            identifier: "shop_region"
        )
        region.notifyOnEntry = true
        region.notifyOnExit = false

        let trigger = UNLocationNotificationTrigger(region: region, repeats: true)
        let request = UNNotificationRequest(identifier: "location_notify", content: content, trigger: trigger)
        center.add(request)
    }

    // Usuń zaplanowane powiadomienia
    func removeAll() = center.removeAllPendingNotificationRequests()
    func remove(id: String) = center.removePendingNotificationRequests(withIdentifiers: [id])
}
```

## Obsługa tapnięcia — UNUserNotificationCenterDelegate

```swift
extension AppDelegate: UNUserNotificationCenterDelegate {
    // Powiadomienie gdy aplikacja jest na pierwszym planie
    func userNotificationCenter(
        _ center: UNUserNotificationCenter,
        willPresent notification: UNNotification,
        withCompletionHandler completionHandler: @escaping (UNNotificationPresentationOptions) -> Void
    ) {
        // Bez tego powiadomienia są ukryte gdy app jest active
        completionHandler([.banner, .sound, .badge])
    }

    // Użytkownik tapnął powiadomienie
    func userNotificationCenter(
        _ center: UNUserNotificationCenter,
        didReceive response: UNNotificationResponse,
        withCompletionHandler completionHandler: @escaping () -> Void
    ) {
        let userInfo = response.notification.request.content.userInfo
        let screen = userInfo["screen"] as? String

        switch response.actionIdentifier {
        case UNNotificationDefaultActionIdentifier:
            // Standardowe tapnięcie
            navigateTo(screen: screen ?? "home")
        case "COMPLETE_ACTION":
            // Custom action button
            markTaskComplete(id: userInfo["taskId"] as? String ?? "")
        case UNNotificationDismissActionIdentifier:
            break // użytkownik odrzucił
        default: break
        }
        completionHandler()
    }
}
```

## Akcje w powiadomieniach — przyciski

```swift
// Zdefiniuj kategorię z akcjami (tylko raz przy starcie aplikacji)
func registerNotificationCategories() {
    let completeAction = UNNotificationAction(
        identifier: "COMPLETE_ACTION",
        title: "Oznacz jako wykonane",
        options: [.foreground]
    )
    let snoozeAction = UNNotificationAction(
        identifier: "SNOOZE_ACTION",
        title: "Przypomnij za 1h",
        options: []
    )
    let deleteAction = UNNotificationAction(
        identifier: "DELETE_ACTION",
        title: "Usuń zadanie",
        options: [.destructive]
    )

    let taskCategory = UNNotificationCategory(
        identifier: "TASK_CATEGORY",
        actions: [completeAction, snoozeAction, deleteAction],
        intentIdentifiers: [],
        options: []
    )
    UNUserNotificationCenter.current().setNotificationCategories([taskCategory])
}

// Przypisz kategorię do powiadomienia
content.categoryIdentifier = "TASK_CATEGORY"
```

## Remote Push — APNs

Przepływ zdalnych powiadomień:

```
Aplikacja → rejestracja APNs → Apple → device token
     ↓
Własny serwer backend
     ↓
HTTP/2 request do api.push.apple.com
     ↓
Apple APNs → urządzenie
```

```swift
// Rejestracja push notifications
@UIApplicationMain
class AppDelegate: UIResponder, UIApplicationDelegate {
    func application(_ app: UIApplication, didFinishLaunchingWithOptions launchOptions: [UIApplication.LaunchOptionsKey: Any]?) -> Bool {
        UIApplication.shared.registerForRemoteNotifications()
        return true
    }

    // Otrzymano device token — wyślij na własny serwer
    func application(_ app: UIApplication,
                     didRegisterForRemoteNotificationsWithDeviceToken deviceToken: Data) {
        let token = deviceToken.map { String(format: "%02.2hhx", $0) }.joined()
        print("APNs token: \(token)")
        // Wyślij token na backend:
        // backendAPI.registerDevice(token: token)
    }

    func application(_ app: UIApplication,
                     didFailToRegisterForRemoteNotificationsWithError error: Error) {
        print("APNs rejestracja nieudana: \(error)")
        // Na symulatorze zawsze kończy się błędem — testuj na fizycznym urządzeniu!
    }
}
```

## Payload APNs (format JSON)

```json
{
    "aps": {
        "alert": {
            "title": "Nowe zadanie",
            "subtitle": "Projekt X",
            "body": "Masz nowe zadanie do wykonania do piątku"
        },
        "badge": 5,
        "sound": "default",
        "category": "TASK_CATEGORY",
        "mutable-content": 1,
        "content-available": 1,
        "thread-id": "project-x-notifications",
        "interruption-level": "active"
    },
    "taskId": "task_42",
    "screen": "task_detail"
}
```

| Pole | Opis |
|------|------|
| `mutable-content: 1` | Włącza Notification Service Extension (modyfikacja przed wyświetleniem) |
| `content-available: 1` | Silent push — budzi aplikację w tle bez wyświetlenia banera |
| `interruption-level` | `passive`, `active` (default), `time-sensitive`, `critical` |
| `thread-id` | Grupuje powiązane powiadomienia |

## Notification Service Extension — modyfikacja payload

```swift
// Target: NotificationServiceExtension
class NotificationService: UNNotificationServiceExtension {
    override func didReceive(
        _ request: UNNotificationRequest,
        withContentHandler contentHandler: @escaping (UNNotificationContent) -> Void
    ) {
        guard let mutableContent = request.content.mutableCopy() as? UNMutableNotificationContent else {
            contentHandler(request.content); return
        }

        // Pobierz i dołącz obrazek
        if let urlString = request.content.userInfo["imageUrl"] as? String,
           let url = URL(string: urlString) {
            URLSession.shared.downloadTask(with: url) { localUrl, _, _ in
                if let localUrl,
                   let attachment = try? UNNotificationAttachment(identifier: "image", url: localUrl) {
                    mutableContent.attachments = [attachment]
                }
                contentHandler(mutableContent)
            }.resume()
        } else {
            contentHandler(mutableContent)
        }
    }
}
```

## Live Activities — dynamiczne powiadomienia (iOS 16.2+)

```swift
// Live Activity w Dynamic Island i na ekranie blokady
import ActivityKit

struct DeliveryAttributes: ActivityAttributes {
    struct ContentState: Codable, Hashable {
        var eta: Date
        var currentStatus: String
        var progressPercent: Double
    }
    var orderId: String
    var itemName: String
}

// Start Activity
func startDeliveryActivity(orderId: String, itemName: String, etaMinutes: Int) {
    let attributes = DeliveryAttributes(orderId: orderId, itemName: itemName)
    let state = DeliveryAttributes.ContentState(
        eta: Date().addingTimeInterval(TimeInterval(etaMinutes * 60)),
        currentStatus: "Zamówienie w drodze",
        progressPercent: 0.3
    )
    let content = ActivityContent(state: state, staleDate: Date().addingTimeInterval(7200))
    _ = try? Activity<DeliveryAttributes>.request(attributes: attributes, content: content)
}
```

## Linki

- [UserNotifications Framework](https://developer.apple.com/documentation/usernotifications)
- [APNs Overview](https://developer.apple.com/documentation/usernotifications/setting_up_a_remote_notification_server)
- [Live Activities](https://developer.apple.com/documentation/activitykit)
- [Push Notification Tutorial (Hacking with Swift)](https://www.hackingwithswift.com/read/33/overview)
