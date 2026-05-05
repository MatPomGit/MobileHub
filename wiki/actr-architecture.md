# ACT-R - Adaptive Control of Thought Rational

## Streszczenie

ACT-R (*Adaptive Control of Thought – Rational*) jest jedną z najbardziej wpływowych kognitywnych architektur obliczeniowych, opracowaną przez Johna R. Andersona i jego współpracowników na Carnegie Mellon University. Architektura ta łączy modularną organizację procesów poznawczych z precyzyjnymi mechanizmami subsymbolicznymi, pozwalającymi na ilościowe modelowanie pamięci, czasu reakcji, efektów praktyki i ograniczeń uwagi. Celem artykułu jest przedstawienie historii, podstaw teoretycznych, struktury modułowej, mechanizmów subsymbolicznych oraz praktycznych zastosowań architektury ACT-R, ze szczególnym uwzględnieniem obszarów interakcji człowiek-komputer, robotyki poznawczej i aplikacji mobilnych.

**Słowa kluczowe:** ACT-R, architektura kognitywna, pamięć deklaratywna, reguły produkcyjne, subsymbolika, HCI, robotyka poznawcza, modele poznawcze

## 1. Wprowadzenie

Architektury kognitywne są formalnymi modelami organizacji procesów umysłowych: percepcji, pamięci, uwagi, planowania i działania. Spośród wielu istniejących architektur ACT-R zyskał szczególną pozycję, ponieważ od początku był projektowany z myślą o falsyfikowalnych przewidywaniach empirycznych. Każdy parametr modelu ma interpretację psychologiczną i może być szacowany na podstawie danych eksperymentalnych. Dzięki temu ACT-R jest zarówno narzędziem inżynierskim, jak i teorią naukową.

Nazwa architektury wskazuje na jej dwa filary. *Adaptive Control of Thought* oznacza adaptacyjną kontrolę myśli, nawiązując do wcześniejszych prac Andersona nad teorią ACT (Anderson, 1976) i ACT* (Anderson, 1983). Człon *Rational* podkreśla założenie, że mechanizmy poznawcze zostały ewolucyjnie i przez uczenie dostrojone do statystycznej struktury środowiska, w którym działa podmiot. Architektura w bieżącej wersji (ACT-R 7.x) jest rozwijana i utrzymywana przez laboratoria na całym świecie, a jej implementacja referencyjna jest dostępna jako otwarte oprogramowanie napisane w języku Common Lisp.

W kontekście aplikacji mobilnych i systemów interaktywnych ACT-R jest ważnym narzędziem do modelowania użytkownika. Przewidywania dotyczące czasu zadań, obciążenia pamięci roboczej czy liczby błędów mogą być wykorzystywane na etapie projektowania interfejsów, długo przed przeprowadzeniem badań z udziałem użytkowników.

## 2. Historia i podstawy teoretyczne

### 2.1. Geneza: od HAM i ACT do ACT-R

Pierwsze prace Andersona nad formalną teorią pamięci sięgają początku lat siedemdziesiątych XX wieku. Opracowany wspólnie z Gordonem Bowerem model HAM (*Human Associative Memory*, 1973) był sieciową teorią pamięci semantycznej, opartą na reprezentacjach asocjacyjnych. W 1976 roku Anderson zaproponował architekturę ACT (*Adaptive Control of Thought*), rozbudowując ją do wersji ACT* w 1983 roku. Wersja ACT* zawierała już jawny podział na wiedzę deklaratywną i proceduralną oraz mechanizmy aktywacji opartej na sile śladów pamięciowych.

Przełomem było opracowanie wersji ACT-R (*Rational*, 1993), w której Anderson uzasadnił kształt mechanizmów pamięciowych przez analizę statystyczną środowisk naturalnych. Według jego analizy optymalna polityka dostępu do pamięci powinna odzwierciedlać częstość i aktualność wcześniejszych wystąpień informacji. Tę zasadę nazywa się hipotezą racjonalnej analizy (*rational analysis*) i stanowi ona filozoficzne jądro całego podejścia.

Kolejne dekady przyniosły kolejne rozszerzenia: ACT-R/PM (*Perceptual-Motor*, 1997–2000), dodający moduły percepcyjne i motoryczne, oraz integrację z neuronauką, w ramach której Anderson i współpracownicy wykazali, że aktywność poszczególnych modułów ACT-R koreluje z odpowiednimi obszarami mózgu widocznymi w badaniach fMRI.

### 2.2. Racjonalna analiza a biologia

Jednym z filozoficznie najciekawszych aspektów ACT-R jest próba powiązania obliczeniowego modelu umysłu z ograniczeniami biologicznymi. Anderson argumentuje, że ewolucja i uczenie się ukształtowały mechanizmy poznawcze tak, aby były optymalne w danych warunkach środowiskowych. Dlatego architektura nie jest arbitralnym zbiorem reguł, lecz obliczeniową realizacją strategii adaptacyjnych.

Równocześnie architektura jest zakorzeniona w neuronauce. Wyniki badań fMRI pokazują, że bufor celu odpowiada aktywności kory przedczołowej, moduł pamięci deklaratywnej - hipokampowi i korze skroniowej, moduł wzrokowy - korze wzrokowej, a producent reguł - jądrom podstawy mózgu. Ta korespondencja między modelem obliczeniowym a strukturami mózgu nadaje ACT-R wiarygodność naukową i odróżnia go od wielu czysto inżynierskich podejść.

## 3. Architektura modułowa

### 3.1. Przegląd modułów

ACT-R jest architekturą modułową, co oznacza, że różne aspekty przetwarzania są realizowane przez wyspecjalizowane, niezależne moduły. Każdy moduł komunikuje się z centralnym modułem proceduralnym przez wyznaczony bufor. Bufor przechowuje w danym momencie co najwyżej jeden chunk - jednostkę informacji. To właśnie bufory tworzą przestrzeń roboczą widoczną dla reguł produkcyjnych.

Główne moduły architektury ACT-R:

| Moduł | Bufor | Odpowiednik neuroanatomiczny |
|---|---|---|
| Declarative Memory | Retrieval Buffer | Hipokamp / kora skroniowa |
| Procedural | (brak jawnego bufora) | Jądra podstawy (striatum) |
| Goal | Goal Buffer | Kora przedczołowa |
| Visual | Visual Buffer | Kora wzrokowa (V1–V5) |
| Motor | Motor Buffer | Kora motoryczna, móżdżek |
| Imaginal | Imaginal Buffer | Kora ciemieniowo-czołowa |
| Aural | Aural Buffer | Kora słuchowa |
| Manual | Manual Buffer | Kora motoryczna |

### 3.2. Pamięć deklaratywna (Declarative Memory)

Pamięć deklaratywna przechowuje fakty w postaci chunków (*chunks*). Chunk jest jednostką informacji o określonym typie i zestawie slotów. Na przykład chunk reprezentujący fakt „Warszawa jest stolicą Polski" mógłby mieć typ `stolica` i sloty `miasto: warszawa`, `panstwo: polska`.

```
(define-chunk-type stolica
  miasto
  panstwo)

(add-dm
  (warszawa-polska ISA stolica
                   :miasto warszawa
                   :panstwo polska))
```

Wydobycie chunku z pamięci deklaratywnej jest procesem probabilistycznym i czasochłonnym. Czas wydobycia (*retrieval time*) wynosi:

```
T = F / A_i
```

gdzie `F` jest stałą skali, a `A_i` jest aktywacją chunku `i`. Aktywacja nie jest stała - zależy od historii użycia.

### 3.3. Pamięć proceduralna i reguły produkcyjne

Pamięć proceduralna składa się z reguł produkcyjnych (*production rules*). Każda reguła ma postać warunku (`IF`) i akcji (`THEN`). Warunek opisuje stan buforów, który musi być spełniony; akcja opisuje zmiany, jakie reguła wprowadza.

```lisp
(p szukaj-stolice
   =goal>
     ISA  szukaj-stolice
     kraj  =kraj
   ?declarative>
     state  free
==>
   +declarative>
     ISA   stolica
     panstwo  =kraj
)
```

W każdym cyklu proceduralnym (trwającym ok. 50 ms) system wybiera dokładnie jedną regułę do wykonania. Wybór jest deterministyczny w wersji symbolicznej lub probabilistyczny z szumem w wersji subsymbolicznej. Równoległe działanie modułów jest możliwe - moduły wzrokowy, motoryczny i deklaratywny mogą pracować jednocześnie, ale każdy z nich obsługuje w danym momencie tylko jedno żądanie.

### 3.4. Moduł celu (Goal Module)

Moduł celu przechowuje aktualny cel agenta - opis stanu, do którego system dąży. Cel może być modyfikowany przez reguły produkcyjne. W złożonych zadaniach możliwe jest utrzymywanie stosu celów przez przechowywanie niekompletnych celów w pamięci deklaratywnej i przywracanie ich w odpowiednim momencie.

### 3.5. Moduły percepcyjno-motoryczne: ACT-R/PM

Rozszerzenie ACT-R/PM, opracowane przez Byrne'a i Andersona (1998), dodało pełne moduły percepcyjne i motoryczne. Moduł wzrokowy odpowiada za sterowanie uwagą wzrokową - agent musi najpierw przesunąć uwagę na interesujący obiekt (`move-attention`), zanim zdoła uzyskać szczegółowe informacje o jego własnościach. Moduł motoryczny steruje ruchami kursora myszy i klawiatury. Oba moduły mają własne czasy opóźnień i wzajemnie niezależne przetwarzanie.

```python
# Pseudo-kod symulujący ACT-R/PM w środowisku Python
class VisualModule:
    def __init__(self):
        self.attention = None
        self.buffer = None

    def move_attention(self, location):
        """Przesunięcie uwagi wzrokowej - ok. 85 ms"""
        self.attention = location
        self.buffer = self._encode_object(location)

    def _encode_object(self, loc):
        return {'isa': 'visual-object', 'screen-x': loc[0], 'screen-y': loc[1]}


class MotorModule:
    def click_mouse(self, location):
        """Kliknięcie myszą - ok. 150 ms"""
        pass  # tutaj sterowanie fizycznym/wirtualnym wskaźnikiem
```

## 4. Mechanizmy subsymboliczne

### 4.1. Aktywacja chunku

Każdy chunk w pamięci deklaratywnej ma przypisaną aktywację `A_i`, która decyduje o czasie i prawdopodobieństwie wydobycia. Aktywacja jest sumą kilku składowych:

```
A_i = B_i + ΣW_j · S_ji + ε
```

gdzie:
- `B_i` - poziom bazowy (*base-level activation*), zależny od historii użycia,
- `W_j · S_ji` - aktywacja asocjacyjna, zależna od związków z elementami w aktualnym celu,
- `ε` - szum gaussowski.

### 4.2. Base-level learning (BLL)

Poziom bazowy chunku obliczany jest przez formułę:

```
B_i = ln(Σ_{k=1}^{n} t_k^{-d})
```

gdzie `t_k` oznacza czas, jaki upłynął od `k`-tego użycia chunku, a `d` jest parametrem zaniku (typowo `d ≈ 0.5`). Formuła ta naśladuje empiryczne prawo zaniku pamięci - rzadko używane informacje stają się trudniej dostępne, ale nigdy nie znikają całkowicie.

W praktyce BLL pozwala modelować:
- efekt częstości (*frequency effect*): często używane chunki są szybciej wydobywane,
- efekt świeżości (*recency effect*): ostatnio używane chunki są łatwiej dostępne,
- zakrzywiony profil uczenia (*power law of practice*): czas wydobycia maleje jako funkcja potęgowa liczby powtórzeń.

```python
import numpy as np

def base_level_activation(times_used, current_time, decay=0.5):
    """
    Oblicza bazowy poziom aktywacji chunku.
    times_used: lista znaczników czasu kolejnych użyć chunku
    current_time: bieżący czas symulacji
    decay: parametr zaniku (d)
    """
    intervals = current_time - np.array(times_used)
    intervals = np.maximum(intervals, 1e-6)
    return np.log(np.sum(intervals ** (-decay)))


# Przykład: chunk użyty przed 1, 5, 20 i 100 sekundami
times = [0, 4, 15, 99]  # momentY użycia w sekundach
current = 100
bll = base_level_activation(times, current)
print(f"Poziom bazowy aktywacji: {bll:.3f}")
```

### 4.3. Uczenie asocjacyjne (Associative Learning)

Wagi asocjacyjne `S_ji` opisują, jak bardzo obecność elementu `j` w celu aktywuje chunk `i`. Są one szacowane na podstawie statystyki warunkowej:

```
S_ji = S - ln(P(i|j))
```

gdzie `S` jest parametrem maksymalnej siły asocjacyjnej, a `P(i|j)` jest prawdopodobieństwem wydobycia `i` w obecności `j`. Mechanizm ten pozwala modelować kontekstowe ułatwianie wydobycia: jeśli dwa pojęcia często współwystępują, aktywują się nawzajem.

### 4.4. Utility learning: uczenie użyteczności reguł

Reguły produkcyjne również mają wartości numeryczne - ich użyteczność (`utility`). W przypadku konfliktu między regułami pasującymi jednocześnie do stanu buforów system wybiera tę o najwyższej użyteczności (z szumem):

```
U_i = P_i · G - C_i + ε
```

gdzie `P_i` jest oczekiwanym prawdopodobieństwem osiągnięcia celu po wybraniu reguły `i`, `G` jest wartością celu, a `C_i` kosztem wykonania reguły. Aktualizacja użyteczności przebiega zgodnie z algorytmem podobnym do Q-learningu:

```
U_i ← U_i + α(R - U_i)
```

## 5. Rozszerzenia architektury

### 5.1. ACT-R/E - rozszerzenie enaktywne

ACT-R/E (*Embodied*) rozbudowuje architekturę o bardziej szczegółowe modelowanie procesów ucieleśnionych. W tej wersji moduły motoryczne uwzględniają biomechaniczne ograniczenia ruchów ciała, czas inicjacji ruchu, koszt energetyczny i interferencję między równoległymi ruchami. Stanowi to znaczące ulepszenie w modelowaniu zadań fizycznych, np. obsługi urządzeń dotykowych.

### 5.2. ACT-R/PM i model EPIC

ACT-R/PM był pierwszą wersją integrującą pełne modelowanie percepcji i motoryki. Równolegle Kieras i Meyer opracowali architekturę EPIC (*Executive-Process/Interactive Control*), która kładzie większy nacisk na równoległe wykonywanie procesów zmysłowych i motorycznych. Oba podejścia uzupełniają się, a ich porównanie pozwala lepiej rozumieć ograniczenia pojemności przetwarzania.

### 5.3. Integracja z PyACTUp i Python

Współczesne projekty coraz częściej korzystają z implementacji ACT-R w Pythonie. Biblioteka `pyactr` pozwala definiować modele w składni zbliżonej do referencyjnej implementacji Lispowej, ale w środowisku Python:

```python
import pyactr as actr

agent = actr.ACTRModel()

actr.chunktype("goal", "state target")
actr.chunktype("fact", "country capital")

agent.goal.add(actr.makechunk(typename="goal", state="start", target="poland"))
agent.decmem.add(actr.makechunk(typename="fact", country="poland", capital="warsaw"))

agent.productionstring(name="retrieve-capital", string="""
    =goal>
        isa     goal
        state   start
        target  =country
    ?retrieval>
        state   free
    ==>
    =goal>
        state   retrieving
    +retrieval>
        isa     fact
        country =country
""")

sim = agent.simulation(realtime=False)
sim.run(1.0)
```

## 6. ACT-R w badaniach HCI

### 6.1. Model GOMS i jego relacja do ACT-R

Badania interakcji człowiek-komputer (*Human-Computer Interaction*, HCI) skorzystały z ACT-R w istotny sposób. Klasyczny model GOMS (*Goals, Operators, Methods, Selection rules*) daje uproszczone przewidywania czasowe bez mechanizmów pamięciowych. ACT-R pozwala na bogatsze modelowanie - uwzględnia uczenie się interfejsu, zapominanie, efekty obciążenia poznawczego i koszty przełączania uwagi.

### 6.2. Modelowanie czasu zadań

John Anderson i współpracownicy pokazali, że modele ACT-R mogą przewidywać czasy wykonania zadań z dokładnością do kilkudziesięciu milisekund. Typowe przewidywania obejmują:
- czas kliknięcia w przycisk interfejsu (z uwzględnieniem czasu przesunięcia uwagi wzrokowej, ruchu myszy i kliknięcia),
- czas wpisywania tekstu,
- czas zapamiętywania i przywoływania opcji menu.

### 6.3. Zastosowanie w projektowaniu aplikacji mobilnych

W kontekście aplikacji mobilnych (PAM) modele ACT-R pozwalają ocenić:
- ile czasu zajmie użytkownikowi przejście przez wieloekranowy formularz,
- jak głębokość hierarchii menu wpływa na czas dotarcia do funkcji,
- jak częstość użycia funkcji przekłada się na czas jej wydobycia z pamięci.

Przykładowo, przewidywanie dotyczące aplikacji bankowej: funkcja przelewu jest używana kilka razy w miesiącu (co daje niski poziom BLL), więc po tygodniowej przerwie jej znajdowanie w menu zajmuje dłużej niż w przypadku funkcji sprawdzania salda (używanej codziennie). ACT-R może to ilościowo zmodeliwać.

```python
def predict_retrieval_time(frequency_per_day, days_since_last_use, F=1.0, decay=0.5):
    """
    Przybliżone przewidywanie czasu wydobycia w sekundach.
    frequency_per_day: ile razy dziennie element jest używany
    days_since_last_use: dni od ostatniego użycia
    """
    n_uses = frequency_per_day * 30  # zakładamy 30 dni historii
    # uproszczona estymacja BLL
    times = [days_since_last_use * 86400 + i * (86400 / max(frequency_per_day, 0.01))
             for i in range(int(n_uses))]
    bll = base_level_activation(
        [0] * int(n_uses),
        days_since_last_use * 86400,
        decay
    )
    activation = bll
    if activation < -2:
        return None  # wydobycie niemożliwe (zbyt niska aktywacja)
    retrieval_time = F * np.exp(-activation)
    return retrieval_time
```

## 7. ACT-R w robotyce poznawczej

### 7.1. Warstwa poznawcza robota

W robotyce poznawczej ACT-R jest stosowany jako kognitywna warstwa wyższego poziomu, zarządzająca celami, pamięcią epizodyczną i proceduralną, nie zaś jako kompletny system sterowania. Typowa architektura integracyjna łączy ACT-R z modułami percepcji (ROS, OpenCV) i planowania ruchu (MoveIt!, Nav2), przy czym ACT-R odpowiada za sekwencjonowanie zadań, wydobywanie wiedzy i podejmowanie decyzji na poziomie abstrakcyjnym.

### 7.2. Roboty społeczne i HRI

Najbardziej naturalnym zastosowaniem ACT-R w robotyce jest modelowanie interakcji robot-człowiek (*Human-Robot Interaction*, HRI). Robot wyposażony w model ACT-R może:
- modelować stan poznawczy rozmówcy (czego użytkownik chce, co zapamiętał),
- dostosowywać tempo i złożoność wypowiedzi do aktualnego obciążenia poznawczego,
- pamiętać wcześniejsze interakcje i adaptować swoje zachowanie.

### 7.3. Przykład: robot asystent w środowisku domowym

```python
class CognitiveAssistantRobot:
    """
    Uproszczona implementacja koncepcji robota-asystenta
    z warstwą ACT-R do zarządzania wiedzą o użytkowniku.
    """
    def __init__(self):
        self.declarative_memory = {}   # chunks: {name: {slots...}}
        self.goal_stack = []
        self.activation_history = {}   # {chunk_name: [timestamps]}

    def add_fact(self, name, slots):
        self.declarative_memory[name] = slots
        self.activation_history[name] = [0.0]

    def retrieve(self, query_slots, current_time):
        """Pobierz chunk pasujący do query z uwzględnieniem aktywacji BLL."""
        candidates = []
        for name, slots in self.declarative_memory.items():
            if all(slots.get(k) == v for k, v in query_slots.items()):
                bll = base_level_activation(
                    self.activation_history[name], current_time
                )
                candidates.append((name, bll))
        if not candidates:
            return None
        best = max(candidates, key=lambda x: x[1])
        self.activation_history[best[0]].append(current_time)
        return best[0], self.declarative_memory[best[0]]


robot = CognitiveAssistantRobot()
robot.add_fact("remind_medication", {"type": "reminder", "user": "jan", "action": "take_pill"})
robot.add_fact("preferred_coffee", {"type": "preference", "user": "jan", "drink": "espresso"})

result = robot.retrieve({"type": "preference", "user": "jan"}, current_time=50.0)
print(f"Wydobyto: {result}")
```

## 8. Porównanie z innymi architekturami

### 8.1. ACT-R a Soar

Soar i ACT-R są obydwoma architekturami produkcyjnymi, ale różnią się akcentami teoretycznymi. Soar kładzie nacisk na planowanie w przestrzeni problemów i rozwiązywanie impasów przez *chunking*; ACT-R skupia się na ilościowym modelowaniu pamięci i zgodności z danymi empirycznymi z psychologii. Soar jest bardziej ogólnym narzędziem inżynierskim, ACT-R - bardziej precyzyjnym modelem psychologicznym.

### 8.2. ACT-R a CLARION

CLARION, opracowany przez Rona Suna, jest architekturą dwuprocesową, jawnie oddzielającą poziom symboliczny (reguły) od subsymbolicznego (sieci neuronowe). W ACT-R subsymbolika jest zintegrowana z poziomem symbolicznym przez mechanizmy aktywacji, a nie oddzielona strukturalnie. CLARION lepiej modeluje zjawisko nabywania wiedzy niejawnej (*implicit learning*), podczas gdy ACT-R precyzyjniej przewiduje dane ilościowe z eksperymentów psychologicznych.

### 8.3. ACT-R a LIDA

LIDA (*Learning Intelligent Distribution Agent*) opiera się na Teorii Globalnej Przestrzeni Roboczej (*Global Workspace Theory*). W LIDA kluczowe jest pojęcie świadomości dostępu jako mechanizmu dystrybucji informacji; ACT-R nie modeluje explicite świadomości. LIDA jest bardziej skoncentrowany na cyklu percepcja–rozumienie–działanie, podczas gdy ACT-R na ilościowej psychologii pamięci i czasu reakcji.

| Cecha | ACT-R | Soar | CLARION | LIDA |
|---|---|---|---|---|
| Pamięć deklaratywna | Chunki + BLL | Semantic/Episodic LTM | NACS | Perceptual/declarative |
| Uczenie się | BLL, utility, asocjacyjne | Chunking, RL | RERE, Q-learning | Hebbian, RL, episodic |
| Subsymbolika | Zintegrowana | Ograniczona | Oddzielona (NN) | Slipnet |
| Modularność | Tak (bufory) | Tak | Tak (4 subsystemy) | Tak (moduły cyklu) |
| Neuroanatomia | Explicite mapowana | Nie | Nie | Częściowo |
| Silna strona | Przewidywania empiryczne | Planowanie | Uczenie niejawne | GWT, świadomość |

## 9. Ograniczenia i kierunki rozwoju

Mimo ogromnej liczby zastosowań ACT-R posiada szereg ograniczeń. Po pierwsze, referencyjne środowisko Lispowe nie jest łatwe do integracji z nowoczesnymi platformami obliczeniowymi. Po drugie, modelowanie percepcji niskiego poziomu (np. rozpoznawania obrazów ze złożonych scen) wymaga zewnętrznych modułów. Po trzecie, skalowalność bazy chunkowej do milionów faktów jest trudna bez dodatkowej architektonizacji.

Kierunki rozwoju obejmują:
- integrację z głębokimi sieciami neuronowymi (modele hybrydowe),
- implementacje w języku Python (pyactr, ACT-UP),
- zastosowania w modelowaniu użytkownika dla inteligentnych systemów tutorujących (*Intelligent Tutoring Systems*, ITS),
- rozszerzenia dla robotyki ucieleśnionej (*embodied cognition*).

## 10. Podsumowanie

ACT-R jest architekturą kognitywną o wyjątkowej głębokości teoretycznej i empirycznej. Jej zdolność do ilościowego przewidywania zachowań poznawczych czyni ją cennym narzędziem zarówno w naukach o poznaniu, jak i w inżynierii systemów interaktywnych. W projektowaniu aplikacji mobilnych modele ACT-R mogą wspomagać decyzje dotyczące interfejsu i struktury informacji. W robotyce poznawczej architektura ta pełni rolę warstwy zarządzającej wiedzą i celami, integrując się z modułami percepcji i działania. Dalszy rozwój bibliotek Pythonowych oraz prace nad hybrydyzacją z sieciami neuronowymi otwierają nowe możliwości zastosowań ACT-R w erze uczenia maszynowego.

## Literatura

1. Anderson, J. R. (1976). *Language, Memory, and Thought*. Erlbaum.
2. Anderson, J. R. (1983). *The Architecture of Cognition*. Harvard University Press.
3. Anderson, J. R., & Lebiere, C. (1998). *The Atomic Components of Thought*. Erlbaum.
4. Anderson, J. R. (2007). *How Can the Human Mind Occur in the Physical Universe?* Oxford University Press.
5. Byrne, M. D., & Anderson, J. R. (1998). Perception and action. In *The Atomic Components of Thought*. Erlbaum.
6. Laird, J. E. (2012). *The Soar Cognitive Architecture*. MIT Press.
7. Sun, R. (2006). The CLARION cognitive architecture: Extending cognitive modeling to social simulation. In *Cognition and Multi-Agent Interaction*. Cambridge University Press.
8. Franklin, S., & Graesser, A. (1997). Is it an agent, or just a program? A taxonomy for autonomous agents. *LNAI 1193*, Springer.
9. Taatgen, N. A., & Anderson, J. R. (2008). Modeling parallel tasks in ACT-R. *Cognitive Systems Research*, 9(1-2), 64–76.
10. Salvucci, D. D., & Taatgen, N. A. (2011). *The Multitasking Mind*. Oxford University Press.

## Powiązane artykuły

- [Modele kognitywne](cognitive-models.md)
- [Obliczeniowe modelowanie poznania](computational-cognition.md)
- [Soar - architektura kognitywna](soar-architecture.md)
- [CLARION](clarion-architecture.md)
- [LIDA](lida-architecture.md)
- [Inteligentny agent](intelligent-agent.md)
- [Reprezentacja wiedzy](knowledge-representation.md)
- [Percepcja kognitywna](cognitive-perception.md)
- [Robotyka kognitywna](cognitive-robotics.md)
