# Best Practices — checklisty do projektu

> Poniższe checklisty możesz skopiować 1:1 do swojego repozytorium (np. do `docs/` albo do opisu PR).

## 1) Code style

- [ ] Ustalony i zapisany standard stylu (konwencje nazewnictwa, formatowanie, struktura plików). Zobacz: [Android Lint](./android-lint.md), [Material Design](./material-design.md).
- [ ] Spójny styl commitów i opisów PR (co, dlaczego, jak testowano). Zobacz: [Proces projektowania aplikacji](./app-design-process.md).
- [ ] Brak „martwego kodu”, duplikacji i nieużywanych zasobów. Zobacz: [Android Studio — narzędzia jakości](./android-studio.md).
- [ ] Czytelne nazwy klas/funkcji/modułów oraz małe, pojedynczo-odpowiedzialne komponenty. Zobacz: [Architektura Android](./android-architecture.md), [Clarion Architecture](./clarion-architecture.md).

## 2) Architektura

- [ ] Rozdzielone warstwy: UI, logika domenowa, dane/integracje. Zobacz: [Architektura Android](./android-architecture.md), [Wzorce cross-platform](./cross-platform.md).
- [ ] Jasno zdefiniowane granice modułów i kontrakty API. Zobacz: [Android Networking](./android-network.md), [iOS Networking](./ios-networking.md).
- [ ] Strategia stanu aplikacji (single source of truth, unikanie konfliktów stanu). Zobacz: [Jetpack Compose](./jetpack-compose.md), [SwiftUI Advanced](./swiftui-advanced.md).
- [ ] Plan skalowania (modularizacja, build time, podział feature’ów). Zobacz: [Android Studio](./android-studio.md), [KMP Multiplatform](./kmp-multiplatform.md).

## 3) Testy

- [ ] Pokrycie testami krytycznych ścieżek użytkownika (logowanie, płatność, zapis danych). Zobacz: [Android Testing](./android-testing.md).
- [ ] Testy jednostkowe dla logiki biznesowej i walidacji danych. Zobacz: [Android Testing](./android-testing.md), [Data storage best practices](./data-storage-best-practices.md).
- [ ] Testy integracyjne dla API, bazy i synchronizacji offline/online. Zobacz: [Android Data](./android-data.md), [Connectivity](./connectivity.md).
- [ ] Testy UI/E2E (scenariusze realnych interakcji). Zobacz: [UI/UX](./ui-ux.md), [Nawigacja i wzorce](./navigation-patterns.md).

## 4) Performance

- [ ] Zmierzony czas startu, responsywność i płynność animacji (baseline + regresje). Zobacz: [Mobile Performance](./mobile-performance.md), [Battery & Power](./battery-power.md).
- [ ] Optymalizacja zużycia pamięci i CPU/GPU. Zobacz: [Memory Management](./memory-management.md), [GPU Rendering](./gpu-rendering.md).
- [ ] Optymalizacja payloadów sieciowych i cache. Zobacz: [Android Network](./android-network.md), [Compression mobile](./compression-mobile.md).
- [ ] Kontrola rozmiaru aplikacji i zasobów (obrazy, multimedia, modele ML). Zobacz: [Image formats mobile](./image-formats-mobile.md), [ML file formats](./ml-file-formats.md), [On-device inference](./on-device-inference.md).

## 5) Security

- [ ] Brak sekretów w repo (klucze/API tokeny tylko w secure storage/CI secrets). Zobacz: [Mobile Security](./mobile-security.md), [AI Privacy & Security](./ai-privacy-security.md).
- [ ] Szyfrowanie danych „at rest” i „in transit”. Zobacz: [File storage mobile](./file-storage-mobile.md), [Android Network](./android-network.md), [iOS Data](./ios-data.md).
- [ ] Walidacja danych wejściowych i twarde reguły autoryzacji. Zobacz: [Android Data](./android-data.md), [App Distribution](./app-distribution.md).
- [ ] Aktualny plan reagowania na podatności i aktualizacje zależności. Zobacz: [App Updates](./app-updates.md), [App Publishing](./app-publishing.md).

## 6) Accessibility

- [ ] Kontrast, skala fontów i czytelność interfejsu na różnych ekranach. Zobacz: [Accessibility](./accessibility.md), [Ergonomia użytkowania](./ergonomia-uzytkowania.md).
- [ ] Obsługa czytników ekranowych, etykiet semantycznych i focus order. Zobacz: [Accessibility](./accessibility.md), [Material Design](./material-design.md).
- [ ] Interakcje bez gestów złożonych (alternatywy dla drag/pinch). Zobacz: [Gestures & interactions](./gestures-interactions.md), [Mobile Design](./mobile-design.md).
- [ ] Komunikaty błędów i stany pustych ekranów zrozumiałe poznawczo. Zobacz: [UI/UX](./ui-ux.md), [Technostres](./technostres.md).

---

## Checklista „przed oddaniem projektu”

- [ ] README opisuje: cel, funkcje, uruchomienie, architekturę i ograniczenia. Materiały: [Proces projektowania aplikacji](./app-design-process.md), [Projekt zaliczeniowy](./projekt-zaliczeniowy.md).
- [ ] Projekt buduje się „na czysto” (fresh clone) według instrukcji. Materiały: [Android Studio](./android-studio.md), [Xcode iOS](./xcode-ios.md).
- [ ] Wszystkie krytyczne testy przechodzą, a wyniki są dołączone do PR/raportu. Materiały: [Android Testing](./android-testing.md).
- [ ] Znane błędy i backlog są jawnie opisane (severity + workaround). Materiały: [Projekt zaliczeniowy z laboratorium](./projekt-zaliczeniowy_z_laboratorium.md).
- [ ] Demo (screeny/wideo) pokazuje kluczowe scenariusze użytkownika. Materiały: [UI/UX](./ui-ux.md), [Mobile Design](./mobile-design.md).
- [ ] Sprawdzone: performance, security, accessibility (minimum audyt ręczny). Materiały: [Mobile Performance](./mobile-performance.md), [Mobile Security](./mobile-security.md), [Accessibility](./accessibility.md).

## Checklista „przed publikacją aplikacji”

- [ ] Uzupełnione metadane sklepu (opis, grafiki, polityka prywatności, kategorie). Materiały: [App Metadata](./app-metadata.md), [App Publishing](./app-publishing.md), [App Distribution](./app-distribution.md).
- [ ] Podniesiona wersja aplikacji + changelog użytkowy. Materiały: [App Updates](./app-updates.md).
- [ ] Zweryfikowane zgody i uprawnienia (tylko niezbędne). Materiały: [Mobile Security](./mobile-security.md), [AI Legal Aspects](./ai-legal-aspects.md).
- [ ] Testy release build na docelowych urządzeniach i wersjach OS. Materiały: [Android Ecosystem](./android-ecosystem.md), [iOS Ecosystem](./ios-ecosystem.md).
- [ ] Plan monitoringu po wydaniu (crashe, ANR, feedback, KPI). Materiały: [Mobile Performance](./mobile-performance.md), [Aplikacje i aktualizacje](./app-updates.md).
- [ ] Plan rollback/hotfix i gotowość do szybkiej poprawki. Materiały: [App Updates](./app-updates.md), [App Distribution](./app-distribution.md).

---

## Gotowiec do skopiowania do własnego repo

Skopiuj poniższy blok do `CHECKLIST.md` lub `docs/best-practices.md`:

```md
# Best Practices Checklist

## Code style
- [ ] Standard stylu i formatowania
- [ ] Spójne nazwy i czytelne moduły
- [ ] Brak martwego kodu i duplikacji

## Architektura
- [ ] Rozdzielone warstwy UI / domena / dane
- [ ] Kontrakty API i granice modułów
- [ ] Strategia stanu aplikacji

## Testy
- [ ] Testy jednostkowe logiki krytycznej
- [ ] Testy integracyjne API/baza
- [ ] Testy UI/E2E kluczowych ścieżek

## Performance
- [ ] Pomiary startup time i responsywności
- [ ] Profilowanie pamięci/CPU/GPU
- [ ] Optymalizacja sieci i rozmiaru aplikacji

## Security
- [ ] Brak sekretów w repo
- [ ] Szyfrowanie danych i bezpieczna transmisja
- [ ] Aktualne zależności i plan reakcji na podatności

## Accessibility
- [ ] Kontrast i skalowanie tekstu
- [ ] Obsługa czytników ekranowych
- [ ] Zrozumiałe komunikaty błędów

## Przed oddaniem projektu
- [ ] README + instrukcja uruchomienia
- [ ] Zielony build i testy krytyczne
- [ ] Jawna lista znanych ograniczeń

## Przed publikacją aplikacji
- [ ] Metadane sklepu i polityka prywatności
- [ ] Wersjonowanie + changelog
- [ ] Testy release na urządzeniach docelowych
- [ ] Monitoring po wdrożeniu + plan hotfix
```
