import Spectra from './spectra.js';

export default class Surface3 {
  constructor(reflectance, emittance, patches, aliveTime) {
    this._reflectance = new Spectra(reflectance);   // Spectral reflectance
    this._emittance = new Spectra(emittance);       // Initial radiant exitance
    this.patches = patches;           // Patches that make up the surface
    this.aliveTime = aliveTime;       // Time that the surface exists in the scene

    // set parent surface of the given patches
    let p = 0;
    while (p < patches.length) {
      patches[p].parentSurface = this;
      p++;
    }
  }

  // reflectance and emittance should not be reassigned
  get reflectance() {
    return this._reflectance;
  }

  get emittance() {
    return this._emittance;
  }

  isAlive(currTime) {
    // Return true if surface is currently alive
    // Alive time must be in the form [a, b] or [[a, b], [c, d], ...]
    if (this.aliveTime === undefined) { // If undefined, then object is always alive
      return true;
    }

    if (Array.isArray(this.aliveTime[0])) {
      // If first element is array, then aliveTime is list of tuples
      let pr = 0;
      while (pr < this.aliveTime.length) {
        // If current time falls in any given range, return true
        if (this.aliveTime[pr][0] <= currTime && currTime <= this.aliveTime[pr][1]) {
          return true;
        }
        pr++;
      }
      return false;
    }

    if (this.aliveTime[0] <= currTime && currTime <= this.aliveTime[1]) {
      return true;
    }

    return false;
  }
}
