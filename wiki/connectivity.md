# Łączność Bezprzewodowa — LTE, 5G, Wi-Fi 6

Łączność bezprzewodowa to jeden z największych konsumentów energii w urządzeniu mobilnym, a jednocześnie kluczowy czynnik wpływający na wydajność aplikacji sieciowych.

## Technologie celularne

| Generacja | Max prędkość | Latencja | Pasmo |
|-----------|-------------|---------|-------|
| **3G HSPA+** | 42 Mbps | ~100ms | 850/2100 MHz |
| **LTE (4G)** | 150–600 Mbps | ~30ms | 700–2600 MHz |
| **LTE-A** | 1 Gbps | ~15ms | Carrier aggregation |
| **5G Sub-6** | 1–4 Gbps | ~10ms | 600 MHz–6 GHz |
| **5G mmWave** | 10–20 Gbps | <5ms | 24–100 GHz |

**5G mmWave** — ekstremalnie szybkie, ale zasięg tylko kilkaset metrów, blokowany przez ściany. Praktycznie tylko w gęstych centrach miast.

## Wi-Fi generacje

| Standard | Max prędkość | Pasmo | Nowe funkcje |
|---------|-------------|-------|-------------|
| Wi-Fi 5 (802.11ac) | 3.5 Gbps | 5 GHz | MU-MIMO |
| **Wi-Fi 6 (802.11ax)** | 9.6 Gbps | 2.4+5 GHz | OFDMA, BSS Coloring, TWT |
| **Wi-Fi 6E** | 9.6 Gbps | 2.4+5+6 GHz | Nowe pasmo 6 GHz |
| Wi-Fi 7 (802.11be) | 46 Gbps | Multi-Link | MLO, 320 MHz kanały |

**Target Wake Time (TWT)** w Wi-Fi 6 pozwala urządzeniu umawiać się z routerem na konkretne okna komunikacji, oszczędzając baterię nawet o 67%.

## Sprawdzanie połączenia sieciowego

```kotlin
class NetworkMonitor(private val context: Context) {

    private val connectivityManager =
        context.getSystemService(Context.CONNECTIVITY_SERVICE) as ConnectivityManager

    val networkState: Flow<NetworkState> = callbackFlow {
        val callback = object : ConnectivityManager.NetworkCallback() {
            override fun onAvailable(network: Network) {
                val caps = connectivityManager.getNetworkCapabilities(network)
                trySend(
                    NetworkState.Connected(
                        isWifi = caps?.hasTransport(NetworkCapabilities.TRANSPORT_WIFI) == true,
                        isCellular = caps?.hasTransport(NetworkCapabilities.TRANSPORT_CELLULAR) == true,
                        isMeteringed = connectivityManager.isActiveNetworkMetered,
                        downstreamBandwidthKbps = caps?.linkDownstreamBandwidthKbps ?: 0
                    )
                )
            }
            override fun onLost(network: Network) = trySend(NetworkState.Disconnected).let {}
        }

        val request = NetworkRequest.Builder()
            .addCapability(NetworkCapabilities.NET_CAPABILITY_INTERNET)
            .build()

        connectivityManager.registerNetworkCallback(request, callback)
        awaitClose { connectivityManager.unregisterNetworkCallback(callback) }
    }
}

sealed class NetworkState {
    object Disconnected : NetworkState()
    data class Connected(
        val isWifi: Boolean,
        val isCellular: Boolean,
        val isMeteringed: Boolean,
        val downstreamBandwidthKbps: Int
    ) : NetworkState()
}
```

## Adaptacja do warunków sieci

```kotlin
// Dostosuj jakość do przepustowości
fun getImageQuality(bandwidthKbps: Int): ImageQuality = when {
    bandwidthKbps > 5000  -> ImageQuality.HIGH
    bandwidthKbps > 1000  -> ImageQuality.MEDIUM
    bandwidthKbps > 200   -> ImageQuality.LOW
    else                   -> ImageQuality.THUMBNAIL
}

// Ograniczenia przy sieci komórkowej
val networkState by viewModel.networkState.collectAsState()
if (networkState is NetworkState.Connected) {
    val connected = networkState as NetworkState.Connected
    if (connected.isMeteringed) {
        // Nie pobieraj dużych plików bez zgody użytkownika
        showDataUsageWarning()
    }
}
```

## Bluetooth i BLE

```kotlin
// Bluetooth Low Energy — skanowanie urządzeń
val bluetoothManager = getSystemService(BLUETOOTH_SERVICE) as BluetoothManager
val bluetoothAdapter = bluetoothManager.adapter
val bleScanner = bluetoothAdapter.bluetoothLeScanner

val scanSettings = ScanSettings.Builder()
    .setScanMode(ScanSettings.SCAN_MODE_LOW_LATENCY)
    .setReportDelay(0)
    .build()

val scanFilters = listOf(
    ScanFilter.Builder()
        .setServiceUuid(ParcelUuid.fromString("0000180D-0000-1000-8000-00805f9b34fb"))  // Heart Rate
        .build()
)

bleScanner.startScan(scanFilters, scanSettings, object : ScanCallback() {
    override fun onScanResult(callbackType: Int, result: ScanResult) {
        val device = result.device
        val rssi = result.rssi
        val advertisingData = result.scanRecord
        Log.d("BLE", "Found: ${device.name} @ $rssi dBm")
    }
})
```

## Linki

- [Network Connectivity](https://developer.android.com/training/monitoring-device-state/connectivity-status-type)
- [BLE Overview](https://developer.android.com/guide/topics/connectivity/bluetooth/ble-overview)
- [Wi-Fi Aware](https://developer.android.com/guide/topics/connectivity/wifi-aware)

## NFC — Near Field Communication

```kotlin
// Uprawnienia w AndroidManifest.xml
// <uses-permission android:name="android.permission.NFC" />
// <uses-feature android:name="android.hardware.nfc" android:required="true" />

class NfcActivity : AppCompatActivity() {
    private lateinit var nfcAdapter: NfcAdapter
    private lateinit var pendingIntent: PendingIntent

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        nfcAdapter = NfcAdapter.getDefaultAdapter(this)

        pendingIntent = PendingIntent.getActivity(
            this, 0,
            Intent(this, javaClass).addFlags(Intent.FLAG_ACTIVITY_SINGLE_TOP),
            PendingIntent.FLAG_MUTABLE
        )
    }

    override fun onResume() {
        super.onResume()
        // Przechwytuj tagi NFC gdy Activity jest aktywne
        nfcAdapter.enableForegroundDispatch(this, pendingIntent, null, null)
    }

    override fun onPause() {
        super.onPause()
        nfcAdapter.disableForegroundDispatch(this)
    }

    override fun onNewIntent(intent: Intent) {
        super.onNewIntent(intent)
        if (intent.action == NfcAdapter.ACTION_NDEF_DISCOVERED ||
            intent.action == NfcAdapter.ACTION_TAG_DISCOVERED) {
            val tag = intent.getParcelableExtra<Tag>(NfcAdapter.EXTRA_TAG)
            processNfcTag(tag)
        }
    }

    private fun processNfcTag(tag: Tag?) {
        tag ?: return
        val ndef = Ndef.get(tag) ?: return
        ndef.connect()
        val message = ndef.ndefMessage
        val record = message.records.firstOrNull()
        val payload = record?.payload?.drop(3)?.toByteArray()  // pomija język (np. "en")
        val text = payload?.let { String(it, Charsets.UTF_8) }
        ndef.close()
        runOnUiThread { showNfcContent(text) }
    }
}
```

## USB OTG i Serial Communication

```kotlin
// Komunikacja z urządzeniami USB (mikrokontrolery, czujniki przemysłowe)
class UsbSerialManager(private val context: Context) {
    private val usbManager = context.getSystemService(Context.USB_SERVICE) as UsbManager

    fun listDevices(): List<UsbDevice> = usbManager.deviceList.values.toList()

    fun openDevice(device: UsbDevice): UsbDeviceConnection? {
        if (!usbManager.hasPermission(device)) {
            requestPermission(device)
            return null
        }
        return usbManager.openDevice(device)
    }

    private fun requestPermission(device: UsbDevice) {
        val permissionIntent = PendingIntent.getBroadcast(
            context, 0,
            Intent("com.example.USB_PERMISSION"),
            PendingIntent.FLAG_MUTABLE
        )
        usbManager.requestPermission(device, permissionIntent)
    }
}
```

## Wi-Fi Direct (P2P)

Wi-Fi Direct umożliwia bezpośrednią komunikację między urządzeniami bez punktu dostępowego (AP):

```kotlin
// WifiP2pManager — odkrywanie urządzeń i tworzenie grupy
class WifiDirectManager(private val context: Context) {
    private val manager = context.getSystemService(Context.WIFI_P2P_SERVICE) as WifiP2pManager
    private val channel = manager.initialize(context, Looper.getMainLooper(), null)

    fun discoverPeers(onSuccess: () -> Unit, onFailure: (Int) -> Unit) {
        manager.discoverPeers(channel, object : WifiP2pManager.ActionListener {
            override fun onSuccess() = onSuccess()
            override fun onFailure(reason: Int) = onFailure(reason)
        })
    }

    fun connectTo(device: WifiP2pDevice, onSuccess: () -> Unit) {
        val config = WifiP2pConfig().apply {
            deviceAddress = device.deviceAddress
            wps.setup = WpsInfo.PBC
        }
        manager.connect(channel, config, object : WifiP2pManager.ActionListener {
            override fun onSuccess() = onSuccess()
            override fun onFailure(reason: Int) {}
        })
    }
}
```

## Obsługa trybu offline

```kotlin
// Repository pattern z cache i siecią
class ArticleRepository(
    private val api: ArticleApi,
    private val dao: ArticleDao,
    private val networkMonitor: NetworkMonitor
) {
    fun getArticles(): Flow<List<Article>> = flow {
        // Natychmiast emituj dane z cache
        val cached = dao.getAllArticles()
        if (cached.isNotEmpty()) emit(cached)

        // Synchronizuj z siecią jeśli dostępna
        val state = networkMonitor.networkState.first()
        if (state is NetworkState.Connected) {
            try {
                val fresh = api.fetchArticles()
                dao.insertAll(fresh)
                emit(fresh)
            } catch (e: Exception) {
                // Sieć niedostępna — zostają dane z cache
                if (cached.isEmpty()) throw e
            }
        }
    }
}
```

## Linki dodatkowe

- [NFC](https://developer.android.com/guide/topics/connectivity/nfc)
- [Wi-Fi Direct](https://developer.android.com/guide/topics/connectivity/wifip2p)
- [USB Host](https://developer.android.com/guide/topics/connectivity/usb/host)
