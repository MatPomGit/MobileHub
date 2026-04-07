\# PyTorch na urządzeniach mobilnych i brzegowych: Architektura, optymalizacja oraz wdrażanie modeli YOLO w środowiskach o ograniczonych zasobach



\## Abstrakt



Dynamiczny rozwój algorytmów głębokiego uczenia, w szczególności konwolucyjnych sieci neuronowych do detekcji obiektów oraz dużych modeli językowych, stwarza nowe wyzwania w zakresie wdrażania tych modeli na urządzeniach o ograniczonych zasobach obliczeniowych i energetycznych. Framework PyTorch, dzięki ewolucji swoich narzędzi do wnioskowania brzegowego – od PyTorch Mobile i TorchScript po najnowszą platformę ExecuTorch – umożliwia programistom tworzenie zaawansowanych aplikacji AI działających bezpośrednio na smartfonach, systemach wbudowanych i mikrokontrolerach. Niniejszy artykuł przedstawia kompleksową analizę ekosystemu PyTorch dla urządzeń mobilnych i brzegowych, ze szczególnym uwzględnieniem architektury ExecuTorch, technik optymalizacji modeli, integracji ze sprzętowymi akceleratorami NPU oraz praktycznych aspektów wdrażania modeli z rodziny YOLO w środowiskach produkcyjnych. Omówiono również kluczowe studia przypadków, benchmarki wydajnościowe oraz kierunki dalszego rozwoju w kontekście przetwarzania wielomodalnego na brzegu sieci.



\## 1. Wprowadzenie



Przetwarzanie modeli uczenia maszynowego bezpośrednio na urządzeniach końcowych – smartfonach, tabletach, komputerach jednopłytkowych czy mikrokontrolerach – stanowi jeden z najdynamiczniej rozwijających się obszarów współczesnej inżynierii oprogramowania. Paradygmat ten, określany mianem \*on-device AI\* lub \*Edge AI\*, oferuje fundamentalne korzyści w porównaniu z tradycyjnym modelem przetwarzania w chmurze: eliminację opóźnień sieciowych, zachowanie prywatności danych użytkownika, możliwość działania w trybie offline oraz redukcję kosztów operacyjnych związanych z transmisją i przetwarzaniem danych.



Historycznie, wdrażanie modeli PyTorch na urządzeniach mobilnych wiązało się z istotnymi trudnościami. Konieczność konwersji do formatów pośrednich, takich jak ONNX czy TensorFlow Lite, lub przepisywania modeli w językach kompilowanych (C++), prowadziła do wydłużenia cyklu produkcyjnego, rozbieżności numerycznych oraz utraty informacji diagnostycznych. Sytuację komplikował dodatkowo rosnący stopień złożoności architektur sieci neuronowych – od relatywnie jednorodnych transformerów tekstowych po współczesne modele wielomodalne, łączące enkodery obrazu, dźwięku i innych modalności.



Odpowiedzią na te wyzwania jest \*\*ExecuTorch\*\* – ujednolicone, natywne dla PyTorch rozwiązanie do wdrażania modeli AI na urządzeniach mobilnych, wbudowanych i brzegowych, ogłoszone w wersji 1.0 w październiku 2025 roku. ExecuTorch, opracowany przez Meta we współpracy z liderami branżowymi – w tym Arm, Apple i Qualcomm – umożliwia bezpośrednie, produkcyjne wdrożenie modeli PyTorch bez konieczności konwersji formatów czy przepisywania kodu, oferując jednocześnie wsparcie dla szerokiego spektrum akceleratorów sprzętowych, w tym CPU, GPU i NPU.



Niniejszy artykuł ma na celu systematyczne przedstawienie zasad programowania z wykorzystaniem PyTorch w środowiskach mobilnych i brzegowych, ze szczególnym uwzględnieniem wdrażania modeli detekcji obiektów z rodziny YOLO. Struktura artykułu obejmuje: analizę architektury ExecuTorch, omówienie technik optymalizacji modeli, przegląd dostępnych formatów eksportu i backendów sprzętowych, praktyczne aspekty wdrażania modeli YOLO, analizę wydajności w kontekście akceleratorów NPU oraz studia przypadków wdrożeń produkcyjnych.



\## 2. Architektura PyTorch dla urządzeń brzegowych: od TorchScript do ExecuTorch



\### 2.1. Ewolucja narzędzi wnioskowania brzegowego



Rozwój narzędzi PyTorch do wnioskowania na urządzeniach mobilnych przebiegał w kilku zasadniczych etapach. Pierwszym rozwiązaniem umożliwiającym uruchamianie modeli PyTorch na platformach mobilnych był \*\*TorchScript\*\* – mechanizm serializacji modeli do postaci niezależnej od interpretera Pythona. TorchScript, poprzez kompilację just-in-time (JIT) lub tracing, przekształca model PyTorch w reprezentację pośrednią, która może być następnie zoptymalizowana i wykonana przez środowisko uruchomieniowe PyTorch Mobile. Podejście to, choć funkcjonalne, wymagało ręcznego zarządzania konwersją i nie oferowało zunifikowanego przepływu pracy dla heterogenicznych platform sprzętowych.



Kolejnym krokiem ewolucyjnym było wprowadzenie \*\*PyTorch Mobile\*\* – biblioteki umożliwiającej uruchamianie modeli TorchScript na systemach Android i iOS. Należy jednak zaznaczyć, że PyTorch Mobile nie jest już aktywnie rozwijany, a oficjalna dokumentacja przekierowuje użytkowników do ExecuTorch jako rekomendowanego następcy.



\*\*ExecuTorch\*\*, będący kulminacją tych prac, reprezentuje fundamentalnie odmienne podejście architektoniczne. W przeciwieństwie do poprzednich rozwiązań, ExecuTorch opiera się na kompilacji \*ahead-of-time\* (AOT), która przygotowuje model PyTorch do wdrożenia na urządzeniu docelowym w trzech etapach:



1\. \*\*Eksport\*\* – przechwycenie grafu obliczeniowego modelu PyTorch z wykorzystaniem `torch.export()`.

2\. \*\*Kompilacja\*\* – kwantyzacja, optymalizacja i partycjonowanie grafu pod kątem docelowych akceleratorów sprzętowych, zakończone wygenerowaniem pliku w formacie `.pte` (PyTorch ExecuTorch).

3\. \*\*Wykonanie\*\* – załadowanie pliku `.pte` na urządzeniu docelowym przez lekki runtime napisany w C++.



Format `.pte` został zoptymalizowany pod kątem rozmiaru i szybkości ładowania na urządzeniach o ograniczonych zasobach, a bazowy footprint runtime'u wynosi zaledwie 50 KB, co umożliwia uruchamianie modeli na urządzeniach od mikrokontrolerów po zaawansowane smartfony.



\### 2.2. Kluczowe cechy architektoniczne ExecuTorch



ExecuTorch został zaprojektowany wokół trzech fundamentalnych zasad: przenoszalności (\*portability\*), wydajności (\*performance\*) i produktywności (\*productivity\*).



\*\*Przenoszalność\*\* jest osiągana poprzez ujednolicony stos wykonawczy, który może być kierowany na różnorodne platformy sprzętowe – od procesorów ARM Cortex-A i Cortex-M, przez GPU (z wykorzystaniem backendu Vulkan), po dedykowane akceleratory NPU – bez konieczności przepisywania modelu. Model wyeksportowany raz może być wdrożony na wielu platformach docelowych poprzez prostą zmianę konfiguracji backendu.



\*\*Wydajność\*\* zapewniają zoptymalizowane runtime'y i backendy, które gwarantują, że modele mieszczą się i działają w ramach restrykcyjnych ograniczeń urządzeń wbudowanych. ExecuTorch domyślnie integruje się z biblioteką \*\*XNNPACK\*\*, zapewniającą wysoce zoptymalizowane wnioskowanie na mobilnych procesorach CPU bez konieczności stosowania specjalizowanego sprzętu.



\*\*Produktywność\*\* programistów jest zachowana dzięki pozostaniu w znanym środowisku PyTorch, z natywnymi narzędziami do obniżania reprezentacji (\*lowering\*) i kwantyzacji, które upraszczają proces wdrażania. ExecuTorch wykorzystuje zestaw operatorów \*\*Core ATen\*\* – ustandaryzowaną reprezentację pośrednią, która umożliwia zachowanie spójności semantyki modelu między środowiskiem treningowym a wdrożeniowym.



\### 2.3. Mechanizm delegacji sprzętowej



Jednym z najbardziej innowacyjnych aspektów architektury ExecuTorch jest mechanizm \*\*delegacji sprzętowej\*\* (\*delegation\*). Partycjonery (\*partitioners\*) analizują graf obliczeniowy modelu i identyfikują podgrafy, które mogą być efektywnie wykonane na specjalizowanych akceleratorach (NPU/GPU), delegując pozostałe operacje do CPU. Mechanizm ten zapewnia automatyczny \*fallback\* do CPU dla operatorów nieobsługiwanych przez dany akcelerator, gwarantując poprawność wykonania przy jednoczesnej maksymalizacji wykorzystania dostępnego sprzętu.



ExecuTorch 1.0 oferuje produkcyjne wsparcie dla kilkunastu backendów sprzętowych, w tym:

\- \*\*Qualcomm Hexagon NPU\*\* – poprzez dedykowanego delegata opracowanego we współpracy z Qualcomm, umożliwiającego bezpośrednie odciążenie wnioskowania AI/ML i GenAI na NPU.

\- \*\*Arm Ethos-U NPU\*\* – zaprojektowany do ultraniskonapięciowej akceleracji AI w mikrokontrolerach.

\- \*\*Apple (ANE, GPU)\*\* – wsparcie dla Neural Engine i GPU w urządzeniach Apple.

\- \*\*Intel (OpenVINO)\*\* – integracja z OpenVINO umożliwiająca wykorzystanie CPU, GPU i NPU Intel.

\- \*\*MediaTek, Vulkan\*\* – dodatkowe backendy dla platform mobilnych i graficznych.



Architektura delegacji opiera się na specyfikacji \*\*TOSA\*\* (Tensor Operator Set Architecture) 1.0, która ustanawia spójne fundamenty dla wdrażania obciążeń AI na różnych rodzinach NPU, zapewniając przewidywalne zachowanie poprzez obniżenie większości operatorów brzegowych (INT8 i FP32) do wspólnej, przenośnej postaci.



\## 3. Optymalizacja modeli PyTorch dla środowisk mobilnych



\### 3.1. Kwantyzacja



Kwantyzacja stanowi fundamentalną technikę umożliwiającą wdrożenie modeli PyTorch na urządzeniach o ograniczonych zasobach. ExecuTorch oferuje wbudowane wsparcie dla technik kwantyzacji, które redukują rozmiar modelu i zwiększają szybkość wnioskowania przy zachowaniu dokładności.



W kontekście PyTorch na urządzenia mobilne, kwantyzacja jest rekomendowanym, choć opcjonalnym, krokiem, który może radykalnie zredukować opóźnienia wnioskowania i zużycie pamięci. Na platformach mobilnych i brzegowych, gdzie ograniczenia pamięci i energii są krytyczne, redukcja precyzji z FP32 do INT8 może przynieść nawet czterokrotne zmniejszenie rozmiaru modelu przy jednoczesnym przyspieszeniu obliczeń.



W ekosystemie PyTorch dostępne są dwa główne warianty kwantyzacji:

\- \*\*Kwantyzacja post-treningowa (PTQ)\*\* – stosowana po zakończeniu trenowania, bez modyfikacji procesu uczenia.

\- \*\*Kwantyzacja świadoma trenowania (QAT)\*\* – integrująca symulację kwantyzacji w procesie trenowania, umożliwiająca adaptację modelu do zredukowanej precyzji i zachowanie wyższej dokładności.



\### 3.2. Kompresja modelu i optymalizacja pamięciowa



Poza kwantyzacją, ExecuTorch implementuje szereg mechanizmów optymalizacji pamięciowej. Zoptymalizowane zarządzanie pamięcią redukuje footprint pamięciowy w czasie wykonania, czyniąc rozwiązanie odpowiednim dla urządzeń z ograniczoną pamięcią RAM. Dodatkowo, pliki w formacie `.pte` zawierają metadane modelu (rozmiar obrazu, nazwy klas itp.) w oddzielnym pliku YAML, co ułatwia integrację i zmniejsza narzut pamięciowy podczas ładowania.



\### 3.3. Optymalizacja specyficzna dla platformy



W przypadku platform Apple, badania wykazały, że wykorzystanie jąder Metal generowanych przez modele AI może przyspieszyć wnioskowanie PyTorch nawet o 87% w porównaniu z bazowym PyTorch. Eksperymenty przeprowadzone na 215 modułach PyTorch potwierdziły skuteczność tego podejścia na sprzęcie Apple.



Dla platform ARM, ExecuTorch w połączeniu z rozszerzeniem ARM Scalable Matrix Extension 2 (SME2) umożliwia osiągnięcie nawet 3,9-krotnego przyspieszenia segmentacji obrazu w modelu SqueezeSAM – lekkiej wersji Meta Segment Anything Model (SAM) wykorzystywanej w funkcji Cutouts na Instagramie.



\## 4. Wdrażanie modeli YOLO na urządzeniach brzegowych



\### 4.1. Rodzina YOLO w kontekście Edge AI



Modele z rodziny YOLO (You Only Look Once) stanowią jedne z najczęściej wdrażanych architektur detekcji obiektów na urządzeniach brzegowych, łącząc wysoką dokładność z szybkością wnioskowania umożliwiającą zastosowania w czasie rzeczywistym. Tradycyjne modele YOLO pozostają jednak obliczeniowo wymagające dla środowisk o ograniczonych zasobach, ponieważ były projektowane z myślą o systemach o wysokiej wydajności, co czyni je mniej praktycznymi dla platform niskonapięciowych, takich jak Raspberry Pi, procesory ARM czy urządzenia NVIDIA Jetson.



Najnowsza iteracja – \*\*YOLO26\*\*, wydana we wrześniu 2025 roku – została celowo zaprojektowana z myślą o efektywności, dokładności i gotowości wdrożeniowej na urządzeniach brzegowych i niskonapięciowych. Kluczowe innowacje architektoniczne YOLO26 obejmują:



\- \*\*Usunięcie Distribution Focal Loss (DFL)\*\* – uproszczenie funkcji straty.

\- \*\*Wnioskowanie bez NMS (Non-Maximum Suppression)\*\* – eliminacja post-processingu zwiększającego opóźnienia.

\- \*\*Integracja ProgLoss i Small-Target-Aware Label Assignment (STAL)\*\* – poprawa detekcji małych obiektów.

\- \*\*Optymalizator MuSGD\*\* – stabilna konwergencja trenowania.



YOLO26 pozycjonowany jest jako wielozadaniowy framework, wspierający nie tylko detekcję obiektów, ale również segmentację instancji, estymację pozycji, detekcję zorientowaną i klasyfikację.



\### 4.2. Eksport modeli YOLO do formatów brzegowych



Proces wdrażania modeli YOLO na urządzenia mobilne i brzegowe wymaga konwersji wytrenowanego modelu do formatu zoptymalizowanego pod kątem platformy docelowej. Framework Ultralytics YOLO oferuje natywne wsparcie dla eksportu do wielu formatów, w tym TorchScript, ONNX, TensorRT, CoreML, TFLite oraz – co szczególnie istotne w kontekście niniejszego artykułu – ExecuTorch.



\*\*Eksport do ExecuTorch\*\* jest realizowany poprzez prosty interfejs programistyczny:



```python

from ultralytics import YOLO



\# Wczytanie modelu YOLO26

model = YOLO("yolo26n.pt")



\# Eksport do formatu ExecuTorch

model.export(format="executorch")  # tworzy katalog 'yolo26n\_executorch\_model'



\# Wnioskowanie z wykorzystaniem wyeksportowanego modelu

executorch\_model = YOLO("yolo26n\_executorch\_model")

results = executorch\_model.predict("https://ultralytics.com/images/bus.jpg")

```



Alternatywnie, eksport może być wykonany z linii poleceń:



```bash

yolo export model=yolo26n.pt format=executorch

yolo predict model=yolo26n\_executorch\_model source="image.jpg"

```



Proces ten generuje katalog zawierający plik `.pte` (format ExecuTorch) oraz towarzyszące metadane, gotowe do wdrożenia na urządzeniu docelowym.



\*\*Eksport do TorchScript\*\* pozostaje istotny dla projektów wykorzystujących starsze wersje PyTorch Mobile lub wymagających integracji z istniejącymi aplikacjami Android. Proces konwersji jest analogiczny:



```python

from ultralytics import YOLO



model = YOLO("your\_model.pt")

model.export(format="torchscript")  # generuje plik .torchscript

```



Plik `.torchscript` może być następnie umieszczony w katalogu `assets` projektu Android i załadowany przez PyTorch Mobile.



\### 4.3. Optymalizacja YOLO dla urządzeń o ograniczonych zasobach



Literatura przedmiotu identyfikuje dwa główne podejścia do optymalizacji modeli YOLO pod kątem wdrożeń brzegowych:



\*\*Modyfikacje strukturalne\*\* – wykorzystanie lekkich modułów, takich jak ShuffleNet, MobileNet i GhostNet, które zastępują standardowe bloki konwolucyjne bardziej efektywnymi odpowiednikami. Podejście to generalnie wspiera stabilność modelu, efektywność i generalizację, choć może prowadzić do niewielkiego spadku dokładności.



\*\*Kompresja modelu\*\* – poprzez destylację wiedzy, kwantyzację i przycinanie. Techniki kompresyjne dodatkowo poprawiają zwartość modeli i przepustowość wnioskowania, umożliwiając osiągnięcie znaczących redukcji rozmiaru i złożoności obliczeniowej przy akceptowalnej utracie dokładności.



Połączona, hybrydowa strategia optymalizacji oferuje najbardziej zrównoważone rozwiązanie, osiągając wysoką dokładność detekcji przy jednoczesnej redukcji rozmiaru modelu, liczby GFLOPs i całkowitego kosztu wnioskowania.



W kontekście kwantyzacji YOLO, framework \*\*LLTQ+\*\* (enhanced hardware-friendly quantization) stanowi istotny postęp. LLTQ+ zachowuje warstwy normalizacji wsadowej podczas kwantyzacji świadomej trenowania, co utrzymuje stabilność treningu i dokładność, oraz wprowadza strategię kwantyzacji zachowującą zdolność reprezentacyjną RepConv – kluczowego komponentu strukturalnego sieci YOLO. Na zbiorze danych PASCAL VOC, LLTQ+ osiągnął 80,6% mAP(0,5) na YOLOv10-s przy wnioskowaniu wyłącznie całkowitoliczbowym, przewyższając bazową wersję LLTQ o 0,9 punktu procentowego.



\### 4.4. Opcje wdrożeniowe z ExecuTorch



ExecuTorch umożliwia wdrożenie modeli YOLO na szerokim spektrum platform brzegowych i mobilnych:



\- \*\*Aplikacje mobilne\*\* – natywne wdrożenie na iOS i Android z wydajnością umożliwiającą detekcję obiektów w czasie rzeczywistym.

\- \*\*Systemy wbudowane\*\* – uruchamianie na wbudowanych systemach Linux, takich jak Raspberry Pi, NVIDIA Jetson i innych platformach opartych na ARM.

\- \*\*Urządzenia Edge AI\*\* – wdrożenie na specjalizowanym sprzęcie brzegowym z niestandardowymi delegatami do akceleracji wnioskowania.

\- \*\*Urządzenia IoT\*\* – integracja z urządzeniami Internetu Rzeczy umożliwiająca wnioskowanie bez konieczności łączności z chmurą.



\## 5. Integracja z akceleratorami sprzętowymi NPU



\### 5.1. Znaczenie NPU dla wnioskowania brzegowego



Procesory neuronowe (Neural Processing Units, NPU) stanowią klasę specjalizowanych akceleratorów sprzętowych zaprojektowanych specjalnie do wydajnego i energooszczędnego wnioskowania sieci neuronowych. W przeciwieństwie do procesorów ogólnego przeznaczenia (CPU) czy nawet procesorów graficznych (GPU), NPU oferują architekturę zoptymalizowaną pod kątem operacji dominujących w głębokim uczeniu – mnożenia macierzy i konwolucji – przy jednoczesnym drastycznym obniżeniu poboru mocy.



W kontekście urządzeń mobilnych, gdzie budżet energetyczny i termiczny jest silnie ograniczony, wykorzystanie NPU staje się kluczowym czynnikiem umożliwiającym uruchamianie zaawansowanych modeli AI bez nadmiernego obciążania baterii czy generowania niedopuszczalnego ciepła.



\### 5.2. ExecuTorch a akceleracja NPU



ExecuTorch 1.0 dostarcza produkcyjne wsparcie dla akceleracji NPU poprzez mechanizm delegacji opisany w sekcji 2.3. Kluczowe integracje obejmują:



\*\*Qualcomm Hexagon NPU\*\* – delegat opracowany przez Qualcomm umożliwia bezpośrednie odciążenie wnioskowania AI/ML i GenAI na Hexagon NPU, dostępny w miliardach urządzeń – od smartfonów, przez komputery PC, inteligentne okulary, po pojazdy i urządzenia IoT. Wykorzystanie Hexagon NPU zamiast CPU przynosi wymierne korzyści wydajnościowe:



\- 30–75% szybszy czas ładowania dla dużych modeli językowych.

\- 2–4× szybsza generacja tokenów.

\- Do 92% wyższa przepustowość dla tradycyjnych modeli AI.

\- Redukcja footprintu pamięciowego nawet o 47%.



\*\*Arm Ethos-U NPU\*\* – zaprojektowany do ultraniskonapięciowej akceleracji AI w mikrokontrolerach, Ethos-U w połączeniu z ExecuTorch umożliwia uruchamianie zaawansowanych modeli na urządzeniach o poborze mocy rzędu miliwatów.



\*\*Intel NPU (via OpenVINO)\*\* – integracja OpenVINO jako backendu ExecuTorch umożliwia wykorzystanie pełnej mocy procesorów Intel CPU, GPU i NPU bez opuszczania workflow PyTorch.



\### 5.3. Implikacje dla programowania z PyTorch



Integracja NPU z ExecuTorch fundamentalnie zmienia model programowania aplikacji Edge AI. Deweloperzy mogą tworzyć modele w PyTorch, korzystając ze znanych API, a następnie – poprzez prostą zmianę konfiguracji delegata – kierować wnioskowanie na NPU bez modyfikacji kodu modelu. Podejście to eliminuje fragmentację pipeline'ów specyficznych dla poszczególnych urządzeń, umożliwiając jednolite wdrażanie tych samych modeli AI na platformach mobilnych, wbudowanych i brzegowych.



\## 6. Studia przypadków: wdrożenia produkcyjne PyTorch na urządzeniach mobilnych



\### 6.1. Meta: ExecuTorch w aplikacjach Facebook, Instagram i WhatsApp



Najbardziej spektakularnym przykładem wdrożenia produkcyjnego PyTorch na urządzeniach mobilnych jest wykorzystanie ExecuTorch w rodzinie aplikacji Meta (FoA). ExecuTorch obsługuje miliardy użytkowników na platformach Instagram, WhatsApp, Messenger i Facebook, zapewniając znaczącą poprawę wydajności modeli ML, zwiększenie prywatności oraz redukcję opóźnień w porównaniu z poprzednim stosem wnioskowania na urządzeniu.



\*\*Funkcja Cutouts na Instagramie\*\* – migracja do ExecuTorch z modelem SqueezeSAM (lekką wersją Meta Segment Anything Model) przyniosła istotne przyspieszenie zarówno na Androidzie, jak i iOS, co przełożyło się na wzrost liczby aktywnych użytkowników dziennych (DAU).



\*\*Optymalizacja jakości wideo i połączeń na WhatsApp\*\* – modele estymacji przepustowości, dostosowane do różnych platform, pomagają wykrywać i wykorzystywać dostępną przepustowość sieci, optymalizując jakość strumieniowania wideo bez pogarszania płynności połączeń. Dzięki ExecuTorch zaobserwowano znaczącą redukcję czasu ładowania modelu i średniego czasu wnioskowania, przy jednoczesnym zmniejszeniu liczby błędów ANR (Application Not Responding).



\### 6.2. Wdrażanie YOLO na Androidzie z TorchScript



Praktyczny przykład wdrożenia modelu YOLOv11 na platformie Android ilustruje typowy przepływ pracy dla programistów mobilnych. Proces obejmuje:



1\. \*\*Trenowanie niestandardowego modelu YOLO\*\* na platformie Roboflow (lub lokalnie w PyTorch).

2\. \*\*Eksport do TorchScript\*\* z wykorzystaniem `model.export(format="torchscript")`.

3\. \*\*Integracja z Android Studio\*\* – umieszczenie pliku `.torchscript` w katalogu `assets`.

4\. \*\*Implementacja logiki wnioskowania\*\* w aplikacji Android z wykorzystaniem PyTorch Mobile.



W opisanym studium przypadku, model YOLOv11 został wykorzystany do stworzenia aplikacji do zliczania monet, demonstrując praktyczną użyteczność wdrożeń Edge AI w codziennych zastosowaniach.



\### 6.3. Automatyzacja pipeline'u wdrożeniowego



Problem ręcznego wdrażania i benchmarkingu modeli na urządzeniach mobilnych został zaadresowany przez framework \*\*NN Lite\*\* – w pełni zautomatyzowany pipeline łączący rozwój modeli w PyTorch z rygorystyczną ewaluacją wydajności na platformie Android. System składa się z frameworku orkiestracji w Pythonie, który zarządza konwersją modeli, kontrolą emulatora i zbieraniem danych, współpracując z lekką aplikacją Android do benchmarkingu na urządzeniu. W wielkoskalowej ewaluacji system przetworzył ponad 7500 modeli, wykazując wyjątkową stabilność przy ponad 48 godzinach ciągłej, bezobsługowej pracy.



\## 7. Benchmarki wydajnościowe i analiza porównawcza



\### 7.1. Porównanie frameworków wnioskowania na platformach brzegowych



Kompleksowa analiza porównawcza pięciu wiodących frameworków wnioskowania – PyTorch, ONNX Runtime, TensorRT, Apache TVM i JAX – przeprowadzona na platformie NVIDIA Jetson AGX Orin dostarcza istotnych wniosków dla programistów Edge AI. Badanie uwzględniało kluczowe metryki: dokładność wnioskowania, czas wnioskowania, przepustowość, zużycie pamięci i pobór mocy, testując zarówno modele konwolucyjne, jak i transformerowe.



Wyniki wskazują, że wybór frameworka powinien być podyktowany specyficznymi wymaganiami aplikacji: niektóre frameworki oferują wyższą szybkość wnioskowania i przepustowość, podczas gdy inne zapewniają większą elastyczność, przenoszalność lub łatwość integracji. Zaobserwowano również znaczące różnice w sposobie zarządzania pamięcią systemową i poborem mocy pod różnymi obciążeniami.



\### 7.2. Wydajność YOLO na urządzeniach brzegowych



Benchmarki YOLO26 na urządzeniach brzegowych, takich jak NVIDIA Jetson Nano i Orin, wykazują istotną poprawę w porównaniu z poprzednimi wersjami (YOLOv8, YOLOv11, YOLOv12, YOLOv13) oraz detektorami transformerowymi (RF-DETR, RT-DETR). Konkretne wartości liczbowe są zależne od konfiguracji sprzętowej i zastosowanych optymalizacji, jednak ogólny trend wskazuje na konsekwentną poprawę stosunku dokładności do szybkości w kolejnych iteracjach rodziny YOLO.



Analiza wydajnościowa YOLO na różnych wersjach (v5, v8, v9, v10, v11) i platformach sprzętowych potwierdza, że dobór odpowiedniej kombinacji wersji modelu i biblioteki optymalizacyjnej ma kluczowe znaczenie dla osiągnięcia docelowych parametrów wydajnościowych w konkretnym zastosowaniu.



\### 7.3. Optymalizacja opóźnień – studium inżynieryjne



Praktyczne studium inżynieryjne dotyczące redukcji opóźnień wnioskowania na urządzeniach brzegowych wykazało, że systematyczne podejście do optymalizacji może przynieść redukcję opóźnień z 245 ms do 85 ms – poprawę o 65%. Osiągnięto to poprzez kombinację technik optymalizacyjnych obejmujących kwantyzację, przycinanie i optymalizację specyficzną dla platformy docelowej.



\## 8. Wyzwania i najlepsze praktyki programistyczne



\### 8.1. Kluczowe wyzwania



Wdrażanie modeli PyTorch na urządzeniach mobilnych i brzegowych wiąże się z szeregiem wyzwań technicznych i organizacyjnych:



\*\*Heterogeniczność sprzętowa\*\* – różnorodność platform docelowych (różne generacje NPU, CPU, GPU) wymaga elastycznych strategii wdrożeniowych. ExecuTorch adresuje to wyzwanie poprzez mechanizm delegacji i ujednolicony format `.pte`, jednak programiści muszą być świadomi ograniczeń poszczególnych backendów.



\*\*Ograniczenia pamięciowe i energetyczne\*\* – urządzenia mobilne i wbudowane operują w ramach ścisłych limitów pamięci RAM i budżetu energetycznego. Nawet zoptymalizowane modele mogą przekraczać dostępne zasoby, wymagając dalszej kompresji lub podziału modelu.



\*\*Zgodność operatorów\*\* – nie wszystkie operatory PyTorch są wspierane przez wszystkie backendy sprzętowe. ExecuTorch zapewnia fallback do CPU dla nieobsługiwanych operatorów, jednak może to prowadzić do nieoczekiwanych spadków wydajności.



\*\*Debugowanie i profilowanie\*\* – ograniczona widoczność procesów na urządzeniu docelowym utrudnia identyfikację wąskich gardeł wydajnościowych.



\### 8.2. Najlepsze praktyki



Na podstawie analizy literatury oraz doświadczeń wdrożeniowych można sformułować następujący katalog najlepszych praktyk:



1\. \*\*Rozpoczynaj od modelu bazowego i iteracyjnie optymalizuj\*\* – mierz wpływ każdej optymalizacji na dokładność i wydajność.

2\. \*\*Wykorzystuj kwantyzację INT8 wszędzie tam, gdzie to możliwe\*\* – oferuje ona najlepszy kompromis między wydajnością a dokładnością.

3\. \*\*Testuj na rzeczywistym sprzęcie docelowym\*\* – symulacje na komputerze PC nie oddają w pełni ograniczeń platformy mobilnej.

4\. \*\*Profiluj zużycie pamięci i opóźnienia\*\* – narzędzia takie jak `torch.utils.bottleneck` umożliwiają analizę operatorów na poziomie szczegółowym.

5\. \*\*Wykorzystuj mechanizm delegacji ExecuTorch\*\* – automatyczne kierowanie podgrafów na NPU/GPU maksymalizuje wykorzystanie dostępnego sprzętu.

6\. \*\*Implementuj fallback do CPU\*\* – zapewnia to poprawność wykonania nawet w przypadku operatorów nieobsługiwanych przez akcelerator.

7\. \*\*Stosuj konteneryzację dla powtarzalności\*\* – środowiska budowania oparte na kontenerach zapewniają spójność między fazami rozwoju, testów i produkcji.

8\. \*\*Monitoruj modele w produkcji\*\* – zbieranie metryk wydajnościowych z rzeczywistych urządzeń umożliwia ciągłe doskonalenie.



\## 9. Podsumowanie i kierunki rozwoju



Ekosystem PyTorch dla urządzeń mobilnych i brzegowych przeszedł fundamentalną transformację wraz z wprowadzeniem ExecuTorch 1.0. Ujednolicony workflow – od autoringu modeli w PyTorch, przez eksport, optymalizację i kwantyzację, po wdrożenie na heterogenicznych platformach sprzętowych – eliminuje tradycyjne bariery związane z konwersją formatów i przepisywaniem modeli, radykalnie skracając czas wprowadzania innowacji AI na rynek.



Rodzina modeli YOLO, a w szczególności najnowsza iteracja YOLO26, stanowi wzorcowy przykład architektury zoptymalizowanej pod kątem wdrożeń brzegowych. Dzięki natywnemu wsparciu dla eksportu do ExecuTorch, modele te mogą być efektywnie uruchamiane na urządzeniach od smartfonów po mikrokontrolery, umożliwiając realizację zaawansowanych zadań widzenia komputerowego w czasie rzeczywistym.



Obserwowane trendy wskazują na kilka istotnych kierunków rozwoju:



\- \*\*Dalsza integracja z NPU\*\* – rozszerzanie wsparcia dla kolejnych rodzin akceleratorów, w tym układów takich jak Mobilint ARIES i REGULUS, umożliwi osiągnięcie jeszcze wyższej efektywności energetycznej.

\- \*\*Wsparcie dla modeli wielomodalnych i LLM\*\* – ExecuTorch już dziś umożliwia wdrażanie modeli takich jak Llama-3.2-3B, Gemma-3-1B czy Qwen3-1.7B na urządzeniach mobilnych, a dalszy postęp w kompresji i kwantyzacji rozszerzy spektrum dostępnych zastosowań.

\- \*\*Automatyzacja pipeline'ów wdrożeniowych\*\* – narzędzia takie jak NN Lite wyznaczają kierunek w pełni zautomatyzowanych przepływów pracy, od modelu PyTorch do benchmarkingu na urządzeniu.

\- \*\*Ewolucja w kierunku agentowej Edge AI\*\* – systemy zdolne do autonomicznego podejmowania decyzji i adaptacji do zmiennych warunków operacyjnych.



W miarę jak kolejne miliardy urządzeń będą wyposażane w funkcje sztucznej inteligencji, umiejętność efektywnego programowania w paradygmacie PyTorch Edge AI – łącząca znajomość architektury frameworka, technik optymalizacji modeli oraz specyfiki platform sprzętowych – stanie się jedną z kluczowych kompetencji inżynierów oprogramowania i architektów systemów.



\## Bibliografia



1\. PyTorch Team. (2025). \*Introducing ExecuTorch 1.0: Powering the next generation of edge AI\*. https://pytorch.org/blog/introducing-executorch-1-0/

2\. PyTorch. (2026). \*GitHub – pytorch/executorch: On-device AI across mobile, embedded and edge for PyTorch\*. https://github.com/pytorch/executorch

3\. Ultralytics. (2025). \*Deploy YOLO26 on Mobile \& Edge with ExecuTorch\*. https://docs.ultralytics.com/integrations/executorch/

4\. Meta Engineering. (2025). \*Accelerating on-device ML on Meta's family of apps with ExecuTorch\*. https://engineering.fb.com/2025/07/28/android/executorch-on-device-ml-meta-family-of-apps/

5\. Qualcomm Developer. (2025). \*Bringing Edge AI performance to PyTorch developers with ExecuTorch 1.0\*. https://www.qualcomm.com/developer/blog/2025/10/bringing-edge-ai-performance-to-pytorch-developers-with-executorch-1-0

6\. Arm Developer. (2025). \*Ethos-U and Beyond: How ExecuTorch 1.0 powers AI at the edge\*. https://developer.arm.com/community/arm-community-blogs/b/ai-blog/posts/ethos-u-and-beyond-how-executorch-1-0-powers-ai-at-the-edge

7\. Altaie, U. K., Abdelkareem, A. E., \& Alhasanat, A. (2025). \*Lightweight Optimization of YOLO Models for Resource-Constrained Devices: A Comprehensive Review\*. DJES, doi:10.24237/djes.2025.18401.

8\. Seo, Y., Kim, J., Kang, J. K., \& Kim, Y. (2025). \*LLTQ+: A Hardware-Friendly Quantization Framework for Modern YOLO Architectures\*. IEEE Access, 13, 151189–151201.

9\. Sapkota, R., Cheppally, R. H., Sharda, A., \& Karkee, M. (2025). \*YOLO26: Key Architectural Enhancements and Performance Benchmarking for Real-Time Object Detection\*. arXiv:2509.25164.

10\. Roboflow. (2025). \*How to Create a YOLOv11 Android App\*. https://blog.roboflow.com/yolov11-android-app/

11\. Intel. (2025). \*Optimizing ExecuTorch on Intel AI PCs with OpenVINO™ Backend\*. https://www.intel.com

12\. Din, S. U., Hussain, M. A., Ikram, M., Ignatov, D., \& Timofte, R. (2025). \*AI on the Edge: An Automated Pipeline for PyTorch-to-Android Deployment and Benchmarking\*. Preprints, doi:10.20944/preprints202511.1831.v1.

13\. MDPI Electronics. (2025). \*Accelerating Deep Learning Inference: A Comparative Analysis of Modern Acceleration Frameworks\*. Electronics, 14(15), 2977.

14\. PyTorch. (2026). \*Accelerating On-Device ML Inference with ExecuTorch and Arm SME2\*. https://pytorch.org

15\. Edge AI and Vision Alliance. (2025). \*Bringing Edge AI Performance to PyTorch Developers with ExecuTorch 1.0\*. https://www.edge-ai-vision.com

