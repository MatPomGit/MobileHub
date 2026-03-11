# Projekt Zaliczeniowy — Własna Aplikacja Mobilna

Projekt zaliczeniowy to samodzielnie zaprojektowana i zaimplementowana aplikacja mobilna. Stanowi praktyczne potwierdzenie opanowania umiejętności programistycznych zdobytych w ramach przedmiotu **Programowanie Aplikacji Mobilnych (PAM)**.

## Cel projektu

Celem projektu jest zaprojektowanie, zaimplementowanie i zaprezentowanie oryginalnej aplikacji mobilnej działającej na platformie Android lub iOS (lub cross-platform). Aplikacja powinna rozwiązywać realny problem lub dostarczać konkretnej wartości użytkownikowi.

## Wymagania techniczne

### Obowiązkowe elementy aplikacji

- **Interfejs użytkownika** — co najmniej 3 ekrany/widoki z nawigacją między nimi,
- **Przechowywanie danych** — lokalna baza danych (Room, CoreData, SQLite lub odpowiednik),
- **Komunikacja sieciowa** — wywołanie zewnętrznego API (REST, GraphQL lub WebSocket),
- **Obsługa stanu** — poprawne zarządzanie stanem aplikacji (ViewModel, StateFlow, Provider lub odpowiednik),
- **Architektura** — zastosowanie wzorca MVVM, MVI lub Clean Architecture.

### Dodatkowe elementy (podnoszące ocenę)

- Obsługa sensorów urządzenia (GPS, aparat, mikrofon, akcelerometr),
- Powiadomienia push lub lokalne,
- Uwierzytelnianie użytkownika (Firebase Auth lub własne),
- Animacje i zaawansowane interakcje dotykowe,
- Tryb offline z synchronizacją,
- Dostępność (a11y) — obsługa TalkBack/VoiceOver,
- Testy jednostkowe lub instrumentalne.

## Platformy i technologie

| Platforma         | Technologia              | Język            |
|-------------------|--------------------------|------------------|
| Android (natywny) | Jetpack Compose + Jetpack | Kotlin           |
| iOS (natywny)     | SwiftUI + UIKit          | Swift            |
| Cross-platform    | Flutter                  | Dart             |
| Cross-platform    | React Native             | JavaScript/TS    |
| Cross-platform    | Kotlin Multiplatform     | Kotlin           |

> **Uwaga:** Wybór platformy jest dowolny, jednak platforma musi być uzgodniona z prowadzącym na początku semestru.

## Harmonogram realizacji

| Termin            | Kamień milowy                                              |
|-------------------|------------------------------------------------------------|
| Tydzień 3         | Zgłoszenie tematu i platformy — akceptacja przez prowadzącego |
| Tydzień 6         | Wireframy i projekt UI (Figma lub szkice)                   |
| Tydzień 9         | Demo MVP — działające podstawowe funkcje                    |
| Tydzień 12        | Wersja beta — pełna funkcjonalność, testy                   |
| Sesja egzaminacyjna | Prezentacja finalna + oddanie kodu źródłowego             |

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
91–100 pkt → 5.0 (celujący)
81–90  pkt → 4.5 (bardzo dobry+)
71–80  pkt → 4.0 (bardzo dobry)
61–70  pkt → 3.5 (dobry+)
51–60  pkt → 3.0 (dostateczny)
< 51   pkt → 2.0 (niedostateczny)
```

## Dokumentacja projektu

Do oddawanego projektu należy dołączyć:

1. **README.md** — opis projektu, instrukcja uruchomienia, screenshoty,
2. **Diagram architektury** — schemat warstw aplikacji,
3. **Opis API** — lista wykorzystanych endpointów,
4. **Instrukcja testowania** — jak przetestować kluczowe funkcje,
5. **Wkład własny** — co zostało samodzielnie zaprojektowane i zaimplementowane.

## Prezentacja projektu

Każdy student prezentuje projekt indywidualnie (lub w parach — po uzgodnieniu):

- Czas prezentacji: **8–12 minut**,
- Demonstracja działania na urządzeniu fizycznym lub emulatorze,
- Omówienie architektury i napotkanych trudności,
- Krótkie pytania techniczne od prowadzącego.

## Przykładowe tematy projektów

### Aplikacje użytkowe
- Aplikacja do zarządzania zadaniami z synchronizacją w chmurze,
- Kalkulator finansowy / tracker budżetu domowego,
- Aplikacja do nauki słówek z fiszkami i algorytmem powtórzeń,
- Dziennik treningowy z mapą tras i analizą danych.

### Aplikacje społecznościowe
- Lokalna tablica ogłoszeń z geolokalizacją,
- Aplikacja do wspólnego planowania wyjazdów,
- Platforma recenzji lokalnych restauracji.

### Aplikacje z sensorami
- Augmented Reality z ARCore/ARKit — gra lub narzędzie edukacyjne,
- Aplikacja do analizy dźwięku (tuner instrumentu, SOS, metronom),
- Śledzenie aktywności fizycznej z akcelerometrem i GPS,
- Skaner i rozpoznawanie obiektów z ML Kit.

### Aplikacje IoT
- Sterowanie inteligentnym oświetleniem przez BLE/Wi-Fi,
- Dashboard monitoringu sensorów (temperatura, wilgotność),
- Aplikacja-pilot do robota mobilnego.

## Zasoby pomocnicze

- [Android Developers — App Architecture](https://developer.android.com/topic/architecture)
- [Android Codelabs](https://developer.android.com/codelabs)
- [SwiftUI Tutorials — Apple](https://developer.apple.com/tutorials/swiftui)
- [Flutter Documentation](https://docs.flutter.dev/)
- [Firebase Getting Started](https://firebase.google.com/docs/guides)
- [Material Design 3](https://m3.material.io/)
- [Figma — Free for Students](https://www.figma.com/education/)

> **Ważne:** Kod projektu musi być oryginalny. Dozwolone jest korzystanie z bibliotek open-source i oficjalnej dokumentacji. Niedozwolone jest kopiowanie gotowych projektów. Plagiat skutkuje oceną niedostateczną.
