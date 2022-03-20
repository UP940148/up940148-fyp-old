export function toJSON(tree = [], leaves = [], scale) {
  const retval = {
    branches: [],
    leaves: [],
  };

  // for every node in a tree, generate a "branch" between the previous node and this one
  for (const node of tree) {
    if (node.prev != null) {
      retval.branches.push(jsonBranch(node.prev, node, node.thickness));
    }
  }

  // generate leaves
  for (const leaf of leaves) {
    retval.leaves.push(jsonLeaf(leaf, scale));
  }

  return JSON.stringify(retval);
}


function jsonLeaf(p, scale) {
  if (p.prev == null) return '';

  const v = p.minus(p.prev);
  const a = Math.atan2(v.y, v.x) / Math.PI * 180;

  const translate = JSON.parse(p.toScad());

  return {
    translation: {
      x: translate[0],
      y: translate[1],
      z: translate[2],
    },
    rotation: {
      x: 0,
      y: 50,
      z: a,
    },
    scale: scale,
  };
}

function jsonBranch(p1, p2, w = 1) {
  // Calculate branch length
  const xDist = p2.x - p1.x;
  const yDist = p2.y - p1.y;
  const zDist = p2.z - p1.z;

  // Pythagoras to get actual length
  const L = Math.sqrt(xDist ** 2 + yDist ** 2 + zDist ** 2);

  // Calculate branch rotation
  // const rotation = {
  //   x: Math.atan2(zDist, -yDist) * 180 / Math.PI,
  //   y: Math.atan2(zDist, xDist) * 180 / Math.PI,
  //   z: Math.atan2(yDist, xDist) * 180 / Math.PI,
  // };

  // Use dot product to calculate angle
  // Unit vector along +ve z = (0, 0, 1)
  // So dot product only cares about z angle
  // p2.Uz = zDist

  // Divide dot product by magnitude of both vectors

  const xRotation = Math.acos(zDist / L) * 180 / Math.PI;

  const rotation = {
    x: xRotation,
    z: Math.atan2(yDist, xDist) * 180 / Math.PI,
  };


  // Origin position
  const position = {
    x: p1.x,
    y: p1.y,
    z: p1.z,
  };

  return {
    rotation: rotation,
    start: position,
    length: L,
    width: w,
  };
}
