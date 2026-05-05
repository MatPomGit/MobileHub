# Aplikacje wsparcia zdrowia psychicznego

## Wprowadzenie

Aplikacje mobilne wspierające zdrowie psychiczne stanowią istotny obszar współczesnego **mHealth** (*mobile health*), czyli zastosowania urządzeń mobilnych i technologii cyfrowych w profilaktyce, monitorowaniu oraz wspomaganiu opieki zdrowotnej. W odróżnieniu od klasycznych aplikacji fitness, systemy związane ze zdrowiem psychicznym operują na zjawiskach bardziej złożonych: nastroju, stresie, jakości snu, poczuciu samotności, motywacji, poziomie energii czy obciążeniu poznawczym. Są to konstrukty wielowymiarowe, zależne zarówno od biologii, jak i od kontekstu społecznego, środowiskowego oraz życiowego użytkownika.

Smartfon jest wyjątkowo dogodną platformą do budowy takich aplikacji, ponieważ:

- towarzyszy użytkownikowi niemal stale,
- zawiera liczne sensory i źródła danych behawioralnych,
- umożliwia zbieranie danych aktywnych i pasywnych,
- pozwala realizować interwencje dokładnie w chwili, gdy mogą być najbardziej potrzebne.

Z perspektywy badawczej aplikacje tego typu są blisko związane z pojęciem **digital phenotyping**, czyli ilościowego opisu zachowania człowieka na podstawie danych generowanych przez urządzenia cyfrowe. W praktyce oznacza to próbę uchwycenia zmian stanu psychicznego poprzez takie sygnały jak aktywność ruchowa, sen, regularność dnia, mobilność przestrzenna, sposób korzystania z telefonu czy odpowiedzi w krótkich ankietach samoopisowych.

Należy jednak podkreślić fundamentalną zasadę: aplikacja mobilna może **wspierać** obserwację dobrostanu psychicznego, ale co do zasady nie powinna być traktowana jako samodzielny odpowiednik diagnozy klinicznej ani terapii. W literaturze i wytycznych instytucjonalnych podkreśla się, że interwencje cyfrowe są elementem szerszego ekosystemu opieki, a nie jego pełnym zastępstwem.

---

## 1. Miejsce aplikacji zdrowia psychicznego w ekosystemie mHealth

Aplikacje zdrowia psychicznego można umieścić na przecięciu kilku obszarów:

1. **informatyki medycznej**, która zajmuje się przetwarzaniem danych zdrowotnych,
2. **psychologii klinicznej i zdrowia**, która dostarcza modeli teoretycznych dotyczących nastroju, stresu i zachowania,
3. **inżynierii oprogramowania mobilnego**, która odpowiada za architekturę, bezpieczeństwo i użyteczność,
4. **uczenia maszynowego**, które wspiera modelowanie wzorców i predykcję ryzyka.

To połączenie sprawia, że projektowanie takich systemów jest trudniejsze niż budowa zwykłej aplikacji produktywności. Programista nie pracuje tu wyłącznie z interfejsem i bazą danych. Musi rozumieć, że każda decyzja projektowa - od częstotliwości powiadomień po dobór skali nastroju - wpływa na komfort, zaufanie i bezpieczeństwo użytkownika.

### Dlaczego aplikacje mobilne są tak atrakcyjne badawczo?

Ponieważ pozwalają prowadzić pomiar **w środowisku naturalnym**, a nie wyłącznie w gabinecie lub laboratorium. To bardzo istotne. Tradycyjne kwestionariusze psychologiczne są niezwykle cenne, ale często opisują stan pacjenta na podstawie retrospekcji: „jak czułeś się w ostatnim tygodniu?”. Takie podejście obarczone jest błędem pamięci i uśrednianiem doświadczeń. Aplikacje mobilne umożliwiają natomiast stosowanie:

- **EMA** (*Ecological Momentary Assessment*) - krótkich pomiarów samoopisowych wykonywanych wielokrotnie w ciągu dnia,
- **pasywnego monitorowania** - zbierania sygnałów behawioralnych bez konieczności ciągłego angażowania użytkownika.

Połączenie EMA i pasywnego sensing'u jest tak popularne dlatego, że każde z tych podejść kompensuje słabości drugiego. Samoopis daje semantyczny wgląd w to, co użytkownik czuje, ale wymaga wysiłku i regularności. Dane pasywne są mniej obciążające, ale same z siebie nie wyjaśniają znaczenia psychologicznego. Spadek aktywności może oznaczać pogorszenie nastroju, ale równie dobrze chorobę somatyczną, sesję egzaminacyjną, urlop albo zwykłe zmęczenie.

---

## 2. Główne typy aplikacji wspierających zdrowie psychiczne

W praktyce można wyróżnić kilka rodzin aplikacji.

| Typ aplikacji | Przykłady funkcjonalne | Cel główny |
|---|---|---|
| Dzienniki nastroju | skala nastroju, opis emocji, notatka tekstowa | samoobserwacja i analiza trendu |
| Aplikacje mindfulness | sesje oddechowe, medytacja, ćwiczenia uważności | redukcja napięcia i regulacja pobudzenia |
| Aplikacje CBT | restrukturyzacja myśli, identyfikacja zniekształceń poznawczych | wsparcie interwencji psychologicznych |
| Monitoring snu | analiza długości i regularności snu | identyfikacja zaburzeń rytmu dobowego |
| Aplikacje aktywności fizycznej | kroki, treningi, czas siedzenia | wspieranie zachowań ochronnych |
| Aplikacje społecznego wsparcia | grupy wsparcia, kontakt z terapeutą, check-in | redukcja izolacji |
| Hybrydowe aplikacje wellness | łączenie dziennika, snu, ruchu i interwencji | wielowymiarowe wsparcie dobrostanu |

### Dlaczego ten podział ma znaczenie?

Ponieważ od rodzaju aplikacji zależą:

- wymagane dane,
- model ryzyka,
- sposób prowadzenia użytkownika,
- poziom odpowiedzialności prawnej i etycznej.

Na przykład aplikacja medytacyjna może działać bez dostępu do lokalizacji czy danych o śnie, podczas gdy aplikacja monitorująca ryzyko nawrotu epizodu depresyjnego będzie dążyła do integracji wielu kanałów danych. Z kolei system deklarujący wykrywanie epizodów klinicznych może wejść na obszar regulacji właściwych dla wyrobów medycznych.

---

## 3. Aktywne i pasywne źródła danych

### 3.1. Dane aktywne

Dane aktywne to informacje, które użytkownik przekazuje świadomie, np.:

- ocena nastroju w skali 1–10,
- zaznaczenie dominujących emocji,
- odpowiedź na pytanie o poziom stresu,
- wpis tekstowy opisujący dzień,
- wypełnienie krótkiego kwestionariusza.

#### Dlaczego dane aktywne są nadal potrzebne?

Bo zdrowie psychiczne ma komponent subiektywny. Użytkownik może wyglądać „normalnie” z perspektywy danych sensorowych, a jednocześnie doświadczać silnego lęku lub obniżonego nastroju. Dane aktywne wnoszą więc znaczenie, którego nie da się odtworzyć wyłącznie z sensorów.

### 3.2. Dane pasywne

Dane pasywne to sygnały zbierane bez konieczności ciągłego wpisywania informacji przez użytkownika. Mogą obejmować:

- liczbę kroków,
- poziom aktywności ruchowej,
- regularność snu,
- czas korzystania z telefonu,
- schemat odblokowań ekranu,
- mobilność przestrzenną,
- zmienność dziennej rutyny,
- czas spędzany w domu,
- dane kontekstowe, np. światło lub hałas.

#### Dlaczego stosuje się dane pasywne?

Z trzech powodów.

Po pierwsze, ograniczają **obciążenie użytkownika**. Jeśli aplikacja wymaga wpisów co kilka godzin przez wiele tygodni, bardzo szybko spada przestrzeganie zaleceń.

Po drugie, pozwalają rejestrować zachowania w sposób **ciągły i obiektywizowalny**.

Po trzecie, umożliwiają wykrycie zmian, których sam użytkownik może nie zauważyć, na przykład stopniowego przesunięcia rytmu snu czy spadku różnorodności odwiedzanych miejsc.

### 3.3. Ograniczenia pasywnego sensing'u

To, że coś koreluje ze stanem psychicznym, nie oznacza jeszcze, że jest jego specyficznym markerem. Z tego powodu system projektowany odpowiedzialnie nie może traktować pojedynczej cechy, np. liczby kroków, jako „dowodu depresji”.

Najczęstsze źródła błędnej interpretacji to:

- **konfuzja kontekstowa** - mała liczba kroków może wynikać z pracy zdalnej lub kontuzji,
- **braki danych** - czujnik może być wyłączony albo telefon pozostawiony w domu,
- **sezonowość i rytm tygodnia** - zachowanie w weekend różni się od zachowania w dni robocze,
- **zróżnicowanie indywidualne** - dla jednej osoby 6000 kroków to bardzo mało, dla innej norma.

Dlatego w analizie preferuje się nie tyle surowe poziomy, ile **zmianę względem własnej normy bazowej użytkownika**.

---

## 4. Kluczowe pojęcia analityczne

### 4.1. Linia bazowa użytkownika

Linia bazowa to typowy poziom funkcjonowania danej osoby w stabilnym okresie. Jest kluczowa, ponieważ zdrowie psychiczne opisuje się częściej przez **odchylenie od własnego wzorca** niż przez porównanie do „średniej populacyjnej”.

Przykład:

- dla użytkownika A normalne może być 12 000 kroków dziennie,
- dla użytkownika B normalne może być 4500 kroków dziennie.

Ten sam wynik 5000 kroków będzie więc oznaczał dla nich coś zupełnie innego.

### 4.2. Entropia lokalizacji

W literaturze mobilność przestrzenna bywa opisywana przez **entropię lokalizacji**, czyli miarę różnorodności miejsc odwiedzanych przez użytkownika:

`H = -Σ p(i) * log2 p(i)`

gdzie `p(i)` oznacza udział czasu spędzanego w lokalizacji `i`.

#### Dlaczego entropia jest lepsza niż zwykła liczba miejsc?

Bo uwzględnia nie tylko to, ile miejsc odwiedzono, ale także **jak rozłożony był czas pobytu**. Osoba odwiedzająca trzy miejsca, ale spędzająca 95% czasu w jednym, ma znacznie mniej zróżnicowany wzorzec funkcjonowania niż osoba realnie przemieszczająca się pomiędzy nimi.

### 4.3. Regularność rytmu dobowego

Wiele badań pokazuje, że nie tylko długość snu, ale również **regularność godzin zasypiania i budzenia** wiąże się z dobrostanem psychicznym. Z tego powodu aplikacje nie powinny skupiać się wyłącznie na prostym pytaniu „ile spałeś?”, lecz także na zmienności godzin snu między dniami.

---

## 5. Przykładowa architektura aplikacji mobilnej zdrowia psychicznego

W dobrze zaprojektowanym systemie warto rozdzielić kilka warstw odpowiedzialności.

1. **Warstwa prezentacji** - interfejs użytkownika, formularze, wykresy, powiadomienia.
2. **Warstwa domenowa** - reguły biznesowe, obliczanie trendu, logika interwencji.
3. **Warstwa danych** - lokalna baza danych, synchronizacja, repozytoria.
4. **Warstwa sensing'u** - pobieranie danych z API systemowych i sensorów.
5. **Warstwa analityczna** - ekstrakcja cech, modele predykcyjne, walidacja.
6. **Warstwa prywatności i bezpieczeństwa** - zgody, uprawnienia, minimalizacja danych.

### Dlaczego taki podział jest zalecany?

Ponieważ aplikacje zdrowia psychicznego zmieniają się ewolucyjnie. Na początku projekt może być prostym dziennikiem nastroju, ale z czasem dochodzi analiza snu, integracja z urządzeniami ubieralnymi, eksport danych dla terapeuty czy nowe reguły interwencyjne. Jeśli kod interfejsu, analityki i dostępu do danych jest ze sobą silnie splątany, rozwój systemu staje się ryzykowny i kosztowny.

### Architektura przepływu danych

```text
Użytkownik -> Interfejs (EMA, ćwiczenia, ustawienia)
          -> Repozytorium lokalne -> Baza danych
Sensory / API systemowe -> Warstwa sensing'u -> Ekstrakcja cech
Ekstrakcja cech -> Model trendu / predykcji -> Silnik interwencji
Silnik interwencji -> Powiadomienia / sugestie / zasoby kryzysowe
```

### Dlaczego preferuje się podejście local-first?

W systemach przetwarzających dane wrażliwe coraz częściej preferuje się architekturę, w której:

- surowe dane pozostają lokalnie na urządzeniu,
- do chmury trafiają tylko wyniki zagregowane albo zanonimizowane,
- część analizy jest wykonywana na urządzeniu.

Redukuje to ryzyko naruszenia prywatności, upraszcza zgodność z regulacjami i zwiększa zaufanie użytkownika. Dodatkowo zmniejsza zapotrzebowanie na transmisję danych i bywa korzystne energetycznie.

---

## 6. Projektowanie dziennika nastroju

Dziennik nastroju jest często najbezpieczniejszym punktem wejścia do aplikacji zdrowia psychicznego. Umożliwia samoobserwację, a jednocześnie nie wymaga od razu dostępu do szerokiego zestawu danych osobowych.

### 6.1. Jakie pola warto zapisywać?

Najczęściej stosuje się:

- ocenę nastroju w skali liczbowej,
- listę dominujących emocji,
- krótką notatkę tekstową,
- znacznik czasu,
- opcjonalnie kontekst, np. sen, poziom energii, stres.

### Dlaczego skala 1–10 jest częsta, ale nie jedyna?

Skala 1–10 jest intuicyjna i wygodna dla użytkownika. Z punktu widzenia analizy statystycznej dostarcza więcej rozdzielczości niż skala 1–5, ale nie jest tak męcząca jak bardzo szczegółowe skale ciągłe. Nie oznacza to jednak, że jest „najbardziej naukowa”. W praktyce wybór skali to kompromis między prostotą obsługi a czułością pomiaru.

### 6.2. Model danych wpisu nastroju

```kotlin
import androidx.room.Entity
import androidx.room.PrimaryKey
import java.time.Instant

@Entity(tableName = "mood_entries")
data class MoodEntryEntity(
    @PrimaryKey(autoGenerate = true)
    val id: Long = 0,
    val score: Int,                    // 1..10
    val energy: Int,                   // 1..10
    val stress: Int,                   // 1..10
    val emotionsCsv: String,           // np. "smutek,lęk,zmęczenie"
    val note: String,
    val createdAtEpochMillis: Long = Instant.now().toEpochMilli()
)
```

### Dlaczego dane emocji bywają przechowywane jako CSV lub JSON?

W prototypach edukacyjnych i MVP taki zapis upraszcza implementację. W systemie produkcyjnym często korzystniejsze jest znormalizowanie modelu i przechowywanie emocji w tabeli relacyjnej albo w strukturze JSON z walidacją. Wersja uproszczona jest jednak wystarczająca do pokazania mechanizmu działania.

### 6.3. DAO i podstawowe zapytania

```kotlin
import androidx.room.Dao
import androidx.room.Insert
import androidx.room.OnConflictStrategy
import androidx.room.Query
import kotlinx.coroutines.flow.Flow

@Dao
interface MoodEntryDao {

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insert(entry: MoodEntryEntity)

    @Query("SELECT * FROM mood_entries ORDER BY createdAtEpochMillis DESC")
    fun observeAll(): Flow<List<MoodEntryEntity>>

    @Query(
        """
        SELECT * FROM mood_entries
        WHERE createdAtEpochMillis BETWEEN :fromEpoch AND :toEpoch
        ORDER BY createdAtEpochMillis ASC
        """
    )
    suspend fun getRange(fromEpoch: Long, toEpoch: Long): List<MoodEntryEntity>
}
```

### Dlaczego obserwacja danych jako `Flow` jest użyteczna?

Ponieważ interfejs może reagować na zmiany automatycznie. Jeśli użytkownik zapisze nowy wpis, wykres czy panel podsumowania zaktualizuje się bez ręcznego odświeżania. W aplikacjach zdrowotnych poprawia to czytelność i zmniejsza ryzyko niespójności między stanem danych a widokiem.

### 6.4. Formularz w Jetpack Compose

```kotlin
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.material3.Button
import androidx.compose.material3.FilterChip
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.Slider
import androidx.compose.material3.Text
import androidx.compose.runtime.*
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp
import kotlinx.coroutines.launch

@Composable
fun MoodJournalEntryScreen(
    onSave: suspend (MoodEntryEntity) -> Unit
) {
    val scope = rememberCoroutineScope()
    var moodScore by remember { mutableIntStateOf(5) }
    var energy by remember { mutableIntStateOf(5) }
    var stress by remember { mutableIntStateOf(5) }
    var note by remember { mutableStateOf("") }
    var selectedEmotions by remember { mutableStateOf(setOf<String>()) }

    val emotions = listOf(
        "radość", "spokój", "smutek", "lęk", "złość", "zmęczenie", "poczucie winy"
    )

    Column(modifier = Modifier.padding(16.dp)) {
        Text("Dziennik nastroju", style = MaterialTheme.typography.headlineSmall)

        Text("Nastrój: $moodScore/10")
        Slider(
            value = moodScore.toFloat(),
            onValueChange = { moodScore = it.toInt() },
            valueRange = 1f..10f,
            steps = 8
        )

        Text("Energia: $energy/10")
        Slider(
            value = energy.toFloat(),
            onValueChange = { energy = it.toInt() },
            valueRange = 1f..10f,
            steps = 8
        )

        Text("Stres: $stress/10")
        Slider(
            value = stress.toFloat(),
            onValueChange = { stress = it.toInt() },
            valueRange = 1f..10f,
            steps = 8
        )

        emotions.forEach { emotion ->
            FilterChip(
                selected = emotion in selectedEmotions,
                onClick = {
                    selectedEmotions = if (emotion in selectedEmotions) {
                        selectedEmotions - emotion
                    } else {
                        selectedEmotions + emotion
                    }
                },
                label = { Text(emotion) }
            )
        }

        OutlinedTextField(
            modifier = Modifier.fillMaxWidth(),
            value = note,
            onValueChange = { note = it },
            label = { Text("Notatka") }
        )

        Button(
            modifier = Modifier.fillMaxWidth(),
            onClick = {
                val entity = MoodEntryEntity(
                    score = moodScore,
                    energy = energy,
                    stress = stress,
                    emotionsCsv = selectedEmotions.joinToString(","),
                    note = note.trim()
                )
                scope.launch {
                    onSave(entity)
                }
            }
        ) {
            Text("Zapisz wpis")
        }
    }
}
```

### Dlaczego pytamy osobno o nastrój, energię i stres?

Ponieważ pojedynczy wskaźnik „samopoczucia” bywa zbyt ogólny. Użytkownik może czuć niski nastrój, ale równocześnie wysoki poziom pobudzenia lękowego. Może też mieć dobry nastrój przy niskiej energii. Rozdzielenie tych wymiarów poprawia jakość analizy.

---

## 7. Pasywne monitorowanie i integracja z API zdrowotnymi

### 7.1. Dlaczego warto korzystać z warstw systemowych, takich jak Health Connect i HealthKit?

Współczesne platformy mobilne oferują mechanizmy pośredniczące między aplikacją a danymi zdrowotnymi. Na Androidzie taką rolę pełni **Health Connect**, a w ekosystemie Apple **HealthKit**.

Korzystanie z tych warstw ma kilka zalet:

- centralizuje zgodę użytkownika,
- upraszcza interoperacyjność między aplikacjami,
- redukuje konieczność bezpośredniego pobierania części danych z wielu źródeł,
- wzmacnia model prywatności i kontroli dostępu.

To ważne także architektonicznie. Zamiast implementować osobny importer kroków dla każdej opaski lub aplikacji, projektant może korzystać ze wspólnego repozytorium danych zdrowotnych. Jest to rozwiązanie bardziej skalowalne i mniej podatne na błędy integracyjne.

### 7.2. Przykład modelu danych pasywnych

```kotlin
data class PassiveSensingData(
    val timestampEpochMillis: Long,
    val stepCount: Int,
    val sleepDurationMinutes: Long,
    val sleepRegularityScore: Float,
    val screenOnDurationMinutes: Long,
    val locationEntropy: Float,
    val homeTimeMinutes: Long,
    val socialInteractionScore: Float
)
```

### Dlaczego nie przechowujemy wszystkiego jako surowych strumieni sensorowych?

Bo surowe dane są kosztowne w przechowywaniu, trudniejsze w interpretacji i bardziej wrażliwe prywatnościowo. W praktyce często korzystniej jest zapisywać **cechy zagregowane** w oknach czasowych, np. dziennych lub godzinowych.

### 7.3. Przykład odczytu kroków z Health Connect

```kotlin
import androidx.health.connect.client.HealthConnectClient
import androidx.health.connect.client.permission.HealthPermission
import androidx.health.connect.client.records.StepsRecord
import androidx.health.connect.client.request.ReadRecordsRequest
import androidx.health.connect.client.time.TimeRangeFilter
import java.time.Instant
import java.time.temporal.ChronoUnit

class ActivityRepository(
    private val healthConnectClient: HealthConnectClient
) {

    val permissions = setOf(
        HealthPermission.getReadPermission(StepsRecord::class)
    )

    suspend fun readStepsLast7Days(): Int {
        val end = Instant.now()
        val start = end.minus(7, ChronoUnit.DAYS)

        val response = healthConnectClient.readRecords(
            ReadRecordsRequest(
                recordType = StepsRecord::class,
                timeRangeFilter = TimeRangeFilter.between(start, end)
            )
        )

        return response.records.sumOf { it.count.toInt() }
    }
}
```

### Dlaczego lepiej sumować kroki w oknie 7-dniowym niż oceniać pojedynczy dzień?

Pojedynczy dzień jest bardzo podatny na zakłócenia losowe. Użytkownik może mieć podróż, chorobę, spotkanie całodniowe albo po prostu zapomnieć telefonu. Agregacja na poziomie kilku dni daje bardziej stabilny wskaźnik behawioralny.

### 7.4. Przykład obliczania regularności snu

```kotlin
import kotlin.math.abs

data class SleepWindow(
    val bedtimeMinutes: Int,   // minuty od północy
    val wakeMinutes: Int
)

fun calculateSleepRegularity(windows: List<SleepWindow>): Float {
    if (windows.size < 2) return 0f

    val bedtimeDiffs = windows.zipWithNext { a, b ->
        abs(a.bedtimeMinutes - b.bedtimeMinutes).toFloat()
    }

    val avgDiff = bedtimeDiffs.average().toFloat()

    // 0 oznacza bardzo nieregularnie, 1 oznacza wysoką regularność
    return (1f - (avgDiff / 240f)).coerceIn(0f, 1f)
}
```

### Dlaczego regularność snu jest liczona pośrednio, a nie tylko przez długość snu?

Bo dwie osoby mogą spać po 7 godzin, ale jedna kładzie się codziennie około 23:00, a druga raz o 22:00, raz o 3:00 nad ranem. Klinicznie te sytuacje nie są równoważne. Regularność jest więc ważnym wymiarem jakości funkcjonowania.

---

## 8. Ekstrakcja cech i przygotowanie danych do modelowania

Surowe dane nie są jeszcze dobrym wejściem dla modelu analitycznego. Zwykle trzeba przygotować **cechy pochodne**.

Przykłady:

- procentowa zmiana liczby kroków względem linii bazowej,
- odchylenie standardowe godzin zasypiania,
- różnica między dniami roboczymi a weekendem,
- liczba dni z bardzo niskim nastrojem w ostatnich 14 dniach,
- średni czas ekranu po godzinie 22:00,
- trend tygodniowy zamiast pojedynczego pomiaru.

### Dlaczego modelowanie na cechach pochodnych jest lepsze?

Ponieważ odzwierciedla mechanizmy psychologiczne i ogranicza szum. Sam surowy licznik „7300 kroków” mówi niewiele. Znacznie bardziej informatywne jest to, że liczba kroków spadła o 42% względem typowego tygodnia użytkownika.

### 8.1. Przykład obliczania cech

```kotlin
data class DailySummary(
    val steps: Int,
    val sleepMinutes: Long,
    val moodScore: Int?,
    val screenMinutesAfter22: Int,
    val locationEntropy: Float
)

fun buildFeatures(
    baseline: List<DailySummary>,
    currentWeek: List<DailySummary>
): Map<String, Float> {

    fun avgSteps(list: List<DailySummary>) = list.map { it.steps }.average().toFloat()
    fun avgSleep(list: List<DailySummary>) = list.map { it.sleepMinutes }.average().toFloat()
    fun avgLateScreen(list: List<DailySummary>) = list.map { it.screenMinutesAfter22 }.average().toFloat()
    fun avgEntropy(list: List<DailySummary>) = list.map { it.locationEntropy }.average().toFloat()

    val baselineSteps = avgSteps(baseline).coerceAtLeast(1f)
    val baselineSleep = avgSleep(baseline).coerceAtLeast(1f)

    return mapOf(
        "stepCountChange" to ((avgSteps(currentWeek) - baselineSteps) / baselineSteps),
        "sleepChange" to ((avgSleep(currentWeek) - baselineSleep) / baselineSleep),
        "screenTimeEvening" to avgLateScreen(currentWeek),
        "locationDiversity" to avgEntropy(currentWeek)
    )
}
```

### Dlaczego używa się okna bazowego i okna bieżącego?

To klasyczny sposób porównywania funkcjonowania „teraz” do funkcjonowania „zwykle”. Taka relacja bywa bardziej trafna niż użycie pojedynczej wartości absolutnej.

---

## 9. Modele predykcji nastroju i ryzyka

W systemach edukacyjnych i badawczych warto zaczynać od modeli **interpretowalnych**, nawet jeśli nie są one najbardziej złożone.

### 9.1. Prosty model liniowy

```kotlin
class MoodPredictionModel {

    private val weights = mapOf(
        "stepCountChange" to -0.35f,
        "sleepIrregularity" to -0.40f,
        "socialInteractionScore" to 0.25f,
        "locationDiversity" to 0.20f,
        "screenTimeEvening" to -0.15f
    )

    fun predictMoodScore(features: Map<String, Float>): Float {
        val baseScore = 5.5f
        val delta = features.entries.sumOf { (name, value) ->
            ((weights[name] ?: 0f) * value).toDouble()
        }.toFloat()

        return (baseScore + delta).coerceIn(1f, 10f)
    }
}
```

### Dlaczego interpretowalność jest tak ważna?

W zdrowiu psychicznym użytkownik i specjalista powinni rozumieć, co wpłynęło na ocenę modelu. Jeśli system sygnalizuje spadek dobrostanu, dobrze móc wskazać, że wynika to np. z dużej nieregularności snu i spadku aktywności, a nie z „ukrytej reprezentacji” sieci neuronowej, której działania nie da się objaśnić.

### 9.2. Przykład prostego wykrywania sygnałów alarmowych

```kotlin
fun detectRiskFlags(
    recentMoodScores: List<Int>,
    avgStepsLast7Days: Int,
    sleepRegularity: Float
): List<String> {
    val flags = mutableListOf<String>()

    if (recentMoodScores.takeLast(5).count { it <= 3 } >= 3) {
        flags += "powtarzający się niski nastrój"
    }

    if (avgStepsLast7Days < 1500) {
        flags += "bardzo niska aktywność"
    }

    if (sleepRegularity < 0.35f) {
        flags += "silnie nieregularny sen"
    }

    return flags
}
```

### Dlaczego warto stosować reguły razem z modelami ML?

Bo reguły są transparentne i łatwe do walidacji. W praktyce wiele systemów korzysta z podejścia hybrydowego:

- reguły odpowiadają za bezpieczne minimum,
- modele statystyczne zwiększają czułość i personalizację.

To szczególnie ważne w obszarach, w których fałszywy alarm może stresować użytkownika, a przeoczenie rzeczywistego pogorszenia stanu jest niepożądane.

### 9.3. Dlaczego nie należy utożsamiać predykcji z diagnozą?

Ponieważ model przewiduje wzorzec statystyczny, a nie rozpoznanie kliniczne. Depresja, zaburzenia lękowe czy kryzysy suicydalne są zjawiskami złożonymi i wymagają oceny profesjonalnej. Predykcja w aplikacji powinna być interpretowana jako **sygnał do refleksji lub dalszej oceny**, a nie jako ostateczny werdykt.

---

## 10. Wizualizacja trendów i informacja zwrotna dla użytkownika

W aplikacjach zdrowia psychicznego sama analiza nie wystarczy. Trzeba jeszcze zaprezentować ją w sposób zrozumiały i niealarmistyczny.

### Dlaczego wizualizacja trendu jest lepsza niż pojedyncza liczba?

Bo użytkownik funkcjonuje w czasie. Jednorazowy wynik 4/10 nie mówi, czy jest to krótkotrwałe pogorszenie, czy część dłuższego trendu spadkowego. Wykres umożliwia szybką interpretację dynamiki.

```kotlin
import androidx.compose.foundation.Canvas
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.unit.dp

@Composable
fun MoodTrendChart(entries: List<MoodEntryEntity>) {
    if (entries.isEmpty()) return

    val points = entries.takeLast(30).sortedBy { it.createdAtEpochMillis }

    Canvas(
        modifier = Modifier
            .fillMaxWidth()
            .height(180.dp)
            .padding(16.dp)
    ) {
        val stepX = size.width / (points.size - 1).coerceAtLeast(1)
        val scaleY = size.height / 10f

        for (i in 1 until points.size) {
            val x1 = (i - 1) * stepX
            val y1 = size.height - points[i - 1].score * scaleY
            val x2 = i * stepX
            val y2 = size.height - points[i].score * scaleY
            drawLine(
                color = Color(0xFF3F51B5),
                start = Offset(x1, y1),
                end = Offset(x2, y2),
                strokeWidth = 4f
            )
        }
    }
}
```

### Dlaczego w interfejsie nie należy używać przesadnie dramatycznego języka?

Komunikaty typu „Wykryto zagrożenie!” mogą nasilać lęk i zniechęcać do korzystania z aplikacji. Wrażliwe systemy powinny komunikować się spokojnie, precyzyjnie i z zachowaniem autonomii użytkownika, np. „W ostatnich dniach Twój rytm snu stał się mniej regularny. Czy chcesz przejrzeć wpisy lub wykonać krótkie ćwiczenie oddechowe?”.

---

## 11. Interwencje cyfrowe i powiadomienia

W literaturze często używa się pojęcia **JITAI** (*Just-In-Time Adaptive Intervention*), czyli interwencji dostarczanej wtedy, gdy może być najbardziej użyteczna. Nie chodzi zatem wyłącznie o to, by wysłać jakiekolwiek powiadomienie, lecz by zrobić to we właściwym czasie i w odpowiedniej formie.

### Dlaczego moment interwencji ma znaczenie?

Ta sama sugestia - np. „zrób 3 minuty ćwiczenia oddechowego” - może być pomocna wieczorem po stresującym dniu, ale irytująca podczas zajęć, rozmowy lub snu. Dlatego silnik interwencji powinien uwzględniać:

- porę dnia,
- historię reakcji użytkownika,
- aktualny kontekst,
- częstotliwość wcześniejszych powiadomień.

### 11.1. Przykład przypomnienia o check-inie

```kotlin
import android.app.PendingIntent
import android.content.Context
import android.content.Intent
import androidx.core.app.NotificationCompat
import androidx.core.app.NotificationManagerCompat
import androidx.work.CoroutineWorker
import androidx.work.WorkerParameters

class MoodReminderWorker(
    appContext: Context,
    params: WorkerParameters
) : CoroutineWorker(appContext, params) {

    override suspend fun doWork(): Result {
        showMoodCheckInNotification()
        return Result.success()
    }

    private fun showMoodCheckInNotification() {
        val intent = Intent(applicationContext, MainActivity::class.java)
            .putExtra("open_mood_entry", true)

        val pendingIntent = PendingIntent.getActivity(
            applicationContext,
            0,
            intent,
            PendingIntent.FLAG_IMMUTABLE
        )

        val notification = NotificationCompat.Builder(applicationContext, "mood_channel")
            .setSmallIcon(R.drawable.ic_notification)
            .setContentTitle("Krótki check-in")
            .setContentText("Poświęć chwilę na zapisanie nastroju i poziomu energii.")
            .setAutoCancel(true)
            .setContentIntent(pendingIntent)
            .build()

        NotificationManagerCompat.from(applicationContext)
            .notify(1001, notification)
    }
}
```

### Dlaczego przypomnienia nie powinny być zbyt częste?

Bo dochodzi do zjawiska **notification fatigue**. Użytkownik przestaje reagować, wycisza aplikację albo ją odinstalowuje. W systemach wspierających zdrowie psychiczne nadmierna liczba komunikatów może być dodatkowo odbierana jako presja lub kontrola.

---

## 12. Projektowanie bezpiecznej ścieżki kryzysowej

Jednym z najważniejszych elementów aplikacji zdrowia psychicznego jest odpowiedzialne postępowanie w sytuacjach potencjalnego kryzysu.

### Co powinna robić aplikacja?

- prezentować łatwo dostępne zasoby pomocowe,
- nie pozostawiać użytkownika bez informacji, gdzie może uzyskać wsparcie,
- unikać udawania, że sama zapewnia pomoc kliniczną,
- umożliwiać szybkie przejście do kontaktu alarmowego lub telefonu zaufania.

### Dlaczego aplikacja nie powinna „diagnozować kryzysu” z pełną pewnością?

Bo dostępne sygnały są pośrednie i niepewne. Niski nastrój, brak snu i mała aktywność zwiększają ryzyko, ale nie są jednoznacznym dowodem stanu kryzysowego. Interfejs i logika aplikacji powinny być projektowane tak, aby reagować pomocowo, a nie autorytarnie.

### 12.1. Przykład komponentu z zasobami pomocowymi

```kotlin
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.padding
import androidx.compose.material3.Card
import androidx.compose.material3.CardDefaults
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp

@Composable
fun CrisisResourcesBanner() {
    Card(
        colors = CardDefaults.cardColors(
            containerColor = MaterialTheme.colorScheme.errorContainer
        )
    ) {
        Column(modifier = Modifier.padding(16.dp)) {
            Text("Potrzebujesz wsparcia?", fontWeight = FontWeight.Bold)
            Text("Telefon zaufania dla dorosłych: 116 123")
            Text("Telefon zaufania dla dzieci i młodzieży: 116 111")
            Text("Jeśli istnieje bezpośrednie zagrożenie życia lub zdrowia, skontaktuj się z numerem alarmowym 112.")
        }
    }
}
```

---

## 13. Etyka projektowania

Aplikacje zdrowia psychicznego muszą być analizowane nie tylko pod kątem funkcjonalnym, ale również etycznym.

### 13.1. Zasada minimalizacji danych

Powinno się zbierać tylko te dane, które są naprawdę potrzebne do realizacji celu aplikacji.

#### Dlaczego to takie ważne?

Bo dane o emocjach, zachowaniu, śnie, aktywności czy lokalizacji są szczególnie wrażliwe. Nadmiarowe gromadzenie danych zwiększa ryzyko nadużyć, wycieku oraz utraty zaufania.

### 13.2. Transparentność celu

Użytkownik powinien rozumieć:

- jakie dane są zbierane,
- po co są zbierane,
- czy są przetwarzane lokalnie czy w chmurze,
- jak długo są przechowywane,
- w jaki sposób można je usunąć.

#### Dlaczego transparentność jest częścią jakości technicznej, a nie wyłącznie etyki?

Ponieważ poprawia jakość danych. Użytkownik, który rozumie sens pomiaru i ufa systemowi, częściej udziela świadomej zgody i rzadziej porzuca aplikację.

### 13.3. Unikanie dark patterns

W aplikacjach zdrowotnych nie należy stosować mechanizmów wymuszających uwagę, zawstydzających użytkownika albo budujących zależność od aplikacji.

Przykłady niepożądanych rozwiązań:

- komunikaty sugerujące winę za brak wpisu,
- agresywne serie powiadomień,
- ranking „najbardziej zestresowanych dni” bez sensownego celu terapeutycznego,
- nagrody za „utrzymanie lęku pod kontrolą” w sposób infantylizujący problem.

### 13.4. Dostępność

Użytkownicy w gorszym stanie psychicznym mogą mieć obniżoną koncentrację, mniejszą tolerancję poznawczą i wyższy poziom przeciążenia bodźcami. Dlatego interfejs powinien być:

- prosty,
- czytelny,
- spokojny wizualnie,
- wspierający, a nie oceniający.

---

## 14. Prywatność, bezpieczeństwo i regulacje

### 14.1. Dane zdrowia psychicznego jako dane szczególnej kategorii

W europejskim porządku prawnym informacje dotyczące zdrowia są traktowane jako szczególna kategoria danych osobowych. Oznacza to podwyższone wymagania dotyczące podstawy przetwarzania, zabezpieczeń i praw użytkownika.

### Dlaczego prawo traktuje te dane surowiej?

Ponieważ ich ujawnienie może prowadzić do dyskryminacji, stygmatyzacji lub naruszenia godności osoby. Dane dotyczące nastroju, leczenia psychiatrycznego, kryzysów psychicznych czy wzorców zachowania mogą być wyjątkowo wrażliwe społecznie i zawodowo.

### 14.2. Zasady bezpieczeństwa technicznego

W praktyce projektowej należy stosować co najmniej:

- kontrolę uprawnień zgodnie z zasadą najmniejszych przywilejów,
- szyfrowanie danych w spoczynku i w transmisji,
- separację identyfikatorów od danych behawioralnych,
- logowanie zdarzeń bezpieczeństwa bez ujawniania treści wrażliwych,
- możliwość usunięcia danych przez użytkownika.

### 14.3. Granica między aplikacją wellness a wyrobem medycznym

To jedno z najważniejszych zagadnień praktycznych. Aplikacja, która pomaga prowadzić dziennik nastroju, promuje ćwiczenia oddechowe i porządkuje dane użytkownika, zwykle pozostaje w obszarze wellness. Sytuacja zmienia się wtedy, gdy producent zaczyna deklarować, że system **diagnozuje**, **monitoruje klinicznie**, **zapobiega nawrotom choroby** albo **prowadzi terapię** w sensie medycznym.

#### Dlaczego deklaracja marketingowa ma znaczenie prawne?

Ponieważ regulacja wyrobu medycznego zależy nie tylko od kodu, ale również od **zamierzonego zastosowania** określonego przez producenta. Ta sama funkcja techniczna może podlegać różnym reżimom prawnym w zależności od tego, jak jest opisana i do czego formalnie służy.

---

## 15. Ograniczenia metod i pułapki interpretacyjne

### 15.1. Problem braku złotego standardu

W modelowaniu nastroju trudno o idealny „ground truth”. Samoopisy są subiektywne, ale właśnie subiektywność jest tu częścią badanego zjawiska. Oceny kliniczne są bardziej ustrukturyzowane, lecz rzadkie w czasie i kosztowne.

### 15.2. Drift behawioralny

Ludzie zmieniają zwyczaje. Przeprowadzka, nowa praca, zmiana planu dnia, narodziny dziecka czy rekonwalescencja mogą zmieniać wzorce zachowania niezależnie od kondycji psychicznej.

#### Dlaczego to problem dla modeli?

Bo model wytrenowany na starym wzorcu użytkownika może zacząć błędnie interpretować nowe zachowania jako pogorszenie stanu. Dlatego system musi okresowo aktualizować linię bazową lub umożliwiać jej rekalkulację.

### 15.3. Braki danych

Brak danych sam w sobie może być znaczący, ale równie dobrze może oznaczać problem techniczny. Jeśli telefon rozładował się lub użytkownik wyłączył zgodę, nie należy zbyt pochopnie wyciągać wniosków psychologicznych.

### 15.4. Błędy klasyfikacji

W zdrowiu psychicznym szczególnie istotne są dwa rodzaje błędów:

- **fałszywie dodatnie** - system sygnalizuje problem, choć go nie ma,
- **fałszywie ujemne** - system nie sygnalizuje problemu, choć użytkownik realnie potrzebuje wsparcia.

#### Dlaczego nie można po prostu maksymalizować dokładności?

Ponieważ klasy są często niezbalansowane, a koszt błędów jest asymetryczny. W praktyce ważniejsze bywa monitorowanie czułości, swoistości, precyzji i kalibracji niż samej „accuracy”.

---

## 16. Ocena jakości systemu

Aplikację zdrowia psychicznego należy oceniać na kilku poziomach.

### 16.1. Jakość techniczna

- stabilność działania,
- zużycie baterii,
- poprawność synchronizacji,
- wydajność obliczeń.

### 16.2. Jakość użytecznościowa

- czy użytkownik rozumie interfejs,
- czy powiadomienia nie są natarczywe,
- czy raporty są zrozumiałe,
- czy konfiguracja zgód jest czytelna.

### 16.3. Jakość kliniczna lub quasi-kliniczna

- czy system poprawia samoobserwację,
- czy zwiększa regularność wpisów,
- czy pomaga wcześniej zauważyć pogorszenie,
- czy rekomendacje są adekwatne i bezpieczne.

### Dlaczego sukcesu nie wolno mierzyć wyłącznie retencją?

Bo aplikacja może być „uzależniająca” lub nadmiernie angażująca, a mimo to nie poprawiać dobrostanu. W zdrowiu psychicznym wysoka częstotliwość użycia nie zawsze oznacza dobry wynik. Niekiedy lepszy jest system, który użytkownik uruchamia rzadziej, ale w sposób bardziej celowy i korzystny.

---

## 17. Ciekawostki i obserwacje z badań

1. **Różnorodność odwiedzanych miejsc** bywa bardziej informatywna niż sama odległość pokonywana w ciągu dnia. Oznacza to, że wzorzec życia społecznego i rutyny może mieć większe znaczenie niż „liczba kilometrów”.

2. **Sen regularny** bywa lepszym predyktorem dobrostanu niż sam całkowity czas snu. Dwie osoby mogą spać tyle samo, ale diametralnie różnić się stabilnością rytmu dobowego.

3. **Jedno urządzenie może pełnić wiele ról jednocześnie**: dziennika, czujnika, kanału interwencji i repozytorium danych. To czyni smartfon potężnym narzędziem badawczym, ale również zwiększa odpowiedzialność projektanta za prywatność.

4. **Ta sama cecha może mieć inne znaczenie u różnych osób**. Dla ekstrawertyka spadek liczby rozmów może być silnym sygnałem zmian nastroju, a dla introwertyka pozostawać w granicach normy.

5. **Najcenniejsze systemy nie są koniecznie najbardziej złożone**. Często największą użyteczność daje aplikacja, która bardzo dobrze realizuje kilka prostych funkcji: check-in, wykres trendu, notatkę, sen i bezpieczne zasoby pomocowe.

---

## 18. Krótki przykład kompletnego przepływu aplikacji

Poniższy fragment pokazuje uproszczony schemat: zapis check-inu, pobranie danych aktywności, zbudowanie cech i wygenerowanie wyniku trendu.

```kotlin
class MentalHealthUseCase(
    private val moodDao: MoodEntryDao,
    private val activityRepository: ActivityRepository,
    private val model: MoodPredictionModel
) {

    suspend fun saveMoodEntry(entry: MoodEntryEntity) {
        moodDao.insert(entry)
    }

    suspend fun buildWeeklyWellbeingEstimate(): Float {
        val steps7d = activityRepository.readStepsLast7Days()

        val features = mapOf(
            "stepCountChange" to ((steps7d - 42000f) / 42000f),   // przykład względem linii bazowej
            "sleepIrregularity" to -0.2f,
            "socialInteractionScore" to 0.1f,
            "locationDiversity" to 0.15f,
            "screenTimeEvening" to 0.3f
        )

        return model.predictMoodScore(features)
    }
}
```

### Dlaczego taki przykład jest uproszczony?

Ponieważ w realnym systemie:

- linia bazowa byłaby obliczana indywidualnie,
- cechy byłyby normalizowane,
- interwencje byłyby zależne od kontekstu,
- wynik modelu byłby kalibrowany i walidowany,
- logika bezpieczeństwa działałaby niezależnie od wyniku modelu.

Mimo to przykład pokazuje podstawową ideę architektoniczną: **zebrane dane -> przetworzone cechy -> wynik analityczny -> informacja zwrotna**.

---

## 19. Android i iOS - podobieństwa i różnice

Choć ogólna logika aplikacji zdrowia psychicznego jest wspólna dla obu platform, istnieją różnice implementacyjne.

### Android

- duże znaczenie ma integracja z **Health Connect**,
- łatwo budować interfejs w **Jetpack Compose**,
- system daje sporą elastyczność w pracy z zadaniami okresowymi i repozytoriami danych.

### iOS

- centralnym komponentem jest **HealthKit**,
- silny nacisk położony jest na precyzyjne uprawnienia i prywatność,
- istotną rolę odgrywa ekosystem iPhone + Apple Watch.

### Dlaczego warto uczyć się wzorca przenośnego, a nie tylko API jednej platformy?

Bo zasady domenowe pozostają podobne: minimalizacja danych, lokalna analiza, interpretowalne cechy, bezpieczna interwencja, ostrożne wnioskowanie. To one powinny stanowić rdzeń projektu, a konkretne API są jedynie narzędziem realizacji tych zasad.

---

## 20. Podsumowanie

Aplikacje wspierające zdrowie psychiczne są jednym z najbardziej interdyscyplinarnych obszarów współczesnego rozwoju oprogramowania mobilnego. Łączą wiedzę z zakresu psychologii, medycyny, analizy danych, bezpieczeństwa informacji i projektowania interfejsów.

Najważniejsze wnioski są następujące:

- samo zbieranie danych nie wystarcza; kluczowa jest ich poprawna interpretacja,
- dane aktywne i pasywne wzajemnie się uzupełniają,
- analiza powinna odnosić się do indywidualnej linii bazowej użytkownika,
- modele interpretowalne są szczególnie cenne w zastosowaniach zdrowotnych,
- prywatność i etyka nie są dodatkiem, lecz rdzeniem projektu,
- aplikacja powinna wspierać użytkownika, a nie zastępować profesjonalną diagnozę czy terapię.

Dobrze zaprojektowany system nie obiecuje zbyt wiele. Zamiast tego oferuje użytkownikowi czytelne narzędzia samoobserwacji, bezpieczne wsparcie oraz informacje zwrotne oparte na danych i interpretowane z należytą ostrożnością.

---

## 21. Wybrane źródła i literatura uzupełniająca

1. Wang, R. i in., *StudentLife: Assessing Mental Health, Academic Performance and Behavioral Trends of College Students using Smartphones*, UbiComp 2014.
2. Torous, J., Kiang, M. V., Lorme, J., Onnela, J.-P., *New Tools for New Research in Psychiatry: A Scalable and Customizable Platform to Empower Data Driven Smartphone Research*, JMIR Mental Health, 2016.
3. Onnela, J.-P., Rauch, S. L., *Harnessing Smartphone-Based Digital Phenotyping to Enhance Behavioral and Mental Health*, Neuropsychopharmacology, 2016.
4. World Health Organization, *Recommendations on Digital Interventions for Health System Strengthening*.
5. World Health Organization, materiały dotyczące digital health i treści wspierających zdrowie psychiczne młodych osób w środowisku cyfrowym.
6. Android Developers, dokumentacja **Health Connect**.
7. Apple Developer Documentation, dokumentacja **HealthKit**.
8. EUR-Lex, **RODO / GDPR**.
9. EUR-Lex, **MDR 2017/745**.

### Przydatne odnośniki techniczne

- WHO Digital Health: https://www.who.int/health-topics/digital-health/
- WHO Guideline on Digital Health Interventions: https://www.who.int/publications/i/item/WHO-RHR-19.8
- Android Health Connect: https://developer.android.com/health-and-fitness/health-connect
- Android Health Connect data types: https://developer.android.com/health-and-fitness/health-connect/data-types
- Apple HealthKit: https://developer.apple.com/documentation/healthkit
- Apple HealthKit authorization: https://developer.apple.com/documentation/healthkit/authorizing-access-to-health-data
- GDPR: https://eur-lex.europa.eu/eli/reg/2016/679/oj/eng
- MDR 2017/745: https://eur-lex.europa.eu/eli/reg/2017/745/oj/eng
- Telefon zaufania 116 123: https://www.gov.pl/web/cyfryzacja/infolinia-116-123--pierwsza-pomoc-psychologiczna-w-zasiegu-telefonu-i-internetu2
- Telefon zaufania 116 111: https://116111.pl/

