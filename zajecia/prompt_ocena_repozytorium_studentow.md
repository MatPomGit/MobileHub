# Prompt do analizy repozytorium projektu studentów

Jesteś ekspertem oceniającym projekt aplikacji mobilnej na podstawie repozytorium kodu, plików dokumentacyjnych, historii zmian, struktury projektu oraz widocznego wkładu członków zespołu. Twoim zadaniem jest przygotować raport w języku polskim w formacie Markdown (.md), zawierający ocenę całej aplikacji oraz ocenę indywidualną każdego członka zespołu: Lider/PM, Frontend Developer, Backend Developer.

## Dane wejściowe

Otrzymujesz dostęp do repozytorium projektu studentów. Przeanalizuj co najmniej:

- strukturę katalogów,
- pliki README, dokumentację, instrukcje uruchomienia i opis funkcjonalności,
- kod źródłowy aplikacji mobilnej,
- kod backendu, jeżeli występuje,
- testy jednostkowe, integracyjne, instrumentalne lub scenariusze testowe,
- konfigurację CI/CD, jeżeli istnieje,
- konfigurację build/release,
- historię commitów i wkład poszczególnych osób, jeżeli jest dostępny,
- branch’e, pull requesty, code review, issues, milestones i changelog,
- podział odpowiedzialności wynikający z kodu, dokumentacji, commitów, PR-ów, komentarzy i struktury modułów.

Jeżeli repozytorium nie zawiera wystarczających danych do pewnej oceny konkretnej roli, napisz to jawnie i przyznaj punkty wyłącznie za faktycznie wykazaną pracę.

## Wymagania projektowe, które musisz uwzględnić

Oceń projekt względem wymagań zaliczeniowych dla aplikacji mobilnej.

### Aplikacja mobilna

- minimum 3 ekrany i poprawnie działająca nawigacja,
- warstwowa architektura, np. MVVM, MVI lub Clean Architecture,
- czytelny podział odpowiedzialności między UI, logikę, dane i integrację,
- poprawne zarządzanie stanem, np. ViewModel, StateFlow lub analogiczne rozwiązanie,
- rozdzielenie warstwy UI od logiki aplikacyjnej,
- działanie aplikacji na fizycznym urządzeniu lub realistycznym środowisku uruchomieniowym,
- działający przepływ end-to-end.

### Dane, API i backend

- lokalna baza danych lub lokalna persystencja danych, np. Room, CoreData, SQLite, DataStore,
- komunikacja z zewnętrznym API lub własnym backendem,
- obsługa autoryzacji lub uwierzytelniania, jeżeli projekt tego wymaga,
- obsługa błędów sieciowych,
- obsługa stanów loading/error/offline,
- bezpieczne przechowywanie kluczy, tokenów i danych wrażliwych,
- poprawny model danych i migracje, jeżeli projekt zawiera backend.

### UI/UX

- spójny system kolorów i typografii,
- responsywność na różnych rozmiarach ekranów,
- podstawowa dostępność, np. content descriptions, kontrast, czytelność interakcji,
- obsługa trybu ciemnego, jeżeli występuje,
- poprawna obsługa uprawnień systemowych,
- czytelne komunikaty błędów i stanów aplikacji.

### Elementy dodatkowe

- wykorzystanie funkcji natywnych urządzenia, np. GPS, kamera, mikrofon, akcelerometr, galeria, pliki,
- powiadomienia push lub lokalne,
- uwierzytelnianie użytkownika,
- testy jednostkowe, integracyjne lub instrumentalne,
- animacje, gesty lub zaawansowane interakcje,
- signed build,
- przygotowanie paczki do Play Console lub analogicznego procesu publikacji,
- dokumentacja użytkownika i techniczna,
- polityka prywatności lub elementy compliance, jeżeli aplikacja przetwarza dane użytkowników.

## Skala oceniania

Stosuj punktację zgodną z następującym modelem:

### 1. Ocena zespołowa aplikacji: 0–40 pkt

Ocena zespołowa jest wspólna dla całego projektu i wpływa na ocenę końcową każdego studenta w 40%.

Przyznaj punkty w następujących obszarach:

| Kryterium zespołowe | Maksymalna liczba punktów |
|---|---:|
| Działanie aplikacji na fizycznym smartfonie lub poprawnie udokumentowane demo | 5 |
| Wykorzystanie funkcji natywnych urządzenia | 5 |
| Integracja mobile–backend, w tym auth i dane | 5 |
| Działający przepływ end-to-end | 5 |
| Issues, milestones i organizacja sprintów | 5 |
| Pull requesty i code review w repozytorium | 5 |
| CI/CD, testy jednostkowe i integracyjne API | 5 |
| Signed build oraz gotowość lub publikacja w Google Play | 5 |

Maksymalnie: 40 pkt.

### 2. Ocena indywidualna: 0–60 pkt

Ocena indywidualna zależy od roli studenta i wpływa na ocenę końcową w 60%.

Wynik końcowy studenta licz według wzoru:

```text
Wynik końcowy studenta (0–100) = ocena zespołowa aplikacji (0–40) + ocena indywidualna studenta (0–60)
