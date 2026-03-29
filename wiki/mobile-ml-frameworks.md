# Frameworki ML na urządzeniu: TFLite, Core ML, ONNX

Wdrożenie modelu uczenia maszynowego na urządzeniu mobilnym wymaga wyboru odpowiedniego frameworka wnioskowania (*inference runtime*). Trzy dominujące rozwiązania — TensorFlow Lite, Core ML i ONNX Runtime Mobile — różnią się wspieranymi platformami, formatami modeli, dostępnymi akceleratorami i ekosystemem narzędzi. Znajomość każdego z nich jest kluczowa przy podejmowaniu decyzji projektowych.

## TensorFlow Lite

TensorFlow Lite (TFLite) to lekka wersja TensorFlow przeznaczona na urządzenia mobilne i brzegowe (edge). Jest rozwijana przez Google i stanowi de facto standard dla wnioskowania na Androidzie.

### Format modelu

Modele TFLite zapisywane są w formacie **FlatBuffers** (`.tflite`) — płaskim, binarnym formatem serializacji opracowanym przez Google. FlatBuffers pozwala na bezpośredni dostęp do danych bez potrzeby parsowania, co minimalizuje czas zimnego startu.

Konwersja z TensorFlow/Keras:

```python
import tensorflow as tf

# Konwersja modelu Keras → TFLite
converter = tf.lite.TFLiteConverter.from_saved_model('saved_model/')
converter.optimizations = [tf.lite.Optimize.DEFAULT]  # kwantyzacja domyślna
tflite_model = converter.convert()

with open('model.tflite', 'wb') as f:
    f.write(tflite_model)
```

### Delegaty (Delegates)

Delegate to plugin, który przekierowuje wykonanie (całości lub fragmentu) grafu modelu na wybraną jednostkę obliczeniową:

| Delegate | Platforma | Akcelerator |
|---|---|---|
| `NnApiDelegate` | Android ≥ 8.1 | NNAPI → NPU/DSP/GPU |
| `GpuDelegate` | Android / iOS | GPU (OpenGL ES / Metal) |
| `XNNPackDelegate` | Cross-platform | zoptymalizowane operacje CPU (SIMD) |
| `HexagonDelegate` | Snapdragon | Hexagon DSP |
| `CoreMLDelegate` | iOS | Apple Neural Engine |

### Integracja w Kotlinie (Android)

#### Zależności (Gradle)

```kotlin
// build.gradle.kts (module)
dependencies {
    implementation("org.tensorflow:tensorflow-lite:2.15.0")
    implementation("org.tensorflow:tensorflow-lite-gpu:2.15.0")
    implementation("org.tensorflow:tensorflow-lite-support:0.4.4")
    implementation("org.tensorflow:tensorflow-lite-task-vision:0.4.4")
}
```

#### Załadowanie modelu i wnioskowanie

```kotlin
import org.tensorflow.lite.Interpreter
import org.tensorflow.lite.gpu.CompatibilityList
import org.tensorflow.lite.gpu.GpuDelegate
import java.io.FileInputStream
import java.nio.MappedByteBuffer
import java.nio.channels.FileChannel

class TFLiteClassifier(private val context: Context) {

    private lateinit var interpreter: Interpreter
    private var gpuDelegate: GpuDelegate? = null

    fun init() {
        val options = Interpreter.Options().apply {
            val compatList = CompatibilityList()
            if (compatList.isDelegateSupportedOnThisDevice) {
                val delegateOptions = compatList.bestOptionsForThisDevice
                gpuDelegate = GpuDelegate(delegateOptions)
                addDelegate(gpuDelegate!!)
            } else {
                // CPU z XNNPACK
                setNumThreads(4)
                setUseXNNPACK(true)
            }
        }
        interpreter = Interpreter(loadModelFile(), options)
    }

    private fun loadModelFile(): MappedByteBuffer {
        val assetManager = context.assets
        val fd = assetManager.openFd("mobilenet_v3.tflite")
        val inputStream = FileInputStream(fd.fileDescriptor)
        val fileChannel = inputStream.channel
        return fileChannel.map(FileChannel.MapMode.READ_ONLY, fd.startOffset, fd.declaredLength)
    }

    fun classify(bitmap: Bitmap): FloatArray {
        val inputArray = preprocessBitmap(bitmap)          // normalizacja i zmiana rozmiaru
        val outputArray = Array(1) { FloatArray(1001) }    // 1001 klas ImageNet
        interpreter.run(inputArray, outputArray)
        return outputArray[0]
    }

    fun close() {
        interpreter.close()
        gpuDelegate?.close()
    }

    private fun preprocessBitmap(bitmap: Bitmap): Array<Array<Array<FloatArray>>> {
        val resized = Bitmap.createScaledBitmap(bitmap, 224, 224, true)
        return Array(1) {
            Array(224) { y ->
                Array(224) { x ->
                    val pixel = resized.getPixel(x, y)
                    FloatArray(3) { c ->
                        ((pixel shr (16 - 8 * c) and 0xFF) / 127.5f - 1.0f)
                    }
                }
            }
        }
    }
}
```

#### Task API — wysokopoziomowy interfejs

TFLite Task Library oferuje gotowe API dla typowych zadań:

```kotlin
import org.tensorflow.lite.task.vision.classifier.ImageClassifier
import org.tensorflow.lite.task.vision.detector.ObjectDetector

// Klasyfikacja obrazu
val classifier = ImageClassifier.createFromFile(context, "mobilenet_v3.tflite")
val image = TensorImage.fromBitmap(bitmap)
val results = classifier.classify(image)   // zwraca List<Classifications>

// Detekcja obiektów
val detectorOptions = ObjectDetector.ObjectDetectorOptions.builder()
    .setScoreThreshold(0.5f)
    .setMaxResults(5)
    .build()
val detector = ObjectDetector.createFromFileAndOptions(context, "ssd_mobilenet.tflite", detectorOptions)
val detections = detector.detect(image)    // zwraca List<Detection>
```

### ML Model Binding (Android Studio)

Android Studio oferuje automatyczne generowanie kodu Kotlin/Java na podstawie pliku `.tflite`:

1. Przeciągnij plik `.tflite` do katalogu `assets/ml/`
2. Android Studio generuje klasę Kotlin (np. `MobilenetV3.kt`)
3. Użyj wygenerowanej klasy:

```kotlin
val model = MobilenetV3.newInstance(context)
val inputs = TensorBuffer.createFixedSize(intArrayOf(1, 224, 224, 3), DataType.FLOAT32)
val outputs = model.process(inputs)
val probabilities = outputs.probabilityAsTensorBuffer
model.close()
```

---

## Core ML

Core ML to natywny framework Apple do wnioskowania lokalnego, dostępny na iOS, iPadOS, macOS, watchOS i tvOS. Jest zintegrowany bezpośrednio z systemem operacyjnym i zapewnia automatyczny dostęp do Apple Neural Engine bez potrzeby ręcznej konfiguracji.

### Format modelu

Core ML używa formatu **`.mlpackage`** (wcześniej `.mlmodel`) — paczki zawierającej skompilowany model oraz metadane. Narzędzie `coremltools` konwertuje modele z PyTorch, TensorFlow, scikit-learn i innych środowisk.

```python
import coremltools as ct
import torch

# Konwersja modelu PyTorch → Core ML
model = MobileNetV3()  # Twój model PyTorch
model.eval()
example_input = torch.rand(1, 3, 224, 224)
traced_model = torch.jit.trace(model, example_input)

mlmodel = ct.convert(
    traced_model,
    inputs=[ct.TensorType(shape=example_input.shape, name="input")],
    minimum_deployment_target=ct.target.iOS16,
    compute_precision=ct.precision.FLOAT16,   # float16 dla ANE
)
mlmodel.save("MobileNetV3.mlpackage")
```

### Optymalizacja dla Apple Neural Engine

Apple Neural Engine najlepiej działa z modelami w precyzji **float16** lub z zastosowaniem **palettyzacji** (lookup table kwantyzacja). Narzędzie `coremltools.optimize` automatyzuje ten proces:

```python
import numpy as np
import coremltools.optimize as cto

# Kwantyzacja do 8-bitowych wag
op_config = cto.coreml.OpLinearQuantizerConfig(
    mode="linear_symmetric",
    dtype=np.uint8
)
config = cto.coreml.OptimizationConfig(global_config=op_config)
compressed_model = cto.coreml.linear_quantize_weights(mlmodel, config=config)
compressed_model.save("MobileNetV3_quantized.mlpackage")
```

### Integracja w Swift (iOS)

#### Automatyczne generowanie klasy przez Xcode

Po dodaniu `.mlpackage` do projektu Xcode automatycznie generuje klasę Swift:

```swift
import CoreML
import Vision

class CoreMLClassifier {
    private var model: VNCoreMLModel?
    
    init() throws {
        let config = MLModelConfiguration()
        config.computeUnits = .all  // ANE + GPU + CPU
        let coreMLModel = try MobileNetV3(configuration: config).model
        model = try VNCoreMLModel(for: coreMLModel)
    }
    
    func classify(image: UIImage, completion: @escaping ([String: Double]) -> Void) {
        guard let cgImage = image.cgImage,
              let model = model else { return }
        
        let request = VNCoreMLRequest(model: model) { [weak self] request, error in
            guard let results = request.results as? [VNClassificationObservation] else { return }
            let top5 = results.prefix(5).reduce(into: [String: Double]()) { dict, obs in
                dict[obs.identifier] = Double(obs.confidence)
            }
            completion(top5)
        }
        request.imageCropAndScaleOption = .centerCrop
        
        let handler = VNImageRequestHandler(cgImage: cgImage, options: [:])
        DispatchQueue.global(qos: .userInteractive).async {
            try? handler.perform([request])
        }
    }
}
```

#### Async/Await (Swift 5.5+)

```swift
func classifyAsync(image: UIImage) async throws -> [VNClassificationObservation] {
    guard let cgImage = image.cgImage else { throw MLError.invalidImage }
    
    return try await withCheckedThrowingContinuation { continuation in
        let request = VNCoreMLRequest(model: model!) { request, error in
            if let error = error {
                continuation.resume(throwing: error)
            } else {
                let results = (request.results as? [VNClassificationObservation]) ?? []
                continuation.resume(returning: results)
            }
        }
        let handler = VNImageRequestHandler(cgImage: cgImage)
        do {
            try handler.perform([request])
        } catch {
            continuation.resume(throwing: error)
        }
    }
}
```

### Create ML — trening na urządzeniu Apple

Create ML pozwala trenować (lub dostosowywać *fine-tune*) modele bezpośrednio na Macu lub iPadzie Pro, bez potrzeby zewnętrznych narzędzi:

```swift
import CreateML

// Trening klasyfikatora obrazów
let trainingData = try MLImageClassifier.DataSource.labeledDirectories(
    at: URL(fileURLWithPath: "~/TrainingImages")
)
let classifier = try MLImageClassifier(trainingData: trainingData)
try classifier.write(to: URL(fileURLWithPath: "~/MyClassifier.mlpackage"))
```

---

## ONNX Runtime Mobile

ONNX Runtime (ORT) to wieloplatformowy silnik wnioskowania opracowany przez Microsoft, obsługujący format **Open Neural Network Exchange (.onnx)**. Wersja Mobile jest zoptymalizowana pod kątem urządzeń o ograniczonych zasobach.

### Dlaczego ONNX?

Format ONNX jest neutralny producencko — modele można trenować w PyTorch, TensorFlow, scikit-learn i eksportować do jednego formatu obsługiwanego przez dziesiątki runtime'ów. ONNX Runtime Mobile wspiera Android, iOS, React Native i Flutter.

### Konwersja do ONNX

```python
import torch
import torch.onnx

model = MyModel()
model.eval()
dummy_input = torch.randn(1, 3, 224, 224)

torch.onnx.export(
    model,
    dummy_input,
    "model.onnx",
    opset_version=17,
    input_names=["input"],
    output_names=["output"],
    dynamic_axes={"input": {0: "batch_size"}}
)
```

Weryfikacja i optymalizacja:

```python
import onnx
from onnxruntime.tools import optimize_model

# Weryfikacja
model = onnx.load("model.onnx")
onnx.checker.check_model(model)

# Optymalizacja dla mobile
optimized = optimize_model("model.onnx", model_type="bert")  # lub "gpt2", "vgg", etc.
optimized.save_model_to_file("model_optimized.onnx")
```

### Integracja w Kotlinie (Android)

```kotlin
// build.gradle.kts
dependencies {
    implementation("com.microsoft.onnxruntime:onnxruntime-android:1.17.0")
}
```

```kotlin
import ai.onnxruntime.*

class OnnxClassifier(private val context: Context) {

    private lateinit var session: OrtSession
    private lateinit var env: OrtEnvironment

    fun init() {
        env = OrtEnvironment.getEnvironment()
        val sessionOptions = OrtSession.SessionOptions().apply {
            addNnapi()          // NNAPI delegate
            setIntraOpNumThreads(4)
        }
        val modelBytes = context.assets.open("model.onnx").readBytes()
        session = env.createSession(modelBytes, sessionOptions)
    }

    fun run(inputBitmap: Bitmap): FloatArray {
        val inputTensor = bitmapToTensor(inputBitmap)
        val inputs = mapOf("input" to inputTensor)
        val results = session.run(inputs)
        val outputTensor = results[0].value as Array<FloatArray>
        return outputTensor[0]
    }

    private fun bitmapToTensor(bitmap: Bitmap): OnnxTensor {
        val resized = Bitmap.createScaledBitmap(bitmap, 224, 224, true)
        val buffer = FloatArray(1 * 3 * 224 * 224)
        var idx = 0
        val mean = floatArrayOf(0.485f, 0.456f, 0.406f)
        val std = floatArrayOf(0.229f, 0.224f, 0.225f)
        for (c in 0..2) {
            for (y in 0 until 224) {
                for (x in 0 until 224) {
                    val pixel = resized.getPixel(x, y)
                    val channelValue = ((pixel shr (16 - 8 * c) and 0xFF) / 255.0f)
                    buffer[idx++] = (channelValue - mean[c]) / std[c]
                }
            }
        }
        val shape = longArrayOf(1, 3, 224, 224)
        return OnnxTensor.createTensor(env, buffer, shape)
    }
}
```

### Integracja w Swift (iOS)

```swift
// Package.swift
// .package(url: "https://github.com/microsoft/onnxruntime-swift-package-manager", .upToNextMajor(from: "1.17.0"))

import onnxruntime_objc

class OnnxRunner {
    private var session: ORTSession?
    private var env: ORTEnv?
    
    init() throws {
        env = try ORTEnv(loggingLevel: ORTLoggingLevel.warning)
        let options = try ORTSessionOptions()
        try options.setCoreMLFlags(UInt32(ORTCoreMLFlags.useNeuralEngine.rawValue))
        
        guard let modelPath = Bundle.main.path(forResource: "model", ofType: "onnx") else {
            throw NSError(domain: "OnnxRunner", code: 1)
        }
        session = try ORTSession(env: env!, modelPath: modelPath, sessionOptions: options)
    }
    
    func run(input: [Float], shape: [Int64]) throws -> [Float] {
        let inputData = Data(bytes: input, count: input.count * MemoryLayout<Float>.size)
        let tensor = try ORTValue(
            tensorData: NSMutableData(data: inputData),
            elementType: .float,
            shape: shape
        )
        let outputs = try session!.run(withInputs: ["input": tensor],
                                       outputNames: ["output"],
                                       runOptions: nil)
        guard let outputTensor = outputs["output"],
              let rawOutput = try outputTensor.tensorData() as? Data else {
            throw NSError(domain: "OnnxRunner", code: 2)
        }
        return rawOutput.withUnsafeBytes { Array($0.bindMemory(to: Float.self)) }
    }
}
```

---

## Porównanie frameworków

| Kryterium | TensorFlow Lite | Core ML | ONNX Runtime Mobile |
|---|---|---|---|
| **Platforma** | Android (główny) + iOS | iOS / macOS tylko | Android + iOS + inne |
| **Format modelu** | `.tflite` (FlatBuffers) | `.mlpackage` | `.onnx` |
| **ANE / Neural Engine** | Przez CoreML Delegate | Natywnie | Przez CoreML EP |
| **NNAPI / Android NPU** | NnApiDelegate | ✗ | addNnapi() |
| **Hexagon DSP** | HexagonDelegate | ✗ | QNN Execution Provider |
| **Ekosystem modeli** | TensorFlow Hub, LiteRT | Create ML, Hugging Face | Hugging Face, ModelZoo |
| **Task API** | ✓ (wysokopoziomowe) | Vision Framework | ✗ (niski poziom) |
| **Konwersja** | TF/Keras natywnie | coremltools | torch.onnx, tf2onnx |
| **Rozmiar biblioteki** | ~2–4 MB (AAR) | System (0 MB) | ~3–5 MB |
| **Flutter/React Native** | Oficjalne pluginy | Brak | Oficjalne pluginy |
| **Licencja** | Apache 2.0 | Proprietary (Apple) | MIT |

## Strategie wyboru frameworka

### Kiedy wybrać TFLite

- Aplikacja **wyłącznie Android** lub cross-platform (Android + iOS)
- Model trenowany w **TensorFlow / Keras**
- Potrzebujesz **Task API** (gotowe pipeline dla vision/NLP)
- Chcesz generować kod Kotlin z **Android Studio ML Model Binding**

### Kiedy wybrać Core ML

- Aplikacja **wyłącznie Apple** (iOS / macOS / watchOS)
- Zależy Ci na **maksymalnej wydajności ANE** bez dodatkowej konfiguracji
- Korzystasz z **Create ML** do fine-tuningu na urządzeniu
- Chcesz **integracji z Vision Framework** (detekcja twarzy, tekstu, barcode)

### Kiedy wybrać ONNX Runtime

- Potrzebujesz **jednego kodu dla Androida i iOS** (np. w React Native/Flutter)
- Trenujesz modele w **PyTorch**
- Korzystasz z modeli z **Hugging Face** (transformery, BERT, Whisper)
- Projekt jest **wieloplatformowy** lub open-source i nie chcesz vendor lock-in

## Benchmarki: MobileNet V3 Large (224×224, batch=1)

Orientacyjne wartości latencji wnioskowania na urządzeniach z 2023/2024 roku:

| Urządzenie | Framework | Delegate | Czas (ms) |
|---|---|---|---|
| Samsung S24 (Snapdragon 8 Gen 3) | TFLite | GPU | ~3.5 ms |
| Samsung S24 | TFLite | NNAPI / NPU | ~2.1 ms |
| Pixel 8 (Google Tensor G3) | TFLite | NNAPI | ~2.8 ms |
| iPhone 15 Pro (A17 Pro) | Core ML | ANE | ~1.2 ms |
| iPhone 15 Pro | ONNX | CoreML EP | ~1.5 ms |
| Mid-range Android (Snapdragon 695) | TFLite | CPU (XNNPACK) | ~18 ms |

> **Uwaga:** Wartości orientacyjne. Rzeczywiste wyniki zależą od temperatury urządzenia, obciążenia systemu i wersji sterowników.

## Dobre praktyki

1. **Zawsze mierz na urządzeniu fizycznym** — emulatory nie odwzorowują wydajności NPU/GPU
2. **Używaj asynchronicznego wnioskowania** — nigdy nie blokuj wątku głównego (UI thread)
3. **Buforuj instancje modelu** — tworzenie sesji/Interpreter jest kosztowne, rób to raz przy starcie
4. **Stosuj batching** gdy to możliwe — przetwarzaj kilka elementów jednocześnie
5. **Monitoruj zużycie pamięci** — ładuj modele on-demand i zwalniaj po użyciu w przypadku dużych modeli
6. **Testuj scenariusze fallback** — sprawdź czy aplikacja działa poprawnie gdy NPU/GPU jest niedostępny (CPU-only fallback)
7. **Kwantyzuj modele** — INT8/INT4 to zwykle 3–4× mniejszy rozmiar i 2–3× większa szybkość przy minimalnej stracie dokładności

## Zobacz też

- [Wprowadzenie do lokalnej AI na urządzeniu mobilnym](#local-ai-intro)
- [Kwantyzacja i optymalizacja modeli AI](#model-quantization)
- [Wnioskowanie lokalne — architektura i wydajność](#on-device-inference)
- [MediaPipe — kompleksowe rozwiązania AI](#mediapipe-mobile)
- [AI w przetwarzaniu obrazu na urządzeniu](#ai-image-processing)
