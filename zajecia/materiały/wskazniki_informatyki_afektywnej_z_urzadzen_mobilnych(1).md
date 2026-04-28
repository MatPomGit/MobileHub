# Wskaźniki Informatyki Afektywnej z Urządzeń Mobilnych

## Założenia
Wskaźniki konstruowane są na podstawie danych pasywnie zbieranych przez urządzenie mobilne oraz (opcjonalnie) urządzenia typu wearable. Każdy wskaźnik opiera się na konkretnych metadanych i/lub sygnałach sensorycznych.

---

# I. Aktywność psychomotoryczna

## 1. Activity Level (AL)
**Wzór:**  
AL = (1/T) * Σ ||a_t||

**Źródła danych:**
- akcelerometr (wektor przyspieszenia XYZ)
- częstotliwość próbkowania (np. 10–100 Hz)

**Dane wejściowe:**
- wartości przyspieszeń w czasie
- liczba próbek w oknie czasowym

---

## 2. Activity Variability Index (AVI)
**Wzór:**  
AVI = Var(||a_t||)

**Źródła danych:**
- akcelerometr

**Dane wejściowe:**
- rozkład wartości przyspieszeń
- segmentacja czasowa (np. okna 1–5 min)

---

## 3. Activity Fragmentation (AF)
**Wzór:**  
AF = liczba przejść (aktywny ↔ nieaktywny) / czas

**Źródła danych:**
- akcelerometr

**Dane wejściowe:**
- binarna klasyfikacja aktywności (threshold na ||a_t||)
- liczba zmian stanu

---

## 4. Inactivity Duration (ID)
**Wzór:**  
ID = średnia długość epizodów bezruchu

**Źródła danych:**
- akcelerometr

**Dane wejściowe:**
- segmenty poniżej progu aktywności

---

# II. Rytm dobowy

## 5. Circadian Regularity Index (CRI)
**Wzór:**  
CRI = autocorr(activity(t), activity(t-24h))

**Źródła danych:**
- akcelerometr
- czas systemowy

**Dane wejściowe:**
- sygnał aktywności w czasie
- znaczniki czasu

---

## 6. Interdaily Stability (IS)
**Wzór:**
IS = wariancja międzydniowa / wariancja całkowita

**Źródła danych:**
- akcelerometr

**Dane wejściowe:**
- profile aktywności dla kolejnych dni

---

## 7. Intradaily Variability (IV)
**Wzór:**
IV = Σ(x_t - x_{t-1})² / Σ(x_t - mean)²

**Źródła danych:**
- akcelerometr

**Dane wejściowe:**
- kolejne próbki aktywności

---

# III. Sen

## 8. Sleep Duration (SD)
**Wzór:**
SD = czas między onset a wake

**Źródła danych:**
- akcelerometr
- czujnik światła
- logi użycia telefonu

**Dane wejściowe:**
- okresy bezruchu
- brak aktywności telefonu

---

## 9. Sleep Onset Latency (SOL)
**Wzór:**
SOL = czas od ostatniej aktywności do snu

**Źródła danych:**
- akcelerometr
- screen events

**Dane wejściowe:**
- czas ostatniego użycia telefonu
- początek bezruchu

---

## 10. Wake After Sleep Onset (WASO)
**Wzór:**
WASO = suma wybudzeń

**Źródła danych:**
- akcelerometr
- ekran (on/off)

**Dane wejściowe:**
- epizody aktywności w nocy

---

## 11. Nocturnal Phone Usage (NPU)
**Wzór:**
NPU = usage_night / usage_total

**Źródła danych:**
- logi systemowe

**Dane wejściowe:**
- czas aktywności ekranu w godzinach nocnych

---

# IV. Mobilność

## 12. Location Entropy (LE)
**Wzór:**
LE = -Σ p_i log p_i

**Źródła danych:**
- GPS
- WiFi SSID

**Dane wejściowe:**
- liczba unikalnych lokalizacji
- czas spędzony w każdej lokalizacji

---

## 13. Radius of Gyration (RoG)
**Wzór:**
RoG = sqrt((1/N) Σ (x_i - x_c)^2)

**Źródła danych:**
- GPS

**Dane wejściowe:**
- współrzędne lokalizacji

---

## 14. Home Stay Ratio (HSR)
**Wzór:**
HSR = czas_dom / czas_całkowity

**Źródła danych:**
- GPS

**Dane wejściowe:**
- identyfikacja lokalizacji domowej
- czas przebywania

---

# V. Interakcje społeczne

## 15. Social Interaction Frequency (SIF)
**Wzór:**
SIF = liczba interakcji / czas

**Źródła danych:**
- logi połączeń
- SMS

**Dane wejściowe:**
- liczba połączeń przychodzących i wychodzących
- liczba wiadomości

---

## 16. Outgoing Ratio (OR)
**Wzór:**
OR = outgoing / (incoming + outgoing)

**Źródła danych:**
- logi połączeń

**Dane wejściowe:**
- liczba połączeń przychodzących
- liczba połączeń wychodzących

---

## 17. Response Latency (RL)
**Wzór:**
RL = średni czas odpowiedzi

**Źródła danych:**
- SMS / komunikatory (timestampy)

**Dane wejściowe:**
- czas otrzymania wiadomości
- czas odpowiedzi

---

# VI. Użycie urządzenia

## 18. Screen Time (ST)
**Wzór:**
ST = Σ czas_ekran_on

**Źródła danych:**
- logi systemowe

**Dane wejściowe:**
- czas włączenia i wyłączenia ekranu

---

## 19. Unlock Frequency (UF)
**Wzór:**
UF = liczba odblokowań

**Źródła danych:**
- system OS

**Dane wejściowe:**
- liczba zdarzeń unlock

---

## 20. App Switching Rate (ASR)
**Wzór:**
ASR = liczba zmian aplikacji / czas

**Źródła danych:**
- logi aplikacji

**Dane wejściowe:**
- sekwencja aktywnych aplikacji

---

## 21. Night Usage Ratio (NUR)
**Wzór:**
NUR = usage_night / usage_total

**Źródła danych:**
- logi systemowe

**Dane wejściowe:**
- czas użycia w nocy vs całość

---

# VII. Fizjologia

## 22. Heart Rate Variability (HRV)
**Wzór:**
RMSSD = sqrt((1/N) Σ (RR_{i+1} - RR_i)^2)

**Źródła danych:**
- PPG (wearable)

**Dane wejściowe:**
- interwały RR

---

## 23. Electrodermal Activity (EDA)
**Wzór:**
EDA = średnia amplituda + liczba reakcji

**Źródła danych:**
- czujnik EDA

**Dane wejściowe:**
- sygnał przewodnictwa skóry

---

# VIII. Metadane systemowe

## 24. Charging Regularity Index (CRI_c)
**Wzór:**
CRI_c = regularność czasów ładowania

**Źródła danych:**
- system baterii

**Dane wejściowe:**
- timestampy rozpoczęcia i zakończenia ładowania

---

## 25. Battery Depletion Rate (BDR)
**Wzór:**
BDR = Δbateria / Δczas

**Źródła danych:**
- system baterii

**Dane wejściowe:**
- poziom baterii w czasie

---

## 26. Notification Response Time (NRT)
**Wzór:**
NRT = czas reakcji na powiadomienie

**Źródła danych:**
- system powiadomień

**Dane wejściowe:**
- timestamp powiadomienia
- timestamp interakcji

---

# IX. Wskaźniki złożone

## 27. Depressive Behavior Index (DBI)
**Wzór:**
DBI = w1/AVI + w2/LE + w3/SIF + w4/HRV

**Dane wejściowe:**
- AVI, LE, SIF, HRV

---

## 28. Mania Activation Index (MAI)
**Wzór:**
MAI = w1*AVI + w2*LE + w3*SIF + w4*ASR - w5*SD

**Dane wejściowe:**
- AVI, LE, SIF, ASR, SD

---

## 29. Affective Instability Index (AII)
**Wzór:**
AII = Σ Var(feature_i)

**Dane wejściowe:**
- wariancje wielu wskaźników w czasie

---

# X. Mapowanie wskaźników → zaburzenia (przegląd literatury)

Poniższe mapowania mają charakter probabilistyczny i opierają się na wynikach badań z zakresu digital phenotyping (m.in. Onnela, Torous, Saeb, Wang).

---

## 1. Depresja (Major Depressive Disorder)

**Najsilniejsze korelaty:**
- AVI ↓
- LE ↓
- HSR ↑
- SIF ↓
- RL ↑
- SD ↓ lub ↑ (hipersomnia)
- HRV ↓

**Interpretacja:**
- spowolnienie psychomotoryczne
- wycofanie społeczne
- ograniczona mobilność

**Literatura (przykładowa):**
- Saeb et al., 2015 (GPS mobility → depression)
- Wang et al., 2018 (student sensing study)

---

## 2. Epizod maniakalny (Bipolar Disorder – mania)

**Najsilniejsze korelaty:**
- AVI ↑
- LE ↑
- RoG ↑
- SIF ↑
- OR ↑
- ASR ↑
- SD ↓↓
- NUR ↑

**Interpretacja:**
- zwiększona aktywność i eksploracja
- nadaktywność społeczna
- zmniejszona potrzeba snu

**Literatura:**
- Faurholt-Jepsen et al., 2015 (smartphone data in bipolar disorder)
- Barnett et al., 2018 (passive sensing bipolar states)

---

## 3. Zaburzenia lękowe (Anxiety Disorders)

**Najsilniejsze korelaty:**
- IV ↑
- WASO ↑
- NPU ↑
- EDA ↑
- HRV ↓
- UF ↑ (częste sprawdzanie telefonu)

**Interpretacja:**
- hiperaktywacja fizjologiczna
- fragmentacja snu
- kompulsywne sprawdzanie

**Literatura:**
- Boukhechba et al., 2017 (sleep + anxiety)
- Sano et al., 2018 (physiology + stress)

---

## 4. Zaburzenia afektywne dwubiegunowe (niestabilność)

**Najsilniejsze korelaty:**
- AII ↑
- VI ↑
- CPF ↑
- zmienność: AVI, SIF, SD

**Interpretacja:**
- częste przejścia między stanami
- wysoka niestabilność behawioralna

**Literatura:**
- Grünerbl et al., 2015 (multimodal sensing bipolar)

---

## 5. Anhedonia / wycofanie społeczne

**Najsilniejsze korelaty:**
- ST ↓
- SIF ↓
- ACU (spadek aktywności społecznościowej)
- LE ↓

**Interpretacja:**
- obniżona motywacja
- ograniczenie interakcji

---

## 6. Zaburzenia snu

**Najsilniejsze korelaty:**
- SD ↓ lub ↑
- SOL ↑
- WASO ↑
- NUR ↑

**Interpretacja:**
- bezsenność lub hipersomnia
- nieregularny rytm snu

---

## 7. Przewlekły stres

**Najsilniejsze korelaty:**
- HRV ↓
- EDA ↑
- NPU ↑
- IV ↑

**Interpretacja:**
- przewlekła aktywacja układu współczulnego

**Literatura:**
- Sano et al., 2018

---

# Uwagi końcowe
- Wszystkie wskaźniki wymagają normalizacji względem indywidualnego baseline.
- Dane powinny być agregowane w spójnych oknach czasowych (np. 5 min, 1h, 24h).
- Interpretacja ma charakter probabilistyczny i wymaga modeli wielowymiarowych.

