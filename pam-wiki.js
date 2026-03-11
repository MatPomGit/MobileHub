/**
 * WIKI System - Programowanie Aplikacji Mobilnych (PAM)
 * Katedra Informatyki - Politechnika Rzeszowska
 * Version: 2.2 — fix: poprawione klasy ikon FA (fa-brands vs fa-solid), zastąpione ikony Pro-only
 */

'use strict';

const ARTICLES = {
    'mobile-os':            'wiki/mobile-os.md',
    'mobile-design':        'wiki/mobile-design.md',
    'android-ecosystem':    'wiki/android-ecosystem.md',
    'ios-ecosystem':        'wiki/ios-ecosystem.md',
    'mobile-security':      'wiki/mobile-security.md',
    'mobile-performance':   'wiki/mobile-performance.md',
    'mobile-hardware':      'wiki/mobile-hardware.md',
    'ui-ux':                'wiki/ui-ux.md',
    'material-design':      'wiki/material-design.md',
    'accessibility':        'wiki/accessibility.md',
    'android-studio':       'wiki/android-studio.md',
    'kotlin-basics':        'wiki/kotlin-basics.md',
    'jetpack-compose':      'wiki/jetpack-compose.md',
    'android-architecture': 'wiki/android-architecture.md',
    'android-data':         'wiki/android-data.md',
    'android-network':      'wiki/android-network.md',
    'android-testing':      'wiki/android-testing.md',
    'xcode-ios':            'wiki/xcode-ios.md',
    'swift-basics':         'wiki/swift-basics.md',
    'swiftui-advanced':     'wiki/swiftui-advanced.md',
    'ios-networking':       'wiki/ios-networking.md',
    'ios-data':             'wiki/ios-data.md',
    'ios-notifications':    'wiki/ios-notifications.md',
    'cross-platform':       'wiki/cross-platform.md',
    'flutter-advanced':     'wiki/flutter-advanced.md',
    'react-native':         'wiki/react-native.md',
    'pwa-advanced':         'wiki/pwa-advanced.md',
    'kmp-multiplatform':    'wiki/kmp-multiplatform.md',
    'sensors':              'wiki/sensors.md',
    'camera-api':           'wiki/camera-api.md',
    'location-maps':        'wiki/location-maps.md',
    'audio-microphone':     'wiki/audio-microphone.md',
    'biometrics':           'wiki/biometrics.md',
    'iot-mobile':           'wiki/iot-mobile.md',
    'wifi-networking':      'wiki/wifi-networking.md',
    'smart-home':           'wiki/smart-home.md',
    'affective-computing':  'wiki/affective-computing.md',
    'emotion-recognition':  'wiki/emotion-recognition.md',
    'voice-analysis':       'wiki/voice-analysis.md',
    'mental-health-apps':   'wiki/mental-health-apps.md',
    'xr-mobile':            'wiki/xr-mobile.md',
    'arcore-advanced':      'wiki/arcore-advanced.md',
    'vr-mobile':            'wiki/vr-mobile.md',
    'mobile-games':         'wiki/mobile-games.md',
    'unity-advanced':       'wiki/unity-advanced.md',
    'game-physics':         'wiki/game-physics.md',
    'robotics-mobile':      'wiki/robotics-mobile.md',
    'gpu-rendering':        'wiki/gpu-rendering.md',
    'battery-power':        'wiki/battery-power.md',
    'memory-management':    'wiki/memory-management.md',
    'display-screen':       'wiki/display-screen.md',
    'connectivity':         'wiki/connectivity.md',
    'navigation-patterns':  'wiki/navigation-patterns.md',
    'gestures-interactions':'wiki/gestures-interactions.md',
    'mqtt-protocol':        'wiki/mqtt-protocol.md',
    'game-monetization':    'wiki/game-monetization.md',
    'robot-control-ui':     'wiki/robot-control-ui.md',
    'ros2-mobile':          'wiki/ros2-mobile.md',
    'computer-vision-mobile':'wiki/computer-vision-mobile.md',
    'projekt-zaliczeniowy':  'wiki/projekt-zaliczeniowy.md',
    'egzamin-teoretyczny':   'wiki/egzamin-teoretyczny.md',
};

// NAPRAWKA: ikony używają pełnej klasy FA (np. "fa-brands fa-android")
// zamiast samej nazwy ikony — buildSidebar() nie dokłada już hardkodowanego "fa-solid"
const METADATA = {
    'mobile-os':            { category: 'Projektowanie i OS',             title: 'Systemy Operacyjne Urządzeń Mobilnych',    icon: 'fa-solid fa-mobile-screen-button' },
    'mobile-design':        { category: 'Projektowanie i OS',             title: 'Projektowanie Aplikacji Mobilnych',        icon: 'fa-solid fa-pen-ruler' },
    'android-ecosystem':    { category: 'Projektowanie i OS',             title: 'Ekosystem Android i Google Play',          icon: 'fa-brands fa-android' },
    'ios-ecosystem':        { category: 'Projektowanie i OS',             title: 'Ekosystem iOS i App Store',                icon: 'fa-brands fa-apple' },
    'mobile-security':      { category: 'Projektowanie i OS',             title: 'Bezpieczeństwo Aplikacji Mobilnych',       icon: 'fa-solid fa-shield-halved' },
    'mobile-performance':   { category: 'Projektowanie i OS',             title: 'Wydajność Aplikacji Mobilnych',            icon: 'fa-solid fa-gauge-high' },
    'mobile-hardware':      { category: 'Architektura Sprzętu',           title: 'Architektura i Budowa Urządzeń Mobilnych', icon: 'fa-solid fa-microchip' },
    'ui-ux':                { category: 'Metody Interakcji UI/UX',        title: 'Metody Interakcji i Projektowanie UI/UX',  icon: 'fa-solid fa-hand-pointer' },
    'material-design':      { category: 'Metody Interakcji UI/UX',        title: 'Material Design 3',                        icon: 'fa-solid fa-palette' },
    'accessibility':        { category: 'Metody Interakcji UI/UX',        title: 'Dostępność Aplikacji Mobilnych',           icon: 'fa-solid fa-universal-access' },
    'android-studio':       { category: 'Programowanie Natywne Android',  title: 'Android Studio — Kotlin & Compose',        icon: 'fa-brands fa-android' },
    'kotlin-basics':        { category: 'Programowanie Natywne Android',  title: 'Kotlin — Podstawy Języka',                 icon: 'fa-solid fa-code' },
    'jetpack-compose':      { category: 'Programowanie Natywne Android',  title: 'Jetpack Compose — Deklaratywny UI',        icon: 'fa-solid fa-layer-group' },
    'android-architecture': { category: 'Programowanie Natywne Android',  title: 'Architektura Aplikacji — MVVM',            icon: 'fa-solid fa-sitemap' },
    'android-data':         { category: 'Programowanie Natywne Android',  title: 'Przechowywanie Danych — Room',             icon: 'fa-solid fa-database' },
    'android-network':      { category: 'Programowanie Natywne Android',  title: 'Sieć i REST API — Retrofit',               icon: 'fa-solid fa-network-wired' },
    'android-testing':      { category: 'Programowanie Natywne Android',  title: 'Testowanie Aplikacji Android',             icon: 'fa-solid fa-flask' },
    'xcode-ios':            { category: 'Programowanie Natywne iOS',      title: 'Xcode — Swift & SwiftUI',                  icon: 'fa-brands fa-apple' },
    'swift-basics':         { category: 'Programowanie Natywne iOS',      title: 'Swift — Podstawy Języka',                  icon: 'fa-solid fa-terminal' },
    'swiftui-advanced':     { category: 'Programowanie Natywne iOS',      title: 'SwiftUI — Zaawansowane Techniki',          icon: 'fa-solid fa-wand-magic-sparkles' },
    'ios-networking':       { category: 'Programowanie Natywne iOS',      title: 'Sieć i API w iOS',                         icon: 'fa-solid fa-network-wired' },
    'ios-data':             { category: 'Programowanie Natywne iOS',      title: 'Przechowywanie Danych w iOS',              icon: 'fa-solid fa-database' },
    'ios-notifications':    { category: 'Programowanie Natywne iOS',      title: 'Powiadomienia Push w iOS',                 icon: 'fa-solid fa-bell' },
    'cross-platform':       { category: 'Cross-Platform i PWA',           title: 'Programowanie Cross-Platformowe',          icon: 'fa-solid fa-layer-group' },
    'flutter-advanced':     { category: 'Cross-Platform i PWA',           title: 'Flutter — Zaawansowane Techniki',          icon: 'fa-solid fa-wind' },
    'react-native':         { category: 'Cross-Platform i PWA',           title: 'React Native',                             icon: 'fa-brands fa-react' },
    'pwa-advanced':         { category: 'Cross-Platform i PWA',           title: 'Progressive Web Apps',                     icon: 'fa-solid fa-globe' },
    'kmp-multiplatform':    { category: 'Cross-Platform i PWA',           title: 'Kotlin Multiplatform',                     icon: 'fa-solid fa-code-branch' },
    'sensors':              { category: 'Obsługa Sensorów',               title: 'Sensory Ruchu i Środowiskowe',             icon: 'fa-solid fa-compass' },
    'camera-api':           { category: 'Obsługa Sensorów',               title: 'Camera API i Przetwarzanie Obrazu',        icon: 'fa-solid fa-camera' },
    'location-maps':        { category: 'Obsługa Sensorów',               title: 'Lokalizacja i Mapy',                       icon: 'fa-solid fa-location-dot' },
    'audio-microphone':     { category: 'Obsługa Sensorów',               title: 'Audio i Mikrofon',                         icon: 'fa-solid fa-microphone' },
    'biometrics':           { category: 'Obsługa Sensorów',               title: 'Biometria i Uwierzytelnianie',             icon: 'fa-solid fa-fingerprint' },
    'iot-mobile':           { category: 'IoT Mobile',                     title: 'Aplikacje Mobilne IoT',                    icon: 'fa-solid fa-wifi' },
    'wifi-networking':      { category: 'IoT Mobile',                     title: 'Wi-Fi i Sieć Lokalna',                     icon: 'fa-solid fa-house-signal' },
    'smart-home':           { category: 'IoT Mobile',                     title: 'Smart Home i Protokoły Automatyki',        icon: 'fa-solid fa-house' },
    'mqtt-protocol':        { category: 'IoT Mobile',                     title: 'MQTT — Protokół dla IoT',                  icon: 'fa-solid fa-tower-broadcast' },
    'affective-computing':  { category: 'Informatyka Afektywna',          title: 'Informatyka Afektywna w Mobile',           icon: 'fa-solid fa-face-smile' },
    'emotion-recognition':  { category: 'Informatyka Afektywna',          title: 'Rozpoznawanie Emocji z Kamery',            icon: 'fa-solid fa-eye' },
    'voice-analysis':       { category: 'Informatyka Afektywna',          title: 'Analiza Głosu i Mowy',                     icon: 'fa-solid fa-wave-square' },
    'mental-health-apps':   { category: 'Informatyka Afektywna',          title: 'Aplikacje Zdrowia Psychicznego',           icon: 'fa-solid fa-heart-pulse' },
    'xr-mobile':            { category: 'XR i Rozszerzona Rzeczywistość', title: 'Wprowadzenie do XR Mobile',                icon: 'fa-solid fa-vr-cardboard' },
    'arcore-advanced':      { category: 'XR i Rozszerzona Rzeczywistość', title: 'ARCore — Zaawansowane Techniki',           icon: 'fa-solid fa-cube' },
    'vr-mobile':            { category: 'XR i Rozszerzona Rzeczywistość', title: 'VR Mobilne i Google Cardboard',            icon: 'fa-solid fa-glasses' },
    'mobile-games':         { category: 'Gry Mobilne',                    title: 'Podstawy Programowania Gier Mobilnych',    icon: 'fa-solid fa-gamepad' },
    'unity-advanced':       { category: 'Gry Mobilne',                    title: 'Unity — Zaawansowane Techniki',            icon: 'fa-solid fa-cube' },
    'game-physics':         { category: 'Gry Mobilne',                    title: 'Fizyka i Kolizje w Grach Mobilnych',       icon: 'fa-solid fa-atom' },
    'game-monetization':    { category: 'Gry Mobilne',                    title: 'Monetyzacja Gier Mobilnych',               icon: 'fa-solid fa-coins' },
    'gpu-rendering':        { category: 'Architektura Sprzętu',           title: 'GPU i Renderowanie Grafiki',               icon: 'fa-solid fa-display' },
    'battery-power':        { category: 'Architektura Sprzętu',           title: 'Bateria i Zarządzanie Energią',            icon: 'fa-solid fa-battery-half' },
    'memory-management':    { category: 'Architektura Sprzętu',           title: 'Pamięć RAM i Zarządzanie Zasobami',        icon: 'fa-solid fa-memory' },
    'display-screen':       { category: 'Architektura Sprzętu',           title: 'Wyświetlacze i Technologie Ekranów',       icon: 'fa-solid fa-display' },
    'connectivity':         { category: 'Architektura Sprzętu',           title: 'Łączność Bezprzewodowa — LTE, 5G, Wi-Fi 6',icon: 'fa-solid fa-signal' },
    'navigation-patterns':  { category: 'Metody Interakcji UI/UX',        title: 'Wzorce Nawigacji',                         icon: 'fa-solid fa-route' },
    'gestures-interactions':{ category: 'Metody Interakcji UI/UX',        title: 'Gesty i Interakcje Dotykowe',              icon: 'fa-solid fa-hand-pointer' },
    'robot-control-ui':     { category: 'Robotyka Autonomiczna',          title: 'UI Sterowania Robotem',                    icon: 'fa-solid fa-gamepad' },
    'robotics-mobile':      { category: 'Robotyka Autonomiczna',          title: 'Aplikacja jako Kontroler Robota',          icon: 'fa-solid fa-robot' },
    'ros2-mobile':          { category: 'Robotyka Autonomiczna',          title: 'ROS2 i Sterowanie Robotem',                icon: 'fa-solid fa-diagram-project' },
    'computer-vision-mobile':{ category: 'Robotyka Autonomiczna',         title: 'Computer Vision w Robotyce Mobilnej',      icon: 'fa-solid fa-eye' },
    'projekt-zaliczeniowy':  { category: 'Zaliczenie',                    title: 'Projekt Zaliczeniowy — Własna Aplikacja',  icon: 'fa-solid fa-laptop-code' },
    'egzamin-teoretyczny':   { category: 'Zaliczenie',                    title: 'Egzamin Teoretyczny — Przygotowanie',      icon: 'fa-solid fa-graduation-cap' },
};

// NAPRAWKA: ikony kategorii używają pełnej klasy FA
const CATEGORIES = [
    { id: 'cat-os',       name: 'Projektowanie i OS',             icon: 'fa-solid fa-mobile-screen-button', articles: ['mobile-os','mobile-design','android-ecosystem','ios-ecosystem','mobile-security','mobile-performance'] },
    { id: 'cat-hw',       name: 'Architektura Sprzętu',           icon: 'fa-solid fa-microchip',            articles: ['mobile-hardware','gpu-rendering','battery-power','memory-management','display-screen','connectivity'] },
    { id: 'cat-ux',       name: 'Metody Interakcji UI/UX',        icon: 'fa-solid fa-hand-pointer',         articles: ['ui-ux','material-design','accessibility','navigation-patterns','gestures-interactions'] },
    { id: 'cat-android',  name: 'Programowanie Natywne Android',  icon: 'fa-brands fa-android',             articles: ['android-studio','kotlin-basics','jetpack-compose','android-architecture','android-data','android-network','android-testing'] },
    { id: 'cat-ios',      name: 'Programowanie Natywne iOS',      icon: 'fa-brands fa-apple',               articles: ['xcode-ios','swift-basics','swiftui-advanced','ios-networking','ios-data','ios-notifications'] },
    { id: 'cat-cross',    name: 'Cross-Platform i PWA',           icon: 'fa-solid fa-layer-group',          articles: ['cross-platform','flutter-advanced','react-native','pwa-advanced','kmp-multiplatform'] },
    { id: 'cat-sensors',  name: 'Obsługa Sensorów',               icon: 'fa-solid fa-compass',              articles: ['sensors','camera-api','location-maps','audio-microphone','biometrics'] },
    { id: 'cat-iot',      name: 'IoT Mobile',                     icon: 'fa-solid fa-wifi',                 articles: ['iot-mobile','wifi-networking','smart-home','mqtt-protocol'] },
    { id: 'cat-affective',name: 'Informatyka Afektywna',          icon: 'fa-solid fa-face-smile',           articles: ['affective-computing','emotion-recognition','voice-analysis','mental-health-apps'] },
    { id: 'cat-xr',       name: 'XR i Rozszerzona Rzeczywistość', icon: 'fa-solid fa-vr-cardboard',         articles: ['xr-mobile','arcore-advanced','vr-mobile'] },
    { id: 'cat-games',    name: 'Gry Mobilne',                    icon: 'fa-solid fa-gamepad',              articles: ['mobile-games','unity-advanced','game-physics','game-monetization'] },
    { id: 'cat-robots',   name: 'Robotyka Autonomiczna',          icon: 'fa-solid fa-robot',                articles: ['robotics-mobile','ros2-mobile','computer-vision-mobile','robot-control-ui'] },
    { id: 'cat-zalicz',  name: 'Zaliczenie',                     icon: 'fa-solid fa-graduation-cap',       articles: ['projekt-zaliczeniowy','egzamin-teoretyczny'] },
];

// ---- INIT ----
document.addEventListener('DOMContentLoaded', () => waitForMarked());

function waitForMarked(attempts = 0) {
    if (typeof marked !== 'undefined') { initWiki(); initDarkMode(); initScrollProgress(); }
    else if (attempts < 20) setTimeout(() => waitForMarked(attempts + 1), 200);
}

function initDarkMode() {
    const btn = document.getElementById('darkModeToggle');
    const saved = localStorage.getItem('pam-theme') || 'light';
    document.documentElement.setAttribute('data-theme', saved);
    updateDarkIcon(saved);
    btn?.addEventListener('click', () => {
        const next = document.documentElement.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
        document.documentElement.setAttribute('data-theme', next);
        localStorage.setItem('pam-theme', next);
        updateDarkIcon(next);
    });
}
function updateDarkIcon(t) {
    const i = document.querySelector('#darkModeToggle i');
    if (i) i.className = t === 'dark' ? 'fa-solid fa-sun' : 'fa-solid fa-moon';
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
    if (typeof marked !== 'undefined') marked.setOptions({ breaks: true, gfm: true });
    buildSidebar();
    setupSearch();
    const hash = window.location.hash.substring(1);
    if (hash && ARTICLES[hash]) loadArticle(hash);
    window.addEventListener('hashchange', () => {
        const id = window.location.hash.substring(1);
        if (id && ARTICLES[id]) { loadArticle(id); setActiveLink(id); }
    });
}

function buildSidebar() {
    const nav = document.querySelector('.wiki-nav-categories');
    if (!nav) return;
    CATEGORIES.forEach(cat => {
        const sec = document.createElement('div');
        sec.className = 'wiki-category';
        // NAPRAWKA: ikony kategorii i artykułów mają już pełną klasę FA w danych —
        // nie doklejamy hardkodowanego "fa-solid", tylko używamy icon bezpośrednio
        sec.innerHTML = `
            <h4 class="cat-header" data-cat="${cat.id}">
                <i class="${cat.icon}"></i>
                <span>${cat.name}</span>
                <i class="fa-solid fa-chevron-down toggle-icon"></i>
            </h4>
            <ul class="cat-list" id="${cat.id}">
                ${cat.articles.map(id => {
                    const m = METADATA[id] || {};
                    return `<li><a href="#${id}" data-article="${id}"><i class="${m.icon || 'fa-solid fa-file'} article-icon"></i>${m.title || id}</a></li>`;
                }).join('')}
            </ul>`;
        nav.appendChild(sec);
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
            window.location.hash = id;
            loadArticle(id);
            setActiveLink(id);
            if (window.innerWidth < 900) document.querySelector('.wiki-sidebar')?.classList.remove('open');
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

        addReadingTime(container);
        generateTableOfContents(container);
        processInternalLinks(container);
        addCopyButtons(container);

        if (typeof hljs !== 'undefined') {
            container.querySelectorAll('pre code').forEach(b => hljs.highlightElement(b));
        }
        container.scrollIntoView({ behavior: 'smooth', block: 'start' });
        updateBreadcrumbs(articleId);
    } catch (err) {
        showError(`Nie można załadować artykułu <strong>${articleId}</strong>. Upewnij się że uruchamiasz stronę przez serwer HTTP (np. <code>python -m http.server</code>).`);
    }
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
        const wrap = document.createElement('div');
        wrap.className = 'code-block-wrapper';
        pre.parentNode.insertBefore(wrap, pre);
        wrap.appendChild(pre);
        const btn = document.createElement('button');
        btn.className = 'copy-code-btn';
        btn.innerHTML = '<i class="fa-solid fa-copy"></i> Kopiuj';
        btn.addEventListener('click', async () => {
            const code = pre.querySelector('code')?.textContent || pre.textContent;
            try {
                await navigator.clipboard.writeText(code);
                btn.innerHTML = '<i class="fa-solid fa-check"></i> Skopiowano!';
                btn.classList.add('copied');
                setTimeout(() => { btn.innerHTML = '<i class="fa-solid fa-copy"></i> Kopiuj'; btn.classList.remove('copied'); }, 2000);
            } catch { btn.innerHTML = '<i class="fa-solid fa-xmark"></i> Błąd'; }
        });
        wrap.appendChild(btn);
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
