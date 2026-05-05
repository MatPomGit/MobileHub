# Wnioskowanie lokalne - architektura i wydajność

## Streszczenie

Artykuł opisuje architekturę i optymalizację potoku wnioskowania (inference pipeline) w aplikacjach mobilnych. Omówiono cykl życia modelu, asynchroniczne inference z Kotlin Coroutines i Swift async/await, zarządzanie wątkami, batch processing, pipeline parallelism, profilowanie, akcelerację sprzętową (NNAPI, ANE) oraz strategie fallback NPU→GPU→CPU.

**Słowa kluczowe:** inference pipeline, on-device inference, NNAPI, Core ML, Apple Neural Engine, NPU, GPU delegate, Kotlin Coroutines, Swift async/await, CameraX, TFLite Benchmark, thermal throttling, memory optimization, warm-up, profiling

---

## 1. Anatomia potoku wnioskowania

Typowy inference pipeline w aplikacji mobilnej składa się z następujących etapów:

```
Zrodlo danych (kamera/plik)
       |
  [PREPROCESS]  -- resize, normalize, format conversion
       |
  [LOAD MODEL]  -- zaladowanie modelu do pamieci (jednorazowo)
       |
  [RUN INFERENCE] -- wykonanie modelu (CPU/GPU/NPU)
       |
  [POSTPROCESS] -- dekodowanie wynikow, NMS, thresholding
       |
  Wyniki (UI / kolejny etap)
```

### 1.1 Czas spędzony w każdym etapie

Typowy rozkład czasu dla detekcji obiektów (SSD MobileNet, Pixel 6):

| Etap | Czas | Udział |
|---|---|---|
| Capture/decode klatki | 8 ms | 11% |
| Preprocessing (resize+normalize) | 5 ms | 7% |
| Inference (CPU) | 55 ms | 76% |
| Postprocessing (NMS) | 4 ms | 6% |
| RAZEM | 72 ms | 100% |

Dla GPU delegate:
| Etap | Czas | Udział |
|---|---|---|
| Preprocessing | 5 ms | 22% |
| Inference (GPU) | 15 ms | 65% |
| Postprocessing | 3 ms | 13% |
| RAZEM | 23 ms | 100% |

---

## 2. Cykl życia modelu

### 2.1 Kiedy ładować i zwalniać model?

```kotlin
// Antywzorzec: ladowanie modelu przy kazdym zapytaniu
fun classifyBadPattern(bitmap: Bitmap): String {
    val interpreter = Interpreter(loadModelFile())  // WOLNE!
    val result = runInference(interpreter, bitmap)
    interpreter.close()
    return result
}

// Poprawny wzorzec: lazy init + singleton przez ViewModel
class InferenceViewModel(app: Application) : AndroidViewModel(app) {

    private val interpreter: Interpreter by lazy {
        val options = Interpreter.Options().apply {
            numThreads = 4
            useNNAPI = true
        }
        Interpreter(FileUtil.loadMappedFile(app, "model.tflite"), options)
    }

    override fun onCleared() {
        super.onCleared()
        if (::interpreter.isInitialized) interpreter.close()
    }
}
```

### 2.2 Strategie zarzadzania modelem

- **Eager loading**: laduj model przy starcie aplikacji -- dobre dla malych modeli (<5 MB)
- **Lazy loading**: laduj przy pierwszym uzyciu -- dobre dla duzych modeli
- **Preloading w tle**: laduj w tle po starcie, zanim uzytkownik trafi do funkcji AI
- **Unloading**: zwolnij model gdy aplikacja idzie w tlo (onStop) -- oszczednosc RAM

---

## 3. Asynchroniczne wnioskowanie

### 3.1 Kotlin Coroutines dla inference

```kotlin
import kotlinx.coroutines.*
import kotlinx.coroutines.flow.*

class InferenceEngine(private val context: Context) {

    private val inferenceDispatcher = Dispatchers.Default.limitedParallelism(2)
    private val interpreter: Interpreter by lazy { buildInterpreter() }

    // Pojedyncze wnioskowanie
    suspend fun infer(bitmap: Bitmap): InferenceResult =
        withContext(inferenceDispatcher) {
            val input = preprocess(bitmap)
            val output = Array(1) { FloatArray(NUM_CLASSES) }
            interpreter.run(input, output)
            postprocess(output[0])
        }

    // Flow dla kamery -- przetwarza klatki z backpressure
    fun inferenceFlow(frames: Flow<Bitmap>): Flow<InferenceResult> =
        frames
            .buffer(capacity = 1, onBufferOverflow = BufferOverflow.DROP_OLDEST)
            .map { bitmap -> infer(bitmap) }
            .flowOn(inferenceDispatcher)

    private fun preprocess(bitmap: Bitmap): ByteBuffer {
        val buffer = ByteBuffer.allocateDirect(1 * INPUT_H * INPUT_W * 3 * 4)
        buffer.order(ByteOrder.nativeOrder())
        val pixels = IntArray(INPUT_H * INPUT_W)
        bitmap.getPixels(pixels, 0, INPUT_W, 0, 0, INPUT_W, INPUT_H)
        pixels.forEach { px ->
            buffer.putFloat(((px shr 16 and 0xFF) - 127.5f) / 127.5f) // R
            buffer.putFloat(((px shr 8  and 0xFF) - 127.5f) / 127.5f) // G
            buffer.putFloat(((px        and 0xFF) - 127.5f) / 127.5f) // B
        }
        return buffer
    }

    private fun postprocess(scores: FloatArray): InferenceResult {
        val maxIdx = scores.indices.maxByOrNull { scores[it] } ?: 0
        return InferenceResult(
            classIndex = maxIdx,
            confidence = scores[maxIdx]
        )
    }

    private fun buildInterpreter(): Interpreter {
        val options = Interpreter.Options().apply {
            numThreads = Runtime.getRuntime().availableProcessors().coerceAtMost(4)
            useNNAPI = true
            setAllowBufferHandleOutput(true)
        }
        return Interpreter(FileUtil.loadMappedFile(context, "model.tflite"), options)
    }
}

data class InferenceResult(val classIndex: Int, val confidence: Float)
```

### 3.2 Swift async/await z Core ML

```swift
import CoreML
import Vision
import UIKit

actor CoreMLInferenceEngine {

    private let model: VNCoreMLModel
    private let requestQueue = DispatchQueue(
        label: "inference.queue",
        qos: .userInitiated,
        attributes: .concurrent
    )

    init(modelName: String) throws {
        let config = MLModelConfiguration()
        config.computeUnits = .all  // ANE + GPU + CPU
        let mlModel = try MLModel(
            contentsOf: Bundle.main.url(
                forResource: modelName, withExtension: "mlpackage"
            )!,
            configuration: config
        )
        self.model = try VNCoreMLModel(for: mlModel)
    }

    func classify(image: UIImage) async throws -> [VNClassificationObservation] {
        guard let cgImage = image.cgImage else {
            throw InferenceError.invalidImage
        }

        return try await withCheckedThrowingContinuation { continuation in
            let request = VNCoreMLRequest(model: model) { request, error in
                if let error = error {
                    continuation.resume(throwing: error)
                    return
                }
                let results = request.results as? [VNClassificationObservation] ?? []
                continuation.resume(returning: results)
            }
            request.imageCropAndScaleOption = .centerCrop

            let handler = VNImageRequestHandler(
                cgImage: cgImage,
                orientation: .up,
                options: [:]
            )
            do {
                try handler.perform([request])
            } catch {
                continuation.resume(throwing: error)
            }
        }
    }

    func batchClassify(images: [UIImage]) async throws -> [[VNClassificationObservation]] {
        try await withThrowingTaskGroup(of: (Int, [VNClassificationObservation]).self) { group in
            for (i, image) in images.enumerated() {
                group.addTask {
                    let results = try await self.classify(image: image)
                    return (i, results)
                }
            }
            var allResults = Array(repeating: [VNClassificationObservation](), count: images.count)
            for try await (i, result) in group {
                allResults[i] = result
            }
            return allResults
        }
    }
}

enum InferenceError: Error {
    case invalidImage
    case modelNotFound
}
```

---

## 4. Zarzadzanie watkami: P-cores i E-cores

### 4.1 Architektura CPU na mobile

Nowoczesne SoC stosuja architekture big.LITTLE lub analogiczna:

| Typ | Snapdragon 8 Gen 3 | Apple A17 Pro |
|---|---|---|
| P-cores (wydajnosc) | 1x 3.3 GHz Cortex-X4 | 2x "Everest" |
| M-cores (srednie) | 5x 3.15 GHz Cortex-A720 | 4x "Sawtooth" |
| E-cores (efektywnosc) | 2x 2.27 GHz Cortex-A520 | brak (ma Efficiency) |
| NPU | Hexagon 45 (98 TOPS) | 38 TOPS ANE |

### 4.2 Ustawienie liczby watkow w TFLite

```kotlin
// Optymalny dobor liczby watkow
fun getOptimalThreadCount(): Int {
    val cores = Runtime.getRuntime().availableProcessors()
    return when {
        cores >= 8 -> 4   // Flagowce: uzywaj tylko P-cores
        cores >= 6 -> 3
        else       -> 2
    }
}

val options = Interpreter.Options().apply {
    numThreads = getOptimalThreadCount()
    // NNAPI automatycznie wybiera NPU/GPU/DSP
    addDelegate(NnApiDelegate())
}
```

### 4.3 CPU Affinity na Androidzie

```kotlin
import android.os.Process

// Ustaw CPU affinity na P-cores dla watku inference
// (wymaga root lub systemu privileges na niektorych urzadzeniach)
fun setPCoreAffinity() {
    Process.setThreadPriority(Process.THREAD_PRIORITY_URGENT_DISPLAY)
}
```

---

## 5. Batch Processing

### 5.1 Kiedy batching ma sens?

Batching (grupowanie wielu probek) przydaje sie gdy:
- Przetwarzasz wiele obrazow naraz (galeria)
- Model ma wysoki startup overhead
- GPU/NPU jest niedostepny przez pojedyncze male requesty

```kotlin
// Batch inference z TFLite
class BatchInferenceEngine(context: Context) {

    private val interpreter: Interpreter

    init {
        // Model skompilowany ze wsparciem batch
        val options = Interpreter.Options().apply {
            numThreads = 4
        }
        interpreter = Interpreter(
            FileUtil.loadMappedFile(context, "model_batch.tflite"),
            options
        )
    }

    fun inferBatch(bitmaps: List<Bitmap>): List<FloatArray> {
        val batchSize = bitmaps.size
        val inputShape = intArrayOf(batchSize, INPUT_H, INPUT_W, 3)
        val outputShape = intArrayOf(batchSize, NUM_CLASSES)

        val inputBuffer = ByteBuffer.allocateDirect(
            batchSize * INPUT_H * INPUT_W * 3 * 4
        ).also { it.order(ByteOrder.nativeOrder()) }

        bitmaps.forEach { bmp -> preprocessIntoBuffer(bmp, inputBuffer) }

        val outputArray = Array(batchSize) { FloatArray(NUM_CLASSES) }
        interpreter.run(inputBuffer, outputArray)
        return outputArray.toList()
    }
}
```

---

## 6. Pipeline Parallelism

Overlapping preprocessing i inference:

```kotlin
// Producent-konsument z Channel
class PipelineInference(private val engine: InferenceEngine) {

    fun processVideoStream(bitmapFlow: Flow<Bitmap>): Flow<InferenceResult> {
        // Preprocessing na IO dispatcher, inference na Default
        return bitmapFlow
            .map { bitmap ->
                withContext(Dispatchers.IO) {
                    preprocessBitmap(bitmap)  // resize, normalize
                }
            }
            .buffer(2)  // bufor 2 klatek miedzy preprocessing a inference
            .map { preprocessed ->
                withContext(Dispatchers.Default) {
                    engine.runInference(preprocessed)
                }
            }
    }
}
```

---

## 7. Warm-up Runs

### 7.1 Dlaczego warm-up jest wazny?

Pierwsze uruchomienie modelu jest wolniejsze z powodu:
- **JIT kompilacja** shaderow GPU (pierwsza kompilacja trwa 100-500 ms)
- **Cold cache** -- wagi musza byc zaladowane do cache CPU
- **NNAPI initialization** -- czas konfiguracji delegata

```kotlin
class WarmUpManager(private val interpreter: Interpreter) {

    private var isWarmedUp = false

    suspend fun warmUp(numRuns: Int = 3) = withContext(Dispatchers.Default) {
        if (isWarmedUp) return@withContext

        val dummyInput = ByteBuffer.allocateDirect(
            1 * INPUT_H * INPUT_W * 3 * 4
        ).also { it.order(ByteOrder.nativeOrder()) }

        val dummyOutput = Array(1) { FloatArray(NUM_CLASSES) }

        // Uruchom numRuns razy -- wyrzuc wyniki
        repeat(numRuns) {
            interpreter.run(dummyInput.also { it.rewind() }, dummyOutput)
        }
        isWarmedUp = true
        Log.d("WarmUp", "Model gotowy po $numRuns warm-up runs")
    }
}
```

---

## 8. Profilowanie inference

### 8.1 TFLite Benchmark Tool

```bash
# Na urzadzeniu Android (przez adb)
adb push model.tflite /data/local/tmp/

adb shell /data/local/tmp/benchmark_model \
  --graph=/data/local/tmp/model.tflite \
  --num_threads=4 \
  --use_nnapi=true \
  --warmup_runs=5 \
  --num_runs=50 \
  --enable_op_profiling=true
```

Przykladowy wynik:
```
Inference timings in us: Init: 1254, First inference: 47832, Warmup: 21445, Inference: 18234
Overall inference latency (avg): 18.23 ms
Op profiling results:
  [MobilenetV3/Conv2D] 1.2 ms (6.6%)
  [MobilenetV3/expanded_conv/depthwise] 2.1 ms (11.5%)
  ...
```

### 8.2 Android Studio CPU Profiler

```kotlin
// Adnotacje dla Android Profiler
import android.os.Trace

class ProfiledInferenceEngine {
    fun infer(bitmap: Bitmap): InferenceResult {
        Trace.beginSection("preprocessing")
        val input = preprocess(bitmap)
        Trace.endSection()

        Trace.beginSection("model_inference")
        val output = runModel(input)
        Trace.endSection()

        Trace.beginSection("postprocessing")
        val result = postprocess(output)
        Trace.endSection()

        return result
    }
}
```

---

## 9. Akceleracja sprzetowa

### 9.1 NNAPI (Android Neural Networks API)

```kotlin
import org.tensorflow.lite.nnapi.NnApiDelegate

fun buildNnapiInterpreter(context: Context): Interpreter {
    val nnApiDelegate = NnApiDelegate(
        NnApiDelegate.Options().apply {
            executionPreference = NnApiDelegate.Options.EXECUTION_PREFERENCE_FAST_SINGLE_ANSWER
            allowFp16PrecisionForFp32 = true
            useNnapiCpu = false  // Nie uzywaj CPU przez NNAPI
        }
    )

    val options = Interpreter.Options().apply {
        addDelegate(nnApiDelegate)
        setNumThreads(1)  // NNAPI sam zarzadza watkami
    }

    return Interpreter(FileUtil.loadMappedFile(context, "model.tflite"), options)
}
```

### 9.2 GPU Delegate

```kotlin
import org.tensorflow.lite.gpu.GpuDelegate

fun buildGpuInterpreter(context: Context): Interpreter? {
    return try {
        val gpuDelegate = GpuDelegate(
            GpuDelegate.Options().apply {
                setPrecisionLossAllowed(true)  // FP16 na GPU
                setQuantizedModelsAllowed(true)
                setInferencePreference(
                    GpuDelegate.Options.INFERENCE_PREFERENCE_FAST_SINGLE_ANSWER
                )
            }
        )
        val options = Interpreter.Options().addDelegate(gpuDelegate)
        Interpreter(FileUtil.loadMappedFile(context, "model.tflite"), options)
    } catch (e: Exception) {
        Log.w("GPU", "GPU delegate niedostepny: ${e.message}")
        null  // Fallback do CPU
    }
}
```

### 9.3 Strategia NPU -> GPU -> CPU fallback

```kotlin
class AdaptiveInferenceEngine(private val context: Context) {

    private val interpreter: Interpreter = buildWithFallback()

    private fun buildWithFallback(): Interpreter {
        // Probuj NPU (NNAPI)
        runCatching {
            return buildNnapiInterpreter(context)
        }.onFailure { Log.w("Inference", "NNAPI niedostepny") }

        // Probuj GPU
        runCatching {
            buildGpuInterpreter(context)?.let { return it }
        }.onFailure { Log.w("Inference", "GPU delegate niedostepny") }

        // Fallback: CPU z wieloma watkami
        Log.i("Inference", "Uzywam CPU inference")
        return Interpreter(
            FileUtil.loadMappedFile(context, "model.tflite"),
            Interpreter.Options().setNumThreads(4)
        )
    }
}
```

### 9.4 Core ML z Apple Neural Engine (iOS)

```swift
import CoreML

// Wymusz uzycie ANE (Apple Neural Engine)
let config = MLModelConfiguration()
config.computeUnits = .cpuAndNeuralEngine  // lub .all, .cpuAndGPU

let model = try MLModel(
    contentsOf: modelURL,
    configuration: config
)

// Sprawdz aktywne compute units po zaladowaniu
if #available(iOS 16.0, *) {
    let activeUnits = model.configuration.computeUnits
    print("Compute units: \(activeUnits)")
}
```

---

## 10. Thermal Throttling

### 10.1 Problem przegrzewania

Dlugotrwale obciazenie NPU/GPU prowadzi do thermal throttling -- system obniza czestotliwosc taktowania, co zwieksza latency nawet 2-5x.

### 10.2 Monitorowanie temperatury na Androidzie

```kotlin
import android.hardware.thermal.ThermalManager

class ThermalMonitor(private val context: Context) {

    private val thermalManager = context.getSystemService(ThermalManager::class.java)

    fun isThrottling(): Boolean {
        return thermalManager?.currentThermalStatus?.let { status ->
            status >= ThermalManager.THERMAL_STATUS_MODERATE
        } ?: false
    }

    fun registerThermalCallback(onThrottle: (Boolean) -> Unit) {
        thermalManager?.addThermalStatusListener(context.mainExecutor) { status ->
            val throttling = status >= ThermalManager.THERMAL_STATUS_MODERATE
            onThrottle(throttling)
        }
    }
}

// Adaptacja inference do temperatury
class AdaptiveInference(private val thermal: ThermalMonitor) {

    fun getInferenceInterval(): Long {
        return if (thermal.isThrottling()) {
            250L  // Ograniczamy do 4 fps przy przegrzaniu
        } else {
            33L   // Normalnie 30 fps
        }
    }
}
```

---

## 11. Optymalizacja pamieci

### 11.1 Unikanie kopiowania danych

```kotlin
// Uzywaj ByteBuffer zamiast tablic - unika kopiowania
val inputBuffer = ByteBuffer.allocateDirect(inputSize).apply {
    order(ByteOrder.nativeOrder())
}

// Direct buffer mozna przekazac bezposrednio do TFLite
interpreter.run(inputBuffer, outputBuffer)

// Unikaj: konwersja Bitmap -> int[] -> ByteBuffer (dwa kopiowania)
// Lepiej: Bitmap -> bezposrednio do ByteBuffer (jedno kopiowanie)
fun Bitmap.toDirectBuffer(): ByteBuffer {
    val buffer = ByteBuffer.allocateDirect(width * height * 3 * 4)
    buffer.order(ByteOrder.nativeOrder())
    val pixels = IntArray(width * height)
    getPixels(pixels, 0, width, 0, 0, width, height)
    for (px in pixels) {
        buffer.putFloat((px shr 16 and 0xFF) / 255.0f)
        buffer.putFloat((px shr 8  and 0xFF) / 255.0f)
        buffer.putFloat((px        and 0xFF) / 255.0f)
    }
    return buffer
}
```

### 11.2 Recycling buforow

```kotlin
// Pool buforow -- unikamy ciaglea alokacji na heap
class BufferPool(private val bufferSize: Int, poolSize: Int = 3) {

    private val pool = ArrayDeque<ByteBuffer>()

    init {
        repeat(poolSize) {
            pool.addLast(
                ByteBuffer.allocateDirect(bufferSize)
                    .apply { order(ByteOrder.nativeOrder()) }
            )
        }
    }

    fun acquire(): ByteBuffer = synchronized(this) {
        (pool.removeFirstOrNull()
            ?: ByteBuffer.allocateDirect(bufferSize)
                .apply { order(ByteOrder.nativeOrder()) })
            .also { it.rewind() }
    }

    fun release(buffer: ByteBuffer) = synchronized(this) {
        pool.addLast(buffer)
    }
}
```

---

## 12. Kotlin + CameraX: real-time inference

```kotlin
import androidx.camera.core.*
import androidx.camera.lifecycle.ProcessCameraProvider

class RealTimeInferenceActivity : AppCompatActivity() {

    private lateinit var engine: InferenceEngine
    private var lastInferenceTime = 0L
    private val INFERENCE_INTERVAL_MS = 100L  // max 10 fps

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        engine = InferenceEngine(this)
        startCamera()
    }

    private fun startCamera() {
        val cameraProviderFuture = ProcessCameraProvider.getInstance(this)
        cameraProviderFuture.addListener({
            val cameraProvider = cameraProviderFuture.get()

            val imageAnalyzer = ImageAnalysis.Builder()
                .setTargetResolution(android.util.Size(640, 480))
                .setBackpressureStrategy(ImageAnalysis.STRATEGY_KEEP_ONLY_LATEST)
                .build()
                .also { analysis ->
                    analysis.setAnalyzer(
                        Executors.newSingleThreadExecutor()
                    ) { imageProxy ->
                        processFrame(imageProxy)
                    }
                }

            cameraProvider.bindToLifecycle(
                this,
                CameraSelector.DEFAULT_BACK_CAMERA,
                imageAnalyzer
            )
        }, ContextCompat.getMainExecutor(this))
    }

    private fun processFrame(imageProxy: ImageProxy) {
        val now = System.currentTimeMillis()
        if (now - lastInferenceTime < INFERENCE_INTERVAL_MS) {
            imageProxy.close()
            return
        }
        lastInferenceTime = now

        val bitmap = imageProxy.toBitmap()
        imageProxy.close()

        lifecycleScope.launch(Dispatchers.Default) {
            val result = engine.infer(bitmap)
            withContext(Dispatchers.Main) {
                updateUI(result)
            }
        }
    }
}
```

---

## 13. Benchmarki: porownanie delegatow (MobileNetV3-Large)

| Delegate | Urzadzenie | Latency (avg) | Latency (P95) | Uwagi |
|---|---|---|---|---|
| CPU (4 watki) | Pixel 6 | 51 ms | 58 ms | Baseline |
| GPU Delegate | Pixel 6 | 17 ms | 23 ms | FP16, 3x szybszy |
| NNAPI (DSP) | Pixel 6 | 12 ms | 18 ms | Najszybszy, wymaga modelu UINT8 |
| CPU (4 watki) | iPhone 14 | 19 ms | 22 ms | Apple CPU szybszy |
| Core ML (.all) | iPhone 14 | 5 ms | 7 ms | ANE, 10x szybszy od CPU |
| Core ML (.cpuAndGPU) | iPhone 14 | 8 ms | 11 ms | GPU fallback |

---

## 14. Dobre praktyki

1. **Zawsze warm-up** przed pomiarami i przed pierwszym "uzytecznym" inference
2. **Lazy load model** -- nie blokuj UI thread podczas ladowania modelu
3. **BackpressureStrategy.KEEP_ONLY_LATEST** w CameraX -- unikaj kolejkowania klatek
4. **Direct ByteBuffer** -- unikaj kopiowania przez tablice Java
5. **NPU -> GPU -> CPU fallback** -- nie zakladaj dostepnosci konkretnego akceleratora
6. **Monitoruj thermal** -- adaptuj predkosc przetwarzania do temperatury
7. **Profiluj z Trace** -- identyfikuj prawdziwy bottleneck (preprocessing, inference czy postprocessing?)

---

## Powiązane artykuły

- [Wprowadzenie do lokalnego AI na mobile](local-ai-intro.md)
- [Frameworki ML na mobile](mobile-ml-frameworks.md)
- [Kwantyzacja i optymalizacja modeli AI](model-quantization.md)
- [Sieci neuronowe na urządzeniu mobilnym](neural-networks-mobile.md)
- [AI w przetwarzaniu obrazu na urządzeniu](ai-image-processing.md)
- [MediaPipe na mobile](mediapipe-mobile.md)
