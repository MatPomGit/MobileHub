# AI w przetwarzaniu obrazu na urządzeniu

## Streszczenie

Artykuł omawia zastosowania modeli AI do przetwarzania obrazu realizowanego lokalnie na smartfonie: klasyfikację, detekcję obiektów, segmentację, śledzenie w czasie rzeczywistym, super-resolution, detekcję twarzy i rąk przez MediaPipe, OCR oraz skanowanie dokumentów. Opisano preprocessing, obsługę formatów Bitmap/CVPixelBuffer oraz przykłady w Kotlin (CameraX + TFLite) i Swift (Vision framework).

**Słowa kluczowe:** image classification, object detection, SSD MobileNet, YOLO, semantic segmentation, DeepLab, super-resolution, ESRGAN, MediaPipe, face detection, hand gesture, OCR, ML Kit, Vision framework, CameraX, TFLite, Core ML, CVPixelBuffer, Bitmap

---

## 1. Klasyfikacja obrazow (Image Classification)

### 1.1 Modele klasyfikacji na mobile

Klasyfikacja obrazow to zadanie przypisania obrazu do jednej z predefiniowanych klas:

| Model | Params | Top-1 | Latency CPU (Pixel 6) | Uwagi |
|---|---|---|---|---|
| MobileNetV3-Small | 2,9M | 67,4% | 15 ms | Najszybszy |
| MobileNetV3-Large | 5,4M | 75,2% | 51 ms | Dobry balans |
| EfficientNet-Lite0 | 4,7M | 74,4% | 89 ms | Wyzsza dokladnosc |
| EfficientNet-Lite4 | 13M | 80,4% | 487 ms | Najdokladniejszy z serii |
| ResNet-50 Lite | 25M | 76,0% | 320 ms | Referencyjna architektura |
| NASNetMobile | 5,3M | 74,1% | 75 ms | NAS-optimized |

### 1.2 Kotlin: klasyfikacja z TFLite Support Library

```kotlin
import org.tensorflow.lite.support.image.TensorImage
import org.tensorflow.lite.support.image.ops.ResizeOp
import org.tensorflow.lite.support.label.TensorLabel
import org.tensorflow.lite.task.vision.classifier.ImageClassifier
import org.tensorflow.lite.task.vision.classifier.ImageClassifier.ImageClassifierOptions

class ImageClassificationHelper(private val context: Context) {

    private val classifier: ImageClassifier by lazy {
        val options = ImageClassifierOptions.builder()
            .setMaxResults(5)
            .setScoreThreshold(0.1f)
            .build()
        ImageClassifier.createFromFileAndOptions(
            context,
            "efficientnet_lite0.tflite",
            options
        )
    }

    fun classify(bitmap: Bitmap): List<ClassificationResult> {
        val tensorImage = TensorImage.fromBitmap(bitmap)
        val results = classifier.classify(tensorImage)
        return results.flatMap { classification ->
            classification.categories.map { cat ->
                ClassificationResult(
                    label = cat.label,
                    confidence = cat.score,
                    displayName = cat.displayName
                )
            }
        }.sortedByDescending { it.confidence }
    }
}

data class ClassificationResult(
    val label: String,
    val confidence: Float,
    val displayName: String
)
```

### 1.3 Swift: Vision framework dla klasyfikacji

```swift
import Vision
import CoreML
import UIKit

class ImageClassifierSwift {

    private let model: VNCoreMLModel

    init() throws {
        let config = MLModelConfiguration()
        config.computeUnits = .all
        let mlModel = try MobileNetV3(configuration: config)
        self.model = try VNCoreMLModel(for: mlModel.model)
    }

    func classify(image: UIImage) async throws -> [(label: String, confidence: Float)] {
        guard let cgImage = image.cgImage else { throw ClassifierError.invalidImage }

        return try await withCheckedThrowingContinuation { continuation in
            let request = VNCoreMLRequest(model: model) { request, error in
                if let error = error {
                    continuation.resume(throwing: error)
                    return
                }
                let observations = request.results as? [VNClassificationObservation] ?? []
                let results = observations.prefix(5).map {
                    (label: $0.identifier, confidence: $0.confidence)
                }
                continuation.resume(returning: results)
            }
            request.imageCropAndScaleOption = .centerCrop

            let handler = VNImageRequestHandler(cgImage: cgImage)
            do { try handler.perform([request]) }
            catch { continuation.resume(throwing: error) }
        }
    }
}

enum ClassifierError: Error { case invalidImage }
```

---

## 2. Detekcja obiektow (Object Detection)

### 2.1 Architektury detekcji na mobile

**Single-Stage detectors** (szybsze, gorsze na male obiekty):
- **SSD MobileNet V2** -- klasyczny wybor dla real-time mobile
- **SSD MobileNet V3** -- ulepszona wersja
- **YOLO-NAS Mobile** -- Neural Architecture Search dla YOLO
- **EfficientDet-Lite** -- najlepszy accuracy/speed tradeoff

**Two-Stage detectors** (wolniejsze, dokladniejsze) -- rzadko na mobile:
- Faster R-CNN Lite -- bardzo wolny (>300 ms na CPU)

| Model | Params | mAP (COCO) | Latency CPU (Pixel 6) |
|---|---|---|---|
| SSD MobileNetV2 | 6,9M | 22,2% | 75 ms |
| SSD MobileNetV3-Large | 5,1M | 25,6% | 65 ms |
| EfficientDet-Lite0 | 3,9M | 25,7% | 146 ms |
| EfficientDet-Lite2 | 5,9M | 32,0% | 263 ms |
| EfficientDet-Lite4 | 15,6M | 41,4% | 1183 ms |
| YOLO-NAS-s (GGUF INT8) | 12M | 38,5% | 45 ms (GPU) |

### 2.2 Format wyjsciowy detekcji

Typowy output detekcji to 4 tensory:
```
boxes:   [N, 4]       -- (top, left, bottom, right) znormalizowane 0-1
classes: [N]          -- indeksy klas
scores:  [N]          -- pewnosc (0-1)
count:   [1]          -- liczba wykrytych obiektow
```

### 2.3 Kotlin: detekcja z TFLite Task Library

```kotlin
import org.tensorflow.lite.task.vision.detector.ObjectDetector
import org.tensorflow.lite.task.vision.detector.ObjectDetector.ObjectDetectorOptions
import org.tensorflow.lite.support.image.TensorImage

class ObjectDetectionHelper(private val context: Context) {

    private val detector: ObjectDetector by lazy {
        val options = ObjectDetectorOptions.builder()
            .setMaxResults(10)
            .setScoreThreshold(0.4f)
            .build()
        ObjectDetector.createFromFileAndOptions(
            context,
            "efficientdet_lite2.tflite",
            options
        )
    }

    fun detect(bitmap: Bitmap): List<DetectionResult> {
        val tensorImage = TensorImage.fromBitmap(bitmap)
        val detections = detector.detect(tensorImage)

        return detections.map { detection ->
            val box = detection.boundingBox
            DetectionResult(
                label = detection.categories.first().label,
                confidence = detection.categories.first().score,
                boundingBox = RectF(box.left, box.top, box.right, box.bottom)
            )
        }
    }

    fun drawResults(bitmap: Bitmap, results: List<DetectionResult>): Bitmap {
        val mutableBitmap = bitmap.copy(Bitmap.Config.ARGB_8888, true)
        val canvas = android.graphics.Canvas(mutableBitmap)
        val paint = android.graphics.Paint().apply {
            color = android.graphics.Color.RED
            strokeWidth = 3f
            style = android.graphics.Paint.Style.STROKE
        }
        val textPaint = android.graphics.Paint().apply {
            color = android.graphics.Color.WHITE
            textSize = 32f
        }

        results.forEach { result ->
            val rect = android.graphics.RectF(
                result.boundingBox.left * bitmap.width,
                result.boundingBox.top * bitmap.height,
                result.boundingBox.right * bitmap.width,
                result.boundingBox.bottom * bitmap.height
            )
            canvas.drawRect(rect, paint)
            canvas.drawText(
                "${result.label}: ${(result.confidence * 100).toInt()}%",
                rect.left, rect.top - 10, textPaint
            )
        }
        return mutableBitmap
    }
}

data class DetectionResult(
    val label: String,
    val confidence: Float,
    val boundingBox: android.graphics.RectF
)
```

---

## 3. Segmentacja semantyczna

### 3.1 Modele segmentacji na mobile

**Semantic segmentation**: kazdy piksel przypisany do klasy:

| Model | Klasy | mIoU | Latency (Pixel 6 CPU) |
|---|---|---|---|
| DeepLab v3 MobileNetV2 | 21 (Pascal VOC) | 75,3% | 390 ms |
| DeepLab v3 MobileNetV3 | 21 | 76,2% | 270 ms |
| Fast-SCNN | 19 (Cityscapes) | 69,2% | 45 ms |
| MediaPipe Selfie Segmentation | 2 (person/bg) | n/a | 15 ms |

### 3.2 Segmentacja tla z MediaPipe

```kotlin
import com.google.mediapipe.tasks.vision.imagesegmenter.ImageSegmenter
import com.google.mediapipe.tasks.vision.imagesegmenter.ImageSegmenterResult
import com.google.mediapipe.framework.image.BitmapImageBuilder

class BackgroundSegmenter(private val context: Context) {

    private val segmenter: ImageSegmenter

    init {
        val options = ImageSegmenter.ImageSegmenterOptions.builder()
            .setBaseOptions(
                com.google.mediapipe.tasks.core.BaseOptions.builder()
                    .setModelAssetPath("selfie_segmenter.tflite")
                    .build()
            )
            .setOutputCategoryMask(true)
            .setOutputConfidenceMasks(false)
            .build()
        segmenter = ImageSegmenter.createFromOptions(context, options)
    }

    fun segmentPerson(bitmap: Bitmap): Bitmap {
        val mpImage = BitmapImageBuilder(bitmap).build()
        val result = segmenter.segment(mpImage)
        val mask = result.categoryMask().get()
        return applyMask(bitmap, mask)
    }

    private fun applyMask(original: Bitmap, mask: com.google.mediapipe.framework.image.MPImage): Bitmap {
        val output = original.copy(Bitmap.Config.ARGB_8888, true)
        val maskBuffer = mask.asBitmapForSharedBuffer()
        // Aplikuj maske: piksele tla -> przezroczyste
        for (x in 0 until original.width) {
            for (y in 0 until original.height) {
                val maskValue = maskBuffer.getPixel(x, y) and 0xFF
                if (maskValue == 0) {  // tlo
                    output.setPixel(x, y, android.graphics.Color.TRANSPARENT)
                }
            }
        }
        return output
    }
}
```

### 3.3 SAM Mobile (Segment Anything Model)

MobileSAM to skompresowana wersja SAM od Meta:
- 9,66M params vs 615M w oryginale (63x mniejszy)
- Image encoder: TinyViT zamiast ViT-H
- Predkosc: ok. 40 ms na iPhone 14 Pro (Core ML)

---

## 4. Sledzenie obiektow w czasie rzeczywistym

### 4.1 Podejscia do object tracking

- **Tracking-by-detection**: wykrywaj w kazdej klatce + IoU matching
- **Single Object Tracking (SOT)**: SiamFC, ATOM -- jeden obiekt, wysoka precyzja
- **Multi Object Tracking (MOT)**: SORT, DeepSORT -- wiele obiektow

### 4.2 Prosty tracker z IoU matching

```kotlin
data class TrackedObject(
    val id: Int,
    val boundingBox: android.graphics.RectF,
    val label: String,
    var missedFrames: Int = 0
)

class SimpleTracker {
    private var nextId = 0
    private val tracked = mutableListOf<TrackedObject>()
    private val MAX_MISSED_FRAMES = 5

    fun update(detections: List<DetectionResult>): List<TrackedObject> {
        val matched = mutableSetOf<Int>()

        // Dopasuj detekcje do istniejacych sladow przez IoU
        detections.forEach { detection ->
            val best = tracked
                .filter { it.id !in matched }
                .maxByOrNull { iou(it.boundingBox, detection.boundingBox) }

            if (best != null && iou(best.boundingBox, detection.boundingBox) > 0.3f) {
                best.boundingBox.set(detection.boundingBox)
                best.missedFrames = 0
                matched.add(best.id)
            } else {
                // Nowy obiekt
                tracked.add(TrackedObject(nextId++, detection.boundingBox, detection.label))
            }
        }

        // Usun slady bez detekcji
        tracked.forEach { if (it.id !in matched) it.missedFrames++ }
        tracked.removeAll { it.missedFrames > MAX_MISSED_FRAMES }

        return tracked.toList()
    }

    private fun iou(a: android.graphics.RectF, b: android.graphics.RectF): Float {
        val intersect = android.graphics.RectF()
        if (!intersect.setIntersect(a, b)) return 0f
        val intersectArea = intersect.width() * intersect.height()
        val unionArea = a.width() * a.height() + b.width() * b.height() - intersectArea
        return if (unionArea > 0) intersectArea / unionArea else 0f
    }
}
```

---

## 5. Super-Resolution: ESRGAN Mobile

### 5.1 Czym jest Super-Resolution?

Super-Resolution (SR) zwieksza rozdzielczosc obrazu przy uzyciu AI:
- Uzupelnia szczegoly utracone przy kompresji/skalowaniu
- Zastosowania: powiekszanie zdjec, poprawa jakosci skanow

### 5.2 ESRGAN Mobile dla Androida

```kotlin
class SuperResolutionEngine(private val context: Context) {

    private val interpreter: Interpreter by lazy {
        val options = Interpreter.Options().apply {
            addDelegate(GpuDelegate())
            numThreads = 2
        }
        Interpreter(FileUtil.loadMappedFile(context, "esrgan_mobile.tflite"), options)
    }

    fun upscale2x(inputBitmap: Bitmap): Bitmap {
        // Przygotuj input (np. 200x200)
        val inputW = inputBitmap.width
        val inputH = inputBitmap.height
        val outputW = inputW * 2
        val outputH = inputH * 2

        // Input tensor: [1, H, W, 3] float32 [0, 1]
        val inputBuffer = ByteBuffer.allocateDirect(1 * inputH * inputW * 3 * 4)
            .apply { order(ByteOrder.nativeOrder()) }

        val pixels = IntArray(inputW * inputH)
        inputBitmap.getPixels(pixels, 0, inputW, 0, 0, inputW, inputH)
        pixels.forEach { px ->
            inputBuffer.putFloat((px shr 16 and 0xFF) / 255.0f)
            inputBuffer.putFloat((px shr 8  and 0xFF) / 255.0f)
            inputBuffer.putFloat((px        and 0xFF) / 255.0f)
        }

        // Output tensor: [1, 2H, 2W, 3] float32 [0, 1]
        val outputBuffer = Array(1) { Array(outputH) { Array(outputW) { FloatArray(3) } } }

        interpreter.run(inputBuffer, outputBuffer)

        // Konwertuj output na Bitmap
        val outputBitmap = Bitmap.createBitmap(outputW, outputH, Bitmap.Config.ARGB_8888)
        for (y in 0 until outputH) {
            for (x in 0 until outputW) {
                val r = (outputBuffer[0][y][x][0] * 255).toInt().coerceIn(0, 255)
                val g = (outputBuffer[0][y][x][1] * 255).toInt().coerceIn(0, 255)
                val b = (outputBuffer[0][y][x][2] * 255).toInt().coerceIn(0, 255)
                outputBitmap.setPixel(x, y, android.graphics.Color.rgb(r, g, b))
            }
        }
        return outputBitmap
    }
}
```

---

## 6. Detekcja twarzy i 478 landmarkow

### 6.1 MediaPipe Face Detection

```kotlin
import com.google.mediapipe.tasks.vision.facedetector.FaceDetector
import com.google.mediapipe.tasks.vision.facedetector.FaceDetector.FaceDetectorOptions

class FaceDetectionPipeline(private val context: Context) {

    private val detector: FaceDetector

    init {
        val options = FaceDetectorOptions.builder()
            .setBaseOptions(
                com.google.mediapipe.tasks.core.BaseOptions.builder()
                    .setModelAssetPath("face_detection_short_range.tflite")
                    .build()
            )
            .setMinDetectionConfidence(0.5f)
            .build()
        detector = FaceDetector.createFromOptions(context, options)
    }

    fun detectFaces(bitmap: Bitmap): List<FaceBox> {
        val mpImage = com.google.mediapipe.framework.image.BitmapImageBuilder(bitmap).build()
        val result = detector.detect(mpImage)

        return result.detections().map { detection ->
            val box = detection.boundingBox()
            FaceBox(
                rect = android.graphics.RectF(box.left, box.top, box.right, box.bottom),
                score = detection.categories().first().score(),
                keypoints = detection.keypoints().orEmpty().map {
                    android.graphics.PointF(it.x(), it.y())
                }
            )
        }
    }
}

data class FaceBox(
    val rect: android.graphics.RectF,
    val score: Float,
    val keypoints: List<android.graphics.PointF>
)
```

### 6.2 MediaPipe Face Landmarker (478 punktow)

```kotlin
import com.google.mediapipe.tasks.vision.facelandmarker.FaceLandmarker

class FaceLandmarkDetector(private val context: Context) {

    private val landmarker: FaceLandmarker

    init {
        val options = FaceLandmarker.FaceLandmarkerOptions.builder()
            .setBaseOptions(
                com.google.mediapipe.tasks.core.BaseOptions.builder()
                    .setModelAssetPath("face_landmarker.task")
                    .build()
            )
            .setNumFaces(2)
            .setMinFaceDetectionConfidence(0.5f)
            .setOutputFaceBlendshapes(true)  // 52 blendshapes do AR
            .build()
        landmarker = FaceLandmarker.createFromOptions(context, options)
    }

    fun detectLandmarks(bitmap: Bitmap): FaceLandmarkResult {
        val mpImage = com.google.mediapipe.framework.image.BitmapImageBuilder(bitmap).build()
        val result = landmarker.detect(mpImage)

        val faces = result.faceLandmarks().map { landmarks ->
            // 478 punktow: x, y, z (z = glebokos znormalizowana)
            landmarks.map { lm -> Triple(lm.x(), lm.y(), lm.z()) }
        }

        val blendshapes = result.faceBlendshapes().orEmpty().map { face ->
            face.associate { it.categoryName() to it.score() }
        }

        return FaceLandmarkResult(faces, blendshapes)
    }
}

data class FaceLandmarkResult(
    val faces: List<List<Triple<Float, Float, Float>>>,
    val blendshapes: List<Map<String, Float>>  // np. "mouthOpen" -> 0.82
)
```

---

## 7. Rozpoznawanie gestow rak (MediaPipe Hands)

```kotlin
import com.google.mediapipe.tasks.vision.handlandmarker.HandLandmarker

class HandGestureRecognizer(private val context: Context) {

    private val handLandmarker: HandLandmarker

    init {
        val options = HandLandmarker.HandLandmarkerOptions.builder()
            .setBaseOptions(
                com.google.mediapipe.tasks.core.BaseOptions.builder()
                    .setModelAssetPath("hand_landmarker.task")
                    .build()
            )
            .setNumHands(2)
            .setMinHandDetectionConfidence(0.5f)
            .setMinTrackingConfidence(0.5f)
            .build()
        handLandmarker = HandLandmarker.createFromOptions(context, options)
    }

    fun recognizeGesture(bitmap: Bitmap): List<String> {
        val mpImage = com.google.mediapipe.framework.image.BitmapImageBuilder(bitmap).build()
        val result = handLandmarker.detect(mpImage)

        return result.handLandmarks().mapIndexed { idx, landmarks ->
            val handedness = result.handedness()[idx].first().categoryName()
            val gesture = classifyGesture(landmarks)
            "$handedness: $gesture"
        }
    }

    // Prosta klasyfikacja gestow na podstawie pozycji palcow
    private fun classifyGesture(
        landmarks: List<com.google.mediapipe.tasks.components.containers.NormalizedLandmark>
    ): String {
        // Punkt 8 = czubek wskaziciela, punkt 6 = srodek wskaziciela
        val indexTip = landmarks[8]
        val indexPip = landmarks[6]
        val indexExtended = indexTip.y() < indexPip.y()

        val middleTip = landmarks[12]
        val middlePip = landmarks[10]
        val middleExtended = middleTip.y() < middlePip.y()

        // Kciuk
        val thumbTip = landmarks[4]
        val thumbMcp = landmarks[2]
        val thumbExtended = thumbTip.x() > thumbMcp.x()

        return when {
            indexExtended && !middleExtended -> "pointing"
            indexExtended && middleExtended -> "peace"
            thumbExtended && !indexExtended -> "thumbs_up"
            !indexExtended && !middleExtended -> "fist"
            else -> "open_hand"
        }
    }
}
```

---

## 8. OCR: ML Kit Text Recognition v2

### 8.1 Rozpoznawanie tekstu na Androidzie

```kotlin
// build.gradle.kts
// implementation("com.google.mlkit:text-recognition:16.0.0")
// implementation("com.google.mlkit:text-recognition-latin:16.0.0")

import com.google.mlkit.vision.common.InputImage
import com.google.mlkit.vision.text.TextRecognition
import com.google.mlkit.vision.text.latin.TextRecognizerOptions
import kotlinx.coroutines.tasks.await

class MLKitOCR {

    private val recognizer = TextRecognition.getClient(
        TextRecognizerOptions.DEFAULT_OPTIONS
    )

    suspend fun recognizeText(bitmap: Bitmap): OcrResult {
        val image = InputImage.fromBitmap(bitmap, 0)
        val result = recognizer.process(image).await()

        val blocks = result.textBlocks.map { block ->
            TextBlock(
                text = block.text,
                boundingBox = block.boundingBox,
                lines = block.lines.map { line ->
                    TextLine(
                        text = line.text,
                        confidence = line.confidence ?: 0f,
                        elements = line.elements.map { it.text }
                    )
                }
            )
        }

        return OcrResult(
            fullText = result.text,
            blocks = blocks,
            language = result.textBlocks.firstOrNull()?.recognizedLanguage
        )
    }

    fun close() = recognizer.close()
}

data class OcrResult(
    val fullText: String,
    val blocks: List<TextBlock>,
    val language: String?
)

data class TextBlock(
    val text: String,
    val boundingBox: android.graphics.Rect?,
    val lines: List<TextLine>
)

data class TextLine(
    val text: String,
    val confidence: Float,
    val elements: List<String>
)
```

### 8.2 Vision framework OCR na iOS

```swift
import Vision
import UIKit

class VisionOCR {

    func recognizeText(in image: UIImage) async throws -> [VNRecognizedTextObservation] {
        guard let cgImage = image.cgImage else { throw OCRError.invalidImage }

        return try await withCheckedThrowingContinuation { continuation in
            let request = VNRecognizeTextRequest { request, error in
                if let error = error {
                    continuation.resume(throwing: error)
                    return
                }
                let observations = request.results as? [VNRecognizedTextObservation] ?? []
                continuation.resume(returning: observations)
            }

            // Konfiguracja rozpoznawania
            request.recognitionLevel = .accurate       // lub .fast
            request.recognitionLanguages = ["pl-PL", "en-US"]
            request.usesLanguageCorrection = true

            let handler = VNImageRequestHandler(
                cgImage: cgImage,
                orientation: .up
            )
            do { try handler.perform([request]) }
            catch { continuation.resume(throwing: error) }
        }
    }

    func extractText(from image: UIImage) async throws -> String {
        let observations = try await recognizeText(in: image)
        return observations.compactMap { observation in
            observation.topCandidates(1).first?.string
        }.joined(separator: "\n")
    }
}

enum OCRError: Error { case invalidImage }
```

---

## 9. Skanowanie dokumentow

### 9.1 Document Scanner z perspektywna korekcja

```kotlin
import org.opencv.android.OpenCVLoader
import org.opencv.core.*
import org.opencv.imgproc.Imgproc

class DocumentScanner {

    fun detectAndCorrect(bitmap: Bitmap): Bitmap? {
        val mat = Mat()
        org.opencv.android.Utils.bitmapToMat(bitmap, mat)

        // 1. Preprocessing: grayscale + blur + edge detection
        val gray = Mat()
        Imgproc.cvtColor(mat, gray, Imgproc.COLOR_BGR2GRAY)
        Imgproc.GaussianBlur(gray, gray, Size(5.0, 5.0), 0.0)
        val edges = Mat()
        Imgproc.Canny(gray, edges, 75.0, 200.0)

        // 2. Znajdz kontury
        val contours = mutableListOf<MatOfPoint>()
        val hierarchy = Mat()
        Imgproc.findContours(
            edges, contours, hierarchy,
            Imgproc.RETR_EXTERNAL, Imgproc.CHAIN_APPROX_SIMPLE
        )

        // 3. Wybierz najwiekszy kontur przypominajacy prostokat
        val docContour = contours
            .filter { Imgproc.contourArea(it) > 1000 }
            .maxByOrNull { Imgproc.contourArea(it) }
            ?: return null

        val approx = MatOfPoint2f()
        val peri = Imgproc.arcLength(MatOfPoint2f(*docContour.toArray()), true)
        Imgproc.approxPolyDP(MatOfPoint2f(*docContour.toArray()), approx, 0.02 * peri, true)

        if (approx.rows() != 4) return null

        // 4. Korekcja perspektywy (four-point transform)
        return fourPointTransform(mat, approx)
    }

    private fun fourPointTransform(src: Mat, pts: MatOfPoint2f): Bitmap {
        val points = pts.toArray().sortedBy { it.x + it.y }
        val tl = points[0]
        val br = points[3]
        val tr = if (points[1].x > points[2].x) points[1] else points[2]
        val bl = if (points[1].x < points[2].x) points[1] else points[2]

        val width = maxOf(
            Math.sqrt(Math.pow(br.x - bl.x, 2.0) + Math.pow(br.y - bl.y, 2.0)),
            Math.sqrt(Math.pow(tr.x - tl.x, 2.0) + Math.pow(tr.y - tl.y, 2.0))
        ).toInt()

        val height = maxOf(
            Math.sqrt(Math.pow(tr.x - br.x, 2.0) + Math.pow(tr.y - br.y, 2.0)),
            Math.sqrt(Math.pow(tl.x - bl.x, 2.0) + Math.pow(tl.y - bl.y, 2.0))
        ).toInt()

        val srcPts = MatOfPoint2f(tl, tr, br, bl)
        val dstPts = MatOfPoint2f(
            Point(0.0, 0.0), Point(width.toDouble(), 0.0),
            Point(width.toDouble(), height.toDouble()), Point(0.0, height.toDouble())
        )

        val M = Imgproc.getPerspectiveTransform(srcPts, dstPts)
        val warped = Mat()
        Imgproc.warpPerspective(src, warped, M, Size(width.toDouble(), height.toDouble()))

        val result = Bitmap.createBitmap(width, height, Bitmap.Config.ARGB_8888)
        org.opencv.android.Utils.matToBitmap(warped, result)
        return result
    }
}
```

---

## 10. Preprocessing obrazow dla modeli AI

### 10.1 Normalizacja i resize

```kotlin
object ImagePreprocessor {

    /**
     * Przygotuj Bitmap do wejscia modelu TFLite.
     * @param inputMean srednia normalizacji (np. 127.5 dla [-1,1], 0 dla [0,1])
     * @param inputStd odchylenie standardowe (np. 127.5 dla [-1,1], 255 dla [0,1])
     */
    fun preprocessBitmap(
        bitmap: Bitmap,
        targetWidth: Int,
        targetHeight: Int,
        inputMean: Float = 127.5f,
        inputStd: Float = 127.5f
    ): ByteBuffer {
        val scaledBitmap = Bitmap.createScaledBitmap(
            bitmap, targetWidth, targetHeight, true
        )

        val buffer = ByteBuffer.allocateDirect(
            1 * targetHeight * targetWidth * 3 * 4  // float32
        ).apply { order(ByteOrder.nativeOrder()) }

        val pixels = IntArray(targetWidth * targetHeight)
        scaledBitmap.getPixels(pixels, 0, targetWidth, 0, 0, targetWidth, targetHeight)

        for (px in pixels) {
            buffer.putFloat(((px shr 16 and 0xFF) - inputMean) / inputStd)
            buffer.putFloat(((px shr 8  and 0xFF) - inputMean) / inputStd)
            buffer.putFloat(((px        and 0xFF) - inputMean) / inputStd)
        }

        return buffer
    }

    /**
     * Padding z zachowaniem aspect ratio (letterbox).
     */
    fun letterboxBitmap(bitmap: Bitmap, targetSize: Int): Bitmap {
        val scale = minOf(
            targetSize.toFloat() / bitmap.width,
            targetSize.toFloat() / bitmap.height
        )
        val newW = (bitmap.width * scale).toInt()
        val newH = (bitmap.height * scale).toInt()
        val padLeft = (targetSize - newW) / 2
        val padTop = (targetSize - newH) / 2

        val result = Bitmap.createBitmap(targetSize, targetSize, Bitmap.Config.ARGB_8888)
        val canvas = android.graphics.Canvas(result)
        canvas.drawColor(android.graphics.Color.GRAY)
        val scaled = Bitmap.createScaledBitmap(bitmap, newW, newH, true)
        canvas.drawBitmap(scaled, padLeft.toFloat(), padTop.toFloat(), null)
        return result
    }
}
```

### 10.2 Obsluga orientacji i CVPixelBuffer (iOS)

```swift
import CoreVideo
import UIKit

extension UIImage {

    // Konwersja UIImage -> CVPixelBuffer (wymagane przez niektore modele Core ML)
    func toCVPixelBuffer(width: Int, height: Int) -> CVPixelBuffer? {
        var pixelBuffer: CVPixelBuffer?
        let attrs: [String: Any] = [
            kCVPixelBufferCGImageCompatibilityKey as String: true,
            kCVPixelBufferCGBitmapContextCompatibilityKey as String: true
        ]
        CVPixelBufferCreate(
            kCFAllocatorDefault, width, height,
            kCVPixelFormatType_32ARGB, attrs as CFDictionary,
            &pixelBuffer
        )
        guard let buffer = pixelBuffer else { return nil }

        CVPixelBufferLockBaseAddress(buffer, [])
        let context = CGContext(
            data: CVPixelBufferGetBaseAddress(buffer),
            width: width, height: height,
            bitsPerComponent: 8, bytesPerRow: CVPixelBufferGetBytesPerRow(buffer),
            space: CGColorSpaceCreateDeviceRGB(),
            bitmapInfo: CGImageAlphaInfo.noneSkipFirst.rawValue
        )

        // Korekcja orientacji EXIF przed rysowaniem
        context?.translateBy(x: 0, y: CGFloat(height))
        context?.scaleBy(x: 1, y: -1)

        guard let cgImage = self.cgImage else { return nil }
        context?.draw(cgImage, in: CGRect(x: 0, y: 0, width: width, height: height))

        CVPixelBufferUnlockBaseAddress(buffer, [])
        return buffer
    }

    // Normalizacja do [0, 1] jako MultiArray dla Core ML
    func toMLMultiArray(width: Int, height: Int) throws -> MLMultiArray {
        guard let scaled = self.resize(to: CGSize(width: width, height: height)),
              let cgImage = scaled.cgImage else {
            throw ProcessingError.conversionFailed
        }

        let array = try MLMultiArray(shape: [1, 3, NSNumber(value: height), NSNumber(value: width)],
                                     dataType: .float32)
        let data = cgImage.dataProvider?.data
        let bytes = CFDataGetBytePtr(data)

        for y in 0..<height {
            for x in 0..<width {
                let i = (y * width + x) * 4
                let r = Float(bytes![i]) / 255.0
                let g = Float(bytes![i+1]) / 255.0
                let b = Float(bytes![i+2]) / 255.0
                array[[0, 0, y, x] as [NSNumber]] = NSNumber(value: r)
                array[[0, 1, y, x] as [NSNumber]] = NSNumber(value: g)
                array[[0, 2, y, x] as [NSNumber]] = NSNumber(value: b)
            }
        }
        return array
    }

    func resize(to size: CGSize) -> UIImage? {
        UIGraphicsBeginImageContextWithOptions(size, false, 1.0)
        defer { UIGraphicsEndImageContext() }
        draw(in: CGRect(origin: .zero, size: size))
        return UIGraphicsGetImageFromCurrentImageContext()
    }
}

enum ProcessingError: Error { case conversionFailed }
```

---

## 11. Benchmarki: zadania wizyjne na mobile

### 11.1 Detekcja obiektow (COCO mAP vs latency, Pixel 6)

| Model | COCO mAP | CPU latency | GPU latency | Uwagi |
|---|---|---|---|---|
| SSD MobileNetV2 | 22,2% | 75 ms | 25 ms | klasyczny wybor |
| SSD MobileNetV3-L | 25,6% | 65 ms | 22 ms | lepszy accuracy |
| EfficientDet-Lite0 | 25,7% | 146 ms | 48 ms | najlepszy balans |
| EfficientDet-Lite2 | 32,0% | 263 ms | 86 ms | wysoka dokladnosc |
| YOLOv8n (ONNX INT8) | 37,3% | 120 ms | 35 ms | nowoczesny YOLO |

### 11.2 Segmentacja (MediaPipe, iPhone 14 Pro)

| Model | Zadanie | ANE latency | Dokładność |
|---|---|---|---|
| MediaPipe Selfie Seg | Person/bg | 8 ms | ~96% IoU |
| DeepLab v3 MNetV3 | 21 klas | 45 ms | 76,2% mIoU |
| MobileSAM | Dowolna klasa | 40 ms | ~92% mIoU |

---

## 12. Dobre praktyki

1. **Letterbox zamiast prostego resize** -- zachowaj aspect ratio, unikaj deformacji detektowanych obiektow
2. **Poprawna orientacja EXIF** -- sprawdz rotacje obrazu przed przekazaniem do modelu
3. **GPU delegate dla computer vision** -- inference na GPU jest 3-5x szybszy niz CPU
4. **Batch preprocessing** -- grupuj operacje na Bitmap, unikaj wielu mniejszych alokacji
5. **Non-Maximum Suppression (NMS)** po detekcji -- usun dublujace sie boxy (threshold IoU=0.5)
6. **Threshold pewnosci** -- nie wyswietlaj detekcji ponizej 0.3-0.4 confidence
7. **MediaPipe Tasks API** -- uzyj zamiast TFLite dla typowych zadan (detection, segmentation, OCR)
8. **KEEP_ONLY_LATEST** w CameraX -- unikaj kolejkowania klatek przy wolnym modelu

---

## Powiązane artykuły

- [Wprowadzenie do lokalnego AI na mobile](local-ai-intro.md)
- [Sieci neuronowe na urządzeniu mobilnym](neural-networks-mobile.md)
- [MediaPipe na mobile](mediapipe-mobile.md)
- [Wnioskowanie lokalne -- architektura i wydajność](on-device-inference.md)
- [Kwantyzacja i optymalizacja modeli AI](model-quantization.md)
- [AI mowy i NLP na mobile](ai-speech-nlp.md)
- [Camera API na mobile](camera-api.md)
