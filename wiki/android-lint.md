# Android Lint — analiza statyczna kodu

Android Lint to wbudowane narzędzie do statycznej analizy kodu, które wykrywa błędy, ostrzeżenia i problemy z wydajnością, bezpieczeństwem oraz dostępnością bez konieczności uruchamiania aplikacji. Jest integralną częścią Android Studio i systemu budowania Gradle.

## Czym jest Android Lint?

Lint skanuje pliki źródłowe projektu (kod Kotlin/Java, zasoby XML, plik manifestu, Gradle) i raportuje problemy sklasyfikowane według kategorii i poziomu ważności. Wczesne wykrywanie problemów redukuje koszty naprawy błędów i podnosi jakość kodu.

Główne kategorie sprawdzeń:

- **Correctness** — potencjalne błędy logiczne i użycia API
- **Security** — luki bezpieczeństwa, np. nieszyfrowane dane, eksponowane komponenty
- **Performance** — nieefektywne operacje, wycieki pamięci
- **Usability** — problemy z UX, brakujące opisy content description
- **Accessibility** — naruszenia dostępności dla osób z niepełnosprawnościami
- **Internationalization** — problemy z lokalizacją i kodowaniem znaków

## Uruchamianie Lint

### Z Android Studio

Lint uruchamia się automatycznie podczas edycji kodu — podkreślenia i ikony na marginesie sygnalizują ostrzeżenia i błędy. Pełną analizę można uruchomić ręcznie:

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
| **Fatal**    | Krytyczny błąd — build jest zatrzymywany                     |
| **Error**    | Błąd wymagający naprawy                                      |
| **Warning**  | Ostrzeżenie — zalecana poprawa                               |
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
                message = "Avoid using `Log` directly — use a logging abstraction instead."
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

## Lint w Android Studio — skróty

| Skrót (Mac / Win/Linux)          | Akcja                                    |
|----------------------------------|------------------------------------------|
| `⌥↵` / `Alt+Enter`              | Szybka naprawa (Quick Fix)               |
| `⌘⌥L` / `Ctrl+Alt+L`            | Formatowanie kodu                        |
| `⌘⇧I` / `Ctrl+Shift+I`          | Inspect Code (bieżący plik)              |
| `⌘⌥⇧I` / `Ctrl+Alt+Shift+I`     | Uruchom inspekcję według nazwy           |

## Linki

- [Android Lint — dokumentacja oficjalna](https://developer.android.com/studio/write/lint)
- [Lista wbudowanych reguł Lint](https://googlesamples.github.io/android-custom-lint-rules/checks/index.md.html)
- [Tworzenie własnych reguł Lint](https://developer.android.com/studio/write/lint#create-custom)
- [Lint w Jetpack Compose](https://developer.android.com/develop/ui/compose/tooling/lint)
