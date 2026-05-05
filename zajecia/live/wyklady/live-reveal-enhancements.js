/**
 * Wspólny moduł konfiguracji Reveal.js dla wykładów live.
 * Rozszerzenia: fragmenty, pasek prowadzącego, timer bloku, postęp sekcji i notatki prelegenta.
 */

'use strict';

/**
 * Oznacza elementy list jako fragmenty Reveal.js.
 * Dzięki temu punkty pojawiają się sekwencyjnie i nie przeciążają widoku.
 */
function applyAnimatedFragments() {
  const lists = document.querySelectorAll('.slides section ul, .slides section ol');
  lists.forEach(list => {
    const items = list.querySelectorAll(':scope > li');
    items.forEach((item, index) => {
      if (!item.classList.contains('fragment')) {
        item.classList.add('fragment');
      }
      item.setAttribute('data-fragment-index', String(index));
    });
  });
}

/**
 * Ustawia spójne przejścia i auto-animacje między slajdami.
 */
function applySlideTransitions() {
  const sections = document.querySelectorAll('.slides > section');
  sections.forEach((section, index) => {
    section.setAttribute('data-transition', 'slide');
    if (index > 0) {
      section.setAttribute('data-auto-animate', '');
      section.setAttribute('data-auto-animate-duration', '0.8');
    }
  });
}

/**
 * Formatuje sekundy do postaci mm:ss na potrzeby timera bloku.
 */
function formatTimer(totalSeconds) {
  const minutes = String(Math.floor(totalSeconds / 60)).padStart(2, '0');
  const seconds = String(totalSeconds % 60).padStart(2, '0');
  return `${minutes}:${seconds}`;
}

/**
 * Buduje panel prowadzącego (czas, sekcja, skróty).
 */
function createPresenterToolbar() {
  const toolbar = document.createElement('div');
  toolbar.className = 'presenter-toolbar';
  toolbar.innerHTML = `
    <div><strong>Tryb prowadzącego</strong></div>
    <div>Czas bloku: <span data-role="block-timer">00:00</span></div>
    <div>Sekcja: <span data-role="section-name">otwarcie</span></div>
    <div>Postęp sekcji: <span data-role="section-progress">1/1</span></div>
    <div>Skróty: P (panel) • T (timer) • N (notatki) • O (overview)</div>
  `;
  document.body.appendChild(toolbar);
  return toolbar;
}

/**
 * Tworzy kontener notatek prelegenta (opcjonalny, ukrywany skrótem N).
 */
function createPresenterNotes() {
  const notes = document.createElement('aside');
  notes.className = 'presenter-notes hidden';
  notes.innerHTML = '<strong>Notatki prelegenta:</strong> Brak notatek dla bieżącego slajdu.';
  document.body.appendChild(notes);
  return notes;
}

/**
 * Odczytuje notatkę slajdu z data-presenter-notes lub speaker notes Reveal.
 */
function resolveSlideNotes(slide) {
  if (!slide) return 'Brak notatek dla bieżącego slajdu.';
  const fromAttr = slide.getAttribute('data-presenter-notes');
  if (fromAttr && fromAttr.trim()) return fromAttr.trim();

  const noteElement = slide.querySelector('aside.notes');
  if (noteElement && noteElement.textContent.trim()) return noteElement.textContent.trim();

  return 'Brak notatek dla bieżącego slajdu.';
}

/**
 * Konfiguruje timer bloku i aktualizację postępu sekcji tematycznych.
 */
function setupPresenterUx(config) {
  const toolbar = createPresenterToolbar();
  const notesPanel = createPresenterNotes();

  let blockSeconds = 0;
  let timerHandle = null;
  let timerRunning = true;
  let toolbarVisible = true;

  const timerElement = toolbar.querySelector('[data-role="block-timer"]');
  const sectionNameElement = toolbar.querySelector('[data-role="section-name"]');
  const sectionProgressElement = toolbar.querySelector('[data-role="section-progress"]');

  const slides = Array.from(document.querySelectorAll('.slides > section'));
  function updateCurrentSlideState() {
    const currentSlide = Reveal.getCurrentSlide();
    const currentIndex = slides.indexOf(currentSlide);
    const currentSection = currentSlide?.getAttribute('data-section') || 'sekcja';
    sectionNameElement.textContent = currentSection;

    const sameSectionIndices = slides
      .map((slide, index) => ({ section: slide.getAttribute('data-section') || 'sekcja', index }))
      .filter(item => item.section === currentSection)
      .map(item => item.index);

    const currentSectionOrder = sameSectionIndices.indexOf(currentIndex) + 1;
    sectionProgressElement.textContent = `${currentSectionOrder}/${sameSectionIndices.length}`;

    notesPanel.innerHTML = `<strong>Notatki prelegenta:</strong> ${resolveSlideNotes(currentSlide)}`;
  }

  function startTimer() {
    if (timerHandle) return;
    timerHandle = window.setInterval(() => {
      if (timerRunning) {
        blockSeconds += 1;
        timerElement.textContent = formatTimer(blockSeconds);
      }
    }, 1000);
  }

  function resetTimer() {
    blockSeconds = 0;
    timerElement.textContent = '00:00';
  }

  function toggleNotes() {
    notesPanel.classList.toggle('hidden');
  }

  function toggleToolbar() {
    toolbarVisible = !toolbarVisible;
    toolbar.style.display = toolbarVisible ? 'block' : 'none';
  }

  function handleShortcuts(event) {
    const key = event.key.toLowerCase();
    if (key === 'p') {
      // Otwiera wbudowany widok prowadzącego Reveal.js.
      if (typeof Reveal.getPlugin === 'function' && Reveal.getPlugin('notes')) {
        Reveal.getPlugin('notes').open();
      } else {
        window.open(window.location.href + '?presenter', '_blank', 'noopener');
      }
    }

    if (key === 't') {
      timerRunning = !timerRunning;
    }

    if (key === 'r') {
      resetTimer();
    }

    if (key === 'n' && config.presenterNotesEnabled !== false) {
      toggleNotes();
    }

    if (key === 'o') {
      Reveal.toggleOverview();
    }

    if (key === 'h') {
      toggleToolbar();
    }
  }

  Reveal.on('slidechanged', () => {
    resetTimer();
    updateCurrentSlideState();
  });

  document.addEventListener('keydown', handleShortcuts);
  updateCurrentSlideState();
  startTimer();
}


/**
 * Zwraca listę pluginów Reveal dostępnych globalnie (np. Notes).
 */
function resolveRevealPlugins() {
  const plugins = [];
  if (typeof window.RevealNotes !== 'undefined') {
    plugins.push(window.RevealNotes);
  }
  return plugins;
}

/**
 * Inicjuje Reveal.js z rozszerzoną konfiguracją pod prowadzenie zajęć live.
 * @param {Object} customConfig - opcjonalne nadpisania konfiguracji Reveal.
 */
function initializeLiveReveal(customConfig = {}) {
  applyAnimatedFragments();
  applySlideTransitions();

  const baseConfig = {
    controls: true,
    progress: true,
    slideNumber: true,
    hash: true,
    keyboard: true,
    transition: 'slide',
    transitionSpeed: 'default',
    backgroundTransition: 'fade',
    autoAnimate: true,
    autoAnimateEasing: 'ease-in-out',
    autoAnimateDuration: 0.8,
    plugins: resolveRevealPlugins(),
  };

  const finalConfig = { ...baseConfig, ...customConfig };

  if (typeof window.Reveal === 'undefined') {
    console.error('Reveal.js nie jest dostępny. Sprawdź lokalne zasoby lub CDN fallback.');
    return;
  }

  Reveal.initialize(finalConfig).then(() => {
    setupPresenterUx(finalConfig);
  });
}

window.initializeLiveReveal = initializeLiveReveal;
