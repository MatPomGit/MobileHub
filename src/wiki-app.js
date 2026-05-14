'use strict';

import { loadWikiConfig, WikiStore } from './wiki-data.js';
import {
  initThemePicker,
  initScrollProgress,
  initBackToTop,
  initSidebarToggle,
} from './wiki-ui.js';
import { createWikiRouter } from './wiki-router.js';
import { buildSidebar, setActiveLink } from './wiki-sidebar.js';
import { setupSearch } from './wiki-search.js';

export async function initApp() {
  initThemePicker();
  initScrollProgress();
  initBackToTop();
  initSidebarToggle();
  initMouseResponsiveAnimations();

  await waitForMarked();
}

async function waitForMarked(attempts = 0) {
  if (typeof marked === 'undefined') {
    if (attempts < 20) {
      setTimeout(() => waitForMarked(attempts + 1), 200);
    }
    return;
  }

  try {
    await loadWikiConfig();
    initWiki();
  } catch (error) {
    showConfigError(error);
  }
}

function initWiki() {
  if (typeof marked !== 'undefined') {
    marked.setOptions({ breaks: true, gfm: true });
  }

  const router = createWikiRouter(loadArticle, setActiveLink);
  buildSidebar(router.navigateToArticle);
  setupSearch();
  router.bindHashRouting();
}

function showConfigError(error) {
  const c = document.getElementById('wikiArticle');
  if (c) {
    c.innerHTML = `<div class="wiki-error"><p><strong>Błąd konfiguracji wiki.</strong></p><p>${error.message}</p></div>`;
  }
}

function showError(msg) {
  const c = document.getElementById('wikiArticle');
  if (c) {
    c.innerHTML = `<div class="wiki-error"><i class="fa-solid fa-triangle-exclamation"></i><p>${msg}</p></div>`;
  }
}

async function loadArticle(articleId) {
  const container = document.getElementById('wikiArticle');
  if (!container) return;

  const path = WikiStore.articles[articleId];
  if (!path) {
    showError('Artykuł nie został znaleziony.');
    return;
  }

  container.innerHTML = '<div class="wiki-loading"><div class="loading-spinner"></div><p>Ładowanie…</p></div>';

  try {
    const res = await fetch(path);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);

    const renderedMarkdown = marked.parse(await res.text());
    container.innerHTML = sanitizeRenderedMarkdown(renderedMarkdown);

    prepareCodeBlocksForHighlighting(container);
    wrapTables(container);
    collapseTopicsList(container);
    addReadingTime(container);
    generateTableOfContents(container);
    processInternalLinks(container, (id) => {
      if (id && WikiStore.articles[id]) {
        window.location.hash = id;
      }
    });
    addCopyButtons(container);
    injectExamQuizCallout(container, articleId);

    if (typeof hljs !== 'undefined') {
      container.querySelectorAll('pre code').forEach((b) => hljs.highlightElement(b));
    }

    container.scrollIntoView({ behavior: 'smooth', block: 'start' });
    updateBreadcrumbs(articleId);
  } catch {
    showError(`Nie można załadować artykułu <strong>${articleId}</strong>. Upewnij się że uruchamiasz stronę przez serwer HTTP (np. <code>python -m http.server</code>).`);
  }
}

function processInternalLinks(container, navigateToArticle) {
  container.querySelectorAll('a[href^="#wiki-"]').forEach((link) => {
    link.addEventListener('click', (e) => {
      e.preventDefault();
      navigateToArticle(link.getAttribute('href').replace('#wiki-', ''));
    });
  });
}

function updateBreadcrumbs(id) {
  const crumbs = document.getElementById('breadcrumbs');
  const meta = WikiStore.metadata[id];
  if (!crumbs || !meta) return;

  document.getElementById('currentCategory').textContent = meta.category;
  document.getElementById('currentArticle').textContent = meta.title;
  crumbs.style.display = 'flex';
}

function sanitizeRenderedMarkdown(html) {
  if (typeof DOMPurify !== 'undefined') {
    return DOMPurify.sanitize(html, {
      FORBID_TAGS: ['script', 'style', 'iframe', 'object', 'embed', 'form', 'input', 'button', 'textarea', 'select'],
      FORBID_ATTR: ['onerror', 'onload', 'onclick', 'onmouseover', 'style'],
      ALLOW_UNKNOWN_PROTOCOLS: false,
    });
  }

  const parser = new DOMParser();
  const doc = parser.parseFromString(html, 'text/html');
  doc.querySelectorAll('script, style, iframe, object, embed, form, input, button, textarea, select, svg, math').forEach((el) => el.remove());
  doc.querySelectorAll('*').forEach((el) => {
    [...el.attributes].forEach((attr) => {
      const n = attr.name.toLowerCase();
      const v = (attr.value || '').trim().toLowerCase();
      if (n.startsWith('on') || n === 'style') {
        el.removeAttribute(attr.name);
        return;
      }
      if ((n === 'href' || n === 'src' || n === 'xlink:href') && v.startsWith('javascript:')) {
        el.removeAttribute(attr.name);
      }
    });
  });
  return doc.body.innerHTML;
}

function prepareCodeBlocksForHighlighting(container) {
  container.querySelectorAll('pre code').forEach((cb) => {
    if (!Array.from(cb.classList).some((c) => c.startsWith('language-'))) {
      cb.classList.add('language-plaintext');
    }
  });
}

function wrapTables(container) {
  container.querySelectorAll('table').forEach((table) => {
    if (table.closest('.table-wrapper')) return;
    const w = document.createElement('div');
    w.className = 'table-wrapper';
    table.parentNode.insertBefore(w, table);
    w.appendChild(table);
  });
}

function collapseTopicsList(container) {
  container.querySelectorAll('ul, ol').forEach((list) => {
    if (list.children.length > 12) {
      list.classList.add('collapsed-topics-list');
      list.dataset.collapsed = 'true';
    }
  });
}

function addCopyButtons(container) {
  container.querySelectorAll('pre').forEach((pre) => {
    if (pre.querySelector('.copy-code-btn')) return;
    const code = pre.querySelector('code');
    if (!code) return;
    const btn = document.createElement('button');
    btn.className = 'copy-code-btn';
    btn.type = 'button';
    btn.textContent = 'Kopiuj';
    btn.addEventListener('click', async () => {
      try {
        await navigator.clipboard.writeText(code.innerText);
        btn.textContent = 'Skopiowano';
        setTimeout(() => { btn.textContent = 'Kopiuj'; }, 1200);
      } catch {
        btn.textContent = 'Błąd';
      }
    });
    pre.appendChild(btn);
  });
}

function injectExamQuizCallout(container, articleId) {
  const meta = WikiStore.metadata[articleId];
  if (!meta?.quiz) return;
  if (container.querySelector('.exam-quiz-callout')) return;

  const callout = document.createElement('div');
  callout.className = 'exam-quiz-callout';
  callout.innerHTML = '<i class="fa-solid fa-circle-question"></i><strong>Quiz:</strong> Ten temat zawiera pytania egzaminacyjne — zwróć uwagę na sekcje z przykładami.';
  container.querySelector('h1')?.insertAdjacentElement('afterend', callout);
}

function addReadingTime(container) {
  const mins = Math.ceil(container.textContent.trim().split(/\s+/).length / 200);
  const b = document.createElement('div');
  b.className = 'reading-time';
  b.innerHTML = `<i class="fa-solid fa-clock"></i><span>${mins} min czytania</span>`;
  container.querySelector('h1')?.insertAdjacentElement('afterend', b);
}

function generateTableOfContents(container) {
  const hs = container.querySelectorAll('h2, h3');
  if (hs.length < 3) return;

  const toc = document.createElement('div');
  toc.className = 'article-toc';
  toc.innerHTML = '<h3><i class="fa-solid fa-list"></i> Spis Treści</h3><ul></ul>';

  const ul = toc.querySelector('ul');
  hs.forEach((h, i) => {
    const id = `heading-${i}`;
    h.id = id;

    const li = document.createElement('li');
    li.style.paddingLeft = h.tagName === 'H3' ? '16px' : '0';
    li.innerHTML = `<a href="#${id}">${h.textContent}</a>`;
    ul.appendChild(li);

    li.querySelector('a').addEventListener('click', (e) => {
      e.preventDefault();
      h.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  });

  container.querySelector('h1')?.insertAdjacentElement('afterend', toc);
}

function initMouseResponsiveAnimations() {
  if (!window.matchMedia('(hover: hover) and (pointer: fine)').matches) return;

  document.querySelectorAll('.quick-link-card, .info-card, .tool-card, .materials-card, .file-item').forEach((card) => {
    let rafId = null;
    let nextX = 0;
    let nextY = 0;

    const renderTilt = () => {
      card.style.setProperty('--mouse-x', `${nextX}%`);
      card.style.setProperty('--mouse-y', `${nextY}%`);
      card.style.setProperty('--tilt-x', `${((50 - nextY) / 14).toFixed(2)}deg`);
      card.style.setProperty('--tilt-y', `${((nextX - 50) / 14).toFixed(2)}deg`);
      rafId = null;
    };

    card.addEventListener('mousemove', (event) => {
      const rect = card.getBoundingClientRect();
      nextX = ((event.clientX - rect.left) / rect.width) * 100;
      nextY = ((event.clientY - rect.top) / rect.height) * 100;
      if (!rafId) rafId = requestAnimationFrame(renderTilt);
    });

    card.addEventListener('mouseenter', () => card.classList.add('mouse-reactive-active'));
    card.addEventListener('mouseleave', () => {
      card.classList.remove('mouse-reactive-active');
      card.style.removeProperty('--tilt-x');
      card.style.removeProperty('--tilt-y');
      card.style.removeProperty('--mouse-x');
      card.style.removeProperty('--mouse-y');
    });
  });
}
