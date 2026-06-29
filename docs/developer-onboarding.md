# Wprowadzenie dla programistów

## Cel

Ten dokument ułatwia rozpoczęcie pracy nad aplikacją MobileHub i PAM Wiki.

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
   ```

3. Otwórz adres podany w terminalu.

## Kontrola przed commitem

```bash
npm run qa
```

## Główne obszary kodu

- `index.html`: główny punkt wejścia;
- `src/entries/pam-wiki.js`: uruchomienie głównej logiki aplikacji;
- `src/`: moduły interfejsu, routingu, wyszukiwania i materiałów;
- `tests/`: testy jednostkowe i E2E;
- `wiki/`: treści w formacie Markdown;
- `docs/`: dokumentacja techniczna i backlog.

Szczegółowe zasady pracy opisuje dokument [Przepływ pracy](developer-workflow.md).
