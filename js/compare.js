(function (window) {
  'use strict';

  class CompareController {
    constructor() {
      this.selectedElements = [null, null, null];

      this.metrics = [
        { section: 'Classification & General' },
        { label: 'Atomic Number', prop: 'atomicNumber', format: v => `#${v}` },
        { label: 'Category', prop: 'category', format: (v, el) => (window.ElementsDB.categories[v] || {}).name || v },
        { label: 'Period / Group', prop: 'period', format: (v, el) => `Period ${el.period}, Group ${el.group || '—'}` },
        { label: 'Block', prop: 'block', format: v => `${v}-block` },
        { label: 'Atomic Mass', prop: 'atomicWeight', format: v => `${v} u`, bar: true, max: 294 },

        { section: 'Atomic & Orbital Structure' },
        { label: 'Electron Config', prop: 'electronConfiguration', format: v => v || '—' },
        { label: 'Shell Electrons', prop: 'shellElectrons', format: v => (v ? v.join(', ') : '—') },
        { label: 'Electronegativity', prop: 'electronegativity', format: v => (v !== null ? `${v} Pauling` : 'N/A'), bar: true, max: 4.0 },
        { label: 'Atomic Radius', prop: 'atomicRadius', format: v => (v ? `${v} pm` : 'N/A'), bar: true, max: 300 },
        { label: 'Ionization Energy', prop: 'ionizationEnergy', format: v => (v ? `${Math.round(v)} kJ/mol` : 'N/A'), bar: true, max: 2400 },
        { label: 'Oxidation States', prop: 'oxidationStates', format: v => v || '—' },

        { section: 'Thermal & Physical Properties' },
        { label: 'Phase at STP', prop: 'state', format: v => v.toUpperCase() },
        { label: 'Melting Point', prop: 'meltingPoint', format: (v, el) => (v !== null ? `${Math.round(v)} K (${window.ElementsDB.kelvinToCelsius(v)} °C)` : 'N/A'), bar: true, max: 3700 },
        { label: 'Boiling Point', prop: 'boilingPoint', format: (v, el) => (v !== null ? `${Math.round(v)} K (${window.ElementsDB.kelvinToCelsius(v)} °C)` : 'N/A'), bar: true, max: 6200 },
        { label: 'Density', prop: 'density', format: v => (v !== null ? `${v} g/cm³` : 'N/A'), bar: true, max: 23 },

        { section: 'History & Occurrence' },
        { label: 'Occurrence', prop: 'occurrence', format: v => (v ? v.toUpperCase() : 'Primordial') },
        { label: 'Discoverer', prop: 'discoverer', format: v => v || 'Ancient / Prehistoric' },
        { label: 'Discovery Year', prop: 'discoveryYear', format: v => (v > 0 ? v : `${Math.abs(v)} BCE`) }
      ];

      this.init();
    }

    init() {
      this.bindSlotControls();
      this.bindPresets();
      this.setPreset([29, 47, 79]);
    }

    bindSlotControls() {
      for (let slotIdx = 0; slotIdx < 3; slotIdx++) {
        const input = document.getElementById(`slot-search-input-${slotIdx}`);
        const dropdown = document.getElementById(`slot-dropdown-${slotIdx}`);
        const clearBtn = document.getElementById(`slot-clear-btn-${slotIdx}`);

        if (input && dropdown) {
          input.addEventListener('input', (e) => {
            const query = e.target.value.trim();
            this.updateSlotDropdown(slotIdx, query, dropdown);
          });

          input.addEventListener('focus', () => {
            if (input.value.trim().length > 0) {
              dropdown.classList.add('show');
            }
          });

          document.addEventListener('click', (e) => {
            if (!input.contains(e.target) && !dropdown.contains(e.target)) {
              dropdown.classList.remove('show');
            }
          });
        }

        if (clearBtn) {
          clearBtn.addEventListener('click', () => {
            this.clearSlot(slotIdx);
          });
        }
      }
    }

    updateSlotDropdown(slotIdx, query, dropdown) {
      if (!query) {
        dropdown.classList.remove('show');
        dropdown.innerHTML = '';
        return;
      }

      const results = window.ElementsDB.filter({ query }).slice(0, 6);
      if (results.length === 0) {
        dropdown.innerHTML = `<div style="padding: 0.5rem 0.85rem; font-size: 0.8rem; color: var(--text-muted);">No elements found</div>`;
        dropdown.classList.add('show');
        return;
      }

      dropdown.innerHTML = results.map(el => {
        const cat = window.ElementsDB.categories[el.category] || {};
        return `
          <div class="slot-dropdown-item" data-number="${el.atomicNumber}">
            <span><strong>${el.symbol}</strong> — ${el.name}</span>
            <span style="font-size:0.75rem; color:${cat.color || 'var(--text-muted)'}">#${el.atomicNumber}</span>
          </div>
        `;
      }).join('');

      dropdown.querySelectorAll('.slot-dropdown-item').forEach(item => {
        item.addEventListener('click', () => {
          const num = Number(item.dataset.number);
          const el = window.ElementsDB.get(num);
          this.setSlotElement(slotIdx, el);
          dropdown.classList.remove('show');
          const input = document.getElementById(`slot-search-input-${slotIdx}`);
          if (input) input.value = '';
        });
      });

      dropdown.classList.add('show');
    }

    setSlotElement(slotIdx, element) {
      this.selectedElements[slotIdx] = element;
      this.renderSlotCard(slotIdx, element);
      this.renderComparisonTable();
    }

    clearSlot(slotIdx) {
      this.selectedElements[slotIdx] = null;
      this.renderSlotCard(slotIdx, null);
      this.renderComparisonTable();
    }

    renderSlotCard(slotIdx, element) {
      const card = document.getElementById(`slot-card-${slotIdx}`);
      const selectedDisplay = document.getElementById(`slot-selected-display-${slotIdx}`);
      const searchWrapper = document.getElementById(`slot-search-wrapper-${slotIdx}`);

      if (!card) return;

      if (!element) {
        card.classList.remove('active-slot');
        if (selectedDisplay) selectedDisplay.style.display = 'none';
        if (searchWrapper) searchWrapper.style.display = 'block';
        return;
      }

      card.classList.add('active-slot');
      if (searchWrapper) searchWrapper.style.display = 'none';

      if (selectedDisplay) {
        const cat = window.ElementsDB.categories[element.category] || {};
        selectedDisplay.style.display = 'flex';
        selectedDisplay.innerHTML = `
          <div class="slot-mini-badge" style="background:${cat.color || 'var(--accent-secondary)'}">
            <span class="slot-mini-sym">${element.symbol}</span>
            <span class="slot-mini-num">${element.atomicNumber}</span>
          </div>
          <div class="slot-element-meta">
            <span class="slot-element-name">${element.name}</span>
            <span class="slot-element-category" style="color:${cat.color || 'var(--accent-secondary)'}">${cat.name || element.category}</span>
          </div>
        `;
      }
    }

    bindPresets() {
      const presets = [
        { id: 'preset-coinage', elements: [29, 47, 79] },
        { id: 'preset-alkali', elements: [3, 11, 19] },
        { id: 'preset-halogens', elements: [9, 17, 35] },
        { id: 'preset-semiconductors', elements: [14, 32, 50] },
        { id: 'preset-refractory', elements: [73, 74, 75] }
      ];

      presets.forEach(p => {
        const btn = document.getElementById(p.id);
        if (btn) {
          btn.addEventListener('click', () => this.setPreset(p.elements));
        }
      });
    }

    setPreset(atomicNumbers) {
      atomicNumbers.forEach((num, idx) => {
        if (idx < 3) {
          const el = window.ElementsDB.get(num);
          this.setSlotElement(idx, el);
        }
      });
    }

    renderComparisonTable() {
      const thead = document.getElementById('comparison-thead');
      const tbody = document.getElementById('comparison-tbody');
      if (!thead || !tbody) return;

      const elements = this.selectedElements;

      let theadHtml = `
        <tr>
          <th>Property / Metric</th>
      `;

      elements.forEach((el, idx) => {
        if (el) {
          const cat = window.ElementsDB.categories[el.category] || {};
          theadHtml += `
            <th class="comp-header-cell">
              <div style="display:flex;align-items:center;gap:8px;">
                <span style="display:inline-block;width:12px;height:12px;border-radius:50%;background:${cat.color}"></span>
                <span>${el.name} (${el.symbol})</span>
              </div>
            </th>
          `;
        } else {
          theadHtml += `
            <th class="comp-header-cell" style="color:var(--text-muted);font-weight:400;">
              Slot ${idx + 1} (Empty)
            </th>
          `;
        }
      });

      theadHtml += `</tr>`;
      thead.innerHTML = theadHtml;

      let tbodyHtml = '';

      this.metrics.forEach(metric => {
        if (metric.section) {
          tbodyHtml += `
            <tr class="comp-section-row">
              <td colspan="4">${metric.section}</td>
            </tr>
          `;
          return;
        }

        tbodyHtml += `
          <tr>
            <td>
              <span class="comp-prop-name">${metric.label}</span>
            </td>
        `;

        elements.forEach(el => {
          if (!el) {
            tbodyHtml += `<td class="comp-val-cell" style="color:var(--text-muted);">—</td>`;
            return;
          }

          const rawVal = el[metric.prop];
          const formatted = metric.format(rawVal, el);

          let barHtml = '';
          if (metric.bar && typeof rawVal === 'number' && metric.max) {
            const pct = Math.min(100, Math.max(3, (rawVal / metric.max) * 100));
            barHtml = `
              <div class="comp-bar-container">
                <div class="comp-bar-fill" style="width: ${pct}%;"></div>
              </div>
            `;
          }

          tbodyHtml += `
            <td class="comp-val-cell">
              <div>${formatted}</div>
              ${barHtml}
            </td>
          `;
        });

        tbodyHtml += `</tr>`;
      });

      tbody.innerHTML = tbodyHtml;
    }
  }

  window.CompareController = CompareController;

})(window);
