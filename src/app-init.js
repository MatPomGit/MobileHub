'use strict';

import { initWiki } from '../pam-wiki.js';
import { initMaterials } from '../pam-files.js';

function logStartupError(stage, error) {
  console.error(`[app-init] Startup stage failed: ${stage}.`, error);
}

function renderServiceFallbackUi(stage, error) {
  const root =
    document.querySelector('main') ||
    document.getElementById('app') ||
    document.body;

  if (!root) {
    return;
  }

  const existingFallback = document.getElementById('app-service-fallback');
  if (existingFallback) {
    return;
  }

  const fallback = document.createElement('section');
  fallback.id = 'app-service-fallback';
  fallback.setAttribute('role', 'alert');
  fallback.style.margin = '1rem 0';
  fallback.style.padding = '1rem';
  fallback.style.borderRadius = '0.5rem';
  fallback.style.border = '1px solid #dc3545';
  fallback.style.background = '#fff5f5';
  fallback.style.color = '#7f1d1d';

  const title = document.createElement('h2');
  title.style.margin = '0 0 0.5rem';
  title.textContent = 'Serwis chwilowo niedostępny';

  const message = document.createElement('p');
  message.style.margin = '0 0 0.5rem';
  message.textContent = 'Nie udało się uruchomić krytycznego modułu aplikacji.';

  const stageInfo = document.createElement('p');
  stageInfo.style.margin = '0';
  stageInfo.style.fontSize = '0.875rem';
  stageInfo.appendChild(document.createTextNode('Etap: '));
  const stageValue = document.createElement('strong');
  stageValue.textContent = stage;
  stageInfo.appendChild(stageValue);

  fallback.appendChild(title);
  fallback.appendChild(message);
  fallback.appendChild(stageInfo);
  root.prepend(fallback);

  if (error) {
    const details = document.createElement('details');
    details.style.marginTop = '0.5rem';
    const summary = document.createElement('summary');
    summary.textContent = 'Szczegóły techniczne';
    const pre = document.createElement('pre');
    pre.style.whiteSpace = 'pre-wrap';
    pre.style.marginTop = '0.5rem';
    pre.textContent = String(error?.message || error);
    details.appendChild(summary);
    details.appendChild(pre);
    fallback.appendChild(details);
  }
}

async function runAppInitialization() {
  const criticalStartupStages = [
    ['ui:tabs', () => window.initPageTabs?.()],
    ['ui:pull-panel', () => window.initPullPanel?.()],
    ['ui:offline-indicator', () => window.initOfflineIndicator?.()],
    ['ui:bootstrap', () => window.initBootstrapUi?.()],
  ];

  for (const [stage, initStage] of criticalStartupStages) {
    try {
      initStage();
    } catch (error) {
      logStartupError(stage, error);
      renderServiceFallbackUi(stage, error);
      return;
    }
  }

  const nonCriticalStartupStages = [
    ['dev-mode', () => window.initDevMode?.()],
    ['materials', () => initMaterials()],
  ];

  for (const [stage, initStage] of nonCriticalStartupStages) {
    try {
      initStage();
    } catch (error) {
      logStartupError(stage, error);
    }
  }

  try {
    await initWiki();
  } catch (error) {
    logStartupError('wiki', error);
    renderServiceFallbackUi('wiki', error);
  }
}

document.addEventListener('DOMContentLoaded', () => {
  runAppInitialization();
});
