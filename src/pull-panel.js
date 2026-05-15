// ===== PULL-DOWN PANEL =====
        (function () {
            const panel = document.getElementById('pullPanel');
            const handle = document.getElementById('pullHandle');
            const overlay = document.getElementById('pullOverlay');
            const pullSearchInput = document.getElementById('pullSearchInput');
            if (!panel || !handle || !overlay) return;

            let startY = 0, startTranslate = 0, isDragging = false;
            let closeBodyClassTimeout = null;
            let activePointerId = null;
            const DRAG_THRESHOLD_PX = 6;

            // Ujednolicamy punkt "zamknięcia" panelu, aby CSS i JS używały tego samego modelu pionowego.
            const panelBody = panel.querySelector('.pull-panel-body');

            function getClosedTranslate() {
                const headerH = parseInt(getComputedStyle(document.documentElement).getPropertyValue('--header-h')) || 42;
                const safeTop = parseInt(getComputedStyle(document.documentElement).getPropertyValue('--safe-top')) || 0;
                return -(panel.offsetHeight - headerH - safeTop - 24);
            }

            function openPanel() {
                clearTimeout(closeBodyClassTimeout);
                document.body.classList.add('pull-panel-open');
                panel.classList.add('open');
                overlay.classList.add('open');
                handle.setAttribute('aria-expanded', 'true');
                panel.style.transform = '';
                panelBody?.style.removeProperty('overscroll-behavior');
            }

            function closePanel() {
                panel.classList.remove('open');
                overlay.classList.remove('open');
                handle.setAttribute('aria-expanded', 'false');
                panel.style.transform = '';
                panelBody?.style.removeProperty('overscroll-behavior');
                closeBodyClassTimeout = setTimeout(() => {
                    document.body.classList.remove('pull-panel-open');
                }, 300);
            }

            handle.addEventListener('click', () => {
                if (isDragging) return;
                if (panel.classList.contains('open')) closePanel();
                else openPanel();
            });

            handle.addEventListener('keydown', (e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    if (panel.classList.contains('open')) closePanel();
                    else openPanel();
                }
            });

            overlay.addEventListener('click', closePanel);

            // Touch/pointer drag support
            // Priorytet gestów:
            // 1) Drag zaczynamy wyłącznie z uchwytu, aby nie kraść scrolla treści.
            // 2) Po przekroczeniu progu blokujemy przewijanie panelu (overscroll-behavior),
            //    dzięki czemu ruch pionowy kontroluje tylko transform panelu.
            handle.addEventListener('pointerdown', (e) => {
                isDragging = false;
                startY = e.clientY;
                const matrix = new DOMMatrix(getComputedStyle(panel).transform);
                startTranslate = matrix.m42;
                panel.style.transition = 'none';
                activePointerId = e.pointerId;
                handle.setPointerCapture(e.pointerId);
            });

            handle.addEventListener('pointermove', (e) => {
                if (activePointerId !== e.pointerId) return;
                const dy = e.clientY - startY;
                if (Math.abs(dy) > DRAG_THRESHOLD_PX) {
                    isDragging = true;
                    panelBody?.style.setProperty('overscroll-behavior', 'contain');
                }
                if (!isDragging) return;
                e.preventDefault();
                const closed = getClosedTranslate();
                const newY = Math.max(closed, Math.min(0, startTranslate + dy));
                panel.style.transform = `translateY(${newY}px)`;
                const progress = (newY - closed) / (-closed);
                overlay.style.opacity = String(Math.max(0, Math.min(1, progress * 0.4)));
                overlay.classList.toggle('open', progress > 0.05);
                document.body.classList.toggle('pull-panel-open', progress > 0.05);
            });

            handle.addEventListener('pointerup', (e) => {
                if (activePointerId !== e.pointerId) return;
                if (activePointerId !== null) {
                    handle.releasePointerCapture(activePointerId);
                    activePointerId = null;
                }
                overlay.style.opacity = '';
                panelBody?.style.removeProperty('overscroll-behavior');
                if (!isDragging) return;
                isDragging = false;
                panel.style.transition = '';
                const matrix = new DOMMatrix(getComputedStyle(panel).transform);
                const currentY = matrix.m42;
                if (currentY > getClosedTranslate() / 2) openPanel();
                else closePanel();
            });

            handle.addEventListener('pointercancel', () => {
                if (activePointerId !== null) {
                    handle.releasePointerCapture(activePointerId);
                    activePointerId = null;
                }
                isDragging = false;
                panel.style.transition = '';
                overlay.style.opacity = '';
                panelBody?.style.removeProperty('overscroll-behavior');
            });

            // Pull shortcut buttons
            document.querySelectorAll('.pull-shortcut').forEach(btn => {
                btn.addEventListener('click', () => {
                    switchTab(btn.dataset.tab);
                    closePanel();
                });
            });

            // Pull search → wiki search proxy
            pullSearchInput?.addEventListener('input', () => {
                const wikiSearch = document.getElementById('wikiSearch');
                if (wikiSearch) {
                    wikiSearch.value = pullSearchInput.value;
                    wikiSearch.dispatchEvent(new Event('input'));
                    if (!document.getElementById('panel-wiki')?.classList.contains('active')) {
                        switchTab('wiki');
                    }
                }
            });
        })();

        // ===== TOC RADIAL MENU =====
        (function () {
            const fab = document.getElementById('tocFab');
            const menu = document.getElementById('tocRadialMenu');
            const list = document.getElementById('tocRadialList');
            const overlay = document.getElementById('tocRadialOverlay');
            if (!fab || !menu || !list || !overlay) return;

            let isOpen = false;

            function hapticFeedback() {
                const hapticEnabled = localStorage.getItem('pam-haptic') !== 'false';
                if (hapticEnabled && navigator.vibrate) {
                    navigator.vibrate(10);
                }
            }

            function openTocMenu() {
                populateTocMenu();
                isOpen = true;
                menu.style.display = 'block';
                overlay.style.display = 'block';
                requestAnimationFrame(() => {
                    menu.classList.add('open');
                    overlay.classList.add('open');
                    fab.classList.add('open');
                });
                hapticFeedback();
                highlightActiveHeading();
            }

            function closeTocMenu() {
                isOpen = false;
                menu.classList.remove('open');
                overlay.classList.remove('open');
                fab.classList.remove('open');
                setTimeout(() => {
                    menu.style.display = '';
                    overlay.style.display = '';
                }, 300);
            }

            function populateTocMenu() {
                const article = document.getElementById('wikiArticle');
                if (!article) return;
                const headings = article.querySelectorAll('h2, h3');
                list.innerHTML = '';
                if (headings.length === 0) {
                    list.innerHTML = '<div class="toc-radial-empty"><i class="fa-solid fa-book-open"></i>Otwórz artykuł, aby zobaczyć spis treści</div>';
                    return;
                }
                headings.forEach((h, i) => {
                    if (!h.id) h.id = 'heading-' + i;
                    const li = document.createElement('li');
                    if (h.tagName === 'H3') li.classList.add('toc-h3');
                    const a = document.createElement('a');
                    a.href = '#' + h.id;
                    const dot = document.createElement('span');
                    dot.className = 'toc-dot';
                    a.appendChild(dot);
                    a.appendChild(document.createTextNode(h.textContent));
                    a.addEventListener('click', (e) => {
                        e.preventDefault();
                        closeTocMenu();
                        hapticFeedback();
                        setTimeout(() => {
                            h.scrollIntoView({ behavior: 'smooth', block: 'start' });
                        }, 150);
                    });
                    li.appendChild(a);
                    list.appendChild(li);
                });
            }

            function highlightActiveHeading() {
                const article = document.getElementById('wikiArticle');
                if (!article) return;
                const headings = article.querySelectorAll('h2, h3');
                let activeId = null;
                const scrollTop = window.scrollY + 120;
                headings.forEach(h => {
                    if (h.offsetTop <= scrollTop) activeId = h.id;
                });
                let activeLink = null;
                list.querySelectorAll('a').forEach(a => {
                    const isActive = a.getAttribute('href') === '#' + activeId;
                    a.classList.toggle('active-heading', isActive);
                    if (isActive) activeLink = a;
                });
                if (activeLink) {
                    activeLink.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
                }
            }

            fab.addEventListener('click', () => {
                if (isOpen) closeTocMenu();
                else openTocMenu();
            });

            overlay.addEventListener('click', closeTocMenu);

            // Show/hide FAB based on active tab
            function syncFloatingUiState() {
                const wikiActive = document.getElementById('panel-wiki')?.classList.contains('active');
                const isMobile = window.innerWidth <= 768;
                const isStandalone = window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone;
                document.body.classList.toggle('body-wiki-tab', Boolean(wikiActive));
                document.body.classList.toggle('pwa-standalone', Boolean(isStandalone));
                fab.style.display = (wikiActive && isMobile) ? 'flex' : 'none';
                const backToTop = document.getElementById('backToTop');
                if (backToTop) {
                    const hideBackToTop = Boolean(wikiActive && isMobile && isStandalone);
                    backToTop.style.display = hideBackToTop ? 'none' : '';
                    if (hideBackToTop) backToTop.classList.remove('visible');
                }
            }

            function animateFabPress() {
                fab.classList.remove('bump');
                void fab.offsetWidth;
                fab.classList.add('bump');
            }

            fab.addEventListener('animationend', (event) => {
                if (event.animationName === 'tocFabBump') fab.classList.remove('bump');
            });

            const icon = fab.querySelector('i');

            function updateTocFabVisibility() {
                syncFloatingUiState();
            }

            fab.addEventListener('click', () => {
                animateFabPress();
                if (window.gsap) {
                    gsap.fromTo(fab,
                        { scale: isOpen ? 1.02 : 0.92, rotate: isOpen ? 45 : 0 },
                        { scale: isOpen ? 1.04 : 1, rotate: isOpen ? 45 : 0, duration: 0.35, ease: 'back.out(2.4)' }
                    );
                    if (icon) {
                        gsap.fromTo(icon,
                            { rotate: isOpen ? -45 : -18, y: isOpen ? 0 : 1 },
                            { rotate: isOpen ? -45 : 0, y: 0, duration: 0.35, ease: 'power3.out' }
                        );
                    }
                }
            }, { capture: true });

            window.addEventListener('resize', updateTocFabVisibility);
            window.matchMedia('(display-mode: standalone)').addEventListener?.('change', syncFloatingUiState);
            document.addEventListener('visibilitychange', syncFloatingUiState);
            window.syncFloatingUiState = syncFloatingUiState;
            updateTocFabVisibility();
        })();

        // ===== SETTINGS PANEL =====
        (function () {
            const fab = document.getElementById('settingsFab');
            const panel = document.getElementById('settingsPanel');
            const overlay = document.getElementById('settingsPanelOverlay');
            const closeBtn = document.getElementById('settingsClose');
            if (!fab || !panel || !overlay) return;

            function hapticFeedback() {
                const hapticEnabled = localStorage.getItem('pam-haptic') !== 'false';
                if (hapticEnabled && navigator.vibrate) {
                    navigator.vibrate(10);
                }
            }

            function openSettings() {
                panel.style.display = 'block';
                overlay.style.display = 'block';
                requestAnimationFrame(() => {
                    panel.classList.add('open');
                    overlay.classList.add('open');
                    fab.classList.add('open');
                    if (window.anime) {
                        anime.remove(panel);
                        anime.remove('.settings-panel .settings-section, .settings-panel .settings-row');
                        anime({
                            targets: panel,
                            translateY: [36, 0],
                            opacity: [0, 1],
                            duration: 320,
                            easing: 'easeOutCubic'
                        });
                        anime({
                            targets: '.settings-panel .settings-section, .settings-panel .settings-row',
                            translateY: [18, 0],
                            opacity: [0, 1],
                            delay: anime.stagger(45, { start: 80 }),
                            duration: 280,
                            easing: 'easeOutQuad'
                        });
                    }
                });
                hapticFeedback();
            }

            function closeSettings() {
                if (window.anime) {
                    anime.remove(panel);
                    anime({
                        targets: panel,
                        translateY: [0, 28],
                        opacity: [1, 0],
                        duration: 180,
                        easing: 'easeInQuad'
                    });
                }
                panel.classList.remove('open');
                overlay.classList.remove('open');
                fab.classList.remove('open');
                setTimeout(() => {
                    panel.style.display = '';
                    overlay.style.display = '';
                    panel.style.opacity = '';
                    panel.style.transform = '';
                }, 350);
            }

            fab.addEventListener('click', () => {
                if (panel.classList.contains('open')) closeSettings();
                else openSettings();
            });

            overlay.addEventListener('click', closeSettings);
            closeBtn?.addEventListener('click', closeSettings);

            // Settings FAB hidden on mobile — accessed via pull panel instead
            fab.style.display = 'none';

            // Open settings from pull panel options button
            const pullOptionsBtn = document.getElementById('pullOptionsBtn');
            pullOptionsBtn?.addEventListener('click', () => {
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
                openSettings();
            });

            // ===== Font size =====
            const FONT_SIZES = {
                small: { size: '14px', scale: '0.92' },
                medium: { size: '17px', scale: '1' },
                large: { size: '21px', scale: '1.12' }
            };
            const savedSize = localStorage.getItem('pam-font-size') || 'medium';
            applyFontSize(savedSize);

            document.querySelectorAll('.font-size-btn').forEach(btn => {
                if (btn.dataset.size === savedSize) btn.classList.add('active');
                else btn.classList.remove('active');

                btn.addEventListener('click', () => {
                    const size = btn.dataset.size;
                    document.querySelectorAll('.font-size-btn').forEach(b => b.classList.remove('active'));
                    btn.classList.add('active');
                    applyFontSize(size);
                    localStorage.setItem('pam-font-size', size);
                    if (window.anime) {
                        anime({
                            targets: btn,
                            scale: [1, 1.08, 1],
                            duration: 420,
                            easing: 'easeOutQuad'
                        });
                    }
                    hapticFeedback();
                });
            });

            function applyFontSize(size) {
                const config = FONT_SIZES[size] || FONT_SIZES.medium;
                document.documentElement.style.setProperty('--user-font-size', config.size);
                document.documentElement.style.setProperty('--wiki-font-size', config.size);
                document.documentElement.style.setProperty('--wiki-font-scale', config.scale);
                document.querySelectorAll('#wikiArticle, .wiki-welcome').forEach(el => {
                    el.style.fontSize = config.size;
                });

                const article = document.getElementById('wikiArticle');
                if (article && window.anime && article.children.length) {
                    anime.remove(article);
                    anime({
                        targets: article,
                        scale: [0.985, 1],
                        opacity: [0.82, 1],
                        duration: 260,
                        easing: 'easeOutQuad'
                    });
                }
            }

            // ===== Haptic toggle =====
            const hapticToggle = document.getElementById('hapticToggle');
            const hapticSaved = localStorage.getItem('pam-haptic') !== 'false';
            if (hapticToggle) {
                hapticToggle.classList.toggle('active', hapticSaved);
                hapticToggle.setAttribute('aria-checked', String(hapticSaved));
                hapticToggle.addEventListener('click', () => {
                    const isActive = hapticToggle.classList.toggle('active');
                    hapticToggle.setAttribute('aria-checked', String(isActive));
                    localStorage.setItem('pam-haptic', String(isActive));
                    if (isActive && navigator.vibrate) navigator.vibrate(15);
                });
            }

        })();


        // ===== PUSH NOTIFICATIONS =====
        (function () {
            if (!('Notification' in window) || !('serviceWorker' in navigator)) return;

            const lectureToggle = document.getElementById('notifLectureToggle');
            const reviewToggle = document.getElementById('notifReviewToggle');
            const statusEl = document.getElementById('notifPermStatus');
            if (!lectureToggle || !reviewToggle) return;

            function setStatus(msg, ok) {
                if (!statusEl) return;
                statusEl.textContent = msg;
                statusEl.style.color = ok ? '#4caf50' : '#f55';
            }

            function applyToggle(btn, active) {
                btn.classList.toggle('active', active);
                btn.setAttribute('aria-checked', String(active));
            }

            const lecturePref = localStorage.getItem('pam-notif-lecture') === 'true';
            const reviewPref = localStorage.getItem('pam-notif-review') === 'true';
            const permGranted = Notification.permission === 'granted';
            const permDenied = Notification.permission === 'denied';

            if (permGranted) {
                applyToggle(lectureToggle, lecturePref);
                applyToggle(reviewToggle, reviewPref);
            }
            if (permDenied) {
                lectureToggle.disabled = true;
                reviewToggle.disabled = true;
                setStatus('Powiadomienia zablokowane w ustawieniach przeglądarki.', false);
            }

            // Returns the next Date for a given weekday (0=Sun…6=Sat), hour and minute
            function nextDateAt(targetDay, hour, minute) {
                const now = new Date();
                const d = new Date(now);
                let days = (targetDay - now.getDay() + 7) % 7;
                d.setDate(now.getDate() + days);
                d.setHours(hour, minute, 0, 0);
                if (d <= now) d.setDate(d.getDate() + 7);
                return d;
            }

            async function scheduleOne(reg, tag, triggerDate, title, body) {
                // Prefer the Notification Triggers API (Chrome on Android 80+)
                if (typeof TimestampTrigger !== 'undefined') {
                    try {
                        const existing = await reg.getNotifications({ tag }).catch(err => {
                            console.warn('[PAM] getNotifications failed:', err);
                            return [];
                        });
                        existing.forEach(n => n.close());
                        await reg.showNotification(title, {
                            body,
                            icon: './assets/icon-192.png',
                            badge: './assets/icon-192.png',
                            tag,
                            renotify: true,
                            showTrigger: new TimestampTrigger(triggerDate.getTime())
                        });
                        return;
                    } catch (e) {
                        // fall through to setTimeout
                    }
                }
                // Fallback: setTimeout (fires while the page is open; max ~24.8 days, safe for weekly intervals)
                const delay = triggerDate.getTime() - Date.now();
                if (delay > 0) {
                    setTimeout(() => {
                        reg.showNotification(title, {
                            body,
                            icon: './assets/icon-192.png',
                            badge: './assets/icon-192.png',
                            tag
                        });
                    }, delay);
                }
            }

            async function scheduleAll() {
                if (Notification.permission !== 'granted') return;
                const reg = await navigator.serviceWorker.ready;

                if (localStorage.getItem('pam-notif-lecture') === 'true') {
                    await scheduleOne(
                        reg,
                        'pam-lecture',
                        nextDateAt(3, 8, 45),           // Wednesday 8:45
                        'Wykład PAM – za chwilę!',
                        'Środa 8:45 – Programowanie aplikacji mobilnych zaczyna się lada moment!'
                    );
                }

                if (localStorage.getItem('pam-notif-review') === 'true') {
                    await scheduleOne(
                        reg,
                        'pam-review',
                        nextDateAt(6, 10, 0),           // Saturday 10:00
                        'Czas na powtórkę!',
                        'Przejrzyj materiał z ostatniego wykładu PAM. Kolejny wykład już w środę!'
                    );
                }
            }

            async function requestAndEnable(storageKey, toggle) {
                if (Notification.permission === 'default') {
                    const perm = await Notification.requestPermission();
                    if (perm !== 'granted') {
                        setStatus('Powiadomienia zostały odrzucone.', false);
                        if (Notification.permission === 'denied') {
                            lectureToggle.disabled = true;
                            reviewToggle.disabled = true;
                        }
                        return;
                    }
                }
                if (Notification.permission !== 'granted') {
                    setStatus('Brak uprawnień do powiadomień.', false);
                    return;
                }
                localStorage.setItem(storageKey, 'true');
                applyToggle(toggle, true);
                await scheduleAll();
                setStatus('Powiadomienia włączone ✓', true);
            }

            lectureToggle.addEventListener('click', async () => {
                if (lectureToggle.classList.contains('active')) {
                    localStorage.setItem('pam-notif-lecture', 'false');
                    applyToggle(lectureToggle, false);
                    setStatus('Powiadomienia o wykładach wyłączone.', true);
                } else {
                    await requestAndEnable('pam-notif-lecture', lectureToggle);
                }
            });

            reviewToggle.addEventListener('click', async () => {
                if (reviewToggle.classList.contains('active')) {
                    localStorage.setItem('pam-notif-review', 'false');
                    applyToggle(reviewToggle, false);
                    setStatus('Przypomnienia o powtórce wyłączone.', true);
                } else {
                    await requestAndEnable('pam-notif-review', reviewToggle);
                }
            });

            // Re-schedule on every page load when already granted
            if (permGranted && (lecturePref || reviewPref)) {
                scheduleAll().catch(err => {
                    console.warn('[PAM] scheduleAll failed:', err);
                    setStatus('Nie udało się zaplanować powiadomień.', false);
                });
            }
        })();
