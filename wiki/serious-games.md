# Gry poważne (Serious Games)

Gry poważne (*serious games*) to gry komputerowe, których głównym celem **nie jest rozrywka**, lecz osiągnięcie konkretnego efektu edukacyjnego, terapeutycznego, szkoleniowego lub społecznego. Rozrywka pełni rolę środka angażującego użytkownika, nie zaś celu samego w sobie. Platformy mobilne stały się wiodącym medium dla gier poważnych ze względu na powszechność smartfonów i możliwość dotarcia do szerokiej i zróżnicowanej grupy odbiorców.

---

## Definicja i historia

Termin *serious game* został spopularyzowany przez Clarka Abta w książce *Serious Games* (1970), który opisał gry jako narzędzie decyzyjne i symulacyjne. Współcześnie definicja obejmuje szerokie spektrum zastosowań:

> „Gra poważna to gra, w której edukacja (w szerokim sensie: poznawcza, emocjonalna, behawioralna) jest najważniejszym i wymaganym celem, a nie pobocznym celem." — Michael Zyda, 2005

### Oś czasu

| Rok | Wydarzenie |
|-----|-----------|
| 1970 | Clark Abt publikuje „Serious Games" |
| 1980 | „The Oregon Trail" — pierwsze masowe zastosowanie gier w edukacji |
| 2002 | US Army wydaje „America's Army" — szkoleniowa gra militarna |
| 2004 | Ben Sawyer & David Rejeski używają terminu w kontekście cyfrowym |
| 2006 | Konferencja Serious Games Summit, Waszyngton |
| 2010 | Pierwsze gry poważne na iOS/Android |
| 2020 | Boom edukacyjnych gier mobilnych (pandemia COVID-19) |
| 2024 | AI-generowane treści w grach poważnych |

---

## Taksonomia gier poważnych

Gry poważne klasyfikuje się według dziedziny zastosowania:

### 1. Edukacyjne (Edugames)

Gry wspierające proces nauczania na wszystkich poziomach edukacji.

**Przykłady mobilne:**
- **Duolingo** — nauka języków przez grywalizację (gamification)
- **Kahoot!** — quizy klasowe w czasie rzeczywistym
- **DragonBox** — nauka algebry dla dzieci
- **Prodigy Math** — matematyka w kontekście RPG fantasy
- **Khan Academy Kids** — kompleksowa edukacja przedszkolna

**Mechaniki charakterystyczne:**
- Stopniowanie trudności (*scaffolding*)
- Natychmiastowe informacje zwrotne
- Systemy nagród (odznaki, punkty, rangi)
- Krótkie sesje nauki (micro-learning)

### 2. Terapeutyczne i zdrowotne (Health Games)

Gry wspomagające rehabilitację, terapię, profilaktykę zdrowotną.

**Przykłady mobilne:**
- **SuperBetter** — aplikacja oparta na psychologii pozytywnej
- **Re-Mission** — gra dla pacjentów onkologicznych (badania wykazały zwiększenie adherence do leczenia)
- **EndeavorRx** — pierwsza gra zatwierdzona przez FDA jako leczenie ADHD
- **Mango Health** — przypomnienia o lekach przez gamification
- **Lumosity** — trening poznawczy (kontrowersje co do skuteczności)

**Wyniki badań:**
| Zastosowanie | Badanie | Wynik |
|-------------|---------|-------|
| ADHD | EndeavorRx RCT (2020, n=348) | 36% poprawy w TOVA |
| Onkologia | Re-Mission (Kato et al., 2008) | +16% wiedzy o chorobie |
| Fizjoterapia | Dance Dance Revolution | Poprawa równowagi u seniorów |
| Depresja | SPARX (Fleming et al., 2012) | Skuteczność porównywalna z CBT |

### 3. Szkoleniowe i symulacyjne (Training & Simulation)

Gry zastępujące lub uzupełniające tradycyjne szkolenia zawodowe.

**Przykłady:**
- **Militarne**: Gry taktyczne armii USA, symulatory bojowe
- **Medyczne**: Surgical simulators, VirTrainer (dostępny mobilnie przez VR)
- **Lotnicze**: Symulatory awaryjne dla pilotów
- **Korporacyjne**: Onboarding gamification, szkolenia BHP
- **Firefighter VR** — szkolenie strażackie na Oculus + mobile controller

**Schemat projektowania symulacji:**

```
Cel szkoleniowy
      │
      ▼
Identyfikacja luki kompetencyjnej
      │
      ▼
Scenariusz (branching narrative)
      │
      ▼
Pętle feedbacku: działanie → konsekwencja → refleksja
      │
      ▼
Ocena (assessment embedded in gameplay)
```

### 4. Społeczne i zmiany zachowań (Social Impact Games)

Gry projektowane w celu zmiany postaw, budowania empatii lub angażowania w kwestie społeczne.

**Przykłady:**
- **Darfur is Dying** — symulacja kryzysu humanitarnego
- **Papers Please** — dylematy moralne uchodźców i biurokracji
- **That Dragon, Cancer** — narracja o chorobie dziecka
- **Spent** — symulacja ubóstwa (NYC)
- **Bury Me My Love** — historia uchodźcy na mobile (BAFTA 2018)

### 5. Korporacyjne i marketingowe (Advergames)

Gry tworzone przez marki w celach promocyjnych lub szkoleniowych dla pracowników.

**Przykłady:**
- **M&M's Eye Spy Pretzel** — kampania marketingowa
- **Nike Training Club** — grywalizacja aktywności fizycznej
- **Starbucks Rewards** — program lojalnościowy jako gra
- **McDonald's Monopoly** — hybrydowa gra promocyjna

---

## Model projektowania gier poważnych

### Framework MDA (Mechanics, Dynamics, Aesthetics)

Gry poważne korzystają ze standardowego frameworka MDA, z modyfikacją — **cel edukacyjny/terapeutyczny** jest równorzędny z *Aesthetics*:

```
┌──────────────┬──────────────────┬───────────────────────────────┐
│  Mechanics   │    Dynamics      │         Aesthetics            │
│  (zasady,    │  (zachowania     │  (doznania gracza)            │
│   systemy)   │   emergentne)    │                               │
├──────────────┼──────────────────┼───────────────────────────────┤
│ Punktacja    │ Rywalizacja      │ Poczucie osiągnięcia          │
│ Poziomy      │ Współpraca       │ Ciekawość                     │
│ Questy       │ Eksploracja      │ Zaangażowanie                 │
│ Awatary      │ Optymalizacja    │ Empatia (social games)        │
│ Feedback     │ Eksperymentowanie│ Satysfakcja z nauki           │
└──────────────┴──────────────────┴───────────────────────────────┘
                                           +
                                  ┌─────────────────┐
                                  │  Cel poważny    │
                                  │ (edukacja,      │
                                  │  terapia, etc.) │
                                  └─────────────────┘
```

### Model Pełnego Cyklu Projektowania (Full Design Cycle)

```
1. ANALIZA POTRZEB
   └─ Kto jest odbiorcą? Jaki problem rozwiązujemy?

2. CELE UCZENIA / TERAPII
   └─ SMART: Specific, Measurable, Achievable, Relevant, Time-bound

3. PROJEKTOWANIE GRY
   ├─ Mechaniki rdzeniowe (core loop)
   ├─ Narracja i kontekst (optional)
   └─ System feedbacku i oceny

4. PROTOTYP → TEST Z UŻYTKOWNIKAMI
   └─ Iteracje: czy gra osiąga cel poważny?

5. IMPLEMENTACJA
   └─ Wybór platformy, silnika, docelowych urządzeń

6. EWALUACJA
   └─ A/B testy, badania skuteczności, analityka zachowań
```

---

## Implementacja gry poważnej na mobile — przykład edukacyjny

Poniżej przykład prostej gry quizowej w Kotlinie (Android) z mechanikami angażującymi:

### Architektura (MVVM)

```
├── ui/
│   ├── QuizScreen.kt      ← Composable UI
│   └── ResultScreen.kt
├── viewmodel/
│   └── QuizViewModel.kt   ← logika gry + learning analytics
├── data/
│   ├── QuestionRepository.kt
│   └── QuestionDatabase.kt  ← Room
└── model/
    ├── Question.kt
    └── UserProgress.kt
```

### Model danych

```kotlin
// Question.kt
@Entity(tableName = "questions")
data class Question(
    @PrimaryKey val id: Int,
    val text: String,
    val answers: List<String>,     // konwertowane przez TypeConverter
    val correctIndex: Int,
    val difficulty: Int,           // 1–3 (łatwe, średnie, trudne)
    val category: String,
    val explanation: String        // wyjaśnienie po odpowiedzi
)

// UserProgress.kt — dane analityczne
@Entity(tableName = "progress")
data class UserProgress(
    @PrimaryKey(autoGenerate = true) val id: Int = 0,
    val questionId: Int,
    val answeredCorrectly: Boolean,
    val responseTimeMs: Long,
    val timestamp: Long = System.currentTimeMillis()
)
```

### ViewModel z logiką adaptacyjną

```kotlin
// QuizViewModel.kt
@HiltViewModel
class QuizViewModel @Inject constructor(
    private val repository: QuestionRepository
) : ViewModel() {

    private val _state = MutableStateFlow(QuizState())
    val state: StateFlow<QuizState> = _state.asStateFlow()

    // Adaptacyjny dobór pytań — "computer adaptive testing" (CAT)
    fun loadNextQuestion() {
        viewModelScope.launch {
            val targetDifficulty = obliczTrudnosc()
            val question = repository.getQuestionByDifficulty(targetDifficulty)
            _state.update { it.copy(currentQuestion = question, startTime = System.currentTimeMillis()) }
        }
    }

    // Algorytm adaptacyjny: jeśli ostatnie 3 odpowiedzi były poprawne → podnieś trudność
    private fun obliczTrudnosc(): Int {
        val historia = _state.value.historia
        // Potrzebujemy min. 3 odpowiedzi zanim zaczniemy adaptować — wcześniej trzymamy domyślny poziom
        if (historia.size < 3) return _state.value.aktualnyPoziom
        val ostatnie = historia.takeLast(3)
        val poprawnosc = ostatnie.count { it.poprawna }.toFloat() / ostatnie.size
        return when {
            poprawnosc >= 0.8f -> minOf(_state.value.aktualnyPoziom + 1, 3)
            poprawnosc <= 0.4f -> maxOf(_state.value.aktualnyPoziom - 1, 1)
            else               -> _state.value.aktualnyPoziom
        }
    }

    fun odpowiedz(indeks: Int) {
        val q = _state.value.currentQuestion ?: return
        val czasOdpowiedzi = System.currentTimeMillis() - _state.value.startTime
        val poprawna = indeks == q.correctIndex

        // Zapis do analityki
        viewModelScope.launch {
            repository.saveProgress(UserProgress(
                questionId = q.id,
                answeredCorrectly = poprawna,
                responseTimeMs = czasOdpowiedzi
            ))
        }

        _state.update { s ->
            s.copy(
                punkty = s.punkty + if (poprawna) obliczPunkty(czasOdpowiedzi, q.difficulty) else 0,
                historia = s.historia + OdpowiedzHistoria(q.id, poprawna),
                wybranaOdpowiedz = indeks,
                pokazWyjasnienie = true
            )
        }
    }

    // Punkty zależne od czasu i trudności — mechanika pilności
    private fun obliczPunkty(czasMs: Long, trudnosc: Int): Int {
        val bazowe = trudnosc * 100
        val bonus = maxOf(0, 500 - (czasMs / 100).toInt())  // do 500 bonusu za szybkość
        return bazowe + bonus
    }
}
```

### UI w Jetpack Compose

```kotlin
// QuizScreen.kt
@Composable
fun QuizScreen(viewModel: QuizViewModel = hiltViewModel()) {
    val state by viewModel.state.collectAsStateWithLifecycle()

    Column(
        modifier = Modifier
            .fillMaxSize()
            .padding(16.dp),
        verticalArrangement = Arrangement.spacedBy(12.dp)
    ) {
        // Pasek postępu — "progress bar" jako mechanika motywacji
        LinearProgressIndicator(
            progress = { state.postep },
            modifier = Modifier.fillMaxWidth()
        )

        // Wskaźnik poziomu trudności
        TrudnoscBadge(poziom = state.aktualnyPoziom)

        // Pytanie
        state.currentQuestion?.let { pytanie ->
            Card(modifier = Modifier.fillMaxWidth()) {
                Column(modifier = Modifier.padding(16.dp)) {
                    Text(
                        text = pytanie.text,
                        style = MaterialTheme.typography.headlineSmall
                    )
                }
            }

            // Odpowiedzi
            pytanie.answers.forEachIndexed { i, tekst ->
                val stan = when {
                    !state.pokazWyjasnienie -> OdpowiedzStan.NEUTRALNA
                    i == pytanie.correctIndex -> OdpowiedzStan.POPRAWNA
                    i == state.wybranaOdpowiedz -> OdpowiedzStan.BLEDNA
                    else -> OdpowiedzStan.NEUTRALNA
                }
                OdpowiedzPrzycisk(
                    tekst = tekst,
                    stan = stan,
                    onClick = { if (!state.pokazWyjasnienie) viewModel.odpowiedz(i) }
                )
            }

            // Wyjaśnienie po odpowiedzi — kluczowe dla effective learning
            AnimatedVisibility(visible = state.pokazWyjasnienie) {
                Card(
                    colors = CardDefaults.cardColors(
                        containerColor = MaterialTheme.colorScheme.secondaryContainer
                    )
                ) {
                    Text(
                        text = pytanie.explanation,
                        modifier = Modifier.padding(12.dp),
                        style = MaterialTheme.typography.bodyMedium
                    )
                }
            }
        }
    }
}
```

---

## Learning Analytics w grach poważnych

Kluczowym elementem gier poważnych (w odróżnieniu od gier rozrywkowych) jest **mierzenie skuteczności**:

### Metryki do śledzenia

| Metryka | Co mierzy | Zastosowanie |
|---------|-----------|--------------|
| **Czas odpowiedzi** | Biegłość, pewność | Adaptacja trudności |
| **Wskaźnik poprawności** | Zrozumienie | Identyfikacja luk |
| **Liczba prób** | Persystencja | Motywacja |
| **Ścieżka nawigacji** | Eksploracja | UX gry |
| **Czas sesji** | Zaangażowanie | Skuteczność mechanik |
| **Drop-off point** | Frustracja | Redesign |

### Implementacja analytics (Firebase + BigQuery)

```kotlin
// LearningAnalytics.kt
class LearningAnalytics @Inject constructor(
    private val analytics: FirebaseAnalytics
) {
    fun logQuestionAnswered(
        questionId: Int,
        correct: Boolean,
        timeMs: Long,
        difficulty: Int
    ) {
        analytics.logEvent("question_answered") {
            param("question_id", questionId.toLong())
            param("correct", if (correct) 1L else 0L)
            param("response_time_ms", timeMs)
            param("difficulty", difficulty.toLong())
        }
    }

    fun logSessionCompleted(
        questionsAnswered: Int,
        correctAnswers: Int,
        totalTimeMs: Long,
        finalScore: Int
    ) {
        analytics.logEvent("session_completed") {
            param("questions_answered", questionsAnswered.toLong())
            param("accuracy", (correctAnswers.toFloat() / questionsAnswered * 100).toLong())
            param("total_time_ms", totalTimeMs)
            param("final_score", finalScore.toLong())
        }
    }
}
```

---

## Grywalizacja a gry poważne

Często mylone pojęcia, które warto rozróżnić:

| Aspekt | Grywalizacja | Gra poważna |
|--------|-------------|-------------|
| **Definicja** | Elementy gry w systemie niezgrowym | Pełna gra z celem pozarozrywkowym |
| **Przykład** | Odznaki za siłownię w aplikacji fitness | Symulator chirurgiczny |
| **Kompletność** | Brak kompletności narracyjnej/gameplaya | Pełne doświadczenie gry |
| **Kontekst** | Dowolny (edukacja, zdrowie, praca) | Zawsze gra jako medium |
| **Technologia** | Backend + UI | Silnik gry |

---

## Wyzwania i ograniczenia

### Pułapka „shovelware educational"

Wiele gier edukacyjnych to jedynie quizy z animowanymi postaciami — bez głębokich mechanik angażujących. Kluczowe pytania przy ocenie gry poważnej:

1. Czy cel edukacyjny/terapeutyczny jest **wbudowany w mechaniki**, a nie przyklejony na zewnątrz?
2. Czy gra wymaga od gracza **zastosowania wiedzy**, a nie jedynie jej odtworzenia?
3. Czy istnieje **pętla feedback-refleksja-próba** (fail-reflect-retry)?
4. Czy trudność **adaptuje się** do gracza?

### Ocena skuteczności — wymogi badawcze

Rzetelna ocena gry poważnej wymaga:
- **Randomizowane badania kontrolowane** (RCT) lub quasi-eksperymenty
- Grupy porównawcze (gra vs. tradycyjna metoda)
- Pre/post testy wiedzy/umiejętności
- Długoterminowe follow-up (retencja wiedzy)
- Miary transferu (czy umiejętności przenoszą się do realnego życia?)

### Problemy techniczne na mobile

| Problem | Rozwiązanie |
|---------|-------------|
| Krótkie sesje (avg. 3 min) | Micro-learning: jeden cel na sesję |
| Rozpraszacze (powiadomienia) | Tryb focus, zapis stanu mid-session |
| Różnorodność ekranów | Responsive layout, test na min. 3 rozmiarach |
| Offline first | Room + WorkManager do synchronizacji |
| Dostępność | TalkBack support, dostateczny kontrast, duże przyciski |

---

## Platformy i silniki do tworzenia gier poważnych

| Narzędzie | Typ | Mobilny | Najlepszy dla |
|-----------|-----|---------|---------------|
| **Unity** | Silnik 3D/2D | Android, iOS | Symulacje, VR/AR |
| **Construct 3** | Silnik 2D (web) | HTML5 → PWA | Edugames 2D, prototypy |
| **Twine** | Narracja interaktywna | HTML5 | Gry narracyjne, CBT |
| **Articulate Storyline** | E-learning authoring | HTML5 | Korporacyjne szkolenia |
| **Godot** | Silnik 2D/3D | Android, iOS | Open-source serious games |
| **ARIS** | Platforma field games | iOS, Android | Gry terenowe, edukacja |
| **iCivics** | Platforma edukacyjna | Web | Edukacja obywatelska |

---

## Przykładowe projekty akademickie

### Gra quizowa z adaptacyjnym uczeniem

**Cel**: Nauka anatomii dla studentów medycyny  
**Platforma**: Android (Jetpack Compose)  
**Mechaniki**:
- Pytania wielokrotnego wyboru z obrazem anatomicznym
- Algorytm adaptacyjny (IRT — Item Response Theory)
- Spaced repetition do powtórek (algorytm SM-2 z Anki)
- Leaderboard klasowy (współzawodnictwo motywujące)

**Miary sukcesu**:
- Pre/post test wiedzy anatomicznej
- Retencja po 2 tygodniach
- Zaangażowanie (avg. czas sesji, liczba sesji/tydzień)

### Symulacja ekologiczna

**Cel**: Zmiana zachowań ekologicznych u nastolatków  
**Platforma**: iOS (SwiftUI)  
**Mechaniki**:
- Wirtualny ekosystem reagujący na wybory gracza
- Dzienne decyzje środowiskowe (transport, jedzenie, energia)
- Porównanie z rówieśnikami (social norm messaging)
- Odznaki za realne działania (self-report)

---

## Zasoby i literatura

- **Zyda, M. (2005)** — „From Visual Simulation to Virtual Reality to Games", *IEEE Computer*
- **Gee, J.P. (2003)** — *What Video Games Have to Teach Us About Learning and Literacy*
- **Serious Games Initiative** — seriousgames.org
- **Games for Change** — gamesforchange.org — festiwal i platforma social impact games
- **GDC Vault** — prezentacje z sesji „Serious Games Summit"
- **Journal of Medical Internet Research** — publikacje nt. health games
- **EdSurge** — aktualności o edtech i grach edukacyjnych
