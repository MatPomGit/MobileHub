# Buildozer — pakowanie aplikacji Python/Kivy na Android i iOS

Buildozer to narzędzie wiersza poleceń, które automatyzuje proces budowania i pakowania aplikacji napisanych w Pythonie (głównie z frameworkiem Kivy) na platformy mobilne: Android i iOS. Pod spodem Buildozer korzysta z **python-for-android** (p4a) do kompilacji na Android oraz **kivy-ios** do kompilacji na iOS.

## Czym jest Buildozer?

Budowanie natywnej aplikacji mobilnej z kodu Pythona wymaga:
- skompilowania interpretera CPython na docelową architekturę (ARM),
- skompilowania wszystkich zależności (NumPy, Kivy, OpenSSL…),
- wygenerowania projektu Android Studio / Xcode,
- podpisania i spakowania do pliku APK/AAB/IPA.

Buildozer ukrywa całą tę złożoność za jednym plikiem konfiguracyjnym (`buildozer.spec`) i kilkoma poleceniami.

```
┌─────────────────────────────────┐
│         Twój kod Python         │
│       (main.py + assets)        │
└────────────┬────────────────────┘
             │  buildozer android debug
             ▼
┌─────────────────────────────────┐
│           buildozer.spec        │
│  (nazwa, wersja, zależności…)   │
└────────────┬────────────────────┘
             │
     ┌───────┴───────┐
     ▼               ▼
python-for-android  kivy-ios
  (Android APK)   (iOS IPA)
```

## Instalacja

Buildozer działa najlepiej na **Linuksie** (Ubuntu 20.04+). Na Windows zalecane jest użycie WSL 2 lub kontenera Docker. macOS jest wymagane do budowania na iOS.

### Wymagania systemowe (Android)

```bash
# Ubuntu/Debian
sudo apt update
sudo apt install -y python3-pip python3-venv git zip unzip \
    openjdk-17-jdk autoconf libtool pkg-config \
    zlib1g-dev libncurses5-dev libncursesw5-dev \
    cmake libffi-dev libssl-dev
```

### Instalacja przez pip

```bash
pip install --user buildozer
# lub w środowisku wirtualnym (zalecane)
python3 -m venv .venv
source .venv/bin/activate
pip install buildozer
```

### Instalacja z repozytorium (najnowsza wersja)

```bash
git clone https://github.com/kivy/buildozer.git
cd buildozer
pip install -e .
```

Po instalacji sprawdź wersję:

```bash
buildozer version
```

## Plik konfiguracyjny buildozer.spec

Każdy projekt wymaga pliku `buildozer.spec` w katalogu głównym. Buildozer potrafi go wygenerować automatycznie:

```bash
buildozer init
```

### Podstawowa struktura buildozer.spec

```ini
[app]

# Nazwa wyświetlana aplikacji
title = Moja Aplikacja

# Nazwa pakietu (bez spacji i polskich znaków)
package.name = mojaplikacja

# Identyfikator pakietu — unikalny (jak w Google Play)
package.domain = org.example

# Główny plik Pythona
source.dir = .
source.include_exts = py,png,jpg,kv,atlas,json

# Wersja aplikacji
version = 1.0.0

# Zależności Python (pip)
requirements = python3,kivy,kivymd,pillow

# Orientacja ekranu: portrait | landscape | all
orientation = portrait

# Ikona aplikacji
icon.filename = %(source.dir)s/assets/icon.png

# Obraz powitalny (splash screen)
presplash.filename = %(source.dir)s/assets/splash.png

# Android API
android.api = 33
android.minapi = 21
android.ndk = 25b

# Uprawnienia Androida
android.permissions = INTERNET,CAMERA,ACCESS_FINE_LOCATION

# Architektura docelowa
android.archs = arm64-v8a, armeabi-v7a

# Wersja narzędzi budowania
android.build_tools_version = 34.0.0

[buildozer]

# Poziom logowania: 0 (cichy), 1 (normalny), 2 (szczegółowy)
log_level = 2

# Ostrzeżenie: warn=1 — wymagany ręczny Android SDK
warn_on_root = 1
```

### Kluczowe parametry buildozer.spec

| Parametr | Opis | Przykład |
|----------|------|---------|
| `title` | Nazwa wyświetlana | `Kalkulator BMI` |
| `package.name` | Nazwa pakietu (bez spacji) | `kalkbmi` |
| `package.domain` | Domena odwrócona | `pl.edu.prz` |
| `version` | Wersja SemVer | `1.2.0` |
| `requirements` | Zależności pip | `python3,kivy,numpy` |
| `android.api` | Target API Level | `33` |
| `android.minapi` | Minimum API Level | `21` |
| `android.archs` | Architektury CPU | `arm64-v8a` |
| `android.permissions` | Uprawnienia | `INTERNET,CAMERA` |
| `android.release_artifact` | Format wyjściowy | `apk` lub `aab` |

## Główne polecenia Buildozera

### Budowanie debug APK

```bash
buildozer android debug
```

Pierwsze uruchomienie pobiera Android SDK/NDK i kompiluje wszystkie zależności — może trwać **20–60 minut**. Kolejne budowania są znacznie szybsze dzięki cache.

Wynikowy plik APK znajdziesz w:
```
bin/MojaAplikacja-1.0.0-arm64-v8a-debug.apk
```

### Budowanie release APK / AAB

```bash
buildozer android release
```

Plik release wymaga **podpisania** kluczem keystore przed wgraniem do Google Play:

```bash
# Podpisanie APK (ręczne)
jarsigner -verbose -sigalg SHA256withRSA -digestalg SHA-256 \
    -keystore moj-klucz.keystore \
    bin/MojaAplikacja-1.0.0-release-unsigned.apk \
    alias_name

# Wyrównanie zip (zipalign)
zipalign -v 4 \
    bin/MojaAplikacja-1.0.0-release-unsigned.apk \
    bin/MojaAplikacja-1.0.0-release.apk
```

Można też skonfigurować automatyczne podpisywanie w `buildozer.spec`:

```ini
[app]
android.release_artifact = apk

# Ścieżka do keystore (bezpieczniej: ustaw zmienną środowiskową)
android.keystore = /home/user/moj-klucz.keystore
android.keyalias = moj_alias
# Hasła lepiej przekazywać przez zmienne środowiskowe:
# BUILDOZER_ANDROID_KEYSTORE_PASSWD i BUILDOZER_ANDROID_KEYALIAS_PASSWD
```

### Wdrożenie na urządzenie (deploy)

```bash
# Budowanie + instalacja na podłączonym urządzeniu USB
buildozer android deploy

# Uruchomienie zainstalowanej aplikacji
buildozer android run

# Jedno polecenie: buduj + wdróż + uruchom + pokaż logi
buildozer android debug deploy run logcat
```

### Podgląd logów

```bash
# Wyświetl logi z urządzenia (ADB logcat)
buildozer android logcat

# Filtruj logi Python
buildozer android logcat | grep -i python
```

### Czyszczenie cache

```bash
# Usuń katalog .buildozer/android/platform (pobrane SDK, NDK)
buildozer android clean

# Usuń tylko pliki tymczasowe budowania (szybsze ponowne budowanie)
buildozer distclean
```

### Zestawienie poleceń

| Polecenie | Opis |
|-----------|------|
| `buildozer init` | Wygeneruj buildozer.spec |
| `buildozer android debug` | Zbuduj APK debug |
| `buildozer android release` | Zbuduj APK/AAB release |
| `buildozer android deploy` | Zainstaluj APK na urządzeniu |
| `buildozer android run` | Uruchom aplikację na urządzeniu |
| `buildozer android logcat` | Pokaż logi z urządzenia |
| `buildozer android clean` | Wyczyść cache budowania |
| `buildozer distclean` | Usuń wszystkie pliki tymczasowe |
| `buildozer -v android debug` | Verbose mode — szczegółowe logi |

## Struktura projektu

Typowy projekt Buildozer wygląda następująco:

```
moj_projekt/
├── main.py              ← główny plik aplikacji
├── buildozer.spec       ← konfiguracja Buildozera
├── myapp.kv             ← język KV (opcjonalnie)
├── assets/
│   ├── icon.png         ← ikona (512×512 px)
│   └── splash.png       ← splash screen (1280×720 px)
└── .buildozer/          ← cache (nie commituj do Git!)
    └── android/
        ├── platform/    ← SDK, NDK, python-for-android
        └── app/         ← pliki tymczasowe budowania
```

> **Ważne:** Dodaj `.buildozer/` do `.gitignore` — katalog ten może zajmować kilka GB.

```gitignore
.buildozer/
bin/
```

## Przykładowa aplikacja Kivy

```python
# main.py
from kivy.app import App
from kivy.uix.boxlayout import BoxLayout
from kivy.uix.button import Button
from kivy.uix.label import Label

class KalkulatorApp(App):
    def build(self):
        layout = BoxLayout(orientation='vertical', padding=20, spacing=10)

        self.wynik = Label(
            text='Wprowadź liczby',
            font_size='24sp'
        )

        btn_dodaj = Button(
            text='Dodaj 1',
            size_hint=(1, 0.3),
            font_size='20sp',
            on_press=self.dodaj
        )

        layout.add_widget(self.wynik)
        layout.add_widget(btn_dodaj)

        self.licznik = 0
        return layout

    def dodaj(self, instance):
        self.licznik += 1
        self.wynik.text = f'Wynik: {self.licznik}'

if __name__ == '__main__':
    KalkulatorApp().run()
```

## Zarządzanie zależnościami

### Przepisy (recipes) python-for-android

Nie każda biblioteka Pythona działa od razu na Androidzie — musi być dostępny **przepis** (recipe) w python-for-android. Lista dostępnych przepisów:

```bash
# Sprawdź dostępne przepisy
python -m pythonforandroid.toolchain recipes
```

Popularne przepisy:
- `kivy`, `kivymd` — framework UI
- `numpy`, `scipy` — obliczenia naukowe
- `pillow` — przetwarzanie obrazów
- `requests`, `urllib3` — HTTP
- `sqlite3` — baza danych
- `openssl` — szyfrowanie
- `pyjnius` — wywołania Java z Pythona

### Własny przepis

Jeśli biblioteka nie ma przepisu, możesz stworzyć własny:

```ini
# buildozer.spec
[app]
# Wskaż katalog z własnymi przepisami
p4a.local_recipes = ./moje_przepisy
```

```python
# moje_przepisy/mojabib/__init__.py
from pythonforandroid.recipe import PythonRecipe

class MojaBibRecipe(PythonRecipe):
    version = '1.0.0'
    url = 'https://pypi.python.org/packages/source/m/mojabib/mojabib-{version}.tar.gz'
    depends = ['setuptools']

recipe = MojaBibRecipe()
```

### Zależności natywne

```ini
[app]
# Biblioteki .so (precompiled) do dołączenia
android.add_libs_armeabi_v7a = libs/armeabi-v7a/*.so
android.add_libs_arm64_v8a = libs/arm64-v8a/*.so

# Dodatkowe pliki Java/Kotlin
android.add_src = java/

# Biblioteki AAR (Android Archive)
android.add_aars = libs/moja-biblioteka.aar
```

## Uprawnienia i funkcje Androida

### Deklaracja uprawnień

```ini
[app]
android.permissions = \
    INTERNET, \
    CAMERA, \
    READ_EXTERNAL_STORAGE, \
    WRITE_EXTERNAL_STORAGE, \
    ACCESS_FINE_LOCATION, \
    ACCESS_COARSE_LOCATION, \
    RECORD_AUDIO, \
    VIBRATE
```

### Funkcje (uses-feature)

```ini
[app]
android.features = android.hardware.camera, android.hardware.camera.autofocus
```

### Żądanie uprawnień w czasie działania (Android 6+)

```python
from android.permissions import request_permissions, Permission

def zainicjalizuj_kamere():
    request_permissions(
        [Permission.CAMERA, Permission.RECORD_AUDIO],
        callback_po_przyznaniu
    )

def callback_po_przyznaniu(permissions, grants):
    if all(grants):
        # Uprawnienia przyznane — uruchom kamerę
        uruchom_kamere()
    else:
        print("Brak uprawnień do kamery!")
```

## Integracja z kodem Java (PyJNIus)

PyJNIus pozwala wywoływać klasy i metody Javy/Androida bezpośrednio z Pythona:

```python
from jnius import autoclass

# Dostęp do Android API
Toast = autoclass('android.widget.Toast')
PythonActivity = autoclass('org.kivy.android.PythonActivity')
String = autoclass('java.lang.String')

def pokaz_toast(tekst):
    activity = PythonActivity.mActivity
    t = Toast.makeText(
        activity,
        String(tekst),
        Toast.LENGTH_SHORT
    )
    t.show()

# Wibracje
Vibrator = autoclass('android.os.Vibrator')
Context = autoclass('android.content.Context')

def wibruj(ms=200):
    activity = PythonActivity.mActivity
    vibrator = activity.getSystemService(Context.VIBRATOR_SERVICE)
    vibrator.vibrate(ms)
```

## Buildozer a Docker

Dla większej powtarzalności budowania warto użyć oficjalnego obrazu Docker:

```bash
# Pobierz oficjalny obraz Kivy/Buildozer
docker pull kivy/buildozer

# Zbuduj APK w kontenerze
docker run --volume "$(pwd)":/home/user/hostcwd \
           kivy/buildozer \
           android debug
```

### Własny Dockerfile

```dockerfile
FROM ubuntu:22.04

ENV DEBIAN_FRONTEND=noninteractive

RUN apt-get update && apt-get install -y \
    python3-pip python3-venv git zip unzip \
    openjdk-17-jdk autoconf libtool pkg-config \
    zlib1g-dev libncurses5-dev cmake \
    libffi-dev libssl-dev && \
    rm -rf /var/lib/apt/lists/*

RUN pip3 install buildozer cython

WORKDIR /app
COPY . .

RUN buildozer android debug

CMD ["/bin/bash"]
```

## Debugowanie i rozwiązywanie problemów

### Najczęstsze błędy

**1. Brak Cython**
```
ERROR: Cython is needed but is not installed
```
Rozwiązanie:
```bash
pip install cython
```

**2. Błąd NDK — nieobsługiwana architektura**
```
ERROR: No toolchain found for arch armeabi
```
Rozwiązanie w `buildozer.spec`:
```ini
android.archs = arm64-v8a
```

**3. Przepis niedostępny**
```
ERROR: recipe for X not found
```
Rozwiązanie: sprawdź nazwę przepisu lub utwórz własny.

**4. Brak pamięci RAM podczas budowania**
Rozwiązanie: zwiększ plik wymiany (swap) lub ogranicz liczbę wątków:
```ini
[buildozer]
# Zmniejsz równoległość budowania
android.p4a_build_cmd = python -m pythonforandroid.toolchain
```

**5. Problem z podpisywaniem (release)**
```
jarsigner: unable to open jar file
```
Upewnij się, że ścieżka do keystore jest bezwzględna i plik istnieje.

### Tryb szczegółowy (verbose)

```bash
# Pełne logi budowania
buildozer -v android debug 2>&1 | tee buildozer.log
```

### Sprawdzenie środowiska

```bash
# Diagnostyka — czy wszystkie narzędzia są zainstalowane
buildozer android doctor
```

## Buildozer vs alternatywy

| Narzędzie | Język | Platforma | Uwagi |
|-----------|-------|-----------|-------|
| **Buildozer** | Python/Kivy | Android, iOS | Najprostsze dla Kivy |
| **BeeWare (Briefcase)** | Python | Android, iOS, Desktop | Obsługuje więcej frameworków |
| **Chaquopy** | Python | Android | Plugin Gradle, płatny |
| **QPython** | Python | Android | Bez kompilacji, ograniczenia UI |
| **Termux** | Python | Android | Shell, bez pełnego UI |

## Wdrożenie do Google Play

### Generowanie AAB (Android App Bundle)

```ini
# buildozer.spec
[app]
android.release_artifact = aab
```

```bash
buildozer android release
```

### Podpisywanie z keystore

```bash
# Wygeneruj keystore (tylko raz — przechowuj bezpiecznie!)
keytool -genkey -v \
    -keystore moja-aplikacja.keystore \
    -alias moja_aplikacja \
    -keyalg RSA -keysize 2048 \
    -validity 10000

# Podpisz AAB
jarsigner -verbose \
    -sigalg SHA256withRSA \
    -digestalg SHA-256 \
    -keystore moja-aplikacja.keystore \
    bin/MojaAplikacja-1.0.0-release.aab \
    moja_aplikacja
```

> **Uwaga:** Klucz keystore jest niezbędny do każdej aktualizacji aplikacji w Google Play. Jego utrata oznacza konieczność usunięcia aplikacji i opublikowania nowej pod inną nazwą pakietu.

## Dobre praktyki

1. **Używaj środowisk wirtualnych** — izolacja zależności buildozera od reszty systemu.
2. **Dodaj `.buildozer/` do `.gitignore`** — katalog może ważyć kilka GB.
3. **Ustal konkretne wersje zależności** — `requirements = python3==3.11.0,kivy==2.3.0`.
4. **Testuj na wielu urządzeniach** — różne wersje Androida i architektury (arm64, armeabi-v7a).
5. **Używaj `buildozer android doctor`** — przed pierwszym budowaniem, aby wykryć brakujące narzędzia.
6. **Automatyzuj przez CI/CD** — GitHub Actions + Docker = powtarzalne budowania.
7. **Przechowuj keystore bezpiecznie** — użyj menedżera sekretów (GitHub Secrets, HashiCorp Vault).
8. **Buduj wersję release osobno** — nigdy nie wysyłaj pliku debug do sklepu.

## Automatyzacja CI/CD z GitHub Actions

```yaml
# .github/workflows/build.yml
name: Build Android APK

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  build:
    runs-on: ubuntu-latest

    steps:
      - uses: actions/checkout@v4

      - name: Set up Python
        uses: actions/setup-python@v5
        with:
          python-version: '3.11'

      - name: Cache Buildozer dependencies
        uses: actions/cache@v4
        with:
          path: .buildozer
          key: buildozer-${{ hashFiles('buildozer.spec') }}

      - name: Install dependencies
        run: |
          sudo apt-get update
          sudo apt-get install -y \
            openjdk-17-jdk autoconf libtool pkg-config \
            zlib1g-dev libncurses5-dev cmake \
            libffi-dev libssl-dev
          pip install buildozer cython

      - name: Build APK
        run: buildozer android debug

      - name: Upload APK artifact
        uses: actions/upload-artifact@v4
        with:
          name: app-debug
          path: bin/*.apk
```

## Pytania kontrolne

1. Jakie dwa narzędzia Buildozer wykorzystuje wewnętrznie do budowania na Android i iOS?
2. Co to jest plik `buildozer.spec` i jakie kluczowe sekcje zawiera?
3. Jaka jest różnica między poleceniami `buildozer android debug` a `buildozer android release`?
4. Dlaczego katalog `.buildozer/` należy dodać do `.gitignore`?
5. Co to jest **przepis** (recipe) w kontekście python-for-android i kiedy trzeba go tworzyć?
6. Jak PyJNIus umożliwia dostęp do Android API z poziomu Pythona?
7. Jakie są zalety budowania przez Docker w porównaniu z lokalną instalacją?
8. Co się stanie, jeśli utracisz plik keystore użyty do podpisania aplikacji w Google Play?

## Ćwiczenia praktyczne

1. **Inicjalizacja projektu** — zainstaluj Buildozer, utwórz projekt Kivy z `main.py` i wygeneruj `buildozer.spec` poleceniem `buildozer init`.
2. **Konfiguracja spec** — ustaw nazwę pakietu, wersję, ikony i dodaj uprawnienie `INTERNET`.
3. **Pierwsze budowanie** — zbuduj APK debug i zainstaluj na emulatorze lub urządzeniu.
4. **Debugowanie logów** — użyj `buildozer android logcat` do znalezienia błędu w swojej aplikacji.
5. **Własna zależność** — dodaj bibliotekę `requests` do `requirements` i sprawdź, czy HTTP GET działa na urządzeniu.
6. **Integracja z Javą** — użyj PyJNIus do wyświetlenia natywnego `Toast` Androidowego.
7. **Pipeline CI/CD** — skonfiguruj GitHub Actions do automatycznego budowania APK przy każdym push na `main`.

## Powiązane artykuły

- [Programowanie cross-platformowe](#wiki-cross-platform)
- [Flutter — zaawansowane techniki](#wiki-flutter-advanced)
- [React Native](#wiki-react-native)
- [Progressive Web Apps](#wiki-pwa-advanced)
- [Kotlin Multiplatform](#wiki-kmp-multiplatform)
- [Publikacja i promocja własnej aplikacji](#wiki-app-publishing)
- [Ekosystem Android i Google Play](#wiki-android-ecosystem)
