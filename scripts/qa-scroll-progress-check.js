/**
 * QA: Weryfikuje, że pasek postępu przewijania istnieje dokładnie raz.
 * Skrypt uruchamiany w przeglądarce po załadowaniu DOM.
 */
(function runScrollProgressUniquenessCheck() {
  const assertSingleScrollProgress = () => {
    // Asercja integralności DOM: pasek postępu ma być pojedynczą instancją.
    console.assert(
      document.querySelectorAll('.scroll-progress').length === 1,
      "QA failure: expected exactly one '.scroll-progress' element in DOM"
    );
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', assertSingleScrollProgress, { once: true });
    return;
  }

  assertSingleScrollProgress();
})();
