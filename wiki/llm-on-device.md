# Modele językowe LLM na urządzeniu mobilnym

## Streszczenie

Artykuł omawia wdrażanie dużych i małych modeli językowych (LLM / sLLM) bezpośrednio na smartfonie bez połączenia z serwerem. Opisano popularne modele (Gemma 2, Llama 3.2, Phi-3 Mini, Mistral), formaty modeli (GGUF, ExecuTorch, MediaPipe), narzędzia (llama.cpp, MLC LLM, MediaPipe LLM Inference API), zarządzanie KV cache oraz implementację token streaming w Kotlin i Swift.

**Słowa kluczowe:** sLLM, on-device LLM, llama.cpp, MLC LLM, MediaPipe, GGUF, ExecuTorch, Gemma, Llama, Phi-3, KV cache, token streaming, quantization, NDK, JNI, Apple Intelligence

---

## 1. Czym są sLLM i dlaczego on-device?

**sLLM** (Small Language Model) to modele językowe z liczbą parametrów poniżej 10B, zdolne do działania na urządzeniu mobilnym lub edge device. W odróżnieniu od tradycyjnych LLM (GPT-4, Claude, Gemini Ultra), sLLM oferują:

| Cecha | Cloud LLM | On-device sLLM |
|---|---|---|
| Prywatność | Dane wysyłane na serwer | Dane pozostają na urządzeniu |
| Offline | Wymaga internetu | Działa bez połączenia |
| Latency | 200–2000 ms (sieć) | 50–500 ms (inference) |
| Koszt | Opłata za API (per token) | Jednorazowy koszt wdrożenia |
| Możliwości | Bardzo duże | Ograniczone (kontekst, reasoning) |

### 1.1 Kiedy używać on-device LLM?

- **Aplikacje zdrowotne** — dane medyczne nie mogą opuszczać urządzenia
- **Asystenci offline** — działanie w trybie samolotowym
- **Personalizacja** — model adaptuje się do użytkownika bez wysyłania historii
- **Redukcja kosztów** — brak płatności za API przy intensywnym użyciu

---

## 2. Przegląd popularnych modeli sLLM

### 2.1 Gemma 2 (Google DeepMind, 2024)

- **Gemma 2 2B**: 2,6B params — optymalny dla mobile, ~1,5 GB (INT4)
- **Gemma 2 9B**: 9B params — wymaga flagowego urządzenia lub desktop
- Trenowany z distillacją od większych modeli Gemma
- Natywna obsługa przez MediaPipe LLM Inference API
- Licencja: Google Gemma Terms of Use (bezpłatna do komercyjnych zastosowań)

### 2.2 Llama 3.2 (Meta AI, 2024)

- **Llama 3.2 1B**: 1B params — bardzo szybki, ~700 MB (INT4)
- **Llama 3.2 3B**: 3B params — dobry balans jakości i szybkości, ~2 GB (INT4)
- Obsługuje: tekst, reasoning, summarization
- Dostępny przez ExecuTorch (Meta) i llama.cpp
- Licencja: Llama 3.2 Community License (bezpłatna przy <700M MAU)

### 2.3 Phi-3 Mini (Microsoft, 2024)

- **Phi-3 Mini 3.8B** (128K context): 3,8B params — wyjątkowe reasoning na małą skalę
- Trenowany na starannie wyselekcjonowanych danych (synthetic + web)
- Dostępny w formacie GGUF i ONNX Runtime
- Wersja 4K i 128K context window

### 2.4 Mistral 7B

- 7B params — wymaga mocnego urządzenia lub desktop GPU
- Sliding window attention (SWA) dla efektywnego context handling
- Dostępny w formatach GGUF (llama.cpp), Ollama
- Mistral-7B-Instruct-v0.3 — wersja do konwersacji

### 2.5 Falcon RW

- Falcon RW 1B — bardzo mały, przeznaczony do edge
- Trenowany na RefinedWeb dataset
- Ograniczone możliwości dialogowe

| Model | Params | INT4 RAM | Jakość (MT-Bench) | Kontekst |
|---|---|---|---|---|
| Llama 3.2 1B | 1B | ~700 MB | 5.5 | 128K |
| Phi-3 Mini | 3.8B | ~2.2 GB | 8.0 | 128K |
| Llama 3.2 3B | 3B | ~1.8 GB | 7.2 | 128K |
| Gemma 2 2B | 2.6B | ~1.5 GB | 7.0 | 8K |
| Mistral 7B | 7B | ~4.1 GB | 8.3 | 32K |

---

## 3. Formaty modeli na mobile

### 3.1 GGUF (GPT-Generated Unified Format)

Format stworzony przez projekt llama.cpp:
- Samodzielny plik zawierający wagi + metadata + tokenizer
- Obsługa wielu poziomów kwantyzacji: Q4_K_M, Q5_K_M, Q8_0, F16
- Powszechny ekosystem — tysiące modeli na Hugging Face
- Efektywne ładowanie przez mmap (memory-mapped files)

Nazewnictwo kwantyzacji GGUF:
```
Q4_K_M — 4-bit, K-quants, Medium (zalecany dla mobile)
Q5_K_M — 5-bit, K-quants, Medium (wyższa jakość, więcej RAM)
Q8_0   — 8-bit, szybki na GPU, większy rozmiar
```

### 3.2 ExecuTorch (.pte)

Format Meta dla on-device inference:
- Kompilacja modelu do efektywnego formatu dla konkretnego backendu
- Obsługuje: Qualcomm QNN, Apple Core ML, Vulkan, XNNPACK
- Tight integration z PyTorch (model → ONNX → ExecuTorch)
- Oficjalnie wspierany przez Meta dla Llama na mobile

### 3.3 MediaPipe Task Bundle

Format Google dla MediaPipe LLM Inference API:
- `.task` file zawiera model + configuration
- Optymalizowany dla GPU shader execution
- Bezpośrednia integracja z MediaPipe Tasks SDK

---

## 4. llama.cpp — architektura i Android

### 4.1 Czym jest llama.cpp?

llama.cpp to implementacja inference dla modeli Llama (i wielu innych) w czystym C/C++:
- Zero zewnętrznych zależności (tylko BLAS opcjonalnie)
- Wsparcie dla: CPU (AVX2/NEON), CUDA, Metal, OpenCL, Vulkan
- Efektywna kwantyzacja GGUF
- Aktywnie rozwijany przez społeczność open-source

### 4.2 Budowanie dla Android z NDK

```bash
# Sklonuj repozytorium
git clone https://github.com/ggerganov/llama.cpp
cd llama.cpp

# Skonfiguruj zmienne NDK
export ANDROID_NDK=/path/to/ndk
export TOOLCHAIN=$ANDROID_NDK/toolchains/llvm/prebuilt/linux-x86_64

# Budowanie biblioteki .so dla arm64-v8a
mkdir build-android && cd build-android
cmake .. \
  -DCMAKE_TOOLCHAIN_FILE=$ANDROID_NDK/build/cmake/android.toolchain.cmake \
  -DANDROID_ABI=arm64-v8a \
  -DANDROID_PLATFORM=android-28 \
  -DCMAKE_BUILD_TYPE=Release \
  -DLLAMA_BUILD_TESTS=OFF \
  -DLLAMA_BUILD_EXAMPLES=OFF \
  -DLLAMA_ANDROID_ENABLE_QCOM_BACKEND=OFF

make -j$(nproc)
# Wynik: libllama.so, libggml.so
```

### 4.3 Kotlin JNI wrapper dla llama.cpp

```kotlin
// LlamaContext.kt
class LlamaContext private constructor(private val ptr: Long) {

    companion object {
        init {
            System.loadLibrary("llama")
            System.loadLibrary("llamajni")
        }

        fun create(modelPath: String, nCtx: Int = 2048): LlamaContext {
            val ptr = nativeCreate(modelPath, nCtx)
            if (ptr == 0L) throw RuntimeException("Nie udało się załadować modelu: $modelPath")
            return LlamaContext(ptr)
        }

        @JvmStatic private external fun nativeCreate(path: String, nCtx: Int): Long
    }

    external fun nativeTokenize(text: String): IntArray
    external fun nativeGenerate(
        tokens: IntArray,
        maxNewTokens: Int,
        temperature: Float,
        topP: Float,
        callback: TokenCallback
    ): String

    fun interface TokenCallback {
        fun onToken(token: String): Boolean  // zwróć false aby zatrzymać
    }

    external fun nativeFree()

    fun close() = nativeFree()
}

// Użycie w ViewModel z Kotlin Flow
class LlamaViewModel(application: Application) : AndroidViewModel(application) {

    private val llamaCtx by lazy {
        val modelFile = File(application.filesDir, "llama-3.2-1b-q4.gguf")
        LlamaContext.create(modelFile.absolutePath, nCtx = 2048)
    }

    fun generateText(prompt: String): Flow<String> = flow {
        val tokens = llamaCtx.nativeTokenize(prompt)
        llamaCtx.nativeGenerate(
            tokens = tokens,
            maxNewTokens = 256,
            temperature = 0.7f,
            topP = 0.9f,
            callback = { token ->
                // Callback wywoływany dla każdego wygenerowanego tokena
                trySend(token)
                true  // kontynuuj generowanie
            }
        )
    }.flowOn(Dispatchers.Default)

    override fun onCleared() {
        super.onCleared()
        llamaCtx.close()
    }
}
```

---

## 5. MLC LLM — kompilacja dla mobilnych GPU

### 5.1 Czym jest MLC LLM?

MLC LLM (Machine Learning Compilation for LLM) to framework oparty na Apache TVM:
- Kompiluje model do optymalnego kodu dla konkretnego GPU/NPU
- Automatyczna optymalizacja: operator fusion, memory planning, GPU shader generation
- Obsługuje: Android OpenCL/Vulkan, iOS Metal, CUDA, WebGPU
- Modele dostępne jako pre-compiled packages

### 5.2 Kompilacja modelu

```python
# Kompilacja Llama 3.2 1B dla Android z MLC LLM
import mlc_llm
from mlc_llm.compiler import compile_model

# Konfiguracja dla Android (OpenCL)
compile_model(
    model="meta-llama/Llama-3.2-1B-Instruct",
    quantization="q4f16_1",  # 4-bit weights, float16 activations
    target="android",        # kompilacja dla Vulkan/OpenCL
    output_dir="./mlc-llama-android"
)
```

### 5.3 Android integration (Kotlin)

```kotlin
// build.gradle.kts
dependencies {
    implementation("ai.mlc:mlc-llm-android:0.1.0")
}

// MainActivity.kt
import ai.mlc.mlcllm.MLCEngine

class MainActivity : AppCompatActivity() {

    private lateinit var engine: MLCEngine

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)

        engine = MLCEngine()

        lifecycleScope.launch {
            // Załaduj model (pierwszy raz pobiera z HuggingFace)
            engine.reload(modelPath = filesDir.path + "/mlc-llama")

            streamGenerate("Wyjaśnij kwantyzację modeli AI.")
        }
    }

    private fun streamGenerate(prompt: String) {
        lifecycleScope.launch(Dispatchers.Default) {
            val request = buildChatRequest(prompt)
            engine.chat.completions.create(request).collect { chunk ->
                val token = chunk.choices.firstOrNull()?.delta?.content ?: ""
                withContext(Dispatchers.Main) {
                    appendToOutput(token)
                }
            }
        }
    }
}
```

---

## 6. MediaPipe LLM Inference API

### 6.1 Gemma na Android z MediaPipe

```kotlin
// build.gradle.kts
dependencies {
    implementation("com.google.mediapipe:tasks-genai:0.10.14")
}

// GemmaInference.kt
import com.google.mediapipe.tasks.genai.llminference.LlmInference
import com.google.mediapipe.tasks.genai.llminference.LlmInference.LlmInferenceOptions

class GemmaInference(private val context: Context) {

    private val inference: LlmInference

    init {
        val options = LlmInferenceOptions.builder()
            .setModelPath(context.filesDir.path + "/gemma-2-2b-it-gpu-int4.bin")
            .setMaxTokens(512)
            .setTopK(40)
            .setTemperature(0.8f)
            .setRandomSeed(42)
            .build()
        inference = LlmInference.createFromOptions(context, options)
    }

    fun generateAsync(
        prompt: String,
        onToken: (String, Boolean) -> Unit
    ) {
        inference.generateResponseAsync(
            prompt,
            object : LlmInference.LlmInferenceResultListener {
                override fun onResult(partialResult: String, done: Boolean) {
                    onToken(partialResult, done)
                }
                override fun onError(error: RuntimeException) {
                    Log.e("Gemma", "Błąd generowania", error)
                }
            }
        )
    }

    fun close() = inference.close()
}
```

---

## 7. Apple Intelligence i on-device LLM w iOS 18+

iOS 18 wprowadza Apple Intelligence — framework on-device AI:
- Modele uruchamiane na Apple Neural Engine (ANE)
- 3B parametrów on-device + większe modele w Private Cloud Compute
- API dostępne przez Foundation Models framework (iOS 18.1+)

```swift
// Swift: Apple Intelligence Foundation Models API (iOS 18.1+)
import FoundationModels

@available(iOS 18.1, *)
class AppleIntelligenceDemo {

    func summarizeText(_ text: String) async throws -> String {
        let session = LanguageModelSession()

        let prompt = Prompt("Streść poniższy tekst po polsku:\n\(text)")
        let response = try await session.respond(to: prompt)
        return response.content
    }

    func streamResponse(for prompt: String) -> AsyncStream<String> {
        AsyncStream { continuation in
            Task {
                let session = LanguageModelSession()
                let modelPrompt = Prompt(prompt)

                do {
                    for try await partial in session.streamResponse(to: modelPrompt) {
                        continuation.yield(partial.content)
                    }
                    continuation.finish()
                } catch {
                    continuation.finish()
                }
            }
        }
    }
}
```

---

## 8. KV Cache i zarządzanie kontekstem

### 8.1 Czym jest KV Cache?

Podczas inference transformer musi obliczać Key i Value tensory dla każdego tokena. KV Cache przechowuje te obliczenia aby uniknąć rekomputacji:

```
Dla modelu o n warstwach, długości sekwencji L, wymiarze głowicy d_head:
Rozmiar KV Cache = 2 × n × L × d_head × dtype_bytes

Przykład: Llama 3.2 1B (n=16, L=2048, d_head=64, float16):
KV Cache = 2 × 16 × 2048 × 64 × 2B = 512 MB
```

### 8.2 Strategie zarządzania kontekstem na mobile

**Sliding window context**: zachowuj tylko ostatnie N tokenów:

```kotlin
class ContextManager(private val maxTokens: Int = 2048) {
    private val tokenBuffer = ArrayDeque<Int>()

    fun addTokens(newTokens: IntArray): IntArray {
        newTokens.forEach { tokenBuffer.addLast(it) }

        // Truncation: zachowaj system prompt + najnowsze tokeny
        while (tokenBuffer.size > maxTokens) {
            tokenBuffer.removeFirst()
        }

        return tokenBuffer.toIntArray()
    }

    fun reset() = tokenBuffer.clear()
    fun currentSize() = tokenBuffer.size
}
```

---

## 9. Token Streaming do UI

### 9.1 Kotlin Flow ze streaming

```kotlin
// ViewModel z StateFlow dla streaming UI
class ChatViewModel : ViewModel() {

    private val _chatState = MutableStateFlow(ChatState())
    val chatState: StateFlow<ChatState> = _chatState.asStateFlow()

    fun sendMessage(userMessage: String) {
        viewModelScope.launch {
            // Dodaj wiadomość użytkownika
            _chatState.update { it.copy(
                messages = it.messages + ChatMessage(userMessage, Role.USER),
                isGenerating = true,
                currentResponse = ""
            )}

            // Streamuj odpowiedź tokena po tokenie
            llamaViewModel.generateText(userMessage)
                .onEach { token ->
                    _chatState.update { state ->
                        state.copy(currentResponse = state.currentResponse + token)
                    }
                }
                .onCompletion {
                    _chatState.update { state ->
                        state.copy(
                            messages = state.messages + ChatMessage(
                                state.currentResponse, Role.ASSISTANT
                            ),
                            isGenerating = false,
                            currentResponse = ""
                        )
                    }
                }
                .collect()
        }
    }
}

data class ChatState(
    val messages: List<ChatMessage> = emptyList(),
    val isGenerating: Boolean = false,
    val currentResponse: String = ""
)
```

### 9.2 Swift AsyncStream dla iOS

```swift
import Foundation

class LLMStreamingService {

    func generateStream(prompt: String) -> AsyncStream<String> {
        AsyncStream { continuation in
            Task(priority: .userInitiated) {
                guard let modelURL = Bundle.main.url(
                    forResource: "llama-3.2-1b-q4",
                    withExtension: "gguf"
                ) else {
                    continuation.finish()
                    return
                }

                // llama.cpp Swift binding (przykład)
                let ctx = LlamaContext(modelPath: modelURL.path)
                let tokens = ctx.tokenize(text: prompt)

                ctx.generateStream(tokens: tokens, maxTokens: 512) { token, done in
                    if let token = token {
                        continuation.yield(token)
                    }
                    if done {
                        continuation.finish()
                    }
                }
            }
        }
    }
}

// SwiftUI View z async streaming
struct ChatView: View {
    @State private var response = ""
    @State private var isGenerating = false
    private let service = LLMStreamingService()

    var body: some View {
        VStack {
            ScrollView {
                Text(response)
                    .padding()
            }
            if isGenerating {
                ProgressView("Generowanie...")
            }
        }
        .task {
            await runGeneration()
        }
    }

    func runGeneration() async {
        isGenerating = true
        response = ""
        for await token in service.generateStream(prompt: "Czym jest kwantyzacja?") {
            response += token
        }
        isGenerating = false
    }
}
```

---

## 10. Analiza pamięci — footprint modelu

### 10.1 Rozmiar modelu w pamięci RAM

```
Rozmiar_RAM = Params × bytes_per_param + KV_Cache + Activations + Overhead

Llama 3.2 1B, INT4 (4-bit):
- Wagi: 1B × 0.5B = 500 MB
- KV Cache (2048 ctx): ~512 MB
- Activations: ~50 MB
- Overhead (framework): ~100 MB
RAZEM: ~1.16 GB
```

### 10.2 Szacowanie dostępności na urządzeniu

| Urządzenie | RAM | Wolna RAM | Maks. model |
|---|---|---|---|
| iPhone 15 Pro | 8 GB | ~4 GB | Phi-3 Mini INT4 (2.2 GB) |
| iPhone 14 | 6 GB | ~2.5 GB | Gemma 2 2B INT4 (1.5 GB) |
| Galaxy S24 Ultra | 12 GB | ~6 GB | Mistral 7B INT4 (4.1 GB) |
| Galaxy A55 | 8 GB | ~3 GB | Llama 3.2 3B INT4 (1.8 GB) |
| Pixel 8 Pro | 12 GB | ~5 GB | Phi-3 Mini INT4 (2.2 GB) |

---

## 11. Dobre praktyki

1. **Wybieraj najmniejszy model** spełniający wymagania jakościowe — Llama 3.2 1B jest zaskakująco zdolny
2. **Streaming jest konieczny** — czas pierwszego tokena < 500 ms daje wrażenie szybkości
3. **Zarządzaj KV cache** — ogranicz context window do rzeczywistych potrzeb aplikacji
4. **Graceful degradation** — gdy brakuje RAM, zaoferuj model cloud jako fallback
5. **Pobieraj modele leniwie** — nie bundluj 1 GB+ modelu w APK, pobieraj on-demand
6. **Monitoruj temperature** — długie generowanie może powodować throttling

---

## Powiązane artykuły

- [Wprowadzenie do lokalnego AI na mobile](local-ai-intro.md)
- [Kwantyzacja i optymalizacja modeli AI](model-quantization.md)
- [Frameworki ML na mobile](mobile-ml-frameworks.md)
- [Wnioskowanie lokalne — architektura i wydajność](on-device-inference.md)
- [AI mowy i NLP na mobile](ai-speech-nlp.md)
- [MediaPipe na mobile](mediapipe-mobile.md)
