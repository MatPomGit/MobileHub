# Unity — Zaawansowane Techniki dla Mobile

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

## Linki dodatkowe

- [Unity Mobile Best Practices](https://unity.com/how-to/mobile-game-optimization)
- [Universal Render Pipeline](https://docs.unity3d.com/Packages/com.unity.render-pipelines.universal@latest)
- [Unity Profiler](https://docs.unity3d.com/Manual/Profiler.html)
