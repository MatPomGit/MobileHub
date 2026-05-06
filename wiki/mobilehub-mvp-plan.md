# MobileHub MVP — plan wdrożenia (4 tygodnie)

## Cel

Dokument opisuje zestaw zadań wdrożeniowych dla MobileHub, aby serwis pełnił trzy role:

1. baza wiedzy,
2. warsztat szybkiego prototypowania,
3. miejsce diagnozowania problemów.

Zakres obejmuje MVP na 4 tygodnie z podziałem na epiki, zadania, kryteria akceptacji i mierniki sukcesu.

---

## Zakres MVP (Must Have)

- Roadmapy nauki + pasek postępu.
- Szablony projektów startowych (Lab Starter Kit).
- Baza debugowania i najczęstszych błędów.
- Zadania projektowe z półautomatyczną oceną.
- Sekcja Good vs Bad Practice.

---

## Sprint 0 (2–3 dni) — przygotowanie

### Zadania

- Zdefiniować persony: student początkujący, student zaawansowany, prowadzący.
- Ustalić metryki sukcesu MVP.
- Przygotować makiety low-fi: dashboard, widok zadania, debug hub.
- Ustalić Definition of Done.

### Kryteria akceptacji

- Istnieje dokument zakresu MVP i KPI.
- Każda funkcja ma kryteria akceptacji oraz scenariusz testowy.

---

## Tydzień 1 — Roadmapy i postęp

### Epic A: Ścieżki nauki

#### Zadania

- Zaimplementować model: ścieżka -> moduł -> lekcja -> checkpoint.
- Dodać statusy: nie rozpoczęto / w trakcie / ukończono.
- Dodać pasek postępu per moduł i dla całej ścieżki.
- Dodać zależności odblokowujące kolejne moduły.
- Dodać etykiety trudności i czasu nauki.

#### Kryteria akceptacji

- Student widzi minimum 2 ścieżki (Android i Flutter).
- Postęp aktualizuje się po ukończeniu lekcji.
- Widoczny jest przewidywany czas nauki.

---

## Tydzień 2 — Lab Starter Kit + Good vs Bad

### Epic B: Lab Starter Kit

#### Zadania

- Przygotować repozytorium template'ów.
- Dostarczyć 3 szablony: auth, API+lista+cache, local DB.
- Do każdego szablonu dodać README krok po kroku.
- Dodać wersjonowanie template'ów (wersja + data).

#### Kryteria akceptacji

- Student pobiera i uruchamia template zgodnie z README.
- Każdy template zawiera checklistę startową.

### Epic C: Good vs Bad Practice

#### Zadania

- Utworzyć format wpisu porównawczego.
- Dodać minimum 5 wpisów startowych.
- Dodać tagi i filtrowanie.

#### Kryteria akceptacji

- Student filtruje wpisy po temacie i technologii.
- Każdy wpis zawiera co najmniej 1 antywzorzec i konsekwencje.

---

## Tydzień 3 — Debug Hub

### Epic D: Interaktywne debugowanie

#### Zadania

- Dodać katalog błędów: objaw, przyczyna, rozwiązanie, prewencja.
- Zaimplementować wyszukiwarkę po komunikacie błędu.
- Dodać checklisty diagnostyczne dla typowych awarii.
- Powiązać wpisy błędów z lekcjami roadmapy.

#### Kryteria akceptacji

- Wyszukiwarka zwraca wynik po fragmencie komunikatu.
- Każdy wpis zawiera sekcję „jak zapobiec”.

---

## Tydzień 4 — Assignments i ocena

### Epic E: Zadania projektowe z feedbackiem

#### Zadania

- Dodać model zadania: opis, wymagania, deadline, rubryka.
- Dodać panel oddawania projektu (link do repo + opis decyzji).
- Dodać półautomatyczną checklistę oceny.
- Dodać rubrykę punktową i feedback iteracyjny (wersja 2).

#### Kryteria akceptacji

- Student oddaje projekt i otrzymuje wynik + komentarz.
- Prowadzący ocenia zadanie na podstawie rubryki.

---

## User stories (przykładowe)

- Jako student chcę widzieć roadmapę modułów, aby planować naukę.
- Jako student chcę pobrać template, aby szybciej rozpocząć projekt.
- Jako student chcę wyszukiwać błędy po stack trace, aby skrócić czas blokady.
- Jako prowadzący chcę używać rubryki, aby oceniać spójnie i szybciej.

---

## Priorytety MoSCoW

### Must Have

- Roadmapy + postęp,
- 3 template'y,
- baza 30 najczęstszych błędów,
- 2 zadania projektowe z rubryką,
- 5 wpisów Good vs Bad.

### Should Have

- Zaawansowane filtrowanie treści,
- komentarze prowadzącego,
- historia prób oddania.

### Could Have

- Gamifikacja,
- rekomendacje AI,
- dashboard produktywności.

### Won't Have (na MVP)

- pełna automatyczna analiza kodu dla wszystkich języków,
- live coding w przeglądarce.

---

## Definition of Done

Element uznajemy za gotowy, jeżeli:

- ma kryteria akceptacji,
- przeszedł test scenariusza studenta i prowadzącego,
- zawiera instrukcję użycia,
- posiada wersję i datę aktualizacji,
- (dla treści edukacyjnych) zawiera przykład dobrej i złej praktyki.

---

## Mierzenie efektu po MVP (2 tygodnie)

- Spadek czasu „utknięcia” na błędzie.
- Wzrost przejścia studentów z modułu 1 do 2.
- Skrócenie czasu od startu projektu do działającego prototypu.
- Satysfakcja studentów (ankieta 1–5).
