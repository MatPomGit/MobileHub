# Foveated Vision - Widzenie Fowealne

Foveated Vision (widzenie fowealne) to model widzenia wzorowany na budowie siatkówki oka, w którym rozdzielczość przetwarzanego obrazu jest zróżnicowana przestrzennie: najwyższa w centralnym punkcie fiksacji (odpowiadającym **fovea centralis**), a stopniowo malejąca ku peryferiom. Podejście to pozwala drastycznie zmniejszyć ilość przetwarzanych danych bez utraty percepcyjnie istotnych informacji.

## Anatomia oka a model obliczeniowy

### Fovea centralis

Fovea to centralne zagłębienie siatkówki, zawierające wyłącznie czopki (fotoreceptory barwne, odpowiedzialne za ostrość). Obejmuje zaledwie **2° kąta widzenia**, lecz odpowiada za większość świadomej percepcji wzrokowej. Poza foveą gęstość czopków gwałtownie spada, a dominują pręciki - odpowiedzialne za widzenie w niskim oświetleniu i detekcję ruchu.

```
Rozkład rozdzielczości w oku ludzkim:

         Peryferia   Parafowea   Fovea
kąt:     >10°        2–10°       0–2°
Czopki:  rzadkie     umiarkowane gęste
Ostrość: niska       średnia     maksymalna

Wizualizacja przestrzenna:
  ████▓▓▒░░░░░░░░░░░░░░░░░░░░░░
  █ Centrum = pełna rozdzielczość
  ▒ Peryferie = rosnące rozmycie
```

### Odpowiednik obliczeniowy

W systemach komputerowych foveated rendering / foveated processing oznacza, że:
- obszar wokół **punktu fiksacji** (foveal region) jest przetwarzany z pełną rozdzielczością
- **parafovealna** strefa - z umiarkowaną rozdzielczością
- **peryferyczna** strefa - z niską rozdzielczością lub uproszczonym przetwarzaniem

```
┌──────────────────────────────────────────────────────┐
│                                                      │
│   ░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░  │
│   ░░░░░░▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒░░░░░░░░░░░  │
│   ░░░▒▒▒▒▒████████████████████▒▒▒▒▒▒▒░░░░░░░░░  │
│   ░░░▒▒▒████▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓███▒▒▒▒░░░░░░░░░  │
│   ░░▒▒▒███▓▓▓▓▓▓  ★  ▓▓▓▓▓▓███▒▒▒░░░░░░░░░  │
│   ░░░▒▒▒████▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓████▒▒▒░░░░░░░░░  │
│   ░░░░▒▒▒▒████████████████████▒▒▒▒░░░░░░░░░░░  │
│   ░░░░░░░▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒░░░░░░░░░░░░  │
│   ░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░  │
│                         ★ = punkt fiksacji          │
└──────────────────────────────────────────────────────┘
  ██ = pełna rozdzielczość  ▒▒ = średnia  ░░ = niska
```

## Matematyczny model foveacji

### Log-polar transform

Najpopularniejszą matematyczną formalizacją fovei jest **przekształcenie log-biegunowe** (log-polar transform):

```
(x, y) → (log(r), θ)
gdzie r = √(x² + y²),  θ = atan2(y, x)
```

Przekształcenie to kompresuje peryferia (duże r → mały przyrost log r), a zachowuje centrum z wysoką rozdzielczością.

```python
import cv2
import numpy as np

def log_polar_fovea(frame: np.ndarray,
                    cx: int, cy: int,
                    M: float = 40.0) -> np.ndarray:
    """
    Przekształcenie log-polarne względem punktu fiksacji (cx, cy).
    M - parametr magnification factor (im większy, tym silniejszy efekt fovei).
    """
    h, w = frame.shape[:2]
    maxR = np.sqrt(max(cx, w - cx)**2 + max(cy, h - cy)**2)
    shifted = np.roll(frame, (h//2 - cy, w//2 - cx), axis=(0, 1))
    lp = cv2.logPolar(shifted, (w//2, h//2), M, cv2.INTER_LINEAR | cv2.WARP_FILL_OUTLIERS)
    return lp

# Użycie
frame = cv2.imread("scene.jpg")
foveal = log_polar_fovea(frame, cx=320, cy=240)
cv2.imshow("Log-Polar Fovea", foveal)
```

### Model Gaussowski (foveated blurring)

Prostszy model: rozmycie Gaussowskie, którego sigma rośnie proporcjonalnie do odległości od centrum fiksacji:

```python
def foveated_blur(image: np.ndarray,
                  fix_x: int, fix_y: int,
                  fovea_radius: int = 60,
                  max_sigma: float = 15.0) -> np.ndarray:
    h, w = image.shape[:2]
    result = image.copy()

    # Mapa odległości od punktu fiksacji
    ys, xs = np.mgrid[0:h, 0:w]
    dist = np.sqrt((xs - fix_x)**2 + (ys - fix_y)**2)

    # Sigma rośnie liniowo poza fovea_radius
    sigma_map = np.clip((dist - fovea_radius) / (max(h, w) / 2) * max_sigma, 0, max_sigma)

    # Progresywne rozmycie - kilka stref
    for sigma in [3, 6, 10, 15]:
        mask = (sigma_map >= sigma - 1.5) & (sigma_map < sigma + 1.5)
        if mask.any():
            blurred = cv2.GaussianBlur(image, (0, 0), sigma)
            result[mask] = blurred[mask]

    return result
```

## Foveated Rendering w XR i grach mobilnych

### Problem przepustowości GPU

Urządzenia VR/AR renderują dwie klatki 90+ Hz w rozdzielczości 2K–4K na każde oko. Bez optymalizacji to kilkakrotnie więcej niż większość mobilnych GPU może obsłużyć.

**Foveated rendering** rozwiązuje ten problem:
- tylko **foveal region** (centrum spojrzenia) jest renderowany w pełnej rozdzielczości
- peryferia - w niskiej rozdzielczości (2×–8× mniejsza)
- całkowity koszt renderingu spada o **30–70%** bez zauważalnej utraty jakości

```
Bez foveated rendering:
  GPU: 100% klatek × pełna rozdzielczość = 100% obciążenia

Z foveated rendering (eye-tracking):
  Fovea  (~3% pola): 100% rozdzielczości → ~3% GPU
  Śródpole (~20%):    50% rozdzielczości → ~5% GPU
  Peryferia (~77%):   25% rozdzielczości → ~5% GPU
  Łącznie: ~13% GPU zamiast 100%
```

### Eye-tracked Foveated Rendering (ETFR)

Wymaga śledzenia spojrzenia w czasie rzeczywistym:

```kotlin
// Przykład z OpenXR + Oculus Eye Tracking (Meta Quest Pro)
class FoveatedRenderer(private val xrSession: XrSession) {

    fun submitFrame(frame: XrFrame) {
        // Pobierz pozycję spojrzenia
        val gazeState = xrSession.locateEyeGaze()
        val gazeDirection = gazeState.gazeDirection  // Vector3f

        // Oblicz punkt fiksacji na płaszczyźnie renderingu
        val fixationUV = projectGazeToScreenUV(gazeDirection)

        // Przekaż do shadera jako uniform
        renderPass.setFoveationCenter(fixationUV)

        // Shader automatycznie skaluje rozdzielczość wg odległości od centrum
        frame.submit()
    }
}
```

```glsl
// Fragment shader - foveated quality falloff
uniform vec2 u_fixation;   // punkt fiksacji w UV [0,1]
uniform float u_fovRadius; // promień fovei w UV
uniform sampler2D u_hires;
uniform sampler2D u_lores;

void main() {
    float dist = length(v_uv - u_fixation);
    float t = smoothstep(u_fovRadius, u_fovRadius * 2.5, dist);
    gl_FragColor = mix(texture2D(u_hires, v_uv),
                       texture2D(u_lores, v_uv), t);
}
```

### Fixed Foveated Rendering (FFR)

Jeśli brak eye-trackera, centrum fovei jest stałe (środek ekranu). Stosowane w Quest 2, Meta Quest 3, Apple Vision Pro:

```xml
<!-- AndroidManifest.xml - włączenie FFR w Oculus SDK -->
<meta-data
    android:name="com.samsung.android.vr.application.mode"
    android:value="vr_only" />
```

```kotlin
// Oculus VRAPI - stały foveated rendering
val layerFlags = VRAPI_FRAME_LAYER_FLAG_FIXED_TO_VIEW or
                 VRAPI_FRAME_LAYER_FLAG_CHROMATIC_ABERRATION_CORRECTION
frameLayer.apply {
    this.flags = layerFlags
    foveationLevel = VRAPI_FOVEATION_LEVEL_HIGH
    foveationType = VRAPI_FOVEATION_TYPE_FIXED
}
```

## Foveated Vision w sieciach neuronowych

### Foveal CNN (zhierarchizowana percepcja)

Sieci neuronowe inspirowane fovealną budową oka przetwarzają centralny region z wysoką rozdzielczością i peryferia z niską:

```python
import torch
import torch.nn as nn
import torchvision.transforms.functional as TF

class FovealFeatureExtractor(nn.Module):
    """
    Dwustrumień CNN: centralny (wysoka rozdzielczość) + peryferyczny (niska).
    """
    def __init__(self):
        super().__init__()
        self.foveal_encoder = nn.Sequential(
            nn.Conv2d(3, 64, 3, padding=1), nn.ReLU(),
            nn.Conv2d(64, 128, 3, padding=1), nn.ReLU(),
            nn.AdaptiveAvgPool2d(8)
        )
        self.peripheral_encoder = nn.Sequential(
            nn.Conv2d(3, 32, 3, padding=1), nn.ReLU(),
            nn.Conv2d(32, 64, 3, padding=1), nn.ReLU(),
            nn.AdaptiveAvgPool2d(8)
        )
        self.fusion = nn.Linear(128*64 + 64*64, 512)

    def forward(self, image: torch.Tensor, fix_y: int, fix_x: int):
        # Wytnij region fovealny (crop wokół punktu fiksacji)
        foveal_crop = TF.crop(image, fix_y - 56, fix_x - 56, 112, 112)
        foveal_crop = TF.resize(foveal_crop, [112, 112])

        # Pełen obraz w niskiej rozdzielczości jako tło peryferyczne
        peripheral = TF.resize(image, [56, 56])

        f = self.foveal_encoder(foveal_crop).flatten(1)
        p = self.peripheral_encoder(peripheral).flatten(1)
        return self.fusion(torch.cat([f, p], dim=1))
```

### Foveation jako augmentacja danych

W trenowaniu modeli vision można stosować foveację jako formę augmentacji:

```python
def foveated_augmentation(image: np.ndarray,
                           fix_x: int | None = None,
                           fix_y: int | None = None) -> np.ndarray:
    h, w = image.shape[:2]
    if fix_x is None:
        fix_x = np.random.randint(w // 4, 3 * w // 4)
    if fix_y is None:
        fix_y = np.random.randint(h // 4, 3 * h // 4)
    return foveated_blur(image, fix_x, fix_y,
                         fovea_radius=40, max_sigma=12.0)
```

## Zastosowania

### Diagnostyka i okulografika

**Okulografia** (eye-tracking) łączona z analizą fovealną umożliwia:
- diagnostykę degeneracji plamki żółtej (AMD)
- ocenę chorób neurodegeneracyjnych (ALS, Parkinson) przez odchylenia sakad
- analizę trudności w czytaniu (dysleksja)

```
Normalny wzorzec sakad (czytanie):
  ●──►●──►●──►●
          ▲
       regresja

Wzorzec przy dysleksji:
  ●──►●◄─●──►●◄─●──►●
     częstsze regresje, dłuższe fiksacje
```

### Interfejsy sterowane wzrokiem (gaze UI)

```kotlin
// Tobii Gaze SDK - Android (uproszczony przykład)
class GazeInputManager(context: Context) {
    private val gazeController = TobiiGazeController(context)

    fun startGazeInput(callback: (Float, Float) -> Unit) {
        gazeController.subscribe { gazePoint ->
            // gazePoint.x, gazePoint.y w pikselach ekranu
            callback(gazePoint.x, gazePoint.y)
        }
    }
}

// Użycie w Activity
gazeInputManager.startGazeInput { gx, gy ->
    // Podświetl przycisk pod spojrzeniem
    highlightButtonAt(gx, gy)
    // Po 800 ms fiksacji - aktywuj
    dwellTimer.restart(gx, gy, thresholdMs = 800) { activateAt(gx, gy) }
}
```

### Kompresja wideo zorientowana na percepcję

H.265/HEVC i AV1 wspierają **foveated compression**: QP (Quantization Parameter) rośnie dla peryferiów, zmniejszając rozmiar pliku przy zachowaniu jakości w centrum:

```
Mapa jakości kadrów wideo:
  ┌────────────────────────────────┐
  │  QP=40  QP=36  QP=32  QP=36  │  ← wysoki QP = większa kompresja
  │  QP=36  QP=28  QP=20  QP=28  │
  │  QP=32  QP=20  QP=10  QP=20  │  ← centrum = najlepsza jakość
  │  QP=36  QP=28  QP=20  QP=28  │
  │  QP=40  QP=36  QP=32  QP=36  │
  └────────────────────────────────┘
```

## Porównanie: foveated vision vs. pełna rozdzielczość

| Aspekt | Pełna rozdzielczość | Foveated Vision |
|--------|--------------------|--------------------|
| GPU/CPU | 100% | 15–40% |
| Pamięć | 100% | 20–50% |
| Jakość w centrum | Maksymalna | Maksymalna |
| Jakość na peryferiach | Pełna | Obniżona |
| Percepcja użytkownika | Brak artefaktów | Niezauważalna utrata jakości |
| Eye-tracking wymagany | Nie | Tak (ETFR) lub Nie (FFR) |
| Zastosowanie | Zdjęcia, precyzyjna analiza | VR/AR, streaming, mobile |

## Foveated Vision na urządzeniach mobilnych

### Foveated Decode (streaming adaptacyjny)

Serwery wideo mogą przesyłać kafelkowane strumienie o różnej jakości; klient pobiera kafelek centralny w pełnej jakości, pozostałe - w niskiej:

```kotlin
// Przykład - adaptacyjny downloader kafelków (HLS-like)
data class TilePriority(val tileId: Int, val priority: Float)

fun computeTilePriorities(gazeX: Float, gazeY: Float,
                           tilesX: Int, tilesY: Int): List<TilePriority> {
    val priorities = mutableListOf<TilePriority>()
    for (ty in 0 until tilesY) {
        for (tx in 0 until tilesX) {
            val tileCx = (tx + 0.5f) / tilesX
            val tileCy = (ty + 0.5f) / tilesY
            val dist = Math.hypot((tileCx - gazeX).toDouble(),
                                   (tileCy - gazeY).toDouble()).toFloat()
            // Priorytet maleje z odległością - centrum najważniejsze
            priorities.add(TilePriority(ty * tilesX + tx, 1f / (1f + dist * 4)))
        }
    }
    return priorities.sortedByDescending { it.priority }
}
```

### Foveated Inference (szybsze wnioskowanie AI)

Uruchomienie modelu detekcji obiektów tylko na centralnym wycinku obrazu:

```kotlin
class FoveatedDetector(private val model: ObjectDetector) {

    fun detect(fullBitmap: Bitmap, focusX: Float, focusY: Float): List<Detection> {
        val cropSize = 320  // rozdzielczość foveal crop
        val left  = ((focusX * fullBitmap.width)  - cropSize / 2).toInt().coerceIn(0, fullBitmap.width  - cropSize)
        val top   = ((focusY * fullBitmap.height) - cropSize / 2).toInt().coerceIn(0, fullBitmap.height - cropSize)

        val crop = Bitmap.createBitmap(fullBitmap, left, top, cropSize, cropSize)
        val rawDetections = model.detect(crop)

        // Przetłumacz współrzędne z croppu na pełny obraz
        return rawDetections.map { det ->
            det.copy(boundingBox = det.boundingBox.offset(left, top))
        }
    }
}
```

## Ograniczenia i wyzwania

- **Latencja eye-trackera** - opóźnienie > 20 ms powoduje widoczne artefakty (tzw. *foveation lag*)
- **Kalibracja** - indywidualne różnice w anatomii oka wymagają kalibracji per-użytkownik
- **Ruch głowy vs. ruch oczu** - system musi rozróżniać sakady od ruchów głowy
- **Efekt aureoli** (*halo artifact*) - ostra granica strefy fovealnej może być zauważalna przy szybkich sakadach
- **Wrażliwość peryferyczna na ruch** - oko wykrywa ruch na peryferiach; zbyt mocna degradacja ujawnia artefakty ruchu

## Powiązane artykuły

- [Active Vision - aktywna wizja](#wiki-active-vision)
- [Modelowanie kognitywne ludzkiej percepcji](#wiki-cognitive-perception)
- [XR i rozszerzona rzeczywistość](#wiki-xr-mobile)
- [VR mobilne i Google Cardboard](#wiki-vr-mobile)
- [ARCore - zaawansowane techniki](#wiki-arcore-advanced)
- [GPU i renderowanie grafiki](#wiki-gpu-rendering)
- [Wyświetlacze i technologie ekranów](#wiki-display-screen)
