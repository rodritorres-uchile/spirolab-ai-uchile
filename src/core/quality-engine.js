import { round } from './math.js';

export function evaluateFivc({ fvc, fivc }) {
  const difference = fivc - fvc;
  const limit = Math.max(0.10, fvc * 0.05);
  const acceptable = difference <= limit;
  return {
    difference: round(difference, 3), limit: round(limit, 3), acceptable,
    message: acceptable
      ? `CVIF compatible con una inspiración máxima (diferencia ${round(difference, 2)} L; límite ${round(limit, 2)} L).`
      : `CVIF excede la CVF más allá del límite (${round(difference, 2)} L > ${round(limit, 2)} L); revisar inicio desde inspiración máxima.`
  };
}
