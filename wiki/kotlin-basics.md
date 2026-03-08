# Kotlin — Podstawy Języka

Kotlin to statycznie typowany, wieloparadygmatyczny język programowania tworzony przez JetBrains. Kompiluje się do JVM bytecode (Android), JavaScript i natywnego kodu maszynowego (KMP/iOS). Google ogłosił go oficjalnym językiem Android w 2017 roku.

## Typy, zmienne i system typów

```kotlin
// Wnioskowanie typów — kompilator sam określa typ
val name = "Marek"                // String (stała — val = value, immutable)
var score = 0                     // Int (zmienna — var = variable, mutable)
val pi: Double = 3.14159          // jawna deklaracja

// Nullable types — null safety wbudowany w system typów
var email: String? = null         // ? = może być null
val upper = email?.uppercase()    // safe call — zwróci null jeśli email == null
val display = email ?: "brak"     // Elvis operator — wartość domyślna gdy null
val forced = email!!.length       // non-null assertion — rzuci NullPointerException!

// Sprawdzanie typu i smart cast
fun describe(obj: Any) {
    when (obj) {
        is String -> println("String: ${obj.uppercase()}")  // smart cast do String
        is Int    -> println("Int: ${obj * 2}")             // smart cast do Int
        is List<*> -> println("Lista: ${obj.size} elementów")
        else      -> println("Nieznany typ")
    }
}
```

## Data classes — klasy danych

```kotlin
data class User(
    val id: Int,
    val name: String,
    val email: String,
    val role: UserRole = UserRole.BASIC,
    val createdAt: Long = System.currentTimeMillis()
)

enum class UserRole { BASIC, ADMIN, MODERATOR }

// data class automatycznie generuje:
// equals(), hashCode(), toString(), copy(), componentN()
val user = User(1, "Anna Kowalska", "anna@example.com")
println(user)  // User(id=1, name=Anna Kowalska, email=anna@example.com, ...)

// copy() — tworzenie zmodyfikowanej kopii (immutable pattern)
val admin = user.copy(role = UserRole.ADMIN, name = "Anna K.")
// user pozostaje niezmieniony!

// Destrukturyzacja
val (id, name, email) = user
println("$id: $name ($email)")
```

## Funkcje i wyrażenia lambda

```kotlin
// Funkcje z wartościami domyślnymi
fun greet(name: String, greeting: String = "Cześć", exclaim: Boolean = false): String {
    val suffix = if (exclaim) "!" else "."
    return "$greeting, $name$suffix"
}

greet("Anna")                          // "Cześć, Anna."
greet("Jan", greeting = "Dzień dobry") // nazwane argumenty
greet("Ola", exclaim = true)           // "Cześć, Ola!"

// Funkcje jednowyrażeniowe
fun square(x: Int) = x * x
fun isEven(n: Int) = n % 2 == 0

// Lambda i funkcje wyższego rzędu
val numbers = (1..10).toList()
val evenSquares = numbers
    .filter { it % 2 == 0 }        // [2, 4, 6, 8, 10]
    .map { it * it }                // [4, 16, 36, 64, 100]
    .take(3)                        // [4, 16, 36]
    .sumOf { it.toLong() }          // 56L

// Własna funkcja wyższego rzędu
fun <T, R> transform(list: List<T>, transform: (T) -> R): List<R> =
    list.map(transform)

val names = transform(listOf(1, 2, 3)) { "item_$it" }  // ["item_1", "item_2", "item_3"]
```

## Sealed classes — modelowanie stanów

```kotlin
// Sealed class = ograniczona hierarchia typów
// Idealny do modelowania wyników operacji i stanów UI
sealed class Result<out T> {
    data class Success<T>(val data: T) : Result<T>()
    data class Error(val message: String, val cause: Throwable? = null) : Result<Nothing>()
    object Loading : Result<Nothing>()

    val isSuccess get() = this is Success
    fun getOrNull() = if (this is Success) data else null
}

sealed class UiState<out T> {
    object Idle : UiState<Nothing>()
    object Loading : UiState<Nothing>()
    data class Success<T>(val data: T) : UiState<T>()
    data class Error(val message: String) : UiState<Nothing>()
}

// when jest exhaustive na sealed class — kompilator wymusza wszystkie przypadki
fun <T> render(state: UiState<T>) = when (state) {
    is UiState.Idle    -> showEmpty()
    is UiState.Loading -> showSpinner()
    is UiState.Success -> showData(state.data)
    is UiState.Error   -> showError(state.message)
}
```

## Coroutines — asynchroniczność

```kotlin
// Coroutines = "lekkie wątki" — setki tysięcy coroutines bez problemów z pamięcią
// Kluczowe pojęcia:
//  - suspend fun = funkcja zawieszalna (może pauzować bez blokowania wątku)
//  - CoroutineScope = zakres życia coroutine
//  - Dispatcher = na którym wątku działa (IO, Main, Default)

// Dispatchers:
// Main         — wątek UI
// IO           — I/O (sieć, baza danych, pliki) — do 64 wątki
// Default      — CPU-intensywne obliczenia — tylu wątków ile rdzeni
// Unconfined   — nie przełącza wątku (rzadko używany)

suspend fun fetchUserData(userId: String): UserProfile {
    // withContext przełącza na inny dispatcher bez blokowania
    return withContext(Dispatchers.IO) {
        val user = userApi.getUser(userId)         // operacja sieciowa
        val posts = postsApi.getUserPosts(userId)  // kolejna operacja sieciowa
        UserProfile(user, posts)
    }
}

// Równoległe wykonanie (async/await)
suspend fun fetchDashboardData(): DashboardData {
    return coroutineScope {
        val userDeferred = async { userRepository.getCurrentUser() }
        val newsDeferred = async { newsRepository.getLatestNews() }
        val statsDeferred = async { statsRepository.getUserStats() }

        // Wszystkie trzy requesty wykonują się równolegle!
        DashboardData(
            user = userDeferred.await(),
            news = newsDeferred.await(),
            stats = statsDeferred.await()
        )
    }
}

// Flow — strumień danych asynchronicznych
fun getTemperatureStream(): Flow<Float> = flow {
    while (true) {
        emit(readTemperatureFromSensor())
        delay(1000)  // co sekundę
    }
}.flowOn(Dispatchers.IO)  // produkcja na IO, konsumpcja na wywołującym

// viewModelScope — automatycznie anuluje coroutines gdy ViewModel jest niszczony
class WeatherViewModel : ViewModel() {
    val temperature = getTemperatureStream()
        .stateIn(viewModelScope, SharingStarted.WhileSubscribed(5000), 0f)
}
```

## Extension functions — rozszerzanie klas

```kotlin
// Dodawanie metod do istniejących klas bez dziedziczenia
fun String.toSlug(): String =
    lowercase()
        .replace(Regex("[^a-z0-9\\s-]"), "")
        .trim()
        .replace(Regex("\\s+"), "-")

fun Int.dpToPx(context: Context): Int =
    (this * context.resources.displayMetrics.density + 0.5f).toInt()

fun <T> List<T>.secondOrNull(): T? = if (size >= 2) this[1] else null

fun View.show() { visibility = View.VISIBLE }
fun View.hide() { visibility = View.GONE }
fun View.invisible() { visibility = View.INVISIBLE }

// Użycie
"Kotlin jest świetny!".toSlug()   // "kotlin-jest-swietny"
16.dpToPx(context)                // np. 48 px na xhdpi
```

## Scope functions — let, run, with, apply, also

```kotlin
// let — transformacja obiektu, null-safety
val result = possiblyNullValue?.let { value ->
    processValue(value)  // wywoływane tylko gdy nie-null
}

// apply — konfiguracja obiektu, zwraca this
val dialog = AlertDialog.Builder(context).apply {
    setTitle("Potwierdź")
    setMessage("Czy chcesz usunąć ten element?")
    setPositiveButton("Usuń") { _, _ -> deleteItem() }
    setNegativeButton("Anuluj", null)
}.create()

// run — blok obliczeń, zwraca ostatnie wyrażenie
val formattedAddress = address.run {
    "${street.trim()}, ${city.uppercase()}, $postalCode"
}

// also — efekty uboczne, zwraca this (dobre do logowania)
val user = createUser(name, email)
    .also { Log.d("Auth", "Created user: ${it.id}") }
    .also { analytics.trackUserCreated(it.id) }
```

## Linki

- [Kotlin Docs](https://kotlinlang.org/docs/home.html)
- [Kotlin Koans — interaktywne ćwiczenia](https://kotlinlang.org/docs/koans.html)
- [Kotlin Playground](https://play.kotlinlang.org)
- [Coroutines Guide](https://kotlinlang.org/docs/coroutines-guide.html)
