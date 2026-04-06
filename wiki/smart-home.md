# Smart Home i protokoły automatyki

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

## Monitoring energii — pomiar zużycia

Inteligentne gniazdka takie jak **Shelly Plug S** czy **TP-Link Kasa EP25** udostępniają dane o bieżącym poborze mocy przez lokalne REST API lub MQTT. Integracja tych danych pozwala budować w aplikacji mobilnej dashboard zużycia energii z wykresami i alertami przekroczenia progów.

```kotlin
// Shelly Plug S — lokalne REST API
class ShellyEnergyClient(private val deviceIp: String) {
    private val client = OkHttpClient()

    // Odczyt aktualnego poboru mocy [W] i licznika energii [Wh]
    suspend fun getEnergyData(): ShellyEnergyData = withContext(Dispatchers.IO) {
        val response = client.newCall(
            Request.Builder().url("http://$deviceIp/meter/0").build()
        ).execute()
        val json = Json { ignoreUnknownKeys = true }
        json.decodeFromString(response.body!!.string())
    }

    // Resetuj licznik energii
    suspend fun resetMeter() = withContext(Dispatchers.IO) {
        client.newCall(
            Request.Builder().url("http://$deviceIp/meter/0?reset=true").build()
        ).execute()
    }
}

@Serializable
data class ShellyEnergyData(
    val power: Float,         // bieżący pobór w W
    @SerialName("total") val totalWh: Float,  // łączne zużycie w Wh
    val overpower: Boolean,   // przekroczenie limitu mocy
    val valid: Boolean
)

// Repository agregujące dane z wielu gniazdek
class EnergyRepository(private val haClient: HomeAssistantClient) {
    fun getDeviceEnergyFlow(entityId: String): Flow<EnergyReading> = flow {
        while (true) {
            val state = haClient.getState(entityId)
            val power = state.attributes["current_power_w"]?.jsonPrimitive?.float ?: 0f
            val today  = state.attributes["today_energy_kwh"]?.jsonPrimitive?.float ?: 0f
            emit(EnergyReading(entityId = entityId, powerW = power, todayKwh = today,
                timestamp = System.currentTimeMillis()))
            delay(5_000) // odczyt co 5 sekund
        }
    }.flowOn(Dispatchers.IO)
}

data class EnergyReading(val entityId: String, val powerW: Float, val todayKwh: Float, val timestamp: Long)
```

Dane o zużyciu energii warto wizualizować za pomocą biblioteki `Vico` (Compose) lub `MPAndroidChart`. Przykładowy wykres słupkowy dla zużycia godzinowego:

```kotlin
@Composable
fun EnergyBarChart(hourlyKwh: List<Float>) {
    val model = remember(hourlyKwh) {
        CartesianChartModelProducer.build {
            columnSeries { series(hourlyKwh) }
        }
    }
    CartesianChartHost(
        chart = rememberCartesianChart(
            rememberColumnCartesianLayer(
                columnProvider = ColumnCartesianLayer.ColumnProvider.series(
                    rememberLineComponent(color = Color(0xFF4CAF50), thickness = 8.dp)
                )
            ),
            startAxis = rememberStartAxis(),
            bottomAxis = rememberBottomAxis(valueFormatter = { v, _, _ -> "${v.toInt()}:00" })
        ),
        modelProducer = model
    )
}
```

Alertem o przekroczeniu progu mocy można powiadamiać użytkownika przez `NotificationManager` — np. gdy lodówka pobiera powyżej 500W przez ponad 10 minut, co może sygnalizować usterkę sprężarki.

## Automatyzacje — reguły i scenariusze

System reguł automatyzacji w stylu IFTTT pozwala użytkownikowi definiować warunki (If) i akcje (Then) bez pisania kodu. Implementacja po stronie aplikacji mobilnej obejmuje edytor reguł i silnik ewaluacji.

```kotlin
// Model reguły automatyzacji
@Serializable
data class AutomationRule(
    val id: String = UUID.randomUUID().toString(),
    val name: String,
    val enabled: Boolean = true,
    val trigger: Trigger,
    val conditions: List<Condition> = emptyList(),
    val actions: List<Action>
)

@Serializable
sealed class Trigger {
    @Serializable @SerialName("state")
    data class StateChange(val entityId: String, val toState: String) : Trigger()
    @Serializable @SerialName("time")
    data class TimeOfDay(val hour: Int, val minute: Int) : Trigger()
    @Serializable @SerialName("numeric")
    data class NumericThreshold(val entityId: String, val attribute: String,
                                val above: Float? = null, val below: Float? = null) : Trigger()
}

@Serializable
sealed class Action {
    @Serializable @SerialName("toggle")
    data class ToggleDevice(val entityId: String, val state: String) : Action()
    @Serializable @SerialName("scene")
    data class ActivateScene(val sceneId: String) : Action()
    @Serializable @SerialName("group")
    data class ControlGroup(val groupId: String, val state: String) : Action()
    @Serializable @SerialName("notify")
    data class SendNotification(val message: String) : Action()
}

// Silnik ewaluacji reguł
class AutomationEngine(
    private val haClient: HomeAssistantClient,
    private val rules: StateFlow<List<AutomationRule>>
) {
    fun startEvaluationLoop(): Flow<AutomationEvent> = channelFlow {
        // Subskrybuj zmiany stanów przez WebSocket
        haClient.stateChanges().collect { change ->
            rules.value.filter { it.enabled }.forEach { rule ->
                if (evaluateTrigger(rule.trigger, change) && evaluateConditions(rule.conditions)) {
                    rule.actions.forEach { action -> executeAction(action) }
                    send(AutomationEvent.Fired(rule.id, rule.name))
                }
            }
        }
    }

    private suspend fun executeAction(action: Action) {
        when (action) {
            is Action.ToggleDevice   -> haClient.callService("homeassistant",
                if (action.state == "on") "turn_on" else "turn_off",
                buildJsonObject { put("entity_id", action.entityId) })
            is Action.ActivateScene  -> haClient.callService("scene", "turn_on",
                buildJsonObject { put("entity_id", action.sceneId) })
            is Action.SendNotification -> haClient.callService("notify", "mobile_app",
                buildJsonObject { put("message", action.message) })
            else -> {}
        }
    }
}
```

Edytor reguł w Compose to sekwencja kroków: wybór wyzwalacza (lista typów triggerów), opcjonalne warunki dodatkowe oraz lista akcji z przyciskiem „Dodaj akcję". Reguły są przechowywane lokalnie w SQLDelight i synchronizowane z Home Assistant przez API automatyzacji.

## Bezpieczeństwo w Smart Home

Lokalne API urządzeń Smart Home często opiera się na HTTP bez szyfrowania, a tokeny dostępu przechowywane w pamięci urządzenia mogą być przechwycone. Właściwa implementacja bezpieczeństwa wymaga kilku warstw ochrony.

**Certificate pinning** dla połączeń z Home Assistant po HTTPS:

```kotlin
// Konfiguracja certificate pinning dla Home Assistant
fun createSecureOkHttpClient(certificateSha256: String): OkHttpClient {
    val certificatePinner = CertificatePinner.Builder()
        .add("homeassistant.local", "sha256/$certificateSha256")
        .add("*.local", "sha256/$certificateSha256")
        .build()

    return OkHttpClient.Builder()
        .certificatePinner(certificatePinner)
        .addInterceptor(TokenRefreshInterceptor())
        .connectTimeout(10, TimeUnit.SECONDS)
        .readTimeout(30, TimeUnit.SECONDS)
        .build()
}

// Przechowywanie tokenu w EncryptedSharedPreferences
class SecureTokenStore(context: Context) {
    private val prefs = EncryptedSharedPreferences.create(
        context, "ha_secure_prefs",
        MasterKey.Builder(context).setKeyScheme(MasterKey.KeyScheme.AES256_GCM).build(),
        EncryptedSharedPreferences.PrefKeyEncryptionScheme.AES256_SIV,
        EncryptedSharedPreferences.PrefValueEncryptionScheme.AES256_GCM
    )

    fun saveToken(token: String) = prefs.edit().putString("access_token", token).apply()
    fun getToken(): String? = prefs.getString("access_token", null)
    fun clearToken() = prefs.edit().remove("access_token").apply()
}
```

**mTLS (mutual TLS)** dla krytycznych integracji lokalnych — zarówno serwer, jak i klient uwierzytelniają się certyfikatem:

```kotlin
fun createMtlsClient(clientCert: X509Certificate, privateKey: PrivateKey,
                     trustedCert: X509Certificate): OkHttpClient {
    val keyManagerFactory = KeyManagerFactory.getInstance(KeyManagerFactory.getDefaultAlgorithm())
    val keyStore = KeyStore.getInstance(KeyStore.getDefaultType()).also {
        it.load(null); it.setCertificateEntry("client", clientCert)
        it.setKeyEntry("key", privateKey, null, arrayOf(clientCert))
    }
    keyManagerFactory.init(keyStore, null)

    val trustManagerFactory = TrustManagerFactory.getInstance(TrustManagerFactory.getDefaultAlgorithm())
    val trustStore = KeyStore.getInstance(KeyStore.getDefaultType()).also {
        it.load(null); it.setCertificateEntry("server", trustedCert)
    }
    trustManagerFactory.init(trustStore)

    val sslContext = SSLContext.getInstance("TLS").also {
        it.init(keyManagerFactory.keyManagers, trustManagerFactory.trustManagers, null)
    }
    return OkHttpClient.Builder().sslSocketFactory(sslContext.socketFactory,
        trustManagerFactory.trustManagers[0] as X509TrustManager).build()
}
```

Dodatkowe środki ochrony obejmują: weryfikację tokenu przed każdym wywołaniem API, automatyczne wygasanie sesji po bezczynności (15 minut), blokadę ekranu PIN/biometrię przed otwarciem panelu sterowania oraz logowanie wszystkich akcji sterowania z timestampem do lokalnej bazy danych dla audytu.

| Zagrożenie | Mitygacja |
|---|---|
| Przechwycenie tokenu | EncryptedSharedPreferences + certificate pinning |
| MITM na sieci lokalnej | mTLS / HTTPS z własnym CA |
| Nieautoryzowany dostęp fizyczny | PIN/biometria + timeout sesji |
| Odtworzenie komend (replay attack) | Nonce w nagłówkach żądań |
