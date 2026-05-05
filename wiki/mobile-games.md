# Programowanie gier mobilnych

Gry mobilne to największy rynek w branży gier - generują ponad 50% globalnych przychodów z gier. Tworzenie gier mobilnych różni się od desktopowych: ograniczone sesje użytkownika, ekran dotykowy, premium vs free-to-play, specyficzne silniki.

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

## Unity - najpopularniejszy silnik gier mobilnych

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

// Komponent gracza - plik PlayerController.cs
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
    
    void FixedUpdate()  // Fizyka w FixedUpdate - stały krok czasowy
    {
        // Nic tu - ruch w Update dla odpowiedzi na input
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
// GameEvents.cs - centralne zdarzenia gry
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

// Użycie - dodaj punkty
GameEvents.TriggerScoreChanged(score + 10);

// Subskrypcja - UI score
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

## Godot - open-source alternatywa

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

**Object Pooling** - zamiast tworzyć/niszczyć obiekty, recycluj je:

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

**Sprite Atlasing** - grupuj wiele grafik w jeden atlas (1 draw call zamiast N):
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

## 1. Projektowanie rozgrywki

### Rdzeń pętli rozgrywki (Core Gameplay Loop)

Każda dobra gra mobilna opiera się na krótkim, powtarzalnym cyklu akcji, który wciąga gracza. Pętla rozgrywki powinna być przyjemna już w pierwszych 30 sekundach.

```
Akcja gracza → Natychmiastowa informacja zwrotna → Nagroda → Postęp → Powrót do akcji
     ↑_____________________________________________________|
```

Przykład dla gry endless runner:
- **Akcja**: bieg + unikanie przeszkód
- **Informacja zwrotna**: animacja kolizji, efekty dźwiękowe
- **Nagroda**: monety, punkty, nowe skórki
- **Postęp**: wyższy wynik, odblokowane poziomy

### Framework MDA (Mechanics, Dynamics, Aesthetics)

MDA to narzędzie analityczne pozwalające zrozumieć, jak działają gry:

| Warstwa | Definicja | Przykład |
|---------|-----------|---------|
| **Mechanics** (Mechaniki) | Zasady i reguły gry | „gracz może skoczyć" |
| **Dynamics** (Dynamika) | Zachowania wynikające z mechanik | „timing skoków nad przeszkodami" |
| **Aesthetics** (Estetyka) | Emocje odczuwane przez gracza | „satysfakcja z perfekcyjnego przeskoku" |

Projektując grę mobilną, zacznij od **Aesthetics** (co chcesz, żeby gracz czuł), a następnie dobieraj Mechanics, które prowadzą do tych emocji.

### Skalowanie trudności

Krzywa trudności powinna być stopniowa. Zbyt trudna gra od razu zniechęca, zbyt łatwa nudzi:

```csharp
// DifficultyManager.cs - dynamiczne skalowanie trudności
public class DifficultyManager : MonoBehaviour
{
    [SerializeField] private float baseEnemySpeed = 3f;
    [SerializeField] private float speedIncreasePerLevel = 0.3f;
    [SerializeField] private int baseEnemyCount = 3;

    private int currentLevel = 1;

    public float GetEnemySpeed() =>
        baseEnemySpeed + (currentLevel - 1) * speedIncreasePerLevel;

    public int GetEnemyCount() =>
        baseEnemyCount + (currentLevel / 2);  // więcej wrogów co 2 poziomy

    public float GetSpawnInterval() =>
        Mathf.Max(0.5f, 2f - (currentLevel * 0.1f));  // minimum 0.5s między spawnem

    public void AdvanceLevel()
    {
        currentLevel++;
        Debug.Log($"Poziom {currentLevel}: prędkość={GetEnemySpeed():F1}, " +
                  $"wrogowie={GetEnemyCount()}");
    }
}
```

---

## 2. Audio w grach mobilnych

Dźwięk to 50% doświadczenia gry. Odpowiednio dobrane efekty dźwiękowe i muzyka budują immersję i wzmacniają informację zwrotną dla gracza.

### Unity - AudioSource i AudioClip

W Unity każdy obiekt grający dźwięk potrzebuje komponentu `AudioSource`:

```csharp
// AudioManager.cs - singleton do zarządzania dźwiękiem
public class AudioManager : MonoBehaviour
{
    public static AudioManager Instance { get; private set; }

    [Header("Efekty dźwiękowe")]
    [SerializeField] private AudioClip jumpSound;
    [SerializeField] private AudioClip coinPickupSound;
    [SerializeField] private AudioClip gameOverSound;

    [Header("Muzyka")]
    [SerializeField] private AudioClip backgroundMusic;

    private AudioSource sfxSource;   // do efektów - krótkie dźwięki
    private AudioSource musicSource; // do muzyki - pętla w tle

    void Awake()
    {
        if (Instance != null) { Destroy(gameObject); return; }
        Instance = this;
        DontDestroyOnLoad(gameObject);

        // Dwa oddzielne AudioSource - SFX i muzyka
        sfxSource = gameObject.AddComponent<AudioSource>();
        musicSource = gameObject.AddComponent<AudioSource>();
        musicSource.loop = true;
        musicSource.volume = 0.4f;
    }

    void Start() => PlayMusic(backgroundMusic);

    public void PlaySFX(AudioClip clip, float volume = 1f) =>
        sfxSource.PlayOneShot(clip, volume);  // PlayOneShot - nakłada dźwięki

    public void PlayJump()   => PlaySFX(jumpSound);
    public void PlayCoin()   => PlaySFX(coinPickupSound, 0.8f);
    public void PlayGameOver() => PlaySFX(gameOverSound);

    public void PlayMusic(AudioClip clip)
    {
        musicSource.clip = clip;
        musicSource.Play();
    }

    public void SetMusicVolume(float volume) => musicSource.volume = volume;
    public void SetSFXVolume(float volume)   => sfxSource.volume = volume;
    public void ToggleMusic() => musicSource.mute = !musicSource.mute;
}
```

### Android natywny - SoundPool vs MediaPlayer

W natywnym Androidzie (Kotlin) wybór klasy do odtwarzania dźwięku zależy od zastosowania:

| Klasa | Zastosowanie | Latencja |
|-------|-------------|---------|
| **SoundPool** | Krótkie efekty SFX (< 1s) | Bardzo niska |
| **MediaPlayer** | Muzyka tła, długie pliki | Wyższa |
| **AudioClip** (Jetpack) | Proste odtwarzanie | Średnia |

```kotlin
// SoundManager.kt - zarządzanie dźwiękiem w Android
class SoundManager(private val context: Context) {

    // SoundPool - pula dla efektów dźwiękowych
    private val soundPool = SoundPool.Builder()
        .setMaxStreams(10)  // maks. 10 jednoczesnych dźwięków
        .setAudioAttributes(
            AudioAttributes.Builder()
                .setUsage(AudioAttributes.USAGE_GAME)
                .setContentType(AudioAttributes.CONTENT_TYPE_SONIFICATION)
                .build()
        )
        .build()

    private var jumpSoundId = 0
    private var coinSoundId = 0
    private var mediaPlayer: MediaPlayer? = null

    fun loadSounds() {
        jumpSoundId = soundPool.load(context, R.raw.jump, 1)
        coinSoundId = soundPool.load(context, R.raw.coin, 1)
    }

    fun playJump()  = soundPool.play(jumpSoundId, 1f, 1f, 0, 0, 1f)
    fun playCoin()  = soundPool.play(coinSoundId, 0.8f, 0.8f, 0, 0, 1f)

    fun startMusic() {
        mediaPlayer = MediaPlayer.create(context, R.raw.background_music).apply {
            isLooping = true
            setVolume(0.5f, 0.5f)
            start()
        }
    }

    fun stopMusic() {
        mediaPlayer?.stop()
        mediaPlayer?.release()
        mediaPlayer = null
    }

    fun release() {
        soundPool.release()
        stopMusic()
    }
}
```

> **Uwaga:** Zawsze zwalniaj zasoby `SoundPool` i `MediaPlayer` w `onDestroy()` Activity, żeby uniknąć wycieków pamięci.

---

## 3. Zapisywanie stanu gry

### PlayerPrefs - proste dane lokalne

`PlayerPrefs` to najprostszy sposób na zapis małych wartości (wyniki, ustawienia):

```csharp
// SaveManager.cs
public static class SaveManager
{
    private const string KEY_HIGH_SCORE  = "HighScore";
    private const string KEY_COINS       = "TotalCoins";
    private const string KEY_MUSIC_ON    = "MusicEnabled";
    private const string KEY_LEVEL       = "CurrentLevel";

    public static void SaveHighScore(int score)
    {
        if (score > GetHighScore())
            PlayerPrefs.SetInt(KEY_HIGH_SCORE, score);
        PlayerPrefs.Save();  // wymuś zapis na dysk
    }

    public static int  GetHighScore()    => PlayerPrefs.GetInt(KEY_HIGH_SCORE, 0);
    public static int  GetCoins()        => PlayerPrefs.GetInt(KEY_COINS, 0);
    public static bool IsMusicEnabled()  => PlayerPrefs.GetInt(KEY_MUSIC_ON, 1) == 1;
    public static int  GetCurrentLevel() => PlayerPrefs.GetInt(KEY_LEVEL, 1);

    public static void AddCoins(int amount)
    {
        PlayerPrefs.SetInt(KEY_COINS, GetCoins() + amount);
        PlayerPrefs.Save();
    }

    public static void ResetAll() => PlayerPrefs.DeleteAll();
}
```

> **Ograniczenia PlayerPrefs:** przechowuje tylko `int`, `float`, `string`. Nie szyfruje danych - nie używaj do przechowywania wrażliwych informacji.

### Room Database - złożone zapisy (Android)

Dla bardziej rozbudowanych gier (wiele postaci, inwentarz, historia) użyj Room:

```kotlin
// Encja zapisu gry
@Entity(tableName = "game_saves")
data class GameSave(
    @PrimaryKey(autoGenerate = true) val id: Int = 0,
    val slotName: String,
    val playerLevel: Int,
    val playerHealth: Float,
    val coinsCollected: Int,
    val currentScene: String,
    val savedAt: Long = System.currentTimeMillis()
)

// DAO
@Dao
interface GameSaveDao {
    @Query("SELECT * FROM game_saves ORDER BY savedAt DESC")
    fun getAllSaves(): Flow<List<GameSave>>

    @Query("SELECT * FROM game_saves WHERE slotName = :slot LIMIT 1")
    suspend fun getSaveBySlot(slot: String): GameSave?

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun saveGame(save: GameSave)

    @Delete
    suspend fun deleteSave(save: GameSave)
}

// Użycie w ViewModel
class GameViewModel(private val dao: GameSaveDao) : ViewModel() {

    fun saveCurrentProgress(scene: String, health: Float, coins: Int) {
        viewModelScope.launch {
            dao.saveGame(GameSave(
                slotName = "autosave",
                playerLevel = currentLevel,
                playerHealth = health,
                coinsCollected = coins,
                currentScene = scene
            ))
        }
    }
}
```

### Synchronizacja z chmurą

Google Play Games Services oferuje **Saved Games API** do synchronizacji zapisów między urządzeniami. Unity posiada pakiet `Google Play Games Plugin`:

```csharp
// CloudSaveManager.cs (Unity + Google Play Games Plugin)
using GooglePlayGames;
using GooglePlayGames.BasicApi.SavedGame;

public class CloudSaveManager : MonoBehaviour
{
    private const string SAVE_FILE_NAME = "PlayerProgress";

    public void SaveToCloud(byte[] data)
    {
        ISavedGameClient savedGameClient = PlayGamesPlatform.Instance.SavedGame;
        savedGameClient.OpenWithAutomaticConflictResolution(
            SAVE_FILE_NAME,
            DataSource.ReadCacheOrNetwork,
            ConflictResolutionStrategy.UseLongestPlaytime,
            (status, metadata) =>
            {
                if (status == SavedGameRequestStatus.Success)
                {
                    var update = new SavedGameMetadataUpdate.Builder()
                        .WithUpdatedPlayedTime(TimeSpan.FromHours(1))
                        .WithUpdatedDescription("Autosave")
                        .Build();
                    savedGameClient.CommitUpdate(metadata, update, data,
                        (commitStatus, _) => Debug.Log($"Zapis w chmurze: {commitStatus}"));
                }
            });
    }
}
```

---

## 4. Obsługa dotyku i gestów

### Multi-touch w Unity

Unity udostępnia tablicę `Input.touches` do obsługi wielu jednoczesnych dotknięć:

```csharp
// TouchInputHandler.cs
public class TouchInputHandler : MonoBehaviour
{
    void Update()
    {
        // Iteracja po wszystkich aktywnych dotknięciach
        for (int i = 0; i < Input.touchCount; i++)
        {
            Touch touch = Input.GetTouch(i);

            switch (touch.phase)
            {
                case TouchPhase.Began:
                    OnTouchBegan(touch);
                    break;
                case TouchPhase.Moved:
                    OnTouchMoved(touch);
                    break;
                case TouchPhase.Ended:
                case TouchPhase.Canceled:
                    OnTouchEnded(touch);
                    break;
            }
        }

        // Pinch-to-zoom - dwa palce
        if (Input.touchCount == 2)
            HandlePinchZoom();
    }

    private void HandlePinchZoom()
    {
        Touch t0 = Input.GetTouch(0);
        Touch t1 = Input.GetTouch(1);

        Vector2 prev0 = t0.position - t0.deltaPosition;
        Vector2 prev1 = t1.position - t1.deltaPosition;

        float prevDist = Vector2.Distance(prev0, prev1);
        float currDist = Vector2.Distance(t0.position, t1.position);
        float delta    = currDist - prevDist;

        Camera.main.orthographicSize = Mathf.Clamp(
            Camera.main.orthographicSize - delta * 0.01f, 2f, 10f);
    }

    private void OnTouchBegan(Touch t) { /* ... */ }
    private void OnTouchMoved(Touch t) { /* ... */ }
    private void OnTouchEnded(Touch t) { /* ... */ }
}
```

### Rozpoznawanie gestów - swipe

```csharp
// SwipeDetector.cs
public class SwipeDetector : MonoBehaviour
{
    [SerializeField] private float minSwipeDistance = 50f;

    private Vector2 touchStartPos;
    private float   touchStartTime;

    public event Action<Vector2> OnSwipe; // kierunek jako znormalizowany wektor

    void Update()
    {
        if (Input.touchCount != 1) return;
        Touch touch = Input.GetTouch(0);

        if (touch.phase == TouchPhase.Began)
        {
            touchStartPos  = touch.position;
            touchStartTime = Time.time;
        }
        else if (touch.phase == TouchPhase.Ended)
        {
            Vector2 swipeDelta = touch.position - touchStartPos;

            if (swipeDelta.magnitude >= minSwipeDistance)
            {
                // Normalizuj do 4 kierunków
                Vector2 dir = GetSwipeDirection(swipeDelta);
                OnSwipe?.Invoke(dir);
            }
        }
    }

    private Vector2 GetSwipeDirection(Vector2 delta)
    {
        if (Mathf.Abs(delta.x) > Mathf.Abs(delta.y))
            return delta.x > 0 ? Vector2.right : Vector2.left;
        else
            return delta.y > 0 ? Vector2.up : Vector2.down;
    }
}

// Użycie w kontrolerze gracza
public class PlayerSwipeController : MonoBehaviour
{
    private SwipeDetector swipeDetector;

    void Start()
    {
        swipeDetector = FindObjectOfType<SwipeDetector>();
        swipeDetector.OnSwipe += HandleSwipe;
    }

    void OnDestroy() => swipeDetector.OnSwipe -= HandleSwipe;

    private void HandleSwipe(Vector2 dir)
    {
        if      (dir == Vector2.right) MoveRight();
        else if (dir == Vector2.left)  MoveLeft();
        else if (dir == Vector2.up)    Jump();
        else if (dir == Vector2.down)  Slide();
    }

    private void MoveRight() => Debug.Log("→ Ruch w prawo");
    private void MoveLeft()  => Debug.Log("← Ruch w lewo");
    private void Jump()      => Debug.Log("↑ Skok");
    private void Slide()     => Debug.Log("↓ Ślizg");
}
```

### Gesty natywne w Android (Kotlin)

```kotlin
// GameGestureListener.kt
class GameGestureListener(
    private val onSwipeLeft:  () -> Unit,
    private val onSwipeRight: () -> Unit,
    private val onSwipeUp:    () -> Unit,
    private val onDoubleTap:  () -> Unit
) : GestureDetector.SimpleOnGestureListener() {

    companion object {
        private const val SWIPE_THRESHOLD     = 100
        private const val SWIPE_VELOCITY_THRESHOLD = 100
    }

    override fun onDoubleTap(e: MotionEvent): Boolean {
        onDoubleTap()
        return true
    }

    override fun onFling(
        e1: MotionEvent?, e2: MotionEvent,
        velocityX: Float, velocityY: Float
    ): Boolean {
        val diffX = e2.x - (e1?.x ?: 0f)
        val diffY = e2.y - (e1?.y ?: 0f)

        if (kotlin.math.abs(diffX) > kotlin.math.abs(diffY)) {
            if (kotlin.math.abs(diffX) > SWIPE_THRESHOLD &&
                kotlin.math.abs(velocityX) > SWIPE_VELOCITY_THRESHOLD) {
                if (diffX > 0) onSwipeRight() else onSwipeLeft()
                return true
            }
        } else if (kotlin.math.abs(diffY) > SWIPE_THRESHOLD &&
                   kotlin.math.abs(velocityY) > SWIPE_VELOCITY_THRESHOLD) {
            if (diffY < 0) onSwipeUp()
            return true
        }
        return false
    }
}
```

---

## 5. Integracja Google Play Games

Google Play Games Services (GPGS) to platforma oferująca osiągnięcia, tabele wyników i zapisy w chmurze dla gier Android.

### Konfiguracja w projekcie Android

Dodaj zależność w `build.gradle`:

```kotlin
dependencies {
    implementation("com.google.android.gms:play-services-games-v2:20.1.0")
}
```

Inicjalizacja w `Application`:

```kotlin
class MyGameApplication : Application() {
    override fun onCreate() {
        super.onCreate()
        PlayGamesSdk.initialize(this)
    }
}
```

### Osiągnięcia (Achievements)

```kotlin
// AchievementsManager.kt
object AchievementsManager {

    fun unlockAchievement(activity: Activity, achievementId: String) {
        PlayGames.getAchievementsClient(activity)
            .unlock(achievementId)
    }

    fun incrementAchievement(activity: Activity, achievementId: String, steps: Int) {
        PlayGames.getAchievementsClient(activity)
            .increment(achievementId, steps)
    }

    fun showAchievements(activity: Activity) {
        PlayGames.getAchievementsClient(activity)
            .achievementsIntent
            .addOnSuccessListener { intent ->
                activity.startActivityForResult(intent, RC_ACHIEVEMENT_UI)
            }
    }

    private const val RC_ACHIEVEMENT_UI = 9003
}

// Przykładowe użycie po zebraniu 100 monet:
AchievementsManager.unlockAchievement(this, getString(R.string.achievement_100_coins))
```

### Tabele wyników (Leaderboards)

```kotlin
// LeaderboardManager.kt
object LeaderboardManager {

    fun submitScore(activity: Activity, leaderboardId: String, score: Long) {
        PlayGames.getLeaderboardsClient(activity)
            .submitScore(leaderboardId, score)
    }

    fun showLeaderboard(activity: Activity, leaderboardId: String) {
        PlayGames.getLeaderboardsClient(activity)
            .getLeaderboardIntent(leaderboardId)
            .addOnSuccessListener { intent ->
                activity.startActivityForResult(intent, RC_LEADERBOARD_UI)
            }
    }

    fun loadTopScores(activity: Activity, leaderboardId: String,
                      onResult: (List<LeaderboardScore>) -> Unit) {
        PlayGames.getLeaderboardsClient(activity)
            .loadTopScores(leaderboardId, LeaderboardVariant.TIME_SPAN_ALL_TIME,
                           LeaderboardVariant.COLLECTION_PUBLIC, 10)
            .addOnSuccessListener { data ->
                val scores = data.get()?.scores?.map { it } ?: emptyList()
                onResult(scores)
                data.release()
            }
    }

    private const val RC_LEADERBOARD_UI = 9004
}
```

### Logowanie gracza

```kotlin
// W MainActivity.kt
class MainActivity : AppCompatActivity() {

    private lateinit var gamesSignInClient: GamesSignInClient

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        gamesSignInClient = PlayGames.getGamesSignInClient(this)

        gamesSignInClient.isAuthenticated.addOnCompleteListener { task ->
            val isAuthenticated = task.isSuccessful && task.result.isAuthenticated
            if (isAuthenticated) {
                // Gracz zalogowany - pobierz ID gracza
                PlayGames.getPlayersClient(this).currentPlayer
                    .addOnSuccessListener { player ->
                        val playerId = player.playerId
                        val playerName = player.displayName
                        Log.d("GPGS", "Zalogowany: $playerName ($playerId)")
                    }
            } else {
                // Opcjonalne ręczne logowanie
                gamesSignInClient.signIn()
            }
        }
    }
}
```

---

## 6. Optymalizacja dla różnych urządzeń

Rynek Android to tysiące urządzeń o różnych rozdzielczościach, gęstościach pikseli i proporcjach ekranu. Gra musi wyglądać i działać poprawnie na każdym z nich.

### Rozdzielczości i gęstości pikseli (Android)

```
ldpi:   ~120 dpi  (0.75×)   - stare urządzenia
mdpi:   ~160 dpi  (1.0×)    - baza
hdpi:   ~240 dpi  (1.5×)    - typowe telefony
xhdpi:  ~320 dpi  (2.0×)    - większość nowoczesnych
xxhdpi: ~480 dpi  (3.0×)    - flagowce
xxxhdpi:~640 dpi  (4.0×)    - tablety premium
```

Grafiki trzymaj w katalogach `drawable-mdpi/`, `drawable-xhdpi/` itd. System automatycznie dobierze odpowiedni zasób.

### Unity - Camera i Canvas Scaler

```csharp
// CameraSetup.cs - stały obszar widzenia niezależnie od rozdzielczości
public class CameraSetup : MonoBehaviour
{
    [SerializeField] private float targetAspect = 9f / 16f; // portret 9:16

    void Start()
    {
        float windowAspect = (float)Screen.width / Screen.height;
        float scaleHeight  = windowAspect / targetAspect;

        Camera cam = GetComponent<Camera>();

        if (scaleHeight < 1.0f)
        {
            // Ekran szerszy niż docelowy - pillarbox (czarne pasy po bokach)
            Rect rect = cam.rect;
            rect.width  = scaleHeight;
            rect.x      = (1f - scaleHeight) / 2f;
            rect.y      = 0;
            rect.height = 1f;
            cam.rect = rect;
        }
        else
        {
            // Ekran węższy - letterbox (czarne pasy góra/dół)
            float scaleWidth = 1f / scaleHeight;
            Rect rect = cam.rect;
            rect.x      = 0;
            rect.y      = (1f - scaleWidth) / 2f;
            rect.width  = 1f;
            rect.height = scaleWidth;
            cam.rect = rect;
        }
    }
}
```

Dla UI używaj `Canvas Scaler` w trybie **Scale With Screen Size**:
- **Reference Resolution**: 1080 × 1920
- **Screen Match Mode**: Match Width Or Height → 0.5 (równoważy oba wymiary)

### Wykrywanie możliwości urządzenia (Android)

```kotlin
// DeviceCapabilityDetector.kt
object DeviceCapabilityDetector {

    enum class PerformanceTier { LOW, MEDIUM, HIGH }

    fun getPerformanceTier(context: Context): PerformanceTier {
        val activityManager = context.getSystemService(Context.ACTIVITY_SERVICE)
            as ActivityManager
        val memInfo = ActivityManager.MemoryInfo()
        activityManager.getMemoryInfo(memInfo)

        val totalRamMb = memInfo.totalMem / (1024 * 1024)
        val cpuCores   = Runtime.getRuntime().availableProcessors()

        return when {
            totalRamMb >= 4096 && cpuCores >= 8 -> PerformanceTier.HIGH
            totalRamMb >= 2048 && cpuCores >= 4 -> PerformanceTier.MEDIUM
            else                                 -> PerformanceTier.LOW
        }
    }

    fun applyQualitySettings(context: Context) {
        when (getPerformanceTier(context)) {
            PerformanceTier.HIGH   -> enableHighQuality()
            PerformanceTier.MEDIUM -> enableMediumQuality()
            PerformanceTier.LOW    -> enableLowQuality()
        }
    }

    private fun enableHighQuality()   { /* cienie, efekty cząsteczkowe, AA */ }
    private fun enableMediumQuality() { /* ograniczone cienie */ }
    private fun enableLowQuality()    { /* minimum graficzne */ }
}
```

### Proporcje ekranu - pułapki

Popularne proporcje na rynku Android (2024):

| Proporcja | Udział rynkowy | Urządzenia |
|-----------|---------------|-----------|
| 20:9      | ~35%          | Flagowce Samsung, Xiaomi |
| 19.5:9    | ~25%          | Pixel, OnePlus |
| 16:9      | ~20%          | Starsze urządzenia |
| 4:3       | ~10%          | Tablety |

Testuj grę na **minimum 3 proporcjach** - użyj AVD Manager w Android Studio i Unity Device Simulator.

---

## Linki

- [Unity Learn](https://learn.unity.com)
- [Godot Engine](https://godotengine.org)
- [Unity Mobile Optimization](https://unity.com/how-to/mobile-game-optimization)
- [Google Play Games Services](https://developer.android.com/games/pgs)
- [Android SoundPool docs](https://developer.android.com/reference/android/media/SoundPool)
- [Android Supporting Multiple Screens](https://developer.android.com/guide/practices/screens_support)
- [MDA Framework - Hunicke, LeBlanc, Zubek](https://users.cs.northwestern.edu/~hunicke/MDA.pdf)
