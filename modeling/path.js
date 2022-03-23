export function flightPath(step) {
  /*
    Camera:
    camX = axisX
    camY = axisZ
    camZ = axisY

    Objects:
    objX = axisX
    objY = axisY
    objZ = axisZ
  */
  const speed = 2;
  const t = (step * 2 * Math.PI / 1000) * speed;
  const x = 20 * Math.cos(t);
  const y = 20 * Math.sin(t);
  const z = (Math.sin(3 * t) + 2 * Math.cos(t)) + 16;

  return [x, y, z];
}

// Derivatives
// dx/dt = -20sin(t)
// dy/dt = 20cos(t)
// dz/dt = 3cos(3t) - sin(t)
