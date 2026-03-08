# MQTT — Protokół dla IoT

MQTT (Message Queuing Telemetry Transport) to lekki protokół publish-subscribe zaprojektowany dla urządzeń IoT o ograniczonej przepustowości i mocy. Działa ponad TCP/IP i jest idealny dla czujników, smart home i telemetrii.

## Architektura MQTT

```
┌──────────────┐    publish("sensors/temp", "23.5")    ┌──────────────────┐
│ Sensor IoT   │ ───────────────────────────────────→  │                  │
│ (Publisher)  │                                       │   MQTT Broker    │
└──────────────┘                                       │ (np. Mosquitto,  │
                                                       │  HiveMQ, EMQX)   │
┌──────────────┐    subscribe("sensors/#")             │                  │
│ Aplikacja    │ ←─────────────────────────────────── │                  │
│ (Subscriber) │    receive("sensors/temp", "23.5")    └──────────────────┘
└──────────────┘
```

## Quality of Service (QoS)

| QoS | Gwarancja | Zastosowanie |
|-----|-----------|-------------|
| **0** | At most once (może zginąć) | Dane pogodowe, telemetria |
| **1** | At least once (może duplikat) | Komendy sterujące |
| **2** | Exactly once (gwarantowane) | Płatności, alarmy bezpieczeństwa |

## Implementacja MQTT na Android — Eclipse Paho

```kotlin
dependencies {
    implementation("org.eclipse.paho:org.eclipse.paho.android.service:1.1.1")
    implementation("org.eclipse.paho:org.eclipse.paho.client.mqttv3:1.2.5")
}

class MqttManager(private val context: Context) {
    private val clientId = "android_${Build.MODEL}_${System.currentTimeMillis()}"
    private val mqttClient = MqttAndroidClient(context, "tcp://broker.hivemq.com:1883", clientId)

    fun connect(onConnected: () -> Unit, onError: (Throwable) -> Unit) {
        val options = MqttConnectOptions().apply {
            isAutomaticReconnect = true
            isCleanSession = false
            keepAliveInterval = 60
            connectionTimeout = 30
            // Autoryzacja (jeśli broker wymaga)
            // userName = "user"
            // password = "pass".toCharArray()

            // Last Will Testament — wiadomość wysłana gdy klient się rozłączy
            setWill(
                "devices/$clientId/status",
                "offline".toByteArray(),
                QoS.AT_LEAST_ONCE, true
            )
        }

        mqttClient.connect(options, null, object : IMqttActionListener {
            override fun onSuccess(asyncActionToken: IMqttToken?) {
                onConnected()
                publish("devices/$clientId/status", "online", retained = true)
            }
            override fun onFailure(asyncActionToken: IMqttToken?, exception: Throwable?) {
                onError(exception ?: Exception("Unknown MQTT error"))
            }
        })
    }

    fun subscribe(topic: String, qos: Int = 1, onMessage: (String, String) -> Unit) {
        mqttClient.subscribe(topic, qos) { receivedTopic, message ->
            onMessage(receivedTopic, String(message.payload))
        }
    }

    fun publish(topic: String, payload: String, qos: Int = 1, retained: Boolean = false) {
        val message = MqttMessage(payload.toByteArray()).apply {
            this.qos = qos
            isRetained = retained
        }
        mqttClient.publish(topic, message)
    }

    fun disconnect() = mqttClient.disconnect()
}
```

## Tematy (Topics) — konwencje nazewnictwa

```
# Hierarchia tematów
home/
├── living_room/
│   ├── temperature       → 23.5
│   ├── humidity          → 65
│   └── light/
│       ├── state         → ON
│       └── brightness    → 80
├── bedroom/
│   └── temperature       → 21.2
└── garden/
    └── soil_moisture     → 42

# Wildcards przy subskrypcji
"home/+/temperature"    → wszystkie temperatury na jednym poziomie
"home/#"                → wszystko pod home/
```

## Retained Messages i Last Will

```kotlin
// Retained message — broker przechowuje ostatnią wartość
// Nowy subskrybent natychmiast dostaje aktualny stan
mqtt.publish(
    topic = "home/living_room/temperature",
    payload = "23.5",
    retained = true  // broker zapamięta tę wartość
)

// Last Will Testament (LWT) — ustawia się przy połączeniu
// Gdy klient się nieoczekiwanie rozłączy, broker wysyła tę wiadomość
val willMessage = MqttMessage("offline".toByteArray()).apply {
    qos = 1; isRetained = true
}
connectOptions.setWill("devices/my_sensor/status", willMessage)
```

## Dashboard IoT w Compose

```kotlin
@Composable
fun MqttDashboard(viewModel: MqttViewModel) {
    val sensors by viewModel.sensorData.collectAsState()
    val connectionState by viewModel.connectionState.collectAsState()

    Column(modifier = Modifier.padding(16.dp)) {
        // Status połączenia
        Row(verticalAlignment = Alignment.CenterVertically) {
            Icon(
                imageVector = if (connectionState == MqttState.CONNECTED)
                    Icons.Default.Wifi else Icons.Default.WifiOff,
                contentDescription = null,
                tint = if (connectionState == MqttState.CONNECTED) Color.Green else Color.Red
            )
            Text(
                text = if (connectionState == MqttState.CONNECTED) "Połączono" else "Rozłączono",
                modifier = Modifier.padding(start = 8.dp)
            )
        }

        Spacer(modifier = Modifier.height(16.dp))

        // Kafelki sensorów
        LazyVerticalGrid(columns = GridCells.Fixed(2), horizontalArrangement = Arrangement.spacedBy(12.dp)) {
            items(sensors) { sensor ->
                SensorCard(sensor = sensor)
            }
        }
    }
}
```

## Linki

- [Eclipse Paho Android](https://github.com/eclipse/paho.mqtt.android)
- [HiveMQ MQTT Broker](https://www.hivemq.com/mqtt-broker/)
- [MQTT Explorer — GUI client](http://mqtt-explorer.com/)

## MQTT over TLS — bezpieczna komunikacja

```kotlin
// Połączenie z brokerem przez TLS (port 8883)
fun createSecureMqttClient(context: Context): MqttAndroidClient {
    val client = MqttAndroidClient(context, "ssl://broker.example.com:8883", clientId)

    val sslFactory = createSSLSocketFactory(context)
    val options = MqttConnectOptions().apply {
        isAutomaticReconnect = true
        socketFactory = sslFactory
        // Mutual TLS (opcjonalne) — klient uwierzytelnia się certyfikatem
        // socketFactory = createMutualTLSFactory(clientCert, clientKey)
    }
    return client
}

private fun createSSLSocketFactory(context: Context): SSLSocketFactory {
    // Załaduj CA certyfikat brokera
    val caCert = context.assets.open("broker_ca.crt")
    val keyStore = KeyStore.getInstance(KeyStore.getDefaultType()).apply {
        load(null, null)
        setCertificateEntry("ca", CertificateFactory.getInstance("X.509").generateCertificate(caCert))
    }
    val trustManagerFactory = TrustManagerFactory.getInstance(TrustManagerFactory.getDefaultAlgorithm()).apply {
        init(keyStore)
    }
    return SSLContext.getInstance("TLS").apply {
        init(null, trustManagerFactory.trustManagers, null)
    }.socketFactory
}
```

## Home Assistant — integracja MQTT

Home Assistant to popularna platforma smart home z wbudowaną obsługą MQTT:

```kotlin
// Autodiscovery — HA automatycznie wykrywa urządzenia przez MQTT
fun publishHaDiscovery(bridge: MqttManager) {
    // Konfiguracja czujnika temperatury
    val config = """
    {
        "name": "Temperatura Salon",
        "unique_id": "sensor_temp_salon_001",
        "state_topic": "homeassistant/sensor/salon/temperature/state",
        "unit_of_measurement": "°C",
        "device_class": "temperature",
        "value_template": "{{ value_json.temperature }}"
    }
    """.trimIndent()

    bridge.publish(
        topic = "homeassistant/sensor/salon_temp/config",
        payload = config,
        retained = true  // HA odczyta przy uruchomieniu
    )
}

// Kontrola świateł przez MQTT
fun toggleLight(bridge: MqttManager, lightId: String, on: Boolean) {
    bridge.publish(
        topic = "homeassistant/light/$lightId/set",
        payload = if (on) """{"state":"ON","brightness":255}"""
                  else    """{"state":"OFF"}"""
    )
}

// Nasłuchiwanie stanu świateł
fun subscribeToLightState(bridge: MqttManager, lightId: String, onUpdate: (Boolean, Int) -> Unit) {
    bridge.subscribe("homeassistant/light/$lightId/state") { _, payload ->
        val json = JSONObject(payload)
        val isOn = json.getString("state") == "ON"
        val brightness = json.optInt("brightness", 0)
        onUpdate(isOn, brightness)
    }
}
```

## Linki dodatkowe

- [MQTT Security](https://www.hivemq.com/mqtt-security-fundamentals/)
- [Home Assistant MQTT](https://www.home-assistant.io/integrations/mqtt/)
- [Eclipse Mosquitto — self-hosted broker](https://mosquitto.org/)
