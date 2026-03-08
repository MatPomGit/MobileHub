# Rozpoznawanie Emocji z Kamery

Rozpoznawanie emocji twarzy to zastosowanie computer vision i deep learning do automatycznego klasyfikowania stanów emocjonalnych człowieka na podstawie wyrazu twarzy.

## Pipeline rozpoznawania emocji

```
Klatka video → Detekcja twarzy → Normalizacja → Ekstrakcja cech → Klasyfikacja emocji
```

## Modele klasyfikacji emocji

### FER2013 — zbiór danych

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
// MediaPipe Face Mesh — 478 punktów twarzy
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

- **Bias** — modele trenowane głównie na twarzach osób z USA/Europy mogą słabiej działać na innych grupach etnicznych
- **Kontekst** — ten sam wyraz twarzy ma różne znaczenia w różnych kulturach
- **Zgoda** — analiza emocji powinna odbywać się wyłącznie za wyraźną zgodą użytkownika
- **Przechowywanie** — surowe zdjęcia twarzy to dane biometryczne chronione RODO

```kotlin
// Przetwarzaj dane lokalnie — nie wysyłaj zdjęć twarzy na serwer
class PrivacyAwareEmotionAnalyzer {
    // Cały inference na urządzeniu (on-device ML)
    private val emotionClassifier = EmotionClassifier(context)

    fun analyzeWithPrivacy(frame: Bitmap): EmotionResult {
        // 1. Wykryj twarz — tylko bounding box, nie obraz
        val faces = detectFaces(frame)

        // 2. Wycinek twarzy — krótkotrwały, nigdy nie zapisuj
        val faceRegion = cropFace(frame, faces.first().boundingBox)

        // 3. Klasyfikacja — tylko wynik (etykiety + pewność)
        val result = emotionClassifier.classify(faceRegion)

        // 4. Zwróć etykiety — nie przechowuj obrazu
        faceRegion.recycle()
        return EmotionResult(result)
    }
}
```

## ML Kit — gotowe rozpoznawanie twarzy od Google

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
