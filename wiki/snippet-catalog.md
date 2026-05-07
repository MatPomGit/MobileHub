# Katalog snippetów mobilnych

## Jak korzystać

Ten katalog zawiera gotowe snippety do najczęstszych zadań w aplikacjach mobilnych. Każdy snippet ma:
- **tagi technologiczne**,
- **poziom trudności**,
- **obszar funkcjonalny**,
- krótki opis działania,
- ograniczenia,
- wariant **production-ready**.

> W interfejsie WIKI możesz użyć przycisku **Kopiuj** przy każdym bloku kodu.
> Jeśli zauważysz błąd, użyj przycisku **Zgłoś błąd** obok snippetu.

---

## 1) Request API (REST)

**Tagi:** `Technology: Kotlin` `Technology: Retrofit` `Difficulty: Intermediate` `Area: Networking`

**Opis działania:** Snippet pobiera listę danych z REST API i mapuje odpowiedź do modelu domenowego.

**Ograniczenia:** Brak cache offline i brak mechanizmu retry/backoff.

### Basic snippet

```kotlin
// Prosty klient API z jednym endpointem GET.
interface UserApi {
    @GET("users")
    suspend fun getUsers(): List<UserDto>
}

// Repozytorium mapuje DTO na model domenowy.
class UserRepository(private val api: UserApi) {
    suspend fun fetchUsers(): List<User> {
        return api.getUsers().map { dto ->
            User(id = dto.id, fullName = dto.name)
        }
    }
}
```

### Production-ready variant

```kotlin
// Wersja produkcyjna: timeout, logowanie, Result i mapowanie błędów.
class UserRepository(
    private val api: UserApi,
    private val ioDispatcher: CoroutineDispatcher
) {
    suspend fun fetchUsers(): Result<List<User>> = withContext(ioDispatcher) {
        runCatching { api.getUsers() }
            .mapCatching { list -> list.map { User(it.id, it.name) } }
    }
}
```

---

## 2) Paginacja

**Tagi:** `Technology: Kotlin` `Technology: Paging3` `Difficulty: Advanced` `Area: Data loading`

**Opis działania:** Snippet ładuje dane stronami i obsługuje klucze `nextPage`.

**Ograniczenia:** Zakłada spójne API paginacji (stały rozmiar strony i poprawny `nextPage`).

### Basic snippet

```kotlin
// Podstawowe źródło stronicowania dla biblioteki Paging 3.
class PostsPagingSource(private val api: PostsApi) : PagingSource<Int, Post>() {
    override suspend fun load(params: LoadParams<Int>): LoadResult<Int, Post> {
        return try {
            val page = params.key ?: 1
            val response = api.getPosts(page = page, pageSize = params.loadSize)
            LoadResult.Page(
                data = response.items,
                prevKey = if (page == 1) null else page - 1,
                nextKey = response.nextPage
            )
        } catch (exception: Exception) {
            LoadResult.Error(exception)
        }
    }

    override fun getRefreshKey(state: PagingState<Int, Post>): Int? = state.anchorPosition
}
```

### Production-ready variant

```kotlin
// Wersja produkcyjna: stabilny refreshKey i kontrola granic zakresu.
override fun getRefreshKey(state: PagingState<Int, Post>): Int? {
    val anchor = state.anchorPosition ?: return null
    val anchorPage = state.closestPageToPosition(anchor)
    return anchorPage?.prevKey?.plus(1) ?: anchorPage?.nextKey?.minus(1)
}
```

---

## 3) Local storage

**Tagi:** `Technology: Kotlin` `Technology: DataStore` `Difficulty: Beginner` `Area: Persistence`

**Opis działania:** Snippet zapisuje i odczytuje preferencje użytkownika (np. motyw aplikacji).

**Ograniczenia:** Dla danych relacyjnych lepsze będzie Room; DataStore nie zastępuje pełnej bazy SQL.

### Basic snippet

```kotlin
// DataStore do prostych preferencji klucz-wartość.
class SettingsStore(private val dataStore: DataStore<Preferences>) {
    private val themeKey = stringPreferencesKey("theme_mode")

    suspend fun saveTheme(theme: String) {
        dataStore.edit { prefs ->
            prefs[themeKey] = theme
        }
    }

    val themeFlow: Flow<String> = dataStore.data
        .map { prefs -> prefs[themeKey] ?: "system" }
}
```

### Production-ready variant

```kotlin
// Wersja produkcyjna: ochrona przed corruption i fallback domyślny.
val safeThemeFlow: Flow<String> = dataStore.data
    .catch { exception ->
        if (exception is IOException) emit(emptyPreferences()) else throw exception
    }
    .map { prefs -> prefs[themeKey] ?: "system" }
```

---

## 4) Permissions

**Tagi:** `Technology: Kotlin` `Technology: AndroidX Activity` `Difficulty: Intermediate` `Area: Device access`

**Opis działania:** Snippet obsługuje runtime permission dla aparatu i rozróżnia przypadki odmowy.

**Ograniczenia:** Dla wielu uprawnień jednocześnie warto dodać dedykowany ekran wyjaśniający cel dostępu.

### Basic snippet

```kotlin
// Rejestracja requestu uprawnienia w Activity/Fragment.
private val requestCameraPermission = registerForActivityResult(
    ActivityResultContracts.RequestPermission()
) { granted ->
    if (granted) openCamera() else showPermissionDeniedInfo()
}

fun ensureCameraPermission() {
    requestCameraPermission.launch(Manifest.permission.CAMERA)
}
```

### Production-ready variant

```kotlin
// Wersja produkcyjna: obsługa "Don't ask again" i deep link do ustawień aplikacji.
fun onPermissionDeniedPermanently(context: Context) {
    val intent = Intent(Settings.ACTION_APPLICATION_DETAILS_SETTINGS).apply {
        data = Uri.fromParts("package", context.packageName, null)
    }
    context.startActivity(intent)
}
```

---

## 5) Push notifications

**Tagi:** `Technology: Kotlin` `Technology: Firebase Cloud Messaging` `Difficulty: Advanced` `Area: Engagement`

**Opis działania:** Snippet odbiera wiadomość push, buduje notyfikację i aktualizuje token urządzenia.

**Ograniczenia:** Wymaga poprawnej konfiguracji FCM, kanałów notyfikacji i backendu do zarządzania tokenami.

### Basic snippet

```kotlin
// Serwis FCM obsługujący nowy token i wiadomość data/notification.
class AppFirebaseMessagingService : FirebaseMessagingService() {
    override fun onNewToken(token: String) {
        super.onNewToken(token)
        // TODO: send token to backend
    }

    override fun onMessageReceived(message: RemoteMessage) {
        super.onMessageReceived(message)
        showNotification(message.notification?.title ?: "MobileHub", message.notification?.body ?: "Nowa wiadomość")
    }
}
```

### Production-ready variant

```kotlin
// Wersja produkcyjna: idempotentna rejestracja tokenu + deduplikacja eventów.
suspend fun syncPushToken(token: String, api: DeviceApi) {
    api.registerDeviceToken(
        DeviceTokenPayload(token = token, platform = "android", appVersion = BuildConfig.VERSION_NAME)
    )
}
```
