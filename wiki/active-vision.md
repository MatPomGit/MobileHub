# Active Vision - Aktywna Wizja

Active Vision (aktywna wizja) to paradygmat systemów widzenia komputerowego, w którym sensor wizyjny (kamera, oko) jest aktywnie sterowany - obraca się, przybliża, oddala lub przesuwa - po to, aby dynamicznie zbierać informacje potrzebne do realizacji bieżącego zadania. W odróżnieniu od pasywnych systemów analizy statycznych obrazów, aktywna wizja zakłada sprzężenie między percepcją a działaniem: to, co system „chce zobaczyć", wyznacza, jak przesuwa swoją uwagę wzrokową.

## Geneza i motywacja

Termin *active vision* spopularyzowali Bajcsy (1988) oraz Ballard (1991). Ich obserwacja była prosta: biologiczne systemy wzrokowe nigdy nie są pasywne. Ludzkie oko wykonuje kilka sakad na sekundę, głowa obraca się, żeby śledzić obiekt, a cały organizm dostosowuje pozycję, by uzyskać lepszy widok. Takie zachowanie jest celowe - zbieramy tyle informacji, ile potrzebujemy do danego zadania, zamiast przetwarzać pełne obrazy wysokiej rozdzielczości z każdego możliwego kąta.

### Różnica wobec wizji pasywnej

```
Wizja pasywna:
  Obraz (statyczny) ──► Przetwarzanie ──► Wynik

Wizja aktywna:
  Cel zadania
       │
       ▼
  Sterowanie sensorem ──► Zbieranie danych ──► Przetwarzanie
       ▲                                            │
       └────────────── Sprzężenie zwrotne ──────────┘
```

Kluczowa różnica: w aktywnej wizji decyzja o tym, *co* obserwować, jest równie ważna co decyzja o tym, *jak* przetworzyć obserwację.

## Podstawowe pojęcia

### Sakady i fiksacje

**Sakada** (*saccade*) to szybki ruch gałki ocznej, który przenosi punkt fiksacji z jednego miejsca na drugie. Trwa typowo 20–200 ms. W czasie sakady odbiór informacji wzrokowej jest stłumiony (zjawisko *saccadic suppression*).

**Fiksacja** to stan, w którym oko zatrzymuje się i przetwarza obraz w punkcie zainteresowania. W naturalnym oglądaniu sceny człowiek wykonuje 2–5 fiksacji na sekundę.

```
Ścieżka spojrzenia (scanpath):
  ●──────────●
              \
               ●───────●
                        \
                         ●
  ● = punkt fiksacji
  ─ = sakada
```

### Sterowanie spojrzeniem (gaze control)

W robotyce aktywna wizja jest realizowana przez mechanizmy **sterowania spojrzeniem**:
- **Platformy pan-tilt** - obrót kamery w poziomie (pan) i w pionie (tilt)
- **Aktywne stereowidenie** - niezależne sterowanie dwoma kamerami naśladującymi oczy
- **Zoom adaptacyjny** - dynamiczne przybliżanie regionu zainteresowania
- **Ruchome głowice robotów** - np. iCub, KASPAR, Pepper

## Modele aktywnej wizji

### Model Yarbus (1967)

Alfred Yarbus jako jeden z pierwszych wykazał eksperymentalnie, że ścieżki spojrzenia są zdeterminowane przez cel obserwacji. Oglądając ten sam obraz z różnymi poleceniami (np. „ocen wiek postaci" vs. „zapamiętaj ubrania"), ludzie fiksują zupełnie inne miejsca.

Wniosek: **zadanie wyznacza percepcję**, a nie odwrotnie.

### Model Itti–Koch–Niebur (saliency map)

Klasyczny obliczeniowy model uwagi wzrokowej. Oblicza *mapę wyrazistości* (saliency map) na podstawie cech niskopoziomowych:
- kontrast intensywności
- orientacja krawędzi
- kolor
- ruch

```
Obraz wejściowy
       │
   ┌───┴────────────────────┐
   ▼       ▼           ▼   ▼
 Kolor  Intensywność  Orient. Ruch
   │       │           │     │
   └───────┴─────┬─────┘     │
                 ▼           │
           Saliency Map ◄────┘
                 │
                 ▼
         Punkt fiksacji
```

### Model IOR (Inhibition of Return)

Mechanizm biologiczny zapobiegający powracaniu uwagi do już przebadanych lokalizacji. W systemach robotycznych implementowany jako:
- mapa zakazanych lokalizacji (forbidden map)
- zanik aktywacji po fiksacji (temporal decay)
- priorytety nowości (novelty-driven attention)

## Implementacja w systemach mobilnych i robotycznych

### Biblioteki i frameworki

| Framework | Zastosowanie |
|-----------|-------------|
| OpenCV + tracker | Śledzenie obiektów w czasie rzeczywistym |
| MediaPipe | Detekcja twarzy, punktów zainteresowania |
| ROS2 gaze_control | Sterowanie platformą pan-tilt |
| iKinGazeCtrl (iCub) | Biomechaniczny model sterowania spojrzeniem |
| DeepGaze / SAM | Predykcja punktów fiksacji DNN |

### Przykład: aktywne śledzenie obiektu (Android/CameraX)

```kotlin
class ActiveTrackerAnalyzer(
    private val panTiltController: PanTiltController
) : ImageAnalysis.Analyzer {

    private val detector = ObjectDetection.getClient(
        ObjectDetectorOptions.Builder()
            .setDetectorMode(ObjectDetectorOptions.STREAM_MODE)
            .enableMultipleObjects()
            .build()
    )

    @ExperimentalGetImage
    override fun analyze(imageProxy: ImageProxy) {
        val image = InputImage.fromMediaImage(
            imageProxy.image!!,
            imageProxy.imageInfo.rotationDegrees
        )

        detector.process(image)
            .addOnSuccessListener { objects ->
                val target = objects.maxByOrNull { it.boundingBox.width() }
                target?.let { steerGaze(it.boundingBox, imageProxy.width, imageProxy.height) }
            }
            .addOnCompleteListener { imageProxy.close() }
    }

    private fun steerGaze(box: Rect, imgW: Int, imgH: Int) {
        // Oblicz błąd: odchylenie centrum obiektu od centrum obrazu
        val cx = (box.left + box.right) / 2f
        val cy = (box.top + box.bottom) / 2f
        val errX = (cx - imgW / 2f) / imgW   // zakres -0.5 .. 0.5
        val errY = (cy - imgH / 2f) / imgH

        // Proporcjonalny regulator - sterowanie pan/tilt
        val gain = 0.3f
        panTiltController.adjustPan(-errX * gain)   // ujemne = w lewo
        panTiltController.adjustTilt(-errY * gain)
    }
}
```

### Przykład: mapa wyrazistości (saliency map) w OpenCV/Python

```python
import cv2
import numpy as np

def compute_saliency(frame: np.ndarray) -> np.ndarray:
    """Spektralna resztkowa mapa wyrazistości (Spectral Residual)."""
    saliency = cv2.saliency.StaticSaliencySpectralResidual_create()
    ok, saliency_map = saliency.computeSaliency(frame)
    if not ok:
        return np.zeros(frame.shape[:2], dtype=np.float32)
    return (saliency_map * 255).astype(np.uint8)

def next_fixation(saliency_map: np.ndarray,
                  visited: list[tuple[int, int]],
                  ior_radius: int = 50) -> tuple[int, int]:
    """Zwróć następny punkt fiksacji z IOR (Inhibition of Return)."""
    inhibited = saliency_map.copy().astype(np.float32)
    for (px, py) in visited:
        cv2.circle(inhibited, (px, py), ior_radius, 0, -1)  # wyzeruj odwiedzone
    _, _, _, max_loc = cv2.minMaxLoc(inhibited)
    return max_loc  # (x, y) z najwyższą wyrazistością

# Pętla główna
cap = cv2.VideoCapture(0)
visited_fixations: list[tuple[int, int]] = []

while True:
    ret, frame = cap.read()
    if not ret:
        break

    sal = compute_saliency(frame)
    fx, fy = next_fixation(sal, visited_fixations)
    visited_fixations.append((fx, fy))
    if len(visited_fixations) > 5:       # reset IOR po 5 fiksacjach
        visited_fixations.clear()

    cv2.circle(frame, (fx, fy), 10, (0, 255, 0), 2)
    cv2.imshow("Active Vision", frame)
    if cv2.waitKey(1) & 0xFF == ord('q'):
        break
```

## Modele uwagi opartej na zadaniu (task-driven attention)

Nowoczesne podejścia wykraczają poza wyrazistość niskopoziomową i uwzględniają **kontekst zadania**:

### Deep Gaze (DNN saliency)

Sieci neuronowe wytrenowane na danych śledzenia wzroku (np. MIT Saliency Benchmark) przewidują punkty fiksacji lepiej niż modele ręcznie projektowane:

```python
# Przykład z użyciem modelu TorchScript (on-device inference)
import torch, torchvision.transforms as T
from PIL import Image

model = torch.jit.load("deep_gaze_mobile.ptl")
model.eval()

transform = T.Compose([T.Resize((224, 224)), T.ToTensor(),
                        T.Normalize([0.485, 0.456, 0.406],
                                    [0.229, 0.224, 0.225])])

img = Image.open("scene.jpg")
with torch.no_grad():
    sal_pred = model(transform(img).unsqueeze(0))  # (1,1,H,W)
sal_map = sal_pred.squeeze().numpy()
```

### Attention-guided robotics (ROS2)

```python
# Węzeł ROS2: subskrybuje obraz, publikuje punkt fiksacji
import rclpy
from rclpy.node import Node
from sensor_msgs.msg import Image
from geometry_msgs.msg import Point
from cv_bridge import CvBridge
import cv2

class ActiveVisionNode(Node):
    def __init__(self):
        super().__init__('active_vision')
        self.bridge = CvBridge()
        self.sub = self.create_subscription(Image, '/camera/image_raw',
                                            self.cb, 10)
        self.pub = self.create_publisher(Point, '/gaze/fixation', 10)
        self.saliency = cv2.saliency.StaticSaliencySpectralResidual_create()

    def cb(self, msg):
        frame = self.bridge.imgmsg_to_cv2(msg, 'bgr8')
        ok, sal = self.saliency.computeSaliency(frame)
        if not ok:
            return
        _, _, _, (fx, fy) = cv2.minMaxLoc(sal)
        pt = Point(x=float(fx), y=float(fy), z=0.0)
        self.pub.publish(pt)
```

## Aktywna wizja a uczenie się przez demonstrację (LfD)

W uczeniu ze wzmocnieniem i uczeniu przez imitację aktywna wizja odgrywa rolę:
- **zbierania danych treningowych** - agent uczy się, co obserwować, a nie tylko jak działać
- **attention bottleneck** - polityka oparta na punktach fiksacji jest bardziej odporna na zmianę tła
- **gaze-conditioned imitation** - naśladowanie guru, który fiksuje to samo co robot powinien obserwować

## Zastosowania w aplikacjach mobilnych

| Zastosowanie | Technika |
|-------------|---------|
| Rozszerzona rzeczywistość (AR) | Renderowanie szczegółów tylko w polu widzenia |
| Diagnostyka UX | Heatmapy spojrzeń podczas testów użyteczności |
| Pojazdy autonomiczne | Aktywne śledzenie pieszych i sygnalizacji |
| Teleoperacja robotów | Kamera śledząca wskazywany przez operatora cel |
| Ułatwienia dostępu (eye-tracking) | Sterowanie interfejsem wzrokiem |
| Gry mobilne | Adaptacyjny rendering wg pozycji spojrzenia |

## Ograniczenia i wyzwania

- **Opóźnienie mechaniczne** - platformy pan-tilt mają inercję; latencja > 50 ms degraduje jakość śledzenia
- **Kalibracja** - modelowanie relacji kamera–scena po każdym ruchu
- **Zakłócenia dynamiczne** - sceny z wieloma ruchomymi obiektami powodują „konkurencję" o uwagę
- **Interpretacja intencji** - skąd wiadomo, *na co* patrzeć? Wymaga wiedzy o zadaniu wysokiego poziomu
- **Prywatność** - dane śledzenia wzroku mogą ujawniać informacje o użytkowniku

## Powiązane artykuły

- [Foveated Vision - widzenie fowealne](#wiki-foveated-vision)
- [Modelowanie kognitywne ludzkiej percepcji](#wiki-cognitive-perception)
- [Computer Vision w robotyce mobilnej](#wiki-computer-vision-mobile)
- [Robotyka poznawcza](#wiki-cognitive-robotics)
- [MediaPipe - kompleksowe rozwiązania AI](#wiki-mediapipe-mobile)
- [Sensory ruchu i środowiskowe](#wiki-sensors)
