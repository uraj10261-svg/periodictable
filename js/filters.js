(function () {
  'use strict';

  class FilterEngine {
    constructor() {
      this.activeFilters = {
        categories: new Set(),
        blocks: new Set(),
        periods: new Set(),
        states: new Set(),
        radioactivity: null,
        occurrence: new Set()
      };

      this.init();
    }

    init() {
      document.addEventListener('DOMContentLoaded', () => {
        this.bindEvents();
      });
    }

    bindEvents() {
      const filterToggleBtn = document.querySelector('.filter-toggle-btn');
      const filterPanel = document.querySelector('.filter-panel-collapsible');
      const resetBtn = document.querySelector('.filter-reset-all-btn');

      if (filterToggleBtn && filterPanel) {
        filterToggleBtn.addEventListener('click', () => {
          const isOpen = filterPanel.classList.toggle('open');
          filterToggleBtn.classList.toggle('active', isOpen);
          filterToggleBtn.setAttribute('aria-expanded', String(isOpen));
        });
      }

      if (filterPanel) {
        filterPanel.addEventListener('click', (e) => {
          const pill = e.target.closest('.filter-pill');
          if (!pill) return;

          const type = pill.dataset.filterType;
          const value = pill.dataset.filterValue;

          this.toggleFilter(type, value, pill);
          this.applyFilters();
        });
      }

      if (resetBtn) {
        resetBtn.addEventListener('click', () => {
          this.resetAllFilters();
        });
      }

      document.addEventListener('click', (e) => {
        const legendItem = e.target.closest('.legend-item');
        if (!legendItem) return;

        const cat = legendItem.dataset.category;
        if (!cat) return;

        if (this.activeFilters.categories.has(cat)) {
          this.activeFilters.categories.delete(cat);
          legendItem.classList.remove('active');
        } else {
          this.activeFilters.categories.add(cat);
          legendItem.classList.add('active');
        }

        const matchingPill = document.querySelector(`.filter-pill[data-filter-type="category"][data-filter-value="${cat}"]`);
        if (matchingPill) {
          matchingPill.classList.toggle('active', this.activeFilters.categories.has(cat));
        }

        this.applyFilters();
      });

      const legendReset = document.querySelector('.legend-reset-btn');
      if (legendReset) {
        legendReset.addEventListener('click', () => {
          this.resetAllFilters();
        });
      }
    }

    toggleFilter(type, value, pillElement) {
      if (type === 'category') {
        if (this.activeFilters.categories.has(value)) {
          this.activeFilters.categories.delete(value);
          pillElement.classList.remove('active');
        } else {
          this.activeFilters.categories.add(value);
          pillElement.classList.add('active');
        }
        const legItem = document.querySelector(`.legend-item[data-category="${value}"]`);
        if (legItem) legItem.classList.toggle('active', this.activeFilters.categories.has(value));
      } else if (type === 'block') {
        if (this.activeFilters.blocks.has(value)) {
          this.activeFilters.blocks.delete(value);
          pillElement.classList.remove('active');
        } else {
          this.activeFilters.blocks.add(value);
          pillElement.classList.add('active');
        }
      } else if (type === 'period') {
        const periodNum = parseInt(value, 10);
        if (this.activeFilters.periods.has(periodNum)) {
          this.activeFilters.periods.delete(periodNum);
          pillElement.classList.remove('active');
        } else {
          this.activeFilters.periods.add(periodNum);
          pillElement.classList.add('active');
        }
      } else if (type === 'state') {
        if (this.activeFilters.states.has(value)) {
          this.activeFilters.states.delete(value);
          pillElement.classList.remove('active');
        } else {
          this.activeFilters.states.add(value);
          pillElement.classList.add('active');
        }
      } else if (type === 'radioactivity') {
        if (this.activeFilters.radioactivity === value) {
          this.activeFilters.radioactivity = null;
          pillElement.classList.remove('active');
        } else {
          this.activeFilters.radioactivity = value;
          document.querySelectorAll('.filter-pill[data-filter-type="radioactivity"]').forEach(p => p.classList.remove('active'));
          pillElement.classList.add('active');
        }
      } else if (type === 'occurrence') {
        if (this.activeFilters.occurrence.has(value)) {
          this.activeFilters.occurrence.delete(value);
          pillElement.classList.remove('active');
        } else {
          this.activeFilters.occurrence.add(value);
          pillElement.classList.add('active');
        }
      }
    }

    applyFilters() {
      const elements = window.ELEMENTS_DATA || [];
      const hasActiveFilters = 
        this.activeFilters.categories.size > 0 ||
        this.activeFilters.blocks.size > 0 ||
        this.activeFilters.periods.size > 0 ||
        this.activeFilters.states.size > 0 ||
        this.activeFilters.radioactivity !== null ||
        this.activeFilters.occurrence.size > 0;

      let matchCount = 0;

      elements.forEach(el => {
        const tile = document.querySelector(`.element-tile[data-symbol="${el.symbol}"]`);
        if (!tile) return;

        if (!hasActiveFilters) {
          tile.classList.remove('dimmed');
          matchCount++;
          return;
        }

        let matches = true;

        if (this.activeFilters.categories.size > 0 && !this.activeFilters.categories.has(el.category)) {
          matches = false;
        }

        if (matches && this.activeFilters.blocks.size > 0 && !this.activeFilters.blocks.has(el.block)) {
          matches = false;
        }

        if (matches && this.activeFilters.periods.size > 0 && !this.activeFilters.periods.has(el.period)) {
          matches = false;
        }

        if (matches && this.activeFilters.states.size > 0 && !this.activeFilters.states.has(el.state)) {
          matches = false;
        }

        if (matches && this.activeFilters.radioactivity) {
          if (this.activeFilters.radioactivity === 'radioactive' && !el.radioactive) matches = false;
          if (this.activeFilters.radioactivity === 'stable' && el.radioactive) matches = false;
        }

        if (matches && this.activeFilters.occurrence.size > 0 && !this.activeFilters.occurrence.has(el.occurrence)) {
          matches = false;
        }

        if (matches) {
          tile.classList.remove('dimmed');
          matchCount++;
        } else {
          tile.classList.add('dimmed');
        }
      });

      const counterEl = document.querySelector('#filterMatchCount');
      if (counterEl) {
        counterEl.textContent = hasActiveFilters ? `${matchCount} of 118 matching` : '118 elements';
      }

      document.querySelectorAll('.legend-item').forEach(item => {
        const cat = item.dataset.category;
        if (this.activeFilters.categories.size > 0 && !this.activeFilters.categories.has(cat)) {
          item.classList.add('dimmed');
        } else {
          item.classList.remove('dimmed');
        }
      });
    }

    resetAllFilters() {
      this.activeFilters.categories.clear();
      this.activeFilters.blocks.clear();
      this.activeFilters.periods.clear();
      this.activeFilters.states.clear();
      this.activeFilters.radioactivity = null;
      this.activeFilters.occurrence.clear();

      document.querySelectorAll('.filter-pill.active').forEach(p => p.classList.remove('active'));
      document.querySelectorAll('.legend-item.active').forEach(item => item.classList.remove('active'));
      document.querySelectorAll('.legend-item.dimmed').forEach(item => item.classList.remove('dimmed'));

      this.applyFilters();
    }
  }

  window.filterEngine = new FilterEngine();
})();
