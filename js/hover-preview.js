(function () {
  'use strict';

  class HoverPreviewManager {
    constructor() {
      this.card = null;
      this.isPinned = false;
      this.currentElement = null;
      this.activeTile = null;
      this.hideTimeout = null;
      this.showDelayTimeout = null;
      this.isTouchDevice = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
      
      this.init();
    }

    init() {
      this.createCardDOM();
      this.bindEvents();
    }

    createCardDOM() {
      this.card = document.createElement('div');
      this.card.className = 'hover-preview-card';
      this.card.setAttribute('role', 'dialog');
      this.card.setAttribute('aria-label', 'Element Quick Preview');
      this.card.innerHTML = `
        <div class="preview-card-header">
          <div class="preview-hero-main">
            <div class="preview-symbol-badge" id="previewBadge">
              <span class="preview-badge-num" id="previewNum">1</span>
              <span class="preview-badge-sym" id="previewSym">H</span>
            </div>
            <div class="preview-meta-info">
              <h3 class="preview-element-name" id="previewName">Hydrogen</h3>
              <span class="preview-element-category" id="previewCategory">Reactive Nonmetal</span>
              <span class="preview-element-weight" id="previewWeight">1.008 u</span>
            </div>
          </div>
          <div class="preview-card-actions">
            <button class="preview-action-btn" id="previewPinBtn" title="Pin preview card" aria-label="Pin preview card">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M16 2l6 6-7 7-6-6 7-7zM2 22l7-7"/></svg>
            </button>
            <button class="preview-action-btn" id="previewCloseBtn" title="Close preview" aria-label="Close preview">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
            </button>
          </div>
        </div>
        <div class="preview-card-body">
          <div class="preview-stat-item">
            <span class="preview-stat-label">Group / Period</span>
            <span class="preview-stat-val" id="previewGrpPer">1 / 1</span>
          </div>
          <div class="preview-stat-item">
            <span class="preview-stat-label">Block / State</span>
            <span class="preview-stat-val" id="previewBlockState">s-block / Gas</span>
          </div>
          <div class="preview-stat-item preview-stat-full">
            <span class="preview-stat-label">Electron Configuration</span>
            <span class="preview-stat-val" id="previewConfig">1s¹</span>
          </div>
          <div class="preview-stat-item">
            <span class="preview-stat-label">Protons / Electrons</span>
            <span class="preview-stat-val" id="previewProtons">1 / 1</span>
          </div>
          <div class="preview-stat-item">
            <span class="preview-stat-label">Electronegativity</span>
            <span class="preview-stat-val" id="previewElectro">2.20 Pauling</span>
          </div>
          <div class="preview-stat-item">
            <span class="preview-stat-label">Melting Point</span>
            <span class="preview-stat-val" id="previewMelting">14.01 K</span>
          </div>
          <div class="preview-stat-item">
            <span class="preview-stat-label">Boiling Point</span>
            <span class="preview-stat-val" id="previewBoiling">20.28 K</span>
          </div>
          <div class="preview-stat-item preview-stat-full">
            <span class="preview-stat-label">Density</span>
            <span class="preview-stat-val" id="previewDensity">0.00008988 g/cm³</span>
          </div>
        </div>
        <div class="preview-card-footer">
          <span style="font-size:0.75rem; color:var(--text-muted);">Click element to open profile</span>
          <a href="#" class="preview-details-btn" id="previewFullLink" target="_blank" rel="noopener">
            Full Profile
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>
          </a>
        </div>
      `;

      document.body.appendChild(this.card);
    }

    bindEvents() {
      const pinBtn = this.card.querySelector('#previewPinBtn');
      const closeBtn = this.card.querySelector('#previewCloseBtn');

      pinBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        this.togglePin();
      });

      closeBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        this.unpin();
        this.hideCard();
      });

      this.card.addEventListener('mouseenter', () => {
        clearTimeout(this.hideTimeout);
      });

      this.card.addEventListener('mouseleave', () => {
        if (!this.isPinned) {
          this.scheduleHide(150);
        }
      });

      document.addEventListener('click', (e) => {
        if (this.isPinned) return;
        if (!this.card.contains(e.target) && !e.target.closest('.element-tile')) {
          this.hideCard();
        }
      });
    }

    togglePin() {
      this.isPinned = !this.isPinned;
      const pinBtn = this.card.querySelector('#previewPinBtn');
      if (this.isPinned) {
        this.card.classList.add('pinned');
        pinBtn.classList.add('active');
        pinBtn.setAttribute('title', 'Unpin preview card');
      } else {
        this.unpin();
      }
    }

    unpin() {
      this.isPinned = false;
      this.card.classList.remove('pinned');
      const pinBtn = this.card.querySelector('#previewPinBtn');
      if (pinBtn) pinBtn.classList.remove('active');
    }

    showForTile(tile, element) {
      if (!element) return;
      clearTimeout(this.hideTimeout);

      if (this.activeTile && this.activeTile !== tile) {
        this.activeTile.classList.remove('preview-active');
      }

      this.currentElement = element;
      this.activeTile = tile;
      this.activeTile.classList.add('preview-active');

      this.populateContent(element);
      this.positionCard(tile);

      this.card.classList.add('visible');
    }

    scheduleHide(delay = 280) {
      if (this.isPinned) return;
      clearTimeout(this.hideTimeout);
      this.hideTimeout = setTimeout(() => {
        this.hideCard();
      }, delay);
    }

    hideCard() {
      if (this.isPinned) return;
      if (this.card) {
        this.card.classList.remove('visible');
      }
      if (this.activeTile) {
        this.activeTile.classList.remove('preview-active');
        this.activeTile = null;
      }
    }

    positionCard(targetTile) {
      const tileRect = targetTile.getBoundingClientRect();
      const cardWidth = 350;
      const cardHeight = this.card.offsetHeight || 380;
      const viewportWidth = window.innerWidth;
      const viewportHeight = window.innerHeight;
      const margin = 12;

      let left;
      let top = tileRect.top;

      if (tileRect.right + cardWidth + margin < viewportWidth) {
        left = tileRect.right + margin;
      } else if (tileRect.left - cardWidth - margin > 0) {
        left = tileRect.left - cardWidth - margin;
      } else {
        left = Math.max(margin, (viewportWidth - cardWidth) / 2);
      }

      if (top + cardHeight > viewportHeight - margin) {
        top = Math.max(margin, viewportHeight - cardHeight - margin);
      }
      if (top < margin) {
        top = margin;
      }

      this.card.style.left = `${left}px`;
      this.card.style.top = `${top}px`;
    }

    populateContent(el) {
      const catKey = el.category || 'unknown';
      const catMeta = window.ELEMENT_CATEGORIES ? window.ELEMENT_CATEGORIES[catKey] : null;
      const catColorVar = catMeta ? `var(${catMeta.colorVar})` : 'var(--accent-secondary)';

      this.card.style.setProperty('--cat-color', catColorVar);

      this.card.querySelector('#previewNum').textContent = el.atomicNumber;
      this.card.querySelector('#previewSym').textContent = el.symbol;
      this.card.querySelector('#previewName').textContent = el.name;
      this.card.querySelector('#previewCategory').textContent = catMeta ? catMeta.label : el.category;
      this.card.querySelector('#previewWeight').textContent = typeof el.atomicWeight === 'number' ? `${el.atomicWeight} u` : `[${el.atomicWeight}]`;

      const grpStr = el.group ? `Group ${el.group}` : 'Lanthanide/Actinide';
      this.card.querySelector('#previewGrpPer').textContent = `${grpStr} / Period ${el.period}`;
      this.card.querySelector('#previewBlockState').textContent = `${el.block}-block / ${this.capitalize(el.state || 'Unknown')}`;
      this.card.querySelector('#previewConfig').textContent = el.electronConfiguration || 'Unavailable';
      this.card.querySelector('#previewProtons').textContent = `${el.atomicNumber} p⁺ / ${el.atomicNumber} e⁻`;

      this.card.querySelector('#previewElectro').textContent = el.electronegativity !== null ? `${el.electronegativity} Pauling` : 'Unavailable';
      this.card.querySelector('#previewMelting').textContent = el.meltingPoint !== null ? `${el.meltingPoint} K (${(el.meltingPoint - 273.15).toFixed(1)} °C)` : 'Unavailable';
      this.card.querySelector('#previewBoiling').textContent = el.boilingPoint !== null ? `${el.boilingPoint} K (${(el.boilingPoint - 273.15).toFixed(1)} °C)` : 'Unavailable';
      this.card.querySelector('#previewDensity').textContent = el.density !== null ? `${el.density} g/cm³` : 'Unavailable';

      const fullLink = this.card.querySelector('#previewFullLink');
      fullLink.href = `element.html?symbol=${el.symbol}`;
    }

    capitalize(str) {
      if (!str) return '';
      return str.charAt(0).toUpperCase() + str.slice(1);
    }
  }

  document.addEventListener('DOMContentLoaded', () => {
    window.hoverPreviewManager = new HoverPreviewManager();
  });
})();
