
import * as Rad from '../../radiosity/index.js';
import Transform3 from '../transform3.js';
import * as Cube from '../cube.js';
import * as Plane from '../singleface.js';

// Create a room with a light
export default function createScene() {
  const room = makeRoom();
  const plane1 = makePlane();
  const light1 = makeLight();

  const l1x = new Transform3();
  l1x.translate(0,0,0);
  l1x.transform(light1);

  // Return environment with scene objects
  return new Rad.Environment([light1, plane1]);
}

function makeRoom(subdivision = 5) {
  // Default scale
  const x = 20;
  const y = 10;
  const z = 10;

  // Return value will be a cube object
  const retval = Cube.unitCubeMultiSurface(32, true);

  // Add reflectance values
  retval.surfaces[0].reflectance.add(new Rad.Spectra(0.9, 0.9, 0.9)); // Front
  retval.surfaces[1].reflectance.add(new Rad.Spectra(0.9, 0.9, 0.9)); // Back
  retval.surfaces[2].reflectance.add(new Rad.Spectra(0.9, 0.9, 0.9)); // Right
  retval.surfaces[3].reflectance.add(new Rad.Spectra(0.9, 0.9, 0.9)); // Left
  retval.surfaces[4].reflectance.add(new Rad.Spectra(0.9, 0.9, 0.9)); // Floor
  retval.surfaces[5].reflectance.add(new Rad.Spectra(0.9, 0.9, 0.9)); // Ceiling

  // Transform
  const xForm = new Transform3();
  xForm.scale(x, y, -z);
  xForm.translate(0, 0, z);
  xForm.transform(retval);

  return retval;
}

function makeLight(r = 255, g = 255, b = 255) {
  // Default scale
  const x = 0.5;
  const y = 0.5;
  const z = 0.5;

  // Lightness
  const L = 10;

  // Return value will be a cube object
  const retval = Cube.unitCubeMultiSurface(1);

  // Add reflectance values
  retval.surfaces[0].reflectance.add(new Rad.Spectra(0, 0, 1)); // front
  retval.surfaces[1].reflectance.add(new Rad.Spectra(0, 1, 0)); // back
  retval.surfaces[2].reflectance.add(new Rad.Spectra(0, 1, 1)); // right
  retval.surfaces[3].reflectance.add(new Rad.Spectra(1, 0, 0)); // left
  retval.surfaces[4].reflectance.add(new Rad.Spectra(1, 0, 1)); // top
  retval.surfaces[5].reflectance.add(new Rad.Spectra(1, 1, 0)); // bottom

  // Add emittance values
  retval.surfaces[0].emittance.add(new Rad.Spectra(0, 0, 100)); // front
  retval.surfaces[1].emittance.add(new Rad.Spectra(0, 100, 0)); // back
  retval.surfaces[2].emittance.add(new Rad.Spectra(0, 100, 100)); // right
  retval.surfaces[3].emittance.add(new Rad.Spectra(100, 0, 0)); // left
  retval.surfaces[4].emittance.add(new Rad.Spectra(100, 0, 100)); // top
  retval.surfaces[5].emittance.add(new Rad.Spectra(100, 100, 0)); // bottom

  // Transform
  const xForm = new Transform3();
  xForm.scale(x, y, z);
  xForm.translate(-x/2,-y/2,-z/2);
  xForm.transform(retval);

  return retval;
}

function makePlane() {
    const reflectance = new Rad.Spectra(1, 1, 1);
    const emittance = new Rad.Spectra(0,0,0);
    const retval = Plane.singleFace(reflectance, emittance);

    const xForm = new Transform3();
    xForm.scale(1.4, 1.4, 0);
    xForm.rotate(0, -90, 0);
    xForm.translate(1, -.7, -.7);
    xForm.transform(retval);
    return retval;
}
