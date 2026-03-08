# Programowanie Autonomicznych Robotów

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
