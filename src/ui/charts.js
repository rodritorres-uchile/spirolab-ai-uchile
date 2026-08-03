const NS = 'http://www.w3.org/2000/svg';
const el = (name, attrs = {}) => {
  const node = document.createElementNS(NS, name);
  for (const [key, value] of Object.entries(attrs)) node.setAttribute(key, value);
  return node;
};
const pathData = (points, xScale, yScale, xKey, yKey) => points.map((p, i) => `${i ? 'L' : 'M'}${xScale(p[xKey]).toFixed(2)},${yScale(p[yKey]).toFixed(2)}`).join(' ');

export function drawFlowChart(svg, data, predicted, options = {}) {
  const width = 780, height = 420, margin = { left: 55, right: 20, top: 20, bottom: 45 };
  svg.setAttribute('viewBox', `0 0 ${width} ${height}`); svg.innerHTML = '';
  const maxVolume = Math.max(data.expiration.at(-1).volume, data.inspiration[0].volume, predicted?.fvc ?? 0) * 1.15;
  const maxFlow = Math.max(...data.expiration.map(p => p.flow), predicted?.pef ?? 0) * 1.25;
  const minFlow = -Math.max(...data.inspiration.map(p => Math.abs(p.flow))) * 1.25;
  const x = v => margin.left + (v / maxVolume) * (width - margin.left - margin.right);
  const y = f => margin.top + ((maxFlow - f) / (maxFlow - minFlow)) * (height - margin.top - margin.bottom);
  svg.append(el('rect', { x: 0, y: 0, width, height, class: 'chart-bg' }));
  for (let i = 0; i <= 6; i++) {
    const xv = maxVolume * i / 6; svg.append(el('line', { x1: x(xv), y1: margin.top, x2: x(xv), y2: height - margin.bottom, class: 'grid' }));
    const tx = el('text', { x: x(xv), y: height - 18, class: 'tick', 'text-anchor': 'middle' }); tx.textContent = xv.toFixed(1); svg.append(tx);
  }
  for (let i = 0; i <= 6; i++) {
    const fv = minFlow + (maxFlow - minFlow) * i / 6; svg.append(el('line', { x1: margin.left, y1: y(fv), x2: width - margin.right, y2: y(fv), class: 'grid' }));
  }
  svg.append(el('line', { x1: margin.left, y1: y(0), x2: width - margin.right, y2: y(0), class: 'axis' }));
  if (options.showPredicted && predicted) {
    const pred = Array.from({ length: 100 }, (_, i) => {
      const fraction = i / 99; return { volume: fraction * predicted.fvc, flow: predicted.pef * Math.pow(1 - fraction, 0.85) };
    });
    svg.append(el('path', { d: pathData(pred, x, y, 'volume', 'flow'), class: 'pred-line' }));
  }
  svg.append(el('path', { d: pathData(data.expiration, x, y, 'volume', 'flow'), class: 'main-line' }));
  svg.append(el('path', { d: pathData(data.inspiration, x, y, 'volume', 'flow'), class: 'main-line inspiration' }));
  if (options.showPoints) for (const p of data.expiration.filter((_, i) => i % 30 === 0)) svg.append(el('circle', { cx: x(p.volume), cy: y(p.flow), r: 3, class: 'point' }));
  const xLabel = el('text', { x: width / 2, y: height - 3, class: 'label', 'text-anchor': 'middle' }); xLabel.textContent = 'Volumen (L)'; svg.append(xLabel);
  const yLabel = el('text', { x: 15, y: height / 2, class: 'label', transform: `rotate(-90 15 ${height / 2})`, 'text-anchor': 'middle' }); yLabel.textContent = 'Flujo (L/s)'; svg.append(yLabel);
}

export function drawTimeChart(svg, points, fvc) {
  const width = 780, height = 300, margin = { left: 55, right: 20, top: 20, bottom: 45 };
  svg.setAttribute('viewBox', `0 0 ${width} ${height}`); svg.innerHTML = '';
  const maxTime = Math.max(6, Math.min(15, points.at(-1)?.time ?? 6));
  const x = t => margin.left + (t / maxTime) * (width - margin.left - margin.right);
  const y = v => margin.top + ((fvc * 1.15 - v) / (fvc * 1.15)) * (height - margin.top - margin.bottom);
  svg.append(el('rect', { x: 0, y: 0, width, height, class: 'chart-bg' }));
  for (let i = 0; i <= 6; i++) { const t = maxTime * i / 6; svg.append(el('line', { x1: x(t), y1: margin.top, x2: x(t), y2: height - margin.bottom, class: 'grid' })); }
  for (let i = 0; i <= 5; i++) { const v = fvc * 1.15 * i / 5; svg.append(el('line', { x1: margin.left, y1: y(v), x2: width - margin.right, y2: y(v), class: 'grid' })); }
  svg.append(el('path', { d: pathData(points, x, y, 'time', 'volume'), class: 'main-line' }));
  svg.append(el('line', { x1: x(1), y1: margin.top, x2: x(1), y2: height - margin.bottom, class: 'marker' }));
}
