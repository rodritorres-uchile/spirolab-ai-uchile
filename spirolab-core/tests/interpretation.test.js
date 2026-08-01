import test from 'node:test';
import assert from 'node:assert/strict';
import { interpret } from '../src/interpretation.js';

test('clasifica obstrucción cuando el cociente está bajo LLN y CVF conservada', () => {
  const measured = { fvc: 4.0, fev1: 2.2, ratio: 0.55, pef: 6.0 };
  const pred = { lln: { fvc: 3.2, ratio: 0.68 } };
  const result = interpret(measured, pred);
  assert.match(result.title.toLowerCase(), /obstruct/);
});

test('clasifica mixto como probable', () => {
  const measured = { fvc: 2.4, fev1: 1.2, ratio: 0.50, pef: 4.0 };
  const pred = { lln: { fvc: 3.2, ratio: 0.68 } };
  const result = interpret(measured, pred);
  assert.match(result.title.toLowerCase(), /probable/);
});
