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

    const elements = this.elements;
    let e = 0;
    while (e < elements.length) {
      elements[e].number = e;
      e++;
    }

    this.elementsNumbered = e;
    return e;
  }

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
    let i = 0;
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
    const vertices = this.vertices;
    if (now === undefined) {
      // everything has one .exitance
      let v = 0;
      while (v < vertices.length) {
        vertices[v].exitance.reset();
        let e = 0;
        while (e < vertices[v].elements.length) {
          vertices[v].exitance.add(vertices[v].elements[e].exitance);
          e++;
        }
        vertices[v].exitance.scale(1 / e);
        v++;
      }
    } else {
      // we deal with .futureExitances
      let v = 0;
      while (v < vertices.length) {
        // don't interpolate past the size of futureExitances
        if (now >= vertices[v].futureExitances.length) return;

        vertices[v].futureExitances[now].reset();
        let e = 0;
        while (e < vertices[v].elements.length) {
          vertices[v].futureExitances[now].add(vertices[v].elements[e].futureExitances[now]);
          e++;
        }
        vertices[v].futureExitances[now].scale(1 / e);
        v++;
      }
    }
  }

  initializeFutureExitances(length) {
    const patches = this.patches;
    let p = 0;
    while (p < patches.length) {
      initializeObjectFutureExitances(patches[p], length);
      p++;
    }
    const elements = this.elements;
    let e = 0;
    while (e < elements.length) {
      initializeObjectFutureExitances(elements[e], length);
      e++;
    }
    const vertices = this.vertices;
    let v = 0;
    while (v < vertices.length) {
      initializeObjectFutureExitances(vertices[v], length);
      v++;
    }
  }
}

function initializeObjectFutureExitances(obj, length) {
  obj.futureExitances = new Array(length);
  let i = 0;
  while (i < length) {
    obj.futureExitances[i] = new Spectra();
    i++;
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
