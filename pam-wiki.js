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
    'ergonomia-uzytkowania':'wiki/ergonomia-uzytkowania.md',
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
    'animations':           'wiki/animations.md',
    'navigation-patterns':  'wiki/navigation-patterns.md',
    'gestures-interactions':'wiki/gestures-interactions.md',
    'mqtt-protocol':        'wiki/mqtt-protocol.md',
    'game-monetization':    'wiki/game-monetization.md',
    'robot-control-ui':     'wiki/robot-control-ui.md',
    'ros2-mobile':          'wiki/ros2-mobile.md',
    'computer-vision-mobile':'wiki/computer-vision-mobile.md',
    'projekt-zaliczeniowy':  'wiki/projekt-zaliczeniowy.md',
    'egzamin-teoretyczny':   'wiki/egzamin-teoretyczny.md',
    'app-publishing':        'wiki/app-publishing.md',
    'app-distribution':      'wiki/app-distribution.md',
    'app-design-process':    'wiki/app-design-process.md',
    'app-metadata':          'wiki/app-metadata.md',
    'file-storage-mobile':   'wiki/file-storage-mobile.md',
};

// NAPRAWKA: ikony używają pełnej klasy FA (np. "fa-brands fa-android")
// zamiast samej nazwy ikony — buildSidebar() nie dokłada już hardkodowanego "fa-solid"
const METADATA = {
    'mobile-os':            { category: 'Projektowanie i OS',             title: 'Systemy operacyjne urządzeń mobilnych',    icon: 'fa-solid fa-mobile-screen-button' },
    'mobile-design':        { category: 'Projektowanie i OS',             title: 'Projektowanie aplikacji mobilnych',        icon: 'fa-solid fa-pen-ruler' },
    'android-ecosystem':    { category: 'Projektowanie i OS',             title: 'Ekosystem Android i Google Play',          icon: 'fa-brands fa-android' },
    'ios-ecosystem':        { category: 'Projektowanie i OS',             title: 'Ekosystem iOS i App Store',                icon: 'fa-brands fa-apple' },
    'mobile-security':      { category: 'Projektowanie i OS',             title: 'Bezpieczeństwo aplikacji mobilnych',       icon: 'fa-solid fa-shield-halved' },
    'mobile-performance':   { category: 'Projektowanie i OS',             title: 'Wydajność aplikacji mobilnych',            icon: 'fa-solid fa-gauge-high' },
    'mobile-hardware':      { category: 'Architektura sprzętu',           title: 'Architektura i budowa urządzeń mobilnych', icon: 'fa-solid fa-microchip' },
    'ui-ux':                { category: 'Metody interakcji UI/UX',        title: 'Metody interakcji i projektowanie UI/UX',  icon: 'fa-solid fa-hand-pointer' },
    'material-design':      { category: 'Metody interakcji UI/UX',        title: 'Material Design 3',                        icon: 'fa-solid fa-palette' },
    'accessibility':        { category: 'Metody interakcji UI/UX',        title: 'Dostępność aplikacji mobilnych',           icon: 'fa-solid fa-universal-access' },
    'ergonomia-uzytkowania':{ category: 'Metody interakcji UI/UX',        title: 'Ergonomia użytkowania',                    icon: 'fa-solid fa-hand-holding-heart' },
    'android-studio':       { category: 'Programowanie natywne Android',  title: 'Android Studio — Kotlin & Compose',        icon: 'fa-brands fa-android' },
    'kotlin-basics':        { category: 'Programowanie natywne Android',  title: 'Kotlin — podstawy języka',                 icon: 'fa-solid fa-code' },
    'jetpack-compose':      { category: 'Programowanie natywne Android',  title: 'Jetpack Compose — deklaratywny UI',        icon: 'fa-solid fa-layer-group' },
    'android-architecture': { category: 'Programowanie natywne Android',  title: 'Architektura aplikacji — MVVM',            icon: 'fa-solid fa-sitemap' },
    'android-data':         { category: 'Programowanie natywne Android',  title: 'Przechowywanie danych — Room',             icon: 'fa-solid fa-database' },
    'android-network':      { category: 'Programowanie natywne Android',  title: 'Sieć i REST API — Retrofit',               icon: 'fa-solid fa-network-wired' },
    'android-testing':      { category: 'Programowanie natywne Android',  title: 'Testowanie aplikacji Android',             icon: 'fa-solid fa-flask' },
    'xcode-ios':            { category: 'Programowanie natywne iOS',      title: 'Xcode — Swift & SwiftUI',                  icon: 'fa-brands fa-apple' },
    'swift-basics':         { category: 'Programowanie natywne iOS',      title: 'Swift — podstawy języka',                  icon: 'fa-solid fa-terminal' },
    'swiftui-advanced':     { category: 'Programowanie natywne iOS',      title: 'SwiftUI — zaawansowane techniki',          icon: 'fa-solid fa-wand-magic-sparkles' },
    'ios-networking':       { category: 'Programowanie natywne iOS',      title: 'Sieć i API w iOS',                         icon: 'fa-solid fa-network-wired' },
    'ios-data':             { category: 'Programowanie natywne iOS',      title: 'Przechowywanie danych w iOS',              icon: 'fa-solid fa-database' },
    'ios-notifications':    { category: 'Programowanie natywne iOS',      title: 'Powiadomienia push w iOS',                 icon: 'fa-solid fa-bell' },
    'cross-platform':       { category: 'Cross-platform i PWA',           title: 'Programowanie cross-platformowe',          icon: 'fa-solid fa-layer-group' },
    'flutter-advanced':     { category: 'Cross-platform i PWA',           title: 'Flutter — zaawansowane techniki',          icon: 'fa-solid fa-wind' },
    'react-native':         { category: 'Cross-platform i PWA',           title: 'React Native',                             icon: 'fa-brands fa-react' },
    'pwa-advanced':         { category: 'Cross-platform i PWA',           title: 'Progressive Web Apps',                     icon: 'fa-solid fa-globe' },
    'kmp-multiplatform':    { category: 'Cross-platform i PWA',           title: 'Kotlin Multiplatform',                     icon: 'fa-solid fa-code-branch' },
    'sensors':              { category: 'Obsługa sensorów',               title: 'Sensory ruchu i środowiskowe',             icon: 'fa-solid fa-compass' },
    'camera-api':           { category: 'Obsługa sensorów',               title: 'Camera API i przetwarzanie obrazu',        icon: 'fa-solid fa-camera' },
    'location-maps':        { category: 'Obsługa sensorów',               title: 'Lokalizacja i mapy',                       icon: 'fa-solid fa-location-dot' },
    'audio-microphone':     { category: 'Obsługa sensorów',               title: 'Audio i mikrofon',                         icon: 'fa-solid fa-microphone' },
    'biometrics':           { category: 'Obsługa sensorów',               title: 'Biometria i uwierzytelnianie',             icon: 'fa-solid fa-fingerprint' },
    'iot-mobile':           { category: 'IoT mobile',                     title: 'Aplikacje mobilne IoT',                    icon: 'fa-solid fa-wifi' },
    'wifi-networking':      { category: 'IoT mobile',                     title: 'Wi-Fi i sieć lokalna',                     icon: 'fa-solid fa-house-signal' },
    'smart-home':           { category: 'IoT mobile',                     title: 'Smart Home i protokoły automatyki',        icon: 'fa-solid fa-house' },
    'mqtt-protocol':        { category: 'IoT mobile',                     title: 'MQTT — protokół dla IoT',                  icon: 'fa-solid fa-tower-broadcast' },
    'affective-computing':  { category: 'Informatyka afektywna',          title: 'Informatyka afektywna w mobile',           icon: 'fa-solid fa-face-smile' },
    'emotion-recognition':  { category: 'Informatyka afektywna',          title: 'Rozpoznawanie emocji z kamery',            icon: 'fa-solid fa-eye' },
    'voice-analysis':       { category: 'Informatyka afektywna',          title: 'Analiza głosu i mowy',                     icon: 'fa-solid fa-wave-square' },
    'mental-health-apps':   { category: 'Informatyka afektywna',          title: 'Aplikacje zdrowia psychicznego',           icon: 'fa-solid fa-heart-pulse' },
    'xr-mobile':            { category: 'XR i rozszerzona rzeczywistość', title: 'Wprowadzenie do XR mobile',                icon: 'fa-solid fa-vr-cardboard' },
    'arcore-advanced':      { category: 'XR i rozszerzona rzeczywistość', title: 'ARCore — zaawansowane techniki',           icon: 'fa-solid fa-cube' },
    'vr-mobile':            { category: 'XR i rozszerzona rzeczywistość', title: 'VR mobilne i Google Cardboard',            icon: 'fa-solid fa-glasses' },
    'mobile-games':         { category: 'Gry mobilne',                    title: 'Podstawy programowania gier mobilnych',    icon: 'fa-solid fa-gamepad' },
    'unity-advanced':       { category: 'Gry mobilne',                    title: 'Unity — zaawansowane techniki',            icon: 'fa-solid fa-cube' },
    'game-physics':         { category: 'Gry mobilne',                    title: 'Fizyka i kolizje w grach mobilnych',       icon: 'fa-solid fa-atom' },
    'game-monetization':    { category: 'Gry mobilne',                    title: 'Monetyzacja gier mobilnych',               icon: 'fa-solid fa-coins' },
    'gpu-rendering':        { category: 'Architektura sprzętu',           title: 'GPU i renderowanie grafiki',               icon: 'fa-solid fa-display' },
    'battery-power':        { category: 'Architektura sprzętu',           title: 'Bateria i zarządzanie energią',            icon: 'fa-solid fa-battery-half' },
    'memory-management':    { category: 'Architektura sprzętu',           title: 'Pamięć RAM i zarządzanie zasobami',        icon: 'fa-solid fa-memory' },
    'display-screen':       { category: 'Architektura sprzętu',           title: 'Wyświetlacze i technologie ekranów',       icon: 'fa-solid fa-display' },
    'connectivity':         { category: 'Architektura sprzętu',           title: 'Łączność bezprzewodowa — LTE, 5G, Wi-Fi 6',icon: 'fa-solid fa-signal' },
    'animations':           { category: 'Metody interakcji UI/UX',        title: 'Animacje w aplikacjach mobilnych',         icon: 'fa-solid fa-wand-magic-sparkles' },
    'navigation-patterns':  { category: 'Metody interakcji UI/UX',        title: 'Wzorce nawigacji',                         icon: 'fa-solid fa-route' },
    'gestures-interactions':{ category: 'Metody interakcji UI/UX',        title: 'Gesty i interakcje dotykowe',              icon: 'fa-solid fa-hand-pointer' },
    'robot-control-ui':     { category: 'Robotyka autonomiczna',          title: 'UI sterowania robotem',                    icon: 'fa-solid fa-gamepad' },
    'robotics-mobile':      { category: 'Robotyka autonomiczna',          title: 'Aplikacja jako kontroler robota',          icon: 'fa-solid fa-robot' },
    'ros2-mobile':          { category: 'Robotyka autonomiczna',          title: 'ROS2 i sterowanie robotem',                icon: 'fa-solid fa-diagram-project' },
    'computer-vision-mobile':{ category: 'Robotyka autonomiczna',         title: 'Computer Vision w robotyce mobilnej',      icon: 'fa-solid fa-eye' },
    'projekt-zaliczeniowy':  { category: 'Zaliczenie',                    title: 'Projekt zaliczeniowy — własna aplikacja',  icon: 'fa-solid fa-laptop-code' },
    'egzamin-teoretyczny':   { category: 'Zaliczenie',                    title: 'Egzamin teoretyczny — przygotowanie',      icon: 'fa-solid fa-graduation-cap' },
    'app-publishing':        { category: 'Projektowanie i OS',            title: 'Publikacja i promocja własnej aplikacji',  icon: 'fa-solid fa-rocket' },
    'app-distribution':      { category: 'Projektowanie i OS',            title: 'Metody dystrybucji — Google Play i F-Droid', icon: 'fa-solid fa-store' },
    'app-design-process':    { category: 'Projektowanie i OS',            title: 'Proces projektowania — Brief, BRD, FRD, TRD', icon: 'fa-solid fa-file-lines' },
    'app-metadata':          { category: 'Projektowanie i OS',            title: 'Zbieranie metadanych przez aplikację',      icon: 'fa-solid fa-tags' },
    'file-storage-mobile':   { category: 'Programowanie natywne Android', title: 'Zapisywanie i odczyt plików na urządzeniu mobilnym', icon: 'fa-solid fa-file-arrow-down' },
};

// NAPRAWKA: ikony kategorii używają pełnej klasy FA
const CATEGORIES = [
    { id: 'cat-os',       name: 'Projektowanie i OS',             icon: 'fa-solid fa-mobile-screen-button', articles: ['mobile-os','mobile-design','app-design-process','app-metadata','android-ecosystem','ios-ecosystem','mobile-security','mobile-performance','app-publishing','app-distribution'] },
    { id: 'cat-hw',       name: 'Architektura sprzętu',           icon: 'fa-solid fa-microchip',            articles: ['mobile-hardware','gpu-rendering','battery-power','memory-management','display-screen','connectivity'] },
    { id: 'cat-ux',       name: 'Metody interakcji UI/UX',        icon: 'fa-solid fa-hand-pointer',         articles: ['ui-ux','material-design','accessibility','ergonomia-uzytkowania','animations','navigation-patterns','gestures-interactions'] },
    { id: 'cat-android',  name: 'Programowanie natywne Android',  icon: 'fa-brands fa-android',             articles: ['android-studio','kotlin-basics','jetpack-compose','android-architecture','android-data','android-network','android-testing'] },
    { id: 'cat-ios',      name: 'Programowanie natywne iOS',      icon: 'fa-brands fa-apple',               articles: ['xcode-ios','swift-basics','swiftui-advanced','ios-networking','ios-data','ios-notifications'] },
    { id: 'cat-cross',    name: 'Cross-platform i PWA',           icon: 'fa-solid fa-layer-group',          articles: ['cross-platform','flutter-advanced','react-native','pwa-advanced','kmp-multiplatform'] },
    { id: 'cat-sensors',  name: 'Obsługa sensorów',               icon: 'fa-solid fa-compass',              articles: ['sensors','camera-api','location-maps','audio-microphone','biometrics'] },
    { id: 'cat-iot',      name: 'IoT mobile',                     icon: 'fa-solid fa-wifi',                 articles: ['iot-mobile','wifi-networking','smart-home','mqtt-protocol'] },
    { id: 'cat-affective',name: 'Informatyka afektywna',          icon: 'fa-solid fa-face-smile',           articles: ['affective-computing','emotion-recognition','voice-analysis','mental-health-apps'] },
    { id: 'cat-xr',       name: 'XR i rozszerzona rzeczywistość', icon: 'fa-solid fa-vr-cardboard',         articles: ['xr-mobile','arcore-advanced','vr-mobile'] },
    { id: 'cat-games',    name: 'Gry mobilne',                    icon: 'fa-solid fa-gamepad',              articles: ['mobile-games','unity-advanced','game-physics','game-monetization'] },
    { id: 'cat-robots',   name: 'Robotyka autonomiczna',          icon: 'fa-solid fa-robot',                articles: ['robotics-mobile','ros2-mobile','computer-vision-mobile','robot-control-ui'] },
    { id: 'cat-zalicz',  name: 'Zaliczenie',                     icon: 'fa-solid fa-graduation-cap',       articles: ['projekt-zaliczeniowy','egzamin-teoretyczny'] },
];

// ---- INIT ----
document.addEventListener('DOMContentLoaded', () => {
    initThemePicker();
    initScrollProgress();
    initBackToTop();
    waitForMarked();
});

function waitForMarked(attempts = 0) {
    if (typeof marked !== 'undefined') { initWiki(); }
    else if (attempts < 20) setTimeout(() => waitForMarked(attempts + 1), 200);
}

const VALID_THEMES = ['light', 'dark', 'ocean', 'forest', 'sunset', 'rose', 'aurora'];

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
    const bar = document.createElement('div');
    bar.className = 'scroll-progress';
    document.body.appendChild(bar);

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
            navigateToArticle(id);
            if (window.innerWidth < 900) document.querySelector('.wiki-sidebar')?.classList.remove('open');
        });
    });
}

function setActiveLink(id) {
    document.querySelectorAll('[data-article]').forEach(l => l.classList.remove('active'));
    document.querySelectorAll(`[data-article="${id}"]`).forEach(l => l.classList.add('active'));
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

        wrapTables(container);
        addReadingTime(container);
        generateTableOfContents(container);
        processInternalLinks(container);
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

