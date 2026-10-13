(function (window) {
  'use strict';

  class PeriodicTable {
    constructor(gridElementId, options = {}) {
      this.grid = document.getElementById(gridElementId);
      this.options = Object.assign({
        onElementSelect: null,
        onHover: null
      }, options);

      this.currentTempKelvin = 293.15;
      this.activeHeatmapProp = null;
      this.activeCategoryFilter = null;
      this.activeStateFilter = null;
      this.activeBlockFilter = null;
      this.activePeriodFilter = null;
      this.searchQuery = '';
      this.pinnedElement = null;
      this.hideTimeout = null;
      this.isMouseOverCard = false;
      this.activeHoverTile = null;

      this.tileMap = new Map();

      this.previewCard = document.getElementById('hover-preview-card');
      this.init();
    }

    init() {
      if (!this.grid) return;
      this.renderGrid();
      this.bindEvents();
      this.renderCategoryLegend();
      this.updateStateCounts();
    }

    getCoordinates(el) {
      const num = el.atomicNumber;
      const period = el.period;
      const group = el.group;

      if (num >= 57 && num <= 71) {
        return { row: 10, col: (num - 57) + 4 };
      }

      if (num >= 89 && num <= 103) {
        return { row: 11, col: (num - 89) + 4 };
      }

      return {
        row: period + 1,
        col: group + 1
      };
    }

    renderGrid() {
      this.grid.innerHTML = '';
      this.tileMap.clear();

      const frag = document.createDocumentFragment();

      for (let g = 1; g <= 18; g++) {
        const header = document.createElement('div');
        header.className = 'grid-header-cell group-header';
        header.style.gridColumn = String(g + 1);
        header.style.gridRow = '1';
        header.textContent = g;
        header.title = `Group ${g}`;
        frag.appendChild(header);
      }

      for (let p = 1; p <= 7; p++) {
        const header = document.createElement('div');
        header.className = 'grid-header-cell period-header';
        header.style.gridColumn = '1';
        header.style.gridRow = String(p + 1);
        header.textContent = p;
        header.title = `Period ${p}`;
        frag.appendChild(header);
      }

      const lanthPlaceholder = document.createElement('div');
      lanthPlaceholder.className = 'series-placeholder';
      lanthPlaceholder.style.gridRow = '7';
      lanthPlaceholder.style.gridColumn = '4';
      lanthPlaceholder.innerHTML = `
        <span class="series-placeholder-range">57–71</span>
        <span class="series-placeholder-name">La–Lu</span>
      `;
      lanthPlaceholder.title = 'Lanthanide series (click to highlight)';
      lanthPlaceholder.addEventListener('click', () => this.filterByCategory('lanthanide'));
      frag.appendChild(lanthPlaceholder);

      const actinPlaceholder = document.createElement('div');
      actinPlaceholder.className = 'series-placeholder';
      actinPlaceholder.style.gridRow = '8';
      actinPlaceholder.style.gridColumn = '4';
      actinPlaceholder.innerHTML = `
        <span class="series-placeholder-range">89–103</span>
        <span class="series-placeholder-name">Ac–Lr</span>
      `;
      actinPlaceholder.title = 'Actinide series (click to highlight)';
      actinPlaceholder.addEventListener('click', () => this.filterByCategory('actinide'));
      frag.appendChild(actinPlaceholder);

      const gapRow = document.createElement('div');
      gapRow.className = 'series-gap-row';
      frag.appendChild(gapRow);

      const lanthHeader = document.createElement('div');
      lanthHeader.className = 'grid-header-cell period-header';
      lanthHeader.style.gridRow = '10';
      lanthHeader.style.gridColumn = '1 / span 3';
      lanthHeader.style.justifyContent = 'flex-start';
      lanthHeader.style.paddingLeft = '8px';
      lanthHeader.textContent = '★ Lanthanides';
      frag.appendChild(lanthHeader);

      const actinHeader = document.createElement('div');
      actinHeader.className = 'grid-header-cell period-header';
      actinHeader.style.gridRow = '11';
      actinHeader.style.gridColumn = '1 / span 3';
      actinHeader.style.justifyContent = 'flex-start';
      actinHeader.style.paddingLeft = '8px';
      actinHeader.textContent = '★★ Actinides';
      frag.appendChild(actinHeader);

      window.ElementsDB.all.forEach(el => {
        const coords = this.getCoordinates(el);
        const tile = this.createTileElement(el, coords);
        this.tileMap.set(el.atomicNumber, tile);
        frag.appendChild(tile);
      });

      this.grid.appendChild(frag);
    }

    createTileElement(el, coords) {
      const tile = document.createElement('a');
      tile.href = `#details?z=${el.atomicNumber}`;
      tile.className = 'element-tile';
      tile.dataset.number = el.atomicNumber;
      tile.dataset.symbol = el.symbol;
      tile.dataset.category = el.category;
      tile.dataset.block = el.block;
      tile.dataset.period = el.period;
      tile.dataset.group = el.group || '';

      const stateAtTemp = window.ElementsDB.getStateAtTemperature(el, this.currentTempKelvin);
      tile.dataset.state = stateAtTemp;

      tile.style.gridRow = String(coords.row);
      tile.style.gridColumn = String(coords.col);
      tile.setAttribute('role', 'button');
      tile.setAttribute('aria-label', `${el.name}, Atomic Number ${el.atomicNumber}, Symbol ${el.symbol}`);
      tile.setAttribute('tabindex', '0');

      const weightDisplay = typeof el.atomicWeight === 'number'
        ? el.atomicWeight.toFixed(el.atomicWeight > 100 ? 1 : 2)
        : el.atomicWeight;

      tile.innerHTML = `
        <div class="tile-top">
          <span class="tile-number">${el.atomicNumber}</span>
          <span class="tile-mass" title="Atomic Mass: ${weightDisplay}">${weightDisplay}</span>
        </div>
        <div class="tile-symbol">${el.symbol}</div>
        <div class="tile-name">${el.name}</div>
      `;

      tile.addEventListener('mouseenter', (e) => this.handleTileMouseEnter(el, tile, e));
      tile.addEventListener('mouseleave', () => this.handleTileMouseLeave(tile));
      tile.addEventListener('focus', (e) => this.handleTileMouseEnter(el, tile, e));
      tile.addEventListener('blur', () => this.handleTileMouseLeave(tile));
      tile.addEventListener('click', (e) => {
        e.preventDefault();
        if (typeof this.options.onElementSelect === 'function') {
          this.options.onElementSelect(el);
        } else {
          window.location.hash = `#details?z=${el.atomicNumber}`;
        }
      });

      return tile;
    }

    handleTileMouseEnter(el, tile, event) {
      clearTimeout(this.hideTimeout);
      if (this.pinnedElement) return;
      this.activeHoverTile = tile;
      this.showPreviewCard(el, tile);
    }

    handleTileMouseLeave(tile) {
      if (this.pinnedElement) return;
      this.scheduleHidePreviewCard(280);
    }

    scheduleHidePreviewCard(delay = 280) {
      if (this.pinnedElement) return;
      clearTimeout(this.hideTimeout);
      this.hideTimeout = setTimeout(() => {
        if (!this.isMouseOverCard && !this.pinnedElement) {
          this.hidePreviewCard();
        }
      }, delay);
    }

    hidePreviewCard() {
      if (!this.previewCard || this.pinnedElement || this.isMouseOverCard) return;
      clearTimeout(this.hideTimeout);
      this.previewCard.classList.remove('visible');
      if (this.activeHoverTile) {
        this.activeHoverTile.classList.remove('preview-hover-active');
        this.activeHoverTile = null;
      }
    }

    showPreviewCard(el, anchorTile) {
      if (!this.previewCard || !el) return;
      clearTimeout(this.hideTimeout);

      if (this.activeHoverTile && this.activeHoverTile !== anchorTile) {
        this.activeHoverTile.classList.remove('preview-hover-active');
      }
      this.activeHoverTile = anchorTile;
      if (anchorTile) anchorTile.classList.add('preview-hover-active');

      const state = window.ElementsDB.getStateAtTemperature(el, this.currentTempKelvin);
      const catMeta = window.ElementsDB.categories[el.category] || {};

      const badgeSym = this.previewCard.querySelector('.preview-badge-sym');
      const badgeNum = this.previewCard.querySelector('.preview-badge-num');
      const nameEl = this.previewCard.querySelector('.preview-element-name');
      const catEl = this.previewCard.querySelector('.preview-element-category');
      const weightEl = this.previewCard.querySelector('.preview-element-weight');

      if (badgeSym) badgeSym.textContent = el.symbol;
      if (badgeNum) badgeNum.textContent = el.atomicNumber;
      if (nameEl) nameEl.textContent = el.name;
      if (catEl) {
        catEl.textContent = catMeta.name || el.category;
        catEl.style.color = catMeta.color || 'var(--text-secondary)';
      }
      if (weightEl) weightEl.textContent = `Mass: ${el.atomicWeight} u`;

      const badge = this.previewCard.querySelector('.preview-symbol-badge');
      if (badge) {
        badge.style.background = catMeta.color || 'var(--bg-secondary)';
      }

      const formatTemp = (k) => {
        if (k === null || k === undefined) return '—';
        const c = Math.round(window.ElementsDB.kelvinToCelsius(k));
        const cFormatted = c >= 0 ? `+${c}` : `${c}`;
        return `${k} K (${cFormatted} °C)`;
      };

      this.setPreviewStat('preview-state', state.toUpperCase());
      this.setPreviewStat('preview-period-group', `P: ${el.period} | G: ${el.group || '—'}`);
      this.setPreviewStat('preview-config', el.electronConfiguration || '—');
      this.setPreviewStat('preview-melting', formatTemp(el.meltingPoint));
      this.setPreviewStat('preview-boiling', formatTemp(el.boilingPoint));
      this.setPreviewStat('preview-electroneg', (el.electronegativity !== null && el.electronegativity !== undefined) ? `${el.electronegativity} Pauling` : '—');
      this.setPreviewStat('preview-density', (el.density !== null && el.density !== undefined) ? `${el.density} g/cm³` : '—');

      const disc = el.discoverer || 'Ancient / Prehistoric';
      const year = el.discoveryYear ? (el.discoveryYear > 0 ? `${el.discoveryYear}` : `${Math.abs(el.discoveryYear)} BCE`) : '';
      const discText = year ? `${disc} (${year})` : disc;
      this.setPreviewStat('preview-discoverer', discText);

      const detailsBtn = this.previewCard.querySelector('.preview-details-btn');
      if (detailsBtn) {
        detailsBtn.href = `#details?z=${el.atomicNumber}`;
      }

      this.positionPreviewCard(anchorTile);
      this.previewCard.classList.add('visible');
    }

    setPreviewStat(id, value) {
      const el = document.getElementById(id);
      if (el) el.textContent = value;
    }

    positionPreviewCard(anchorTile) {
      if (!this.previewCard || !anchorTile) return;

      const rect = anchorTile.getBoundingClientRect();
      const cardWidth = 350;
      const cardHeight = this.previewCard.offsetHeight || 370;
      const margin = 12;
      const minTop = 75;
      const maxBottom = window.innerHeight - margin;

      let left;
      let top = rect.top;

      const canFitRight = (rect.right + cardWidth + margin <= window.innerWidth);
      const canFitLeft = (rect.left - cardWidth - margin >= 0);

      if (canFitRight) {
        left = rect.right + margin;
      } else if (canFitLeft) {
        left = rect.left - cardWidth - margin;
      } else {
        left = Math.max(margin, (window.innerWidth - cardWidth) / 2);
      }

      if (top + cardHeight > maxBottom) {
        top = Math.max(minTop, maxBottom - cardHeight);
      }
      if (top < minTop) {
        top = minTop;
      }

      const horizontalOverlap = !(left + cardWidth < rect.left || left > rect.right);
      if (horizontalOverlap) {
        if (rect.bottom + cardHeight + margin <= window.innerHeight) {
          top = rect.bottom + margin;
        } else if (rect.top - cardHeight - margin >= minTop) {
          top = rect.top - cardHeight - margin;
        }
      }

      this.previewCard.style.top = `${Math.round(top)}px`;
      this.previewCard.style.left = `${Math.round(left)}px`;
    }

    setTemperature(kelvin) {
      this.currentTempKelvin = Math.max(0, Math.min(6000, Number(kelvin) || 293.15));

      const celsius = window.ElementsDB.kelvinToCelsius(this.currentTempKelvin);
      const fahr = window.ElementsDB.kelvinToFahrenheit(this.currentTempKelvin);

      const kDisplay = document.getElementById('temp-value-kelvin');
      const cDisplay = document.getElementById('temp-value-celsius');
      const fDisplay = document.getElementById('temp-value-fahrenheit');
      const slider = document.getElementById('temperature-slider');

      if (kDisplay) kDisplay.textContent = `${Math.round(this.currentTempKelvin)} K`;
      if (cDisplay) cDisplay.textContent = `${celsius >= 0 ? '+' : ''}${Math.round(celsius)} °C`;
      if (fDisplay) fDisplay.textContent = `${fahr >= 0 ? '+' : ''}${Math.round(fahr)} °F`;
      if (slider && Number(slider.value) !== Math.round(this.currentTempKelvin)) {
        slider.value = Math.round(this.currentTempKelvin);
      }

      this.tileMap.forEach((tile, num) => {
        const el = window.ElementsDB.get(num);
        if (!el) return;
        const state = window.ElementsDB.getStateAtTemperature(el, this.currentTempKelvin);
        tile.dataset.state = state;
      });

      this.updateStateCounts();
      this.applyActiveFilters();
    }

    updateStateCounts() {
      let solid = 0, liquid = 0, gas = 0, unknown = 0;

      window.ElementsDB.all.forEach(el => {
        const state = window.ElementsDB.getStateAtTemperature(el, this.currentTempKelvin);
        if (state === 'solid') solid++;
        else if (state === 'liquid') liquid++;
        else if (state === 'gas') gas++;
        else unknown++;
      });

      const sCount = document.getElementById('count-solid');
      const lCount = document.getElementById('count-liquid');
      const gCount = document.getElementById('count-gas');

      if (sCount) sCount.textContent = solid;
      if (lCount) lCount.textContent = liquid;
      if (gCount) gCount.textContent = gas;
    }

    setHeatmapProperty(propKey) {
      this.activeHeatmapProp = propKey || null;

      const legendContainer = document.getElementById('heatmap-legend-container');
      const propConfig = propKey ? window.ElementsDB.heatmapProperties[propKey] : null;

      if (!propConfig) {
        if (legendContainer) legendContainer.classList.remove('active');
        this.tileMap.forEach((tile, num) => {
          const el = window.ElementsDB.get(num);
          tile.style.backgroundColor = '';
          tile.style.color = '';
          const massSpan = tile.querySelector('.tile-mass');
          if (massSpan && el) {
            const weightDisplay = typeof el.atomicWeight === 'number'
              ? el.atomicWeight.toFixed(el.atomicWeight > 100 ? 1 : 2)
              : el.atomicWeight;
            massSpan.textContent = weightDisplay;
            massSpan.title = `Atomic Mass: ${weightDisplay}`;
          }
        });
        return;
      }

      if (legendContainer) {
        legendContainer.classList.add('active');
        const nameEl = legendContainer.querySelector('.heatmap-property-name');
        const unitEl = legendContainer.querySelector('.heatmap-property-unit');
        const minEl = legendContainer.querySelector('#heatmap-min-label');
        const maxEl = legendContainer.querySelector('#heatmap-max-label');

        if (nameEl) nameEl.textContent = propConfig.name;
        if (unitEl) unitEl.textContent = `(${propConfig.unit})`;
        if (minEl) minEl.textContent = propConfig.format(propConfig.min);
        if (maxEl) maxEl.textContent = propConfig.format(propConfig.max);
      }

      this.tileMap.forEach((tile, num) => {
        const el = window.ElementsDB.get(num);
        if (!el) return;

        const val = el[propKey];
        const color = window.ElementsDB.getHeatmapColor(val, propKey);
        const massSpan = tile.querySelector('.tile-mass');

        if (color) {
          tile.style.backgroundColor = color.css;
          tile.style.color = color.contrastText;
          if (massSpan) {
            massSpan.textContent = propConfig.format(val);
            massSpan.title = `${propConfig.name}: ${propConfig.format(val)}`;
            massSpan.style.color = color.contrastText;
          }
        } else {
          tile.style.backgroundColor = '#20272C';
          tile.style.color = '#687176';
          if (massSpan) {
            massSpan.textContent = 'N/A';
            massSpan.title = 'Value not available';
          }
        }
      });
    }

    filterByCategory(category) {
      if (this.activeCategoryFilter === category) {
        this.activeCategoryFilter = null;
      } else {
        this.activeCategoryFilter = category;
      }

      this.updateCategoryLegendUI();
      this.applyActiveFilters();
    }

    renderCategoryLegend() {
      const container = document.getElementById('category-legend-list');
      if (!container) return;

      container.innerHTML = '';
      Object.values(window.ElementsDB.categories).forEach(cat => {
        const item = document.createElement('button');
        item.className = 'legend-item';
        item.dataset.category = cat.id;
        item.style.setProperty('--cat-color', cat.color);
        item.innerHTML = `
          <span class="legend-swatch" style="background:${cat.color}"></span>
          <span>${cat.name}</span>
        `;
        item.title = cat.description;
        item.addEventListener('click', () => this.filterByCategory(cat.id));
        container.appendChild(item);
      });
    }

    updateCategoryLegendUI() {
      const items = document.querySelectorAll('.legend-item');
      items.forEach(item => {
        const catId = item.dataset.category;
        if (!this.activeCategoryFilter) {
          item.classList.remove('active', 'dimmed');
        } else if (catId === this.activeCategoryFilter) {
          item.classList.add('active');
          item.classList.remove('dimmed');
        } else {
          item.classList.remove('active');
          item.classList.add('dimmed');
        }
      });
    }

    applyActiveFilters() {
      let matchCount = 0;

      this.tileMap.forEach((tile, num) => {
        const el = window.ElementsDB.get(num);
        if (!el) return;

        let match = true;

        if (this.activeCategoryFilter && el.category !== this.activeCategoryFilter) {
          match = false;
        }

        if (this.activeStateFilter) {
          const state = window.ElementsDB.getStateAtTemperature(el, this.currentTempKelvin);
          if (state !== this.activeStateFilter) match = false;
        }

        if (this.activeBlockFilter && el.block !== this.activeBlockFilter) {
          match = false;
        }

        if (this.activePeriodFilter && el.period !== Number(this.activePeriodFilter)) {
          match = false;
        }

        if (this.searchQuery) {
          const q = this.searchQuery.toLowerCase();
          const matchNum = el.atomicNumber.toString() === q;
          const matchSym = el.symbol.toLowerCase() === q || el.symbol.toLowerCase().startsWith(q);
          const matchName = el.name.toLowerCase().includes(q);
          if (!matchNum && !matchSym && !matchName) match = false;
        }

        if (match) {
          tile.classList.remove('dimmed');
          matchCount++;
          if (this.searchQuery) {
            tile.classList.add('highlighted');
          } else {
            tile.classList.remove('highlighted');
          }
        } else {
          tile.classList.add('dimmed');
          tile.classList.remove('highlighted');
        }
      });

      const counterEl = document.getElementById('filter-results-counter');
      if (counterEl) {
        counterEl.textContent = `Showing ${matchCount} of 118 elements`;
      }
    }

    resetFilters() {
      this.activeCategoryFilter = null;
      this.activeStateFilter = null;
      this.activeBlockFilter = null;
      this.activePeriodFilter = null;
      this.searchQuery = '';

      const searchInput = document.getElementById('global-search-input');
      if (searchInput) searchInput.value = '';

      document.querySelectorAll('.filter-pill.active').forEach(p => p.classList.remove('active'));
      this.updateCategoryLegendUI();
      this.applyActiveFilters();
    }

    bindEvents() {
      const tempSlider = document.getElementById('temperature-slider');
      if (tempSlider) {
        tempSlider.addEventListener('input', (e) => {
          this.setTemperature(Number(e.target.value));
        });
      }

      const tempPresets = [
        { id: 'temp-preset-0k', k: 0 },
        { id: 'temp-preset-room', k: 293.15 },
        { id: 'temp-preset-water-boil', k: 373.15 },
        { id: 'temp-preset-hot', k: 2500 }
      ];
      tempPresets.forEach(preset => {
        const btn = document.getElementById(preset.id);
        if (btn) btn.addEventListener('click', () => this.setTemperature(preset.k));
      });

      const heatmapSelect = document.getElementById('heatmap-property-select');
      if (heatmapSelect) {
        heatmapSelect.addEventListener('change', (e) => {
          this.setHeatmapProperty(e.target.value || null);
        });
      }

      const resetBtn = document.getElementById('legend-reset-btn');
      if (resetBtn) {
        resetBtn.addEventListener('click', () => this.resetFilters());
      }

      if (this.previewCard) {
        const pinBtn = this.previewCard.querySelector('.preview-pin-btn');
        const closeBtn = this.previewCard.querySelector('.preview-close-btn');

        this.previewCard.addEventListener('mouseenter', () => {
          this.isMouseOverCard = true;
          clearTimeout(this.hideTimeout);
        });

        this.previewCard.addEventListener('mouseleave', (e) => {
          this.isMouseOverCard = false;
          if (this.activeHoverTile && this.activeHoverTile.contains(e.relatedTarget)) {
            return;
          }
          this.scheduleHidePreviewCard(280);
        });

        if (pinBtn) {
          pinBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            if (this.pinnedElement) {
              this.pinnedElement = null;
              pinBtn.classList.remove('active');
              this.previewCard.classList.remove('pinned');
            } else {
              this.pinnedElement = true;
              pinBtn.classList.add('active');
              this.previewCard.classList.add('pinned');
            }
          });
        }

        if (closeBtn) {
          closeBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            this.pinnedElement = null;
            this.isMouseOverCard = false;
            if (pinBtn) pinBtn.classList.remove('active');
            this.previewCard.classList.remove('pinned');
            this.hidePreviewCard();
          });
        }

        document.addEventListener('click', (e) => {
          if (this.pinnedElement) return;
          if (!this.previewCard.contains(e.target) && !e.target.closest('.element-tile')) {
            this.isMouseOverCard = false;
            this.hidePreviewCard();
          }
        });
      }

      const filterToggleBtn = document.getElementById('filter-toggle-btn');
      const filterPanel = document.getElementById('filter-panel-collapsible');
      if (filterToggleBtn && filterPanel) {
        filterToggleBtn.addEventListener('click', () => {
          const isOpen = filterPanel.classList.toggle('open');
          filterToggleBtn.classList.toggle('active', isOpen);
        });
      }

      document.querySelectorAll('.filter-pill[data-filter-type]').forEach(pill => {
        pill.addEventListener('click', (e) => {
          const type = pill.dataset.filterType;
          const val = pill.dataset.filterValue;

          const isCurrentlyActive = pill.classList.contains('active');
          document.querySelectorAll(`.filter-pill[data-filter-type="${type}"]`).forEach(p => p.classList.remove('active'));

          if (!isCurrentlyActive) {
            pill.classList.add('active');
            if (type === 'state') this.activeStateFilter = val;
            if (type === 'block') this.activeBlockFilter = val;
            if (type === 'period') this.activePeriodFilter = val;
          } else {
            if (type === 'state') this.activeStateFilter = null;
            if (type === 'block') this.activeBlockFilter = null;
            if (type === 'period') this.activePeriodFilter = null;
          }

          this.applyActiveFilters();
        });
      });

      const searchInput = document.getElementById('global-search-input');
      const searchClearBtn = document.getElementById('search-clear-btn');
      const searchDropdown = document.getElementById('search-results-dropdown');

      if (searchInput) {
        searchInput.addEventListener('input', (e) => {
          const val = e.target.value.trim();
          this.searchQuery = val;
          if (searchClearBtn) {
            searchClearBtn.classList.toggle('visible', val.length > 0);
          }
          this.applyActiveFilters();
          this.updateSearchDropdown(val, searchDropdown);
        });

        searchInput.addEventListener('focus', () => {
          if (searchInput.value.trim().length > 0 && searchDropdown) {
            searchDropdown.classList.add('show');
          }
        });

        document.addEventListener('click', (e) => {
          if (!searchInput.contains(e.target) && searchDropdown && !searchDropdown.contains(e.target)) {
            searchDropdown.classList.remove('show');
          }
        });
      }

      if (searchClearBtn) {
        searchClearBtn.addEventListener('click', () => {
          if (searchInput) {
            searchInput.value = '';
            this.searchQuery = '';
            searchClearBtn.classList.remove('visible');
            if (searchDropdown) searchDropdown.classList.remove('show');
            this.applyActiveFilters();
          }
        });
      }
    }

    updateSearchDropdown(query, dropdown) {
      if (!dropdown) return;
      if (!query) {
        dropdown.classList.remove('show');
        dropdown.innerHTML = '';
        return;
      }

      const results = window.ElementsDB.filter({ query }).slice(0, 8);
      if (results.length === 0) {
        dropdown.innerHTML = `<div style="padding: 0.75rem 1rem; color: var(--text-muted); font-size: 0.85rem;">No chemical elements found for "${query}"</div>`;
        dropdown.classList.add('show');
        return;
      }

      dropdown.innerHTML = results.map(el => {
        const catMeta = window.ElementsDB.categories[el.category] || {};
        return `
          <div class="search-result-item" data-number="${el.atomicNumber}" style="--cat-color: ${catMeta.color || 'var(--accent-cyan)'}">
            <div class="search-result-left">
              <span class="search-badge-sym">${el.symbol}</span>
              <div>
                <div class="search-name-text">${el.name}</div>
                <div class="search-category-text">${catMeta.name || el.category}</div>
              </div>
            </div>
            <span class="search-result-num">#${el.atomicNumber}</span>
          </div>
        `;
      }).join('');

      dropdown.querySelectorAll('.search-result-item').forEach(item => {
        item.addEventListener('click', () => {
          const num = Number(item.dataset.number);
          dropdown.classList.remove('show');
          window.location.hash = `#details?z=${num}`;
        });
      });

      dropdown.classList.add('show');
    }
  }

  window.PeriodicTable = PeriodicTable;

})(window);
