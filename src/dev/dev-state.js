'use strict';

(function initDevStateNamespace() {
  const NS = (window.__pamDev = window.__pamDev || {});
  const LS_KEY = 'pam-dev-mode';
  const LS_ACTIVATION_COUNT_KEY = 'pam-dev-mode-activations';

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
    return Number(localStorage.getItem(LS_ACTIVATION_COUNT_KEY) || '0');
  }

  NS.state = { LS_KEY, LS_ACTIVATION_COUNT_KEY, isActive, activate, deactivate, getActivationCount };
})();
