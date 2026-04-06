# Unity — zaawansowane techniki dla mobile

Profesjonalne gry mobilne w Unity wymagają znajomości zaawansowanych technik optymalizacji, monetyzacji i systemu animacji.

## Animator i State Machine

```csharp
// Animator Controller zarządza stanami animacji
public class PlayerAnimator : MonoBehaviour
{
    private Animator animator;
    
    // Hashed IDs — szybszy dostęp niż stringi
    private static readonly int IsRunning = Animator.StringToHash("IsRunning");
    private static readonly int IsJumping = Animator.StringToHash("IsJumping");
    private static readonly int Speed = Animator.StringToHash("Speed");
    private static readonly int Hit = Animator.StringToHash("Hit");  // Trigger

    void Awake() => animator = GetComponent<Animator>();

    public void SetRunning(bool value) => animator.SetBool(IsRunning, value);
    public void SetSpeed(float value) => animator.SetFloat(Speed, value, 0.1f, Time.deltaTime);
    public void TriggerJump() => animator.SetTrigger(IsJumping);

    public void PlayHitReaction() {
        animator.SetTrigger(Hit);
        // Blend na górną połowę ciała
        animator.SetLayerWeight(1, 1f);  // layer 1 = upper body
        StartCoroutine(ResetUpperBodyWeight());
    }
}
```

## Addressables — dynamiczne ładowanie zasobów

```csharp
// Zasoby pobierane na żądanie — mniejszy rozmiar APK
public class AssetLoader : MonoBehaviour
{
    [SerializeField] private AssetReference enemyPrefabRef;
    [SerializeField] private AssetLabelReference levelLabel;

    async void LoadEnemyAsync()
    {
        var handle = Addressables.LoadAssetAsync<GameObject>(enemyPrefabRef);
        await handle.Task;

        if (handle.Status == AsyncOperationStatus.Succeeded)
        {
            Instantiate(handle.Result, spawnPoint.position, Quaternion.identity);
        }
        else
        {
            Debug.LogError($"Nie udało się załadować: {handle.OperationException}");
        }
    }

    async void LoadLevelAssets()
    {
        // Załaduj wszystkie assety z labelem "Level1"
        var handle = Addressables.LoadAssetsAsync<Sprite>(levelLabel, null);
        await handle.Task;
        var sprites = handle.Result;
    }
}
```

## Unity Ads i Monetyzacja

```csharp
using UnityEngine.Advertisements;

public class AdsManager : MonoBehaviour, IUnityAdsLoadListener, IUnityAdsShowListener
{
    private const string GameId = "1234567";
    private const string RewardedAdUnit = "Rewarded_Android";

    void Start()
    {
        Advertisement.Initialize(GameId, testMode: false, this);
    }

    public void LoadRewardedAd()
    {
        Advertisement.Load(RewardedAdUnit, this);
    }

    public void ShowRewardedAd()
    {
        Advertisement.Show(RewardedAdUnit, this);
    }

    public void OnUnityAdsShowComplete(string adUnit, UnityAdsShowCompletionState state)
    {
        if (state == UnityAdsShowCompletionState.COMPLETED)
        {
            // Użytkownik obejrzał reklamę — daj nagrodę
            PlayerDataManager.Instance.AddCoins(100);
            Debug.Log("Nagroda przyznana: 100 monet");
        }
    }
}
```

## Haptyczne sprzężenie zwrotne

```csharp
public class HapticFeedback : MonoBehaviour
{
    public static void Light() =>
        Handheld.Vibrate();  // podstawowe

    // Dla zaawansowanej haptyki:
    public static void Impact(ImpactFeedbackStyle style = ImpactFeedbackStyle.Medium)
    {
#if UNITY_IOS
        TapticManager.Impact(style);
#elif UNITY_ANDROID
        if (SystemInfo.supportsVibration)
        {
            var vibratorService = new AndroidJavaClass("android.os.VibrationEffect");
            // Android 8+ Vibration Effects
            var vibrator = new AndroidJavaObject("android.os.Vibrator");
            var effect = vibratorService.CallStatic<AndroidJavaObject>(
                "createOneShot", 50L, 128);
            vibrator.Call("vibrate", effect);
        }
#endif
    }
}
```

## Linki

- [Unity Learn — Mobile](https://learn.unity.com/pathway/mobile-game-development)
- [Unity Addressables](https://docs.unity3d.com/Packages/com.unity.addressables@1.21/manual/index.html)
- [Unity Ads](https://docs.unity.com/ads/en-us/manual/UnityAdsHome)

## Unity Input System — obsługa dotyku

```csharp
// Nowy Input System (Package: com.unity.inputsystem)
using UnityEngine.InputSystem;
using UnityEngine.InputSystem.EnhancedTouch;

public class TouchInputHandler : MonoBehaviour
{
    void OnEnable()
    {
        EnhancedTouchSupport.Enable();
        UnityEngine.InputSystem.EnhancedTouch.Touch.onFingerDown  += OnFingerDown;
        UnityEngine.InputSystem.EnhancedTouch.Touch.onFingerMove  += OnFingerMove;
        UnityEngine.InputSystem.EnhancedTouch.Touch.onFingerUp    += OnFingerUp;
    }

    void OnDisable()
    {
        UnityEngine.InputSystem.EnhancedTouch.Touch.onFingerDown  -= OnFingerDown;
        UnityEngine.InputSystem.EnhancedTouch.Touch.onFingerMove  -= OnFingerMove;
        UnityEngine.InputSystem.EnhancedTouch.Touch.onFingerUp    -= OnFingerUp;
        EnhancedTouchSupport.Disable();
    }

    private void OnFingerDown(Finger finger)
    {
        var touch = finger.currentTouch;
        Debug.Log($"Dotknięcie #{finger.index} na {touch.screenPosition}");

        // Rzut promienia z dotyku
        Ray ray = Camera.main.ScreenPointToRay(touch.screenPosition);
        if (Physics.Raycast(ray, out RaycastHit hit))
        {
            hit.collider.GetComponent<IInteractable>()?.OnTap();
        }
    }

    private void OnFingerMove(Finger finger)
    {
        var delta = finger.currentTouch.delta;
        // Obracaj kamerę proporcjonalnie do przesunięcia
        Camera.main.transform.Rotate(Vector3.up, delta.x * 0.2f);
    }

    // Gesty wielodotykowe
    void Update()
    {
        var touches = UnityEngine.InputSystem.EnhancedTouch.Touch.activeTouches;
        if (touches.Count == 2)
        {
            var t0 = touches[0]; var t1 = touches[1];
            float prevDist = Vector2.Distance(t0.screenPosition - t0.delta, t1.screenPosition - t1.delta);
            float currDist = Vector2.Distance(t0.screenPosition, t1.screenPosition);
            float pinchDelta = currDist - prevDist;

            // Zoom kamery pinch-to-zoom
            Camera.main.orthographicSize = Mathf.Clamp(
                Camera.main.orthographicSize - pinchDelta * 0.02f,
                2f, 20f
            );
        }
    }
}
```

## Optymalizacja — Batching i Culling

```csharp
public class PerformanceOptimizer : MonoBehaviour
{
    // Statyczne batching — obiekty, które się nie ruszają
    // W edytorze: Inspector → Static → Batching Static ✓

    // Dynamiczne batching automatyczne dla małych siatek (<900 werteksów)
    // Sprawdź: Edit → Project Settings → Player → GPU Skinning

    [Header("Occlusion Culling")]
    [SerializeField] private Camera gameCamera;

    void Start()
    {
        // LOD Group — zmień jakość modelu z odległością
        var lodGroup = GetComponent<LODGroup>();
        var lods = new LOD[3];

        // 0-30%: pełna jakość
        lods[0] = new LOD(0.3f, GetComponentsInChildren<Renderer>().Take(1).ToArray());
        // 30-60%: średnia jakość
        lods[1] = new LOD(0.1f, GetComponentsInChildren<Renderer>().Skip(1).Take(1).ToArray());
        // 60-100%: billboard / imposter
        lods[2] = new LOD(0.02f, GetComponentsInChildren<Renderer>().Skip(2).ToArray());

        lodGroup.SetLODs(lods);
        lodGroup.RecalculateBounds();
    }

    // Object Pooling — zamiast Instantiate/Destroy
    private Queue<GameObject> bulletPool = new Queue<GameObject>();
    [SerializeField] private GameObject bulletPrefab;

    public GameObject GetBullet()
    {
        if (bulletPool.Count > 0)
        {
            var bullet = bulletPool.Dequeue();
            bullet.SetActive(true);
            return bullet;
        }
        return Instantiate(bulletPrefab);
    }

    public void ReturnBullet(GameObject bullet)
    {
        bullet.SetActive(false);
        bulletPool.Enqueue(bullet);
    }
}
```

## Universal Render Pipeline (URP) dla Mobile

```csharp
// URP — lżejszy renderer zoptymalizowany pod mobile
// Instalacja: Package Manager → Universal RP

// Custom URP Pass — post-processing na mobile
using UnityEngine.Rendering;
using UnityEngine.Rendering.Universal;

public class MobileBloomPass : ScriptableRenderPass
{
    private Material bloomMaterial;
    private RTHandle tempTexture;

    public MobileBloomPass(Material mat)
    {
        bloomMaterial = mat;
        renderPassEvent = RenderPassEvent.AfterRenderingPostProcessing;
    }

    public override void Execute(ScriptableRenderContext context, ref RenderingData renderingData)
    {
        var cmd = CommandBufferPool.Get("MobileBloom");

        // Prosty bloom w jednym przejściu — przyjazny dla GPU mobilnych
        Blit(cmd, renderingData.cameraData.renderer.cameraColorTargetHandle,
             tempTexture, bloomMaterial, 0);
        Blit(cmd, tempTexture,
             renderingData.cameraData.renderer.cameraColorTargetHandle, bloomMaterial, 1);

        context.ExecuteCommandBuffer(cmd);
        CommandBufferPool.Release(cmd);
    }
}
```

## Profiler — pomiar wydajności w Unity

```
Window → Analysis → Profiler

Kluczowe metryki dla mobile:
├── CPU:   Scripting (logika gry)
│          Physics (symulacja)
│          Rendering.OpaqueGeometry
├── GPU:   Opaque Pass
│          Transparent Pass
│          Shadow Pass
├── Memory: GC Alloc w każdej klatce → SpawnGarbage
└── Audio:  AudioSource.Update (koszty DSP)

Reguła:   GC Alloc w klatce == 0  (nie alokuj w Update!)
Target:   < 16.67ms całkowity czas klatki dla 60 FPS
```

## Addressables — system zarządzania zasobami

System Addressables pozwala ładować zasoby asynchronicznie, zmniejszać rozmiar APK i zarządzać pamięcią na urządzeniach mobilnych.

```csharp
using UnityEngine.AddressableAssets;
using UnityEngine.ResourceManagement.AsyncOperations;

public class AddressablesManager : MonoBehaviour
{
    [SerializeField] private AssetReference enemyPrefabRef;
    [SerializeField] private AssetLabelReference levelLabel;

    private List<AsyncOperationHandle> loadedHandles = new List<AsyncOperationHandle>();

    // Asynchroniczne ładowanie pojedynczego prefabu
    public async void LoadEnemyAsync(Vector3 spawnPosition)
    {
        var handle = Addressables.LoadAssetAsync<GameObject>(enemyPrefabRef);
        await handle.Task;

        if (handle.Status == AsyncOperationStatus.Succeeded)
        {
            Instantiate(handle.Result, spawnPosition, Quaternion.identity);
            loadedHandles.Add(handle); // zapamiętaj do zwolnienia pamięci
        }
        else
        {
            Debug.LogError($"Błąd ładowania: {handle.OperationException}");
        }
    }

    // Ładowanie wielu assetów po etykiecie
    public async void LoadLevelAssets(string label)
    {
        var handle = Addressables.LoadAssetsAsync<Sprite>(label, sprite =>
        {
            Debug.Log($"Załadowano sprite: {sprite.name}");
        });
        await handle.Task;
        loadedHandles.Add(handle);
    }

    // Zwalnianie pamięci — kluczowe na mobile!
    private void OnDestroy()
    {
        foreach (var handle in loadedHandles)
        {
            if (handle.IsValid())
                Addressables.Release(handle);
        }
    }

    // Pobieranie rozmiaru do pobrania przed załadowaniem
    public async void CheckDownloadSize(string label)
    {
        var sizeHandle = Addressables.GetDownloadSizeAsync(label);
        await sizeHandle.Task;
        long sizeBytes = sizeHandle.Result;
        Debug.Log($"Rozmiar do pobrania: {sizeBytes / 1024} KB");
        Addressables.Release(sizeHandle);
    }
}
```

**Dobre praktyki Addressables na mobile:**
- Grupuj assety w paczki według scen lub poziomów — ładuj tylko to, co potrzebne
- Zwalniaj uchwyty (`Release`) natychmiast po opuszczeniu sceny
- Używaj `Addressables.InstantiateAsync` zamiast `LoadAsset + Instantiate`, by Addressables śledziło cykl życia obiektów

## Cieniowanie i Universal Render Pipeline (URP)

URP (Universal Render Pipeline) to lżejszy potok renderowania zoptymalizowany pod urządzenia mobilne. Zastępuje Built-in RP i oferuje lepszą wydajność na GPU mobilnych.

```csharp
// Custom URP Renderer Feature — własny efekt post-processingu
using UnityEngine.Rendering;
using UnityEngine.Rendering.Universal;

public class MobileOutlinePass : ScriptableRenderPass
{
    private Material outlineMaterial;
    private RTHandle tempRT;
    private static readonly int OutlineColor = Shader.PropertyToID("_OutlineColor");

    public MobileOutlinePass(Material mat)
    {
        outlineMaterial = mat;
        // Wykonaj po renderowaniu nieprzezroczystych obiektów
        renderPassEvent = RenderPassEvent.AfterRenderingOpaques;
    }

    public override void OnCameraSetup(CommandBuffer cmd, ref RenderingData renderingData)
    {
        var desc = renderingData.cameraData.cameraTargetDescriptor;
        desc.depthBufferBits = 0;
        RenderingUtils.ReAllocateIfNeeded(ref tempRT, desc, name: "_TempOutlineRT");
    }

    public override void Execute(ScriptableRenderContext context, ref RenderingData renderingData)
    {
        var cmd = CommandBufferPool.Get("MobileOutline");
        outlineMaterial.SetColor(OutlineColor, Color.yellow);

        Blit(cmd, renderingData.cameraData.renderer.cameraColorTargetHandle,
             tempRT, outlineMaterial, 0);
        Blit(cmd, tempRT,
             renderingData.cameraData.renderer.cameraColorTargetHandle);

        context.ExecuteCommandBuffer(cmd);
        CommandBufferPool.Release(cmd);
    }

    public override void OnCameraCleanup(CommandBuffer cmd)
    {
        // Zwalniaj RTHandle po każdej klatce
        tempRT?.Release();
    }
}
```

**Optymalizacja shaderów URP na mobile:**
- Używaj `Unlit` lub `Simple Lit` zamiast `Lit` tam, gdzie to możliwe
- Wyłącz cienie dla obiektów drugoplanowych (`Cast Shadows: Off`)
- Ogranicz liczbę świateł per-obiekt w ustawieniach URP Asset (`Max Additional Lights: 2-4`)
- Preferuj tekstury skompresowane ETC2 (Android) lub ASTC (iOS/Android)

## Unity Profiler — profilowanie na urządzeniu mobilnym

Profiler Unity umożliwia wykrycie wąskich gardeł CPU, GPU i pamięci bezpośrednio na fizycznym urządzeniu.

```
Window → Analysis → Profiler  (Ctrl+7)

Podłączenie do urządzenia:
1. Build Settings → Development Build ✓ + Autoconnect Profiler ✓
2. Zainstaluj APK/IPA na urządzeniu
3. Profiler → Target: wybierz urządzenie z listy

Kluczowe metryki:
├── CPU Usage
│   ├── PlayerLoop → Update → Scripting  (logika gry)
│   ├── Physics.Processing              (symulacja fizyki)
│   └── Rendering.OpaqueGeometry        (draw calle)
├── GPU Usage
│   ├── Opaque Pass
│   ├── Transparent Pass
│   └── Shadow Pass (wyłącz na mobile gdy zbędne!)
├── Memory
│   ├── GC Alloc w klatce → dąż do 0!
│   ├── Textures / Meshes               (rozmiar w VRAM)
│   └── Audio Sources
└── Rendering
    ├── Batches                         (mniej = lepiej)
    ├── SetPass Calls
    └── Triangles / Vertices
```

```csharp
// Profilowanie własnego kodu — znaczniki w Profilerze
using Unity.Profiling;

public class EnemyAI : MonoBehaviour
{
    private static readonly ProfilerMarker PathfindingMarker =
        new ProfilerMarker("EnemyAI.Pathfinding");

    private static readonly ProfilerMarker DetectionMarker =
        new ProfilerMarker("EnemyAI.Detection");

    void Update()
    {
        using (DetectionMarker.Auto())
        {
            DetectPlayer(); // ten blok pojawi się w Profilerze
        }

        using (PathfindingMarker.Auto())
        {
            RecalculatePath(); // oddzielny pomiar
        }
    }
}
```

**Reguły wydajności na mobile:**
| Metryka | Cel (60 FPS) |
|---|---|
| Czas klatki | < 16,67 ms |
| GC Alloc/klatkę | 0 B |
| Draw Calls | < 100 |
| Trójkąty | < 100 000 |

## Input System — nowy system wejścia

Pakiet `com.unity.inputsystem` zastępuje stary `Input` API i obsługuje dotyk, gamepady i akcelerometr w jednolity sposób.

```csharp
using UnityEngine;
using UnityEngine.InputSystem;
using UnityEngine.InputSystem.EnhancedTouch;
using Touch = UnityEngine.InputSystem.EnhancedTouch.Touch;

public class TouchInputHandler : MonoBehaviour
{
    void OnEnable()
    {
        EnhancedTouchSupport.Enable();
        Touch.onFingerDown += OnFingerDown;
        Touch.onFingerMove += OnFingerMove;
        Touch.onFingerUp   += OnFingerUp;
    }

    void OnDisable()
    {
        Touch.onFingerDown -= OnFingerDown;
        Touch.onFingerMove -= OnFingerMove;
        Touch.onFingerUp   -= OnFingerUp;
        EnhancedTouchSupport.Disable();
    }

    private void OnFingerDown(Finger finger)
    {
        Ray ray = Camera.main.ScreenPointToRay(finger.currentTouch.screenPosition);
        if (Physics.Raycast(ray, out RaycastHit hit))
            hit.collider.GetComponent<IInteractable>()?.OnTap();
    }

    private void OnFingerMove(Finger finger)
    {
        Vector2 delta = finger.currentTouch.delta;
        Camera.main.transform.Rotate(Vector3.up, delta.x * 0.2f);
    }

    private void OnFingerUp(Finger finger) { }

    // Pinch-to-zoom przy dwóch palcach
    void Update()
    {
        var touches = Touch.activeTouches;
        if (touches.Count == 2)
        {
            float prevDist = Vector2.Distance(
                touches[0].screenPosition - touches[0].delta,
                touches[1].screenPosition - touches[1].delta);
            float currDist = Vector2.Distance(
                touches[0].screenPosition, touches[1].screenPosition);

            Camera.main.orthographicSize = Mathf.Clamp(
                Camera.main.orthographicSize - (currDist - prevDist) * 0.02f,
                2f, 20f);
        }
    }
}

// Input Actions — obsługa gamepada i klawiatury jednocześnie
public class PlayerController : MonoBehaviour
{
    private PlayerInputActions inputActions;
    private Vector2 moveInput;

    void Awake()
    {
        inputActions = new PlayerInputActions();
        inputActions.Player.Move.performed += ctx => moveInput = ctx.ReadValue<Vector2>();
        inputActions.Player.Move.canceled  += ctx => moveInput = Vector2.zero;
        inputActions.Player.Jump.performed += _ => Jump();
    }

    void OnEnable()  => inputActions.Enable();
    void OnDisable() => inputActions.Disable();

    void FixedUpdate()
    {
        GetComponent<Rigidbody>().MovePosition(
            transform.position + new Vector3(moveInput.x, 0, moveInput.y) * 5f * Time.fixedDeltaTime);
    }

    void Jump() => GetComponent<Rigidbody>().AddForce(Vector3.up * 400f);
}
```

## AR Foundation — rozszerzona rzeczywistość w Unity

AR Foundation to warstwa abstrakcji nad ARCore (Android) i ARKit (iOS), pozwalająca pisać jeden kod dla obu platform.

**Wymagania:** Pakiety `com.unity.xr.arfoundation`, `com.unity.xr.arcore` (Android), `com.unity.xr.arkit` (iOS).

```csharp
using UnityEngine;
using UnityEngine.XR.ARFoundation;
using UnityEngine.XR.ARSubsystems;
using System.Collections.Generic;

[RequireComponent(typeof(ARRaycastManager))]
public class ARObjectPlacer : MonoBehaviour
{
    [SerializeField] private GameObject placedPrefab;
    private ARRaycastManager raycastManager;
    private ARPlaneManager planeManager;
    private GameObject spawnedObject;
    private List<ARRaycastHit> hits = new List<ARRaycastHit>();

    void Awake()
    {
        raycastManager = GetComponent<ARRaycastManager>();
        planeManager   = GetComponent<ARPlaneManager>();
    }

    void Update()
    {
        if (Input.touchCount == 0) return;

        Touch touch = Input.GetTouch(0);
        if (touch.phase != TouchPhase.Began) return;

        // Rzut promienia na wykryte płaszczyzny AR
        if (raycastManager.Raycast(touch.position, hits, TrackableType.PlaneWithinPolygon))
        {
            Pose hitPose = hits[0].pose;

            if (spawnedObject == null)
                spawnedObject = Instantiate(placedPrefab, hitPose.position, hitPose.rotation);
            else
            {
                spawnedObject.transform.position = hitPose.position;
                spawnedObject.transform.rotation = hitPose.rotation;
            }

            // Ukryj płaszczyzny po umieszczeniu obiektu
            SetPlanesVisible(false);
        }
    }

    private void SetPlanesVisible(bool visible)
    {
        foreach (ARPlane plane in planeManager.trackables)
            plane.gameObject.SetActive(visible);
        planeManager.enabled = visible;
    }
}

// Śledzenie twarzy — ARKit/ARCore
public class FaceTracker : MonoBehaviour
{
    private ARFaceManager faceManager;

    void OnEnable()  => faceManager.facesChanged += OnFacesChanged;
    void OnDisable() => faceManager.facesChanged -= OnFacesChanged;

    private void OnFacesChanged(ARFacesChangedEventArgs args)
    {
        foreach (ARFace face in args.added)
            Debug.Log($"Wykryto twarz: {face.trackableId}");

        foreach (ARFace face in args.updated)
        {
            // Pobierz siatkę twarzy do nałożenia maski
            Mesh mesh = face.mesh;
        }
    }
}
```

**Konfiguracja AR Foundation:**
1. `Project Settings → XR Plug-in Management` → włącz ARCore (Android) / ARKit (iOS)
2. Android: minimalny API Level 24, włącz `Internet` i `Camera` permissions
3. iOS: dodaj `NSCameraUsageDescription` w `Info.plist`
4. Scena: dodaj `AR Session` i `AR Session Origin` (lub `XR Origin`) jako obiekty główne

## Linki dodatkowe

- [Unity Mobile Best Practices](https://unity.com/how-to/mobile-game-optimization)
- [Universal Render Pipeline](https://docs.unity3d.com/Packages/com.unity.render-pipelines.universal@latest)
- [Unity Profiler](https://docs.unity3d.com/Manual/Profiler.html)
- [Addressables Documentation](https://docs.unity3d.com/Packages/com.unity.addressables@1.21/manual/index.html)
- [Unity Input System](https://docs.unity3d.com/Packages/com.unity.inputsystem@latest)
- [AR Foundation](https://docs.unity3d.com/Packages/com.unity.xr.arfoundation@latest)
