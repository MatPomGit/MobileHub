# Materiały — zasady edycji danych

Plik źródłowy danych: `src/materials/materials-data.js`.

## Wymagany shape wpisów

### `FILES_DATA[].files[]`
Każdy wpis musi mieć niepuste pola typu `string`:
- `href`
- `type`
- `label`

### `LIVE_MATERIALS_DATA[].files[]`
Każdy wpis musi mieć niepuste pola typu `string`:
- `livePath`
- `title`

Pole `pdfPath` jest opcjonalne, ale jeśli występuje — również musi być niepustym stringiem.

## Walidacja ścieżek zasobów

Walidator sprawdza istnienie lokalnych plików wskazywanych przez:
- `href`
- `livePath`
- `pdfPath`

Brak pliku lub niepoprawny shape kończy walidację kodem błędu (`exit 1`), co blokuje commit/push/CI.

## Jak uruchomić

```bash
npm run validate:materials
```

Skrypt: `scripts/validate-material-links.js`.

## Granice odpowiedzialności modułów

- `src/entries/pam-files.js` odpowiada wyłącznie za inicjalizację sekcji materiałów (`renderDownloadMaterials`, `renderLiveMaterials`, `initPresentationPreview`).
- Wyszukiwarka wiki (`#wikiSearch`, `.wiki-category`) należy do warstwy wiki i jest utrzymywana w `src/wiki-search.js`.
- Inicjalizacja wyszukiwarki wiki uruchamiana jest przez ścieżkę wiki (`src/entries/pam-wiki.js`), wywoływaną z `src/app-init.js` przez `initWiki()`.
