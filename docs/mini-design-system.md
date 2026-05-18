# Mini Design System — MobileHub

## Zakres motywów kolorystycznych w MobileHub

Design system wspiera **wiele motywów** dostępnych w aplikacji:
- `light` (Jasny)
- `dark` (Ciemny)
- `ocean`
- `forest`
- `sunset`
- `rose`

> Motyw `aurora` został usunięty i nie powinien być używany ani przywracany w nowych zmianach UI.

Każdy motyw musi mapować te same tokeny semantyczne (`--bg`, `--surface`, `--text`, `--accent`, `--border`, `--shadow`), aby komponenty działały spójnie między wariantami kolorystycznymi.

---

## 1) Paleta kolorów

### Tło i powierzchnie
- `--bg-canvas: #0B1020` — główne tło aplikacji.
- `--bg-subtle: #121A2F` — tło sekcji i kontenerów.
- `--surface-1: #18233E` — karty / panele.
- `--surface-2: #213054` — elementy aktywne na kartach.
- `--surface-overlay: rgba(9, 14, 28, 0.72)` — overlay (menu, modal).

### Kolory tekstu
- `--text-primary: #F5F8FF` — tekst główny.
- `--text-secondary: #C2CCE5` — tekst pomocniczy.
- `--text-muted: #8FA0C8` — meta, podpisy.
- `--text-on-accent: #081226` — tekst na jasnym akcencie.

### Akcenty marki
- `--accent-primary: #69A7FF` — CTA i linki.
- `--accent-primary-hover: #7DB4FF` — hover/focus.
- `--accent-secondary: #5EEAD4` — wyróżnienia neutralne.
- `--accent-tertiary: #A78BFA` — elementy edukacyjne / informacyjne.

### Statusy
- `--success: #34D399`
- `--warning: #FBBF24`
- `--danger: #F87171`
- `--info: #60A5FA`

### Reguły kontrastu
- Minimum WCAG AA: 4.5:1 dla tekstu regularnego.
- Status + ikona + etykieta (nie tylko kolor).
- Nie używać więcej niż 2 kolorów akcentowych na jednym ekranie.

---

## 2) Typografia

### Rodzina fontów
- Główna: `Inter, system-ui, -apple-system, Segoe UI, Roboto, sans-serif`.
- Monospace (kod/dane): `JetBrains Mono, ui-monospace, SFMono-Regular, Menlo, monospace`.

### Skala rozmiarów
- `h1`: 40px / 48px / 700
- `h2`: 32px / 40px / 700
- `h3`: 24px / 32px / 600
- `h4`: 20px / 28px / 600
- `body-lg`: 18px / 30px / 400
- `body`: 16px / 26px / 400
- `body-sm`: 14px / 22px / 400
- `caption`: 12px / 18px / 500

### Reguły składu
- Długość linii: 45–85 znaków.
- Śródtytuły co 2–4 akapity.
- Unikać tekstu wyśrodkowanego poza hero i krótkimi komunikatami.

---

## 3) Siatka i spacing

### Siatka
- Desktop: 12 kolumn, gutter 24px, margines zewnętrzny 32px.
- Tablet: 8 kolumn, gutter 20px, margines 24px.
- Mobile: 4 kolumny, gutter 16px, margines 16px.
- Maksymalna szerokość contentu: 1200px.

### Skala spacing (base 4)
- `4, 8, 12, 16, 24, 32, 40, 48, 64`.
- Sekcje pionowe: min. 48px (mobile), 64px (desktop).
- Odstęp nagłówek → treść: 16px lub 24px.
- Wewnątrz kart: 16px (kompakt), 24px (standard).

---

## 4) Styl komponentów

### Przyciski
- Wysokości: 40px (S), 48px (M), 56px (L).
- Radius: 12px.
- Primary: tło `--accent-primary`, tekst `--text-on-accent`.
- Secondary: tło transparent, border 1px `--accent-primary`.
- Ghost: bez obramowania, tylko tekst + hover surface.
- Focus: ring 2px `--accent-primary-hover` + offset 2px.

### Karty
- Tło: `--surface-1`.
- Border: 1px `rgba(151, 170, 210, 0.24)`.
- Radius: 16px.
- Padding: 16/24px.
- Hover: delikatny lift (`translateY(-2px)`) + cień soft.

### Inputy
- Wysokość: 48px.
- Tło: `--surface-2`.
- Border: 1px `rgba(151, 170, 210, 0.3)`.
- Placeholder: `--text-muted`.
- Focus: border `--accent-primary` + ring 2px rgba(105,167,255,0.25).
- Error: border `--danger`, pomocniczy tekst statusu poniżej pola.

### Nagłówek (top bar)
- Wysokość: 64px desktop / 56px mobile.
- Tło: `--surface-overlay` + blur 10px (jeśli wydajność pozwala).
- Dolna linia: 1px `rgba(151, 170, 210, 0.2)`.

### Sekcja hero
- Min-height: 60vh.
- Układ: lewa kolumna tekst + prawa grafika/preview.
- CTA max 2 sztuki (Primary + Secondary).
- Gradient tła subtelny, nie konkurujący z tekstem.

---

## 5) Zasady cieni, obramowań i gradientów

### Cienie
- `shadow-sm`: `0 2px 8px rgba(4, 10, 24, 0.22)`
- `shadow-md`: `0 8px 24px rgba(4, 10, 24, 0.28)`
- `shadow-lg`: `0 16px 40px rgba(4, 10, 24, 0.34)`

**Używać:**
- Do wskazania hierarchii (modal > dropdown > card).
- W hover komponentów interaktywnych.

**Unikać:**
- Stackowania wielu cieni na jednym elemencie.
- Cieni o wysokim rozmyciu na małych komponentach.

### Obramowania
- Standard: 1px półtransparentne.
- Silne rozgraniczenie: 2px tylko dla focus/error.
- Nie łączyć grubego border + mocny cień + gradient jednocześnie.

### Gradienty
- Marka: `linear-gradient(135deg, #69A7FF 0%, #5EEAD4 100%)`.
- Użycie: hero, banery, selected states o wysokiej randze.
- Zakaz: tekst body na gradientowym tle bez dodatkowego podbicia kontrastu.

---

## 6) UI rules dla zespołu (animacje i efekty)

### Ruch i timing
- Standard duration: `120ms`, `180ms`, `240ms`.
- Ease: `cubic-bezier(0.2, 0.8, 0.2, 1)`.
- Microinterakcje (hover/focus): max 180ms.
- Wejście sekcji/modala: max 240ms + fade/slide 8–16px.

### Zasada „subtelnie najpierw”
- Animacja ma wspierać hierarchię, nie przyciągać uwagi bardziej niż treść.
- Jeden dominujący efekt ruchu na viewport.
- Bez ciągłych, zapętlonych animacji w tle (wyjątek: małe elementy dekoracyjne o niskim kontraście).

### Spójność brandingu
- Wszystkie efekty świetlne i glow w tonacji `--accent-primary` lub `--accent-secondary`.
- Nie mieszać stylów skeuomorphic i flat w jednej sekcji.
- Motion language: lekki „lift + fade”, bez agresywnych bounce.

### Dostępność i wydajność
- Respect `prefers-reduced-motion: reduce` (wyłącz translacje, zostaw delikatny fade).
- Animować głównie `transform` i `opacity`.
- Unikać animowania `width/height/top/left` przy częstych interakcjach.

### Checklist PR (UI)
1. Czy kontrast jest zgodny z WCAG AA?
2. Czy spacing opiera się o skalę 4/8/12/16/24?
3. Czy komponent używa tokenów, a nie kolorów „na sztywno”?
4. Czy animacje mieszczą się w 120–240ms?
5. Czy focus states są widoczne z klawiatury?
