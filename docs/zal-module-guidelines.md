# Wytyczne dla modułu ZAL (wejściówki i zaliczenia online)

## Cel
Moduł **ZAL** ma umożliwiać realizację wejściówek i zaliczeń online z kontrolą proktoringu,
przy zachowaniu bezpieczeństwa, audytowalności i dostępności.

## Zakres MVP (proponowany)
1. Tworzenie sesji zaliczeniowych (termin, czas trwania, liczba podejść).
2. Przypisanie sesji do grup studenckich.
3. Uruchamianie testu z odliczaniem czasu i automatycznym zapisem postępu.
4. Podstawowe reguły proktoringu (kamera/mikrofon, wykrywanie opuszczenia karty, log zdarzeń).
5. Widok wyników i raport dla prowadzącego.

## Wymagania funkcjonalne
- Role: student, prowadzący, administrator.
- Losowanie pytań z banku oraz mieszanie odpowiedzi.
- Obsługa pytań zamkniętych i otwartych (min. jednokrotny wybór + krótka odpowiedź).
- Definiowanie progów punktowych i skali ocen.
- Możliwość ręcznej korekty oceny odpowiedzi otwartych.

## Wymagania niefunkcjonalne
- Pełny log audytowy: start/stop sesji, naruszenia, zmiany konfiguracji.
- Odporność na utratę połączenia (buforowanie lokalne + synchronizacja po odzyskaniu sieci).
- Responsywność mobilna (minimum telefony 360px+).
- Dostępność: nawigacja klawiaturą, kontrast, komunikaty dla czytników ekranowych.

## Proktoring — zasady implementacyjne
- Wyraźna zgoda użytkownika przed aktywacją kamery/mikrofonu.
- Transparentna polityka przechowywania nagrań i metadanych.
- Rejestrowanie tylko niezbędnych sygnałów (privacy by design).
- Oznaczanie incydentów jako "do weryfikacji", bez automatycznego karania bez decyzji prowadzącego.

## Bezpieczeństwo i zgodność
- Silne uwierzytelnienie i autoryzacja ról.
- Ochrona API przed nadużyciami (rate limiting, walidacja payloadów).
- Szyfrowanie danych w tranzycie i w spoczynku.
- Minimalizacja danych osobowych oraz zgodność z RODO i regulaminem uczelni.

## Sugerowana architektura modułu
- Warstwa UI: formularze sesji, ekran testu, panel incydentów, raporty.
- Warstwa usług: sesje, pytania, oceny, proktoring events.
- Warstwa danych: pytania, próby, odpowiedzi, logi audytowe.
- Integracje: LMS/USOS (opcjonalnie), eksport CSV/PDF.

## Następne kroki
1. Przygotować makiety ekranów (student/prowadzący).
2. Spisać model danych (encje i relacje).
3. Zdefiniować protokół zdarzeń proktoringowych i ich priorytety.
4. Opracować scenariusze testów QA dla integralności i uczciwości egzaminu.
