# Sieć i REST API w Android

Większość współczesnych aplikacji mobilnych komunikuje się z backendem: pobiera listy danych, wysyła formularze, synchronizuje stan użytkownika, przesyła pliki lub reaguje na zdarzenia w czasie rzeczywistym. W Androidzie kod sieciowy musi być wykonywany poza głównym wątkiem UI. W praktyce najczęściej łączy się `Retrofit`, `OkHttp`, korutyny, architekturę warstwową oraz dobrze zaprojektowaną obsługę błędów.

Dokumentacja Android Developers podkreśla, że operacje sieciowe należy wykonywać poza wątkiem głównym, stosować bezpieczne połączenia, rozdzielać warstwy odpowiedzialności i prezentować użytkownikowi czytelne stany ładowania oraz błędów. Google rekomenduje też wzorzec z warstwą danych, repozytorium i `ViewModel`, który porządkuje komunikację z API i upraszcza testowanie. Dla stronicowania oficjalnym rozwiązaniem Jetpack jest biblioteka Paging 3, a dla ochrony żądań i aplikacji w ekosystemie Google Play stosuje się m.in. Play Integrity API. citeturn0search0turn1search1turn0search3

## Dlaczego nie wolno wykonywać żądań w wątku UI

Główny wątek aplikacji obsługuje:
- rysowanie interfejsu,
- kliknięcia użytkownika,
- animacje,
- przejścia między ekranami.

Jeżeli w tym samym wątku wykonamy długie żądanie HTTP, aplikacja zacznie się zacinać, a w skrajnym przypadku może zgłosić ANR (`Application Not Responding`). Dlatego:
- żądania HTTP uruchamiamy w korutynach,
- logikę sieciową izolujemy w warstwie danych,
- do UI przekazujemy wynik w postaci stanu, np. `Loading`, `Success`, `Error`.

## Podstawowe elementy stosu sieciowego

Najczęściej stosowany układ wygląda tak:

```text
UI (Compose / Fragment)
        ↓
ViewModel
        ↓
Repository
        ↓
Remote data source / Retrofit API
        ↓
OkHttpClient
        ↓
REST API / GraphQL / WebSocket
```

Podział odpowiedzialności:
- **UI** prezentuje dane i reaguje na akcje użytkownika.
- **ViewModel** przechowuje stan ekranu i uruchamia przypadki użycia.
- **Repository** decyduje, skąd pobrać dane: z sieci, pamięci podręcznej lub bazy lokalnej.
- **Remote data source** zna szczegóły HTTP i mapowanie odpowiedzi.
- **OkHttp** zarządza połączeniami, timeoutami, interceptorami, cache i TLS.

## Retrofit — klient HTTP oparty o interfejsy

Retrofit upraszcza definiowanie endpointów HTTP. Zamiast ręcznie budować żądania, opisujemy API jako interfejs Kotlin.

### Przykład modeli odpowiedzi

```kotlin
data class PokemonDto(
    val id: Int,
    val name: String,
    val height: Int,
    val weight: Int,
    val sprites: SpritesDto
)

data class SpritesDto(
    @SerializedName("front_default")
    val frontDefault: String?
)

data class PokemonListResponse(
    val count: Int,
    val next: String?,
    val previous: String?,
    val results: List<PokemonListItemDto>
)

data class PokemonListItemDto(
    val name: String,
    val url: String
)
```

Warto zwrócić uwagę na sufiks `Dto` (`Data Transfer Object`). To dobra praktyka architektoniczna: model odpowiedzi z API nie musi być tym samym, co model domenowy lub model UI.

### Definicja interfejsu API

```kotlin
interface PokemonApi {
    @GET("pokemon/{name}")
    suspend fun getPokemon(
        @Path("name") name: String
    ): PokemonDto

    @GET("pokemon")
    suspend fun getPokemonList(
        @Query("limit") limit: Int = 20,
        @Query("offset") offset: Int = 0
    ): PokemonListResponse
}
```

### Konfiguracja klienta

```kotlin
object NetworkModule {

    private val loggingInterceptor = HttpLoggingInterceptor().apply {
        level = if (BuildConfig.DEBUG) {
            HttpLoggingInterceptor.Level.BODY
        } else {
            HttpLoggingInterceptor.Level.NONE
        }
    }

    private val okHttpClient = OkHttpClient.Builder()
        .connectTimeout(15, TimeUnit.SECONDS)
        .readTimeout(30, TimeUnit.SECONDS)
        .writeTimeout(30, TimeUnit.SECONDS)
        .addInterceptor(loggingInterceptor)
        .build()

    private val retrofit = Retrofit.Builder()
        .baseUrl("https://pokeapi.co/api/v2/")
        .client(okHttpClient)
        .addConverterFactory(GsonConverterFactory.create())
        .build()

    val api: PokemonApi = retrofit.create(PokemonApi::class.java)
}
```

### Ważne zasady projektowe

1. `baseUrl()` w Retrofit musi kończyć się ukośnikiem `/`.
2. Logowanie pełnych treści żądań i odpowiedzi w produkcji jest ryzykowne.
3. Klienta HTTP zwykle tworzy się raz i wstrzykuje przez DI.
4. Modele DTO warto mapować na modele domenowe, aby uniezależnić aplikację od formatu backendu.

## Repozytorium i mapowanie danych

Dobrą praktyką jest oddzielenie odpowiedzi sieciowej od obiektów używanych w aplikacji.

```kotlin
data class Pokemon(
    val id: Int,
    val name: String,
    val imageUrl: String?,
    val weightKg: Double
)

fun PokemonDto.toDomain(): Pokemon {
    return Pokemon(
        id = id,
        name = name.replaceFirstChar { it.uppercase() },
        imageUrl = sprites.frontDefault,
        weightKg = weight / 10.0
    )
}

class PokemonRepository(
    private val api: PokemonApi,
    private val dispatcher: CoroutineDispatcher = Dispatchers.IO
) {
    suspend fun getPokemon(name: String): Result<Pokemon> = withContext(dispatcher) {
        runCatching {
            api.getPokemon(name).toDomain()
        }
    }
}
```

Korzyści z mapowania:
- backend może zmienić nazwę pól bez rozbijania warstwy UI,
- łatwiej testować logikę,
- można przeliczać i normalizować dane w jednym miejscu,
- modele UI pozostają prostsze.

## Obsługa błędów sieciowych

W aplikacji mobilnej nie wolno traktować każdego błędu jednakowo. Użytkownik powinien otrzymać komunikat adekwatny do sytuacji.

Typowe kategorie błędów:
- brak internetu,
- timeout,
- błąd klienta 4xx,
- błąd serwera 5xx,
- niepoprawne dane odpowiedzi,
- błąd autoryzacji,
- anulowanie żądania.

### Przykład typu wyniku

```kotlin
sealed interface NetworkResult<out T> {
    data class Success<T>(val data: T) : NetworkResult<T>
    data class HttpError(val code: Int, val message: String?) : NetworkResult<Nothing>
    data class NetworkError(val message: String) : NetworkResult<Nothing>
    data class UnknownError(val throwable: Throwable) : NetworkResult<Nothing>
    object Loading : NetworkResult<Nothing>
}

suspend fun <T> safeApiCall(block: suspend () -> T): NetworkResult<T> {
    return try {
        NetworkResult.Success(block())
    } catch (e: HttpException) {
        NetworkResult.HttpError(e.code(), e.message())
    } catch (e: IOException) {
        NetworkResult.NetworkError("Brak połączenia lub problem z siecią")
    } catch (e: CancellationException) {
        throw e
    } catch (e: Exception) {
        NetworkResult.UnknownError(e)
    }
}
```

### Dlaczego `CancellationException` należy przepuścić dalej

Korutyny używają anulowania do zatrzymywania pracy, np. gdy ekran znika. Przechwycenie anulowania jako zwykłego błędu prowadzi do niepoprawnego zachowania i wycieków logiki. To częsty błąd początkujących.

## Praca ze stanem w ViewModel

```kotlin
data class PokemonUiState(
    val isLoading: Boolean = false,
    val pokemon: Pokemon? = null,
    val errorMessage: String? = null
)

class PokemonViewModel(
    private val repository: PokemonRepository
) : ViewModel() {

    private val _uiState = MutableStateFlow(PokemonUiState())
    val uiState: StateFlow<PokemonUiState> = _uiState

    fun loadPokemon(name: String) {
        viewModelScope.launch {
            _uiState.value = PokemonUiState(isLoading = true)

            when (val result = safeApiCall { repository.getPokemon(name).getOrThrow() }) {
                is NetworkResult.Success -> {
                    _uiState.value = PokemonUiState(pokemon = result.data)
                }
                is NetworkResult.HttpError -> {
                    _uiState.value = PokemonUiState(errorMessage = "Błąd HTTP: ${result.code}")
                }
                is NetworkResult.NetworkError -> {
                    _uiState.value = PokemonUiState(errorMessage = result.message)
                }
                is NetworkResult.UnknownError -> {
                    _uiState.value = PokemonUiState(errorMessage = "Nieoczekiwany błąd")
                }
                NetworkResult.Loading -> Unit
            }
        }
    }
}
```

Dla studentów ważne jest rozróżnienie:
- **stan domenowy**: dane biznesowe,
- **stan UI**: wszystko, czego ekran potrzebuje do renderowania,
- **jednorazowe zdarzenia**: np. toast, snackbar, nawigacja.

## Interceptory i Authenticator w OkHttp

OkHttp pozwala modyfikować i obserwować żądania oraz odpowiedzi.

### Interceptor autoryzacji

```kotlin
class AuthInterceptor(
    private val tokenProvider: TokenProvider
) : Interceptor {

    override fun intercept(chain: Interceptor.Chain): Response {
        val token = tokenProvider.getAccessToken()
        val request = chain.request().newBuilder()
            .apply {
                if (!token.isNullOrBlank()) {
                    header("Authorization", "Bearer $token")
                }
            }
            .build()

        return chain.proceed(request)
    }
}
```

### Authenticator do odświeżania tokenu po 401

```kotlin
class TokenAuthenticator(
    private val authRepository: AuthRepository
) : Authenticator {

    override fun authenticate(route: Route?, response: Response): Request? {
        if (response.code != 401) return null

        val refreshedToken = runBlocking {
            authRepository.refreshAccessToken()
        } ?: return null

        return response.request.newBuilder()
            .header("Authorization", "Bearer ${refreshedToken.accessToken}")
            .build()
    }
}
```

### Uwaga praktyczna

Prosty interceptor typu retry, który bezrefleksyjnie ponawia każde nieudane żądanie, jest niebezpieczny. Może:
- wielokrotnie wysłać `POST`,
- pogorszyć przeciążenie backendu,
- ukrywać realne błędy aplikacji.

Ponowienie należy stosować selektywnie, z limitem prób, najlepiej dla operacji idempotentnych i z mechanizmem backoff.

## Caching HTTP i pamięć podręczna

Nie każde pobranie danych musi iść do internetu. OkHttp wspiera cache zgodny z nagłówkami HTTP.

```kotlin
val cacheSize = 10L * 1024L * 1024L // 10 MB
val cache = Cache(File(context.cacheDir, "http_cache"), cacheSize)

val client = OkHttpClient.Builder()
    .cache(cache)
    .build()
```

Aby cache działał efektywnie, serwer powinien zwracać poprawne nagłówki, np. `Cache-Control`, `ETag`, `Last-Modified`.

W praktyce w aplikacjach mobilnych często łączy się:
- **cache HTTP** dla krótkotrwałych odpowiedzi,
- **Room** dla trwałej pamięci offline,
- **repozytorium** decydujące, czy odświeżać dane z sieci.

## Bezpieczeństwo komunikacji

Android Developers zaleca stosowanie bezpiecznych połączeń, ochrony danych i odpowiedzialnego używania kryptografii. W praktyce oznacza to przede wszystkim używanie HTTPS, ograniczanie zaufania do nieznanych certyfikatów oraz niewysyłanie danych wrażliwych w logach. W przypadku danych krytycznych warto oprzeć ochronę o Android Keystore i mechanizmy kryptograficzne platformy. citeturn0search0turn1search12

Podstawowe zasady:
- używaj HTTPS,
- nie loguj tokenów, haseł i danych osobowych,
- nie trzymaj sekretów na stałe w kodzie,
- ogranicz ruch cleartext przez `networkSecurityConfig`,
- stosuj krótkie timeouty i czytelne komunikaty błędów.

### Przykład `network_security_config.xml`

```xml
<?xml version="1.0" encoding="utf-8"?>
<network-security-config>
    <base-config cleartextTrafficPermitted="false" />
</network-security-config>
```

## Upload plików

Aplikacje mobilne często wysyłają zdjęcia, dokumenty lub logi diagnostyczne.

```kotlin
interface FileApi {
    @Multipart
    @POST("upload")
    suspend fun uploadAvatar(
        @Part file: MultipartBody.Part
    ): UploadResponse
}

fun createImagePart(file: File): MultipartBody.Part {
    val requestBody = file.asRequestBody("image/jpeg".toMediaType())
    return MultipartBody.Part.createFormData(
        name = "file",
        filename = file.name,
        body = requestBody
    )
}
```

Dobre praktyki:
- kompresuj duże obrazy przed wysłaniem,
- pokazuj progres,
- uwzględnij anulowanie,
- sprawdzaj rozmiar i typ MIME,
- nie wysyłaj pełnych plików w głównym wątku.

## Paging 3 — stronicowanie danych

Paging 3 jest oficjalnym rozwiązaniem Jetpack do stopniowego ładowania dużych zbiorów danych. Dokumentacja Android Developers rekomenduje je do scenariuszy, w których pełna lista jest zbyt duża dla pojedynczego pobrania, a także opisuje `RemoteMediator` jako rozwiązanie dla połączenia sieci i bazy lokalnej. citeturn1search1turn1search17

### Przykład `PagingSource`

```kotlin
class PokemonPagingSource(
    private val api: PokemonApi
) : PagingSource<Int, PokemonListItemDto>() {

    override suspend fun load(params: LoadParams<Int>): LoadResult<Int, PokemonListItemDto> {
        val offset = params.key ?: 0

        return try {
            val response = api.getPokemonList(
                limit = params.loadSize,
                offset = offset
            )

            LoadResult.Page(
                data = response.results,
                prevKey = if (offset == 0) null else maxOf(offset - params.loadSize, 0),
                nextKey = if (response.next == null) null else offset + response.results.size
            )
        } catch (e: IOException) {
            LoadResult.Error(e)
        } catch (e: HttpException) {
            LoadResult.Error(e)
        }
    }

    override fun getRefreshKey(state: PagingState<Int, PokemonListItemDto>): Int? {
        val anchorPosition = state.anchorPosition ?: return null
        val anchorPage = state.closestPageToPosition(anchorPosition) ?: return null
        return anchorPage.prevKey?.plus(state.config.pageSize)
            ?: anchorPage.nextKey?.minus(state.config.pageSize)
    }
}
```

### Konfiguracja pagera

```kotlin
class PokemonRepository(
    private val api: PokemonApi
) {
    fun getPagedPokemon(): Flow<PagingData<PokemonListItemDto>> {
        return Pager(
            config = PagingConfig(
                pageSize = 20,
                prefetchDistance = 5,
                enablePlaceholders = false
            ),
            pagingSourceFactory = { PokemonPagingSource(api) }
        ).flow
    }
}
```

### Typowe błędy studentów

- mylenie `offset` z numerem strony,
- nieuwzględnienie `getRefreshKey()`,
- brak mapowania DTO na model UI,
- brak reakcji na `LoadState.Error`,
- pobieranie danych tylko z sieci bez cache offline.

## GraphQL z Apollo Kotlin

Apollo Kotlin jest dojrzałym klientem GraphQL dla Androida i Kotlin Multiplatform. Aktualna dokumentacja Apollo koncentruje się już na linii Apollo Kotlin 4, więc podawanie w materiałach wyłącznie zależności z serii 3.x jest dziś zbyt zachowawcze. citeturn1search2turn1search6

### Koncepcja GraphQL

W REST często pobieramy gotowe endpointy, np. `/users/1` lub `/posts?page=2`. W GraphQL klient deklaruje dokładnie, jakie pola chce pobrać.

Zalety:
- mniej nadmiarowych danych,
- silne typowanie po stronie klienta,
- wygodne łączenie danych z wielu zasobów.

Wady:
- większa złożoność serwera,
- potrzeba kontroli kosztu zapytań,
- dodatkowa konfiguracja schematu i generowania kodu.

### Przykład użycia

```kotlin
val apolloClient = ApolloClient.Builder()
    .serverUrl("https://api.example.com/graphql")
    .addHttpHeader("Authorization", "Bearer $token")
    .build()

suspend fun loadUser(userId: String) {
    val response = apolloClient.query(GetUserQuery(id = userId)).execute()

    response.data?.user?.let { user ->
        Log.d("GraphQL", "${user.name} - ${user.email}")
    }

    response.errors?.forEach { error ->
        Log.e("GraphQL", error.message)
    }
}
```

## Praktyczny przykład: ekran listy produktów

Załóżmy, że tworzymy ekran sklepu internetowego.

Wymagania:
- pobranie listy produktów,
- paginacja,
- filtr po kategorii,
- obsługa braku internetu,
- cache lokalny.

Możliwa architektura:
1. `ProductApi` pobiera dane z backendu.
2. `ProductRepository` decyduje, czy pobrać nowe dane.
3. `Room` przechowuje ostatnio zsynchronizowane rekordy.
4. `RemoteMediator` łączy sieć i bazę.
5. `ViewModel` udostępnia `Flow<PagingData<ProductUiModel>>`.
6. UI obserwuje `loadState` i pokazuje spinner, błąd lub listę.

To rozwiązanie jest skalowalne i dobrze odpowiada wymaganiom realnych aplikacji produkcyjnych.

## Testowanie warstwy sieciowej

Kod sieciowy należy testować na kilku poziomach:

### 1. Test mapowania DTO → domena

```kotlin
@Test
fun `toDomain maps dto correctly`() {
    val dto = PokemonDto(
        id = 25,
        name = "pikachu",
        height = 4,
        weight = 60,
        sprites = SpritesDto(frontDefault = "url")
    )

    val domain = dto.toDomain()

    assertEquals(25, domain.id)
    assertEquals("Pikachu", domain.name)
    assertEquals(6.0, domain.weightKg, 0.0)
}
```

### 2. Test repozytorium z fałszywym API

```kotlin
class FakePokemonApi : PokemonApi {
    override suspend fun getPokemon(name: String): PokemonDto {
        return PokemonDto(25, "pikachu", 4, 60, SpritesDto("url"))
    }

    override suspend fun getPokemonList(limit: Int, offset: Int): PokemonListResponse {
        return PokemonListResponse(1, null, null, listOf(PokemonListItemDto("pikachu", "url")))
    }
}
```

### 3. Testy integracyjne z `MockWebServer`

To dobra technika do sprawdzania:
- kodów odpowiedzi,
- parsowania JSON,
- nagłówków,
- timeoutów,
- błędów backendu.

## Dobre praktyki podsumowujące

1. Trzymaj kod sieciowy poza warstwą UI.
2. Oddzielaj DTO, model domenowy i model UI.
3. Obsługuj kategorie błędów osobno.
4. Nie loguj danych wrażliwych.
5. Pamiętaj o anulowaniu korutyn.
6. Używaj Paging 3 dla dużych list.
7. W scenariuszach offline-first łącz sieć z bazą lokalną.
8. Testuj mapowanie, repozytoria i zachowanie klienta HTTP.

## Pytania kontrolne

1. Dlaczego operacje sieciowe nie mogą działać w głównym wątku UI?
2. Czym różni się DTO od modelu domenowego?
3. Kiedy warto użyć `Authenticator`, a kiedy zwykłego `Interceptor`?
4. Dlaczego nie należy bezrefleksyjnie ponawiać wszystkich żądań HTTP?
5. Jaką rolę pełni `getRefreshKey()` w Paging 3?
6. Jakie są zalety połączenia sieci, Room i `RemoteMediator`?
7. Dlaczego `CancellationException` nie powinien być traktowany jak zwykły błąd?

## Ćwiczenia

### Ćwiczenie 1 — podstawowy klient REST

Zaimplementuj ekran wyszukujący Pokémona po nazwie. Aplikacja ma:
- pobrać dane z API,
- pokazać spinner podczas ładowania,
- wyświetlić komunikat błędu przy braku internetu,
- po sukcesie pokazać nazwę, identyfikator i obrazek.

### Ćwiczenie 2 — refaktoryzacja architektury

Masz kod, w którym `Activity` bezpośrednio wywołuje Retrofit. Przepisz go tak, aby:
- dodać `Repository`,
- dodać `ViewModel`,
- wprowadzić `UiState`,
- odseparować DTO od modelu UI.

### Ćwiczenie 3 — uwierzytelnianie

Dodaj do aplikacji:
- `AuthInterceptor`,
- `Authenticator` odświeżający token po 401,
- przechowywanie tokenu w bezpieczny sposób,
- blokadę logowania tokenu w buildzie release.

### Ćwiczenie 4 — paginacja

Zaimplementuj listę elementów z Paging 3. Wersja minimalna ma:
- pobierać dane stronicowane,
- reagować na `LoadState.Loading`, `LoadState.Error`, `LoadState.NotLoading`,
- pozwalać użytkownikowi na ponowienie żądania.

### Ćwiczenie 5 — testy

Napisz:
- test mapowania DTO,
- test repozytorium z fałszywym API,
- test Retrofit z `MockWebServer`,
- test ViewModel sprawdzający zmianę `UiState`.

## Zadanie projektowe

Zaprojektuj miniaplikację „Katalog filmów”. Wymagania:
- lista filmów pobierana z sieci,
- szczegóły filmu po kliknięciu,
- paginacja listy,
- obsługa stanu offline,
- lokalna baza ulubionych filmów,
- token autoryzacyjny do prywatnych endpointów,
- testy mapowania i repozytorium.

Oddawany projekt powinien zawierać diagram warstw, opis przepływu danych i uzasadnienie wyboru bibliotek.

## Linki

- [Network operations on Android](https://developer.android.com/develop/connectivity/network-ops/connecting)
- [Paging 3 overview](https://developer.android.com/topic/libraries/architecture/paging/v3-overview)
- [LoadState in Paging](https://developer.android.com/topic/libraries/architecture/paging/load-state)
- [Retrofit](https://square.github.io/retrofit/)
- [OkHttp](https://square.github.io/okhttp/)
- [Apollo Kotlin](https://www.apollographql.com/docs/kotlin)
