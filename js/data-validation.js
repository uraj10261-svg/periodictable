(function () {
  'use strict';

  function validatePeriodicDataset() {
    console.group('🔬 ELEMENTA Scientific Data Validation Suite');
    const errors = [];
    const warnings = [];

    const elements = window.ELEMENTS_DATA || [];

    if (elements.length !== 118) {
      errors.push(`Expected exactly 118 elements, but found ${elements.length}.`);
    } else {
      console.log(`✓ Total element count matches requirement: 118 elements.`);
    }

    const seenNumbers = new Set();
    const seenSymbols = new Set();
    const seenNames = new Set();

    elements.forEach((el, index) => {
      const label = el.symbol ? `Element ${el.atomicNumber || index + 1} (${el.symbol})` : `Element at index ${index}`;

      if (typeof el.atomicNumber !== 'number' || el.atomicNumber < 1 || el.atomicNumber > 118) {
        errors.push(`${label}: Invalid atomicNumber "${el.atomicNumber}". Must be integer 1-118.`);
      } else if (seenNumbers.has(el.atomicNumber)) {
        errors.push(`${label}: Duplicate atomicNumber ${el.atomicNumber} detected.`);
      } else {
        seenNumbers.add(el.atomicNumber);
      }

      if (!el.symbol || typeof el.symbol !== 'string' || !/^[A-Z][a-z]?$/.test(el.symbol)) {
        errors.push(`${label}: Malformed chemical symbol "${el.symbol}". Must be 1-2 letters.`);
      } else if (seenSymbols.has(el.symbol)) {
        errors.push(`${label}: Duplicate chemical symbol "${el.symbol}".`);
      } else {
        seenSymbols.add(el.symbol);
      }

      if (!el.name || typeof el.name !== 'string' || el.name.trim().length === 0) {
        errors.push(`${label}: Missing or invalid name.`);
      } else if (seenNames.has(el.name.toLowerCase())) {
        errors.push(`${label}: Duplicate element name "${el.name}".`);
      } else {
        seenNames.add(el.name.toLowerCase());
      }

      if (typeof el.period !== 'number' || el.period < 1 || el.period > 7) {
        errors.push(`${label}: Invalid period "${el.period}". Must be integer 1-7.`);
      }

      const isLanthanide = el.atomicNumber >= 57 && el.atomicNumber <= 71;
      const isActinide = el.atomicNumber >= 89 && el.atomicNumber <= 103;

      if (!isLanthanide && !isActinide) {
        if (typeof el.group !== 'number' || el.group < 1 || el.group > 18) {
          errors.push(`${label}: Standard element must have group 1-18, got "${el.group}".`);
        }
      }

      const validBlocks = ['s', 'p', 'd', 'f'];
      if (!validBlocks.includes(el.block)) {
        errors.push(`${label}: Invalid block "${el.block}". Must be s, p, d, or f.`);
      }

      if (Array.isArray(el.shellElectrons)) {
        const totalElectrons = el.shellElectrons.reduce((acc, count) => acc + count, 0);
        if (totalElectrons !== el.atomicNumber) {
          errors.push(`${label}: Shell electrons sum (${totalElectrons}) does not equal atomic number (${el.atomicNumber})! Shells: [${el.shellElectrons.join(', ')}]`);
        }
      } else {
        errors.push(`${label}: Missing shellElectrons array.`);
      }

      if (typeof el.meltingPoint === 'number' && typeof el.boilingPoint === 'number') {
        if (el.meltingPoint > el.boilingPoint && el.atomicNumber !== 33) { // Arsenic sublimes
          warnings.push(`${label}: Melting point (${el.meltingPoint}K) is higher than boiling point (${el.boilingPoint}K).`);
        }
      }

      if (!Array.isArray(el.facts) || el.facts.length < 1) {
        warnings.push(`${label}: Missing curated educational facts.`);
      }
    });

    for (let i = 1; i <= 118; i++) {
      if (!seenNumbers.has(i)) {
        errors.push(`Missing atomic number ${i} from dataset.`);
      }
    }

    const report = {
      isValid: errors.length === 0,
      totalElements: elements.length,
      errorsCount: errors.length,
      warningsCount: warnings.length,
      errors: errors,
      warnings: warnings
    };

    if (errors.length === 0) {
      console.log('✅ ALL 118 ELEMENTS VALIDATED SUCCESSFULLY: Zero errors detected!');
      if (warnings.length > 0) {
        console.warn(`⚠️ ${warnings.length} scientific caveats noted:`, warnings);
      }
    } else {
      console.error(`❌ Validation failed with ${errors.length} errors:`, errors);
    }

    console.groupEnd();
    return report;
  }

  if (typeof window !== 'undefined') {
    window.validatePeriodicDataset = validatePeriodicDataset;
  }
})();
