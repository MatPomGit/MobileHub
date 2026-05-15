/**
 * WIKI System - PAM
 * Moduł: wyszukiwanie artykułów oraz pobieranie plików PDF i PPTX
 */

'use strict';

import { FILES_DATA } from './src/materials/materials-data.js';
import { renderDownloadMaterials } from './src/materials/render-download-materials.js';
import { renderLiveMaterials } from './src/materials/render-live-materials.js';
import { initPresentationPreview } from './src/materials/presentation-preview-controller.js';

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

export function initMaterials() {
    renderDownloadMaterials();
    renderLiveMaterials();
    setupSearch();
    initPresentationPreview({
        controlsId: 'presentation-controls',
        frameId: 'presentation-preview',
        openLinkId: 'presentation-preview-open',
        data: FILES_DATA
    });
}
