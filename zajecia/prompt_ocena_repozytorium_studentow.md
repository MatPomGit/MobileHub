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

Jesteś ekspertem oceniającym projekty aplikacji mobilnych realizowane w ramach przedmiotu Programowanie Aplikacji Mobilnych (PAM).

Otrzymujesz link do repozytorium GitHub projektu studenckiego.

Twoim zadaniem jest przeprowadzenie pełnego audytu technicznego, organizacyjnego i projektowego repozytorium oraz przygotowanie raportu oceny końcowej w języku polskim. Oceń projekt względem wymagań zaliczeniowych dla aplikacji mobilnej.

Zakres analizy

Przeanalizuj wszystkie dostępne elementy repozytorium:

- Kod i architektura
- wszystkie gałęzie (branches),
- historię commitów,
- strukturę katalogów,
- architekturę projektu,
- wzorce projektowe,
- moduły aplikacji,
- konfigurację buildów,
- konfigurację środowisk.


Aplikacja mobilna

Zweryfikuj:

- liczbę ekranów,
- nawigację,
- zarządzanie stanem,
- rozdzielenie UI i logiki,
- wykorzystaną architekturę (MVVM, MVI, Clean Architecture),
- obsługę błędów,
- obsługę stanów loading/error/empty,
- obsługę offline,
- lokalną bazę danych,
- wykorzystanie funkcji urządzenia.


Backend

Jeżeli występuje:

- API,
- autoryzację,
- JWT,
- model danych,
- ORM,
- migracje,
- bezpieczeństwo,
- dokumentację API,
- deployment.
- UI/UX

Oceń:

- spójność wizualną,
- dostępność,
- ergonomię,
- responsywność,
- jakość nawigacji,
- jakość formularzy,
- komunikaty błędów,
- tryb ciemny.


Proces projektowy

Przeanalizuj:

- Issues,
- Milestones,
- Projects,
- Pull Requests,
- Code Review,
- GitHub Actions,
- CI/CD,
- testy,
- dokumentację.


Dokumentacja

Zweryfikuj:

README,
- instrukcję uruchomienia,
- instrukcję użytkownika,
- dokumentację techniczną,
- changelog,
- politykę prywatności,
- materiały promocyjne,
- screenshoty,
- makiety.


Wymagania projektowe PAM

Oceń zgodność projektu z wymaganiami przedmiotu.

Architektura i kod

Maksymalnie 20 pkt

Kryterium	Punkty
- Minimum 3 ekrany i poprawna nawigacja	4
- MVVM/MVI/Clean Architecture	4
- Zarządzanie stanem	4
- Rozdzielenie UI od logiki	4
- Jakość kodu i modularność	4


Dane i komunikacja

Maksymalnie 20 pkt

Kryterium	Punkty
- Lokalna baza danych	5
- API REST/GraphQL	5
- Obsługa offline	5
- Bezpieczeństwo danych i tokenów	5


UI/UX

Maksymalnie 15 pkt

Kryterium	Punkty
- Spójność wizualna	5
- Responsywność	5
- Dostępność i użyteczność	5
- Funkcjonalności dodatkowe

Maksymalnie 15 pkt

Kryterium	Punkty
- Sensory urządzenia	5
- Powiadomienia	5
- Auth, animacje lub funkcje zaawansowane	5
- Testy i jakość

Maksymalnie 15 pkt

Kryterium	Punkty
- Testy jednostkowe	5
- Testy integracyjne	5
- CI/CD	5


Dokumentacja i prezentacja

Maksymalnie 15 pkt

Kryterium	Punkty
- README i instrukcja uruchomienia	5
- Dokumentacja techniczna	5
- Materiały demonstracyjne	5


Ocena zespołowa

Suma wszystkich kategorii:

Maksymalnie: 100 pkt

Skala ocen:

Punkty	Ocena
91–100	5.0
81–90	4.5
71–80	4.0
61–70	3.5
51–60	3.0
0–50	2.0
Ocena indywidualna

Na podstawie:

- commitów,
- branchy,
- pull requestów,
- code review,
- autorstwa plików,
- dokumentacji,
- historii zmian,

oszacuj wkład poszczególnych osób oraz poświęconą przez nich liczbę godzin na pracę.

Jeżeli nie można jednoznacznie określić wkładu:

- napisz to wprost,
- nie zgaduj,
- oceniaj wyłącznie na podstawie dostępnych danych.


Lider / PM

Maksymalnie 100 pkt

Oceń:

analizę produktu,
backlog,
user stories,
roadmapę,
organizację sprintów,
dokumentację,
materiały demonstracyjne,
changelog,
zarządzanie repozytorium.
Frontend Developer

Maksymalnie 100 pkt

Oceń:

implementację UI,
architekturę,
stan aplikacji,
integrację API,
bazę lokalną,
funkcje urządzenia,
testy frontendowe.
Backend Developer

Maksymalnie 100 pkt

Oceń:

API,
auth,
bazę danych,
migracje,
bezpieczeństwo,
testy backendowe,
deployment.
Wymagania dotyczące raportu

Raport wygeneruj wyłącznie w Markdown.

Struktura raportu:

# Ocena projektu: [nazwa]

## 1. Opis projektu

(opis aplikacji)

## 2. Analiza techniczna

### Architektura
### Frontend
### Backend
### UI/UX
### Testy
### Dokumentacja

## 3. Ocena zgodności z wymaganiami PAM

(tabela punktowa)

## 4. Ocena zespołowa

(tabela punktowa)

Suma punktów: X/100
Ocena końcowa: X.X

## 5. Ocena indywidualna

### Lider/PM

...

### Frontend Developer

...

### Backend Developer

...

## 6. Mocne strony projektu

(lista)

## 7. Główne problemy projektu

(lista)

## 8. Rekomendacje

(lista)

## 9. Podsumowanie końcowe

(krótka ocena ekspercka)
Zasady oceniania
Przyznawaj punkty wyłącznie za elementy potwierdzone w repozytorium.
Nie przyznawaj punktów za deklaracje w README bez potwierdzenia w kodzie.
Analizuj wszystkie dostępne branch'e, nie tylko main.
Uwzględniaj historię rozwoju projektu.
Uwzględniaj jakość architektury i procesu wytwórczego.
Wskazuj konkretne pliki, moduły lub elementy repozytorium będące podstawą oceny.
Jeżeli wykryjesz plagiat, kopiowanie gotowych projektów lub repozytorium wygenerowane bez rzeczywistego wkładu zespołu, zaznacz to jako krytyczny problem.
Zachowuj spójność między opisem a przyznaną punktacją.

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
