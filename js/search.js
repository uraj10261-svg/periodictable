(function () {
  'use strict';

  class SearchController {
    constructor() {
      this.searchInput = null;
      this.clearBtn = null;
      this.dropdown = null;
      this.selectedIndex = -1;
      this.currentResults = [];

      this.init();
    }

    init() {
      document.addEventListener('DOMContentLoaded', () => {
        this.searchInput = document.querySelector('.global-search-input');
        this.clearBtn = document.querySelector('.search-clear-btn');
        this.dropdown = document.querySelector('.search-results-dropdown');

        if (!this.searchInput || !this.dropdown) return;

        this.bindEvents();
      });
    }

    bindEvents() {
      this.searchInput.addEventListener('input', (e) => {
        const query = e.target.value.trim();
        if (query.length > 0) {
          if (this.clearBtn) this.clearBtn.classList.add('visible');
          this.handleSearch(query);
        } else {
          this.clearSearch();
        }
      });

      if (this.clearBtn) {
        this.clearBtn.addEventListener('click', () => {
          this.searchInput.value = '';
          this.clearSearch();
          this.searchInput.focus();
        });
      }

      this.searchInput.addEventListener('keydown', (e) => {
        if (!this.dropdown.classList.contains('show')) return;

        const items = this.dropdown.querySelectorAll('.search-result-item');
        if (items.length === 0) return;

        if (e.key === 'ArrowDown') {
          e.preventDefault();
          this.selectedIndex = (this.selectedIndex + 1) % items.length;
          this.updateActiveItem(items);
        } else if (e.key === 'ArrowUp') {
          e.preventDefault();
          this.selectedIndex = (this.selectedIndex - 1 + items.length) % items.length;
          this.updateActiveItem(items);
        } else if (e.key === 'Enter') {
          e.preventDefault();
          if (this.selectedIndex >= 0 && this.selectedIndex < this.currentResults.length) {
            this.selectElement(this.currentResults[this.selectedIndex]);
          } else if (this.currentResults.length > 0) {
            this.selectElement(this.currentResults[0]);
          }
        } else if (e.key === 'Escape') {
          e.preventDefault();
          this.hideDropdown();
        }
      });

      document.addEventListener('click', (e) => {
        if (!e.target.closest('.search-control-container')) {
          this.hideDropdown();
        }
      });
    }

    handleSearch(query) {
      if (!window.ELEMENT_API) return;
      this.currentResults = window.ELEMENT_API.search(query).slice(0, 8);
      this.selectedIndex = -1;

      if (this.currentResults.length === 0) {
        this.dropdown.innerHTML = `
          <div style="padding: 1rem; text-align: center; color: var(--text-muted); font-size: 0.85rem;">
            No elements found matching "<strong>${this.escapeHTML(query)}</strong>"
          </div>
        `;
        this.dropdown.classList.add('show');
        return;
      }

      this.renderDropdownItems();
      this.dropdown.classList.add('show');
    }

    renderDropdownItems() {
      this.dropdown.innerHTML = this.currentResults.map((el, index) => {
        const catKey = el.category || 'unknown';
        const catMeta = window.ELEMENT_CATEGORIES ? window.ELEMENT_CATEGORIES[catKey] : null;
        const catColorVar = catMeta ? `var(${catMeta.colorVar})` : 'var(--accent-secondary)';

        return `
          <div class="search-result-item" data-index="${index}" data-symbol="${el.symbol}" style="--cat-color: ${catColorVar}">
            <div class="search-result-left">
              <span class="search-badge-sym">${el.symbol}</span>
              <div>
                <div class="search-name-text">${el.name}</div>
                <div class="search-category-text">${catMeta ? catMeta.label : el.category}</div>
              </div>
            </div>
            <span class="search-result-num">#${el.atomicNumber}</span>
          </div>
        `;
      }).join('');

      this.dropdown.querySelectorAll('.search-result-item').forEach(item => {
        item.addEventListener('click', () => {
          const idx = parseInt(item.getAttribute('data-index'), 10);
          if (!isNaN(idx) && this.currentResults[idx]) {
            this.selectElement(this.currentResults[idx]);
          }
        });
      });
    }

    updateActiveItem(items) {
      items.forEach((item, idx) => {
        if (idx === this.selectedIndex) {
          item.classList.add('selected');
          item.scrollIntoView({ block: 'nearest' });
        } else {
          item.classList.remove('selected');
        }
      });
    }

    selectElement(el) {
      this.hideDropdown();
      if (!el) return;

      const tile = document.querySelector(`.element-tile[data-symbol="${el.symbol}"]`);
      if (tile) {
        document.querySelectorAll('.element-tile.highlighted').forEach(t => t.classList.remove('highlighted'));
        tile.classList.add('highlighted');
        tile.scrollIntoView({ behavior: 'smooth', block: 'center', inline: 'center' });

        if (window.hoverPreviewManager) {
          window.hoverPreviewManager.showForTile(tile, el);
        }
      } else {
        window.location.href = `element.html?symbol=${el.symbol}`;
      }
    }

    clearSearch() {
      if (this.clearBtn) this.clearBtn.classList.remove('visible');
      this.hideDropdown();
      document.querySelectorAll('.element-tile.highlighted').forEach(t => t.classList.remove('highlighted'));
    }

    hideDropdown() {
      if (this.dropdown) {
        this.dropdown.classList.remove('show');
      }
      this.selectedIndex = -1;
    }

    escapeHTML(str) {
      return str.replace(/[&<>'"]/g, tag => ({
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        "'": '&#39;',
        '"': '&quot;'
      }[tag] || tag));
    }
  }

  window.searchController = new SearchController();
})();
