/**
 * Controller podglądu prezentacji PDF (wykłady/laboratoria).
 */

'use strict';

export function initPresentationPreview({ controlsId, frameId, openLinkId, data }) {
    const controls = document.getElementById(controlsId);
    const previewFrame = document.getElementById(frameId);
    const openInNewTabLink = openLinkId ? document.getElementById(openLinkId) : null;

    if (!controls || !previewFrame || !Array.isArray(data)) return;

    const lecturePdfs = data
        .find(group => group.section === 'Wykłady')
        ?.files
        .filter(file => file.type === 'pdf')
        .map(file => ({ title: file.label, path: file.href })) || [];

    const labPdfs = data
        .find(group => group.section === 'Laboratoria')
        ?.files
        .filter(file => file.type === 'pdf')
        .map(file => ({ title: file.label, path: file.href })) || [];

    if (!lecturePdfs.length && !labPdfs.length) return;

    let activeMode = lecturePdfs.length ? 'lectures' : 'labs';

    const setActivePresentation = (path, buttonEl) => {
        previewFrame.src = path;

        if (openInNewTabLink) {
            openInNewTabLink.href = path;
            openInNewTabLink.classList.add('is-visible');
        }

        controls.querySelectorAll('.presentation-btn').forEach(btn => btn.classList.remove('active'));
        buttonEl?.classList.add('active');
    };

    const renderMaterialButtons = (materials) => {
        controls.querySelectorAll('.presentation-item-btn').forEach(button => button.remove());

        materials.forEach((material, index) => {
            const button = document.createElement('button');
            button.type = 'button';
            button.className = 'presentation-btn presentation-item-btn';
            button.textContent = material.title;
            button.setAttribute('aria-label', `Otwórz podgląd: ${material.title}`);
            button.addEventListener('click', () => setActivePresentation(material.path, button));
            controls.appendChild(button);

            if (index === 0) {
                setActivePresentation(material.path, button);
            }
        });
    };

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
