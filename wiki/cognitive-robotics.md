# Robotyka poznawcza

Robotyka poznawcza (ang. *Cognitive Robotics*) to interdyscyplinarna dziedzina nauki łącząca robotykę, sztuczną inteligencję i kognitywistykę. Jej celem jest tworzenie robotów, które mogą autonomicznie postrzegać środowisko, rozumować, uczyć się i działać w sposób zbliżony do ludzkiego poznania.

## Czym jest robotyka poznawcza?

Tradycyjna robotyka skupia się na precyzyjnym wykonywaniu z góry zaprogramowanych zadań w kontrolowanych warunkach. Robotyka poznawcza idzie dalej — wyposażając roboty w zdolność do:

- **percepcji wielomodalnej** — integracja danych z kamer, mikrofonów, czujników dotyku i propriocepcji
- **wnioskowania** — budowanie i aktualizowanie wewnętrznych modeli świata
- **uczenia się** — adaptacja do nowych sytuacji bez jawnego przeprogramowania
- **planowania** — wybór sekwencji działań prowadzących do celu
- **interakcji społecznej** — rozumienie intencji, emocji i komunikacji innych agentów

## Architektura systemów kognitywnych

### Model trójwarstwowy

Większość współczesnych architektur robotyki poznawczej dzieli system na trzy poziomy:

```
┌─────────────────────────────────────────┐
│  POZIOM DELIBERATYWNY (planowanie)       │
│  Model świata, planowanie symboliczne    │
├─────────────────────────────────────────┤
│  POZIOM SEKWENCYJNY (zachowania)         │
│  Koordynacja zachowań, pamięć robocza    │
├─────────────────────────────────────────┤
│  POZIOM REAKTYWNY (odruchowy)            │
│  Bezpośrednia odpowiedź sensor–aktuator  │
└─────────────────────────────────────────┘
```

### Architektura subsumcji (Brooks, 1986)

Rodney Brooks zaproponował reaktywną architekturę, w której wyższe warstwy *subsumują* (nadpisują) zachowania niższych:

```
Warstwa 4: Eksploracja
    ↓ subsumuje
Warstwa 3: Błądzenie
    ↓ subsumuje
Warstwa 2: Unikanie przeszkód
    ↓ subsumuje
Warstwa 1: Poruszanie się
    ↓ subsumuje
Warstwa 0: Utrzymanie równowagi
```

Kluczowe cechy:
- Brak centralnej reprezentacji świata
- Zachowania emergentne z interakcji warstw
- Szybka reaktywność, ale ograniczone planowanie

### Architektura SOAR

SOAR (State, Operator And Result) to kognitywna architektura opracowana na Uniwersytecie Michigan, oparta na teorii zunifikowanego poznania:

- **Pamięć długotrwała** — proceduralna, semantyczna i epizodyczna
- **Pamięć robocza** — aktualny stan zadania
- **Cykl decyzyjny** — elaboracja → selekcja → zastosowanie operatora
- **Uczenie się przez fragmentaryzację** — automatyczne tworzenie reguł skrótowych (chunking)

Szczegółowy opis architektury: [Soar — architektura kognitywna](#wiki-soar-architecture)

## Percepcja w robotyce poznawczej

### Reprezentacja przestrzenna

Robot musi budować i aktualizować mapę środowiska. Najpopularniejszą techniką jest **SLAM** (Simultaneous Localization and Mapping):

```
Odczyty sensorów → Ekstrakcja cech → Aktualizacja mapy
        ↑                                    ↓
        └──── Lokalizacja (pozycja robota) ←─┘
```

### Rozpoznawanie obiektów

Nowoczesne roboty kognitywne używają głębokich sieci neuronowych do rozpoznawania obiektów i scen:

```python
# Przykład: detekcja obiektów z YOLO na robocie ROS2
import rclpy
from rclpy.node import Node
from sensor_msgs.msg import Image
import torch

class CognitiveVisionNode(Node):
    def __init__(self):
        super().__init__('cognitive_vision')
        self.model = torch.hub.load('ultralytics/yolov5', 'yolov5s')
        self.subscription = self.create_subscription(
            Image, '/camera/image_raw', self.vision_callback, 10
        )
        self.object_memory = {}  # pamięć semantyczna obiektów

    def vision_callback(self, msg):
        # Konwersja wiadomości ROS na obraz
        frame = self.ros_image_to_numpy(msg)
        results = self.model(frame)

        for obj in results.pandas().xyxy[0].itertuples():
            label = obj.name
            confidence = obj.confidence
            # Aktualizuj pamięć semantyczną
            if label not in self.object_memory:
                self.object_memory[label] = []
            self.object_memory[label].append({
                'timestamp': self.get_clock().now().nanoseconds,
                'confidence': confidence,
                'position': self.estimate_3d_position(obj)
            })
            self.get_logger().info(f'Wykryto: {label} ({confidence:.2f})')
```

### Integracja wielomodalna

Robot łączy dane ze wszystkich zmysłów w spójną reprezentację:

| Modalność | Dane wejściowe | Ekstrakcja cech |
|-----------|---------------|-----------------|
| Wzrok | Kamera RGB-D | CNN, YOLO, segmentacja semantyczna |
| Słuch | Mikrofon | MFCC, rozpoznawanie mowy (Whisper) |
| Dotyk | Czujniki siły/momentu | Wzorce nacisku, twardość |
| Propriocepcja | Enkodery silników | Pozycja, prędkość, moment obrotowy |
| Odległość | LiDAR, ultradźwięki | Chmura punktów, mapa odległości |

## Uczenie się i adaptacja

### Uczenie przez wzmacnianie (RL)

Robot uczy się strategii działania metodą prób i błędów:

```python
import gymnasium as gym
import numpy as np

class RobotArmEnv(gym.Env):
    """Środowisko uczenia ramienia robota do chwytania obiektów."""

    def __init__(self):
        self.observation_space = gym.spaces.Box(
            low=-np.inf, high=np.inf, shape=(14,), dtype=np.float32
        )  # 7 stawów × (pozycja, prędkość)

        self.action_space = gym.spaces.Box(
            low=-1.0, high=1.0, shape=(7,), dtype=np.float32
        )  # Sterowanie 7 stawami

    def step(self, action):
        # Zastosuj akcję do robota
        self.apply_joint_torques(action)
        obs = self.get_observation()
        reward = self.compute_reward()
        done = self.check_termination()
        return obs, reward, done, False, {}

    def compute_reward(self):
        # Nagroda: zmniejszenie odległości do obiektu + kara za duże momenty
        distance = self.get_distance_to_target()
        energy = np.sum(np.abs(self.get_joint_torques()))
        return -distance - 0.001 * energy
```

### Transfer learning i uczenie się przez obserwację

Robot może uczyć się nowych zadań obserwując demonstracje człowieka:

```
Demonstracja człowieka → Ekstrakcja trajektorii →
Generalizacja polityki → Testowanie i adaptacja
```

### Pamięć epizodyczna

Robot zapamiętuje konkretne zdarzenia i wyciąga z nich wnioski:

```python
import time
import numpy as np

class EpisodicMemory:
    """Prosta implementacja pamięci epizodycznej."""

    def __init__(self, capacity=1000):
        self.episodes = []
        self.capacity = capacity

    def store(self, state, action, outcome, context):
        episode = {
            'state': state,
            'action': action,
            'outcome': outcome,
            'context': context,
            'timestamp': time.time()
        }
        self.episodes.append(episode)
        if len(self.episodes) > self.capacity:
            self.episodes.pop(0)  # usuń najstarsze

    def recall_similar(self, current_state, top_k=5):
        """Znajdź podobne epizody z przeszłości."""
        similarities = [
            self.compute_similarity(current_state, ep['state'])
            for ep in self.episodes
        ]
        top_indices = np.argsort(similarities)[-top_k:]
        return [self.episodes[i] for i in top_indices]
```

## Interakcja człowiek–robot (HRI)

### Rozumienie intencji

Robot kognitywny musi interpretować nie tylko słowa, ale też gesty, spojrzenia i kontekst:

```
Wejście multimodalne → Fuzja → Interpretacja intencji → Odpowiedź
(mowa + gesty + wzrok)
```

### Wspólna uwaga (Joint Attention)

Kluczowy mechanizm poznawczy: robot i człowiek kierują uwagę na ten sam obiekt:

```python
class JointAttentionModule:
    def detect_gaze_direction(self, face_landmarks):
        """Wyznacz kierunek spojrzenia człowieka."""
        left_eye = face_landmarks['left_eye']
        right_eye = face_landmarks['right_eye']
        iris_left = face_landmarks['left_iris']
        iris_right = face_landmarks['right_iris']
        # Oblicz wektor spojrzenia
        gaze_vector = self.compute_gaze_vector(
            left_eye, right_eye, iris_left, iris_right
        )
        return gaze_vector

    def follow_gaze(self, gaze_vector):
        """Skieruj uwagę robota w kierunku spojrzenia człowieka."""
        target_object = self.scene_graph.raycast(gaze_vector)
        if target_object:
            self.focus_attention(target_object)
            self.verbalize(f"Patrzę na {target_object.label}")
```

## Kognitywne architektury dla robotyki

Poza SOAR, robotyka poznawcza korzysta z wielu innych architektur:

| Architektura | Twórcy | Kluczowe cechy |
|---|---|---|
| **ACT-R** | Anderson (CMU) | Moduły percepcji, pamięci proceduralnej i deklaratywnej | 
| **CLARION** | Sun (RPI) | Podwójny proces: jawny + niejawny |
| **LIDA** | Franklin (Memphis) | Cykl kognitywny, świadomość |
| **ICUB** | IIT Genua | Humanoidalny robot z wbudowaną architekturą kognitywną |

Więcej: [ACT-R](#wiki-actr-architecture) · [CLARION](#wiki-clarion-architecture) · [LIDA](#wiki-lida-architecture)

## Wyzwania badawcze

### Problem gruntowania symboli (Symbol Grounding)

Jak powiązać abstrakcyjne symbole (np. "krzesło") z rzeczywistymi doznaniami sensorycznymi? To jedno z fundamentalnych pytań robotyki poznawczej.

### Rozumowanie przyczynowe

Robot powinien rozumieć nie tylko *co* się wydarzyło, ale *dlaczego* — i przewidywać konsekwencje swoich działań.

### Kompromis eksploracja–eksploatacja

Kiedy robot powinien wypróbować nowe strategie, a kiedy stosować sprawdzone? To klasyczny dylemat uczenia przez wzmacnianie.

### Skalowanie do złożonych zadań

Większość osiągnięć dotyczy izolowanych zadań. Tworzenie robotów radzących sobie z ogólnymi, codziennymi sytuacjami to nadal otwarty problem.

## Zastosowania

- **Roboty asystujące** — opieka nad osobami starszymi i niepełnosprawnymi (np. PARO, Pepper)
- **Roboty edukacyjne** — interaktywne systemy tutoringu (np. NAO w klasie)
- **Roboty przemysłowe nowej generacji** — współpraca człowiek–robot (coboty)
- **Eksploracja kosmiczna** — autonomiczne łaziki (Mars Curiosity, Perseverance)
- **Roboty chirurgiczne** — wspomaganie precyzji operacji (da Vinci)
- **Pojazdy autonomiczne** — percepcja i planowanie trasy

## Powiązane artykuły

- [Computational cognition](#wiki-computational-cognition)
- [Inteligentni agenci](#wiki-intelligent-agent)
- [Agenci programowi](#wiki-software-agent)
- [Reprezentacja wiedzy i wnioskowanie](#wiki-knowledge-representation)
- [Modele kognitywne](#wiki-cognitive-models)
- [ACT-R](#wiki-actr-architecture)
- [Soar — architektura kognitywna](#wiki-soar-architecture)
- [LIDA](#wiki-lida-architecture)
- [CLARION](#wiki-clarion-architecture)
- [Computer-aided diagnosis](#wiki-computer-aided-diagnosis)

## BDI — Beliefs, Desires, Intentions

Model BDI (*Beliefs, Desires, Intentions*) to jedna z najpopularniejszych formalnych teorii agentów racjonalnych, wywodząca się z filozofii praktycznego rozumowania. W robotyce poznawczej stanowi most między niskopoziomową percepcją a planowaniem wysokiego poziomu.

- **Beliefs** (przekonania) — aktualny model świata agenta: co robot wie lub sądzi o środowisku, innych agentach, własnym stanie
- **Desires** (pragnienia) — stany końcowe lub sytuacje, które agent chciałby osiągnąć (cele długoterminowe)
- **Intentions** (intencje) — plany, które agent postanowił realizować; stanowią filtr ograniczający możliwe działania

Kluczowa różnica między desires a intentions: agent może mieć sprzeczne pragnienia (pojechać w dwie strony naraz), ale intencje są spójnym zobowiązaniem do konkretnej ścieżki działania.

### Pętla BDI — pseudokod w Pythonie

```python
class BDIAgent:
    """Uproszczona implementacja agenta BDI dla robota."""

    def __init__(self):
        self.beliefs: dict  = {}  # model świata
        self.desires: list  = []  # cele końcowe
        self.intentions: list = []  # aktualnie realizowane plany

    # --- Percepcja i aktualizacja przekonań ---
    def perceive(self) -> dict:
        """Pobierz dane z sensorów i zwróć obserwację."""
        return {
            "obstacle_ahead": self.lidar.detect_obstacle(),
            "target_visible": self.camera.detect_target(),
            "battery_level": self.battery.get_level(),
        }

    def update_beliefs(self, observation: dict):
        """Uaktualnij model świata na podstawie nowych obserwacji."""
        self.beliefs.update(observation)
        # Inferencja — np. jeśli bateria < 20%, dodaj przekonanie "low_battery"
        if self.beliefs.get("battery_level", 100) < 20:
            self.beliefs["low_battery"] = True

    # --- Generowanie pragnień ---
    def generate_desires(self) -> list:
        """Wygeneruj cele na podstawie aktualnych przekonań."""
        desires = []
        if self.beliefs.get("target_visible"):
            desires.append({"goal": "reach_target", "priority": 10})
        if self.beliefs.get("low_battery"):
            desires.append({"goal": "recharge", "priority": 15})  # wyższy priorytet
        if self.beliefs.get("obstacle_ahead"):
            desires.append({"goal": "avoid_obstacle", "priority": 20})
        return sorted(desires, key=lambda d: -d["priority"])

    # --- Selekcja intencji ---
    def select_intention(self, desires: list) -> dict | None:
        """Wybierz najbardziej pilny cel jako aktualną intencję."""
        if not desires:
            return None
        # Prosta polityka: wybierz pragnienie o najwyższym priorytecie
        return desires[0]

    # --- Wykonanie ---
    def execute(self, intention: dict):
        """Wykonaj akcję realizującą wybraną intencję."""
        goal = intention.get("goal")
        if goal == "reach_target":
            self.navigate_to_target()
        elif goal == "avoid_obstacle":
            self.swerve_around_obstacle()
        elif goal == "recharge":
            self.navigate_to_charging_station()

    # --- Główna pętla kognitywna ---
    def run(self):
        while True:
            observation     = self.perceive()
            self.update_beliefs(observation)
            desires         = self.generate_desires()
            intention       = self.select_intention(desires)
            if intention:
                self.intentions = [intention]
                self.execute(intention)
```

Praktyczne implementacje BDI dla robotyki to m.in. **JADE** (Java Agent DEvelopment), **Jason** (język AgentSpeak) oraz rozszerzenia ROS2 oparte na Behavior Trees z semantyką BDI.

---

## Planowanie sekwencji działań — STRIPS i PDDL

Klasyczne planowanie symboliczne polega na znalezieniu sekwencji operatorów transformujących stan początkowy do stanu docelowego. Jest to komplement dla reaktywnych architektur — tam gdzie BDI reaguje na bodźce, planer symboliczny oblicza długie sekwencje działań.

### STRIPS — podstawy

STRIPS (*Stanford Research Institute Problem Solver*, 1971) definiuje problem planowania przez:

- **Stan** — zbiór faktów (predykatów) prawdziwych w danej chwili
- **Operator** — akcja z warunkami wstępnymi (*preconditions*) i efektami (*add/delete lists*)
- **Cel** — podzbiór faktów, które mają być prawdziwe po zakończeniu planu

```
Operator: pick_up(robot, object, location)
  Preconditions:  at(robot, location) ∧ at(object, location) ∧ ¬holding(robot, anything)
  Add effects:    holding(robot, object)
  Delete effects: at(object, location)
```

### PDDL — język opisu domen planowania

PDDL (*Planning Domain Definition Language*) to standaryzowany format opisu domen i problemów planowania, obsługiwany przez planery jak **Fast Downward**, **FF** czy **LAMA**.

```lisp
;; Domena: robot zbierający obiekty
(define (domain warehouse-robot)
  (:requirements :strips :typing)
  (:types robot object location)

  (:predicates
    (at ?r - robot ?l - location)
    (obj-at ?o - object ?l - location)
    (holding ?r - robot ?o - object)
    (connected ?l1 - location ?l2 - location))

  ;; Operator 1: Przemieszczenie robota
  (:action move
    :parameters (?r - robot ?from ?to - location)
    :precondition (and (at ?r ?from) (connected ?from ?to))
    :effect (and (at ?r ?to) (not (at ?r ?from))))

  ;; Operator 2: Podniesienie obiektu
  (:action pick-up
    :parameters (?r - robot ?o - object ?l - location)
    :precondition (and (at ?r ?l) (obj-at ?o ?l))
    :effect (and (holding ?r ?o) (not (obj-at ?o ?l))))

  ;; Operator 3: Odłożenie obiektu
  (:action put-down
    :parameters (?r - robot ?o - object ?l - location)
    :precondition (and (at ?r ?l) (holding ?r ?o))
    :effect (and (obj-at ?o ?l) (not (holding ?r ?o)))))
```

### Integracja z ROS2 — wywołanie planera z Pythona

```python
import subprocess
import tempfile
import os

def plan_task(domain_file: str, problem_file: str) -> list[str]:
    """Wywołaj Fast Downward i zwróć listę akcji planu."""
    result = subprocess.run(
        ["fast-downward", domain_file, problem_file,
         "--search", "astar(blind())"],
        capture_output=True, text=True, timeout=30
    )
    # Parsuj plik sas_plan generowany przez Fast Downward
    plan = []
    if os.path.exists("sas_plan"):
        with open("sas_plan") as f:
            for line in f:
                if not line.startswith(";"):
                    plan.append(line.strip().strip("()"))
    return plan

# Wynik: ['move robot1 loc_a loc_b', 'pick-up robot1 box1 loc_b', ...]
```

Planowanie symboliczne jest użyteczne dla zadań logistycznych (sortowanie, kompletacja zamówień), inspekcji przemysłowej i robotyki domowej, gdzie możliwe stany świata dają się opisać predykatami. Jego ograniczeniem jest wrażliwość na niepełną wiedzę o świecie — dlatego łączy się je z percepcją probabilistyczną i architekturami reaktywnymi.

## Linki zewnętrzne

- [IEEE Robotics and Automation Society](https://www.ieee-ras.org/)
- [ROS 2 Documentation](https://docs.ros.org/en/rolling/)
- [OpenCog — platforma AGI](https://opencog.org/)
- [iCub Robot (IIT)](https://icub.iit.it/)
- [DARPA Robotics Challenge](https://www.darpa.mil/program/darpa-robotics-challenge)
