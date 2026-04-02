# Asystent uaktualniania wtyczki Androida Gradle (AGP) — podejście zaawansowane

Asystent uaktualniania AGP (Android Gradle Plugin Upgrade Assistant) w Android Studio to narzędzie, które automatyzuje dużą część migracji projektu między wersjami AGP. W wersji podstawowej „podnosi numer wersji i poprawia kilka plików”, ale w praktyce może być centralnym elementem **kontrolowanego procesu modernizacji build systemu**: AGP + Gradle + JDK + pluginy + CI.

W tym artykule skupiamy się na podejściu produkcyjnym: jak przeprowadzić migrację minimalizując ryzyko przestojów, regresji wydajności i niestabilności pipeline’ów.

---

## 1) Co faktycznie robi Upgrade Assistant (i czego nie robi)

### Co robi dobrze

- aktualizuje wersję AGP i (w wielu przypadkach) Gradle Wrapper,
- podpowiada wymagane zmiany DSL (np. przeniesienia/usunięcia przestarzałych opcji),
- wskazuje potencjalnie problematyczne miejsca w konfiguracji modułów,
- pomaga rozwiązać część znanych niezgodności związanych z namespace, build features i wariantami.

### Czego nie zrobi automatycznie

- nie naprawi niestandardowej logiki w `buildSrc`, convention plugins, composite builds,
- nie zagwarantuje kompatybilności wszystkich pluginów firm trzecich,
- nie zoptymalizuje czasu buildu po migracji,
- nie zweryfikuje poprawności testów instrumentacyjnych na wszystkich API/emulatorach.

Wniosek: traktuj asystenta jako **akcelerator refaktoryzacji builda**, a nie „magiczny fix wszystkiego”.

---

## 2) Strategia migracji w środowisku zespołowym

Najczęstszy błąd to „duży skok” + równoczesna aktualizacja połowy dependency graph. Lepsza strategia:

1. **Branch techniczny** tylko do upgrade AGP.
2. **Małe kroki**: AGP/Gradle/JDK, potem pluginy, potem biblioteki.
3. **Gates jakości** po każdym kroku:
   - `assembleDebug`,
   - testy jednostkowe,
   - testy instrumentacyjne (co najmniej smoke),
   - statyczna analiza,
   - benchmark czasu buildu.
4. **Porównanie metryk** przed/po migracji (czas konfiguracji, cache hit rate, APK/AAB size).

---

## 3) Przygotowanie projektu przed uruchomieniem asystenta

Przed kliknięciem „Run Upgrade Assistant” wykonaj checklistę:

- upewnij się, że branch jest czysty (`git status`),
- usuń lokalne „hotfixe” w Gradle, które nie są zacommitowane,
- zamroź merge do gałęzi release na czas migracji,
- uruchom pełny build referencyjny i zapisz wynik,
- wykonaj snapshot wersji:
  - AGP,
  - Gradle,
  - JDK,
  - Kotlin,
  - AndroidX,
  - pluginy (Hilt, KSP/KAPT, Google Services, Firebase itp.).

Dzięki temu po migracji łatwo rozpoznasz, czy problem wynika z AGP, czy z innego komponentu.

---

## 4) Typowe punkty zapalne po migracji AGP

## 4.1 Namespace i manifest package

W nowszych wersjach AGP wymagane jest jawne `namespace` w module Android.

```kotlin
android {
    namespace = "com.example.feature.profile"
    compileSdk = 35

    defaultConfig {
        minSdk = 24
        targetSdk = 35
    }
}
```

Uwaga: `namespace` i `applicationId` to nie to samo:

- `namespace` — przestrzeń klas R/BuildConfig i pakiet kodu,
- `applicationId` — identyfikator aplikacji publikowany w sklepie.

## 4.2 BuildConfig / resValues / buildFeatures

Jeśli korzystasz z pól generowanych przez build system, zweryfikuj, czy odpowiednie feature’y są jawnie włączone.

```kotlin
android {
    buildFeatures {
        buildConfig = true
    }

    defaultConfig {
        buildConfigField("String", "API_BASE", "\"https://api.example.com\"")
        resValue("string", "feature_flag", "enabled")
    }
}
```

## 4.3 Transform API, stare taski i wewnętrzne API Gradle

Wiele starszych pluginów korzystało z API, które zostało wycofane. Objawy:

- błędy typu „class not found” podczas konfiguracji,
- wyjątki przy rejestracji tasków,
- awarie tylko na CI (inna wersja JDK/Gradle).

W praktyce: najpierw zaktualizuj plugin do wersji wspierającej aktualne AGP, a dopiero potem diagnozuj build script.

## 4.4 KAPT/KSP i kolejność aktualizacji

AGP, Kotlin i KSP/KAPT są silnie sprzężone wersjami. Bezpieczny porządek:

1. AGP + Gradle + JDK,
2. Kotlin,
3. KSP (lub KAPT i procesory),
4. biblioteki bazujące na codegen.

---

## 5) Zaawansowana diagnostyka po użyciu asystenta

Po migracji uruchamiaj build z raportowaniem i skanowaniem:

```bash
./gradlew clean :app:assembleDebug --scan --stacktrace
```

Dodatkowo użyteczne są:

```bash
./gradlew :app:tasks --all
./gradlew :app:dependencies
./gradlew :app:dependencyInsight --dependency kotlin-stdlib
```

Czego szukać:

- konfliktów wersji (zwłaszcza Kotlin/AGP/pluginy),
- tasków niekompatybilnych z configuration cache,
- ostrzeżeń deprecacyjnych Gradle (to „dług techniczny na następną migrację”).

---

## 6) Upgrade Assistant + Version Catalog + Convention Plugins

W nowoczesnych projektach AGP trzymamy zwykle w `libs.versions.toml`, a logikę modułów w convention plugins. To zmniejsza koszt kolejnych migracji.

Przykład katalogu wersji:

```toml
[versions]
agp = "8.0.0"
kotlin = "2.0.0"

[plugins]
android-application = { id = "com.android.application", version.ref = "agp" }
android-library = { id = "com.android.library", version.ref = "agp" }
kotlin-android = { id = "org.jetbrains.kotlin.android", version.ref = "kotlin" }
```

W module:

```kotlin
plugins {
    alias(libs.plugins.android.application)
    alias(libs.plugins.kotlin.android)
}
```

Korzyść: kolejne podbicie AGP to zwykle jedna zmiana wersji + poprawki wskazane przez asystenta.

---

## 7) CI/CD po migracji — twarde zabezpieczenia

Po przejściu przez Upgrade Assistant dodaj do pipeline etap „upgrade guard”:

- build na czystym środowisku,
- walidacja minimalnego i docelowego API emulatora,
- weryfikacja release bundle,
- test odtwarzalności (powtórne uruchomienie z cache),
- archiwizacja raportów build scan.

Przykładowe komendy CI:

```bash
./gradlew --no-daemon clean :app:assembleDebug
./gradlew --no-daemon :app:testDebugUnitTest
./gradlew --no-daemon :app:bundleRelease
```

Jeśli korzystasz z remote cache, porównaj hit rate przed i po migracji — regresja często oznacza nieoptymalne task inputs/outputs albo zmianę fingerprintu środowiska.

---

## 8) Plan rollbacku (must-have w projektach produkcyjnych)

Każda migracja AGP powinna mieć plan wycofania:

- tag „baseline” przed migracją,
- osobny commit na każdy krok migracji,
- feature flagi dla ryzykownych zmian runtime,
- zdefiniowany warunek rollbacku (np. wzrost fail rate CI > 5% przez 24h).

Dzięki temu zespół nie boi się aktualizacji i utrzymuje „cadence” modernizacji (małe, częste upgrady zamiast dużych skoków raz na rok).

---

## 9) Najczęstsze antywzorce

- aktualizacja AGP i 50 bibliotek w jednym PR,
- brak porównania metryk build time,
- ignorowanie ostrzeżeń deprecacyjnych („przecież działa”),
- naprawianie błędów przez wyłączanie optymalizacji bez analizy przyczyny,
- brak testów instrumentacyjnych po migracji.

---

## 10) Praktyczny workflow „enterprise-ready”

1. Baseline i pomiar metryk.
2. Uruchomienie Upgrade Assistant.
3. Naprawa błędów kompilacji moduł po module.
4. Aktualizacja pluginów zależnych od AGP/Kotlin.
5. Pełny test matrix (unit + instrumented + smoke E2E).
6. Analiza wydajności buildu i cache.
7. Rollout etapowy (np. gałąź deweloperska → beta → release).

To podejście skraca czas „stabilizacji po migracji” i minimalizuje ryzyko niespodzianek w dniu wydania.

---

## Podsumowanie

Asystent uaktualniania AGP to bardzo skuteczne narzędzie, jeśli osadzisz je w dojrzałym procesie inżynierskim. Największe korzyści daje nie sam klik w IDE, ale połączenie:

- automatycznej migracji,
- standaryzacji build logic,
- kontrolowanej walidacji CI,
- i świadomego rollbacku.

W praktyce oznacza to szybsze aktualizacje, mniej awarii builda i łatwiejsze utrzymanie projektu Android w długim horyzoncie.

## Dalsza lektura

- Android Developers — Android Gradle Plugin: https://developer.android.com/build
- Android Developers — Migrate to new AGP versions: https://developer.android.com/build/releases/gradle-plugin
- Gradle Docs — Build performance i configuration cache: https://docs.gradle.org/
