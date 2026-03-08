# Analiza Głosu i Mowy

Głos człowieka niesie informacje na dwóch poziomach — **semantycznym** (co zostało powiedziane) i **paralinguistycznym** (jak zostało powiedziane: ton, tempo, energia). Ten drugi poziom odzwierciedla stan emocjonalny mówcy i stanowi podstawę dla systemów Speech Emotion Recognition (SER).

## Cechy akustyczne głosu — przegląd

| Cecha | Symbol | Opis | Interpretacja |
|-------|--------|------|---------------|
| **Podstawowa częstotliwość** | F0 / Pitch | Częstotliwość drgań fałd głosowych | Wysoka = wzbudzenie / pytanie |
| **Głośność (RMS Energy)** | E | Amplituda sygnału dźwiękowego | Wysoka = złość / radość |
| **Tempo mowy** | SR | Liczba sylab lub słów na minutę | Szybkie = lęk / podniecenie |
| **Jitter** | — | Nieregularność cyklu F0 | Wysoki = smutek / stres |
| **Shimmer** | — | Nieregularność amplitudy | Wysoki = smutek / znużenie |
| **HNR** | — | Harmonic-to-Noise Ratio | Niski = chrypka, zmęczenie |
| **MFCC** | — | Mel-frequency cepstral coefficients | Spektralna barwa głosu |
| **ZCR** | — | Zero Crossing Rate | Szum vs. tonal |

## Ekstrakcja cech MFCC na Androidzie

MFCC (Mel-Frequency Cepstral Coefficients) to najważniejsze cechy do klasyfikacji mowy. Opierają się na skali Mel — nieliniowej skali częstotliwości naśladującej percepcję ludzkiego ucha.

```kotlin
class MfccExtractor(private val sampleRate: Int = 16000) {
    private val frameSize = 512          // ~32ms przy 16kHz
    private val hopSize = 256            // ~16ms — 50% overlap
    private val numMelFilters = 26       // standardowo 26 lub 40
    private val numMfcc = 13             // 13 współczynników MFCC

    // Okno Hanna — redukuje efekt Gibbsa na krawędziach ramki
    private fun hannWindow(size: Int): FloatArray =
        FloatArray(size) { n ->
            (0.5f - 0.5f * kotlin.math.cos(2 * Math.PI * n / (size - 1))).toFloat()
        }

    // Pre-emphasis filter — wzmacnia wysokie częstotliwości (+6dB/oktawa)
    private fun preEmphasis(signal: FloatArray, coeff: Float = 0.97f): FloatArray {
        val result = signal.copyOf()
        for (i in signal.size - 1 downTo 1) {
            result[i] = signal[i] - coeff * signal[i - 1]
        }
        return result
    }

    // Energia RMS ramki — podstawowa miara głośności
    fun rmsEnergy(frame: FloatArray): Float {
        val sumSq = frame.sumOf { (it * it).toDouble() }.toFloat()
        return kotlin.math.sqrt(sumSq / frame.size)
    }

    // Zero Crossing Rate — ile razy sygnał przecina oś zerową
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

## Ekstrakcja pitch (F0) — algorytm YIN

```kotlin
// Algorytm YIN — dobry stosunek dokładności do złożoności obliczeniowej
class PitchDetector(private val sampleRate: Int = 16000) {
    private val minFreq = 80f    // Hz — dolna granica głosu ludzkiego
    private val maxFreq = 400f   // Hz — górna granica

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

## Pipeline — pełny system SER

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

- [librosa — Python audio analysis](https://librosa.org/doc/latest/index.html)
- [openSMILE — speech feature toolkit](https://audeering.github.io/opensmile/)
- [RAVDESS dataset](https://zenodo.org/record/1188976)
- [SpeechBrain](https://speechbrain.github.io/)
