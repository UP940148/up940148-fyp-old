export default class Instance {
  constructor(surfaces) {
    this.surfaces = surfaces;
    this._vertices = null;       // Instance vertices (computed once in getter)
  }

  get vertices() {
    if (this._vertices == null) {
      const set = new Set();
      let s = 0;
      while (s < this.surfaces.length) {
        let p = 0;
        while (p < this.surfaces[s].patches.length) {
          addToSet(this.surfaces[s].patches[p].vertices, set);
          let e = 0;
          while (e < this.surfaces[s].patches[p].elements.length) {
            addToSet(this.surfaces[s].patches[p].elements[e].vertices, set);
            e++;
          }
          p++;
        }
        s++;
      }
      this._vertices = Array.from(set);
    }

    return this._vertices;
  }
}

function addToSet(arr, set) {
  let x = 0;
  while (x < arr.length) {
    set.add(arr[x]);
    x++;
  }
}
