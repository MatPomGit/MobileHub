# Google Maven Repository w Androidzie

Google Maven Repository to oficjalny katalog artefaktów Android i bibliotek Google dostępnych dla Gradle. Dla nowoczesnego projektu mobilnego obecność `google()` jest praktycznie standardem produkcyjnym.

## Dlaczego ten repozytorium jest krytyczne

Bez `google()` możesz mieć problemy z rozwiązywaniem zależności takich jak:

- AndroidX,
- Google Play services,
- Android Gradle Plugin i jego komponenty.

W praktyce oznacza to błędy builda, niespójne środowiska deweloperskie i dłuższy czas diagnozy.

## Minimalna konfiguracja (Kotlin DSL)

```kotlin
repositories {
    google()
    mavenCentral()
}
```

## Kolejność repozytoriów ma znaczenie

W wielu zespołach rekomenduje się `google()` przed `mavenCentral()`, aby:

- skrócić czas rozwiązywania artefaktów Android,
- ograniczyć ryzyko kolizji metadanych,
- utrzymać spójność w CI/CD.

W dużych monorepo nawet niewielkie usprawnienie dependency resolution może przełożyć się na zauważalny zysk czasu pipeline’ów.

## Konkretne metryki dla zespołu R&D

Warto monitorować:

- **czas konfiguracji Gradle** (`configuration time`),
- **czas resolve zależności** na clean buildzie,
- **cache hit ratio** w CI,
- liczbę incydentów „Could not resolve ...” na sprint.

Prosty cel operacyjny: redukcja błędów rozwiązywania zależności do poziomu bliskiego **0 na release branch**.

## Najczęstsze problemy i szybka diagnoza

1. **Nieprawidłowa wersja biblioteki** - artefakt nie istnieje w tej wersji.
2. **Repozytoria w złym miejscu** - deklaracja tylko w module zamiast globalnie.
3. **Niespójne ustawienia** między lokalnym buildem a CI.
4. **Blokady sieciowe/proxy** w środowiskach firmowych.

## Ciekawostka praktyczna

W projektach edukacyjnych i zespołach juniorowych najwięcej czasu traci się nie na pisaniu kodu, ale na „niewidzialnym” długu buildowym. Dobrze ustawione repozytoria i wersjonowanie zależności potrafią skrócić onboarding nowej osoby z kilku dni do kilku godzin.

## Materiały źródłowe

- Indeks repozytorium: https://maven.google.com/web/m_index.html
