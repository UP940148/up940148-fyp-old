export function flightPath(t) {
  const x = Math.cos(t);
  const y = Math.sin(t);
  const z = Math.sin(t);

  return [x, y, z];
}
