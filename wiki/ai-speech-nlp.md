# Przetwarzanie mowy i NLP na urządzeniu

## Streszczenie

Lokalne przetwarzanie mowy i języka naturalnego (NLP) na smartfonach umożliwia budowę aplikacji działających w trybie offline: od rozpoznawania i syntezy mowy, przez klasyfikację tekstu i analizę sentymentu, aż po tłumaczenie maszynowe i wykrywanie słów aktywujących. Artykuł omawia dostępne biblioteki, modele i wzorce integracji z aplikacjami mobilnymi na Androidzie i iOS.

**Słowa kluczowe:** Speech-to-Text, Text-to-Speech, NLP, Whisper, MobileBERT, OPUS-MT, wake word, on-device, STT, TTS

## 1. Wprowadzenie

Przetwarzanie mowy i języka naturalnego na urządzeniu mobilnym (*on-device NLP*) daje użytkownikom kluczowe korzyści: prywatność danych (mowa nie opuszcza urządzenia), działanie bez internetu oraz niskie opóźnienia. Tradycyjne podejście polegało na wysyłaniu nagrań audio do chmury (Google Cloud Speech-to-Text, AWS Transcribe), jednak rosnąca moc obliczeniowa NPU i małe modele kwantyzowane sprawiają, że coraz więcej zadań można wykonywać lokalnie.

Główne obszary on-device NLP:

| Zadanie | Biblioteki / modele |
|---|---|
| Speech-to-Text (STT) | Whisper.cpp, Android SpeechRecognizer, iOS Speech Framework |
| Text-to-Speech (TTS) | VITS, Coqui TTS, Android TextToSpeech, AVSpeechSynthesizer |
| Klasyfikacja tekstu | MobileBERT (TFLite), DistilBERT |
| Tłumaczenie maszynowe | OPUS-MT, NLLB Mobile |
| Wykrywanie słowa klucza | Porcupine (Picovoice), openWakeWord |
| Tokenizacja | SentencePiece, BPE na TFLite |

## 2. Rozpoznawanie mowy (Speech-to-Text)

### 2.1. Whisper i Whisper.cpp

Whisper (OpenAI, 2022) to model Transformer trenowany na 680 000 godzin wielojęzycznej mowy. Warianty *tiny* (39 M parametrów) i *base* (74 M) sprawdzają się na urządzeniach mobilnych po kwantyzacji do INT8.

**Whisper.cpp** to implementacja w C++, bez zależności zewnętrznych, kompilowalna dla Androida (Android NDK) i iOS.

```bash
# Kompilacja biblioteki .so dla Android arm64
cd whisper.cpp
mkdir build-android && cd build-android
cmake .. \
  -DCMAKE_TOOLCHAIN_FILE=$NDK/build/cmake/android.toolchain.cmake \
  -DANDROID_ABI=arm64-v8a \
  -DANDROID_PLATFORM=android-26 \
  -DWHISPER_BUILD_EXAMPLES=OFF
make -j4
```

Wrapper JNI (Kotlin):

```kotlin
class WhisperRecognizer(private val modelPath: String) {
    private external fun initModel(path: String): Long
    private external fun transcribe(handle: Long, samples: FloatArray, lang: String): String
    private external fun freeModel(handle: Long)

    private var handle: Long = 0

    fun load() { handle = initModel(modelPath) }

    suspend fun recognize(audioFile: File, language: String = "pl"): String =
        withContext(Dispatchers.Default) {
            val samples = decodeWavToFloat(audioFile)
            transcribe(handle, samples, language)
        }

    fun release() { freeModel(handle); handle = 0 }

    companion object { init { System.loadLibrary("whisper_jni") } }
}
```

### 2.2. Android SpeechRecognizer API

Wbudowane API Androida korzysta z silnika rozpoznawania mowy zainstalowanego w systemie (często Google). Od Androida 13 dostępna jest opcja działania w trybie offline.

```kotlin
val recognizer = SpeechRecognizer.createSpeechRecognizer(context)
recognizer.setRecognitionListener(object : RecognitionListener {
    override fun onResults(bundle: Bundle) {
        val results = bundle.getStringArrayList(SpeechRecognizer.RESULTS_RECOGNITION)
        val bestResult = results?.firstOrNull() ?: ""
        // użyj bestResult
    }
    override fun onError(errorCode: Int) { /* obsłuż błąd */ }
    // inne wymagane metody...
    override fun onReadyForSpeech(p: Bundle?) {}
    override fun onBeginningOfSpeech() {}
    override fun onRmsChanged(rmsdB: Float) {}
    override fun onBufferReceived(buffer: ByteArray?) {}
    override fun onEndOfSpeech() {}
    override fun onPartialResults(partialResults: Bundle?) {}
    override fun onEvent(eventType: Int, params: Bundle?) {}
})

val intent = Intent(RecognizerIntent.ACTION_RECOGNIZE_SPEECH).apply {
    putExtra(RecognizerIntent.EXTRA_LANGUAGE_MODEL, RecognizerIntent.LANGUAGE_MODEL_FREE_FORM)
    putExtra(RecognizerIntent.EXTRA_LANGUAGE, "pl-PL")
    putExtra(RecognizerIntent.EXTRA_PREFER_OFFLINE, true)
}
recognizer.startListening(intent)
```

### 2.3. iOS Speech Framework

```swift
import Speech

class SpeechRecognizer {
    private let recognizer = SFSpeechRecognizer(locale: Locale(identifier: "pl-PL"))!
    private var request: SFSpeechAudioBufferRecognitionRequest?
    private var task: SFSpeechRecognitionTask?

    func startRecognition(onResult: @escaping (String) -> Void) throws {
        request = SFSpeechAudioBufferRecognitionRequest()
        request?.requiresOnDeviceRecognition = true  // tryb offline

        task = recognizer.recognitionTask(with: request!) { result, error in
            if let result {
                onResult(result.bestTranscription.formattedString)
            }
        }
        // podłącz AVAudioEngine i przekazuj bufory audio do request
    }
}
```

## 3. Synteza mowy (Text-to-Speech)

### 3.1. Android TextToSpeech

```kotlin
class TTSManager(context: Context) : TextToSpeech.OnInitListener {
    private val tts = TextToSpeech(context, this)

    override fun onInit(status: Int) {
        if (status == TextToSpeech.SUCCESS) {
            tts.language = Locale("pl", "PL")
            tts.setSpeechRate(1.0f)
            tts.setPitch(1.0f)
        }
    }

    fun speak(text: String) {
        tts.speak(text, TextToSpeech.QUEUE_FLUSH, null, "utterance_id")
    }

    fun shutdown() = tts.shutdown()
}
```

### 3.2. Neuronalne modele TTS offline

Model **VITS** (Variational Inference with adversarial learning for end-to-end TTS) produkuje wysokiej jakości mowę i dostępny jest w wersji skwantyzowanej dla TFLite. Modele dla języka polskiego dostępne są w projekcie Coqui TTS i MMS (Meta Massively Multilingual Speech).

```python
# Uruchomienie Coqui TTS dla języka polskiego (offline)
from TTS.api import TTS

tts = TTS(model_name="tts_models/pl/mai_female/vits", progress_bar=False, gpu=False)
tts.tts_to_file(text="Witaj w aplikacji mobilnej!", file_path="output.wav")
```

## 4. Tokenizacja i modele tekstowe

### 4.1. SentencePiece na Androidzie

```kotlin
// Wczytanie modelu SentencePiece (plik .model)
// Użycie biblioteki com.github.google:sentencepiece-android
class Tokenizer(modelPath: String) {
    private val processor = SentencePieceProcessor()
    init { processor.load(modelPath) }

    fun encode(text: String): List<Int> = processor.encodeAsIds(text)
    fun decode(ids: List<Int>): String = processor.decodeIds(ids)
}
```

### 4.2. MobileBERT dla klasyfikacji tekstu

MobileBERT (Google, 2020) jest 4,3× szybszy i 4× mniejszy niż BERT-Base, zachowując 97% jego dokładności na benchmarkach NLP.

```kotlin
// TFLite model klasyfikacji sentymentu
class SentimentClassifier(context: Context) {
    private val interpreter: Interpreter
    private val tokenizer: BertTokenizer

    init {
        val model = loadModelFile(context, "mobilebert_sentiment.tflite")
        interpreter = Interpreter(model)
        tokenizer = BertTokenizer(context.assets.open("vocab.txt"))
    }

    fun classify(text: String): Float {
        val (inputIds, inputMask, segmentIds) = tokenizer.tokenize(text, maxLen = 128)
        val output = Array(1) { FloatArray(2) }
        interpreter.run(
            arrayOf(inputIds, inputMask, segmentIds),
            mapOf(0 to output)
        )
        return output[0][1]  // prawdopodobieństwo klasy "pozytywny"
    }
}
```

## 5. Wykrywanie słowa aktywującego (Wake Word)

Wykrywanie słowa kluczowego (*wake word detection*) to stale działający na urządzeniu model, który nasłuchuje określonej frazy (np. „Hej Siri", „Ok Google") i aktywuje aplikację.

**Porcupine** (Picovoice) — modele ~50 KB, latencja < 1 ms, dostępny dla Androida i iOS:

```kotlin
val porcupine = Porcupine.Builder()
    .setAccessKey("YOUR_ACCESS_KEY")
    .setKeyword(Porcupine.BuiltInKeyword.HEY_GOOGLE)
    .build(context)

// W pętli audio:
val keywordIndex = porcupine.process(audioFrame)
if (keywordIndex >= 0) {
    // Wykryto słowo kluczowe
}
```

**openWakeWord** (open-source, model w TFLite) pozwala trenować własne słowa aktywujące:

```python
import openwakeword
model = openwakeword.Model(wakeword_models=["hey_jarvis.tflite"])
prediction = model.predict(audio_frame)
```

## 6. Tłumaczenie maszynowe offline

### 6.1. OPUS-MT i NLLB Mobile

OPUS-MT to zbiór modeli tłumaczenia maszynowego opartych na Marian NMT, dostępnych dla ponad 1000 par językowych. Wersje skwantyzowane (INT8) osiągają rozmiar ~30–100 MB.

NLLB (No Language Left Behind, Meta) obsługuje 200 języków w jednym modelu, z wariantami 600M parametrów dostosowanymi do urządzeń mobilnych.

```python
from transformers import MarianMTModel, MarianTokenizer

model_name = "Helsinki-NLP/opus-mt-pl-en"
tokenizer = MarianTokenizer.from_pretrained(model_name)
model = MarianMTModel.from_pretrained(model_name)

text = "Programowanie aplikacji mobilnych jest fascynujące."
inputs = tokenizer([text], return_tensors="pt", padding=True)
translated = model.generate(**inputs)
result = tokenizer.decode(translated[0], skip_special_tokens=True)
print(result)  # "Mobile app programming is fascinating."
```

## 7. Obsługa języka polskiego

Dostępność modeli on-device dla języka polskiego stale rośnie:

| Zadanie | Model | Rozmiar |
|---|---|---|
| STT | Whisper tiny/base (pl) | 39–74 MB |
| TTS | VITS pl_mai_female (Coqui) | ~80 MB |
| Klasyfikacja | HerBERT-lite (TFLite) | ~200 MB |
| Tłumaczenie pl→en | OPUS-MT pl-en (INT8) | ~30 MB |
| Tłumaczenie en→pl | OPUS-MT en-pl (INT8) | ~30 MB |

## 8. Podsumowanie

On-device NLP dojrzało do punktu, gdzie większość zadań przetwarzania mowy i tekstu można realizować bez chmury. Kluczowe wnioski:

- **Whisper.cpp** to najdojrzalsze rozwiązanie dla wielojęzycznego STT offline
- **MobileBERT** pokrywa klasyfikację tekstu i NER przy rozsądnym rozmiarze
- **Porcupine** gwarantuje zawsze-aktywne wykrywanie słowa kluczowego z minimalnym zużyciem energii
- Język polski jest coraz lepiej obsługiwany dzięki inicjatywom Coqui TTS i HerBERT

## Powiązane artykuły

- [Wprowadzenie do lokalnej AI na urządzeniu mobilnym](#local-ai-intro)
- [Sieci neuronowe na urządzeniu mobilnym](#neural-networks-mobile)
- [Modele językowe LLM na urządzeniu](#llm-on-device)
- [MediaPipe — kompleksowe rozwiązania AI](#mediapipe-mobile)
- [AI w przetwarzaniu obrazu na urządzeniu](#ai-image-processing)
- [Audio i mikrofon](#audio-microphone)
