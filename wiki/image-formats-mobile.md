# Formaty obrazów w aplikacjach mobilnych

Obrazy to zazwyczaj największy składnik aplikacji mobilnej pod względem zajmowanej przestrzeni dyskowej i zużycia pamięci RAM. Zły wybór formatu może sprawić, że aplikacja ważąca 30 MB mogłaby ważyć 15 MB, a ekran listy produktów zużywający 400 MB RAM mógłby działać w połowie tej przestrzeni. Znajomość formatów obrazów — ich algorytmów kompresji, wsparcia platformowego i specyficznych zastosowań — jest jedną z kluczowych umiejętności optymalizacyjnych programisty mobilnego.

## Formaty rastrowe

Obrazy rastrowe przechowują dane jako siatkę pikseli. Każdy piksel ma określoną wartość koloru (np. RGBA). Im wyższa rozdzielczość i głębia koloru, tym większy plik i większe zużycie RAM-u.

### JPEG (Joint Photographic Experts Group)

JPEG używa kompresji stratnej opartej na dyskretnej transformacie kosinusowej (DCT). Algorytm usuwa szczegóły wizualne trudne do zauważenia przez ludzkie oko, co pozwala na dramatyczną redukcję rozmiaru.

**Charakterystyka:**
- Kompresja stratna — każdy zapis degraduje jakość,
- Brak kanału alfa (przezroczystości),
- Doskonały do zdjęć i obrazów z gradientami,
- Słaby przy ostrych krawędziach i tekście (artefakty blokowe),
- Szeroka obsługa na wszystkich platformach.

**Ustawienia jakości:** Parametr `quality` (0–100) kontroluje stopień kompresji. W praktyce wartości 75–85 są nieodróżnialne od oryginału dla większości obrazów.

```text
Zdjęcie 3000×2000 px:
  BMP (bez kompresji): ~18 MB
  JPEG quality=95:     ~2.1 MB  (8.5× mniejszy)
  JPEG quality=80:     ~0.9 MB  (20× mniejszy)
  JPEG quality=60:     ~0.5 MB  (36× mniejszy, zauważalne artefakty)
```

### PNG (Portable Network Graphics)

PNG używa kompresji bezstratnej (algorytm Deflate). Jakość obrazu jest zawsze zachowana, ale pliki są znacznie większe niż JPEG.

**Charakterystyka:**
- Kompresja bezstratna — idealna wierna kopia oryginału,
- Pełna obsługa kanału alfa (przezroczystość),
- Doskonały do ikon, elementów UI, tekstu, logo,
- Za duży dla zdjęć fotograficznych,
- Szeroka obsługa na wszystkich platformach.

```text
Logo 512×512 px z przezroczystością:
  PNG-32 (RGBA): ~45 KB
  PNG-8 (256 kolorów): ~12 KB  (zredukowana paleta)
  WebP lossless: ~28 KB
```

### WebP

WebP został opracowany przez Google i wydany w 2010 roku. Oferuje zarówno kompresję stratną (opartą na VP8), jak i bezstratną (VP8L), a od wersji rozszerzonej — animacje.

**Charakterystyka:**
- Stratna WebP jest ~25–35% mniejsza niż JPEG przy tej samej jakości,
- Bezstratna WebP jest ~25% mniejsza niż PNG,
- Obsługa kanału alfa w obu trybach,
- Animacje (zastępuje GIF i animowany PNG),
- **Android**: pełna obsługa od API 17 (Android 4.2), bezstratna+alpha od API 18,
- **iOS**: pełna obsługa od iOS 14.

```kotlin
// Kompresja obrazu do WebP w Kotlinie (Android)
fun Bitmap.toWebP(quality: Int = 80): ByteArray {
    val stream = ByteArrayOutputStream()
    val format = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.R) {
        Bitmap.CompressFormat.WEBP_LOSSY
    } else {
        @Suppress("DEPRECATION")
        Bitmap.CompressFormat.WEBP
    }
    compress(format, quality, stream)
    return stream.toByteArray()
}
```

### AVIF (AV1 Image File Format)

AVIF to format oparty na kodeku wideo AV1, standaryzowany przez Alliance for Open Media. Oferuje najlepszy stosunek jakości do rozmiaru spośród wszystkich popularnych formatów.

**Charakterystyka:**
- Kompresja ~50% lepsza od JPEG, ~20% lepsza od WebP,
- Pełna obsługa HDR i szerokiej gamy kolorów (Wide Color Gamut),
- Kanał alfa, animacje,
- **Android**: pełna obsługa od API 31 (Android 12),
- **iOS**: obsługa od iOS 16,
- Wolniejsze dekodowanie niż JPEG/WebP na słabszym sprzęcie.

### HEIF / HEIC (High Efficiency Image File Format)

HEIF to kontener, a HEIC — konkretny format używający kodeka HEVC (H.265). Stosowany domyślnie przez aparat w iPhone'ach od iOS 11.

**Charakterystyka:**
- ~40–50% mniejszy niż JPEG przy tej samej jakości,
- Pełna obsługa HDR, szerokiej gamy kolorów,
- Sekwencje zdjęć, burst photos, Live Photos,
- **iOS**: natywne wsparcie od iOS 11,
- **Android**: odczyt od API 28 (Android 9), zapis ograniczony,
- Problemy z licencjami patentowymi na niektórych platformach.

```swift
// Konwersja HEIC na JPEG w iOS
import UIKit
import ImageIO

func convertHEICtoJPEG(url: URL, quality: CGFloat = 0.85) -> Data? {
    guard let imageSource = CGImageSourceCreateWithURL(url as CFURL, nil),
          let cgImage = CGImageSourceCreateImageAtIndex(imageSource, 0, nil) else {
        return nil
    }
    let uiImage = UIImage(cgImage: cgImage)
    return uiImage.jpegData(compressionQuality: quality)
}
```

---

## Format wektorowy: SVG i VectorDrawable

### SVG (Scalable Vector Graphics)

SVG jest formatem opartym na XML, opisującym grafikę wektorową za pomocą kształtów geometrycznych i ścieżek. Pliki SVG skalują się do dowolnego rozmiaru bez utraty ostrości.

```xml
<!-- Przykładowa ikona SVG: zaznaczenie (checkmark) -->
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24">
    <path
        d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41L9 16.17z"
        fill="#4CAF50"/>
</svg>
```

Android nie obsługuje SVG natywnie w `ImageView`. Zamiast tego używa się formatu **VectorDrawable** — Androidowego odpowiednika SVG opartego na tym samym systemie ścieżek, ale z rozszerzeniami dla animacji i tematów.

### VectorDrawable (Android)

```xml
<!-- res/drawable/ic_check.xml -->
<vector xmlns:android="http://schemas.android.com/apk/res/android"
    android:width="24dp"
    android:height="24dp"
    android:viewportWidth="24"
    android:viewportHeight="24"
    android:tint="?attr/colorControlNormal">

    <path
        android:fillColor="@android:color/white"
        android:pathData="M9,16.17L4.83,12l-1.42,1.41L9,19 21,7l-1.41,-1.41L9,16.17z"/>
</vector>
```

**Konwersja SVG na VectorDrawable w Android Studio:**
`File → New → Vector Asset → Local file (SVG, PSD)`

**Użycie w Jetpack Compose:**

```kotlin
import androidx.compose.material.icons.Icons
import androidx.compose.material3.Icon
import androidx.compose.ui.res.painterResource

// Wbudowane ikony Material
Icon(
    imageVector = Icons.Default.Check,
    contentDescription = "Zaznaczono",
    tint = MaterialTheme.colorScheme.primary
)

// Własna ikona wektorowa z drawable
Icon(
    painter = painterResource(id = R.drawable.ic_check),
    contentDescription = "Zaznaczono"
)
```

---

## Tabela porównawcza formatów obrazów

| Format | Kompresja | Przezroczystość | Animacja | Android | iOS | Typowe zastosowanie |
|--------|-----------|-----------------|----------|---------|-----|---------------------|
| JPEG | Stratna (DCT) | ❌ | ❌ | API 1+ | iOS 2+ | Zdjęcia, fotografie |
| PNG | Bezstratna | ✅ | ❌ | API 1+ | iOS 2+ | Ikony z alpha, UI, screenshoty |
| WebP (stratny) | Stratna (VP8) | ✅ | ✅ | API 17+ | iOS 14+ | Zdjęcia webowe, miniatury |
| WebP (bezstratny) | Bezstratna | ✅ | ✅ | API 18+ | iOS 14+ | Ikony, grafika UI |
| AVIF | Stratna/bezstratna (AV1) | ✅ | ✅ | API 31+ | iOS 16+ | Zdjęcia premium, HDR |
| HEIF/HEIC | Stratna (HEVC) | ✅ | ✅ | API 28+ (odczyt) | iOS 11+ | Zdjęcia z aparatu iOS |
| GIF | Bezstratna (LZW) | ⚠️ (1-bit) | ✅ | API 1+ | iOS 2+ | Proste animacje (przestarzały) |
| SVG | Wektorowy | ✅ | ⚠️ (SMIL) | ❌ (pośrednio) | ❌ (biblioteki) | Ikony skalowalne |
| VectorDrawable | Wektorowy | ✅ | ✅ (AnimatedVector) | API 21+ | ❌ | Ikony Android |

---

## Wczytywanie obrazów na Androidzie z Coil i Glide

### Coil (Coroutine Image Loader)

Coil to nowoczesna biblioteka do wczytywania obrazów dla Androida, napisana w Kotlinie z pierwszorzędnym wsparciem dla Coroutines i Jetpack Compose.

**Dependency:**

```kotlin
dependencies {
    implementation("io.coil-kt:coil-compose:2.6.0")
    implementation("io.coil-kt:coil-gif:2.6.0")       // wsparcie dla GIF
    implementation("io.coil-kt:coil-svg:2.6.0")        // wsparcie dla SVG
    implementation("io.coil-kt:coil-video:2.6.0")      // miniatury wideo
}
```

**Użycie w Jetpack Compose:**

```kotlin
import coil.compose.AsyncImage
import coil.compose.rememberAsyncImagePainter
import coil.request.ImageRequest

// Podstawowe użycie
AsyncImage(
    model = "https://example.com/photo.webp",
    contentDescription = "Zdjęcie produktu",
    modifier = Modifier
        .fillMaxWidth()
        .height(200.dp),
    contentScale = ContentScale.Crop
)

// Zaawansowane opcje
AsyncImage(
    model = ImageRequest.Builder(LocalContext.current)
        .data("https://example.com/photo.jpg")
        .crossfade(300)
        .placeholder(R.drawable.placeholder_product)
        .error(R.drawable.error_image)
        .size(400, 300)                    // limit rozmiaru dekodowania
        .memoryCacheKey("product_${id}")   // klucz cache
        .diskCachePolicy(CachePolicy.ENABLED)
        .build(),
    contentDescription = "Produkt",
    modifier = Modifier.fillMaxWidth()
)
```

**Konfiguracja globalnego ImageLoadera:**

```kotlin
import coil.ImageLoader
import coil.disk.DiskCache
import coil.memory.MemoryCache

val imageLoader = ImageLoader.Builder(context)
    .memoryCache {
        MemoryCache.Builder(context)
            .maxSizePercent(0.25)   // 25% dostępnego RAM-u
            .build()
    }
    .diskCache {
        DiskCache.Builder()
            .directory(context.cacheDir.resolve("image_cache"))
            .maxSizeBytes(50 * 1024 * 1024)  // 50 MB
            .build()
    }
    .crossfade(true)
    .build()
```

### Glide

Glide to starsze, ale wciąż bardzo popularne rozwiązanie do wczytywania obrazów na Androidzie.

```kotlin
dependencies {
    implementation("com.github.bumptech.glide:glide:4.16.0")
    ksp("com.github.bumptech.glide:ksp:4.16.0")
    implementation("com.github.bumptech.glide:compose:1.0.0-beta01")
}
```

```kotlin
import com.bumptech.glide.compose.GlideImage

// Jetpack Compose
GlideImage(
    model = "https://example.com/photo.jpg",
    contentDescription = "Zdjęcie",
    modifier = Modifier.size(120.dp),
) { requestBuilder ->
    requestBuilder
        .placeholder(R.drawable.placeholder)
        .error(R.drawable.error_image)
        .thumbnail(0.1f)    // najpierw załaduj miniaturę 10%
        .centerCrop()
}
```

---

## Wczytywanie obrazów na iOS z Kingfisher

### Kingfisher

Kingfisher to najpopularniejsza biblioteka do wczytywania obrazów na iOS, pisana w Swifcie.

```swift
// Package.swift lub SPM
// .package(url: "https://github.com/onevcat/Kingfisher.git", from: "7.11.0")
```

**Użycie z SwiftUI:**

```swift
import Kingfisher
import SwiftUI

struct ProductImageView: View {
    let url: URL?

    var body: some View {
        KFImage(url)
            .placeholder {
                ProgressView()
                    .frame(width: 120, height: 120)
            }
            .onFailure { error in
                print("Błąd ładowania obrazu: \(error)")
            }
            .retry(maxCount: 3, interval: .seconds(2))
            .fade(duration: 0.3)
            .resizable()
            .aspectRatio(contentMode: .fill)
            .frame(width: 120, height: 120)
            .clipped()
    }
}
```

**Konfiguracja cache:**

```swift
import Kingfisher

// Konfiguracja przy starcie aplikacji
func configureImageCache() {
    let cache = ImageCache.default

    // Limit pamięci: 100 MB
    cache.memoryStorage.config.totalCostLimit = 100 * 1024 * 1024

    // Limit dysku: 500 MB
    cache.diskStorage.config.sizeLimit = 500 * 1024 * 1024

    // Czas życia cache na dysku: 7 dni
    cache.diskStorage.config.expiration = .days(7)
}

// Pobieranie z niestandardowym przetwarzaniem
let processor = DownsamplingImageProcessor(size: CGSize(width: 200, height: 200))
    |> RoundCornerImageProcessor(cornerRadius: 8)

KFImage(url)
    .setProcessor(processor)
    .cacheOriginalImage()
```

---

## Strategie optymalizacji obrazów dla mobile

### 1. Generowanie miniatur (thumbnail generation)

Nigdy nie wczytuj obrazu 4K do widoku 100×100 dp. Dekodujesz wtedy ~32 MB danych dla wyświetlenia miniaturki:

```kotlin
// Android: dekoduj z próbkowaniem
fun decodeSampledBitmap(
    file: File,
    reqWidth: Int,
    reqHeight: Int
): Bitmap {
    // Najpierw odczytaj wymiary bez dekodowania pikseli
    val options = BitmapFactory.Options().apply {
        inJustDecodeBounds = true
    }
    BitmapFactory.decodeFile(file.absolutePath, options)

    // Oblicz inSampleSize
    options.inSampleSize = calculateInSampleSize(options, reqWidth, reqHeight)
    options.inJustDecodeBounds = false

    return BitmapFactory.decodeFile(file.absolutePath, options)
}

fun calculateInSampleSize(
    options: BitmapFactory.Options,
    reqWidth: Int,
    reqHeight: Int
): Int {
    val (height, width) = options.run { outHeight to outWidth }
    var inSampleSize = 1
    if (height > reqHeight || width > reqWidth) {
        val halfHeight = height / 2
        val halfWidth = width / 2
        while (halfHeight / inSampleSize >= reqHeight &&
               halfWidth / inSampleSize >= reqWidth) {
            inSampleSize *= 2
        }
    }
    return inSampleSize
}
```

### 2. Lazy loading (ładowanie na żądanie)

Obrazy powinny być ładowane dopiero, gdy widok jest widoczny na ekranie. Coil i Kingfisher robią to automatycznie, ale przy własnej implementacji:

```kotlin
// Compose: ObservableScrollState + LazyColumn automatycznie obsługuje lazy loading
LazyColumn {
    items(products) { product ->
        AsyncImage(
            model = product.imageUrl,
            contentDescription = product.name,
            modifier = Modifier
                .fillMaxWidth()
                .height(200.dp)
        )
    }
}
```

### 3. Dobór formatu do kontekstu

```kotlin
// Strategia wyboru formatu przy uploadzie zdjęcia
fun selectOutputFormat(context: UploadContext): Bitmap.CompressFormat {
    return when {
        // Wymagana przezroczystość → WebP bezstratny lub PNG
        context.requiresAlpha -> {
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.R)
                Bitmap.CompressFormat.WEBP_LOSSLESS
            else Bitmap.CompressFormat.PNG
        }
        // Zdjęcie fotograficzne → WebP stratny (nowe urządzenia) lub JPEG
        context.isPhotographic -> {
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.R)
                Bitmap.CompressFormat.WEBP_LOSSY
            else Bitmap.CompressFormat.JPEG
        }
        // Domyślnie → JPEG
        else -> Bitmap.CompressFormat.JPEG
    }
}
```

---

## Wpływ formatów obrazów na zużycie pamięci RAM

Kluczowa zasada: **format pliku nie determinuje zużycia RAM**. Po zdekodowaniu każdy format jest przechowywany jako surowa bitmapa pikseli.

```text
Formuła zużycia RAM:
  szerokość × wysokość × bajty_na_piksel

Bajty na piksel wg konfiguracji:
  ARGB_8888: 4 bajty (domyślny, pełna jakość)
  RGB_565:   2 bajty (bez alpha, lekko gorsza jakość)
  ARGB_4444: 2 bajty (przestarzały, nie używaj)
  HARDWARE:  GPU memory (Android 8+)
```

Przykład:
```text
Zdjęcie 1920×1080 px:
  JPEG 500 KB na dysku → 1920 × 1080 × 4 = ~8 MB w RAM!
  PNG 2 MB na dysku   → 1920 × 1080 × 4 = ~8 MB w RAM!
  
  Rozmiar pliku ≠ zużycie RAM — liczy się rozdzielczość.
```

Możesz zmniejszyć zużycie RAM konfigurując format pikseli:

```kotlin
// Redukcja RAM kosztem jakości koloru (wystarczające dla teł, ikon)
val options = BitmapFactory.Options().apply {
    inPreferredConfig = Bitmap.Config.RGB_565   // 2 bajty zamiast 4
}

// Android 8+ — zrzuć do pamięci GPU (poza heap Javy)
val options = BitmapFactory.Options().apply {
    inPreferredConfig = Bitmap.Config.HARDWARE
}
```

---

## Konwersja między formatami na Androidzie

```kotlin
import android.graphics.Bitmap
import android.graphics.BitmapFactory
import java.io.ByteArrayOutputStream
import java.io.File

data class ConversionResult(
    val data: ByteArray,
    val originalSizeKB: Long,
    val newSizeKB: Long,
    val savingsPercent: Int
)

fun convertImageFormat(
    inputFile: File,
    targetFormat: Bitmap.CompressFormat,
    quality: Int = 85
): ConversionResult {
    val original = BitmapFactory.decodeFile(inputFile.absolutePath)
        ?: throw IllegalArgumentException("Nie można zdekodować pliku: ${inputFile.name}")

    val outputStream = ByteArrayOutputStream()
    original.compress(targetFormat, quality, outputStream)
    val outputBytes = outputStream.toByteArray()

    val originalSize = inputFile.length()
    val newSize = outputBytes.size.toLong()
    val savings = ((originalSize - newSize) * 100 / originalSize).toInt()

    original.recycle()  // Zwolnij pamięć bitmapy

    return ConversionResult(
        data = outputBytes,
        originalSizeKB = originalSize / 1024,
        newSizeKB = newSize / 1024,
        savingsPercent = savings
    )
}

// Użycie:
// val result = convertImageFormat(inputFile, Bitmap.CompressFormat.WEBP_LOSSY, 80)
// println("Oszczędność: ${result.savingsPercent}% (${result.originalSizeKB}KB → ${result.newSizeKB}KB)")
```

**Wsadowa konwersja dla katalogu:**

```kotlin
suspend fun batchConvertToWebP(
    sourceDir: File,
    targetDir: File,
    quality: Int = 80
) = withContext(Dispatchers.IO) {
    targetDir.mkdirs()
    sourceDir.listFiles { f -> f.extension in listOf("jpg", "jpeg", "png") }
        ?.forEach { file ->
            try {
                val result = convertImageFormat(file, Bitmap.CompressFormat.WEBP_LOSSY, quality)
                val outputName = file.nameWithoutExtension + ".webp"
                File(targetDir, outputName).writeBytes(result.data)
                Log.d("Convert", "${file.name}: -${result.savingsPercent}%")
            } catch (e: Exception) {
                Log.e("Convert", "Błąd konwersji ${file.name}: ${e.message}")
            }
        }
}
```

---

## Podsumowanie i wytyczne

Wybór formatu obrazu ma realny wpływ na wydajność, rozmiar aplikacji i wrażenia użytkownika. Kluczowe zasady:

- **Nowe projekty Android**: preferuj **WebP** dla zdjęć i ikon z przezroczystością — mniejszy rozmiar, pełna obsługa od API 18.
- **Wsparcie iOS 14+**: WebP działa na obu platformach — dobry wybór dla projektów cross-platform.
- **Ikony i elementy UI bez przezroczystości**: użyj **VectorDrawable** (Android) lub **SVG przez bibliotekę** (iOS) — skalowalne i mają pomijalny rozmiar.
- **Zdjęcia z aparatu iOS**: obsługuj **HEIC** przy wczytywaniu, konwertuj na JPEG/WebP przed uploadem.
- **Nie optymalizuj zużycia RAM przez format** — optymalizuj przez zmniejszenie rozdzielczości i konfigurację `Bitmap.Config`.
- **Zawsze używaj biblioteki** (Coil, Glide, Kingfisher) do wczytywania obrazów z sieci — ręczna implementacja cache i lazy loadingu jest podatna na błędy.
- **Mierz, nie zgaduj** — użyj Android Profiler lub Instruments (iOS), aby sprawdzić rzeczywiste zużycie pamięci przez obrazy.
