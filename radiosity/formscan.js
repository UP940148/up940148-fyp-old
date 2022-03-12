import Point3 from './point3.js';
import { MAX_VERT } from './formpoly.js';

export class FormVertexInfo {
  constructor() {
    // Face cell array offsets
    this.faceX = null;          // Width offset
    this.faceY = null;          // Height offset

    this.pos = new Point3();    // Scaled position
  }
}

export class FormEdgeInfo {
  constructor() {
    this.start = {              // Scan line intersection start
      x: null,                  // X-axis co-ordinate
      z: null,                  // Pseudodepth
    };
    this.end = {                // Scan line intersection end
      x: null,
      z: null,
    };
  }

  reset() {
    this.start.x = this.start.z = null;
    this.end.x = this.end.z = null;
    return this;
  }

  // set the start, or if that's already set, set the end
  add(x, z) {
    const where = this.start.x == null ? this.start : this.end;
    where.x = x;
    where.z = z;
    return this;
  }
}

export default class FormScan {
  constructor(resolution) {
    this.resolution = resolution;
    this.yMin = null;           // Minimum y-axis co-ord
    this.yMax = null;           // Maximum y-axis co-ord

    this.edgeList = [];         // Edge list
    let i = 0;
    while (i < resolution) {
      this.edgeList[i] = new FormEdgeInfo();
      i++;
    }

    this.numVert = null;        // Number of vetices
    this.vInfo = [];            // Vertex info table
    i = 0;
    while (i < MAX_VERT) {
      this.vInfo[i] = new FormVertexInfo();
      i++;
    }
  }

  getVertexInfo(poly) {
    // Initialize polygon y-axis limits
    this.yMax = 0;
    this.yMin = this.resolution - 1;

    // Get number of vertices
    this.numVert = poly.numVert;

    let i = 0;
    while (i < this.numVert) {
      const v = this.vInfo[i];
      // Get vertex normalized view space co-ordinates
      const pos = poly.vertices[i];

      // Scale view space u-v co-ordinates
      v.pos.x = pos.x * this.resolution;
      v.pos.y = pos.y * this.resolution;
      v.pos.z = pos.z;

      // Convert to cell array x-y co-ordinates
      v.faceX = Math.trunc(v.pos.x);
      v.faceY = Math.trunc(v.pos.y);

      // Update polygon y-axis limits
      if (v.faceY < this.yMin) this.yMin = v.faceY;
      if (v.faceY > this.yMax) this.yMax = v.faceY;
      i++;
    }
  }

  scanEdges() {
    // Initialize edge list
    let i = this.yMin;
    while (i < this.yMax) {
      this.edgeList[i].reset();
      i++;
    }

    i = 0;
    while (i < this.numVert) {
      // Get edge vertices: start vertex, end vertex
      let sv = this.vInfo[i];
      let ev = this.vInfo[(i + 1) % this.numVert];

      if (sv.faceY === ev.faceY) { // Ignore horizontal edges
        i++;
        continue;
      }

      if (sv.faceY > ev.faceY) {
        // Swap edge vertices
        [sv, ev] = [ev, sv];
      }

      // Get start vertex info
      let ix = sv.pos.x;
      let iz = sv.pos.z;

      // Determine inverse slopes
      const yDist = ev.faceY - sv.faceY;
      const dx = (ev.pos.x - sv.pos.x) / yDist;
      const dz = (ev.pos.z - sv.pos.z) / yDist;

      // Scan convert edge
      let j = sv.faceY;
      while (j < ev.faceY) {
        // Insert edge itersection info
        this.edgeList[j].add(ix, iz);

        // Update edge intersection info
        ix += dx;
        iz += dz;
        j++;
      }
      i++;
    }
  }

  drawEdgeList() {
    throw new TypeError('FormScan is an abstract class, a subclass must provide drawEdgeList()');
  }

  scan(poly, polyId) {
    if (poly.numVert === 0) return;

    this.getVertexInfo(poly);
    this.scanEdges();
    this.drawEdgeList(polyId);
    return this;
  }
}
