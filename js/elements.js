(function (window) {
  'use strict';

  const part1 = window.ELEMENTS_PART_1 || [];
  const part2 = window.ELEMENTS_PART_2 || [];
  const part3 = window.ELEMENTS_PART_3 || [];

  const ALL_ELEMENTS = [...part1, ...part2, ...part3].sort((a, b) => a.atomicNumber - b.atomicNumber);

  const BY_NUMBER = new Map();
  const BY_SYMBOL = new Map();
  const BY_NAME = new Map();

  ALL_ELEMENTS.forEach(el => {
    BY_NUMBER.set(el.atomicNumber, el);
    BY_SYMBOL.set(el.symbol.toLowerCase(), el);
    BY_NAME.set(el.name.toLowerCase(), el);
  });

  const CATEGORIES = {
    'alkali-metal': {
      id: 'alkali-metal',
      name: 'Alkali Metals',
      color: '#5A4433',
      glow: 'none',
      description: 'Highly reactive Group 1 metals with one valence electron that react vigorously with water.'
    },
    'alkaline-earth-metal': {
      id: 'alkaline-earth-metal',
      name: 'Alkaline Earth Metals',
      color: '#4B4A32',
      glow: 'none',
      description: 'Reactive Group 2 divalent metals with two s-electrons forming alkaline hydroxides.'
    },
    'transition-metal': {
      id: 'transition-metal',
      name: 'Transition Metals',
      color: '#2C4358',
      glow: 'none',
      description: 'd-block elements with partially filled d-orbitals exhibiting variable oxidation states.'
    },
    'post-transition-metal': {
      id: 'post-transition-metal',
      name: 'Post-Transition Metals',
      color: '#39454A',
      glow: 'none',
      description: 'Soft metals located between transition metals and metalloids with higher electronegativity.'
    },
    'metalloid': {
      id: 'metalloid',
      name: 'Metalloids',
      color: '#66502D',
      glow: 'none',
      description: 'Elements with intermediate properties between metals and nonmetals; foundational semiconductors.'
    },
    'reactive-nonmetal': {
      id: 'reactive-nonmetal',
      name: 'Reactive Nonmetals',
      color: '#623C39',
      glow: 'none',
      description: 'Electronegative nonmetals essential to organic chemistry and atmospheric gases.'
    },
    'halogen': {
      id: 'halogen',
      name: 'Halogens',
      color: '#294A3A',
      glow: 'none',
      description: 'Group 17 highly reactive salt-forming nonmetals requiring one electron to complete their octet.'
    },
    'noble-gas': {
      id: 'noble-gas',
      name: 'Noble Gases',
      color: '#3E4A50',
      glow: 'none',
      description: 'Group 18 colorless, odorless, extremely unreactive gases with full valence electron shells.'
    },
    'lanthanide': {
      id: 'lanthanide',
      name: 'Lanthanides',
      color: '#51405F',
      glow: 'none',
      description: '15 rare-earth metallic elements (La-Lu) filling 4f orbitals with distinctive magnetic & optical traits.'
    },
    'actinide': {
      id: 'actinide',
      name: 'Actinides',
      color: '#51405F',
      glow: 'none',
      description: '15 radioactive heavy elements (Ac-Lr) filling 5f orbitals; includes nuclear fuels uranium and plutonium.'
    },
    'unknown': {
      id: 'unknown',
      name: 'Unknown',
      color: '#343D42',
      glow: 'none',
      description: 'Superheavy synthetic elements with unconfirmed experimental chemical characterization.'
    }
  };

  const HEATMAP_PROPERTIES = {
    electronegativity: {
      key: 'electronegativity',
      name: 'Electronegativity',
      unit: 'Pauling',
      min: 0.79,
      max: 3.98,
      format: v => (v !== null ? v.toFixed(2) : 'N/A')
    },
    atomicRadius: {
      key: 'atomicRadius',
      name: 'Atomic Radius',
      unit: 'pm',
      min: 31,
      max: 298,
      format: v => (v !== null ? `${v} pm` : 'N/A')
    },
    ionizationEnergy: {
      key: 'ionizationEnergy',
      name: 'Ionization Energy',
      unit: 'kJ/mol',
      min: 375.7,
      max: 2372.3,
      format: v => (v !== null ? `${Math.round(v)} kJ/mol` : 'N/A')
    },
    density: {
      key: 'density',
      name: 'Density',
      unit: 'g/cm³',
      min: 0.00008988,
      max: 22.59,
      format: v => {
        if (v === null) return 'N/A';
        if (v < 0.01) return `${v.toExponential(2)} g/cm³`;
        return `${v.toFixed(2)} g/cm³`;
      }
    },
    meltingPoint: {
      key: 'meltingPoint',
      name: 'Melting Point',
      unit: 'K',
      min: 0.95,
      max: 3695.0,
      format: v => (v !== null ? `${Math.round(v)} K` : 'N/A')
    },
    boilingPoint: {
      key: 'boilingPoint',
      name: 'Boiling Point',
      unit: 'K',
      min: 4.22,
      max: 6203.0,
      format: v => (v !== null ? `${Math.round(v)} K` : 'N/A')
    },
    atomicWeight: {
      key: 'atomicWeight',
      name: 'Atomic Weight',
      unit: 'u',
      min: 1.008,
      max: 294.0,
      format: v => (typeof v === 'number' ? v.toFixed(2) : String(v))
    }
  };

  function getStateAtTemperature(element, tempKelvin) {
    if (typeof tempKelvin !== 'number' || isNaN(tempKelvin)) {
      return element.state || 'unknown';
    }

    const mp = element.meltingPoint;
    const bp = element.boilingPoint;

    if (mp === null && bp === null) {
      return element.state || 'unknown';
    }

    if (bp !== null && tempKelvin >= bp) {
      return 'gas';
    }

    if (mp !== null && tempKelvin >= mp) {
      if (bp !== null && tempKelvin < bp) {
        return 'liquid';
      }
      return 'liquid';
    }

    if (mp !== null && tempKelvin < mp) {
      return 'solid';
    }

    return element.state || 'unknown';
  }

  function kelvinToCelsius(k) {
    return k === null ? null : +(k - 273.15).toFixed(2);
  }

  function kelvinToFahrenheit(k) {
    return k === null ? null : +(k * 1.8 - 459.67).toFixed(2);
  }

  function getHeatmapColor(value, propKey) {
    const config = HEATMAP_PROPERTIES[propKey];
    if (!config || value === null || value === undefined) return null;

    const num = Number(value);
    if (isNaN(num)) return null;

    let norm = (num - config.min) / (config.max - config.min);
    if (propKey === 'density') {
      const minLog = Math.log10(config.min + 0.0001);
      const maxLog = Math.log10(config.max + 0.0001);
      const valLog = Math.log10(num + 0.0001);
      norm = (valLog - minLog) / (maxLog - minLog);
    }

    norm = Math.max(0, Math.min(1, norm));

    const stops = [
      { p: 0.0, r: 44, g: 67, b: 88 },
      { p: 0.33, r: 57, g: 69, b: 74 },
      { p: 0.66, r: 102, g: 80, b: 45 },
      { p: 1.0, r: 98, g: 60, b: 57 }
    ];

    let c1 = stops[0];
    let c2 = stops[stops.length - 1];

    for (let i = 0; i < stops.length - 1; i++) {
      if (norm >= stops[i].p && norm <= stops[i + 1].p) {
        c1 = stops[i];
        c2 = stops[i + 1];
        break;
      }
    }

    const t = (norm - c1.p) / (c2.p - c1.p || 1);
    const r = Math.round(c1.r + t * (c2.r - c1.r));
    const g = Math.round(c1.g + t * (c2.g - c1.g));
    const b = Math.round(c1.b + t * (c2.b - c1.b));

    return {
      css: `rgb(${r}, ${g}, ${b})`,
      contrastText: '#F1F0E9',
      normalized: norm
    };
  }

  function filterElements({ query = '', category = null, state = null, block = null, period = null, group = null }) {
    const q = query.trim().toLowerCase();

    return ALL_ELEMENTS.filter(el => {
      if (q) {
        const matchNum = el.atomicNumber.toString() === q;
        const matchSym = el.symbol.toLowerCase().startsWith(q) || el.symbol.toLowerCase() === q;
        const matchName = el.name.toLowerCase().includes(q);
        if (!matchNum && !matchSym && !matchName) return false;
      }

      if (category && el.category !== category) return false;
      if (state && el.state !== state) return false;
      if (block && el.block !== block) return false;
      if (period && el.period !== Number(period)) return false;
      if (group && el.group !== Number(group)) return false;

      return true;
    });
  }

  window.ElementsDB = {
    all: ALL_ELEMENTS,
    categories: CATEGORIES,
    heatmapProperties: HEATMAP_PROPERTIES,
    get: query => {
      if (typeof query === 'number') return BY_NUMBER.get(query);
      if (!query) return null;
      const str = String(query).trim().toLowerCase();
      const num = parseInt(str, 10);
      if (!isNaN(num) && BY_NUMBER.has(num)) return BY_NUMBER.get(num);
      return BY_SYMBOL.get(str) || BY_NAME.get(str) || null;
    },
    getStateAtTemperature,
    kelvinToCelsius,
    kelvinToFahrenheit,
    getHeatmapColor,
    filter: filterElements
  };

})(window);
