# PWA i Offline – notatki developerskie

## Kluczowe pliki
- `manifest.json`
- `sw.js`
- `offline.html`
- `sw-manual-checklist.md`

## Co weryfikować po zmianach
- Instalowalność aplikacji.
- Działanie `start_url` przy braku sieci po wcześniejszym otwarciu online.
- Poprawne odświeżenie zasobów po publikacji nowej wersji.

## Minimalny smoke-check
1. Otwórz aplikację online i poczekaj na aktywację SW.
2. Przejdź w tryb offline w DevTools.
3. Odśwież `start_url` i potwierdź, że ładuje się właściwa zawartość aplikacji (np. `#mainContent`), a wskaźnik pokazuje `Tryb offline`.
4. Wróć online i sprawdź, że wskaźnik wraca do stanu `Online`.
