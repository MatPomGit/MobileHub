# Tworzenie gier mobilnych w Unreal Engine i publikacja na Androida

Tworzenie gry mobilnej w Unreal Engine (UE) to trochę jak budowa bolidu F1 do jazdy po mieście: potężne możliwości, ale tylko wtedy, gdy panujesz nad wydajnością, pipeline’em assetów i procesem wydawniczym. Dobra wiadomość? Da się to zrobić dobrze, przewidywalnie i bez „gaszenia pożarów” na finiszu.

Poniżej znajdziesz praktyczny przewodnik krok po kroku — od prototypu po publikację w Google Play.

---

## Dlaczego Unreal Engine do mobile?

Wokół mobile krąży mit, że „Unity zawsze wygra”. W praktyce wszystko zależy od kompetencji zespołu i architektury projektu. UE daje:

- bardzo mocny renderer i narzędzia profilerskie,
- C++ + Blueprints (szybkie iteracje + kontrola niskopoziomowa),
- dobrą skalowalność jakości (jeśli od początku projektujesz pod urządzenia docelowe).

Ważny wniosek z analizy technicznej projektu *Wuthering Waves*: wysoka jakość wizualna na mobile jest możliwa, ale często wymaga głębokich modyfikacji silnika i kosztownego utrzymania. To nie jest droga dla każdego zespołu.

---

## Etap 1: Preprodukcja — decyzje, które oszczędzą miesiące

### 1) Zdefiniuj „performance budget” zanim powstanie pierwszy poziom

Ustal twarde limity:

- **FPS target**: 30 lub 60 (na jakiej klasie urządzeń?),
- **CPU/GPU frame time** (np. ~16.6 ms dla 60 FPS),
- **RAM budget** (np. 2–3 GB dla średniej półki),
- **Docelowy rozmiar paczki** (AAB + Play Asset Delivery dla dużych zasobów).

Bez tych liczb zespół art/tech będzie podejmował decyzje „na oko”.

### 2) Podziel urządzenia na klasy

Przykład segmentacji:

- **Low-end** (starsze układy, mniej RAM),
- **Mid-range** (główny rynek),
- **High-end**.

Każda klasa powinna mieć osobny profil jakości (cienie, post-process, draw distance, efekty).

### 3) Wybierz styl graficzny zgodny z mobile

Jeśli chcesz fotorealizmu + otwarty świat + dynamiczne oświetlenie, koszt techniczny rośnie wykładniczo. Dla większości zespołów lepszy będzie:

- stylizowany art direction,
- kontrolowane światło (więcej baked, mniej dynamicznych kosztów),
- agresywne LOD-y i culling.

---

## Etap 2: Konfiguracja projektu UE pod Androida

### Krok 1: Utwórz projekt z myślą o mobile

- Startuj od template’u, który najbliżej oddaje gameplay.
- W **Project Settings** od razu ustaw platformę Android jako kluczową.
- Włącz tylko potrzebne pluginy (każdy dodatkowy to potencjalny koszt builda i runtime).

### Krok 2: Rendering i jakości

- Ustaw skalowalne ustawienia jakości (`Scalability`),
- Ogranicz kosztowne efekty post-process,
- Przemyśl cienie (najdroższy element na słabszych GPU),
- Używaj prostszych materiałów tam, gdzie gracz nie zauważy różnicy.

### Krok 3: Asset pipeline

- Definiuj zasady LOD dla wszystkich kategorii meshy,
- Kompresuj tekstury adekwatnie do typu assetu,
- Pilnuj liczby materiałów na obiekt,
- Automatyzuj walidację assetów (naming, polycount, tekstury).

---

## Etap 3: Programowanie gameplayu bez długu technologicznego

### Rekomendowany podział

- **Blueprints**: szybkie prototypy, UI flow, logika designerska,
- **C++**: systemy krytyczne wydajnościowo (AI, combat core, streaming, netcode).

### Dobre praktyki

- Profiluj od pierwszych sprintów, nie „na końcu”.
- Trzymaj moduły niezależne (łatwiejsze testy i refaktoryzacja).
- Ustal event-driven komunikację zamiast twardych zależności między systemami.
- Buduj feature toggles (szybkie wyłączanie kosztownych funkcji na słabszych urządzeniach).

---

## Etap 4: Optymalizacja na Androidzie (najważniejsza część)

### 1) Mierz, nie zgaduj

Wykorzystuj profilery UE i testy na **fizycznych urządzeniach**. Emulator nie zastąpi realnego GPU throttlingu.

### 2) Najczęstsze „zjadacze FPS”

- zbyt ciężkie materiały,
- nadmiar dynamicznych świateł/cieni,
- overdraw w UI i VFX,
- za dużo draw calli,
- niekontrolowany streaming assetów.

### 3) Plan optymalizacji (praktyczny)

1. Zbij koszt GPU (materiały/cienie/post-process).
2. Ogranicz draw calle (instancing, łączenie meshy, lepsze LOD).
3. Usprawnij streaming i pamięć.
4. Dostosuj jakość per device profile.
5. Powtórz pomiary i porównaj metryki sprint do sprintu.

---

## Etap 5: Build i publikacja gry na Androida (Google Play)

### Krok 1: Przygotuj środowisko

- Zainstaluj Android SDK/NDK/JDK kompatybilne z wersją UE.
- Skonfiguruj ścieżki w UE (`Project Settings > Platforms > Android`).
- Utwórz **keystore** do podpisywania aplikacji.

### Krok 2: Ustawienia pakietu

- Ustaw unikalny `Application ID` (package name),
- Wybierz `minSdkVersion` i `targetSdkVersion` zgodne z wymaganiami Google Play,
- Zadbaj o wersjonowanie (`versionCode`, `versionName`),
- Preferuj **AAB** (Android App Bundle).

### Krok 3: Build testowy

- Zbuduj development build,
- Uruchom na kilku klasach urządzeń,
- Sprawdź logi, czas startu, zużycie RAM, stabilność po dłuższej sesji.

### Krok 4: Google Play Console

1. Utwórz aplikację w Play Console.
2. Uzupełnij listing (opis, grafiki, ikona, polityka prywatności).
3. Dodaj klasyfikację wiekową i formularze bezpieczeństwa danych.
4. Wrzuć AAB na tor **Internal testing**.
5. Po walidacji przejdź przez **Closed/Open testing** do produkcji.

### Krok 5: Po premierze

- Włącz crash reporting i analitykę,
- Monitoruj ANR/crash rate, retention i konwersję tutoriala,
- Publikuj małe, częste aktualizacje zamiast rzadkich „mega patchy”.

---

## Czego nauczyć się z przypadku Wuthering Waves?

Artykuł źródłowy pokazuje, że bardzo ambitny projekt może:

- zostać na starszej wersji silnika przez skalę customizacji,
- „portować” wybrane nowoczesne techniki zamiast robić pełną migrację,
- ponosić większy koszt utrzymania, bo wsparcie „out-of-the-box” od producenta silnika maleje przy głębokich modyfikacjach.

Dla większości zespołów mobilnych oznacza to prostą zasadę: **optymalizuj projekt i proces, zanim zaczniesz optymalizować sam silnik**.

---

## Checklista „od zera do premiery”

- [ ] Zdefiniowany performance budget i klasy urządzeń.
- [ ] Pipeline assetów z LOD/compression i walidacją.
- [ ] Profile jakości per segment urządzeń.
- [ ] Regularne testy na realnych telefonach.
- [ ] Konfiguracja Android SDK/NDK/JDK + signing.
- [ ] AAB, poprawne wersjonowanie i zgodność Play.
- [ ] Testy internal/closed przed publicznym rolloutem.
- [ ] Monitoring po premierze + plan hotfixów.

Jeśli potraktujesz te punkty jako „Definition of Done” dla produkcji mobilnej, szansa na spokojny launch rośnie wielokrotnie.
