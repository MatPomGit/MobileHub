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

## Linki zewnętrzne

- [IEEE Robotics and Automation Society](https://www.ieee-ras.org/)
- [ROS 2 Documentation](https://docs.ros.org/en/rolling/)
- [OpenCog — platforma AGI](https://opencog.org/)
- [iCub Robot (IIT)](https://icub.iit.it/)
- [DARPA Robotics Challenge](https://www.darpa.mil/program/darpa-robotics-challenge)
