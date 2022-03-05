import { flightPath } from '../path.js';
import * as Rad from '../../radiosity/index.js';
import Transform3 from '../transform3.js';
import * as Cube from '../cube.js';
import * as Plane from '../singleface.js';
import * as Cylinder from '../cylinder.js';

const lightCubeEmittance = [
  new Rad.Spectra(255, 255, 255),
  new Rad.Spectra(255, 255, 255),
  new Rad.Spectra(255, 255, 255),
  new Rad.Spectra(255, 255, 255),
  new Rad.Spectra(255, 255, 255),
  new Rad.Spectra(255, 255, 255),
]

export default async function createScene() {
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

  const objects = [];

  // Testing light

  const light = makeLightCube([0, 0, 10], [1, 1, 1]);
  setActiveTime(light, [[0, 0], [5, 5], [40, 40], [45, 45], [200, 200], [205, 205], [240, 240], [245, 245]]);
  objects.push(light);

  // Floor

  objects.push(makeFloor());


  // Buildings?

  // Foliage?

  return new Rad.Environment(objects);
}


function makeFloor(size = [50, 50], subDivs = 64, reflectance, emittance) {
  reflectance = reflectance || new Rad.Spectra(1, 1, 1);
  emittance = emittance || new Rad.Spectra(0, 0, 0);

  const floor = Plane.singleFace(reflectance, emittance, subDivs);

  const transform = new Transform3();
  transform.translate(-0.5, -0.5, 1);
  transform.scale(size[0], size[1], 1);
  transform.transform(floor);

  return floor;
}

function makeLightCube(coords, size, emittance) {

  coords = coords || [0, 0, 0];
  size = size || [0.1, 0.1, 0.1];
  emittance = emittance || [
    new Rad.Spectra(50, 50, 50),
    new Rad.Spectra(50, 50, 50),
    new Rad.Spectra(50, 50, 50),
    new Rad.Spectra(50, 50, 50),
    new Rad.Spectra(50, 50, 50),
    new Rad.Spectra(50, 50, 50),
  ]
  const reflectance = new Rad.Spectra(0, 0, 0);


  const light = Cube.unitCubeMultiSurface(1);

  for (let i = 0; i < light.surfaces.length; i++) {
    light.surfaces[i].reflectance.add(reflectance);
    light.surfaces[i].emittance.add(emittance[i]);
    //light.surfaces[i].isLight = true;
  }


  const transform = new Transform3();
  // Centre cube on origin
  transform.translate(-0.5, -0.5, -0.5);

  transform.scale(size[0], size[1], size[2]);
  transform.translate(coords[0], coords[1], coords[2]);

  transform.transform(light);



  return light;
}

function setActiveTime(subject, time) {
  for (const surface of subject.surfaces) {
    surface.activeTime = time;
  }
}
