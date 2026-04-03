# Neurogaming — gry sterowane mózgiem

Neurogaming (*brain-computer game interface*) to dziedzina łącząca neurotechnologię z projektowaniem gier — gracz steruje rozgrywką lub wpływa na nią poprzez sygnały elektryczne mózgu, rejestrowane przez interfejs mózg-komputer (*Brain-Computer Interface*, BCI). Zamiast touchpada czy przycisków, medium sterowania staje się ludzki umysł.

---

## Historia i kontekst

### Od laboratorium do smartfona

| Rok | Wydarzenie |
|-----|-----------|
| 1924 | Hans Berger rejestruje pierwsze EEG u człowieka |
| 1973 | Jacques Vidal definiuje pojęcie BCI w kontekście sterowania komputerem |
| 2002 | BrainGate — pierwsze wszczepiane BCI do sterowania kursorem myszy |
| 2009 | Neurosky MindSet — pierwsze konsumenckie EEG w formie słuchawek |
| 2012 | „NeuroRacer" — gra EEG trenująca uwagę u seniorów (UCSF) |
| 2014 | Emotiv EPOC — 14-kanałowe EEG dla graczy |
| 2020 | Neuralink — demonstracja wszczepialnego BCI o wysokiej rozdzielczości |
| 2023 | OpenBCI Galea — zintegrowany headset BCI + VR (Eye, EMG, EEG, PPG) |
| 2025 | Masowy rynek mobilnych aplikacji BCI na Android i iOS |

Pierwsze gry komercyjne bazujące na EEG pojawiły się ok. 2009 r. razem z tańszymi urządzeniami dla konsumentów. Dziś mobilne aplikacje do neurofeedbacku i lekkie zestawy EEG (waga &lt;100 g) pozwalają na neurogaming poza laboratorium.

---

## Jak działa BCI w grach?

### Podstawowy przepływ sygnału

```
Mózg → Elektrody EEG → Wzmacniacz → ADC → Filtracja → Ekstrakcja cech → Klasyfikator → Akcja w grze
```

### Rodzaje sygnałów mózgowych w grach

| Sygnał | Pasmo częstotliwości | Znaczenie | Przykładowe zastosowanie w grze |
|--------|---------------------|-----------|--------------------------------|
| **Delta** (δ) | 0.5–4 Hz | Sen głęboki, regeneracja | Monitorowanie zmęczenia gracza |
| **Theta** (θ) | 4–8 Hz | Skupienie, medytacja, kreatywność | Tryb relaksu, sterowanie powolnymi akcjami |
| **Alpha** (α) | 8–13 Hz | Spokój, brak stresu | Detekcja relaksacji, odblokowanie poziomów |
| **Beta** (β) | 13–30 Hz | Aktywna uwaga, zaangażowanie | Sterowanie akcją, wskaźnik skupienia |
| **Gamma** (γ) | >30 Hz | Przetwarzanie sensoryczne, nauka | Wysokoczęstotliwościowe interakcje |

### Kluczowe wzorce dla neurogamingu

**SSVEP** (*Steady-State Visual Evoked Potential*) — wzrokowe potencjały wywołane:
```
Gracz patrzy na migający element UI (np. 15 Hz) → mózg synchronizuje się → 
detekcja EEG → wybór opcji menu bez dotyku ekranu
```

**P300** — potencjał związany ze zdarzeniem:
```
Niespodziewany bodziec (np. podświetlenie ikony) → 300 ms po bodźcu pojawia się 
charakterystyczna fala w EEG → identyfikacja, na co gracz zwrócił uwagę
```

**ERD/ERS** (*Event-Related Desynchronization/Synchronization*) — wyobraźnia motoryczna:
```
Gracz wyobraża sobie ruch lewą ręką → ERD w obszarze C3 EEG → 
interpretacja jako "skręć w lewo" w grze wyścigowej
```

---

## Technologie i sprzęt

### Nieinwazyjne EEG dla konsumentów (mobilne)

| Urządzenie | Elektrody | Łączność | Zastosowanie w grach |
|-----------|-----------|----------|---------------------|
| **Muse 2** | 4 (TP9, AF7, AF8, TP10) | Bluetooth | Medytacja, biofeedback |
| **NeuroSky MindWave Mobile 2** | 1 (FP1) | Bluetooth | Skupienie, relaks |
| **Emotiv Insight** | 5 | Bluetooth | Sterownie grą, emocje |
| **Emotiv EPOC X** | 14 | Wi-Fi/Bluetooth | Pełne mapowanie emocji |
| **OpenBCI Cyton** | 8–16 | Bluetooth/USB | Badania, DIY gaming |
| **Mendi** | 1 (prefrontal) | Bluetooth | Trening neurofeedbacku |

### Dodatkowe modalności w neurogamingu

```
┌─────────────────────────────────────────────────────────┐
│                    Multimodalny BCI                      │
│                                                          │
│  EEG ──────────────────────────────→ Aktywność mózgu    │
│  EMG (elektromiografia) ───────────→ Napięcie mięśni    │
│  EOG (elektrookulografia) ─────────→ Ruchy oczu         │
│  GSR (galvanic skin response) ─────→ Arousal, stres     │
│  PPG (fotopletizmografia) ─────────→ Tętno, HRV         │
│  Akcelerometr IMU ─────────────────→ Ruch głowy         │
└─────────────────────────────────────────────────────────┘
```

---

## Implementacja na urządzeniach mobilnych

### Android — połączenie z EEG przez Bluetooth

```kotlin
import android.bluetooth.BluetoothAdapter
import android.bluetooth.BluetoothDevice
import android.bluetooth.BluetoothSocket
import kotlinx.coroutines.*
import java.io.InputStream
import java.util.UUID

class EEGBluetoothManager(private val onDataReceived: (FloatArray) -> Unit) {

    private val SPP_UUID = UUID.fromString("00001101-0000-1000-8000-00805F9B34FB")
    private var socket: BluetoothSocket? = null
    private var inputStream: InputStream? = null
    private val scope = CoroutineScope(Dispatchers.IO + SupervisorJob())

    fun connect(device: BluetoothDevice) {
        scope.launch {
            try {
                socket = device.createRfcommSocketToServiceRecord(SPP_UUID)
                socket?.connect()
                inputStream = socket?.inputStream
                readLoop()
            } catch (e: Exception) {
                // Obsługa błędu połączenia
            }
        }
    }

    private suspend fun readLoop() {
        val buffer = ByteArray(256)
        while (true) {
            val bytesRead = inputStream?.read(buffer) ?: break
            val eegSamples = parseEEGPacket(buffer, bytesRead)
            withContext(Dispatchers.Main) {
                onDataReceived(eegSamples)
            }
        }
    }

    private fun parseEEGPacket(data: ByteArray, length: Int): FloatArray {
        // Parsowanie ramki danych EEG (format zależny od urządzenia)
        return FloatArray(length / 2) { i ->
            ((data[i * 2].toInt() shl 8) or data[i * 2 + 1].toInt()).toFloat()
        }
    }

    fun disconnect() {
        scope.cancel()
        socket?.close()
    }
}
```

### Podstawowy pipeline DSP (przetwarzanie sygnału EEG)

```kotlin
import kotlin.math.*

object EEGProcessor {

    private const val SAMPLE_RATE = 256  // Hz

    // Prosty filtr pasmowy (Butterworth 2. rzędu) — implementacja cyfrowa
    class BandpassFilter(private val lowCut: Double, private val highCut: Double) {
        private var x1 = 0.0; private var x2 = 0.0
        private var y1 = 0.0; private var y2 = 0.0

        fun process(sample: Double): Double {
            val omega1 = 2 * PI * lowCut / SAMPLE_RATE
            val omega2 = 2 * PI * highCut / SAMPLE_RATE
            val result = (sample + x1 * 2 + x2) * 0.25 -
                         y1 * (cos(omega1) + cos(omega2)) + y2 * 0.5
            x2 = x1; x1 = sample
            y2 = y1; y1 = result
            return result
        }
    }

    // Obliczenie mocy pasma przez FFT (uproszczone)
    fun bandPower(samples: DoubleArray, lowHz: Double, highHz: Double): Double {
        val n = samples.size
        var power = 0.0
        val lowBin = (lowHz * n / SAMPLE_RATE).toInt()
        val highBin = (highHz * n / SAMPLE_RATE).toInt()

        // Prosta DFT dla wybranego zakresu częstotliwości
        for (k in lowBin..highBin) {
            var re = 0.0; var im = 0.0
            for (t in samples.indices) {
                val angle = 2 * PI * k * t / n
                re += samples[t] * cos(angle)
                im -= samples[t] * sin(angle)
            }
            power += re * re + im * im
        }
        return power / (highBin - lowBin + 1)
    }

    // Wskaźnik skupienia (Attention Index)
    fun attentionIndex(samples: DoubleArray): Double {
        val beta = bandPower(samples, 13.0, 30.0)
        val theta = bandPower(samples, 4.0, 8.0)
        val alpha = bandPower(samples, 8.0, 13.0)
        return beta / (alpha + theta)  // wysoki wynik = skupienie
    }
}
```

### iOS — CoreBluetooth + przetwarzanie EEG w Swift

```swift
import CoreBluetooth
import Combine
import Accelerate

class EEGDeviceManager: NSObject, ObservableObject {
    private var centralManager: CBCentralManager!
    private var eegPeripheral: CBPeripheral?
    
    @Published var attentionLevel: Double = 0.0
    @Published var relaxationLevel: Double = 0.0
    
    private var sampleBuffer: [Double] = []
    private let bufferSize = 256  // 1 sekunda przy 256 Hz
    
    override init() {
        super.init()
        centralManager = CBCentralManager(delegate: self, queue: nil)
    }
    
    func processEEGSample(_ sample: Double) {
        sampleBuffer.append(sample)
        if sampleBuffer.count >= bufferSize {
            updateBrainMetrics(samples: sampleBuffer)
            sampleBuffer.removeFirst(bufferSize / 2)  // 50% overlap
        }
    }
    
    private func updateBrainMetrics(samples: [Double]) {
        let n = vDSP_Length(samples.count)
        var inputArray = samples
        
        // Zastosowanie okna Hanna przed FFT
        var window = [Double](repeating: 0, count: samples.count)
        vDSP_hann_windowD(&window, n, Int32(vDSP_HANN_DENORM))
        vDSP_vmulD(&inputArray, 1, window, 1, &inputArray, 1, n)
        
        // FFT przez Accelerate framework
        let log2n = vDSP_Length(log2(Double(samples.count)))
        guard let fftSetup = vDSP_create_fftsetupD(log2n, FFTRadix(kFFTRadix2)) else { return }
        
        var realPart = inputArray
        var imagPart = [Double](repeating: 0, count: samples.count)
        realPart.withUnsafeMutableBufferPointer { rPtr in
            imagPart.withUnsafeMutableBufferPointer { iPtr in
                var splitComplex = DSPDoubleSplitComplex(
                    realp: rPtr.baseAddress!, imagp: iPtr.baseAddress!
                )
                vDSP_fft_zipD(fftSetup, &splitComplex, 1, log2n, FFTDirection(kFFTDirection_Forward))
            }
        }
        vDSP_destroy_fftsetupD(fftSetup)
        
        // Obliczenie mocy pasm
        let betaPower = bandPower(real: realPart, imag: imagPart, low: 13, high: 30)
        let alphaPower = bandPower(real: realPart, imag: imagPart, low: 8, high: 13)
        let thetaPower = bandPower(real: realPart, imag: imagPart, low: 4, high: 8)
        
        DispatchQueue.main.async {
            self.attentionLevel = betaPower / (alphaPower + thetaPower)
            self.relaxationLevel = alphaPower / (betaPower + thetaPower)
        }
    }
    
    private func bandPower(real: [Double], imag: [Double], low: Int, high: Int) -> Double {
        let sampleRate = 256
        let lowBin = low * real.count / sampleRate
        let highBin = high * real.count / sampleRate
        var power = 0.0
        for i in lowBin..<highBin {
            power += real[i] * real[i] + imag[i] * imag[i]
        }
        return power / Double(highBin - lowBin)
    }
}
```

---

## Typy gier i mechaniki neurogamingowe

### 1. Gry neurofeedbackowe

Cel: gracz celowo reguluje własny stan neurologiczny, aby postępować w grze.

**Przykłady:**
- **NeuroRacer** (UCSF, 2013) — gra wyścigowa trenująca multitasking u seniorów; zmniejsza deficyty uwagi
- **Muse Calm** — utrzymanie fal alfa/theta przesuwa elementy ekranu, nagradzając relaks
- **BrainDriver** — sterowanie samochodem wyłącznie przez skupienie (wskaźnik beta EEG)

```
Stan skupienia gracza
        ↑
  HIGH  │████████
        │       ████
  MED   │           ████
        │               ████
  LOW   │                   ████
        └─────────────────────→ czas
              Poziom trudności gry dopasowuje się adaptacyjnie
```

### 2. Pasywne adaptacyjne gry BCI

Gra nie wymaga świadomego sterowania przez EEG, lecz monitoruje stan gracza i dostosowuje się:

- Wzrost stresu (beta ↑, GSR ↑) → gra spowalnia/ułatwia wyzwania
- Nuda (theta ↑, alpha ↑) → gra zwiększa trudność
- Zmęczenie (delta ↑) → pojawia się sugestia przerwy

**Implementacja adaptatywnej trudności:**

```kotlin
enum class PlayerState { FOCUSED, RELAXED, STRESSED, FATIGUED, BORED }

class AdaptiveDifficultyEngine {
    
    fun classifyState(eegFeatures: EEGFeatures): PlayerState {
        return when {
            eegFeatures.betaRatio > 2.0 && eegFeatures.gsrLevel > 0.7 -> PlayerState.STRESSED
            eegFeatures.deltaRatio > 1.5 -> PlayerState.FATIGUED
            eegFeatures.thetaAlphaRatio > 1.8 -> PlayerState.RELAXED
            eegFeatures.betaRatio > 1.5 && eegFeatures.alphaRatio < 0.8 -> PlayerState.FOCUSED
            else -> PlayerState.BORED
        }
    }
    
    fun adjustDifficulty(state: PlayerState, currentLevel: GameDifficulty): GameDifficulty {
        return when (state) {
            PlayerState.STRESSED  -> currentLevel.decrease()
            PlayerState.FATIGUED  -> currentLevel.decrease(2)
            PlayerState.BORED     -> currentLevel.increase()
            PlayerState.FOCUSED   -> currentLevel  // utrzymaj
            PlayerState.RELAXED   -> currentLevel.increase()
        }
    }
}
```

### 3. Hybrydy BCI + gesty/kontroler

Łączenie sygnałów mózgowych z tradycyjnymi metodami sterowania:

```
Kontroler (ruch fizyczny) + EEG (stan emocjonalny/skupienie)
    ↓
Fuzja decyzji → Naturalniejsza interakcja
```

Przykład: gracz używa touchpada do ruchu, lecz intensywność ataku zależy od jego skupienia (beta EEG).

---

## Neurogaming a neurorehabilitacja

Gry mobilne BCI znalazły zastosowanie kliniczne w rehabilitacji neurologicznej:

### Udar mózgu i paraliż

```
Pacjent wyobraża sobie ruch sparaliżowaną kończyną
    ↓ (ERD w paśmie mu/beta)
BCI wykrywa wzorzec wyobraźni ruchowej
    ↓
Egzoszkielet lub FES (functional electrical stimulation) wykonuje ruch
    ↓
Sprzężenie zwrotne sensoryczne dociera do mózgu
    ↓
Neuroplastyczność: nowe połączenia neuronalne
```

**Przykładowe systemy:**
- **NeuroTracker** — trening uwagi i przetwarzania wzrokowego
- **Mindmaze** — VR + EEG dla rehabilitacji po udarze
- **BrainFingers** — sterowanie kursorem dla osób z ALS/tetraplegią

### ADHD i zaburzenia uwagi

Protokoły neurofeedbacku terapeutycznego dla dzieci z ADHD:

| Protokół | Trening | Cel |
|----------|---------|-----|
| **Theta/Beta** | Redukcja theta, wzrost beta | Zwiększenie skupienia |
| **SMR** | Wzrost SMR (12–15 Hz) | Redukcja impulsywności |
| **Alpha** | Wzrost alpha w stanie spoczynku | Relaksacja, zmniejszenie lęku |
| **SCP** | Trening powolnych potencjałów korowych | Samoregulacja |

---

## Wyzwania i ograniczenia

### Problemy techniczne

```
Artefakty sygnału EEG:
├── Artefakty ruchowe (EMG mięśni twarzy/szczęki)
├── Artefakty oczu (mruganie: 10x silniejszy sygnał niż EEG)
├── Artefakty elektryczne (50/60 Hz sieć, WiFi)
└── Pot i zmiana impedancji elektrod przy długiej sesji

Przetwarzanie w czasie rzeczywistym:
├── Opóźnienie (latency) musi być < 300ms dla płynnej rozgrywki
├── Klasyfikatory ML wymagają kalibracji per-użytkownik (10-30 min)
└── Niestacjonarność sygnału EEG — model traci dokładność w czasie
```

### Wyzwania UX/ergonomiczne

- **Czas zakładania headsetów** — mokre elektrody do 15 min vs. suche 1–2 min
- **Komfort noszenia** — akceptowalność w długich sesjach gamingowych
- **Efekt nowości** — gracze wyłączają neurokontrole po pierwszej godzinie zabawy
- **Krzywa uczenia się** — sterowanie przez myśl wymaga tygodni treningu

### Kwestie etyczne i prywatności

> Dane EEG są jedną z najbardziej wrażliwych kategorii danych biometrycznych — mogą ujawniać predyspozycje neurologiczne, stany emocjonalne i potencjalnie diagnostyczne cechy chorób mózgu.

**Ochrona danych neuro:**
- RODO traktuje dane neurologiczne jako dane szczególnej kategorii (art. 9)
- Neurorights Foundation lobbuje za ustawowym prawem do „prywatności umysłu"
- Chile (2021) — pierwsze państwo z konstytucyjną ochroną danych neurologicznych

---

## Rynek i perspektywy

### Dane rynkowe (2024)

| Segment | Wartość rynku | CAGR (2024–2030) |
|---------|--------------|-----------------|
| BCI gaming (ogółem) | ~$1.8 mld | ~18% |
| Neurofeedback kliniczny | ~$0.9 mld | ~22% |
| Mobilne aplikacje EEG | ~$0.3 mld | ~31% |
| VR/AR + BCI | ~$0.6 mld | ~28% |

### Kierunki rozwoju

**Miniaturyzacja i bezprzewodowość:**
- Urządzenia EEG zintegrowane z słuchawkami sportowymi (forma faktora: AirPods)
- EEG-embedded w oprawkach okularów AR (projekty: Meta, Apple Research)

**AI i uczenie maszynowe w klasyfikacji:**

```python
# Przykład klasyfikatora EEG z EEGNet (PyTorch Mobile)
import torch
import torch.nn as nn

class EEGNet(nn.Module):
    """
    EEGNet: kompaktowa architektura CNN do klasyfikacji sygnałów EEG.
    Zaprojektowana do wdrożenia na urządzeniach mobilnych (mała liczba parametrów).
    """
    def __init__(self, n_classes=4, channels=8, samples=256):
        super().__init__()
        self.temporal_filter = nn.Sequential(
            nn.Conv2d(1, 8, (1, 64), padding=(0, 32), bias=False),
            nn.BatchNorm2d(8)
        )
        self.depthwise = nn.Sequential(
            nn.Conv2d(8, 16, (channels, 1), groups=8, bias=False),
            nn.BatchNorm2d(16),
            nn.ELU(),
            nn.AvgPool2d((1, 4)),
            nn.Dropout(0.5)
        )
        self.separable = nn.Sequential(
            nn.Conv2d(16, 16, (1, 16), padding=(0, 8), bias=False),
            nn.BatchNorm2d(16),
            nn.ELU(),
            nn.AvgPool2d((1, 8)),
            nn.Dropout(0.5)
        )
        self.classifier = nn.Linear(16 * (samples // 32), n_classes)
    
    def forward(self, x):
        x = self.temporal_filter(x)
        x = self.depthwise(x)
        x = self.separable(x)
        x = x.flatten(1)
        return self.classifier(x)

# Eksport do TorchScript / TFLite dla Android/iOS
model = EEGNet(n_classes=4, channels=8, samples=256)
scripted = torch.jit.script(model)
scripted.save("eegnet_mobile.pt")
```

**Nowe paradygmaty sterowania:**

| Paradygmat | Zasada | Status (2025) |
|-----------|--------|--------------|
| **SSVEP** | Wzrokowe potencjały wywołane | Dojrzały, komercyjny |
| **P300** | Potencjał zaskoczenia | Dojrzały, kliniczny |
| **Motor Imagery** | Wyobraźnia ruchowa | Dojrzały, wymaga kalibracji |
| **Steady-State MEG** | Magnetoencefalografia | Laboratoryjny |
| **fNIRS gaming** | Bliska podczerwień | Eksperymentalny |
| **Ultrasound BCI** | Ultrasonografia funkcjonalna | Wczesny etap |

---

## Projekty open-source i SDK

### Biblioteki mobilne do neurogamingu

| Projekt | Język | Platforma | Zastosowanie |
|---------|-------|-----------|--------------|
| **BrainFlow** | C++/Python/Java/Kotlin/Swift | Android, iOS | Uniwersalny SDK do EEG |
| **OpenBCI GUI** | Processing/Java | Desktop+Android | Wizualizacja EEG |
| **MNE-Python** | Python | Cross-platform | Analiza EEG (batch) |
| **EEGrunt** | Python | Cross-platform | Analiza plików EEG |
| **Muse SDK** | Swift/Kotlin | iOS/Android | Dedykowany dla Muse |

### Przykład użycia BrainFlow na Androidzie

```kotlin
// build.gradle
dependencies {
    implementation("org.brainflow:brainflow:5.12.0")
}

// Połączenie z urządzeniem EEG przez BrainFlow
import brainflow.BoardIds
import brainflow.BoardShim
import brainflow.BrainFlowInputParams

class NeurogamingSession {
    private lateinit var boardShim: BoardShim
    
    fun start(macAddress: String) {
        val params = BrainFlowInputParams().apply {
            mac_address = macAddress
        }
        boardShim = BoardShim(BoardIds.MUSE_2_BOARD.value, params)
        boardShim.prepareSession()
        boardShim.startStream()
    }
    
    fun getLatestEEG(): Array<DoubleArray> {
        val numSamples = 256  // ostatnia sekunda danych
        return boardShim.getBoardData(numSamples)
    }
    
    fun stop() {
        boardShim.stopStream()
        boardShim.releaseSession()
    }
}
```

---

## Podsumowanie

Neurogaming łączy neuronaukę, inżynierię sygnałów, sztuczną inteligencję i projektowanie gier w jedną z najbardziej interdyscyplinarnych dziedzin współczesnej technologii. Urządzenia mobilne stają się naturalnym środowiskiem dla aplikacji BCI dzięki powszechności smartfonów, Bluetooth Low Energy i wzrostowi mocy obliczeniowej chipów ARM.

Kluczowe obszary do opanowania dla dewelopera neurogamingu:

1. **Przetwarzanie sygnałów** — filtracja, FFT, ekstrakcja cech czasowo-częstotliwościowych
2. **Uczenie maszynowe** — klasyfikacja EEG (EEGNet, ShallowConvNet, FBCSP)
3. **Protokoły BCI** — SSVEP, P300, Motor Imagery
4. **Android/iOS BLE** — niskolatencyjny odbiór danych z headsetów EEG
5. **UX w grach z BCI** — projektowanie z uwzględnieniem opóźnień i zmienności sygnału

---

## Linki

- [BrainFlow — Open-source BCI SDK](https://brainflow.org)
- [OpenBCI — sprzęt open source](https://openbci.com)
- [MNE-Python — analiza EEG](https://mne.tools)
- [EEGNet — kompaktowa CNN dla EEG](https://arxiv.org/abs/1611.08024)
- [Neurorights Foundation](https://neurorightsfoundation.org)
- [Unity NeuroSky Integration](https://store.neurosky.com/pages/unity)
- [IEEE BCI Society](https://bcisociety.org)
