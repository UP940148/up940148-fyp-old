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
    for (let i = 0; i < this.instances.length; i++) {
      for (let v = 0; v < this.instances[i].vertices.length; v++) {
        minX = Math.min(minX, this.instances[i].vertices[v].pos.x);
        minY = Math.min(minY, this.instances[i].vertices[v].pos.y);
        minZ = Math.min(minZ, this.instances[i].vertices[v].pos.z);
        maxX = Math.max(maxX, this.instances[i].vertices[v].pos.x);
        maxY = Math.max(maxY, this.instances[i].vertices[v].pos.y);
        maxZ = Math.max(maxZ, this.instances[i].vertices[v].pos.z);
      }
    }
    return [new Point3(minX, minY, minZ), new Point3(maxX, maxY, maxZ)];
  }

  numberElements() {
    if (this.elementsNumbered != null) return this.elementsNumbered;

    const elements = this.elements;
    let e;
    for (e = 0; e < elements.length; e++) {
      elements[e].number = e;
    }

    this.elementsNumbered = e;
    return e;
  }

  // * _vertexIterator() {
  //   for (const instance of this.instances) {
  //     for (let v = 0; v < instance.vertices.length; v++) {
  //       yield instance.vertices[v];
  //     }
  //   }
  // }

  // get vertices() {
  //   return this._vertexIterator();
  // }

  get vertices() {
    const verts = [];
    let i = 0;
    while (i < this.instances.length) {
      let v = 0;
      while (v < this.instances[i].vertices.length) {
        verts.push(this.instances[i].vertices[v]);
        v++;
      }
      i++;
    }
    return verts;
  }

  // * _elementsIterator() {
  //   for (const instance of this.instances) {
  //     for (let s = 0; s < instance.surfaces.length; s++) {
  //       for (let p = 0; p < instance.surfaces[s].patches.length; p++) {
  //         for (let e = 0; e < instance.surfaces[s].patches[p].elements.length; e++) {
  //           yield instance.surfaces[s].patches[p].elements[e];
  //         }
  //       }
  //     }
  //   }
  // }

  // get elements() {
  //   return this._elementsIterator();
  // }

  get elements() {
    const elems = [];
    let i = 0;
    while (i < this.instances.length) {
      let s = 0;
      while (s < this.instances[i].surfaces.length) {
        let p = 0;
        while (p < this.instances[i].surfaces[s].patches.length) {
          let e = 0;
          while (e < this.instances[i].surfaces[s].patches[p].elements.length) {
            elems.push(this.instances[i].surfaces[s].patches[p].elements[e]);
            e++;
          }
          p++;
        }
        s++;
      }
      i++;
    }
    return elems;
  }

  // * _patchesIterator() {
  //   for (const instance of this.instances) {
  //     for (let s = 0; s < instance.surfaces.length; s++) {
  //       for (let p = 0; p < instance.surfaces[s].patches.length; p++) {
  //         yield instance.surfaces[s].patches[p];
  //       }
  //     }
  //   }
  // }

  // get patches() {
  //   return this._patchesIterator();
  // }

  get patches() {
    const patches = [];
    let i = 0;
    while (i < this.instances.length) {
      let s = 0;
      while (s < this.instances[i].surfaces.length) {
        let p = 0;
        while (p < this.instances[i].surfaces[s].patches.length) {
          patches.push(this.instances[i].surfaces[s].patches[p]);
          p++;
        }
        s++;
      }
      i++;
    }
    return patches;
  }

  // * _surfacesIterator() {
  //   for (const instance of this.instances) {
  //     for (let s = 0; s < instance.surfaces.length; s++) {
  //       yield instance.surfaces[s];
  //     }
  //   }
  // }

  // get surfaces() {
  //   return this._surfacesIterator();
  // }

  get surfaces() {
    const surfs = [];
    let i = 0;
    while (i < this.instances.length) {
      let s = 0;
      while (s < this.instances[i].surfaces.length) {
        surfs.push(this.instances[i].surfaces[s]);
        s++;
      }
      i++;
    }
    return surfs;
  }

  checkNoVerticesAreShared() {
    for (let i = 0; i < this.instances.length; i++) {
      for (let s = 0; s < this.instances[i].surfaces.length; s++) {
        for (let p = 0; p < this.instances[i].surfaces[s].patches.length; p++) {
          if (!allVerticesBelongToSurface(this.instances[i].surfaces[s].patches[p].vertices, this.instances[i].surfaces[s])) return false;
          for (let e = 0; e < this.instances[i].surfaces[s].patches[p].elements.length; e++) {
            if (!allVerticesBelongToSurface(this.instances[i].surfaces[s].patches[p].elements[e].vertices, this.instances[i].surfaces[s])) return false;
          }
        }
      }
    }
    return true;
  }

  // interpolate vertex reflected exitances from their surrounding elements
  interpolateVertexExitances(now) {
    const vertices = this.vertices;
    if (now === undefined) {
      // everything has one .exitance
      for (let v = 0; v < vertices.length; v++) {
        vertices[v].exitance.reset();
        let e;
        for (e = 0; e < vertices[v].elements.length; e++) {
          vertices[v].exitance.add(vertices[v].elements[e].exitance);
        }
        vertices[v].exitance.scale(1 / e);
      }
    } else {
      // we deal with .futureExitances
      for (let v = 0; v < vertices.length; v++) {
        // don't interpolate past the size of futureExitances
        if (now >= vertices[v].futureExitances.length) return;

        vertices[v].futureExitances[now].reset();
        let e;
        for (e = 0; e < vertices[v].elements.length; e++) {
          vertices[v].futureExitances[now].add(vertices[v].elements[e].futureExitances[now]);
        }
        vertices[v].futureExitances[now].scale(1 / e);
      }
    }
  }

  initializeFutureExitances(length) {
    const patches = this.patches;
    for (let p = 0; p < patches.length; p++) {
      initializeObjectFutureExitances(patches[p], length);
    }
    const elements = this.elements;
    for (let e = 0; e < elements.length; e++) {
      initializeObjectFutureExitances(elements[e], length);
    }
    const vertices = this.vertices;
    for (let v = 0; v < vertices.length; v++) {
      initializeObjectFutureExitances(vertices[v], length);
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
  for (let v = 0; v < vertices.length; v++) {
    for (let e = 0; e < vertices[v].elements.length; e++) {
      if (vertices[v].elements[e].parentPatch.parentSurface !== surface) return false;
    }
  }
  return true;
}
