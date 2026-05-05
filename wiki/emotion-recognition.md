# Rozpoznawanie emocji z kamery

Rozpoznawanie emocji twarzy to zastosowanie computer vision i deep learning do automatycznego klasyfikowania stanów emocjonalnych człowieka na podstawie wyrazu twarzy.

## Pipeline rozpoznawania emocji

```
Klatka video → Detekcja twarzy → Normalizacja → Ekstrakcja cech → Klasyfikacja emocji
```

## Modele klasyfikacji emocji

### FER2013 - zbiór danych

FER2013 (Facial Expression Recognition 2013) to popularny zbiór danych zawierający 35 887 obrazów twarzy oznaczonych 7 emocjami. Dokładność najlepszych modeli na tym zbiorze to ~73%.

### Klasyfikacja z TensorFlow Lite

```kotlin
class EmotionClassifier(context: Context) {
    private val interpreter: Interpreter
    private val labels = listOf("angry", "disgust", "fear", "happy", "neutral", "sad", "surprise")
    private val inputSize = 48  // FER2013 używa 48x48px

    init {
        val model = FileUtil.loadMappedFile(context, "emotion_model.tflite")
        interpreter = Interpreter(model, Interpreter.Options().apply {
            numThreads = 4
            addDelegate(NnApiDelegate())
        })
    }

    fun classify(faceBitmap: Bitmap): Map<String, Float> {
        // Przeskaluj do 48x48 i konwertuj na grayscale
        val resized = Bitmap.createScaledBitmap(faceBitmap, inputSize, inputSize, true)
        val input = Array(1) { Array(inputSize) { Array(inputSize) { FloatArray(1) } } }

        for (y in 0 until inputSize) {
            for (x in 0 until inputSize) {
                val pixel = resized.getPixel(x, y)
                // Konwersja RGB → grayscale + normalizacja [0, 1]
                val gray = (0.299f * Color.red(pixel) +
                           0.587f * Color.green(pixel) +
                           0.114f * Color.blue(pixel)) / 255f
                input[0][y][x][0] = gray
            }
        }

        val output = Array(1) { FloatArray(7) }
        interpreter.run(input, output)

        return labels.zip(output[0].toList()).toMap()
    }
}
```

## Detekcja punktów charakterystycznych twarzy

```kotlin
// MediaPipe Face Mesh - 478 punktów twarzy
class FaceGeometryAnalyzer {

    // Indeksy kluczowych punktów wg MediaPipe Face Mesh
    private val LEFT_EYE_UPPER = 159
    private val LEFT_EYE_LOWER = 145
    private val MOUTH_LEFT = 61
    private val MOUTH_RIGHT = 291
    private val MOUTH_TOP = 13
    private val MOUTH_BOTTOM = 14
    private val LEFT_BROW_INNER = 107
    private val NOSE_TIP = 4

    fun computeActionUnits(landmarks: List<NormalizedLandmark>): ActionUnits {
        val eyeOpenness = distance(landmarks[LEFT_EYE_UPPER], landmarks[LEFT_EYE_LOWER])
        val mouthWidth = distance(landmarks[MOUTH_LEFT], landmarks[MOUTH_RIGHT])
        val mouthOpenness = distance(landmarks[MOUTH_TOP], landmarks[MOUTH_BOTTOM])
        val browHeight = landmarks[LEFT_BROW_INNER].y - landmarks[NOSE_TIP].y

        return ActionUnits(
            eyeWideness = eyeOpenness,
            smileIntensity = mouthWidth / mouthOpenness.coerceAtLeast(0.001f),
            mouthOpen = mouthOpenness,
            browRaise = browHeight
        )
    }

    private fun distance(a: NormalizedLandmark, b: NormalizedLandmark): Float =
        sqrt((a.x - b.x).pow(2) + (a.y - b.y).pow(2))
}

data class ActionUnits(
    val eyeWideness: Float,
    val smileIntensity: Float,
    val mouthOpen: Float,
    val browRaise: Float
) {
    fun toEmotion(): String = when {
        smileIntensity > 2.0f && eyeWideness > 0.06f -> "happy"
        browRaise < 0.15f && smileIntensity < 1.3f -> "angry"
        mouthOpen > 0.08f && eyeWideness > 0.07f -> "surprise"
        else -> "neutral"
    }
}
```

## Wygładzanie predykcji w czasie

Surowe predykcje klatka-po-klatce są niestabilne. Wygładzanie oknem czasowym stabilizuje wynik:

```kotlin
class EmotionSmoother(private val windowSize: Int = 10) {
    private val history = ArrayDeque<Map<String, Float>>(windowSize)

    fun smooth(current: Map<String, Float>): Map<String, Float> {
        if (history.size >= windowSize) history.removeFirst()
        history.addLast(current)

        val labels = current.keys
        return labels.associateWith { label ->
            history.map { it[label] ?: 0f }.average().toFloat()
        }
    }
}
```

## Linki

- [FER2013 dataset](https://www.kaggle.com/datasets/msambare/fer2013)
- [MediaPipe Face Mesh](https://ai.google.dev/edge/mediapipe/solutions/vision/face_landmarker)
- [TensorFlow Lite Models](https://www.tensorflow.org/lite/models)

## Etyka i prywatność w rozpoznawaniu emocji

Rozpoznawanie emocji budzi poważne pytania etyczne, którym każdy deweloper powinien poświęcić uwagę:

- **Bias** - modele trenowane głównie na twarzach osób z USA/Europy mogą słabiej działać na innych grupach etnicznych
- **Kontekst** - ten sam wyraz twarzy ma różne znaczenia w różnych kulturach
- **Zgoda** - analiza emocji powinna odbywać się wyłącznie za wyraźną zgodą użytkownika
- **Przechowywanie** - surowe zdjęcia twarzy to dane biometryczne chronione RODO

```kotlin
// Przetwarzaj dane lokalnie - nie wysyłaj zdjęć twarzy na serwer
class PrivacyAwareEmotionAnalyzer {
    // Cały inference na urządzeniu (on-device ML)
    private val emotionClassifier = EmotionClassifier(context)

    fun analyzeWithPrivacy(frame: Bitmap): EmotionResult {
        // 1. Wykryj twarz - tylko bounding box, nie obraz
        val faces = detectFaces(frame)

        // 2. Wycinek twarzy - krótkotrwały, nigdy nie zapisuj
        val faceRegion = cropFace(frame, faces.first().boundingBox)

        // 3. Klasyfikacja - tylko wynik (etykiety + pewność)
        val result = emotionClassifier.classify(faceRegion)

        // 4. Zwróć etykiety - nie przechowuj obrazu
        faceRegion.recycle()
        return EmotionResult(result)
    }
}
```

## ML Kit - gotowe rozpoznawanie twarzy od Google

```kotlin
dependencies {
    implementation("com.google.mlkit:face-detection:16.1.5")
}

class MlKitFaceAnalyzer : ImageAnalysis.Analyzer {
    private val detector = FaceDetection.getClient(
        FaceDetectorOptions.Builder()
            .setPerformanceMode(FaceDetectorOptions.PERFORMANCE_MODE_FAST)
            .setClassificationMode(FaceDetectorOptions.CLASSIFICATION_MODE_ALL)
            .setLandmarkMode(FaceDetectorOptions.LANDMARK_MODE_ALL)
            .build()
    )

    override fun analyze(imageProxy: ImageProxy) {
        val mediaImage = imageProxy.image ?: run { imageProxy.close(); return }
        val image = InputImage.fromMediaImage(mediaImage, imageProxy.imageInfo.rotationDegrees)

        detector.process(image)
            .addOnSuccessListener { faces ->
                for (face in faces) {
                    // Prawdopodobieństwo uśmiechu: 0.0–1.0
                    val smileProb = face.smilingProbability ?: continue
                    // Prawdopodobieństwo otwartości oczu
                    val leftEyeProb = face.leftEyeOpenProbability ?: continue

                    val emotion = when {
                        smileProb > 0.8f -> "Radosny 😊"
                        smileProb > 0.4f -> "Zadowolony 🙂"
                        else             -> "Neutralny 😐"
                    }

                    Log.d("FaceAnalysis", "Emocja: $emotion, uśmiech: $smileProb")
                }
            }
            .addOnCompleteListener { imageProxy.close() }
    }
}
```

## Integracja z CameraX

```kotlin
@Composable
fun EmotionCameraScreen(viewModel: EmotionViewModel) {
    val emotion by viewModel.currentEmotion.collectAsState()
    val context = LocalContext.current
    val lifecycleOwner = LocalLifecycleOwner.current

    val cameraProviderFuture = remember { ProcessCameraProvider.getInstance(context) }

    Box(modifier = Modifier.fillMaxSize()) {
        // Podgląd kamery
        AndroidView(
            factory = { ctx ->
                val previewView = PreviewView(ctx)
                cameraProviderFuture.addListener({
                    val cameraProvider = cameraProviderFuture.get()
                    val preview = Preview.Builder().build()
                        .also { it.setSurfaceProvider(previewView.surfaceProvider) }

                    val analysis = ImageAnalysis.Builder()
                        .setTargetResolution(Size(640, 480))
                        .setBackpressureStrategy(STRATEGY_KEEP_ONLY_LATEST)
                        .build()
                        .also { it.setAnalyzer(Executors.newSingleThreadExecutor(), viewModel.analyzer) }

                    cameraProvider.bindToLifecycle(
                        lifecycleOwner,
                        CameraSelector.DEFAULT_FRONT_CAMERA,
                        preview,
                        analysis
                    )
                }, ContextCompat.getMainExecutor(ctx))
                previewView
            },
            modifier = Modifier.fillMaxSize()
        )

        // Overlay z wykrytą emocją
        EmotionOverlay(
            emotion = emotion,
            modifier = Modifier.align(Alignment.BottomCenter).padding(bottom = 48.dp)
        )
    }
}
```

## Linki dodatkowe

- [ML Kit Face Detection](https://developers.google.com/ml-kit/vision/face-detection)
- [CameraX](https://developer.android.com/training/camerax)
- [AffectNet Dataset](http://mohammadmahoor.com/affectnet/)

---

## 1. Biometryczna identyfikacja emocji

Oprócz wyrazu twarzy, emocje można mierzyć za pomocą sygnałów fizjologicznych. Dwie metody dostępne na urządzeniach mobilnych to **rPPG** (remote photoplethysmography) oraz **galwaniczna reakcja skóry** (GSR).

### rPPG - tętno z kamery

rPPG mierzy zmienność rytmu serca (HRV) poprzez analizę mikrozmian koloru skóry wywołanych pulsowaniem krwi. Kamera rejestruje zmiany jasności kanału czerwonego (R) w obszarze twarzy.

```kotlin
class RPPGAnalyzer {
    private val signalBuffer = ArrayDeque<Float>(300) // ~10s przy 30fps
    private val windowSize = 150 // 5s okno

    fun addFrame(faceBitmap: Bitmap) {
        val avgRed = computeAverageRed(faceBitmap)
        if (signalBuffer.size >= 300) signalBuffer.removeFirst()
        signalBuffer.addLast(avgRed)
    }

    private fun computeAverageRed(bmp: Bitmap): Float {
        var sum = 0L
        val w = bmp.width; val h = bmp.height
        for (x in 0 until w) for (y in 0 until h)
            sum += Color.red(bmp.getPixel(x, y))
        return sum.toFloat() / (w * h)
    }

    /** Zwraca przybliżone HR w BPM z ostatniego okna */
    fun estimateHeartRate(fps: Float): Float {
        if (signalBuffer.size < windowSize) return 0f
        val window = signalBuffer.takeLast(windowSize)
        // Zliczanie szczytów (uproszczony peak-counting)
        val mean = window.average().toFloat()
        val peaks = window.windowed(3).count { (a, b, c) -> b > a && b > c && b > mean * 1.01f }
        val durationSeconds = windowSize / fps
        return (peaks / durationSeconds) * 60f
    }

    /** HRV (RMSSD) jako wskaźnik stresu - niskie HRV → wysoki stres */
    fun computeHRV(): Float {
        val intervals = mutableListOf<Float>()
        // uproszczone: różnice między kolejnymi wartościami szczytowymi
        val sig = signalBuffer.toList()
        for (i in 1 until sig.size)
            if (sig[i] > sig[i - 1]) intervals.add(sig[i] - sig[i - 1])
        if (intervals.size < 2) return 0f
        val diffs = intervals.zipWithNext { a, b -> (b - a).pow(2) }
        return sqrt(diffs.average().toFloat())
    }
}
```

**Interpretacja HRV a emocje:**
| Stan emocjonalny | Typowe HRV (RMSSD) |
|---|---|
| Relaks, radość | > 50 ms |
| Neutralny | 20–50 ms |
| Stres, strach, gniew | < 20 ms |

### Galwaniczna reakcja skóry (GSR)

GSR mierzy przewodność elektryczną skóry - wzrasta przy pobudzeniu emocjonalnym. W smartfonach można ją uzyskać z czujników kontaktowych (np. Galaxy Watch, Fitbit). Dane przychodzą przez Bluetooth/BLE:

```kotlin
class GSREmotionMapper {
    fun mapToArousal(gsr: Float): String = when {
        gsr > 10f -> "Wysokie pobudzenie (strach/ekscytacja)"
        gsr > 4f  -> "Umiarkowane pobudzenie"
        else      -> "Niskie pobudzenie (spokój/smutek)"
    }
}
```

---

## 2. Analiza głosu

Głos jest bogatym nośnikiem emocji. Parametry akustyczne - **pitch (F0)**, **energia**, **tempo mówienia** i **prozodia** - pozwalają klasyfikować emocje niezależnie od treści słów.

### Ekstrakcja cech audio na Androidzie

```kotlin
class VoiceEmotionExtractor {
    private val sampleRate = 16000
    private val frameSize = 512

    /** Oblicza energię RMS klatki audio */
    fun rmsEnergy(samples: ShortArray): Float {
        val sum = samples.sumOf { (it * it).toLong() }
        return sqrt(sum.toDouble() / samples.size).toFloat()
    }

    /** Uproszczone wykrywanie pitch metodą zero-crossing rate */
    fun zeroCrossingRate(samples: ShortArray): Float {
        var crossings = 0
        for (i in 1 until samples.size)
            if ((samples[i] >= 0) != (samples[i - 1] >= 0)) crossings++
        return crossings.toFloat() / samples.size
    }

    /** Mapowanie cech na emocje (heurystyczny baseline) */
    fun classifyEmotion(rms: Float, zcr: Float, speechRate: Float): String = when {
        rms > 3000f && speechRate > 4.5f -> "gniew / ekscytacja"
        rms > 2000f && zcr < 0.05f       -> "radość"
        rms < 800f  && speechRate < 2.5f -> "smutek"
        rms < 600f                        -> "neutralny"
        else                              -> "nieokreślony"
    }
}
```

### Nagrywanie i analiza w czasie rzeczywistym

```kotlin
class VoiceEmotionRecorder(private val extractor: VoiceEmotionExtractor) {
    private var audioRecord: AudioRecord? = null

    fun startAnalysis(onEmotion: (String) -> Unit) {
        val bufferSize = AudioRecord.getMinBufferSize(
            16000, AudioFormat.CHANNEL_IN_MONO, AudioFormat.ENCODING_PCM_16BIT
        )
        audioRecord = AudioRecord(
            MediaRecorder.AudioSource.MIC, 16000,
            AudioFormat.CHANNEL_IN_MONO, AudioFormat.ENCODING_PCM_16BIT, bufferSize
        )
        audioRecord?.startRecording()
        Thread {
            val buffer = ShortArray(bufferSize)
            while (audioRecord?.recordingState == AudioRecord.RECORDSTATE_RECORDING) {
                audioRecord?.read(buffer, 0, bufferSize)
                val rms = extractor.rmsEnergy(buffer)
                val zcr = extractor.zeroCrossingRate(buffer)
                onEmotion(extractor.classifyEmotion(rms, zcr, 3.5f))
            }
        }.start()
    }

    fun stop() { audioRecord?.stop(); audioRecord?.release() }
}
```

Dla produkcyjnych zastosowań zaleca się użycie biblioteki **TarsosDSP** (Java/Android) do ekstrakcji MFCC i pitch YIN, lub modeli **wav2vec 2.0** skwantowanych do TFLite.

---

## 3. Multimodalne łączenie sygnałów

Najwyższą dokładność uzyskuje się przez **fuzję** kilku modalności: twarzy, głosu i sygnałów fizjologicznych. Fuzja może być wczesna (łączenie surowych cech) lub późna (łączenie wyników klasyfikatorów).

### Późna fuzja (score-level fusion)

```kotlin
data class ModalityResult(
    val emotions: Map<String, Float>, // etykieta → pewność 0..1
    val weight: Float                 // waga modalności
)

class MultimodalFusion {

    fun fuse(modalities: List<ModalityResult>): String {
        val labels = modalities.first().emotions.keys
        val totalWeight = modalities.sumOf { it.weight.toDouble() }.toFloat()

        val fused = labels.associateWith { label ->
            modalities.sumOf { m ->
                ((m.emotions[label] ?: 0f) * m.weight).toDouble()
            }.toFloat() / totalWeight
        }

        return fused.maxByOrNull { it.value }?.key ?: "neutral"
    }
}

// Użycie:
val faceResult  = ModalityResult(faceClassifier.classify(faceBitmap),   weight = 0.5f)
val voiceResult = ModalityResult(voiceClassifier.classify(audioBuffer),  weight = 0.3f)
val hrvResult   = ModalityResult(hrvClassifier.classify(hrvValue),       weight = 0.2f)

val dominantEmotion = MultimodalFusion().fuse(listOf(faceResult, voiceResult, hrvResult))
```

### Kiedy stosować fuzję?

| Scenariusz | Zalecana modalność |
|---|---|
| Cicha scena, dobra widoczność | Twarz (waga 0.8) |
| Rozmowa telefoniczna | Głos (waga 0.9) |
| Noszony smartwatch | HRV/GSR (waga 0.5) + twarz |
| Pełna aplikacja wellbeing | Fuzja wszystkich trzech |

---

## 4. Praktyczna implementacja z ML Kit

Poniżej kompletny przykład Androida łączący **CameraX** z **ML Kit FaceDetector** w architekturze MVVM.

```kotlin
// ViewModel
class EmotionViewModel(application: Application) : AndroidViewModel(application) {
    private val _emotion = MutableStateFlow("–")
    val emotion: StateFlow<String> = _emotion.asStateFlow()

    val analyzer: MlKitFaceAnalyzer = MlKitFaceAnalyzer { detectedEmotion ->
        viewModelScope.launch { _emotion.emit(detectedEmotion) }
    }
}

// Analyzer
class MlKitFaceAnalyzer(
    private val onEmotion: (String) -> Unit
) : ImageAnalysis.Analyzer {

    private val options = FaceDetectorOptions.Builder()
        .setPerformanceMode(FaceDetectorOptions.PERFORMANCE_MODE_FAST)
        .setClassificationMode(FaceDetectorOptions.CLASSIFICATION_MODE_ALL)
        .build()

    private val detector = FaceDetection.getClient(options)

    @androidx.camera.core.ExperimentalGetImage
    override fun analyze(imageProxy: ImageProxy) {
        val mediaImage = imageProxy.image ?: run { imageProxy.close(); return }
        val image = InputImage.fromMediaImage(mediaImage, imageProxy.imageInfo.rotationDegrees)

        detector.process(image)
            .addOnSuccessListener { faces ->
                val face = faces.maxByOrNull { it.boundingBox.width() } ?: return@addOnSuccessListener
                val smile   = face.smilingProbability ?: 0f
                val leftEye = face.leftEyeOpenProbability ?: 1f
                val rightEye= face.rightEyeOpenProbability ?: 1f
                val avgEye  = (leftEye + rightEye) / 2f

                val emotion = when {
                    smile > 0.75f                     -> "Radość 😊"
                    avgEye < 0.3f && smile < 0.2f     -> "Zmęczenie 😴"
                    smile < 0.2f && avgEye > 0.8f     -> "Skupienie 🤔"
                    smile in 0.3f..0.75f              -> "Zadowolenie 🙂"
                    else                              -> "Neutralny 😐"
                }
                onEmotion(emotion)
            }
            .addOnCompleteListener { imageProxy.close() }
    }
}

// Activity / Fragment - uruchomienie CameraX
fun startCamera(context: Context, lifecycleOwner: LifecycleOwner,
                previewView: PreviewView, analyzer: ImageAnalysis.Analyzer) {
    val cameraProviderFuture = ProcessCameraProvider.getInstance(context)
    cameraProviderFuture.addListener({
        val cameraProvider = cameraProviderFuture.get()

        val preview = Preview.Builder().build()
            .also { it.setSurfaceProvider(previewView.surfaceProvider) }

        val imageAnalysis = ImageAnalysis.Builder()
            .setTargetResolution(Size(640, 480))
            .setBackpressureStrategy(ImageAnalysis.STRATEGY_KEEP_ONLY_LATEST)
            .build()
            .also { it.setAnalyzer(Executors.newSingleThreadExecutor(), analyzer) }

        cameraProvider.unbindAll()
        cameraProvider.bindToLifecycle(
            lifecycleOwner,
            CameraSelector.DEFAULT_FRONT_CAMERA,
            preview, imageAnalysis
        )
    }, ContextCompat.getMainExecutor(context))
}
```

**Wymagane uprawnienia w `AndroidManifest.xml`:**
```xml
<uses-permission android:name="android.permission.CAMERA" />
<uses-permission android:name="android.permission.RECORD_AUDIO" />
```

---

## 5. Ewaluacja modeli emocji

### Metryki dokładności

Dla klasyfikacji 7 klas emocji (FER2013: angry, disgust, fear, happy, neutral, sad, surprise) stosuje się:

| Metryka | Opis | Typowa wartość (FER2013) |
|---|---|---|
| **Accuracy** | % poprawnych predykcji | ~65–73% |
| **Macro F1** | Średnia F1 po klasach (równa waga) | ~60–68% |
| **Weighted F1** | F1 ważona licznością klas | ~64–72% |
| **Top-2 Accuracy** | Właściwa klasa w top-2 predykcjach | ~88–92% |

### Macierz pomyłek (Confusion Matrix)

```kotlin
class EmotionEvaluator(private val labels: List<String>) {
    private val matrix = Array(labels.size) { IntArray(labels.size) }

    fun record(trueLabel: String, predictedLabel: String) {
        val t = labels.indexOf(trueLabel)
        val p = labels.indexOf(predictedLabel)
        if (t >= 0 && p >= 0) matrix[t][p]++
    }

    fun printMatrix() {
        println("Confusion Matrix:")
        println("Pred →  " + labels.joinToString("  "))
        labels.forEachIndexed { i, label ->
            println("$label: ${matrix[i].toList()}")
        }
    }

    fun classAccuracy(label: String): Float {
        val i = labels.indexOf(label)
        val total = matrix[i].sum()
        return if (total == 0) 0f else matrix[i][i].toFloat() / total
    }

    fun macroF1(): Float {
        return labels.indices.map { i ->
            val tp = matrix[i][i].toFloat()
            val fp = (0 until labels.size).sumOf { r -> matrix[r][i] } - tp
            val fn = matrix[i].sum() - tp
            val precision = if (tp + fp == 0f) 0f else tp / (tp + fp)
            val recall    = if (tp + fn == 0f) 0f else tp / (tp + fn)
            if (precision + recall == 0f) 0f
            else 2 * precision * recall / (precision + recall)
        }.average().toFloat()
    }
}
```

### Typowe problemy z dokładnością

- **Nierównowaga klas** - klasa `disgust` w FER2013 ma tylko 547 próbek vs 8989 (`neutral`). Stosuj `class_weight` podczas treningu lub techniki augmentacji.
- **Mylenie podobnych emocji** - `fear` i `surprise` są często mylone (podobny wyraz twarzy); `sad` i `neutral` też.
- **Oświetlenie i kąt** - model trenowany na twarzach frontowych słabiej działa przy profilu bocznym. Augmentacja (rotation, brightness jitter) poprawia generalizację.
- **Benchmark on-device** - na Pixel 7 (TFLite + NNAPI), model 48×48 działa z opóźnieniem ~8 ms/klatka; MediaPipe FaceMesh ~12 ms/klatka.

### Zalecenia dla środowiska produkcyjnego

1. Zbierz własny zbiór walidacyjny z użytkownikami docelowymi.
2. Raportuj F1 per-klasa, nie tylko overall accuracy.
3. Ustaw próg pewności (np. `confidence < 0.4 → "nieokreślony"`) zamiast wymuszać klasę.
4. Regularnie monitoruj dryft modelu (concept drift) przy aktualizacjach OS/aparatu.

---

## Linki uzupełniające

- [rPPG - Remote Heart Rate Estimation](https://arxiv.org/abs/2005.02683)
- [SER - Speech Emotion Recognition survey](https://arxiv.org/abs/1912.10458)
- [TarsosDSP (audio DSP for Android)](https://github.com/JorenSix/TarsosDSP)
- [FER2013 Kaggle](https://www.kaggle.com/datasets/msambare/fer2013)
- [ML Kit Face Detection](https://developers.google.com/ml-kit/vision/face-detection)
- [CameraX](https://developer.android.com/training/camerax)
