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
    for (let f = 0; f < FACES.length; f++) {
      // Update view transformation matrix
      this.clipper.updateView(FACES[f]);
      // Clear depth uffer
      this.scanner.initBuffer();

      for (const patch of env.patches) {
        // If patch is part of light source, ignore
        if (patch.parentSurface.isLight) {
          continue;
        }
        // Determine patch visibility
        const visible = !this.clipper.isFacingAway(patch);
        if (patch !== originPatch && visible) {
          for (let e = 0; e < patch.elements.length; e++) {
            // Clip element to face view volume
            this.clipper.clip(patch.elements[e], this.out);

            // Draw the clipped polygon on the hemicube face
            this.scanner.scan(this.out, patch.elements[e].number);
          }
        }
      }
      this.scanner.sumDeltas(ffArray, FACES[f]);
    }
    return this;
  }
}
