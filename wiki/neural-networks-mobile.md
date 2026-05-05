# Sieci neuronowe na urządzeniu mobilnym

## Streszczenie

Artykuł omawia architekturę i zastosowanie sieci neuronowych zoptymalizowanych pod kątem urządzeń mobilnych. Przedstawiono rodziny modeli CNN (MobileNet, EfficientNet-Lite, SqueezeNet, MnasNet, ShuffleNet), modele Transformer przystosowane do mobile (MobileBERT, DistilBERT, TinyBERT), metody Neural Architecture Search (NAS), transfer learning, modele sekwencyjne LSTM/GRU oraz kluczowe metryki wydajności.

**Słowa kluczowe:** MobileNet, depthwise separable convolution, EfficientNet, MobileBERT, NAS, transfer learning, LSTM, GRU, TFLite, FLOPs, MACs, latency, quantization

---

## 1. Dlaczego sieci neuronowe na mobile są wyzwaniem?

Urządzenia mobilne posiadają istotne ograniczenia w porównaniu z serwerami:

| Zasób | Serwer (GPU) | Smartfon flagship | Smartfon mid-range |
|---|---|---|---|
| RAM | 16–80 GB | 8–16 GB | 3–6 GB |
| Moc obliczeniowa | 10–80 TFLOPS | 2–6 TOPS (NPU) | 0,5–2 TOPS |
| Zasilanie | nieograniczone | 3–5 Wh bateria | 2–3 Wh bateria |
| Pasmo pamięci | 1–3 TB/s | 50–100 GB/s | 20–50 GB/s |

Projektując sieci neuronowe na mobile, inżynierowie muszą balansować między:
- **Dokładnością (accuracy)** - jakość predykcji modelu
- **Opóźnieniem (latency)** - czas odpowiedzi inference
- **Rozmiarem modelu (model size)** - zajętość dysku i RAM
- **Zużyciem energii (power consumption)** - wpływ na baterię

---

## 2. Metryki wydajności modeli

### 2.1 FLOPs i MACs

**FLOPs** (Floating Point Operations) - całkowita liczba operacji zmiennoprzecinkowych wykonana podczas jednego forward pass. Często stosuje się termin **MACs** (Multiply-Accumulate Operations), gdzie 1 MAC ≈ 2 FLOPs.

Dla warstwy konwolucyjnej:

```
MACs = K_h × K_w × C_in × C_out × H_out × W_out
```

Gdzie: `K_h, K_w` - rozmiar kernela, `C_in/C_out` - kanały, `H_out/W_out` - wymiary wyjścia.

### 2.2 Parametry modelu

Liczba parametrów określa rozmiar modelu na dysku i w RAM:
- **Float32**: 1 param = 4 bajty
- **Float16**: 1 param = 2 bajty
- **INT8**: 1 param = 1 bajt
- **INT4**: 1 param = 0,5 bajta

### 2.3 Latency vs Throughput

- **Latency** - czas przetworzenia pojedynczego sample (ms)
- **Throughput** - liczba sample przetworzonych na sekundę (fps)

---

## 3. Depthwise Separable Convolution - matematyka

Kluczową innowacją MobileNet jest **depthwise separable convolution**, rozkład standardowej konwolucji na dwie operacje:

### 3.1 Standardowa konwolucja

```
Koszt = D_K × D_K × M × N × D_F × D_F
```

Gdzie: `D_K` - rozmiar kernela, `M` - kanały wejściowe, `N` - kanały wyjściowe, `D_F` - rozmiar feature map.

### 3.2 Depthwise Convolution

Każdy kanał wejściowy jest filtrowany niezależnie jednym kernelem 3×3:

```
Koszt_DW = D_K × D_K × M × D_F × D_F
```

### 3.3 Pointwise Convolution (1×1)

Łączy kanały z depthwise w nowe reprezentacje:

```
Koszt_PW = M × N × D_F × D_F
```

### 3.4 Redukcja kosztów obliczeniowych

```
Redukcja = (Koszt_DW + Koszt_PW) / Koszt_std
         = 1/N + 1/D_K²
```

Dla `D_K=3, N=32`: redukcja ≈ **8–9×** mniej operacji przy porównywalnej jakości reprezentacji.

---

## 4. Rodzina MobileNet

### 4.1 MobileNet V1 (2017)

Wprowadził depthwise separable convolutions jako podstawowy blok budulcowy. Parametr `width multiplier α` skaluje liczbę kanałów:

```
Kanały_zmodyfikowane = α × Kanały_oryginalne
```

- MobileNet-1.0: 4,2M params, 569M MACs, Top-1 70,6%
- MobileNet-0.25: 0,5M params, 41M MACs, Top-1 50,6%

### 4.2 MobileNet V2 (2018)

Dodał **inverted residuals** i **linear bottlenecks**:
- Rozszerzenie kanałów (expansion factor `t`, typowo 6)
- Residual connection z cienkich do cienkich warstw
- Brak nieliniowości na końcu bottleneck (linear activation zapobiega utracie informacji)

```
Input (k channels)
    → 1×1 Conv (expand to t×k channels) + ReLU6
    → 3×3 DW Conv + ReLU6
    → 1×1 Conv (project back to k channels, NO activation)
    → + residual (skip connection, gdy k_in == k_out i stride == 1)
```

### 4.3 MobileNet V3 (2019)

Ulepszenia z NAS + ręczne korekty:
- **Squeeze-and-Excitation (SE) blocks** w bottleneck - rekalibracja kanałów
- **Hard-Swish** activation: `x × ReLU6(x+3)/6` (szybsze od Swish dzięki uniknięciu exp)
- Zoptymalizowane ostatnie warstwy (usunięcie kosztownych warstw końcowych)
- Dwie wersje: **MobileNetV3-Large** i **MobileNetV3-Small**

| Model | Params | MACs | Top-1 (ImageNet) | Latency (Pixel 4) |
|---|---|---|---|---|
| MobileNetV1 | 4,2M | 575M | 70,6% | 113 ms |
| MobileNetV2 | 3,4M | 300M | 72,0% | 74 ms |
| MobileNetV3-Large | 5,4M | 219M | 75,2% | 51 ms |
| MobileNetV3-Small | 2,9M | 66M | 67,4% | 15 ms |

---

## 5. EfficientNet-Lite

EfficientNet-Lite to wersja EfficientNet przystosowana do edge devices i TFLite:
- Usunięte SE blocks (słabo wspierane przez NNAPI)
- Zastąpiono Swish przez ReLU6
- Uniformalne skalowanie depth/width/resolution przez compound coefficient

| Model | Params | MACs | Top-1 (ImageNet) | Latency (CPU Pixel 4) |
|---|---|---|---|---|
| EfficientNet-Lite0 | 4,7M | 407M | 74,4% | 89 ms |
| EfficientNet-Lite1 | 5,4M | 631M | 76,3% | 153 ms |
| EfficientNet-Lite2 | 6,1M | 899M | 77,5% | 218 ms |
| EfficientNet-Lite4 | 13M | 2,6G | 80,4% | 487 ms |

---

## 6. SqueezeNet, MnasNet i ShuffleNet

### 6.1 SqueezeNet

Oparty na "Fire modules": squeeze (1×1) + expand (1×1 + 3×3):
- Rozmiar ≈ 0,5 MB (bez kwantyzacji)
- Top-1 ≈ 57% na ImageNet - znacznie niżej od MobileNet
- Przeznaczony dla środowisk z bardzo ograniczoną pamięcią (embedded)

### 6.2 MnasNet

Wynik **Neural Architecture Search** z latency jako częścią funkcji celu:

```
reward(m) = ACC(m) × (LAT(m) / T)^w
```

Gdzie `T` to target latency (np. 75 ms), `w=-0.07` - siła kary za przekroczenie. Szukanie odbywało się na realnym Pixel 1, a nie symulatorze.

### 6.3 ShuffleNet V2

Używa **channel split** i **channel shuffle** dla efektywności na CPU:
- W każdym bloku połowa kanałów przechodzi bezpośrednio (identity branch)
- Efektywne dzięki lokalności pamięci i przyjaznej strukturze cache

---

## 7. Modele Transformer na mobile

### 7.1 MobileBERT

Kompresja BERT poprzez bottleneck architecture:
- 25M params (BERT-Base: 110M params - 4,3× mniejszy)
- Trenowany przez **progressive knowledge distillation** od "inverted-bottleneck teacher"
- Przyspieszenie 5,5× przy zachowaniu 99% jakości BERT na GLUE

### 7.2 DistilBERT

Destylacja wiedzy z BERT-Base z soft labels:
- 66M params, 60% mniejszy od BERT
- Zachowuje 97% jakości na GLUE benchmark
- 60% szybszy inference - dobry kompromis

### 7.3 TinyBERT

Dwuetapowa destylacja (Transformer distillation):

1. **General Distillation** - naśladowanie attention matrices i hidden states nauczyciela (BERT) na dużym korpusie
2. **Task-Specific Distillation** - augmentowany data distillation dla konkretnego zadania

| Model | Params | SQuAD v1.1 F1 | GLUE Score | Latency (Pixel 4) |
|---|---|---|---|---|
| BERT-Base | 110M | 88,5% | 82,5 | ~3000 ms |
| DistilBERT | 66M | 86,9% | 77,0 | ~1800 ms |
| MobileBERT | 25M | 90,0% | 78,9 | 62 ms |
| TinyBERT 4L | 14,5M | 87,5% | 75,5 | 35 ms |

---

## 8. Neural Architecture Search (NAS) dla mobile

NAS automatycznie projektuje architektury sieci zamiast ręcznego projektowania.

### 8.1 Typy NAS

- **Reinforcement Learning NAS** (NASNet): agent generuje architekturę (sekwencja decyzji), otrzymuje reward = accuracy na validation set
- **Evolutionary NAS**: populacja architektur, krzyżowanie i mutacja, selekcja przez accuracy
- **Differentiable NAS (DARTS)**: ciągła relaksacja przestrzeni architektur - gradient descent przez operacje

### 8.2 Hardware-Aware NAS

Kluczowe dla mobile - uwzględnia latency na docelowym hardware:

```python
def reward(accuracy, latency, target_latency=50.0, w=-0.07):
    """Funkcja celu dla hardware-aware NAS (wzór z MnasNet)."""
    return accuracy * (latency / target_latency) ** w

# Przykład: model 78% acc, 60ms latency, target 50ms
r = reward(accuracy=0.78, latency=60.0, target_latency=50.0)
print(f"Reward: {r:.4f}")  # Lekka kara za przekroczenie target
```

### 8.3 One-Shot NAS (SuperNet)

Trening pojedynczej "supersieci" zawierającej wszystkie możliwe pod-architektury. Sampling sub-networks umożliwia szybkie przeszukiwanie przestrzeni architektur.

---

## 9. Transfer Learning i Fine-tuning

### 9.1 Feature Extraction

Zamrożone warstwy bazowe + nowa głowa klasyfikatora:

```python
import tensorflow as tf

base_model = tf.keras.applications.MobileNetV2(
    input_shape=(224, 224, 3),
    include_top=False,
    weights='imagenet'
)
base_model.trainable = False

model = tf.keras.Sequential([
    base_model,
    tf.keras.layers.GlobalAveragePooling2D(),
    tf.keras.layers.Dropout(0.2),
    tf.keras.layers.Dense(10, activation='softmax')
])

model.compile(
    optimizer=tf.keras.optimizers.Adam(1e-3),
    loss='sparse_categorical_crossentropy',
    metrics=['accuracy']
)
```

### 9.2 Fine-tuning: Odmrożenie górnych warstw

```python
# Po wstępnym treningu głowy przez kilka epok:
base_model.trainable = True

# Zamroź wszystko poza ostatnimi 30 warstwami
for layer in base_model.layers[:-30]:
    layer.trainable = False

model.compile(
    optimizer=tf.keras.optimizers.Adam(learning_rate=1e-5),
    loss='sparse_categorical_crossentropy',
    metrics=['accuracy']
)

model.fit(
    train_dataset,
    epochs=10,
    validation_data=val_dataset,
    callbacks=[
        tf.keras.callbacks.EarlyStopping(patience=3),
        tf.keras.callbacks.ReduceLROnPlateau(factor=0.5, patience=2)
    ]
)
```

### 9.3 Konwersja do TFLite INT8

```python
import numpy as np

def convert_to_tflite_int8(model, calibration_data):
    converter = tf.lite.TFLiteConverter.from_keras_model(model)
    converter.optimizations = [tf.lite.Optimize.DEFAULT]

    def representative_dataset():
        for img in calibration_data:
            yield [img[np.newaxis, ...].astype(np.float32)]

    converter.representative_dataset = representative_dataset
    converter.target_spec.supported_ops = [
        tf.lite.OpsSet.TFLITE_BUILTINS_INT8
    ]
    converter.inference_input_type = tf.int8
    converter.inference_output_type = tf.int8
    tflite_bytes = converter.convert()

    size_kb = len(tflite_bytes) / 1024
    print(f"Rozmiar modelu INT8: {size_kb:.1f} KB")
    return tflite_bytes
```

---

## 10. LSTM/GRU na mobile

### 10.1 Wyzwania sekwencyjnych modeli

- Sekwencyjny charakter → trudno zrównoleglić
- Duże macierze wag przy długich sekwencjach
- Duże wymagania na bandwidth pamięci (każdy krok = odczyt wag)

### 10.2 GRU vs LSTM na mobile

GRU (Gated Recurrent Unit) ma mniej parametrów niż LSTM (2 bramki vs 3) przy zbliżonej jakości - jest preferowany w zastosowaniach mobilnych:

| Model | Bramki | Params (hidden=256) | Relative Speed |
|---|---|---|---|
| LSTM | 4 (i, f, g, o) | ~527K | 1.0× |
| GRU | 3 (r, z, n) | ~395K | ~1.3× |
| RNN | 1 | ~132K | ~2.5× |

### 10.3 Pruning RNN w TFLite

```python
import tensorflow_model_optimization as tfmot

# Model z LSTM
lstm_model = tf.keras.Sequential([
    tf.keras.layers.Embedding(10000, 64),
    tf.keras.layers.Bidirectional(tf.keras.layers.LSTM(128)),
    tf.keras.layers.Dense(1, activation='sigmoid')
])

# Pruning do 70% sparsity
pruning_params = {
    'pruning_schedule': tfmot.sparsity.keras.PolynomialDecay(
        initial_sparsity=0.30,
        final_sparsity=0.70,
        begin_step=1000,
        end_step=5000
    )
}

pruned_model = tfmot.sparsity.keras.prune_low_magnitude(
    lstm_model, **pruning_params
)

# Callback do aktualizacji masek podczas treningu
callbacks = [tfmot.sparsity.keras.UpdatePruningStep()]
pruned_model.fit(train_data, epochs=10, callbacks=callbacks)

# Usuń wagi i zapisz
final_model = tfmot.sparsity.keras.strip_pruning(pruned_model)
```

---

## 11. Kotlin: Ładowanie TFLite z MobileNet na Android

```kotlin
import android.content.Context
import android.graphics.Bitmap
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
import org.tensorflow.lite.Interpreter
import org.tensorflow.lite.support.common.FileUtil
import org.tensorflow.lite.support.image.TensorImage
import org.tensorflow.lite.support.image.ops.ResizeOp
import org.tensorflow.lite.support.label.TensorLabel
import org.tensorflow.lite.support.tensorbuffer.TensorBuffer
import org.tensorflow.lite.DataType

class MobileNetClassifier(private val context: Context) {

    private val interpreter: Interpreter
    private val labels: List<String>
    private val inputSize = 224

    init {
        val options = Interpreter.Options().apply {
            numThreads = 4
            useNNAPI = true   // Delegat sprzętowy: NPU/GPU/DSP
        }
        val modelBuffer = FileUtil.loadMappedFile(
            context, "mobilenet_v3_small.tflite"
        )
        interpreter = Interpreter(modelBuffer, options)
        labels = FileUtil.loadLabels(context, "imagenet_labels.txt")
    }

    suspend fun classify(bitmap: Bitmap): List<Pair<String, Float>> =
        withContext(Dispatchers.Default) {
            // 1. Preprocessing
            val tensorImage = TensorImage(DataType.FLOAT32)
            tensorImage.load(bitmap)

            val imageProcessor =
                org.tensorflow.lite.support.image.ImageProcessor.Builder()
                    .add(ResizeOp(inputSize, inputSize,
                        ResizeOp.ResizeMethod.BILINEAR))
                    .add(org.tensorflow.lite.support.common.ops
                        .NormalizeOp(127.5f, 127.5f))
                    .build()

            val processed = imageProcessor.process(tensorImage)

            // 2. Bufor wyjściowy
            val outputShape = interpreter.getOutputTensor(0).shape()
            val outputBuffer = TensorBuffer.createFixedSize(
                outputShape, DataType.FLOAT32
            )

            // 3. Inference
            interpreter.run(processed.buffer, outputBuffer.buffer.rewind())

            // 4. Top-3 wyniki
            TensorLabel(labels, outputBuffer)
                .mapWithFloatValue
                .entries
                .sortedByDescending { it.value }
                .take(3)
                .map { it.key to it.value }
        }

    fun close() = interpreter.close()
}
```

---

## 12. Benchmarki architektur

### 12.1 ImageNet Top-1 vs Latency (Pixel 6, CPU)

| Model | Params | Top-1 | Latency CPU | Latency GPU |
|---|---|---|---|---|
| SqueezeNet 1.1 | 1,2M | 57,5% | 48 ms | 22 ms |
| MobileNetV1-1.0 | 4,2M | 70,6% | 113 ms | 38 ms |
| MobileNetV2-1.0 | 3,4M | 72,0% | 74 ms | 25 ms |
| MobileNetV3-Small | 2,9M | 67,4% | 15 ms | 8 ms |
| MobileNetV3-Large | 5,4M | 75,2% | 51 ms | 17 ms |
| EfficientNet-Lite0 | 4,7M | 74,4% | 89 ms | 30 ms |
| EfficientNet-Lite4 | 13M | 80,4% | 487 ms | 120 ms |
| MnasNet-A1 | 3,9M | 75,2% | 66 ms | 22 ms |
| ShuffleNetV2 1× | 2,3M | 69,4% | 44 ms | 19 ms |

### 12.2 NLP: MobileBERT vs inne modele

| Model | Params | SQuAD v1 F1 | Latency (Pixel 4) |
|---|---|---|---|
| BERT-Base | 110M | 88,5% | ~3000 ms |
| DistilBERT | 66M | 86,9% | ~1800 ms |
| MobileBERT | 25M | 90,0% | 62 ms |
| TinyBERT 4L | 14,5M | 87,5% | 35 ms |

---

## 13. Dobre praktyki

1. **Dobieraj model do wymagań** - MobileNetV3-Small gdy priorytetem jest szybkość, EfficientNet-Lite4 gdy potrzebna dokładność
2. **Kwantyzuj do INT8** - ~4× mniejszy rozmiar, ~2-3× przyspieszenie latency
3. **Profiluj na docelowym urządzeniu** - latency mocno zależy od CPU/NPU/GPU konkretnego SoC
4. **Używaj representative dataset** przy kalibracji PTQ - jakość INT8 jest lepsza przy dobrych przykładach
5. **Transfer learning** drastycznie redukuje potrzebne dane i czas treningu - użyj ImageNet weights jako punktu startowego
6. **GRU zamiast LSTM** dla modeli sekwencyjnych - mniej parametrów, szybszy inference

---

## Powiązane artykuły

- [Wprowadzenie do lokalnego AI na mobile](local-ai-intro.md)
- [Frameworki ML na mobile](mobile-ml-frameworks.md)
- [Kwantyzacja i optymalizacja modeli AI](model-quantization.md)
- [Wnioskowanie lokalne - architektura i wydajność](on-device-inference.md)
- [AI w przetwarzaniu obrazu na urządzeniu](ai-image-processing.md)
- [Modele językowe LLM na urządzeniu mobilnym](llm-on-device.md)
