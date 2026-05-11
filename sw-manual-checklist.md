# Manualna checklista testów Service Workera

## 1) Pierwsze uruchomienie online
1. Otwórz aplikację online i upewnij się, że `sw.js` jest zarejestrowany.
2. Zweryfikuj, że `index.html` oraz `pam-wiki-config.json` pobierają się z sieci (NetworkFirst).
3. Sprawdź, że `styles.css`, `pam-wiki.js`, `quiz-module.js`, `dev-mode.js` są serwowane natychmiast przy kolejnym odświeżeniu i odświeżane w tle (StaleWhileRevalidate).
4. Sprawdź, że obrazy/ikony z `assets/` trafiają do cache po pierwszym pobraniu (CacheFirst).

## 2) Przejście offline
1. Po wcześniejszym załadowaniu aplikacji przełącz przeglądarkę w tryb offline.
2. Odśwież stronę:
   - jeśli zasób jest w cache, powinien zostać zwrócony,
   - jeśli brak zasobu i brak sieci, powinna pojawić się strona `offline.html`.

## 3) Publikacja nowej wersji
1. Wdróż nowy build z nowym parametrem `?v=<build_hash>` dla `sw.js`.
2. Zweryfikuj, że tworzona jest nowa nazwa cache (`app-cache-<hash>`), a stare cache są usuwane podczas `activate`.
3. Potwierdź, że nowe pliki JS/CSS/HTML są pobierane zgodnie z przypisanymi strategiami.

## 4) Wymuszenie aktualizacji klienta
1. Otwórz aplikację na kliencie ze starszą wersją SW.
2. Wykonaj hard refresh i/lub zamknij ponownie kartę, aby aktywować nowego SW (`skipWaiting` + `clients.claim`).
3. Zweryfikuj w DevTools, że aktywny jest SW z nowym `build_hash`.
4. Sprawdź działanie offline po aktualizacji.
