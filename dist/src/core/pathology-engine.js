import { clamp, lerp, round } from './math.js';

export const DISEASES = {
  normal: { label: 'Normal', description: 'Mecánica y flujos conservados.' },
  asthma: { label: 'Asma', description: 'Aumento variable de resistencia y excavación pos-PEF.' },
  bronchitis: { label: 'Bronquitis crónica', description: 'Reducción difusa de flujos medios y terminales.' },
  emphysema: { label: 'EPOC enfisematoso', description: 'Pérdida de retroceso elástico, colapso dinámico y excavación profunda.' },
  bronchiectasis: { label: 'Bronquiectasias', description: 'Obstrucción heterogénea con excavación intermedia.' },
  fibrosis: { label: 'Fibrosis pulmonar', description: 'CVF baja, retroceso elevado y curva estrecha.' },
  obesity: { label: 'Obesidad', description: 'Reducción leve-moderada de volúmenes con relación conservada.' },
  neuromuscular: { label: 'Neuromuscular', description: 'Reducción proporcional de CVF y flujos por debilidad.' },
  mixed: { label: 'Mixto probable', description: 'Obstrucción con CVF reducida; requiere TLC para confirmación.' }
};

const profiles = {
  normal: { fvc: 1, fev1: 1, pef: 1, resistance: 25, small: 15, recoil: 55, scoop: 0.05 },
  asthma: { fvc: 0.96, fev1: 0.74, pef: 0.84, resistance: 72, small: 55, recoil: 55, scoop: 0.55 },
  bronchitis: { fvc: 0.92, fev1: 0.62, pef: 0.72, resistance: 78, small: 68, recoil: 48, scoop: 0.68 },
  emphysema: { fvc: 0.98, fev1: 0.43, pef: 0.62, resistance: 74, small: 88, recoil: 20, scoop: 0.95 },
  bronchiectasis: { fvc: 0.90, fev1: 0.60, pef: 0.70, resistance: 72, small: 74, recoil: 45, scoop: 0.72 },
  fibrosis: { fvc: 0.57, fev1: 0.62, pef: 0.90, resistance: 25, small: 18, recoil: 86, scoop: 0.02 },
  obesity: { fvc: 0.78, fev1: 0.80, pef: 0.86, resistance: 32, small: 22, recoil: 52, scoop: 0.06 },
  neuromuscular: { fvc: 0.55, fev1: 0.57, pef: 0.56, resistance: 25, small: 18, recoil: 48, scoop: 0.04 },
  mixed: { fvc: 0.60, fev1: 0.37, pef: 0.58, resistance: 74, small: 78, recoil: 40, scoop: 0.82 }
};

export function applyPathology(predicted, disease, severityIndex) {
  const target = profiles[disease] ?? profiles.normal;
  const severity = clamp(severityIndex / 4, 0, 1);
  const blend = (normalValue, targetValue) => lerp(normalValue, targetValue, severity);
  return {
    fvc: round(predicted.fvc * blend(1, target.fvc)),
    fev1: round(predicted.fev1 * blend(1, target.fev1)),
    pef: round(predicted.pef * blend(1, target.pef), 1),
    resistance: round(blend(25, target.resistance), 0),
    smallAirways: round(blend(15, target.small), 0),
    elasticRecoil: round(blend(55, target.recoil), 0),
    scoop: blend(0.05, target.scoop)
  };
}
