# Odometria wizyjna i Egomotion

Odometria wizyjna (ang. *Visual Odometry*, VO) to technika szacowania ruchu kamery lub robota na podstawie sekwencji obrazów, bez użycia kół napędowych ani zewnętrznych sygnałów GPS. Egomotion to pokrewne pojęcie oznaczające estymację własnego ruchu systemu wizyjnego w 3D. Obie metody są fundamentem nowoczesnej nawigacji autonomicznej — od dronów i pojazdów autonomicznych, po aplikacje mobilne AR.

## Kluczowe pojęcia

### Odometria wizyjna a Egomotion

| Pojęcie | Definicja | Zastosowanie |
|---------|-----------|--------------|
| **Odometria wizyjna** | Estymacja przyrostowej pozycji i orientacji kamery na podstawie sekwencji klatek | Robotyka, pojazdy, drony |
| **Egomotion** | Obliczanie 6-DOF ruchu kamery (3 translacje + 3 rotacje) z przepływu optycznego | AR, nawigacja, SLAM |
| **SLAM** | Simultaneous Localization and Mapping — budowanie mapy i lokalizacja jednocześnie | Roboty autonomiczne |
| **Przepływ optyczny** | Wzorzec pozornego ruchu pikseli między klatkami | Podstawa VO i Egomotion |

Kluczowa różnica: odometria wizyjna skupia się na kumulatywnej trajektorii (podobnie jak odometria kołowa), natomiast Egomotion — na chwilowym wektorze prędkości kamery w przestrzeni 3D.

### Stopnie swobody (6-DOF)

Ruch kamery opisuje się sześcioma parametrami: trzema translacjami (X, Y, Z) i trzema rotacjami (Roll, Pitch, Yaw). Macierz transformacji homogenicznej łączy je w jeden operator:

```
T = | R  t |   gdzie: R — macierz rotacji 3×3
    | 0  1 |          t — wektor translacji 3×1
```

## Przetwarzanie potoku VO — architektura

Klasyczny potok odometrii wizyjnej składa się z pięciu etapów:

```
Obraz(t-1) ──► Detekcja    ──► Dopasowanie ──► Estymacja ──► Trajektoria
Obraz(t)   ──► cech (t,t-1)    punktów        pozy (6-DOF)
                                               │
                              Odrzucenie ◄────┘ RANSAC
                              outlierów
```

### Etap 1 — Detekcja punktów charakterystycznych

Cechy wizualne muszą być powtarzalne i wyróżnialne. Najpopularniejsze deskryptory to:

| Detektor | Typ | Szybkość | Dokładność | Typowe zastosowanie |
|----------|-----|----------|------------|---------------------|
| **ORB** | binarny | bardzo szybki | dobra | real-time na urządzeniu mobilnym |
| **SIFT** | float | wolny | bardzo dobra | dokładna rekonstrukcja |
| **SURF** | float | średni | dobra | zbalansowane zastosowania |
| **FAST** | binarny | błyskawiczny | niska | śledzenie w wideo |
| **SuperPoint** | DNN | średni (GPU) | doskonała | autonomiczne pojazdy |

```kotlin
// Android — detekcja ORB i dopasowanie metodą BFMatcher (OpenCV for Android)
import org.opencv.features2d.*
import org.opencv.core.*

class VisualOdometry {
    private val orb = ORB.create(500)          // max 500 punktów
    private val matcher = BFMatcher.create(Core.NORM_HAMMING, true) // cross-check

    data class MatchResult(
        val prevPts: MatOfPoint2f,
        val currPts: MatOfPoint2f,
        val matchCount: Int
    )

    fun detectAndMatch(prevGray: Mat, currGray: Mat): MatchResult {
        val prevKp = MatOfKeyPoint()
        val currKp = MatOfKeyPoint()
        val prevDesc = Mat()
        val currDesc = Mat()

        orb.detectAndCompute(prevGray, Mat(), prevKp, prevDesc)
        orb.detectAndCompute(currGray, Mat(), currKp, currDesc)

        val matches = MatOfDMatch()
        matcher.match(prevDesc, currDesc, matches)

        // Filtruj po odległości deskryptora (jakość dopasowania)
        val goodMatches = matches.toList()
            .filter { it.distance < 50f }
            .sortedBy { it.distance }
            .take(200)

        // Wyodrębnij punkty z dobrych dopasowań
        val prevPts = MatOfPoint2f(*goodMatches.map {
            prevKp.toList()[it.queryIdx].pt
        }.toTypedArray())
        val currPts = MatOfPoint2f(*goodMatches.map {
            currKp.toList()[it.trainIdx].pt
        }.toTypedArray())

        return MatchResult(prevPts, currPts, goodMatches.size)
    }
}
```

### Etap 2 — Śledzenie optyczne (Lucas-Kanade)

Dla wideo o wysokiej liczbie klatek wydajniejsze jest śledzenie punktów piramidą Lucas-Kanade niż powtarzalna detekcja:

```kotlin
// Śledzenie przepływu optycznego z piramidą Lucas-Kanade
fun trackFeatures(prevGray: Mat, currGray: Mat, prevPts: MatOfPoint2f): Pair<MatOfPoint2f, List<Boolean>> {
    val currPts = MatOfPoint2f()
    val status = MatOfByte()
    val error = MatOfFloat()

    Video.calcOpticalFlowPyrLK(
        prevGray, currGray,
        prevPts, currPts,
        status, error,
        Size(21.0, 21.0),    // rozmiar okna
        3,                    // głębokość piramidy
        TermCriteria(TermCriteria.EPS + TermCriteria.COUNT, 30, 0.01)
    )

    val tracked = status.toList().map { it.toInt() == 1 }
    return Pair(currPts, tracked)
}
```

## Estymacja pozy kamerowej

### Macierz zasadnicza i homografia

Po dopasowaniu punktów odtwarzamy macierz transformacji. Wybór metody zależy od sceny:

```kotlin
// Estymacja ruchu kamerowego z dopasowanych punktów 2D
fun estimatePose(
    prevPts: MatOfPoint2f,
    currPts: MatOfPoint2f,
    K: Mat          // macierz kalibracji kamery
): Pair<Mat, Mat> {  // (R, t)

    // Macierz zasadnicza (Essential Matrix) — dla par skalibrowanych kamer
    val mask = Mat()
    val E = Calib3d.findEssentialMat(
        prevPts, currPts,
        K,
        Calib3d.RANSAC,
        0.999,   // prawdopodobieństwo
        1.0,     // próg inlierów w pikselach
        mask
    )

    val R = Mat()
    val t = Mat()

    // Rozkładamy E na R i t (do 4 możliwych rozwiązań — wybieramy prawidłowe)
    val inlierCount = Calib3d.recoverPose(E, prevPts, currPts, K, R, t, mask)

    Log.d("VO", "Inlierów: $inlierCount / ${prevPts.rows()}")
    return Pair(R, t)
}

// Kumulacja pozycji (dead reckoning)
fun updatePose(currentR: Mat, currentT: Mat, R: Mat, t: Mat): Pair<Mat, Mat> {
    val newT = Mat()
    val newR = Mat()
    Core.gemm(currentR, t, 1.0, currentT, 1.0, newT)  // t_new = R_curr * t + t_curr
    Core.gemm(R, currentR, 1.0, Mat(), 0.0, newR)       // R_new = R * R_curr
    return Pair(newR, newT)
}
```

### RANSAC — odrzucanie outlierów

Dopasowania zawierają błędne odpowiedniki (*outliers*). RANSAC wielokrotnie losuje minimalny zestaw punktów, dopasowuje model i wybiera rozwiązanie z największą liczbą inlierów:

```
Iteracja RANSAC:
  1. Losuj minimalny podzbiór punktów (np. 5-punktowy algorytm Nistéra)
  2. Oblicz model (E lub H)
  3. Sprawdź ile punktów jest zgodnych z modelem (< próg błędu)
  4. Jeśli więcej inlierów niż dotąd → zapamiętaj model
  5. Powtarzaj N razy
```

## Egomotion z przepływu optycznego

Przepływ optyczny (ang. *optical flow*) opisuje pole prędkości pozornego ruchu pikseli. Z globalnego pola przepływu można wyodrębnić wektor egomotion kamery.

### Gęsty przepływ optyczny — Farnebäck

```kotlin
// Gęsty przepływ optyczny (Farnebäck) — pole przemieszczeń pikseli
fun computeDenseFlow(prev: Mat, curr: Mat): Mat {
    val flow = Mat()
    Video.calcOpticalFlowFarneback(
        prev, curr, flow,
        0.5,   // skala piramidy
        3,     // liczba poziomów
        15,    // rozmiar okna
        3,     // iteracje
        5,     // rozmiar sąsiedztwa piksela
        1.2,   // odchylenie Gaussa
        0      // flagi
    )
    return flow  // flow[y,x] = Vec2f(dx, dy) — przesunięcie piksela
}

// Estymacja składowych ruchu (translacja, rotacja) z pola przepływu
fun estimateEgomotion(flow: Mat, K: Mat): EgomotionResult {
    // Zbierz wektory przepływu dla regularnej siatki punktów
    val points = mutableListOf<Point>()
    val flows = mutableListOf<Point>()

    val step = 10  // co 10. piksel
    for (y in 0 until flow.rows() step step) {
        for (x in 0 until flow.cols() step step) {
            val f = flow.get(y, x)
            val dx = f[0]; val dy = f[1]
            val mag = Math.sqrt(dx * dx + dy * dy)
            if (mag > 0.5 && mag < 50.0) {  // filtracja szumu
                points.add(Point(x.toDouble(), y.toDouble()))
                flows.add(Point(dx, dy))
            }
        }
    }

    // Focus of Expansion (FOE) — punkt zbiegu przy translacji w przód
    val foe = estimateFOE(points, flows)

    return EgomotionResult(
        translationDirection = foe,
        averageFlowMagnitude = flows.map { Math.sqrt(it.x * it.x + it.y * it.y) }.average()
    )
}

data class EgomotionResult(
    val translationDirection: Point,
    val averageFlowMagnitude: Double
)
```

### Focus of Expansion (FOE)

Podczas ruchu kamery do przodu przepływ optyczny rozbieżnie rozchodzi się z jednego punktu — Focus of Expansion (FOE). Jego pozycja w obrazie wskazuje kierunek translacji:

```
Ruch do przodu:        Obrót wokół osi Y:
      ↑  ↗  →               ←  ←  ←
   ↖     ★     ↗            ←  ←  ←
      ↙  ↓  ↘               ←  ←  ←
   (★ = Focus of Expansion)    (ruch obrotowy)
```

## Stereo Visual Odometry

Kamera stereo eliminuje problem skali bezwzględnej — znana linia bazowa między obiektywami pozwala obliczyć prawdziwą odległość punktów 3D:

```kotlin
// Triangulacja punktów 3D z pary stereo
class StereoVO(private val K: Mat, private val baseline: Double) {

    // Macierze projekcji dla lewej i prawej kamery
    private val P_left  = Mat.zeros(3, 4, CvType.CV_64F).also { K.copyTo(it.submat(0, 3, 0, 3)) }
    private val P_right = Mat.zeros(3, 4, CvType.CV_64F).also {
        K.copyTo(it.submat(0, 3, 0, 3))
        it.put(0, 3, -K.get(0, 0)[0] * baseline)  // tx = -f * B
    }

    // Triangulacja dopasowanych punktów stereo → punkty 3D
    fun triangulate(ptsLeft: MatOfPoint2f, ptsRight: MatOfPoint2f): Mat {
        val points4D = Mat()
        Calib3d.triangulatePoints(P_left, P_right, ptsLeft, ptsRight, points4D)

        // Przelicz ze współrzędnych jednorodnych na 3D
        val points3D = Mat(points4D.cols(), 1, CvType.CV_64FC3)
        for (i in 0 until points4D.cols()) {
            val w = points4D.get(3, i)[0]
            points3D.put(i, 0,
                points4D.get(0, i)[0] / w,
                points4D.get(1, i)[0] / w,
                points4D.get(2, i)[0] / w
            )
        }
        return points3D
    }

    // Estymacja ruchu przez PnP (znane punkty 3D z poprzedniej klatki)
    fun estimatePosePnP(pts3D: MatOfPoint3f, pts2D: MatOfPoint2f): Pair<Mat, Mat> {
        val R_vec = Mat(); val t = Mat()
        Calib3d.solvePnPRansac(pts3D, pts2D, K, Mat(), R_vec, t)
        val R = Mat()
        Calib3d.Rodrigues(R_vec, R)
        return Pair(R, t)
    }
}
```

## Odometria wizyjna na urządzeniu mobilnym

### ARCore — Egomotion w praktyce

Google ARCore realizuje wewnętrznie odometrię wizyjno-inercyjną (VIO). Udostępnia pozę kamery poprzez API `Frame.getCameraFrame()`:

```kotlin
import com.google.ar.core.*

class ARCoreEgomotion : AppCompatActivity() {
    private lateinit var arSession: Session

    override fun onResume() {
        super.onResume()
        arSession = Session(this)
        val config = Config(arSession).apply {
            updateMode = Config.UpdateMode.LATEST_CAMERA_IMAGE
        }
        arSession.configure(config)
        arSession.resume()
    }

    fun onDrawFrame() {
        val frame = arSession.update()
        val camera = frame.camera

        if (camera.trackingState == TrackingState.TRACKING) {
            // Pozycja i orientacja kamery w przestrzeni świata
            val pose: Pose = camera.displayOrientedPose

            val tx = pose.tx(); val ty = pose.ty(); val tz = pose.tz()
            val qx = pose.qx(); val qy = pose.qy()
            val qz = pose.qz(); val qw = pose.qw()

            Log.d("Egomotion", "Pozycja: (%.3f, %.3f, %.3f)".format(tx, ty, tz))
            Log.d("Egomotion", "Rotacja (quat): (%.3f, %.3f, %.3f, %.3f)".format(qx, qy, qz, qw))

            // Prędkość liniowa (różniczka pozy)
            // ARCore nie udostępnia wprost prędkości — obliczamy ją ręcznie
        }
    }
}
```

### Wizyjno-inercyjna odometria (VIO)

Połączenie kamery z IMU (żyroskop + akcelerometr) znacząco zwiększa dokładność i odporność na blur:

```kotlin
// Fusion IMU + Visual Odometry — Filtr Kalmana Extended (EKF)
class VIOFusion {
    // Stan: [pozycja(3), prędkość(3), orientacja-kwaternion(4), bias_acc(3), bias_gyro(3)]
    private var state = DoubleArray(16)
    private var P = Mat.eye(16, 16, CvType.CV_64F)  // macierz kowariancji

    // Szumy procesu i pomiarów (kalibrowane empirycznie)
    private val Q_acc   = 0.01   // szum akcelerometru
    private val Q_gyro  = 0.001  // szum żyroskopu
    private val R_vision = 0.1   // szum obserwacji wizyjnej

    // Krok predykcji (IMU — wysoka częstotliwość, ~200 Hz)
    fun predictIMU(acc: FloatArray, gyro: FloatArray, dt: Float) {
        // Całkowanie kinematyczne (pre-integration)
        val ax = acc[0] - state[9]   // korekcja biasu
        val ay = acc[1] - state[10]
        val az = acc[2] - state[11]

        // Aktualizacja prędkości i pozycji (trapezy Eulera)
        state[3] += ax * dt; state[4] += ay * dt; state[5] += (az - 9.81) * dt
        state[0] += state[3] * dt
        state[1] += state[4] * dt
        state[2] += state[5] * dt
        // Propagacja macierzy kowariancji (uproszczona)
    }

    // Krok korekcji (wizja — niska częstotliwość, ~30 Hz)
    fun updateVision(R_cam: Mat, t_cam: Mat) {
        // Innowacja: różnica między przewidywaną a obserwowaną pozą
        // Oblicz wzmocnienie Kalmana K = P*H^T * (H*P*H^T + R)^{-1}
        // Zaktualizuj stan: x = x + K * innowacja
        // Zaktualizuj kowariancję: P = (I - K*H) * P
    }
}
```

## Typowe problemy i rozwiązania

### Dryf kumulatywny

Błędy w kolejnych estymacjach narastają. Rozwiązania:

| Problem | Przyczyna | Rozwiązanie |
|---------|-----------|-------------|
| **Dryf translacyjny** | Błąd skali 1% / klatkę → 100% / 100 m | Stereo VO lub fuzja z GPS |
| **Dryf rotacyjny** | Akumulacja błędu odchylenia (yaw) | IMU z magnetometrem |
| **Utrata śledzenia** | Szybki ruch, rozmycie, ciemność | Re-lokalizacja, kluczowe klatki |
| **Skala bezwzględna** | Mono kamera nie zna odległości | Kamera stereo lub głębokości IMU |

### Kluczowe klatki i optymalizacja grafu

Technika kluczowych klatek (*keyframes*) ogranicza liczbę stanów, nad którymi prowadzona jest optymalizacja. Bundle Adjustment (BA) minimalizuje błąd reprojekcji:

```
Minimalizuj: Σ_i Σ_j ρ( || π(R_i, t_i, X_j) − x_ij ||² )

gdzie:
  π(R, t, X)  — projekcja punktu 3D X na obraz
  x_ij        — obserwowany punkt j w klatce i
  ρ(·)        — funkcja kosztu Hubera (odporna na outlierów)
```

## Ocena jakości i metryki

### Standardowe metryki KITTI

Benchmark KITTI jest standardem ewaluacji odometrii wizyjnej:

| Metryka | Formuła | Opis |
|---------|---------|------|
| **ATE** | `√(Σ ||t_i - t̂_i||²/N)` | Absolute Trajectory Error |
| **RPE** | `||Δt_i - Δt̂_i||` | Relative Pose Error |
| **t_rel** | Błąd translacyjny [%] | Procentowy błąd na odcinkach |
| **r_rel** | Błąd rotacyjny [°/100m] | Rotacja na dystansie |

```kotlin
// Obliczanie ATE (Absolute Trajectory Error)
fun computeATE(groundTruth: List<FloatArray>, estimated: List<FloatArray>): Double {
    require(groundTruth.size == estimated.size) { "Trajektorie muszą mieć tę samą długość" }
    val sumSqErr = groundTruth.zip(estimated).sumOf { (gt, est) ->
        val dx = gt[0] - est[0]
        val dy = gt[1] - est[1]
        val dz = gt[2] - est[2]
        (dx * dx + dy * dy + dz * dz).toDouble()
    }
    return Math.sqrt(sumSqErr / groundTruth.size)
}
```

## Implementacja na urządzeniu mobilnym — stack technologiczny

### Podejścia i narzędzia

| Podejście | Biblioteki | Latencja | Dokładność | Uwagi |
|-----------|-----------|----------|-----------|-------|
| **ARCore** (Android) | `com.google.ar.core` | <16 ms | dobra | Gotowe API, najłatwiejsze |
| **ARKit** (iOS) | `ARKit.framework` | <16 ms | dobra | Najlepsza na iPhone |
| **OpenCV ORB+5-pt** | `org.opencv:opencv-android` | 20–50 ms | średnia | Pełna kontrola, open source |
| **ORB-SLAM3** | JNI wrapper | 30–80 ms | doskonała | Najdokładniejsze, ciężkie |
| **RTAB-Map** | ROS2 + Android | >100 ms | doskonała | SLAM + mapa 3D |

### Optymalizacja wydajności na mobile

```kotlin
// Konfiguracja OpenCV dla real-time na mobile
class MobileVOConfig {
    companion object {
        // Skalowanie rozdzielczości — kluczowe dla wydajności!
        const val PROCESSING_WIDTH  = 640
        const val PROCESSING_HEIGHT = 480

        // Dostrojone dla flagship Android (2024)
        val ORB_OPTIONS = ORB.create(
            300,    // maxFeatures — mniej = szybciej
            1.2f,   // scaleFactor
            6,      // nlevels — piramida 6-poziomowa
            31,     // edgeThreshold
            0,      // firstLevel
            2,      // WTA_K
            ORB.HARRIS_SCORE,
            31,     // patchSize
            20      // fastThreshold
        )

        // Dla urządzeń z NPU/GPU (Tensor G4, Snapdragon 8 Gen 3):
        // użyj SuperPoint (DNN) zamiast ORB — 2x dokładniejszy
    }
}

// Preprocessing — konwersja i skalowanie w jednym kroku
fun preprocessFrame(bitmap: Bitmap): Mat {
    val mat = Mat()
    Utils.bitmapToMat(bitmap, mat)

    val gray = Mat()
    Imgproc.cvtColor(mat, gray, Imgproc.COLOR_RGBA2GRAY)

    val scaled = Mat()
    Imgproc.resize(gray, scaled,
        Size(MobileVOConfig.PROCESSING_WIDTH.toDouble(),
             MobileVOConfig.PROCESSING_HEIGHT.toDouble()))
    return scaled
}
```

## Podsumowanie — kiedy stosować VO / Egomotion

```
Pytanie                           → Zalecenie
─────────────────────────────────────────────────────────────
Czy potrzebujesz tylko ruchu AR?  → ARCore / ARKit (gotowe)
Potrzebujesz mapy 3D?             → ORB-SLAM3 lub RTAB-Map
Działanie na krawędzi (edge)?     → Mono ORB + IMU fusion
Dokładność centymetrowa?          → Stereo VO + BA
Niska latencja (<10 ms)?          → Przepływ optyczny LK
Dużo dynamicznych obiektów?       → Głęboka segmentacja + VO
```

Odometria wizyjna jest dziś kluczowym komponentem każdego systemu autonomicznej nawigacji. Dzięki dostępności bibliotek OpenCV, ARCore/ARKit i coraz potężniejszym chipom mobilnym (NPU, DSP), implementacja VO na smartfonie stała się wykonalna nawet w czasie rzeczywistym.

## Linki

- [KITTI Vision Benchmark Suite](http://www.cvlibs.net/datasets/kitti/)
- [ORB-SLAM3](https://github.com/UZ-SLAMLab/ORB_SLAM3)
- [ARCore — Motion Tracking](https://developers.google.com/ar/develop/concepts)
- [OpenCV — Optical Flow](https://docs.opencv.org/4.x/d4/dee/tutorial_optical_flow.html)
- [TUM Visual-Inertial Dataset](https://vision.in.tum.de/data/datasets/visual-inertial-dataset)
- [David Nistér — An Efficient Solution to the Five-Point Relative Pose Problem](https://ieeexplore.ieee.org/document/1288525)
