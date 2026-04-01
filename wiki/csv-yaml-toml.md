# CSV, YAML i TOML — lekkie formaty danych i konfiguracji

Nie każdy problem wymaga rozbudowanego formatu. CSV sprawdza się doskonale przy eksporcie danych tabelarycznych, YAML jest czytelny jako konfiguracja CI/CD, a TOML zyskał popularność jako plik konfiguracyjny narzędzi deweloperskich. Wszystkie trzy formaty są lżejsze koncepcyjnie od XML i często czytelniejsze od JSON w kontekście konfiguracji. Każdy ma jednak swoje pułapki, które w środowisku mobilnym mogą kosztować wiele godzin debugowania.

## CSV — Comma-Separated Values

### Struktura i składnia

CSV to jeden z najstarszych formatów danych — opisany formalnie w [RFC 4180](https://datatracker.ietf.org/doc/html/rfc4180). Plik składa się z wierszy, a każdy wiersz z pól oddzielonych przecinkiem (lub innym separatorem). Pierwszy wiersz opcjonalnie zawiera nagłówki.

```
id,imię,miasto,wiek,aktywny
1,Anna Kowalska,Kraków,28,true
2,Piotr Wiśniewski,"Warszawa, Śródmieście",35,false
3,Marta Zając,Gdańsk,22,true
```

Kluczowe zasady RFC 4180:
- Pola zawierające przecinek, cudzysłów lub znaki nowej linii muszą być opakowane w `"..."`.
- Wewnętrzny cudzysłów jest reprezentowany przez podwojenie: `""`.
- Koniec wiersza: `CRLF` (`\r\n`), choć `LF` jest też powszechnie akceptowany.

### Przypadki użycia CSV w mobile

- **Eksport/import danych** — raporty finansowe, listy kontaktów, wyniki pomiarów,
- **Seedowanie danych testowych** — wczytanie dużego zestawu danych do lokalnej bazy podczas developmentu,
- **Wymiana z arkuszami kalkulacyjnymi** — Excel i Google Sheets natywnie obsługują CSV,
- **Logi i telemetria** — prosty format do zbierania danych diagnostycznych.

### Parsowanie CSV w Kotlinie

Android nie dostarcza wbudowanego parsera CSV. Dla prostych przypadków można napisać własny; dla produkcji warto użyć biblioteki `opencsv` lub `Apache Commons CSV`.

**Dependency (build.gradle.kts):**

```kotlin
dependencies {
    implementation("com.opencsv:opencsv:5.9")
}
```

**Parsowanie z nagłówkami:**

```kotlin
import com.opencsv.CSVReaderHeaderAware
import java.io.InputStreamReader

data class Contact(
    val id: Int,
    val name: String,
    val city: String,
    val age: Int,
    val active: Boolean
)

fun parseCsvContacts(input: InputStreamReader): List<Contact> {
    val contacts = mutableListOf<Contact>()
    CSVReaderHeaderAware(input).use { reader ->
        var row: Map<String, String>?
        while (reader.readMap().also { row = it } != null) {
            val r = row ?: break
            contacts.add(
                Contact(
                    id = r["id"]?.toIntOrNull() ?: continue,
                    name = r["imię"] ?: continue,
                    city = r["miasto"] ?: "",
                    age = r["wiek"]?.toIntOrNull() ?: 0,
                    active = r["aktywny"]?.trim()?.lowercase() == "true"
                )
            )
        }
    }
    return contacts
}

// Zapis do CSV
fun exportContactsToCsv(contacts: List<Contact>, output: java.io.Writer) {
    output.write("id,imię,miasto,wiek,aktywny\r\n")
    contacts.forEach { c ->
        val city = if (c.city.contains(",")) "\"${c.city}\"" else c.city
        output.write("${c.id},${c.name},$city,${c.age},${c.active}\r\n")
    }
}
```

### Parsowanie CSV w Swifcie

```swift
import Foundation

struct Contact {
    let id: Int
    let name: String
    let city: String
    let age: Int
    let active: Bool
}

func parseCSV(from string: String) -> [Contact] {
    var contacts: [Contact] = []
    let rows = string.components(separatedBy: "\n")
    guard rows.count > 1 else { return contacts }

    // Pomiń wiersz nagłówkowy
    let dataRows = rows.dropFirst()

    for row in dataRows {
        let trimmed = row.trimmingCharacters(in: .whitespacesAndNewlines)
        guard !trimmed.isEmpty else { continue }

        let fields = parseCSVRow(trimmed)
        guard fields.count >= 5,
              let id = Int(fields[0]),
              let age = Int(fields[3]) else { continue }

        contacts.append(Contact(
            id: id,
            name: fields[1],
            city: fields[2],
            age: age,
            active: fields[4].lowercased() == "true"
        ))
    }
    return contacts
}

// Prosta obsługa cudzysłowów w CSV
func parseCSVRow(_ row: String) -> [String] {
    var fields: [String] = []
    var current = ""
    var inQuotes = false

    for char in row {
        switch char {
        case "\"":
            inQuotes.toggle()
        case "," where !inQuotes:
            fields.append(current)
            current = ""
        default:
            current.append(char)
        }
    }
    fields.append(current)
    return fields
}
```

### Pułapki CSV

**Kodowanie znaków** — Excel na Windows domyślnie zapisuje CSV w Windows-1250. Polskie znaki wczytane jako UTF-8 dadzą "krzaki". Zawsze jawnie deklaruj kodowanie:

```kotlin
val reader = InputStreamReader(inputStream, Charsets.UTF_8)
// Nie: InputStreamReader(inputStream)  ← kodowanie zależne od systemu
```

**Separator** — w niektórych krajach (Polska, Niemcy) Excel używa `;` zamiast `,` jako separatora. Warto to obsłużyć lub jawnie dokumentować format.

**Duże pliki** — nigdy nie wczytuj całego pliku CSV do pamięci, jeśli ma tysiące wierszy. Parsuj strumieniowo wiersz po wierszu i przenoś do bazy danych:

```kotlin
fun importLargeCsv(inputStream: InputStream, db: AppDatabase) {
    inputStream.bufferedReader(Charsets.UTF_8).useLines { lines ->
        lines.drop(1)  // pomiń nagłówek
             .chunked(100)  // wstaw paczkami po 100
             .forEach { chunk ->
                 val contacts = chunk.mapNotNull { parseLine(it) }
                 db.contactDao().insertAll(contacts)
             }
    }
}
```

---

## YAML — YAML Ain't Markup Language

### Struktura i składnia

YAML jest formatem serializacji danych zorientowanym na czytelność. Zamiast nawiasów i cudzysłowów używa wcięć (spacje, nie tabulatory!) i myślników dla list.

```yaml
# Konfiguracja aplikacji mobilnej
app:
  name: "MojaAplikacja"
  version: "2.1.0"
  debug: false

server:
  baseUrl: "https://api.example.com"
  timeout: 30       # sekundy
  retries: 3

features:
  darkMode: true
  pushNotifications: true
  analytics: false

supportedLanguages:
  - pl
  - en
  - de

database:
  name: app_db
  version: 5
  migrations:
    - from: 4
      to: 5
      description: "Dodano tabelę events"
```

### Przypadki użycia YAML w mobile dev

- **Konfiguracja CI/CD** — `bitrise.yml`, pliki GitHub Actions (`.github/workflows/`),
- **Konfiguracja narzędzi** — `detekt.yml` (linter Kotlin), `danger.yml`,
- **Pliki konfiguracyjne aplikacji** — gdy JSON jest zbyt mało czytelny,
- **Dane testowe** — fixtures dla testów jednostkowych.

Przykład pipeline CI na GitHub Actions:

```yaml
name: Android CI

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]

jobs:
  build:
    runs-on: ubuntu-latest

    steps:
      - uses: actions/checkout@v4

      - name: Set up JDK 17
        uses: actions/setup-java@v4
        with:
          java-version: "17"
          distribution: "temurin"

      - name: Build with Gradle
        run: ./gradlew assembleDebug

      - name: Run tests
        run: ./gradlew test

      - name: Upload APK
        uses: actions/upload-artifact@v4
        with:
          name: debug-apk
          path: app/build/outputs/apk/debug/
```

### Parsowanie YAML w Kotlinie

Android nie obsługuje YAML natywnie. W aplikacji mobilnej YAML jest rzadko parsowany w runtime — częściej jest to format konfiguracji narzędzi deweloperskich lub CI. Jeśli jednak potrzebujesz parsować YAML w aplikacji, możesz użyć biblioteki `snakeyaml`:

```kotlin
dependencies {
    implementation("org.yaml:snakeyaml:2.2")
}
```

```kotlin
import org.yaml.snakeyaml.Yaml
import org.yaml.snakeyaml.constructor.Constructor

data class AppConfig(
    var name: String = "",
    var version: String = "",
    var debug: Boolean = false
)

data class ServerConfig(
    var baseUrl: String = "",
    var timeout: Int = 30,
    var retries: Int = 3
)

fun loadAppConfig(yamlString: String): Map<String, Any> {
    val yaml = Yaml()
    @Suppress("UNCHECKED_CAST")
    return yaml.load(yamlString) as Map<String, Any>
}

// Bezpieczne pobieranie zagnieżdżonych wartości
fun Map<String, Any>.getNestedString(vararg keys: String): String? {
    var current: Any? = this
    for (key in keys) {
        current = (current as? Map<*, *>)?.get(key) ?: return null
    }
    return current as? String
}

// Użycie:
// val config = loadAppConfig(yamlContent)
// val baseUrl = config.getNestedString("server", "baseUrl")
```

### Gotchas YAML — najczęstsze pułapki

**Wcięcia** — jedyne dozwolone wcięcie to spacje (NIE tabulatory). Mieszanie spacją/tabulatorem powoduje błąd parsowania.

**Koercja typów** — YAML agresywnie interpretuje wartości bez cudzysłowów:

```yaml
# PUŁAPKI typów w YAML:
version: 1.0         # → Float 1.0, nie String "1.0"
debug: yes           # → Boolean true (nie String "yes"!)
country: NO          # → Boolean false (kod kraju Norwegii!)
value: 0755          # → Integer 493 (ósemkowy!)
date: 2024-03-15     # → Date object, nie String

# BEZPIECZNA wersja (jawne stringi):
version: "1.0"
debug: "yes"
country: "NO"
value: "0755"
date: "2024-03-15"
```

**Wiele dokumentów** — YAML pozwala na wiele dokumentów w jednym pliku (oddzielonych `---`), co bywa zaskakujące.

---

## TOML — Tom's Obvious, Minimal Language

### Struktura i składnia

TOML został stworzony przez Toma Preston-Wernera (współzałożyciela GitHub) jako format konfiguracyjny, który jest oczywisty w czytaniu i jednoznaczny w parsowaniu. Inspiracją były `.ini` files, ale z rozbudowaną typizacją.

```toml
# Konfiguracja aplikacji w TOML

[app]
name = "MojaAplikacja"
version = "2.1.0"
debug = false
buildDate = 2024-03-15  # Data — natywny typ TOML

[server]
baseUrl = "https://api.example.com"
timeout = 30
retries = 3
tags = ["production", "eu-west"]

[database]
name = "app_db"
version = 5

[[database.migrations]]
from = 4
to = 5
description = "Dodano tabelę events"

[[database.migrations]]
from = 3
to = 4
description = "Zmiana schematu użytkowników"

[features]
darkMode = true
pushNotifications = true
analytics = false
```

### Dlaczego TOML zyskał popularność?

TOML jest domyślnym formatem konfiguracyjnym dla:
- **Rust** — `Cargo.toml` (manifest pakietu),
- **Python** — `pyproject.toml` (PEP 518),
- **Hugo** (generator stron), **pip**, **poetry**, **ruff**,
- **Gradle Version Catalogs** — `libs.versions.toml` w Androidzie.

W kontekście Androida TOML jest szczególnie istotny jako format **Gradle Version Catalog**:

```toml
# gradle/libs.versions.toml

[versions]
kotlin = "1.9.22"
compose = "1.6.3"
room = "2.6.1"
retrofit = "2.9.0"
okhttp = "4.12.0"

[libraries]
retrofit-core = { module = "com.squareup.retrofit2:retrofit", version.ref = "retrofit" }
retrofit-gson = { module = "com.squareup.retrofit2:converter-gson", version.ref = "retrofit" }
okhttp = { module = "com.squareup.okhttp3:okhttp", version.ref = "okhttp" }
okhttp-logging = { module = "com.squareup.okhttp3:logging-interceptor", version.ref = "okhttp" }
room-runtime = { module = "androidx.room:room-runtime", version.ref = "room" }
room-compiler = { module = "androidx.room:room-compiler", version.ref = "room" }
room-ktx = { module = "androidx.room:room-ktx", version.ref = "room" }

[plugins]
android-application = { id = "com.android.application", version = "8.2.2" }
kotlin-android = { id = "org.jetbrains.kotlin.android", version.ref = "kotlin" }
kotlin-serialization = { id = "org.jetbrains.kotlin.plugin.serialization", version.ref = "kotlin" }
```

Użycie w `build.gradle.kts`:

```kotlin
dependencies {
    implementation(libs.retrofit.core)
    implementation(libs.retrofit.gson)
    implementation(libs.okhttp)
    implementation(libs.okhttp.logging)
    implementation(libs.room.runtime)
    implementation(libs.room.ktx)
    ksp(libs.room.compiler)
}
```

### Parsowanie TOML w Kotlinie

Dla parsowania TOML w runtime (np. wczytanie pliku konfiguracyjnego w aplikacji) można użyć biblioteki `toml4j` lub `ktoml`:

```kotlin
dependencies {
    implementation("com.akuleshov7:ktoml-core:0.5.1")
    implementation("com.akuleshov7:ktoml-file:0.5.1")
}
```

```kotlin
import com.akuleshov7.ktoml.Toml
import kotlinx.serialization.Serializable

@Serializable
data class AppSection(
    val name: String,
    val version: String,
    val debug: Boolean = false
)

@Serializable
data class ServerSection(
    val baseUrl: String,
    val timeout: Int = 30,
    val retries: Int = 3
)

@Serializable
data class AppConfig(
    val app: AppSection,
    val server: ServerSection
)

fun loadTomlConfig(tomlString: String): AppConfig =
    Toml.decodeFromString(AppConfig.serializer(), tomlString)

// Przykład wczytania pliku TOML z assets
fun loadConfigFromAssets(context: android.content.Context): AppConfig {
    val tomlContent = context.assets.open("config.toml")
        .bufferedReader(Charsets.UTF_8)
        .readText()
    return loadTomlConfig(tomlContent)
}
```

### TOML vs YAML — kluczowe różnice

| Cecha | TOML | YAML |
|-------|------|------|
| Hierarchia | Sekcje `[table]` | Wcięcia |
| Listy | `tags = ["a", "b"]` | `- a` / `- b` |
| Koercja typów | Ścisła (jawne typy) | Agresywna (pułapki) |
| Komentarze | `#` | `#` |
| Wieloliniowe stringi | `"""..."""` | `|` lub `>` |
| Natywne typy dat | ✅ (RFC 3339) | ✅ (ale koercja!) |
| Zagnieżdżenie | Mniej naturalne przy głębokich strukturach | Naturalniejsze |
| Specyfikacja | Prosta, jednoznaczna | Skomplikowana (wiele edge-casów) |

---

## Tabela porównawcza: CSV, YAML, TOML vs JSON

| Kryterium | CSV | YAML | TOML | JSON |
|-----------|-----|------|------|------|
| Czytelność dla człowieka | ✅ Dobra (tabele) | ✅ Bardzo dobra | ✅ Dobra | ⚠️ Umiarkowana |
| Komentarze | ❌ Brak | ✅ `#` | ✅ `#` | ❌ Brak |
| Hierarchia | ❌ Brak | ✅ Wcięcia | ✅ Sekcje | ✅ Zagnieżdżone obiekty |
| Dane tabelaryczne | ✅ Naturalny | ⚠️ Awkward | ⚠️ `[[tablice]]` | ⚠️ Tablica obiektów |
| Konfiguracja | ❌ Słabo | ✅ Dobra | ✅ Bardzo dobra | ⚠️ Bez komentarzy |
| REST API | ❌ Nie | ❌ Nie | ❌ Nie | ✅ Standard |
| Wsparcie w Android/Kotlin | Biblioteka | Biblioteka | Natywnie (Gradle) | Wbudowane |
| Wsparcie w iOS/Swift | Ręczne/biblioteka | Biblioteka | Biblioteka | Wbudowane (Codable) |
| Ryzyko pułapek | ⚠️ Kodowanie, separator | ⚠️ Koercja typów | ✅ Niskie | ⚠️ Brak komentarzy, daty |
| Rozmiar pliku | ✅ Mały | ⚠️ Średni | ✅ Mały | ⚠️ Średni |
| Szybkość parsowania | ✅ Szybka | ❌ Wolna | ⚠️ Średnia | ✅ Szybka |

## Który format wybrać dla konfiguracji aplikacji mobilnej?

```text
Typ danych                              → Zalecany format
---------------------------------------------------------------
Dane tabelaryczne, eksport/import       → CSV
Konfiguracja pipeline CI/CD             → YAML
Wersje zależności Gradle                → TOML (libs.versions.toml)
Konfiguracja aplikacji bez komentarzy   → JSON
Konfiguracja aplikacji z komentarzami   → TOML
Zasoby tekstowe Android                 → XML (strings.xml)
Dane wymieniane z REST API              → JSON
Proste dane klucz-wartość               → DataStore / SharedPreferences
```

**Praktyczna zasada**: w nowych projektach Android używaj `libs.versions.toml` dla zależności, JSON dla konfiguracji w runtime, i YAML tylko tam, gdzie wymaga go ekosystem (CI, linters).

## Rozważania wydajnościowe

Parsowanie formatów tekstowych w runtime aplikacji mobilnej ma koszty, które warto mierzyć, a nie zgadywać:

```kotlin
// Prosty mikrobenchmark z AndroidX Benchmark
@RunWith(AndroidJUnit4::class)
class ConfigParsingBenchmark {

    @get:Rule
    val benchmarkRule = BenchmarkRule()

    private val jsonConfig = """{"name":"App","version":"1.0","debug":false}"""
    private val json = Json { ignoreUnknownKeys = true }

    @Test
    fun parseJsonConfig() = benchmarkRule.measureRepeated {
        json.decodeFromString<AppSection>(jsonConfig)
    }
}
```

**Ogólne wytyczne dla mobile:**
- Parsuj pliki konfiguracyjne **raz przy starcie**, cache'uj wynik w pamięci.
- Nigdy nie parsuj konfiguracji na wątku UI (main thread).
- Dla plików >100 KB zawsze parsuj w tle (`Dispatchers.IO` w Kotlin Coroutines).
- Preferuj formaty z szybkim parserem (JSON > YAML) dla danych pobieranych w runtime.

```kotlin
// Wczytaj konfigurację raz i cache'uj
class ConfigRepository(private val context: Context) {

    private var _config: AppConfig? = null

    suspend fun getConfig(): AppConfig = withContext(Dispatchers.IO) {
        _config ?: loadConfigFromDisk().also { _config = it }
    }

    private fun loadConfigFromDisk(): AppConfig {
        val json = context.assets.open("config.json")
            .bufferedReader(Charsets.UTF_8)
            .readText()
        return Json.decodeFromString(json)
    }
}
```

## Podsumowanie

CSV, YAML i TOML to lekkie formaty, które mają swoje wyraźne miejsca w ekosystemie mobilnym. CSV sprawdza się jako format eksportu i importu danych tabelarycznych. YAML jest niezbędny w konfiguracji CI/CD. TOML stał się standardem dla `libs.versions.toml` w projektach Android. Żaden z nich nie zastępuje JSON w komunikacji z API ani XML w zasobach Androida — ale każdy jest niezastąpiony w swoim zastosowaniu.
