# Binarne formaty serializacji danych

Serializacja danych to proces przekształcania obiektów lub struktur danych w format, który można zapisać lub przesłać, a następnie odtworzyć. W aplikacjach mobilnych dominuje JSON i XML, jednak binarne formaty serializacji oferują istotne zalety: mniejszy rozmiar, szybszy odczyt/zapis oraz silne typowanie. W tym artykule omówimy najważniejsze binarne formaty serializacji i ich zastosowania na platformach Android i iOS.

---

## Dlaczego warto rozważyć binarną serializację?

### Porównanie z JSON i XML

```json
{
  "id": 12345,
  "name": "Anna Kowalska",
  "email": "anna@example.com",
  "age": 28,
  "active": true,
  "scores": [95, 87, 92, 88]
}
```

Ten sam obiekt w różnych formatach:

| Format      | Rozmiar (bajty) | Czas serializacji | Czas deserializacji | Czytelny dla człowieka |
|-------------|-----------------|-------------------|--------------------|-----------------------|
| JSON        | ~120 B          | 1.0x (baseline)   | 1.0x               | ✅ Tak                |
| XML         | ~220 B          | 2.1x wolniej      | 2.8x wolniej       | ✅ Tak                |
| Protocol Buffers | ~35 B      | 0.2x (5x szybciej) | 0.15x (6x szybciej) | ❌ Nie             |
| FlatBuffers | ~80 B           | ~0 (zero-copy)    | ~0 (zero-copy)     | ❌ Nie                |
| MessagePack | ~60 B           | 0.4x (2.5x szybciej) | 0.3x             | ❌ Nie                |
| CBOR        | ~65 B           | 0.45x             | 0.35x              | ❌ Nie                |

### Kiedy binarna serializacja ma sens?

- **IPC** (Inter-Process Communication) — komunikacja między procesami/serwisami
- **Cache danych** — szybki odczyt z dysku, np. odpowiedzi API
- **Protokoły sieciowe** — API z dużym ruchem (gRPC używa protobuf)
- **Bazy danych** — serializacja złożonych obiektów do SQLite
- **Strumieniowanie danych** — Kafka, protokoły IoT

---

## Protocol Buffers (protobuf)

Protocol Buffers to format serializacji opracowany przez Google, używany wewnętrznie od 2001 roku i udostępniony jako open source w 2008 roku. Jest fundamentem protokołu **gRPC**.

### Definiowanie schematu (.proto)

```protobuf
syntax = "proto3";

package com.example.pam;

// Wiadomość użytkownika
message User {
  int32 id = 1;
  string name = 2;
  string email = 3;
  int32 age = 4;
  bool active = 5;
  repeated int32 scores = 6;  // lista
  Address address = 7;        // zagnieżdżona wiadomość
  UserType type = 8;          // enum
}

message Address {
  string street = 1;
  string city = 2;
  string postal_code = 3;
}

enum UserType {
  UNKNOWN = 0;
  STUDENT = 1;
  TEACHER = 2;
  ADMIN = 3;
}

// Wiadomość odpowiedzi API
message UserListResponse {
  repeated User users = 1;
  int32 total_count = 2;
  string next_page_token = 3;
}
```

### Generowanie kodu Kotlin

```bash
# Instalacja pluginu protobuf do Gradle
# build.gradle.kts (projekt)
plugins {
    id("com.google.protobuf") version "0.9.4" apply false
}

# build.gradle.kts (moduł)
plugins {
    id("com.google.protobuf")
}

dependencies {
    implementation("com.google.protobuf:protobuf-kotlin-lite:4.26.1")
}

protobuf {
    protoc {
        artifact = "com.google.protobuf:protoc:4.26.1"
    }
    generateProtoTasks {
        all().forEach { task ->
            task.builtins {
                create("kotlin") { option("lite") }
                create("java") { option("lite") }
            }
        }
    }
}
```

### Kodowanie i dekodowanie w Kotlinie

```kotlin
import com.example.pam.UserOuterClass.User
import com.example.pam.UserOuterClass.Address
import com.example.pam.UserOuterClass.UserType

// Tworzenie obiektu protobuf (DSL Kotlin)
val user = user {
    id = 12345
    name = "Anna Kowalska"
    email = "anna@example.com"
    age = 28
    active = true
    scores.addAll(listOf(95, 87, 92, 88))
    address = address {
        street = "ul. Kwiatowa 5"
        city = "Rzeszów"
        postalCode = "35-001"
    }
    type = UserType.STUDENT
}

// Serializacja do bajtów
val bytes: ByteArray = user.toByteArray()
println("Rozmiar: ${bytes.size} bajtów")  // ~65 bajtów

// Deserializacja z bajtów
val restoredUser = User.parseFrom(bytes)
println("Imię: ${restoredUser.name}")

// Zapis do pliku
File(context.filesDir, "user.pb").writeBytes(bytes)

// Odczyt z pliku
val fileBytes = File(context.filesDir, "user.pb").readBytes()
val userFromFile = User.parseFrom(fileBytes)

// Serializacja do Base64 (np. do przechowywania w SharedPreferences)
val base64 = android.util.Base64.encodeToString(bytes, android.util.Base64.DEFAULT)
val decoded = android.util.Base64.decode(base64, android.util.Base64.DEFAULT)
val userFromBase64 = User.parseFrom(decoded)
```

### Wersjonowanie schematu

Protobuf obsługuje dodawanie nowych pól bez łamania kompatybilności:

```protobuf
// Wersja 1
message Product {
  int32 id = 1;
  string name = 2;
  float price = 3;
}

// Wersja 2 — dodano pole, stare klienty go ignorują
message Product {
  int32 id = 1;
  string name = 2;
  float price = 3;
  string currency = 4;     // NOWE — bezpieczne dodanie
  // NIE zmieniaj numerów pól i typów istniejących pól!
}
```

---

## FlatBuffers

FlatBuffers to format stworzony przez Google, zoptymalizowany pod kątem **zero-copy access** — brak parsowania, bezpośredni dostęp do danych w buforze pamięci.

### Kluczowe cechy

- Dostęp do pól bez deserializacji — odczyt bezpośrednio z bajtów
- Idealny dla danych odczytywanych częściowo (np. tylko kilka pól z dużego obiektu)
- Stosowany w: TensorFlow Lite, gier (Cocos2d), systemach IoT

### Schema FlatBuffers (.fbs)

```
// plik: user.fbs
namespace com.example.pam;

table Address {
  street: string;
  city: string;
  postal_code: string;
}

enum UserType: byte {
  Unknown = 0,
  Student = 1,
  Teacher = 2,
  Admin = 3
}

table User {
  id: int32;
  name: string;
  email: string;
  age: int32;
  active: bool;
  scores: [int32];
  address: Address;
  type: UserType;
}

root_type User;
```

```kotlin
// Tworzenie i odczyt FlatBuffer w Kotlinie
import com.google.flatbuffers.FlatBufferBuilder
import com.example.pam.User
import com.example.pam.Address

fun createUserBuffer(): ByteArray {
    val builder = FlatBufferBuilder(256)

    // Stringi i zagnieżdżone tabele muszą być tworzone przed rodzicem
    val streetOffset = builder.createString("ul. Kwiatowa 5")
    val cityOffset = builder.createString("Rzeszów")
    val postalOffset = builder.createString("35-001")

    Address.startAddress(builder)
    Address.addStreet(builder, streetOffset)
    Address.addCity(builder, cityOffset)
    Address.addPostalCode(builder, postalOffset)
    val addressOffset = Address.endAddress(builder)

    val nameOffset = builder.createString("Anna Kowalska")
    val emailOffset = builder.createString("anna@example.com")
    val scoresOffset = User.createScoresVector(builder, intArrayOf(95, 87, 92, 88))

    User.startUser(builder)
    User.addId(builder, 12345)
    User.addName(builder, nameOffset)
    User.addEmail(builder, emailOffset)
    User.addAge(builder, 28)
    User.addActive(builder, true)
    User.addScores(builder, scoresOffset)
    User.addAddress(builder, addressOffset)
    val userOffset = User.endUser(builder)

    builder.finish(userOffset)
    return builder.sizedByteArray()
}

fun readUserBuffer(bytes: ByteArray): User {
    val buffer = java.nio.ByteBuffer.wrap(bytes)
    return User.getRootAsUser(buffer) // Zero-copy! Bez alokacji
}

// Użycie — dostęp do pól bezpośrednio z bufora
val bytes = createUserBuffer()
val user = readUserBuffer(bytes)
println("Imię: ${user.name}")         // Brak parsowania całego obiektu
println("Miasto: ${user.address?.city}")
```

---

## MessagePack

MessagePack to „JSON w formacie binarnym" — nie wymaga schematu, obsługuje te same typy co JSON.

### Kluczowe cechy

- Brak schematu — serializacja dowolnych obiektów
- Format zgodny z JSON semantycznie
- Proste wdrożenie, biblioteki dla 50+ języków
- Rozmiar ~2x mniejszy niż JSON

```kotlin
// build.gradle.kts
// implementation("org.msgpack:msgpack-core:0.9.8")
// implementation("org.msgpack:jackson-dataformat-msgpack:0.9.8")

import com.fasterxml.jackson.databind.ObjectMapper
import org.msgpack.jackson.dataformat.MessagePackFactory

data class User(
    val id: Int,
    val name: String,
    val email: String,
    val scores: List<Int>
)

class MessagePackService {

    private val mapper = ObjectMapper(MessagePackFactory())

    fun serialize(user: User): ByteArray {
        return mapper.writeValueAsBytes(user)
    }

    fun deserialize(bytes: ByteArray): User {
        return mapper.readValue(bytes, User::class.java)
    }

    fun serializeToJson(user: User): String {
        // Konwersja MessagePack → JSON (do debugowania)
        val jsonMapper = ObjectMapper()
        val map = mapper.readValue(serialize(user), Map::class.java)
        return jsonMapper.writeValueAsString(map)
    }
}

// Użycie
val service = MessagePackService()
val user = User(1, "Anna", "anna@example.com", listOf(95, 87, 92))

val bytes = service.serialize(user)
println("Rozmiar MsgPack: ${bytes.size} B")    // ~50 B
println("Rozmiar JSON: ${Gson().toJson(user).length} B") // ~70 B

val restored = service.deserialize(bytes)
println("Odtworzony: $restored")
```

### MessagePack w Swift (iOS)

```swift
// Package.swift
// .package(url: "https://github.com/a2/MessagePack.swift", from: "4.0.0")

import MessagePack

struct User: Codable {
    let id: Int
    let name: String
    let email: String
    let scores: [Int]
}

class MessagePackService {

    func serialize<T: Encodable>(_ value: T) throws -> Data {
        let encoder = MessagePackEncoder()
        return try encoder.encode(value)
    }

    func deserialize<T: Decodable>(_ data: Data, as type: T.Type) throws -> T {
        let decoder = MessagePackDecoder()
        return try decoder.decode(type, from: data)
    }
}

// Użycie
let service = MessagePackService()
let user = User(id: 1, name: "Anna Kowalska", email: "anna@example.com", scores: [95, 87])

if let data = try? service.serialize(user) {
    print("Rozmiar: \(data.count) bajtów")

    if let restored = try? service.deserialize(data, as: User.self) {
        print("Odtworzony: \(restored.name)")
    }
}
```

---

## CBOR (Concise Binary Object Representation)

CBOR to standard IETF (RFC 8949), semantycznie zbliżony do MessagePack, ale z bogatszym zestawem typów.

### Kluczowe cechy

- Otwarty standard IETF — gwarancja długoterminowego wsparcia
- Typy: mapy, tablice, liczby całkowite, zmiennoprzecinkowe, teksty, dane binarne, znaczniki czasu, tagi
- Stosowany w: IoT (COSE/CBOR), WebAuthn/FIDO2, Apple Wallet passes
- Obsługa `undefined` (brak w JSON), dat, bignum

```kotlin
// build.gradle.kts
// implementation("co.nstant.in:cbor:0.9")

import co.nstant.`in`.cbor.CborBuilder
import co.nstant.`in`.cbor.CborDecoder
import co.nstant.`in`.cbor.CborEncoder
import java.io.ByteArrayInputStream
import java.io.ByteArrayOutputStream

fun serializeToCbor(): ByteArray {
    val output = ByteArrayOutputStream()
    CborEncoder(output).encode(
        CborBuilder()
            .addMap()
                .put("id", 12345L)
                .put("name", "Anna Kowalska")
                .put("email", "anna@example.com")
                .put("age", 28L)
                .put("active", true)
                .putArray("scores")
                    .add(95L).add(87L).add(92L)
                .end()
            .end()
            .build()
    )
    return output.toByteArray()
}

fun deserializeFromCbor(bytes: ByteArray): Map<*, *> {
    val input = ByteArrayInputStream(bytes)
    val items = CborDecoder(input).decode()
    // items[0] to mapa CBOR
    return items[0] as Map<*, *>
}
```

---

## Apache Avro

Avro to format serializacji z ekosystemu Apache Hadoop, zaprojektowany z myślą o **ewolucji schematu** i przetwarzaniu dużych danych.

### Kluczowe cechy

- Schemat zapisany bezpośrednio w pliku (samoopisy) — brak potrzeby dystrybucji schematu
- Silna ewolucja schematu: dodawanie/usuwanie pól, aliasy
- Stosowany w: Apache Kafka, Hadoop, Spark
- Na mobile: rzadziej bezpośrednio, częściej przy integracji z backendem Big Data

```json
{
  "type": "record",
  "name": "User",
  "namespace": "com.example.pam",
  "fields": [
    {"name": "id",     "type": "int"},
    {"name": "name",   "type": "string"},
    {"name": "email",  "type": "string"},
    {"name": "age",    "type": ["null", "int"], "default": null},
    {"name": "active", "type": "boolean", "default": true}
  ]
}
```

---

## Tabela porównawcza formatów

| Format          | Schemat wymagany | Rozmiar vs JSON | Szybkość parsowania | Wsparcie języków | Zastosowanie mobile              |
|-----------------|-----------------|-----------------|---------------------|-----------------|----------------------------------|
| Protocol Buffers | ✅ Tak (.proto)  | ~70% mniejszy   | ~6x szybszy         | 20+             | gRPC, cache API, IPC             |
| FlatBuffers     | ✅ Tak (.fbs)    | ~30% mniejszy   | ~0 (zero-copy)      | 10+             | Gry, ML (TFLite), dane tylko do odczytu |
| MessagePack     | ❌ Nie           | ~50% mniejszy   | ~2.5x szybszy       | 50+             | Cache, zastępstwo JSON, szybki prototyp |
| CBOR            | ❌ Nie           | ~45% mniejszy   | ~2x szybszy         | 20+             | IoT, WebAuthn, Apple Wallet      |
| Apache Avro     | ✅ (w pliku)     | ~60% mniejszy   | ~3x szybszy         | 10+             | Kafka/streaming, Big Data        |
| JSON            | ❌ Nie           | 1x (baseline)   | 1x (baseline)       | Wszystkie       | REST API, konfiguracja           |

---

## Kiedy używać binarnej serializacji na mobile?

### IPC — komunikacja między serwisami

```kotlin
// Przykład: Kotlin Serialization z protobuf do komunikacji z WorkManager
import androidx.work.Data
import com.example.pam.TaskRequest

class UploadWorker(context: Context, params: WorkerParameters) : Worker(context, params) {

    override fun doWork(): Result {
        // Odczyt danych wejściowych zakodowanych jako protobuf
        val protoBytes = inputData.getByteArray("task_data") ?: return Result.failure()
        val task = TaskRequest.parseFrom(protoBytes)

        // Wykonanie pracy...
        return Result.success()
    }
}

// Zlecanie pracy z danymi protobuf
val taskRequest = taskRequest {
    userId = 123
    fileUri = "content://media/external/images/1234"
    priority = Priority.HIGH
}

val workData = Data.Builder()
    .putByteArray("task_data", taskRequest.toByteArray())
    .build()

val workRequest = OneTimeWorkRequestBuilder<UploadWorker>()
    .setInputData(workData)
    .build()

WorkManager.getInstance(context).enqueue(workRequest)
```

### Cache odpowiedzi API

```kotlin
class ApiCache(private val context: Context) {

    // Cache z protobuf zamiast JSON — szybszy odczyt, mniejszy rozmiar
    fun <T : com.google.protobuf.MessageLite> save(key: String, message: T) {
        val file = File(context.cacheDir, "$key.pb")
        file.writeBytes(message.toByteArray())
    }

    fun loadUser(key: String): User? {
        val file = File(context.cacheDir, "$key.pb")
        if (!file.exists()) return null
        return runCatching { User.parseFrom(file.readBytes()) }.getOrNull()
    }
}
```

---

## Pułapki i ograniczenia

### 1. Nie jest czytelny dla człowieka

```bash
# Debugowanie protobuf z linii poleceń
# Wymaga zainstalowanego protoc i pliku .proto
protoc --decode=com.example.pam.User user.proto < user.pb

# Lub biblioteka protoscope
protoscope user.pb
```

### 2. Ewolucja schematu w protobuf

```protobuf
// ❌ BŁĄD — zmiana numeru pola łamie kompatybilność
message User {
  string email = 3;  // Było: int32 age = 3;
}

// ✅ POPRAWNIE — zachowaj stare numery, dodaj nowe
message User {
  int32 id = 1;
  string name = 2;
  // int32 age = 3;  // Usunięte — zarezerwuj numer!
  reserved 3;        // Zabezpieczenie przed ponownym użyciem
  reserved "age";

  string email = 4;  // Dodano nowe pole z nowym numerem
}
```

### 3. Rozmiar binarny nie zawsze jest mniejszy

FlatBuffers dla małych obiektów może być *większy* niż JSON ze względu na narzut alignment i vtable. Używaj dla obiektów > 100 pól lub danych wyłącznie do odczytu.

### 4. Brak natywnego wsparcia w przeglądarkach

Dla aplikacji hybrydowych (React Native, Flutter Web) JSON jest często lepszym wyborem — brak potrzeby dodatkowych bibliotek.

---

## Dobre praktyki

- **Protobuf**: zachowaj plik `.proto` w repozytorium obok kodu — to dokumentacja protokołu
- **Nigdy nie zmieniaj numeru pola** w schemie protobuf — zawsze dodawaj nowe numery
- **Testuj kompatybilność wsteczną**: stary klient powinien działać z nowym serwerem i odwrotnie
- **MessagePack** jest dobrym wyborem gdy masz istniejący kod JSON i chcesz szybkiej optymalizacji
- **Dokumentuj format** — brak czytelności binarnej to wada; dodaj komentarze do pliku `.proto`
- Dla **REST API** rozważ content negotiation: `Accept: application/x-protobuf` lub `application/json`

---

## Podsumowanie

Binarne formaty serializacji oferują znaczące korzyści w zakresie wydajności i rozmiaru danych w porównaniu do JSON i XML. **Protocol Buffers** to de facto standard dla nowych projektów wymagających efektywnej komunikacji — szczególnie przy użyciu gRPC. **MessagePack** jest doskonałym wyborem gdy potrzebujemy szybkiej optymalizacji bez zmian architektury. **FlatBuffers** sprawdza się w scenariuszach wymagających ultra-szybkiego dostępu do danych tylko do odczytu. Wybór formatu powinien być podyktowany konkretnymi wymaganiami: czy ważniejsza jest prostota wdrożenia (MessagePack), wydajność (FlatBuffers), czy integracja z backendowym API (Protocol Buffers/gRPC).
