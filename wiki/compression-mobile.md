# Kompresja danych w aplikacjach mobilnych

Kompresja danych odgrywa kluczową rolę w tworzeniu wydajnych aplikacji mobilnych. Ograniczone zasoby urządzeń — pamięć masowa, przepustowość sieci i bateria — sprawiają, że odpowiedni dobór algorytmu kompresji może znacząco poprawić odczucia użytkownika. W tym artykule omówiono najważniejsze algorytmy stosowane w środowisku Android i iOS oraz pokazano, kiedy i jak je stosować.

## Dlaczego kompresja ma znaczenie na urządzeniach mobilnych

Telefony i tablety pracują w warunkach, które nie są typowe dla serwerów czy komputerów stacjonarnych:

- **Pamięć masowa** — użytkownicy często mają urządzenia z 32–128 GB, a aplikacje rywalizują o każdy megabajt. Duże pliki danych, obrazy i zasoby gier mogą szybko wyczerpać dostępne miejsce.
- **Transfer danych** — plany mobilne mają limity danych. Mniejszy rozmiar pliku oznacza krótszy czas pobierania i niższe koszty dla użytkownika.
- **Bateria** — kompresja zmniejsza ilość danych przesyłanych przez radio (Wi-Fi/LTE), co jest energochłonną operacją. Mniejszy transfer = dłuższy czas pracy na baterii.
- **Pamięć operacyjna** — dane przechowywane w pamięci podręcznej zajmują mniej miejsca w RAM, gdy są skompresowane.

## Kompresja stratna a bezstratna

| Typ | Opis | Zastosowanie |
|-----|------|--------------|
| **Bezstratna (lossless)** | Oryginalne dane możliwe do odtworzenia w 100% | Pliki binarne, kod, bazy danych |
| **Stratna (lossy)** | Część danych jest odrzucana nieodwracalnie | Obrazy (JPEG), audio (MP3), wideo (H.264) |

W kontekście plików aplikacji, konfiguracji, danych użytkownika i zasobów strukturalnych **zawsze** stosuje się kompresję bezstratną. Stratna jest domeną multimediów.

## Algorytmy bezstratne — przegląd

### ZIP / DEFLATE

DEFLATE to kombinacja algorytmu LZ77 i kodowania Huffmana. ZIP to najpopularniejszy format kontenera używający DEFLATE. W ekosystemie Android:

- Każdy plik `.apk` to archiwum ZIP
- `assets/` i `res/` wewnątrz APK mogą być skompresowane (poza pewnymi wyjątkami jak `.png`, `.mp4`)
- Java i Kotlin mają wbudowane klasy `ZipInputStream` / `ZipOutputStream`

```kotlin
import java.io.File
import java.util.zip.ZipEntry
import java.util.zip.ZipInputStream
import java.util.zip.ZipOutputStream

// Kompresja pliku do archiwum ZIP
fun compressToZip(sourceFile: File, zipFile: File) {
    ZipOutputStream(zipFile.outputStream().buffered()).use { zos ->
        ZipEntry(sourceFile.name).also { entry ->
            zos.putNextEntry(entry)
        }
        sourceFile.inputStream().buffered().use { input ->
            input.copyTo(zos)
        }
        zos.closeEntry()
    }
}

// Dekompresja pierwszego pliku z archiwum ZIP
fun extractFirstFromZip(zipFile: File, destDir: File): File? {
    ZipInputStream(zipFile.inputStream().buffered()).use { zis ->
        val entry = zis.nextEntry ?: return null
        val outFile = File(destDir, entry.name)
        outFile.outputStream().buffered().use { out ->
            zis.copyTo(out)
        }
        zis.closeEntry()
        return outFile
    }
}
```

### ZSTD (Zstandard)

Opracowany przez Facebook (Meta), Zstandard oferuje najlepszy balans między stopniem kompresji a prędkością wśród nowoczesnych algorytmów. Jest domyślnym algorytmem w Android Asset Packing od Androida 12+ (APKM/AAPK).

**Zalety:**
- Poziomy kompresji od 1 (super szybki) do 22 (maksymalna kompresja)
- Możliwość trenowania słownika (dictionary training) dla małych plików
- Bardzo szybka dekompresja (~1 GB/s)

```kotlin
// build.gradle.kts
// implementation("com.github.luben:zstd-jni:1.5.5-11")

import com.github.luben.zstd.Zstd
import com.github.luben.zstd.ZstdInputStream
import com.github.luben.zstd.ZstdOutputStream
import java.io.File

// Kompresja tablicy bajtów
fun compressWithZstd(data: ByteArray, level: Int = 3): ByteArray {
    return Zstd.compress(data, level)
}

// Dekompresja tablicy bajtów
fun decompressWithZstd(compressed: ByteArray, originalSize: Long): ByteArray {
    return Zstd.decompress(compressed, originalSize.toInt())
}

// Kompresja strumieniowa (dla dużych plików)
fun compressFileWithZstd(source: File, dest: File, level: Int = 3) {
    source.inputStream().buffered().use { input ->
        ZstdOutputStream(dest.outputStream(), level).use { zstdOut ->
            input.copyTo(zstdOut)
        }
    }
}

// Dekompresja strumieniowa
fun decompressFileWithZstd(source: File, dest: File) {
    ZstdInputStream(source.inputStream()).use { zstdIn ->
        dest.outputStream().buffered().use { out ->
            zstdIn.copyTo(out)
        }
    }
}
```

### LZ4

LZ4 jest zoptymalizowany pod kątem **ekstremalnej prędkości dekompresji** kosztem nieco gorszego współczynnika kompresji. Idealny w sytuacjach, gdy szybkość jest ważniejsza niż rozmiar:

- **Gry mobilne** — ładowanie assetów z pamięci lub sieci
- **Pamięć podręczna** — kompresja cache w RAM (np. oktetów obrazów)
- **Logi aplikacji** — szybkie buforowanie logów przed wysłaniem

```kotlin
// build.gradle.kts
// implementation("org.lz4:lz4-java:1.8.0")

import net.jpountz.lz4.LZ4Factory

fun compressWithLZ4(data: ByteArray): ByteArray {
    val factory = LZ4Factory.fastestInstance()
    val compressor = factory.fastCompressor()
    val maxCompressedLength = compressor.maxCompressedLength(data.size)
    val compressed = ByteArray(maxCompressedLength)
    val compressedLength = compressor.compress(data, 0, data.size, compressed, 0, maxCompressedLength)
    return compressed.copyOf(compressedLength)
}

fun decompressWithLZ4(compressed: ByteArray, originalSize: Int): ByteArray {
    val factory = LZ4Factory.fastestInstance()
    val decompressor = factory.fastDecompressor()
    val restored = ByteArray(originalSize)
    decompressor.decompress(compressed, 0, restored, 0, originalSize)
    return restored
}
```

### Brotli

Algorytm Google zaprojektowany z myślą o kompresji tekstu i treści HTTP. Używany w:

- Nagłówku `Content-Encoding: br` w odpowiedziach HTTP
- Aktualizacjach OTA (Over-The-Air) w systemie Android
- Kompresji zasobów webowych w aplikacjach hybrydowych

```kotlin
// Brotli jest wbudowany w Android API 31+
// Dla starszych wersji: implementation("org.brotli:dec:0.1.2")

import android.os.Build
import org.brotli.dec.BrotliInputStream
import java.io.ByteArrayInputStream

fun decompressBrotli(compressed: ByteArray): ByteArray {
    return if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) {
        // Android 12+ — natywna obsługa przez android.util.apk.ApkSignatureSchemeV2Verifier
        // lub przez OkHttp automatycznie przy Content-Encoding: br
        BrotliInputStream(ByteArrayInputStream(compressed)).use { it.readBytes() }
    } else {
        BrotliInputStream(ByteArrayInputStream(compressed)).use { it.readBytes() }
    }
}
```

### LZMA / XZ

LZMA (Lempel–Ziv–Markov chain Algorithm) osiąga **najwyższy stopień kompresji** wśród popularnych algorytmów, ale kosztem wysokiego zużycia CPU i RAM oraz wolnej kompresji. Format XZ to kontener używający LZMA2.

**Kiedy stosować:**
- Pakiety instalacyjne (`.apk`, `.ipa`) — kompresja jednorazowa, dekompresja rzadko
- Duże pliki zasobów pobieranych jednorazowo przy pierwszym uruchomieniu
- Archiwa z dokumentacją lub bazami wiedzy

```kotlin
// implementation("org.tukaani:xz:1.9")

import org.tukaani.xz.XZInputStream
import org.tukaani.xz.XZOutputStream
import org.tukaani.xz.LZMA2Options
import java.io.File

fun compressWithXZ(source: File, dest: File) {
    val options = LZMA2Options(LZMA2Options.PRESET_DEFAULT) // poziom 6
    source.inputStream().use { input ->
        XZOutputStream(dest.outputStream(), options).use { xzOut ->
            input.copyTo(xzOut)
        }
    }
}

fun decompressXZ(source: File, dest: File) {
    XZInputStream(source.inputStream()).use { xzIn ->
        dest.outputStream().use { out ->
            xzIn.copyTo(out)
        }
    }
}
```

## Tabela porównawcza algorytmów

| Algorytm | Stopień kompresji | Prędkość kompresji | Prędkość dekompresji | Zużycie CPU | Zastosowanie mobilne |
|----------|-------------------|-------------------|----------------------|-------------|----------------------|
| **ZIP/DEFLATE** | Średni | Średnia | Średnia | Średnie | APK, archiwa ogólne |
| **ZSTD** | Wysoki | Szybka | Bardzo szybka | Niskie–średnie | Asset bundles, OTA, sieć |
| **LZ4** | Niski–średni | Bardzo szybka | Ekstremalnie szybka | Bardzo niskie | Cache, gry, logi |
| **Brotli** | Wysoki (tekst) | Wolna | Szybka | Średnie | HTTP, zasoby webowe |
| **LZMA/XZ** | Bardzo wysoki | Bardzo wolna | Wolna | Bardzo wysokie | Pakiety instalacyjne |

## Wskazówki praktyczne

### Kiedy kompresować w spoczynku (at rest) vs w tranzycie (in transit)

**Kompresja w spoczynku** (pliki na dysku):
- Dane pobierane rzadko, ale zajmujące dużo miejsca
- Zasoby gier, bazy wiedzy, archiwa dokumentów
- Użyj ZSTD lub LZMA w zależności od wymaganej szybkości dostępu

**Kompresja w tranzycie** (sieć):
- Negocjuj `Accept-Encoding: br, gzip` z serwerem — zostaw to bibliotece (OkHttp robi to automatycznie)
- Nigdy nie kompresuj ręcznie przed wysłaniem przez HTTPS — TLS ma własną kompresję (choć jej stosowanie jest rzadsze ze względu na CRIME/BREACH)

### Unikanie podwójnej kompresji

Kompresowanie już skompresowanych danych jest bezcelowe i kosztowne:

```kotlin
// ŹLE — próba kompresji ZIP w ZSTD
val zipData = readZipFile()
val doubleCompressed = Zstd.compress(zipData) // prawie brak zysku, strata czasu CPU

// DOBRZE — bezpośrednia kompresja surowych danych
val rawData = readRawData()
val compressed = Zstd.compress(rawData)
```

Typowe formaty **już skompresowane** (nie kompresuj ponownie): JPEG, PNG (już deflate), MP3/AAC/MP4, ZIP, APK, JAR.

### Kompresja strumieniowa

Dla dużych plików (>10 MB) zawsze używaj wersji strumieniowych, aby uniknąć wczytywania całości do pamięci:

```kotlin
// Strumieniowa kompresja z progress callback
fun compressLargeFile(
    source: File,
    dest: File,
    onProgress: (bytesRead: Long, totalBytes: Long) -> Unit
) {
    val totalBytes = source.length()
    var bytesRead = 0L
    val buffer = ByteArray(8192)

    ZstdOutputStream(dest.outputStream(), 3).use { zstdOut ->
        source.inputStream().use { input ->
            var read: Int
            while (input.read(buffer).also { read = it } != -1) {
                zstdOut.write(buffer, 0, read)
                bytesRead += read
                onProgress(bytesRead, totalBytes)
            }
        }
    }
}
```

## Kompresja w praktyce Android

### APK Split i Android App Bundle

Android App Bundle (`.aab`) używa wewnętrznie ZSTD do kompresji modułów. System Google Play dynamicznie tworzy zoptymalizowane APK dla każdego urządzenia (APK Split), kompresując tylko niezbędne zasoby:

```kotlin
// build.gradle.kts
android {
    bundle {
        abi { enableSplit = true }
        density { enableSplit = true }
        language { enableSplit = true }
    }
}
```

### OTA Update i Delta Patching

Android używa algorytmu **bsdiff** (oparty na BZip2) oraz **Puffin** do generowania małych paczek delta aktualizacji. Zamiast przesyłać całą nową wersję APK, wysyłany jest tylko patch różnicowy.

### Asset Bundles w grach

Unity (na Androidzie) i Unreal Engine używają własnych formatów asset bundles, które wewnętrznie stosują LZ4 (szybkie ładowanie) lub LZMA (małe pobieranie):

```kotlin
// Przykład wyboru kompresji w Unity build settings
// Chunk-based LZ4 — szybkie ładowanie z dysku
// LZMA — mniejszy rozmiar do pobrania, dekompresja przy pierwszym uruchomieniu

// W kodzie Androida: własny asset bundle z LZ4
fun loadCompressedAsset(context: Context, assetName: String): ByteArray {
    val compressed = context.assets.open(assetName).readBytes()
    val originalSize = // zapisany jako pierwsze 4 bajty lub w manifeście
        ByteBuffer.wrap(compressed, 0, 4).int
    return decompressWithLZ4(compressed.drop(4).toByteArray(), originalSize)
}
```

## Podsumowanie

Dobór algorytmu kompresji powinien wynikać z konkretnych wymagań:

- **Szybkość > rozmiar** → LZ4
- **Balans** → ZSTD (domyślny wybór dla nowych projektów)
- **Tekst / HTTP** → Brotli
- **Maksymalna kompresja, rzadki dostęp** → LZMA/XZ
- **Kompatybilność i prostota** → ZIP/DEFLATE

Pamiętaj: najlepsza kompresja to ta, która nie kompresuje danych, które są już skompresowane, i nie spowalnia aplikacji bardziej, niż zaoszczędzone bajty są warte.
