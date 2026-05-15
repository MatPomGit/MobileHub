'use strict';

(function initDevPanelViewNamespace() {
  const NS = (window.__pamDev = window.__pamDev || {});

  function renderPanel({ onDeactivate }) {
    if (document.getElementById('dev-panel')) return;
    const overlay = document.createElement('div');
    overlay.id = 'dev-overlay';
    overlay.setAttribute('role', 'dialog');
    overlay.setAttribute('aria-modal', 'true');
    overlay.setAttribute('aria-label', 'Panel deweloperski');

    const panel = document.createElement('div');
    panel.id = 'dev-panel';

    panel.innerHTML = '<div id="dev-panel-header"><span id="dev-panel-title"><i class="fa-solid fa-code" aria-hidden="true"></i> Tryb deweloperski</span><button id="dev-panel-close" aria-label="Zamknij panel deweloperski" title="Zamknij">✕</button></div><div id="dev-panel-banner"><i class="fa-solid fa-triangle-exclamation" aria-hidden="true"></i> Jesteś w trybie deweloperskim. Te informacje są przeznaczone dla programistów.</div><table id="dev-info-table" aria-label="Informacje deweloperskie"></table><div id="dev-panel-footer"><button id="dev-panel-refresh"><i class="fa-solid fa-rotate-right" aria-hidden="true"></i> Odśwież dane</button><button id="dev-panel-deactivate"><i class="fa-solid fa-power-off" aria-hidden="true"></i> Wyłącz tryb dev</button></div>';

    overlay.appendChild(panel);
    document.body.appendChild(overlay);
    refreshInfoTable();

    overlay.addEventListener('click', function (e) { if (e.target === overlay) closePanel(); });
    document.getElementById('dev-panel-close').addEventListener('click', closePanel);
    document.getElementById('dev-panel-refresh').addEventListener('click', refreshInfoTable);
    document.getElementById('dev-panel-deactivate').addEventListener('click', onDeactivate);
    document.addEventListener('keydown', onEscapeKey);
    requestAnimationFrame(function () { overlay.classList.add('dev-visible'); });
  }

  function refreshInfoTable() {
    const table = document.getElementById('dev-info-table');
    if (!table) return;
    table.innerHTML = '';
    const info = NS.info.getDevInfo();
    Object.entries(info).forEach(function ([key, val]) {
      const tr = document.createElement('tr');
      tr.innerHTML = '<th></th><td></td>';
      tr.querySelector('th').textContent = key;
      tr.querySelector('td').textContent = val;
      table.appendChild(tr);
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

  function onEscapeKey(e) { if (e.key === 'Escape') closePanel(); }

  function setDevVisualState(active) {
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
    const headerBadge = document.getElementById('header-badge-kia');
    if (headerBadge) {
      if (active) headerBadge.setAttribute('data-dev-active', 'true');
      else headerBadge.removeAttribute('data-dev-active');
    }
  }

  function showDevTabs(showZalTab) {
    document.querySelectorAll('[data-tab="studenci"]').forEach((el) => el.classList.remove('dev-only-tab'));
    document.querySelectorAll('[data-tab="zal"]').forEach((el) => el.classList.toggle('dev-only-tab', !showZalTab));
  }

  function hideDevTabs() {
    document.querySelectorAll('[data-tab="studenci"], [data-tab="zal"]').forEach((el) => el.classList.add('dev-only-tab'));
  }

  NS.view = { renderPanel, closePanel, setDevVisualState, showDevTabs, hideDevTabs };
})();
