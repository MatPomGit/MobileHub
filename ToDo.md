## Zadania

- [x] Dodać artykuł o https://ai.google.dev/edge/litert-lm/android?hl=pl
- [x] Dodać artykuł o https://ai.google.dev/edge/litert/next/litert_lm_npu?hl=pl#NPU
- [x] Dodać artykuł o https://maven.google.com/web/m_index.html

## Walidacja materiałów przed publikacją

Uruchom przed publikacją:

```bash
node scripts/validate-material-links.js
```

Skrypt sprawdza linki z konfiguracji materiałów `download` i `live`, a przy brakującym pliku kończy działanie z kodem błędu 1.
