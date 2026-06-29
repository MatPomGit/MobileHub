'use strict';

function initPwaUpdateUi() {
    if (window.__pamPwaUpdateUiInitialized) return;
    window.__pamPwaUpdateUiInitialized = true;

    if (!('serviceWorker' in navigator)) return;

    const banner = document.getElementById('pwaUpdateBanner');
    const actionButton = document.getElementById('pwaUpdateAction');
    const status = document.getElementById('pwaUpdateStatus');
    if (!banner || !actionButton || !status) return;

    let registration = null;
    let refreshRequested = false;

    const showUpdate = () => {
        banner.hidden = false;
        status.textContent = 'Nowa wersja aplikacji jest dostępna.';
        actionButton.disabled = false;
    };

    const watchInstallingWorker = (worker) => {
        if (!worker) return;

        worker.addEventListener('statechange', () => {
            if (worker.state === 'installed' && navigator.serviceWorker.controller) {
                showUpdate();
            }
        });
    };

    const bindRegistration = (resolvedRegistration) => {
        if (!resolvedRegistration) return;
        registration = resolvedRegistration;

        if (registration.waiting && navigator.serviceWorker.controller) {
            showUpdate();
        }

        registration.addEventListener('updatefound', () => {
            watchInstallingWorker(registration.installing);
        });
    };

    actionButton.addEventListener('click', async () => {
        if (!registration) return;

        actionButton.disabled = true;
        status.textContent = 'Trwa aktualizowanie aplikacji…';

        if (registration.waiting) {
            refreshRequested = true;
            registration.waiting.postMessage({ type: 'SKIP_WAITING' });
            return;
        }

        try {
            await registration.update();
        } catch (error) {
            console.warn('Nie udało się sprawdzić aktualizacji Service Workera.', error);
        }

        actionButton.disabled = false;
        status.textContent = 'Nie znaleziono oczekującej aktualizacji.';
    });

    navigator.serviceWorker.addEventListener('controllerchange', () => {
        if (!refreshRequested) return;
        refreshRequested = false;
        window.location.reload();
    });

    const registrationPromise =
        window.__pamServiceWorkerRegistrationPromise ||
        navigator.serviceWorker.ready;

    Promise.resolve(registrationPromise)
        .then(bindRegistration)
        .catch((error) => {
            console.warn('Nie udało się zainicjalizować obsługi aktualizacji PWA.', error);
        });
}

window.initPwaUpdateUi = initPwaUpdateUi;
