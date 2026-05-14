'use strict';

import { IDS, CLASSES } from './dom-map.js';
import { onClick, setOpenState } from './wiki-dom-utils.js';

const VALID_THEMES = ['light', 'dark', 'ocean', 'forest', 'sunset', 'rose', 'aurora'];

export function initThemePicker() {
  const saved = localStorage.getItem('pam-theme') || 'light';
  const theme = VALID_THEMES.includes(saved) ? saved : 'light';
  applyTheme(theme);

  const pickerBtn = document.getElementById(IDS.themePickerBtn);
  const dropdown = document.getElementById(IDS.themeDropdown);
  const pickerContainer = document.getElementById(IDS.themePicker);

  pickerBtn?.addEventListener('click', (e) => {
    e.stopPropagation();
    const isOpen = dropdown.classList.contains(CLASSES.open);
    setOpenState(dropdown, pickerBtn, !isOpen, CLASSES.open);
    if (!isOpen) dropdown.querySelector(`.${CLASSES.themeOption}`)?.focus();
  });

  document.addEventListener('click', (e) => {
    if (!pickerContainer?.contains(e.target)) {
      setOpenState(dropdown, pickerBtn, false, CLASSES.open);
    }
  });

  onClick(document, `.${CLASSES.themeOption}`, (_event, btn) => {
    const t = btn.dataset.theme;
    if (!VALID_THEMES.includes(t)) return;
    applyTheme(t);
    localStorage.setItem('pam-theme', t);
    setOpenState(dropdown, pickerBtn, false, CLASSES.open);
    pickerBtn?.focus();
  });
}

function applyTheme(t) {
  document.documentElement.setAttribute('data-theme', t);
  document.querySelectorAll(`.${CLASSES.themeOption}`).forEach((btn) => btn.classList.toggle(CLASSES.active, btn.dataset.theme === t));
}

export function initScrollProgress() {
  const bar = document.getElementById(IDS.scrollProgress);
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
  const btn = document.getElementById(IDS.backToTop);
  if (!btn) return;

  window.addEventListener('scroll', () => {
    btn.classList.toggle(CLASSES.visible, window.scrollY > 300);
  });

  btn.addEventListener('click', () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  });
}

export function initSidebarToggle() {
  const toggle = document.getElementById(IDS.sidebarToggle);
  const sidebar = document.getElementById(IDS.wikiSidebar);

  toggle?.addEventListener('click', () => {
    const isOpen = !sidebar?.classList.contains(CLASSES.open);
    setOpenState(sidebar, toggle, isOpen, CLASSES.open);
    if (isOpen) sidebar?.querySelector('a, button')?.focus();
  });
  document.addEventListener('click', (e) => {
    if (sidebar?.classList.contains(CLASSES.open) && !sidebar.contains(e.target) && !toggle?.contains(e.target)) {
      setOpenState(sidebar, toggle, false, CLASSES.open);
    }
  });
}
