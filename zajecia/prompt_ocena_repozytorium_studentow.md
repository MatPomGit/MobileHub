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
```

### 3. Skala przeliczenia punktów na ocenę

Stosuj następujące progi:

| Wynik punktowy | Ocena |
| -------------: | ----: |
|     91–100 pkt |   5.0 |
|      81–90 pkt |   4.5 |
|      71–80 pkt |   4.0 |
|      61–70 pkt |   3.5 |
|      51–60 pkt |   3.0 |
|       0–50 pkt |   2.0 |

Status zaliczenia:

* 51–100 pkt → zaliczone,
* 0–50 pkt → niezaliczone.

## Kryteria indywidualne dla ról

### Lider/PM: 0–60 pkt

Oceń Lidera/PM według następujących kryteriów:

| Obszar oceny                                                             | Maksymalna liczba punktów |
| ------------------------------------------------------------------------ | ------------------------: |
| Analiza produktu i backlog, w tym user stories oraz uzasadnienie mobilne |                        10 |
| Prototyp mobilny oraz podział na MVP i funkcje dodatkowe                 |                        10 |
| Opis aplikacji do Google Play lub analogiczny opis publikacyjny          |                        10 |
| Screeny i materiały promocyjne                                           |                        10 |
| Checklista testów akceptacyjnych                                         |                        10 |
| Changelog i instrukcja użytkownika                                       |                        10 |

### Frontend Developer: 0–60 pkt

Oceń Frontend Developera według następujących kryteriów:

| Obszar oceny                                                           | Maksymalna liczba punktów |
| ---------------------------------------------------------------------- | ------------------------: |
| Implementacja ekranów                                                  |                        10 |
| Integracja funkcji natywnych urządzenia                                |                        10 |
| Obsługa uprawnień oraz stanów loading/error/offline                    |                        10 |
| Integracja API, w tym auth i CRUD                                      |                        10 |
| Testy jednostkowe lub testy warstwy mobilnej                           |                        10 |
| Signed build i paczka do Play Console lub analogiczny artefakt wydania |                        10 |

### Backend Developer: 0–60 pkt

Oceń Backend Developera według następujących kryteriów:

| Obszar oceny                       | Maksymalna liczba punktów |
| ---------------------------------- | ------------------------: |
| Zakres API, w tym endpointy i auth |                        10 |
| JWT, hashowanie i zabezpieczenia   |                        10 |
| Model bazy danych i migracje       |                        10 |
| Testy integracyjne API             |                        10 |
| CI i deployment publiczny          |                        10 |
| Polityka prywatności i compliance  |                        10 |

## Jak masz oceniać

1. Najpierw określ, czym jest aplikacja i jaki problem rozwiązuje.
2. Sprawdź, na ile projekt spełnia wymagania zaliczeniowe.
3. Oceń aplikację zespołowo w skali 0–40 pkt.
4. Następnie przeanalizuj wkład i odpowiedzialność każdego członka zespołu.
5. Oceń każdą rolę indywidualnie w skali 0–60 pkt.
6. Oblicz ocenę końcową każdego studenta według wzoru:

```text
ocena końcowa studenta = punkty aplikacji zespołowej + punkty indywidualne roli
```

7. Przelicz wynik 0–100 pkt na ocenę 2.0–5.0.
8. Jeżeli projekt jest jednoosobowy lub role są nieostre, nadal podziel ocenę na trzy role, ale zaznacz, że jest to ocena funkcjonalna przypisana na podstawie repozytorium.
9. Jeżeli dana rola nie występuje w repozytorium lub nie da się jej potwierdzić, wpisz to jawnie i przyznaj punkty wyłącznie za potwierdzony zakres pracy.

## Zasady przyznawania punktów

* Przyznawaj punkty wyłącznie za elementy udokumentowane lub jednoznacznie wykazane w repozytorium.
* Nie dopisuj funkcji, których nie da się potwierdzić.
* Jeżeli coś jest częściowo zaimplementowane, przyznaj punkty proporcjonalnie.
* Jeżeli repozytorium zawiera błąd krytyczny, brak uruchamialności albo istotne braki architektoniczne, uwzględnij to w obniżeniu punktacji.
* Uwzględnij jakość kodu, czytelność, spójność, modularność, zgodność z architekturą, obsługę błędów, testowalność i kompletność dokumentacji.
* Uwzględnij wkład widoczny w historii commitów, PR-ach i code review.
* Jeżeli brak danych o historii pracy, oceń wyłącznie na podstawie kodu, dokumentacji i struktury projektu.
* Nie przyznawaj punktów za deklaracje w README, jeżeli nie są potwierdzone kodem, konfiguracją lub artefaktami projektu.
* Jeżeli wykryjesz plagiat, kopiowanie gotowego projektu, brak oryginalności lub repozytorium wygenerowane bez realnego wkładu zespołu, wskaż to jako krytyczny problem.

## Format odpowiedzi

Wygeneruj wynik wyłącznie w Markdown i zastosuj dokładnie poniższą strukturę.

# Ocena projektu: [nazwa projektu]

## 1. Opis aplikacji

Napisz 5–6 zdań opisujących opracowaną aplikację: co robi, dla kogo jest przeznaczona, jaki problem rozwiązuje, jakie ma główne moduły i jaki jest ogólny poziom dojrzałości projektu.

## 2. Ocena zespołowa aplikacji

Podaj krótkie podsumowanie oraz tabelę z punktacją cząstkową.

Tabela ma mieć kolumny:

* Kryterium,
* Punkty,
* Uzasadnienie.

Zastosuj dokładnie następujące kryteria:

| Kryterium                                               |  Punkty | Uzasadnienie |
| ------------------------------------------------------- | ------: | ------------ |
| Działanie aplikacji na fizycznym smartfonie lub demo    | ... / 5 | ...          |
| Wykorzystanie funkcji natywnych urządzenia              | ... / 5 | ...          |
| Integracja mobile–backend, w tym auth i dane            | ... / 5 | ...          |
| Działający przepływ end-to-end                          | ... / 5 | ...          |
| Issues, milestones i organizacja sprintów               | ... / 5 | ...          |
| Pull requesty i code review w repozytorium              | ... / 5 | ...          |
| CI/CD, testy jednostkowe i integracyjne API             | ... / 5 | ...          |
| Signed build oraz gotowość lub publikacja w Google Play | ... / 5 | ...          |

Na końcu tej sekcji podaj:

**Suma punktów zespołowych:** ... / 40
**Ocena zespołowa aplikacji:** ...
**Status aplikacji:** zaliczone / niezaliczone

## 3. Ocena indywidualna członków zespołu

Dla każdej z ról przygotuj osobną podsekcję:

* Lider/PM,
* Frontend Developer,
* Backend Developer.

W każdej podsekcji podaj:

* krótkie streszczenie odpowiedzialności tej roli na podstawie repozytorium,
* jakie wymagania projektowe ta rola realizuje,
* tabelę z punktacją indywidualną,
* sumę punktów indywidualnych w skali 0–60,
* wynik końcowy studenta w skali 0–100,
* ocenę końcową w skali 2.0–5.0,
* status: zaliczone / niezaliczone.

### Lider/PM

Opisz odpowiedzialność Lidera/PM na podstawie repozytorium.

| Obszar oceny                                                            |   Punkty | Uzasadnienie |
| ----------------------------------------------------------------------- | -------: | ------------ |
| Analiza produktu i backlog, w tym user stories oraz uzasadnienie mobile | ... / 10 | ...          |
| Prototyp mobilny oraz podział MVP/dodatki                               | ... / 10 | ...          |
| Opis aplikacji do Google Play lub analogiczny opis publikacyjny         | ... / 10 | ...          |
| Screeny i materiały promocyjne                                          | ... / 10 | ...          |
| Checklista testów akceptacyjnych                                        | ... / 10 | ...          |
| Changelog i instrukcja użytkownika                                      | ... / 10 | ...          |

**Punkty indywidualne Lider/PM:** ... / 60
**Punkty zespołowe aplikacji:** ... / 40
**Wynik końcowy Lider/PM:** ... / 100
**Ocena końcowa Lider/PM:** ...
**Status:** zaliczone / niezaliczone

### Frontend Developer

Opisz odpowiedzialność Frontend Developera na podstawie repozytorium.

| Obszar oceny                                                           |   Punkty | Uzasadnienie |
| ---------------------------------------------------------------------- | -------: | ------------ |
| Implementacja ekranów                                                  | ... / 10 | ...          |
| Integracja funkcji natywnych urządzenia                                | ... / 10 | ...          |
| Obsługa uprawnień oraz loading/error/offline                           | ... / 10 | ...          |
| API, w tym auth i CRUD                                                 | ... / 10 | ...          |
| Testy jednostkowe lub testy warstwy mobilnej                           | ... / 10 | ...          |
| Signed build i paczka do Play Console lub analogiczny artefakt wydania | ... / 10 | ...          |

**Punkty indywidualne Frontend Developer:** ... / 60
**Punkty zespołowe aplikacji:** ... / 40
**Wynik końcowy Frontend Developer:** ... / 100
**Ocena końcowa Frontend Developer:** ...
**Status:** zaliczone / niezaliczone

### Backend Developer

Opisz odpowiedzialność Backend Developera na podstawie repozytorium.

| Obszar oceny                       |   Punkty | Uzasadnienie |
| ---------------------------------- | -------: | ------------ |
| Zakres API, w tym endpointy i auth | ... / 10 | ...          |
| JWT, hashowanie i zabezpieczenia   | ... / 10 | ...          |
| Model bazy danych i migracje       | ... / 10 | ...          |
| Testy integracyjne API             | ... / 10 | ...          |
| CI i deployment publiczny          | ... / 10 | ...          |
| Polityka prywatności i compliance  | ... / 10 | ...          |

**Punkty indywidualne Backend Developer:** ... / 60
**Punkty zespołowe aplikacji:** ... / 40
**Wynik końcowy Backend Developer:** ... / 100
**Ocena końcowa Backend Developer:** ...
**Status:** zaliczone / niezaliczone

## 4. Wnioski końcowe

Na końcu dodaj 3–5 krótkich punktów z najważniejszymi mocnymi stronami i brakami projektu. Wnioski mają być konkretne i techniczne.

Uwzględnij:

* najważniejsze spełnione wymagania,
* największe braki techniczne,
* ryzyka dotyczące stabilności, bezpieczeństwa lub uruchamialności,
* jakość podziału pracy,
* najważniejszą rekomendację poprawy projektu.

## Dodatkowe wymagania dotyczące stylu

* Pisz rzeczowo, bez nadmiaru ozdobników.
* Używaj terminologii technicznej właściwej dla analizy repozytorium.
* Nie twórz fikcyjnych danych.
* Jeżeli brak informacji, zaznacz to wprost jako ograniczenie oceny.
* Zachowaj spójność punktacji z opisem.
* Nie stosuj ogólników typu „dobrze napisany kod” bez wskazania, co dokładnie jest dobre.
* Nie opisuj procesu analizy.
* Nie dodawaj metakomentarzy.
* Nie pomijaj żadnej wymaganej sekcji.
* Zwróć tylko gotowy raport w Markdown.

```
::contentReference[oaicite:1]{index=1}
```

[1]: https://matpomgit.github.io/MobileHub/obrona_projektu.html "Obrona projektu — PAM"
