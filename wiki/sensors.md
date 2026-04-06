# Obsługa sensorów urządzenia mobilnego

Urządzenia mobilne są naszpikowane sensorami. Ich obsługa otwiera możliwości niedostępne w żadnej innej formie oprogramowania — od pomiaru kroku, przez nawigację AR, po wykrywanie upadków.

## Przegląd sensorów

| Sensor | Typ | Zastosowania |
|--------|-----|--------------|
| Akcelerometr | Ruch | Wykrywanie potrząśnięcia, krokomierz, orientacja |
| Żyroskop | Ruch | Precyzyjna rotacja, gry, VR/AR |
| Magnetometr | Pozycja | Kompas, wykrywanie metalu |
| Barometr | Środowiskowy | Wysokość, prognoza pogody |
| Termometr | Środowiskowy | Temperatura otoczenia |
| GPS/GNSS | Pozycja | Nawigacja, geofencing |
| Akcelerometr liniowy | Ruch | Ruch bez grawitacji |
| Sensor grawitacji | Ruch | Orientacja relative to gravity |
| Proximity | Inna | Wykrycie twarzy przy połączeniu |
| Ambient Light | Inna | Auto-brightness |
| Czytnik linii papilarnych | Biometria | Uwierzytelnienie |
| Kamera | Wizja | Zdjęcia, AR, CV |
| Mikrofon | Audio | Rozpoznawanie mowy, analiza dźwięku |

## Android Sensor Framework

```kotlin
class SensorActivity : ComponentActivity(), SensorEventListener {
    private lateinit var sensorManager: SensorManager
    private var accelerometer: Sensor? = null
    
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        
        sensorManager = getSystemService(SENSOR_SERVICE) as SensorManager
        accelerometer = sensorManager.getDefaultSensor(Sensor.TYPE_ACCELEROMETER)
    }
    
    override fun onResume() {
        super.onResume()
        // Zarejestruj listener z żądaną częstotliwością
        accelerometer?.let { sensor ->
            sensorManager.registerListener(
                this, sensor, 
                SensorManager.SENSOR_DELAY_GAME  // ~50 Hz
            )
        }
    }
    
    override fun onPause() {
        super.onPause()
        sensorManager.unregisterListener(this)  // WAŻNE: oszczędność baterii
    }
    
    override fun onSensorChanged(event: SensorEvent) {
        if (event.sensor.type == Sensor.TYPE_ACCELEROMETER) {
            val x = event.values[0]  // m/s² oś X
            val y = event.values[1]  // m/s² oś Y
            val z = event.values[2]  // m/s² oś Z
            
            // Oblicz moduł przyspieszenia
            val magnitude = sqrt(x*x + y*y + z*z)
            
            Log.d("Sensor", "Przyspieszenie: %.2f m/s²".format(magnitude))
        }
    }
    
    override fun onAccuracyChanged(sensor: Sensor, accuracy: Int) {
        // Obsługa zmiany dokładności
    }
}
```

### Częstotliwości próbkowania

```kotlin
SensorManager.SENSOR_DELAY_FASTEST  // ~200 Hz — maksymalna, gry VR
SensorManager.SENSOR_DELAY_GAME     // ~50 Hz — gry, AR
SensorManager.SENSOR_DELAY_UI       // ~16 Hz — animacje UI
SensorManager.SENSOR_DELAY_NORMAL   // ~5 Hz — ogólne monitorowanie
```

> **Zasada:** Używaj jak najniższej częstotliwości, która spełnia wymagania. Każdy Hz to zużyta energia baterii.

## Akcelerometr + Żyroskop — fuzja sensoryczna

Żaden sensor nie jest idealny. Akcelerometr szumi na krótką skalę, żyroskop dryfuje na długą. Filtr komplementarny łączy zalety obu:

```kotlin
class OrientationFusion {
    private val alpha = 0.98f  // waga żyroskopu
    private var pitch = 0f
    private var roll = 0f
    private var lastTimestamp = 0L
    
    fun update(accel: FloatArray, gyro: FloatArray, timestamp: Long): FloatArray {
        val dt = if (lastTimestamp != 0L) (timestamp - lastTimestamp) / 1e9f else 0f
        lastTimestamp = timestamp
        
        // Kąt z akcelerometru
        val accelPitch = atan2(-accel[0], sqrt(accel[1]*accel[1] + accel[2]*accel[2]))
        val accelRoll = atan2(accel[1], accel[2])
        
        // Filtr komplementarny
        pitch = alpha * (pitch + gyro[0] * dt) + (1 - alpha) * accelPitch
        roll  = alpha * (roll  + gyro[1] * dt) + (1 - alpha) * accelRoll
        
        return floatArrayOf(pitch, roll)
    }
}
```

## GPS i Geolokalizacja

```kotlin
// AndroidX — FusedLocationProviderClient (łączy GPS + WiFi + komórkowe)
class LocationActivity : AppCompatActivity() {
    private lateinit var fusedLocationClient: FusedLocationProviderClient
    
    private val locationRequest = LocationRequest.Builder(
        Priority.PRIORITY_HIGH_ACCURACY, 5000L  // co 5 sekund
    ).build()
    
    private val locationCallback = object : LocationCallback() {
        override fun onLocationResult(result: LocationResult) {
            result.lastLocation?.let { location ->
                val lat = location.latitude
                val lng = location.longitude
                val accuracy = location.accuracy  // metry
                Log.d("GPS", "($lat, $lng) ±${accuracy}m")
            }
        }
    }
    
    @SuppressLint("MissingPermission")
    fun startLocationUpdates() {
        fusedLocationClient.requestLocationUpdates(
            locationRequest, locationCallback, Looper.getMainLooper()
        )
    }
}
```

### Uprawnienia do lokalizacji

```xml
<!-- Lokalizacja gdy app jest aktywna -->
<uses-permission android:name="android.permission.ACCESS_FINE_LOCATION"/>
<uses-permission android:name="android.permission.ACCESS_COARSE_LOCATION"/>

<!-- Lokalizacja w tle — wymaga dodatkowego uzasadnienia -->
<uses-permission android:name="android.permission.ACCESS_BACKGROUND_LOCATION"/>
```

## Barometr — pomiar wysokości

```kotlin
val pressureSensor = sensorManager.getDefaultSensor(Sensor.TYPE_PRESSURE)

override fun onSensorChanged(event: SensorEvent) {
    if (event.sensor.type == Sensor.TYPE_PRESSURE) {
        val pressure = event.values[0]  // hPa
        // Przelicz na wysokość (przybliżona formuła barometryczna)
        val altitude = SensorManager.getAltitude(
            SensorManager.PRESSURE_STANDARD_ATMOSPHERE, pressure
        )
        Log.d("Barometr", "Ciśnienie: ${pressure} hPa, Wysokość: ${altitude} m")
    }
}
```

## Sensor kroków (Step Detector / Counter)

```kotlin
// TYPE_STEP_COUNTER — całkowita liczba kroków od ostatniego restartu
// TYPE_STEP_DETECTOR — event za każdym krokiem

val stepCounter = sensorManager.getDefaultSensor(Sensor.TYPE_STEP_COUNTER)

override fun onSensorChanged(event: SensorEvent) {
    if (event.sensor.type == Sensor.TYPE_STEP_COUNTER) {
        val totalSteps = event.values[0].toLong()
        val stepsToday = totalSteps - stepsAtMidnight
        Log.d("Kroki", "Dzisiaj: $stepsToday kroków")
    }
}
```

## Wykrywanie potrząśnięcia

```kotlin
class ShakeDetector(private val onShake: () -> Unit) : SensorEventListener {
    private val SHAKE_THRESHOLD = 15f  // m/s²
    private val MIN_TIME_BETWEEN_SHAKES = 500L  // ms
    private var lastShakeTime = 0L
    
    override fun onSensorChanged(event: SensorEvent) {
        if (event.sensor.type != Sensor.TYPE_ACCELEROMETER) return
        
        val x = event.values[0]
        val y = event.values[1]
        val z = event.values[2]
        
        val acceleration = sqrt(x*x + y*y + z*z) - SensorManager.GRAVITY_EARTH
        
        if (acceleration > SHAKE_THRESHOLD) {
            val now = System.currentTimeMillis()
            if (now - lastShakeTime > MIN_TIME_BETWEEN_SHAKES) {
                lastShakeTime = now
                onShake()
            }
        }
    }
}
```

## iOS — Core Motion Framework

Na platformie Apple odpowiednikiem Android Sensor Framework jest framework **Core Motion**. Centralnym obiektem jest `CMMotionManager`, który udostępnia dane z akcelerometru, żyroskopu, magnetometru oraz przetworzoną orientację urządzenia (fusion realizowana sprzętowo przez koprocesory M-series).

### CMMotionManager — akcelerometr i żyroskop

```swift
import CoreMotion

class MotionViewController: UIViewController {
    let motionManager = CMMotionManager()

    override func viewDidLoad() {
        super.viewDidLoad()
        startAccelerometer()
        startGyroscope()
    }

    func startAccelerometer() {
        guard motionManager.isAccelerometerAvailable else { return }

        motionManager.accelerometerUpdateInterval = 0.02  // 50 Hz
        motionManager.startAccelerometerUpdates(to: .main) { [weak self] data, error in
            guard let data = data else { return }
            let x = data.acceleration.x  // g (1g ≈ 9.81 m/s²)
            let y = data.acceleration.y
            let z = data.acceleration.z
            print("Akcelerometr: x=\(x), y=\(y), z=\(z)")
        }
    }

    func startGyroscope() {
        guard motionManager.isGyroAvailable else { return }

        motionManager.gyroUpdateInterval = 0.02
        motionManager.startGyroUpdates(to: .main) { data, error in
            guard let data = data else { return }
            // Prędkość kątowa w radianach/sekundę
            print("Żyroskop: x=\(data.rotationRate.x)")
        }
    }

    override func viewWillDisappear(_ animated: Bool) {
        super.viewWillDisappear(animated)
        motionManager.stopAccelerometerUpdates()
        motionManager.stopGyroUpdates()
    }
}
```

### DeviceMotion — gotowa fuzja sensoryczna

`CMDeviceMotion` to wygodne API, w którym iOS sam łączy dane z wielu sensorów i zwraca gotową orientację, grawitację i przyspieszenie liniowe:

```swift
func startDeviceMotion() {
    guard motionManager.isDeviceMotionAvailable else { return }

    motionManager.deviceMotionUpdateInterval = 0.05
    motionManager.startDeviceMotionUpdates(
        using: .xMagneticNorthZVertical,  // układ odniesienia
        to: .main
    ) { motion, error in
        guard let motion = motion else { return }

        // Kąty Eulera orientacji urządzenia
        let roll  = motion.attitude.roll   // radiany
        let pitch = motion.attitude.pitch
        let yaw   = motion.attitude.yaw

        // Czyste przyspieszenie (bez grawitacji)
        let linAccX = motion.userAcceleration.x

        // Prędkość rotacji (żyroskop skalibrowany)
        let rotX = motion.rotationRate.x
    }
}
```

### CMPedometer — krokomierz i aktywność

`CMPedometer` korzysta z dedykowanego koprocesora ruchu i działa nawet gdy aplikacja jest w tle, nie obciążając głównego CPU:

```swift
import CoreMotion

class PedometerManager {
    let pedometer = CMPedometer()

    func startStepCounting() {
        guard CMPedometer.isStepCountingAvailable() else { return }

        pedometer.startUpdates(from: Date()) { data, error in
            guard let data = data else { return }
            let steps        = data.numberOfSteps.intValue
            let distance     = data.distance?.doubleValue ?? 0  // metry
            let floorsUp     = data.floorsAscended?.intValue ?? 0
            let floorsDown   = data.floorsDescended?.intValue ?? 0
            print("Kroki: \(steps), Dystans: \(distance) m")
        }
    }

    func queryHistoricalSteps(from start: Date, to end: Date) {
        pedometer.queryPedometerData(from: start, to: end) { data, error in
            guard let data = data else { return }
            print("Historyczne kroki: \(data.numberOfSteps)")
        }
    }
}
```

> **Uwaga iOS:** `CMPedometer` wymaga uprawnienia `NSMotionUsageDescription` w pliku `Info.plist`. Bez tego wpisu system odrzuci wniosek o dostęp i nie wyświetli użytkownikowi okna dialogowego.

---

## Fuzja sensoryczna — filtr Kalmana

Filtr komplementarny jest prosty, ale nie optymalny. **Filtr Kalmana** to statystyczne podejście minimalizujące wariancję błędu estymacji — stanowi złoty standard w systemach nawigacyjnych i robotyce.

### Idea filtru Kalmana (1D)

Stan estymowany: prędkość kątowa; obserwacja: odczyt akcelerometru.

```
Predykcja:
  x̂ₖ|ₖ₋₁ = F · x̂ₖ₋₁ + B · uₖ        (model ruchu)
  Pₖ|ₖ₋₁ = F · Pₖ₋₁ · Fᵀ + Q         (propagacja kowariancji)

Aktualizacja:
  Kₖ = Pₖ|ₖ₋₁ · Hᵀ · (H · Pₖ|ₖ₋₁ · Hᵀ + R)⁻¹   (wzmocnienie Kalmana)
  x̂ₖ = x̂ₖ|ₖ₋₁ + Kₖ · (zₖ − H · x̂ₖ|ₖ₋₁)          (korekta)
  Pₖ = (I − Kₖ · H) · Pₖ|ₖ₋₁                       (aktualizacja kowariancji)
```

Gdzie:
- **Q** — kowariancja szumu procesu (jak bardzo ufamy modelowi)
- **R** — kowariancja szumu pomiaru (jak bardzo ufamy sensorowi)
- **K** — wzmocnienie Kalmana: gdy R→0, ufamy wyłącznie sensorowi; gdy Q→0, ufamy wyłącznie modelowi

### Implementacja prostego filtru Kalmana dla kąta (Kotlin)

```kotlin
class KalmanFilter1D(
    private var q: Float = 0.001f,  // szum procesu (dryft żyroskopu)
    private var r: Float = 0.03f    // szum pomiaru (szum akcelerometru)
) {
    private var angle = 0f   // estymowany kąt
    private var bias  = 0f   // estymowany bias żyroskopu
    private var p00   = 0f   // kowariancja błędu
    private var p01   = 0f
    private var p10   = 0f
    private var p11   = 0f

    fun update(gyroRate: Float, accelAngle: Float, dt: Float): Float {
        // --- Krok predykcji ---
        val rate = gyroRate - bias
        angle += rate * dt

        p00 += dt * (dt * p11 - p01 - p10 + q)
        p01 -= dt * p11
        p10 -= dt * p11
        p11 += q

        // --- Krok aktualizacji ---
        val s = p00 + r                    // innowacyjna kowariancja
        val k0 = p00 / s                   // wzmocnienie Kalmana — kąt
        val k1 = p10 / s                   // wzmocnienie Kalmana — bias

        val innovation = accelAngle - angle
        angle += k0 * innovation
        bias  += k1 * innovation

        p00 -= k0 * p00
        p01 -= k0 * p01
        p10 -= k1 * p00
        p11 -= k1 * p01

        return angle
    }
}

// Użycie:
val kalmanPitch = KalmanFilter1D()
val kalmanRoll  = KalmanFilter1D()

fun onSensorFusion(accel: FloatArray, gyro: FloatArray, dt: Float) {
    val accelPitch = atan2(-accel[0], sqrt(accel[1]*accel[1] + accel[2]*accel[2]))
    val accelRoll  = atan2(accel[1], accel[2])

    val pitch = kalmanPitch.update(gyro[0], accelPitch, dt)
    val roll  = kalmanRoll.update(gyro[1], accelRoll, dt)
}
```

| | Filtr komplementarny | Filtr Kalmana |
|---|---|---|
| Złożoność | Prosta (1 linia) | Umiarkowana (macierze) |
| Strojenie | 1 parametr (α) | 2 parametry (Q, R) |
| Optymalność | Heurystyczna | Statystycznie optymalna |
| Zastosowanie | Prototypy, gry | Nawigacja, AR, robotyka |

---

## Sensory w Jetpack Compose

W architekturze reaktywnej najwygodniej jest przekazać dane sensorów do kompozytów przez `StateFlow` lub `State<T>`. Sensor żyje w warstwie viewmodel/repository, a Compose jedynie obserwuje stan.

### ViewModel ze StateFlow

```kotlin
class SensorViewModel : ViewModel(), SensorEventListener {
    private val _acceleration = MutableStateFlow(Triple(0f, 0f, 0f))
    val acceleration: StateFlow<Triple<Float, Float, Float>> = _acceleration.asStateFlow()

    private val _orientation = MutableStateFlow(floatArrayOf(0f, 0f))
    val orientation: StateFlow<FloatArray> = _orientation.asStateFlow()

    private val fusion = OrientationFusion()

    // Wywołaj z Activity/Application context przy inicjalizacji
    fun initSensors(sensorManager: SensorManager) {
        sensorManager.getDefaultSensor(Sensor.TYPE_ACCELEROMETER)?.let {
            sensorManager.registerListener(this, it, SensorManager.SENSOR_DELAY_UI)
        }
    }

    override fun onSensorChanged(event: SensorEvent) {
        if (event.sensor.type == Sensor.TYPE_ACCELEROMETER) {
            val (x, y, z) = event.values
            _acceleration.value = Triple(x, y, z)
        }
    }

    override fun onAccuracyChanged(sensor: Sensor, accuracy: Int) {}

    override fun onCleared() {
        // Wyrejestruj listener gdy ViewModel jest niszczony
        super.onCleared()
    }
}
```

### Ekran Compose obserwujący dane sensorów

```kotlin
@Composable
fun SensorDashboard(viewModel: SensorViewModel = viewModel()) {
    val (x, y, z) by viewModel.acceleration.collectAsStateWithLifecycle()

    // Animowany wskaźnik przechylenia
    val tiltDegrees = remember(x, y) {
        Math.toDegrees(atan2(x.toDouble(), y.toDouble())).toFloat()
    }
    val rotation by animateFloatAsState(
        targetValue = tiltDegrees,
        animationSpec = spring(stiffness = Spring.StiffnessLow),
        label = "tiltRotation"
    )

    Column(
        modifier = Modifier.fillMaxSize().padding(24.dp),
        horizontalAlignment = Alignment.CenterHorizontally
    ) {
        Text("Akcelerometr", style = MaterialTheme.typography.headlineSmall)
        Spacer(Modifier.height(16.dp))

        // Wizualny kompas przechylenia
        Box(
            modifier = Modifier
                .size(120.dp)
                .rotate(rotation)
                .background(MaterialTheme.colorScheme.primaryContainer, CircleShape),
            contentAlignment = Alignment.Center
        ) {
            Text("▲", fontSize = 32.sp)
        }

        Spacer(Modifier.height(24.dp))

        SensorValueRow("X", x)
        SensorValueRow("Y", y)
        SensorValueRow("Z", z)
    }
}

@Composable
fun SensorValueRow(label: String, value: Float) {
    Row(
        modifier = Modifier.fillMaxWidth().padding(vertical = 4.dp),
        horizontalArrangement = Arrangement.SpaceBetween
    ) {
        Text(label, style = MaterialTheme.typography.bodyLarge)
        Text("%.3f m/s²".format(value), fontFamily = FontFamily.Monospace)
    }
}
```

### Rejestracja lifecycle-aware w Compose

```kotlin
@Composable
fun rememberSensorManager(): SensorManager {
    val context = LocalContext.current
    return remember { context.getSystemService(SensorManager::class.java) }
}

@Composable
fun SensorEffect(
    sensorType: Int,
    delay: Int = SensorManager.SENSOR_DELAY_UI,
    onSensorEvent: (SensorEvent) -> Unit
) {
    val sensorManager = rememberSensorManager()
    val lifecycleOwner = LocalLifecycleOwner.current

    DisposableEffect(lifecycleOwner, sensorType) {
        val listener = object : SensorEventListener {
            override fun onSensorChanged(event: SensorEvent) = onSensorEvent(event)
            override fun onAccuracyChanged(sensor: Sensor, accuracy: Int) {}
        }
        val sensor = sensorManager.getDefaultSensor(sensorType)
        sensor?.let { sensorManager.registerListener(listener, it, delay) }

        onDispose { sensorManager.unregisterListener(listener) }
    }
}

// Użycie wewnątrz dowolnego kompozytu:
@Composable
fun MyScreen() {
    var magnitude by remember { mutableFloatStateOf(0f) }

    SensorEffect(Sensor.TYPE_ACCELEROMETER) { event ->
        val (x, y, z) = event.values
        magnitude = sqrt(x*x + y*y + z*z)
    }

    Text("Moduł: %.2f m/s²".format(magnitude))
}
```

---

## Model uprawnień do sensorów

Większość sensorów ruchu (akcelerometr, żyroskop, barometr) **nie wymaga uprawnień** — są traktowane jako dane niskiej wrażliwości. Wyjątki:

| Sensor / API | Uprawnienie | Poziom API |
|---|---|---|
| Lokalizacja precyzyjna | `ACCESS_FINE_LOCATION` | wszystkie |
| Lokalizacja w tle | `ACCESS_BACKGROUND_LOCATION` | API 29+ |
| Krokomierz / aktywność fizyczna | `ACTIVITY_RECOGNITION` | API 29+ |
| Czytnik linii papilarnych | `USE_BIOMETRIC` | API 28+ |
| Mikrofon | `RECORD_AUDIO` | wszystkie |
| Kamera | `CAMERA` | wszystkie |
| Czujnik tętna (Wear OS) | `BODY_SENSORS` | API 20+ |
| Czujnik tętna w tle (Wear OS) | `BODY_SENSORS_BACKGROUND` | API 33+ |

### Deklaracja w AndroidManifest.xml

```xml
<!-- Aktywność fizyczna — wymagane od Android 10 -->
<uses-permission android:name="android.permission.ACTIVITY_RECOGNITION"/>

<!-- Czujniki ciała (Wear OS) -->
<uses-permission android:name="android.permission.BODY_SENSORS"/>
<uses-permission android:name="android.permission.BODY_SENSORS_BACKGROUND"/>

<!-- Funkcja dostępna tylko gdy urządzenie ma dany sensor -->
<uses-feature
    android:name="android.hardware.sensor.stepcounter"
    android:required="false"/>
<uses-feature
    android:name="android.hardware.sensor.gyroscope"
    android:required="false"/>
```

### Runtime permission dla ACTIVITY_RECOGNITION (Kotlin)

```kotlin
private val activityPermissionLauncher =
    registerForActivityResult(ActivityResultContracts.RequestPermission()) { granted ->
        if (granted) {
            registerStepCounter()
        } else {
            showPermissionRationale()
        }
    }

private fun checkAndRequestActivityPermission() {
    when {
        ContextCompat.checkSelfPermission(
            this, Manifest.permission.ACTIVITY_RECOGNITION
        ) == PackageManager.PERMISSION_GRANTED -> registerStepCounter()

        shouldShowRequestPermissionRationale(
            Manifest.permission.ACTIVITY_RECOGNITION
        ) -> showPermissionRationale()

        else -> activityPermissionLauncher.launch(
            Manifest.permission.ACTIVITY_RECOGNITION
        )
    }
}
```

> **Ważne:** Brak uprawnienia `ACTIVITY_RECOGNITION` na API 29+ powoduje, że `TYPE_STEP_COUNTER` i `TYPE_STEP_DETECTOR` **milczą** — nie wywołują wyjątku, tylko nie dostarczają zdarzeń. To częste źródło błędów.

---

## Wpływ na baterię i dobre praktyki

Sensory to jeden z największych pożeraczy energii w urządzeniu mobilnym. Poniżej zestawienie względnego zużycia:

| Sensor | Relatywne zużycie | Uwagi |
|---|---|---|
| GPS (tryb HIGH_ACCURACY) | ★★★★★ | Najdroższy — unikaj ciągłego używania |
| GPS (BALANCED_POWER) | ★★★☆☆ | Używa wież komórkowych i WiFi |
| Akcelerometr @ 200 Hz | ★★★☆☆ | Pełna prędkość na krótki czas |
| Akcelerometr @ 5 Hz | ★☆☆☆☆ | Bezpieczny do ciągłego monitorowania |
| Barometr | ★★☆☆☆ | Stosunkowo tani |
| Krokomierz (koprocesor) | ★☆☆☆☆ | Bardzo tani — dedykowany hardware |

### Zasady optymalizacji

**1. Odrejestruj listener w onPause()**

```kotlin
override fun onPause() {
    super.onPause()
    sensorManager.unregisterListener(this)  // Zawsze!
}
```

**2. Używaj najniższej skutecznej częstotliwości**

```kotlin
// Wykrycie orientacji ekranu — wystarczy 5 Hz
sensorManager.registerListener(this, accel, SensorManager.SENSOR_DELAY_NORMAL)

// Gra FPS — potrzeba 50+ Hz
sensorManager.registerListener(this, accel, SensorManager.SENSOR_DELAY_GAME)
```

**3. Preferuj koprocesor dla kroków i aktywności**

Zamiast rejestrować akcelerometr z wysoką częstotliwością i samodzielnie zliczać kroki, korzystaj z `TYPE_STEP_COUNTER` — dane są produkowane przez dedykowany koprocesor M (Android) lub M-series (Apple), który działa niezależnie od głównego CPU i zużywa mikroampery zamiast miliamperów.

**4. Batching — opóźnione dostarczanie zdarzeń**

Android pozwala skonfigurować maksymalne opóźnienie dostarczenia danych (`maxReportLatencyUs`). System buforuje zdarzenia i dostarcza je partiami, co pozwala procesorowi przejść w stan uśpienia między partiami:

```kotlin
sensorManager.registerListener(
    this,
    accelerometer,
    SensorManager.SENSOR_DELAY_NORMAL,
    500_000  // maxReportLatencyUs = 0.5 s → dane dostarczane co ~0.5 s partiami
)
```

**5. Geofencing zamiast ciągłego GPS**

```kotlin
// Zamiast ciągłego requestLocationUpdates — zdefiniuj geofence
val geofence = Geofence.Builder()
    .setRequestId("campus")
    .setCircularRegion(52.2297, 21.0122, 200f)  // Warszawa, promień 200m
    .setExpirationDuration(Geofence.NEVER_EXPIRE)
    .setTransitionTypes(Geofence.GEOFENCE_TRANSITION_ENTER or Geofence.GEOFENCE_TRANSITION_EXIT)
    .build()
```

**6. WorkManager dla pomiarów w tle**

Jeśli potrzebujesz zbierać dane w tle, użyj `WorkManager` z wymogiem baterii naładowanej:

```kotlin
val constraints = Constraints.Builder()
    .setRequiresBatteryNotLow(true)
    .build()

val work = PeriodicWorkRequestBuilder<SensorWorker>(15, TimeUnit.MINUTES)
    .setConstraints(constraints)
    .build()

WorkManager.getInstance(context).enqueue(work)
```

---

## Linki

- [Android Sensors Overview](https://developer.android.com/guide/topics/sensors/sensors_overview)
- [Android Motion Sensors](https://developer.android.com/guide/topics/sensors/sensors_motion)
- [Core Motion (iOS)](https://developer.apple.com/documentation/coremotion)
- [CMMotionManager (Apple Docs)](https://developer.apple.com/documentation/coremotion/cmmotionmanager)
- [CMPedometer (Apple Docs)](https://developer.apple.com/documentation/coremotion/cmpedometer)
- [Jetpack Compose — State and effects](https://developer.android.com/jetpack/compose/side-effects)
- [Android Battery Optimization](https://developer.android.com/training/monitoring-device-state/battery-monitoring)
