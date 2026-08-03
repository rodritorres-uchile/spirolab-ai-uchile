import assert from 'node:assert/strict';
import { predictReference } from '../src/core/reference-engine.js';
import { applyPathology } from '../src/core/pathology-engine.js';
import { generateFlowVolume, integrateVolumeTime, interpolateVolumeAtTime } from '../src/core/curve-engine.js';
import { evaluateFivc } from '../src/core/quality-engine.js';

const pred = predictReference({ age: 45, height: 172, sex: 'M', reference: 'gli2022', group: 'Global' });
assert(pred.fvc > 4 && pred.fev1 > 3);
const emph = applyPathology(pred, 'emphysema', 4);
const normal = applyPathology(pred, 'normal', 0);
const normalCurve = generateFlowVolume({ ...normal, fivc: normal.fvc, disease: 'normal', severity: 0, points: 220 });
const emphCurve = generateFlowVolume({ ...emph, fivc: emph.fvc, disease: 'emphysema', severity: 4, points: 220 });
const flowAt = (curve, fraction) => curve.expiration.reduce((best,p)=>Math.abs(p.volume-fraction*curve.expiration.at(-1).volume)<Math.abs(best.volume-fraction*curve.expiration.at(-1).volume)?p:best).flow;
assert(flowAt(emphCurve,0.5) < flowAt(normalCurve,0.5)*0.35, 'El enfisema debe excavar el flujo medio');
assert(Math.max(...emphCurve.expiration.map(p=>p.flow)) <= emph.pef + 1e-6, 'La curva no debe sobrepasar PEF');
const time = integrateVolumeTime(emphCurve.expiration);
assert(interpolateVolumeAtTime(time,1) > 0);
assert(evaluateFivc({fvc:4,fivc:4.1}).acceptable);
assert(Math.abs(normalCurve.inspiration[0].volume - normal.fvc) < 1e-9, 'La inspiración debe comenzar al final de la espiración (CVF)');
assert(Math.abs(normalCurve.inspiration.at(-1).volume - (normal.fvc - normal.fvc)) < 1e-9, 'Con CVIF=CVF la inspiración debe terminar en 0 L');
const unequalFivc = generateFlowVolume({ ...normal, fivc: normal.fvc + 0.12, disease: 'normal', severity: 0, points: 220 });
assert(Math.abs(unequalFivc.inspiration[0].volume - normal.fvc) < 1e-9, 'La CVIF siempre debe partir desde el extremo derecho de la CVF');
assert(unequalFivc.inspiration.at(-1).volume < 0, 'Si CVIF>CVF el extremo inspiratorio debe quedar a la izquierda del origen');

console.log('✓ 10 comprobaciones aprobadas');
