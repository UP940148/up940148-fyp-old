/* global fetch */
import * as Rad from '../radiosity/index.js';
import Transform3 from './transform3.js';
import * as Cube from './cube.js';
import * as Tri from './tri-prism.js';
import * as Face from './singleface.js';

const branchReflectance = new Rad.Spectra(0.4, 0.4, 0.4);
const leafReflectance = new Rad.Spectra(0.8, 0.8, 0.8);

export async function load(filepath) {
  const tree = await getObject(filepath);
  // console.log(tree);

  let surfaces = [];

  // for (let i = 0; i < 200; i++) {
  //   const object = createBranch(tree.branches[i]);
  //   surfaces = surfaces.concat(object.surfaces);
  // }

  for (const branch of tree.branches) {
    if (branch.width > 0.8) {
      const object = createBranch(branch);
      surfaces = surfaces.concat(object.surfaces);
    }
  }

  for (const leaf of tree.leaves) {
    const objects = createLeaf(leaf);
    for (const object of objects) {
      if (object) {
        surfaces = surfaces.concat(object.surfaces);
      }
    }
  }

  return new Rad.Instance(surfaces);
}


async function getObject(file) {
  const response = await fetch(file);

  const obj = await response.json();

  return obj;
}


function createBranch(branch) {
  // Create as cubes (Maybe remove faces later)

  // const retVal = Cube.unitCubeMultiSurface();

  // Remove top and bottom faces
  // retVal.surfaces.pop();
  // retVal.surfaces.pop();

  const retVal = Tri.makePrism(branchReflectance, new Rad.Spectra(0, 0, 0));

  // Add reflectance values
  for (let i = 0; i < retVal.surfaces.length; i++) {
    retVal.surfaces[i].reflectance.add(branchReflectance);
  }

  // Scale rotations
  // branch.rotation.x = branch.rotation.x;
  // branch.rotation.y = branch.rotation.y;
  // branch.rotation.z = branch.rotation.z;

  const xForm = new Transform3();
  // Place on x,y centre
  //xForm.translate(-0.5, -0.5, 0);
  xForm.scale(branch.width, branch.width, branch.length);
  xForm.rotate(branch.rotation.x, 0, branch.rotation.z);
  xForm.translate(branch.start.x, branch.start.y, branch.start.z);

  xForm.transform(retVal);

  return retVal;
}

function createLeaf(leaf) {
  const original = Face.triangle(leafReflectance, new Rad.Spectra(0, 0, 0));

  const mirror = Face.triangle(leafReflectance, new Rad.Spectra(0, 0, 0));
  const mirrorX = new Transform3();
  mirrorX.rotate(180, 0, 0);
  mirrorX.transform(mirror);


  const xForm = new Transform3();
  xForm.scale(12, 8, 1);
  xForm.rotate(leaf.rotation.x, leaf.rotation.y, leaf.rotation.z);
  xForm.translate(leaf.translation.x, leaf.translation.y, leaf.translation.z);
  xForm.transform(original);
  xForm.transform(mirror);


  return [original, mirror];
}
