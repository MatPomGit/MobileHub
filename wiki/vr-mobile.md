# VR Mobilne i Cardboard SDK

Wirtualna rzeczywistość mobilna (Mobile VR) to najtańsza forma VR - wystarczy smartfon i gogle. Obraz jest podzielony na dwa widoki (jeden na każde oko), a optyczne soczewki w goglach tworzą wrażenie trójwymiarowej sceny.

## Zasada działania stereo VR

```
┌─────────────────────────────────────────────┐
│              Ekran smartfona                 │
│   ┌────────────────┬────────────────┐        │
│   │  Lewe oko (L)  │  Prawe oko (P) │        │
│   │    Scena 3D    │    Scena 3D    │        │
│   │  (offset -IPD) │  (offset +IPD) │        │
│   └────────────────┴────────────────┘        │
└─────────────────────────────────────────────┘
          ↓ (soczewki w goglach)
       Złudzenie głębi stereo
```

**IPD** (Interpupillary Distance) = odległość między źrenicami, ~63mm. Prawidłowa konfiguracja IPD jest kluczowa dla komfortu.

**Barrel Distortion** - zniekształcenie beczki: obraz jest celowo zakrzywiony, soczewki odwracają efekt, dając prostoliniowy wynik.

## Google Cardboard SDK

```kotlin
dependencies {
    implementation("com.google.vr:sdk-base:1.10.0")
    implementation("com.google.vr:sdk-audio:1.10.0")
}

// Aktywność VR dziedziczy po GvrActivity (lub używa GvrView)
class VrActivity : GvrActivity() {
    private lateinit var gvrView: GvrView

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        gvrView = GvrView(this)
        setContentView(gvrView)
        gvrView.setEGLConfigChooser(8, 8, 8, 8, 16, 8)
        gvrView.setRenderer(VrRenderer())
        gvrView.setTransitionViewEnabled(true)  // animacja wejścia do VR
        setGvrView(gvrView)
    }

    override fun onPause()  { super.onPause();  gvrView.onPause() }
    override fun onResume() { super.onResume(); gvrView.onResume() }
}

class VrRenderer : GvrView.StereoRenderer {
    private val headTransform = HeadTransform()
    private val eyeParams = Array(2) { EyeParams(Eye(it)) }

    override fun onNewFrame(headTransform: HeadTransform) {
        // Pobierz orientację głowy z żyroskopu/akcelerometru
        val quaternion = FloatArray(4)
        headTransform.getQuaternion(quaternion, 0)
        // Zaktualizuj pozycję kamery w scenie na podstawie kwaterniona
        updateCameraFromHeadTransform(headTransform)
    }

    override fun onDrawEye(eye: Eye) {
        GLES20.glClear(GLES20.GL_COLOR_BUFFER_BIT or GLES20.GL_DEPTH_BUFFER_BIT)
        // Pobierz macierz widoku dla tego oka (uwzględnia IPD)
        val view = FloatArray(16)
        eye.getEyeView(view, 0)
        // Pobierz macierz perspektywy dla tego oka
        val perspective = FloatArray(16)
        eye.getPerspective(0.1f, 100.0f, perspective, 0)
        // Renderuj scenę
        renderScene(view, perspective)
    }

    override fun onFinishFrame(viewport: Viewport) {}
    override fun onSurfaceChanged(width: Int, height: Int) { GLES20.glViewport(0, 0, width, height) }
    override fun onSurfaceCreated(config: EGLConfig) { setupOpenGLScene() }
    override fun onRendererShutdown() {}
}
```

## Obsługa Cardboard trigger (kliknięcie magnetu)

```kotlin
// GvrActivity dostarcza callbacki dla triggera
class VrActivity : GvrActivity(), CardboardView.StereoRenderer {

    // Wywołuje się gdy użytkownik kliknie trigger (magnes boczny)
    override fun onCardboardTrigger() {
        // Sprawdź co jest wycentrowane w polu widzenia
        lookAtObject?.let { onSelectObject(it) }
        // Vibrate dla feedbacku
        vibrateOnce(50)
    }
}

// Detekcja "spojrzenia" na obiekt - Reticle (celownik)
class ReticleRenderer {
    private var gazeTarget: SceneObject? = null
    private var gazeTimer = 0f
    private val GAZE_THRESHOLD = 2.0f  // 2 sekundy spojrzenia = wybór

    fun onNewFrame(headTransform: HeadTransform, deltaTime: Float) {
        val forwardVec = FloatArray(3)
        headTransform.getForwardVector(forwardVec, 0)

        val hitObject = raycastScene(forwardVec)
        if (hitObject == gazeTarget) {
            gazeTimer += deltaTime
            if (gazeTimer >= GAZE_THRESHOLD) {
                onSelectObject(hitObject)
                gazeTimer = 0f
            }
        } else {
            gazeTarget = hitObject
            gazeTimer = 0f
        }
    }
}
```

## Spatial Audio - dźwięk przestrzenny

```kotlin
// GVR Audio API - dźwięk 3D zmieniający się z obrotem głowy
class VrAudioManager(context: Context) {
    private val gvrAudio = GvrAudio(context, GvrAudio.RenderingMode.BINAURAL_HIGH_QUALITY)

    fun init() {
        gvrAudio.resume()
    }

    fun loadAndPlaySound(assetPath: String, x: Float, y: Float, z: Float) {
        val sourceId = gvrAudio.createSoundObject(assetPath)
        if (sourceId != GvrAudio.ERROR) {
            gvrAudio.setSoundObjectPosition(sourceId, x, y, z)
            gvrAudio.setSoundVolume(sourceId, 1.0f)
            gvrAudio.setRoomProperties(
                roomWidth = 5f, roomHeight = 3f, roomDepth = 5f,
                frontWall  = MaterialName.CURTAIN_HEAVY,
                backWall   = MaterialName.CURTAIN_HEAVY,
                leftWall   = MaterialName.PAINTED_CONCRETE_BLOCK,
                rightWall  = MaterialName.PAINTED_CONCRETE_BLOCK,
                ceilingMat = MaterialName.ACOUSTICAL_CEILING_TILES,
                floorMat   = MaterialName.CARPET
            )
            gvrAudio.playSound(sourceId, loopEnabled = true)
        }
    }

    fun updateHeadOrientation(headTransform: HeadTransform) {
        gvrAudio.setHeadRotation(
            headTransform.quaternion[0],
            headTransform.quaternion[1],
            headTransform.quaternion[2],
            headTransform.quaternion[3]
        )
        gvrAudio.update()
    }
}
```

## 360° Video Player - VR wideo

```kotlin
// GVR VideoPlayer - odtwarzanie sferycznych filmów
class VrVideoActivity : VrVideoActivity() {
    private lateinit var videoView: VrVideoView
    private var isPaused = false

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        videoView = VrVideoView(this)
        setContentView(videoView)
        videoView.setEventListener(object : VrVideoEventListener() {
            override fun onLoadSuccess()  { videoView.playVideo() }
            override fun onLoadError(err: String?) { Log.e("VR", "Błąd: $err") }
            override fun onClick()        { togglePlayback() }
        })
        loadVideo()
    }

    private fun loadVideo() {
        val options = VrVideoView.Options().apply {
            inputType = VrVideoView.Options.TYPE_STEREO_OVER_UNDER // lub TYPE_MONO
            inputFormat = VrVideoView.Options.FORMAT_DEFAULT
        }
        videoView.loadVideoFromAsset("360_video.mp4", options)
    }

    private fun togglePlayback() {
        if (isPaused) videoView.playVideo() else videoView.pauseVideo()
        isPaused = !isPaused
    }

    override fun onPause()   { super.onPause();  videoView.pauseVideo(); isPaused = true }
    override fun onResume()  { super.onResume(); if (!isPaused) videoView.playVideo() }
    override fun onDestroy() { super.onDestroy(); videoView.shutdown() }
}
```

## 7. Unity dla VR mobilnego

Unity to najpopularniejszy silnik do tworzenia aplikacji VR na urządzenia mobilne. Dzięki **XR Interaction Toolkit** (XRI) zapewnia ujednolicone API niezależnie od docelowej platformy (Cardboard, Meta Quest, HTC Vive Focus).

### Konfiguracja projektu pod Cardboard / Android

1. **Package Manager** → dodaj `com.unity.xr.interaction.toolkit` oraz `com.google.xr.cardboard`.
2. **Project Settings → XR Plug-in Management** → zaznaczyć „Cardboard XR Plugin" dla platformy Android.
3. **Player Settings** → Minimum API Level: Android 8.0 (API 26), Architecture: ARM64.
4. Kamera sceny musi być opakowana w prefab **XR Rig** (Camera Offset → Main Camera).

```csharp
using UnityEngine;
using UnityEngine.XR;
using UnityEngine.XR.Interaction.Toolkit;

public class VRCardboardManager : MonoBehaviour
{
    [SerializeField] private XROrigin xrOrigin;

    void Start()
    {
        // Włącz tryb stereo (split-screen) wymagany przez Cardboard
        XRSettings.enabled = true;
        // Ustaw renderScale = 1.0 aby uniknąć artefaktów na słabszym GPU
        XRSettings.eyeTextureResolutionScale = 1.0f;

        Debug.Log($"XR aktywny: {XRSettings.isDeviceActive}");
        Debug.Log($"Urządzenie: {XRSettings.loadedDeviceName}");
    }

    void Update()
    {
        // Odczyt orientacji głowy przez InputDevice
        InputDevice headDevice = InputDevices.GetDeviceAtXRNode(XRNode.Head);
        if (headDevice.TryGetFeatureValue(CommonUsages.deviceRotation, out Quaternion rotation))
        {
            // Możemy np. obracać dodatkowe obiekty razem z głową
            transform.rotation = rotation;
        }
    }

    // Wywołaj po kliknięciu przycisku powrotu / triggera Cardboard
    public void RecenterView()
    {
        InputTracking.Recenter();
    }
}
```

### XR Interaction Toolkit - Ray Interactor

```csharp
using UnityEngine;
using UnityEngine.XR.Interaction.Toolkit;

// Dołącz do obiektu XRGazeInteractor (spójrzenie = selekcja)
public class GazeSelector : XRBaseInteractor
{
    [SerializeField] private float gazeHoldTime = 2.0f;
    private XRBaseInteractable currentTarget;
    private float gazeTimer;

    protected override void OnHoverEntered(HoverEnterEventArgs args)
    {
        base.OnHoverEntered(args);
        currentTarget = args.interactableObject as XRBaseInteractable;
        gazeTimer = 0f;
    }

    protected override void OnHoverExited(HoverExitEventArgs args)
    {
        base.OnHoverExited(args);
        currentTarget = null;
        gazeTimer = 0f;
    }

    public override void ProcessInteractor(XRInteractionUpdateOrder.UpdatePhase phase)
    {
        base.ProcessInteractor(phase);
        if (currentTarget != null)
        {
            gazeTimer += Time.deltaTime;
            if (gazeTimer >= gazeHoldTime)
            {
                interactionManager.SelectEnter(this, currentTarget);
                gazeTimer = 0f;
            }
        }
    }
}
```

---

## 8. Optymalizacja renderowania VR

VR mobilne jest wyjątkowo wymagające: musimy rysować scenę **dwa razy** (po jednym widoku na każde oko) przy 72–90 FPS na ograniczonym GPU smartfona. Kluczowe techniki optymalizacji:

### Single-Pass Stereo Rendering

Zamiast dwóch osobnych drawcall-i na oko, GPU rysuje oba widoki w jednym przebiegu używając **Instanced Stereo** lub **Multi-View** (rozszerzenie OpenGL ES `GL_OVR_multiview2`).

```csharp
// Unity: włącz w Player Settings → XR Settings → Stereo Rendering Mode
// "Single Pass Instanced" - najlepsza opcja dla nowoczesnych GPU

// W shaderze GLSL/HLSL konieczne jest użycie wbudowanych makr Unity:
// UNITY_SETUP_STEREO_EYE_INDEX_POST_VERTEX(input)
// UNITY_VERTEX_OUTPUT_STEREO

// Przykład własnego shadera kompatybilnego z single-pass instanced:
/*
Shader "Custom/VR_Unlit"
{
    SubShader {
        Pass {
            CGPROGRAM
            #pragma vertex vert
            #pragma fragment frag
            #include "UnityCG.cginc"

            struct appdata { float4 vertex : POSITION; UNITY_VERTEX_INPUT_INSTANCE_ID };
            struct v2f    { float4 pos : SV_POSITION; UNITY_VERTEX_OUTPUT_STEREO };

            v2f vert(appdata v) {
                v2f o;
                UNITY_SETUP_INSTANCE_ID(v);
                UNITY_INITIALIZE_VERTEX_OUTPUT_STEREO(o);
                o.pos = UnityObjectToClipPos(v.vertex);
                return o;
            }
            fixed4 frag(v2f i) : SV_Target { return fixed4(1,1,1,1); }
            ENDCG
        }
    }
}
*/
```

### Foveated Rendering

Urządzenia z eye-trackingiem (np. Meta Quest Pro) lub bez (Fixed Foveated Rendering - FFR) renderują centrum ekranu w pełnej rozdzielczości, a peryferia w niższej - zgodnie z tym, że obwód pola widzenia jest mało wrażliwy na szczegóły.

```csharp
using Unity.XR.Oculus; // lub odpowiedni plugin producenta

public class FoveatedRenderingSetup : MonoBehaviour
{
    void Start()
    {
        // Meta Quest: ustaw Fixed Foveated Rendering na poziomie "High"
        OculusSettings.fixedFoveatedRenderingLevel = FixedFoveatedRenderingLevel.High;
        OculusSettings.useDynamicFixedFoveatedRendering = true;
        Debug.Log("FFR włączony");
    }
}
```

### Level of Detail (LOD)

```csharp
using UnityEngine;

// Dodaj komponent LODGroup do każdego złożonego modelu
public class VRLodConfigurator : MonoBehaviour
{
    void Awake()
    {
        var lodGroup = GetComponent<LODGroup>();
        if (lodGroup == null) return;

        LOD[] lods = new LOD[3];
        // LOD0 - pełna jakość, widoczna do ~15m
        lods[0] = new LOD(0.6f, GetRenderers("LOD0"));
        // LOD1 - zredukowana geometria, 15–40m
        lods[1] = new LOD(0.2f, GetRenderers("LOD1"));
        // LOD2 - billboardy lub bardzo prosta siatka, >40m
        lods[2] = new LOD(0.05f, GetRenderers("LOD2"));

        lodGroup.SetLODs(lods);
        lodGroup.RecalculateBounds();
    }

    private Renderer[] GetRenderers(string childName)
    {
        Transform t = transform.Find(childName);
        return t != null ? t.GetComponentsInChildren<Renderer>() : new Renderer[0];
    }
}
```

**Dodatkowe zalecenia:**
- Ogranicz liczbę dynamicznych świateł do **max 1** (preferuj baked lighting).
- Używaj **Occlusion Culling** - nie renderuj obiektów schowanych za innymi.
- Ogranicz liczbę draw call-i do <100 na klatkę (batching, GPU Instancing).
- Tekstury: format **ASTC** (Android) lub **PVRTC** (iOS), mipmapy zawsze włączone.

---

## 9. Tryb kinowy - odtwarzacz VR wideo

Tryb kinowy (Cinema Mode) symuluje duży ekran kina wewnątrz wirtualnej przestrzeni. Film równirectangularny (equirectangular, format sferyczny 2:1) jest nakładany na wewnętrzną powierzchnię sfery, a kamera umieszczona w jej centrum.

```kotlin
// Android / OpenGL ES - renderowanie wideo 360° na sferze
class CinemaVrRenderer(private val context: Context) : GvrView.StereoRenderer {

    private var sphereVbo = 0
    private var program = 0
    private var surfaceTexture: SurfaceTexture? = null
    private var mediaPlayer: MediaPlayer? = null

    // Tekstura z MediaPlayer wymaga GL_TEXTURE_EXTERNAL_OES
    private val VERTEX_SHADER = """
        attribute vec4 aPosition;
        attribute vec2 aTexCoord;
        uniform mat4 uMVPMatrix;
        varying vec2 vTexCoord;
        void main() {
            gl_Position = uMVPMatrix * aPosition;
            vTexCoord = aTexCoord;
        }
    """.trimIndent()

    private val FRAGMENT_SHADER = """
        #extension GL_OES_EGL_image_external : require
        precision mediump float;
        uniform samplerExternalOES uTexture;
        varying vec2 vTexCoord;
        void main() {
            gl_FragColor = texture2D(uTexture, vTexCoord);
        }
    """.trimIndent()

    override fun onSurfaceCreated(config: EGLConfig) {
        program = buildShaderProgram(VERTEX_SHADER, FRAGMENT_SHADER)
        sphereVbo = buildEquirectangularSphere(radius = 50f, stacks = 40, slices = 40)

        // Utwórz SurfaceTexture i podepnij do MediaPlayer
        val texId = createExternalTexture()
        surfaceTexture = SurfaceTexture(texId)
        val surface = Surface(surfaceTexture)

        mediaPlayer = MediaPlayer().apply {
            setDataSource(context, Uri.parse("android.resource://${context.packageName}/raw/cinema_360"))
            setSurface(surface)
            isLooping = true
            prepare()
            start()
        }
    }

    override fun onDrawEye(eye: Eye) {
        surfaceTexture?.updateTexImage()   // pobierz najnowszą klatkę z dekodera

        GLES20.glClear(GLES20.GL_COLOR_BUFFER_BIT or GLES20.GL_DEPTH_BUFFER_BIT)
        GLES20.glUseProgram(program)

        val mvp = FloatArray(16)
        // Użyj tylko rotacji (brak translacji - kamera zawsze w centrum sfery)
        val view = FloatArray(16)
        eye.getEyeView(view, 0)
        Matrix.multiplyMM(mvp, 0, eye.getPerspective(0.1f, 200f), 0, view, 0)

        val mvpLoc = GLES20.glGetUniformLocation(program, "uMVPMatrix")
        GLES20.glUniformMatrix4fv(mvpLoc, 1, false, mvp, 0)

        drawSphere(sphereVbo)
    }

    override fun onNewFrame(headTransform: HeadTransform) {}
    override fun onFinishFrame(viewport: Viewport) {}
    override fun onSurfaceChanged(w: Int, h: Int) { GLES20.glViewport(0, 0, w, h) }
    override fun onRendererShutdown() { mediaPlayer?.release() }
}
```

**Format equirectangular (2:1):**
```
Szerokość : Wysokość = 2 : 1
Przykład: 3840 × 1920 px (4K 360°)

Rzut: każdy piksel (x, y) odpowiada kątom:
  azymut φ = (x / W) × 360° − 180°
  elewacja θ = (y / H) × 180° − 90°  (−90° = dół, +90° = góra)
```

Stereo 360° (Over/Under):
```
Górna połowa → lewe oko
Dolna połowa → prawe oko
(każda połowa to osobna klatka equirectangular)
```

---

## 10. Projektowanie UI w VR

Tradycyjne UI (nakładka 2D na ekran) nie działa w VR - elementy przyczepione do kamery powodują dyskomfort i chorobę symulacyjną. Całe UI musi być umieszczone w **przestrzeni świata** (World Space).

### World-Space Canvas w Unity

```csharp
using UnityEngine;
using UnityEngine.UI;

[RequireComponent(typeof(Canvas))]
public class VRWorldSpaceUI : MonoBehaviour
{
    [Header("Ustawienia panelu")]
    [SerializeField] private Transform cameraTransform;
    [SerializeField] private float distanceFromCamera = 2.5f;  // metry
    [SerializeField] private float panelWidth  = 0.6f;         // metry w świecie
    [SerializeField] private float panelHeight = 0.4f;

    [Header("Billboard")]
    [SerializeField] private bool faceCamera = true;

    private Canvas canvas;

    void Awake()
    {
        canvas = GetComponent<Canvas>();
        canvas.renderMode = RenderMode.WorldSpace;

        // Skonfiguruj rozmiar - 1 unit Canvas = 1 mm ekranu (przelicz na metry)
        var rt = canvas.GetComponent<RectTransform>();
        rt.sizeDelta = new Vector2(panelWidth * 1000f, panelHeight * 1000f);
        rt.localScale  = Vector3.one * 0.001f;  // 1 px = 1 mm = 0.001 m
    }

    void LateUpdate()
    {
        if (cameraTransform == null) return;

        // Umieść panel przed kamerą na zadanej odległości
        Vector3 forward = cameraTransform.forward;
        forward.y = 0;
        forward.Normalize();

        transform.position = cameraTransform.position + forward * distanceFromCamera
                             + Vector3.up * -0.1f;  // lekko poniżej linii wzroku

        if (faceCamera)
            transform.rotation = Quaternion.LookRotation(forward);
    }
}
```

### Gaze-Based UI - wskaźnik wzroku (reticle)

```csharp
using UnityEngine;
using UnityEngine.UI;

public class VRGazeReticle : MonoBehaviour
{
    [SerializeField] private Image fillImage;       // kółko "ładowania"
    [SerializeField] private float activationTime = 1.5f;

    private IGazeTarget currentTarget;
    private float progress;

    void Update()
    {
        Ray ray = new Ray(Camera.main.transform.position,
                          Camera.main.transform.forward);

        if (Physics.Raycast(ray, out RaycastHit hit, maxDistance: 10f))
        {
            var target = hit.collider.GetComponent<IGazeTarget>();
            if (target != currentTarget)
            {
                currentTarget = target;
                progress = 0f;
            }

            if (currentTarget != null)
            {
                progress += Time.deltaTime / activationTime;
                fillImage.fillAmount = progress;

                if (progress >= 1f)
                {
                    currentTarget.OnGazeSelect();
                    currentTarget = null;
                    progress = 0f;
                }
            }
            else
            {
                fillImage.fillAmount = 0f;
            }
        }
        else
        {
            currentTarget = null;
            fillImage.fillAmount = 0f;
        }
    }
}

public interface IGazeTarget
{
    void OnGazeSelect();
    void OnGazeEnter();
    void OnGazeExit();
}
```

### Zasady projektowania UI dla VR

| Zasada | Wartość / Opis |
|--------|---------------|
| Minimalna odległość panelu | ≥ 1,5 m od oczu (inaczej zez) |
| Optymalna odległość | 2–4 m |
| Kąt widzenia panelu | ±30° od centrum (strefa komfortu) |
| Minimalna wielkość przycisku | 60×60 px przy 1000 px/m |
| Kontrast tekstu | ≥ 4,5:1 (WCAG AA) |
| Animacje | Brak nagłych zmian jasności; fade zamiast flash |
| Czcionka | Bezszeryfowa, ≥ 36 sp ekwiwalentne |
| Feedback | Zawsze wizualny + opcjonalnie wibracja |

**Wskazówka:** Nigdy nie umieszczaj ważnych informacji bezpośrednio na górze lub dole ekranu - użytkownik może nie pochylać głowy podczas sesji VR.

---

## Alternatywy - Unity i Godot

Dla poważnych gier VR na mobile lepszym wyborem jest silnik gier:

```
Unity + Google VR SDK
├── Wieloplatformowość: Android, iOS, PC VR (SteamVR)
├── Asset Store: gotowe elementy, shaderów, dźwięki
├── XR Interaction Toolkit: obsługa kontrolerów
└── Visual Scripting: gry bez znajomości C#

Godot 4 + OpenXR
├── Open source - brak opłat licencyjnych
├── GDScript (Python-podobny) lub C#
├── Mniejszy ślad pamięciowy niż Unity
└── Wsparcie dla WebXR (VR w przeglądarce)
```

## Chorobliwość VR - aspekty techniczne

VR sickness (choroba symulacyjna) wynika z konfliktu między wzrokiem a układem przedsionkowym:

| Czynnik | Próg komfortu | Jak naprawić |
|---------|--------------|-------------|
| Latencja klatek | < 20ms | Optymalizuj rendering |
| Framerate | ≥ 72 FPS | LOD, occlusion culling |
| IPD konfiguracja | ± 5mm | Profile użytkownika |
| Field of View | ≥ 90° | Nie ograniczaj FoV |
| Locomotion | Teleportacja > swobodny ruch | Unikaj ciągłego ruchu bez woli użytkownika |

## Linki

- [Google Cardboard SDK](https://developers.google.com/cardboard)
- [GVR Android](https://github.com/googlevr/gvr-android-sdk)
- [VR Best Practices](https://developers.google.com/vr/discover/playercomfort)
- [WebXR - VR w przeglądarce](https://developer.mozilla.org/en-US/docs/Web/API/WebXR_Device_API)
