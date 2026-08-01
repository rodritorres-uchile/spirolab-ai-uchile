import test from 'node:test';
import assert from 'node:assert/strict';
import { solveCurve } from '../src/solver.js';

test('el solver genera una curva finita y monotónica en volumen', () => {
  const input = { fvc: 4.2, fev1: 3.2, pef: 9.0, pif: 6.0, fef25: 6.8, fef50: 4.3, fef75: 1.5 };
  const result = solveCurve(input);
  assert.ok(Number.isFinite(result.generatedFEV1));
  assert.ok(result.exp.length > 100);
  assert.equal(result.exp.at(-1).q, 0);
  for (let i = 1; i < result.exp.length; i++) assert.ok(result.exp[i].v >= result.exp[i - 1].v);
});

test('el VEF1 generado queda razonablemente cerca del objetivo', () => {
  const input = { fvc: 3.4, fev1: 1.8, pef: 6.0, pif: 5.0, fef25: 3.7, fef50: 1.8, fef75: 0.55 };
  const result = solveCurve(input);
  assert.ok(Math.abs(result.generatedFEV1 - input.fev1) < 0.35);
});
