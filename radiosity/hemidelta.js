export default class HemiDelta {
  constructor(resolution) {
    // a face is a square resolution x resolution big,
    // it is symmetrical so we can only store a quarter of it
    this.arrayDim = resolution / 2;

    // Initialize arrays
    this.sideArray = [];
    this.topArray = [];
    let i = 0;
    while (i < this.arrayDim) {
      this.sideArray.push([]);
      this.topArray.push([]);
      i++;
    }

    // Initialize cell size and area
    const size = 1 / this.arrayDim;
    const area = 1 / (this.arrayDim ** 2);

    // Calculate faces delta form factors
    // i,j number cells from the centre of the face
    // x,y are the centre of a cell
    // on side face, j (y) goes up from hemicube base
    i = 0;
    while (i < this.arrayDim) {
      const x = (i + 0.5) * size;
      let j = 0;
      while (j < this.arrayDim) {
        const y = (j + 0.5) * size;
        const r2 = x ** 2 + y ** 2 + 1;
        this.topArray[j][i] = area / (Math.PI * r2 ** 2);
        this.sideArray[j][i] = (y * area) / (Math.PI * r2 ** 2);
        j++;
      }
      i++;
    }
  }

  getTopFactor(row, col) {
    if (row >= this.arrayDim) {
      row -= this.arrayDim;
    } else {
      row = this.arrayDim - row - 1;
    }
    if (col >= this.arrayDim) {
      col -= this.arrayDim;
    } else {
      col = this.arrayDim - col - 1;
    }
    return this.topArray[row][col];
  }

  getSideFactor(row, col) {
    if (col >= this.arrayDim) {
      col -= this.arrayDim;
    } else {
      col = this.arrayDim - col - 1;
    }
    return this.sideArray[row - this.arrayDim][col];
  }
}
