/**
 * WIKI System - PAM
 * Moduł: wyszukiwanie artykułów oraz pobieranie plików PDF i PPTX
 */

'use strict';

const FILES_DATA = [
    {
        section: 'Wykłady',
        icon: 'fa-solid fa-chalkboard-teacher',
        files: [
            { href: 'wyklady/w1_intro.pdf',           type: 'pdf',  label: 'W1 – Wprowadzenie do PAM' },
            { href: 'wyklady/w2_hardware.pdf',        type: 'pdf',  label: 'W2 – Architektura sprzętu' },
            { href: 'wyklady/w3_ui.pdf',              type: 'pdf',  label: 'W3 – Projektowanie UI/UX' },
            { href: 'wyklady/w4_native.pdf',          type: 'pdf',  label: 'W4 – Projektowanie natywne' },
            { href: 'wyklady/w5_cross.pdf',          type: 'pdf',  label: 'W4 – Projektowanie cross-platformowe' },
            { href: 'wyklady/w6_sensors.pdf',         type: 'pdf',  label: 'W6 – Obsługa sensorów urządzeń mobilnych' },
            { href: 'wyklady/w7_IoT.pdf',             type: 'pdf',  label: 'W7 – Programowanie aplikacji współpracujących z IoT' },
            { href: 'wyklady/w8_affective.pdf',       type: 'pdf',  label: 'W8 – Informatyka afektywna' },
            { href: 'wyklady/w9_xr.pdf',              type: 'pdf',  label: 'W9 – Programowanie aplikacji mobilnych XR' },
            { href: 'wyklady/w10_games.pdf',          type: 'pdf',  label: 'W10 – Programowanie gier mobilnych' },
            { href: 'wyklady/w11_robots.pdf',         type: 'pdf',  label: 'W11 – Programowanie autonomicznych robotów' },

            /*
            { href: 'wyklady/w3_ui.pptx',             type: 'pptx', label: 'W3 – Projektowanie UI/UX dla urządzeń mobilnych' },
            { href: 'wyklady/w6_sensors.pptx',        type: 'pptx',  label: 'W6 – Obsługa sensorów urządzeń mobilnych' },
            { href: 'wyklady/w7_IoT.pptx',            type: 'pptx',  label: 'W7 – Programowanie aplikacji współpracujących z IoT' },
            { href: 'wyklady/w8_affective_1_4.pptx',      type: 'pptx',  label: 'W8 – Informatyka afektywna' },
            { href: 'wyklady/w9_xr.pptx',             type: 'pptx',  label: 'W9 – Programowanie aplikacji mobilnych XR' },
            { href: 'wyklady/w10_games.pptx',         type: 'pptx',  label: 'W10 – Programowanie gier mobilnych' },
            { href: 'wyklady/w11_robots.pptx',        type: 'pptx',  label: 'W11 – Programowanie autonomicznych robotów' },
            */
        ],
    },
    {
        section: 'Laboratoria',
        icon: 'fa-solid fa-flask',
        files: [
            { href: 'laby/kotlin_1.pdf',        type: 'pdf', label: 'Lab Kotlin 1' },
            { href: 'laby/kotlin_2.pdf',        type: 'pdf', label: 'Lab Kotlin 2' },
            { href: 'laby/kotlin_3.pdf',        type: 'pdf', label: 'Lab Kotlin 3' },
            { href: 'laby/kotlin_4.pdf',        type: 'pdf', label: 'Lab Kotlin 4' },
            { href: 'laby/kotlin_5.pdf',        type: 'pdf', label: 'Lab Kotlin 5' },
            { href: 'laby/flutter_1.pdf',       type: 'pdf', label: 'Lab Flutter 1' },
            { href: 'laby/flutter_2.pdf',       type: 'pdf', label: 'Lab Flutter 2' },
            { href: 'laby/unity_1.pdf',         type: 'pdf', label: 'Lab Unity 1' },
            { href: 'laby/tematyprojektow.pdf', type: 'pdf', label: 'Tematy projektów' },

        ],
    },
];

const FILE_ICON_MAP = {
    pdf:  { cls: 'fa-solid fa-file-pdf',        label: 'PDF' },
    pptx: { cls: 'fa-solid fa-file-powerpoint', label: 'PPTX' },
};

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
