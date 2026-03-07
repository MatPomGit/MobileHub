# Programowanie Natywne Android — Android Studio

Android Studio to oficjalne IDE dla Androida, oparte na IntelliJ IDEA. Natywne programowanie Android w Kotlin z Jetpack Compose daje pełny dostęp do API platformy i najlepszą wydajność.

## Konfiguracja projektu

### Struktura projektu Android

```
MojaAplikacja/
├── app/
│   ├── src/
│   │   ├── main/
│   │   │   ├── java/com/example/app/
│   │   │   │   ├── MainActivity.kt
│   │   │   │   ├── ui/            ← ekrany Compose
│   │   │   │   ├── viewmodel/     ← ViewModels
│   │   │   │   ├── repository/    ← warstwa danych
│   │   │   │   └── model/         ← modele danych
│   │   │   ├── res/
│   │   │   │   ├── drawable/      ← grafiki XML
│   │   │   │   ├── values/        ← strings, colors, themes
│   │   │   │   └── raw/           ← zasoby binarne
│   │   │   └── AndroidManifest.xml
│   │   └── test/                  ← testy jednostkowe
│   └── build.gradle.kts
├── gradle/
└── build.gradle.kts
```

### build.gradle.kts — kluczowe ustawienia

```kotlin
android {
    namespace = "com.example.app"
    compileSdk = 35

    defaultConfig {
        applicationId = "com.example.app"
        minSdk = 24          // Android 7.0
        targetSdk = 35       // Android 15
        versionCode = 1
        versionName = "1.0"
    }

    buildFeatures {
        compose = true       // włącz Jetpack Compose
    }
}

dependencies {
    // Compose BOM — zarządza wersjami Compose
    val composeBom = platform("androidx.compose:compose-bom:2024.09.00")
    implementation(composeBom)
    
    implementation("androidx.compose.ui:ui")
    implementation("androidx.compose.material3:material3")
    implementation("androidx.activity:activity-compose:1.9.2")
    implementation("androidx.lifecycle:lifecycle-viewmodel-compose:2.8.3")
    implementation("androidx.navigation:navigation-compose:2.8.0")
}
```

## Jetpack Compose — podstawy

Compose to deklaratywny framework UI. Opisujesz **co** ma być wyświetlone (nie **jak** aktualizować widoki).

### Kompozyty (Composables)

```kotlin
@Composable
fun UserCard(user: User) {
    Card(
        modifier = Modifier
            .fillMaxWidth()
            .padding(8.dp),
        elevation = CardDefaults.cardElevation(4.dp)
    ) {
        Row(
            modifier = Modifier.padding(16.dp),
            verticalAlignment = Alignment.CenterVertically
        ) {
            AsyncImage(
                model = user.avatarUrl,
                contentDescription = "Avatar ${user.name}",
                modifier = Modifier
                    .size(48.dp)
                    .clip(CircleShape)
            )
            Spacer(Modifier.width(12.dp))
            Column {
                Text(
                    text = user.name,
                    style = MaterialTheme.typography.titleMedium
                )
                Text(
                    text = user.email,
                    style = MaterialTheme.typography.bodySmall,
                    color = MaterialTheme.colorScheme.onSurfaceVariant
                )
            }
        }
    }
}
```

### State management

```kotlin
// State lokalny
@Composable
fun Counter() {
    var count by remember { mutableStateOf(0) }
    
    Column(horizontalAlignment = Alignment.CenterHorizontally) {
        Text("Licznik: $count", style = MaterialTheme.typography.headlineMedium)
        Button(onClick = { count++ }) {
            Text("Zwiększ")
        }
    }
}
```

### ViewModel + StateFlow

```kotlin
// ViewModel
class TaskViewModel : ViewModel() {
    private val _uiState = MutableStateFlow(TaskUiState())
    val uiState: StateFlow<TaskUiState> = _uiState.asStateFlow()
    
    fun addTask(name: String) {
        _uiState.update { state ->
            state.copy(tasks = state.tasks + Task(name = name))
        }
    }
}

// Composable obserwujący stan
@Composable
fun TaskScreen(viewModel: TaskViewModel = viewModel()) {
    val state by viewModel.uiState.collectAsStateWithLifecycle()
    
    LazyColumn {
        items(state.tasks) { task ->
            TaskItem(task = task)
        }
    }
}
```

## Navigation Component

```kotlin
// Definicja grafu nawigacji
@Composable
fun AppNavGraph() {
    val navController = rememberNavController()
    
    NavHost(
        navController = navController,
        startDestination = "home"
    ) {
        composable("home") {
            HomeScreen(
                onNavigateToDetail = { id -> 
                    navController.navigate("detail/$id") 
                }
            )
        }
        composable(
            route = "detail/{itemId}",
            arguments = listOf(navArgument("itemId") { type = NavType.IntType })
        ) { backStackEntry ->
            val itemId = backStackEntry.arguments?.getInt("itemId") ?: 0
            DetailScreen(itemId = itemId)
        }
    }
}
```

## Room — baza danych

```kotlin
// Entity
@Entity(tableName = "tasks")
data class Task(
    @PrimaryKey(autoGenerate = true) val id: Int = 0,
    @ColumnInfo(name = "task_name") val name: String,
    val isCompleted: Boolean = false,
    val createdAt: Long = System.currentTimeMillis()
)

// DAO
@Dao
interface TaskDao {
    @Query("SELECT * FROM tasks ORDER BY createdAt DESC")
    fun getAllTasks(): Flow<List<Task>>
    
    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertTask(task: Task)
    
    @Delete
    suspend fun deleteTask(task: Task)
}

// Database
@Database(entities = [Task::class], version = 1)
abstract class AppDatabase : RoomDatabase() {
    abstract fun taskDao(): TaskDao
    
    companion object {
        fun create(context: Context): AppDatabase =
            Room.databaseBuilder(context, AppDatabase::class.java, "app.db").build()
    }
}
```

## Retrofit — API REST

```kotlin
// Interface API
interface PokemonApi {
    @GET("pokemon/{name}")
    suspend fun getPokemon(@Path("name") name: String): PokemonResponse
    
    @GET("pokemon")
    suspend fun getPokemonList(
        @Query("limit") limit: Int = 20,
        @Query("offset") offset: Int = 0
    ): PokemonListResponse
}

// Inicjalizacja
val retrofit = Retrofit.Builder()
    .baseUrl("https://pokeapi.co/api/v2/")
    .addConverterFactory(GsonConverterFactory.create())
    .build()

val api = retrofit.create(PokemonApi::class.java)
```

## AndroidManifest.xml — uprawnienia

```xml
<manifest xmlns:android="http://schemas.android.com/apk/res/android">
    
    <!-- Uprawnienia deklarowane statycznie -->
    <uses-permission android:name="android.permission.INTERNET"/>
    <uses-permission android:name="android.permission.ACCESS_FINE_LOCATION"/>
    <uses-permission android:name="android.permission.CAMERA"/>
    
    <application
        android:name=".MyApp"
        android:theme="@style/Theme.MyApp">
        
        <activity android:name=".MainActivity"
            android:exported="true">
            <intent-filter>
                <action android:name="android.intent.action.MAIN"/>
                <category android:name="android.intent.category.LAUNCHER"/>
            </intent-filter>
        </activity>
        
    </application>
</manifest>
```

## Linki

- [Android Developers — Jetpack Compose](https://developer.android.com/compose)
- [Android Studio Download](https://developer.android.com/studio)
- [Kotlin Documentation](https://kotlinlang.org/docs/home.html)
- [Material Design 3 — Compose](https://m3.material.io/develop/android/jetpack-compose)
