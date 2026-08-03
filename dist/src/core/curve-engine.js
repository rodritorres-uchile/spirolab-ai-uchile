import { clamp, smoothstep } from './math.js';

function morphology({ disease, severity, resistance, smallAirways, elasticRecoil, scoop }) {
  const obstructive = ['asthma', 'bronchitis', 'emphysema', 'bronchiectasis', 'mixed'].includes(disease);
  if (!obstructive) return { scoop: Math.min(0.12, scoop), postPeakDrop: 0.02, tail: 0.03 };
  const resistanceDrive = clamp((resistance - 25) / 75, 0, 1);
  const smallDrive = clamp((smallAirways - 15) / 85, 0, 1);
  const recoilLoss = clamp((55 - elasticRecoil) / 55, 0, 1);
  const severityDrive = clamp(severity / 4, 0, 1);
  return {
    scoop: clamp(scoop + 0.18 * resistanceDrive + 0.28 * smallDrive + 0.34 * recoilLoss, 0, 1.35),
    postPeakDrop: clamp(0.08 + 0.18 * severityDrive + 0.12 * recoilLoss, 0, 0.55),
    tail: clamp(0.06 + 0.24 * smallDrive + 0.24 * recoilLoss, 0, 0.55)
  };
}

function expiratoryFlowAtFraction(x, pef, model) {
  if (x <= 0 || x >= 1) return 0;
  const peakX = 0.055;
  if (x <= peakX) return pef * smoothstep(x / peakX);
  const u = (x - peakX) / (1 - peakX);
  const { scoop, postPeakDrop, tail } = model;

  // Redondeo del PEF: hombro con derivada cero en el pico.
  const shoulder = 0.08;
  if (u < shoulder) {
    const t = u / shoulder;
    const endFlow = pef * (1 - postPeakDrop * 0.52);
    return pef + (endFlow - pef) * smoothstep(t);
  }

  const z = (u - shoulder) / (1 - shoulder);
  // Curva basal. El exponente alto produce descenso rápido y excavación.
  const exponent = 0.80 + 4.2 * scoop;
  let flow = pef * (1 - postPeakDrop) * Math.pow(Math.max(0, 1 - z), exponent);

  // Depresión adicional de la zona media (campana centrada en 55% de CVF).
  const middleBowl = Math.exp(-Math.pow((z - 0.54) / 0.23, 2));
  flow *= 1 - clamp(0.58 * scoop * middleBowl, 0, 0.82);

  // Cola terminal deprimida en enfisema/VA pequeña.
  const tailGate = smoothstep((z - 0.55) / 0.40);
  flow *= 1 - tail * tailGate;
  return Math.max(0, Math.min(pef, flow));
}

export function generateFlowVolume({ fvc, fivc, pef, disease, severity, resistance, smallAirways, elasticRecoil, scoop, points = 180 }) {
  const model = morphology({ disease, severity, resistance, smallAirways, elasticRecoil, scoop });
  const expiration = [];
  for (let i = 0; i <= points; i += 1) {
    const fraction = i / points;
    expiration.push({ volume: fraction * fvc, flow: expiratoryFlowAtFraction(fraction, pef, model) });
  }
  const inspiration = [];
  for (let i = 0; i <= points; i += 1) {
    const t = i / points;
    // La inspiración comienza donde termina la espiración (CVF, a la derecha)
    // y avanza de derecha a izquierda una distancia igual a la CVIF.
    // Si CVIF = CVF, termina en 0 L; si difiere, el extremo refleja esa diferencia.
    const volume = fvc - t * fivc;
    // Inspiración asimétrica y suave, no una parábola perfecta.
    const flow = -pef * 0.55 * Math.pow(Math.sin(Math.PI * t), 0.85) * (0.88 + 0.12 * t);
    inspiration.push({ volume, flow });
  }
  return { expiration, inspiration, morphology: model };
}

export function integrateVolumeTime(expiration, maxTime = 15) {
  const points = [{ time: 0, volume: 0 }];
  let time = 0;
  for (let i = 1; i < expiration.length; i += 1) {
    const dv = expiration[i].volume - expiration[i - 1].volume;
    const meanFlow = Math.max(0.035, (expiration[i].flow + expiration[i - 1].flow) / 2);
    time += dv / meanFlow;
    points.push({ time: Math.min(time, maxTime), volume: expiration[i].volume });
    if (time >= maxTime) break;
  }
  return points;
}

export function interpolateVolumeAtTime(points, targetTime) {
  if (targetTime <= 0) return 0;
  for (let i = 1; i < points.length; i += 1) {
    if (points[i].time >= targetTime) {
      const a = points[i - 1];
      const b = points[i];
      const t = (targetTime - a.time) / Math.max(1e-6, b.time - a.time);
      return a.volume + (b.volume - a.volume) * t;
    }
  }
  return points.at(-1)?.volume ?? 0;
}

export function flowsAtFractions(expiration, fvc) {
  const flowAt = (fraction) => {
    const target = fraction * fvc;
    let best = expiration[0];
    for (const point of expiration) if (Math.abs(point.volume - target) < Math.abs(best.volume - target)) best = point;
    return best.flow;
  };
  return { fef25: flowAt(0.25), fef50: flowAt(0.50), fef75: flowAt(0.75) };
}
