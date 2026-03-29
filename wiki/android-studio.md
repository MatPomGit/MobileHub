# Programowanie natywne Android — Android Studio

Android Studio to oficjalne środowisko programistyczne do tworzenia aplikacji na Androida, oparte na IntelliJ IDEA. Współczesne aplikacje natywne najczęściej buduje się w języku Kotlin, z użyciem Jetpack Compose do interfejsu użytkownika oraz bibliotek Jetpack do architektury, nawigacji, przechowywania danych i testowania.

Ten materiał wprowadza do praktycznego tworzenia aplikacji mobilnych w Android Studio. Zawiera poprawne wzorce projektowe, przykłady kodu, dobre praktyki oraz ćwiczenia laboratoryjne.

## Dlaczego Android Studio i Kotlin

Android Studio integruje w jednym miejscu edytor kodu, emulator, profiler, narzędzia do debugowania, podgląd układów, analizę jakości kodu oraz obsługę Gradle. Dzięki temu umożliwia pełny cykl pracy: od utworzenia projektu, przez implementację i testy, aż po budowanie paczek instalacyjnych i przygotowanie publikacji.

Kotlin jest obecnie językiem rekomendowanym do programowania Android. Oferuje czytelniejszą składnię niż Java, bezpieczeństwo nulli, korutyny, wygodne klasy danych i dobrą integrację z bibliotekami Jetpack.

Jetpack Compose jest deklaratywnym frameworkiem UI. Zamiast ręcznie modyfikować widoki, programista opisuje stan interfejsu, a framework sam aktualizuje ekran, gdy stan się zmienia.

## Cele projektowe nowoczesnej aplikacji Android

Dobrze zaprojektowana aplikacja powinna:

- rozdzielać warstwę UI od logiki biznesowej i danych,
- zarządzać stanem w sposób przewidywalny,
- obsługiwać cykl życia komponentów,
- być odporna na rotację ekranu i rekreację procesu,
- działać poprawnie przy braku internetu,
- minimalizować zużycie baterii i transfer danych,
- być testowalna i łatwa w rozbudowie.

Najczęściej stosowany układ warstw wygląda następująco:

- **UI layer** — ekrany Compose, obsługa zdarzeń użytkownika, prezentacja stanu,
- **domain layer** — opcjonalna warstwa przypadków użycia,
- **data layer** — repozytoria, źródła lokalne i zdalne, mapowanie modeli.

## Struktura projektu Android

W praktyce struktura projektu może wyglądać tak:

```text
MojaAplikacja/
├── app/
│   ├── src/
│   │   ├── main/
│   │   │   ├── java/ lub kotlin/
│   │   │   │   └── com/example/app/
│   │   │   │       ├── MainActivity.kt
│   │   │   │       ├── ui/
│   │   │   │       │   ├── screen/
│   │   │   │       │   ├── component/
│   │   │   │       │   └── theme/
│   │   │   │       ├── navigation/
│   │   │   │       ├── viewmodel/
│   │   │   │       ├── data/
│   │   │   │       │   ├── local/
│   │   │   │       │   ├── remote/
│   │   │   │       │   ├── repository/
│   │   │   │       │   └── model/
│   │   │   │       └── domain/
│   │   │   ├── res/
│   │   │   │   ├── drawable/
│   │   │   │   ├── mipmap/
│   │   │   │   ├── values/
│   │   │   │   ├── xml/
│   │   │   │   └── raw/
│   │   │   └── AndroidManifest.xml
│   │   ├── test/         ← testy jednostkowe JVM
│   │   └── androidTest/  ← testy instrumentacyjne i UI
│   └── build.gradle.kts
├── gradle/
├── gradle/libs.versions.toml
├── settings.gradle.kts
└── build.gradle.kts
```

### Uwagi do struktury

- Katalog źródeł może nazywać się `java`, nawet jeśli przechowuje pliki Kotlin. To poprawne, choć w nowych projektach często spotyka się również katalog `kotlin`.
- W Compose warto oddzielać ekrany, komponenty wielokrotnego użytku, temat aplikacji i nawigację.
- Testy jednostkowe trafiają do `test`, a testy uruchamiane na urządzeniu lub emulatorze do `androidTest`.

## Konfiguracja projektu w Gradle

W materiałach dydaktycznych lepiej unikać twardego wpisywania wielu numerów wersji bibliotek, ponieważ zmieniają się one regularnie. W praktycznych projektach warto korzystać z **Version Catalog** (`libs.versions.toml`) i aktualizować zależności centralnie.

### Przykład modułu `app/build.gradle.kts`

Plik `build.gradle.kts` konfiguruje moduł aplikacji: docelowe wersje API, funkcje kompilacji, zależności i ustawienia podpisywania. Użycie BOM (Bill of Materials) dla Compose pozwala zarządzać wersjami wielu powiązanych bibliotek w jednym miejscu, eliminując konflikty między zależnościami.

```kotlin
plugins {
    id("com.android.application")
    id("org.jetbrains.kotlin.android")
    id("org.jetbrains.kotlin.plugin.compose")
    id("com.google.devtools.ksp")
}

android {
    namespace = "com.example.app"
    compileSdk = 35

    defaultConfig {
        applicationId = "com.example.app"
        minSdk = 24
        targetSdk = 35
        versionCode = 1
        versionName = "1.0"

        testInstrumentationRunner = "androidx.test.runner.AndroidJUnitRunner"
        vectorDrawables {
            useSupportLibrary = true
        }
    }

    buildTypes {
        release {
            isMinifyEnabled = false
            proguardFiles(
                getDefaultProguardFile("proguard-android-optimize.txt"),
                "proguard-rules.pro"
            )
        }
    }

    buildFeatures {
        compose = true
    }

    kotlinOptions {
        jvmTarget = "17"
    }

    packaging {
        resources {
            excludes += "/META-INF/{AL2.0,LGPL2.1}"
        }
    }
}

dependencies {
    val composeBom = platform("androidx.compose:compose-bom:2025.01.00")

    implementation(composeBom)
    androidTestImplementation(composeBom)

    implementation("androidx.core:core-ktx:1.15.0")
    implementation("androidx.lifecycle:lifecycle-runtime-compose:2.8.7")
    implementation("androidx.lifecycle:lifecycle-viewmodel-compose:2.8.7")
    implementation("androidx.activity:activity-compose:1.10.1")
    implementation("androidx.compose.ui:ui")
    implementation("androidx.compose.ui:ui-tooling-preview")
    implementation("androidx.compose.material3:material3")
    implementation("androidx.navigation:navigation-compose:2.8.8")

    implementation("androidx.room:room-runtime:2.8.4")
    implementation("androidx.room:room-ktx:2.8.4")
    ksp("androidx.room:room-compiler:2.8.4")

    implementation("com.squareup.retrofit2:retrofit:2.11.0")
    implementation("com.squareup.retrofit2:converter-gson:2.11.0")
    implementation("com.squareup.okhttp3:logging-interceptor:4.12.0")
    implementation("io.coil-kt:coil-compose:2.7.0")

    testImplementation("junit:junit:4.13.2")
    androidTestImplementation("androidx.test.ext:junit:1.2.1")
    androidTestImplementation("androidx.test.espresso:espresso-core:3.6.1")
    androidTestImplementation("androidx.compose.ui:ui-test-junit4")
    debugImplementation("androidx.compose.ui:ui-tooling")
    debugImplementation("androidx.compose.ui:ui-test-manifest")
}
```

### Co jest tu istotne

- `compileSdk` określa poziom API, z którym aplikacja jest kompilowana.
- `targetSdk` deklaruje, do jakiego poziomu API aplikacja została dostosowana semantycznie.
- `minSdk` określa najstarszą wersję Androida obsługiwaną przez aplikację.
- Compose wygodnie wersjonuje się przez **BOM**, aby uniknąć ręcznego pilnowania zgodności wielu modułów.
- Room z Kotlinem zwykle wykorzystuje `room-ktx`, a generowanie kodu warto realizować przez `ksp`.
- `collectAsStateWithLifecycle()` wymaga zależności `lifecycle-runtime-compose`.
- `AsyncImage` z przykładu wymaga biblioteki Coil.

### Dobra praktyka

W skryptach dydaktycznych i projektach zespołowych lepiej pisać:

- „użyj aktualnej stabilnej wersji biblioteki”,
- niż przywiązywać studentów do numeru, który za kilka miesięcy będzie nieaktualny.

## Jetpack Compose — podstawy

Compose opiera się na trzech filarach:

- **deklaratywności** — opisujesz wynikowy interfejs,
- **stanie** — UI jest funkcją stanu,
- **rekombinacji** — po zmianie stanu framework przelicza tylko potrzebne fragmenty drzewa UI.

### Composable functions

Funkcja oznaczona adnotacją `@Composable` opisuje fragment interfejsu użytkownika. Poniższy przykład demonstruje tworzenie karty użytkownika z avatarem i danymi kontaktowymi, ilustrując kluczowe wzorce Compose: układy wierszowe i kolumnowe, modyfikatory, stylowanie typografią Material 3 oraz ładowanie obrazów z sieci przez bibliotekę Coil.

```kotlin
@Composable
fun UserCard(user: User) {
    Card(
        modifier = Modifier
            .fillMaxWidth()
            .padding(8.dp),
        elevation = CardDefaults.cardElevation(defaultElevation = 4.dp)
    ) {
        Row(
            modifier = Modifier.padding(16.dp),
            verticalAlignment = Alignment.CenterVertically
        ) {
            AsyncImage(
                model = user.avatarUrl,
                contentDescription = "Avatar użytkownika ${user.name}",
                modifier = Modifier
                    .size(48.dp)
                    .clip(CircleShape)
            )
            Spacer(modifier = Modifier.width(12.dp))
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

### Zasady projektowania composables

- Funkcje Compose powinny być możliwie małe i skoncentrowane na jednej odpowiedzialności.
- Należy preferować parametry wejściowe i unikać ukrytego pobierania stanu z wielu miejsc.
- Komponenty wielokrotnego użytku powinny otrzymywać dane i akcje jako argumenty.
- Warto dbać o dostępność: `contentDescription`, poprawne kontrasty, rozmiary elementów dotykowych.

## Stan w Compose

W Compose interfejs nie powinien „sam siebie pamiętać” w przypadkowych miejscach. Trzeba świadomie zdecydować, gdzie stan ma się znajdować.

### Stan lokalny

Stan lokalny jest dobry wtedy, gdy dotyczy wyłącznie pojedynczego elementu UI. Prosty licznik ilustruje użycie `rememberSaveable`, które przechowuje stan zarówno między rekombinacjami composable, jak i po zmianie konfiguracji urządzenia, np. obrocie ekranu. To podstawowy wzorzec zarządzania stanem dla elementów UI niezależnych od reszty aplikacji.

```kotlin
@Composable
fun Counter() {
    var count by rememberSaveable { mutableIntStateOf(0) }

    Column(horizontalAlignment = Alignment.CenterHorizontally) {
        Text(
            text = "Licznik: $count",
            style = MaterialTheme.typography.headlineMedium
        )
        Button(onClick = { count++ }) {
            Text("Zwiększ")
        }
    }
}
```

### `remember` a `rememberSaveable`

- `remember` przechowuje stan podczas rekombinacji.
- `rememberSaveable` dodatkowo potrafi odtworzyć prosty stan po zmianie konfiguracji, na przykład po obrocie ekranu.

### State hoisting

**Hoisting stanu** oznacza wyniesienie stanu do komponentu nadrzędnego. To ułatwia testowanie i ponowne użycie komponentów.

```kotlin
@Composable
fun CounterScreen() {
    var count by rememberSaveable { mutableIntStateOf(0) }
    CounterContent(count = count, onIncrement = { count++ })
}

@Composable
fun CounterContent(count: Int, onIncrement: () -> Unit) {
    Column(horizontalAlignment = Alignment.CenterHorizontally) {
        Text("Licznik: $count")
        Button(onClick = onIncrement) {
            Text("Zwiększ")
        }
    }
}
```

### Kiedy stan lokalny, a kiedy ViewModel

Stan lokalny:

- formularz wewnątrz jednego ekranu,
- rozwinięcie sekcji,
- tymczasowy filtr widoczny tylko w obrębie jednego composable.

ViewModel:

- stan całego ekranu,
- dane pobierane z repozytorium,
- logika biznesowa,
- obsługa przetrwania zmian konfiguracji.

## ViewModel + StateFlow

ViewModel powinien udostępniać stan ekranu jako niezmienny strumień oraz przyjmować zdarzenia od UI. Poniższy przykład pokazuje wzorcową implementację z `StateFlow`: definicję klasy stanu, reaktywne zbieranie danych z repozytorium, obsługę błędów i mutowalne metody akcji. Taki układ zapewnia odporność na zmiany konfiguracji i czytelny jednokierunkowy przepływ danych.

```kotlin
data class TaskUiState(
    val tasks: List<Task> = emptyList(),
    val isLoading: Boolean = false,
    val errorMessage: String? = null
)

class TaskViewModel(
    private val repository: TaskRepository
) : ViewModel() {

    private val _uiState = MutableStateFlow(TaskUiState(isLoading = true))
    val uiState: StateFlow<TaskUiState> = _uiState.asStateFlow()

    init {
        observeTasks()
    }

    private fun observeTasks() {
        viewModelScope.launch {
            repository.getTasks()
                .catch { throwable ->
                    _uiState.update {
                        it.copy(isLoading = false, errorMessage = throwable.message)
                    }
                }
                .collect { tasks ->
                    _uiState.update {
                        it.copy(tasks = tasks, isLoading = false, errorMessage = null)
                    }
                }
        }
    }

    fun addTask(name: String) {
        viewModelScope.launch {
            repository.addTask(name)
        }
    }
}
```

Composable obserwujący stan:

Poniższy ekran demonstruje, jak obserwować `StateFlow` z ViewModelu i reagować na różne stany: ładowanie, błąd i poprawnie załadowane dane. Metoda `collectAsStateWithLifecycle()` jest preferowanym sposobem zbierania strumieni w Compose, ponieważ automatycznie wstrzymuje kolekcję, gdy ekran nie jest widoczny.

```kotlin
@Composable
fun TaskScreen(viewModel: TaskViewModel = viewModel()) {
    val state by viewModel.uiState.collectAsStateWithLifecycle()

    when {
        state.isLoading -> CircularProgressIndicator()
        state.errorMessage != null -> Text("Błąd: ${state.errorMessage}")
        else -> {
            LazyColumn {
                items(
                    items = state.tasks,
                    key = { task -> task.id }
                ) { task ->
                    Text(task.name)
                }
            }
        }
    }
}
```

### Dobre praktyki dla ViewModel

- UI nie powinno bezpośrednio wykonywać zapytań sieciowych ani bazodanowych.
- ViewModel nie powinien znać szczegółów widoku, takich jak `Context`, chyba że istnieje uzasadniona potrzeba i używa się np. `Application`.
- Stan powinien być reprezentowany jedną strukturą, np. `TaskUiState`.
- Zdarzenia jednorazowe, takie jak komunikat Snackbar czy przejście do kolejnego ekranu, warto obsługiwać osobno niż trwały stan UI.

## Nawigacja w Compose

W małych projektach można stosować proste trasy tekstowe, ale w większych aplikacjach należy uważać na literówki i niespójności. Dobrą praktyką jest wydzielenie definicji tras.

```kotlin
object Routes {
    const val HOME = "home"
    const val DETAIL = "detail"
}

@Composable
fun AppNavGraph() {
    val navController = rememberNavController()

    NavHost(
        navController = navController,
        startDestination = Routes.HOME
    ) {
        composable(Routes.HOME) {
            HomeScreen(
                onNavigateToDetail = { id ->
                    navController.navigate("${Routes.DETAIL}/$id")
                }
            )
        }

        composable(
            route = "${Routes.DETAIL}/{itemId}",
            arguments = listOf(
                navArgument("itemId") { type = NavType.IntType }
            )
        ) { backStackEntry ->
            val itemId = backStackEntry.arguments?.getInt("itemId") ?: return@composable
            DetailScreen(itemId = itemId)
        }
    }
}
```

### Zasady nawigacji

- Nawiguj na poziomie ekranów, nie pojedynczych drobnych komponentów.
- Nie przekazuj dużych obiektów przez trasę. Lepiej przekazać identyfikator i pobrać dane w ekranie docelowym.
- Dla testowalności dobrze jest przekazywać callbacki nawigacyjne do ekranu zamiast przekazywać `NavController` w głąb drzewa UI.

## Room — lokalna baza danych

Room upraszcza pracę z SQLite, zapewnia sprawdzanie zapytań SQL podczas kompilacji i integruje się z `Flow` oraz korutynami.

### Encja

Encja Room reprezentuje pojedynczy wiersz tabeli w bazie danych SQLite. Adnotacja `@Entity` definiuje nazwę tabeli, a `@PrimaryKey(autoGenerate = true)` zleca bazie automatyczne przypisywanie unikalnych identyfikatorów nowym rekordom.

```kotlin
@Entity(tableName = "tasks")
data class TaskEntity(
    @PrimaryKey(autoGenerate = true) val id: Int = 0,
    @ColumnInfo(name = "task_name") val name: String,
    val isCompleted: Boolean = false,
    val createdAt: Long = System.currentTimeMillis()
)
```

### DAO

DAO (Data Access Object) opisuje operacje na tabeli za pomocą adnotacji Room. Metoda zwracająca `Flow<List<TaskEntity>>` umożliwia reaktywne obserwowanie zmian w bazie — każda modyfikacja tabeli automatycznie emituje zaktualizowaną listę do wszystkich obserwatorów.

```kotlin
@Dao
interface TaskDao {
    @Query("SELECT * FROM tasks ORDER BY createdAt DESC")
    fun getAllTasks(): Flow<List<TaskEntity>>

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertTask(task: TaskEntity)

    @Update
    suspend fun updateTask(task: TaskEntity)

    @Delete
    suspend fun deleteTask(task: TaskEntity)
}
```

### Baza danych

Klasa `AppDatabase` jest głównym punktem wejścia do bazy danych Room. Adnotacja `@Database` określa listę encji i numer wersji schematu, który jest niezbędny do prawidłowego zarządzania migracjami przy przyszłych zmianach struktury danych.

```kotlin
@Database(entities = [TaskEntity::class], version = 1, exportSchema = true)
abstract class AppDatabase : RoomDatabase() {
    abstract fun taskDao(): TaskDao
}
```

### Tworzenie instancji bazy

W rzeczywistej aplikacji baza nie powinna być tworzona za każdym razem „ręcznie” w losowym miejscu kodu. Zwykle buduje się ją jako singleton albo dostarcza przez framework DI, np. Hilt.

```kotlin
object DatabaseProvider {
    @Volatile
    private var instance: AppDatabase? = null

    fun getDatabase(context: Context): AppDatabase {
        return instance ?: synchronized(this) {
            instance ?: Room.databaseBuilder(
                context.applicationContext,
                AppDatabase::class.java,
                "app.db"
            ).build().also { instance = it }
        }
    }
}
```

### Repozytorium

Repozytorium stanowi warstwę pośrednią między DAO a resztą aplikacji, wykonując mapowanie encji na modele domenowe. Taka separacja sprawia, że ViewModel i UI nie muszą wiedzieć nic o szczegółach implementacji bazy danych ani o strukturze tabel SQLite.

```kotlin
class TaskRepository(
    private val taskDao: TaskDao
) {
    fun getTasks(): Flow<List<Task>> {
        return taskDao.getAllTasks().map { entities ->
            entities.map { entity ->
                Task(
                    id = entity.id,
                    name = entity.name,
                    isCompleted = entity.isCompleted,
                    createdAt = entity.createdAt
                )
            }
        }
    }

    suspend fun addTask(name: String) {
        taskDao.insertTask(TaskEntity(name = name))
    }
}
```

### Typowe błędy studentów przy Room

- wykonywanie operacji bazy danych w wątku głównym,
- brak migracji przy zmianie schematu,
- mylenie modelu bazy z modelem domenowym i modelem sieciowym,
- trzymanie logiki biznesowej bezpośrednio w DAO.

## Retrofit i komunikacja z REST API

Retrofit jest popularną biblioteką do komunikacji HTTP. Na Androidzie zwykle używa się go wraz z OkHttp i konwerterem JSON.

### Definicja API

Interfejs API Retrofit opisuje endpointy serwera jako metody Kotlin z adnotacjami HTTP. Dzięki słowu kluczowemu `suspend` metody te można wywoływać bezpośrednio w korutynach, a biblioteka automatycznie obsługuje serializację parametrów i deserializację odpowiedzi JSON.

```kotlin
interface PokemonApi {
    @GET("pokemon/{name}")
    suspend fun getPokemon(
        @Path("name") name: String
    ): PokemonResponse

    @GET("pokemon")
    suspend fun getPokemonList(
        @Query("limit") limit: Int = 20,
        @Query("offset") offset: Int = 0
    ): PokemonListResponse
}
```

### Inicjalizacja klienta HTTP

Konfiguracja klienta HTTP obejmuje ustawienie bazowego URL, konwertera JSON oraz interceptorów. `HttpLoggingInterceptor` jest szczególnie przydatny podczas developmentu, ponieważ wypisuje pełną treść żądań i odpowiedzi HTTP w oknie Logcat.

```kotlin
val loggingInterceptor = HttpLoggingInterceptor().apply {
    level = HttpLoggingInterceptor.Level.BASIC
}

val okHttpClient = OkHttpClient.Builder()
    .addInterceptor(loggingInterceptor)
    .build()

val retrofit = Retrofit.Builder()
    .baseUrl("https://pokeapi.co/api/v2/")
    .client(okHttpClient)
    .addConverterFactory(GsonConverterFactory.create())
    .build()

val api = retrofit.create(PokemonApi::class.java)
```

### Repozytorium dla sieci

Repozytorium sieciowe opakowuje wywołanie API w `runCatching`, zamieniając potencjalne wyjątki na typ `Result`. Taka warstwa abstrakcji sprawia, że ViewModel nigdy nie musi bezpośrednio obsługiwać wyjątków sieciowych ani znać szczegółów implementacji Retrofit.

```kotlin
class PokemonRepository(
    private val api: PokemonApi
) {
    suspend fun getPokemon(name: String): Result<PokemonResponse> {
        return runCatching { api.getPokemon(name) }
    }
}
```

### Ważne zasady pracy z siecią

- Uprawnienie `INTERNET` trzeba zadeklarować w manifeście.
- Operacji sieciowych nie wykonuje się w wątku głównym.
- Należy obsługiwać błędy HTTP, timeouty i brak połączenia.
- Warto rozdzielać model odpowiedzi API od modelu domenowego wykorzystywanego w UI.
- Produkcyjna aplikacja powinna uwzględniać cache, retry, politykę odświeżania oraz bezpieczeństwo transmisji.

### Przykład bezpieczniejszego wywołania w ViewModel

Poniższy ViewModel demonstruje pełny cykl obsługi żądania sieciowego: ustawienie stanu ładowania, wywołanie repozytorium i aktualizację stanu w zależności od wyniku operacji. Użycie `StateFlow` z metodą `update` zapewnia atomowe i bezpieczne wątkowo modyfikacje stanu ekranu.

```kotlin
class PokemonViewModel(
    private val repository: PokemonRepository
) : ViewModel() {

    private val _uiState = MutableStateFlow(PokemonUiState())
    val uiState: StateFlow<PokemonUiState> = _uiState.asStateFlow()

    fun loadPokemon(name: String) {
        viewModelScope.launch {
            _uiState.update { it.copy(isLoading = true, errorMessage = null) }

            repository.getPokemon(name)
                .onSuccess { pokemon ->
                    _uiState.update {
                        it.copy(isLoading = false, pokemon = pokemon)
                    }
                }
                .onFailure { throwable ->
                    _uiState.update {
                        it.copy(isLoading = false, errorMessage = throwable.message)
                    }
                }
        }
    }
}
```

## AndroidManifest.xml i uprawnienia

Manifest opisuje podstawowe cechy aplikacji: komponenty, uprawnienia, ikonę, temat, konfigurację startową i cechy sprzętowe.

### Przykład

Plik `AndroidManifest.xml` jest centralnym dokumentem konfiguracyjnym każdej aplikacji Android. Deklaruje on komponenty aplikacji (aktywności, usługi), uprawnienia systemowe oraz atrybut `android:exported`, który określa, czy dany komponent jest dostępny dla innych aplikacji zainstalowanych na urządzeniu.

```xml
<manifest xmlns:android="http://schemas.android.com/apk/res/android">

    <uses-permission android:name="android.permission.INTERNET" />
    <uses-permission android:name="android.permission.ACCESS_FINE_LOCATION" />
    <uses-permission android:name="android.permission.CAMERA" />

    <application
        android:name=".MyApp"
        android:allowBackup="true"
        android:label="@string/app_name"
        android:theme="@style/Theme.MyApp">

        <activity
            android:name=".MainActivity"
            android:exported="true">
            <intent-filter>
                <action android:name="android.intent.action.MAIN" />
                <category android:name="android.intent.category.LAUNCHER" />
            </intent-filter>
        </activity>

    </application>
</manifest>
```

### Kluczowe wyjaśnienie

Samo zadeklarowanie niektórych uprawnień w manifeście **nie wystarcza**. Uprawnienia takie jak lokalizacja czy aparat należą do grupy uprawnień niebezpiecznych i muszą być dodatkowo proszone w czasie działania aplikacji.

### Przykład żądania uprawnienia w Compose

Dynamiczne żądanie uprawnienia za pomocą `rememberLauncherForActivityResult` jest zalecanym podejściem w Compose. Launcher obsługuje cały cykl: wyświetlenie systemowego okna dialogowego i powrót z wynikiem, który informuje aplikację, czy użytkownik udzielił zgody.

```kotlin
@Composable
fun CameraPermissionExample() {
    val permission = Manifest.permission.CAMERA
    val launcher = rememberLauncherForActivityResult(
        contract = ActivityResultContracts.RequestPermission()
    ) { granted ->
        if (granted) {
            // można uruchomić funkcję aparatu
        } else {
            // należy poinformować użytkownika, dlaczego funkcja nie działa
        }
    }

    Button(onClick = { launcher.launch(permission) }) {
        Text("Poproś o dostęp do aparatu")
    }
}
```

### Zasady pracy z uprawnieniami

- Proś tylko o te uprawnienia, które są rzeczywiście potrzebne.
- Najpierw wyjaśnij użytkownikowi sens prośby.
- Nie proś o wiele uprawnień na starcie, jeśli nie są jeszcze potrzebne.
- Uwzględnij sytuację odmowy i działanie aplikacji w trybie ograniczonym.

## Architektura aplikacji — zalecany przepływ danych

Dobrą praktyką jest **jednokierunkowy przepływ danych**:

1. Użytkownik wykonuje akcję w UI.
2. UI przekazuje zdarzenie do ViewModel.
3. ViewModel uruchamia logikę w repozytorium.
4. Repozytorium pobiera lub zapisuje dane lokalnie albo zdalnie.
5. ViewModel aktualizuje `uiState`.
6. Compose renderuje nowy widok na podstawie stanu.

Taki model upraszcza debugowanie i testowanie, ponieważ wiadomo, skąd pochodzi zmiana na ekranie.

## Projekt praktyczny — prosty menedżer zadań

Poniżej propozycja miniarchitektury dla aplikacji „Lista zadań”:

- `TaskEntity` — model lokalnej bazy,
- `Task` — model domenowy,
- `TaskDao` — dostęp do Room,
- `TaskRepository` — operacje na danych,
- `TaskViewModel` — stan ekranu,
- `TaskScreen` — interfejs Compose,
- `AppNavGraph` — nawigacja.

### Rozszerzenia funkcjonalne projektu

Student może kolejno dodać:

- oznaczanie zadania jako ukończone,
- filtrowanie zadań,
- sortowanie po dacie,
- ekran szczegółów zadania,
- synchronizację z API,
- testy DAO i ViewModel.

## Najczęstsze błędy merytoryczne i projektowe

### 1. Umieszczanie logiki biznesowej bezpośrednio w composable

Composable powinien głównie wyświetlać dane i wysyłać zdarzenia. Nie powinien samodzielnie wykonywać złożonych zapytań, budować klientów HTTP ani zarządzać bazą danych.

### 2. Przechowywanie całego stanu tylko w `remember`

Stan ekranu zwykle należy przechowywać w ViewModel, ponieważ `remember` nie zastępuje trwałego modelu stanu aplikacji.

### 3. Ignorowanie cyklu życia

Zbieranie strumieni danych powinno być zgodne z cyklem życia. W Compose do tego celu wygodne jest `collectAsStateWithLifecycle()`.

### 4. Brak obsługi błędów sieciowych

Kod demonstracyjny bez `try/catch`, `Result`, komunikatu błędu i stanu ładowania jest niepełny dydaktycznie.

### 5. Mieszanie modeli

Nie należy używać jednego modelu jednocześnie jako:

- odpowiedzi z API,
- encji Room,
- modelu domenowego,
- modelu UI.

W małym przykładzie bywa to kuszące, ale w większej aplikacji szybko prowadzi do problemów.

## Debugowanie i narzędzia Android Studio

Android Studio udostępnia zestaw narzędzi, które studenci powinni umieć stosować:

- **Logcat** — analiza logów aplikacji,
- **Debugger** — breakpointy, podgląd zmiennych, krokowe wykonanie,
- **Layout Inspector** — analiza drzewa UI,
- **Profiler** — pamięć, CPU, sieć i energia,
- **App Inspection** — wgląd w Room, DataStore i WorkManager,
- **Preview w Compose** — szybki podgląd komponentów bez uruchamiania całej aplikacji.

### Przykład Compose Preview

Adnotacja `@Preview` pozwala podglądać composable bezpośrednio w Android Studio bez uruchamiania aplikacji. Opakowując komponent w `MaterialTheme` i przekazując przykładowe dane, można szybko weryfikować wygląd i zachowanie UI w różnych konfiguracjach bez konieczności wdrażania na emulator.

```kotlin
@Preview(showBackground = true)
@Composable
fun UserCardPreview() {
    MaterialTheme {
        UserCard(
            user = User(
                name = "Anna Kowalska",
                email = "anna@example.com",
                avatarUrl = "https://example.com/avatar.png"
            )
        )
    }
}
```

## Testowanie

W nowoczesnej aplikacji Android testujemy co najmniej trzy poziomy:

- logikę biznesową i ViewModel,
- warstwę danych,
- interfejs użytkownika.

### Przykład testu jednostkowego logiki

Testy jednostkowe repozytorium pozwalają weryfikować logikę biznesową bez emulatorów i urządzeń fizycznych. Dzięki `FakeTaskDao` (implementacji DAO przechowywacej dane w pamięci) test jest szybki, deterministyczny i nie wymaga prawdziwej bazy danych SQLite.

```kotlin
class TaskRepositoryTest {

    @Test
    fun `dodanie zadania powinno zwiększyć liczbę rekordów`() = runTest {
        val fakeDao = FakeTaskDao()
        val repository = TaskRepository(fakeDao)

        repository.addTask("Napisać projekt")
        val tasks = repository.getTasks().first()

        assertEquals(1, tasks.size)
        assertEquals("Napisać projekt", tasks.first().name)
    }
}
```

### Co powinni ćwiczyć studenci

- testy ViewModel z użyciem `runTest`,
- testy DAO na bazie in-memory,
- testy Compose sprawdzające obecność tekstu i reakcję na kliknięcia.

## Dobre praktyki projektowe

1. Stosuj czytelne nazwy klas i pakietów.
2. Rozdzielaj odpowiedzialności między warstwami.
3. Używaj `StateFlow` lub `Flow` do reaktywnego przepływu danych.
4. Unikaj długich funkcji composable.
5. Dodawaj obsługę stanów: ładowanie, sukces, puste dane, błąd.
6. Nie blokuj wątku głównego.
7. Pamiętaj o dostępności i internacjonalizacji.
8. Przygotowuj kod tak, aby dało się go testować bez emulatora.
9. Używaj `applicationContext` tam, gdzie kontekst ma żyć dłużej niż aktywność.
10. Traktuj przykłady „demo” jako punkt wyjścia, a nie wzorzec produkcyjny bez poprawek.

## Pytania kontrolne

1. Czym różni się `remember` od `rememberSaveable`?
2. Dlaczego ViewModel nie powinien znać szczegółów implementacji UI?
3. Kiedy warto używać Room zamiast zwykłego pliku JSON?
4. Dlaczego nie należy wykonywać zapytań sieciowych w composable?
5. Jakie są konsekwencje braku obsługi błędu w komunikacji z API?
6. Po co stosuje się repozytoria?
7. Dlaczego `ACCESS_FINE_LOCATION` wymaga dodatkowej zgody użytkownika w czasie działania aplikacji?
8. Jak działa jednokierunkowy przepływ danych w aplikacji Compose?

## Ćwiczenia praktyczne

### Ćwiczenie 1 — licznik ze stanem lokalnym

Zaimplementuj ekran z licznikiem i przyciskiem reset. Następnie rozbuduj go tak, aby stan przetrwał obrót ekranu.

**Cel dydaktyczny:** zrozumienie `rememberSaveable`.

### Ćwiczenie 2 — formularz dodawania zadania

Zaprojektuj formularz z polem tekstowym i przyciskiem „Dodaj”. Po kliknięciu zadanie ma pojawić się na liście.

**Wymagania:**

- walidacja pustego pola,
- czyszczenie pola po dodaniu,
- wyświetlenie listy z użyciem `LazyColumn`.

### Ćwiczenie 3 — Room

Dodaj trwałe przechowywanie zadań w bazie Room.

**Wymagania:**

- zapis zadania,
- usuwanie zadania,
- odczyt listy po ponownym uruchomieniu aplikacji.

### Ćwiczenie 4 — ekran szczegółów

Dodaj nawigację do szczegółów zadania.

**Wymagania:**

- przekazanie identyfikatora w trasie,
- pobranie obiektu na ekranie szczegółów,
- prezentacja pełnych danych.

### Ćwiczenie 5 — integracja z API

Połącz aplikację z publicznym REST API i wyświetl wyniki w Compose.

**Wymagania:**

- stan ładowania,
- stan błędu,
- ponowienie próby,
- logowanie zapytań w trybie debug.

### Ćwiczenie 6 — uprawnienia

Dodaj funkcję korzystającą z aparatu lub lokalizacji.

**Wymagania:**

- deklaracja uprawnienia w manifeście,
- prośba o zgodę w czasie działania,
- obsługa odmowy.

### Ćwiczenie 7 — refaktoryzacja architektury

Przepisz małą aplikację napisaną „w jednym pliku” do układu z warstwami `ui`, `data`, `repository`, `viewmodel`.

**Cel dydaktyczny:** zrozumienie separacji odpowiedzialności.

## Zadanie projektowe

Zaprojektuj aplikację „Planer studenta”. Aplikacja powinna umożliwiać:

- dodawanie zadań i terminów,
- oznaczanie zadań jako wykonane,
- filtrowanie po przedmiotach,
- przechowywanie danych lokalnie w Room,
- opcjonalnie synchronizację z publicznym API lub eksport do pliku.

### Minimalne kryteria zaliczenia

- co najmniej dwa ekrany,
- ViewModel i `StateFlow`,
- Room,
- nawigacja Compose,
- obsługa błędów,
- test przynajmniej jednego elementu logiki.

### Kryteria rozszerzone

- dependency injection,
- testy UI Compose,
- tryb offline-first,
- Material 3 z własnym motywem,
- responsywność dla tabletów.

## Podsumowanie

Android Studio, Kotlin i Jetpack Compose tworzą obecnie podstawowy zestaw narzędzi do programowania natywnych aplikacji Android. Kluczowe dla jakości projektu są nie tylko umiejętność napisania działającego ekranu, lecz także poprawne zarządzanie stanem, podział na warstwy, świadoma obsługa uprawnień, praca z bazą danych i komunikacja z siecią.

Student, który opanuje:

- Compose,
- ViewModel i przepływ stanu,
- Room,
- Retrofit,
- nawigację,
- testowanie,

ma solidną podstawę do budowy bardziej złożonych aplikacji mobilnych.

## Linki

- [Android Developers — Jetpack Compose](https://developer.android.com/compose)
- [Android Developers — App Architecture](https://developer.android.com/topic/architecture)
- [Android Developers — Navigation for Compose](https://developer.android.com/develop/ui/compose/navigation)
- [Android Developers — Room](https://developer.android.com/training/data-storage/room)
- [Android Developers — Permissions](https://developer.android.com/training/permissions/requesting)
- [Android Developers — Connectivity](https://developer.android.com/develop/connectivity/network-ops/connecting)
- [Android Studio Download](https://developer.android.com/studio)
- [Kotlin Documentation](https://kotlinlang.org/docs/home.html)
