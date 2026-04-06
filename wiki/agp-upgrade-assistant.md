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

---

## Configuration Cache — korzyści i pułapki po migracji AGP

Configuration Cache (CC) to mechanizm Gradle serializujący wynik fazy konfiguracji do pliku binarnego. Przy kolejnym wywołaniu z identycznym zestawem wejść Gradle pomija tę fazę całkowicie, skracając czas „first build" nawet o 40–60% w dużych projektach.

### Włączenie

```properties
# gradle.properties
org.gradle.configuration-cache=true
org.gradle.configuration-cache-problems=warn   # warn zamiast fail podczas migracji
```

Po pierwszym udanym buildzie w katalogu projektu pojawia się `.gradle/configuration-cache/`. Wpis w `--info` potwierdza trafienie: `Reusing configuration cache.`

### Typowe niezgodności po migracji AGP

| Problem | Objaw | Rozwiązanie |
|---------|-------|------------|
| `project.exec {}` w bloku konfiguracji | `ConfigurationCacheError: invocation of 'Task.project' at execution time` | Przenieś do `@TaskAction` lub użyj `providers.exec` |
| `buildSrc` z dostępem do `project` | Serializacja nie jest możliwa | Refaktoruj do convention plugin w `build-logic/` |
| Niestandardowy `Task` bez `@Input`/`@Output` | Cache miss przy każdym buildzie | Dodaj adnotacje lub `@Internal` dla pól bez wpływu na wynik |
| `rootProject.file(...)` w pluginie | Błąd serializacji ścieżki | Użyj `layout.projectDirectory` lub `layout.buildDirectory` |

### Debugowanie

```bash
# Tryb ostrzeżeń — build nie przerywa przy problemach
./gradlew assembleDebug --configuration-cache-problems=warn 2>&1 | grep -i "cache problem"

# Pełny raport HTML zapisywany w build/reports/configuration-cache/
./gradlew assembleDebug --configuration-cache
# → otwórz build/reports/configuration-cache/<hash>/configuration-cache-report.html
```

### Weryfikacja trafienia cache w CI

```yaml
# .github/workflows/build.yml
- name: Build with CC
  run: ./gradlew assembleRelease --configuration-cache
- name: Assert cache was reused
  run: |
    ./gradlew assembleRelease --configuration-cache 2>&1 | \
      grep "Reusing configuration cache" || exit 1
```

Drugi krok upewnia się, że żaden commit nie „zepsuł" cache — regresja natychmiast widoczna w CI.

---

## Isolation Projects — nowy tryb Gradle

Project Isolation (Izolacja projektów) to eksperymentalna funkcja Gradle, która idzie krok dalej niż Configuration Cache: wymusza, by każdy projekt konfigurował się **niezależnie**, bez dostępu do modelu innych projektów. Umożliwia to w pełni równoległą konfigurację.

### Włączenie

```properties
# gradle.properties
org.gradle.unsafe.isolated-projects=true
# Isolation Projects wymaga też włączonego CC
org.gradle.configuration-cache=true
```

### Co to zmienia w praktyce

W trybie izolacji każdy `Project` widzi tylko siebie. Typowe antywzorce, które przestają działać:

```kotlin
// ❌ Niedozwolone w Isolated Projects
subprojects {
    apply(plugin = "kotlin-android")
}

allprojects {
    repositories { google() }
}

// ✅ Poprawny zamiennik — convention plugin w build-logic/
// build-logic/src/main/kotlin/android-library-convention.gradle.kts
plugins {
    id("com.android.library")
    kotlin("android")
}
android {
    compileSdk = libs.versions.compileSdk.get().toInt()
}
```

Bloki `subprojects {}` i `allprojects {}` w pliku root `build.gradle.kts` muszą zostać zastąpione pluginami konwencji stosowanymi per moduł.

### Aktualny stan i ograniczenia

| Aspekt | Stan (Gradle 8.x) |
|--------|-------------------|
| Stabilność | Eksperymentalna (`unsafe` w nazwie flagi) |
| Wsparcie AGP | Częściowe — AGP 8.3+ ma wstępną kompatybilność |
| Zysk wydajnościowy | 20–50% szybsza konfiguracja w projektach > 50 modułów |
| Blokery | Wiele pluginów third-party jeszcze niezgodnych |

Rekomendacja: włącz Isolated Projects na gałęzi `experiment/`, uruchom build, przejrzyj raport CC i eliminuj niezgodności stopniowo. Nie włączaj na `main` do czasu stabilizacji w Gradle 9.x.

## Lint po migracji AGP — nowe reguły i baseline

Nowe wersje AGP często dodają reguły Lint, które wykrywają problemy niewidoczne w poprzednich wersjach. Po migracji warto uruchomić analizę i zaktualizować baseline.

### Generowanie baseline Lint

Baseline pozwala zatwierdzić istniejące ostrzeżenia i śledzić tylko nowe naruszenia:

```bash
# Wygeneruj nowy baseline po migracji
./gradlew :app:lintDebug -PupdateLintBaseline
# Plik: app/lint-baseline.xml
```

### Konfiguracja Lint w build.gradle.kts

```kotlin
android {
    lint {
        // Traktuj błędy Lint jako błędy buildu (zalecane w CI)
        abortOnError = true
        // Plik baseline — ignoruj pre-istniejące problemy
        baseline = file("lint-baseline.xml")
        // Wyłącz reguły generujące fałszywe pozytywy po AGP upgrade
        disable += "GradleDependency"
        // Włącz reguły eksperymentalne
        enable += "UnusedResources"
        // Generuj raporty
        htmlReport = true
        htmlOutput = file("build/reports/lint-results.html")
        xmlReport = true
        sarifReport = true  // Format SARIF dla GitHub Actions
    }
}
```

### Integracja z GitHub Actions

```yaml
# .github/workflows/lint.yml
- name: Run Lint
  run: ./gradlew :app:lintDebug

- name: Upload SARIF
  uses: github/codeql-action/upload-sarif@v3
  with:
    sarif_file: app/build/reports/lint-results.sarif
```

Wyniki Lint pojawiają się bezpośrednio jako adnotacje w diff pull requesta na GitHubie.

### Najczęstsze nowe reguły po migracji AGP 8.x

| Reguła | Opis | Akcja |
|--------|------|-------|
| `UnusedResources` | Nieużywane pliki res/ | Usuń lub dodaj do shrinkResources |
| `MissingApplicationIcon` | Brak ikony adaptive | Utwórz `ic_launcher.xml` |
| `PermissionImpliesUnsupportedChromeOsHardware` | Uprawnienia niezgodne z ChromeOS | Dodaj `uses-feature android:required="false"` |
| `CredentialDependency` | Użycie przestarzałego Credentials API | Migruj do Credential Manager |
| `ExifInterface` | Bezpośrednie użycie java.text zamiast AndroidX | Użyj `androidx.exifinterface` |
