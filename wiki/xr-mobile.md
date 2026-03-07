# Programowanie Aplikacji Mobilnych XR

XR (Extended Reality) to termin zbiorczy dla trzech typów rozszerzonej rzeczywistości: **AR** (Augmented Reality), **VR** (Virtual Reality) i **MR** (Mixed Reality). Smartfony są najpowszechniejszą platformą AR — każdy nowoczesny telefon ma kamerę i wystarczającą moc obliczeniową.

## Spektrum XR

```
Rzeczywistość ←────────────────────────────→ Wirtualność
     │                                              │
    AR                MR                           VR
(świat real    (realne + wirtualne      (pełna immersja,
 + nakładki)    interaktywnie)           brak świata real)
   Snapchat    HoloLens, ARKit         Quest 3, PSVR2
   Google Maps  Magic Leap
```

## ARCore (Android)

ARCore to SDK Google do tworzenia aplikacji AR na Androidzie. Dostarcza trzy kluczowe możliwości:

1. **Motion tracking** — śledzenie pozycji telefonu w przestrzeni 6DOF (Six Degrees of Freedom)
2. **Environmental understanding** — wykrywanie płaskich powierzchni (podłoga, stół, ściany)
3. **Light estimation** — szacowanie oświetlenia otoczenia dla realistycznego renderowania

### Konfiguracja ARCore

```kotlin
dependencies {
    implementation("com.google.ar:core:1.46.0")
    implementation("io.github.sceneview:arsceneview:2.2.1")
}
```

```kotlin
// Minimalna scena AR z ARSceneView
@Composable
fun ArScreen() {
    val engine = rememberEngine()
    val modelLoader = rememberModelLoader(engine)
    val cameraNode = rememberARCameraNode(engine)
    var childNodes by remember { mutableStateOf(emptyList<Node>()) }
    
    ARScene(
        modifier = Modifier.fillMaxSize(),
        engine = engine,
        modelLoader = modelLoader,
        cameraNode = cameraNode,
        childNodes = childNodes,
        onSessionUpdated = { session, frame ->
            // Wywołane co klatkę — tutaj logika AR
        },
        onGestureListener = rememberOnGestureListener(
            onSingleTapConfirmed = { motionEvent, node ->
                // Gdy użytkownik tapnie w ekran
                if (node == null) {
                    // Tapnięto w pustą przestrzeń — umieść obiekt na płaszczyźnie
                    val hitResult = frame?.hitTest(motionEvent)?.firstOrNull()
                    hitResult?.let { hit ->
                        val anchor = hit.createAnchor()
                        childNodes = childNodes + AnchorNode(engine, anchor).apply {
                            addChildNode(
                                modelLoader.createModelNode("models/robot.glb")
                            )
                        }
                    }
                }
            }
        )
    )
}
```

### Wykrywanie płaszczyzn

```kotlin
session.update().let { frame ->
    // Pobierz wszystkie wykryte płaszczyzny
    session.getAllTrackables(Plane::class.java).forEach { plane ->
        when (plane.type) {
            Plane.Type.HORIZONTAL_UPWARD_FACING -> {
                // Podłoga/stół — narysuj siatkę
                renderPlaneOverlay(plane)
            }
            Plane.Type.VERTICAL -> {
                // Ściana
            }
            else -> {}
        }
    }
}
```

## ARKit (iOS)

ARKit to odpowiednik ARCore od Apple, dostępny od iOS 11. Oferuje podobne możliwości, ale często lepszą jakość dzięki integracji z lidar w iPhone Pro.

```swift
import ARKit
import RealityKit

class ARViewController: UIViewController {
    @IBOutlet var arView: ARView!
    
    override func viewDidLoad() {
        super.viewDidLoad()
        
        // Konfiguracja AR
        let config = ARWorldTrackingConfiguration()
        config.planeDetection = [.horizontal, .vertical]
        config.environmentTexturing = .automatic
        
        // Na iPhone 12 Pro+ z LiDAR: Scene Reconstruction
        if ARWorldTrackingConfiguration.supportsSceneReconstruction(.mesh) {
            config.sceneReconstruction = .mesh
        }
        
        arView.session.run(config)
        
        // Dodaj gesty
        let tapGesture = UITapGestureRecognizer(target: self, action: #selector(handleTap))
        arView.addGestureRecognizer(tapGesture)
    }
    
    @objc func handleTap(_ recognizer: UITapGestureRecognizer) {
        let location = recognizer.location(in: arView)
        
        // Raycast — znajdź punkt na powierzchni
        guard let result = arView.raycast(
            from: location,
            allowing: .estimatedPlane,
            alignment: .horizontal
        ).first else { return }
        
        // Załaduj i umieść model 3D
        let anchor = AnchorEntity(world: result.worldTransform)
        
        Task {
            let model = try await ModelEntity.loadModel(named: "toy_robot")
            model.scale = SIMD3(0.01, 0.01, 0.01)
            anchor.addChild(model)
            arView.scene.addAnchor(anchor)
        }
    }
}
```

## Scapy i formaty modeli 3D

AR wymaga modeli 3D. Popularne formaty:

| Format | Opis | Platformy |
|--------|------|-----------|
| **.glb** | Binary glTF 2.0 | ARCore, Three.js, powszechny |
| **.gltf** | JSON glTF 2.0 | Web, ARCore |
| **.usdz** | Universal Scene Description (Apple) | ARKit, Pixar |
| **.fbx** | Filmbox — Autodesk | Edytory 3D |
| **.obj** | Wavefront OBJ | Legacy, prosty |

## Image Tracking — AR z markerami

```kotlin
// ARCore: śledzenie obrazów (np. plakatów, produktów)
val augmentedImageDatabase = AugmentedImageDatabase(session)
val bitmap = BitmapFactory.decodeAsset(context.assets, "target_image.jpg")
augmentedImageDatabase.addImage("poster", bitmap, 0.2f)  // 20cm szerokości

val config = ArConfig(session)
config.augmentedImageDatabase = augmentedImageDatabase
session.configure(config)

// W pętli aktualizacji
session.getAllTrackables(AugmentedImage::class.java).forEach { image ->
    if (image.trackingState == TrackingState.TRACKING) {
        // Obraz wykryty — umieść model nad nim
        placeModelAt(image.centerPose, "models/info_panel.glb")
    }
}
```

## WebXR — AR w przeglądarce

WebXR API pozwala tworzyć AR bezpośrednio w przeglądarce mobilnej (Chrome na Android):

```javascript
// Sprawdź obsługę WebXR
if (!navigator.xr) {
    console.log('WebXR nie jest obsługiwane');
    return;
}

// Sprawdź AR
const supported = await navigator.xr.isSessionSupported('immersive-ar');

if (supported) {
    const session = await navigator.xr.requestSession('immersive-ar', {
        requiredFeatures: ['hit-test'],
        optionalFeatures: ['dom-overlay'],
        domOverlay: { root: document.getElementById('overlay') }
    });
    
    // Inicjalizuj WebGL/Three.js
    const renderer = new THREE.WebGLRenderer({ alpha: true });
    renderer.xr.enabled = true;
    renderer.xr.setSession(session);
}
```

## Google Cardboard / GearVR — mobilne VR

Proste VR mobilne wyświetla dwie sceny (stereo) na ekranie telefonu:

```kotlin
// Google Cardboard SDK
dependencies {
    implementation("com.google.cardboard:cardboard:1.24.0")
}

class VrActivity : AppCompatActivity() {
    private lateinit var cardboardView: CardboardView
    
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        
        cardboardView = CardboardView(this)
        cardboardView.setRenderer(MyVrRenderer())
        setContentView(cardboardView)
    }
    
    override fun onCardboardTrigger() {
        // Fizyczny trigger gogli (magnes lub przycisk)
        handleInteraction()
    }
}
```

## Linki

- [ARCore — Google Developers](https://developers.google.com/ar)
- [ARKit — Apple Developer](https://developer.apple.com/augmented-reality/arkit/)
- [SceneView — AR/3D for Android](https://github.com/SceneView/sceneview-android)
- [Poly Pizza — darmowe modele 3D](https://poly.pizza)
- [WebXR Device API](https://developer.mozilla.org/en-US/docs/Web/API/WebXR_Device_API)
