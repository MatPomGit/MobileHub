'use strict';

import { IDS, CLASSES, DATA_ATTRS } from './dom-map.js';
import { onInput } from './wiki-dom-utils.js';

export function setupSearch() {
  const input = document.getElementById(IDS.wikiSearch);
  if (!input) return;
  input.addEventListener('input', () => {
    const q = input.value.toLowerCase().trim();
    document.querySelectorAll(`.${CLASSES.wikiCategory}`).forEach(cat => {
      let vis = 0;
      cat.querySelectorAll(`[${DATA_ATTRS.article}]`).forEach(link => {
        const match = !q || link.textContent.toLowerCase().includes(q);
        const li = link.closest('li');
        if (li) li.style.display = match ? '' : 'none';
        if (match) vis++;
      });
      if (q && vis > 0) { const l = cat.querySelector(`.${CLASSES.catList}`); if (l) l.classList.remove(CLASSES.collapsed); }
      cat.style.display = (!q || vis > 0) ? '' : 'none';
    });
  });
}
