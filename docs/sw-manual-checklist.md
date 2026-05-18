# SW manual checklist

Krótka lista kontroli do ręcznego sprawdzenia po zmianach związanych z PWA/Service Workerem.

## Przed testem
- [ ] Uruchom aplikację lokalnie w trybie produkcyjnym (lub środowisku zbliżonym do produkcji).
- [ ] Wyczyść poprzedni Service Worker oraz cache przeglądarki (Application → Clear storage).
- [ ] Otwórz DevTools (Application + Network).

## Instalowalność i rejestracja SW
- [ ] `manifest.json` ładuje się bez błędów.
- [ ] Service Worker rejestruje się poprawnie i przechodzi do stanu `activated`.
- [ ] Aplikacja spełnia podstawowe warunki instalowalności (ikona, nazwa, start URL, HTTPS/localhost).

## Scenariusz offline (po wcześniejszym wejściu online)
- [ ] Wejdź na stronę online i poczekaj na zakończenie cache’owania.
- [ ] Przełącz Network na `Offline`.
- [ ] Odśwież stronę – aplikacja lub fallback offline działa.
- [ ] `start_url` działa offline po wcześniejszym otwarciu online.

## Aktualizacja i odświeżanie zasobów
- [ ] Po publikacji nowej wersji nowy SW jest wykrywany.
- [ ] Zasoby statyczne odświeżają się zgodnie z przyjętą strategią cache.
- [ ] Nie ma „utkniętej” starej wersji UI po twardym odświeżeniu i ponownym otwarciu.

## Recovery po powrocie sieci
- [ ] Po przejściu z `Offline` na `Online` aplikacja odzyskuje połączenie.
- [ ] Krytyczne requesty/API działają ponownie bez ręcznej interwencji użytkownika.

## Szybki log testu (opcjonalnie)
- Data:
- Commit/wersja:
- Przeglądarka:
- Wynik:
- Uwagi:
