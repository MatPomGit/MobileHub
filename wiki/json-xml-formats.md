# JSON i XML — formaty wymiany danych

JSON i XML to dwa najszerzej stosowane formaty wymiany danych w ekosystemie mobilnym. Przez lata XML był dominującym standardem — napędzał konfigurację Androida, SOAP API i wiele protokołów enterprise. Dziś w nowych projektach przeważa JSON: jest zwięzły, czytelny i ma natywne wsparcie w językach skryptowych. Oba formaty współistnieją — XML wciąż jest nieodłączną częścią ekosystemu Android (resources, manifest, layout), a JSON króluje w REST API i lokalnym przechowywaniu konfiguracji.

Ten artykuł omawia strukturę, typowe przypadki użycia, parsowanie w Kotlinie i Swifcie oraz najczęstsze pułapki związane z każdym z formatów.

## JSON — JavaScript Object Notation

### Struktura i składnia

JSON jest zdefiniowany przez standard [RFC 8259](https://datatracker.ietf.org/doc/html/rfc8259). Obsługuje sześć typów wartości:

| Typ | Przykład |
|-----|---------|
| String | `"Warszawa"` |
| Number | `42`, `3.14`, `-7`, `1.2e10` |
| Boolean | `true`, `false` |
| Null | `null` |
| Array | `[1, "dwa", true]` |
| Object | `{"klucz": "wartość"}` |

Przykładowa struktura odpowiedzi REST API zwracającej profil użytkownika:

```json
{
  "id": 1024,
  "username": "anna_kowalska",
  "email": "anna@example.com",
  "active": true,
  "score": 98.6,
  "roles": ["user", "moderator"],
  "address": {
    "street": "ul. Kwiatowa 5",
    "city": "Kraków",
    "postalCode": "30-001"
  },
  "createdAt": "2024-03-15T14:22:00Z",
  "deletedAt": null
}
```

### Przypadki użycia JSON w aplikacjach mobilnych

- **REST API** — de facto standard komunikacji z backendem,
- **Lokalna konfiguracja** — pliki ustawień aplikacji, feature flags,
- **Cache odpowiedzi HTTP** — zapis odpowiedzi na dysk z pominięciem ponownego żądania,
- **Wymiana danych między komponentami** — np. argument nawigacyjny w Android Navigation Component,
- **Bazy dokumentowe** — lokalny JSON jako uproszczona baza (np. pliki przechowywane przez `DataStore`).

### Parsowanie JSON w Kotlinie — kotlinx.serialization

`kotlinx.serialization` to oficjalna biblioteka Kotlin, zalecana przez Google dla nowych projektów Android. Jest w pełni Kotlin-first, obsługuje `suspend` i działa z Kotlin Multiplatform.

**Konfiguracja (build.gradle.kts):**

```kotlin
plugins {
    kotlin("plugin.serialization") version "1.9.22"
}

dependencies {
    implementation("org.jetbrains.kotlinx:kotlinx-serialization-json:1.6.3")
}
```

**Definicja modelu:**

```kotlin
import kotlinx.serialization.SerialName
import kotlinx.serialization.Serializable

@Serializable
data class UserProfile(
    val id: Long,
    val username: String,
    val email: String,
    val active: Boolean,
    val score: Double,
    val roles: List<String>,
    val address: Address,
    @SerialName("createdAt") val createdAt: String,
    @SerialName("deletedAt") val deletedAt: String? = null
)

@Serializable
data class Address(
    val street: String,
    val city: String,
    val postalCode: String
)
```

**Deserializacja:**

```kotlin
import kotlinx.serialization.json.Json

// Konfiguracja parsera — warto ją współdzielić jako singleton
val json = Json {
    ignoreUnknownKeys = true   // bezpieczne przy ewolucji API
    isLenient = false          // ścisłe przestrzeganie standardu JSON
    coerceInputValues = false  // nie wymuszaj konwersji typów
    prettyPrint = false        // produkcja — zwięzły output
}

// Deserializacja z tekstu
fun parseUser(jsonString: String): UserProfile =
    json.decodeFromString<UserProfile>(jsonString)

// Serializacja do tekstu
fun serializeUser(user: UserProfile): String =
    json.encodeToString(UserProfile.serializer(), user)

// Parsowanie listy
fun parseUsers(jsonString: String): List<UserProfile> =
    json.decodeFromString<List<UserProfile>>(jsonString)
```

**Strumieniowe parsowanie dużych odpowiedzi:**

```kotlin
import kotlinx.serialization.json.Json
import kotlinx.serialization.json.decodeFromStream
import java.io.InputStream

fun parseUserFromStream(stream: InputStream): UserProfile =
    json.decodeFromStream<UserProfile>(stream)
```

### Parsowanie JSON w Swifcie — Codable

Swift oferuje protokoły `Encodable` i `Decodable` (łącznie: `Codable`) wbudowane w standardową bibliotekę. Nie wymaga zewnętrznych zależności.

```swift
import Foundation

struct UserProfile: Codable {
    let id: Int
    let username: String
    let email: String
    let active: Bool
    let score: Double
    let roles: [String]
    let address: Address
    let createdAt: String
    let deletedAt: String?

    // Mapowanie snake_case → camelCase
    enum CodingKeys: String, CodingKey {
        case id, username, email, active, score, roles, address
        case createdAt = "created_at"
        case deletedAt = "deleted_at"
    }
}

struct Address: Codable {
    let street: String
    let city: String
    let postalCode: String

    enum CodingKeys: String, CodingKey {
        case street, city
        case postalCode = "postal_code"
    }
}

// Decoder z konfiguracją
let decoder = JSONDecoder()
decoder.dateDecodingStrategy = .iso8601
decoder.keyDecodingStrategy = .convertFromSnakeCase  // automatyczne mapowanie

// Deserializacja
func parseUser(from data: Data) throws -> UserProfile {
    return try decoder.decode(UserProfile.self, from: data)
}

// Serializacja
let encoder = JSONEncoder()
encoder.outputFormatting = [.prettyPrinted, .sortedKeys]
encoder.dateEncodingStrategy = .iso8601

func serialize(user: UserProfile) throws -> Data {
    return try encoder.encode(user)
}
```

**Obsługa błędów:**

```swift
do {
    let user = try parseUser(from: responseData)
    print("Zalogowano: \(user.username)")
} catch DecodingError.keyNotFound(let key, let context) {
    print("Brak klucza: \(key.stringValue) — \(context.debugDescription)")
} catch DecodingError.typeMismatch(let type, let context) {
    print("Zły typ: \(type) — \(context.debugDescription)")
} catch DecodingError.valueNotFound(let type, let context) {
    print("Brak wartości: \(type) — \(context.debugDescription)")
} catch {
    print("Błąd parsowania: \(error)")
}
```

---

## XML — eXtensible Markup Language

### Struktura i składnia

XML jest językiem znaczników opartym na tagach, atrybutach i przestrzeniach nazw. Specyfikacja pochodzi z 1998 roku (W3C). Każdy dokument XML posiada jeden element główny (root) i może zawierać deklarację XML na początku:

```xml
<?xml version="1.0" encoding="UTF-8"?>
<users xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance">
    <user id="1024" active="true">
        <username>anna_kowalska</username>
        <email>anna@example.com</email>
        <roles>
            <role>user</role>
            <role>moderator</role>
        </roles>
        <address>
            <street>ul. Kwiatowa 5</street>
            <city>Kraków</city>
            <postalCode>30-001</postalCode>
        </address>
        <createdAt>2024-03-15T14:22:00Z</createdAt>
    </user>
</users>
```

### Przypadki użycia XML na Androidzie

- **Zasoby aplikacji** — `strings.xml`, `colors.xml`, `dimens.xml`, `styles.xml`,
- **Layout'y UI** — pliki `.xml` definiujące widoki (choć Compose zastępuje to podejście),
- **AndroidManifest.xml** — konfiguracja całej aplikacji,
- **Pliki konfiguracyjne** — np. `network_security_config.xml`,
- **SOAP API** — starsze systemy enterprise,
- **RSS/Atom feed** — subskrypcje wiadomości.

Przykład zasobu `strings.xml`:

```xml
<?xml version="1.0" encoding="utf-8"?>
<resources>
    <string name="app_name">MojaAplikacja</string>
    <string name="welcome_message">Witaj, %1$s!</string>
    <plurals name="items_count">
        <item quantity="one">%d element</item>
        <item quantity="few">%d elementy</item>
        <item quantity="many">%d elementów</item>
        <item quantity="other">%d elementów</item>
    </plurals>
</resources>
```

### Parsowanie XML w Kotlinie — XmlPullParser

Android dostarcza `XmlPullParser` — lekki parser strumieniowy (SAX-like), który nie ładuje całego dokumentu do pamięci. Jest odpowiedni dla plików XML z zasobów aplikacji lub odpowiedzi sieciowych.

```kotlin
import android.util.Xml
import org.xmlpull.v1.XmlPullParser
import java.io.InputStream

data class RssItem(
    val title: String,
    val link: String,
    val description: String
)

fun parseRssFeed(inputStream: InputStream): List<RssItem> {
    val items = mutableListOf<RssItem>()
    val parser: XmlPullParser = Xml.newPullParser().apply {
        setFeature(XmlPullParser.FEATURE_PROCESS_NAMESPACES, false)
        setInput(inputStream, "UTF-8")
    }

    var eventType = parser.eventType
    var currentTitle = ""
    var currentLink = ""
    var currentDesc = ""
    var insideItem = false

    while (eventType != XmlPullParser.END_DOCUMENT) {
        when (eventType) {
            XmlPullParser.START_TAG -> {
                when (parser.name) {
                    "item" -> insideItem = true
                    "title" -> if (insideItem) currentTitle = parser.nextText()
                    "link"  -> if (insideItem) currentLink = parser.nextText()
                    "description" -> if (insideItem) currentDesc = parser.nextText()
                }
            }
            XmlPullParser.END_TAG -> {
                if (parser.name == "item" && insideItem) {
                    items.add(RssItem(currentTitle, currentLink, currentDesc))
                    currentTitle = ""; currentLink = ""; currentDesc = ""
                    insideItem = false
                }
            }
        }
        eventType = parser.next()
    }
    return items
}
```

---

## Porównanie JSON vs XML

| Cecha | JSON | XML |
|-------|------|-----|
| Czytelność | Dobra | Umiarkowana (verbose) |
| Rozmiar pliku | Mniejszy (~30–50% mniej) | Większy (tagi powielają nazwy) |
| Szybkość parsowania | Szybsze | Wolniejsze (więcej tokenów) |
| Obsługa komentarzy | ❌ Brak | ✅ Tak (`<!-- -->`) |
| Obsługa atrybutów | ❌ Brak (tylko obiekty i tablice) | ✅ Tak |
| Przestrzenie nazw | ❌ Brak | ✅ Tak (`xmlns`) |
| Typy danych | Podstawowe (string, number, bool, null) | Wszystko jako tekst (wymaga schemy) |
| Schema / walidacja | JSON Schema | XSD, DTD, Schematron |
| Wsparcie ekosystemu Android | `kotlinx.serialization`, Gson, Moshi | `XmlPullParser`, DOM, SAX |
| Wsparcie iOS | `Codable` (wbudowane) | `XMLParser` (wbudowany) |
| REST API | ✅ Dominuje | ❌ Rzadko (głównie SOAP) |
| Zasoby aplikacji Android | ❌ Nie | ✅ Tak (wymagane) |

## JSON Schema — walidacja struktury

JSON Schema pozwala zdefiniować i zweryfikować strukturę dokumentu JSON. Choć Android i iOS nie mają wbudowanej walidacji JSON Schema, można ją zaimplementować ręcznie lub użyć biblioteki.

```json
{
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "title": "UserProfile",
  "type": "object",
  "required": ["id", "username", "email"],
  "properties": {
    "id": {
      "type": "integer",
      "minimum": 1
    },
    "username": {
      "type": "string",
      "minLength": 3,
      "maxLength": 50,
      "pattern": "^[a-z0-9_]+$"
    },
    "email": {
      "type": "string",
      "format": "email"
    },
    "roles": {
      "type": "array",
      "items": {
        "type": "string",
        "enum": ["user", "moderator", "admin"]
      },
      "uniqueItems": true
    }
  },
  "additionalProperties": false
}
```

W Kotlinie można przeprowadzić prostą walidację przez konfigurację parsera:

```kotlin
val strictJson = Json {
    ignoreUnknownKeys = false  // błąd przy nieznanych kluczach
    isLenient = false           // ścisła składnia
}

try {
    val user = strictJson.decodeFromString<UserProfile>(rawJson)
} catch (e: SerializationException) {
    // Zły typ, brakujące pole obowiązkowe, itp.
    Log.e("JSON", "Błąd walidacji: ${e.message}")
}
```

## Pułapki i problemy praktyczne

### Duże payloady i pamięć

Parsowanie dużego JSON-a przez DOM (wczytanie całości do pamięci) może spowodować `OutOfMemoryError` na słabszych urządzeniach. Przy odpowiedziach przekraczających ~5 MB warto stosować parser strumieniowy:

```kotlin
import kotlinx.serialization.json.Json
import kotlinx.serialization.json.decodeToSequence

// Parsowanie tablicy JSON jako strumień — element po elemencie
fun processLargeArray(stream: InputStream) {
    val sequence = json.decodeToSequence<UserProfile>(stream)
    sequence.forEach { user ->
        // przetwórz user bez trzymania całej listy w RAM-ie
        database.insertUser(user)
    }
}
```

### Zagnieżdżone struktury

Głęboko zagnieżdżony JSON (więcej niż 5–6 poziomów) jest trudny do utrzymania i podatny na błędy parsowania. Warto spłaszczyć strukturę po stronie serwera lub zastosować dedykowany typ odpowiedzi z `sealed class`:

```kotlin
@Serializable
sealed class ApiResult<out T> {
    @Serializable
    data class Success<T>(val data: T) : ApiResult<T>()

    @Serializable
    data class Error(val code: Int, val message: String) : ApiResult<Nothing>()
}
```

### Liczby zmiennoprzecinkowe

JSON nie rozróżnia `int` i `float`. Wartość `42` może zostać zinterpretowana jako `Double` w zależności od parsera. W Kotlinie `kotlinx.serialization` wymaga jawnych typów w modelu, co eliminuje ten problem — ale przy dynamicznym parsowaniu (`JsonElement`) należy uważać:

```kotlin
val element = json.parseToJsonElement("""{"price": 9.99}""")
val price = element.jsonObject["price"]?.jsonPrimitive?.double  // ✅
// Nigdy nie używaj toString() i parseInt() na liczbach JSON!
```

### Daty i strefy czasowe

JSON nie ma wbudowanego typu daty — daty są zawsze stringami. Konwencja ISO 8601 (`"2024-03-15T14:22:00Z"`) jest powszechna, ale jej parsowanie wymaga jawnej konfiguracji:

```kotlin
@Serializable
data class Event(
    @Serializable(with = InstantSerializer::class)
    val createdAt: Instant
)
```

```swift
// Swift — dekoder z obsługą ISO 8601
let decoder = JSONDecoder()
decoder.dateDecodingStrategy = .iso8601
```

### Kodowanie polskich znaków w XML

XML deklaruje kodowanie w nagłówku. Brak deklaracji = domyślne UTF-8, co zazwyczaj jest poprawne. Jednak przy ręcznym tworzeniu dokumentów XML w Kotlinie:

```kotlin
// Zawsze dodawaj deklarację z kodowaniem
val xmlString = buildString {
    appendLine("""<?xml version="1.0" encoding="UTF-8"?>""")
    appendLine("<root>")
    appendLine("  <message>Zażółć gęślą jaźń</message>")
    appendLine("</root>")
}
```

## Podsumowanie

JSON jest domyślnym wyborem dla REST API, lokalnej konfiguracji i wymiany danych między komponentami. XML pozostaje wymagany w ekosystemie Android (zasoby, manifest) i w systemach enterprise (SOAP). Znajomość obu formatów i ich parserów jest obowiązkowa dla każdego mobilnego programisty.

W następnym artykule omówimy lżejsze formaty: CSV, YAML i TOML, które sprawdzają się w konfiguracji, danych tabelarycznych i plikach CI/CD.
