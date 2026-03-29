# Wnioskowanie lokalne — architektura i wydajność

> Artykuł w przygotowaniu.

Ten artykuł omówi architekturę potoku wnioskowania (*inference pipeline*) w aplikacji mobilnej: od załadowania modelu, przez preprocessing danych wejściowych i wykonanie sesji, aż po postprocessing wyników. Szczegółowo opisane zostaną strategie optymalizacji latencji i przepustowości.

## Zagadnienia

- Anatomia potoku wnioskowania: load → preprocess → run → postprocess
- Zarządzanie cyklem życia modelu: kiedy ładować, kiedy zwalniać
- Asynchroniczne wnioskowanie: Coroutines (Android) i async/await (iOS)
- Batch processing vs single-sample — kiedy warto grupować
- Pipelining: równoległe preprocessing i wnioskowanie
- Ciepłe i zimne uruchomienie (warm-up run) — wpływ na benchmarki
- Profilowanie: Android Studio Profiler, Xcode Instruments, TFLite Benchmark Tool
- Zarządzanie wątkami: tyle wątków ile rdzeni wydajnościowych CPU
- Wpływ temperatury urządzenia na throttling NPU/GPU
- Strategia fallback: NPU → GPU → CPU
