(function () {
  'use strict';

  const STORAGE_KEY = 'elementa_theme_preference';
  const THEME_ATTR = 'data-theme';

  function getSavedTheme() {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved === 'dark' || saved === 'light') return saved;
    } catch (e) {}

    if (window.matchMedia && window.matchMedia('(prefers-color-scheme: light)').matches) {
      return 'light';
    }
    return 'dark';
  }

  function applyTheme(theme) {
    document.documentElement.setAttribute(THEME_ATTR, theme);

    const toggleButtons = document.querySelectorAll('.theme-toggle-btn');
    toggleButtons.forEach(btn => {
      btn.setAttribute('aria-label', `Switch to ${theme === 'dark' ? 'light' : 'dark'} theme`);
      btn.innerHTML = theme === 'dark' 
        ? `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="5"/><path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"/></svg>`
        : `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>`;
    });

    try {
      localStorage.setItem(STORAGE_KEY, theme);
    } catch (e) {}
  }

  function toggleTheme() {
    const current = document.documentElement.getAttribute(THEME_ATTR) || 'dark';
    const next = current === 'dark' ? 'light' : 'dark';
    applyTheme(next);
  }

  const initialTheme = getSavedTheme();
  applyTheme(initialTheme);

  document.addEventListener('DOMContentLoaded', () => {
    const buttons = document.querySelectorAll('.theme-toggle-btn');
    buttons.forEach(btn => {
      btn.addEventListener('click', toggleTheme);
    });

    const navToggle = document.querySelector('.mobile-nav-toggle');
    const mainNav = document.querySelector('.main-nav');
    if (navToggle && mainNav) {
      navToggle.addEventListener('click', () => {
        const isOpen = mainNav.classList.toggle('mobile-open');
        navToggle.setAttribute('aria-expanded', String(isOpen));
      });
    }
  });

  window.ELEMENTA_THEME = {
    toggle: toggleTheme,
    getTheme: () => document.documentElement.getAttribute(THEME_ATTR) || 'dark',
    setTheme: applyTheme
  };
})();
