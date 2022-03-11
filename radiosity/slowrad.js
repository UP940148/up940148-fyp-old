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
      for (const vertex of this.env.vertices) {
        const camDist = camPos ? this.getTimeDist(vertex.pos, camPos) : 0;
        vertex.exitance.setTo(vertex.futureExitances[time - camDist]);
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

    // this.env.patches is a generator. Can't while loop
    for (const currentPatch of this.env.patches) { // For every patch in scene
      // calculate form factors
      const rffArray = currentPatch.rffArray;

      // this.env.surfaces is a generator. Can't while loop
      for (const surface of this.env.surfaces) { // For every surface in scene
        // Get surface reflectance
        const reflect = surface.reflectance;

        let p = 0;
        while (p < surface.patches.length) { // For every patch of the current surface
          // ignore self patch
          if (surface.patches[p] !== currentPatch) {
            let e = 0;
            while (e < surface.patches[p].elements.length) { // For every element of the current surface patch
              // Check element visibility
              if (rffArray[surface.patches[p].elements[e].number] > 0) {
                // compute when the element would receive the light
                const receivingTime = this.now + currentPatch.distArray[surface.patches[p].elements[e].number];
                // only propagate the light if we aren't out of future buffer
                if (receivingTime < this.maxTime) {
                  // get reciprocal form factor
                  const rff = rffArray[surface.patches[p].elements[e].number];

                  // Get shooting patch unsent exitance
                  shoot.setTo(currentPatch.futureExitances[this.now]);

                  // Calculate delta exitance
                  shoot.scale(rff);
                  shoot.multiply(reflect);

                  // Store element exitance
                  surface.patches[p].elements[e].futureExitances[receivingTime].add(shoot);

                  shoot.scale(surface.patches[p].elements[e].area / surface.patches[p].area);
                  surface.patches[p].futureExitances[receivingTime].add(shoot);
                }
              }
              e++;
            }
          }
          p++;
        }
      }

      // Reset unsent exitance to zero
      currentPatch.futureExitances[this.now].reset();
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
    // this.env.elements is a generator. Can't while loop
    for (const element of this.env.elements) {
      const i = element.number;
      rffArray[i] = Math.min(rffArray[i] * patch.area / element.area, 1);
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

    for (const patch of this.env.patches) {
      // ignore self patch
      if (patch !== currentPatch) {
        let e = 0;
        while (e < patch.elements.length) {
          distArray[patch.elements[e].number] = this.getTimeDist(currentPatch.center, patch.elements[e].center);
          e++;
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
    // This.env.surfaces is a generator. Can't while loop
    for (const surface of this.env.surfaces) {
      // Get emitting time for this surface
      const activeTime = surface.activeTime;
      if (!activeTime) {
        continue
      }
      // Get surface emittance
      const emit = surface.emittance;

      let p = 0;
      while (p < surface.patches.length) {
        // Initialize patch future exitances
        // set the lights to flash at the beginning
        surface.patches[p].futureExitances.forEach((s, i) => {
          if (Array.isArray(activeTime[0])) {
            // If entry is an array, then multiple activation ranges specified
            let e = 0;
            while (e < activeTime.length) {
              if (activeTime[e][0] <= i && i <= activeTime[e][1]) {
                s.setTo(emit);
              }
              e++;
            }
          } else if (activeTime[0] <= i && i <= activeTime[1]) {
            s.setTo(emit);
          } else {
            s.reset();
          }
        });

        // Initialize element and vertex future exitances
        let e = 0;
        while (e < surface.patches[p].elements.length) {
          let fe = 0;
          while (fe < surface.patches[p].elements[e].futureExitances.length) {
            surface.patches[p].elements[e].futureExitances[fe].setTo(surface.patches[p].futureExitances[fe]);
            fe++;
          }
          let v = 0;
          while (v < surface.patches[p].elements[e].vertices.length) {
            let fe = 0;
            while (fe < surface.patches[p].elements[e].vertices[v].futureExitances.length) {
              surface.patches[p].elements[e].vertices[v].futureExitances[fe].reset();
              fe++;
            }
            v++;
          }
          e++;
        }
        p++;
      }
    }

    return this;
  }

  * prepGenerator() {
    // calculate distances and form factors
    const max = this.env.patchCount;
    let curr = 0;
    yield { curr, max };

    for (const currentPatch of this.env.patches) {
      curr += 1;
      this.computeDistArray(currentPatch);
      this.computeRFFArray(currentPatch);
      yield { curr, max };
    }

    while (!this.calculate()) {
      yield { curr: this.now, max: this.maxTime };
    }
  }
}
