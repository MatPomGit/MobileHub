# Programowanie urządzeń brzegowych dla potrzeb uczenia maszynowego i sztucznej inteligencji: Architektura, metodyki i wyzwania wdrożeniowe

## Abstrakt

Dynamiczny rozwój algorytmów sztucznej inteligencji, w szczególności głębokich sieci neuronowych i dużych modeli językowych, stwarza nowe wymagania wobec infrastruktury obliczeniowej. Tradycyjny paradygmat przetwarzania w chmurze – mimo swojej skalowalności – napotyka na fundamentalne ograniczenia w postaci opóźnień sieciowych, wysokich kosztów transmisji danych oraz ryzyka związanego z prywatnością i bezpieczeństwem informacji. W odpowiedzi na te wyzwania wyłoniła się koncepcja Edge AI, zakładająca przeniesienie operacji wnioskowania modeli uczenia maszynowego bezpośrednio na urządzenia brzegowe. Niniejszy artykuł przedstawia kompleksową analizę zasad programowania w środowisku Edge AI, obejmującą architekturę systemów, techniki optymalizacji modeli pod kątem ograniczonych zasobów, ekosystem dostępnych frameworków programistycznych oraz kluczowe wyzwania związane z wdrażaniem i zarządzaniem cyklem życia aplikacji w środowiskach rozproszonych.

## 1. Wprowadzenie

Współczesne systemy cyberfizyczne, Internet Rzeczy (IoT) oraz Przemysłowy Internet Rzeczy (IIoT) generują bezprecedensowe ilości danych. Według szacunków, pojedynczy połączony pojazd wytwarza około 25 gigabajtów danych na godzinę, natomiast inteligentna fabryka może produkować pięć petabajtów danych tygodniowo. Przetwarzanie takiej ilości informacji w scentralizowanych centrach danych staje się nie tylko nieefektywne energetycznie, lecz również niepraktyczne w kontekście aplikacji wymagających reakcji w czasie rzeczywistym.

Edge AI – definiowana jako paradygmat wykonywania algorytmów sztucznej inteligencji i modeli językowych bezpośrednio na sprzęcie znajdującym się w pobliżu źródła generowania danych, bez konieczności odwoływania się do zasobów chmurowych dla operacji wnioskowania – oferuje rozwiązanie tych problemów. W przeciwieństwie do tradycyjnego podejścia chmurowego, Edge AI umożliwia redukcję opóźnień, optymalizację wykorzystania pasma sieciowego, zwiększenie prywatności danych oraz zapewnienie ciągłości działania w warunkach ograniczonej łączności.

Programowanie na potrzeby Edge AI wymaga jednak zasadniczo odmiennego podejścia niż tworzenie aplikacji dla środowisk chmurowych. Ograniczenia w zakresie mocy obliczeniowej, pamięci, budżetu energetycznego oraz heterogeniczność platform sprzętowych wymuszają przyjęcie specyficznych metodyk projektowania, optymalizacji i wdrażania modeli uczenia maszynowego. Celem niniejszego artykułu jest systematyczne przedstawienie tych zasad, ze szczególnym uwzględnieniem aktualnego stanu wiedzy na rok 2026.

## 2. Podstawy teoretyczne i architektura systemów Edge AI

### 2.1. Definicja i kluczowe paradygmaty

Edge AI stanowi interdyscyplinarną dziedzinę łączącą elementy systemów wbudowanych, obliczeń brzegowych oraz uczenia maszynowego. Jej istotą jest przetwarzanie obciążeń AI w bezpośredniej bliskości źródła danych, przy jednoczesnej minimalizacji zależności od scentralizowanej infrastruktury chmurowej. W przeciwieństwie do Cloud AI, gdzie modele są trenowane i uruchamiane w centrach danych o praktycznie nieograniczonych zasobach, Edge AI operuje w środowisku charakteryzującym się istotnymi restrykcjami sprzętowymi.

Kluczowe cechy odróżniające Edge AI od Cloud AI obejmują: ultra-niskie opóźnienia umożliwiające podejmowanie decyzji w czasie rzeczywistym, zoptymalizowane wykorzystanie pasma sieciowego dzięki przetwarzaniu lokalnemu, zwiększoną prywatność i bezpieczeństwo wynikającą z pozostawienia wrażliwych danych na urządzeniu, możliwość działania w trybie offline oraz niższe koszty operacyjne związane z wnioskowaniem.

### 2.2. Architektura warstwowa Edge AI

Współczesne podejście do projektowania systemów Edge AI opiera się na warstwowym modelu architektonicznym, który umożliwia systematyczne adresowanie złożoności wdrożeniowej. W literaturze przedmiotu proponowany jest referencyjny model obejmujący trzy nowatorskie warstwy: optymalizację infrastruktury brzegowej, wnioskowanie brzegowe oraz trenowanie brzegowe. Model ten zapewnia ramy koncepcyjne dla skutecznego wdrażania paradygmatu inteligencji brzegowej.

Na poziomie infrastrukturalnym kluczowe znaczenie ma heterogeniczność sprzętowa. Urządzenia brzegowe mogą obejmować szerokie spektrum platform: od mikrokontrolerów ARM Cortex-M z pamięcią RAM poniżej 256 KB, poprzez wydajne procesory aplikacyjne (i.MX, Jetson Nano), aż po specjalizowane akceleratory AI w postaci układów FPGA, ASIC i NPU (Neural Processing Unit). Ta różnorodność wymusza przyjęcie strategii programistycznych umożliwiających przenoszalność kodu i modeli między platformami.

### 2.3. Model programowania: od trenowania do wnioskowania

W środowisku Edge AI przyjmuje się wyraźny podział odpowiedzialności: trenowanie modeli – jako operacja wysoce zasobochłonna – odbywa się zazwyczaj w chmurze lub na wydajnych stacjach roboczych, natomiast wnioskowanie (inferencja) realizowane jest lokalnie na urządzeniu brzegowym. Podejście to wykorzystuje fakt, że algorytmy wnioskowania wymagają znacząco mniejszych zasobów obliczeniowych i energetycznych niż algorytmy trenowania.

Cykl życia modelu w Edge AI obejmuje następujące etapy:

1. **Pozyskanie i przygotowanie danych** na urządzeniu brzegowym lub w środowisku symulowanym.
2. **Trenowanie modelu** w środowisku o dużej mocy obliczeniowej (chmura, stacja robocza).
3. **Optymalizacja i kompresja** modelu pod kątem ograniczeń platformy docelowej.
4. **Konwersja** do formatu natywnego dla wybranego frameworka wnioskowania.
5. **Wdrożenie** na urządzeniu brzegowym z wykorzystaniem odpowiedniego stosu oprogramowania.
6. **Monitorowanie i aktualizacja** modelu w warunkach produkcyjnych.

## 3. Techniki optymalizacji modeli dla środowisk brzegowych

Optymalizacja modeli uczenia maszynowego pod kątem wdrożenia na urządzeniach brzegowych stanowi kluczowy element procesu programistycznego. Ograniczenia w zakresie pamięci, mocy obliczeniowej i budżetu energetycznego wymagają zastosowania zaawansowanych technik kompresji i akceleracji.

### 3.1. Kwantyzacja (Quantization)

Kwantyzacja polega na redukcji precyzji numerycznej wag i aktywacji modelu. Typowe podejścia obejmują konwersję z 32-bitowych liczb zmiennoprzecinkowych (FP32) do 16-bitowych (FP16) lub 8-bitowych liczb całkowitych (INT8). Przejście z FP32 na INT8 umożliwia około czterokrotną redukcję rozmiaru modelu, a obliczenia niskobitowe mogą być wykonywane szybciej przy odpowiednim wsparciu sprzętowym, np. z wykorzystaniem akceleratorów GPU lub NPU.

W praktyce wyróżnia się dwa główne warianty kwantyzacji:

- **Kwantyzacja post-treningowa (Post-Training Quantization, PTQ)** – stosowana po zakończeniu trenowania, bez konieczności modyfikacji procesu uczenia. Jest prostsza w implementacji, lecz może prowadzić do pewnej utraty dokładności.
- **Kwantyzacja świadoma trenowania (Quantization-Aware Training, QAT)** – integruje symulację kwantyzacji w procesie trenowania, umożliwiając modelowi adaptację do zredukowanej precyzji i zachowanie wyższej dokładności.

### 3.2. Przycinanie (Pruning)

Przycinanie polega na eliminacji mniej istotnych neuronów lub połączeń w sieci neuronowej, co prowadzi do redukcji liczby parametrów i operacji obliczeniowych. Technika ta może usunąć do 30% najmniej ważnych filtrów, znacząco redukując rozmiar modelu. Przycinanie może być stosowane w sposób nieustrukturyzowany (usuwanie pojedynczych wag) lub ustrukturyzowany (usuwanie całych kanałów lub warstw).

### 3.3. Destylacja wiedzy (Knowledge Distillation)

Destylacja wiedzy polega na trenowaniu mniejszego modelu („ucznia”) w taki sposób, aby naśladował on zachowanie większego, bardziej złożonego modelu („nauczyciela”). Podejście to umożliwia uzyskanie kompaktowych modeli zachowujących wysoką dokładność predykcji, przy jednoczesnym spełnieniu restrykcyjnych ograniczeń zasobowych urządzeń brzegowych.

### 3.4. Dekompozycja tensorowa i fuzja operatorów

Zaawansowane techniki optymalizacyjne obejmują również dekompozycję tensorową (rozkład dużych tensorów na mniejsze komponenty) oraz fuzję operatorów (łączenie sąsiadujących warstw w celu redukcji narzutu obliczeniowego i pamięciowego). Metody te, stosowane łącznie z kwantyzacją i przycinaniem, umożliwiają osiągnięcie wielowymiarowych celów optymalizacyjnych: redukcji opóźnień, oszczędności pamięci oraz zwiększenia efektywności energetycznej.

### 3.5. Optymalizacja pod kątem przepustowości pamięci

Na urządzeniach brzegowych, szczególnie tych wykorzystujących architekturę pamięci współdzielonej (typowe dla nowoczesnych laptopów i systemów brzegowych), wnioskowanie jest często ograniczane przez przepustowość pamięci, a nie przez moc obliczeniową. Urządzenia brzegowe wykorzystują niskonapięciowe technologie pamięci, takie jak LPDDR lub SRAM, które nie oferują wysokoprzepustowych magistrali pamięci dostępnych w procesorach graficznych pracujących w chmurze. W konsekwencji, optymalizacja wzorców dostępu do pamięci oraz minimalizacja transferów danych stają się krytycznymi aspektami programowania Edge AI.

## 4. Ekosystem frameworków i narzędzi programistycznych

### 4.1. Klasyfikacja frameworków Edge AI

Dobór odpowiedniego frameworka programistycznego stanowi jedną z fundamentalnych decyzji w procesie tworzenia aplikacji Edge AI. Frameworki te można sklasyfikować według poziomu abstrakcji i docelowej platformy sprzętowej:

**Frameworki dla mikrokontrolerów i systemów ultraniskomocowych (TinyML):**

- **TensorFlow Lite for Microcontrollers (TFLM)** – lekka wersja TensorFlow Lite zoptymalizowana dla mikrokontrolerów ARM Cortex-M, oferująca wsparcie dla podstawowych operacji sieci neuronowych.
- **Edge Impulse** – wiodąca platforma end-to-end dla operacji ML na brzegu sieci, zoptymalizowana pod kątem TinyML i umożliwiająca uruchamianie obciążeń wnioskowania na ograniczonych zasobowo urządzeniach z minimalnym zużyciem energii.
- **CMSIS-NN** – biblioteka firmy ARM zapewniająca wydajne implementacje funkcji sieci neuronowych dla rdzeni Cortex-M.

**Frameworki dla wydajniejszych platform brzegowych:**

- **TensorFlow Lite** – uniwersalny framework Google do uruchamiania modeli na urządzeniach brzegowych, oferujący szeroki ekosystem narzędzi do konwersji i optymalizacji modeli.
- **ONNX Runtime** – środowisko uruchomieniowe dla modeli w formacie ONNX, zapewniające przenoszalność między różnymi frameworkami trenowania i platformami sprzętowymi.
- **OpenVINO** – zestaw narzędzi firmy Intel do optymalizacji i wdrażania modeli na procesorach Intel, oferujący architekturę wtyczkową umożliwiającą jednokrotne napisanie kodu i wdrożenie na wielu platformach.
- **Apache TVM** – kompilator głębokiego uczenia umożliwiający optymalizację modeli pod kątem specyficznych architektur sprzętowych, z możliwością automatycznego dostrajania parametrów.

### 4.2. Zintegrowane środowiska programistyczne

W odpowiedzi na rosnącą złożoność ekosystemu Edge AI, wiodący dostawcy technologii oferują zintegrowane platformy programistyczne upraszczające proces tworzenia i wdrażania aplikacji. Przykładem jest **Microsoft Foundry Local**, stanowiący kolejną generację narzędzi do tworzenia, wdrażania i skalowania aplikacji AI w środowisku lokalnym, przy zachowaniu płynnej integracji z usługami chmurowymi.

### 4.3. Kryteria wyboru frameworka

Przy wyborze frameworka do realizacji projektu Edge AI należy uwzględnić następujące czynniki:

- **Rozmiar i ślad pamięciowy modelu** – bezpośrednio wpływające na wydajność, żywotność baterii i czas odpowiedzi systemu.
- **Kompatybilność sprzętowa** – wsparcie dla docelowych mikrokontrolerów, NPU, DSP lub innych akceleratorów.
- **Potok trenowania** – integracja z istniejącymi workflow i kompetencjami zespołu.
- **Workflow wdrożeniowy** – możliwość automatyzacji wdrażania (CI/CD), aktualizacji OTA (Over-The-Air) oraz monitorowania modeli w terenie.

## 5. Wyzwania wdrożeniowe i strategie ich przezwyciężania

### 5.1. Heterogeniczność sprzętowa

Jednym z najpoważniejszych wyzwań w programowaniu Edge AI jest konieczność obsługi heterogenicznych platform sprzętowych. Wdrożenia Edge AI rzadko wykorzystują identyczny sprzęt – niektóre lokalizacje dysponują procesorami graficznymi, inne wyłącznie procesorami CPU, a jeszcze inne specjalizowanymi akceleratorami. Ta różnorodność wymaga przyjęcia strategii abstrakcji sprzętowej, umożliwiających jednolite API niezależnie od leżącej u podstaw platformy.

### 5.2. Ograniczenia łączności i zarządzanie w terenie

W przeciwieństwie do środowisk chmurowych, gdzie łączność sieciowa jest stabilna i wysokoprzepustowa, urządzenia brzegowe często operują w warunkach łączności przerywanej. Niektóre lokalizacje łączą się z siecią zaledwie kilka razy dziennie, inne funkcjonują w środowiskach o ściśle kontrolowanej przepustowości. W konsekwencji, mechanizmy aktualizacji modeli i oprogramowania muszą być odporne na przerwy w łączności i zdolne do działania w trybie offline.

### 5.3. Orkiestracja Edge AI

Orkiestracja Edge AI stanowi odpowiedź na wyzwania związane z wdrażaniem i zarządzaniem aplikacjami AI w rozproszonych środowiskach brzegowych. Jej celem jest zapewnienie przewidywalności procesów wdrożeniowych, zarządzania cyklem życia oraz obserwowalności obciążeń AI w terenie. Orkiestracja wprowadza logikę wdrożeniową uwzględniającą fizyczne i sieciowe realia systemów rozproszonych, co kontrastuje z tradycyjnymi potokami MLOps zakładającymi stabilne łącza i homogeniczne środowiska.

Szacuje się, że mniej niż jedna trzecia organizacji deklaruje pełne wdrożenie Edge AI w środowisku produkcyjnym, co odzwierciedla skalę wyzwań operacyjnych wykraczających poza fazę proof-of-concept.

### 5.4. Architektury hybrydowe i kontinuum Edge-Cloud

Praktyczne wdrożenia Edge AI rzadko funkcjonują w całkowitej izolacji od chmury. Zamiast tego przyjmuje się architekturę hybrydową, w której urządzenia brzegowe wykonują wnioskowanie lokalnie, okresowo synchronizując się z chmurą w celu aktualizacji modeli, agregacji danych treningowych lub przekazywania zagregowanych wyników. Takie podejście – określane jako kontinuum Edge-Cloud – łączy zalety obu paradygmatów, umożliwiając ewolucyjne doskonalenie modeli przy zachowaniu niskich opóźnień operacyjnych.

### 5.5. Debugowanie i profilowanie

Debugowanie aplikacji Edge AI jest szczególnie wymagające ze względu na ograniczoną widoczność procesów zachodzących na urządzeniu. Nowoczesne narzędzia profilujące, umożliwiające wizualizację opóźnień poszczególnych warstw sieci oraz wykorzystania pamięci – analogicznie do funkcjonalności oferowanych przez Nsight czy TensorBoard dla środowisk chmurowych – stają się niezbędnym elementem warsztatu programisty Edge AI.

## 6. Bezpieczeństwo i prywatność w Edge AI

### 6.1. Ochrona danych w spoczynku i tranzycie

Przetwarzanie danych bezpośrednio na urządzeniu brzegowym znacząco redukuje powierzchnię ataku związaną z transmisją sieciową, jednak wprowadza nowe wektory zagrożeń związane z fizycznym dostępem do sprzętu. Kompleksowe podejście do bezpieczeństwa wymaga implementacji wielowarstwowych mechanizmów ochrony, obejmujących:

- **Szyfrowanie danych w spoczynku** z wykorzystaniem silnych algorytmów, takich jak AES-256.
- **Bezpieczną komunikację** między urządzeniami brzegowymi a infrastrukturą chmurową.
- **Bezpieczny rozruch (Secure Boot)** i podpisywanie oprogramowania układowego, zapobiegające uruchomieniu nieautoryzowanego kodu.
- **Kontrole integralności w czasie wykonywania**.

### 6.2. Federated Learning i prywatność rozproszona

Zaawansowane strategie ochrony prywatności w Edge AI obejmują wykorzystanie uczenia federacyjnego (Federated Learning), w którym modele są trenowane lokalnie na urządzeniach, a jedynie zagregowane aktualizacje gradientów – a nie surowe dane – są przesyłane do centralnego serwera. Podejście to, w połączeniu z architekturą Zero Trust (ZTA), umożliwia realizację zaawansowanych aplikacji AI przy zachowaniu zgodności z rygorystycznymi regulacjami dotyczącymi ochrony danych osobowych.

### 6.3. Lekkie mechanizmy kryptograficzne

Ze względu na ograniczenia zasobowe urządzeń brzegowych, tradycyjne algorytmy kryptograficzne mogą być zbyt kosztowne obliczeniowo. W odpowiedzi na to wyzwanie rozwijane są lekkie metody szyfrowania oraz techniki szyfrowania selektywnego, chroniące jedynie najbardziej wrażliwe warstwy danych. Ponadto, sprzętowo akcelerowane funkcje bezpieczeństwa, w tym techniki obliczeń przybliżonych, optymalizują przetwarzanie kryptograficzne bez nadmiernego obciążania zasobów urządzenia.

## 7. Studia przypadków i wzorce implementacyjne

### 7.1. Klasyfikacja obrazów na mikrokontrolerach

Typowym scenariuszem wdrożeniowym jest realizacja klasyfikacji obrazów na mikrokontrolerach z serii ARM Cortex-M. W takich zastosowaniach kluczowe znaczenie ma zastosowanie kwantyzacji INT8 oraz wykorzystanie biblioteki CMSIS-NN. Przykładowo, model MobileNetV2 po kwantyzacji może być efektywnie uruchamiany na platformach takich jak STM32, umożliwiając realizację zadań detekcji obiektów z akceptowalną dokładnością przy poborze mocy rzędu miliwatów.

### 7.2. Predykcyjne utrzymanie ruchu w przemyśle

W zastosowaniach przemysłowych, platformy takie jak Edge Impulse i TVM umożliwiają przetwarzanie danych sensorycznych bezpośrednio na brzegu sieci, z możliwością aktualizacji modeli w trybie OTA. Architektura taka eliminuje konieczność ciągłego przesyłania strumieni danych wibracyjnych, temperaturowych czy akustycznych do chmury, redukując koszty transmisji i zapewniając szybką detekcję anomalii.

### 7.3. Duże modele językowe na urządzeniach mobilnych

Postęp w dziedzinie kompresji modeli umożliwia uruchamianie dużych modeli językowych (LLM) bezpośrednio na urządzeniach mobilnych. Podejście to oferuje istotne korzyści w zakresie prywatności – dane użytkownika nie opuszczają urządzenia – oraz niskich opóźnień, ponieważ odpowiedzi generowane są lokalnie bez opóźnień sieciowych. Wyzwania obejmują wysokie wymagania pamięciowe, ograniczoną żywotność baterii oraz ograniczenia termiczne urządzeń mobilnych.

### 7.4. Wnioskowanie z wykorzystaniem NPU

Współczesne układy NPU, takie jak procesory firmy Mobilint, oferują wydajność rzędu 80 TOPS przy poborze mocy 25 W, umożliwiając realizację zaawansowanych zadań wnioskowania – od detekcji obiektów (YOLO) po duże modele językowe (LLaMA) – bezpośrednio na brzegu sieci. Programowanie takich akceleratorów wymaga wykorzystania dedykowanych SDK, które automatyzują procesy kwantyzacji, optymalizacji i konwersji binarnej do formatu natywnego dla danej architektury NPU.

## 8. Najlepsze praktyki programistyczne

Na podstawie analizy literatury przedmiotu oraz doświadczeń wdrożeniowych, można sformułować następujący katalog najlepszych praktyk w programowaniu Edge AI:

1. **Rozpoczynaj od prostego modelu bazowego** – optymalizację należy prowadzić iteracyjnie, rozpoczynając od działającego punktu odniesienia.
2. **Mierz wszystko** – monitoruj opóźnienia wnioskowania, przepustowość, zużycie pamięci i energię przed i po każdej optymalizacji.
3. **Testuj na rzeczywistym sprzęcie** – symulacje na komputerze PC nie oddają w pełni ograniczeń platformy docelowej.
4. **Łącz techniki optymalizacyjne** – synergiczne wykorzystanie kwantyzacji, przycinania i destylacji wiedzy daje lepsze rezultaty niż stosowanie pojedynczych metod.
5. **Projektuj z myślą o wdrożeniu od samego początku** – architektura Edge AI musi być celowo budowana z uwzględnieniem realiów wdrożeniowych, a nie rozwijana w próżni i wdrażana ad hoc.
6. **Wykorzystuj konteneryzację dla powtarzalności** – środowiska budowania oparte na kontenerach zapewniają spójność między fazami rozwoju, testów i produkcji.
7. **Implementuj mechanizmy bezpiecznej aktualizacji OTA** – umożliwiają one ewolucyjne doskonalenie modeli bez konieczności fizycznego dostępu do urządzeń.
8. **Stosuj architekturę warstwową** – separacja logiki aplikacyjnej od szczegółów sprzętowych ułatwia przenoszenie rozwiązań między platformami.

## 9. Podsumowanie i kierunki rozwoju

Programowanie urządzeń brzegowych dla potrzeb uczenia maszynowego i sztucznej inteligencji stanowi dynamicznie rozwijającą się dziedzinę, łączącą elementy inżynierii oprogramowania, systemów wbudowanych oraz algorytmów uczenia głębokiego. Kluczowe wyzwania – ograniczone zasoby obliczeniowe i pamięciowe, heterogeniczność platform sprzętowych, restrykcje energetyczne oraz trudności w zarządzaniu rozproszonymi wdrożeniami – wymagają interdyscyplinarnego podejścia i głębokiej integracji warstwy sprzętowej z oprogramowaniem.

Obserwowane trendy wskazują na kilka istotnych kierunków rozwoju:

- **Ewolucja w kierunku agentowej Edge AI** – systemy zdolne do autonomicznego podejmowania decyzji i adaptacji do zmiennych warunków operacyjnych.
- **Postęp w kompresji dużych modeli językowych** – umożliwiający uruchamianie zaawansowanych asystentów konwersacyjnych bezpośrednio na urządzeniach.
- **Rozwój zunifikowanych platform orkiestracji** – upraszczających zarządzanie cyklem życia aplikacji w środowiskach hybrydowych Edge-Cloud.
- **Integracja mechanizmów uczenia federacyjnego** – zapewniających ciągłe doskonalenie modeli przy zachowaniu prywatności danych.

W miarę jak kolejne miliardy urządzeń będą wyposażane w funkcje sztucznej inteligencji, umiejętność efektywnego programowania w paradygmacie Edge AI stanie się jedną z kluczowych kompetencji inżynierów oprogramowania i architektów systemów.

## Bibliografia

1. Microsoft. (2025). *EdgeAI for Beginners – A course covering fundamental concepts, popular models, inference techniques, device-specific applications, model optimization, and the development of intelligent Edge AI agents*. GitHub. https://github.com/microsoft/edgeai-for-beginners
2. afondiel. (2025). *Edge AI Engineering: An open and practical guide*. GitHub. https://github.com/afondiel/edge-ai-engineering
3. TechTarget. (2025). *What is Edge AI? Definition and key concepts*. https://www.techtarget.com/searchenterpriseai/definition/edge-AI
4. Tugrul Kaya. (2025). *Running Large Transformer Models on Mobile and Edge Devices*. Hugging Face Blog. https://huggingface.co/blog/tugrulkaya/running-large-transformer-models-on-mobile
5. Sander, J., Cohen, A., Dasari, V., Venable, B., & Jalaian, B. (2025). *On Accelerating Edge AI: Optimizing Resource-Constrained Environments*. arXiv preprint arXiv:2501.15014.
6. Promwad. (2025). *Choosing the Right AI/ML Framework for Your Embedded Product*. https://promwad.com/news/choosing-ai-ml-framework-embedded
7. Promwad. (2025). *Deploying AI Models at the Edge: Challenges and Best Practices*. https://promwad.com/news/edge-ai-model-deployment
8. Sharma, D. (2025). *The Inference Bottleneck: Why Edge AI Is the Next Great Computing Challenge*. HPCwire. https://www.hpcwire.com/2025/04/15/the-inference-bottleneck-why-edge-ai-is-the-next-great-computing-challenge/
9. Edge AI and Vision Alliance. (2025). *Why Edge AI Struggles Towards Production: The Deployment Problem*. https://www.edge-ai-vision.com/2025/12/why-edge-ai-struggles-towards-production-the-deployment-problem/
10. Google AI for Developers. (2025). *Model optimization: Best practices for optimizing TensorFlow models for deployment to edge hardware*. https://ai.google.dev/edge/model-optimization
11. Avassa. (2025). *Edge AI Orchestration: Closing the gap between development and production*. https://avassa.io/articles/making-the-edge-lovable-for-your-development-and-application-operations-team/
12. VentureBeat. (2025). *Simplifying the AI stack: The key to scalable, portable intelligence from cloud to edge*. https://venturebeat.com/ai/simplifying-the-ai-stack-the-key-to-scalable-portable-intelligence-from-cloud-to-edge/
13. Tencent Cloud. (2025). *How to ensure security and privacy when deploying AI Agent at the edge?* https://www.tencentcloud.com/document/product/ai-agent/security-privacy-edge
14. Edge AI and Vision Alliance. (2025). *Optimizing Your AI Model for the Edge*. https://www.edge-ai-vision.com/2025/07/optimizing-your-ai-model-for-the-edge/
15. MLCommons. (2020–2025). *MLPerf Inference Benchmark Results*. https://mlcommons.org/