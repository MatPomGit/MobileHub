# Contributing

- Do not commit dependencies from the node_modules/ directory to the repository.

## QA gates (lokalnie i CI)

Uruchamiaj jeden punkt wejścia:

```bash
npm run qa
```

Kolejność kroków (fail-fast):

1. `validate-material-links.js` — waliduje kontrakt danych materiałów i poprawność ścieżek.
2. `validate-live-lectures.js` — waliduje integralność danych i metadanych wykładów live.
3. `validate-mobile-layout-smoke.js` — szybka walidacja bazowego układu mobilnego.
4. `test:e2e:smoke` / `test:e2e:smoke:ci` — smoke E2E; w CI automatycznie używany wariant `:ci`.

Skrypt kończy działanie na pierwszym błędzie i wypisuje czytelny komunikat etapu, który nie przeszedł.

