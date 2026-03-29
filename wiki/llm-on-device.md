# Modele językowe LLM na urządzeniu mobilnym

> Artykuł w przygotowaniu.

Ten artykuł omówi wdrażanie dużych i małych modeli językowych (LLM / sLLM) bezpośrednio na smartfonie: od wyboru modelu, przez kwantyzację, aż po integrację z aplikacją mobilną przy użyciu bibliotek takich jak llama.cpp, MLC LLM, MediaPipe LLM Inference API czy Apple Intelligence.

## Zagadnienia

- Czym są sLLM (small LLM) i dlaczego nadają się na mobile
- Przegląd modeli: Gemma 2 (2B/9B), Llama 3.2 (1B/3B), Phi-3 Mini, Mistral 7B
- Formaty modeli: GGUF, ExecuTorch (.pte), MediaPipe Task
- llama.cpp — wnioskowanie LLM w C++ na Androidzie i iOS
- MLC LLM — kompilacja modeli na GPU mobile
- MediaPipe LLM Inference API — Google's on-device LLM pipeline
- Apple Intelligence — on-device LLM w ekosystemie Apple
- Zarządzanie kontekstem i pamięcią (KV cache) w środowisku mobilnym
- Streamowanie tokenów do UI (Kotlin Flow / Swift AsyncStream)
