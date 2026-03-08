# Programowanie Aplikacji Mobilnych IoT

Internet of Things (IoT) to ekosystem fizycznych urządzeń wymieniających dane przez sieć. Smartfon jest idealnym centrum sterowania IoT — posiada Bluetooth, Wi-Fi, NFC, ekran i obliczeniową moc do koordynowania dziesiątek urządzeń.

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

- **GATT** (Generic Attribute Profile) — protokół wymiany danych
- **Service** — grupuje powiązane charakterystyki (np. Heart Rate Service)
- **Characteristic** — pojedyncza wartość (np. aktualna tętno)
- **UUID** — unikalny identyfikator service/characteristic

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

## MQTT — protokół komunikacji IoT

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

## Wi-Fi Direct — komunikacja peer-to-peer

Wi-Fi Direct pozwala na bezpośrednią komunikację między urządzeniami bez routera — użyteczne np. do połączenia z kamerą IP czy drukarką.

```kotlin
val manager = getSystemService(Context.WIFI_P2P_SERVICE) as WifiP2pManager
val channel = manager.initialize(this, mainLooper, null)

// Odkryj urządzenia
manager.discoverPeers(channel, object : WifiP2pManager.ActionListener {
    override fun onSuccess() { /* odkrywanie uruchomione */ }
    override fun onFailure(reason: Int) { /* błąd */ }
})
```

## NFC — komunikacja krótkiego zasięgu

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

## Linki

- [Android BLE Guide](https://developer.android.com/guide/topics/connectivity/bluetooth/ble-overview)
- [Eclipse Paho MQTT Android](https://github.com/eclipse/paho.mqtt.android)
- [Android Wi-Fi P2P](https://developer.android.com/guide/topics/connectivity/wifip2p)
- [AWS IoT Core](https://aws.amazon.com/iot-core/)
