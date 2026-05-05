# Modele kognitywne

## Streszczenie

Modele kognitywne (*cognitive models*) to formalne, obliczeniowe lub matematyczne reprezentacje ludzkich procesów poznawczych. Są stosowane w psychologii eksperymentalnej, neuronauce obliczeniowej, projektowaniu interfejsów użytkownika (HCI) i robotyce poznawczej. Artykuł omawia typologię modeli, najważniejsze modelowane procesy poznawcze, kluczowe prawa ilościowe (Miller, Fitts), model GOMS, architektury kognitywne (ACT-R, Soar, EPIC) oraz zastosowania w projektowaniu aplikacji mobilnych.

**Słowa kluczowe:** modele kognitywne, architektura kognitywna, pamięć robocza, prawo Millera, prawo Fittsa, GOMS, ACT-R, Soar, HCI, predykcja zachowania użytkownika

---

## 1. Wprowadzenie

Modelowanie kognitywne jest wysiłkiem zrozumienia i formalizacji mechanizmów umysłu przez tworzenie systemów obliczeniowych lub matematycznych, których zachowanie naśladuje ludzkie poznanie. Historia tej dyscypliny sięga rewolucji kognitywnej lat pięćdziesiątych XX wieku, kiedy Allen Newell, Herbert Simon i inni badacze zaproponowali traktowanie umysłu jako systemu przetwarzania informacji.

**Po co budujemy modele kognitywne?**

- Testowanie hipotez psychologicznych: model może generować falsofikowalne przewidywania
- Projektowanie interfejsów: przewidywanie czasu wykonania zadań, liczby błędów
- Diagnostyka edukacyjna: identyfikacja trudności w uczeniu się
- Robotyka: wyposażenie robotów w ludzko-podobne mechanizmy poznawcze
- Klinika: modele dysfunkcji poznawczych (ADHD, schizofrenia, choroba Alzheimera)

Dobry model kognitywny powinien spełniać kryteria (Anderson, 2007):
1. Zgodność z danymi empirycznymi (czas reakcji, wskaźniki błędów, dane fMRI)
2. Przewidywalność - generuje nowe, sprawdzalne hipotezy
3. Parsimonia - wyjaśnia dużo małą liczbą mechanizmów
4. Operacjonalizacja - jest implementowalny jako program komputerowy

---

## 2. Typologia modeli kognitywnych

### 2.1. Modele symboliczne (*Symbolic Models*)

Modele symboliczne reprezentują wiedzę jako symbole (słowa, pojęcia) i operują regułami transformacji symbolicznej. Wywodzą się z paradygmatu **Physical Symbol System Hypothesis** (Newell & Simon, 1976): „Fizyczny system symboli posiada środki konieczne i wystarczające do inteligentnego działania."

Przykłady: ACT-R, Soar, GPS (*General Problem Solver*), Prolog.

**Zalety**: interpretowalność, zgodność z psychologią poznawczą, łatwość kodowania wiedzy eksperckiej.
**Wady**: trudność z percepcją i uczeniem, wrażliwość na hałas, problem ramkowy (*frame problem*).

### 2.2. Modele koneksjonistyczne (*Connectionist/Neural Models*)

Modele koneksjonistyczne reprezentują wiedzę jako wzorce aktywności w sieciach jednostek obliczeniowych inspirowanych neuronami. Uczenie odbywa się przez modyfikację wag połączeń.

Przykłady: perceptron wielowarstwowy, sieci rekurencyjne (LSTM), transformery.

```python
import torch
import torch.nn as nn

# Prosty model koneksjonistyczny pamięci asocjacyjnej (Hopfield-inspired)
class SimpleAssociativeMemory(nn.Module):
    def __init__(self, pattern_size):
        super().__init__()
        self.W = nn.Parameter(torch.zeros(pattern_size, pattern_size))

    def store(self, patterns):
        """Hebbian learning: W += p * p^T / N"""
        N = len(patterns)
        for p in patterns:
            p = p.float().view(-1, 1)
            self.W.data += (p @ p.T) / N
        # zeruj diagonal
        self.W.data.fill_diagonal_(0)

    def recall(self, query, steps=10):
        """Iteracyjne odtwarzanie wzorca."""
        state = query.float()
        for _ in range(steps):
            state = torch.sign(self.W @ state)
        return state
```

**Zalety**: naturalna obsługa hałasu, uczenie z danych, przetwarzanie równoległe.
**Wady**: trudna interpretowalność, brak explicite mechanizmów symbolicznych.

### 2.3. Modele hybrydowe (*Hybrid Models*)

Modele hybrydowe łączą obliczenia symboliczne i subsymboliczne. Przykłady:

- **ACT-R**: symboliczne reguły + subsymboliczne mechanizmy aktywacji
- **CLARION**: jawna (symboliczna) i niejawna (sieciowa) warstwa wiedzy
- **Neural-Symbolic Integration** (de Penning, 2020): LLM + logika

### 2.4. Modele bayesowskie (*Bayesian Cognitive Models*)

Bayesowskie modele poznania traktują umysł jako optymalny statystyk, który aktualizuje przekonania zgodnie z twierdzeniem Bayesa.

```
P(hipoteza | dane) ∝ P(dane | hipoteza) × P(hipoteza)
     posterior        likelihood         prior
```

```python
import numpy as np
from scipy.stats import beta

# Bayesowski model percepcji kategorii (prosty przykład)
class BayesianCategoryLearner:
    def __init__(self, alpha=1, beta_param=1):
        self.alpha = alpha   # liczba zaobserwowanych "tak"
        self.beta = beta_param   # liczba zaobserwowanych "nie"

    def update(self, observation: bool):
        if observation:
            self.alpha += 1
        else:
            self.beta += 1

    def predict(self, x):
        """P(kategoria=1 | x) przy założeniu Beta-Binomial"""
        return self.alpha / (self.alpha + self.beta)

    def uncertainty(self):
        a, b = self.alpha, self.beta
        return (a * b) / ((a + b) ** 2 * (a + b + 1))   # wariancja Beta
```

### 2.5. Dynamiczne systemy kognitywne (*Dynamical Systems Approach*)

Podejście dynamiczno-systemowe modeluje poznanie jako ewolucję układów różniczkowych. Szczególnie użyteczne do modelowania percepcji ruchu, stabilności motorycznej i synchronizacji.

---

## 3. Kluczowe procesy poznawcze i ich modele

### 3.1. Pamięć robocza (*Working Memory*)

Pamięć robocza (Baddeley & Hitch, 1974) to tymczasowy magazyn informacji służący do przetwarzania i manipulacji. Model Baddeleya wyróżnia:

- **Centralny executor** (*central executive*) - kontrola uwagi
- **Pętla fonologiczna** (*phonological loop*) - informacje werbalne/dźwiękowe
- **Szkicownik wzrokowo-przestrzenny** (*visuospatial sketchpad*) - obrazy i przestrzeń
- **Bufor epizodyczny** (*episodic buffer*) - integracja modalna

#### Prawo Millera (7 ± 2)

George Miller (1956) wykazał, że ludzka pamięć robocza może przechowywać **7 ± 2 chunki** (*chunks*) informacji jednocześnie. Nowsze badania (Cowan, 2001) sugerują realistyczną pojemność **4 ± 1** chunki.

```python
MILLER_CAPACITY = 7   # ± 2
COWAN_CAPACITY = 4    # ± 1

def chunk_information(items, chunk_size=4):
    """Grupowanie elementów w chunki, imitując strategie pamięciowe."""
    return [items[i:i+chunk_size] for i in range(0, len(items), chunk_size)]

# Przykład: numer PESEL jako chunki
pesel = "85031512345"
chunked = chunk_information(list(pesel), chunk_size=3)
print(chunked)   # [['8','5','0'], ['3','1','5'], ['1','2','3'], ['4','5']]
```

**Konsekwencje dla UI**: menu nawigacyjne nie powinno mieć więcej niż 7 pozycji; formularze powinny być podzielone na logiczne sekcje nieprzekraczające 4–5 pól na raz.

### 3.2. Uwaga (*Attention*)

Modele uwagi opisują, jak ograniczone zasoby poznawcze są alokowane. Główne nurty:

- **Teoria filtra** (Broadbent, 1958): selekcja wczesna, przed identyfikacją
- **Teoria tłumika** (Treisman, 1964): osłabienie, nie blokowanie
- **Późna selekcja** (Deutsch & Deutsch, 1963): selekcja po identyfikacji
- **Teoria zasobów** (Kahneman, 1973): uwaga jako ograniczony zasób dzielony

W architekturach kognitywnych uwaga modelowana jest przez mechanizmy buforów (ACT-R) lub priorytety celów (Soar).

### 3.3. Percepcja

Percepcja jest procesem nadawania znaczenia bodźcom sensorycznym. Modele kognitywne percepcji wzrokowej obejmują:

- **Feature Integration Theory** (Treisman & Gelade, 1980): cech proste (kolor, orientacja) preattentywne, koniunkcje wymagają uwagi
- **Guided Search** (Wolfe, 1994): szukanie z uwzględnieniem wiedzy a priori

### 3.4. Podejmowanie decyzji (*Decision Making*)

Klasyczny model racjonalny (Expected Utility Theory) zakłada wybór opcji o najwyższej oczekiwanej użyteczności. Psychologiczne modele decyzji:

```python
# Model Prospect Theory (Kahneman & Tversky, 1979)
def value_function(x, alpha=0.88, beta=0.88, lambda_coeff=2.25):
    """
    Funkcja wartości: zyski i straty oceniane asymetrycznie.
    lambda_coeff > 1: awersja do straty (strata boli bardziej niż zysk cieszy)
    """
    if x >= 0:
        return x ** alpha
    else:
        return -lambda_coeff * ((-x) ** beta)

gains = [value_function(x) for x in [100, 200, 500, 1000]]
losses = [value_function(x) for x in [-100, -200, -500, -1000]]
print("Zyski:", gains)
print("Straty:", losses)
```

---

## 4. Ilościowe prawa kognitywne

### 4.1. Prawo Fittsa (*Fitts' Law*)

Prawo Fittsa (1954) opisuje czas ruchu do celu:

```
T = a + b × log₂(1 + D/W)
```

gdzie:
- **T** - czas ruchu
- **D** - odległość do celu
- **W** - szerokość celu
- **a, b** - parametry empiryczne (zależne od urządzenia)

```python
import math

def fitts_law(D, W, a=50, b=100):
    """
    Przewidywanie czasu ruchu według prawa Fittsa.
    D: odległość do celu (px)
    W: szerokość celu (px)
    a, b: parametry w ms
    """
    ID = math.log2(1 + D / W)   # Index of Difficulty
    MT = a + b * ID              # Movement Time w ms
    return MT, ID

# Porównanie przycisków w aplikacji mobilnej
scenarios = [
    ("Duży przycisk blisko", 100, 80),
    ("Mały przycisk daleko", 400, 20),
    ("Przycisk FAB (Material Design)", 150, 56),
]
for name, D, W in scenarios:
    MT, ID = fitts_law(D, W)
    print(f"{name}: ID={ID:.2f} bits, MT={MT:.0f} ms")
```

**Konsekwencje dla mobile UX**:
- Główne przyciski akcji (FAB) powinny być duże i blisko centrum ekranu
- Cele dotykowe powinny mieć co najmniej 44×44 pt (Apple HIG) lub 48×48 dp (Material Design)
- Gęste listy elementów zwiększają czas interakcji

### 4.2. Prawo Hicka-Hymana (*Hick-Hyman Law*)

Czas wyboru jednej z N równouprawnionych alternatyw:

```
RT = a + b × log₂(N)
```

Implikacja dla UI: menu z 8 opcjami wymaga o `log₂(8) - log₂(4) = 1 bit` więcej czasu niż menu z 4 opcjami.

### 4.3. Prawo potęgowe uczenia się (*Power Law of Practice*)

```
T_n = T₁ × n^{-α}
```

Czas wykonania zadania spada potęgowo wraz z liczbą ćwiczeń. α ≈ 0.2–0.4. W ACT-R odpowiada temu mechanizm wzmacniania reguł proceduralnych.

---

## 5. Model GOMS

GOMS (*Goals, Operators, Methods, Selection rules*) - Card, Moran & Newell (1983) - to rodzina technik modelowania poznawczego dla HCI.

### 5.1. Składniki GOMS

- **Goals** - hierarchia celów: cel główny → podcele
- **Operators** - elementarne akcje (naciśnięcie klawisza, ruch myszki, percepcja)
- **Methods** - procedury osiągania celów
- **Selection rules** - reguły wyboru między alternatywnymi metodami

### 5.2. KLM (*Keystroke-Level Model*)

KLM to uproszczona wersja GOMS, w której czas zadania oblicza się jako sumę czasów operatorów:

| Operator | Opis | Typowy czas |
|---|---|---|
| K (Keystroke) | Naciśnięcie klawisza | 0.28 s (ekspert) – 1.2 s (nowicjusz) |
| P (Pointing) | Wskazanie myszką | 1.10 s |
| H (Homing) | Przełączenie ręki | 0.40 s |
| D (Drawing) | Rysowanie odcinka | 0.9 × n s |
| M (Mental) | Operacja mentalna | 1.35 s |
| R (Response) | Czekanie na system | zmienny |

```python
# Kalkulator KLM dla sekwencji interakcji
KLM_TIMES = {
    'K': 0.28,   # keystroke (ekspert)
    'P': 1.10,   # pointing
    'H': 0.40,   # homing
    'M': 1.35,   # mental operation
    'R': 0.0,    # response (placeholder)
}

def klm_estimate(sequence):
    """
    sequence: lista operatorów KLM, np. ['M', 'P', 'K', 'K']
    Zwraca szacowany czas w sekundach.
    """
    return sum(KLM_TIMES.get(op, 0) for op in sequence)

# Porównanie: wyszukiwanie przez klawiaturę vs dotyk
keyboard_search = ['M', 'H', 'K', 'K', 'K', 'K', 'K', 'H', 'P', 'K']
touch_search = ['M', 'P', 'K', 'P', 'K']

print(f"Klawiatura: {klm_estimate(keyboard_search):.2f} s")
print(f"Dotyk: {klm_estimate(touch_search):.2f} s")
```

---

## 6. Architektury kognitywne jako modele kompleksowe

### 6.1. Porównanie głównych architektur

| Cecha | ACT-R | Soar | EPIC | CLARION | LIDA |
|---|---|---|---|---|---|
| Twórca | J. Anderson (CMU) | J. Laird (Michigan) | Meyer & Kieras | R. Sun (RPI) | S. Franklin (Memphis) |
| Paradygmat | Hybrydowy | Symboliczny | Symboliczny | Hybrydowy | Hybrydowy |
| Pamięć | Deklaratywna + proceduralna | Unified memory | Proceduralna | Explicit + Implicit | Wiele typów |
| Uczenie | Subsymboliczne | Chunking | Ograniczone | Q-learning + reguły | Rozmaite |
| Fokus | Psychologia exp. | Problem solving | HCI/wielozadaniowość | Socjologia, uczenie | Świadomość |
| Impl. | Common Lisp | C++ | C++ | Python/Java | Java |

### 6.2. ACT-R w pigułce

ACT-R (Anderson, 1993–2023) modeluje poznanie przez moduły (percepcja, pamięć deklaratywna, proceduralna, motor) komunikujące się przez bufory. Centralnym mechanizmem są **reguły produkcyjne**.

```lisp
;; Przykład reguły ACT-R w języku ACT-R Lisp
(p retrieve-fact
  =goal>
    isa       arithmetic-problem
    arg1      =x
    arg2      =y
    operator  plus
    result    nil
  ==>
  +retrieval>
    isa       addition-fact
    arg1      =x
    arg2      =y
)
```

### 6.3. Soar w pigułce

Soar (Laird, 2012) oparty jest na architekturze **Unified Memory** i mechanizmie **impasse resolution** - gdy Soar nie może kontynuować działania, tworzy podprzestrzeń problemu.

```
Stan roboczy (Working Memory)
    ↕
Pamięć długoterminowa (Procedural + Semantic + Episodic)
    ↕
Operator selection → Apply → Update state
    ↕
Impasse → Subgoal
```

### 6.4. EPIC dla modelowania wielozadaniowego

EPIC (*Executive-Process Interactive Control*, Meyer & Kieras) skupia się na modelowaniu zadań motorycznych i percepcyjnych. Szczególnie użyteczny w badaniach nad interfejsami z wieloma modalności.

---

## 7. Obliczeniowe modele w neuronauce

### 7.1. Teoria pola neuronowego (*Neural Field Theory*)

Teoria pola neuronowego (Wilson & Cowan, 1972; Amari, 1977) modeluje aktywność korową jako pole ciągłe:

```
τ ∂u(x,t)/∂t = -u(x,t) + ∫w(x-x')f(u(x',t))dx' + I(x,t)
```

Używana do modelowania: pamięci roboczej, uwagi wzrokowej, koordynacji ruchów.

### 7.2. Predykcyjne kodowanie (*Predictive Coding*)

Hierarchiczne modele predykcyjne (Rao & Ballard, 1999; Friston, 2010) zakładają, że mózg nieustannie generuje predykcje i przetwarza jedynie błędy predykcji.

```python
# Prosty przykład predykcyjnego kodowania dla percepcji
class PredictiveCodingLayer:
    def __init__(self, prior_mean, learning_rate=0.1):
        self.prediction = prior_mean
        self.lr = learning_rate

    def process(self, sensory_input):
        prediction_error = sensory_input - self.prediction
        self.prediction += self.lr * prediction_error
        return prediction_error   # tylko błąd idzie wyżej

# Symulacja adaptacji do regularnego bodźca
layer = PredictiveCodingLayer(prior_mean=0.5)
stimuli = [0.5, 0.5, 0.5, 0.5, 0.9, 0.5, 0.5]   # zaskakujący bodziec w środku
for s in stimuli:
    error = layer.process(s)
    print(f"Bodziec: {s:.1f}, Predykcja: {layer.prediction:.3f}, Błąd: {error:.3f}")
```

---

## 8. Zastosowania w HCI i projektowaniu mobilnym

### 8.1. Predykcja zachowania użytkownika

Modele kognitywne umożliwiają przewidywanie zachowania użytkownika bez przeprowadzania badań użytkowności:

1. **KLM**: szybkie szacowanie czasu zadania dla alternatywnych projektów UI
2. **GOMS**: analiza hierarchii celów użytkownika, identyfikacja zbędnych kroków
3. **ACT-R/PM**: modelowanie czasu wzrokowego poszukiwania elementów

### 8.2. Modele gestów dotykowych

Interakcja dotykowa wymaga modeli uwzględniających specyfikę gestów:

```python
# Model gestów dotykowych oparty na prawie Fittsa dla touch
import math

def touch_fitts(D_mm, W_mm, finger_offset=5, a=100, b=150):
    """
    Rozszerzone prawo Fittsa dla interakcji dotykowej.
    finger_offset: przesunięcie centrum dotyku vs centrum palca (mm)
    """
    W_effective = W_mm - 2 * finger_offset
    if W_effective <= 0:
        return float('inf'), float('inf')   # cel zbyt mały
    ID = math.log2(1 + D_mm / W_effective)
    MT = a + b * ID
    return MT, ID

# Minimalne rozmiary celów dla różnych scenariuszy
targets = [
    ("Duży przycisk 10mm", 50, 10),
    ("Standardowy 8mm", 50, 8),
    ("Mały element 5mm", 50, 5),
    ("Zbyt mały 3mm", 50, 3),
]
for name, D, W in targets:
    MT, ID = touch_fitts(D, W)
    print(f"{name}: MT={MT:.0f} ms" if MT != float('inf') else f"{name}: NIE DOSIĘGALNY")
```

### 8.3. Cognitive Walkthrough

Cognitive Walkthrough to metoda oceny interfejsu, w której ewaluator symuluje wykonanie zadania przez nowicjusza, odpowiadając na pytania:

1. Czy użytkownik będzie próbował osiągnąć właściwy efekt?
2. Czy użytkownik zauważy właściwą kontrolkę?
3. Czy użytkownik skojarzy kontrolkę z pożądanym efektem?
4. Czy użytkownik zrozumie wynik działania?

---

## 9. Proste implementacje modeli kognitywnych w Pythonie

### 9.1. Model ACT-R uproszczony (pamięć deklaratywna)

```python
import math
import time

class ACTRDeclarativeMemory:
    """
    Uproszczony model pamięci deklaratywnej ACT-R.
    Activation = Base-level activation + Associative spreading + Noise
    """
    DEFAULT_DECAY = 0.5      # parametr d
    NOISE_S = 0.25           # szum

    def __init__(self):
        self.chunks = {}     # {name: {'presentations': [(time, strength), ...]}}

    def add_chunk(self, name, content):
        if name not in self.chunks:
            self.chunks[name] = {'content': content, 'presentations': []}
        self.chunks[name]['presentations'].append(time.time())

    def base_level_activation(self, name, current_time=None):
        """Oblicza bazowy poziom aktywacji (Base-Level Learning)."""
        if name not in self.chunks:
            return float('-inf')
        t_now = current_time or time.time()
        presentations = self.chunks[name]['presentations']
        if not presentations:
            return float('-inf')
        decay_sum = sum(
            (t_now - t_j) ** (-self.DEFAULT_DECAY)
            for t_j in presentations
        )
        return math.log(decay_sum)

    def retrieve(self, threshold=-1.0):
        """Odzyskuje chunk z najwyższą aktywacją powyżej progu."""
        t_now = time.time()
        best_chunk, best_act = None, threshold
        for name in self.chunks:
            act = self.base_level_activation(name, t_now)
            if act > best_act:
                best_act, best_chunk = act, name
        return best_chunk, best_act


dm = ACTRDeclarativeMemory()
dm.add_chunk("Paris", {"capital_of": "France"})
dm.add_chunk("Paris", {"capital_of": "France"})  # drugie wystąpienie
dm.add_chunk("Berlin", {"capital_of": "Germany"})
chunk, act = dm.retrieve()
print(f"Odzyskano: {chunk} z aktywacją {act:.3f}")
```

---

## 10. Podsumowanie i kierunki rozwoju

Modele kognitywne są mostem między psychologią a inżynierią. Umożliwiają ilościowe projektowanie interfejsów, diagnostykę procesów poznawczych i budowę systemów AI zachowujących się po ludzku. Kluczowe trendy:

- **Neuro-symbolic models**: integracja LLM z architekturami symbolicznymi
- **Bayesian brain**: ujednolicone ramy predykcyjne dla wszystkich procesów
- **Digital twins of cognition**: modele osobowe, personalizowane
- **Cognitive load monitoring**: śledzenie obciążenia poznawczego w czasie rzeczywistym przez sygnały biologiczne (EEG, ECG, pupilometria)

## Literatura

1. Anderson, J. R. (2007). *How Can the Human Mind Occur in the Physical Universe?* Oxford University Press.
2. Baddeley, A. D., & Hitch, G. (1974). Working memory. *Psychology of Learning and Motivation*, 8, 47–89.
3. Card, S. K., Moran, T. P., & Newell, A. (1983). *The Psychology of Human-Computer Interaction*. Erlbaum.
4. Fitts, P. M. (1954). The information capacity of the human motor system. *Journal of Experimental Psychology*, 47(6).
5. Kahneman, D., & Tversky, A. (1979). Prospect Theory. *Econometrica*, 47(2), 263–291.
6. Laird, J. E. (2012). *The Soar Cognitive Architecture*. MIT Press.
7. Miller, G. A. (1956). The magical number seven. *Psychological Review*, 63(2), 81–97.
8. Newell, A., & Simon, H. A. (1972). *Human Problem Solving*. Prentice Hall.
9. Sun, R. (2006). *Cognition and Multi-Agent Interaction*. Cambridge University Press.

## Powiązane artykuły

- [Obliczeniowe modelowanie poznania](computational-cognition.md)
- [Percepcja kognitywna](cognitive-perception.md)
- [Architektura ACT-R](actr-architecture.md)
- [Architektura SOAR](soar-architecture.md)
- [Architektura CLARION](clarion-architecture.md)
- [Architektura LIDA](lida-architecture.md)
- [Robotyka kognitywna](cognitive-robotics.md)
- [Reprezentacja wiedzy](knowledge-representation.md)
