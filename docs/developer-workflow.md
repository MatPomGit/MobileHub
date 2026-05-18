# Developer Workflow

## Standard pracy
1. Utwórz branch roboczy.
2. Wprowadź zmianę z minimalnym zakresem.
3. Dodaj lub zaktualizuj testy.
4. Uruchom QA lokalnie.
5. Zaktualizuj dokumentację w `docs/`.
6. Przygotuj commit i PR z opisem zakresu oraz ryzyk.

## QA
Główna bramka jakości:
```bash
npm run qa
```

Jeśli E2E Playwright nie startują, doinstaluj przeglądarki:
```bash
npx playwright install --with-deps
```

## Definicja gotowości zmiany
- Brak regresji funkcjonalnej.
- QA przechodzi lub jest uzasadniona blokada środowiskowa.
- Dokumentacja techniczna w `docs/` odzwierciedla zmianę.
