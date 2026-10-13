(function () {
  'use strict';

  const SHELL_NAMES = ['K', 'L', 'M', 'N', 'O', 'P', 'Q'];

  class AtomicBohrModel {
    constructor(containerId = 'bohrContainer') {
      this.container = null;
      this.containerId = containerId;
      this.currentElement = null;
      this.isPaused = false;
      this.speedMultiplier = 1;
      this.animationFrameId = null;
      this.orbitAngles = [];
      this.reducedMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    }

    render(element) {
      this.currentElement = element;
      this.container = document.getElementById(this.containerId);
      if (!this.container || !element) return;

      if (this.animationFrameId) {
        cancelAnimationFrame(this.animationFrameId);
      }

      const shells = element.shellElectrons || [element.atomicNumber];
      const shellCount = shells.length;
      this.orbitAngles = new Array(shellCount).fill(0);

      const size = 440;
      const center = size / 2;
      const nucleusRadius = 24;
      const maxOrbitRadius = (size / 2) - 22;
      const orbitSpacing = shellCount > 1 
        ? (maxOrbitRadius - nucleusRadius - 15) / (shellCount - 1)
        : 40;

      let svgHTML = `
        <svg class="bohr-svg" viewBox="0 0 ${size} ${size}" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <radialGradient id="nucleusGrad" cx="35%" cy="35%" r="65%">
              <stop offset="0%" stop-color="#2C4358"/>
              <stop offset="70%" stop-color="#20272C"/>
              <stop offset="100%" stop-color="#171C20"/>
            </radialGradient>
          </defs>

          <circle cx="${center}" cy="${center}" r="${maxOrbitRadius + 10}" fill="none" stroke="#343D42" stroke-width="1"/>
      `;

      shells.forEach((electronCount, shellIdx) => {
        const radius = nucleusRadius + 18 + (shellIdx * orbitSpacing);
        const shellName = SHELL_NAMES[shellIdx] || `n=${shellIdx + 1}`;

        svgHTML += `
          <g class="bohr-shell-group" data-shell="${shellIdx}">
            <circle class="bohr-orbit-ring" cx="${center}" cy="${center}" r="${radius}" 
                    fill="none" stroke="#343D42" stroke-dasharray="3 3" stroke-width="1.2"/>
            
            <text x="${center}" y="${center - radius - 4}" 
                  font-family="var(--font-mono)" font-size="9" fill="#A8B2B6" 
                  text-anchor="middle" font-weight="600">${shellName}</text>
            
            <g class="bohr-electrons-layer" id="bohrShellLayer${shellIdx}">
        `;

        for (let e = 0; e < electronCount; e++) {
          const baseAngle = (e / electronCount) * 2 * Math.PI;
          const ex = center + radius * Math.cos(baseAngle);
          const ey = center + radius * Math.sin(baseAngle);

          svgHTML += `
            <circle cx="${ex}" cy="${ey}" r="4.5" fill="#A8B2B6" stroke="#171C20" stroke-width="1" class="bohr-electron"/>
          `;
        }

        svgHTML += `
            </g>
          </g>
        `;
      });

      svgHTML += `
          <circle cx="${center}" cy="${center}" r="${nucleusRadius}" fill="url(#nucleusGrad)" 
                  stroke="#343D42" stroke-width="1.5"/>
          <text x="${center}" y="${center + 5}" font-family="var(--font-display)" font-size="16" 
                font-weight="800" fill="#F1F0E9" text-anchor="middle">${element.symbol}</text>
          <text x="${center}" y="${center + 16}" font-family="var(--font-mono)" font-size="8.5" 
                font-weight="700" fill="#A8B2B6" text-anchor="middle">${element.atomicNumber}p⁺</text>
        </svg>
      `;

      this.container.innerHTML = svgHTML;

      const pillsContainer = document.getElementById('bohrShellPills');
      if (pillsContainer) {
        pillsContainer.innerHTML = shells.map((count, idx) => {
          const sName = SHELL_NAMES[idx] || `n=${idx + 1}`;
          return `<span class="shell-pill"><strong>${sName}:</strong> ${count} e⁻</span>`;
        }).join('');
      }

      if (!this.reducedMotion && !this.isPaused) {
        this.startAnimation(center);
      }
    }

    startAnimation(center) {
      let lastTime = performance.now();

      const animate = (currentTime) => {
        const delta = (currentTime - lastTime) / 1000;
        lastTime = currentTime;

        if (!this.isPaused && this.currentElement) {
          const shells = this.currentElement.shellElectrons || [];

          shells.forEach((_, idx) => {
            const speed = (0.45 / (idx + 1)) * this.speedMultiplier;
            const direction = idx % 2 === 0 ? 1 : -1;
            this.orbitAngles[idx] += speed * direction * delta * (180 / Math.PI);

            const layer = document.getElementById(`bohrShellLayer${idx}`);
            if (layer) {
              layer.setAttribute('transform', `rotate(${this.orbitAngles[idx]}, ${center}, ${center})`);
            }
          });
        }

        this.animationFrameId = requestAnimationFrame(animate);
      };

      this.animationFrameId = requestAnimationFrame(animate);
    }

    togglePause() {
      this.isPaused = !this.isPaused;
      const pauseBtn = document.getElementById('bohrPauseBtn');
      if (pauseBtn) {
        pauseBtn.innerHTML = this.isPaused
          ? `<svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><polygon points="5 3 19 12 5 21 5 3"/></svg> Resume`
          : `<svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><rect x="6" y="4" width="4" height="16"/><rect x="14" y="4" width="4" height="16"/></svg> Pause`;
      }
    }

    setSpeed(multiplier) {
      this.speedMultiplier = multiplier;
    }
  }

  window.AtomicBohrModel = AtomicBohrModel;
})();
