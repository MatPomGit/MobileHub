'use strict';

import { WikiStore } from './wiki-data.js';
import { CLASSES, DATA_ATTRS } from './dom-map.js';
import { onClick } from './wiki-dom-utils.js';

export function buildSidebar(navigateToArticle) {
  const nav = document.querySelector('.wiki-nav-categories');
  if (!nav) return;
  nav.innerHTML = '';

  WikiStore.categories.forEach(cat => {
    const isDefaultExpanded = cat.id === 'cat-zalicz';
    const sec = document.createElement('div');
    sec.className = CLASSES.wikiCategory;
    sec.innerHTML = `
      <h4 class="${CLASSES.catHeader}" data-cat="${cat.id}" aria-expanded="${String(isDefaultExpanded)}" role="button" tabindex="0">
        <i class="${cat.icon}"></i><span>${cat.name}</span>
        <i class="fa-solid fa-chevron-down ${CLASSES.toggleIcon}"></i>
      </h4>
      <ul class="${CLASSES.catList} ${isDefaultExpanded ? '' : CLASSES.collapsed}" id="${cat.id}" aria-hidden="${String(!isDefaultExpanded)}">
        ${cat.articles.map(article => {
          const isInternal = typeof article === 'string';
          const id = isInternal ? article : article.id;
          const href = isInternal ? `#${id}` : article.href;
          const target = isInternal ? '' : ' target="_blank" rel="noopener noreferrer"';
          const dataArticle = isInternal ? ` ${DATA_ATTRS.article}="${id}"` : '';
          const m = WikiStore.metadata[id] || {};
          return `<li><a href="${href}"${dataArticle}${target}><i class="${m.icon || 'fa-solid fa-file'} article-icon"></i>${m.title || id}</a></li>`;
        }).join('')}
      </ul>`;
    nav.appendChild(sec);
    const icon = sec.querySelector(`.${CLASSES.toggleIcon}`);
    if (icon && !isDefaultExpanded) icon.style.transform = 'rotate(-90deg)';
  });

  onClick(nav, `.${CLASSES.catHeader}`, (_event, header) => {
    const list = document.getElementById(header.dataset.cat);
    if (!list) return;
    const open = !list.classList.contains(CLASSES.collapsed);
    list.classList.toggle(CLASSES.collapsed, open);
    list.setAttribute('aria-hidden', String(open));
    header.setAttribute('aria-expanded', String(!open));
    const icon = header.querySelector(`.${CLASSES.toggleIcon}`);
    if (icon) icon.style.transform = open ? 'rotate(-90deg)' : '';
  });

  onClick(nav, `[${DATA_ATTRS.article}]`, (e, link) => {
    e.preventDefault();
    navigateToArticle(link.dataset.article);
    if (window.innerWidth < 900) document.getElementById(IDS.wikiSidebar)?.classList.remove(CLASSES.open);
  });
}

export function setActiveLink(id) {
  document.querySelectorAll(`[${DATA_ATTRS.article}]`).forEach(l => l.classList.remove(CLASSES.active));
  document.querySelectorAll(`[${DATA_ATTRS.article}="${id}"]`).forEach(l => l.classList.add(CLASSES.active));
  const activeLink = document.querySelector(`[${DATA_ATTRS.article}="${id}"]`);
  if (!activeLink) return;
  const catList = activeLink.closest(`.${CLASSES.catList}`);
  if (!catList) return;
  catList.classList.remove(CLASSES.collapsed);
  catList.setAttribute('aria-hidden', 'false');
  const header = document.querySelector(`[${DATA_ATTRS.cat}="${catList.id}"]`);
  header?.setAttribute('aria-expanded', 'true');
  const icon = header?.querySelector(`.${CLASSES.toggleIcon}`);
  if (icon) icon.style.transform = '';
}
