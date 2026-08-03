import { clamp, smoothstep } from './math.js';

const OBSTRUCTIVE_DISEASES = new Set(['asthma', 'bronchitis', 'emphysema', 'bronchiectasis', 'mixed']);

/**
 * CurveEngine 4-regions
 * 1) Ascenso explosivo al PEF
 * 2) Caída pos-PEF
 * 3) Zona media excavada
 * 4) Cola terminal
 *
 * La morfología depende del perfil fisiopatológico Y del cociente VEF1/CVF.
 * El solver solo modifica el flujo temprano y no puede enderezar la zona media/terminal.
 */
function morphology({ disease, severity, resistance, smallAirways, elasticRecoil, scoop, fev1, fvc, predictedRatio = 0.80 }) {
  const measuredRatio = fvc > 0 ? fev1 / fvc : predictedRatio;
  const ratioDeficit = clamp((predictedRatio - measuredRatio) / 0.36, 0, 1);
  const diseaseObstructive = OBSTRUCTIVE_DISEASES.has(disease);
  const severityDrive = clamp(severity / 4, 0, 1);
  const resistanceDrive = clamp((resistance - 25) / 75, 0, 1);
  const smallDrive = clamp((smallAirways - 15) / 85, 0, 1);
  const recoilLoss = clamp((55 - elasticRecoil) / 55, 0, 1);

  const catalog = {
    normal:        { exponent: 0.82, postPeakDrop: 0.02, middleDepression: 0.02, terminalCompression: 0.02 },
    asthma:        { exponent: 2.15, postPeakDrop: 0.16, middleDepression: 0.28, terminalCompression: 0.10 },
    bronchitis:    { exponent: 2.70, postPeakDrop: 0.23, middleDepression: 0.36, terminalCompression: 0.16 },
    emphysema:     { exponent: 4.55, postPeakDrop: 0.38, middleDepression: 0.58, terminalCompression: 0.30 },
    bronchiectasis:{ exponent: 2.95, postPeakDrop: 0.25, middleDepression: 0.42, terminalCompression: 0.18 },
    mixed:         { exponent: 3.35, postPeakDrop: 0.30, middleDepression: 0.48, terminalCompression: 0.22 },
    fibrosis:      { exponent: 0.68, postPeakDrop: 0.00, middleDepression: 0.00, terminalCompression: 0.00 },
    obesity:       { exponent: 0.84, postPeakDrop: 0.02, middleDepression: 0.02, terminalCompression: 0.01 },
    neuromuscular: { exponent: 0.88, postPeakDrop: 0.02, middleDepression: 0.02, terminalCompression: 0.01 }
  };

  const normal = catalog.normal;
  const target = catalog[disease] ?? normal;
  const diseaseMix = diseaseObstructive ? severityDrive : severityDrive;
  const blend = (a, b) => a + (b - a) * diseaseMix;

  let exponent = blend(normal.exponent, target.exponent);
  let postPeakDrop = blend(normal.postPeakDrop, target.postPeakDrop);
  let middleDepression = blend(normal.middleDepression, target.middleDepression);
  let terminalCompression = blend(normal.terminalCompression, target.terminalCompression);

  // Un VEF1/CVF reducido debe generar excavación incluso al modificar manualmente el VEF1.
  // Este impulso es independiente del diagnóstico seleccionado.
  const obstructionDrive = Math.max(diseaseObstructive ? severityDrive : 0, ratioDeficit);
  exponent += 2.75 * ratioDeficit + 0.40 * resistanceDrive + 0.75 * smallDrive + 0.95 * recoilLoss;
  postPeakDrop = clamp(postPeakDrop + 0.24 * ratioDeficit + 0.07 * resistanceDrive + 0.09 * recoilLoss, 0, 0.64);
  middleDepression = clamp(middleDepression + 0.48 * ratioDeficit + 0.10 * resistanceDrive + 0.20 * smallDrive + 0.12 * recoilLoss, 0, 0.82);
  terminalCompression = clamp(terminalCompression + 0.24 * ratioDeficit + 0.10 * smallDrive + 0.15 * recoilLoss, 0, 0.58);

  // El parámetro histórico scoop queda como ajuste fino, no como control principal.
  middleDepression = clamp(middleDepression + 0.18 * clamp(scoop, 0, 1), 0, 0.84);

  return {
    exponent: clamp(exponent, 0.55, 6.8),
    postPeakDrop,
    middleDepression,
    terminalCompression,
    scoop: clamp(middleDepression + 0.15 * (exponent - 1), 0, 1.6),
    ratioDeficit,
    obstructionDrive
  };
}

function buildSmoothExpiratorySpline(pef, model) {
  // Puntos morfológicos de una única spline C1. La curva ya no cambia de
  // función por regiones, por lo que desaparecen codos y muescas.
  const peakX = 0.055;
  const obstruction = clamp(model.obstructionDrive + 0.45 * model.ratioDeficit, 0, 1.45);

  const shoulder = pef * clamp(0.94 - 0.24 * model.postPeakDrop - 0.08 * obstruction, 0.55, 0.96);
  const f25 = pef * clamp(0.72 - 0.38 * model.middleDepression - 0.10 * obstruction, 0.18, 0.78);
  const f50 = pef * clamp(0.48 - 0.50 * model.middleDepression - 0.18 * obstruction, 0.035, 0.58);
  const f75 = pef * clamp(0.24 - 0.42 * model.terminalCompression - 0.14 * obstruction, 0.008, 0.34);
  const f90 = pef * clamp(0.075 - 0.10 * model.terminalCompression - 0.045 * obstruction, 0.002, 0.10);

  const xs = [0, peakX, 0.12, 0.25, 0.50, 0.75, 0.90, 1.0];
  const ys = [0, pef, shoulder, f25, f50, f75, f90, 0];

  // Fritsch-Carlson / PCHIP: interpolación cúbica monotónica con continuidad
  // de primera derivada. Conserva el PEF y evita sobreoscilaciones.
  const n = xs.length;
  const h = new Array(n - 1);
  const delta = new Array(n - 1);
  for (let i = 0; i < n - 1; i += 1) {
    h[i] = xs[i + 1] - xs[i];
    delta[i] = (ys[i + 1] - ys[i]) / h[i];
  }
  const m = new Array(n).fill(0);
  m[0] = delta[0];
  m[n - 1] = delta[n - 2];
  for (let i = 1; i < n - 1; i += 1) {
    if (delta[i - 1] === 0 || delta[i] === 0 || Math.sign(delta[i - 1]) !== Math.sign(delta[i])) {
      m[i] = 0;
    } else {
      const w1 = 2 * h[i] + h[i - 1];
      const w2 = h[i] + 2 * h[i - 1];
      m[i] = (w1 + w2) / (w1 / delta[i - 1] + w2 / delta[i]);
    }
  }
  // El PEF debe ser redondeado: pendiente nula exactamente en el máximo.
  m[1] = 0;

  return (x) => {
    if (x <= 0 || x >= 1) return 0;
    let i = n - 2;
    for (let j = 0; j < n - 1; j += 1) {
      if (x >= xs[j] && x <= xs[j + 1]) { i = j; break; }
    }
    const t = (x - xs[i]) / h[i];
    const t2 = t * t;
    const t3 = t2 * t;
    const h00 = 2 * t3 - 3 * t2 + 1;
    const h10 = t3 - 2 * t2 + t;
    const h01 = -2 * t3 + 3 * t2;
    const h11 = t3 - t2;
    const y = h00 * ys[i] + h10 * h[i] * m[i] + h01 * ys[i + 1] + h11 * h[i] * m[i + 1];
    return Math.max(0, Math.min(pef, y));
  };
}

function expiratoryFlowAtFraction(x, pef, model) {
  return buildSmoothExpiratorySpline(pef, model)(x);
}

export function generateFlowVolume({ fvc, fev1, fivc, pef, disease, severity, resistance, smallAirways, elasticRecoil, scoop, predictedRatio = 0.80, points = 220 }) {
  const model = morphology({ disease, severity, resistance, smallAirways, elasticRecoil, scoop, fev1, fvc, predictedRatio });

  const baseSpline = buildSmoothExpiratorySpline(pef, model);
  const buildExpiration = (earlyScale = 1) => {
    const expiration = [];
    for (let i = 0; i <= points; i += 1) {
      const fraction = i / points;
      let flow = baseSpline(fraction);

      // El solver actúa únicamente en la descarga temprana (hasta ~30% CVF).
      // La excavación media y la cola terminal permanecen bloqueadas.
      const earlyWindow = 1 - smoothstep(clamp((fraction - 0.07) / 0.25, 0, 1));
      const factor = clamp(1 + (earlyScale - 1) * earlyWindow, 0.30, 2.60);
      flow *= factor;

      expiration.push({ volume: fraction * fvc, flow: Math.max(0, Math.min(pef, flow)) });
    }
    return expiration;
  };

  let expiration = buildExpiration(1);
  if (Number.isFinite(fev1) && fev1 > 0) {
    let lo = 0.30;
    let hi = 2.50;
    for (let k = 0; k < 30; k += 1) {
      const mid = (lo + hi) / 2;
      const candidate = buildExpiration(mid);
      const generated = interpolateVolumeAtTime(integrateVolumeTime(candidate), 1);
      if (generated < fev1) lo = mid;
      else hi = mid;
      expiration = candidate;
    }
  }

  // CVIF: inicia exactamente en el final espiratorio (CVF, derecha) y avanza hacia la izquierda.
  const inspiration = [];
  for (let i = 0; i <= points; i += 1) {
    const t = i / points;
    const volume = fvc - t * fivc;
    const flow = -pef * 0.55 * Math.pow(Math.sin(Math.PI * t), 0.85) * (0.88 + 0.12 * t);
    inspiration.push({ volume, flow });
  }

  return { expiration, inspiration, morphology: model };
}

export function integrateVolumeTime(expiration, maxTime = 15) {
  const result = [{ time: 0, volume: 0 }];
  let time = 0;
  for (let i = 1; i < expiration.length; i += 1) {
    const dv = expiration[i].volume - expiration[i - 1].volume;
    const meanFlow = Math.max(0.035, (expiration[i].flow + expiration[i - 1].flow) / 2);
    time += dv / meanFlow;
    result.push({ time: Math.min(time, maxTime), volume: expiration[i].volume });
    if (time >= maxTime) break;
  }
  return result;
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
    for (const point of expiration) {
      if (Math.abs(point.volume - target) < Math.abs(best.volume - target)) best = point;
    }
    return best.flow;
  };
  return { fef25: flowAt(0.25), fef50: flowAt(0.50), fef75: flowAt(0.75) };
}
