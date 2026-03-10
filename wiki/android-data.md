# Przechowywanie Danych w Android

Trwałe przechowywanie danych jest jednym z fundamentów aplikacji mobilnych. Użytkownik oczekuje, że aplikacja zapamięta ustawienia, zachowa sesję, przechowa dane offline, a po ponownym uruchomieniu odtworzy stan pracy. Android udostępnia kilka mechanizmów składowania danych, a dobór rozwiązania zależy od rodzaju danych, wymagań bezpieczeństwa, skali projektu oraz oczekiwanego modelu synchronizacji.

Dokumentacja Android Developers rozróżnia przechowywanie preferencji, danych w plikach, danych lokalnych w bazie oraz synchronizację z danymi zewnętrznymi. Google promuje obecnie DataStore jako nowoczesne rozwiązanie dla prostych danych klucz-wartość oraz Room jako rekomendowaną warstwę abstrakcji nad SQLite. Aktualne dokumenty Android Developers pokazują też nowsze wersje bibliotek niż te spotykane w starszych materiałach dydaktycznych. citeturn0search5turn0search1turn0search17

## Dobór mechanizmu do rodzaju danych

```text
Rodzaj danych                  → Mechanizm                         → Typowy scenariusz
-------------------------------------------------------------------------------------
Ustawienia, proste flagi       → DataStore (Preferences/Proto)    → tryb ciemny, sortowanie
Dane relacyjne i listy         → Room (SQLite)                    → zadania, notatki, produkty
Pliki aplikacji                → Internal Storage                 → eksporty, cache, obrazy
Pliki współdzielone            → MediaStore / SAF                 → zdjęcia, dokumenty użytkownika
Dane tymczasowe                → cacheDir / Room cache            → odpowiedzi HTTP, miniatury
Dane szyfrowane                → Keystore + szyfrowanie danych    → tokeny, sekrety, klucze
Synchronizacja w tle           → WorkManager + Repository         → upload, sync offline-first
Chmura / backend               → REST/GraphQL/Firebase itp.       → współdzielenie danych między urządzeniami
```

Nie istnieje jeden mechanizm dobry do wszystkiego. Kluczowa zasada brzmi: **najprostszy mechanizm, który spełnia wymagania, jest zwykle najlepszy**.

## DataStore — nowoczesny następca SharedPreferences

DataStore jest rozwijany jako bezpieczniejsza i bardziej przewidywalna alternatywa dla `SharedPreferences`. Android Developers promuje dwa warianty:
- **Preferences DataStore** — przechowuje pary klucz-wartość,
- **Proto DataStore** — przechowuje dane typowane na podstawie schema Protocol Buffers. citeturn0search5

### Kiedy używać DataStore

Używaj DataStore, gdy chcesz przechować:
- preferencje użytkownika,
- proste ustawienia,
- stan konfiguracji aplikacji,
- niewielkie dane, które nie wymagają relacji SQL.

Nie używaj DataStore jako zamiennika pełnej bazy relacyjnej.

### Preferences DataStore — przykład

```kotlin
val Context.settingsDataStore by preferencesDataStore(name = "app_settings")

object PreferenceKeys {
    val THEME_MODE = intPreferencesKey("theme_mode")
    val NOTIFICATIONS_ENABLED = booleanPreferencesKey("notifications_enabled")
    val SORT_ORDER = stringPreferencesKey("sort_order")
    val LAST_SYNC_MS = longPreferencesKey("last_sync_ms")
}

data class AppSettings(
    val themeMode: Int = 0,
    val notificationsEnabled: Boolean = true,
    val sortOrder: String = "date",
    val lastSyncMs: Long = 0L
)

class SettingsRepository(
    private val dataStore: DataStore<Preferences>
) {

    val settings: Flow<AppSettings> = dataStore.data
        .catch { e ->
            if (e is IOException) emit(emptyPreferences()) else throw e
        }
        .map { preferences ->
            AppSettings(
                themeMode = preferences[PreferenceKeys.THEME_MODE] ?: 0,
                notificationsEnabled = preferences[PreferenceKeys.NOTIFICATIONS_ENABLED] ?: true,
                sortOrder = preferences[PreferenceKeys.SORT_ORDER] ?: "date",
                lastSyncMs = preferences[PreferenceKeys.LAST_SYNC_MS] ?: 0L
            )
        }

    suspend fun setThemeMode(mode: Int) {
        dataStore.edit { prefs ->
            prefs[PreferenceKeys.THEME_MODE] = mode
        }
    }

    suspend fun toggleNotifications() {
        dataStore.edit { prefs ->
            val current = prefs[PreferenceKeys.NOTIFICATIONS_ENABLED] ?: true
            prefs[PreferenceKeys.NOTIFICATIONS_ENABLED] = !current
        }
    }
}
```

### Dlaczego DataStore jest wygodny dydaktycznie

- działa reaktywnie przez `Flow`,
- zapis jest transakcyjny,
- łatwo testować repozytorium ustawień,
- łatwiej uniknąć błędów współbieżności niż przy bezpośredniej pracy z `SharedPreferences`.

## Proto DataStore — gdy potrzebujesz typów

Preferences DataStore przechowuje pary klucz-wartość. Gdy dane stają się bardziej złożone, lepszym wyborem może być Proto DataStore.

Zalety:
- silne typowanie,
- ewolucja schematu,
- mniejsze ryzyko błędów literówek w kluczach,
- lepsza struktura dla bardziej złożonych ustawień.

Proto DataStore sprawdza się np. wtedy, gdy zapisujesz konfigurację użytkownika o wielu polach, a nie tylko kilka prostych flag.

## Czy nadal warto używać SharedPreferences?

`SharedPreferences` nadal istnieje i bywa spotykane w starszych projektach, ale w nowych materiałach dydaktycznych warto preferować DataStore. Android Developers wprost wskazuje DataStore jako nowocześniejszą alternatywę. citeturn0search5turn1search20

## Dane wrażliwe — szyfrowanie i Android Keystore

W wielu materiałach dydaktycznych jako pierwsza odpowiedź pojawia się `EncryptedSharedPreferences`. To narzędzie nadal istnieje w bibliotece AndroidX Security, ale w praktyce ważniejsze od samej nazwy klasy jest rozumienie modelu bezpieczeństwa: sekretów nie należy przechowywać jawnie, a klucze kryptograficzne warto opierać o Android Keystore oraz oficjalne mechanizmy kryptograficzne platformy. citeturn1search8turn1search12

### Co uznajemy za dane wrażliwe

- tokeny dostępu,
- refresh tokeny,
- klucze API po stronie klienta,
- dane uwierzytelniające,
- identyfikatory sesji,
- dane osobowe wymagające szczególnej ochrony.

### Zasady bezpieczeństwa

1. Nie zapisuj haseł użytkownika wprost.
2. Nie trzymaj sekretów na stałe w kodzie źródłowym.
3. Korzystaj z Android Keystore do ochrony kluczy.
4. Ogranicz logowanie danych wrażliwych.
5. Rozważ czas życia tokenu i mechanizm odświeżania.

## Room — rekomendowana warstwa nad SQLite

Room jest oficjalnie rekomendowaną biblioteką Jetpack do pracy z relacyjną bazą danych w Androidzie. Android Developers opisuje trzy główne elementy: klasę bazy, encje oraz DAO. Aktualna dokumentacja pokazuje nowsze wydania biblioteki niż starsze przykłady z kursów, np. linię 2.8.x. citeturn0search1turn0search9

### Kiedy używać Room

Room wybieramy, gdy:
- dane mają strukturę tabelaryczną,
- chcemy filtrować i sortować rekordy,
- potrzebujemy relacji,
- aplikacja ma działać offline,
- chcemy wykonywać zapytania SQL w sposób kontrolowany i testowalny.

### Encja

```kotlin
@Entity(
    tableName = "tasks",
    indices = [
        Index("project_id"),
        Index("due_date"),
        Index(value = ["title"])
    ]
)
data class TaskEntity(
    @PrimaryKey val id: String,
    val title: String,
    val description: String = "",
    @ColumnInfo(name = "is_done") val isDone: Boolean = false,
    @ColumnInfo(name = "created_at") val createdAt: Long = System.currentTimeMillis(),
    @ColumnInfo(name = "due_date") val dueDate: Long? = null,
    @ColumnInfo(name = "project_id") val projectId: String? = null,
    val priority: Int = 0
)
```

### DAO

```kotlin
@Dao
interface TaskDao {

    @Query("SELECT * FROM tasks ORDER BY due_date ASC, priority DESC")
    fun observeAll(): Flow<List<TaskEntity>>

    @Query("SELECT * FROM tasks WHERE id = :id")
    suspend fun getById(id: String): TaskEntity?

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insert(task: TaskEntity)

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertAll(tasks: List<TaskEntity>)

    @Update
    suspend fun update(task: TaskEntity)

    @Delete
    suspend fun delete(task: TaskEntity)

    @Query("UPDATE tasks SET is_done = :isDone WHERE id = :id")
    suspend fun setDone(id: String, isDone: Boolean)

    @Query(
        """
        SELECT * FROM tasks
        WHERE (title LIKE :query OR description LIKE :query)
        ORDER BY created_at DESC
        LIMIT :limit OFFSET :offset
        """
    )
    suspend fun search(query: String, limit: Int, offset: Int): List<TaskEntity>
}
```

### Klasa bazy

```kotlin
@Database(
    entities = [TaskEntity::class],
    version = 1,
    exportSchema = true
)
abstract class AppDatabase : RoomDatabase() {
    abstract fun taskDao(): TaskDao

    companion object {
        @Volatile
        private var INSTANCE: AppDatabase? = null

        fun getInstance(context: Context): AppDatabase {
            return INSTANCE ?: synchronized(this) {
                Room.databaseBuilder(
                    context.applicationContext,
                    AppDatabase::class.java,
                    "app_db"
                ).build().also { INSTANCE = it }
            }
        }
    }
}
```

## Relacje i modelowanie danych

W realnych projektach dane rzadko ograniczają się do jednej tabeli.

Przykład:
- `ProjectEntity`
- `TaskEntity`
- `TagEntity`
- tabela pośrednia dla relacji wiele-do-wielu

Pytania projektowe, które warto zadać studentom:
- Czy dana relacja powinna być modelowana w SQL, czy wystarczy zwykły identyfikator?
- Czy pole powinno być `nullable`?
- Czy potrzebujemy indeksu?
- Jakie zapytania będą wykonywane najczęściej?

## Migracje bazy danych

Jednym z najważniejszych tematów w edukacji mobilnej są migracje. Aplikacja już zainstalowana u użytkownika nie może tracić danych przy każdej zmianie schematu.

```kotlin
val MIGRATION_1_2 = object : Migration(1, 2) {
    override fun migrate(db: SupportSQLiteDatabase) {
        db.execSQL("ALTER TABLE tasks ADD COLUMN priority INTEGER NOT NULL DEFAULT 0")
        db.execSQL("CREATE INDEX IF NOT EXISTS index_tasks_priority ON tasks(priority)")
    }
}
```

### Zasady

- w projektach produkcyjnych unikaj `fallbackToDestructiveMigration()`,
- migracje testuj automatycznie,
- dokumentuj zmiany schematu,
- zwiększaj wersję bazy świadomie.

## TypeConverter

Room przechowuje typy bazowe SQLite. Gdy chcemy zapisać typ niestandardowy, używamy `TypeConverter`.

```kotlin
class Converters {
    @TypeConverter
    fun fromTimestamp(value: Long?): Date? = value?.let(::Date)

    @TypeConverter
    fun dateToTimestamp(date: Date?): Long? = date?.time
}
```

### Uwaga dydaktyczna

Nie każdy typ złożony warto „upychać” do jednego pola jako tekst JSON lub lista rozdzielana przecinkami. Taki zabieg bywa wygodny na początku, ale utrudnia filtrowanie i indeksowanie. Jeżeli dane mają znaczenie relacyjne, lepiej modelować je relacyjnie.

## Repository Pattern

Repozytorium ukrywa szczegóły źródła danych i daje czytelny interfejs warstwie wyższej.

```kotlin
data class Task(
    val id: String,
    val title: String,
    val description: String,
    val isDone: Boolean,
    val createdAt: Long,
    val dueDate: Long?,
    val priority: Int
)

class TaskRepository(
    private val taskDao: TaskDao,
    private val dispatcher: CoroutineDispatcher = Dispatchers.IO
) {

    fun observeTasks(): Flow<List<Task>> =
        taskDao.observeAll()
            .map { entities -> entities.map { it.toDomain() } }
            .flowOn(dispatcher)

    suspend fun getTask(id: String): Task? = withContext(dispatcher) {
        taskDao.getById(id)?.toDomain()
    }

    suspend fun save(task: Task) = withContext(dispatcher) {
        taskDao.insert(task.toEntity())
    }

    suspend fun delete(id: String) = withContext(dispatcher) {
        val entity = taskDao.getById(id) ?: return@withContext
        taskDao.delete(entity)
    }

    private fun TaskEntity.toDomain(): Task = Task(
        id = id,
        title = title,
        description = description,
        isDone = isDone,
        createdAt = createdAt,
        dueDate = dueDate,
        priority = priority
    )

    private fun Task.toEntity(): TaskEntity = TaskEntity(
        id = id,
        title = title,
        description = description,
        isDone = isDone,
        createdAt = createdAt,
        dueDate = dueDate,
        priority = priority
    )
}
```

Repozytorium może łączyć wiele źródeł danych:
- Room,
- DataStore,
- backend REST,
- pliki,
- cache w pamięci.

## Pliki i pamięć masowa

Android Developers rozróżnia kilka scenariuszy zapisu plików. Najważniejsze z perspektywy studenta są trzy:

1. **Internal storage** — pliki prywatne aplikacji.
2. **Cache directory** — dane tymczasowe, które system może usunąć.
3. **Mechanizmy współdzielone** (`MediaStore`, Storage Access Framework) — gdy użytkownik ma mieć dostęp do plików poza aplikacją. citeturn0search17

### Internal storage — przykład

```kotlin
fun saveTextFile(context: Context, filename: String, content: String) {
    context.openFileOutput(filename, Context.MODE_PRIVATE).use { stream ->
        stream.write(content.toByteArray())
    }
}

fun readTextFile(context: Context, filename: String): String {
    return context.openFileInput(filename).bufferedReader().use { it.readText() }
}
```

### Kiedy używać plików zamiast bazy

Pliki są sensowne dla:
- eksportów CSV/PDF,
- obrazów,
- binarnych załączników,
- logów diagnostycznych,
- danych, których nie trzeba filtrować SQL-em.

## Offline-first i synchronizacja

Nowoczesne aplikacje mobilne coraz częściej stosują model **offline-first**:
- użytkownik pracuje na danych lokalnych,
- synchronizacja z backendem dzieje się w tle,
- interfejs pozostaje responsywny nawet przy słabym internecie.

Do synchronizacji przydaje się:
- **Room** jako źródło prawdy lokalnej,
- **Repository** do sterowania przepływem danych,
- **WorkManager** do odłożonych i niezawodnych zadań,
- znaczniki synchronizacji (`pending`, `dirty`, `lastModified`).

## Typowe błędy studentów

1. Traktowanie DataStore jak bazy danych.
2. Przechowywanie list i relacji jako jednego ciągu tekstowego.
3. Brak migracji po zmianie encji.
4. Używanie `fallbackToDestructiveMigration()` w kodzie produkcyjnym.
5. Brak indeksów dla często filtrowanych kolumn.
6. Zapisywanie danych wrażliwych w zwykłych preferencjach.
7. Trzymanie logiki SQL bezpośrednio w `Activity` lub `ViewModel`.

## Przykład praktyczny: aplikacja To-Do

Załóżmy, że budujesz aplikację do zarządzania zadaniami.

### Dobór mechanizmów

- tryb ciemny i sortowanie → DataStore,
- lista zadań i projektów → Room,
- eksport listy → plik CSV w internal storage,
- synchronizacja z serwerem → Repository + WorkManager,
- token sesji → mechanizm szyfrowany oparty o Keystore.

To dobry przykład, że jedna aplikacja zwykle korzysta z kilku metod przechowywania danych jednocześnie.

## Testowanie warstwy danych

### Co testować

- mapowanie encja ↔ domena,
- zapytania DAO,
- migracje,
- repozytorium,
- reakcję DataStore na zmianę preferencji.

### Przykład testu mapowania

```kotlin
@Test
fun `entity maps to domain`() {
    val entity = TaskEntity(
        id = "1",
        title = "Zadanie",
        description = "Opis",
        isDone = false,
        priority = 2
    )

    val task = Task(
        id = entity.id,
        title = entity.title,
        description = entity.description,
        isDone = entity.isDone,
        createdAt = entity.createdAt,
        dueDate = entity.dueDate,
        priority = entity.priority
    )

    assertEquals("1", task.id)
    assertEquals("Zadanie", task.title)
    assertEquals(2, task.priority)
}
```

## Dobre praktyki podsumowujące

1. Dla prostych ustawień wybieraj DataStore.
2. Dla danych relacyjnych wybieraj Room.
3. Dla plików używaj odpowiedniego rodzaju storage zależnie od scenariusza.
4. Dane wrażliwe zabezpieczaj przy użyciu właściwych mechanizmów kryptograficznych i Keystore.
5. Projektuj migracje od początku, nie dopiero po pierwszym błędzie.
6. Rozdzielaj modele bazy, domeny i UI.
7. Planuj offline-first, gdy aplikacja ma działać przy niestabilnym internecie.

## Pytania kontrolne

1. Kiedy użyć DataStore, a kiedy Room?
2. Czym różni się Preferences DataStore od Proto DataStore?
3. Dlaczego `fallbackToDestructiveMigration()` jest ryzykowne?
4. Kiedy plik jest lepszym wyborem niż baza danych?
5. Po co w bazie indeksy?
6. Dlaczego dane wrażliwe nie powinny trafiać do zwykłych preferencji?
7. Jak działa wzorzec offline-first?

## Ćwiczenia

### Ćwiczenie 1 — ustawienia aplikacji

Zaimplementuj ekran ustawień z:
- wyborem motywu,
- przełącznikiem powiadomień,
- wyborem kolejności sortowania.

Wymagania:
- dane mają być zapisane w DataStore,
- ekran po restarcie aplikacji ma odtwarzać stan,
- `ViewModel` ma obserwować ustawienia jako `Flow`.

### Ćwiczenie 2 — lokalna baza danych

Utwórz bazę Room dla aplikacji notatkowej. Każda notatka ma:
- tytuł,
- treść,
- datę utworzenia,
- flagę „ulubiona”.

Dodaj:
- DAO,
- repozytorium,
- sortowanie po dacie,
- filtrowanie tylko ulubionych.

### Ćwiczenie 3 — migracja

Dodaj do encji nowe pole `category`. Przygotuj migrację bazy z wersji 1 do 2 bez utraty danych. Następnie napisz test migracji.

### Ćwiczenie 4 — pliki

Zaimplementuj eksport listy zadań do pliku tekstowego lub CSV. Zapisz plik w pamięci prywatnej aplikacji i dodaj funkcję odczytu.

### Ćwiczenie 5 — bezpieczeństwo

Przeanalizuj, które dane w aplikacji To-Do są wrażliwe, a które nie. Zaproponuj architekturę przechowywania tokenu, ustawień i lokalnej bazy z uwzględnieniem bezpieczeństwa.

## Zadanie projektowe

Przygotuj projekt aplikacji „Budżet domowy”. Wymagania:
- kategorie wydatków,
- transakcje lokalne w Room,
- ustawienia waluty i motywu w DataStore,
- eksport raportu do pliku,
- opcjonalna synchronizacja z backendem,
- plan migracji bazy po dodaniu nowego typu transakcji.

Do projektu dołącz uzasadnienie wyboru każdego mechanizmu przechowywania danych.

## Linki

- [Data and file storage overview](https://developer.android.com/training/data-storage/)
- [DataStore](https://developer.android.com/topic/libraries/architecture/datastore)
- [Room](https://developer.android.com/training/data-storage/room/)
- [Room releases](https://developer.android.com/jetpack/androidx/releases/room)
- [SharedPreferences](https://developer.android.com/training/data-storage/shared-preferences)
