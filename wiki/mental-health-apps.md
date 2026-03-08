# Aplikacje Wsparcia Zdrowia Psychicznego

Aplikacje mobilne mogą odgrywać istotną rolę w monitorowaniu i wspieraniu zdrowia psychicznego. Łączą biometryczne czujniki urządzenia z algorytmami AI do wykrywania zmian nastroju.

## Typy aplikacji

| Typ | Przykłady | Główna funkcja |
|-----|-----------|----------------|
| **Dziennik nastroju** | Daylio, Bearable | Śledzenie nastroju w czasie |
| **Medytacja** | Headspace, Calm | Relaksacja, mindfulness |
| **CBT** | Woebot, Youper | Terapia kognitywno-behawioralna |
| **Monitoring snu** | Sleep Cycle | Analiza jakości snu |
| **Aktywność fizyczna** | Strava, Fitbit | Ćwiczenia vs nastrój |

## Pasywne monitorowanie nastroju

Smartfon może zbierać pasywne dane behawioralne korelujące ze stanem psychicznym:

```kotlin
data class PassiveSensingData(
    val timestamp: Long,
    // Aktywność fizyczna
    val stepCount: Int,
    val activityType: String,           // walking, running, stationary
    // Użycie telefonu
    val screenOnDuration: Long,         // ms
    val appUsageSessions: List<AppSession>,
    val callDuration: Long,
    val smsCount: Int,
    // Lokalizacja
    val locationEntropy: Float,         // różnorodność odwiedzanych miejsc
    val homeTime: Long,                 // czas w domu (ms)
    val socialPlaces: Int,              // liczba odwiedzonych miejsc społecznych
    // Środowisko
    val ambientLightLevel: Float,
    val ambientNoiseLevel: Float
)

// Korelacje z nastrojem (literatura naukowa):
// - Mniej kroków → wyższe ryzyko depresji
// - Więcej czasu w domu → izolacja społeczna
// - Nieprawidłowy rytm snu → zaburzenia afektywne
// - Zmniejszone użycie telefonu → anhedonia
```

## Dziennik nastroju z AI

```kotlin
@Composable
fun MoodJournalEntry(onSave: (MoodEntry) -> Unit) {
    var moodScore by remember { mutableFloatStateOf(5f) }
    var note by remember { mutableStateOf("") }
    var selectedEmotions by remember { mutableStateOf(setOf<String>()) }

    val emotions = listOf("😊 Radość", "😢 Smutek", "😰 Lęk", "😤 Złość",
                          "😌 Spokój", "😴 Zmęczenie", "🤩 Ekscytacja")

    Column(modifier = Modifier.padding(16.dp)) {
        Text("Jak się czujesz?", style = MaterialTheme.typography.headlineSmall)

        Slider(
            value = moodScore,
            onValueChange = { moodScore = it },
            valueRange = 1f..10f,
            steps = 8
        )
        Text("${moodScore.toInt()}/10", textAlign = TextAlign.Center)

        FlowRow {
            emotions.forEach { emotion ->
                FilterChip(
                    selected = emotion in selectedEmotions,
                    onClick = {
                        selectedEmotions = if (emotion in selectedEmotions)
                            selectedEmotions - emotion else selectedEmotions + emotion
                    },
                    label = { Text(emotion) }
                )
            }
        }

        OutlinedTextField(
            value = note,
            onValueChange = { note = it },
            label = { Text("Notatka (opcjonalnie)") },
            modifier = Modifier.fillMaxWidth()
        )

        Button(
            onClick = { onSave(MoodEntry(moodScore, selectedEmotions, note)) },
            modifier = Modifier.fillMaxWidth()
        ) { Text("Zapisz") }
    }
}
```

## Etyczne wytyczne projektowania

Aplikacje zdrowia psychicznego wymagają szczególnej uwagi etycznej:

1. **Nie zastępują terapii** — wyraźnie komunikuj, że app wspiera, nie leczy
2. **Kryzys** — zawsze udostępniaj linię kryzysową (Telefon Zaufania: 116 123)
3. **Prywatność danych** — dane emocjonalne to dane wrażliwe (RODO art. 9)
4. **Dark patterns** — nie uzależniaj użytkownika przez gamifikację stresu
5. **Dostępność** — projekt dla osób w trudnym stanie psychicznym

```kotlin
// Zawsze wyświetlaj przy wykryciu kryzysu
@Composable
fun CrisisResourcesBanner() {
    Card(
        colors = CardDefaults.cardColors(
            containerColor = MaterialTheme.colorScheme.errorContainer
        )
    ) {
        Column(modifier = Modifier.padding(16.dp)) {
            Text("Potrzebujesz pomocy?", fontWeight = FontWeight.Bold)
            Text("Telefon Zaufania dla Dorosłych: 116 123 (całą dobę, bezpłatnie)")
            Text("Telefon Zaufania dla Dzieci i Młodzieży: 116 111")
        }
    }
}
```

## Linki

- [WHO mHealth](https://www.who.int/teams/digital-health-and-innovation/mhealth)
- [StudentLife Dataset — passive sensing](http://studentlife.cs.dartmouth.edu/)

## Algorytmy predykcji nastroju

```kotlin
// Model predykcji depresji z pasywnych danych (uproszczony)
class MoodPredictionModel {

    // Wagi cech wyznaczone na podstawie literatury naukowej (StudentLife, AWARE)
    private val weights = mapOf(
        "stepCountChange"      to -0.3f,   // spadek kroków → negatywny sygnał
        "sleepIrregularity"    to -0.4f,   // nieregularny sen → ryzyko
        "socialInteractions"   to  0.3f,   // rozmowy telefoniczne → pozytywne
        "locationDiversity"    to  0.2f,   // wychodzenie z domu → pozytywne
        "screenTimeEvening"    to -0.2f    // telefon po 22:00 → negatywne
    )

    fun predictMoodScore(features: Map<String, Float>): Float {
        val baseScore = 5.0f  // Neutralny
        val delta = features.entries.sumOf { (key, value) ->
            ((weights[key] ?: 0f) * value).toDouble()
        }.toFloat()
        return (baseScore + delta).coerceIn(1f, 10f)
    }

    fun detectCrisisSignals(history: List<PassiveSensingData>): Boolean {
        val last7Days = history.takeLast(7)
        val avgSteps = last7Days.map { it.stepCount }.average()
        val avgSocial = last7Days.map { it.smsCount + it.callDuration }.average()

        // Znaczny spadek aktywności — flaga do oceny
        return avgSteps < 1000 && avgSocial < 50
    }
}
```

## Wizualizacja trendów nastroju

```kotlin
@Composable
fun MoodTrendChart(entries: List<MoodEntry>) {
    if (entries.isEmpty()) return

    val maxScore = 10f
    val points = entries.takeLast(30)  // ostatnie 30 dni

    Canvas(modifier = Modifier
        .fillMaxWidth()
        .height(180.dp)
        .padding(16.dp)
    ) {
        val stepX = size.width / (points.size - 1).coerceAtLeast(1)
        val scaleY = size.height / maxScore

        // Siatka pozioma
        for (i in 0..10 step 2) {
            val y = size.height - i * scaleY
            drawLine(Color.Gray.copy(alpha = 0.3f), Offset(0f, y), Offset(size.width, y), strokeWidth = 1f)
        }

        // Gradient wypełnienie pod linią
        val path = Path().apply {
            moveTo(0f, size.height)
            points.forEachIndexed { i, entry ->
                val x = i * stepX
                val y = size.height - entry.score * scaleY
                if (i == 0) lineTo(x, y) else lineTo(x, y)
            }
            lineTo((points.size - 1) * stepX, size.height)
            close()
        }
        drawPath(path, Brush.verticalGradient(
            listOf(Color(0xFF6650A4).copy(alpha = 0.4f), Color.Transparent)
        ))

        // Linia nastroju
        for (i in 1 until points.size) {
            val x1 = (i - 1) * stepX;  val y1 = size.height - points[i - 1].score * scaleY
            val x2 = i * stepX;         val y2 = size.height - points[i].score * scaleY
            drawLine(Color(0xFF6650A4), Offset(x1, y1), Offset(x2, y2), strokeWidth = 3f)
        }

        // Punkty
        points.forEachIndexed { i, entry ->
            val x = i * stepX; val y = size.height - entry.score * scaleY
            drawCircle(Color(0xFF6650A4), radius = 5f, center = Offset(x, y))
            drawCircle(Color.White, radius = 3f, center = Offset(x, y))
        }
    }
}
```

## Powiadomienia i interwencje

```kotlin
// Przypomnienie o uzupełnieniu dziennika nastroju
class MoodReminderWorker(context: Context, params: WorkerParameters) : CoroutineWorker(context, params) {
    override suspend fun doWork(): Result {
        val lastEntry = moodRepository.getLastEntry()
        val hoursSinceLast = ChronoUnit.HOURS.between(lastEntry?.timestamp ?: Instant.EPOCH, Instant.now())

        if (hoursSinceLast > 20) {
            showMoodCheckInNotification()
        }
        return Result.success()
    }

    private fun showMoodCheckInNotification() {
        val notification = NotificationCompat.Builder(applicationContext, MOOD_CHANNEL_ID)
            .setSmallIcon(R.drawable.ic_mood)
            .setContentTitle("Jak dziś mija dzień?")
            .setContentText("Poświęć chwilę na zapisanie swojego nastroju")
            .setPriority(NotificationCompat.PRIORITY_DEFAULT)
            .setAutoCancel(true)
            .setContentIntent(
                PendingIntent.getActivity(
                    applicationContext, 0,
                    Intent(applicationContext, MainActivity::class.java)
                        .putExtra("open_mood_entry", true),
                    PendingIntent.FLAG_IMMUTABLE
                )
            )
            .build()

        NotificationManagerCompat.from(applicationContext)
            .notify(MOOD_NOTIFICATION_ID, notification)
    }
}
```

## Certyfikacje i standardy

Aplikacje medyczne i zdrowotne mogą podlegać regulacjom:

| Standard | Dotyczy | Wymagania |
|----------|---------|-----------|
| **RODO / GDPR** | UE | Zgoda na dane wrażliwe (art. 9), prawo do usunięcia |
| **HIPAA** | USA | Ochrona danych zdrowotnych (PHI) |
| **MDR 2017/745** | UE | Jeśli app ma przeznaczenie medyczne |
| **ISO 25000** | Globalne | Jakość oprogramowania |
| **ISO 13131** | Globalne | Telehealth services |

> **Uwaga:** Jeśli Twoja aplikacja twierdzi, że *diagnozuje* lub *leczy*, może być klasyfikowana jako wyrób medyczny i wymagać certyfikacji CE w UE.

## Linki dodatkowe

- [Telefon Zaufania dla Dorosłych](https://116123.pl)
- [AWARE Framework](https://awareframework.com)
- [Apple HealthKit](https://developer.apple.com/health-fitness/)
- [Google Health Connect](https://developer.android.com/health-and-fitness/guides/health-connect)
