import FormPoly from './formpoly.js';
import HemiClip, { FACES } from './hemiclip.js';
import HemiScan from './hemiscan.js';

export default class HemiCube {
  constructor(resolution = 100) {
    this.out = new FormPoly();
    this.clipper = new HemiClip();
    this.scanner = new HemiScan(resolution);
  }

  calculateFormFactors(originPatch, env, ffArray) {
    // Set the hemi-cube view transformations matrix
    this.clipper.setView(originPatch);

    // make sure all the elements in the environment have consecutive numbers
    const numElements = env.numberElements();

    // Clear the form factors array
    ffArray.fill(0, 0, numElements);

    // Project environment onto each hemi-cube face
    // we project the whole environment on each side in turn,
    // adding the contributions in ffArray
    let f = 0;
    while (f < FACES.length) {
      // Update view transformation matrix
      this.clipper.updateView(FACES[f]);
      // Clear depth uffer
      this.scanner.initBuffer();

      const patches = env.patches;
      let p = 0;
      while (p < patches.length) {
        // If patch is part of light source, ignore
        if (patches[p].parentSurface.isLight) {
          p++;
          continue;
        }
        // Determine patch visibility
        const visible = !this.clipper.isFacingAway(patches[p]);
        if (patches[p] !== originPatch && visible) {
          let e = 0;
          while (e < patches[p].elements.length) {
            // Clip element to face view volume
            this.clipper.clip(patches[p].elements[e], this.out);

            // Draw the clipped polygon on the hemicube face
            this.scanner.scan(this.out, patches[p].elements[e].number);
            e++;
          }
        }
        p++;
      }
      this.scanner.sumDeltas(ffArray, FACES[f]);
      f++;
    }
    return this;
  }
}
