# Android Lint - analiza statyczna kodu

Android Lint to wbudowane narzędzie do statycznej analizy kodu, które wykrywa błędy, ostrzeżenia i problemy z wydajnością, bezpieczeństwem oraz dostępnością bez konieczności uruchamiania aplikacji. Jest integralną częścią Android Studio i systemu budowania Gradle.

## Czym jest Android Lint?

Lint skanuje pliki źródłowe projektu (kod Kotlin/Java, zasoby XML, plik manifestu, Gradle) i raportuje problemy sklasyfikowane według kategorii i poziomu ważności. Wczesne wykrywanie problemów redukuje koszty naprawy błędów i podnosi jakość kodu.

Główne kategorie sprawdzeń:

- **Correctness** - potencjalne błędy logiczne i użycia API
- **Security** - luki bezpieczeństwa, np. nieszyfrowane dane, eksponowane komponenty
- **Performance** - nieefektywne operacje, wycieki pamięci
- **Usability** - problemy z UX, brakujące opisy content description
- **Accessibility** - naruszenia dostępności dla osób z niepełnosprawnościami
- **Internationalization** - problemy z lokalizacją i kodowaniem znaków

## Uruchamianie Lint

### Z Android Studio

Lint uruchamia się automatycznie podczas edycji kodu - podkreślenia i ikony na marginesie sygnalizują ostrzeżenia i błędy. Pełną analizę można uruchomić ręcznie:

```
Analyze → Inspect Code… → Whole project → OK
```

Wyniki są prezentowane w oknie **Inspection Results** z podziałem na kategorie.

### Z wiersza poleceń

```bash
# Analiza wariantu debug
./gradlew lintDebug

# Raport HTML i XML w katalogu app/build/reports/lint-results-debug.html
./gradlew lint
```

### Konfiguracja w build.gradle.kts

```kotlin
android {
    lint {
        // Zatrzymaj build w przypadku błędów
        abortOnError = true

        // Traktuj ostrzeżenia jako błędy
        warningsAsErrors = false

        // Ignoruj konkretne reguły
        disable += setOf("MissingTranslation", "ExtraTranslation")

        // Zawsze uruchamiaj tę regułę jako błąd
        error += setOf("NewApi")

        // Generuj raporty HTML i XML
        htmlReport = true
        xmlReport = true

        // Ścieżka do pliku bazowego (baseline)
        baseline = file("lint-baseline.xml")
    }
}
```

## Poziomy ważności

| Poziom       | Opis                                                         |
|--------------|--------------------------------------------------------------|
| **Fatal**    | Krytyczny błąd - build jest zatrzymywany                     |
| **Error**    | Błąd wymagający naprawy                                      |
| **Warning**  | Ostrzeżenie - zalecana poprawa                               |
| **Information** | Informacja pomocnicza                                     |
| **Ignore**   | Problem jest wyciszony                                       |

## Adnotacje do wyciszania ostrzeżeń

Czasem lint zgłasza fałszywe alarmy lub problem jest świadomie pominięty. Można je wyciszyć na poziomie kodu:

```kotlin
// Wyciszenie konkretnej reguły w funkcji lub klasie
@SuppressLint("HardwareIds")
fun getDeviceId(context: Context): String {
    return Settings.Secure.getString(
        context.contentResolver,
        Settings.Secure.ANDROID_ID
    )
}

// Wyciszenie wszystkich reguł (niezalecane)
@SuppressLint("all")
fun legacyMethod() { }
```

W plikach XML:

```xml
<TextView
    android:layout_width="wrap_content"
    android:layout_height="wrap_content"
    android:text="@string/title"
    tools:ignore="HardcodedText" />
```

## Plik baseline

Baseline pozwala zarejestrować istniejące ostrzeżenia i skupić się tylko na nowych problemach. Jest szczególnie przydatny w dużych projektach legacy.

```bash
# Generowanie pliku baseline
./gradlew lintDebug -Dlint.baselines.continue=true
```

Wygenerowany plik `lint-baseline.xml` należy dodać do repozytorium. Lint będzie raportował jedynie problemy wykryte po jego utworzeniu.

```xml
<!-- Przykład lint-baseline.xml -->
<?xml version="1.0" encoding="UTF-8"?>
<issues format="6" by="lint 8.2.0">
    <issue
        id="ObsoleteLintCustomCheck"
        message="Obsolete custom lint check"
        errorLine1="...">
        <location file="app/src/main/java/com/example/OldCode.kt" line="42"/>
    </issue>
</issues>
```

## Własne reguły Lint

Można tworzyć własne reguły Lint dostosowane do specyfiki projektu. Wymagają osobnego modułu Gradle z zależnością do API Lint.

```kotlin
// build.gradle.kts modułu lint-checks
dependencies {
    compileOnly("com.android.tools.lint:lint-api:31.3.0")
    compileOnly("com.android.tools.lint:lint-checks:31.3.0")
}
```

Przykład prostej reguły wykrywającej użycie `Log.e` w kodzie produkcyjnym:

```kotlin
class LogUsageDetector : Detector(), Detector.UastScanner {

    override fun getApplicableMethodNames() = listOf("e", "w", "d", "v")

    override fun visitMethodCall(context: JavaContext, node: UCallExpression, method: PsiMethod) {
        if (context.evaluator.isMemberInClass(method, "android.util.Log")) {
            context.report(
                issue = ISSUE,
                scope = node,
                location = context.getLocation(node),
                message = "Avoid using `Log` directly - use a logging abstraction instead."
            )
        }
    }

    companion object {
        val ISSUE = Issue.create(
            id = "DirectLogUsage",
            briefDescription = "Direct Log usage detected",
            explanation = "Use a logging abstraction (e.g. Timber) to control log output in production builds.",
            category = Category.CORRECTNESS,
            priority = 5,
            severity = Severity.WARNING,
            implementation = Implementation(LogUsageDetector::class.java, Scope.JAVA_FILE_SCOPE)
        )
    }
}
```

Rejestracja reguły w `IssueRegistry`:

```kotlin
class MyIssueRegistry : IssueRegistry() {
    override val issues = listOf(LogUsageDetector.ISSUE)
    override val api = CURRENT_API
}
```

## Integracja z CI/CD

Lint można zintegrować z pipeline'em CI, aby automatycznie blokować merge z błędami:

```yaml
# .github/workflows/lint.yml
name: Android Lint

on: [push, pull_request]

jobs:
  lint:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-java@v4
        with:
          java-version: '17'
          distribution: 'temurin'
      - name: Run Lint
        run: ./gradlew lintDebug
      - name: Upload Lint Report
        uses: actions/upload-artifact@v4
        if: always()
        with:
          name: lint-report
          path: app/build/reports/lint-results-debug.html
```

## Najczęstsze ostrzeżenia i jak je naprawić

### `HardcodedText`

```xml
<!-- ❌ Źle -->
<TextView android:text="Witaj świecie!" />

<!-- ✅ Dobrze -->
<TextView android:text="@string/hello_world" />
```

### `ContentDescription`

```xml
<!-- ❌ Źle -->
<ImageButton android:src="@drawable/ic_send" />

<!-- ✅ Dobrze -->
<ImageButton
    android:src="@drawable/ic_send"
    android:contentDescription="@string/send_button_desc" />
```

### `UnusedResources`

```bash
# Wyczyszczenie nieużywanych zasobów
./gradlew lintDebug
# Następnie usuń wskazane pliki lub użyj
# Refactor → Remove Unused Resources w Android Studio
```

### `NewApi`

```kotlin
// ❌ Wywołanie API dostępnego od API 26 bez sprawdzenia wersji
val channel = NotificationChannel(id, name, importance)

// ✅ Z sprawdzeniem wersji systemu
if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
    val channel = NotificationChannel(id, name, importance)
    notificationManager.createNotificationChannel(channel)
}
```

## Lint w Android Studio - skróty

| Skrót (Mac / Win/Linux)          | Akcja                                    |
|----------------------------------|------------------------------------------|
| `⌥↵` / `Alt+Enter`              | Szybka naprawa (Quick Fix)               |
| `⌘⌥L` / `Ctrl+Alt+L`            | Formatowanie kodu                        |
| `⌘⇧I` / `Ctrl+Shift+I`          | Inspect Code (bieżący plik)              |
| `⌘⌥⇧I` / `Ctrl+Alt+Shift+I`     | Uruchom inspekcję według nazwy           |

## Linki

- [Android Lint - dokumentacja oficjalna](https://developer.android.com/studio/write/lint)
- [Lista wbudowanych reguł Lint](https://googlesamples.github.io/android-custom-lint-rules/checks/index.md.html)
- [Tworzenie własnych reguł Lint](https://developer.android.com/studio/write/lint#create-custom)
- [Lint w Jetpack Compose](https://developer.android.com/develop/ui/compose/tooling/lint)

## Lint a testy - integracja z JUnit

Własne reguły Lint powinny być testowane tak samo jak każdy inny kod produkcyjny. Biblioteka `lint-tests` dostarcza klasę `LintDetectorTest`, która pozwala uruchamiać dowolny detektor na fragmentach kodu i weryfikować oczekiwane wyniki bez uruchamiania pełnego procesu budowania.

Aby dodać obsługę testów, w module z regułami Lint dodaj zależności testowe:

```kotlin
// build.gradle.kts modułu lint-checks
dependencies {
    compileOnly("com.android.tools.lint:lint-api:31.3.0")
    compileOnly("com.android.tools.lint:lint-checks:31.3.0")
    testImplementation("com.android.tools.lint:lint-tests:31.3.0")
    testImplementation("junit:junit:4.13.2")
}
```

Przykładowy test dla reguły `DirectLogUsage` wykrywającej bezpośrednie wywołania `android.util.Log`:

```kotlin
class LogUsageDetectorTest : LintDetectorTest() {

    override fun getDetector(): Detector = LogUsageDetector()
    override fun getIssues(): List<Issue> = listOf(LogUsageDetector.ISSUE)

    @Test
    fun `raportuje blad gdy uzyto Log_e`() {
        lint()
            .files(
                kotlin("""
                    import android.util.Log
                    class MyClass {
                        fun doWork() {
                            Log.e("TAG", "Błąd krytyczny")
                        }
                    }
                """).indented()
            )
            .run()
            .expect("""
                src/MyClass.kt:4: Warning: Avoid using `Log` directly - use a logging abstraction instead. [DirectLogUsage]
                            Log.e("TAG", "Błąd krytyczny")
                            ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
                0 errors, 1 warnings
            """.trimIndent())
    }

    @Test
    fun `nie raportuje bledu gdy uzyto Timber`() {
        lint()
            .files(
                kotlin("""
                    import timber.log.Timber
                    class MyClass {
                        fun doWork() {
                            Timber.e("Błąd")
                        }
                    }
                """).indented()
            )
            .run()
            .expectClean()
    }
}
```

Metoda `expect()` przyjmuje dokładny tekst raportu Lint - łącznie z numerem linii, opisem problemu i identyfikatorem reguły. Metoda `expectClean()` sprawdza, że detektor nie zgłosił żadnych problemów. Testy można uruchamiać standardowym poleceniem `./gradlew :lint-checks:test`.

Dobrą praktyką jest tworzenie oddzielnych klas testowych dla każdego detektora oraz pokrywanie zarówno przypadków pozytywnych (kod naruszający regułę), jak i negatywnych (kod poprawny). Pozwala to wychwycić regresje przy aktualizacji API Lint.

## Lint w projektach Kotlin Multiplatform

W projektach KMP moduł `shared` zawiera kod Kotlin kompilowany na wiele platform. Android Lint domyślnie analizuje tylko moduły z wtyczką `com.android.library` lub `com.android.application`, dlatego wymaga dodatkowej konfiguracji.

Aby uruchomić Lint na module `shared`, zastosuj wtyczkę `com.android.lint` (dostępna od AGP 8.x) lub utwórz osobny moduł `lint-checks` i podepnij go do wszystkich modułów KMP:

```kotlin
// shared/build.gradle.kts
plugins {
    alias(libs.plugins.kotlinMultiplatform)
    alias(libs.plugins.androidLibrary) // wymagane dla Lint
}

android {
    lint {
        abortOnError = true
        htmlReport = true
        // Reguły obowiązują na całym module shared
        error += setOf("DirectLogUsage", "HardcodedText")
    }
}

// W każdym module androidApp i shared
dependencies {
    lintChecks(project(":lint-checks"))
}
```

Reguły zdefiniowane w module `lint-checks` są stosowane automatycznie do kodu Kotlin w `commonMain`, `androidMain` i `iosMain` (o ile pliki mają rozszerzenie `.kt`). Warto jednak pamiętać, że `UastScanner` analizuje jedynie kod Kotlin/Java - pliki Swift lub C++ pozostają poza zasięgiem Lint.

Zalecana struktura reguł współdzielonych w KMP:

| Zakres reguły | Moduł | Uwagi |
|---|---|---|
| Wspólna logika Kotlin | `lint-checks` | Stosowana do `commonMain` |
| Tylko Android | `lint-checks` (filtry scope) | `Scope.JAVA_FILE_SCOPE` |
| Zasoby XML | `lint-checks` | `Scope.RESOURCE_FILE_SCOPE` |

Reguły dotyczące wyłącznie kodu iOS (np. sprawdzanie API Swift przez skrypty zewnętrzne) należy obsłużyć oddzielnym narzędziem, takim jak SwiftLint.

## Najlepsze praktyki - Lint w dużych projektach

W dużych projektach z wieloma modułami i setkami tysięcy linii kodu zarządzanie regułami Lint wymaga przemyślanej organizacji, aby nie spowalniać developmentu i zachować wartość analizy.

**Organizacja reguł w projekty.** Podziel reguły na kategorie: ogólne reguły firmowe (moduł `lint-global`), reguły domenowe specyficzne dla projektu (moduł `lint-project`) oraz reguły eksperymentalne wyciszone w produkcji. Każda reguła powinna mieć dokumentację wyjaśniającą jej cel i przykład naruszenia.

**Polityka Lint per moduł.** Poszczególne moduły mogą mieć różne progi tolerancji. Moduły stabilne działają z `abortOnError = true`, natomiast moduły legacy dopuszczają `warningsAsErrors = false` z aktywnym baseline:

```kotlin
// Moduł legacy - konfiguracja z baseline
android {
    lint {
        baseline = file("lint-baseline.xml")
        abortOnError = true
        // Nowe problemy blokują build, stare są tolerowane przez baseline
    }
}
```

**Cykliczna aktualizacja baseline.** Baseline nie powinien rosnąć w nieskończoność. Ustal harmonogram (np. raz na sprint) regeneracji pliku i wymuszaj redukcję liczby wpisów:

```bash
# Regeneracja baseline - usuwa naprawione wpisy
./gradlew lintDebug -Dlint.baselines.continue=true

# Sprawdzenie liczby wpisów w baseline
grep -c "<issue" app/lint-baseline.xml
```

**Reguła zero tolerance dla Security.** Wszystkie sprawdzenia z kategorii `Security` (np. `AllowBackup`, `ExportedContentProvider`, `HardcodedDebugMode`) powinny być ustawione jako `Fatal` i nigdy nie mogą trafić do baseline. Wymuszenie tej polityki w CI gwarantuje, że luki bezpieczeństwa są naprawiane natychmiast, a nie odkładane.

**Profilowanie czasu Lint.** W dużych projektach Lint może trwać ponad minutę. Użyj `--profile` i analizuj `lint-timing.txt`, aby wykryć wolne detektory i rozważyć ich wyłączenie w trybie development (`./gradlew lintDebug` tylko w CI).

**Raport trendu ostrzeżeń.** Warto śledzić historię liczby ostrzeżeń Lint w czasie i wykrywać trendy wzrostowe zanim staną się problemem. Poniższy skrypt parsuje raport XML i eksportuje metrykę do systemu monitoringu (np. Grafana przez InfluxDB):

```bash
#!/bin/bash
# ci/lint-metrics.sh - eksport metryk Lint do pliku CSV
REPORT="app/build/reports/lint-results-debug.xml"
DATE=$(date +%Y-%m-%d)
ERRORS=$(xmllint --xpath "count(//issue[@severity='Error'])" "$REPORT" 2>/dev/null || echo 0)
WARNINGS=$(xmllint --xpath "count(//issue[@severity='Warning'])" "$REPORT" 2>/dev/null || echo 0)
echo "$DATE,$ERRORS,$WARNINGS" >> lint-history.csv
echo "Lint: $ERRORS błędów, $WARNINGS ostrzeżeń ($DATE)"
```

**Grupowanie reguł per zespół.** W mono-repo z wieloma zespołami można przypisać reguły do konkretnych modułów przez osobne pliki `lint.xml` w katalogach podprojektów:

```xml
<!-- feature/payments/lint.xml - surowsze reguły dla modułu płatności -->
<?xml version="1.0" encoding="UTF-8"?>
<lint>
    <!-- Każde logowanie danych finansowych jest błędem krytycznym -->
    <issue id="DirectLogUsage" severity="fatal" />
    <!-- Wymagaj podpisania każdego Intent -->
    <issue id="UnsafeImplicitIntentLaunch" severity="error" />
</lint>
```

```kotlin
// feature/payments/build.gradle.kts
android {
    lint {
        lintConfig = file("lint.xml")
        abortOnError = true
    }
}
```

Takie podejście pozwala na stopniowe zaostrzanie polityki Lint w newralgicznych modułach bez wymuszania tych samych standardów w całym projekcie od razu. Moduły o wysokim priorytecie bezpieczeństwa (płatności, autentykacja, przechowywanie danych) mogą mieć `warningsAsErrors = true`, podczas gdy starsze moduły UI korzystają z baseline do zarządzania długiem technicznym.

**Dependency-aware Lint.** Od AGP 8.0+ Lint może analizować zależności między modułami - reguła `LintAwareModularization` pozwala wykryć, gdy moduł `:feature:login` importuje bezpośrednio klasę z modułu `:feature:profile`, co narusza architekturę. Tworzenie takich reguł wymaga implementacji `GradleScanner` zamiast standardowego `UastScanner`:

```kotlin
class ModularizationDetector : Detector(), GradleScanner {
    override fun checkDslPropertyAssignment(
        context: GradleContext, property: String, value: String,
        parent: String, parentParent: String?, valueCookie: Any, statementCookie: Any
    ) {
        if (parent == "dependencies" && value.contains(":feature:") &&
            context.project.dir.path.contains(":feature:")) {
            // Sprawdź, czy feature importuje inny feature (naruszenie warstwy)
            val currentFeature = context.project.dir.name
            val importedFeature = Regex(":feature:(\\w+)").find(value)?.groupValues?.get(1)
            if (importedFeature != null && importedFeature != currentFeature) {
                context.report(ISSUE, context.getLocation(statementCookie),
                    "Moduł feature:$currentFeature nie powinien zależeć od feature:$importedFeature bezpośrednio - użyj warstwy :core lub :api.")
            }
        }
    }

    companion object {
        val ISSUE = Issue.create(
            id = "FeatureModuleCoupling",
            briefDescription = "Niedozwolona zależność między modułami feature",
            explanation = "Moduły feature powinny komunikować się wyłącznie przez interfejsy zdefiniowane w :core lub :api.",
            category = Category.CORRECTNESS, priority = 8, severity = Severity.ERROR,
            implementation = Implementation(ModularizationDetector::class.java, Scope.GRADLE_SCOPE)
        )
    }
}
```

Reguły architektoniczne tego typu są szczególnie wartościowe w projektach modularnych, gdzie granice między warstwami są kluczowe dla skalowalności i testowalności kodu.
