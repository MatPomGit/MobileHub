# Formaty plików baz danych w aplikacjach mobilnych

Aplikacje mobilne niemal zawsze wymagają trwałego przechowywania danych strukturalnych — historii użytkownika, cache, ustawień, danych offline. Wybór odpowiedniej bazy danych i zrozumienie jej wewnętrznego formatu pliku ma bezpośredni wpływ na wydajność, niezawodność i przenośność aplikacji. W tym artykule omówiono najważniejsze systemy baz danych stosowane w środowiskach mobilnych.

## SQLite — fundament przechowywania danych mobilnych

### Struktura pliku .db

SQLite przechowuje całą bazę danych w **jednym pliku binarnym**. Plik zaczyna się 100-bajtowym nagłówkiem zawierającym m.in.:

- Magic string: `SQLite format 3\000`
- Rozmiar strony (domyślnie 4096 B)
- Wersję schematu bazy
- Kodowanie tekstu (UTF-8, UTF-16LE lub UTF-16BE)

Dane organizowane są w **stronicach (pages)** o stałym rozmiarze. B-tree strony indeksów i tabeli umożliwiają O(log n) dostęp do danych.

### WAL Mode (Write-Ahead Logging)

Domyślny tryb `journal_mode=DELETE` zastępuje Journal plik WAL (`-wal`). WAL oferuje:

- **Lepszą współbieżność** — czytelnicy nie blokują pisarzy
- **Szybsze zapisy** — sekwencyjne dopisywanie do pliku WAL
- **Spójność** — po awarii baza wraca do ostatniego spójnego punktu

```sql
-- Włączenie WAL w SQLite
PRAGMA journal_mode=WAL;
PRAGMA synchronous=NORMAL;  -- balans między wydajnością a bezpieczeństwem
PRAGMA cache_size=-64000;   -- 64 MB cache w pamięci
PRAGMA foreign_keys=ON;
```

### SQLite z Room (Android/Kotlin)

Room to oficjalna biblioteka Google będąca warstwą abstrakcji nad SQLite, oferująca:
- Kompilację zapytań SQL w czasie kompilacji
- Automatyczną obsługę migracji
- Integrację z LiveData/Flow i coroutines

```kotlin
// Definicja encji
import androidx.room.*
import kotlinx.coroutines.flow.Flow

@Entity(tableName = "notes")
data class Note(
    @PrimaryKey(autoGenerate = true) val id: Long = 0,
    @ColumnInfo(name = "title") val title: String,
    @ColumnInfo(name = "content") val content: String,
    @ColumnInfo(name = "created_at") val createdAt: Long = System.currentTimeMillis()
)

// DAO
@Dao
interface NoteDao {
    @Query("SELECT * FROM notes ORDER BY created_at DESC")
    fun getAllNotes(): Flow<List<Note>>

    @Query("SELECT * FROM notes WHERE id = :id")
    suspend fun getNoteById(id: Long): Note?

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertNote(note: Note): Long

    @Update
    suspend fun updateNote(note: Note)

    @Delete
    suspend fun deleteNote(note: Note)
}

// Baza danych
@Database(
    entities = [Note::class],
    version = 2,
    exportSchema = true
)
abstract class AppDatabase : RoomDatabase() {
    abstract fun noteDao(): NoteDao

    companion object {
        @Volatile private var instance: AppDatabase? = null

        fun getInstance(context: Context): AppDatabase =
            instance ?: synchronized(this) {
                instance ?: Room.databaseBuilder(
                    context.applicationContext,
                    AppDatabase::class.java,
                    "app_database.db"
                )
                .addMigrations(MIGRATION_1_2)
                .build()
                .also { instance = it }
            }

        val MIGRATION_1_2 = object : Migration(1, 2) {
            override fun migrate(database: SupportSQLiteDatabase) {
                database.execSQL(
                    "ALTER TABLE notes ADD COLUMN tags TEXT NOT NULL DEFAULT ''"
                )
            }
        }
    }
}
```

### SQLite na iOS — SQLite.swift

```swift
// Package.swift: .package(url: "https://github.com/stephencelis/SQLite.swift", from: "0.14.0")

import SQLite
import Foundation

class DatabaseManager {
    private let db: Connection

    let notes = Table("notes")
    let id = Expression<Int64>("id")
    let title = Expression<String>("title")
    let content = Expression<String>("content")
    let createdAt = Expression<Double>("created_at")

    init(dbPath: String) throws {
        db = try Connection(dbPath)
        try createTable()
    }

    private func createTable() throws {
        try db.run(notes.create(ifNotExists: true) { t in
            t.column(id, primaryKey: .autoincrement)
            t.column(title)
            t.column(content)
            t.column(createdAt, defaultValue: Date().timeIntervalSince1970)
        })
        // Włącz WAL dla lepszej wydajności
        try db.execute("PRAGMA journal_mode=WAL")
    }

    func insertNote(title: String, content: String) throws -> Int64 {
        let insert = notes.insert(
            self.title <- title,
            self.content <- content
        )
        return try db.run(insert)
    }

    func getAllNotes() throws -> [(Int64, String, String)] {
        return try db.prepare(notes.order(createdAt.desc)).map { row in
            (row[id], row[title], row[content])
        }
    }
}
```

## Realm — obiektowa baza danych

### Format pliku .realm

Realm przechowuje dane w **binarnym pliku `.realm`** używając własnego silnika storage (nie SQLite). Plik używa:

- Własnego drzewa B+ zoptymalizowanego pod kątem transakcji MVCC (Multi-Version Concurrency Control)
- Memory-mapped I/O dla bezpośredniego dostępu bez kopiowania danych
- Zero-copy architecture — obiekty w pamięci są bezpośrednio mapowane z pliku

Dodatkowe pliki tworzone przez Realm:
- `.realm.lock` — plik blokady dla współbieżnego dostępu
- `.realm.management/` — pliki koordynacji między procesami
- `.realm.note` — powiadomienia o zmianach

### Realm na Androidzie

```kotlin
// build.gradle.kts (poziom projektu)
// id("io.realm.kotlin") version "1.13.0" apply false
// (poziom modułu)
// implementation("io.realm.kotlin:library-base:1.13.0")

import io.realm.kotlin.Realm
import io.realm.kotlin.RealmConfiguration
import io.realm.kotlin.ext.query
import io.realm.kotlin.types.RealmObject
import io.realm.kotlin.types.annotations.PrimaryKey
import kotlinx.coroutines.flow.Flow
import org.mongodb.kbson.ObjectId

// Definicja modelu
class Note : RealmObject {
    @PrimaryKey var _id: ObjectId = ObjectId()
    var title: String = ""
    var content: String = ""
    var createdAt: Long = System.currentTimeMillis()
}

// Konfiguracja i operacje
class RealmNoteRepository {
    private val config = RealmConfiguration.Builder(schema = setOf(Note::class))
        .name("notes.realm")
        .schemaVersion(2)
        .migration(AutomaticSchemaMigration { migration ->
            // Realm obsługuje wiele migracji automatycznie
            migration.newRealm.schema().get("Note")
                ?.addProperty("tags", String::class)
        })
        .build()

    private val realm = Realm.open(config)

    fun observeNotes(): Flow<List<Note>> =
        realm.query<Note>().sort("createdAt", io.realm.kotlin.query.Sort.DESCENDING)
            .asFlow()
            .map { it.list.toList() }

    suspend fun addNote(title: String, content: String) {
        realm.write {
            copyToRealm(Note().apply {
                this.title = title
                this.content = content
            })
        }
    }

    suspend fun deleteNote(noteId: ObjectId) {
        realm.write {
            val note = query<Note>("_id == $0", noteId).first().find()
            note?.let { delete(it) }
        }
    }
}
```

## LevelDB — klucz-wartość od Google

### Struktura LSM Tree

LevelDB (Google, 2011) to baza klucz-wartość używająca struktury **Log-Structured Merge Tree (LSM)**:

1. **MemTable** — zapisy trafiają najpierw do pamięci (sorted skip list)
2. **WAL (Write-Ahead Log)** — zapis do pliku logu przed MemTable, dla trwałości
3. **SSTable (Sorted String Table)** — MemTable jest zrzucany do pliku SSTable na dysku
4. **Compaction** — SSTables są periodycznie scalane i sortowane w "poziomach" (L0-L6)

Pliki LevelDB:
- `MANIFEST` — opis aktualnego stanu poziomów
- `CURRENT` — wskazuje na aktualny MANIFEST
- `*.ldb` lub `*.sst` — pliki SSTable
- `*.log` — plik WAL

LevelDB jest używany wewnętrznie przez:
- **Android** — jako format pamięci podręcznej IndexedDB w WebView/Chrome
- **Chrome** — localStorage i IndexedDB

```kotlin
// LevelDB w Androidzie (przez JNI wrapper)
// implementation("com.github.hf:leveldb-android:0.4")

import com.github.hf.leveldb.LevelDB
import com.github.hf.leveldb.WriteBatch

fun useLevelDB(dbPath: String) {
    val db = LevelDB.open(dbPath, LevelDB.configure().createIfMissing(true))

    // Zapis
    db.put("user:1:name".toByteArray(), "Jan Kowalski".toByteArray())
    db.put("user:1:email".toByteArray(), "jan@example.com".toByteArray())

    // Batch write — atomowy
    val batch = WriteBatch()
    batch.put("cache:article:42", "{ ... }".toByteArray())
    batch.delete("cache:article:41".toByteArray())
    db.write(batch)

    // Odczyt
    val name = db.get("user:1:name".toByteArray())?.toString(Charsets.UTF_8)

    // Iterator po prefiksie
    val iterator = db.iterator()
    iterator.seekToFirst("user:".toByteArray())
    while (iterator.isValid && String(iterator.key()).startsWith("user:")) {
        val key = String(iterator.key())
        val value = String(iterator.value())
        iterator.next()
    }

    db.close()
}
```

## RocksDB — mobilny fork od Facebook

RocksDB to fork LevelDB stworzony przez Meta (Facebook) z licznymi ulepszeniami dla środowisk mobilnych i serwerowych:

- **Column Families** — logiczne przestrzenie nazw w tej samej bazie
- **Bloom Filters** — szybkie sprawdzanie istnienia klucza bez odczytu dysku
- **Kompresja per poziom** — różne algorytmy na każdym poziomie (LZ4 dla L0, ZSTD dla L6)
- **Rate limiting** — kontrola I/O na mobilnych SSD

**Znane zastosowania:**
- **WhatsApp** — przechowywanie wiadomości na urządzeniu
- **Instagram** — lokalny cache mediów
- **MySQL MyRocks** — silnik storage w MySQL Facebooka

## Firebase Firestore — lokalny cache offline

Firestore przechowuje lokalny cache offline w formacie **SQLite** (na Androidzie i iOS), ale struktura schematu jest wewnętrzna i **nie jest przeznaczona do bezpośredniego dostępu**:

```kotlin
// Konfiguracja offline persistence
import com.google.firebase.firestore.FirebaseFirestore
import com.google.firebase.firestore.FirebaseFirestoreSettings
import com.google.firebase.firestore.PersistenceSettings

val db = FirebaseFirestore.getInstance()
val settings = FirebaseFirestoreSettings.Builder()
    .setLocalCacheSettings(
        com.google.firebase.firestore.memoryCacheSettings { }
        // lub persistentCacheSettings dla offline
    )
    .build()
db.firestoreSettings = settings
```

Cache Firestore jest przechowywany w:
- Android: `databases/firestore.{project_id}.{database_id}/main`
- iOS: `Library/Application Support/Google/Firestore/`

## MMKV — WeChat Key-Value Store

### Zasada działania

MMKV (WeChat/Tencent, open source) to biblioteka klucz-wartość używająca **memory-mapped files (mmap)**:

- Dane zapisywane są bezpośrednio do pliku mapowanego do pamięci
- System operacyjny zarządza synchronizacją RAM ↔ dysk
- **Brak operacji write()** — zapis jest natychmiastowy z perspektywy aplikacji
- Format: protobuf (Protocol Buffers) do serializacji wartości

Przewaga nad `SharedPreferences` (Android) i `NSUserDefaults` (iOS):
- ~10x szybsze zapisy
- Bezpieczne przy wieloprocesowym dostępie
- Brak opóźnionego zapisu (nie wymaga `apply()` vs `commit()`)

### MMKV na Androidzie

```kotlin
// implementation("com.tencent:mmkv:1.3.4")

import com.tencent.mmkv.MMKV

class SettingsRepository(context: Context) {
    init {
        MMKV.initialize(context)
    }

    private val mmkv: MMKV = MMKV.defaultMMKV()

    // Lub z szyfrowaniem
    private val secureKv: MMKV = MMKV.mmkvWithID(
        "secure_storage",
        MMKV.SINGLE_PROCESS_MODE,
        "encryption_key_32_chars_minimum!" // klucz AES-128
    )

    var isDarkMode: Boolean
        get() = mmkv.decodeBool("dark_mode", false)
        set(value) { mmkv.encode("dark_mode", value) }

    var authToken: String?
        get() = secureKv.decodeString("auth_token")
        set(value) {
            if (value != null) secureKv.encode("auth_token", value)
            else secureKv.removeValueForKey("auth_token")
        }

    var lastSyncTimestamp: Long
        get() = mmkv.decodeLong("last_sync", 0L)
        set(value) { mmkv.encode("last_sync", value) }
}
```

### MMKV na iOS (Swift)

```swift
import MMKV

class SettingsRepository {
    private let mmkv: MMKV
    private let secureKv: MMKV?

    init() {
        MMKV.initialize(rootDir: nil)
        mmkv = MMKV.default()!
        secureKv = MMKV(mmapID: "secure_storage", cryptKey: "encryption_key".data(using: .utf8))
    }

    var isDarkMode: Bool {
        get { mmkv.bool(forKey: "dark_mode", defaultValue: false) }
        set { mmkv.set(newValue, forKey: "dark_mode") }
    }

    var authToken: String? {
        get { secureKv?.string(forKey: "auth_token") }
        set {
            if let value = newValue {
                secureKv?.set(value, forKey: "auth_token")
            } else {
                secureKv?.removeValue(forKey: "auth_token")
            }
        }
    }
}
```

## Tabela porównawcza baz danych mobilnych

| Format | Typ | ACID | Android | iOS | Rozmiar pliku | Zapytania |
|--------|-----|------|---------|-----|---------------|-----------|
| **SQLite** | Relacyjna | ✅ Pełne | ✅ Wbudowany | ✅ Wbudowany | Mały–duży | SQL (pełne) |
| **Realm** | Obiektowa | ✅ Pełne | ✅ Biblioteka | ✅ Biblioteka | Średni | RealmQuery DSL |
| **LevelDB** | Klucz-wartość | ✅ Częściowe | ✅ Wbudowany | ❌ Brak | Mały | Brak (skany) |
| **RocksDB** | Klucz-wartość | ✅ Częściowe | ✅ Biblioteka | ❌ Brak | Mały–średni | Brak (skany) |
| **Firestore cache** | Dokumentowa | ✅ Offline | ✅ SDK | ✅ SDK | Zmienny | Ograniczone |
| **MMKV** | Klucz-wartość | ❌ Brak | ✅ Biblioteka | ✅ Biblioteka | Bardzo mały | Brak |

## Strategie migracji bazy danych

### Room — automatyczne i ręczne migracje

```kotlin
// Migracja z wersji 2 na 3: dodanie nowej tabeli
val MIGRATION_2_3 = object : Migration(2, 3) {
    override fun migrate(database: SupportSQLiteDatabase) {
        database.execSQL("""
            CREATE TABLE IF NOT EXISTS tags (
                id INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL,
                name TEXT NOT NULL,
                color INTEGER NOT NULL DEFAULT 0
            )
        """.trimIndent())
        database.execSQL("""
            CREATE TABLE IF NOT EXISTS note_tag_cross_ref (
                note_id INTEGER NOT NULL,
                tag_id INTEGER NOT NULL,
                PRIMARY KEY (note_id, tag_id),
                FOREIGN KEY (note_id) REFERENCES notes(id) ON DELETE CASCADE
            )
        """.trimIndent())
    }
}

// Destruktywna migracja — tylko w fazie developerskiej!
Room.databaseBuilder(context, AppDatabase::class.java, "app.db")
    .fallbackToDestructiveMigrationFrom(1) // usuń bazę z v1, zbuduj od nowa
    .addMigrations(MIGRATION_2_3)
    .build()
```

### Realm — automatyczna migracja schematu

```kotlin
val config = RealmConfiguration.Builder(schema = setOf(Note::class))
    .schemaVersion(3)
    .migration(AutomaticSchemaMigration { context ->
        val oldRealm = context.oldRealm
        val newRealm = context.newRealm

        if (oldRealm.schemaVersion() < 3) {
            // Rename pola
            context.enumerate("Note") { oldObject, newObject ->
                newObject?.set("updatedAt", oldObject.getNullableValue("modifiedAt", Long::class))
            }
        }
    })
    .build()
```

## Backup i przywracanie danych

### Kopiowanie pliku .db

Plik SQLite może być kopiowany jako zwykły plik binarny, pod warunkiem że baza nie jest aktywnie używana lub tryb WAL jest wyłączony:

```kotlin
import android.content.Context
import java.io.File

suspend fun backupDatabase(context: Context, dbName: String, backupDir: File): File {
    // Zamknij aktywne połączenia przed kopiowaniem
    val db = AppDatabase.getInstance(context)
    db.close()

    val dbFile = context.getDatabasePath(dbName)
    val backupFile = File(backupDir, "${dbName}_backup_${System.currentTimeMillis()}.db")

    dbFile.copyTo(backupFile, overwrite = true)

    // Skopiuj też pliki WAL jeśli istnieją
    File("${dbFile.path}-wal").takeIf { it.exists() }
        ?.copyTo(File("${backupFile.path}-wal"), overwrite = true)
    File("${dbFile.path}-shm").takeIf { it.exists() }
        ?.copyTo(File("${backupFile.path}-shm"), overwrite = true)

    return backupFile
}
```

### Eksport do JSON/CSV

```kotlin
import kotlinx.serialization.encodeToString
import kotlinx.serialization.json.Json

suspend fun exportNotesToJson(noteDao: NoteDao): String {
    val notes = noteDao.getAllNotesList() // suspend fun zwracający List<Note>
    return Json.encodeToString(notes)
}

fun exportNotesToCsv(notes: List<Note>): String {
    val header = "id,title,content,created_at\n"
    val rows = notes.joinToString("\n") { note ->
        "${note.id},\"${note.title.replace("\"", "\"\"")}\",\"${note.content.replace("\"", "\"\"")}\",${note.createdAt}"
    }
    return header + rows
}
```

## Podsumowanie

Wybór bazy danych dla aplikacji mobilnej zależy od charakteru przechowywanych danych:

- **SQLite/Room** — dane relacyjne, złożone zapytania, potrzeba przenośności
- **Realm** — szybki development, obiekty reaktywne, brak SQL
- **MMKV** — prosta konfiguracja i ustawienia, wydajność krytyczna
- **LevelDB/RocksDB** — ogromne wolumeny danych klucz-wartość, cache
- **Firestore offline** — synchronizacja z chmurą, praca offline

Niezależnie od wyboru — zawsze planuj migracje z wyprzedzeniem i regularnie testuj backup/restore swojej bazy danych.
