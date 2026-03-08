# Projektowanie Aplikacji Mobilnych

Projektowanie aplikacji mobilnej to iteracyjny proces, który zaczyna się od zrozumienia użytkownika, jego potrzeb i kontekstu użycia — i dopiero potem przechodzi do warstwy wizualnej.

## Podwójny diament — Double Diamond

```
    Discover       Define         Develop        Deliver
   (badania)    (analiza)       (projektowanie) (wdrożenie)
       ◇             ◈              ◇               ◈
 szerokie     zawężone         szerokie        zawężone
 myślenie     rozumienie       rozwiązania     wdrożenie
```

Każda faza naprzemiennie rozszerza (diverge) i zawęża (converge) myślenie. **Double Diamond** jest procesem iteracyjnym — po dostarczeniu powracamy do badań.

## Fazy procesu UX

### 1. Badania (Research)

Przed pikselami: rozmawiaj z użytkownikami.

```
Metody badań:
├── Wywiady pogłębione (IDI)     → "Opowiedz mi o ostatnim razie gdy..."
├── Obserwacje kontekstowe       → user przy pracy/w naturze
├── Dzienniczki (diary studies) → samodzielne notatki przez tydzień
├── Ankiety (surveys)            → ilościowe dane, n > 100
└── Analiza konkurencji         → co robią inni dobrze/źle
```

Pytania otwarte, nie sugestywne: „Jak zarządzasz zadaniami?" nie „Czy używałbyś kalendarza?".

### 2. Persony i Mapy User Journey

```
Persona: Marta Kowalska, 32 lata, project manager
┌──────────────────────────────────────────────┐
│  Cele: skuteczne zarządzanie zespołem        │
│  Frustracje: zbyt wiele narzędzi, chaos      │
│  Zachowania: aktywna rano, często w biegu    │
│  Cytaty: "Chcę mieć wszystko w jednym       │
│           miejscu bez przełączania aplikacji"│
└──────────────────────────────────────────────┘

User Journey — śledzenie emotji na każdym etapie:
Wejście → Onboarding → Użycie → Powrót → Rekomendacja
  😐          😊          😍        😊          🥰
Luka: onboarding zbyt długi → skróć do 3 kroków
```

### 3. Architektura informacji i wireframes

```
Hierarchia treści (Card Sort):
Aplikacja do zadań
├── Moje zadania
│   ├── Dziś
│   ├── Nadchodzące
│   └── Ukończone
├── Projekty
│   ├── [Projekt A]
│   └── [Projekt B]
├── Kalendarz
└── Ustawienia

Wireframes: szkice low-fidelity (ołówek, Balsamiq, Figma)
→ Testuj z użytkownikami zanim zaczniesz wizualne projektowanie!
```

## Figma — narzędzie pracy

```
Figma Workflow:
1. Components  → przyciski, karty, ikony w jednym miejscu
2. Auto Layout → elementy dostosowują rozmiar do treści
3. Variables   → tokeny kolorów i typografii
4. Prototyping → klikalne przejścia bez kodu
5. Dev Mode    → pomiar spacingów, export kolorów dla developera
```

Dobre praktyki w Figma:
- **8px grid** — wszystkie spacingi wielokrotnością 8 (8, 16, 24, 32, 48...)
- **Styles** — jeden kolor Primary/500 używany w stu miejscach, zmień w jednym
- **Variants** — komponent Button ma warianty: size × type × state
- **Handoff** — nie PDF-y, tylko Figma Dev Mode lub Zeplin

## Typografia mobilna

Skala typograficzna Material Design 3 — 15 stylów:

| Token | Rozmiar | Użycie |
|-------|---------|--------|
| Display Large | 57sp | Nagłówki hero, landing |
| Headline Large | 32sp | Tytuły ekranów |
| Title Large | 22sp | Tytuły kart, sekcji |
| Body Large | 16sp | Główna treść |
| Body Medium | 14sp | Opisy, etykiety |
| Label Large | 14sp | Przyciski |
| Label Small | 11sp | Captions, tagi |

```kotlin
// Własna skala typografii w Compose
val AppTypography = Typography(
    headlineLarge = TextStyle(
        fontFamily = FontFamily(Font(R.font.outfit_bold)),
        fontSize = 32.sp,
        lineHeight = 40.sp,
        letterSpacing = 0.sp
    ),
    bodyLarge = TextStyle(
        fontFamily = FontFamily(Font(R.font.outfit_regular)),
        fontSize = 16.sp,
        lineHeight = 24.sp,
        letterSpacing = 0.15.sp
    ),
    labelLarge = TextStyle(
        fontFamily = FontFamily(Font(R.font.outfit_medium)),
        fontSize = 14.sp,
        lineHeight = 20.sp,
        letterSpacing = 0.1.sp
    )
)
```

## Kolor — system tokenów

```kotlin
// Material Theme Builder → generuje pełną paletę z jednego koloru seedu
val LightColorScheme = lightColorScheme(
    primary          = Color(0xFF5B4FCF),
    onPrimary        = Color.White,
    primaryContainer = Color(0xFFE9DFFF),
    onPrimaryContainer = Color(0xFF190061),
    secondary        = Color(0xFF605C71),
    secondaryContainer = Color(0xFFE6DFF9),
    error            = Color(0xFFBA1A1A),
    surface          = Color(0xFFFEF7FF),
    background       = Color(0xFFFEF7FF),
)

// Ciemny motyw — osobna paleta, NIE odwracanie jasnej!
val DarkColorScheme = darkColorScheme(
    primary          = Color(0xFFCEBDFF),
    onPrimary        = Color(0xFF300096),
    primaryContainer = Color(0xFF4636B6),
    surface          = Color(0xFF141218),
    background       = Color(0xFF141218),
)
```

## Onboarding — pierwsze wrażenie

```
Złe praktyki onboardingu:
✗ 7+ ekranów wyjaśniających co aplikacja robi
✗ Prośba o wszystkie uprawnienia przed użyciem
✗ Wymagana rejestracja przed zobaczeniem wartości

Dobre praktyki:
✓ Pokaż wartość natychmiast — "Tworzę swoje pierwsze zadanie..."
✓ Proś o uprawnienia przy konkretnym użyciu z kontekstem
✓ Umożliw korzystanie bez konta ("Continue as guest")
✓ 3 ekrany max — lub jeszcze lepiej: guided first use
```

```kotlin
// Progressive Onboarding — tooltip przy pierwszym użyciu
@Composable
fun OnboardingTooltip(
    visible: Boolean,
    text: String,
    targetContent: @Composable () -> Unit
) {
    Box {
        targetContent()
        AnimatedVisibility(
            visible = visible,
            enter = fadeIn() + slideInVertically(),
            exit = fadeOut()
        ) {
            Card(
                modifier = Modifier
                    .align(Alignment.BottomStart)
                    .offset(y = 8.dp)
                    .padding(8.dp),
                colors = CardDefaults.cardColors(
                    containerColor = MaterialTheme.colorScheme.inverseSurface
                )
            ) {
                Text(
                    text = text,
                    color = MaterialTheme.colorScheme.inverseOnSurface,
                    modifier = Modifier.padding(12.dp),
                    style = MaterialTheme.typography.bodyMedium
                )
            }
        }
    }
}
```

## Testy użyteczności

```
Typy testów:
├── Moderowane (myślenie na głos)  → obserwujesz, notujesz
├── Niemoderowane (remote)        → nagrania z UserTesting.com, Maze
├── A/B testy (ilościowe)         → dwie wersje, statystki konwersji
└── Heuristic evaluation          → ekspert ocenia 10 heurystyk Nielsena

Heurystyki Nielsena (skrót):
1. Widoczność statusu systemu
2. Zgodność z rzeczywistością  
3. Kontrola i wolność użytkownika
4. Spójność i standardy
5. Zapobieganie błędom
6. Rozpoznawanie zamiast przypominania
7. Elastyczność i efektywność
8. Estetyczny i minimalistyczny design
9. Pomoc w diagnozowaniu błędów
10. Dokumentacja i pomoc
```

## Linki

- [Material Design 3](https://m3.material.io)
- [Human Interface Guidelines (Apple)](https://developer.apple.com/design/human-interface-guidelines)
- [Figma](https://figma.com)
- [Material Theme Builder](https://material-foundation.github.io/material-theme-builder/)
- [Laws of UX](https://lawsofux.com)
