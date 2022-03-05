
import * as Rad from '../../../radiosity/index.js';
import Transform3 from '../../transform3.js';
import * as Plane from '../../singleface.js';


export default async function createScene() {
  // Create directed light source
  const lightReflectance = new Rad.Spectra(5, 0, 0);
  const lightEmittance = new Rad.Spectra(100, 100, 100);

  const light = makePlane(lightReflectance, lightEmittance);
  setActiveTime(light, [0, 10]);
  makeLight(light);
  const l1x = new Transform3();
  l1x.translate(-0.5, -0.5, -0.5);
  l1x.rotate(0, -90, 0);
  l1x.transform(light);

  // Create both walls
  const wallReflectance = new Rad.Spectra(5, 5, 5);
  const wallEmittance = new Rad.Spectra(0, 0, 0);

  const wall1 = makePlane(wallReflectance, wallEmittance, 64);
  const w1x = new Transform3();
  w1x.translate(-0.5, -0.5, -0.5);
  w1x.scale(10, 10, 1);
  w1x.rotate(0, 90, 0);
  w1x.translate(-5, 0, 0);
  w1x.transform(wall1);

  const wall2 = makePlane(wallReflectance, wallEmittance, 64);
  const w2x = new Transform3();
  w2x.translate(-0.5, -0.5, -0.5);
  w2x.scale(10, 10, 1);
  w2x.rotate(0, -90, 0);
  w2x.translate(5, 0, 0);
  w2x.transform(wall2);

  return new Rad.Environment([light, wall1, wall2]);

}


function makePlane(reflectance, emittance, subDivs = [1, 1]) {
  // Return value will be plane object
  const retval = Plane.singleFace(reflectance, emittance, subDivs);

  return retval;
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
