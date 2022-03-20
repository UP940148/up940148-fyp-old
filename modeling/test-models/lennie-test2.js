
import { loadSTL } from '../stl-loader.js';
import { flightPath } from '../path.js';
import * as Rad from '../../radiosity/index.js';
import Transform3 from '../transform3.js';
import * as Cube from '../cube.js';
import * as Plane from '../singleface.js';
import * as Cylinder from '../cylinder.js';
import * as TreeLoader from '../json-tree-loader.js';

const defaultReflectance = new Rad.Spectra(0.5, 0.5, 0.5);
const defaultEmittance = new Rad.Spectra(0, 0, 0);
const planeLightReflectance = new Rad.Spectra(0, 0, 0);
const planeLightEmittance = new Rad.Spectra(100, 100, 100);
const floorReflectance = new Rad.Spectra(0.0001, 0.0001, 0.0001);

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
  new Rad.Spectra(0, 0, 0),
  new Rad.Spectra(0, 0, 0),
  new Rad.Spectra(0, 0, 0),
  new Rad.Spectra(0, 0, 0),
  new Rad.Spectra(0, 0, 0),
  new Rad.Spectra(0, 0, 0),
]
const cubeLightEmittance = [
  new Rad.Spectra(255, 255, 255),
  new Rad.Spectra(255, 255, 255),
  new Rad.Spectra(255, 255, 255),
  new Rad.Spectra(255, 255, 255),
  new Rad.Spectra(255, 255, 255),
  new Rad.Spectra(255, 255, 255),
]

// Create a room with a light
export default async function createScene() {
  // const tree1 = await TreeLoader.load('../modeling/trees/tree.json');
  // const treexForm = new Transform3();
  // treexForm.scale(0.2, 0.2, 0.2);
  // treexForm.translate(0, 22, 0);
  // treexForm.transform(tree1);

  /*
    Co-ordinates in relation to environment:
    this.x = env.x
    this.y = env.y
    this.z = env.z


        MATRIX TRANSFORMATION ORDER (SRT):
        1) Scale
        2) Rotate
        3) Translate
  */
  // Floor plane
  const floor = makePlane(floorReflectance, defaultEmittance, 32);
  const floorxForm = new Transform3();
  floorxForm.translate(-0.5, -0.5, 0);
  floorxForm.scale(100, 100, 1);
  floorxForm.transform(floor);

  const box1 = makeCube(); // defaultCubeReflectance, customEmit);
  const b1x = new Transform3();
  b1x.translate(-0.5, -0.5, 0);
  b1x.scale(2, 2, 2);
  b1x.transform(box1);

  const objects = [floor];

  for (let i = 0; i < 3; i++) {
    const obj1 = await TreeLoader.load('../modeling/trees/tree.json');
    const obj2 = await TreeLoader.load('../modeling/trees/tree.json');
    const [x, y, z] = flightPath(1000 / 3 * i);
    const tx1 = new Transform3();
    const tx2 = new Transform3();

    tx1.scale(0.15, 0.15, 0.2);
    tx2.scale(0.2, 0.2, 0.25);

    tx1.translate(3 * x / 4, 3 * y / 4, 0);
    tx2.translate(5 * x / 4, 5 * y / 4, 0);

    tx1.transform(obj1);
    tx2.transform(obj2);

    objects.push(obj1);
    objects.push(obj2);
  }

  // Create circle of lights
  const numLights = 10;
  const timeDiff = 1000 / numLights;
  for (let i = 0; i < numLights; i++) {
    const obj = makeCube(cubeLightReflectance, cubeLightEmittance);
    const transform = new Transform3();
    // Center on 0, 0
    transform.translate(-0.5, -0.5, -0.5);
    transform.scale(0.2, 0.2, 0.2);
    // const rotateZ = i * (360 / numLights); // Set position around unit circle
    const [x, y, z] = flightPath(i * timeDiff);
    // transform.rotate(45, 0, rotateZ);
    // transform.translate(0, 0, 5);
    transform.translate(x, y, z);
    transform.transform(obj);
    // Set each light to be alive in sequence
    makeLight(obj);
    const firstPulse = i * timeDiff;
    setActiveTime(obj, [[firstPulse, firstPulse + 9], [firstPulse + 15, firstPulse + 24]]);
    objects.push(obj);
  }




  // Return environment with scene objects
  return new Rad.Environment(objects);
}

function setActiveTime(subject, time) {
  for (const surface of subject.surfaces) {
    surface.activeTime = time;
  }
}

function makeLight(subject) {
  for (const surface of subject.surfaces) {
    surface.isLight = true;
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
