# Architektury kognitywne, ACT-R, Soar, OpenCog oraz modele dla robotyki poznawczej

## Streszczenie

Architektury kognitywne stanowią jedną z najważniejszych klas modeli obliczeniowych rozwijanych na styku psychologii poznawczej, sztucznej inteligencji i robotyki. Ich celem jest opisanie oraz implementacja mechanizmów odpowiedzialnych za percepcję, pamięć, uwagę, uczenie się, planowanie, podejmowanie decyzji i działanie. W literaturze przyjmuje się, że architektura kognitywna nie jest jedynie zbiorem algorytmów wykonujących określone zadania, lecz ogólnym szkieletem organizującym procesy poznawcze w spójny system. Szczególne znaczenie mają tu architektury ACT-R, Soar oraz OpenCog, które reprezentują odmienne tradycje teoretyczne i implementacyjne. W robotyce poznawczej architektury te są wykorzystywane do budowy systemów zdolnych do celowego działania w środowisku dynamicznym, niepewnym i społecznie złożonym. Celem niniejszego artykułu jest szczegółowe omówienie podstaw teoretycznych architektur kognitywnych, analiza trzech wybranych systemów oraz przedstawienie ich znaczenia dla współczesnej robotyki poznawczej. Artykuł uwzględnia również praktyczne przykłady zastosowań oraz porównanie głównych podejść architektonicznych.

**Słowa kluczowe:** architektury kognitywne, ACT-R, Soar, OpenCog, robotyka poznawcza, sztuczna inteligencja, pamięć, planowanie, modele hybrydowe

## 1. Wprowadzenie

Pojęcie architektury kognitywnej odnosi się do formalnego modelu organizacji procesów poznawczych, który ma wyjaśniać i implementować funkcjonowanie inteligentnego systemu. W ujęciu klasycznym architektura określa, jakie typy reprezentacji wiedzy są dostępne, jakie istnieją mechanizmy pamięci, jak przebiega selekcja działania, w jaki sposób system się uczy i jak integruje informacje pochodzące z percepcji z procesami decyzyjnymi. Jak podkreśla Anderson (2007), architektura kognitywna jest próbą uchwycenia ogólnych prawidłowości poznania w formie operacyjnej, tak aby można było zarówno testować hipotezy psychologiczne, jak i budować rzeczywiste systemy obliczeniowe.

Znaczenie architektur kognitywnych jest podwójne. Z jednej strony pełnią one funkcję naukowych modeli umysłu, służących wyjaśnianiu danych eksperymentalnych dotyczących pamięci, uwagi, rozwiązywania problemów czy podejmowania decyzji. Z drugiej strony stanowią podstawę inżynierską dla agentów autonomicznych i robotów, które muszą działać w środowiskach rzeczywistych, reagować na zmiany, interpretować cele oraz integrować wiele źródeł informacji. W robotyce poznawczej to właśnie architektura decyduje o tym, czy system będzie jedynie wykonywał zaprogramowane reakcje, czy też będzie zdolny do bardziej elastycznego, kontekstowego i adaptacyjnego działania.

Współczesne badania nad architekturami kognitywnymi rozwijają się w kilku nurtach. Jeden z nich koncentruje się na architekturach symbolicznych, takich jak ACT-R i Soar, które wykorzystują jawne reprezentacje wiedzy, reguły produkcyjne i struktury pamięci długotrwałej. Drugi nurt obejmuje architektury integracyjne i hybrydowe, które próbują łączyć reprezentacje symboliczne, probabilistyczne i subsymboliczne. OpenCog należy właśnie do tej drugiej grupy, ponieważ zakłada współdziałanie różnych typów procesów poznawczych we wspólnej przestrzeni reprezentacji wiedzy. W robotyce poznawczej coraz wyraźniej widać, że żaden pojedynczy paradygmat nie jest wystarczający we wszystkich zastosowaniach. Z tego względu dominującym kierunkiem stają się architektury wielowarstwowe i hybrydowe.

## 2. Istota architektur kognitywnych

Architektura kognitywna jest systemem ogólnym. Nie opisuje jedynie sposobu rozwiązania konkretnego zadania, lecz określa zbiór mechanizmów, które mogą być stosowane w wielu różnych domenach. Newell (1990) wskazywał, że inteligencja wymaga jednolitej teorii poznania, zdolnej do objęcia różnorodnych zjawisk psychicznych i behawioralnych. W tym sensie architektura kognitywna stanowi próbę budowy takiej teorii w postaci obliczeniowej.

Do podstawowych składników architektury kognitywnej należą reprezentacja wiedzy, organizacja pamięci, selekcja działania, uczenie się oraz integracja percepcji i motoryki. Reprezentacja wiedzy może mieć charakter symboliczny, grafowy, probabilistyczny lub mieszany. Organizacja pamięci zwykle obejmuje pamięć roboczą i pamięć długotrwałą, a w bardziej rozwiniętych systemach także pamięć epizodyczną, semantyczną i proceduralną. Selekcja działania odpowiada za wybór jednej akcji spośród wielu możliwych. Uczenie się umożliwia modyfikację zachowania na podstawie doświadczenia. Integracja percepcji i motoryki jest natomiast niezbędna wszędzie tam, gdzie system ma działać w świecie fizycznym.

W architekturach klasycznych szczególne znaczenie przypisuje się jawnej reprezentacji struktur poznawczych. Wiedza może przyjmować postać reguł typu jeśli-to, rekordów pamięciowych, struktur stan-operator lub relacji semantycznych. Takie podejście daje dużą interpretowalność i pozwala analizować działanie systemu w sposób zbliżony do analizy rozumowania. Ma ono jednak także ograniczenia. Systemy symboliczne bywają wrażliwe na szum sensoryczny, trudniej skalują się do złożonych danych percepcyjnych i często wymagają integracji z modułami subsymbolicznymi, zwłaszcza w dziedzinach takich jak widzenie komputerowe, przetwarzanie mowy czy sterowanie ruchem.

## 3. ACT-R

### 3.1. Podstawy teoretyczne

ACT-R, czyli Adaptive Control of Thought-Rational, jest architekturą rozwijaną przede wszystkim w tradycji psychologii poznawczej. Według Andersona i Lebiere'a (1998) jej celem jest sformułowanie spójnej teorii poznania, która tłumaczyłaby zarówno zachowanie, jak i jego obliczeniową realizację. W ACT-R centralne jest rozróżnienie między wiedzą deklaratywną i proceduralną. Wiedza deklaratywna obejmuje fakty i pojęcia, natomiast wiedza proceduralna opisuje sposoby wykonywania działań.

Wiedza deklaratywna jest reprezentowana przez tak zwane chunky, czyli jednostki pamięciowe zawierające uporządkowane informacje o obiektach, relacjach lub stanach. Wiedza proceduralna ma postać reguł produkcyjnych, które uruchamiają się wtedy, gdy określone warunki są spełnione w aktualnym stanie systemu. Architektura ma charakter modułowy. Obejmuje moduły odpowiadające za różne aspekty funkcjonowania poznawczego, między innymi pamięć deklaratywną, cele, percepcję wzrokową oraz działanie motoryczne. Każdy moduł komunikuje się z centralnym systemem produkcyjnym przez wyspecjalizowane bufory.

### 3.2. Mechanizmy działania

Działanie ACT-R opiera się na cyklicznym przebiegu przetwarzania. W każdej iteracji system aktualizuje zawartość buforów, dopasowuje reguły produkcyjne do bieżącego stanu oraz wybiera jedną regułę do wykonania. Istotnym elementem architektury są mechanizmy subsymboliczne. Nie wszystkie chunky są dostępne z taką samą łatwością. Ich wydobycie zależy od poziomu aktywacji, na który wpływa częstość i świeżość wcześniejszego użycia. Dzięki temu ACT-R pozwala modelować zjawiska takie jak zapominanie, interferencja, wpływ praktyki na szybkość działania oraz zależność czasu reakcji od obciążenia poznawczego.

Jedną z głównych zalet tej architektury jest możliwość powiązania parametrów modelu z danymi eksperymentalnymi. Anderson (2007) podkreślał, że ACT-R został zaprojektowany nie tylko po to, aby rozwiązywać problemy, lecz także po to, by generować przewidywania dotyczące zachowania ludzi. To właśnie dlatego architektura ta jest intensywnie wykorzystywana w badaniach nad pamięcią, uwagą, interakcją człowiek-komputer i modelowaniem decyzji.

### 3.3. Znaczenie ACT-R dla robotyki poznawczej

Choć ACT-R powstał jako architektura silnie osadzona w psychologii eksperymentalnej, znalazł również zastosowanie w robotyce poznawczej, zwłaszcza tam, gdzie istotna jest interakcja z człowiekiem. Roboty społeczne, systemy dialogowe i asystenci poznawczy mogą korzystać z ACT-R jako modelu mechanizmów przypominania, przełączania uwagi i wykonywania procedur. W takich zastosowaniach zaletą nie jest tylko poprawność funkcjonalna, lecz także zgodność z ludzkim stylem działania, w tym możliwość modelowania typowych ograniczeń poznawczych.

### 3.4. Przykład praktyczny

Rozważmy robota recepcyjnego pracującego w budynku biurowym. Robot taki musi rozpoznawać intencję użytkownika, przypominać sobie informacje o salach, spotkaniach i osobach, a następnie formułować odpowiednie odpowiedzi lub podejmować działania nawigacyjne. W architekturze ACT-R informacje o lokalizacji sal, tożsamości gości i planie dnia mogłyby być reprezentowane jako chunky. Procedury obsługi różnych klas zapytań byłyby zapisane w postaci reguł produkcyjnych.

Jeżeli użytkownik mówi: „Szukam sali A312”, system musi zakodować wypowiedź, zidentyfikować cel pytania, wydobyć z pamięci odpowiedni chunk zawierający lokalizację sali i wygenerować odpowiedź. Jeżeli sala jest rzadko używana, jej wydobycie może być wolniejsze, co odpowiada naturalnym opóźnieniom w dostępie do mniej aktywnej wiedzy. Dzięki temu ACT-R dobrze nadaje się do modeli HRI, w których ważne jest realistyczne odzwierciedlenie czasu reakcji, błędów i ograniczeń poznawczych.

### 3.5. Ograniczenia

ACT-R nie został zaprojektowany przede wszystkim jako architektura dla autonomicznych robotów poruszających się w nieprzewidywalnym świecie fizycznym. Oznacza to, że w zastosowaniach robotycznych zwykle wymaga integracji z dodatkowymi warstwami percepcji i sterowania ruchem. Sam mechanizm produkcyjny nie rozwiązuje problemu widzenia komputerowego, śledzenia obiektów ani kontroli napędów. Dlatego ACT-R najlepiej sprawdza się w roli poznawczej warstwy wyższego poziomu, a nie jako kompletny system sterowania robotem.

## 4. Soar

### 4.1. Założenia ogólne

Soar należy do najważniejszych ogólnych architektur kognitywnych rozwijanych od początku lat osiemdziesiątych. Laird (2012) opisuje Soar jako próbę stworzenia jednolitego systemu dla inteligentnego działania, który miałby obejmować rozwiązywanie problemów, uczenie się, pamięć i wykonywanie zadań. Główną ideą architektury jest przedstawienie zachowania w kategoriach stanów i operatorów. System znajduje się w określonym stanie, ma do dyspozycji pewien zbiór operatorów i wybiera taki operator, który najlepiej prowadzi do realizacji celu.

Podejście to okazało się szczególnie użyteczne w zadaniach wymagających sekwencyjnego sterowania i planowania. W przeciwieństwie do ACT-R, który silniej akcentuje zgodność z wynikami psychologii poznawczej, Soar od początku miał wyraźny wymiar ogólnoinżynierski. Oznacza to, że architektura ta była projektowana jako narzędzie do budowy inteligentnych agentów działających w różnych środowiskach.

### 4.2. Organizacja pamięci

Soar wykorzystuje pamięć roboczą, pamięć produkcji oraz pamięci długotrwałe, w tym semantyczną i epizodyczną. Pamięć robocza przechowuje bieżący opis sytuacji, celów i dostępnych operatorów. Pamięć produkcji zawiera reguły odpowiedzialne za generowanie preferencji i decyzji. Pamięć semantyczna pozwala odwoływać się do wiedzy ogólnej, natomiast epizodyczna umożliwia przywoływanie wcześniejszych doświadczeń. Ta wielowarstwowa organizacja pamięci daje architekturze dużą elastyczność i pozwala wiązać bieżące decyzje z historią działania.

### 4.3. Impassy i chunking

Jednym z najbardziej charakterystycznych mechanizmów Soar jest obsługa impasów. Impas pojawia się wtedy, gdy system nie potrafi dokonać wyboru operatora albo nie ma wystarczającej wiedzy do wykonania kolejnego kroku. W takiej sytuacji architektura tworzy podproblem, który jest rozwiązywany na niższym poziomie. Po jego rozwiązaniu wynik może zostać skompilowany do nowej reguły produkcyjnej. Proces ten nazywa się chunkingiem.

Chunking stanowi mechanizm uczenia proceduralnego. Dzięki niemu system może stopniowo przechodzić od kosztownego rozumowania deliberatywnego do szybszych, skompilowanych form działania. W praktyce oznacza to, że agent, który wielokrotnie rozwiązuje podobne problemy, zaczyna reagować bardziej sprawnie i automatycznie. Mechanizm ten dobrze koresponduje z intuicją psychologiczną dotyczącą przechodzenia od kontrolowanego wykonywania zadania do wprawy.

### 4.4. Soar w robotyce poznawczej

Soar okazał się szczególnie przydatny w robotyce poznawczej, ponieważ dobrze wspiera sterowanie zadaniowe, planowanie i sekwencyjną organizację działania. Laird (2012) podkreśla, że architektura ta była wielokrotnie integrowana z systemami robotycznymi i wykorzystywana do badań nad agentami ucieleśnionymi. Jej przewagą jest to, że umożliwia jawne reprezentowanie stanu zadania, rozpatrywanie alternatywnych operatorów, rozwiązywanie konfliktów decyzyjnych oraz uczenie reguł usprawniających przyszłe działanie.

### 4.5. Przykład praktyczny

Dobrym przykładem może być robot magazynowy realizujący zlecenia transportowe. Robot taki musi decydować, które zadanie wykonać najpierw, jaką trasę obrać, kiedy przerwać misję z powodu niskiego poziomu baterii oraz jak reagować na zablokowane przejścia. W Soar bieżący stan zawierałby informacje o położeniu robota, priorytecie zleceń, stanie otoczenia i poziomie energii. Operatory mogłyby odpowiadać takim działaniom, jak przejazd do wyznaczonej strefy, ominięcie przeszkody, ładowanie akumulatora czy zmiana kolejności zadań.

Jeżeli system napotyka konflikt między dwoma równorzędnymi trasami albo między priorytetem pilnego zlecenia a koniecznością ładowania, może wejść w impas. Rozwiązanie tego podproblemu zostaje następnie zapisane jako nowa reguła, która przy podobnych sytuacjach pozwoli działać szybciej. Jest to ważna zaleta w środowiskach operacyjnych, gdzie wiele decyzji ma powtarzalny charakter, lecz nadal wymaga uwzględnienia kontekstu.

### 4.6. Ograniczenia

Podobnie jak inne architektury symboliczne, Soar nie rozwiązuje samodzielnie problemów percepcji niskiego poziomu. W rzeczywistym robocie potrzebuje integracji z modułami detekcji obiektów, lokalizacji, planowania trajektorii czy przetwarzania mowy. Ograniczeniem może być również wzrost złożoności bazy reguł w dużych systemach, zwłaszcza jeśli projekt ontologii i pamięci nie został odpowiednio zhierarchizowany.

## 5. OpenCog

### 5.1. Charakter ogólny

OpenCog reprezentuje odmienny typ architektury niż ACT-R i Soar. Nie jest przede wszystkim zwartą architekturą produkcyjną, lecz raczej rozbudowanym frameworkiem poznawczym ukierunkowanym na integrację wielu form reprezentacji i wnioskowania. Goertzel, Pennachin i Geisweiller (2014) opisują projekt OpenCog jako próbę budowy systemu AGI, który łączyłby logikę probabilistyczną, reprezentacje semantyczne, uwagę, uczenie się i programowanie probabilistyczne w jednym środowisku.

W centrum systemu znajduje się AtomSpace, czyli wspólna przestrzeń wiedzy o strukturze grafowo-hipergrafowej. Wiedza reprezentowana jest przez tak zwane atomy, które mogą opisywać obiekty, relacje, zdarzenia, procedury i cele. Część struktur może mieć charakter wykonywalny, co oznacza, że reprezentacja nie służy wyłącznie przechowywaniu informacji, lecz również organizacji procesów obliczeniowych.

### 5.2. Integracja procesów poznawczych

Jednym z kluczowych założeń OpenCog jest współdziałanie wielu mechanizmów poznawczych za pośrednictwem wspólnej reprezentacji. W systemie mogą współistnieć moduły logiki probabilistycznej, przetwarzania języka naturalnego, alokacji uwagi, planowania i uczenia programów. To podejście różni się od klasycznych architektur, które zwykle posiadają wyraźnie wydzielony rdzeń sterowania i określony format pamięci. W OpenCog nacisk położono na synergię poznawczą, czyli wzajemne wzmacnianie się wielu procesów dzięki współdzieleniu wiedzy.

### 5.3. Znaczenie dla robotyki poznawczej

W kontekście robotyki poznawczej OpenCog jest interesujący przede wszystkim tam, gdzie system ma łączyć informacje językowe, społeczne, semantyczne i sensoryczne. Robot działający w środowisku domowym lub społecznym nie może polegać wyłącznie na prostych procedurach zadaniowych. Musi także interpretować normy społeczne, rozumieć kontekst wypowiedzi, reprezentować cele innych osób i działać przy niepełnej wiedzy. Hipergrafowa reprezentacja wiedzy dobrze nadaje się do modelowania złożonych relacji tego typu.

### 5.4. Przykład praktyczny

Załóżmy, że robot domowy otrzymuje polecenie: „Przynieś okulary z salonu, ale nie budź dziecka, jeśli śpi”. Realizacja takiego zadania wymaga połączenia kilku klas wiedzy. Robot musi rozumieć, czym są okulary i gdzie zwykle się znajdują. Musi znać relację między pojęciami salon, dziecko i sen. Musi też interpretować normę „nie budź dziecka” jako warunek nadrzędny wobec prostego wykonania polecenia. Ponadto nie ma pełnej pewności co do stanu dziecka, ponieważ informacje percepcyjne mogą być niejednoznaczne.

W OpenCog taki problem można reprezentować jako sieć powiązań między obiektami, celami, warunkami i stopniami pewności. Dzięki temu system może jednocześnie rozważać semantykę polecenia, warunki kontekstowe, probabilistyczną ocenę sytuacji oraz plan działania. To pokazuje, że OpenCog może być użyteczny w środowiskach bogatych semantycznie, choć jego wdrożenie jest bardziej złożone niż w przypadku architektur ściślej zdefiniowanych.

### 5.5. Ograniczenia

OpenCog ma charakter bardziej eksperymentalny i bardziej heterogeniczny niż ACT-R czy Soar. Oznacza to większą swobodę reprezentacyjną, ale także większy koszt integracji, trudniejszą walidację i mniejszą standaryzację metod projektowania. Z perspektywy inżynierskiej może to być wada, zwłaszcza w projektach wymagających dużej przewidywalności i ograniczonych kosztów wdrożenia.

## 6. Porównanie ACT-R, Soar i OpenCog

ACT-R, Soar i OpenCog reprezentują trzy różne sposoby myślenia o architekturze kognitywnej. ACT-R jest najsilniej zakorzeniony w psychologii poznawczej i szczególnie dobrze nadaje się do modelowania procesów takich jak pamięć, uwaga i wykonywanie procedur. Soar stanowi architekturę ogólnego działania, kładąc nacisk na rozwiązywanie problemów, wybór operatorów i uczenie proceduralne. OpenCog jest z kolei środowiskiem integracyjnym, które próbuje łączyć wiele rodzajów reprezentacji i wnioskowania w jednej przestrzeni wiedzy.

Jeżeli kryterium oceny stanowi zgodność z danymi eksperymentalnymi dotyczącymi człowieka, ACT-R ma wyraźną przewagę. Jeżeli najważniejsze jest sterowanie zadaniowe i interpretowalna organizacja decyzji, Soar okazuje się szczególnie przydatny. Jeżeli natomiast system ma przetwarzać bardzo różnorodne informacje i operować na bogatych relacjach semantycznych, OpenCog oferuje większą elastyczność. Równocześnie należy podkreślić, że żadna z tych architektur nie stanowi samowystarczalnego rozwiązania dla wszystkich problemów współczesnej robotyki. W praktyce każda z nich wymaga integracji z dodatkowymi komponentami percepcyjnymi, sterującymi i uczącymi się.

## 7. Robotyka poznawcza

Robotyka poznawcza jest dziedziną zajmującą się budową robotów zdolnych do działania, które wykracza poza prostą reakcję na bodźce. Vernon, Metta i Sandini (2007) definiują robotykę poznawczą jako obszar badań nad systemami, które potrafią rozwijać i wykorzystywać wiedzę o świecie, o sobie samych oraz o innych agentach. Oznacza to, że robot poznawczy powinien posiadać model świata, pamięć doświadczeń, zdolność planowania, interpretację celów i możliwość adaptacji zachowania.

W odróżnieniu od klasycznej robotyki przemysłowej, gdzie wiele zadań odbywa się w środowiskach silnie kontrolowanych, robotyka poznawcza dotyczy środowisk otwartych, niepewnych i często społecznych. W takich warunkach nie wystarcza jedynie precyzyjne sterowanie trajektorią. Potrzebne są również mechanizmy rozumowania, przewidywania, selekcji celów, komunikacji i pamięci. Architektura kognitywna staje się więc centralnym elementem całego systemu robotycznego.

## 8. Modele architektoniczne dla robotyki poznawczej

### 8.1. Architektury trójwarstwowe

Jednym z najbardziej rozpowszechnionych wzorców są architektury trójwarstwowe. Składają się one z warstwy reaktywnej, wykonawczej i deliberatywnej. Warstwa reaktywna odpowiada za szybkie reakcje na zdarzenia w środowisku, takie jak zatrzymanie awaryjne, stabilizacja ruchu czy unikanie kolizji. Warstwa deliberatywna zajmuje się planowaniem, reprezentacją celów i modelem świata. Warstwa wykonawcza pośredniczy między tymi poziomami, monitorując realizację planu i nadzorując wykonywanie sekwencji działań.

Taka organizacja ma istotne zalety praktyczne. Pozwala oddzielić decyzje wymagające natychmiastowej odpowiedzi od wolniejszych procesów planistycznych. W robocie dostawczym poruszającym się po szpitalu warstwa deliberatywna może decydować o kolejności dostaw, warstwa wykonawcza zarządzać realizacją misji, a warstwa reaktywna natychmiast zatrzymywać robota w przypadku pojawienia się człowieka na trasie przejazdu.

### 8.2. Architektury hybrydowe

Współczesna robotyka poznawcza coraz częściej odchodzi od prostego podziału na podejście reaktywne i deliberatywne. Badacze wskazują, że skuteczne systemy muszą integrować także komponenty uczące się, probabilistyczne i adaptacyjne. Architektury hybrydowe łączą zatem planowanie symboliczne, kontrolę reaktywną i uczenie statystyczne. Pozwala to wykorzystać zalety różnych paradygmatów, zachowując jednocześnie zdolność działania w czasie rzeczywistym.

Przykładem może być cobot montażowy pracujący z człowiekiem. Warstwa percepcyjna oparta na modelach uczenia maszynowego rozpoznaje położenie części i postawę partnera. Warstwa symboliczna planuje kolejność operacji montażowych. Warstwa reaktywna kontroluje bezpieczeństwo i płynnie koryguje ruch. Architektura hybrydowa jest tu bardziej realistyczna niż jakiekolwiek podejście jednorodne.

### 8.3. 4D/RCS

4D/RCS, rozwijana między innymi w środowisku NIST, jest przykładem hierarchicznej architektury dla systemów autonomicznych. Albus (2003) opisywał ją jako wielopoziomowy system kontroli oparty na modelach świata i zachowania. Każdy poziom hierarchii integruje percepcję, ocenę sytuacji, planowanie i generowanie poleceń dla poziomu niższego. Architektura ta dobrze nadaje się do dużych systemów autonomicznych, takich jak pojazdy bezzałogowe czy złożone roboty mobilne.

Jej zaletą jest skalowalność oraz możliwość rozdzielania problemów na poziomy abstrakcji. Z drugiej strony, jak w każdej architekturze silnie modelowej, istnieje ryzyko, że reprezentacja świata będzie dezaktualizować się szybciej niż zachodzi planowanie. Problem ten jest szczególnie istotny w dynamicznych środowiskach.

### 8.4. DAC i podejścia ucieleśnione

Inny kierunek rozwoju reprezentują architektury inspirowane podejściem ucieleśnionym, takie jak DAC, czyli Distributed Adaptive Control. Verschure (2012) akcentował, że inteligencja nie powinna być rozumiana wyłącznie jako manipulacja symbolami, lecz jako dynamiczna regulacja relacji między agentem, jego ciałem i środowiskiem. W robotyce społecznej i współpracy człowiek-robot takie podejście okazuje się szczególnie cenne, ponieważ podkreśla rolę interakcji, motywacji, regulacji i adaptacji.

### 8.5. Pamięć w robotyce poznawczej

Jednym z kluczowych problemów współczesnych architektur robotycznych jest organizacja pamięci. Robot działający długookresowo nie może opierać się wyłącznie na bieżącej percepcji. Musi przechowywać doświadczenia, mapy środowiska, historię interakcji, znaczenie pojęć oraz predykcje dotyczące przyszłych stanów. Asfour i współpracownicy (2023) wskazują, że systemy pamięci w robotyce poznawczej powinny być multimodalne, hierarchiczne i zdolne do szybkiego odwoływania się do istotnych epizodów.

Dobrym przykładem jest humanoid uczący się przygotowywania herbaty. Robot taki powinien pamiętać położenie naczyń i czajnika, kolejność kroków, instrukcje językowe oraz skutki wcześniejszych prób. Pamięć pełni tu rolę nie tylko magazynu faktów, ale zasobu wspierającego kontrolę działania.

## 9. Praktyczne zastosowania architektur kognitywnych w robotyce

### 9.1. Robot asystujący seniorowi

Robot wspomagający osobę starszą musi interpretować polecenia, pamiętać rutyny dnia, rozpoznawać sytuacje nietypowe i prowadzić dialog. ACT-R może być przydatny tam, gdzie istotne są modele uwagi, pamięci i interakcji społecznej. Soar sprawdza się, jeśli robot realizuje złożone procedury opiekuńcze i musi zarządzać wieloma zadaniami. OpenCog może natomiast okazać się użyteczny w bogatym środowisku społecznym, gdzie potrzebna jest rozbudowana reprezentacja relacji, norm i kontekstu.

### 9.2. Robot przemysłowy współpracujący z człowiekiem

W środowisku przemysłowym robot współpracujący z człowiekiem musi jednocześnie realizować cele produkcyjne, przewidywać zachowania partnera i zachowywać bezpieczeństwo. Architektura hybrydowa wydaje się tu rozwiązaniem najbardziej praktycznym. Warstwa reaktywna odpowiada za bezpieczeństwo i bieżące dostosowanie ruchu. Warstwa poznawcza planuje zadania i interpretuje stan procesu. Warstwa pamięciowa uczy się preferencji operatora oraz typowych sekwencji montażowych.

### 9.3. Robot mobilny i pojazd autonomiczny

W pojazdach autonomicznych i robotach mobilnych szczególne znaczenie ma hierarchiczna integracja percepcji, modelowania świata, planowania misji, planowania lokalnego i kontroli ruchu. Architektury takie jak 4D/RCS oferują tu czytelny wzorzec organizacyjny. Soar może pełnić rolę komponentu odpowiedzialnego za wybór celów i zarządzanie zadaniami, ale nie zastępuje algorytmów lokalizacji, planowania trajektorii czy sterowania niskopoziomowego.

## 10. Główne problemy badawcze

W badaniach nad architekturami kognitywnymi i robotyką poznawczą można wyróżnić kilka centralnych napięć teoretycznych i praktycznych. Pierwsze dotyczy relacji między podejściami symbolicznymi i subsymbolicznymi. Systemy symboliczne są interpretowalne i wspierają planowanie oraz uzasadnianie decyzji, lecz mają trudności z przetwarzaniem surowych danych percepcyjnych. Systemy neuronowe są bardzo skuteczne percepcyjnie, ale zwykle nie oferują równie przejrzystych struktur reprezentacyjnych. W rezultacie najważniejszym kierunkiem rozwoju stają się dziś systemy hybrydowe.

Drugie napięcie dotyczy relacji między modelowaniem człowieka a budową skutecznego agenta technicznego. ACT-R z założenia dąży do zgodności z psychologią poznawczą. W robotyce przemysłowej czy autonomicznej nie zawsze jest to priorytet. Często ważniejsze są niezawodność, bezpieczeństwo i skalowalność. Z tego względu architektury bardziej psychologiczne i bardziej inżynierskie pełnią częściowo odmienne funkcje.

Trzecim problemem jest kwestia ogólności. Im bardziej architektura jest ogólna, tym trudniej ją zoptymalizować dla konkretnego zastosowania. Im bardziej jest wyspecjalizowana, tym łatwiej ją wdrożyć, ale trudniej przenieść do innych domen. Problem ten wyraźnie widać przy porównaniu OpenCog z bardziej zamkniętymi i stabilnymi architekturami, takimi jak ACT-R i Soar.

## 11. Wnioski

Architektury kognitywne pozostają jednym z najważniejszych obszarów badań łączących psychologię poznawczą, sztuczną inteligencję i robotykę. ACT-R wnosi precyzyjny model pamięci, uwagi i wykonywania procedur, a jego siłą jest związek z danymi empirycznymi dotyczącymi człowieka. Soar oferuje dojrzały mechanizm organizacji działania w kategoriach stanów i operatorów oraz skuteczne uczenie proceduralne przez chunking. OpenCog reprezentuje bardziej integracyjny i ambitny kierunek, ukierunkowany na łączenie wielu typów reprezentacji i procesów poznawczych.

Z perspektywy robotyki poznawczej najważniejszy wniosek jest następujący: skuteczny robot poznawczy rzadko opiera się na jednym czystym paradygmacie. Najbardziej obiecujące systemy łączą modele symboliczne, statystyczne i reaktywne. Korzystają z bogatej pamięci, wielopoziomowego planowania, uczenia się na podstawie doświadczenia i szybkich mechanizmów bezpieczeństwa. Właśnie dlatego przyszłość robotyki poznawczej należy prawdopodobnie do architektur hybrydowych, które potrafią połączyć interpretowalność i strukturę z elastycznością oraz zdolnością uczenia.

## Bibliografia

Albus, J. S. (2003). *4D/RCS: A reference model architecture for intelligent unmanned ground vehicles*. National Institute of Standards and Technology.

Anderson, J. R. (2007). *How can the human mind occur in the physical universe?* Oxford University Press.

Anderson, J. R., & Lebiere, C. (1998). *The atomic components of thought*. Lawrence Erlbaum Associates.

Asfour, T., Azad, P., Bäuml, B., Dillmann, R., Scherbaum, A., & colleagues. (2023). Memory systems in cognitive robotics and embodied AI. *Robotics and Autonomous Systems, 164*, 104398.

Goertzel, B., Pennachin, C., & Geisweiller, N. (Eds.). (2014). *Engineering general intelligence, Part 2: The CogPrime architecture for integrative, embodied AGI*. Atlantis Press.

Laird, J. E. (2012). *The Soar cognitive architecture*. MIT Press.

Newell, A. (1990). *Unified theories of cognition*. Harvard University Press.

Vernon, D., Metta, G., & Sandini, G. (2007). A survey of artificial cognitive systems: Implications for the autonomous development of mental capabilities in computational agents. *IEEE Transactions on Evolutionary Computation, 11*(2), 151-180.

Verschure, P. F. M. J. (2012). Distributed adaptive control: A theory of the mind, brain, body nexus. *Biologically Inspired Cognitive Architectures, 1*, 55-72.