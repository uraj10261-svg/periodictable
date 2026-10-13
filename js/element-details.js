(function (window) {
  'use strict';

  class ElementDetailsController {
    constructor() {
      this.currentElement = null;
      this.bohrModel = null;
      this.activeTab = 'tab-overview';

      this.init();
    }

    init() {
      const bohrContainer = document.getElementById('bohr-model-container');
      if (bohrContainer) {
        this.bohrModel = new window.BohrModel(bohrContainer);
      }

      this.bindEvents();
    }

    bindEvents() {
      document.querySelectorAll('.detail-tab-btn').forEach(btn => {
        btn.addEventListener('click', () => {
          const targetTabId = btn.dataset.tab;
          this.switchTab(targetTabId);
        });
      });

      const playPauseBtn = document.getElementById('bohr-play-pause-btn');
      if (playPauseBtn && this.bohrModel) {
        playPauseBtn.addEventListener('click', () => {
          const isPaused = this.bohrModel.togglePause();
          playPauseBtn.innerHTML = isPaused
            ? '<i class="fas fa-play"></i> Resume'
            : '<i class="fas fa-pause"></i> Pause';
        });
      }

      const prevBtn = document.getElementById('detail-prev-btn');
      const nextBtn = document.getElementById('detail-next-btn');

      if (prevBtn) {
        prevBtn.addEventListener('click', () => {
          if (this.currentElement && this.currentElement.atomicNumber > 1) {
            window.location.hash = `#details?z=${this.currentElement.atomicNumber - 1}`;
          }
        });
      }

      if (nextBtn) {
        nextBtn.addEventListener('click', () => {
          if (this.currentElement && this.currentElement.atomicNumber < 118) {
            window.location.hash = `#details?z=${this.currentElement.atomicNumber + 1}`;
          }
        });
      }

      window.addEventListener('keydown', (e) => {
        const detailsView = document.getElementById('view-details');
        if (!detailsView || detailsView.style.display === 'none') return;

        if (e.key === 'ArrowLeft' && this.currentElement && this.currentElement.atomicNumber > 1) {
          window.location.hash = `#details?z=${this.currentElement.atomicNumber - 1}`;
        } else if (e.key === 'ArrowRight' && this.currentElement && this.currentElement.atomicNumber < 118) {
          window.location.hash = `#details?z=${this.currentElement.atomicNumber + 1}`;
        }
      });
    }

    switchTab(tabId) {
      this.activeTab = tabId;

      document.querySelectorAll('.detail-tab-btn').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.tab === tabId);
      });

      document.querySelectorAll('.tab-panel').forEach(panel => {
        panel.classList.toggle('active', panel.id === tabId);
      });
    }

    loadElement(query) {
      const el = window.ElementsDB.get(query);
      if (!el) return false;

      this.currentElement = el;
      const catMeta = window.ElementsDB.categories[el.category] || {};

      const prevBtn = document.getElementById('detail-prev-btn');
      const nextBtn = document.getElementById('detail-next-btn');

      if (prevBtn) {
        prevBtn.disabled = el.atomicNumber <= 1;
        const prevEl = window.ElementsDB.get(el.atomicNumber - 1);
        prevBtn.title = prevEl ? `Previous: ${prevEl.name} (${prevEl.symbol})` : '';
        prevBtn.innerHTML = prevEl ? `&larr; #${prevEl.atomicNumber} ${prevEl.symbol}` : '&larr; Prev';
      }

      if (nextBtn) {
        nextBtn.disabled = el.atomicNumber >= 118;
        const nextEl = window.ElementsDB.get(el.atomicNumber + 1);
        nextBtn.title = nextEl ? `Next: ${nextEl.name} (${nextEl.symbol})` : '';
        nextBtn.innerHTML = nextEl ? `#${nextEl.atomicNumber} ${nextEl.symbol} &rarr;` : 'Next &rarr;';
      }

      const hero = document.getElementById('element-hero-banner');
      if (hero) {
        hero.style.setProperty('--cat-color', catMeta.color || 'var(--accent-cyan)');
        hero.style.setProperty('--cat-color-glow', catMeta.glow || 'var(--accent-glow)');
      }

      this.setText('hero-card-number', el.atomicNumber);
      this.setText('hero-card-symbol', el.symbol);
      this.setText('hero-card-mass', typeof el.atomicWeight === 'number' ? el.atomicWeight.toFixed(3) : el.atomicWeight);

      this.setText('hero-element-title', `${el.name} (${el.symbol})`);
      this.setText('hero-category-tag', catMeta.name || el.category);
      this.setText('hero-state-tag', `Phase: ${el.state.toUpperCase()}`);
      this.setText('hero-origin-desc', el.originOfName || 'Origin of element name recorded in IUPAC documentation.');

      this.setText('stat-quick-period', el.period);
      this.setText('stat-quick-group', el.group || '—');
      this.setText('stat-quick-block', `${el.block}-block`);
      this.setText('stat-quick-config', el.electronConfiguration || '—');

      if (this.bohrModel) {
        this.bohrModel.render(el);
      }

      this.setText('prop-discoverer', el.discoverer || 'Ancient / Prehistoric');
      this.setText('prop-discovery-year', el.discoveryYear > 0 ? el.discoveryYear : `${Math.abs(el.discoveryYear)} BCE`);
      this.setText('prop-name-origin', el.originOfName || '—');
      this.setText('prop-occurrence', el.occurrence ? el.occurrence.toUpperCase() : 'Primordial');
      this.setText('prop-cas', el.casNumber || '—');

      const usesList = document.getElementById('detail-uses-list');
      if (usesList) {
        if (el.uses && el.uses.length > 0) {
          usesList.innerHTML = el.uses.map(u => `<li><i class="fas fa-check-circle" style="color:var(--accent-cyan);margin-right:8px;"></i>${u}</li>`).join('');
        } else {
          usesList.innerHTML = `<li>Used primarily in academic, relativistic, and nuclear synthesis research.</li>`;
        }
      }

      const factsList = document.getElementById('detail-facts-list');
      if (factsList) {
        if (el.facts && el.facts.length > 0) {
          factsList.innerHTML = el.facts.map((f, i) => `
            <li class="fact-item">
              <span class="fact-item-icon"><i class="fas fa-atom"></i></span>
              <div>${f}</div>
            </li>
          `).join('');
        } else {
          factsList.innerHTML = `<li class="fact-item"><div>No unusual verified facts recorded.</div></li>`;
        }
      }

      this.setText('prop-melting-k', el.meltingPoint !== null ? `${el.meltingPoint} K` : 'N/A');
      this.setText('prop-melting-c', el.meltingPoint !== null ? `${window.ElementsDB.kelvinToCelsius(el.meltingPoint)} °C` : 'N/A');
      this.setText('prop-melting-f', el.meltingPoint !== null ? `${window.ElementsDB.kelvinToFahrenheit(el.meltingPoint)} °F` : 'N/A');

      this.setText('prop-boiling-k', el.boilingPoint !== null ? `${el.boilingPoint} K` : 'N/A');
      this.setText('prop-boiling-c', el.boilingPoint !== null ? `${window.ElementsDB.kelvinToCelsius(el.boilingPoint)} °C` : 'N/A');
      this.setText('prop-boiling-f', el.boilingPoint !== null ? `${window.ElementsDB.kelvinToFahrenheit(el.boilingPoint)} °F` : 'N/A');

      this.setText('prop-density', el.density !== null ? `${el.density} g/cm³` : 'N/A');
      this.setText('prop-phase-stp', el.state.toUpperCase());
      this.setText('prop-radioactive', el.radioactive ? 'Yes (Radioactive Isotope)' : 'No (Stable Primordial)');

      this.setText('prop-atomic-radius', el.atomicRadius ? `${el.atomicRadius} pm` : 'N/A');
      this.setText('prop-electronegativity', el.electronegativity ? `${el.electronegativity} Pauling` : 'N/A');
      this.setText('prop-ionization-energy', el.ionizationEnergy ? `${el.ionizationEnergy} kJ/mol` : 'N/A');
      this.setText('prop-oxidation-states', el.oxidationStates || '—');
      this.setText('prop-electron-config', el.electronConfiguration || '—');

      const shellsDisplay = el.shellElectrons ? el.shellElectrons.join(', ') : '—';
      this.setText('prop-shell-electrons', shellsDisplay);

      const isotopesBody = document.getElementById('isotopes-table-body');
      if (isotopesBody) {
        if (el.isotopes && el.isotopes.length > 0) {
          isotopesBody.innerHTML = el.isotopes.map(iso => `
            <tr>
              <td><strong>${el.symbol}-${iso.massNumber}</strong></td>
              <td>${iso.neutrons}</td>
              <td>${iso.abundance}</td>
              <td><span style="color:${iso.stability.includes('Stable') ? '#7CA891' : '#C4A265'}">${iso.stability}</span></td>
            </tr>
          `).join('');
        } else {
          isotopesBody.innerHTML = `<tr><td colspan="4" style="text-align:center;color:var(--text-muted);">No major isotopes cataloged.</td></tr>`;
        }
      }

      const conf = el.sourceConfidence || {};
      this.setConfidenceTag('conf-melting', conf.meltingPoint);
      this.setConfidenceTag('conf-boiling', conf.boilingPoint);
      this.setConfidenceTag('conf-density', conf.density);
      this.setConfidenceTag('conf-electroneg', conf.electronegativity);

      this.renderRelatedElements(el);

      return true;
    }

    setConfidenceTag(id, value) {
      const el = document.getElementById(id);
      if (!el) return;
      el.className = `confidence-tag ${value || 'theoretical'}`;
      el.textContent = value || 'estimated';
    }

    setText(id, text) {
      const el = document.getElementById(id);
      if (el) el.textContent = text !== null && text !== undefined ? text : '—';
    }

    renderRelatedElements(currentEl) {
      const container = document.getElementById('related-elements-grid');
      if (!container) return;

      const sameGroup = window.ElementsDB.all.filter(el => el.group && el.group === currentEl.group && el.atomicNumber !== currentEl.atomicNumber);
      const samePeriod = window.ElementsDB.all.filter(el => Math.abs(el.atomicNumber - currentEl.atomicNumber) <= 2 && el.atomicNumber !== currentEl.atomicNumber);

      const combined = [...sameGroup, ...samePeriod];
      const unique = Array.from(new Set(combined.map(e => e.atomicNumber)))
        .map(num => window.ElementsDB.get(num))
        .filter(Boolean)
        .slice(0, 8);

      container.innerHTML = unique.map(el => {
        const cat = window.ElementsDB.categories[el.category] || {};
        const relation = el.group === currentEl.group ? `Same Group (${el.group})` : `Period ${el.period}`;
        return `
          <a href="#details?z=${el.atomicNumber}" class="related-card" style="--cat-color: ${cat.color || 'var(--accent-cyan)'}">
            <span class="related-num">#${el.atomicNumber}</span>
            <span class="related-sym">${el.symbol}</span>
            <span class="related-name">${el.name}</span>
            <span class="related-relation">${relation}</span>
          </a>
        `;
      }).join('');
    }
  }

  window.ElementDetailsController = ElementDetailsController;

})(window);
