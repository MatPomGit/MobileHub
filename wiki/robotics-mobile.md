# Programowanie autonomicznych robotów

Aplikacje mobilne pełnią kluczową rolę w ekosystemie robotyki: jako interfejsy sterowania, narzędzia do wizualizacji, portale do monitorowania floty robotów lub platformy do trenowania modeli AI on-device. Smartfon może też sam być "mózgiem" małego robota mobilnego.

## Aplikacja mobilna jako kontroler robota

### Architektura komunikacji

```
┌─────────────────────────────────────────────┐
│            Smartfon (operator)               │
│   ┌──────────────────────────────────────┐  │
│   │  Aplikacja kontrolna                  │  │
│   │  ┌─────────┐  ┌──────────────────┐  │  │
│   │  │ Joystick│  │ Camera stream    │  │  │
│   │  │  UI     │  │ (telemetria)     │  │  │
│   │  └────┬────┘  └────────▲─────────┘  │  │
│   └────────┼───────────────┼────────────┘  │
└────────────┼───────────────┼───────────────┘
             │ WebSocket      │ RTSP/WebRTC
             ▼               │
┌─────────────────────────────────────────────┐
│              Robot (ROS2)                    │
│   /cmd_vel ← Navigation Stack               │
│   /camera  → Image topics                   │
│   /odom    → Odometry                       │
│   /scan    → LiDAR                          │
└─────────────────────────────────────────────┘
```

### Interfejs joysticka w Compose

```kotlin
@Composable
fun VirtualJoystick(
    onVelocityChanged: (linearX: Float, angularZ: Float) -> Unit
) {
    var thumbPosition by remember { mutableStateOf(Offset.Zero) }
    val stickRadius = 80.dp
    val baseRadius = 120.dp
    
    Box(
        modifier = Modifier
            .size(baseRadius * 2)
            .clip(CircleShape)
            .background(Color.Black.copy(alpha = 0.3f))
            .pointerInput(Unit) {
                detectDragGestures(
                    onDragEnd = {
                        thumbPosition = Offset.Zero
                        onVelocityChanged(0f, 0f)
                    }
                ) { change, _ ->
                    val maxOffset = baseRadius.toPx() - stickRadius.toPx()
                    val rawOffset = change.position - Offset(size.width / 2f, size.height / 2f)
                    val clampedOffset = if (rawOffset.getDistance() > maxOffset) {
                        rawOffset / rawOffset.getDistance() * maxOffset
                    } else rawOffset
                    
                    thumbPosition = clampedOffset
                    
                    // Y = liniowy (do przodu/tyłu), X = obrót
                    val linearX = -clampedOffset.y / maxOffset  // forward/backward
                    val angularZ = -clampedOffset.x / maxOffset  // left/right
                    
                    onVelocityChanged(linearX, angularZ)
                }
            },
        contentAlignment = Alignment.Center
    ) {
        // Kciuk joysticka
        Box(
            modifier = Modifier
                .offset { IntOffset(thumbPosition.x.roundToInt(), thumbPosition.y.roundToInt()) }
                .size(stickRadius * 2)
                .clip(CircleShape)
                .background(Color.White.copy(alpha = 0.8f))
        )
    }
}
```

### ROS2 Bridge — komunikacja z robotem

```kotlin
// rosbridge_suite WebSocket API
class RosBridge(private val url: String) {
    private val client = OkHttpClient()
    private var ws: WebSocket? = null
    private val gson = Gson()
    
    fun connect(onConnected: () -> Unit) {
        val request = Request.Builder().url(url).build()
        ws = client.newWebSocket(request, object : WebSocketListener() {
            override fun onOpen(webSocket: WebSocket, response: Response) {
                onConnected()
            }
            override fun onMessage(webSocket: WebSocket, text: String) {
                handleMessage(text)
            }
        })
    }
    
    fun publishCmdVel(linearX: Float, angularZ: Float) {
        val msg = mapOf(
            "op" to "publish",
            "topic" to "/cmd_vel",
            "msg" to mapOf(
                "linear" to mapOf("x" to linearX, "y" to 0.0, "z" to 0.0),
                "angular" to mapOf("x" to 0.0, "y" to 0.0, "z" to angularZ)
            )
        )
        ws?.send(gson.toJson(msg))
    }
    
    fun subscribe(topic: String, type: String, callback: (JsonObject) -> Unit) {
        val msg = mapOf(
            "op" to "subscribe",
            "topic" to topic,
            "type" to type
        )
        ws?.send(gson.toJson(msg))
        subscribers[topic] = callback
    }
    
    private val subscribers = mutableMapOf<String, (JsonObject) -> Unit>()
    
    private fun handleMessage(text: String) {
        val json = JsonParser.parseString(text).asJsonObject
        val topic = json["topic"]?.asString ?: return
        subscribers[topic]?.invoke(json["msg"]?.asJsonObject ?: return)
    }
}
```

## Autonomiczna nawigacja — podstawy

### ROS2 Nav2 — stack nawigacyjny

Nav2 to główny stack nawigacyjny ROS2. Aplikacja mobilna może wysyłać cele nawigacyjne:

```kotlin
// Wysłanie celu nawigacji (ROS2 Nav2)
fun navigateToGoal(x: Double, y: Double, yaw: Double) {
    val goalMsg = mapOf(
        "op" to "publish",
        "topic" to "/goal_pose",
        "msg" to mapOf(
            "header" to mapOf(
                "frame_id" to "map",
                "stamp" to mapOf("sec" to System.currentTimeMillis() / 1000)
            ),
            "pose" to mapOf(
                "position" to mapOf("x" to x, "y" to y, "z" to 0.0),
                "orientation" to yawToQuaternion(yaw)
            )
        )
    )
    rosBridge.send(goalMsg)
}

private fun yawToQuaternion(yaw: Double): Map<String, Double> {
    val halfYaw = yaw / 2.0
    return mapOf("x" to 0.0, "y" to 0.0, "z" to sin(halfYaw), "w" to cos(halfYaw))
}
```

## Wizualizacja danych robotycznych

### Mapa 2D — OccupancyGrid

```kotlin
// Renderowanie mapy OccupancyGrid z /map topic
@Composable
fun RobotMap(
    occupancyGrid: OccupancyGrid,
    robotPose: Pose2D,
    onGoalSet: (Double, Double) -> Unit
) {
    Canvas(
        modifier = Modifier
            .fillMaxSize()
            .pointerInput(Unit) {
                detectTapGestures { offset ->
                    // Przelicz pixel → współrzędne mapy
                    val mapX = offset.x / scale + originX
                    val mapY = (height - offset.y) / scale + originY
                    onGoalSet(mapX, mapY)
                }
            }
    ) {
        // Rysuj mapę
        occupancyGrid.data.forEachIndexed { index, value ->
            val row = index / occupancyGrid.width
            val col = index % occupancyGrid.width
            
            val color = when {
                value == -1 -> Color.Gray.copy(alpha = 0.3f)  // nieznane
                value == 0 -> Color.White  // wolne
                value > 50 -> Color.Black  // zajęte
                else -> Color.Gray
            }
            
            drawRect(
                color = color,
                topLeft = Offset(col * cellSize, row * cellSize),
                size = Size(cellSize, cellSize)
            )
        }
        
        // Rysuj robota
        drawCircle(
            color = Color.Red,
            radius = 15f,
            center = Offset(robotPose.x * scale, robotPose.y * scale)
        )
    }
}
```

## Smartphone jako mózg robota

Smartfon można fizycznie zamontować na robocie — zapewnia CPU/GPU, WiFi/BLE, GPS, IMU i kamerę w jednym urządzeniu:

```kotlin
// Robot Patrol — autonomiczny patrol z kamerą
class PatrolRobot(
    private val motor: BluetoothMotorController,
    private val sensorManager: SensorManager
) {
    enum class State { IDLE, PATROLLING, OBSTACLE_DETECTED, TURNING }
    
    private var state = State.IDLE
    private val accelData = FloatArray(3)
    
    suspend fun startPatrol() {
        state = State.PATROLLING
        while (state != State.IDLE) {
            when (state) {
                State.PATROLLING -> {
                    motor.setVelocity(0.3f, 0f)  // jedź prosto
                    delay(100)
                    if (detectObstacle()) {
                        state = State.OBSTACLE_DETECTED
                    }
                }
                State.OBSTACLE_DETECTED -> {
                    motor.stop()
                    state = State.TURNING
                }
                State.TURNING -> {
                    // Obróć o 90° w prawo
                    motor.setVelocity(0f, 1.57f)
                    delay(1000)
                    state = State.PATROLLING
                }
                else -> {}
            }
        }
    }
    
    private fun detectObstacle(): Boolean {
        // Używaj akcelerometru do wykrycia zderzenia
        val magnitude = sqrt(
            accelData[0].pow(2) + accelData[1].pow(2) + accelData[2].pow(2)
        )
        return magnitude > 15f  // nagłe przyspieszenie = zderzenie
    }
}
```

## On-device AI dla robotyki

TensorFlow Lite pozwala uruchamiać modele ML bezpośrednio na smartfonie — bez internetu:

```kotlin
// Detekcja obiektów na kamerze (MobileNetV2 SSD)
class ObjectDetector(context: Context) {
    private val interpreter: Interpreter
    
    init {
        val modelBuffer = FileUtil.loadMappedFile(context, "mobilenet_ssd.tflite")
        interpreter = Interpreter(modelBuffer, Interpreter.Options().apply {
            addDelegate(NnApiDelegate())  // użyj NPU
            numThreads = 4
        })
    }
    
    fun detect(bitmap: Bitmap): List<Detection> {
        val inputArray = preprocess(bitmap)  // resize do 300x300, normalizacja
        val outputLocations = Array(1) { Array(10) { FloatArray(4) } }
        val outputClasses = Array(1) { FloatArray(10) }
        val outputScores = Array(1) { FloatArray(10) }
        val numDetections = FloatArray(1)
        
        interpreter.runForMultipleInputsOutputs(
            arrayOf(inputArray),
            mapOf(0 to outputLocations, 1 to outputClasses, 2 to outputScores, 3 to numDetections)
        )
        
        return (0 until numDetections[0].toInt())
            .filter { outputScores[0][it] > 0.5f }
            .map { i -> Detection(
                label = LABELS[outputClasses[0][i].toInt()],
                score = outputScores[0][i],
                boundingBox = outputLocations[0][i]
            )}
    }
}
```

## Linki

- [ROS2 Documentation](https://docs.ros.org/en/humble/)
- [rosbridge_suite](https://github.com/RobotWebTools/rosbridge_suite)
- [Nav2 — Navigation2](https://nav2.ros.org/)
- [TensorFlow Lite Android](https://www.tensorflow.org/lite/android)
- [OpenCV Android SDK](https://opencv.org/android/)

---

## Bluetooth Low Energy — sterowanie Arduino/ESP32

Wiele prostych robotów amatorskich używa mikrokontrolerów (Arduino Uno, ESP32) z modułem BLE zamiast pełnego stosu ROS. Android udostępnia kompletne API do komunikacji GATT.

### Skanowanie urządzeń BLE

```kotlin
class BleRobotScanner(context: Context) {
    private val bluetoothManager =
        context.getSystemService(Context.BLUETOOTH_SERVICE) as BluetoothManager
    private val scanner = bluetoothManager.adapter.bluetoothLeScanner

    private val scanCallback = object : ScanCallback() {
        override fun onScanResult(callbackType: Int, result: ScanResult) {
            if (result.device.name?.startsWith("RobotBLE") == true) {
                scanner.stopScan(this)
                connectToDevice(result.device)
            }
        }
    }

    fun startScan() {
        val filter = ScanFilter.Builder()
            .setServiceUuid(ParcelUuid.fromString(ROBOT_SERVICE_UUID))
            .build()
        val settings = ScanSettings.Builder()
            .setScanMode(ScanSettings.SCAN_MODE_LOW_LATENCY)
            .build()
        scanner.startScan(listOf(filter), settings, scanCallback)
    }
}
```

### Połączenie GATT i wysyłanie komend silniku

Po odkryciu urządzenia nawiązujemy połączenie GATT i piszemy do charakterystyki sterownika silników. Protokół jest prosty: jeden bajt kierunku + jeden bajt prędkości (0–255).

```kotlin
class RobotGattCallback(
    private val onConnected: (BluetoothGatt) -> Unit
) : BluetoothGattCallback() {

    override fun onConnectionStateChange(gatt: BluetoothGatt, status: Int, newState: Int) {
        if (newState == BluetoothProfile.STATE_CONNECTED) {
            gatt.discoverServices()
        }
    }

    override fun onServicesDiscovered(gatt: BluetoothGatt, status: Int) {
        if (status == BluetoothGatt.GATT_SUCCESS) onConnected(gatt)
    }
}

fun sendMotorCommand(gatt: BluetoothGatt, direction: Byte, speed: Byte) {
    val service = gatt.getService(UUID.fromString(ROBOT_SERVICE_UUID))
    val characteristic = service.getCharacteristic(UUID.fromString(MOTOR_CHAR_UUID))
    characteristic.value = byteArrayOf(direction, speed)
    characteristic.writeType = BluetoothGattCharacteristic.WRITE_TYPE_NO_RESPONSE
    gatt.writeCharacteristic(characteristic)
}

// Komendy kierunku
const val DIR_FORWARD: Byte  = 0x01
const val DIR_BACKWARD: Byte = 0x02
const val DIR_LEFT: Byte     = 0x03
const val DIR_RIGHT: Byte    = 0x04
const val DIR_STOP: Byte     = 0x00
```

### Podłączenie do wirtualnego joysticka (Compose)

```kotlin
@Composable
fun BleJoystick(gatt: BluetoothGatt?) {
    val scope = rememberCoroutineScope()
    JoystickControl(
        onDirectionChange = { dx, dy ->
            val direction = when {
                dy < -0.5f -> DIR_FORWARD
                dy >  0.5f -> DIR_BACKWARD
                dx < -0.5f -> DIR_LEFT
                dx >  0.5f -> DIR_RIGHT
                else        -> DIR_STOP
            }
            val speed = (maxOf(kotlin.math.abs(dx), kotlin.math.abs(dy)) * 255).toInt().toByte()
            gatt?.let { scope.launch(Dispatchers.IO) { sendMotorCommand(it, direction, speed) } }
        }
    )
}
```

Połączenie joysticka z sesją GATT zapewnia opóźnienie poniżej 20 ms, co jest wystarczające do płynnego sterowania.

---

## Przetwarzanie obrazu z kamery dla robotyki

Kamera smartfona może zastąpić dedykowany sensor w zadaniach takich jak śledzenie linii lub wykrywanie przeszkód. CameraX + TFLite zapewniają potok z niskim opóźnieniem.

### Konfiguracja ImageAnalysis w CameraX

```kotlin
val imageAnalysis = ImageAnalysis.Builder()
    .setTargetResolution(Size(640, 480))
    .setBackpressureStrategy(ImageAnalysis.STRATEGY_KEEP_ONLY_LATEST)
    .setOutputImageFormat(ImageAnalysis.OUTPUT_IMAGE_FORMAT_RGBA_8888)
    .build()

imageAnalysis.setAnalyzer(cameraExecutor) { imageProxy ->
    val bitmap = imageProxy.toBitmap()          // extension fun z CameraX 1.3+
    val result = lineFollower.analyze(bitmap)
    robotController.applyVisionCommand(result)
    imageProxy.close()
}
```

### Detektor linii — TFLite + ML Kit

```kotlin
class LineFollower(context: Context) {
    // Model wytrenowany na czarnej linii na białym tle (klasyfikacja: lewo/prosto/prawo/stop)
    private val interpreter = Interpreter(
        FileUtil.loadMappedFile(context, "line_follower.tflite"),
        Interpreter.Options().apply { addDelegate(GpuDelegate()) }
    )

    fun analyze(bitmap: Bitmap): DriveCommand {
        val input  = TensorImage.fromBitmap(bitmap)
        val output = TensorBuffer.createFixedSize(intArrayOf(1, 4), DataType.FLOAT32)
        interpreter.run(input.buffer, output.buffer)

        val scores = output.floatArray
        return when (scores.indices.maxByOrNull { scores[it] }) {
            0    -> DriveCommand.TURN_LEFT
            1    -> DriveCommand.STRAIGHT
            2    -> DriveCommand.TURN_RIGHT
            else -> DriveCommand.STOP
        }
    }
}

enum class DriveCommand { TURN_LEFT, STRAIGHT, TURN_RIGHT, STOP }
```

### Szacowanie głębi (MiDaS)

Dla zadań unikania przeszkód można użyć modelu MiDaS (monocular depth) dostępnego jako `.tflite`:

```kotlin
fun estimateDepth(bitmap: Bitmap): FloatArray {
    val resized = Bitmap.createScaledBitmap(bitmap, 256, 256, true)
    val input   = TensorImage.fromBitmap(resized)
    val output  = TensorBuffer.createFixedSize(intArrayOf(1, 256, 256, 1), DataType.FLOAT32)
    depthInterpreter.run(input.buffer, output.buffer)
    return output.floatArray   // mapa 256×256 znormalizowanych wartości głębi
}
```

Piksel o wartości bliskiej `1.0` oznacza obiekt blisko kamery. Wystarczy sprawdzić środkowy obszar mapy, by wykryć przeszkodę przed robotem i wydać komendę `STOP`.

## MQTT — alternatywa dla rosbridge

MQTT (Message Queuing Telemetry Transport) to lekki protokół publish-subscribe stosowany w IoT i robotyce tam, gdzie rosbridge wydaje się zbyt ciężki. Działa dobrze na słabych połączeniach i urządzeniach embedded.

```kotlin
dependencies {
    implementation("org.eclipse.paho:org.eclipse.paho.client.mqttv3:1.2.5")
    implementation("org.eclipse.paho:org.eclipse.paho.android.service:1.1.1")
}

class MqttRobotController(private val brokerUrl: String) {
    private lateinit var client: MqttClient

    fun connect(clientId: String = "mobile_app_${System.currentTimeMillis()}") {
        client = MqttClient(brokerUrl, clientId, MemoryPersistence())
        val options = MqttConnectOptions().apply {
            isCleanSession = true
            connectionTimeout = 10
            keepAliveInterval = 30
        }
        client.connect(options)
        
        // Subskrybuj dane z robota
        client.subscribe("robot/odom") { _, message ->
            val data = String(message.payload)
            // Parsuj JSON z odometrią
        }
        client.subscribe("robot/battery") { _, message ->
            val level = String(message.payload).toFloat()
            // Aktualizuj UI
        }
    }

    fun sendVelocity(linearX: Float, angularZ: Float) {
        val payload = """{"linear":{"x":$linearX},"angular":{"z":$angularZ}}"""
        client.publish("robot/cmd_vel", payload.toByteArray(), 0, false)
    }

    fun disconnect() = client.disconnect()
}
```

## Porównanie protokołów komunikacji z robotem

| Protokół | Latencja | Overhead | Złożoność | Przypadek użycia |
|-----------|---------|----------|-----------|-----------------|
| **rosbridge (WS)** | Niska | Średni (JSON) | Średnia | Pełna integracja ROS2 |
| **MQTT** | Bardzo niska | Minimalny | Niska | IoT, prosta robotyka |
| **gRPC** | Niska | Niski (protobuf) | Wysoka | Wysoka wydajność |
| **HTTP REST** | Wysoka | Średni | Niska | Komendy niezbyt czułe na czas |
| **Bluetooth LE** | Niska | Minimalny | Niska | Roboty lokalne, brak WiFi |
