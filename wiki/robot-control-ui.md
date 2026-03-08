# UI Sterowania Robotem

Aplikacja mobilna jako kontroler robota wymaga specyficznego podejścia do projektowania interfejsu — niskie opóźnienia, czytelność w ruchu, jednoznaczna informacja zwrotna i mechanizmy bezpieczeństwa.

## Wymagania dla interfejsów robotycznych

- **Latencja** — reakcja na gest powinna dotrzeć do robota w <100ms
- **Fail-safe** — utrata połączenia = natychmiastowe zatrzymanie ruchu
- **Feedback** — użytkownik musi wiedzieć czy robot odebrał komendę
- **Ergonomia** — sterowanie jedną ręką podczas trzymania urządzenia
- **Emergency Stop** — duży, zawsze dostępny przycisk zatrzymania

## Wirtualny joystick — implementacja

```kotlin
@Composable
fun VirtualJoystick(
    modifier: Modifier = Modifier,
    onJoystickMove: (x: Float, y: Float) -> Unit
) {
    val stickPosition = remember { mutableStateOf(Offset.Zero) }
    val joystickRadius = 80.dp
    val stickRadius = 30.dp

    Box(
        modifier = modifier
            .size(joystickRadius * 2)
            .background(
                Color.Gray.copy(alpha = 0.3f),
                CircleShape
            )
            .pointerInput(Unit) {
                detectDragGestures(
                    onDragEnd = {
                        // Powrót do centrum po puszczeniu
                        stickPosition.value = Offset.Zero
                        onJoystickMove(0f, 0f)
                    }
                ) { change, dragAmount ->
                    change.consume()
                    val maxRadius = size.width / 2f - stickRadius.toPx()
                    val newPos = stickPosition.value + dragAmount

                    // Ogranicz do okręgu
                    val distance = sqrt(newPos.x.pow(2) + newPos.y.pow(2))
                    stickPosition.value = if (distance > maxRadius) {
                        newPos * (maxRadius / distance)
                    } else newPos

                    // Normalizuj do [-1, 1]
                    onJoystickMove(
                        (stickPosition.value.x / maxRadius).coerceIn(-1f, 1f),
                        -(stickPosition.value.y / maxRadius).coerceIn(-1f, 1f) // Y odwrócone
                    )
                }
            },
        contentAlignment = Alignment.Center
    ) {
        // Stick
        Box(
            modifier = Modifier
                .size(stickRadius * 2)
                .offset { IntOffset(stickPosition.value.x.roundToInt(), stickPosition.value.y.roundToInt()) }
                .background(Color.White.copy(alpha = 0.8f), CircleShape)
        )
    }
}
```

## Emergency Stop — przycisk zatrzymania

```kotlin
@Composable
fun EmergencyStopButton(onStop: () -> Unit) {
    var isPressed by remember { mutableStateOf(false) }
    val scale by animateFloatAsState(if (isPressed) 0.9f else 1f)

    Box(
        modifier = Modifier
            .size(80.dp)
            .scale(scale)
            .background(
                Brush.radialGradient(
                    listOf(Color(0xFFFF4444), Color(0xFFCC0000))
                ),
                CircleShape
            )
            .border(3.dp, Color.White.copy(0.6f), CircleShape)
            .pointerInput(Unit) {
                detectTapGestures(
                    onPress = {
                        isPressed = true
                        tryAwaitRelease()
                        isPressed = false
                    },
                    onTap = { onStop() }
                )
            },
        contentAlignment = Alignment.Center
    ) {
        Column(horizontalAlignment = Alignment.CenterHorizontally) {
            Icon(
                imageVector = Icons.Default.Stop,
                contentDescription = "Awaryjne zatrzymanie",
                tint = Color.White,
                modifier = Modifier.size(28.dp)
            )
            Text("STOP", color = Color.White, fontSize = 10.sp, fontWeight = FontWeight.Bold)
        }
    }
}
```

## Tryb pełnoekranowy i orientacja

```kotlin
// Sterowanie robotem — wymusz landscape i pełny ekran
class RobotControlActivity : AppCompatActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        // Pełny ekran bez paska systemu
        WindowCompat.setDecorFitsSystemWindows(window, false)
        requestedOrientation = ActivityInfo.SCREEN_ORIENTATION_LANDSCAPE

        WindowInsetsControllerCompat(window, window.decorView).apply {
            hide(WindowInsetsCompat.Type.systemBars())
            systemBarsBehavior = WindowInsetsControllerCompat.BEHAVIOR_SHOW_TRANSIENT_BARS_BY_SWIPE
        }
    }
}
```

## Wskaźniki stanu połączenia

```kotlin
@Composable
fun ConnectionIndicator(state: ConnectionState) {
    val color = when (state) {
        ConnectionState.CONNECTED    -> Color(0xFF4CAF50)
        ConnectionState.CONNECTING   -> Color(0xFFFF9800)
        ConnectionState.DISCONNECTED -> Color(0xFFF44336)
        ConnectionState.ERROR        -> Color(0xFFE91E63)
    }

    val infiniteTransition = rememberInfiniteTransition()
    val alpha by infiniteTransition.animateFloat(
        initialValue = 1f, targetValue = 0.3f,
        animationSpec = infiniteRepeatable(tween(800), RepeatMode.Reverse)
    )

    Row(verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(6.dp)) {
        Box(
            modifier = Modifier
                .size(10.dp)
                .background(
                    color.copy(alpha = if (state == ConnectionState.CONNECTING) alpha else 1f),
                    CircleShape
                )
        )
        Text(
            text = state.label,
            style = MaterialTheme.typography.labelMedium,
            color = color
        )
    }
}
```

## Linki

- [ROS2 Mobile](https://wiki.pam.edu.pl/#ros2-mobile)
- [rosbridge_suite](https://github.com/RobotWebTools/rosbridge_suite)
- [Android SensorFusion](https://developer.android.com/guide/topics/sensors/sensors_motion)

## Telemetria w czasie rzeczywistym

```kotlin
@Composable
fun TelemetryDashboard(viewModel: RobotViewModel) {
    val telemetry by viewModel.telemetry.collectAsStateWithLifecycle()
    val connectionLatency by viewModel.latencyMs.collectAsStateWithLifecycle(0)

    Column(
        modifier = Modifier
            .fillMaxWidth()
            .background(Color(0xFF0D1117))
            .padding(12.dp),
        verticalArrangement = Arrangement.spacedBy(8.dp)
    ) {
        // Pasek latencji
        Row(verticalAlignment = Alignment.CenterVertically) {
            Text("Latencja:", color = Color.White.copy(0.6f), fontSize = 11.sp)
            Spacer(Modifier.width(4.dp))
            Text(
                "${connectionLatency}ms",
                color = when {
                    connectionLatency < 50  -> Color(0xFF4CAF50)
                    connectionLatency < 150 -> Color(0xFFFF9800)
                    else                    -> Color(0xFFF44336)
                },
                fontFamily = FontFamily.Monospace,
                fontWeight = FontWeight.Bold,
                fontSize = 12.sp
            )
        }

        // Kafelki danych
        LazyVerticalGrid(
            columns = GridCells.Fixed(3),
            horizontalArrangement = Arrangement.spacedBy(6.dp),
            verticalArrangement = Arrangement.spacedBy(6.dp)
        ) {
            item { TelemetryTile("Bateria", "${telemetry.batteryPercent}%", Icons.Default.BatteryFull) }
            item { TelemetryTile("v lin", "%.2f m/s".format(telemetry.linearVelocity), Icons.Default.Speed) }
            item { TelemetryTile("v kąt", "%.1f°/s".format(Math.toDegrees(telemetry.angularVelocity)), Icons.Default.Refresh) }
            item { TelemetryTile("CPU", "${telemetry.cpuPercent}%", Icons.Default.Memory) }
            item { TelemetryTile("Temp", "${telemetry.temperature}°C", Icons.Default.Thermostat) }
            item { TelemetryTile("WiFi", "${telemetry.rssi}dBm", Icons.Default.Wifi) }
        }
    }
}

@Composable
fun TelemetryTile(label: String, value: String, icon: ImageVector) {
    Card(
        colors = CardDefaults.cardColors(containerColor = Color(0xFF161B22)),
        modifier = Modifier.aspectRatio(1.2f)
    ) {
        Column(
            modifier = Modifier.fillMaxSize().padding(8.dp),
            horizontalAlignment = Alignment.CenterHorizontally,
            verticalArrangement = Arrangement.SpaceEvenly
        ) {
            Icon(icon, contentDescription = null, tint = Color(0xFF58A6FF), modifier = Modifier.size(16.dp))
            Text(value, color = Color.White, fontWeight = FontWeight.Bold, fontSize = 13.sp, fontFamily = FontFamily.Monospace)
            Text(label, color = Color.White.copy(0.5f), fontSize = 9.sp)
        }
    }
}
```

## Nagrywanie ścieżki robota

```kotlin
// Zapisywanie trajektorii do odtworzenia
class TrajectoryRecorder {
    private val recordedPoses = mutableListOf<TimedPose>()
    private var isRecording = false
    private var startTime = 0L

    fun startRecording() {
        recordedPoses.clear()
        startTime = System.currentTimeMillis()
        isRecording = true
    }

    fun onPoseUpdate(x: Float, y: Float, heading: Float) {
        if (!isRecording) return
        recordedPoses.add(
            TimedPose(
                timestampMs = System.currentTimeMillis() - startTime,
                x = x, y = y, heading = heading
            )
        )
    }

    fun stopAndGetTrajectory(): Trajectory {
        isRecording = false
        return Trajectory(recordedPoses.toList())
    }

    // Ślad wizualny na mapie
    fun drawTrajectory(poses: List<TimedPose>, canvas: DrawScope, scale: Float, offset: Offset) {
        if (poses.size < 2) return
        for (i in 1 until poses.size) {
            val prev = poses[i - 1]; val curr = poses[i]
            val alpha = (i.toFloat() / poses.size)
            canvas.drawLine(
                color = Color(0xFF2196F3).copy(alpha = alpha * 0.8f),
                start = Offset(prev.x * scale + offset.x, prev.y * scale + offset.y),
                end =   Offset(curr.x * scale + offset.x, curr.y * scale + offset.y),
                strokeWidth = 3f
            )
        }
    }
}

data class TimedPose(val timestampMs: Long, val x: Float, val y: Float, val heading: Float)
```

## Linki dodatkowe

- [Compose Canvas](https://developer.android.com/jetpack/compose/graphics/draw/overview)
- [Robot Web Tools](https://robotwebtools.github.io/)
- [Nav2 Action Server](https://nav2.ros.org/tutorials/docs/navigation2_with_keepout_filter.html)
