export default class Instance {
  constructor(surfaces) {
    this.surfaces = surfaces;
    this._vertices = null;       // Instance vertices (computed once in getter)
  }

  get vertices() {
    if (this._vertices == null) {
      const set = new Set();
      for (let s = 0; s < this.surfaces.length; s++) {
        for (let p = 0; p < this.surfaces[s].patches.length; p++) {
          addToSet(this.surfaces[s].patches[p].vertices, set);
          for (let e = 0; e < this.surfaces[s].patches[p].elements.length; e++) {
            addToSet(this.surfaces[s].patches[p].elements[e].vertices, set);
          }
        }
      }
      this._vertices = Array.from(set);
    }

    return this._vertices;
  }
}

function addToSet(arr, set) {
  for (let x = 0; x < arr.length; x++) {
    set.add(arr[x]);
  }
}
