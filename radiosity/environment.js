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

    let elementsNumbered = 0;
    for (const element of this.elements) {
      element.number = elementsNumbered;
      elementsNumbered++;
    }

    this.elementsNumbered = elementsNumbered;
    return elementsNumbered;
  }

  * _vertexIterator() {
    for (const instance of this.instances) {
      for (let v = 0; v < instance.vertices.length; v++) {
        yield instance.vertices[v];
      }
    }
  }

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

  * _elementsIterator() {
    for (const instance of this.instances) {
      for (let s = 0; s < instance.surfaces.length; s++) {
        for (let p = 0; p < instance.surfaces[s].patches.length; p++) {
          for (let e = 0; e < instance.surfaces[s].patches[p].elements.length; e++) {
            yield instance.surfaces[s].patches[p].elements[e];
          }
        }
      }
    }
  }

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

  * _patchesIterator() {
    for (const instance of this.instances) {
      for (let s = 0; s < instance.surfaces.length; s++) {
        for (let p = 0; p < instance.surfaces[s].patches.length; p++) {
          yield instance.surfaces[s].patches[p];
        }
      }
    }
  }

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

  * _surfacesIterator() {
    for (const instance of this.instances) {
      for (let s = 0; s < instance.surfaces.length; s++) {
        yield instance.surfaces[s];
      }
    }
  }

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
    for (const instance of this.instances) {
      for (let s = 0; s < instance.surfaces.length; s++) {
        for (let p = 0; p < instance.surfaces[s].patches.length; p++) {
          if (!allVerticesBelongToSurface(instance.surfaces[s].patches[p].vertices, instance.surfaces[s])) return false;
          for (let e = 0; e < instance.surfaces[s].patches[p].elements.length; e++) {
            if (!allVerticesBelongToSurface(instance.surfaces[s].patches[p].elements[e].vertices, instance.surfaces[s])) return false;
          }
        }
      }
    }
    return true;
  }

  // interpolate vertex reflected exitances from their surrounding elements
  interpolateVertexExitances(now) {
    if (now === undefined) {
      // everything has one .exitance
      for (const vertex of this.vertices) {
        vertex.exitance.reset();

        for (let e = 0; e < vertex.elements.length; e++) {
          vertex.exitance.add(vertex.elements[e].exitance);
        }
        vertex.exitance.scale(1 / vertex.elements.length);
      }
    } else {
      // we deal with .futureExitances
      for (const vertex of this.vertices) {
        // don't interpolate past the size of futureExitances
        if (now >= vertex.futureExitances.length) return;

        vertex.futureExitances[now].reset();

        for (let e = 0; e < vertex.elements.length; e++) {
          vertex.futureExitances[now].add(vertex.elements[e].futureExitances[now]);
        }
        vertex.futureExitances[now].scale(1 / vertex.elements.length);
      }
    }
  }

  initializeFutureExitances(length) {
    // Can't change these loops as they're looping through a generator
    // Must look into other loop possibilities
    for (const patch of this.patches) {
      initializeObjectFutureExitances(patch, length);
    }
    for (const element of this.elements) {
      initializeObjectFutureExitances(element, length);
    }
    for (const vertex of this.vertices) {
      initializeObjectFutureExitances(vertex, length);
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
