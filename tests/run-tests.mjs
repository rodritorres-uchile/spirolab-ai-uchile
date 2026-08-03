import assert from 'node:assert/strict';
import { generateFlowVolume, integrateVolumeTime, interpolateVolumeAtTime } from '../src/core/curve-engine.js';

const common = { fvc: 5.0, fivc: 5.2, pef: 9.0, severity: 4, resistance: 75, smallAirways: 85, elasticRecoil: 20, scoop: 0.9, predictedRatio: 0.79 };

const normal = generateFlowVolume({ ...common, disease: 'normal', severity: 0, resistance: 25, smallAirways: 15, elasticRecoil: 55, scoop: 0.05, fev1: 3.95 });
const emphysema = generateFlowVolume({ ...common, disease: 'emphysema', fev1: 1.9 });
const lowerFev1 = generateFlowVolume({ ...common, disease: 'normal', severity: 0, resistance: 25, smallAirways: 15, elasticRecoil: 55, scoop: 0.05, fev1: 2.0 });

const nearest = (curve, fraction) => curve.expiration.reduce((a,b)=>Math.abs(b.volume-common.fvc*fraction)<Math.abs(a.volume-common.fvc*fraction)?b:a).flow;

assert.equal(emphysema.inspiration[0].volume, common.fvc, 'CVIF debe comenzar en CVF (derecha)');
assert.ok(emphysema.inspiration.at(-1).volume < 0, 'CVIF mayor que CVF debe terminar a la izquierda del origen');
assert.ok(nearest(emphysema,0.50) < nearest(normal,0.50)*0.55, 'Enfisema debe excavar claramente la zona media');
assert.ok(nearest(lowerFev1,0.50) < nearest(normal,0.50)*0.72, 'Reducir VEF1/CVF debe aumentar excavación aun en edición manual');
assert.ok(Math.max(...emphysema.expiration.map(p=>p.flow)) <= common.pef + 1e-9, 'La curva no debe superar el PEF');
const generatedFev1 = interpolateVolumeAtTime(integrateVolumeTime(emphysema.expiration),1);
assert.ok(Number.isFinite(generatedFev1) && generatedFev1 > 0, 'VEF1 generado debe ser finito');
console.log('6 pruebas aprobadas');
