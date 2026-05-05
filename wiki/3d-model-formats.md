# Formaty modeli 3D w aplikacjach mobilnych

Modele 3D odgrywają coraz ważniejszą rolę w aplikacjach mobilnych - od rozszerzonej rzeczywistości (AR), przez gry, po wizualizację produktów w e-commerce. Wybór odpowiedniego formatu wpływa na czas ładowania, jakość renderowania, obsługę animacji oraz kompatybilność z frameworkami mobilnymi. W tym artykule omówimy kluczowe formaty 3D i ich zastosowania na platformach Android i iOS.

---

## Dlaczego format 3D ma znaczenie na urządzeniach mobilnych?

Urządzenia mobilne mają ograniczone zasoby w porównaniu do komputerów stacjonarnych:

- **Pamięć RAM**: 4–12 GB (vs 16–64 GB na desktopie)
- **GPU**: zoptymalizowany pod kątem energooszczędności, nie surowej mocy
- **Pamięć masowa**: pliki APK/IPA mają limity rozmiaru
- **Łącze sieciowe**: pobieranie dużych modeli to kosztowna operacja

Dlatego modele 3D na mobile muszą być:
- Zoptymalizowane pod kątem liczby poligonów
- Skompresowane bez istotnej utraty jakości wizualnej
- Szybko ładowane (format binarny przeważnie lepszy niż tekstowy)

---

## glTF 2.0 - „JPEG świata 3D"

**glTF** (GL Transmission Format) to otwarty standard opracowany przez Khronos Group (twórców OpenGL i Vulkan). Bywa nazywany „JPEG-em 3D" ze względu na swoją rolę jako formatu wymiany modeli 3D w internecie.

### Warianty

| Wariant | Rozszerzenie | Opis |
|---------|-------------|------|
| glTF JSON | `.gltf` + `.bin` + tekstury | Tekstowy JSON z zewnętrznymi zasobami |
| glTF Binary | `.glb` | Wszystko w jednym pliku binarnym |

### Kluczowe cechy glTF 2.0

- Obsługa **PBR** (Physically Based Rendering) - realistyczne materiały
- Animacje szkieletowe (skinning) i morfing
- Sceny hierarchiczne (węzły, transformacje)
- Rozszerzenia: `KHR_draco_mesh_compression`, `KHR_texture_transform`
- Kompresja Draco - zmniejsza rozmiar geometrii o 90%

### Dlaczego `.glb` na mobile?

Wariant GLB łączy wszystkie zasoby (geometria, tekstury, materiały) w jeden plik binarny - jedno żądanie sieciowe, szybsze ładowanie.

---

## OBJ - klasyczny format tekstowy

Format OBJ pochodzi z lat 80. i jest jednym z najszerzej obsługiwanych formatów 3D:

```
# Prosty sześcian (fragment pliku .obj)
v 1.0 1.0 -1.0
v 1.0 -1.0 -1.0
v 1.0 1.0 1.0
v -1.0 1.0 -1.0

vt 0.0 0.0
vt 1.0 0.0
vt 1.0 1.0

vn 0.0 1.0 0.0

f 1/1/1 2/2/1 3/3/1
```

### Zalety i wady OBJ

**Zalety:**
- Czytelny dla człowieka
- Obsługiwany przez każde narzędzie 3D
- Prosty w parsowaniu

**Wady:**
- Brak obsługi animacji
- Towarzyszący plik `.mtl` dla materiałów
- Duże pliki - format tekstowy
- Przestarzały, zastępowany przez glTF

---

## FBX - format Autodesk

FBX (Filmbox) to własnościowy format Autodesk, szeroko stosowany w produkcji gier:

- Bogata obsługa animacji (kości, morfing, ścieżki kamer)
- Natywne wsparcie w **Unity** i **Unreal Engine**
- Format binarny lub ASCII
- Wymaga licencji Autodesk SDK do pełnej obsługi

**Zastosowanie na mobile**: głównie jako format pośredni - eksport z Blendera do silnika gier, który konwertuje model do formatu runtime (np. wewnętrzny format Unity lub glTF).

---

## USDZ - format Apple dla AR

**USDZ** to format stworzony przez Apple we współpracy z Pixar, oparty na USD (Universal Scene Description):

- Natywne wsparcie w **ARKit**, **RealityKit**, **Reality Composer**
- Szybki podgląd w systemie iOS (tapnij plik USDZ w Safari → AR)
- Obsługa animacji, materiałów PBR, fizyki
- Format ZIP zawierający pliki USD i tekstury
- Przeglądanie modeli w AR bezpośrednio z przeglądarki Safari

```
# Konwersja glTF → USDZ narzędziem Reality Converter (macOS)
# Lub programowo za pomocą Python USD Tools:
# python3 usdzconvert model.glb model.usdz
```

---

## STL - format dla druku 3D

STL (Stereolithography) to binarny lub ASCII format opisujący geometrię trójkątami:

- Stosowany głównie do **druku 3D**
- Brak informacji o kolorach, teksturach, materiałach
- Prosta struktura - lista trójkątów z normalnymi
- Zastosowanie w mobile: aplikacje do wizualizacji wydruków 3D, skanery 3D

---

## Tabela porównawcza formatów 3D

| Format | Typ       | Animacja | Tekstury | Wsparcie Android | Wsparcie iOS    | Narzędzia               |
|--------|-----------|----------|----------|-----------------|-----------------|-------------------------|
| glTF/GLB | Otwarty (binarny/JSON) | ✅ Tak | ✅ PBR | ✅ SceneView, ARCore | ✅ RealityKit (konwersja) | Blender, gltf-transform |
| OBJ    | Otwarty (tekstowy) | ❌ Nie | ✅ (MTL) | ✅ (z lib.)      | ✅ (z lib.)     | Każde narzędzie 3D      |
| FBX    | Proprietary (Autodesk) | ✅ Bogata | ✅ Tak | ✅ Unity/Unreal  | ✅ Unity/Unreal | Maya, 3ds Max, Blender  |
| USDZ   | Otwarty (Apple/Pixar) | ✅ Tak | ✅ PBR | ❌ Ograniczone   | ✅ Natywny ARKit | Reality Converter, Blender (plugin) |
| STL    | Otwarty (tekstowy/bin) | ❌ Nie | ❌ Nie  | ✅ (z lib.)      | ✅ (z lib.)     | Każdy slicer, Blender   |

---

## Używanie 3D na Androidzie: SceneView i ARCore

### SceneView z glTF

SceneView to nowoczesna biblioteka do renderowania 3D/AR na Androidzie, oparta na Filament (silnik renderowania Google):

```kotlin
// build.gradle.kts
// implementation("io.github.sceneview:sceneview:2.2.1")
// implementation("io.github.sceneview:arsceneview:2.2.1")
```

```kotlin
import io.github.sceneview.SceneView
import io.github.sceneview.node.ModelNode

class ModelViewerActivity : AppCompatActivity() {

    private lateinit var sceneView: SceneView

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContentView(R.layout.activity_model_viewer)

        sceneView = findViewById(R.id.scene_view)

        // Ładowanie modelu glTF z assets
        lifecycleScope.launch {
            val modelInstance = sceneView.modelLoader.loadModelInstance(
                assetFileLocation = "models/robot.glb"
            )

            val modelNode = ModelNode(
                modelInstance = modelInstance,
                scaleToUnits = 1.0f
            ).apply {
                isEditable = true // pozwala na obrót i skalowanie gestem
            }

            sceneView.addChildNode(modelNode)
        }
    }
}
```

### ARCore z glTF

```kotlin
import io.github.sceneview.ar.ARSceneView
import io.github.sceneview.ar.node.AnchorNode

class ArPlacementActivity : AppCompatActivity() {

    private lateinit var arSceneView: ARSceneView

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContentView(R.layout.activity_ar)

        arSceneView = findViewById(R.id.ar_scene_view)

        // Po wykryciu płaszczyzny i tapnięciu - umieść model
        arSceneView.onTapPlane = { hitResult, _ ->
            lifecycleScope.launch {
                val anchor = hitResult.createAnchor()
                val modelInstance = arSceneView.modelLoader.loadModelInstance(
                    assetFileLocation = "models/chair.glb"
                )

                val anchorNode = AnchorNode(
                    engine = arSceneView.engine,
                    anchor = anchor
                )

                val modelNode = ModelNode(modelInstance).apply {
                    scaleToUnits = 0.5f
                }

                anchorNode.addChildNode(modelNode)
                arSceneView.addChildNode(anchorNode)
            }
        }
    }
}
```

---

## Używanie 3D na iOS: RealityKit i ARKit

### RealityKit z USDZ

```swift
import RealityKit
import ARKit

class ARViewController: UIViewController {

    @IBOutlet var arView: ARView!

    override func viewDidLoad() {
        super.viewDidLoad()
        setupAR()
    }

    func setupAR() {
        // Konfiguracja ARKit - wykrywanie płaszczyzn poziomych
        let config = ARWorldTrackingConfiguration()
        config.planeDetection = [.horizontal]
        arView.session.run(config)

        // Tapnięcie na ekran umieszcza model
        let tapGesture = UITapGestureRecognizer(target: self, action: #selector(handleTap))
        arView.addGestureRecognizer(tapGesture)
    }

    @objc func handleTap(_ sender: UITapGestureRecognizer) {
        let location = sender.location(in: arView)

        // Rzut promienia na wykryte płaszczyzny
        guard let result = arView.raycast(
            from: location,
            allowing: .estimatedPlane,
            alignment: .horizontal
        ).first else { return }

        placeModel(at: result)
    }

    func placeModel(at raycastResult: ARRaycastResult) {
        // Ładowanie modelu USDZ z bundle aplikacji
        guard let modelURL = Bundle.main.url(forResource: "sofa", withExtension: "usdz") else {
            print("Nie znaleziono modelu")
            return
        }

        do {
            let modelEntity = try ModelEntity.load(contentsOf: modelURL)

            // Ustaw skalę modelu
            modelEntity.scale = SIMD3<Float>(0.01, 0.01, 0.01)

            // Utwórz kotwicę w miejscu tapnięcia
            let anchor = AnchorEntity(raycastResult: raycastResult)
            anchor.addChild(modelEntity)

            arView.scene.addAnchor(anchor)

            // Dodaj gesty interakcji
            modelEntity.generateCollisionShapes(recursive: true)
            arView.installGestures([.rotation, .scale, .translation], for: modelEntity)

        } catch {
            print("Błąd ładowania modelu: \(error)")
        }
    }
}
```

### Reality Composer (narzędzie do tworzenia scen AR)

Reality Composer Pro (Xcode) pozwala na:
- Wizualne tworzenie scen AR
- Dodawanie zachowań (animacje po tapnięciu, fizykę)
- Eksport do `.reality` lub `.rcproject`
- Import modeli USDZ, OBJ, glTF

---

## Optymalizacja modeli 3D na mobile

### Liczba poligonów (LOD)

**LOD** (Level of Detail) - różne wersje modelu dla różnych odległości:

| Odległość od kamery | Zalecana liczba trójkątów |
|--------------------|--------------------------|
| < 1 metr (blisko)  | 5 000–15 000             |
| 1–5 metrów         | 1 000–5 000              |
| > 5 metrów         | 100–1 000                |

### Atlasy tekstur

Zamiast wielu małych tekstur - jedna duża tekstura (atlas):
- Mniej przełączeń GPU (draw calls)
- Lepsza wydajność renderowania
- Standardowy rozmiar: 1024×1024, 2048×2048 (unikaj 4K na mobile)

### Kompresja tekstur

| Format | Android | iOS | Opis |
|--------|---------|-----|------|
| ETC2   | ✅ Tak   | ❌  | Obsługa OpenGL ES 3.0 |
| ASTC   | ✅ (Snapdragon/Mali) | ✅ (A8+) | Najlepsza jakość/rozmiar |
| PVRTC  | ❌       | ✅ (stare urządzenia) | Stary format Apple |

```kotlin
// Sprawdzenie obsługi ASTC w Androidzie
val extensions = GLES30.glGetString(GLES30.GL_EXTENSIONS)
val supportsASTC = extensions?.contains("GL_KHR_texture_compression_astc_ldr") == true
```

---

## Narzędzia do pracy z formatami 3D

### Blender - eksport glTF/USDZ

```
# Blender Python API - eksport do GLB
import bpy

bpy.ops.export_scene.gltf(
    filepath="/output/model.glb",
    export_format='GLB',
    export_draco_mesh_compression_enable=True,
    export_draco_mesh_compression_level=6,
    export_animations=True,
    export_image_format='WEBP'
)
```

### gltf-transform - optymalizacja glTF

```bash
# Instalacja
npm install -g @gltf-transform/cli

# Kompresja Draco (geometria)
gltf-transform draco input.glb output.glb

# Kompresja tekstur do WebP
gltf-transform webp input.glb output.glb

# Zmniejszenie rozmiaru tekstur
gltf-transform resize --width 1024 --height 1024 input.glb output.glb

# Pełna optymalizacja
gltf-transform optimize input.glb output.glb --compress draco
```

### Reality Converter - konwersja do USDZ

Narzędzie Apple (macOS) do konwersji OBJ, FBX, glTF → USDZ:

```bash
# Konwersja z linii poleceń
xcrun usdz_converter model.obj model.usdz \
    -textures textures/ \
    -color_primaries sRGB
```

---

## Dobre praktyki

- Używaj **GLB** (binary glTF) dla aplikacji cross-platform i webowych
- Używaj **USDZ** dla natywnych aplikacji iOS AR
- Zawsze kompresuj tekstury odpowiednim formatem GPU (ASTC to najlepszy wybór gdy obsługiwany)
- Stosuj LOD dla modeli wyświetlanych w różnych odległościach
- Kompresja **Draco** redukuje rozmiar geometrii o ~80–95% - używaj zawsze gdy możliwe
- Testuj wydajność renderowania na urządzeniu docelowym, nie tylko w emulatorze

---

## Podsumowanie

Świat formatów 3D na mobile polaryzuje się wokół dwóch standardów: **glTF/GLB** dla aplikacji cross-platform i Androida oraz **USDZ** dla ekosystemu Apple. glTF 2.0 to rekomendowany format dla nowych projektów ze względu na otwartość, kompresję Draco i szerokie wsparcie narzędziowe. Kluczem do płynnego działania na urządzeniach mobilnych jest optymalizacja: odpowiednia liczba poligonów, atlasy tekstur i kompresja ASTC.
