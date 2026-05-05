# Agent programowy (Software Agent)

Agent programowy (*software agent*) to autonomiczny program komputerowy, który postrzega swoje środowisko poprzez dane wejściowe, przetwarza je i podejmuje działania w celu realizacji zdefiniowanych celów - bez ciągłej ingerencji człowieka. To jeden z fundamentalnych konceptów nowoczesnej inżynierii oprogramowania i sztucznej inteligencji.

## Definicja i cechy

Termin „agent" pochodzi z łaciny (*agere* - działać) i w kontekście informatyki oznacza byt zdolny do samodzielnego działania. Klasyczna definicja (Wooldridge & Jennings, 1995) wyróżnia cztery podstawowe własności agenta:

| Własność | Opis |
|----------|------|
| **Autonomia** | Działa bez bezpośredniego kierowania przez ludzi; kontroluje własne stany wewnętrzne |
| **Reaktywność** | Postrzega środowisko i odpowiada na jego zmiany w odpowiednim czasie |
| **Proaktywność** | Nie tylko reaguje, ale też podejmuje inicjatywę, dążąc do celów |
| **Towarzyskość** | Potrafi wchodzić w interakcje z innymi agentami i ludźmi |

## Taksonomia agentów programowych

### Według poziomu inteligencji

```
Agenty proste (reaktywne)
  └─ Reagują bezpośrednio na bodźce (reguły if–then)
  └─ Np. termostat, bot antyspamowy

Agenty z modelem środowiska
  └─ Przechowują wewnętrzną reprezentację świata
  └─ Np. nawigator GPS, crawler indeksujący strony

Agenty celowe
  └─ Planują sekwencję akcji prowadzącą do celu
  └─ Np. planer logistyczny, asystent rezerwacji

Agenty użytecznościowe
  └─ Wybierają działania maksymalizujące funkcję użyteczności
  └─ Np. agent handlujący na giełdzie, system rekomendacji

Agenty uczące się
  └─ Adaptują swoje zachowanie na podstawie doświadczenia
  └─ Np. asystent głosowy, filtr spamu ML
```

### Według środowiska działania

Środowiska, w których działa agent, można charakteryzować kilkoma wymiarami (Russell & Norvig):

| Wymiar | Możliwości | Przykład |
|--------|-----------|---------|
| **Obserwowalność** | Pełna / Częściowa | Szachy vs. Poker |
| **Determinizm** | Deterministyczne / Stochastyczne | Labirynt vs. Giełda |
| **Episodyczność** | Epizodyczne / Sekwencyjne | Klasyfikacja zdjęć vs. Gra |
| **Dynamiczność** | Statyczne / Dynamiczne | Krzyżówka vs. Ruch drogowy |
| **Dyskretność** | Dyskretne / Ciągłe | Szachy vs. Sterowanie robotem |
| **Liczba agentów** | Jednoagentowe / Wieloagentowe | Sudoku vs. Aukcja |

## Architektura agenta

### Architektura reaktywna (Agent Odruchowy)

Najprostsza forma: bezpośrednie mapowanie percepcja → akcja.

```python
class ReactiveAgent:
    """Agent reaktywny oparty na regułach."""

    def __init__(self):
        self.rules = [
            # (warunek, akcja)
            (lambda s: s.get('spam_score', 0) > 0.8, 'delete_email'),
            (lambda s: s.get('sender') in self.whitelist, 'move_to_inbox'),
            (lambda s: s.get('has_attachment'), 'scan_attachment'),
        ]
        self.whitelist = {'boss@company.com', 'team@company.com'}

    def perceive(self, environment) -> dict:
        """Pobierz aktualny stan środowiska."""
        return environment.get_current_state()

    def act(self, state: dict) -> str:
        """Wybierz akcję na podstawie reguł."""
        for condition, action in self.rules:
            if condition(state):
                return action
        return 'do_nothing'

    def run(self, environment):
        while True:
            state = self.perceive(environment)
            action = self.act(state)
            environment.execute(action)
```

### Architektura BDI (Belief-Desire-Intention)

Model BDI to najważniejsza architektura dla praktycznych agentów inteligentnych. Opisuje stan mentalny agenta przez trzy komponenty:

```
Beliefs  - co agent wie/sądzi o świecie
Desires  - jakie stany agent chce osiągnąć (cele)
Intentions - do czego agent jest aktualnie zobowiązany (plany w toku)
```

```python
from dataclasses import dataclass, field
from typing import Any, Callable

@dataclass
class Plan:
    trigger: str            # zdarzenie wyzwalające plan
    context: Callable       # warunek stosowalności planu
    body: list[str]         # lista akcji

class BDIAgent:
    """Uproszczona implementacja agenta BDI."""

    def __init__(self):
        self.beliefs: dict[str, Any] = {}       # baza przekonań
        self.desires: list[str] = []            # aktywne cele
        self.intentions: list[Plan] = []        # zobowiązania

        # Biblioteka planów
        self.plan_library: list[Plan] = [
            Plan(
                trigger='battery_low',
                context=lambda b: b.get('charger_available', False),
                body=['navigate_to_charger', 'start_charging']
            ),
            Plan(
                trigger='new_message',
                context=lambda b: b.get('online', True),
                body=['read_message', 'generate_reply', 'send_reply']
            ),
        ]

    def update_beliefs(self, percept: dict):
        """Zaktualizuj przekonania na podstawie percepcji."""
        self.beliefs.update(percept)

    def generate_desires(self):
        """Wyznacz aktywne cele na podstawie przekonań."""
        if self.beliefs.get('battery_level', 100) < 20:
            if 'charge_battery' not in self.desires:
                self.desires.append('charge_battery')

    def select_intention(self):
        """Wybierz plan dla aktywnego celu."""
        for desire in self.desires:
            for plan in self.plan_library:
                if plan.trigger == desire and plan.context(self.beliefs):
                    self.intentions.append(plan)
                    self.desires.remove(desire)
                    break

    def execute_step(self) -> str | None:
        """Wykonaj jeden krok pierwszego aktywnego planu."""
        if self.intentions and self.intentions[0].body:
            return self.intentions[0].body.pop(0)
        elif self.intentions:
            self.intentions.pop(0)
        return None

    def run_cycle(self, percept: dict):
        """Jeden cykl deliberacyjny agenta BDI."""
        self.update_beliefs(percept)
        self.generate_desires()
        self.select_intention()
        action = self.execute_step()
        return action
```

### Architektura warstwowa (InteRRaP)

Model łączy podejście reaktywne i deliberatywne w trzy warstwy:

```
┌────────────────────────────────────┐
│  Warstwa kooperatywna              │  (planowanie społeczne, negocjacje)
├────────────────────────────────────┤
│  Warstwa planowania lokalnego      │  (deliberacja, tworzenie planów)
├────────────────────────────────────┤
│  Warstwa zachowań reaktywnych      │  (szybka odpowiedź na bodźce)
└────────────────────────────────────┘
         ↕ percepcja / akcja
    [ Środowisko ]
```

## Systemy wieloagentowe (MAS)

Systemy wieloagentowe (*Multi-Agent Systems*, MAS) to środowiska, w których wiele agentów współdziała, negocjuje lub konkuruje.

### Komunikacja między agentami - FIPA ACL

Standard FIPA ACL (Agent Communication Language) definiuje ustrukturyzowane komunikaty:

```python
class FIPAMessage:
    """Komunikat FIPA ACL."""

    def __init__(self, performative, sender, receiver, content, **kwargs):
        self.performative = performative  # typ: REQUEST, INFORM, PROPOSE, ACCEPT, REJECT...
        self.sender = sender
        self.receiver = receiver
        self.content = content
        self.conversation_id = kwargs.get('conversation_id')
        self.reply_with = kwargs.get('reply_with')

class BuyerAgent(BDIAgent):
    """Agent kupujący w protokole aukcji."""

    def propose_price(self, item_id: str, max_price: float) -> FIPAMessage:
        return FIPAMessage(
            performative='PROPOSE',
            sender=self.agent_id,
            receiver='seller_agent',
            content={'item': item_id, 'price': max_price * 0.8},  # zacznij od 80%
            conversation_id=f'auction_{item_id}'
        )

    def handle_counter_offer(self, msg: FIPAMessage) -> FIPAMessage:
        offered_price = msg.content['price']
        if offered_price <= self.beliefs['max_budget']:
            return FIPAMessage('ACCEPT-PROPOSAL', self.agent_id, msg.sender,
                               {'price': offered_price})
        return FIPAMessage('REJECT-PROPOSAL', self.agent_id, msg.sender,
                           {'reason': 'price_too_high'})
```

### Koordynacja i negocjacje

Agenty mogą koordynować działania przez:

- **Aukcje** (Vickrey, angielska, holenderska) - alokacja zasobów
- **Protokół Contract Net** - zlecanie podzadań agentom z najlepszą ofertą
- **Argumentation** - wymiana argumentów do osiągnięcia konsensusu
- **Stygmergia** - pośrednia koordynacja przez modyfikację środowiska (jak mrówki)

```python
class ContractNetInitiator:
    """Protokół Contract Net - zleceniodawca."""

    def __init__(self, task, participants):
        self.task = task
        self.participants = participants
        self.proposals = {}

    def call_for_proposals(self) -> list[FIPAMessage]:
        return [
            FIPAMessage('CFP', 'coordinator', agent,
                        content={'task': self.task, 'deadline': '2026-03-27'})
            for agent in self.participants
        ]

    def evaluate_proposals(self, proposals: list[FIPAMessage]) -> str:
        """Wybierz najlepszą ofertę (np. najniższy koszt)."""
        best = min(proposals, key=lambda p: p.content.get('cost', float('inf')))
        winner = best.sender
        # Wyślij ACCEPT do zwycięzcy, REJECT do pozostałych
        return winner
```

## Agenty mobilne

Agenty mobilne (*mobile agents*) mogą migrować między węzłami sieci, przenosząc swój stan i kod:

```
Węzeł A: Agent startuje, zbiera dane lokalne
  │
  ├─ migracja (kod + stan) ──→ Węzeł B: Zbiera dane lokalne
  │                                │
  │                                └─ migracja ──→ Węzeł C: Przetwarza, zwraca wynik
```

Zastosowania:
- Rozproszone przeszukiwanie sieci bez ciągłej komunikacji z centrum
- Odporność na przejściową niedostępność węzłów
- Redukcja ruchu sieciowego (przetwarzanie lokalnie)

## Agenty w kontekście LLM

Nowoczesne *agenty LLM* (np. LangChain Agents, AutoGen) łączą duże modele językowe z narzędziami zewnętrznymi:

```python
# Przykład agenta z narzędziami (szkielet LangChain-style)
class LLMAgent:
    """Agent oparty na dużym modelu językowym z narzędziami."""

    def __init__(self, llm, tools):
        self.llm = llm
        self.tools = {t.name: t for t in tools}
        self.memory = []  # historia konwersacji

    def run(self, user_input: str) -> str:
        self.memory.append({'role': 'user', 'content': user_input})

        while True:
            # LLM decyduje: odpowiedz lub użyj narzędzia
            response = self.llm.chat(self.memory)

            if response.tool_call:
                tool_name = response.tool_call['name']
                tool_args = response.tool_call['args']
                # Wykonaj narzędzie (np. wyszukiwarka, kalkulator, API)
                result = self.tools[tool_name].run(**tool_args)
                self.memory.append({
                    'role': 'tool',
                    'name': tool_name,
                    'content': str(result)
                })
            else:
                # Ostateczna odpowiedź dla użytkownika
                return response.content
```

Cykl ReAct (Reason + Act):
```
Thought: "Muszę sprawdzić aktualną pogodę w Rzeszowie"
Action: weather_api(city="Rzeszów")
Observation: "Temperatura: 12°C, zachmurzenie"
Thought: "Mam dane, mogę odpowiedzieć"
Final Answer: "W Rzeszowie jest 12°C i zachmurzenie."
```

## Zastosowania agentów programowych

| Dziedzina | Przykłady |
|-----------|---------|
| **E-commerce** | Agenty porównujące ceny, boty aukcyjne |
| **Finanse** | Algorytmiczny trading, wykrywanie oszustw |
| **Zdrowie** | Monitorowanie pacjentów, przypomnienia o lekach |
| **Gry** | NPC z autonomicznym zachowaniem (GoalBots) |
| **IoT** | Agenty zarządzające urządzeniami Smart Home |
| **Cyberbezpieczeństwo** | Autonomiczne systemy wykrywania intruzów |
| **Asystenci mobilni** | Siri, Google Assistant, Cortana |

## Powiązane artykuły

- [Inteligentni agenci](#wiki-intelligent-agent)
- [Reprezentacja wiedzy i wnioskowanie](#wiki-knowledge-representation)
- [Modele kognitywne](#wiki-cognitive-models)
- [Robotyka poznawcza](#wiki-cognitive-robotics)
- [Computational cognition](#wiki-computational-cognition)
- [ACT-R](#wiki-actr-architecture)
- [Soar - architektura kognitywna](#wiki-soar-architecture)
- [LIDA](#wiki-lida-architecture)
- [CLARION](#wiki-clarion-architecture)

## Linki zewnętrzne

- [FIPA - Foundation for Intelligent Physical Agents](http://www.fipa.org/)
- [JADE - Java Agent DEvelopment Framework](https://jade.tilab.com/)
- [LangChain Agents Documentation](https://python.langchain.com/docs/modules/agents/)
- [Russell & Norvig: Artificial Intelligence - A Modern Approach](https://aima.cs.berkeley.edu/)
- [AgentSpeak / Jason - BDI Agent Language](https://jason.sourceforge.net/)
