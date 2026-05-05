# Łączenie modalności danych w śledzeniu obiektów: filtr Kalmana, procesy gaussowskie (GP) i praktyczna korekcja SYAC

## 1. Dlaczego fuzja modalności jest dziś konieczna?

Współczesne systemy śledzenia obiektów (roboty mobilne, ADAS/AV, drony, automatyka magazynowa, AR) rzadko opierają się na pojedynczym źródle danych. Kamera RGB daje bogatą semantykę, lidar dostarcza geometrię, radar jest odporniejszy na pogodę, IMU opisuje ruch krótkoterminowy, GNSS stabilizuje pozycję globalną, a enkodery i odometria poprawiają lokalną ciągłość. Każda modalność ma jednak inne:

- opóźnienia,
- częstotliwości próbkowania,
- poziomy szumu,
- błędy systematyczne,
- „martwe strefy” obserwacyjne.

Dlatego praktyczne śledzenie obiektów jest problemem **fuzji informacji** i **zarządzania niepewnością**, a nie wyłącznie estymacji punktowej.

Trzy narzędzia, które dobrze się uzupełniają:

1. **Filtr Kalmana** - szybka, rekursywna estymacja stanu.
2. **Procesy gaussowskie (GP)** - modelowanie złożonych, nieliniowych i heteroscedastycznych błędów/szumów.
3. **SYAC (Soft Yaw Axis Correction)** - praktyczna korekcja dryftu osi yaw (kursu) z miękkim ograniczaniem i kontrolą zaufania do korekty.

W tym artykule pokazuję, jak połączyć te trzy elementy w spójny pipeline produkcyjny.

---

## 2. Problem śledzenia jako estymacja stanu

Niech stan obiektu/sensora w chwili \(k\) będzie:

$$
\mathbf{x}_k = [x, y, z, v_x, v_y, v_z, \psi, \dot\psi]^T
$$

Gdzie:

- \((x,y,z)\) - pozycja,
- \((v_x,v_y,v_z)\) - prędkość,
- \(\psi\) - yaw (azymut/kurs),
- \(\dot\psi\) - yaw rate.

Model procesu:

$$
\mathbf{x}_k = f(\mathbf{x}_{k-1}, \mathbf{u}_{k-1}) + \mathbf{w}_{k-1}, \quad \mathbf{w}\sim\mathcal{N}(0,\mathbf{Q})
$$

Model pomiaru dla modalności \(m\):

$$
\mathbf{z}^{(m)}_k = h^{(m)}(\mathbf{x}_k) + \mathbf{v}^{(m)}_k, \quad \mathbf{v}^{(m)}\sim\mathcal{N}(0,\mathbf{R}^{(m)}_k)
$$

Klucz praktyczny: **\(\mathbf{R}^{(m)}_k\)** nie powinno być stałe. W prawdziwym systemie zależy od warunków (oświetlenie, deszcz, odległość, prędkość, konfuzja detektora, itp.). Tu właśnie GP wnosi dużą wartość.

---

## 3. Filtr Kalmana jako rdzeń rekursji

### 3.1 Wersja liniowa (intuicja)

Dla modeli liniowych:

$$
\mathbf{x}_k = \mathbf{F}\mathbf{x}_{k-1}+\mathbf{B}\mathbf{u}_{k-1}+\mathbf{w}_{k-1}, \quad
\mathbf{z}_k=\mathbf{H}\mathbf{x}_k+\mathbf{v}_k
$$

Kroki:

1. **Predykcja**
$$
\hat{\mathbf{x}}^-_k = \mathbf{F}\hat{\mathbf{x}}_{k-1}+\mathbf{B}\mathbf{u}_{k-1}
$$
$$
\mathbf{P}^-_k=\mathbf{F}\mathbf{P}_{k-1}\mathbf{F}^T+\mathbf{Q}
$$

2. **Aktualizacja**
$$
\mathbf{y}_k=\mathbf{z}_k-\mathbf{H}\hat{\mathbf{x}}^-_k
$$
$$
\mathbf{S}_k=\mathbf{H}\mathbf{P}^-_k\mathbf{H}^T+\mathbf{R}
$$
$$
\mathbf{K}_k=\mathbf{P}^-_k\mathbf{H}^T\mathbf{S}_k^{-1}
$$
$$
\hat{\mathbf{x}}_k=\hat{\mathbf{x}}^-_k+\mathbf{K}_k\mathbf{y}_k,
\quad
\mathbf{P}_k=(\mathbf{I}-\mathbf{K}_k\mathbf{H})\mathbf{P}^-_k
$$

### 3.2 EKF/UKF w praktyce

W śledzeniu obiektów często stosujemy EKF lub UKF, bo:

- yaw jest zmienną kątową (modulo \(2\pi\)),
- mapowanie pomiarów z radaru/lidaru bywa nieliniowe,
- modele kinematyczne CTRV/CTRA są nieliniowe.

Minimalna zasada inżynierska: **najpierw stabilny EKF z dobrze dobranymi \(Q,R\), dopiero potem komplikacje**.

---

## 4. Fuzja wielu modalności: architektury i pułapki

### 4.1 Dwie główne strategie

1. **Early fusion (na poziomie cech)**
   - łączysz cechy przed estymacją,
   - mocna semantyka, ale duża złożoność i podatność na brak jednej modalności.

2. **Late fusion (na poziomie estymat/pomiarów)**
   - każda modalność daje pomiar lub pseudopomiar,
   - Kalman scala je sekwencyjnie,
   - prostsza diagnostyka i łatwiejsza degradacja graceful fallback.

W systemach czasu rzeczywistego często wygrywa **late fusion + asynchroniczna aktualizacja**.

### 4.2 Asynchroniczność i out-of-sequence measurements (OOSM)

- Kamera: 20–30 Hz, większy latency.
- IMU: 100–400 Hz, mały latency.
- Radar/lidar: 10–20 Hz.

Jeśli pomiar przychodzi „spóźniony”, mamy opcje:

- odrzucić (proste, ale marnuje informację),
- retrodiction / bufor historii i ponowne przeliczenie (lepiej, ale drożej),
- przybliżona korekta z linearyzacją lokalną.

### 4.3 Gating statystyczny

Dla innowacji \(\mathbf{y}_k\) stosujemy odległość Mahalanobisa:

$$
D^2 = \mathbf{y}_k^T\mathbf{S}_k^{-1}\mathbf{y}_k
$$

Jeśli \(D^2\) przekracza próg \(\chi^2\), pomiar jest odrzucany lub osłabiany. To krytyczne przy fałszywych detekcjach i częściowej okluzji.

---

## 5. Procesy gaussowskie (GP) w służbie filtracji

### 5.1 Co GP daje ponad klasyczny Kalman?

Filtr Kalmana zakłada, że znamy rozkłady szumu procesu i pomiaru. W praktyce szum jest:

- zależny od kontekstu,
- często nieliniowy,
- czasem heteroscedastyczny.

GP umożliwia model:

$$
r(\mathbf{c}) \sim \mathcal{GP}(m(\mathbf{c}), k(\mathbf{c},\mathbf{c'}))
$$

Gdzie \(\mathbf{c}\) to kontekst (np. odległość do obiektu, prędkość względna, confidence detektora, warunki pogodowe, illumination score).

Efekt: dla każdej próbki dostajemy predykcję **średniej błędu** i **wariancji błędu**.

### 5.2 Trzy praktyczne zastosowania GP

1. **Bias correction** pomiaru:
   $$
   \tilde{z}=z-\hat{b}_{GP}(\mathbf{c})
   $$
2. **Adaptacyjne \(R_k\)**:
   $$
   R_k = R_{base} + \sigma^2_{GP}(\mathbf{c})
   $$
3. **Uczenie residual dynamics** dla składnika procesu (augmentacja modelu):
   $$
   x_k = f(x_{k-1}) + g_{GP}(\mathbf{c}_{k-1}) + w_k
   $$

Najbezpieczniej zacząć od (1) i (2).

### 5.3 Wybór kernela i koszt obliczeń

- RBF/SE: gładkie funkcje, dobry baseline.
- Matérn: lepszy przy mniej gładkich zjawiskach.
- ARD: automatyczne ważenie cech kontekstowych.

Klasyczny GP ma koszt \(\mathcal{O}(N^3)\). Do systemów online:

- inducing points (sparse GP),
- lokalne GP (mixture/local experts),
- okresowa re-trenacja offline + lekka inferencja online.

---

## 6. SYAC (Soft Yaw Axis Correction): sens i matematyka

### 6.1 Problem yaw drift

Yaw zwykle dryfuje przez:

- bias żyroskopu,
- poślizg kół (odometria),
- błędy kalibracji osi,
- chwilową utratę wiarygodnych obserwacji headingu.

Twarda korekta (hard reset) powoduje skoki orientacji i destabilizuje tor śledzenia. SYAC wprowadza **miękką korektę**.

### 6.2 Idea SYAC

Mamy:

- \(\psi^-_k\): yaw po predykcji,
- \(\psi^{ref}_k\): referencja yaw (np. z kierunku wektora prędkości, mapy pasa ruchu, stabilniejszego sensora, albo fuzji radar+kamera),
- \(\Delta\psi_k = \mathrm{wrap}(\psi^{ref}_k-\psi^-_k)\).

SYAC zamiast pełnej korekty stosuje:

$$
\delta\psi_k = \alpha_k \cdot s(\Delta\psi_k)
$$

Gdzie:

- \(0 \leq \alpha_k \leq 1\) - waga zaufania,
- \(s(\cdot)\) - funkcja „soft”, np. saturacja \(\tanh\) albo clipped linear.

Przykład:
$$
s(\Delta\psi)=\psi_{max}\tanh\left(\frac{\Delta\psi}{\psi_{scale}}\right)
$$

Następnie:
$$
\psi_k \leftarrow \mathrm{wrap}(\psi^-_k + \delta\psi_k)
$$

I opcjonalnie aktualizacja \(\dot\psi\) z tłumieniem.

### 6.3 Jak wyznaczyć \(\alpha_k\)?

Praktycznie:

$$
\alpha_k = w_{qual} \cdot w_{dyn} \cdot w_{cons}
$$

- \(w_{qual}\): jakość referencji (confidence detektora, jakość fitu linii, SNR radaru).
- \(w_{dyn}\): zgodność z dynamiką (duże przyspieszenia poprzeczne -> mniejsza wiara w prostą referencję).
- \(w_{cons}\): spójność wielomodalna (czy kamera i radar dają podobny heading).

Wersja rozszerzona: \(\alpha_k\) i \(\psi_{scale}\) przewidywane przez GP na podstawie kontekstu.

---

## 7. Integracja: Kalman + GP + SYAC (pipeline krok po kroku)

1. **Synchronizacja czasowa** (timestamp alignment, kompensacja opóźnień).
2. **Predykcja filtru** (EKF/UKF).
3. **GP-correction dla każdej modalności**:
   - korekta biasu pomiaru,
   - aktualizacja \(R_k\) o wariancję GP.
4. **Gating** (Mahalanobis / test zgodności).
5. **Sekwencyjna aktualizacja filtru** pomiarami, które przeszły gating.
6. **SYAC post-update** dla yaw (lub jako pseudo-pomiar headingu w filtrze).
7. **Walidacja stabilności**: NIS/NEES, jitter yaw, continuity tracków.

### Wariant implementacyjny

- Gdy system jest krytyczny czasowo: SYAC jako lekka warstwa post-update.
- Gdy zależy nam na „czystości probabilistycznej”: potraktować SYAC jako dodatkowy pomiar yaw z adaptacyjnym \(R_{yaw}\).

---

## 8. Praktyczna implementacja SYAC - pseudo-kod

```python
def syac_update(yaw_pred, yaw_ref, quality, dyn_score, consistency,
                yaw_max=0.25, yaw_scale=0.20, alpha_min=0.0, alpha_max=0.9):
    # 1) roznica katowa w [-pi, pi]
    dpsi = wrap_to_pi(yaw_ref - yaw_pred)

    # 2) miekka saturacja
    soft = yaw_max * math.tanh(dpsi / yaw_scale)

    # 3) waga zaufania
    alpha = clamp(quality * dyn_score * consistency, alpha_min, alpha_max)

    # 4) korekcja
    yaw_corr = wrap_to_pi(yaw_pred + alpha * soft)
    return yaw_corr, alpha, dpsi
```

Dobre praktyki:

- ogranicz \(|\delta\psi|\) per krok (rate limiter),
- loguj \(\alpha, \Delta\psi, D^2\) i odsetek odrzuceń bramkowania,
- stosuj anti-windup dla powiązanych regulatorów toru,
- nie koryguj yaw, gdy prędkość obiektu \(< v_{min}\) (heading bywa nieokreślony).

---

## 9. Metryki i walidacja: jak udowodnić, że działa lepiej?

### 9.1 Metryki estymacji i śledzenia

- RMSE pozycji i prędkości,
- RMSE yaw + odsetek skoków > próg,
- MOTA/MOTP/HOTA (dla trackingu wieloobiektowego),
- ID switches,
- track fragmentation.

### 9.2 Metryki filtracji probabilistycznej

- NIS (Normalized Innovation Squared),
- NEES (Normalized Estimation Error Squared),
- zgodność rozkładu innowacji z założeniami.

Jeśli NIS stale za duży -> zaniżone \(R\) lub zły model; jeśli za mały -> filtr „zbyt ostrożny”.

### 9.3 Testy ablation

Porównaj warianty:

1. Kalman baseline,
2. Kalman + SYAC,
3. Kalman + GP,
4. Kalman + GP + SYAC.

I osobno dla scenariuszy: noc, deszcz, okluzja, ostre zakręty, niska prędkość.

---

## 10. Najczęstsze błędy implementacyjne

1. **Brak poprawnego wrapowania kątów** (skoki ±π).
2. **Stałe \(R\)** mimo zmiennych warunków.
3. **Nadmierna wiara w GP** poza obszarem danych treningowych.
4. **Twarda korekta yaw** bez limitu tempa.
5. **Brak monitoringu statystycznego** (NIS/NEES).
6. **Brak obsługi OOSM** i opóźnień modalności.

---

## 11. Minimalny plan wdrożenia produkcyjnego

1. Zbuduj stabilny EKF/UKF z asynchroniczną fuzją i gatingiem.
2. Dodaj telemetry: residuale, NIS/NEES, latency per sensor.
3. Wprowadź SYAC z konserwatywnymi limitami (małe \(\alpha_{max}\), małe \(\psi_{max}\)).
4. Zbierz dane kontekstowe i residuale do treningu GP.
5. Wdróż GP najpierw do adaptacji \(R\), później do bias correction.
6. Wykonaj ablation + testy regresji na scenariuszach krytycznych.
7. Dopiero potem rozszerz model stanu i złożoność kerneli.

---

## 12. Podsumowanie

Najlepsze efekty w śledzeniu obiektów daje połączenie:

- **Kalmana** jako szybkiego kręgosłupa probabilistycznej estymacji,
- **GP** jako warstwy uczącej się błędów zależnych od kontekstu,
- **SYAC** jako bezpiecznej, miękkiej korekcji dryftu yaw.

W praktyce kluczowe nie jest „najbardziej złożone równanie”, lecz:

- poprawna obsługa czasu i opóźnień,
- adaptacyjne niepewności,
- kontrola stabilności korekcji kątowej,
- rygorystyczna walidacja statystyczna.

To podejście zwykle poprawia jednocześnie: dokładność, odporność na warunki brzegowe i płynność trajektorii - czyli dokładnie to, czego potrzebują systemy działające w świecie rzeczywistym.
