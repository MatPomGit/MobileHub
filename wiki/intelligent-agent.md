# Inteligentny agent (Intelligent Agent)

Inteligentny agent to system obliczeniowy, który **postrzega swoje środowisko** za pomocą sensorów i **podejmuje działania** za pomocą efektorów, dążąc do maksymalizacji pewnej miary wydajności. Pojęcie to stanowi jedno z centralnych w nowoczesnej sztucznej inteligencji i jest rdzeniem większości architektur kognitywnych.

## Formalna definicja

Klasyczna definicja (Russell & Norvig, *Artificial Intelligence: A Modern Approach*):

> „Agent to cokolwiek, co może być postrzegane jako postrzegające swoje środowisko przez sensory i działające na to środowisko przez efektory."

Formalnie, agent to funkcja:

```
f: P* → A
```

gdzie `P*` to ciąg historii percepcji, a `A` to zbiór dostępnych akcji. Agent *racjonalny* wybiera akcje maksymalizujące oczekiwaną wartość miary wydajności.

## Struktura agenta

```
┌──────────────────────────────────────────┐
│              AGENT                        │
│                                           │
│  ┌─────────────┐    ┌─────────────────┐  │
│  │   Sensory   │───▶│  Baza wiedzy /  │  │
│  └─────────────┘    │  Stan wewnętrzny│  │
│                     └────────┬────────┘  │
│                              │           │
│                     ┌────────▼────────┐  │
│                     │   Program       │  │
│                     │   agenta        │  │
│                     └────────┬────────┘  │
│                              │           │
│  ┌─────────────┐    ┌────────▼────────┐  │
│  │  Środowisko │◀───│    Efektory     │  │
│  └─────────────┘    └─────────────────┘  │
└──────────────────────────────────────────┘
```

## Hierarchia typów inteligentnych agentów

### 1. Agent odruchowy prosty (Simple Reflex Agent)

Reaguje wyłącznie na bieżącą percepcję, ignorując historię:

```python
class SimpleReflexAgent:
    """Agent odruchowy prosty — tylko bieżąca percepcja."""

    RULES = {
        'obstacle_ahead': 'turn_right',
        'goal_visible': 'move_forward',
        'battery_critical': 'return_to_base',
    }

    def act(self, percept: dict) -> str:
        for condition, action in self.RULES.items():
            if percept.get(condition):
                return action
        return 'wait'
```

**Ograniczenie:** nie radzi sobie z częściowo obserwowalnym środowiskiem.

### 2. Agent z modelem (Model-Based Reflex Agent)

Przechowuje wewnętrzną reprezentację stanu świata:

```python
class ModelBasedAgent:
    """Agent z modelem środowiska."""

    def __init__(self):
        self.internal_state: dict = {}       # model świata
        self.last_action: str | None = None

    def update_state(self, percept: dict) -> dict:
        """
        Aktualizuj model świata na podstawie:
        - jak akcja zmieniła środowisko (model przejść)
        - co percepcja ujawnia o bieżącym stanie (model sensoryczny)
        """
        if self.last_action == 'move_forward':
            self.internal_state['position'] = (
                self.internal_state.get('position', (0, 0))[0] + 1,
                self.internal_state.get('position', (0, 0))[1]
            )
        self.internal_state.update(percept)
        return self.internal_state

    def act(self, percept: dict) -> str:
        state = self.update_state(percept)
        # Decyzja na podstawie pełnego modelu stanu
        if state.get('obstacle_at', {}).get(state.get('position')):
            self.last_action = 'turn_right'
            return 'turn_right'
        self.last_action = 'move_forward'
        return 'move_forward'
```

### 3. Agent celowy (Goal-Based Agent)

Planuje sekwencje akcji prowadzące do wyznaczonego celu:

```python
from collections import deque

class GoalBasedAgent:
    """Agent celowy z prostym planowaniem BFS."""

    def __init__(self, goal_state):
        self.goal = goal_state
        self.plan: list[str] = []

    def is_goal(self, state: dict) -> bool:
        return all(state.get(k) == v for k, v in self.goal.items())

    def plan_bfs(self, initial_state: dict,
                 actions: list[str],
                 transition: callable) -> list[str]:
        """Zaplanuj ścieżkę do celu (BFS)."""
        queue = deque([(initial_state, [])])
        visited = set()

        while queue:
            state, path = queue.popleft()
            state_key = str(sorted(state.items()))

            if state_key in visited:
                continue
            visited.add(state_key)

            if self.is_goal(state):
                return path

            for action in actions:
                next_state = transition(state, action)
                queue.append((next_state, path + [action]))

        return []  # brak planu

    def act(self, current_state: dict, available_actions, transition) -> str:
        if not self.plan:
            self.plan = self.plan_bfs(current_state, available_actions, transition)
        return self.plan.pop(0) if self.plan else 'wait'
```

### 4. Agent użytecznościowy (Utility-Based Agent)

Zamiast binarnego celu — maksymalizuje funkcję użyteczności:

```python
import math

class UtilityBasedAgent:
    """Agent maksymalizujący oczekiwaną użyteczność."""

    def utility(self, state: dict) -> float:
        """
        Przykład funkcji użyteczności dla systemu rekomendacji:
        - Nagroda za trafność treści
        - Kara za czas czytania (UX)
        - Kara za powtarzanie się treści
        """
        relevance    = state.get('relevance_score', 0)      # 0–1
        reading_time = state.get('reading_time_min', 5)
        novelty      = state.get('novelty_score', 0.5)      # 0–1

        return relevance * novelty / math.log1p(reading_time)

    def act(self, possible_actions: list[dict]) -> dict:
        """Wybierz akcję z najwyższą oczekiwaną użytecznością."""
        return max(possible_actions, key=self.utility)
```

### 5. Agent uczący się (Learning Agent)

Najogólniejsza forma — poprawia swoją funkcję decyzyjną na podstawie doświadczenia:

```
┌────────────────────────────────────────────┐
│          AGENT UCZĄCY SIĘ                   │
│                                             │
│  ┌────────────┐     ┌──────────────────┐   │
│  │  Element   │────▶│  Element         │   │
│  │ uczący się │     │  wykonawczy      │──▶│ Akcje
│  └─────┬──────┘     └──────────────────┘   │
│        │                    ▲              │
│  ┌─────▼──────┐    ┌────────┴────────┐     │
│  │  Kryterium │    │  Baza wiedzy    │     │
│  │  wydajności│    │  (polityka)     │     │
│  └────────────┘    └─────────────────┘     │
│        ▲                                   │
└────────┼───────────────────────────────────┘
    Nagroda / kara ze środowiska
```

```python
import numpy as np

class QLearningAgent:
    """Agent uczący się metodą Q-Learning."""

    def __init__(self, n_states, n_actions,
                 alpha=0.1, gamma=0.95, epsilon=0.1):
        self.Q = np.zeros((n_states, n_actions))  # tabela Q
        self.alpha = alpha      # współczynnik uczenia
        self.gamma = gamma      # współczynnik dyskontowania przyszłych nagród
        self.epsilon = epsilon  # prawdopodobieństwo eksploracji

    def act(self, state: int) -> int:
        """Strategia epsilon-greedy: eksploracja vs. eksploatacja."""
        if np.random.random() < self.epsilon:
            return np.random.randint(self.Q.shape[1])   # losowa akcja
        return int(np.argmax(self.Q[state]))             # najlepsza znana akcja

    def learn(self, state: int, action: int,
              reward: float, next_state: int):
        """Aktualizacja tabeli Q (reguła Bellmana)."""
        target = reward + self.gamma * np.max(self.Q[next_state])
        td_error = target - self.Q[state, action]
        self.Q[state, action] += self.alpha * td_error
```

## Racjonalność agenta

Racjonalność agenta zależy od czterech czynników:
1. Miary wydajności definiującej kryterium sukcesu
2. Wcześniejszej wiedzy agenta o środowisku
3. Dostępnych akcji
4. Historii percepcji do bieżącej chwili

> **Ważne rozróżnienie:** Racjonalność ≠ wszechwiedza. Racjonalny agent maksymalizuje *oczekiwaną* wydajność — może mylić się z powodu niepewności co do środowiska.

## Własności środowiska a wybór architektury

Właściwy typ agenta zależy od charakteru środowiska:

```
Środowisko        │ Zalecana architektura agenta
──────────────────┼──────────────────────────────────
Pełne, statyczne  │ Agent odruchowy prosty
Częściowe, stat.  │ Agent z modelem
Dynamiczne, cel   │ Agent celowy + planer
Stoch., złożone   │ Agent użytecznościowy
Nieznane          │ Agent uczący się (RL/ML)
Wieloagentowe     │ Agent BDI + protokół komunikacji
```

## Inteligentne agenty w aplikacjach mobilnych

### Asystenci głosowi

Siri, Google Assistant i Cortana są przykładami inteligentnych agentów mobilnych:

```
Wejście (mowa) → ASR → NLU → Dialog Manager → NLG → TTS → Wyjście (mowa)
                              ↕
                        Baza wiedzy / API
```

### Agenty personalizacji

```python
class MobilePersonalizationAgent:
    """Agent dostosowujący interfejs do zachowań użytkownika."""

    def __init__(self):
        self.user_model = {}        # model użytkownika
        self.adaptation_rules = []

    def observe(self, event: dict):
        """Aktualizuj model użytkownika na podstawie interakcji."""
        app = event.get('app_used')
        time_of_day = event.get('hour')

        # Zlicz użycie aplikacji o różnych porach dnia
        key = (app, time_of_day // 6)  # 4 bloki 6-godzinne
        self.user_model[key] = self.user_model.get(key, 0) + 1

    def recommend(self, current_hour: int) -> list[str]:
        """Zaproponuj aplikacje odpowiednie na bieżącą porę dnia."""
        block = current_hour // 6
        scores = {
            app: count
            for (app, b), count in self.user_model.items()
            if b == block
        }
        return sorted(scores, key=scores.get, reverse=True)[:5]
```

### Agenty w IoT i Smart Home

W ekosystemach Smart Home inteligentne agenty zarządzają urządzeniami:

```python
class SmartHomeAgent:
    """Agent zarządzający urządzeniami Smart Home."""

    def __init__(self, devices: dict):
        self.devices = devices          # id → urządzenie
        self.preferences = {}           # preferencje użytkownika
        self.schedule: list[dict] = []  # harmonogram akcji

    def perceive(self) -> dict:
        return {
            'temperature': self.devices['thermostat'].read(),
            'light_level': self.devices['lux_sensor'].read(),
            'motion': self.devices['pir'].read(),
            'time': __import__('datetime').datetime.now()
        }

    def decide(self, state: dict) -> list[dict]:
        actions = []
        # Przykład: automatyczne dostosowanie oświetlenia
        if state['light_level'] < 100 and state['motion']:
            actions.append({'device': 'lights', 'action': 'set_brightness',
                            'value': 80})
        # Automatyczna regulacja temperatury
        preferred_temp = self.preferences.get('temperature', 21)
        if abs(state['temperature'] - preferred_temp) > 1.5:
            actions.append({'device': 'thermostat', 'action': 'set_target',
                            'value': preferred_temp})
        return actions
```

## Porównanie z klasycznym programowaniem

| Cecha | Klasyczny program | Inteligentny agent |
|-------|------------------|-------------------|
| **Kontrola** | Człowiek | Autonomiczna |
| **Adaptacja** | Wymaga przeprogramowania | Uczy się i adaptuje |
| **Cel** | Wykonaj instrukcję | Osiągnij cel |
| **Środowisko** | Deterministyczne, znane | Dynamiczne, częściowo znane |
| **Zachowanie** | Przewidywalne | Emergentne |

## Powiązane artykuły

- [Agent programowy](#wiki-software-agent)
- [Reprezentacja wiedzy i wnioskowanie](#wiki-knowledge-representation)
- [Modele kognitywne](#wiki-cognitive-models)
- [Robotyka poznawcza](#wiki-cognitive-robotics)
- [Computational cognition](#wiki-computational-cognition)
- [ACT-R](#wiki-actr-architecture)
- [Soar — architektura kognitywna](#wiki-soar-architecture)
- [LIDA](#wiki-lida-architecture)
- [CLARION](#wiki-clarion-architecture)

## Linki zewnętrzne

- [Russell & Norvig: AIMA — rozdział o agentach](https://aima.cs.berkeley.edu/)
- [Wooldridge: An Introduction to MultiAgent Systems](https://www.cs.ox.ac.uk/people/michael.wooldridge/pubs/imas/IMAS2e.html)
- [OpenAI Gym — środowiska dla agentów uczących się](https://gymnasium.farama.org/)
- [JADE — Java Agent Development Framework](https://jade.tilab.com/)
- [AgentPy — Python library for agent-based modeling](https://agentpy.readthedocs.io/)
