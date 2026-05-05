# Formaty plików modeli uczenia maszynowego na urządzeniach mobilnych

Wdrożenie modeli uczenia maszynowego na urządzeniach mobilnych (ang. *on-device ML* lub *edge AI*) to rosnący trend w aplikacjach mobilnych. Rozpoznawanie obrazów, przetwarzanie języka naturalnego, detekcja obiektów czy analiza dźwięku mogą działać bez połączenia z internetem, z niskim opóźnieniem i zachowaniem prywatności użytkownika. Kluczowym elementem jest wybór odpowiedniego formatu pliku modelu.

---

## Dlaczego format modelu ma znaczenie na mobile?

W przeciwieństwie do serwerów ML, urządzenia mobilne muszą sprostać wielu ograniczeniom:

| Czynnik | Serwer ML | Urządzenie mobilne |
|---------|-----------|--------------------|
| Pamięć RAM | 32–256 GB | 4–16 GB |
| Procesor | GPU NVIDIA | CPU/GPU mobilny + Neural Engine |
| Zasilanie | Brak limitu | Bateria (zużycie energii krytyczne) |
| Rozmiar modelu | Nieograniczony | Najlepiej < 10 MB do pobrania |
| Opóźnienie | 10–100 ms (sieć) | < 50 ms (lokalne) |

Format modelu determinuje:
- **Rozmiar pliku** - wpływ na rozmiar aplikacji i czas pobierania
- **Szybkość wnioskowania** (inference) - jak szybko model zwraca wynik
- **Wsparcie dla akceleracji sprzętowej** - Neural Engine, GPU, DSP
- **Możliwości kwantyzacji** - redukcja precyzji wag dla mniejszego rozmiaru

---

## TFLite (.tflite) - TensorFlow Lite

TensorFlow Lite to platforma ML Google do wdrożeń na urządzenia mobilne i brzegowe.

### Kluczowe cechy

- Zoptymalizowany pod kątem małego śladu pamięciowego
- Wsparcie dla **Android Neural Networks API (NNAPI)** - deleguje obliczenia do GPU/DSP/NPU
- Kwantyzacja modeli: FP32 → INT8 (4x mniejszy model, ~2x szybszy inference)
- Model Maker - narzędzie do fine-tuningu na własnych danych
- Bogata biblioteka gotowych modeli (MobileNet, EfficientDet, BERT-Mobile)

### Konwersja modelu

```python
import tensorflow as tf

# Konwersja modelu Keras/TensorFlow → TFLite
model = tf.keras.models.load_model("model.h5")

converter = tf.lite.TFLiteConverter.from_keras_model(model)

# Kwantyzacja dynamiczna (szybka, bez danych kalibracyjnych)
converter.optimizations = [tf.lite.Optimize.DEFAULT]

tflite_model = converter.convert()

with open("model.tflite", "wb") as f:
    f.write(tflite_model)

print(f"Rozmiar modelu: {len(tflite_model) / 1024:.1f} KB")
```

```python
# Kwantyzacja INT8 pełna (wymaga danych kalibracyjnych)
def representative_dataset():
    for data in calibration_dataset.take(100):
        yield [tf.cast(data, tf.float32)]

converter.optimizations = [tf.lite.Optimize.DEFAULT]
converter.representative_dataset = representative_dataset
converter.target_spec.supported_ops = [tf.lite.OpsSet.TFLITE_BUILTINS_INT8]
converter.inference_input_type = tf.int8
converter.inference_output_type = tf.int8

tflite_quant_model = converter.convert()
```

### Uruchamianie TFLite w Kotlinie

```kotlin
import org.tensorflow.lite.Interpreter
import org.tensorflow.lite.support.image.TensorImage
import org.tensorflow.lite.support.tensorbuffer.TensorBuffer
import java.nio.MappedByteBuffer
import java.nio.channels.FileChannel

class ImageClassifier(private val context: Context) {

    private lateinit var interpreter: Interpreter
    private val inputSize = 224
    private val numClasses = 1000

    fun initialize() {
        val modelBuffer = loadModelFile("mobilenet_v2.tflite")
        val options = Interpreter.Options().apply {
            numThreads = 4
            // Delegacja do GPU (opcjonalna, wymaga biblioteki GPU delegate)
            // addDelegate(GpuDelegate())
        }
        interpreter = Interpreter(modelBuffer, options)
    }

    private fun loadModelFile(filename: String): MappedByteBuffer {
        val assetFileDescriptor = context.assets.openFd(filename)
        val fileInputStream = assetFileDescriptor.createInputStream()
        val fileChannel = fileInputStream.channel
        return fileChannel.map(
            FileChannel.MapMode.READ_ONLY,
            assetFileDescriptor.startOffset,
            assetFileDescriptor.declaredLength
        )
    }

    fun classify(bitmap: Bitmap): FloatArray {
        // Przygotowanie danych wejściowych
        val scaledBitmap = Bitmap.createScaledBitmap(bitmap, inputSize, inputSize, true)
        val inputBuffer = TensorBuffer.createFixedSize(
            intArrayOf(1, inputSize, inputSize, 3),
            DataType.FLOAT32
        )

        // Normalizacja pikseli do zakresu [-1, 1]
        val inputArray = FloatArray(1 * inputSize * inputSize * 3)
        var idx = 0
        for (y in 0 until inputSize) {
            for (x in 0 until inputSize) {
                val pixel = scaledBitmap.getPixel(x, y)
                inputArray[idx++] = (Color.red(pixel) / 127.5f) - 1.0f
                inputArray[idx++] = (Color.green(pixel) / 127.5f) - 1.0f
                inputArray[idx++] = (Color.blue(pixel) / 127.5f) - 1.0f
            }
        }
        inputBuffer.loadArray(inputArray)

        // Uruchomienie wnioskowania
        val outputBuffer = TensorBuffer.createFixedSize(
            intArrayOf(1, numClasses),
            DataType.FLOAT32
        )
        interpreter.run(inputBuffer.buffer, outputBuffer.buffer)

        return outputBuffer.floatArray
    }

    fun release() {
        interpreter.close()
    }
}
```

---

## ONNX (.onnx) - Open Neural Network Exchange

ONNX to otwarty standard wymiany modeli ML stworzony przez Microsoft i Facebook (Meta). Umożliwia trening w jednym frameworku i wdrożenie w innym.

### Pipeline konwersji

```
PyTorch / TensorFlow / scikit-learn
           ↓
         ONNX
           ↓
  ONNX Runtime Mobile / TFLite / Core ML
```

### Konwersja PyTorch → ONNX

```python
import torch
import torch.onnx

model = MyModel()
model.load_state_dict(torch.load("model.pth"))
model.eval()

# Przykładowe dane wejściowe (batch_size=1, channels=3, height=224, width=224)
dummy_input = torch.randn(1, 3, 224, 224)

torch.onnx.export(
    model,
    dummy_input,
    "model.onnx",
    export_params=True,
    opset_version=17,          # Wersja ONNX opset
    do_constant_folding=True,  # Optymalizacja
    input_names=["input"],
    output_names=["output"],
    dynamic_axes={             # Dynamiczny wymiar batch
        "input": {0: "batch_size"},
        "output": {0: "batch_size"}
    }
)
```

### ONNX Runtime na Androidzie

```kotlin
// build.gradle.kts
// implementation("com.microsoft.onnxruntime:onnxruntime-android:1.17.0")

import ai.onnxruntime.OnnxTensor
import ai.onnxruntime.OrtEnvironment
import ai.onnxruntime.OrtSession

class OnnxInference(context: Context) {

    private val env = OrtEnvironment.getEnvironment()
    private val session: OrtSession

    init {
        val modelBytes = context.assets.open("model.onnx").readBytes()
        session = env.createSession(modelBytes, OrtSession.SessionOptions())
    }

    fun run(inputData: FloatArray): FloatArray {
        val shape = longArrayOf(1, 3, 224, 224)
        val inputTensor = OnnxTensor.createTensor(env, inputData, shape)

        val inputs = mapOf("input" to inputTensor)
        val results = session.run(inputs)

        val output = results[0].value as Array<FloatArray>
        return output[0]
    }
}
```

---

## Core ML (.mlmodel / .mlpackage) - Apple

Core ML to framework Apple do uruchamiania modeli ML na urządzeniach iOS, macOS, watchOS i tvOS.

### Kluczowe cechy

- Pełne wsparcie dla **Apple Neural Engine (ANE)** - dedykowany chip ML w A-series/M-series
- Format `.mlpackage` (nowszy, od Xcode 13) lub `.mlmodel` (starszy)
- Automatyczny dobór backendu: ANE → GPU → CPU
- Integracja z Xcode: podgląd modelu, automatyczne generowanie kodu Swift
- Create ML - narzędzie GUI do treningu na macOS

### Konwersja do Core ML

```python
import coremltools as ct
import tensorflow as tf

# Konwersja z TensorFlow/Keras
keras_model = tf.keras.models.load_model("model.h5")

mlmodel = ct.convert(
    keras_model,
    convert_to="mlprogram",           # Nowszy format .mlpackage
    inputs=[ct.ImageType(
        name="input_image",
        shape=(1, 224, 224, 3),
        scale=1/127.5,
        bias=[-1, -1, -1]
    )],
    outputs=[ct.TensorType(name="probabilities")]
)

mlmodel.author = "PAM Wiki"
mlmodel.short_description = "Klasyfikacja obrazów MobileNetV2"
mlmodel.save("MobileNetV2.mlpackage")
```

### Uruchamianie Core ML w Swift

```swift
import CoreML
import Vision
import UIKit

class ImageClassifierService {

    // Model generowany automatycznie przez Xcode z pliku .mlpackage
    private let model: VNCoreMLModel

    init() throws {
        let mlModel = try MobileNetV2(configuration: MLModelConfiguration()).model
        model = try VNCoreMLModel(for: mlModel)
    }

    func classify(image: UIImage, completion: @escaping (String, Double) -> Void) {
        guard let ciImage = CIImage(image: image) else { return }

        let request = VNCoreMLRequest(model: model) { request, error in
            guard let results = request.results as? [VNClassificationObservation],
                  let topResult = results.first else { return }

            DispatchQueue.main.async {
                completion(topResult.identifier, Double(topResult.confidence))
            }
        }

        request.imageCropAndScaleOption = .centerCrop

        let handler = VNImageRequestHandler(ciImage: ciImage, options: [:])
        try? handler.perform([request])
    }
}

// Użycie
let classifier = try ImageClassifierService()
classifier.classify(image: capturedPhoto) { label, confidence in
    print("Wynik: \(label) (\(Int(confidence * 100))%)")
}
```

---

## PyTorch Mobile (.ptl / .pte) - ExecuTorch

Meta (Facebook) oferuje dwie ścieżki wdrożenia PyTorch na mobile:

### Starsza ścieżka: TorchScript (.ptl)

```python
import torch

model = MyModel()
model.eval()

# Śledzenie modelu (TorchScript)
traced_model = torch.jit.trace(model, torch.randn(1, 3, 224, 224))

# Optymalizacja dla mobile
from torch.utils.mobile_optimizer import optimize_for_mobile
optimized_model = optimize_for_mobile(traced_model)
optimized_model._save_for_lite_interpreter("model.ptl")
```

### Nowa ścieżka: ExecuTorch (.pte)

ExecuTorch to nowa platforma Meta do wdrożeń edge AI:
- Wsparcie dla Apple Metal, Core ML, Qualcomm AI Engine
- Format `.pte` - skompilowany graf wykonania
- Docelowy dla LLM (Llama 3) na urządzeniach mobilnych

---

## safetensors - bezpieczna serializacja wag

Format stworzony przez HuggingFace jako alternatywa dla pickle:

### Problem z pickle

```python
# NIEBEZPIECZNE - pickle może wykonać dowolny kod podczas deserializacji!
import torch
model = torch.load("model.pkl")  # Ryzyko wykonania złośliwego kodu
```

### Rozwiązanie: safetensors

```python
from safetensors.torch import save_file, load_file

# Zapis
tensors = {"weight": model.weight, "bias": model.bias}
save_file(tensors, "model.safetensors")

# Odczyt - bezpieczny, bez wykonywania kodu
loaded = load_file("model.safetensors")
```

### Zalety safetensors na mobile

- Szybkie ładowanie - pamięć mapowana (mmap), zero-copy
- Bezpieczeństwo - tylko dane, żadnego kodu
- Wsparcie: PyTorch, TensorFlow, JAX, NumPy
- Coraz szerzej stosowany w ekosystemie HuggingFace

---

## Tabela porównawcza formatów ML

| Format | Rozmiar (wzgl.) | Inference | Android | iOS | Kwantyzacja | Acc. sprzętowy |
|--------|----------------|-----------|---------|-----|-------------|----------------|
| TFLite | Mały (~1x)     | Szybki    | ✅ NNAPI | ✅ (Core ML delegate) | ✅ INT8, INT4 | ✅ GPU, DSP, NPU |
| ONNX   | Średni (~1.5x) | Szybki    | ✅ ONNX Runtime | ✅ ONNX Runtime | ✅ INT8 | ✅ GPU |
| Core ML | Mały (~0.9x)  | Bardzo szybki | ❌ Tylko Apple | ✅ Natywny | ✅ FP16, INT8 | ✅ ANE, GPU |
| PyTorch Mobile (.ptl) | Duży (~2x) | Średni | ✅ Tak | ✅ Tak | ✅ INT8 | ⚠️ Ograniczone |
| ExecuTorch (.pte) | Mały | Szybki | ✅ Tak | ✅ Core ML | ✅ INT4 | ✅ Tak |
| safetensors | Duży (FP32) | N/A (wagi) | ⚠️ Konwersja | ⚠️ Konwersja | ❌ Nie | N/A |

---

## Pipeline: trening → wdrożenie na mobile

```
┌─────────────────────────────────────────────────────────────┐
│  1. TRENING                                                 │
│     PyTorch / TensorFlow / JAX                              │
│     Wynik: model.pt / model.h5 / checkpoint                 │
└──────────────────────────┬──────────────────────────────────┘
                           │
┌──────────────────────────▼──────────────────────────────────┐
│  2. KONWERSJA                                               │
│     → TFLite (tf.lite.TFLiteConverter)                      │
│     → ONNX (torch.onnx.export)                              │
│     → Core ML (coremltools)                                 │
└──────────────────────────┬──────────────────────────────────┘
                           │
┌──────────────────────────▼──────────────────────────────────┐
│  3. OPTYMALIZACJA                                           │
│     Kwantyzacja: FP32 → FP16 → INT8 → INT4                 │
│     Przycinanie (pruning): usuwanie zbędnych wag            │
│     Destylacja wiedzy: mały model uczy się od dużego        │
└──────────────────────────┬──────────────────────────────────┘
                           │
┌──────────────────────────▼──────────────────────────────────┐
│  4. WALIDACJA                                               │
│     Porównanie wyników: model oryginalny vs skwantyzowany   │
│     Benchmark: czas inference, zużycie pamięci              │
└──────────────────────────┬──────────────────────────────────┘
                           │
┌──────────────────────────▼──────────────────────────────────┐
│  5. WDROŻENIE                                               │
│     Dołącz do APK/IPA lub pobieraj dynamicznie              │
│     (Firebase ML, AWS S3, własny CDN)                       │
└─────────────────────────────────────────────────────────────┘
```

---

## Wpływ kwantyzacji na rozmiar modelu

| Precyzja | Rozmiar wag (MobileNetV2) | Dokładność (ImageNet Top-1) | Czas inference (Pixel 6) |
|----------|--------------------------|----------------------------|--------------------------|
| FP32     | 14 MB                    | 71.8%                      | 45 ms                    |
| FP16     | 7 MB                     | 71.7%                      | 28 ms                    |
| INT8     | 3.5 MB                   | 71.1%                      | 18 ms                    |
| INT4     | 1.8 MB                   | 69.5%                      | 12 ms                    |

Kwantyzacja INT8 to złoty środek - 4x mniejszy model, 2x szybszy inference, minimalna utrata dokładności.

---

## Dobre praktyki

- **Zacznij od TFLite** dla Androida i **Core ML** dla iOS - najlepsze wsparcie sprzętowe
- Zawsze **waliduj model po kwantyzacji** - porównaj wyniki z modelem FP32 na zestawie testowym
- **Nie dołączaj dużych modeli do APK** - pobieraj je dynamicznie z Firebase ML lub własnego CDN
- Stosuj **NNAPI delegate** w TFLite dla nowoczesnych urządzeń Android (API 27+)
- Dla zadań NLP rozważ **distylowane modele** (DistilBERT, TinyBERT) - 6–10x mniejsze przy zbliżonej jakości
- **Benchmark na rzeczywistym urządzeniu** - emulator nie odzwierciedla rzeczywistych czasów inference

---

## Podsumowanie

Ekosystem ML na urządzeniach mobilnych jest zdominowany przez **TFLite** (Android) i **Core ML** (iOS). ONNX pełni rolę formatu pośredniego i jest przydatny w projektach cross-platform. Kwantyzacja INT8 to standardowa technika optymalizacji, która powinna być stosowana niemal zawsze. Nowe formaty jak ExecuTorch i safetensors zyskują na znaczeniu wraz ze wzrostem popularności dużych modeli językowych na urządzeniach mobilnych.
