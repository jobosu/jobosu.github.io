import test from 'node:test';
import assert from 'node:assert/strict';
import { flowAt, integratePassage, clamp } from '../field.mjs';
const A = { x: .2, y: .7 }, B = { x: .78, y: .31 };
test('clamp bounds inputs', () => { assert.equal(clamp(-1, 0, 1), 0); assert.equal(clamp(2, 0, 1), 1); });
test('zero current yields exact intended endpoint', () => {
  const r = integratePassage(A, B, { energy: 0 });
  assert.equal(r.points.length, 91); assert.ok(r.driftNm < 1e-10);
});
test('field is finite and deterministic', () => {
  const f = flowAt(.5, .4, { time: 3, energy: .9, bearing: .2 });
  assert.deepEqual(f, flowAt(.5, .4, { time: 3, energy: .9, bearing: .2 }));
  assert.ok(Number.isFinite(f.x) && Number.isFinite(f.y));
});
test('bearing rotation changes flow and route', () => {
  const a = integratePassage(A, B, { bearing: 0 });
  const b = integratePassage(A, B, { bearing: Math.PI / 2 });
  assert.notEqual(a.driftNm, b.driftNm);
});
test('invalid parameters are rejected', () => {
  assert.throws(() => integratePassage(A, B, { steps: 0 }), RangeError);
  assert.throws(() => integratePassage(A, B, { boatSpeed: 0 }), RangeError);
  assert.throws(() => integratePassage({ x: NaN, y: 0 }, B), TypeError);
});

test('zero energy is invariant under time and rotation', () => {
  for (const time of [-100, 0, 100]) for (const bearing of [-Math.PI, 0, Math.PI]) {
    const f = flowAt(.32, .81, { energy: 0, time, bearing });
    assert.deepEqual(f, { x: 0, y: 0 });
  }
});
test('passage endpoints and duration use documented synthetic scale', () => {
  const r = integratePassage(A, B, { energy: 0, steps: 12, scale: 100, boatSpeed: 5 });
  assert.equal(r.points.length, 13);
  assert.deepEqual(r.points[0], A);
  assert.ok(Math.abs(r.points.at(-1).x - B.x) < 1e-12);
  assert.ok(Math.abs(r.points.at(-1).y - B.y) < 1e-12);
  assert.ok(Math.abs(r.durationHours * 5 - r.distanceNm) < 1e-10);
});
test('changing current strength changes drift while remaining finite', () => {
  const calm = integratePassage(A, B, { energy: 0 });
  const active = integratePassage(A, B, { energy: .85 });
  assert.ok(active.driftNm > calm.driftNm);
  assert.ok(active.points.every(p => Number.isFinite(p.x) && Number.isFinite(p.y)));
});
test('integration rejects unsafe step and scale inputs', () => {
  for (const steps of [-1, 0, 2001, 1.5]) assert.throws(() => integratePassage(A, B, { steps }), RangeError);
  for (const scale of [0, -1]) assert.throws(() => integratePassage(A, B, { scale }), RangeError);
});
