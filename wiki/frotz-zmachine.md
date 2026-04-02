# A Portable Z-Machine Interpreter — Frotz

## 1. Czym jest Frotz i skąd się wziął?

**Frotz** to otwartoźródłowy interpreter maszyny wirtualnej **Z-machine**, zaprojektowanej pierwotnie przez firmę **Infocom** do uruchamiania tekstowych gier przygodowych (Interactive Fiction, IF), takich jak *Zork*, *Planetfall* czy *The Hitchhiker’s Guide to the Galaxy*. Nazwa „A Portable Z-Machine Interpreter” podkreśla dwa kluczowe cele projektu:

1. **Portable** — przenośność pomiędzy systemami i architekturami.
2. **Z-Machine Interpreter** — wierna interpretacja plików historii (`.z3`, `.z5`, `.z8` itd.).

W praktyce Frotz stał się jednym z najważniejszych narzędzi ekosystemu IF, ponieważ:

- działa na wielu platformach (desktop, terminal, urządzenia mobilne, środowiska embedded),
- wspiera klasyczne tytuły Infocomu i tysiące nowszych gier tworzonych przez społeczność,
- stanowi punkt odniesienia do zgodności z formatem Z-machine.

---

## 2. Z-machine w skrócie: dlaczego to było przełomowe?

Zanim pojawiły się współczesne silniki game-dev, Infocom rozwiązał problem przenośności przez **separację gry od platformy**:

- gra była dystrybuowana jako plik „story file” (bytecode),
- interpreter (np. Frotz) wykonywał bytecode na danej maszynie.

To przypomina model „program + VM”, znany dziś z JVM, WebAssembly czy .NET.

### Co to dawało?

- jedno źródło gry, wiele platform,
- mniejsze koszty portowania,
- dłuższe życie oprogramowania (gry z lat 80. działają do dziś).

### Wersje Z-machine

Najczęściej spotkane są wersje:

- **v1–v3**: najstarsze, ograniczone zasoby,
- **v4–v5**: bogatsze możliwości (m.in. ekran i wejście),
- **v8**: rozszerzone limity pamięci i większe gry.

Frotz jest szczególnie często używany z plikami `z3`, `z5` i `z8`.

---

## 3. Architektura Frotz

## 3.1 Warstwa rdzenia

Rdzeń interpretera odpowiada za:

- dekodowanie instrukcji Z-machine,
- zarządzanie pamięcią dynamiczną i statyczną,
- stos wywołań i ramki lokalnych zmiennych,
- obsługę obiektów, słownika parsera i tokenizacji wejścia,
- mechanizm zapisu/odczytu stanu gry (save/restore).

To właśnie ta część decyduje o **zgodności semantycznej** z oryginalnym środowiskiem Infocomu.

## 3.2 Warstwa I/O (porty)

Nad rdzeniem istnieje warstwa zależna od platformy, która realizuje:

- prezentację tekstu,
- odczyt klawiatury/ekranu dotykowego,
- mapowanie kolorów i atrybutów,
- obsługę plików lokalnych i ścieżek.

Dzięki temu sam rdzeń może być wspólny, a implementacja „opakowania” może być dostosowana do:

- terminala (curses),
- GUI desktopowego,
- aplikacji mobilnej,
- web wrappera.

## 3.3 Kluczowe warianty Frotz

W praktyce funkcjonuje kilka odmian:

- **dumb-frotz** — wersja minimalna, zwykle bez zaawansowanego formatowania,
- **frotz curses/terminal** — klasyczne uruchamianie w terminalu,
- **pFrotz / porty mobilne** — adaptacje pod Androida, iOS i inne systemy.

---

## 4. Model wykonania gry w Z-machine

Gdy uruchamiasz:

```bash
frotz gra.z5
```

interpreter wykonuje sekwencję kroków:

1. Wczytuje nagłówek story file i sprawdza wersję maszyny.
2. Konfiguruje parametry środowiska (wymiary, możliwości I/O, flagi).
3. Inicjalizuje pamięć dynamiczną oraz licznik instrukcji (PC).
4. Rozpoczyna pętlę fetch-decode-execute.
5. Dla instrukcji wejścia/wyjścia deleguje operacje do warstwy platformowej.

Z punktu widzenia inżynierii oprogramowania jest to pełnoprawna implementacja VM z parserem, runtime’em i emulacją peryferiów logicznych.

---

## 5. Frotz a parser języka naturalnego

W klasycznych grach IF użytkownik wpisuje komendy w stylu:

- `open mailbox`
- `take lamp`
- `go north`

Parser w Z-machine (obsługiwany przez interpreter) używa:

- **słownika** osadzonego w pliku gry,
- tokenizacji wejścia,
- reguł gramatycznych i mapowania na akcje świata gry.

To nie jest „pełny NLP”, ale bardzo skuteczny, deterministyczny system poleceń domenowych. W zastosowaniach edukacyjnych świetnie ilustruje różnicę między:

- formalnym parserem gramatyki,
- a nowoczesnymi modelami statystycznymi NLP.

---

## 6. Zapis stanu gry i reprodukowalność

Jedną z bardzo ważnych cech Frotz jest wsparcie dla `save/restore`.

### Korzyści dydaktyczne i inżynierskie

- możliwość tworzenia „punktów kontrolnych” scenariusza,
- łatwe odtwarzanie błędów podczas testów,
- porównywanie zachowania różnych portów interpretera.

W środowiskach laboratoryjnych można wykorzystywać zapis stanu jako odpowiednik snapshotu testowego.

---

## 7. Zastosowania Frotz w projektach mobilnych

Choć Frotz kojarzy się z retro-gamingiem, ma praktyczne zastosowania także dziś:

### 7.1 Minimalistyczne gry mobilne

- niski próg wejścia dla tworzenia gry tekstowej,
- bardzo małe zużycie zasobów,
- dobre działanie na słabszych urządzeniach.

### 7.2 Edukacja (algorytmika i UX tekstowy)

- ćwiczenie projektowania świata gry i parsera poleceń,
- nauka projektowania interfejsu konwersacyjnego,
- analiza modelu stanów i przejść.

### 7.3 Dostępność

Interfejs tekstowy może być korzystny dla:

- użytkowników czytników ekranu,
- scenariuszy low-vision (przy poprawnym doborze kontrastu i fontu),
- zastosowań „offline-first”.

---

## 8. Integracja z Android/iOS — praktyczny workflow

## 8.1 Android

Typowy wariant:

1. Osadzenie rdzenia C (np. przez NDK/JNI) albo użycie gotowego portu.
2. Warstwa Kotlin/Compose odpowiada za:
   - ekran terminala,
   - wirtualną klawiaturę skrótów,
   - zarządzanie plikami `.z*` i save’ami.
3. Delegacja wejścia/wyjścia do native bridge.

### Rekomendacje UX

- stała czcionka mono,
- szybkie akcje (`look`, `inventory`, `save`, `restore`),
- historia komend i autouzupełnianie.

## 8.2 iOS

Analogicznie:

- warstwa SwiftUI + ewentualny mostek do C,
- sandbox plików na story files i stany gry,
- dostępność VoiceOver jako element projektu.

---

## 9. Kompatybilność, pułapki i ograniczenia

Przy pracy z Frotz warto pamiętać o kilku punktach:

1. **Różnice portów** — nie każdy port ma identyczne wsparcie kolorów/ekranu.
2. **Kodowanie znaków** — starsze gry mogą mieć ograniczenia znaków narodowych.
3. **Ścieżki zapisu** — mobilne sandboxy wymagają jawnej obsługi katalogów aplikacji.
4. **Interakcja dotykowa** — parser był projektowany pod klawiaturę, trzeba dodać ergonomiczne skróty.
5. **Licencje gier** — interpreter jest osobny od praw autorskich do story files.

---

## 10. Frotz vs Glulx/Quixe i nowoczesne rozwiązania IF

Współczesna scena IF korzysta też z innych VM i interpreterów (np. Glulx). Frotz pozostaje jednak kluczowy, gdy:

- celem jest uruchamianie klasycznych gier Z-machine,
- potrzebna jest wysoka stabilność i dojrzałość kodu,
- zależy nam na lekkim, terminalowym runtime.

Dla większych, nowocześniejszych gier IF często wybierane są inne środowiska, ale Frotz nadal jest „złotym standardem” dla ekosystemu Z-machine.

---

## 11. Jak zacząć — mini checklista laboratoryjna

1. Pobierz interpreter Frotz dla swojej platformy.
2. Przygotuj legalny story file (`.z3/.z5/.z8`).
3. Uruchom grę i sprawdź podstawowe komendy (`look`, `inventory`, `save`).
4. Przetestuj zapis i odtworzenie stanu.
5. Oceń UX na urządzeniu mobilnym:
   - czytelność fontu,
   - kontrast,
   - szybkość wpisywania komend,
   - wygodę nawigacji po historii.

---

## 12. Podsumowanie

**Frotz** to nie tylko „retro interpreter”, ale też świetny materiał inżynierski do nauki:

- architektury VM,
- przenośności oprogramowania,
- projektowania interfejsów tekstowych,
- testowalności systemów opartych o stan.

W kontekście aplikacji mobilnych Frotz pokazuje, że nawet bardzo stare koncepcje (bytecode + interpreter) pozostają aktualne i praktyczne — szczególnie tam, gdzie liczy się prostota, niezawodność i niskie zużycie zasobów.
