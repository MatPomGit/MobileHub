# Wprowadzenie do formatów plików w aplikacjach mobilnych

Każda aplikacja mobilna — bez względu na platformę — przechowuje, przetwarza i wymienia dane. To, w jakim formacie dane są zapisane, ma bezpośredni wpływ na wydajność, zużycie baterii, wielkość paczki instalacyjnej oraz komfort użytkownika. Programista, który nie rozumie różnic między formatami, często podejmuje przypadkowe decyzje, które ujawniają się dopiero przy skalowaniu aplikacji: zbyt duże pliki zwalniają sieć, nieodpowiedni format obrazu zwiększa zużycie RAM-u, a nadmiarowe parsowanie XML blokuje wątek UI.

Ten artykuł to mapa pojęciowa świata formatów plików w kontekście mobilnym. Kolejne artykuły w tej sekcji wikiów omawiają każdą kategorię szczegółowo.

## Czym jest format pliku?

Format pliku definiuje, jak bity i bajty są zorganizowane, aby niosły określone znaczenie. Wyróżniamy dwa główne wymiary klasyfikacji:

### Tekst vs dane binarne

**Formaty tekstowe** zapisują dane jako czytelne dla człowieka znaki (UTF-8, ASCII). Ich główne cechy:
- łatwe debugowanie i inspekcja bez specjalnych narzędzi,
- możliwość edycji w dowolnym edytorze tekstu,
- większy rozmiar w porównaniu z odpowiednikiem binarnym,
- podatność na błędy kodowania (BOM, CRLF vs LF).

**Formaty binarne** kodują dane jako sekwencje bajtów według ścisłej specyfikacji. Ich cechy:
- kompaktowy rozmiar,
- szybkie parsowanie (często bez alokacji pośrednich),
- trudna inspekcja bez dedykowanych narzędzi,
- konieczność obsługi wersjonowania schematu.

### Ustrukturyzowane vs nieustrukturyzowane

| Typ | Opis | Przykłady |
|-----|------|-----------|
| Ustrukturyzowane | Dane mają zdefiniowany schemat i hierarchię | JSON, XML, Protocol Buffers, SQLite |
| Częściowo ustrukturyzowane | Schemat jest luźny lub opcjonalny | YAML, TOML, CSV |
| Nieustrukturyzowane | Brak narzuconego schematu; interpretacja zależy od aplikacji | Surowy tekst, PDF, JPEG |

## Jak mobilne systemy operacyjne obsługują typy plików?

### MIME types

Zarówno Android, jak i iOS używają standardu MIME (Multipurpose Internet Mail Extensions) do identyfikowania treści. Typ MIME składa się z kategorii i podtypu, np. `image/webp`, `application/json`, `text/csv`.

**Android** — system używa MIME przy:
- pobieraniu pliku przez przeglądarkę lub `DownloadManager`,
- udostępnianiu pliku innym aplikacjom przez `FileProvider`,
- rejestrowaniu obsługiwanych typów w `AndroidManifest.xml`.

```xml
<!-- Rejestracja obsługiwanego MIME w AndroidManifest.xml -->
<activity android:name=".OpenFileActivity">
    <intent-filter>
        <action android:name="android.intent.action.VIEW" />
        <category android:name="android.intent.category.DEFAULT" />
        <data android:mimeType="application/json" />
        <data android:mimeType="text/csv" />
    </intent-filter>
</activity>
```

**iOS** — system używa UTI (Uniform Type Identifiers) oraz typów zadeklarowanych w `Info.plist`:

```xml
<!-- Info.plist — deklaracja obsługiwanego UTI -->
<key>CFBundleDocumentTypes</key>
<array>
    <dict>
        <key>CFBundleTypeName</key>
        <string>JSON File</string>
        <key>LSItemContentTypes</key>
        <array>
            <string>public.json</string>
        </array>
        <key>LSHandlerRank</key>
        <string>Alternate</string>
    </dict>
</array>
```

### Rozszerzenia plików

Rozszerzenia plików (`.json`, `.png`, `.mp4`) są konwencją, a nie gwarancją formatu. Zarówno Android, jak i iOS potrafią wykryć rzeczywisty typ pliku przez analizę nagłówka (magic bytes), lecz w praktyce aplikacje opierają się na rozszerzeniu przy wyborze parsera. Błędnie nazwany plik może prowadzić do wyjątków trudnych do debugowania.

## Wybór formatu — kluczowe kryteria

Przed wyborem formatu warto odpowiedzieć na kilka pytań:

```text
Czy dane muszą być czytelne dla człowieka?    → tak → tekst (JSON, YAML, CSV)
                                               → nie → binarne (Protobuf, FlatBuffers)

Czy priorytetem jest rozmiar transferu?        → tak → binarne lub skompresowany tekst (gzip+JSON)
                                               → nie → czytelność ważniejsza

Czy format będzie edytowany ręcznie?           → tak → YAML / TOML / JSON
                                               → nie → cokolwiek

Czy dane są relacyjne?                         → tak → SQLite / Room
                                               → nie → plik płaski

Czy aplikacja wymieniała dane z zewnętrznym API? → tak → JSON (REST) / XML (SOAP) / Protobuf (gRPC)
```

### Trójkąt kompromisów

Wybierając format, balansujemy między trzema właściwościami:

```
           Wydajność
              /\
             /  \
            /    \
           /      \
  Czytelność ——— Kompatybilność
```

- **Wydajność ↔ Czytelność**: Protobuf jest szybki, ale nie do czytania przez człowieka; JSON jest wolniejszy, ale przejrzysty.
- **Wydajność ↔ Kompatybilność**: FlatBuffers są ekstremalne szybkie, ale wymagają wspólnego schematu po obu stronach.
- **Czytelność ↔ Kompatybilność**: YAML jest czytelny, ale jego parsing jest niespójny między implementacjami.

## Przegląd kategorii formatów w aplikacjach mobilnych

Poniższa tabela daje przegląd wszystkich głównych kategorii i kiedy sięgać po każdą z nich:

| Kategoria | Popularne formaty | Przypadki użycia | Artykuł w wiki |
|-----------|-------------------|------------------|----------------|
| Wymiana danych tekstowych | JSON, XML | REST API, konfiguracja, zasoby Android | [json-xml-formats.md](json-xml-formats.md) |
| Lekkie dane i konfiguracja | CSV, YAML, TOML | Dane tabelaryczne, pliki konfiguracyjne | [csv-yaml-toml.md](csv-yaml-toml.md) |
| Obrazy rastrowe | JPEG, PNG, WebP, AVIF, HEIF | Zdjęcia, ikony, grafiki UI | [image-formats-mobile.md](image-formats-mobile.md) |
| Wektory | SVG, VectorDrawable | Ikony skalowalnych rozmiarów | [image-formats-mobile.md](image-formats-mobile.md) |
| Audio | MP3, AAC, OGG, FLAC | Muzyka, efekty dźwiękowe, podcast | *(planowany)* |
| Wideo | MP4 (H.264/H.265), WebM | Materiały wideo, animacje | *(planowany)* |
| 3D i AR | glTF, OBJ, USDZ | Modele AR, sceny 3D | *(planowany)* |
| Machine Learning | TFLite, Core ML, ONNX | Modele AI on-device | *(planowany)* |
| Dokumenty | PDF, DOCX | Wyświetlanie i generowanie dokumentów | *(planowany)* |
| Bazy danych | SQLite, Realm | Lokalne dane relacyjne i obiektowe | [android-data.md](android-data.md) |
| Binarne protokoły | Protocol Buffers, FlatBuffers | gRPC, wydajne API | *(planowany)* |

## Wpływ formatów na rozmiar aplikacji, pamięć i baterię

### Rozmiar aplikacji (APK/IPA)

Zasoby statyczne wbudowane w paczkę aplikacji mają bezpośredni wpływ na jej rozmiar. Obraz PNG, który można zastąpić WebP, może być 2–4× mniejszy przy tej samej jakości wizualnej. Zestaw ikon w formacie wektorowym (VectorDrawable/SVG) może zastąpić wiele wariantów PNG dla różnych gęstości ekranu.

```text
Przykład: ikona 512×512 px
  PNG  : ~120 KB
  WebP : ~45 KB  (−62%)
  SVG  : ~2 KB   (−98%, jeśli grafika nadaje się na wektor)
```

### Zużycie pamięci RAM

Kluczowa zasada: **rozmiar pliku ≠ rozmiar w pamięci**. Zdekodowany obraz JPEG 4 megapiksele zajmuje w RAM-ie ~16 MB (4M pikseli × 4 bajty RGBA), niezależnie od tego, czy plik źródłowy waży 500 KB czy 5 MB.

Formaty tekstowe (JSON, XML) po sparsowaniu tworzą drzewa obiektów, które mogą zajmować wielokrotnie więcej pamięci niż surowy tekst. Odpowiedź JSON o rozmiarze 100 KB po zdekodowaniu do obiektów Kotlin/Swift może zużyć 400–800 KB sterty.

Formaty binarne (Protocol Buffers, FlatBuffers) pozwalają na odczyt bez pełnej deserializacji (lazy decoding), co redukuje szczytowe zużycie RAM-u.

### Zużycie baterii

Format wpływa na baterię przez dwa mechanizmy:

1. **Czas procesora na parsowanie** — wolniejsze parsowanie = dłuższa praca CPU = więcej energii. XML z parsowaniem DOM jest od 3× do 10× wolniejszy niż odpowiednik JSON, który z kolei jest wolniejszy od Protobuf.

2. **Transfer danych przez sieć/Bluetooth** — większy payload = dłuższy transfer = więcej energii. Skompresowanie odpowiedzi JSON gzip-em redukuje jej rozmiar o ~70%, co bezpośrednio przekłada się na czas transferu LTE.

```text
Względne koszty parsowania (orientacyjnie):
  FlatBuffers  : 1×   (odczyt bez kopiowania)
  Protobuf     : 2–3×
  JSON (streaming parser) : 8–12×
  JSON (DOM parser)       : 15–25×
  XML (SAX)               : 20–30×
  XML (DOM)               : 40–60×
```

### Przykład: dobór formatu API pod kątem baterii

Wyobraź sobie aplikację pobierającą listę 1000 produktów co 5 minut:

```kotlin
// ZŁY wybór: nieskompresowany JSON — ~250 KB per request
// LEPSZY wybór: JSON + Content-Encoding: gzip — ~45 KB per request  
// NAJLEPSZY dla baterii: Protobuf — ~30 KB per request, szybsze parsowanie

// Konfiguracja OkHttp z automatyczną dekompresją gzip
val client = OkHttpClient.Builder()
    .addInterceptor { chain ->
        val request = chain.request().newBuilder()
            .header("Accept-Encoding", "gzip")
            .build()
        chain.proceed(request)
    }
    .build()
```

## Kodowanie znaków — często pomijana pułapka

Wszystkie formaty tekstowe zależą od kodowania znaków. Mobilne aplikacje pracujące z wielojęzyczną zawartością powinny konsekwentnie używać **UTF-8**. Typowe problemy:

- Pliki CSV zapisane w Excel domyślnie używają Windows-1250 (polskie znaki, kodowanie łacińskie) — parsowanie jako UTF-8 da błędne wyniki.
- Odpowiedź HTTP bez nagłówka `Content-Type: application/json; charset=utf-8` może być błędnie zinterpretowana przez starszy klient.
- Na Androidzie `FileReader()` używa domyślnego kodowania systemu, które nie zawsze jest UTF-8.

```kotlin
// Zawsze jawnie podawaj kodowanie przy odczycie pliku tekstowego
val content = File(path).readText(Charsets.UTF_8)

// Nigdy nie rób tego (kodowanie zależne od urządzenia):
// val content = File(path).readText()  // ← unika!
```

## Wersjonowanie formatów i kompatybilność wsteczna

Aplikacje mobilne żyją długo. Użytkownik może nie aktualizować przez rok, a format danych lokalnych musi być kompatybilny z nową wersją aplikacji. Kilka zasad:

- **Dodaj pole → kompatybilność wsteczna zachowana** (stara aplikacja ignoruje nowe pole).
- **Usuń pole → brak kompatybilności** (nowa aplikacja nie znajdzie spodziewanego pola).
- **Zmień typ pola → brak kompatybilności** (parser może rzucić wyjątek lub dać błędną wartość).

Protocol Buffers i FlatBuffers mają wbudowane mechanizmy wersjonowania. Dla JSON/CSV warto przechowywać pole `version` i pisać migracje:

```kotlin
data class AppConfig(
    val version: Int = 1,
    val theme: String = "system",
    val language: String = "pl"
)

fun migrateConfig(raw: Map<String, Any>): AppConfig {
    val version = raw["version"] as? Int ?: 0
    return when (version) {
        0 -> AppConfig(
            version = 1,
            theme = raw["darkMode"]?.let { if (it == true) "dark" else "light" } ?: "system"
        )
        else -> AppConfig(
            version = 1,
            theme = raw["theme"] as? String ?: "system",
            language = raw["language"] as? String ?: "pl"
        )
    }
}
```

## Podsumowanie i wskazówki praktyczne

- **Nie optymalizuj przedwcześnie** — zacznij od JSON, który jest czytelny i ma świetne wsparcie narzędzi. Przejdź na Protobuf, gdy zmierzysz rzeczywisty problem z wydajnością.
- **Kompresuj transfer** — włączenie gzip na serwerze często daje więcej niż zmiana formatu.
- **Weryfikuj kodowanie** — zawsze używaj UTF-8 dla danych tekstowych.
- **Stosuj streaming dla dużych plików** — nigdy nie wczytuj pliku >1 MB w całości do pamięci, jeśli nie jest to konieczne.
- **Przechowuj pole wersji** w lokalnych plikach konfiguracyjnych i danych.
- **Testuj na urządzeniach z małą pamięcią** — słabe telefony Android mają 2–3 GB RAM i agresywny OOM killer.

Kolejne artykuły w tej sekcji omawiają szczegółowo: JSON i XML, CSV/YAML/TOML oraz formaty obrazów.
