# Architektura aplikacji Android - MVVM, warstwy aplikacji i praktyczne zasady projektowe

## Wprowadzenie

Ten materiał jest skierowany do studentów projektujących nowoczesne aplikacje Android. Jego celem jest pokazanie, jak podejmować decyzje architektoniczne świadomie, a nie mechanicznie kopiować modne wzorce. Dobra architektura nie polega na dodaniu kilku klas o efektownych nazwach, lecz na takim podziale odpowiedzialności, aby kod był przewidywalny, testowalny, łatwy do rozwijania i odporny na zmiany wymagań.

W ekosystemie Android najczęściej pracuje się dziś z architekturą warstwową, w której wyróżnia się:

- **UI layer** - warstwę interfejsu użytkownika,
- **data layer** - warstwę danych,
- **domain layer** - warstwę domenową, stosowaną opcjonalnie.

MVVM jest w praktyce jednym ze sposobów organizacji warstwy UI, najczęściej z użyciem `ViewModel`. Nie należy jednak utożsamiać całej architektury aplikacji wyłącznie z MVVM. W rzeczywistych projektach ważniejsze od samej nazwy wzorca są: właściwy przepływ danych, jasne granice odpowiedzialności oraz spójne modele danych.

## Cele kształcenia

Po zapoznaniu się z tym materiałem powinieneś:

1. rozumieć, po co stosuje się architekturę warstwową w Androidzie,
2. odróżniać odpowiedzialności warstwy UI, domenowej i danych,
3. wiedzieć, kiedy `ViewModel` jest właściwym miejscem dla logiki, a kiedy nie,
4. rozumieć różnicę między stanem a zdarzeniem jednorazowym,
5. umieć zaprojektować podstawową strukturę aplikacji zgodną z nowoczesnymi rekomendacjami Androida,
6. unikać typowych błędów architektonicznych spotykanych w projektach studenckich.

---

## 1. Dlaczego architektura ma znaczenie

Na początku kursu wielu studentów traktuje architekturę jako temat drugorzędny. Gdy aplikacja ma jeden ekran i kilka przycisków, nawet słabo zorganizowany kod może wydawać się wystarczający. Problem pojawia się później, gdy:

- liczba ekranów rośnie,
- dochodzi obsługa sieci i pamięci lokalnej,
- aplikacja zaczyna reagować na wiele stanów jednocześnie,
- potrzebne stają się testy,
- zespół musi rozwijać projekt przez dłuższy czas.

Wtedy okazuje się, że brak architektury nie jest „brakiem formalizmu”, lecz realnym kosztem technicznym. Kod staje się trudny do zrozumienia, trudny do poprawiania i podatny na błędy regresji.

### Dlaczego nie wystarczy „po prostu działa”?

Ponieważ w inżynierii oprogramowania ważne są nie tylko właściwości końcowego programu, ale także koszt jego utrzymania. Dwa programy mogą działać poprawnie z punktu widzenia użytkownika, ale jeden z nich będzie wielokrotnie łatwiejszy do rozwoju, testowania i refaktoryzacji.

### Czego oczekujemy od dobrej architektury?

Dobra architektura powinna zapewniać:

- **czytelność** - wiadomo, gdzie szukać konkretnej logiki,
- **separację odpowiedzialności** - warstwy nie mieszają swoich ról,
- **testowalność** - reguły biznesowe można weryfikować niezależnie od UI,
- **skalowalność** - łatwiej dodawać nowe funkcje,
- **odporność na zmiany** - zmiana jednego szczegółu nie destabilizuje całego systemu.

To właśnie dlatego architektura nie jest dodatkiem estetycznym, lecz mechanizmem redukującym złożoność systemu.

---

## 2. Architektura warstwowa w Androidzie

Najczęściej stosowany podział wygląda następująco. Poniższy diagram wizualizuje trzy główne warstwy aplikacji Android i ich zawartość. Zrozumienie granic między warstwami jest kluczowe - każda warstwa powinna komunikować się wyłącznie z warstwą bezpośrednio pod nią, co ogranicza sprzężenie i ułatwia testowanie poszczególnych części systemu w izolacji.

```text
┌─────────────────────────────────────────────┐
│ UI Layer                                    │
│ Composable / Fragment / Activity            │
│ + ViewModel / state holder                  │
├─────────────────────────────────────────────┤
│ Domain Layer (opcjonalna)                   │
│ Use cases, reguły biznesowe, orkiestracja   │
├─────────────────────────────────────────────┤
│ Data Layer                                  │
│ Repositories, local/remote data sources     │
│ Room, Retrofit, DataStore, pliki, BLE itd.  │
└─────────────────────────────────────────────┘
```

Ten podział nie istnieje po to, aby kod wyglądał bardziej profesjonalnie. Każda warstwa rozwiązuje inny problem.

### UI layer

Warstwa UI odpowiada za:

- prezentację danych,
- obsługę akcji użytkownika,
- renderowanie stanu ekranu,
- integrację z elementami Android framework.

### Domain layer

Warstwa domenowa odpowiada za:

- reguły biznesowe,
- operacje obejmujące wiele źródeł danych,
- logikę współdzieloną pomiędzy ekranami,
- uproszczenie komunikacji między UI a danymi.

Jest to warstwa **opcjonalna**. Nie każda aplikacja jej potrzebuje.

### Data layer

Warstwa danych odpowiada za:

- pobieranie danych z sieci,
- zapis i odczyt lokalny,
- synchronizację źródeł danych,
- mapowanie modeli,
- obsługę cache i polityki odświeżania.

### Dlaczego ten podział działa?

Ponieważ ogranicza sprzężenie. UI nie musi wiedzieć, czy dane pochodzą z Room, Retrofit czy pliku JSON. Repozytorium nie musi znać szczegółów nawigacji. Domena nie powinna zależeć od komponentów wizualnych. Dzięki temu każda część systemu może się zmieniać przy mniejszym wpływie na pozostałe.

---

## 3. MVVM w praktyce Androida

W projektach Androidowych MVVM najczęściej oznacza:

- **View** - Compose UI, Fragment lub Activity,
- **ViewModel** - stan ekranu i logika biznesowa związana z ekranem,
- **Model** - dane i operacje pochodzące z warstwy domenowej lub danych.

W środowisku Compose szczególnie ważne jest to, że UI ma charakter **deklaratywny**. Oznacza to, że interfejs nie powinien ręcznie synchronizować wielu pól widoku, lecz renderować się na podstawie bieżącego stanu.

### Dlaczego `ViewModel` jest tak istotny?

Ponieważ pozwala oddzielić logikę ekranu od samego renderowania. UI ma pokazywać stan. `ViewModel` ma ten stan przygotować.

W praktyce oznacza to, że:

- Composable nie powinien wykonywać logiki biznesowej,
- `ViewModel` nie powinien znać szczegółów widoku,
- stan powinien być wystawiany do UI w sposób obserwowalny.

---

## 4. UI layer - stan, logika UI i logika biznesowa

W warstwie UI warto rozróżnić trzy pojęcia:

1. **UI state** - dane potrzebne do narysowania ekranu,
2. **business logic** - decyzje wynikające z reguł aplikacji,
3. **UI behavior logic** - zachowania typowo interfejsowe, np. przewijanie listy, pokazanie Snackbara czy uruchomienie nawigacji.

To rozróżnienie jest ważne, ponieważ częstym błędem jest umieszczanie wszystkiego w `ViewModel`. W efekcie `ViewModel` staje się klasą, która próbuje kontrolować całe UI, zamiast być stanowym pośrednikiem między ekranem a logiką aplikacji.

### Przykład sensownego podziału odpowiedzialności

- kliknięcie przycisku „Zapisz” uruchamia walidację i zapis danych - **ViewModel / use case**,
- pokazanie Snackbara po sukcesie - zależnie od projektu: **UI logic** albo jednorazowy efekt z `ViewModel`,
- przewinięcie listy do błędnego pola formularza - zwykle **logika UI**, bo zależy od detali interfejsu.

### Dlaczego nie wszystko powinno trafiać do `ViewModel`?

Ponieważ część zachowań jest ściśle zależna od konkretnego sposobu renderowania UI. Jeżeli przeniesiesz je do warstwy logiki, kod stanie się bardziej złożony, a jednocześnie mniej elastyczny.

---

## 5. ViewModel - rola, zalety i ograniczenia

`ViewModel` pełni kilka ważnych funkcji:

- przechowuje stan ekranu,
- reaguje na akcje użytkownika,
- komunikuje się z use case'ami lub repozytoriami,
- przetrwa zmianę konfiguracji,
- oddziela logikę ekranu od klas UI.

### Czego `ViewModel` nie powinien robić?

`ViewModel` nie powinien:

- przechowywać `Activity`, `Fragment`, `NavController` ani `Context`, o ile nie jest to absolutnie konieczne,
- wykonywać zapytań HTTP bezpośrednio, jeśli w projekcie istnieje warstwa danych,
- znać szczegółów renderowania UI,
- pełnić roli globalnego magazynu stanu całej aplikacji.

### Przykład `ViewModel`

Poniższy przykład przedstawia kompletny `ViewModel` wstrzyknięty przez Hilt, który zarządza stanem ekranu listy zadań. Klasa wystawia stan ekranu jako `StateFlow` - publiczny, ale niemutowalny strumień - i reaguje na akcje użytkownika przez dedykowane metody. Taki wzorzec umożliwia warstwie UI odczytywanie stanu bez możliwości jego bezpośredniej modyfikacji, co jest kluczową zasadą jednokierunkowego przepływu danych.

```kotlin
@HiltViewModel
class TaskViewModel @Inject constructor(
    private val getTasksUseCase: GetTasksUseCase,
    private val addTaskUseCase: AddTaskUseCase
) : ViewModel() {

    private val _uiState = MutableStateFlow(TaskUiState())
    val uiState: StateFlow<TaskUiState> = _uiState.asStateFlow()

    init {
        observeTasks()
    }

    private fun observeTasks() {
        viewModelScope.launch {
            getTasksUseCase()
                .onStart {
                    _uiState.update { it.copy(isLoading = true, error = null) }
                }
                .catch { e ->
                    _uiState.update {
                        it.copy(isLoading = false, error = e.message ?: "Nieznany błąd")
                    }
                }
                .collect { tasks ->
                    _uiState.update {
                        it.copy(tasks = tasks, isLoading = false, error = null)
                    }
                }
        }
    }

    fun onAddTask(name: String) {
        if (name.isBlank()) {
            _uiState.update { it.copy(error = "Nazwa zadania nie może być pusta") }
            return
        }

        viewModelScope.launch {
            addTaskUseCase(name.trim())
        }
    }
}

data class TaskUiState(
    val tasks: List<TaskUiModel> = emptyList(),
    val isLoading: Boolean = false,
    val error: String? = null
)
```

### Dlaczego ten kod jest dobrą bazą dydaktyczną?

Ponieważ pokazuje kilka ważnych zasad jednocześnie:

- stan ekranu ma osobny model `TaskUiState`,
- modyfikowalny `MutableStateFlow` jest ukryty,
- UI widzi tylko `StateFlow`,
- walidacja wejścia jest wykonywana w logice ekranu,
- `ViewModel` nie zna szczegółów bazy danych ani warstwy sieciowej.

### Typowe błędy studentów

- trzymanie `Context` w `ViewModel`,
- wywoływanie API bezpośrednio z Composable,
- wystawianie `MutableStateFlow` publicznie,
- łączenie nawigacji, walidacji, zapisu, mapowania i telemetrii w jednej dużej klasie.

---

## 6. UDF - Unidirectional Data Flow

UDF, czyli **Unidirectional Data Flow**, oznacza jednokierunkowy przepływ danych. Poniższy diagram ilustruje cykl: akcja użytkownika trafia do `ViewModel`, który aktualizuje stan, a zmodyfikowany stan jest renderowany przez UI. Dzięki temu przepływ zawsze przebiega w jednym kierunku, co eliminuje trudne do wykrycia błędy wynikające z rozproszonych, nieskoordynowanych zmian stanu.

```text
akcja użytkownika -> ViewModel -> aktualizacja stanu -> render UI
```

### Dlaczego jest to korzystne?

Jednokierunkowy przepływ danych ogranicza chaos związany z rozproszonymi zmianami stanu. Jeżeli wiele elementów systemu modyfikuje ten sam stan w dowolnym miejscu, bardzo szybko pojawiają się trudne do wykrycia błędy, stany pośrednie i problemy z odtwarzaniem przebiegu zdarzeń.

UDF daje następujące korzyści:

- łatwiej zrozumieć, skąd wziął się dany stan,
- łatwiej testować ekran,
- łatwiej odtworzyć błędy,
- łatwiej zachować spójność między logiką a widokiem.

### Minimalistyczny ekran zgodny z UDF

Poniższy Composable demonstruje wzorcowy punkt wejścia warstwy UI w architekturze opartej na UDF. Funkcja przyjmuje gotowy stan ekranu i zestaw callbacków reprezentujących akcje użytkownika - nie zawiera żadnej logiki biznesowej ani bezpośrednich odwołań do danych. Taki podział sprawia, że Composable jest łatwy do testowania i podglądu w narzędziu Preview bez konieczności uruchamiania całej aplikacji.

```kotlin
@Composable
fun TaskScreen(
    uiState: TaskUiState,
    onAddTask: (String) -> Unit,
    onRefresh: () -> Unit
) {
    // renderowanie UI na podstawie uiState
}
```

Ten Composable nie przechowuje reguł biznesowych. Odbiera stan i emituje akcje. To dobry punkt wyjścia do budowy czytelnego UI.

---

## 7. Data layer - repozytoria i źródła danych

Warstwa danych jest odpowiedzialna za to, aby reszta systemu mogła pracować na sensownych abstrakcjach zamiast na szczegółach implementacyjnych.

### Co powinno znaleźć się w tej warstwie?

- repozytoria,
- lokalne źródła danych,
- zdalne źródła danych,
- cache,
- mapery między modelami,
- logika synchronizacji.

### Po co w ogóle repozytorium?

Repozytorium nie istnieje po to, aby „mieć jeszcze jedną klasę pośrednią”. Jego celem jest ukrycie szczegółów pozyskiwania danych. UI nie powinno wiedzieć, czy lista zadań pochodzi z Room, z backendu, z pamięci podręcznej, czy z połączenia tych źródeł.

```kotlin
interface TaskRepository {
    fun observeTasks(): Flow<List<Task>>
    suspend fun addTask(task: Task)
    suspend fun deleteTask(id: Int)
    suspend fun refresh()
}
```

### Implementacja repozytorium

Poniższy przykład pokazuje konkretną implementację interfejsu `TaskRepository`, która łączy lokalne i zdalne źródło danych. Kluczową zasadą jest rozdzielenie obserwacji danych (strumień z bazy lokalnej) od wymuszania odświeżenia (wywołanie `refresh()`), co zapobiega wielokrotnym niepotrzebnym żądaniom sieciowym przy każdej nowej subskrypcji. Wstrzykiwany `CoroutineDispatcher` pozwala podmienić go w testach na `UnconfinedTestDispatcher`, co czyni testy kodu asynchronicznego deterministycznymi.

```kotlin
class TaskRepositoryImpl @Inject constructor(
    private val localDataSource: TaskLocalDataSource,
    private val remoteDataSource: TaskRemoteDataSource,
    private val ioDispatcher: CoroutineDispatcher
) : TaskRepository {

    override fun observeTasks(): Flow<List<Task>> =
        localDataSource.observeAll()

    override suspend fun refresh() = withContext(ioDispatcher) {
        val remoteTasks = remoteDataSource.fetchTasks()
        localDataSource.replaceAll(remoteTasks)
    }

    override suspend fun addTask(task: Task) = withContext(ioDispatcher) {
        localDataSource.insert(task)
        // opcjonalnie: synchronizacja z backendem
    }

    override suspend fun deleteTask(id: Int) = withContext(ioDispatcher) {
        localDataSource.delete(id)
    }
}
```

### Dlaczego synchronizacja nie powinna być uruchamiana przy każdym `collect`?

To częsty błąd projektowy. Jeżeli synchronizacja jest efektem ubocznym startu obserwacji `Flow`, to każda nowa subskrypcja może wywołać kolejne odświeżenie. W praktyce prowadzi to do:

- wielokrotnych połączeń sieciowych,
- trudniejszych do zrozumienia zależności,
- nieprzewidywalnego obciążenia,
- słabszej testowalności.

Znacznie lepiej oddzielić:

- **obserwację danych**,
- **wymuszenie odświeżenia**.

### Pytanie projektowe, które trzeba sobie zadać

Czy aplikacja ma strategię:

- **offline first**,
- **network first**,
- **cache aside**,
- **single source of truth**?

Bez odpowiedzi na to pytanie repozytorium bardzo szybko staje się zbiorem metod bez spójnej polityki dostępu do danych.

---

## 8. Domain layer - kiedy jest potrzebna

Warstwa domenowa bywa źle rozumiana. Jedni studenci próbują dodawać ją do każdej aplikacji, inni uznają ją za zbędną komplikację. Prawda jest bardziej praktyczna: warstwa domenowa jest przydatna wtedy, gdy rozwiązuje realny problem.

### Kiedy warto ją dodać?

- gdy logika biznesowa jest złożona,
- gdy te same reguły są używane w wielu ekranach,
- gdy chcesz łatwo testować logikę poza Android framework,
- gdy jedna operacja wymaga współpracy kilku repozytoriów,
- gdy chcesz wyraźnie oddzielić reguły systemu od sposobu ich prezentacji.

### Kiedy można z niej zrezygnować?

- gdy aplikacja jest mała,
- gdy logika jest trywialna,
- gdy use case byłby jedynie cienkim wywołaniem `repository.getX()`,
- gdy dodatkowa warstwa nie upraszcza projektu, lecz zwiększa liczbę plików.

### Przykład sensownego use case

Poniższy use case nie jest tylko pustym opakowaniem repozytorium - dodaje realną regułę biznesową: filtruje zarchiwizowane zadania i ustala porządek sortowania. Dzięki umieszczeniu tej logiki w osobnej klasie można ją przetestować niezależnie od `ViewModel` i warstwy danych. Operator `invoke` z modyfikatorem `operator` pozwala wywoływać use case jak zwykłą funkcję, co poprawia czytelność kodu w miejscu wywołania.

```kotlin
class GetActiveTasksUseCase @Inject constructor(
    private val repository: TaskRepository
) {
    operator fun invoke(): Flow<List<Task>> =
        repository.observeTasks()
            .map { tasks -> tasks.filterNot { it.isArchived } }
            .map { tasks -> tasks.sortedByDescending { it.createdAt } }
}
```

Ten use case nie jest pustym wrapperem. Dodaje realną regułę: odfiltrowuje zadania zarchiwizowane i ustala sposób sortowania.

### Przykład use case z regułą biznesową

Poniższy use case zawiera nietrywialną regułę biznesową: sprawdza limit aktywnych zadań dla kont darmowych przed dodaniem nowego. Takie zasady powinny znaleźć się w warstwie domenowej właśnie dlatego, że są niezależne od sposobu wyświetlania danych i mogą być współdzielone przez wiele ekranów. Gdyby ta reguła trafiła do `ViewModel`, stałaby się trudna do przetestowania i podatna na duplikację przy kolejnych ekranach korzystających z tej samej operacji.

```kotlin
class AddTaskUseCase @Inject constructor(
    private val repository: TaskRepository,
    private val accountRepository: AccountRepository
) {
    suspend operator fun invoke(name: String) {
        require(name.isNotBlank()) { "Nazwa zadania nie może być pusta" }

        val accountType = accountRepository.getAccountType()
        val currentTasks = repository.observeTasks().first()

        if (accountType == AccountType.FREE && currentTasks.count { !it.isArchived } >= 20) {
            throw IllegalStateException("Limit aktywnych zadań został osiągnięty")
        }

        repository.addTask(Task(title = name.trim()))
    }
}
```

Tutaj warstwa domenowa ma oczywisty sens: przechowuje regułę biznesową niezależnie od interfejsu użytkownika.

---

## 9. Modele danych: DTO, Entity, Domain, UI

Jednym z podstawowych tematów architektonicznych jest świadome rozdzielenie modeli używanych w różnych warstwach.

### Typowy podział modeli

- **DTO** - model komunikacji z API,
- **Entity** - model przechowywany lokalnie,
- **Domain model** - model logiki biznesowej,
- **UI model** - model przygotowany do renderowania.

### Dlaczego nie warto używać jednego modelu wszędzie?

Ponieważ różne warstwy mają różne potrzeby:

- API może zwracać datę jako `String`,
- baza może wymagać prostych typów,
- domena chce bardziej semantyczne reprezentacje, np. `Instant` lub `LocalDate`,
- UI potrzebuje już sformatowanego tekstu, flag wizualnych i danych gotowych do wyświetlenia.

Jeśli użyjesz jednego modelu wszędzie, granice warstw zaczną się zacierać. Wtedy szczegóły API lub UI „przeciekają” do pozostałych części systemu.

### Przykład modeli

Poniższy przykład ilustruje cztery odrębne modele danych, z których każdy służy innej warstwie aplikacji. `TaskDto` odzwierciedla strukturę odpowiedzi z API (daty jako String), `TaskEntity` odpowiada schematowi tabeli w bazie Room, `Task` to model domenowy z właściwymi typami semantycznymi (`LocalDate`, `Instant`), a `TaskUiModel` zawiera dane już przetworzone na potrzeby renderowania. Utrzymywanie tych modeli jako osobnych klas zapobiega „przeciekaniu" szczegółów jednej warstwy do pozostałych.

```kotlin
data class TaskDto(
    val id: Int,
    val title: String,
    val dueDateIso: String?,
    val priority: String,
    val createdAtIso: String
)

data class TaskEntity(
    val id: Int,
    val title: String,
    val dueDateIso: String?,
    val priority: String,
    val createdAtIso: String,
    val isArchived: Boolean
)

data class Task(
    val id: Int = 0,
    val title: String,
    val dueDate: LocalDate? = null,
    val priority: Priority = Priority.NORMAL,
    val createdAt: Instant = Instant.now(),
    val isArchived: Boolean = false,
    val isCompleted: Boolean = false
)

data class TaskUiModel(
    val id: Int,
    val title: String,
    val dueDateFormatted: String,
    val isOverdue: Boolean,
    val priorityLabel: String
)
```

### Przykład mapowania modelu domenowego do UI

Poniższa funkcja rozszerzająca pokazuje, jak przetransformować model domenowy `Task` na model UI `TaskUiModel` gotowy do wyświetlenia. Mapowanie generuje czytelny dla użytkownika opis daty (np. „Dziś", „Jutro") i oblicza flagę `isOverdue` - logika typowo prezentacyjna, która nie powinna znajdować się ani w modelu domenowym, ani w Composable. Umieszczenie mapowania poza warstwą UI jako osobna funkcja ułatwia testowanie jednostkowe bez uruchamiania frameworka Android.

```kotlin
fun Task.toUiModel(now: LocalDate = LocalDate.now()): TaskUiModel {
    val label = when (dueDate) {
        null -> "Bez terminu"
        now.minusDays(1) -> "Wczoraj"
        now -> "Dziś"
        now.plusDays(1) -> "Jutro"
        else -> dueDate.format(DateTimeFormatter.ofPattern("d MMM", Locale("pl")))
    }

    return TaskUiModel(
        id = id,
        title = title,
        dueDateFormatted = label,
        isOverdue = dueDate != null && dueDate.isBefore(now) && !isCompleted,
        priorityLabel = priority.name
    )
}
```

### Co jest sygnałem złej architektury?

Jeżeli model domenowy zawiera `Color`, `ImageVector`, `NavController`, `Context`, zasoby Androida lub teksty przygotowane wyłącznie pod UI, to znaczy, że granice warstw zostały naruszone.

---

## 10. StateFlow i SharedFlow

W nowoczesnych projektach Android bardzo często używa się `StateFlow` i `SharedFlow`. Mimo podobieństwa obu typów, ich rola jest inna.

### `StateFlow`

`StateFlow` reprezentuje **stan posiadający zawsze aktualną wartość**. To naturalny wybór dla stanu ekranu.

Typowe zastosowania:

- dane formularza,
- lista elementów,
- stan ładowania,
- komunikat o błędzie jako część stanu,
- aktywne filtry i sortowanie.

### `SharedFlow`

`SharedFlow` służy do emisji zdarzeń do wielu obserwatorów. Może być używany do jednorazowych efektów, ale trzeba robić to ostrożnie.

Typowe zastosowania:

- sygnał odświeżenia,
- telemetria,
- jednorazowe zdarzenie, jeśli architektura rzeczywiście tego wymaga.

### Najczęstszy błąd

Wielu początkujących programistów próbuje modelować każdy komunikat UI jako `SharedFlow`. To bywa niepoprawne.

Jeżeli błąd ma być widoczny na ekranie aż do momentu poprawy danych, jest to **stan**, a nie jednorazowe zdarzenie.

### Przykład wyszukiwarki

Poniższy `SearchViewModel` demonstruje reaktywne wyszukiwanie z użyciem `StateFlow` i operatorów `debounce` oraz `flatMapLatest`. Operator `debounce(300)` opóźnia wyszukiwanie o 300 ms po ostatnim znaku, co eliminuje zbędne zapytania sieciowe przy każdym naciśnięciu klawisza. Całe przekształcenie zapytania na stan UI opisane jest deklaratywnie jako ciąg operatorów - taki kod jest łatwy do czytania i testowania.

```kotlin
@HiltViewModel
class SearchViewModel @Inject constructor(
    private val searchRepository: SearchRepository
) : ViewModel() {

    private val _query = MutableStateFlow("")
    val query: StateFlow<String> = _query.asStateFlow()

    val uiState: StateFlow<SearchUiState> = _query
        .debounce(300)
        .map { it.trim() }
        .flatMapLatest { q ->
            if (q.length < 2) {
                flowOf(SearchUiState(results = emptyList(), hint = "Wpisz co najmniej 2 znaki"))
            } else {
                searchRepository.search(q)
                    .map<List<SearchResult>, SearchUiState> { results ->
                        SearchUiState(results = results)
                    }
            }
        }
        .stateIn(
            scope = viewModelScope,
            started = SharingStarted.WhileSubscribed(5_000),
            initialValue = SearchUiState(isLoading = false)
        )

    fun onQueryChanged(value: String) {
        _query.value = value
    }
}

data class SearchUiState(
    val results: List<SearchResult> = emptyList(),
    val hint: String? = null,
    val isLoading: Boolean = false
)
```

W tym przypadku wskazówka „wpisz co najmniej 2 znaki” jest częścią stanu ekranu.

---

## 11. `SavedStateHandle` i problem process death

`ViewModel` dobrze radzi sobie ze zmianą konfiguracji, ale nie jest magazynem wszystkiego. Gdy system ubije proces aplikacji, część stanu może zostać utracona. Jednym z mechanizmów ograniczających ten problem jest `SavedStateHandle`.

### Do czego służy `SavedStateHandle`?

Do przechowywania **lekkiego stanu UI**, który powinien przetrwać odtworzenie procesu, na przykład:

- tekst wpisany w formularz,
- wybraną kartę,
- ID aktualnie otwartego obiektu,
- parametry wyszukiwania i filtry.

### Czego nie należy tam przechowywać?

- dużych list,
- bitmap,
- pełnych odpowiedzi z API,
- złożonych grafów obiektów.

Dlaczego? Ponieważ mechanizm ten opiera się na `Bundle`, a więc nie został zaprojektowany jako pełnowartościowa baza danych czy magazyn dużych struktur.

### Przykład

Poniższy `ViewModel` korzysta z `SavedStateHandle` do zachowania lekkiego stanu formularza po śmierci procesu. Właściwości `title` i `description` używają delegata `saveable`, dzięki czemu ich wartość jest automatycznie serializowana do `Bundle` i przywracana po ponownym uruchomieniu aplikacji przez system. Jest to właściwy wzorzec dla pól tekstowych formularzy i aktywnych zakładek, ale nie nadaje się do przechowywania dużych struktur danych.

```kotlin
@HiltViewModel
class FormViewModel @Inject constructor(
    private val savedStateHandle: SavedStateHandle
) : ViewModel() {

    val selectedTab: StateFlow<Int> = savedStateHandle.getStateFlow("tab", 0)

    var title by savedStateHandle.saveable { mutableStateOf("") }
        private set

    var description by savedStateHandle.saveable { mutableStateOf("") }
        private set

    fun onTitleChanged(value: String) {
        title = value
    }

    fun onDescriptionChanged(value: String) {
        description = value
    }

    fun selectTab(index: Int) {
        savedStateHandle["tab"] = index
    }
}
```

### Ważna uwaga praktyczna

`SavedStateHandle` nie zastępuje trwałego źródła danych. Jeżeli chcesz zachować istotne informacje długoterminowo, użyj narzędzi takich jak Room czy DataStore.

---

## 12. Dependency Injection i Hilt

Dependency Injection nie jest celem samym w sobie. To technika, która pomaga kontrolować sposób tworzenia i dostarczania zależności.

### Co daje DI?

- ogranicza ręczne tworzenie obiektów w wielu miejscach,
- poprawia testowalność,
- ułatwia podmianę implementacji,
- porządkuje konfigurację aplikacji,
- zmniejsza sprzężenie między klasami.

### Przykład modułu Hilt

Poniższy moduł Hilt pokazuje, jak konfigurować zależności na poziomie całej aplikacji (zakres `SingletonComponent`). Adnotacja `@Provides` wskazuje, że Hilt ma wywołać tę metodę fabryczną zamiast próbować automatycznie tworzyć obiekty, co jest konieczne dla zewnętrznych bibliotek takich jak Room czy Retrofit. Wstrzykiwanie dispatchera jako `@IoDispatcher` zamiast bezpośredniego użycia `Dispatchers.IO` umożliwia podmianę go na `TestCoroutineDispatcher` w testach automatycznych.

```kotlin
@Module
@InstallIn(SingletonComponent::class)
object DataModule {

    @Provides
    @Singleton
    fun provideDatabase(
        @ApplicationContext context: Context
    ): AppDatabase = Room.databaseBuilder(
        context,
        AppDatabase::class.java,
        "app.db"
    ).build()

    @Provides
    @Singleton
    fun provideTaskRepository(
        db: AppDatabase,
        api: TaskApi,
        @IoDispatcher ioDispatcher: CoroutineDispatcher
    ): TaskRepository = TaskRepositoryImpl(
        localDataSource = TaskLocalDataSource(db.taskDao()),
        remoteDataSource = TaskRemoteDataSource(api),
        ioDispatcher = ioDispatcher
    )
}
```

### Dlaczego wstrzykiwanie dispatcherów ma sens?

Ponieważ dzięki temu łatwiej testować kod asynchroniczny. W testach możesz podmienić dispatcher na kontrolowany odpowiednik i uniknąć nieprzewidywalnych zależności czasowych.

### Na co uważać?

- nie oznaczaj wszystkiego jako `Singleton`,
- nie buduj przesadnie rozbudowanej konfiguracji DI w bardzo małych projektach,
- nie traktuj Hilt jako substytutu dobrej architektury - DI porządkuje zależności, ale nie naprawi złego podziału odpowiedzialności.

---

## 13. Organizacja pakietów: warstwy czy cechy?

To zagadnienie ma duże znaczenie praktyczne, bo wpływa na codzienną pracę z kodem.

### Podejście 1: package by layer

Poniższy diagram przedstawia organizację pakietów według warstw aplikacji - najprostszy sposób podziału kodu. Struktura ta dobrze sprawdza się w małych projektach edukacyjnych, ponieważ jest intuicyjna i odzwierciedla trzy warstwy omówione w tym materiale. Wadą jest to, że wraz z rozrostem aplikacji klasy powiązane z jedną funkcją biznesową są rozsiane między kilkoma katalogami.

```text
ui/
data/
domain/
```

Zalety:

- jest proste,
- dobrze sprawdza się w małych projektach edukacyjnych,
- łatwo wytłumaczyć je na początku nauki.

Wady:

- przy większej aplikacji klasy związane z jedną funkcją są rozrzucone,
- rośnie liczba plików w tych samych katalogach,
- trudniej zrozumieć modułowość funkcjonalną systemu.

### Podejście 2: package by feature

Poniższy diagram przedstawia organizację pakietów według funkcji aplikacji, gdzie każda funkcja (tasks, search, settings) zawiera wewnętrznie własne podkatalogi warstw. Takie podejście sprawia, że kod dotyczący jednej funkcji jest skupiony w jednym miejscu, co ułatwia rozwijanie i usuwanie funkcji jako całości. W dużych projektach często łączy się oba podejścia: główny podział według funkcji, a wewnątrz każdej funkcji - podział według warstw.

```text
tasks/
  ui/
  domain/
  data/
search/
  ui/
  domain/
  data/
settings/
  ui/
  data/
```

Zalety:

- kod dotyczący jednej funkcji jest blisko siebie,
- łatwiej rozwijać większe aplikacje,
- lepiej wspiera pracę zespołową i modularność.

W praktyce często łączy się oba podejścia: główny podział według funkcji, a wewnątrz funkcji - według warstw.

### Dlaczego nie ma jednego „jedynego słusznego” układu?

Ponieważ architektura ma służyć projektowi. Inaczej organizuje się małą aplikację laboratoryjną, a inaczej produkcyjny system rozwijany przez kilka zespołów.

---

## 14. Granice odpowiedzialności - praktyczna ściąga

### Composable / Fragment / Activity

Powinny:

- renderować stan,
- przekazywać akcje użytkownika,
- zarządzać detalami UI,
- współpracować z cyklem życia Androida.

Nie powinny:

- wykonywać logiki biznesowej,
- znać szczegółów bazy danych,
- wykonywać zapytań HTTP,
- decydować o polityce synchronizacji danych.

### ViewModel

Powinien:

- utrzymywać stan ekranu,
- reagować na zdarzenia użytkownika,
- wołać use case'y lub repozytoria,
- koordynować logikę związaną z ekranem.

Nie powinien:

- znać szczegółów renderowania,
- trzymać `NavController`, `Activity`, `Fragment` czy `Context` bez realnej potrzeby,
- zwracać modeli zależnych od frameworka UI, jeśli projekt zakłada wyraźne granice warstw.

### Repository

Powinno:

- ukrywać źródła danych,
- łączyć dane lokalne i zdalne,
- zarządzać synchronizacją,
- mapować modele.

Nie powinno:

- zwracać modeli UI,
- zawierać logiki prezentacji,
- sterować nawigacją.

### Use case

Powinien:

- reprezentować operację biznesową,
- kapsułkować regułę lub scenariusz,
- być łatwy do przetestowania.

Nie powinien:

- istnieć wyłącznie z powodów formalnych,
- być pustą delegacją bez wartości projektowej.

---

## 15. Typowe błędy architektoniczne w projektach studenckich

1. **Nadarchitektura** - bardzo dużo klas i folderów bez realnej potrzeby.
2. **Repozytorium jako cienki wrapper** - klasa istnieje, ale nie dodaje żadnej wartości.
3. **Use case dla każdej operacji CRUD** - mimo że logika biznesowa praktycznie nie istnieje.
4. **DTO używane bezpośrednio w UI** - przeciekanie warstw.
5. **Composable zawierający logikę biznesową** - ekran przestaje być czytelny i testowalny.
6. **Publiczny `MutableStateFlow`** - brak kontroli nad modyfikacją stanu.
7. **Niepoprawne modelowanie zdarzeń i stanu** - np. błąd walidacji jako event jednorazowy.
8. **Brak strategii cache i odświeżania** - aplikacja działa, ale nie ma spójnej polityki danych.
9. **Jeden ogromny `MainViewModel`** - klasa staje się centrum wszystkiego.
10. **Silne zależności od Android framework w logice biznesowej** - utrudnione testowanie i refaktoryzacja.

### Ciekawostka praktyczna

W wielu projektach początkujących problemem nie jest zbyt mała liczba warstw, lecz zła granica między nimi. Można mieć nawet trzy piękne foldery `ui`, `domain` i `data`, a mimo to mieć złą architekturę, jeśli klasy w tych folderach nadal wykonują nie swoje zadania.

---

## 16. Ćwiczenie praktyczne - analiza architektury listy zadań

### Polecenie

Masz ekran listy zadań z funkcjami:

- pobranie listy,
- filtrowanie po statusie,
- dodanie zadania,
- usunięcie zadania,
- odświeżenie z serwera,
- przechowanie aktualnego filtra po process death.

### Zadania dla studenta

1. Rozpisz warstwy aplikacji.
2. Zdecyduj, czy potrzebna jest domain layer.
3. Zaprojektuj `TaskUiState`.
4. Zaprojektuj interfejs `TaskRepository`.
5. Wskaż, które dane trafią do `SavedStateHandle`.

### Wzorcowy kierunek odpowiedzi

- `SavedStateHandle`: aktualny filtr, tekst wyszukiwarki,
- `TaskUiState`: lista `TaskUiModel`, loading, error, `currentFilter`,
- `TaskRepository`: `observeTasks()`, `refresh()`, `addTask()`, `deleteTask()`,
- domain layer: uzasadniona wtedy, gdy filtrowanie i reguły biznesowe są współdzielone lub złożone.

---

## 17. Ćwiczenie praktyczne - wykryj naruszenie warstw

### Kod

Poniższy fragment kodu zawiera celowo zaprojektowane naruszenia zasad architektury - jest materiałem do analizy, a nie wzorcem do naśladowania. `ViewModel` bezpośrednio wstrzykuje `NavController`, `Context` oraz obiekt API, co oznacza, że łączy odpowiedzialności warstwy UI, nawigacji i danych w jednej klasie. Zadaniem studenta jest zidentyfikowanie tych naruszeń i zaproponowanie prawidłowego podziału odpowiedzialności.

```kotlin
class ProfileViewModel(
    private val api: ProfileApi,
    private val navController: NavController,
    private val context: Context
) : ViewModel() {

    fun load() {
        viewModelScope.launch {
            val user = api.getProfile()
            Toast.makeText(context, user.name, Toast.LENGTH_SHORT).show()
            navController.navigate("details")
        }
    }
}
```

### Pytania

1. Jakie są błędy architektoniczne?
2. Jak rozdzielić odpowiedzialności?

### Wskazówka

Zwróć uwagę, że `ViewModel` zna tu:

- szczegóły warstwy sieciowej,
- szczegóły nawigacji,
- szczegóły Android UI framework.

To sygnał, że odpowiedzialności zostały zmieszane.

---

## 18. Ćwiczenie praktyczne - zaprojektuj stan ekranu logowania

### Polecenie

Zaprojektuj `UiState` dla ekranu logowania. Ekran ma zawierać:

- email,
- hasło,
- walidację pól,
- spinner w trakcie logowania,
- komunikat błędu,
- informację o sukcesie.

### Przykładowe rozwiązanie

Poniższa klasa `LoginUiState` demonstruje wzorcowe podejście do modelowania stanu ekranu logowania jako jednego spójnego obiektu. Wszystkie pola tworzą kompletny opis tego, co powinno zostać wyrenderowane - flagi błędów pól, stan ładowania i komunikat ogólny. Dzięki modelowaniu stanu jako immutable data class każda zmiana prowadzi do nowego obiektu stanu, co jest zgodne z zasadami UDF i ułatwia debugowanie przez porównywanie kolejnych stanów.

```kotlin
data class LoginUiState(
    val email: String = "",
    val password: String = "",
    val emailError: String? = null,
    val passwordError: String? = null,
    val isLoading: Boolean = false,
    val errorMessage: String? = null,
    val isLoggedIn: Boolean = false
)
```

### Pytanie pogłębiające

Czy `isLoggedIn` powinno być stanem, czy zdarzeniem jednorazowym?

To zależy od konkretnej architektury ekranu. Sam fakt poprawnego zalogowania może być trwałym stanem domenowym, ale przejście do kolejnego ekranu jest zwykle zachowaniem UI.

---

## 19. Ćwiczenie praktyczne - refaktoryzacja repozytorium

### Polecenie

Przepisz repozytorium tak, aby:

- nie wykonywało synchronizacji przy każdym kolekcjonowaniu,
- rozdzielało obserwację danych od wymuszenia odświeżenia,
- było łatwe do przetestowania.

### Cel ćwiczenia

Masz dojść do projektu, w którym:

- `observe...()` odpowiada za strumień danych,
- `refresh()` odpowiada za jawne odświeżenie,
- warstwa UI nie musi znać szczegółów synchronizacji.

---

## 20. Pytania kontrolne

1. Czym różni się `ViewModel` od repozytorium?
2. Kiedy warstwa domenowa jest uzasadniona, a kiedy stanowi przerost formy?
3. Dlaczego `TaskUiModel` nie powinien trafiać do warstwy danych?
4. Kiedy komunikat błędu jest stanem, a kiedy zdarzeniem?
5. Dlaczego `SavedStateHandle` nie nadaje się do dużych obiektów?
6. Jakie są korzyści UDF w Compose?
7. Czym różni się zmiana konfiguracji od process death?
8. Dlaczego `ViewModel` nie powinien znać `NavController`?
9. Co daje podział na feature zamiast wyłącznie na warstwy?
10. Jakie ryzyko niesie repozytorium wykonujące synchronizację przy każdym `collect`?

---

## 21. Najważniejsze wnioski

1. Architektura ma redukować złożoność, a nie robić wrażenie nazwami wzorców.
2. `ViewModel` jest stanowym pośrednikiem dla ekranu, a nie miejscem na całą aplikację.
3. Domain layer jest opcjonalna i należy ją dodawać wtedy, gdy daje realną wartość.
4. Repozytorium powinno ukrywać źródła danych i politykę dostępu do danych.
5. `StateFlow` służy do modelowania stanu, a `SharedFlow` nie jest odpowiedzią na każdy problem.
6. `SavedStateHandle` służy do lekkiego stanu UI, nie do przechowywania dużych danych.
7. Modele UI, domenowe i danych powinny mieć wyraźne granice.
8. W Compose należy myśleć w kategoriach stanu i jednokierunkowego przepływu danych.
9. Unikanie nadarchitektury jest równie ważne jak unikanie chaosu.
10. Dobra architektura zwiększa testowalność, przewidywalność i tempo dalszego rozwoju projektu.

---

## 22. Literatura i linki do dalszej nauki

- Android Developers - Guide to app architecture: https://developer.android.com/topic/architecture
- Android Developers - Recommendations for Android architecture: https://developer.android.com/topic/architecture/recommendations
- Android Developers - Domain layer: https://developer.android.com/topic/architecture/domain-layer
- Android Developers - Data layer: https://developer.android.com/topic/architecture/data-layer
- Android Developers - ViewModel overview: https://developer.android.com/topic/libraries/architecture/viewmodel
- Android Developers - UI events: https://developer.android.com/topic/architecture/ui-layer/events
- Android Developers - State holders and UI state: https://developer.android.com/topic/architecture/ui-layer/stateholders
- Android Developers - StateFlow and SharedFlow: https://developer.android.com/kotlin/flow/stateflow-and-sharedflow
- Android Developers - Saved State module for ViewModel: https://developer.android.com/topic/libraries/architecture/viewmodel/viewmodel-savedstate
- Android Developers - Save UI state in Compose: https://developer.android.com/develop/ui/compose/state-saving
