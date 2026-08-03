export const clamp = (value, min, max) => Math.min(max, Math.max(min, value));
export const round = (value, decimals = 2) => Number(value.toFixed(decimals));
export const smoothstep = (t) => {
  const x = clamp(t, 0, 1);
  return x * x * (3 - 2 * x);
};
export const lerp = (a, b, t) => a + (b - a) * t;
export const zScore = (measured, predicted, sd) => (measured - predicted) / sd;
