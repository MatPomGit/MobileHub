#!/usr/bin/env node

'use strict';

/**
 * Walidator danych materiałów:
 * 1) Sprawdza shape wpisów (wymagane pola i typy).
 * 2) Sprawdza istnienie lokalnych zasobów wskazywanych przez ścieżki.
 *
 * Kod wyjścia != 0 przerywa build/hook/CI.
 */

const fs = require('fs');
const path = require('path');
const vm = require('vm');

const REPO_ROOT = path.resolve(__dirname, '..');
const MATERIALS_DATA_PATH = path.join(REPO_ROOT, 'src/materials/materials-data.js');

function extractConstArray(source, constName) {
    const pattern = new RegExp(`const\\s+${constName}\\s*=\\s*\\[[\\s\\S]*?\\];`);
    const match = source.match(pattern);

    if (!match) {
        throw new Error(`Nie znaleziono stałej ${constName} w pliku ${path.basename(MATERIALS_DATA_PATH)}.`);
    }

    return match[0];
}

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

function isExternalLink(value) {
    return /^(https?:)?\/\//i.test(value);
}

function isNonEmptyString(value) {
    return typeof value === 'string' && value.trim().length > 0;
}

function validateFilesEntry(entry, entryPath, errors) {
    const requiredFields = ['href', 'type', 'label'];
    for (const field of requiredFields) {
        if (!isNonEmptyString(entry[field])) {
            errors.push(`${entryPath}.${field} musi być niepustym stringiem.`);
        }
    }
}

function validateLiveEntry(entry, entryPath, errors) {
    const requiredFields = ['livePath', 'title'];
    for (const field of requiredFields) {
        if (!isNonEmptyString(entry[field])) {
            errors.push(`${entryPath}.${field} musi być niepustym stringiem.`);
        }
    }

    if (entry.pdfPath !== undefined && entry.pdfPath !== null && !isNonEmptyString(entry.pdfPath)) {
        errors.push(`${entryPath}.pdfPath jeśli podany, musi być niepustym stringiem.`);
    }
}

function validateShape(config) {
    const errors = [];

    if (!Array.isArray(config.FILES_DATA)) {
        errors.push('FILES_DATA musi być tablicą.');
    }

    if (!Array.isArray(config.LIVE_MATERIALS_DATA)) {
        errors.push('LIVE_MATERIALS_DATA musi być tablicą.');
    }

    for (const [groupIndex, group] of (config.FILES_DATA || []).entries()) {
        const groupPath = `FILES_DATA[${groupIndex}]`;
        if (!Array.isArray(group.files)) {
            errors.push(`${groupPath}.files musi być tablicą.`);
            continue;
        }

        for (const [fileIndex, file] of group.files.entries()) {
            validateFilesEntry(file, `${groupPath}.files[${fileIndex}]`, errors);
        }
    }

    if (Array.isArray(config.LIVE_MATERIALS_DATA)) {
        for (const [groupIndex, group] of config.LIVE_MATERIALS_DATA.entries()) {
            const groupPath = `LIVE_MATERIALS_DATA[${groupIndex}]`;
            if (!Array.isArray(group.files)) {
                errors.push(`${groupPath}.files musi być tablicą.`);
                continue;
            }

            for (const [fileIndex, file] of group.files.entries()) {
                validateLiveEntry(file, `${groupPath}.files[${fileIndex}]`, errors);
            }
        }
    }

    return errors;
}

function collectMaterialPaths(config) {
    const collected = [];

    for (const group of config.FILES_DATA || []) {
        for (const file of group.files || []) {
            if (isNonEmptyString(file.href)) {
                collected.push({ source: 'FILES_DATA.href', value: file.href });
            }
        }
    }

    for (const group of config.LIVE_MATERIALS_DATA || []) {
        for (const file of group.files || []) {
            if (isNonEmptyString(file.livePath)) {
                collected.push({ source: 'LIVE_MATERIALS_DATA.livePath', value: file.livePath });
            }
            if (isNonEmptyString(file.pdfPath)) {
                collected.push({ source: 'LIVE_MATERIALS_DATA.pdfPath', value: file.pdfPath });
            }
        }
    }

    return collected;
}

function validatePaths(paths) {
    return paths.filter(entry => {
        if (isExternalLink(entry.value)) {
            return false;
        }

        const resolvedPath = path.resolve(REPO_ROOT, entry.value);
        return !fs.existsSync(resolvedPath);
    });
}

function main() {
    const config = loadMaterialsConfig();

    const shapeErrors = validateShape(config);
    const paths = collectMaterialPaths(config);
    const missingPaths = validatePaths(paths);

    if (shapeErrors.length > 0 || missingPaths.length > 0) {
        console.error('❌ Walidacja danych materiałów nie powiodła się.');

        if (shapeErrors.length > 0) {
            console.error('\nBłędy shape:');
            for (const error of shapeErrors) {
                console.error(`  - ${error}`);
            }
        }

        if (missingPaths.length > 0) {
            console.error('\nBrakujące zasoby:');
            for (const entry of missingPaths) {
                console.error(`  - ${entry.value} (źródło: ${entry.source})`);
            }
        }

        process.exit(1);
    }

    console.log(`✅ Walidacja zakończona sukcesem (shape + ścieżki). Sprawdzono ${paths.length} ścieżek.`);
}

main();
