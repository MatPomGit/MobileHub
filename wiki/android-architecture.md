# Architektura aplikacji Android — MVVM, warstwy aplikacji i praktyczne zasady projektowe

Dobra architektura nie polega na „dodaniu wzorca”, ale na takim podziale kodu, aby system był przewidywalny, testowalny, łatwy do rozwijania i odporny na zmiany wymagań. W ekosystemie Android Google rekomenduje architekturę warstwową z **UI layer**, **data layer** oraz **opcjonalną domain layer**, a nie sztywne kopiowanie konkretnego „szablonu projektu”. MVVM jest w praktyce jednym ze sposobów organizacji **warstwy UI**, najczęściej z użyciem `ViewModel`. citeturn0search0turn0search3turn0search6turn0search7

Ten materiał porządkuje najważniejsze pojęcia, koryguje uproszczenia, pokazuje typowe błędy oraz dodaje praktyczne wskazówki i ćwiczenia.

---

## 1. Co w oryginalnym opisie było trafne, a co wymagało doprecyzowania

Oryginalny materiał poprawnie wskazywał, że:
- architektura ma rozdzielać odpowiedzialności,
- `ViewModel` jest dobrym miejscem na logikę prezentacji i stan ekranu,
- warstwa domenowa bywa przydatna przy bardziej złożonej logice,
- repozytorium ukrywa szczegóły źródeł danych,
- UDF porządkuje przepływ stanu,
- `StateFlow` i `SharedFlow` pełnią różne role.

Jednocześnie kilka miejsc wymagało korekty lub silniejszego doprecyzowania:

1. **„Google rekomenduje architekturę opartą na MVVM”** — to jest skrót myślowy. Dokładniej: Google rekomenduje **nowoczesną architekturę warstwową**, UDF, stan w UI layer oraz `ViewModel` jako opiniowanego state holdera dla logiki biznesowej ekranu. Sam termin „MVVM” nie jest w dokumentacji najważniejszym punktem odniesienia. citeturn0search0turn0search3turn0search7

2. **Use cases nie są obowiązkowe** — warstwa domenowa jest **opcjonalna** i należy ją dodawać wtedy, gdy logika jest złożona, współdzielona lub wymaga lepszej separacji. W małych aplikacjach dokładanie jej „z zasady” prowadzi często do nadarchitektury. citeturn0search6turn0search12

3. **UI events** — w praktyce nie każdy jednorazowy efekt musi być emitowany z `ViewModel` jako `SharedFlow`. Oficjalne wytyczne rozróżniają logikę biznesową od logiki zachowania UI. Na przykład nawigacja czy prezentacja Snackbara bywają traktowane jako logika UI, zależna od platformy i konkretnej implementacji. Trzeba więc unikać dogmatu „każdy event tylko przez ViewModel”. citeturn0search1turn0search13

4. **SavedStateHandle nie jest magazynem na wszystko** — służy do przechowywania **prostego, lekkiego stanu UI**, który ma przetrwać process death. Duże lub złożone dane powinny trafić do trwałego źródła danych, np. Room lub DataStore. citeturn0search2turn0search5turn0search8turn0search11

5. **Repozytorium z `onStart { syncWithRemote() }`** — sam pomysł synchronizacji jest sensowny, ale przykład może być mylący architektonicznie. Wywołanie synchronizacji jako efektu ubocznego przy każdym kolekcjonowaniu flow może prowadzić do wielokrotnych synchronizacji, problemów z wydajnością i trudniejszych do zrozumienia zależności. Lepsze jest jawne sterowanie synchronizacją, cache policy albo osobny mechanizm odświeżania.

6. **Granice modeli** — przykład modeli domenowych i UI był dobry, ale warto jasno powiedzieć, że `Color`, `ImageVector` czy sformatowane napisy to szczegóły warstwy UI i nie powinny „przeciekać” do domeny ani danych.

---

## 2. Rekomendowana architektura warstwowa

Najczęściej stosowany podział wygląda następująco:

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

To nie jest podział „dla estetyki katalogów”, lecz dla odpowiedzialności:

- **UI layer** odpowiada za prezentację stanu i reakcję na akcje użytkownika.
- **Domain layer** kapsułkuje logikę biznesową, gdy staje się złożona lub współdzielona.
- **Data layer** dostarcza dane, synchronizuje źródła i ukrywa szczegóły implementacyjne. citeturn0search0turn0search3turn0search6turn0search9

### Ważna zasada
Zależności powinny płynąć „w dół abstrakcji”, a nie w górę szczegółów. Oznacza to, że UI nie powinno znać Room, Retrofit czy SQL. Ekran ma wiedzieć, że chce pobrać stan, zapisać zadanie albo odświeżyć listę — nie jak to jest fizycznie realizowane.

---

## 3. MVVM w Androidzie — co to znaczy w praktyce

W projektach Androidowych MVVM najczęściej oznacza:
- **View**: Compose UI, Fragment lub Activity,
- **ViewModel**: stan ekranu + logika biznesowa ekranu,
- **Model**: dane i operacje pochodzące zwykle z domain/data layer.

To jednak nie powinno być rozumiane szkolnie. W Compose „View” jest deklaratywne, więc ekran nie „pobiera” danych imperatywnie, lecz obserwuje stan i renderuje UI na jego podstawie. `ViewModel` pełni rolę **state holdera**. Android oficjalnie podkreśla właśnie tę rolę: stan i logika powiązana z ekranem mają być wystawione do UI przez state holder, zwykle `ViewModel`. citeturn0search7turn0search13turn0search14

---

## 4. UI layer — stan, logika UI i logika biznesowa

W praktyce warto odróżnić trzy rzeczy:

1. **UI state** — dane potrzebne do narysowania ekranu.
2. **Business logic** — co zrobić z danym zdarzeniem z punktu widzenia reguł aplikacji.
3. **UI behavior logic** — jak ekran ma się zachować, np. przewinąć listę, pokazać Snackbar, uruchomić nawigację.

Android rozróżnia logikę biznesową od logiki UI. To istotne, bo wielu studentów próbuje wepchnąć wszystko do `ViewModel`, co prowadzi do sztucznego komplikowania kodu. `ViewModel` jest dobrym miejscem dla stanu i logiki biznesowej ekranu, ale część zachowań czysto interfejsowych może pozostać w UI. citeturn0search1turn0search13

### Przykład rozsądnego podziału
- kliknięcie „Zapisz” uruchamia walidację i zapis do repozytorium — **ViewModel / use case**,
- po sukcesie ekran ma wyświetlić Snackbara — zależnie od projektu: **UI logic** albo jednorazowy efekt z `ViewModel`,
- przewinięcie do błędnego pola formularza — zwykle **UI logic**.

---

## 5. ViewModel — poprawna rola i typowe błędy

`ViewModel`:
- przechowuje stan ekranu,
- przetwarza akcje użytkownika,
- komunikuje się z warstwą domenową lub danych,
- przeżywa zmiany konfiguracji,
- nie przeżywa sam z siebie systemowego process death. Do tego służą inne mechanizmy, np. `SavedStateHandle`. citeturn0search7turn0search8turn0search10

### Poprawiony przykład `ViewModel`

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

### Dlaczego ten wariant jest lepszy dydaktycznie?
- nazwa `observeTasks()` lepiej oddaje sens niż `loadTasks()`, bo obserwujemy `Flow`, a nie tylko jednorazowo ładujemy dane,
- błąd i loading są jawnie aktualizowane,
- wejście użytkownika jest walidowane,
- stan UI zawiera **model UI**, a nie model domenowy.

### Typowe błędy studentów
- trzymanie `Context` w `ViewModel`,
- uruchamianie requestów HTTP bezpośrednio z Composable,
- wystawianie `MutableStateFlow` publicznie,
- mieszanie logiki walidacji, mapowania, nawigacji i zapisu danych w jednym bardzo dużym `ViewModel`.

---

## 6. UDF — Unidirectional Data Flow

UDF oznacza, że dane płyną w jednym kierunku:

```text
akcja użytkownika -> ViewModel -> aktualizacja stanu -> render UI
```

UI nie powinno „samowolnie” zmieniać stanu biznesowego poza kanałami przewidzianymi przez state holder. Dzięki temu:
- łatwiej odtworzyć przebieg błędu,
- mniej jest stanów pośrednich i wyścigów,
- łatwiej testować ekran. citeturn0search0turn0search3

### Praktyczna zasada
Composable powinien być maksymalnie „głupi” biznesowo: odbiera stan, renderuje go i emituje akcje w górę.

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

Takie podejście ułatwia testy podglądowe, testy UI i ponowne użycie komponentu.

---

## 7. Data layer — repozytorium i źródła danych

Warstwa danych odpowiada za:
- pobieranie danych z sieci,
- zapis i odczyt lokalny,
- cache,
- mapowanie DTO/entity/domain,
- strategię synchronizacji. citeturn0search9

### Co robi repozytorium?
Repozytorium nie jest „magiczną klasą pośrednią”. To warstwa abstrakcji, która ukrywa szczegóły tego, skąd pochodzą dane i jak są łączone.

```kotlin
interface TaskRepository {
    fun observeTasks(): Flow<List<Task>>
    suspend fun addTask(task: Task)
    suspend fun deleteTask(id: Int)
    suspend fun refresh()
}
```

### Dlaczego poprzedni przykład z `onStart { syncWithRemote() }` jest ryzykowny?
Bo każde nowe rozpoczęcie kolekcji może wywołać kolejną synchronizację. To bywa niepożądane, zwłaszcza gdy ekran jest rekonstruowany lub kolekcjonowany z kilku miejsc.

Lepszy przykład:

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
        // opcjonalnie: sync do backendu
    }

    override suspend fun deleteTask(id: Int) = withContext(ioDispatcher) {
        localDataSource.delete(id)
    }
}
```

### Dobre pytanie projektowe
Czy aplikacja ma strategię:
- **offline first**,
- **network first**,
- **cache aside**,
- **single source of truth**?

Bez odpowiedzi na to pytanie repozytorium zwykle pozostaje przypadkowym zbiorem metod.

---

## 8. Domain layer — kiedy warto ją dodać

Warstwa domenowa jest **opcjonalna**. Warto ją stosować, gdy:
- logika biznesowa jest złożona,
- ta sama logika ma być używana w wielu ekranach,
- chcesz testować reguły biznesowe niezależnie od Android framework,
- chcesz oddzielić „co system robi” od „jak UI to pokazuje”. citeturn0search6turn0search12

### Kiedy nie warto?
- gdy aplikacja jest mała,
- gdy use case byłby tylko cienkim wywołaniem `repository.getX()`,
- gdy powstają dziesiątki klas typu `GetUserUseCase`, `SaveUserUseCase`, `DeleteUserUseCase`, które niczego nie upraszczają.

### Poprawny przykład use case

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

### Use case jako miejsce na regułę biznesową
Przykład: „użytkownik darmowy może mieć maksymalnie 20 aktywnych zadań”.

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

To jest realna wartość warstwy domenowej: reguły, nie tylko delegacja.

---

## 9. Modele: DTO, Entity, Domain, UI

Jednym z najważniejszych tematów architektonicznych jest rozdzielenie modeli.

### Typowy podział
- **DTO** — model z API,
- **Entity** — model bazy lokalnej,
- **Domain model** — model logiki biznesowej,
- **UI model** — model przygotowany do renderowania.

### Dlaczego to ważne?
Bo różne warstwy mają różne wymagania. Przykładowo:
- API może zwracać datę jako `String`,
- baza lokalna może wymagać typu prostego,
- domena chce `Instant` albo `LocalDate`,
- UI chce już sformatowany napis „Dziś” lub „Jutro”.

### Przykład

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
    val id: Int,
    val title: String,
    val dueDate: LocalDate?,
    val priority: Priority,
    val createdAt: Instant,
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

### Mapper do UI

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

### Błąd architektoniczny
Jeżeli model domenowy zawiera `Color`, `ImageVector`, `NavController`, `Context` albo zasoby Androida, to znaczy, że granice warstw zostały naruszone.

---

## 10. StateFlow i SharedFlow — kiedy używać którego

`StateFlow` służy do reprezentowania **stanu z aktualną wartością**, natomiast `SharedFlow` do rozgłaszania zdarzeń do wielu obserwatorów. W Androidzie `StateFlow` jest naturalnym kandydatem do stanu ekranu. `SharedFlow` może być używany do jednorazowych zdarzeń, ale trzeba robić to świadomie. citeturn0search4turn0search1

### Dobre zastosowania
- `StateFlow`: formularz, lista elementów, stan ładowania, komunikat błędu jako część stanu ekranu.
- `SharedFlow`: sygnał odświeżenia, event telemetryczny, jednorazowy efekt, jeśli architektura naprawdę tego wymaga.

### Ważne doprecyzowanie dydaktyczne
Wielu programistów modeluje **każdy** komunikat UI jako `SharedFlow`. To bywa błędem. Jeżeli błąd walidacji ma być widoczny na ekranie aż do poprawy danych, to jest to **stan**, nie jednorazowy event.

### Rozsądny przykład

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

Tutaj wskazówka „wpisz co najmniej 2 znaki” jest stanem, a nie eventem.

---

## 11. SavedStateHandle — do czego służy naprawdę

`ViewModel` pomaga zachować dane przy zmianie konfiguracji, ale nie przechowuje ich samoczynnie po zabiciu procesu przez system. Do tego używa się m.in. `SavedStateHandle`. Android podkreśla, że mechanizm ten powinien być stosowany do **prostego, lekkiego stanu UI**, bo opiera się na `Bundle`. citeturn0search2turn0search5turn0search8turn0search11

### Poprawny sposób myślenia
W `SavedStateHandle` przechowuj:
- tekst wpisany w pole formularza,
- zaznaczoną zakładkę,
- ID aktualnie oglądanego obiektu,
- parametry filtra.

Nie przechowuj:
- dużych list,
- bitmap,
- złożonych grafów obiektów,
- pełnych odpowiedzi z API.

### Przykład

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

### Ważna uwaga
API `saveable` dla integracji Compose z `SavedStateHandle` jest opisane w dokumentacji jako eksperymentalne wsparcie Compose state. W materiałach dla studentów warto to dopowiedzieć, aby rozumieli, że część API w Androidzie zmienia status wraz z wersjami bibliotek. citeturn0search2

---

## 12. Dependency Injection i Hilt

DI nie jest celem samym w sobie. Jego rola polega na:
- wstrzykiwaniu zależności zamiast ręcznego tworzenia obiektów w wielu miejscach,
- ułatwianiu testów,
- centralizacji konfiguracji,
- ograniczeniu sprzężenia.

### Przykład modułu

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

### Zasady praktyczne
- nie wstrzykuj wszystkiego jako `Singleton`,
- wstrzykuj interfejsy tam, gdzie chcesz podmieniać implementacje,
- dispatcher I/O także warto wstrzykiwać, bo poprawia to testowalność.

---

## 13. Architektura pakietów — według warstw czy według cech?

To temat, którego często brakuje w krótkich notatkach.

### Podejście 1: package by layer

```text
ui/
data/
domain/
```

Dobre w małych projektach edukacyjnych, ale przy większej aplikacji szybko rośnie liczba plików w jednym miejscu.

### Podejście 2: package by feature

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

To zwykle skaluje się lepiej, bo kod związany z jedną funkcją jest blisko siebie. W projektach produkcyjnych często łączy się oba podejścia: główny podział na feature, a wewnątrz feature na warstwy.

---

## 14. Granice odpowiedzialności — praktyczna ściąga

### Composable / Fragment / Activity
Powinny:
- renderować stan,
- przekazywać akcje użytkownika,
- zarządzać detalami UI.

Nie powinny:
- wykonywać zapytań HTTP,
- znać SQL ani DAO,
- implementować reguł biznesowych.

### ViewModel
Powinien:
- utrzymywać stan ekranu,
- koordynować use case/repozytoria,
- reagować na akcje użytkownika.

Nie powinien:
- znać szczegółów widoków,
- trzymać `NavController`, `Activity`, `Fragment`, `Context` bez rzeczywistej potrzeby.

### Repository
Powinno:
- ukrywać źródła danych,
- łączyć cache, sieć i pamięć lokalną,
- mapować modele.

Nie powinno:
- zawierać logiki prezentacji,
- zwracać modeli UI.

### Use case
Powinien:
- reprezentować operację biznesową,
- być łatwy do testowania,
- kapsułkować regułę.

Nie powinien:
- istnieć tylko dlatego, że „tak się robi”.

---

## 15. Typowe błędy architektoniczne w pracach studenckich

1. **Anemiczna architektura z nadmiarem klas** — dużo folderów, mało sensownego podziału.
2. **Repository jako cienki wrapper** bez żadnej wartości.
3. **Use case dla każdej metody CRUD**, nawet gdy nie ma logiki biznesowej.
4. **DTO używane bezpośrednio w UI**.
5. **Composable wykonujący logikę biznesową**.
6. **`MutableStateFlow` publiczne**.
7. **Zdarzenia jednorazowe modelowane jako stan trwały albo odwrotnie**.
8. **Brak rozróżnienia błędu domenowego, błędu sieci i błędu walidacji**.
9. **Brak strategii odświeżania i cache**.
10. **Duży `MainViewModel` obsługujący całą aplikację**.

---

## 16. Ćwiczenie praktyczne — analiza architektury listy zadań

### Polecenie
Masz ekran listy zadań z funkcjami:
- pobranie listy,
- filtrowanie po statusie,
- dodanie zadania,
- usunięcie zadania,
- odświeżenie z serwera,
- przechowanie aktualnego filtra po process death.

### Zadanie dla studenta
1. Rozpisz warstwy aplikacji.
2. Zdecyduj, czy potrzebna jest domain layer.
3. Zaprojektuj `TaskUiState`.
4. Zaprojektuj interfejs `TaskRepository`.
5. Wskaż, które dane trafią do `SavedStateHandle`.

### Wzorcowa odpowiedź skrócona
- `SavedStateHandle`: aktualny filtr, tekst wyszukiwarki.
- `TaskUiState`: lista `TaskUiModel`, loading, error, currentFilter.
- `TaskRepository`: `observeTasks()`, `refresh()`, `addTask()`, `deleteTask()`.
- Domain layer: tak, jeśli filtrowanie i reguły biznesowe są współdzielone; nie, jeśli logika jest trywialna.

---

## 17. Ćwiczenie praktyczne — wykryj naruszenie warstw

### Kod

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

### Odpowiedź
- `ViewModel` zna szczegóły nawigacji i Android UI framework (`Toast`, `Context`, `NavController`).
- Brakuje repozytorium i granicy danych.
- Wynik powinien zostać wystawiony jako stan lub efekt, a UI powinno zdecydować o nawigacji i prezentacji komunikatu.

---

## 18. Ćwiczenie praktyczne — zaprojektuj stan ekranu

### Polecenie
Zaprojektuj `UiState` dla ekranu logowania. Ekran ma:
- email,
- hasło,
- walidację pól,
- spinner w trakcie logowania,
- komunikat błędu,
- informację o sukcesie.

### Przykładowe rozwiązanie

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

### Pytanie dydaktyczne
Czy `isLoggedIn` powinno być stanem, czy jednorazowym eventem? 

Odpowiedź: zależy od architektury ekranu i przebiegu nawigacji. Sam fakt poprawnego zalogowania może być stanem domenowym, ale przejście do następnego ekranu jest zwykle zachowaniem UI.

---

## 19. Ćwiczenie praktyczne — refaktoryzacja repozytorium

### Polecenie
Przepisz repozytorium tak, aby:
- nie wykonywało synchronizacji przy każdym kolekcjonowaniu,
- rozdzielało obserwację danych od wymuszenia odświeżenia,
- było łatwe do przetestowania.

### Wskazówka
Student powinien dojść do interfejsu z metodami `observe...()` oraz `refresh()` zamiast łączenia wszystkiego w jednym flow z efektem ubocznym.

---

## 20. Pytania kontrolne

1. Czym różni się `ViewModel` od repozytorium?
2. Kiedy warstwa domenowa jest uzasadniona, a kiedy stanowi przerost formy?
3. Dlaczego `TaskUiModel` nie powinien trafiać do warstwy danych?
4. Kiedy komunikat błędu jest stanem, a kiedy eventem?
5. Dlaczego `SavedStateHandle` nie nadaje się do dużych obiektów?
6. Jakie są korzyści UDF w Compose?
7. Czym różni się zmiana konfiguracji od process death?
8. Dlaczego `ViewModel` nie powinien znać `NavController`?
9. Co daje podział na feature zamiast wyłącznie na warstwy?
10. Jakie ryzyko niesie repozytorium wykonujące synchronizację przy każdym `collect`?

---

## 21. Zasady, które warto zapamiętać

1. Projektuj odpowiedzialności, nie tylko foldery.
2. `ViewModel` to state holder ekranu, nie „miejsce na wszystko”.
3. Domain layer jest opcjonalna.
4. Repozytorium ma ukrywać źródła danych i politykę dostępu do danych.
5. `StateFlow` służy do stanu, `SharedFlow` nie jest lekarstwem na każdy problem.
6. `SavedStateHandle` służy do lekkiego stanu UI.
7. Modele UI, domenowe i danych powinny mieć wyraźne granice.
8. W Compose myśl w kategoriach stanu i UDF, nie imperatywnych aktualizacji widoku.
9. Unikaj nadarchitektury w małych projektach.
10. Dobra architektura upraszcza testy i rozwój funkcji.

---

## 22. Linki źródłowe

- Guide to app architecture: https://developer.android.com/topic/architecture
- Recommendations for Android architecture: https://developer.android.com/topic/architecture/recommendations
- Domain layer: https://developer.android.com/topic/architecture/domain-layer
- Data layer: https://developer.android.com/topic/architecture/data-layer
- ViewModel overview: https://developer.android.com/topic/libraries/architecture/viewmodel
- UI events: https://developer.android.com/topic/architecture/ui-layer/events
- State holders and UI state: https://developer.android.com/topic/architecture/ui-layer/stateholders
- StateFlow and SharedFlow: https://developer.android.com/kotlin/flow/stateflow-and-sharedflow
- Saved State module for ViewModel: https://developer.android.com/topic/libraries/architecture/viewmodel/viewmodel-savedstate
- Save UI state in Compose: https://developer.android.com/develop/ui/compose/state-saving

