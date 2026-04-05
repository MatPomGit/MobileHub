# CLARION — Connectionist Learning with Adaptive Rule Induction On-line

## Streszczenie

CLARION (*Connectionist Learning with Adaptive Rule Induction On-line*) jest kognitywną architekturą opracowaną przez Rona Suna na Rensselaer Polytechnic Institute (RPI). Wyróżnia ją explicite dwuprocesowe podejście: jawne rozróżnienie między procesami symbolicznymi (góra — *top level*) i subsymbolicznymi (dół — *bottom level*), odpowiadające psychologicznej teorii dual-process. Architektura składa się z czterech podsystemów: Action-Centered (ACS), Non-Action-Centered (NACS), Motivational (MS) i Meta-Cognitive (MCS). Artykuł opisuje historię, podstawy teoretyczne, strukturę podsystemów, algorytm RERE, motywację, metakognicję, zastosowania i porównanie z innymi architekturami.

**Słowa kluczowe:** CLARION, architektura kognitywna, dual-process theory, uczenie niejawne, reguły symboliczne, sieci neuronowe, motywacja, metakognicja

## 1. Wprowadzenie

CLARION jest jedną z niewielu architektur kognitywnych, która explicite i symetrycznie modeluje dwa typy procesów poznawczych: jawne (*explicit*), czyli kontrolowane, symboliczne, podatne na raportowanie werbalne, oraz niejawne (*implicit*), czyli automatyczne, subsymboliczne, niedostępne introspektywnie. Rozróżnienie to pochodzi z psychologicznej teorii dwóch systemów (*dual-process theory*), szeroko dyskutowanej przez Kahnemana (2011) jako System 1 i System 2.

Ron Sun rozwinął CLARION z przekonania, że istniejące architektury kognitywne skupiają się albo na procesach symbolicznych (jak wczesny Soar czy ACT-R), albo na subsymbolicznych (jak sieci neuronowe), nie integrując obu poziomów w sposób, który pozwalałby modelować bogactwo ludzkich procesów poznawczych — zwłaszcza nabywanie wiedzy niejawnej i jej stopniowe werbalizowanie.

Projekt CLARION rozpoczął się na przełomie lat 80. i 90. XX wieku. Wersje implementacyjne są dostępne w Javie (CLARION Toolkit). Architektura jest stosowana przede wszystkim w badaniach nad modelowaniem poznania społecznego, uczeniem niejawnym i symulacjami społecznymi.

## 2. Teoretyczne podstawy

### 2.1. Teoria dual-process w psychologii

Teorię dual-process opisuje wielu badaczy, m.in. Epstein (1994), Sloman (1996) i Kahneman (2011). System 1 działa szybko, automatycznie, jest odpowiedzialny za nawyki, intuicje i skojarzenia. System 2 jest wolny, kontrolowany, oparty na regułach i podatny na werbalne raportowanie.

Sun argumentuje, że żadna wcześniejsza architektura kognitywna nie zintegrowała obu systemów w sposób, który pozwalałby modelować:
- stopniowe nabywanie wiedzy niejawnej (przez doświadczenie, bez explicite instrukcji),
- ekstrakcję jawnych reguł z wiedzy niejawnej (*bottom-up rule induction*),
- interakcję między regułami jawnymi a zachowaniami niejawnymi.

### 2.2. Connectionism i symbolizm w jednej architekturze

W CLARION poziom bottom realizowany jest przez sieci neuronowe (Q-networks dla ACS lub sieci feedforward dla NACS). Poziom top realizowany jest przez reguły symboliczne w formacie IF-THEN. Interakcja między nimi odbywa się w obu kierunkach:
- **bottom-up**: reguły są induktywnie ekstrahowane z sieci neuronowej,
- **top-down**: jawne reguły mogą inicjować lub modyfikować wektory aktywacji w sieciach.

## 3. Struktura architekturalna

### 3.1. Cztery podsystemy

CLARION składa się z czterech głównych podsystemów:

```
┌──────────────────────────────────────────────────────┐
│                  CLARION Agent                       │
│                                                      │
│  ┌─────────────────────┐  ┌───────────────────────┐  │
│  │  ACS                │  │  NACS                 │  │
│  │  Action-Centered    │  │  Non-Action-Centered  │  │
│  │  Subsystem          │  │  Subsystem            │  │
│  │  (co robić?)        │  │  (co wiedzieć?)       │  │
│  └─────────────────────┘  └───────────────────────┘  │
│                                                      │
│  ┌─────────────────────┐  ┌───────────────────────┐  │
│  │  MS                 │  │  MCS                  │  │
│  │  Motivational       │  │  Meta-Cognitive       │  │
│  │  Subsystem          │  │  Subsystem            │  │
│  │  (dlaczego?)        │  │  (jak regulować?)     │  │
│  └─────────────────────┘  └───────────────────────┘  │
└──────────────────────────────────────────────────────┘
```

### 3.2. Action-Centered Subsystem (ACS)

ACS jest odpowiedzialny za generowanie działań. Zawiera dwa poziomy:

**Bottom Level (BL-ACS)**: sieci neuronowe realizujące Q-learning. Każda para (stan, akcja) ma przypisaną wartość Q(s, a) aproksymowaną przez sieć. Stan jest wektorem cech środowiska; akcje to dostępne działania agenta.

```python
import numpy as np

class QLearningNetwork:
    """Uproszczona sieć Q-learning (bottom level ACS)."""
    def __init__(self, state_dim, action_dim, hidden=64):
        self.W1 = np.random.randn(state_dim, hidden) * 0.1
        self.W2 = np.random.randn(hidden, action_dim) * 0.1

    def forward(self, state):
        h = np.tanh(state @ self.W1)
        q_values = h @ self.W2
        return q_values

    def select_action(self, state, epsilon=0.1):
        """Selekcja akcji: epsilon-greedy."""
        if np.random.rand() < epsilon:
            return np.random.randint(self.W2.shape[1])
        q = self.forward(state)
        return np.argmax(q)

    def update(self, state, action, reward, next_state, done,
               alpha=0.01, gamma=0.9):
        """Aktualizacja Q-value przez TD-learning."""
        q_current = self.forward(state)
        q_next = self.forward(next_state)
        target = reward + (0 if done else gamma * np.max(q_next))
        q_current[action] = q_current[action] + alpha * (target - q_current[action])
        # Uproszczony gradient (pominięto backprop dla czytelności)
        return q_current
```

**Top Level (TL-ACS)**: baza reguł akcyjnych w formacie:

```
IF <condition> THEN <action> [z wagą / pewnością]
```

Przykładowe reguły:

```
IF obstacle_ahead = True AND distance < 0.5 THEN stop (certainty: 0.95)
IF goal_visible = True AND path_clear = True THEN move_forward (certainty: 0.80)
IF battery_level < 0.2 THEN navigate_to_charger (certainty: 0.99)
```

Reguły mają mierzalną pewność (*certainty*), aktualizowaną na podstawie historii sukcesów i porażek.

### 3.3. Non-Action-Centered Subsystem (NACS)

NACS przechowuje deklaratywną wiedzę ogólną — fakty, relacje i koncepty niezwiązane bezpośrednio z działaniem. Podobnie jak ACS, NACS ma dwa poziomy:
- **BL-NACS**: sieć asocjacyjna (autoencoder lub sieć pamięci asocjacyjnej) dla wiedzy niejawnej,
- **TL-NACS**: sieć semantyczna lub baza faktów w formacie jawnym.

NACS dostarcza wiedzę kontekstową dla ACS: agent może wzbogacić bieżący stan o informacje pobrane z NACS przed wyborem działania.

```python
class NACS_TopLevel:
    """Jawna sieć semantyczna (TL-NACS)."""
    def __init__(self):
        self.facts = {}  # {concept: {relation: value}}

    def add_fact(self, concept, relation, value):
        if concept not in self.facts:
            self.facts[concept] = {}
        self.facts[concept][relation] = value

    def query(self, concept, relation):
        return self.facts.get(concept, {}).get(relation, None)

    def reason_by_association(self, cue_concept):
        """Zwróć fakty powiązane z danym konceptem."""
        return self.facts.get(cue_concept, {})


# Przykład wypełnienia NACS
nacs = NACS_TopLevel()
nacs.add_fact("robot_lab", "location", "building_A")
nacs.add_fact("robot_lab", "has_charger", True)
nacs.add_fact("building_A", "accessible_from", "main_entrance")
print(nacs.query("robot_lab", "has_charger"))  # True
```

### 3.4. Motivational Subsystem (MS)

MS modeluje motywację i emocje agenta. Zawiera:
- **drives** (*popędy*): podstawowe potrzeby (przeżycie, energia, poznanie, przynależność społeczna),
- **goals** (*cele*): bieżące cele wynikające z aktywnych drives,
- **emotions** (*emocje*): stany afektywne (zadowolenie, frustracja, lęk) modulujące siłę drives.

MS wpływa na ACS przez parametryzację wartości nagród: działania prowadzące do zaspokojenia aktywnego drive są silniej premiowane.

```python
class MotivationalSubsystem:
    """Uproszczony podsystem motywacyjny CLARION."""
    def __init__(self):
        self.drives = {
            "survival": 1.0,    # przeżycie (np. poziom baterii)
            "achievement": 0.5, # osiągnięcia (wykonanie zadania)
            "affiliation": 0.3, # kontakty społeczne
        }
        self.emotional_state = {"satisfaction": 0.5, "frustration": 0.0}

    def update_drive(self, drive_name, delta):
        """Aktualizacja poziomu popędu."""
        self.drives[drive_name] = max(0.0, min(1.0,
                                     self.drives[drive_name] + delta))

    def compute_reward(self, outcome, active_drive):
        """Nagroda zależy od aktywnego popędu i wyniku działania."""
        base_reward = 1.0 if outcome == "success" else -0.5
        drive_weight = self.drives.get(active_drive, 0.5)
        return base_reward * drive_weight

    def update_emotion(self, outcome):
        if outcome == "success":
            self.emotional_state["satisfaction"] = min(1.0,
                self.emotional_state["satisfaction"] + 0.1)
            self.emotional_state["frustration"] = max(0.0,
                self.emotional_state["frustration"] - 0.05)
        else:
            self.emotional_state["frustration"] = min(1.0,
                self.emotional_state["frustration"] + 0.1)
```

### 3.5. Meta-Cognitive Subsystem (MCS)

MCS monitoruje działanie pozostałych podsystemów i reguluje parametry uczenia się. Pełni rolę egzekutywnej kontroli poznawczej. Funkcje MCS:
- monitorowanie efektywności ACS (czy reguły działają?),
- regulacja tempa uczenia się (zwiększanie/zmniejszanie epsilon w epsilon-greedy),
- decydowanie, kiedy warto ekstrahować nowe reguły z BL (trigger dla RERE),
- monitorowanie konfliktu między poziomem top a bottom.

```python
class MetaCognitiveSubsystem:
    """Uproszczony podsystem metakognitywny."""
    def __init__(self, acs):
        self.acs = acs
        self.performance_history = []

    def monitor_performance(self, reward):
        """Zapis historii nagród."""
        self.performance_history.append(reward)
        if len(self.performance_history) > 100:
            self.performance_history.pop(0)

    def regulate_exploration(self):
        """Dostosuj epsilon na podstawie niedawnych wyników."""
        if len(self.performance_history) < 10:
            return
        recent_avg = np.mean(self.performance_history[-10:])
        if recent_avg < 0:  # słabe wyniki → więcej eksploracji
            self.acs.epsilon = min(0.5, self.acs.epsilon * 1.1)
        else:  # dobre wyniki → mniej eksploracji
            self.acs.epsilon = max(0.05, self.acs.epsilon * 0.95)

    def should_trigger_rere(self):
        """Sprawdź, czy warto przeprowadzić ekstrakcję reguł."""
        if len(self.performance_history) < 20:
            return False
        recent_avg = np.mean(self.performance_history[-20:])
        return recent_avg > 0.5  # ekstrahuj reguły, gdy wydajność jest dobra
```

## 4. Algorytm RERE — Rule Extraction and Refinement

### 4.1. Zasada działania

RERE (*Rule Extraction and Refinement*) jest mechanizmem bottom-up, który ekstrahuje jawne reguły symboliczne z wytrenowanej sieci neuronowej (bottom level). Algorytm analizuje, które cechy stanu są najsilniej korelowane z wybraną akcją w sieci, i formułuje odpowiadające reguły IF-THEN.

### 4.2. Ekstrakcja reguł (Rule Extraction)

Ekstrakcja przebiega w następujący sposób:
1. Dla każdej pary (stan, akcja) o wysokim Q-value sprawdź, które cechy stanu były aktywne.
2. Utwórz kandydującą regułę: `IF <aktywne_cechy> THEN <akcja>`.
3. Oceń pewność reguły: `certainty = poprawne_aktywacje / całkowite_aktywacje`.

```python
def extract_rules(q_network, experience_buffer, threshold=0.7):
    """
    Ekstrakcja reguł z sieci Q-learning na podstawie bufora doświadczeń.
    experience_buffer: lista (state, action, reward, next_state)
    """
    rule_candidates = {}
    for state, action, reward, _ in experience_buffer:
        if reward <= 0:
            continue
        # Identyfikacja aktywnych cech (wartości powyżej progu)
        active_features = tuple(i for i, v in enumerate(state) if v > threshold)
        key = (active_features, action)
        if key not in rule_candidates:
            rule_candidates[key] = {"hits": 0, "total": 0}
        rule_candidates[key]["total"] += 1
        # Weryfikacja reguły przez sieć
        q_vals = q_network.forward(state)
        if np.argmax(q_vals) == action:
            rule_candidates[key]["hits"] += 1

    # Filtruj reguły o wysokiej pewności
    rules = []
    for (features, action), stats in rule_candidates.items():
        certainty = stats["hits"] / max(stats["total"], 1)
        if certainty >= 0.8 and stats["total"] >= 5:
            rules.append({
                "conditions": features,
                "action": action,
                "certainty": certainty
            })
    return rules
```

### 4.3. Doskonalenie reguł (Rule Refinement)

Ekstrahowane reguły mogą być zbyt ogólne lub mieć zbyt niską pewność. Mechanizm refinement:
- dodaje dodatkowe warunki do reguł dających błędne predykcje (*specialization*),
- usuwa zbędne warunki z reguł o zbyt wąskim zakresie (*generalization*),
- scala reguły o pokrywających się warunkach.

### 4.4. Integracja reguł z bottom level

Po ekstrakcji reguły TL mogą wpływać na decyzje BL przez mechanizm *top-down learning*: aktywacja reguły TL inicjuje preferencję określonej akcji w sieci BL, wzmacniając odpowiednie wagi.

```python
def top_down_update(q_network, rule, state, alpha=0.05):
    """
    Aktualizacja sieci BL na podstawie reguły TL.
    Jeśli reguła pasuje do stanu, wzmocnij Q(state, rule.action).
    """
    conditions_met = all(state[i] > 0.5 for i in rule["conditions"])
    if conditions_met:
        q_vals = q_network.forward(state)
        # Wzmocnij akcję wskazywaną przez regułę
        q_vals[rule["action"]] += alpha * rule["certainty"]
        # (Tu normalizacja lub update wag przez backprop)
    return q_vals
```

## 5. Interakcja między poziomami

### 5.1. Kombinacja wyjść BL i TL

W ACS decyzja o działaniu może być podjęta na podstawie obu poziomów łącznie. Istnieje kilka strategii kombinacji:
- **priorytety**: TL ma pierwszeństwo, gdy pewność reguły przekracza próg; w przeciwnym razie BL,
- **ważona kombinacja**: akcja jest wybierana przez ważoną sumę Q-values (BL) i pewności reguł (TL),
- **vote**: oba poziomy głosują; przy konflikcie wygrywa poziom z wyższą pewnością.

```python
def combined_action_selection(q_network, rules, state,
                               tl_threshold=0.85, epsilon=0.1):
    """
    Selekcja akcji z kombinacją bottom-level (QL) i top-level (reguły).
    """
    # Bottom level: Q-values
    q_vals = q_network.forward(state)
    bl_action = np.argmax(q_vals)

    # Top level: pasujące reguły
    matching_rules = [r for r in rules
                      if all(state[i] > 0.5 for i in r["conditions"])]

    if matching_rules:
        # Wybierz regułę o najwyższej pewności
        best_rule = max(matching_rules, key=lambda r: r["certainty"])
        if best_rule["certainty"] >= tl_threshold:
            return best_rule["action"], "top-level"

    # Epsilon-greedy na bottom level
    if np.random.rand() < epsilon:
        return np.random.randint(len(q_vals)), "random"
    return bl_action, "bottom-level"
```

## 6. CLARION w modelowaniu poznania społecznego

### 6.1. Symulacja zachowań społecznych

CLARION był wielokrotnie stosowany w symulacjach wieloagentowych, gdzie agenty muszą współdziałać i rywalizować. Podsystem MS pozwala modelować motywacje społeczne: drive przynależności (*affiliation*) sprawia, że agenty dążą do kooperacji; drive dominacji (*dominance*) wyzwala konkurencję.

### 6.2. Modelowanie norm społecznych

W ramach projektu Sun i współpracowników CLARION był używany do modelowania nabywania norm społecznych. Normy mogą być reprezentowane explicite w TL-ACS lub NACS jako reguły warunkowe. Nabywanie norm przebiega przez obserwację innych agentów i ekstrakcję reguł przez RERE.

### 6.3. Przykład: agent w symulacji rynkowej

```python
class MarketAgent:
    """
    Agent CLARION w symulacji rynkowej.
    Decyzja: kupić (0), sprzedać (1), czekać (2).
    """
    def __init__(self, state_dim=5, action_dim=3):
        self.ql_net = QLearningNetwork(state_dim, action_dim)
        self.rules = []
        self.ms = MotivationalSubsystem()
        self.mcs = MetaCognitiveSubsystem(self)
        self.epsilon = 0.2
        self.experience = []

    def act(self, market_state):
        action, source = combined_action_selection(
            self.ql_net, self.rules, market_state,
            tl_threshold=0.85, epsilon=self.epsilon
        )
        return action

    def learn(self, state, action, reward, next_state):
        self.ql_net.update(state, action, reward, next_state, done=False)
        self.experience.append((state, action, reward, next_state))
        self.mcs.monitor_performance(reward)
        self.mcs.regulate_exploration()
        # Ekstrahuj reguły co 50 kroków
        if len(self.experience) % 50 == 0 and self.mcs.should_trigger_rere():
            new_rules = extract_rules(self.ql_net, self.experience[-200:])
            self.rules.extend(new_rules)
            print(f"Wyekstrahowano {len(new_rules)} nowych reguł.")
```

## 7. Zastosowania w modelowaniu psychologicznym

### 7.1. Modelowanie uczenia niejawnego

CLARION był z sukcesem stosowany do modelowania eksperymentów nad uczeniem niejawnym (*implicit learning*), np. zadania SRT (*Serial Reaction Time*). W tych zadaniach uczestnicy uczą się sekwencji bez świadomości jej regularności. CLARION modeluje to przez bottom-level learning (sieć neuronowa) bez aktywacji RERE w pierwszych próbach — reguły pojawiają się dopiero przy dalszej ekspozycji.

### 7.2. Modelowanie teorii atrybucji

NACS może przechowywać schematy atrybucji przyczynowej (*causal attribution*). Agent wnioskuje o przyczynach zdarzeń (wewnętrzne vs. zewnętrzne, stabilne vs. niestabilne) i te atrybucje wpływają na MS (frustracja przy atrybucji wewnętrznej stabilnej niepowodzenia).

### 7.3. Zastosowania w edukacji i e-learningu

Modele CLARION studentów mogą śledzić postęp w nabywaniu umiejętności: początkowo dominuje bottom-level learning (ćwiczenie przez przykłady), stopniowo reguły TL wzbogacają wiedzę jawną. System tutorujący oparty na CLARION może dostosowywać prezentację materiału do aktualnego stosunku wiedzy jawnej do niejawnej ucznia.

## 8. CLARION w aplikacjach mobilnych

Choć CLARION nie jest natywną platformą mobilną, jego zasady mogą być zastosowane w systemach adaptacyjnych na urządzenia mobilne:
- **Adaptacyjny interfejs użytkownika**: agent CLARION uczy się preferencji użytkownika przez bottom-level (pattern recognition) i ekstrahuje jawne reguły (np. „użytkownik woli duże przyciski o poranku").
- **Personalizacja treści**: bottom-level Q-network uczy się, jakie treści są preferowane przez użytkownika; reguły TL mogą kodować explicite preferencje tematyczne.
- **Asystent organizacji dnia**: drives MS modelują priorytety użytkownika; ACS dobiera powiadomienia i sugestie.

```python
# Koncepcja adaptacyjnego asystenta mobilnego opartego na CLARION
class MobileClarionAssistant:
    def __init__(self):
        # Stan: [pora_dnia (0-1), aktywność_fizyczna (0-1),
        #        czas_od_ostatniej_notyfikacji (0-1),
        #        dzien_tygodnia (0-1), poziom_baterii (0-1)]
        self.ql = QLearningNetwork(state_dim=5, action_dim=4)
        # Akcje: 0=powiadomienie, 1=cisza, 2=przypomnij_pozniej, 3=sugestia
        self.rules = []
        self.experience_buffer = []

    def decide(self, context_state):
        action, source = combined_action_selection(
            self.ql, self.rules, context_state
        )
        actions = ["notification", "silence", "remind_later", "suggestion"]
        return actions[action], source

    def feedback(self, state, action, user_engaged):
        """Nagroda: +1 jeśli użytkownik zareagował, -0.5 jeśli zignorował."""
        reward = 1.0 if user_engaged else -0.5
        self.ql.update(state, action, reward, state, done=False)
        self.experience_buffer.append((state, action, reward, state))
        if len(self.experience_buffer) % 30 == 0:
            new_rules = extract_rules(self.ql, self.experience_buffer[-100:])
            self.rules.extend(new_rules)
```

## 9. Porównanie z innymi architekturami

### 9.1. CLARION a ACT-R

ACT-R integruje subsymbolikę z poziomem symbolicznym przez mechanizmy aktywacji, nie oddzielając strukturalnie warstw. CLARION oddziela je explicite. ACT-R dostarcza bogatszych przewidywań empirycznych dotyczących czasu reakcji i efektów pamięciowych. CLARION lepiej modeluje nabywanie wiedzy niejawnej i ekstrakcję reguł z doświadczenia.

### 9.2. CLARION a Soar

Soar realizuje uczenie przez chunking (kompilacja wyników deliberacji do reguł) — mechanizm top-down, gdzie wiedza proceduralna pochodzi z rozwiązywania problemów na wyższym poziomie. CLARION realizuje uczenie bottom-up (ekstrakcja reguł z sieci neuronowej). Soar ma mocniejszy mechanizm planowania; CLARION mocniejszy mechanizm modelowania procesów niejawnych.

### 9.3. CLARION a LIDA

LIDA skupia się na cyklu percepcja-uwaga-działanie i modelu świadomości dostępu. CLARION skupia się na dwuprocesowej strukturze wiedzy i uczeniu. W LIDA świadomość dostępu jest explicite modelowanym mechanizmem; w CLARION analogon świadomości to reguły TL, ale nie jest to explicite GWT.

| Cecha | CLARION | ACT-R | Soar | LIDA |
|---|---|---|---|---|
| Dual-process | Explicite (BL/TL) | Implicite (subsymbolika) | Nie | Częściowo |
| Uczenie niejawne | Centralne (BL QL) | Ograniczone | Nie | Hebbian (PAM) |
| Motywacja/emocje | MS (explicite) | Nie | Nie | Częściowo |
| Metakognicja | MCS (explicite) | Nie | Nie | Nie |
| Ekstrakcja reguł | RERE | Nie | Chunking | Nie |
| Sieci neuronowe | Centralne (BL) | Nie | Nie | PAM |
| Planowanie | Ograniczone | Ograniczone | Subgoaling | Ograniczone |

## 10. Ograniczenia i perspektywy

CLARION ma kilka ograniczeń. Integracja z głębokimi sieciami neuronowymi (CNN, RNN) zamiast prostych sieci feedforward jest możliwa, ale nie była szeroko eksplorowana. Skalowanie do dużych środowisk robotycznych jest trudne. Ponadto CLARION nie był tak szeroko walidowany empirycznie jak ACT-R pod względem przewidywania czasów reakcji i efektów pamięciowych.

Perspektywy rozwoju obejmują integrację głębokich sieci jako bottom-level (co odpowiada trendom hybrydowym w AI), rozbudowę MS o bardziej szczegółowe modele afektywne oraz zastosowania w personalizowanych systemach edukacyjnych i asystentach mobilnych.

## 11. Podsumowanie

CLARION jest architekturą kognitywną o wyjątkowym profilu: explicite modeluje dwa typy procesów poznawczych (jawne i niejawne), obejmuje motywację i metakognicję, i dostarcza mechanizm ekstrakcji reguł z sieci neuronowych. Te cechy czynią ją szczególnie przydatną do modelowania uczenia niejawnego, zachowań społecznych i adaptacyjnych systemów mobilnych. Dla studentów programowania aplikacji mobilnych CLARION jest ważnym wzorcem dla systemów uczących się preferencji i kontekstu użytkownika na podstawie doświadczenia, bez konieczności explicite programowania wszystkich reguł.

## Literatura

1. Sun, R. (2006). The CLARION cognitive architecture: Extending cognitive modeling to social simulation. In *Cognition and Multi-Agent Interaction*. Cambridge University Press.
2. Sun, R. (2002). *Duality of the Mind: A Bottom-Up Approach Toward Cognition*. Erlbaum.
3. Sun, R., Merrill, E., & Peterson, T. (2001). From implicit skills to explicit knowledge: A bottom-up model of skill learning. *Cognitive Science*, 25(2), 203–244.
4. Kahneman, D. (2011). *Thinking, Fast and Slow*. Farrar, Straus and Giroux.
5. Sloman, S. A. (1996). The empirical case for two systems of reasoning. *Psychological Bulletin*, 119(1), 3–22.
6. Sun, R., & Zhang, X. (2004). Accounting for a variety of reasoning data within a cognitive architecture. *Journal of Experimental and Theoretical Artificial Intelligence*, 16(4), 215–250.
7. Anderson, J. R., & Lebiere, C. (1998). *The Atomic Components of Thought*. Erlbaum.
8. Laird, J. E. (2012). *The Soar Cognitive Architecture*. MIT Press.
9. Franklin, S., & Graesser, A. (1997). Is it an agent, or just a program? *LNAI 1193*, Springer.
10. Wilson, N. R., & Sun, R. (2011). A motivationally based simulation of performance degradation under pressure. *Neural Networks*, 24(4), 363–374.

## Powiązane artykuły

- [Modele kognitywne](cognitive-models.md)
- [Obliczeniowe modelowanie poznania](computational-cognition.md)
- [ACT-R](actr-architecture.md)
- [Soar — architektura kognitywna](soar-architecture.md)
- [LIDA](lida-architecture.md)
- [Inteligentny agent](intelligent-agent.md)
- [Reprezentacja wiedzy](knowledge-representation.md)
- [Robotyka kognitywna](cognitive-robotics.md)
