# Unreal Engine na mobile - learning path

Ten learning path prowadzi od podstaw do poziomu wdrożeniowego dla aplikacji mobilnej (Android/iOS) w Unreal Engine 5.

## Szybki start: co kliknąć w edytorze (15-30 min)

1. **Utwórz projekt mobilny**
   - Kliknij: **Unreal Engine Launcher → Library → Launch** (UE 5.x).
   - W kreatorze: **Games → Third Person** (lub **Blank** dla appki narzędziowej).
   - Ustaw: **Blueprint** (na start), **Mobile**, **Scalable**, **No Starter Content**.
   - Kliknij **Create**.
2. **Przełącz profil renderingu na mobile**
   - Kliknij: **Edit → Project Settings → Platforms → Android**.
   - Uzupełnij `Package Name` (np. `com.company.project`).
   - Kliknij: **Project Settings → Rendering** i sprawdź ustawienia mobilne (sekcja „Mobile”).
3. **Włącz podgląd urządzenia**
   - Kliknij: **Settings (prawy górny róg viewportu) → Preview Rendering Level → Android Vulkan** (lub Android ES3.1).
4. **Pierwszy build testowy**
   - Kliknij: **Platforms → Android → Package Project**.
   - Zapisz build `.apk` lub `.aab` i uruchom na urządzeniu testowym.

## Poziom 1: Fundamenty (1-2 tygodnie)

1. **Instalacja i konfiguracja środowiska**
   - Unreal Engine 5.x + Android Studio + SDK/NDK.
   - Konfiguracja toolchainu pod Android oraz iOS.
2. **Blueprints vs C++**
   - Blueprinty do szybkiego prototypowania.
   - C++ do logiki krytycznej wydajnościowo.
3. **Podstawy projektu mobilnego**
   - Mobile Template, ustawienia skali UI, orientacja ekranu.
   - Profile jakości i docelowe FPS (30/60).

### Checklista Poziomu 1 (praktycznie)

1. Kliknij: **Edit → Plugins** i włącz niezbędne pluginy (np. Online Subsystem, AdMob/3rd-party, Analytics).
2. Kliknij: **Edit → Project Settings → Maps & Modes** i ustaw mapę startową.
3. Kliknij: **Project Settings → Input** i dodaj akcje: `Tap`, `Swipe`, `Pinch`.
4. Kliknij: **Project Settings → Engine → General Settings** i ustaw orientację (portrait/landscape) zależnie od produktu.
5. Kliknij: **File → Package Project → Android** i wykonaj „smoke build”.

## Poziom 2: Gameplay i UI mobilne (2-3 tygodnie)

1. **Input dotykowy i gesty**
   - Tap, swipe, pinch, long press.
2. **UMG (Unreal Motion Graphics)**
   - Responsywny HUD, DPI scaling, safe area.
3. **Architektura kodu**
   - Podział na moduły: gameplay, UI, data, services.

```cpp
// Klasa kontrolera wejścia mobilnego.
// Odpowiada za mapowanie gestów na akcje gameplayowe.
void AMobilePlayerController::SetupInputComponent()
{
    Super::SetupInputComponent();

    // Rejestracja podstawowych akcji dotykowych.
    if (InputComponent)
    {
        InputComponent->BindTouch(IE_Pressed, this, &AMobilePlayerController::OnTouchPressed);
        InputComponent->BindTouch(IE_Released, this, &AMobilePlayerController::OnTouchReleased);
    }
}
```

### Krok po kroku: konfiguracja dotyku i UI

1. **Input mapowanie**
   - Kliknij: **Edit → Project Settings → Input**.
   - W `Action Mappings` dodaj:
     - `Tap` (Touch 1),
     - `SecondaryTap` (Touch 2),
     - `Pause` (Keyboard `Esc` do testów desktopowych).
2. **Widget HUD**
   - Kliknij: **Content Drawer → Add (+) → User Interface → Widget Blueprint**.
   - Nazwij np. `WBP_HUD`.
   - W `Designer` dodaj `Canvas Panel`, `Text`, `Button`.
   - W `Anchor Presets` ustaw narożniki pod różne rozdzielczości.
3. **Podpięcie HUD do gry**
   - Kliknij: **Content Drawer → Add (+) → Blueprint Class → GameModeBase**.
   - W `BeginPlay` utwórz `Create Widget` + `Add to Viewport`.
4. **Safe area i DPI**
   - W `WBP_HUD` kliknij root widget i ustaw `DPI Scaling Rule`.
   - Testuj przez: **Play → Advanced Settings → Mobile Preview (PIE)**.

## Poziom 3: Optymalizacja pod urządzenia mobilne (2-4 tygodnie)

1. **Rendering mobilny**
   - Forward Renderer, Mobile HDR (świadomy trade-off), LOD i culling.
2. **Budżet wydajności**
   - CPU/GPU frame time, draw calls, overdraw, tekstury.
3. **Profilowanie**
   - Unreal Insights, Stat Unit, Stat GPU, Session Frontend.

```ini
; Profil urządzenia dla średniej klasy Androida.
; Ogranicza koszt renderingu i poprawia stabilność FPS.
[/Script/Engine.RendererSettings]
r.MobileContentScaleFactor=0.8
r.ShadowQuality=2
r.PostProcessAAQuality=2
```

### Krok po kroku: profilowanie i redukcja kosztu klatki

1. Kliknij: **Window → Developer Tools → Output Log** i uruchom `stat unit`.
2. Kliknij: **Window → Developer Tools → Session Frontend** i zbierz trace.
3. W konsoli wpisz:
   - `stat gpu` (koszt GPU),
   - `stat scenerendering` (draw calls i passy).
4. Kliknij: **Tools → Audit → Statistics** i znajdź najcięższe tekstury/meshe.
5. Kliknij ciężki asset w `Content Browser`:
   - ustaw niższe `Max Texture Size`,
   - ustaw kompresję mobilną,
   - skonfiguruj LOD (Static Mesh Editor → LOD Settings).
6. Kliknij: **Build → Build HLODs** (dla większych scen) i porównaj FPS przed/po.

## Poziom 4: Integracje mobilne (1-2 tygodnie)

1. **Powiadomienia push**
   - Firebase Cloud Messaging / APNs (przez pluginy).
2. **Analityka i crash reporting**
   - Firebase Analytics, Crashlytics, Sentry.
3. **Monetyzacja**
   - IAP, rewarded ads, subskrypcje.

### Krok po kroku: integracje

1. **Analityka**
   - Kliknij: **Edit → Plugins** i aktywuj plugin analityki.
   - Kliknij: **Project Settings → Plugins → [Nazwa dostawcy]** i wklej klucze SDK.
2. **Powiadomienia push**
   - Skonfiguruj certyfikaty/APNs lub FCM w panelu dostawcy.
   - W UE ustaw wymagane pola w `Project Settings → Platforms → iOS/Android`.
3. **IAP**
   - Kliknij: **Project Settings → Platforms → Android/iOS** i uzupełnij identyfikatory produktów.
   - Dodaj ekran sklepu (`WBP_Shop`) i obsłuż status transakcji (success/fail/cancel).

## Poziom 5: Build, testy i publikacja (1-2 tygodnie)

1. **CI/CD**
   - Automatyczne buildy APK/AAB/IPA.
2. **Testy na realnych urządzeniach**
   - Minimum: low-end, mid-range, high-end.
3. **Release**
   - Google Play (AAB), App Store (TestFlight + review).

### Krok po kroku: release pipeline

1. Kliknij: **Platforms → Android → Configure Now** (jeśli UE wymaga auto-konfiguracji).
2. W `Project Settings → Android`:
   - ustaw `Package Name`,
   - ustaw `Min SDK` i `Target SDK`,
   - podłącz keystore do podpisywania.
3. Kliknij: **File → Package Project → Android (AAB)**.
4. Uruchom testy na min. 3 klasach urządzeń i zapisz wyniki (FPS, RAM, temperatura, battery drain).
5. Wgraj build do **Google Play Console (Internal testing)** lub **TestFlight**.
6. Po akceptacji testów wygeneruj **Release Candidate** i zamroź scope zmian.

## Kamienie milowe

- **M1 (tydzień 2):** działający prototyp z touch input i prostym HUD.
- **M2 (tydzień 5):** pionowy slice z pętlą gameplay i zapisami danych.
- **M3 (tydzień 8):** build beta po optymalizacji i testach wydajności.
- **M4 (tydzień 10):** release candidate gotowy do publikacji.

## Rekomendowane materiały

- Unreal Engine Documentation - Mobile Development
- Unreal Online Learning - kursy UE5
- Android Performance Patterns + oficjalne checklisty Play Console

## Najczęstsze pułapki i jak ich uniknąć

1. **Zbyt ciężkie tekstury 4K na mobile**
   - Ustaw limity tekstur per Device Profile.
2. **Brak testów na słabych urządzeniach**
   - Wymuś testy low-end od pierwszego sprintu.
3. **Przeładowany HUD**
   - Redukuj liczbę animowanych widgetów i efektów post-process.
4. **Niestabilne FPS przez dynamiczne światła**
   - Preferuj baked lighting tam, gdzie to możliwe.
5. **Brak telemetryki**
   - Dodaj eventy analityczne od wersji alpha, nie dopiero na produkcji.
