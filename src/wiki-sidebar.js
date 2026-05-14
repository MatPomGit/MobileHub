'use strict';

import { WikiStore } from './wiki-data.js';

export function buildSidebar(navigateToArticle) {
  const nav = document.querySelector('.wiki-nav-categories');
  if (!nav) return;
  nav.innerHTML = '';

  WikiStore.categories.forEach(cat => {
    const isDefaultExpanded = cat.id === 'cat-zalicz';
    const sec = document.createElement('div');
    sec.className = 'wiki-category';
    sec.innerHTML = `
      <h4 class="cat-header" data-cat="${cat.id}">
        <i class="${cat.icon}"></i><span>${cat.name}</span>
        <i class="fa-solid fa-chevron-down toggle-icon"></i>
      </h4>
      <ul class="cat-list ${isDefaultExpanded ? '' : 'collapsed'}" id="${cat.id}">
        ${cat.articles.map(article => {
          const isInternal = typeof article === 'string';
          const id = isInternal ? article : article.id;
          const href = isInternal ? `#${id}` : article.href;
          const target = isInternal ? '' : ' target="_blank" rel="noopener noreferrer"';
          const dataArticle = isInternal ? ` data-article="${id}"` : '';
          const m = WikiStore.metadata[id] || {};
          return `<li><a href="${href}"${dataArticle}${target}><i class="${m.icon || 'fa-solid fa-file'} article-icon"></i>${m.title || id}</a></li>`;
        }).join('')}
      </ul>`;
    nav.appendChild(sec);
    const icon = sec.querySelector('.toggle-icon');
    if (icon && !isDefaultExpanded) icon.style.transform = 'rotate(-90deg)';
  });

  document.querySelectorAll('.cat-header').forEach(h => h.addEventListener('click', () => {
    const list = document.getElementById(h.dataset.cat);
    if (!list) return;
    const open = !list.classList.contains('collapsed');
    list.classList.toggle('collapsed', open);
    const icon = h.querySelector('.toggle-icon');
    if (icon) icon.style.transform = open ? 'rotate(-90deg)' : '';
  }));

  document.querySelectorAll('[data-article]').forEach(link => link.addEventListener('click', e => {
    e.preventDefault();
    const id = link.dataset.article;
    navigateToArticle(id);
    if (window.innerWidth < 900) document.querySelector('.wiki-sidebar')?.classList.remove('open');
  }));
}

export function setActiveLink(id) {
  document.querySelectorAll('[data-article]').forEach(l => l.classList.remove('active'));
  document.querySelectorAll(`[data-article="${id}"]`).forEach(l => l.classList.add('active'));
  const activeLink = document.querySelector(`[data-article="${id}"]`);
  if (!activeLink) return;
  const catList = activeLink.closest('.cat-list');
  if (!catList) return;
  catList.classList.remove('collapsed');
  const header = document.querySelector(`[data-cat="${catList.id}"]`);
  const icon = header?.querySelector('.toggle-icon');
  if (icon) icon.style.transform = '';
}
