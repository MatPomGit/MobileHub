# Reprezentacja wiedzy i wnioskowanie (Knowledge Representation and Reasoning)

## Streszczenie

Reprezentacja wiedzy i wnioskowanie (*Knowledge Representation and Reasoning*, KR&R) to dziedzina sztucznej inteligencji zajmująca się formalnym opisem wiedzy o świecie w sposób umożliwiający automatyczne rozumowanie. Artykuł omawia podstawowe typy wiedzy, główne formalizmy reprezentacji (sieci semantyczne, ramki, ontologie, logika opisowa), standardy semantycznego webu (OWL, RDF, SPARQL), systemy regułowe, grafy wiedzy, metody obsługi niepewności oraz zastosowania w mobilnych systemach AI.

**Słowa kluczowe:** reprezentacja wiedzy, wnioskowanie, ontologie, OWL, RDF, sieci semantyczne, systemy ekspertowe, grafy wiedzy, logika rozmyta, sieci bayesowskie

---

## 1. Wprowadzenie

Jednym z fundamentalnych pytań sztucznej inteligencji jest to, jak sprawić, żeby komputer „wiedział" coś o świecie i potrafił na tej podstawie wnioskować. Odpowiedź na to pytanie stanowi właśnie obszar KR&R. Bez formalnej reprezentacji wiedzy niemożliwe byłoby budowanie systemów ekspertowych, asystentów głosowych, silników rekomendacji czy systemów diagnostycznych.

Reprezentacja wiedzy pełni trzy podstawowe funkcje:

1. **Surrogat** (*surrogate*) — jest zastępnikiem rzeczywistości, pozwalającym rozumować bez bezpośredniej obserwacji świata.
2. **Zbiór ontologicznych zobowiązań** (*ontological commitments*) — definiuje, jakie obiekty i relacje istnieją w modelowanym świecie.
3. **Fragmentaryczna teoria wnioskowania** — określa, jakie wnioski można i należy wyciągać z danego zbioru faktów.

Kluczowe pytania w projektowaniu systemu KR:

- Co reprezentować? (obiekty, zdarzenia, relacje, reguły, procedury)
- Jak reprezentować? (logika, grafy, reguły, prawdopodobieństwo)
- Jak wnioskować efektywnie? (forward chaining, backward chaining, rozumowanie pod niepewnością)

---

## 2. Typy wiedzy

### 2.1. Wiedza deklaratywna (*Declarative Knowledge*)

Wiedza deklaratywna opisuje **co jest prawdą** — fakty, właściwości obiektów i relacje między nimi. Jest to wiedza niezależna od metody jej użycia.

```prolog
% Przykład wiedzy deklaratywnej w Prologu
ptak(orzeł).
ptak(pingwin).
lata(orzeł).
% pingwin nie lata — brak faktu lub negacja przez niepowodzenie
```

Przykłady: bazy wiedzy ontologicznych, encyklopedie, bazy danych semantycznych.

### 2.2. Wiedza proceduralna (*Procedural Knowledge*)

Wiedza proceduralna opisuje **jak coś robić** — algorytmy, procedury, sekwencje działań.

```python
# Wiedza proceduralna: jak sortować listę
def merge_sort(lst):
    if len(lst) <= 1:
        return lst
    mid = len(lst) // 2
    left = merge_sort(lst[:mid])
    right = merge_sort(lst[mid:])
    return merge(left, right)
```

W architekturach kognitywnych (np. ACT-R) wiedza proceduralna jest zakodowana w **regułach produkcyjnych**.

### 2.3. Wiedza heurystyczna (*Heuristic Knowledge*)

Wiedza heurystyczna to reguły praktyczne (*rules of thumb*), które zwykle działają, lecz nie są gwarantowane. Pochodzi z doświadczenia ekspertów.

```
JEŚLI pacjent ma gorączkę > 38.5°C
   ORAZ kaszel trwa > 7 dni
   ORAZ wiek > 65 lat
TO rozważ hospitalizację (pewność: 0.85)
```

### 2.4. Wiedza meta-poziomowa (*Meta-Knowledge*)

Wiedza o samej wiedzy — co system wie, czego nie wie, jak pewne są poszczególne fakty.

---

## 3. Sieci semantyczne (*Semantic Networks*)

Sieci semantyczne są grafowymi reprezentacjami wiedzy, w których węzły odpowiadają pojęciom lub obiektom, a krawędzie — relacjom między nimi.

```
        ┌─────────┐
        │  Zwierzę│
        └────┬────┘
          IS-A│
        ┌────▼────┐    HAS-PART    ┌──────────┐
        │  Ptak   │───────────────▶│  Skrzydło│
        └────┬────┘                └──────────┘
          IS-A│
        ┌────▼────┐
        │  Orzeł  │
        └─────────┘
```

Kluczowe relacje w sieciach semantycznych:
- **IS-A** — przynależność do klasy (dziedziczenie cech)
- **HAS-A / HAS-PART** — kompozycja
- **INSTANCE-OF** — przynależność obiektu do klasy

**Dziedziczenie właściwości** (*property inheritance*) umożliwia wnioskowanie: skoro orzeł IS-A ptak, orzeł dziedziczy właściwości ptaka bez ich jawnego wymieniania.

**Wyjątki i wyjątkowe dziedziczenie**: pingwin IS-A ptak, ale pingwin NIE lata. W klasycznych sieciach semantycznych takie wyjątki wymagają jawnego blokowania dziedziczenia.

---

## 4. Ramki (*Frames*)

Ramki (Minsky, 1974) to struktury danych opisujące obiekty przez zbiór **atrybutów** (*slots*) z wartościami domyślnymi.

```python
# Reprezentacja ramkowa w Pythonie
class Frame:
    def __init__(self, name, parent=None, slots=None):
        self.name = name
        self.parent = parent
        self.slots = slots or {}

    def get(self, slot):
        if slot in self.slots:
            return self.slots[slot]
        if self.parent:
            return self.parent.get(slot)   # dziedziczenie
        return None


zwierze = Frame("Zwierzę", slots={"żywe": True, "oddycha": True})
ptak = Frame("Ptak", parent=zwierze, slots={"lata": True, "ma_skrzydła": True})
pingwin = Frame("Pingwin", parent=ptak, slots={"lata": False})   # nadpisanie domyślnej wartości

print(pingwin.get("lata"))        # False
print(pingwin.get("ma_skrzydła")) # True  (dziedziczone z Ptak)
print(pingwin.get("oddycha"))     # True  (dziedziczone z Zwierzę)
```

Ramki są bezpośrednim przodkiem **klas w programowaniu obiektowym** i **ontologii w OWL**.

---

## 5. Logika predykatów pierwszego rzędu (*First-Order Predicate Logic*)

Logika pierwszego rzędu (FOL) jest formalną podstawą większości systemów KR. Umożliwia wyrażenie:

- **Faktów**: `Ptak(orzeł)`, `Lata(orzeł)`
- **Reguł**: `∀x: Ptak(x) ∧ ¬Wyjątek(x) → Lata(x)`
- **Zapytań**: `∃x: Ptak(x) ∧ ¬Lata(x)`

### 5.1. Wnioskowanie w FOL

Podstawowe mechanizmy wnioskowania:

| Mechanizm | Opis | Przykład |
|---|---|---|
| Modus Ponens | Jeśli P i P→Q, to Q | z Ptak(x) i Ptak→Lata, wnioskuj Lata(x) |
| Rezolucja | Uogólniony mechanizm dowodu | podstawa Prologu |
| Forward Chaining | Od faktów do celów | systemy ekspertowe |
| Backward Chaining | Od celu do warunków | Prolog, planiści AI |

```prolog
% Wnioskowanie w Prologu (backward chaining)
lata(X) :- ptak(X), \+ wyjątek_lata(X).
wyjątek_lata(pingwin).
ptak(orzeł).
ptak(pingwin).

% Zapytanie:
% ?- lata(orzeł).   → true
% ?- lata(pingwin). → false
```

---

## 6. Ontologie i logika opisowa (*Description Logics*)

### 6.1. Czym jest ontologia?

Ontologia w AI (Gruber, 1993): „formalna, explicite specyfikacja wspólnej konceptualizacji". Ontologia definiuje:

- **Klasy** (*concepts*) — zbiory obiektów
- **Własności** (*properties/roles*) — relacje między obiektami
- **Indywidua** (*individuals*) — konkretne obiekty
- **Aksjomaty** (*axioms*) — warunki konieczne i wystarczające dla klas

### 6.2. Logika opisowa (*Description Logics*, DL)

Logika opisowa to rodzina języków logicznych będących podzbiorem FOL, zoptymalizowanych pod kątem efektywnego wnioskowania. Jej centralnym problemem jest **klasyfikacja**: ustalenie, które klasy są podklasami których.

Podstawowe konstruktory DL:

| Konstruktor | Notacja | Znaczenie |
|---|---|---|
| Koniunkcja | C ⊓ D | Obiekty będące C i D |
| Alternatywa | C ⊔ D | Obiekty będące C lub D |
| Negacja | ¬C | Obiekty nie będące C |
| Egzystencjalna rola | ∃R.C | Obiekty mające relację R do jakiegoś C |
| Ogólna rola | ∀R.C | Obiekty, których wszystkie R-następniki są C |

Przykład w DL:

```
Rodzic ≡ Osoba ⊓ ∃maADziecko.Osoba
Matka ≡ Rodzic ⊓ Kobiety
BezdzietnaNajmłodsza ≡ Osoba ⊓ ¬∃maADziecko.Osoba
```

### 6.3. Hierarchia wyrażalności DL

```
ALC ⊂ SHIQ ⊂ SHOIQ ⊂ SROIQ (OWL 2 DL)
```

Większa wyrażalność = większa złożoność wnioskowania. OWL 2 DL odpowiada logice SROIQ, która zapewnia decidability przy zachowaniu praktycznej użyteczności.

---

## 7. Standardy semantycznego webu: RDF, OWL, SPARQL

### 7.1. RDF (*Resource Description Framework*)

RDF reprezentuje wiedzę jako trojki (*triples*): **podmiot – predykat – obiekt**.

```turtle
# Przykład w formacie Turtle (RDF)
@prefix ex: <http://example.org/> .
@prefix rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#> .
@prefix rdfs: <http://www.w3.org/2000/01/rdf-schema#> .

ex:Orzeł rdf:type ex:Ptak .
ex:Orzeł ex:lata "true"^^xsd:boolean .
ex:Ptak rdfs:subClassOf ex:Zwierzę .
ex:Orzeł ex:imię "Bielik" .
```

### 7.2. OWL (*Web Ontology Language*)

OWL jest bogatszym językiem ontologii, opartym na DL. Wersje:

- **OWL Lite** — proste hierarchie, ograniczenia
- **OWL DL** — pełna logika opisowa, decidable
- **OWL Full** — pełna moc RDF, undecidable

```xml
<!-- Fragment ontologii OWL/XML -->
<Class IRI="#Ptak">
  <SubClassOf>
    <Class IRI="#Zwierzę"/>
  </SubClassOf>
</Class>
<ObjectProperty IRI="#lata"/>
<SubClassOf>
  <Class IRI="#Ptak"/>
  <ObjectSomeValuesFrom>
    <ObjectProperty IRI="#ma_skrzydła"/>
    <Class IRI="#Skrzydło"/>
  </ObjectSomeValuesFrom>
</SubClassOf>
```

### 7.3. SPARQL (*SPARQL Protocol and RDF Query Language*)

SPARQL to język zapytań do grafów RDF:

```sparql
PREFIX ex: <http://example.org/>
PREFIX rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#>

SELECT ?ptak ?imię
WHERE {
  ?ptak rdf:type ex:Ptak .
  ?ptak ex:imię ?imię .
  FILTER NOT EXISTS { ?ptak ex:lata false }
}
```

### 7.4. Przykład z rdflib (Python)

```python
from rdflib import Graph, Namespace, RDF, RDFS, Literal, URIRef
from rdflib.namespace import XSD

EX = Namespace("http://example.org/animals#")

g = Graph()
g.bind("ex", EX)

# Dodawanie trojek
g.add((EX.Eagle, RDF.type, EX.Bird))
g.add((EX.Eagle, EX.canFly, Literal(True, datatype=XSD.boolean)))
g.add((EX.Eagle, EX.name, Literal("Bald Eagle")))
g.add((EX.Bird, RDFS.subClassOf, EX.Animal))

g.add((EX.Penguin, RDF.type, EX.Bird))
g.add((EX.Penguin, EX.canFly, Literal(False, datatype=XSD.boolean)))

# Zapytanie SPARQL
query = """
    PREFIX ex: <http://example.org/animals#>
    SELECT ?bird ?name WHERE {
        ?bird a ex:Bird .
        OPTIONAL { ?bird ex:name ?name . }
    }
"""
for row in g.query(query):
    print(f"Ptak: {row.bird}, Nazwa: {row.name}")
```

---

## 8. Systemy regułowe (*Rule-Based Systems*)

### 8.1. Reguły produkcyjne (*Production Rules*)

Reguły produkcyjne mają postać **JEŚLI warunek TO akcja** (IF–THEN).

```python
# Prosty silnik reguł produkcyjnych
class ProductionSystem:
    def __init__(self):
        self.working_memory = set()
        self.rules = []

    def add_fact(self, fact):
        self.working_memory.add(fact)

    def add_rule(self, condition_fn, action_fn, name=""):
        self.rules.append((name, condition_fn, action_fn))

    def run(self, max_cycles=100):
        for cycle in range(max_cycles):
            fired = False
            for name, condition, action in self.rules:
                if condition(self.working_memory):
                    new_facts = action(self.working_memory)
                    if new_facts and new_facts not in self.working_memory:
                        self.working_memory.update(new_facts)
                        print(f"[Cykl {cycle}] Reguła '{name}' aktywowana")
                        fired = True
            if not fired:
                break   # osiągnięto punkt stały
        return self.working_memory


# Przykład użycia
ps = ProductionSystem()
ps.add_fact("ptak(tweety)")
ps.add_fact("nie_wyjątek(tweety)")

ps.add_rule(
    condition_fn=lambda wm: "ptak(tweety)" in wm and "nie_wyjątek(tweety)" in wm,
    action_fn=lambda wm: {"lata(tweety)"},
    name="Ptaki latają"
)

wynik = ps.run()
print(wynik)
```

### 8.2. Algorytm RETE

Algorytm RETE (Forgy, 1982) to efektywna metoda dopasowywania reguł do faktów w dużych systemach. Zamiast sprawdzać każdą regułę przy każdej zmianie, buduje sieć węzłów:

```
Węzły alfa → filtrowanie pojedynczych faktów
Węzły beta → łączenie warunków wieloelementowych
Terminal  → aktywacja reguły
```

Systemy oparte na RETE: **Jess**, **Drools**, **CLIPS**, **OpenCog**.

---

## 9. Grafy wiedzy (*Knowledge Graphs*)

### 9.1. Definicja i historia

Grafy wiedzy to duże grafowe bazy wiedzy, gdzie węzły to encje (osoby, miejsca, koncepcje), a krawędzie to relacje. Termin spopularyzował Google (2012), ale idea sięga wcześniejszych prac nad sieciami semantycznymi i Linked Data.

Największe grafy wiedzy:

| Graf wiedzy | Organizacja | Liczba trojek | Domena |
|---|---|---|---|
| Wikidata | Wikimedia | >13 mld | Ogólna |
| DBpedia | OpenKnowledge | ~3 mld | Wikipedia |
| Freebase | Google (arch.) | ~2.4 mld | Ogólna |
| Google KG | Google | nieznana | Ogólna + komerc. |
| YAGO | MPI | ~447 mln | Ogólna |
| Unified Medical Language System (UMLS) | NIH | ~15 mln | Medyczna |

### 9.2. Wnioskowanie w grafach wiedzy

Wnioskowanie w grafach wiedzy może być realizowane przez:

1. **Wnioskowanie symboliczne** — reguły logiczne, OWL reasoner
2. **Uzupełnianie grafów** (*link prediction*) — modele osadzające encje (TransE, RotatE, BERT-KGE)
3. **Wnioskowanie po ścieżkach** — algorytmy Path Ranking

```python
# Przykład prostego osadzenia grafów wiedzy (TransE - koncepcja)
import numpy as np

class TransE:
    """Uproszczona implementacja TransE dla grafów wiedzy."""

    def __init__(self, n_entities, n_relations, dim=50):
        self.entity_emb = np.random.randn(n_entities, dim) * 0.01
        self.relation_emb = np.random.randn(n_relations, dim) * 0.01

    def score(self, head_id, relation_id, tail_id):
        h = self.entity_emb[head_id]
        r = self.relation_emb[relation_id]
        t = self.entity_emb[tail_id]
        # niższa wartość = bardziej prawdopodobna trojka
        return -np.linalg.norm(h + r - t)
```

---

## 10. Reprezentacja wiedzy w warunkach niepewności

### 10.1. Sieci bayesowskie (*Bayesian Networks*)

Sieci bayesowskie kodują zależności warunkowe między zmiennymi losowymi jako skierowany acykliczny graf (DAG).

```
        Deszcz         Zraszacz
           │                │
           └────────┬───────┘
                    ▼
               Mokra trawa
```

```python
# Prosta sieć bayesowska
from pgmpy.models import BayesianNetwork
from pgmpy.factors.discrete import TabularCPD
from pgmpy.inference import VariableElimination

model = BayesianNetwork([('Deszcz', 'MokraTrawa'), ('Zraszacz', 'MokraTrawa')])

cpd_deszcz = TabularCPD('Deszcz', 2, [[0.8], [0.2]])
cpd_zraszacz = TabularCPD('Zraszacz', 2, [[0.9], [0.1]])
cpd_mokra = TabularCPD(
    'MokraTrawa', 2,
    [[0.99, 0.8, 0.9, 0.1],
     [0.01, 0.2, 0.1, 0.9]],
    evidence=['Deszcz', 'Zraszacz'],
    evidence_card=[2, 2]
)

model.add_cpds(cpd_deszcz, cpd_zraszacz, cpd_mokra)
infer = VariableElimination(model)
result = infer.query(['Deszcz'], evidence={'MokraTrawa': 1})
print(result)
```

### 10.2. Logika rozmyta (*Fuzzy Logic*)

Logika rozmyta (Zadeh, 1965) operuje wartościami prawdziwości z przedziału [0, 1], umożliwiając reprezentację nieprecyzyjnych pojęć.

```python
import numpy as np

def membership_temperatura_wysoka(temp):
    """Funkcja przynależności dla 'wysoka temperatura'."""
    if temp <= 35:
        return 0.0
    elif temp <= 38:
        return (temp - 35) / 3   # liniowy wzrost
    else:
        return 1.0

def membership_temperatura_niska(temp):
    if temp >= 37:
        return 0.0
    elif temp >= 34:
        return (37 - temp) / 3
    else:
        return 1.0

# T-normy i T-konormy (operacje na zbiorach rozmytych)
def fuzzy_and(a, b):
    return min(a, b)   # T-norma minimum

def fuzzy_or(a, b):
    return max(a, b)   # T-konorma maksimum
```

### 10.3. Teoria Dempstera-Shafera (*Dempster-Shafer Theory*)

Teoria Dempstera-Shafera (teoria funkcji wiary) pozwala modelować niewiedzę i sprzeczne dowody przez przypisanie mas prawdopodobieństwa podzbiorom przestrzeni hipotez.

```
Przestrzeń hipotez Θ = {A, B, C}
Masa m₁({A}) = 0.6,  m₁({B, C}) = 0.4
Masa m₂({B}) = 0.7,  m₂({A, C}) = 0.3
Kombinacja Dempstera: m₁⊕m₂ uwzględnia konflikty hipotez
```

---

## 11. Common Sense Reasoning i projekt CYC

Zdrowy rozsądek (*common sense*) to wiedza, którą ludzie uznają za oczywistą — i która jest niezwykle trudna do sformalizowania.

Projekt **CYC** (Lenat, 1984-) to wielodekadowy wysiłek zakodowania zdroworozsądkowej wiedzy o świecie. Zawiera ponad 25 milionów aksjomatów w języku CycL, obejmujących:

- Fizykę potoczną (*naive physics*): obiekty zajmują miejsca, rzeczy spadają
- Psychologię potoczną: ludzie mają przekonania i pragnienia
- Biologię potoczną: organizmy potrzebują pożywienia

**Ograniczenia CYC**: ogromny koszt ręcznego kodowania, problemy ze skalowalnością, trudność uchwycenia kontekstu. Nowsze podejścia (GPT, LLM) uczą się zdroworozsądkowej wiedzy ze statystyk tekstu.

---

## 12. Logiczne programowanie i Prolog

Prolog (*Programming in Logic*) implementuje backward chaining w FOL. Jest stosowany w systemach eksperckich, przetwarzaniu języka naturalnego i grach.

```prolog
% Baza wiedzy o rodzinie
rodzic(jan, maria).
rodzic(jan, tomasz).
rodzic(maria, anna).

% Reguły wnioskowania
dziadek(X, Z) :- rodzic(X, Y), rodzic(Y, Z).
przodek(X, Y) :- rodzic(X, Y).
przodek(X, Y) :- rodzic(X, Z), przodek(Z, Y).

% Zapytania:
% ?- dziadek(jan, anna). → true
% ?- przodek(jan, Who). → Who = maria ; Who = tomasz ; Who = anna
```

---

## 13. Zastosowania w mobilnym AI

### 13.1. Asystenci głosowi

Systemy takie jak Siri, Google Assistant i Alexa opierają się na grafach wiedzy i systemach regułowych:

- **Rozpoznawanie intencji** (*intent recognition*): NLP + KR
- **Wypełnianie slotów** (*slot filling*): wiedza domenowa
- **Dialog management**: sieci bayesowskie + reguły

### 13.2. Systemy rekomendacji

Grafy wiedzy wzbogacają systemy rekomendacji o kontekst semantyczny:

```
Użytkownik → lubi → Film_A
Film_A → gatunek → Thriller
Film_B → gatunek → Thriller
Film_B → reżyser → Kubrick
Użytkownik ← polub? ← Film_B    (wnioskowanie przez ścieżkę)
```

### 13.3. Silniki reguł w aplikacjach mobilnych

Lekkie silniki reguł mogą działać bezpośrednio na urządzeniu mobilnym:

```python
# Micro rule engine dla mobilnej aplikacji zdrowotnej
class HealthRuleEngine:
    def __init__(self):
        self.rules = []

    def rule(self, condition):
        def decorator(fn):
            self.rules.append((condition, fn))
            return fn
        return decorator

    def evaluate(self, data):
        recommendations = []
        for condition, action in self.rules:
            if condition(data):
                recommendations.append(action(data))
        return recommendations


engine = HealthRuleEngine()

@engine.rule(lambda d: d.get("steps_today", 0) < 5000)
def low_activity_alert(data):
    return "Zwiększ aktywność fizyczną — cel: 10 000 kroków dziennie"

@engine.rule(lambda d: d.get("heart_rate", 0) > 100 and d.get("resting", True))
def elevated_hr_alert(data):
    return "Podwyższone tętno spoczynkowe — skonsultuj się z lekarzem"

user_data = {"steps_today": 3200, "heart_rate": 105, "resting": True}
print(engine.evaluate(user_data))
```

---

## 14. Porównanie formalizmów KR

| Formalizm | Wyrażalność | Złożoność wnioskowania | Obsługa niepewności | Przykłady |
|---|---|---|---|---|
| Logika zerowego rzędu | Niska | P-zupełna | Nie | Systemy boolowskie |
| Logika pierwszego rzędu | Wysoka | Semidecidable | Nie | Prolog, Cyc |
| Logika opisowa (OWL DL) | Średnia | EXPTIME | Nie | Protégé, HermiT |
| Sieci semantyczne | Niska-średnia | Polynomial | Nie | WordNet |
| Reguły produkcyjne | Średnia | Polynomial (RETE) | Częściowo | Drools, CLIPS |
| Sieci bayesowskie | Średnia | NP-trudna | Tak (prob.) | pgmpy, Hugin |
| Logika rozmyta | Średnia | Polynomial | Tak (rozmyte) | FuzzyLite |
| Grafy wiedzy | Wysoka | Varies | Częściowo | Wikidata, UMLS |

---

## 15. Narzędzia i biblioteki

| Narzędzie | Język | Zastosowanie |
|---|---|---|
| rdflib | Python | RDF, SPARQL, OWL |
| owlready2 | Python | OWL ontologie |
| Protégé | Java (GUI) | Edytor ontologii |
| HermiT / Pellet | Java | OWL reasoner |
| SWI-Prolog | Prolog | Logika, NLP |
| Drools | Java | Silnik reguł |
| pgmpy | Python | Sieci bayesowskie |
| FuzzyLite | C++/Python | Logika rozmyta |

---

## 16. Podsumowanie

Reprezentacja wiedzy i wnioskowanie pozostają aktywnym obszarem badań, łączącym klasyczną AI z nowoczesnymi technikami uczenia maszynowego. Podejścia symboliczne (logika, ontologie, reguły) zapewniają interpretowalność i możliwość wnioskowania na bazie ograniczonej wiedzy, podczas gdy metody neuronowe (LLM, GNN) oferują skalowalność i uczenie z danych. Przyszłość leży w systemach neurosymbolicznych (*neuro-symbolic AI*), które łączą oba paradygmaty.

## Literatura

1. Russell, S., & Norvig, P. (2021). *Artificial Intelligence: A Modern Approach* (4th ed.). Pearson.
2. Brachman, R. J., & Levesque, H. J. (2004). *Knowledge Representation and Reasoning*. Elsevier.
3. Horrocks, I., Patel-Schneider, P. F., & van Harmelen, F. (2003). From SHIQ and RDF to OWL. *Journal of Web Semantics*, 1(1).
4. Lenat, D. B. (1995). CYC: A large-scale investment in knowledge infrastructure. *CACM*, 38(11).
5. Zadeh, L. A. (1965). Fuzzy sets. *Information and Control*, 8(3), 338–353.
6. Forgy, C. L. (1982). RETE: A fast algorithm for the many pattern/many object pattern match problem. *AI*, 19(1).
7. Nickel, M., Murphy, K., Tresp, V., & Gabrilovich, E. (2016). A review of relational machine learning for knowledge graphs. *Proc. IEEE*.

## Powiązane artykuły

- [Inteligentny agent](intelligent-agent.md)
- [Oprogramowanie agentowe](software-agent.md)
- [Modele kognitywne](cognitive-models.md)
- [Architektura SOAR](soar-architecture.md)
- [Architektura ACT-R](actr-architecture.md)
- [Robotyka kognitywna](cognitive-robotics.md)
- [Obliczeniowe modelowanie poznania](computational-cognition.md)
