import { flightPath } from '../../path.js';
import * as Rad from '../../../radiosity/index.js';
import Transform3 from '../../transform3.js';
import * as Cube from '../../cube.js';

const defaultReflectance = new Rad.Spectra(1, 1, 1);
const defaultEmittance = new Rad.Spectra(1, 1, 1);
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

export default async function createScene() {

  const objects = [];
  for (let i = 0; i < 50; i++) {
    const obj = makeCube();
    const xForm = new Transform3();
    xForm.translate(-0.5, -0.5, -0.5);
    xForm.scale(0.1, 0.1, 0.1);
    const [x, y, z] = flightPath(i*40);
    xForm.translate(x, y, z);
    xForm.transform(obj);
    setActiveTime(obj, [0, 1000]);
    objects.push(obj);
  }

  return new Rad.Environment(objects);
}
function setActiveTime(subject, time) {
  for (const surface of subject.surfaces) {
    surface.activeTime = time;
  }
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
