# Wi-Fi i Sieć Lokalna

Aplikacje IoT często komunikują się z urządzeniami w tej samej sieci lokalnej Wi-Fi, bez pośrednictwa chmury. Android i iOS udostępniają API do odkrywania urządzeń (mDNS/Bonjour), komunikacji TCP/UDP i tworzenia hotspotów.

## Network Service Discovery — mDNS/Bonjour

mDNS (Multicast DNS) pozwala urządzeniom odkrywać siebie nawzajem po nazwie w sieci lokalnej bez centralnego serwera DNS. Apple nazywa tę technologię Bonjour.

```kotlin
// Android — NsdManager: odkrywanie usług mDNS
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

## Socket TCP — komunikacja z urządzeniem IoT

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

// Przykład — sterowanie lampą ESP8266 przez TCP
class SmartLampController(host: String) {
    private val client = TcpDeviceClient(host, 23)  // port Telnet

    suspend fun connect() = client.connect()
    suspend fun turnOn() = client.sendCommand("LED_ON")
    suspend fun turnOff() = client.sendCommand("LED_OFF")
    suspend fun setBrightness(value: Int) = client.sendCommand("BRIGHT:$value")
    suspend fun getStatus() = client.sendCommand("STATUS?")
}
```

## UDP — protokół dla telemetrii

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
// Philips Hue Bridge — pełne API sterowania żarówkami
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

## Wi-Fi Direct — komunikacja P2P

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
