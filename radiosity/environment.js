import Point3 from './point3.js';
import Spectra from './spectra.js';

export default class Environment {
  constructor(instances, maxTime) {
    this.instances = instances;
    this.maxTime = maxTime;
    this.elementsNumbered = null;
  }

  get surfaceCount() {
    return sum(this.instances.map(i => i.surfaces.length));
  }

  get patchCount() {
    return sum(
      this.instances.flatMap(i =>
        i.surfaces.map(s => s.patches.length)));
  }

  get elementCount() {
    return sum(
      this.instances.flatMap(i =>
        i.surfaces.flatMap(s =>
          s.patches.map(p => p.elements.length))));
  }

  get vertexCount() {
    return sum(this.instances.map(i => i.vertices.length));
  }

  get boundingBox() {
    let minX, minY, minZ;
    minX = minY = minZ = Infinity;
    let maxX, maxY, maxZ;
    maxX = maxY = maxZ = -Infinity;
    let i = 0;
    while (i < this.instances.length) {
      let v = 0;
<<<<<<< HEAD
      while (v < this.instances[i].vertices.length) {
=======
      while (v < this.instances[i].vertices) {
>>>>>>> 4bb6d482ae42fb2823c1df4c4a9ce71013fdfaf9
        minX = Math.min(minX, this.instances[i].vertices[v].pos.x);
        minY = Math.min(minY, this.instances[i].vertices[v].pos.y);
        minZ = Math.min(minZ, this.instances[i].vertices[v].pos.z);
        maxX = Math.max(maxX, this.instances[i].vertices[v].pos.x);
        maxY = Math.max(maxY, this.instances[i].vertices[v].pos.y);
        maxZ = Math.max(maxZ, this.instances[i].vertices[v].pos.z);
        v++;
      }
      i++;
    }
    return [new Point3(minX, minY, minZ), new Point3(maxX, maxY, maxZ)];
  }

  numberElements() {
    if (this.elementsNumbered != null) return this.elementsNumbered;

    let e = 0;
    while (e < this.elements.length) {
      this.elements[e].number = e
      e++;
    }

    this.elementsNumbered = e;
    return e;
  }

  * _vertexIterator() {
    let i = 0;
    while (i < this.instances.length) {
      let v = 0;
      while (v < this.instances[i].vertices.length) {
        yield this.instances[i].vertices[v];
        v++;
      }
      i++;
    }
  }

  get vertices() {
    return this._vertexIterator();
  }

  * _elementsIterator() {
    let i = 0;
    while (i < this.instances.length) {
      let s = 0;
      while (s < this.instances[i].surfaces.length) {
        let p = 0;
        while (p < this.instances[i].surfaces[s].patches.length) {
          let e = 0;
          while (e < this.instances[i].surfaces[s].patches[p].elements.length) {
            yield this.instances[i].surfaces[s].patches[p].elements[e];
            e++;
          }
          p++;
        }
        s++;
      }
      i++;
    }
  }

  get elements() {
    return this._elementsIterator();
  }

  * _patchesIterator() {
    let i = 0;
    while (i < this.instances.length) {
      let s = 0;
      while (s < this.instances[i].surfaces.length) {
        let p = 0;
        while (p < this.instances[i].surfaces[s].patches.length) {
          yield this.instances[i].surfaces[s].patches[p];
          p++;
        }
        s++;
      }
      i++;
    }
  }

  get patches() {
    return this._patchesIterator();
  }

  * _surfacesIterator() {
    let i = 0;
    while (i < this.instances.length) {
      let s = 0;
      while (s < this.instances[i].surfaces.length) {
        yield this.instances[i].surfaces[s];
        s++;
      }
      i++;
    }
  }

  get surfaces() {
    return this._surfacesIterator();
  }

  checkNoVerticesAreShared() {
    let i = 0
    while (i < this.instances.length) {
      let s = 0;
      while (s < this.instances[i].surfaces.length) {
        let p = 0;
        while (p < this.instances[i].surfaces[s].patches.length) {
          if (!allVerticesBelongToSurface(this.instances[i].surfaces[s].patches[p].vertices, this.instances[i].surfaces[s])) return false;
          let e = 0;
          while (e < this.instances[i].surfaces[s].patches[p].elements.length) {
            if (!allVerticesBelongToSurface(this.instances[i].surfaces[s].patches[p].elements[e].vertices, this.instances[i].surfaces[s])) return false;
            e++;
          }
          p++;
        }
        s++;
      }
      i++;
    }
    return true;
  }

  // interpolate vertex reflected exitances from their surrounding elements
  interpolateVertexExitances(now) {
    if (now === undefined) {
      // everything has one .exitance
      let v = 0;
      while (v < this.vertices.length) {
        this.vertices[v].exitance.reset();

        let e = 0;
        while (e < this.vertices[v].elements.length) {
          this.vertices[v].exitance.add(this.vertices[v].elements[e].exitance);
          e++;
        }
        this.vertices[v].exitance.scale(1 / e);
        v++;
      }
    } else {
      // we deal with .futureExitances

      let v = 0;
      while (v < this.vertices.length) {
        // don't interpolate past the size of futureExitances
        if (now >= this.vertices[v].futureExitances.length) return;

        this.vertices[v].futureExitances[now].reset();

        let e = 0;
        while (e < this.vertices[v].elements.length) {
          this.vertices[v].futureExitances[now].add(this.vertices[v].elements[e].futureExitances[now]);
          e++;
        }
        this.vertices[v].futureExitances[now].scale(1 / e);
        v++;
      }
    }
  }

  initializeFutureExitances(length) {
    let p = 0;
    while (p < this.patches.length) {
      initializeObjectFutureExitances(this.patches[p], length);
      p++;
    }

    let e = 0;
    while (e < this.elements.length) {
      initializeObjectFutureExitances(this.elements[e], length);
      e++;
    }

    let v = 0;
    while (v < this.vertices.length) {
      initializeObjectFutureExitances(this.vertices[v], length);
      v++;
    }
  }
}

function initializeObjectFutureExitances(obj, length) {
  obj.futureExitances = new Array(length);
  for (let i = 0; i < length; i += 1) {
    obj.futureExitances[i] = new Spectra();
  }
}

function sum(array) {
  return array.reduce((a, b) => a + b, 0);
}

function allVerticesBelongToSurface(vertices, surface) {
  let v = 0;
  while (v < vertices.length) {
    let e = 0;
    while (e < vertices[v].elements.length) {
      if (vertices[v].elements[e].parentPatch.parentSurface !== surface) return false;
      e++;
    }
    v++;
  }
  return true;
}
