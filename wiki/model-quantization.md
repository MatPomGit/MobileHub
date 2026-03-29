# Kwantyzacja i optymalizacja modeli AI

> Artykuł w przygotowaniu.

Ten artykuł omówi techniki redukcji rozmiaru i przyspieszenia modeli AI przeznaczonych na urządzenia mobilne: kwantyzację wagową, kwantyzację aktywacji, przycinanie (pruning) sieci, destylację wiedzy oraz techniki kompilacji i fuzji warstw.

## Zagadnienia

- Dlaczego kwantyzacja jest koniecznością na mobile
- Post-Training Quantization (PTQ): INT8, INT4, mieszana precyzja
- Quantization-Aware Training (QAT) — trening z symulowaną kwantyzacją
- Kwantyzacja w TFLite: `tf.lite.Optimize.DEFAULT` vs FULL_INT8 vs FLOAT16
- Kwantyzacja w Core ML: `coremltools.optimize` — linear, palettization, pruning
- Narzędzia ONNX: `onnxruntime.quantization`
- Pruning (przycinanie) — usuwanie nieistotnych wag i neuronów
- Knowledge Distillation — model uczeń uczący się od modelu nauczyciela
- Operator fusion i graph optimization — fuzja warstw w inference runtime
- Pomiar jakości po kompresji: accuracy drop, perplexity, mAP
