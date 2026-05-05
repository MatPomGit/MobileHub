'use strict';

const fs = require('fs');
const path = require('path');

// Lista wykładów live mapowanych 1:1 na odpowiadające pliki PDF.
const lectures = [
  { file: 'w01-intro-live.html', title: 'W1 – Wprowadzenie do PAM', pdf: 'pam_w01_intro.pdf' },
  { file: 'w02-hardware-live.html', title: 'W2 – Sprzęt mobilny i ograniczenia', pdf: 'pam_w02_hardware.pdf' },
  { file: 'w03-ui-live.html', title: 'W3 – UI/UX na urządzeniach mobilnych', pdf: 'pam_w03_ui.pdf' },
  { file: 'w04-native-live.html', title: 'W4 – Programowanie natywne', pdf: 'pam_w04_natywne.pdf' },
  { file: 'w05-cross-live.html', title: 'W5 – Cross-platform', pdf: 'pam_w05_cross.pdf' },
  { file: 'w06-sensors-live.html', title: 'W6 – Sensory i kontekst', pdf: 'pam_w06_sensors.pdf' },
  { file: 'w07-iot-live.html', title: 'W7 – IoT i aplikacje mobilne', pdf: 'pam_w07_IoT.pdf' },
  { file: 'w08-affective-live.html', title: 'W8 – Affective computing', pdf: 'pam_w08_affective.pdf' },
  { file: 'w09-xr-live.html', title: 'W9 – XR na urządzeniach mobilnych', pdf: 'pam_w09_xr.pdf' },
  { file: 'w10-games-live.html', title: 'W10 – Gry mobilne i game design', pdf: 'pam_w10_games.pdf' },
  { file: 'w11-robots-live.html', title: 'W11 – Robotyka mobilna i HRI', pdf: 'pam_w11_robots.pdf' }
];

function renderLecture(lecture) {
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
    <div class="slides lecture-template" data-lecture-template="pdf-sync" data-pdf-src="../../wyklady/${lecture.pdf}">
      <section class="slide-cover" data-section="otwarcie">
        <h1>${lecture.title}</h1>
        <p class="lecture-meta">Wersja live zsynchronizowana 1:1 z PDF: ${lecture.pdf}</p>
        <p>Każdy kolejny slajd jest renderowany bezpośrednio z odpowiadającej strony PDF.</p>
      </section>
      <section class="slide-block" data-loading-slide>
        <h2>Ładowanie slajdów PDF…</h2>
        <p>Jeśli ładowanie trwa długo, odśwież stronę lub sprawdź połączenie sieciowe.</p>
      </section>
    </div>
  </div>

  <script src="../vendor/reveal.js/dist/reveal.js" onerror="this.onerror=null;this.src='https://cdn.jsdelivr.net/npm/reveal.js@5/dist/reveal.js'"></script>
  <script src="https://cdn.jsdelivr.net/npm/pdfjs-dist@4.10.38/build/pdf.min.mjs" type="module"></script>
  <script src="live-reveal-enhancements.js"></script>
  <script type="module">
    // Renderuje każdą stronę PDF jako osobny slajd Reveal.js, zapewniając zgodność treści 1:1.
    async function renderPdfSlides() {
      const slidesRoot = document.querySelector('.slides[data-pdf-src]');
      if (!slidesRoot) return;

      const pdfSrc = slidesRoot.dataset.pdfSrc;
      const loadingSlide = slidesRoot.querySelector('[data-loading-slide]');

      const pdfjsModule = await import('https://cdn.jsdelivr.net/npm/pdfjs-dist@4.10.38/build/pdf.min.mjs');
      pdfjsModule.GlobalWorkerOptions.workerSrc = 'https://cdn.jsdelivr.net/npm/pdfjs-dist@4.10.38/build/pdf.worker.min.mjs';

      const pdf = await pdfjsModule.getDocument(pdfSrc).promise;

      for (let pageNumber = 1; pageNumber <= pdf.numPages; pageNumber += 1) {
        const page = await pdf.getPage(pageNumber);
        const viewport = page.getViewport({ scale: 1 });

        // Dobór skali do proporcji slajdu, aby tekst pozostał czytelny.
        const maxWidth = 1280;
        const maxHeight = 720;
        const scale = Math.min(maxWidth / viewport.width, maxHeight / viewport.height);
        const scaledViewport = page.getViewport({ scale });

        const canvas = document.createElement('canvas');
        const context = canvas.getContext('2d', { alpha: false });
        canvas.width = Math.floor(scaledViewport.width);
        canvas.height = Math.floor(scaledViewport.height);
        canvas.className = 'pdf-page-canvas';

        await page.render({ canvasContext: context, viewport: scaledViewport }).promise;

        const section = document.createElement('section');
        section.className = 'slide-block pdf-slide';
        section.dataset.section = 'pdf-page';

        const title = document.createElement('h2');
        title.textContent = 'Slajd ' + pageNumber;

        const wrapper = document.createElement('div');
        wrapper.className = 'pdf-slide-wrapper';
        wrapper.appendChild(canvas);

        section.appendChild(title);
        section.appendChild(wrapper);
        slidesRoot.appendChild(section);
      }

      if (loadingSlide) {
        loadingSlide.remove();
      }

      if (window.Reveal?.sync) {
        window.Reveal.sync();
      }
    }

    // Inicjalizuje Reveal.js po zakończeniu renderowania slajdów z PDF.
    async function initializeLecture() {
      await renderPdfSlides();
      initializeLiveReveal({
        transition: 'slide',
        backgroundTransition: 'fade',
        autoAnimate: false,
        presenterNotesEnabled: true,
      });
    }

    initializeLecture();
  </script>
</body>
</html>`;
}

for (const lecture of lectures) {
  const outputPath = path.join(__dirname, lecture.file);
  fs.writeFileSync(outputPath, `${renderLecture(lecture)}\n`, 'utf8');
  console.log(`Wygenerowano: ${lecture.file}`);
}
