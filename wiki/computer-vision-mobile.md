# Wizja komputerowa w aplikacjach mobilnych

Wizja komputerowa na urządzeniach mobilnych umożliwia detekcję obiektów, segmentację, klasyfikację i rozpoznawanie tekstu — bez internetu, z niskim opóźnieniem. Kluczem jest wybór właściwego modelu i optymalizacja pod ograniczenia sprzętowe urządzenia.

## Ekosystem narzędzi

Środowisko wizji komputerowej na urządzeniach mobilnych dzieli się na dwie warstwy: biblioteki wysokopoziomowe z gotowymi modelami (ML Kit, Apple Vision) oraz niskopoziomowe środowiska uruchomieniowe umożliwiające wdrożenie własnych modeli (TFLite, ONNX, PyTorch Mobile). Wybór odpowiedniego narzędzia zależy od tego, czy standardowe modele spełniają wymagania projektu, czy konieczne jest trenowanie własnego modelu na dedykowanych danych. Poniższy diagram przedstawia dostępne opcje z podziałem na te dwie kategorie.

```
┌──────────────────────────────────────────────────────────────┐
│                    Computer Vision na Mobile                  │
├────────────────────┬─────────────────────────────────────────┤
│   High-level       │   Low-level / Custom                     │
├────────────────────┼─────────────────────────────────────────┤
│  ML Kit (Google)   │  TFLite (TensorFlow Lite)               │
│  Vision (Apple)    │  ONNX Runtime                           │
│  CreateML          │  PyTorch Mobile                         │
│                    │  MediaPipe (Google)                      │
└────────────────────┴─────────────────────────────────────────┘
```

## ML Kit — gotowe modele bez trenowania

ML Kit od Google oferuje gotowe do użycia modele detekcji, rozpoznawania tekstu, twarzy i wiele innych — bez konieczności trenowania ani wiedzy o sieciach neuronowych. Poniższy przykład pokazuje integrację detekcji obiektów w trybie strumieniowym z `CameraX ImageAnalysis`, gdzie każda klatka z kamery jest automatycznie analizowana. Wynik zawiera prostokąt otaczający wykryty obiekt (`boundingBox`), jego stały identyfikator między klatkami (`trackingId`) oraz etykietę kategorii z poziomem pewności.

```kotlin
// Detekcja obiektów (Object Detection and Tracking)
val options = ObjectDetectorOptions.Builder()
    .setDetectorMode(ObjectDetectorOptions.STREAM_MODE)   // na żywo z kamery
    .enableMultipleObjects()                               // wiele obiektów jednocześnie
    .enableClassification()                                // klasyfikuj (kategoria + confidence)
    .build()

val objectDetector = ObjectDetection.getClient(options)

// W ImageAnalysis.Analyzer
@androidx.camera.core.ExperimentalGetImage
override fun analyze(imageProxy: ImageProxy) {
    val image = InputImage.fromMediaImage(
        imageProxy.image!!,
        imageProxy.imageInfo.rotationDegrees
    )
    objectDetector.process(image)
        .addOnSuccessListener { detectedObjects ->
            detectedObjects.forEach { obj ->
                val box = obj.boundingBox          // Rect w pikselach
                val trackingId = obj.trackingId    // stały ID między klatkami
                val label = obj.labels.maxByOrNull { it.confidence }
                Log.d("CV", "Obiekt #$trackingId: ${label?.text} (${(label?.confidence?.times(100))?.toInt()}%) @ $box")
            }
        }
        .addOnCompleteListener { imageProxy.close() }
}
```

## TFLite — własny model

TensorFlow Lite pozwala uruchomić na urządzeniu mobilnym dowolny model wytrenowany w TensorFlow lub PyTorch (po konwersji), w tym popularne architektury jak YOLOv8 czy EfficientDet. Kluczową optymalizacją jest delegacja obliczeń do GPU, która może przyspieszyć inferencję 3–10-krotnie w porównaniu z CPU. Poniższy kod pokazuje oba podejścia: wygodne API wysokopoziomowe `ObjectDetector` oraz niskopoziomowy `Interpreter` z `GpuDelegate`.

```kotlin
dependencies {
    implementation("org.tensorflow:tensorflow-lite:2.14.0")
    implementation("org.tensorflow:tensorflow-lite-support:0.4.4")
    implementation("org.tensorflow:tensorflow-lite-gpu:2.14.0")       // GPU delegate
    implementation("org.tensorflow:tensorflow-lite-task-vision:0.4.4") // Vision API
}

// Detekcja z własnym modelem YOLO/EfficientDet
class ObjectDetector(context: Context) {
    private val detector = org.tensorflow.lite.task.vision.detector.ObjectDetector.createFromFileAndOptions(
        context,
        "yolov8n.tflite",    // model w assets/
        ObjectDetector.ObjectDetectorOptions.builder()
            .setMaxResults(10)
            .setScoreThreshold(0.5f)
            .setNumThreads(4)
            .build()
    )

    fun detect(bitmap: Bitmap): List<Detection> {
        val image = TensorImage.fromBitmap(bitmap)
        return detector.detect(image)
    }
}

// GPU Delegate — 3-10x szybciej na obsługiwanych urządzeniach
class GpuDetector(context: Context) {
    private val gpuDelegate = GpuDelegate()
    private val interpreter = Interpreter(
        FileUtil.loadMappedFile(context, "model.tflite"),
        Interpreter.Options().apply {
            addDelegate(gpuDelegate)
            numThreads = 2
        }
    )

    // Pamiętaj: GpuDelegate trzeba zamknąć!
    fun close() { gpuDelegate.close(); interpreter.close() }
}
```

## Rysowanie bounding boxes w Compose

Wizualizacja wyników detekcji wymaga narysowania prostokątów i etykiet na warstwie nałożonej na podgląd kamery. W Jetpack Compose robi się to przez composable `Canvas`, który skaluje współrzędne z przestrzeni obrazu do przestrzeni ekranu. Poniższy komponent rysuje kolorowe ramki z półprzezroczystymi tłami etykiet, prawidłowo obsługując różnicę rozdzielczości między strumieniem kamery a widokiem na ekranie.

```kotlin
@Composable
fun DetectionOverlay(
    detections: List<DetectionResult>,
    imageSize: Size,
    modifier: Modifier = Modifier
) {
    Canvas(modifier = modifier.fillMaxSize()) {
        val scaleX = size.width / imageSize.width
        val scaleY = size.height / imageSize.height

        detections.forEach { detection ->
            val box = detection.boundingBox

            // Skaluj bounding box do rozmiarów Canvas
            val left   = box.left   * scaleX
            val top    = box.top    * scaleY
            val right  = box.right  * scaleX
            val bottom = box.bottom * scaleY

            // Ramka
            drawRect(
                color = Color(0xFF00E5FF),
                topLeft = Offset(left, top),
                size = androidx.compose.ui.geometry.Size(right - left, bottom - top),
                style = Stroke(width = 3f)
            )

            // Tło etykiety
            val labelText = "${detection.label} ${"%.0f".format(detection.confidence * 100)}%"
            val textPaint = Paint().apply {
                color = android.graphics.Color.parseColor("#00E5FF")
                textSize = 32f
                isAntiAlias = true
            }
            val textWidth = textPaint.measureText(labelText)
            drawRect(
                color = Color(0xAA000000),
                topLeft = Offset(left, top - 40f),
                size = androidx.compose.ui.geometry.Size(textWidth + 8f, 40f)
            )

            // Tekst etykiety
            drawContext.canvas.nativeCanvas.drawText(
                labelText, left + 4f, top - 8f, textPaint
            )
        }
    }
}

data class DetectionResult(
    val boundingBox: RectF,
    val label: String,
    val confidence: Float
)
```

## MediaPipe — pipeline wizji

MediaPipe Tasks to zestaw gotowych, zoptymalizowanych pipeline'ów do analizy obrazu: detekcja ciała (pose), dłoni, twarzy i połączona (holistic). Działają w trybie strumieniowym z kamery z bardzo niskim opóźnieniem dzięki akceleracji GPU. Poniższy przykład implementuje detektor pozy, który w czasie rzeczywistym wyznacza 33 punkty charakterystyczne sylwetki i oblicza kąt między stawami.

```kotlin
// MediaPipe Tasks — gotowe pipeline'y: pose, hands, face, holistic
dependencies {
    implementation("com.google.mediapipe:tasks-vision:0.10.14")
}

// Detekcja pozy (Pose Landmarker)
class PoseDetector(context: Context) {
    private val landmarker: PoseLandmarker

    init {
        val baseOptions = BaseOptions.builder()
            .setModelAssetPath("pose_landmarker_lite.task")
            .setDelegate(Delegate.GPU)
            .build()

        landmarker = PoseLandmarker.createFromOptions(
            context,
            PoseLandmarker.PoseLandmarkerOptions.builder()
                .setBaseOptions(baseOptions)
                .setRunningMode(RunningMode.LIVE_STREAM)
                .setMinPoseDetectionConfidence(0.5f)
                .setMinTrackingConfidence(0.5f)
                .setResultListener { result, image ->
                    result.landmarks().firstOrNull()?.let { landmarks ->
                        processPoseLandmarks(landmarks)
                    }
                }
                .build()
        )
    }

    private fun processPoseLandmarks(landmarks: List<NormalizedLandmark>) {
        // 33 punkty ciała zgodnie z MediaPipe Pose topology
        val leftShoulder  = landmarks[PoseLandmarker.LEFT_SHOULDER]
        val rightShoulder = landmarks[PoseLandmarker.RIGHT_SHOULDER]
        val leftHip       = landmarks[PoseLandmarker.LEFT_HIP]

        // Kąt ramienia
        val shoulderAngle = calculateAngle(
            leftShoulder.x() to leftShoulder.y(),
            rightShoulder.x() to rightShoulder.y(),
            leftHip.x() to leftHip.y()
        )
        Log.d("Pose", "Kąt ramienia: ${"%.1f".format(shoulderAngle)}°")
    }

    fun detectAsync(imageProxy: ImageProxy) {
        val mpImage = BitmapImageBuilder(imageProxy.toBitmap()).build()
        landmarker.detectAsync(mpImage, imageProxy.imageInfo.timestamp)
        imageProxy.close()
    }

    fun close() = landmarker.close()
}
```

## Optymalizacja modeli — quantization

Kwantyzacja to technika zmniejszania rozmiaru modelu i przyspieszania inferencji przez reprezentację wag z mniejszą precyzją (np. INT8 zamiast Float32). Wymaga kalibracji na reprezentatywnych danych wejściowych, aby skompensować utratę precyzji, ale często skutkuje 4-krotnym zmniejszeniem rozmiaru modelu przy minimalnym spadku dokładności. Poniższy skrypt Pythonowy konwertuje model TensorFlow do formatu TFLite z pełną kwantyzacją INT8 gotową do wdrożenia na urządzeniu mobilnym.

```python
# Python — konwersja i optymalizacja modelu do TFLite
import tensorflow as tf

# Wczytaj oryginalny model (SavedModel lub Keras)
converter = tf.lite.TFLiteConverter.from_saved_model("my_model")

# INT8 quantization — 4x mniejszy model, 2-3x szybszy
converter.optimizations = [tf.lite.Optimize.DEFAULT]
converter.target_spec.supported_ops = [
    tf.lite.OpsSet.TFLITE_BUILTINS_INT8,
    tf.lite.OpsSet.SELECT_TF_OPS
]
# Dane kalibracyjne — reprezentatywne przykłady (bez labelek)
converter.representative_dataset = lambda: (
    [tf.cast(img, tf.float32) / 255.0] for img in calibration_images
)
converter.inference_input_type  = tf.int8
converter.inference_output_type = tf.int8

tflite_model = converter.convert()
with open("model_int8.tflite", "wb") as f:
    f.write(tflite_model)
print(f"Rozmiar: {len(tflite_model)/1024:.0f} KB")
```

| Typ kwantyzacji | Rozmiar | Dokładność | Prędkość |
|----------------|---------|-----------|---------|
| Float32 (brak) | 100% | Bazowa | 1× |
| Float16        | ~50%   | ≈bazowa  | 1.5-2× (GPU) |
| INT8           | ~25%   | -1-2%    | 2-4× (CPU) |
| Binary (1bit)  | ~3%    | -5-15%   | 5-10× |

## Linki

- [ML Kit Vision](https://developers.google.com/ml-kit/vision)
- [TFLite](https://www.tensorflow.org/lite/guide)
- [MediaPipe Tasks](https://developers.google.com/mediapipe/solutions/guide)
- [ONNX Runtime Mobile](https://onnxruntime.ai/docs/tutorials/mobile/)
- [Roboflow — trenowanie i eksport modeli](https://roboflow.com)

---

## Rozpoznawanie tekstu (OCR) — ML Kit Text Recognition v2

ML Kit Text Recognition v2 obsługuje łaciński, chiński, japoński, koreański i devanagari bez konieczności pobierania dodatkowych modeli. Model działa w pełni on-device.

### Konfiguracja

```kotlin
// build.gradle.kts
implementation("com.google.mlkit:text-recognition:16.0.0")
// Dla cyrylicy / innych skryptów:
// implementation("com.google.mlkit:text-recognition-chinese:16.0.0")
```

### Rozpoznawanie z kamery (ImageProxy → InputImage)

```kotlin
class OcrAnalyzer(
    private val onResult: (String) -> Unit
) : ImageAnalysis.Analyzer {

    private val recognizer = TextRecognition.getClient(TextRecognizerOptions.DEFAULT_OPTIONS)

    @androidx.camera.core.ExperimentalGetImage
    override fun analyze(imageProxy: ImageProxy) {
        val mediaImage = imageProxy.image ?: run { imageProxy.close(); return }
        val inputImage = InputImage.fromMediaImage(mediaImage, imageProxy.imageInfo.rotationDegrees)

        recognizer.process(inputImage)
            .addOnSuccessListener { visionText ->
                val fullText = buildString {
                    for (block in visionText.textBlocks) {        // akapit
                        for (line in block.lines) {               // linia
                            for (element in line.elements) {      // słowo
                                append(element.text).append(' ')
                            }
                            appendLine()
                        }
                        appendLine("---")
                    }
                }
                onResult(fullText.trim())
            }
            .addOnCompleteListener { imageProxy.close() }
    }
}
```

### Rozpoznawanie z galerii

```kotlin
fun recognizeFromUri(context: Context, uri: Uri, onResult: (String) -> Unit) {
    val inputImage = InputImage.fromFilePath(context, uri)
    TextRecognition
        .getClient(TextRecognizerOptions.DEFAULT_OPTIONS)
        .process(inputImage)
        .addOnSuccessListener { visionText ->
            onResult(visionText.text)
        }
}
```

### Struktura wynikowa

| Poziom | Klasa ML Kit | Opis |
|--------|-------------|------|
| Blok | `TextBlock` | Akapit lub kolumna tekstu |
| Linia | `Line` | Pojedyncza linia |
| Element | `Element` | Słowo lub token |
| Symbol | `Symbol` | Pojedynczy znak (opcjonalnie) |

Każdy obiekt udostępnia `boundingBox: Rect?` oraz `cornerPoints: Array<Point>?` — można narysować ramki na Canvas w Compose, analogicznie do sekcji o detekcji obiektów.

---

## Segmentacja semantyczna — DeepLab na TFLite

Segmentacja semantyczna przypisuje każdemu pikselowi etykietę klasy (np. „droga", „niebo", „osoba") — w odróżnieniu od detekcji obiektów, która zwraca tylko ramkę. Wynikiem jest maska o rozdzielczości wejściowej.

### Uruchomienie modelu DeepLab v3

```kotlin
class SemanticSegmentor(context: Context) {
    private val MODEL_SIZE = 257   // DeepLab v3 MobileNetV2 257×257
    private val NUM_CLASSES = 21   // Pascal VOC

    private val interpreter = Interpreter(
        FileUtil.loadMappedFile(context, "deeplabv3_257_mv_gpu.tflite"),
        Interpreter.Options().apply { addDelegate(GpuDelegate()) }
    )

    // Zwraca tablicę [MODEL_SIZE * MODEL_SIZE] z indeksami klas
    fun segment(bitmap: Bitmap): IntArray {
        val resized = Bitmap.createScaledBitmap(bitmap, MODEL_SIZE, MODEL_SIZE, true)
        val input   = TensorImage.fromBitmap(resized)

        // Wyjście: [1, 257, 257, 21] — score per klasa
        val outputBuffer = TensorBuffer.createFixedSize(
            intArrayOf(1, MODEL_SIZE, MODEL_SIZE, NUM_CLASSES), DataType.FLOAT32
        )
        interpreter.run(input.buffer, outputBuffer.buffer)

        val scores = outputBuffer.floatArray
        return IntArray(MODEL_SIZE * MODEL_SIZE) { px ->
            (0 until NUM_CLASSES).maxByOrNull { cls -> scores[px * NUM_CLASSES + cls] } ?: 0
        }
    }
}
```

### Wizualizacja maski jako kolorowa nakładka w Compose Canvas

```kotlin
val PASCAL_COLORS = intArrayOf(
    0xFF000000.toInt(), // tło
    0xFF800000.toInt(), // samolot
    0xFF008000.toInt(), // rower
    0xFF808000.toInt(), // ptak
    0xFF000080.toInt(), // łódka
    0xFF800080.toInt(), // butelka
    0xFF008080.toInt(), // autobus
    0xFF808080.toInt(), // samochód
    0xFFC00000.toInt(), // kot
    0xFF40C000.toInt(), // krzesło
    0xFF00C000.toInt(), // krowa
    // … pozostałe 10 klas
)

@Composable
fun SegmentationOverlay(maskIndices: IntArray, modelSize: Int) {
    val maskBitmap = remember(maskIndices) {
        val pixels = IntArray(maskIndices.size) { i ->
            PASCAL_COLORS.getOrElse(maskIndices[i]) { 0x80FF00FF.toInt() }
        }
        Bitmap.createBitmap(pixels, modelSize, modelSize, Bitmap.Config.ARGB_8888)
    }
    Canvas(modifier = Modifier.fillMaxSize()) {
        drawImage(
            image   = maskBitmap.asImageBitmap(),
            dstSize = IntSize(size.width.toInt(), size.height.toInt()),
            alpha   = 0.55f
        )
    }
}
```

Nakładka jest renderowana z `alpha = 0.55f`, dzięki czemu oryginalny obraz z kamery pozostaje widoczny pod kolorową maską. Każda klasa Pascal VOC ma unikalny kolor — użytkownik od razu widzi, które obszary zostały rozpoznane jako droga, ludzie lub pojazdy.

## CameraX — integracja z analizą obrazu

CameraX to biblioteka AndroidX upraszczająca obsługę kamery. Łączy się bezpośrednio z pipeline'em wizji komputerowej przez `ImageAnalysis`:

```kotlin
@Composable
fun CameraVisionPreview(
    onDetections: (List<DetectionResult>) -> Unit
) {
    val context = LocalContext.current
    val lifecycleOwner = LocalLifecycleOwner.current
    val detector = remember { ObjectDetector(context) }

    val preview = Preview.Builder().build()
    val imageAnalyzer = ImageAnalysis.Builder()
        .setTargetResolution(Size(640, 480))
        .setBackpressureStrategy(ImageAnalysis.STRATEGY_KEEP_ONLY_LATEST)
        .setOutputImageFormat(ImageAnalysis.OUTPUT_IMAGE_FORMAT_RGBA_8888)
        .build()
        .also { analysis ->
            analysis.setAnalyzer(Executors.newSingleThreadExecutor()) { imageProxy ->
                val bitmap = imageProxy.toBitmap()
                val results = detector.detect(bitmap)
                onDetections(results)
                imageProxy.close()
            }
        }

    val cameraProviderFuture = remember { ProcessCameraProvider.getInstance(context) }
    AndroidView(
        factory = { ctx ->
            PreviewView(ctx).also { previewView ->
                cameraProviderFuture.addListener({
                    val cameraProvider = cameraProviderFuture.get()
                    preview.setSurfaceProvider(previewView.surfaceProvider)
                    cameraProvider.bindToLifecycle(
                        lifecycleOwner,
                        CameraSelector.DEFAULT_BACK_CAMERA,
                        preview, imageAnalyzer
                    )
                }, ContextCompat.getMainExecutor(ctx))
            }
        },
        modifier = Modifier.fillMaxSize()
    )
}
```

### Porównanie bibliotek wizji komputerowej

| Biblioteka | Modele gotowe | Własny model | Platforma | Konfiguracja |
|------------|--------------|-------------|-----------|-------------|
| **ML Kit** | ✅ Tak | ❌ Nie | Android + iOS | Minimalna |
| **TFLite** | ❌ Nie | ✅ Tak | Android + iOS | Średnia |
| **MediaPipe Tasks** | ✅ Tak | ⚠️ Ograniczone | Android + iOS | Minimalna |
| **ONNX Runtime** | ❌ Nie | ✅ Tak | Android + iOS | Średnia |
| **PyTorch Mobile** | ❌ Nie | ✅ Tak | Android + iOS | Zaawansowana |
| **OpenCV Android** | ❌ Nie | ✅ Tak | Android | Zaawansowana |
