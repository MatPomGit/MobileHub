# Obsługa Sensorów Urządzenia Mobilnego

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

## Linki

- [Android Sensors Overview](https://developer.android.com/guide/topics/sensors/sensors_overview)
- [Android Motion Sensors](https://developer.android.com/guide/topics/sensors/sensors_motion)
- [Core Motion (iOS)](https://developer.apple.com/documentation/coremotion)
