# Camera API i Przetwarzanie Obrazu

Kamera to jeden z najważniejszych sensorów urządzenia mobilnego. CameraX (Android) i AVFoundation (iOS) udostępniają nowoczesne API do podglądu, fotografowania, nagrywania wideo i analizy klatek w czasie rzeczywistym.

## CameraX — architektura

CameraX to biblioteka Jetpack, która abstrahuje nad niskim Camera2 API. Trzy niezależne use case'y można łączyć dowolnie:

```
┌──────────────────────────────────────────────────────┐
│                    CameraX Use Cases                  │
├──────────────┬──────────────────┬────────────────────┤
│   Preview    │  ImageCapture    │  ImageAnalysis     │
│ (podgląd     │  (zdjęcia JPEG)  │  (analiza klatek   │
│  live)       │                  │   w real-time)     │
├──────────────┴──────────────────┴────────────────────┤
│           VideoCapture (nagrywanie wideo)             │
└──────────────────────────────────────────────────────┘
```

```kotlin
dependencies {
    val camerax = "1.3.4"
    implementation("androidx.camera:camera-camera2:$camerax")
    implementation("androidx.camera:camera-lifecycle:$camerax")
    implementation("androidx.camera:camera-view:$camerax")
    implementation("androidx.camera:camera-mlkit-vision:$camerax")
    implementation("com.google.mlkit:barcode-scanning:17.2.0")
    implementation("com.google.mlkit:face-detection:16.1.6")
    implementation("com.google.mlkit:text-recognition:16.0.0")
}
```

## Podgląd kamery w Compose

```kotlin
@Composable
fun CameraPreviewScreen(onPhotoTaken: (Uri) -> Unit) {
    val context = LocalContext.current
    val lifecycleOwner = LocalLifecycleOwner.current

    val preview     = remember { Preview.Builder().build() }
    val imageCapture = remember {
        ImageCapture.Builder()
            .setCaptureMode(ImageCapture.CAPTURE_MODE_MINIMIZE_LATENCY)
            .setFlashMode(ImageCapture.FLASH_MODE_AUTO)
            .build()
    }

    AndroidView(
        factory = { ctx ->
            PreviewView(ctx).apply {
                implementationMode = PreviewView.ImplementationMode.COMPATIBLE
                scaleType = PreviewView.ScaleType.FILL_CENTER
            }
        },
        modifier = Modifier.fillMaxSize(),
        update = { previewView ->
            ProcessCameraProvider.getInstance(context).addListener({
                val cameraProvider = ProcessCameraProvider.getInstance(context).get()
                preview.setSurfaceProvider(previewView.surfaceProvider)
                cameraProvider.unbindAll()
                cameraProvider.bindToLifecycle(
                    lifecycleOwner,
                    CameraSelector.DEFAULT_BACK_CAMERA,
                    preview,
                    imageCapture
                )
            }, ContextCompat.getMainExecutor(context))
        }
    )

    // Spust migawki
    Box(Modifier.fillMaxSize(), contentAlignment = Alignment.BottomCenter) {
        IconButton(
            onClick = {
                val file = File(context.cacheDir, "photo_${System.currentTimeMillis()}.jpg")
                val opts = ImageCapture.OutputFileOptions.Builder(file).build()
                imageCapture.takePicture(
                    opts, ContextCompat.getMainExecutor(context),
                    object : ImageCapture.OnImageSavedCallback {
                        override fun onImageSaved(out: ImageCapture.OutputFileResults) =
                            onPhotoTaken(out.savedUri ?: Uri.fromFile(file))
                        override fun onError(e: ImageCaptureException) =
                            Log.e("CameraX", "Błąd: ${e.message}")
                    }
                )
            },
            modifier = Modifier.padding(bottom = 32.dp).size(72.dp)
                .background(Color.White, CircleShape)
        ) {
            Icon(Icons.Default.Camera, "Zrób zdjęcie", tint = Color.Black)
        }
    }
}
```

## ImageAnalysis — skaner kodów QR/EAN

```kotlin
class BarcodeAnalyzer(
    private val onBarcodeDetected: (String) -> Unit
) : ImageAnalysis.Analyzer {

    private val scanner = BarcodeScanning.getClient(
        BarcodeScannerOptions.Builder()
            .setBarcodeFormats(Barcode.FORMAT_QR_CODE, Barcode.FORMAT_EAN_13)
            .build()
    )

    @androidx.camera.core.ExperimentalGetImage
    override fun analyze(imageProxy: ImageProxy) {
        val mediaImage = imageProxy.image ?: run { imageProxy.close(); return }
        val image = InputImage.fromMediaImage(mediaImage, imageProxy.imageInfo.rotationDegrees)
        scanner.process(image)
            .addOnSuccessListener { barcodes ->
                barcodes.firstOrNull()?.rawValue?.let(onBarcodeDetected)
            }
            .addOnCompleteListener { imageProxy.close() }  // ZAWSZE zamknij!
    }
}

// Podpięcie analizatora do CameraX
val imageAnalysis = ImageAnalysis.Builder()
    .setTargetResolution(Size(1280, 720))
    .setBackpressureStrategy(ImageAnalysis.STRATEGY_KEEP_ONLY_LATEST) // ignoruj stare klatki
    .build()
    .also { it.setAnalyzer(Executors.newSingleThreadExecutor(), BarcodeAnalyzer { code ->
        Log.d("Barcode", "Zeskanowano: $code")
    })}
```

## Nagrywanie wideo

```kotlin
val recorder = Recorder.Builder()
    .setQualitySelector(QualitySelector.from(Quality.HIGHEST))
    .build()
val videoCapture = VideoCapture.withOutput(recorder)
var activeRecording: Recording? = null

fun startRecording(context: Context, onSaved: (Uri) -> Unit) {
    val file = File(context.filesDir, "video_${System.currentTimeMillis()}.mp4")
    activeRecording = videoCapture.output
        .prepareRecording(context, FileOutputOptions.Builder(file).build())
        .withAudioEnabled()
        .start(ContextCompat.getMainExecutor(context)) { event ->
            if (event is VideoRecordEvent.Finalize && !event.hasError())
                onSaved(event.outputResults.outputUri)
        }
}

fun stopRecording() = activeRecording?.stop()
```

## ML Kit — detekcja twarzy i OCR

```kotlin
// Detekcja twarzy — uśmiech, otwarte oczy, tracking ID
val faceDetector = FaceDetection.getClient(
    FaceDetectorOptions.Builder()
        .setPerformanceMode(FaceDetectorOptions.PERFORMANCE_MODE_FAST)
        .setClassificationMode(FaceDetectorOptions.CLASSIFICATION_MODE_ALL) // uśmiech, oczy
        .enableTracking()
        .build()
)

fun processFaces(imageProxy: ImageProxy) {
    val image = InputImage.fromMediaImage(imageProxy.image!!, imageProxy.imageInfo.rotationDegrees)
    faceDetector.process(image)
        .addOnSuccessListener { faces ->
            faces.forEach { face ->
                val smileProb  = face.smilingProbability  ?: 0f
                val eyeOpen    = face.leftEyeOpenProbability ?: 0f
                val id         = face.trackingId
                Log.d("Face", "#$id uśmiech=${"%.0f".format(smileProb*100)}% oko=${"%.0f".format(eyeOpen*100)}%")
            }
        }
        .addOnCompleteListener { imageProxy.close() }
}

// OCR — rozpoznawanie tekstu ze zdjęcia
val recognizer = TextRecognition.getClient(TextRecognizerOptions.DEFAULT_OPTIONS)

fun recognizeText(bitmap: Bitmap, onResult: (String) -> Unit) {
    recognizer.process(InputImage.fromBitmap(bitmap, 0))
        .addOnSuccessListener { result ->
            val text = result.textBlocks.joinToString("\n") { block ->
                block.lines.joinToString(" ") { it.text }
            }
            onResult(text)
        }
}
```

## Uprawnienia — Compose

```kotlin
val cameraPermission = rememberPermissionState(Manifest.permission.CAMERA)

when {
    cameraPermission.status.isGranted -> CameraPreviewScreen(...)
    cameraPermission.status.shouldShowRationale -> {
        Column(Modifier.padding(24.dp)) {
            Text("Potrzebujemy dostępu do kamery, aby skanować kody QR i robić zdjęcia.")
            Spacer(Modifier.height(12.dp))
            Button(onClick = { cameraPermission.launchPermissionRequest() }) {
                Text("Zezwól")
            }
        }
    }
    else -> LaunchedEffect(Unit) { cameraPermission.launchPermissionRequest() }
}
```

## AVFoundation (iOS) — szybki start

```swift
import AVFoundation

class CameraSession: NSObject, ObservableObject {
    let session = AVCaptureSession()
    private let output = AVCapturePhotoOutput()

    func configure() {
        session.beginConfiguration()
        session.sessionPreset = .photo
        guard
            let device = AVCaptureDevice.default(.builtInWideAngleCamera, for: .video, position: .back),
            let input = try? AVCaptureDeviceInput(device: device)
        else { return }
        session.addInput(input)
        session.addOutput(output)
        session.commitConfiguration()
        DispatchQueue.global(qos: .userInitiated).async { self.session.startRunning() }
    }

    func capturePhoto() {
        output.capturePhoto(with: AVCapturePhotoSettings(), delegate: self)
    }
}
```

## Linki

- [CameraX Docs](https://developer.android.com/training/camerax)
- [ML Kit Vision](https://developers.google.com/ml-kit/vision)
- [CameraX Samples GitHub](https://github.com/android/camera-samples)
- [AVFoundation (Apple)](https://developer.apple.com/documentation/avfoundation/capture_setup)
