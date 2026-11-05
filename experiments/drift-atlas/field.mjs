/** DRIFT ATLAS A002: purely synthetic vector field; NOT for navigation. */
export const clamp = (v, min, max) => Math.max(min, Math.min(max, v));
export function flowAt(x, y, { time = 0, energy = .65, bearing = 0 } = {}) {
  const a = Math.sin(y * 10.8 + x * 2.7 + time * .12) * .31
    + Math.cos(y * 5.4 - x * 9.2 - time * .07) * .16;
  const b = Math.cos(x * 9.6 - y * 2.2 + time * .10) * .30
    - Math.sin(x * 5.1 + y * 7.4 + time * .05) * .17;
  const c = Math.cos(bearing), s = Math.sin(bearing);
  return { x: (a * c - b * s) * energy, y: (a * s + b * c) * energy };
}
export function integratePassage(start, end, options = {}) {
  const { steps = 90, scale = 120, boatSpeed = 7.4 } = options;
  if (!Number.isInteger(steps) || steps < 1 || steps > 2000) throw new RangeError('Invalid steps');
  if (!(boatSpeed > 0) || !(scale > 0)) throw new RangeError('Invalid scale or boat speed');
  for (const p of [start, end]) if (![p.x, p.y].every(Number.isFinite)) throw new TypeError('Non-finite waypoint');
  const dx = (end.x - start.x) / steps, dy = (end.y - start.y) / steps;
  let p = { ...start }; const points = [p];
  for (let i = 0; i < steps; i++) {
    const f = flowAt(p.x, p.y, options);
    p = { x: p.x + dx + f.x * .0048, y: p.y + dy + f.y * .0048 };
    points.push(p);
  }
  const distance = Math.hypot(end.x - start.x, end.y - start.y) * scale;
  return { points, distanceNm: distance, durationHours: distance / boatSpeed,
    driftNm: Math.hypot(p.x - end.x, p.y - end.y) * scale };
}
