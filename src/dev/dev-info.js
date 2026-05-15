'use strict';

(function initDevInfoNamespace() {
  const NS = (window.__pamDev = window.__pamDev || {});

  function getDevInfo() {
    const nav = navigator;
    const sw = 'serviceWorker' in nav;
    const swState = sw && nav.serviceWorker.controller
      ? 'aktywny (' + (nav.serviceWorker.controller.state || '?') + ')'
      : sw ? 'zarejestrowany (brak kontrolera)' : 'brak wsparcia';

    const connection = nav.connection || nav.mozConnection || nav.webkitConnection;
    const connInfo = connection
      ? (connection.effectiveType || '?') + ', downlink ' + (connection.downlink != null ? connection.downlink + ' Mbps' : '?')
      : 'brak API';

    const lsKeys = [];
    for (let i = 0; i < localStorage.length; i++) lsKeys.push(localStorage.key(i));

    const theme = document.documentElement.getAttribute('data-theme') || localStorage.getItem('pam-theme') || 'domyślny';
    const appVersion = (document.querySelector('meta[name="app-version"]') || {}).content || '?';

    return {
      'Wersja aplikacji': 'PAM WIKI ' + appVersion,
      'Data kompilacji': document.lastModified,
      'Service Worker': swState,
      'Przeglądarka': nav.userAgent,
      'Platforma': nav.platform || 'nieznana',
      'Język': nav.language || 'nieznany',
      'Połączenie': connInfo,
      'Rozdzielczość ekranu': screen.width + '×' + screen.height + ' (devicePixelRatio: ' + window.devicePixelRatio + ')',
      'Rozmiar okna': window.innerWidth + '×' + window.innerHeight + ' px',
      'Motyw': theme,
      'Klucze localStorage': lsKeys.length ? lsKeys.join(', ') : '(brak)',
    };
  }

  NS.info = { getDevInfo };
})();
