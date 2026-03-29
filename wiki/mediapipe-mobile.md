# MediaPipe — kompleksowe rozwiązania AI

> Artykuł w przygotowaniu.

Ten artykuł omówi MediaPipe — framework Google do budowy wielomodalnych potoków AI na Androidzie, iOS i w przeglądarce. Opisane zostaną gotowe rozwiązania (Tasks API), architektura potoków, integracja z Jetpack Compose i SwiftUI oraz tworzenie własnych komponentów.

## Zagadnienia

- MediaPipe Tasks API — przegląd dostępnych tasków (Vision, Text, Audio)
- Face Detection i Face Landmarker — detekcja i 478 punktów twarzy
- Hand Landmarker — śledzenie 21 punktów dłoni w czasie rzeczywistym
- Pose Landmarker — wykrywanie 33 punktów postawy ciała
- Image Segmentation — segmentacja tła w czasie rzeczywistym
- Object Detection — detekcja z klasyfikacją
- Text Classification i Language Detection
- Audio Classification — klasyfikacja dźwięków
- LLM Inference API — lokalne modele językowe przez MediaPipe
- Integracja z CameraX (Android) i AVFoundation (iOS)
- Tworzenie własnych potoków w C++ i Kotlin/Swift
- Profilowanie potoku MediaPipe: Visualizer i logi klatek
