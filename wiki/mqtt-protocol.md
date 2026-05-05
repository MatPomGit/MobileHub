# MQTT - protokół dla IoT

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

## Implementacja MQTT na Android - Eclipse Paho

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

            // Last Will Testament - wiadomość wysłana gdy klient się rozłączy
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

## Tematy (Topics) - konwencje nazewnictwa

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
// Retained message - broker przechowuje ostatnią wartość
// Nowy subskrybent natychmiast dostaje aktualny stan
mqtt.publish(
    topic = "home/living_room/temperature",
    payload = "23.5",
    retained = true  // broker zapamięta tę wartość
)

// Last Will Testament (LWT) - ustawia się przy połączeniu
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
- [MQTT Explorer - GUI client](http://mqtt-explorer.com/)

## MQTT over TLS - bezpieczna komunikacja

```kotlin
// Połączenie z brokerem przez TLS (port 8883)
fun createSecureMqttClient(context: Context): MqttAndroidClient {
    val client = MqttAndroidClient(context, "ssl://broker.example.com:8883", clientId)

    val sslFactory = createSSLSocketFactory(context)
    val options = MqttConnectOptions().apply {
        isAutomaticReconnect = true
        socketFactory = sslFactory
        // Mutual TLS (opcjonalne) - klient uwierzytelnia się certyfikatem
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

## Home Assistant - integracja MQTT

Home Assistant to popularna platforma smart home z wbudowaną obsługą MQTT:

```kotlin
// Autodiscovery - HA automatycznie wykrywa urządzenia przez MQTT
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
- [Eclipse Mosquitto - self-hosted broker](https://mosquitto.org/)

---

## 1. Poziomy QoS - szczegółowe omówienie

Quality of Service w MQTT definiuje kontrakt niezawodności dostarczania wiadomości między klientem a brokerem. Wybór poziomu QoS wpływa bezpośrednio na obciążenie sieci i gwarancje dostarczenia.

### QoS 0 - At Most Once (co najwyżej raz)

Wiadomość jest wysyłana jednorazowo bez potwierdzenia. Broker ani subskrybent nie przechowują stanu. Najszybszy, ale zawodny przy niestabilnym połączeniu.

```
Nadawca          Broker
   │── PUBLISH ──→│
   │              │── PUBLISH ──→ Subskrybent
```

```kotlin
// QoS 0 - dane telemetryczne, których utrata jest akceptowalna
mqttManager.publish(
    topic = "sensors/temperature",
    payload = "23.5",
    qos = 0,       // fire-and-forget
    retained = false
)
```

**Kiedy używać:** odczyty sensorów co kilka sekund (utrata jednego odczytu nie ma znaczenia), strumieniowanie danych GPS, logi diagnostyczne.

### QoS 1 - At Least Once (co najmniej raz)

Wiadomość jest dostarczana przynajmniej raz - może wystąpić duplikacja. Nadawca przechowuje wiadomość do momentu otrzymania `PUBACK` od brokera.

```
Nadawca          Broker
   │── PUBLISH ──→│  (pakiet ID: 42)
   │←── PUBACK ───│
   │              │── PUBLISH ──→ Subskrybent
   │              │←── PUBACK ───│
```

```kotlin
// QoS 1 - komendy sterujące, gdzie duplikat jest obsłużony po stronie odbiorcy
mqttManager.publish(
    topic = "devices/thermostat/setpoint",
    payload = """{"target": 21.0}""",
    qos = 1
)

// Subskrybent powinien być idempotentny (duplikat nie szkodzi)
mqttManager.subscribe("devices/thermostat/setpoint", qos = 1) { _, payload ->
    val target = JSONObject(payload).getDouble("target")
    thermostat.setTemperature(target) // ustawienie tej samej wartości dwa razy = brak efektu ubocznego
}
```

**Kiedy używać:** komendy sterujące urządzeniami, powiadomienia push, aktualizacje stanu.

### QoS 2 - Exactly Once (dokładnie raz)

Najbardziej niezawodny poziom - czterostopniowy handshake gwarantuje, że wiadomość dotrze dokładnie raz. Najwyższy narzut sieciowy.

```
Nadawca          Broker           Subskrybent
   │── PUBLISH ──→│                    │
   │←── PUBREC ───│                    │
   │── PUBREL ──→ │                    │
   │←── PUBCOMP ──│                    │
   │              │──── PUBLISH ──────→│
   │              │←─── PUBREC ────────│
   │              │──── PUBREL ───────→│
   │              │←─── PUBCOMP ───────│
```

```kotlin
// QoS 2 - transakcje krytyczne
mqttManager.publish(
    topic = "factory/machine/emergency_stop",
    payload = """{"command": "STOP", "timestamp": ${System.currentTimeMillis()}}""",
    qos = 2  // musi dotrzeć dokładnie raz - podwójne zatrzymanie mogłoby uszkodzić maszynę
)
```

**Kiedy używać:** polecenia bezpieczeństwa, transakcje finansowe, alarmy przemysłowe.

---

## 2. Wiadomości zatrzymane (Retained Messages) - szczegółowe omówienie

Retained message to specjalna wiadomość przechowywana przez brokera na danym temacie. Każdy nowy subskrybent natychmiast otrzymuje ostatnią zachowaną wiadomość - bez czekania na kolejną publikację.

### Mechanizm działania

```
1. Sensor publikuje z flagą retained=true:
   PUBLISH topic="home/temp" payload="23.5" RETAIN=1

2. Broker przechowuje "23.5" dla tematu "home/temp"

3. Nowa aplikacja subskrybuje:
   SUBSCRIBE "home/temp"
   ↓ broker natychmiast wysyła:
   PUBLISH "home/temp" → "23.5"  (bez czekania na nowy odczyt)
```

```kotlin
// Publikowanie stanu urządzenia z retencją
fun publishDeviceStatus(isOnline: Boolean) {
    mqttManager.publish(
        topic = "devices/$deviceId/status",
        payload = if (isOnline) "online" else "offline",
        qos = 1,
        retained = true  // każdy nowy subskrybent zobaczy aktualny stan
    )
}

// Usuwanie retained message - wysłanie pustego payload
fun clearRetainedMessage(topic: String) {
    mqttManager.publish(
        topic = topic,
        payload = "",   // pusty payload usuwa retained message
        retained = true
    )
}

// Subskrybent odbierający retained message przy starcie
mqttManager.subscribe("devices/+/status", qos = 1) { topic, payload ->
    val deviceId = topic.split("/")[1]
    val isOnline = payload == "online"
    updateDeviceList(deviceId, isOnline)  // natychmiast znamy stan wszystkich urządzeń
}
```

**Typowe zastosowania retained messages:**
- status online/offline urządzeń
- ostatnia zmierzona wartość czujnika
- aktualna konfiguracja urządzenia
- wersja firmware urządzenia

---

## 3. Last Will and Testament (LWT) - scenariusze rozłączenia

LWT (Ostatnia Wola) to wiadomość, którą broker wyśle automatycznie, gdy klient rozłączy się w sposób nieoczekiwany (utrata zasilania, awaria sieci, crash aplikacji). Ustawiana jest podczas nawiązywania połączenia.

### Różnica między normalnym a awaryjnym rozłączeniem

| Typ rozłączenia | Co się dzieje z LWT |
|-----------------|---------------------|
| Normalne (`DISCONNECT`) | Broker **nie wysyła** LWT |
| Awaryjne (timeout, reset sieci) | Broker **wysyła** LWT po upływie Keep Alive |

```kotlin
// Pełna konfiguracja LWT z wzorcem online/offline
class MqttPresenceManager(
    private val context: Context,
    private val deviceId: String
) {
    private val statusTopic = "devices/$deviceId/status"

    fun connect(): MqttAndroidClient {
        val client = MqttAndroidClient(context, "ssl://broker.example.com:8883", deviceId)

        val options = MqttConnectOptions().apply {
            isAutomaticReconnect = true
            isCleanSession = false
            keepAliveInterval = 30  // broker czeka 30s przed uznaniem klienta za offline

            // LWT - wysłane gdy klient zniknie bez DISCONNECT
            setWill(
                statusTopic,
                """{"state":"offline","reason":"unexpected"}""".toByteArray(),
                1,     // QoS 1
                true   // retained - nowi subskrybenci widzą ostatni stan
            )
        }

        client.connect(options, null, object : IMqttActionListener {
            override fun onSuccess(token: IMqttToken?) {
                // Ogłaszamy się jako online tuż po połączeniu
                client.publish(
                    statusTopic,
                    MqttMessage("""{"state":"online","since":${System.currentTimeMillis()}}""".toByteArray()).apply {
                        qos = 1; isRetained = true
                    }
                )
            }
            override fun onFailure(token: IMqttToken?, e: Throwable?) { /* obsługa błędu */ }
        })

        return client
    }

    fun disconnect(client: MqttAndroidClient) {
        // Przed normalnym rozłączeniem ręcznie ustawiamy offline
        client.publish(
            statusTopic,
            MqttMessage("""{"state":"offline","reason":"graceful"}""".toByteArray()).apply {
                qos = 1; isRetained = true
            }
        )
        client.disconnect()
    }
}
```

---

## 4. MQTT 5.0 - nowe funkcje protokołu

MQTT 5.0 (wydany w 2019 r.) wprowadza szereg ulepszeń względem wersji 3.1.1, poprawiając diagnostykę, bezpieczeństwo i skalowalność.

### Właściwości użytkownika (User Properties)

```kotlin
// MQTT 5.0 - dodawanie własnych nagłówków do wiadomości
// Wymaga biblioteki HiveMQ MQTT Client
val message = Mqtt5Publish.builder()
    .topic("sensors/temperature")
    .payload("23.5".toByteArray())
    .userProperties()
        .add("device-model", Build.MODEL)
        .add("firmware-version", "2.1.0")
        .add("location", "salon")
    .applyUserProperties()
    .build()

client.publish(message)
```

### Wygasanie wiadomości (Message Expiry Interval)

```kotlin
// Wiadomość automatycznie wygasa po 60 sekundach
val alertMessage = Mqtt5Publish.builder()
    .topic("alerts/fire_alarm")
    .payload("""{"zone":"kitchen","level":"critical"}""".toByteArray())
    .messageExpiryInterval(60)  // sekundy - broker odrzuci po 60s
    .qos(MqttQos.EXACTLY_ONCE)
    .build()
```

### Shared Subscriptions - równoważenie obciążenia

Shared subscriptions pozwalają wielu klientom subskrybować ten sam temat w trybie round-robin, co umożliwia poziome skalowanie konsumentów.

```kotlin
// Format: $share/{group}/{topic}
// Każda wiadomość trafi tylko do jednego z klientów w grupie
client.subscribeWith()
    .topicFilter("\$share/processors/sensors/#")
    .qos(MqttQos.AT_LEAST_ONCE)
    .callback { publish ->
        processSensorData(String(publish.payloadAsBytes))
    }
    .send()
```

### Reason Codes i ulepszona diagnostyka

```kotlin
// MQTT 5.0 zwraca szczegółowe kody błędów przy rozłączeniu
client.disconnectedWith()
    .addOnDisconnectedListener { context ->
        val reasonCode = context.cause.mqttMessage
            ?.let { (it as? Mqtt5Disconnect)?.reasonCode }
        when (reasonCode) {
            Mqtt5DisconnectReasonCode.SESSION_TAKEN_OVER ->
                Log.w("MQTT", "Inne urządzenie przejęło sesję")
            Mqtt5DisconnectReasonCode.KEEP_ALIVE_TIMEOUT ->
                Log.w("MQTT", "Timeout - sprawdź połączenie sieciowe")
            else ->
                Log.e("MQTT", "Rozłączono: $reasonCode")
        }
    }
```

---

## 5. Porównanie brokerów MQTT

Wybór brokera zależy od skali projektu, wymagań bezpieczeństwa i infrastruktury.

| Broker | Typ | Limity (darmowy) | Protokoły | Zastosowanie |
|--------|-----|------------------|-----------|--------------|
| **Mosquitto** | Open-source, self-hosted | Brak (zasoby maszyny) | MQTT 3.1.1, 5.0 | Projekty studenckie, smart home, prototypy |
| **HiveMQ CE** | Open-source, self-hosted | Do 25 połączeń (Cloud) | MQTT 3.1.1, 5.0, WebSocket | Produkcja IoT, rozbudowane ekosystemy |
| **EMQX** | Open-source, self-hosted | Do 10 000 połączeń | MQTT, CoAP, LwM2M, WebSocket | Skalowane wdrożenia przemysłowe |
| **AWS IoT Core** | Managed cloud | Pay-per-use | MQTT, HTTP, WebSocket | Integracja z AWS Lambda, S3, DynamoDB |
| **broker.hivemq.com** | Publiczny testowy | Brak uwierzytelniania | MQTT 3.1.1 | Testy i nauka - **nie do produkcji** |

### Mosquitto - szybki start

```bash
# Instalacja na Raspberry Pi / Ubuntu
sudo apt install mosquitto mosquitto-clients

# Konfiguracja /etc/mosquitto/mosquitto.conf
listener 1883
allow_anonymous false
password_file /etc/mosquitto/passwd

# TLS
listener 8883
cafile /etc/mosquitto/certs/ca.crt
certfile /etc/mosquitto/certs/server.crt
keyfile /etc/mosquitto/certs/server.key

# Dodanie użytkownika
sudo mosquitto_passwd -c /etc/mosquitto/passwd student
```

### HiveMQ - rozszerzenia przez wtyczki

HiveMQ wyróżnia się systemem wtyczek (Extensions SDK) umożliwiającym integrację z bazami danych, systemami autoryzacji (OAuth 2.0, LDAP) i potokami przetwarzania danych bez modyfikacji kodu brokera.

### AWS IoT Core - integracja z chmurą

```kotlin
// Połączenie z AWS IoT Core przez Paho + X.509 certyfikat
val options = MqttConnectOptions().apply {
    socketFactory = awsIotSslFactory(
        keystoreFile = "aws_iot_cert.bks",
        keystorePassword = BuildConfig.AWS_KEYSTORE_PASS
    )
}
val client = MqttAndroidClient(context, "ssl://<id>.iot.eu-west-1.amazonaws.com:8883", clientId)
```

---

## 6. Klient MQTT na iOS - Swift

Dla aplikacji iOS dostępne są dwie popularne biblioteki: **CocoaMQTT** (dojrzała, Objective-C/Swift) oraz **MQTT-NIO** (nowoczesna, async/await, SwiftNIO).

### CocoaMQTT - podstawowa integracja

```swift
import CocoaMQTT

class MQTTService: ObservableObject {
    private var mqtt: CocoaMQTT?
    @Published var isConnected = false
    @Published var lastMessage: String = ""

    func connect(host: String = "broker.hivemq.com", port: UInt16 = 1883) {
        let clientID = "ios_\(UIDevice.current.name)_\(Int.random(in: 1000...9999))"
        mqtt = CocoaMQTT(clientID: clientID, host: host, port: port)

        mqtt?.delegate = self
        mqtt?.autoReconnect = true
        mqtt?.keepAlive = 60

        // Last Will Testament
        mqtt?.willMessage = CocoaMQTTMessage(
            topic: "devices/\(clientID)/status",
            string: "offline",
            qos: .qos1,
            retained: true
        )

        mqtt?.connect()
    }

    func subscribe(topic: String, qos: CocoaMQTTQoS = .qos1) {
        mqtt?.subscribe(topic, qos: qos)
    }

    func publish(topic: String, message: String, retained: Bool = false) {
        mqtt?.publish(
            CocoaMQTTMessage(topic: topic, string: message, retained: retained)
        )
    }

    func disconnect() {
        mqtt?.publish(
            CocoaMQTTMessage(
                topic: "devices/\(mqtt?.clientID ?? "")/status",
                string: "offline",
                qos: .qos1,
                retained: true
            )
        )
        mqtt?.disconnect()
    }
}

extension MQTTService: CocoaMQTTDelegate {
    func mqtt(_ mqtt: CocoaMQTT, didConnectAck ack: CocoaMQTTConnAck) {
        isConnected = (ack == .accept)
        if isConnected {
            mqtt.publish(CocoaMQTTMessage(
                topic: "devices/\(mqtt.clientID)/status",
                string: "online", qos: .qos1, retained: true
            ))
        }
    }

    func mqtt(_ mqtt: CocoaMQTT, didReceiveMessage message: CocoaMQTTMessage, id: UInt16) {
        DispatchQueue.main.async {
            self.lastMessage = "[\(message.topic)] \(message.string ?? "")"
        }
    }

    func mqtt(_ mqtt: CocoaMQTT, didSubscribeTopics success: NSDictionary, failed: [String]) { }
    func mqttDidDisconnect(_ mqtt: CocoaMQTT, withError err: Error?) {
        DispatchQueue.main.async { self.isConnected = false }
    }
    func mqtt(_ mqtt: CocoaMQTT, didPublishMessage message: CocoaMQTTMessage, id: UInt16) { }
    func mqtt(_ mqtt: CocoaMQTT, didPublishAck id: UInt16) { }
    func mqttDidPing(_ mqtt: CocoaMQTT) { }
    func mqttDidReceivePong(_ mqtt: CocoaMQTT) { }
}
```

### Widok SwiftUI z danymi z MQTT

```swift
struct SensorDashboardView: View {
    @StateObject private var mqttService = MQTTService()
    @State private var temperatures: [String: Double] = [:]

    var body: some View {
        NavigationStack {
            List(temperatures.sorted(by: { $0.key < $1.key }), id: \.key) { room, temp in
                HStack {
                    Label(room, systemImage: "thermometer")
                    Spacer()
                    Text(String(format: "%.1f °C", temp))
                        .foregroundStyle(temp > 25 ? .red : .primary)
                }
            }
            .navigationTitle("Czujniki temperatury")
            .toolbar {
                ToolbarItem {
                    Image(systemName: mqttService.isConnected ? "wifi" : "wifi.slash")
                        .foregroundStyle(mqttService.isConnected ? .green : .red)
                }
            }
        }
        .onAppear {
            mqttService.connect()
            mqttService.subscribe(topic: "home/+/temperature")
        }
        .onReceive(mqttService.$lastMessage) { msg in
            // Parsowanie "home/salon/temperature" → klucz "salon"
            let parts = msg.split(separator: "]")
            guard parts.count == 2,
                  let topicPart = parts.first?.dropFirst(),
                  let valuePart = Double(parts.last?.trimmingCharacters(in: .whitespaces) ?? "")
            else { return }
            let room = String(topicPart).split(separator: "/").dropFirst().first.map(String.init) ?? "?"
            temperatures[room] = valuePart
        }
    }
}
```

**Zależności (Package.swift lub SPM w Xcode):**

```swift
// Swift Package Manager
.package(url: "https://github.com/emqx/CocoaMQTT.git", from: "2.1.0")
// lub nowoczesna alternatywa z async/await:
.package(url: "https://github.com/swift-server-community/mqtt-nio.git", from: "2.0.0")
```

---

## Linki końcowe

- [Specyfikacja MQTT 5.0 - OASIS](https://docs.oasis-open.org/mqtt/mqtt/v5.0/mqtt-v5.0.html)
- [CocoaMQTT - GitHub](https://github.com/emqx/CocoaMQTT)
- [MQTT-NIO - Swift Server](https://github.com/swift-server-community/mqtt-nio)
- [HiveMQ MQTT Client (Android)](https://github.com/hivemq/hivemq-mqtt-client-android)
- [EMQX - dokumentacja](https://www.emqx.io/docs/en/latest/)
