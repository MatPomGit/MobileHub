'use strict';

function initBootstrapUi() {
    if (window.__pamBootstrapUiInitialized) return;
    window.__pamBootstrapUiInitialized = true;

            // Register Service Worker
            if ('serviceWorker' in navigator) {
                navigator.serviceWorker.register('sw.js').catch(err => {
                    console.warn('SW registration failed:', err);
                });
            }
            // ===== LEARNING PATHS MODULE =====
            (function initLearningPathsModule() {
                const container = document.getElementById('learningPathsGrid');
                const techFilter = document.getElementById('learningPathsTechFilter');
                const levelFilter = document.getElementById('learningPathsLevelFilter');
                if (!container || !techFilter || !levelFilter) return;
    
                // Dane roadmapy semestru wraz z zależnościami tematów i planem tygodniowym.
                const learningPaths = [
                    { id: 'android-foundations', title: 'Android Foundations', technology: 'Android', level: 'beginner', duration: '1-4 tydzień', prerequisites: ['Podstawy programowania', 'Znajomość składni Kotlin'], topics: ['Android Studio', 'Architektura Android', 'Jetpack Compose', 'Nawigacja UI'], steps: [{ id: 'apf-1', title: 'Wprowadzenie do Android Studio', type: 'article', link: '#android-studio', article: 'android-studio', tag: 'critical' }, { id: 'apf-2', title: 'Podstawy Kotlin', type: 'article', link: '#kotlin-basics', article: 'kotlin-basics', tag: 'critical' }, { id: 'apf-3', title: 'Laboratorium Kotlin', type: 'lab', link: 'zajecia/laby/kotlin.pdf', tag: 'critical' }, { id: 'apf-4', title: 'Jetpack Compose', type: 'article', link: '#jetpack-compose', article: 'jetpack-compose', tag: 'optional' }], weeklyPlan: [{ week: 'T1', topic: 'Setup środowiska', dependencies: 'Brak', material: 'android-studio', lab: 'Lab 1: konfiguracja projektu', deadline: 'Quiz instalacyjny (koniec tygodnia)' }, { week: 'T2', topic: 'Kotlin + OOP', dependencies: 'Setup środowiska', material: 'kotlin-basics', lab: 'Lab 2: podstawy składni', deadline: 'Zadanie 1: klasy i funkcje' }, { week: 'T3', topic: 'Compose i UI', dependencies: 'Kotlin + OOP', material: 'jetpack-compose', lab: 'Lab 3: ekran aplikacji', deadline: 'Oddanie widoków UI' }, { week: 'T4', topic: 'Nawigacja i architektura', dependencies: 'Compose i UI', material: 'android-architecture', lab: 'Lab 4: nawigacja', deadline: 'Milestone MVP' }] },
                    { id: 'flutter-ship', title: 'Flutter Ship It', technology: 'Flutter', level: 'intermediate', duration: '5-8 tydzień', prerequisites: ['Podstawy Dart', 'Podstawy UI mobilnego'], topics: ['Flutter widgets', 'State management', 'Wydajność', 'Publikacja aplikacji'], steps: [{ id: 'flt-1', title: 'Cross-platform overview', type: 'article', link: '#cross-platform', article: 'cross-platform', tag: 'critical' }, { id: 'flt-2', title: 'Laboratorium Flutter', type: 'lab', link: 'zajecia/laby/flutter.pdf', tag: 'critical' }, { id: 'flt-3', title: 'Zaawansowany Flutter', type: 'article', link: '#flutter-advanced', article: 'flutter-advanced', tag: 'optional' }, { id: 'flt-4', title: 'Dystrybucja aplikacji', type: 'article', link: '#app-distribution', article: 'app-distribution', tag: 'critical' }], weeklyPlan: [{ week: 'T5', topic: 'Widget tree', dependencies: 'Kotlin/Swift lub podstawy mobilne', material: 'cross-platform', lab: 'Lab 5: layout i komponenty', deadline: 'Oddanie layoutów' }, { week: 'T6', topic: 'State management', dependencies: 'Widget tree', material: 'flutter-advanced', lab: 'Lab 6: logika stanu', deadline: 'Zadanie 2: stan i walidacja' }, { week: 'T7', topic: 'Integracja API', dependencies: 'State management', material: 'data-storage-best-practices', lab: 'Lab 7: REST i cache', deadline: 'Milestone Beta' }, { week: 'T8', topic: 'Build i release', dependencies: 'Integracja API', material: 'app-distribution', lab: 'Lab 8: pipeline release', deadline: 'Oddanie release candidate' }] },
                    { id: 'android-ai-advanced', title: 'Android + Edge AI', technology: 'Android', level: 'advanced', duration: '9-12 tydzień', prerequisites: ['Android średniozaawansowany', 'Podstawy ML'], topics: ['On-device inference', 'Kwantyzacja modeli', 'Sensory', 'Optymalizacja baterii'], steps: [{ id: 'adai-1', title: 'Wprowadzenie do Local AI', type: 'article', link: '#local-ai-intro', article: 'local-ai-intro', tag: 'critical' }, { id: 'adai-2', title: 'LiteRT LM na Androidzie', type: 'article', link: '#litert-lm-android', article: 'litert-lm-android', tag: 'critical' }, { id: 'adai-3', title: 'Kwantyzacja modeli', type: 'article', link: '#model-quantization', article: 'model-quantization', tag: 'optional' }, { id: 'adai-4', title: 'Laboratorium testy mobilne', type: 'lab', link: 'zajecia/laby/tests.pdf', tag: 'critical' }], weeklyPlan: [{ week: 'T9', topic: 'AI on-device baseline', dependencies: 'Android średniozaawansowany', material: 'local-ai-intro', lab: 'Lab 9: inferencja lokalna', deadline: 'Zadanie 3: benchmark' }, { week: 'T10', topic: 'Kwantyzacja', dependencies: 'AI on-device baseline', material: 'model-quantization', lab: 'Lab 10: optymalizacja modelu', deadline: 'Oddanie raportu wydajności' }, { week: 'T11', topic: 'Sensory i kontekst', dependencies: 'Kwantyzacja', material: 'pam_w06_sensors.pdf', lab: 'Lab 11: dane sensorów', deadline: 'Milestone Final' }, { week: 'T12', topic: 'Prezentacja projektu', dependencies: 'Sensory i kontekst', material: 'projekt-zaliczeniowy', lab: 'Lab 12: demo', deadline: 'Oddanie końcowe + prezentacja' }] },
                    { id: 'ios-swiftui-track', title: 'iOS SwiftUI Accelerator', technology: 'iOS', level: 'intermediate', duration: '5-8 tydzień', prerequisites: ['Podstawy Swift', 'Xcode setup'], topics: ['SwiftUI', 'Networking', 'Powiadomienia', 'Ekosystem Apple'], steps: [{ id: 'ios-1', title: 'Podstawy Swift', type: 'article', link: '#swift-basics', article: 'swift-basics', tag: 'critical' }, { id: 'ios-2', title: 'Ekosystem i procesy iOS', type: 'article', link: '#ios-ecosystem', article: 'ios-ecosystem', tag: 'critical' }, { id: 'ios-3', title: 'Sieć i API w iOS', type: 'article', link: '#ios-networking', article: 'ios-networking', tag: 'critical' }, { id: 'ios-4', title: 'Powiadomienia i engagement', type: 'article', link: '#ios-notifications', article: 'ios-notifications', tag: 'optional' }], weeklyPlan: [{ week: 'T5', topic: 'SwiftUI fundamenty', dependencies: 'Swift', material: 'swift-basics', lab: 'Lab iOS 1: ekran listy', deadline: 'Commit z UI' }, { week: 'T6', topic: 'Architektura i komponenty', dependencies: 'SwiftUI fundamenty', material: 'ios-ecosystem', lab: 'Lab iOS 2: podział modułów', deadline: 'Code review architektury' }, { week: 'T7', topic: 'Networking + cache', dependencies: 'Architektura i komponenty', material: 'ios-networking', lab: 'Lab iOS 3: integracja REST', deadline: 'Milestone API-ready' }, { week: 'T8', topic: 'Notyfikacje i metryki', dependencies: 'Networking + cache', material: 'ios-notifications', lab: 'Lab iOS 4: push flow', deadline: 'Raport retencji użytkowników' }] },
                    { id: 'unity-mobile-games', title: 'Unity Mobile Game Track', technology: 'Unity', level: 'intermediate', duration: '6-10 tydzień', prerequisites: ['Podstawy C#', 'Podstawy grafiki 2D/3D'], topics: ['Loop gry', 'Input mobilny', 'Optymalizacja FPS', 'Monetyzacja i release'], steps: [{ id: 'umt-1', title: 'Unity i gamedev mobile', type: 'article', link: '#mobile-games', article: 'mobile-games', tag: 'critical' }, { id: 'umt-2', title: 'Fizyka i gameplay', type: 'article', link: '#game-physics', article: 'game-physics', tag: 'critical' }, { id: 'umt-3', title: 'Monetyzacja gry mobilnej', type: 'article', link: '#game-monetization', article: 'game-monetization', tag: 'optional' }, { id: 'umt-4', title: 'Zaawansowane Unity', type: 'article', link: '#unity-advanced', article: 'unity-advanced', tag: 'critical' }], weeklyPlan: [{ week: 'T6', topic: 'Pipeline Unity + sceny', dependencies: 'C# basics', material: 'mobile-games', lab: 'Lab U1: prototyp levelu', deadline: 'Commit sceny startowej' }, { week: 'T7', topic: 'Gameplay i fizyka', dependencies: 'Pipeline Unity + sceny', material: 'game-physics', lab: 'Lab U2: ruch i kolizje', deadline: 'Demo mechaniki core loop' }, { week: 'T8', topic: 'UI i economy', dependencies: 'Gameplay i fizyka', material: 'game-monetization', lab: 'Lab U3: waluta i sklep', deadline: 'Milestone vertical slice' }, { week: 'T9-T10', topic: 'Profilowanie i release', dependencies: 'UI i economy', material: 'unity-advanced', lab: 'Lab U4: build Android/iOS', deadline: 'Release candidate + testy' }] },
                    { id: 'rn-mobile-casual-games', title: 'React Native Casual Games', technology: 'React Native', level: 'advanced', duration: '9-12 tydzień', prerequisites: ['JavaScript/TypeScript', 'Podstawy React Native'], topics: ['Canvas/SVG rendering', 'Audio i feedback', 'Asset pipeline', 'Publikacja casual game'], steps: [{ id: 'rng-1', title: 'React Native fundamentals', type: 'article', link: '#react-native', article: 'react-native', tag: 'critical' }, { id: 'rng-2', title: 'Small engine games', type: 'article', link: '#small-engine-games', article: 'small-engine-games', tag: 'critical' }, { id: 'rng-3', title: 'Formaty audio/wideo i assety', type: 'article', link: '#audio-video-formats', article: 'audio-video-formats', tag: 'optional' }, { id: 'rng-4', title: 'Publikacja aplikacji', type: 'article', link: '#app-publishing', article: 'app-publishing', tag: 'critical' }], weeklyPlan: [{ week: 'T9', topic: 'Architektura casual game', dependencies: 'React Native fundamentals', material: 'react-native', lab: 'Lab RN-G1: state machine gry', deadline: 'Diagram stanów + kod bazowy' }, { week: 'T10', topic: 'Silnik 2D i rendering', dependencies: 'Architektura casual game', material: 'small-engine-games', lab: 'Lab RN-G2: rendering i pętle', deadline: 'Milestone playability' }, { week: 'T11', topic: 'Audio, haptics, polish', dependencies: 'Silnik 2D i rendering', material: 'audio-video-formats', lab: 'Lab RN-G3: feedback i UX', deadline: 'Testy z użytkownikami' }, { week: 'T12', topic: 'Store readiness', dependencies: 'Audio, haptics, polish', material: 'app-publishing', lab: 'Lab RN-G4: release checklist', deadline: 'Build produkcyjny + pitch' }] },
                    { id: 'mobile-security-path', title: 'Mobile Security Essentials', technology: 'Cross-platform', level: 'advanced', duration: '9-12 tydzień', prerequisites: ['Podstawy Android/iOS', 'Praca z API'], topics: ['Secure storage', 'Autoryzacja', 'Bezpieczna transmisja', 'Privacy-by-design'], steps: [{ id: 'sec-1', title: 'Mobile security overview', type: 'article', link: '#mobile-security', article: 'mobile-security', tag: 'critical' }, { id: 'sec-2', title: 'AI privacy & security', type: 'article', link: '#ai-privacy-security', article: 'ai-privacy-security', tag: 'critical' }, { id: 'sec-3', title: 'Data storage best practices', type: 'article', link: '#data-storage-best-practices', article: 'data-storage-best-practices', tag: 'critical' }, { id: 'sec-4', title: 'App updates and patching', type: 'article', link: '#app-updates', article: 'app-updates', tag: 'optional' }], weeklyPlan: [{ week: 'T9', topic: 'Threat modeling aplikacji', dependencies: 'Podstawy mobilne', material: 'mobile-security', lab: 'Lab Sec 1: analiza ryzyka', deadline: 'Macierz ryzyk' }, { week: 'T10', topic: 'Sekrety i tokeny', dependencies: 'Threat modeling aplikacji', material: 'data-storage-best-practices', lab: 'Lab Sec 2: secure storage', deadline: 'Checklist hardeningu' }, { week: 'T11', topic: 'Prywatność i zgodność', dependencies: 'Sekrety i tokeny', material: 'ai-privacy-security', lab: 'Lab Sec 3: privacy audit', deadline: 'Milestone security review' }, { week: 'T12', topic: 'Incident response', dependencies: 'Prywatność i zgodność', material: 'app-updates', lab: 'Lab Sec 4: procedura hotfix', deadline: 'Plan reagowania + demo' }] }
                ];
    
                // Mapa etykiet materiałów do wyświetlania typu zasobu.
                const typeLabels = { article: 'Artykuł', video: 'Wideo', lab: 'Laboratorium' };
    
                function getSavedProgress(pathId) {
                    try {
                        return JSON.parse(localStorage.getItem(`learningPathProgress:${pathId}`) || '{}');
                    } catch {
                        return {};
                    }
                }
    
                // Renderuje karty ścieżek, ich checklisty oraz pasek postępu użytkownika.
                function renderPaths() {
                    const techValue = techFilter.value;
                    const levelValue = levelFilter.value;
                    const filteredPaths = learningPaths.filter(path => (techValue === 'all' || path.technology === techValue) && (levelValue === 'all' || path.level === levelValue));
                    container.innerHTML = '';
    
                    filteredPaths.forEach(path => {
                        const progress = getSavedProgress(path.id);
                        const completedSteps = path.steps.filter(step => progress[step.id]).length;
                        const percent = Math.round((completedSteps / path.steps.length) * 100);
    
                        const stepsHtml = path.steps.map(step => `
                            <li>
                                <label class="learning-step-row">
                                    <input type="checkbox" data-path-id="${path.id}" data-step-id="${step.id}" ${progress[step.id] ? 'checked' : ''}>
                                    <span>${step.title} ${step.tag === 'critical' ? '<strong>[krytyczne dla projektu]</strong>' : '<em>[opcjonalne rozszerzenie]</em>'}</span>
                                </label>
                                <a href="${step.link}" ${step.article ? `data-article="${step.article}"` : ''} class="learning-step-link">
                                    ${typeLabels[step.type] || 'Materiał'}
                                </a>
                            </li>
                        `).join('');
    
                        const topicsHtml = path.topics.map(topic => `<li>${topic}</li>`).join('');
                        const prerequisitesHtml = path.prerequisites.map(item => `<li>${item}</li>`).join('');
                        const weeklyHtml = (path.weeklyPlan || []).map(item => `<tr><td>${item.week}</td><td>${item.topic}<br><small><strong>Zależności:</strong> ${item.dependencies}</small></td><td><a href="#${item.material}" data-article="${item.material}">${item.material}</a></td></tr>`).join('');
    
                        container.insertAdjacentHTML('beforeend', `
                            <article class="learning-path-card">
                                <div class="learning-path-meta">
                                    <span class="badge-tech">${path.technology}</span>
                                    <span class="badge-level">${path.level}</span>
                                </div>
                                <h4>${path.title}</h4>
                                <p><strong>Szacowany czas:</strong> ${path.duration}</p>
                                <div class="learning-progress">
                                    <div class="learning-progress-bar"><span style="width:${percent}%"></span></div>
                                    <small>Postęp: ${completedSteps}/${path.steps.length} kroków (${percent}%)</small>
                                </div>
                                <div class="learning-columns">
                                    <div><strong>Wymagania wstępne</strong><ul>${prerequisitesHtml}</ul></div>
                                    <div><strong>Tematy</strong><ul>${topicsHtml}</ul></div>
                                </div>
                                <div>
                                    <strong>Checklista ukończenia</strong>
                                    <ul class="learning-steps-list">${stepsHtml}</ul>
                                </div>
                                <div style="margin-top:12px;">
                                    <strong>Widok tygodniowy</strong>
                                    <div style="overflow-x:auto;">
                                        <table class="weekly-roadmap-table">
                                            <thead><tr><th>Tydzień</th><th>Temat i zależności</th><th>Materiał</th></tr></thead>
                                            <tbody>${weeklyHtml}</tbody>
                                        </table>
                                    </div>
                                </div>
                            </article>
                        `);
                    });
                }
    
                container.addEventListener('change', (event) => {
                    const input = event.target;
                    if (!(input instanceof HTMLInputElement) || input.type !== 'checkbox') return;
                    const pathId = input.dataset.pathId;
                    const stepId = input.dataset.stepId;
                    if (!pathId || !stepId) return;
                    const progress = getSavedProgress(pathId);
                    progress[stepId] = input.checked;
                    localStorage.setItem(`learningPathProgress:${pathId}`, JSON.stringify(progress));
                    renderPaths();
                    const card = input.closest('.learning-path-card');
                    if (card) {
                        const path = learningPaths.find(p => p.id === pathId);
                        const completedSteps = path.steps.filter(step => progress[step.id]).length;
                        const percent = Math.round((completedSteps / path.steps.length) * 100);
                        const bar = card.querySelector('.learning-progress-bar span');
                        const label = card.querySelector('.learning-progress small');
                        if (bar) bar.style.width = percent + '%';
                        if (label) label.textContent = 'Postęp: ' + completedSteps + '/' + path.steps.length + ' kroków (' + percent + '%)';
                    }
                });
    
                techFilter.addEventListener('change', renderPaths);
                levelFilter.addEventListener('change', renderPaths);
                renderPaths();
            })();
    
            // ===== PULL PANEL: CATEGORIES =====
            (function () {
                const grid = document.getElementById('pullCatGrid');
                if (!grid || typeof CATEGORIES === 'undefined') return;
    
                CATEGORIES.forEach(cat => {
                    const btn = document.createElement('button');
                    btn.className = 'pull-cat-btn';
                    btn.dataset.catId = cat.id;
                    const icon = document.createElement('i');
                    icon.className = cat.icon;
                    const span = document.createElement('span');
                    span.textContent = cat.name;
                    btn.appendChild(icon);
                    btn.appendChild(span);
                    btn.addEventListener('click', () => {
                        // Switch to wiki tab
                        if (typeof switchTab === 'function') switchTab('wiki');
    
                        // Load the first article in this category
                        const firstId = cat.articles && cat.articles[0];
                        if (firstId) {
                            if (typeof navigateToArticle === 'function') {
                                navigateToArticle(firstId);
                            } else if (typeof loadArticle === 'function') {
                                window.location.hash = firstId;
                                loadArticle(firstId);
                                if (typeof setActiveLink === 'function') setActiveLink(firstId);
                            }
                        }
    
                        // Find and expand the category in sidebar
                        const catList = document.getElementById(cat.id);
                        if (catList) {
                            catList.classList.remove('collapsed');
                            const header = document.querySelector('[data-cat="' + cat.id + '"]');
                            const icon = header?.querySelector('.toggle-icon');
                            if (icon) icon.style.transform = '';
                            // Scroll sidebar to show category
                            const sidebar = document.getElementById('wikiSidebar');
                            if (sidebar && window.innerWidth < 900) {
                                sidebar.classList.add('open');
                            }
                            setTimeout(() => {
                                header?.scrollIntoView({ behavior: 'smooth', block: 'start' });
                            }, 100);
                        }
    
                        // Close pull panel
                        const pullPanel = document.getElementById('pullPanel');
                        const pullOverlay = document.getElementById('pullOverlay');
                        if (pullPanel) {
                            pullPanel.classList.remove('open');
                            pullPanel.style.transform = '';
                        }
                        if (pullOverlay) {
                            pullOverlay.classList.remove('open');
                        }
                        document.body.classList.remove('pull-panel-open');
    
                        // Haptic feedback
                        const hapticEnabled = localStorage.getItem('pam-haptic') !== 'false';
                        if (hapticEnabled && navigator.vibrate) navigator.vibrate(20);
                    });
                    grid.appendChild(btn);
                });
            })();
    
            (function () {
                const gradingCard = document.getElementById('lecturerGradingCard');
                if (!gradingCard) return;
    
                const rows = Array.from(gradingCard.querySelectorAll('.grading-row'));
                const totalEl = document.getElementById('gradingTotal');
                const gradeEl = document.getElementById('gradingGrade');
                const statusEl = document.getElementById('gradingStatus');
                const feedbackEl = document.getElementById('gradingFeedback');
                const copyBtn = document.getElementById('gradingCopyBtn');
                const resetBtn = document.getElementById('gradingResetBtn');
    
                const gradeThresholds = [
                    { min: 91, grade: '5.0' },
                    { min: 81, grade: '4.5' },
                    { min: 71, grade: '4.0' },
                    { min: 61, grade: '3.5' },
                    { min: 51, grade: '3.0' },
                    { min: 0, grade: '2.0' }
                ];
    
                // Funkcja normalizuje wpisaną wartość, aby zawsze mieściła się w zakresie punktowym kryterium.
                function clampValue(value, max) {
                    const safeValue = Number.isFinite(value) ? value : 0;
                    return Math.min(Math.max(0, safeValue), max);
                }
    
                // Funkcja mapuje wynik punktowy na ocenę zgodnie z tabelą progów.
                function getGradeFromScore(score) {
                    const threshold = gradeThresholds.find(item => score >= item.min) || gradeThresholds[gradeThresholds.length - 1];
                    return threshold.grade;
                }
    
                // Funkcja buduje gotową informację zwrotną z listą mocnych stron i obszarów do poprawy.
                function buildFeedback(totalScore, grade, weakAreas) {
                    const statusText = totalScore >= 51 ? 'Projekt zaliczony.' : 'Projekt nie spełnia jeszcze progu zaliczenia.';
                    const strengthsText = totalScore >= 81
                        ? 'Bardzo dobra realizacja wymagań i wysoka jakość wykonania.'
                        : totalScore >= 61
                            ? 'Solidna realizacja podstawowych wymagań.'
                            : 'Widoczny potencjał, ale projekt wymaga dopracowania kluczowych elementów.';
    
                    const improvementsText = weakAreas.length
                        ? `Obszary do poprawy: ${weakAreas.join(', ')}.`
                        : 'Brak krytycznych braków — utrzymaj obecny poziom jakości.';
    
                    return `Wynik końcowy: ${totalScore}/100, ocena ${grade}. ${statusText} ${strengthsText} ${improvementsText}`;
                }
    
                // Funkcja przelicza cały formularz ocen i aktualizuje widok podsumowania.
                function updateSummary() {
                    let totalScore = 0;
                    const weakAreas = [];
    
                    rows.forEach(row => {
                        const max = Number(row.dataset.criterionMax || 0);
                        const label = row.dataset.criterionLabel || 'Kryterium';
                        const rangeInput = row.querySelector('.grading-range');
                        const numberInput = row.querySelector('.grading-number');
                        const points = clampValue(Number(numberInput.value), max);
                        totalScore += points;
    
                        if (max > 0 && points / max < 0.6) {
                            weakAreas.push(label);
                        }
    
                        rangeInput.value = String(points);
                        numberInput.value = String(points);
                    });
    
                    const grade = getGradeFromScore(totalScore);
                    const passed = totalScore >= 51;
    
                    totalEl.textContent = `${totalScore} / 100`;
                    gradeEl.textContent = grade;
                    statusEl.textContent = passed ? 'Zaliczono' : 'Nie zaliczono';
                    statusEl.classList.toggle('pass', passed);
                    statusEl.classList.toggle('fail', !passed);
                    feedbackEl.value = buildFeedback(totalScore, grade, weakAreas);
                }
    
                rows.forEach(row => {
                    const max = Number(row.dataset.criterionMax || 0);
                    const rangeInput = row.querySelector('.grading-range');
                    const numberInput = row.querySelector('.grading-number');
    
                    rangeInput.addEventListener('input', () => {
                        numberInput.value = rangeInput.value;
                        updateSummary();
                    });
    
                    numberInput.addEventListener('input', () => {
                        const normalized = clampValue(Number(numberInput.value), max);
                        rangeInput.value = String(normalized);
                        numberInput.value = String(normalized);
                        updateSummary();
                    });
                });
    
                if (resetBtn) {
                    resetBtn.addEventListener('click', () => {
                        rows.forEach(row => {
                            const rangeInput = row.querySelector('.grading-range');
                            const numberInput = row.querySelector('.grading-number');
                            rangeInput.value = '0';
                            numberInput.value = '0';
                        });
                        updateSummary();
                    });
                }
    
                if (copyBtn && feedbackEl) {
                    copyBtn.addEventListener('click', async () => {
                        if (!navigator.clipboard || !feedbackEl.value) return;
                        await navigator.clipboard.writeText(feedbackEl.value);
                        copyBtn.innerHTML = '<i class="fa-solid fa-check"></i> Skopiowano';
                        setTimeout(() => {
                            copyBtn.innerHTML = '<i class="fa-solid fa-copy"></i> Kopiuj komentarz';
                        }, 1200);
                    });
                }
    
                updateSummary();
            })();
}

window.initBootstrapUi = initBootstrapUi;
