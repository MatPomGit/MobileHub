# Dobre praktyki przechowywania danych w aplikacjach mobilnych

Przechowywanie danych to jedno z kluczowych wyzwań w tworzeniu aplikacji mobilnych. Zły dobór mechanizmu storage, brak szyfrowania, nadmierne gromadzenie danych lub ignorowanie praw użytkownika do usunięcia danych może prowadzić do poważnych konsekwencji - od słabej wydajności po naruszenia RODO. Ten artykuł zbiera najważniejsze dobre praktyki, które powinien znać każdy mobilny developer.

## Klasyfikacja danych

Pierwszym krokiem jest zrozumienie, jakie dane przechowujemy. Każda kategoria wymaga innego podejścia:

| Kategoria | Przykłady | Wymagania | Zalecany storage |
|-----------|-----------|-----------|------------------|
| **Dane osobowe** | Imię, email, nr telefonu | Szyfrowanie, prawo do usunięcia | EncryptedSharedPreferences / Keychain |
| **Dane wrażliwe** | Hasła, tokeny, dane medyczne | Silne szyfrowanie, minimalny czas życia | Keystore / Secure Enclave |
| **Dane przejściowe** | Sesja, aktualny ekran | Krótki czas życia, może być utracone | Memory / Session storage |
| **Cache** | Obrazy, odpowiedzi API | Może być usunięty w dowolnym momencie | Cache dir, z polityką wygasania |
| **Dane użytkownika** | Notatki, ustawienia, historia | Trwałość, backup, synchronizacja | Room/SQLite, DataStore |
| **Dane analityczne** | Logi zdarzeń, metryki | Anonimizacja, minimalizacja | Bufor z flush do chmury |

### Zasada minimalizacji danych

Gromadź **tylko to, co jest absolutnie niezbędne** do działania funkcji. Przed dodaniem nowego pola do bazy zapytaj:

- Czy ta informacja jest konieczna do działania funkcji?
- Jak długo musi być przechowywana?
- Co się stanie, jeśli wycieknie?

## Drzewo decyzyjne - wybór mechanizmu storage

```
Dane do przechowania
│
├─ Małe (< 1 MB), proste pary klucz-wartość?
│   ├─ Wymagają szyfrowania? → EncryptedSharedPreferences / Keychain
│   └─ Nie wymagają szyfrowania? → DataStore (Preferences) / NSUserDefaults
│
├─ Pliki binarne (obrazy, dokumenty, media)?
│   ├─ Cache (może być usunięty)? → getCacheDir() / NSCachesDirectory
│   └─ Trwałe pliki użytkownika? → getFilesDir() / NSDocumentDirectory
│
├─ Dane strukturalne, relacje, zapytania?
│   ├─ Lokalne, relacyjne? → Room (SQLite)
│   ├─ Obiektowe, reaktywne? → Realm
│   └─ Synchronizowane z chmurą? → Firestore / Realm Sync
│
└─ Dane wrażliwe wymagające sprzętowej ochrony?
    ├─ Android → Android Keystore + EncryptedFile
    └─ iOS → Secure Enclave + Keychain
```

## Bezpieczeństwo - szyfrowanie danych w spoczynku

### Android Keystore i EncryptedSharedPreferences

Android Keystore przechowuje klucze kryptograficzne w izolowanym środowisku (TEE lub Secure Element). Klucze **nie mogą być wyeksportowane** z urządzenia.

```kotlin
import androidx.security.crypto.EncryptedSharedPreferences
import androidx.security.crypto.MasterKey
import android.content.Context

// implementation("androidx.security:security-crypto:1.1.0-alpha06")

class SecurePreferences(context: Context) {
    private val masterKey = MasterKey.Builder(context)
        .setKeyScheme(MasterKey.KeyScheme.AES256_GCM)
        .setUserAuthenticationRequired(false) // true = wymaga odblokowania urządzenia
        .build()

    private val prefs = EncryptedSharedPreferences.create(
        context,
        "secure_prefs",
        masterKey,
        EncryptedSharedPreferences.PrefKeyEncryptionScheme.AES256_SIV,
        EncryptedSharedPreferences.PrefValueEncryptionScheme.AES256_GCM
    )

    var authToken: String?
        get() = prefs.getString("auth_token", null)
        set(value) = prefs.edit().apply {
            if (value != null) putString("auth_token", value) else remove("auth_token")
        }.apply()

    fun clearAll() = prefs.edit().clear().apply()
}
```

### Szyfrowanie pliku bazy danych - SQLCipher

SQLCipher to fork SQLite dodający transparentne szyfrowanie AES-256 dla całego pliku bazy danych:

```kotlin
// implementation("net.zetetic:android-database-sqlcipher:4.5.4")
// implementation("androidx.sqlite:sqlite-ktx:2.3.1")

import net.sqlcipher.database.SQLiteDatabase
import net.sqlcipher.database.SupportFactory
import androidx.room.Room

fun buildEncryptedDatabase(context: Context, passphrase: ByteArray): AppDatabase {
    val factory = SupportFactory(passphrase)

    return Room.databaseBuilder(
        context.applicationContext,
        AppDatabase::class.java,
        "encrypted_app.db"
    )
    .openHelperFactory(factory)
    .build()
}

// Passphrase powinna pochodzić z Android Keystore, nie być hardcoded!
fun getDatabasePassphrase(context: Context): ByteArray {
    // Wygeneruj lub pobierz klucz z Android Keystore
    val keyStore = java.security.KeyStore.getInstance("AndroidKeyStore").apply { load(null) }
    // ... logika zarządzania kluczem
    return ByteArray(32) // placeholder - użyj prawdziwego klucza
}
```

### iOS - Secure Enclave i Keychain

```swift
import Security
import Foundation

class KeychainManager {
    static func save(key: String, data: Data) throws {
        let query: [String: Any] = [
            kSecClass as String: kSecClassGenericPassword,
            kSecAttrAccount as String: key,
            kSecValueData as String: data,
            // Dostępne tylko gdy urządzenie odblokowane
            kSecAttrAccessible as String: kSecAttrAccessibleWhenUnlockedThisDeviceOnly
        ]

        SecItemDelete(query as CFDictionary) // usuń istniejący
        let status = SecItemAdd(query as CFDictionary, nil)
        guard status == errSecSuccess else {
            throw KeychainError.saveFailed(status)
        }
    }

    static func load(key: String) throws -> Data {
        let query: [String: Any] = [
            kSecClass as String: kSecClassGenericPassword,
            kSecAttrAccount as String: key,
            kSecReturnData as String: true,
            kSecMatchLimit as String: kSecMatchLimitOne
        ]

        var result: AnyObject?
        let status = SecItemCopyMatching(query as CFDictionary, &result)
        guard status == errSecSuccess, let data = result as? Data else {
            throw KeychainError.loadFailed(status)
        }
        return data
    }

    static func delete(key: String) {
        let query: [String: Any] = [
            kSecClass as String: kSecClassGenericPassword,
            kSecAttrAccount as String: key
        ]
        SecItemDelete(query as CFDictionary)
    }

    enum KeychainError: Error {
        case saveFailed(OSStatus)
        case loadFailed(OSStatus)
    }
}
```

### Czego nigdy nie przechowywać w plaintext

- ❌ Hasła użytkownika (zawsze hashuj: bcrypt, Argon2)
- ❌ Tokeny API i klucze prywatne
- ❌ Numery kart kredytowych, PESEL
- ❌ Dane biometryczne
- ❌ Sekretne klucze szyfrowania w kodzie źródłowym

## Zarządzanie rozmiarem - polityka wygasania cache

```kotlin
import android.content.Context
import java.io.File

class CacheManager(private val context: Context) {
    private val cacheDir = context.cacheDir
    private val maxCacheSizeBytes = 50L * 1024 * 1024 // 50 MB
    private val maxFileAgeMs = 7L * 24 * 60 * 60 * 1000 // 7 dni

    fun evictOldFiles() {
        val now = System.currentTimeMillis()
        cacheDir.walkTopDown()
            .filter { it.isFile }
            .filter { now - it.lastModified() > maxFileAgeMs }
            .forEach { it.delete() }
    }

    fun evictIfOverLimit() {
        val files = cacheDir.walkTopDown()
            .filter { it.isFile }
            .sortedBy { it.lastModified() } // najstarsze pierwsze
            .toMutableList()

        var totalSize = files.sumOf { it.length() }

        while (totalSize > maxCacheSizeBytes && files.isNotEmpty()) {
            val oldest = files.removeFirst()
            totalSize -= oldest.length()
            oldest.delete()
        }
    }

    fun getCacheSize(): Long = cacheDir.walkTopDown()
        .filter { it.isFile }
        .sumOf { it.length() }
}
```

## Architektura Offline-First

### Zasady Local-First

Aplikacja offline-first zakłada, że **lokalna baza danych jest źródłem prawdy (source of truth)**. Zmiany są najpierw zapisywane lokalnie, a następnie synchronizowane z serwerem:

```
Użytkownik → Repository → Local DB (natychmiastowa odpowiedź)
                       ↓
                   Sync Queue → Remote API (w tle, gdy jest sieć)
```

### Strategie synchronizacji

**Last-Write-Wins (LWW)** - najprostsza, wystarczająca dla większości przypadków:

```kotlin
data class SyncableNote(
    val id: String,
    val content: String,
    val updatedAt: Long, // timestamp ostatniej modyfikacji
    val version: Long    // numer wersji
)

fun mergeConflict(local: SyncableNote, remote: SyncableNote): SyncableNote {
    return if (local.updatedAt >= remote.updatedAt) local else remote
}
```

**CRDT (Conflict-free Replicated Data Types)** - dla równoczesnej edycji bez konfliktów:

```kotlin
// Przykład prostego G-Counter CRDT
class GCounter(private val nodeId: String) {
    private val counts = mutableMapOf<String, Long>()

    fun increment() {
        counts[nodeId] = (counts[nodeId] ?: 0L) + 1
    }

    fun value(): Long = counts.values.sum()

    fun merge(other: GCounter): GCounter {
        val merged = GCounter(nodeId)
        val allKeys = counts.keys + other.counts.keys
        allKeys.forEach { key ->
            merged.counts[key] = maxOf(counts[key] ?: 0L, other.counts[key] ?: 0L)
        }
        return merged
    }
}
```

## Wydajność - unikanie operacji I/O na głównym wątku

### Coroutines i Dispatchers.IO

```kotlin
import kotlinx.coroutines.*
import kotlinx.coroutines.flow.*

class NoteRepository(
    private val noteDao: NoteDao,
    private val apiService: ApiService,
    private val ioDispatcher: CoroutineDispatcher = Dispatchers.IO
) {
    // Flow z Room - automatycznie na wątku IO
    fun observeNotes(): Flow<List<Note>> = noteDao.getAllNotes()

    // Operacje zapisu - zawsze na Dispatchers.IO
    suspend fun saveNote(note: Note) = withContext(ioDispatcher) {
        noteDao.insertNote(note)
        try {
            apiService.uploadNote(note) // opcjonalna synchronizacja
        } catch (e: Exception) {
            // Dodaj do kolejki synchronizacji - nie blokuj zapisu lokalnego
            enqueueSyncJob(note.id)
        }
    }

    // Wsadowy zapis - w jednej transakcji
    suspend fun importNotes(notes: List<Note>) = withContext(ioDispatcher) {
        noteDao.insertAll(notes) // @Insert z listą - jedna transakcja
    }
}
```

### Wsadowe zapisy zamiast pętli

```kotlin
// ŹLE - N transakcji
suspend fun insertNotesBad(notes: List<Note>) {
    notes.forEach { note ->
        noteDao.insertNote(note) // każdy insert = osobna transakcja
    }
}

// DOBRZE - jedna transakcja
@Dao
interface NoteDao {
    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertAll(notes: List<Note>) // Room automatycznie owija w transakcję
}

// ALTERNATYWNIE - ręczna transakcja
suspend fun insertNotesManual(notes: List<Note>, db: AppDatabase) {
    db.withTransaction {
        notes.forEach { note ->
            db.noteDao().insertNote(note)
        }
    }
}
```

## Migracje i wersjonowanie schematu

### Zasady bezpiecznej migracji

1. **Nigdy nie usuwaj migracji** - ktoś może aktualizować ze starej wersji
2. **Testuj migracje** - Room oferuje `MigrationTestHelper`
3. **Zachowuj dane** - migracja powinna przenieść istniejące dane, nie usunąć
4. **Eksportuj schemat** - Room może zapisywać schemat do JSON dla śledzenia zmian

```kotlin
// Test migracji z Room
import androidx.room.testing.MigrationTestHelper
import androidx.test.platform.app.InstrumentationRegistry

@RunWith(AndroidJUnit4::class)
class MigrationTest {
    @get:Rule
    val helper = MigrationTestHelper(
        InstrumentationRegistry.getInstrumentation(),
        AppDatabase::class.java
    )

    @Test
    fun migrate1To2() {
        // Utwórz bazę w wersji 1
        helper.createDatabase("test_db", 1).apply {
            execSQL("INSERT INTO notes (title, content) VALUES ('Test', 'Content')")
            close()
        }

        // Uruchom migrację do wersji 2
        val db = helper.runMigrationsAndValidate("test_db", 2, true, MIGRATION_1_2)

        // Sprawdź, czy dane przetrwały
        val cursor = db.query("SELECT * FROM notes")
        assert(cursor.count == 1)
        cursor.close()
    }
}
```

## Testowanie persystencji danych

### Room In-Memory Database

```kotlin
import androidx.room.Room
import androidx.test.core.app.ApplicationProvider
import kotlinx.coroutines.test.runTest
import org.junit.After
import org.junit.Before
import org.junit.Test

class NoteDaoTest {
    private lateinit var db: AppDatabase
    private lateinit var noteDao: NoteDao

    @Before
    fun setUp() {
        db = Room.inMemoryDatabaseBuilder(
            ApplicationProvider.getApplicationContext(),
            AppDatabase::class.java
        )
        .allowMainThreadQueries() // tylko w testach!
        .build()
        noteDao = db.noteDao()
    }

    @After
    fun tearDown() = db.close()

    @Test
    fun insertAndRetrieveNote() = runTest {
        val note = Note(title = "Test", content = "Content")
        val id = noteDao.insertNote(note)

        val retrieved = noteDao.getNoteById(id)
        assert(retrieved?.title == "Test")
        assert(retrieved?.content == "Content")
    }

    @Test
    fun deleteNoteRemovesFromDb() = runTest {
        val note = Note(title = "To Delete", content = "...")
        val id = noteDao.insertNote(note)
        val saved = noteDao.getNoteById(id)!!
        noteDao.deleteNote(saved)

        assert(noteDao.getNoteById(id) == null)
    }
}
```

### Mockowanie DataStore

```kotlin
import androidx.datastore.core.DataStore
import androidx.datastore.preferences.core.Preferences
import kotlinx.coroutines.flow.flowOf
import org.mockito.kotlin.*

class UserSettingsViewModelTest {
    private val mockDataStore: DataStore<Preferences> = mock()
    private val mockPreferences: Preferences = mock()

    @Test
    fun `dark mode default is false`() = runTest {
        whenever(mockDataStore.data).thenReturn(flowOf(mockPreferences))
        whenever(mockPreferences[PreferenceKeys.DARK_MODE]).thenReturn(null)

        val viewModel = UserSettingsViewModel(mockDataStore)
        assert(viewModel.isDarkMode.first() == false)
    }
}
```

## RODO - zgodność z regulacjami

### Prawo do usunięcia danych

Aplikacja musi umożliwić użytkownikowi usunięcie **wszystkich** jego danych:

```kotlin
class GdprDataManager(
    private val db: AppDatabase,
    private val prefs: EncryptedSharedPreferences,
    private val cacheManager: CacheManager,
    private val remoteApi: ApiService
) {
    suspend fun deleteAllUserData(userId: String) = withContext(Dispatchers.IO) {
        // 1. Usuń dane lokalne z bazy
        db.withTransaction {
            db.noteDao().deleteAllByUser(userId)
            db.userDao().deleteUser(userId)
        }

        // 2. Usuń lokalne preferencje
        prefs.edit().clear().commit()

        // 3. Usuń cache
        cacheManager.evictAll()

        // 4. Wyślij żądanie usunięcia do serwera
        remoteApi.requestDataDeletion(userId)

        // 5. Usuń tokeny uwierzytelniające
        TokenManager.clearTokens()
    }
}
```

### Co NIE powinno być przechowywane

- ❌ Dokładna lokalizacja GPS - jeśli nie jest to core funkcja aplikacji
- ❌ Unikalne identyfikatory urządzenia (`ANDROID_ID`) bez zgody
- ❌ Lista zainstalowanych aplikacji (od Androida 11 wymaga uprawnienia)
- ❌ Historia przeglądania poza aplikacją
- ❌ Dane dzieci bez zgody rodzica (COPPA/RODO)
- ❌ Dane biometryczne w surowej formie

### Minimalizacja metadanych

```kotlin
// ŹLE - zbieramy za dużo
data class UserEvent(
    val userId: String,
    val eventType: String,
    val deviceModel: String,      // niepotrzebne
    val exactLocation: LatLng,    // za precyzyjne
    val timestamp: Long,
    val ipAddress: String,        // niepotrzebne na urządzeniu
    val allInstalledApps: List<String>  // niedopuszczalne!
)

// DOBRZE - minimalne dane
data class UserEvent(
    val anonymousId: String,      // zahashowany, nie bezpośrednio userId
    val eventType: String,
    val timestamp: Long,
    val approximateRegion: String // "PL-PK" zamiast GPS
)
```

## Kompletny wzorzec Repository - Offline-First

Poniższy przykład pokazuje kompletną implementację repozytorium z obsługą offline, synchronizacją i obsługą błędów:

```kotlin
import kotlinx.coroutines.*
import kotlinx.coroutines.flow.*
import java.time.Instant

sealed class SyncStatus {
    object Idle : SyncStatus()
    object Syncing : SyncStatus()
    data class Error(val message: String) : SyncStatus()
    object Success : SyncStatus()
}

class OfflineFirstNoteRepository(
    private val noteDao: NoteDao,
    private val apiService: NoteApiService,
    private val syncQueue: SyncQueueDao,
    private val networkMonitor: NetworkMonitor,
    private val ioDispatcher: CoroutineDispatcher = Dispatchers.IO
) {
    private val _syncStatus = MutableStateFlow<SyncStatus>(SyncStatus.Idle)
    val syncStatus: StateFlow<SyncStatus> = _syncStatus.asStateFlow()

    // Obserwuj notatki z lokalnej bazy - zawsze aktualne
    fun observeNotes(): Flow<List<Note>> = noteDao.getAllNotes()

    // Zapis lokalny + kolejkowanie synchronizacji
    suspend fun saveNote(note: Note) = withContext(ioDispatcher) {
        val savedNote = note.copy(
            updatedAt = System.currentTimeMillis(),
            syncStatus = NoteSyncStatus.PENDING
        )
        noteDao.insertNote(savedNote)
        syncQueue.enqueue(SyncJob(entityId = savedNote.id, operation = SyncOperation.UPSERT))

        // Próba natychmiastowej synchronizacji jeśli jest sieć
        if (networkMonitor.isConnected()) {
            syncPendingChanges()
        }
    }

    suspend fun deleteNote(noteId: Long) = withContext(ioDispatcher) {
        noteDao.markAsDeleted(noteId)
        syncQueue.enqueue(SyncJob(entityId = noteId, operation = SyncOperation.DELETE))
        if (networkMonitor.isConnected()) {
            syncPendingChanges()
        }
    }

    // Synchronizacja wszystkich oczekujących zmian
    suspend fun syncPendingChanges() = withContext(ioDispatcher) {
        val pending = syncQueue.getPendingJobs()
        if (pending.isEmpty()) return@withContext

        _syncStatus.value = SyncStatus.Syncing
        var hasErrors = false

        pending.forEach { job ->
            try {
                when (job.operation) {
                    SyncOperation.UPSERT -> {
                        val note = noteDao.getNoteById(job.entityId) ?: return@forEach
                        val remoteNote = apiService.upsertNote(note)
                        // Aktualizuj lokalnie o dane z serwera (np. server-generated ID)
                        noteDao.updateNote(note.copy(
                            remoteId = remoteNote.id,
                            syncStatus = NoteSyncStatus.SYNCED
                        ))
                    }
                    SyncOperation.DELETE -> {
                        apiService.deleteNote(job.entityId)
                        noteDao.permanentlyDelete(job.entityId)
                    }
                }
                syncQueue.markCompleted(job.id)
            } catch (e: Exception) {
                hasErrors = true
                syncQueue.markFailed(job.id, e.message ?: "Unknown error")
            }
        }

        _syncStatus.value = if (hasErrors) SyncStatus.Error("Some items failed to sync")
                            else SyncStatus.Success
    }

    // Pełne odświeżenie z serwera (pull)
    suspend fun refreshFromRemote() = withContext(ioDispatcher) {
        _syncStatus.value = SyncStatus.Syncing
        try {
            val remoteNotes = apiService.getAllNotes()
            noteDao.replaceAll(remoteNotes.map { it.toLocalNote() })
            _syncStatus.value = SyncStatus.Success
        } catch (e: Exception) {
            _syncStatus.value = SyncStatus.Error(e.message ?: "Sync failed")
        }
    }
}
```

## Tabela decyzyjna - podsumowanie

| Typ danych | Rozmiar | Szyfrowanie | Zalecany mechanizm |
|------------|---------|-------------|-------------------|
| Tokeny, hasła | < 1 KB | Wymagane | Keystore + EncryptedSharedPreferences / Keychain |
| Ustawienia użytkownika | < 1 MB | Opcjonalne | DataStore (Preferences) / NSUserDefaults |
| Dane strukturalne offline | 1 KB–1 GB | Opcjonalne | Room (SQLite) / SQLCipher jeśli wrażliwe |
| Cache obrazów/mediów | MB–GB | Nie | getCacheDir() z Glide/Coil |
| Pliki użytkownika (dokumenty) | Dowolny | Opcjonalne | getFilesDir() / NSDocumentDirectory |
| Dane zsynchronizowane z chmurą | Dowolny | Tak (transport) | Room + API Sync / Realm Sync / Firestore |
| Prosta konfiguracja (szybka) | < 100 KB | Opcjonalne | MMKV |
| Duży wolumen klucz-wartość | GB | Nie | LevelDB / RocksDB |

## Podsumowanie

Dobre praktyki przechowywania danych sprowadzają się do kilku kluczowych zasad:

1. **Klasyfikuj dane** przed wybraniem mechanizmu storage
2. **Szyfruj to, co wrażliwe** - zawsze używaj Keystore/Secure Enclave
3. **Nie przechowuj więcej niż potrzebujesz** - minimalizacja danych to nie tylko RODO, ale też bezpieczeństwo
4. **I/O poza głównym wątkiem** - zawsze `Dispatchers.IO` lub `async`
5. **Planuj migracje** od pierwszej wersji - nie na ostatnią chwilę
6. **Testuj persistence** - Room InMemory DB i mockowanie DataStore to minimum
7. **Implementuj prawo do usunięcia** - nie opcja, a wymóg prawny w UE

Architektura offline-first z lokalną bazą jako source of truth i asynchroniczną synchronizacją to aktualnie najlepszy wzorzec dla aplikacji mobilnych wymagających niezawodności w niestabilnych warunkach sieciowych.
