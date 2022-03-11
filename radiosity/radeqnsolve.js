import Spectra from './spectra.js';

const MIN_VALUE = 1e-10;

export default class RadEqnSolve {
  constructor() {
    this.totalFlux = 0;              // Total environment flux
    this.totalUnsent = 0;            // Total unsent exitence
    this.stepCount = 0;              // Step count
    this.maxStep = 10000;            // Maximum number of steps
    this.maxTime = this.maxStep;     // maximum for animation purposes
    this.stopCriterion = 0.001;      // Stopping criterion
    this.convergence = null;         // Convergence
    this.max = null;                 // Maximum unsent flux patch
    this.env = null;                 // Environment

    this.ambient = new Spectra();    // Ambient exitance
    this.irf = new Spectra();        // Interreflection factors
    this.totalArea = 0;              // Total patch area
  }

  open() {
    throw new TypeError('RadEqnSolve is an abstract class');
  }

  initExitance() {
    this.totalFlux = 0;
    let s = 0;
    while (s < this.env.surfaces.length) {
      // Get surface emittance
      const emit = this.env.surfaces[s].emittance;

      let p = 0;
      while (p < this.env.surfaces[s].patches.length) {
        // Set patch unsent exitance
        this.env.surfaces[s].patches[p].exitance.setTo(emit);

        // Update total envnironment flux
        this.totalFlux += this.env.surfaces[s].patches[p].unsentFlux;

        // Initialize element and vertex exitance
        let e = 0;
        while (e < this.env.surfaces[s].patches[p].elements.length) {
          this.env.surfaces[s].patches[p].elements[e].exitance.setTo(emit);
          let v = 0;
          while (v < this.env.surfaces[s].patches[p].vertices.length) {
            this.env.surfaces[s].patches[p].vertices[v].exitance.reset();
            v++;
          }
          e++;
        }
        p++;
      }
      s++;
    }

    return this;
  }

  updateUnsentStats() {
    // Initialize unsent flux values
    this.totalUnsent = 0;
    let maxUnsent = 0;

    let p = 0;
    while (p < this.env.patches.length) {
      // Get current unsent flux value
      const currentUnsent = this.env.patches[p].unsentFlux;

      // Update total unsent flux
      this.totalUnsent += currentUnsent;

      // Update maximum unsent flux and patch pointer
      if (currentUnsent > maxUnsent) {
        maxUnsent = currentUnsent;
        this.max = this.env.patches[p];
      }
      p++;
    }

    // Update convergence value
    if (this.totalFlux > MIN_VALUE) {
      this.convergence = Math.abs(this.totalUnsent / this.totalFlux);
    } else {
      this.convergence = 0;
    }

    return this;
  }

  calcInterReflect() {
    this.irf.reset();
    this.totalArea = 0;
    const sum = new Spectra();
    const tmp = new Spectra();

    let p = 0;
    while (p < this.env.patches.length) {
      // Update sum of patch areas times reflectances
      tmp.setTo(this.env.patches[p].parentSurface.reflectance);
      tmp.scale(this.env.patches[p].area);
      sum.add(tmp);

      // Update sum of patch areas
      this.totalArea += this.env.patches[p].area;
      p++;
    }

    // Calculate atea-weighted average reflectance
    sum.scale(1 / this.totalArea);

    // Calculate interreflectance factors
    this.irf.r = 1 / (1 - sum.r);
    this.irf.g = 1 / (1 - sum.g);
    this.irf.b = 1 / (1 - sum.b);

    return this;
  }

  calcAmbient() {
    const sum = new Spectra();
    const tmp = new Spectra();

    let p = 0;
    while (p < this.env.patches.length) {
      // Update sum of unsent exitances times areas
      tmp.setTo(this.env.patches[p].exitance);
      tmp.scale(this.env.patches[p].area);
      sum.add(tmp);
      p++;
    }

    // Calculate area-weighted average reflectance
    sum.scale(1 / this.totalArea);

    // Calculate interreflectance factors
    this.ambient.r = this.irf.r * sum.r;
    this.ambient.g = this.irf.g * sum.g;
    this.ambient.b = this.irf.b * sum.b;

    return this;
  }
}
