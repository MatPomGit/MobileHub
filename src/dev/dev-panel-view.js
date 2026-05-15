'use strict';

(function initDevPanelViewNamespace() {
  const NS = (window.__pamDev = window.__pamDev || {});

  function createElement(tag, options) {
    const el = document.createElement(tag);
    if (!options) return el;
    if (options.id) el.id = options.id;
    if (options.className) el.className = options.className;
    if (options.text != null) el.textContent = String(options.text);
    if (options.attrs) {
      Object.entries(options.attrs).forEach(function ([name, value]) {
        if (value != null) el.setAttribute(name, String(value));
      });
    }
    return el;
  }

  function createIcon(className) {
    return createElement('i', { className, attrs: { 'aria-hidden': 'true' } });
  }

  function createInfoRow(key, value) {
    const tr = createElement('tr');
    tr.appendChild(createElement('th', { text: key }));
    tr.appendChild(createElement('td', { text: value }));
    return tr;
  }

  function createPanelSection(tag, options, children) {
    const section = createElement(tag, options);
    (children || []).forEach(function (child) {
      section.appendChild(child);
    });
    return section;
  }

  function createButton({ id, ariaLabel, title, text, iconClass }) {
    const button = createElement('button', {
      id,
      attrs: {
        'aria-label': ariaLabel,
        title,
      },
    });
    if (iconClass) button.appendChild(createIcon(iconClass));
    if (text) button.appendChild(document.createTextNode(text));
    return button;
  }

  function buildPanelContent(panel) {
    const title = createPanelSection('span', { id: 'dev-panel-title' }, [
      createIcon('fa-solid fa-code'),
      document.createTextNode(' Tryb deweloperski'),
    ]);
    const header = createPanelSection('div', { id: 'dev-panel-header' }, [
      title,
      createButton({
        id: 'dev-panel-close',
        ariaLabel: 'Zamknij panel deweloperski',
        title: 'Zamknij',
        text: '✕',
      }),
    ]);

    const banner = createPanelSection('div', { id: 'dev-panel-banner' }, [
      createIcon('fa-solid fa-triangle-exclamation'),
      document.createTextNode(' Jesteś w trybie deweloperskim. Te informacje są przeznaczone dla programistów.'),
    ]);

    const table = createElement('table', { id: 'dev-info-table', attrs: { 'aria-label': 'Informacje deweloperskie' } });
    const footer = createPanelSection('div', { id: 'dev-panel-footer' }, [
      createButton({
        id: 'dev-panel-refresh',
        ariaLabel: 'Odśwież dane',
        title: 'Odśwież dane',
        text: ' Odśwież dane',
        iconClass: 'fa-solid fa-rotate-right',
      }),
      createButton({
        id: 'dev-panel-deactivate',
        ariaLabel: 'Wyłącz tryb dev',
        title: 'Wyłącz tryb dev',
        text: ' Wyłącz tryb dev',
        iconClass: 'fa-solid fa-power-off',
      }),
    ]);

    panel.appendChild(header);
    panel.appendChild(banner);
    panel.appendChild(table);
    panel.appendChild(footer);
  }

  function renderPanel({ onDeactivate }) {
    if (document.getElementById('dev-panel')) return;
    const overlay = document.createElement('div');
    overlay.id = 'dev-overlay';
    overlay.setAttribute('role', 'dialog');
    overlay.setAttribute('aria-modal', 'true');
    overlay.setAttribute('aria-label', 'Panel deweloperski');

    const panel = document.createElement('div');
    panel.id = 'dev-panel';
    buildPanelContent(panel);

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
      table.appendChild(createInfoRow(key, val));
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
