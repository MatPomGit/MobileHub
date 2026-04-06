# Ergonomia użytkowania w aplikacjach mobilnych

Ergonomia użytkowania opisuje, jak dobrze interfejs dopasowuje się do fizycznych i poznawczych możliwości człowieka. W mobile nie projektujemy dla idealnych warunków biurkowych, ale dla użytkownika stojącego w autobusie, idącego chodnikiem, trzymającego telefon jedną ręką, korzystającego ze słabego zasięgu albo walczącego z refleksami słońca na ekranie. Dlatego ergonomia jest praktycznym mostem między UX, dostępnością i wydajnością działania aplikacji.

## Dlaczego ergonomia ma znaczenie

Dobrze zaprojektowana ergonomia:

- zmniejsza liczbę błędnych tapnięć,
- skraca czas wykonania zadania,
- obniża obciążenie poznawcze,
- poprawia komfort obsługi jedną ręką,
- zwiększa bezpieczeństwo korzystania z aplikacji w ruchu,
- poprawia retencję, bo aplikacja „nie męczy”.

Zła ergonomia zwykle nie objawia się jednym spektakularnym błędem. Częściej składa się z wielu drobnych frustracji: za małych przycisków, zbyt gęstych formularzy, CTA umieszczonego poza zasięgiem kciuka, nieczytelnych komunikatów i opóźnionego feedbacku.

## Kontekst mobilny a projektowanie

Projektując aplikację mobilną, trzeba uwzględniać warunki użycia, które rzadko występują na desktopie:

| Czynnik | Konsekwencja projektowa |
|---|---|
| Jedna ręka | kluczowe akcje powinny być łatwo osiągalne kciukiem |
| Ruch użytkownika | interakcje muszą być proste i odporne na pomyłki |
| Krótkie sesje | użytkownik powinien szybko wracać do najważniejszych zadań |
| Mały ekran | hierarchia informacji musi być bardzo czytelna |
| Jasne otoczenie | wysoki kontrast i czytelna typografia są krytyczne |
| Rozproszenia | system powinien wyraźnie pokazywać stan, postęp i wynik akcji |

## Strefy kciuka i obsługa jedną ręką

Jednym z podstawowych zagadnień ergonomii mobile jest zasięg kciuka. Na dużych ekranach górne narożniki są trudniej dostępne, szczególnie przy obsłudze jedną ręką. Z tego powodu:

- główne akcje warto lokować w dolnej części ekranu,
- elementy często używane powinny być w centralnej i dolnej strefie,
- akcje ryzykowne nie powinny znajdować się zbyt blisko gestów systemowych,
- rzadkie akcje drugorzędne można przenieść wyżej lub schować do menu.

Praktyczny przykład:

- **dobrze**: dolny pasek nawigacji, FAB, CTA „Zapisz” nad klawiaturą,
- **źle**: najważniejszy przycisk w prawym górnym rogu na dużym telefonie.

## Rozmiary celów dotykowych

Palec nie jest precyzyjnym kursorem. Nawet jeśli element wygląda dobrze wizualnie, może być ergonomicznie zbyt mały.

### Zalecenia praktyczne

- minimum **48 × 48 dp** dla celu dotykowego w Androidzie,
- zachowanie odstępu między sąsiednimi akcjami,
- zwiększanie aktywnego obszaru małych ikon,
- unikanie grupowania wielu destrukcyjnych akcji obok siebie.

```kotlin
IconButton(
    onClick = onDelete,
    modifier = Modifier.size(48.dp)
) {
    Icon(Icons.Default.Delete, contentDescription = "Usuń")
}
```

Warto pamiętać, że widoczny element i rzeczywisty obszar klikalny nie muszą być identyczne. Mała ikona może mieć większy hitbox niż sama grafika.

## Czytelność i obciążenie poznawcze

Ergonomia to nie tylko dłoń i ruch palca, ale też wysiłek mentalny potrzebny do zrozumienia ekranu. Interfejs powinien ograniczać liczbę decyzji, które użytkownik musi podejmować jednocześnie.

### Jak zmniejszać obciążenie poznawcze

- pokazuj tylko informacje potrzebne na danym etapie,
- grupuj elementy logicznie,
- stosuj jedno dominujące CTA na ekran,
- używaj prostych etykiet działań,
- zachowuj spójne wzorce między ekranami,
- nie zmuszaj użytkownika do pamiętania informacji z poprzedniego kroku.

Zamiast pięciu równorzędnych przycisków akcji lepiej zastosować jeden główny przycisk i akcje poboczne w menu overflow.

## Formularze zaprojektowane ergonomicznie

Formularze są jednym z najczęstszych źródeł frustracji. Ergonomiczny formularz mobilny powinien minimalizować pisanie, przewidywać błędy i wspierać szybkie przejście do celu.

### Dobre praktyki

- ogranicz liczbę pól do minimum,
- używaj właściwych typów klawiatury (`email`, `phone`, `number`),
- włącz autofill i autouzupełnianie,
- pokazuj walidację blisko pola i możliwie wcześnie,
- stosuj sensowną kolejność fokusów i przycisk `Next`,
- po otwarciu klawiatury nie zasłaniaj głównej akcji.

```kotlin
OutlinedTextField(
    value = email,
    onValueChange = { email = it },
    label = { Text("Adres e-mail") },
    keyboardOptions = KeyboardOptions(
        keyboardType = KeyboardType.Email,
        imeAction = ImeAction.Next
    )
)
```

### Czego unikać

- placeholdera jako jedynej etykiety,
- kasowania wpisanej treści po błędzie,
- formularzy rozciągniętych na wiele ekranów bez wskaźnika postępu,
- automatycznego zamykania klawiatury po każdym polu,
- wymuszania bardzo precyzyjnych selektorów daty lub czasu bez alternatywy.

## Feedback i poczucie kontroli

Ergonomiczna aplikacja szybko komunikuje skutek działania. Użytkownik nie powinien zastanawiać się, czy dotknięcie zostało zarejestrowane, czy dane się zapisały i czy system nadal pracuje.

### Ergonomiczny feedback powinien być:

- **natychmiastowy** — reakcja po tapnięciu jest widoczna od razu,
- **czytelny** — komunikat nie może być niejednoznaczny,
- **proporcjonalny** — drobna akcja nie wymaga ciężkiego modala,
- **odwracalny** — tam gdzie to możliwe, daj opcję cofnięcia.

Przykłady:

- ripple i zmiana stanu przycisku po dotknięciu,
- snackbar „Usunięto notatkę” z akcją „Cofnij”,
- skeleton loading zamiast pustego białego ekranu,
- progress indicator przy operacjach trwających dłużej niż około 300–500 ms.

## Błędy projektowe pogarszające ergonomię

Najczęstsze problemy ergonomiczne w aplikacjach mobilnych:

1. **Zbyt małe elementy klikalne**.
2. **Przeładowanie ekranu** nadmiarem opcji i kart.
3. **Brak hierarchii wizualnej**, przez co użytkownik nie wie, gdzie patrzeć.
4. **Ukrywanie kluczowych akcji** pod nieoczywistymi gestami.
5. **Brak miejsca na obsługę błędu**, np. formularz bez jasnego komunikatu.
6. **Nieprzewidywalne przesunięcia layoutu** podczas ładowania danych.
7. **Ignorowanie safe areas**, klawiatury ekranowej i gestów systemowych.
8. **Nadużywanie modali**, które przerywają przepływ zadania.

## Ergonomia a dostępność

Ergonomia i dostępność częściowo się pokrywają, ale nie są tym samym. Ergonomia koncentruje się na komforcie i efektywności użycia, a dostępność na zapewnieniu obsługi użytkownikom o różnych potrzebach. W praktyce wiele dobrych decyzji poprawia oba obszary jednocześnie:

- większe cele dotykowe,
- lepszy kontrast,
- prostszy język,
- przewidywalna nawigacja,
- alternatywy dla złożonych gestów,
- wyraźne komunikaty o stanie i błędach.

Można więc traktować ergonomię jako codzienny, praktyczny filtr projektowy: „czy tę czynność da się wykonać łatwo, szybko i bez frustracji?”.

## Checklista ergonomiczna dla UI mobilnego

Przed wdrożeniem ekranu warto sprawdzić:

- Czy główna akcja jest w zasięgu kciuka?
- Czy wszystkie istotne cele dotykowe mają odpowiedni rozmiar?
- Czy ekran ma jednoznaczną hierarchię wizualną?
- Czy formularz minimalizuje wpisywanie tekstu?
- Czy użytkownik dostaje szybki feedback po każdej ważnej akcji?
- Czy błędy są wyjaśnione prostym językiem?
- Czy ekran działa poprawnie po otwarciu klawiatury?
- Czy treść pozostaje czytelna w słońcu, ruchu i po skalowaniu tekstu?
- Czy najważniejsze zadanie da się wykonać jedną ręką?

## Platformowe standardy ergonomii

Zarówno Apple, jak i Google publikują wytyczne projektowe, które zawierają szczegółowe zalecenia ergonomiczne. Przestrzeganie tych standardów sprawia, że aplikacja czuje się „natywna" na danej platformie, co bezpośrednio przekłada się na wygodę użytkowania.

### Porównanie: Apple HIG vs Material Design 3

| Wymiar ergonomiczny | Apple HIG (iOS/iPadOS) | Material Design 3 (Android) |
|--------------------|-----------------------|-----------------------------|
| Minimalny rozmiar celu dotykowego | 44 × 44 pt | 48 × 48 dp |
| Nawigacja główna | Tab Bar (dół ekranu) | Navigation Bar (dół) lub Navigation Rail (tablet) |
| Gesty systemowe | Swipe z dołu (home), z góry (centrum sterowania) | Swipe z boków/dołu (nawigacja gestami) |
| Bezpieczne obszary | `safeAreaInsets` — obowiązkowe | `WindowInsets` — padding systemowy |
| Powrót wstecz | Swipe z lewej krawędzi (natywny) | Swipe z lewej lub prawej krawędzi |
| Akcja główna (FAB) | Brak oficjalnego FAB w HIG | FAB w prawym dolnym rogu |
| Minimalny kontrast tekstu | 4.5:1 (WCAG AA) | 4.5:1 (WCAG AA) |
| Gesty listy | Swipe do akcji (prawy/lewy) | Swipe do usunięcia (lewy) |
| Modalne arkusze | Sheet (połowa ekranu, rozwijany) | Bottom Sheet (modalny i trwały) |
| Odstępy między elementami | Wielokrotność 4 pt | Wielokrotność 4 dp (siatka 4dp) |

Najważniejsza różnica ergonomiczna dotyczy **umieszczenia nawigacji**: iOS wymaga Tab Bar na dole i nie przewiduje Drawer (hamburger menu), podczas gdy Material Design 3 dopuszcza Navigation Drawer, choć od wersji Material You preferuje Navigation Bar. Na tabletach iOS używa Split View i Sidebar, a Android Navigation Rail.

Warto pamiętać, że HIG aktualizuje zalecenia co roku przy okazji WWDC, a Material Design 3 wprowadzono w 2021 roku z dynamicznymi kolorami (Material You). Projektując cross-platform, trzymaj się wspólnych zasad (cele ≥ 44–48 dp/pt, nawigacja na dole) i dostosowuj detale do każdej platformy osobno.

## Testowanie ergonomii — metody

Sama analityczna ocena projektu nie wystarczy — prawdziwa ergonomia ujawnia się dopiero podczas obserwacji użytkowników. Poniżej opisane są podstawowe metody stosowane w procesie weryfikacji.

### Ocena heurystyczna (Nielsen)

10 heurystyk Nielsena Normana można bezpośrednio zastosować do aplikacji mobilnych:

1. **Widoczność stanu systemu** — czy użytkownik zawsze wie, co się dzieje (ładowanie, postęp, sukces)?
2. **Zgodność z rzeczywistością** — czy język aplikacji i metafory są zrozumiałe bez instrukcji?
3. **Swoboda i kontrola** — czy można cofnąć każdą ważną akcję?
4. **Spójność** — czy podobne akcje działają tak samo w całej aplikacji?
5. **Zapobieganie błędom** — czy formularz waliduje dane zanim użytkownik spróbuje je wysłać?
6. **Rozpoznawanie zamiast przypominania** — czy opcje są widoczne, nie ukryte w pamięci?
7. **Elastyczność i efektywność** — czy zaawansowani użytkownicy mogą korzystać ze skrótów?
8. **Minimalistyczny design** — czy na ekranie nie ma zbędnych informacji?
9. **Pomoc w rozpoznaniu błędów** — czy komunikaty błędów wskazują rozwiązanie?
10. **Dokumentacja** — czy aplikacja działa bez instrukcji, a pomoc jest łatwo dostępna?

### Testy użyteczności na prawdziwych urządzeniach

Żaden emulator nie zastąpi testów na fizycznym urządzeniu trzymanym w ręce. Przydatne techniki:

- **Test jednej ręki**: poproś uczestnika o wykonanie zadania trzymając telefon jedną ręką (bez użycia drugiej).
- **Test w ruchu**: test na chodzącej osobie — ujawnia problemy z czytelnością i precyzją dotyku.
- **Think-aloud protocol**: uczestnik mówi głośno, co myśli — rejestruje wahania i frustracje.

### Android Accessibility Scanner

Narzędzie Google (`com.google.android.apps.accessibility.auditor`) analizuje hierarchię widoków i zgłasza problemy:

- cele dotykowe poniżej 48 × 48 dp,
- niewystarczający kontrast tekstu,
- elementy interaktywne bez etykiet dostępności.

Uruchamiaj skaner na każdym kluczowym ekranie podczas sprint review. Raport można eksportować do CSV i śledzić regresje.

### Metryki jakościowe

Dwie najczęściej stosowane miary w badaniach ergonomii mobilnej:

- **Task Completion Rate (TCR)** — odsetek użytkowników, którzy wykonali zadanie bez pomocy. Cel: > 90%.
- **System Usability Scale (SUS)** — kwestionariusz 10 pytań, wynik 0–100. Wynik ≥ 68 oznacza akceptowalną użyteczność; ≥ 85 — doskonałą.

## Linki

- [Material Design — Understanding layout](https://m3.material.io/foundations/layout/understanding-layout/overview)
- [Material Design — Accessibility](https://m3.material.io/foundations/accessible-design/overview)
- [Apple Human Interface Guidelines](https://developer.apple.com/design/human-interface-guidelines/)
- [Nielsen Norman Group — Touch UX](https://www.nngroup.com/topic/touch-gestures/)

## Ergonomia multiplatformowa — iOS vs Android

Użytkownicy przyzwyczajeni do jednej platformy mają określone oczekiwania co do gestów i rozmieszczenia elementów UI. Aplikacja cross-platformowa powinna respektować te wzorce.

### Kluczowe różnice ergonomiczne platform

| Aspekt | iOS (Apple HIG) | Android (Material 3) |
|--------|----------------|---------------------|
| Nawigacja wstecz | Gest przesunięcia od lewej krawędzi | Gest od dołu (Android 10+) lub przycisk |
| Nawigacja główna | Tab bar na dole (5 zakładek max) | Navigation bar na dole lub Drawer |
| Akcje kontekstowe | Swipe w lewo → przyciski | Swipe → ujawnienie akcji lub długie przytrzymanie |
| Pasek statusu | Bezpieczna strefa (notch) | Pasek statusu, edge-to-edge (Android 15+) |
| FAB | Rzadziej stosowany | Standardowy element Material |
| Modalne dolne arkusze | Standardowe (half/full detents) | BottomSheet (expanded/collapsed) |
| Minimalna strefa dotyku | 44×44 pt | 48×48 dp |
| Typografia | SF Pro (Dynamic Type) | Roboto (M3 Type Scale) |

### Adaptive Layout dla foldables i tabletów

Na większych ekranach ergonomia wymaga innego rozkładu: treść po lewej, szczegóły po prawej, nawigacja jako boczny pasek. Jetpack Compose WindowSizeClass ułatwia adaptację:

```kotlin
@Composable
fun AdaptiveTaskApp() {
    val windowSizeClass = calculateWindowSizeClass()
    
    when (windowSizeClass.widthSizeClass) {
        WindowWidthSizeClass.Compact -> {
            // Telefon: bottom nav + single pane
            BottomNavLayout()
        }
        WindowWidthSizeClass.Medium -> {
            // Składany/mały tablet: navigation rail + single pane
            NavigationRailLayout()
        }
        WindowWidthSizeClass.Expanded -> {
            // Tablet/desktop: permanent nav drawer + two pane
            PermanentDrawerLayout()
        }
    }
}
```

Dostosowanie ergonomii do rozmiaru ekranu to inwestycja, która zyska na znaczeniu wraz z rosnącą popularnością foldables.
