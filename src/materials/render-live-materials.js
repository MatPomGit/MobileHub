'use strict';

import { LIVE_MATERIALS_DATA } from './materials-data.js';
import { createSection } from './render-helpers.js';

// Renderuje panel „Materiały live” z interaktywnymi prezentacjami wykładów.
export function renderLiveMaterials() {
    const container = document.getElementById('materials-live-content');
    if (!container) return;

    LIVE_MATERIALS_DATA.forEach(group => {
        const { section, list } = createSection(group);

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
