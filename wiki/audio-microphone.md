# Audio i Mikrofon

Aplikacje mobilne coraz częściej korzystają z mikrofonu — do rozpoznawania mowy, analizy dźwięku, nagrywania i komunikacji głosowej. Android i iOS udostępniają niskopoziomowe API do nagrywania PCM oraz wysokopoziomowe narzędzia Speech Recognition.

## Nagrywanie audio — AudioRecord (Android)

```kotlin
class AudioRecorder(
    private val sampleRate: Int = 16000,
    private val channelConfig: Int = AudioFormat.CHANNEL_IN_MONO,
    private val encoding: Int = AudioFormat.ENCODING_PCM_16BIT
) {
    private var recorder: AudioRecord? = null
    private val minBuffer = AudioRecord.getMinBufferSize(sampleRate, channelConfig, encoding)
    private val bufferSize = maxOf(minBuffer, 4096) * 4   // 4× dla bezpieczeństwa

    private val _isRecording = MutableStateFlow(false)
    val isRecording = _isRecording.asStateFlow()

    @SuppressLint("MissingPermission")
    fun startRecording(onAudioData: (ShortArray) -> Unit): Job {
        recorder = AudioRecord(
            MediaRecorder.AudioSource.VOICE_RECOGNITION,   // zoptymalizowany dla mowy
            sampleRate, channelConfig, encoding, bufferSize
        )
        recorder!!.startRecording()
        _isRecording.value = true

        return CoroutineScope(Dispatchers.IO).launch {
            val buffer = ShortArray(bufferSize / 2)
            while (_isRecording.value) {
                val read = recorder!!.read(buffer, 0, buffer.size)
                if (read > 0) {
                    // Sprawdź głośność — VAD (Voice Activity Detection)
                    val rms = sqrt(buffer.take(read).map { it.toDouble().pow(2) }.average())
                    if (rms > SILENCE_THRESHOLD) onAudioData(buffer.copyOf(read))
                }
            }
        }
    }

    fun stopRecording() {
        _isRecording.value = false
        recorder?.apply { stop(); release() }
        recorder = null
    }

    fun shortsToFloats(shorts: ShortArray): FloatArray =
        FloatArray(shorts.size) { shorts[it].toFloat() / Short.MAX_VALUE }

    companion object { const val SILENCE_THRESHOLD = 500.0 }
}
```

## Zapis do pliku WAV

```kotlin
object WavWriter {
    fun writeWavFile(
        outputFile: File,
        pcmData: ByteArray,
        sampleRate: Int = 16000,
        channels: Int = 1,
        bitsPerSample: Int = 16
    ) {
        val dataSize = pcmData.size
        val headerSize = 44
        val totalSize = headerSize + dataSize

        outputFile.outputStream().use { fos ->
            // RIFF header
            fos.write("RIFF".toByteArray())
            fos.write(intToLittleEndian(totalSize - 8))
            fos.write("WAVE".toByteArray())
            // fmt chunk
            fos.write("fmt ".toByteArray())
            fos.write(intToLittleEndian(16))                         // chunk size
            fos.write(shortToLittleEndian(1))                        // PCM format
            fos.write(shortToLittleEndian(channels.toShort()))
            fos.write(intToLittleEndian(sampleRate))
            fos.write(intToLittleEndian(sampleRate * channels * bitsPerSample / 8))  // byte rate
            fos.write(shortToLittleEndian((channels * bitsPerSample / 8).toShort())) // block align
            fos.write(shortToLittleEndian(bitsPerSample.toShort()))
            // data chunk
            fos.write("data".toByteArray())
            fos.write(intToLittleEndian(dataSize))
            fos.write(pcmData)
        }
    }

    private fun intToLittleEndian(value: Int)      = ByteArray(4) { i -> (value shr (i * 8)).toByte() }
    private fun shortToLittleEndian(value: Short)  = ByteArray(2) { i -> (value.toInt() shr (i * 8)).toByte() }
}
```

## MediaRecorder — prostsze nagrywanie

```kotlin
class SimpleRecorder(private val context: Context) {
    private var mediaRecorder: MediaRecorder? = null
    private var outputFile: File? = null

    fun start(): File {
        outputFile = File(context.cacheDir, "recording_${System.currentTimeMillis()}.m4a")
        mediaRecorder = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) {
            MediaRecorder(context)
        } else {
            @Suppress("DEPRECATION") MediaRecorder()
        }.apply {
            setAudioSource(MediaRecorder.AudioSource.MIC)
            setOutputFormat(MediaRecorder.OutputFormat.MPEG_4)
            setAudioEncoder(MediaRecorder.AudioEncoder.AAC)
            setAudioSamplingRate(44100)
            setAudioEncodingBitRate(128_000)
            setOutputFile(outputFile!!.absolutePath)
            prepare()
            start()
        }
        return outputFile!!
    }

    fun stop(): File? {
        mediaRecorder?.apply { stop(); release() }
        mediaRecorder = null
        return outputFile
    }

    // Pobierz aktualną amplitudę (dla wizualizacji falki)
    val amplitude: Int get() = mediaRecorder?.maxAmplitude ?: 0
}
```

## Speech Recognition — rozpoznawanie mowy

```kotlin
class SpeechRecognitionManager(
    private val context: Context,
    private val onResult: (String) -> Unit,
    private val onError: (String) -> Unit
) {
    private var speechRecognizer: SpeechRecognizer? = null

    fun start(language: String = "pl-PL") {
        if (!SpeechRecognizer.isRecognitionAvailable(context)) {
            onError("Rozpoznawanie mowy niedostępne")
            return
        }

        speechRecognizer = SpeechRecognizer.createSpeechRecognizer(context).apply {
            setRecognitionListener(object : RecognitionListener {
                override fun onResults(results: Bundle?) {
                    val matches = results?.getStringArrayList(SpeechRecognizer.RESULTS_RECOGNITION)
                    val text = matches?.firstOrNull() ?: return
                    onResult(text)
                }
                override fun onPartialResults(partial: Bundle?) {
                    val matches = partial?.getStringArrayList(SpeechRecognizer.RESULTS_RECOGNITION)
                    matches?.firstOrNull()?.let { /* live preview */ }
                }
                override fun onError(errorCode: Int) {
                    onError(errorCodeToMessage(errorCode))
                }
                // Pozostałe callbacki muszą być, nawet puste
                override fun onReadyForSpeech(p: Bundle?) = Unit
                override fun onBeginningOfSpeech() = Unit
                override fun onRmsChanged(rms: Float) = Unit    // głośność w dB — do wizualizacji
                override fun onBufferReceived(b: ByteArray?) = Unit
                override fun onEndOfSpeech() = Unit
                override fun onEvent(t: Int, b: Bundle?) = Unit
            })
        }

        val intent = Intent(RecognizerIntent.ACTION_RECOGNIZE_SPEECH).apply {
            putExtra(RecognizerIntent.EXTRA_LANGUAGE_MODEL, RecognizerIntent.LANGUAGE_MODEL_FREE_FORM)
            putExtra(RecognizerIntent.EXTRA_LANGUAGE, language)
            putExtra(RecognizerIntent.EXTRA_LANGUAGE_PREFERENCE, language)
            putExtra(RecognizerIntent.EXTRA_PARTIAL_RESULTS, true)     // wyniki na bieżąco
            putExtra(RecognizerIntent.EXTRA_SPEECH_INPUT_COMPLETE_SILENCE_LENGTH_MILLIS, 2000L)
        }
        speechRecognizer?.startListening(intent)
    }

    fun stop() {
        speechRecognizer?.apply { stopListening(); destroy() }
        speechRecognizer = null
    }

    private fun errorCodeToMessage(code: Int) = when (code) {
        SpeechRecognizer.ERROR_NETWORK                -> "Brak połączenia z siecią"
        SpeechRecognizer.ERROR_NETWORK_TIMEOUT        -> "Timeout sieci"
        SpeechRecognizer.ERROR_AUDIO                  -> "Błąd nagrywania"
        SpeechRecognizer.ERROR_SERVER                 -> "Błąd serwera"
        SpeechRecognizer.ERROR_NO_MATCH               -> "Nie rozpoznano mowy"
        SpeechRecognizer.ERROR_SPEECH_TIMEOUT         -> "Timeout mowy — za cicho?"
        SpeechRecognizer.ERROR_RECOGNIZER_BUSY        -> "Rozpoznawanie zajęte"
        SpeechRecognizer.ERROR_INSUFFICIENT_PERMISSIONS -> "Brak uprawnień mikrofonu"
        else                                          -> "Nieznany błąd ($code)"
    }
}
```

## Wizualizacja fali dźwiękowej w Compose

```kotlin
@Composable
fun AudioWaveform(
    amplitudes: List<Float>,   // znormalizowane 0.0–1.0
    modifier: Modifier = Modifier,
    color: Color = MaterialTheme.colorScheme.primary,
    barWidth: Dp = 3.dp,
    barSpacing: Dp = 2.dp,
    isRecording: Boolean = false
) {
    val infiniteTransition = rememberInfiniteTransition()
    val pulseAlpha by infiniteTransition.animateFloat(
        initialValue = 1f, targetValue = 0.4f,
        animationSpec = infiniteRepeatable(tween(600), RepeatMode.Reverse)
    )
    val effectiveColor = if (isRecording) color.copy(alpha = pulseAlpha) else color

    Canvas(modifier = modifier) {
        val barWidthPx   = barWidth.toPx()
        val spacingPx    = barSpacing.toPx()
        val totalBarWidth = barWidthPx + spacingPx
        val visibleBars  = (size.width / totalBarWidth).toInt().coerceAtLeast(1)
        val bars = amplitudes.takeLast(visibleBars)
        val centerY = size.height / 2f

        bars.forEachIndexed { index, amplitude ->
            val barHeight = (amplitude * size.height * 0.9f).coerceAtLeast(4f)
            val x = index * totalBarWidth + barWidthPx / 2f
            drawLine(
                color = effectiveColor,
                start = Offset(x, centerY - barHeight / 2f),
                end   = Offset(x, centerY + barHeight / 2f),
                strokeWidth = barWidthPx,
                cap = StrokeCap.Round
            )
        }
    }
}
```

## Text-to-Speech (TTS)

```kotlin
class TtsManager(context: Context) {
    private var tts: TextToSpeech? = null
    private var isReady = false

    init {
        tts = TextToSpeech(context) { status ->
            if (status == TextToSpeech.SUCCESS) {
                val langResult = tts?.setLanguage(Locale("pl", "PL"))
                isReady = langResult != TextToSpeech.LANG_MISSING_DATA &&
                          langResult != TextToSpeech.LANG_NOT_SUPPORTED
                tts?.setSpeechRate(1.0f)   // 0.5 = wolno, 1.0 = normalnie, 2.0 = szybko
                tts?.setPitch(1.0f)         // 0.5 = bas, 1.0 = normalnie, 2.0 = wysoki
            }
        }
    }

    fun speak(text: String) {
        if (!isReady) return
        tts?.speak(text, TextToSpeech.QUEUE_FLUSH, null, "utterance_${System.currentTimeMillis()}")
    }

    fun stop() = tts?.stop()
    fun release() { tts?.shutdown(); tts = null }
}
```

## Linki

- [AudioRecord](https://developer.android.com/reference/android/media/AudioRecord)
- [SpeechRecognizer](https://developer.android.com/reference/android/speech/SpeechRecognizer)
- [MediaRecorder](https://developer.android.com/guide/topics/media/mediarecorder)
- [AVAudioEngine (iOS)](https://developer.apple.com/documentation/avfaudio/avaudioengine)
