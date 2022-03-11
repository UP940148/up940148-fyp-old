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
      let v = 0;
      while (v < this.env.vertices.length) {
        const camDist = camPos ? this.getTimeDist(this.env.vertices[v].pos, camPos) : 0;
        this.env.vertices[v].exitance.setTo(this.env.vertices[v].futureExitances[time - camDist]);
        v++;
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

    let cp = 0;
    while (cp < this.env.patches.length) { // For every patch in scene
      // calculate form factors
      const rffArray = this.env.patches[cp].rffArray;

      let s = 0;
      while (s < this.env.surfaces.length) { // For every surface in scene
        // Get surface reflectance
        const reflect = this.env.surfaces[s].reflectance;

        let p = 0;
        while (p < this.env.surfaces[s].patches.length) { // For every patch of the current surface
          // ignore self patch
          if (this.env.surfaces[s].patches[p] !== this.env.patches[cp]) {
            let e = 0;
            while (e < this.env.surfaces[s].patches[p].elements.length) { // For every element of the current surface patch
              // Check element visibility
              if (rffArray[this.env.surfaces[s].patches[p].elements[e].number] > 0) {
                // compute when the element would receive the light
                const receivingTime = this.now + this.env.patches[cp].distArray[this.env.surfaces[s].patches[p].elements[e].number];
                // only propagate the light if we aren't out of future buffer
                if (receivingTime < this.maxTime) {
                  // get reciprocal form factor
                  const rff = rffArray[this.env.surfaces[s].patches[p].elements[e].number];

                  // Get shooting patch unsent exitance
                  shoot.setTo(this.env.patches[cp].futureExitances[this.now]);

                  // Calculate delta exitance
                  shoot.scale(rff);
                  shoot.multiply(reflect);

                  // Store element exitance
                  this.env.surfaces[s].patches[p].elements[e].futureExitances[receivingTime].add(shoot);

                  shoot.scale(this.env.surfaces[s].patches[p].elements[e].area / this.env.surfaces[s].patches[p].area);
                  this.env.surfaces[s].patches[p].futureExitances[receivingTime].add(shoot);
                }
              }
              e++;
            }
          }
          p++;
        }
        s++;
      }

      // Reset unsent exitance to zero
      this.env.patches[cp].futureExitances[this.now].reset();
      cp++;
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
    let e = 0;
    while (e < this.env.elements.length) {
      const i = this.env.elements[e].number;
      rffArray[i] = Math.min(rffArray[i] * patch.area / this.env.elements[e].area, 1);
      e++;
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

    let p = 0;
    while (p < this.env.patches.length) {
      // ignore self patch
      if (this.env.patches[p] !== currentPatch) {
        let e = 0;
        while (e < this.env.patches[p].elements.length) {
          distArray[this.env.patches[p].elements[e].number] = this.getTimeDist(currentPatch.center, this.env.patches[p].elements[e].center);
          e++;
        }
      }
      p++;
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
    let s = 0;
    while (s < this.env.surfaces.length) {
      // Get emitting time for this surface
      const activeTime = this.env.surfaces[s].activeTime;
      if (!activeTime) {
        continue
      }
      // Get surface emittance
      const emit = this.env.surfaces[s].emittance;

      let p = 0;
      while (p < this.env.surfaces[s].patches.length) {
        // Initialize patch future exitances
        // set the lights to flash at the beginning
        this.env.surfaces[s].patches[p].futureExitances.forEach((se, i) => {
          if (Array.isArray(activeTime[0])) {
            // If entry is an array, then multiple activation ranges specified
            let e = 0;
            while (e < activeTime.length) {
              if (activeTime[e][0] <= i && i <= activeTime[e][1]) {
                se.setTo(emit);
              }
              e++;
            }
          } else if (activeTime[0] <= i && i <= activeTime[1]) {
            se.setTo(emit);
          } else {
            se.reset();
          }
        });

        // Initialize element and vertex future exitances
        let e = 0;
        while (e < this.env.surfaces[s].patches[p].elements.length) {
          this.env.surfaces[s].patches[p].elements[e].futureExitances.forEach((se, i) => {
            se.setTo(this.env.surfaces[s].patches[p].futureExitances[i]);
          });
          let v = 0;
          while (v < this.env.surfaces[s].patches[p].elements[e].vertices.length) {
            this.env.surfaces[s].patches[p].elements[e].vertices[v].futureExitances.forEach(se => se.reset());
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

  * prepGenerator() {
    // calculate distances and form factors
    const max = this.env.patchCount;
    let curr = 0;
    yield { curr, max };

    let cp = 0;
    while (cp < this.env.patches.length) {
      curr += 1;
      this.computeDistArray(this.env.patches[cp]);
      this.computeRFFArray(this.env.patches[cp]);
      yield { curr, max };
      cp++;
    }

    while (!this.calculate()) {
      yield { curr: this.now, max: this.maxTime };
    }
  }
}
