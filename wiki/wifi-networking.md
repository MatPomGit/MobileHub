# Wi-Fi i sieć lokalna

Aplikacje IoT często komunikują się z urządzeniami w tej samej sieci lokalnej Wi-Fi, bez pośrednictwa chmury. Android i iOS udostępniają API do odkrywania urządzeń (mDNS/Bonjour), komunikacji TCP/UDP i tworzenia hotspotów.

## Network Service Discovery - mDNS/Bonjour

mDNS (Multicast DNS) pozwala urządzeniom odkrywać siebie nawzajem po nazwie w sieci lokalnej bez centralnego serwera DNS. Apple nazywa tę technologię Bonjour.

```kotlin
// Android - NsdManager: odkrywanie usług mDNS
class MdnsDiscovery(private val context: Context) {
    private val nsdManager = context.getSystemService(Context.NSD_SERVICE) as NsdManager
    private var discoveryListener: NsdManager.DiscoveryListener? = null

    fun startDiscovery(
        serviceType: String = "_http._tcp.",   // np. "_printer._tcp.", "_http._tcp."
        onFound: (NsdServiceInfo) -> Unit,
        onLost: (NsdServiceInfo) -> Unit = {}
    ) {
        discoveryListener = object : NsdManager.DiscoveryListener {
            override fun onServiceFound(serviceInfo: NsdServiceInfo) {
                // Rozwiąż nazwę na adres IP i port
                nsdManager.resolveService(
                    serviceInfo,
                    object : NsdManager.ResolveListener {
                        override fun onServiceResolved(resolved: NsdServiceInfo) {
                            Log.d("mDNS", "Found: ${resolved.serviceName} @ ${resolved.host}:${resolved.port}")
                            onFound(resolved)
                        }
                        override fun onResolveFailed(info: NsdServiceInfo, errorCode: Int) {
                            Log.w("mDNS", "Resolve failed: $errorCode")
                        }
                    }
                )
            }
            override fun onServiceLost(serviceInfo: NsdServiceInfo) = onLost(serviceInfo)
            override fun onDiscoveryStarted(serviceType: String) = Unit
            override fun onDiscoveryStopped(serviceType: String) = Unit
            override fun onStartDiscoveryFailed(serviceType: String, errorCode: Int) = Unit
            override fun onStopDiscoveryFailed(serviceType: String, errorCode: Int) = Unit
        }

        nsdManager.discoverServices(serviceType, NsdManager.PROTOCOL_DNS_SD, discoveryListener)
    }

    fun stopDiscovery() {
        discoveryListener?.let { nsdManager.stopServiceDiscovery(it) }
    }

    // Rejestracja własnej usługi w sieci
    fun registerService(name: String, type: String, port: Int) {
        val serviceInfo = NsdServiceInfo().apply {
            serviceName = name
            serviceType = type
            this.port = port
        }
        nsdManager.registerService(serviceInfo, NsdManager.PROTOCOL_DNS_SD,
            object : NsdManager.RegistrationListener {
                override fun onServiceRegistered(info: NsdServiceInfo) {
                    Log.d("mDNS", "Registered: ${info.serviceName}")
                }
                override fun onRegistrationFailed(info: NsdServiceInfo, e: Int) = Unit
                override fun onServiceUnregistered(info: NsdServiceInfo) = Unit
                override fun onUnregistrationFailed(info: NsdServiceInfo, e: Int) = Unit
            }
        )
    }
}
```

## Socket TCP - komunikacja z urządzeniem IoT

```kotlin
class TcpDeviceClient(private val host: String, private val port: Int) {
    private var socket: Socket? = null
    private var writer: PrintWriter? = null
    private var reader: BufferedReader? = null

    suspend fun connect(): Boolean = withContext(Dispatchers.IO) {
        try {
            socket = Socket().apply {
                soTimeout = 5000   // timeout odczytu
                connect(InetSocketAddress(host, port), 3000)  // timeout połączenia
            }
            writer = PrintWriter(BufferedWriter(OutputStreamWriter(socket!!.outputStream)), true)
            reader = BufferedReader(InputStreamReader(socket!!.inputStream))
            true
        } catch (e: Exception) {
            Log.e("TCP", "Connect failed: ${e.message}")
            false
        }
    }

    suspend fun sendCommand(command: String): String = withContext(Dispatchers.IO) {
        try {
            writer?.println(command)
            reader?.readLine() ?: throw IOException("Connection closed")
        } catch (e: Exception) {
            throw IOException("Command failed: ${e.message}")
        }
    }

    suspend fun sendJson(payload: Any): String = withContext(Dispatchers.IO) {
        val json = Gson().toJson(payload)
        sendCommand(json)
    }

    fun disconnect() {
        runCatching { writer?.close() }
        runCatching { reader?.close() }
        runCatching { socket?.close() }
        writer = null; reader = null; socket = null
    }

    val isConnected: Boolean get() = socket?.isConnected == true && socket?.isClosed == false
}

// Przykład - sterowanie lampą ESP8266 przez TCP
class SmartLampController(host: String) {
    private val client = TcpDeviceClient(host, 23)  // port Telnet

    suspend fun connect() = client.connect()
    suspend fun turnOn() = client.sendCommand("LED_ON")
    suspend fun turnOff() = client.sendCommand("LED_OFF")
    suspend fun setBrightness(value: Int) = client.sendCommand("BRIGHT:$value")
    suspend fun getStatus() = client.sendCommand("STATUS?")
}
```

## UDP - protokół dla telemetrii

UDP jest lżejszy niż TCP (bez nawiązywania połączenia), idealny dla danych telemetrycznych:

```kotlin
class UdpSender(private val host: String, private val port: Int) {
    private val socket = DatagramSocket()

    fun send(data: String) {
        val bytes = data.toByteArray()
        val packet = DatagramPacket(bytes, bytes.size, InetAddress.getByName(host), port)
        socket.send(packet)
    }

    fun close() = socket.close()
}

class UdpReceiver(private val port: Int) {
    private val socket = DatagramSocket(port)
    private val buffer = ByteArray(4096)

    fun receiveBlocking(): String {
        val packet = DatagramPacket(buffer, buffer.size)
        socket.receive(packet)  // blokuje do momentu odebrania
        return String(packet.data, 0, packet.length)
    }

    fun startListening(onReceive: (String, String) -> Unit) {
        Thread {
            while (!socket.isClosed) {
                try {
                    val packet = DatagramPacket(buffer, buffer.size)
                    socket.receive(packet)
                    val data = String(packet.data, 0, packet.length)
                    val senderIp = packet.address.hostAddress ?: "unknown"
                    onReceive(senderIp, data)
                } catch (e: Exception) {
                    if (!socket.isClosed) Log.e("UDP", "Receive error: ${e.message}")
                }
            }
        }.start()
    }

    fun close() = socket.close()
}
```

## HTTP REST API dla urządzeń IoT

Wiele urządzeń IoT udostępnia własne REST API dostępne w sieci lokalnej:

```kotlin
// Philips Hue Bridge - pełne API sterowania żarówkami
interface HueBridgeApi {
    @GET("api/{user}/lights")
    suspend fun getLights(@Path("user") username: String): Map<String, HueLight>

    @GET("api/{user}/lights/{id}")
    suspend fun getLight(@Path("user") username: String, @Path("id") id: String): HueLight

    @PUT("api/{user}/lights/{id}/state")
    suspend fun setLightState(
        @Path("user") username: String,
        @Path("id") id: String,
        @Body state: HueLightState
    ): List<Map<String, Any>>

    @GET("api/{user}/groups")
    suspend fun getGroups(@Path("user") username: String): Map<String, HueGroup>

    @POST("api")
    suspend fun createUser(@Body body: Map<String, String>): List<Map<String, Any>>
}

data class HueLightState(
    val on: Boolean? = null,
    val bri: Int? = null,           // jasność 1-254
    val hue: Int? = null,           // kolor 0-65535 (czerwony=0/65535, zielony=21845, niebieski=43690)
    val sat: Int? = null,           // nasycenie 0-254
    val ct: Int? = null,            // temperatura barwowa w mired 153-500
    val xy: List<Float>? = null,    // kolor w przestrzeni CIE xy
    @SerializedName("transitiontime") val transitionTime: Int? = null  // w 100ms, np. 4 = 400ms
)
```

## Wi-Fi Direct - komunikacja P2P

Wi-Fi Direct umożliwia połączenie dwóch urządzeń bez routera:

```kotlin
class WifiDirectManager(private val context: Context) {
    private val manager = context.getSystemService(Context.WIFI_P2P_SERVICE) as WifiP2pManager
    private val channel = manager.initialize(context, Looper.getMainLooper(), null)

    fun discoverPeers(onPeersFound: (List<WifiP2pDevice>) -> Unit) {
        manager.discoverPeers(channel, object : WifiP2pManager.ActionListener {
            override fun onSuccess() {
                context.registerReceiver(
                    object : BroadcastReceiver() {
                        override fun onReceive(ctx: Context, intent: Intent) {
                            val peers = intent.getParcelableExtra<WifiP2pDeviceList>(
                                WifiP2pManager.EXTRA_P2P_DEVICE_LIST
                            )
                            onPeersFound(peers?.deviceList?.toList() ?: emptyList())
                        }
                    },
                    IntentFilter(WifiP2pManager.WIFI_P2P_PEERS_CHANGED_ACTION)
                )
            }
            override fun onFailure(reason: Int) { Log.e("P2P", "Discovery failed: $reason") }
        })
    }

    fun connect(device: WifiP2pDevice) {
        val config = WifiP2pConfig().apply {
            deviceAddress = device.deviceAddress
            wps.setup = WpsInfo.PBC
        }
        manager.connect(channel, config, object : WifiP2pManager.ActionListener {
            override fun onSuccess() = Unit
            override fun onFailure(reason: Int) = Unit
        })
    }
}
```

## Linki

- [Android NSD (mDNS)](https://developer.android.com/training/connect-devices-wirelessly/nsd)
- [Wi-Fi Direct](https://developer.android.com/training/connect-devices-wirelessly/wifi-direct)
- [Philips Hue API v2](https://developers.meethue.com/develop/hue-api-v2/)
- [Shelly Devices API](https://shelly-api-docs.shelly.cloud/)

## WebSocket w sieci lokalnej

WebSocket to protokół dwukierunkowej komunikacji w czasie rzeczywistym działający nad TCP. W projektach IoT serwer WebSocket często działa bezpośrednio na mikrokontrolerze (ESP32) lub Raspberry Pi, a aplikacja Android łączy się z nim przez lokalną sieć Wi-Fi. Główna zaleta nad HTTP polling: serwer może samodzielnie _push_-ować dane (np. odczyty czujnika) bez cyklicznych zapytań klienta.

Na ESP32 popularną biblioteką jest `ArduinoWebsockets`. Po stronie Androida najwygodniejszą implementacją jest `OkHttp WebSocket` - ta sama biblioteka, z której korzysta Retrofit.

```kotlin
// build.gradle.kts - OkHttp jest najczęściej już zależnością pośrednią Retrofit
implementation("com.squareup.okhttp3:okhttp:4.12.0")

class LocalWebSocketClient(
    private val url: String,                           // np. "ws://192.168.1.42:81"
    private val onMessage: (String) -> Unit,
    private val onConnected: () -> Unit = {},
    private val onDisconnected: (Int, String) -> Unit = { _, _ -> }
) {
    private val client = OkHttpClient.Builder()
        .pingInterval(20, TimeUnit.SECONDS)            // keepalive
        .connectTimeout(5, TimeUnit.SECONDS)
        .build()

    private var webSocket: WebSocket? = null

    fun connect() {
        val request = Request.Builder().url(url).build()
        webSocket = client.newWebSocket(request, object : WebSocketListener() {
            override fun onOpen(ws: WebSocket, response: Response) {
                onConnected()
            }
            override fun onMessage(ws: WebSocket, text: String) {
                onMessage(text)
            }
            override fun onFailure(ws: WebSocket, t: Throwable, response: Response?) {
                onDisconnected(-1, t.message ?: "error")
            }
            override fun onClosed(ws: WebSocket, code: Int, reason: String) {
                onDisconnected(code, reason)
            }
        })
    }

    fun send(message: String) = webSocket?.send(message) ?: false
    fun sendJson(obj: Any) = send(Gson().toJson(obj))

    fun disconnect() {
        webSocket?.close(1000, "Client disconnecting")
        webSocket = null
    }
}

// ViewModel integrujący klienta z Compose UI
class SensorViewModel : ViewModel() {
    private val _readings = MutableStateFlow<List<SensorReading>>(emptyList())
    val readings: StateFlow<List<SensorReading>> = _readings

    private val _connected = MutableStateFlow(false)
    val connected: StateFlow<Boolean> = _connected

    private val wsClient = LocalWebSocketClient(
        url = "ws://192.168.1.42:81",
        onMessage = { json ->
            val reading = Gson().fromJson(json, SensorReading::class.java)
            _readings.update { it + reading }
        },
        onConnected = { _connected.value = true },
        onDisconnected = { _, _ -> _connected.value = false }
    )

    fun connect() = wsClient.connect()
    fun sendCommand(cmd: String) = wsClient.send(cmd)

    override fun onCleared() {
        wsClient.disconnect()
    }
}
```

Po stronie ESP32 wystarczy kilka linii w Arduino IDE, by wystawić serwer na porcie 81, który co sekundę wysyła JSON z odczytem temperatury. Aplikacja Android subskrybuje strumień i aktualizuje wykres w Compose bez żadnego pollingowania.

## Skaner sieci lokalnej

Odkrycie urządzeń IoT w sieci domowej jest pierwszym krokiem przed nawiązaniem połączenia. Kiedy mDNS nie jest dostępny (starsze firmware), można wykonać proste skanowanie - ping sweep zakresu adresów IP i sprawdzenie otwartych portów - korzystając z klasy `InetAddress` i `Socket` ze standardowej biblioteki Java.

Skanowanie musi odbywać się na wątku IO, a w Compose wyniki aktualizujemy przez `StateFlow`. Skan 254 adresów klasy C trwa ~10–30 sekund przy timeoucie 300 ms na hosta, dlatego warto prowadzić go współbieżnie.

```kotlin
data class NetworkDevice(val ip: String, val hostname: String?, val openPorts: List<Int>)

class NetworkScanner {
    // Ping sweep + sprawdzenie listy popularnych portów IoT
    private val iotPorts = listOf(80, 8080, 23, 81, 1883, 8883, 4444)

    suspend fun scanSubnet(subnet: String): List<NetworkDevice> =
        withContext(Dispatchers.IO) {
            (1..254).map { host ->
                async {
                    val ip = "$subnet.$host"
                    try {
                        val addr = InetAddress.getByName(ip)
                        if (addr.isReachable(300)) {
                            val hostname = addr.hostName.takeIf { it != ip }
                            val open = iotPorts.filter { port ->
                                try {
                                    Socket().use { s ->
                                        s.connect(InetSocketAddress(ip, port), 200)
                                        true
                                    }
                                } catch (_: Exception) { false }
                            }
                            NetworkDevice(ip, hostname, open)
                        } else null
                    } catch (_: Exception) { null }
                }
            }.awaitAll().filterNotNull()
        }

    // Wykryj własną podsieć (np. "192.168.1")
    fun getLocalSubnet(context: Context): String? {
        val wm = context.getSystemService(Context.WIFI_SERVICE) as WifiManager
        val ip = wm.connectionInfo.ipAddress
        if (ip == 0) return null
        return buildString {
            repeat(3) { i ->
                append((ip shr (8 * i)) and 0xFF)
                if (i < 2) append(".")
            }
        }
    }
}

// Ekran skanowania w Compose
@Composable
fun NetworkScanScreen(viewModel: NetworkScanViewModel) {
    val devices by viewModel.devices.collectAsState()
    val scanning by viewModel.scanning.collectAsState()

    Column(Modifier.fillMaxSize().padding(16.dp)) {
        Button(
            onClick = { viewModel.startScan() },
            enabled = !scanning,
            modifier = Modifier.fillMaxWidth()
        ) {
            if (scanning) {
                CircularProgressIndicator(Modifier.size(18.dp), strokeWidth = 2.dp)
                Spacer(Modifier.width(8.dp))
                Text("Skanowanie…")
            } else {
                Icon(Icons.Default.Search, null)
                Spacer(Modifier.width(8.dp))
                Text("Skanuj sieć lokalną")
            }
        }
        Spacer(Modifier.height(12.dp))
        LazyColumn(verticalArrangement = Arrangement.spacedBy(8.dp)) {
            items(devices, key = { it.ip }) { device ->
                ElevatedCard(Modifier.fillMaxWidth()) {
                    ListItem(
                        headlineContent = { Text(device.ip) },
                        supportingContent = {
                            Text("Porty: ${device.openPorts.joinToString(", ").ifEmpty { "brak" }}")
                        },
                        overlineContent = device.hostname?.let { { Text(it) } }
                    )
                }
            }
        }
    }
}
```

Skan wymaga uprawnień `CHANGE_NETWORK_STATE` i `ACCESS_WIFI_STATE` w manifeście oraz (od Androida 9) `ACCESS_FINE_LOCATION` do odczytu danych Wi-Fi.

## HTTPS dla lokalnych API

Lokalne urządzenia IoT coraz częściej wymagają HTTPS - szczególnie gdy przesyłamy dane uwierzytelniające lub wrażliwe pomiary. Problem polega na tym, że urządzenie ma certyfikat **self-signed** (podpisany samo-przez siebie), który domyślnie jest odrzucany przez Android.

Prawidłowe podejście - **nie** wyłączamy weryfikacji TLS globalnie, lecz dodajemy konkretny certyfikat urządzenia do niestandardowego `TrustManager`. Dla znanych urządzeń IoT możemy stosować **certificate pinning** (weryfikację odcisku palca certyfikatu).

```kotlin
// Wczytaj certyfikat PEM ze storage lub assets
fun loadCertificate(context: Context, assetName: String): X509Certificate {
    val certBytes = context.assets.open(assetName).readBytes()
    return CertificateFactory.getInstance("X.509")
        .generateCertificate(certBytes.inputStream()) as X509Certificate
}

// Zbuduj OkHttpClient akceptujący konkretny certyfikat self-signed
fun buildIotHttpClient(context: Context): OkHttpClient {
    val cert = loadCertificate(context, "iot_device.pem")

    val keyStore = KeyStore.getInstance(KeyStore.getDefaultType()).apply {
        load(null, null)
        setCertificateEntry("iot_cert", cert)
    }

    val tmf = TrustManagerFactory.getInstance(TrustManagerFactory.getDefaultAlgorithm()).apply {
        init(keyStore)
    }
    val trustManagers = tmf.trustManagers

    val sslContext = SSLContext.getInstance("TLS").apply {
        init(null, trustManagers, null)
    }

    return OkHttpClient.Builder()
        .sslSocketFactory(sslContext.socketFactory, trustManagers[0] as X509TrustManager)
        // Certificate pinning - dodatkowe zabezpieczenie dla znanych urządzeń
        .certificatePinner(
            CertificatePinner.Builder()
                .add(
                    "192.168.1.42",
                    "sha256/AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA="  // hash certyfikatu
                )
                .build()
        )
        .connectTimeout(5, TimeUnit.SECONDS)
        .build()
}

// Jak uzyskać hash certyfikatu? Przez OpenSSL:
// openssl s_client -connect 192.168.1.42:443 </dev/null 2>/dev/null \
//   | openssl x509 -pubkey -noout \
//   | openssl pkey -pubin -outform DER \
//   | openssl dgst -sha256 -binary | base64
```

Dla urządzeń z dynamicznym IP warto stosować mDNS zamiast twardego adresu IP w piningu - lub przechowywać hash certyfikatu w konfiguracji pobieranej przy pierwszym połączeniu (Trust On First Use, TOFU), podobnie jak SSH.

| Podejście | Bezpieczeństwo | Wygoda | Zastosowanie |
|-----------|---------------|--------|-------------|
| Brak TLS (HTTP) | ❌ | ✅ | Tylko prototypy, LAN zamknięty |
| TLS + self-signed w TrustManager | ✅ | ✅ | Produkcja IoT - znane urządzenia |
| Certificate Pinning | ✅✅ | ⚠️ | Urządzenia ze stałym certyfikatem |
| Let's Encrypt (lokalny CA) | ✅✅ | ⚠️ | Raspberry Pi z domeną lokalną |
