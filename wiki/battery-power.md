# Bateria i Zarządzanie Energią

Czas pracy na baterii to jeden z kluczowych czynników wpływających na oceny aplikacji. Użytkownicy szybko odinstalują aplikację, która rozładowuje telefon. Android i iOS mają rozbudowane mechanizmy ograniczania zużycia energii.

## Źródła zużycia energii

```
CPU processing      ████████████  30-40%   (intensywne obliczenia)
Display             ██████████    25-35%   (jasność, OLED vs LCD)
Wireless radios     ██████        15-20%   (Wi-Fi, LTE, Bluetooth)
GPS                 █████         10-15%   (ciągłe śledzenie)
Sensors             ██             5-10%   (akcelerometr, żyroskop)
```

## Doze Mode i App Standby (Android)

Android ogranicza aktywność aplikacji gdy urządzenie jest nieużywane:

```
Ekran OFF + nieruchomy + odłączony od ładowarki
    ↓ po kilku minutach
Doze (Lightweight)
    ↓ po dłuższym czasie
Doze (Deep)
    ↓ Zezwolenie tylko na High-Priority FCM push
```

Implikacje dla aplikacji:
- **AlarmManager** — `setExact()` nie odpala w Doze, użyj `setExactAndAllowWhileIdle()`
- **JobScheduler / WorkManager** — odpalane w "maintenance windows"
- **Network** — blokada połączeń sieciowych w Deep Doze

## WorkManager — background tasks

```kotlin
// Zaplanowane zadanie respektujące ograniczenia energii
class SyncWorker(context: Context, params: WorkerParameters) : CoroutineWorker(context, params) {
    override suspend fun doWork(): Result {
        return try {
            repository.syncWithServer()
            Result.success()
        } catch (e: Exception) {
            if (runAttemptCount < 3) Result.retry() else Result.failure()
        }
    }
}

// Zaplanowanie zadania z ograniczeniami
val constraints = Constraints.Builder()
    .setRequiredNetworkType(NetworkType.CONNECTED)
    .setRequiresBatteryNotLow(true)
    .setRequiresStorageNotLow(false)
    .build()

val syncRequest = PeriodicWorkRequestBuilder<SyncWorker>(
    repeatInterval = 6, repeatIntervalTimeUnit = TimeUnit.HOURS,
    flexTimeInterval = 1, flexTimeIntervalUnit = TimeUnit.HOURS
)
.setConstraints(constraints)
.setBackoffCriteria(BackoffPolicy.EXPONENTIAL, 30, TimeUnit.MINUTES)
.build()

WorkManager.getInstance(context).enqueueUniquePeriodicWork(
    "data_sync",
    ExistingPeriodicWorkPolicy.KEEP,
    syncRequest
)
```

## Optymalizacja GPS

```kotlin
// BŁĄD — ciągłe high-accuracy GPS
locationManager.requestLocationUpdates(
    LocationManager.GPS_PROVIDER,
    0L,       // co 0ms — rozładowuje baterię!
    0f,
    listener
)

// POPRAWNIE — dostosuj interwał do potrzeb
val request = LocationRequest.Builder(
    Priority.PRIORITY_BALANCED_POWER_ACCURACY,
    5_000L  // co 5 sekund
).apply {
    setMinUpdateIntervalMillis(2_000L)
    setMaxUpdateDelayMillis(30_000L)  // batch updates
    setWaitForAccurateLocation(false)
}.build()
```

| Tryb GPS | Dokładność | Zużycie | Zastosowanie |
|----------|-----------|---------|-------------|
| HIGH_ACCURACY | ±3m | Wysokie | Nawigacja turn-by-turn |
| BALANCED_POWER | ±100m | Średnie | Mapy, check-in |
| LOW_POWER | ±1km | Niskie | Pogoda, oferty lokalne |
| PASSIVE | Zależy | Minimalne | Logowanie w tle |

## BatterySaver API

```kotlin
val powerManager = getSystemService(POWER_SERVICE) as PowerManager

// Sprawdź czy Battery Saver jest aktywny
if (powerManager.isPowerSaveMode) {
    // Ogranicz aktywność: wyłącz animacje, zmniejsz częstotliwość sync
    reduceBackgroundWork()
    disableNonEssentialFeatures()
}

// Nasłuchuj zmian trybu oszczędzania
registerReceiver(object : BroadcastReceiver() {
    override fun onReceive(ctx: Context, intent: Intent) {
        if (powerManager.isPowerSaveMode) onPowerSaveEnabled() else onPowerSaveDisabled()
    }
}, IntentFilter(PowerManager.ACTION_POWER_SAVE_MODE_CHANGED))
```

## Network Batching

```kotlin
// Łącz żądania sieciowe zamiast wysyłać wiele małych
class BatchNetworkManager {
    private val pendingRequests = mutableListOf<NetworkRequest>()
    private var batchJob: Job? = null

    fun enqueue(request: NetworkRequest) {
        pendingRequests.add(request)
        batchJob?.cancel()
        batchJob = coroutineScope.launch {
            delay(500)  // Poczekaj 500ms na więcej żądań
            if (pendingRequests.isNotEmpty()) {
                executeBatch(pendingRequests.toList())
                pendingRequests.clear()
            }
        }
    }
}
```

## Linki

- [Battery Optimization](https://developer.android.com/training/monitoring-device-state/doze-standby)
- [WorkManager](https://developer.android.com/topic/libraries/architecture/workmanager)
- [Power Profiler](https://developer.android.com/studio/profile/energy-profiler)

## Foreground Service — trwałe zadania

```kotlin
// Foreground service — widoczna dla użytkownika (notyfikacja w pasku)
// Używaj gdy: nagrywanie audio, śledzenie GPS, odtwarzanie muzyki

class LocationTrackingService : Service() {

    private val notificationId = 1001
    private lateinit var locationManager: LocationManager

    override fun onStartCommand(intent: Intent?, flags: Int, startId: Int): Int {
        val notification = buildForegroundNotification()
        startForeground(notificationId, notification)

        startLocationUpdates()
        return START_STICKY  // system restartuje usługę jeśli ją zabije
    }

    private fun buildForegroundNotification(): Notification {
        val stopIntent = PendingIntent.getService(
            this, 0,
            Intent(this, LocationTrackingService::class.java).apply { action = "STOP" },
            PendingIntent.FLAG_IMMUTABLE
        )

        return NotificationCompat.Builder(this, LOCATION_CHANNEL_ID)
            .setContentTitle("Śledzenie trasy")
            .setContentText("Trasa jest rejestrowana...")
            .setSmallIcon(R.drawable.ic_location)
            .setOngoing(true)
            .addAction(R.drawable.ic_stop, "Zatrzymaj", stopIntent)
            .build()
    }

    override fun onBind(intent: Intent?) = null
}

// AndroidManifest.xml — wymagane uprawnienia i deklaracja
// <uses-permission android:name="android.permission.FOREGROUND_SERVICE" />
// <uses-permission android:name="android.permission.FOREGROUND_SERVICE_LOCATION" />
// <service android:name=".LocationTrackingService"
//          android:foregroundServiceType="location" />
```

## AlarmManager — precyzyjne planowanie

```kotlin
class AlarmScheduler(private val context: Context) {
    private val alarmManager = context.getSystemService(ALARM_SERVICE) as AlarmManager

    fun scheduleReminder(taskId: Int, triggerAtMs: Long) {
        val intent = Intent(context, ReminderBroadcastReceiver::class.java).apply {
            putExtra("task_id", taskId)
        }
        val pendingIntent = PendingIntent.getBroadcast(
            context, taskId, intent, PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
        )

        // Android 12+ wymaga uprawnienia SCHEDULE_EXACT_ALARM
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S && alarmManager.canScheduleExactAlarms()) {
            alarmManager.setExactAndAllowWhileIdle(AlarmManager.RTC_WAKEUP, triggerAtMs, pendingIntent)
        } else {
            // Niedokładne — system może opóźnić do okna maintenance
            alarmManager.setAndAllowWhileIdle(AlarmManager.RTC_WAKEUP, triggerAtMs, pendingIntent)
        }
    }

    fun cancelReminder(taskId: Int) {
        val intent = Intent(context, ReminderBroadcastReceiver::class.java)
        val pendingIntent = PendingIntent.getBroadcast(
            context, taskId, intent, PendingIntent.FLAG_NO_CREATE or PendingIntent.FLAG_IMMUTABLE
        )
        pendingIntent?.let { alarmManager.cancel(it) }
    }
}
```

## Energy Profiler — Android Studio

```
Android Studio → View → Tool Windows → App Inspection → Energy Profiler

Metryki:
  CPU    ████░░  Wysokie przetwarzanie
  NETWORK ██░░░  Nieaktywne pobieranie
  LOCATION █████ Ciągłe GPS — UWAGA!
  
Kolory:
  Zielony  = lekkie (Light)
  Żółty    = średnie (Medium)
  Czerwony = intensywne (Heavy)

Szukaj:
  - Przebudzenia (wake locks) trwające > 1s w tle
  - GPS aktywne gdy app w tle
  - Częste żądania sieciowe zamiast batchowania
```

```bash
# Battery historian — szczegółowa analiza z ADB
adb bugreport bugreport.zip
# Wgraj na: https://bathist.ef.lc/
# Pokazuje: wake locks, alarmy, sync, GPS, sieć w osi czasu
```

## Linki dodatkowe

- [Foreground Services](https://developer.android.com/guide/components/foreground-services)
- [AlarmManager](https://developer.android.com/training/scheduling/alarms)
- [Battery Historian](https://github.com/google/battery-historian)
