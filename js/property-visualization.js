(function () {
  'use strict';

  const PROPERTIES = {
    'none': { label: 'Category Colors', unit: '' },
    'atomicWeight': { label: 'Atomic Mass', unit: 'u', log: false },
    'density': { label: 'Density', unit: 'g/cm³', log: true },
    'meltingPoint': { label: 'Melting Point', unit: 'K', log: false },
    'boilingPoint': { label: 'Boiling Point', unit: 'K', log: false },
    'electronegativity': { label: 'Electronegativity', unit: 'Pauling', log: false },
    'atomicRadius': { label: 'Atomic Radius', unit: 'pm', log: false },
    'ionizationEnergy': { label: 'First Ionization Energy', unit: 'kJ/mol', log: false }
  };

  class PropertyVisualizer {
    constructor() {
      this.currentProperty = 'none';
      this.init();
    }

    init() {
      document.addEventListener('DOMContentLoaded', () => {
        const select = document.querySelector('#propertyVisualSelect');
        if (select) {
          select.addEventListener('change', (e) => {
            this.setProperty(e.target.value);
          });
        }
      });
    }

    setProperty(propKey) {
      this.currentProperty = propKey;
      const elements = window.ELEMENTS_DATA || [];
      const legendContainer = document.querySelector('.heatmap-legend-container');
      const catLegend = document.querySelector('.category-legend');

      if (propKey === 'none') {
        elements.forEach(el => {
          const tile = document.querySelector(`.element-tile[data-symbol="${el.symbol}"]`);
          if (!tile) return;
          tile.style.removeProperty('background');
          tile.style.removeProperty('--cat-color');
          tile.classList.remove('heatmap-active', 'heatmap-na');
        });

        if (legendContainer) legendContainer.classList.remove('active');
        if (catLegend) catLegend.style.display = 'flex';
        return;
      }

      if (catLegend) catLegend.style.display = 'none';
      if (legendContainer) legendContainer.classList.add('active');

      const propDef = PROPERTIES[propKey];
      const validElements = elements.filter(el => typeof el[propKey] === 'number' && !isNaN(el[propKey]));

      if (validElements.length === 0) return;

      const rawValues = validElements.map(el => el[propKey]);
      const minVal = Math.min(...rawValues);
      const maxVal = Math.max(...rawValues);

      const nameEl = document.querySelector('#heatmapPropName');
      const unitEl = document.querySelector('#heatmapPropUnit');
      const minEl = document.querySelector('#heatmapMinVal');
      const maxEl = document.querySelector('#heatmapMaxVal');

      if (nameEl) nameEl.textContent = propDef.label;
      if (unitEl) unitEl.textContent = propDef.unit ? `(${propDef.unit})` : '';
      if (minEl) minEl.textContent = `${minVal.toLocaleString()} ${propDef.unit}`;
      if (maxEl) maxEl.textContent = `${maxVal.toLocaleString()} ${propDef.unit}`;

      elements.forEach(el => {
        const tile = document.querySelector(`.element-tile[data-symbol="${el.symbol}"]`);
        if (!tile) return;

        const val = el[propKey];
        if (typeof val !== 'number' || isNaN(val)) {
          tile.classList.remove('heatmap-active');
          tile.classList.add('heatmap-na');
          tile.style.background = 'var(--surface-elevated, #20272C)';
          tile.style.setProperty('--cat-color', '#343D42');
          return;
        }

        tile.classList.add('heatmap-active');
        tile.classList.remove('heatmap-na');

        let norm;
        if (propDef.log && minVal > 0 && val > 0) {
          norm = (Math.log(val) - Math.log(minVal)) / (Math.log(maxVal) - Math.log(minVal));
        } else {
          norm = (val - minVal) / (maxVal - minVal || 1);
        }
        norm = Math.max(0, Math.min(1, norm));

        const color = this.getHeatmapColor(norm);
        tile.style.background = color.bg;
        tile.style.setProperty('--cat-color', color.accent);
      });
    }

    getHeatmapColor(t) {
      let r, g, b;
      if (t < 0.33) {
        const sub = t / 0.33;
        r = Math.round(44 + (57 - 44) * sub);
        g = Math.round(67 + (69 - 67) * sub);
        b = Math.round(88 + (74 - 88) * sub);
      } else if (t < 0.66) {
        const sub = (t - 0.33) / 0.33;
        r = Math.round(57 + (102 - 57) * sub);
        g = Math.round(69 + (80 - 69) * sub);
        b = Math.round(74 + (45 - 74) * sub);
      } else {
        const sub = (t - 0.66) / 0.34;
        r = Math.round(102 + (98 - 102) * sub);
        g = Math.round(80 + (60 - 80) * sub);
        b = Math.round(45 + (57 - 45) * sub);
      }

      return {
        bg: `rgba(${r}, ${g}, ${b}, 0.55)`,
        accent: `rgb(${r}, ${g}, ${b})`
      };
    }
  }

  window.propertyVisualizer = new PropertyVisualizer();
})();
