/**
 * WIKI System - Programowanie Aplikacji Mobilnych (PAM)
 * Katedra Informatyki - Politechnika Rzeszowska
 * Version: 1.0
 */

'use strict';

const ARTICLES = {
    // 1. Projektowanie i systemy OS
    'mobile-os':        'wiki/mobile-os.md',
    'mobile-design':    'wiki/mobile-design.md',

    // 2. Architektura sprzętu
    'mobile-hardware':  'wiki/mobile-hardware.md',

    // 3. UI/UX i interakcje
    'ui-ux':            'wiki/ui-ux.md',

    // 4. Programowanie natywne
    'android-studio':   'wiki/android-studio.md',
    'xcode-ios':        'wiki/xcode-ios.md',

    // 5. Cross-platform i PWA
    'cross-platform':   'wiki/cross-platform.md',

    // 6. Sensory
    'sensors':          'wiki/sensors.md',

    // 7. IoT
    'iot-mobile':       'wiki/iot-mobile.md',

    // 8. Informatyka Afektywna
    'affective-computing': 'wiki/affective-computing.md',

    // 9. XR
    'xr-mobile':        'wiki/xr-mobile.md',

    // 10. Gry mobilne
    'mobile-games':     'wiki/mobile-games.md',

    // 11. Robotyka
    'robotics-mobile':  'wiki/robotics-mobile.md',
};

const METADATA = {
    'mobile-os':         { category: 'Projektowanie i OS', title: 'Systemy Operacyjne Urządzeń Mobilnych', icon: 'fa-mobile-screen-button' },
    'mobile-design':     { category: 'Projektowanie i OS', title: 'Projektowanie Aplikacji Mobilnych', icon: 'fa-pen-ruler' },
    'mobile-hardware':   { category: 'Architektura Sprzętu', title: 'Architektura i Budowa Urządzeń Mobilnych', icon: 'fa-microchip' },
    'ui-ux':             { category: 'Metody Interakcji UI/UX', title: 'Metody Interakcji i Projektowanie UI/UX', icon: 'fa-hand-pointer' },
    'android-studio':    { category: 'Programowanie Natywne', title: 'Android Studio — Kotlin & Compose', icon: 'fa-android' },
    'xcode-ios':         { category: 'Programowanie Natywne', title: 'Xcode — Swift & SwiftUI', icon: 'fa-apple' },
    'cross-platform':    { category: 'Cross-Platform i PWA', title: 'Programowanie Cross-Platformowe i PWA', icon: 'fa-layer-group' },
    'sensors':           { category: 'Obsługa Sensorów', title: 'Obsługa Sensorów Urządzenia Mobilnego', icon: 'fa-compass' },
    'iot-mobile':        { category: 'IoT Mobile', title: 'Programowanie Aplikacji Mobilnych IoT', icon: 'fa-wifi' },
    'affective-computing': { category: 'Informatyka Afektywna', title: 'Informatyka Afektywna w Aplikacjach Mobilnych', icon: 'fa-face-smile' },
    'xr-mobile':         { category: 'XR i Rozszerzona Rzeczywistość', title: 'Programowanie Aplikacji Mobilnych XR', icon: 'fa-vr-cardboard' },
    'mobile-games':      { category: 'Gry Mobilne', title: 'Programowanie Gier Mobilnych', icon: 'fa-gamepad' },
    'robotics-mobile':   { category: 'Robotyka Autonomiczna', title: 'Programowanie Autonomicznych Robotów', icon: 'fa-robot' },
};

const CATEGORIES = [
    {
        id: 'cat-os',
        name: 'Projektowanie i OS',
        icon: 'fa-mobile-screen-button',
        articles: ['mobile-os', 'mobile-design']
    },
    {
        id: 'cat-hw',
        name: 'Architektura Sprzętu',
        icon: 'fa-microchip',
        articles: ['mobile-hardware']
    },
    {
        id: 'cat-ux',
        name: 'Metody Interakcji UI/UX',
        icon: 'fa-hand-pointer',
        articles: ['ui-ux']
    },
    {
        id: 'cat-native',
        name: 'Programowanie Natywne',
        icon: 'fa-code',
        articles: ['android-studio', 'xcode-ios']
    },
    {
        id: 'cat-cross',
        name: 'Cross-Platform i PWA',
        icon: 'fa-layer-group',
        articles: ['cross-platform']
    },
    {
        id: 'cat-sensors',
        name: 'Obsługa Sensorów',
        icon: 'fa-compass',
        articles: ['sensors']
    },
    {
        id: 'cat-iot',
        name: 'IoT Mobile',
        icon: 'fa-wifi',
        articles: ['iot-mobile']
    },
    {
        id: 'cat-affective',
        name: 'Informatyka Afektywna',
        icon: 'fa-face-smile',
        articles: ['affective-computing']
    },
    {
        id: 'cat-xr',
        name: 'XR i Rozszerzona Rzeczywistość',
        icon: 'fa-vr-cardboard',
        articles: ['xr-mobile']
    },
    {
        id: 'cat-games',
        name: 'Gry Mobilne',
        icon: 'fa-gamepad',
        articles: ['mobile-games']
    },
    {
        id: 'cat-robots',
        name: 'Robotyka Autonomiczna',
        icon: 'fa-robot',
        articles: ['robotics-mobile']
    }
];

document.addEventListener('DOMContentLoaded', function () {
    waitForMarked();
});

function waitForMarked(attempts = 0) {
    if (typeof marked !== 'undefined') {
        initWiki();
        initDarkMode();
        initScrollProgress();
    } else if (attempts < 20) {
        setTimeout(() => waitForMarked(attempts + 1), 200);
    } else {
        console.error('marked.js failed to load');
    }
}

function initDarkMode() {
    const btn = document.getElementById('darkModeToggle');
    const saved = localStorage.getItem('pam-theme') || 'light';
    document.documentElement.setAttribute('data-theme', saved);
    updateDarkIcon(saved);

    btn?.addEventListener('click', () => {
        const current = document.documentElement.getAttribute('data-theme');
        const next = current === 'dark' ? 'light' : 'dark';
        document.documentElement.setAttribute('data-theme', next);
        localStorage.setItem('pam-theme', next);
        updateDarkIcon(next);
    });
}

function updateDarkIcon(theme) {
    const icon = document.querySelector('#darkModeToggle i');
    if (icon) icon.className = theme === 'dark' ? 'fa-solid fa-sun' : 'fa-solid fa-moon';
}

function initScrollProgress() {
    const bar = document.createElement('div');
    bar.className = 'scroll-progress';
    document.body.appendChild(bar);
    window.addEventListener('scroll', () => {
        const h = document.documentElement.scrollHeight - document.documentElement.clientHeight;
        bar.style.width = (window.scrollY / h * 100) + '%';
    });
}

function initWiki() {
    if (typeof marked !== 'undefined') {
        marked.setOptions({ breaks: true, gfm: true });
    }

    buildSidebar();
    setupSearch();

    const hash = window.location.hash.substring(1);
    if (hash && ARTICLES[hash]) {
        loadArticle(hash);
    }

    window.addEventListener('hashchange', () => {
        const id = window.location.hash.substring(1);
        if (id && ARTICLES[id]) {
            loadArticle(id);
            setActiveLink(id);
        }
    });
}

function buildSidebar() {
    const nav = document.querySelector('.wiki-nav-categories');
    if (!nav) return;

    CATEGORIES.forEach(cat => {
        const section = document.createElement('div');
        section.className = 'wiki-category';
        section.innerHTML = `
            <h4 class="cat-header" data-cat="${cat.id}">
                <i class="fa-solid ${cat.icon}"></i>
                ${cat.name}
                <i class="fa-solid fa-chevron-down toggle-icon"></i>
            </h4>
            <ul class="cat-list" id="${cat.id}">
                ${cat.articles.map(id => {
                    const m = METADATA[id];
                    return `<li><a href="#${id}" data-article="${id}">
                        <i class="fa-solid ${m.icon} article-icon"></i>
                        ${m.title}
                    </a></li>`;
                }).join('')}
            </ul>
        `;
        nav.appendChild(section);
    });

    // Collapse/expand categories
    document.querySelectorAll('.cat-header').forEach(header => {
        header.addEventListener('click', () => {
            const catId = header.dataset.cat;
            const list = document.getElementById(catId);
            const isOpen = !list.classList.contains('collapsed');
            list.classList.toggle('collapsed', isOpen);
            header.querySelector('.toggle-icon').style.transform = isOpen ? 'rotate(-90deg)' : '';
        });
    });

    // Article link clicks
    document.querySelectorAll('[data-article]').forEach(link => {
        link.addEventListener('click', e => {
            e.preventDefault();
            const id = link.dataset.article;
            window.location.hash = id;
            loadArticle(id);
            setActiveLink(id);

            // Close mobile sidebar
            if (window.innerWidth < 900) {
                document.querySelector('.wiki-sidebar')?.classList.remove('open');
            }
        });
    });
}

function setActiveLink(id) {
    document.querySelectorAll('[data-article]').forEach(l => l.classList.remove('active'));
    document.querySelectorAll(`[data-article="${id}"]`).forEach(l => l.classList.add('active'));
}

function setupSearch() {
    const input = document.getElementById('wikiSearch');
    if (!input) return;

    input.addEventListener('input', () => {
        const query = input.value.toLowerCase().trim();
        document.querySelectorAll('[data-article]').forEach(link => {
            const title = link.textContent.toLowerCase();
            const matches = !query || title.includes(query);
            link.closest('li').style.display = matches ? '' : 'none';
        });

        // Show/hide categories
        document.querySelectorAll('.wiki-category').forEach(cat => {
            const visibleItems = cat.querySelectorAll('li:not([style*="none"])');
            cat.style.display = visibleItems.length > 0 ? '' : 'none';
        });
    });
}

async function loadArticle(articleId) {
    const container = document.getElementById('wikiArticle');
    if (!container) return;

    const path = ARTICLES[articleId];
    if (!path) {
        showError('Artykuł nie został znaleziony.');
        return;
    }

    // Show loading
    container.innerHTML = `
        <div class="wiki-loading">
            <div class="loading-spinner"></div>
            <p>Ładowanie artykułu...</p>
        </div>
    `;

    try {
        const response = await fetch(path);
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        const markdown = await response.text();

        const html = marked.parse(markdown);
        container.innerHTML = html;

        // Post-processing
        addReadingTime(container);
        generateTableOfContents(container);
        processInternalLinks(container);
        addCopyButtons(container);

        // Syntax highlighting
        if (typeof hljs !== 'undefined') {
            container.querySelectorAll('pre code').forEach(block => {
                hljs.highlightElement(block);
            });
        }

        // Scroll to top
        container.scrollIntoView({ behavior: 'smooth', block: 'start' });

        // Update breadcrumbs
        updateBreadcrumbs(articleId);

    } catch (err) {
        console.error('Error loading article:', err);
        showError(`Nie można załadować artykułu. Upewnij się, że pliki wiki/*.md istnieją.`);
    }
}

function updateBreadcrumbs(articleId) {
    const crumbs = document.getElementById('breadcrumbs');
    const meta = METADATA[articleId];
    if (!crumbs || !meta) return;

    document.getElementById('currentCategory').textContent = meta.category;
    document.getElementById('currentArticle').textContent = meta.title;
    crumbs.style.display = 'flex';
}

function processInternalLinks(container) {
    container.querySelectorAll('a[href^="#wiki-"]').forEach(link => {
        link.addEventListener('click', e => {
            e.preventDefault();
            const id = link.getAttribute('href').replace('#wiki-', '');
            window.location.hash = id;
            loadArticle(id);
        });
    });
}

function addCopyButtons(container) {
    container.querySelectorAll('pre').forEach(pre => {
        const wrapper = document.createElement('div');
        wrapper.className = 'code-block-wrapper';
        pre.parentNode.insertBefore(wrapper, pre);
        wrapper.appendChild(pre);

        const btn = document.createElement('button');
        btn.className = 'copy-code-btn';
        btn.innerHTML = '<i class="fa-solid fa-copy"></i> Kopiuj';

        btn.addEventListener('click', async () => {
            const code = pre.querySelector('code')?.textContent || pre.textContent;
            try {
                await navigator.clipboard.writeText(code);
                btn.innerHTML = '<i class="fa-solid fa-check"></i> Skopiowano!';
                btn.classList.add('copied');
                setTimeout(() => {
                    btn.innerHTML = '<i class="fa-solid fa-copy"></i> Kopiuj';
                    btn.classList.remove('copied');
                }, 2000);
            } catch {
                btn.innerHTML = '<i class="fa-solid fa-xmark"></i> Błąd';
            }
        });

        wrapper.appendChild(btn);
    });
}

function addReadingTime(container) {
    const words = container.textContent.trim().split(/\s+/).length;
    const minutes = Math.ceil(words / 200);
    const badge = document.createElement('div');
    badge.className = 'reading-time';
    badge.innerHTML = `<i class="fa-solid fa-clock"></i><span>${minutes} min czytania</span>`;

    const h1 = container.querySelector('h1');
    if (h1) h1.insertAdjacentElement('afterend', badge);
}

function generateTableOfContents(container) {
    const headings = container.querySelectorAll('h2, h3');
    if (headings.length < 3) return;

    const toc = document.createElement('div');
    toc.className = 'article-toc';
    toc.innerHTML = '<h3><i class="fa-solid fa-list"></i> Spis Treści</h3><ul></ul>';
    const ul = toc.querySelector('ul');

    headings.forEach((h, i) => {
        const id = `heading-${i}`;
        h.id = id;
        const li = document.createElement('li');
        li.style.paddingLeft = h.tagName === 'H3' ? '16px' : '0';
        li.innerHTML = `<a href="#${id}">${h.textContent}</a>`;
        li.querySelector('a').addEventListener('click', e => {
            e.preventDefault();
            h.scrollIntoView({ behavior: 'smooth' });
        });
        ul.appendChild(li);
    });

    const readingTime = container.querySelector('.reading-time');
    (readingTime || container.querySelector('h1'))?.insertAdjacentElement('afterend', toc);
}

function showError(msg) {
    const container = document.getElementById('wikiArticle');
    if (!container) return;
    container.innerHTML = `
        <div class="wiki-error">
            <i class="fa-solid fa-triangle-exclamation"></i>
            <h3>${msg}</h3>
            <p>Wybierz artykuł z menu po lewej stronie lub skorzystaj z wyszukiwarki.</p>
        </div>
    `;
    const crumbs = document.getElementById('breadcrumbs');
    if (crumbs) crumbs.style.display = 'none';
}
