# MobileHub

MobileHub to statyczna aplikacja PWA zawierająca materiały do zajęć z programowania aplikacji mobilnych. Główną częścią projektu jest PAM Wiki, która udostępnia artykuły, wykłady, quizy i materiały do pobrania.

## Szybki start

Wymagane są Node.js 18 lub nowszy oraz npm 9 lub nowszy.

```bash
npm install
npx serve .
```

Po uruchomieniu serwera otwórz adres podany w terminalu. Nie otwieraj `index.html` bezpośrednio z dysku, ponieważ Service Worker i część żądań wymagają serwera HTTP.

## Kontrola jakości

Pełny zestaw lokalnych walidatorów uruchomisz jednym poleceniem:

```bash
npm run qa
```

Pełny zestaw testów E2E:

```bash
npm run test:e2e
```

Podstawowy test E2E:

```bash
npm run test:e2e:smoke
```

Samą strukturę katalogów i lokalne ścieżki można sprawdzić bez instalowania zależności Node.js:

```bash
npm run validate:structure
# albo bezpośrednio:
python3 scripts/validate-repository-structure.py
```

## Struktura repozytorium

- `index.html` i `offline.html`: publiczne punkty wejścia witryny;
- `src/`: moduły JavaScript, adaptery wejściowe i fragmenty interfejsu;
- `wiki/`: artykuły PAM Wiki w formacie Markdown;
- `assets/`: arkusze stylów, obrazy, ikony i pozostałe zasoby statyczne;
- `pages/`: dodatkowe strony pogrupowane według przeznaczenia;
- `data/`: lokalne dane JSON używane przez aplikację;
- `database/`: skrypty i migracje bazy danych;
- `zajecia/`: wykłady, laboratoria oraz materiały dydaktyczne;
- `tests/`: testy jednostkowe i E2E;
- `scripts/`: walidatory i narzędzia pomocnicze;
- `docs/`: dokumentacja techniczna i [backlog projektu](docs/TODO.md).


## Zmiana adresów po reorganizacji

Reorganizacja zmieniła adresy dodatkowych stron. Projekt nie utrzymuje pustych plików przekierowujących w katalogu głównym. Odsyłacze wewnętrzne i dokumentacja korzystają z nowych lokalizacji.

| Poprzedni adres | Nowy adres |
| --- | --- |
| `test.html` | `pages/exams/test.html` |
| `zal.html` | `pages/exams/zal.html` |
| `zal_sesje.html` | `pages/exams/zal_sesje.html` |
| `studenci.html` | `pages/community/studenci.html` |
| `pierwsza-aplikacja.html` | `pages/guides/pierwsza-aplikacja.html` |
| `projektowanie-aplikacji.html` | `pages/guides/projektowanie-aplikacji.html` |
| `obrona_projektu.html` | `pages/guides/obrona_projektu.html` |

## Dokumentacja

- [Wprowadzenie dla programistów](docs/developer-onboarding.md)
- [Przepływ pracy](docs/developer-workflow.md)
- [Architektura frontendu](docs/architecture-frontend.md)
- [PWA i tryb offline](docs/developer-pwa-offline.md)
- [Konfiguracja Supabase](docs/supabase-setup.md)
- [Zasady współtworzenia projektu](CONTRIBUTING.md)

## Licencja

Warunki korzystania z projektu opisuje plik [LICENSE](LICENSE).
