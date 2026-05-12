/**
 * PAM WIKI — Tryb deweloperski
 * Katedra Informatyki · Politechnika Rzeszowska
 *
 * Aktywacja: kliknij 5 razy wiersz „Wersja aplikacji" w panelu ustawień.
 * Stan przechowywany w localStorage pod kluczem "pam-dev-mode".
 */

'use strict';

(function () {
    const LS_KEY = 'pam-dev-mode';

    /* ------------------------------------------------------------------ */
    /*  Sprawdź informacje o środowisku                                     */
    /* ------------------------------------------------------------------ */
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

        const isPWA = window.matchMedia('(display-mode: standalone)').matches
            || window.navigator.standalone === true;

        const lsKeys = [];
        for (let i = 0; i < localStorage.length; i++) {
            lsKeys.push(localStorage.key(i));
        }

        const theme = document.documentElement.getAttribute('data-theme') || localStorage.getItem('pam-theme') || 'domyślny';
        const appVersion = (document.querySelector('meta[name="app-version"]') || {}).content || '?';

        return {
            'Wersja aplikacji': 'PAM WIKI ' + appVersion,
            'Data kompilacji': document.lastModified,
            //'Tryb PWA': isPWA ? 'tak (standalone)' : 'nie (przeglądarka)',
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

    /* ------------------------------------------------------------------ */
    /*  Utwórz panel deweloperski                                           */
    /* ------------------------------------------------------------------ */
    function buildPanel() {
        if (document.getElementById('dev-panel')) return;

        /* Overlay */
        const overlay = document.createElement('div');
        overlay.id = 'dev-overlay';
        overlay.setAttribute('role', 'dialog');
        overlay.setAttribute('aria-modal', 'true');
        overlay.setAttribute('aria-label', 'Panel deweloperski');

        /* Panel */
        const panel = document.createElement('div');
        panel.id = 'dev-panel';

        /* Nagłówek */
        const header = document.createElement('div');
        header.id = 'dev-panel-header';
        header.innerHTML =
            '<span id="dev-panel-title"><i class="fa-solid fa-code" aria-hidden="true"></i> Tryb deweloperski</span>' +
            '<button id="dev-panel-close" aria-label="Zamknij panel deweloperski" title="Zamknij">✕</button>';

        /* Baner */
        const banner = document.createElement('div');
        banner.id = 'dev-panel-banner';
        banner.innerHTML =
            '<i class="fa-solid fa-triangle-exclamation" aria-hidden="true"></i>' +
            ' Jesteś w trybie deweloperskim. Te informacje są przeznaczone dla programistów.';

        /* Tabela informacji */
        const info = getDevInfo();
        const table = document.createElement('table');
        table.id = 'dev-info-table';
        table.setAttribute('aria-label', 'Informacje deweloperskie');

        Object.entries(info).forEach(function ([key, val]) {
            const tr = document.createElement('tr');
            const th = document.createElement('th');
            th.textContent = key;
            const td = document.createElement('td');
            td.textContent = val;
            tr.appendChild(th);
            tr.appendChild(td);
            table.appendChild(tr);
        });

        /* Stopka */
        const footer = document.createElement('div');
        footer.id = 'dev-panel-footer';

        const refreshBtn = document.createElement('button');
        refreshBtn.id = 'dev-panel-refresh';
        refreshBtn.innerHTML = '<i class="fa-solid fa-rotate-right" aria-hidden="true"></i> Odśwież dane';
        refreshBtn.addEventListener('click', function () {
            const tbody = document.getElementById('dev-info-table');
            if (!tbody) return;
            const rows = tbody.querySelectorAll('tr');
            const fresh = getDevInfo();
            const vals = Object.values(fresh);
            rows.forEach(function (tr, i) {
                if (vals[i] !== undefined) tr.querySelector('td').textContent = vals[i];
            });
        });

        const deactivateBtn = document.createElement('button');
        deactivateBtn.id = 'dev-panel-deactivate';
        deactivateBtn.innerHTML = '<i class="fa-solid fa-power-off" aria-hidden="true"></i> Wyłącz tryb dev';
        deactivateBtn.addEventListener('click', deactivateDev);

        footer.appendChild(refreshBtn);
        footer.appendChild(deactivateBtn);

        panel.appendChild(header);
        panel.appendChild(banner);
        panel.appendChild(table);
        panel.appendChild(footer);
        overlay.appendChild(panel);
        document.body.appendChild(overlay);

        /* Zamknij przez overlay */
        overlay.addEventListener('click', function (e) {
            if (e.target === overlay) closePanel();
        });

        document.getElementById('dev-panel-close').addEventListener('click', closePanel);

        /* Escape */
        document.addEventListener('keydown', onEscapeKey);

        requestAnimationFrame(function () {
            overlay.classList.add('dev-visible');
        });
    }

    function closePanel() {
        const overlay = document.getElementById('dev-overlay');
        if (!overlay) return;
        overlay.classList.remove('dev-visible');
        overlay.addEventListener('transitionend', function handler() {
            overlay.removeEventListener('transitionend', handler);
            overlay.remove();
        });
        document.removeEventListener('keydown', onEscapeKey);
    }

    function onEscapeKey(e) {
        if (e.key === 'Escape') closePanel();
    }

    /* ------------------------------------------------------------------ */
    /*  Aktywacja / deaktywacja                                             */
    /* ------------------------------------------------------------------ */
    function activateDev() {
        localStorage.setItem(LS_KEY, '1');
        markBadge(true);
        showStudenciTab();
    }

    function deactivateDev() {
        localStorage.removeItem(LS_KEY);
        markBadge(false);
        hideStudenciTab();
        closePanel();
    }

    function markBadge(active) {
        const trigger = document.getElementById('dev-mode-trigger');
        if (trigger) {
            if (active) {
                trigger.setAttribute('data-dev-active', 'true');
                trigger.title = 'Tryb deweloperski WŁĄCZONY – kliknij, aby wyłączyć';
            } else {
                trigger.removeAttribute('data-dev-active');
                trigger.title = 'Kliknij 5 razy, aby włączyć tryb deweloperski';
            }
        }
        /* Keep the header badge as a visual indicator */
        const headerBadge = document.getElementById('header-badge-kia');
        if (headerBadge) {
            if (active) {
                headerBadge.setAttribute('data-dev-active', 'true');
            } else {
                headerBadge.removeAttribute('data-dev-active');
            }
        }
    }

    /* ------------------------------------------------------------------ */
    /*  Zakładka Studenci                                                   */
    /* ------------------------------------------------------------------ */
    function showStudenciTab() {
        document.querySelectorAll('[data-tab="studenci"]').forEach(function (el) {
            el.classList.remove('dev-only-tab');
        });
    }

    function hideStudenciTab() {
        document.querySelectorAll('[data-tab="studenci"]').forEach(function (el) {
            el.classList.add('dev-only-tab');
        });
    }

    /* ------------------------------------------------------------------ */
    /*  Inicjalizacja                                                       */
    /* ------------------------------------------------------------------ */
    function init() {
        const trigger = document.getElementById('dev-mode-trigger');
        if (!trigger) return;

        /* Populate version text from meta tag */
        const versionBadge = trigger.querySelector('.dev-version-badge');
        const appVersion = (document.querySelector('meta[name="app-version"]') || {}).content || '?';
        if (versionBadge) {
            versionBadge.textContent = 'PAM WIKI ' + appVersion;
        }

        let tapCount = 0;
        let tapTimer = null;
        const TAPS_REQUIRED = 5;
        const TAP_WINDOW_MS = 2000;

        trigger.addEventListener('click', function () {
            if (localStorage.getItem(LS_KEY)) {
                /* Dev mode active: single click deactivates */
                deactivateDev();
                return;
            }

            /* Count taps towards activation */
            tapCount++;
            clearTimeout(tapTimer);

            if (tapCount >= TAPS_REQUIRED) {
                tapCount = 0;
                trigger.removeAttribute('data-taps-left');
                if (versionBadge) versionBadge.textContent = 'PAM WIKI ' + appVersion;
                activateDev();
            } else {
                const remaining = TAPS_REQUIRED - tapCount;
                trigger.setAttribute('data-taps-left', remaining);
                const form = remaining === 1 ? 'kliknięcie' : 'kliknięcia';
                if (versionBadge) versionBadge.textContent = 'Jeszcze\u00a0' + remaining + '\u00a0' + form;
                tapTimer = setTimeout(function () {
                    tapCount = 0;
                    trigger.removeAttribute('data-taps-left');
                    if (versionBadge) versionBadge.textContent = 'PAM WIKI ' + appVersion;
                }, TAP_WINDOW_MS);
            }
        });

        /* In web (non-PWA) mode, header badge acts as a single-click dev toggle */
        const headerBadge = document.getElementById('header-badge-kia');
        if (headerBadge) {
            headerBadge.addEventListener('click', function () {
                const isStandalone = window.matchMedia('(display-mode: standalone)').matches || Boolean(window.navigator.standalone);
                if (!isStandalone) {
                    if (localStorage.getItem(LS_KEY)) {
                        deactivateDev();
                    } else {
                        activateDev();
                    }
                }
            });
        }

        /* Restore persisted dev mode state */
        const isDevActive = localStorage.getItem(LS_KEY) === '1';
        markBadge(isDevActive);
        if (isDevActive) {
            showStudenciTab();
        } else {
            hideStudenciTab();
        }
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
    
}());
