const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const vm = require('node:vm');

const source = fs.readFileSync(
    path.join(__dirname, '..', 'src', 'pwa-update.js'),
    'utf8',
);

test('pokazuje oczekującą aktualizację i przeładowuje stronę po zmianie kontrolera', async () => {
    const elementListeners = {};
    const serviceWorkerListeners = {};
    const postedMessages = [];
    let reloadCount = 0;

    const banner = { hidden: true };
    const status = { textContent: '' };
    const actionButton = {
        disabled: false,
        addEventListener(type, listener) {
            elementListeners[type] = listener;
        },
    };

    const waitingWorker = {
        postMessage(message) {
            postedMessages.push(message);
        },
    };

    const registration = {
        waiting: waitingWorker,
        installing: null,
        addEventListener() {},
        async update() {},
    };

    const serviceWorker = {
        controller: {},
        ready: Promise.resolve(registration),
        addEventListener(type, listener) {
            serviceWorkerListeners[type] = listener;
        },
    };

    const window = {
        __pamServiceWorkerRegistrationPromise: Promise.resolve(registration),
        location: {
            reload() {
                reloadCount += 1;
            },
        },
    };

    const document = {
        getElementById(id) {
            return {
                pwaUpdateBanner: banner,
                pwaUpdateAction: actionButton,
                pwaUpdateStatus: status,
            }[id] || null;
        },
    };

    vm.runInNewContext(source, {
        console,
        document,
        navigator: { serviceWorker },
        Promise,
        window,
    });

    window.initPwaUpdateUi();
    await new Promise((resolve) => setImmediate(resolve));

    assert.equal(banner.hidden, false);
    assert.equal(status.textContent, 'Nowa wersja aplikacji jest dostępna.');

    await elementListeners.click();

    assert.equal(postedMessages.length, 1);
    assert.equal(postedMessages[0].type, 'SKIP_WAITING');
    assert.equal(status.textContent, 'Trwa aktualizowanie aplikacji…');

    serviceWorkerListeners.controllerchange();
    assert.equal(reloadCount, 1);
});
