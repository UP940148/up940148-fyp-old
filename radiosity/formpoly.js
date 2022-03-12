import Point3 from './point3.js';

export const MAX_VERT = 10; // maximum vertices in a quad clipped by six planes

export default class FormPoly {
  constructor() {
    this.vertices = new Array(MAX_VERT); // Output vertex array
    this.numVert = 0;                    // current number of vertices

    let i = 0;
    while (i < MAX_VERT) {
      this.vertices[i] = new Point3();
      i++;
    }
  }

  reset() {
    this.numVert = 0;
    return this;
  }

  addVertex(v) { // takes Vector4 with homogeneous coordinates
    v.projectToPoint(this.vertices[this.numVert]);
    this.numVert += 1;
    return this;
  }
}
