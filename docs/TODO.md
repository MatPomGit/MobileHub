# TODO — zadania po przeglądzie kodu

## 1) Literówka / niespójność językowa (index.html)
- [ ] Ujednolicić nazwę kroku `iOS ecosystem i workflow` do jednej wersji językowej (PL lub EN).
- [ ] Przejrzeć cały blok `learningPaths` pod kątem podobnych mieszanek językowych.
- [ ] Dodać krótką regułę redakcyjną: pojedynczy wpis ma mieć spójny język.

## 2) Usunięcie błędu (offline fallback PWA)
- [x] Dodać `offline.html` z czytelną informacją o braku sieci.
- [x] Uzupełnić Service Worker o poprawny fallback nawigacyjny offline.
- [ ] Zweryfikować scenariusz: pierwsze wejście online -> tryb offline -> ponowne otwarcie `index.html`.

## 3) Korekta komentarza / dokumentacji (test mobilny)
- [ ] Zaktualizować komentarz w `tests/e2e/mobilehub-flow.spec.js`, aby dokładnie opisywał aktualne asercje.
- [ ] Jeśli komentarz ma pozostać „krytyczny”, dopisać brakujące asercje i dopiero wtedy utrzymać to określenie.
- [ ] Dodać zasadę: komentarz testu nie deklaruje większego pokrycia niż rzeczywiście sprawdza test.

## 4) Ulepszenie testu (offline start_url)
- [ ] Rozszerzyć test `pwa-offline-start-url` o asercję treści specyficznej dla fallbacku offline.
- [ ] Dodać marker testowy (np. `data-testid`) w widoku offline i asercję jego obecności.
- [ ] Dodać asercję recovery: po powrocie online aplikacja wraca do standardowego widoku.
