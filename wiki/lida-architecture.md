# LIDA — Learning Intelligent Distribution Agent

## Streszczenie

LIDA (*Learning Intelligent Distribution Agent*) jest kognitywną architekturą opracowaną przez Stanleya Franklina i jego współpracowników na Uniwersytecie Memphis. Architektura ta jest zainspirowana Teorią Globalnej Przestrzeni Roboczej (*Global Workspace Theory*, GWT) Bernarda Baarsa i opisuje poznanie jako ciągły, trójfazowy cykl kognitywny: percepcja, rozumienie i działanie. Centralną rolę odgrywa w niej mechanizm globalnego rozgłaszania (*global broadcast*), który modeluje funkcjonalne analogon świadomości dostępu. Artykuł omawia podstawy teoretyczne, architekturę systemu, mechanizmy uczenia się, zastosowania w robotyce i grach komputerowych oraz porównanie z innymi architekturami.

**Słowa kluczowe:** LIDA, architektura kognitywna, Global Workspace Theory, cykl kognitywny, świadomość dostępu, uczenie się, robotyka kognitywna, agenty inteligentne

## 1. Wprowadzenie

Większość architektur kognitywnych skupia się na efektywnym rozwiązywaniu problemów i organizacji pamięci, traktując świadomość jako epifenomen lub pomijając ją zupełnie. LIDA stanowi wyjątek: architektura ta w pełni osadza model świadomości dostępu jako mechanizm centralny, dzięki któremu informacje z wyspecjalizowanych modułów percepcji stają się dostępne dla szerokich zasobów poznawczych agenta.

Projekt LIDA zainicjował Stan Franklin, wcześniej znany z prac nad semantyką języków programowania i teorią agentów. Inspiracji dostarczyła praca Baarsa (1988) *A Cognitive Theory of Consciousness*, w której zaproponował on metaforę teatru: świadomość jest jak reflektor sceniczny, który chwilowo oświetla wybrany aspekt sytuacji i udostępnia go aktorom w ciemności (nieświadomym procesom roboczym). Franklin (z Graesserem, 1997) zastosował tę metaforę do budowy architektury agentowej.

LIDA jest aktywnie rozwijana przez Laboratorium Cognitive Computing Research Group (CCRG) na University of Memphis. Dostępna jest implementacja Java — LIDA Framework — z rozbudowanym zestawem modułów i interfejsów.

## 2. Global Workspace Theory — podstawy teoretyczne

### 2.1. Teoria Baarsa

Bernard Baars zaproponował, że ludzki mózg jest zorganizowany jako zbiór wyspecjalizowanych, równoległych procesów (*processors*), które na co dzień działają niezależnie. Świadomość dostępu (*access consciousness*) pojawia się wtedy, gdy wynik jednego z procesów zostaje wybrany i rozesłany (*broadcast*) do wszystkich pozostałych procesorów jednocześnie. Ten globalny broadcast umożliwia integrację informacji i koordynację zachowania.

Metafora globalnej przestrzeni roboczej (*global workspace*) odwołuje się do idei środka wymiany: informacja, która trafi do globalnej przestrzeni, staje się dostępna dla wszystkich modułów systemu — pamięci, planowania, mowy, emocji itd.

### 2.2. Neuronaukowe podstawy GWT

Teoria Baarsa znalazła wsparcie neuronaukowe w pracach Dehaene'a i Changeux (*Global Neuronal Workspace Theory*, GNWT). Badania fMRI i EEG pokazują, że bodziec docierający do świadomości wyzwala szerokie, synchroniczne aktywacje we frontoparietal network — sieciach czołowo-ciemieniowych. Ten empiryczny wzorzec odpowiada pojęciu globalnego broadcastu.

Franklin zaimplementował GWT w postaci architektury agentowej, w której globalny broadcast jest mechanizmem dystrybucji informacji między modułami systemu.

## 3. Cykl kognitywny LIDA

### 3.1. Trójfazowa struktura cyklu

Cykl kognitywny LIDA składa się z trzech następujących po sobie faz, powtarzających się ciągle w trakcie działania agenta:

**Faza 1 — Percepcja i rozumienie (Perception and Understanding)**
Agent odbiera sygnały sensoryczne i przetwarza je przez hierarchię percepcyjną (*Perceptual Memory* i *Workspace*). Efektem jest budowanie bieżącej sytuacji w *Conscious Contents*.

**Faza 2 — Globalny broadcast i uwaga (Attention and Broadcast)**
Mechanizm uwagi (*attention codelet*) identyfikuje najważniejsze treści i umieszcza je w *Global Workspace*. Stąd broadcast rozsyła informacje do wszystkich modułów pamięci i procesorów działania.

**Faza 3 — Selekcja i wykonanie działania (Action Selection and Execution)**
Na podstawie otrzymanego broadcastu proceduralna pamięć zachowań proponuje schematy działania (*behavior schemes*). Mechanizm selekcji wybiera jeden schemat i inicjuje wykonanie.

Typowy czas jednego cyklu wynosi 80–400 ms, co odpowiada granicy psychologicznej *cognitive moment*.

### 3.2. Diagram przepływu

```
Środowisko
    ↓ sygnały sensoryczne
[Sensory Memory] — bardzo krótka pamięć (<0.5 s)
    ↓
[Perceptual Memory / PAM] — rozpoznanie obiektów i relacji
    ↓
[Workspace (Conscious Contents)] — bieżąca sytuacja
    ↑         ↓
[Transient    [Attention Codelets] — selekcja istotnych treści
 Episodic          ↓
 Memory]   [Global Workspace] — wybrany fragment świadomości
                   ↓ Global Broadcast
    ┌──────────────┼───────────────────────┐
    ↓              ↓                       ↓
[Declarative  [Procedural Memory]  [Episodic Memory]
 Memory]           ↓ behavior schemes
               [Action Selection]
                   ↓
               [Motor Plan]
                   ↓
               Środowisko (wykonanie akcji)
```

## 4. Moduły pamięci

### 4.1. Pamięć sensoryczna (*Sensory Memory*)

Pamięć sensoryczna przechowuje surowe reprezentacje sensoryczne przez bardzo krótki czas (poniżej 0,5 s). Jest odpowiednikiem pamięci ikonicznej i echoicznej Sperlingowego modelu. Dane w tej pamięci nie są semantycznie przetworzone — to surowy *input* ze środowiska.

### 4.2. Pamięć percepcyjna/asocjacyjna (PAM — Perceptual Associative Memory)

PAM przechowuje wyuczone schematy percepcyjne — wzorce pozwalające rozpoznawać obiekty, zdarzenia i relacje w sygnałach sensorycznych. W implementacji Java LIDA Framework PAM jest zrealizowany jako sieć węzłów z wagami asocjacyjnymi. Rozpoznanie wzorca polega na aktywacji odpowiednich węzłów.

```java
// Przykładowy kod LIDA Framework (Java) — uproszczony
PamNodeImpl node = new PamNodeImpl();
node.setLabel("obstacle");
node.setActivation(0.0);

// Aktualizacja aktywacji na podstawie nowych danych sensorycznych
node.setActivation(node.getActivation() + 0.8 * sensorSignal);

// Propagacja aktywacji do warstwy wyżej (Workspace)
if (node.getActivation() > threshold) {
    workspace.addContent(new NodeStructureImpl(node));
}
```

### 4.3. Workspace i Conscious Contents

Workspace jest przestrzenią roboczą, w której budowana jest *current situational model* — reprezentacja aktualnej sytuacji. Składa się ze struktur (*node structures*) budowanych przez PAM i dostosowywanych przez odwoływanie się do pamięci długotrwałych (deklaratywnej i epizodycznej).

Conscious Contents to ta część Workspace, która jest aktualnie uznana za najbardziej istotną i gotowa do umieszczenia w Global Workspace.

### 4.4. Transient Episodic Memory (TEM)

TEM jest krótkotrwałą pamięcią epizodyczną, przechowującą sekwencję ostatnich globalnych broadcastów. Służy do budowania krótkoterminowego kontekstu działania — agent może przypomnieć sobie, co się wydarzyło kilka cykli temu, bez konieczności odwoływania się do długotrwałej pamięci epizodycznej.

### 4.5. Pamięć deklaratywna (Declarative Memory)

Pamięć deklaratywna przechowuje trwałe fakty o świecie, analogicznie do modułu deklaratywnego ACT-R. Reaguje na global broadcast, dostarczając powiązane informacje do Workspace. Dzięki temu bieżąca sytuacja może być wzbogacona o kontekst z wiedzy ogólnej.

### 4.6. Pamięć epizodyczna (Episodic Memory)

Pamięć epizodyczna (Long-Term) jest zapełniana przez konsolidację danych z TEM. Pozwala agentowi na długoterminowe zapamiętywanie zdarzeń i przywoływanie konkretnych epizodów podczas global broadcastu.

### 4.7. Pamięć proceduralna (Procedural Memory)

Pamięć proceduralna przechowuje schematy zachowań (*behavior schemes*) — gotowe wzorce działania w określonych kontekstach. Każdy schemat ma kontekst aktywacji (jakie warunki w broadcastie go uruchamiają), ciało działania (lista kroków) i ewentualne wyniki uczenia się. Schematy konkurują ze sobą o selekcję.

```python
# Pseudo-kod reprezentacji schematu zachowania
class BehaviorScheme:
    def __init__(self, name, context, action_sequence, base_level_activation=0.5):
        self.name = name
        self.context = context           # warunki aktywacji (dict)
        self.action_sequence = action_sequence  # lista kroków
        self.activation = base_level_activation

    def matches(self, broadcast_content):
        """Sprawdza, czy broadcast pasuje do kontekstu schematu."""
        return all(broadcast_content.get(k) == v
                   for k, v in self.context.items())

    def update_activation(self, reward, alpha=0.1):
        """Aktualizacja aktywacji na podstawie nagrody."""
        self.activation += alpha * (reward - self.activation)


# Przykładowe schematy
scheme_avoid = BehaviorScheme(
    name="avoid_obstacle",
    context={"obstacle_detected": True, "distance": "close"},
    action_sequence=["stop", "turn_left", "move_forward"]
)

scheme_navigate = BehaviorScheme(
    name="navigate_to_goal",
    context={"goal_visible": True, "obstacle_detected": False},
    action_sequence=["move_forward"]
)
```

### 4.8. Pamięć uwagi (Attention Codelets)

Attention codelets to wyspecjalizowane moduły monitorujące Workspace i oceniające, które treści zasługują na globalny broadcast. Działają na zasadzie koalicji: codelet z najwyższą aktywnością koalicji wygrywa i umieszcza swoje treści w Global Workspace.

## 5. Global Workspace i globalny broadcast

### 5.1. Mechanizm selekcji

W każdym cyklu uwaga codelets tworzą koalicje — grupy węzłów o wspólnych treściach i wzajemnie wzmacniającej się aktywacji. Koalicja o najwyższej aktywności zdobywa Global Workspace i inicjuje broadcast. Mechanizm ten modeluje rywalizację o dostęp do świadomości — analogon neuronalnych oscillacji gamma obserwowanych w badaniach świadomości.

### 5.2. Efekty broadcastu

Global broadcast:
1. aktualizuje Declarative Memory — treści broadcastu mogą konsolidować się w długotrwałej pamięci,
2. aktualizuje Episodic Memory — broadcast jest zapisywany jako nowy epizod,
3. aktywuje Behavior Schemes w Procedural Memory — treści broadcastu dopasowują schematy zachowań,
4. informuje Learning Modules — moduły uczenia się adaptują wagi na podstawie treści broadcastu.

```python
class GlobalWorkspace:
    def __init__(self, modules):
        self.modules = modules  # lista zarejestrowanych modułów
        self.current_content = None

    def broadcast(self, content):
        """Rozgłoszenie treści do wszystkich zarejestrowanych modułów."""
        self.current_content = content
        for module in self.modules:
            module.receive_broadcast(content)


class ProceduralMemory:
    def __init__(self, schemes):
        self.schemes = schemes

    def receive_broadcast(self, content):
        """Aktywacja schematów pasujących do treści broadcastu."""
        activated = [s for s in self.schemes if s.matches(content)]
        return activated
```

## 6. Mechanizmy uczenia się

### 6.1. Uczenie Hebbiańskie

Uczenie Hebbiańskie jest realizowane w sieciach percepcyjnych (PAM). Aktywacja węzłów podczas global broadcastu wzmacnia połączenia między nimi zgodnie z regułą Hebba: neurony aktywne jednocześnie wzmacniają swoje połączenia.

```
Δw_ij = η · a_i · a_j

gdzie:
  Δw_ij — zmiana wagi połączenia między węzłami i oraz j
  η — współczynnik uczenia
  a_i, a_j — aktywacje węzłów
```

### 6.2. Uczenie przez wzmocnienie (Reinforcement Learning)

Schematy zachowań w Procedural Memory są aktualizowane przez RL. Nagroda jest dostarczana przez moduł motywacyjny lub środowisko. Aktywacja schematu jest aktualizowana algorytmem zbliżonym do TD-learning:

```python
def update_scheme(scheme, reward, discount=0.9, alpha=0.1):
    """Aktualizacja wartości schematu zachowania."""
    target = reward + discount * max(s.activation for s in scheme.successors)
    scheme.activation += alpha * (target - scheme.activation)
```

### 6.3. Uczenie epizodyczne

Treści globalne broadcastu są zapisywane w Transient Episodic Memory i stopniowo konsolidowane do długotrwałej pamięci epizodycznej. Przyszłe odwołania do podobnych sytuacji mogą przywoływać te epizody, wzbogacając bieżące rozumienie kontekstu.

### 6.4. Uczenie percepcyjne

Nowe schematy percepcyjne mogą powstawać przez *perceptual learning*: powtarzające się współwystępowanie cech sensorycznych prowadzi do formowania nowych węzłów PAM reprezentujących złożone wzorce.

## 7. Implementacja: LIDA Framework (Java)

### 7.1. Struktura frameworku

LIDA Framework jest implementacją Java dostępną na GitHub. Framework definiuje:
- interfejsy dla każdego modułu,
- mechanizm cyklu kognitywnego (*CognitiveContentStructure*),
- system zarządzania zadaniami asynchronicznymi (*TaskManager*),
- mechanizm broadcastu przez wzorzec Observer/Listener.

```java
// Główna pętla cyklu kognitywnego (uproszczona)
public class CognitiveCycle {
    private PerceptualAssociativeMemory pam;
    private Workspace workspace;
    private GlobalWorkspace globalWorkspace;
    private ProceduralMemory proceduralMemory;
    private ActionSelection actionSelection;
    private SensoryMemory sensoryMemory;

    public void runCycle() {
        // Faza 1: Percepcja
        NodeStructure sensorContent = sensoryMemory.getCurrentContent();
        NodeStructure perceivedContent = pam.perceive(sensorContent);
        workspace.update(perceivedContent);

        // Faza 2: Uwaga i broadcast
        Coalition winningCoalition = workspace.getAttentionCodelets()
                                              .stream()
                                              .max(Comparator.comparingDouble(
                                                  Coalition::getActivation))
                                              .orElse(null);
        if (winningCoalition != null) {
            globalWorkspace.broadcast(winningCoalition.getContent());
        }

        // Faza 3: Selekcja działania
        List<Behavior> activatedBehaviors =
            proceduralMemory.getActivatedBehaviors(
                globalWorkspace.getCurrentContent());
        Behavior selected = actionSelection.select(activatedBehaviors);
        if (selected != null) {
            selected.execute();
        }
    }
}
```

### 7.2. Konfiguracja agenta

Agenty LIDA są konfigurowane przez pliki XML lub przez API Java, które definiują:
- typy modułów i ich klasy implementujące,
- wagi początkowe PAM,
- zestawy schematów zachowań,
- parametry cyklu (częstotliwość, czas trwania faz).

## 8. Zastosowania

### 8.1. Sterowanie robotem

LIDA była stosowana do sterowania robotami w środowiskach częściowo obserwowalnych. Architektura dobrze sprawdza się tam, gdzie robot musi:
- rozpoznawać wieloznaczne bodźce wizualne,
- integrować percepcję z pamięcią epizodyczną,
- reagować na zmieniające się priorytety (mechanizm uwagi).

### 8.2. NPC w grach komputerowych

Non-Player Characters (*NPC*) w grach wymagają postaci, które reagują w sposób uchodzący za naturalny. LIDA może modelować:
- postrzeganie otoczenia przez NPC (sensoryczny, percepcyjny pipeline),
- reaktywność na gracza z uwzględnieniem bieżącego stanu emocjonalnego i historii,
- wybór zachowań zależny od kontekstu (schemat ucieczki vs. ataku).

### 8.3. Inteligentne asystenty mobilne

W kontekście aplikacji mobilnych LIDA może stanowić silnik asystenta rozumiejącego kontekst. Cykl percepcja–broadcast–działanie realizuje pętlę: odczytaj dane z sensora → rozpoznaj sytuację → zdecyduj o powiadomieniu lub akcji.

```python
# Koncepcja uproszczonego agenta LIDA dla aplikacji mobilnej
class MobileLIDAAgent:
    def __init__(self):
        self.pam_patterns = {
            "location_home": {"gps_zone": "home"},
            "location_work": {"gps_zone": "work"},
            "high_motion": {"accelerometer": "high"},
        }
        self.behavior_schemes = [
            BehaviorScheme("suggest_commute",
                           {"recognized": "location_home", "time": "morning"},
                           ["send_notification: 'Czas na dojazd do pracy'"]),
            BehaviorScheme("suggest_rest",
                           {"recognized": "high_motion", "duration_min": ">30"},
                           ["send_notification: 'Zrób przerwę'"]),
        ]

    def perceive(self, sensor_data):
        """Faza percepcji: rozpoznanie wzorców w danych sensorycznych."""
        for pattern_name, conditions in self.pam_patterns.items():
            if all(sensor_data.get(k) == v for k, v in conditions.items()):
                return pattern_name
        return "unknown"

    def run_cycle(self, sensor_data, context):
        recognized = self.perceive(sensor_data)
        broadcast_content = {"recognized": recognized, **context}
        # Selekcja schematu
        for scheme in self.behavior_schemes:
            if scheme.matches(broadcast_content):
                print(f"Akcja: {scheme.action_sequence}")
                break
```

## 9. LIDA a świadomość maszynowa

### 9.1. Świadomość dostępu a świadomość fenomenalna

Filozofia umysłu rozróżnia świadomość dostępu (*access consciousness*) — informacja dostępna do kontroli zachowań i raportowania — od świadomości fenomenalnej (*phenomenal consciousness*) — subiektywnych qualiów. LIDA modeluje explicite świadomość dostępu przez mechanizm global broadcastu. Nie rości sobie pretensji do realizacji świadomości fenomenalnej.

### 9.2. Znaczenie dla AI

To rozróżnienie ma konsekwencje praktyczne: architektura LIDA może być oceniana funkcjonalnie na podstawie testowalnych przewidywań dotyczących przepływu informacji, a nie przez meta-filozoficzne pytania o subiektywność. Franklin argumentuje, że agenty LIDA wykazują funkcjonalne ekwiwalenty uwagi, świadomości dostępu i uczenia się w kontekście — co jest wystarczające dla celów inżynierskich.

## 10. Porównanie z innymi architekturami

### 10.1. LIDA a ACT-R

ACT-R kładzie nacisk na ilościowe przewidywanie zachowań pamięciowych i jest silnie zakorzeniony w danych eksperymentalnych. LIDA koncentruje się na cyklu percepcja-uwaga-działanie i modelu świadomości dostępu. ACT-R ma bogatszą teorię pamięci deklaratywnej (BLL); LIDA ma bardziej szczegółowy model uwagi i jej roli w dystrybucji informacji.

### 10.2. LIDA a Soar

Soar skupia się na planowaniu w przestrzeni problemów i uczeniu przez kompilację reguł (chunking). LIDA skupia się na cyklu percepcyjno-uwagowym i global workspace. Soar ma mocniejszy mechanizm planowania sekwencyjnego; LIDA mocniejszy model reaktywnej uwagi i integracji percepcji.

### 10.3. LIDA a CLARION

CLARION wyróżnia się explicite modelowaniem procesów jawnych i niejawnych w oddzielnych warstwach. LIDA realizuje podobne rozróżnienie przez kontrast między nieświadomymi procesami percepcyjnymi (PAM) a treściami globalnymi broadcastu, jednak nie przez oddzielne architektury warstw.

| Cecha | LIDA | ACT-R | Soar | CLARION |
|---|---|---|---|---|
| Model świadomości | GWT (centralny) | Brak | Brak | Brak (implicit/explicit) |
| Uwaga | Attention codelets | Moduł wzrokowy | Brak | Brak |
| Cykl kognitywny | Trójfazowy | Cykl produkcyjny | Cykl decyzyjny | Cykl ACS/NACS |
| Pamięć epizodyczna | TEM + długotrwała | Ograniczona | EpMem | Episodic memory |
| Uczenie percepcyjne | Hebbian (PAM) | Przez chunki | Chunking | Bottom-level NN |
| Planowanie | Ograniczone | Ograniczone | Subgoaling | Ograniczone |
| Implementacja | Java Framework | Lisp / Python | C++ / Java | Java / Python |

## 11. Ograniczenia

LIDA ma kilka istotnych ograniczeń. Po pierwsze, czas cyklu kognitywnego (80–400 ms) może być zbyt wolny dla reaktywnych zadań robotycznych wymagających latencji poniżej 10 ms. Po drugie, mechanizm uwagi przez koalicje jest trudny do strojenia w złożonych środowiskach z wieloma równoprawnymi bodźcami. Po trzecie, integracja z nowoczesnymi metodami uczenia głębokiego nie jest natywna i wymaga własnych adapterów.

## 12. Podsumowanie

LIDA jest architekturą kognitywną o wyraźnym profilu teoretycznym: opiera się na GWT Baarsa i modeluje funkcjonalny analog świadomości dostępu jako mechanizm dystrybucji informacji. Trójfazowy cykl kognitywny, wielowarstwowy system pamięci, mechanizm uwagi przez koalicje i różnorodne mechanizmy uczenia tworzą spójną i biologicznie motywowaną całość. Dla studentów programowania aplikacji mobilnych LIDA jest ważnym przykładem architektury ukierunkowanej na reaktywne, kontekstowe przetwarzanie informacji — wzorzec przydatny w projektowaniu inteligentnych asystentów i aplikacji adaptacyjnych.

## Literatura

1. Franklin, S., & Graesser, A. (1997). Is it an agent, or just a program? *LNAI 1193*, Springer.
2. Baars, B. J. (1988). *A Cognitive Theory of Consciousness*. Cambridge University Press.
3. Franklin, S., Ramamurthy, U., D'Mello, S. K., McCauley, L., Negatu, A., Silva, R., & Datla, V. (2007). LIDA: A computational model of global workspace theory and developmental learning. *AAAI*.
4. Dehaene, S., Changeux, J.-P., & Naccache, L. (2011). The global neuronal workspace model of conscious access. *Experimental Brain Research*, 206(3), 223–237.
5. Snaider, J., McCall, R., & Franklin, S. (2011). The LIDA framework as a general tool for AGI. *Lecture Notes in Computer Science*, 6830, Springer.
6. Franklin, S., & Patterson, F. G. (2006). The LIDA architecture: Adding new modes of learning to an intelligent, autonomous, software agent. *IASTED International Conference on AI*.
7. Anderson, J. R. (2007). *How Can the Human Mind Occur in the Physical Universe?* Oxford University Press.
8. Laird, J. E. (2012). *The Soar Cognitive Architecture*. MIT Press.
9. Sun, R. (2006). CLARION: Extending cognitive modeling to social simulation. *Cambridge University Press*.
10. Signorelli, C. M., Szczotka, J., & Prentner, R. (2021). Explanatory profiles of models of consciousness. *Neuroscience of Consciousness*, 7(2).

## Powiązane artykuły

- [Modele kognitywne](cognitive-models.md)
- [Obliczeniowe modelowanie poznania](computational-cognition.md)
- [Soar — architektura kognitywna](soar-architecture.md)
- [ACT-R](actr-architecture.md)
- [CLARION](clarion-architecture.md)
- [Inteligentny agent](intelligent-agent.md)
- [Robotyka kognitywna](cognitive-robotics.md)
