# Laboratorium i projekt

## Projekt aplikacji mobilnej

Zaprojektuj i zaimplementuj aplikację mobilną w zespole jako zaliczenie laboratoriów PAM.

**Szybki dostęp dla wykładowcy**

[Przejdź do modułu oceniania](#lecturerGradingCard)

### Harmonogram realizacji

* **Laboratoria nr 3/4 - zgłoszenie tematu**
  Wybór platformy, zarys funkcjonalności, akceptacja przeze mnie.

* **Laboratoria nr 7/8 - prezentacja końcowa**
  Prezentacja projektu (10–15 min) + oddanie kodu źródłowego i dokumentacji.

### Narzędzia do realizacji

[**Moja pierwsza aplikacja mobilna**

Przewodnik krok po kroku przez przygotowanie środowiska, strukturę projektu i pierwsze
kluczowe funkcje. Od zera do działającego MVP.


Otwórz przewodnik](pages/guides/pierwsza-aplikacja.html)

[**Kreator projektu aplikacji**

Zamień pomysł w plan realizacji: zakres, zadania, roboczogodziny, wycena i baza pod dokumenty
BRD/FRD/TRD.

 Otwórz kreator](pages/guides/projektowanie-aplikacji.html)

### Wymagania techniczne

**Architektura i kod**

* Co najmniej 3 ekrany z nawigacją
* Wzorzec MVVM, MVI lub Clean Architecture
* Poprawne zarządzanie stanem (ViewModel / StateFlow)
* Rozdzielenie warstwy UI od logiki

**Dane i sieć**

* Lokalna baza danych (Room, CoreData, SQLite)
* Komunikacja z zewnętrznym API (REST lub GraphQL)
* Obsługa błędów sieciowych i stanu offline
* Bezpieczne przechowywanie kluczy i tokenów

**UI/UX**

* Spójny system kolorów i typografii
* Responsywność na różnych rozmiarach ekranów
* Podstawowa dostępność (content descriptions, kontrast)
* Obsługa trybu ciemnego (opcjonalnie)

**Elementy dodatkowe**

* Sensory (GPS, kamera, mikrofon, akcelerometr)
* Powiadomienia push lub lokalne
* Uwierzytelnianie użytkownika
* Testy jednostkowe lub instrumentalne
* Animacje i zaawansowane gesty

### Moduł oceniania dla wykładowcy

Wprowadź punkty cząstkowe, aby automatycznie obliczyć wynik końcowy i sugestię informacji zwrotnej.

**Działające funkcje podstawowe**
Maks. 30 pkt

**Jakość kodu i architektura**
Maks. 20 pkt

**Interfejs użytkownika i UX**
Maks. 15 pkt

**Komunikacja sieciowa i dane**
Maks. 15 pkt

**Prezentacja i dokumentacja**
Maks. 10 pkt

**Dodatkowe funkcje i kreatywność**
Maks. 10 pkt

Łącznie punktów
**0 / 100**

Proponowana ocena
**2.0**

Status
**Nie zaliczono**


### Projekt zaliczeniowy

---

# Projekt aplikacji

Projekt zaliczeniowy to samodzielnie zaprojektowana i zaimplementowana aplikacja mobilna. Stanowi praktyczne potwierdzenie opanowania umiejętności programistycznych zdobytych w ramach przedmiotu **Programowanie Aplikacji Mobilnych (PAM)**.

## Cel projektu

Celem projektu jest zaprojektowanie, zaimplementowanie i zaprezentowanie oryginalnej aplikacji mobilnej działającej na platformie Android lub iOS (lub cross-platform). Aplikacja powinna rozwiązywać realny problem lub dostarczać konkretnej wartości użytkownikowi.

## Opis wymagań projektu

Semestralny projekt polega na zaprojektowaniu i wdrożeniu kompletnej aplikacji mobilnej (frontend + backend) w warunkach zbliżonych do pracy w firmie IT. **Zespół 3-osobowy** (w wyjątkwych przypadkach może być 4) pracuje w repozytorium Git z wykorzystaniem branchingu, pull requestów, code review, CI/CD, testów automatycznych oraz dokumentacji technicznej i użytkowej.

Projekt polega na zaprojektowaniu i wdrożeniu aplikacji mobilnej, która **realnie wykorzystuje możliwości smartfona**, a nie jest jedynie „przeniesioną wersją aplikacji desktopowej". Aplikacja musi działać na **fizycznym urządzeniu (Android)** i zostać przygotowana do publikacji w sklepie Play.

### Checklista ogólnych wymagań projektu - dla całego zespołu

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

> **Uwaga:** Wybór platformy jest dowolny, jednak platforma musi być uzgodniona z prowadzącym

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

## Dokumentacja projektu

Do oddawanego projektu należy dołączyć

1. **README.md** - opis projektu, instrukcja uruchomienia, screenshoty
2. **Diagram architektury** - schemat warstw aplikacji
3. **Opis API** - lista wykorzystanych endpointów
4. **Instrukcja testowania** - jak przetestować kluczowe funkcje
5. **Wkład własny** - co zostało samodzielnie zaprojektowane i zaimplementowane

## Prezentacja projektu

Każdy zespół prezentuje projekt

- Czas prezentacji: **8–12 minut**
- Demonstracja działania na urządzeniu fizycznym lub emulatorze
- Omówienie architektury i napotkanych trudności
- Krótkie pytania techniczne od prowadzącego

### Progi ocen

```
91–100 pkt → 5.0 (bardzo dobry)
81–90  pkt → 4.5 (dobry+)
71–80  pkt → 4.0 (dobry)
61–70  pkt → 3.5 (dostateczny+)
51–60  pkt → 3.0 (dostateczny)
< 50   pkt → 2.0 (niedostateczny)
```

## Zasoby pomocnicze

- [Moja pierwsza aplikacja mobilna](pages/guides/pierwsza-aplikacja.html)
- [Kreator projektu aplikacji](pages/guides/projektowanie-aplikacji.html)
- [Android Developers - App Architecture](https://developer.android.com/topic/architecture)
- [Android Codelabs](https://developer.android.com/codelabs)
- [SwiftUI Tutorials - Apple](https://developer.apple.com/tutorials/swiftui)
- [Flutter Documentation](https://docs.flutter.dev/)
- [Firebase Getting Started](https://firebase.google.com/docs/guides)
- [Material Design 3](https://m3.material.io/)
- [Figma - Free for Students](https://www.figma.com/education/)
