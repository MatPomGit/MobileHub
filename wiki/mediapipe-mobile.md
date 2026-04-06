# MediaPipe — kompleksowe rozwiązania AI

## Streszczenie

Artykuł omawia MediaPipe — framework Google do budowy wielomodalnych potoków AI na Androidzie, iOS i w przeglądarce. Opisano architekturę Tasks API, gotowe rozwiązania z zakresu wizji komputerowej (Face Detection, Hand Landmarker, Pose Landmarker, Image Segmentation, Object Detection), przetwarzania tekstu (Text Classification, Language Detection) oraz audio (Audio Classification). Przedstawiono integrację z CameraX i AVFoundation, tworzenie własnych grafów w C++ oraz LLM Inference API do uruchamiania lokalnych modeli językowych.

**Słowa kluczowe:** MediaPipe, Tasks API, Face Landmarker, Hand Landmarker, Pose Landmarker, Image Segmentation, Object Detection, CameraX, AVFoundation, LLM Inference, TFLite, on-device AI, potok AI

---

## 1. Czym jest MediaPipe?

MediaPipe to otwartoźródłowy framework Google do budowy wielomodalnych, wieloplatformowych potoków przetwarzania danych w czasie rzeczywistym. Umożliwia uruchamianie modeli AI bezpośrednio na urządzeniu mobilnym — bez konieczności połączenia z serwerem — przy wysokiej wydajności i niskich opóźnieniach.

### 1.1 Ewolucja frameworka

MediaPipe przeszedł w latach 2022–2024 istotną transformację:

| Era | Podejście | API |
|---|---|---|
| Pre-2022 | Grafy C++ + kalkulatory | MediaPipe Graphs (niskopoziomowe) |
| 2022+ | Gotowe rozwiązania wysokopoziomowe | **MediaPipe Tasks API** |
| 2023+ | Lokalne LLM | **LLM Inference API** |

Obecnie zalecane podejście to **MediaPipe Tasks API** — zestaw gotowych, zoptymalizowanych komponentów wywoływanych przez SDK dla Androida, iOS, Pythona i JavaScript.

### 1.2 Architektura Tasks API

```
┌─────────────────────────────────────────────────────────┐
│                   MediaPipe Tasks SDK                   │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  │
│  │   Vision     │  │    Text      │  │    Audio     │  │
│  │ FaceDetect   │  │ TextClassify │  │ AudioClassify│  │
│  │ HandLandmark │  │ LangDetect   │  │              │  │
│  │ PoseLandmark │  │ NLClassifier │  │              │  │
│  │ ImgSegment   │  └──────────────┘  └──────────────┘  │
│  │ ObjDetect    │                                       │
│  └──────────────┘                                       │
│         │                                               │
│  ┌──────┴────────────────────────────────────────────┐  │
│  │          TensorFlow Lite Runtime + GPU Delegate   │  │
│  └───────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────┘
```

Każdy task przyjmuje dane wejściowe (obraz, tekst, audio), przetwarza je przez zoptymalizowany model TFLite i zwraca ustrukturyzowane wyniki (obiekty, współrzędne, etykiety).

### 1.3 Dodawanie zależności — Android

```kotlin
// build.gradle.kts (module)
dependencies {
    // Vision tasks
    implementation("com.google.mediapipe:tasks-vision:0.10.14")
    // Text tasks
    implementation("com.google.mediapipe:tasks-text:0.10.14")
    // Audio tasks
    implementation("com.google.mediapipe:tasks-audio:0.10.14")
    // LLM Inference
    implementation("com.google.mediapipe:tasks-genai:0.10.14")
}
```

### 1.4 Dodawanie zależności — iOS (CocoaPods)

```ruby
# Podfile
target 'MyApp' do
  pod 'MediaPipeTasksVision', '~> 0.10.14'
  pod 'MediaPipeTasksText',   '~> 0.10.14'
  pod 'MediaPipeTasksAudio',  '~> 0.10.14'
  pod 'MediaPipeTasksGenAI',  '~> 0.10.14'
end
```

---

## 2. Tryby działania i klasy bazowe

Każdy task MediaPipe obsługuje trzy tryby działania:

| Tryb | Użycie | Opis |
|---|---|---|
| `IMAGE` | Zdjęcia, pliki | Pojedynczy obraz, synchroniczne wywołanie |
| `VIDEO` | Pliki wideo | Klatki z timestampem, synchroniczne |
| `LIVE_STREAM` | Kamera na żywo | Asynchroniczne, callback dla każdej klatki |

```kotlin
// Przykład konfiguracji trybu IMAGE
val options = FaceLandmarkerOptions.builder()
    .setBaseOptions(
        BaseOptions.builder()
            .setModelAssetPath("face_landmarker.task")
            .setDelegate(Delegate.GPU)  // lub CPU
            .build()
    )
    .setRunningMode(RunningMode.IMAGE)
    .setNumFaces(2)
    .build()
```

---

## 3. Vision — detekcja i analiza twarzy

### 3.1 Face Detection

Face Detection wykrywa prostokąty otaczające twarze (bounding boxes) oraz 6 punktów charakterystycznych (oczu, uszu, nosa, ust).

```kotlin
// FaceDetectorHelper.kt
class FaceDetectorHelper(private val context: Context) {

    private val detector: FaceDetector

    init {
        val options = FaceDetectorOptions.builder()
            .setBaseOptions(
                BaseOptions.builder()
                    .setModelAssetPath("blaze_face_short_range.tflite")
                    .setDelegate(Delegate.GPU)
                    .build()
            )
            .setMinDetectionConfidence(0.5f)
            .setRunningMode(RunningMode.LIVE_STREAM)
            .setResultListener { result, inputImage ->
                processDetections(result, inputImage)
            }
            .setErrorListener { error ->
                Log.e("FaceDetector", "Błąd detekcji: ${error.message}")
            }
            .build()
        detector = FaceDetector.createFromOptions(context, options)
    }

    fun detectAsync(bitmap: Bitmap, frameTime: Long) {
        val mpImage = BitmapImageBuilder(bitmap).build()
        detector.detectAsync(mpImage, frameTime)
    }

    private fun processDetections(result: FaceDetectorResult, image: MPImage) {
        result.detections().forEach { detection ->
            val box = detection.boundingBox()
            Log.d("Face", "Twarz: x=${box.left}, y=${box.top}, " +
                "w=${box.width()}, h=${box.height()}, " +
                "score=${detection.categories()[0].score()}")
        }
    }

    fun close() = detector.close()
}
```

### 3.2 Face Landmarker — 478 punktów twarzy

Face Landmarker dostarcza siatkę 478 punktów charakterystycznych twarzy (Face Mesh), umożliwiając precyzyjne śledzenie geometrii twarzy, wyrażeń mimicznych i efektów AR.

```kotlin
// FaceLandmarkerHelper.kt
class FaceLandmarkerHelper(
    private val context: Context,
    private val listener: LandmarkerListener
) {

    interface LandmarkerListener {
        fun onResults(result: FaceLandmarkerResult, inferenceTime: Long)
        fun onError(error: String)
    }

    private val landmarker: FaceLandmarker

    init {
        val options = FaceLandmarkerOptions.builder()
            .setBaseOptions(
                BaseOptions.builder()
                    .setModelAssetPath("face_landmarker.task")
                    .setDelegate(Delegate.GPU)
                    .build()
            )
            .setOutputFaceBlendshapes(true)   // 52 blendshapes do animacji AR
            .setOutputFacialTransformationMatrixes(true)
            .setNumFaces(1)
            .setMinFaceDetectionConfidence(0.5f)
            .setMinFacePresenceConfidence(0.5f)
            .setMinTrackingConfidence(0.5f)
            .setRunningMode(RunningMode.LIVE_STREAM)
            .setResultListener { result, _ ->
                val inferenceTime = SystemClock.uptimeMillis()
                listener.onResults(result, inferenceTime)
            }
            .setErrorListener { error -> listener.onError(error.message ?: "Nieznany błąd") }
            .build()
        landmarker = FaceLandmarker.createFromOptions(context, options)
    }

    fun detectAsync(bitmap: Bitmap, frameTime: Long) {
        val mpImage = BitmapImageBuilder(bitmap).build()
        landmarker.detectAsync(mpImage, frameTime)
    }

    fun close() = landmarker.close()
}

// Obsługa wyników — rysowanie siatki 478 punktów
fun drawFaceMesh(canvas: Canvas, result: FaceLandmarkerResult, imageWidth: Int, imageHeight: Int) {
    result.faceLandmarks().forEach { landmarks ->
        // Rysuj punkty
        landmarks.forEach { landmark ->
            val x = landmark.x() * imageWidth
            val y = landmark.y() * imageHeight
            canvas.drawCircle(x, y, 2f, dotPaint)
        }
        // Rysuj połączenia z FaceLandmarker.FACE_LANDMARKS_CONNECTORS
        FaceLandmarker.FACE_LANDMARKS_CONNECTORS.forEach { connector ->
            val start = landmarks[connector.start()]
            val end = landmarks[connector.end()]
            canvas.drawLine(
                start.x() * imageWidth, start.y() * imageHeight,
                end.x() * imageWidth,   end.y() * imageHeight,
                linePaint
            )
        }
    }
}
```

---

## 4. Vision — śledzenie dłoni i postawy ciała

### 4.1 Hand Landmarker — 21 punktów dłoni

Hand Landmarker wykrywa i śledzi 21 punktów na każdej dłoni w czasie rzeczywistym, umożliwiając rozpoznawanie gestów i sterowanie interfejsem.

```kotlin
// HandLandmarkerHelper.kt
class HandLandmarkerHelper(private val context: Context) {

    private val landmarker: HandLandmarker

    init {
        val options = HandLandmarkerOptions.builder()
            .setBaseOptions(
                BaseOptions.builder()
                    .setModelAssetPath("hand_landmarker.task")
                    .setDelegate(Delegate.GPU)
                    .build()
            )
            .setNumHands(2)
            .setMinHandDetectionConfidence(0.5f)
            .setMinHandPresenceConfidence(0.5f)
            .setMinTrackingConfidence(0.5f)
            .setRunningMode(RunningMode.LIVE_STREAM)
            .setResultListener(::handleResult)
            .build()
        landmarker = HandLandmarker.createFromOptions(context, options)
    }

    private fun handleResult(result: HandLandmarkerResult, image: MPImage) {
        result.handedness().forEachIndexed { index, handedness ->
            val hand = handedness[0].categoryName()  // "Left" lub "Right"
            val landmarks = result.landmarks()[index]

            // Punkt 8 = czubek palca wskazującego
            val indexTip = landmarks[HandLandmark.INDEX_FINGER_TIP]
            Log.d("Hand", "$hand: palec wskazujący = (${indexTip.x()}, ${indexTip.y()})")
        }
    }

    fun detectAsync(bitmap: Bitmap, frameTime: Long) {
        landmarker.detectAsync(BitmapImageBuilder(bitmap).build(), frameTime)
    }

    fun close() = landmarker.close()
}
```

Punkty HandLandmarker (numery 0–20):

```
WRIST(0) → THUMB_CMC(1) → THUMB_MCP(2) → THUMB_IP(3) → THUMB_TIP(4)
         → INDEX_FINGER_MCP(5) → PIP(6) → DIP(7) → TIP(8)
         → MIDDLE_FINGER_MCP(9) → PIP(10) → DIP(11) → TIP(12)
         → RING_FINGER_MCP(13) → PIP(14) → DIP(15) → TIP(16)
         → PINKY_MCP(17) → PIP(18) → DIP(19) → TIP(20)
```

### 4.2 Pose Landmarker — 33 punkty postawy ciała

```kotlin
// PoseLandmarkerHelper.kt
class PoseLandmarkerHelper(private val context: Context) {

    private val landmarker: PoseLandmarker

    init {
        val options = PoseLandmarkerOptions.builder()
            .setBaseOptions(
                BaseOptions.builder()
                    .setModelAssetPath("pose_landmarker_full.task")
                    .setDelegate(Delegate.GPU)
                    .build()
            )
            .setRunningMode(RunningMode.LIVE_STREAM)
            .setNumPoses(1)
            .setMinPoseDetectionConfidence(0.5f)
            .setMinPosePresenceConfidence(0.5f)
            .setMinTrackingConfidence(0.5f)
            .setOutputSegmentationMasks(false)
            .setResultListener { result, _ -> processResult(result) }
            .build()
        landmarker = PoseLandmarker.createFromOptions(context, options)
    }

    private fun processResult(result: PoseLandmarkerResult) {
        result.landmarks().forEach { poseLandmarks ->
            // PoseLandmark.LEFT_SHOULDER = 11, RIGHT_SHOULDER = 12
            val leftShoulder  = poseLandmarks[PoseLandmark.LEFT_SHOULDER]
            val rightShoulder = poseLandmarks[PoseLandmark.RIGHT_SHOULDER]

            val shoulderWidth = Math.abs(
                leftShoulder.x() - rightShoulder.x()
            )
            Log.d("Pose", "Szerokość ramion: $shoulderWidth (norm.)")
        }
    }

    fun detectAsync(bitmap: Bitmap, frameTime: Long) {
        landmarker.detectAsync(BitmapImageBuilder(bitmap).build(), frameTime)
    }

    fun close() = landmarker.close()
}
```

Modele Pose Landmarker różnią się dokładnością i szybkością:

| Model | Dokładność | FPS (Pixel 7) |
|---|---|---|
| `pose_landmarker_lite.task` | Podstawowa | ~60 FPS |
| `pose_landmarker_full.task` | Wysoka | ~30 FPS |
| `pose_landmarker_heavy.task` | Bardzo wysoka | ~15 FPS |

---

## 5. Vision — segmentacja i detekcja obiektów

### 5.1 Image Segmentation

Image Segmentation przypisuje każdemu pikselowi obrazu etykietę (np. osoba, tło, niebo). Najczęstsze zastosowanie to usuwanie lub rozmywanie tła w czasie rzeczywistym.

```kotlin
// ImageSegmenterHelper.kt
class ImageSegmenterHelper(private val context: Context) {

    private val segmenter: ImageSegmenter

    init {
        val options = ImageSegmenterOptions.builder()
            .setBaseOptions(
                BaseOptions.builder()
                    .setModelAssetPath("selfie_segmenter.tflite")
                    .setDelegate(Delegate.GPU)
                    .build()
            )
            .setRunningMode(RunningMode.LIVE_STREAM)
            .setOutputCategoryMask(true)    // maska kategorii (etykiety)
            .setOutputConfidenceMasks(true) // maski prawdopodobieństwa
            .setResultListener { result, inputImage ->
                applyBackgroundBlur(result, inputImage)
            }
            .build()
        segmenter = ImageSegmenter.createFromOptions(context, options)
    }

    private fun applyBackgroundBlur(
        result: ImageSegmenterResult,
        inputImage: MPImage
    ) {
        // Maska kategorii: 0 = tło, 1 = osoba
        val categoryMask = result.categoryMask().get()
        val maskBuffer = categoryMask.buffer  // ByteBuffer z etykietami pikseli

        // Przykład: skopiuj tylko piksele osoby, resztę rozmyj
        val originalBitmap = BitmapExtractor.extract(inputImage)
        val blurredBitmap  = applyGaussianBlur(originalBitmap)

        val resultBitmap = originalBitmap.copy(Bitmap.Config.ARGB_8888, true)
        val canvas = Canvas(resultBitmap)

        // Nałóż rozmyte tło tam, gdzie maska = 0 (tło)
        maskBuffer.rewind()
        for (y in 0 until originalBitmap.height) {
            for (x in 0 until originalBitmap.width) {
                if (maskBuffer.get().toInt() == 0) {
                    resultBitmap.setPixel(x, y, blurredBitmap.getPixel(x, y))
                }
            }
        }
        onSegmentationResult(resultBitmap)
    }

    fun segmentAsync(bitmap: Bitmap, frameTime: Long) {
        segmenter.segmentAsync(BitmapImageBuilder(bitmap).build(), frameTime)
    }

    fun close() = segmenter.close()
}
```

### 5.2 Object Detection

Object Detection wykrywa obiekty z 80+ kategorii (COCO dataset) i zwraca bounding boxy z etykietami i poziomami pewności.

```kotlin
// ObjectDetectorHelper.kt
class ObjectDetectorHelper(private val context: Context) {

    private val detector: ObjectDetector

    init {
        val options = ObjectDetectorOptions.builder()
            .setBaseOptions(
                BaseOptions.builder()
                    .setModelAssetPath("efficientdet_lite0.tflite")
                    .setDelegate(Delegate.GPU)
                    .build()
            )
            .setRunningMode(RunningMode.LIVE_STREAM)
            .setMaxResults(5)
            .setScoreThreshold(0.4f)
            .setResultListener { result, _ ->
                result.detections().forEach { detection ->
                    val category = detection.categories()[0]
                    Log.d("ObjDetect",
                        "${category.categoryName()}: ${category.score()} " +
                        "@ ${detection.boundingBox()}"
                    )
                }
            }
            .build()
        detector = ObjectDetector.createFromOptions(context, options)
    }

    fun detectAsync(bitmap: Bitmap, frameTime: Long) {
        detector.detectAsync(BitmapImageBuilder(bitmap).build(), frameTime)
    }

    fun close() = detector.close()
}
```

Dostępne modele EfficientDet:

| Model | Rozmiar | mAP | FPS (Pixel 7 GPU) |
|---|---|---|---|
| EfficientDet-Lite0 | 4,4 MB | 25,7 | ~60 FPS |
| EfficientDet-Lite2 | 7,2 MB | 30,0 | ~30 FPS |
| EfficientDet-Lite4 | 19,9 MB | 34,3 | ~10 FPS |

---

## 6. Text — klasyfikacja i wykrywanie języka

### 6.1 Text Classification

```kotlin
// TextClassifierHelper.kt
class TextClassifierHelper(private val context: Context) {

    private val classifier: TextClassifier

    init {
        val options = TextClassifierOptions.builder()
            .setBaseOptions(
                BaseOptions.builder()
                    .setModelAssetPath("bert_classifier.tflite")
                    .build()
            )
            .setMaxResults(3)
            .build()
        classifier = TextClassifier.createFromOptions(context, options)
    }

    fun classify(text: String): List<Category> {
        val result = classifier.classify(text)
        return result.classificationResult().classifications()[0].categories()
    }

    fun close() = classifier.close()
}

// Użycie
val helper = TextClassifierHelper(context)
val categories = helper.classify("Ten film jest fantastyczny!")
// Wynik: [positive: 0.96, negative: 0.04]
categories.forEach { cat ->
    println("${cat.categoryName()}: ${cat.score()}")
}
```

### 6.2 Language Detection

Language Detection automatycznie rozpoznaje język tekstu spośród 110+ języków.

```kotlin
// LanguageDetectorHelper.kt
class LanguageDetectorHelper(private val context: Context) {

    private val detector: LanguageDetector

    init {
        val options = LanguageDetectorOptions.builder()
            .setBaseOptions(
                BaseOptions.builder()
                    .setModelAssetPath("language_detector.tflite")
                    .build()
            )
            .build()
        detector = LanguageDetector.createFromOptions(context, options)
    }

    fun detect(text: String): String {
        val result = detector.detect(text)
        val topLanguage = result.detectedLanguages()
            .maxByOrNull { it.probability() }
        return topLanguage?.languageCode() ?: "unknown"
    }

    fun close() = detector.close()
}

// Użycie
val langDetector = LanguageDetectorHelper(context)
println(langDetector.detect("Witaj, świecie!"))   // "pl"
println(langDetector.detect("Hello, world!"))      // "en"
println(langDetector.detect("Bonjour le monde!"))  // "fr"
```

---

## 7. Audio — klasyfikacja dźwięków

### 7.1 Audio Classification

Audio Classification rozpoznaje zdarzenia dźwiękowe (muzyka, mowa, odgłosy zwierząt, itp.) z modelem YAMNet (521 klas).

```kotlin
// AudioClassifierHelper.kt
class AudioClassifierHelper(
    private val context: Context,
    private val listener: ClassifierListener
) {

    interface ClassifierListener {
        fun onResults(results: List<AudioClassifierResult>, inferenceTime: Long)
        fun onError(error: String)
    }

    private var classifier: AudioClassifier? = null
    private var recorder: AudioRecord? = null
    private var executor: ScheduledThreadPoolExecutor? = null

    fun startClassification() {
        val options = AudioClassifierOptions.builder()
            .setBaseOptions(
                BaseOptions.builder()
                    .setModelAssetPath("yamnet.tflite")
                    .build()
            )
            .setMaxResults(3)
            .setScoreThreshold(0.3f)
            .build()

        classifier = AudioClassifier.createFromOptions(context, options)

        // Konfiguracja AudioRecord z wymaganiami modelu
        val audioFormat = classifier!!.requiredInputBufferSize
        recorder = classifier!!.createAudioRecord()

        executor = ScheduledThreadPoolExecutor(1)
        recorder!!.startRecording()

        executor!!.scheduleAtFixedRate({
            val audioClip = AudioData.create(
                AudioDataFormat.builder()
                    .setSampleRate(16000)
                    .setNumOfChannels(1)
                    .build(),
                16000
            )
            audioClip.load(recorder!!)

            val startTime = SystemClock.uptimeMillis()
            val results = classifier!!.classify(audioClip)
            val inferenceTime = SystemClock.uptimeMillis() - startTime

            listener.onResults(results, inferenceTime)
        }, 0, 500, TimeUnit.MILLISECONDS)  // co 500 ms
    }

    fun stopClassification() {
        executor?.shutdownNow()
        recorder?.stop()
        classifier?.close()
    }
}
```

---

## 8. LLM Inference API

### 8.1 Lokalne modele językowe na Androidzie

MediaPipe LLM Inference API umożliwia uruchamianie małych modeli językowych (Gemma, Phi-2, Falcon RW 1B) bezpośrednio na urządzeniu przez GPU.

```kotlin
// build.gradle.kts
dependencies {
    implementation("com.google.mediapipe:tasks-genai:0.10.14")
}

// GemmaHelper.kt
import com.google.mediapipe.tasks.genai.llminference.LlmInference
import com.google.mediapipe.tasks.genai.llminference.LlmInferenceOptions

class GemmaHelper(private val context: Context) {

    private val inference: LlmInference

    init {
        val options = LlmInferenceOptions.builder()
            .setModelPath(context.filesDir.path + "/gemma-2-2b-it-gpu-int4.bin")
            .setMaxTokens(512)
            .setTopK(40)
            .setTemperature(0.8f)
            .setRandomSeed(42)
            .build()
        inference = LlmInference.createFromOptions(context, options)
    }

    fun generateAsync(prompt: String, onToken: (String, Boolean) -> Unit) {
        inference.generateResponseAsync(
            prompt,
            object : LlmInference.LlmInferenceResultListener {
                override fun onResult(partial: String, done: Boolean) {
                    onToken(partial, done)
                }
                override fun onError(e: RuntimeException) {
                    Log.e("Gemma", "Błąd: ${e.message}")
                }
            }
        )
    }

    fun close() = inference.close()
}
```

### 8.2 LLM Inference na iOS (Swift)

```swift
// Swift: MediaPipe LLM Inference API
import MediaPipeTasksGenAI

class GemmaService {

    private var inference: LlmInference?

    func setup() throws {
        let options = LlmInference.Options(modelPath: modelPath())
        options.maxTokens = 512
        options.topk = 40
        options.temperature = 0.8
        options.randomSeed = 42
        inference = try LlmInference(options: options)
    }

    private func modelPath() -> String {
        let docs = FileManager.default.urls(
            for: .documentDirectory, in: .userDomainMask
        )[0]
        return docs.appendingPathComponent("gemma-2-2b-it-gpu-int4.bin").path
    }

    func generateAsync(
        prompt: String,
        onToken: @escaping (String, Bool) -> Void
    ) {
        guard let inference else { return }
        try? inference.generateResponseAsync(inputText: prompt) { partial, done in
            DispatchQueue.main.async {
                onToken(partial ?? "", done)
            }
        }
    }
}
```

---

## 9. Integracja z CameraX — Android

### 9.1 Konfiguracja CameraX z MediaPipe

```kotlin
// CameraXMediaPipeActivity.kt
class CameraXMediaPipeActivity : AppCompatActivity() {

    private lateinit var cameraProviderFuture: ListenableFuture<ProcessCameraProvider>
    private lateinit var handLandmarkerHelper: HandLandmarkerHelper
    private var frameTimestamp = 0L

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContentView(R.layout.activity_camera)

        handLandmarkerHelper = HandLandmarkerHelper(this)
        cameraProviderFuture = ProcessCameraProvider.getInstance(this)
        cameraProviderFuture.addListener({ startCamera() }, ContextCompat.getMainExecutor(this))
    }

    private fun startCamera() {
        val cameraProvider = cameraProviderFuture.get()

        val preview = Preview.Builder().build().also {
            it.setSurfaceProvider(viewBinding.previewView.surfaceProvider)
        }

        val imageAnalyzer = ImageAnalysis.Builder()
            .setTargetRotation(viewBinding.previewView.display.rotation)
            .setBackpressureStrategy(ImageAnalysis.STRATEGY_KEEP_ONLY_LATEST)
            .setOutputImageFormat(ImageAnalysis.OUTPUT_IMAGE_FORMAT_RGBA_8888)
            .build()
            .also { analysis ->
                analysis.setAnalyzer(cameraExecutor) { imageProxy ->
                    detectHands(imageProxy)
                }
            }

        cameraProvider.bindToLifecycle(
            this,
            CameraSelector.DEFAULT_FRONT_CAMERA,
            preview,
            imageAnalyzer
        )
    }

    private fun detectHands(imageProxy: ImageProxy) {
        val bitmapBuffer = Bitmap.createBitmap(
            imageProxy.width, imageProxy.height, Bitmap.Config.ARGB_8888
        )
        imageProxy.use { bitmapBuffer.copyPixelsFromBuffer(imageProxy.planes[0].buffer) }

        val matrix = Matrix().apply {
            postRotate(imageProxy.imageInfo.rotationDegrees.toFloat())
            // Odbij dla kamery frontowej (obrót względem centrum obrazu)
            postScale(-1f, 1f, imageProxy.width / 2f, imageProxy.height / 2f)
        }

        val rotatedBitmap = Bitmap.createBitmap(
            bitmapBuffer, 0, 0, bitmapBuffer.width, bitmapBuffer.height, matrix, true
        )

        handLandmarkerHelper.detectAsync(rotatedBitmap, frameTimestamp++)
    }
}
```

---

## 10. Integracja z AVFoundation — iOS

### 10.1 Konfiguracja sesji kamery z MediaPipe

```swift
// CameraViewController.swift
import AVFoundation
import MediaPipeTasksVision

class CameraViewController: UIViewController, AVCaptureVideoDataOutputSampleBufferDelegate {

    private var captureSession: AVCaptureSession?
    private var handLandmarker: HandLandmarker?
    private var frameTimestamp = 0

    override func viewDidLoad() {
        super.viewDidLoad()
        setupHandLandmarker()
        setupCamera()
    }

    private func setupHandLandmarker() {
        let baseOptions = BaseOptions(modelAssetPath: "hand_landmarker.task")
        let options = HandLandmarkerOptions()
        options.baseOptions = baseOptions
        options.runningMode = .liveStream
        options.numHands = 2
        options.minHandDetectionConfidence = 0.5
        options.minHandPresenceConfidence  = 0.5
        options.minTrackingConfidence      = 0.5
        options.handLandmarkerLiveStreamDelegate = self

        handLandmarker = try? HandLandmarker(options: options)
    }

    private func setupCamera() {
        let session = AVCaptureSession()
        session.sessionPreset = .high

        guard
            let device = AVCaptureDevice.default(
                .builtInWideAngleCamera, for: .video, position: .front
            ),
            let input = try? AVCaptureDeviceInput(device: device)
        else { return }

        let output = AVCaptureVideoDataOutput()
        output.videoSettings = [
            kCVPixelBufferPixelFormatTypeKey as String: kCVPixelFormatType_32BGRA
        ]
        output.setSampleBufferDelegate(self, queue: DispatchQueue(label: "camera.queue"))

        session.addInput(input)
        session.addOutput(output)
        captureSession = session
        session.startRunning()
    }

    func captureOutput(
        _ output: AVCaptureOutput,
        didOutput sampleBuffer: CMSampleBuffer,
        from connection: AVCaptureConnection
    ) {
        guard let pixelBuffer = CMSampleBufferGetImageBuffer(sampleBuffer) else { return }
        let mpImage = try? MPImage(pixelBuffer: pixelBuffer)
        frameTimestamp += 1
        try? handLandmarker?.detectAsync(
            image: mpImage!,
            timestampInMilliseconds: frameTimestamp
        )
    }
}

// Delegate dla wyników live stream
extension CameraViewController: HandLandmarkerLiveStreamDelegate {
    func handLandmarker(
        _ handLandmarker: HandLandmarker,
        didFinishDetection result: HandLandmarkerResult?,
        timestampInMilliseconds: Int,
        error: Error?
    ) {
        guard let result else { return }
        DispatchQueue.main.async {
            self.overlayView.update(with: result)
        }
    }
}
```

---

## 11. Tworzenie własnych potoków w C++

### 11.1 Architektura grafów MediaPipe

Własne pipeliny MediaPipe buduje się jako grafy kalkulatorów opisane w formacie ProtoBuf (`.pbtxt`):

```protobuf
# custom_face_pipeline.pbtxt
# Wejście: obraz RGB z kamery
input_stream: "input_video"
# Wyjście: obraz z nałożonymi landmarkami
output_stream: "output_video"

# Kalkulator: dekoduj obraz
node {
  calculator: "ImageTransformationCalculator"
  input_stream: "IMAGE:input_video"
  output_stream: "IMAGE:scaled_image"
  options: {
    [mediapipe.ImageTransformationCalculatorOptions.ext] {
      output_width: 480
      output_height: 640
    }
  }
}

# Kalkulator: wykrywanie twarzy
node {
  calculator: "FaceDetectionCalculatorCpu"
  input_stream: "IMAGE:scaled_image"
  output_stream: "DETECTIONS:face_detections"
}

# Kalkulator: wizualizacja wyników
node {
  calculator: "DetectionVisualizationCalculator"
  input_stream: "IMAGE:scaled_image"
  input_stream: "DETECTIONS:face_detections"
  output_stream: "IMAGE:output_video"
}
```

### 11.2 Własny kalkulator w C++

```cpp
// custom_threshold_calculator.cc
#include "mediapipe/framework/calculator_framework.h"
#include "mediapipe/framework/formats/detection.pb.h"

namespace mediapipe {

// Kalkulator filtrujący detekcje poniżej progu pewności
class ThresholdFilterCalculator : public CalculatorBase {
 public:
  static absl::Status GetContract(CalculatorContract* cc) {
    cc->Inputs().Tag("DETECTIONS").Set<std::vector<Detection>>();
    cc->Outputs().Tag("FILTERED").Set<std::vector<Detection>>();
    return absl::OkStatus();
  }

  absl::Status Open(CalculatorContext* cc) override {
    threshold_ = cc->Options<ThresholdFilterOptions>().threshold();
    return absl::OkStatus();
  }

  absl::Status Process(CalculatorContext* cc) override {
    const auto& detections =
        cc->Inputs().Tag("DETECTIONS").Get<std::vector<Detection>>();

    auto filtered = absl::make_unique<std::vector<Detection>>();
    for (const auto& det : detections) {
      if (!det.score().empty() && det.score(0) >= threshold_) {
        filtered->push_back(det);
      }
    }

    cc->Outputs().Tag("FILTERED").Add(filtered.release(), cc->InputTimestamp());
    return absl::OkStatus();
  }

 private:
  float threshold_ = 0.5f;
};

REGISTER_CALCULATOR(ThresholdFilterCalculator);

}  // namespace mediapipe
```

### 11.3 Wywoływanie grafu z Kotlin przez JNI

```kotlin
// MediaPipeGraph.kt
class MediaPipeGraph(private val context: Context) {

    companion object {
        init { System.loadLibrary("mediapipe_jni") }
    }

    private var nativeHandle: Long = 0

    fun initialize(graphConfig: String) {
        nativeHandle = nativeInit(context.assets, graphConfig)
    }

    fun processFrame(bitmap: Bitmap): Bitmap? {
        if (nativeHandle == 0L) return null
        return nativeProcessFrame(nativeHandle, bitmap)
    }

    fun close() {
        if (nativeHandle != 0L) {
            nativeClose(nativeHandle)
            nativeHandle = 0
        }
    }

    private external fun nativeInit(assetManager: AssetManager, graphConfig: String): Long
    private external fun nativeProcessFrame(handle: Long, input: Bitmap): Bitmap?
    private external fun nativeClose(handle: Long)
}
```

---

## 12. Profilowanie potoków MediaPipe

### 12.1 MediaPipe Visualizer

MediaPipe Visualizer to narzędzie online do wizualizacji grafów potoków:
1. Otwórz [viz.mediapipe.dev](https://viz.mediapipe.dev)
2. Wklej zawartość pliku `.pbtxt` swojego grafu
3. Visualizer wyrysuje interaktywny diagram kalkulatorów i strumieni danych

### 12.2 Logi wydajności klatek w Android

```kotlin
// Pomiar czasu inferecji w każdej klatce
class PerformanceLogger {

    private val frameTimes = ArrayDeque<Long>(100)

    fun recordInference(startMs: Long, endMs: Long) {
        frameTimes.addLast(endMs - startMs)
        if (frameTimes.size > 100) frameTimes.removeFirst()
    }

    fun getStats(): Stats {
        if (frameTimes.isEmpty()) return Stats(0, 0, 0)
        val sorted = frameTimes.sorted()
        return Stats(
            avgMs  = frameTimes.average().toLong(),
            p95Ms  = sorted[(sorted.size * 0.95).toInt()],
            maxMs  = sorted.last()
        )
    }

    data class Stats(val avgMs: Long, val p95Ms: Long, val maxMs: Long) {
        val fps: Double get() = if (avgMs > 0) 1000.0 / avgMs else 0.0
        override fun toString() =
            "avg=${avgMs}ms | p95=${p95Ms}ms | max=${maxMs}ms | FPS=%.1f".format(fps)
    }
}

// W helperze landmarkera:
val startMs = SystemClock.uptimeMillis()
landmarker.detectAsync(mpImage, frameTime)
// W ResultListener:
performanceLogger.recordInference(startMs, SystemClock.uptimeMillis())
Log.d("Perf", performanceLogger.getStats().toString())
```

### 12.3 Wybór delegata — porównanie wydajności

| Delegat | Zalety | Wady | Kiedy używać |
|---|---|---|---|
| `CPU` | Zawsze dostępny | Wolniejszy | Debugowanie, urządzenia bez GPU |
| `GPU` | Szybki, równoległy | Wyższe zużycie baterii | Aplikacje real-time |
| `NNAPI` | Wykorzystuje NPU/DSP | Niekompatybilny z niektórymi modelami | Qualcomm AI Engine |

```kotlin
// Automatyczny fallback: GPU → CPU
val delegate = try {
    Delegate.GPU
} catch (e: Exception) {
    Log.w("MediaPipe", "GPU niedostępny, używam CPU: ${e.message}")
    Delegate.CPU
}

val baseOptions = BaseOptions.builder()
    .setModelAssetPath("hand_landmarker.task")
    .setDelegate(delegate)
    .build()
```

---

## 13. Dobre praktyki

1. **Używaj trybu `LIVE_STREAM`** z kamerą — asynchroniczne callbacki nie blokują wątku kamery.
2. **Zamykaj taski** wywołując `.close()` w `onDestroy()` / `deinit` — modele zajmują znaczną ilość pamięci GPU.
3. **Unikaj tworzenia obiektów w pętli klatek** — alokuj `BitmapImageBuilder`, `MPImage` raz lub korzystaj z pul.
4. **Skaluj obraz przed przetworzeniem** — większość modeli nie wymaga rozdzielczości 4K; 640×480 zwykle wystarczy.
5. **Ogranicz liczbę wykrywanych obiektów** (`setNumHands`, `setNumFaces`, `setMaxResults`) — każdy dodatkowy obiekt zwiększa czas inferecji.
6. **Testuj na urządzeniu, nie tylko emulatorze** — emulator nie posiada dedykowanego GPU; wyniki wydajnościowe będą fałszywe.
7. **Pobieraj modele `.task` przez Asset Delivery** (Google Play) lub z serwera — nie bundluj dużych plików w APK.

---

## Powiązane artykuły

- [Modele językowe LLM na urządzeniu mobilnym](llm-on-device.md)
- [Frameworki ML na mobile](mobile-ml-frameworks.md)
- [Wnioskowanie lokalne — architektura i wydajność](on-device-inference.md)
- [Kwantyzacja i optymalizacja modeli AI](model-quantization.md)
- [AI mowy i NLP na mobile](ai-speech-nlp.md)
- [Wprowadzenie do lokalnego AI na mobile](local-ai-intro.md)
