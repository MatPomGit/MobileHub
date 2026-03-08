# ARCore — Zaawansowane Techniki

ARCore (Android) umożliwia tworzenie rozbudowanych aplikacji AR: rozpoznawanie płaszczyzn, śledzenie obiektów 3D, efekty oświetlenia i interaktywne nakładki. Biblioteka Sceneform i nowszy SceneView upraszczają renderowanie 3D w Compose.

## Kluczowe koncepcje ARCore

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

## Linki

- [ARCore Docs](https://developers.google.com/ar/develop/java/quickstart)
- [SceneView GitHub](https://github.com/SceneView/sceneview-android)
- [ARCore Samples](https://github.com/google-ar/arcore-android-sdk/tree/master/samples)
- [Poly (modele 3D)](https://poly.pizza/)
