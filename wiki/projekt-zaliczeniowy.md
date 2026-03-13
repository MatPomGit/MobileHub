# Projekt zaliczeniowy — własna aplikacja mobilna

Projekt zaliczeniowy to samodzielnie zaprojektowana i zaimplementowana aplikacja mobilna. Stanowi praktyczne potwierdzenie opanowania umiejętności programistycznych zdobytych w ramach przedmiotu **Programowanie Aplikacji Mobilnych (PAM)**.

## Cel projektu

Celem projektu jest zaprojektowanie, zaimplementowanie i zaprezentowanie oryginalnej aplikacji mobilnej działającej na platformie Android lub iOS (lub cross-platform). Aplikacja powinna rozwiązywać realny problem lub dostarczać konkretnej wartości użytkownikowi.

## Opis wymagań projektu

Semestralny projekt polega na zaprojektowaniu i wdrożeniu kompletnej aplikacji mobilnej (frontend + backend) w warunkach zbliżonych do pracy w firmie IT. **Zespół 3-osobowy** pracuje w repozytorium Git z wykorzystaniem branchingu, pull requestów, code review, CI/CD, testów automatycznych oraz dokumentacji technicznej i użytkowej.

Projekt polega na zaprojektowaniu i wdrożeniu aplikacji mobilnej, która **realnie wykorzystuje możliwości smartfona**, a nie jest jedynie „przeniesioną wersją aplikacji desktopowej". Aplikacja musi działać na **fizycznym urządzeniu (Android)** i zostać przygotowana do publikacji w sklepie Play.

### Checklista ogólnych wymagań projektu — dla całego zespołu

- ☑ Aplikacja działa na fizycznym smartfonie (prezentacja na zajęciach)
- ☑ Wykorzystanie min. 2 natywnych funkcji urządzenia, np.:
  - aparat (Camera API)
  - GPS / lokalizacja
  - powiadomienia push
  - czujniki (akcelerometr, żyroskop)
  - biometria (odcisk palca / Face Unlock)
  - przechowywanie lokalne (np. offline-first)
- ☑ Integracja z backendem (auth + operacje na danych)
- ☑ Działający przepływ end-to-end (logowanie + operacja domenowa)
- ☑ Minimum 20 zamkniętych issue + 2 milestone (sprinty)
- ☑ Repozytorium z PR i code review
- ☑ CI: build + testy przy każdym PR
- ☑ Testy jednostkowe (≥60% pokrycia logiki)
- ☑ Testy integracyjne API (min. 5 scenariuszy)
- ☑ Dokumentacja API (OpenAPI/Swagger)
- ☑ Wygenerowany podpisany build (AAB/APK)
- ☑ Przygotowany opis aplikacji do Google Play (opis, screeny, ikona, polityka prywatności)
- ☑ Próba publikacji w Google Play (kanał testowy lub produkcyjny)
- ☑ 5-minutowe demo + prezentacja procesu CI/CD

## Wymagania dla poszczególnych ról studentów

### Product Lead & UX

1. min. 15 user stories z kryteriami akceptacji
2. Wyraźne uzasadnienie: dlaczego aplikacja wymaga smartfona
3. Prototyp uwzględniający interakcję mobilną (gesty, kontekst lokalizacji, aparat itp.)
4. MVP vs funkcje dodatkowe
5. Opis aplikacji do Google Play (krótki + pełny opis, słowa kluczowe)
6. Przygotowanie screenów i materiałów promocyjnych
7. Checklista testów akceptacyjnych
8. Changelog + instrukcja użytkownika

### Frontend Developer

1. Implementacja min. 5 ekranów
2. Integracja min. 2 funkcji natywnych urządzenia
3. Obsługa uprawnień systemowych (runtime permissions)
4. Obsługa stanów: loading / error / offline
5. Integracja z API (auth + min. 3 operacje CRUD)
6. min. 10 testów jednostkowych
7. Konfiguracja podpisanego builda (keystore, wersjonowanie)
8. Przygotowanie wersji AAB/APK gotowej do Play Console

### Backend & DevOps Engineer

1. API: min. 5 endpointów (w tym rejestracja/logowanie)
2. Uwierzytelnianie (np. JWT) + hashowanie haseł
3. Model bazy danych + migracje
4. min. 5 testów integracyjnych API
5. CI backendu (testy automatyczne)
6. Deployment (np. chmura / hosting publiczny)
7. Walidacja danych, CORS, podstawowe zabezpieczenia
8. Przygotowanie polityki prywatności (wymaganej do Play Store)

## Platformy i technologie

| Platforma         | Technologia              | Język            |
|-------------------|--------------------------|------------------|
| Android (natywny) | Jetpack Compose + Jetpack | Kotlin           |
| iOS (natywny)     | SwiftUI + UIKit          | Swift            |
| Cross-platform    | Flutter                  | Dart             |
| Cross-platform    | React Native             | JavaScript/TS    |
| Cross-platform    | Kotlin Multiplatform     | Kotlin           |
| Unity             | Unity3D                  | C#           |

> **Uwaga:** Wybór platformy jest dowolny, jednak platforma musi być uzgodniona z prowadzącym na początku semestru.


## Kryteria oceniania

### Skala punktowa (100 pkt)

| Kryterium                                     | Punkty |
|-----------------------------------------------|--------|
| Działające, stabilne funkcje podstawowe       | 30 pkt |
| Jakość kodu i architektura aplikacji          | 20 pkt |
| Interfejs użytkownika i UX                    | 15 pkt |
| Komunikacja sieciowa i przechowywanie danych  | 15 pkt |
| Prezentacja i dokumentacja projektu           | 10 pkt |
| Dodatkowe funkcje i kreatywność               | 10 pkt |

### Progi ocen

```
91–100 pkt → 5.0 (bardzo dobry)
81–90  pkt → 4.5 (dobry+)
71–80  pkt → 4.0 (dobry)
61–70  pkt → 3.5 (dostateczny+)
51–60  pkt → 3.0 (dostateczny)
< 50   pkt → 2.0 (niedostateczny)
```

## Dokumentacja projektu

Do oddawanego projektu należy dołączyć:

1. **README.md** — opis projektu, instrukcja uruchomienia, screenshoty,
2. **Diagram architektury** — schemat warstw aplikacji,
3. **Opis API** — lista wykorzystanych endpointów,
4. **Instrukcja testowania** — jak przetestować kluczowe funkcje,
5. **Wkład własny** — co zostało samodzielnie zaprojektowane i zaimplementowane.

## Prezentacja projektu

Każdy zespół prezentuje projekt:

- Czas prezentacji: **8–12 minut**,
- Demonstracja działania na urządzeniu fizycznym lub emulatorze,
- Omówienie architektury i napotkanych trudności,
- Krótkie pytania techniczne od prowadzącego.

## Lista przykładowych tematów projektu

### Kategoria A: Systemy miejskie i nawigacja

1. **Smart Campus Navigator** — Aplikacja mobilna ułatwiająca poruszanie się po kampusie uczelni. Użytkownik może wyszukiwać sale, budynki oraz wydarzenia, a aplikacja prowadzi go do wybranego miejsca przy wykorzystaniu lokalizacji GPS. System umożliwia przeglądanie mapy kampusu oraz podstawowe planowanie trasy między budynkami.

2. **Mobilna gra terenowa „Campus Quest"** — Gra wykorzystująca lokalizację GPS, w której gracz odkrywa punkty na mapie kampusu lub miasta. W określonych miejscach pojawiają się zadania, zagadki lub mini-gry. Postęp gracza zapisywany jest na serwerze, a aplikacja może przyznawać punkty za odwiedzone lokalizacje.

3. **Aplikacja do raportowania problemów miejskich** — Aplikacja umożliwiająca zgłaszanie problemów w przestrzeni miejskiej, takich jak uszkodzone oświetlenie, zniszczone chodniki czy dzikie wysypiska. Użytkownik wykonuje zdjęcie, dodaje opis oraz lokalizację GPS zgłoszenia. Aplikacja powinna umożliwiać przeglądanie zgłoszeń na mapie oraz sprawdzanie ich statusu.

4. **System przypomnień kontekstowych** — Aplikacja przypominająca użytkownikowi o zadaniach w określonych warunkach. Przypomnienie może być wyświetlane w określonym czasie lub po wejściu w dany obszar geograficzny (geofencing). Użytkownik może tworzyć, edytować i usuwać zadania zapisane w systemie.

5. **AR Campus Guide** — Aplikacja pomagająca użytkownikowi odnaleźć się w przestrzeni uczelni. Po skierowaniu telefonu na budynek lub pomieszczenie aplikacja wyświetla informacje w formie nakładki AR. Użytkownik może zobaczyć drogę do wybranej sali lub laboratorium, a system wyświetla strzałki nawigacyjne w przestrzeni rzeczywistej.

6. **Motywacyjna aplikacja do biegania („Run or Shame")** — Aplikacja motywująca użytkownika do regularnego biegania. Użytkownik ustala plan treningów oraz dystans do przebiegnięcia w określonym czasie. Aplikacja monitoruje bieg przy użyciu GPS i zapisuje trasę oraz czas aktywności. W przypadku niewykonania zadania system generuje konsekwencję motywacyjną.

### Kategoria B: Gry mobilne i rozrywka

7. **Gra logiczna „Escape Lab"** — Gracz próbuje wydostać się z wirtualnego laboratorium poprzez rozwiązywanie zagadek logicznych. Każdy poziom zawiera interaktywne elementy, które należy odpowiednio aktywować. Gra powinna wykorzystywać ekran dotykowy oraz gesty użytkownika.

8. **Gra zręcznościowa „Balance Master"** — Celem gry jest utrzymanie równowagi obiektu na ekranie poprzez przechylanie telefonu. Sterowanie odbywa się przy użyciu akcelerometru i żyroskopu. Gracz musi unikać przeszkód i utrzymać obiekt na platformie jak najdłużej.

9. **Mobilna gra strategiczna „Micro Colony"** — Gracz zarządza niewielką kolonią rozwijającą się na ograniczonej przestrzeni. Musi planować rozwój budynków, zarządzać zasobami oraz reagować na zdarzenia losowe. Gra powinna posiadać prosty system ekonomiczny i rozwój technologii.

10. **Gra rytmiczna „Tap Beat"** — Celem gry jest trafne naciskanie elementów pojawiających się na ekranie w rytm muzyki. Gracz zdobywa punkty za poprawne reakcje w określonym czasie. System rankingów pozwala porównywać wyniki między użytkownikami.

11. **Gra symulacyjna „Space Miner"** — Gracz zarządza statkiem kosmicznym wydobywającym surowce z asteroid. Musi planować trasy lotów oraz zarządzać zasobami paliwa i energii. Zebrane surowce mogą być sprzedawane w celu ulepszania statku.

12. **AR Escape Room** — Gra logiczna w rozszerzonej rzeczywistości. Użytkownik rozwiązuje zagadki poprzez interakcję z wirtualnymi obiektami umieszczonymi w realnym otoczeniu. Zadaniem gracza jest odnalezienie wskazówek i rozwiązanie sekwencji zagadek.

13. **AR Storytelling – interaktywne historie w przestrzeni** — Platforma łącząca grę mobilną opartą na lokalizacji z interaktywnym słuchowiskiem/spektaklem w rzeczywistości rozszerzonej. Użytkownik wchodzi w złożone interakcje z wirtualnymi postaciami i obiektami, które determinują dalszy bieg fabuły.

14. **Gra symulacyjna „Life of a Student"** — Gracz wciela się w studenta zarządzającego swoim czasem, nauką i życiem społecznym. Każda decyzja wpływa na poziom wiedzy, stresu i energii postaci. Gra powinna posiadać system wydarzeń losowych oraz rozwój postaci.

15. **Gra finansowa „Startup Tycoon"** — Gra symulacyjna ucząca podstaw przedsiębiorczości. Gracz zarządza wirtualnym startupem i podejmuje decyzje finansowe dotyczące inwestycji i rozwoju firmy. System prezentuje wyniki finansowe w formie wykresów.

16. **Animowany asystent opowiadający żarty** — Aplikacja prezentująca animowaną postać opowiadającą żarty. Postać powinna posiadać prostą animację twarzy. Treść żartów może być pobierana z API lub z lokalnej bazy danych. Aplikacja powinna wykorzystywać syntezę mowy (TTS).

### Kategoria C: Edukacja i symulacje techniczne

17. **Gra edukacyjna „Code Puzzle"** — Gra polegająca na rozwiązywaniu prostych zadań programistycznych w formie puzzli logicznych. Gracz układa blokowe instrukcje, aby sterować postacią lub robotem. System powinien umożliwiać testowanie rozwiązania i wizualizację działania programu.

18. **AR Memory – gra pamięciowa w rozszerzonej rzeczywistości** — Gra treningowa wykorzystująca rozszerzoną rzeczywistość. Użytkownik widzi na ekranie telefonu wirtualne elementy rozmieszczone w fizycznej przestrzeni. Zadaniem gracza jest zapamiętanie ich położenia i odtworzenie właściwej sekwencji.

19. **Empathy Trainer – symulator emocjonalnych sytuacji społecznych** — Aplikacja edukacyjna wykorzystująca elementy rzeczywistości mieszanej. Użytkownik obserwuje wirtualne postacie przedstawiające różne sytuacje społeczne i wybiera reakcje. System analizuje odpowiedzi i prezentuje informację zwrotną.

20. **Mobilna przeglądarka i konwerter modeli 3D** — Aplikacja umożliwiająca pobieranie i przeglądanie obiektów trójwymiarowych. Użytkownik może otwierać pliki modeli 3D, obracać model, przybliżać oraz zmieniać perspektywę. Projekt powinien prezentować możliwości wizualizacji 3D na urządzeniu mobilnym.

21. **Mobilny generator wykresów z danych obrazowych** — Aplikacja umożliwiająca wizualizację danych liczbowych ze zdjęcia. Użytkownik może załadować plik, wybrać kolumny danych oraz określić typ wykresu. Wygenerowany wykres można zapisać jako obraz lub plik PDF.

22. **Mobilny symulator układu zbiorniczków** — Aplikacja edukacyjna symulująca działanie prostego układu zbiorników. Użytkownik wprowadza komendy lub program sterujący, a aplikacja prezentuje animację działania układu. System powinien umożliwiać eksperymentowanie z różnymi parametrami symulacji.

23. **Wizualizacja satelitów na orbicie Ziemi** — Aplikacja pokazująca aktualne pozycje satelitów na orbicie. Dane o satelitach są pobierane z publicznego API. Aplikacja powinna wyświetlać model Ziemi oraz trajektorie przelotu wybranych satelitów.

### Kategoria D: Narzędzia i produktywność

24. **Aplikacja do katalogowania przedmiotów** — Aplikacja umożliwiająca użytkownikowi katalogowanie posiadanych przedmiotów. Użytkownik wykonuje zdjęcie przedmiotu, dodaje opis oraz kategorię. Aplikacja powinna umożliwiać przeglądanie katalogu, edycję wpisów oraz wyszukiwanie przedmiotów.

25. **Aplikacja do zarządzania listą zakupów** — Mobilna aplikacja umożliwiająca tworzenie i współdzielenie list zakupów. Użytkownicy mogą dodawać produkty ręcznie lub przy użyciu aparatu telefonu. Lista może być synchronizowana pomiędzy użytkownikami poprzez backend.

26. **Inteligentna aplikacja doboru ubrań** — Aplikacja pomagająca użytkownikowi dobrać odpowiedni strój. Użytkownik dodaje elementy garderoby wraz ze zdjęciem oraz opisem parametrów (np. styl, okazja, sezon). Na podstawie tych danych aplikacja generuje propozycje zestawów ubrań dopasowanych do sytuacji.

27. **Mobilny system planowania wydarzeń** — Aplikacja umożliwiająca organizowanie i zarządzanie wydarzeniami. Użytkownicy mogą tworzyć wydarzenia, określać ich lokalizację, datę oraz opis. Inni użytkownicy mogą zapisywać się na wydarzenia i otrzymywać powiadomienia o zmianach.

28. **Inteligentny asystent zakupów „SmartCart"** — Aplikacja pomagająca użytkownikowi podejmować decyzje zakupowe. Użytkownik może skanować produkty przy użyciu aparatu telefonu lub wyszukiwać je w bazie danych. Aplikacja prezentuje informacje o cenach w różnych sklepach oraz sugeruje tańsze alternatywy.

29. **Aplikacja do wspólnego planowania budżetu domowego** — Aplikacja umożliwiająca kilku użytkownikom zarządzanie wspólnym budżetem. Użytkownicy mogą dodawać wydatki oraz przypisywać je do kategorii. System prezentuje zestawienia finansowe w formie wykresów i raportów.

30. **Aplikacja do zarządzania subskrypcjami cyfrowymi** — Aplikacja pomagająca kontrolować wszystkie subskrypcje użytkownika (np. platformy streamingowe czy usługi online). Użytkownik dodaje subskrypcje wraz z informacją o kosztach i terminie odnowienia. Aplikacja przypomina o zbliżających się płatnościach.

31. **Aplikacja „Price Tracker" do monitorowania cen produktów** — Aplikacja umożliwiająca śledzenie zmian cen wybranych produktów. System okresowo sprawdza ceny w wybranych sklepach internetowych lub symulowanej bazie danych. Aplikacja informuje użytkownika, gdy cena spadnie poniżej ustalonego poziomu.

32. **Mobilny marketplace dla studentów** — Aplikacja umożliwiająca sprzedaż i kupno używanych przedmiotów w społeczności studenckiej. Użytkownik może dodać ogłoszenie wraz ze zdjęciem, opisem i ceną. System może zawierać prosty mechanizm ocen sprzedających.

33. **Aplikacja do analizy wydatków z paragonów** — Aplikacja analizująca paragony zakupowe. Użytkownik wykonuje zdjęcie paragonu aparatem telefonu. System rozpoznaje tekst (OCR) i zapisuje listę produktów oraz ich ceny, które są automatycznie przypisywane do kategorii wydatków.

34. **Aplikacja do planowania większych zakupów** — Aplikacja pomagająca użytkownikowi planować większe wydatki (np. zakup sprzętu elektronicznego lub podróży). Użytkownik określa cel finansowy oraz planowaną kwotę. Aplikacja oblicza, ile należy odkładać miesięcznie, aby osiągnąć cel.

35. **Aplikacja do porównywania koszyków zakupowych** — Aplikacja umożliwiająca porównywanie cen całego koszyka zakupów w różnych sklepach. Użytkownik wprowadza listę produktów. System prezentuje najtańszą opcję zakupu i umożliwia generowanie raportów oszczędności.

36. **Aplikacja do dzielenia rachunków między znajomymi** — Aplikacja pomagająca rozliczać wspólne wydatki. Użytkownicy mogą dodawać rachunki i przypisywać je do uczestników spotkania lub wydarzenia. System automatycznie oblicza, kto komu i ile powinien zwrócić.

37. **Inteligentny system segregacji odpadów** — Projekt obejmuje inteligentny kosz wyposażony w czujniki odległości (poziom zapełnienia) oraz czujniki wykrywające materiał. Aplikacja mobilna informuje służby porządkowe o konieczności opróżnienia konkretnych pojemników i prezentuje statystyki recyklingu.

38. **Monitoring zajętości miejsc parkingowych w czasie rzeczywistym** — System wykorzystuje czujniki magnetyczne lub ultradźwiękowe umieszczone na miejscach parkingowych. Aplikacja mobilna prowadzi użytkownika do najbliższego wolnego miejsca parkingowego na terenie kampusu.

39. **System kontroli oświetlenia adaptacyjnego** — Aplikacja pozwalająca na zdalne sterowanie oświetleniem w pomieszczeniu z trybem automatycznym, który dostosowuje natężenie światła do jasności zewnętrznej. System analizuje zużycie energii i prezentuje dane w formie raportów.

### Kategoria E: Komunikacja i interfejsy

40. **Gra wieloosobowa „LAN Arena"** — Prosta gra multiplayer działająca w lokalnej sieci Wi-Fi. Gracze mogą dołączyć do wspólnej rozgrywki i rywalizować w krótkich pojedynkach. System synchronizuje stan gry pomiędzy urządzeniami.

41. **Aplikacja sterowania telefonem gestami** — Aplikacja umożliwiająca definiowanie własnych gestów sterujących. Gesty mogą być wykonywane na ekranie dotykowym lub poprzez ruch telefonu. Użytkownik może przypisać do gestu określoną funkcję, np. uruchomienie aplikacji lub wykonanie skrótu systemowego.

42. **Bezpieczny komunikator w sieci lokalnej (LAN Messenger)** — Komunikator działający w lokalnej sieci Wi-Fi. Aplikacja powinna umożliwiać wykrywanie innych urządzeń w tej samej sieci i nawiązywanie połączenia. Komunikacja powinna być zabezpieczona przy użyciu szyfrowania end-to-end.

43. **Inteligentny system monitorowania warunków w laboratorium** — System monitorujący temperaturę, wilgotność oraz jakość powietrza (stężenie CO2) w pomieszczeniach dydaktycznych. Aplikacja mobilna wyświetla aktualne parametry w czasie rzeczywistym i generuje powiadomienia, gdy zostaną przekroczone bezpieczne limity.

44. **System zarządzania domową uprawą roślin (Smart Plant)** — Aplikacja integruje się z zestawem czujników wilgotności gleby i nasłonecznienia. System umożliwia zdalne uruchomienie podlewania za pomocą pompy podłączonej do IoT. Aplikacja wysyła przypomnienia o konieczności nawożenia.

45. **Lokalizator zasobów uczelnianych (IoT Asset Tracker)** — System śledzenia cennych przedmiotów (np. rzutników, walizek pomiarowych) przy użyciu tagów Bluetooth (BLE) lub Wi-Fi. Aplikacja mobilna pozwala na szybkie odnalezienie przedmiotu na mapie budynku oraz rejestruje historię jego przemieszczania się.

46. **Inteligentny licznik przepływu osób (Crowd Control)** — System oparty na barierach podczerwieni lub czujnikach ruchu instalowanych w drzwiach. Aplikacja mobilna pozwala administratorom monitorować natężenie ruchu w budynku w czasie rzeczywistym.

47. **Mobilny system rezerwacji i kontroli biurek (Smart Desk)** — Aplikacja do zarządzania przestrzenią w biurach typu co-working lub bibliotekach. Czujniki nacisku lub obecności podłączone do mikrokontrolera wykrywają zajętość miejsca. Użytkownik może sprawdzić dostępność biurek na mapie i zdalnie zarezerwować miejsce.

48. **System monitorowania jakości wody w akwarium/stawie** — Urządzenie IoT zanurzone w wodzie mierzy pH, temperaturę i mętność. Dane przesyłane są do aplikacji, która sugeruje podjęcie działań (np. podmianę wody). System może posiadać moduł automatycznego karmnika sterowanego zdalnie.

49. **Mobilny kontroler robota inspekcyjnego** — Aplikacja do sterowania robotem kołowym wyposażonym w kamerę. Użytkownik widzi podgląd wideo na żywo w smartfonie i steruje ruchem robota za pomocą wirtualnych joysticków. Aplikacja umożliwia robienie zdjęć i zapisywanie ich w backendzie wraz z tagiem lokalizacji.

50. **Symulator i sterownik ramienia robotycznego** — Aplikacja do sterowania ramieniem o kilku stopniach swobody. Użytkownik może przesuwać suwaki w aplikacji, co odpowiada ruchom serwomechanizmów fizycznego robota lub jego modelu 3D w symulatorze. System pozwala na nagrywanie sekwencji ruchów i ich późniejsze odtwarzanie.

51. **Robot mapujący przestrzeń (Slam-Lite)** — Aplikacja łącząca się z robotem wyposażonym w czujnik odległości (np. ultradźwiękowy lub LiDAR). Robot porusza się po pomieszczeniu, a aplikacja mobilna na bieżąco rysuje rzut poziomu (mapę) na ekranie telefonu.

52. **System sterowania dronem za pomocą gestów smartfona** — Projekt wykorzystuje akcelerometr i żyroskop wbudowany w telefon do sterowania lotem drona (lub symulowanego obiektu latającego). Pochylenie telefonu powoduje lot, a obrót telefonu – skręt drona. Aplikacja wyświetla telemetrię (wysokość, stan baterii).

53. **Wirtualny trener programowania robotów (Blockly Mobile)** — Aplikacja edukacyjna pozwalająca na układanie algorytmów z bloków (jak w Scratch), które następnie są przesyłane do robota (fizycznego lub symulowanego). Użytkownik może przetestować kod „na sucho" w aplikacji przed wysłaniem komend do urządzenia.

54. **Autonomiczny robot dostawczy w budynku** — Aplikacja pozwala użytkownikowi „wezwać" robota do konkretnej sali. Robot wykorzystuje czujniki linii lub znaczniki AR do nawigacji, a aplikacja mobilna pokazuje aktualną pozycję robota na mapie i informuje powiadomieniem, gdy przesyłka dotrze do celu.

55. **System kolaboracji wielu robotów (Swarm Control)** — Interfejs do zarządzania grupą małych robotów. Użytkownik w aplikacji mobilnej wyznacza formację (np. linia, koło), a system rozsyła komendy do wszystkich jednostek jednocześnie, dbając o synchronizację ich ruchów.

56. **Robotyczna proteza dłoni sterowana aplikacją mobilną** — Projekt obejmuje sterowanie modelem dłoni robotycznej. Aplikacja posiada predefiniowane gesty (uścisk, chwyt pęsetowy), które użytkownik aktywuje dotykiem. System może wizualizować siłę nacisku na palcach dłoni dzięki czujnikom tensometrycznym.

57. **Mobilny interfejs do symulacji robotów przemysłowych** — Aplikacja łącząca się z profesjonalnym środowiskiem symulacyjnym (np. ROS/Gazebo). Użytkownik może monitorować stan „cyfrowego bliźniaka" (digital twin) linii produkcyjnej, otrzymywać powiadomienia o awariach i zdalnie zatrzymywać proces w sytuacjach awaryjnych.

58. **Robot grający w gry planszowe (np. kółko i krzyżyk)** — Robot, który fizycznie przesuwa pionki na planszy. Aplikacja mobilna służy jako interfejs przeciwnika – użytkownik wykonuje ruch w aplikacji, a robot rozpoznaje stan planszy (za pomocą kamery i przetwarzania obrazu) i wykonuje kontrruch.

### Kategoria F: Zdrowie i samopoczucie

59. **Aplikacja do monitorowania codziennych nawyków** — Aplikacja pomagająca użytkownikowi monitorować codzienne nawyki i aktywności. Użytkownik może definiować własne cele, np. naukę, aktywność fizyczną czy czas pracy. Aplikacja zapisuje wykonanie zadań i prezentuje historię postępów w formie statystyk.

60. **Mobilny dziennik samopoczucia i stresu** — Aplikacja umożliwiająca użytkownikowi codzienne monitorowanie samopoczucia psychicznego. Użytkownik zapisuje poziom stresu, nastrój oraz wybrane czynniki wpływające na jego stan. Dane są prezentowane w formie wykresów i statystyk pokazujących zmiany w czasie.

61. **Aplikacja wspierająca ćwiczenia oddechowe** — Aplikacja pomagająca użytkownikowi wykonywać ćwiczenia oddechowe redukujące stres. System prowadzi użytkownika poprzez wizualne i dźwiękowe instrukcje wdechu i wydechu. Użytkownik może wybierać różne techniki oddychania oraz długość sesji.

62. **EmotiCam – aplikacja analizująca emocje użytkownika** — Aplikacja wykorzystująca kamerę smartfona do analizy emocji użytkownika na podstawie mimiki twarzy. System identyfikuje podstawowe emocje, takie jak radość, smutek czy zaskoczenie. Wyniki prezentowane są w czasie rzeczywistym w formie wizualnych wskaźników.

63. **AR Fitness Trainer** — Aplikacja treningowa wykorzystująca elementy rozszerzonej rzeczywistości. Aplikacja wyświetla wirtualnego trenera lub wskazówki ruchowe nakładane na obraz z kamery telefonu. System może wykorzystywać czujniki ruchu telefonu do oceny dynamiki ćwiczeń.

64. **MoodScape – wizualizacja emocji w przestrzeni AR** — Aplikacja, która wizualizuje aktualny nastrój użytkownika w formie dynamicznych obiektów AR. System analizuje emocje użytkownika na podstawie krótkiego testu i generuje wirtualne środowisko odpowiadające temu nastrojowi.

65. **Emotion Music Player** — Odtwarzacz muzyki reagujący na emocje użytkownika. Aplikacja analizuje nastrój na podstawie mimiki twarzy lub krótkiej ankiety, a następnie proponuje muzykę dopasowaną do aktualnego stanu emocjonalnego. Interfejs aplikacji zmienia kolory i animacje w zależności od nastroju.

66. **Mobilna aplikacja przypominająca o lekach** — System wspomagający regularne przyjmowanie leków. Użytkownik może wprowadzić nazwę leku, dawkę oraz harmonogram przyjmowania. Aplikacja generuje powiadomienia przypominające o przyjęciu dawki i zapisuje historię przyjmowanych leków.

67. **Aplikacja do podstawowej oceny jakości snu** — Aplikacja umożliwiająca monitorowanie nawyków związanych ze snem. Użytkownik zapisuje godziny zasypiania i budzenia się oraz subiektywną ocenę jakości snu. System prezentuje statystyki i wykresy dotyczące rytmu snu.

68. **Aplikacja do treningu pamięci roboczej** — Zestaw prostych gier kognitywnych ćwiczących pamięć i koncentrację. Zadania mogą polegać na zapamiętywaniu sekwencji symboli lub lokalizacji elementów na ekranie. System powinien dostosowywać poziom trudności do wyników użytkownika.

69. **Aplikacja edukacyjna o zdrowym stylu życia** — Aplikacja prezentująca wiedzę dotyczącą zdrowego stylu życia. Użytkownik może zapoznawać się z artykułami lub krótkimi materiałami edukacyjnymi dotyczącymi diety, aktywności fizycznej i snu. Aplikacja może zawierać krótkie quizy sprawdzające wiedzę.

70. **Mobilny monitor bezpieczeństwa dla seniora** — Wykorzystanie akcelerometru w urządzeniu IoT (np. noszonym na opasce) do wykrywania upadków. W razie incydentu system automatycznie wysyła powiadomienie alarmowe z lokalizacją GPS do opiekuna korzystającego z aplikacji mobilnej.

71. **Aplikacja do przeprowadzania testów osobowości** — Aplikacja umożliwiająca przeprowadzenie prostych testów psychologicznych. Użytkownik odpowiada na serię pytań, a system generuje wynik w postaci profilu cech osobowości. Wyniki są prezentowane w formie wykresów lub diagramów.

72. **Aplikacja do monitorowania nawodnienia organizmu** — Aplikacja przypominająca o regularnym piciu wody. Użytkownik zapisuje ilość wypitej wody w ciągu dnia. System oblicza postęp w realizacji dziennego celu nawodnienia i generuje powiadomienia przypominające o konieczności uzupełnienia płynów.

73. **Aplikacja wspierająca krótkie sesje relaksacyjne** — Aplikacja umożliwiająca wykonywanie krótkich ćwiczeń relaksacyjnych lub medytacyjnych. Użytkownik wybiera rodzaj sesji oraz jej długość. Aplikacja prowadzi użytkownika poprzez instrukcje dźwiękowe lub wizualne.

74. **StressSense – aplikacja monitorująca poziom stresu** — Aplikacja analizująca oznaki stresu użytkownika. System może wykorzystywać dane z czujników telefonu, np. mikrofonu lub akcelerometru, a także krótkie ankiety. Na podstawie tych danych aplikacja estymuje poziom stresu i prezentuje wyniki w formie wykresów.

75. **Aplikacja do prowadzenia dziennika nawyków zdrowotnych** — Aplikacja umożliwiająca śledzenie codziennych nawyków zdrowotnych. Użytkownik może definiować własne cele, np. aktywność fizyczną, sen lub czas spędzony na nauce. System może generować przypomnienia o realizacji zaplanowanych aktywności.

## Zasoby pomocnicze

- [Android Developers — App Architecture](https://developer.android.com/topic/architecture)
- [Android Codelabs](https://developer.android.com/codelabs)
- [SwiftUI Tutorials — Apple](https://developer.apple.com/tutorials/swiftui)
- [Flutter Documentation](https://docs.flutter.dev/)
- [Firebase Getting Started](https://firebase.google.com/docs/guides)
- [Material Design 3](https://m3.material.io/)
- [Figma — Free for Students](https://www.figma.com/education/)

> **Ważne:** Kod projektu musi być oryginalny. Dozwolone jest korzystanie z bibliotek open-source i oficjalnej dokumentacji. Niedozwolone jest kopiowanie gotowych projektów. Plagiat skutkuje oceną niedostateczną.
