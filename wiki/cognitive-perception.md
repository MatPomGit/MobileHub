# Modelowanie kognitywne ludzkiej percepcji

## Streszczenie

Modelowanie kognitywne percepcji (*computational/cognitive modeling of human perception*) to dziedzina zajmująca się formalnym opisem mechanizmów, za pomocą których układ nerwowy przetwarza informacje sensoryczne i tworzy subiektywne doświadczenie świata. Artykuł omawia percepcję wzrokową (bottom-up vs top-down, trzy poziomy Marra, mapy saliencji), słuchową (analiza sceny audytywnej, efekt cocktail party), dotykową, integrację wielomodalną, pętlę percepcja-działanie, sakady i fiksacje, a także zastosowania w projektowaniu mobilnych interfejsów użytkownika.

**Słowa kluczowe:** modelowanie percepcji, saliency map, mapy saliencji, percepcja wzrokowa, Marr, uwaga wzrokowa, sakady, fiksacje, eye tracking, foveated rendering, mobile UI, crossmodal integration

---

## 1. Wprowadzenie: czym jest modelowanie percepcji?

Percepcja to aktywny proces, w którym mózg interpretuje sygnały sensoryczne, nadając im znaczenie. Modele percepcji próbują odpowiedzieć na pytania:

- Jak mózg wydobywa struktury z szumu sensorycznego?
- Które bodźce przykuwają uwagę i dlaczego?
- Jak oczekiwania i wiedza wpływają na to, co widzimy i słyszymy?
- Jak ruch oczu i ciała jest sprzężony z percepcją?

Modele te mają zastosowania praktyczne: projektowanie ikon aplikacji, rozmieszczenie elementów UI, testowanie czytelności interfejsów oraz budowanie robotów wyposażonych w ludzko-podobną percepcję.

### 1.1. Dlaczego modelowanie percepcji jest trudne?

Percepcja to problem **odwrotny** (*inverse problem*): z danych 2D siatkówki rekonstruujemy 3D świat. Problem jest z definicji źle postawiony - nieskończenie wiele konfiguracji 3D może dać ten sam obraz 2D. Mózg rozwiązuje go przez **założenia a priori** (*priors*): regularność środowiska, symetria, spójność czasowa.

```python
# Ilustracja problemu odwrotnego w percepcji głębi
# Ten sam obraz 2D można interpretować jako różne obiekty 3D

def retinal_projection(x_3d, y_3d, z_3d, focal_length=1.0):
    """Projekcja perspektywiczna: 3D → 2D siatkówka"""
    x_2d = focal_length * x_3d / z_3d
    y_2d = focal_length * y_3d / z_3d
    return x_2d, y_2d

# Dwa różne obiekty dające ten sam obraz 2D
obj1 = (1.0, 1.0, 2.0)   # obiekt bliski, mały
obj2 = (2.0, 2.0, 4.0)   # obiekt daleki, duży
proj1 = retinal_projection(*obj1)
proj2 = retinal_projection(*obj2)
print(f"Obraz 1: {proj1}, Obraz 2: {proj2}")   # takie same!
```

---

## 2. Hierarchia przetwarzania wzrokowego

### 2.1. Trzy poziomy Marra (*Marr's Tri-Level Hypothesis*)

David Marr (1982) zaproponował analizę systemów poznawczych na trzech poziomach:

| Poziom | Pytanie | Przykład (widzenie) |
|---|---|---|
| **Obliczeniowy** (*Computational*) | Co jest obliczane i dlaczego? | Cel: wykryć granice obiektów |
| **Algorytmiczny** (*Algorithmic*) | Jak to jest obliczane? | Operator Canny, DoG |
| **Implementacyjny** (*Implementational*) | W czym jest to zrealizowane? | Komórki dwubiegunowe siatkówki |

Ta trójpoziomowa hierarchia jest kluczowym narzędziem konceptualnym w neuronauce obliczeniowej - pozwala oddzielić pytania o funkcję od pytań o mechanizm i substrat.

### 2.2. Drogi wzrokowe w mózgu

```
Siatkówka
    │
Ciało kolankowate boczne (LGN)
    │
Kora wzrokowa pierwotna V1
    │
    ├──── Droga grzbietowa (WHERE/HOW) → V2 → V3 → MT/V5 → kora ciemieniowa
    │      (ruch, lokalizacja przestrzenna, kontrola motoryczna wzroku)
    │
    └──── Droga brzuszna (WHAT) → V2 → V4 → IT (kora skroniowa)
           (rozpoznawanie obiektów, twarzy, kolorów)
```

### 2.3. Przetwarzanie bottom-up vs top-down

**Bottom-up** (*data-driven*): przetwarzanie sterowane danymi sensorycznymi, bez udziału wiedzy uprzedniej.
**Top-down** (*knowledge-driven*): oczekiwania, kontekst i wiedza wpływają na percepcję.

```python
# Ilustracja: efekt kontekstu na rozpoznawanie liter (top-down)
# Ta sama figura "H" lub "A" zależy od kontekstu

ambiguous_char = "H"
context_word_1 = "T_E CAT"    # kontekst sugeruje "H" = "H" → "THE CAT"
context_word_2 = "THE C_T"    # kontekst sugeruje "H" = "A" → "THE CAT"

# Model Bayes: P(litera|sygnał, kontekst) ∝ P(sygnał|litera) × P(litera|kontekst)
import numpy as np

def bayesian_letter_recognition(signal_probs, context_probs):
    """
    signal_probs: P(sygnał | litera) dla każdej litery
    context_probs: P(litera | kontekst)
    Zwraca aposteriori rozkład nad literami.
    """
    posterior = np.array(signal_probs) * np.array(context_probs)
    return posterior / posterior.sum()

# Sygnał jest ambiwalentny (równe prawdopodobieństwo H i A)
signal = [0.5, 0.5]   # P(signal|H), P(signal|A)
context1 = [0.8, 0.2]   # kontekst "T_E" sugeruje "H"
context2 = [0.2, 0.8]   # kontekst "C_T" sugeruje "A"
print("Kontekst 1:", bayesian_letter_recognition(signal, context1))
print("Kontekst 2:", bayesian_letter_recognition(signal, context2))
```

---

## 3. Modele uwagi wzrokowej i mapy saliencji

### 3.1. Mapa saliencji (*Saliency Map*)

Mapa saliencji (Itti, Koch & Niebur, 1998) to reprezentacja „ważności" poszczególnych obszarów obrazu dla uwagi wzrokowej. Jest obliczana jako kombinacja map cech:

```python
import numpy as np

def compute_simple_saliency(image_array):
    """
    Uproszczona mapa saliencji oparta na kontraście lokalnym.
    image_array: numpy array o kształcie (H, W, 3) - RGB
    """
    gray = image_array.mean(axis=2)   # konwersja na szarość

    # Saliencja przez odchylenie od średniej globalnej
    global_mean = gray.mean()
    saliency = np.abs(gray - global_mean)

    # Normalizacja
    saliency = (saliency - saliency.min()) / (saliency.max() - saliency.min() + 1e-8)
    return saliency


def center_bias(H, W, sigma=0.3):
    """
    Ludzie mają tendencję do patrzenia w centrum obrazu/ekranu.
    Zwraca gaussowską mapę z pikiem w środku.
    """
    cy, cx = H / 2, W / 2
    y, x = np.ogrid[:H, :W]
    dist = np.sqrt(((y - cy) / (sigma * H)) ** 2 + ((x - cx) / (sigma * W)) ** 2)
    return np.exp(-0.5 * dist ** 2)


def combined_saliency(image_array, center_weight=0.4):
    """Łączy saliencję opartą na kontraście z center bias."""
    H, W = image_array.shape[:2]
    contrast_sal = compute_simple_saliency(image_array)
    cb = center_bias(H, W)
    combined = (1 - center_weight) * contrast_sal + center_weight * cb
    return combined / combined.max()
```

### 3.2. Model Itti-Koch-Niebur

Model IKN oblicza saliencję przez:
1. Ekstrakcję cech (intensywność, kolor, orientacja) na wielu skalach
2. Normalizację map cech
3. Kombinację liniową w mapę saliencji
4. Wybór następnego punktu fiksacji (winner-take-all)

### 3.3. Inhibicja powrotu (*Inhibition of Return*, IOR)

Po skupieniu uwagi na miejscu, uwaga jest hamowana przed powrotem do tego miejsca przez ~1–3 s. Mechanizm IOR ułatwia eksplorację środowiska.

```python
class AttentionModel:
    """
    Uproszczony model uwagi z IOR (Inhibition of Return).
    """
    IOR_DURATION = 1.5   # sekundy
    IOR_RADIUS = 50      # piksele

    def __init__(self, saliency_map):
        self.saliency = saliency_map.copy()
        self.ior_log = []   # log fiksacji: (x, y, czas)

    def apply_ior(self, current_time):
        """Tłumi saliencję w pobliżu ostatnich fiksacji."""
        inhibited = self.saliency.copy()
        H, W = inhibited.shape
        for fx, fy, ft in self.ior_log:
            if current_time - ft < self.IOR_DURATION:
                y, x = np.ogrid[:H, :W]
                mask = ((x - fx) ** 2 + (y - fy) ** 2) < self.IOR_RADIUS ** 2
                inhibited[mask] *= 0.1   # silne tłumienie
        return inhibited

    def next_fixation(self, current_time):
        """Wybór następnego miejsca fiksacji."""
        inhibited_sal = self.apply_ior(current_time)
        fy, fx = np.unravel_index(inhibited_sal.argmax(), inhibited_sal.shape)
        self.ior_log.append((fx, fy, current_time))
        return fx, fy
```

---

## 4. Percepcja wzrokowa: szczegóły

### 4.1. Widzenie fovealne vs peryferyczne

Siatkówka nie jest jednorodna. Dołek środkowy (*fovea*) zajmuje jedynie około 2° pola widzenia, ale zawiera 50% włókien nerwu wzrokowego.

| Cecha | Fovea | Peryferia |
|---|---|---|
| Ostrość wzroku | Maksymalna | Szybko spada |
| Typ fotoreceptorów | Głównie czopki | Głównie pręciki |
| Rozdzielczość barwna | Pełna (3 typy czopków) | Ograniczona |
| Czułość na ruch | Niska | Wysoka |
| Rola percepcyjna | Szczegóły, czytanie | Wykrywanie ruchu, orientacja przestrzenna |

**Implikacje dla mobile UI:**
- Kluczowe informacje (ceny, nazwy, statusy) powinny znajdować się w centrum lub w przewidywanych obszarach fiksacji
- Animacje przyciągające uwagę działają w peryferiach (ruch jest wykrywany poza fovea)
- Czytanie tekstu wymaga wielokrotnych sakad (2–4 razy na sekundę)

### 4.2. Sakady i fiksacje (*Saccades and Fixations*)

Oczy nie poruszają się płynnie (poza *smooth pursuit* dla poruszających się obiektów). Ruch wzroku składa się z:

- **Fiksacje** (*fixations*): zatrzymanie wzroku, 200–500 ms, informacje pobierane
- **Sakady** (*saccades*): szybkie przeskoki, 20–200 ms, brak przetwarzania (tłumienie sakadyczne)
- **Mikro-sakady**: drobne ruchy korekcyjne podczas fiksacji

```python
import random
import math

def simulate_scanpath(saliency_map, n_fixations=10, noise_sigma=30):
    """
    Symulacja ścieżki wzroku na podstawie mapy saliencji.
    Łączy saliencję z centrum ekranu i IOR.
    """
    H, W = saliency_map.shape
    model = AttentionModel(saliency_map)
    scanpath = []
    current_time = 0.0

    for i in range(n_fixations):
        fx, fy = model.next_fixation(current_time)
        # Dodaj szum motoryczny sakad
        fx += int(random.gauss(0, noise_sigma * 0.3))
        fy += int(random.gauss(0, noise_sigma * 0.3))
        fx = max(0, min(W - 1, fx))
        fy = max(0, min(H - 1, fy))
        scanpath.append((fx, fy, current_time))
        # Czas fiksacji zależy od lokalnej saliencji
        fixation_duration = 0.2 + 0.3 * (1 - saliency_map[fy, fx])
        current_time += fixation_duration + 0.05   # sakada ~50ms
    return scanpath
```

---

## 5. Percepcja słuchowa (*Auditory Perception*)

### 5.1. Analiza sceny audytywnej (*Auditory Scene Analysis*)

Analiza sceny audytywnej (Bregman, 1990) to proces segregacji dźwięków z mieszaniny - identyfikacja, który dźwięk pochodzi z którego źródła.

Mechanizmy grupowania strumieni audytywnych (*auditory stream segregation*):

| Cecha | Grupuje podobne | Separuje odmienne |
|---|---|---|
| Częstotliwość fundamentalna | F0 zbliżone → ten sam obiekt | Duże różnice F0 → różne obiekty |
| Lokalizacja przestrzenna | To samo miejsce → razem | Różne kierunki → osobno |
| Ciągłość czasowa | Regularne wzorce | Przerwy, zmienność |
| Barwa (*timbre*) | Podobna barwa | Różna barwa |

### 5.2. Efekt cocktail party

W zatłoczonym środowisku dźwiękowym jesteśmy zdolni skupić się na jednym rozmówcy. Model Cherry'ego (1953) rozróżnia przetwarzanie dichoptyczne (różne uszy) od filtrowania semantycznego.

Obliczeniowe modele: **Computational Auditory Scene Analysis (CASA)**, model Trehuba.

### 5.3. Implikacje dla aplikacji mobilnych

- Powiadomienia dźwiękowe: używaj częstotliwości wyróżniających się na tle szumu tła
- Synteza mowy: dbałość o naturalną prozodię zwiększa rozumiałość
- Obsługa wielodźwiękowa: priorytetyzacja strumieni audio w tle

---

## 6. Percepcja dotykowa i haptyczna (*Haptic Perception*)

Percepcja dotykowa w interakcji mobilnej obejmuje:

- **Mechanoreceptory**: Meissnera (dotyk lekki), Paciniego (wibracje), Merkla (ciśnienie), Ruffiniego (rozciąganie)
- **Progi wykrywalności** (*just-noticeable difference*, JND): różne dla różnych częstotliwości wibracji
- **Feedforward a feedback**: wibracje haptyczne jako potwierdzenie akcji

```python
# Model haptycznej informacji zwrotnej dla przycisków dotykowych
class HapticFeedbackModel:
    VIBRATION_PROFILES = {
        'confirm': {'frequency': 250, 'duration_ms': 30, 'amplitude': 0.7},
        'error':   {'frequency': 100, 'duration_ms': 100, 'amplitude': 1.0},
        'scroll':  {'frequency': 150, 'duration_ms': 10, 'amplitude': 0.3},
        'longpress': {'frequency': 200, 'duration_ms': 50, 'amplitude': 0.5},
    }

    JND_FREQUENCY_HZ = 5   # minimalnie wyczuwalna różnica częstotliwości
    JND_AMPLITUDE = 0.05   # minimalna wyczuwalna różnica amplitudy

    def is_distinguishable(self, profile1, profile2):
        """Czy dwa wzorce haptyczne są percepcyjnie rozróżnialne?"""
        freq_diff = abs(profile1['frequency'] - profile2['frequency'])
        amp_diff = abs(profile1['amplitude'] - profile2['amplitude'])
        return freq_diff >= self.JND_FREQUENCY_HZ or amp_diff >= self.JND_AMPLITUDE
```

---

## 7. Integracja wielomodalna (*Crossmodal / Multisensory Integration*)

Mózg integruje informacje z różnych zmysłów. Reguła Maximum Likelihood Estimation (MLE) przewiduje, że mózg waży każdy sygnał odwrotnie proporcjonalnie do jego wariancji:

```
ŝ = (w_V × ŝ_V + w_A × ŝ_A) / (w_V + w_A)
gdzie: w_V = 1/σ²_V,  w_A = 1/σ²_A
```

```python
def mle_multisensory_integration(estimate_visual, variance_visual,
                                  estimate_audio, variance_audio):
    """
    MLE model integracji wzrokowo-słuchowej.
    Zwraca optymalne oszacowanie i jego wariancję.
    """
    w_v = 1.0 / variance_visual
    w_a = 1.0 / variance_audio
    combined_estimate = (w_v * estimate_visual + w_a * estimate_audio) / (w_v + w_a)
    combined_variance = 1.0 / (w_v + w_a)
    return combined_estimate, combined_variance

# Lokalizacja dźwięku z błędem wzrokowym i słuchowym
est, var = mle_multisensory_integration(
    estimate_visual=45.0, variance_visual=4.0,    # wzrok: mniejszy błąd
    estimate_audio=50.0, variance_audio=16.0       # słuch: większy błąd
)
print(f"Zintegrowane: {est:.2f}°, σ²={var:.2f}")
```

**Efekt brzuchomówcy (Ventriloquist Effect)**: wzrok dominuje nad słuchem przy lokalizacji przestrzennej, co tłumaczy, dlaczego dźwięk pozornie pochodzi z ust lalki.

**Efekt McGurk**: integracja ruchu ust z dźwiękiem może zmienić słyszaną sylabę (np. wzrok "ga" + dźwięk "ba" → percepcja "da").

---

## 8. Pętla percepcja-działanie (*Perception-Action Loop*)

Percepcja nie jest pasywna - jest ściśle sprzężona z działaniem przez pętlę sprzężenia zwrotnego:

```
Środowisko
     │
  Percepcja  ←───────────────────────┐
     │                               │
  Przetważanie                       │
     │                               │
  Planowanie                         │
     │                               │
  Działanie  ────→ zmiana środowiska ┘
```

**Aktywna wizja** (*active vision*): oczy poruszamy nie tylko by zobaczyć, ale by kontrolować działanie. Badania Yarbus (1967) wykazały, że wzorce ruchów oczu zależą od zadania - oglądając ten sam obraz, inaczej patrzymy pytając „ile osób jest w pokoju?" vs „jaki wiek mają osoby?".

---

## 9. Aktywna wizja i ruch oczu (*Active Vision*)

### 9.1. Modele ruchów oczu

Główne typy ruchów oczu:

| Typ | Charakterystyka | Funkcja |
|---|---|---|
| Sakady (*saccades*) | Szybkie skoki, 20–700 ms | Kierowanie fovei na cel |
| Fiksacje (*fixations*) | Zatrzymanie 150–600 ms | Przetwarzanie szczegółowe |
| Smooth pursuit | Śledzenie ruchomego obiektu | Utrzymanie obiektu na fovei |
| Mikrosakkady | < 1° amplitudy | Zapobieganie adaptacji |
| Optokinetyczny reflex | Śledzenie płynącego tła | Stabilizacja obrazu |
| Vestibulo-ocular reflex | Kompensacja ruchów głowy | Stabilizacja obrazu |

### 9.2. Predykcja ścieżki wzroku

Nowoczesne modele predykcji fiksacji (DeepGaze, SAM) używają głębokich sieci neuronowych:

```python
import numpy as np

def predict_fixation_sequence_simple(saliency_map, n_fixations=8):
    """
    Predykcja sekwencji fiksacji przez prosty model.
    Łączy saliencję, center bias i IOR.
    """
    H, W = saliency_map.shape
    inhibition = np.zeros((H, W))
    fixations = []

    for step in range(n_fixations):
        # Mapa efektywna: saliencja + center bias - inhibicja
        cb = center_bias(H, W)
        effective = saliency_map * cb * (1 - inhibition)
        effective = np.clip(effective, 0, None)

        if effective.max() < 1e-6:
            break

        # Losowy wybór ważony
        flat = effective.flatten()
        probs = flat / flat.sum()
        idx = np.random.choice(len(flat), p=probs)
        fy, fx = divmod(idx, W)
        fixations.append((fx, fy))

        # Dodaj inhibicję w okolicach fiksacji
        r = 30
        y, x = np.ogrid[:H, :W]
        mask = ((x - fx)**2 + (y - fy)**2) <= r**2
        inhibition[mask] = min(1.0, inhibition[mask].max() + 0.7)

    return fixations
```

---

## 10. Zastosowania w mobile UI

### 10.1. Eye-tracking studies i heat mapy

Eye-tracking pozwala mierzyć rzeczywiste wzorce patrzenia użytkowników na interfejsy mobilne:

- **Heat mapy** (*heatmaps*): densitometria fiksacji, wskazuje popularne obszary
- **Cluster analysis**: grupowanie podobnych ścieżek wzroku
- **AOI analysis** (*Areas of Interest*): analiza czasu pierwszego i łącznego spojrzenia na sekcje UI

Wyniki badań eye-tracking:
- Użytkownicy stosują wzorzec **F-shape** na stronach z dużą ilością tekstu
- Pierwsze spojrzenie pada zazwyczaj na górny lewy obszar (w kulturach czytających LTR)
- Ikony aplikacji na dole ekranu (tab bar) są często pomijane wzrokiem podczas scrollowania

### 10.2. Projektowanie z uwzględnieniem percepcji

```python
# Wskazówki projektowe oparte na modelach percepcji

PERCEPTION_GUIDELINES = {
    "contrast_ratio": {
        "minimum_wcag_aa": 4.5,       # tekst normalny
        "minimum_wcag_aaa": 7.0,      # tekst normalny, wyższy standard
        "large_text_aa": 3.0,         # tekst >= 18pt
    },
    "target_sizes_dp": {
        "minimum": 44,                # iOS HIG minimum
        "recommended": 48,            # Material Design
        "comfortable": 56,            # FAB w Material Design
    },
    "animation_timing_ms": {
        "micro_interaction": 100,     # np. ripple
        "transition": 300,            # zmiana ekranu
        "complex_animation": 500,     # rozwinięcie elementu
        "max_perceivable_delay": 100, # powyżej = zauważalne opóźnienie
    },
    "reading_speed_wpm": {
        "average": 238,               # słowa/minutę czytanie ciche
        "mobile_reduction": 0.85,     # ~15% wolniej na ekranie mobilnym
    }
}

def estimate_reading_time(text, wpm=None):
    """Szacowanie czasu czytania tekstu."""
    wpm = wpm or PERCEPTION_GUIDELINES['reading_speed_wpm']['average']
    mobile_wpm = wpm * PERCEPTION_GUIDELINES['reading_speed_wpm']['mobile_reduction']
    word_count = len(text.split())
    return word_count / mobile_wpm * 60   # sekundy
```

### 10.3. Prawo Webera-Fechnera a projektowanie

Prawo Webera-Fechnera: percepcja różnic jest logarytmiczna, nie liniowa. Implikacje:

- Skale kolorów powinny być percepcyjnie równomierne (CIE Lab, Oklab)
- Rozmiary ikon powinny rosnąć geometrycznie, nie arytmetycznie
- Hierarchia typograficzna: skala geometryczna (np. 12, 14, 18, 24, 32 pt)

---

## 11. Widzenie peryferyczne a UI (*Peripheral Vision in UI*)

Widzenie peryferyczne odgrywa kluczową rolę w nawigacji mobilnej:

- **Wykrywanie zmian**: animacje w peryferiach skutecznie przyciągają uwagę (mogą też rozpraszać)
- **Przestrzenna orientacja**: użytkownicy używają peryferycznego widoku do orientacji w przestrzeni aplikacji
- **Crowding effect**: zbyt gęsto rozmieszczone elementy są trudniejsze do rozróżnienia w peryferiach

```
           ← ~30° →
    ╔══════════════════╗
    ║ [peryf.]  [fovea]║  ← użytkownik patrzy na środek ekranu
    ║                  ║
    ║    Powiadomienie ║  ← zauważone peryferyjnie (animacja/kolor)
    ╚══════════════════╝
```

---

## 12. Podsumowanie i perspektywy

Modelowanie kognitywne percepcji dostarcza solidnych naukowych podstaw dla projektowania interfejsów mobilnych. Kluczowe wnioski praktyczne:

1. **Saliencja** określa, na co patrzy użytkownik zanim podejmie świadomą decyzję
2. **Prawo Fittsa** i **Cowan's 4** wyznaczają limity fizyczne i pamięciowe interakcji
3. **Integracja multimodalna** (wzrok + dotyk + dźwięk) może redukować obciążenie poznawcze
4. **Eye-tracking** pozwala empirycznie weryfikować predykcje modeli
5. **Predykcyjne kodowanie** sugeruje, że oczekiwania użytkownika są fundamentalne - interfejsy powinny być przewidywalne

Kierunki przyszłych badań: **foveted rendering** dla AR/VR (renderowanie wysokorozdzielcze tylko tam, gdzie patrzy użytkownik), **gaze-based interaction** dla urządzeń mobilnych, **neuroadaptive interfaces** dostosowujące się do mierzonych stanów poznawczych.

## Literatura

1. Marr, D. (1982). *Vision: A Computational Investigation into the Human Representation and Processing of Visual Information*. Freeman.
2. Itti, L., Koch, C., & Niebur, E. (1998). A model of saliency-based visual attention. *IEEE TPAMI*, 20(11), 1254–1259.
3. Bregman, A. S. (1990). *Auditory Scene Analysis*. MIT Press.
4. Ernst, M. O., & Banks, M. S. (2002). Humans integrate visual and haptic information. *Nature*, 415, 429–433.
5. Yarbus, A. L. (1967). *Eye Movements and Vision*. Plenum Press.
6. Rayner, K. (1998). Eye movements in reading and information processing. *Psychological Bulletin*, 124(3).
7. Treisman, A., & Gelade, G. (1980). A feature-integration theory of attention. *Cognitive Psychology*, 12(1), 97–136.
8. Fitts, P. M. (1954). The information capacity of the human motor system. *JEPG*, 47(6), 381–391.

## Powiązane artykuły

- [Modele kognitywne](cognitive-models.md)
- [Obliczeniowe modelowanie poznania](computational-cognition.md)
- [Robotyka kognitywna](cognitive-robotics.md)
- [Architektura ACT-R](actr-architecture.md)
- [Architektura LIDA](lida-architecture.md)
- [Reprezentacja wiedzy](knowledge-representation.md)
- [Aktywna wizja](active-vision.md)
- [Widzenie fovealne](foveated-vision.md)
