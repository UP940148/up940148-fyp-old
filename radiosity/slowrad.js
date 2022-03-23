import HemiCube from './hemicube.js';
import Spectra from './spectra.js';
import Point3 from './point3.js';
import * as ArrayScaling from './array-scaling.js';

export default class SlowRad {
  constructor(maxTime = 1000) {
    this.now = 0;                              // currently computing this step
    this.maxTime = maxTime;                    // Maximum number of steps
    this.env = null;                           // Environment

    this.ffd = new HemiCube();                 // Form factor determination
    this.tmpCamPos = new Point3();             // Object to hold last camera position
  }

  open(env, sceneName, speedOfLight) {
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
    return this.prepGenerator(sceneName);
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
      let v = 0;
      while (v < vertices.length) {
        const camDist = camPos ? this.getTimeDist(vertices[v].pos, camPos) : 0;
        vertices[v].exitance.setTo(vertices[v].futureExitances[time - camDist]);
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

    const patches = this.env.patches;
    let cp = 0;
    while (cp < patches.length) { // For every patch in scene
      // calculate form factors
      const rffArray = patches[cp].rffArray;

      let p = 0;
      while (p < patches.length) { // For every other patch
        const reflect = patches[p].parentSurface.reflectance;
        // ignore self patch
        if (patches[p] !== patches[cp]) {
          let e = 0;
          while (e < patches[p].elements.length) { // For every element of the current surface patch
            // Check element visibility
            if (rffArray[patches[p].elements[e].number] > 0) {
              // compute when the element would receive the light
              const receivingTime = this.now + patches[cp].distArray[patches[p].elements[e].number];
              // only propagate the light if we aren't out of future buffer
              if (receivingTime < this.maxTime) {
                // get reciprocal form factor
                const rff = rffArray[patches[p].elements[e].number];

                // Get shooting patch unsent exitance
                shoot.setTo(patches[cp].futureExitances[this.now]);

                // Calculate delta exitance
                shoot.scale(rff);
                shoot.multiply(reflect);

                // Store element exitance
                patches[p].elements[e].futureExitances[receivingTime].add(shoot);

                shoot.scale(patches[p].elements[e].area / patches[p].area);
                patches[p].futureExitances[receivingTime].add(shoot);
              }
            }
            e++;
          }
        }
        p++;
      }
      // Reset unsent exitance to zero
      patches[cp].futureExitances[this.now].reset();
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
    const elements = this.env.elements;
    let e = 0;
    while (e < elements.length) {
      const i = elements[e].number;
      rffArray[i] = Math.min(rffArray[i] * patch.area / elements[e].area, 1);
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

    const patches = this.env.patches;
    let p = 0;
    while (p < patches.length) {
      // ignore self patch
      if (patches[p] !== currentPatch) {
        let e = 0;
        while (e < patches[p].elements.length) {
          distArray[patches[p].elements[e].number] = this.getTimeDist(currentPatch.center, patches[p].elements[e].center);
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
    const surfaces = this.env.surfaces;
    let s = 0;
    while (s < surfaces.length) {
      // Get emitting time for this surface
      const activeTime = surfaces[s].activeTime;
      if (!activeTime) {
        s++;
        continue;
      }
      // Get surface emittance
      const emit = surfaces[s].emittance;

      let p = 0;
      while (p < surfaces[s].patches.length) {
        // Initialize patch future exitances
        // set the lights to flash at the beginning
        surfaces[s].patches[p].futureExitances.forEach((s, i) => {
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
        while (e < surfaces[s].patches[p].elements.length) {
          let fe = 0;
          while (fe < surfaces[s].patches[p].elements[e].futureExitances.length) {
            surfaces[s].patches[p].elements[e].futureExitances[fe].setTo(surfaces[s].patches[p].futureExitances[fe]);
            fe++;
          }
          let v = 0;
          while (v < surfaces[s].patches[p].elements[e].vertices.length) {
            let fe = 0;
            while (fe < surfaces[s].patches[p].elements[e].vertices[v].futureExitances.length) {
              surfaces[s].patches[p].elements[e].vertices[v].futureExitances[fe].reset();
              fe++;
            }
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

  async* prepGenerator(scene) {
    // calculate distances and form factors
    const max = this.env.patchCount;
    let curr = 0;
    yield { curr, max };
    // Load data from file
    let data;
    if (typeof window !== 'undefined') {
      data = await this.loadFromArrays(scene);
    }


    if (data) {
      // If data from file is a match for the scene, then load exitances
      const vertices = this.env.vertices;
      let v = 0;
      while (v < vertices.length) {
        const exitances = data.exitance[v];
        this.now = 0;
        while (this.now < this.maxTime) {
          const level = exitances[this.now];
          const exitance = new Spectra(level, level, level);
          vertices[v].futureExitances[this.now] = exitance;
          this.now++;
        }
        yield { curr: v + 1, max: vertices.length };
        v++;
      }
    } else {
      const patches = this.env.patches;
      let cp = 0;
      while (cp < patches.length) {
        curr++;
        this.computeDistArray(patches[cp]);
        this.computeRFFArray(patches[cp]);
        yield { curr, max };
        cp++;
      }
      // If data isn't a match, compute exitances
      while (!this.calculate()) {
        yield { curr: this.now, max: this.maxTime };
      }
      // Once computing is done, save data
      if (typeof window === 'undefined') {
        this.saveArrays(scene);
      }
    }
  }

  async loadFromArrays(name) {
    try {
      const myHeaders = new Headers();
      myHeaders.append('pragma', 'no-cache');
      myHeaders.append('cache-control', 'no-cache');
      const myInit = {
        method: 'GET',
        headers: myHeaders,
      };
      let data;
      try {
        const response = await fetch(`../modeling/test-models/${name}-Arrays.json`, myInit);
        data = await response.json();
      } catch {
        data = await import(`../modeling/test-models/${name}-Arrays.json`, { assert: { type: 'json' } });
      } finally {
        let e = 0;
        while (e < data.exitance.length) {
          data.exitance[e] = ArrayScaling.expand(data.exitance[e]);
          e++;
        }
        return data;
      }
    } catch (err) {
      return undefined;
    }
  }

  saveArrays(name) {
    const vertices = this.env.vertices;
    const exitance = [];
    let v = 0;
    while (v < vertices.length) {
      const vertEntry = [];
      let t = 0;
      while (t < this.maxTime) {
        vertEntry.push(vertices[v].futureExitances[t].r);
        t++;
      }
      exitance.push(vertEntry);
      v++;
    }

    let e = 0;
    while (e < exitance.length) {
      exitance[e] = ArrayScaling.shrink(exitance[e]);
      e++;
    }

    const output = {
      exitance: exitance,
    };

    const json = JSON.stringify(output);

    console.log(json);
    /*
    const blob = new Blob([json], { type: 'text/plain;charset=utf-8' });
    const link = document.createElement('a');
    link.download = `${name}-Arrays.json`;
    link.href = URL.createObjectURL(blob);
    link.click();
    */
  }
}
