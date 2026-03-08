# Smart Home i Protokoły Automatyki

Ekosystem Smart Home obejmuje dziesiątki protokołów i standardów. Aplikacja mobilna musi znać specyfikę każdego z nich, by integrować się z urządzeniami i udostępniać zunifikowany interfejs użytkownikowi.

## Przegląd protokołów Smart Home

| Protokół | Zasięg | Przepustowość | Zużycie energii | Sieć | Zastosowanie |
|----------|--------|--------------|-----------------|------|-------------|
| **Zigbee** | ~10-30m | 250 kbps | Bardzo niskie | Mesh | Żarówki, czujniki |
| **Z-Wave** | ~30m | 100 kbps | Bardzo niskie | Mesh | Zamki, czujniki EU |
| **Thread/Matter** | ~10-30m | 250 kbps | Niskie | IPv6 Mesh | Standard przyszłości |
| **Wi-Fi** | ~30m | Duża | Wysokie | Direct | Kamery, głośniki |
| **Bluetooth LE** | ~10m | 1-2 Mbps | Niskie | Star | Blokady, skale |
| **Infrared** | ~5m (LoS) | — | Minimalne | Point | Piloty TV/AC |

## Matter — nowy standard (2022+)

Matter to otwarty protokół IP wspierany przez Apple, Google, Amazon i Samsung. Jeden ekosystem zamiast fragmentacji:

```kotlin
// Android Home SDK (Matter)
dependencies {
    implementation("com.google.android.gms:play-services-home:1.1.0")
    implementation("com.google.home:google-home-sdk:1.2.0")
}

class MatterDeviceManager(private val context: Context) {
    private val homeClient = HomeClient.getClient(context, HomeClientOptions.builder().build())

    // Komisjonowanie (parowanie) nowego urządzenia
    suspend fun commissionDevice(shareCode: String): Boolean {
        return try {
            homeClient.commissionDevice(
                CommissionDeviceRequest.builder(shareCode).build()
            )
            true
        } catch (e: CommissioningException) {
            Log.e("Matter", "Komisjonowanie nieudane: ${e.message}")
            false
        }
    }

    // Listowanie sparowanych urządzeń
    fun getDevices(): Flow<List<HomeDevice>> =
        homeClient.devices().map { it.filter { device -> device.isConnected } }

    // Sterowanie urządzeniem — włącz/wyłącz
    suspend fun toggleLight(deviceId: String, on: Boolean) {
        val device = homeClient.devices().first()
            .firstOrNull { it.id.id == deviceId } ?: return
        device.getTypeTrait<OnOffTrait>()?.let { trait ->
            if (on) trait.on() else trait.off()
        }
    }

    // Ustaw jasność (0.0 - 1.0)
    suspend fun setBrightness(deviceId: String, brightness: Float) {
        val device = homeClient.devices().first()
            .firstOrNull { it.id.id == deviceId } ?: return
        device.getTypeTrait<LevelControlTrait>()?.let { trait ->
            trait.moveToLevelWithOnOff(
                level = (brightness * 254).toInt().coerceIn(0, 254),
                transitionTime = 5  // 0.5 sekundy
            )
        }
    }
}
```

## Home Assistant — lokalna automatyka

Home Assistant to najpopularniejsza platforma open-source do automatyki domowej. REST API i WebSocket API umożliwiają pełną kontrolę:

```kotlin
// Home Assistant REST API
class HomeAssistantClient(
    private val baseUrl: String,   // np. "http://homeassistant.local:8123"
    private val token: String      // Long-lived access token
) {
    private val client = OkHttpClient.Builder()
        .addInterceptor { chain ->
            chain.proceed(chain.request().newBuilder()
                .addHeader("Authorization", "Bearer $token")
                .addHeader("Content-Type", "application/json")
                .build()
            )
        }
        .build()

    private val json = Json { ignoreUnknownKeys = true; isLenient = true }

    // Pobierz wszystkie encje
    suspend fun getStates(): List<HaState> = withContext(Dispatchers.IO) {
        val response = client.newCall(
            Request.Builder().url("$baseUrl/api/states").get().build()
        ).execute()
        json.decodeFromString(response.body!!.string())
    }

    // Pobierz stan konkretnej encji
    suspend fun getState(entityId: String): HaState = withContext(Dispatchers.IO) {
        val response = client.newCall(
            Request.Builder().url("$baseUrl/api/states/$entityId").get().build()
        ).execute()
        json.decodeFromString(response.body!!.string())
    }

    // Wywołaj usługę (service call)
    suspend fun callService(domain: String, service: String, data: JsonObject = buildJsonObject {}) {
        withContext(Dispatchers.IO) {
            client.newCall(
                Request.Builder()
                    .url("$baseUrl/api/services/$domain/$service")
                    .post(data.toString().toRequestBody("application/json".toMediaType()))
                    .build()
            ).execute()
        }
    }
}

// Wygodne rozszerzenia
suspend fun HomeAssistantClient.turnOn(entityId: String) =
    callService("homeassistant", "turn_on", buildJsonObject { put("entity_id", entityId) })

suspend fun HomeAssistantClient.turnOff(entityId: String) =
    callService("homeassistant", "turn_off", buildJsonObject { put("entity_id", entityId) })

suspend fun HomeAssistantClient.setTemperature(entityId: String, temp: Float) =
    callService("climate", "set_temperature", buildJsonObject {
        put("entity_id", entityId)
        put("temperature", temp)
    })

@Serializable
data class HaState(
    @SerialName("entity_id") val entityId: String,
    val state: String,
    val attributes: JsonObject
)
```

## WebSocket — aktualizacje w czasie rzeczywistym

```kotlin
class HomeAssistantWebSocket(
    private val baseUrl: String,
    private val token: String
) {
    private var webSocket: WebSocket? = null
    private var messageId = 1
    private val stateListeners = mutableMapOf<String, (HaState) -> Unit>()

    fun connect(onReady: () -> Unit) {
        val wsUrl = baseUrl.replace("http", "ws") + "/api/websocket"
        val request = Request.Builder().url(wsUrl).build()
        webSocket = OkHttpClient().newWebSocket(request, object : WebSocketListener() {
            override fun onMessage(webSocket: WebSocket, text: String) {
                handleMessage(text, onReady)
            }
        })
    }

    private fun handleMessage(text: String, onReady: () -> Unit) {
        val msg = Json.parseToJsonElement(text).jsonObject
        when (msg["type"]?.jsonPrimitive?.content) {
            "auth_required" -> authenticate()
            "auth_ok"       -> { subscribeToEvents(); onReady() }
            "event" -> {
                val eventData = msg["event"]?.jsonObject?.get("data")?.jsonObject
                val entityId = eventData?.get("entity_id")?.jsonPrimitive?.content ?: return
                val newState = eventData["new_state"]?.let {
                    Json.decodeFromJsonElement<HaState>(it)
                } ?: return
                stateListeners[entityId]?.invoke(newState)
            }
        }
    }

    private fun authenticate() {
        webSocket?.send("""{"type":"auth","access_token":"$token"}""")
    }

    private fun subscribeToEvents() {
        webSocket?.send("""{"id":${messageId++},"type":"subscribe_events","event_type":"state_changed"}""")
    }

    fun onStateChange(entityId: String, listener: (HaState) -> Unit) {
        stateListeners[entityId] = listener
    }

    fun disconnect() = webSocket?.close(1000, "Normal closure")
}
```

## Dashboard Smart Home w Compose

```kotlin
@Composable
fun SmartHomeDashboard(viewModel: SmartHomeViewModel) {
    val devices by viewModel.devices.collectAsState()
    val rooms by viewModel.rooms.collectAsState()

    LazyColumn(contentPadding = PaddingValues(16.dp)) {
        // Sekcja każdego pokoju
        rooms.forEach { room ->
            item {
                Text(room.name, style = MaterialTheme.typography.titleLarge, modifier = Modifier.padding(vertical = 12.dp))
            }
            val roomDevices = devices.filter { it.roomId == room.id }
            items(roomDevices, key = { it.id }) { device ->
                DeviceCard(
                    device = device,
                    onToggle = { viewModel.toggle(device.id) },
                    onBrightnessChange = { viewModel.setBrightness(device.id, it) }
                )
                Spacer(Modifier.height(8.dp))
            }
        }
    }
}

@Composable
fun DeviceCard(device: Device, onToggle: () -> Unit, onBrightnessChange: (Float) -> Unit) {
    val isOn = device.state == "on"
    val backgroundColor by animateColorAsState(
        if (isOn) MaterialTheme.colorScheme.primaryContainer
        else MaterialTheme.colorScheme.surfaceVariant
    )

    ElevatedCard(
        modifier = Modifier.fillMaxWidth(),
        colors = CardDefaults.elevatedCardColors(containerColor = backgroundColor)
    ) {
        Row(Modifier.padding(16.dp), verticalAlignment = Alignment.CenterVertically) {
            Icon(device.icon, null, modifier = Modifier.size(32.dp))
            Spacer(Modifier.width(12.dp))
            Column(Modifier.weight(1f)) {
                Text(device.name, style = MaterialTheme.typography.titleMedium)
                if (device.type == DeviceType.LIGHT && isOn) {
                    Slider(
                        value = device.brightness,
                        onValueChange = onBrightnessChange,
                        modifier = Modifier.padding(top = 4.dp)
                    )
                } else {
                    Text(if (isOn) "Włączone" else "Wyłączone",
                        style = MaterialTheme.typography.bodySmall,
                        color = MaterialTheme.colorScheme.onSurfaceVariant)
                }
            }
            Switch(checked = isOn, onCheckedChange = { onToggle() })
        }
    }
}
```

## Linki

- [Matter Developer Docs](https://developers.home.google.com/matter)
- [Home Assistant API](https://developers.home-assistant.io/docs/api/rest/)
- [Home Assistant App](https://www.home-assistant.io/integrations/mobile_app/)
- [Zigbee2MQTT](https://www.zigbee2mqtt.io/)
- [ESPHome](https://esphome.io/)
