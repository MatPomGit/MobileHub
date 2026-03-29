# Wprowadzenie do lokalnej AI na urządzeniu mobilnym

Lokalna AI (*on-device AI*, *edge AI*) to paradygmat, w którym modele uczenia maszynowego wykonywane są bezpośrednio na urządzeniu końcowym — smartfonie lub tablecie — bez wysyłania danych do chmury. Podejście to zyskuje szybko na popularności i staje się standardem w nowoczesnych aplikacjach mobilnych.

## Czym jest lokalna AI

Tradycyjne podejście do AI w aplikacjach mobilnych polegało na wysłaniu danych (zdjęcia, tekstu, głosu) do serwera w chmurze, wykonaniu wnioskowania po stronie serwera i odesłaniu wyniku. Lokalna AI odwraca ten schemat: cały proces od pobrania danych wejściowych aż po wynik odbywa się na samym urządzeniu.

### Modele wdrażane lokalnie

| Typ modelu | Przykłady zastosowań | Typowy rozmiar |
|---|---|---|
| Klasyfikacja obrazów | Wykrywanie obiektów, filtr treści | 1–10 MB |
| Detekcja obiektów | Rozpoznawanie twarzy, skanowanie QR | 5–25 MB |
| Modele językowe (sLLM) | Autokorekta, streszczanie, chatbot | 200 MB–2 GB |
| Przetwarzanie mowy (STT/TTS) | Dyktowanie, asystent głosowy | 20–100 MB |
| Analiza sentymentu | Ocena opinii, analiza emocji | 1–5 MB |
| Segmentacja semantyczna | Filtr tła w kamerze, AR | 3–15 MB |

## Dlaczego lokalna AI

### Prywatność i suwerenność danych

Dane użytkownika — zdjęcia, fragmenty tekstu, nagrania głosowe — nigdy nie opuszczają urządzenia. Ma to kluczowe znaczenie w zastosowaniach medycznych, finansowych i wszędzie tam, gdzie obowiązują regulacje RODO/GDPR.

### Brak opóźnień sieciowych

Latencja wnioskowania lokalnego to zwykle **5–30 ms**, podczas gdy wywołanie API chmurowego to minimum **200–500 ms** (z uwzględnieniem czasu DNS, TLS handshake i transferu danych). Dla zastosowań czasu rzeczywistego (AR, asystent głosowy) ta różnica jest decydująca.

### Działanie offline

Aplikacja działa w pełni bez dostępu do internetu — w tunelu metra, w samolocie, w obszarze z ograniczonym zasięgiem. Nie ma też ryzyka przerwy spowodowanej awarią serwisu zewnętrznego.

### Koszty operacyjne

Brak wywołań API eliminuje koszty związane z płatnymi usługami chmurowymi (np. OpenAI API, Google Vision API). Po jednorazowym pobraniu modelu użytkownik może wykonywać dowolną liczbę operacji bez opłat.

### Odporność na cenzurę i regulacje geopolityczne

Lokalne modele działają niezależnie od dostępności zewnętrznych serwisów, co ma znaczenie w regionach z ograniczonym dostępem do usług globalnych.

## Ekosystem: kluczowe komponenty

Wdrożenie lokalnej AI wymaga współpracy kilku warstw:

```
┌─────────────────────────────────┐
│         Aplikacja               │  ← Kotlin / Swift / Flutter
├─────────────────────────────────┤
│       Framework ML              │  ← TFLite / Core ML / ONNX Runtime
├─────────────────────────────────┤
│   Delegate / Acceleration API   │  ← NNAPI / Metal / ANE / Hexagon DSP
├─────────────────────────────────┤
│     Sprzęt (CPU / GPU / NPU)    │  ← Snapdragon / Apple Silicon / Tensor
└─────────────────────────────────┘
```

### Frameworki wnioskowania (inference runtimes)

- **TensorFlow Lite** — najpowszechniej stosowany na Androidzie, obsługuje też iOS; modele w formacie `.tflite`
- **Core ML** — natywny framework Apple (iOS, macOS, watchOS); modele `.mlpackage` / `.mlmodel`
- **ONNX Runtime Mobile** — open-source, wieloplatformowy; modele `.onnx`
- **PyTorch Mobile / ExecuTorch** — dedykowany dla modeli trenowanych w PyTorch; modele `.pte`
- **MediaPipe** — zestaw gotowych potoków AI od Google (twarz, dłonie, poza, tekst)
- **Samsung One UI AI** / **Qualcomm AI Engine Direct** — SDK specyficzne dla producentów

### Jednostki obliczeniowe

| Jednostka | Skrót | Rola w AI |
|---|---|---|
| Neural Processing Unit | NPU | Dedykowana operacjom tensorowym, najwyższa efektywność energetyczna |
| Digital Signal Processor | DSP | Skuteczny dla operacji stałoprzecinkowych i audio |
| Graphics Processing Unit | GPU | Szybkie operacje równoległe, dobry dla modeli z float16/float32 |
| Central Processing Unit | CPU | Fallback, dostępny zawsze, najniższa wydajność |

## Kluczowe platformy sprzętowe

### Qualcomm Snapdragon (Android)

Układy Snapdragon posiadają dedykowany **Hexagon NPU** z mocą obliczeniową do 75 TOPS (Snapdragon 8 Elite). Qualcomm dostarcza **AI Engine Direct SDK** oraz integrację z ONNX Runtime i TFLite poprzez **QNN Delegate**.

```
Snapdragon 8 Elite (2024):
- Hexagon NPU: 75 TOPS
- Adreno GPU: 40+ TOPS (INT8)
- Kryo CPU: 8 rdzeni (3.0 GHz)
```

### Apple Silicon — Neural Engine (iOS)

Apple Neural Engine (ANE) jest dostępny od iPhone XS (A12 Bionic). Najnowsze układy osiągają:

| Układ | TOPS | Dostępny od |
|---|---|---|
| A12 Bionic | 5 | iPhone XS (2018) |
| A15 Bionic | 15.8 | iPhone 13 (2021) |
| A17 Pro | 35 | iPhone 15 Pro (2023) |
| A18 Pro | 38 | iPhone 16 Pro (2024) |

### Google Tensor (Pixel)

Układy Google Tensor zawierają dedykowany TPU oraz układ Titan M2 do bezpiecznego przetwarzania danych biometrycznych i prywatnych operacji AI.

### MediaTek Dimensity

Układy Dimensity posiadają APU (AI Processing Unit) — od APU 3.0 do APU 590 w flagowych chipach z mocą 35+ TOPS.

## Przegląd przypadków użycia

### Asystent głosowy

Lokalne modele STT (Speech-to-Text) pozwalają na dyktowanie tekstu i sterowanie głosem bez wysyłania nagrań do chmury. Apple Siri działa lokalnie dla wielu zapytań od iOS 17. Android oferuje **On-Device Speech Recognition API**.

### Aparaty i fotografia obliczeniowa

Wszystkie nowoczesne smartfony używają AI lokalnie do:
- redukcji szumów (`night mode`)
- wykrywania i śledzenia twarzy podczas autofokusu
- segmentacji tła (Portrait Mode / Blur)
- poprawy jakości obrazu (Super Resolution)
- HDR i balans bieli

### Klawiatura i autokorekta

Google Gboard oraz klawiatura Apple wykorzystują lokalne modele NLP do predykcji słów, autokorekty i adaptacji do stylu pisania użytkownika — bez wysyłania wpisywanego tekstu.

### Rozpoznawanie tekstu (OCR)

**Google ML Kit Text Recognition v2** oraz **Vision Framework** Apple potrafią w czasie rzeczywistym rozpoznawać tekst z kamery: paragon, tablica rejestracyjna, menu restauracji.

### Lokalne LLM (mały model językowy)

Modele rzędu 1–4B parametrów (Gemma 2, Llama 3.2, Phi-3 Mini) po kwantyzacji do INT4/INT8 działają płynnie na flagowych smartfonach. Umożliwiają:
- asystenta w aplikacji działającego offline
- streszczanie dokumentów
- tłumaczenie na urządzeniu
- personalizowany chatbot bez dostępu do internetu

## Wyzwania i ograniczenia

### Rozmiar modelu i pamięć RAM

Każdy model musi być załadowany do pamięci RAM. Flagowy smartfon dysponuje zwykle 8–16 GB RAM, z czego OS i aplikacje zajmują 3–5 GB. Modele należy dobierać tak, by zmieściły się w dostępnej puli.

### Zużycie energii

Intensywne wnioskowanie na NPU/GPU może rozładować baterię kilkukrotnie szybciej niż normalne użytkowanie. Dobrze zaprojektowane aplikacje AI korzystają z **batch processing** i unikają ciągłego wnioskowania, gdy nie jest potrzebne.

### Czas zimnego startu

Załadowanie modelu do pamięci (cold start) może trwać 200–500 ms dla małych modeli i kilka sekund dla dużych LLM. Strategie łagodzenia:
- ładowanie modelu przy starcie aplikacji w tle
- ponowne użycie załadowanego modelu (pool instancji)
- segmentacja modelu na mniejsze bloki

### Fragmentacja sprzętowa (Android)

W odróżnieniu od iOS, na Androidzie producenci dostarczają różne implementacje NNAPI. Nie każde urządzenie obsługuje wszystkie operatory w przyspieszonym trybie. Frameworki muszą automatycznie cofać się do CPU dla nieobsługiwanych warstw.

### Aktualizacja modeli

Model wbudowany w APK wymaga aktualizacji całej aplikacji. Alternatywa to pobieranie modelu po zainstalowaniu (np. przez **Play Feature Delivery** lub własne CDN), co komplikuje zarządzanie wersjami.

## Narzędzia deweloperskie

### Android

```kotlin
// Sprawdzenie dostępności NNAPI
val manager = context.getSystemService(NeuralNetworksManager::class.java)
val devices = manager.devices
devices.forEach { device ->
    Log.d("AI", "${device.name} type=${device.type} perf=${device.performanceInfo}")
}
```

### iOS

```swift
// Sprawdzenie dostępności Neural Engine
import CoreML

let config = MLModelConfiguration()
config.computeUnits = .cpuAndNeuralEngine   // lub .all, .cpuAndGPU

// Załadowanie modelu z odpowiednim konfiguratorem
let model = try MyModel(configuration: config)
```

### Profilowanie — Android Studio

Android Studio ML Model Binding i zakładka **Energy Profiler** + **CPU Profiler** pozwalają ocenić:
- ile czasu zajmuje wnioskowanie na każdej warstwie
- ile energii zużywa model per wywołanie
- jakie dele­gaty (NNAPI, GPU) są aktywnie używane

### Profilowanie — Xcode

Xcode **Core ML Performance Report** (dostępny przez `MLModel.featureDescriptions` i instrumenty) oraz **Instruments → Neural Engine** w Xcode 15+ pokazuje użycie ANE w czasie rzeczywistym.

## Trendy i kierunki

| Trend | Opis |
|---|---|
| Małe modele językowe (sLLM) | Modele 1–7B parametrów przeznaczone do urządzeń brzegowych |
| Multimodalność | Modele łączące tekst, obraz i audio w jednym potoku |
| Personalizacja federacyjna | Modele dostosowywane lokalnie bez ujawniania danych (Federated Learning) |
| Kompresja modeli | Kwantyzacja, przycinanie (pruning), destylacja wiedzy |
| Sprzętowe akceleratory 2. generacji | NPU z obsługą float8, sparsity, attention offload |
| Standardy wymiany modeli | ONNX, AI Model Format, Samsung AI Model Format |

## Podsumowanie

Lokalna AI na urządzeniu mobilnym przestała być niszą — stała się oczekiwaną funkcją nowoczesnych aplikacji. Zrozumienie ekosystemu (frameworki, akceleratory, formaty modeli) oraz świadomość ograniczeń (pamięć, energia, cold start) to niezbędna wiedza dla dewelopera aplikacji mobilnych. Kolejne artykuły w tym rozdziale szczegółowo omawiają poszczególne frameworki, typy modeli i zagadnienia optymalizacji.

## Zobacz też

- [Frameworki ML na urządzeniu: TFLite, Core ML, ONNX](#mobile-ml-frameworks)
- [Kwantyzacja i optymalizacja modeli AI](#model-quantization)
- [Wnioskowanie lokalne — architektura i wydajność](#on-device-inference)
- [MediaPipe — kompleksowe rozwiązania AI](#mediapipe-mobile)
