# Sprzęt NPU firmy Mobilint: Architektura, produkty i zastosowania w erze inteligencji brzegowej

## Abstrakt

Rosnące zapotrzebowanie na przetwarzanie sztucznej inteligencji w środowiskach o ograniczonych zasobach energetycznych i termicznych wymusza zasadniczą zmianę paradygmatu projektowania akceleratorów sprzętowych. Firma Mobilint Inc. – południowokoreański producent układów scalonych typu *fabless* – odpowiada na to wyzwanie, opracowując rodzinę procesorów neuronowych (Neural Processing Unit, NPU) opartych na architekturze ASIC, zoptymalizowanych pod kątem wnioskowania głębokich sieci neuronowych na brzegu sieci. Niniejszy artykuł przedstawia kompleksową analizę rozwiązań sprzętowych Mobilint, obejmującą architekturę, kluczowe parametry techniczne, ekosystem programistyczny oraz praktyczne wdrożenia w obszarach robotyki, inteligentnych miast, opieki zdrowotnej i technologii kosmicznych.

## 1. Wprowadzenie

Dynamiczny rozwój algorytmów uczenia głębokiego, a w szczególności modeli transformerowych oraz wielomodalnych systemów AI, stawia przed sprzętem obliczeniowym nowe wymagania dotyczące wydajności, energooszczędności i skalowalności. Tradycyjne procesory graficzne (GPU), mimo wysokiej mocy obliczeniowej, charakteryzują się znacznym poborem energii oraz generacją ciepła, co ogranicza ich zastosowanie w systemach wbudowanych i urządzeniach brzegowych.

Mobilint, założony w 2019 roku w Korei Południowej, skoncentrował swoje działania badawczo-rozwojowe na projektowaniu architektur NPU zoptymalizowanych specjalnie do wnioskowania sieci neuronowych. Firma przyjęła strategię pełnej integracji pionowej – od projektowania krzemowego rdzenia NPU, poprzez autorski zestaw narzędzi programistycznych (SDK), aż po gotowe moduły akceleracyjne i kompletne komputery brzegowe. Efektem tych prac są dwa flagowe procesory: ARIES – wysokowydajny akcelerator przeznaczony do zastosowań serwerowych i brzegowych o dużym zapotrzebowaniu obliczeniowym, oraz REGULUS – ultrakompaktowy system-on-chip (SoC) dedykowany urządzeniom zasilanym bateryjnie i systemom o ścisłych ograniczeniach termicznych.

## 2. Profil korporacyjny i pozycja rynkowa

Mobilint Inc. pozycjonuje się jako pionier w dziedzinie półprzewodników AI w Korei Południowej. Kluczowym wyróżnikiem firmy jest pełna kontrola nad stosem technologicznym – zarówno nad architekturą NPU, jak i nad autorskim SDK o nazwie **qb**. Synergia między sprzętem a oprogramowaniem umożliwia, według deklaracji producenta, osiągnięcie do 80% niższego zużycia energii w porównaniu z konwencjonalnymi układami GPU przy zachowaniu wysokiej wydajności obliczeniowej.

Historia firmy obfituje w istotne kamienie milowe. W 2020 roku, zaledwie rok po założeniu, Mobilint osiągnął czołowe wyniki w globalnym benchmarku AI MLPerf, co zaowocowało przyjęciem firmy do grona członków założycielskich MLPerf. W 2022 roku zaprezentowano układ ARIES, stanowiący fundament linii produktów edge AI. Rok 2024 przyniósł ogłoszenie układu REGULUS SoC oraz otwarcie biura w Stanach Zjednoczonych, natomiast w 2025 roku REGULUS zdobył nagrodę CES Innovation Award w kategorii sztucznej inteligencji. W 2026 roku Mobilint zaprezentował wyniki swoich badań na prestiżowej konferencji International Solid-State Circuits Conference (ISSCC), nazywanej często „Olimpiadą Półprzewodników”.

## 3. Architektura NPU Mobilint

### 3.1. Filozofia projektowania

Architektura NPU opracowana przez Mobilint opiera się na podejściu *hardware-software co-design*, czyli współprojektowaniu sprzętu i oprogramowania. Firma deklaruje zastosowanie mieszanej precyzji obliczeń (*mixed-precision computation*) oraz optymalizacji efektywności pamięciowej, co przekłada się na stabilną wydajność i sprawność energetyczną w szerokim spektrum modeli AI.

Kluczowe założenia architektoniczne obejmują:

- **Architekturę ASIC zoptymalizowaną pod algorytmy uczenia głębokiego** – układ zaprojektowano od podstaw jako akcelerator dedykowany, a nie jako modyfikację istniejących architektur GPU czy CPU.
- **Wsparcie dla różnorodnych architektur sieci neuronowych** – od konwolucyjnych (CNN) i rekurencyjnych (RNN/LSTM), po modele oparte na mechanizmie uwagi (transformery), w tym duże modele językowe (LLM) i wielomodalne (VLM).
- **Wielordzeniową strukturę** – układ ARIES zawiera osiem rdzeni obliczeniowych, co umożliwia równoległe wykonywanie zadań AI.
- **Skalowalność platformy** – architektura umożliwia skalowanie od urządzeń wbudowanych (*on-device*) po infrastrukturę lokalną (*on-premises*).

### 3.2. Optymalizacja pamięci i ponowne wykorzystanie danych

Istotnym elementem architektury Mobilint jest maksymalizacja ponownego wykorzystania danych oraz minimalizacja dostępu do pamięci zewnętrznej, co znacząco redukuje zużycie energii. Rozwiązanie to wpisuje się w szerszy trend projektowania energooszczędnych akceleratorów AI, w których koszt energetyczny transferu danych przewyższa często koszt samych operacji arytmetycznych.

## 4. Produkty sprzętowe

Portfolio produktów Mobilint obejmuje trzy główne linie: układy scalone ARIES i REGULUS, karty akceleracyjne MLA100 oraz moduły MXM i kompletne komputery brzegowe MLX-A1.

### 4.1. ARIES – flagowy akcelerator AI

ARIES jest wysokowydajnym akceleratorem AI zaprojektowanym do zastosowań serwerowych oraz wymagających aplikacji brzegowych. Układ osiąga wydajność **80 TOPS** (Tera Operations Per Second) przy poborze mocy wynoszącym zaledwie **20–25 W**, co przekłada się na wyjątkową efektywność energetyczną.

**Kluczowe parametry techniczne układu ARIES:**
- Wydajność obliczeniowa: 80 TOPS
- Pojemność pamięci: 16 GB LPDDR4X (opcjonalnie 32 GB)
- Przepustowość pamięci: 66,7 GB/s
- Interfejs hosta: PCI Express Gen4 ×8 linii
- TDP: 25 W
- Liczba rdzeni NPU: 8
- Obsługa do 32 modeli głębokiego uczenia współbieżnie

Układ ARIES przeszedł walidację na ponad **400 modelach głębokiego uczenia**, obejmujących architektury CNN, RNN i transformerowe. W testach wydajnościowych uzyskano następujące wyniki dla popularnych modeli:

- **MobileNetV2**: 11 551 FPS
- **ResNet-50**: 3 082 FPS
- **YOLO-11s**: 784 FPS
- **YOLO-11l**: 259 FPS
- **EXAONE-4.0-1.2B** (LLM): 31,62 TPS/użytkownika
- **Llama-3.2-3B** (LLM): 12,16 TPS/użytkownika

### 4.2. REGULUS – ultraniskonapięciowy SoC dla urządzeń brzegowych

REGULUS reprezentuje przeciwny biegun spektrum produktowego – jest to system-on-chip zoptymalizowany do ekstremalnie niskiego poboru mocy, integrujący w jednym układzie procesor CPU, NPU, procesor sygnału obrazu (ISP) oraz kodek audio-wideo.

**Kluczowe parametry układu REGULUS:**
- Wydajność obliczeniowa NPU: 10 TOPS
- Pobór mocy: **3 W**
- Wymiary: 17 mm × 17 mm
- Zintegrowane komponenty: CPU, NPU, ISP, kodek
- Interfejsy: MIPI CSI/DSI, USB, Ethernet, audio codecs

Układ REGULUS został zoptymalizowany przede wszystkim do obciążeń związanych z widzeniem komputerowym, obsługując modele takie jak YOLO v8/v9 i MobileNet z minimalnym opóźnieniem. Producent zwalidował go z ponad **300 modelami**, a deweloperzy mogą wdrażać własne sieci wytrenowane w frameworkach PyTorch, TensorFlow lub ONNX.

Układ zdobył nagrodę **CES 2025 Innovation Award** w kategorii sztucznej inteligencji, a jego konstrukcja umożliwia pracę bez aktywnego chłodzenia (*fanless*).

### 4.3. MLA100 – karta akceleracyjna PCIe

MLA100 jest kartą akceleracyjną w formacie PCIe, opartą na układzie ARIES (określanym również jako Eris). Karta zapewnia wydajność **80 TOPS** przy poborze mocy **25 W**, oferując według producenta **3,3-krotnie wyższą wydajność obliczeniową AI** w porównaniu z istniejącymi rozwiązaniami GPU, przy jednoczesnym dziesięciokrotnym obniżeniu zużycia energii.

MLA100 charakteryzuje się wysoką wszechstronnością – działa w środowiskach Linux i Windows, obsługuje ponad 300 modeli głębokiego uczenia oraz większość popularnych frameworków uczenia maszynowego. Karta znajduje zastosowanie w serwerach AI, systemach czatbotów, inteligentnych fabrykach, inteligentnych miastach, opiece zdrowotnej oraz robotyce.

### 4.4. MLA100 MXM – moduł dla wbudowanych systemów AI

MLA100 MXM jest modułem NPU w standardzie Mobile PCI Express Module (MXM), zaprojektowanym z myślą o wytrzymałych systemach wbudowanych i urządzeniach AI typu *on-device*. Moduł dostarcza wydajność **80 TOPS** w obwiedni termicznej **25 W**, co umożliwia zaawansowane obliczenia AI w robotyce, automatyce przemysłowej i innych zastosowaniach, gdzie kluczowe są ograniczenia przestrzenne, energetyczne i termiczne.

Standard MXM zapewnia łatwą integrację z istniejącymi platformami wbudowanymi, a sam moduł został zaprojektowany z myślą o aplikacjach krytycznych, wymagających wysokiej niezawodności i odporności na trudne warunki środowiskowe.

### 4.5. MLX-A1 – kompletny komputer brzegowy

MLX-A1 jest w pełni zintegrowanym komputerem brzegowym, łączącym procesor Intel Core i5-13600HE z akceleratorem ARIES NPU. Urządzenie działa pod kontrolą systemu Ubuntu Linux z preinstalowanym SDK, umożliwiając szybkie wdrożenie aplikacji AI bez konieczności budowania złożonej infrastruktury. MLX-A1 zdobył nagrodę **CES 2026 Innovation Award** w kategorii AI, co stanowi drugie z rzędu wyróżnienie firmy na targach CES.

## 5. Ekosystem programistyczny – SDK qb

Kluczowym elementem strategii produktowej Mobilint jest autorski zestaw narzędzi programistycznych **SDK qb**, zaprojektowany w celu uproszczenia procesu wdrażania modeli AI na sprzęcie NPU firmy.

### 5.1. Architektura SDK

SDK qb obejmuje następujące komponenty:

- **Kompilator modeli** – zarządza kwantyzacją, optymalizacją i konwersją binarną do formatu natywnego dla układów Mobilint, umożliwiając bezpośrednie wdrożenie modeli bez modyfikacji istniejących potoków przetwarzania.
- **Stos oprogramowania zoptymalizowany pod architekturę NPU** – zapewnia niskopoziomowe sterowanie sprzętem i efektywne wykorzystanie zasobów.
- **Narzędzia deweloperskie** – ułatwiają integrację, debugowanie i optymalizację wydajnościową.

### 5.2. Zgodność z frameworkami

SDK qb wspiera główne frameworki uczenia maszynowego: TensorFlow, PyTorch oraz ONNX, co umożliwia deweloperom wykorzystanie istniejących modeli bez konieczności ich przepisywania. Kompilator stosuje autorskie techniki optymalizacji, które zachowują dokładność oryginalnego modelu przy jednoczesnym dostosowaniu go do specyfiki architektury NPU. Według producenta, SDK qb umożliwia wdrożenie ponad **400 modeli AI** bez konieczności złożonego dostrajania.

### 5.3. Otwarte repozytoria i ekosystem demonstracyjny

W 2026 roku Mobilint udostępnił publicznie zestaw repozytoriów demonstracyjnych dla sprzętu opartego na układzie ARIES, dostępnych na platformie GitHub. Repozytoria te dostarczają funkcjonalnych szablonów integracji NPU, obejmujących zarządzanie numerami urządzeń NPU, trybami rdzeni oraz przydziałem zasobów obliczeniowych.

## 6. Benchmarki i walidacja wydajności

Mobilint kładzie silny nacisk na niezależną walidację wydajności swoich układów. Firma już w 2020 roku osiągnęła czołowe wyniki w Korei Południowej w benchmarku **MLPerf** – uznawanym za globalny standard pomiaru wydajności sprzętu AI. Sukces ten zaowocował przyjęciem Mobilint do grona członków założycielskich MLPerf.

Niezależne testy porównawcze karty MLA100 wykazały **3,3-krotnie wyższą wydajność obliczeniową AI** w porównaniu z istniejącymi rozwiązaniami GPU, przy jednoczesnym zmniejszeniu zużycia energii do jednej dziesiątej poziomu referencyjnego. Producent podkreśla, że rzeczywista efektywna wydajność przewyższa parametry nominalne produktów konkurencyjnych w praktycznych scenariuszach użycia.

W 2026 roku Mobilint zaprezentował na konferencji ISSCC wyniki badań potwierdzające skuteczność przyjętej architektury w obsłudze obciążeń wielomodalnych, łączących modele wizyjne z dużymi modelami językowymi.

## 7. Zastosowania i wdrożenia praktyczne

Rozwiązania sprzętowe Mobilint znajdują zastosowanie w szerokim spektrum branż, ze szczególnym uwzględnieniem scenariuszy wymagających przetwarzania AI na brzegu sieci.

### 7.1. Inteligentne miasta i transport

Technologia Mobilint została wdrożona w rzeczywistych projektach w Korei Południowej, takich jak automatyczna linia detekcji usterek Hyvision oraz inteligentne systemy monitorowania ruchu w miastach Anyang i Seongnam, przyczyniając się do poprawy efektywności zarządzania i eksploatacji infrastruktury miejskiej.

### 7.2. Robotyka i automatyka przemysłowa

Moduły MLA100 MXM są projektowane z myślą o systemach robotyki i automatyki przemysłowej, gdzie kluczowe znaczenie mają ograniczenia przestrzenne, energetyczne i termiczne. Współpraca z Lotte Innovate koncentruje się na wdrożeniu technologii NPU w obszarze *physical AI* (AI fizycznej), w tym w robotach humanoidalnych. Rozwiązania oparte na NPU zostaną wdrożone w zakładach produkcyjnych, centrach dystrybucyjnych i logistycznych w ramach grupy Lotte w celu walidacji wydajności i efektywności operacyjnej.

### 7.3. Opieka zdrowotna i urządzenia medyczne

Ultraniska konsumpcja energii układu REGULUS (3 W przy 10 TOPS) czyni go idealnym kandydatem do zastosowań w przenośnych urządzeniach medycznych, gdzie ograniczenia bateryjne i termiczne są krytyczne. Redukcja opóźnień związana z przetwarzaniem lokalnym ma szczególne znaczenie w aplikacjach medycznych wymagających szybkiej reakcji.

### 7.4. Technologie kosmiczne

W 2026 roku Mobilint podpisał memorandum o porozumieniu ze Spacelintech – firmą specjalizującą się w medycynie kosmicznej – w celu wspólnego opracowania ładunków kosmicznych AI z wykorzystaniem procesorów NPU Mobilint. Współpraca koncentruje się na optymalizacji wysokowydajnych, niskonapięciowych rozwiązań półprzewodnikowych AI, zdolnych do niezawodnego działania w ekstremalnych warunkach kosmicznych, gdzie ograniczenia dotyczące mocy, odprowadzania ciepła i komunikacji są szczególnie restrykcyjne.

### 7.5. Inteligentne fabryki i centra danych brzegowych

Karta MLA100 oraz moduły ARIES znajdują zastosowanie w brzegowych centrach danych, inteligentnych fabrykach i systemach transportowych, gdzie wymagane jest przetwarzanie obrazu i danych w czasie rzeczywistym. Współpraca z Aetina (spółką zależną Innodisk) ma na celu integrację akceleratorów Mobilint z platformami edge AI, co przyspieszy komercjalizację rozwiązań brzegowych w skali globalnej.

## 8. Współpraca strategiczna i rozwój rynku

Mobilint aktywnie buduje ekosystem partnerstw strategicznych w celu przyspieszenia adopcji swojej technologii. Kluczowe alianse obejmują:

- **Aetina (Innodisk)** – integracja akceleratorów ASIC i technologii NPU Mobilint z platformami edge AI Aetina, mająca na celu przyspieszenie globalnej komercjalizacji rozwiązań brzegowych.
- **Lotte Innovate** – współpraca w zakresie walidacji i doskonalenia technologii NPU w domenie AI fizycznej, z wdrożeniami w obiektach produkcyjnych, handlowych i logistycznych.
- **Spacelintech** – wspólny rozwój ładunków kosmicznych AI, wykorzystujących niskonapięciowe procesory NPU zoptymalizowane do warunków kosmicznych.

Strategia partnerstw Mobilint koncentruje się na wertykalnych zastosowaniach przemysłowych, gdzie unikalne połączenie wysokiej wydajności i niskiego poboru mocy oferuje wymierną przewagę konkurencyjną nad rozwiązaniami opartymi na GPU.

## 9. Podsumowanie i perspektywy

Mobilint reprezentuje nową generację firm półprzewodnikowych, które redefiniują paradygmat projektowania akceleratorów AI poprzez głęboką integrację architektury sprzętowej z warstwą oprogramowania. Rodzina procesorów NPU – od wysokowydajnego ARIES (80 TOPS/25 W) po ultrakompaktowy REGULUS (10 TOPS/3 W) – obejmuje pełne spektrum zastosowań od serwerów lokalnych po urządzenia zasilane bateryjnie.

Kluczowe wyróżniki technologiczne obejmują: (1) architekturę ASIC zoptymalizowaną pod algorytmy głębokiego uczenia, (2) sprzętowo-programowe współprojektowanie umożliwiające efektywną obsługę modeli wielomodalnych, (3) zaawansowane techniki optymalizacji pamięciowej minimalizujące zużycie energii, oraz (4) kompletny ekosystem programistyczny SDK qb upraszczający wdrażanie modeli AI.

Nagrody CES Innovation Award (2025 dla REGULUS, 2026 dla MLX-A1) oraz prezentacja na prestiżowej konferencji ISSCC 2026 potwierdzają uznanie środowiska akademickiego i przemysłowego dla rozwiązań Mobilint. Współpraca z liderami branżowymi, takimi jak Aetina, Lotte Innovate i Spacelintech, wskazuje na rosnącą adopcję technologii w wymagających domenach aplikacyjnych.

W perspektywie średnioterminowej Mobilint planuje rozszerzenie wsparcia dla modeli transformerowych i dużych modeli językowych (LLM), co umożliwi realizację zaawansowanych zadań przetwarzania języka naturalnego i rozumowania wielomodalnego bezpośrednio na urządzeniach brzegowych. W miarę jak miliardy urządzeń będą wyposażane w funkcje AI, niskonapięciowe procesory NPU, takie jak układy Mobilint, stanowią skalowalną i energooszczędną alternatywę dla tradycyjnych architektur obliczeniowych.

## Bibliografia

1. Mobilint. (2025). *ARIES – Ultra Performance AI Accelerator for On-Premises AI*. https://www.mobilint.com/aries 
2. Mobilint. (2025). *MLA100 MXM Product Announcement*. Journal of Cyber Policy. https://journalofcyberpolicy.com/mobilint-introduces-mla100-mxm/ 
3. Chosun Biz. (2025). *Mobilint launches MLA100 NPU card for optimized deep learning operations*. https://biz.chosun.com/en/en-it/2025/02/25/MSFSY3X2RVGA3JIZVWHFUOQQ2U/ 
4. Electronics For You. (2025). *Low-Power NPU Brings AI To The Edge*. https://www.electronicsforu.com/news/low-power-npu-brings-ai-to-the-edge 
5. ipXchange. (2025). *Mobilint Regulus NPU: 10 TOPs at 3 Watts for Edge AI*. https://ipxchange.tech/evaluation-boards/mobilint-regulus-board-page/ 
6. Vietnam.vn. (2025). *Mobilint - Korean company pioneers in developing AI chips for the digital age*. https://www.vietnam.vn/en/mobilint-doanh-nghiep-han-quoc-tien-phong-phat-trien-chip-ai-cho-ky-nguyen-so 
7. Chosun. (2026). *Mobilint Unveils AI Chips at ISSCC 'Semiconductor Olympics'*. https://www.chosun.com/english/industry-en/2026/02/19/MF4FJU6WXVHOVND4D7OEF4UOTQ/ 
8. Chosun. (2026). *Lotte Innovate, Mobilint Collaborate on NPU for Physical AI*. https://www.chosun.com/english/industry-en/2026/04/07/7VOX2EIZZFBB3MGMVVURYMNJAM/ 
9. Edge Industry Review. (2025). *Aetina and Mobilint join forces to advance low-power edge AI systems*. https://www.edgeir.com/aetina-and-mobilint-join-forces/ 
10. Digital Today. (2026). *Mobilint, Spacelintek cooperate on AI chip development for space*. https://www.digitaltoday.co.kr/ 
11. Chosun Biz. (2024). *Mobilint wins CES 2025 Innovation Award for AI semiconductor Regulus*. https://biz.chosun.com/ 
12. Digitimes. (2026). *Mobilint Brings Award-Winning Edge AI Hardware to CES 2026*. https://apps.digitimes.com/ 
13. MLCommons. (2020–2024). *MLPerf Inference Benchmark Results*. https://mlcommons.org/ 
14. Mobilint. (2026). *Now in Public: Mobilint ARIES Demo Ecosystem and Boilerplate Repositories*. https://www.mobilint.com/ 