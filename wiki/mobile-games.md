# Programowanie Gier Mobilnych

Gry mobilne to największy rynek w branży gier — generują ponad 50% globalnych przychodów z gier. Tworzenie gier mobilnych różni się od desktopowych: ograniczone sesje użytkownika, ekran dotykowy, premium vs free-to-play, specyficzne silniki.

## Architektura pętli gry

Każda gra działa w oparciu o pętlę:

```
┌─────────────────────────────────────────┐
│              Game Loop                   │
│                                          │
│  Input → Update State → Render → Sleep  │
│  (16.6ms przy 60fps, 8.3ms przy 120fps) │
└─────────────────────────────────────────┘
```

## Unity — najpopularniejszy silnik gier mobilnych

Unity to najpowszechniej używany silnik gier mobilnych. Obsługuje Android, iOS, WebGL i ponad 20 innych platform. Językiem skryptowania jest **C#**.

### Struktura projektu Unity

```
Assets/
├── Scripts/        ← logika gry w C#
├── Scenes/         ← sceny gry
├── Prefabs/        ← wielokrotnie używane obiekty
├── Materials/      ← materiały/shadery
├── Textures/       ← obrazy
├── Audio/          ← dźwięki
└── Animations/     ← animacje
```

### Podstawy C# w Unity

```csharp
using UnityEngine;

// Komponent gracza — plik PlayerController.cs
public class PlayerController : MonoBehaviour
{
    [SerializeField] private float moveSpeed = 5f;
    [SerializeField] private float jumpForce = 8f;
    
    private Rigidbody2D rb;
    private bool isGrounded;
    
    void Start()
    {
        rb = GetComponent<Rigidbody2D>();
    }
    
    void Update()
    {
        HandleInput();
    }
    
    void FixedUpdate()  // Fizyka w FixedUpdate — stały krok czasowy
    {
        // Nic tu — ruch w Update dla odpowiedzi na input
    }
    
    private void HandleInput()
    {
        // Wejście z ekranu dotykowego
        if (Input.touchCount > 0)
        {
            Touch touch = Input.GetTouch(0);
            
            if (touch.phase == TouchPhase.Began)
            {
                // Ruch w prawo/lewo zależnie od strony ekranu
                float screenMid = Screen.width / 2f;
                if (touch.position.x < screenMid)
                    MoveLeft();
                else
                    MoveRight();
            }
        }
    }
    
    private void MoveRight()
    {
        rb.velocity = new Vector2(moveSpeed, rb.velocity.y);
        transform.localScale = Vector3.one;
    }
    
    private void MoveLeft()
    {
        rb.velocity = new Vector2(-moveSpeed, rb.velocity.y);
        transform.localScale = new Vector3(-1, 1, 1);  // odwróć sprite
    }
}
```

### System zdarzeń (Event System)

```csharp
// GameEvents.cs — centralne zdarzenia gry
public static class GameEvents
{
    public static event Action<int> OnScoreChanged;
    public static event Action OnPlayerDied;
    public static event Action<int> OnLevelCompleted;
    
    public static void TriggerScoreChanged(int newScore) => 
        OnScoreChanged?.Invoke(newScore);
    public static void TriggerPlayerDied() => 
        OnPlayerDied?.Invoke();
}

// Użycie — dodaj punkty
GameEvents.TriggerScoreChanged(score + 10);

// Subskrypcja — UI score
void OnEnable() => GameEvents.OnScoreChanged += UpdateScoreUI;
void OnDisable() => GameEvents.OnScoreChanged -= UpdateScoreUI;
```

### Zarządzanie stanem gry

```csharp
public enum GameState { MainMenu, Playing, Paused, GameOver }

public class GameManager : MonoBehaviour
{
    public static GameManager Instance { get; private set; }
    
    public GameState CurrentState { get; private set; }
    
    void Awake()
    {
        if (Instance != null) { Destroy(gameObject); return; }
        Instance = this;
        DontDestroyOnLoad(gameObject);  // przeżyj zmianę sceny
    }
    
    public void StartGame()
    {
        CurrentState = GameState.Playing;
        SceneManager.LoadScene("GameScene");
        Time.timeScale = 1f;
    }
    
    public void PauseGame()
    {
        CurrentState = GameState.Paused;
        Time.timeScale = 0f;  // zatrzymaj fizykę
    }
    
    public void GameOver()
    {
        CurrentState = GameState.GameOver;
        int currentScore = ScoreManager.Instance.Score;
        PlayerPrefs.SetInt("HighScore", Mathf.Max(currentScore, PlayerPrefs.GetInt("HighScore")));
        GameEvents.TriggerPlayerDied();
    }
}
```

## Godot — open-source alternatywa

Godot to darmowy silnik open-source z własnym językiem **GDScript** (podobny do Pythona):

```gdscript
# Player.gd
extends CharacterBody2D

@export var speed = 300.0
@export var jump_velocity = -600.0

func _physics_process(delta: float) -> void:
    # Grawitacja
    if not is_on_floor():
        velocity += get_gravity() * delta
    
    # Skok
    if Input.is_action_just_pressed("ui_accept") and is_on_floor():
        velocity.y = jump_velocity
    
    # Ruch poziomy
    var direction = Input.get_axis("ui_left", "ui_right")
    if direction:
        velocity.x = direction * speed
    else:
        velocity.x = move_toward(velocity.x, 0, speed)
    
    move_and_slide()
```

## Optymalizacja wydajności gier mobilnych

### Budżet wydajności (60 FPS = 16.6ms/klatka)

```
CPU render:     ~4ms
Physics:        ~3ms
Scripts:        ~4ms
Audio:          ~1ms
Overhead:       ~4ms
──────────────
Razem:         ~16ms
```

### Techniki optymalizacji

**Object Pooling** — zamiast tworzyć/niszczyć obiekty, recycluj je:

```csharp
public class BulletPool : MonoBehaviour
{
    [SerializeField] private GameObject bulletPrefab;
    private Queue<GameObject> pool = new Queue<GameObject>();
    
    public GameObject GetBullet()
    {
        if (pool.Count > 0)
        {
            var bullet = pool.Dequeue();
            bullet.SetActive(true);
            return bullet;
        }
        return Instantiate(bulletPrefab);
    }
    
    public void ReturnBullet(GameObject bullet)
    {
        bullet.SetActive(false);
        pool.Enqueue(bullet);
    }
}
```

**Sprite Atlasing** — grupuj wiele grafik w jeden atlas (1 draw call zamiast N):
```
Bez atlasu: 100 sprite'ów = 100 draw calls
Z atlasem:  100 sprite'ów = 1 draw call
```

## Monetyzacja gier mobilnych

| Model | Opis | Przykłady |
|-------|------|-----------|
| **Free-to-Play + IAP** | Darmowa gra, mikrotransakcje | Clash of Clans |
| **Premium** | Jednorazowy zakup | Monument Valley |
| **Freemium** | Darmowe + premium funkcje | Alto's Odyssey |
| **Reklamy** | Rewarded ads, interstitials | Casual games |
| **Subskrypcja** | Apple Arcade, Google Play Pass | Platformowe |

## Linki

- [Unity Learn](https://learn.unity.com)
- [Godot Engine](https://godotengine.org)
- [Unity Mobile Optimization](https://unity.com/how-to/mobile-game-optimization)
- [Google Play Games Services](https://developer.android.com/games/pgs)
