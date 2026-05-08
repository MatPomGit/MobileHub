# itch.io i publikacja własnych gier mobilnych na Androida

## Czym jest itch.io?

**itch.io** to otwarta platforma dla twórców gier indie, prototypów i projektów eksperymentalnych. W przeciwieństwie do sklepów o bardzo sztywnej moderacji, itch.io pozwala szybko opublikować projekt, testować pomysły i budować społeczność wokół gry.

Najważniejsze cechy:
- pełna kontrola nad stroną produktu (opis, grafiki, devlog, pliki),
- możliwość publikacji darmowej, płatnej lub „zapłać ile chcesz”,
- wsparcie dla buildów desktop, web (HTML5) i plików Android APK,
- integracja z narzędziem **Butler** do automatycznych uploadów.

## Dlaczego itch.io jest dobre dla gier mobilnych?

Dla początkujących twórców mobile itch.io bywa łatwiejszym punktem startowym niż Google Play, bo:
- proces publikacji jest szybszy,
- nie trzeba od razu przechodzić pełnego procesu sklepowego Google,
- łatwo zebrać feedback od graczy i iterować wersje,
- można udostępniać buildy testowe ograniczonej grupie.

To dobra strategia przed wejściem na większe marketplace’y: najpierw walidacja pomysłu i UX, potem szeroka dystrybucja.

## Jak opublikować grę Android (APK) na itch.io – krok po kroku

1. **Przygotuj build release APK**
   - zbuduj stabilny plik APK,
   - upewnij się, że wersja ma numer (`versionName`, `versionCode`),
   - podpisz build kluczem release (zachowaj go do przyszłych aktualizacji).

2. **Załóż stronę projektu na itch.io**
   - wybierz typ projektu „Game”,
   - uzupełnij tytuł, krótki opis i tagi (np. `android`, `mobile`, `arcade`),
   - ustaw miniaturę i screeny.

3. **Dodaj plik APK**
   - w sekcji upload plików dodaj APK,
   - zaznacz, że plik jest przeznaczony dla Androida,
   - skonfiguruj widoczność (draft/public/restricted).

4. **Ustaw model dystrybucji**
   - `Free`, `Paid` albo `Pay what you want`,
   - określ cenę minimalną jeśli wybierasz model płatny.

5. **Przygotuj stronę gry pod konwersję**
   - opisz mechanikę i unikalną wartość gry,
   - dodaj GIF lub krótki gameplay,
   - opisz wymagania sprzętowe (Android version, RAM, CPU/GPU),
   - dodaj sekcję „Known issues”.

6. **Opublikuj i zbieraj feedback**
   - uruchom komentarze lub formularz feedbacku,
   - prowadź devlog (regularne wpisy o zmianach),
   - analizuj retencję i zgłoszenia błędów.

## Dobre praktyki publikacji mobile na itch.io

- **Mały rozmiar APK** – użytkownicy mobilni szybko rezygnują z dużych pobrań.
- **Szybki start gry** – pierwsza interakcja powinna pojawić się w kilka sekund.
- **Czytelny onboarding** – 3–5 ekranów max lub tutorial kontekstowy.
- **Obsługa różnych ekranów** – testy na małych i dużych urządzeniach.
- **Offline-first (jeśli możliwe)** – gra działająca bez internetu ma większą użyteczność.
- **Instrukcja instalacji** – warto dodać na stronie opis włączenia "Nieznanych źródeł" w systemie Android, aby ułatwić instalację graczom.

## itch.io vs Google Play (perspektywa studenta/twórcy indie)

- **itch.io**: szybkie publikowanie, większa swoboda, świetne do prototypów i portfolio.
- **Google Play**: większy zasięg i formalna obecność rynkowa, ale wyższy próg wejścia i bardziej rozbudowane wymagania.

Praktyczny workflow:
1. prototyp + testy na itch.io,
2. iteracje UX/gameplay,
3. dopracowana wersja release na Google Play.

## Checklist przed publikacją APK

- [ ] Build release podpisany kluczem.
- [ ] Poprawny numer wersji.
- [ ] Ikona aplikacji i screeny przygotowane.
- [ ] Opis gry i tagi SEO gotowe.
- [ ] Krótka lista znanych problemów.
- [ ] Link kontaktowy do zgłaszania błędów.

## Podsumowanie

itch.io to bardzo dobry kanał do **szybkiej walidacji gry mobilnej na Androidzie**, budowania społeczności i iteracyjnego rozwoju projektu. Dla zespołów studenckich i indie jest to często najlepsze miejsce na pierwszą publiczną premierę.
