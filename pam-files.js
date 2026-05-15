/**
 * WIKI System - PAM
 * Moduł: wyszukiwanie artykułów oraz pobieranie plików PDF i PPTX
 */

'use strict';

import { FILES_DATA, LIVE_MATERIALS_DATA, FILE_ICON_MAP } from './src/materials/materials-data.js';

// Buduje sekcję materiałów do pobrania na podstawie FILES_DATA.
function buildMaterialsPanel() {
    const container = document.getElementById('materials-content');
    if (!container) return;

    FILES_DATA.forEach(group => {
        const section = document.createElement('div');
        section.className = 'files-section';

        const titleEl = document.createElement('h3');
        titleEl.className = 'files-section-title';
        const titleIcon = document.createElement('i');
        titleIcon.className = group.icon;
        const titleText = document.createTextNode(group.section);
        titleEl.appendChild(titleIcon);
        titleEl.appendChild(titleText);
        section.appendChild(titleEl);

        const list = document.createElement('div');
        list.className = 'file-list';

        group.files.forEach(file => {
            const icon = FILE_ICON_MAP[file.type] || { cls: 'fa-solid fa-file', label: file.type.toUpperCase() };
            const a = document.createElement('a');
            a.className = 'file-item';
            a.href = file.href;
            a.setAttribute('download', '');

            const fileIconDiv = document.createElement('div');
            fileIconDiv.className = `file-icon ${file.type}`;
            const fileIconI = document.createElement('i');
            fileIconI.className = icon.cls;
            fileIconDiv.appendChild(fileIconI);

            const metaDiv = document.createElement('div');
            metaDiv.className = 'file-meta';
            const strong = document.createElement('strong');
            strong.textContent = file.label;
            const span = document.createElement('span');
            span.textContent = icon.label;
            metaDiv.appendChild(strong);
            metaDiv.appendChild(span);

            const dlIcon = document.createElement('i');
            dlIcon.className = 'fa-solid fa-download file-download-icon';

            a.appendChild(fileIconDiv);
            a.appendChild(metaDiv);
            a.appendChild(dlIcon);
            list.appendChild(a);
        });

        section.appendChild(list);
        container.appendChild(section);
    });
}

// Renderuje panel „Materiały live” z interaktywnymi prezentacjami wykładów.
function buildLiveMaterialsPanel() {
    const container = document.getElementById('materials-live-content');
    if (!container) return;

    LIVE_MATERIALS_DATA.forEach(group => {
        const section = document.createElement('div');
        section.className = 'files-section';

        const titleEl = document.createElement('h3');
        titleEl.className = 'files-section-title';
        const titleIcon = document.createElement('i');
        titleIcon.className = group.icon;
        const titleText = document.createTextNode(group.section);
        titleEl.appendChild(titleIcon);
        titleEl.appendChild(titleText);
        section.appendChild(titleEl);

        const list = document.createElement('div');
        list.className = 'file-list';

        // Każdy kafelek prowadzi wyłącznie do wersji live, aby nie dublować PDF-ów.
        group.files.forEach(file => {
            const a = document.createElement('a');
            a.className = 'file-item';
            a.href = file.livePath;
            a.target = '_blank';
            a.rel = 'noopener';

            const fileIconDiv = document.createElement('div');
            fileIconDiv.className = 'file-icon html';
            const fileIconI = document.createElement('i');
            fileIconI.className = 'fa-solid fa-person-chalkboard';
            fileIconDiv.appendChild(fileIconI);

            const metaDiv = document.createElement('div');
            metaDiv.className = 'file-meta';
            const strong = document.createElement('strong');
            strong.textContent = `${file.title} (live)`;
            const span = document.createElement('span');
            span.textContent = 'Reveal.js';
            metaDiv.appendChild(strong);
            metaDiv.appendChild(span);

            const actionIcon = document.createElement('i');
            actionIcon.className = 'fa-solid fa-arrow-up-right-from-square file-download-icon';

            a.appendChild(fileIconDiv);
            a.appendChild(metaDiv);
            a.appendChild(actionIcon);
            list.appendChild(a);
        });

        section.appendChild(list);
        container.appendChild(section);
    });
}

// Obsługuje filtrowanie list artykułów w panelu wiki po wpisanym tekście.
function setupSearch() {
    const input = document.getElementById('wikiSearch');
    if (!input) return;
    input.addEventListener('input', () => {
        const q = input.value.toLowerCase().trim();
        document.querySelectorAll('.wiki-category').forEach(cat => {
            let vis = 0;
            cat.querySelectorAll('[data-article]').forEach(link => {
                const match = !q || link.textContent.toLowerCase().includes(q);
                const li = link.closest('li');
                if (li) li.style.display = match ? '' : 'none';
                if (match) vis++;
            });
            if (q && vis > 0) { const l = cat.querySelector('.cat-list'); if (l) l.classList.remove('collapsed'); }
            cat.style.display = (!q || vis > 0) ? '' : 'none';
        });
    });
}

document.addEventListener('DOMContentLoaded', buildMaterialsPanel);
document.addEventListener('DOMContentLoaded', buildLiveMaterialsPanel);
document.addEventListener('DOMContentLoaded', initPresentationPreview);


// Tworzy listę przycisków i synchronizuje ją z iframe podglądu prezentacji.
function initPresentationPreview() {
    const controls = document.getElementById('presentation-controls');
    const previewFrame = document.getElementById('presentation-preview');
    const openInNewTabLink = document.getElementById('presentation-preview-open');
    if (!controls || !previewFrame) return;

    // Budujemy listy PDF dla wykładów i laboratoriów, aby użytkownik mógł przełączać kontekst podglądu.
    const lecturePdfs = FILES_DATA
        .find(group => group.section === 'Wykłady')
        ?.files
        .filter(file => file.type === 'pdf')
        .map(file => ({ title: file.label, path: file.href })) || [];

    const labPdfs = FILES_DATA
        .find(group => group.section === 'Laboratoria')
        ?.files
        .filter(file => file.type === 'pdf')
        .map(file => ({ title: file.label, path: file.href })) || [];

    if (!lecturePdfs.length && !labPdfs.length) return;

    let activeMode = lecturePdfs.length ? 'lectures' : 'labs';

    // Czyści i odtwarza listę przycisków źródłowych dla aktualnie wybranego trybu (wykłady/laboratoria).
    const renderMaterialButtons = (materials) => {
        controls.querySelectorAll('.presentation-item-btn').forEach(button => button.remove());

        // Aktualizujemy iframe i link awaryjny, który rozwiązuje problemy z osadzaniem PDF na części urządzeń mobilnych.
        const setActivePresentation = (path, buttonEl) => {
            previewFrame.src = path;

            if (openInNewTabLink) {
                openInNewTabLink.href = path;
                openInNewTabLink.classList.add('is-visible');
            }

            controls.querySelectorAll('.presentation-btn').forEach(btn => btn.classList.remove('active'));
            buttonEl?.classList.add('active');
        };

        materials.forEach((material, index) => {
            const button = document.createElement('button');
            button.type = 'button';
            button.className = 'presentation-btn presentation-item-btn';
            button.textContent = material.title;
            button.setAttribute('aria-label', `Otwórz podgląd: ${material.title}`);
            button.addEventListener('click', () => setActivePresentation(material.path, button));
            controls.appendChild(button);

            // Ustawiamy pierwszy materiał z listy jako domyślny wybór w podglądzie.
            if (index === 0) {
                setActivePresentation(material.path, button);
            }
        });
    };

    // Przycisk zmieniający źródło podglądu pomiędzy PDF-ami wykładów i laboratoriów.
    const modeSwitchButton = document.createElement('button');
    modeSwitchButton.type = 'button';
    modeSwitchButton.className = 'presentation-btn presentation-mode-btn';

    const updateMode = () => {
        const showingLectures = activeMode === 'lectures';
        const nextModeLabel = showingLectures ? 'Laboratoria PDF' : 'Wykłady PDF';
        modeSwitchButton.textContent = `Tryb: ${showingLectures ? 'Wykłady PDF' : 'Laboratoria PDF'} · Przełącz na ${nextModeLabel}`;

        const materials = showingLectures ? lecturePdfs : labPdfs;
        renderMaterialButtons(materials);
    };

    modeSwitchButton.addEventListener('click', () => {
        if (!lecturePdfs.length || !labPdfs.length) return;
        activeMode = activeMode === 'lectures' ? 'labs' : 'lectures';
        updateMode();
    });

    controls.appendChild(modeSwitchButton);
    updateMode();
}

