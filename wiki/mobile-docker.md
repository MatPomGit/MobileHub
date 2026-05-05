# Konteneryzacja i Docker w projektach mobilnych

Konteneryzacja to technika izolowania środowiska uruchomieniowego aplikacji w lekkim, przenośnym kontenerze. Docker jest najszerzej stosowanym narzędziem konteneryzacji - pozwala spakować kod, zależności i konfigurację środowiska w jeden obraz, który działa identycznie na laptopie dewelopera, serwerze CI/CD i w chmurze.

## Dlaczego konteneryzacja jest ważna w mobile?

Choć aplikacje mobilne działają natywnie na Android i iOS (nie w kontenerze), Docker jest szeroko stosowany w **ekosystemie mobile** do:

- ujednolicenia środowisk budowania (build environment),
- automatyzacji CI/CD dla projektów Android/iOS/Flutter/React Native,
- serwisów backendowych komunikujących się z aplikacją,
- uruchamiania emulatorów i testów automatycznych,
- rozwijania aplikacji mobilnych w systemie Linux bez lokalnej instalacji SDK.

---

## Podstawy Dockera

### Obraz i kontener

- **Obraz (image)** - niezmienne, warstwowe archiwum zawierające system plików i metadane.
- **Kontener** - uruchomiona instancja obrazu; izolowany od hosta przez Linux namespaces i cgroups.

```bash
# pobranie obrazu z Docker Hub
docker pull ubuntu:24.04

# uruchomienie interaktywnego kontenera
docker run -it ubuntu:24.04 bash

# lista działających kontenerów
docker ps

# zatrzymanie i usunięcie
docker stop <id>
docker rm <id>
```

### Dockerfile - opis obrazu

```dockerfile
# Bazowy obraz z OpenJDK 21 + Android command-line tools
FROM eclipse-temurin:21-jdk

# Zmienne środowiskowe dla Android SDK
ENV ANDROID_HOME=/opt/android-sdk \
    ANDROID_SDK_ROOT=/opt/android-sdk \
    PATH="${PATH}:/opt/android-sdk/cmdline-tools/latest/bin:/opt/android-sdk/platform-tools"

# Instalacja zależności systemowych
RUN apt-get update && apt-get install -y \
    wget unzip git curl \
    && rm -rf /var/lib/apt/lists/*

# Pobranie Android command-line tools
RUN mkdir -p ${ANDROID_HOME}/cmdline-tools && \
    wget -q https://dl.google.com/android/repository/commandlinetools-linux-11076708_latest.zip -O /tmp/cmdline-tools.zip && \
    unzip -q /tmp/cmdline-tools.zip -d ${ANDROID_HOME}/cmdline-tools && \
    mv ${ANDROID_HOME}/cmdline-tools/cmdline-tools ${ANDROID_HOME}/cmdline-tools/latest && \
    rm /tmp/cmdline-tools.zip

# Akceptacja licencji i instalacja SDK
RUN yes | sdkmanager --licenses && \
    sdkmanager "platform-tools" "platforms;android-35" "build-tools;35.0.0"

WORKDIR /workspace
```

### Budowanie i tagowanie obrazu

```bash
# budowanie
docker build -t android-builder:35 .

# tagowanie obrazu
docker tag android-builder:35 myregistry/android-builder:35

# push do rejestru
docker push myregistry/android-builder:35
```

---

## Środowisko budowania Android w Dockerze

### Budowanie APK / AAB

```dockerfile
# Dockerfile.android-ci
FROM eclipse-temurin:21-jdk AS builder

ENV ANDROID_HOME=/opt/android-sdk \
    ANDROID_SDK_ROOT=/opt/android-sdk \
    PATH="${PATH}:/opt/android-sdk/cmdline-tools/latest/bin:/opt/android-sdk/platform-tools"

# (instalacja SDK jak wyżej)

WORKDIR /project
COPY . .

# Nadanie uprawnień do Gradle Wrapper
RUN chmod +x ./gradlew

# Budowanie release APK
RUN ./gradlew assembleRelease --no-daemon
```

```bash
# uruchomienie z montowaniem projektu
docker run --rm \
  -v "$(pwd)":/project \
  -w /project \
  android-builder:35 \
  ./gradlew assembleRelease
```

### Cachowanie zależności Gradle

Budowanie bez cache zajmuje wiele minut przy każdym uruchomieniu. Rozwiązaniem jest montowanie woluminu dla cache Gradle:

```bash
docker run --rm \
  -v "$(pwd)":/project \
  -v gradle-cache:/root/.gradle \
  -w /project \
  android-builder:35 \
  ./gradlew assembleRelease
```

---

## Docker Compose - wielousługowe środowisko projektowe

`docker-compose.yml` pozwala opisać i uruchomić wiele kontenerów jedną komendą:

```yaml
version: "3.9"

services:
  # Backend API (np. Spring Boot lub FastAPI)
  api:
    build: ./backend
    ports:
      - "8080:8080"
    environment:
      - DB_HOST=db
      - DB_PORT=5432
    depends_on:
      - db
    networks:
      - mobile-net

  # Baza danych PostgreSQL
  db:
    image: postgres:16-alpine
    environment:
      POSTGRES_USER: pam
      POSTGRES_PASSWORD: secret
      POSTGRES_DB: mobileapp
    volumes:
      - db-data:/var/lib/postgresql/data
    networks:
      - mobile-net

  # Builder Android (opcjonalnie)
  android-builder:
    build:
      context: .
      dockerfile: Dockerfile.android-ci
    volumes:
      - .:/project
      - gradle-cache:/root/.gradle
    networks:
      - mobile-net

networks:
  mobile-net:

volumes:
  db-data:
  gradle-cache:
```

```bash
# uruchomienie wszystkich serwisów
docker compose up -d

# zatrzymanie
docker compose down

# podgląd logów
docker compose logs -f api
```

---

## CI/CD dla projektów mobilnych z Dockerem

### GitHub Actions - Android build

```yaml
# .github/workflows/android.yml
name: Android CI

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]

jobs:
  build:
    runs-on: ubuntu-latest
    container:
      image: eclipse-temurin:21-jdk

    steps:
      - uses: actions/checkout@v4

      - name: Setup Android SDK
        uses: android-actions/setup-android@v3

      - name: Cache Gradle
        uses: actions/cache@v4
        with:
          path: |
            ~/.gradle/caches
            ~/.gradle/wrapper
          key: gradle-${{ hashFiles('**/*.gradle*') }}

      - name: Build Release APK
        run: ./gradlew assembleRelease --no-daemon

      - name: Upload APK
        uses: actions/upload-artifact@v4
        with:
          name: release-apk
          path: app/build/outputs/apk/release/*.apk
```

### GitLab CI/CD - Flutter

```yaml
# .gitlab-ci.yml
image: ghcr.io/cirruslabs/flutter:3.22.0

stages:
  - test
  - build

flutter_test:
  stage: test
  script:
    - flutter pub get
    - flutter test

flutter_build_android:
  stage: build
  script:
    - flutter pub get
    - flutter build apk --release
  artifacts:
    paths:
      - build/app/outputs/flutter-apk/app-release.apk
    expire_in: 7 days
  only:
    - main
```

---

## Docker na samym urządzeniu mobilnym

### Termux + Docker (Android - eksperymentalnie)

Na urządzeniach z rooted Androidem lub używając [Termux](https://termux.dev/) z proot-distro można uruchomić środowisko Linux i instalować Docker-like narzędzia:

```bash
# Instalacja Termux + proot-distro
pkg install proot-distro
proot-distro install ubuntu

# Wejście do distro
proot-distro login ubuntu

# Instalacja Dockera w proot (uwaga: bez pełnej izolacji jądra)
apt update && apt install -y docker.io
```

> **Uwaga:** Docker w proot nie oferuje pełnej izolacji - brak wsparcia dla Linux namespaces w zakresie sieci i procesów. To środowisko deweloperskie/edukacyjne, nie produkcyjne.

### UserLAnd - Linux na Androidzie bez roota

[UserLAnd](https://userland.tech/) pozwala uruchomić dystrybucję Linux (Ubuntu, Debian, Alpine) bez roota. Można instalować `podman` zamiast Docker, który nie wymaga daemona z uprawnieniami root.

```bash
# Instalacja Podman w UserLAnd/Ubuntu
apt update && apt install -y podman

# Podman jest kompatybilny z API Dockera
podman pull nginx:alpine
podman run -d -p 8080:80 nginx:alpine
podman ps
```

### iSH - Linux shell na iOS

[iSH](https://ish.app/) emuluje środowisko Alpine Linux na iPhone/iPad. Możliwe jest uruchomienie prostych kontenerów Alpine-based przy użyciu `docker` CLI z ograniczeniami emulacji (x86 emulacja na ARM).

---

## Emulatory i testy w Dockerze

### Android Emulator w CI (bez GPU)

```dockerfile
FROM ubuntu:22.04

ENV ANDROID_HOME=/opt/android-sdk \
    ANDROID_SDK_ROOT=/opt/android-sdk

RUN apt-get update && apt-get install -y \
    openjdk-21-jdk wget unzip \
    libgl1-mesa-glx libpulse0 \
    && rm -rf /var/lib/apt/lists/*

# SDK + emulator
RUN yes | sdkmanager --licenses && \
    sdkmanager "emulator" "system-images;android-34;google_apis;x86_64"

# Tworzenie AVD (Android Virtual Device)
RUN echo "no" | avdmanager create avd \
    -n test_device \
    -k "system-images;android-34;google_apis;x86_64"
```

```bash
# Uruchomienie emulatora (headless, bez GPU)
docker run --rm \
  --device /dev/kvm \
  android-emulator:latest \
  emulator -avd test_device -no-window -no-audio -gpu swiftshader_indirect
```

> **Wymóg KVM:** akceleracja sprzętowa wymaga uruchomienia Docker z dostępem do `/dev/kvm` (dostępne na większości środowisk CI Linux).

### Appium + Docker Compose - testy automatyczne

```yaml
# docker-compose.test.yml
version: "3.9"
services:
  appium:
    image: appium/appium:latest
    ports:
      - "4723:4723"
    volumes:
      - /dev/bus/usb:/dev/bus/usb
    privileged: true

  tests:
    build: ./e2e-tests
    depends_on:
      - appium
    environment:
      - APPIUM_HOST=appium
      - APPIUM_PORT=4723
```

---

## Optymalizacja obrazów Dockera dla mobile

### Wieloetapowe budowanie (multi-stage build)

Zmniejsza rozmiar końcowego obrazu przez oddzielenie etapu budowania od środowiska uruchomieniowego:

```dockerfile
# Etap 1: budowanie
FROM eclipse-temurin:21-jdk AS builder
WORKDIR /project
COPY . .
RUN chmod +x ./gradlew && \
    ./gradlew assembleRelease --no-daemon

# Etap 2: artefakty
FROM alpine:3.20 AS artifacts
COPY --from=builder /project/app/build/outputs/apk/release/app-release.apk /output/
CMD ["ls", "/output"]
```

### Dobre praktyki tworzenia Dockerfile

| Praktyka | Opis |
|----------|------|
| `.dockerignore` | Wyklucz `build/`, `.gradle/`, `.git/`, `node_modules/` |
| Kolejność warstw | Najpierw zależności (rzadziej zmienne), potem kod źródłowy |
| Jeden proces per kontener | Backend, DB, builder - osobne kontenery |
| Minimalne obrazy | Używaj `alpine` lub `slim` zamiast `latest` |
| Non-root user | Uruchamiaj procesy jako niepriwilejowany użytkownik |
| Skanowanie podatności | `docker scout`, `trivy` lub `snyk` |

```dockerfile
# Non-root user
RUN addgroup --system appgroup && adduser --system --ingroup appgroup appuser
USER appuser
```

---

## Porównanie: Docker vs. Podman vs. nerdctl

| Narzędzie | Daemon | Root | Kompatybilność | Uwagi |
|-----------|--------|------|----------------|-------|
| Docker | Tak | Opcjonalnie (rootless) | Standard | Najszersza baza obrazów |
| Podman | Nie | Nie (rootless) | Docker API | Lżejszy, bezpieczniejszy |
| nerdctl | Nie | Opcjonalnie | Docker-like | Dla containerd |
| Buildah | Nie | Nie | OCI | Budowanie obrazów |

---

## Praktyczny workflow dla projektu mobilnego

```
┌─────────────────────────────────────────────────────────────────┐
│                     Lokalny laptop dewelopera                   │
│  docker compose up ──> Backend API  +  Baza danych              │
│  docker run ────────> Android Builder (./gradlew assembleDebug)  │
└──────────────────────────────┬──────────────────────────────────┘
                               │ git push
                               ▼
┌─────────────────────────────────────────────────────────────────┐
│                          GitHub Actions / GitLab CI             │
│  container: android-builder:35                                  │
│  ./gradlew test → ./gradlew assembleRelease → upload artifact   │
└──────────────────────────────┬──────────────────────────────────┘
                               │ artefakt APK/AAB
                               ▼
┌─────────────────────────────────────────────────────────────────┐
│                   Dystrybucja                                   │
│  Google Play Internal Track / Firebase App Distribution         │
└─────────────────────────────────────────────────────────────────┘
```

---

## Podsumowanie

Docker i konteneryzacja są dziś standardem w środowiskach CI/CD dla projektów mobilnych. Kluczowe korzyści:

- **Powtarzalność** - identyczne środowisko budowania dla całego zespołu,
- **Izolacja** - brak konfliktów między wersjami SDK i zależności,
- **Automatyzacja** - łatwa integracja z GitHub Actions, GitLab CI, Bitrise,
- **Skalowalność** - buildy można uruchamiać równolegle na wielu agentach.

Uruchomienie pełnego Dockera na samym urządzeniu mobilnym jest możliwe eksperymentalnie (Termux + proot, UserLAnd + Podman, iSH), ale główne zastosowanie konteneryzacji w mobile to narzędzia deweloperskie i pipelines CI/CD.
