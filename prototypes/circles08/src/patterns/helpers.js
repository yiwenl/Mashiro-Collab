export const tileSize = 64;
export const pixelRatio = 2;

export function createCanvas(width, height) {
  const canvas = document.createElement("canvas");
  canvas.width = Math.max(1, Math.round(width));
  canvas.height = Math.max(1, Math.round(height));
  return { canvas, ctx: canvas.getContext("2d") };
}

export function random(rng, min = 1, max) {
  if (max === undefined) { max = min; min = 0; }
  return min + rng() * (max - min);
}

export const randomInt = (rng, min, max) => Math.floor(random(rng, min, max));

export function seededPatternRandom(seed) {
  let value = 2166136261;
  for (const char of seed) value = Math.imul(value ^ char.charCodeAt(0), 16777619);
  return () => {
    value = (Math.imul(value, 1664525) + 1013904223) | 0;
    return (value >>> 0) / 2 ** 32;
  };
}
