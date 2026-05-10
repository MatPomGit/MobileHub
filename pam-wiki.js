/**
 * WIKI System - Programowanie Aplikacji Mobilnych (PAM)
 * Katedra Informatyki - Politechnika Rzeszowska
 * Version: 2.2 - fix: poprawione klasy ikon FA (fa-brands vs fa-solid), zastąpione ikony Pro-only
 */

'use strict';

let ARTICLES = {};
let METADATA = {};
let CATEGORIES = [];

/**
 * Ładuje konfigurację wiki z zewnętrznego pliku JSON.
 * Dzięki temu dane artykułów i metadane są oddzielone od logiki UI.
 */
async function loadWikiConfig() {
    const response = await fetch('pam-wiki-config.json');
    if (!response.ok) {
        throw new Error(`Nie udało się pobrać konfiguracji wiki (HTTP ${response.status}).`);
    }

    const config = await response.json();
    ARTICLES = config.articles || {};
    METADATA = config.metadata || {};
    CATEGORIES = config.categories || [];
}

// ---- INIT ----
document.addEventListener('DOMContentLoaded', () => {
    initThemePicker();
    initScrollProgress();
    initBackToTop();
    initMouseResponsiveAnimations();
    waitForMarked();
});

async function waitForMarked(attempts = 0) {
    if (typeof marked === 'undefined') {
        if (attempts < 20) setTimeout(() => waitForMarked(attempts + 1), 200);
        return;
    }

    try {
        await loadWikiConfig();
        initWiki();
    } catch (error) {
        showConfigError(error);
    }
}


/**
 * Renderuje czytelny komunikat o błędzie konfiguracji.
 */
function showConfigError(error) {
    const container = document.getElementById('wikiArticle');
    if (!container) return;
    container.innerHTML = `<div class="wiki-error"><p><strong>Błąd konfiguracji wiki.</strong></p><p>${error.message}</p></div>`;
}

const VALID_THEMES = ['light', 'dark', 'ocean', 'forest', 'sunset', 'rose', 'aurora'];


function initMouseResponsiveAnimations() {
    // Efekt uruchamiamy wyłącznie dla urządzeń z precyzyjnym wskaźnikiem (mysz/stylus).
    if (!window.matchMedia('(hover: hover) and (pointer: fine)').matches) return;

    const interactiveCards = document.querySelectorAll('.quick-link-card, .info-card, .tool-card, .materials-card, .file-item');

    interactiveCards.forEach((card) => {
        // Minimalizujemy nakład obliczeń: przechowujemy ostatnie wartości i aktualizujemy je w klatce RAF.
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

            if (!rafId) {
                rafId = requestAnimationFrame(renderTilt);
            }
        });

        card.addEventListener('mouseenter', () => {
            card.classList.add('mouse-reactive-active');
        });

        card.addEventListener('mouseleave', () => {
            card.classList.remove('mouse-reactive-active');
            card.style.removeProperty('--tilt-x');
            card.style.removeProperty('--tilt-y');
            card.style.removeProperty('--mouse-x');
            card.style.removeProperty('--mouse-y');
        });
    });
}
function initThemePicker() {
    const saved = localStorage.getItem('pam-theme') || 'light';
    const theme = VALID_THEMES.includes(saved) ? saved : 'light';
    applyTheme(theme);

    const pickerBtn = document.getElementById('themePickerBtn');
    const dropdown = document.getElementById('themeDropdown');
    const pickerContainer = document.getElementById('themePicker');

    pickerBtn?.addEventListener('click', (e) => {
        e.stopPropagation();
        const isOpen = dropdown.classList.contains('open');
        dropdown.classList.toggle('open', !isOpen);
        pickerBtn.setAttribute('aria-expanded', String(!isOpen));
    });

    document.addEventListener('click', (e) => {
        if (!pickerContainer?.contains(e.target)) {
            dropdown?.classList.remove('open');
            pickerBtn?.setAttribute('aria-expanded', 'false');
        }
    });

    document.querySelectorAll('.theme-option').forEach(btn => {
        btn.addEventListener('click', () => {
            const t = btn.dataset.theme;
            if (VALID_THEMES.includes(t)) {
                applyTheme(t);
                localStorage.setItem('pam-theme', t);
                dropdown?.classList.remove('open');
                pickerBtn?.setAttribute('aria-expanded', 'false');
            }
        });
    });
}

function applyTheme(t) {
    document.documentElement.setAttribute('data-theme', t);
    document.querySelectorAll('.theme-option').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.theme === t);
    });
}

function initScrollProgress() {
    // Decyzja architektoniczna: korzystamy z jednego, statycznego elementu z index.html,
    // aby uniknąć duplikacji paska przy wielokrotnej inicjalizacji skryptów i zachować stabilny DOM.
    const bar = document.getElementById('scrollProgress');
    if (!bar || bar.dataset.initialized) return;
    bar.dataset.initialized = 'true';

    const updateProgress = () => {
        const h = document.documentElement.scrollHeight - document.documentElement.clientHeight;
        const progress = h > 0 ? (window.scrollY / h) * 100 : 0;
        bar.style.width = `${Math.max(0, Math.min(progress, 100))}%`;
    };

    window.addEventListener('scroll', updateProgress);
    window.addEventListener('resize', updateProgress);
    updateProgress();
}

function initBackToTop() {
    const btn = document.getElementById('backToTop');
    if (!btn) return;
    window.addEventListener('scroll', () => {
        btn.classList.toggle('visible', window.scrollY > 300);
    });
    btn.addEventListener('click', () => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
    });
}

function initWiki() {
    if (typeof marked !== 'undefined') marked.setOptions({ breaks: true, gfm: true });
    buildSidebar();
    setupSearch();
    const hash = window.location.hash.substring(1);
    if (hash && ARTICLES[hash]) navigateToArticle(hash, { updateHash: false });
    window.addEventListener('hashchange', () => {
        const id = window.location.hash.substring(1);
        if (id && ARTICLES[id]) navigateToArticle(id, { updateHash: false });
    });
}

function buildSidebar() {
    const nav = document.querySelector('.wiki-nav-categories');
    if (!nav) return;
    CATEGORIES.forEach(cat => {
        // Domyślnie rozwijamy sekcję "Zaliczenie", a pozostałe sekcje pozostają zwinięte.
        const isDefaultExpanded = cat.id === 'cat-zalicz';
        const sec = document.createElement('div');
        sec.className = 'wiki-category';
        sec.innerHTML = `
            <h4 class="cat-header" data-cat="${cat.id}">
                <i class="${cat.icon}"></i>
                <span>${cat.name}</span>
                <i class="fa-solid fa-chevron-down toggle-icon"></i>
            </h4>
            <ul class="cat-list ${isDefaultExpanded ? '' : 'collapsed'}" id="${cat.id}">
                ${cat.articles.map(article => {
                    const isInternal = typeof article === 'string';
                    const id = isInternal ? article : article.id;
                    const href = isInternal ? `#${id}` : article.href;
                    const target = isInternal ? '' : ' target="_blank" rel="noopener noreferrer"';
                    const dataArticle = isInternal ? ` data-article="${id}"` : '';
                    const m = METADATA[id] || {};
                    return `<li><a href="${href}"${dataArticle}${target}><i class="${m.icon || 'fa-solid fa-file'} article-icon"></i>${m.title || id}</a></li>`;
                }).join('')}
            </ul>`;
        nav.appendChild(sec);
        // Utrzymujemy obrót ikony tylko dla sekcji startowo zwiniętych.
        const icon = sec.querySelector('.toggle-icon');
        if (icon && !isDefaultExpanded) icon.style.transform = 'rotate(-90deg)';
    });

    document.querySelectorAll('.cat-header').forEach(h => {
        h.addEventListener('click', () => {
            const list = document.getElementById(h.dataset.cat);
            if (!list) return;
            const open = !list.classList.contains('collapsed');
            list.classList.toggle('collapsed', open);
            const icon = h.querySelector('.toggle-icon');
            if (icon) icon.style.transform = open ? 'rotate(-90deg)' : '';
        });
    });

    document.querySelectorAll('[data-article]').forEach(link => {
        link.addEventListener('click', e => {
            e.preventDefault();
            const id = link.dataset.article;
            navigateToArticle(id);
            if (window.innerWidth < 900) document.querySelector('.wiki-sidebar')?.classList.remove('open');
        });
    });
}

function setActiveLink(id) {
    document.querySelectorAll('[data-article]').forEach(l => l.classList.remove('active'));
    document.querySelectorAll(`[data-article="${id}"]`).forEach(l => l.classList.add('active'));

    // Expand the category that contains this article
    const activeLink = document.querySelector(`[data-article="${id}"]`);
    if (activeLink) {
        const catList = activeLink.closest('.cat-list');
        if (catList) {
            catList.classList.remove('collapsed');
            const header = document.querySelector(`[data-cat="${catList.id}"]`);
            const icon = header?.querySelector('.toggle-icon');
            if (icon) icon.style.transform = '';
        }
    }
}

function navigateToArticle(id, options = {}) {
    if (!id || !ARTICLES[id]) return;

    const { updateHash = true } = options;

    if (updateHash && window.location.hash.substring(1) !== id) {
        window.location.hash = id;
        return;
    }

    loadArticle(id);
    setActiveLink(id);
}

// setupSearch() is defined in pam-files.js

async function loadArticle(articleId) {
    const container = document.getElementById('wikiArticle');
    if (!container) return;
    const path = ARTICLES[articleId];
    if (!path) { showError('Artykuł nie został znaleziony.'); return; }

    container.innerHTML = `<div class="wiki-loading"><div class="loading-spinner"></div><p>Ładowanie…</p></div>`;

    try {
        const res = await fetch(path);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        container.innerHTML = marked.parse(await res.text());

        // Dbamy o spójne kolorowanie składni: jeżeli autor nie poda języka,
        // ustawiamy domyślnie plaintext i czyścimy potencjalnie stare klasy.
        prepareCodeBlocksForHighlighting(container);

        wrapTables(container);
        addReadingTime(container);
        generateTableOfContents(container);
        processInternalLinks(container);
        collapseTopicsList(container, articleId);
        addCopyButtons(container);
        injectExamQuizCallout(container, articleId);

        if (typeof hljs !== 'undefined') {
            container.querySelectorAll('pre code').forEach(b => hljs.highlightElement(b));
        }
        container.scrollIntoView({ behavior: 'smooth', block: 'start' });
        updateBreadcrumbs(articleId);
    } catch (err) {
        showError(`Nie można załadować artykułu <strong>${articleId}</strong>. Upewnij się że uruchamiasz stronę przez serwer HTTP (np. <code>python -m http.server</code>).`);
    }
}

function prepareCodeBlocksForHighlighting(container) {
    container.querySelectorAll('pre code').forEach(codeBlock => {
        const classList = Array.from(codeBlock.classList);
        const hasLanguageClass = classList.some(cls => cls.startsWith('language-'));

        if (!hasLanguageClass) {
            codeBlock.classList.add('language-plaintext');
        }
    });
}

function collapseTopicsList(container, articleId) {
    if (articleId !== 'projekt-zaliczeniowy') return;
    const headings = container.querySelectorAll('h2');
    let targetH2 = null;
    headings.forEach(h => {
        if (h.textContent.trim() === 'Lista przykładowych tematów projektu') {
            targetH2 = h;
        }
    });
    if (!targetH2) return;

    const elementsToCollapse = [];
    let el = targetH2.nextElementSibling;
    while (el && el.tagName !== 'H2') {
        elementsToCollapse.push(el);
        el = el.nextElementSibling;
    }
    if (elementsToCollapse.length === 0) return;

    const wrapperId = 'topics-list-body';
    const wrapper = document.createElement('div');
    wrapper.className = 'topics-collapse-body';
    wrapper.id = wrapperId;
    wrapper.style.display = 'none';
    elementsToCollapse.forEach(elem => wrapper.appendChild(elem));

    const toggle = document.createElement('button');
    toggle.className = 'topics-collapse-toggle';
    toggle.type = 'button';
    toggle.setAttribute('aria-expanded', 'false');
    toggle.setAttribute('aria-controls', wrapperId);
    toggle.innerHTML = '<i class="fa-solid fa-chevron-down"></i> Pokaż listę tematów';
    toggle.addEventListener('click', () => {
        const hidden = wrapper.style.display === 'none';
        wrapper.style.display = hidden ? '' : 'none';
        toggle.setAttribute('aria-expanded', hidden ? 'true' : 'false');
        toggle.innerHTML = hidden
            ? '<i class="fa-solid fa-chevron-up"></i> Ukryj listę tematów'
            : '<i class="fa-solid fa-chevron-down"></i> Pokaż listę tematów';
    });

    targetH2.insertAdjacentElement('afterend', wrapper);
    targetH2.insertAdjacentElement('afterend', toggle);
}


function injectExamQuizCallout(container, articleId) {
    container.querySelector('.exam-quiz-cta')?.remove();
    if (articleId !== 'egzamin-teoretyczny') return;

    const target = container.querySelector('h1') || container.firstElementChild;
    if (!target) return;

    const box = document.createElement('section');
    box.className = 'exam-quiz-cta';
    box.innerHTML = `
        <div class="exam-quiz-cta-content">
            <span class="exam-quiz-badge"><i class="fa-solid fa-pen-to-square"></i> Test wiedzy</span>
            <h2>Sprawdź się w quizie ABCD</h2>
            <p>Przejdź do osobnej strony z pytaniami jednokrotnego wyboru i zobacz wynik po zakończeniu testu.</p>
            <a class="exam-quiz-button" href="test.html" aria-label="Przejdź do strony testu ABCD">
                <i class="fa-solid fa-circle-play"></i>
                Rozpocznij test
            </a>
        </div>
    `;
    target.insertAdjacentElement('afterend', box);
}

function wrapTables(container) {
    container.querySelectorAll('table').forEach(table => {
        if (table.closest('.table-wrapper')) return;
        const wrapper = document.createElement('div');
        wrapper.className = 'table-wrapper';
        table.parentNode.insertBefore(wrapper, table);
        wrapper.appendChild(table);
    });
}

function showError(msg) {
    const container = document.getElementById('wikiArticle');
    if (container) container.innerHTML = `<div class="wiki-error"><i class="fa-solid fa-triangle-exclamation"></i><p>${msg}</p></div>`;
}

function updateBreadcrumbs(id) {
    const crumbs = document.getElementById('breadcrumbs');
    const meta = METADATA[id];
    if (!crumbs || !meta) return;
    document.getElementById('currentCategory').textContent = meta.category;
    document.getElementById('currentArticle').textContent = meta.title;
    crumbs.style.display = 'flex';

    const logoIcon = document.getElementById('headerLogoIcon');
    if (logoIcon && meta.icon) {
        logoIcon.classList.remove(...Array.from(logoIcon.classList).filter(c => c.startsWith('fa-')));
        meta.icon.split(' ').forEach(cls => { if (cls) logoIcon.classList.add(cls); });
    }
}

function processInternalLinks(container) {
    container.querySelectorAll('a[href^="#wiki-"]').forEach(link => {
        link.addEventListener('click', e => {
            e.preventDefault();
            const id = link.getAttribute('href').replace('#wiki-', '');
            navigateToArticle(id);
        });
    });
}

function addCopyButtons(container) {
    // Dodaje akcje dla bloków kodu: szybkie kopiowanie i zgłaszanie błędów.
    container.querySelectorAll('pre').forEach((pre, index) => {
        const wrap = document.createElement('div');
        wrap.className = 'code-block-wrapper';
        pre.parentNode.insertBefore(wrap, pre);
        wrap.appendChild(pre);

        const actions = document.createElement('div');
        actions.className = 'snippet-actions';

        const copyBtn = document.createElement('button');
        copyBtn.className = 'copy-code-btn';
        copyBtn.innerHTML = '<i class="fa-solid fa-copy"></i> Kopiuj';
        copyBtn.addEventListener('click', async () => {
            const code = pre.querySelector('code')?.textContent || pre.textContent;
            try {
                await navigator.clipboard.writeText(code);
                copyBtn.innerHTML = '<i class="fa-solid fa-check"></i> Skopiowano!';
                copyBtn.classList.add('copied');
                setTimeout(() => { copyBtn.innerHTML = '<i class="fa-solid fa-copy"></i> Kopiuj'; copyBtn.classList.remove('copied'); }, 2000);
            } catch {
                copyBtn.innerHTML = '<i class="fa-solid fa-xmark"></i> Błąd';
            }
        });

        // Przycisk tworzy zgłoszenie z predefiniowanym tytułem i miejscem na opis od studenta.
        const reportBtn = document.createElement('button');
        reportBtn.className = 'copy-code-btn report-code-btn';
        reportBtn.innerHTML = '<i class="fa-solid fa-bug"></i> Zgłoś błąd';
        reportBtn.addEventListener('click', () => {
            const articleTitle = container.querySelector('h1')?.textContent?.trim() || 'Nieznany artykuł';
            const snippetTitle = pre.previousElementSibling?.textContent?.trim() || `Snippet #${index + 1}`;
            const codeSample = (pre.querySelector('code')?.textContent || pre.textContent || '').trim();
            const subject = encodeURIComponent(`[Snippet] ${articleTitle} / ${snippetTitle}`);
            const body = encodeURIComponent(
                `Artykuł: ${articleTitle}
Snippet: ${snippetTitle}

Opis problemu:
-

Kroki odtworzenia:
1.
2.

Oczekiwany rezultat:
-

Rzeczywisty rezultat:
-

Fragment kodu:
${codeSample.slice(0, 500)}`
            );
            window.location.href = `mailto:mobilehub.snippets+bugs@gmail.com?subject=${subject}&body=${body}`;
        });

        actions.appendChild(copyBtn);
        actions.appendChild(reportBtn);
        wrap.appendChild(actions);
    });
}

function addReadingTime(container) {
    const mins = Math.ceil(container.textContent.trim().split(/\s+/).length / 200);
    const badge = document.createElement('div');
    badge.className = 'reading-time';
    badge.innerHTML = `<i class="fa-solid fa-clock"></i><span>${mins} min czytania</span>`;
    container.querySelector('h1')?.insertAdjacentElement('afterend', badge);
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
        li.querySelector('a').addEventListener('click', e => {
            e.preventDefault();
            h.scrollIntoView({ behavior: 'smooth', block: 'start' });
        });
    });
    container.querySelector('h1')?.insertAdjacentElement('afterend', toc);
}
// Mobile sidebar toggle
document.addEventListener('DOMContentLoaded', () => {
    const toggle = document.getElementById('sidebarToggle');
    const sidebar = document.getElementById('wikiSidebar');
    toggle?.addEventListener('click', () => sidebar?.classList.toggle('open'));
    document.addEventListener('click', e => {
        if (sidebar?.classList.contains('open') &&
            !sidebar.contains(e.target) &&
            !toggle?.contains(e.target)) {
            sidebar.classList.remove('open');
        }
    });
});
