import { clamp, round } from './math.js';

export const REFERENCE_CATALOG = {
  gli2022: { label: 'GLI 2022 Global', groups: ['Global'], age: [3, 95] },
  gli2012: { label: 'GLI 2012', groups: ['Caucásico', 'Afroamericano', 'Asia nororiental', 'Asia sudoriental', 'Otro/mixto'], age: [3, 95] },
  knudson: { label: 'Knudson', groups: ['Referencia original'], age: [18, 85] },
  gutierrez: { label: 'Gutiérrez (Chile)', groups: ['Población chilena'], age: [18, 80] }
};

// Motor educativo aislado. Los coeficientes deben reemplazarse por implementaciones
// oficiales y validadas antes de cualquier uso clínico.
export function predictReference({ age, height, sex, reference, group }) {
  const h = height / 100;
  const male = sex === 'M';
  let fvc = (male ? 5.35 : 4.45) * Math.pow(h / 1.72, 2.45) * (1 - 0.0032 * Math.max(0, age - 25));
  let ratio = clamp((male ? 0.82 : 0.84) - 0.00115 * Math.max(0, age - 20), 0.68, 0.88);
  let pef = (male ? 10.2 : 7.4) * Math.pow(h / 1.72, 1.85) * (1 - 0.0022 * Math.max(0, age - 30));
  const refFactor = { gli2022: 1, gli2012: 0.99, knudson: 1.035, gutierrez: 0.975 }[reference] ?? 1;
  const groupFactor = {
    Global: 1, Caucásico: 1, Afroamericano: 0.90, 'Asia nororiental': 0.94,
    'Asia sudoriental': 0.92, 'Otro/mixto': 0.96, 'Referencia original': 1,
    'Población chilena': 1
  }[group] ?? 1;
  fvc *= refFactor * groupFactor;
  pef *= Math.sqrt(refFactor * groupFactor);
  const fev1 = fvc * ratio;
  return {
    fvc: round(fvc), fev1: round(fev1), ratio: round(ratio, 3), pef: round(pef, 1),
    sd: { fvc: Math.max(0.34, fvc * 0.105), fev1: Math.max(0.30, fev1 * 0.105), ratio: 0.055, pef: Math.max(0.8, pef * 0.14) }
  };
}
