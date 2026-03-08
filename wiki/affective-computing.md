# Informatyka Afektywna w Aplikacjach Mobilnych

Informatyka Afektywna (Affective Computing) to dziedzina AI zajmująca się rozpoznawaniem, interpretacją, przetwarzaniem i symulowaniem ludzkich emocji przez maszyny. W kontekście mobilnym otwiera nowe możliwości personalizacji, zdrowia psychicznego i naturalniejszej interakcji człowiek-maszyna.

## Podstawy teorii emocji

### Model podstawowych emocji (Ekman)
Paul Ekman wyróżnił 6 emocji uniwersalnych kulturowo:
- **Radość** (Happiness)
- **Smutek** (Sadness)
- **Strach** (Fear)
- **Wstręt** (Disgust)
- **Gniew** (Anger)
- **Zaskoczenie** (Surprise)

### Model wymiarowy (Valence-Arousal)
Alternatywnie, emocje można opisać w przestrzeni 2D:
- **Valence** (ładunek) — oś pozytywny/negatywny
- **Arousal** (pobudzenie) — oś spokojny/podniecony

```
  HIGH AROUSAL
       │
Strach │ Radość
──────────────── VALENCE
Smutek │ Relaks
       │
  LOW AROUSAL
```

## Rozpoznawanie emocji z kamery

### MediaPipe Face Mesh — Android

MediaPipe udostępnia gotowe rozwiązania do analizy twarzy, działające on-device:

```kotlin
dependencies {
    implementation("com.google.mediapipe:tasks-vision:0.10.14")
}

class FaceAnalyzer(context: Context) {
    private val faceLandmarker: FaceLandmarker
    
    init {
        val options = FaceLandmarker.FaceLandmarkerOptions.builder()
            .setBaseOptions(BaseOptions.builder()
                .setModelAssetPath("face_landmarker.task")
                .build())
            .setRunningMode(RunningMode.LIVE_STREAM)
            .setNumFaces(1)
            .setOutputFaceBlendshapes(true)  // AU - Action Units
            .setResultListener { result, _ -> processResult(result) }
            .build()
        
        faceLandmarker = FaceLandmarker.createFromOptions(context, options)
    }
    
    private fun processResult(result: FaceLandmarkerResult) {
        // Blendshapes to współczynniki ruchu twarzy (0.0–1.0)
        result.faceBlendshapes().getOrNull(0)?.let { blendshapes ->
            val smileLeft = blendshapes.find { it.categoryName() == "mouthSmileLeft" }?.score() ?: 0f
            val smileRight = blendshapes.find { it.categoryName() == "mouthSmileRight" }?.score() ?: 0f
            val browDown = blendshapes.find { it.categoryName() == "browDownLeft" }?.score() ?: 0f
            
            val happinessScore = (smileLeft + smileRight) / 2f
            val angerScore = browDown
            
            Log.d("Emocje", "Radość: $happinessScore, Gniew: $angerScore")
        }
    }
    
    fun processFrame(imageProxy: ImageProxy) {
        val mpImage = BitmapImageBuilder(imageProxy.toBitmap()).build()
        faceLandmarker.detectAsync(mpImage, System.currentTimeMillis())
    }
}
```

### Action Units (AU) — FACS

Facial Action Coding System (FACS) Ekmana i Friesena opisuje ruchy twarzy przez jednostki akcji:

| AU | Opis | Emocja |
|----|------|--------|
| AU1+AU4 | Podniesienie wewnętrznych brwi | Smutek/Strach |
| AU6+AU12 | Uniesienie policzków + kąciki ust | Autentyczna radość (Duchenne smile) |
| AU4+AU5+AU7 | Zmarszczone brwi + uniesione powieki | Złość |
| AU1+AU2+AU5B | Podniesienie brwi + szeroko otwarte oczy | Strach/Zaskoczenie |

## Analiza głosu

Emocje można wykryć z tonu głosu (paralinguistics) bez rozumienia słów:

```python
# Na serwerze: Python + librosa do ekstrakcji cech głosowych
import librosa
import numpy as np

def extract_voice_features(audio_path: str) -> dict:
    y, sr = librosa.load(audio_path, sr=22050)
    
    # Podstawowe cechy
    features = {
        # Pitch (F0) — wysokość głosu
        'pitch_mean': np.mean(librosa.yin(y, fmin=50, fmax=400)),
        'pitch_std': np.std(librosa.yin(y, fmin=50, fmax=400)),
        
        # Energia — głośność
        'energy_mean': np.mean(librosa.feature.rms(y=y)),
        
        # MFCC — charakterystyka spektralna
        'mfcc': librosa.feature.mfcc(y=y, sr=sr, n_mfcc=13).mean(axis=1).tolist(),
        
        # Tempo mowy
        'tempo': librosa.beat.tempo(y=y, sr=sr)[0]
    }
    return features
```

```kotlin
// Na Android: nagrywanie i wysyłanie do API
class VoiceEmotionAnalyzer {
    private var mediaRecorder: MediaRecorder? = null
    
    fun startRecording(outputFile: String) {
        mediaRecorder = MediaRecorder(context).apply {
            setAudioSource(MediaRecorder.AudioSource.MIC)
            setOutputFormat(MediaRecorder.OutputFormat.MPEG_4)
            setAudioEncoder(MediaRecorder.AudioEncoder.AAC)
            setAudioSamplingRate(22050)
            setOutputFile(outputFile)
            prepare()
            start()
        }
    }
    
    suspend fun analyzeRecording(audioFile: File): EmotionResult {
        // Wyślij do API analizy emocji
        return apiService.analyzeVoiceEmotion(audioFile)
    }
}
```

## Biometryczne sygnały emocji

### PPG (PhotoPlethysmography)
Tylna kamera może mierzyć tętno przez detekcję zmian koloru skóry:

```kotlin
class PpgHeartRateDetector {
    private val windowSize = 30  // klatek (~1 sekunda przy 30fps)
    private val redChannelValues = mutableListOf<Float>()
    
    fun processFrame(bitmap: Bitmap): Float? {
        // Uśrednij czerwony kanał z centralnego regionu
        val centerX = bitmap.width / 2
        val centerY = bitmap.height / 2
        val region = Bitmap.createBitmap(bitmap, centerX - 20, centerY - 20, 40, 40)
        
        var redSum = 0f
        for (x in 0 until region.width) {
            for (y in 0 until region.height) {
                val pixel = region.getPixel(x, y)
                redSum += Color.red(pixel)
            }
        }
        val avgRed = redSum / (region.width * region.height)
        redChannelValues.add(avgRed)
        
        if (redChannelValues.size >= windowSize) {
            return calculateHeartRate(redChannelValues.toFloatArray())
        }
        return null
    }
    
    private fun calculateHeartRate(signal: FloatArray): Float {
        // FFT do wykrycia częstotliwości tętna (zakres: 0.8–3.3 Hz = 48–200 BPM)
        // Uproszczone: szukamy dominującej częstotliwości
        return 75f  // placeholder
    }
}
```

## Zastosowania w aplikacjach mobilnych

### 1. Aplikacje zdrowia psychicznego
```kotlin
// Dziennik nastroju z analizą twarzy
@Composable
fun MoodJournalScreen(viewModel: MoodViewModel) {
    val moodHistory by viewModel.moodHistory.collectAsStateWithLifecycle()
    
    Column {
        // Przycisk do analizy nastroju przez kamerę
        Button(onClick = { viewModel.captureMood() }) {
            Icon(Icons.Default.Face, contentDescription = null)
            Text("Oceń mój nastrój")
        }
        
        // Wykres nastroju w czasie
        MoodTimeline(entries = moodHistory)
    }
}
```

### 2. Adaptacyjny interfejs
Aplikacja może automatycznie dostosowywać treść do emocji użytkownika — np. muzyka na podstawie nastroju, lub powiadomienia wstrzymywane gdy użytkownik jest sfrustrowany.

### 3. Wsparcie dla osób z ASD
Aplikacje pomagające osobom z zaburzeniami ze spektrum autyzmu w rozpoznawaniu emocji innych ludzi.

## Etyka i prywatność

> **Ważne:** Przetwarzanie danych biometrycznych i emocjonalnych podlega surowym regulacjom prawnym.

- **RODO** (GDPR) — dane biometryczne to dane wrażliwe kategorii specjalnej (art. 9)
- Wymagana **explicita zgoda** użytkownika
- Przetwarzanie on-device zamiast w chmurze — chroni prywatność
- Prawo do informacji o profilowaniu emocjonalnym
- Unikaj manipulacyjnych zastosowań (np. targetowanie reklam na podstawie emocji)

## Linki

- [MediaPipe Face Landmarker](https://ai.google.dev/edge/mediapipe/solutions/vision/face_landmarker)
- [FACS — Facial Action Coding System](https://www.paulekman.com/facial-action-coding-system/)
- [MIT Affective Computing Group](https://affect.media.mit.edu/)
- [Android ML Kit — Face Detection](https://developers.google.com/ml-kit/vision/face-detection)
