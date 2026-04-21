/**
 * Wspólny moduł konfiguracji Reveal.js dla wykładów live.
 *
 * Założenia:
 * - automatycznie dodajemy fragmenty animacji do list, aby punkty pojawiały się sekwencyjnie,
 * - ustawiamy auto-animacje między slajdami,
 * - wymuszamy spójne przejścia dla wszystkich wykładów.
 */

'use strict';

/**
 * Oznacza elementy list jako fragmenty Reveal.js.
 * Dzięki temu kolejne punkty pojawiają się po naciśnięciu klawisza.
 */
function applyAnimatedFragments() {
    const lists = document.querySelectorAll('.slides section ul, .slides section ol');
    lists.forEach(list => {
        const items = list.querySelectorAll(':scope > li');
        items.forEach((item, index) => {
            if (!item.classList.contains('fragment')) {
                item.classList.add('fragment');
            }

            // Utrzymujemy stały porządek odsłaniania punktów wewnątrz jednej listy.
            item.setAttribute('data-fragment-index', String(index));
        });
    });
}

/**
 * Konfiguruje przejścia i auto-animacje pomiędzy slajdami głównymi.
 */
function applySlideTransitions() {
    const sections = document.querySelectorAll('.slides > section');
    sections.forEach((section, index) => {
        section.setAttribute('data-transition', 'slide');

        // Od drugiego slajdu aktywujemy auto-animate dla płynnych przejść.
        if (index > 0) {
            section.setAttribute('data-auto-animate', '');
            section.setAttribute('data-auto-animate-duration', '0.8');
        }
    });
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
    };

    const finalConfig = { ...baseConfig, ...customConfig };

    if (typeof window.Reveal === 'undefined') {
        // Komentarz diagnostyczny dla środowisk, gdzie nie udało się załadować biblioteki.
        console.error('Reveal.js nie jest dostępny. Sprawdź lokalne zasoby lub CDN fallback.');
        return;
    }

    Reveal.initialize(finalConfig);
}

window.initializeLiveReveal = initializeLiveReveal;
