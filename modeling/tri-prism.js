
import * as Rad from '../radiosity/index.js';
import * as sub from './subdivision.js';

export function makePrism(reflectance, emittance, subdivide = 1, subPatches = false) {
  if (typeof subdivide === 'number') {
    // When looking at each face head on, [x, z]
    subdivide = [subdivide, subdivide]; // subdivision along the X,Z axes
  }

  // Angle should be 1/3 of a whole turn
  const angle = 2 * Math.PI / 3;

  const x1 = Math.cos(angle) / 2;
  const y1 = Math.sin(angle) / 2;
  const x2 = Math.cos(2 * angle) / 2;
  const y2 = Math.sin(2 * angle) / 2;

  const p = [
    new Rad.Point3(0.5, 0, 0),
    new Rad.Point3(x1, y1, 0),
    new Rad.Point3(x2, y2, 0),
    new Rad.Point3(0.5, 0, 1),
    new Rad.Point3(x1, y1, 1),
    new Rad.Point3(x2, y2, 1),
  ];

  const surfaces = [
    surfaceFromPoints([p[0], p[1], p[4], p[3]], subdivide, subPatches),
    surfaceFromPoints([p[1], p[2], p[5], p[4]], subdivide, subPatches),
    surfaceFromPoints([p[2], p[0], p[3], p[5]], subdivide, subPatches),
  ]

  return new Rad.Instance(surfaces);
}


function surfaceFromPoints(points, subdivide, subPatches) {
  // surfaces don't share vertices, need to create new vertices each time
  const vertices = points.map(p => new Rad.Vertex3(p));

  // the patch automatically gets its own default element
  const patches = [];

  if (subPatches) {
    // generate multiple patches for the face
    patches.push(...sub.quadPatches(vertices, subdivide));
  } else {
    // generate a single patch with subdivision in elements
    patches.push(new Rad.Patch3(vertices, sub.quadElements(vertices, subdivide)));
  }

  return new Rad.Surface3(null, null, patches);
}
