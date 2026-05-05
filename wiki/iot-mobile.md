# Programowanie aplikacji mobilnych IoT

Internet of Things (IoT) to ekosystem fizycznych urządzeń wymieniających dane przez sieć. Smartfon jest idealnym centrum sterowania IoT - posiada Bluetooth, Wi-Fi, NFC, ekran i obliczeniową moc do koordynowania dziesiątek urządzeń.

## Architektury IoT z mobilnym centrum

```
┌─────────────────────────────────────────────────┐
│                  Chmura IoT                      │
│     (AWS IoT Core / Google Cloud IoT / Azure)   │
└──────────────────┬──────────────────────────────┘
                   │ MQTT / HTTP
          ┌────────▼────────┐
          │   Smartfon      │  ← centrum sterowania
          │  (aplikacja)    │
          └──┬──────────┬───┘
     BLE/WiFi│          │BLE/Zigbee/Z-Wave
    ┌────────▼──┐   ┌───▼──────────┐
    │ Czujniki  │   │ Aktuatory    │
    │ temp/hum  │   │ smart bulb   │
    │ ciśnienie │   │ zamek        │
    └───────────┘   └──────────────┘
```

## Bluetooth Low Energy (BLE)

BLE to protokół komunikacji bezprzewodowej zoptymalizowany pod kątem małego zużycia energii. Idealny dla sensorów IoT zasilanych bateriami.

### Kluczowe koncepty BLE

- **GATT** (Generic Attribute Profile) - protokół wymiany danych
- **Service** - grupuje powiązane charakterystyki (np. Heart Rate Service)
- **Characteristic** - pojedyncza wartość (np. aktualna tętno)
- **UUID** - unikalny identyfikator service/characteristic

```kotlin
// Skanowanie urządzeń BLE (Android)
class BleScanner(private val context: Context) {
    private val bluetoothAdapter: BluetoothAdapter? =
        (context.getSystemService(Context.BLUETOOTH_SERVICE) as BluetoothManager).adapter
    
    private val scanner = bluetoothAdapter?.bluetoothLeScanner
    
    fun startScan(onDeviceFound: (BluetoothDevice, Int) -> Unit) {
        val callback = object : ScanCallback() {
            override fun onScanResult(callbackType: Int, result: ScanResult) {
                onDeviceFound(result.device, result.rssi)
            }
        }
        
        val filters = listOf(
            ScanFilter.Builder()
                .setServiceUuid(ParcelUuid.fromString("0000180D-0000-1000-8000-00805f9b34fb"))
                .build()
        )
        
        val settings = ScanSettings.Builder()
            .setScanMode(ScanSettings.SCAN_MODE_LOW_LATENCY)
            .build()
        
        scanner?.startScan(filters, settings, callback)
    }
}
```

### Odczyt charakterystyki BLE

```kotlin
class BleGattCallback(
    private val onDataReceived: (String, ByteArray) -> Unit
) : BluetoothGattCallback() {
    
    override fun onConnectionStateChange(gatt: BluetoothGatt, status: Int, newState: Int) {
        if (newState == BluetoothProfile.STATE_CONNECTED) {
            gatt.discoverServices()
        }
    }
    
    override fun onServicesDiscovered(gatt: BluetoothGatt, status: Int) {
        // Znajdź charakterystykę temperatury (przykładowy UUID)
        val tempServiceUuid = UUID.fromString("0000181A-0000-1000-8000-00805f9b34fb")
        val tempCharUuid = UUID.fromString("00002A6E-0000-1000-8000-00805f9b34fb")
        
        val characteristic = gatt.getService(tempServiceUuid)
            ?.getCharacteristic(tempCharUuid)
        
        characteristic?.let {
            // Włącz notyfikacje
            gatt.setCharacteristicNotification(it, true)
        }
    }
    
    override fun onCharacteristicChanged(
        gatt: BluetoothGatt, 
        characteristic: BluetoothGattCharacteristic,
        value: ByteArray
    ) {
        onDataReceived(characteristic.uuid.toString(), value)
    }
}
```

## MQTT - protokół komunikacji IoT

MQTT to lekki protokół publish/subscribe idealny dla IoT. Działający na TCP, minimalne zużycie przepustowości.

```kotlin
// Klient MQTT na Androida (biblioteka Eclipse Paho)
class MqttManager(private val brokerUrl: String) {
    private lateinit var client: MqttAndroidClient
    
    fun connect(clientId: String, onMessage: (String, String) -> Unit) {
        client = MqttAndroidClient(context, brokerUrl, clientId)
        
        client.setCallback(object : MqttCallbackExtended {
            override fun connectComplete(reconnect: Boolean, serverURI: String) {
                // Subskrybuj tematy po połączeniu
                client.subscribe("home/+/temperature", 1)
                client.subscribe("home/+/humidity", 1)
            }
            
            override fun messageArrived(topic: String, message: MqttMessage) {
                onMessage(topic, String(message.payload))
            }
            
            override fun connectionLost(cause: Throwable?) {}
            override fun deliveryComplete(token: IMqttDeliveryToken?) {}
        })
        
        val options = MqttConnectOptions().apply {
            isAutomaticReconnect = true
            isCleanSession = false
            userName = "user"
            password = "pass".toCharArray()
        }
        
        client.connect(options)
    }
    
    fun publish(topic: String, payload: String, qos: Int = 1) {
        client.publish(topic, MqttMessage(payload.toByteArray()).apply { 
            this.qos = qos 
        })
    }
}
```

### Tematy MQTT w architekturze smart home

```
home/living_room/temperature    → "23.5"
home/living_room/humidity       → "65"
home/bedroom/light/state        → "on" / "off"
home/bedroom/light/brightness   → "75"   (%)
home/door/lock/command          → "lock" / "unlock"
home/door/lock/state            → "locked" / "unlocked"
```

## Wi-Fi Direct - komunikacja peer-to-peer

Wi-Fi Direct pozwala na bezpośrednią komunikację między urządzeniami bez routera - użyteczne np. do połączenia z kamerą IP czy drukarką.

```kotlin
val manager = getSystemService(Context.WIFI_P2P_SERVICE) as WifiP2pManager
val channel = manager.initialize(this, mainLooper, null)

// Odkryj urządzenia
manager.discoverPeers(channel, object : WifiP2pManager.ActionListener {
    override fun onSuccess() { /* odkrywanie uruchomione */ }
    override fun onFailure(reason: Int) { /* błąd */ }
})
```

## NFC - komunikacja krótkiego zasięgu

NFC pozwala odczytywać tagi RFID, płacić zbliżeniowo i parować urządzenia.

```kotlin
class NfcActivity : AppCompatActivity() {
    private lateinit var nfcAdapter: NfcAdapter
    
    override fun onNewIntent(intent: Intent) {
        super.onNewIntent(intent)
        
        if (intent.action == NfcAdapter.ACTION_NDEF_DISCOVERED) {
            val rawMessages = intent.getParcelableArrayExtra(NfcAdapter.EXTRA_NDEF_MESSAGES)
            rawMessages?.forEach { parcelable ->
                val message = parcelable as NdefMessage
                message.records.forEach { record ->
                    val payload = String(record.payload)
                    Log.d("NFC", "Tag odczytany: $payload")
                }
            }
        }
    }
}
```

## Projekt: Aplikacja Dashboard IoT

```kotlin
data class SensorReading(
    val sensorId: String,
    val value: Float,
    val unit: String,
    val timestamp: Long = System.currentTimeMillis()
)

@Composable
fun IotDashboard(readings: List<SensorReading>) {
    LazyVerticalGrid(columns = GridCells.Fixed(2)) {
        items(readings) { reading ->
            SensorCard(reading = reading)
        }
    }
}

@Composable
fun SensorCard(reading: SensorReading) {
    Card(modifier = Modifier.padding(4.dp)) {
        Column(
            modifier = Modifier.padding(16.dp),
            horizontalAlignment = Alignment.CenterHorizontally
        ) {
            Text(
                text = "${reading.value} ${reading.unit}",
                style = MaterialTheme.typography.headlineMedium
            )
            Text(
                text = reading.sensorId,
                style = MaterialTheme.typography.labelMedium
            )
        }
    }
}
```

## Thread i Zigbee - sieci mesh dla smart home

Thread i Zigbee to protokoły sieciowe warstwy 2/3 przeznaczone do budowy sieci mesh o niskim zużyciu energii. W odróżnieniu od BLE, gdzie smartfon łączy się bezpośrednio z każdym urządzeniem, w sieci mesh urządzenia mogą przekazywać komunikaty do siebie nawzajem, tworząc samonaprawiającą się sieć o dużym zasięgu.

### Zigbee

Zigbee (standard IEEE 802.15.4) działa na częstotliwości 2,4 GHz i jest szeroko stosowany w urządzeniach smart home (żarówki Philips Hue, czujniki IKEA TRÅDFRI). Do komunikacji z siecią Zigbee z poziomu Androida potrzebny jest koordynator - dedykowany most (np. Philips Hue Bridge) lub klucz USB (np. ConBee II), do którego aplikacja łączy się przez HTTP/WebSocket.

```
Smartfon ←──── HTTP/REST ────→ Zigbee Gateway ←── Zigbee ──→ Czujniki/Aktuatory
               (lokalna sieć)    (Raspberry Pi             (żarówki, zamki,
                                  + ConBee II)              czujniki ruchu)
```

```kotlin
// Komunikacja z Philips Hue Bridge przez REST API
class HueBridgeClient(private val bridgeIp: String, private val apiKey: String) {
    private val client = OkHttpClient()
    private val baseUrl = "http://$bridgeIp/api/$apiKey"

    suspend fun getLights(): List<HueLight> = withContext(Dispatchers.IO) {
        val request = Request.Builder().url("$baseUrl/lights").build()
        val response = client.newCall(request).execute()
        val json = response.body?.string() ?: "{}"
        // parsowanie JSON odpowiedzi...
        parseHueLights(json)
    }

    suspend fun setLightState(lightId: String, on: Boolean, brightness: Int) {
        val body = """{"on":$on,"bri":$brightness}"""
            .toRequestBody("application/json".toMediaType())
        val request = Request.Builder()
            .url("$baseUrl/lights/$lightId/state")
            .put(body)
            .build()
        withContext(Dispatchers.IO) { client.newCall(request).execute() }
    }
}
```

### Thread i Matter

Thread (oparty na IPv6 i standardzie IEEE 802.15.4) to nowszy protokół mesh wspierany przez Google, Apple i Amazon. Protokół **Matter** (dawniej Project CHIP) działa na warstwie aplikacji i unifikuje różnych producentów - jedno urządzenie Matter może być obsługiwane przez Asystenta Google, Siri czy Amazon Alexa. Android 12+ posiada wbudowane wsparcie dla Thread Border Router przez Android Thread Network API.

```kotlin
// Dołączanie urządzenia Thread przez Android Thread Network API
class ThreadNetworkManager(private val context: Context) {

    fun addThreadDevice(onSuccess: () -> Unit, onFailure: (Exception) -> Unit) {
        val client = ThreadNetwork.getClient(context)
        client.preferredCredentials
            .addOnSuccessListener { credentials ->
                // Przekaż credentials do urządzenia przez BLE podczas komisjonowania
                commissionDeviceWithCredentials(credentials, onSuccess, onFailure)
            }
            .addOnFailureListener(onFailure)
    }

    private fun commissionDeviceWithCredentials(
        credentials: ThreadNetworkCredentials,
        onSuccess: () -> Unit,
        onFailure: (Exception) -> Unit
    ) {
        // Logika komisjonowania przez BLE - specyficzna dla producenta urządzenia
        val networkKey = credentials.networkKey
        val channel = credentials.channel
        // Wyślij przez BLE do urządzenia...
    }
}
```

### Porównanie protokołów

| Cecha | BLE | Zigbee | Thread/Matter | Wi-Fi |
|---|---|---|---|---|
| Zasięg | ~10 m | ~30 m | ~30 m | ~50 m |
| Topologia | punkt-punkt | mesh | mesh | gwiazda |
| Zużycie energii | bardzo niskie | niskie | niskie | wysokie |
| Przepustowość | 1–2 Mbit/s | 250 kbit/s | 250 kbit/s | 100+ Mbit/s |
| Gateway w Android | nie | tak | wbudowany (A12+) | nie |

---

## REST API vs MQTT - kiedy stosować każdy protokół

Wybór między REST a MQTT zależy od charakterystyki danych, wymagań czasowych i architektury systemu.

### REST API - żądanie/odpowiedź

REST sprawdza się, gdy aplikacja inicjuje komunikację i oczekuje pojedynczej odpowiedzi. Typowe przypadki użycia:

- **Konfiguracja urządzenia** - zmiana ustawień (np. czas wybudzenia sensora)
- **Jednorazowe odczyty** - pobranie bieżącego stanu na żądanie
- **Integracja z chmurą** - rejestracja urządzenia, autentykacja, pobieranie historii

```kotlin
// REST - pobranie aktualnego stanu urządzenia
suspend fun fetchDeviceStatus(deviceId: String): DeviceStatus {
    val response = httpClient.get("$baseUrl/devices/$deviceId/status")
    return response.body<DeviceStatus>()
}

// REST - wysłanie komendy do urządzenia
suspend fun sendCommand(deviceId: String, command: DeviceCommand): Result<Unit> {
    return runCatching {
        httpClient.post("$baseUrl/devices/$deviceId/commands") {
            contentType(ContentType.Application.Json)
            setBody(command)
        }
    }
}
```

### MQTT - publish/subscribe

MQTT jest lepszym wyborem gdy:

- Dane pojawiają się **ciągłym strumieniem** (co 1–5 sekund)
- Potrzebna jest **natychmiastowa reakcja** na zdarzenia (alarm, przekroczenie progu)
- Wiele aplikacji/urządzeń nasłuchuje tych samych danych (**fan-out**)
- Połączenie jest **niestabilne** (sieć komórkowa, IoT LPWAN)

```
Przypadek użycia         | Zalecany protokół
─────────────────────────────────────────────────
Bieżąca temperatura      | MQTT (subskrypcja, co 5 s)
Historia pomiarów        | REST GET
Włącz/wyłącz lampę       | MQTT publish lub REST POST
Rejestracja urządzenia   | REST POST
Alert przekroczenia prog.| MQTT (retain + QoS 2)
Pobierz konfigurację     | REST GET
```

### QoS w MQTT

MQTT definiuje trzy poziomy jakości usług:

| QoS | Znaczenie | Użycie |
|---|---|---|
| 0 | at most once - brak potwierdzenia | dane pogodowe, gdzie utrata jednego odczytu jest akceptowalna |
| 1 | at least once - potwierdzenie, możliwe duplikaty | pomiary wymagające pewności dostarczenia |
| 2 | exactly once - handshake 4-etapowy | komendy krytyczne (zamek, alarm) |

---

## Agregacja danych i lokalny cache

Sensory IoT mogą generować setki odczytów na minutę. Przechowywanie wszystkich danych lokalnie w bazie Room pozwala na:

- pracę **offline** bez dostępu do chmury,
- szybkie rysowanie **wykresów historycznych** bez opóźnień sieci,
- **buforowanie** danych przed wysłaniem w przypadku przerwy połączenia.

### Model danych i baza Room

```kotlin
@Entity(tableName = "sensor_readings")
data class SensorReadingEntity(
    @PrimaryKey(autoGenerate = true) val id: Long = 0,
    val sensorId: String,
    val value: Float,
    val unit: String,
    val timestamp: Long = System.currentTimeMillis(),
    val synced: Boolean = false   // czy wysłano do chmury
)

@Dao
interface SensorReadingDao {
    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insert(reading: SensorReadingEntity)

    @Query("""
        SELECT * FROM sensor_readings
        WHERE sensorId = :sensorId AND timestamp >= :since
        ORDER BY timestamp DESC
    """)
    fun getReadings(sensorId: String, since: Long): Flow<List<SensorReadingEntity>>

    @Query("SELECT * FROM sensor_readings WHERE synced = 0")
    suspend fun getUnsynced(): List<SensorReadingEntity>

    @Query("UPDATE sensor_readings SET synced = 1 WHERE id IN (:ids)")
    suspend fun markSynced(ids: List<Long>)

    @Query("""
        DELETE FROM sensor_readings
        WHERE timestamp < :before AND synced = 1
    """)
    suspend fun purgeOld(before: Long)
}

@Database(entities = [SensorReadingEntity::class], version = 1)
abstract class IotDatabase : RoomDatabase() {
    abstract fun sensorReadingDao(): SensorReadingDao

    companion object {
        @Volatile private var INSTANCE: IotDatabase? = null

        fun getInstance(context: Context): IotDatabase =
            INSTANCE ?: synchronized(this) {
                Room.databaseBuilder(context, IotDatabase::class.java, "iot.db")
                    .build()
                    .also { INSTANCE = it }
            }
    }
}
```

### Strategia synchronizacji - outbox pattern

```kotlin
class SensorRepository(
    private val dao: SensorReadingDao,
    private val mqttManager: MqttManager
) {
    // Zapisz lokalnie, oznacz jako niezsynchronizowane
    suspend fun saveReading(reading: SensorReadingEntity) {
        dao.insert(reading)
        trySyncPending()
    }

    // Wyślij do brokera wszystkie oczekujące odczyty
    private suspend fun trySyncPending() {
        val pending = dao.getUnsynced()
        if (pending.isEmpty()) return
        try {
            pending.forEach { entity ->
                val payload = """{"value":${entity.value},"unit":"${entity.unit}","ts":${entity.timestamp}}"""
                mqttManager.publish("sensors/${entity.sensorId}/data", payload, qos = 1)
            }
            dao.markSynced(pending.map { it.id })
        } catch (e: Exception) {
            // Brak połączenia - dane pozostają jako niezsynchonizowane
        }
    }

    // Usuń stare zsynchronizowane dane (> 7 dni)
    suspend fun purgeOldData() {
        val weekAgo = System.currentTimeMillis() - 7 * 24 * 60 * 60 * 1000L
        dao.purgeOld(weekAgo)
    }
}
```

### Agregacja na poziomie bazy - statystyki godzinowe

```kotlin
@Query("""
    SELECT
        sensorId,
        (timestamp / 3600000) * 3600000 AS hourBucket,
        AVG(value)  AS avgValue,
        MIN(value)  AS minValue,
        MAX(value)  AS maxValue,
        COUNT(*)    AS count
    FROM sensor_readings
    WHERE sensorId = :sensorId AND timestamp >= :since
    GROUP BY sensorId, hourBucket
    ORDER BY hourBucket ASC
""")
fun getHourlyStats(sensorId: String, since: Long): Flow<List<HourlyStatEntity>>
```

---

## Powiadomienia i alerty

Gdy czujnik przekroczy krytyczny próg (np. temperatura > 35°C, wykrycie dymu), aplikacja musi natychmiast powiadomić użytkownika - nawet gdy działa w tle.

### WorkManager - monitorowanie progów w tle

```kotlin
class ThresholdCheckWorker(
    context: Context,
    params: WorkerParameters
) : CoroutineWorker(context, params) {

    override suspend fun doWork(): Result {
        val dao = IotDatabase.getInstance(applicationContext).sensorReadingDao()
        val prefs = applicationContext.getSharedPreferences("thresholds", Context.MODE_PRIVATE)

        // Pobierz ostatnie odczyty temperatury
        val latestTemp = dao.getReadings("temp_sensor_1", since = System.currentTimeMillis() - 60_000)
            .first()
            .firstOrNull() ?: return Result.success()

        val maxTemp = prefs.getFloat("threshold_temp", 30f)
        if (latestTemp.value > maxTemp) {
            sendAlert(
                title = "Wysoka temperatura!",
                message = "Temperatura: ${latestTemp.value}°C (próg: $maxTemp°C)"
            )
        }
        return Result.success()
    }

    private fun sendAlert(title: String, message: String) {
        val notification = NotificationCompat.Builder(applicationContext, CHANNEL_ALERTS)
            .setSmallIcon(R.drawable.ic_warning)
            .setContentTitle(title)
            .setContentText(message)
            .setPriority(NotificationCompat.PRIORITY_HIGH)
            .setCategory(NotificationCompat.CATEGORY_ALARM)
            .setAutoCancel(true)
            .build()

        NotificationManagerCompat.from(applicationContext)
            .notify(NOTIFICATION_ID_ALERT, notification)
    }

    companion object {
        const val CHANNEL_ALERTS = "iot_alerts"
        const val NOTIFICATION_ID_ALERT = 1001

        // Uruchom cykliczne sprawdzanie co 15 minut
        fun schedule(context: Context) {
            val request = PeriodicWorkRequestBuilder<ThresholdCheckWorker>(15, TimeUnit.MINUTES)
                .setConstraints(Constraints.Builder()
                    .setRequiredNetworkType(NetworkType.CONNECTED)
                    .build())
                .build()
            WorkManager.getInstance(context).enqueueUniquePeriodicWork(
                "threshold_check",
                ExistingPeriodicWorkPolicy.KEEP,
                request
            )
        }
    }
}
```

### Tworzenie kanału powiadomień

```kotlin
fun createNotificationChannels(context: Context) {
    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
        val alertsChannel = NotificationChannel(
            ThresholdCheckWorker.CHANNEL_ALERTS,
            "Alerty IoT",
            NotificationManager.IMPORTANCE_HIGH
        ).apply {
            description = "Powiadomienia o przekroczeniu progów czujników"
            enableLights(true)
            lightColor = Color.RED
            enableVibration(true)
        }

        val infoChannel = NotificationChannel(
            "iot_info",
            "Informacje IoT",
            NotificationManager.IMPORTANCE_LOW
        ).apply {
            description = "Informacje o stanie połączenia z urządzeniami"
        }

        val manager = context.getSystemService(NotificationManager::class.java)
        manager.createNotificationChannels(listOf(alertsChannel, infoChannel))
    }
}
```

### Push notifications przez FCM

Dla alertów generowanych po stronie serwera (np. gdy broker MQTT wykryje anomalię) można użyć Firebase Cloud Messaging:

```kotlin
class IotFirebaseMessagingService : FirebaseMessagingService() {

    override fun onMessageReceived(message: RemoteMessage) {
        val data = message.data
        val alertType = data["alert_type"] ?: return
        val sensorId = data["sensor_id"] ?: "unknown"
        val value = data["value"] ?: "?"

        val (title, text) = when (alertType) {
            "high_temp"   -> "Wysoka temperatura!" to "Czujnik $sensorId: $value°C"
            "smoke"       -> "Wykryto dym!" to "Czujnik $sensorId aktywny"
            "door_open"   -> "Drzwi otwarte" to "Czujnik $sensorId: drzwi otwarte"
            else          -> "Alert IoT" to "Czujnik $sensorId: $value"
        }

        NotificationCompat.Builder(this, ThresholdCheckWorker.CHANNEL_ALERTS)
            .setSmallIcon(R.drawable.ic_warning)
            .setContentTitle(title)
            .setContentText(text)
            .setPriority(NotificationCompat.PRIORITY_HIGH)
            .setAutoCancel(true)
            .build()
            .also { NotificationManagerCompat.from(this).notify(sensorId.hashCode(), it) }
    }

    override fun onNewToken(token: String) {
        // Wyślij token do backendu, aby móc wysyłać powiadomienia do tego urządzenia
        sendTokenToServer(token)
    }
}
```

---

## Bezpieczeństwo połączeń IoT

Urządzenia IoT często przechowują dane wrażliwe (temperatura w domu, stan zamków, kamera). Niezabezpieczone połączenie może prowadzić do podsłuchu, przejęcia sterowania lub naruszenia prywatności.

### TLS dla MQTT (port 8883)

Domyślny MQTT działa na porcie 1883 bez szyfrowania. Zalecany jest MQTT over TLS na porcie 8883:

```kotlin
class SecureMqttManager(
    private val context: Context,
    private val brokerUrl: String   // ssl://broker.example.com:8883
) {
    fun buildSecureOptions(): MqttConnectOptions {
        val sslContext = SSLContext.getInstance("TLSv1.3")

        // Załaduj certyfikat CA brokera z assets
        val caInputStream = context.assets.open("mqtt_ca.crt")
        val caCert = CertificateFactory.getInstance("X.509")
            .generateCertificate(caInputStream) as X509Certificate

        val trustStore = KeyStore.getInstance(KeyStore.getDefaultType()).apply {
            load(null, null)
            setCertificateEntry("ca", caCert)
        }

        val trustManagerFactory = TrustManagerFactory
            .getInstance(TrustManagerFactory.getDefaultAlgorithm())
            .apply { init(trustStore) }

        sslContext.init(null, trustManagerFactory.trustManagers, SecureRandom())

        return MqttConnectOptions().apply {
            socketFactory = sslContext.socketFactory
            isAutomaticReconnect = true
            isCleanSession = false
            connectionTimeout = 30
            keepAliveInterval = 60
        }
    }
}
```

### Wzajemne TLS (mTLS) - autentykacja klienta

W mTLS zarówno serwer, jak i klient prezentują certyfikat. Broker akceptuje tylko połączenia od znanych urządzeń z prawidłowym certyfikatem:

```kotlin
fun buildMtlsOptions(context: Context): MqttConnectOptions {
    // Certyfikat klienta (urządzenia) i klucz prywatny
    val clientKeyStore = KeyStore.getInstance("PKCS12").apply {
        context.assets.open("client_device.p12").use { stream ->
            load(stream, "keystore_password".toCharArray())
        }
    }

    val keyManagerFactory = KeyManagerFactory
        .getInstance(KeyManagerFactory.getDefaultAlgorithm())
        .apply { init(clientKeyStore, "keystore_password".toCharArray()) }

    // Certyfikat CA do weryfikacji brokera
    val caCert = context.assets.open("ca.crt").use { stream ->
        CertificateFactory.getInstance("X.509").generateCertificate(stream)
    }
    val trustStore = KeyStore.getInstance(KeyStore.getDefaultType()).apply {
        load(null, null)
        setCertificateEntry("ca", caCert)
    }
    val trustManagerFactory = TrustManagerFactory
        .getInstance(TrustManagerFactory.getDefaultAlgorithm())
        .apply { init(trustStore) }

    val sslContext = SSLContext.getInstance("TLSv1.3").apply {
        init(keyManagerFactory.keyManagers, trustManagerFactory.trustManagers, SecureRandom())
    }

    return MqttConnectOptions().apply {
        socketFactory = sslContext.socketFactory
        isAutomaticReconnect = true
    }
}
```

### Przechowywanie kluczy - Android Keystore

Prywatne klucze urządzenia powinny być przechowywane w sprzętowym Android Keystore, a nie jako pliki w assets:

```kotlin
object DeviceKeyManager {
    private const val KEY_ALIAS = "iot_device_key"

    fun generateOrGetKeyPair(): KeyPair {
        val keyStore = KeyStore.getInstance("AndroidKeyStore").apply { load(null) }

        if (keyStore.containsAlias(KEY_ALIAS)) {
            val entry = keyStore.getEntry(KEY_ALIAS, null) as KeyStore.PrivateKeyEntry
            return KeyPair(entry.certificate.publicKey, entry.privateKey)
        }

        val spec = KeyPairGeneratorSpec.Builder(/* context */ TODO())
            .setAlias(KEY_ALIAS)
            .setSubject(X500Principal("CN=IoT Device"))
            .setSerialNumber(BigInteger.ONE)
            .setStartDate(Date())
            .setEndDate(Date(System.currentTimeMillis() + 365L * 24 * 60 * 60 * 1000))
            .build()

        return KeyPairGenerator.getInstance("RSA", "AndroidKeyStore").run {
            initialize(spec)
            generateKeyPair()
        }
    }

    // Użyj klucza z Keystore do podpisania żądania certyfikatu (CSR)
    // i prześlij CSR do serwera CA w celu uzyskania podpisanego certyfikatu
}
```

### Dobre praktyki bezpieczeństwa IoT

| Aspekt | Zalecenie |
|---|---|
| Transport | Zawsze TLS 1.2+ (port 8883 dla MQTT, HTTPS dla REST) |
| Autentykacja | mTLS lub tokeny JWT z krótkim TTL |
| Przechowywanie kluczy | Android Keystore (nie SharedPreferences, nie assets) |
| Uprawnienia MQTT | ACL - każde urządzenie subskrybuje tylko swoje tematy |
| Aktualizacje firmware | OTA z weryfikacją podpisu kryptograficznego |
| Dane wrażliwe | Szyfruj dane lokalne (SQLCipher dla Room) |
| Sieć | Izolacja urządzeń IoT w osobnym VLAN/sieci Wi-Fi |

---

## Linki

- [Android BLE Guide](https://developer.android.com/guide/topics/connectivity/bluetooth/ble-overview)
- [Eclipse Paho MQTT Android](https://github.com/eclipse/paho.mqtt.android)
- [Android Wi-Fi P2P](https://developer.android.com/guide/topics/connectivity/wifip2p)
- [AWS IoT Core](https://aws.amazon.com/iot-core/)
- [Android Thread Network API](https://developer.android.com/develop/connectivity/thread)
- [Matter protocol (CSA)](https://csa-iot.org/all-solutions/matter/)
- [HiveMQ MQTT Security](https://www.hivemq.com/mqtt-security-fundamentals/)
- [Android WorkManager](https://developer.android.com/topic/libraries/architecture/workmanager)
- [Firebase Cloud Messaging](https://firebase.google.com/docs/cloud-messaging)
