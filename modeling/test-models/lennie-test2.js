
import { loadSTL } from '../stl-loader.js';
import * as Rad from '../../radiosity/index.js';
import Transform3 from '../transform3.js';
import * as Cube from '../cube.js';
import * as Plane from '../singleface.js';
import * as Cylinder from '../cylinder.js';

const defaultReflectance = new Rad.Spectra(1, 1, 1);
const defaultEmittance = new Rad.Spectra(0, 0, 0);
const planeLightReflectance = new Rad.Spectra(0, 0, 0);
const planeLightEmittance = new Rad.Spectra(100, 100, 100);

const defaultCubeReflectance = [
    defaultReflectance,
    defaultReflectance,
    defaultReflectance,
    defaultReflectance,
    defaultReflectance,
    defaultReflectance
]
const defaultCubeEmittance = [
    defaultEmittance,
    defaultEmittance,
    defaultEmittance,
    defaultEmittance,
    defaultEmittance,
    defaultEmittance
]
const cubeLightReflectance = [
    new Rad.Spectra(0,0,0),
    new Rad.Spectra(0,0,0),
    new Rad.Spectra(0,0,0),
    new Rad.Spectra(0,0,0),
    new Rad.Spectra(0,0,0),
    new Rad.Spectra(0,0,0),
]
const cubeLightEmittance = [
    new Rad.Spectra(1, 1, 1),
    new Rad.Spectra(1, 1, 1),
    new Rad.Spectra(1, 1, 1),
    new Rad.Spectra(1, 1, 1),
    new Rad.Spectra(1, 1, 1),
    new Rad.Spectra(1, 1, 1),
]

// Create a room with a light
export default async function createScene() {
  /*
        MATRIX TRANSFORMATION ORDER (SRT):
        1) Scale
        2) Rotate
        3) Translate
    */
  // Floor plane
  const floor = makePlane(defaultReflectance, defaultEmittance, 32);
  const floorxForm = new Transform3();
  floorxForm.scale(50, 50, 50);
  floorxForm.translate(-25, -25, 0);
  floorxForm.transform(floor);

  // Plane light facing down
  const light1 = makePlane(planeLightReflectance, planeLightEmittance);
  const l1x = new Transform3();
  l1x.scale(1, -1, 1);
  l1x.translate(0, 0, 5);
  l1x.rotate(45, 0, 0);
  l1x.transform(light1);

  const box1 = makeCube();
  const b1x = new Transform3();
  b1x.scale(20, 1, 10);
  b1x.translate(-10, 5, 0);
  b1x.transform(box1);
  setAliveTime(box1, [0, 0]);



  // Return environment with scene objects
  return new Rad.Environment([floor, light1, box1]);
}

function setAliveTime(subject, time) {
  for (const surface of subject.surfaces) {
    surface.aliveTime = time;
  }
}

function makePlane(reflectance = defaultReflectance, emittance = defaultEmittance, subDivs = [1, 1]) {
  // Return value will be plane object
  const retval = Plane.singleFace(reflectance, emittance, subDivs);

  return retval;
}

function makeCube(reflectance = defaultCubeReflectance, emittance = defaultCubeEmittance, subDivs = 1) {
  // Return value will be cube object
  const retval = Cube.unitCubeMultiSurface(subDivs);

  // Add reflectance and emittance values
  for (let i = 0; i < 6; i++) {
    retval.surfaces[i].reflectance.add(reflectance[i]);
    retval.surfaces[i].emittance.add(emittance[i]);
  }

  return retval;
}

function makeCylinder(sides, r1, r2, height, reflectance = null, emittance = null, subDivs) {
  // Return value will be cylinder object
  const retval = Cylinder.cylinder(sides, r1, r2, height, subDivs);

  // Set reflectance and emittance values
  for (let i = 0; i < retval.surfaces.length; i++) {
    if (reflectance) {
      retval.surfaces[i].reflectance.add(reflectance[i]);
    } else {
      retval.surfaces[i].reflectance.add(defaultReflectance);
    }
    if (emittance) {
      retval.surfaces[i].emittance.add(emittance[i]);
    } else {
      retval.surfaces[i].emittance.add(defaultEmittance);
    }
  }

  return retval;
}
