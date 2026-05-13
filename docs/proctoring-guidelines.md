# Wytyczne proktoringu modułu testowego ZAL

Poniższe założenia definiują minimalny standard bezpieczeństwa i monitoringu
dla testów uruchamianych w ramach modułu ZAL.

## 1) Uruchamianie i blokada kontekstu testu
- Po kliknięciu „Rozpocznij test” system wymusza wejście w tryb pełnoekranowy (Fullscreen API).
- Test działa w dedykowanym widoku bez możliwości otwierania paneli bocznych i linków zewnętrznych.
- Wyjście z pełnego ekranu, minimalizacja okna lub utrata fokusowania jest logowana jako zdarzenie ryzyka.
- Wysoki poziom naruszeń (np. 3+ zdarzenia krytyczne) powinien automatycznie zakończyć podejście.

## 2) Wykrywanie skrótów klawiszowych i prób obejścia
- Monitorowane skróty: Alt+Tab, Ctrl/Cmd+Tab, Ctrl/Cmd+L, Ctrl/Cmd+T, Ctrl/Cmd+N, PrintScreen, F11, Esc.
- Przechwytywanie zdarzeń `keydown`/`keyup` z klasyfikacją: informacyjne, ostrzeżenie, krytyczne.
- Każde wykrycie skrótu zapisuje: czas, kod klawisza, aktywne pytanie, tryb pełnoekranowy i stan widoczności karty.
- Przy skrótach krytycznych system pokazuje użytkownikowi ostrzeżenie i zwiększa licznik naruszeń.

## 3) Wykrywanie przełączania kart i utraty uwagi
- Wykorzystać Page Visibility API (`document.visibilityState`) oraz zdarzenia `blur/focus`.
- Każde przejście do stanu `hidden` należy logować z długością nieobecności.
- Powrót do karty testu wymaga krótkiego potwierdzenia i pokazania komunikatu o zarejestrowanym zdarzeniu.
- W raporcie końcowym podsumować liczbę i łączny czas przełączeń poza kartę testu.

## 4) Śledzenie twarzy i skupienia (MediaPipe)
- Wymagać zgody na kamerę przed startem testu; brak zgody uniemożliwia rozpoczęcie egzaminu.
- Użyć MediaPipe Face Landmarker / Face Mesh do estymacji pozycji głowy i punktów oczu.
- Monitorować, czy twarz jest widoczna, centralnie ustawiona i skierowana w stronę ekranu.
- Wykrywać brak twarzy, wiele twarzy, długie odchylenie wzroku oraz gwałtowne ruchy głowy.
- Dla prywatności przechowywać głównie metryki i flagi zdarzeń, a nie surowe nagranie wideo (chyba że polityka uczelni stanowi inaczej).

## 5) Metryki behawioralne i poznawcze do raportu ryzyka
| Metryka | Opis / sposób liczenia | Przykładowy sygnał ryzyka |
| --- | --- | --- |
| Czas odpowiedzi na pytanie | Różnica między wyświetleniem pytania a zatwierdzeniem odpowiedzi. | Nienaturalnie krótki lub bardzo zmienny czas między pytaniami. |
| Nerwowość ruchów głowy | Odchylenie standardowe kąta yaw/pitch/roll w oknie czasowym. | Wysoka częstotliwość mikro-ruchów i nagłe zwroty poza ekran. |
| Nerwowość ruchów oczu | Wariancja wektora spojrzenia i liczba szybkich sakad. | Powtarzalne skoki wzroku poza obszar monitora. |
| Ilość mrugnięć | Detekcja mrugnięć na podstawie Eye Aspect Ratio (EAR), np. na minutę. | Nietypowo wysoka lub skrajnie niska częstość przez dłuższy okres. |
| Czas poza ekranem | Procent czasu, gdy wzrok nie jest skierowany na ekran przez > X sekund. | Długie epizody patrzenia poza ekran podczas trudnych pytań. |
| Brak twarzy / wiele twarzy | Licznik i łączny czas klatek bez twarzy lub z więcej niż jedną twarzą. | Powtarzalna obecność drugiej osoby albo znikanie z kadru. |
| Aktywność okna i karty | Liczba zdarzeń blur/hidden oraz ich łączny czas. | Wielokrotne przełączanie aplikacji i kart. |
| Wzorzec odpowiedzi | Analiza sekwencji: tempo, poprawki, skoki po pytaniach, seryjność wyborów. | Nietypowe serie odpowiedzi o identycznym czasie i schemacie. |
| Aktywność klawiatury w czasie | Szereg czasowy naciśnięć (`keydown`/`keyup`) podczas pracy nad odpowiedzią: liczba zdarzeń, odstępy, bursty i okresy bezczynności. | Nietypowe sekwencje gwałtownych serii lub długie przerwy niezgodne z profilem odpowiedzi. |
| Aktywność myszy w czasie | Szereg czasowy ruchu kursora i kliknięć: droga kursora, prędkość, przyspieszenie, pauzy, kliknięcia kontekstowe. | Nienaturalna aktywność (np. brak ruchu przy wielu zmianach odpowiedzi lub skokowe ruchy sugerujące przełączanie poza test). |

## 6) Śledzenie aktywności klawiszy i myszy podczas odpowiedzi
- Dla każdego pytania prowadzić timeline interakcji od momentu wyświetlenia pytania do zatwierdzenia odpowiedzi.
- Rejestrować zdarzenia `keydown`, `keyup`, `mousemove`, `mousedown`, `mouseup`, `click`, wraz ze znacznikiem czasu.
- Agregować metryki w oknach czasowych (np. co 5–10 s): intensywność aktywności, rytm pracy, okresy bezczynności.
- Łączyć metryki klawiatury i myszy z czasem odpowiedzi oraz zdarzeniami fokusu/visibility w jednym raporcie ryzyka.
- Przechowywać metadane behawioralne zamiast surowych treści wpisywanych przez użytkownika (privacy by design).
