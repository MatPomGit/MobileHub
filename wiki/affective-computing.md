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
- **Valence** (ładunek) - oś pozytywny/negatywny
- **Arousal** (pobudzenie) - oś spokojny/podniecony

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

### MediaPipe Face Mesh - Android

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

### Action Units (AU) - FACS

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
        # Pitch (F0) - wysokość głosu
        'pitch_mean': np.mean(librosa.yin(y, fmin=50, fmax=400)),
        'pitch_std': np.std(librosa.yin(y, fmin=50, fmax=400)),
        
        # Energia - głośność
        'energy_mean': np.mean(librosa.feature.rms(y=y)),
        
        # MFCC - charakterystyka spektralna
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
Aplikacja może automatycznie dostosowywać treść do emocji użytkownika - np. muzyka na podstawie nastroju, lub powiadomienia wstrzymywane gdy użytkownik jest sfrustrowany.

### 3. Wsparcie dla osób z ASD
Aplikacje pomagające osobom z zaburzeniami ze spektrum autyzmu w rozpoznawaniu emocji innych ludzi.

## Etyka i prywatność

> **Ważne:** Przetwarzanie danych biometrycznych i emocjonalnych podlega surowym regulacjom prawnym.

- **RODO** (GDPR) - dane biometryczne to dane wrażliwe kategorii specjalnej (art. 9)
- Wymagana **explicita zgoda** użytkownika
- Przetwarzanie on-device zamiast w chmurze - chroni prywatność
- Prawo do informacji o profilowaniu emocjonalnym
- Unikaj manipulacyjnych zastosowań (np. targetowanie reklam na podstawie emocji)

## Zbieranie danych afektywnych na urządzeniu mobilnym

### Multimodalność - wiele źródeł jednocześnie

Nowoczesne podejście do informatyki afektywnej łączy kilka kanałów danych jednocześnie (podejście **multimodalne**), ponieważ żaden pojedynczy sygnał nie jest w pełni wiarygodny:

| Sensor | Sygnał afektywny | Dokładność |
|--------|-----------------|------------|
| Kamera frontalna | Wyraz twarzy, mruganie, kierunek wzroku | Wysoka przy dobrym oświetleniu |
| Mikrofon | Ton głosu, tempo mowy, pauzy | Średnia (wrażliwa na hałas) |
| Akcelerometr/Żyroskop | Agitacja, drżenie rąk, pozycja ciała | Niska (pomocnicza) |
| Sensor tętna (Wear OS) | HR, HRV - stres fizjologiczny | Wysoka przy kontakcie ze skórą |
| Ekran dotykowy | Prędkość pisania, siła nacisku, błędy | Średnia |

### Przykład: Fusion danych z akcelerometru i kamery

```kotlin
class AffectiveDataFusion(
    private val faceAnalyzer: FaceAnalyzer,
    private val motionAnalyzer: MotionAnalyzer
) {
    data class FusedAffectState(
        val valence: Float,   // -1.0 (negatywny) do 1.0 (pozytywny)
        val arousal: Float,   // 0.0 (spokojny) do 1.0 (pobudzony)
        val confidence: Float
    )

    fun fuse(faceScore: FaceEmotionScore, motionScore: MotionScore): FusedAffectState {
        // Wysoka agitacja ruchowa wzmacnia arousal
        val combinedArousal = (faceScore.arousal * 0.7f) + (motionScore.agitation * 0.3f)
        // Valence pochodzi głównie z twarzy
        val combinedValence = faceScore.valence
        val confidence = if (faceScore.detectionConfidence > 0.8f) 0.9f else 0.5f

        return FusedAffectState(combinedValence, combinedArousal, confidence)
    }
}
```

### Prywatność i minimalizacja danych

Zbieranie danych afektywnych wiąże się z poważnymi obowiązkami:

- **Przetwarzanie on-device** - modele ML działające lokalnie (MediaPipe, TFLite) nie wysyłają obrazów do chmury
- **Nie przechowuj surowych danych biometrycznych** - zamiast obrazu twarzy zapisuj tylko wynikowy wektor emocji
- **Granularność zgody** - użytkownik powinien móc wyłączyć każdy kanał osobno (kamera, mikrofon)
- **Prawo do usunięcia** - historia emocji musi być możliwa do usunięcia na żądanie (RODO art. 17)

---

## Implementacja rozpoznawania wyrazu twarzy

### ML Kit Face Detection - szybkie wykrywanie

Google ML Kit oferuje lekkie API do wykrywania twarzy i podstawowych landmarków, dostępne offline:

```kotlin
// build.gradle.kts
dependencies {
    implementation("com.google.mlkit:face-detection:16.1.7")
}
```

```kotlin
class MlKitFaceEmotionDetector(private val context: Context) {

    private val detector: FaceDetector by lazy {
        val options = FaceDetectorOptions.Builder()
            .setPerformanceMode(FaceDetectorOptions.PERFORMANCE_MODE_FAST)
            .setLandmarkMode(FaceDetectorOptions.LANDMARK_MODE_ALL)
            .setClassificationMode(FaceDetectorOptions.CLASSIFICATION_MODE_ALL)
            .setMinFaceSize(0.15f)
            .enableTracking()
            .build()
        FaceDetection.getClient(options)
    }

    fun analyzeImage(imageProxy: ImageProxy): Task<List<Face>> {
        val mediaImage = imageProxy.image ?: return Tasks.forException(Exception("Brak obrazu"))
        val inputImage = InputImage.fromMediaImage(
            mediaImage,
            imageProxy.imageInfo.rotationDegrees
        )
        return detector.process(inputImage)
            .addOnSuccessListener { faces -> processFaces(faces) }
            .addOnFailureListener { e -> Log.e("MLKit", "Błąd detekcji", e) }
            .addOnCompleteListener { imageProxy.close() }
    }

    private fun processFaces(faces: List<Face>) {
        for (face in faces) {
            // ML Kit zwraca bezpośrednio prawdopodobieństwo uśmiechu i otwartych oczu
            val smiling = face.smilingProbability ?: continue
            val leftEyeOpen = face.leftEyeOpenProbability ?: 1f
            val rightEyeOpen = face.rightEyeOpenProbability ?: 1f

            val averageEyeOpen = (leftEyeOpen + rightEyeOpen) / 2f
            val emotion = when {
                smiling > 0.7f                    -> "Radość"
                averageEyeOpen < 0.2f             -> "Senność / Znudzenie"
                smiling < 0.2f && averageEyeOpen > 0.8f -> "Skupienie / Stres"
                else                              -> "Neutralny"
            }

            Log.d("Emocja", "Twarz ${face.trackingId}: $emotion (uśmiech=${smiling})")
        }
    }
}
```

### MediaPipe FaceLandmarker - zaawansowana analiza blendshapes

Kiedy potrzebujemy dokładniejszej analizy AU (Action Units), MediaPipe FaceLandmarker zwraca 52 współczynniki blendshapes. Oto kompletna integracja z CameraX:

```kotlin
@androidx.camera.core.ExperimentalGetImage
class FaceLandmarkerAnalyzer(
    context: Context,
    private val onEmotionDetected: (EmotionResult) -> Unit
) : ImageAnalysis.Analyzer {

    data class EmotionResult(
        val happiness: Float,
        val sadness: Float,
        val surprise: Float,
        val anger: Float,
        val neutral: Float
    )

    private val faceLandmarker: FaceLandmarker

    init {
        val baseOptions = BaseOptions.builder()
            .setModelAssetPath("face_landmarker.task")
            .setDelegate(Delegate.GPU)   // GPU accelerator gdy dostępny
            .build()

        val options = FaceLandmarker.FaceLandmarkerOptions.builder()
            .setBaseOptions(baseOptions)
            .setRunningMode(RunningMode.LIVE_STREAM)
            .setNumFaces(1)
            .setMinFaceDetectionConfidence(0.5f)
            .setMinTrackingConfidence(0.5f)
            .setOutputFaceBlendshapes(true)
            .setResultListener { result, _ ->
                mapBlendshapesToEmotion(result)?.let(onEmotionDetected)
            }
            .build()

        faceLandmarker = FaceLandmarker.createFromOptions(context, options)
    }

    override fun analyze(imageProxy: ImageProxy) {
        val bitmap = imageProxy.toBitmap()
        val mpImage = BitmapImageBuilder(bitmap).build()
        faceLandmarker.detectAsync(mpImage, System.currentTimeMillis())
        imageProxy.close()
    }

    private fun mapBlendshapesToEmotion(result: FaceLandmarkerResult): EmotionResult? {
        val bs = result.faceBlendshapes().getOrNull(0) ?: return null
        fun get(name: String) = bs.find { it.categoryName() == name }?.score() ?: 0f

        val smileL     = get("mouthSmileLeft")
        val smileR     = get("mouthSmileRight")
        val frownL     = get("mouthFrownLeft")
        val frownR     = get("mouthFrownRight")
        val browDownL  = get("browDownLeft")
        val browDownR  = get("browDownRight")
        val browUpL    = get("browOuterUpLeft")
        val jawOpen    = get("jawOpen")

        val happiness  = (smileL + smileR) / 2f
        val sadness    = (frownL + frownR) / 2f
        val anger      = (browDownL + browDownR) / 2f
        val surprise   = ((browUpL + jawOpen) / 2f).coerceAtMost(1f)
        val total      = happiness + sadness + anger + surprise
        val neutral    = (1f - total / 4f).coerceIn(0f, 1f)

        return EmotionResult(happiness, sadness, surprise, anger, neutral)
    }
}
```

---

## Frameworki i biblioteki

### Porównanie dostępnych narzędzi (Android)

| Biblioteka | Producent | Tryb | Blendshapes | Rozmiar modelu | Licencja |
|-----------|-----------|------|-------------|----------------|----------|
| **ML Kit Face Detection** | Google | On-device | ❌ (tylko uśmiech/oczy) | ~5 MB | Apache 2.0 |
| **MediaPipe FaceLandmarker** | Google | On-device | ✅ 52 AU | ~4 MB | Apache 2.0 |
| **TFLite + własny model** | Własny / Kaggle | On-device | Zależne od modelu | 1–20 MB | Zależy |
| **Microsoft Azure Face API** | Microsoft | Chmura | ✅ | - | Płatne |
| **AWS Rekognition** | Amazon | Chmura | ✅ | - | Płatne |

### TensorFlow Lite - własny model klasyfikacji emocji

Gdy gotowe rozwiązania są niewystarczające, można wdrożyć własny model TFLite wytrenowany na zbiorze np. FER-2013:

```kotlin
class TfLiteEmotionClassifier(context: Context) {

    private val interpreter: Interpreter
    private val labels = listOf("Gniew", "Wstręt", "Strach", "Radość", "Smutek", "Zaskoczenie", "Neutralny")

    init {
        val modelBuffer = FileUtil.loadMappedFile(context, "emotion_model.tflite")
        val options = Interpreter.Options().apply {
            numThreads = 4
            useNNAPI = true   // Neural Networks API na obsługiwanych urządzeniach
        }
        interpreter = Interpreter(modelBuffer, options)
    }

    fun classify(faceBitmap: Bitmap): Map<String, Float> {
        // Model oczekuje obrazu 48x48 w skali szarości znormalizowanego do [-1, 1]
        val resized = Bitmap.createScaledBitmap(faceBitmap, 48, 48, true)
        val input = Array(1) { Array(48) { FloatArray(48) } }

        for (y in 0 until 48) {
            for (x in 0 until 48) {
                val pixel = resized.getPixel(x, y)
                val gray = (Color.red(pixel) * 0.299f +
                            Color.green(pixel) * 0.587f +
                            Color.blue(pixel) * 0.114f)
                input[0][y][x] = (gray / 127.5f) - 1f
            }
        }

        val output = Array(1) { FloatArray(7) }
        interpreter.run(input, output)

        return labels.zip(output[0].toList()).toMap()
    }

    fun close() = interpreter.close()
}
```

---

## Szczegółowe zastosowania w aplikacjach mobilnych

### Aplikacje zdrowia psychicznego

Przykładowe aplikacje takie jak **Wysa**, **Woebot** czy **Youper** stosują analizę tekstu i głosu do monitorowania nastroju. Kluczowe wzorce implementacyjne:

- **Dziennik nastroju** - użytkownik ocenia samopoczucie, a aplikacja uzupełnia wpis analizą mimiki z kamery
- **Wykrywanie kryzysu** - algorytm alarmuje, gdy analiza sentymentu wskazuje na epizody depresyjne przez kilka dni z rzędu
- **Adaptacja treści CBT** - ćwiczenia terapii poznawczo-behawioralnej dobierane na podstawie wykrytej emocji

```kotlin
// Przykład: zapis wpisu nastroju ze zdjęciem
data class MoodEntry(
    val timestamp: Long = System.currentTimeMillis(),
    val userRating: Int,           // 1–5, ocena użytkownika
    val detectedHappiness: Float,  // wynik modelu ML
    val detectedValence: Float,
    val note: String = ""
)

class MoodRepository(private val dao: MoodDao) {
    suspend fun saveEntry(entry: MoodEntry) = dao.insert(entry)

    fun getWeeklyTrend(): Flow<List<MoodEntry>> =
        dao.getEntriesSince(System.currentTimeMillis() - 7 * 24 * 3600 * 1000L)
}
```

### Edukacja - adaptacyjne systemy nauczania

Systemy e-learningowe na urządzeniach mobilnych mogą reagować na stan emocjonalny ucznia:

- **Wykrywanie znudzenia** - gdy wskaźnik zaangażowania spada (mruganie, brak ruchu oczu), materiał jest upraszczany lub dodawana jest interaktywna przerwa
- **Wykrywanie frustracji** - kiedy uczeń popełnia wiele błędów, a analiza twarzy wskazuje na napięcie, system oferuje dodatkowe wyjaśnienie
- **Raport dla nauczyciela** - anonimowe statystyki emocji klasy pomagają nauczycielowi zrozumieć trudne partie materiału

### Fitness i wellbeing

Aplikacje sportowe mogą korelować nastrój z wynikami treningu:

- Przed treningiem - analiza gotowości (HRV + wyraz twarzy)
- W trakcie - wykrywanie przemęczenia na podstawie kamery/akcelerometru
- Po treningu - porównanie nastroju przed i po aktywności fizycznej (dokumentowanie efektu endorfin)

---

## Wyzwania etyczne

### Bias w rozpoznawaniu emocji

Modele trenowane głównie na danych z Zachodu wykazują znaczące różnice dokładności:

- **Rasowy bias** - wiele klasycznych zbiorów (np. JAFFE, Cohn-Kanade) jest zdominowanych przez określone grupy etniczne, co prowadzi do wyższego błędu dla osób o ciemniejszej karnacji
- **Płciowy bias** - modele częściej klasyfikują kobiety jako „zadowolone", a mężczyzn jako „gniewnych", powielając stereotypy społeczne
- **Wiekowy bias** - niska dokładność dla seniorów i dzieci, dla których wzorce mimiki różnią się od dorosłych

> **Zalecenie**: Przed wdrożeniem modelu przeprowadź audyt bias na reprezentatywnej próbie użytkowników docelowych.

### Różnice kulturowe w wyrażaniu emocji

Wbrew teorii Ekmana, badania pokazują, że ekspresja emocji ma istotny komponent kulturowy:

- W kulturach wschodnioazjatyckich tłumienie ekspresji zewnętrznej jest normą społeczną, co obniża skuteczność modeli zachodnich
- Uśmiech uprzejmości (social smile) jest w Japonii powszechny w sytuacjach stresu - model może błędnie klasyfikować go jako radość
- Kontakt wzrokowy jako sygnał emocjonalny różni się między kulturami

### Zgoda i transparentność

- **Informed consent** - użytkownik musi rozumieć, że aplikacja analizuje jego emocje, a nie tylko „twarz"
- **Prawo do odmowy** - podstawowa funkcjonalność aplikacji nie może być uzależniona od zgody na analizę emocji
- **Wyjaśnialność** - użytkownik powinien mieć wgląd w to, jakie emocje zostały wykryte i jak wpłynęły na zachowanie aplikacji
- **Zakaz manipulacji** - dane emocjonalne nie mogą być używane do wyświetlania reklam w momentach podatności emocjonalnej (np. smutku)

### Regulacje prawne

- **RODO art. 9** - dane biometryczne i zdrowotne jako dane wrażliwe kategorii specjalnej; przetwarzanie wymaga wyraźnej zgody lub innej szczególnej podstawy prawnej
- **AI Act (UE)** - systemy rozpoznawania emocji w miejscach publicznych są objęte wysokimi wymogami przejrzystości; niektóre zastosowania są całkowicie zakazane (np. analiza emocji pracowników w celu oceny wydajności)
- **CCPA (Kalifornia)** - prawo do opt-out z profilowania na podstawie danych biometrycznych

---

## Linki

- [MediaPipe Face Landmarker](https://ai.google.dev/edge/mediapipe/solutions/vision/face_landmarker)
- [FACS - Facial Action Coding System](https://www.paulekman.com/facial-action-coding-system/)
- [MIT Affective Computing Group](https://affect.media.mit.edu/)
- [Android ML Kit - Face Detection](https://developers.google.com/ml-kit/vision/face-detection)
- [TensorFlow Lite - klasyfikacja emocji](https://www.tensorflow.org/lite/examples)
- [FER-2013 - zbiór danych do trenowania modeli emocji](https://www.kaggle.com/datasets/msambare/fer2013)
- [EU AI Act - tekst rozporządzenia](https://artificialintelligenceact.eu/)
