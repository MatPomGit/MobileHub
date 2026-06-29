/**
 * WIKI System - PAM
 * Moduł: wyszukiwanie artykułów oraz pobieranie plików PDF i PPTX
 */

'use strict';

import { FILES_DATA } from '../materials/materials-data.js';
import { renderDownloadMaterials } from '../materials/render-download-materials.js';
import { renderLiveMaterials } from '../materials/render-live-materials.js';
import { initPresentationPreview } from '../materials/presentation-preview-controller.js';

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
