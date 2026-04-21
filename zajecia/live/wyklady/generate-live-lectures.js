'use strict';

const fs = require('fs');
const path = require('path');

// Wspólny opis 11 wykładów live. Każdy wykład ma cele, rdzeń wiedzy, case, błędy i quiz.
const lectures = [
  {
    file: 'w01-intro-live.html',
    title: 'W1 – Wprowadzenie do PAM',
    pdf: 'pam_w01_intro.pdf',
    goals: [
      'Rozumieć zakres przedmiotu i model zaliczenia.',
      'Wyjaśniać różnice między aplikacją natywną, webową i hybrydową.',
      'Umieć zaplanować semestralny projekt mobilny w iteracjach.'
    ],
    core: [
      {
        title: 'Definicja: aplikacja mobilna jako produkt',
        type: 'info-card',
        def: 'Aplikacja mobilna to usługa cyfrowa działająca w ograniczeniach urządzenia, sieci i kontekstu użytkownika.',
        ex: 'Przykład: aplikacja bankowa musi działać stabilnie przy słabym LTE i krótkich sesjach użytkownika.'
      },
      {
        title: 'Porównanie modeli dostarczania',
        type: 'comparison-grid',
        items: [
          ['Natywna', 'Wysoka wydajność i pełny dostęp do API systemu'],
          ['Cross-platform', 'Wspólna baza kodu i krótszy time-to-market'],
          ['PWA', 'Szybka dystrybucja, ale ograniczony dostęp do sensorów']
        ]
      },
      {
        title: 'Cykl życia projektu mobilnego',
        type: 'timeline',
        points: ['Discovery → wymagania', 'MVP → walidacja', 'Release → analityka', 'Utrzymanie → iteracje']
      },
      {
        title: 'Kryteria jakości technicznej',
        type: 'callout',
        calloutKind: 'exam',
        text: 'Na egzaminie rozróżniaj metryki: crash-free sessions, cold start time i retencję D7.'
      }
    ],
    caseStudy: 'Case: startup edukacyjny ograniczył zakres MVP do 3 ekranów, dzięki czemu w 4 tygodnie zebrał dane o retencji i uniknął przepalenia budżetu.',
    mistakes: ['Brak mierzalnych celów produktu.', 'Przeładowanie backlogu funkcjami bez walidacji.', 'Ignorowanie telemetryki od pierwszej wersji.'],
    quiz: ['Kiedy PWA jest lepszym wyborem niż aplikacja natywna?', 'Która metryka najwcześniej sygnalizuje problem UX po wdrożeniu?']
  },
  {
    file: 'w02-hardware-live.html', title: 'W2 – Sprzęt mobilny i ograniczenia', pdf: 'pam_w02_hardware.pdf',
    goals: ['Analizować wpływ CPU/GPU/NPU na architekturę aplikacji.', 'Dobierać formaty danych do ograniczeń RAM i storage.', 'Projektować funkcje energooszczędne.'],
    core: [
      { title: 'SoC: definicja i rola', type: 'info-card', def: 'SoC integruje CPU, GPU, NPU, modem i kontrolery pamięci.', ex: 'Przykład: inferencja modelu vision na NPU skraca czas i zużycie energii.' },
      { title: 'Porównanie pamięci', type: 'comparison-grid', items: [['RAM','Szybka, ulotna; krytyczna dla multitaskingu'],['UFS/SSD','Trwałe dane i cache aplikacji'],['Cache L1/L2','Minimalizuje opóźnienia CPU']]},
      { title: 'Budżet energetyczny sesji', type: 'timeline', points: ['Pobudzenie sensora','Przetwarzanie lokalne','Synchronizacja z chmurą','Uśpienie komponentów']},
      { title: 'Pułapka projektowa', type: 'callout', calloutKind: 'trap', text: 'Nie zakładaj stałej wydajności: throttling termiczny zmienia FPS i opóźnienia po kilku minutach obciążenia.' }
    ],
    caseStudy: 'Case: aplikacja AR obniżyła rozdzielczość śledzenia przy wzroście temperatury >42°C i utrzymała płynność 30 FPS.',
    mistakes: ['Brak testów na urządzeniach klasy low-end.', 'Przetwarzanie dużych obrazów bez downsamplingu.', 'Ciągłe odpytywanie GPS bez strategii duty cycle.'],
    quiz: ['Dlaczego NPU nie zawsze przyspiesza każdy model?', 'Który element najczęściej inicjuje thermal throttling?']
  },
  {
    file: 'w03-ui-live.html', title: 'W3 – UI/UX na urządzeniach mobilnych', pdf: 'pam_w03_ui.pdf',
    goals: ['Tworzyć interfejsy o wysokiej czytelności i dostępności.', 'Dobierać wzorce nawigacyjne do zadań użytkownika.', 'Interpretować wyniki testów użyteczności.'],
    core: [
      { title: 'Definicja affordance', type: 'info-card', def: 'Affordance to wskazówka wizualna sugerująca sposób interakcji z elementem UI.', ex: 'Przycisk z cieniem i etykietą „Zapisz” komunikuje klikalność i skutek akcji.' },
      { title: 'Nawigacja: porównanie', type: 'comparison-grid', items: [['Bottom tabs','Szybki dostęp do 3–5 głównych sekcji'],['Navigation drawer','Dla rzadziej używanych funkcji i dużej IA'],['Gesty pełnoekranowe','Wysoka płynność, ale ryzyko konfliktu z systemem']]},
      { title: 'Proces projektowania UX', type: 'timeline', points: ['Persona i scenariusze','Wireframe','Prototyp klikalny','Test i iteracja']},
      { title: 'Uwaga egzaminacyjna', type: 'callout', calloutKind: 'exam', text: 'Zapamiętaj kontrast minimalny WCAG: 4.5:1 dla tekstu podstawowego.' }
    ],
    caseStudy: 'Case: reorganizacja formularza rejestracji (2 kroki zamiast 5) podniosła completion rate z 52% do 78%.',
    mistakes: ['Nadmiar tekstu na ekranie.', 'Brak stanów błędu i podpowiedzi.', 'Testowanie tylko na emulatorze bez realnych użytkowników.'],
    quiz: ['Kiedy drawer jest lepszy niż tab bar?', 'Jak mierzyć skuteczność redesignu ekranu?']
  },
  {
    file: 'w04-native-live.html', title: 'W4 – Programowanie natywne', pdf: 'pam_w04_natywne.pdf',
    goals: ['Wyjaśniać zalety i koszty podejścia natywnego.', 'Dobierać wzorce MVVM/Clean do skali projektu.', 'Planować publikację i utrzymanie aplikacji.'],
    core: [
      { title: 'Definicja natywności', type: 'info-card', def: 'Aplikacja natywna jest tworzona w języku i SDK platformy docelowej.', ex: 'Android: Kotlin + Jetpack; iOS: Swift + SwiftUI/UIKit.' },
      { title: 'Wzorce architektoniczne', type: 'comparison-grid', items: [['MVC','Szybki start, trudniejsze utrzymanie'],['MVVM','Lepsza testowalność warstwy prezentacji'],['Clean Architecture','Wysoka modularność i separacja odpowiedzialności']]},
      { title: 'Cykl wydania', type: 'timeline', points: ['Branch feature','CI + testy','Beta/TestFlight','Publikacja + monitoring']},
      { title: 'Pułapka wdrożeniowa', type: 'callout', calloutKind: 'trap', text: 'Brak polityki wersjonowania API prowadzi do regresji po aktualizacji klienta.' }
    ],
    caseStudy: 'Case: zespół medyczny wdrożył feature flags i ograniczył ryzyko błędu krytycznego przy rollout do 5% użytkowników.',
    mistakes: ['Ciężka logika biznesowa w ViewController/Activity.', 'Brak monitoringu crashy po wydaniu.', 'Ręczne testowanie bez smoke testów CI.'],
    quiz: ['Dlaczego MVVM ułatwia testy?', 'Po co rollout progresywny zamiast pełnego release?']
  },
  {
    file: 'w05-cross-live.html', title: 'W5 – Cross-platform', pdf: 'pam_w05_cross.pdf',
    goals: ['Ocenić trade-off koszt/wydajność platform cross.', 'Rozdzielać kod współdzielony od natywnych integracji.', 'Planować migrację między technologiami.'],
    core: [
      { title: 'Definicja shared code', type: 'info-card', def: 'Shared code to część logiki i/lub UI współdzielona między platformami.', ex: 'Przykład: wspólna walidacja formularzy i warstwa API dla Android/iOS.' },
      { title: 'Flutter vs RN vs KMP', type: 'comparison-grid', items: [['Flutter','Własny silnik UI; spójny rendering'],['React Native','Szybki development JS/TS; zależność od bridge/runtime'],['KMP','Wspólna logika, UI zwykle natywny']]},
      { title: 'Strategia wdrożenia', type: 'timeline', points: ['POC technologii','MVP na 1 feature','Skalowanie modułów','Hardening i testy E2E']},
      { title: 'Uwaga egzaminacyjna', type: 'callout', calloutKind: 'exam', text: 'Na kolokwium uzasadnij wybór technologii metrykami: TTM, koszt utrzymania, latency UI.' }
    ],
    caseStudy: 'Case: firma retail wybrała KMP dla domeny koszyka i płatności, pozostawiając UI natywny dla kluczowych ekranów.',
    mistakes: ['Kopiowanie wzorców webowych 1:1 do mobile.', 'Brak polityki aktualizacji zależności pluginów.', 'Niedoszacowanie kosztu mostków natywnych.'],
    quiz: ['Kiedy KMP jest lepszy od Fluttera?', 'Co monitorować po wydaniu aplikacji cross-platform?']
  },
  {
    file: 'w06-sensors-live.html', title: 'W6 – Sensory i kontekst', pdf: 'pam_w06_sensors.pdf',
    goals: ['Rozpoznawać możliwości i ograniczenia sensorów.', 'Projektować filtrację i fuzję sygnałów.', 'Tworzyć funkcje kontekstowe z niskim poborem energii.'],
    core: [
      { title: 'Definicja fuzji sensorycznej', type: 'info-card', def: 'Fuzja sensoryczna łączy dane z wielu źródeł, by poprawić dokładność estymacji stanu.', ex: 'Łączenie IMU + GPS + barometru poprawia detekcję aktywności.' },
      { title: 'Porównanie sensorów', type: 'comparison-grid', items: [['Akcelerometr','Ruch liniowy, niski koszt energetyczny'],['Żyroskop','Orientacja kątowa, podatny na dryft'],['GPS','Pozycja globalna, wysoki pobór energii']]},
      { title: 'Pipeline danych sensora', type: 'timeline', points: ['Próbkowanie','Filtr dolnoprzepustowy','Ekstrakcja cech','Klasyfikacja zdarzeń']},
      { title: 'Pułapka implementacyjna', type: 'callout', calloutKind: 'trap', text: 'Stały sampling 100 Hz bez adaptacji szybko rozładowuje baterię i przegrzewa urządzenie.' }
    ],
    caseStudy: 'Case: aplikacja safety wykrywa upadki, łącząc threshold przyspieszenia i zmianę orientacji; false positive spadły o 27%.',
    mistakes: ['Brak kalibracji dla różnych modeli urządzeń.', 'Ignorowanie opóźnień buforowania.', 'Uczenie modelu bez danych z realnych warunków.'],
    quiz: ['Po co łączyć akcelerometr z żyroskopem?', 'Jak ograniczyć zużycie energii przy monitoringu ciągłym?']
  },
  {
    file: 'w07-iot-live.html', title: 'W7 – IoT i aplikacje mobilne', pdf: 'pam_w07_IoT.pdf',
    goals: ['Projektować architekturę mobile + IoT edge + chmura.', 'Dobierać protokoły MQTT/HTTP/BLE do scenariusza.', 'Wdrażać bezpieczne kanały telemetrii.'],
    core: [
      { title: 'Definicja digital twin', type: 'info-card', def: 'Digital twin to wirtualna reprezentacja urządzenia aktualizowana danymi telemetrycznymi.', ex: 'W aplikacji smart-home twin pokazuje stan czujnika, baterii i ostatnie alarmy.' },
      { title: 'Protokoły komunikacji', type: 'comparison-grid', items: [['MQTT','Lekki publish/subscribe, idealny dla telemetrii'],['HTTP/REST','Prosty request-response, szerokie wsparcie'],['BLE','Niskie zużycie energii, krótki zasięg']]},
      { title: 'Cykl danych IoT', type: 'timeline', points: ['Pomiar na edge','Broker/ingest','Reguły i alerty','Prezentacja mobilna']},
      { title: 'Uwaga egzaminacyjna', type: 'callout', calloutKind: 'exam', text: 'TLS + rotacja kluczy urządzeń to minimum bezpieczeństwa systemu IoT.' }
    ],
    caseStudy: 'Case: w hali produkcyjnej mobilny dashboard skrócił czas reakcji na alarm temperatury z 12 do 4 minut.',
    mistakes: ['Przechowywanie kluczy API wprost w aplikacji.', 'Brak retry/backoff przy niestabilnej sieci.', 'Brak modelu uprawnień dla wielu ról użytkowników.'],
    quiz: ['Dlaczego MQTT wygrywa przy dużej liczbie czujników?', 'Co powinien zawierać minimalny model telemetryczny?']
  },
  {
    file: 'w08-affective-live.html', title: 'W8 – Affective computing', pdf: 'pam_w08_affective.pdf',
    goals: ['Wyjaśniać podstawowe modele emocji (valence/arousal).', 'Budować pipeline detekcji emocji na mobile.', 'Ocenić ryzyka etyczne i prawne analizy afektu.'],
    core: [
      { title: 'Definicja affective computing', type: 'info-card', def: 'Affective computing to systemy, które rozpoznają, modelują lub reagują na stany emocjonalne użytkownika.', ex: 'Asystent głosowy może obniżyć tempo wypowiedzi po wykryciu stresu.' },
      { title: 'Źródła sygnału', type: 'comparison-grid', items: [['Głos','Cechy prosody: pitch, energia, tempo'],['Twarz','Mikroekspresje i landmarks'],['Fizjologia','HRV, GSR; wyższa inwazyjność']]},
      { title: 'Pipeline ML', type: 'timeline', points: ['Zbieranie danych','Anonimizacja','Ekstrakcja cech','Inferencja on-device/chmura']},
      { title: 'Pułapka etyczna', type: 'callout', calloutKind: 'trap', text: 'Model emocji nie jest „czytnikiem myśli”; wyniki to predykcje obarczone niepewnością i biasem.' }
    ],
    caseStudy: 'Case: aplikacja well-being używa tylko danych głosowych lokalnie, bez wysyłki audio do chmury, aby ograniczyć ryzyko prywatności.',
    mistakes: ['Brak świadomej zgody na analizę emocji.', 'Trenowanie modelu na nierównoważnych próbach kulturowych.', 'Nadmierna automatyzacja decyzji bez człowieka w pętli.'],
    quiz: ['Jak interpretować confidence score modelu emocji?', 'Kiedy przetwarzanie on-device jest lepsze niż cloud inference?']
  },
  {
    file: 'w09-xr-live.html', title: 'W9 – XR na urządzeniach mobilnych', pdf: 'pam_w09_xr.pdf',
    goals: ['Rozróżniać AR, VR i MR w praktyce inżynierskiej.', 'Projektować interakcje 3D przy zachowaniu ergonomii.', 'Optymalizować rendering i tracking.'],
    core: [
      { title: 'Definicja XR', type: 'info-card', def: 'XR to parasol obejmujący AR, VR i MR, łączący świat fizyczny i cyfrowy.', ex: 'AR w serwisie maszyn nakłada instrukcję montażu na obraz kamery.' },
      { title: 'Platformy XR', type: 'comparison-grid', items: [['ARCore','Android, śledzenie płaszczyzn i anchorów'],['ARKit','iOS, stabilny tracking i occlusion'],['WebXR','Dostęp przez przeglądarkę, niższa kontrola sprzętu']]},
      { title: 'Cykl sesji AR', type: 'timeline', points: ['Init kamery','SLAM i mapowanie','Zakotwiczenie obiektu','Interakcja i zapis stanu']},
      { title: 'Uwaga egzaminacyjna', type: 'callout', calloutKind: 'exam', text: 'W XR krytyczne są latency ruchu i komfort użytkownika; celuj w stabilne 60 FPS.' }
    ],
    caseStudy: 'Case: aplikacja szkoleniowa AR skróciła czas wdrożenia operatora linii o 18% dzięki instrukcjom kontekstowym 3D.',
    mistakes: ['Przeładowanie sceny efektami.', 'Brak fallbacku przy słabym oświetleniu.', 'Ignorowanie ergonomii chwytu telefonu podczas długiej sesji.'],
    quiz: ['Co powoduje „pływanie” obiektu AR?', 'Jakie dwa KPI najlepiej opisują jakość sesji XR?']
  },
  {
    file: 'w10-games-live.html', title: 'W10 – Gry mobilne i game design', pdf: 'pam_w10_games.pdf',
    goals: ['Projektować core loop i onboarding gracza.', 'Łączyć monetyzację z etyką UX.', 'Wykorzystywać analitykę do live-ops.'],
    core: [
      { title: 'Definicja core loop', type: 'info-card', def: 'Core loop to powtarzalny cykl akcji, nagrody i progresu utrzymujący zaangażowanie gracza.', ex: 'Walcz → zdobywaj zasoby → ulepszaj postać → odblokuj nową misję.' },
      { title: 'Modele monetyzacji', type: 'comparison-grid', items: [['Premium','Jednorazowy zakup, przewidywalny UX'],['F2P + IAP','Wysoka skala, ryzyko paywalli'],['Ads-hybrid','Niższy próg wejścia, ale możliwa frustracja']]},
      { title: 'Cykl live-ops', type: 'timeline', points: ['Wydarzenie sezonowe','Pomiar KPI','Balans ekonomii','Patch i komunikacja']},
      { title: 'Pułapka designerska', type: 'callout', calloutKind: 'trap', text: 'Nadmierna liczba walut i ekranów sklepu obniża retencję D1 przez przeciążenie poznawcze.' }
    ],
    caseStudy: 'Case: po skróceniu tutoriala do 90 sekund retencja D1 wzrosła z 31% do 44% bez zmiany budżetu UA.',
    mistakes: ['Brak celów na pierwsze 5 minut gry.', 'Balans ekonomii bez testów A/B.', 'Optymalizacja tylko pod high-end GPU.'],
    quiz: ['Który KPI opisuje długoterminowe utrzymanie gracza?', 'Jak odróżnić zdrową monetyzację od dark pattern?']
  },
  {
    file: 'w11-robots-live.html', title: 'W11 – Robotyka mobilna i HRI', pdf: 'pam_w11_robots.pdf',
    goals: ['Łączyć aplikacje mobilne z robotem przez bezpieczne API.', 'Wyjaśniać pipeline percepcja–planowanie–sterowanie.', 'Projektować interfejs operatora odporny na błędy.'],
    core: [
      { title: 'Definicja HRI', type: 'info-card', def: 'Human-Robot Interaction bada i projektuje sposób komunikacji człowieka z robotem.', ex: 'Panel mobilny może udostępniać tryby: manualny, półautonomiczny i awaryjny.' },
      { title: 'Warstwy systemu robota', type: 'comparison-grid', items: [['Percepcja','Kamery/LiDAR i estymacja otoczenia'],['Planowanie','Wyznaczanie trajektorii i decyzji'],['Sterowanie','Wykonanie ruchu z pętlą sprzężenia']]},
      { title: 'Cykl zadania autonomicznego', type: 'timeline', points: ['Sense','Model world state','Plan','Act + replan']},
      { title: 'Uwaga egzaminacyjna', type: 'callout', calloutKind: 'exam', text: 'W systemach safety-critical zawsze definiuj stan fail-safe i procedurę ręcznego przejęcia.' }
    ],
    caseStudy: 'Case: robot magazynowy z panelem mobilnym operatora skrócił czas interwencji serwisowej o 22% dzięki diagnostyce krok-po-kroku.',
    mistakes: ['Brak walidacji komend krytycznych.', 'Brak czytelnego statusu połączenia i opóźnień.', 'Niewystarczające logowanie zdarzeń bezpieczeństwa.'],
    quiz: ['Dlaczego fail-safe to wymóg architektoniczny, a nie opcja?', 'Jakie dane powinny być widoczne operatorowi w czasie rzeczywistym?']
  }
];

function renderCoreSlide(item) {
  if (item.type === 'info-card') {
    return `<section class="slide-block core knowledge-slide" data-section="rdzen-wiedzy"><h2>${item.title}</h2><article class="info-card"><h3>Definicja</h3><p>${item.def}</p><h3>Przykład inżynierski</h3><p>${item.ex}</p></article></section>`;
  }

  if (item.type === 'comparison-grid') {
    const rows = item.items.map(([a, b]) => `<div class="comparison-row"><div>${a}</div><div>${b}</div></div>`).join('');
    return `<section class="slide-block core knowledge-slide" data-section="rdzen-wiedzy"><h2>${item.title}</h2><div class="comparison-grid"><div class="comparison-header"><div>Opcja</div><div>Konsekwencje projektowe</div></div>${rows}</div></section>`;
  }

  if (item.type === 'timeline') {
    const points = item.points.map(point => `<li>${point}</li>`).join('');
    return `<section class="slide-block core knowledge-slide" data-section="rdzen-wiedzy"><h2>${item.title}</h2><ol class="timeline">${points}</ol></section>`;
  }

  if (item.type === 'callout') {
    const label = item.calloutKind === 'exam' ? 'Uwaga egzaminacyjna' : 'Pułapka projektowa';
    return `<section class="slide-block core knowledge-slide" data-section="rdzen-wiedzy"><h2>${item.title}</h2><aside class="callout ${item.calloutKind}"><strong>${label}:</strong> ${item.text}</aside></section>`;
  }

  return '';
}

function renderLecture(lecture) {
  const coreSlides = lecture.core.map(renderCoreSlide).join('\n');
  const mistakes = lecture.mistakes.map(item => `<li>${item}</li>`).join('');
  const quiz = lecture.quiz.map(item => `<li>${item}</li>`).join('');

  return `<!DOCTYPE html>
<html lang="pl">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${lecture.title} (live)</title>
  <link rel="stylesheet" href="../vendor/reveal.js/dist/reveal.css" onerror="this.onerror=null;this.href='https://cdn.jsdelivr.net/npm/reveal.js@5/dist/reveal.css'">
  <link rel="stylesheet" href="../vendor/reveal.js/dist/theme/black.css" id="theme-link" onerror="this.onerror=null;this.href='https://cdn.jsdelivr.net/npm/reveal.js@5/dist/theme/black.css'">
  <link rel="stylesheet" href="live-theme.css">
</head>
<body>
  <div class="reveal">
    <div class="slides lecture-template" data-lecture-template="v2">
      <section class="slide-cover" data-section="otwarcie">
        <h1>${lecture.title}</h1>
        <p class="lecture-meta">Wersja live oparta o PDF: ${lecture.pdf}</p>
        <p>Tryb prowadzącego: <kbd>P</kbd> panel • <kbd>T</kbd> timer • <kbd>N</kbd> notatki.</p>
      </section>

      <section class="slide-block goals-slide" data-section="cele-efekty">
        <h2>Cele i efekty uczenia</h2>
        <ul>${lecture.goals.map(goal => `<li>${goal}</li>`).join('')}</ul>
      </section>

      ${coreSlides}

      <section class="slide-block case-study-slide" data-section="case-study">
        <h2>Case study / praktyka inżynierska</h2>
        <article class="info-card"><h3>Sytuacja projektowa</h3><p>${lecture.caseStudy}</p></article>
      </section>

      <section class="slide-block mistakes-slide" data-section="najczestsze-bledy">
        <h2>Najczęstsze błędy</h2>
        <aside class="callout trap"><strong>Antywzorce, których unikamy:</strong> ich koszt to dług techniczny i spadek jakości produktu.</aside>
        <ul>${mistakes}</ul>
      </section>

      <section class="slide-block quiz-slide" data-section="quiz">
        <h2>Pytania kontrolne + mini quiz</h2>
        <div class="quiz-checkpoint"><h3>Checkpoint</h3><ol>${quiz}</ol></div>
      </section>
    </div>
  </div>

  <script src="../vendor/reveal.js/dist/reveal.js" onerror="this.onerror=null;this.src='https://cdn.jsdelivr.net/npm/reveal.js@5/dist/reveal.js'"></script>
  <script src="live-reveal-enhancements.js"></script>
  <script>
    function initializeLecture() {
      initializeLiveReveal({
        transition: 'slide',
        backgroundTransition: 'fade',
        autoAnimate: true,
        autoAnimateDuration: 0.8,
        presenterNotesEnabled: true,
      });
    }

    if (typeof window.Reveal === 'undefined') {
      const fallbackScript = document.createElement('script');
      fallbackScript.src = 'https://unpkg.com/reveal.js@5/dist/reveal.js';
      fallbackScript.onload = initializeLecture;
      document.body.appendChild(fallbackScript);
    } else {
      initializeLecture();
    }
  </script>
</body>
</html>`;
}

for (const lecture of lectures) {
  const outputPath = path.join(__dirname, lecture.file);
  fs.writeFileSync(outputPath, `${renderLecture(lecture)}\n`, 'utf8');
  console.log(`Wygenerowano: ${lecture.file}`);
}
