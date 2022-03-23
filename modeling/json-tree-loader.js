// import fetch from 'node-fetch';
import * as Rad from '../radiosity/index.js';
import Transform3 from './transform3.js';
import * as Cube from './cube.js';
import * as Tri from './tri-prism.js';
import * as Face from './singleface.js';

let branchReflectance = new Rad.Spectra(0.4, 0.4, 0.4);
let leafReflectance = new Rad.Spectra(0.8, 0.8, 0.8);
// let branchReflectance = new Rad.Spectra(0.1804, 0.1098, 0.0627);
// let leafReflectance = new Rad.Spectra(0.2118, 0.4510, 0.1882);

export async function load(filepath, isTree = true, colour = false) {
  if (colour) {
    branchReflectance = new Rad.Spectra(0.1804, 0.1098, 0.0627);
    leafReflectance = new Rad.Spectra(0.2118, 0.4510, 0.1882);
  }
  const tree = await getObject(filepath);

  let surfaces = [];

  if (isTree) {
    let b = 0;
    while (b < tree.branches.length) {
      if (tree.branches[b].width > 0.8) {
        const object = createBranch(tree.branches[b]);
        surfaces = surfaces.concat(object.surfaces);
      }
      b++;
    }
  }

  let l = 0;
  while (l < tree.leaves.length) {
    const objects = createLeaf(tree.leaves[l], isTree, colour);
    let o = 0;
    while (o < objects.length) {
      if (objects[o]) {
        surfaces = surfaces.concat(objects[o].surfaces);
      }
      o++;
    }
    l++;
  }

  return new Rad.Instance(surfaces);
}


async function getObject(file) {
  let obj;
  try {
    const response = await fetch(file);

    obj = await response.json();
  } catch {
    obj = await import(file, { assert: { type: 'json' } });
    obj = obj.default;
  }


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
  let s = 0;
  while (s < retVal.surfaces.length) {
    retVal.surfaces[s].reflectance.add(branchReflectance);
    s++;
  }

  const xForm = new Transform3();
  // Place on x,y centre
  xForm.translate(-0.5, -0.5, 0);
  xForm.scale(branch.width, branch.width, branch.length);
  xForm.rotate(branch.rotation.x, 0, branch.rotation.z);
  xForm.translate(branch.start.x, branch.start.y, branch.start.z);

  xForm.transform(retVal);

  return retVal;
}

function createLeaf(leaf, isTree, colour) {
  if (!isTree) {
    leafReflectance = new Rad.Spectra(0.7, 0.7, 0.7);
    if (colour) {
      leafReflectance = new Rad.Spectra(0.0667, 0.1255, 0.0627);
    }
  }

  const original = Face.triangle(leafReflectance, new Rad.Spectra(0, 0, 0));
  const mirror = Face.triangle(leafReflectance, new Rad.Spectra(0, 0, 0));
  const mirrorX = new Transform3();
  mirrorX.rotate(180, 0, 0);
  mirrorX.transform(mirror);


  const xForm = new Transform3();
  xForm.scale(12, 8, 1);
  if (isTree) {
    xForm.scale(leaf.scale, leaf.scale, 1);
  }
  xForm.rotate(leaf.rotation.x, leaf.rotation.y, leaf.rotation.z);
  xForm.translate(leaf.translation.x, leaf.translation.y, leaf.translation.z);
  if (!isTree) {
    xForm.translate(0, 0, -1.5 * leaf.translation.z);
    xForm.rotate(0, 180, 0);
  }
  xForm.transform(original);
  xForm.transform(mirror);


  return [original, mirror];
}
