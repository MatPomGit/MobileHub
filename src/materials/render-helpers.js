'use strict';

export function createSection(group) {
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

    return { section, list };
}
