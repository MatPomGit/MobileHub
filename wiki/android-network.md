# Sieć i REST API w Android

Większość aplikacji mobilnych pobiera dane z sieci. Android wymaga, by operacje sieciowe odbywały się poza głównym wątkiem UI — stąd wykorzystanie coroutines.

## Retrofit — klient HTTP

```kotlin
// 1. Model odpowiedzi
data class Pokemon(
    val id: Int,
    val name: String,
    val height: Int,
    val weight: Int,
    val sprites: Sprites
)
data class Sprites(
    @SerializedName("front_default") val frontDefault: String?
)

// 2. Interface API
interface PokemonApi {
    @GET("pokemon/{name}")
    suspend fun getPokemon(@Path("name") name: String): Pokemon

    @GET("pokemon")
    suspend fun getList(
        @Query("limit") limit: Int = 20,
        @Query("offset") offset: Int = 0
    ): PokemonListResponse
}

// 3. Konfiguracja Retrofit
object NetworkModule {
    val retrofit: Retrofit = Retrofit.Builder()
        .baseUrl("https://pokeapi.co/api/v2/")
        .addConverterFactory(GsonConverterFactory.create())
        .client(
            OkHttpClient.Builder()
                .connectTimeout(30, TimeUnit.SECONDS)
                .addInterceptor(HttpLoggingInterceptor().apply {
                    level = HttpLoggingInterceptor.Level.BODY
                })
                .build()
        )
        .build()

    val api: PokemonApi = retrofit.create(PokemonApi::class.java)
}
```

## Obsługa błędów sieciowych

```kotlin
sealed class NetworkResult<out T> {
    data class Success<T>(val data: T) : NetworkResult<T>()
    data class Error(val code: Int, val message: String) : NetworkResult<Nothing>()
    object Loading : NetworkResult<Nothing>()
}

suspend fun <T> safeApiCall(call: suspend () -> T): NetworkResult<T> {
    return try {
        NetworkResult.Success(call())
    } catch (e: HttpException) {
        NetworkResult.Error(e.code(), e.message())
    } catch (e: IOException) {
        NetworkResult.Error(-1, "Brak połączenia z siecią")
    }
}

// Użycie
val result = safeApiCall { api.getPokemon("pikachu") }
when (result) {
    is NetworkResult.Success -> showPokemon(result.data)
    is NetworkResult.Error -> showError(result.message)
    is NetworkResult.Loading -> showSpinner()
}
```

## Interceptory OkHttp

```kotlin
// Interceptor autoryzacji — dodaje token do każdego żądania
class AuthInterceptor(private val tokenProvider: TokenProvider) : Interceptor {
    override fun intercept(chain: Interceptor.Chain): Response {
        val original = chain.request()
        val token = tokenProvider.getToken()

        val authenticated = original.newBuilder()
            .header("Authorization", "Bearer $token")
            .build()

        return chain.proceed(authenticated)
    }
}

// Interceptor retry
class RetryInterceptor(private val maxRetries: Int = 3) : Interceptor {
    override fun intercept(chain: Interceptor.Chain): Response {
        var retries = 0
        var response = chain.proceed(chain.request())

        while (!response.isSuccessful && retries < maxRetries) {
            retries++
            response = chain.proceed(chain.request())
        }
        return response
    }
}
```

## Coil — ładowanie obrazów

```kotlin
// Coil — lekka biblioteka obrazów, natywna dla Compose
dependencies {
    implementation("io.coil-kt:coil-compose:2.7.0")
}

AsyncImage(
    model = ImageRequest.Builder(LocalContext.current)
        .data("https://example.com/image.jpg")
        .crossfade(true)
        .placeholder(R.drawable.placeholder)
        .error(R.drawable.error)
        .build(),
    contentDescription = "Opis obrazu",
    contentScale = ContentScale.Crop,
    modifier = Modifier
        .size(80.dp)
        .clip(CircleShape)
)
```

## Paginacja — Paging 3

```kotlin
// PagingSource
class PokemonPagingSource(private val api: PokemonApi) : PagingSource<Int, Pokemon>() {
    override suspend fun load(params: LoadParams<Int>): LoadResult<Int, Pokemon> {
        val offset = params.key ?: 0
        return try {
            val response = api.getList(limit = params.loadSize, offset = offset)
            LoadResult.Page(
                data = response.results,
                prevKey = if (offset == 0) null else offset - params.loadSize,
                nextKey = if (response.next == null) null else offset + params.loadSize
            )
        } catch (e: Exception) {
            LoadResult.Error(e)
        }
    }
}
```

## Linki

- [Retrofit](https://square.github.io/retrofit/)
- [OkHttp](https://square.github.io/okhttp/)
- [Coil](https://coil-kt.github.io/coil/)
- [Paging 3](https://developer.android.com/topic/libraries/architecture/paging/v3-overview)

## OkHttp Interceptors — middleware sieciowe

```kotlin
// Interceptor logowania żądań i odpowiedzi
class LoggingInterceptor : Interceptor {
    override fun intercept(chain: Interceptor.Chain): Response {
        val request = chain.request()
        val startTime = System.nanoTime()

        Log.d("HTTP", "→ ${request.method} ${request.url}")
        request.body?.let { body ->
            val buffer = Buffer()
            body.writeTo(buffer)
            Log.d("HTTP", "  Body: ${buffer.readUtf8().take(500)}")
        }

        val response = chain.proceed(request)
        val elapsed = (System.nanoTime() - startTime) / 1e6

        Log.d("HTTP", "← ${response.code} ${response.message} (${elapsed.toInt()}ms)")
        return response
    }
}

// Interceptor dodający nagłówki autoryzacji
class AuthInterceptor(private val tokenProvider: TokenProvider) : Interceptor {
    override fun intercept(chain: Interceptor.Chain): Response {
        val token = tokenProvider.getAccessToken()
        val request = chain.request().newBuilder()
            .header("Authorization", "Bearer $token")
            .header("Accept-Language", Locale.getDefault().language)
            .build()
        return chain.proceed(request)
    }
}

// Interceptor odświeżania tokenu (Authenticator)
class TokenAuthenticator(private val authRepository: AuthRepository) : Authenticator {
    override fun authenticate(route: Route?, response: Response): Request? {
        // 401 Unauthorized — spróbuj odświeżyć token
        if (response.code != 401) return null

        val newToken = runBlocking { authRepository.refreshToken() } ?: return null

        return response.request.newBuilder()
            .header("Authorization", "Bearer ${newToken.accessToken}")
            .build()
    }
}

// OkHttpClient z interceptorami
val client = OkHttpClient.Builder()
    .addInterceptor(AuthInterceptor(tokenProvider))
    .authenticator(TokenAuthenticator(authRepository))
    .addNetworkInterceptor(HttpLoggingInterceptor().apply {
        level = if (BuildConfig.DEBUG) HttpLoggingInterceptor.Level.BODY
                else HttpLoggingInterceptor.Level.NONE
    })
    .connectTimeout(15, TimeUnit.SECONDS)
    .readTimeout(30, TimeUnit.SECONDS)
    .writeTimeout(30, TimeUnit.SECONDS)
    .build()
```

## GraphQL z Apollo

```kotlin
dependencies {
    implementation("com.apollographql.apollo3:apollo-runtime:3.8.2")
}

// Query definiujesz w pliku .graphql
// src/main/graphql/GetUser.graphql:
// query GetUser($id: ID!) {
//   user(id: $id) {
//     id
//     name
//     email
//     posts { title createdAt }
//   }
// }

val apolloClient = ApolloClient.Builder()
    .serverUrl("https://api.example.com/graphql")
    .addHttpHeader("Authorization", "Bearer $token")
    .build()

// Użycie — wygenerowany typ bezpieczny
suspend fun loadUser(userId: String) {
    val response = apolloClient.query(GetUserQuery(id = userId)).execute()

    response.data?.user?.let { user ->
        println("${user.name}: ${user.posts.size} postów")
    }

    response.errors?.forEach { error ->
        Log.e("GraphQL", "Error: ${error.message}")
    }
}

// Subscription — live updates przez WebSocket
apolloClient.subscription(OnNewMessageSubscription(chatId = "123"))
    .toFlow()
    .collect { response ->
        response.data?.messageAdded?.let { message ->
            chatViewModel.addMessage(message)
        }
    }
```

## Linki dodatkowe

- [OkHttp Interceptors](https://square.github.io/okhttp/features/interceptors/)
- [Apollo GraphQL Android](https://www.apollographql.com/docs/kotlin)
- [Retrofit](https://square.github.io/retrofit/)
