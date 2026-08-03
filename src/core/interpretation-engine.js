import { zScore, round } from './math.js';

export function interpret({ measured, predicted }) {
  const z = {
    fvc: zScore(measured.fvc, predicted.fvc, predicted.sd.fvc),
    fev1: zScore(measured.fev1, predicted.fev1, predicted.sd.fev1),
    ratio: zScore(measured.fev1 / measured.fvc, predicted.ratio, predicted.sd.ratio),
    pef: zScore(measured.pef, predicted.pef, predicted.sd.pef)
  };
  const obstruction = z.ratio < -1.645;
  const lowFvc = z.fvc < -1.645;
  let title = 'Dentro de límites de referencia';
  let explanation = 'No se identifican alteraciones ventilatorias con las variables simuladas.';
  if (obstruction && lowFvc) {
    title = 'Patrón mixto probable';
    explanation = 'VEF₁/CVF y CVF están bajo el LLN. Debe medirse TLC para distinguir patrón mixto de obstrucción con atrapamiento aéreo.';
  } else if (obstruction) {
    title = 'Patrón obstructivo';
    explanation = 'La relación VEF₁/CVF está por debajo del límite inferior de la normalidad.';
  } else if (lowFvc) {
    title = 'Restricción probable';
    explanation = 'CVF reducida con VEF₁/CVF conservada. La restricción requiere confirmación mediante TLC.';
  }
  const severity = z.fev1 >= -1.645 ? 'Sin reducción' : z.fev1 >= -2.5 ? 'Leve' : z.fev1 >= -4 ? 'Moderada' : 'Severa';
  return { title, explanation, severity, z: Object.fromEntries(Object.entries(z).map(([k, v]) => [k, round(v, 2)])) };
}
