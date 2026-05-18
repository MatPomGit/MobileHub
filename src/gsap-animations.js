        (function () {
            'use strict';

            const motionProfile = window.__MOTION_PROFILE || (window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'none' : 'full');
            if (motionProfile === 'none') return;
            const reducedEffects = motionProfile === 'limited';
            if (typeof gsap === 'undefined') return;

            gsap.registerPlugin(ScrollTrigger);

            // ===== PAGE LOAD SEQUENCE =====
            const introTl = gsap.timeline({ defaults: { ease: 'power2.out' } });

            introTl
                .from('header', { y: -50, opacity: 0, duration: 0.55 })
                .from('.hero-badge', { y: 20, opacity: 0, duration: 0.4 }, '-=0.2')
                .from('.hero h1', { y: 34, opacity: 0, duration: 0.55 }, '-=0.15')
                .from('.hero-sub', { y: 20, opacity: 0, duration: 0.42 }, '-=0.2')
                .from('.hero-ctas .hero-btn', { y: 18, opacity: 0, duration: 0.35, stagger: 0.12 }, '-=0.12')
                .from('.hero-visual', { y: 20, opacity: 0, scale: 0.96, duration: 0.5 }, '-=0.35')
                .from('.hero-scroll-hint', { y: 8, opacity: 0, duration: 0.3 }, '-=0.2')
                .from('.page-tab-bar', { y: 20, opacity: 0, duration: 0.4 }, '-=0.2');

            // ===== SCROLL-TRIGGERED ANIMATIONS =====

            // Hero parallax glow
            const heroSection = document.querySelector('.hero');
            const heroContent = document.querySelector('.hero-content');
            if (heroSection && heroContent) {
                gsap.to(heroContent, {
                    y: reducedEffects ? 12 : 28,
                    ease: 'none',
                    scrollTrigger: {
                        trigger: heroSection,
                        start: 'top top',
                        end: 'bottom top',
                        scrub: true
                    }
                });
            }

            const heroMesh = document.querySelector('.hero-bg-mesh');
            if (heroSection && heroMesh) {
                gsap.to(heroMesh, {
                    yPercent: reducedEffects ? 4 : 10,
                    xPercent: reducedEffects ? 2 : 6,
                    ease: 'none',
                    scrollTrigger: {
                        trigger: heroSection,
                        start: 'top top',
                        end: 'bottom top',
                        scrub: true
                    }
                });
            }


            // Section titles — slide in from left
            gsap.utils.toArray('.section-title').forEach(el => {
                gsap.from(el, {
                    scrollTrigger: { trigger: el, start: 'top 88%', toggleActions: 'play none none none' },
                    x: -30, opacity: 0, duration: 0.5, ease: 'power2.out'
                });
            });

            // Info panel headers
            gsap.utils.toArray('.info-panel-header').forEach(el => {
                gsap.from(el, {
                    scrollTrigger: { trigger: el, start: 'top 88%', toggleActions: 'play none none none' },
                    y: 30, opacity: 0, duration: 0.6, ease: 'power2.out'
                });
            });

            // Cards grids — staggered fade-in from below
            gsap.utils.toArray('.cards-grid').forEach(grid => {
                gsap.from(grid.querySelectorAll('.info-card'), {
                    scrollTrigger: { trigger: grid, start: 'top 82%', toggleActions: 'play none none none' },
                    y: 40, opacity: 0, duration: 0.5, stagger: 0.1, ease: 'power2.out'
                });
            });

            // Exam stats — scale + fade, staggered
            const examInfoGrid = document.querySelector('.exam-info-grid');
            if (examInfoGrid) {
                gsap.from(examInfoGrid.querySelectorAll('.exam-stat'), {
                    scrollTrigger: { trigger: examInfoGrid, start: 'top 82%', toggleActions: 'play none none none' },
                    y: 25, opacity: 0, scale: 0.88, duration: 0.45, stagger: 0.08, ease: 'back.out(1.5)'
                });
            }

            // Milestone items — slide in from left
            gsap.utils.toArray('.milestone-item').forEach((item, i) => {
                gsap.from(item, {
                    scrollTrigger: { trigger: item, start: 'top 88%', toggleActions: 'play none none none' },
                    x: -40, opacity: 0, duration: 0.5, delay: i * 0.04, ease: 'power2.out'
                });
            });

            // Topic accordion items — fade + slight rise
            gsap.utils.toArray('.topic-item').forEach((item, i) => {
                gsap.from(item, {
                    scrollTrigger: { trigger: item, start: 'top 90%', toggleActions: 'play none none none' },
                    y: 20, opacity: 0, duration: 0.4, delay: i * 0.03, ease: 'power2.out'
                });
            });

            // Score table rows — slide in from left
            gsap.utils.toArray('.score-table tbody tr').forEach((row, i) => {
                gsap.from(row, {
                    scrollTrigger: { trigger: row, start: 'top 92%', toggleActions: 'play none none none' },
                    x: -20, opacity: 0, duration: 0.3, delay: i * 0.04, ease: 'power2.out'
                });
            });

            // Quick-start link cards — staggered
            const quickLinksGrid = document.querySelector('.quick-links-grid');
            if (quickLinksGrid) {
                gsap.from(quickLinksGrid.querySelectorAll('.quick-link-card'), {
                    scrollTrigger: { trigger: quickLinksGrid, start: 'top 85%', toggleActions: 'play none none none' },
                    y: 30, opacity: 0, duration: 0.5, stagger: 0.08, ease: 'power2.out'
                });
            }

            // Info/hint boxes
            gsap.utils.toArray('.hint-box, .info-box').forEach(el => {
                gsap.from(el, {
                    scrollTrigger: { trigger: el, start: 'top 88%', toggleActions: 'play none none none' },
                    y: 20, opacity: 0, duration: 0.5, ease: 'power2.out'
                });
            });

            // ===== ARTICLE CONTENT ANIMATIONS =====

            // Track ScrollTriggers created for article content so they can be
            // cleaned up efficiently when a new article is loaded.
            let articleTriggers = [];

            function animateArticleContent(container) {
                if (!container) return;

                if (window.anime && !reducedEffects) {
                    anime.remove(container.querySelectorAll('h1, h2, p, li, .reading-time, .article-toc, .table-wrapper, .code-block-wrapper, blockquote, img'));
                    anime({
                        targets: container.querySelectorAll('h1, h2, p, li, .reading-time, .article-toc, .table-wrapper, .code-block-wrapper, blockquote, img'),
                        translateY: [22, 0],
                        opacity: [0, 1],
                        delay: anime.stagger(22, { start: 40 }),
                        duration: 460,
                        easing: 'easeOutQuad'
                    });
                }

                // Kill triggers from the previous article
                articleTriggers.forEach(st => st.kill());
                articleTriggers = [];

                const h1Els = container.querySelectorAll('h1');
                const h2Els = container.querySelectorAll('h2');
                const imgEls = container.querySelectorAll('img');
                const tableEls = container.querySelectorAll('.table-wrapper');
                const codeEls = container.querySelectorAll('.code-block-wrapper');

                if (h1Els.length) {
                    gsap.from(h1Els, { y: -20, opacity: 0, duration: 0.5, ease: 'power2.out' });
                }

                h2Els.forEach(h2 => {
                    const st = ScrollTrigger.create({
                        trigger: h2, start: 'top 88%', toggleActions: 'play none none none',
                        onEnter: () => gsap.from(h2, { x: -20, opacity: 0, duration: 0.4, ease: 'power2.out' })
                    });
                    articleTriggers.push(st);
                });

                imgEls.forEach(img => {
                    const st = ScrollTrigger.create({
                        trigger: img, start: 'top 88%', toggleActions: 'play none none none',
                        onEnter: () => gsap.from(img, { scale: 0.94, opacity: 0, duration: 0.5, ease: 'power2.out' })
                    });
                    articleTriggers.push(st);
                });

                tableEls.forEach(table => {
                    const st = ScrollTrigger.create({
                        trigger: table, start: 'top 88%', toggleActions: 'play none none none',
                        onEnter: () => gsap.from(table, { y: 20, opacity: 0, duration: 0.4, ease: 'power2.out' })
                    });
                    articleTriggers.push(st);
                });

                codeEls.forEach(block => {
                    const st = ScrollTrigger.create({
                        trigger: block, start: 'top 88%', toggleActions: 'play none none none',
                        onEnter: () => gsap.from(block, { y: 20, opacity: 0, duration: 0.4, ease: 'power2.out' })
                    });
                    articleTriggers.push(st);
                });

                ScrollTrigger.refresh();
            }

            // Watch #wikiArticle for content replacement (article loads)
            const articleEl = document.getElementById('wikiArticle');
            if (articleEl) {
                const articleObserver = new MutationObserver(mutations => {
                    const replaced = mutations.some(m => m.type === 'childList' && m.addedNodes.length > 0);
                    if (replaced) {
                        // Delay accounts for hljs highlight + TOC/copy-button post-processing
                        // that runs synchronously after innerHTML assignment in loadArticle().
                        setTimeout(() => animateArticleContent(articleEl), 80);
                    }
                });
                articleObserver.observe(articleEl, { childList: true });
            }

            // Ładuje skróconą treść artykułu wiki do wskazanej sekcji zakładki.
            async function loadMergedWikiArticle(targetId, markdownPath) {
                const target = document.getElementById(targetId);
                if (!target) return;
                try {
                    const resp = await fetch(markdownPath, { cache: 'no-store' });
                    if (!resp.ok) throw new Error('HTTP ' + resp.status);
                    const md = await resp.text();
                    // Wyświetl całą treść markdowna, łącznie z tytułem.
                    target.innerHTML = marked.parse(md);
                    target.innerHTML = DOMPurify.sanitize(marked.parse(md));
                } catch (err) {
                    target.innerHTML = '<p>Nie udało się wczytać połączonej treści wiki.</p>';
                    console.warn('Błąd ładowania artykułu wiki:', markdownPath, err);
                }
            }

            // Synchronizuje treści między zakładkami i artykułami wiki, żeby uniknąć rozbieżności.
            loadMergedWikiArticle('projektMergedWikiContent', 'wiki/projekt-zaliczeniowy.md');

            // ===== TAB PANEL TRANSITION =====
            const origSwitchTab = window.switchTab;
            if (typeof origSwitchTab === 'function') {
                window.switchTab = function (tab) {
                    origSwitchTab.call(this, tab);
                    const panel = document.getElementById('panel-' + tab);
                    if (panel) {
                        gsap.fromTo(panel,
                            { opacity: 0, y: 14 },
                            { opacity: 1, y: 0, duration: 0.35, ease: 'power2.out' }
                        );
                    }
                };
            }

            // ===== INTERACTIVE HOVER MICRO-ANIMATIONS =====

            // Helper: add lift-on-hover to a set of elements
            function addLiftHover(selector, yAmt, scaleAmt) {
                document.querySelectorAll(selector).forEach(el => {
                    el.addEventListener('mouseenter', () =>
                        gsap.to(el, { y: -yAmt, scale: scaleAmt, duration: 0.1, ease: 'power2.out' }));
                    el.addEventListener('mouseleave', () =>
                        gsap.to(el, { y: 0, scale: 1, rotation: 0, x: 0, duration: 0.1, ease: 'power2.out' }));
                });
            }

            // Dodatkowe wychylenia kafelków podczas hovera (w losowych kierunkach)
            function addTileSwayHover(selector, yAmt, scaleAmt) {
                document.querySelectorAll(selector).forEach(el => {
                    el.addEventListener('mouseenter', () => {
                        const rotDir = Math.random() > 0.5 ? 1 : -1;
                        const xDir = Math.random() > 0.5 ? 1 : -1;
                        gsap.killTweensOf(el);
                        gsap.timeline()
                            .to(el, {
                                y: -yAmt,
                                scale: scaleAmt,
                                x: 3 * xDir,
                                rotation: 2.8 * rotDir,
                                duration: 0.1,
                                ease: 'power2.out'
                            })
                            .to(el, {
                                x: -2 * xDir,
                                rotation: -1.8 * rotDir,
                                duration: 0.12,
                                ease: 'sine.inOut'
                            })
                            .to(el, {
                                x: 0,
                                rotation: 0.9 * rotDir,
                                duration: 0.08,
                                ease: 'sine.out'
                            });
                    });

                    el.addEventListener('mouseleave', () => {
                        gsap.killTweensOf(el);
                        gsap.to(el, { y: 0, scale: 1, x: 0, rotation: 0, duration: 0.1, ease: 'power2.out' });
                    });
                });
            }

            addTileSwayHover('.quick-link-card', 4, 1.015);
            addTileSwayHover('.info-card', 5, 1.018);
            addLiftHover('.exam-stat', 4, 1.04);
            addLiftHover('.startup-feature', 5, 1.02);
            addLiftHover('.startup-stat', 5, 1.02);

            // Topic accordion headers — icon nudge on hover
            document.querySelectorAll('.topic-header').forEach(header => {
                const icon = header.querySelector('.cat-icon');
                if (!icon) return;
                header.addEventListener('mouseenter', () => gsap.to(icon, { x: 4, duration: 0.18, ease: 'power2.out' }));
                header.addEventListener('mouseleave', () => gsap.to(icon, { x: 0, duration: 0.18, ease: 'power2.out' }));
            });

            // Back-to-top button — bounce on click
            const backToTopBtn = document.getElementById('backToTop');
            if (backToTopBtn) {
                backToTopBtn.addEventListener('click', () => {
                    gsap.from(backToTopBtn, { scale: 0.75, duration: 0.3, ease: 'back.out(3)' });
                });
            }

            // Delikatnie zmniejsza szybkość przewijania kółkiem myszy dla wygodniejszego czytania.
            window.addEventListener('wheel', (event) => {
                if (event.ctrlKey || event.metaKey) return;
                const tag = event.target && event.target.tagName;
                if (tag && /^(INPUT|TEXTAREA|SELECT)$/i.test(tag)) return;
                event.preventDefault();
                window.scrollBy({ top: event.deltaY * 3.9, behavior: 'auto' });
            }, { passive: false });


        }());
