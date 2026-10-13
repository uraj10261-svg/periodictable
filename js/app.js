(function (window) {
  'use strict';

  class ElementaApp {
    constructor() {
      this.currentView = 'table';
      this.tableController = null;
      this.detailsController = null;
      this.compareController = null;

      this.init();
    }

    init() {
      this.initTheme();

      if (window.PeriodicTable) {
        this.tableController = new window.PeriodicTable('periodic-table-grid', {
          onElementSelect: (el) => {
            window.location.hash = `#details?z=${el.atomicNumber}`;
          }
        });
      }

      if (window.ElementDetailsController) {
        this.detailsController = new window.ElementDetailsController();
      }

      if (window.CompareController) {
        this.compareController = new window.CompareController();
      }

      this.bindNavigation();
      this.bindShortcuts();

      window.addEventListener('hashchange', () => this.handleRoute());
      this.handleRoute();

      console.log('⚛️ ELEMENTA Periodic Table initialized successfully with 118 elements.');
    }

    initTheme() {
      const savedTheme = localStorage.getItem('elementa-theme') || 'dark';
      this.setTheme(savedTheme);

      const themeToggleBtn = document.getElementById('theme-toggle-btn');
      if (themeToggleBtn) {
        themeToggleBtn.addEventListener('click', () => {
          const current = document.documentElement.getAttribute('data-theme') || 'dark';
          const next = current === 'dark' ? 'light' : 'dark';
          this.setTheme(next);
          this.showToast(`Switched to ${next === 'dark' ? 'Dark Laboratory' : 'Light Clean'} mode`);
        });
      }
    }

    setTheme(theme) {
      document.documentElement.setAttribute('data-theme', theme);
      localStorage.setItem('elementa-theme', theme);

      const btn = document.getElementById('theme-toggle-btn');
      if (btn) {
        btn.innerHTML = theme === 'dark'
          ? '<i class="fas fa-sun"></i>'
          : '<i class="fas fa-moon"></i>';
        btn.title = `Switch to ${theme === 'dark' ? 'Light' : 'Dark'} theme (Key: T)`;
      }
    }

    handleRoute() {
      const hash = window.location.hash || '#table';

      if (hash.startsWith('#details')) {
        this.switchView('details');
        const params = new URLSearchParams(hash.split('?')[1] || '');
        const z = params.get('z') || params.get('element') || '1';
        if (this.detailsController) {
          const success = this.detailsController.loadElement(z);
          if (!success) {
            this.showToast(`Element #${z} not found, showing Hydrogen (#1)`, 'warn');
            this.detailsController.loadElement(1);
          }
        }
      } else if (hash.startsWith('#compare')) {
        this.switchView('compare');
      } else {
        this.switchView('table');
      }
    }

    switchView(viewName) {
      this.currentView = viewName;

      const views = {
        'table': document.getElementById('view-table'),
        'details': document.getElementById('view-details'),
        'compare': document.getElementById('view-compare')
      };

      Object.entries(views).forEach(([name, container]) => {
        if (!container) return;
        if (name === viewName) {
          container.style.display = 'block';
          window.scrollTo({ top: 0, behavior: 'smooth' });
        } else {
          container.style.display = 'none';
        }
      });

      document.querySelectorAll('.nav-link[data-nav]').forEach(link => {
        link.classList.toggle('active', link.dataset.nav === viewName);
      });
    }

    bindNavigation() {
      const mobileToggle = document.getElementById('mobile-nav-toggle');
      const mainNav = document.getElementById('main-nav');
      if (mobileToggle && mainNav) {
        mobileToggle.addEventListener('click', () => {
          mainNav.classList.toggle('open');
        });
      }

      document.querySelectorAll('.nav-link[data-nav]').forEach(link => {
        link.addEventListener('click', (e) => {
          if (mainNav) mainNav.classList.remove('open');
        });
      });
    }

    bindShortcuts() {
      window.addEventListener('keydown', (e) => {
        if (['INPUT', 'SELECT', 'TEXTAREA'].includes(document.activeElement.tagName)) {
          if (e.key === 'Escape') {
            document.activeElement.blur();
          }
          return;
        }

        if (e.key === '/') {
          e.preventDefault();
          const searchInput = document.getElementById('global-search-input');
          if (searchInput) searchInput.focus();
        } else if (e.key === 't' || e.key === 'T') {
          const current = document.documentElement.getAttribute('data-theme') || 'dark';
          this.setTheme(current === 'dark' ? 'light' : 'dark');
        } else if (e.key === '1') {
          window.location.hash = '#table';
        } else if (e.key === '2') {
          window.location.hash = '#compare';
        } else if (e.key === '3') {
          window.location.hash = '#details?z=1';
        }
      });
    }

    showToast(message, type = 'info', duration = 3000) {
      const container = document.getElementById('toast-container');
      if (!container) return;

      const toast = document.createElement('div');
      toast.className = 'toast';
      toast.innerHTML = `
        <i class="fas fa-info-circle" style="color:var(--accent-secondary)"></i>
        <span>${message}</span>
      `;

      container.appendChild(toast);

      requestAnimationFrame(() => {
        toast.classList.add('show');
      });

      setTimeout(() => {
        toast.classList.remove('show');
        setTimeout(() => toast.remove(), 350);
      }, duration);
    }
  }

  document.addEventListener('DOMContentLoaded', () => {
    window.app = new ElementaApp();
  });

})(window);
