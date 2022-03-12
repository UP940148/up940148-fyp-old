import FormScan from './formscan.js';
import HemiDelta from './hemidelta.js';
import { TOP } from './hemiclip.js';

export class FormCellInfo {
  reset() {
    this.depth = Infinity;      // Polygon cell depth
    this.polyId = null;  // Polygon identifier
  }
}

export default class HemiScan extends FormScan {
  constructor(resolution) {
    super(resolution);

    this.dff = new HemiDelta(resolution);

    // Initialize cell buffer - 2d array of FormCellInfo
    this.cellBuffer = [];
    let i = 0;
    while (i < resolution) {
      const row = [];
      let j = 0;
      while (j < resolution) {
        row[j] = new FormCellInfo();
        j++;
      }
      this.cellBuffer[i] = row;
      i++;
    }
  }

  initBuffer() {
    let row = 0;
    while (row < this.resolution) {
      let col = 0;
      while (col < this.resolution) {
        this.cellBuffer[row][col].reset();
        col++;
      }
      row++;
    }
  }

  drawEdgeList(polyId) {
    let y = this.yMin;
    while (y < this.yMax) {
      const edge = this.edgeList[y];

      // Get scan line info, scan start and end
      let ss = edge.start;
      let se = edge.end;

      if (ss.x > se.x) {
        // Swap scan line info
        [ss, se] = [se, ss];
      }

      // Get scan line x-axis co-ordinates
      const sx = Math.trunc(ss.x);
      const ex = Math.trunc(se.x);

      if (sx < ex) { // Ignore zero-length segments
        // Determine inverse slopes
        const xDist = se.x - ss.x;
        const dz = (se.z - ss.z) / xDist;

        // Determine scan line start info
        let iz = ss.z;

        // Enter scan line
        let x = sx;
        while (x < ex) {
          const cell = this.cellBuffer[y][x];

          // Check element visibility
          if (iz < cell.depth) {
            // update z buffer with new depth and polygon ID
            cell.depth = iz;
            cell.polyId = polyId;
          }
          // Update element pseudodepth
          iz += dz;
          x++;
        }
      }
      y++;
    }
  }

  sumDeltas(ffArray, faceId) {
    if (faceId === TOP) {
      // Scan entire face buffer
      let row = 0;
      while (row < this.resolution) {
        let col = 0;
        while (col < this.resolution) {
          const polyId = this.cellBuffer[row][col].polyId;
          if (polyId != null) {
            ffArray[polyId] += this.dff.getTopFactor(row, col);
          }
          col++;
        }
        row++;
      }
    } else {
      // Scan upper half of face buffer only
      let row = this.resolution / 2;
      while (row < this.resolution) {
        let col = 0;
        while (col < this.resolution) {
          const polyId = this.cellBuffer[row][col].polyId;
          if (polyId != null) {
            ffArray[polyId] += this.dff.getSideFactor(row, col);
          }
          col++;
        }
        row++;
      }
    }
  }
}
