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
      while (v < this.instances[i].vertices.length) {
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
      let v = 0;
      while (v < instance.vertices.length) {
        yield instance.vertices[v];
        v++;
      }
    }
  }

  get vertices() {
    return this._vertexIterator();
  }

  * _elementsIterator() {
    for (const instance of this.instances) {
      let s = 0;
      while (s < instance.surfaces.length) {
        let p = 0;
        while (p < instance.surfaces[s].patches.length) {
          let e = 0;
          while (e < instance.surfaces[s].patches[p].elements.length) {
            yield instance.surfaces[s].patches[p].elements[e];
            e++;
          }
          p++;
        }
        s++;
      }
    }
  }

  get elements() {
    return this._elementsIterator();
  }

  * _patchesIterator() {
    for (const instance of this.instances) {
      let s = 0;
      while (s < instance.surfaces.length) {
        let p = 0;
        while (p < instance.surfaces[s].patches.length) {
          yield instance.surfaces[s].patches[p];
          p++;
        }
        s++;
      }
    }
  }

  get patches() {
    return this._patchesIterator();
  }

  * _surfacesIterator() {
    for (const instance of this.instances) {
      let s = 0;
      while (s < instance.surfaces.length) {
        yield instance.surfaces[s];
        s++;
      }
    }
  }

  get surfaces() {
    return this._surfacesIterator();
  }

  checkNoVerticesAreShared() {
    for (const instance of this.instances) {
      let s = 0;
      while (s < instance.surfaces.length) {
        let p = 0;
        while (p < instance.surfaces[s].patches.length) {
          if (!allVerticesBelongToSurface(instance.surfaces[s].patches[p].vertices, instance.surfaces[s])) return false;
          let e = 0;
          while (e < instance.surfaces[s].patches[p].elements.length) {
            if (!allVerticesBelongToSurface(instance.surfaces[s].patches[p].elements[e].vertices, instance.surfaces[s])) return false;
            e++;
          }
          p++;
        }
        s++;
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

        let e = 0;
        while (e < vertex.elements.length) {
          vertex.exitance.add(vertex.elements[e].exitance);
          e++;
        }
        vertex.exitance.scale(1 / e);
      }
    } else {
      // we deal with .futureExitances
      for (const vertex of this.vertices) {
        // don't interpolate past the size of futureExitances
        if (now >= vertex.futureExitances.length) return;

        vertex.futureExitances[now].reset();

        let e = 0;
        while (e < vertex.elements.length) {
          vertex.futureExitances[now].add(vertex.elements[e].futureExitances[now]);
          e++;
        }
        vertex.futureExitances[now].scale(1 / e);
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
