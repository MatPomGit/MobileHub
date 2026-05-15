'use strict';

(function initDevControllerNamespace() {
  const NS = (window.__pamDev = window.__pamDev || {});

  function activateDev() {
    const activationCount = NS.state.activate();
    NS.view.setDevVisualState(true);
    NS.view.showDevTabs(activationCount >= 3);
  }

  function deactivateDev() {
    NS.state.deactivate();
    NS.view.setDevVisualState(false);
    NS.view.hideDevTabs();
    NS.view.closePanel();
  }

  function initDevMode() {
    if (window.__pamDevModeInitialized) return;
    window.__pamDevModeInitialized = true;

    const trigger = document.getElementById('dev-mode-trigger');
    if (!trigger) return;

    const versionBadge = trigger.querySelector('.dev-version-badge');
    const appVersion = (document.querySelector('meta[name="app-version"]') || {}).content || '?';
    if (versionBadge) versionBadge.textContent = 'PAM WIKI ' + appVersion;

    let tapCount = 0;
    let tapTimer = null;
    const TAPS_REQUIRED = 5;
    const TAP_WINDOW_MS = 2000;

    trigger.addEventListener('click', function () {
      if (NS.state.isActive()) return deactivateDev();
      tapCount += 1;
      clearTimeout(tapTimer);
      if (tapCount >= TAPS_REQUIRED) {
        tapCount = 0;
        trigger.removeAttribute('data-taps-left');
        if (versionBadge) versionBadge.textContent = 'PAM WIKI ' + appVersion;
        activateDev();
      } else {
        const remaining = TAPS_REQUIRED - tapCount;
        trigger.setAttribute('data-taps-left', remaining);
        if (versionBadge) versionBadge.textContent = 'Jeszcze\u00a0' + remaining + '\u00a0' + (remaining === 1 ? 'kliknięcie' : 'kliknięcia');
        tapTimer = setTimeout(function () {
          tapCount = 0;
          trigger.removeAttribute('data-taps-left');
          if (versionBadge) versionBadge.textContent = 'PAM WIKI ' + appVersion;
        }, TAP_WINDOW_MS);
      }
    });

    const headerBadge = document.getElementById('header-badge-kia');
    if (headerBadge) {
      headerBadge.addEventListener('click', function () {
        const isStandalone = window.matchMedia('(display-mode: standalone)').matches || Boolean(window.navigator.standalone);
        if (isStandalone) return;
        if (NS.state.isActive()) deactivateDev();
        else activateDev();
      });
    }

    NS.view.setDevVisualState(false);
    NS.view.hideDevTabs();

    NS.controller = { activateDev, deactivateDev, openPanel: () => NS.view.renderPanel({ onDeactivate: deactivateDev }) };
  }

  window.initDevMode = initDevMode;
})();
