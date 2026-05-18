# Developer Onboarding (MobileHub)

## Cel
Ten dokument opisuje szybki onboarding techniczny dla osób rozwijających aplikację MobileHub/PAM Wiki.

## Wymagania
- Node.js 18+ (LTS)
- npm 9+

## Szybki start
1. Zainstaluj zależności:
   ```bash
   npm install
   ```
2. Uruchom aplikację lokalnie:
   ```bash
   npx serve .

## Co warto uruchomić przed commitem
```bash
npm run qa
```

## Główne obszary kodu
- `index.html` – punkt wejścia.
- `pam-wiki.js` – główna logika aplikacji.
- `src/` – moduły pomocnicze UI/router/sidebar/search/materials.
- `tests/` – testy jednostkowe i E2E.
- `wiki/` – treści markdown.
