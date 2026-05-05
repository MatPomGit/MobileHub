# UI sterowania robotem

Aplikacja mobilna jako kontroler robota wymaga specyficznego podejścia do projektowania interfejsu - niskie opóźnienia, czytelność w ruchu, jednoznaczna informacja zwrotna i mechanizmy bezpieczeństwa.

## Wymagania dla interfejsów robotycznych

- **Latencja** - reakcja na gest powinna dotrzeć do robota w <100ms
- **Fail-safe** - utrata połączenia = natychmiastowe zatrzymanie ruchu
- **Feedback** - użytkownik musi wiedzieć czy robot odebrał komendę
- **Ergonomia** - sterowanie jedną ręką podczas trzymania urządzenia
- **Emergency Stop** - duży, zawsze dostępny przycisk zatrzymania

## Wirtualny joystick - implementacja

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

## Emergency Stop - przycisk zatrzymania

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
// Sterowanie robotem - wymusz landscape i pełny ekran
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

## Mapa i wizualizacja otoczenia

Aplikacja sterowania robotem powinna prezentować mini-mapę pokazującą aktualną pozycję robota, wykryte przeszkody oraz zaplanowaną ścieżkę nawigacji. Implementację opieramy na Compose `Canvas`, który daje pełną kontrolę nad rysowaniem wektorowych elementów.

```kotlin
@Composable
fun RobotMiniMap(
    modifier: Modifier = Modifier,
    robotPose: RobotPose,
    obstacles: List<Obstacle>,
    plannedPath: List<Offset>,
    mapSizeMeters: Float = 10f
) {
    Canvas(modifier = modifier
        .background(Color(0xFF1A1A2E))
        .clipToBounds()
    ) {
        val scale = size.minDimension / mapSizeMeters
        val center = Offset(size.width / 2f, size.height / 2f)

        // Siatka pomocnicza
        val gridStep = scale * 1f // co 1 metr
        val gridColor = Color.White.copy(alpha = 0.06f)
        var x = center.x % gridStep
        while (x < size.width) { drawLine(gridColor, Offset(x, 0f), Offset(x, size.height), 1f); x += gridStep }
        var y = center.y % gridStep
        while (y < size.height) { drawLine(gridColor, Offset(0f, y), Offset(size.width, y), 1f); y += gridStep }

        // Zaplanowana ścieżka
        if (plannedPath.size >= 2) {
            val pathPoints = plannedPath.map { worldToScreen(it, robotPose, scale, center) }
            for (i in 1 until pathPoints.size) {
                drawLine(Color(0xFF2196F3).copy(alpha = 0.7f), pathPoints[i - 1], pathPoints[i], strokeWidth = 3f,
                    pathEffect = PathEffect.dashPathEffect(floatArrayOf(10f, 6f)))
            }
        }

        // Przeszkody
        obstacles.forEach { obs ->
            val pos = worldToScreen(obs.position, robotPose, scale, center)
            drawCircle(Color(0xFFFF5722).copy(alpha = 0.8f), obs.radius * scale, pos)
        }

        // Robot - trójkąt wskazujący kierunek
        val robotPos = center // robot zawsze w centrum mini-mapy
        rotate(Math.toDegrees(robotPose.heading.toDouble()).toFloat(), robotPos) {
            val path = Path().apply {
                moveTo(robotPos.x, robotPos.y - 16f)
                lineTo(robotPos.x - 10f, robotPos.y + 10f)
                lineTo(robotPos.x + 10f, robotPos.y + 10f)
                close()
            }
            drawPath(path, Color(0xFF4CAF50))
        }
    }
}

fun DrawScope.worldToScreen(world: Offset, robotPose: RobotPose, scale: Float, center: Offset): Offset {
    val dx = world.x - robotPose.x
    val dy = world.y - robotPose.y
    return Offset(center.x + dx * scale, center.y - dy * scale)
}
```

Mini-mapa powinna być umieszczona w rogu ekranu sterowania jako `Box` z `Alignment.TopEnd`, z rozmiarem około `150.dp × 150.dp`. Dodaj przycisk do przełączania między widokiem skoncentrowanym na robocie a widokiem globalnym mapy.

## Planowanie misji - waypoints

Interfejs ustawiania punktów trasy pozwala operatorowi zdefiniować sekwencję miejsc docelowych dla autonomicznej nawigacji. Punkty trasy mogą być dodawane przez kliknięcie na mini-mapę lub ręczne wpisanie współrzędnych.

```kotlin
@Composable
fun WaypointList(
    waypoints: List<Waypoint>,
    onAdd: (Waypoint) -> Unit,
    onRemove: (Int) -> Unit,
    onReorder: (Int, Int) -> Unit,
    onStartMission: () -> Unit
) {
    val reorderState = rememberReorderableLazyListState(
        onMove = { from, to -> onReorder(from.index, to.index) }
    )

    Column {
        Text("Punkty trasy", style = MaterialTheme.typography.titleMedium,
            modifier = Modifier.padding(horizontal = 16.dp, vertical = 8.dp))

        LazyColumn(
            state = reorderState.listState,
            modifier = Modifier
                .weight(1f)
                .reorderable(reorderState),
            contentPadding = PaddingValues(horizontal = 16.dp)
        ) {
            itemsIndexed(waypoints, key = { _, w -> w.id }) { index, waypoint ->
                ReorderableItem(reorderState, key = waypoint.id) { isDragging ->
                    val elevation by animateDpAsState(if (isDragging) 8.dp else 0.dp)
                    WaypointRow(
                        index = index + 1,
                        waypoint = waypoint,
                        elevation = elevation,
                        onRemove = { onRemove(index) },
                        dragHandle = { detectReorderAfterLongPress(reorderState) }
                    )
                }
            }
        }

        Row(Modifier.padding(16.dp), horizontalArrangement = Arrangement.spacedBy(8.dp)) {
            OutlinedButton(onClick = { onAdd(Waypoint.fromCurrentMapCenter()) }, modifier = Modifier.weight(1f)) {
                Icon(Icons.Default.AddLocation, null)
                Spacer(Modifier.width(4.dp))
                Text("Dodaj punkt")
            }
            Button(onClick = onStartMission, enabled = waypoints.isNotEmpty(), modifier = Modifier.weight(1f)) {
                Icon(Icons.Default.PlayArrow, null)
                Spacer(Modifier.width(4.dp))
                Text("Start misji")
            }
        }
    }
}

@Composable
fun WaypointRow(index: Int, waypoint: Waypoint, elevation: Dp, onRemove: () -> Unit, dragHandle: Modifier.() -> Modifier) {
    ElevatedCard(elevation = CardDefaults.cardElevation(elevation), modifier = Modifier.fillMaxWidth().padding(vertical = 4.dp)) {
        Row(Modifier.padding(12.dp), verticalAlignment = Alignment.CenterVertically) {
            Icon(Icons.Default.DragHandle, null, modifier = Modifier.dragHandle(), tint = Color.Gray)
            Spacer(Modifier.width(8.dp))
            Box(Modifier.size(28.dp).background(MaterialTheme.colorScheme.primary, CircleShape),
                contentAlignment = Alignment.Center) {
                Text("$index", color = Color.White, fontWeight = FontWeight.Bold, fontSize = 12.sp)
            }
            Spacer(Modifier.width(12.dp))
            Column(Modifier.weight(1f)) {
                Text(waypoint.label.ifEmpty { "Punkt $index" }, fontWeight = FontWeight.Medium)
                Text("x=%.2f  y=%.2f".format(waypoint.x, waypoint.y),
                    style = MaterialTheme.typography.bodySmall, color = Color.Gray, fontFamily = FontFamily.Monospace)
            }
            IconButton(onClick = onRemove) { Icon(Icons.Default.Delete, null, tint = MaterialTheme.colorScheme.error) }
        }
    }
}
```

Punkty trasy są wysyłane do robota jako lista celów Nav2 `NavigateThroughPoses` przez protokół rosbridge. Podczas wykonywania misji aktywny punkt trasy jest podświetlany animowaną ramką na mini-mapie.

## Tryby sterowania i gesty

Profesjonalne aplikacje sterowania robotem oferują co najmniej dwa tryby: **ręczny** (joystick - pełna kontrola operatora) oraz **autonomiczny** (robot realizuje zadaną misję, operator może jedynie zatwierdzać lub anulować). Przełączanie trybów powinno być świadome i wymagać wyraźnej akcji, aby zapobiec przypadkowym zmianom.

```kotlin
enum class ControlMode { MANUAL, AUTONOMOUS, EMERGENCY }

@Composable
fun ModeSelector(
    currentMode: ControlMode,
    onModeChange: (ControlMode) -> Unit
) {
    var showConfirm by remember { mutableStateOf<ControlMode?>(null) }

    // Swipe w górę = protokół awaryjny
    val swipeState = rememberSwipeableState(initialValue = 0)
    LaunchedEffect(swipeState.currentValue) {
        if (swipeState.currentValue == 1) onModeChange(ControlMode.EMERGENCY)
    }

    Column(Modifier.swipeable(swipeState, anchors = mapOf(0f to 0, -200f to 1),
        orientation = Orientation.Vertical, thresholds = { _, _ -> FractionalThreshold(0.5f) })) {

        // Wskaźnik aktywnego trybu
        val modeColor = when (currentMode) {
            ControlMode.MANUAL     -> Color(0xFF2196F3)
            ControlMode.AUTONOMOUS -> Color(0xFF4CAF50)
            ControlMode.EMERGENCY  -> Color(0xFFF44336)
        }
        val modeLabel = when (currentMode) {
            ControlMode.MANUAL     -> "RĘCZNY"
            ControlMode.AUTONOMOUS -> "AUTONOMICZNY"
            ControlMode.EMERGENCY  -> "AWARYJNY"
        }

        AnimatedContent(targetState = currentMode) { mode ->
            Row(Modifier.fillMaxWidth().background(modeColor.copy(0.15f)).padding(10.dp),
                horizontalArrangement = Arrangement.Center, verticalAlignment = Alignment.CenterVertically) {
                Box(Modifier.size(8.dp).background(modeColor, CircleShape))
                Spacer(Modifier.width(8.dp))
                Text(modeLabel, color = modeColor, fontWeight = FontWeight.Bold, letterSpacing = 2.sp)
            }
        }

        // Przyciski przełączania
        Row(Modifier.padding(8.dp), horizontalArrangement = Arrangement.spacedBy(8.dp)) {
            listOf(ControlMode.MANUAL, ControlMode.AUTONOMOUS).forEach { mode ->
                FilterChip(
                    selected = currentMode == mode,
                    onClick = { if (currentMode != mode) showConfirm = mode },
                    label = { Text(if (mode == ControlMode.MANUAL) "Ręczny" else "Auto") },
                    leadingIcon = {
                        Icon(if (mode == ControlMode.MANUAL) Icons.Default.SportsEsports else Icons.Default.SmartToy,
                            null, Modifier.size(16.dp))
                    }
                )
            }
        }
    }

    // Dialog potwierdzenia zmiany trybu
    showConfirm?.let { targetMode ->
        AlertDialog(
            onDismissRequest = { showConfirm = null },
            title = { Text("Zmień tryb?") },
            text = { Text("Przełączenie na tryb ${targetMode.name.lowercase()} zatrzyma bieżące zadanie robota.") },
            confirmButton = {
                TextButton(onClick = { onModeChange(targetMode); showConfirm = null }) { Text("Potwierdź") }
            },
            dismissButton = { TextButton(onClick = { showConfirm = null }) { Text("Anuluj") } }
        )
    }
}
```

Swipe w górę uruchamia protokół awaryjny i wysyła polecenie `cmd_vel` z zerową prędkością do robota. Zmiana trybu jest logowana z timestampem, aby ułatwić debugowanie zdarzeń po incydentach. Wizualne wskaźniki trybu (kolor paska statusu, haptyczne wibracje przy zmianie) poprawiają świadomość sytuacyjną operatora.

| Tryb | Joystick | Autonomia | Emergency Stop | Dostępność |
|---|---|---|---|---|
| Ręczny | ✅ Aktywny | ❌ | ✅ Zawsze | Zawsze |
| Autonomiczny | ❌ | ✅ Aktywna | ✅ Zawsze | Zawsze |
| Awaryjny | ❌ | ❌ | - (już zatrzymany) | Restart wymagany |
