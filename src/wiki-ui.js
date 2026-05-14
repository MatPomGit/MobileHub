'use strict';

const VALID_THEMES = ['light', 'dark', 'ocean', 'forest', 'sunset', 'rose', 'aurora'];

export function initThemePicker() {
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

  document.querySelectorAll('.theme-option').forEach((btn) => btn.addEventListener('click', () => {
    const t = btn.dataset.theme;
    if (!VALID_THEMES.includes(t)) return;
    applyTheme(t);
    localStorage.setItem('pam-theme', t);
    dropdown?.classList.remove('open');
    pickerBtn?.setAttribute('aria-expanded', 'false');
  }));
}

function applyTheme(t) {
  document.documentElement.setAttribute('data-theme', t);
  document.querySelectorAll('.theme-option').forEach((btn) => btn.classList.toggle('active', btn.dataset.theme === t));
}

export function initScrollProgress() {
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

export function initBackToTop() {
  const btn = document.getElementById('backToTop');
  if (!btn) return;

  window.addEventListener('scroll', () => {
    btn.classList.toggle('visible', window.scrollY > 300);
  });

  btn.addEventListener('click', () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  });
}

export function initSidebarToggle() {
  const toggle = document.getElementById('sidebarToggle');
  const sidebar = document.getElementById('wikiSidebar');

  toggle?.addEventListener('click', () => sidebar?.classList.toggle('open'));
  document.addEventListener('click', (e) => {
    if (sidebar?.classList.contains('open') && !sidebar.contains(e.target) && !toggle?.contains(e.target)) {
      sidebar.classList.remove('open');
    }
  });
}
