# Skill: coding-and-description

## Cel
Ten skill definiuje jednolity standard pracy dla agentów AI (w tym Codex) przy tworzeniu kodu oraz tekstów opisowych (README, PR, dokumentacja, raporty i artykuły naukowe).

## Zakres zastosowania
Używaj tego skilla, gdy:
- tworzysz lub modyfikujesz kod źródłowy,
- tworzysz opisy zmian, dokumentację techniczną lub instrukcje użytkownika,
- przygotowujesz podsumowania prac, changelogi i opisy PR,
- redagujesz treści w formie artykułów naukowych lub raportów R&D.

## Tryb wieloagentowy (multi-agent)
### Cel trybu
Zapewnić, że wielu agentów pracuje spójnie, bez dublowania pracy i z pełną ścieżką odpowiedzialności.

### Role agentów
- **Agent Planner**
  - analizuje wymagania,
  - dzieli zadanie na kroki,
  - przydziela odpowiedzialności agentom wykonawczym.
- **Agent Implementer**
  - implementuje kod zgodnie z planem,
  - dodaje komentarze po polsku i utrzymuje nazewnictwo kodu po angielsku.
- **Agent Reviewer**
  - sprawdza jakość kodu, zgodność ze standardami i ryzyka,
  - weryfikuje poprawność techniczną opisów.
- **Agent Documenter**
  - przygotowuje dokumentację techniczną,
  - redaguje opisy PR i sekcje do publikacji naukowych.
- **Agent Validator**
  - uruchamia testy i kontrole jakości,
  - raportuje wyniki wraz z jasnym statusem pass/fail.

### Kontrakt współpracy między agentami
1. Każdy agent musi rozpocząć pracę od krótkiego streszczenia wejścia (1-3 zdania).
2. Każdy agent musi przekazać wynik w formacie:
   - **Input**
   - **Decyzje**
   - **Output**
   - **Ryzyka/Ograniczenia**
3. Nie wolno nadpisywać pracy innego agenta bez wskazania zakresu zmiany.
4. Każda decyzja architektoniczna musi zawierać uzasadnienie i kompromisy (trade-offs).
5. Finalny artefakt musi mieć wskazanego właściciela odpowiedzialnego za publikację.

### Protokół przekazania pracy (handoff)
Przekazanie między agentami musi zawierać:
- identyfikator zadania,
- aktualny stan realizacji (%),
- listę ukończonych kroków,
- listę kroków otwartych,
- zależności i blokery,
- checklistę jakości.

## Zasady ogólne
1. **Priorytet poprawności:** najpierw poprawność logiczna i bezpieczeństwo, potem optymalizacja.
2. **Czytelność ponad spryt:** preferuj proste, zrozumiałe rozwiązania.
3. **Spójność projektu:** dopasuj styl do istniejącego kodu i konwencji repozytorium.
4. **Małe, atomowe zmiany:** unikaj mieszania refaktoryzacji z nową funkcjonalnością bez potrzeby.
5. **Jasna komunikacja:** każda istotna decyzja powinna mieć krótkie uzasadnienie.

## Standardy pisania kodu
- Kod programu pisz w języku **angielskim** (nazwy funkcji, klas, zmiennych).
- Komentarze w kodzie pisz po **polsku**.
- Każda nowa funkcja/metoda powinna mieć komentarz wyjaśniający:
  - co robi,
  - jakie ma parametry,
  - co zwraca,
  - jakie są przypadki brzegowe.
- Stosuj pojedynczą odpowiedzialność (SRP) dla funkcji i modułów.
- Unikaj duplikacji (DRY), ale nie kosztem czytelności.
- Waliduj dane wejściowe i obsługuj błędy jawnie.
- Dodawaj bezpieczne wartości domyślne.
- Unikaj „magic numbers” – używaj nazwanych stałych.
- Pisz kod testowalny: zależności przekazuj jawnie, unikaj ukrytego stanu globalnego.

## Standardy jakości
Przed zakończeniem zadania wykonaj checklistę:
1. Czy kod się buduje/uruchamia?
2. Czy testy przechodzą?
3. Czy nowa logika ma testy (jednostkowe/integracyjne, jeśli zasadne)?
4. Czy komentarze i nazwy są zrozumiałe?
5. Czy nie ma oczywistych problemów bezpieczeństwa (np. brak walidacji wejścia)?
6. Czy zmiana jest minimalna i adekwatna do wymagania?

## Zasady tworzenia opisów technicznych
- Opisy pisz po **polsku**, językiem precyzyjnym i zwięzłym.
- Preferuj strukturę:
  1. **Cel**
  2. **Zakres zmian**
  3. **Szczegóły techniczne**
  4. **Wpływ na użytkownika/system**
  5. **Testy i weryfikacja**
  6. **Ryzyka i ograniczenia**
- Unikaj ogólników typu „poprawiono błędy” bez wskazania jakie.
- Przy zmianach API podawaj przykłady użycia przed/po.
- Przy decyzjach architektonicznych zapisuj kompromisy (trade-offs).

## Zasady pisania opisów do artykułów naukowych
### Cel sekcji naukowej
Zapewnić reprodukowalność, jednoznaczność i poprawność metodologiczną opisu.

### Obowiązkowa struktura opisu naukowego
1. **Tytuł roboczy** – jednoznacznie wskazuje problem i zakres.
2. **Abstrakt (150-250 słów)**
   - kontekst,
   - problem,
   - metoda,
   - wynik,
   - wkład pracy.
3. **Słowa kluczowe** – 4 do 8 terminów dziedzinowych.
4. **Wprowadzenie**
   - motywacja,
   - luka badawcza,
   - cel i pytania badawcze.
5. **Metodyka**
   - dane wejściowe,
   - środowisko eksperymentalne,
   - metryki,
   - procedura krok po kroku.
6. **Wyniki**
   - wyniki liczbowe,
   - porównanie z baseline,
   - analiza statystyczna (jeśli dotyczy).
7. **Dyskusja**
   - interpretacja wyników,
   - ograniczenia,
   - zagrożenia dla trafności (threats to validity).
8. **Wnioski i dalsze prace**
   - najważniejsze obserwacje,
   - kierunki rozwoju.
9. **Bibliografia**
   - spójny styl cytowań (np. IEEE/APA),
   - tylko źródła zweryfikowane.

### Reguły jakości dla treści naukowych
- Rozróżniaj **fakty**, **hipotezy** i **opinie**.
- Nie ukrywaj negatywnych wyników eksperymentów.
- Podawaj parametry eksperymentu tak, by inny zespół mógł odtworzyć badanie.
- Definiuj wszystkie skróty przy pierwszym użyciu.
- Każde twierdzenie ilościowe powinno mieć źródło (tabela, wykres, cytowanie).
- Unikaj języka marketingowego; stosuj język neutralny i techniczny.

### Szablon krótkiego opisu wkładu naukowego
```md
## Wkład pracy
1. Przedstawiono [metodę/system], który rozwiązuje [problem].
2. Opracowano procedurę eksperymentalną umożliwiającą reprodukcję wyników.
3. Wykazano poprawę metryk [A, B, C] względem baseline [X] o [wartość].
```

## Szablon opisu Pull Request
```md
## Cel
Krótko opisz problem biznesowy/techniczny.

## Co zostało zmienione
- Punkt 1
- Punkt 2
- Punkt 3

## Szczegóły implementacyjne
- Najważniejsze decyzje i uzasadnienie.
- Informacja o kompatybilności wstecznej.

## Testy
- [ ] Testy jednostkowe
- [ ] Testy integracyjne
- [ ] Test manualny (scenariusz)

## Ryzyka
- Potencjalne skutki uboczne i plan rollback.
```

## Antywzorce (czego unikać)
- Zbyt długie funkcje robiące wiele rzeczy naraz.
- Niejawne efekty uboczne.
- Komentarze niezgodne z kodem.
- Zmienianie stylu całego pliku bez potrzeby.
- Brak testów dla krytycznej logiki.
- W publikacjach: brak metodyki, brak źródeł, pomijanie ograniczeń.

## Definicja ukończenia (Definition of Done)
Zadanie jest ukończone, gdy:
- wymagania użytkownika są spełnione,
- kod i komentarze są spójne językowo (kod EN, komentarze/opisy PL),
- weryfikacja (testy/lint/build) została wykonana,
- opis zmian jest kompletny i zrozumiały,
- w trybie wieloagentowym: przekazanie (handoff) i odpowiedzialności zostały jawnie udokumentowane,
- dla treści naukowych: sekcje obowiązkowe i kryteria reprodukowalności są spełnione.
