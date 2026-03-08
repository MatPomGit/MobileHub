# VR Mobilne i Cardboard SDK

Wirtualna rzeczywistość mobilna (Mobile VR) to najtańsza forma VR — wystarczy smartfon i gogle. Obraz jest podzielony na dwa widoki (jeden na każde oko), a optyczne soczewki w goglach tworzą wrażenie trójwymiarowej sceny.

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

**Barrel Distortion** — zniekształcenie beczki: obraz jest celowo zakrzywiony, soczewki odwracają efekt, dając prostoliniowy wynik.

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

// Detekcja "spojrzenia" na obiekt — Reticle (celownik)
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

## Spatial Audio — dźwięk przestrzenny

```kotlin
// GVR Audio API — dźwięk 3D zmieniający się z obrotem głowy
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

## 360° Video Player — VR wideo

```kotlin
// GVR VideoPlayer — odtwarzanie sferycznych filmów
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

## Alternatywy — Unity i Godot

Dla poważnych gier VR na mobile lepszym wyborem jest silnik gier:

```
Unity + Google VR SDK
├── Wieloplatformowość: Android, iOS, PC VR (SteamVR)
├── Asset Store: gotowe elementy, shaderów, dźwięki
├── XR Interaction Toolkit: obsługa kontrolerów
└── Visual Scripting: gry bez znajomości C#

Godot 4 + OpenXR
├── Open source — brak opłat licencyjnych
├── GDScript (Python-podobny) lub C#
├── Mniejszy ślad pamięciowy niż Unity
└── Wsparcie dla WebXR (VR w przeglądarce)
```

## Chorobliwość VR — aspekty techniczne

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
- [WebXR — VR w przeglądarce](https://developer.mozilla.org/en-US/docs/Web/API/WebXR_Device_API)
