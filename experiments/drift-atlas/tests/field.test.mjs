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
