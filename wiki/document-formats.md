# Formaty dokumentów w aplikacjach mobilnych

Aplikacje mobilne coraz częściej muszą nie tylko wyświetlać, ale też generować, edytować i eksportować dokumenty w różnych formatach. Zrozumienie struktury popularnych formatów — PDF, EPUB, DOCX, Markdown i innych — pozwala wybrać właściwe narzędzie do konkretnego zadania oraz uniknąć typowych pułapek związanych z kompatybilnością i prywatnością.

## PDF — Portable Document Format

### Struktura pliku PDF

PDF to format stworzony przez Adobe, którego specyfikacja jest teraz otwartym standardem ISO 32000. Plik PDF składa się z:

- **Nagłówka** (`%PDF-1.x` lub `%PDF-2.0`) — wersja formatu
- **Ciała** — obiektów (słowniki, strumienie, tablice) opisujących treść
- **Tabeli odwołań (xref table)** — mapa offsetów obiektów umożliwiająca losowy dostęp
- **Stopki (trailer)** — wskaźnik na tabelę xref i katalog dokumentu

**PDF/A** to podzbiór PDF przeznaczony do archiwizacji (ISO 19005). Wymaga m.in. osadzenia wszystkich czcionek i zakazuje szyfrowania — gwarantuje długotrwałą czytelność bez zewnętrznych zależności.

### Generowanie PDF w Androidzie — PdfDocument API

Android udostępnia klasę `android.graphics.pdf.PdfDocument` do tworzenia prostych dokumentów PDF bez zewnętrznych bibliotek:

```kotlin
import android.graphics.Canvas
import android.graphics.Color
import android.graphics.Paint
import android.graphics.pdf.PdfDocument
import android.graphics.pdf.PdfDocument.PageInfo
import java.io.File
import java.io.FileOutputStream

fun generateSimpleReport(
    title: String,
    lines: List<String>,
    outputFile: File
) {
    val document = PdfDocument()
    val paint = Paint().apply { isAntiAlias = true }
    val pageInfo = PageInfo.Builder(595, 842, 1).create() // A4 w punktach

    val page = document.startPage(pageInfo)
    val canvas: Canvas = page.canvas

    // Tytuł
    paint.apply {
        color = Color.BLACK
        textSize = 24f
        isFakeBoldText = true
    }
    canvas.drawText(title, 40f, 60f, paint)

    // Linia oddzielająca
    paint.apply {
        isFakeBoldText = false
        strokeWidth = 1f
        color = Color.GRAY
    }
    canvas.drawLine(40f, 75f, 555f, 75f, paint)

    // Treść
    paint.apply {
        textSize = 12f
        color = Color.BLACK
    }
    var yPosition = 110f
    lines.forEach { line ->
        canvas.drawText(line, 40f, yPosition, paint)
        yPosition += 20f
        if (yPosition > 800f) {
            // TODO: obsługa wielu stron
        }
    }

    document.finishPage(page)

    FileOutputStream(outputFile).use { fos ->
        document.writeTo(fos)
    }
    document.close()
}
```

Dla bardziej zaawansowanych potrzeb (tabele, obrazy, czcionki TrueType) warto sięgnąć po bibliotekę **iText7** lub **Apache PDFBox**.

### Wyświetlanie PDF — PdfRenderer

Od API 21 Android oferuje `PdfRenderer` do renderowania stron PDF na bitmapy:

```kotlin
import android.graphics.Bitmap
import android.graphics.pdf.PdfRenderer
import android.os.ParcelFileDescriptor
import android.widget.ImageView
import java.io.File

fun renderPdfPage(pdfFile: File, pageIndex: Int, imageView: ImageView) {
    val fileDescriptor = ParcelFileDescriptor.open(
        pdfFile, ParcelFileDescriptor.MODE_READ_ONLY
    )
    val renderer = PdfRenderer(fileDescriptor)
    val page = renderer.openPage(pageIndex)

    val bitmap = Bitmap.createBitmap(
        page.width * 2,   // 2x dla lepszej jakości na ekranach Retina
        page.height * 2,
        Bitmap.Config.ARGB_8888
    )
    page.render(bitmap, null, null, PdfRenderer.Page.RENDER_MODE_FOR_DISPLAY)
    imageView.setImageBitmap(bitmap)

    page.close()
    renderer.close()
    fileDescriptor.close()
}
```

## EPUB — Electronic Publication

### Struktura formatu EPUB

EPUB 3 (specyfikacja IDPF/W3C) to archiwum ZIP o ściśle określonej strukturze:

```
book.epub (ZIP)
├── mimetype                    ← "application/epub+zip" (nieskompresowany, pierwszy)
├── META-INF/
│   └── container.xml           ← wskazuje lokalizację pliku OPF
└── OEBPS/
    ├── content.opf             ← manifest, metadata, kolejność rozdziałów (spine)
    ├── toc.ncx                 ← spis treści (EPUB 2) / nav.xhtml (EPUB 3)
    ├── chapter01.xhtml         ← treść w formacie XHTML
    ├── chapter02.xhtml
    ├── styles/
    │   └── main.css
    └── images/
        └── cover.jpg
```

Plik `content.opf` jest kluczowy — zawiera metadane Dublin Core (`dc:title`, `dc:creator`) oraz manifest wszystkich plików i ich kolejność odczytu (spine).

### Czytanie EPUB na Androidzie

Najpopularniejsza biblioteka to **epublib** lub **r2-streamer** (Readium):

```kotlin
// Przykład z epublib (nl.siegmann.epublib:epublib-core:3.1)
import nl.siegmann.epublib.epub.EpubReader
import nl.siegmann.epublib.domain.Book
import java.io.File

fun openEpub(file: File): Book {
    val reader = EpubReader()
    return file.inputStream().use { stream ->
        reader.readEpub(stream)
    }
}

fun getChapterText(book: Book, chapterIndex: Int): String {
    val resource = book.spine.getSpineReference(chapterIndex).resource
    return String(resource.data, Charsets.UTF_8)
}
```

## DOCX / XLSX — Office Open XML

### Struktura formatu

DOCX i XLSX to archiwa ZIP zgodne ze standardem OOXML (ISO/IEC 29500). Rozpakowując plik `.docx`, znajdziemy:

```
document.docx (ZIP)
├── [Content_Types].xml
├── _rels/.rels
└── word/
    ├── document.xml    ← główna treść w XML
    ├── styles.xml      ← style akapitów i znaków
    ├── settings.xml
    └── media/
        └── image1.png
```

### Apache POI na Androidzie

Apache POI umożliwia odczyt i zapis plików Office. Uwaga: pełna biblioteka jest duża (~15 MB), dlatego na Androidzie używa się okrojonej wersji **poi-ooxml** lub alternatywy **docx4j**:

```kotlin
// implementation("org.apache.poi:poi-ooxml:5.2.3")

import org.apache.poi.xwpf.usermodel.XWPFDocument
import org.apache.poi.xwpf.usermodel.XWPFParagraph
import java.io.File
import java.io.FileInputStream
import java.io.FileOutputStream

fun readDocxText(file: File): String {
    FileInputStream(file).use { fis ->
        val document = XWPFDocument(fis)
        return document.paragraphs.joinToString("\n") { it.text }
    }
}

fun createSimpleDocx(outputFile: File, title: String, content: String) {
    val document = XWPFDocument()

    // Tytuł
    val titlePara: XWPFParagraph = document.createParagraph()
    titlePara.createRun().apply {
        setText(title)
        isBold = true
        fontSize = 16
    }

    // Treść
    val contentPara: XWPFParagraph = document.createParagraph()
    contentPara.createRun().setText(content)

    FileOutputStream(outputFile).use { fos ->
        document.write(fos)
    }
    document.close()
}
```

### Odczyt XLSX

```kotlin
import org.apache.poi.xssf.usermodel.XSSFWorkbook
import java.io.File
import java.io.FileInputStream

fun readXlsxSheet(file: File, sheetIndex: Int = 0): List<List<String>> {
    FileInputStream(file).use { fis ->
        val workbook = XSSFWorkbook(fis)
        val sheet = workbook.getSheetAt(sheetIndex)
        return sheet.map { row ->
            row.map { cell -> cell.toString() }
        }
    }
}
```

## RTF — Rich Text Format

RTF to starszy format Microsoftu (1987), bazujący na czystym tekście z sekwencjami sterującymi `\rtf1`, `\b`, `\i` itp. Mimo wieku pozostaje powszechny w:

- Załącznikach e-mail
- Prostych edytorach tekstu (Notatnik, TextEdit)
- Systemach zarządzania dokumentami prawniczymi

Android nie ma wbudowanej obsługi RTF. Można użyć biblioteki **rtf-parser** lub skonwertować RTF do HTML przed wyświetleniem przez WebView.

## Markdown

### Standard CommonMark

Markdown to format zapisu tekstu sformatowanego przy użyciu zwykłych znaków ASCII (`#`, `**`, `_`, `` ` ``). Standard **CommonMark** (commonmark.org) definiuje precyzyjną specyfikację eliminującą niejednoznaczności oryginalnego Markdowna Johna Grubera.

### Renderowanie Markdown w aplikacji mobilnej

```kotlin
// implementation("io.noties.markwon:core:4.6.2")
// implementation("io.noties.markwon:ext-tables:4.6.2")
// implementation("io.noties.markwon:image-coil:4.6.2")

import android.widget.TextView
import io.noties.markwon.Markwon
import io.noties.markwon.ext.tables.TablePlugin
import io.noties.markwon.image.coil.CoilImagesPlugin

fun renderMarkdown(textView: TextView, markdownText: String) {
    val markwon = Markwon.builder(textView.context)
        .usePlugin(TablePlugin.create(textView.context))
        .usePlugin(CoilImagesPlugin.create(textView.context))
        .build()

    markwon.setMarkdown(textView, markdownText)
}
```

W iOS renderowanie Markdown możliwe jest natywnie od iOS 15 przez `AttributedString`:

```swift
import SwiftUI

struct MarkdownView: View {
    let markdownText: String

    var body: some View {
        if let attributed = try? AttributedString(
            markdown: markdownText,
            options: .init(interpretedSyntax: .inlineOnlyPreservingWhitespace)
        ) {
            Text(attributed)
        }
    }
}
```

## HTML jako format dokumentu

HTML może pełnić rolę przenośnego formatu dokumentów — szczególnie gdy docelowym "czytnikiem" jest WebView lub drukarka:

```kotlin
import android.print.PrintAttributes
import android.print.PrintManager
import android.webkit.WebView
import android.webkit.WebViewClient

fun printHtmlDocument(webView: WebView, htmlContent: String, jobName: String) {
    webView.webViewClient = object : WebViewClient() {
        override fun onPageFinished(view: WebView, url: String) {
            val printManager = webView.context
                .getSystemService(PrintManager::class.java)
            val printAdapter = webView.createPrintDocumentAdapter(jobName)
            printManager.print(
                jobName,
                printAdapter,
                PrintAttributes.Builder().build()
            )
        }
    }
    webView.loadDataWithBaseURL(null, htmlContent, "text/html", "UTF-8", null)
}
```

## Tabela porównawcza formatów dokumentów

| Format | Edytowalny | Przeszukiwalny | Wsparcie mobilne | Typowe zastosowanie |
|--------|-----------|----------------|------------------|---------------------|
| **PDF** | Ograniczone | Tak (tekst) | Doskonałe (PdfRenderer) | Raporty, faktury, archiwa |
| **PDF/A** | Nie | Tak | Doskonałe | Archiwizacja długoterminowa |
| **EPUB** | Tak | Tak | Dobre (biblioteki) | E-booki, dokumentacja |
| **DOCX** | Tak | Tak | Częściowe (Apache POI) | Dokumenty biurowe |
| **XLSX** | Tak | Tak | Częściowe (Apache POI) | Tabele, raporty danych |
| **RTF** | Tak | Tak | Słabe (biblioteki) | Proste dokumenty, legacy |
| **Markdown** | Tak | Tak | Dobre (Markwon) | Dokumentacja, notatki |
| **HTML** | Tak | Tak | Doskonałe (WebView) | Treść webowa, drukowanie |

## Wybór formatu eksportu w aplikacji

Przy projektowaniu funkcji eksportu dokumentu warto zadać następujące pytania:

1. **Czy odbiorca musi edytować plik?** → DOCX/XLSX
2. **Czy ważna jest wierność wizualna i przenośność?** → PDF
3. **Czy to tekst przepływający (np. e-book)?** → EPUB
4. **Czy to treść do wyświetlenia w przeglądarce/WebView?** → HTML
5. **Czy to notatki/dokumentacja developerska?** → Markdown

## Prywatność — metadane w dokumentach

Pliki PDF i Office mogą zawierać ukryte metadane, które mogą ujawnić wrażliwe informacje:

### Metadane w plikach PDF

- Autor, data utworzenia, data modyfikacji
- Nazwa oprogramowania (np. "Microsoft Word 2019")
- Historia edycji (ślady rewizji)
- GPS z urządzenia, jeśli PDF pochodzi z zeskanowanego zdjęcia

### Metadane w plikach DOCX

- Ścieżka do pliku na komputerze autora
- Nazwa użytkownika systemu
- Historia zmian z nazwiskami autorów
- Komentarze (widoczne i usunięte)

### Jak oczyszczać metadane w Androidzie

```kotlin
import org.apache.poi.xwpf.usermodel.XWPFDocument
import java.io.File

fun stripDocxMetadata(inputFile: File, outputFile: File) {
    val document = XWPFDocument(inputFile.inputStream())

    // Usuń właściwości core (autor, temat, słowa kluczowe)
    document.properties.coreProperties.apply {
        creator = ""
        lastModifiedByUser = ""
        setCreated(null)
        setModified(null)
        description = ""
        keywords = ""
    }

    // Usuń właściwości rozszerzone
    document.properties.extendedProperties.props.apply {
        company = ""
        manager = ""
    }

    document.write(outputFile.outputStream())
    document.close()
}
```

### Dobre praktyki dotyczące prywatności

- Przed udostępnieniem dokumentu zawsze sprawdź i wyczyść metadane
- Rozważ wyświetlenie użytkownikowi ostrzeżenia: "Ten plik zawiera metadane: autor, data utworzenia..."
- Przy generowaniu PDF raportów — nie dodawaj zbędnych metadanych
- Dla najwyższej prywatności: eksportuj do PDF bez metadanych lub konwertuj do zwykłego tekstu

## Podsumowanie

Wybór formatu dokumentu w aplikacji mobilnej to kompromis między możliwościami edycji, wiernością wizualną, rozmiarem pliku i prywatnością. PDF dominuje w scenariuszach "tylko do odczytu" i archiwizacji, DOCX/XLSX gdy wymagana jest edycja, a Markdown i HTML sprawdzają się w treściach dynamicznych. Zawsze pamiętaj o metadanych — mogą nieświadomie ujawnić więcej, niż zamierzasz.
