/**
 * WIKI System - PAM
 * Moduł: wyszukiwanie artykułów oraz pobieranie plików PDF i PPTX
 */

'use strict';

import { FILES_DATA } from './src/materials/materials-data.js';
import { renderDownloadMaterials } from './src/materials/render-download-materials.js';
import { renderLiveMaterials } from './src/materials/render-live-materials.js';
import { initPresentationPreview } from './src/materials/presentation-preview-controller.js';

export function initMaterials() {
    renderDownloadMaterials();
    renderLiveMaterials();
    initPresentationPreview({
        controlsId: 'presentation-controls',
        frameId: 'presentation-preview',
        openLinkId: 'presentation-preview-open',
        data: FILES_DATA
    });
}
