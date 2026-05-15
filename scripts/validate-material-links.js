#!/usr/bin/env node

'use strict';

/**
 * Skrypt waliduje linki do materiałów (download + live) z konfiguracji src/materials/materials-data.js.
 * Dla każdej ścieżki lokalnej sprawdza istnienie pliku w repozytorium.
 */

const fs = require('fs');
const path = require('path');
const vm = require('vm');

const REPO_ROOT = path.resolve(__dirname, '..');
const MATERIALS_DATA_PATH = path.join(REPO_ROOT, 'src/materials/materials-data.js');

/**
 * Wyciąga deklarację `export const <name> = [...]` z pliku źródłowego.
 * @param {string} source - Treść pliku konfiguracyjnego.
 * @param {string} constName - Nazwa stałej do wyodrębnienia.
 * @returns {string}
 */
function extractConstArray(source, constName) {
    const pattern = new RegExp(`const\\s+${constName}\\s*=\\s*\\[[\\s\\S]*?\\];`);
    const match = source.match(pattern);

    if (!match) {
        throw new Error(`Nie znaleziono stałej ${constName} w pliku ${path.basename(MATERIALS_DATA_PATH)}.`);
    }

    return match[0];
}

/**
 * Wczytuje FILES_DATA i LIVE_MATERIALS_DATA z modułu danych bez uruchamiania kodu zależnego od DOM.
 * @returns {{FILES_DATA: Array, LIVE_MATERIALS_DATA: Array}}
 */
function loadMaterialsConfig() {
    const source = fs.readFileSync(MATERIALS_DATA_PATH, 'utf8');

    const filesDataDeclaration = extractConstArray(source, 'FILES_DATA');
    const liveMaterialsDataDeclaration = extractConstArray(source, 'LIVE_MATERIALS_DATA');

    const script = [
        filesDataDeclaration,
        liveMaterialsDataDeclaration,
        'module.exports = { FILES_DATA, LIVE_MATERIALS_DATA };',
    ].join('\n');

    const sandbox = {
        module: { exports: {} },
    };

    vm.runInNewContext(script, sandbox, { filename: 'materials-config-loader.vm.js' });

    return sandbox.module.exports;
}

/**
 * Zwraca wszystkie lokalne ścieżki plików z konfiguracji materiałów.
 * @param {{FILES_DATA: Array, LIVE_MATERIALS_DATA: Array}} config
 * @returns {Array<{source: string, value: string}>}
 */
function collectMaterialPaths(config) {
    const collected = [];

    for (const group of config.FILES_DATA || []) {
        for (const file of group.files || []) {
            if (file.href) {
                collected.push({ source: 'FILES_DATA.href', value: file.href });
            }
        }
    }

    for (const group of config.LIVE_MATERIALS_DATA || []) {
        for (const file of group.files || []) {
            if (file.livePath) {
                collected.push({ source: 'LIVE_MATERIALS_DATA.livePath', value: file.livePath });
            }
            if (file.pdfPath) {
                collected.push({ source: 'LIVE_MATERIALS_DATA.pdfPath', value: file.pdfPath });
            }
        }
    }

    return collected;
}

/**
 * Sprawdza, czy wartość jest adresem zewnętrznym i nie powinna być walidowana lokalnie.
 * @param {string} value
 * @returns {boolean}
 */
function isExternalLink(value) {
    return /^(https?:)?\/\//i.test(value);
}

function main() {
    const config = loadMaterialsConfig();
    const paths = collectMaterialPaths(config);

    const missing = paths.filter(entry => {
        if (!entry.value || isExternalLink(entry.value)) {
            return false;
        }

        const resolvedPath = path.resolve(REPO_ROOT, entry.value);
        return !fs.existsSync(resolvedPath);
    });

    if (missing.length > 0) {
        console.error('❌ Wykryto brakujące pliki w konfiguracji materiałów:');
        for (const entry of missing) {
            console.error(`  - ${entry.value} (źródło: ${entry.source})`);
        }
        process.exit(1);
    }

    console.log(`✅ Walidacja zakończona sukcesem. Sprawdzono ${paths.length} ścieżek.`);
}

main();
