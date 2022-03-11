import HemiCube from './hemicube.js';
import Spectra from './spectra.js';
import Point3 from './point3.js';

export default class SlowRad {
  constructor(maxTime = 1000) {
    this.now = 0;                              // currently computing this step
    this.maxTime = maxTime;                    // Maximum number of steps
    this.env = null;                           // Environment

    this.ffd = new HemiCube();                 // Form factor determination
    this.tmpCamPos = new Point3();             // Object to hold last camera position
  }

  open(env, speedOfLight) {
    const reset = this.env !== env || (speedOfLight != null && speedOfLight !== this.speedOfLight);

    this.env = env;

    if (speedOfLight == null) {
      // const bounds = this.env.boundingBox;
      // const diagonal = bounds[0].dist(bounds[1]);
      // this.speedOfLight = diagonal * 4 / this.maxTime;
      this.speedOfLight = 5.66428005; // The approximate speed of sound
    } else {
      this.speedOfLight = speedOfLight;
    }

    if (reset) {
      this.env.numberElements();
      this.now = 0;
      this.env.initializeFutureExitances(this.maxTime);
      this.initExitance();
    }
    return this.prepGenerator();
  }

  show(time, camPos) {
    const cameraSwitched = (this.lastCameraPosition == null) !== (camPos == null);
    const cameraMoved = this.lastCameraPosition && !this.lastCameraPosition.equals(camPos);
    this.lastCameraPosition = camPos && this.tmpCamPos.setTo(camPos);

    if (this.lastShownTime !== time || cameraSwitched || cameraMoved || this.needsDisplayUpdate) {
      this.lastShownTime = time;
      this.needsDisplayUpdate = false;

      // set vertex colors to their colors from the given time
      const vertices = this.env.vertices;
      for (let v = 0; v < vertices.length; v++) {
        const camDist = camPos ? this.getTimeDist(vertices[v].pos, camPos) : 0;
        vertices[v].exitance.setTo(vertices[v].futureExitances[time - camDist]);
      }
      return true;
    }
    return false;
  }

  calculate() {
    // Check for maximum number of steps
    if (this.now >= this.maxTime) {
      return true;
    }

    this.needsDisplayUpdate = true;

    const shoot = new Spectra();

    const patches = this.env.patches;
    const surfaces = this.env.surfaces;
    for (let cp = 0; cp < patches.length; cp++) { // For every patch in scene
      // calculate form factors
      const rffArray = patches[cp].rffArray;

      for (let s = 0; s < surfaces.length; s++) { // For every surface in scene
        // Get surface reflectance
        const reflect = surfaces[s].reflectance;

        for (let p = 0; p < surfaces[s].patches.length; p++) { // For every patch of the current surface
          // ignore self patch
          if (surfaces[s].patches[p] !== patches[cp]) {
            for (let e = 0; e < surfaces[s].patches[p].elements.length; e++) { // For every element of the current surface patch
              // Check element visibility
              if (rffArray[surfaces[s].patches[p].elements[e].number] > 0) {
                // compute when the element would receive the light
                const receivingTime = this.now + patches[cp].distArray[surfaces[s].patches[p].elements[e].number];
                // only propagate the light if we aren't out of future buffer
                if (receivingTime < this.maxTime) {
                  // get reciprocal form factor
                  const rff = rffArray[surfaces[s].patches[p].elements[e].number];

                  // Get shooting patch unsent exitance
                  shoot.setTo(patches[cp].futureExitances[this.now]);

                  // Calculate delta exitance
                  shoot.scale(rff);
                  shoot.multiply(reflect);

                  // Store element exitance
                  surfaces[s].patches[p].elements[e].futureExitances[receivingTime].add(shoot);

                  shoot.scale(surfaces[s].patches[p].elements[e].area / surfaces[s].patches[p].area);
                  surfaces[s].patches[p].futureExitances[receivingTime].add(shoot);
                }
              }
            }
          }
        }
      }

      // Reset unsent exitance to zero
      patches[cp].futureExitances[this.now].reset();
    }

    this.env.interpolateVertexExitances(this.now);

    this.now++;

    // Convergence not achieved yet
    return false;
  }

  // calculate reciprocal form factors or return existing ones if already there
  computeRFFArray(patch) {
    if (patch.rffArray) return patch.rffArray;

    const rffArray = patch.rffArray = new Array(this.env.elementCount);
    this.ffd.calculateFormFactors(patch, this.env, rffArray);

    // compute reciprocal form factors
    const elements = this.env.elements;
    for (let e = 0; e < elements.length; e++) {
      const i = elements[e].number;
      rffArray[i] = Math.min(rffArray[i] * patch.area / elements[e].area, 1);
    }
  }

  computeDistArray(currentPatch) {
    if (currentPatch.distArray &&
        currentPatch.distArray.speedOfLight === this.speedOfLight) {
      // this patch already has distArray for the current speed of light
      return;
    }

    const distArray = currentPatch.distArray = new Array(this.env.elementCount).fill(null);
    distArray.speedOfLight = this.speedOfLight;

    const patches = this.env.patches;
    for (let p = 0; p < patches.length; p++) {
      // ignore self patch
      if (patches[p] !== currentPatch) {
        for (let e = 0; e < patches[p].elements.length; e++) {
          distArray[patches[p].elements[e].number] = this.getTimeDist(currentPatch.center, patches[p].elements[e].center);
        }
      }
    }
  }

  getTimeDist(p1, p2) {
    // calculate patch-element distance
    const dist = p1.dist(p2);

    // transform into integer distance in time steps (minimum 1)
    const timeDist = Math.max(1, Math.round(dist / this.speedOfLight));

    return timeDist;
  }

  initExitance() {
    const surfaces = this.env.surfaces;
    for (let s = 0; s < surfaces.length; s++) {
      // Get emitting time for this surface
      const activeTime = surfaces[s].activeTime;
      if (!activeTime) {
        continue
      }
      // Get surface emittance
      const emit = surfaces[s].emittance;

      for (let p = 0; p < surfaces[s].patches.length; p++) {
        // Initialize patch future exitances
        // set the lights to flash at the beginning
        surfaces[s].patches[p].futureExitances.forEach((s, i) => {
          if (Array.isArray(activeTime[0])) {
            // If entry is an array, then multiple activation ranges specified
            for (let e = 0; e < activeTime.length; e++) {
              if (activeTime[e][0] <= i && i <= activeTime[e][1]) {
                s.setTo(emit);
              }
            }
          } else if (activeTime[0] <= i && i <= activeTime[1]) {
            s.setTo(emit);
          } else {
            s.reset();
          }
        });

        // Initialize element and vertex future exitances
        for (let e = 0; e < surfaces[s].patches[p].elements.length; e++) {
          for (let fe = 0; fe < surfaces[s].patches[p].elements[e].futureExitances.length; fe++) {
            surfaces[s].patches[p].elements[e].futureExitances[fe].setTo(surfaces[s].patches[p].futureExitances[fe]);
          }
          for (let v = 0; v < surfaces[s].patches[p].elements[e].vertices.length; v++) {
            for (let fe = 0; fe < surfaces[s].patches[p].elements[e].vertices[v].futureExitances.length; fe++) {
              surfaces[s].patches[p].elements[e].vertices[v].futureExitances[fe].reset();
            }
          }
        }
      }
    }

    return this;
  }

  * prepGenerator() {
    // calculate distances and form factors
    const max = this.env.patchCount;
    let curr = 0;
    yield { curr, max };

    const patches = this.env.patches;
    for (let cp = 0; cp < patches.length; cp++) {
      curr++;
      this.computeDistArray(patches[cp]);
      this.computeRFFArray(patches[cp]);
      yield { curr, max };
    }

    while (!this.calculate()) {
      yield { curr: this.now, max: this.maxTime };
    }
  }
}
