'use strict';

(function initDevStateNamespace() {
  const NS = (window.__pamDev = window.__pamDev || {});
  const LS_KEY = 'pam-dev-mode';
  const APP_VERSION = (document.querySelector('meta[name="app-version"]') || {}).content || 'unknown';
  const LS_ACTIVATION_COUNT_KEY = 'pam-dev-mode-activations-v2:' + APP_VERSION;

  // Reset licznika przy każdym uruchomieniu strony głównej.
  localStorage.removeItem(LS_ACTIVATION_COUNT_KEY);

  function isActive() {
    return localStorage.getItem(LS_KEY) === '1';
  }

  function activate() {
    localStorage.setItem(LS_KEY, '1');
    const activationCount = getActivationCount() + 1;
    localStorage.setItem(LS_ACTIVATION_COUNT_KEY, String(activationCount));
    return activationCount;
  }

  function deactivate() {
    localStorage.removeItem(LS_KEY);
  }

  function getActivationCount() {
    const rawValue = localStorage.getItem(LS_ACTIVATION_COUNT_KEY);
    const parsed = Number(rawValue || '0');
    if (!Number.isFinite(parsed) || parsed < 0) return 0;
    return Math.floor(parsed);
  }

  NS.state = { LS_KEY, LS_ACTIVATION_COUNT_KEY, isActive, activate, deactivate, getActivationCount };
})();
