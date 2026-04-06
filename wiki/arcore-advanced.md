# ARCore — Zaawansowane techniki

ARCore (Android) umożliwia tworzenie rozbudowanych aplikacji AR: rozpoznawanie płaszczyzn, śledzenie obiektów 3D, efekty oświetlenia i interaktywne nakładki. Biblioteka Sceneform i nowszy SceneView upraszczają renderowanie 3D w Compose.

## Kluczowe koncepcje ARCore

ARCore opiera się na kilku wzajemnie powiązanych modułach, które razem tworzą kompletny system rozszerzonej rzeczywistości. Poniższy diagram przedstawia główne składniki sesji ARCore i ich rolę: śledzenie ruchu urządzenia w 6 stopniach swobody, rozumienie otoczenia (wykrywanie płaszczyzn, głębia) oraz rozpoznawanie obrazów-markerów. Zrozumienie tej architektury jest kluczowe przed przystąpieniem do implementacji jakiejkolwiek funkcji AR.

```
┌─────────────────────────────────────────────────────────┐
│                   ARCore Session                         │
│                                                          │
│  ┌──────────────┐  ┌──────────────┐  ┌───────────────┐ │
│  │  Motion      │  │  Environmental│  │  Augmented    │ │
│  │  Tracking    │  │  Understanding│  │  Images       │ │
│  │  (6DoF pose) │  │  (planes,     │  │  (image       │ │
│  │              │  │   depth)      │  │   markers)    │ │
│  └──────────────┘  └──────────────┘  └───────────────┘ │
│                                                          │
│  ┌──────────────┐  ┌──────────────┐                     │
│  │  Anchors     │  │  Light       │                     │
│  │  (stałe      │  │  Estimation  │                     │
│  │   punkty AR) │  │  (HDR)       │                     │
│  └──────────────┘  └──────────────┘                     │
└─────────────────────────────────────────────────────────┘
```

## SceneView + Compose — ARScene

Biblioteka SceneView integruje ARCore bezpośrednio z Jetpack Compose, eliminując potrzebę ręcznego zarządzania sesją ARCore i cyklem życia widoku. Poniższy przykład pokazuje kompletny ekran AR z obsługą gestów dotykowych, umieszczaniem modeli 3D na wykrytych płaszczyznach oraz wyświetlaniem komunikatów o problemach z śledzeniem. Jest to punkt wyjścia dla większości aplikacji AR opartych na Compose.

```kotlin
dependencies {
    implementation("io.github.sceneview:arsceneview:2.2.1")
}

@Composable
fun ARSceneScreen() {
    val engine     = rememberEngine()
    val modelLoader = rememberModelLoader(engine)
    val materialLoader = rememberMaterialLoader(engine)
    val cameraNode  = rememberARCameraNode(engine)
    val childNodes  = rememberNodes()
    val view        = rememberView(engine)
    val collisionSystem = rememberCollisionSystem(view)

    var planeRenderer by remember { mutableStateOf(true) }
    var trackingFailureReason by remember { mutableStateOf<TrackingFailureReason?>(null) }

    ARScene(
        modifier = Modifier.fillMaxSize(),
        engine = engine,
        view = view,
        modelLoader = modelLoader,
        collisionSystem = collisionSystem,
        sessionFeatures = setOf(),
        cameraNode = cameraNode,
        childNodes = childNodes,
        planeRenderer = planeRenderer,
        onTrackingFailureChanged = { reason ->
            trackingFailureReason = reason
            planeRenderer = reason == null
        },
        onSessionUpdated = { session, frame ->
            // Wywoływane co klatkę ~60fps
        },
        onGestureListener = rememberOnGestureListener(
            onSingleTapConfirmed = { motionEvent, node ->
                if (node == null) {
                    // Trafiono w płaszczyznę — umieść model
                    val hitTestResult = frame?.hitTest(motionEvent)
                    hitTestResult?.firstOrNull()?.let { hit ->
                        val anchor = hit.createAnchor()
                        val anchorNode = AnchorNode(engine, anchor).also {
                            it.isEditable = true
                            childNodes += it
                        }
                        modelLoader.loadModelInstance("models/robot.glb")?.let { model ->
                            ModelNode(
                                modelInstance = model,
                                scaleToUnits = 0.3f  // 30cm w rzeczywistości
                            ).also { anchorNode.addChildNode(it) }
                        }
                    }
                }
            }
        )
    )

    // Instrukcja dla użytkownika
    if (trackingFailureReason != null) {
        Box(Modifier.fillMaxSize(), Alignment.Center) {
            Text(
                text = trackingFailureReason?.let { reasonToMessage(it) } ?: "",
                style = MaterialTheme.typography.bodyLarge,
                color = Color.White,
                modifier = Modifier
                    .background(Color.Black.copy(0.6f), RoundedCornerShape(8.dp))
                    .padding(16.dp)
            )
        }
    }
}

fun reasonToMessage(reason: TrackingFailureReason) = when (reason) {
    TrackingFailureReason.NONE                    -> ""
    TrackingFailureReason.BAD_STATE               -> "Wewnętrzny błąd ARCore"
    TrackingFailureReason.INSUFFICIENT_LIGHT      -> "Za mało światła — rozjaśnij otoczenie"
    TrackingFailureReason.EXCESSIVE_MOTION        -> "Zbyt szybki ruch — zwolnij"
    TrackingFailureReason.INSUFFICIENT_FEATURES   -> "Za mało szczegółów — skieruj na bardziej zróżnicowaną powierzchnię"
    TrackingFailureReason.CAMERA_UNAVAILABLE      -> "Kamera niedostępna"
    else                                           -> "Nieznany błąd śledzenia"
}
```

## Augmented Images — śledzenie obrazów-markerów

Augmented Images pozwala aplikacji rozpoznawać wcześniej zdefiniowane obrazy (plakaty, okładki, etykiety) w widoku kamery i nakładać na nie treści AR. Każdy obraz należy zarejestrować w bazie danych razem z jego rzeczywistą szerokością, co umożliwia precyzyjne określenie skali i pozycji. Poniższy kod pokazuje konfigurację bazy obrazów oraz obsługę różnych stanów śledzenia podczas działania aplikacji.

```kotlin
// Konfiguracja bazy obrazów (wykonaj raz)
fun setupAugmentedImageDatabase(session: Session, context: Context): Boolean {
    val database = AugmentedImageDatabase(session)

    // Dodaj obrazy z assets — każdy musi mieć znany rozmiar fizyczny
    val images = listOf(
        "poster_front.jpg" to 0.20f,   // plakat 20cm szerokości
        "business_card.jpg" to 0.085f, // wizytówka 8.5cm
        "product_label.jpg" to 0.10f
    )

    images.forEach { (assetName, widthMeters) ->
        context.assets.open(assetName).use { stream ->
            val bitmap = BitmapFactory.decodeStream(stream)
            database.addImage(assetName.removeSuffix(".jpg"), bitmap, widthMeters)
        }
    }

    val config = session.config
    config.augmentedImageDatabase = database
    session.configure(config)
    return true
}

// Obsługa wykrytych obrazów w pętli klatek
fun onSessionUpdated(session: Session, frame: Frame) {
    frame.getUpdatedTrackables(AugmentedImage::class.java).forEach { image ->
        when (image.trackingState) {
            TrackingState.TRACKING -> {
                when (image.trackingMethod) {
                    AugmentedImage.TrackingMethod.FULL_TRACKING -> {
                        // Pełne śledzenie — anchor na centrum obrazu
                        val anchor = image.createAnchor(image.centerPose)
                        placeInfoPanel(anchor, image.name)
                    }
                    AugmentedImage.TrackingMethod.LAST_KNOWN_POSE -> {
                        // Obraz poza kadrem — kontynuuj z ostatnią pozycją
                    }
                    else -> {}
                }
            }
            TrackingState.STOPPED -> removeInfoPanel(image.name)
            else -> {}
        }
    }
}
```

## Depth API — głębia sceny

Depth API dostarcza informacje o odległości obiektów od kamery jako obraz 16-bitowy (wartości w milimetrach), co umożliwia realistyczne zasłanianie obiektów wirtualnych przez rzeczywiste przeszkody. Nie wszystkie urządzenia obsługują dedykowany czujnik głębi, dlatego przed użyciem należy sprawdzić dostępność tej funkcji. Poniższy kod prezentuje weryfikację wsparcia oraz odczyt głębokości z centrum kadru.

```kotlin
// Sprawdź wsparcie dla Depth API
fun isDepthSupported(session: Session): Boolean {
    val filter = CameraConfigFilter(session)
    filter.depthSensorUsage = EnumSet.of(CameraConfig.DepthSensorUsage.REQUIRE_AND_USE)
    return session.getSupportedCameraConfigs(filter).isNotEmpty()
}

// Pobierz obraz głębi
fun processDepthFrame(frame: Frame) {
    try {
        val depthImage = frame.acquireDepthImage16Bits()
        val width = depthImage.width   // np. 240
        val height = depthImage.height // np. 180

        val buffer = depthImage.planes[0].buffer.asShortBuffer()
        // Każdy piksel = głębokość w milimetrach (0 = nieznana)
        val centerDepth = buffer.get((height / 2) * width + width / 2) / 1000f  // w metrach
        Log.d("Depth", "Głębokość centrum: ${"%.2f".format(centerDepth)}m")

        depthImage.close()  // ZAWSZE zwolnij!
    } catch (e: NotYetAvailableException) {
        // Depth nie gotowy jeszcze w tej klatce
    }
}
```

## Light Estimation — realistyczne oświetlenie

Jednym z największych wyzwań w AR jest naturalne wkomponowanie obiektów wirtualnych w oświetlenie rzeczywistego środowiska. ARCore szacuje warunki oświetleniowe na podstawie obrazu z kamery i dostarcza dane HDR (główny kierunek światła, sferyczne harmoniki otoczenia oraz mapę środowiska), które można zastosować do modeli 3D. Dzięki temu wirtualne obiekty rzucają cienie i reagują na światło identycznie jak prawdziwe przedmioty.

```kotlin
// Pobierz informacje o oświetleniu otoczenia
fun applyLightEstimation(frame: Frame, modelNode: ModelNode) {
    val lightEstimate = frame.lightEstimate
    if (lightEstimate.state != LightEstimate.State.VALID_FULL_ESTIMATION) return

    // HDR Environment Map
    val environmentalHdrMainLightIntensity = lightEstimate.environmentalHdrMainLightIntensity
    val environmentalHdrAmbientSphericalHarmonics = lightEstimate.environmentalHdrAmbientSphericalHarmonics
    val environmentalHdrCubemap = lightEstimate.acquireEnvironmentalHdrCubeMap()

    // Zastosuj do sceny — SceneView robi to automatycznie gdy environmentalHdrReflections = true
    modelNode.setShadowReceiver(true)
    modelNode.setShadowCaster(true)

    environmentalHdrCubemap?.close()
}
```

## Cloud Anchors — wspólne AR między urządzeniami

Cloud Anchors umożliwiają współdzielenie punktów zakotwiczenia AR między wieloma urządzeniami — jeden użytkownik hostuje kotwicę w chmurze Google, a inni mogą ją odtworzyć za pomocą unikalnego identyfikatora (np. przekazanego przez QR kod). Jest to podstawa wieloosobowych doświadczeń AR, takich jak wspólne gry czy współpraca w wizualizacjach przestrzennych. Poniższy kod pokazuje zarówno hosting nowej kotwicy, jak i jej odtworzenie na innym urządzeniu.

```kotlin
// Resolve istniejącego Cloud Anchor (np. z QR kodu)
fun resolveCloudAnchor(session: Session, cloudAnchorId: String,
                        onResolved: (Anchor) -> Unit, onError: (String) -> Unit) {
    session.resolveCloudAnchorAsync(cloudAnchorId) { anchor, state ->
        when (state) {
            CloudAnchorState.SUCCESS        -> onResolved(anchor)
            CloudAnchorState.ERROR_NOT_AUTHORIZED -> onError("Brak autoryzacji")
            CloudAnchorState.ERROR_RESOURCE_EXHAUSTED -> onError("Limit wyczerpany")
            else -> onError("Błąd: $state")
        }
    }
}

// Host nowego Cloud Anchor (wymaga API key)
fun hostCloudAnchor(session: Session, anchor: Anchor,
                     onHosted: (String) -> Unit, onError: (String) -> Unit) {
    val ttlDays = 1
    session.hostCloudAnchorAsync(anchor, ttlDays) { cloudAnchor, state ->
        when (state) {
            CloudAnchorState.SUCCESS -> onHosted(cloudAnchor.cloudAnchorId)
            else -> onError("Hosting nieudany: $state")
        }
    }
}
```

## Nagrywanie sesji AR — ARCore Recording & Playback API

ARCore Recording & Playback API umożliwia nagrywanie pełnej sesji AR do pliku MP4 i późniejsze odtwarzanie jej jakby była rzeczywistą kamerą. To potężne narzędzie dla deweloperów: zamiast szukać specyficznego oświetlenia lub powierzchni podczas debugowania, możesz nagrać problematyczną sesję i odtwarzać ją wielokrotnie.

### Zastosowania

- **Raportowanie błędów** — deweloper nagrywa sesję pokazującą błąd i dołącza plik do zgłoszenia
- **Testy CI** — automatyczne testy AR uruchamiane na nagraniach zamiast na fizycznym urządzeniu
- **Demonstracje** — prezentacja AR bez konieczności fizycznego bycia w konkretnym miejscu
- **Benchmarking** — pomiar wydajności na identycznej sekwencji klatek

### Nagrywanie sesji

```kotlin
import com.google.ar.core.RecordingConfig
import com.google.ar.core.RecordingStatus

class ARSessionRecorder(private val session: Session) {

    fun startRecording(outputUri: Uri): Boolean {
        val config = RecordingConfig(session).apply {
            setMp4DatasetUri(outputUri)
            setAutoStopOnPause(false)  // kontynuuj nagrywanie gdy app schodzi w tło
        }

        return try {
            session.startRecording(config)
            true
        } catch (e: RecordingFailedException) {
            Log.e("ARRecorder", "Nie można rozpocząć nagrywania: ${e.message}")
            false
        }
    }

    fun stopRecording(): RecordingStatus {
        session.stopRecording()
        return session.recordingStatus
        // RecordingStatus.OK — nagranie zapisane
        // RecordingStatus.IO_ERROR — błąd zapisu
    }

    fun isRecording(): Boolean =
        session.recordingStatus == RecordingStatus.OK
}
```

### Odtwarzanie sesji (Playback)

```kotlin
class ARSessionPlayback(private val session: Session) {

    fun startPlayback(datasetUri: Uri): Boolean {
        return try {
            // Ustaw URI PRZED wznowieniem sesji (przed session.resume())
            session.setPlaybackDatasetUri(datasetUri)
            true
        } catch (e: PlaybackFailedException) {
            Log.e("ARPlayback", "Błąd playback: ${e.message}")
            false
        }
    }

    fun getPlaybackStatus(): PlaybackStatus = session.playbackStatus
    // PlaybackStatus.OK — odtwarzanie aktywne
    // PlaybackStatus.FINISHED — sekwencja zakończona
    // PlaybackStatus.NONE — brak aktywnego playbacku
}
```

> **Ważne:** podczas odtwarzania ARCore ignoruje fizyczną kamerę — widok pochodzi z nagrania. Gesty i interakcja użytkownika działają normalnie, ale śledzenie jest oparte na danych z pliku MP4.

---

## Raw Depth a Smoothed Depth — różnice i zastosowania

ARCore Depth API dostarcza dwa typy obrazów głębi, każdy zoptymalizowany pod inne zastosowania. Wybór właściwego bezpośrednio wpływa na jakość efektów AR i wydajność aplikacji.

### Porównanie

| Właściwość | Raw Depth (`acquireRawDepthImage16Bits`) | Smoothed Depth (`acquireDepthImage16Bits`) |
|---|---|---|
| **Opóźnienie** | Niższe (~1 klatka) | Wyższe (akumulacja wielu klatek) |
| **Szum** | Wyższy (wartości skaczą) | Niższy (wygładzony temporalnie) |
| **Kompletność** | Niepełna — wiele pikseli = 0 | Pełniejsza — luki wypełnione |
| **Accuracy** | ±5–10 cm | ±2–5 cm |
| **Zastosowanie** | Okludowanie, real-time effects | Pomiary, skanowanie 3D |

### Kiedy używać Raw Depth?

Raw Depth jest lepszy gdy **ważna jest latencja** i dopuszczamy pewien szum:

```kotlin
fun processRawDepth(frame: Frame) {
    try {
        // Raw depth — szybszy, bardziej aktualny, ale z lukami (wartość 0 = nieznana)
        val rawDepthImage = frame.acquireRawDepthImage16Bits()
        val confidenceImage = frame.acquireRawDepthConfidenceImage()

        val depthBuffer = rawDepthImage.planes[0].buffer.asShortBuffer()
        val confidenceBuffer = confidenceImage.planes[0].buffer

        val width = rawDepthImage.width
        val height = rawDepthImage.height

        // Okludowanie obiektów wirtualnych — porównuj z głębią wirtualną
        for (y in 0 until height) {
            for (x in 0 until width) {
                val depthMm = depthBuffer.get(y * width + x).toInt() and 0xFFFF
                val confidence = confidenceBuffer.get(y * width + x).toInt() and 0xFF

                if (depthMm > 0 && confidence > 127) {  // tylko pewne piksele
                    val depthMeters = depthMm / 1000f
                    // Użyj do testu zasłaniania obiektu wirtualnego
                }
            }
        }

        rawDepthImage.close()
        confidenceImage.close()
    } catch (e: NotYetAvailableException) { /* pomiń klatkę */ }
}
```

### Kiedy używać Smoothed Depth?

Smoothed Depth jest lepszy gdy **potrzebna jest dokładność** i możemy zaakceptować opóźnienie:

```kotlin
fun measureDistance(frame: Frame, screenX: Float, screenY: Float): Float? {
    return try {
        // Smoothed depth — dokładniejszy, spójny temporalnie
        val depthImage = frame.acquireDepthImage16Bits()
        val width = depthImage.width
        val height = depthImage.height

        val pixelX = (screenX / /* screenWidth */ 1080f * width).toInt().coerceIn(0, width - 1)
        val pixelY = (screenY / /* screenHeight */ 1920f * height).toInt().coerceIn(0, height - 1)

        val buffer = depthImage.planes[0].buffer.asShortBuffer()
        val depthMm = buffer.get(pixelY * width + pixelX).toInt() and 0xFFFF
        depthImage.close()

        if (depthMm > 0) depthMm / 1000f else null  // zwróć w metrach
    } catch (e: NotYetAvailableException) { null }
}
```

> **Reguła praktyczna:** użyj **Raw Depth** do efektów wizualnych w czasie rzeczywistym (okludowanie, cienie), a **Smoothed Depth** do pomiarów, eksportu siatek 3D i wyświetlania dokładnych odległości użytkownikowi.

## Linki

- [ARCore Docs](https://developers.google.com/ar/develop/java/quickstart)
- [SceneView GitHub](https://github.com/SceneView/sceneview-android)
- [ARCore Samples](https://github.com/google-ar/arcore-android-sdk/tree/master/samples)
- [Poly (modele 3D)](https://poly.pizza/)
