        (function initOfflineIndicator() {
            const indicator = document.getElementById('offlineIndicator');
            if (!indicator) return;
            const sync = () => {
                indicator.textContent = navigator.onLine ? 'Online' : 'Tryb offline';
                indicator.classList.toggle('is-offline', !navigator.onLine);
            };
            window.addEventListener('online', sync);
            window.addEventListener('offline', sync);
            sync();
        })();


