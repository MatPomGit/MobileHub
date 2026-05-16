'use strict';

function initPageTabs() {
    if (window.__pamPageTabsInitialized) return;
    window.__pamPageTabsInitialized = true;

    // ===== TAB SWITCHING (shared logic) =====
            function switchTab(tab) {
                // Update top tab bar
                document.querySelectorAll('.page-tab-bar .tab-btn').forEach(b => {
                    b.classList.toggle('active', b.dataset.tab === tab);
                });
    
                // Update bottom nav
                document.querySelectorAll('.bottom-nav-btn').forEach(b => {
                    b.classList.toggle('active', b.dataset.tab === tab);
                });
    
                // Update pull panel shortcuts
                document.querySelectorAll('.pull-shortcut').forEach(b => {
                    b.classList.toggle('active', b.dataset.tab === tab);
                });
    
                // Show/hide panels
                document.querySelectorAll('.tab-panel').forEach(p => p.classList.remove('active'));
                document.getElementById('panel-' + tab)?.classList.add('active');
    
                // Resize iframe once its panel is visible
                if (tab === 'studenci' || tab === 'zal') {
                    const iframe = document.getElementById('iframe-' + tab);
                    if (iframe) {
                        const resize = () => {
                            try {
                                const h = iframe.contentWindow?.document?.body?.scrollHeight;
                                if (h && h > 100) { iframe.style.height = (h + 40) + 'px'; }
                            } catch (e) {
                                iframe.style.height = '900px';
                            }
                        };
                        try {
                            if (iframe.contentWindow?.document?.readyState === 'complete') {
                                resize();
                            } else {
                                iframe.addEventListener('load', resize, { once: true });
                            }
                        } catch (e) {
                            iframe.style.height = '900px';
                        }
                    }
                }
    
                // Show/hide sidebar toggle (only for wiki panel)
                const sidebarToggle = document.getElementById('sidebarToggle');
                if (sidebarToggle) {
                    sidebarToggle.style.display = tab === 'wiki' ? '' : 'none';
                }
    
                // Show/hide TOC FAB (only for wiki panel, mobile)
                const tocFab = document.getElementById('tocFab');
                if (tocFab && window.innerWidth <= 768) {
                    tocFab.style.display = tab === 'wiki' ? 'flex' : 'none';
                }
                window.syncFloatingUiState?.();
    
                // Scroll to top on tab switch
                window.scrollTo({ top: 0 });
            }
    
            // Top tab bar clicks
            window.switchTab = switchTab;

            document.querySelectorAll('.page-tab-bar .tab-btn').forEach(btn => {
                btn.addEventListener('click', () => {
                    switchTab(btn.dataset.tab);
                    btn.querySelector('.tab-badge')?.remove();
                    window.scrollTo({ top: 0 });
                });
            });
    
            // Bottom nav clicks
            document.querySelectorAll('.bottom-nav-btn').forEach(btn => {
                btn.addEventListener('click', () => {
                    switchTab(btn.dataset.tab);
                    // Remove badge from matching top tab btn
                    const topBtn = document.querySelector('.page-tab-bar .tab-btn[data-tab="' + btn.dataset.tab + '"]');
                    topBtn?.querySelector('.tab-badge')?.remove();
                });
            });
    
            // ===== TOPIC ACCORDION =====
            document.querySelectorAll('.topic-header').forEach(header => {
                header.addEventListener('click', () => {
                    const body = header.nextElementSibling;
                    const chev = header.querySelector('.chev');
                    const isOpen = body.classList.contains('open');
                    body.classList.toggle('open', !isOpen);
                    if (chev) chev.style.transform = isOpen ? '' : 'rotate(180deg)';
                });
            });
}

window.initPageTabs = initPageTabs;
