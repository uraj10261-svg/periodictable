(function () {
  'use strict';

  const part1 = (typeof window !== 'undefined' && window.ELEMENTS_PART_1) ? window.ELEMENTS_PART_1 : [];
  const part2 = (typeof window !== 'undefined' && window.ELEMENTS_PART_2) ? window.ELEMENTS_PART_2 : [];
  const part3 = (typeof window !== 'undefined' && window.ELEMENTS_PART_3) ? window.ELEMENTS_PART_3 : [];

  const allElements = [...part1, ...part2, ...part3];

  const byAtomicNumber = new Map();
  const bySymbol = new Map();
  const byName = new Map();

  allElements.forEach(el => {
    byAtomicNumber.set(el.atomicNumber, el);
    bySymbol.set(el.symbol.toUpperCase(), el);
    byName.set(el.name.toLowerCase(), el);
  });

  const CATEGORIES = {
    'alkali-metal': { label: 'Alkali Metal', colorVar: '--cat-alkali' },
    'alkaline-earth-metal': { label: 'Alkaline Earth Metal', colorVar: '--cat-alkaline' },
    'transition-metal': { label: 'Transition Metal', colorVar: '--cat-transition' },
    'post-transition-metal': { label: 'Post-transition Metal', colorVar: '--cat-post-transition' },
    'metalloid': { label: 'Metalloid', colorVar: '--cat-metalloid' },
    'reactive-nonmetal': { label: 'Reactive Nonmetal', colorVar: '--cat-reactive-nonmetal' },
    'halogen': { label: 'Halogen', colorVar: '--cat-halogen' },
    'noble-gas': { label: 'Noble Gas', colorVar: '--cat-noble' },
    'lanthanide': { label: 'Lanthanide', colorVar: '--cat-lanthanide' },
    'actinide': { label: 'Actinide', colorVar: '--cat-actinide' },
    'unknown': { label: 'Unknown Properties', colorVar: '--cat-unknown' }
  };

  const ElementAPI = {
    getAll: () => allElements,
    count: () => allElements.length,
    getByNumber: (num) => byAtomicNumber.get(Number(num)),
    getBySymbol: (sym) => sym ? bySymbol.get(sym.trim().toUpperCase()) : undefined,
    getByName: (name) => name ? byName.get(name.trim().toLowerCase()) : undefined,
    getCategories: () => CATEGORIES,

    search: (query) => {
      if (!query || !query.trim()) return [];
      const q = query.trim().toLowerCase();
      const numQuery = parseInt(q, 10);

      return allElements.filter(el => {
        if (!isNaN(numQuery) && el.atomicNumber === numQuery) return true;
        if (el.symbol.toLowerCase() === q) return true;
        if (el.symbol.toLowerCase().startsWith(q)) return true;
        if (el.name.toLowerCase().startsWith(q)) return true;
        if (el.name.toLowerCase().includes(q)) return true;
        return false;
      });
    },

    getPropertyStats: (propName) => {
      const values = allElements
        .map(el => el[propName])
        .filter(v => typeof v === 'number' && !isNaN(v));

      if (values.length === 0) return { min: 0, max: 0, count: 0 };
      return {
        min: Math.min(...values),
        max: Math.max(...values),
        count: values.length
      };
    }
  };

  if (typeof window !== 'undefined') {
    window.ELEMENTS_DATA = allElements;
    window.ELEMENT_API = ElementAPI;
    window.ELEMENT_CATEGORIES = CATEGORIES;
  }
})();
