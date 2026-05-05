# Programowanie aplikacji mobilnych XR

XR (Extended Reality) to termin zbiorczy dla trzech typów rozszerzonej rzeczywistości: **AR** (Augmented Reality), **VR** (Virtual Reality) i **MR** (Mixed Reality). Smartfony są najpowszechniejszą platformą AR - każdy nowoczesny telefon ma kamerę i wystarczającą moc obliczeniową.

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

1. **Motion tracking** - śledzenie pozycji telefonu w przestrzeni 6DOF (Six Degrees of Freedom)
2. **Environmental understanding** - wykrywanie płaskich powierzchni (podłoga, stół, ściany)
3. **Light estimation** - szacowanie oświetlenia otoczenia dla realistycznego renderowania

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
            // Wywołane co klatkę - tutaj logika AR
        },
        onGestureListener = rememberOnGestureListener(
            onSingleTapConfirmed = { motionEvent, node ->
                // Gdy użytkownik tapnie w ekran
                if (node == null) {
                    // Tapnięto w pustą przestrzeń - umieść obiekt na płaszczyźnie
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
                // Podłoga/stół - narysuj siatkę
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
        
        // Raycast - znajdź punkt na powierzchni
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
| **.fbx** | Filmbox - Autodesk | Edytory 3D |
| **.obj** | Wavefront OBJ | Legacy, prosty |

## Image Tracking - AR z markerami

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
        // Obraz wykryty - umieść model nad nim
        placeModelAt(image.centerPose, "models/info_panel.glb")
    }
}
```

## WebXR - AR w przeglądarce

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

## Google Cardboard / GearVR - mobilne VR

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

## Śledzenie i SLAM

Kluczowym problemem w AR jest odpowiedź na pytanie: *gdzie jestem i gdzie patrzę?* Rozwiązuje go algorytm **SLAM** (Simultaneous Localization and Mapping - jednoczesna lokalizacja i budowanie mapy). SLAM buduje trójwymiarową mapę otoczenia i jednocześnie wyznacza pozycję urządzenia na tej mapie.

### Wizualna inercyjna odometria (VIO)

ARCore i ARKit używają techniki **Visual-Inertial Odometry**:

1. **Kamera** dostarcza kolejne klatki obrazu
2. **IMU** (żyroskop + akcelerometr) mierzy przyspieszenie i obroty z częstotliwością ~1000 Hz
3. Algorytm łączy oba źródła, śledząc **punkty charakterystyczne** (feature points) - narożniki, krawędzie, tekstury

```
Klatka N                Klatka N+1
[img] ──── detect ────► [punkty] ──── match ────► [przemieszczenie]
[IMU] ──────────────────────────────────────────► [prędkość/obrót]
                                   ↓
                           Aktualizacja mapy + pozycji
```

Wynikiem jest **6DOF** (Six Degrees of Freedom) - trzy osie translacji (X, Y, Z) i trzy osie rotacji (pitch, yaw, roll).

### Typy punktów kotwicznych

```kotlin
// ARCore: zakotwicz obiekt do wykrytej płaszczyzny
val hitResults = frame.hitTest(screenX, screenY)
hitResults.firstOrNull { hit ->
    val trackable = hit.trackable
    // Preferuj punkty na wykrytej płaszczyźnie
    trackable is Plane && trackable.isPoseInPolygon(hit.hitPose)
}?.let { hit ->
    val anchor = hit.createAnchor()
    // Anchor podąża za rzeczywistym obiektem nawet gdy kamera się porusza
    sceneView.addChild(AnchorNode(engine, anchor))
}
```

### LiDAR - precyzyjne skanowanie głębi

iPhone 12 Pro i nowsze modele Pro mają skaner LiDAR (Time-of-Flight), który mierzy odległość do powierzchni bez polegania wyłącznie na kamerze. Przekłada się to na:
- Natychmiastowe wykrywanie płaszczyzn (bez skanowania panoramicznego)
- Dokładną rekonstrukcję siatki sceny (`sceneReconstruction = .mesh`)
- Poprawne zasłanianie obiektów AR przez realne obiekty (okluzja)

---

## Renderowanie AR

Wiarygodność AR zależy od tego, jak dobrze wirtualne obiekty pasują do realnego otoczenia. Trzy kluczowe elementy to okluzja, cienie i estymacja oświetlenia.

### Okluzja (zasłanianie)

Okluzja sprawia, że wirtualny obiekt chowa się za realnym. Bez niej cube unoszący się „w powietrzu" będzie widoczny przez człowieka stojącego przed nim.

```swift
// ARKit + RealityKit: automatyczna okluzja z LiDAR
arView.environment.sceneUnderstanding.options = [
    .occlusion,        // Wirtualne obiekty zasłaniane przez realne
    .receivesLighting  // Realne oświetlenie wpływa na wirtualne obiekty
]
```

Bez LiDAR-a okluzja wymaga głębokiej segmentacji opartej na sieci neuronowej (bardziej zasobożerna).

### Estymacja oświetlenia

ARCore szacuje kierunek i intensywność głównego źródła światła oraz otoczenia:

```kotlin
val frame = session.update()
val lightEstimate = frame.lightEstimate ?: return

// Intensywność pikseli (0–1)
val pixelIntensity = lightEstimate.pixelIntensity

// Temperatura barwowa (Kelvin) - ciepłe vs zimne światło
val colorCorrection = lightEstimate.colorCorrection  // FloatArray[4]: r,g,b,a

// Ustaw oświetlenie w silniku 3D
myScene.setAmbientLight(
    intensity = pixelIntensity,
    colorTemperature = colorCorrection
)
```

```swift
// ARKit: estymacja sferycznego harmonicznego oświetlenia
config.environmentTexturing = .automatic

// W delegate sesji
func session(_ session: ARSession, didUpdate frame: ARFrame) {
    guard let estimate = frame.lightEstimate as? ARDirectionalLightEstimate else { return }
    let intensity = estimate.primaryLightIntensity  // lumeny
    let direction = estimate.primaryLightDirection  // SIMD3<Float>
}
```

### Cienie AR (shadow plane)

Aby wirtualny obiekt rzucał cień na podłogę, umieszcza się niewidoczną siatkę przyjmującą cień:

```swift
// RealityKit: płaszczyzna cieni
let shadowPlane = ModelEntity(
    mesh: .generatePlane(width: 2, depth: 2),
    materials: [OcclusionMaterial()]  // Niewidoczna, ale przyjmuje cień
)
shadowPlane.generateCollisionShapes(recursive: false)
anchor.addChild(shadowPlane)
```

---

## Face Tracking

Śledzenie twarzy pozwala nakładać filtry (jak Snapchat), maski 3D, a także sterować interfejsem gestami mimicznymi.

### ARKit Face Tracking (iOS)

Wymaga iPhone X lub nowszego z przednią kamerą TrueDepth.

```swift
import ARKit
import RealityKit

class FaceARViewController: UIViewController, ARSessionDelegate {
    @IBOutlet var arView: ARView!

    override func viewDidLoad() {
        super.viewDidLoad()

        guard ARFaceTrackingConfiguration.isSupported else {
            print("Urządzenie nie obsługuje face tracking")
            return
        }

        let config = ARFaceTrackingConfiguration()
        config.maximumNumberOfTrackedFaces = 2  // iOS 13+: do dwóch twarzy
        arView.session.delegate = self
        arView.session.run(config)
    }

    func session(_ session: ARSession, didUpdate anchors: [ARAnchor]) {
        for anchor in anchors.compactMap({ $0 as? ARFaceAnchor }) {
            // Blend shapes - 52 parametry mimiki twarzy
            let blendShapes = anchor.blendShapes

            let mouthOpen = blendShapes[.jawOpen]?.floatValue ?? 0
            let leftEyeBlink = blendShapes[.eyeBlinkLeft]?.floatValue ?? 0
            let browRaise = blendShapes[.browInnerUp]?.floatValue ?? 0

            // Gdy usta otwarte > 50% - wyzwól akcję
            if mouthOpen > 0.5 {
                triggerAction()
            }

            // Geometria siatki twarzy (468 wierzchołków)
            let faceGeometry = anchor.geometry
            updateFaceMask(with: faceGeometry)
        }
    }
}
```

### ARCore Face Mesh (Android)

```kotlin
// Dodaj zależność
// implementation("com.google.ar:core:1.46.0")

// Konfiguracja sesji z śledzeniem twarzy
val config = ArConfig(session).apply {
    augmentedFaceMode = AugmentedFaceMode.MESH3D
}
session.configure(config)

// W pętli renderowania
session.getAllTrackables(AugmentedFace::class.java).forEach { face ->
    val region = face.getRegionPose(AugmentedFace.RegionType.FOREHEAD_LEFT)

    // Trójkąty siatki twarzy
    val meshVertices = face.meshVertices    // FloatBuffer
    val meshNormals = face.meshNormals      // FloatBuffer
    val meshIndices = face.meshTriangleIndices  // ShortBuffer
    val meshTexCoords = face.meshTextureCoordinates  // FloatBuffer

    // Renderuj maskę 3D korzystając z danych siatki
    faceMeshRenderer.update(meshVertices, meshNormals, meshIndices, meshTexCoords)
}
```

ARCore Face Mesh dostarcza ~450 wierzchołków opisujących kształt twarzy i pozwala nakładać tekstury (np. makijaż, tatuaże, maski).

---

## WebXR szczegółowo

WebXR API umożliwia tworzenie doświadczeń AR/VR bezpośrednio w przeglądarce. Poniżej kompletny przykład z biblioteką **Three.js**.

### Pełna integracja Three.js + WebXR

```javascript
import * as THREE from 'three';
import { ARButton } from 'three/examples/jsm/webxr/ARButton.js';

let camera, scene, renderer, reticle;
let hitTestSource = null;
let hitTestSourceRequested = false;

async function init() {
    scene = new THREE.Scene();
    camera = new THREE.PerspectiveCamera(70, window.innerWidth / window.innerHeight, 0.01, 20);

    renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.xr.enabled = true;
    document.body.appendChild(renderer.domElement);

    // Przycisk "Start AR" - automatycznie doda do strony
    document.body.appendChild(
        ARButton.createButton(renderer, {
            requiredFeatures: ['hit-test'],
            optionalFeatures: ['dom-overlay'],
            domOverlay: { root: document.body }
        })
    );

    // Celownik wskazujący miejsce umieszczenia obiektu
    const ringGeo = new THREE.RingGeometry(0.05, 0.06, 32).rotateX(-Math.PI / 2);
    const ringMat = new THREE.MeshBasicMaterial({ color: 0x00ff88, side: THREE.DoubleSide });
    reticle = new THREE.Mesh(ringGeo, ringMat);
    reticle.matrixAutoUpdate = false;
    reticle.visible = false;
    scene.add(reticle);

    // Dotknięcie ekranu = umieść obiekt
    renderer.xr.addEventListener('sessionstart', onSessionStart);
    renderer.domElement.addEventListener('touchend', onTouchEnd);

    renderer.setAnimationLoop(render);
}

function onSessionStart() {
    const session = renderer.xr.getSession();
    session.addEventListener('end', () => {
        hitTestSourceRequested = false;
        hitTestSource = null;
    });
}

async function onTouchEnd() {
    if (!reticle.visible) return;

    const geometry = new THREE.BoxGeometry(0.1, 0.1, 0.1);
    const material = new THREE.MeshStandardMaterial({ color: 0x4488ff });
    const cube = new THREE.Mesh(geometry, material);

    cube.position.setFromMatrixPosition(reticle.matrix);
    cube.scale.set(0, 0, 0);
    scene.add(cube);

    // Animacja pojawiania się
    const grow = () => {
        if (cube.scale.x < 1) {
            cube.scale.addScalar(0.05);
            requestAnimationFrame(grow);
        }
    };
    grow();
}

function render(timestamp, frame) {
    if (frame) {
        const referenceSpace = renderer.xr.getReferenceSpace();
        const session = renderer.xr.getSession();

        // Inicjalizuj hit-test source raz po starcie sesji
        if (!hitTestSourceRequested) {
            session.requestReferenceSpace('viewer').then(viewerSpace => {
                session.requestHitTestSource({ space: viewerSpace }).then(src => {
                    hitTestSource = src;
                });
            });
            hitTestSourceRequested = true;
        }

        // Aktualizuj pozycję celownika
        if (hitTestSource) {
            const results = frame.getHitTestResults(hitTestSource);
            if (results.length > 0) {
                const hit = results[0];
                reticle.visible = true;
                reticle.matrix.fromArray(
                    hit.getPose(referenceSpace).transform.matrix
                );
            } else {
                reticle.visible = false;
            }
        }
    }
    renderer.render(scene, camera);
}

init();
```

WebXR działa natywnie w Chrome na Androidzie (z ARCore) - bez instalacji aplikacji. Safari na iOS obsługuje WebXR tylko w trybie VR od wersji 15.4; pełne AR (`immersive-ar`) wymaga polyfill lub aplikacji natywnej.

---

## Wyzwania i ograniczenia

### Wydajność i zasoby

Aplikacje AR są wyjątkowo zasobożerne, ponieważ jednocześnie działają:
- Przetwarzanie obrazu z kamery (SLAM, wykrywanie płaszczyzn)
- Renderowanie 3D (minimum 60 FPS, często z cieniami i okluzją)
- Sieci neuronowe (segmentacja, face tracking)

Typowe efekty:
| Problem | Skutek | Mitygacja |
|---------|--------|-----------|
| Zużycie baterii | Rozładowanie w 1–2 godz. | Ogranicz FPS poza aktywnymi scenami |
| Przegrzewanie | Throttling CPU/GPU po ~15 min | Redukuj rozdzielczość renderowania |
| Zużycie RAM | Crash na starszych urządzeniach | Zwalniaj tekstury i modele poza kadrem |
| Rozmiar APK | Modele 3D zajmują setki MB | On-demand download przez CDN |

```kotlin
// ARCore: ogranicz tryb renderowania gdy AR niewidoczne
override fun onPause() {
    super.onPause()
    arSceneView.pause()     // Wstrzymaj sesję AR
    session.pause()
}

override fun onResume() {
    super.onResume()
    session.resume()
    arSceneView.resume()
}
```

### Utrata śledzenia (tracking loss)

SLAM zawodzi w trudnych warunkach:
- **Jednolite powierzchnie** (biała ściana, gładka podłoga) - brak punktów charakterystycznych
- **Słabe oświetlenie** - kamera nie widzi tekstur
- **Szybkie ruchy** - motion blur uniemożliwia śledzenie punktów
- **Błyszczące/transparentne powierzchnie** - okna, lustra

```kotlin
// Obsługa utraty śledzenia
onSessionUpdated = { session, frame ->
    when (frame.camera.trackingState) {
        TrackingState.TRACKING -> {
            overlay.visibility = View.GONE
        }
        TrackingState.LIMITED -> {
            val reason = frame.camera.trackingFailureReason
            overlay.text = when (reason) {
                TrackingFailureReason.INSUFFICIENT_LIGHT -> "Za ciemno - doświetl otoczenie"
                TrackingFailureReason.EXCESSIVE_MOTION -> "Za szybki ruch - zwolnij"
                TrackingFailureReason.INSUFFICIENT_FEATURES -> "Zbyt jednorodne otoczenie"
                else -> "Utracono śledzenie"
            }
            overlay.visibility = View.VISIBLE
        }
        TrackingState.STOPPED -> {
            // Sesja zakończona - restart
        }
    }
}
```

### Prywatność i uprawnienia

AR wymaga dostępu do kamery w czasie rzeczywistym - szczególnie wrażliwe są:
- **Face tracking**: dane biometryczne chronione przez RODO
- **Skanowanie wnętrz**: mapy 3D pomieszczeń mogą być przechowywane przez SDK
- **Image tracking**: możliwe śledzenie lokalizacji po znanych obrazach

Zawsze informuj użytkownika, że kamera jest aktywna, i minimalizuj dane wysyłane do serwerów.

---

## Porównanie platform

### ARCore vs ARKit - możliwości

| Funkcja | ARCore (Android) | ARKit (iOS) |
|---------|-----------------|-------------|
| System operacyjny | Android 7.0+ | iOS 11+ |
| Minimalne wymagania sprzętowe | Procesor ARM64, kamera RGB | iPhone 6S lub nowszy |
| LiDAR / ToF | Wybrane Pixel, Samsung | iPhone 12 Pro+ |
| Motion tracking (6DOF) | ✅ | ✅ |
| Wykrywanie płaszczyzn | Poziome + pionowe | Poziome + pionowe + skośne |
| Image tracking | ✅ (AugmentedImageDatabase) | ✅ (ARImageTrackingConfiguration) |
| Object tracking (3D) | ✅ | ✅ (ARObjectScanningConfiguration) |
| Face tracking | ✅ (AugmentedFace, ~450 wierzchołków) | ✅ (ARFaceAnchor, 52 blend shapes) |
| Body tracking | ❌ | ✅ (ARBodyTrackingConfiguration, iOS 13+) |
| Rekonstrukcja siatki sceny | Ograniczone (bez LiDAR) | ✅ z LiDAR (sceneReconstruction) |
| Estymacja oświetlenia | ✅ (Directional + Ambient) | ✅ (Spherical Harmonics) |
| Współdzielone sesje AR | ✅ (Cloud Anchors) | ✅ (ARWorldMap + MultipeerConnectivity) |
| Integracja z ML | ML Kit (Google) | Core ML + Create ML |
| Natywny framework 3D | Sceneform (deprecated) / SceneView | RealityKit / SceneKit |
| Dostępność urządzeń | ~1 miliard urządzeń | ~500 milionów urządzeń iOS |

### Kiedy wybrać którą platformę?

- **Tylko Android** → ARCore + SceneView + Jetpack Compose
- **Tylko iOS** → ARKit + RealityKit (lub SceneKit dla starszego kodu)
- **Cross-platform** → Unity AR Foundation (obsługuje obie platformy z jednym kodem C#) lub Flutter + AR plugin
- **Web / bez instalacji** → WebXR + Three.js (Android Chrome; iOS z ograniczeniami)
- **Zaawansowana AR / MR** → Unity MRTK3 (obsługa HoloLens, Quest, iOS, Android)

### Unity AR Foundation - jeden kod, wiele platform

```csharp
// Unity AR Foundation: wykrywanie płaszczyzn - działa na ARCore i ARKit
using UnityEngine;
using UnityEngine.XR.ARFoundation;
using UnityEngine.XR.ARSubsystems;

public class PlaneSpawner : MonoBehaviour {
    [SerializeField] private ARRaycastManager raycastManager;
    [SerializeField] private GameObject prefabToSpawn;

    private List<ARRaycastHit> hits = new();

    void Update() {
        if (Input.touchCount == 0) return;
        var touch = Input.GetTouch(0);
        if (touch.phase != TouchPhase.Began) return;

        if (raycastManager.Raycast(touch.position, hits, TrackableType.PlaneWithinPolygon)) {
            var pose = hits[0].pose;
            Instantiate(prefabToSpawn, pose.position, pose.rotation);
        }
    }
}
```

---

## Linki

- [ARCore - Google Developers](https://developers.google.com/ar)
- [ARKit - Apple Developer](https://developer.apple.com/augmented-reality/arkit/)
- [SceneView - AR/3D for Android](https://github.com/SceneView/sceneview-android)
- [Poly Pizza - darmowe modele 3D](https://poly.pizza)
- [WebXR Device API](https://developer.mozilla.org/en-US/docs/Web/API/WebXR_Device_API)
- [Unity AR Foundation](https://docs.unity3d.com/Packages/com.unity.xr.arfoundation@latest)
- [Three.js WebXR Examples](https://threejs.org/examples/?q=webxr)
