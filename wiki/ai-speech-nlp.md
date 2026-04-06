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

## 9. Named Entity Recognition (NER) na urządzeniu

Rozpoznawanie nazwanych encji (*Named Entity Recognition*, NER) to zadanie ekstrakcji strukturyzowanych informacji z tekstu: **imion i nazwisk**, **lokalizacji**, **organizacji**, **dat** i innych typów encji. Na urządzeniu mobilnym NER jest szczególnie użyteczne jako etap przetwarzania po STT — np. „Zadzwoń do Anny Kowalskiej jutro o 10" → ekstrakcja osoby, czasu.

### Model NER na TFLite — HerBERT lub XLM-RoBERTa

Do języka polskiego najlepszą opcją on-device jest **HerBERT** (Allegro, trenowany na polskich korpusach) lub wielojęzyczny **XLM-RoBERTa** dostrojony dla zadania NER z etykietami BIO.

```kotlin
class OnDeviceNER(context: Context) {
    private val interpreter = Interpreter(
        FileUtil.loadMappedFile(context, "herbert_ner_int8.tflite"),
        Interpreter.Options().apply { numThreads = 2 }
    )
    private val tokenizer = BertTokenizer(context.assets.open("herbert_vocab.txt"))

    // Etykiety BIO — kolejność musi odpowiadać modelowi
    private val labels = listOf(
        "O",
        "B-PER", "I-PER",    // osoba
        "B-LOC", "I-LOC",    // lokalizacja
        "B-ORG", "I-ORG",    // organizacja
        "B-DATE", "I-DATE"   // data/czas
    )

    data class Entity(val text: String, val type: String, val start: Int, val end: Int)

    fun extractEntities(text: String): List<Entity> {
        val tokens = tokenizer.tokenize(text, maxLen = 128)
        val inputIds  = Array(1) { tokens.inputIds }
        val inputMask = Array(1) { tokens.attentionMask }

        // Wyjście: [1, seqLen, numLabels] — logity dla każdego tokenu
        val output = Array(1) { Array(128) { FloatArray(labels.size) } }
        interpreter.run(arrayOf(inputIds, inputMask), mapOf(0 to output))

        return decodeBIOTags(text, tokens.tokenList, output[0])
    }

    private fun decodeBIOTags(
        originalText: String,
        tokenList: List<String>,
        logits: Array<FloatArray>
    ): List<Entity> {
        val entities = mutableListOf<Entity>()
        var currentEntity: StringBuilder? = null
        var currentType = ""
        var charOffset = 0

        tokenList.forEachIndexed { i, token ->
            val labelIdx = logits[i].indices.maxByOrNull { logits[i][it] } ?: 0
            val label = labels[labelIdx]

            when {
                label.startsWith("B-") -> {
                    currentEntity?.let { entities.add(Entity(it.toString(), currentType, 0, 0)) }
                    currentEntity = StringBuilder(token.removePrefix("##"))
                    currentType = label.substring(2)
                }
                label.startsWith("I-") && currentEntity != null -> {
                    val tokenText = token.removePrefix("##")
                    if (token.startsWith("##")) currentEntity?.append(tokenText)
                    else currentEntity?.append(" $tokenText")
                }
                else -> {
                    currentEntity?.let { entities.add(Entity(it.toString(), currentType, 0, 0)) }
                    currentEntity = null
                }
            }
        }
        currentEntity?.let { entities.add(Entity(it.toString(), currentType, 0, 0)) }
        return entities
    }
}
```

### Przykład użycia po STT

```kotlin
// Integracja STT → NER
val transcript = whisperRecognizer.recognize(audioFile)
// → "Wyślij e-mail do Piotra Nowaka w poniedziałek"

val entities = nerModel.extractEntities(transcript)
// → [Entity("Piotra Nowaka", "PER"), Entity("poniedziałek", "DATE")]

entities.forEach { entity ->
    when (entity.type) {
        "PER"  -> contactFinder.search(entity.text)
        "DATE" -> calendarHelper.parseDate(entity.text)
        "LOC"  -> mapIntent.navigate(entity.text)
        else   -> {}
    }
}
```

---

## 10. Ocena jakości STT — metryki WER i CER

Porównując silniki STT lub dostrajając własny model, potrzebujemy obiektywnych metryk. Dwie kluczowe to **WER** (*Word Error Rate*) i **CER** (*Character Error Rate*).

### Definicje

**WER** mierzy liczbę błędów na poziomie słów:

```
WER = (S + D + I) / N
```

gdzie: `S` = podstawienia, `D` = usunięcia, `I` = wstawienia, `N` = liczba słów w referencji.

**CER** — analogicznie na poziomie znaków. Lepszy dla języków aglutynacyjnych (jak turecki, fiński) lub gdy litery ważniejsze niż słowa (OCR). Dla polskiego WER jest zazwyczaj wystarczający.

### Obliczanie WER w Pythonie

```python
def compute_wer(reference: str, hypothesis: str) -> float:
    """Oblicza Word Error Rate metodą odległości edycyjnej (Levenshtein)."""
    ref_words = reference.lower().split()
    hyp_words = hypothesis.lower().split()
    n = len(ref_words)
    m = len(hyp_words)

    # Macierz DP
    dp = [[0] * (m + 1) for _ in range(n + 1)]
    for i in range(n + 1): dp[i][0] = i
    for j in range(m + 1): dp[0][j] = j

    for i in range(1, n + 1):
        for j in range(1, m + 1):
            if ref_words[i-1] == hyp_words[j-1]:
                dp[i][j] = dp[i-1][j-1]
            else:
                dp[i][j] = 1 + min(dp[i-1][j], dp[i][j-1], dp[i-1][j-1])

    return dp[n][m] / max(n, 1)

def compute_cer(reference: str, hypothesis: str) -> float:
    """Oblicza Character Error Rate."""
    ref = reference.replace(" ", "")
    hyp = hypothesis.replace(" ", "")
    return compute_wer(" ".join(ref), " ".join(hyp))

# Przykład:
ref = "dobry wieczór panie premierze"
hyp = "dobry wieczór panie premieże"
print(f"WER: {compute_wer(ref, hyp):.2%}")   # WER: 25.00%
print(f"CER: {compute_cer(ref, hyp):.2%}")   # CER: 3.57%
```

### Benchmarki dla języka polskiego

| Model / Silnik | WER (PL) | CER (PL) | Tryb | Rozmiar |
|----------------|----------|----------|------|---------|
| **Whisper tiny** | ~18% | ~6% | offline | 39 MB |
| **Whisper base** | ~12% | ~4% | offline | 74 MB |
| **Whisper small** | ~8% | ~2.5% | offline | 244 MB |
| **Google STT API** | ~5% | ~1.8% | online | — |
| **Azure Speech** | ~6% | ~2% | online | — |

> Wartości WER dla języka polskiego — na korpusie CLARIN-PL Common Voice. Wyniki zależą silnie od akcentu, jakości mikrofonu i tempa mowy.

### Wskazówki poprawy jakości STT

- **Redukcja szumu** przed rozpoznawaniem (WebRTC NS, RNNoise)
- **VAD** — nie wysyłaj ciszy do modelu STT
- **Biasing językowy** — zasilaj model listą spodziewanych słów (nazw, komend)
- **Normalizacja tekstu** po stronie hipotetycznej i referencyjnej przed liczeniem WER (usunięcie interpunkcji, lowercase)
- **Kwantyzacja INT8** nie pogarsza istotnie WER (różnica < 1 pp) przy 4× mniejszym modelu
