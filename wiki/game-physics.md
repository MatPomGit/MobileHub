# Fizyka i Kolizje w Grach Mobilnych

Silniki fizyczne w grach mobilnych muszą balansować realizm z wydajnością. Zarówno Unity (PhysX/Havok) jak i Godot (Jolt Physics) posiadają wbudowane silniki 3D i 2D. Dla prostych gier mobilnych fizyka 2D jest wystarczająca i znacznie lżejsza obliczeniowo.

## Podstawowe koncepty fizyki

```
Rigidbody — bryła sztywna z masą, prędkością i siłą grawitacji
Collider   — kształt detekcji kolizji (nie musi = kształt wizualny)
Trigger    — collider bez fizycznej blokady — tylko detekcja wejścia/wyjścia
Joint      — połączenie między bryłami (zawiasy, sprężyny, sznury)
Layer      — maska kolizji — kontroluje które obiekty ze sobą kolidują
```

## Unity — PhysX 2D

### Rigidbody2D i siły

```csharp
// Komponent gracza
[RequireComponent(typeof(Rigidbody2D))]
[RequireComponent(typeof(BoxCollider2D))]
public class PlayerController : MonoBehaviour
{
    [Header("Movement")]
    [SerializeField] float moveSpeed    = 8f;
    [SerializeField] float jumpForce    = 16f;
    [SerializeField] float gravityScale = 3f;   // silniejsza grawitacja = mniejszy łuk skoku

    [Header("Ground Check")]
    [SerializeField] Transform   groundCheck;
    [SerializeField] float       groundCheckRadius = 0.2f;
    [SerializeField] LayerMask   groundLayer;

    Rigidbody2D rb;
    bool isGrounded;

    void Awake()
    {
        rb = GetComponent<Rigidbody2D>();
        rb.gravityScale = gravityScale;
        rb.collisionDetectionMode = CollisionDetectionMode2D.Continuous;  // zapobiega przechodzeniu przez cienkie ściany
        rb.interpolation = RigidbodyInterpolation2D.Interpolate;          // wygładza ruch między klatkami fizyki
    }

    void FixedUpdate()   // fizyka zawsze w FixedUpdate, nie Update!
    {
        // Sprawdź grunt
        isGrounded = Physics2D.OverlapCircle(groundCheck.position, groundCheckRadius, groundLayer);

        // Poziomy ruch
        float horizontal = Input.GetAxisRaw("Horizontal");  // -1, 0, 1
        rb.velocity = new Vector2(horizontal * moveSpeed, rb.velocity.y);

        // Skok
        if (Input.GetButtonDown("Jump") && isGrounded)
        {
            rb.velocity = new Vector2(rb.velocity.x, 0);  // zeruj pionową prędkość przed skokiem
            rb.AddForce(Vector2.up * jumpForce, ForceMode2D.Impulse);
        }
    }

    // Animacja — odwróć sprite w kierunku ruchu
    void Update()
    {
        float horizontal = Input.GetAxisRaw("Horizontal");
        if (horizontal != 0)
            transform.localScale = new Vector3(Mathf.Sign(horizontal), 1, 1);
    }
}
```

### Kolizje i triggery

```csharp
// Detekcja kolizji fizycznych
void OnCollisionEnter2D(Collision2D collision)
{
    if (collision.gameObject.CompareTag("Enemy"))
    {
        // Sprawdź skąd trafiło — odrzuć gracza
        Vector2 hitDirection = (transform.position - collision.transform.position).normalized;
        rb.AddForce(hitDirection * 10f, ForceMode2D.Impulse);
        TakeDamage(10);
    }

    if (collision.gameObject.CompareTag("Platform"))
    {
        // Sprawdź czy wylądowałeś na górze
        foreach (ContactPoint2D contact in collision.contacts)
        {
            if (contact.normal.y > 0.7f)  // normalna skierowana do góry = górna powierzchnia
            {
                isGrounded = true;
                break;
            }
        }
    }
}

// Trigger — nie blokuje ruchu, tylko detekcja
[RequireComponent(typeof(Collider2D))]
public class Collectible : MonoBehaviour
{
    [SerializeField] int scoreValue = 10;

    void Awake()
    {
        // Upewnij się że collider jest triggerem
        GetComponent<Collider2D>().isTrigger = true;
    }

    void OnTriggerEnter2D(Collider2D other)
    {
        if (other.CompareTag("Player"))
        {
            GameManager.Instance.AddScore(scoreValue);
            // Efekty wizualne
            Instantiate(collectParticlePrefab, transform.position, Quaternion.identity);
            AudioSource.PlayClipAtPoint(collectSound, transform.position);
            Destroy(gameObject);
        }
    }
}
```

### Raycast — strzelanie, AI, LOS

```csharp
// Raycast 2D — wykryj co jest naprzód
public class EnemyAI : MonoBehaviour
{
    [SerializeField] float detectionRange = 8f;
    [SerializeField] LayerMask obstacleLayer;
    [SerializeField] LayerMask playerLayer;

    bool CanSeePlayer()
    {
        // Najpierw sprawdź dystans (tanie)
        Collider2D playerCollider = Physics2D.OverlapCircle(transform.position, detectionRange, playerLayer);
        if (playerCollider == null) return false;

        // Potem sprawdź linię widzenia (droższe — tylko gdy blisko)
        Vector2 toPlayer = playerCollider.transform.position - transform.position;
        RaycastHit2D hit = Physics2D.Raycast(transform.position, toPlayer.normalized, detectionRange, obstacleLayer | playerLayer);

        if (hit.collider != null && hit.collider.CompareTag("Player"))
        {
            Debug.DrawLine(transform.position, hit.point, Color.red);  // widoczne w Scene view
            return true;
        }
        return false;
    }

    // Raycast dla broni — bullet trace bez fizycznego pocisku
    void Shoot(Vector2 direction)
    {
        RaycastHit2D hit = Physics2D.Raycast(
            firePoint.position,
            direction,
            100f,
            ~LayerMask.GetMask("Player")  // ~ = wszystko poza Player
        );

        DrawBulletTrail(firePoint.position, hit ? hit.point : firePoint.position + (Vector3)(direction * 100f));

        if (hit && hit.collider.TryGetComponent<IDamageable>(out var damageable))
            damageable.TakeDamage(damage);
    }
}
```

## Efekty fizyczne specjalne

```csharp
// Sprężynowy podest
public class SpringPlatform : MonoBehaviour
{
    [SerializeField] float springForce = 25f;

    void OnCollisionEnter2D(Collision2D col)
    {
        if (col.gameObject.TryGetComponent<Rigidbody2D>(out var rb))
        {
            // Odrzuć w górę
            rb.velocity = new Vector2(rb.velocity.x, 0);
            rb.AddForce(Vector2.up * springForce, ForceMode2D.Impulse);
            // Animacja ściśnięcia i rozprężenia
            StartCoroutine(SpringAnimation());
        }
    }

    IEnumerator SpringAnimation()
    {
        transform.localScale = new Vector3(1.3f, 0.6f, 1);   // ściśnięcie
        yield return new WaitForSeconds(0.05f);
        transform.localScale = new Vector3(0.8f, 1.3f, 1);   // rozprężenie
        yield return new WaitForSeconds(0.05f);
        transform.localScale = Vector3.one;                    // powrót
    }
}

// Łańcuch z Joint2D
public class ChainSpawner : MonoBehaviour
{
    [SerializeField] GameObject chainLinkPrefab;
    [SerializeField] int chainLength = 8;

    void Start()
    {
        Rigidbody2D prevRb = GetComponent<Rigidbody2D>();
        for (int i = 0; i < chainLength; i++)
        {
            Vector3 pos = transform.position + Vector3.down * (i + 1) * 0.5f;
            GameObject link = Instantiate(chainLinkPrefab, pos, Quaternion.identity);
            var joint = link.GetComponent<HingeJoint2D>();
            joint.connectedBody = prevRb;
            prevRb = link.GetComponent<Rigidbody2D>();
        }
    }
}
```

## Godot 4 — Jolt Physics

```gdscript
# CharacterBody2D — specjalna klasa dla gracza
extends CharacterBody2D

const SPEED    = 200.0
const JUMP_VELOCITY = -450.0

@export var gravity = ProjectSettings.get_setting("physics/2d/default_gravity")

func _physics_process(delta: float) -> void:
    # Grawitacja
    if not is_on_floor():
        velocity.y += gravity * delta

    # Skok
    if Input.is_action_just_pressed("ui_accept") and is_on_floor():
        velocity.y = JUMP_VELOCITY

    # Ruch poziomy
    var direction = Input.get_axis("ui_left", "ui_right")
    velocity.x = direction * SPEED if direction else move_toward(velocity.x, 0, SPEED * 5 * delta)

    move_and_slide()  # obsługuje kolizje i ślizganie się po pochyłościach

# Sygnały kolizji
func _on_area_entered(area: Area2D) -> void:
    if area.is_in_group("coins"):
        area.collect()
        score += area.value
```

## Optymalizacja fizyki mobilnej

```csharp
// Zmniejsz fixed timestep dla wyższej wydajności (kosztem dokładności)
// Edit → Project Settings → Time → Fixed Delta Time
// Default: 0.02 (50fps fizyki), dla mobile rozważ 0.03 (33fps)

// Spatial partitioning — nie sprawdzaj kolizji z odległymi obiektami
void Update()
{
    // Wyłącz fizykę dla obiektów poza ekranem
    if (!IsVisibleOnScreen())
    {
        rb.simulated = false;  // "uśpi" Rigidbody
        return;
    }
    rb.simulated = true;
}

// Object Pooling — nie twórz/niszcz obiektów w czasie gry
public class BulletPool : MonoBehaviour
{
    [SerializeField] GameObject bulletPrefab;
    [SerializeField] int poolSize = 30;

    Queue<GameObject> pool = new Queue<GameObject>();

    void Start()
    {
        for (int i = 0; i < poolSize; i++)
        {
            var bullet = Instantiate(bulletPrefab);
            bullet.SetActive(false);
            pool.Enqueue(bullet);
        }
    }

    public GameObject Get(Vector3 pos, Quaternion rot)
    {
        var bullet = pool.Count > 0 ? pool.Dequeue() : Instantiate(bulletPrefab);
        bullet.transform.SetPositionAndRotation(pos, rot);
        bullet.SetActive(true);
        return bullet;
    }

    public void Return(GameObject bullet) { bullet.SetActive(false); pool.Enqueue(bullet); }
}
```

## Linki

- [Unity Physics 2D](https://docs.unity3d.com/Manual/Physics2DReference.html)
- [Godot Physics](https://docs.godotengine.org/en/stable/tutorials/physics/index.html)
- [Box2D (silnik 2D)](https://box2d.org)
- [Game Physics Cookbook](https://gamephysicscookbook.com)
