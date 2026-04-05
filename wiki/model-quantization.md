# Kwantyzacja i optymalizacja modeli AI

## Streszczenie

Artykuł omawia techniki kompresji modeli AI przeznaczonych na urządzenia mobilne: kwantyzację wagową i aktywacji (Float32 do INT4), Post-Training Quantization (PTQ), Quantization-Aware Training (QAT), pruning, destylację wiedzy oraz operator fusion. Opisano praktyczne implementacje dla TFLite, Core ML i ONNX Runtime z przykładami kodu Python.

**Słowa kluczowe:** quantization, PTQ, QAT, INT8, INT4, pruning, knowledge distillation, operator fusion, TFLite, Core ML, coremltools, ONNX Runtime, model compression, latency, model size

---

## 1. Dlaczego kwantyzacja jest krytyczna dla mobile?

### 1.1 Problem z pełną precyzją

Model ResNet-50 w Float32:
- Rozmiar: 98 MB (25M params * 4 bytes)
- Inference RAM: ok. 400 MB (wagi + aktywacje)
- Latency na Pixel 6 CPU: ok. 450 ms

Ten sam model po kwantyzacji INT8:
- Rozmiar: 25 MB (4x mniejszy)
- Inference RAM: ok. 100 MB
- Latency na Pixel 6 CPU: ok. 150 ms (3x szybszy)

### 1.2 Przyczyny zysku z kwantyzacji

| Aspekt | Float32 | INT8 | INT4 |
|---|---|---|---|
| Bajty na parametr | 4 | 1 | 0,5 |
| Operacje SIMD (256-bit) | 8 fp32 | 32 int8 | 64 int4 |
| Bandwidth | 1x | 4x mniej | 8x mniej |
| Energia | 1x | ok. 3,7x mniej | ok. 6x mniej |

---

## 2. Typy kwantyzacji: Float32 do INT4

### 2.1 Hierarchia precyzji

```
Float32 (FP32) -- pelna precyzja treningu
    2x mniej pamieci
Float16 (FP16/BF16) -- trenowanie mixed-precision
    4x mniej pamieci
INT8 -- standard inference na mobile
    2x mniej pamieci
INT4 -- LLM na edge, pewna utrata jakosci
    2x mniej pamieci
INT2/Binary -- eksperymentalne, duza utrata jakosci
```

### 2.2 Jak dziala kwantyzacja liniowa?

Odwzorowanie float na integer:

```
x_quant = round(x / scale) + zero_point
x_dequant = (x_quant - zero_point) * scale
scale = (x_max - x_min) / (2^bits - 1)
zero_point = round(-x_min / scale)
```

**Symmetric quantization** (zero_point = 0):
```
scale = max(|x|) / (2^(bits-1) - 1)
```

**Asymmetric quantization** (zero_point != 0) -- lepsza dla aktywacji ReLU.

---

## 3. Post-Training Quantization (PTQ)

### 3.1 Dynamic Quantization

Wagi kwantyzowane statycznie, aktywacje dynamicznie (w trakcie inference):

```python
import torch

model = torch.load('model.pth')
model.eval()

quantized_model = torch.quantization.quantize_dynamic(
    model,
    qconfig_spec={
        torch.nn.Linear,
        torch.nn.LSTM,
        torch.nn.GRU
    },
    dtype=torch.qint8
)

def get_model_size(m):
    import io
    buf = io.BytesIO()
    torch.save(m.state_dict(), buf)
    return buf.tell() / (1024 * 1024)

print(f"Rozmiar oryginalu: {get_model_size(model):.1f} MB")
print(f"Rozmiar po kwantyzacji: {get_model_size(quantized_model):.1f} MB")
```

**Kiedy stosowac**: modele NLP (BERT, LSTM) gdzie bottleneck to wczytywanie wag, nie obliczenia.

### 3.2 Static Quantization (Full INT8) z TFLite

Zarówno wagi jak i aktywacje kwantyzowane - wymaga kalibracji:

```python
import tensorflow as tf
import numpy as np

def ptq_full_int8(keras_model, calibration_images):
    """Post-training static quantization do INT8."""
    converter = tf.lite.TFLiteConverter.from_keras_model(keras_model)
    converter.optimizations = [tf.lite.Optimize.DEFAULT]

    def representative_dataset():
        for img in calibration_images[:200]:
            yield [img[np.newaxis, ...].astype(np.float32)]

    converter.representative_dataset = representative_dataset

    converter.target_spec.supported_ops = [
        tf.lite.OpsSet.TFLITE_BUILTINS_INT8
    ]
    converter.inference_input_type = tf.int8
    converter.inference_output_type = tf.int8

    tflite_model = converter.convert()
    print(f"Rozmiar INT8: {len(tflite_model)/1024:.1f} KB")
    return tflite_model
```

### 3.3 Float16 Quantization

Prostsza kwantyzacja, bez kalibracji, minimalne ryzyko degradacji:

```python
def ptq_float16(keras_model):
    """Kwantyzacja Float16 - dobry balans szybkosci i jakosci."""
    converter = tf.lite.TFLiteConverter.from_keras_model(keras_model)
    converter.optimizations = [tf.lite.Optimize.DEFAULT]
    converter.target_spec.supported_types = [tf.float16]
    return converter.convert()
```

Float16 ma doskonale wsparcie na GPU delegates (NNAPI, Metal).

---

## 4. Quantization-Aware Training (QAT)

### 4.1 Symulowana kwantyzacja podczas treningu

QAT symuluje kwantyzacje w trakcie forward pass (fake quantization), ale uzywa float32 do obliczania gradientow (straight-through estimator):

```python
import tensorflow_model_optimization as tfmot

def apply_qat(keras_model):
    """Owin model w quantization-aware wrapper."""
    qat_model = tfmot.quantization.keras.quantize_model(keras_model)
    qat_model.compile(
        optimizer=tf.keras.optimizers.Adam(1e-5),
        loss='sparse_categorical_crossentropy',
        metrics=['accuracy']
    )
    return qat_model

base_model = tf.keras.applications.MobileNetV3Small(
    input_shape=(96, 96, 3),
    include_top=True,
    weights='imagenet',
    classes=10
)

qat_model = apply_qat(base_model)
qat_model.fit(train_dataset, epochs=5, validation_data=val_dataset)

# Konwersja do TFLite INT8 po QAT (nie potrzeba representative_dataset)
converter = tf.lite.TFLiteConverter.from_keras_model(qat_model)
converter.optimizations = [tf.lite.Optimize.DEFAULT]
tflite_qat = converter.convert()
```

### 4.2 QAT vs PTQ - porownanie

| Metoda | Jakosc INT8 | Czas przygotowania | Dane kalibracyjne |
|---|---|---|---|
| PTQ Dynamic | Dobra (NLP) | Minuty | Nie potrzebne |
| PTQ Static | Dobra (CNN) | Godziny | 100-500 probek |
| QAT | Najlepsza | Dni (retraining) | Pelny dataset |

---

## 5. Core ML quantization z coremltools

### 5.1 Konwersja i linear quantization

```python
import coremltools as ct
import tensorflow as tf

keras_model = tf.keras.applications.MobileNetV2(
    input_shape=(224, 224, 3),
    include_top=True,
    weights='imagenet'
)

coreml_model = ct.convert(
    keras_model,
    inputs=[ct.ImageType(
        name="input",
        shape=(1, 224, 224, 3),
        scale=1/127.5,
        bias=[-1, -1, -1]
    )],
    minimum_deployment_target=ct.target.iOS16
)

# Liniowa kwantyzacja wag do INT8
op_config = ct.optimize.coreml.OpLinearQuantizerConfig(
    mode="linear_symmetric",
    dtype="int8",
    granularity="per_channel"
)

config = ct.optimize.coreml.OptimizationConfig(
    global_config=op_config
)

quantized_model = ct.optimize.coreml.linear_quantize_weights(
    coreml_model, config=config
)
quantized_model.save("mobilenet_int8.mlpackage")
```

### 5.2 Palettization (Weight Clustering)

Palettization zastepuje wagi z tablicy look-up (palety):

```python
palette_config = ct.optimize.coreml.OpPalettizerConfig(
    mode="kmeans",
    nbits=4,           # 2^4 = 16 wartosci w palecie
    granularity="per_grouped_channel",
    group_size=16
)

palette_opt_config = ct.optimize.coreml.OptimizationConfig(
    global_config=palette_config
)

palettized_model = ct.optimize.coreml.palettize_weights(
    coreml_model, palette_opt_config
)
```

### 5.3 Pruning w coremltools

```python
pruning_config = ct.optimize.coreml.OpMagnitudePrunerConfig(
    target_sparsity=0.5,
    weight_threshold=1e-3
)

opt_config = ct.optimize.coreml.OptimizationConfig(
    global_config=pruning_config
)

pruned_model = ct.optimize.coreml.prune_weights(
    coreml_model, opt_config
)
```

---

## 6. ONNX Runtime quantization

### 6.1 Konwersja PyTorch do ONNX i kwantyzacja INT8

```python
import torch
import torchvision
from onnxruntime.quantization import (
    quantize_static,
    quantize_dynamic,
    QuantType,
    CalibrationDataReader
)
import numpy as np

# Eksport modelu PyTorch do ONNX
model = torchvision.models.mobilenet_v3_small(pretrained=True)
model.eval()

dummy_input = torch.randn(1, 3, 224, 224)
torch.onnx.export(
    model,
    dummy_input,
    "mobilenet.onnx",
    opset_version=17,
    input_names=["input"],
    output_names=["output"],
    dynamic_axes={"input": {0: "batch_size"}}
)

# Dynamic quantization (szybkie, bez kalibracji)
quantize_dynamic(
    model_input="mobilenet.onnx",
    model_output="mobilenet_dynamic_int8.onnx",
    weight_type=QuantType.QInt8
)

# Static quantization z kalibracją
class ImageDataReader(CalibrationDataReader):
    def __init__(self, images):
        self.images = iter(images)

    def get_next(self):
        try:
            img = next(self.images)
            return {"input": img[np.newaxis, ...].astype(np.float32)}
        except StopIteration:
            return None

quantize_static(
    model_input="mobilenet.onnx",
    model_output="mobilenet_static_int8.onnx",
    calibration_data_reader=ImageDataReader(calibration_images),
    per_channel=True,
    weight_type=QuantType.QInt8
)
```

---

## 7. Pruning -- przycinanie wag

### 7.1 Unstructured vs Structured Pruning

**Unstructured pruning**: usuwa indywidualne wagi (sparse tensors)
- Wymaga sparse computation support (NNAPI, sparse kernels)
- Duze potencjalne kompresje (do 90% sparsity)

**Structured pruning**: usuwa cale neurony/filtry/warstwy
- Bezposrednio redukuje liczbe operacji
- Kompatybilne ze standardowym dense hardware

```python
import tensorflow_model_optimization as tfmot

def build_pruned_model(base_model):
    """Structured pruning -- usuwanie filtrow konwolucyjnych."""
    pruning_schedule = tfmot.sparsity.keras.PolynomialDecay(
        initial_sparsity=0.20,
        final_sparsity=0.80,
        begin_step=0,
        end_step=3000,
        frequency=100
    )

    def apply_pruning_to_conv(layer):
        if isinstance(layer, tf.keras.layers.Conv2D):
            return tfmot.sparsity.keras.prune_low_magnitude(
                layer, pruning_schedule=pruning_schedule
            )
        return layer

    pruned = tf.keras.models.clone_model(
        base_model,
        clone_function=apply_pruning_to_conv
    )
    return pruned

model = build_pruned_model(base_model)
model.compile(optimizer='adam', loss='sparse_categorical_crossentropy')

callbacks = [
    tfmot.sparsity.keras.UpdatePruningStep(),
    tfmot.sparsity.keras.PruningSummaries(log_dir='./logs')
]
model.fit(train_data, epochs=15, callbacks=callbacks)

# Usuniecie masek pruning
final_model = tfmot.sparsity.keras.strip_pruning(model)
```

---

## 8. Knowledge Distillation

### 8.1 Teacher-Student Training

Maly model (student) uczy sie od duzego (teacher) za pomoca soft labels:

```python
import tensorflow as tf

def distillation_loss(y_true, y_pred, teacher_pred,
                      temperature=4.0, alpha=0.1):
    """
    Laczy hard loss (ground truth) z soft loss (teacher).
    temperature: wyzsze = mieksza dystrybucja teacher
    alpha: waga hard loss (zazwyczaj 0.1-0.3)
    """
    soft_teacher = tf.nn.softmax(teacher_pred / temperature, axis=-1)
    soft_student = tf.nn.softmax(y_pred / temperature, axis=-1)

    kl_loss = tf.keras.losses.KLDivergence()(soft_teacher, soft_student)
    soft_loss = (temperature ** 2) * kl_loss

    hard_loss = tf.keras.losses.SparseCategoricalCrossentropy(
        from_logits=True
    )(y_true, y_pred)

    return alpha * hard_loss + (1 - alpha) * soft_loss


class DistillationTrainer(tf.keras.Model):
    def __init__(self, student, teacher, temperature=4.0, alpha=0.1):
        super().__init__()
        self.student = student
        self.teacher = teacher
        self.temperature = temperature
        self.alpha = alpha

    def train_step(self, data):
        x, y = data
        teacher_predictions = self.teacher(x, training=False)

        with tf.GradientTape() as tape:
            student_predictions = self.student(x, training=True)
            loss = distillation_loss(
                y, student_predictions, teacher_predictions,
                self.temperature, self.alpha
            )

        gradients = tape.gradient(loss, self.student.trainable_variables)
        self.optimizer.apply_gradients(
            zip(gradients, self.student.trainable_variables)
        )
        return {"loss": loss}
```

---

## 9. Operator Fusion i Graph Optimization

### 9.1 Czym jest operator fusion?

Fusion laczy sekwencje operacji w jedna zoptymalizowana operacje:

```
Conv2D -> BatchNorm -> ReLU
       fuzja
Conv2D+BN+ReLU (jeden kernel GPU/NPU)

Korzysci:
- Eliminacja posrednich buforow pamieci
- Lepsze uzycie cache
- Redukcja overhead kerneli
```

### 9.2 Automatyczna fuzja w TFLite

```python
converter = tf.lite.TFLiteConverter.from_keras_model(model)
converter.optimizations = [tf.lite.Optimize.DEFAULT]
# TFLite automatycznie stosuje:
# - Conv + BatchNorm + Activation fusion
# - Constant folding
# - Dead node elimination
tflite_model = converter.convert()
```

### 9.3 Operator fusion w Core ML

coremltools automatycznie wykonuje podczas konwersji:
- Conv + BatchNorm + activation fusion
- Transpose elimination
- Constant folding
- Dead code elimination

Zoptymalizowane modele Core ML sa bezposrednio kompatybilne z ANE (Apple Neural Engine).

---

## 10. Mierzenie jakosci po kompresji

### 10.1 Kompleksowa ewaluacja TFLite

```python
import numpy as np
import time
import os

def evaluate_tflite_model(tflite_path, test_data, test_labels):
    """Ewaluacja TFLite modelu: dokladnosc + latency."""
    interpreter = tf.lite.Interpreter(model_path=tflite_path)
    interpreter.allocate_tensors()

    input_details = interpreter.get_input_details()
    output_details = interpreter.get_output_details()

    correct = 0
    latencies = []

    for img, label in zip(test_data, test_labels):
        input_data = img[np.newaxis, ...].astype(input_details[0]['dtype'])

        # Warm-up (pierwsze uruchomienie jest wolniejsze)
        interpreter.set_tensor(input_details[0]['index'], input_data)
        interpreter.invoke()

        # Pomiar latency
        start = time.perf_counter()
        interpreter.set_tensor(input_details[0]['index'], input_data)
        interpreter.invoke()
        latency_ms = (time.perf_counter() - start) * 1000

        output = interpreter.get_tensor(output_details[0]['index'])
        if np.argmax(output[0]) == label:
            correct += 1
        latencies.append(latency_ms)

    accuracy = correct / len(test_labels)
    avg_latency = np.mean(latencies)
    p95_latency = np.percentile(latencies, 95)
    size_kb = os.path.getsize(tflite_path) / 1024

    print(f"Dokladnosc:        {accuracy*100:.2f}%")
    print(f"Srednia latency:   {avg_latency:.1f} ms")
    print(f"P95 latency:       {p95_latency:.1f} ms")
    print(f"Rozmiar modelu:    {size_kb:.1f} KB")
    return accuracy, avg_latency
```

### 10.2 Typowe wyniki kompresji MobileNetV2

| Metoda | Rozmiar | Top-1 | Latency CPU | Latency NNAPI |
|---|---|---|---|---|
| Float32 (baseline) | 14 MB | 71,8% | 76 ms | brak |
| Float16 PTQ | 7 MB | 71,8% | 76 ms | 38 ms |
| INT8 PTQ Dynamic | 3,5 MB | 71,1% | 29 ms | 23 ms |
| INT8 PTQ Static | 3,5 MB | 70,9% | 27 ms | 18 ms |
| INT8 QAT | 3,5 MB | 71,6% | 27 ms | 18 ms |
| INT4 (GGML-style) | 1,8 MB | 69,5% | 22 ms | 15 ms |

---

## 11. Kompleksowy pipeline kompresji

```python
def full_compression_pipeline(keras_model, train_data, test_data,
                               output_path="model_final.tflite"):
    """
    Kompletny pipeline: QAT -> konwersja INT8 -> ewaluacja.
    """
    # 1. QAT fine-tuning
    qat_model = tfmot.quantization.keras.quantize_model(keras_model)
    qat_model.compile(
        optimizer=tf.keras.optimizers.Adam(1e-5),
        loss='sparse_categorical_crossentropy',
        metrics=['accuracy']
    )
    qat_model.fit(train_data, epochs=5,
                  callbacks=[tf.keras.callbacks.EarlyStopping(patience=2)])

    # 2. Konwersja do TFLite INT8
    converter = tf.lite.TFLiteConverter.from_keras_model(qat_model)
    converter.optimizations = [tf.lite.Optimize.DEFAULT]
    tflite_bytes = converter.convert()

    with open(output_path, "wb") as f:
        f.write(tflite_bytes)

    # 3. Ewaluacja
    x_test, y_test = test_data
    acc, lat = evaluate_tflite_model(output_path, x_test, y_test)
    return tflite_bytes, acc, lat
```

---

## 12. Dobre praktyki

1. **Zacznij od Float16** -- najmniej inwazyjne, zero degradacji na GPU delegates
2. **PTQ Static przed QAT** -- szybsze, czesto wystarczajace; QAT tylko gdy PTQ nieakceptowalne
3. **Representative dataset** -- dobierz starannie; obejmij edge cases i roznorodne warunki
4. **Per-channel > per-tensor** -- lepsza jakosc kosztem niewielkiego overhead
5. **Profiluj po kazdej optymalizacji** -- nie zakladaj, ze kwantyzacja zawsze przyspiesza
6. **Testuj na docelowym hardware** -- NNAPI/ANE ma rozne ograniczenia operatorow
7. **Monitoruj quality degradation** -- mierz accuracy drop, nie tylko rozmiar modelu

---

## Powiązane artykuły

- [Wprowadzenie do lokalnego AI na mobile](local-ai-intro.md)
- [Sieci neuronowe na urządzeniu mobilnym](neural-networks-mobile.md)
- [Wnioskowanie lokalne -- architektura i wydajność](on-device-inference.md)
- [Frameworki ML na mobile](mobile-ml-frameworks.md)
