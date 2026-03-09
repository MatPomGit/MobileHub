# Dostępność aplikacji mobilnych

Dostępność (accessibility, a11y) to projektowanie i implementacja aplikacji w taki sposób, aby mogły z nich korzystać osoby z różnymi potrzebami: niewidome i słabowidzące, głuche i słabosłyszące, z ograniczeniami motorycznymi, poznawczymi, językowymi lub z czasowymi ograniczeniami sprawności. W praktyce nie jest to „dodatek na końcu projektu”, ale część jakości produktu — podobnie jak bezpieczeństwo, wydajność i testowalność.

Dobrze zaprojektowana dostępność poprawia UX także dla osób bez formalnie rozpoznanej niepełnosprawności: użytkowników starszych, zestresowanych, zmęczonych, korzystających z telefonu jedną ręką, w ostrym słońcu, w hałasie, z pękniętym ekranem albo z chwilowo ograniczoną sprawnością po urazie.

## Dlaczego dostępność jest ważna

- **Skala problemu**: znacząca część populacji żyje z trwałą lub czasową niepełnosprawnością.
- **Wymogi prawne i instytucjonalne**: w UE dostępność jest regulowana m.in. przez Web Accessibility Directive dla sektora publicznego oraz przez European Accessibility Act dla wybranych produktów i usług cyfrowych.
- **Lepsza architektura UI**: poprawna semantyka, przewidywalna nawigacja, czytelne stany i komunikaty zwykle wymuszają lepszy model interakcji.
- **Lepsza testowalność**: elementy z poprawnie ustawioną semantyką są łatwiejsze do wykrywania w testach automatycznych.
- **Większy zasięg produktu**: aplikacja dostępna obsługuje realnie więcej użytkowników i mniej przypadków skrajnych.

## Kategorie potrzeb użytkowników

Dostępność mobilna obejmuje kilka głównych obszarów:

### 1. Dostępność wzrokowa
Dotyczy m.in. użytkowników korzystających z TalkBack, VoiceOver, dużego tekstu, powiększenia ekranu, wysokiego kontrastu, odwrócenia kolorów i czytników brajlowskich.

Najczęstsze wymagania:
- poprawne etykiety elementów,
- logiczna kolejność fokusu,
- odpowiedni kontrast,
- brak polegania wyłącznie na kolorze,
- wsparcie dla skalowania tekstu,
- jasne komunikaty o stanie i błędach.

### 2. Dostępność słuchowa
Dotyczy użytkowników głuchych i słabosłyszących.

Najczęstsze wymagania:
- napisy do materiałów audio/wideo,
- brak przekazywania kluczowej informacji wyłącznie dźwiękiem,
- wizualne i haptyczne potwierdzenia zdarzeń.

### 3. Dostępność motoryczna
Dotyczy osób, które mają trudność z precyzyjnym dotykiem, korzystają z przełączników, klawiatury, D-pada, sterowania głosowego lub alternatywnych urządzeń wejścia.

Najczęstsze wymagania:
- odpowiednio duże cele dotykowe,
- przewidywalna nawigacja fokusem,
- brak gestów wymagających wysokiej precyzji jako jedynej metody obsługi,
- alternatywa dla przeciągania, długiego przytrzymania i gestów wielopunktowych.

### 4. Dostępność poznawcza
Dotyczy osób z ADHD, dysleksją, trudnościami pamięciowymi, ograniczoną koncentracją lub niską biegłością językową.

Najczęstsze wymagania:
- prosty język,
- spójne wzorce interakcji,
- przewidywalna nawigacja,
- ograniczenie przeładowania informacyjnego,
- jednoznaczne komunikaty o błędach i kolejnych krokach.

## Zasady ogólne projektowania dostępnej aplikacji

### Semantyka ponad wygląd
UI nie powinno być definiowane wyłącznie wizualnie. Element musi komunikować:
- **co to jest**,
- **w jakim jest stanie**,
- **co się stanie po aktywacji**.

Przykład złego projektu:
- ikona kosza bez etykiety,
- czerwony obrys pola formularza bez komunikatu tekstowego,
- karta „klikana” bez semantycznej akcji.

Przykład poprawnego projektu:
- przycisk ma etykietę „Usuń zadanie: Zakupy”,
- błąd pola ma tekst „Hasło musi mieć co najmniej 12 znaków”,
- stan przełącznika jest odczytywany jako „Powiadomienia, włączone”.

### Nie polegaj wyłącznie na kolorze
Kolor może wspierać znaczenie, ale nie może być jego jedynym nośnikiem.

Zły przykład:
- zielony status oznacza „aktywne”, czerwony „błąd”, bez tekstu i ikon.

Lepszy przykład:
- zielona ikona + tekst „Aktywne”,
- czerwony komunikat + ikona ostrzeżenia + treść błędu.

### Treść i interakcja muszą być przewidywalne
Użytkownik powinien rozumieć:
- gdzie jest,
- co może zrobić,
- jaki był rezultat działania,
- jak wrócić lub poprawić błąd.

### Dostępność nie może zależeć od jednej modalności
Jeżeli coś da się odczytać wyłącznie wzrokiem, usłyszeć wyłącznie dźwiękiem lub wykonać wyłącznie gestem przeciągania, to interfejs jest ryzykowny z punktu widzenia dostępności.

## Android: TalkBack i drzewo semantyki

TalkBack to systemowy czytnik ekranu Androida. Użytkownik porusza się po interfejsie fokusem dostępności, a nie „patrząc na ekran”. Oznacza to, że kluczowe są:
- poprawne etykiety,
- poprawne role,
- sensowna kolejność elementów,
- dobrze opisane akcje,
- brak szumu semantycznego.

W Jetpack Compose podstawowym mechanizmem jest **Semantics API**. Semantyka opisuje znaczenie elementu dla usług dostępności, testów i innych usług systemowych.

## Compose: poprawne etykietowanie elementów graficznych

`contentDescription` stosujemy przede wszystkim do elementów graficznych, gdy sama grafika niesie znaczenie.

```kotlin
Icon(
    imageVector = Icons.Default.Delete,
    contentDescription = "Usuń zadanie: ${task.title}"
)
```

Jeżeli grafika jest wyłącznie dekoracyjna albo obok niej znajduje się równoważny tekst, należy rozważyć ustawienie `contentDescription = null`, aby uniknąć dublowania informacji.

```kotlin
Row(verticalAlignment = Alignment.CenterVertically) {
    Icon(
        imageVector = Icons.Default.CheckCircle,
        contentDescription = null
    )
    Text("Ukończone")
}
```

### Dobra praktyka
- opis ma mówić o **funkcji lub znaczeniu**, nie o wyglądzie,
- nie pisz: „ikona kosza”,
- pisz: „Usuń zadanie”.

### Zła praktyka
- `contentDescription = "button"`
- `contentDescription = "kliknij tutaj"`
- `contentDescription = "ładna ikona"`

## Scalanie semantyki (`mergeDescendants`)

Złożony komponent, np. karta z ikoną, tytułem, terminem i statusem, bywa wygodniejszy jako jeden logiczny element zamiast kilku oderwanych węzłów.

```kotlin
Column(
    modifier = Modifier.semantics(mergeDescendants = true) {
        contentDescription = buildString {
            append("Zadanie: ${task.title}. ")
            append(if (task.isDone) "Status: ukończone. " else "Status: nieukończone. ")
            append("Termin: ${task.dueDate?.formatShort() ?: "brak"}.")
        }
    }
) {
    Text(task.title)
    Text(task.dueDate?.formatShort() ?: "Brak terminu")
}
```

To podejście jest przydatne, gdy użytkownik powinien traktować cały komponent jako jedną jednostkę interakcji.

Uwaga praktyczna: nie należy scalać wszystkiego „na siłę”. Jeżeli wewnątrz karty są osobne przyciski, checkboxy lub menu kontekstowe, zbyt agresywne scalanie może pogorszyć obsługę.

## Role, stany i akcje

Wiele komponentów Compose ma sensowną semantykę wbudowaną domyślnie. Nie należy nadpisywać jej bez potrzeby. Często wystarczy użyć odpowiedniego komponentu (`Button`, `Checkbox`, `Switch`) zamiast budować od zera własny „klikalny Box”.

### Rola elementu

```kotlin
Box(
    modifier = Modifier
        .clickable { submit() }
        .semantics { role = Role.Button }
) {
    Text("Zapisz")
}
```

Lepiej jednak, gdy to możliwe, użyć natywnego komponentu:

```kotlin
Button(onClick = { submit() }) {
    Text("Zapisz")
}
```

### Opis stanu

```kotlin
Switch(
    checked = isEnabled,
    onCheckedChange = { isEnabled = it },
    modifier = Modifier.semantics {
        stateDescription = if (isEnabled) "włączone" else "wyłączone"
    }
)
```

Dla wielu komponentów stan jest już przekazywany automatycznie. Własny `stateDescription` ma sens wtedy, gdy chcemy doprecyzować opis lub gdy budujemy niestandardowy komponent.

### Niestandardowe akcje

Custom actions są użyteczne, gdy element ma więcej niż jedną sensowną operację, a UI wizualnie ukrywa je np. w gestach lub menu.

```kotlin
Modifier.semantics {
    customActions = listOf(
        CustomAccessibilityAction("Edytuj") {
            editTask()
            true
        },
        CustomAccessibilityAction("Usuń") {
            deleteTask()
            true
        }
    )
}
```

Nie należy jednak używać custom actions do maskowania złego interfejsu. Najpierw projektujemy czytelne UI, a dopiero potem dodajemy semantyczne skróty.

## Nagłówki, struktura i nawigacja po treści

Na ekranach z dłuższą treścią warto oznaczać nagłówki semantycznie.

```kotlin
Text(
    text = "Moje zadania",
    style = MaterialTheme.typography.headlineMedium,
    modifier = Modifier.semantics { heading() }
)
```

To pomaga użytkownikom czytników ekranu szybciej poruszać się po sekcjach.

Przykłady miejsc, gdzie nagłówki mają sens:
- ekran ustawień,
- artykuł lub dokument,
- panel z sekcjami „Profil”, „Płatności”, „Bezpieczeństwo”,
- długie formularze.

## Komunikaty dynamiczne i `liveRegion`

Gdy zawartość zmienia się dynamicznie — np. pojawia się błąd, toast, komunikat statusu lub wynik walidacji — użytkownik technologii asystujących powinien zostać o tym poinformowany.

```kotlin
Text(
    text = statusMessage,
    modifier = Modifier.semantics {
        liveRegion = LiveRegionMode.Polite
    }
)
```

- `Polite` — komunikat zostanie odczytany, gdy będzie to bezpieczne dla bieżącego przepływu.
- `Assertive` — stosować ostrożnie, wyłącznie dla informacji krytycznych.

Przykłady dobrych zastosowań:
- „Zapisano zmiany”,
- „Dodano produkt do koszyka”,
- „Hasło jest za krótkie”.

Przykład złego zastosowania:
- każda drobna zmiana tekstu ustawiona jako `Assertive`, co prowadzi do ciągłego przerywania czytnika ekranu.

## Formularze: etykiety, błędy, fokus, klawiatura

Formularz jest jednym z najczęstszych miejsc problemów z dostępnością.

Zasady:
- pole musi mieć widoczną i semantyczną etykietę,
- błąd musi być tekstowy i jednoznaczny,
- fokus po akcji powinien przechodzić przewidywalnie,
- klawiatura ekranowa powinna mieć poprawnie ustawiony typ i akcję IME.

```kotlin
val focusManager = LocalFocusManager.current

OutlinedTextField(
    value = email,
    onValueChange = { email = it },
    label = { Text("Adres e-mail") },
    isError = emailError != null,
    supportingText = {
        if (emailError != null) Text(emailError!!)
    },
    keyboardOptions = KeyboardOptions(
        keyboardType = KeyboardType.Email,
        imeAction = ImeAction.Next
    ),
    keyboardActions = KeyboardActions(
        onNext = { focusManager.moveFocus(FocusDirection.Down) }
    ),
    modifier = Modifier.fillMaxWidth()
)
```

Dobre komunikaty błędów:
- „Podaj poprawny adres e-mail.”
- „Hasło musi mieć co najmniej 12 znaków.”
- „Pole Numer albumu jest wymagane.”

Złe komunikaty błędów:
- „Błąd.”
- „Nieprawidłowe dane.”
- czerwony kolor bez tekstu.

## Rozmiar tekstu i skalowanie

Aplikacja mobilna powinna wspierać systemowe skalowanie tekstu. Najważniejsza zasada brzmi: **nie blokuj użytkownikowi ustawionego rozmiaru czcionki, jeśli nie masz bardzo mocnego uzasadnienia projektowego**.

### Dobre praktyki
- używaj `sp` dla tekstu,
- pozwalaj tekstowi zawijać się do wielu linii,
- projektuj layouty elastyczne, a nie „na styk”,
- testuj co najmniej przy dużych ustawieniach font size i display size,
- unikaj osadzania krytycznego tekstu w bitmapach.

### Antywzorce
- sztywne wysokości kontenerów mieszczące tylko jedną linię tekstu,
- ręczne „przycinanie” tekstu, bo layout się nie mieści,
- globalne blokowanie skali czcionki,
- traktowanie elipsy jako podstawowego sposobu radzenia sobie z długim tekstem.

Przykład poprawniejszego podejścia:

```kotlin
Text(
    text = articleTitle,
    style = MaterialTheme.typography.titleLarge,
    maxLines = 3,
    overflow = TextOverflow.Ellipsis
)
```

To nadal kompromis, ale lepszy niż ręczne blokowanie skali. W krytycznych miejscach lepiej przeprojektować layout niż ograniczać użytkownika.

## Kontrast kolorów

Kontrast powinien spełniać wymagania WCAG:
- **4.5:1** dla zwykłego tekstu,
- **3:1** dla dużego tekstu,
- wartości progowe nie są zaokrąglane w górę.

Warto pamiętać, że „duży tekst” w WCAG jest definiowany typograficznie w punktach (`18pt` regular lub `14pt` bold), więc na Androidzie trzeba traktować to jako przybliżenie, a nie prostą regułę typu „18sp = large text”.

Praktyczne zalecenia:
- nie używaj jasnoszarego tekstu na białym tle,
- nie zakładaj, że kolor z design systemu automatycznie spełnia kontrast w każdym zestawieniu,
- sprawdzaj stany `disabled`, `hint`, `supportingText`, `error` i tekst na przyciskach.

Przykładowa funkcja obliczania kontrastu:

```kotlin
fun contrastRatio(foreground: Color, background: Color): Double {
    val l1 = relativeLuminance(foreground)
    val l2 = relativeLuminance(background)
    val lighter = maxOf(l1, l2)
    val darker = minOf(l1, l2)
    return (lighter + 0.05) / (darker + 0.05)
}

fun relativeLuminance(color: Color): Double {
    fun channel(c: Float): Double {
        val value = c.toDouble()
        return if (value <= 0.04045) value / 12.92
        else Math.pow((value + 0.055) / 1.055, 2.4)
    }

    val r = channel(color.red)
    val g = channel(color.green)
    val b = channel(color.blue)

    return 0.2126 * r + 0.7152 * g + 0.0722 * b
}
```

Uwaga: sama zgodność z kontrastem nie gwarantuje pełnej czytelności. Liczą się też odstępy, grubość fontu, wielkość tekstu, długość linii i kontekst użycia.

## Rozmiary celów dotykowych

Interaktywne elementy powinny mieć odpowiednio duży obszar aktywny. W Androidzie zalecany minimalny rozmiar celu dotykowego to **48dp × 48dp**.

```kotlin
IconButton(
    onClick = { deleteTask() },
    modifier = Modifier.sizeIn(minWidth = 48.dp, minHeight = 48.dp)
) {
    Icon(Icons.Default.Delete, contentDescription = "Usuń zadanie")
}
```

Istotne rozróżnienie:
- element **wizualnie** może być mniejszy,
- ale jego **touch target** powinien nadal mieć odpowiedni rozmiar.

Typowy błąd:
- ikona 16dp bez paddingu jako jedyny przycisk w pasku narzędzi.

## Fokus, klawiatura, D-pad i urządzenia alternatywne

Aplikacja mobilna nie jest obsługiwana wyłącznie dotykiem. W praktyce trzeba uwzględnić także:
- klawiaturę sprzętową,
- D-pad,
- Android TV,
- ChromeOS,
- sterowanie przełącznikami,
- sterowanie głosowe.

```kotlin
val emailFocus = remember { FocusRequester() }
val passwordFocus = remember { FocusRequester() }

Column {
    OutlinedTextField(
        value = email,
        onValueChange = { email = it },
        label = { Text("E-mail") },
        keyboardOptions = KeyboardOptions(imeAction = ImeAction.Next),
        keyboardActions = KeyboardActions(
            onNext = { passwordFocus.requestFocus() }
        ),
        modifier = Modifier.focusRequester(emailFocus)
    )

    OutlinedTextField(
        value = password,
        onValueChange = { password = it },
        label = { Text("Hasło") },
        keyboardOptions = KeyboardOptions(imeAction = ImeAction.Done),
        keyboardActions = KeyboardActions(onDone = { submit() }),
        modifier = Modifier.focusRequester(passwordFocus)
    )
}
```

Dobre praktyki:
- fokus powinien iść zgodnie z logiką formularza,
- po zamknięciu dialogu fokus powinien wracać w sensowne miejsce,
- aktywny element musi być wyraźnie widoczny.

## Gesty i alternatywy interakcji

Gesty takie jak przeciąganie, swipe, pinch czy long press nie powinny być jedyną drogą wykonania ważnej operacji.

Przykłady:
- jeśli zadanie można usunąć przesunięciem w lewo, dodaj też przycisk „Usuń”,
- jeśli lista wymaga drag-and-drop do zmiany kolejności, zapewnij również akcje „Przesuń w górę / w dół”,
- jeśli menu otwiera się wyłącznie długim przytrzymaniem, dodaj widoczny przycisk „Więcej opcji”.

## Multimedia, animacje i bodźce sensoryczne

### Audio i wideo
- dodawaj napisy do materiałów wideo,
- nie przekazuj kluczowych informacji wyłącznie dźwiękiem,
- rozważ transkrypcje dla treści audio.

### Animacje
- unikaj nadmiaru ruchu,
- respektuj ustawienia systemowe ograniczające animacje,
- nie używaj migających elementów mogących wywoływać dyskomfort.

### Haptyka
Haptyka jest przydatna jako dodatkowe potwierdzenie, ale nie może być jedynym nośnikiem informacji.

## Wysoki kontrast, tryb ciemny i personalizacja systemowa

Dostępność kolorystyczna nie sprowadza się do „jasny motyw vs ciemny motyw”. Należy testować:
- tryb jasny,
- tryb ciemny,
- podwyższony kontrast, jeśli platforma go wspiera,
- odwrócenie kolorów,
- skale szarości lub ograniczone rozróżnianie barw.

W nowszych wersjach Androida istnieją API związane z kontrastem UI, ale ich użycie zależy od wersji systemu i sposobu budowy motywu. Bezpieczna zasada projektowa jest prosta:
- nie opieraj czytelności na subtelnych różnicach jasności,
- nie zakładaj, że dynamic color zawsze zapewni właściwy kontrast,
- testuj rzeczywiste kombinacje foreground/background w aplikacji.

## Testowanie dostępności

Dostępność trzeba testować na kilku poziomach.

### 1. Testy manualne
Minimalny zestaw:
1. Włącz TalkBack i przejdź krytyczne ścieżki bez patrzenia na ekran.
2. Zwiększ rozmiar tekstu i rozmiar ekranu.
3. Sprawdź tryb jasny i ciemny.
4. Przetestuj nawigację klawiaturą lub D-padem.
5. Sprawdź formularze: fokus, błędy, klawiaturę ekranową, komunikaty po wysłaniu.
6. Oceń, czy każdy istotny element ma sensowną nazwę, rolę i stan.

### 2. Testy automatyczne Compose

```kotlin
@Test
fun taskCard_hasMeaningfulAccessibilityDescription() {
    val task = Task(title = "Kup mleko", isDone = false, dueDate = null)

    composeTestRule.setContent {
        TaskCard(task = task)
    }

    composeTestRule
        .onNodeWithContentDescription("Zadanie: Kup mleko. Status: nieukończone. Termin: brak.")
        .assertExists()
}
```

### 3. Kontrola celów dotykowych

```kotlin
@Test
fun deleteButton_hasMinimumTouchTarget() {
    composeTestRule.setContent {
        IconButton(
            onClick = {},
            modifier = Modifier
                .testTag("delete")
                .sizeIn(minWidth = 48.dp, minHeight = 48.dp)
        ) {
            Icon(Icons.Default.Delete, contentDescription = "Usuń")
        }
    }

    composeTestRule.onNodeWithTag("delete").assertExists()
}
```

W praktyce do pełnej walidacji warto używać także narzędzi inspekcyjnych i testów ręcznych, bo nie wszystkie problemy semantyczne i percepcyjne da się wiarygodnie wykryć jednym assertem.

### 4. Narzędzia praktyczne
- Android Accessibility Scanner,
- Layout Inspector i podgląd Semantics Tree,
- ręczne testy z TalkBack,
- testy na realnych urządzeniach o różnej wielkości ekranu.

## Typowe błędy studentów i początkujących programistów

1. **Używanie `Box.clickable` wszędzie zamiast komponentów semantycznych.**
2. **Brak etykiet dla ikon i przycisków ikonowych.**
3. **Dublowanie informacji przez niepotrzebne `contentDescription`.**
4. **Komunikowanie błędów tylko kolorem.**
5. **Sztywne layouty, które rozpadają się przy dużej czcionce.**
6. **Za małe obszary dotykowe.**
7. **Ukrywanie ważnych akcji wyłącznie w gestach.**
8. **Brak informacji o stanie elementów przełączanych.**
9. **Nieprzemyślana kolejność fokusu.**
10. **Testowanie wyłącznie „na swoim telefonie” i bez technologii asystujących.**

## Dobre praktyki architektoniczne

Dostępność jest prostsza do utrzymania, gdy:
- komponenty UI mają jasno określone role,
- design system definiuje kontrasty, rozmiary touch targetów i wzorce błędów,
- komponenty wielokrotnego użytku mają semantykę wbudowaną domyślnie,
- teksty są trzymane w zasobach i łatwe do lokalizacji,
- scenariusze dostępności są częścią Definition of Done.

Przykład Definition of Done dla ekranu formularza:
- działa z TalkBack,
- każdy element interaktywny ma sensowną nazwę,
- błędy są tekstowe i powiązane z polem,
- touch targety mają minimum 48dp,
- ekran działa przy dużej czcionce,
- fokus i IME actions są poprawne.

## Krótkie porównanie: Android i iOS

Choć przykłady w tym materiale używają Jetpack Compose, zasady są międzyplatformowe.

Na iOS odpowiednikami są m.in.:
- **VoiceOver** zamiast TalkBack,
- **Accessibility Label / Value / Hint** zamiast części właściwości semantycznych Compose,
- **Dynamic Type** dla skalowania tekstu,
- **Accessibility Inspector** do testów.

Zasada pozostaje ta sama: znaczenie interfejsu musi być zakodowane semantycznie, a nie tylko wizualnie.

## Podsumowanie

Dostępna aplikacja mobilna:
- ma poprawną semantykę,
- wspiera czytniki ekranu,
- nie opiera się wyłącznie na kolorze, dźwięku ani geście,
- ma duże i wygodne cele dotykowe,
- działa przy powiększonym tekście,
- komunikuje role, stany i wyniki akcji,
- jest testowana zarówno automatycznie, jak i ręcznie.

Najważniejsza zasada praktyczna: **nie pytaj „jak dodać accessibility”, tylko projektuj UI od początku tak, aby było semantyczne, czytelne i obsługiwalne wieloma sposobami.**

## Linki

- [Accessibility in Jetpack Compose](https://developer.android.com/develop/ui/compose/accessibility)
- [Semantics in Jetpack Compose](https://developer.android.com/develop/ui/compose/accessibility/semantics)
- [API defaults for accessibility in Compose](https://developer.android.com/develop/ui/compose/accessibility/api-defaults)
- [Build accessible apps on Android](https://developer.android.com/guide/topics/ui/accessibility/)
- [WCAG – Contrast (Minimum)](https://www.w3.org/WAI/WCAG21/Understanding/contrast-minimum.html)
- [European Accessibility Act – European Commission](https://commission.europa.eu/strategy-and-policy/policies/justice-and-fundamental-rights/disability/european-accessibility-act-eaa_en)
- [EN 301 549 – omówienie standardu](https://accessible-eu-centre.ec.europa.eu/content-corner/digital-library/en-3015492021-accessibility-requirements-ict-products-and-services_en)
- [Apple Accessibility Human Interface Guidelines](https://developer.apple.com/design/human-interface-guidelines/accessibility)
