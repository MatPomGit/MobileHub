# Współtworzenie projektu

- Nie dodawaj do repozytorium zależności z katalogu `node_modules/`.
- Przed rozpoczęciem pracy zapoznaj się z [instrukcją dla programistów](docs/developer-onboarding.md) i [przepływem pracy](docs/developer-workflow.md).
- Zmiany funkcjonalne uzupełniaj testem albo opisem możliwego do powtórzenia scenariusza weryfikacji.

## Kontrola jakości

Uruchom wspólny punkt wejścia dla lokalnych walidatorów i kontroli CI:

```bash
npm run qa
```

Podstawowe testy E2E możesz uruchomić osobno:

```bash
npm run test:e2e:smoke
```
