# Przechowywanie Danych w Android

Android udostępnia kilka mechanizmów trwałego przechowywania danych, każdy dopasowany do innego rodzaju informacji — od prostych preferencji przez relacyjne bazy danych po pliki i synchronizację z chmurą.

## Przegląd mechanizmów

```
Dane                    → Mechanizm                 → Kiedy używać
──────────────────────────────────────────────────────────────────
Preferencje, ustawienia → DataStore (Preferences)   → Proste klucz-wartość
Wrażliwe dane           → EncryptedSharedPreferences → Tokeny, hasła
Pliki                   → Internal/External Storage  → Media, cache
Dane strukturalne       → Room (SQLite)              → Listy, relacje
Sieć                    → WorkManager + Repository   → Sync z backendem
Chmura                  → Firebase Firestore         → Realtime, offline sync
```

## DataStore — nowoczesna alternatywa dla SharedPreferences

```kotlin
// build.gradle.kts
// implementation("androidx.datastore:datastore-preferences:1.1.1")

// Definicja kluczy (jedna instancja przez DI)
val Context.settingsDataStore by preferencesDataStore("app_settings")

object PreferencesKeys {
    val THEME_MODE     = intPreferencesKey("theme_mode")       // 0=auto, 1=light, 2=dark
    val NOTIFICATIONS  = booleanPreferencesKey("notifications")
    val SORT_ORDER     = stringPreferencesKey("sort_order")    // "date" | "priority" | "title"
    val LAST_SYNC      = longPreferencesKey("last_sync_ms")
}

// Repository wrapping DataStore
class SettingsRepository(private val dataStore: DataStore<Preferences>) {

    // Odczyt jako Flow — reaktywny, emituje przy każdej zmianie
    val themeMode: Flow<Int> = dataStore.data
        .catch { e ->
            if (e is IOException) emit(emptyPreferences())
            else throw e
        }
        .map { it[PreferencesKeys.THEME_MODE] ?: 0 }

    val appSettings: Flow<AppSettings> = dataStore.data
        .catch { emit(emptyPreferences()) }
        .map { prefs ->
            AppSettings(
                themeMode    = prefs[PreferencesKeys.THEME_MODE] ?: 0,
                notifications = prefs[PreferencesKeys.NOTIFICATIONS] ?: true,
                sortOrder    = prefs[PreferencesKeys.SORT_ORDER] ?: "date",
                lastSync     = prefs[PreferencesKeys.LAST_SYNC] ?: 0L
            )
        }

    // Zapis — transakcyjny, thread-safe
    suspend fun setThemeMode(mode: Int) {
        dataStore.edit { it[PreferencesKeys.THEME_MODE] = mode }
    }

    suspend fun updateLastSync() {
        dataStore.edit { it[PreferencesKeys.LAST_SYNC] = System.currentTimeMillis() }
    }

    // Atomic update — odczyt + zapis w jednej transakcji
    suspend fun toggleNotifications() {
        dataStore.edit { prefs ->
            prefs[PreferencesKeys.NOTIFICATIONS] = !(prefs[PreferencesKeys.NOTIFICATIONS] ?: true)
        }
    }
}

data class AppSettings(
    val themeMode: Int,
    val notifications: Boolean,
    val sortOrder: String,
    val lastSync: Long
)
```

## Room — baza danych SQLite

```kotlin
// build.gradle.kts
// implementation("androidx.room:room-runtime:2.6.1")
// implementation("androidx.room:room-ktx:2.6.1")
// ksp("androidx.room:room-compiler:2.6.1")

// 1. Entity — tabela
@Entity(tableName = "tasks",
    indices = [Index("project_id"), Index("due_date"), Index(value = ["title"], unique = false)]
)
data class TaskEntity(
    @PrimaryKey val id: String = UUID.randomUUID().toString(),
    val title: String,
    val description: String = "",
    @ColumnInfo(name = "is_done") val isDone: Boolean = false,
    @ColumnInfo(name = "created_at") val createdAt: Long = System.currentTimeMillis(),
    @ColumnInfo(name = "due_date") val dueDate: Long? = null,
    @ColumnInfo(name = "project_id") val projectId: String? = null,
    val priority: Int = 0  // 0=low, 1=normal, 2=high, 3=urgent
)

// 2. DAO — Data Access Object
@Dao
interface TaskDao {
    // Flow — automatyczne odświeżanie gdy dane się zmieniają
    @Query("SELECT * FROM tasks ORDER BY due_date ASC, priority DESC")
    fun getAllTasks(): Flow<List<TaskEntity>>

    @Query("SELECT * FROM tasks WHERE is_done = 0 AND project_id = :projectId ORDER BY due_date ASC")
    fun getActiveTasks(projectId: String): Flow<List<TaskEntity>>

    @Query("SELECT * FROM tasks WHERE id = :id")
    suspend fun getTask(id: String): TaskEntity?

    @Query("""
        SELECT * FROM tasks
        WHERE (title LIKE :query OR description LIKE :query)
        AND (:projectId IS NULL OR project_id = :projectId)
        ORDER BY created_at DESC
        LIMIT :limit OFFSET :offset
    """)
    suspend fun searchTasks(query: String, projectId: String?, limit: Int, offset: Int): List<TaskEntity>

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insert(task: TaskEntity)

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertAll(tasks: List<TaskEntity>)

    @Update
    suspend fun update(task: TaskEntity)

    @Query("UPDATE tasks SET is_done = :isDone WHERE id = :id")
    suspend fun setDone(id: String, isDone: Boolean)

    @Delete
    suspend fun delete(task: TaskEntity)

    @Query("DELETE FROM tasks WHERE is_done = 1 AND created_at < :olderThan")
    suspend fun deleteCompletedOlderThan(olderThan: Long): Int

    // Agregaty
    @Query("SELECT COUNT(*) FROM tasks WHERE is_done = 0 AND project_id = :projectId")
    fun getActiveTaskCount(projectId: String): Flow<Int>

    @Query("SELECT COUNT(*) FROM tasks WHERE due_date < :now AND is_done = 0")
    fun getOverdueCount(now: Long = System.currentTimeMillis()): Flow<Int>

    // Transakcja — wiele operacji atomowo
    @Transaction
    suspend fun moveTasksToProject(fromProjectId: String, toProjectId: String) {
        val tasks = searchTasks("%", fromProjectId, 1000, 0)
        insertAll(tasks.map { it.copy(projectId = toProjectId) })
    }
}

// 3. Database
@Database(
    entities = [TaskEntity::class, ProjectEntity::class, TagEntity::class],
    version = 3,
    exportSchema = true
)
@TypeConverters(Converters::class)
abstract class AppDatabase : RoomDatabase() {
    abstract fun taskDao(): TaskDao
    abstract fun projectDao(): ProjectDao

    companion object {
        @Volatile private var INSTANCE: AppDatabase? = null

        fun getInstance(context: Context): AppDatabase = INSTANCE ?: synchronized(this) {
            Room.databaseBuilder(context.applicationContext, AppDatabase::class.java, "app_db")
                .addMigrations(MIGRATION_1_2, MIGRATION_2_3)
                .fallbackToDestructiveMigrationOnDowngrade()  // tylko dev!
                .build()
                .also { INSTANCE = it }
        }
    }
}

// Migracja — zmiana schematu bez utraty danych
val MIGRATION_2_3 = object : Migration(2, 3) {
    override fun migrate(db: SupportSQLiteDatabase) {
        db.execSQL("ALTER TABLE tasks ADD COLUMN priority INTEGER NOT NULL DEFAULT 0")
        db.execSQL("CREATE INDEX idx_tasks_priority ON tasks(priority)")
    }
}

// TypeConverter — niestandardowe typy
class Converters {
    @TypeConverter fun fromTimestamp(value: Long?): Date? = value?.let { Date(it) }
    @TypeConverter fun dateToTimestamp(date: Date?): Long? = date?.time
    @TypeConverter fun fromList(value: List<String>): String = value.joinToString(",")
    @TypeConverter fun toList(value: String): List<String> = if (value.isEmpty()) emptyList() else value.split(",")
}
```

## Repository Pattern z Room

```kotlin
class TaskRepository(
    private val taskDao: TaskDao,
    private val dispatcher: CoroutineDispatcher = Dispatchers.IO
) {
    fun getAllTasks(): Flow<List<Task>> =
        taskDao.getAllTasks()
            .map { entities -> entities.map { it.toDomain() } }
            .flowOn(dispatcher)

    suspend fun getTask(id: String): Task? = withContext(dispatcher) {
        taskDao.getTask(id)?.toDomain()
    }

    suspend fun saveTask(task: Task): Unit = withContext(dispatcher) {
        taskDao.insert(task.toEntity())
    }

    suspend fun toggleTask(id: String): Unit = withContext(dispatcher) {
        val task = taskDao.getTask(id) ?: return@withContext
        taskDao.setDone(id, !task.isDone)
    }

    suspend fun deleteTask(id: String): Unit = withContext(dispatcher) {
        val entity = taskDao.getTask(id) ?: return@withContext
        taskDao.delete(entity)
    }

    // Mappers (extension functions)
    private fun TaskEntity.toDomain() = Task(id, title, description, isDone, createdAt, dueDate, priority)
    private fun Task.toEntity()       = TaskEntity(id, title, description, isDone, createdAt, dueDate, priority = priority)
}
```

## Linki

- [Room Docs](https://developer.android.com/training/data-storage/room)
- [DataStore Docs](https://developer.android.com/topic/libraries/architecture/datastore)
- [SQLite in Android](https://developer.android.com/training/data-storage/sqlite)
- [Room Migrations](https://developer.android.com/training/data-storage/room/migrating-db-versions)
