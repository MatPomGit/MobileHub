# Computational Cognition

Computational cognition (kognicja obliczeniowa) to dziedzina nauki badająca procesy poznawcze człowieka za pomocą modeli matematycznych i symulacji komputerowych. Łączy psychologię kognitywną, neuronaukę, sztuczną inteligencję i statystykę w celu formalnego opisu tego, jak umysł postrzega, uczy się, zapamiętuje i wnioskuje.

## Czym jest kognicja obliczeniowa?

Kognicja obliczeniowa opiera się na założeniu, że procesy myślowe można opisać jako obliczenia wykonywane na reprezentacjach umysłowych — podobnie jak komputer przetwarza dane zgodnie z algorytmem.

Kluczowe pytania badawcze:
- Jakie **reprezentacje** przechowuje umysł? (obrazy, koncepty, schematy, wektory cech)
- Jakie **algorytmy** działają na tych reprezentacjach? (Bayes, sieci neuronowe, logika)
- Jak te algorytmy są **implementowane** w mózgu? (sieci neuronowe biologiczne)

Trzy poziomy analizy (Marr, 1982):

```
Poziom obliczeniowy  →  Co problem jest rozwiązywany i dlaczego?
Poziom algorytmiczny →  Jak jest rozwiązywany? Jakie reprezentacje i procedury?
Poziom implementacyjny → Jak jest to realizowane fizycznie (neurony, krzemowe układy)?
```

## Modele Bayesowskie

Bayesowskie modele kognicji traktują umysł jako maszynę wnioskowania probabilistycznego:

### Bayesowski mózg

Hipoteza Bayesowskiego mózgu głosi, że percepcja to optymalne wnioskowanie o przyczynach sygnałów sensorycznych:

```
P(przyczyna | sygnał) ∝ P(sygnał | przyczyna) × P(przyczyna)
     ↑                        ↑                      ↑
  Percepcja            Wiarygodność              A priori
 (posterior)           (likelihood)             (wiedza)
```

Przykład: rozpoznawanie mowy w hałaśliwym środowisku:

```python
import numpy as np
from scipy.stats import norm

class BayesianWordRecognizer:
    """Uproszczony model bayesowski rozpoznawania słów."""

    def __init__(self, vocabulary, prior_probs):
        self.vocabulary = vocabulary        # lista słów
        self.prior_probs = prior_probs      # P(słowo) z częstości języka

    def recognize(self, acoustic_features, noise_level=0.1):
        """
        acoustic_features: wektor cech akustycznych (MFCC)
        noise_level: szacowany poziom szumu (σ)
        """
        posteriors = {}
        for word in self.vocabulary:
            # P(sygnał | słowo) — model akustyczny
            expected = self.acoustic_model[word]
            likelihood = norm.pdf(
                acoustic_features, loc=expected, scale=noise_level
            ).prod()

            # Reguła Bayesa
            posteriors[word] = likelihood * self.prior_probs[word]

        # Normalizacja
        total = sum(posteriors.values())
        return {w: p / total for w, p in posteriors.items()}
```

### Model Bayesowski uczenia kategorii

Jak dzieci uczą się pojęć z niewielu przykładów? Model Tenenbauma i Griffithsa:

```python
def bayesian_concept_learning(examples, hypothesis_space):
    """
    examples: lista przykładów (np. liczby: [2, 4, 8])
    hypothesis_space: zbiór hipotez (np. "parzyste", "potęgi 2", "< 10")
    """
    posteriors = {}
    for hypothesis in hypothesis_space:
        # Zasada wielkości (size principle): mniejszy spójny zbiór → wyższa wiarygodność
        consistent_examples = [e for e in hypothesis.extension
                                if hypothesis.contains(e)]
        if not all(hypothesis.contains(ex) for ex in examples):
            posteriors[hypothesis] = 0.0
            continue

        # P(przykłady | hipoteza) ∝ (1/|hipoteza|)^n
        size = len(consistent_examples)
        likelihood = (1.0 / size) ** len(examples)

        posteriors[hypothesis] = likelihood * hypothesis.prior

    # Normalizacja
    total = sum(posteriors.values())
    return {h: p / total for h, p in posteriors.items()}
```

## Modele sieci neuronowych

### Sieć Hopfielda — model pamięci asocjatywnej

Sieć Hopfielda modeluje pamięć jako atraktor dynamiki sieci neuronów:

```python
import numpy as np

class HopfieldNetwork:
    """Model pamięci asocjatywnej (Hopfield, 1982)."""

    def __init__(self, n_units):
        self.n = n_units
        self.W = np.zeros((n_units, n_units))  # macierz wag

    def store_pattern(self, pattern):
        """Zapamiętaj wzorzec (wektor binarny {-1, +1})."""
        p = np.array(pattern)
        # Reguła Hebba: wzmacniaj powiązania między współaktywowanymi neuronami
        self.W += np.outer(p, p)
        np.fill_diagonal(self.W, 0)  # bez połączeń zwrotnych

    def recall(self, partial_pattern, max_iterations=20):
        """Odtwórz zapamiętany wzorzec z częściowej wskazówki."""
        state = np.array(partial_pattern, dtype=float)
        for _ in range(max_iterations):
            new_state = np.sign(self.W @ state)
            if np.array_equal(new_state, state):
                break  # osiągnięto stan stabilny (atraktor)
            state = new_state
        return state
```

### Modele predykcyjnego przetwarzania (Predictive Coding)

Mózg nieustannie generuje predykcje sensoryczne i aktualizuje je na podstawie błędów predykcji:

```
Wyższy poziom → predykcja → Niższy poziom
Niższy poziom → błąd predykcji → Wyższy poziom
```

Matematycznie (minimalizacja energii swobodnej):

```python
class PredictiveCodingLayer:
    """Pojedyncza warstwa modelu predykcyjnego przetwarzania."""

    def __init__(self, n_input, n_hidden, learning_rate=0.01):
        self.W = np.random.randn(n_hidden, n_input) * 0.1  # wagi predykcji
        self.lr = learning_rate

    def predict(self, higher_level_representation):
        """Wygeneruj predykcję niższego poziomu."""
        return np.tanh(self.W @ higher_level_representation)

    def update(self, prediction_error, higher_level_repr):
        """Zaktualizuj wagi na podstawie błędu predykcji."""
        # Minimalizacja błędu kwadratowego
        grad = np.outer(prediction_error, higher_level_repr)
        self.W += self.lr * grad
        return grad  # propaguj błąd wyżej
```

## Modele uczenia się i pamięci

### Model ACT-R: pamięć deklaratywna

Aktywacja elementu pamięci w ACT-R zależy od czasu i częstości użycia:

```
Aktywacja(i) = ln(Σ tⱼ⁻ᵈ) + ε
                 j
```
gdzie `tⱼ` to czas od j-tego użycia, `d` to parametr zanikania (≈ 0.5), `ε` to szum.

```python
import math
import time
import numpy as np

class ACTRMemoryChunk:
    """Element pamięci deklaratywnej ACT-R."""

    def __init__(self, content, base_level=0.0):
        self.content = content
        self.retrievals = []    # czasy dostępu
        self.base_level = base_level

    def record_retrieval(self):
        self.retrievals.append(time.time())

    def compute_activation(self, decay=0.5, noise=0.25):
        now = time.time()
        if not self.retrievals:
            return self.base_level

        # Bazowy poziom aktywacji (Base Level Learning)
        bl_sum = sum(
            (now - t) ** (-decay) for t in self.retrievals
        )
        base_level = math.log(bl_sum) if bl_sum > 0 else -float('inf')

        # Szum proceduralny
        noise_term = np.random.logistic(0, noise)
        return base_level + noise_term

    def retrieval_probability(self, threshold=-1.5):
        """Prawdopodobieństwo skutecznego przypomnienia."""
        activation = self.compute_activation()
        # Logistyczna funkcja aktywacji
        return 1.0 / (1.0 + math.exp(-(activation - threshold)))
```

Szczegółowy opis ACT-R: [ACT-R — Adaptive Control of Thought Rational](#wiki-actr-architecture)

### Model MINERVA 2 — pamięć epizodyczna

Rozpoznawanie wzorców przez sumowanie podobieństwa:

```python
def minerva2_echo(probe, memory_traces, learning_rate=0.7):
    """
    Oblicz echo pamięci dla danego bodźca (probe).
    probe: wektor reprezentujący pytanie/bodziec
    memory_traces: lista zapamiętanych wzorców
    """
    similarities = []
    for trace in memory_traces:
        # Podobieństwo kosinusowe
        dot = np.dot(probe, trace)
        norm_p = np.linalg.norm(probe)
        norm_t = np.linalg.norm(trace)
        sim = dot / (norm_p * norm_t + 1e-8)
        similarities.append(sim ** 3)  # Sześcian wzmacnia silne podobieństwa

    # Echo = ważona suma śladów pamięci
    total_activation = sum(similarities)
    if total_activation == 0:
        return np.zeros_like(probe)

    echo = sum(
        s * trace for s, trace in zip(similarities, memory_traces)
    ) / total_activation
    return echo
```

## Modele decyzji i wnioskowania

### Teoria perspektywy (Kahneman & Tversky)

Ludzie nie są racjonalnymi aktorami — ich decyzje naruszają teorię oczekiwanej użyteczności:

```python
def prospect_theory_value(x, alpha=0.88, beta=0.88, lambda_loss=2.25):
    """
    Funkcja wartości teorii perspektywy.
    x > 0: zysk, x < 0: strata
    alpha, beta: parametry krzywizny
    lambda_loss: awersja do strat (≈2.25 według Kahnemana)
    """
    if x >= 0:
        return x ** alpha
    else:
        return -lambda_loss * ((-x) ** beta)

# Ważenie prawdopodobieństwa — ludzie przeceniają małe, niedoceniają duże
def prospect_theory_weight(p, gamma=0.65):
    """Funkcja ważenia prawdopodobieństwa."""
    return p ** gamma / (p ** gamma + (1 - p) ** gamma) ** (1 / gamma)
```

### Model dryftu dyfuzji (DDM)

Model procesu akumulacji dowodów przy decyzjach binarnych:

```
Dowód    ↑ +a (granica TAK)
         │
     v·t │ (drift rate × czas)
         │
Szum: ───┼──────────────────────────→ czas
         │
         │
         ↓ -a (granica NIE)
```

```python
def simulate_ddm(drift_rate=0.5, boundary=1.0, noise=1.0, dt=0.001):
    """
    Symuluj jeden trial modelu dryftu dyfuzji.
    Zwraca: (czas odpowiedzi, decyzja: +1 lub -1)
    """
    evidence = 0.0
    t = 0.0
    while True:
        evidence += drift_rate * dt + noise * np.sqrt(dt) * np.random.randn()
        t += dt
        if evidence >= boundary:
            return t, +1   # odpowiedź "TAK"
        if evidence <= -boundary:
            return t, -1   # odpowiedź "NIE"
```

## Modelowanie kognitywne a AI

### Różnice i podobieństwa

| Aspekt | Kognicja obliczeniowa | Klasyczna AI |
|--------|----------------------|--------------|
| **Cel** | Rozumienie umysłu | Rozwiązywanie problemów |
| **Walidacja** | Dane psychologiczne i neuronaukowe | Metryki wydajności |
| **Modele** | Ograniczone pojemnością człowieka | Dowolna złożoność |
| **Szum i błędy** | Modelowane celowo | Minimalizowane |
| **Czas reakcji** | Kluczowy wskaźnik | Zwykle nieistotny |

### Duże modele językowe (LLM) jako modele kognitywne

Modele jak GPT-4 wykazują zaskakujące podobieństwo do ludzkich wzorców poznawczych:

- Efekt częstości: częstsze słowa rozpoznawane szybciej
- Błędy morfologiczne: podobne do błędów ludzkich
- Reprezentacje semantyczne: zbliżone do ludzkich norm skojarzeń
- Nieracjonalne wnioskowanie: podobne błędy jak ludzie (złudzenia kognitywne)

```python
# Przykład: pomiar "czasu reakcji" LLM jako modelu kognitywnego
import time

def measure_cognitive_load(model, word_pair, prime=None):
    """
    Mierz czas odpowiedzi modelu na pary słów — analogia do RT w psychologii.
    """
    if prime:
        # Priming — poprzedni kontekst wpływa na odpowiedź
        prompt = f"Słowo: {prime}. Czy '{word_pair[0]}' i '{word_pair[1]}' są powiązane? Odpowiedz tak/nie."
    else:
        prompt = f"Czy '{word_pair[0]}' i '{word_pair[1]}' są powiązane? Odpowiedz tak/nie."

    start = time.perf_counter()
    response = model.generate(prompt, max_tokens=5)
    rt = time.perf_counter() - start

    return {'response': response, 'reaction_time': rt}
```

## Zastosowania w technologii mobilnej

Modele kognicji obliczeniowej mają bezpośrednie zastosowania w aplikacjach mobilnych:

### Adaptacyjne systemy tutoringu

Modele ACT-R i MINERVA 2 są podstawą aplikacji e-learningowych, które dostosowują trudność i harmonogram powtórek do indywidualnego profilu uczącego się (spaced repetition, algorytm SM-2 w Anki).

### Systemy rekomendacji uwzględniające uwagę

Modele uwagi kognitywnej pozwalają przewidywać, kiedy użytkownik jest gotowy na odbiór informacji, a kiedy jest przeciążony.

### Interfejsy przewidujące intencje

Systemy predykcji tekstu i gestów (jak SwipeType, QuickType) korzystają z modeli probabilistycznych podobnych do Bayesowskich modeli planowania ruchu.

## Powiązane artykuły

- [Robotyka poznawcza](#wiki-cognitive-robotics)
- [Modele kognitywne](#wiki-cognitive-models)
- [Modelowanie kognitywne ludzkiej percepcji](#wiki-cognitive-perception)
- [ACT-R](#wiki-actr-architecture)
- [Soar — architektura kognitywna](#wiki-soar-architecture)
- [CLARION](#wiki-clarion-architecture)
- [LIDA](#wiki-lida-architecture)
- [Reprezentacja wiedzy i wnioskowanie](#wiki-knowledge-representation)
- [Inteligentni agenci](#wiki-intelligent-agent)

## Linki zewnętrzne

- [Cognitive Science Society](https://cognitivesciencesociety.org/)
- [Journal of Mathematical Psychology](https://www.journals.elsevier.com/journal-of-mathematical-psychology)
- [pymc — probabilistyczne programowanie w Pythonie](https://www.pymc.io/)
- [ACT-R Project (CMU)](http://act-r.psy.cmu.edu/)
- [Computational Cognitive Neuroscience (Randall O'Reilly)](https://compcogneuro.org/)
