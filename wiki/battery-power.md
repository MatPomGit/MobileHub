# Bateria i zarządzanie energią

Czas pracy urządzenia na baterii jest jednym z najważniejszych czynników wpływających na odbiór jakości aplikacji mobilnej. Nawet funkcjonalnie dobra aplikacja może zostać szybko odinstalowana, jeśli użytkownik zauważy, że telefon rozładowuje się wyraźnie szybciej po jej zainstalowaniu. W praktyce problem zużycia energii nie dotyczy wyłącznie aplikacji działających stale w tle. Wysokie zużycie baterii może wynikać także z nieefektywnego renderowania interfejsu, nadmiernej aktywności CPU, zbyt częstych operacji sieciowych, nieoptymalnego korzystania z lokalizacji oraz nieumiejętnego planowania pracy asynchronicznej.

Współczesne systemy operacyjne, przede wszystkim Android i iOS, posiadają rozbudowane mechanizmy kontroli energetycznej. Ograniczają one aktywność procesów działających w tle, wprowadzają priorytetyzację zadań, grupują operacje sieciowe i odkładają mniej istotne działania na później. Deweloper nie powinien walczyć z tymi mechanizmami, lecz projektować aplikację tak, aby działała zgodnie z ich założeniami. Dobrze zaprojektowana aplikacja wykonuje kosztowne operacje tylko wtedy, gdy jest to uzasadnione biznesowo lub funkcjonalnie.

## Źródła zużycia energii

Największe zużycie energii w urządzeniu mobilnym pochodzi zwykle z kilku głównych obszarów:

```text
CPU processing      ████████████  30-40%   (intensywne obliczenia)
Display             ██████████    25-35%   (jasność, OLED vs LCD)
Wireless radios     ██████        15-20%   (Wi-Fi, LTE, Bluetooth)
GPS                 █████         10-15%   (ciągłe śledzenie)
Sensors             ██             5-10%   (akcelerometr, żyroskop)
```

W praktyce oznacza to, że nie tylko GPS jest „winny” szybkiego rozładowania telefonu. Bardzo kosztowne mogą być także nieustanne aktualizacje UI, animacje wykonywane zbyt często, pętle obliczeniowe, dekodowanie multimediów czy częste przełączanie radia sieciowego. Każde wybudzenie urządzenia, każde uruchomienie transmisji danych i każde odświeżenie lokalizacji ma koszt energetyczny. Dlatego optymalizacja baterii polega zwykle nie na jednej poprawce, lecz na serii drobnych decyzji architektonicznych.

## Ogólne zasady projektowania energooszczędnych aplikacji

Najważniejsza reguła brzmi: wykonuj mniej, rzadziej i we właściwym momencie. Nie należy uruchamiać zadań cyklicznych „na wszelki wypadek”, jeśli można je uruchomić reaktywnie po zdarzeniu systemowym lub po akcji użytkownika. Warto także łączyć wiele małych operacji w jedną większą, ponieważ pojedyncze wybudzenie CPU lub radia jest często tańsze niż wiele krótkich aktywacji rozłożonych w czasie.

Dobrą praktyką jest też obniżanie jakości lub częstotliwości działania wtedy, gdy użytkownik nie patrzy na ekran, urządzenie przechodzi w tryb oszczędzania energii albo bateria jest bliska rozładowania. Przykładowo aplikacja fitness może używać wysokiej dokładności lokalizacji tylko podczas aktywnego treningu, a po jego zakończeniu przełączyć się na tryb pasywny lub rzadsze aktualizacje.

## Doze Mode i App Standby (Android)

Android wprowadza szereg mechanizmów ograniczających aktywność aplikacji, gdy urządzenie nie jest używane. Jednym z najważniejszych jest Doze Mode. System przechodzi do tego trybu, gdy ekran jest wyłączony, urządzenie jest nieruchome i nie jest podłączone do ładowania.

```text
Ekran OFF + nieruchomy + odłączony od ładowarki
    ↓ po kilku minutach
Doze (Lightweight)
    ↓ po dłuższym czasie
Doze (Deep)
    ↓ Zezwolenie tylko na High-Priority FCM push
```

W lekkim trybie Doze część aktywności jest ograniczana, ale system nadal dopuszcza pewne działania. W głębokim Doze aplikacje tracą dostęp do sieci, alarmy są odraczane, a zadania w tle wykonywane są wyłącznie w krótkich oknach utrzymaniowych, tzw. maintenance windows. Z perspektywy dewelopera oznacza to, że nie można zakładać, iż zadanie odpalone „za 10 minut” uruchomi się dokładnie w tym momencie, jeśli telefon pozostaje bezczynny.

Implikacje dla aplikacji:

* **AlarmManager** - `setExact()` nie odpala w Doze, użyj `setExactAndAllowWhileIdle()`
* **JobScheduler / WorkManager** - odpalane w "maintenance windows"
* **Network** - blokada połączeń sieciowych w Deep Doze

Ważne jest, aby architektura aplikacji była odporna na opóźnienia i ponowne próby. Synchronizacja, raportowanie, analityka i odświeżanie danych powinny być projektowane jako operacje tolerujące odroczenie.

## WorkManager - zalecany mechanizm zadań w tle

Na współczesnym Androidzie podstawowym mechanizmem do zadań asynchronicznych, które muszą zostać wykonane niezawodnie, jest `WorkManager`. Biblioteka ta integruje się z ograniczeniami systemu i dobiera odpowiedni mechanizm wykonania zależnie od wersji Androida oraz stanu urządzenia. Dzięki temu zadanie nie musi być ręcznie zarządzane przez `Service`, `AlarmManager` i odbiorniki systemowe.

```kotlin
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
```

Takie podejście jest poprawne, ponieważ:

* integruje się z harmonogramem systemowym,
* obsługuje automatyczne ponowienie po błędach,
* pozwala narzucić ograniczenia, np. dostępność sieci,
* zapobiega uruchamianiu kosztownej pracy w złym momencie.

Kluczowym elementem planowania zadań w tle jest zdefiniowanie warunków, które muszą być spełnione przed uruchomieniem pracy. Poniższy kod przedstawia tworzenie zestawu ograniczeń dla `WorkManager`, takich jak wymaganie połączenia sieciowego i minimalnego poziomu baterii. Dzięki tym ograniczeniom system może odłożyć wykonanie zadania na odpowiedniejszy moment.

```kotlin
val constraints = Constraints.Builder()
    .setRequiredNetworkType(NetworkType.CONNECTED)
    .setRequiresBatteryNotLow(true)
    .setRequiresStorageNotLow(false)
    .build()
```

Ograniczenia są kluczowe. Jeśli synchronizacja wymaga Internetu, nie ma sensu budzić aplikacji bez połączenia. Jeśli zadanie nie jest krytyczne, warto dodać warunek `setRequiresBatteryNotLow(true)`, aby nie obciążać urządzenia przy niskim poziomie energii.

```kotlin
val syncRequest = PeriodicWorkRequestBuilder<SyncWorker>(
    repeatInterval = 6, repeatIntervalTimeUnit = TimeUnit.HOURS,
    flexTimeInterval = 1, flexTimeIntervalUnit = TimeUnit.HOURS
)
.setConstraints(constraints)
.setBackoffCriteria(BackoffPolicy.EXPONENTIAL, 30, TimeUnit.MINUTES)
.build()
```

Istotne jest także używanie przedziału elastyczności (`flexTimeInterval`). Dzięki temu system może dopasować uruchomienie zadania do innych prac planowanych w tle i ograniczyć liczbę wybudzeń urządzenia. To klasyczny przykład współpracy z systemem zamiast wymuszania dokładnego momentu.

## Optymalizacja GPS i lokalizacji

Usługi lokalizacyjne należą do najbardziej energochłonnych komponentów systemu, szczególnie gdy aplikacja stale używa GPS o wysokiej dokładności. Częstym błędem jest traktowanie lokalizacji jako strumienia danych, który powinien być odświeżany możliwie najczęściej, niezależnie od realnej potrzeby biznesowej.

```kotlin
locationManager.requestLocationUpdates(
    LocationManager.GPS_PROVIDER,
    0L,
    0f,
    listener
)
```

Takie ustawienie praktycznie wymusza ciągłą aktywność modułu GPS i może prowadzić do bardzo szybkiego rozładowania baterii. W większości scenariuszy jest to nieuzasadnione.

Lepszym podejściem jest dostosowanie dokładności i częstotliwości do celu aplikacji:

```kotlin
val request = LocationRequest.Builder(
    Priority.PRIORITY_BALANCED_POWER_ACCURACY,
    5_000L
).apply {
    setMinUpdateIntervalMillis(2_000L)
    setMaxUpdateDelayMillis(30_000L)
    setWaitForAccurateLocation(false)
}.build()
```

Warto przy tym pamiętać, że „najdokładniejsza lokalizacja” nie zawsze daje największą wartość użytkownikowi. Aplikacja pogodowa, lista promocji w pobliżu czy lokalne rekomendacje zwykle nie wymagają pozycji z dokładnością do kilku metrów.

| Tryb GPS       | Dokładność | Zużycie   | Zastosowanie           |
| -------------- | ---------- | --------- | ---------------------- |
| HIGH_ACCURACY  | ±3m        | Wysokie   | Nawigacja turn-by-turn |
| BALANCED_POWER | ±100m      | Średnie   | Mapy, check-in         |
| LOW_POWER      | ±1km       | Niskie    | Pogoda, oferty lokalne |
| PASSIVE        | Zależy     | Minimalne | Logowanie w tle        |

Dodatkowe zasady optymalizacji lokalizacji:

* pobieraj pozycję tylko wtedy, gdy funkcja jest aktywnie używana,
* zatrzymuj aktualizacje natychmiast po osiągnięciu celu,
* używaj batchingu, jeśli dopuszczalne są opóźnienia,
* unikaj lokalizacji w tle, o ile nie jest to główna funkcja aplikacji.

## Battery Saver API

Systemowy tryb oszczędzania energii to sygnał, że użytkownik chce ograniczyć zużycie zasobów. Aplikacja powinna na to reagować, redukując funkcje poboczne i odkładając mniej istotne działania.

```kotlin
val powerManager = getSystemService(POWER_SERVICE) as PowerManager

if (powerManager.isPowerSaveMode) {
    reduceBackgroundWork()
    disableNonEssentialFeatures()
}
```

Typowe reakcje aplikacji na aktywny Battery Saver:

* zmniejszenie częstotliwości synchronizacji,
* wyłączenie automatycznego odświeżania,
* ograniczenie animacji i efektów wizualnych,
* zmniejszenie precyzji lokalizacji,
* rezygnacja z prefetchingu danych i obrazów.

Aby aplikacja mogła dynamicznie reagować na włączenie lub wyłączenie trybu oszczędzania energii, należy nasłuchiwać na odpowiednie zdarzenie systemowe. Poniższy przykład rejestruje odbiornik rozgłoszeniowy, który monitoruje zmiany stanu Battery Saver. Takie podejście pozwala natychmiast dostosować zachowanie aplikacji do aktualnego stanu urządzenia.

```kotlin
registerReceiver(object : BroadcastReceiver() {
    override fun onReceive(ctx: Context, intent: Intent) {
        if (powerManager.isPowerSaveMode) onPowerSaveEnabled() else onPowerSaveDisabled()
    }
}, IntentFilter(PowerManager.ACTION_POWER_SAVE_MODE_CHANGED))
```

Obsługa tego trybu jest ważna nie tylko z punktu widzenia optymalizacji, ale również UX. Użytkownik powinien mieć poczucie, że aplikacja zachowuje się odpowiedzialnie i respektuje stan urządzenia.

## Network batching i komunikacja sieciowa

Transmisja danych zużywa energię nie tylko przez sam transfer, ale także przez aktywację radia komórkowego lub Wi-Fi. Wysyłanie wielu małych żądań w krótkich odstępach czasu jest zwykle mniej efektywne niż połączenie ich w jedną większą operację.

```kotlin
class BatchNetworkManager {
    private val pendingRequests = mutableListOf<NetworkRequest>()
    private var batchJob: Job? = null

    fun enqueue(request: NetworkRequest) {
        pendingRequests.add(request)
        batchJob?.cancel()
        batchJob = coroutineScope.launch {
            delay(500)
            if (pendingRequests.isNotEmpty()) {
                executeBatch(pendingRequests.toList())
                pendingRequests.clear()
            }
        }
    }
}
```

Batching ma kilka zalet:

* ogranicza liczbę wybudzeń radia,
* zmniejsza overhead połączeń HTTP,
* poprawia efektywność synchronizacji,
* może obniżać zużycie CPU i pamięci.

Do tego należy dodać lokalne cache, odpowiednie nagłówki HTTP, kompresję oraz unikanie agresywnego odpytywania serwera. W wielu przypadkach lepiej używać mechanizmów push niż cyklicznego pollingu.

## Foreground Service - tylko dla rzeczywiście trwałych zadań

Foreground Service to specjalny typ usługi, która pozostaje widoczna dla użytkownika poprzez trwałą notyfikację. Jest to mechanizm przewidziany dla działań faktycznie uzasadniających ciągłą pracę, takich jak:

* odtwarzanie muzyki,
* nawigacja,
* rejestrowanie trasy,
* nagrywanie audio lub wideo,
* aktywne połączenie telefoniczne lub VoIP.

Poniższy przykład ilustruje implementację usługi pierwszoplanowej przeznaczonej do ciągłego śledzenia trasy użytkownika. Serwis uruchamia stałą notyfikację informującą użytkownika o działaniu usługi, co jest wymagane przez system Android dla wszystkich usług pierwszoplanowych. Ważne jest, aby trwała notyfikacja zawierała opcję zatrzymania nagrywania, zapewniając użytkownikowi pełną kontrolę.

```kotlin
class LocationTrackingService : Service() {

    private val notificationId = 1001
    private lateinit var locationManager: LocationManager

    override fun onStartCommand(intent: Intent?, flags: Int, startId: Int): Int {
        val notification = buildForegroundNotification()
        startForeground(notificationId, notification)

        startLocationUpdates()
        return START_STICKY
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
```

Foreground Service nie powinien być używany jako sposób obejścia ograniczeń systemowych. Nadużywanie tego mechanizmu pogarsza UX, zwiększa zużycie energii i może prowadzić do problemów z polityką platformy.

## AlarmManager - kiedy potrzebna jest precyzja

`AlarmManager` służy do planowania zadań w określonym czasie, ale współcześnie powinien być używany ostrożnie. Większość okresowych lub odraczalnych zadań lepiej realizować przez `WorkManager`. `AlarmManager` ma sens głównie wtedy, gdy potrzebne jest zdarzenie o możliwie precyzyjnym czasie, np. przypomnienie dla użytkownika.

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

        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S && alarmManager.canScheduleExactAlarms()) {
            alarmManager.setExactAndAllowWhileIdle(AlarmManager.RTC_WAKEUP, triggerAtMs, pendingIntent)
        } else {
            alarmManager.setAndAllowWhileIdle(AlarmManager.RTC_WAKEUP, triggerAtMs, pendingIntent)
        }
    }
}
```

Na Androidzie 12+ dokładne alarmy są dodatkowo ograniczane i mogą wymagać odpowiednich uprawnień. To kolejny przykład tego, że system konsekwentnie redukuje możliwość wykonywania kosztownych zadań bez wyraźnej potrzeby.

## Interfejs użytkownika a zużycie energii

Choć temat baterii bywa kojarzony głównie z usługami w tle, bardzo duży wpływ ma również warstwa prezentacji. Nadmiernie rozbudowane animacje, częste recomposition w Jetpack Compose, zbyt częste odświeżanie list lub kosztowne operacje na bitmapach mogą powodować stałe użycie CPU i GPU.

W praktyce warto:

* ograniczać niepotrzebne animacje,
* unikać ciągłego odświeżania widoków,
* używać lazy loading dla list i obrazów,
* skalować i cache’ować grafiki,
* usuwać obserwatory i callbacki, gdy ekran nie jest aktywny.

W aplikacjach mobilnych optymalizacja energetyczna bardzo często pokrywa się z ogólną optymalizacją wydajności.

## Monitorowanie i profilowanie energii

Optymalizacji nie należy opierać wyłącznie na intuicji. Należy ją mierzyć. Android Studio udostępnia narzędzia pozwalające wykrywać komponenty odpowiedzialne za nadmierne zużycie zasobów.

```text
Android Studio → View → Tool Windows → App Inspection → Energy Profiler

Metryki:
  CPU     ████░░  Wysokie przetwarzanie
  NETWORK ██░░░  Nieaktywne pobieranie
  LOCATION █████ Ciągłe GPS - UWAGA!
```

Szczególnie warto obserwować:

* długie wake locki,
* aktywność GPS przy wygaszonym ekranie,
* częste żądania sieciowe,
* serię małych zadań w tle uruchamianych zbyt często,
* komponenty, które nie kończą pracy po opuszczeniu ekranu.

Do bardziej szczegółowej analizy można wykorzystać również Battery Historian:

```bash
adb bugreport bugreport.zip
# Wgraj na: https://bathist.ef.lc/
```

To narzędzie pozwala prześledzić w osi czasu aktywność CPU, alarmów, synchronizacji, radia, lokalizacji i wake locków, co bywa bardzo pomocne przy diagnozowaniu trudnych przypadków.

## Najczęstsze błędy projektowe

W aplikacjach mobilnych regularnie pojawiają się te same antywzorce:

* ciągły polling serwera zamiast push lub batchingu,
* pozostawienie GPS aktywnego po zamknięciu ekranu,
* uruchamianie zadań okresowych z nadmierną częstotliwością,
* używanie Foreground Service bez rzeczywistej potrzeby,
* brak reakcji na Battery Saver i niski poziom baterii,
* niekończące się retry bez strategii backoff,
* zbyt dokładne alarmy tam, gdzie wystarczyłoby zadanie odraczalne.

Każdy z tych błędów samodzielnie może zwiększyć zużycie energii, a w połączeniu prowadzi do szybkiego spadku jakości odbioru aplikacji.

## Wnioski

Efektywne zarządzanie energią w aplikacji mobilnej wymaga myślenia systemowego. Nie chodzi jedynie o „wyłączenie GPS” albo „rzadszą synchronizację”, lecz o świadome projektowanie całego cyklu życia aplikacji. Aplikacja powinna wykonywać pracę tylko wtedy, gdy jest to potrzebne, korzystać z mechanizmów platformy zgodnie z ich przeznaczeniem i elastycznie reagować na stan urządzenia.

Najlepsze praktyki można streścić w kilku zasadach:

* ograniczaj pracę w tle do minimum,
* używaj `WorkManager` dla zadań odraczalnych,
* lokalizację dobieraj do scenariusza, nie do maksimum możliwości,
* grupuj operacje sieciowe,
* respektuj Doze i Battery Saver,
* mierz rzeczywiste zużycie energii narzędziami profilującymi.

## Linki dodatkowe

- [Foreground Services](https://developer.android.com/guide/components/foreground-services)
- [AlarmManager](https://developer.android.com/training/scheduling/alarms)
- [Battery Historian](https://github.com/google/battery-historian)
