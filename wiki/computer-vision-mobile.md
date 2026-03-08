# Computer Vision w Aplikacjach Mobilnych

Wizja komputerowa na urządzeniach mobilnych umożliwia detekcję obiektów, segmentację, klasyfikację i rozpoznawanie tekstu — bez internetu, z niskim opóźnieniem. Kluczem jest wybór właściwego modelu i optymalizacja pod ograniczenia sprzętowe urządzenia.

## Ekosystem narzędzi

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
