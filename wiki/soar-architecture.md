# Soar - architektura kognitywna

## Streszczenie

Soar (*State, Operator And Result*) to jedna z najstarszych i najszerzej stosowanych architektur kognitywnych, opracowana przez Allena Newella, Johna Laird'a i Paula Rosenbloom'a na Uniwersytecie Michigan w latach osiemdziesiątych XX wieku. Architektura ta opisuje poznanie jako działanie w przestrzeni problemów: agent zawsze znajduje się w pewnym stanie, wybiera operator, który ten stan modyfikuje, i obserwuje wynik. Soar obejmuje pamięć roboczą, pamięć produkcyjną, pamięć semantyczną i epizodyczną, mechanizm impasów (*impasse*), uczenie przez *chunking* oraz uczenie przez wzmocnienie. W artykule omówiono historię, podstawy teoretyczne, organizację pamięci, mechanizmy uczenia się, zastosowania w robotyce i grach, a także porównanie z innymi architekturami.

**Słowa kluczowe:** Soar, architektura kognitywna, przestrzeń problemów, impasse, chunking, uczenie przez wzmocnienie, robotyka kognitywna, agenty inteligentne

## 1. Wprowadzenie

Soar wywodzi się bezpośrednio z projektu badawczego Allena Newella dotyczącego zunifikowanej teorii poznania (*Unified Theory of Cognition*). Newell (1990) argumentował, że poznanie jest realizowane przez jeden ogólny mechanizm, a nie przez zbiór niezależnych, wyspecjalizowanych modułów. Kluczowym pojęciem tej teorii jest przestrzeń problemów (*problem space*): środowisko możliwych stanów i operatorów, po którym agent nawiguje, dążąc do celu.

Soar jest zarówno teorią naukową, jak i systemem informatycznym. Jako teoria wyjaśnia zjawiska takie jak uczenie się, rozwiązywanie problemów i impasy poznawcze. Jako system informatyczny dostarcza środowisko uruchomieniowe, interpreter reguł i interfejsy do integracji z zewnętrznymi modułami. Aktywnie rozwijany przez cztery dekady, Soar doczekał się wersji 9.x i później Soar 9.6, a jego ekosystem obejmuje biblioteki dla C++, Java i Pythona.

## 2. Historia i kontekst

### 2.1. Newell, Laird, Rosenbloom - geneza projektu

Projekt Soar zaczął się około 1983 roku w Carnegie Mellon University, gdy John Laird i Paul Rosenbloom dołączyli do zespołu Allena Newella. Pierwsza publiczna wersja Soar pojawiła się w 1987 roku. Wczesne prace koncentrowały się na wykazaniu, że jeden ogólny mechanizm (reguły w przestrzeni problemów) może realizować różnorodne zadania poznawcze: gry logiczne, rozwiązywanie zagadek, planowanie i uczenie się.

Przełomową publikacją był artykuł Laird, Newell i Rosenbloom (1987) w *Artificial Intelligence*, opisujący Soar jako architekturę zdolną do *chunking* - kompilowania nabytego doświadczenia do nowych reguł produkcyjnych. Newell zawarł dojrzałą teorię w monografii *Unified Theories of Cognition* (1990), która stała się kanonicznym tekstem dziedziny.

Po śmierci Newella w 1992 roku Laird przeniósł się na Uniwersytet Michigan i przez kolejne dekady rozwijał architekturę, dodając pamięć semantyczną (ok. 2006), pamięć epizodyczną (2010), uczenie przez wzmocnienie (2010) oraz rozszerzenia dla robotyki (SVS - Spatial/Visual System).

### 2.2. Soar jako teoria kognitywnistyczna

Ważnym aspektem Soar jest ambicja teoretyczna: architektura miała wyjaśniać ludzkie poznanie, a nie tylko rozwiązywać problemy techniczne. Newell postulował, że czas *cognitive band* wynosi około 10–100 ms (jeden cykl reguł), *deliberate band* to 100 ms–10 s (sekwencje reguł), a *social band* powyżej 10 s (interakcja z otoczeniem). Te wskazania definiowały, jakie procesy powinny być realizowane przez Soar.

## 3. Podstawy architektury

### 3.1. Pamięć robocza (*Working Memory*)

Pamięć robocza (*Working Memory*, WM) w Soar jest centralną strukturą danych reprezentującą aktualny stan świata, aktualny cel, dostępne operatory i inne chwilowe informacje. Pamięć robocza składa się z obiektów (*objects*), z których każdy ma atrybuty (*attributes*) i wartości (*values*). Relacje między obiektami tworzą sieć semantyczną.

```
# Przykładowy stan w WM (notacja nieformalna)
state <s1>
  ^superstate nil
  ^name robot-task
  ^io <io>
  ^operator <o1> +  # propozycja operatora

operator <o1>
  ^name move-to-goal
  ^direction north
```

Zawartość WM jest modyfikowana przez reguły produkcyjne (usuwanie lub dodawanie elementów) oraz przez moduły długotrwałej pamięci i percepcji.

### 3.2. Pamięć produkcyjna (*Production Memory*)

Pamięć produkcyjna przechowuje reguły postaci IF-THEN. Warunek (IF) opisuje wymagany stan WM; akcja (THEN) wprowadza zmiany do WM lub wysyła polecenia do modułów. Reguły są dopasowywane do aktualnego stanu WM za pomocą algorytmu Rete, co umożliwia efektywne przetwarzanie dużych baz reguł.

```
# Przykład reguły Soar (składnia SP - Soar Productions)
sp {robot*propose*move-north
    (state <s>
           ^name robot-task
           ^io.input-link.goal-direction north)
-->
    (<s> ^operator <o> +)
    (<o> ^name move-forward
         ^direction north)
}

sp {robot*apply*move-forward
    (state <s>
           ^operator <o>)
    (<o> ^name move-forward
         ^direction <dir>)
-->
    (<s> ^current-action (concat move- <dir>))
}
```

### 3.3. Cykl decyzyjny (*Decision Cycle*)

Każdy cykl Soar przebiega w następujących fazach:
1. **Elaboration phase** - wszystkie pasujące reguły uruchamiają się i dodają preferencje do WM.
2. **Decision procedure** - na podstawie preferencji system wybiera jeden operator do wykonania.
3. **Apply phase** - reguły zastosowania wybranego operatora modyfikują WM.
4. **Output phase** - zmiany w WM są wysyłane do efektorów (silniki, API).

Cykl trwa typowo 50–200 ms i odpowiada granicy *cognitive band* Newella.

## 4. Impasse i subgoaling

### 4.1. Mechanizm impasów

Impas (*impasse*) pojawia się, gdy system nie może dokonać jednoznacznego wyboru operatora. Może to wynikać z:
- **tie impasse**: kilka operatorów ma równe preferencje,
- **conflict impasse**: operatory mają sprzeczne preferencje,
- **no-change impasse**: żaden operator nie jest proponowany,
- **constraint-failure**: żaden operator nie spełnia ograniczeń.

W odpowiedzi na impas Soar automatycznie tworzy podstan (*substate*) i nowy cel: rozwiązać impas. Przetwarzanie przechodzi do podsytuacji, gdzie system może użyć dodatkowych reguł, pobrać dane z pamięci długotrwałej lub przeprowadzić bardziej szczegółową analizę.

### 4.2. Subgoaling a planowanie

Mechanizm subgoalingu jest implicite mechanizmem planowania: agent może rozważać hipotetyczne sekwencje operatorów w podsytuacjach bez rzeczywistego ich wykonywania. Wyniki takich analiz mogą być przeniesione do stanu wyższego poziomu jako wiedza o preferencjach. Dzięki temu Soar realizuje planowanie bez oddzielnej architektury planisty.

## 5. Chunking - uczenie proceduralne

### 5.1. Zasada działania

Chunking jest mechanizmem, który kompiluje doświadczenie zdobyte podczas rozwiązywania impasu do nowej reguły produkcyjnej. Nowa reguła bezpośrednio mapuje warunki, które wywołały impas, na wynik jego rozwiązania. Przy kolejnym napotkaniu podobnych warunków system może zastosować chunkowaną regułę bez wchodzenia w impas, co znacząco przyspiesza działanie.

```
# Przed chunkingiem: robot wchodzi w impas (dwie równe trasy do celu)
# Po rozwiązaniu impasu przez deliberację:
# Soar automatycznie tworzy nową regułę:

sp {robot*chunk*prefer-shorter-route
    (state <s>
           ^name robot-task
           ^distance-route-a <da>
           ^distance-route-b <db>)
    (<da> < <db>)
-->
    (<s> ^operator <o> >)   # preferencja dla krótszej trasy
}
```

### 5.2. Prawo potęgowe uczenia się

Chunking generuje behawioralny efekt zgodny z *power law of practice*: czas wykonania zadania maleje jako funkcja potęgowa liczby prób. Rosenbloom i Newell (1986) wykazali, że ten empirycznie obserwowany efekt jest naturalną konsekwencją chunkingu w Soar. Stanowi to ważny argument za biologiczną wiarygodnością mechanizmu.

## 6. Pamięci długotrwałe

### 6.1. Pamięć semantyczna (*Semantic Memory*, SMem)

Pamięć semantyczna przechowuje ogólną wiedzę o świecie w postaci sieci struktur LTI (*Long-Term Identifier*). Agent może pobierać wiedzę z SMem zapytaniami pasującymi (*cue-based retrieval*) i zapisywać nowe fakty.

```python
# Pseudo-kod interfejsu do SMem w Pythonie (przez SML API)
import Python_sml_ClientInterface as sml

kernel = sml.Kernel.CreateKernelInCurrentThread()
agent = kernel.CreateAgent("my-agent")

# Dodanie faktu do pamięci semantycznej przez warunki w regule:
# sp {store-capital
#     (state <s> ^smem.command <cmd>)
# -->
#     (<cmd> ^store <lti>)
#     (<lti> ^country poland
#            ^capital warsaw)
# }
```

### 6.2. Pamięć epizodyczna (*Episodic Memory*, EpMem)

Pamięć epizodyczna automatycznie rejestruje migawki (*snapshots*) pamięci roboczej w wybranych momentach. Zapytanie do EpMem polega na podaniu fragmentu stanu (*cue*) i odnalezieniu najbardziej pasującego epizodu. Mechanizm ten pozwala agentowi przywoływać wcześniejsze doświadczenia i uczyć się na podstawie historii.

```
# Zapytanie epizodyczne - wyszukaj stan, gdy robot był przy ładowarce
sp {recall-charging-state
    (state <s>
           ^epmem.command <cmd>
           ^epmem.result <res>)
-->
    (<cmd> ^query <q>)
    (<q>   ^robot-location charging-station)
}
```

### 6.3. Pamięć proceduralna

Pamięć proceduralna to inaczej baza reguł produkcyjnych. Jest trwała między sesjami dzięki mechanizmowi serializacji. W połączeniu z chunkingiem pozwala na kumulację nauczonych zachowań.

## 7. Uczenie przez wzmocnienie w Soar

Soar implementuje algorytm Q-learningu do aktualizacji numerycznych wartości preferencji operatorów. Każda reguła proponująca operator może mieć przypisaną wartość liczbową (*numeric indifferent preference*), aktualizowaną na podstawie nagród.

```
Aktualizacja Q-value:
Q(s, a) ← Q(s, a) + α [r + γ · max_a' Q(s', a') - Q(s, a)]

Parametry:
  α - współczynnik uczenia (learning rate)
  γ - współczynnik dyskontowania (discount factor)
  r - nagroda otrzymana po wykonaniu akcji a w stanie s
```

W praktyce reguły Soar RL mają specjalną składnię:

```
sp {robot*rl*prefer-safe-route
    (state <s>
           ^operator <o> +
           ^route-safety <safety>)
    (<o> ^name move)
-->
    (<s> ^operator <o> = 0.5)  # wartość startowa Q
}
```

Nagroda jest definiowana przez specjalne reguły modyfikujące atrybut `^reward-link`.

## 8. SVS - Spatial/Visual System

### 8.1. Rola SVS w Soar

SVS (*Spatial/Visual System*) to rozszerzenie Soar umożliwiające reprezentację i wnioskowanie o przestrzennych relacjach obiektów w środowisku 3D. SVS utrzymuje wewnętrzną scenę przestrzenną (*scene graph*), którą reguły Soar mogą odpytywać za pomocą *spatial queries*.

### 8.2. Zastosowania w robotyce

W robotyce mobilnej SVS pozwala agentowi Soar:
- sprawdzać, czy dany obiekt jest przed robotem, za nim, w lewej lub prawej części pola widzenia,
- oceniać odległości między obiektami,
- wnioskować o możliwości przejazdu przez korytarz.

```
# Zapytanie przestrzenne w SVS
sp {robot*check-obstacle-ahead
    (state <s>
           ^svs.command <cmd>)
-->
    (<cmd> ^query <q>)
    (<q>   ^type distance
           ^a robot
           ^b obstacle
           ^result <r>)
}
# Wynik: <r> ^distance <d>  - odległość w metrach
```

## 9. Zastosowania

### 9.1. Gry i symulacje: StarCraft AI

Jednym z najgłośniejszych zastosowań Soar jest budowa agentów grających w StarCraft. Projekt Soar-based StarCraft AI demonstruje zdolność architektury do zarządzania złożonym środowiskiem w czasie rzeczywistym: alokacja zasobów, zarządzanie jednostkami, taktyka walki i reagowanie na posunięcia przeciwnika.

### 9.2. Robotyka

Soar był integrowany z wieloma platformami robotycznymi:
- **SoarTech** rozwijał agentów do sterowania robotami wojskowymi (UGV),
- **Rosie** to framework integrujący Soar z ROS (*Robot Operating System*) dla robotów domowych,
- **AAAI 2020** prezentowały prace nad robotem Fetch używającym Soar do poleceń wydawanych w języku naturalnym.

```python
# Szkielet integracji Soar z ROS (Python SML)
import rospy
from std_msgs.msg import String
import Python_sml_ClientInterface as sml

class SoarROSAgent:
    def __init__(self):
        rospy.init_node('soar_agent')
        self.kernel = sml.Kernel.CreateKernelInCurrentThread()
        self.agent = self.kernel.CreateAgent('robot')
        self.agent.LoadProductions('robot_task.soar')
        self.cmd_pub = rospy.Publisher('/cmd', String, queue_size=10)

    def perception_callback(self, sensor_data):
        """Aktualizacja input-link na podstawie danych sensorycznych."""
        il = self.agent.GetInputLink()
        # Zaktualizuj atrybuty wejściowe
        il.CreateStringWME(il, 'obstacle-detected',
                           'yes' if sensor_data.obstacle else 'no')

    def run_cycle(self):
        self.agent.RunSelf(1)  # jeden cykl decyzyjny
        ol = self.agent.GetOutputLink()
        # Odczytaj polecenia z output-link i wyślij do ROS
        cmd_wme = ol.FindByAttribute('move', 0)
        if cmd_wme:
            self.cmd_pub.publish(cmd_wme.GetValueAsString())
```

### 9.3. Inteligentne systemy tutorujące

Soar był używany jako silnik kognitywniy w systemach tutorujących (*Intelligent Tutoring Systems*), gdzie model ucznia jest reprezentowany jako zbiór reguł i pamięć epizodyczna. System tutorujący może śledzić, które reguły uczeń opanował, i dostosowywać trudność ćwiczeń.

## 10. Soar w kontekście aplikacji mobilnych

Choć Soar nie jest natywną platformą mobilną, integracja przez interfejs Javy lub biblioteki sieciowe umożliwia osadzenie agenta Soar w aplikacjach Android/iOS jako warstwę planowania i podejmowania decyzji. Przykładowe zastosowania:
- aplikacje asystujące z planowaniem zadań dziennych,
- systemy adaptacyjnego nauczania mobilnego,
- aplikacje do zarządzania inteligentnym domem (połączenie z MQTT i sensorami IoT).

```python
# Uproszczony przykład agenta Soar jako serwisu REST
from flask import Flask, request, jsonify

app = Flask(__name__)
# agent = SoarROSAgent() lub inna instancja agenta Soar

@app.route('/decide', methods=['POST'])
def decide():
    state = request.json.get('state', {})
    # Zaktualizuj WM agenta na podstawie state
    # Uruchom kilka cykli
    # Odczytaj wynik
    action = "move_forward"  # placeholder z wyjścia agenta
    return jsonify({"action": action})
```

## 11. Porównanie z innymi architekturami

### 11.1. Soar a ACT-R

ACT-R jest silniej zakorzeniony w danych empirycznych z psychologii eksperymentalnej i dostarcza ilościowe przewidywania dotyczące czasu reakcji i efektów pamięciowych. Soar kładzie nacisk na ogólność i elastyczność jako systemu planowania i rozwiązywania problemów. Soar ma bardziej rozbudowany mechanizm impasów i subgoalingu; ACT-R ma bogatsze mechanizmy subsymboliczne (BLL, utility learning).

### 11.2. Soar a CLARION

CLARION oddziela explicite poziom symboliczny od subsymbolicznego (sieci neuronowe), podczas gdy Soar realizuje subsymbolikę przez RL i chunking. CLARION mocniej akcentuje teorię dwuprocesową (*dual-process theory*) w sensie psychologicznym; Soar jest bardziej zorientowany inżyniersko.

### 11.3. Soar a LIDA

LIDA opiera się na Teorii Globalnej Przestrzeni Roboczej i modeluje świadomość dostępu jako mechanizm broadcast informacji. Soar nie modeluje świadomości explicite. LIDA ma bardziej szczegółowy model cyklu percepcja-uwaga-działanie; Soar ma bardziej dojrzały mechanizm planowania i uczenia przez kompilację reguł.

| Cecha | Soar | ACT-R | CLARION | LIDA |
|---|---|---|---|---|
| Uczenie się | Chunking + RL | BLL + utility | RERE + Q-learning | Hebbian + RL |
| Planowanie | Subgoaling | Ograniczone | Ograniczone | Ograniczone |
| Pamięć epizodyczna | Tak (EpMem) | Ograniczona | Tak | Tak (TEMS) |
| Pamięć semantyczna | Tak (SMem) | Tak (DM) | NACS | Tak |
| Przestrzeń problemów | Centralna | Nie | Nie | Nie |
| Robotyka | SVS + ROS | Przez adaptery | Nie | Ograniczone |

## 12. Ograniczenia i perspektywy

Soar ma kilka istotnych ograniczeń. Symboliczna reprezentacja WM utrudnia bezpośrednią integrację z percepcją głębokich sieci neuronowych. Skalowanie systemu do bardzo dużych baz wiedzy (miliony obiektów WM) jest trudne. Debugowanie złożonych systemów reguł wymaga specjalistycznych narzędzi. Wreszcie, brak explicite modelu świadomości i uwagi może być ograniczeniem w modelowaniu niektórych zjawisk psychologicznych.

Perspektywy rozwoju obejmują głębszą integrację z uczeniem maszynowym (neuronowe aproksymatory wartości Q), rozbudowę SVS o głębokie sieci konwolucyjne do percepcji wzrokowej oraz interfejsy do LLM (*Large Language Models*) jako source wiedzy do SMem.

## 13. Podsumowanie

Soar jest dojrzałą, kompleksową architekturą kognitywną z bogatym ekosystemem narzędzi i zastosowań. Jej podejście oparte na przestrzeni problemów, mechanizm impasów i subgoalingu, wielowarstwowa pamięć oraz uczenie przez chunking tworzą spójny i ogólny system. Cztery dekady aktywnego rozwoju i zastosowań w robotyce, grach, symulacjach i systemach tutorujących świadczą o praktycznej wartości architektury. Dla studentów programowania aplikacji mobilnych Soar jest ważnym punktem odniesienia w rozumieniu zasad działania inteligentnych agentów i systemów planowania.

## Literatura

1. Newell, A. (1990). *Unified Theories of Cognition*. Harvard University Press.
2. Laird, J. E., Newell, A., & Rosenbloom, P. S. (1987). Soar: An architecture for general intelligence. *Artificial Intelligence*, 33(1), 1–64.
3. Laird, J. E. (2012). *The Soar Cognitive Architecture*. MIT Press.
4. Rosenbloom, P. S., & Newell, A. (1986). The chunking of goal hierarchies. *Machine Learning*, 1(3).
5. Nason, S., & Laird, J. E. (2005). Soar-RL: integrating reinforcement learning with Soar. *Cognitive Systems Research*, 6(1), 51–59.
6. Mohan, S., & Laird, J. E. (2014). Learning goal-oriented hierarchical tasks from situated interactive instruction. *AAAI*.
7. Anderson, J. R., & Lebiere, C. (1998). *The Atomic Components of Thought*. Erlbaum.
8. Sun, R. (2006). CLARION: Extending cognitive modeling to social simulation. *Cambridge University Press*.
9. Franklin, S., & Graesser, A. (1997). Is it an agent, or just a program? *LNAI 1193*, Springer.
10. Kirk, J. R., & Laird, J. E. (2019). Learning hierarchical symbolic representations to support interactive task learning and knowledge transfer. *IJCAI*.

## Powiązane artykuły

- [Modele kognitywne](cognitive-models.md)
- [Obliczeniowe modelowanie poznania](computational-cognition.md)
- [ACT-R](actr-architecture.md)
- [CLARION](clarion-architecture.md)
- [LIDA](lida-architecture.md)
- [Inteligentny agent](intelligent-agent.md)
- [Reprezentacja wiedzy](knowledge-representation.md)
- [Robotyka kognitywna](cognitive-robotics.md)
