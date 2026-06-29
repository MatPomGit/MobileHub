# Manualna checklista testów Service Workera

Lista ręcznych kontroli po zmianach związanych z PWA lub Service Workerem.

## Przed testem

- [ ] Uruchom aplikację lokalnie w trybie produkcyjnym lub w środowisku zbliżonym do produkcyjnego.
- [ ] Wyczyść poprzedni Service Worker oraz pamięć podręczną przeglądarki (`Application` > `Clear storage`).
- [ ] Otwórz panele `Application` i `Network` w narzędziach deweloperskich.

## Instalowalność i rejestracja Service Workera

- [ ] `manifest.json` ładuje się bez błędów.
- [ ] Service Worker rejestruje się poprawnie i przechodzi do stanu `activated`.
- [ ] Aplikacja spełnia podstawowe warunki instalowalności: ma ikonę, nazwę i adres startowy oraz działa przez HTTPS lub na hoście lokalnym.
- [ ] Audyt Lighthouse w kategorii PWA przechodzi pomyślnie.

## Scenariusz offline po wcześniejszym wejściu online

- [ ] Otwórz stronę online i poczekaj na zakończenie zapisywania zasobów w pamięci podręcznej.
- [ ] Przełącz sieć na tryb `Offline`.
- [ ] Odśwież stronę i potwierdź, że działa aplikacja lub strona awaryjna `offline.html`.
- [ ] Adres `start_url` działa offline po wcześniejszym otwarciu online.

## Strategie pamięci podręcznej

- [ ] `index.html` oraz `data/pam-wiki-config.json` korzystają ze strategii `NetworkFirst`.
- [ ] `assets/css/styles.css`, `src/entries/pam-wiki.js`, `src/entries/quiz-module.js` i `src/entries/dev-mode.js` korzystają ze strategii `StaleWhileRevalidate`.
- [ ] Obrazy i ikony z `assets/` korzystają ze strategii `CacheFirst`.
- [ ] Żądanie zasobu niedostępnego w pamięci podręcznej i w sieci kończy się wyświetleniem strony `offline.html`.

## Aktualizacja i odświeżanie zasobów

- [ ] Po publikacji nowej wersji wykrywany jest nowy Service Worker.
- [ ] Zasoby statyczne odświeżają się zgodnie z przyjętą strategią pamięci podręcznej.
- [ ] Nowa wersja używa nowej nazwy pamięci podręcznej, a nieaktualne pamięci są usuwane podczas aktywacji.
- [ ] Po zwykłym odświeżeniu i ponownym otwarciu nie pojawia się nieaktualna wersja interfejsu.

## Powrót po odzyskaniu sieci

- [ ] Po przejściu z trybu `Offline` do `Online` aplikacja odzyskuje połączenie.
- [ ] Krytyczne żądania i interfejsy API działają ponownie bez ręcznej interwencji użytkownika.

## Szybki protokół testu

- Data:
- Commit lub wersja:
- Przeglądarka:
- Wynik:
- Uwagi:
