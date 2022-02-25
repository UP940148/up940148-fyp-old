export function flightPath(step) {
  const t = step * 2 * Math.PI / 1000;
  const x = 6 * Math.cos(t);
  const y = 6 * Math.sin(t);
  const z = Math.sin(3 * t) + Math.cos(t) + 5;

  return [x, y, z];
}
