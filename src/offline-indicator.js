'use strict';

function initOfflineIndicator() {
    if (window.__pamOfflineIndicatorInitialized) return;
    window.__pamOfflineIndicatorInitialized = true;

    const indicator = document.getElementById('offlineIndicator');
    if (!indicator) return;

    const sync = () => {
        indicator.textContent = navigator.onLine ? 'Online' : 'Tryb offline';
        indicator.classList.toggle('is-offline', !navigator.onLine);
    };

    window.addEventListener('online', sync);
    window.addEventListener('offline', sync);
    sync();
}

window.initOfflineIndicator = initOfflineIndicator;
