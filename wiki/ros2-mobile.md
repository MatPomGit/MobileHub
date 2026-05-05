# ROS2 i sterowanie robotem z aplikacji mobilnej

ROS2 (Robot Operating System 2) to standard middleware w robotyce. Aplikacja mobilna może komunikować się z robotem przez rosbridge WebSocket lub natywne biblioteki ROS2.

## rosbridge - WebSocket do ROS2

```kotlin
// Klasa do komunikacji z ROS2 przez rosbridge_suite
class Ros2Bridge(private val serverUrl: String) {
    private val gson = Gson()
    private val client = OkHttpClient.Builder()
        .pingInterval(10, TimeUnit.SECONDS)
        .build()
    private var webSocket: WebSocket? = null

    private val topicCallbacks = ConcurrentHashMap<String, (JsonObject) -> Unit>()

    fun connect(onConnected: () -> Unit, onDisconnected: () -> Unit) {
        val request = Request.Builder().url(serverUrl).build()
        webSocket = client.newWebSocket(request, object : WebSocketListener() {
            override fun onOpen(ws: WebSocket, response: Response) = onConnected()
            override fun onMessage(ws: WebSocket, text: String) = handleMessage(text)
            override fun onClosed(ws: WebSocket, code: Int, reason: String) = onDisconnected()
            override fun onFailure(ws: WebSocket, t: Throwable, r: Response?) = onDisconnected()
        })
    }

    fun publishTwist(topic: String, linearX: Double, angularZ: Double) {
        val msg = mapOf(
            "op" to "publish",
            "topic" to topic,
            "msg" to mapOf(
                "linear" to mapOf("x" to linearX, "y" to 0.0, "z" to 0.0),
                "angular" to mapOf("x" to 0.0, "y" to 0.0, "z" to angularZ)
            )
        )
        webSocket?.send(gson.toJson(msg))
    }

    fun subscribe(topic: String, msgType: String, callback: (JsonObject) -> Unit) {
        topicCallbacks[topic] = callback
        val msg = mapOf("op" to "subscribe", "topic" to topic, "type" to msgType)
        webSocket?.send(gson.toJson(msg))
    }

    fun callService(service: String, request: Map<String, Any>, callback: (JsonObject) -> Unit) {
        val id = "service_${System.currentTimeMillis()}"
        val msg = mapOf("op" to "call_service", "id" to id, "service" to service, "args" to request)
        webSocket?.send(gson.toJson(msg))
    }

    private fun handleMessage(text: String) {
        val json = JsonParser.parseString(text).asJsonObject
        val topic = json["topic"]?.asString ?: return
        topicCallbacks[topic]?.invoke(json["msg"]?.asJsonObject ?: return)
    }
}
```

## Wizualizacja danych odometrii

```kotlin
@Composable
fun OdometryDisplay(odom: OdometryData) {
    Column(modifier = Modifier.padding(16.dp)) {
        Text("Pozycja robota", style = MaterialTheme.typography.titleMedium)

        Row(horizontalArrangement = Arrangement.spacedBy(16.dp)) {
            OdomValue("X", odom.posX, "m")
            OdomValue("Y", odom.posY, "m")
            OdomValue("θ", Math.toDegrees(odom.yaw), "°")
        }

        Spacer(Modifier.height(12.dp))
        Text("Prędkości", style = MaterialTheme.typography.titleMedium)

        Row(horizontalArrangement = Arrangement.spacedBy(16.dp)) {
            OdomValue("v", odom.linearVel, "m/s")
            OdomValue("ω", odom.angularVel, "rad/s")
        }
    }
}

@Composable
fun OdomValue(label: String, value: Double, unit: String) {
    Card {
        Column(
            modifier = Modifier.padding(12.dp),
            horizontalAlignment = Alignment.CenterHorizontally
        ) {
            Text(label, style = MaterialTheme.typography.labelSmall)
            Text(
                "%.3f".format(value),
                style = MaterialTheme.typography.bodyLarge,
                fontWeight = FontWeight.Bold
            )
            Text(unit, style = MaterialTheme.typography.labelSmall)
        }
    }
}
```

## Nav2 - wysyłanie celów nawigacji

```kotlin
class Nav2Controller(private val bridge: Ros2Bridge) {

    // Wyślij cel nawigacyjny do Nav2
    fun navigateToGoal(x: Double, y: Double, yaw: Double = 0.0) {
        val q = yawToQuaternion(yaw)
        bridge.publishToActionServer(
            server = "/navigate_to_pose",
            goal = mapOf(
                "pose" to mapOf(
                    "header" to mapOf("frame_id" to "map"),
                    "pose" to mapOf(
                        "position" to mapOf("x" to x, "y" to y, "z" to 0.0),
                        "orientation" to mapOf("x" to q[0], "y" to q[1], "z" to q[2], "w" to q[3])
                    )
                )
            )
        )
    }

    fun cancelGoal() = bridge.callService("/navigate_to_pose/_action/cancel_goal", emptyMap()) {}

    private fun yawToQuaternion(yaw: Double) = doubleArrayOf(
        0.0, 0.0, sin(yaw / 2), cos(yaw / 2)
    )
}
```

## Architektura komunikacji ROS2 z aplikacją mobilną

Aplikacja mobilna nie może bezpośrednio używać bibliotek `rclpy` ani `rclcpp`, ponieważ działają one na systemie Linux robota, a nie na Androidzie czy iOS. Istnieją trzy główne podejścia do komunikacji:

| Podejście | Protokół | Środowisko | Zastosowanie |
|-----------|----------|------------|--------------|
| **rosbridge_suite** | WebSocket + JSON | Dowolna platforma z WebSocket | Aplikacje mobilne, webowe, prototypy |
| **rclnodejs** | DDS (natywne ROS2) | Node.js (backend/serwer pośredniczący) | Serwery middleware, Electron |
| **micro-ROS** | DDS over Serial/UDP | Mikrokontrolery (ESP32, STM32) | Wbudowane węzły na robotach |

**rosbridge_suite** jest de facto standardem dla aplikacji mobilnych. Serwer `rosbridge_server` uruchamiany na robocie eksponuje WebSocket na porcie 9090. Każda wiadomość to JSON z polami `op` (np. `subscribe`, `publish`, `call_service`) oraz `topic`/`msg`. Protokół jest lekki i nie wymaga żadnych natywnych bibliotek ROS po stronie klienta.

```
┌─────────────────┐         WebSocket (JSON)        ┌─────────────────────┐
│  Aplikacja      │ ◄──────────────────────────────► │  rosbridge_server   │
│  mobilna        │         port 9090                │  (robot / ROS2 PC)  │
│  (Android/iOS)  │                                  │                     │
└─────────────────┘                                  │  /chatter topic     │
                                                     │  /cmd_vel topic     │
                                                     │  /navigate_to_pose  │
                                                     └─────────────────────┘
```

**rclnodejs** uruchamia się jako serwer Node.js i może rozmawiać z ROS2 przez natywne DDS, a z aplikacją mobilną przez REST lub Socket.IO. Jest użyteczny gdy potrzebna jest logika pośrednicząca (agregacja, transformacja danych) lub gdy aplikacja mobilna wymaga HTTP zamiast WebSocket.

**micro-ROS** działa bezpośrednio na mikrokontrolerze (np. ESP32 na robocie) i komunikuje się z ROS2 PC przez serial lub UDP. Nie jest interfejsem dla aplikacji mobilnych - jest węzłem ROS2 na urządzeniu embedded.

## Konfiguracja rosbridge na robocie

Zanim aplikacja mobilna połączy się z robotem, należy uruchomić `rosbridge_server` i upewnić się, że sieć jest skonfigurowana poprawnie.

```bash
# Instalacja rosbridge_suite (ROS2 Humble)
sudo apt install ros-humble-rosbridge-suite

# Uruchomienie serwera (domyślny port 9090)
ros2 launch rosbridge_server rosbridge_websocket_launch.xml
```

Poniższy plik launch pozwala skonfigurować port, SSL i inne parametry:

```python
# ros2_ws/src/my_robot/launch/rosbridge.launch.py
from launch import LaunchDescription
from launch_ros.actions import Node

def generate_launch_description():
    return LaunchDescription([
        Node(
            package='rosbridge_server',
            executable='rosbridge_websocket',
            name='rosbridge_websocket',
            parameters=[{
                'port': 9090,
                'address': '0.0.0.0',          # nasłuchuje na wszystkich interfejsach
                'ssl': False,                   # True gdy używasz TLS
                # 'certfile': '/path/to/cert.pem',
                # 'keyfile': '/path/to/key.pem',
                'authenticate': False,          # True + 'secret' gdy włączone tokeny
                # 'secret': 'my_secret_token',
                'max_message_size': 10_000_000, # 10 MB - potrzebne dla map OccupancyGrid
                'unregister_timeout': 10.0,
            }],
        )
    ])
```

### Konfiguracja sieciowa

Robot i telefon muszą być w tej samej sieci WiFi lub połączone przez hotspot. Sprawdź adres IP robota:

```bash
# Na robocie
hostname -I           # np. 192.168.1.105
ip addr show wlan0    # szczegóły interfejsu WiFi

# Test połączenia z telefonu (np. przez Termux lub w logach aplikacji)
# WebSocket URL: ws://192.168.1.105:9090
```

### Bezpieczeństwo połączenia

W sieci produkcyjnej (np. robot w hali fabrycznej) należy włączyć TLS i uwierzytelnianie:

```kotlin
// Włącz uwierzytelnianie tokenem - klient musi wysłać:
// {"op": "auth", "mac": "", "client": "", "dest": "", "rand": "", "t": 0, "level": "", "end": 0}
// Przed subskrypcją/publikacją

// W aplikacji Kotlin - dodanie tokenu autoryzacyjnego
val authMessage = JSONObject().apply {
    put("op", "auth")
    put("secret", "my_secret_token")
    put("t", System.currentTimeMillis() / 1000)
}
webSocket.send(authMessage.toString())
```

Dla środowisk o podwyższonych wymaganiach bezpieczeństwa (szpitale, zakłady przemysłowe) rozważ tunelowanie przez VPN (WireGuard) zamiast bezpośredniego wystawiania portu 9090 na sieć.

## Linki

- [ROS2 Documentation](https://docs.ros.org/en/humble/)
- [rosbridge_suite](https://github.com/RobotWebTools/rosbridge_suite)
- [Nav2 - Navigation Stack](https://nav2.ros.org/)

## Mapa 2D z pozycją robota

```kotlin
@Composable
fun RobotMapView(
    occupancyGrid: OccupancyGrid?,
    robotPose: RobotPose?,
    waypoints: List<Waypoint>,
    onMapTap: (Float, Float) -> Unit
) {
    var scale by remember { mutableFloatStateOf(1f) }
    var offset by remember { mutableStateOf(Offset.Zero) }

    Canvas(
        modifier = Modifier
            .fillMaxSize()
            .pointerInput(Unit) {
                detectTransformGestures { _, pan, zoom, _ ->
                    scale = (scale * zoom).coerceIn(0.5f, 5f)
                    offset += pan
                }
            }
            .pointerInput(Unit) {
                detectTapGestures { tapOffset ->
                    // Przelicz piksele UI → współrzędne mapy
                    val mapX = (tapOffset.x - offset.x) / scale / (occupancyGrid?.resolution ?: 1f)
                    val mapY = (tapOffset.y - offset.y) / scale / (occupancyGrid?.resolution ?: 1f)
                    onMapTap(mapX, mapY)
                }
            }
    ) {
        val canvasWidth = size.width
        val canvasHeight = size.height

        // Rysuj mapę zajętości (occupancy grid)
        occupancyGrid?.let { grid ->
            val cellSize = (canvasWidth / grid.width) * scale
            for (row in 0 until grid.height) {
                for (col in 0 until grid.width) {
                    val value = grid.data[row * grid.width + col]
                    val color = when {
                        value < 0   -> Color.Gray.copy(alpha = 0.3f)   // nieznane
                        value == 0  -> Color.White                       // wolne
                        else        -> Color.Black                       // zajęte
                    }
                    drawRect(
                        color = color,
                        topLeft = Offset(col * cellSize + offset.x, row * cellSize + offset.y),
                        size = Size(cellSize, cellSize)
                    )
                }
            }
        }

        // Rysuj waypoints
        waypoints.forEach { wp ->
            val px = wp.x * scale + offset.x
            val py = wp.y * scale + offset.y
            drawCircle(Color(0xFF4CAF50), radius = 8f, center = Offset(px, py))
        }

        // Rysuj robota jako trójkąt (wskazuje kierunek)
        robotPose?.let { pose ->
            val rx = pose.x * scale + offset.x
            val ry = pose.y * scale + offset.y
            val arrowPath = Path().apply {
                moveTo(rx + 15 * cos(pose.yaw.toFloat()), ry + 15 * sin(pose.yaw.toFloat()))
                lineTo(rx + 8 * cos((pose.yaw + 2.5).toFloat()), ry + 8 * sin((pose.yaw + 2.5).toFloat()))
                lineTo(rx + 8 * cos((pose.yaw - 2.5).toFloat()), ry + 8 * sin((pose.yaw - 2.5).toFloat()))
                close()
            }
            drawPath(arrowPath, Color(0xFF2196F3))
        }
    }
}
```

## Subskrypcja LaserScan - mapa lidar

```kotlin
class LidarVisualizer(private val bridge: Ros2Bridge) {

    val scanPoints = mutableStateListOf<Offset>()

    init {
        bridge.subscribe("/scan", "sensor_msgs/LaserScan") { msg ->
            val angleMin = msg["angle_min"].asFloat
            val angleIncrement = msg["angle_increment"].asFloat
            val ranges = msg["ranges"].asJsonArray

            val newPoints = mutableListOf<Offset>()
            ranges.forEachIndexed { i, range ->
                val r = range.asFloat
                if (r.isFinite() && r > 0.1f && r < 10f) {
                    val angle = angleMin + i * angleIncrement
                    newPoints.add(
                        Offset(r * cos(angle) * SCALE, r * sin(angle) * SCALE)
                    )
                }
            }

            scanPoints.clear()
            scanPoints.addAll(newPoints)
        }
    }

    companion object { const val SCALE = 50f }  // px na metr
}
```

## Diagnostyka i logi ROS2

```kotlin
// Subskrypcja /rosout - logi ze wszystkich węzłów
bridge.subscribe("/rosout", "rcl_interfaces/Log") { msg ->
    val level = msg["level"].asInt
    val name = msg["name"].asString
    val text = msg["msg"].asString

    val severity = when (level) {
        10 -> "DEBUG"
        20 -> "INFO"
        30 -> "WARN"
        40 -> "ERROR"
        50 -> "FATAL"
        else -> "UNKNOWN"
    }

    logBuffer.add(RosLog(System.currentTimeMillis(), severity, name, text))
}

// Widok logów
@Composable
fun RosLogView(logs: List<RosLog>) {
    LazyColumn {
        items(logs.reversed()) { log ->
            val color = when (log.severity) {
                "ERROR", "FATAL" -> Color(0xFFEF5350)
                "WARN"  -> Color(0xFFFFA726)
                "DEBUG" -> Color(0xFF78909C)
                else    -> Color(0xFF4CAF50)
            }
            Row(modifier = Modifier.padding(horizontal = 12.dp, vertical = 2.dp)) {
                Text(
                    "[${log.severity}]",
                    color = color,
                    style = MaterialTheme.typography.labelSmall,
                    fontFamily = FontFamily.Monospace,
                    modifier = Modifier.width(60.dp)
                )
                Text(
                    "[${log.nodeName}] ${log.message}",
                    style = MaterialTheme.typography.labelSmall,
                    fontFamily = FontFamily.Monospace,
                    maxLines = 2
                )
            }
        }
    }
}
```

## Linki dodatkowe

- [Nav2 Simple Commander](https://nav2.ros.org/commander_api/index.html)
- [ROS2 Messages](https://github.com/ros2/common_interfaces)
- [Foxglove Studio - ROS2 visualization](https://foxglove.dev)

## Bezpieczeństwo i autoryzacja - ROS2 Security

ROS2 obsługuje DDS Security (standardem OMG), który zapewnia szyfrowanie, uwierzytelnianie i autoryzację komunikacji między węzłami. Dla połączeń mobilnych przez publiczną sieć WiFi jest to kluczowe.

### SROS2 - konfiguracja bezpieczeństwa

```bash
# Tworzenie kluczy i certyfikatów dla węzłów
ros2 security create_keystore /path/to/keystore
ros2 security create_key /path/to/keystore /rosbridge_server
ros2 security create_key /path/to/keystore /robot_controller

# Uruchomienie rosbridge z zabezpieczeniami
ros2 launch rosbridge_server rosbridge_websocket_launch.xml \
  ssl:=true \
  certfile:=/path/to/cert.pem \
  keyfile:=/path/to/key.pem \
  port:=9090
```

### Uwierzytelnianie tokenem w aplikacji mobilnej

```kotlin
class SecureRosBridge(
    private val serverUrl: String,
    private val authToken: String
) {
    private val client = OkHttpClient.Builder()
        .pingInterval(10, TimeUnit.SECONDS)
        .addInterceptor { chain ->
            val request = chain.request().newBuilder()
                .addHeader("Authorization", "Bearer $authToken")
                .build()
            chain.proceed(request)
        }
        .build()

    fun connect(onConnected: () -> Unit, onError: (String) -> Unit) {
        val request = Request.Builder()
            .url(serverUrl)  // wss:// dla TLS
            .build()
        
        client.newWebSocket(request, object : WebSocketListener() {
            override fun onOpen(ws: WebSocket, response: Response) = onConnected()
            override fun onFailure(ws: WebSocket, t: Throwable, r: Response?) = 
                onError(t.message ?: "Błąd połączenia")
        })
    }
}
```

### Monitorowanie przepustowości i QoS

ROS2 DDS umożliwia konfigurację Quality of Service (QoS) - ważne przy połączeniu WiFi z ograniczoną przepustowością:

```kotlin
// Polityka QoS przez rosbridge - ustawiana po stronie ROS2
// W aplikacji mobilnej możesz ograniczyć częstotliwość subskrypcji:
fun subscribeWithThrottle(
    topic: String, 
    msgType: String, 
    throttleMs: Int,
    callback: (JsonObject) -> Unit
) {
    val msg = mapOf(
        "op" to "subscribe",
        "topic" to topic,
        "type" to msgType,
        "throttle_rate" to throttleMs,  // ms między wiadomościami
        "queue_length" to 1             // tylko najnowsza wiadomość
    )
    webSocket?.send(gson.toJson(msg))
    topicCallbacks[topic] = callback
}
```

Typowe ustawienia dla połączeń mobilnych:
- `/camera/image_compressed`: throttle 200ms (5 fps)
- `/scan` (LiDAR): throttle 100ms (10 fps)
- `/odom`: throttle 50ms (20 fps)
- `/cmd_vel`: bez throttle (pełna responsywność)
