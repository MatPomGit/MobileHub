# Analiza głosu i mowy

Głos człowieka niesie informacje na dwóch poziomach - **semantycznym** (co zostało powiedziane) i **paralinguistycznym** (jak zostało powiedziane: ton, tempo, energia). Ten drugi poziom odzwierciedla stan emocjonalny mówcy i stanowi podstawę dla systemów Speech Emotion Recognition (SER).

## Cechy akustyczne głosu - przegląd

| Cecha | Symbol | Opis | Interpretacja |
|-------|--------|------|---------------|
| **Podstawowa częstotliwość** | F0 / Pitch | Częstotliwość drgań fałd głosowych | Wysoka = wzbudzenie / pytanie |
| **Głośność (RMS Energy)** | E | Amplituda sygnału dźwiękowego | Wysoka = złość / radość |
| **Tempo mowy** | SR | Liczba sylab lub słów na minutę | Szybkie = lęk / podniecenie |
| **Jitter** | - | Nieregularność cyklu F0 | Wysoki = smutek / stres |
| **Shimmer** | - | Nieregularność amplitudy | Wysoki = smutek / znużenie |
| **HNR** | - | Harmonic-to-Noise Ratio | Niski = chrypka, zmęczenie |
| **MFCC** | - | Mel-frequency cepstral coefficients | Spektralna barwa głosu |
| **ZCR** | - | Zero Crossing Rate | Szum vs. tonal |

## Ekstrakcja cech MFCC na Androidzie

MFCC (Mel-Frequency Cepstral Coefficients) to najważniejsze cechy do klasyfikacji mowy. Opierają się na skali Mel - nieliniowej skali częstotliwości naśladującej percepcję ludzkiego ucha.

```kotlin
class MfccExtractor(private val sampleRate: Int = 16000) {
    private val frameSize = 512          // ~32ms przy 16kHz
    private val hopSize = 256            // ~16ms - 50% overlap
    private val numMelFilters = 26       // standardowo 26 lub 40
    private val numMfcc = 13             // 13 współczynników MFCC

    // Okno Hanna - redukuje efekt Gibbsa na krawędziach ramki
    private fun hannWindow(size: Int): FloatArray =
        FloatArray(size) { n ->
            (0.5f - 0.5f * kotlin.math.cos(2 * Math.PI * n / (size - 1))).toFloat()
        }

    // Pre-emphasis filter - wzmacnia wysokie częstotliwości (+6dB/oktawa)
    private fun preEmphasis(signal: FloatArray, coeff: Float = 0.97f): FloatArray {
        val result = signal.copyOf()
        for (i in signal.size - 1 downTo 1) {
            result[i] = signal[i] - coeff * signal[i - 1]
        }
        return result
    }

    // Energia RMS ramki - podstawowa miara głośności
    fun rmsEnergy(frame: FloatArray): Float {
        val sumSq = frame.sumOf { (it * it).toDouble() }.toFloat()
        return kotlin.math.sqrt(sumSq / frame.size)
    }

    // Zero Crossing Rate - ile razy sygnał przecina oś zerową
    fun zeroCrossingRate(frame: FloatArray): Float {
        var crossings = 0
        for (i in 1 until frame.size) {
            if ((frame[i] >= 0) != (frame[i-1] >= 0)) crossings++
        }
        return crossings.toFloat() / frame.size
    }

    // Segmentacja sygnału na ramki
    fun segmentIntoFrames(signal: FloatArray): List<FloatArray> {
        val frames = mutableListOf<FloatArray>()
        val window = hannWindow(frameSize)
        var start = 0
        while (start + frameSize <= signal.size) {
            val frame = FloatArray(frameSize) { i -> signal[start + i] * window[i] }
            frames.add(frame)
            start += hopSize
        }
        return frames
    }
}
```

## Nagrywanie audio dla SER

```kotlin
class SpeechRecorder(private val context: Context) {
    private var audioRecord: AudioRecord? = null
    private val sampleRate = 16000
    private val bufferSize = AudioRecord.getMinBufferSize(
        sampleRate,
        AudioFormat.CHANNEL_IN_MONO,
        AudioFormat.ENCODING_PCM_16BIT
    ) * 4  // 4x dla bezpieczeństwa

    private val _isRecording = MutableStateFlow(false)
    val isRecording = _isRecording.asStateFlow()

    fun startRecording(onAudioChunk: (ShortArray) -> Unit): Job {
        val record = AudioRecord(
            MediaRecorder.AudioSource.MIC,
            sampleRate,
            AudioFormat.CHANNEL_IN_MONO,
            AudioFormat.ENCODING_PCM_16BIT,
            bufferSize
        )
        audioRecord = record
        record.startRecording()
        _isRecording.value = true

        return CoroutineScope(Dispatchers.IO).launch {
            val buffer = ShortArray(bufferSize / 2)
            while (_isRecording.value) {
                val read = record.read(buffer, 0, buffer.size)
                if (read > 0) onAudioChunk(buffer.copyOf(read))
            }
        }
    }

    fun stopRecording() {
        _isRecording.value = false
        audioRecord?.apply { stop(); release() }
        audioRecord = null
    }

    // Konwersja Short[] → Float[] (normalizacja)
    fun shortsToFloats(shorts: ShortArray): FloatArray =
        FloatArray(shorts.size) { i -> shorts[i] / Short.MAX_VALUE.toFloat() }
}
```

## Klasyfikacja emocji z głosu (TFLite)

```kotlin
class SpeechEmotionClassifier(context: Context) {
    // Model trenowany na RAVDESS lub IEMOCAP
    private val interpreter = Interpreter(
        FileUtil.loadMappedFile(context, "ser_model.tflite"),
        Interpreter.Options().apply { numThreads = 2 }
    )

    private val emotions = listOf("neutral", "calm", "happy", "sad", "angry", "fearful", "disgust", "surprised")

    // Wejście: macierz 40 MFCC x N ramek
    fun classify(mfccFeatures: Array<FloatArray>): Map<String, Float> {
        val inputShape = interpreter.getInputTensor(0).shape()
        val numFrames = inputShape[1]
        val numFeatures = inputShape[2]  // 40

        // Padding lub truncation do stałej długości
        val input = Array(1) {
            Array(numFrames) { frame ->
                FloatArray(numFeatures) { feat ->
                    mfccFeatures.getOrNull(frame)?.getOrElse(feat) { 0f } ?: 0f
                }
            }
        }

        val output = Array(1) { FloatArray(emotions.size) }
        interpreter.run(input, output)

        return emotions.zip(output[0].toList().map { it }).toMap()
    }
}
```

## Ekstrakcja pitch (F0) - algorytm YIN

```kotlin
// Algorytm YIN - dobry stosunek dokładności do złożoności obliczeniowej
class PitchDetector(private val sampleRate: Int = 16000) {
    private val minFreq = 80f    // Hz - dolna granica głosu ludzkiego
    private val maxFreq = 400f   // Hz - górna granica

    private val minPeriod = (sampleRate / maxFreq).toInt()
    private val maxPeriod = (sampleRate / minFreq).toInt()

    fun detectPitch(frame: FloatArray): Float? {
        val size = frame.size
        val yinBuffer = FloatArray(maxPeriod)

        // Krok 1: Różnica kwadratów
        for (tau in 1 until maxPeriod) {
            var sum = 0.0
            for (j in 0 until size - tau) {
                val delta = frame[j] - frame[j + tau]
                sum += delta * delta
            }
            yinBuffer[tau] = sum.toFloat()
        }

        // Krok 2: Kumulatywna średnia normalizacja
        yinBuffer[0] = 1f
        var cumulativeSum = 0f
        for (tau in 1 until maxPeriod) {
            cumulativeSum += yinBuffer[tau]
            yinBuffer[tau] = if (cumulativeSum > 0) yinBuffer[tau] * tau / cumulativeSum else 1f
        }

        // Krok 3: Znajdź minimum poniżej progu
        val threshold = 0.1f
        for (tau in minPeriod until maxPeriod) {
            if (yinBuffer[tau] < threshold) {
                return sampleRate.toFloat() / tau
            }
        }
        return null  // brak dźwięku lub niskie SNR
    }

    fun detectPitchStats(frames: List<FloatArray>): PitchStats {
        val pitches = frames.mapNotNull { detectPitch(it) }
        return if (pitches.isEmpty()) PitchStats(0f, 0f, 0f)
        else PitchStats(
            mean = pitches.average().toFloat(),
            std = pitches.let { p ->
                val mean = p.average()
                kotlin.math.sqrt(p.sumOf { (it - mean).pow(2) } / p.size).toFloat()
            },
            range = pitches.max() - pitches.min()
        )
    }
}

data class PitchStats(val mean: Float, val std: Float, val range: Float)
```

## Wygładzanie predykcji w czasie

Klasyfikacja klatka-po-klatce jest niestabilna. Wygładzanie Moving Average stabilizuje wyniki:

```kotlin
class EmotionSmoother(private val windowSize: Int = 15) {
    private val history = ArrayDeque<Map<String, Float>>(windowSize)

    fun smooth(rawPrediction: Map<String, Float>): Map<String, Float> {
        if (history.size >= windowSize) history.removeFirst()
        history.addLast(rawPrediction)

        return rawPrediction.keys.associateWith { emotion ->
            history.map { it[emotion] ?: 0f }.average().toFloat()
        }
    }

    fun getTopEmotion(): Pair<String, Float>? =
        if (history.isEmpty()) null
        else {
            val smoothed = smooth(history.last())
            smoothed.maxByOrNull { it.value }?.toPair()
        }

    fun reset() = history.clear()
}
```

## Pipeline - pełny system SER

```
Mikrofon → Pre-emphasis → Okienkowanie (Hann) → FFT
    → Mel Filterbank → Log → DCT → MFCC[40]
    → Normalizacja Z-score → TFLite Model
    → Softmax → Wygładzanie MA → Wynik emocji
```

## Popularne zbiory danych SER

| Zbiór | Język | Liczba emocji | Liczba próbek | Warunki |
|-------|-------|--------------|--------------|---------|
| **RAVDESS** | Angielski | 8 | 7356 | Studio |
| **IEMOCAP** | Angielski | 4-9 | 10039 | Studio |
| **MSP-IMPROV** | Angielski | 4 | 8438 | Semi-naturalny |
| **EMODB** | Niemiecki | 7 | 535 | Studio |
| **PolEmo** | Polski | 4 | brak audio | Tekst |

## Linki

- [librosa - Python audio analysis](https://librosa.org/doc/latest/index.html)
- [openSMILE - speech feature toolkit](https://audeering.github.io/opensmile/)
- [RAVDESS dataset](https://zenodo.org/record/1188976)
- [SpeechBrain](https://speechbrain.github.io/)

## Detekcja aktywności głosowej (VAD)

Detekcja aktywności głosowej (VAD, *Voice Activity Detection*) to etap wstępny, który oddziela fragmenty zawierające mowę od ciszy i szumów tła. Uruchamianie kosztownych modeli STT lub klasyfikacji emocji na fragmentach bez mowy jest stratą zasobów obliczeniowych i może powodować fałszywe wyniki - dlatego VAD jest standardowym pierwszym krokiem w każdym pipeline'ie analizy głosu.

### Proste VAD oparte na energii

Najprostsza metoda: jeśli energia RMS ramki przekracza próg, uznajemy ją za mowę.

```kotlin
class EnergyVAD(
    private val threshold: Float = 0.02f,
    private val hangoverFrames: Int = 8   // ile ramek "zawieszenia" po mowie
) {
    private var hangover = 0

    fun isSpeech(frame: FloatArray): Boolean {
        val rms = kotlin.math.sqrt(frame.sumOf { (it * it).toDouble() } / frame.size).toFloat()
        return when {
            rms > threshold -> { hangover = hangoverFrames; true }
            hangover > 0    -> { hangover--; true }  // wygaszanie - nie ucinaj końcówek
            else            -> false
        }
    }

    fun filterSpeechFrames(frames: List<FloatArray>): List<FloatArray> =
        frames.filter { isSpeech(it) }
}
```

### WebRTC VAD i Silero VAD

Prosta metoda energetyczna zawodzi w hałaśliwym otoczeniu. Dwa lepsze podejścia to:

**WebRTC VAD** - algorytm oparty na GMM (Gaussian Mixture Models), dostępny przez binding JNI lub wrapper:

```kotlin
// Używa biblioteki webrtc-vad (dostępna jako AAR lub via JNI)
val vad = WebRtcVad()
vad.init()
vad.setMode(WebRtcVad.Mode.VERY_AGGRESSIVE)  // 0-3, wyższy = mniej fałszywych alarmów

val result = vad.process(sampleRate = 16000, audioFrame = pcm16bitFrame)
// Zwraca: IS_SPEECH, NOT_SPEECH, lub ERROR
```

**Silero VAD** - model TFLite (~1 MB) osiągający state-of-the-art przy niskim koszcie obliczeniowym:

```kotlin
class SileroVAD(context: Context) {
    private val interpreter = Interpreter(
        FileUtil.loadMappedFile(context, "silero_vad.tflite")
    )

    // Wejście: 512 próbek (32ms przy 16kHz), float32
    fun isSpeech(frame: FloatArray): Boolean {
        val input = Array(1) { frame }
        val output = Array(1) { FloatArray(1) }
        interpreter.run(input, output)
        return output[0][0] > 0.5f  // próg pewności
    }
}
```

### Dlaczego VAD jest kluczowe?

- **STT**: transkrypcja ciszy produkuje losowe słowa lub puste wyniki - VAD eliminuje te fragmenty
- **SER**: model emocji trenowany na mowie daje bezużyteczne predykcje na szumie
- **Zużycie energii**: wyłączenie pipeline'u podczas ciszy oszczędza baterię
- **Latencja**: model działa tylko wtedy, gdy jest co przetwarzać

---

## Identyfikacja mówcy - Speaker Identification

Identyfikacja mówcy (*Speaker Identification*) odpowiada na pytanie: **kto mówi?** Jest to zagadnienie pokrewne, ale różne od rozpoznawania mowy (co mówi) i weryfikacji mówcy (czy to ta konkretna osoba).

- **Identyfikacja** (*closed-set*): przypisz nagranie do jednego z N znanych mówców
- **Weryfikacja** (*speaker verification*): potwierdź, czy nagranie pochodzi od konkretnej osoby
- **Diaryzacja** (*speaker diarization*): segmentuj nagranie według mówców - „kto mówił kiedy?"

### Wektory cech mówcy: d-vector i x-vector

Nowoczesne systemy identyfikacji mówcy używają głębokich sieci neuronowych do ekstrakcji **embeddingów mówcy** - wektorów stałej długości opisujących charakterystykę głosu niezależnie od treści. Dwa popularyczne podejścia:

| Metoda | Architektura | Rozmiar wektora | Użycie na mobile |
|--------|-------------|-----------------|-----------------|
| **d-vector** | LSTM/GRU | 256 | Tak (TFLite) |
| **x-vector** | TDNN (Time-Delay NN) | 512 | Tak (TFLite, ONNX) |
| **ECAPA-TDNN** | CNN + SE-Block | 192 | Ograniczone |

### Ekstrakcja embeddingu i porównanie kosinusowe

```kotlin
class SpeakerEmbeddingExtractor(context: Context) {
    private val interpreter = Interpreter(
        FileUtil.loadMappedFile(context, "speaker_encoder.tflite"),
        Interpreter.Options().apply { numThreads = 2 }
    )
    private val embeddingSize = 256

    // Wejście: znormalizowane MFCC [1, numFrames, 40]
    fun extractEmbedding(mfccFeatures: Array<FloatArray>): FloatArray {
        val inputShape = interpreter.getInputTensor(0).shape()
        val numFrames = inputShape[1]

        val input = Array(1) {
            Array(numFrames) { f ->
                FloatArray(40) { feat ->
                    mfccFeatures.getOrNull(f)?.getOrElse(feat) { 0f } ?: 0f
                }
            }
        }
        val output = Array(1) { FloatArray(embeddingSize) }
        interpreter.run(input, output)
        return l2Normalize(output[0])  // normalizacja L2 przed porównaniem
    }

    private fun l2Normalize(v: FloatArray): FloatArray {
        val norm = kotlin.math.sqrt(v.sumOf { (it * it).toDouble() }).toFloat()
        return if (norm > 0) FloatArray(v.size) { v[it] / norm } else v
    }
}

// Podobieństwo kosinusowe - wartość 1.0 = identyczny mówca
fun cosineSimilarity(a: FloatArray, b: FloatArray): Float {
    val dot = a.indices.sumOf { (a[it] * b[it]).toDouble() }.toFloat()
    return dot  // wektory są już znormalizowane L2
}

// Przykład użycia:
// val sim = cosineSimilarity(enrolledEmbedding, testEmbedding)
// if (sim > 0.75f) "Znany mówca" else "Nieznana osoba"
```

### Praktyczne zastosowania na urządzeniu

- **Personalizacja asystenta głosowego** - różne profile dla różnych użytkowników
- **Bezpieczeństwo** - weryfikacja tożsamości przez głos (2FA)
- **Diaryzacja w nagraniach spotkań** - kto i kiedy zabierał głos
- **Filtrowanie mówców** - ignorowanie głosu z TV w tle, rozpoznaj tylko właściciela urządzenia
