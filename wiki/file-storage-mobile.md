# Zapisywanie i Odczyt Plików na Urządzeniu Mobilnym z Poziomu Aplikacji Mobilnej

Zapisywanie plików w aplikacji mobilnej wydaje się prostym zadaniem, ale w praktyce wymaga świadomego wyboru miejsca zapisu, zrozumienia ograniczeń systemu operacyjnego oraz uwzględnienia bezpieczeństwa danych użytkownika. Współczesne platformy mobilne nie pozwalają aplikacjom swobodnie zapisywać plików w dowolnym katalogu pamięci urządzenia. Zamiast tego udostępniają kontrolowane mechanizmy dostępu, które chronią prywatność użytkownika i stabilność systemu.

W tym artykule omawiamy:

- gdzie aplikacja mobilna może zapisywać pliki,
- czym różni się zapis prywatny od współdzielonego,
- jak wygląda zapis i odczyt plików na Androidzie i iOS,
- jak otwierać pliki wybrane przez użytkownika z dysku,
- kiedy używać plików, a kiedy bazy danych,
- jakie błędy są najczęściej popełniane przez początkujących programistów.

## Po co aplikacja mobilna zapisuje pliki?

Pliki w aplikacjach mobilnych są używane między innymi do:

- eksportu danych do formatu TXT, CSV lub PDF,
- przechowywania zdjęć, nagrań audio i wideo,
- zapisu dokumentów wygenerowanych przez aplikację,
- cache'owania odpowiedzi z sieci,
- przechowywania załączników pobranych z serwera,
- tworzenia kopii roboczych danych offline.

Nie każdy zapis danych powinien jednak trafiać do pliku. Jeżeli dane mają strukturę relacyjną, wymagają filtrowania, sortowania i wyszukiwania, lepszym wyborem będzie lokalna baza danych, np. Room na Androidzie lub Core Data / SwiftData na iOS. Pliki sprawdzają się wtedy, gdy przechowujemy większe zasoby binarne albo gotowe eksporty.

## Główne modele zapisu plików

Z perspektywy aplikacji mobilnej najczęściej spotkamy trzy modele:

1. **Pamięć prywatna aplikacji** — dostępna tylko dla danej aplikacji.
2. **Pamięć tymczasowa (cache)** — dane mogą zostać usunięte przez system.
3. **Pamięć współdzielona / dokumenty użytkownika** — pliki widoczne także poza aplikacją.

Każdy z tych modeli ma inny cel.

### 1. Pamięć prywatna aplikacji

To najbezpieczniejsze miejsce do zapisu danych roboczych i plików, które nie muszą być widoczne dla innych aplikacji ani dla użytkownika w menedżerze plików. Typowe zastosowania:

- ustawienia eksportowane tymczasowo do importu,
- prywatne notatki,
- pliki konfiguracyjne,
- lokalne kopie dokumentów synchronizowanych z backendem.

Zalety:

- brak potrzeby proszenia o szerokie uprawnienia do pamięci,
- dobra izolacja danych,
- prostsze zarządzanie bezpieczeństwem.

Wada:

- użytkownik zwykle nie zobaczy tych plików bezpośrednio poza aplikacją.

### 2. Cache aplikacji

Katalog cache służy do przechowywania danych tymczasowych, które można odtworzyć. Przykłady:

- miniatury zdjęć,
- pliki pobrane tymczasowo z API,
- lokalne wersje dokumentów używane tylko przez krótki czas,
- pliki przygotowane do wysłania.

Najważniejsza zasada: **nie przechowuj w cache jedynej kopii ważnych danych**, ponieważ system może usunąć te pliki, gdy będzie potrzebował miejsca.

### 3. Pamięć współdzielona

Ten model stosujemy, gdy plik ma być dostępny dla użytkownika także poza aplikacją. Dotyczy to np.:

- eksportu raportu PDF,
- zapisania zdjęcia do galerii,
- utworzenia pliku CSV do wysłania mailem,
- zapisu dokumentu wskazanego przez użytkownika.

Tutaj systemy mobilne stosują bardziej restrykcyjne zasady. Aplikacja zwykle nie dostaje „pełnego dostępu do dysku”, lecz działa przez kontrolowane API, np. `MediaStore` lub `Storage Access Framework` na Androidzie oraz katalog `Documents` czy mechanizmy udostępniania na iOS.

## Android — jak zapisywać i odczytywać pliki poprawnie

Android przez lata zmieniał model dostępu do pamięci. Starsze podejście oparte na swobodnym dostępie do external storage zostało ograniczone przez **scoped storage**, czyli model izolujący dane aplikacji i ograniczający możliwość dowolnego operowania na plikach użytkownika.

W praktyce oznacza to, że nowoczesna aplikacja Android powinna wybierać jedno z kilku podejść.

## Zapis do pamięci prywatnej aplikacji na Androidzie

Najprostsza forma zapisu to użycie katalogu wewnętrznego aplikacji.

```kotlin
fun saveInternalFile(context: Context, fileName: String, content: String) {
    context.openFileOutput(fileName, Context.MODE_PRIVATE).use { stream ->
        stream.write(content.toByteArray())
    }
}

fun readInternalFile(context: Context, fileName: String): String {
    return context.openFileInput(fileName)
        .bufferedReader()
        .use { it.readText() }
}
```

Tak zapisany plik:

- jest prywatny dla aplikacji,
- nie wymaga specjalnych uprawnień,
- zostanie usunięty po odinstalowaniu aplikacji.

To dobre rozwiązanie dla:

- notatek offline,
- konfiguracji eksportu,
- szkiców dokumentów,
- małych plików tekstowych generowanych lokalnie.

## Zapis do katalogu cache na Androidzie

Jeżeli plik ma charakter tymczasowy, lepiej wykorzystać katalog cache.

```kotlin
fun saveCacheFile(context: Context, fileName: String, content: String): File {
    val file = File(context.cacheDir, fileName)
    file.writeText(content)
    return file
}
```

Dobre zastosowania:

- odpowiedzi HTTP,
- obrazy do krótkotrwałego podglądu,
- tymczasowe pliki do współdzielenia,
- wersje robocze generowanego PDF.

## Zapis plików współdzielonych na Androidzie

Jeżeli użytkownik ma mieć dostęp do pliku poza aplikacją, trzeba zwykle użyć mechanizmów systemowych.

### MediaStore

`MediaStore` jest odpowiedni dla multimediów i niektórych typów plików publicznych, np. obrazu lub pliku pobranego do wspólnej przestrzeni.

```kotlin
fun saveTextToDownloads(context: Context, fileName: String, content: String) {
    val values = ContentValues().apply {
        put(MediaStore.Downloads.DISPLAY_NAME, fileName)
        put(MediaStore.Downloads.MIME_TYPE, "text/plain")
    }

    val resolver = context.contentResolver
    val uri = resolver.insert(MediaStore.Downloads.EXTERNAL_CONTENT_URI, values)
        ?: error("Nie udało się utworzyć wpisu MediaStore")

    val outputStream = try {
        resolver.openOutputStream(uri)
    } catch (e: Exception) {
        // W przypadku błędu otwarcia strumienia usuń utworzony wpis
        resolver.delete(uri, null, null)
        error("Nie udało się otworzyć strumienia zapisu dla $uri: ${e.message}")
    }

    if (outputStream == null) {
        // Gdy openOutputStream zwróci null, również usuń wpis i zgłoś błąd
        resolver.delete(uri, null, null)
        error("openOutputStream zwrócił null dla $uri")
    }

    outputStream.use { stream ->
        stream.write(content.toByteArray())
    }
}
```

To podejście jest poprawne, gdy:

- zapisujesz plik do folderu pobierania,
- plik ma być widoczny dla użytkownika,
- chcesz działać zgodnie z nowoczesnym modelem storage Androida.

### Storage Access Framework (SAF)

Jeżeli użytkownik sam ma wskazać miejsce zapisu, stosuje się **Storage Access Framework**. Aplikacja otwiera systemowy selektor plików, a użytkownik wybiera lokalizację i nazwę pliku. W efekcie aplikacja zapisuje dokładnie tam, gdzie użytkownik wyraził zgodę.

Przykładowy przepływ:

1. aplikacja uruchamia intent `ACTION_CREATE_DOCUMENT`,
2. użytkownik wybiera folder i nazwę,
3. aplikacja dostaje `Uri`,
4. zapis odbywa się przez `ContentResolver`.

```kotlin
val createDocument = registerForActivityResult(ActivityResultContracts.CreateDocument("text/csv")) { uri ->
    if (uri != null) {
        contentResolver.openOutputStream(uri)?.use { stream ->
            stream.write("id,name\n1,Ala\n2,Jan".toByteArray())
        }
    }
}

// np. po kliknięciu przycisku
createDocument.launch("raport.csv")
```

To rozwiązanie jest bardzo dobre dla:

- eksportu raportów,
- zapisu plików użytkownika,
- współpracy z chmurą lub zewnętrznym dostawcą dokumentów,
- aplikacji, które nie powinny same decydować o lokalizacji pliku.

## Uprawnienia na Androidzie — częsty punkt nieporozumień

Początkujący programiści często zakładają, że każda operacja na plikach wymaga uprawnienia do pamięci. W nowoczesnym Androidzie to nieprawda.

W praktyce:

- zapis do pamięci prywatnej aplikacji **nie wymaga** szerokiego uprawnienia do storage,
- zapis przez `SAF` zwykle również nie wymaga tradycyjnego uprawnienia, bo zgodę nadaje użytkownik poprzez selektor systemowy,
- dostęp do wybranych typów multimediów może wymagać specyficznych uprawnień zależnie od wersji Androida i scenariusza,
- szeroki dostęp do całej pamięci urządzenia jest dziś wyjątkiem, a nie standardem.

Dlatego aplikację należy projektować tak, aby korzystała z najmniejszego niezbędnego zakresu dostępu.

## Odczyt plików na Androidzie

Sam zapis to tylko połowa zadania. W realnej aplikacji trzeba jeszcze umieć plik odczytać — albo z pamięci prywatnej aplikacji, albo z katalogu cache, albo z lokalizacji wskazanej przez użytkownika.

### Odczyt pliku z pamięci prywatnej

Jeżeli plik został zapisany przez `openFileOutput`, można go później wczytać przez `openFileInput`. To najprostszy przypadek, ponieważ aplikacja działa we własnym sandboxie.

```kotlin
fun readInternalFileSafe(context: Context, fileName: String): String? {
    return runCatching {
        context.openFileInput(fileName).bufferedReader().use { it.readText() }
    }.getOrNull()
}
```

Ten wariant sprawdza się wtedy, gdy:

- aplikacja sama utworzyła plik,
- plik ma przewidywalną nazwę,
- użytkownik nie wybiera lokalizacji ręcznie.

### Odczyt pliku z katalogu cache

Plik z cache można odczytać jak zwykły obiekt `File`, ale trzeba pamiętać, że system mógł go już usunąć.

```kotlin
fun readCacheFile(context: Context, fileName: String): String? {
    val file = File(context.cacheDir, fileName)
    return if (file.exists()) file.readText() else null
}
```

To oznacza, że kod powinien zawsze przewidywać scenariusz braku pliku i potrafić go odtworzyć lub ponownie pobrać.

### Odczyt pliku wskazanego przez użytkownika z dysku — SAF

Najważniejszy scenariusz „odczytu z dysku” w nowoczesnym Androidzie to użycie **Storage Access Framework** i akcji `ACTION_OPEN_DOCUMENT`. Użytkownik wybiera dokument, a aplikacja dostaje `Uri`, z którego można czytać dane przez `ContentResolver`.

```kotlin
val openDocument = registerForActivityResult(ActivityResultContracts.OpenDocument()) { uri ->
    if (uri != null) {
        try {
            val maxSizeBytes = 5 * 1024 * 1024 // np. 5 MB — dostosuj do potrzeb aplikacji

            contentResolver.openInputStream(uri)?.use { inputStream ->
                // Prosta walidacja rozmiaru przed wczytaniem całości do pamięci
                val available = inputStream.available()
                if (available > maxSizeBytes) {
                    // TODO: pokaż komunikat użytkownikowi, że plik jest za duży
                    showImportError("Wybrany plik jest zbyt duży do importu.")
                    return@registerForActivityResult
                }

                val text = inputStream.bufferedReader().use { reader ->
                    reader.readText()
                }

                showImportedContent(text)
            } ?: run {
                // Strumień nie został otwarty — zgłoś błąd zamiast cicho ignorować problem
                showImportError("Nie udało się otworzyć wybranego pliku.")
            }
        } catch (e: IOException) {
            // Obsługa nieudanej operacji I/O (np. problem z dostępem do pliku)
            showImportError("Wystąpił błąd podczas odczytu pliku.")
        }
    } else {
        // Użytkownik anulował wybór pliku
        showImportError("Nie wybrano żadnego pliku do importu.")
    }
}

// np. po kliknięciu przycisku importu
openDocument.launch(arrayOf("text/plain", "text/csv", "application/json"))
```

To rozwiązanie jest właściwe, gdy:

- użytkownik wybiera istniejący plik z pamięci urządzenia lub chmury,
- importujesz CSV, JSON, TXT lub dokument aplikacji,
- nie chcesz żądać szerokich uprawnień do pamięci.

Warto zapamiętać ważną zasadę: przy pracy z `Uri` nie zakładaj, że otrzymasz zwykłą ścieżkę systemową. W Androidzie bardzo często pracuje się na strumieniach, a nie na bezpośrednich ścieżkach plików.

### Odczyt multimediów i plików publicznych

Jeżeli aplikacja operuje na zdjęciach, nagraniach lub plikach obecnych w przestrzeni współdzielonej, odczyt także często odbywa się przez `ContentResolver`, a nie przez bezpośredni dostęp do ścieżki. To szczególnie ważne przy nowoczesnym modelu scoped storage.

```kotlin
fun readBytesFromUri(context: Context, uri: Uri): ByteArray? {
    return context.contentResolver.openInputStream(uri)?.use { input ->
        input.readBytes()
    }
}
```

Takie podejście przydaje się m.in. przy:

- imporcie zdjęcia do aplikacji,
- wczytywaniu pliku PDF do podglądu,
- odczycie załącznika udostępnionego przez inną aplikację.

## iOS — zapis i odczyt plików w aplikacji mobilnej
Na iOS aplikacja działa w modelu sandbox, czyli ma własny, odizolowany obszar plików. Najczęściej zapis odbywa się w katalogach aplikacji, np. `Documents`, `Caches` lub `tmp`.

### Typowe katalogi na iOS

- `Documents` — pliki, które powinny przetrwać i należą do danych użytkownika,
- `Caches` — dane odtwarzalne i tymczasowe,
- `tmp` — bardzo krótkotrwałe pliki robocze.

### Przykład zapisu do katalogu Documents w Swift

```swift
func saveTextFile(fileName: String, content: String) throws {
    let directory = FileManager.default.urls(for: .documentDirectory, in: .userDomainMask).first!
    let fileURL = directory.appendingPathComponent(fileName)
    try content.write(to: fileURL, atomically: true, encoding: .utf8)
}

func readTextFile(fileName: String) throws -> String {
    let directory = FileManager.default.urls(for: .documentDirectory, in: .userDomainMask).first!
    let fileURL = directory.appendingPathComponent(fileName)
    return try String(contentsOf: fileURL, encoding: .utf8)
}
```

To podejście dobrze sprawdza się przy:

- dokumentach utworzonych przez użytkownika,
- lokalnych eksportach,
- plikach tekstowych i JSON,
- materiałach do synchronizacji offline.

Jeżeli plik ma być udostępniony na zewnątrz, iOS zwykle korzysta z mechanizmów takich jak `UIDocumentPickerViewController` albo systemowy arkusz współdzielenia (`UIActivityViewController`).

## Odczyt plików na iOS

Podobnie jak na Androidzie, odczyt może dotyczyć dwóch głównych sytuacji:

- pliku zapisanego wcześniej w sandboxie aplikacji,
- pliku wskazanego przez użytkownika w selektorze dokumentów.

### Odczyt pliku z katalogu aplikacji

Jeżeli aplikacja zna lokalizację pliku w `Documents`, odczyt jest prosty i odbywa się przez `FileManager` lub API klasy `String` / `Data`.

```swift
func readDocumentFile(fileName: String) throws -> String {
    let directory = FileManager.default.urls(for: .documentDirectory, in: .userDomainMask).first!
    let fileURL = directory.appendingPathComponent(fileName)
    return try String(contentsOf: fileURL, encoding: .utf8)
}
```

### Odczyt pliku wybranego przez użytkownika

Jeżeli użytkownik wskazuje plik z aplikacji Pliki lub z chmury, standardowym rozwiązaniem jest `UIDocumentPickerViewController`. Po wyborze dokumentu aplikacja dostaje URL, z którego może czytać dane.

```swift
func documentPicker(_ controller: UIDocumentPickerViewController, didPickDocumentsAt urls: [URL]) {
    guard let url = urls.first else { return }

    let canAccess = url.startAccessingSecurityScopedResource()
    defer {
        if canAccess {
            url.stopAccessingSecurityScopedResource()
        }
    }

    guard canAccess else {
        // Nie udało się uzyskać dostępu do pliku (security-scoped resource).
        // Tutaj można pokazać komunikat błędu użytkownikowi.
        return
    }
    if let text = try? String(contentsOf: url, encoding: .utf8) {
        print(text)
    }
}
```

To ważny przykład, ponieważ na iOS plik wybrany przez użytkownika może pochodzić spoza bezpośredniego sandboxa aplikacji. Wtedy trzeba respektować mechanizm **security-scoped resources** i czytać plik dokładnie w ramach przyznanego dostępu.

## Typowy przepływ: import i eksport plików

W większości aplikacji mobilnych operacje na plikach sprowadzają się do dwóch wzorców:

1. **Eksport** — aplikacja generuje plik i zapisuje go w miejscu prywatnym albo wskazanym przez użytkownika.
2. **Import** — aplikacja otwiera istniejący plik z dysku i przetwarza jego zawartość.

Przykłady:

- eksport raportu wydatków do CSV,
- import listy kontaktów z pliku JSON,
- odczyt PDF przesłanego przez użytkownika,
- wczytanie lokalnej kopii roboczej po restarcie aplikacji.

Dlatego projektując warstwę plików, warto zawsze uwzględnić **oba kierunki pracy: zapis i odczyt**.

## Flutter, React Native i inne frameworki cross-platform

W aplikacjach cross-platformowych dostęp do plików odbywa się zwykle przez biblioteki pośredniczące, ale zasady systemowe nadal pozostają takie same. Framework nie znosi ograniczeń Androida ani iOS — jedynie ukrywa część różnic pod wspólnym API.

Przykładowe scenariusze:

- Flutter: zapis do katalogu aplikacji przez `path_provider`,
- React Native: zapis przez biblioteki plikowe korzystające z natywnych API,
- Kotlin Multiplatform: logika może być współdzielona, ale operacje na plikach zwykle i tak używają natywnych mechanizmów platformy.

Wniosek jest prosty: **cross-platform nie oznacza dowolności w dostępie do pamięci**.

## Kiedy plik, a kiedy baza danych?

To jedno z najważniejszych pytań projektowych.

### Wybierz plik, gdy:

- zapisujesz eksport CSV, TXT, PDF lub ZIP,
- przechowujesz zdjęcie, nagranie lub dokument,
- potrzebujesz gotowego artefaktu do współdzielenia,
- dane nie wymagają zaawansowanych zapytań.

### Wybierz bazę danych, gdy:

- masz listy rekordów,
- potrzebujesz filtrowania, sortowania i relacji,
- dane są często aktualizowane,
- aplikacja ma działać offline-first na strukturach biznesowych.

### W praktyce

Dojrzała aplikacja mobilna zazwyczaj używa **obu podejść jednocześnie**:

- baza danych do obiektów biznesowych,
- pliki do załączników, raportów i cache,
- preferencje / DataStore / UserDefaults do prostych ustawień.

## Bezpieczeństwo zapisu plików

Samo zapisanie pliku to nie wszystko. Trzeba jeszcze odpowiedzieć na pytania:

- czy plik zawiera dane wrażliwe,
- kto ma mieć do niego dostęp,
- czy plik powinien być szyfrowany,
- kiedy należy go usunąć,
- czy użytkownik wie, że dane opuszczają prywatny obszar aplikacji.

Dobre praktyki:

- nie zapisuj tokenów i haseł w zwykłych plikach tekstowych,
- dla danych wrażliwych używaj mechanizmów kryptograficznych platformy,
- ograniczaj zapisy do przestrzeni współdzielonej,
- usuwaj pliki tymczasowe po zakończeniu operacji,
- waliduj nazwę i typ tworzonych plików.

## Dobre praktyki przy odczycie plików

- Zakładaj, że plik może nie istnieć albo zostać usunięty.
- Nie zakładaj, że `Uri` na Androidzie da się zamienić na prostą ścieżkę dyskową.
- Waliduj format danych po odczycie, szczególnie dla importu od użytkownika.
- Nie wczytuj bardzo dużych plików w całości do pamięci, jeśli możesz je przetwarzać strumieniowo.
- Rozdziel etap wyboru pliku od etapu parsowania i walidacji.

## Typowe błędy początkujących

1. Zapisywanie wszystkiego do jednego katalogu bez podziału na dane trwałe i tymczasowe.
2. Traktowanie pliku tekstowego jako zamiennika bazy danych.
3. Zakładanie, że aplikacja może dowolnie pisać po całym dysku urządzenia.
4. Brak obsługi błędów wejścia-wyjścia.
5. Brak informacji dla użytkownika, gdzie plik został zapisany lub z jakiego pliku dane zostały odczytane.
6. Zapisywanie lub odczytywanie dużych plików na głównym wątku UI.
7. Przechowywanie danych wrażliwych w postaci jawnej.
8. Próba traktowania każdego `Uri` jak zwykłej ścieżki pliku.
9. Brak walidacji pliku importowanego od użytkownika.

## Przykładowy scenariusz projektowy

Załóżmy, że budujesz aplikację mobilną do zarządzania wydatkami.

Rozsądny podział może wyglądać tak:

- historia transakcji → lokalna baza danych,
- ustawienia waluty i motywu → preferencje / DataStore / UserDefaults,
- eksport miesięcznego raportu → plik PDF lub CSV,
- tymczasowy podgląd wygenerowanego raportu → katalog cache,
- załączone zdjęcie paragonu → plik binarny w prywatnym obszarze aplikacji lub kontrolowanym magazynie mediów.

Dzięki temu każda technologia jest użyta zgodnie z przeznaczeniem.

## Dobre praktyki podsumowujące

- Najpierw określ, **czy plik ma być prywatny, tymczasowy czy współdzielony**.
- Nie proś o więcej uprawnień, niż naprawdę potrzebujesz.
- Nie zapisuj ani nie odczytuj ciężkich plików na głównym wątku.
- Dla eksportu i importu danych używaj API systemowych właściwych dla platformy.
- Dla danych biznesowych preferuj bazę danych zamiast luźnych plików.
- Rozdziel logikę zapisu i odczytu plików od warstwy UI.
- Projektuj obsługę błędów: brak miejsca, anulowanie zapisu, brak uprawnień, usunięty plik, błędny format danych.

## Pytania kontrolne

1. Czym różni się pamięć prywatna aplikacji od pamięci współdzielonej?
2. Kiedy należy użyć katalogu cache?
3. Dlaczego plik nie zawsze jest dobrym zamiennikiem bazy danych?
4. Do czego służy `Storage Access Framework` i kiedy użyć `ACTION_OPEN_DOCUMENT`?
5. Jakie ryzyko niesie zapis danych wrażliwych do zwykłego pliku tekstowego?
6. Dlaczego nie należy wykonywać zapisu ani odczytu dużych plików na głównym wątku?

## Ćwiczenia

### Ćwiczenie 1 — Android, zapis prywatny

Napisz funkcję zapisującą notatkę tekstową do pamięci prywatnej aplikacji i funkcję odczytu tej notatki po ponownym uruchomieniu aplikacji.

### Ćwiczenie 2 — Android, import CSV

Przygotuj ekran z przyciskiem importu pliku CSV przy użyciu `ACTION_OPEN_DOCUMENT`. Po wybraniu pliku odczytaj jego treść i wyświetl ją na ekranie.

### Ćwiczenie 3 — Android, eksport CSV

Przygotuj ekran z przyciskiem eksportu listy rekordów do pliku CSV przy użyciu `ACTION_CREATE_DOCUMENT`.

### Ćwiczenie 4 — iOS, katalog Documents

Zapisz prosty plik tekstowy do katalogu `Documents`, a następnie odczytaj go po ponownym wejściu na ekran.

### Ćwiczenie 5 — analiza architektury

Dla aplikacji notatkowej wskaż, które dane powinny trafić do bazy, które do plików, a które do prostych ustawień systemowych. Dodatkowo opisz, które pliki aplikacja odczytuje automatycznie, a które powinny być wybierane przez użytkownika.
