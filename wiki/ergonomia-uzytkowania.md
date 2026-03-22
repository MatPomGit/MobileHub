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

## Linki

- [Material Design — Understanding layout](https://m3.material.io/foundations/layout/understanding-layout/overview)
- [Material Design — Accessibility](https://m3.material.io/foundations/accessible-design/overview)
- [Apple Human Interface Guidelines](https://developer.apple.com/design/human-interface-guidelines/)
- [Nielsen Norman Group — Touch UX](https://www.nngroup.com/topic/touch-gestures/)
