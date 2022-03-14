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
  const z = (Math.sin(3 * t) + Math.cos(t)) + 5;

  return [x, y, z];
}
