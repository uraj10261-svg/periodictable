(function (window) {
  'use strict';

  class BohrModel {
    constructor(containerId, options = {}) {
      this.container = typeof containerId === 'string' ? document.getElementById(containerId) : containerId;
      this.options = Object.assign({
        width: 420,
        height: 420,
        baseRadius: 42,
        radiusStep: 22,
        electronRadius: 3.8,
        speedMultiplier: 1.0,
        isPaused: false
      }, options);

      this.currentElement = null;
      this.animationFrameId = null;
      this.rotationAngles = [];
    }

    render(element) {
      if (!this.container || !element) return;
      this.currentElement = element;
      this.stopAnimation();

      const shells = element.shellElectrons && element.shellElectrons.length > 0
        ? element.shellElectrons
        : [1];

      this.rotationAngles = new Array(shells.length).fill(0);

      const size = this.options.width;
      const center = size / 2;
      const shellCount = shells.length;

      const maxAvailableRadius = center - 20;
      const radiusStep = Math.min(this.options.radiusStep, (maxAvailableRadius - this.options.baseRadius) / Math.max(1, shellCount));

      const weight = typeof element.atomicWeight === 'number' ? Math.round(element.atomicWeight) : parseInt(element.atomicWeight, 10) || element.atomicNumber * 2;
      const neutrons = Math.max(0, weight - element.atomicNumber);

      let svgHtml = `
        <svg class="bohr-svg" viewBox="0 0 ${size} ${size}" width="100%" height="100%" role="img" aria-label="Bohr Model of ${element.name}">
          <defs>
            <radialGradient id="nucleus-glow" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stop-color="var(--cat-color, #2C4358)" stop-opacity="1" />
              <stop offset="70%" stop-color="#20272C" stop-opacity="0.9" />
              <stop offset="100%" stop-color="#171C20" stop-opacity="1" />
            </radialGradient>
          </defs>

          <circle cx="${center}" cy="${center}" r="${this.options.baseRadius + shellCount * radiusStep + 8}" 
            fill="none" stroke="var(--border-subtle, #343D42)" stroke-dasharray="2, 6" />

          <g id="bohr-shells-group">
      `;

      shells.forEach((electronCount, shellIdx) => {
        const shellRadius = this.options.baseRadius + (shellIdx + 1) * radiusStep;
        const shellLetter = ['K', 'L', 'M', 'N', 'O', 'P', 'Q'][shellIdx] || `S${shellIdx + 1}`;

        svgHtml += `
          <circle class="bohr-orbit-ring" data-shell="${shellIdx}" 
            cx="${center}" cy="${center}" r="${shellRadius}" 
            fill="none" stroke="var(--border-subtle, #343D42)" stroke-width="1.2" stroke-dasharray="3, 3" />
          
          <g id="bohr-electrons-shell-${shellIdx}" class="bohr-electrons-shell" data-shell="${shellIdx}">
        `;

        for (let e = 0; e < electronCount; e++) {
          const angle = (2 * Math.PI * e) / electronCount;
          const ex = center + shellRadius * Math.cos(angle);
          const ey = center + shellRadius * Math.sin(angle);

          svgHtml += `
            <circle class="bohr-electron" cx="${ex}" cy="${ey}" r="${this.options.electronRadius}" 
              fill="#A8B2B6" stroke="#171C20" stroke-width="1" />
          `;
        }

        svgHtml += `</g>`;
      });

      svgHtml += `
          </g>

          <g id="bohr-nucleus" transform="translate(${center}, ${center})">
            <circle cx="0" cy="0" r="${this.options.baseRadius - 4}" fill="url(#nucleus-glow)" />
            <circle cx="0" cy="0" r="${this.options.baseRadius - 4}" fill="none" stroke="var(--border-subtle, #343D42)" stroke-width="1.5" />
            <text x="0" y="-8" text-anchor="middle" font-family="var(--font-display, Inter, sans-serif)" font-size="18" font-weight="800" fill="#F1F0E9">${element.symbol}</text>
            <text x="0" y="8" text-anchor="middle" font-family="var(--font-mono, monospace)" font-size="9" font-weight="600" fill="#A8B2B6">${element.atomicNumber}p⁺ / ${neutrons}n⁰</text>
            <text x="0" y="20" text-anchor="middle" font-family="var(--font-mono, monospace)" font-size="8" font-weight="500" fill="#687176">Z = ${element.atomicNumber}</text>
          </g>
        </svg>
      `;

      this.container.innerHTML = svgHtml;

      this.updateShellPills(shells);
      this.startAnimation(center, shells, radiusStep);
    }

    startAnimation(center, shells, radiusStep) {
      if (this.options.isPaused) return;

      const electronGroups = shells.map((_, idx) => {
        return {
          group: this.container.querySelector(`#bohr-electrons-shell-${idx}`),
          radius: this.options.baseRadius + (idx + 1) * radiusStep,
          count: shells[idx],
          speed: (1.2 / Math.sqrt(idx + 1)) * (idx % 2 === 0 ? 1 : -0.85) * this.options.speedMultiplier
        };
      });

      let lastTime = performance.now();

      const animate = (currentTime) => {
        const delta = (currentTime - lastTime) / 1000;
        lastTime = currentTime;

        if (!this.options.isPaused) {
          electronGroups.forEach((eg, idx) => {
            if (!eg.group) return;
            this.rotationAngles[idx] = (this.rotationAngles[idx] + eg.speed * delta * 45) % 360;
            eg.group.setAttribute('transform', `rotate(${this.rotationAngles[idx]}, ${center}, ${center})`);
          });
        }

        this.animationFrameId = requestAnimationFrame(animate);
      };

      this.animationFrameId = requestAnimationFrame(animate);
    }

    stopAnimation() {
      if (this.animationFrameId) {
        cancelAnimationFrame(this.animationFrameId);
        this.animationFrameId = null;
      }
    }

    setPaused(paused) {
      this.options.isPaused = !!paused;
    }

    togglePause() {
      this.options.isPaused = !this.options.isPaused;
      return this.options.isPaused;
    }

    setSpeed(mult) {
      this.options.speedMultiplier = Math.max(0.2, Math.min(3.0, Number(mult) || 1.0));
    }

    updateShellPills(shells) {
      const pillsContainer = document.getElementById('bohr-shell-pills-container');
      if (!pillsContainer) return;

      const shellLetters = ['K', 'L', 'M', 'N', 'O', 'P', 'Q'];
      pillsContainer.innerHTML = shells.map((count, idx) => `
        <span class="shell-pill" title="Principal quantum number n=${idx + 1}">
          ${shellLetters[idx] || `n${idx + 1}`}: <strong>${count}e⁻</strong>
        </span>
      `).join('');
    }
  }

  window.BohrModel = BohrModel;

})(window);
