# Przyszłość Edge AI — trendy i kierunki rozwoju

## Streszczenie

Artykuł omawia najważniejsze trendy kształtujące przyszłość lokalnej sztucznej inteligencji na urządzeniach mobilnych. Od gwałtownego wzrostu wydajności procesorów neuronowych (NPU), przez multimodalne modele działające w czasie rzeczywistym, aż po federacyjne uczenie maszynowe i generatywną AI na smartfonie — Edge AI przestaje być ciekawostką badawczą i staje się fundamentem nowoczesnych aplikacji mobilnych. Artykuł przedstawia praktyczne przykłady kodu, porównania sprzętowe oraz mapę drogową rozwoju technologii na lata 2025–2030, uwzględniając kontekst regulacyjny UE i kwestie zrównoważonego rozwoju.

**Słowa kluczowe:** Edge AI, NPU, on-device inference, Federated Learning, Gemini Nano, ONNX, multimodal AI, Green AI, EU AI Act, mobile AI roadmap

---

## 1. Ewolucja sprzętu — NPU jako silnik Edge AI

### 1.1 Historia i trajektoria wzrostu wydajności

Procesory neuronowe (Neural Processing Units, NPU) wbudowane w mobilne SoC (System-on-Chip) przeszły w ciągu zaledwie sześciu lat rewolucję ilościową i jakościową. Pierwszym masowym układem z dedykowanym NPU był Apple A11 Bionic (2017), który jednak nie był jeszcze w pełni programowalny przez deweloperów. Przełomem stał się **Apple A12 Bionic** (2018) z NPU 8-rdzeniowym o wydajności **5 TOPS** (Tera Operations Per Second).

| Układ | Rok | NPU (TOPS) | Platforma |
|---|---|---|---|
| Apple A12 Bionic | 2018 | 5 | iPhone XS/XR |
| Apple A13 Bionic | 2019 | 6 | iPhone 11 |
| Apple A14 Bionic | 2020 | 11 | iPhone 12 |
| Apple A15 Bionic | 2021 | 15,8 | iPhone 13 |
| Apple A16 Bionic | 2022 | 17 | iPhone 14 Pro |
| Apple A17 Pro | 2023 | 35 | iPhone 15 Pro |
| Apple A18 Pro | 2024 | 38+ | iPhone 16 Pro |
| Snapdragon 8 Gen 2 | 2022 | 4,35 (Hexagon) | Android flagships |
| Snapdragon 8 Gen 3 | 2023 | 73 | Android flagships 2024 |
| MediaTek Dimensity 9300 | 2023 | 35 | Mid-to-high Android |
| Google Tensor G4 | 2024 | ~50 (szac.) | Pixel 9 |

Wzrost ten oznacza, że w 2024 roku typowy flagowy smartfon dysponuje mocą obliczeniową NPU porównywalną z dedykowanymi akceleratorami AI sprzed kilku lat. Co istotniejsze, wzrost TOPS idzie w parze z poprawą efektywności energetycznej — nowe NPU wykonują więcej operacji na wat, co jest kluczowe dla urządzeń bateryjnych.

### 1.2 Architektura nowoczesnych NPU

Współczesne mobilne NPU to złożone jednostki wielopotokowe. Typowa architektura obejmuje:

- **MAC (Multiply-Accumulate) arrays** — masywnie równoległe tablice do mnożenia macierzy
- **Pamięć SRAM on-chip** — bufor minimalizujący transfer danych do RAM
- **Silnik kwantyzacji** — sprzętowe wsparcie dla INT8, INT4, a coraz częściej FP16
- **Kontroler DMA** — efektywny transfer modelu z pamięci masowej
- **Dedykowane ścieżki dla operacji transformerowych** — w najnowszych układach

Apple Neural Engine w A18 Pro dodał sprzętowe wsparcie dla mechanizmów **attention** (kluczowych dla modeli LLM), co pozwala na uruchamianie modeli klasy 3B parametrów w czasie rzeczywistym.

### 1.3 Perspektywy na 2025–2027

Analitycy branżowi przewidują, że do 2027 roku:

- Wydajność NPU w flagowych smartfonach przekroczy **100 TOPS**
- Procesory średniego segmentu (300–600 USD) osiągną poziom obecnych flagowców (35–50 TOPS)
- Pojawi się heterogeniczne obliczenia AI łączące NPU + GPU + CPU w dynamicznych potokach
- Dedykowane silniki do inferencji modeli LLM staną się standardem (nie tylko Apple)

---

## 2. Multimodalność na urządzeniu

### 2.1 Gemini Nano Multimodal — przełom 2024

**Gemini Nano** to rodzina małych modeli Google zaprojektowanych do działania bezpośrednio na urządzeniu. Wersja **Gemini Nano 2** (debiut z Pixel 9 Pro, 2024) jako pierwsza masowa implementacja obsługuje natywnie wiele modalności jednocześnie:

- 📝 **Tekst** — rozumienie i generowanie języka naturalnego
- 🖼️ **Obraz** — opis, analiza, OCR, pytania o zawartość obrazu
- 🎵 **Audio** — transkrypcja mowy, analiza dźwięku

Gemini Nano Multimodal działa przez **Android AICore** — systemową usługę AI dostępną od Androida 14 QPR1. Deweloperzy uzyskują dostęp przez **Google AI Edge SDK**:

```kotlin
// Przykład użycia Gemini Nano Multimodal przez Google AI Edge SDK
import com.google.ai.edge.aicore.GenerativeModel
import com.google.ai.edge.aicore.generationConfig
import android.graphics.Bitmap

class MultimodalAnalyzer(context: Context) {

    private val generativeModel = GenerativeModel(
        generationConfig = generationConfig {
            context = context
            temperature = 0.2f
            topK = 16
            maxOutputTokens = 256
        }
    )

    suspend fun analyzeImageWithQuestion(
        bitmap: Bitmap,
        question: String
    ): String {
        val inputContent = content {
            image(bitmap)
            text(question)
        }
        return generativeModel.generateContent(inputContent).text ?: ""
    }

    suspend fun describeScene(bitmap: Bitmap): String {
        return analyzeImageWithQuestion(
            bitmap,
            "Opisz szczegółowo co widzisz na tym obrazie po polsku."
        )
    }
}
```

### 2.2 Multimodalne modele open-source na mobile

Poza ekosystemem Google, rozwijają się alternatywne rozwiązania open-source:

| Model | Parametry | Modalności | Format mobilny |
|---|---|---|---|
| LLaVA-Phi-3-mini | 3,8B | tekst + obraz | GGUF / ONNX |
| MiniCPM-V 2.6 | 8B | tekst + obraz + wideo | GGUF |
| Qwen2-VL-2B | 2B | tekst + obraz | GGUF / MLX |
| SmolVLM | 2B | tekst + obraz | GGUF |
| Whisper Tiny/Base | 39M–74M | audio → tekst | Core ML / TFLite |

### 2.3 Wyzwania multimodalności na edge

Uruchamianie modeli multimodalnych lokalnie wiąże się z kilkoma wyzwaniami:

- **Rozmiar modelu** — enkodery obrazu (np. CLIP ViT-L/14) zajmują 300–600 MB niezależnie od LLM
- **Zarządzanie pamięcią** — jednoczesne ładowanie encodera wizyjnego i dekodera tekstowego może przekraczać 4 GB RAM
- **Buforowanie tokenów** — inferencja na sekwencjach multimodalnych wymaga efektywnego KV-cache
- **Czas do pierwszego tokenu (TTFT)** — przetwarzanie obrazu przed generacją tekstu dodaje 200–800 ms latencji

---

## 3. Federacyjne uczenie maszynowe

### 3.1 Koncepcja i motywacja

**Federated Learning (FL)** to paradygmat uczenia maszynowego, w którym model jest trenowany rozdzielnie na wielu urządzeniach klienckich bez centralnej wymiany danych surowych. Każde urządzenie:

1. Pobiera aktualny model globalny z serwera
2. Trenuje lokalnie na własnych danych
3. Wysyła wyłącznie **gradienty** (lub delty wag), nie dane
4. Serwer agreguje gradienty algorytmem **FedAvg** lub pochodnym
5. Zaktualizowany model globalny jest redystrybuowany

```
[Urządzenie A]──gradients──┐
[Urządzenie B]──gradients──┼──► [Serwer FL] ──FedAvg──► model globalny
[Urządzenie C]──gradients──┘
```

### 3.2 Google Federated Learning — implementacja praktyczna

Google stosuje FL w produkcji od 2017 roku (klawiatura Gboard). Framework **TensorFlow Federated (TFF)** oraz lżejszy **Google AI Edge Federated** umożliwiają implementację FL w aplikacjach mobilnych.

```python
# Strona serwera — definicja procesu FL z TensorFlow Federated
import tensorflow_federated as tff
import tensorflow as tf

# Definicja modelu Keras
def create_keras_model():
    return tf.keras.Sequential([
        tf.keras.layers.Dense(64, activation='relu', input_shape=(20,)),
        tf.keras.layers.Dropout(0.2),
        tf.keras.layers.Dense(32, activation='relu'),
        tf.keras.layers.Dense(1, activation='sigmoid')
    ])

def model_fn():
    keras_model = create_keras_model()
    return tff.learning.models.from_keras_model(
        keras_model,
        input_spec=element_spec,
        loss=tf.keras.losses.BinaryCrossentropy(),
        metrics=[tf.keras.metrics.BinaryAccuracy()]
    )

# Konfiguracja procesu FedAvg
fedavg_process = tff.learning.algorithms.build_weighted_fed_avg(
    model_fn=model_fn,
    client_optimizer_fn=lambda: tf.keras.optimizers.SGD(learning_rate=0.02),
    server_optimizer_fn=lambda: tf.keras.optimizers.SGD(learning_rate=1.0)
)

# Runda treningowa
state = fedavg_process.initialize()
for round_num in range(50):
    # sampled_clients — lista danych klientów dostępnych w tej rundzie
    result = fedavg_process.next(state, sampled_clients)
    state = result.state
    metrics = result.metrics
    print(f"Runda {round_num}: strata = {metrics['client_work']['train']['loss']:.4f}")
```

```kotlin
// Strona klienta Android — lokalne trenowanie z FL SDK
import org.tensorflow.lite.task.core.BaseOptions
import com.google.android.gms.tflite.client.TfLiteInitializationOptions

class FederatedLearningClient(private val context: Context) {

    // Lokalne dane treningowe użytkownika (np. preferencje, zachowania)
    private val localTrainingData: List<FloatArray> = loadUserBehaviorData()

    fun runLocalTrainingRound(globalModelBytes: ByteArray): ByteArray {
        // Załaduj globalny model
        val interpreter = org.tensorflow.lite.Interpreter(globalModelBytes)

        // Lokalne trenowanie przez N kroków
        val localSteps = 10
        var loss = 0f
        for (step in 0 until localSteps) {
            val batch = localTrainingData.random()
            // W uproszczeniu — rzeczywiste FL SDK obsługuje automatycznie
            loss += trainStep(interpreter, batch)
        }

        // Wyodrębnij zaktualizowane wagi (delta)
        return extractModelWeights(interpreter)
    }

    private fun loadUserBehaviorData(): List<FloatArray> {
        // Dane pozostają wyłącznie na urządzeniu
        return listOf() // placeholder
    }
}
```

### 3.3 Personalizacja bez utraty prywatności

FL sam w sobie nie gwarantuje pełnej prywatności — gradienty mogą ujawniać informacje o danych treningowych poprzez **gradient inversion attacks**. Dlatego nowoczesne systemy FL łączą kilka mechanizmów ochronnych:

- **Differential Privacy (DP)** — dodawanie szumu kalibrowanego do gradientów przed wysłaniem
- **Secure Aggregation** — kryptograficzne sumowanie gradientów bez wglądu serwera w indywidualne wartości
- **Compression** — kompresja gradientów redukująca zarówno transfer jak i ryzyko wycieku
- **Selective Updates** — wysyłanie tylko statystycznie znaczących zmian (sparsifikacja)

---

## 4. On-device fine-tuning

### 4.1 Czym jest lokalne dostrajanie modelu

**On-device fine-tuning** to technika pozwalająca na dalsze trenowanie (dostrajanie) modelu bazowego bezpośrednio na urządzeniu użytkownika, bez wysyłania danych na serwer. Różni się od FL tym, że zmiany modelu są lokalne i nie są agregowane z innymi urządzeniami.

Przypadki użycia:
- 🎨 Nauka stylu pisania konkretnego użytkownika (klawiatura predykcyjna)
- 🏷️ Personalizacja klasyfikatora bez etykiet serwera
- 🗣️ Adaptacja rozpoznawania mowy do akcentu/głosu
- 📧 Filtr spamu uczący się na wiadomościach konkretnego użytkownika

### 4.2 LoRA na urządzeniu — efektywne dostrajanie

**LoRA (Low-Rank Adaptation)** to najpopularniejsza technika efektywnego fine-tuningu, szczególnie przydatna na edge ze względu na minimalne wymagania pamięciowe. Zamiast aktualizować wszystkie wagi modelu, LoRA dodaje dwie małe macierze niskiego rzędu:

```
W' = W + ΔW = W + B·A
gdzie: A ∈ R^(r×d), B ∈ R^(d×r), r << d
```

```python
# Implementacja LoRA fine-tuning z biblioteką PEFT (mobile-friendly export)
from peft import LoraConfig, get_peft_model, TaskType
from transformers import AutoModelForSequenceClassification
import torch

# Konfiguracja LoRA — małe adaptery
lora_config = LoraConfig(
    task_type=TaskType.SEQ_CLS,
    r=4,                    # rząd macierzy (niski = mniej parametrów)
    lora_alpha=16,          # skalowanie
    lora_dropout=0.1,
    target_modules=["q_proj", "v_proj"]  # tylko warstwy attention
)

# Bazowy model (np. wcześniej skwantyzowany dla mobile)
base_model = AutoModelForSequenceClassification.from_pretrained(
    "distilbert-base-multilingual-cased",
    num_labels=2
)

# Model z adapterami LoRA — trenuje tylko ~0.5% parametrów
peft_model = get_peft_model(base_model, lora_config)
peft_model.print_trainable_parameters()
# Wynik: trainable params: 147,456 || all params: 66,511,874 (~0.22%)

# Eksport adapterów dla mobile runtime
peft_model.save_pretrained("./lora_adapters_mobile")
# Adaptery zajmują ~570 KB zamiast pełnego modelu ~250 MB
```

### 4.3 Ograniczenia i wyzwania

| Aspekt | Wyzwanie | Rozwiązanie |
|---|---|---|
| Pamięć podczas trenowania | Gradienty 3× rozmiar modelu | Gradient checkpointing, LoRA |
| Czas trenowania | 10–100× wolniejszy niż GPU | Krótkie sesje, trenowanie w tle |
| Catastrophic forgetting | Model traci wiedzę bazową | Rehearsal methods, EWC |
| Nadzór jakości | Brak weryfikacji serwera | Lokalne metryki jakości, rollback |
| Zużycie baterii | Trenowanie wyczerpuje baterię | Trenowanie tylko przy ładowaniu |

---

## 5. Generatywna AI na mobile

### 5.1 Stable Diffusion na smartfonie

Generowanie obrazów przez modele dyfuzji było jeszcze w 2022 roku niemożliwe lokalnie na mobile. Rok 2023–2024 przyniósł kilka przełomów:

- **Core ML Stable Diffusion** (Apple, 2022) — pierwsze działające SD 1.5 na iPhone 14 Pro (~30 s/obraz)
- **MLC LLM + SD** (2023) — generowanie z ~8 s/obraz na iPhone 15 Pro dzięki Metal GPU
- **SDXL-Turbo Mobile** (2024) — modele konsystencyjne generujące w 1–4 krokach, ~2–5 s/obraz
- **Stable Diffusion 3 Mobile** (2024) — zoptymalizowana wersja SD3 dla urządzeń z 6+ GB RAM

```swift
// Integracja Core ML Stable Diffusion na iOS
import StableDiffusion
import CoreML

class ImageGenerator {

    private var pipeline: StableDiffusionPipeline?

    func loadPipeline() async throws {
        let config = MLModelConfiguration()
        config.computeUnits = .cpuAndNeuralEngine  // Użyj NPU!

        let resourceURL = Bundle.main.resourceURL!
            .appendingPathComponent("CoreMLModels")

        pipeline = try StableDiffusionPipeline(
            resourcesAt: resourceURL,
            controlNet: [],
            configuration: config,
            disableSafety: false,
            reduceMemory: true  // Krytyczne dla iPhone < 8 GB RAM
        )
        try await Task.detached(priority: .userInitiated) {
            try self.pipeline?.loadResources()
        }.value
    }

    func generateImage(
        prompt: String,
        negativePrompt: String = "low quality, blurry",
        steps: Int = 20,
        guidanceScale: Float = 7.5,
        seed: UInt32 = UInt32.random(in: 0...UInt32.max)
    ) async throws -> CGImage? {

        var config = StableDiffusionPipeline.Configuration(prompt: prompt)
        config.negativePrompt = negativePrompt
        config.stepCount = steps
        config.guidanceScale = guidanceScale
        config.seed = seed
        config.useDenoisedIntermediates = true

        let images = try pipeline?.generateImages(configuration: config) { progress in
            print("Krok \(progress.step)/\(progress.stepCount)")
            return true  // Kontynuuj generowanie
        }
        return images?.first ?? nil
    }
}
```

### 5.2 Text-to-Speech i Voice Cloning na edge

Synteza mowy stała się możliwa lokalnie dzięki małym modelom jak **Kokoro-82M** (82M parametrów, jakość zbliżona do ElevenLabs) czy **Piper TTS** (dostępny przez Ollama). Klonowanie głosu z próbki poniżej 30 sekund oferują modele jak **XTTS-v2** działające na mobilnym GPU.

---

## 6. Standardy wymiany modeli AI

### 6.1 ONNX — lingua franca modeli AI

**ONNX (Open Neural Network Exchange)** to otwarty format wymiany modeli AI, tworzony przez Microsoft, Facebook i inne firmy. Pozwala na eksport modelu z jednego frameworka (PyTorch, TensorFlow) i uruchomienie go w dowolnym środowisku z ONNX Runtime.

```python
# Konwersja modelu PyTorch do ONNX z optymalizacją dla mobile
import torch
import torch.onnx

# Model PyTorch (np. klasyfikator sentymentu)
model = SentimentClassifier()
model.load_state_dict(torch.load("sentiment_model.pt"))
model.eval()

dummy_input = torch.randint(0, 30522, (1, 128))

# Eksport do ONNX
torch.onnx.export(
    model,
    dummy_input,
    "sentiment_model.onnx",
    input_names=["input_ids"],
    output_names=["logits"],
    dynamic_axes={"input_ids": {0: "batch_size", 1: "seq_len"}},
    opset_version=17
)

# Optymalizacja dla inferencji mobilnej
from onnxruntime.tools.optimizer import optimize_model
optimized_model = optimize_model(
    "sentiment_model.onnx",
    model_type="bert",
    num_heads=12,
    hidden_size=768
)
optimized_model.save_model_to_file("sentiment_model_optimized.onnx")

# Kwantyzacja INT8 dla NPU
from onnxruntime.quantization import quantize_dynamic, QuantType
quantize_dynamic(
    "sentiment_model_optimized.onnx",
    "sentiment_model_int8.onnx",
    weight_type=QuantType.QInt8
)
```

```kotlin
// Uruchomienie modelu ONNX na Androidzie
import ai.onnxruntime.OrtEnvironment
import ai.onnxruntime.OrtSession
import ai.onnxruntime.OnnxTensor

class OnnxInferenceEngine(context: Context) {

    private val env = OrtEnvironment.getEnvironment()
    private val session: OrtSession

    init {
        val modelBytes = context.assets.open("sentiment_model_int8.onnx")
            .readBytes()

        val sessionOptions = OrtSession.SessionOptions().apply {
            // Priorytet: NNAPI (Android NPU/GPU) → CPU
            addNnapi()
            setOptimizationLevel(OrtSession.SessionOptions.OptLevel.ALL_OPT)
            setIntraOpNumThreads(4)
        }
        session = env.createSession(modelBytes, sessionOptions)
    }

    fun classify(inputIds: LongArray): FloatArray {
        val inputTensor = OnnxTensor.createTensor(
            env,
            arrayOf(inputIds),  // batch_size=1
            longArrayOf(1, inputIds.size.toLong())
        )
        val output = session.run(mapOf("input_ids" to inputTensor))
        return (output[0].value as Array<FloatArray>)[0]
    }
}
```

### 6.2 Inne formaty i ich ekosystem

| Format | Twórca | Zastosowanie | Mobile runtime |
|---|---|---|---|
| ONNX | Microsoft / Facebook | Universalny | ONNX Runtime Mobile |
| Core ML (.mlpackage) | Apple | iOS / macOS | Native Core ML |
| TFLite (.tflite) | Google | Android / iOS | TFLite / LiteRT |
| GGUF | llama.cpp community | Modele LLM | llama.cpp, Ollama |
| ExecuTorch (.pte) | Meta | PyTorch Mobile | ExecuTorch runtime |
| AI Model Format | Samsung | Galaxy AI | Samsung NPU SDK |
| MLX | Apple | Apple Silicon (macOS/iOS) | MLX framework |

### 6.3 Samsung AI Model Format

Samsung wprowadził własny format optymalizowany pod kątem układów **Exynos** z dedykowanym NPU. Format ten pozwala na bezpośrednią kompilację modelu ONNX lub TFLite do binarnego formatu zoptymalizowanego dla konkretnego SoC, eliminując narzut kompilacji JIT w runtime.

---

## 7. Ekosystem open-source na mobile

### 7.1 Hugging Face Hub na mobile

**Hugging Face Hub** stał się de facto centralnym repozytorium modeli AI. W 2024 roku ekosystem rozszerzył się o narzędzia specyficzne dla mobile:

- **`huggingface_hub` CLI** do pobierania skwantyzowanych modeli w GGUF/ONNX
- **Spaces** hostujące demo modeli z eksportem do formatów mobilnych
- Filtrowanie modeli po tagu `mobile`, `edge`, `quantized` — tysiące gotowych modeli
- Integracja z **llama.cpp** dla szybkiego testowania modeli na desktop przed deploymentem mobile

```bash
# Pobieranie skwantyzowanego modelu dla mobile z Hugging Face
pip install huggingface_hub

# Model LLM w formacie GGUF (Q4_K_M — dobry kompromis jakość/rozmiar)
huggingface-cli download \
  bartowski/Llama-3.2-3B-Instruct-GGUF \
  Llama-3.2-3B-Instruct-Q4_K_M.gguf \
  --local-dir ./models

# Sprawdzenie rozmiaru i metadanych
ls -lh ./models/*.gguf
# -rw-r--r-- 1 user group 2.0G Llama-3.2-3B-Instruct-Q4_K_M.gguf

# Test lokalny z llama.cpp przed deploymentem na mobile
./llama-cli -m ./models/Llama-3.2-3B-Instruct-Q4_K_M.gguf \
  -p "Wyjaśnij czym jest Edge AI w 2 zdaniach:" \
  -n 100 --temp 0.7
```

### 7.2 Ollama na iOS i macOS

**Ollama** to narzędzie umożliwiające uruchamianie modeli LLM lokalnie z interfejsem API zgodnym z OpenAI. Na macOS działa natywnie z Metal GPU / ANE od wersji 0.1.x. Na iOS dostępne jest przez **Enchanted** (open-source iOS frontend) i **OllamaKit**:

```swift
// Integracja z Ollama API z poziomu aplikacji iOS (OllamaKit)
import OllamaKit

class LocalLLMService {

    private let ollamaKit = OllamaKit(baseURL: URL(string: "http://localhost:11434")!)

    // Sprawdzenie dostępnych modeli
    func listModels() async throws -> [OKModelResponse.Model] {
        let response = try await ollamaKit.models()
        return response.models
    }

    // Strumieniowanie odpowiedzi modelu
    func chat(
        model: String = "llama3.2:3b",
        message: String
    ) -> AsyncThrowingStream<String, Error> {

        let request = OKChatRequestData(
            model: model,
            messages: [OKMessage(role: .user, content: message)]
        )

        return AsyncThrowingStream { continuation in
            Task {
                for try await chunk in ollamaKit.chat(data: request) {
                    if let content = chunk.message?.content {
                        continuation.yield(content)
                    }
                    if chunk.done == true { continuation.finish() }
                }
            }
        }
    }
}
```

### 7.3 Inne projekty open-source kształtujące ekosystem

- **MLC LLM** — kompiluje modele LLM do WebGPU, Metal, CUDA, OpenCL; działa na iOS przez Metal
- **llama.cpp** — C++ runtime dla modeli GGUF; backend dla większości lokalnych aplikacji LLM
- **whisper.cpp** — wydajna implementacja Whisper ASR na CPU/GPU/NPU
- **ExecuTorch** (Meta) — lekki runtime PyTorch dla wbudowanych i mobilnych urządzeń
- **ONNX Runtime Mobile** — okrojona wersja ORT zoptymalizowana pod minimalne zużycie pamięci

---

## 8. Edge Mesh — poza chmurą i poza pojedynczym urządzeniem

### 8.1 Koncepcja edge mesh

**Edge mesh** (siatka urządzeń brzegowych) to architektura, w której wnioskowanie i uczenie AI jest rozproszone między wiele urządzeń w pobliżu fizycznym lub sieciowym — bez udziału centralnej chmury.

```
[iPhone A] <──────── BLE/WiFi Direct ────────> [iPad B]
     ^                                               ^
     |                WiFi P2P                       |
     v                                               v
[MacBook C] <──── Local Network (mDNS) ────> [AppleTV D]
     |
     └── (opcjonalnie) ──> [Edge Server w LAN]
```

Scenariusze użycia:
- **Collaborative inference** — duży model jest podzielony między kilka urządzeń (pipeline parallelism)
- **Ensemble on edge** — wiele urządzeń klasyfikuje równolegle, wyniki są agregowane
- **Specjalizacja zadań** — jedno urządzenie przetwarza audio, inne obraz, wyniki są łączone
- **Edge caching** — popularne odpowiedzi modelu są cachowane lokalnie w sieci

### 8.2 Technologie wspierające edge mesh

| Technologia | Rola | Przykłady |
|---|---|---|
| WiFi Direct / P2P | Transport niskolatencyjny | Android WiFi Aware, iOS MultipeerConnectivity |
| mDNS / Bonjour | Odkrywanie usług w LAN | Apple Bonjour, Avahi |
| WebRTC Data Channels | Peer-to-peer transfer | w przeglądarkach i aplikacjach natywnych |
| Matter / Thread | IoT + AI na edge | Smart home AI processing |
| 5G D2D (Device-to-Device) | Komunikacja bez stacji bazowej | Standardy 3GPP Rel-17+ |

---

## 9. Green AI — zrównoważony rozwój Edge AI

### 9.1 Ślad energetyczny AI mobilnej

Paradoksalnie, przeniesienie AI z chmury na urządzenie może być zarówno **bardziej** jak i **mniej** energochłonne — zależnie od kontekstu:

| Scenariusz | Zużycie energii | Emisja CO2 |
|---|---|---|
| Zapytanie do GPT-4 (API) | ~0,002–0,01 kWh/zapytanie (serwer) | ~1–5 g CO2 |
| Inferencja LLM 3B na iPhone 15 Pro | ~0,0001–0,0003 kWh/zapytanie | ~0,05–0,15 g CO2 |
| Trening lokalny FL (10 min) | ~0,005–0,02 kWh | ~2–10 g CO2 |
| Stały nasłuch wake-word (24h) | ~0,01–0,05 kWh | ~5–25 g CO2 |

**Wniosek:** Edge AI jest zazwyczaj bardziej efektywne energetycznie dla częstych krótkich zapytań, ale mniej efektywne przy rzadkich złożonych zadaniach ze względu na brak ekonomii skali serwerów opartych na odnawialnych źródłach.

### 9.2 Techniki Green AI na mobile

- **Adaptacyjna jakość modelu** — niższa jakość gdy bateria < 20%, wyższa przy ładowaniu
- **Przetwarzanie wsadowe** — grupowanie wielu zapytań AI zamiast osobnych inferencji
- **Early exit** — zatrzymanie inferencji przy wystarczającej pewności predykcji
- **Model pruning** — zmniejszenie modelu przez usunięcie nieaktywnych neuronów
- **Harmonogram obciążeń AI** — odkładanie intensywnych zadań na czas ładowania z sieci

```kotlin
// Adaptacyjne wybieranie jakości modelu zależnie od stanu urządzenia
class AdaptiveAIQualityManager(private val context: Context) {

    private val batteryManager = context.getSystemService(BatteryManager::class.java)
    private val powerManager = context.getSystemService(PowerManager::class.java)

    enum class ModelTier { LITE, STANDARD, FULL }

    fun selectModelTier(): ModelTier {
        val batteryLevel = batteryManager.getIntProperty(
            BatteryManager.BATTERY_PROPERTY_CAPACITY
        )
        val isCharging = batteryManager.isCharging
        val isPowerSaveMode = powerManager.isPowerSaveMode

        return when {
            isPowerSaveMode || batteryLevel < 15 -> ModelTier.LITE
            isCharging || batteryLevel > 60 -> ModelTier.FULL
            else -> ModelTier.STANDARD
        }
    }

    fun getModelPath(tier: ModelTier): String = when (tier) {
        ModelTier.LITE -> "models/classifier_int4_lite.onnx"      // ~50 MB
        ModelTier.STANDARD -> "models/classifier_int8.onnx"       // ~150 MB
        ModelTier.FULL -> "models/classifier_fp16_full.onnx"      // ~400 MB
    }
}
```

---

## 10. EU AI Act a aplikacje mobilne z Edge AI

### 10.1 Struktura regulacji

**AI Act** (Rozporządzenie UE 2024/1689, weszło w życie 1 sierpnia 2024) klasyfikuje systemy AI według ryzyka:

| Kategoria ryzyka | Przykłady mobile AI | Wymagania |
|---|---|---|
| **Zakazane** | Biometryczny scoring społeczny, manipulacja podprogowa | Bezwzględny zakaz |
| **Wysokie ryzyko** | AI w rekrutacji, ocena kredytowa, diagnoza medyczna | Rejestracja, audyt, dokumentacja techniczna |
| **Ograniczone ryzyko** | Chatboty, deepfake | Obowiązek informowania użytkownika |
| **Minimalne ryzyko** | Filtry spamu, rekomendacje treści, OCR | Brak specjalnych wymagań |

### 10.2 Obowiązki deweloperów aplikacji mobilnych

Większość aplikacji mobilnych z AI należy do kategorii **minimalnego lub ograniczonego ryzyka**, niemniej AI Act wprowadza wymagania dotyczące:

- **Przejrzystości** — użytkownik musi wiedzieć, że rozmawia z AI (chatbot, agent)
- **Oznaczania treści generowanych** — deepfake audio/wideo wymaga wyraźnego oznaczenia
- **Modele ogólnego przeznaczenia (GPAI)** — modele powyżej 10^25 FLOPs treningowych podlegają dodatkowym obowiązkom (nie dotyczy modeli edge, które są znacznie mniejsze)
- **Open-source** — modele open-source mają ograniczone zwolnienia z obowiązków GPAI

### 10.3 Harmonogram wdrożenia AI Act

| Data | Wydarzenie |
|---|---|
| 01.08.2024 | Wejście w życie AI Act |
| 02.02.2025 | Zakaz praktyk zakazanych (Art. 5) zaczyna obowiązywać |
| 02.08.2025 | Przepisy dot. GPAI i governance (Art. 52, 53) |
| 02.08.2026 | Pełne wdrożenie — systemy wysokiego ryzyka |
| 02.08.2027 | Przepisy dot. systemów wbudowanych w produkty regulowane |

### 10.4 Praktyczna checklista compliance dla Edge AI app

```
✅ Oznaczenie interfejsów AI (chatbot, asystent głosowy)
✅ Polityka prywatności opisująca przetwarzanie AI on-device
✅ Dokumentacja techniczna modelu (karta modelu)
✅ Weryfikacja, czy aplikacja należy do wysokiego ryzyka (Art. 6)
✅ Mechanizm opt-out z personalizacji AI
✅ Oznaczanie treści generowanych przez AI (deepfake, synteza mowy)
```

---

## 11. Mapa drogowa 2025–2030

### 11.1 Prognozowane kamienie milowe

| Rok | Sprzęt (NPU TOPS) | Możliwości modeli | Przełomowe funkcje |
|---|---|---|---|
| **2025** | 50–80 TOPS (flagowe) | LLM 7B on-device, SD 3 Mobile | Realtime translation offline, multimodal assistants |
| **2026** | 80–120 TOPS | LLM 13B quantized, real-time video AI | On-device video generation, personalized AI agents |
| **2027** | 120–200 TOPS | LLM 30B quantized w flagowcach | Autonomiczne AI agenty bez chmury |
| **2028** | 200+ TOPS | LLM 70B skwantyzowany (INT2/INT3) | Pełny asystent osobisty AI offline |
| **2029–2030** | 500+ TOPS (szacunki) | Modele multimodalne klasy GPT-4V lokalnie | Edge AGI assistant, edge mesh AI |

### 11.2 Kluczowe technologie przyszłości

**Compute-in-Memory (CIM):** Przetwarzanie bezpośrednio w komórkach pamięci eliminuje wąskie gardło transferu danych model-RAM. Prototypy pokazują 10–100× wzrost efektywności energetycznej.

**Neuromorphic computing:** Układy inspirowane biologicznym mózgiem (Intel Loihi, IBM NorthPole) mogą radykalnie zmienić efektywność inferencji ciągłej.

**Photonic AI chips:** Układy fotoniki krzemowej do mnożenia macierzy z prędkością światła — pierwsze implementacje mobilne możliwe po 2028.

**On-device RLHF:** Uczenie ze wzmocnieniem z ludzkiej informacji zwrotnej bezpośrednio na urządzeniu — model dostosowuje się do preferencji użytkownika bez serwera.

### 11.3 Scenariusz 2030 — wizja

> W 2030 roku przeciętny smartfon dysponuje NPU o wydajności 500+ TOPS i 16 GB dedykowanej pamięci LPDDR6. Na urządzeniu działa stały asystent osobisty oparty na modelu ~30B parametrów (skwantyzowanym do INT2), znający pełną historię, preferencje i kontekst użytkownika. Asystent rozumie obraz z kamery, dźwięk otoczenia i ekran w czasie rzeczywistym. Federacyjne uczenie pozwala na ciągłą personalizację bez wysyłania danych. Sieć edge mesh urządzeń w domu umożliwia uruchamianie modeli zbyt dużych dla jednego telefonu przez rozproszenie obliczeń między smartfonem, tabletem i telewizorem.

---

## Podsumowanie

Edge AI na urządzeniach mobilnych przeszło drogę od prostych klasyfikatorów działających na zasadzie ciekawostki do fundamentalnej warstwy współczesnych aplikacji. Trajektoria NPU sugeruje, że do 2027–2028 roku na urządzeniu będzie możliwe uruchomienie modeli, które dziś wymagają centrum danych. Federacyjne uczenie rozwiąże napięcie między personalizacją a prywatnością, a standardy jak ONNX i GGUF zapewnią przenośność modeli między ekosystemami. Regulacje EU AI Act wprowadzą ramy prawne, które przy umiejętnej implementacji mogą stać się przewagą konkurencyjną aplikacji stawiających na lokalne, prywatne przetwarzanie.

---

## Powiązane artykuły

- [Wprowadzenie do lokalnej AI na urządzeniu mobilnym](local-ai-intro.md)
- [Kwantyzacja i optymalizacja modeli AI](model-quantization.md)
- [Frameworki ML na urządzeniu: TFLite, Core ML, ONNX](mobile-ml-frameworks.md)
- [Modele językowe LLM na urządzeniu](llm-on-device.md)
- [Wnioskowanie lokalne — architektura i wydajność](on-device-inference.md)
- [Prywatność i bezpieczeństwo w lokalnej AI](ai-privacy-security.md)
- [Prawne aspekty AI na urządzeniach mobilnych](ai-legal-aspects.md)
